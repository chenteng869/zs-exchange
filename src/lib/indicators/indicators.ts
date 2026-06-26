/**
 * 技术指标计算器
 *
 * 纯函数 + 零外部依赖 + 输入 Kline[] 输出 string（保持精度）
 *
 * - 不足 period 时返回空数组（不抛错）
 * - 输出顺序与输入一致（按 openTime 升序）
 * - 算法与 TradingView / 东方财富 / 同花顺等主流软件一致
 */

import type { Kline } from '@/lib/market';
import type { IndicatorPoint, MACDPoint, BOLLPoint, KDJPoint } from './types';

// =============================================================================
// 工具函数
// =============================================================================

/** 校验 period（必须为正整数） */
function assertPeriod(period: number, fn: string): void {
  if (!Number.isFinite(period) || period <= 0 || !Number.isInteger(period)) {
    throw new Error(`[indicators] ${fn}: period must be a positive integer, got ${period}`);
  }
}

/** 安全 parseFloat（兼容 string） */
function num(x: string | number): number {
  return typeof x === 'number' ? x : parseFloat(x);
}

/**
 * 数字保留 N 位小数，输出 string（避免浮点误差扩散）
 * - 小数位默认为 8（项目精度约定）
 * - NaN/Infinity 返回 '0'
 */
function fmt(n: number, decimals = 8): string {
  if (!Number.isFinite(n)) return '0';
  // 使用 toFixed 保证字符串稳定性
  return n.toFixed(decimals);
}

// =============================================================================
// 1. MA（简单移动平均线）
// =============================================================================

/**
 * 简单移动平均线
 * 公式：MA(n) = (C1 + C2 + ... + Cn) / n
 *
 * @param klines  K 线数组（按时间升序）
 * @param period  周期（默认 20）
 * @returns       每个 K 线对应一个 MA 值（前 period-1 个为空，从 index=period-1 开始返回）
 */
export function calculateMA(klines: Kline[], period: number = 20): IndicatorPoint[] {
  assertPeriod(period, 'calculateMA');
  const out: IndicatorPoint[] = [];
  if (klines.length < period) return out;

  let sum = 0;
  // 维护一个滑动窗口
  for (let i = 0; i < klines.length; i++) {
    sum += num(klines[i].close);
    if (i >= period) sum -= num(klines[i - period].close);
    if (i >= period - 1) {
      out.push({ time: klines[i].openTime, value: fmt(sum / period) });
    }
  }
  return out;
}

// =============================================================================
// 2. EMA（指数移动平均线）
// =============================================================================

/**
 * 指数移动平均线
 * 公式：alpha = 2 / (period + 1)
 *      EMA_t = alpha * close_t + (1 - alpha) * EMA_{t-1}
 * 初始值：SMA(close[0..period-1])
 *
 * @param klines  K 线数组
 * @param period  周期（默认 12）
 */
export function calculateEMA(klines: Kline[], period: number = 12): IndicatorPoint[] {
  assertPeriod(period, 'calculateEMA');
  const out: IndicatorPoint[] = [];
  if (klines.length < period) return out;

  const alpha = 2 / (period + 1);
  // 初始值：前 period 根 close 的 SMA
  let ema = 0;
  for (let i = 0; i < period; i++) ema += num(klines[i].close);
  ema /= period;
  out.push({ time: klines[period - 1].openTime, value: fmt(ema) });

  for (let i = period; i < klines.length; i++) {
    ema = alpha * num(klines[i].close) + (1 - alpha) * ema;
    out.push({ time: klines[i].openTime, value: fmt(ema) });
  }
  return out;
}

// =============================================================================
// 3. MACD（指数平滑异同移动平均线）
// =============================================================================

/**
 * MACD
 *  - DIF = EMA(close, fast) - EMA(close, slow)
 *  - DEA = EMA(DIF, signal)
 *  - MACD = (DIF - DEA) * 2  （中文软件 2 倍；TradingView 使用 1 倍，可通过 multiplier 控制）
 *
 * @param klines  K 线数组
 * @param fast    快线 EMA 周期（默认 12）
 * @param slow    慢线 EMA 周期（默认 26）
 * @param signal  信号线 EMA 周期（默认 9）
 */
