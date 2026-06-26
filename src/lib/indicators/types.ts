/**
 * 技术指标模块类型定义
 *
 * - IndicatorPoint: 通用单值指标点（MA/EMA/RSI 等）
 * - MACDPoint / BOLLPoint / KDJPoint: 多值指标点
 * - IndicatorConfig: 指标配置（ID + 周期 + 参数 + 颜色 + 可见性）
 * - IndicatorId / IndicatorPeriod: 枚举
 */

import type { Kline } from '@/lib/market';

// =============================================================================
// 基础类型
// =============================================================================

/** 通用单值指标点：每个时间点对应一根 K 线 */
export interface IndicatorPoint {
  time: number;   // K 线 openTime（毫秒时间戳）
  value: string;  // 用 string 保持精度
}

/** MACD 三值点 */
export interface MACDPoint {
  time: number;
  /** 快线（DIF）= EMA(close, fast) - EMA(close, slow) */
  dif: string;
  /** 信号线（DEA）= EMA(DIF, signal) */
  dea: string;
  /** 柱状值 = (DIF - DEA) * 2（中文软件常用 2 倍） */
  macd: string;
}

/** 布林带三值点 */
export interface BOLLPoint {
  time: number;
  /** 上轨 = MA + k * std */
  upper: string;
  /** 中轨 = MA */
  mid: string;
  /** 下轨 = MA - k * std */
  lower: string;
}

/** KDJ 三值点 */
export interface KDJPoint {
  time: number;
  /** K 值（RSV 平滑） */
  k: string;
  /** D 值（K 平滑） */
  d: string;
  /** J 值 = 3K - 2D（可超 0-100 区间） */
  j: string;
}

// =============================================================================
// 枚举
// =============================================================================

/** 指标 ID */
export type IndicatorId = 'MA' | 'EMA' | 'MACD' | 'RSI' | 'BOLL' | 'KDJ';

/** K 线周期 */
export type IndicatorPeriod = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

// =============================================================================
// 配置
// =============================================================================

/**
 * 指标配置
 *
 * 例：
 *   MA(20)  -> { id: 'MA',  params: { period: 20 }, color: '#fbbf24' }
 *   MACD    -> { id: 'MACD', params: { fast: 12, slow: 26, signal: 9 } }
 */
export interface IndicatorConfig {
  id: IndicatorId;
  period: IndicatorPeriod;
  params: Record<string, number>;
  color: string;
  visible: boolean;
}

/** 指标渲染位置 */
export type IndicatorPane = 'main' | 'sub';

// =============================================================================
// TradingView Lightweight Charts 数据格式
// =============================================================================

/** 主图叠加的 LineData（time + value） */
export interface LineData {
  time: number;
  value: number;
}

/** 副图柱状图 HistogramData */
export interface HistogramData {
  time: number;
  value: number;
  color?: string;
}

/** 主图叠加数据：一条线 */
export interface MainSeries {
  pane: 'main';
  id: string;          // 唯一标识（id + period + params hash）
  title: string;       // 显示名（例如 "MA(20)"）
  color: string;
  data: LineData[];
}

/** 主图 / 副图通用多线系列（BOLL 三线可叠加在主图；MACD 多线副图） */
export interface MultiLineSeries {
  pane: 'main' | 'sub';
  id: string;
  title: string;
  lines: Array<{ name: string; color: string; data: LineData[] }>;
  /** 柱状图集合（MACD 柱等），可为空数组 */
  histograms?: Array<{ name: string; data: HistogramData[] }>;
  /** y 轴参考线（RSI 30/70，KDJ 20/80 等） */
  referenceLines?: Array<{ value: number; color: string; label: string }>;
}

/** 副图叠加数据：折线 + 柱状图 */
export interface SubSeries {
  pane: 'sub';
  id: string;
  title: string;
  /** 折线集合（MACD 的 DIF/DEA、KDJ 的 K/D 等） */
  lines: Array<{ name: string; color: string; data: LineData[] }>;
  /** 柱状图集合（MACD 柱等），可为空数组 */
  histograms: Array<{ name: string; data: HistogramData[] }>;
  /** 副图 y 轴参考线（RSI 30/70，KDJ 20/80 等） */
  referenceLines?: Array<{ value: number; color: string; label: string }>;
}

/** 通用 Series 数据：主图或副图 */
export type SeriesData = MainSeries | SubSeries | MultiLineSeries;

/** 副图配置 */
export interface PaneConfig {
  pane: IndicatorPane;
  /** 推荐副图高度（px） */
  height: number;
  /** y 轴 padding（数据范围上下扩展比例 0-1） */
  scaleMargins: { top: 0.1; bottom: 0.1 };
}

// =============================================================================
// 工具类型
// =============================================================================

/** IndicatorConfig 唯一键（去重 / 查询用） */
export function indicatorKey(c: Pick<IndicatorConfig, 'id' | 'period' | 'params'>): string {
  const sortedParams = Object.keys(c.params)
    .sort()
    .map((k) => `${k}=${c.params[k]}`)
    .join('&');
  return `${c.id}@${c.period}#${sortedParams}`;
}

/** 主图指标集合（不可在副图显示） */
export const MAIN_PANE_INDICATORS: ReadonlySet<IndicatorId> = new Set<IndicatorId>(['MA', 'EMA', 'BOLL']);

/** 副图指标集合 */
export const SUB_PANE_INDICATORS: ReadonlySet<IndicatorId> = new Set<IndicatorId>(['MACD', 'RSI', 'KDJ']);

/** Kline 的扩展（仅用作辅助类型） */
export type KlineLike = Kline;
