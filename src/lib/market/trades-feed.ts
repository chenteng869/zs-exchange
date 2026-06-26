/**
 * TradesFeed —— 标准化逐笔成交聚合层
 *
 * 职责：
 *  - 维护多个交易对的最近 N 笔成交（默认 200 / symbol）内存缓存
 *  - 共享一个 BinanceWsClient 连接，订阅多个 symbol 的 @trade 流
 *  - 暴露多订阅者接口：subscribe(symbol, cb) —— 同一交易对可挂多个回调
 *  - 自动重连：底层 BinanceWsClient 已实现指数退避（500ms → 10s）
 *  - 降级：连接失败 / 长时间无数据时，emit 模拟成交（5 笔 / symbol），
 *         保证前端 UI 永远有数据可渲染
 *  - 标准化：所有外部数据均通过 normalizeTradeWs/REST 转为 NormalizedTrade
 *
 * 设计要点：
 *  - 使用 Map<symbol, NormalizedTrade[]> 缓存，环形覆盖（slice 截断）
 *  - 内部维护 Set<callback>，取消订阅时仅移除该 callback
 *  - mock 降级使用 GBM + 基础价生成（与 MarketFeed 风格一致）
 *  - 精度统一使用 string，不做 number 浮点运算
 */

import {
  BinanceRestClient,
  BinanceWsClient,
  BinanceError,
  formatSymbol,
  normalizeTradeRestWithSymbol,
  normalizeTradeWs,
  toBinanceStream,
  type BinanceRecentTradeRaw,
  type BinanceRestClientOptions,
  type BinanceWsClientOptions,
  type BinanceWsTradeMessage,
  type NormalizedTrade,
} from './binance-client';

// =============================================================================
// 配置
// =============================================================================

/** 每个交易对在内存中保留的最近成交笔数 */
export const DEFAULT_TRADE_CACHE_SIZE = 200;
/** 降级时每个交易对 mock 的成交笔数 */
export const DEFAULT_MOCK_TRADES = 5;
/** 多久没收到推送就触发降级（毫秒） */
export const DEFAULT_STALE_THRESHOLD_MS = 30_000;

// =============================================================================
// 类型
// =============================================================================

export interface TradesFeedOptions {
  /** 缓存大小（每交易对保留多少笔），默认 200 */
  cacheSize?: number;
  /** 降级时每个交易对生成多少笔 mock 成交，默认 5 */
  mockTradesPerSymbol?: number;
  /** 超过该毫秒无推送即触发降级，默认 30s */
  staleThresholdMs?: number;
  /** mock 价格的基准（用于 GBM 模拟） */
  basePrice?: number;
  /** 透传给 REST 客户端 */
  rest?: BinanceRestClientOptions;
  /** 透传给 WS 客户端 */
  ws?: BinanceWsClientOptions;
  /** 收到 mock 降级数据时的回调（用于埋点） */
  onFallback?: (symbol: string, reason: string) => void;
}

export interface MockGeneratorOptions {
  symbol: string;
  basePrice?: number;
  count?: number;
}

// =============================================================================
// 工具：mock 成交生成
// =============================================================================

/**
 * 简单 GBM 步进
 *   S(t+1) = S(t) * exp(drift + sigma*Z)
 */
function gbmStep(price: number, sigma: number): number {
  const u1 = Math.random() || 1e-9;
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return price * Math.exp(sigma * z);
}

/**
 * 生成单个 symbol 的 mock 成交
 *
 * 默认基准价：BTC=67000、ETH=3500、SOL=150，否则使用 opts.basePrice 或 100。
 */
export function generateMockTrades(opts: MockGeneratorOptions): NormalizedTrade[] {
  const count = opts.count ?? DEFAULT_MOCK_TRADES;
  const base = opts.basePrice ?? defaultBasePrice(opts.symbol);
  const sigma = 0.0015; // 约 0.15% 单笔波动
  const out: NormalizedTrade[] = [];
  let price = base;
  const now = Date.now();
  for (let i = 0; i < count; i += 1) {
    price = gbmStep(price, sigma);
    const qty = (Math.random() * 0.5).toFixed(8);
    const isBuyerMaker = Math.random() > 0.5;
    out.push({
      symbol: formatSymbol(opts.symbol),
      price: price.toFixed(8),
      qty,
      time: now - (count - i) * 250, // 间隔 250ms
      isBuyerMaker,
      tradeId: `mock_${opts.symbol.replace('/', '')}_${now}_${i}`,
      source: 'mock',
    });
  }
  return out;
}

/** 一些常见币种的基准价（用于 mock 降级时给出更真实的初始价） */
const KNOWN_BASE_PRICES: Record<string, number> = {
  BTC: 67000,
  ETH: 3500,
  BNB: 600,
  SOL: 150,
  XRP: 0.6,
  ADA: 0.45,
  DOGE: 0.15,
  AVAX: 35,
};

function defaultBasePrice(symbol: string): number {
  const base = symbol.split('/')[0]?.toUpperCase() || '';
  return KNOWN_BASE_PRICES[base] ?? 100;
}

