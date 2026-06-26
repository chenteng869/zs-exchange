/**
 * 网格交易策略（Grid Trading）
 *
 * 规则：
 *  - 价格区间 [lower, upper]，划分 N 格
 *  - 价格跌穿下一格 → 买入（抄底）
 *  - 价格涨破上一格 → 卖出（高抛）
 *  - 价格回归到中轴 → 止盈全部仓位
 */

import type { Candle, Signal, Strategy } from '../types';
import { GRID_DEFAULT_LEVELS } from '../indicators';

export interface GridConfig {
  /** 价格区间下沿 */
  lower: number;
  /** 价格区间上沿 */
  upper: number;
  /** 网格层数 */
  levels?: number;
  /** 中轴回归止盈（默认 true） */
  rebalanceOnMid?: boolean;
}

export class GridStrategy implements Strategy {
  public readonly id = 'grid';
  public readonly name = '网格交易策略';

  private readonly lower: number;
  private readonly upper: number;
  private readonly levels: number;
  private readonly rebalanceOnMid: boolean;
  /** 上一根 K 线所处的网格层 */
  private lastLevel = -1;

  constructor(config: GridConfig) {
    if (!(config.upper > config.lower)) {
      throw new Error('[grid] upper must be greater than lower');
    }
    this.lower = config.lower;
    this.upper = config.upper;
    this.levels = config.levels ?? GRID_DEFAULT_LEVELS;
    this.rebalanceOnMid = config.rebalanceOnMid ?? true;
  }

  evaluate(candles: Candle[], index: number): Signal | null {
    if (index < 1) return null;
    const c = candles[index];
    const price = c.close;
    if (price < this.lower || price > this.upper) return null;

    const step = (this.upper - this.lower) / this.levels;
    const curLevel = Math.floor((price - this.lower) / step);
    const midLevel = this.levels / 2;
    const indicators = {
      lower: this.lower,
      upper: this.upper,
      levels: this.levels,
      curLevel,
    };

    // 中轴回归止盈
    if (
      this.rebalanceOnMid &&
      this.lastLevel >= 0 &&
      Math.abs(curLevel - midLevel) < 0.5 &&
      this.lastLevel !== curLevel
    ) {
      this.lastLevel = curLevel;
      return {
        type: 'close',
        strength: 0.6,
        price,
        reason: '网格中轴回归止盈',
        indicators,
        timestamp: c.time,
      };
    }

    if (this.lastLevel === -1) {
      this.lastLevel = curLevel;
      return null;
    }

    if (curLevel < this.lastLevel) {
      this.lastLevel = curLevel;
      return {
        type: 'buy',
        strength: Math.min(1, (this.lastLevel - curLevel) / this.levels * 2),
        price,
        reason: `网格下跌一格(level=${curLevel})`,
        indicators,
        timestamp: c.time,
      };
    }
    if (curLevel > this.lastLevel) {
      this.lastLevel = curLevel;
      return {
        type: 'sell',
        strength: Math.min(1, (curLevel - this.lastLevel) / this.levels * 2),
        price,
        reason: `网格上涨一格(level=${curLevel})`,
        indicators,
        timestamp: c.time,
      };
    }
    return null;
  }
}
