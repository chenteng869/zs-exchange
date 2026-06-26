/**
 * SentimentAggregator - 多源情绪聚合器（P3-3）
 *
 * 职责：
 *  1. aggregate(perSourceScores, weights?) → 归一化加权综合分
 *  2. calculateFearGreedIndex(components) → 0-100 的 FGI
 *  3. detectAnomalies(items, history)    → AnomalyAlert[]
 *  4. buildSourceSentiment(items, source) → SourceSentiment
 *
 * 加权模型：
 *   overall = Σ (sourceScore × sourceWeight) / Σ sourceWeight
 *   只对有样本的源参与（防止空源把平均拉偏）
 */

import type {
  AnomalyAlert,
  AnomalySeverity,
  SentimentLabel,
  SentimentScore,
  SentimentSource,
  SourceSentiment,
  TextItem,
  TrendSignal,
} from './types';
import {
  ANOMALY_KEYWORD_BURST_THRESHOLD,
  ANOMALY_SENTIMENT_SHIFT,
  ANOMALY_VOLUME_SPIKE_THRESHOLD,
  FEAR_GREED_COMPONENTS,
  SENTIMENT_LABELS_THRESHOLDS,
  SENTIMENT_SOURCE_WEIGHTS,
} from './types';
import { scoreToLabel } from './nlp-engine';

// =============================================================================
// 工具
// =============================================================================

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

function nowMs(): number {
  return Date.now();
}

function emptyDistribution(): Record<SentimentLabel, number> {
  return {
    very_bearish: 0,
    bearish: 0,
    neutral: 0,
    bullish: 0,
    very_bullish: 0,
  };
}

function labelFromScore(s: number): SentimentLabel {
  return scoreToLabel(s);
}

// =============================================================================
// 恐慌贪婪指数的组件
// =============================================================================

export interface FearGreedComponents {
  /** 0-100；高 = 高波动（恐惧） */
  volatility: number;
  /** 0-100；高 = 强势动量（贪婪） */
  momentum: number;
  /** 0-100；高 = 社交媒体偏多（贪婪） */
  socialMedia: number;
  /** 0-100；高 = 调研 / 调查偏多（贪婪） */
  surveys: number;
  /** 0-100；BTC 主导率反向（高 = 资金在 alt 扩散，贪婪） */
  dominance: number;
  /** 0-100；高 = 搜索趋势上升（贪婪） */
  trends: number;
}

// =============================================================================
// SentimentAggregator
// =============================================================================

export interface AggregatorOptions {
  /** 自定义权重（覆盖默认） */
  weights?: Partial<Record<SentimentSource, number>>;
  /** 自定义 FGI 权重（覆盖默认） */
  fearGreedWeights?: Partial<typeof FEAR_GREED_COMPONENTS>;
}

export class SentimentAggregator {
  private readonly weights: Record<SentimentSource, number>;
  private readonly fgiWeights: typeof FEAR_GREED_COMPONENTS;

  constructor(opts: AggregatorOptions = {}) {
    this.weights = { ...SENTIMENT_SOURCE_WEIGHTS, ...(opts.weights || {}) };
    this.fgiWeights = { ...FEAR_GREED_COMPONENTS, ...(opts.fearGreedWeights || {}) } as typeof FEAR_GREED_COMPONENTS;
  }

  // -------------------------------------------------------------------------
  // 1. 加权聚合
  // -------------------------------------------------------------------------

  /**
   * 加权聚合多源情绪分
   * @param perSource 各源 {source, score, confidence?, sampleSize?}
   * @returns 综合分 [-1, 1]
   */
  aggregate(
    perSource: Array<{
      source: SentimentSource;
      score: number;
      confidence?: number;
      sampleSize?: number;
    }>,
  ): number {
    if (perSource.length === 0) return 0;
    let total = 0;
    let weightSum = 0;
    for (const item of perSource) {
      if ((item.sampleSize ?? 0) <= 0) continue;
      const w = this.weights[item.source] ?? 0;
      const conf = clamp(item.confidence ?? 0.5, 0, 1);
      const effW = w * conf;
      total += item.score * effW;
      weightSum += effW;
    }
    if (weightSum === 0) return 0;
    return clamp(total / weightSum, -1, 1);
  }

  // -------------------------------------------------------------------------
  // 2. 恐慌贪婪指数
  // -------------------------------------------------------------------------

  /**
   * 计算恐慌贪婪指数（0-100）
   * @param c 6 个 0-100 分量
   * @returns 0-100；>=75 贪婪 / 25-75 中性 / <25 恐惧
   */
  calculateFearGreedIndex(c: FearGreedComponents): number {
    // 波动率是反向的（高波动=恐惧=低 FGI）
    const volatilityScore = clamp(100 - c.volatility, 0, 100);
    const total =
      volatilityScore * this.fgiWeights.volatility +
      c.momentum * this.fgiWeights.momentum +
      c.socialMedia * this.fgiWeights.socialMedia +
      c.surveys * this.fgiWeights.surveys +
      c.dominance * this.fgiWeights.dominance +
      c.trends * this.fgiWeights.trends;
    return Math.round(clamp(total, 0, 100));
  }

