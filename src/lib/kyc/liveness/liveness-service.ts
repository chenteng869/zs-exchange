/**
 * 活体检测多厂商业务服务（LivenessService）
 *
 * 职责：
 *  1. 维护厂商优先级列表（主备 / 多厂商）
 *  2. 自动主备切换（厂商 A 失败 → 自动降级到厂商 B）
 *  3. 多种聚合策略：
 *     - first_success：第一个成功就用
 *     - majority：多厂商投票（≥ 2 个一致）
 *     - all：全部厂商跑，结果聚合
 *  4. 统计（calls / success / failure / avgLatency）
 *  5. 事件订阅（onVerification）
 *
 * 厂商适配器通过本服务统一调用，业务层只关心 LivenessRequest / LivenessResult
 *
 * @module lib/kyc/liveness/liveness-service
 */

import { KycError } from '@/lib/auth/errors';
import { BaiduLivenessClient } from './baidu-client';
import { MegviiLivenessClient } from './megvii-client';
import { TencentLivenessClient } from './tencent-client';
import {
  LIVENESS_DEFAULT_PROVIDER_PRIORITY,
  type LivenessProvider,
  type LivenessRequest,
  type LivenessResult,
  type LivenessStats,
  type RiskLevel,
  type VerifyStrategy,
} from './types';

// ============================================================================
// 适配器接口（所有厂商客户端必须实现）
// ============================================================================

export interface LivenessAdapter {
  readonly providerName: LivenessProvider;
  verifyWithVideo(opts: LivenessRequest): Promise<LivenessResult>;
  verifyWithImage(opts: LivenessRequest): Promise<LivenessResult>;
  isMock(): boolean;
}

const adaptAliCloud = (client: any): LivenessAdapter | null => {
  if (!client) return null;
  return {
    providerName: 'ALICLOUD',
    verifyWithVideo: async (opts: LivenessRequest) => {
      const url = opts.videoUrl || opts.videoBase64 || '';
      const r = await client.verifyWithVideo(url, opts.idCardNumber || '', opts.name || '');
      return toUnified('ALICLOUD', r, opts);
    },
    verifyWithImage: async (opts: LivenessRequest) => {
      const url = opts.imageUrl || opts.imageBase64 || '';
      const r = await client.verifyWithPhoto(url, opts.idCardNumber || '', opts.name || '');
      return toUnified('ALICLOUD', r, opts);
    },
    isMock: () => client.isMock?.() || false,
  };
};

const toUnified = (
  provider: LivenessProvider,
  r: any,
  _opts: LivenessRequest,
): LivenessResult => {
  return {
    provider,
    passed: !!r.passed,
    confidence: r.confidence ?? 0,
    similarity: r.similarity ?? 0,
    livenessScore: r.livenessScore ?? 0,
    riskLevel: r.riskLevel || 'high',
    reason: r.reason,
    details: {},
    rawResponse: r.rawResponse,
    latencyMs: 0,
  };
};

// ============================================================================
// 服务配置
// ============================================================================

export interface LivenessServiceOptions {
  /** 阿里云适配器（来自 J-01 的 AliCloudFaceVerification） */
  aliCloud?: any;
  baidu?: BaiduLivenessClient;
  tencent?: TencentLivenessClient;
  megvii?: MegviiLivenessClient;
  /** 厂商优先级（数字小 = 优先），缺省使用 LIVENESS_DEFAULT_PROVIDER_PRIORITY */
  priority?: LivenessProvider[];
  /** 聚合策略 */
  strategy?: VerifyStrategy;
  /** 单次 verify 整体超时（毫秒），默认 5s */
  overallTimeoutMs?: number;
}

type Handler = (result: LivenessResult) => void;

// ============================================================================
// 服务实现
// ============================================================================

