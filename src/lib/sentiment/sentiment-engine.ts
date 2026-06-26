/**
 * SentimentEngine - 业务层情绪分析引擎（P3-3）
 *
 * 聚合：
 *  - NewsCollector       （CryptoPanic 新闻）
 *  - SocialCollector     （Twitter / Reddit / Telegram）
 *  - MarketCollector     （行情情绪化）
 *  - NlpEngine           （情感分析）
 *  - SentimentAggregator （加权 + 恐慌贪婪 + 异常）
 *  - SentimentPredictor  （预测）
 *
 * 主流程：
 *   analyzeSymbol(symbol):
 *     1. 并发收集（news + social + market）
 *     2. NLP 评分每条
 *     3. 按源汇总
 *     4. 加权聚合 → overall
 *     5. 异常检测
 *     6. 恐慌贪婪指数（基于行情 + 社交）
 *     7. 趋势信号
 *     8. 触发事件
 *
 * 集成：
 *  - src/lib/news/         新闻源
 *  - src/lib/market/       行情源
 *  - src/lib/notification/ 告警推送（可选注入）
 */

import type {
  AnomalyAlert,
  MarketSentiment,
  Prediction,
  PredictionHorizon,
  SentimentScore,
  SentimentSource,
  SourceSentiment,
  TextItem,
  TrendSignal,
} from './types';
import { NlpEngine } from './nlp-engine';
import { NewsCollector } from './collectors/news-collector';
import { SocialCollector } from './collectors/social-collector';
import { MarketCollector } from './collectors/market-collector';
import { SentimentAggregator, type FearGreedComponents } from './aggregator';
import { SentimentPredictor } from './predictor';

// =============================================================================
// 事件
// =============================================================================

export type AnomalyHandler = (alert: AnomalyAlert, symbol: string) => void;
export type SentimentShiftHandler = (current: MarketSentiment, previous: MarketSentiment | null) => void;
export type UpdateHandler = (ms: MarketSentiment) => void;

// =============================================================================
// 配置
// =============================================================================

export interface SentimentEngineOptions {
  nlpEngine?: NlpEngine;
  newsCollector?: NewsCollector;
  socialCollector?: SocialCollector;
  marketCollector?: MarketCollector;
  aggregator?: SentimentAggregator;
  predictor?: SentimentPredictor;
  /** 每源最大条数（默认 50） */
  perSourceLimit?: number;
  /** 是否触发推送（需注入 notifier） */
  enableNotifications?: boolean;
}

// =============================================================================
// 通知适配器（轻量接口，避免硬依赖 notification 模块）
// =============================================================================

export interface SentimentNotifier {
  notifyAnomaly?(alert: AnomalyAlert, symbol: string): Promise<void> | void;
  notifySentimentShift?(current: MarketSentiment, previous: MarketSentiment | null): Promise<void> | void;
}

// =============================================================================
// SentimentEngine
// =============================================================================

export class SentimentEngine {
  private readonly nlp: NlpEngine;
  private readonly news: NewsCollector;
  private readonly social: SocialCollector;
  private readonly market: MarketCollector;
  private readonly aggregator: SentimentAggregator;
  private readonly predictor: SentimentPredictor;
  private readonly perSourceLimit: number;
  private readonly enableNotifications: boolean;

  private notifier?: SentimentNotifier;

  /** 历史快照（symbol -> 时间序列） */
  private readonly history: Map<string, MarketSentiment[]> = new Map();

  /** 订阅者 */
  private readonly anomalyHandlers: Set<AnomalyHandler> = new Set();
  private readonly shiftHandlers: Set<SentimentShiftHandler> = new Set();
  private readonly updateHandlers: Set<UpdateHandler> = new Set();

  constructor(opts: SentimentEngineOptions = {}) {
    this.nlp = opts.nlpEngine || new NlpEngine();
    this.news = opts.newsCollector || new NewsCollector();
    this.social = opts.socialCollector || new SocialCollector();
    this.market = opts.marketCollector || new MarketCollector();
    this.aggregator = opts.aggregator || new SentimentAggregator();
    this.predictor = opts.predictor || new SentimentPredictor();
    this.perSourceLimit = opts.perSourceLimit ?? 50;
    this.enableNotifications = opts.enableNotifications ?? false;
  }

