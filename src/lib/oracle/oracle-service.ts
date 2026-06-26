/**
 * OracleService - 业务层统一入口
 *
 * 职责：
 *  - 整合 ChainlinkClient + PriceAggregator
 *  - 30s 内存缓存（避免重复 RPC）
 *  - 提供业务级接口：
 *    - getPrice / getPrices（单/多交易对）
 *    - getAssetValuation（资产估值，支持 USD/CNY/EUR/JPY）
 *    - subscribePriceUpdates（定时轮询）
 *    - getStalenessReport（健康度报告）
 *    - onPriceAnomaly（异常告警）
 *
 * 注意：
 *  - 法币汇率（USD→CNY 等）使用 mock（演示），生产环境应接入专用的 FX 源
 */

import { EventEmitter } from 'events';
import { ChainlinkClient } from './chainlink/chainlink-client';
import { PriceAggregator } from './chainlink/aggregator';
import { getFeedByPair } from './chainlink/feed-registry';
import {
  ORACLE_CACHE_TTL_MS,
  type AnomalyEvent,
  type AnomalyHandler,
  type AssetValuation,
  type FiatCurrency,
  type OracleChain,
  type PriceData,
  type PriceHandler,
  type StalenessReport,
} from './chainlink/types';

// =============================================================================
// 缓存条目
// =============================================================================

interface CacheEntry {
  data: PriceData;
  /** 缓存写入时间戳（毫秒） */
  cachedAt: number;
}

// =============================================================================
// USD → 法币汇率（演示用：生产应接入 ECB / 央行 / 第三方 API）
// =============================================================================

const FIAT_RATES_FROM_USD: Record<FiatCurrency, number> = {
  USD: 1,
  CNY: 7.24,    // 1 USD = 7.24 CNY
  EUR: 0.92,    // 1 USD = 0.92 EUR
  JPY: 156.5,   // 1 USD = 156.5 JPY
};

// =============================================================================
// OracleService
// =============================================================================

export interface OracleServiceOptions {
  /** 注入 ChainlinkClient（默认新建） */
  client?: ChainlinkClient;
  /** 注入 PriceAggregator（默认新建） */
  aggregator?: PriceAggregator;
  /** 缓存 TTL（毫秒，默认 30s） */
  cacheTtlMs?: number;
  /** 演示降级（默认 true） */
  fallbackToDemo?: boolean;
}

export class OracleService {
  private readonly client: ChainlinkClient;
  private readonly aggregator: PriceAggregator;
  private readonly cacheTtlMs: number;
  private readonly cache: Map<string, CacheEntry> = new Map();
  private readonly emitter: EventEmitter = new EventEmitter();
  private readonly subscriptions: Map<string, ReturnType<typeof setInterval>> = new Map();
  private readonly anomalyWatchers: Set<AnomalyHandler> = new Set();
  private started = false;

  constructor(opts: OracleServiceOptions = {}) {
    this.client = opts.client || new ChainlinkClient({ fallbackToDemo: opts.fallbackToDemo });
    this.aggregator = opts.aggregator || new PriceAggregator({ client: this.client });
    this.cacheTtlMs = opts.cacheTtlMs ?? ORACLE_CACHE_TTL_MS;
  }

  // -------------------------------------------------------------------------
  // 生命周期
  // -------------------------------------------------------------------------

  start(): void {
    if (this.started) return;
    this.client.start();
    this.started = true;
  }

  stop(): void {
    if (!this.started) return;
    this.client.stop();
    // 清理所有订阅
    for (const timer of this.subscriptions.values()) clearInterval(timer);
    this.subscriptions.clear();
    this.started = false;
  }

  // -------------------------------------------------------------------------
  // 缓存
  // -------------------------------------------------------------------------

  private cacheKey(pair: string, chain?: OracleChain): string {
    return `${chain || '*'}:${pair.toUpperCase()}`;
  }

  private getFromCache(key: string): PriceData | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > this.cacheTtlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache(key: string, data: PriceData): void {
    this.cache.set(key, { data, cachedAt: Date.now() });
  }

  /** 清空缓存（强制刷新） */
  clearCache(): void {
    this.cache.clear();
  }

  /** 当前缓存条目数（用于监控/测试） */
  getCacheSize(): number {
    return this.cache.size;
  }

  // -------------------------------------------------------------------------
  // 价格查询
  // -------------------------------------------------------------------------

