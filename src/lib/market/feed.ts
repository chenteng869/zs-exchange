/**
 * 行情数据源（MarketFeed）
 *
 * 模拟 50+ 交易对的实时行情推送：
 *  - 价格基准：可配置
 *  - 波动：几何布朗运动 GBM
 *  - tick 间隔：1 秒
 *  - 推送：ticker / orderbook / trades
 */

import { EventEmitter } from 'events';

// =============================================================================
// 类型
// =============================================================================

export type Symbol = string;

export interface Ticker {
  symbol: Symbol;
  lastPrice: string;
  bidPrice: string;
  askPrice: string;
  open24h: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  change24h: string;
  updatedAt: string;
}

export interface OrderBookLevel {
  price: string;
  quantity: string;
}

export interface OrderBook {
  symbol: Symbol;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: string;
}

export interface Trade {
  id: string;
  symbol: Symbol;
  price: string;
  quantity: string;
  side: 'buy' | 'sell';
  timestamp: string;
}

// =============================================================================
// 简易随机数（GBM）
// =============================================================================

function gbmStep(price: number, mu: number, sigma: number, dt: number, rand: () => number): number {
  // 几何布朗运动：S(t+dt) = S(t) * exp((mu - 0.5*sigma^2)*dt + sigma*sqrt(dt)*Z)
  const z = rand();
  const drift = (mu - 0.5 * sigma * sigma) * dt;
  const shock = sigma * Math.sqrt(dt) * z;
  return price * Math.exp(drift + shock);
}

function gauss(): number {
  // Box-Muller 正态分布
  const u1 = Math.random() || 1e-9;
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// =============================================================================
// 行情数据源
// =============================================================================

export class MarketFeed extends EventEmitter {
  private tickers: Map<Symbol, Ticker> = new Map();
  private orderbooks: Map<Symbol, OrderBook> = new Map();
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly intervalMs: number;
  /** 模拟历史 24h OHLC（用于 ticker） */
  private history: Map<Symbol, { open: number; high: number; low: number; vol: number }> = new Map();

  constructor(intervalMs: number = 1000) {
    super();
    this.intervalMs = intervalMs;
    this.setMaxListeners(100);
  }

  /**
   * 注册交易对（带价格基准）
   */
  registerSymbol(symbol: Symbol, basePrice: number): void {
    const now = new Date().toISOString();
    const t: Ticker = {
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
    };
    this.tickers.set(symbol, t);
    this.history.set(symbol, { open: basePrice, high: basePrice, low: basePrice, vol: 0 });
    this.orderbooks.set(symbol, this.synthOrderbook(symbol, basePrice));
  }

  /**
   * 启动定时推送
   */
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

  /**
   * 单次 tick：所有交易对走一步 GBM，更新 ticker/orderbook/trades
   */
  private tick(): void {
    for (const [symbol, ticker] of this.tickers) {
      const hist = this.history.get(symbol);
      if (!hist) continue;
      const last = parseFloat(ticker.lastPrice);
      // 参数：mu 0、sigma 0.005（约 0.5% 波动/秒）
      const newPrice = gbmStep(last, 0, 0.005, 1, gauss);
      const newStr = newPrice.toFixed(2);

      // 更新 24h
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

      // 订单簿更新
      const ob = this.synthOrderbook(symbol, newPrice);
      this.orderbooks.set(symbol, ob);
      this.emit(`depth:${symbol}`, ob);

      // 模拟成交
      if (Math.random() < 0.7) {
        const trade: Trade = {
          id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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

  private synthOrderbook(symbol: Symbol, price: number): OrderBook {
    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];
    for (let i = 1; i <= 10; i++) {
      bids.push({ price: (price * (1 - 0.0001 * i)).toFixed(2), quantity: (Math.random() * 5).toFixed(4) });
      asks.push({ price: (price * (1 + 0.0001 * i)).toFixed(2), quantity: (Math.random() * 5).toFixed(4) });
    }
    return { symbol, bids, asks, timestamp: new Date().toISOString() };
  }

  getTicker(symbol: Symbol): Ticker | undefined {
    return this.tickers.get(symbol);
  }

  getAllTickers(): Ticker[] {
    return Array.from(this.tickers.values());
  }

  getOrderBook(symbol: Symbol): OrderBook | undefined {
    return this.orderbooks.get(symbol);
  }

  /**
   * 订阅频道
   * @returns 取消订阅函数
   */
  subscribe(channel: string, cb: (data: unknown) => void): () => void {
    this.on(channel, cb);
    return () => this.off(channel, cb);
  }
}

// =============================================================================
// 默认初始化：50+ 主流交易对
// =============================================================================

export const DEFAULT_SYMBOLS: Array<[string, number]> = [
  ['BTC/USDT', 67000],
  ['ETH/USDT', 3500],
  ['BNB/USDT', 600],
  ['SOL/USDT', 150],
  ['XRP/USDT', 0.6],
  ['ADA/USDT', 0.45],
  ['DOGE/USDT', 0.15],
  ['AVAX/USDT', 35],
  ['TRX/USDT', 0.12],
  ['DOT/USDT', 7],
  ['MATIC/USDT', 0.7],
  ['LINK/USDT', 15],
  ['LTC/USDT', 90],
  ['BCH/USDT', 480],
  ['NEAR/USDT', 6],
  ['ATOM/USDT', 8],
  ['APT/USDT', 9],
  ['OP/USDT', 2.5],
  ['ARB/USDT', 1.2],
  ['INJ/USDT', 25],
  ['TIA/USDT', 11],
  ['SUI/USDT', 1.5],
  ['SEI/USDT', 0.6],
  ['ORDI/USDT', 50],
  ['WLD/USDT', 7],
  ['PEPE/USDT', 0.00001],
  ['SHIB/USDT', 0.000025],
  ['FLOKI/USDT', 0.00018],
  ['WIF/USDT', 2.5],
  ['BONK/USDT', 0.000025],
  ['JTO/USDT', 4],
  ['JUP/USDT', 1.2],
  ['PYTH/USDT', 0.5],
  ['MEME/USDT', 0.03],
  ['STRK/USDT', 1.5],
  ['MANTA/USDT', 2.2],
  ['ALT/USDT', 0.3],
  ['PIXEL/USDT', 0.4],
  ['PORTAL/USDT', 0.5],
  ['MYRO/USDT', 0.2],
  ['DYM/USDT', 2],
  ['ONDO/USDT', 1.2],
  ['ENA/USDT', 1.5],
  ['ETHFI/USDT', 3.5],
  ['BOME/USDT', 0.008],
  ['NOT/USDT', 0.012],
  ['TON/USDT', 7],
  ['WBT/USDT', 67000],
  ['USDC/USDT', 1],
  ['FDUSD/USDT', 1],
];

export function createDefaultMarket(): MarketFeed {
  const feed = new MarketFeed(1000);
  DEFAULT_SYMBOLS.forEach(([sym, price]) => feed.registerSymbol(sym, price));
  return feed;
}
