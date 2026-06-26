/**
 * 共享 K 线生成（几何布朗运动）
 *
 *  - H5 行情图表
 *  - Admin 回测 / 模拟
 *  - AI 投顾示例
 *
 * 共用同一份确定性伪随机，相同 (seedPrice, count, step, vol) 必然生成相同 K 线。
 */

// =============================================================================
// Types
// =============================================================================

export interface Candle {
  /** 开盘时间（ms） */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type PeriodKey = '1m' | '5m' | '15m' | '1H' | '4H' | '1D';

export interface Period {
  key: PeriodKey;
  label: string;
  /** 蜡烛根数 */
  count: number;
  /** 单根蜡烛时间长度（ms） */
  step: number;
  /** 默认波动率 */
  vol: number;
}

// =============================================================================
// 周期配置（H5 + admin 共享）
// =============================================================================

export const PERIODS: readonly Period[] = [
  { key: '1m',  label: '1分', count: 90, step:       60_000, vol: 0.0025 },
  { key: '5m',  label: '5分', count: 90, step:      300_000, vol: 0.005  },
  { key: '15m', label: '15分', count: 80, step:     900_000, vol: 0.008  },
  { key: '1H',  label: '1时', count: 80, step:   3_600_000, vol: 0.018  },
  { key: '4H',  label: '4时', count: 60, step:  14_400_000, vol: 0.030  },
  { key: '1D',  label: '1日', count: 60, step:  86_400_000, vol: 0.055  },
] as const;

export const PERIOD_MAP: Record<PeriodKey, Period> = PERIODS.reduce(
  (acc, p) => {
    acc[p.key] = p;
    return acc;
  },
  {} as Record<PeriodKey, Period>,
);

// =============================================================================
// 核心：K 线生成
// =============================================================================

/**
 * 几何布朗运动 K 线生成
 *  - 基于当前价 + 波动率生成 N 根 K 线
 *  - high >= max(open, close)，low <= min(open, close)
 *  - 成交量与价格波动正相关
 *  - 确定性：同输入必出同输出（无 Math.random）
 */
export function genCandles(
  seedPrice: number,
  count: number,
  step: number,
  vol: number,
  opts: { endTime?: number; symbolSeed?: string } = {},
): Candle[] {
  const candles: Candle[] = [];
  let last = seedPrice;
  // 用 symbol 字符串 charCode 拼接出稳定 seed
  const sym = opts.symbolSeed ?? '';
  const seed = (sym ? sym.charCodeAt(0) : 7) * 31 + (sym ? sym.charCodeAt(sym.length - 1) : 0);
  const end = opts.endTime ?? Date.now();

  for (let i = 0; i < count; i++) {
    // 三组伪随机（确定）
    const r1 = Math.sin(i * 0.7 + seed) * 0.5 + Math.cos(i * 0.31 + seed * 1.7) * 0.5;
    const r2 = Math.sin(i * 0.45 + seed * 2.1) * 0.5 + Math.cos(i * 0.19 + seed * 0.6) * 0.5;
    const r3 = Math.sin(i * 0.83 + seed * 1.3) * 0.5 + Math.cos(i * 0.27 + seed * 2.4) * 0.5;

    const drift = r1 * vol;
    const range = (Math.abs(r2) * 0.6 + 0.2) * vol;
    const open = last;
    const close = open * (1 + drift);
    const high = Math.max(open, close) * (1 + Math.abs(r3) * range);
    const low = Math.min(open, close) * (1 - Math.abs(r3) * range);
    const volume = 1000 + Math.abs(r1) * 8000 * (1 + Math.abs(drift) * 5);

    const time = end - (count - i) * step;
    candles.push({ time, open, high, low, close, volume });
    last = close;
  }
  return candles;
}

// =============================================================================
// 移动平均
// =============================================================================

/** 简单移动平均（返回与 candles 等长的数组，前 period-1 个为 null） */
export function sma(candles: Candle[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    let s = 0;
    for (let j = 0; j < period; j++) s += candles[i - j].close;
    out.push(s / period);
  }
  return out;
}

/** MA 别名 */
export const ma = sma;

/** 指数移动平均 */
export function ema(candles: Candle[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    if (prev == null) {
      let s = 0;
      for (let j = 0; j < period; j++) s += candles[i - j].close;
      prev = s / period;
    } else {
      prev = candles[i].close * k + prev * (1 - k);
    }
    out.push(prev);
  }
  return out;
}

// =============================================================================
// 周期切换的便捷封装
// =============================================================================

/** 按周期生成 K 线（H5/admin 共用） */
export function genCandlesByPeriod(
  seedPrice: number,
  period: PeriodKey,
  opts: { symbolSeed?: string; endTime?: number; countOverride?: number } = {},
): Candle[] {
  const p = PERIOD_MAP[period];
  return genCandles(
    seedPrice,
    opts.countOverride ?? p.count,
    p.step,
    p.vol,
    { endTime: opts.endTime, symbolSeed: opts.symbolSeed },
  );
}
