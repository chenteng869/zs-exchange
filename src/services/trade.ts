/**
 * 交易服务层
 *
 * 封装 MatchingEngine，对外暴露业务接口：
 *  - createOrder / cancelOrder
 *  - getOpenOrders / getOrderHistory / getTrades
 *  - getOrderBook / getTicker / getKlines
 *  - subscribeTicker / subscribeOrderBook / subscribeUserTrades
 *
 * 使用：
 *  - 在浏览器/Node 中通过 tradeService.* 调用
 *  - 服务层不直接访问 store，而是调用底层 MatchingEngine
 */

import type {
  ID,
  Kline,
  KlineInterval,
  Order,
  OrderBookSnapshot,
  OrderRequest,
  Paginated,
  Ticker,
  Trade,
  TradingPair,
  User,
} from '@/types/models';
import {
  getMatchingEngine,
  MatchingEngine,
  type EngineEvent,
  type SubmitOrderResult,
} from '@/lib/matching/engine';
import { generateKline, generateTicker, calculate24hStats } from '@/lib/matching/snapshot';

type Unsubscribe = () => void;

/** 简单的 pub/sub 路由。 */
class TopicBus<T> {
  private subs = new Set<(p: T) => void>();
  subscribe(cb: (p: T) => void): Unsubscribe {
    this.subs.add(cb);
    return () => this.subs.delete(cb);
  }
  publish(p: T) {
    for (const cb of Array.from(this.subs)) {
      try {
        cb(p);
      } catch {
        // 忽略
      }
    }
  }
  size() {
    return this.subs.size;
  }
}

export interface TickerUpdate {
  ticker: Ticker;
}
export interface OrderBookUpdate {
  symbol: string;
  snapshot: OrderBookSnapshot;
}
export interface UserTradeUpdate {
  userId: ID;
  trade: Trade;
}

class TradeService {
  private engine: MatchingEngine;
  private tickerBus = new Map<string, TopicBus<TickerUpdate>>();
  private obBus = new Map<string, TopicBus<OrderBookUpdate>>();
  private userTradeBus = new Map<ID, TopicBus<UserTradeUpdate>>();

  constructor(engine: MatchingEngine = getMatchingEngine()) {
    this.engine = engine;
    this.wireEvents();
  }

  // -------------------------------------------------------------------------
  // 写操作
  // -------------------------------------------------------------------------

  /** 创建订单。 */
  async createOrder(user: User, req: OrderRequest): Promise<SubmitOrderResult> {
    return this.engine.submitOrder(user, req);
  }

  /** 撤销订单。 */
  async cancelOrder(userId: ID, orderId: ID): Promise<void> {
    return this.engine.cancelOrder(userId, orderId);
  }

  // -------------------------------------------------------------------------
  // 读操作
  // -------------------------------------------------------------------------

  async getOpenOrders(userId?: ID, symbol?: string): Promise<Order[]> {
    return this.engine.getOpenOrders(userId, symbol);
  }

