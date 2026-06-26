/**
 * TWAP 策略（Time-Weighted Average Price）
 *
 * 在固定时间窗口 [startTime, endTime] 内，按 intervalSec 均匀拆单。
 *
 * 公式：
 *   childCount = floor((endTime - startTime) / (intervalSec * 1000))
 *   childQty   = totalQty / childCount   （± randomize）
 *
 * 适用：希望以时间为权重均匀成交，弱化对市场冲击。
 */

import { decAdd, decCmp, decDiv, decMul, decSub, decTruncate, decIsZero, decIsPositive } from '@/lib/matching/decimal';
import type { AlgoScheduler } from '../scheduler';
import type {
  AlgoChildOrder,
  AlgoConfig,
  AlgoOrder,
  AlgoSide,
  OrderEngineLike,
} from '../types';
import { ALGO_MIN_CHILD_INTERVAL_SEC, ALGO_MAX_CHILD_ORDERS } from '../types';

export interface TwapChildSpec {
  index: number;
  scheduledAt: number;
  quantity: string;
  price?: string;
}

export interface TwapPlanResult {
  childCount: number;
  childQty: string;
  children: TwapChildSpec[];
}

export class TwapStrategy {
  /**
   * 静态：计算 TWAP 拆单计划
   */
  static plan(
    totalQty: string,
    startTime: number,
    endTime: number,
    intervalSec: number,
    config: AlgoConfig,
    options: {
      limitPrice?: string;
      side: AlgoSide;
      randomize?: boolean;
    } = { side: 'buy' },
  ): TwapPlanResult {
    if (endTime <= startTime) {
      throw new Error('TWAP: endTime must be > startTime');
    }
    if (intervalSec < ALGO_MIN_CHILD_INTERVAL_SEC) {
      throw new Error(`TWAP: intervalSec must be >= ${ALGO_MIN_CHILD_INTERVAL_SEC}`);
    }
    if (!decIsPositive(totalQty)) {
      throw new Error('TWAP: totalQty must be > 0');
    }

    const totalDurationMs = endTime - startTime;
    const intervalMs = intervalSec * 1000;
    let childCount = Math.floor(totalDurationMs / intervalMs);
    if (childCount < 1) childCount = 1;
    if (childCount > ALGO_MAX_CHILD_ORDERS) {
      childCount = ALGO_MAX_CHILD_ORDERS;
    }

    const baseChildQty = decTruncate(decDiv(totalQty, String(childCount), 18), 8);
    const children: TwapChildSpec[] = [];
    const useRand = options.randomize ?? config.randomizeSize;
    const side = options.side;

    for (let i = 0; i < childCount; i++) {
      let qty = baseChildQty;
      if (useRand && childCount > 1) {
        // ±10% 抖动
        const variance = (Math.random() * 0.2 - 0.1);
        const factor = 1 + variance;
        const newQty = decTruncate(decMul(baseChildQty, factor.toFixed(6)), 8);
        if (decIsPositive(newQty)) {
          qty = newQty;
        }
      }
      const scheduledAt = startTime + i * intervalMs;
      children.push({
        index: i,
        scheduledAt,
        quantity: qty,
        price: options.limitPrice,
      });
    }

    // 修正尾单数量，保证总和 = totalQty
    const plannedSum = children.reduce(
      (acc, c) => decTruncate(decAdd(acc, c.quantity), 8),
      '0' as string,
    );
    const diff = decTruncate(decSub(totalQty, plannedSum), 8);
    if (!decIsZero(diff) && children.length > 0) {
      const last = children[children.length - 1];
      last.quantity = decTruncate(decAdd(last.quantity, diff), 8);
      if (!decIsPositive(last.quantity)) {
        // 极端情况下，diff 太大，最后一单调整即可
        last.quantity = decTruncate(decAdd(baseChildQty, diff), 8);
      }
    }
    void side;

    return {
      childCount,
      childQty: baseChildQty,
      children,
    };
  }

  /**
   * 启动 TWAP：把每个子单注册到调度器，到点执行
   */
  start(
    algo: AlgoOrder,
    scheduler: AlgoScheduler,
    orderEngine: OrderEngineLike,
    config: AlgoConfig,
    onChildUpdate: (algo: AlgoOrder, child: AlgoChildOrder) => void,
  ): void {
    const plan = TwapStrategy.plan(
      algo.totalQuantity,
      algo.startTime,
      algo.endTime,
      algo.intervalSec,
      config,
      { limitPrice: algo.limitPrice, side: algo.side, randomize: config.randomizeSize },
    );

    for (const spec of plan.children) {
      const childId = `${algo.id}_c${spec.index}`;
      const child: AlgoChildOrder = {
        id: childId,
        algoId: algo.id,
        index: spec.index,
        type: algo.limitPrice ? 'limit' : 'market',
        side: algo.side,
        price: spec.price,
        quantity: spec.quantity,
        filledQuantity: '0',
        avgPrice: '0',
        status: 'pending',
        scheduledAt: spec.scheduledAt,
      };
      algo.childOrders.push(childId);
      algo.totalCount = plan.childCount;
      onChildUpdate(algo, child);

      scheduler.scheduleJob(
        childId,
        spec.scheduledAt,
        () => {
          this.executeChild(algo, child, orderEngine, onChildUpdate);
        },
        { algoId: algo.id, tag: 'twap' },
      );
    }

    // 结束兜底：endTime + 1s 检查是否完成
    scheduler.scheduleJob(
      `${algo.id}_finalize`,
      algo.endTime + 1000,
      () => {
        // 由 AlgoEngine 决定是否 finalize
      },
      { algoId: algo.id, tag: 'twap-finalize' },
    );
  }

  /**
   * 取消 TWAP
   */
  cancel(algo: AlgoOrder, scheduler: AlgoScheduler): number {
    const removed = scheduler.cancelByAlgo(algo.id);
    return removed;
  }

  /**
   * 执行单个子单
   */
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
    } else {
      child.status = result.status === 'open' ? 'pending' : 'filled';
    }
    onChildUpdate(algo, child);

    // 累计到 algo
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
    }
  }
}
