/**
 * NewsAggregator - 业务层新闻聚合器
 *
 * 特性：
 *  - 30 min TTL 内存缓存
 *  - 多订阅者事件总线
 *  - 翻译（按需调用 Translator）
 *  - 情绪分析（按需调用 SentimentAnalyzer）
 *  - 币种 / 分类 / 关键词搜索 / 排序
 *  - 缓存失效
 *
 * 提供方法：
 *  - getLatest(opts?)                  拉取最新
 *  - getByCurrency(symbol, limit?)     按币种过滤
 *  - getByCategory(category, limit?)   按分类过滤
 *  - search(query, limit?)             模糊搜索（标题/正文）
 *  - invalidateCache()                 强制刷新
 *  - onNews(handler) / offNews(handler)  订阅
 *
 * 适用场景：
 *  - 首页"学院"模块
 *  - 币种详情页"相关新闻"
 *  - 通知中心新闻推送
 */

import type {
  NewsCategory,
  NewsFilter,
  NewsItem,
} from './types';
import {
  CryptoPanicClient,
  type CryptoPanicClientOptions,
} from './cryptopanic-client';
import { Translator, type TranslatorOptions } from './translator';
import { SentimentAnalyzer, type SentimentAnalyzerOptions } from './sentiment-analyzer';

// =============================================================================
// 常量
// =============================================================================

/** 30 min 缓存 */
export const NEWS_CACHE_TTL_MS = 30 * 60_000;

/** 默认拉取上限 */
export const DEFAULT_FETCH_LIMIT = 30;

// =============================================================================
// 类型
// =============================================================================

export interface NewsAggregatorOptions {
  client?: CryptoPanicClient;
  translator?: Translator;
  sentiment?: SentimentAnalyzer;
  clientOpts?: CryptoPanicClientOptions;
  translatorOpts?: TranslatorOptions;
  sentimentOpts?: SentimentAnalyzerOptions;
  cacheTtlMs?: number;
  /** 是否在获取时按需补翻译（默认 true） */
  autoTranslate?: boolean;
  /** 是否在获取时按需补情绪分析（默认 false — CryptoPanic 已含 votes） */
  autoSentiment?: boolean;
}

export interface GetLatestOptions {
  limit?: number;
  currencies?: string[];
  filter?: NewsFilter;
}

// 事件处理器
export type NewsHandler = (items: NewsItem[]) => void;

// =============================================================================
// 缓存条目
// =============================================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// =============================================================================
// NewsAggregator
// =============================================================================

export class NewsAggregator {
  private readonly client: CryptoPanicClient;
  private readonly translator: Translator;
  private readonly sentiment: SentimentAnalyzer;
  private readonly cacheTtlMs: number;
  private readonly autoTranslate: boolean;
  private readonly autoSentiment: boolean;

  /** 缓存 key → 条目 */
  private readonly cache: Map<string, CacheEntry<NewsItem[]>> = new Map();

  /** 订阅者 */
  private readonly handlers: Set<NewsHandler> = new Set();

  constructor(opts: NewsAggregatorOptions = {}) {
    this.client = opts.client || new CryptoPanicClient(opts.clientOpts || {});
    this.translator = opts.translator || new Translator(opts.translatorOpts || {});
    this.sentiment = opts.sentiment || new SentimentAnalyzer(opts.sentimentOpts || {});
    this.cacheTtlMs = opts.cacheTtlMs ?? NEWS_CACHE_TTL_MS;
    this.autoTranslate = opts.autoTranslate !== false;
    this.autoSentiment = opts.autoSentiment === true;
  }

  // -------------------------------------------------------------------------
  // 公共方法
  // -------------------------------------------------------------------------

  /** 拉取最新 */
  async getLatest(opts: GetLatestOptions = {}): Promise<NewsItem[]> {
    const limit = opts.limit || DEFAULT_FETCH_LIMIT;
    const cacheKey = `latest:${opts.filter || 'all'}:${(opts.currencies || []).join(',')}`;

    const cached = this.getCache(cacheKey);
    if (cached) {
      return this.sliceLimit(cached, limit);
    }

    let items = await this.client.fetchPosts({
      filter: opts.filter,
      currencies: opts.currencies,
    });

    items = await this.augment(items);
    this.setCache(cacheKey, items);
    this.emit(items);
    return this.sliceLimit(items, limit);
  }

