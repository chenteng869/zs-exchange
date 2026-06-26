/**
 * Kaiko REST 客户端 (P2 Kaiko)
 *
 * 提供：
 *  - 多区域端点（US / EU）+ 自动降级
 *  - 90 req/min 限流（Pro 套餐 100 req/min 留 buffer）
 *  - 5xx / TIMEOUT 指数退避重试
 *  - 演示降级：API Key 含 'mock' 时返回 mock 数据
 *  - 鉴权：Authorization: Bearer {apiKey}（优先）或 ?api_key=xxx
 *
 * 端点格式（Kaiko Market API v2）：
 *  - US: https://us.market-api.kaiko.io
 *  - EU: https://eu.market-api.kaiko.io
 *  - AP: https://ap.market-api.kaiko.io
 *  - Global: https://market-api.kaiko.io
 *
 * 文档：https://docs.kaiko.com
 */

import { EventEmitter } from 'events';
import type {
  KaikoAsset,
  KaikoExchange,
  KaikoTicker,
  KaikoOHLCV,
  KaikoVWAP,
  KaikoAggregatedPrice,
  KaikoOrderBook,
  KaikoTrade,
  KaikoFxRate,
  KaikoMarketCap,
  KaikoInterval,
  VwapWindow,
  FxCurrency,
  Region,
  KaikoClientConfig,
} from './types';

// =============================================================================
// 配置常量
// =============================================================================

export const KAIKO_RATE_LIMIT_PER_MIN = 90;
export const KAIKO_HISTORICAL_CACHE_TTL_MS = 60 * 60_000;
export const KAIKO_TICKER_CACHE_TTL_MS = 5_000;
export const KAIKO_FX_CACHE_TTL_MS = 60_000;
export const KAIKO_DEFAULT_EXCHANGES = ['cbse', 'bnce', 'krkn', 'binc', 'okex', 'huob'];

/** 区域 → 端点 URL */
export const KAIKO_ENDPOINTS: Record<Region, string> = {
  us: 'https://us.market-api.kaiko.io',
  eu: 'https://eu.market-api.kaiko.io',
  ap: 'https://ap.market-api.kaiko.io',
  global: 'https://market-api.kaiko.io',
};

/** 端点降级顺序（按区域影响） */
const REGION_FALLBACK: Record<Region, Region[]> = {
  us: ['us', 'eu', 'global'],
  eu: ['eu', 'us', 'global'],
  ap: ['ap', 'us', 'eu', 'global'],
  global: ['global', 'us', 'eu'],
};

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_BACKOFF_MS = 400;
const DEFAULT_MAX_BACKOFF_MS = 4_000;
const RATE_LIMIT_WINDOW_MS = 60_000;

// =============================================================================
// 自定义错误
// =============================================================================

export class KaikoError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly endpoint?: string;
  constructor(code: string, message: string, opts: { status?: number; endpoint?: string } = {}) {
    super(message);
    this.code = code;
    this.status = opts.status;
    this.endpoint = opts.endpoint;
    this.name = 'KaikoError';
  }
}

// =============================================================================
// 限流器（滑动窗口 / 每分钟）
// =============================================================================

export class KaikoRateLimiter {
  private timestamps: number[] = [];
  constructor(private readonly maxPerWindow: number) {}

  async acquire(): Promise<void> {
    if (this.maxPerWindow <= 0) return;
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (this.timestamps.length < this.maxPerWindow) {
      this.timestamps.push(now);
      return;
    }
    const wait = RATE_LIMIT_WINDOW_MS - (now - this.timestamps[0]) + 5;
    await new Promise<void>((resolve) => setTimeout(resolve, wait));
    this.timestamps.push(Date.now());
  }

  used(): number {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    return this.timestamps.length;
  }

  remaining(): number {
    return Math.max(0, this.maxPerWindow - this.used());
  }

  reset(): void {
    this.timestamps = [];
  }
}