  /** FGI → 文本标签 */
  fearGreedLabel(index: number): string {
    if (index <= 24) return 'Extreme Fear';
    if (index <= 44) return 'Fear';
    if (index <= 55) return 'Neutral';
    if (index <= 75) return 'Greed';
    return 'Extreme Greed';
  }

  // -------------------------------------------------------------------------
  // 3. 单源汇总
  // -------------------------------------------------------------------------

  /**
   * 把一组 SentimentScore 汇总为 SourceSentiment
   */
  buildSourceSentiment(source: SentimentSource, scores: SentimentScore[]): SourceSentiment {
    if (scores.length === 0) {
      return {
        source,
        sampleSize: 0,
        averageScore: 0,
        averageConfidence: 0,
        distribution: emptyDistribution(),
        trend: 'stable',
        updatedAt: nowMs(),
      };
    }
    const dist = emptyDistribution();
    let total = 0;
    let confSum = 0;
    for (const s of scores) {
      total += s.score * s.confidence;
      confSum += s.confidence;
      const label = s.label;
      dist[label] = (dist[label] || 0) + 1;
    }
    const avgScore = confSum > 0 ? total / confSum : 0;
    const avgConf = confSum / scores.length;

    return {
      source,
      sampleSize: scores.length,
      averageScore: clamp(avgScore, -1, 1),
      averageConfidence: clamp(avgConf, 0, 1),
      distribution: dist,
      trend: 'stable', // 简化为 stable；trend 计算由调用方基于历史传入
      updatedAt: nowMs(),
    };
  }

  /** 带趋势判定（与历史对比） */
  buildSourceSentimentWithTrend(
    source: SentimentSource,
    scores: SentimentScore[],
    previousScore?: number,
  ): SourceSentiment {
    const base = this.buildSourceSentiment(source, scores);
    if (previousScore === undefined) {
      base.trend = 'stable';
    } else {
      const diff = base.averageScore - previousScore;
      if (diff > 0.1) base.trend = 'rising';
      else if (diff < -0.1) base.trend = 'falling';
      else base.trend = 'stable';
    }
    return base;
  }

  // -------------------------------------------------------------------------
  // 4. 异常检测
  // -------------------------------------------------------------------------

