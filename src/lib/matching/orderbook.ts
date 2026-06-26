/**
 * 单交易对订单簿 (OrderBook)
 *
 * 设计目标：
 *  - 价格优先 + 时间优先（FIFO）
 *  - 撮合 O(log N) 找对手价位（用 sorted array 模拟红黑树）
 *  - 支持 limit / market / IOC / FOK
 *  - 自成交防止（可选：同 userId 跳过自身挂单）
 *  - 1000 笔挂单时单次成交 < 5ms
 *
 * 数据结构：
 *  - bids / asks: Map<price, InternalOrder[]>  按 FIFO 排队
 *  - bidLevels:  升序排列的价格数组（最大价在末尾）
 *  - askLevels:  升序排列的价格数组（最小价在头部）
 *  - orders:     Map<orderId, InternalOrder> 用于快速查找
 */

import type {
  ID,
  MatchResult,
  Order,
  OrderBookLevel,
  OrderBookSnapshot,
  OrderSide,
  OrderType,
  TimeInForce,
  Decimal,
} from '@/types/models';
import {
  decAdd,
  decCmp,
  decGte,
  decIsPositive,
  decIsZero,
  decLte,
  decMul,
  decSub,
  decMin,
  decTruncate,
} from './decimal';
import { OrderError } from './errors';

/** 内部订单状态：用于撮合中的剩余量。 */
export interface InternalOrder {
  id: ID;
  userId: ID;
  side: OrderSide;
  type: OrderType;
  timeInForce: TimeInForce;
  /** 限价；市价单时为 null */
  price: Decimal | null;
  stopPrice?: Decimal;
  /** 剩余数量 */
  remaining: Decimal;
  /** 累计成交数量 */
  executed: Decimal;
  /** 累计成交 quote 数量 */
  cummulativeQuote: Decimal;
  /** 累计手续费 */
  fee: Decimal;
  feeAsset: string;
  /** 队列时间（ms） */
  ts: number;
  /** 订单原始引用（外部） */
  ref: Order;
}

/** 撮合结果：包含每笔成交以及最终 taker 状态。 */
export interface MatchOutcome {
  results: MatchResult[];
  /** taker 最终剩余量（0 表示完全成交） */
  takerRemaining: Decimal;
  /** taker 累计成交量 */
  takerExecuted: Decimal;
  /** taker 累计成交额（quote） */
  takerQuote: Decimal;
  /** taker 累计手续费 */
  takerFee: Decimal;
  /** taker 是否被完全吃掉 */
  takerFilled: boolean;
  /** 触发的对手方成交（maker）的 orderId 列表 */
  touchedMakerIds: ID[];
}

export interface AddOrderOptions {
  /** 撮合时是否跳过同 userId 的对手单，防止自成交。默认 true。 */
  preventSelfTrade?: boolean;
}

export class OrderBook {
  readonly symbol: string;

  /** price -> InternalOrder[] (FIFO 队列) */
  private readonly bids = new Map<string, InternalOrder[]>();
  private readonly asks = new Map<string, InternalOrder[]>();

  /** 升序价格数组（bids 升序，尾部是最高买价；asks 升序，头部是最低卖价） */
  private bidLevels: string[] = [];
  private askLevels: string[] = [];

  /** orderId -> InternalOrder */
  private readonly orders = new Map<ID, InternalOrder>();

  /** 单调递增的快照 id */
  private lastUpdateId = 0;

  /** Maker/Taker 费率，外部注入。 */
  makerFeeRate: string = '0.001';
  takerFeeRate: string = '0.001';

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  // -------------------------------------------------------------------------
  // 公共 API
  // -------------------------------------------------------------------------

