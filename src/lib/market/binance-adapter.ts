/**
 * Binance 行情适配器（兼容现有 MarketFeed 接口）
 *
 * 特性：
 *  - 启动时通过 REST 拉取 24h 行情作为种子
 *  - 通过 WebSocket 订阅实时 ticker / trade 推送
 *  - 提供与 MarketFeed 一致的 subscribe() / getTicker() 等 API
 *  - 连接失败时自动降级到本地模拟数据（不影响演示）
 *  - 自动重连（指数退避 ≤10s）
 *
 * 用法：
 *   const feed = await BinanceMarketFeed.create(['BTC/USDT', 'ETH/USDT']);
 *   feed.subscribe('ticker:BTC/USDT', (t) => console.log(t));
 *   feed.start();
 *   // ...
 *   feed.stop();
 */

import { EventEmitter } from 'events';
import type { Ticker, OrderBook, Trade, Symbol } from './feed';
import type { Kline, KlineInterval } from './kline';
import {
  BinanceRestClient,
  BinanceWsClient,
  type BinanceRestClientOptions,
  type BinanceWsClientOptions,
  toBinanceStream,
  formatSymbol,
  normalize24hTicker,
  normalizeWsTicker,
  normalizeWsTrade,
  normalizeKline,
  type Binance24hTickerRaw,
  type BinanceWsTickerMessage,
  type BinanceWsTradeMessage,
} from './binance-client';

export type FeedMode = 'live' | 'fallback' | 'unknown';

export interface BinanceMarketFeedOptions {
  rest?: BinanceRestClientOptions;
  ws?: BinanceWsClientOptions;
  /** 拉取失败时是否使用 fallback（默认 true） */
  fallbackToSimulated?: boolean;
  /** WebSocket 推送 tick 间隔（毫秒），用于限流 */
  tickIntervalMs?: number;
}

// =============================================================================
// 本地降级 feed（避免演示中断）
// =============================================================================

class FallbackFeed extends EventEmitter {
  private tickers: Map<Symbol, Ticker> = new Map();
  private orderbooks: Map<Symbol, OrderBook> = new Map();
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly intervalMs: number;
  private history: Map<Symbol, { open: number; high: number; low: number; vol: number }> = new Map();

  constructor(intervalMs = 1000) {
    super();
    this.intervalMs = intervalMs;
    this.setMaxListeners(100);
  }

  registerSymbol(symbol: Symbol, basePrice: number): void {
    const now = new Date().toISOString();
    this.tickers.set(symbol, {
      symbol,
      lastPrice: basePrice.toFixed(2),
      bidPrice: (basePrice * 0.9995).toFixed(2),
      askPrice: (basePrice * 1.0005).toFixed(2),
      open24h: basePrice.toFixed(2),
      high24h: basePrice.toFixed(2),
      low24h: basePrice.toFixed(2),
      volume24h: '0',
      change24h: '0',
      updatedAt: now,
    });
    this.history.set(symbol, { open: basePrice, high: basePrice, low: basePrice, vol: 0 });
    this.orderbooks.set(symbol, this.synthOb(symbol, basePrice));
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    for (const [symbol, ticker] of this.tickers) {
      const hist = this.history.get(symbol);
      if (!hist) continue;
      const last = parseFloat(ticker.lastPrice);
      const newPrice = last * (1 + (Math.random() - 0.5) * 0.002);
      const newStr = newPrice.toFixed(2);
      hist.high = Math.max(hist.high, newPrice);
      hist.low = Math.min(hist.low, newPrice);
      hist.vol += Math.random() * 0.5;
      const change = ((newPrice - hist.open) / hist.open) * 100;
      const spread = newPrice * 0.0005;
      const newTicker: Ticker = {
        ...ticker,
        lastPrice: newStr,
        bidPrice: (newPrice - spread).toFixed(2),
        askPrice: (newPrice + spread).toFixed(2),
        high24h: hist.high.toFixed(2),
        low24h: hist.low.toFixed(2),
        volume24h: hist.vol.toFixed(4),
        change24h: change.toFixed(2),
        updatedAt: new Date().toISOString(),
      };
      this.tickers.set(symbol, newTicker);
      this.emit(`ticker:${symbol}`, newTicker);
      if (Math.random() < 0.7) {
        const trade: Trade = {
          id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          symbol,
          price: newStr,
          quantity: (Math.random() * 0.5).toFixed(4),
          side: Math.random() > 0.5 ? 'buy' : 'sell',
          timestamp: new Date().toISOString(),
        };
        this.emit(`trade:${symbol}`, trade);
      }
    }
  }

