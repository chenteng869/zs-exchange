/**
 * 多交易对撮合引擎 (单例)
 *
 *  - orderbooks: Map<symbol, OrderBook>
 *  - submitOrder: 校验 -> 冻结 -> 撮合 -> 结算 -> 入簿
 *  - cancelOrder: 撤单 + 解冻
 *  - 提供事件订阅
 *
 * 注意：本实现在内存中运行；生产环境需替换为持久化 + 分布式锁。
 */

import { EventEmitter } from 'events';
import type {
  Balance,
  ID,
  MatchResult,
  Order,
  OrderBookSnapshot,
  OrderRequest,
  Trade,
  TradingPair,
  User,
} from '@/types/models';
import { OrderBook, type InternalOrder } from './orderbook';
import { decAdd, decCmp, decDiv, decIsPositive, decIsZero, decMul, decSub, decTruncate } from './decimal';
import { OrderError, SettlementError } from './errors';
import { validateOrderRequest } from './validator';
import { Freezer } from '@/lib/settlement/freeze';
import { Settler, type SettleMatchResult } from '@/lib/settlement/settler';
import { globalLedger } from '@/lib/settlement/ledger';
import { logger } from '@/lib/logger';

export type EngineEvent = 'orderMatched' | 'orderCancelled' | 'orderRejected' | 'orderAccepted' | 'orderFilled';

export interface SubmitOrderOptions {
  /** 跳过验证（仅测试/撮合内部使用） */
  skipValidate?: boolean;
  /** 跳过自成交检测 */
  preventSelfTrade?: boolean;
}

export interface SubmitOrderResult {
  order: Order;
  trades: Trade[];
  matchResults: MatchResult[];
  settlements: SettleMatchResult[];
  /** 撤单信息（IOC/FOK/失败时） */
  cancelled?: { id: ID; remaining: string; reason: string };
}

export interface MatchingEngineDeps {
  freezer?: Freezer;
  settler?: Settler;
  /** 用户加载器（外部服务） */
  loadUser?: (userId: ID) => User | undefined;
  loadPair?: (symbol: string) => TradingPair | undefined;
}

export class MatchingEngine {
  private readonly orderbooks = new Map<string, OrderBook>();
  private readonly orders = new Map<ID, Order>();
  private readonly userOrders = new Map<ID, Set<ID>>(); // userId -> orderId set (open)
  private readonly tradesBySymbol = new Map<string, Trade[]>();
  private readonly recentTradeCap = 1000;
  private readonly emitter = new EventEmitter();
  private readonly freezer: Freezer;
  private readonly settler: Settler;
  private readonly deps: MatchingEngineDeps;

  constructor(deps: MatchingEngineDeps = {}) {
    this.deps = deps;
    this.freezer = deps.freezer ?? new Freezer(globalLedger);
    this.settler = deps.settler ?? new Settler(this.freezer);
  }

  // -------------------------------------------------------------------------
  // 事件
  // -------------------------------------------------------------------------

  on(event: EngineEvent, listener: (payload: unknown) => void): this {
    this.emitter.on(event, listener);
    return this;
  }
  off(event: EngineEvent, listener: (payload: unknown) => void): this {
    this.emitter.off(event, listener);
    return this;
  }
  private emit(event: EngineEvent, payload: unknown) {
    try {
      this.emitter.emit(event, payload);
    } catch (e) {
      logger.error('[engine] listener error', e);
    }
  }

  // -------------------------------------------------------------------------
  // 公共 API
  // -------------------------------------------------------------------------

  /**
   * 注册交易对。
   *  - 如果已存在，直接返回。
   *  - 同时把费率同步到 OrderBook。
   */
  registerPair(pair: TradingPair): OrderBook {
    let ob = this.orderbooks.get(pair.symbol);
    if (!ob) {
      ob = new OrderBook(pair.symbol);
      this.orderbooks.set(pair.symbol, ob);
    }
    ob.makerFeeRate = pair.makerFee;
    ob.takerFeeRate = pair.takerFee;
    return ob;
  }

