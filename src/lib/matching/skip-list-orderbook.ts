/**
 * 跳表订单簿（Skip List Order Book）
 *
 * 跳表是一种基于概率的平衡数据结构，查找/插入/删除均为 O(log n)
 * 非常适合用于订单簿的价格档位管理
 *
 * 特性：
 *  - 双向跳表：同时支持升序和降序遍历
 *  - 价格档位聚合：同一价格档位的订单聚合在一个节点
 *  - FIFO 队列：同一价格档位内的订单按时间优先排序
 *  - 实时统计：每个价格档位实时维护总挂单量
 *  - 多级别索引：跳表最大 32 层
 *
 * 性能：
 *  - 查找：O(log n)
 *  - 插入：O(log n)
 *  - 删除：O(log n)
 *  - 遍历最佳档位：O(1)（直接访问头尾指针）
 */

import {
  decAdd,
  decCmp,
  decSub,
  decIsPositive,
  decIsZero,
  decTruncate,
  decMin,
  decMax,
  decDiv,
  decMul,
} from './decimal';
import { logger } from '@/lib/logger';

// ============================================================================
// 类型定义
// ============================================================================

/** 订单方向 */
export type OrderSide = 'buy' | 'sell';

/** 订单类型 */
export type OrderType = 'market' | 'limit' | 'stop' | 'iceberg';

/** 订单状态 */
export type OrderStatus = 'pending' | 'open' | 'partial' | 'filled' | 'cancelled';

/** 时间生效策略 */
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTD';

/** 订单 */
export interface SkipListOrder {
  id: string;
  userId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: string;
  quantity: string;
  filledQuantity: string;
  remainingQuantity: string;
  status: OrderStatus;
  timeInForce: TimeInForce;
  createdAt: number;
  updatedAt: number;
  clientOrderId?: string;
  postOnly?: boolean;
  reduceOnly?: boolean;
  icebergPeakQty?: string;
  icebergTotalQty?: string;
  parentOrderId?: string;
}

/** 价格档位 */
export interface PriceLevel {
  price: string;
  totalQuantity: string;
  orderCount: number;
  orders: SkipListOrder[];
  forward: (SkipListNode | null)[];
  backward: (SkipListNode | null)[];
}

/** 跳表节点 */
export interface SkipListNode {
  level: PriceLevel;
  forward: (SkipListNode | null)[];
  backward: (SkipListNode | null)[];
}

/** 撮合结果 - 单条成交 */
export interface MatchTrade {
  tradeId: string;
  takerOrderId: string;
  makerOrderId: string;
  takerUserId: string;
  makerUserId: string;
  price: string;
  quantity: string;
  quoteQuantity: string;
  timestamp: number;
  isMakerBuy: boolean;
}

/** 撮合执行结果 */
export interface MatchExecutionResult {
  trades: MatchTrade[];
  takerOrder: SkipListOrder;
  filledQuantity: string;
  remainingQuantity: string;
  avgPrice: string;
  isFullyFilled: boolean;
  isBooked: boolean;
}

/** 订单簿快照 */
export interface OrderBookSnapshot {
  symbol: string;
  bids: Array<{ price: string; quantity: string; orderCount: number }>;
  asks: Array<{ price: string; quantity: string; orderCount: number }>;
  lastUpdateId: number;
  timestamp: number;
}

// ============================================================================
// 跳表实现
// ============================================================================

const MAX_LEVEL = 32;
const P = 0.25;

/**
 * 跳表实现 - 按价格升序排列
 */
class SkipList {
  private header: SkipListNode;
  private tail: SkipListNode | null = null;
  private level = 0;
  private size = 0;
  private updateArray: (SkipListNode | null)[] = new Array(MAX_LEVEL).fill(null);

  constructor() {
    this.header = this.createNode({
      price: '0',
      totalQuantity: '0',
      orderCount: 0,
      orders: [],
      forward: new Array(MAX_LEVEL).fill(null),
      backward: new Array(MAX_LEVEL).fill(null),
    });
  }

