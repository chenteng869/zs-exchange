/**
 * 配对交易策略（Pair Trading / Statistical Arbitrage）
 *
 * 经典均值回归策略：
 *  1. 对两个相关品种（如 BTC / ETH）计算价差 spread = log(A) - beta * log(B)
 *  2. 计算 z-score = (spread - mean) / std
 *  3. z > +threshold → spread 偏高 → 做空 A / 做多 B
 *  4. z < -threshold → spread 偏低 → 做多 A / 做空 B
 *  5. z 回归到 0 → 平仓
 *
 * 实现：使用单一价差序列 candlesB（A 的价格通过 A 自身的 close 推算），
 * 简化版以 A 自身为基准，B 仅参与统计。
 *
 * 调用方需传入 K 线 A 和 B 同步序列，引擎会按 index 对齐。
 */

import type { Candle, Signal, Strategy } from '../types';
import { PAIR_ZSCORE_THRESHOLD } from '../indicators';

export interface PairTradingConfig {
  /** z-score 阈值，默认 2.0 */
  threshold?: number;
  /** 滚动窗口（根数） */
  window?: number;
}

export class PairTradingStrategy implements Strategy {
  public readonly id = 'pair-trading';
  public readonly name = '配对交易策略';

  private readonly threshold: number;
  private readonly window: number;
  /** 当前仓位方向：'long' / 'short' / 'flat' */
  private position: 'long' | 'short' | 'flat' = 'flat';

  constructor(config: PairTradingConfig = {}) {
    this.threshold = config.threshold ?? PAIR_ZSCORE_THRESHOLD;
    this.window = config.window ?? 30;
  }

  /**
   * 计算价差序列（A - beta * B），其中 beta 用 OLS 估算
   */
  private computeSpread(closesA: number[], closesB: number[]): number[] {
    const len = Math.min(closesA.length, closesB.length);
    if (len < 2) return [];
    // beta = Cov(A, B) / Var(B)
    const meanA = closesA.reduce((s, v) => s + v, 0) / len;
    const meanB = closesB.reduce((s, v) => s + v, 0) / len;
    let cov = 0;
    let varB = 0;
    for (let i = 0; i < len; i++) {
      cov += (closesA[i] - meanA) * (closesB[i] - meanB);
      varB += (closesB[i] - meanB) ** 2;
    }
    const beta = varB === 0 ? 1 : cov / varB;
    const spread: number[] = new Array(len);
    for (let i = 0; i < len; i++) {
      spread[i] = closesA[i] - beta * closesB[i];
    }
    return spread;
  }

  /**
   * @param candlesA   品种 A 的 K 线
   * @param candlesB   品种 B 的 K 线
   * @param index      当前索引（A 与 B 必须同步等长）
   */
  evaluatePair(
    candlesA: Candle[],
    candlesB: Candle[],
    index: number,
  ): Signal | null {
    if (index < this.window) return null;
    const closesA = candlesA.slice(0, index + 1).map((c) => c.close);
    const closesB = candlesB.slice(0, index + 1).map((c) => c.close);
    const spread = this.computeSpread(closesA, closesB);
    const win = spread.slice(-this.window);
    const mean = win.reduce((s, v) => s + v, 0) / this.window;
    const variance = win.reduce((s, v) => s + (v - mean) ** 2, 0) / this.window;
    const std = Math.sqrt(variance);
    if (std === 0) return null;
    const z = (spread[spread.length - 1] - mean) / std;

    const a = candlesA[index];
    const indicators = { zScore: z, mean, std, threshold: this.threshold };

    if (z > this.threshold && this.position !== 'short') {
      this.position = 'short';
      return {
        type: 'sell',
        strength: Math.min(1, (z - this.threshold) / this.threshold),
        price: a.close,
        reason: `配对 z=${z.toFixed(2)} > +${this.threshold}，做空 spread`,
        indicators,
        timestamp: a.time,
      };
    }
    if (z < -this.threshold && this.position !== 'long') {
      this.position = 'long';
      return {
        type: 'buy',
        strength: Math.min(1, (-z - this.threshold) / this.threshold),
        price: a.close,
        reason: `配对 z=${z.toFixed(2)} < -${this.threshold}，做多 spread`,
        indicators,
        timestamp: a.time,
      };
    }
    if (Math.abs(z) < 0.2 && this.position !== 'flat') {
      this.position = 'flat';
      return {
        type: 'close',
        strength: 0.5,
        price: a.close,
        reason: `配对 z 回归 0，平仓`,
        indicators,
        timestamp: a.time,
      };
    }
    return null;
  }

  /** 单序列 evaluate（仅用于满足 Strategy 接口） */
  evaluate(candles: Candle[], index: number): Signal | null {
    // 配对交易需要两个品种，单独调用退化为单序列 RSI 类信号
    return null;
  }
}
