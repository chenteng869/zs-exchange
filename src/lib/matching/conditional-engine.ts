/**
 * 条件单引擎（Conditional Order Engine）
 *
 * 支持的条件单类型：
 *  - STOP_LOSS / STOP_LOSS_LIMIT: 止损单
 *  - TAKE_PROFIT / TAKE_PROFIT_LIMIT: 止盈单
 *  - TRAILING_STOP: 跟踪止损单
 *
 * 触发价格类型：
 *  - LAST_PRICE: 最新成交价
 *  - MARK_PRICE: 标记价格
 *  - INDEX_PRICE: 指数价格
 *
 * 工作流程：
 *  1. 用户下单 → 条件单挂入引擎（不进入订单簿）
 *  2. 价格更新 → 检查所有条件单 → 满足触发条件 → 触发
 *  3. 触发 → 生成普通限价/市价单 → 送入撮合引擎
 *  4. 跟踪止损 → 动态调整触发价 → 达到条件时触发
 *
 * 性能优化：
 *  - 按价格排序维护触发队列（跳表/TreeMap 思路）
 *  - 按触发方向分组（向上突破 / 向下突破）
 *  - 价格更新时只检查可能被触发的订单
 */

import { EventEmitter } from 'events';
import {
  decAdd,
  decCmp,
  decDiv,
  decIsPositive,
  decIsZero,
  decMul,
  decSub,
  decMax,
  decMin,
  decAbs,
  decTruncate,
} from './decimal';
import type { OrderSide, OrderType } from '@/types/models';
import type {
  ConditionalOrderConfig,
  ConditionalOrderStatus,
  TrailingStopConfig,
  TrailingStopState,
  AdvancedOrder,
  TriggerType,
  StopLossOrderConfig,
  TakeProfitOrderConfig,
} from './advanced-orders';
import { logger } from '@/lib/logger';

// ============================================================================
// 类型
// ============================================================================

export interface ConditionalEngineOptions {
  /** 单用户最大条件单数 */
  maxConditionalOrdersPerUser?: number;
  /** 单交易对最大条件单数 */
  maxConditionalOrdersPerSymbol?: number;
  /** 触发后订单有效时间（ms） */
  triggeredOrderExpiryMs?: number;
}

export interface SubmitConditionalOrderParams {
  userId: string;
  symbol: string;
  side: OrderSide;
  quantity: string;
  config: ConditionalOrderConfig;
  orderType: OrderType;
  limitPrice?: string;
  clientOrderId?: string;
  remark?: string;
  expireAt?: number;
}

export interface SubmitTrailingStopParams {
  userId: string;
  symbol: string;
  side: OrderSide;
  quantity: string;
  config: TrailingStopConfig;
  orderType: 'market' | 'limit';
  limitPrice?: string;
  clientOrderId?: string;
  remark?: string;
}

export type ConditionalEventType =
  | 'conditionalCreated'
  | 'conditionalTriggered'
  | 'conditionalCancelled'
  | 'conditionalRejected'
  | 'conditionalExpired'
  | 'trailingActivated'
  | 'trailingTriggerPriceUpdated';

export interface TriggerResult {
  /** 被触发的条件单 */
  order: AdvancedOrder;
  /** 触发时的价格 */
  triggerPrice: string;
  /** 生成的普通订单类型 */
  triggeredOrderType: OrderType;
  /** 触发价（限价单使用） */
  triggeredPrice?: string;
  /** 数量 */
  quantity: string;
}

// ============================================================================
// 价格触发树（按价格排序的条件单集合）
// ============================================================================

/**
 * 触发价 → 订单 ID 列表的有序映射
 * 用于快速查找某个价格区间内有哪些条件单会被触发
 */
class TriggerPriceTree {
  private readonly prices: string[] = [];
  private readonly priceToOrders = new Map<string, Set<string>>();

  insert(price: string, orderId: string): void {
    const existing = this.priceToOrders.get(price);
    if (existing) {
      existing.add(orderId);
      return;
    }

    this.priceToOrders.set(price, new Set([orderId]));

    let low = 0;
    let high = this.prices.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (decCmp(this.prices[mid], price) < 0) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    this.prices.splice(low, 0, price);
  }

