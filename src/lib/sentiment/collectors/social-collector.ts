/**
 * SocialCollector - 社交媒体数据收集器（P3-3）
 *
 * 覆盖 4 个数据源：
 *  - Twitter / X（API v2 recent search）
 *  - Reddit  （subreddit posts）
 *  - Telegram（公开频道 message history）
 *  - Discord （频道 message history）
 *
 * 设计要点：
 *  - 不直接依赖第三方 SDK，使用 fetch + 可注入的 fetchImpl
 *  - API 凭据通过构造函数注入；缺凭据时降级为 mock（保证演示可走通）
 *  - 返回统一的 TextItem[]，供 NLP 引擎使用
 *  - 每条都带 metadata（含点赞/转发/作者），下游可以做权重
 *
 * 真实凭据命名（建议注入）：
 *  - twitter.bearerToken        （X API v2）
 *  - reddit.clientId / clientSecret / userAgent
 *  - telegram.botToken          （@BotFather）
 *  - discord.botToken
 *
 * 演示降级：任意 API 凭据缺失或请求失败 → 返回 mock 数据（带情感倾向）
 */

import type { SentimentSource, TextItem } from '../types';

// =============================================================================
// 配置
// =============================================================================

export interface SocialCollectorOptions {
  /** 自定义 fetch 实现（测试 / SSR） */
  fetchImpl?: typeof fetch;
  /** Twitter / X bearer token */
  twitterBearer?: string;
  /** Reddit 应用凭据 */
  redditClientId?: string;
  redditClientSecret?: string;
  redditUserAgent?: string;
  /** Telegram bot token */
  telegramBotToken?: string;
  /** Discord bot token */
  discordBotToken?: string;
  /** 默认单源拉取上限 */
  defaultLimit?: number;
  /** 是否在缺凭据时返回 mock（默认 true） */
  demoFallback?: boolean;
}

// =============================================================================
// 内部：通用工具
// =============================================================================

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function pickId(prefix: string, raw: string | number): string {
  return `${prefix}-${raw}`;
}

function nowMs(): number {
  return Date.now();
}

// =============================================================================
// SocialCollector
// =============================================================================

export class SocialCollector {
  private readonly fetchImpl: typeof fetch;
  private readonly twitterBearer?: string;
  private readonly redditClientId?: string;
  private readonly redditClientSecret?: string;
  private readonly redditUserAgent: string;
  private readonly telegramBotToken?: string;
  private readonly discordBotToken?: string;
  private readonly defaultLimit: number;
  private readonly demoFallback: boolean;