  /**
   * 添加订单并撮合。
   * 返回 MatchOutcome，包含所有成交结果。
   */
  addOrder(order: Order, opts: AddOrderOptions = {}): MatchOutcome {
    if (order.symbol !== this.symbol) {
      throw new OrderError('INVALID_SYMBOL', `symbol mismatch: ${order.symbol} vs ${this.symbol}`);
    }
    if (!decIsPositive(order.quantity) && order.type !== 'market') {
      throw new OrderError('INVALID_QUANTITY', 'quantity must be positive');
    }
    if ((order.type === 'limit' || order.type === 'stop_limit') && !order.price) {
      throw new OrderError('INVALID_PRICE', 'limit/stop_limit order requires price');
    }

    const taker: InternalOrder = {
      id: order.id,
      userId: order.userId,
      side: order.side,
      type: order.type,
      timeInForce: order.timeInForce,
      // 市价单的 price 为 null，限价单为 Decimal
      price: order.type === 'market' ? null : (order.price ?? null),
      stopPrice: order.stopPrice,
      remaining: order.quantity,
      executed: '0',
      cummulativeQuote: '0',
      fee: '0',
      feeAsset: order.feeAsset || 'USDT',
      ts: order.createdAt ? Date.parse(order.createdAt) : Date.now(),
      ref: order,
    };

    const preventSelfTrade = opts.preventSelfTrade ?? true;
    const result = this.match(taker, preventSelfTrade);

    // 处理 FOK：撮合前就要能全成，否则整笔撤单
    if (taker.timeInForce === 'FOK' && !decIsZero(taker.remaining)) {
      this.rollback(taker, result);
      return {
        results: [],
        takerRemaining: order.quantity,
        takerExecuted: '0',
        takerQuote: '0',
        takerFee: '0',
        takerFilled: false,
        touchedMakerIds: [],
      };
    }

    // 处理 IOC：未成交部分直接撤
    if (taker.timeInForce === 'IOC' && !decIsZero(taker.remaining)) {
      taker.remaining = '0';
      // IOC：从订单簿移除，便于上层把订单标记为 cancelled
      this.orders.delete(taker.id);
      this.touchUpdate();
    } else if (
      taker.timeInForce !== 'IOC' &&
      taker.timeInForce !== 'FOK' &&
      !decIsZero(taker.remaining) &&
      taker.price !== null
    ) {
      this.insertResting(taker);
    }

    // 撮合后把 taker 的最新状态同步到外部 Order
    taker.ref.executedQty = taker.executed;
    taker.ref.remainingQty = taker.remaining;
    taker.ref.cummulativeQuoteQty = taker.cummulativeQuote;
    taker.ref.fee = taker.fee;

    return result;
  }

  /**
   * 撤销订单。
   * @returns 被撤订单的剩余量；不存在返回 null。
   */
  cancelOrder(orderId: ID): Decimal | null {
    const o = this.orders.get(orderId);
    if (!o) return null;
    if (decIsZero(o.remaining)) return '0';

    const remaining = o.remaining;
    o.remaining = '0';

    const book = o.side === 'buy' ? this.bids : this.asks;
    const levels = o.side === 'buy' ? this.bidLevels : this.askLevels;
    const price = o.price ?? '';
    const queue = book.get(price);
    if (queue) {
      const idx = queue.findIndex((x) => x.id === orderId);
      if (idx >= 0) queue.splice(idx, 1);
      if (queue.length === 0) {
        book.delete(price);
        const li = lowerBound(levels, price);
        if (li < levels.length && levels[li] === price) {
          levels.splice(li, 1);
        }
      }
    }
    this.orders.delete(orderId);
    this.touchUpdate();
    return remaining;
  }

  /**
   * 修改订单价格/数量。
   * 注：修改后会失去时间优先（按撤单重下处理）。
   * @returns 修改后新订单 ID（同 id）或 null
   */
  modifyOrder(
    orderId: ID,
    newPrice: Decimal | null,
    newQty: Decimal
  ): ID | null {
    const o = this.orders.get(orderId);
    if (!o) return null;
    if (!decIsPositive(newQty)) {
      throw new OrderError('INVALID_QUANTITY', 'newQty must be positive');
    }
    if (decCmp(o.executed, newQty) > 0) {
      throw new OrderError('INVALID_QUANTITY', 'newQty less than executed');
    }
    const orig = o.ref;
    const newOrder: Order = {
      ...orig,
      price: newPrice ?? orig.price,
      quantity: newQty,
      executedQty: o.executed,
      remainingQty: newQty,
      status: 'new',
      updatedAt: new Date().toISOString(),
    };
    this.cancelOrder(orderId);
    this.addOrder(newOrder);
    return newOrder.id;
  }