  /**
   * 异常检测
   *  - volume_spike：单位时间文本量超 3× 历史均量
   *  - sentiment_shift：综合分与上一窗口差 ≥ 0.4
   *  - keyword_burst：特定关键词 24h 出现次数 ≥ 5× 7d 均值
   *  - manipulation：短时间多空极端反转（极简启发式）
   */
  detectAnomalies(
    current: TextItem[],
    history: { items: TextItem[]; overallScore: number; at: number }[],
    options: {
      avgVolume?: number;     // 外部注入历史均量（默认取 history 平均）
      previousScore?: number; // 上一窗口综合分
      keywordWindow?: { keyword: string; last24h: number; avg7d: number }[];
    } = {},
  ): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];
    const now = nowMs();

    // 4.1 量激增
    const avgVolume = options.avgVolume ?? this.averageVolume(history);
    if (avgVolume > 0 && current.length >= avgVolume * ANOMALY_VOLUME_SPIKE_THRESHOLD) {
      alerts.push({
        type: 'volume_spike',
        severity: this.severityByRatio(current.length / avgVolume),
        description: `文本量激增：${current.length} 条 vs 均量 ${avgVolume.toFixed(0)} 条 (${(current.length / Math.max(avgVolume, 1)).toFixed(1)}x)`,
        detectedAt: now,
        data: {
          current: current.length,
          average: avgVolume,
          ratio: current.length / Math.max(avgVolume, 1),
        },
      });
    }

    // 4.2 情感突变
    if (options.previousScore !== undefined) {
      // 需要 current 阶段综合分；通过聚合当前 items 的简单均值得出（仅供检测）
      const curAvg = this.quickAverageScore(current);
      const diff = Math.abs(curAvg - options.previousScore);
      if (diff >= ANOMALY_SENTIMENT_SHIFT) {
        alerts.push({
          type: 'sentiment_shift',
          severity: this.severityByShift(diff),
          description: `情感突变：${(diff * 100).toFixed(0)}% 跳变 (${(options.previousScore).toFixed(2)} → ${curAvg.toFixed(2)})`,
          detectedAt: now,
          data: {
            previous: options.previousScore,
            current: curAvg,
            delta: diff,
          },
        });
      }
    }

    // 4.3 关键词爆发
    if (options.keywordWindow) {
      for (const k of options.keywordWindow) {
        if (k.avg7d <= 0) continue;
        const ratio = k.last24h / k.avg7d;
        if (ratio >= ANOMALY_KEYWORD_BURST_THRESHOLD) {
          alerts.push({
            type: 'keyword_burst',
            severity: this.severityByRatio(ratio),
            description: `关键词 "${k.keyword}" 24h 出现 ${k.last24h} 次（7d 均值 ${k.avg7d.toFixed(1)}，${ratio.toFixed(1)}x）`,
            detectedAt: now,
            data: {
              keyword: k.keyword,
              last24h: k.last24h,
              avg7d: k.avg7d,
              ratio,
            },
          });
        }
      }
    }

    // 4.4 操纵嫌疑（极简启发式：当前 items 内同时出现 very_bearish 与 very_bullish 极端样本）
    if (current.length >= 5) {
      const counter = { bull: 0, bear: 0 };
      for (const it of current) {
        const t = it.content.toLowerCase();
        if (/crash|rug|scam|hack|暴跌|崩盘/.test(t)) counter.bear++;
        if (/moon|pump|skyrocket|to the moon|暴涨|腾飞/.test(t)) counter.bull++;
      }
      if (counter.bull >= 3 && counter.bear >= 3) {
        alerts.push({
          type: 'manipulation',
          severity: 'high',
          description: `检测到多空极端言论并存（看多 ${counter.bull} / 看空 ${counter.bear}），疑似操纵或刷量。`,
          detectedAt: now,
          data: counter,
        });
      }
    }

    return alerts;
  }

  // -------------------------------------------------------------------------
  // 5. 综合分 → 趋势信号
  // -------------------------------------------------------------------------

  /**
   * 综合分 + 量能 → 趋势信号
   * @param overallScore -1 ~ 1
   * @param volumeStrength 0-1（量能强度）
   * @param volatility 0-1（波动率强度；高=不稳定=降级置信）
   */
  toTrendSignal(
    overallScore: number,
    volumeStrength = 0.5,
    volatility = 0.3,
  ): { action: TrendSignal; strength: number } {
    const s = clamp(overallScore, -1, 1);
    const conf = clamp(1 - volatility * 0.4, 0, 1);
    const strength = clamp(Math.abs(s) * conf * (0.5 + volumeStrength * 0.5), 0, 1);

    let action: TrendSignal = 'hold';
    if (s >= 0.5) action = 'strong_buy';
    else if (s >= 0.1) action = 'buy';
    else if (s <= -0.5) action = 'strong_sell';
    else if (s <= -0.1) action = 'sell';

    return { action, strength };
  }

  // -------------------------------------------------------------------------
  // 6. 辅助
  // -------------------------------------------------------------------------

  /** 单源历史平均量（用于 volume_spike 阈值） */
  averageVolume(history: { items: TextItem[] }[]): number {
    if (history.length === 0) return 0;
    const total = history.reduce((s, h) => s + (h.items?.length || 0), 0);
    return total / history.length;
  }

  /** 简易情感均分（仅供 anomaly 检测使用） */
  quickAverageScore(items: TextItem[]): number {
    if (items.length === 0) return 0;
    // 基于文本关键词的轻量估计（避免重复跑 NlpEngine.analyzeSentiment）
    let pos = 0;
    let neg = 0;
    for (const it of items) {
      const t = it.content.toLowerCase();
      if (/(bull|moon|pump|surge|breakout|上涨|突破|利好|看多|强势)/.test(t)) pos++;
      if (/(bear|crash|dump|breakdown|drop|下跌|跌破|利空|看空|弱势)/.test(t)) neg++;
    }
    if (pos + neg === 0) return 0;
    return (pos - neg) / (pos + neg);
  }

  private severityByRatio(ratio: number): AnomalySeverity {
    if (ratio >= 8) return 'critical';
    if (ratio >= 5) return 'high';
    if (ratio >= 3) return 'medium';
    return 'low';
  }

  private severityByShift(shift: number): AnomalySeverity {
    if (shift >= 0.8) return 'critical';
    if (shift >= 0.6) return 'high';
    if (shift >= 0.4) return 'medium';
    return 'low';
  }

  // -------------------------------------------------------------------------
  // 暴露常量（外部需要时用）
  // -------------------------------------------------------------------------

  getWeights(): Record<SentimentSource, number> {
    return { ...this.weights };
  }

  getFearGreedWeights() {
    return { ...this.fgiWeights };
  }
}

// =============================================================================
// 常用辅助
// =============================================================================

/** 根据分数推导情绪 label（公开 re-export） */
export function labelForScore(score: number): SentimentLabel {
  return labelFromScore(score);
}

/** 列出 5 档阈值（方便 UI 展示） */
export function labelThresholds() {
  return { ...SENTIMENT_LABELS_THRESHOLDS };
}
