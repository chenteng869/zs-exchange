/**
 * Binance 行情数据接入
 *
 * 提供：
 *  - REST 客户端（现货 ticker / 24h 行情 / K 线 / 深度）
 *  - WebSocket 客户端（实时 ticker / trade / kline / depth 推送）
 *  - 标准化数据转换层（与现有 MarketFeed / Kline 类型兼容）
 *  - 自动重连机制（指数退避，最大 10 秒）
 *  - 降级回退（连接失败时回退到本地模拟数据，确保演示不中断）
 *
 * API 文档：https://binance-docs.github.io/apidocs/spot/en/
 *
 * 注意：本模块在浏览器与 Node.js 18+ 环境中均可运行（使用原生 fetch / WebSocket）。
 *      演示环境默认使用 Binance 公共接口，无需 API key。
 */

import type { Ticker, OrderBook, Trade, Symbol } from './feed';
import type { Kline, KlineInterval } from './kline';

// =============================================================================
// 配置
// =============================================================================

/** Binance 公共 REST API（无需鉴权） */
export const BINANCE_REST_BASE = 'https://api.binance.com';
/** Binance 公共 WebSocket（市场数据） */
export const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/ws';
/** 组合流（推荐，性能更佳） */
export const BINANCE_WS_COMBINED = 'wss://stream.binance.com:9443/stream';

/** 默认请求超时（毫秒） */
export const DEFAULT_TIMEOUT_MS = 10_000;
/** 默认重连最大延迟（毫秒） */
export const DEFAULT_MAX_RECONNECT_MS = 10_000;
/** 默认初始重连延迟（毫秒） */
export const DEFAULT_INITIAL_RECONNECT_MS = 500;

// =============================================================================
// 自定义错误
// =============================================================================

export class BinanceError extends Error {
  public readonly code: string;
  public readonly status?: number;
  constructor(code: string, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'BinanceError';
  }
}

// =============================================================================
// REST 类型
// =============================================================================