  /**
   * 返回前 N 档行情。
   * bids 价格降序，asks 价格升序。
   */
  getSnapshot(depth: number = 20): OrderBookSnapshot {
    const bidLevels: OrderBookLevel[] = [];
    for (let i = this.bidLevels.length - 1; i >= 0 && bidLevels.length < depth; i--) {
      const p = this.bidLevels[i];
      const queue = this.bids.get(p)!;
      let qty = '0';
      for (const o of queue) qty = decAdd(qty, o.remaining);
      if (!decIsZero(qty)) {
        bidLevels.push({ price: p, quantity: qty, orderCount: queue.length });
      }
    }
    const askLevels: OrderBookLevel[] = [];
    for (let i = 0; i < this.askLevels.length && askLevels.length < depth; i++) {
      const p = this.askLevels[i];
      const queue = this.asks.get(p)!;
      let qty = '0';
      for (const o of queue) qty = decAdd(qty, o.remaining);
      if (!decIsZero(qty)) {
        askLevels.push({ price: p, quantity: qty, orderCount: queue.length });
      }
    }
    this.lastUpdateId++;
    return {
      symbol: this.symbol,
      bids: bidLevels,
      asks: askLevels,
      lastUpdateId: this.lastUpdateId,
      timestamp: new Date().toISOString(),
    };
  }

  /** 当前订单簿中订单数。 */
  size(): number {
    return this.orders.size;
  }

  /** 获取单个订单当前快照。 */
  getOrder(orderId: ID): InternalOrder | undefined {
    return this.orders.get(orderId);
  }

  /** 遍历所有挂单（仅供测试/调试）。 */
  dump(): { bids: [string, string][]; asks: [string, string][] } {
    const bidOut: [string, string][] = [];
    for (let i = this.bidLevels.length - 1; i >= 0; i--) {
      const p = this.bidLevels[i];
      const queue = this.bids.get(p) || [];
      let total = '0';
      for (const o of queue) total = decAdd(total, o.remaining);
      if (!decIsZero(total)) bidOut.push([p, total]);
    }
    const askOut: [string, string][] = [];
    for (let i = 0; i < this.askLevels.length; i++) {
      const p = this.askLevels[i];
      const queue = this.asks.get(p) || [];
      let total = '0';
      for (const o of queue) total = decAdd(total, o.remaining);
      if (!decIsZero(total)) askOut.push([p, total]);
    }
    return { bids: bidOut, asks: askOut };
  }

  // -------------------------------------------------------------------------
  // 内部：撮合核心
  // -------------------------------------------------------------------------

