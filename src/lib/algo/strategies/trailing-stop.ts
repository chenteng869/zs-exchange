/**
 * Trailing Stop 策略（追踪止损）
 *
 * 价格达到 activationPrice 后启动追踪：
 *   - 持多(long)：记录 peak = max(peak, price)；当 price <= peak * (1 - callbackRate) 触发市价平仓
 *   - 持空(short)：记录 trough = min(trough, price)；当 price >= trough * (1 + callbackRate) 触发市价平仓
 *
 * 适用：止盈 + 跟踪趋势，让利润奔跑。
 */

import {
  decAdd,
  decCmp,
  decMul,
  decTruncate,
  decSub,
} from '@/lib/matching/decimal';
import type { AlgoScheduler } from '../scheduler';
import type {
  AlgoChildOrder,
  AlgoConfig,
  AlgoOrder,
  AlgoSide,
  OrderEngineLike,
  PriceFeed,
} from '../types';
import { ALGO_PRICE_POLL_INTERVAL_MS, ALGO_TRAILING_CALLBACK_DEFAULT } from '../types';

export class TrailingStopStrategy {
  /**
   * 静态：根据当前价格更新 peak/trough
   */
  static updatePeak(algo: AlgoOrder, currentPrice: string): void {
    if (!algo.peakPrice) {
      algo.peakPrice = currentPrice;
      return;
    }
    if (algo.trailingSide === 'short') {
      if (decCmp(currentPrice, algo.peakPrice) < 0) {
        algo.peakPrice = currentPrice;
      }
    } else {
      if (decCmp(currentPrice, algo.peakPrice) > 0) {
        algo.peakPrice = currentPrice;
      }
    }
  }

  /**
   * 是否触发平仓
   */
  static checkTrigger(algo: AlgoOrder, currentPrice: string): boolean {
    if (!algo.peakPrice) return false;
    if (algo.callbackRate === undefined) return false;
    const cb = algo.callbackRate;
    if (algo.trailingSide === 'short') {
      // 持空：trough 是最低价，price 反弹 cb 比例触发
      // 触发价 = trough * (1 + cb)  ->  decSub(peak, peak*cb) 取负向
      // 由于 decimal 库对 1±cb 的字符串解析存在尾零问题，采用
      // 触发价 = peak + |peak*cb|  （持空时 cb 表示从 trough 反弹的幅度）
      const offset = decTruncate(
        decMul(algo.peakPrice, cb.toString()),
        8,
      );
      const triggerPx = decTruncate(decAdd(algo.peakPrice, offset), 8);
      return decCmp(currentPrice, triggerPx) >= 0;
    }
    // 持多：peak 是最高价，price 回落 cb 比例触发
    // 触发价 = peak - peak*cb
    const offset = decTruncate(
      decMul(algo.peakPrice, cb.toString()),
      8,
    );
    const triggerPx = decTruncate(decSub(algo.peakPrice, offset), 8);
    return decCmp(currentPrice, triggerPx) <= 0;
  }

