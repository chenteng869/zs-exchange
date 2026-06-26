/**
 * TradingView Lightweight Charts 适配层
 *
 * 把 indicators.ts 的 string 精度数据转换成 lightweight-charts 期望的 number 数组
 *
 * 主图（MA/EMA/BOLL）→ LineData[]
 * 副图（MACD/RSI/KDJ）→ LineData[] + HistogramData[]
 */

import type { Kline } from '@/lib/market';
import type { IndicatorConfig, SeriesData, LineData, HistogramData, MainSeries, SubSeries, MultiLineSeries } from './types';
import {
  calculateMA,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateBOLL,
  calculateKDJ,
} from './indicators';

// =============================================================================
// 颜色常量（参考 TradingView 默认配色）
// =============================================================================

/** MACD 柱状图正负颜色 */
export const MACD_HIST_POS_COLOR = '#ef4444'; // 红涨
export const MACD_HIST_NEG_COLOR = '#22c55e'; // 绿跌（中文市场习惯）

/** RSI / KDJ 参考线 */
export const RSI_OVERBOUGHT = 70;
export const RSI_OVERSOLD = 30;
export const KDJ_OVERBOUGHT = 80;
export const KDJ_OVERSOLD = 20;

// =============================================================================
// string → number 转换（仅在边界处做一次）
// =============================================================================

function toLineData(arr: Array<{ time: number; value: string }>): LineData[] {
  const out: LineData[] = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    out[i] = { time: arr[i].time, value: parseFloat(arr[i].value) };
  }
  return out;
}

// =============================================================================
// 主图适配：MA / EMA / BOLL
// =============================================================================

/** MA → MainSeries */
export function adaptMA(config: IndicatorConfig, klines: Kline[]): MainSeries {
  const period = config.params.period;
  const data = calculateMA(klines, period);
  return {
    pane: 'main',
    id: `${config.id}-${period}`,
    title: `MA(${period})`,
    color: config.color,
    data: toLineData(data),
  };
}

/** EMA → MainSeries */
export function adaptEMA(config: IndicatorConfig, klines: Kline[]): MainSeries {
  const period = config.params.period;
  const data = calculateEMA(klines, period);
  return {
    pane: 'main',
    id: `${config.id}-${period}`,
    title: `EMA(${period})`,
    color: config.color,
    data: toLineData(data),
  };
}

/** BOLL → MultiLineSeries（三条线合一，pane=main） */
export function adaptBOLL(config: IndicatorConfig, klines: Kline[]): MultiLineSeries {
  const period = config.params.period ?? 20;
  const stdDev = config.params.stdDev ?? config.params.k ?? 2;
  const data = calculateBOLL(klines, period, stdDev);
  const upperColor = (config.params.upperColor as unknown as string) ?? '#a78bfa';
  const midColor = config.color;
  const lowerColor = (config.params.lowerColor as unknown as string) ?? '#a78bfa';

  return {
    pane: 'main',
    id: `BOLL-${period}-${stdDev}`,
    title: `BOLL(${period}, ${stdDev})`,
    lines: [
      { name: 'UPPER', color: upperColor, data: toLineData(data.map((p) => ({ time: p.time, value: p.upper }))) },
      { name: 'MID',   color: midColor,   data: toLineData(data.map((p) => ({ time: p.time, value: p.mid }))) },
      { name: 'LOWER', color: lowerColor, data: toLineData(data.map((p) => ({ time: p.time, value: p.lower }))) },
    ],
    histograms: [],
  };
}

// =============================================================================
// 副图适配：MACD / RSI / KDJ
// =============================================================================

