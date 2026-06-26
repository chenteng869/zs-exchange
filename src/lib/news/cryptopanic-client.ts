/**
 * CryptoPanic API 客户端
 *
 * 端点：https://cryptopanic.com/api/v1/posts/
 *
 * 主要参数：
 *  - auth_token  API Key（演示用 mock key，生产需 CRYPTOPANIC_API_KEY）
 *  - filter      hot / rising / bullish / bearish / important / saved / lol
 *  - currencies  币种符号过滤（逗号分隔）
 *  - kind        news / media（默认 news）
 *  - public      true 返回公开内容
 *
 * 限流：
 *  - 免费版 200 req/h
 *  - 客户端二次节流 5 req/min
 *
 * 降级：
 *  - 5xx / TIMEOUT 自动重试（指数退避，最多 3 次）
 *  - 端点故障 / 解析失败时降级到 mock 数据
 *
 * 注：演示用 mock key 默认返回 mock 新闻，保证联调可走通。
 */

import type { NewsFilter, NewsItem, NewsKind, Sentiment } from './types';
import { MOCK_NEWS } from './mock-data';

// =============================================================================
// 常量
// =============================================================================

/** CryptoPanic 公共端点 */
export const CRYPTOPANIC_BASE = 'https://cryptopanic.com/api/v1';

/** 默认 API Key（mock；生产应使用 CRYPTOPANIC_API_KEY 环境变量） */
export const CRYPTOPANIC_API_KEY = process.env.CRYPTOPANIC_API_KEY || 'mock-key';

/** 是否启用 mock 模式（mock key 时） */
export const MOCK_MODE = !process.env.CRYPTOPANIC_API_KEY || process.env.CRYPTOPANIC_API_KEY === 'mock-key';

/** 每分钟最大请求数（客户端限流） */
export const NEWS_RATE_LIMIT_PER_MIN = 5;

/** 默认超时（毫秒） */
export const DEFAULT_TIMEOUT_MS = 8_000;

/** 最大重试次数 */
export const DEFAULT_MAX_RETRIES = 3;

// =============================================================================
// 错误
// =============================================================================

export class CryptoPanicError extends Error {
  public readonly code: string;
  public readonly status?: number;
  constructor(code: string, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'CryptoPanicError';
  }
}

// =============================================================================
// 原始响应类型
// =============================================================================

export interface CryptoPanicPostRaw {
  id: number;
  slug?: string;
  title: string;
  description?: string;
  body?: string;
  url: string;
  source?: { domain?: string; title?: string; region?: string };
  author?: string;
  image_url?: string;
  published_at: string;
  created_at?: string;
  kind?: string;
  currencies?: Array<{ code?: string; title?: string; slug?: string; url?: string }>;
  votes?: { positive?: number; negative?: number; comments?: number; };
  /** CryptoPanic 标记 */
  hot?: boolean;
  important?: boolean;
}

export interface CryptoPanicListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CryptoPanicPostRaw[];
}

// =============================================================================
// 客户端配置
// =============================================================================

export interface CryptoPanicClientOptions {
  apiKey?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  /** 客户端限流（每分钟最大请求） */
  rateLimitPerMin?: number;
  /** 自定义 mock 降级（注入测试） */
  mockProvider?: () => Promise<NewsItem[]>;
}

// =============================================================================
// 限流器（滑动 60s 窗口）
// =============================================================================

class MinuteRateLimiter {
  private window: number[] = [];
  private readonly max: number;

  constructor(max: number) {
    this.max = max;
  }

  /** 检查是否超限，并记录一次调用 */
  check(): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    // 清理 60s 之外
    this.window = this.window.filter((t) => now - t < 60_000);
    if (this.window.length >= this.max) {
      const oldest = this.window[0];
      const retryAfterMs = 60_000 - (now - oldest);
      return { allowed: false, retryAfterMs };
    }
    this.window.push(now);
    return { allowed: true };
  }

  reset(): void {
    this.window = [];
  }

  size(): number {
    return this.window.length;
  }
}

// =============================================================================
// 工具：raw -> NewsItem
// =============================================================================