// =============================================================================
// TradesFeed
// =============================================================================

export class TradesFeed {
  private readonly cacheSize: number;
  private readonly mockTradesPerSymbol: number;
  private readonly staleThresholdMs: number;
  private readonly basePrice?: number;
  private readonly onFallback?: (symbol: string, reason: string) => void;

  private readonly rest: BinanceRestClient;
  private readonly ws: BinanceWsClient;

  /** key: 标准化 symbol (e.g. "BTC/USDT") */
  private readonly cache: Map<string, NormalizedTrade[]> = new Map();
  /** key: 标准化 symbol → Set<callback> */
  private readonly subscribers: Map<string, Set<(t: NormalizedTrade) => void>> = new Map();
  /** 标记哪些 symbol 当前已经向 WS 注册过（避免重复 SUBSCRIBE） */
  private readonly wsSubscribed: Set<string> = new Set();
  /** 取消当前全部 WS 订阅的句柄 */
  private wsUnsub: (() => void) | null = null;
  /** 最后一次推送时间（用于 stale 检测） */
  private lastPushAt: Map<string, number> = new Map();
  /** 已被降级标记的 symbol（避免重复 fallback 提示） */
  private readonly fallenBack: Set<string> = new Set();
  /** WS 连接是否已建立 */
  private connected = false;

  constructor(opts: TradesFeedOptions = {}) {
    this.cacheSize = opts.cacheSize ?? DEFAULT_TRADE_CACHE_SIZE;
    this.mockTradesPerSymbol = opts.mockTradesPerSymbol ?? DEFAULT_MOCK_TRADES;
    this.staleThresholdMs = opts.staleThresholdMs ?? DEFAULT_STALE_THRESHOLD_MS;
    this.basePrice = opts.basePrice;
    this.onFallback = opts.onFallback;

    this.rest = new BinanceRestClient(opts.rest);
    this.ws = new BinanceWsClient({
      ...(opts.ws || {}),
      onOpen: () => {
        this.connected = true;
        // 重连后重新订阅
        this.resubscribeAll();
        opts.ws?.onOpen?.();
      },
      onClose: (code, reason) => {
        this.connected = false;
        opts.ws?.onClose?.(code, reason);
      },
      onReconnect: (attempt, delay) => {
        opts.ws?.onReconnect?.(attempt, delay);
      },
    });
  }

  /**
   * 启动 WS 连接（必须在 subscribe / fetch 之前调用一次）
   */
  start(): void {
    this.ws.connect();
  }

  /**
   * 关闭并清理所有资源
   */
  stop(): void {
    if (this.wsUnsub) {
      try { this.wsUnsub(); } catch { /* ignore */ }
      this.wsUnsub = null;
    }
    this.ws.disconnect();
    this.cache.clear();
    this.subscribers.clear();
    this.wsSubscribed.clear();
    this.lastPushAt.clear();
    this.fallenBack.clear();
    this.connected = false;
  }

  /**
   * 获取某个交易对最近 N 笔成交（从内存缓存读取，不走网络）
   *
   * @param symbol  交易对
   * @param limit   返回条数（1 ~ cacheSize），默认 50
   */
  getRecent(symbol: string, limit = 50): NormalizedTrade[] {
    const key = formatSymbol(symbol);
    const arr = this.cache.get(key);
    if (!arr || arr.length === 0) return [];
    const n = Math.min(Math.max(limit, 1), arr.length);
    return arr.slice(-n);
  }

  /**
   * 订阅某个交易对的逐笔成交
   *
   * - 第一次订阅时会自动向 WS 注册该 symbol 的 @trade 流
   * - 同 symbol 上可以有多个 callback
   * - 若缓存为空且未连接，会立即 emit 一次 mock 数据
   *
   * @returns 取消订阅函数
   */
  subscribe(symbol: string, callback: (t: NormalizedTrade) => void): () => void {
    const key = formatSymbol(symbol);
    let set = this.subscribers.get(key);
    if (!set) {
      set = new Set();
      this.subscribers.set(key, set);
    }
    set.add(callback);

    // 1) 首次订阅 → 注册 WS
    if (!this.wsSubscribed.has(key)) {
      this.wsSubscribed.add(key);
      this.attachWsSubscription(key);
    }

    // 2) 立即把历史缓存回放一次（避免新订阅者看到空白）
    const recent = this.cache.get(key);
    if (recent && recent.length > 0) {
      // 异步触发，避免阻塞当前调用栈
      queueMicrotask(() => {
        for (const t of recent.slice(-10)) {
          try { callback(t); } catch { /* ignore handler error */ }
        }
      });
    } else {
      // 3) 没数据：尝试 REST 拉一次，失败则 mock
      this.bootstrapSymbol(key).catch(() => { /* 已在内部处理 */ });
    }

    return () => {
      const s = this.subscribers.get(key);
      if (!s) return;
      s.delete(callback);
      if (s.size === 0) {
        this.subscribers.delete(key);
        // 没有任何订阅者了：保留缓存（避免新订阅者重新拉），
        // 但 ws 流保留订阅以维持重连一致性（binance 允许多次重复订阅同一流）
      }
    };
  }