/** MACD → SubSeries（DIF/DEA 线 + 柱状图） */
export function adaptMACD(config: IndicatorConfig, klines: Kline[]): SubSeries {
  const fast = config.params.fast ?? 12;
  const slow = config.params.slow ?? 26;
  const signal = config.params.signal ?? 9;
  const difColor = config.params.difColor as unknown as string ?? '#fbbf24';
  const deaColor = config.color;
  const posColor = config.params.posColor as unknown as string ?? MACD_HIST_POS_COLOR;
  const negColor = config.params.negColor as unknown as string ?? MACD_HIST_NEG_COLOR;
  const data = calculateMACD(klines, fast, slow, signal);

  const difData: LineData[] = new Array(data.length);
  const deaData: LineData[] = new Array(data.length);
  const histData: HistogramData[] = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const difV = parseFloat(d.dif);
    const deaV = parseFloat(d.dea);
    const macdV = parseFloat(d.macd);
    difData[i] = { time: d.time, value: difV };
    deaData[i] = { time: d.time, value: deaV };
    histData[i] = { time: d.time, value: macdV, color: macdV >= 0 ? posColor : negColor };
  }
  return {
    pane: 'sub',
    id: `MACD-${fast}-${slow}-${signal}`,
    title: `MACD(${fast}, ${slow}, ${signal})`,
    lines: [
      { name: 'DIF', color: difColor, data: difData },
      { name: 'DEA', color: deaColor, data: deaData },
    ],
    histograms: [{ name: 'MACD', data: histData }],
  };
}

/** RSI → SubSeries（带 30/70 参考线） */
export function adaptRSI(config: IndicatorConfig, klines: Kline[]): SubSeries {
  const period = config.params.period ?? 14;
  const overbought = config.params.overbought ?? RSI_OVERBOUGHT;
  const oversold = config.params.oversold ?? RSI_OVERSOLD;
  const data = calculateRSI(klines, period);
  return {
    pane: 'sub',
    id: `RSI-${period}`,
    title: `RSI(${period})`,
    lines: [{ name: 'RSI', color: config.color, data: toLineData(data) }],
    histograms: [],
    referenceLines: [
      { value: overbought, color: '#ef4444', label: 'Overbought' },
      { value: oversold,   color: '#22c55e', label: 'Oversold' },
    ],
  };
}

/** KDJ → SubSeries（K/D/J 三线） */
export function adaptKDJ(config: IndicatorConfig, klines: Kline[]): SubSeries {
  const n = config.params.n ?? 9;
  const m1 = config.params.m1 ?? 3;
  const m2 = config.params.m2 ?? 3;
  const kColor = config.params.kColor as unknown as string ?? '#fbbf24';
  const dColor = config.color;
  const jColor = config.params.jColor as unknown as string ?? '#a78bfa';
  const data = calculateKDJ(klines, n, m1, m2);
  return {
    pane: 'sub',
    id: `KDJ-${n}-${m1}-${m2}`,
    title: `KDJ(${n}, ${m1}, ${m2})`,
    lines: [
      { name: 'K', color: kColor, data: toLineData(data.map((p) => ({ time: p.time, value: p.k }))) },
      { name: 'D', color: dColor, data: toLineData(data.map((p) => ({ time: p.time, value: p.d }))) },
      { name: 'J', color: jColor, data: toLineData(data.map((p) => ({ time: p.time, value: p.j }))) },
    ],
    histograms: [],
    referenceLines: [
      { value: KDJ_OVERBOUGHT, color: '#ef4444', label: 'Overbought' },
      { value: KDJ_OVERSOLD,   color: '#22c55e', label: 'Oversold' },
    ],
  };
}

// =============================================================================
// 统一入口
// =============================================================================

/**
 * 把 IndicatorConfig + K 线数据转换为 TradingView 可直接使用的 Series
 */
export function adaptToSeries(config: IndicatorConfig, klines: Kline[]): SeriesData {
  switch (config.id) {
    case 'MA':   return adaptMA(config, klines);
    case 'EMA':  return adaptEMA(config, klines);
    case 'BOLL': return adaptBOLL(config, klines);
    case 'MACD': return adaptMACD(config, klines);
    case 'RSI':  return adaptRSI(config, klines);
    case 'KDJ':  return adaptKDJ(config, klines);
    default: {
      const exhaustive: never = config.id;
      throw new Error(`[indicators] Unknown indicator id: ${exhaustive as string}`);
    }
  }
}