  start(
    algo: AlgoOrder,
    scheduler: AlgoScheduler,
    orderEngine: OrderEngineLike,
    config: AlgoConfig,
    priceFeed: PriceFeed | null,
    onChildUpdate: (algo: AlgoOrder, child: AlgoChildOrder) => void,
    onAlgoUpdate: (algo: AlgoOrder) => void,
  ): void {
    if (!priceFeed) {
      throw new Error('TrailingStop: priceFeed is required');
    }
    if (algo.callbackRate === undefined) {
      algo.callbackRate = ALGO_TRAILING_CALLBACK_DEFAULT;
    }
    if (algo.trailingSide === undefined) {
      // 推断：side=buy => long；side=sell => short
      algo.trailingSide = algo.side === 'buy' ? 'long' : 'short';
    }
    const pollMs = config.pricePollIntervalMs ?? ALGO_PRICE_POLL_INTERVAL_MS;
    let stopped = false;

    const poll = (): void => {
      if (stopped) return;
      const price = priceFeed.getPrice(algo.symbol);
      if (!price) return;

      // 激活判断
      if (algo.activationPrice) {
        const activated =
          algo.trailingSide === 'long'
            ? decCmp(price, algo.activationPrice) >= 0
            : decCmp(price, algo.activationPrice) <= 0;
        if (!activated && !algo.peakPrice) {
          // 还没激活
          if (Date.now() >= algo.endTime) {
            stopped = true;
            algo.status = 'failed';
            algo.errorMessage = 'activation price not reached';
            algo.completedAt = Date.now();
            onAlgoUpdate(algo);
          }
          return;
        }
      }

      // 更新 peak
      TrailingStopStrategy.updatePeak(algo, price);

      // 检查触发
      if (TrailingStopStrategy.checkTrigger(algo, price)) {
        stopped = true;
        algo.triggered = true;
        algo.endPrice = price;
        TrailingStopStrategy.fireClose(algo, price, orderEngine, onChildUpdate);
        onAlgoUpdate(algo);
        return;
      }

      // endTime 兜底
      if (Date.now() >= algo.endTime) {
        stopped = true;
        algo.status = 'cancelled';
        algo.completedAt = Date.now();
        onAlgoUpdate(algo);
      }
    };

    scheduler.scheduleJob(
      `${algo.id}_ts_check`,
      Date.now() + 50,
      poll,
      { algoId: algo.id, tag: 'trailing' },
    );
    scheduler.scheduleRepeating(
      `${algo.id}_ts_poll`,
      Date.now() + pollMs,
      pollMs,
      poll,
      { algoId: algo.id, tag: 'trailing' },
    );
    scheduler.scheduleJob(
      `${algo.id}_ts_end`,
      algo.endTime,
      () => {
        if (!algo.triggered && algo.status === 'running') {
          stopped = true;
          algo.status = 'cancelled';
          algo.completedAt = Date.now();
          onAlgoUpdate(algo);
        }
      },
      { algoId: algo.id, tag: 'trailing' },
    );
  }

  cancel(algo: AlgoOrder, scheduler: AlgoScheduler): number {
    return scheduler.cancelByAlgo(algo.id);
  }

  private static fireClose(
    algo: AlgoOrder,
    marketPrice: string,
    orderEngine: OrderEngineLike,
    onChildUpdate: (algo: AlgoOrder, child: AlgoChildOrder) => void,
  ): void {
    // TrailingStop 通常用来平仓：side 已是 close 方向
    // 这里假设 algo.side = 需要的平仓方向（buy 关闭空头，sell 关闭多头）
    const closeSide: AlgoSide = algo.side;
    const child: AlgoChildOrder = {
      id: `${algo.id}_ts_close`,
      algoId: algo.id,
      index: 0,
      type: 'market',
      side: closeSide,
      quantity: algo.totalQuantity,
      filledQuantity: '0',
      avgPrice: '0',
      status: 'pending',
      scheduledAt: Date.now(),
    };
    algo.childOrders.push(child.id);
    algo.totalCount = 1;
    onChildUpdate(algo, child);
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
      result = orderEngine.submitMarketOrder({
        userId: algo.userId,
        symbol: algo.symbol,
        side: closeSide,
        quantity: child.quantity,
      });
    } catch (e) {
      child.status = 'rejected';
      child.errorMessage = (e as Error).message;
      child.executedAt = Date.now();
      onChildUpdate(algo, child);
      algo.status = 'failed';
      algo.errorMessage = child.errorMessage;
      algo.completedAt = Date.now();
      return;
    }

    child.executedAt = Date.now();
    child.filledQuantity = result.filledQuantity;
    child.avgPrice = result.avgPrice;
    if (result.status === 'rejected') {
      child.status = 'rejected';
      child.errorMessage = result.errorMessage;
      algo.status = 'failed';
    } else {
      child.status = result.status === 'open' ? 'pending' : 'filled';
      algo.status = 'triggered';
    }
    algo.completedAt = Date.now();
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
      algo.filledCount = 1;
      algo.avgPrice = result.avgPrice;
    }
    if (!algo.endPrice) algo.endPrice = marketPrice;
  }
}