  /**
   * 主动拉取 REST 历史成交
   */
  async fetchRecentTrades(symbol: string, limit = 50): Promise<NormalizedTrade[]> {
    return this.rest.fetchRecentTrades(symbol, limit);
  }

  /**
   * REST 拉取并写入缓存（带降级）
   */
  async bootstrapSymbol(symbol: string): Promise<NormalizedTrade[]> {
    const key = formatSymbol(symbol);
    try {
      const trades = await this.rest.fetchRecentTrades(symbol, this.cacheSize);
      this.cache.set(key, trades.slice(-this.cacheSize));
      this.lastPushAt.set(key, Date.now());
      // 推给现有订阅者
      this.fanout(key, trades);
      return trades;
    } catch (err) {
      this.fallback(symbol, err);
      return this.cache.get(key) || [];
    }
  }

  /**
   * 返回当前是否处于 live（WS 已连接 + 收到过推送）
   */
  isLive(): boolean {
    return this.connected && this.lastPushAt.size > 0;
  }

  /**
   * 暴露内部 WS 客户端（高级用法，例如同时订阅 ticker）
   */
  getWsClient(): BinanceWsClient {
    return this.ws;
  }

  /**
   * 暴露内部 REST 客户端
   */
  getRestClient(): BinanceRestClient {
    return this.rest;
  }

  /**
   * 当前缓存的 symbol 数量
   */
  size(): number {
    return this.cache.size;
  }

  // ---------------------------------------------------------------------------
  // 内部
  // ---------------------------------------------------------------------------

  private attachWsSubscription(symbol: string): void {
    // 共享一个 ws 句柄：把订阅全部挂到同一个 unsubscribe 上
    // 注意：BinanceWsClient.subscribeTrades 已经会做合并，这里再调一次相当于 noop
    if (!this.wsUnsub) {
      this.wsUnsub = this.ws.subscribeTrades(
        Array.from(this.wsSubscribed),
        (t) => this.handleTrade(t),
      );
    }
  }

  private resubscribeAll(): void {
    if (this.wsUnsub) {
      try { this.wsUnsub(); } catch { /* ignore */ }
      this.wsUnsub = null;
    }
    if (this.wsSubscribed.size > 0) {
      this.wsUnsub = this.ws.subscribeTrades(
        Array.from(this.wsSubscribed),
        (t) => this.handleTrade(t),
      );
    }
  }

  private handleTrade(trade: NormalizedTrade): void {
    if (this.fallenBack.has(trade.symbol)) {
      // 一旦收到真实推送，清除降级标记
      this.fallenBack.delete(trade.symbol);
    }
    this.pushToCache(trade);
    this.lastPushAt.set(trade.symbol, Date.now());
    this.fanout(trade.symbol, [trade]);
  }

  private pushToCache(trade: NormalizedTrade): void {
    let arr = this.cache.get(trade.symbol);
    if (!arr) {
      arr = [];
      this.cache.set(trade.symbol, arr);
    }
    arr.push(trade);
    // 环形裁剪
    if (arr.length > this.cacheSize) {
      arr.splice(0, arr.length - this.cacheSize);
    }
  }

  private fanout(symbol: string, trades: NormalizedTrade[]): void {
    const set = this.subscribers.get(symbol);
    if (!set || set.size === 0) return;
    for (const t of trades) {
      for (const cb of set) {
        try { cb(t); } catch {
          // 单个订阅者抛错不影响其他订阅者
        }
      }
    }
  }

  private fallback(symbol: string, reason: unknown): void {
    const key = formatSymbol(symbol);
    if (this.fallenBack.has(key)) return;
    this.fallenBack.add(key);
    const mock = generateMockTrades({
      symbol: key,
      count: this.mockTradesPerSymbol,
      basePrice: this.basePrice ?? defaultBasePrice(key),
    });
    this.cache.set(key, mock);
    this.lastPushAt.set(key, Date.now());
    this.fanout(key, mock);
    const reasonStr = reason instanceof Error
      ? (reason instanceof BinanceError ? `${reason.code}: ${reason.message}` : reason.message)
      : 'unknown';
    try { this.onFallback?.(key, reasonStr); } catch { /* ignore */ }
  }
}

// =============================================================================
// 工厂
// =============================================================================

export function createTradesFeed(opts?: TradesFeedOptions): TradesFeed {
  return new TradesFeed(opts);
}

// 重新导出常用类型 / 工具，方便调用方统一从 trades-feed 引入
export {
  BinanceError,
  formatSymbol,
  toBinanceStream,
  normalizeTradeWs,
  normalizeTradeRestWithSymbol,
  type BinanceRecentTradeRaw,
  type BinanceWsTradeMessage,
  type NormalizedTrade,
};
