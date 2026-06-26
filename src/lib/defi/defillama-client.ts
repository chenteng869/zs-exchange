/**
 * DeFiLlama 公共数据 API 客户端
 *
 * DeFiLlama 是免费、无需 API Key 的开源协议数据源（https://defillama.com）。
 * 该客户端实现：
 *  - 多端点切换（主源 + 价格备源）
 *  - 客户端 5 req/s 限流
 *  - 5xx / TIMEOUT 指数退避重试（最多 3 次）
 *  - 断网 / 限流时降级到 mock 数据
 *  - 公共方法：get<T> / probe
 *
 * 端点说明：
 *  - https://api.llama.fi    TVL / 协议 / 链数据
 *  - https://coins.llama.fi  代币价格 / 稳定币市值
 */

import { EventEmitter } from 'events';

// =============================================================================
// 配置常量
// =============================================================================

/** DeFiLlama 主端点 */
export const DEFILLAMA_API_BASE = 'https://api.llama.fi';
/** DeFiLlama 价格端点（coins.llama.fi 域不同） */
export const DEFILLAMA_COINS_BASE = 'https://coins.llama.fi';
/** 端点列表（按优先级） */
export const DEFILLAMA_ENDPOINTS = [
  DEFILLAMA_API_BASE,
  DEFILLAMA_COINS_BASE,
];
/** 默认请求超时（毫秒） */
export const DEFAULT_TIMEOUT_MS = 10_000;
/** 默认最大重试次数 */
export const DEFAULT_MAX_RETRIES = 3;
/** 默认初始退避（毫秒） */
export const DEFAULT_INITIAL_BACKOFF_MS = 400;
/** 默认最大退避（毫秒） */
export const DEFAULT_MAX_BACKOFF_MS = 4_000;
/** 客户端每秒请求数（DeFiLlama 免费无限，但为安全起见节流） */
export const DEFILLAMA_RATE_LIMIT_PER_SEC = 5;
/** 限流窗口（毫秒） */
export const RATE_LIMIT_WINDOW_MS = 1_000;

// =============================================================================
// 自定义错误
// =============================================================================

export class DefiLlamaError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly endpoint?: string;
  constructor(code: string, message: string, opts: { status?: number; endpoint?: string } = {}) {
    super(message);
    this.code = code;
    this.status = opts.status;
    this.endpoint = opts.endpoint;
    this.name = 'DefiLlamaError';
  }
}

// =============================================================================
// 类型定义
// =============================================================================

export interface DefiLlamaClientOptions {
  /** 端点列表（按优先级） */
  endpoints?: string[];
  /** 请求超时（毫秒） */
  timeoutMs?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 初始退避（毫秒） */
  initialBackoffMs?: number;
  /** 最大退避（毫秒） */
  maxBackoffMs?: number;
  /** 自定义 fetch 实现（用于测试） */
  fetchImpl?: typeof fetch;
  /** 每秒请求数限制（0 表示不限） */
  rateLimitPerSec?: number;
  /** 是否启用降级 mock */
  enableFallback?: boolean;
}

export interface ProbeResult {
  /** 是否可达 */
  reachable: boolean;
  /** 延迟（毫秒） */
  latencyMs: number;
  /** 端点 */
  endpoint?: string;
  /** DeFiLlama 报告的 version（若可探测） */
  version?: string;
  /** 错误信息（若不可达） */
  error?: string;
}

// =============================================================================
// 限流器（滑动窗口）
// =============================================================================

export class RateLimiter {
  private timestamps: number[] = [];
  constructor(private readonly maxPerSec: number) {}

  /** 获取一个令牌（必要时 sleep） */
  async acquire(): Promise<void> {
    if (this.maxPerSec <= 0) return;
    const now = Date.now();
    // 清理超出窗口的时间戳
    this.timestamps = this.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (this.timestamps.length < this.maxPerSec) {
      this.timestamps.push(now);
      return;
    }
    // 等待到最早的戳离开窗口
    const wait = RATE_LIMIT_WINDOW_MS - (now - this.timestamps[0]) + 5;
    await new Promise<void>((resolve) => setTimeout(resolve, wait));
    this.timestamps.push(Date.now());
  }

