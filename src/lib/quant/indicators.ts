/**
 * 量化策略系统 - 技术指标库
 *
 * 7 大经典技术指标（自实现数学函数，零外部依赖）：
 *  1. SMA   简单移动平均
 *  2. EMA   指数移动平均
 *  3. MACD  指数平滑异同移动平均
 *  4. RSI   相对强弱指数
 *  5. BOLL  布林带
 *  6. KDJ   随机指标
 *  7. ATR   平均真实波幅
 *
 * 输入为纯数字数组或 Candle 数组；返回等长数组（不足周期用 NaN 填充）。
 */

// =============================================================================
// 默认常量
// =============================================================================

export const SMA_DEFAULT_PERIOD = 20;
export const EMA_DEFAULT_PERIOD = 21;
export const RSI_DEFAULT_PERIOD = 14;
export const MACD_FAST = 12;
export const MACD_SLOW = 26;
export const MACD_SIGNAL = 9;
export const BOLLINGER_STDDEV = 2;
export const GRID_DEFAULT_LEVELS = 10;
export const PAIR_ZSCORE_THRESHOLD = 2.0;
export const BREAKOUT_LOOKBACK = 20;

// =============================================================================
// 工具函数
// =============================================================================

/** 简单校验 period */
function assertPeriod(period: number, fn: string): void {
  if (!Number.isFinite(period) || period <= 0 || !Number.isInteger(period)) {
    throw new Error(`[indicators] ${fn}: period must be a positive integer, got ${period}`);
  }
}

// =============================================================================
// 1. SMA 简单移动平均
// =============================================================================

/**
 * 简单移动平均
 *   SMA(t) = (p_t + p_{t-1} + ... + p_{t-n+1}) / n
 *
 * 输出数组：前 period-1 个为 NaN，从 index=period-1 开始有值。
 */