  // -------------------------------------------------------------------------
  // 注入
  // -------------------------------------------------------------------------

  setNotifier(notifier: SentimentNotifier): void {
    this.notifier = notifier;
  }

  getNlp(): NlpEngine {
    return this.nlp;
  }

  getAggregator(): SentimentAggregator {
    return this.aggregator;
  }

  getPredictor(): SentimentPredictor {
    return this.predictor;
  }

  // -------------------------------------------------------------------------
  // 1. 分析入口
  // -------------------------------------------------------------------------

  /**
   * 分析单个币种
   */
  async analyzeSymbol(symbol: string): Promise<MarketSentiment> {
    const upper = symbol.toUpperCase();
    const limit = this.perSourceLimit;

    // 1. 并发收集
    const [newsItems, tw, rd, tg, marketRes] = await Promise.all([
      this.news.collect(upper, limit).catch(() => []),
      this.social.collectFromTwitter(upper, limit).catch(() => []),
      this.social.collectFromReddit(upper, limit).catch(() => []),
      this.social.collectFromTelegram(upper, limit).catch(() => []),
      this.market.collect(upper).catch(() => null),
    ]);

    // 2. 合并
    const allItems: TextItem[] = [
      ...newsItems,
      ...tw,
      ...rd,
      ...tg,
      ...(marketRes ? marketRes.textItems : []),
    ];

    // 3. NLP 评分
    const scores = this.nlp.analyzeBatch(allItems.map((i) => i.content));
    const itemsWithScore: Array<{ item: TextItem; score: SentimentScore }> = allItems.map((item, i) => ({
      item,
      score: scores[i],
    }));

    // 4. 按源汇总
    const bySource: Record<SentimentSource, SourceSentiment> = {
      news: this.aggregator.buildSourceSentiment('news', itemsWithScore.filter((x) => x.item.source === 'news').map((x) => x.score)),
      twitter: this.aggregator.buildSourceSentiment('twitter', itemsWithScore.filter((x) => x.item.source === 'twitter').map((x) => x.score)),
      reddit: this.aggregator.buildSourceSentiment('reddit', itemsWithScore.filter((x) => x.item.source === 'reddit').map((x) => x.score)),
      telegram: this.aggregator.buildSourceSentiment('telegram', itemsWithScore.filter((x) => x.item.source === 'telegram').map((x) => x.score)),
      market: marketRes ? marketRes.sourceSentiment : this.emptySource('market'),
      derivatives: this.emptySource('derivatives'),
      onchain: this.emptySource('onchain'),
    };

    // 5. 加权聚合
    const overallScore = this.aggregator.aggregate(
      (Object.keys(bySource) as SentimentSource[]).map((s) => ({
        source: s,
        score: bySource[s].averageScore,
        confidence: bySource[s].averageConfidence,
        sampleSize: bySource[s].sampleSize,
      })),
    );

    // 6. 恐慌贪婪指数
    const components = this.buildFearGreedComponents(bySource, marketRes);
    const fearGreedIndex = this.aggregator.calculateFearGreedIndex(components);
    const fearGreedLabel = this.aggregator.fearGreedLabel(fearGreedIndex);

    // 7. 趋势信号
    const volumeStrength = clamp(allItems.length / 200, 0, 1);
    const volatility = clamp((marketRes?.snapshot.volatility ?? 0) / 10, 0, 1);
    const { action, strength } = this.aggregator.toTrendSignal(overallScore, volumeStrength, volatility);

    // 8. 异常检测
    const previousSnapshots = this.history.get(upper) || [];
    const previousScore = previousSnapshots.length > 0
      ? previousSnapshots[previousSnapshots.length - 1].overallScore
      : undefined;
    const anomalies = this.aggregator.detectAnomalies(
      allItems,
      previousSnapshots.map((s) => ({ items: [], overallScore: s.overallScore, at: s.updatedAt })),
      {
        previousScore,
        avgVolume: previousSnapshots.length > 0 ? previousSnapshots[previousSnapshots.length - 1].volume24h : 0,
      },
    );

    // 9. 整体情绪
    const overallConfidence = this.aggregator.aggregate(
      (Object.keys(bySource) as SentimentSource[]).map((s) => ({
        source: s,
        score: bySource[s].averageConfidence,
        confidence: 1,
        sampleSize: bySource[s].sampleSize,
      })),
    );
    const label = this.scoreToLabel(overallScore);

    const ms: MarketSentiment = {
      symbol: upper,
      overallScore,
      overallLabel: label,
      overallConfidence: clamp(overallConfidence, 0, 1),
      fearGreedIndex,
      fearGreedLabel,
      bySource,
      volume24h: allItems.length,
      trend: action,
      signal: {
        action,
        strength,
        reasoning: this.buildReasoning(bySource, overallScore, fearGreedIndex, anomalies),
      },
      anomalies,
      updatedAt: Date.now(),
    };

    // 10. 落库 + 触发
    this.saveSnapshot(upper, ms);
    this.emitUpdate(ms);
    this.detectShift(ms);

    return ms;
  }