// =============================================================================
// 内存缓存
// =============================================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class TtlCache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  constructor(private readonly ttlMs: number) {}

  get<T>(key: string): T | null {
    if (this.ttlMs <= 0) return null;
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set<T>(key: string, value: T): void {
    if (this.ttlMs <= 0) return;
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

// =============================================================================
// Mock 数据生成器
// =============================================================================

function mockPrice(base: number, jitter = 0.001): string {
  const drift = (Math.random() - 0.5) * 2 * jitter;
  return (base * (1 + drift)).toFixed(8);
}

function mockVolume(): string {
  return (Math.random() * 10_000).toFixed(4);
}

function mockAssets(): KaikoAsset[] {
  return [
    { code: 'btc', name: 'Bitcoin', assetClass: 'crypto' },
    { code: 'eth', name: 'Ethereum', assetClass: 'crypto' },
    { code: 'usdt', name: 'Tether', assetClass: 'crypto' },
    { code: 'usdc', name: 'USD Coin', assetClass: 'crypto' },
    { code: 'usd', name: 'US Dollar', assetClass: 'fiat' },
    { code: 'eur', name: 'Euro', assetClass: 'fiat' },
    { code: 'cny', name: 'Chinese Yuan', assetClass: 'fiat' },
    { code: 'jpy', name: 'Japanese Yen', assetClass: 'fiat' },
  ];
}

function mockExchanges(): KaikoExchange[] {
  return [
    { code: 'cbse', name: 'Coinbase', country: 'US' },
    { code: 'bnce', name: 'Binance', country: 'CN' },
    { code: 'krkn', name: 'Kraken', country: 'US' },
    { code: 'binc', name: 'Bitstamp', country: 'GB' },
    { code: 'okex', name: 'OKX', country: 'MT' },
    { code: 'huob', name: 'Huobi', country: 'SC' },
    { code: 'bitf', name: 'Bitfinex', country: 'VG' },
    { code: 'geml', name: 'Gemini', country: 'US' },
  ];
}

function mockTicker(exchange: string, pair: string): KaikoTicker {
  const base = pair.startsWith('btc') ? 67000 : pair.startsWith('eth') ? 3500 : 100;
  const last = mockPrice(base);
  const bid = (parseFloat(last) * 0.9999).toFixed(8);
  const ask = (parseFloat(last) * 1.0001).toFixed(8);
  return {
    exchange,
    pair,
    bid,
    bidSize: '0.50000000',
    ask,
    askSize: '0.50000000',
    last,
    volume24h: mockVolume(),
    timestamp: Date.now(),
  };
}

function mockOHLCV(exchange: string, pair: string, interval: KaikoInterval, count: number, startTime?: number): KaikoOHLCV[] {
  const intervalMs = parseInterval(interval);
  const start = startTime ?? Date.now() - count * intervalMs;
  const base = pair.startsWith('btc') ? 67000 : pair.startsWith('eth') ? 3500 : 100;
  const out: KaikoOHLCV[] = [];
  let last = base;
  for (let i = 0; i < count; i++) {
    const t = start + i * intervalMs;
    const open = last;
    const close = open * (1 + (Math.random() - 0.5) * 0.01);
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    out.push({
      time: t,
      open: open.toFixed(8),
      high: high.toFixed(8),
      low: low.toFixed(8),
      close: close.toFixed(8),
      volume: mockVolume(),
      count: Math.floor(Math.random() * 1000),
    });
    last = close;
  }
  return out;
}

function mockVWAP(pair: string, window: VwapWindow, count: number): KaikoVWAP[] {
  const now = Date.now();
  const out: KaikoVWAP[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const base = pair.startsWith('btc') ? 67000 : pair.startsWith('eth') ? 3500 : 100;
    out.push({
      pair,
      window,
      vwap: mockPrice(base, 0.0005),
      totalVolume: mockVolume(),
      timestamp: now - i * parseWindowMs(window),
    });
  }
  return out;
}

function mockOrderBook(exchange: string, pair: string, depth: number): KaikoOrderBook {
  const base = pair.startsWith('btc') ? 67000 : pair.startsWith('eth') ? 3500 : 100;
  const mid = base;
  const bids: { price: string; size: string }[] = [];
  const asks: { price: string; size: string }[] = [];
  for (let i = 0; i < depth; i++) {
    bids.push({ price: (mid * (1 - (i + 1) * 0.0002)).toFixed(8), size: (Math.random() + 0.1).toFixed(4) });
    asks.push({ price: (mid * (1 + (i + 1) * 0.0002)).toFixed(8), size: (Math.random() + 0.1).toFixed(4) });
  }
  return { exchange, pair, bids, asks, timestamp: Date.now() };
}

function mockTrades(exchange: string, pair: string, count: number, startTime?: number): KaikoTrade[] {
  const base = pair.startsWith('btc') ? 67000 : pair.startsWith('eth') ? 3500 : 100;
  const start = startTime ?? Date.now() - count * 1000;
  const out: KaikoTrade[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      id: `mock-${exchange}-${i}`,
      exchange,
      pair,
      price: mockPrice(base, 0.0002),
      amount: (Math.random() * 0.5).toFixed(6),
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      timestamp: start + i * 1000,
    });
  }
  return out;
}

