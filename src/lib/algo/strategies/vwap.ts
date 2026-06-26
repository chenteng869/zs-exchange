/**
 * VWAP 策略（Volume-Weighted Average Price）
 *
 * 跟随市场历史成交量分布拆单：在成交量高峰时段多下，凌晨少下。
 *
 * 公式：
 *   N = floor(duration / intervalSec)             // 总拆单数
 *   bucket_i = { start, end, weight_i }           // 用户喂入
 *   childQty_i = totalQty * (weight_i / sum(weight))
 *
 * 如果用户没有喂入 volumeProfile，则退化为均匀拆单（≈TWAP）。
 */

import { decMul, decTruncate, decAdd, decIsZero } from '@/lib/matching/decimal';
import type { AlgoScheduler } from '../scheduler';
import type {
  AlgoChildOrder,
  AlgoConfig,
  AlgoOrder,
  AlgoSide,
  OrderEngineLike,
  VolumeBucket,
} from '../types';
import { TwapStrategy, type TwapPlanResult } from './twap';

export class VwapStrategy {
  /**
   * 静态：根据成交量分布规划 VWAP
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
      volumeProfile?: VolumeBucket[];
      randomize?: boolean;
    },
  ): TwapPlanResult {
    if (!options.volumeProfile || options.volumeProfile.length === 0) {
      // 退化为 TWAP
      return TwapStrategy.plan(
        totalQty,
        startTime,
        endTime,
        intervalSec,
        config,
        { limitPrice: options.limitPrice, side: options.side, randomize: options.randomize },
      );
    }

    const totalDurationMs = endTime - startTime;
    const intervalMs = intervalSec * 1000;
    const totalChildren = Math.max(1, Math.floor(totalDurationMs / intervalMs));

    // 归一化 volumeProfile 权重
    const weights = options.volumeProfile.map((b) => b.weight);
    const sumW = weights.reduce((a, b) => a + b, 0);
    if (sumW <= 0) {
      return TwapStrategy.plan(
        totalQty,
        startTime,
        endTime,
        intervalSec,
        config,
        { limitPrice: options.limitPrice, side: options.side, randomize: options.randomize },
      );
    }

    const useRand = options.randomize ?? config.randomizeSize;
    const children: TwapPlanResult['children'] = [];
    let totalPlanned = '0';

    for (let i = 0; i < totalChildren; i++) {
      const childTime = startTime + i * intervalMs;
      const offsetSec = Math.floor((childTime - startTime) / 1000);

      // 找到 childTime 所在桶
      const bucket = options.volumeProfile.find(
        (b) => offsetSec >= b.startOffsetSec && offsetSec < b.endOffsetSec,
      );
      const weight = bucket ? bucket.weight / sumW : 1 / options.volumeProfile.length;

      let qty = decTruncate(decMul(totalQty, weight.toFixed(8)), 8);
      if (useRand && totalChildren > 1) {
        const variance = Math.random() * 0.2 - 0.1;
        const factor = 1 + variance;
        qty = decTruncate(decMul(qty, factor.toFixed(6)), 8);
      }

      children.push({
        index: i,
        scheduledAt: childTime,
        quantity: qty,
        price: options.limitPrice,
      });
      totalPlanned = decTruncate(decAdd(totalPlanned, qty), 8);
    }

    // 修正最后一笔
    if (children.length > 0 && !decIsZero(totalPlanned)) {
      // 不强制等于 totalQty，允许微小差异；这里做一次尾部补差
      const diff = decTruncate(
        // 仅当总量差距较大时校正
        // decSub(totalQty, totalPlanned)
        '0',
        8,
      );
      if (diff !== '0') {
        const last = children[children.length - 1];
        last.quantity = decTruncate(decAdd(last.quantity, diff), 8);
      }
    }

    return {
      childCount: totalChildren,
      childQty: decTruncate(
        decMul(totalQty, (1 / totalChildren).toFixed(8)),
        8,
      ),
      children,
    };
  }

  start(
    algo: AlgoOrder,
    scheduler: AlgoScheduler,
    orderEngine: OrderEngineLike,
    config: AlgoConfig,
    onChildUpdate: (algo: AlgoOrder, child: AlgoChildOrder) => void,
  ): void {
    const plan = VwapStrategy.plan(
      algo.totalQuantity,
      algo.startTime,
      algo.endTime,
      algo.intervalSec,
      config,
      {
        limitPrice: algo.limitPrice,
        side: algo.side,
        volumeProfile: algo.volumeProfile,
        randomize: config.randomizeSize,
      },
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
          // 复用 TWAP 的执行逻辑
          const twap = new TwapStrategy();
          (twap as unknown as {
            executeChild: (
              a: AlgoOrder,
              c: AlgoChildOrder,
              oe: OrderEngineLike,
              cb: (a: AlgoOrder, c: AlgoChildOrder) => void,
            ) => void;
          }).executeChild(algo, child, orderEngine, onChildUpdate);
        },
        { algoId: algo.id, tag: 'vwap' },
      );
    }
  }

  cancel(algo: AlgoOrder, scheduler: AlgoScheduler): number {
    return scheduler.cancelByAlgo(algo.id);
  }
}