  getOrderBook(symbol: string, depth: number = 20): OrderBookSnapshot {
    const ob = this.getOrThrow(symbol);
    return ob.getSnapshot(depth);
  }

  getRecentTrades(symbol: string, limit: number = 50): Trade[] {
    const list = this.tradesBySymbol.get(symbol) ?? [];
    return list.slice(-limit).reverse();
  }

  /** 取所有挂单（可按 user 过滤）。 */
  getOpenOrders(userId?: ID, symbol?: string): Order[] {
    const out: Order[] = [];
    if (userId) {
      const set = this.userOrders.get(userId);
      if (!set) return [];
      for (const oid of set) {
        const o = this.orders.get(oid);
        if (!o) continue;
        if (symbol && o.symbol !== symbol) continue;
        out.push(o);
      }
    } else {
      for (const o of this.orders.values()) {
        if (symbol && o.symbol !== symbol) continue;
        out.push(o);
      }
    }
    return out;
  }

  getOrder(orderId: ID): Order | undefined {
    return this.orders.get(orderId);
  }

  /**
   * 提交订单：
   * 1) 校验
   * 2) 冻结资金
   * 3) 撮合
   * 4) 结算每笔成交
   * 5) 更新 taker 状态
   * 6) 失败时回滚 / 撤单
   */
  async submitOrder(
    user: User,
    req: OrderRequest,
    opts: SubmitOrderOptions = {}
  ): Promise<SubmitOrderResult> {
    const pair = this.deps.loadPair?.(req.symbol) ?? this.builtInPair(req.symbol);
    if (!pair) {
      throw new OrderError('PAIR_NOT_FOUND', `pair ${req.symbol} not found`);
    }

    const orderbook = this.getOrThrow(req.symbol);

    // 1) 校验
    const balance = this.loadBalance(user.id, pair, req);
    if (!opts.skipValidate) {
      validateOrderRequest(req, {
        user,
        pair,
        balance,
        orderbook,
      });
    }

    // 2) 构造订单
    const order = this.buildOrder(user, req, pair);

    // 3) 冻结资金
    try {
      this.freezeForOrder(order, pair);
    } catch (e) {
      if (e instanceof SettlementError) {
        order.status = 'rejected';
        order.rejectReason = e.message;
        this.orders.set(order.id, order);
        this.emit('orderRejected', { order, reason: e.message });
        throw e;
      }
      throw e;
    }

    this.orders.set(order.id, order);
    this.trackUserOrder(user.id, order.id);

    // 4) 撮合
    let outcome;
    try {
      outcome = orderbook.addOrder(order, { preventSelfTrade: opts.preventSelfTrade ?? true });
    } catch (e) {
      // 撮合异常：解冻
      this.unfreezeForOrder(order, pair);
      this.untrackUserOrder(user.id, order.id);
      this.orders.delete(order.id);
      throw e;
    }

    // 5) 处理 FOK 失败
    if (order.timeInForce === 'FOK' && !outcome.takerFilled) {
      this.unfreezeForOrder(order, pair);
      order.status = 'cancelled';
      order.cancelledAt = new Date().toISOString();
      order.remainingQty = order.quantity;
      this.orders.set(order.id, order);
      this.untrackUserOrder(user.id, order.id);
      this.emit('orderCancelled', { order, reason: 'FOK cannot fill' });
      return {
        order,
        trades: [],
        matchResults: [],
        settlements: [],
        cancelled: { id: order.id, remaining: order.quantity, reason: 'FOK cannot fill' },
      };
    }

    // 6) 结算每笔成交
    const trades: Trade[] = [];
    const settlements: SettleMatchResult[] = [];
    for (const mr of outcome.results) {
      const taker = order;
      const maker = this.findMakerOrder(mr.makerOrderId, orderbook);
      if (!maker) {
        logger.warn('[engine] maker order not found', mr.makerOrderId);
        continue;
      }
      try {
        const st = this.settler.settleMatch({ result: mr, taker, maker, pair });
        settlements.push(st);
        const trade = this.toTrade(mr, taker, maker, st);
        trades.push(trade);
        this.recordTrade(trade);
        this.updateOrderState(taker, orderbook);
        this.updateOrderState(maker, orderbook);
        this.emit('orderMatched', { matchResult: mr, trade, taker, maker });
      } catch (e) {
        // 单笔结算失败不影响后续成交（但已结算的不能回滚）
        logger.error('[engine] settle failed', e);
      }
    }

    // 7) 更新 taker 自身（如果还有剩余）
    this.updateOrderState(order, orderbook);
    this.orders.set(order.id, order);
    if (order.status === 'filled') {
      this.untrackUserOrder(user.id, order.id);
      this.emit('orderFilled', { order });
    } else if (order.status === 'cancelled') {
      this.untrackUserOrder(user.id, order.id);
      this.emit('orderCancelled', { order });
    } else {
      this.emit('orderAccepted', { order });
    }

    // 8) 市价单无成交：解冻全额冻结
    if (order.type === 'market' && decIsZero(order.executedQty)) {
      this.unfreezeForOrder(order, pair);
      order.status = 'cancelled';
      order.cancelledAt = new Date().toISOString();
      this.orders.set(order.id, order);
    }

    // 9) IOC 部分成交后剩余撤销：解冻剩余 quote/base
    //    按 (quantity - executedQty) 计算剩余冻结量
    if (order.timeInForce === 'IOC') {
      const remaining = decSub(order.quantity, order.executedQty);
      if (decIsPositive(remaining)) {
        this.unfreezeRemaining(order, pair, remaining);
        order.remainingQty = '0';
        order.status = 'cancelled';
        order.cancelledAt = new Date().toISOString();
        this.orders.set(order.id, order);
      }
    }

    return { order, trades, matchResults: outcome.results, settlements };
  }