  private createNode(level: PriceLevel): SkipListNode {
    return {
      level,
      forward: new Array(MAX_LEVEL).fill(null),
      backward: new Array(MAX_LEVEL).fill(null),
    };
  }

  private randomLevel(): number {
    let lvl = 0;
    while (Math.random() < P && lvl < MAX_LEVEL - 1) {
      lvl++;
    }
    return lvl;
  }

  /**
   * 查找或插入价格档位
   * 返回 [节点, 是否新建]
   */
  getOrInsert(price: string): [SkipListNode, boolean] {
    let current: SkipListNode = this.header;
    const update = this.updateArray;

    for (let i = this.level; i >= 0; i--) {
      while (
        current.forward[i] &&
        decCmp(current.forward[i]!.level.price, price) < 0
      ) {
        current = current.forward[i]!;
      }
      update[i] = current;
    }

    current = current.forward[0]!;

    if (current && decCmp(current.level.price, price) === 0) {
      return [current, false];
    }

    const newLevel = this.randomLevel();

    if (newLevel > this.level) {
      for (let i = this.level + 1; i <= newLevel; i++) {
        update[i] = this.header;
      }
      this.level = newLevel;
    }

    const newNode = this.createNode({
      price,
      totalQuantity: '0',
      orderCount: 0,
      orders: [],
      forward: new Array(MAX_LEVEL).fill(null),
      backward: new Array(MAX_LEVEL).fill(null),
    });

    for (let i = 0; i <= newLevel; i++) {
      newNode.forward[i] = update[i]!.forward[i];
      update[i]!.forward[i] = newNode;

      if (newNode.forward[i]) {
        newNode.backward[i] = newNode.forward[i].backward[i];
        newNode.forward[i].backward[i] = newNode;
      } else {
        newNode.backward[i] = update[i];
      }
    }

    if (update[0] === this.header) {
      newNode.backward[0] = null;
    }

    if (!this.tail || !newNode.forward[0]) {
      this.tail = newNode;
    }

    this.size++;
    return [newNode, true];
  }

  /**
   * 查找价格档位
   */
  find(price: string): SkipListNode | null {
    let current: SkipListNode = this.header;

    for (let i = this.level; i >= 0; i--) {
      while (
        current.forward[i] &&
        decCmp(current.forward[i]!.level.price, price) < 0
      ) {
        current = current.forward[i]!;
      }
    }

    current = current.forward[0]!;
    if (current && decCmp(current.level.price, price) === 0) {
      return current;
    }

    return null;
  }

  /**
   * 删除价格档位
   */
  remove(price: string): boolean {
    let current: SkipListNode = this.header;
    const update = this.updateArray;

    for (let i = this.level; i >= 0; i--) {
      while (
        current.forward[i] &&
        decCmp(current.forward[i]!.level.price, price) < 0
      ) {
        current = current.forward[i]!;
      }
      update[i] = current;
    }

    current = current.forward[0]!;

    if (!current || decCmp(current.level.price, price) !== 0) {
      return false;
    }

    for (let i = 0; i <= this.level; i++) {
      if (!update[i]!.forward[i] || update[i]!.forward[i] !== current) {
        break;
      }
      update[i]!.forward[i] = current.forward[i];

      if (current.forward[i]) {
        current.forward[i].backward[i] = update[i];
      }
    }

    if (this.tail === current) {
      this.tail = update[0] === this.header ? null : update[0];
    }

    while (this.level > 0 && !this.header.forward[this.level]) {
      this.level--;
    }

    this.size--;
    return true;
  }

  /**
   * 获取第一个节点（最低价）
   */
  first(): SkipListNode | null {
    return this.header.forward[0];
  }

  /**
   * 获取最后一个节点（最高价）
   */
  last(): SkipListNode | null {
    return this.tail;
  }