function mockFxRate(base: FxCurrency, quote: string): KaikoFxRate {
  const matrix: Record<string, number> = {
    usd_eur: 0.92, usd_cny: 7.18, usd_jpy: 152.0, usd_usd: 1,
    eur_usd: 1.09, eur_cny: 7.82, eur_jpy: 165.0, eur_eur: 1,
    cny_usd: 0.139, cny_eur: 0.128, cny_jpy: 21.2, cny_cny: 1,
    jpy_usd: 0.0066, jpy_eur: 0.0061, jpy_cny: 0.047, jpy_jpy: 1,
  };
  const key = `${base}_${quote.toLowerCase()}`;
  const rate = matrix[key] ?? 1;
  return { base, quote: quote.toLowerCase(), rate: rate.toFixed(8), timestamp: Date.now() };
}

function mockMarketCap(symbol: string): KaikoMarketCap {
  const matrix: Record<string, number> = {
    btc: 1_320_000_000_000,
    eth: 420_000_000_000,
    sol: 75_000_000_000,
    bnb: 88_000_000_000,
  };
  const cap = matrix[symbol.toLowerCase()] ?? 1_000_000_000;
  return { symbol: symbol.toLowerCase(), cap: cap.toFixed(2), supply: '19000000', timestamp: Date.now() };
}

function parseInterval(interval: KaikoInterval): number {
  const m: Record<KaikoInterval, number> = {
    '1m': 60_000,
    '5m': 5 * 60_000,
    '15m': 15 * 60_000,
    '30m': 30 * 60_000,
    '1h': 60 * 60_000,
    '4h': 4 * 60 * 60_000,
    '12h': 12 * 60 * 60_000,
    '1d': 24 * 60 * 60_000,
    '1w': 7 * 24 * 60 * 60_000,
  };
  return m[interval];
}

function parseWindowMs(window: VwapWindow): number {
  const m: Record<VwapWindow, number> = {
    '1m': 60_000,
    '5m': 5 * 60_000,
    '15m': 15 * 60_000,
    '1h': 60 * 60_000,
    '1d': 24 * 60 * 60_000,
  };
  return m[window];
}

// =============================================================================
// KaikoClient 主类
// =============================================================================

export class KaikoClient extends EventEmitter {
  private readonly apiKey: string;
  private readonly region: Region;
  private readonly enableFallback: boolean;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly initialBackoffMs: number;
  private readonly maxBackoffMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly rateLimiter: KaikoRateLimiter;
  private readonly enableMock: boolean;

  private readonly tickerCache: TtlCache;
  private readonly ohlcvCache: TtlCache;
  private readonly vwapCache: TtlCache;
  private readonly fxCache: TtlCache;
  private readonly marketCapCache: TtlCache;
  private readonly orderBookCache: TtlCache;
  private readonly tradesCache: TtlCache;

  private health: Map<string, { healthy: boolean; latencyMs: number; consecutiveFailures: number; lastCheck: number }> = new Map();

