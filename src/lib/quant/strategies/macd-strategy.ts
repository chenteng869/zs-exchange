/**
 * MACD 策略
 *
 * 规则：
 *  - MACD（柱）由负转正（DIF 上穿 DEA）→ 买入
 *  - MACD（柱）由正转负（DIF 下穿 DEA）→ 卖出 / 平仓
 */

import type { Candle, Signal, Strategy } from '../types';
import { MACD } from '../indicators';

export interface MACDStrategyConfig {
  fast?: number;
  slow?: number;
  signal?: number;
  shortable?: boolean;
}

export class MACDStrategy implements Strategy {
  public readonly id = 'macd';
  public readonly name = 'MACD 策略';

  private readonly fast: number;
  private readonly slow: number;
  private readonly signal: number;
  private readonly shortable: boolean;

  constructor(config: MACDStrategyConfig = {}) {
    this.fast = config.fast ?? 12;
    this.slow = config.slow ?? 26;
    this.signal = config.signal ?? 9;
    this.shortable = config.shortable ?? false;
  }

  evaluate(candles: Candle[], index: number): Signal | null {
    if (index < this.slow) return null;

    const closes = candles.slice(0, index + 1).map((c) => c.close);
    const points = MACD(closes, this.fast, this.slow, this.signal);
    const cur = points[index];
    const prev = points[index - 1];

    if (!cur || !prev || isNaN(cur.histogram) || isNaN(prev.histogram)) return null;

    const c = candles[index];
    const indicators = {
      macd: cur.macd,
      signal: cur.signal,
      histogram: cur.histogram,
    };

    // 金叉：histogram 由负转正
    if (prev.histogram <= 0 && cur.histogram > 0) {
      return {
        type: 'buy',
        strength: Math.min(1, Math.abs(cur.histogram) * 10),
        price: c.close,
        reason: `MACD 金叉(hist=${cur.histogram.toFixed(4)} > 0)`,
        indicators,
        timestamp: c.time,
      };
    }
    // 死叉
    if (prev.histogram >= 0 && cur.histogram < 0) {
      return {
        type: this.shortable ? 'sell' : 'close',
        strength: Math.min(1, Math.abs(cur.histogram) * 10),
        price: c.close,
        reason: `MACD 死叉(hist=${cur.histogram.toFixed(4)} < 0)`,
        indicators,
        timestamp: c.time,
      };
    }
    return null;
  }
}