export function calculateMACD(
  klines: Kline[],
  fast: number = 12,
  slow: number = 26,
  signal: number = 9,
  multiplier: number = 2,
): MACDPoint[] {
  assertPeriod(fast, 'calculateMACD.fast');
  assertPeriod(slow, 'calculateMACD.slow');
  assertPeriod(signal, 'calculateMACD.signal');
  const out: MACDPoint[] = [];
  if (klines.length < slow) return out;

  // 1. 计算两条 EMA 序列（带 index 对齐）
  const emaFast = buildEmaSeries(klines, fast);
  const emaSlow = buildEmaSeries(klines, slow);

  // emaFast[i] 对应 klines[slow-1+i]（前 slow-1 个无效）
  // 起点：slow - 1
  const difList: Array<{ time: number; dif: number }> = [];
  for (let i = 0; i < emaSlow.length; i++) {
    const k = klines[slow - 1 + i];
    const d = emaFast[i + (slow - fast)] - emaSlow[i];
    difList.push({ time: k.openTime, dif: d });
  }

  // 2. DEA = EMA(DIF, signal)
  if (difList.length < signal) return out;
  const alpha = 2 / (signal + 1);
  let dea = 0;
  for (let i = 0; i < signal; i++) dea += difList[i].dif;
  dea /= signal;

  for (let i = 0; i < difList.length; i++) {
    if (i >= signal - 1) {
      if (i > signal - 1) {
        dea = alpha * difList[i].dif + (1 - alpha) * dea;
      }
      const macd = (difList[i].dif - dea) * multiplier;
      out.push({
        time: difList[i].time,
        dif: fmt(difList[i].dif),
        dea: fmt(dea),
        macd: fmt(macd),
      });
    }
  }
  return out;
}

/** 内部辅助：构造 EMA 序列（不丢点；前 period-1 个为 0） */
function buildEmaSeries(klines: Kline[], period: number): number[] {
  const series: number[] = [];
  if (klines.length < period) return series;
  const alpha = 2 / (period + 1);
  let ema = 0;
  for (let i = 0; i < period; i++) ema += num(klines[i].close);
  ema /= period;
  series.push(ema); // 对应 klines[period-1]
  for (let i = period; i < klines.length; i++) {
    ema = alpha * num(klines[i].close) + (1 - alpha) * ema;
    series.push(ema);
  }
  return series;
}

// =============================================================================
// 4. RSI（相对强弱指数）
// =============================================================================

/**
 * RSI
 *  - 涨跌幅 delta = close_t - close_{t-1}
 *  - avgGain = period 内正 delta 的平均
 *  - avgLoss = period 内负 delta 的平均（取绝对值）
 *  - RS = avgGain / avgLoss
 *  - RSI = 100 - 100 / (1 + RS)
 *
 *  使用 Wilder 平滑方法（与 TradingView 一致）：
 *  - 第一个 RSI 用简单平均
 *  - 后续：avgGain = (prevAvgGain * (period-1) + gain) / period
 *         avgLoss = (prevAvgLoss * (period-1) + loss) / period
 *
 * @param klines  K 线数组
 * @param period  周期（默认 14）
 */
export function calculateRSI(klines: Kline[], period: number = 14): IndicatorPoint[] {
  assertPeriod(period, 'calculateRSI');
  const out: IndicatorPoint[] = [];
  if (klines.length <= period) return out;

  // 第一段：用 SMA 计算
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const d = num(klines[i].close) - num(klines[i - 1].close);
    if (d > 0) gainSum += d;
    else lossSum += -d;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out.push({
    time: klines[period].openTime,
    value: fmt(computeRsiValue(avgGain, avgLoss), 4),
  });

  // 后续：Wilder 平滑
  for (let i = period + 1; i < klines.length; i++) {
    const d = num(klines[i].close) - num(klines[i - 1].close);
    const gain = d > 0 ? d : 0;
    const loss = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out.push({
      time: klines[i].openTime,
      value: fmt(computeRsiValue(avgGain, avgLoss), 4),
    });
  }
  return out;
}