  constructor(config: KaikoClientConfig) {
    super();
    if (!config || !config.apiKey) {
      throw new KaikoError('NO_API_KEY', 'Kaiko API key is required');
    }
    this.apiKey = config.apiKey;
    this.region = config.region || 'us';
    this.enableFallback = config.enableFallback !== false;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.initialBackoffMs = config.initialBackoffMs ?? DEFAULT_INITIAL_BACKOFF_MS;
    this.maxBackoffMs = config.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS;
    this.fetchImpl = config.fetchImpl || (typeof fetch !== 'undefined' ? fetch : (() => {
      throw new KaikoError('NO_FETCH', 'No fetch implementation available');
    })() as typeof fetch);
    this.rateLimiter = new KaikoRateLimiter(config.rateLimitPerMinute ?? KAIKO_RATE_LIMIT_PER_MIN);
    this.enableMock = config.enableMock || this.apiKey.toLowerCase().includes('mock');

    this.tickerCache = new TtlCache(KAIKO_TICKER_CACHE_TTL_MS);
    this.ohlcvCache = new TtlCache(KAIKO_HISTORICAL_CACHE_TTL_MS);
    this.vwapCache = new TtlCache(KAIKO_HISTORICAL_CACHE_TTL_MS);
    this.fxCache = new TtlCache(KAIKO_FX_CACHE_TTL_MS);
    this.marketCapCache = new TtlCache(KAIKO_HISTORICAL_CACHE_TTL_MS);
    this.orderBookCache = new TtlCache(KAIKO_TICKER_CACHE_TTL_MS);
    this.tradesCache = new TtlCache(KAIKO_TICKER_CACHE_TTL_MS);

    for (const region of REGION_FALLBACK[this.region]) {
      const url = KAIKO_ENDPOINTS[region];
      this.health.set(url, { healthy: true, latencyMs: 0, consecutiveFailures: 0, lastCheck: 0 });
    }
  }

  // -------------------------------------------------------------------------
  // 公共方法
  // -------------------------------------------------------------------------

  async getAssets(assetClass?: 'crypto' | 'fiat'): Promise<KaikoAsset[]> {
    if (this.enableMock) {
      return assetClass ? mockAssets().filter((a) => a.assetClass === assetClass) : mockAssets();
    }
    const path = assetClass ? `/v2/data/assets?class=${assetClass}` : '/v2/data/assets';
    const raw = await this.get<RawAsset[]>(path);
    return raw.map((r) => ({
      code: r.code,
      name: r.name,
      assetClass: (r.assetClass ?? r.class ?? 'crypto') as 'crypto' | 'fiat',
    }));
  }

  async getExchanges(): Promise<KaikoExchange[]> {
    if (this.enableMock) return mockExchanges();
    return this.get<KaikoExchange[]>('/v2/data/exchanges');
  }

  async getTicker(exchange: string, pair: string): Promise<KaikoTicker | null> {
    const key = `ticker:${exchange}:${pair}`;
    const cached = this.tickerCache.get<KaikoTicker>(key);
    if (cached) return cached;

    if (this.enableMock) {
      const t = mockTicker(exchange, pair);
      this.tickerCache.set(key, t);
      return t;
    }

    const path = `/v2/data/exchanges/${exchange}/pairs/${pair}/aggregated/price`;
    try {
      const data = await this.get<RawTicker>(path);
      const ticker: KaikoTicker = {
        exchange: data.exchange || exchange,
        pair: data.pair || pair,
        bid: data.bid ?? data.b ?? '0',
        bidSize: data.bid_size ?? data.bidSize,
        ask: data.ask ?? data.a ?? '0',
        askSize: data.ask_size ?? data.askSize,
        last: data.last ?? data.c ?? data.price ?? '0',
        volume24h: data.volume_24h ?? data.volume ?? data.v ?? '0',
        timestamp: data.timestamp ?? data.t ?? Date.now(),
      };
      this.tickerCache.set(key, ticker);
      return ticker;
    } catch (err) {
      if (err instanceof KaikoError && (err.code === 'HTTP_404' || err.code === 'NOT_FOUND')) {
        return null;
      }
      throw err;
    }
  }