function mapSentiment(filter: NewsFilter | undefined, post: CryptoPanicPostRaw): Sentiment {
  if (filter === 'bullish') return 'bullish';
  if (filter === 'bearish') return 'bearish';
  // 根据 votes 推断
  const pos = post.votes?.positive || 0;
  const neg = post.votes?.negative || 0;
  if (pos + neg === 0) return 'neutral';
  if (pos > neg * 2) return 'bullish';
  if (neg > pos * 2) return 'bearish';
  return 'neutral';
}

function mapCurrencies(post: CryptoPanicPostRaw): string[] {
  if (!post.currencies) return [];
  return post.currencies
    .map((c) => (c.code || '').toUpperCase())
    .filter((c) => c.length > 0);
}

function inferCategories(post: CryptoPanicPostRaw): Array<'market' | 'defi' | 'regulation' | 'technology' | 'nft' | 'mining'> {
  const text = `${post.title} ${post.description || ''} ${post.body || ''}`.toLowerCase();
  const cats: Array<'market' | 'defi' | 'regulation' | 'technology' | 'nft' | 'mining'> = [];
  if (/(defi|lending|liquidity pool|yield|swap|dex)/i.test(text)) cats.push('defi');
  if (/(sec|cftc|regulation|law|compliance|lawsuit)/i.test(text)) cats.push('regulation');
  if (/(nft|ordinals|collectible|pudgy|bored ape)/i.test(text)) cats.push('nft');
  if (/(mining|miner|hashrate|asic|halving)/i.test(text)) cats.push('mining');
  if (/(upgrade|hard fork|layer 2|zk|rollup|consensus|protocol)/i.test(text)) cats.push('technology');
  if (cats.length === 0) cats.push('market');
  return cats;
}

function mapToNewsItem(post: CryptoPanicPostRaw, filter?: NewsFilter): NewsItem {
  const publishedAt = post.published_at ? new Date(post.published_at).getTime() : Date.now();
  return {
    id: `cp-${post.id}`,
    title: post.title,
    body: post.description || post.body || '',
    url: post.url,
    source: post.source?.title || post.source?.domain || 'Unknown',
    author: post.author,
    publishedAt,
    currencies: mapCurrencies(post),
    categories: inferCategories(post),
    sentiment: mapSentiment(filter, post),
    votes: {
      like: post.votes?.positive || 0,
      dislike: post.votes?.negative || 0,
      comments: post.votes?.comments || 0,
    },
    imageUrl: post.image_url,
    isHot: !!post.hot,
    isBullish: mapSentiment(filter, post) === 'bullish' || !!post.hot,
    isImportant: !!post.important,
    origin: 'cryptopanic',
  };
}

// =============================================================================
// CryptoPanicClient
// =============================================================================