/** Binance /api/v3/ticker/24hr 原始返回 */
export interface Binance24hTickerRaw {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

/** Binance /api/v3/klines 原始 K 线（数组形式） */
export type BinanceKlineRaw = [
  number, // [0] openTime
  string, // [1] open
  string, // [2] high
  string, // [3] low
  string, // [4] close
  string, // [5] volume
  number, // [6] closeTime
  string, // [7] quoteAssetVolume
  number, // [8] numberOfTrades
  string, // [9] takerBuyBaseAssetVolume
  string, // [10] takerBuyQuoteAssetVolume
  string, // [11] ignore
];

/** Binance /api/v3/depth 原始返回 */
export interface BinanceDepthRaw {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

/**
 * Binance /api/v3/trades 原始返回（最近成交）
 * 文档：https://binance-docs.github.io/apidocs/spot/en/#recent-trades-list
 */
export interface BinanceRecentTradeRaw {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

// =============================================================================
// WebSocket 类型
// =============================================================================

export interface BinanceWsTickerMessage {
  e: '24hrTicker';
  E: number;
  s: string;
  p: string;        // priceChange
  P: string;        // priceChangePercent
  c: string;        // lastPrice
  b: string;        // bestBidPrice
  a: string;        // bestAskPrice
  o: string;        // openPrice
  h: string;        // highPrice
  l: string;        // lowPrice
  v: string;        // volume
  q: string;        // quoteVolume
  T?: number;       // closeTime
}

export interface BinanceWsTradeMessage {
  e: 'trade';
  E: number;
  s: string;
  t: number;        // tradeId
  p: string;        // price
  q: string;        // quantity
  T: number;        // tradeTime
  m: boolean;       // isBuyerMarketMaker (true = sell)
}

export interface BinanceWsDepthMessage {
  e: 'depthUpdate';
  E: number;
  s: string;
  U: number;
  u: number;
  b: [string, string][];
  a: [string, string][];
}

export interface BinanceWsKlineMessage {
  e: 'kline';
  E: number;
  s: string;
  k: {
    t: number;       // startTime
    T: number;       // endTime
    s: string;
    i: string;       // interval
    o: string;       // open
    c: string;       // close
    h: string;       // high
    l: string;       // low
    v: string;       // volume
    n: number;       // trades
    x: boolean;      // isClosed
  };
}

export interface BinanceWsCombinedMessage {
  stream: string;
  data: BinanceWsTickerMessage | BinanceWsTradeMessage | BinanceWsDepthMessage | BinanceWsKlineMessage;
}

// =============================================================================
// 工具函数
// =============================================================================

/** 将 "BTCUSDT" 转换为 "BTC/USDT" 显示格式 */
export function formatSymbol(raw: string, quote = 'USDT'): string {
  if (raw.includes('/')) return raw;
  if (raw.endsWith(quote)) {
    const base = raw.slice(0, -quote.length);
    return `${base}/${quote}`;
  }
  return raw;
}

/** 将 "BTC/USDT" 转换为 Binance 使用的 "btcusdt" 小写流名 */
export function toBinanceStream(symbol: string, lower = true): string {
  const noSlash = symbol.replace('/', '').toLowerCase();
  return lower ? noSlash : symbol.replace('/', '').toUpperCase();
}

/** 安全数字转换（保留 8 位精度） */
function toFixed8(n: string | number): string {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  if (!Number.isFinite(v)) return '0';
  return v.toFixed(8);
}

/** 将 24h ticker 原始数据转换为标准 Ticker */
export function normalize24hTicker(raw: Binance24hTickerRaw, quoteAsset = 'USDT'): Ticker {
  return {
    symbol: formatSymbol(raw.symbol, quoteAsset),
    lastPrice: toFixed8(raw.lastPrice),
    bidPrice: toFixed8(raw.bidPrice),
    askPrice: toFixed8(raw.askPrice),
    open24h: toFixed8(raw.openPrice),
    high24h: toFixed8(raw.highPrice),
    low24h: toFixed8(raw.lowPrice),
    volume24h: toFixed8(raw.volume),
    change24h: toFixed8(raw.priceChangePercent),
    updatedAt: new Date().toISOString(),
  };
}

/** 将 WebSocket ticker 消息转换为标准 Ticker */
export function normalizeWsTicker(raw: BinanceWsTickerMessage, quoteAsset = 'USDT'): Ticker {
  return {
    symbol: formatSymbol(raw.s, quoteAsset),
    lastPrice: toFixed8(raw.c),
    bidPrice: toFixed8(raw.b),
    askPrice: toFixed8(raw.a),
    open24h: toFixed8(raw.o),
    high24h: toFixed8(raw.h),
    low24h: toFixed8(raw.l),
    volume24h: toFixed8(raw.v),
    change24h: toFixed8(raw.P),
    updatedAt: new Date(raw.E || Date.now()).toISOString(),
  };
}

/** 将 WebSocket trade 消息转换为标准 Trade */
export function normalizeWsTrade(raw: BinanceWsTradeMessage): Trade {
  return {
    id: String(raw.t),
    symbol: formatSymbol(raw.s),
    price: toFixed8(raw.p),
    quantity: toFixed8(raw.q),
    side: raw.m ? 'sell' : 'buy', // m=true 为主动卖
    timestamp: new Date(raw.T).toISOString(),
  };
}

/**
 * 跨源（WebSocket + REST）标准化逐笔成交
 * - 字段统一为 string 以避免浮点精度丢失（price / qty 不参与 number 运算）
 * - isBuyerMaker: true 表示买方为主动吃单（撮合后是 sell 方）
 * - source 标记数据来源：'ws' | 'rest' | 'mock'
 */
export interface NormalizedTrade {
  symbol: string;
  price: string;
  qty: string;
  time: number;            // 毫秒时间戳
  isBuyerMaker: boolean;
  tradeId: string;
  source: 'ws' | 'rest' | 'mock';
}

/** 将 WebSocket trade 原始消息转换为 NormalizedTrade */
export function normalizeTradeWs(raw: BinanceWsTradeMessage, source: 'ws' | 'mock' = 'ws'): NormalizedTrade {
  return {
    symbol: formatSymbol(raw.s),
    price: toFixed8(raw.p),
    qty: toFixed8(raw.q),
    time: raw.T,
    isBuyerMaker: raw.m,
    tradeId: String(raw.t),
    source,
  };
}

/** 将 REST /api/v3/trades 原始消息转换为 NormalizedTrade */
export function normalizeTradeRest(raw: BinanceRecentTradeRaw): NormalizedTrade {
  return {
    symbol: formatSymbol(String(raw.id), 'USDT'), // 占位，下游必须用入参 symbol 覆盖
    price: toFixed8(raw.price),
    qty: toFixed8(raw.qty),
    time: raw.time,
    isBuyerMaker: raw.isBuyerMaker,
    tradeId: String(raw.id),
    source: 'rest',
  };
}

/**
 * 将 REST 原始成交 + 入参 symbol 合并为标准结构
 * （REST 返回不带 symbol 字段，需要调用方补上）
 */
export function normalizeTradeRestWithSymbol(raw: BinanceRecentTradeRaw, symbol: string): NormalizedTrade {
  return {
    ...normalizeTradeRest(raw),
    symbol: formatSymbol(symbol),
  };
}

/** 将 K 线原始数组转换为标准 Kline */
export function normalizeKline(raw: BinanceKlineRaw, symbol: string, interval: KlineInterval): Kline {
  return {
    openTime: raw[0],
    open: toFixed8(raw[1]),
    high: toFixed8(raw[2]),
    low: toFixed8(raw[3]),
    close: toFixed8(raw[4]),
    volume: toFixed8(raw[5]),
    closeTime: raw[6],
    trades: raw[8],
  };
}

/** 将 WebSocket depth 消息转换为标准 OrderBook */
export function normalizeDepth(
  symbol: string,
  bids: [string, string][],
  asks: [string, string][],
  timestamp?: number,
): OrderBook {
  return {
    symbol: formatSymbol(symbol),
    bids: bids.slice(0, 20).map(([p, q]) => ({ price: toFixed8(p), quantity: toFixed8(q) })),
    asks: asks.slice(0, 20).map(([p, q]) => ({ price: toFixed8(p), quantity: toFixed8(q) })),
    timestamp: new Date(timestamp || Date.now()).toISOString(),
  };
}

// =============================================================================
// REST 客户端
// =============================================================================

export interface BinanceRestClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  /** 自定义 fetch 实现（用于测试或 SSR polyfill） */
  fetchImpl?: typeof fetch;
}

export class BinanceRestClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: BinanceRestClientOptions = {}) {
    this.baseUrl = opts.baseUrl || BINANCE_REST_BASE;
    this.timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT_MS;
    this.fetchImpl = opts.fetchImpl || (typeof fetch !== 'undefined' ? fetch : (() => {
      throw new BinanceError('NO_FETCH', 'No fetch implementation available');
    })() as typeof fetch);
  }