  /** 按币种过滤 */
  async getByCurrency(symbol: string, limit?: number): Promise<NewsItem[]> {
    const sym = symbol.toUpperCase();
    const cacheKey = `currency:${sym}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return this.sliceLimit(cached, limit || DEFAULT_FETCH_LIMIT);
    }

    // 先尝试从 getLatest 拉取，再按币种过滤（共享缓存）
    let all = await this.getLatest({ limit: DEFAULT_FETCH_LIMIT });
    let items = all.filter((n) => n.currencies.includes(sym));
    if (items.length === 0) {
      // 兜底：直接按币种调 client
      items = await this.client.fetchPosts({ currencies: [sym] });
      items = await this.augment(items);
    }
    this.setCache(cacheKey, items);
    return this.sliceLimit(items, limit || DEFAULT_FETCH_LIMIT);
  }

  /** 按分类过滤 */
  async getByCategory(category: NewsCategory, limit?: number): Promise<NewsItem[]> {
    const cacheKey = `category:${category}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return this.sliceLimit(cached, limit || DEFAULT_FETCH_LIMIT);
    }

    let all = await this.getLatest({ limit: DEFAULT_FETCH_LIMIT });
    let items = all.filter((n) => n.categories.includes(category));
    if (items.length === 0) {
      // 兜底
      items = await this.client.fetchPosts({});
      items = (await this.augment(items)).filter((n) => n.categories.includes(category));
    }
    this.setCache(cacheKey, items);
    return this.sliceLimit(items, limit || DEFAULT_FETCH_LIMIT);
  }

  /** 模糊搜索（标题 / 正文） */
  async search(query: string, limit?: number): Promise<NewsItem[]> {
    if (!query || !query.trim()) return [];
    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return this.sliceLimit(cached, limit || DEFAULT_FETCH_LIMIT);
    }

    const all = await this.getLatest({ limit: DEFAULT_FETCH_LIMIT });
    const q = query.toLowerCase();
    const items = all.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        (n.titleZh && n.titleZh.includes(q)) ||
        n.currencies.some((c) => c.toLowerCase() === q) ||
        n.source.toLowerCase().includes(q),
    );
    this.setCache(cacheKey, items);
    return this.sliceLimit(items, limit || DEFAULT_FETCH_LIMIT);
  }

  /** 失效缓存（强制刷新下次拉取） */
  invalidateCache(): void {
    this.cache.clear();
  }

  // -------------------------------------------------------------------------
  // 订阅
  // -------------------------------------------------------------------------

  /** 订阅新闻事件 */
  onNews(handler: NewsHandler): () => void {
    this.handlers.add(handler);
    return () => this.offNews(handler);
  }

  /** 取消订阅 */
  offNews(handler: NewsHandler): void {
    this.handlers.delete(handler);
  }

  /** 订阅者数量 */
  subscriberCount(): number {
    return this.handlers.size;
  }

  // -------------------------------------------------------------------------
  // 子组件访问
  // -------------------------------------------------------------------------

  getTranslator(): Translator {
    return this.translator;
  }

  getSentimentAnalyzer(): SentimentAnalyzer {
    return this.sentiment;
  }

  getClient(): CryptoPanicClient {
    return this.client;
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private async getLatestInternal(): Promise<NewsItem[]> {
    const cacheKey = 'latest:internal:all';
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    let items = await this.client.fetchPosts({});
    items = await this.augment(items);
    this.setCache(cacheKey, items);
    return items;
  }

  /** 补翻译 / 补情绪 */
  private async augment(items: NewsItem[]): Promise<NewsItem[]> {
    if (!this.autoTranslate && !this.autoSentiment) return items;

    const tasks = items.map(async (item) => {
      const next: NewsItem = { ...item };
      if (this.autoTranslate) {
        if (!next.titleZh) {
          try {
            next.titleZh = await this.translator.translate(next.title, 'zh');
          } catch { /* ignore */ }
        }
        if (!next.bodyZh) {
          try {
            next.bodyZh = await this.translator.translate(next.body, 'zh');
          } catch { /* ignore */ }
        }
      }
      if (this.autoSentiment) {
        try {
          const s = this.sentiment.analyze(`${next.title} ${next.body}`);
          next.sentiment = s;
        } catch { /* ignore */ }
      }
      return next;
    });

    return Promise.all(tasks);
  }

  private emit(items: NewsItem[]): void {
    for (const h of this.handlers) {
      try {
        h(items);
      } catch {
        /* 单个 handler 错误不影响其他 */
      }
    }
  }

  // -------------------------------------------------------------------------
  // 缓存
  // -------------------------------------------------------------------------

  private getCache(key: string): NewsItem[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  private setCache(key: string, value: NewsItem[]): void {
    // TTL=0 表示不缓存（避免存储后立即过期的小数竞态）
    if (this.cacheTtlMs <= 0) return;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  private sliceLimit(items: NewsItem[], limit: number): NewsItem[] {
    if (items.length <= limit) return items;
    return items.slice(0, limit);
  }

  /** 当前缓存条目数（仅测试用） */
  cacheSize(): number {
    return this.cache.size;
  }
}
