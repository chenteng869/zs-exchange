/**
 * 新闻聚合模块统一出口（News / CryptoPanic）
 *
 * 模块构成：
 *  - types                    共享领域类型
 *  - translator               翻译器（mock / 可切换 Google / DeepL）
 *  - sentiment-analyzer       情绪分析器（关键词 / 可切换 GPT-4）
 *  - cryptopanic-client       CryptoPanic REST 客户端（含限流 / 重试 / 降级）
 *  - mock-data                降级用 mock 新闻
 *  - news-aggregator          业务层聚合器（30 min 缓存 + 事件总线）
 */

// 类型
export * from './types';

// 翻译器
export {
  Translator,
  MockTranslateEngine,
  type TranslateEngine,
  type TranslatorOptions,
} from './translator';

// 情绪分析
export {
  SentimentAnalyzer,
  KeywordSentimentEngine,
  type SentimentEngine,
  type SentimentAnalyzerOptions,
} from './sentiment-analyzer';

// CryptoPanic 客户端
export {
  CryptoPanicClient,
  CryptoPanicError,
  CRYPTOPANIC_BASE,
  CRYPTOPANIC_API_KEY,
  NEWS_RATE_LIMIT_PER_MIN,
  MOCK_MODE,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MAX_RETRIES,
  type CryptoPanicClientOptions,
  type CryptoPanicPostRaw,
  type CryptoPanicListResponse,
} from './cryptopanic-client';

// Mock 数据
export { MOCK_NEWS } from './mock-data';

// 业务聚合
export {
  NewsAggregator,
  NEWS_CACHE_TTL_MS,
  DEFAULT_FETCH_LIMIT,
  type NewsAggregatorOptions,
  type GetLatestOptions,
  type NewsHandler,
} from './news-aggregator';