  /**
   * 找到大于等于 price 的第一个节点
   */
  ceiling(price: string): SkipListNode | null {
    let current: SkipListNode = this.header;

    for (let i = this.level; i >= 0; i--) {
      while (
        current.forward[i] &&
        decCmp(current.forward[i]!.level.price, price) < 0
      ) {
        current = current.forward[i]!;
      }
    }

    return current.forward[0];
  }

  /**
   * 找到小于等于 price 的最后一个节点
   */
  floor(price: string): SkipListNode | null {
    let current: SkipListNode = this.header;

    for (let i = this.level; i >= 0; i--) {
      while (
        current.forward[i] &&
        decCmp(current.forward[i]!.level.price, price) <= 0
      ) {
        current = current.forward[i]!;
      }
    }

    return current === this.header ? null : current;
  }

  getSize(): number {
    return this.size;
  }

  getLevel(): number {
    return this.level;
  }

  /**
   * 遍历所有价格档位（从低到高）
   */
  forEach(callback: (node: SkipListNode) => void): void {
    let current = this.header.forward[0];
    while (current) {
      callback(current);
      current = current.forward[0];
    }
  }

  /**
   * 反向遍历（从高到低）
   */
  forEachReverse(callback: (node: SkipListNode) => void): void {
    let current = this.tail;
    while (current && current !== this.header) {
      callback(current);
      current = current.backward[0];
    }
  }
}

// ============================================================================
// 跳表订单簿
// ============================================================================

export class SkipListOrderBook {
  readonly symbol: string;
  private readonly bids: SkipList;  // 买单：价格降序排列（最高价在前）
  private readonly asks: SkipList;  // 卖单：价格升序排列（最低价在前）
  private readonly orders = new Map<string, SkipListOrder>();
  private readonly userOrders = new Map<string, Set<string>>();
  private tradeSeq = 0;
  private updateId = 0;
  private lastPrice: string = '0';

  constructor(symbol: string) {
    this.symbol = symbol;
    this.bids = new SkipList();
    this.asks = new SkipList();
  }

  // -------------------------------------------------------------------------
  // 订单管理
  // -------------------------------------------------------------------------