  /**
   * 获取单个交易对价格（带缓存）。
   * chain 省略时取首匹配。
   */
  async getPrice(pair: string, chain?: OracleChain): Promise<PriceData> {
    if (!pair) throw new Error('pair is required');
    const key = this.cacheKey(pair, chain);
    const cached = this.getFromCache(key);
    if (cached) return cached;

    // 1. 查本链 feed
    let feed = getFeedByPair(pair, chain);
    if (!feed && !chain) {
      // 任意链：尝试解析 ETH/BSC 优先
      const allChains: OracleChain[] = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'base'];
      for (const c of allChains) {
        feed = getFeedByPair(pair, c);
        if (feed) break;
      }
    }
    if (!feed) {
      throw new Error(`No feed registered for pair: ${pair}${chain ? ` on ${chain}` : ''}`);
    }

    const data = await this.client.getLatestPrice(feed);
    this.setCache(key, data);
    this.maybeEmitAnomaly(data);
    return data;
  }

  /**
   * 批量获取价格（并行 + 各自缓存）
   */
  async getPrices(pairs: string[]): Promise<Record<string, PriceData>> {
    if (pairs.length === 0) return {};
    const tasks = pairs.map(async p => {
      try {
        const data = await this.getPrice(p);
        return [p.toUpperCase(), data] as const;
      } catch {
        return [p.toUpperCase(), null] as const;
      }
    });
    const results = await Promise.all(tasks);
    const out: Record<string, PriceData> = {};
    for (const [key, data] of results) {
      if (data) out[key] = data;
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // 资产估值
  // -------------------------------------------------------------------------

  /**
   * 资产估值：amount × priceUSD × fiatRate
   * @param asset 资产符号（如 'ETH'、'BTC'）
   * @param amount 数量（字符串）
   * @param fiat 目标法币
   */
  async getAssetValuation(
    asset: string,
    amount: string,
    fiat: FiatCurrency = 'USD',
  ): Promise<AssetValuation> {
    if (!asset) throw new Error('asset is required');
    if (!amount) throw new Error('amount is required');
    if (!(fiat in FIAT_RATES_FROM_USD)) {
      throw new Error(`Unsupported fiat: ${fiat}`);
    }

    const pair = `${asset.toUpperCase()}/USD`;
    const priceData = await this.getPrice(pair);
    const priceUsd = priceData.formatted;
    const fiatRate = String(FIAT_RATES_FROM_USD[fiat]);

    // value = amount × priceUsd × fiatRate
    // amount: 18 decimals, priceUsd: 8 decimals, fiatRate: 8 decimals
    // 乘积有 18+8+8=34 位小数的"原始表示"
    // 要得到保留 6 位小数的"显示表示"：除以 10^(34-6) = 10^28
    const amountScaled = this.toBigInt(amount, 18);
    const priceScaled = this.toBigInt(priceUsd, 8);
    const rateScaled = this.toBigInt(fiatRate, 8);
    const valueScaled = (amountScaled * priceScaled * rateScaled) / (10n ** 28n);

    return {
      asset: asset.toUpperCase(),
      amount,
      fiat,
      value: this.fromBigInt(valueScaled, 6),
      priceUsd,
      fiatRate,
      timestamp: Date.now(),
    };
  }

  // -------------------------------------------------------------------------
  // 订阅
  // -------------------------------------------------------------------------

  /**
   * 订阅价格更新（定时轮询）
   * @param pair 交易对
   * @param handler 回调
   * @param intervalMs 轮询间隔（默认 = heartbeat * 1000）
   * @returns 取消订阅函数
   */
  subscribePriceUpdates(
    pair: string,
    handler: PriceHandler,
    intervalMs?: number,
  ): () => void {
    const upper = pair.toUpperCase();
    const subKey = upper;
    // 取消已有订阅
    const existing = this.subscriptions.get(subKey);
    if (existing) clearInterval(existing);

    // 确定轮询间隔
    const feed = getFeedByPair(upper);
    const interval = intervalMs ?? (feed ? feed.heartbeatSeconds * 1000 : 30_000);
    const safeInterval = Math.max(interval, 100); // 最少 100ms（测试场景）

    // 立即推送一次
    this.getPrice(upper)
      .then(d => handler(d))
      .catch(() => { /* ignore */ });

    const timer = setInterval(async () => {
      try {
        // 跳过缓存强制拉新
        this.clearCacheFor(upper);
        const data = await this.getPrice(upper);
        await handler(data);
      } catch (err) {
        this.emitAnomaly({
          pair: upper,
          type: 'stale',
          message: `Subscription update failed: ${(err as Error).message}`,
          context: {},
          timestamp: Date.now(),
        });
      }
    }, safeInterval);
    timer.unref?.(); // 不阻塞进程退出（测试 / 短轮询场景）

    this.subscriptions.set(subKey, timer);

    // 返回取消函数
    return () => {
      const t = this.subscriptions.get(subKey);
      if (t) {
        clearInterval(t);
        this.subscriptions.delete(subKey);
      }
    };
  }

  private clearCacheFor(pair: string): void {
    for (const key of Array.from(this.cache.keys())) {
      if (key.endsWith(`:${pair.toUpperCase()}`)) {
        this.cache.delete(key);
      }
    }
  }

  // -------------------------------------------------------------------------
  // 健康 / 异常
  // -------------------------------------------------------------------------

  /**
   * 监控所有已知 feed 的 staleness。
   * 注意：仅返回已查询过 / 缓存中有数据的 pair，避免主动拉取整个 feed 列表。
   */
  getStalenessReport(): StalenessReport[] {
    const out: StalenessReport[] = [];
    const now = Math.floor(Date.now() / 1000);
    for (const [key, entry] of this.cache.entries()) {
      const sepIdx = key.indexOf(':');
      if (sepIdx < 0) continue;
      const chain = key.slice(0, sepIdx) as OracleChain;
      const age = now - entry.data.updatedAt;
      out.push({
        pair: entry.data.pair,
        chain,
        age,
        isStale: entry.data.isStale,
        updatedAt: entry.data.updatedAt,
      });
    }
    return out;
  }

  /** 注册异常 handler，返回取消注册函数 */
  onPriceAnomaly(handler: AnomalyHandler): () => void {
    this.anomalyWatchers.add(handler);
    return () => {
      this.anomalyWatchers.delete(handler);
    };
  }

  /** 主动触发异常事件（内部 + 测试用） */
  emitAnomaly(event: AnomalyEvent): void {
    for (const h of this.anomalyWatchers) {
      try {
        h(event);
      } catch {
        // 不让某个 handler 失败影响其他
      }
    }
    this.emitter.emit('anomaly', event);
  }

  private maybeEmitAnomaly(data: PriceData): void {
    // 1. stale
    if (data.isStale) {
      this.emitAnomaly({
        pair: data.pair,
        type: 'stale',
        message: `Feed stale: age=${data.age}s (heartbeat=${this.heartbeatOf(data)}s)`,
        context: { chain: data.chain, age: data.age },
        timestamp: Date.now(),
      });
    }
    // 2. fallback 警告
    if (data.source === 'fallback') {
      this.emitAnomaly({
        pair: data.pair,
        type: 'deviation',
        message: `Using fallback (mock) data for ${data.pair}`,
        context: { chain: data.chain, expected: 'chainlink', actual: 'fallback' },
        timestamp: Date.now(),
      });
    }
  }

  private heartbeatOf(data: PriceData): number {
    const feed = getFeedByPair(data.pair, data.chain);
    return feed?.heartbeatSeconds ?? 3600;
  }

  /** 获取 EventEmitter（高级用法：批量订阅） */
  getEventBus(): EventEmitter {
    return this.emitter;
  }

  /** 获取底层 client / aggregator */
  getClient(): ChainlinkClient {
    return this.client;
  }
  getAggregator(): PriceAggregator {
    return this.aggregator;
  }

  // -------------------------------------------------------------------------
  // 大数字工具（私有）
  // -------------------------------------------------------------------------

  private toBigInt(s: string, decimals: number): bigint {
    const neg = s.startsWith('-');
    const abs = neg ? s.slice(1) : s;
    const [intPart, fracPart = ''] = abs.split('.');
    const int = BigInt(intPart || '0');
    const frac = BigInt(fracPart || '0');
    if (fracPart.length >= decimals) {
      const v = int * 10n ** BigInt(decimals) + frac / 10n ** BigInt(fracPart.length - decimals);
      return neg ? -v : v;
    }
    const v = int * 10n ** BigInt(decimals) + frac * 10n ** BigInt(decimals - fracPart.length);
    return neg ? -v : v;
  }

  private fromBigInt(v: bigint, displayScale: number): string {
    if (v === 0n) return '0';
    const neg = v < 0n;
    const abs = neg ? -v : v;
    const divisor = 10n ** BigInt(displayScale);
    const whole = abs / divisor;
    const frac = abs % divisor;
    if (frac === 0n) return (neg ? '-' : '') + whole.toString();
    let fracStr = frac.toString().padStart(displayScale, '0').replace(/0+$/, '');
    return (neg ? '-' : '') + (fracStr ? `${whole.toString()}.${fracStr}` : whole.toString());
  }
}

// =============================================================================
// 工厂函数
// =============================================================================

export function createOracleService(opts?: OracleServiceOptions): OracleService {
  return new OracleService(opts);
}