  /**
   * 通用请求方法
   */
  private async request<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) qs.set(k, String(v));
    const url = `${this.baseUrl}${path}${qs.toString() ? '?' + qs.toString() : ''}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(url, { signal: controller.signal });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new BinanceError(
          `HTTP_${res.status}`,
          `Binance API ${res.status}: ${body || res.statusText}`,
          res.status,
        );
      }
      return await res.json() as T;
    } catch (err) {
      if (err instanceof BinanceError) throw err;
      if ((err as Error).name === 'AbortError') {
        throw new BinanceError('TIMEOUT', `Binance request timeout after ${this.timeoutMs}ms`);
      }
      throw new BinanceError('NETWORK', `Binance request failed: ${(err as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Ping 服务连通性
   */
  async ping(): Promise<boolean> {
    try {
      await this.request<unknown>('/api/v3/ping');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 服务器时间（毫秒）
   */
  async serverTime(): Promise<number> {
    const r = await this.request<{ serverTime: number }>('/api/v3/time');
    return r.serverTime;
  }

  /**
   * 获取单个交易对的 24h ticker
   */
  async get24hTicker(symbol: string): Promise<Binance24hTickerRaw> {
    return this.request<Binance24hTickerRaw>('/api/v3/ticker/24hr', { symbol: toBinanceStream(symbol, false) });
  }

  /**
   * 批量获取 24h tickers（可指定 symbols 子集）
   */
  async get24hTickers(symbols?: string[]): Promise<Binance24hTickerRaw[]> {
    if (symbols && symbols.length > 0) {
      // Binance 支持 symbols 数组（POST 或 query）
      const symParam = JSON.stringify(symbols.map(s => toBinanceStream(s, false)));
      return this.request<Binance24hTickerRaw[]>('/api/v3/ticker/24hr', { symbols: symParam });
    }
    return this.request<Binance24hTickerRaw[]>('/api/v3/ticker/24hr');
  }

  /**
   * 获取当前最优买卖价
   */
  async getBookTicker(symbol: string): Promise<{ symbol: string; bidPrice: string; askPrice: string }> {
    return this.request('/api/v3/ticker/bookTicker', { symbol: toBinanceStream(symbol, false) });
  }

  /**
   * 获取 K 线
   */
  async getKlines(
    symbol: string,
    interval: KlineInterval,
    opts: { startTime?: number; endTime?: number; limit?: number } = {},
  ): Promise<BinanceKlineRaw[]> {
    const params: Record<string, string | number> = { symbol: toBinanceStream(symbol, false), interval };
    if (opts.startTime) params.startTime = opts.startTime;
    if (opts.endTime) params.endTime = opts.endTime;
    if (opts.limit) params.limit = Math.min(Math.max(opts.limit, 1), 1000);
    return this.request<BinanceKlineRaw[]>('/api/v3/klines', params);
  }

  /**
   * 获取订单簿深度
   */
  async getDepth(symbol: string, limit: 5 | 10 | 20 | 50 | 100 | 500 | 1000 = 20): Promise<BinanceDepthRaw> {
    return this.request<BinanceDepthRaw>('/api/v3/depth', {
      symbol: toBinanceStream(symbol, false),
      limit,
    });
  }

  /**
   * 获取最近成交（Recent trades）
   *
   * @param symbol 交易对（支持 "BTC/USDT" 或 "BTCUSDT"）
   * @param limit  返回条数（1-1000，默认 500）
   * @returns Binance REST 原始格式列表
   *
   * 注意：Binance 该接口限流较严（按 IP 权重 5），建议搭配 WebSocket 实时推送使用。
   */
  async getRecentTradesRaw(symbol: string, limit = 500): Promise<BinanceRecentTradeRaw[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 1000);
    return this.request<BinanceRecentTradeRaw[]>('/api/v3/trades', {
      symbol: toBinanceStream(symbol, false),
      limit: safeLimit,
    });
  }

  /**
   * 获取最近成交并直接标准化为 NormalizedTrade[]
   *
   * @param symbol 交易对
   * @param limit  返回条数（1-1000，默认 50）
   */
  async fetchRecentTrades(symbol: string, limit = 50): Promise<NormalizedTrade[]> {
    const raw = await this.getRecentTradesRaw(symbol, limit);
    return raw.map(r => normalizeTradeRestWithSymbol(r, symbol));
  }
}

// =============================================================================
// WebSocket 客户端（带自动重连）
// =============================================================================

export type WsChannel = 'ticker' | 'trade' | 'kline' | 'depth';

export interface BinanceWsClientOptions {
  url?: string;
  initialReconnectMs?: number;
  maxReconnectMs?: number;
  /** 自定义 WebSocket 构造器（用于测试或 Node < 22 兼容） */
  WebSocketImpl?: typeof WebSocket;
  /** 心跳间隔（毫秒），默认 30000 */
  heartbeatMs?: number;
  /** 连接成功回调 */
  onOpen?: () => void;
  /** 连接关闭回调（reason 由实现决定） */
  onClose?: (code: number, reason: string) => void;
  /** 重连尝试回调 */
  onReconnect?: (attempt: number, delayMs: number) => void;
}

export type WsMessageHandler =
  | ((msg: BinanceWsTickerMessage) => void)
  | ((msg: BinanceWsTradeMessage) => void)
  | ((msg: BinanceWsDepthMessage) => void)
  | ((msg: BinanceWsKlineMessage) => void)
  | ((msg: unknown) => void);

/**
 * Binance 组合流 WebSocket 客户端
 *
 * 用法：
 *   const ws = new BinanceWsClient();
 *   ws.subscribeTicker('BTC/USDT', (t) => console.log(t));
 *   ws.connect();
 *   // 之后：ws.disconnect();
 */
export class BinanceWsClient {
  private readonly url: string;
  private readonly initialReconnectMs: number;
  private readonly maxReconnectMs: number;
  private readonly WebSocketImpl: typeof WebSocket;
  private readonly heartbeatMs: number;
  private readonly onOpen?: () => void;
  private readonly onClose?: (code: number, reason: string) => void;
  private readonly onReconnect?: (attempt: number, delayMs: number) => void;

  private ws: WebSocket | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isClosing = false;
  private isConnected = false;
  /** 流订阅：{ streamName: Set<handler> } */
  private subscriptions: Map<string, Set<WsMessageHandler>> = new Map();
  /** 待发送订阅消息（连接成功后发送） */
  private pendingSubscribes: Set<string> = new Set();

  constructor(opts: BinanceWsClientOptions = {}) {
    this.url = opts.url || BINANCE_WS_COMBINED;
    this.initialReconnectMs = opts.initialReconnectMs || DEFAULT_INITIAL_RECONNECT_MS;
    this.maxReconnectMs = opts.maxReconnectMs || DEFAULT_MAX_RECONNECT_MS;
    this.WebSocketImpl = opts.WebSocketImpl || (typeof WebSocket !== 'undefined' ? WebSocket : (() => {
      throw new BinanceError('NO_WEBSOCKET', 'No WebSocket implementation available');
    })() as typeof WebSocket);
    this.heartbeatMs = opts.heartbeatMs || 30_000;
    this.onOpen = opts.onOpen;
    this.onClose = opts.onClose;
    this.onReconnect = opts.onReconnect;
  }

  /** 是否已连接 */
  get connected(): boolean {
    return this.isConnected;
  }

  /** 启动连接 */
  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.isClosing = false;
    try {
      this.ws = new this.WebSocketImpl(this.url);
    } catch (err) {
      this.scheduleReconnect();
      return;
    }
    this.ws.onopen = () => this.handleOpen();
    this.ws.onmessage = (ev) => this.handleMessage(ev);
    this.ws.onerror = () => { /* 错误由 onclose 接管 */ };
    this.ws.onclose = (ev) => this.handleClose(ev);
  }

  /** 主动断开（不会触发自动重连） */
  disconnect(): void {
    this.isClosing = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close(1000, 'client_close');
      } catch { /* ignore */ }
      this.ws = null;
    }
    this.isConnected = false;
  }

  /** 订阅 ticker 频道 */
  subscribeTicker(symbol: string, handler: (msg: BinanceWsTickerMessage) => void): () => void {
    return this.subscribe(`${toBinanceStream(symbol)}@ticker`, handler as WsMessageHandler);
  }

  /** 订阅 trade 频道 */
  subscribeTrade(symbol: string, handler: (msg: BinanceWsTradeMessage) => void): () => void {
    return this.subscribe(`${toBinanceStream(symbol)}@trade`, handler as WsMessageHandler);
  }

  /**
   * 批量订阅多个交易对的 trade 流
   *
   * 内部合并到同一条 WebSocket 连接，自动构造 `<sym>@trade` 流名。
   * 回调每次只收到对应交易对的 NormalizedTrade（已标准化、可直接用于 UI 展示）。
   *
   * @param symbols 交易对列表（支持 "BTC/USDT" 或 "BTCUSDT"）
   * @param onTrade 单笔成交回调
   * @returns 取消订阅函数（会一并取消所有订阅并清理内部状态）
   *
   * @example
   *   const unsub = client.subscribeTrades(['BTC/USDT', 'ETH/USDT'], (t) => {
   *     console.log(t.symbol, t.price, t.qty, t.isBuyerMaker);
   *   });
   *   // 之后：unsub();
   */
  subscribeTrades(symbols: string[], onTrade: (trade: NormalizedTrade) => void): () => void {
    const unsubs: Array<() => void> = [];
    for (const sym of symbols) {
      const u = this.subscribe(
        `${toBinanceStream(sym)}@trade`,
        ((msg: unknown) => {
          // 双保险：上游 handleMessage 已经只把 data 传过来
          if (typeof msg === 'object' && msg !== null && 'e' in (msg as Record<string, unknown>)) {
            onTrade(normalizeTradeWs(msg as BinanceWsTradeMessage, 'ws'));
          }
        }) as WsMessageHandler,
      );
      unsubs.push(u);
    }
    return () => {
      for (const u of unsubs) {
        try { u(); } catch { /* ignore */ }
      }
      unsubs.length = 0;
    };
  }

  /** 订阅 depth 频道（默认 20 档 100ms 推送） */
  subscribeDepth(symbol: string, handler: (msg: BinanceWsDepthMessage) => void, level: 5 | 10 | 20 = 20): () => void {
    return this.subscribe(`${toBinanceStream(symbol)}@depth${level}@100ms`, handler as WsMessageHandler);
  }

  /** 订阅 kline 频道 */
  subscribeKline(symbol: string, interval: KlineInterval, handler: (msg: BinanceWsKlineMessage) => void): () => void {
    return this.subscribe(`${toBinanceStream(symbol)}@kline_${interval}`, handler as WsMessageHandler);
  }

  /** 通用订阅（推荐） */
  private subscribe(stream: string, handler: WsMessageHandler): () => void {
    let set = this.subscriptions.get(stream);
    if (!set) {
      set = new Set();
      this.subscriptions.set(stream, set);
    }
    set.add(handler);

    // 第一次订阅时通知服务端
    if (set.size === 1) {
      this.sendSubscribeMessage([stream]);
    }

    // 返回取消订阅函数
    return () => {
      const s = this.subscriptions.get(stream);
      if (!s) return;
      s.delete(handler);
      if (s.size === 0) {
        this.subscriptions.delete(stream);
        this.sendUnsubscribeMessage([stream]);
      }
    };
  }

  private sendSubscribeMessage(streams: string[]): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: streams,
        id: Date.now(),
      }));
    } else {
      for (const s of streams) this.pendingSubscribes.add(s);
    }
  }

  private sendUnsubscribeMessage(streams: string[]): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        method: 'UNSUBSCRIBE',
        params: streams,
        id: Date.now(),
      }));
    } else {
      for (const s of streams) this.pendingSubscribes.delete(s);
    }
  }

  private handleOpen(): void {
    this.isConnected = true;
    this.reconnectAttempt = 0;
    // 重新订阅之前的所有流
    const allStreams = Array.from(this.subscriptions.keys());
    if (allStreams.length > 0) {
      this.ws?.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: allStreams,
        id: Date.now(),
      }));
    }
    for (const s of this.pendingSubscribes) {
      if (!allStreams.includes(s)) {
        allStreams.push(s);
      }
    }
    this.pendingSubscribes.clear();

    // 启动心跳
    if (this.heartbeatMs > 0) {
      this.heartbeatTimer = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          try { this.ws.send(JSON.stringify({ method: 'PING' })); } catch { /* ignore */ }
        }
      }, this.heartbeatMs);
    }

    this.onOpen?.();
  }

  private handleMessage(ev: MessageEvent): void {
    let payload: unknown;
    try {
      payload = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
    } catch {
      return;
    }
    // 组合流格式：{ stream, data }
    let stream: string | null = null;
    let data: unknown = payload;
    if (typeof payload === 'object' && payload !== null && 'stream' in payload && 'data' in (payload as Record<string, unknown>)) {
      const cm = payload as BinanceWsCombinedMessage;
      stream = cm.stream;
      data = cm.data;
    } else if (typeof payload === 'object' && payload !== null && 'e' in payload) {
      // 单流格式：直接从 e 字段推 stream 名
      const evt = payload as { e: string; s: string };
      stream = `${evt.s.toLowerCase()}@${evt.e}`;
    }
    if (!stream) return;
    const handlers = this.subscriptions.get(stream);
    if (!handlers) return;
    for (const h of handlers) {
      try {
        // WsMessageHandler 是 (Ticker|Trade|Depth|Kline|unknown) => void 的并集
        // TypeScript 出于逆变 + 联合推断会把参数推为 never，这里强制收敛到 unknown
        (h as (msg: unknown) => void)(data);
      } catch (err) {
        // 避免单个 handler 异常中断其他 handler
        // eslint-disable-next-line no-console
        console.error('[BinanceWsClient] handler error:', err);
      }
    }
  }

  private handleClose(ev: CloseEvent): void {
    this.isConnected = false;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.onClose?.(ev.code, ev.reason);
    if (this.isClosing) return;
    this.scheduleReconnect();
  }

  /**
   * 安排重连（指数退避，最大不超过 maxReconnectMs）
   * - 500ms, 1s, 2s, 4s, 8s, 10s, 10s ...
   */
  private scheduleReconnect(): void {
    if (this.isClosing) return;
    this.reconnectAttempt += 1;
    const base = this.initialReconnectMs * Math.pow(2, this.reconnectAttempt - 1);
    const delay = Math.min(base, this.maxReconnectMs);
    this.onReconnect?.(this.reconnectAttempt, delay);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

// =============================================================================
// 默认导出便捷工厂
// =============================================================================

export function createBinanceRestClient(opts?: BinanceRestClientOptions): BinanceRestClient {
  return new BinanceRestClient(opts);
}

export function createBinanceWsClient(opts?: BinanceWsClientOptions): BinanceWsClient {
  return new BinanceWsClient(opts);
}