export class CryptoPanicClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly rateLimiter: MinuteRateLimiter;
  private readonly mockProvider: () => Promise<NewsItem[]>;
  private readonly mockMode: boolean;

  constructor(opts: CryptoPanicClientOptions = {}) {
    this.apiKey = opts.apiKey || CRYPTOPANIC_API_KEY;
    this.baseUrl = opts.baseUrl || CRYPTOPANIC_BASE;
    this.fetchImpl = opts.fetchImpl || (typeof fetch !== 'undefined' ? fetch : (() => {
      throw new CryptoPanicError('NO_FETCH', 'No fetch implementation available');
    })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.rateLimiter = new MinuteRateLimiter(opts.rateLimitPerMin ?? NEWS_RATE_LIMIT_PER_MIN);
    this.mockProvider = opts.mockProvider || (async () => MOCK_NEWS);
    this.mockMode = this.apiKey === 'mock-key' || !this.apiKey;
  }

  isMockMode(): boolean {
    return this.mockMode;
  }

  /** 重置限流窗口（仅测试） */
  resetRateLimit(): void {
    this.rateLimiter.reset();
  }

  /** 当前 60s 内的请求数 */
  currentRequestCount(): number {
    return this.rateLimiter.size();
  }

  // -------------------------------------------------------------------------
  // 拉取
  // -------------------------------------------------------------------------

  async fetchPosts(params: {
    filter?: NewsFilter;
    currencies?: string[];
    kind?: NewsKind;
    public?: boolean;
  } = {}): Promise<NewsItem[]> {
    // mock 模式：直接返回
    if (this.mockMode) {
      return this.fetchMock(params);
    }

    // 限流
    const limit = this.rateLimiter.check();
    if (!limit.allowed) {
      throw new CryptoPanicError(
        'RATE_LIMITED',
        `Rate limit exceeded: ${this.rateLimiter.size()} requests in the last 60s. Retry after ${Math.ceil((limit.retryAfterMs || 0) / 1000)}s.`,
      );
    }

    const query = this.buildQuery(params);
    const url = `${this.baseUrl}/posts/?${query}`;

    // 至少执行一次（maxRetries=0 表示 1 次尝试，不重试）
    const totalAttempts = Math.max(1, this.maxRetries);
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      try {
        const res = await this.fetchWithTimeout(url);
        if (res.status >= 500) {
          lastErr = new CryptoPanicError(`HTTP_${res.status}`, `CryptoPanic HTTP ${res.status}`, res.status);
          if (attempt < totalAttempts - 1) {
            await this.sleep(500 * Math.pow(2, attempt));
            continue;
          }
          // 5xx 全失败 → 降级
          return this.fetchMock(params);
        }
        if (res.status === 429) {
          lastErr = new CryptoPanicError('RATE_LIMITED_HTTP', `CryptoPanic HTTP 429`, 429);
          if (attempt < totalAttempts - 1) {
            await this.sleep(1000 * Math.pow(2, attempt));
            continue;
          }
          return this.fetchMock(params);
        }
        if (!res.ok) {
          throw new CryptoPanicError(`HTTP_${res.status}`, `CryptoPanic HTTP ${res.status}`, res.status);
        }
        const data = (await res.json()) as CryptoPanicListResponse;
        const items = (data.results || []).map((r) => mapToNewsItem(r, params.filter));
        return items;
      } catch (err) {
        lastErr = err as Error;
        if ((err as Error).name === 'AbortError') {
          lastErr = new CryptoPanicError('TIMEOUT', `CryptoPanic timeout after ${this.timeoutMs}ms`);
        }
        if (attempt < totalAttempts - 1) {
          await this.sleep(500 * Math.pow(2, attempt));
          continue;
        }
        // 重试耗尽 → 降级
        return this.fetchMock(params);
      }
    }

    // 不应到达
    if (lastErr) return this.fetchMock(params);
    return [];
  }

  // -------------------------------------------------------------------------
  // 私有
  // -------------------------------------------------------------------------

  private buildQuery(params: {
    filter?: NewsFilter;
    currencies?: string[];
    kind?: NewsKind;
    public?: boolean;
  }): string {
    const q = new URLSearchParams();
    q.set('auth_token', this.apiKey);
    if (params.filter) q.set('filter', params.filter);
    if (params.kind) q.set('kind', params.kind);
    if (params.public) q.set('public', 'true');
    if (params.currencies && params.currencies.length > 0) {
      q.set('currencies', params.currencies.join(','));
    }
    return q.toString();
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetchImpl(url, { method: 'GET', signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  private async fetchMock(params: {
    filter?: NewsFilter;
    currencies?: string[];
    kind?: NewsKind;
  }): Promise<NewsItem[]> {
    let items = await this.mockProvider();

    if (params.currencies && params.currencies.length > 0) {
      const symbols = params.currencies.map((s) => s.toUpperCase());
      items = items.filter((n) => n.currencies.some((c) => symbols.includes(c.toUpperCase())));
    }

    if (params.filter === 'hot') {
      items = items.filter((n) => n.isHot);
    } else if (params.filter === 'bullish') {
      items = items.filter((n) => n.sentiment === 'bullish' || n.isBullish);
    } else if (params.filter === 'bearish') {
      items = items.filter((n) => n.sentiment === 'bearish');
    } else if (params.filter === 'important') {
      items = items.filter((n) => n.isImportant);
    }

    // 按 publishedAt 降序
    items.sort((a, b) => b.publishedAt - a.publishedAt);
    return items;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