/**
 * 活体检测业务服务（多厂商）
 *
 * 使用示例：
 * ```ts
 * const service = new LivenessService({
 *   aliCloud: new AliCloudFaceVerification({ appCode: process.env.ALIYUN_FACE_APPCODE! }),
 *   baidu: new BaiduLivenessClient({ apiKey: '...', secretKey: '...' }),
 *   tencent: new TencentLivenessClient({ secretId: '...', secretKey: '...' }),
 *   megvii: new MegviiLivenessClient({ apiKey: '...', apiSecret: '...' }),
 *   strategy: 'first_success',
 * });
 *
 * const result = await service.verify({
 *   userId: 'u1',
 *   type: 'video',
 *   videoUrl: 'https://oss.example.com/liveness.mp4',
 *   idCardNumber: '110101199003073116',
 *   name: '张三',
 * });
 * ```
 */
export class LivenessService {
  private readonly adapters: Map<LivenessProvider, LivenessAdapter>;
  private priority: LivenessProvider[];
  private strategy: VerifyStrategy;
  private readonly overallTimeoutMs: number;
  private readonly stats: LivenessStats;
  private readonly handlers: Set<Handler> = new Set();

  constructor(options: LivenessServiceOptions = {}) {
    this.adapters = new Map();
    if (options.aliCloud) {
      const a = adaptAliCloud(options.aliCloud);
      if (a) this.adapters.set('ALICLOUD', a);
    }
    if (options.baidu) {
      this.adapters.set('BAIDU', options.baidu as unknown as LivenessAdapter);
    }
    if (options.tencent) {
      this.adapters.set('TENCENT', options.tencent as unknown as LivenessAdapter);
    }
    if (options.megvii) {
      this.adapters.set('MEGVII', options.megvii as unknown as LivenessAdapter);
    }

    this.priority = (options.priority || LIVENESS_DEFAULT_PROVIDER_PRIORITY).filter(
      (p) => this.adapters.has(p),
    );
    this.strategy = options.strategy || 'first_success';
    this.overallTimeoutMs = options.overallTimeoutMs ?? 5_000;

    this.stats = this._newStats();

    if (this.adapters.size === 0) {
      throw new KycError(
        'KYC_LIVENESS_NO_PROVIDER',
        'LivenessService requires at least one provider',
      );
    }
  }

  // --------------------------------------------------------------------------
  // 公共 API
  // --------------------------------------------------------------------------

  /**
   * 验证（按优先级自动切换 / 聚合）
   */
  public async verify(
    opts: LivenessRequest,
    preferredProviders?: LivenessProvider[],
  ): Promise<LivenessResult> {
    if (!opts || !opts.userId) {
      throw new KycError('KYC_LIVENESS_INPUT', 'userId is required');
    }
    const order = (preferredProviders || this.priority).filter((p) =>
      this.adapters.has(p),
    );
    if (order.length === 0) {
      throw new KycError('KYC_LIVENESS_NO_PROVIDER', 'No available provider');
    }

    if (this.strategy === 'first_success') {
      return this._verifyFirstSuccess(opts, order);
    }
    if (this.strategy === 'all' || this.strategy === 'majority') {
      return this._verifyAggregate(opts, order, this.strategy);
    }
    return this._verifyFirstSuccess(opts, order);
  }

  /**
   * 添加厂商（动态注册）
   */
  public addProvider(
    provider: LivenessProvider,
    priority: number,
    adapter?: LivenessAdapter,
  ): void {
    if (adapter) {
      this.adapters.set(provider, adapter);
    }
    if (!this.adapters.has(provider)) {
      throw new KycError(
        'KYC_LIVENESS_NO_ADAPTER',
        `Provider ${provider} adapter not registered`,
      );
    }
    // 插入到指定优先级位置
    const idx = Math.max(0, Math.min(priority, this.priority.length));
    this.priority = this.priority.filter((p) => p !== provider);
    this.priority.splice(idx, 0, provider);
  }

  /**
   * 移除厂商
   */
  public removeProvider(provider: LivenessProvider): void {
    this.adapters.delete(provider);
    this.priority = this.priority.filter((p) => p !== provider);
  }

  /**
   * 切换策略
   */
  public setStrategy(strategy: VerifyStrategy): void {
    this.strategy = strategy;
  }

