/**
 * 冰山单引擎（Iceberg Engine）
 *
 * 冰山单 = 大单拆成多个小峰值，每次只暴露 peakQty 到订单簿
 * 当一个峰值成交完后，自动补充下一个峰值
 * 可选：随机化峰值数量（±一定比例），防止被侦测
 *
 * 核心逻辑：
 *  1. 收到冰山单 → 生成第一个峰值订单 → 挂入订单簿
 *  2. 峰值被成交 → 检查剩余总量 → 生成新峰值 → 重新挂入
 *  3. 剩余不足峰值时 → 全部挂出
 *  4. 撤单 → 同时撤掉当前峰值 + 标记冰山单取消
 *
 * 与撮合引擎协作：
 *  - 撮合引擎只看到"普通限价单"（峰值订单）
 *  - 冰山引擎负责维护"父订单"状态和峰值补充
 *  - 成交通知 → 冰山引擎 → 补充峰值 → 触发新撮合
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
  decTruncate,
  decMin,
  decMax,
  decAbs,
} from './decimal';
import type { OrderSide, OrderStatus } from '@/types/models';
type OrderTimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTD';
import type {
  IcebergOrderConfig,
  IcebergOrderState,
  AdvancedOrder,
  MatchTrade,
} from './advanced-orders';
import { logger } from '@/lib/logger';

// ============================================================================
// 配置
// ============================================================================

/** 默认随机比例 */
const DEFAULT_RANDOM_RATIO = 0.1;
/** 最小峰值数量（防止峰值太小） */
const MIN_PEAK_QTY = '0.00000001';

// ============================================================================
// 类型
// ============================================================================

export interface IcebergEngineOptions {
  /** 是否启用随机峰值 */
  enableRandomPeak?: boolean;
  /** 默认随机比例 */
  defaultRandomRatio?: number;
  /** 单用户最大冰山单数 */
  maxIcebergOrdersPerUser?: number;
}

export interface IcebergSubmitResult {
  /** 冰山父订单 */
  parentOrder: AdvancedOrder;
  /** 首个峰值订单 ID（挂入订单簿的） */
  firstPeakOrderId: string;
  /** 首个峰值数量 */
  firstPeakQty: string;
}

export type IcebergEventType =
  | 'icebergCreated'
  | 'icebergPeakRefilled'
  | 'icebergFilled'
  | 'icebergCancelled'
  | 'icebergPartialFilled';

// ============================================================================
// 引擎
// ============================================================================

export class IcebergEngine {
  private readonly options: Required<IcebergEngineOptions>;
  private readonly icebergOrders = new Map<string, AdvancedOrder>();
  /** 峰值订单 ID → 父订单 ID 的映射 */
  private readonly peakToParent = new Map<string, string>();
  /** 用户 → 冰山单 ID 列表 */
  private readonly userIcebergs = new Map<string, Set<string>>();
  private readonly emitter = new EventEmitter();
  private orderIdCounter = 0;

  constructor(options: IcebergEngineOptions = {}) {
    this.options = {
      enableRandomPeak: options.enableRandomPeak ?? true,
      defaultRandomRatio: options.defaultRandomRatio ?? DEFAULT_RANDOM_RATIO,
      maxIcebergOrdersPerUser: options.maxIcebergOrdersPerUser ?? 20,
    };
  }

  // -------------------------------------------------------------------------
  // 事件订阅
  // -------------------------------------------------------------------------

  on(event: IcebergEventType, listener: (payload: unknown) => void): this {
    this.emitter.on(event, listener);
    return this;
  }

  off(event: IcebergEventType, listener: (payload: unknown) => void): this {
    this.emitter.off(event, listener);
    return this;
  }

  private emit(event: IcebergEventType, payload: unknown) {
    try {
      this.emitter.emit(event, payload);
    } catch (e) {
      logger.error('[iceberg] event listener error', e);
    }
  }

  // -------------------------------------------------------------------------
  // 工具方法
  // -------------------------------------------------------------------------

  private generateOrderId(): string {
    this.orderIdCounter++;
    return `iceberg-${Date.now()}-${this.orderIdCounter}`;
  }

