/**
 * IndicatorManager
 *
 *  - 维护当前激活的指标配置（id + period + params + color + visible）
 *  - 提供 add / remove / setVisible / getIndicators
 *  - 提供 getSeriesData：把配置 + K 线转成 TradingView 友好的 SeriesData
 *  - 提供 getPaneConfig：主图/副图配置（高度 + scaleMargins）
 *  - 提供 getDefaultConfig：默认开启 MA(7/25/99) + BOLL
 *
 *  设计原则：状态只持有配置，不持有任何计算结果
 */

import type { Kline } from '@/lib/market';
import type {
  IndicatorConfig,
  IndicatorId,
  IndicatorPane,
  IndicatorPeriod,
  PaneConfig,
  SeriesData,
} from './types';
import {
  MAIN_PANE_INDICATORS,
  SUB_PANE_INDICATORS,
  indicatorKey,
} from './types';
import { adaptToSeries } from './lightweight-adapter';

// =============================================================================
// 默认颜色 / 默认配置
// =============================================================================

/** 指标默认颜色（与 TradingView 风格一致） */
const DEFAULT_COLORS: Record<IndicatorId, string> = {
  MA:   '#fbbf24',   // 琥珀
  EMA:  '#60a5fa',   // 蓝
  MACD: '#f472b6',   // 粉
  RSI:  '#a78bfa',   // 紫
  BOLL: '#34d399',   // 绿
  KDJ:  '#fb923c',   // 橙
};

/** 默认开启的指标：MA(7) + MA(25) + MA(99) + BOLL(20, 2) */
export function getDefaultConfig(period: IndicatorPeriod = '1h'): IndicatorConfig[] {
  return [
    { id: 'MA',   period, params: { period: 7 },   color: DEFAULT_COLORS.MA,   visible: true },
    { id: 'MA',   period, params: { period: 25 },  color: '#60a5fa',           visible: true },
    { id: 'MA',   period, params: { period: 99 },  color: '#f472b6',           visible: true },
    { id: 'BOLL', period, params: { period: 20, stdDev: 2 }, color: DEFAULT_COLORS.BOLL, visible: true },
  ];
}

// =============================================================================
// IndicatorManager
// =============================================================================

export class IndicatorManager {
  private configs: IndicatorConfig[] = [];

  /** 用默认配置初始化 */
  static withDefaults(period: IndicatorPeriod = '1h'): IndicatorManager {
    const m = new IndicatorManager();
    m.configs = getDefaultConfig(period);
    return m;
  }

  // -------------------------------------------------------------------------
  // CRUD
  // -------------------------------------------------------------------------

  /**
   * 添加指标（id + period + params 完全相同则覆盖颜色/可见性）
   */
  addIndicator(config: IndicatorConfig): void {
    const key = indicatorKey(config);
    const idx = this.configs.findIndex((c) => indicatorKey(c) === key);
    if (idx >= 0) {
      this.configs[idx] = { ...config };
    } else {
      this.configs.push({ ...config });
    }
  }

  /**
   * 移除指标（同 id + period + params 的全部）
   */
  removeIndicator(id: IndicatorId, period: IndicatorPeriod, params?: Record<string, number>): void {
    const target = params ?? {};
    this.configs = this.configs.filter(
      (c) => !(c.id === id && c.period === period && paramsEqual(c.params, target)),
    );
  }

  /**
   * 切换可见性
   */
  setVisible(id: IndicatorId, period: IndicatorPeriod, visible: boolean, params?: Record<string, number>): void {
    const target = params ?? {};
    for (const c of this.configs) {
      if (c.id === id && c.period === period && paramsEqual(c.params, target)) {
        c.visible = visible;
      }
    }
  }

  /**
   * 设置颜色
   */
  setColor(id: IndicatorId, period: IndicatorPeriod, color: string, params?: Record<string, number>): void {
    const target = params ?? {};
    for (const c of this.configs) {
      if (c.id === id && c.period === period && paramsEqual(c.params, target)) {
        c.color = color;
      }
    }
  }

  /** 获取所有配置 */
  getIndicators(): IndicatorConfig[] {
    return this.configs.map((c) => ({ ...c }));
  }

  /** 清空所有 */
  clear(): void {
    this.configs = [];
  }

  // -------------------------------------------------------------------------
  // 计算
  // -------------------------------------------------------------------------

  /**
   * 渲染数据：返回所有可见指标的 SeriesData
   * - 主图指标：返回 MainSeries 或 SubSeries（BOLL 是三线容器）
   * - 副图指标：返回 SubSeries
   */
  getSeriesData(klines: Kline[]): SeriesData[] {
    const out: SeriesData[] = [];
    for (const c of this.configs) {
      if (!c.visible) continue;
      out.push(adaptToSeries(c, klines));
    }
    return out;
  }

  /**
   * 单个指标的 SeriesData（即便不可见也返回）
   */
  getSeries(id: IndicatorId, period: IndicatorPeriod, klines: Kline[], params?: Record<string, number>): SeriesData | null {
    const cfg = this.configs.find(
      (c) => c.id === id && c.period === period && paramsEqual(c.params, params ?? {}),
    );
    if (!cfg) return null;
    return adaptToSeries(cfg, klines);
  }

  // -------------------------------------------------------------------------
  // Pane 配置
  // -------------------------------------------------------------------------

  /**
   * 主图 vs 副图
   */
  getPaneConfig(id: IndicatorId): PaneConfig {
    if (MAIN_PANE_INDICATORS.has(id)) {
      return { pane: 'main', height: 0, scaleMargins: { top: 0.1, bottom: 0.1 } };
    }
    // 副图默认高度
    const heights: Partial<Record<IndicatorId, number>> = {
      MACD: 120,
      RSI: 100,
      KDJ: 120,
    };
    return {
      pane: 'sub',
      height: heights[id] ?? 100,
      scaleMargins: { top: 0.1, bottom: 0.1 },
    };
  }

  /**
   * 获取所有副图配置（按 id 去重）
   */
  getSubPaneConfigs(): Array<{ id: IndicatorId; config: PaneConfig }> {
    const seen = new Set<IndicatorId>();
    const out: Array<{ id: IndicatorId; config: PaneConfig }> = [];
    for (const c of this.configs) {
      if (!c.visible) continue;
      if (MAIN_PANE_INDICATORS.has(c.id)) continue;
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push({ id: c.id, config: this.getPaneConfig(c.id) });
    }
    return out;
  }

  /**
   * 工具：判断一个指标应该渲染到主图还是副图
   */
  static paneOf(id: IndicatorId): IndicatorPane {
    return MAIN_PANE_INDICATORS.has(id) ? 'main' : 'sub';
  }
}

// =============================================================================
// 内部工具
// =============================================================================

function paramsEqual(a: Record<string, number>, b: Record<string, number>): boolean {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}