  /**
   * 获取当前策略
   */
  public getStrategy(): VerifyStrategy {
    return this.strategy;
  }

  /**
   * 厂商优先级快照
   */
  public getPriority(): LivenessProvider[] {
    return [...this.priority];
  }

  /**
   * 统计信息
   */
  public getStats(): LivenessStats {
    // 深拷贝 + 计算平均延迟
    const out: LivenessStats = {
      totalCalls: 0,
      successCount: 0,
      failureCount: 0,
      byProvider: {} as LivenessStats['byProvider'],
    };
    for (const p of Object.keys(this.stats.byProvider) as LivenessProvider[]) {
      const s = this.stats.byProvider[p];
      out.byProvider[p] = { ...s };
    }
    out.totalCalls = this.stats.totalCalls;
    out.successCount = this.stats.successCount;
    out.failureCount = this.stats.failureCount;
    return out;
  }

  /**
   * 注册结果回调；返回反注册函数
   */
  public onVerification(handler: Handler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * 重置统计（测试用）
   */
  public resetStats(): void {
    Object.assign(this.stats, this._newStats());
  }

  // --------------------------------------------------------------------------
  // 内部：first_success
  // --------------------------------------------------------------------------

  private async _verifyFirstSuccess(
    opts: LivenessRequest,
    order: LivenessProvider[],
  ): Promise<LivenessResult> {
    const errors: Array<{ provider: LivenessProvider; error: unknown }> = [];
    for (const provider of order) {
      const adapter = this.adapters.get(provider)!;
      const overallStart = Date.now();
      try {
        const result = await this._callWithOverallTimeout(
          () => this._callAdapter(adapter, opts),
          this.overallTimeoutMs,
        );
        // first_success 要求返回 passed=true；若不通过视为本厂商失败，降级
        if (!result.passed) {
          const elapsed = Date.now() - overallStart;
          this._recordFailure(provider, elapsed);
          errors.push({ provider, error: new Error(`Provider ${provider} returned passed=false`) });
          continue;
        }
        this._recordSuccess(provider, result.latencyMs);
        this._emit(result);
        return result;
      } catch (err) {
        const elapsed = Date.now() - overallStart;
        this._recordFailure(provider, elapsed);
        errors.push({ provider, error: err });
        // 继续下一个
      }
    }
    throw new KycError(
      'KYC_LIVENESS_ALL_FAILED',
      `All providers failed: ${errors
        .map((e) => `${e.provider}=${(e.error as Error)?.message || String(e.error)}`)
        .join('; ')}`,
      502,
      { errors: errors.map((e) => ({ provider: e.provider, message: (e.error as Error)?.message })) },
    );
  }

  // --------------------------------------------------------------------------
  // 内部：聚合（majority / all）
  // --------------------------------------------------------------------------

  private async _verifyAggregate(
    opts: LivenessRequest,
    order: LivenessProvider[],
    strategy: 'majority' | 'all',
  ): Promise<LivenessResult> {
    const tasks = order.map(async (p) => {
      const adapter = this.adapters.get(p)!;
      try {
        const r = await this._callAdapter(adapter, opts);
        this._recordSuccess(p, r.latencyMs);
        return r;
      } catch (err) {
        this._recordFailure(p, 0);
        return null as unknown as LivenessResult | null;
      }
    });
    const settled = await Promise.all(tasks);
    const okResults = settled.filter(Boolean) as LivenessResult[];
    if (okResults.length === 0) {
      throw new KycError(
        'KYC_LIVENESS_ALL_FAILED',
        `All providers failed (strategy=${strategy})`,
        502,
      );
    }
    // majority
    if (strategy === 'majority') {
      const groups = groupBy(okResults, (r) => `${r.passed}|${r.riskLevel}`);
      const sorted = Object.values(groups).sort((a, b) => b.length - a.length);
      const top = sorted[0];
      if (top.length >= 2) {
        const merged = mergeResults(top);
        this._emit(merged);
        return merged;
      }
      // 退化为 first_success 模式
      const fb = okResults[0];
      this._emit(fb);
      return fb;
    }
    // all
    const merged = mergeResults(okResults);
    this._emit(merged);
    return merged;
  }

  // --------------------------------------------------------------------------
  // 内部：调用 + 统计
  // --------------------------------------------------------------------------

  private async _callAdapter(
    adapter: LivenessAdapter,
    opts: LivenessRequest,
  ): Promise<LivenessResult> {
    const isVideo = !!opts.videoUrl || !!opts.videoBase64;
    return isVideo
      ? await adapter.verifyWithVideo(opts)
      : await adapter.verifyWithImage(opts);
  }

  private async _callWithOverallTimeout<T>(
    fn: () => Promise<T>,
    ms: number,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let done = false;
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        reject(new KycError('KYC_LIVENESS_OVERALL_TIMEOUT', `Overall verify timeout (${ms}ms)`, 504));
      }, ms);
      fn().then(
        (v) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve(v);
        },
        (e) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          reject(e);
        },
      );
    });
  }

  private _recordSuccess(provider: LivenessProvider, latencyMs: number): void {
    this.stats.totalCalls += 1;
    this.stats.successCount += 1;
    const s = this.stats.byProvider[provider];
    const newCalls = s.calls + 1;
    s.calls = newCalls;
    s.success = s.success + 1;
    s.avgLatency = (s.avgLatency * (newCalls - 1) + latencyMs) / newCalls;
  }

  private _recordFailure(provider: LivenessProvider, latencyMs: number): void {
    this.stats.totalCalls += 1;
    this.stats.failureCount += 1;
    const s = this.stats.byProvider[provider];
    const newCalls = s.calls + 1;
    s.calls = newCalls;
    s.avgLatency = (s.avgLatency * (newCalls - 1) + latencyMs) / newCalls;
  }

  private _emit(r: LivenessResult): void {
    for (const h of this.handlers) {
      try {
        h(r);
      } catch {
        // 忽略 handler 异常
      }
    }
  }

  private _newStats(): LivenessStats {
    const providers: LivenessProvider[] = ['ALICLOUD', 'BAIDU', 'TENCENT', 'MEGVII'];
    const byProvider = {} as LivenessStats['byProvider'];
    for (const p of providers) {
      byProvider[p] = { calls: 0, success: 0, avgLatency: 0 };
    }
    return { totalCalls: 0, successCount: 0, failureCount: 0, byProvider };
  }
}