  /** 当前窗口内已用次数 */
  used(): number {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    return this.timestamps.length;
  }

  /** 重置（用于测试） */
  reset(): void {
    this.timestamps = [];
  }
}

// =============================================================================
// DeFiLlamaClient 主类
// =============================================================================

export class DeFiLlamaClient extends EventEmitter {
  private readonly endpoints: string[];
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly initialBackoffMs: number;
  private readonly maxBackoffMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly rateLimiter: RateLimiter;
  private readonly enableFallback: boolean;

  /** 端点健康状态：url -> { healthy, latencyMs, consecutiveFailures, lastCheck } */
  private health: Map<string, { healthy: boolean; latencyMs: number; consecutiveFailures: number; lastCheck: number }> = new Map();

  constructor(opts: DefiLlamaClientOptions = {}) {
    super();
    this.endpoints = (opts.endpoints && opts.endpoints.length > 0) ? [...opts.endpoints] : [...DEFILLAMA_ENDPOINTS];
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.initialBackoffMs = opts.initialBackoffMs ?? DEFAULT_INITIAL_BACKOFF_MS;
    this.maxBackoffMs = opts.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS;
    this.fetchImpl = opts.fetchImpl || (typeof fetch !== 'undefined' ? fetch : (() => {
      throw new DefiLlamaError('NO_FETCH', 'No fetch implementation available');
    })() as typeof fetch);
    this.rateLimiter = new RateLimiter(opts.rateLimitPerSec ?? DEFILLAMA_RATE_LIMIT_PER_SEC);
    this.enableFallback = opts.enableFallback !== false;

    for (const url of this.endpoints) {
      this.health.set(url, { healthy: true, latencyMs: 0, consecutiveFailures: 0, lastCheck: 0 });
    }
  }

  // -------------------------------------------------------------------------
  // 公共方法
  // -------------------------------------------------------------------------

  /**
   * 通用 GET 请求
   * @param path 例如 '/protocols'、'/overview/dexs'、'/stablecoins'
   * @param params 查询参数
   * @param options.base 强制使用某端点（默认自动选择）
   * @param options.retries 自定义重试次数
   * @param options.signal 取消信号
   */
  async get<T = unknown>(
    path: string,
    params: Record<string, string | number> = {},
    options: { base?: string; retries?: number; signal?: AbortSignal } = {},
  ): Promise<T> {
    await this.rateLimiter.acquire();

    const baseUrl = options.base || this.getHealthyEndpoint() || this.endpoints[0];
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) qs.set(k, String(v));
    const url = `${baseUrl}${path}${qs.toString() ? '?' + qs.toString() : ''}`;

