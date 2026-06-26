/**
 * Iceberg 策略（冰山单）
 *
 * 特点：每次只挂 displayQuantity 大小，市价或限价成交后立即补单，
 *       直至总量全部成交。
 *
 * 公式：
 *   childQty_i = min(remaining, displayQuantity) * (1 ± variance)
 *
 * 适用：希望市场只看到小单，隐藏真实意图。
 */

import {
  decAdd,
  decCmp,
  decIsPositive,
  decIsZero,
  decMul,
  decSub,
  decTruncate,
} from '@/lib/matching/decimal';
import type { AlgoScheduler } from '../scheduler';
import type {
  AlgoChildOrder,
  AlgoConfig,
  AlgoOrder,
  OrderEngineLike,
} from '../types';

export class IcebergStrategy {
  private static activeChildren: Map<
    string,
    { algo: AlgoOrder; submitNext: () => void; cancelled: boolean }
  > = new Map();

  /**
   * 启动冰山：注册一个重复任务，按 displayQuantity 拆单
   */
  start(
    algo: AlgoOrder,
    scheduler: AlgoScheduler,
    orderEngine: OrderEngineLike,
    config: AlgoConfig,
    onChildUpdate: (algo: AlgoOrder, child: AlgoChildOrder) => void,
  ): void {
    if (!algo.displayQuantity) {
      throw new Error('Iceberg: displayQuantity is required');
    }
    if (!decIsPositive(algo.displayQuantity)) {
      throw new Error('Iceberg: displayQuantity must be > 0');
    }

    const displayQty = algo.displayQuantity;
    const variance = algo.variance ?? 0;
    const intervalMs = algo.intervalSec * 1000;

    const ctx = {
      algo,
      cancelled: false,
      submitNext: () => {
        if (ctx.cancelled) return;
        const remaining = decSub(algo.totalQuantity, algo.executedQuantity);
        if (!decIsPositive(remaining)) {
          IcebergStrategy.activeChildren.delete(algo.id);
          return;
        }
        let qty = decCmp(remaining, displayQty) < 0 ? remaining : displayQty;
        if (variance > 0) {
          const v = Math.random() * 2 * variance - variance; // ±variance
          const factor = 1 + v;
          const newQty = decTruncate(decMul(qty, factor.toFixed(6)), 8);
          if (decIsPositive(newQty) && decCmp(newQty, remaining) <= 0) {
            qty = newQty;
          }
        }
        const child: AlgoChildOrder = {
          id: `${algo.id}_ice${algo.childOrders.length}`,
          algoId: algo.id,
          index: algo.childOrders.length,
          type: algo.limitPrice ? 'limit' : 'market',
          side: algo.side,
          price: algo.limitPrice,
          quantity: qty,
          filledQuantity: '0',
          avgPrice: '0',
          status: 'pending',
          scheduledAt: Date.now(),
        };
        algo.childOrders.push(child.id);
        algo.totalCount += 1;
        onChildUpdate(algo, child);
        this.executeChild(algo, child, orderEngine, onChildUpdate);
      },
    };
    IcebergStrategy.activeChildren.set(algo.id, ctx);

    // 立即下一笔
    const startJob = scheduler.scheduleJob(
      `${algo.id}_ice_start`,
      Math.max(algo.startTime, Date.now()),
      () => ctx.submitNext(),
      { algoId: algo.id, tag: 'iceberg' },
    );
    void startJob;

    // 周期性补充（用户也可不用，依赖每笔成交后自动补单）
    if (intervalMs > 0) {
      scheduler.scheduleRepeating(
        `${algo.id}_ice_tick`,
        Math.max(algo.startTime, Date.now()) + intervalMs,
        intervalMs,
        () => {
          if (ctx.cancelled) return;
          if (decIsZero(algo.executedQuantity) && algo.childOrders.length === 0) {
            ctx.submitNext();
          }
        },
        { algoId: algo.id, tag: 'iceberg' },
      );
    }

    // 结束兜底
    scheduler.scheduleJob(
      `${algo.id}_ice_end`,
      algo.endTime + 1000,
      () => {
        // AlgoEngine finalize
      },
      { algoId: algo.id, tag: 'iceberg' },
    );
  }

  /**
   * 成交后自动补单（AlgoEngine 触发）
   */
  static onChildFilled(algoId: string): void {
    const ctx = IcebergStrategy.activeChildren.get(algoId);
    if (!ctx || ctx.cancelled) return;
    // 立即补下一单
    setImmediate(() => ctx.submitNext());
  }

  cancel(algo: AlgoOrder, scheduler: AlgoScheduler): number {
    const ctx = IcebergStrategy.activeChildren.get(algo.id);
    if (ctx) {
      ctx.cancelled = true;
      IcebergStrategy.activeChildren.delete(algo.id);
    }
    return scheduler.cancelByAlgo(algo.id);
  }

  private executeChild(
    algo: AlgoOrder,
    child: AlgoChildOrder,
    orderEngine: OrderEngineLike,
    onChildUpdate: (algo: AlgoOrder, child: AlgoChildOrder) => void,
  ): void {
    child.status = 'submitted';
    onChildUpdate(algo, child);

    let result: {
      orderId: string;
      filledQuantity: string;
      avgPrice: string;
      status: 'filled' | 'partial' | 'rejected' | 'open' | 'cancelled';
      errorMessage?: string;
    };
    try {
      if (child.type === 'limit' && child.price) {
        result = orderEngine.submitLimitOrder({
          userId: algo.userId,
          symbol: algo.symbol,
          side: algo.side,
          quantity: child.quantity,
          price: child.price,
          postOnly: false,
        });
      } else {
        result = orderEngine.submitMarketOrder({
          userId: algo.userId,
          symbol: algo.symbol,
          side: algo.side,
          quantity: child.quantity,
        });
      }
    } catch (e) {
      child.status = 'rejected';
      child.errorMessage = (e as Error).message;
      child.executedAt = Date.now();
      onChildUpdate(algo, child);
      return;
    }

    child.executedAt = Date.now();
    child.filledQuantity = result.filledQuantity;
    child.avgPrice = result.avgPrice;
    if (result.status === 'rejected') {
      child.status = 'rejected';
      child.errorMessage = result.errorMessage;
    } else if (result.status === 'cancelled') {
      child.status = 'cancelled';
    } else if (result.status === 'open') {
      child.status = 'pending';
    } else {
      child.status = 'filled';
    }
    onChildUpdate(algo, child);

    if (decCmp(child.filledQuantity, '0') > 0) {
      algo.executedQuantity = decTruncate(
        decAdd(algo.executedQuantity, child.filledQuantity),
        8,
      );
      algo.totalNotional = decTruncate(
        decAdd(algo.totalNotional, decMul(child.filledQuantity, child.avgPrice)),
        8,
      );
      algo.filledCount += 1;
      // 触发补单
      IcebergStrategy.onChildFilled(algo.id);
    }
  }
}
