/**
 * AI 情绪分析系统统一出口（P3-3）
 *
 * 模块构成：
 *  - types                     共享类型
 *  - nlp-engine                自实现情感 NLP（词典法）
 *  - aggregators               多源聚合 + 恐慌贪婪指数 + 异常检测
 *  - predictor                 趋势预测（启发式线性模型）
 *  - collectors/news           新闻（CryptoPanic）
 *  - collectors/social         社交（Twitter / Reddit / Telegram / Discord）
 *  - collectors/market         行情情绪化
 *  - sentiment-engine          业务编排层（analyzeSymbol / 事件 / 历史 / 预测）
 */

// =============================================================================
// Types
// =============================================================================

export * from './types';

// =============================================================================
// NLP Engine
// =============================================================================

export {
  NlpEngine,
  scoreToLabel,
  POSITIVE_WORDS_ZH,
  NEGATIVE_WORDS_ZH,
  POSITIVE_WORDS_EN,
  NEGATIVE_WORDS_EN,
  INTENSIFIERS,
  NEGATIONS,
  CRYPTO_ENTITIES,
  DOMAIN_KEYWORDS,
  type Token,
  type NlpEngineOptions,
} from './nlp-engine';

// =============================================================================
// Aggregator
// =============================================================================

export {
  SentimentAggregator,
  labelForScore,
  labelThresholds,
  type AggregatorOptions,
  type FearGreedComponents,
} from './aggregator';

// =============================================================================
// Predictor
// =============================================================================

export {
  SentimentPredictor,
  MODEL_VERSION,
  type PredictorOptions,
  type PredictionInput,
  type AccuracyRecord,
} from './predictor';

// =============================================================================
// Collectors
// =============================================================================

export {
  NewsCollector,
  type NewsCollectorOptions,
} from './collectors/news-collector';

export {
  SocialCollector,
  type SocialCollectorOptions,
} from './collectors/social-collector';

export {
  MarketCollector,
  type MarketCollectorOptions,
  type MarketSnapshot,
} from './collectors/market-collector';

// =============================================================================
// SentimentEngine (业务层)
// =============================================================================

export {
  SentimentEngine,
  type SentimentEngineOptions,
  type SentimentNotifier,
  type AnomalyHandler,
  type SentimentShiftHandler,
  type UpdateHandler,
} from './sentiment-engine';