  /**
   * 分析整个市场（BTC 主导）
   */
  async analyzeMarket(): Promise<MarketSentiment> {
    return this.analyzeSymbol('BTC');
  }

  // -------------------------------------------------------------------------
  // 2. 趋势信号
  // -------------------------------------------------------------------------

  /**
   * 获取某币种的趋势信号（基于最近一次快照）
   */
  getTrendSignal(symbol: string, horizon: PredictionHorizon = '24h'): TrendSignal {
    const upper = symbol.toUpperCase();
    const history = this.history.get(upper) || [];
    const last = history[history.length - 1];
    if (!last) return 'hold';
    const pred = this.predictor.predictFromMarketSentiment(last, horizon);
    return SentimentPredictor.toTrendSignal(last);
  }

  /**
   * 显式生成预测
   */
  predict(symbol: string, horizon: PredictionHorizon = '24h'): Prediction | null {
    const upper = symbol.toUpperCase();
    const last = (this.history.get(upper) || []).slice(-1)[0];
    if (!last) return null;
    return this.predictor.predictFromMarketSentiment(last, horizon);
  }

  // -------------------------------------------------------------------------
  // 3. 历史
  // -------------------------------------------------------------------------

  getHistory(symbol: string, period: '24h' | '7d' | '30d' = '7d'): MarketSentiment[] {
    const upper = symbol.toUpperCase();
    const all = this.history.get(upper) || [];
    if (all.length === 0) return [];
    // period -> 毫秒
    const periodMs: Record<string, number> = {
      '24h': 24 * 3600_000,
      '7d': 7 * 24 * 3600_000,
      '30d': 30 * 24 * 3600_000,
    };
    const cutoff = Date.now() - periodMs[period];
    return all.filter((m) => m.updatedAt >= cutoff);
  }

  /** 当前最新快照（无则 null） */
  getLatest(symbol: string): MarketSentiment | null {
    const upper = symbol.toUpperCase();
    const arr = this.history.get(upper) || [];
    return arr[arr.length - 1] || null;
  }

  // -------------------------------------------------------------------------
  // 4. 订阅
  // -------------------------------------------------------------------------

  /** 订阅异常告警 */
  onAnomaly(handler: AnomalyHandler): () => void {
    this.anomalyHandlers.add(handler);
    return () => this.anomalyHandlers.delete(handler);
  }

  /** 订阅情感突变 */
  onSentimentShift(handler: SentimentShiftHandler): () => void {
    this.shiftHandlers.add(handler);
    return () => this.shiftHandlers.delete(handler);
  }

  /** 订阅每次更新 */
  onUpdate(handler: UpdateHandler): () => void {
    this.updateHandlers.add(handler);
    return () => this.updateHandlers.delete(handler);
  }

  // -------------------------------------------------------------------------
  // 私有
  // -------------------------------------------------------------------------

  private emptySource(source: SentimentSource): SourceSentiment {
    return {
      source,
      sampleSize: 0,
      averageScore: 0,
      averageConfidence: 0,
      distribution: { very_bearish: 0, bearish: 0, neutral: 0, bullish: 0, very_bullish: 0 },
      trend: 'stable',
      updatedAt: Date.now(),
    };
  }