  private generatePeakOrderId(parentId: string): string {
    return `peak-${parentId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  /**
   * 计算下一个峰值的数量
   * 如果启用了随机化，在 [peak * (1-ratio), peak * (1+ratio)] 之间随机
   */
  private calculateNextPeakQty(
    remainingTotal: string,
    config: IcebergOrderConfig
  ): string {
    const { peakQty, randomizePeak, randomRatio } = config;

    if (!randomizePeak || !this.options.enableRandomPeak) {
      return decMin(remainingTotal, peakQty);
    }

    const ratio = randomRatio ?? this.options.defaultRandomRatio;
    const minPeak = decMul(peakQty, String(1 - ratio));
    const maxPeak = decMul(peakQty, String(1 + ratio));

    const randomFactor = Math.random() * 2 * ratio + (1 - ratio);
    let nextPeak = decMul(peakQty, String(randomFactor));

    nextPeak = decMax(nextPeak, minPeak);
    nextPeak = decMin(nextPeak, maxPeak);
    nextPeak = decMin(nextPeak, remainingTotal);
    nextPeak = decMax(nextPeak, MIN_PEAK_QTY);

    return decTruncate(nextPeak, 8);
  }

  // -------------------------------------------------------------------------
  // 创建冰山单
  // -------------------------------------------------------------------------

  /**
   * 创建冰山单
   * @returns 父订单 + 首个峰值订单信息
   */
  createIcebergOrder(params: {
    userId: string;
    symbol: string;
    side: OrderSide;
    config: IcebergOrderConfig;
    timeInForce?: OrderTimeInForce;
    clientOrderId?: string;
  }): IcebergSubmitResult {
    const { userId, symbol, side, config, timeInForce = 'GTC', clientOrderId } = params;

    this.validateIcebergConfig(config);

    const userOrders = this.userIcebergs.get(userId) ?? new Set();
    if (userOrders.size >= this.options.maxIcebergOrdersPerUser) {
      throw new Error(`User ${userId} has reached max iceberg orders (${this.options.maxIcebergOrdersPerUser})`);
    }

    const parentId = this.generateOrderId();
    const firstPeakQty = this.calculateNextPeakQty(config.totalQty, config);
    const firstPeakOrderId = this.generatePeakOrderId(parentId);

    const state: IcebergOrderState = {
      remainingTotal: config.totalQty,
      currentPeakRemaining: firstPeakQty,
      filledTotal: '0',
      completedPeaks: 0,
      avgPrice: '0',
    };

    const parentOrder: AdvancedOrder = {
      id: parentId,
      userId,
      symbol,
      advancedType: 'iceberg',
      side,
      quantity: config.totalQty,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      icebergConfig: config,
      icebergState: state,
      timeInForce,
      clientOrderId,
    };

    this.icebergOrders.set(parentId, parentOrder);
    this.peakToParent.set(firstPeakOrderId, parentId);
    userOrders.add(parentId);
    this.userIcebergs.set(userId, userOrders);

    parentOrder.status = 'active';
    parentOrder.updatedAt = Date.now();

    this.emit('icebergCreated', {
      parentOrder,
      firstPeakOrderId,
      firstPeakQty,
    });

    logger.info(`[iceberg] created order ${parentId} peak ${firstPeakOrderId} qty ${firstPeakQty}`);

    return {
      parentOrder,
      firstPeakOrderId,
      firstPeakQty,
    };
  }

  /**
   * 验证冰山单配置
   */
  private validateIcebergConfig(config: IcebergOrderConfig): void {
    const { totalQty, peakQty } = config;

    if (!decIsPositive(totalQty)) {
      throw new Error('Total quantity must be positive');
    }
    if (!decIsPositive(peakQty)) {
      throw new Error('Peak quantity must be positive');
    }
    if (decCmp(peakQty, totalQty) > 0) {
      throw new Error('Peak quantity cannot exceed total quantity');
    }
  }

  // -------------------------------------------------------------------------
  // 成交通知 → 补充峰值
  // -------------------------------------------------------------------------

  /**
   * 当峰值订单成交时调用
   * @returns 需要补充的新峰值信息（如果还有剩余）
   */
  onPeakFilled(
    peakOrderId: string,
    filledQty: string,
    fillPrice: string
  ): {
    parentOrder: AdvancedOrder;
    newPeakOrderId?: string;
    newPeakQty?: string;
    isFullyFilled: boolean;
  } | null {
    const parentId = this.peakToParent.get(peakOrderId);
    if (!parentId) {
      return null;
    }

    const parent = this.icebergOrders.get(parentId);
    if (!parent || !parent.icebergState || !parent.icebergConfig) {
      return null;
    }

    const state = parent.icebergState;
    const config = parent.icebergConfig;

    if (!decIsPositive(filledQty)) {
      return { parentOrder: parent, isFullyFilled: false };
    }

    const prevFilledTotal = state.filledTotal;
    state.filledTotal = decAdd(state.filledTotal, filledQty);
    state.remainingTotal = decSub(state.remainingTotal, filledQty);
    state.currentPeakRemaining = decSub(state.currentPeakRemaining, filledQty);

    if (decCmp(state.filledTotal, '0') > 0) {
      const prevTotal = decMul(prevFilledTotal, state.avgPrice);
      const currentFillValue = decMul(filledQty, fillPrice);
      const newTotalValue = decAdd(prevTotal, currentFillValue);
      state.avgPrice = decDiv(newTotalValue, state.filledTotal, 10);
    }

    if (decIsPositive(state.currentPeakRemaining)) {
      parent.updatedAt = Date.now();
      return { parentOrder: parent, isFullyFilled: false };
    }

    state.completedPeaks += 1;
    this.peakToParent.delete(peakOrderId);

    if (decIsZero(state.remainingTotal) || decCmp(state.remainingTotal, '0') <= 0) {
      parent.status = 'triggered';
      parent.updatedAt = Date.now();

      this.emit('icebergFilled', {
        parentOrder: parent,
        totalFilled: state.filledTotal,
        avgPrice: state.avgPrice,
      });

      logger.info(`[iceberg] order ${parentId} fully filled avg=${state.avgPrice}`);

      return { parentOrder: parent, isFullyFilled: true };
    }

    const newPeakQty = this.calculateNextPeakQty(state.remainingTotal, config);
    const newPeakOrderId = this.generatePeakOrderId(parentId);

    state.currentPeakRemaining = newPeakQty;
    this.peakToParent.set(newPeakOrderId, parentId);
    parent.updatedAt = Date.now();

    this.emit('icebergPeakRefilled', {
      parentOrder: parent,
      newPeakOrderId,
      newPeakQty,
      peakNumber: state.completedPeaks + 1,
    });

    this.emit('icebergPartialFilled', {
      parentOrder: parent,
      filledQty,
      fillPrice,
      totalFilled: state.filledTotal,
    });

    logger.info(`[iceberg] peak refilled for ${parentId} new peak ${newPeakOrderId}`);

    return {
      parentOrder: parent,
      newPeakOrderId,
      newPeakQty,
      isFullyFilled: false,
    };
  }

  // -------------------------------------------------------------------------
  // 撤单
  // -------------------------------------------------------------------------

  /**
   * 取消冰山单
   * @returns 当前正在挂单的峰值订单 ID（需要从订单簿撤掉）
   */
  cancelIcebergOrder(parentOrderId: string): {
    parentOrder: AdvancedOrder;
    currentPeakOrderId: string | null;
    remainingTotal: string;
  } | null {
    const parent = this.icebergOrders.get(parentOrderId);
    if (!parent) {
      return null;
    }

    if (parent.status === 'cancelled' || parent.status === 'triggered') {
      return null;
    }

    let currentPeakId: string | null = null;
    for (const [peakId, pId] of this.peakToParent.entries()) {
      if (pId === parentOrderId) {
        currentPeakId = peakId;
        this.peakToParent.delete(peakId);
        break;
      }
    }

    parent.status = 'cancelled';
    parent.updatedAt = Date.now();

    const userOrders = this.userIcebergs.get(parent.userId);
    if (userOrders) {
      userOrders.delete(parentOrderId);
    }

    this.emit('icebergCancelled', {
      parentOrder: parent,
      cancelledPeakId: currentPeakId,
      remainingTotal: parent.icebergState?.remainingTotal ?? '0',
    });

    logger.info(`[iceberg] cancelled order ${parentOrderId}`);

    return {
      parentOrder: parent,
      currentPeakOrderId: currentPeakId,
      remainingTotal: parent.icebergState?.remainingTotal ?? '0',
    };
  }

  // -------------------------------------------------------------------------
  // 查询
  // -------------------------------------------------------------------------

  /** 获取冰山单详情 */
  getIcebergOrder(orderId: string): AdvancedOrder | undefined {
    return this.icebergOrders.get(orderId);
  }

  /** 根据峰值订单 ID 获取父订单 */
  getParentByPeakId(peakOrderId: string): AdvancedOrder | undefined {
    const parentId = this.peakToParent.get(peakOrderId);
    if (!parentId) return undefined;
    return this.icebergOrders.get(parentId);
  }

  /** 获取用户的所有冰山单 */
  getUserIcebergOrders(userId: string): AdvancedOrder[] {
    const ids = this.userIcebergs.get(userId);
    if (!ids) return [];
    return Array.from(ids)
      .map(id => this.icebergOrders.get(id))
      .filter((o): o is AdvancedOrder => o !== undefined);
  }

  /** 获取活动冰山单数 */
  getActiveCount(userId?: string): number {
    if (userId) {
      return this.userIcebergs.get(userId)?.size ?? 0;
    }
    let count = 0;
    for (const order of this.icebergOrders.values()) {
      if (order.status === 'active') count++;
    }
    return count;
  }

  /** 获取所有冰山单（用于快照） */
  getAllIcebergOrders(): AdvancedOrder[] {
    return Array.from(this.icebergOrders.values());
  }

  // -------------------------------------------------------------------------
  // 批量处理
  // -------------------------------------------------------------------------

  /**
   * 处理一批成交记录
   * 用于撮合引擎批量返回成交后，统一处理冰山单补充
   */
  processMatches(trades: MatchTrade[]): Array<{
    parentId: string;
    newPeakOrderId?: string;
    newPeakQty?: string;
    isFullyFilled: boolean;
  }> {
    const parentFillMap = new Map<string, { qty: string; price: string }>();

    for (const trade of trades) {
      const parentIdMaker = this.peakToParent.get(trade.makerOrderId);
      if (parentIdMaker) {
        const existing = parentFillMap.get(parentIdMaker);
        if (existing) {
          const newQty = decAdd(existing.qty, trade.quantity);
          const newTotal = decAdd(
            decMul(existing.qty, existing.price),
            decMul(trade.quantity, trade.price)
          );
          existing.qty = newQty;
          existing.price = decDiv(newTotal, newQty, 10);
        } else {
          parentFillMap.set(parentIdMaker, { qty: trade.quantity, price: trade.price });
        }
      }

      const parentIdTaker = this.peakToParent.get(trade.takerOrderId);
      if (parentIdTaker) {
        const existing = parentFillMap.get(parentIdTaker);
        if (existing) {
          const newQty = decAdd(existing.qty, trade.quantity);
          const newTotal = decAdd(
            decMul(existing.qty, existing.price),
            decMul(trade.quantity, trade.price)
          );
          existing.qty = newQty;
          existing.price = decDiv(newTotal, newQty, 10);
        } else {
          parentFillMap.set(parentIdTaker, { qty: trade.quantity, price: trade.price });
        }
      }
    }

    const results: Array<{
      parentId: string;
      newPeakOrderId?: string;
      newPeakQty?: string;
      isFullyFilled: boolean;
    }> = [];

    for (const [parentId, fill] of parentFillMap.entries()) {
      const result = this.onPeakFilled(
        Array.from(this.peakToParent.entries()).find(([_, pId]) => pId === parentId)?.[0] ?? '',
        fill.qty,
        fill.price
      );
      if (result) {
        results.push({
          parentId,
          newPeakOrderId: result.newPeakOrderId,
          newPeakQty: result.newPeakQty,
          isFullyFilled: result.isFullyFilled,
        });
      }
    }

    return results;
  }

  // -------------------------------------------------------------------------
  // 统计信息
  // -------------------------------------------------------------------------

  /** 获取统计信息 */
  getStats(): {
    totalIcebergOrders: number;
    activeIcebergOrders: number;
    activePeakOrders: number;
    totalUsers: number;
  } {
    let activeCount = 0;
    for (const order of this.icebergOrders.values()) {
      if (order.status === 'active') activeCount++;
    }

    return {
      totalIcebergOrders: this.icebergOrders.size,
      activeIcebergOrders: activeCount,
      activePeakOrders: this.peakToParent.size,
      totalUsers: this.userIcebergs.size,
    };
  }
}