  /**
   * 兼容旧接口：快速添加限价单
   */
  addLimitOrder(orderId: string, side: OrderSide, price: string, quantity: string): {
    fills: MatchTrade[];
    filledQty: string;
    leavesQty: string;
  } {
    const order: SkipListOrder = {
      id: orderId,
      userId: 'legacy-user',
      symbol: this.symbol,
      side,
      type: 'limit',
      price,
      quantity,
      filledQuantity: '0',
      remainingQuantity: quantity,
      status: 'open',
      timeInForce: 'GTC',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = side === 'buy' ? this.matchLimitBuy(order) : this.matchLimitSell(order);
    return {
      fills: result.trades,
      filledQty: result.filledQuantity,
      leavesQty: result.remainingQuantity,
    };
  }

  /**
   * 兼容旧接口：取消订单
   */
  cancelOrder(orderId: string): boolean {
    return this.removeOrder(orderId) !== null;
  }

  /**
   * 兼容旧接口：市价单撮合
   */
  matchMarketOrder(side: OrderSide, quantity: string): {
    fills: MatchTrade[];
    filledQty: string;
    leavesQty: string;
  } {
    const order: SkipListOrder = {
      id: `mkt-${Date.now()}`,
      userId: 'legacy-user',
      symbol: this.symbol,
      side,
      type: 'market',
      price: side === 'buy' ? '999999999' : '0',
      quantity,
      filledQuantity: '0',
      remainingQuantity: quantity,
      status: 'open',
      timeInForce: 'IOC',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = side === 'buy' ? this.matchMarketBuy(order) : this.matchMarketSell(order);
    return {
      fills: result.trades,
      filledQty: result.filledQuantity,
      leavesQty: result.remainingQuantity,
    };
  }

  /**
   * 添加订单到订单簿
   */
  addOrder(order: SkipListOrder): void {
    if (order.status !== 'open' && order.status !== 'partial') {
      throw new Error('Cannot add non-open order to order book');
    }

    const list = order.side === 'buy' ? this.bids : this.asks;
    const [node] = list.getOrInsert(order.price);

    node.level.orders.push(order);
    node.level.totalQuantity = decAdd(node.level.totalQuantity, order.remainingQuantity);
    node.level.orderCount++;

    this.orders.set(order.id, order);

    let userSet = this.userOrders.get(order.userId);
    if (!userSet) {
      userSet = new Set();
      this.userOrders.set(order.userId, userSet);
    }
    userSet.add(order.id);

    this.updateId++;
  }

  /**
   * 从订单簿移除订单
   */
  removeOrder(orderId: string): SkipListOrder | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    const list = order.side === 'buy' ? this.bids : this.asks;
    const node = list.find(order.price);

    if (node) {
      const idx = node.level.orders.findIndex(o => o.id === orderId);
      if (idx >= 0) {
        node.level.orders.splice(idx, 1);
        node.level.totalQuantity = decSub(
          node.level.totalQuantity,
          order.remainingQuantity
        );
        node.level.orderCount--;
      }

      if (node.level.orderCount === 0) {
        list.remove(order.price);
      }
    }

    this.orders.delete(orderId);

    const userSet = this.userOrders.get(order.userId);
    if (userSet) {
      userSet.delete(orderId);
    }

    this.updateId++;
    return order;
  }

  /**
   * 获取订单
   */
  getOrder(orderId: string): SkipListOrder | undefined {
    return this.orders.get(orderId);
  }

  /**
   * 获取用户的所有活动订单
   */
  getUserOrders(userId: string): SkipListOrder[] {
    const ids = this.userOrders.get(userId);
    if (!ids) return [];
    return Array.from(ids)
      .map(id => this.orders.get(id))
      .filter((o): o is SkipListOrder => o !== undefined);
  }

  // -------------------------------------------------------------------------
  // 撮合 - 市价买单
  // -------------------------------------------------------------------------

  /**
   * 市价买单撮合（用 ask 侧）
   */
  matchMarketBuy(
    takerOrder: SkipListOrder,
    maxMatches: number = 100
  ): MatchExecutionResult {
    const trades: MatchTrade[] = [];
    let remaining = takerOrder.remainingQuantity;
    let totalQuote = '0';
    let totalBase = '0';
    let matchCount = 0;

    let current = this.asks.first();

    while (current && decIsPositive(remaining) && matchCount < maxMatches) {
      const priceLevel = current.level;
      const matchQty = decMin(remaining, priceLevel.totalQuantity);

      if (decIsZero(matchQty)) {
        current = current.forward[0];
        continue;
      }

      const result = this.matchAtLevel(
        takerOrder,
        priceLevel,
        matchQty,
        current,
        'sell'
      );

      trades.push(...result.trades);
      remaining = decSub(remaining, result.matchedQty);
      totalQuote = decAdd(totalQuote, result.matchedQuote);
      totalBase = decAdd(totalBase, result.matchedQty);
      matchCount++;

      if (priceLevel.orderCount === 0) {
        const next = current.forward[0];
        this.asks.remove(priceLevel.price);
        current = next;
      } else {
        current = current.forward[0];
      }
    }

    const avgPrice = decIsPositive(totalBase)
      ? decDiv(totalQuote, totalBase, 10)
      : takerOrder.price;

    const isFullyFilled = decIsZero(remaining);

    takerOrder.filledQuantity = decAdd(takerOrder.filledQuantity, totalBase);
    takerOrder.remainingQuantity = remaining;
    takerOrder.status = isFullyFilled ? 'filled' : 'partial';
    takerOrder.updatedAt = Date.now();

    if (isFullyFilled) {
      this.orders.delete(takerOrder.id);
    }

    this.lastPrice = trades.length > 0 ? trades[trades.length - 1].price : this.lastPrice;
    this.updateId++;

    return {
      trades,
      takerOrder,
      filledQuantity: totalBase,
      remainingQuantity: remaining,
      avgPrice,
      isFullyFilled,
      isBooked: false,
    };
  }

  /**
   * 市价卖单撮合（用 bid 侧）
   */
  matchMarketSell(
    takerOrder: SkipListOrder,
    maxMatches: number = 100
  ): MatchExecutionResult {
    const trades: MatchTrade[] = [];
    let remaining = takerOrder.remainingQuantity;
    let totalQuote = '0';
    let totalBase = '0';
    let matchCount = 0;

    let current = this.bids.last();

    while (current && decIsPositive(remaining) && matchCount < maxMatches) {
      const priceLevel = current.level;
      const matchQty = decMin(remaining, priceLevel.totalQuantity);

      if (decIsZero(matchQty)) {
        current = current.backward[0];
        continue;
      }

      const result = this.matchAtLevel(
        takerOrder,
        priceLevel,
        matchQty,
        current,
        'buy'
      );

      trades.push(...result.trades);
      remaining = decSub(remaining, result.matchedQty);
      totalQuote = decAdd(totalQuote, result.matchedQuote);
      totalBase = decAdd(totalBase, result.matchedQty);
      matchCount++;

      if (priceLevel.orderCount === 0) {
        const prev = current.backward[0];
        this.bids.remove(priceLevel.price);
        current = prev;
      } else {
        current = current.backward[0];
      }
    }

    const avgPrice = decIsPositive(totalBase)
      ? decDiv(totalQuote, totalBase, 10)
      : takerOrder.price;

    const isFullyFilled = decIsZero(remaining);

    takerOrder.filledQuantity = decAdd(takerOrder.filledQuantity, totalBase);
    takerOrder.remainingQuantity = remaining;
    takerOrder.status = isFullyFilled ? 'filled' : 'partial';
    takerOrder.updatedAt = Date.now();

    if (isFullyFilled) {
      this.orders.delete(takerOrder.id);
    }

    this.lastPrice = trades.length > 0 ? trades[trades.length - 1].price : this.lastPrice;
    this.updateId++;

    return {
      trades,
      takerOrder,
      filledQuantity: totalBase,
      remainingQuantity: remaining,
      avgPrice,
      isFullyFilled,
      isBooked: false,
    };
  }

  // -------------------------------------------------------------------------
  // 撮合 - 限价单
  // -------------------------------------------------------------------------

  /**
   * 限价买单撮合
   * 先吃 ask 侧低于等于限价的卖单，剩余挂入 bid 侧
   */
  matchLimitBuy(
    takerOrder: SkipListOrder,
    maxMatches: number = 100
  ): MatchExecutionResult {
    const trades: MatchTrade[] = [];
    let remaining = takerOrder.remainingQuantity;
    let totalQuote = '0';
    let totalBase = '0';
    let matchCount = 0;

    let current = this.asks.first();

    while (
      current &&
      decIsPositive(remaining) &&
      decCmp(current.level.price, takerOrder.price) <= 0 &&
      matchCount < maxMatches
    ) {
      const priceLevel = current.level;
      const matchQty = decMin(remaining, priceLevel.totalQuantity);

      if (decIsZero(matchQty)) {
        current = current.forward[0];
        continue;
      }

      const result = this.matchAtLevel(
        takerOrder,
        priceLevel,
        matchQty,
        current,
        'sell'
      );

      trades.push(...result.trades);
      remaining = decSub(remaining, result.matchedQty);
      totalQuote = decAdd(totalQuote, result.matchedQuote);
      totalBase = decAdd(totalBase, result.matchedQty);
      matchCount++;

      if (priceLevel.orderCount === 0) {
        const next = current.forward[0];
        this.asks.remove(priceLevel.price);
        current = next;
      } else {
        current = current.forward[0];
      }
    }

    const avgPrice = decIsPositive(totalBase)
      ? decDiv(totalQuote, totalBase, 10)
      : takerOrder.price;

    const isFullyFilled = decIsZero(remaining);

    takerOrder.filledQuantity = decAdd(takerOrder.filledQuantity, totalBase);
    takerOrder.remainingQuantity = remaining;
    takerOrder.status = isFullyFilled ? 'filled' : 'partial';
    takerOrder.updatedAt = Date.now();

    let isBooked = false;

    if (!isFullyFilled) {
      if (takerOrder.timeInForce === 'IOC' || takerOrder.timeInForce === 'FOK') {
        if (takerOrder.timeInForce === 'FOK') {
          for (const trade of trades) {
            this.revertTrade(trade);
          }
          takerOrder.filledQuantity = '0';
          takerOrder.remainingQuantity = takerOrder.quantity;
          takerOrder.status = 'cancelled';
          return {
            trades: [],
            takerOrder,
            filledQuantity: '0',
            remainingQuantity: takerOrder.quantity,
            avgPrice: '0',
            isFullyFilled: false,
            isBooked: false,
          };
        }
      } else {
        this.addOrder(takerOrder);
        isBooked = true;
      }
    }

    this.lastPrice = trades.length > 0 ? trades[trades.length - 1].price : this.lastPrice;
    this.updateId++;

    return {
      trades,
      takerOrder,
      filledQuantity: totalBase,
      remainingQuantity: remaining,
      avgPrice,
      isFullyFilled,
      isBooked,
    };
  }

  /**
   * 限价卖单撮合
   * 先吃 bid 侧高于等于限价的买单，剩余挂入 ask 侧
   */
  matchLimitSell(
    takerOrder: SkipListOrder,
    maxMatches: number = 100
  ): MatchExecutionResult {
    const trades: MatchTrade[] = [];
    let remaining = takerOrder.remainingQuantity;
    let totalQuote = '0';
    let totalBase = '0';
    let matchCount = 0;

    let current = this.bids.last();

    while (
      current &&
      decIsPositive(remaining) &&
      decCmp(current.level.price, takerOrder.price) >= 0 &&
      matchCount < maxMatches
    ) {
      const priceLevel = current.level;
      const matchQty = decMin(remaining, priceLevel.totalQuantity);

      if (decIsZero(matchQty)) {
        current = current.backward[0];
        continue;
      }

      const result = this.matchAtLevel(
        takerOrder,
        priceLevel,
        matchQty,
        current,
        'buy'
      );

      trades.push(...result.trades);
      remaining = decSub(remaining, result.matchedQty);
      totalQuote = decAdd(totalQuote, result.matchedQuote);
      totalBase = decAdd(totalBase, result.matchedQty);
      matchCount++;

      if (priceLevel.orderCount === 0) {
        const prev = current.backward[0];
        this.bids.remove(priceLevel.price);
        current = prev;
      } else {
        current = current.backward[0];
      }
    }

    const avgPrice = decIsPositive(totalBase)
      ? decDiv(totalQuote, totalBase, 10)
      : takerOrder.price;

    const isFullyFilled = decIsZero(remaining);

    takerOrder.filledQuantity = decAdd(takerOrder.filledQuantity, totalBase);
    takerOrder.remainingQuantity = remaining;
    takerOrder.status = isFullyFilled ? 'filled' : 'partial';
    takerOrder.updatedAt = Date.now();

    let isBooked = false;

    if (!isFullyFilled) {
      if (takerOrder.timeInForce === 'IOC' || takerOrder.timeInForce === 'FOK') {
        if (takerOrder.timeInForce === 'FOK') {
          for (const trade of trades) {
            this.revertTrade(trade);
          }
          takerOrder.filledQuantity = '0';
          takerOrder.remainingQuantity = takerOrder.quantity;
          takerOrder.status = 'cancelled';
          return {
            trades: [],
            takerOrder,
            filledQuantity: '0',
            remainingQuantity: takerOrder.quantity,
            avgPrice: '0',
            isFullyFilled: false,
            isBooked: false,
          };
        }
      } else {
        this.addOrder(takerOrder);
        isBooked = true;
      }
    }

    this.lastPrice = trades.length > 0 ? trades[trades.length - 1].price : this.lastPrice;
    this.updateId++;

    return {
      trades,
      takerOrder,
      filledQuantity: totalBase,
      remainingQuantity: remaining,
      avgPrice,
      isFullyFilled,
      isBooked,
    };
  }

  // -------------------------------------------------------------------------
  // 内部：单价格档位撮合
  // -------------------------------------------------------------------------

  private matchAtLevel(
    takerOrder: SkipListOrder,
    priceLevel: PriceLevel,
    matchQty: string,
    _node: SkipListNode,
    makerSide: OrderSide
  ): {
    trades: MatchTrade[];
    matchedQty: string;
    matchedQuote: string;
  } {
    const trades: MatchTrade[] = [];
    let remainingMatch = matchQty;
    let matchedQuote = '0';
    let matchedQty = '0';

    const ordersToRemove: string[] = [];

    for (const makerOrder of priceLevel.orders) {
      if (!decIsPositive(remainingMatch)) break;
      if (makerOrder.status !== 'open' && makerOrder.status !== 'partial') continue;

      const fillQty = decMin(remainingMatch, makerOrder.remainingQuantity);
      if (decIsZero(fillQty)) continue;

      const quoteQty = decMul(fillQty, priceLevel.price);

      const trade: MatchTrade = {
        tradeId: this.generateTradeId(),
        takerOrderId: takerOrder.id,
        makerOrderId: makerOrder.id,
        takerUserId: takerOrder.userId,
        makerUserId: makerOrder.userId,
        price: priceLevel.price,
        quantity: fillQty,
        quoteQuantity: quoteQty,
        timestamp: Date.now(),
        isMakerBuy: makerSide === 'buy',
      };

      trades.push(trade);

      makerOrder.filledQuantity = decAdd(makerOrder.filledQuantity, fillQty);
      makerOrder.remainingQuantity = decSub(makerOrder.remainingQuantity, fillQty);

      const isMakerFilled = decIsZero(makerOrder.remainingQuantity);
      makerOrder.status = isMakerFilled ? 'filled' : 'partial';
      makerOrder.updatedAt = Date.now();

      if (isMakerFilled) {
        ordersToRemove.push(makerOrder.id);
        this.orders.delete(makerOrder.id);
        const userSet = this.userOrders.get(makerOrder.userId);
        if (userSet) userSet.delete(makerOrder.id);
      }

      priceLevel.totalQuantity = decSub(priceLevel.totalQuantity, fillQty);
      remainingMatch = decSub(remainingMatch, fillQty);
      matchedQty = decAdd(matchedQty, fillQty);
      matchedQuote = decAdd(matchedQuote, quoteQty);
    }

    for (const id of ordersToRemove) {
      const idx = priceLevel.orders.findIndex(o => o.id === id);
      if (idx >= 0) {
        priceLevel.orders.splice(idx, 1);
        priceLevel.orderCount--;
      }
    }

    return { trades, matchedQty, matchedQuote };
  }

  /**
   * 回退一笔成交（用于 FOK 订单失败时回滚）
   */
  private revertTrade(trade: MatchTrade): void {
    const makerOrder = this.orders.get(trade.makerOrderId);
    if (makerOrder) {
      makerOrder.filledQuantity = decSub(makerOrder.filledQuantity, trade.quantity);
      makerOrder.remainingQuantity = decAdd(makerOrder.remainingQuantity, trade.quantity);
      makerOrder.status = 'partial';
      makerOrder.updatedAt = Date.now();
      this.orders.set(trade.makerOrderId, makerOrder);

      const list = trade.isMakerBuy ? this.bids : this.asks;
      const node = list.find(trade.price);
      if (node) {
        node.level.totalQuantity = decAdd(node.level.totalQuantity, trade.quantity);
        if (!node.level.orders.find(o => o.id === trade.makerOrderId)) {
          node.level.orders.unshift(makerOrder);
          node.level.orderCount++;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 订单簿状态查询
  // -------------------------------------------------------------------------

  /**
   * 获取最佳买价
   */
  getBestBid(): { price: string; quantity: string; orderCount: number } | null {
    const best = this.bids.last();
    return best
      ? {
        price: best.level.price,
        quantity: best.level.totalQuantity,
        orderCount: best.level.orderCount,
      }
      : null;
  }

  /**
   * 获取最佳卖价
   */
  getBestAsk(): { price: string; quantity: string; orderCount: number } | null {
    const best = this.asks.first();
    return best
      ? {
        price: best.level.price,
        quantity: best.level.totalQuantity,
        orderCount: best.level.orderCount,
      }
      : null;
  }

  /**
   * 获取买一价档位
   */
  getBestBidLevel(): PriceLevel | null {
    const best = this.bids.last();
    return best ? best.level : null;
  }

  /**
   * 获取卖一价档位
   */
  getBestAskLevel(): PriceLevel | null {
    const best = this.asks.first();
    return best ? best.level : null;
  }

  /**
   * 获取中间价
   */
  getMidPrice(): string | null {
    const bestBid = this.getBestBid();
    const bestAsk = this.getBestAsk();
    if (!bestBid || !bestAsk) return null;
    return decTruncate(decDiv(decAdd(bestBid.price, bestAsk.price), '2', 10), 10);
  }

  /**
   * 获取最新成交价
   */
  getLastPrice(): string {
    return this.lastPrice;
  }

  /**
   * 获取订单簿深度（指定档位数量）
   */
  getDepth(levels: number = 20): {
    bids: Array<{ price: string; quantity: string; orderCount: number } | [string, string, string]>;
    asks: Array<{ price: string; quantity: string; orderCount: number } | [string, string, string]>;
  } {
    const bidLevels: Array<[string, string, string]> = [];
    const askLevels: Array<[string, string, string]> = [];

    let bidCount = 0;
    this.bids.forEachReverse((node) => {
      if (bidCount >= levels) return;
      const cumulative = bidLevels.length > 0
        ? decAdd(bidLevels[bidLevels.length - 1][2], node.level.totalQuantity)
        : node.level.totalQuantity;
      bidLevels.push([
        node.level.price,
        node.level.totalQuantity,
        cumulative,
      ]);
      bidCount++;
    });

    let askCount = 0;
    this.asks.forEach((node) => {
      if (askCount >= levels) return;
      const cumulative = askLevels.length > 0
        ? decAdd(askLevels[askLevels.length - 1][2], node.level.totalQuantity)
        : node.level.totalQuantity;
      askLevels.push([
        node.level.price,
        node.level.totalQuantity,
        cumulative,
      ]);
      askCount++;
    });

    return { bids: bidLevels, asks: askLevels };
  }

  /**
   * 获取订单簿快照
   */
  getSnapshot(levels: number = 100): OrderBookSnapshot {
    const depth = this.getDepth(levels);
    const toObj = (entry: { price: string; quantity: string; orderCount: number } | [string, string, string]) => {
      if (Array.isArray(entry)) {
        return {
          price: entry[0],
          quantity: entry[1],
          orderCount: 0,
        };
      }
      return entry;
    };
    return {
      symbol: this.symbol,
      bids: depth.bids.map(toObj),
      asks: depth.asks.map(toObj),
      lastUpdateId: this.updateId,
      timestamp: Date.now(),
    };
  }

  // -------------------------------------------------------------------------
  // 统计
  // -------------------------------------------------------------------------

  getStats(): {
    totalOrders: number;
    bidLevels: number;
    askLevels: number;
    totalUsers: number;
    updateId: number;
  } {
    return {
      totalOrders: this.orders.size,
      bidLevels: this.bids.getSize(),
      askLevels: this.asks.getSize(),
      totalUsers: this.userOrders.size,
      updateId: this.updateId,
    };
  }

  // -------------------------------------------------------------------------
  // ID 生成
  // -------------------------------------------------------------------------

  private generateTradeId(): string {
    this.tradeSeq++;
    return `trade-${this.symbol}-${Date.now()}-${this.tradeSeq}`;
  }
}