export function SMA(prices: number[], period: number = SMA_DEFAULT_PERIOD): number[] {
  assertPeriod(period, 'SMA');
  const out: number[] = new Array(prices.length).fill(NaN);
  if (prices.length < period) return out;

  let sum = 0;
  for (let i = 0; i < prices.length; i++) {
    sum += prices[i];
    if (i >= period) sum -= prices[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

// =============================================================================
// 2. EMA 指数移动平均
// =============================================================================

/**
 * 指数移动平均
 *   alpha = 2 / (period + 1)
 *   EMA_t = alpha * price_t + (1 - alpha) * EMA_{t-1}
 *   初值 = SMA(price[0..period-1])
 */
export function EMA(prices: number[], period: number = EMA_DEFAULT_PERIOD): number[] {
  assertPeriod(period, 'EMA');
  const out: number[] = new Array(prices.length).fill(NaN);
  if (prices.length < period) return out;

  const alpha = 2 / (period + 1);
  let ema = 0;
  for (let i = 0; i < period; i++) ema += prices[i];
  ema /= period;
  out[period - 1] = ema;

  for (let i = period; i < prices.length; i++) {
    ema = alpha * prices[i] + (1 - alpha) * ema;
    out[i] = ema;
  }
  return out;
}

// =============================================================================
// 3. MACD
// =============================================================================

export interface MACDPoint {
  macd: number;
  signal: number;
  histogram: number;
}

/**
 * MACD
 *   DIF    = EMA(close, fast) - EMA(close, slow)
 *   Signal = EMA(DIF, signal)
 *   Hist   = (DIF - Signal) * 2
 */
export function MACD(
  prices: number[],
  fast: number = MACD_FAST,
  slow: number = MACD_SLOW,
  signal: number = MACD_SIGNAL,
): MACDPoint[] {
  assertPeriod(fast, 'MACD.fast');
  assertPeriod(slow, 'MACD.slow');
  assertPeriod(signal, 'MACD.signal');

  const out: MACDPoint[] = new Array(prices.length).fill(null).map(() => ({
    macd: NaN,
    signal: NaN,
    histogram: NaN,
  }));

  if (prices.length < slow) return out;

  const emaFast = EMA(prices, fast);
  const emaSlow = EMA(prices, slow);

  // DIF 序列起点：slow - 1
  const dif: number[] = new Array(prices.length).fill(NaN);
  for (let i = slow - 1; i < prices.length; i++) {
    dif[i] = emaFast[i] - emaSlow[i];
  }

  // Signal = EMA(DIF, signal)  从 slow-1 开始
  const alpha = 2 / (signal + 1);
  let dea = 0;
  for (let i = slow - 1; i < slow - 1 + signal; i++) dea += dif[i];
  dea /= signal;

  for (let i = slow - 1; i < prices.length; i++) {
    if (i > slow - 1) dea = alpha * dif[i] + (1 - alpha) * dea;
    if (i >= slow - 1 + signal - 1) {
      out[i] = {
        macd: dif[i],
        signal: dea,
        histogram: (dif[i] - dea) * 2,
      };
    }
  }
  return out;
}

// =============================================================================
// 4. RSI 相对强弱指数
// =============================================================================

/**
 * RSI（Wilder 平滑）
 *   delta  = close_t - close_{t-1}
 *   gain   = max(delta, 0),  loss = max(-delta, 0)
 *   avgGain = Wilder smooth of gains
 *   avgLoss = Wilder smooth of losses
 *   RS     = avgGain / avgLoss
 *   RSI    = 100 - 100 / (1 + RS)
 */
export function RSI(prices: number[], period: number = RSI_DEFAULT_PERIOD): number[] {
  assertPeriod(period, 'RSI');
  const out: number[] = new Array(prices.length).fill(NaN);
  if (prices.length <= period) return out;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const d = prices[i] - prices[i - 1];
    if (d > 0) gainSum += d;
    else lossSum += -d;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out[period] = computeRsiValue(avgGain, avgLoss);

  for (let i = period + 1; i < prices.length; i++) {
    const d = prices[i] - prices[i - 1];
    const gain = d > 0 ? d : 0;
    const loss = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = computeRsiValue(avgGain, avgLoss);
  }
  return out;
}

function computeRsiValue(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// =============================================================================
// 5. Bollinger Bands 布林带
// =============================================================================

export interface BollingerPoint {
  upper: number;
  middle: number;
  lower: number;
}

/**
 * 布林带
 *   mid   = SMA(close, period)
 *   std   = sqrt( sum((c - mid)^2) / period )
 *   upper = mid + k * std
 *   lower = mid - k * std
 */
export function BollingerBands(
  prices: number[],
  period: number = 20,
  stdDev: number = BOLLINGER_STDDEV,
): BollingerPoint[] {
  assertPeriod(period, 'BollingerBands');
  const out: BollingerPoint[] = new Array(prices.length).fill(null).map(() => ({
    upper: NaN,
    middle: NaN,
    lower: NaN,
  }));
  if (prices.length < period) return out;

  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < prices.length; i++) {
    const c = prices[i];
    sum += c;
    sumSq += c * c;
    if (i >= period) {
      const old = prices[i - period];
      sum -= old;
      sumSq -= old * old;
    }
    if (i >= period - 1) {
      const mid = sum / period;
      const variance = Math.max(0, sumSq / period - mid * mid);
      const std = Math.sqrt(variance);
      out[i] = {
        upper: mid + stdDev * std,
        middle: mid,
        lower: mid - stdDev * std,
      };
    }
  }
  return out;
}

// =============================================================================
// 6. KDJ 随机指标
// =============================================================================

export interface KDJPoint {
  k: number;
  d: number;
  j: number;
}

/**
 * KDJ
 *   RSV = (close - lowest_n) / (highest_n - lowest_n) * 100
 *   K   = (m1-1)/m1 * prevK + 1/m1 * RSV
 *   D   = (m2-1)/m2 * prevD + 1/m2 * K
 *   J   = 3K - 2D
 *   初值 K=D=50
 */
export function KDJ(
  high: number[],
  low: number[],
  close: number[],
  n: number = 9,
  m1: number = 3,
  m2: number = 3,
): KDJPoint[] {
  assertPeriod(n, 'KDJ.n');
  assertPeriod(m1, 'KDJ.m1');
  assertPeriod(m2, 'KDJ.m2');
  const len = Math.min(high.length, low.length, close.length);
  const out: KDJPoint[] = new Array(len).fill(null).map(() => ({
    k: NaN,
    d: NaN,
    j: NaN,
  }));
  if (len < n) return out;

  let prevK = 50;
  let prevD = 50;

  for (let i = n - 1; i < len; i++) {
    let highN = -Infinity;
    let lowN = Infinity;
    for (let j = i - n + 1; j <= i; j++) {
      if (high[j] > highN) highN = high[j];
      if (low[j] < lowN) lowN = low[j];
    }
    let rsv: number;
    if (highN === lowN) rsv = 50;
    else rsv = ((close[i] - lowN) / (highN - lowN)) * 100;
    const k = ((m1 - 1) / m1) * prevK + (1 / m1) * rsv;
    const d = ((m2 - 1) / m2) * prevD + (1 / m2) * k;
    const j = 3 * k - 2 * d;
    out[i] = { k, d, j };
    prevK = k;
    prevD = d;
  }
  return out;
}

// =============================================================================
// 7. ATR 平均真实波幅
// =============================================================================

/**
 * ATR
 *   TR   = max(high-low, |high-prevClose|, |low-prevClose|)
 *   ATR  = Wilder 平滑后的 TR
 */
export function ATR(
  high: number[],
  low: number[],
  close: number[],
  period: number = 14,
): number[] {
  assertPeriod(period, 'ATR');
  const len = Math.min(high.length, low.length, close.length);
  const out: number[] = new Array(len).fill(NaN);
  if (len <= period) return out;

  const tr: number[] = new Array(len).fill(0);
  // 第一根 TR 用 high - low
  tr[0] = high[0] - low[0];
  for (let i = 1; i < len; i++) {
    const hl = high[i] - low[i];
    const hpc = Math.abs(high[i] - close[i - 1]);
    const lpc = Math.abs(low[i] - close[i - 1]);
    tr[i] = Math.max(hl, hpc, lpc);
  }

  // Wilder 平滑初始化：前 period 个 TR 的平均
  let atr = 0;
  for (let i = 0; i < period; i++) atr += tr[i];
  atr /= period;
  out[period - 1] = atr;

  for (let i = period; i < len; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
    out[i] = atr;
  }
  return out;
}