  /**
   * 撤销订单。
   *  - 撮合簿撤单
   *  - 解冻剩余资金
   *  - 更新 order 状态
   */
  async cancelOrder(userId: ID, orderId: ID): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new OrderError('ORDER_NOT_FOUND', `order ${orderId} not found`);
    }
    if (order.userId !== userId) {
      throw new OrderError('ORDER_NOT_OWNED', 'not your order');
    }
    if (order.status === 'filled' || order.status === 'cancelled' || order.status === 'rejected') {
      throw new OrderError('ORDER_NOT_CANCELLABLE', `order already ${order.status}`);
    }
    const ob = this.orderbooks.get(order.symbol);
    if (!ob) {
      throw new OrderError('PAIR_NOT_FOUND', `pair ${order.symbol} not found`);
    }
    const remaining = ob.cancelOrder(orderId);
    if (remaining === null) {
      throw new OrderError('ORDER_NOT_FOUND', 'order not in book');
    }
    const pair = this.deps.loadPair?.(order.symbol) ?? this.builtInPair(order.symbol);
    if (pair) {
      this.unfreezeRemaining(order, pair, remaining);
    }
    order.status = 'cancelled';
    order.remainingQty = order.executedQty;
    order.cancelledAt = new Date().toISOString();
    this.orders.set(order.id, order);
    this.untrackUserOrder(userId, orderId);
    this.emit('orderCancelled', { order, remaining });
  }

  /** 暴露 Freezer（用于 service / 外部查询余额）。 */
  getFreezer(): Freezer {
    return this.freezer;
  }

  /** 暴露 OrderBook（用于测试）。 */
  getOrderBookInstance(symbol: string): OrderBook | undefined {
    return this.orderbooks.get(symbol);
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private getOrThrow(symbol: string): OrderBook {
    let ob = this.orderbooks.get(symbol);
    if (!ob) {
      ob = new OrderBook(symbol);
      this.orderbooks.set(symbol, ob);
    }
    return ob;
  }

  private loadBalance(userId: ID, pair: TradingPair, req: OrderRequest): Balance {
    const asset = req.side === 'buy' ? pair.quoteAsset : pair.baseAsset;
    return this.freezer.getBalance(userId, asset);
  }

  private freezeForOrder(order: Order, pair: TradingPair) {
    if (order.type === 'market') {
      // 市价：买冻结 quote (按 maxPrice * qty 兜底)；卖冻结 base
      if (order.side === 'buy') {
        const price = order.price && order.price !== '' ? order.price : pair.maxPrice;
        const need = decMul(price, order.quantity);
        this.freezer.freeze(order.userId, pair.quoteAsset, need, order.id, 'order freeze');
      } else {
        this.freezer.freeze(order.userId, pair.baseAsset, order.quantity, order.id, 'order freeze');
      }
    } else {
      // 限价
      if (order.side === 'buy') {
        const price = order.price ?? pair.minPrice;
        const need = decMul(price, order.quantity);
        this.freezer.freeze(order.userId, pair.quoteAsset, need, order.id, 'order freeze');
      } else {
        this.freezer.freeze(order.userId, pair.baseAsset, order.quantity, order.id, 'order freeze');
      }
    }
  }

  private unfreezeForOrder(order: Order, pair: TradingPair) {
    if (order.side === 'buy') {
      const price = order.price && order.price !== '' ? order.price : pair.maxPrice;
      const need = decMul(price, order.quantity);
      try {
        this.freezer.unfreeze(order.userId, pair.quoteAsset, need, order.id, 'order unfreeze');
      } catch {
        // 静默
      }
    } else {
      try {
        this.freezer.unfreeze(order.userId, pair.baseAsset, order.quantity, order.id, 'order unfreeze');
      } catch {
        // 静默
      }
    }
  }

  private unfreezeRemaining(order: Order, pair: TradingPair, remaining: string) {
    if (decIsZero(remaining)) return;
    if (order.side === 'buy') {
      const price = order.price ?? pair.minPrice;
      const need = decMul(price, remaining);
      try {
        this.freezer.unfreeze(order.userId, pair.quoteAsset, need, order.id, 'remaining unfreeze');
      } catch (e) {
        logger.warn('[engine] unfreeze remaining failed', e);
      }
    } else {
      try {
        this.freezer.unfreeze(order.userId, pair.baseAsset, remaining, order.id, 'remaining unfreeze');
      } catch (e) {
        logger.warn('[engine] unfreeze remaining failed', e);
      }
    }
  }

  private buildOrder(user: User, req: OrderRequest, pair: TradingPair): Order {
    const id = `ord_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
    const now = new Date().toISOString();
    const tif: Order['timeInForce'] = (() => {
      if (req.type === 'ioc' || req.timeInForce === 'IOC') return 'IOC';
      if (req.type === 'fok' || req.timeInForce === 'FOK') return 'FOK';
      return req.timeInForce ?? 'GTC';
    })();
    return {
      id,
      userId: user.id,
      clientOrderId: req.clientOrderId,
      symbol: req.symbol,
      side: req.side,
      type: req.type,
      status: 'new',
      timeInForce: tif,
      price: req.price ?? '',
      stopPrice: req.stopPrice,
      quantity: req.quantity,
      executedQty: '0',
      remainingQty: req.quantity,
      cummulativeQuoteQty: '0',
      avgPrice: '0',
      fee: '0',
      feeAsset: pair.quoteAsset,
      market: req.market ?? 'spot',
      leverage: req.leverage,
      stopLoss: req.stopLoss,
      takeProfit: req.takeProfit,
      source: req.source ?? 'web',
      createdAt: now,
      updatedAt: now,
    };
  }

  private findMakerOrder(makerOrderId: ID, ob: OrderBook): Order | undefined {
    const cached = this.orders.get(makerOrderId);
    if (cached) return cached;
    const internal = ob.getOrder(makerOrderId);
    return internal?.ref;
  }

  private toTrade(
    mr: MatchResult,
    taker: Order,
    maker: Order,
    st: SettleMatchResult
  ): Trade {
    const isTakerBuy = taker.side === 'buy';
    const buyerId = isTakerBuy ? taker.userId : maker.userId;
    const sellerId = isTakerBuy ? maker.userId : taker.userId;
    const takerFee = st.takerFee;
    const makerFee = st.makerFee;
    return {
      id: `trd_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`,
      orderId: taker.id,
      counterpartyOrderId: maker.id,
      makerOrderId: maker.id,
      userId: taker.userId,
      symbol: taker.symbol,
      side: taker.side,
      price: mr.price,
      quantity: mr.quantity,
      quoteQty: st.quoteQty,
      fee: takerFee,
      feeAsset: st.takerFeeAsset,
      isMaker: false,
      counterpartyUserId: sellerId,
      executedAt: mr.executedAt,
    };
    void buyerId;
    void makerFee;
  }

  private recordTrade(t: Trade) {
    const list = this.tradesBySymbol.get(t.symbol) ?? [];
    list.push(t);
    if (list.length > this.recentTradeCap) {
      list.splice(0, list.length - this.recentTradeCap);
    }
    this.tradesBySymbol.set(t.symbol, list);
  }

  private updateOrderState(order: Order, ob: OrderBook) {
    const internal: InternalOrder | undefined = ob.getOrder(order.id);
    if (internal) {
      order.executedQty = internal.executed;
      order.remainingQty = internal.remaining;
      order.cummulativeQuoteQty = internal.cummulativeQuote;
      order.fee = internal.fee;
      if (!decIsZero(internal.executed) && !decIsZero(internal.remaining)) {
        order.status = 'partial';
      } else if (decIsZero(internal.remaining) && decIsPositive(internal.executed)) {
        order.status = 'filled';
        order.filledAt = internal.ref.filledAt ?? new Date().toISOString();
      } else {
        order.status = 'new';
      }
    } else {
      // 不在簿：可能已撤或 IOC/FOK
      // 通过 executedQty 推断
      if (decIsPositive(order.executedQty) && decCmp(order.executedQty, order.quantity) < 0) {
        order.status = 'cancelled';
        order.cancelledAt = new Date().toISOString();
      } else if (decIsPositive(order.executedQty) && decCmp(order.executedQty, order.quantity) === 0) {
        order.status = 'filled';
      } else {
        order.status = 'cancelled';
        order.cancelledAt = new Date().toISOString();
      }
    }
    if (decIsPositive(order.executedQty)) {
      order.avgPrice = decCmp(order.cummulativeQuoteQty, '0') > 0
        ? decTruncate(decDiv(order.cummulativeQuoteQty, order.executedQty, 8), 8)
        : '0';
    }
    order.updatedAt = new Date().toISOString();
    this.orders.set(order.id, order);
  }

  private trackUserOrder(userId: ID, orderId: ID) {
    let set = this.userOrders.get(userId);
    if (!set) {
      set = new Set();
      this.userOrders.set(userId, set);
    }
    set.add(orderId);
  }

  private untrackUserOrder(userId: ID, orderId: ID) {
    const set = this.userOrders.get(userId);
    if (set) set.delete(orderId);
  }

  /**
   * 内置默认 pair（当 deps.loadPair 未注入时使用）。
   * 仅用于测试 / 演示；生产环境必须由外部注入。
   */
  private builtInPair(symbol: string): TradingPair | undefined {
    const [base, quote] = symbol.split('/');
    if (!base || !quote) return undefined;
    return {
      symbol,
      baseAsset: base,
      quoteAsset: quote,
      status: 'trading',
      pricePrecision: 2,
      quantityPrecision: 6,
      minQuantity: '0.000001',
      maxQuantity: '100000',
      minPrice: '0.01',
      maxPrice: '1000000',
      tickSize: '0.01',
      stepSize: '0.000001',
      makerFee: '0.001',
      takerFee: '0.001',
      icebergAllowed: false,
      marketOrderAllowed: true,
      stopOrderAllowed: true,
    };
  }
}

// -------------------------------------------------------------------------
// 全局单例
// -------------------------------------------------------------------------

let _instance: MatchingEngine | null = null;
export function getMatchingEngine(): MatchingEngine {
  if (!_instance) _instance = new MatchingEngine();
  return _instance;
}
export function setMatchingEngine(engine: MatchingEngine): void {
  _instance = engine;
}
