/**
 * 加密新闻领域类型定义
 *
 * 集中导出，供 NewsAggregator / SentimentAnalyzer / Translator / CryptoPanicClient 共享。
 */

export type NewsCategory = 'market' | 'defi' | 'regulation' | 'technology' | 'nft' | 'mining';

export type Sentiment = 'bullish' | 'bearish' | 'neutral';

export type Language = 'zh' | 'en';

export type NewsFilter = 'hot' | 'rising' | 'bullish' | 'bearish' | 'important' | 'saved' | 'lol';

export type NewsKind = 'news' | 'media';

export interface NewsVotes {
  like: number;
  dislike: number;
  comments: number;
}

export interface NewsItem {
  id: string;
  /** 原文标题（英文） */
  title: string;
  /** 中文翻译（按需生成） */
  titleZh?: string;
  /** 摘要原文 */
  body: string;
  bodyZh?: string;
  /** 原文链接 */
  url: string;
  /** 来源名（CoinDesk / Cointelegraph / ...） */
  source: string;
  author?: string;
  /** 发布时间（毫秒） */
  publishedAt: number;
  /** 关联币种大写符号 ['BTC','ETH',...] */
  currencies: string[];
  categories: NewsCategory[];
  sentiment: Sentiment;
  votes: NewsVotes;
  imageUrl?: string;
  isHot: boolean;
  isBullish: boolean;
  isImportant: boolean;
  /** 数据来源（cryptopanic / mock） */
  origin?: 'cryptopanic' | 'mock';
}
