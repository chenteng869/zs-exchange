/**
 * NewsCollector - 新闻源数据收集器（P3-3）
 *
 * 集成现有 src/lib/news/cryptopanic-client.ts，
 * 将 NewsItem 转换为通用 TextItem，供 NLP 引擎分析。
 *
 * 演示降级：未配置 API Key / 拉取失败 → 使用 mock 新闻（已自带 positive/negative 倾向）
 */

import { CryptoPanicClient } from '../../news/cryptopanic-client';
import type { NewsItem } from '../../news/types';
import type { TextItem } from '../types';

// =============================================================================
// 配置
// =============================================================================

export interface NewsCollectorOptions {
  client?: CryptoPanicClient;
  /** 默认拉取上限 */
  defaultLimit?: number;
  /** 自定义 mock 提供器（用于测试） */
  mockProvider?: () => Promise<NewsItem[]>;
}

// =============================================================================
// NewsCollector
// =============================================================================

export class NewsCollector {
  private readonly client: CryptoPanicClient;
  private readonly defaultLimit: number;
  private readonly mockProvider: () => Promise<NewsItem[]>;

  constructor(opts: NewsCollectorOptions = {}) {
    this.client = opts.client || new CryptoPanicClient();
    this.defaultLimit = opts.defaultLimit ?? 50;
    this.mockProvider = opts.mockProvider || (async () => {
      // 这里走 CryptoPanic 自带的 mock 通道
      return this.client.fetchPosts({});
    });
  }

  /**
   * 收集新闻
   * @param symbol 币种符号（'BTC' / 'ETH' / 'all'）
   * @param limit  返回条数
   */
  async collect(symbol: string, limit?: number): Promise<TextItem[]> {
    const upperSymbol = symbol.toUpperCase();
    const realLimit = limit ?? this.defaultLimit;

    let items: NewsItem[] = [];
    try {
      if (upperSymbol === 'ALL') {
        items = await this.client.fetchPosts({});
      } else {
        items = await this.client.fetchPosts({ currencies: [upperSymbol] });
      }
    } catch {
      // 降级：返回 mock
      items = await this.mockProvider();
    }

    // 截取
    items = items.slice(0, realLimit);

    return items.map((n) => this.toTextItem(n));
  }

  // -------------------------------------------------------------------------
  // 内部：NewsItem -> TextItem
  // -------------------------------------------------------------------------

  private toTextItem(n: NewsItem): TextItem {
    return {
      id: n.id,
      source: 'news',
      // 标题 + 正文（小写化利于英文 NLP 处理）
      content: `${n.title} ${n.body || ''}`.trim(),
      author: n.author,
      timestamp: n.publishedAt,
      url: n.url,
      metadata: {
        origin: n.origin || 'cryptopanic',
        source: n.source,
        currencies: n.currencies,
        categories: n.categories,
        isHot: n.isHot,
        isBullish: n.isBullish,
        isImportant: n.isImportant,
        votes: n.votes,
        sentiment: n.sentiment,
      },
    };
  }
}