  private synthOb(symbol: Symbol, price: number): OrderBook {
    const bids = []; const asks = [];
    for (let i = 1; i <= 10; i++) {
      bids.push({ price: (price * (1 - 0.0001 * i)).toFixed(2), quantity: (Math.random() * 5).toFixed(4) });
      asks.push({ price: (price * (1 + 0.0001 * i)).toFixed(2), quantity: (Math.random() * 5).toFixed(4) });
    }
    return { symbol, bids, asks, timestamp: new Date().toISOString() };
  }

  getTicker(symbol: Symbol): Ticker | undefined { return this.tickers.get(symbol); }
  getAllTickers(): Ticker[] { return Array.from(this.tickers.values()); }
  getOrderBook(symbol: Symbol): OrderBook | undefined { return this.orderbooks.get(symbol); }

  subscribe(channel: string, cb: (data: unknown) => void): () => void {
    this.on(channel, cb);
    return () => this.off(channel, cb);
  }
}

// =============================================================================
// BinanceMarketFeed 主类
// =============================================================================

/**
 * 默认种子价格（用于 fallback / REST 拉取失败时的占位）
 */
const DEFAULT_BASE_PRICES: Record<string, number> = {
  'BTC/USDT': 67000,
  'ETH/USDT': 3500,
  'BNB/USDT': 600,
  'SOL/USDT': 150,
  'XRP/USDT': 0.6,
  'ADA/USDT': 0.45,
  'DOGE/USDT': 0.15,
  'AVAX/USDT': 35,
  'TRX/USDT': 0.12,
  'DOT/USDT': 7,
  'MATIC/USDT': 0.7,
  'LINK/USDT': 15,
  'LTC/USDT': 90,
  'BCH/USDT': 480,
  'NEAR/USDT': 6,
  'ATOM/USDT': 8,
  'APT/USDT': 9,
  'OP/USDT': 2.5,
  'ARB/USDT': 1.2,
};

export class BinanceMarketFeed extends EventEmitter {
  private readonly rest: BinanceRestClient;
  private readonly ws: BinanceWsClient;
  private readonly fallback: FallbackFeed;
  private readonly symbols: Symbol[];
  private readonly tickIntervalMs: number;
  private readonly fallbackToSimulated: boolean;

  private tickers: Map<Symbol, Ticker> = new Map();
  private orderbooks: Map<Symbol, OrderBook> = new Map();
  private trades: Map<Symbol, Trade[]> = new Map();
  private lastTickerEmit: Map<Symbol, number> = new Map();

  private mode: FeedMode = 'unknown';
  private wsConnected = false;
  private restOk = false;
  private disposers: Array<() => void> = [];

  private tickTimer: ReturnType<typeof setInterval> | null = null;

  constructor(symbols: Symbol[], opts: BinanceMarketFeedOptions = {}) {
    super();
    this.setMaxListeners(200);
    this.symbols = symbols.map(s => formatSymbol(s));
    this.rest = new BinanceRestClient(opts.rest);
    this.ws = new BinanceWsClient({
      ...opts.ws,
      onOpen: () => {
        this.wsConnected = true;
        if (this.mode !== 'live') this.mode = 'live';
        this.emit('mode', 'live');
        opts.ws?.onOpen?.();
      },
      onClose: (code, reason) => {
        this.wsConnected = false;
        opts.ws?.onClose?.(code, reason);
      },
      onReconnect: (attempt, delay) => {
        opts.ws?.onReconnect?.(attempt, delay);
        this.emit('reconnect', { attempt, delay });
      },
    });
    this.fallback = new FallbackFeed(opts.tickIntervalMs || 1000);
    this.fallbackToSimulated = opts.fallbackToSimulated !== false;
    this.tickIntervalMs = opts.tickIntervalMs || 1000;
  }

