/**
 * AI 情绪分析系统 - 共享类型定义（P3-3）
 *
 * 设计原则：
 *  - 与 src/lib/news 的 NewsItem 解耦：TextItem 抽象为「任何可分析文本」
 *  - 7 个数据源：news / twitter / reddit / telegram / market / derivatives / onchain
 *  - 5 个情绪等级：very_bearish / bearish / neutral / bullish / very_bullish
 *  - 5 个趋势信号：strong_sell / sell / hold / buy / strong_buy
 */

// =============================================================================
// 数据源与基础枚举
// =============================================================================

/** 7 个数据源类型 */
export type SentimentSource =
  | 'news'
  | 'twitter'
  | 'reddit'
  | 'telegram'
  | 'market'
  | 'derivatives'
  | 'onchain';

/** 5 个情绪等级 */
export type SentimentLabel =
  | 'very_bearish'
  | 'bearish'
  | 'neutral'
  | 'bullish'
  | 'very_bullish';

/** 5 个趋势信号 */
export type TrendSignal = 'strong_sell' | 'sell' | 'hold' | 'buy' | 'strong_buy';

/** 异常类型 */
export type AnomalyType =
  | 'volume_spike'
  | 'sentiment_shift'
  | 'keyword_burst'
  | 'manipulation';

/** 异常严重度 */
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

/** 预测时间窗口 */
export type PredictionHorizon = '1h' | '4h' | '24h' | '7d';

// =============================================================================
// 文本项
// =============================================================================

/** 通用文本项（任何来源的新闻 / 帖子 / 行情描述都可以规范化为此结构） */
export interface TextItem {
  id: string;
  source: SentimentSource;
  content: string;
  author?: string;
  /** 毫秒时间戳 */
  timestamp: number;
  url?: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// NLP 评分
// =============================================================================

/** 单条文本的情感评分 */
export interface SentimentScore {
  text: string;
  /** -1（极空）到 1（极多） */
  score: number;
  /** 0-1，置信度 */
  confidence: number;
  /** 0+ 强度（绝对值 + 修饰词加权） */
  magnitude: number;
  label: SentimentLabel;
  /** 命中的关键词 */
  keywords: string[];
  /** 识别到的实体（如 BTC / ETH） */
  entities: string[];
}

// =============================================================================
// 单源汇总
// =============================================================================

/** 单数据源的情感汇总 */
export interface SourceSentiment {
  source: SentimentSource;
  sampleSize: number;
  /** 该源平均情感分（-1 ~ 1） */
  averageScore: number;
  /** 平均置信度（0-1） */
  averageConfidence: number;
  /** 5 个等级各自的样本数 */
  distribution: Record<SentimentLabel, number>;
  /** 该源情感的变化趋势 */
  trend: 'rising' | 'falling' | 'stable';
  updatedAt: number;
}

// =============================================================================
// 综合情绪
// =============================================================================

/** 综合市场情绪（含恐慌贪婪指数、信号、异常） */
export interface MarketSentiment {
  /** 'BTC' / 'ETH' / 'all' */
  symbol: string;
  /** 综合情感分（-1 ~ 1） */
  overallScore: number;
  overallLabel: SentimentLabel;
  overallConfidence: number;
  /** 0-100 */
  fearGreedIndex: number;
  fearGreedLabel: string;
  /** 各源汇总 */
  bySource: Record<SentimentSource, SourceSentiment>;
  /** 24h 内分析的文本总量 */
  volume24h: number;
  trend: TrendSignal;
  signal: {
    action: TrendSignal;
    strength: number;
    reasoning: string[];
  };
  anomalies: AnomalyAlert[];
  updatedAt: number;
}

// =============================================================================
// 异常
// =============================================================================

export interface AnomalyAlert {
  type: AnomalyType;
  severity: AnomalySeverity;
  description: string;
  detectedAt: number;
  data: Record<string, any>;
}

// =============================================================================
// 预测
// =============================================================================

export interface Prediction {
  symbol: string;
  horizon: PredictionHorizon;
  direction: 'up' | 'down' | 'sideways';
  /** 0-1 */
  confidence: number;
  /** 期望变化 %（如 "+2.3%"） */
  expectedChange: string;
  /** 用于预测的特征值 */
  features: Record<string, number>;
  /** 模型版本号 */
  modelVersion: string;
  createdAt: number;
}

// =============================================================================
// 关键常量
// =============================================================================

/** 数据源权重（合计 1.30 但允许 overlap；分析时会归一化） */
export const SENTIMENT_SOURCE_WEIGHTS: Record<SentimentSource, number> = {
  news: 0.25,
  twitter: 0.30,
  reddit: 0.15,
  telegram: 0.10,
  market: 0.20,
  derivatives: 0.10,
  onchain: 0.10,
};

/** 恐慌贪婪指数的 6 大组成（Alternative.me 风格） */
export const FEAR_GREED_COMPONENTS = {
  volatility: 0.25,
  momentum: 0.25,
  socialMedia: 0.15,
  surveys: 0.15,
  dominance: 0.10,
  trends: 0.10,
};

/** 5 个情绪等级对应的分数阈值 */
export const SENTIMENT_LABELS_THRESHOLDS: Record<SentimentLabel, [number, number]> = {
  very_bearish: [-1, -0.5],
  bearish: [-0.5, -0.1],
  neutral: [-0.1, 0.1],
  bullish: [0.1, 0.5],
  very_bullish: [0.5, 1],
};

/** 量激增倍数阈值（与历史均值相比） */
export const ANOMALY_VOLUME_SPIKE_THRESHOLD = 3;

/** 情感突变阈值（40% 跳变） */
export const ANOMALY_SENTIMENT_SHIFT = 0.4;

/** 关键词爆发倍数（同 keyword 24h 出现次数 / 7d 平均） */
export const ANOMALY_KEYWORD_BURST_THRESHOLD = 5;

/** 错误类 */
export class SentimentError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'SentimentError';
  }
}