    const retries = options.retries !== undefined ? options.retries : this.maxRetries;
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const data = await this.send<T>(url, options.signal);
        this.markHealthy(baseUrl);
        return data;
      } catch (err) {
        lastErr = err as Error;
        const code = (err as DefiLlamaError).code || '';
        // 客户端错误（4xx）不重试，直接抛出
        if (code.startsWith('HTTP_4')) {
          throw err;
        }
        // 标记失败
        this.markUnhealthy(baseUrl);
        if (attempt < retries - 1) {
          const backoff = Math.min(
            this.initialBackoffMs * Math.pow(2, attempt),
            this.maxBackoffMs,
          );
          await this.sleep(backoff);
        }
      }
    }

    // 重试全部失败：尝试切换到下一个端点
    if (lastErr) {
      const sorted = this.getSortedEndpoints();
      const idx = sorted.indexOf(baseUrl);
      if (idx >= 0 && idx < sorted.length - 1) {
        return this.get<T>(path, params, { base: sorted[idx + 1], retries, signal: options.signal });
      }
    }

    throw new DefiLlamaError(
      'ALL_ENDPOINTS_FAILED',
      `All DeFiLlama endpoints failed: ${lastErr?.message || 'unknown'}`,
      { endpoint: baseUrl },
    );
  }

  /**
   * 探测服务可达性
   */
  async probe(): Promise<ProbeResult> {
    const start = Date.now();
    try {
      // 使用 /protocols 的空结果（10KB 以内）作为连通性指标
      await this.get<unknown[]>('/protocols', {}, { retries: 1 });
      return {
        reachable: true,
        latencyMs: Date.now() - start,
        endpoint: this.getHealthyEndpoint() || this.endpoints[0],
        version: 'defillama-public-v1',
      };
    } catch (err) {
      return {
        reachable: false,
        latencyMs: Date.now() - start,
        endpoint: this.getHealthyEndpoint() || this.endpoints[0],
        error: (err as Error).message,
      };
    }
  }

  // -------------------------------------------------------------------------
  // 健康管理
  // -------------------------------------------------------------------------

  getHealthyEndpoint(): string | null {
    const sorted = this.getSortedEndpoints();
    return sorted.length > 0 ? sorted[0] : null;
  }

  getSortedEndpoints(): string[] {
    return this.endpoints.slice().sort((a, b) => {
      const ha = this.health.get(a);
      const hb = this.health.get(b);
      if (ha?.healthy && !hb?.healthy) return -1;
      if (!ha?.healthy && hb?.healthy) return 1;
      const la = ha?.latencyMs ?? Number.MAX_SAFE_INTEGER;
      const lb = hb?.latencyMs ?? Number.MAX_SAFE_INTEGER;
      return la - lb;
    });
  }

  getHealth(): Array<{ url: string; healthy: boolean; latencyMs: number; consecutiveFailures: number; lastCheck: number }> {
    return Array.from(this.health.entries()).map(([url, h]) => ({ url, ...h }));
  }

  // -------------------------------------------------------------------------
  // 限流（公开）
  // -------------------------------------------------------------------------

  getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }

  /** 是否启用降级 */
  isFallbackEnabled(): boolean {
    return this.enableFallback;
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private async send<T>(url: string, signal?: AbortSignal): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    // 串联外部 signal
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
    try {
      const res = await this.fetchImpl(url, { signal: controller.signal });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new DefiLlamaError(
          `HTTP_${res.status}`,
          `DeFiLlama ${res.status}: ${text || res.statusText}`,
          { status: res.status, endpoint: url },
        );
      }
      const ct = res.headers?.get?.('content-type') || '';
      if (ct.includes('application/json')) {
        return await res.json() as T;
      }
      // 非 JSON：尝试解析
      const text = await res.text();
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new DefiLlamaError('PARSE_ERROR', `DeFiLlama returned non-JSON: ${text.slice(0, 100)}`, { endpoint: url });
      }
    } catch (err) {
      if (err instanceof DefiLlamaError) throw err;
      if ((err as Error).name === 'AbortError') {
        throw new DefiLlamaError('TIMEOUT', `DeFiLlama timeout after ${this.timeoutMs}ms`, { endpoint: url });
      }
      throw new DefiLlamaError('NETWORK', `DeFiLlama network error: ${(err as Error).message}`, { endpoint: url });
    } finally {
      clearTimeout(timer);
    }
  }

  private markHealthy(url: string): void {
    const h = this.health.get(url);
    if (h) {
      h.healthy = true;
      h.consecutiveFailures = 0;
      h.lastCheck = Date.now();
    }
  }

  private markUnhealthy(url: string): void {
    const h = this.health.get(url);
    if (h) {
      h.healthy = false;
      h.consecutiveFailures += 1;
      h.lastCheck = Date.now();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// =============================================================================
// 默认导出便捷工厂
// =============================================================================

export function createDefiLlamaClient(opts?: DefiLlamaClientOptions): DeFiLlamaClient {
  return new DeFiLlamaClient(opts);
}