  // -------------------------------------------------------------------------
  // 生命周期
  // -------------------------------------------------------------------------

  /**
   * 异步构造：拉取种子 ticker + 建立 WebSocket 订阅
   */
  static async create(symbols: Symbol[], opts?: BinanceMarketFeedOptions): Promise<BinanceMarketFeed> {
    const feed = new BinanceMarketFeed(symbols, opts);
    await feed.bootstrap();
    return feed;
  }

  /** 拉取种子并订阅 */
  private async bootstrap(): Promise<void> {
    // 1. 拉取种子 ticker
    try {
      const tickers = await this.rest.get24hTickers(this.symbols);
      for (const raw of tickers) {
        const t = normalize24hTicker(raw);
        this.tickers.set(t.symbol, t);
      }
      this.restOk = true;
    } catch (err) {
      this.restOk = false;
      this.emit('error', { stage: 'rest', error: err });
    }

    // 2. 若拉取失败或部分缺失，使用默认价格
    for (const sym of this.symbols) {
      if (!this.tickers.has(sym)) {
        const basePrice = DEFAULT_BASE_PRICES[sym] ?? 100;
        this.tickers.set(sym, {
          symbol: sym,
          lastPrice: basePrice.toFixed(2),
          bidPrice: (basePrice * 0.9995).toFixed(2),
          askPrice: (basePrice * 1.0005).toFixed(2),
          open24h: basePrice.toFixed(2),
          high24h: basePrice.toFixed(2),
          low24h: basePrice.toFixed(2),
          volume24h: '0',
          change24h: '0',
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 3. 决定模式
    if (this.restOk) {
      this.mode = 'live';
      // 4. 启动 WebSocket
      this.ws.connect();
      // 5. 订阅 ticker + trade
      for (const sym of this.symbols) {
        this.disposers.push(this.ws.subscribeTicker(sym, (msg) => this.handleTickerUpdate(sym, msg)));
        this.disposers.push(this.ws.subscribeTrade(sym, (msg) => this.handleTradeUpdate(sym, msg)));
      }
    } else {
      // REST 拉取失败 → 直接 fallback
      this.startFallback();
    }
  }

  /** 启动本地降级 */
  private startFallback(): void {
    if (!this.fallbackToSimulated) return;
    this.mode = 'fallback';
    for (const sym of this.symbols) {
      const t = this.tickers.get(sym);
      const basePrice = t ? parseFloat(t.lastPrice) : (DEFAULT_BASE_PRICES[sym] ?? 100);
      this.fallback.registerSymbol(sym, basePrice);
    }
    this.fallback.start();
    // 转发事件
    for (const sym of this.symbols) {
      this.disposers.push(this.fallback.subscribe(`ticker:${sym}`, (t: Ticker) => {
        this.tickers.set(sym, t);
        this.emit(`ticker:${sym}`, t);
      }));
      this.disposers.push(this.fallback.subscribe(`trade:${sym}`, (tr: Trade) => {
        this.pushTrade(sym, tr);
        this.emit(`trade:${sym}`, tr);
      }));
    }
    this.emit('mode', 'fallback');
  }

  /** 启动本地节流 ticker 推送 */
  start(): void {
    if (this.tickTimer) return;
    // 模式确定后自动启动
    if (this.mode === 'live' || this.mode === 'fallback') {
      // ticker 节流推送：每 tickIntervalMs 最多一次
      this.tickTimer = setInterval(() => this.flushTickers(), this.tickIntervalMs);
    }
  }

  stop(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.fallback.stop();
    for (const d of this.disposers) {
      try { d(); } catch { /* ignore */ }
    }
    this.disposers = [];
    this.ws.disconnect();
  }

  // -------------------------------------------------------------------------
  // WebSocket 数据处理
  // -------------------------------------------------------------------------

  private handleTickerUpdate(symbol: Symbol, msg: BinanceWsTickerMessage): void {
    const t = normalizeWsTicker(msg);
    // 强制使用订阅时声明的 symbol 标签
    t.symbol = symbol;
    this.tickers.set(symbol, t);
    this.lastTickerEmit.set(symbol, Date.now());
  }

  private handleTradeUpdate(symbol: Symbol, msg: BinanceWsTradeMessage): void {
    const tr = normalizeWsTrade(msg);
    tr.symbol = symbol;
    this.pushTrade(symbol, tr);
    this.emit(`trade:${symbol}`, tr);
  }

  private pushTrade(symbol: Symbol, tr: Trade): void {
    let arr = this.trades.get(symbol);
    if (!arr) {
      arr = [];
      this.trades.set(symbol, arr);
    }
    arr.push(tr);
    // 保留最近 1000 笔
    if (arr.length > 1000) arr.splice(0, arr.length - 1000);
  }

  /** 节流推送 ticker 事件 */
  private flushTickers(): void {
    for (const [symbol, t] of this.tickers) {
      this.emit(`ticker:${symbol}`, t);
    }
  }

  // -------------------------------------------------------------------------
  // 公共 API（与 MarketFeed 一致）
  // -------------------------------------------------------------------------

  getTicker(symbol: Symbol): Ticker | undefined {
    return this.tickers.get(formatSymbol(symbol));
  }

  getAllTickers(): Ticker[] {
    return Array.from(this.tickers.values());
  }

  getOrderBook(symbol: Symbol): OrderBook | undefined {
    return this.orderbooks.get(formatSymbol(symbol));
  }

  getRecentTrades(symbol: Symbol, limit = 100): Trade[] {
    const arr = this.trades.get(formatSymbol(symbol)) || [];
    return arr.slice(-limit);
  }

  /** 当前模式：live（真实）/ fallback（模拟） */
  getMode(): FeedMode {
    return this.mode;
  }

  isLive(): boolean {
    return this.mode === 'live' && this.wsConnected;
  }

  isFallback(): boolean {
    return this.mode === 'fallback';
  }

  /** 重新尝试连接真实数据 */
  async reconnectLive(): Promise<boolean> {
    if (this.restOk && this.wsConnected) return true;
    this.stop();
    try {
      await this.bootstrap();
      this.start();
      return this.isLive();
    } catch {
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // K 线（按需拉取，不缓存）
  // -------------------------------------------------------------------------

  async getKlines(
    symbol: Symbol,
    interval: KlineInterval,
    opts: { startTime?: number; endTime?: number; limit?: number } = {},
  ): Promise<Kline[]> {
    const sym = formatSymbol(symbol);
    const raws = await this.rest.getKlines(sym, interval, opts);
    return raws.map(r => normalizeKline(r, sym, interval));
  }
}

// =============================================================================
// 工厂函数
// =============================================================================

/**
 * 创建默认 Binance 行情 feed（演示用）
 * 默认订阅：BTC/USDT, ETH/USDT, BNB/USDT, SOL/USDT 等主流交易对
 */
export async function createDefaultBinanceMarketFeed(
  symbols?: Symbol[],
  opts?: BinanceMarketFeedOptions,
): Promise<BinanceMarketFeed> {
  const defaultSymbols: Symbol[] = symbols || [
    'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT',
    'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT',
    'TRX/USDT', 'DOT/USDT', 'MATIC/USDT', 'LINK/USDT',
    'LTC/USDT', 'BCH/USDT', 'NEAR/USDT', 'ATOM/USDT',
  ];
  return BinanceMarketFeed.create(defaultSymbols, opts);
}