  constructor(opts: SocialCollectorOptions = {}) {
    this.fetchImpl = opts.fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : (() => {
      throw new Error('No fetch implementation available');
    }) as typeof fetch);
    this.twitterBearer = opts.twitterBearer || process.env.TWITTER_BEARER_TOKEN;
    this.redditClientId = opts.redditClientId || process.env.REDDIT_CLIENT_ID;
    this.redditClientSecret = opts.redditClientSecret || process.env.REDDIT_CLIENT_SECRET;
    this.redditUserAgent = opts.redditUserAgent || process.env.REDDIT_USER_AGENT || 'smy-sentiment-bot/1.0';
    this.telegramBotToken = opts.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    this.discordBotToken = opts.discordBotToken || process.env.DISCORD_BOT_TOKEN;
    this.defaultLimit = opts.defaultLimit ?? 50;
    this.demoFallback = opts.demoFallback !== false;
  }

  // -------------------------------------------------------------------------
  // Twitter / X
  // -------------------------------------------------------------------------

  async collectFromTwitter(symbol: string, limit?: number): Promise<TextItem[]> {
    const upper = symbol.toUpperCase();
    const n = Math.min(Math.max(limit ?? this.defaultLimit, 1), 100);
    if (!this.twitterBearer) {
      return this.demoFallback ? this.mockItems('twitter', upper, n) : [];
    }
    try {
      // X API v2 recent search
      const url = new URL('https://api.twitter.com/2/tweets/search/recent');
      url.searchParams.set('query', `${upper} (crypto OR coin OR token) -is:retweet lang:en`);
      url.searchParams.set('max_results', String(n));
      url.searchParams.set('tweet.fields', 'public_metrics,created_at,author_id,lang');

      const res = await this.fetchImpl(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.twitterBearer}`,
          'User-Agent': 'smy-sentiment/1.0',
        },
      });
      if (!res.ok) {
        if (this.demoFallback) return this.mockItems('twitter', upper, n);
        return [];
      }
      const data = await safeJson(res);
      const tweets = (data && data.data) || [];
      return tweets.map((t: any) => ({
        id: pickId('tw', t.id),
        source: 'twitter' as SentimentSource,
        content: t.text || '',
        author: t.author_id,
        timestamp: t.created_at ? new Date(t.created_at).getTime() : nowMs(),
        url: t.id ? `https://x.com/i/web/status/${t.id}` : undefined,
        metadata: {
          metrics: t.public_metrics,
          lang: t.lang,
        },
      }));
    } catch {
      return this.demoFallback ? this.mockItems('twitter', upper, n) : [];
    }
  }

  // -------------------------------------------------------------------------
  // Reddit
  // -------------------------------------------------------------------------

  async collectFromReddit(symbol: string, limit?: number): Promise<TextItem[]> {
    const upper = symbol.toUpperCase();
    const n = Math.min(Math.max(limit ?? this.defaultLimit, 1), 100);
    if (!this.redditClientId || !this.redditClientSecret) {
      return this.demoFallback ? this.mockItems('reddit', upper, n) : [];
    }
    try {
      // OAuth token (client_credentials)
      const auth = Buffer.from(`${this.redditClientId}:${this.redditClientSecret}`).toString('base64');
      const tokenRes = await this.fetchImpl('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'User-Agent': this.redditUserAgent,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });
      if (!tokenRes.ok) {
        return this.demoFallback ? this.mockItems('reddit', upper, n) : [];
      }
      const token = await safeJson(tokenRes);
      const accessToken = token?.access_token;
      if (!accessToken) {
        return this.demoFallback ? this.mockItems('reddit', upper, n) : [];
      }
      // 搜索
      const search = new URL('https://oauth.reddit.com/search');
      search.searchParams.set('q', upper);
      search.searchParams.set('limit', String(n));
      search.searchParams.set('sort', 'new');
      const list = await this.fetchImpl(search.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': this.redditUserAgent,
        },
      });
      if (!list.ok) {
        return this.demoFallback ? this.mockItems('reddit', upper, n) : [];
      }
      const body = await safeJson(list);
      const children = body?.data?.children || [];
      return children.map((c: any) => {
        const d = c.data || {};
        return {
          id: pickId('rd', d.id),
          source: 'reddit' as SentimentSource,
          content: `${d.title || ''} ${d.selftext || ''}`.trim(),
          author: d.author,
          timestamp: d.created_utc ? Math.floor(d.created_utc * 1000) : nowMs(),
          url: d.url_overridden_by_dest || d.url,
          metadata: {
            subreddit: d.subreddit,
            score: d.score,
            upvote_ratio: d.upvote_ratio,
            num_comments: d.num_comments,
          },
        };
      });
    } catch {
      return this.demoFallback ? this.mockItems('reddit', upper, n) : [];
    }
  }

  // -------------------------------------------------------------------------
  // Telegram（公开频道，需先 invite bot）
  // -------------------------------------------------------------------------

  async collectFromTelegram(symbol: string, limit?: number): Promise<TextItem[]> {
    const upper = symbol.toUpperCase();
    const n = Math.min(Math.max(limit ?? this.defaultLimit, 1), 100);
    if (!this.telegramBotToken) {
      return this.demoFallback ? this.mockItems('telegram', upper, n) : [];
    }
    // 演示：Telegram Bot 只能拉取 bot 是 admin 的频道
    // 这里按"已有 channel"模式走：默认通过 @CryptoPanicBot / @BitcoinChannel 公共频道
    // （生产中应传入 channels 列表；此处仅展示 API 调用方式）
    const channel = process.env.TELEGRAM_CHANNEL_USERNAME || '@cryptopanic';
    try {
      const url = new URL(`https://api.telegram.org/bot${this.telegramBotToken}/getChatHistory`);
      url.searchParams.set('chat_id', channel);
      url.searchParams.set('limit', String(n));
      const res = await this.fetchImpl(url.toString());
      if (!res.ok) {
        return this.demoFallback ? this.mockItems('telegram', upper, n) : [];
      }
      const body = await safeJson(res);
      const messages = body?.result?.messages || [];
      return messages.map((m: any) => ({
        id: pickId('tg', m.message_id),
        source: 'telegram' as SentimentSource,
        content: (m.text || m.caption || '').toString(),
        author: m.author_signature || m.from?.username,
        timestamp: m.date ? m.date * 1000 : nowMs(),
        metadata: {
          channel,
          views: m.views,
        },
      }));
    } catch {
      return this.demoFallback ? this.mockItems('telegram', upper, n) : [];
    }
  }

  // -------------------------------------------------------------------------
  // Discord（机器人 / 应用）
  // -------------------------------------------------------------------------

  async collectFromDiscord(symbol: string, limit?: number): Promise<TextItem[]> {
    const upper = symbol.toUpperCase();
    const n = Math.min(Math.max(limit ?? this.defaultLimit, 1), 100);
    if (!this.discordBotToken) {
      return this.demoFallback ? this.mockItems('discord' as any as SentimentSource, upper, n) : [];
    }
    // 演示：Discord 不开放 getMessages 公共端点，需通过 Bot + Gateway
    // 此处保留 API 调用模板；如果未提供 channelId 直接降级
    const channelId = process.env.DISCORD_CHANNEL_ID;
    if (!channelId) {
      return this.demoFallback ? this.mockItems('discord' as any as SentimentSource, upper, n) : [];
    }
    try {
      const url = new URL(`https://discord.com/api/v10/channels/${channelId}/messages`);
      url.searchParams.set('limit', String(n));
      const res = await this.fetchImpl(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bot ${this.discordBotToken}`,
        },
      });
      if (!res.ok) {
        return this.demoFallback ? this.mockItems('discord' as any as SentimentSource, upper, n) : [];
      }
      const messages = (await safeJson(res)) || [];
      return messages.map((m: any) => ({
        id: pickId('dc', m.id),
        source: 'telegram' as SentimentSource, // 暂归 telegram（社交大类）— TODO: 扩展 SentimentSource
        content: m.content || '',
        author: m.author?.username,
        timestamp: m.timestamp ? new Date(m.timestamp).getTime() : nowMs(),
        metadata: {
          channel: channelId,
        },
      }));
    } catch {
      return this.demoFallback ? this.mockItems('discord' as any as SentimentSource, upper, n) : [];
    }
  }

  // -------------------------------------------------------------------------
  // 便捷聚合
  // -------------------------------------------------------------------------

  /** 收集所有社交源（并发） */
  async collectAll(symbol: string, limitPerSource?: number): Promise<TextItem[]> {
    const [tw, rd, tg, dc] = await Promise.all([
      this.collectFromTwitter(symbol, limitPerSource),
      this.collectFromReddit(symbol, limitPerSource),
      this.collectFromTelegram(symbol, limitPerSource),
      // Discord 在类型层未单独声明，使用 collectFromDiscord 输出 'telegram' source 避免 lint 错误
      this.collectFromDiscord(symbol, limitPerSource),
    ]);
    return [...tw, ...rd, ...tg, ...dc];
  }

  // -------------------------------------------------------------------------
  // Mock 数据（演示降级）
  // -------------------------------------------------------------------------

  private mockItems(source: SentimentSource, symbol: string, n: number): TextItem[] {
    // 简单 mock：根据索引奇偶制造 1:1 偏多/偏空 样本，便于演示聚合
    const bullishPool = [
      `${symbol} breaks out to new highs! Very bullish momentum.`,
      `${symbol} looking extremely strong, moon soon!`,
      `Big whales accumulating ${symbol}, this is a great opportunity.`,
      `${symbol} ETF approved — surge incoming!`,
      `${symbol} rally continues, don't miss the pump!`,
    ];
    const bearishPool = [
      `${symbol} dumps hard, panic everywhere.`,
      `${symbol} breakdown confirmed, more downside expected.`,
      `Massive sell-off in ${symbol}, crash imminent.`,
      `${symbol} losing support, bloodbath on the way.`,
      `${symbol} rugpull risk — be very careful!`,
    ];
    const neutralPool = [
      `${symbol} trading sideways, no clear direction.`,
      `${symbol} volatility remains high but no clear trend.`,
      `Watching ${symbol} consolidation at key level.`,
    ];
    const out: TextItem[] = [];
    for (let i = 0; i < n; i++) {
      const r = i % 3;
      const text =
        r === 0 ? bullishPool[i % bullishPool.length] :
        r === 1 ? bearishPool[i % bearishPool.length] :
                  neutralPool[i % neutralPool.length];
      out.push({
        id: pickId(source, `${symbol}-mock-${i}-${nowMs()}`),
        source,
        content: text,
        author: `mock_${source}_user`,
        timestamp: nowMs() - i * 60_000,
        metadata: { mock: true },
      });
    }
    return out;
  }
}
