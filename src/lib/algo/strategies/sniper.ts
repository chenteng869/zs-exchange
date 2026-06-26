/**
 * Sniper 策略（狙击手）
 *
 * 监控价格，到达 triggerPrice 立即下市价 / 限价单。
 * 支持方向：'gte' 价格 >= 触发买入（追涨）；'lte' 价格 <= 触发买入（抄底）。
 *
 * 适用：新币上线 / 突破关键位 / 链上异动等瞬时机会。
 */

import {
  decAdd,
  decCmp,
  decMul,
  decTruncate,
  decIsZero,
} from '@/lib/matching/decimal';
import type { AlgoScheduler } from '../scheduler';
import type {
  AlgoChildOrder,
  AlgoConfig,
  AlgoOrder,
  OrderEngineLike,
  PriceFeed,
} from '../types';
import { ALGO_PRICE_POLL_INTERVAL_MS } from '../types';

export class SniperStrategy {
  /**
   * 检查价格是否触发
   */
  static checkTrigger(algo: AlgoOrder, currentPrice: string): boolean {
    if (!algo.triggerPrice) return false;
    if (algo.triggered) return false;
    const dir = algo.triggerDirection ?? 'lte';
    if (dir === 'gte') {
      return decCmp(currentPrice, algo.triggerPrice) >= 0;
    }
    return decCmp(currentPrice, algo.triggerPrice) <= 0;
  }

  /**
   * 启动 Sniper：周期性检查价格
   */
  start(
    algo: AlgoOrder,
    scheduler: AlgoScheduler,
    orderEngine: OrderEngineLike,
    _config: AlgoConfig,
    priceFeed: PriceFeed | null,
    onChildUpdate: (algo: AlgoOrder, child: AlgoChildOrder) => void,
    onAlgoUpdate: (algo: AlgoOrder) => void,
  ): void {
    if (!algo.triggerPrice) {
      throw new Error('Sniper: triggerPrice is required');
    }
    if (!priceFeed) {
      throw new Error('Sniper: priceFeed is required');
    }
    const pollMs = _config.pricePollIntervalMs ?? ALGO_PRICE_POLL_INTERVAL_MS;
    let stopped = false;

    const poll = (): void => {
      if (stopped || algo.triggered) return;
      const price = priceFeed.getPrice(algo.symbol);
      if (!price) return;
      if (SniperStrategy.checkTrigger(algo, price)) {
        stopped = true;
        algo.triggered = true;
        algo.endPrice = price;
        SniperStrategy.fireMarketOrder(algo, price, orderEngine, onChildUpdate);
        onAlgoUpdate(algo);
        return;
      }
      // 兜底：到达 endTime 仍未触发 -> 失败
      if (Date.now() >= algo.endTime) {
        stopped = true;
        algo.status = 'failed';
        algo.errorMessage = 'trigger not reached within window';
        algo.completedAt = Date.now();
        onAlgoUpdate(algo);
      }
    };

    // 立即检查一次
    scheduler.scheduleJob(
      `${algo.id}_snipe_check`,
      Date.now() + 50,
      poll,
      { algoId: algo.id, tag: 'sniper' },
    );

    // 周期性轮询
    scheduler.scheduleRepeating(
      `${algo.id}_snipe_poll`,
      Date.now() + pollMs,
      pollMs,
      poll,
      { algoId: algo.id, tag: 'sniper' },
    );

    // endTime 兜底
    scheduler.scheduleJob(
      `${algo.id}_snipe_end`,
      algo.endTime,
      () => {
        if (!algo.triggered) {
          stopped = true;
          algo.status = 'failed';
          algo.errorMessage = 'trigger not reached within window';
          algo.completedAt = Date.now();
          onAlgoUpdate(algo);
        }
      },
      { algoId: algo.id, tag: 'sniper' },
    );
  }

  /**
   * 取消 Sniper
   */
  cancel(algo: AlgoOrder, scheduler: AlgoScheduler): number {
    return scheduler.cancelByAlgo(algo.id);
  }

  private static fireMarketOrder(
    algo: AlgoOrder,
    marketPrice: string,
    orderEngine: OrderEngineLike,
    onChildUpdate: (algo: AlgoOrder, child: AlgoChildOrder) => void,
  ): void {
    const child: AlgoChildOrder = {
      id: `${algo.id}_snipe`,
      algoId: algo.id,
      index: 0,
      type: algo.sniperLimitPrice ? 'limit' : 'market',
      side: algo.side,
      price: algo.sniperLimitPrice,
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
    }
    if (decIsZero(algo.avgPrice) || algo.avgPrice === '0') {
      algo.avgPrice = result.avgPrice;
    }
    // endPrice 已在调用前设置；这里再保险一次
    if (!algo.endPrice) algo.endPrice = marketPrice;
  }
}