  /**
   * 订单历史（已成交 + 已撤单）。
   * 当前实现中我们从 engine.orders 取所有 + 过滤。
   */
  async getOrderHistory(params: {
    userId?: ID;
    symbol?: string;
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<Paginated<Order>> {
    const all = this.engine.getOpenOrders(undefined, params.symbol);
    let filtered = all;
    if (params.userId) filtered = filtered.filter((o) => o.userId === params.userId);
    if (params.status) filtered = filtered.filter((o) => o.status === params.status);
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.max(1, Math.min(200, params.pageSize ?? 20));
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    return {
      list: filtered.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }

  /** 取指定 symbol 的最近成交（按时间倒序）。 */
  async getTrades(params: {
    symbol: string;
    userId?: ID;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<Trade>> {
    const list = this.engine.getRecentTrades(params.symbol, 1000);
    const filtered = params.userId ? list.filter((t) => t.userId === params.userId) : list;
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.max(1, Math.min(200, params.pageSize ?? 20));
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    return {
      list: filtered.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }

  async getOrderBook(symbol: string, depth: number = 20): Promise<OrderBookSnapshot> {
    return this.engine.getOrderBook(symbol, depth);
  }

  async getTicker(symbol?: string): Promise<Ticker | Ticker[]> {
    if (symbol) {
      return this.tickerFor(symbol);
    }
    // 无 symbol 时返回所有；需要外部注入 pairs；这里保守返回空
    return [];
  }

  async getKlines(
    symbol: string,
    interval: KlineInterval = '1m',
    limit: number = 200
  ): Promise<Kline[]> {
    const trades = this.engine.getRecentTrades(symbol, 5000).reverse(); // 升序
    const klines = generateKline(trades, interval);
    return klines.slice(-limit);
  }

  // -------------------------------------------------------------------------
  // 订阅
  // -------------------------------------------------------------------------

  subscribeTicker(symbol: string, cb: (u: TickerUpdate) => void): Unsubscribe {
    let bus = this.tickerBus.get(symbol);
    if (!bus) {
      bus = new TopicBus<TickerUpdate>();
      this.tickerBus.set(symbol, bus);
    }
    return bus.subscribe(cb);
  }

  subscribeOrderBook(symbol: string, cb: (u: OrderBookUpdate) => void): Unsubscribe {
    let bus = this.obBus.get(symbol);
    if (!bus) {
      bus = new TopicBus<OrderBookUpdate>();
      this.obBus.set(symbol, bus);
    }
    return bus.subscribe(cb);
  }

  subscribeUserTrades(userId: ID, cb: (u: UserTradeUpdate) => void): Unsubscribe {
    let bus = this.userTradeBus.get(userId);
    if (!bus) {
      bus = new TopicBus<UserTradeUpdate>();
      this.userTradeBus.set(userId, bus);
    }
    return bus.subscribe(cb);
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private wireEvents() {
    const ev: EngineEvent[] = ['orderMatched', 'orderCancelled', 'orderFilled', 'orderAccepted', 'orderRejected'];
    for (const e of ev) {
      this.engine.on(e, (payload: any) => {
        if (e === 'orderMatched') {
          const { trade } = payload ?? {};
          if (!trade) return;
          const symbol = trade.symbol;
          // 推送 ticker / ob / user trade
          this.publishOrderBook(symbol);
          this.publishTicker(symbol);
          const bus = this.userTradeBus.get(trade.userId);
          bus?.publish({ userId: trade.userId, trade });
        } else if (e === 'orderCancelled' || e === 'orderFilled' || e === 'orderAccepted') {
          const order: Order | undefined = payload?.order;
          if (order) {
            this.publishOrderBook(order.symbol);
            this.publishTicker(order.symbol);
          }
        }
      });
    }
  }

  private publishOrderBook(symbol: string) {
    try {
      const snapshot = this.engine.getOrderBook(symbol, 50);
      const bus = this.obBus.get(symbol);
      bus?.publish({ symbol, snapshot });
    } catch {
      // 静默
    }
  }

  private publishTicker(symbol: string) {
    try {
      const t = this.tickerFor(symbol);
      const bus = this.tickerBus.get(symbol);
      bus?.publish({ ticker: t });
    } catch {
      // 静默
    }
  }

  private tickerFor(symbol: string): Ticker {
    const [baseAsset = 'BASE', quoteAsset = 'QUOTE'] = symbol.split('/');
    const book = this.engine.getOrderBook(symbol, 1);
    const trades24h = this.engine.getRecentTrades(symbol, 5000);
    return generateTicker(symbol, baseAsset, quoteAsset, book, trades24h);
  }

  /** 工具：用户日 24h 统计 */
  async get24hStats(symbol: string) {
    const trades = this.engine.getRecentTrades(symbol, 5000);
    return calculate24hStats(trades);
  }
}

/** 暴露当前服务实例（可通过 setTradeService 注入）。 */
let _tradeService: TradeService | null = null;
export function getTradeService(): TradeService {
  if (!_tradeService) _tradeService = new TradeService();
  return _tradeService;
}
export function setTradeService(s: TradeService): void {
  _tradeService = s;
}

export { TradeService };
export type { TradingPair };