function computeRsiValue(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// =============================================================================
// 5. BOLL（布林带）
// =============================================================================

/**
 * 布林带
 *  - mid  = MA(close, period)
 *  - std  = sqrt( sum((close_i - mid)^2) / period )  // 总体标准差（n）
 *  - upper = mid + k * std
 *  - lower = mid - k * std
 *
 * @param klines  K 线数组
 * @param period  中轨周期（默认 20）
 * @param stdDev  标准差倍数（默认 2）
 */
export function calculateBOLL(
  klines: Kline[],
  period: number = 20,
  stdDev: number = 2,
): BOLLPoint[] {
  assertPeriod(period, 'calculateBOLL');
  const out: BOLLPoint[] = [];
  if (klines.length < period) return out;

  // 滑动窗口求 MA + std
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < klines.length; i++) {
    const c = num(klines[i].close);
    sum += c;
    sumSq += c * c;
    if (i >= period) {
      const old = num(klines[i - period].close);
      sum -= old;
      sumSq -= old * old;
    }
    if (i >= period - 1) {
      const mid = sum / period;
      // 方差 = E[x^2] - (E[x])^2
      const variance = sumSq / period - mid * mid;
      const std = Math.sqrt(Math.max(0, variance));
      out.push({
        time: klines[i].openTime,
        upper: fmt(mid + stdDev * std),
        mid: fmt(mid),
        lower: fmt(mid - stdDev * std),
      });
    }
  }
  return out;
}

// =============================================================================
// 6. KDJ（随机指标）
// =============================================================================

/**
 * KDJ（随机指标）
 *  RSV = (close - low_n) / (high_n - low_n) * 100
 *  K = (m1-1)/m1 * prevK + 1/m1 * RSV
 *  D = (m2-1)/m2 * prevD + 1/m2 * K
 *  J = 3K - 2D
 *
 * 初始：K = 50, D = 50
 *
 * @param klines  K 线数组
 * @param n       RSV 回溯周期（默认 9）
 * @param m1      K 平滑参数（默认 3）
 * @param m2      D 平滑参数（默认 3）
 */
export function calculateKDJ(
  klines: Kline[],
  n: number = 9,
  m1: number = 3,
  m2: number = 3,
): KDJPoint[] {
  assertPeriod(n, 'calculateKDJ.n');
  assertPeriod(m1, 'calculateKDJ.m1');
  assertPeriod(m2, 'calculateKDJ.m2');
  const out: KDJPoint[] = [];
  if (klines.length < n) return out;

  let prevK = 50;
  let prevD = 50;

  for (let i = n - 1; i < klines.length; i++) {
    // 找到 n 周期内的最高/最低
    let highN = -Infinity;
    let lowN = Infinity;
    for (let j = i - n + 1; j <= i; j++) {
      const h = num(klines[j].high);
      const l = num(klines[j].low);
      if (h > highN) highN = h;
      if (l < lowN) lowN = l;
    }
    const close = num(klines[i].close);
    let rsv: number;
    if (highN === lowN) {
      // 9 周期内高低相同（横盘），RSV 设为 50
      rsv = 50;
    } else {
      rsv = ((close - lowN) / (highN - lowN)) * 100;
    }
    const k = ((m1 - 1) / m1) * prevK + (1 / m1) * rsv;
    const d = ((m2 - 1) / m2) * prevD + (1 / m2) * k;
    const j = 3 * k - 2 * d;
    out.push({
      time: klines[i].openTime,
      k: fmt(k, 4),
      d: fmt(d, 4),
      j: fmt(j, 4),
    });
    prevK = k;
    prevD = d;
  }
  return out;
}