  private buildFearGreedComponents(
    bySource: Record<SentimentSource, SourceSentiment>,
    marketRes: { snapshot: { volatility: number; chgPct24h: number; volumeChangeRatio: number } } | null,
  ): FearGreedComponents {
    // 波动率（market.snapshot.volatility %  →  0-100）
    const volatility = clamp((marketRes?.snapshot.volatility ?? 0) * 10, 0, 100);
    // 动量（24h 涨跌幅 %  →  0-100）
    const chg = marketRes?.snapshot.chgPct24h ?? 0;
    const momentum = clamp(50 + chg * 5, 0, 100);
    // 社交（综合社交 4 源分 → 0-100）
    const socialAvg = (bySource.twitter.averageScore + bySource.reddit.averageScore + bySource.telegram.averageScore) / 3;
    const socialMedia = clamp(50 + socialAvg * 50, 0, 100);
    // 调研（用 news 代替）
    const surveys = clamp(50 + bySource.news.averageScore * 50, 0, 100);
    // 主导率（用 market source 替代，方向相同）
    const dominance = clamp(50 + bySource.market.averageScore * 50, 0, 100);
    // 趋势（用量能比）
    const trends = clamp((marketRes?.snapshot.volumeChangeRatio ?? 1) * 30, 0, 100);
    return { volatility, momentum, socialMedia, surveys, dominance, trends };
  }

  private buildReasoning(
    bySource: Record<SentimentSource, SourceSentiment>,
    overallScore: number,
    fgi: number,
    anomalies: AnomalyAlert[],
  ): string[] {
    const reasons: string[] = [];
    if (bySource.news.sampleSize > 0) {
      reasons.push(`News 源情绪 ${bySource.news.averageScore.toFixed(2)}（${bySource.news.sampleSize} 条）`);
    }
    if (bySource.twitter.sampleSize > 0) {
      reasons.push(`Twitter 源情绪 ${bySource.twitter.averageScore.toFixed(2)}（${bySource.twitter.sampleSize} 条）`);
    }
    if (bySource.reddit.sampleSize > 0) {
      reasons.push(`Reddit 源情绪 ${bySource.reddit.averageScore.toFixed(2)}（${bySource.reddit.sampleSize} 条）`);
    }
    if (bySource.market.sampleSize > 0) {
      reasons.push(`Market 源情绪 ${bySource.market.averageScore.toFixed(2)}（动量+量能合成）`);
    }
    reasons.push(`综合情绪 ${overallScore.toFixed(2)} → ${this.scoreToLabel(overallScore)}`);
    reasons.push(`恐慌贪婪指数 ${fgi}（${this.aggregator.fearGreedLabel(fgi)}）`);
    if (anomalies.length > 0) {
      reasons.push(`检测到 ${anomalies.length} 个异常（${anomalies.map((a) => a.type).join(' / ')}）`);
    }
    return reasons;
  }

  private scoreToLabel(score: number): MarketSentiment['overallLabel'] {
    if (score >= 0.5) return 'very_bullish';
    if (score >= 0.1) return 'bullish';
    if (score > -0.1) return 'neutral';
    if (score > -0.5) return 'bearish';
    return 'very_bearish';
  }

  private saveSnapshot(symbol: string, ms: MarketSentiment): void {
    const list = this.history.get(symbol) || [];
    list.push(ms);
    // 保留最近 90 个快照（够 90 天每天 1 个）
    if (list.length > 90) list.splice(0, list.length - 90);
    this.history.set(symbol, list);
  }

  private emitUpdate(ms: MarketSentiment): void {
    for (const h of this.updateHandlers) {
      try { h(ms); } catch { /* ignore */ }
    }
    for (const a of ms.anomalies) {
      for (const h of this.anomalyHandlers) {
        try { h(a, ms.symbol); } catch { /* ignore */ }
      }
      if (this.enableNotifications && this.notifier?.notifyAnomaly) {
        try { this.notifier.notifyAnomaly(a, ms.symbol); } catch { /* ignore */ }
      }
    }
  }

  private detectShift(ms: MarketSentiment): void {
    const arr = this.history.get(ms.symbol) || [];
    if (arr.length < 2) return;
    const prev = arr[arr.length - 2];
    if (!prev) return;
    const diff = Math.abs(ms.overallScore - prev.overallScore);
    if (diff >= 0.3) {
      for (const h of this.shiftHandlers) {
        try { h(ms, prev); } catch { /* ignore */ }
      }
      if (this.enableNotifications && this.notifier?.notifySentimentShift) {
        try { this.notifier.notifySentimentShift(ms, prev); } catch { /* ignore */ }
      }
    }
  }
}

// =============================================================================
// 工具
// =============================================================================

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}
