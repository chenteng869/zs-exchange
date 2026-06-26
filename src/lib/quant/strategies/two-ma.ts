/**
 * 双均线策略
 *
 * 规则：
 *  - 快线上穿慢线（金叉）→ 买入
 *  - 快线下穿慢线（死叉）→ 卖出（平多）/ 做空
 *  - 仅在金叉/死叉当根 K 产生一次信号
 */

import type { Candle, Signal, Strategy } from '../types';
import { SMA } from '../indicators';

export interface TwoMAConfig {
  fastPeriod?: number;
  slowPeriod?: number;
  /** 允许做空，默认 false */
  shortable?: boolean;
}

export class TwoMAStrategy implements Strategy {
  public readonly id = 'two-ma';
  public readonly name = '双均线策略';

  private readonly fastPeriod: number;
  private readonly slowPeriod: number;
  private readonly shortable: boolean;

  constructor(config: TwoMAConfig = {}) {
    this.fastPeriod = config.fastPeriod ?? 5;
    this.slowPeriod = config.slowPeriod ?? 20;
    this.shortable = config.shortable ?? false;
  }

  evaluate(candles: Candle[], index: number): Signal | null {
    if (index < this.slowPeriod) return null;

    const closes = candles.slice(0, index + 1).map((c) => c.close);
    const fast = SMA(closes, this.fastPeriod);
    const slow = SMA(closes, this.slowPeriod);

    const cur = fast[index];
    const prev = fast[index - 1];
    const curSlow = slow[index];
    const prevSlow = slow[index - 1];

    if (isNaN(prev) || isNaN(cur) || isNaN(prevSlow) || isNaN(curSlow)) return null;

    const c = candles[index];
    const indicators = {
      fast: cur,
      slow: curSlow,
      diff: cur - curSlow,
    };

    // 金叉：快线由下穿上穿慢线
    if (prev <= prevSlow && cur > curSlow) {
      return {
        type: 'buy',
        strength: Math.min(1, Math.abs(cur - curSlow) / curSlow * 50),
        price: c.close,
        reason: `双均线金叉(fast=${cur.toFixed(4)} > slow=${curSlow.toFixed(4)})`,
        indicators,
        timestamp: c.time,
      };
    }
    // 死叉
    if (prev >= prevSlow && cur < curSlow) {
      return {
        type: this.shortable ? 'sell' : 'close',
        strength: Math.min(1, Math.abs(prevSlow - cur) / prevSlow * 50),
        price: c.close,
        reason: `双均线死叉(fast=${cur.toFixed(4)} < slow=${curSlow.toFixed(4)})`,
        indicators,
        timestamp: c.time,
      };
    }
    return null;
  }
}