// ============================================================================
// 内部：合并 / 分组
// ============================================================================

const groupBy = <T, K extends string>(arr: T[], key: (t: T) => K): Record<K, T[]> => {
  const out = {} as Record<K, T[]>;
  for (const x of arr) {
    const k = key(x);
    if (!out[k]) out[k] = [];
    out[k].push(x);
  }
  return out;
};

const mergeResults = (results: LivenessResult[]): LivenessResult => {
  // 取第一个通过 / 最高 livenessScore / 平均 similarity
  const passed = results.some((r) => r.passed);
  const avg = (key: keyof LivenessResult): number => {
    const arr = results
      .map((r) => Number(r[key] || 0))
      .filter((n) => Number.isFinite(n));
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  };
  const livenessScore = avg('livenessScore');
  const similarity = avg('similarity');
  const providers = results.map((r) => r.provider);
  // 风险等级：取 worst-case
  const order: RiskLevel[] = ['low', 'medium', 'high'];
  const riskLevel = order
    .slice()
    .reverse()
    .find((lv) => results.some((r) => r.riskLevel === lv)) as RiskLevel;
  return {
    provider: results[0].provider,
    passed,
    confidence: avg('confidence'),
    similarity,
    livenessScore,
    riskLevel,
    reason: passed ? undefined : results.find((r) => !r.passed)?.reason,
    details: { matchedFields: providers },
    rawResponse: { merged: true, results, providers },
    latencyMs: results.reduce((s, r) => s + r.latencyMs, 0),
  };
};