  async getOHLCV(opts: {
    exchange: string;
    pair: string;
    interval: KaikoInterval;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Promise<KaikoOHLCV[]> {
    const { exchange, pair, interval, startTime, endTime, limit } = opts;
    const limitSafe = Math.min(Math.max(limit ?? 100, 1), 1000);
    const cacheKey = `ohlcv:${exchange}:${pair}:${interval}:${startTime ?? ''}:${endTime ?? ''}:${limitSafe}`;
    const cached = this.ohlcvCache.get<KaikoOHLCV[]>(cacheKey);
    if (cached) return cached;

    if (this.enableMock) {
      const data = mockOHLCV(exchange, pair, interval, limitSafe, startTime);
      this.ohlcvCache.set(cacheKey, data);
      return data;
    }

    const params: Record<string, string | number> = {
      interval,
      limit: limitSafe,
    };
    if (startTime) params.start_time = startTime;
    if (endTime) params.end_time = endTime;

    const path = `/v2/data/exchanges/${exchange}/pairs/${pair}/aggregated/ohlcv`;
    const raw = await this.get<RawOHLCVItem[]>(path, params);
    const data = raw.map((r) => normalizeOHLCV(r));
    this.ohlcvCache.set(cacheKey, data);
    return data;
  }

  async getVWAP(opts: { pair: string; window: VwapWindow; startTime?: number; endTime?: number }): Promise<KaikoVWAP[]> {
    const { pair, window, startTime, endTime } = opts;
    const cacheKey = `vwap:${pair}:${window}:${startTime ?? ''}:${endTime ?? ''}`;
    const cached = this.vwapCache.get<KaikoVWAP[]>(cacheKey);
    if (cached) return cached;

    if (this.enableMock) {
      const data = mockVWAP(pair, window, 20);
      this.vwapCache.set(cacheKey, data);
      return data;
    }

    const params: Record<string, string | number> = { window };
    if (startTime) params.start_time = startTime;
    if (endTime) params.end_time = endTime;

    const path = `/v2/data/aggregations/vwap`;
    const raw = await this.get<RawVWAPItem[]>(path, { ...params, pair });
    const data = raw.map((r) => normalizeVWAP(r, pair, window));
    this.vwapCache.set(cacheKey, data);
    return data;
  }

  async getFXRate(base: FxCurrency, quote: string): Promise<{ rate: string; timestamp: number }> {
    const key = `fx:${base}:${quote.toLowerCase()}`;
    const cached = this.fxCache.get<{ rate: string; timestamp: number }>(key);
    if (cached) return cached;

    if (this.enableMock) {
      const r = mockFxRate(base, quote);
      const result = { rate: r.rate, timestamp: r.timestamp };
      this.fxCache.set(key, result);
      return result;
    }

    const data = await this.get<RawFxRate>(`/v2/data/fx/rates`, { base, quote: quote.toLowerCase() });
    const result = { rate: data.rate ?? '0', timestamp: data.timestamp ?? Date.now() };
    this.fxCache.set(key, result);
    return result;
  }

  async getMarketCap(symbol: string): Promise<{ cap: string; supply: string; timestamp: number }> {
    const key = `mcap:${symbol.toLowerCase()}`;
    const cached = this.marketCapCache.get<{ cap: string; supply: string; timestamp: number }>(key);
    if (cached) return cached;

    if (this.enableMock) {
      const r = mockMarketCap(symbol);
      const result = { cap: r.cap, supply: r.supply, timestamp: r.timestamp };
      this.marketCapCache.set(key, result);
      return result;
    }

    const data = await this.get<RawMarketCap>(`/v2/data/assets/${symbol.toLowerCase()}/market_cap`);
    const result = {
      cap: data.cap ?? data.market_cap ?? '0',
      supply: data.supply ?? '0',
      timestamp: data.timestamp ?? Date.now(),
    };
    this.marketCapCache.set(key, result);
    return result;
  }

  async getOrderBook(exchange: string, pair: string, depth = 20): Promise<KaikoOrderBook> {
    const key = `ob:${exchange}:${pair}:${depth}`;
    const cached = this.orderBookCache.get<KaikoOrderBook>(key);
    if (cached) return cached;

    if (this.enableMock) {
      const ob = mockOrderBook(exchange, pair, depth);
      this.orderBookCache.set(key, ob);
      return ob;
    }

    const data = await this.get<RawOrderBook>(
      `/v2/data/exchanges/${exchange}/pairs/${pair}/order_book`,
      { depth: Math.min(Math.max(depth, 1), 100) },
    );
    const ob: KaikoOrderBook = {
      exchange,
      pair,
      bids: sortBook(data.bids, 'desc'),
      asks: sortBook(data.asks, 'asc'),
      timestamp: data.timestamp ?? Date.now(),
    };
    this.orderBookCache.set(key, ob);
    return ob;
  }

  async getTrades(opts: {
    exchange: string;
    pair: string;
    startTime: number;
    endTime?: number;
    limit?: number;
  }): Promise<KaikoTrade[]> {
    const { exchange, pair, startTime, endTime, limit } = opts;
    const limitSafe = Math.min(Math.max(limit ?? 100, 1), 1000);
    const cacheKey = `trades:${exchange}:${pair}:${startTime}:${endTime ?? ''}:${limitSafe}`;
    const cached = this.tradesCache.get<KaikoTrade[]>(cacheKey);
    if (cached) return cached;

    if (this.enableMock) {
      const data = mockTrades(exchange, pair, limitSafe, startTime);
      this.tradesCache.set(cacheKey, data);
      return data;
    }

    const params: Record<string, string | number> = {
      start_time: startTime,
      limit: limitSafe,
    };
    if (endTime) params.end_time = endTime;

    const path = `/v2/data/exchanges/${exchange}/pairs/${pair}/trades`;
    const raw = await this.get<RawTradeItem[]>(path, params);
    const data = raw.map((r) => normalizeTrade(r, exchange, pair));
    this.tradesCache.set(cacheKey, data);
    return data;
  }

  // -------------------------------------------------------------------------
  // 内部方法
  // -------------------------------------------------------------------------

  /** 通用 GET 请求（多端点 + 重试） */
  private async get<T = unknown>(
    path: string,
    params: Record<string, string | number> = {},
    options: { base?: string; retries?: number; signal?: AbortSignal } = {},
  ): Promise<T> {
    await this.rateLimiter.acquire();

    const baseUrl = options.base || this.getHealthyEndpoint() || KAIKO_ENDPOINTS[this.region];
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
        const code = (err as KaikoError).code || '';
        if (code.startsWith('HTTP_4') && code !== 'HTTP_429') {
          throw err;
        }
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

    if (lastErr && this.enableFallback) {
      // 找一个健康的备选端点（按健康度排序后跳过 baseUrl）
      const sorted = this.getSortedEndpoints();
      const fallback = sorted.find((url) => url !== baseUrl && this.health.get(url)?.healthy !== false);
      if (fallback) {
        return this.get<T>(path, params, { base: fallback, retries, signal: options.signal });
      }
    }

    throw new KaikoError(
      'ALL_ENDPOINTS_FAILED',
      `All Kaiko endpoints failed: ${lastErr?.message || 'unknown'}`,
      { endpoint: baseUrl },
    );
  }

  private async send<T>(url: string, signal?: AbortSignal): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
    try {
      const res = await this.fetchImpl(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-Api-Key': this.apiKey,
        },
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new KaikoError(
          `HTTP_${res.status}`,
          `Kaiko ${res.status}: ${text || res.statusText}`,
          { status: res.status, endpoint: url },
        );
      }
      const ct = res.headers?.get?.('content-type') || '';
      if (ct.includes('application/json')) {
        return await res.json() as T;
      }
      const text = await res.text();
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new KaikoError('PARSE_ERROR', `Kaiko returned non-JSON: ${text.slice(0, 100)}`, { endpoint: url });
      }
    } catch (err) {
      if (err instanceof KaikoError) throw err;
      if ((err as Error).name === 'AbortError') {
        throw new KaikoError('TIMEOUT', `Kaiko timeout after ${this.timeoutMs}ms`, { endpoint: url });
      }
      throw new KaikoError('NETWORK', `Kaiko network error: ${(err as Error).message}`, { endpoint: url });
    } finally {
      clearTimeout(timer);
    }
  }

  // -------------------------------------------------------------------------
  // 健康管理 / 限流
  // -------------------------------------------------------------------------

  getHealthyEndpoint(): string | null {
    const sorted = this.getSortedEndpoints();
    return sorted.length > 0 ? sorted[0] : null;
  }

  getSortedEndpoints(): string[] {
    return Array.from(this.health.keys()).sort((a, b) => {
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

  getRateLimiter(): KaikoRateLimiter {
    return this.rateLimiter;
  }

  isMockMode(): boolean {
    return this.enableMock;
  }

  clearCache(): void {
    this.tickerCache.clear();
    this.ohlcvCache.clear();
    this.vwapCache.clear();
    this.fxCache.clear();
    this.marketCapCache.clear();
    this.orderBookCache.clear();
    this.tradesCache.clear();
  }

  // -------------------------------------------------------------------------
  // 私有
  // -------------------------------------------------------------------------

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
// 原始响应类型（Kaiko 实际字段会因端点不同而变化，做宽松处理）
// =============================================================================

interface RawTicker {
  exchange?: string;
  pair?: string;
  bid?: string;
  b?: string;
  ask?: string;
  a?: string;
  bid_size?: string;
  bidSize?: string;
  ask_size?: string;
  askSize?: string;
  last?: string;
  c?: string;
  price?: string;
  volume_24h?: string;
  volume?: string;
  v?: string;
  timestamp?: number;
  t?: number;
}

interface RawAsset {
  code: string;
  name: string;
  assetClass?: 'crypto' | 'fiat';
  class?: 'crypto' | 'fiat';
}

interface RawOHLCVItem {
  time?: number;
  t?: number;
  open?: string;
  o?: string;
  high?: string;
  h?: string;
  low?: string;
  l?: string;
  close?: string;
  c?: string;
  volume?: string;
  v?: string;
  count?: number;
  n?: number;
}

interface RawVWAPItem {
  pair?: string;
  window?: string;
  vwap?: string;
  total_volume?: string;
  totalVolume?: string;
  timestamp?: number;
  t?: number;
}

interface RawFxRate {
  rate?: string;
  timestamp?: number;
  t?: number;
}

interface RawMarketCap {
  cap?: string;
  market_cap?: string;
  supply?: string;
  timestamp?: number;
}

interface RawOrderBook {
  bids?: [string, string][];
  asks?: [string, string][];
  timestamp?: number;
}

interface RawTradeItem {
  id?: string | number;
  price?: string;
  amount?: string;
  size?: string;
  side?: 'buy' | 'sell';
  timestamp?: number;
  t?: number;
}

// =============================================================================
// 标准化
// =============================================================================

function normalizeOHLCV(r: RawOHLCVItem): KaikoOHLCV {
  return {
    time: r.time ?? r.t ?? Date.now(),
    open: r.open ?? r.o ?? '0',
    high: r.high ?? r.h ?? '0',
    low: r.low ?? r.l ?? '0',
    close: r.close ?? r.c ?? '0',
    volume: r.volume ?? r.v ?? '0',
    count: r.count ?? r.n ?? 0,
  };
}

function normalizeVWAP(r: RawVWAPItem, defaultPair: string, defaultWindow: VwapWindow): KaikoVWAP {
  return {
    pair: r.pair ?? defaultPair,
    window: (r.window as VwapWindow) ?? defaultWindow,
    vwap: r.vwap ?? '0',
    totalVolume: r.total_volume ?? r.totalVolume ?? '0',
    timestamp: r.timestamp ?? r.t ?? Date.now(),
  };
}

function normalizeTrade(r: RawTradeItem, exchange: string, pair: string): KaikoTrade {
  return {
    id: String(r.id ?? ''),
    exchange,
    pair,
    price: r.price ?? '0',
    amount: r.amount ?? r.size ?? '0',
    side: r.side === 'sell' ? 'sell' : 'buy',
    timestamp: r.timestamp ?? r.t ?? Date.now(),
  };
}

function sortBook(levels: [string, string][] | undefined, dir: 'asc' | 'desc'): { price: string; size: string }[] {
  if (!levels || levels.length === 0) return [];
  const arr = levels.map(([p, s]) => ({ price: p, size: s }));
  arr.sort((a, b) => {
    const pa = parseFloat(a.price);
    const pb = parseFloat(b.price);
    return dir === 'asc' ? pa - pb : pb - pa;
  });
  return arr;
}

// =============================================================================
// 便捷工厂
// =============================================================================

export function createKaikoClient(config: KaikoClientConfig): KaikoClient {
  return new KaikoClient(config);
}

/** 兼容导出：KaikoAggregatedPrice 也用此名做转换 */
export { normalizeOHLCV as _normalizeOHLCV };