  private match(taker: InternalOrder, preventSelfTrade: boolean): MatchOutcome {
    const results: MatchResult[] = [];
    const touchedMakerIds: Set<ID> = new Set();
    const now = new Date().toISOString();

    // 自成交防止：跟踪每个价位中"被跳过"的自成交订单；回到原顺序视为该价位全是自成交
    const skippedAtLevel = new Map<string, Set<ID>>();

    while (!decIsZero(taker.remaining)) {
      const levelPrice = taker.side === 'buy' ? this.bestAsk() : this.bestBid();
      if (levelPrice === null) break;

      if (taker.price !== null) {
        const canMatch =
          taker.side === 'buy'
            ? decLte(levelPrice, taker.price)
            : decGte(levelPrice, taker.price);
        if (!canMatch) break;
      }

      const book = taker.side === 'buy' ? this.asks : this.bids;
      const queue = book.get(levelPrice);
      if (!queue || queue.length === 0) {
        this.removeLevel(taker.side === 'buy' ? 'sell' : 'buy', levelPrice);
        continue;
      }

      const maker = queue[0];
      if (preventSelfTrade && maker.userId === taker.userId && taker.timeInForce !== 'FOK') {
        // 跟踪自成交跳过集合
        let skipped = skippedAtLevel.get(levelPrice);
        if (!skipped) {
          skipped = new Set<ID>();
          skippedAtLevel.set(levelPrice, skipped);
        }
        if (skipped.has(maker.id)) {
          // 已绕回原顺序：当前价位全部为自成交
          skippedAtLevel.delete(levelPrice);
          break;
        }
        skipped.add(maker.id);
        queue.shift();
        queue.push(maker);
        if (queue.length === 0) {
          book.delete(levelPrice);
          this.removeLevel(taker.side === 'buy' ? 'sell' : 'buy', levelPrice);
        }
        continue;
      }

      const execQty = decMin(taker.remaining, maker.remaining);
      const execPrice = levelPrice;
      const execQuote = decMul(execPrice, execQty);

      // 手续费按"收到方"币种计算：
      //  - taker fee：taker 收到什么币种，就用该币种 * feeRate
      //    - taker 买 base -> taker fee 用 base
      //    - taker 卖 base -> taker fee 用 quote
      //  - maker fee：maker 收到什么币种，就用该币种 * feeRate
      //    - taker 买 -> maker 卖 base -> maker fee 用 quote
      //    - taker 卖 -> maker 买 base -> maker fee 用 base
      const takerFeeBase = decTruncate(decMul(execQty, this.takerFeeRate), 8);
      const takerFeeQuote = decTruncate(decMul(execQuote, this.takerFeeRate), 8);
      const takerFee = taker.side === 'buy' ? takerFeeBase : takerFeeQuote;
      const makerFeeBase = decTruncate(decMul(execQty, this.makerFeeRate), 8);
      const makerFeeQuote = decTruncate(decMul(execQuote, this.makerFeeRate), 8);
      const makerFee = taker.side === 'buy' ? makerFeeQuote : makerFeeBase;

      taker.remaining = decSub(taker.remaining, execQty);
      taker.executed = decAdd(taker.executed, execQty);
      taker.cummulativeQuote = decAdd(taker.cummulativeQuote, execQuote);
      taker.fee = decAdd(taker.fee, takerFee);

      maker.remaining = decSub(maker.remaining, execQty);
      maker.executed = decAdd(maker.executed, execQty);
      maker.cummulativeQuote = decAdd(maker.cummulativeQuote, execQuote);
      maker.fee = decAdd(maker.fee, makerFee);
      if (decIsZero(maker.remaining)) {
        // 在移除前把撮合结果同步到外部 Order，便于上层读取
        maker.ref.executedQty = maker.executed;
        maker.ref.remainingQty = maker.remaining;
        maker.ref.cummulativeQuoteQty = maker.cummulativeQuote;
        maker.ref.fee = maker.fee;
        queue.shift();
        this.orders.delete(maker.id);
        if (queue.length === 0) {
          book.delete(levelPrice);
          this.removeLevel(taker.side === 'buy' ? 'sell' : 'buy', levelPrice);
        }
      }

      touchedMakerIds.add(maker.id);

      results.push({
        takerOrderId: taker.id,
        makerOrderId: maker.id,
        symbol: this.symbol,
        side: taker.side,
        price: execPrice,
        quantity: execQty,
        takerFee,
        makerFee,
        executedAt: now,
      });
    }

    this.touchUpdate();
    return {
      results,
      takerRemaining: taker.remaining,
      takerExecuted: taker.executed,
      takerQuote: taker.cummulativeQuote,
      takerFee: taker.fee,
      takerFilled: decIsZero(taker.remaining),
      touchedMakerIds: Array.from(touchedMakerIds),
    };
  }

  /**
   * FOK 失败时把 taker 内部状态清零。
   * 注：撮合过程中已经修改了 maker 的 executed/quote/fee；调用方需要根据 results 自行做反向结算。
   * 本方法只确保 OrderBook 内部不再保留 taker。
   */
  private rollback(taker: InternalOrder, _outcome: MatchOutcome) {
    taker.remaining = '0';
    taker.executed = '0';
    taker.cummulativeQuote = '0';
    taker.fee = '0';
  }

  private insertResting(order: InternalOrder) {
    if (order.price === null) return;
    const book = order.side === 'buy' ? this.bids : this.asks;
    const levels = order.side === 'buy' ? this.bidLevels : this.askLevels;
    const price = order.price;

    const queue = book.get(price);
    if (queue) {
      queue.push(order);
    } else {
      book.set(price, [order]);
      const idx = lowerBound(levels, price);
      if (idx === levels.length || levels[idx] !== price) {
        levels.splice(idx, 0, price);
      }
    }
    this.orders.set(order.id, order);
  }

  private bestAsk(): string | null {
    return this.askLevels.length > 0 ? this.askLevels[0] : null;
  }
  private bestBid(): string | null {
    return this.bidLevels.length > 0 ? this.bidLevels[this.bidLevels.length - 1] : null;
  }

  private removeLevel(side: OrderSide, price: string) {
    const levels = side === 'buy' ? this.bidLevels : this.askLevels;
    const idx = lowerBound(levels, price);
    if (idx < levels.length && levels[idx] === price) {
      levels.splice(idx, 1);
    }
  }

  private touchUpdate() {
    this.lastUpdateId++;
  }
}

/**
 * 在升序数组中查找第一个 >= target 的下标（按 decCmp 排序）。
 */
function lowerBound(arr: string[], target: string): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (decCmp(arr[mid], target) < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
