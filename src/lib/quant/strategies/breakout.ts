/**
 * 突破策略（Breakout）
 *
 * 规则：
 *  - 突破 N 日新高 → 买入
 *  - 跌破 N 日新低 → 卖出
 *  - 用 ATR 作为波动止损（默认 2 倍 ATR）
 */

import type { Candle, Signal, Strategy } from '../types';
import { ATR, BREAKOUT_LOOKBACK } from '../indicators';

export interface BreakoutConfig {
  /** 回溯窗口 */
  lookback?: number;
  /** ATR 止损倍数 */
  atrMultiplier?: number;
  /** ATR 周期 */
  atrPeriod?: number;
  shortable?: boolean;
}

export class BreakoutStrategy implements Strategy {
  public readonly id = 'breakout';
  public readonly name = '突破策略';

  private readonly lookback: number;
  private readonly atrMultiplier: number;
  private readonly atrPeriod: number;
  private readonly shortable: boolean;

  constructor(config: BreakoutConfig = {}) {
    this.lookback = config.lookback ?? BREAKOUT_LOOKBACK;
    this.atrMultiplier = config.atrMultiplier ?? 2;
    this.atrPeriod = config.atrPeriod ?? 14;
    this.shortable = config.shortable ?? false;
  }

  evaluate(candles: Candle[], index: number): Signal | null {
    if (index < Math.max(this.lookback, this.atrPeriod)) return null;

    const slice = candles.slice(index - this.lookback, index);
    const highN = Math.max(...slice.map((c) => c.high));
    const lowN = Math.min(...slice.map((c) => c.low));

    const high = candles.slice(0, index + 1).map((c) => c.high);
    const low = candles.slice(0, index + 1).map((c) => c.low);
    const close = candles.slice(0, index + 1).map((c) => c.close);
    const atr = ATR(high, low, close, this.atrPeriod);
    const curAtr = atr[index];

    const c = candles[index];
    const indicators = {
      highN,
      lowN,
      atr: isNaN(curAtr) ? 0 : curAtr,
      stopLoss: isNaN(curAtr) ? 0 : c.close - this.atrMultiplier * curAtr,
    };

    // 突破 N 日新高
    if (c.close > highN) {
      return {
        type: 'buy',
        strength: Math.min(1, (c.close - highN) / highN * 20),
        price: c.close,
        reason: `突破 ${this.lookback} 周期新高(${highN.toFixed(4)})`,
        indicators,
        timestamp: c.time,
      };
    }
    // 跌破 N 日新低
    if (c.close < lowN) {
      return {
        type: this.shortable ? 'sell' : 'close',
        strength: Math.min(1, (lowN - c.close) / lowN * 20),
        price: c.close,
        reason: `跌破 ${this.lookback} 周期新低(${lowN.toFixed(4)})`,
        indicators,
        timestamp: c.time,
      };
    }
    return null;
  }
}