  remove(price: string, orderId: string): void {
    const orders = this.priceToOrders.get(price);
    if (!orders) return;

    orders.delete(orderId);
    if (orders.size === 0) {
      this.priceToOrders.delete(price);
      const idx = this.prices.indexOf(price);
      if (idx >= 0) {
        this.prices.splice(idx, 1);
      }
    }
  }

  /**
   * 获取价格 ≤ target 的所有订单（用于向下突破触发）
   * 返回订单 ID 列表
   */
  getOrdersBelowOrEqual(target: string): string[] {
    const result: string[] = [];

    let left = 0;
    let right = this.prices.length - 1;
    let boundary = -1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (decCmp(this.prices[mid], target) <= 0) {
        boundary = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    for (let i = 0; i <= boundary; i++) {
      const orders = this.priceToOrders.get(this.prices[i]);
      if (orders) {
        result.push(...orders);
      }
    }

    return result;
  }

  /**
   * 获取价格 ≥ target 的所有订单（用于向上突破触发）
   */
  getOrdersAboveOrEqual(target: string): string[] {
    const result: string[] = [];

    let left = 0;
    let right = this.prices.length - 1;
    let boundary = this.prices.length;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (decCmp(this.prices[mid], target) >= 0) {
        boundary = mid;
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    for (let i = boundary; i < this.prices.length; i++) {
      const orders = this.priceToOrders.get(this.prices[i]);
      if (orders) {
        result.push(...orders);
      }
    }

    return result;
  }

  isEmpty(): boolean {
    return this.prices.length === 0;
  }

  get size(): number {
    let total = 0;
    for (const orders of this.priceToOrders.values()) {
      total += orders.size;
    }
    return total;
  }

  getAllPrices(): string[] {
    return [...this.prices];
  }
}

// ============================================================================
// 条件单引擎
// ============================================================================

export class ConditionalOrderEngine {
  private readonly options: Required<ConditionalEngineOptions>;
  private readonly orders = new Map<string, AdvancedOrder>();
  private readonly userOrders = new Map<string, Set<string>>();
  private readonly symbolOrders = new Map<string, Set<string>>();

  private readonly buyStopTree = new Map<string, TriggerPriceTree>();
  private readonly sellStopTree = new Map<string, TriggerPriceTree>();
  private readonly buyTakeProfitTree = new Map<string, TriggerPriceTree>();
  private readonly sellTakeProfitTree = new Map<string, TriggerPriceTree>();

  private readonly emitter = new EventEmitter();
  private orderIdCounter = 0;

  private readonly lastPrices = new Map<string, string>();
  private readonly markPrices = new Map<string, string>();
  private readonly indexPrices = new Map<string, string>();

  constructor(options: ConditionalEngineOptions = {}) {
    this.options = {
      maxConditionalOrdersPerUser: options.maxConditionalOrdersPerUser ?? 50,
      maxConditionalOrdersPerSymbol: options.maxConditionalOrdersPerSymbol ?? 500,
      triggeredOrderExpiryMs: options.triggeredOrderExpiryMs ?? 24 * 60 * 60 * 1000,
    };
  }

  // -------------------------------------------------------------------------
  // 事件
  // -------------------------------------------------------------------------

  on(event: ConditionalEventType, listener: (payload: unknown) => void): this {
    this.emitter.on(event, listener);
    return this;
  }

  off(event: ConditionalEventType, listener: (payload: unknown) => void): this {
    this.emitter.off(event, listener);
    return this;
  }

  private emit(event: ConditionalEventType, payload: unknown) {
    try {
      this.emitter.emit(event, payload);
    } catch (e) {
      logger.error('[conditional] event listener error', e);
    }
  }

  // -------------------------------------------------------------------------
  // ID 生成
  // -------------------------------------------------------------------------

  private generateOrderId(prefix: string): string {
    this.orderIdCounter++;
    return `${prefix}-${Date.now()}-${this.orderIdCounter}`;
  }

  // -------------------------------------------------------------------------
  // 树管理
  // -------------------------------------------------------------------------

  private getTree(
    treeMap: Map<string, TriggerPriceTree>,
    symbol: string
  ): TriggerPriceTree {
    let tree = treeMap.get(symbol);
    if (!tree) {
      tree = new TriggerPriceTree();
      treeMap.set(symbol, tree);
    }
    return tree;
  }

  private insertIntoTree(order: AdvancedOrder): void {
    if (!order.conditionalConfig) return;

    const config = order.conditionalConfig;
    const symbol = order.symbol;
    const side = order.side;

    let tree: TriggerPriceTree;
    if (config.strategy === 'stop_loss') {
      const treeMap = side === 'buy' ? this.buyStopTree : this.sellStopTree;
      tree = this.getTree(treeMap, symbol);
    } else {
      const treeMap = side === 'buy' ? this.buyTakeProfitTree : this.sellTakeProfitTree;
      tree = this.getTree(treeMap, symbol);
    }

    tree.insert(config.triggerPrice, order.id);
  }

  private removeFromTree(order: AdvancedOrder): void {
    if (!order.conditionalConfig) return;

    const config = order.conditionalConfig;
    const symbol = order.symbol;
    const side = order.side;

    let tree: TriggerPriceTree;
    if (config.strategy === 'stop_loss') {
      const treeMap = side === 'buy' ? this.buyStopTree : this.sellStopTree;
      tree = this.getTree(treeMap, symbol);
    } else {
      const treeMap = side === 'buy' ? this.buyTakeProfitTree : this.sellTakeProfitTree;
      tree = this.getTree(treeMap, symbol);
    }

    tree.remove(config.triggerPrice, order.id);
  }

  // -------------------------------------------------------------------------
  // 提交止损单
  // -------------------------------------------------------------------------

  submitStopLoss(params: SubmitConditionalOrderParams): AdvancedOrder {
    const { userId, symbol, side, quantity, config, orderType, limitPrice, clientOrderId, remark, expireAt } = params;

    if ((config as StopLossOrderConfig).strategy !== 'stop_loss') {
      throw new Error('Invalid config strategy for stop loss');
    }

    this.validateConditionalOrder(userId, symbol);

    const orderId = this.generateOrderId('stop');

    const order: AdvancedOrder = {
      id: orderId,
      userId,
      symbol,
      advancedType: orderType === 'limit' ? 'stop_loss_limit' : 'stop_loss',
      side,
      quantity,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      conditionalConfig: config,
      conditionalState: { triggered: false },
      timeInForce: 'GTC',
      clientOrderId,
      remark,
      expireAt,
    };

    (order as any).triggeredOrderType = orderType;
    (order as any).limitPrice = limitPrice;

    this.orders.set(orderId, order);
    this.addToUserAndSymbol(userId, symbol, orderId);
    this.insertIntoTree(order);

    this.emit('conditionalCreated', { order, type: 'stop_loss' });
    logger.info(`[conditional] stop loss order created ${orderId} trigger=${config.triggerPrice}`);

    return order;
  }

  // -------------------------------------------------------------------------
  // 提交止盈单
  // -------------------------------------------------------------------------

  submitTakeProfit(params: SubmitConditionalOrderParams): AdvancedOrder {
    const { userId, symbol, side, quantity, config, orderType, limitPrice, clientOrderId, remark, expireAt } = params;

    if ((config as TakeProfitOrderConfig).strategy !== 'take_profit') {
      throw new Error('Invalid config strategy for take profit');
    }

    this.validateConditionalOrder(userId, symbol);

    const orderId = this.generateOrderId('tp');

    const order: AdvancedOrder = {
      id: orderId,
      userId,
      symbol,
      advancedType: orderType === 'limit' ? 'take_profit_limit' : 'take_profit',
      side,
      quantity,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      conditionalConfig: config,
      conditionalState: { triggered: false },
      timeInForce: 'GTC',
      clientOrderId,
      remark,
      expireAt,
    };

    (order as any).triggeredOrderType = orderType;
    (order as any).limitPrice = limitPrice;

    this.orders.set(orderId, order);
    this.addToUserAndSymbol(userId, symbol, orderId);
    this.insertIntoTree(order);

    this.emit('conditionalCreated', { order, type: 'take_profit' });
    logger.info(`[conditional] take profit order created ${orderId} trigger=${config.triggerPrice}`);

    return order;
  }

  // -------------------------------------------------------------------------
  // 提交跟踪止损
  // -------------------------------------------------------------------------

  submitTrailingStop(params: SubmitTrailingStopParams): AdvancedOrder {
    const { userId, symbol, side, quantity, config, orderType, limitPrice, clientOrderId, remark } = params;

    this.validateConditionalOrder(userId, symbol);

    if (config.callbackRatio <= 0 || config.callbackRatio >= 1) {
      throw new Error('Callback ratio must be between 0 and 1');
    }

    const orderId = this.generateOrderId('ts');

    const state: TrailingStopState = {
      status: 'pending',
    };

    const order: AdvancedOrder = {
      id: orderId,
      userId,
      symbol,
      advancedType: 'trailing_stop',
      side,
      quantity,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      trailingConfig: config,
      trailingState: state,
      timeInForce: 'GTC',
      clientOrderId,
      remark,
    };

    (order as any).triggeredOrderType = orderType;
    (order as any).limitPrice = limitPrice;

    this.orders.set(orderId, order);
    this.addToUserAndSymbol(userId, symbol, orderId);

    this.emit('conditionalCreated', { order, type: 'trailing_stop' });
    logger.info(`[conditional] trailing stop order created ${orderId}`);

    return order;
  }

  // -------------------------------------------------------------------------
  // 验证
  // -------------------------------------------------------------------------

  private validateConditionalOrder(userId: string, symbol: string): void {
    const userOrders = this.userOrders.get(userId);
    if (userOrders && userOrders.size >= this.options.maxConditionalOrdersPerUser) {
      throw new Error(
        `User ${userId} has reached max conditional orders (${this.options.maxConditionalOrdersPerUser})`
      );
    }

    const symOrders = this.symbolOrders.get(symbol);
    if (symOrders && symOrders.size >= this.options.maxConditionalOrdersPerSymbol) {
      throw new Error(
        `Symbol ${symbol} has reached max conditional orders (${this.options.maxConditionalOrdersPerSymbol})`
      );
    }
  }

  private addToUserAndSymbol(userId: string, symbol: string, orderId: string): void {
    let userSet = this.userOrders.get(userId);
    if (!userSet) {
      userSet = new Set();
      this.userOrders.set(userId, userSet);
    }
    userSet.add(orderId);

    let symSet = this.symbolOrders.get(symbol);
    if (!symSet) {
      symSet = new Set();
      this.symbolOrders.set(symbol, symSet);
    }
    symSet.add(orderId);
  }

  private removeFromUserAndSymbol(userId: string, symbol: string, orderId: string): void {
    const userSet = this.userOrders.get(userId);
    if (userSet) {
      userSet.delete(orderId);
    }
    const symSet = this.symbolOrders.get(symbol);
    if (symSet) {
      symSet.delete(orderId);
    }
  }

  // -------------------------------------------------------------------------
  // 撤单
  // -------------------------------------------------------------------------

  cancelOrder(orderId: string): AdvancedOrder | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (order.status !== 'pending') {
      return null;
    }

    if (order.conditionalConfig) {
      this.removeFromTree(order);
    }

    order.status = 'cancelled';
    order.updatedAt = Date.now();

    this.removeFromUserAndSymbol(order.userId, order.symbol, orderId);

    this.emit('conditionalCancelled', { order });
    logger.info(`[conditional] order cancelled ${orderId}`);

    return order;
  }

  /** 取消用户的所有条件单 */
  cancelAllUserOrders(userId: string): AdvancedOrder[] {
    const orderIds = this.userOrders.get(userId);
    if (!orderIds) return [];

    const cancelled: AdvancedOrder[] = [];
    for (const orderId of Array.from(orderIds)) {
      const result = this.cancelOrder(orderId);
      if (result) cancelled.push(result);
    }

    return cancelled;
  }

  /** 取消某个交易对的所有条件单 */
  cancelAllSymbolOrders(symbol: string): AdvancedOrder[] {
    const orderIds = this.symbolOrders.get(symbol);
    if (!orderIds) return [];

    const cancelled: AdvancedOrder[] = [];
    for (const orderId of Array.from(orderIds)) {
      const result = this.cancelOrder(orderId);
      if (result) cancelled.push(result);
    }

    return cancelled;
  }

  // -------------------------------------------------------------------------
  // 价格更新 → 触发检查
  // -------------------------------------------------------------------------

  /**
   * 更新价格并检查触发
   * @returns 被触发的订单列表
   */
  updatePrice(
    symbol: string,
    price: string,
    triggerType: TriggerType = 'last_price'
  ): TriggerResult[] {
    if (triggerType === 'last_price') {
      this.lastPrices.set(symbol, price);
    } else if (triggerType === 'mark_price') {
      this.markPrices.set(symbol, price);
    } else {
      this.indexPrices.set(symbol, price);
    }

    const triggered: TriggerResult[] = [];

    triggered.push(...this.checkStopLossTriggers(symbol, price, triggerType));
    triggered.push(...this.checkTakeProfitTriggers(symbol, price, triggerType));
    this.updateTrailingStops(symbol, price, triggerType);

    return triggered;
  }

  /**
   * 获取当前价格（根据触发类型）
   */
  private getPrice(symbol: string, triggerType: TriggerType): string | null {
    if (triggerType === 'last_price') {
      return this.lastPrices.get(symbol) ?? null;
    } else if (triggerType === 'mark_price') {
      return this.markPrices.get(symbol) ?? null;
    } else {
      return this.indexPrices.get(symbol) ?? null;
    }
  }

  // -------------------------------------------------------------------------
  // 止损触发检查
  // -------------------------------------------------------------------------

  private checkStopLossTriggers(
    symbol: string,
    currentPrice: string,
    triggerType: TriggerType
  ): TriggerResult[] {
    const results: TriggerResult[] = [];

    const buyTree = this.buyStopTree.get(symbol);
    if (buyTree && !buyTree.isEmpty()) {
      const orderIds = buyTree.getOrdersBelowOrEqual(currentPrice);
      for (const orderId of orderIds) {
        const order = this.orders.get(orderId);
        if (!order || order.status !== 'pending') continue;
        if (!order.conditionalConfig) continue;
        if (order.conditionalConfig.triggerType !== triggerType) continue;
        if (order.side !== 'buy') continue;

        const result = this.triggerOrder(order, currentPrice);
        if (result) results.push(result);
      }
    }

    const sellTree = this.sellStopTree.get(symbol);
    if (sellTree && !sellTree.isEmpty()) {
      const orderIds = sellTree.getOrdersAboveOrEqual(currentPrice);
      for (const orderId of orderIds) {
        const order = this.orders.get(orderId);
        if (!order || order.status !== 'pending') continue;
        if (!order.conditionalConfig) continue;
        if (order.conditionalConfig.triggerType !== triggerType) continue;
        if (order.side !== 'sell') continue;

        const result = this.triggerOrder(order, currentPrice);
        if (result) results.push(result);
      }
    }

    return results;
  }

  // -------------------------------------------------------------------------
  // 止盈触发检查
  // -------------------------------------------------------------------------

  private checkTakeProfitTriggers(
    symbol: string,
    currentPrice: string,
    triggerType: TriggerType
  ): TriggerResult[] {
    const results: TriggerResult[] = [];

    const buyTree = this.buyTakeProfitTree.get(symbol);
    if (buyTree && !buyTree.isEmpty()) {
      const orderIds = buyTree.getOrdersAboveOrEqual(currentPrice);
      for (const orderId of orderIds) {
        const order = this.orders.get(orderId);
        if (!order || order.status !== 'pending') continue;
        if (!order.conditionalConfig) continue;
        if (order.conditionalConfig.triggerType !== triggerType) continue;
        if (order.side !== 'buy') continue;

        const result = this.triggerOrder(order, currentPrice);
        if (result) results.push(result);
      }
    }

    const sellTree = this.sellTakeProfitTree.get(symbol);
    if (sellTree && !sellTree.isEmpty()) {
      const orderIds = sellTree.getOrdersBelowOrEqual(currentPrice);
      for (const orderId of orderIds) {
        const order = this.orders.get(orderId);
        if (!order || order.status !== 'pending') continue;
        if (!order.conditionalConfig) continue;
        if (order.conditionalConfig.triggerType !== triggerType) continue;
        if (order.side !== 'sell') continue;

        const result = this.triggerOrder(order, currentPrice);
        if (result) results.push(result);
      }
    }

    return results;
  }

  // -------------------------------------------------------------------------
  // 触发订单
  // -------------------------------------------------------------------------

  private triggerOrder(order: AdvancedOrder, triggerPrice: string): TriggerResult | null {
    if (order.status !== 'pending') return null;

    this.removeFromTree(order);

    order.status = 'triggered';
    order.updatedAt = Date.now();

    if (order.conditionalConfig && order.conditionalState) {
      order.conditionalState.triggered = true;
      order.conditionalState.triggeredAt = Date.now();
      order.conditionalState.triggeredPrice = triggerPrice;
    }

    const orderType = (order as any).triggeredOrderType ?? 'market';
    const limitPrice = (order as any).limitPrice;

    this.emit('conditionalTriggered', {
      order,
      triggerPrice,
      triggeredOrderType: orderType,
    });

    logger.info(`[conditional] order triggered ${order.id} at ${triggerPrice}`);

    return {
      order,
      triggerPrice,
      triggeredOrderType: orderType,
      triggeredPrice: limitPrice,
      quantity: order.quantity,
    };
  }

  // -------------------------------------------------------------------------
  // 跟踪止损更新
  // -------------------------------------------------------------------------

  private updateTrailingStops(
    symbol: string,
    currentPrice: string,
    triggerType: TriggerType
  ): void {
    const symOrders = this.symbolOrders.get(symbol);
    if (!symOrders) return;

    for (const orderId of symOrders) {
      const order = this.orders.get(orderId);
      if (!order || order.status !== 'pending') continue;
      if (order.advancedType !== 'trailing_stop') continue;
      if (!order.trailingConfig || !order.trailingState) continue;

      this.updateSingleTrailingStop(order, currentPrice, triggerType);
    }
  }

  private updateSingleTrailingStop(
    order: AdvancedOrder,
    currentPrice: string,
    triggerType: TriggerType
  ): void {
    if (!order.trailingConfig || !order.trailingState) return;

    const config = order.trailingConfig;
    const state = order.trailingState;

    if (config.callbackRatio && order.conditionalConfig?.triggerType !== triggerType) {
      return;
    }

    const isLong = order.side === 'sell';

    if (state.status === 'pending') {
      if (config.activationPrice) {
        const reached = isLong
          ? decCmp(currentPrice, config.activationPrice) >= 0
          : decCmp(currentPrice, config.activationPrice) <= 0;

        if (!reached) {
          if (config.activationPrice) {
            const diff = decSub(currentPrice, config.activationPrice);
            const range = decAbs(config.activationPrice);
            state.activationProgress = decCmp(range, '0') > 0
              ? parseFloat(decDiv(decAbs(diff), range, 4))
              : 0;
          }
          return;
        }
      }

      state.status = 'active';
      state.activatedAt = Date.now();

      if (isLong) {
        state.highestPrice = currentPrice;
      } else {
        state.lowestPrice = currentPrice;
      }

      state.currentTriggerPrice = this.calculateTrailingTriggerPrice(
        currentPrice,
        config,
        isLong
      );

      order.updatedAt = Date.now();
      this.emit('trailingActivated', { order, activationPrice: currentPrice });
      logger.info(`[conditional] trailing stop activated ${order.id} at ${currentPrice}`);
      return;
    }

    if (state.status !== 'active') return;

    if (isLong) {
      if (decCmp(currentPrice, state.highestPrice!) > 0) {
        state.highestPrice = currentPrice;
        const newTrigger = this.calculateTrailingTriggerPrice(currentPrice, config, isLong);
        state.currentTriggerPrice = newTrigger;
        order.updatedAt = Date.now();

        this.emit('trailingTriggerPriceUpdated', {
          order,
          newHighest: currentPrice,
          newTriggerPrice: newTrigger,
        });
      }

      if (decCmp(currentPrice, state.currentTriggerPrice!) <= 0) {
        this.triggerTrailingStop(order, currentPrice);
      }
    } else {
      if (decCmp(currentPrice, state.lowestPrice!) < 0) {
        state.lowestPrice = currentPrice;
        const newTrigger = this.calculateTrailingTriggerPrice(currentPrice, config, isLong);
        state.currentTriggerPrice = newTrigger;
        order.updatedAt = Date.now();

        this.emit('trailingTriggerPriceUpdated', {
          order,
          newLowest: currentPrice,
          newTriggerPrice: newTrigger,
        });
      }

      if (decCmp(currentPrice, state.currentTriggerPrice!) >= 0) {
        this.triggerTrailingStop(order, currentPrice);
      }
    }
  }

  private calculateTrailingTriggerPrice(
    referencePrice: string,
    config: TrailingStopConfig,
    isLong: boolean
  ): string {
    if (config.callbackValue) {
      return isLong
        ? decSub(referencePrice, config.callbackValue)
        : decAdd(referencePrice, config.callbackValue);
    }

    const callbackAmount = decMul(referencePrice, String(config.callbackRatio));
    let triggerPrice = isLong
      ? decSub(referencePrice, callbackAmount)
      : decAdd(referencePrice, callbackAmount);

    if (config.minTriggerPrice && decCmp(triggerPrice, config.minTriggerPrice) < 0) {
      triggerPrice = config.minTriggerPrice;
    }
    if (config.maxTriggerPrice && decCmp(triggerPrice, config.maxTriggerPrice) > 0) {
      triggerPrice = config.maxTriggerPrice;
    }

    return decTruncate(triggerPrice, 8);
  }

  private triggerTrailingStop(order: AdvancedOrder, triggerPrice: string): void {
    if (!order.trailingState) return;

    order.trailingState.status = 'triggered';
    order.trailingState.triggeredAt = Date.now();
    order.status = 'triggered';
    order.updatedAt = Date.now();

    const orderType = (order as any).triggeredOrderType ?? 'market';
    const limitPrice = (order as any).limitPrice;

    this.removeFromUserAndSymbol(order.userId, order.symbol, order.id);

    this.emit('conditionalTriggered', {
      order,
      triggerPrice,
      triggeredOrderType: orderType,
      type: 'trailing_stop',
    });

    logger.info(`[conditional] trailing stop triggered ${order.id} at ${triggerPrice}`);
  }

  // -------------------------------------------------------------------------
  // 查询
  // -------------------------------------------------------------------------

  getOrder(orderId: string): AdvancedOrder | undefined {
    return this.orders.get(orderId);
  }

  getUserOrders(userId: string, status?: ConditionalOrderStatus): AdvancedOrder[] {
    const ids = this.userOrders.get(userId);
    if (!ids) return [];

    const orders: AdvancedOrder[] = [];
    for (const id of ids) {
      const order = this.orders.get(id);
      if (!order) continue;
      if (status && order.status !== status) continue;
      orders.push(order);
    }
    return orders;
  }

  getSymbolOrders(symbol: string, status?: ConditionalOrderStatus): AdvancedOrder[] {
    const ids = this.symbolOrders.get(symbol);
    if (!ids) return [];

    const orders: AdvancedOrder[] = [];
    for (const id of ids) {
      const order = this.orders.get(id);
      if (!order) continue;
      if (status && order.status !== status) continue;
      orders.push(order);
    }
    return orders;
  }

  getStats(): {
    totalOrders: number;
    pendingOrders: number;
    triggeredOrders: number;
    cancelledOrders: number;
    totalUsers: number;
    totalSymbols: number;
    trailingStopActive: number;
  } {
    let pending = 0;
    let triggered = 0;
    let cancelled = 0;
    let trailingActive = 0;

    for (const order of this.orders.values()) {
      if (order.status === 'pending') pending++;
      else if (order.status === 'triggered') triggered++;
      else if (order.status === 'cancelled') cancelled++;

      if (order.advancedType === 'trailing_stop' && order.trailingState?.status === 'active') {
        trailingActive++;
      }
    }

    return {
      totalOrders: this.orders.size,
      pendingOrders: pending,
      triggeredOrders: triggered,
      cancelledOrders: cancelled,
      totalUsers: this.userOrders.size,
      totalSymbols: this.symbolOrders.size,
      trailingStopActive: trailingActive,
    };
  }
}
