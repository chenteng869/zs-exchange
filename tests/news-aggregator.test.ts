/**
 * NewsAggregator 单元测试（P1 H-01）
 *
 * 覆盖（14 用例）：
 *  1. getLatest 拉取正常
 *  2. getByCurrency 过滤 BTC
 *  3. getByCategory 过滤 defi
 *  4. search 模糊匹配
 *  5. 30 min 缓存命中
 *  6. 缓存过期重新拉取
 *  7. invalidateCache 强制刷新
 *  8. 多订阅者收到事件
 *  9. 翻译（30 个术语正确）
 * 10. 情绪分析（bullish 关键词 → bullish）
 * 11. 情绪分析（bearish 关键词 → bearish）
 * 12. 断网降级到 mock
 * 13. 限流 5 req/min
 * 14. 5xx 重试
 *
 * 运行：npx tsx tests/news-aggregator.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  NewsAggregator,
  Translator,
  SentimentAnalyzer,
  CryptoPanicClient,
  CryptoPanicError,
  NEWS_CACHE_TTL_MS,
  NEWS_RATE_LIMIT_PER_MIN,
  MOCK_NEWS,
  type NewsItem,
} from '../src/lib/news';

// =============================================================================
// 工具：构造 mock fetch
// =============================================================================

type FetchHandler = (url: string, init?: RequestInit) => Response | Promise<Response>;

function mockFetch(handler: FetchHandler, calls: { url: string; init?: RequestInit }[] = []): typeof fetch {
  const fn = (async (input: any, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    calls.push({ url, init });
    return handler(url, init);
  }) as unknown as typeof fetch;
  return fn;
}

function jsonResponse(status: number, body: any): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERR',
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as Response;
}

function makeCryptoPanicPayload(): any {
  return {
    count: 2,
    next: null,
    previous: null,
    results: [
      {
        id: 1001,
        title: 'Bitcoin surges to new ATH amid ETF approval',
        description: 'BTC briefly touched $98k as ETF speculation fuels rally.',
        url: 'https://example.com/1001',
        source: { domain: 'coindesk.com', title: 'CoinDesk' },
        author: 'John',
        image_url: 'https://picsum.photos/seed/1001/600/400',
        published_at: new Date(Date.now() - 1 * 3600_000).toISOString(),
        kind: 'news',
        currencies: [{ code: 'BTC' }],
        votes: { positive: 200, negative: 10, comments: 30 },
        hot: true,
        important: true,
      },
      {
        id: 1002,
        title: 'Ethereum DeFi TVL breaks records as L2 adoption soars',
        description: 'ETH validators see record inflows amid L2 growth.',
        url: 'https://example.com/1002',
        source: { domain: 'theblock.co', title: 'The Block' },
        published_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
        kind: 'news',
        currencies: [{ code: 'ETH' }],
        votes: { positive: 150, negative: 5, comments: 20 },
        hot: true,
        important: false,
      },
    ],
  };
}

// =============================================================================
// 1. getLatest 拉取正常
// =============================================================================

test('getLatest 拉取正常：返回 NewsItem[] 且字段完整', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchImpl = mockFetch((url) => {
    return jsonResponse(200, makeCryptoPanicPayload());
  }, calls);

  const client = new CryptoPanicClient({
    apiKey: 'real-key', // 启用真实模式
    fetchImpl,
    maxRetries: 0,
  });
  const agg = new NewsAggregator({ client, autoTranslate: false });
  const items = await agg.getLatest({ limit: 10 });

  assert.ok(Array.isArray(items));
  assert.equal(items.length, 2);
  assert.equal(items[0].id, 'cp-1001');
  assert.equal(items[0].title, 'Bitcoin surges to new ATH amid ETF approval');
  assert.equal(items[0].currencies[0], 'BTC');
  assert.equal(items[0].source, 'CoinDesk');
  assert.equal(items[0].isHot, true);
  assert.equal(items[0].isImportant, true);
  assert.equal(items[0].sentiment, 'bullish');
  assert.equal(items[0].origin, 'cryptopanic');
  assert.equal(items[0].votes.like, 200);
  assert.equal(calls.length, 1, 'should make exactly 1 request');
});

// =============================================================================
// 2. getByCurrency 过滤 BTC
// =============================================================================

test('getByCurrency 过滤 BTC：只返回与 BTC 关联的新闻', async () => {
  const fetchImpl = mockFetch(() => jsonResponse(200, makeCryptoPanicPayload()));
  const client = new CryptoPanicClient({ apiKey: 'real-key', fetchImpl, maxRetries: 0 });
  const agg = new NewsAggregator({ client, autoTranslate: false });

  const btcItems = await agg.getByCurrency('BTC');
  assert.equal(btcItems.length, 1);
  assert.equal(btcItems[0].currencies[0], 'BTC');
  assert.ok(btcItems[0].title.toLowerCase().includes('bitcoin'));

  const ethItems = await agg.getByCurrency('ETH');
  assert.equal(ethItems.length, 1);
  assert.equal(ethItems[0].currencies[0], 'ETH');
});

// =============================================================================
// 3. getByCategory 过滤 defi
// =============================================================================

test('getByCategory 过滤 defi：只返回 defi 分类的新闻', async () => {
  const fetchImpl = mockFetch(() => jsonResponse(200, makeCryptoPanicPayload()));
  const client = new CryptoPanicClient({ apiKey: 'real-key', fetchImpl, maxRetries: 0 });
  const agg = new NewsAggregator({ client, autoTranslate: false });

  const defi = await agg.getByCategory('defi');
  // 我们的 payload 中 ETH 那条含 "DeFi" 描述，应被归为 defi
  assert.ok(defi.length >= 1);
  for (const item of defi) {
    assert.ok(item.categories.includes('defi'), `item ${item.id} should be in defi`);
  }
});

// =============================================================================
// 4. search 模糊匹配
// =============================================================================

test('search 模糊匹配：标题 / 正文 / 币种 / 来源任意命中', async () => {
  const fetchImpl = mockFetch(() => jsonResponse(200, makeCryptoPanicPayload()));
  const client = new CryptoPanicClient({ apiKey: 'real-key', fetchImpl, maxRetries: 0 });
  const agg = new NewsAggregator({ client, autoTranslate: false });

  // 命中标题
  const r1 = await agg.search('ATH');
  assert.equal(r1.length, 1);
  assert.equal(r1[0].id, 'cp-1001');

  // 命中币种
  const r2 = await agg.search('ETH');
  assert.equal(r2.length, 1);
  assert.equal(r2[0].id, 'cp-1002');

  // 命中来源
  const r3 = await agg.search('CoinDesk');
  assert.equal(r3.length, 1);
  assert.equal(r3[0].source, 'CoinDesk');

  // 无命中
  const r4 = await agg.search('xyz-not-found');
  assert.equal(r4.length, 0);

  // 空查询
  const r5 = await agg.search('');
  assert.equal(r5.length, 0);
});

// =============================================================================
// 5. 30 min 缓存命中
// =============================================================================

test('缓存命中：30 min 内不重复请求 CryptoPanic', async () => {
  let count = 0;
  const fetchImpl = mockFetch(() => {
    count++;
    return jsonResponse(200, makeCryptoPanicPayload());
  });
  const client = new CryptoPanicClient({ apiKey: 'real-key', fetchImpl, maxRetries: 0 });
  const agg = new NewsAggregator({ client, autoTranslate: false, cacheTtlMs: 30 * 60_000 });

  // 第一次拉取
  await agg.getLatest();
  assert.equal(count, 1, 'first call should hit API');

  // 第二次拉取（应该命中缓存）
  await agg.getLatest();
  assert.equal(count, 1, 'second call should hit cache, not API');

  // 第三次：search 不命中 'latest' 缓存，会调一次 getLatestInternal
  await agg.search('Bitcoin');
  // search 内部走 getLatestInternal，但首次会发起一次请求
  // count <= 2（取决于 getLatestInternal 缓存）
  assert.ok(count <= 2, `search should reuse cache as much as possible, got ${count}`);

  // 之后 search 应当命中缓存，不再请求
  const beforeCount = count;
  await agg.search('ETH');
  await agg.search('CoinDesk');
  assert.equal(count, beforeCount, 'subsequent searches should hit cache');
});

// =============================================================================
// 6. 缓存过期重新拉取
// =============================================================================

test('缓存过期重新拉取：TTL=0 时每次都重新请求', async () => {
  let count = 0;
  const fetchImpl = mockFetch(() => {
    count++;
    return jsonResponse(200, makeCryptoPanicPayload());
  });
  const client = new CryptoPanicClient({ apiKey: 'real-key', fetchImpl, maxRetries: 0 });
  const agg = new NewsAggregator({ client, autoTranslate: false, cacheTtlMs: 0 });

  await agg.getLatest();
  await agg.getLatest();
  await agg.getLatest();
  assert.equal(count, 3, 'with TTL=0 every call should hit API');
});

// =============================================================================
// 7. invalidateCache 强制刷新
// =============================================================================

test('invalidateCache 强制刷新：清空后下次拉取重新请求', async () => {
  let count = 0;
  const fetchImpl = mockFetch(() => {
    count++;
    return jsonResponse(200, makeCryptoPanicPayload());
  });
  const client = new CryptoPanicClient({ apiKey: 'real-key', fetchImpl, maxRetries: 0 });
  const agg = new NewsAggregator({ client, autoTranslate: false });

  await agg.getLatest();
  await agg.getLatest();
  assert.equal(count, 1);

  agg.invalidateCache();
  await agg.getLatest();
  assert.equal(count, 2, 'after invalidate, should refetch');
  assert.equal(agg.cacheSize(), 1);
});

// =============================================================================
// 8. 多订阅者收到事件
// =============================================================================

test('多订阅者：onNews 注册多个 handler 都能收到', async () => {
  const fetchImpl = mockFetch(() => jsonResponse(200, makeCryptoPanicPayload()));
  const client = new CryptoPanicClient({ apiKey: 'real-key', fetchImpl, maxRetries: 0 });
  const agg = new NewsAggregator({ client, autoTranslate: false });

  let count1 = 0;
  let count2 = 0;
  let count3 = 0;
  const off1 = agg.onNews(() => count1++);
  agg.onNews(() => count2++);
  agg.onNews(() => count3++);

  await agg.getLatest();

  assert.equal(count1, 1);
  assert.equal(count2, 1);
  assert.equal(count3, 1);
  assert.equal(agg.subscriberCount(), 3);

  // off1 后再拉取，count1 不应增加
  off1();
  await agg.getLatest(); // 命中缓存，可能不会触发 emit
  // 因为缓存命中所以不 emit；我们强制 invalidate
  agg.invalidateCache();
  await agg.getLatest();
  assert.equal(count1, 1, 'after off, h1 should not increase');
  assert.equal(count2, 2);
  assert.equal(count3, 2);
});

// =============================================================================
// 9. 翻译（30 个术语正确）
// =============================================================================

test('Translator：30+ 加密术语中英文翻译正确', async () => {
  const t = new Translator();
  // 每条用例：英文输入 → 期望中文片段
  const cases: Array<[string, string[]]> = [
    ['Bitcoin surges to new ATH amid spot ETF approval', ['比特币', '飙升', '历史新高', '现货']],
    ['Ethereum halving triggers a bull market rally', ['以太坊', '减半', '牛市', '反弹']],
    ['bear market continues amid panic', ['熊市', '恐慌']],
    ['DeFi adoption grows in emerging markets', ['去中心化金融']],
    ['NFT volume rebounds with strong demand', ['非同质化代币']],
    ['stablecoin issuer launches on Tron', ['稳定币', '波场']],
    ['centralized exchange delists altcoins', ['中心化交易所']],
    ['DEX volumes soar as liquidity mining returns', ['去中心化交易所', '大涨', '流动性挖矿']],
    ['regulation tightens across jurisdictions', ['监管']],
    ['SEC charges major exchange with violations', ['美国证券交易委员会', '交易所']],
    ['halving countdown begins for Bitcoin', ['减半', '比特币']],
    ['spot ETF approval sends Bitcoin to new highs', ['现货', 'ETF', '比特币']],
    ['institutional adoption accelerates across DeFi', ['机构采用', '去中心化金融']],
    ['Ethereum staking yields climb to 4.5%', ['以太坊', '质押']],
    ['gas fee drops after Ethereum upgrade', ['燃料费', '以太坊']],
    ['smart contract exploit drains DeFi protocol', ['智能合约', '去中心化金融']],
    ['blockchain network upgrade goes live', ['区块链']],
    ['cross-chain bridge launches between networks', ['跨链', '跨链桥']],
    ['on-chain activity surges as users return', ['链上', '飙升']],
    ['wallet provider hacked, users urged to move funds', ['钱包']],
    ['Bitcoin miner sells large position', ['比特币', '矿工']],
    ['yield farming APY climbs above 30%', ['流动性挖矿']],
    ['liquidity pool drained by attacker', ['流动性池']],
    ['governance vote passes unanimously', ['治理']],
    ['DAO treasury diversified into stablecoins', ['去中心化自治组织', '稳定币']],
    ['whale accumulation noted across exchanges', ['巨鲸']],
    ['EVM compatibility brings new users', ['EVM 虚拟机']],
    ['Layer 2 scaling reduces fees by 90%', ['二层网络']],
    ['crypto market cap soars past 3 trillion', ['市值', '大涨']],
    ['XRP surge signals bullish trend', ['瑞波币', '飙升']],
  ];

  assert.equal(cases.length, 30, 'should test at least 30 terms');

  for (const [en, expectedFragments] of cases) {
    const zh = await t.translate(en, 'zh');
    for (const frag of expectedFragments) {
      assert.ok(zh.includes(frag), `translate("${en}") = "${zh}" should contain "${frag}"`);
    }
  }

  assert.equal(t.getEngineName(), 'mock');
});

test('Translator：反方向中文→英文', async () => {
  const t = new Translator();
  const en = await t.translate('比特币 在 牛市 中 飙升至历史新高', 'en');
  assert.ok(en.includes('Bitcoin'), `should contain Bitcoin, got: ${en}`);
  assert.ok(en.includes('bull market'), `should contain bull market, got: ${en}`);
  assert.ok(en.includes('ATH'), `should contain ATH, got: ${en}`);
  // 同时存在 surge
  assert.ok(en.includes('surge'), `should contain surge, got: ${en}`);
});

test('Translator：setEngine 切换引擎', async () => {
  const t = new Translator();
  assert.equal(t.getEngineName(), 'mock');

  // 自定义引擎
  const customEngine = {
    name: 'custom',
    async translate(text: string) {
      return `[custom] ${text}`;
    },
    async translateBatch(texts: string[]) {
      return texts.map((t) => `[custom] ${t}`);
    },
  };
  t.setEngine(customEngine);
  assert.equal(t.getEngineName(), 'custom');
  const r = await t.translate('hello', 'zh');
  assert.equal(r, '[custom] hello');
});

// =============================================================================
// 10. 情绪分析（bullish 关键词 → bullish）
// =============================================================================

test('SentimentAnalyzer：bullish 关键词 → bullish', () => {
  const a = new SentimentAnalyzer();
  assert.equal(a.analyze('Bitcoin surges to new ATH in bull market'), 'bullish');
  assert.equal(a.analyze('Ethereum soars on institutional adoption'), 'bullish');
  assert.equal(a.analyze('Crypto rally continues with massive inflows'), 'bullish');
  assert.equal(a.analyze('Token breakout confirmed with strong buy signal'), 'bullish');
  assert.equal(a.analyze('ETF approval sends price to moon'), 'bullish');
});

test('SentimentAnalyzer：中文 bullish 关键词 → bullish', () => {
  const a = new SentimentAnalyzer();
  assert.equal(a.analyze('比特币飙升至历史新高，多头行情确立'), 'bullish');
  assert.equal(a.analyze('以太坊暴涨，机构采用加速'), 'bullish');
});

// =============================================================================
// 11. 情绪分析（bearish 关键词 → bearish）
// =============================================================================

test('SentimentAnalyzer：bearish 关键词 → bearish', () => {
  const a = new SentimentAnalyzer();
  assert.equal(a.analyze('Crypto market crashes after regulation'), 'bearish');
  assert.equal(a.analyze('Bitcoin plunges 30% in sudden dump'), 'bearish');
  assert.equal(a.analyze('DeFi protocol suffers massive exploit, tanking TVL'), 'bearish');
  assert.equal(a.analyze('SEC lawsuit triggers bear market sell-off'), 'bearish');
  assert.equal(a.analyze('Exchange files for bankruptcy after hack'), 'bearish');
});

test('SentimentAnalyzer：中文 bearish 关键词 → bearish', () => {
  const a = new SentimentAnalyzer();
  assert.equal(a.analyze('比特币暴跌，监管打压引发熊市'), 'bearish');
  assert.equal(a.analyze('DeFi 项目爆雷，巨鲸砸盘'), 'bearish');
});

test('SentimentAnalyzer：中性文本 → neutral', () => {
  const a = new SentimentAnalyzer();
  assert.equal(a.analyze('Crypto market sees mixed trading today'), 'neutral');
  assert.equal(a.analyze('区块链技术发展'), 'neutral');
  assert.equal(a.analyze(''), 'neutral');
});

// =============================================================================
// 12. 断网降级到 mock
// =============================================================================

test('断网降级：5xx 全部失败时降级到 mock 数据', async () => {
  let count = 0;
  const fetchImpl = mockFetch(() => {
    count++;
    return jsonResponse(503, { error: 'service unavailable' });
  });
  const client = new CryptoPanicClient({
    apiKey: 'real-key',
    fetchImpl,
    maxRetries: 2,
    timeoutMs: 1000,
  });
  const agg = new NewsAggregator({ client, autoTranslate: false });

  // 5xx 触发重试，重试耗尽后降级到 mock
  const items = await agg.getLatest();
  assert.ok(items.length > 0, 'should fall back to mock data');
  assert.ok(items.every((i) => i.origin === 'mock'));
  assert.ok(count >= 2, `should retry at least 2 times, got ${count}`);
});

test('断网降级：mock key 直接返回 mock', async () => {
  const client = new CryptoPanicClient({ apiKey: 'mock-key' });
  assert.equal(client.isMockMode(), true);
  const items = await client.fetchPosts({});
  assert.ok(items.length > 0);
  assert.ok(items.every((i) => i.origin === 'mock'));
});

test('断网降级：fetch 抛错时也降级到 mock', async () => {
  const fetchImpl = (async () => {
    throw new Error('network down');
  }) as unknown as typeof fetch;
  const client = new CryptoPanicClient({
    apiKey: 'real-key',
    fetchImpl,
    maxRetries: 1,
  });
  const items = await client.fetchPosts({});
  assert.ok(items.length > 0);
  assert.ok(items.every((i) => i.origin === 'mock'));
});

// =============================================================================
// 13. 限流 5 req/min
// =============================================================================

test('限流 5 req/min：第 6 次请求抛 RATE_LIMITED', async () => {
  const fetchImpl = mockFetch(() => jsonResponse(200, makeCryptoPanicPayload()));
  const client = new CryptoPanicClient({
    apiKey: 'real-key',
    fetchImpl,
    maxRetries: 0,
    rateLimitPerMin: 5,
  });

  // 5 次都成功
  for (let i = 0; i < 5; i++) {
    await client.fetchPosts({});
  }
  assert.equal(client.currentRequestCount(), 5);

  // 第 6 次应被限流
  await assert.rejects(
    client.fetchPosts({}),
    (err: Error) => {
      assert.ok(err instanceof CryptoPanicError);
      assert.equal((err as CryptoPanicError).code, 'RATE_LIMITED');
      return true;
    },
  );
});

test('限流：resetRateLimit 后恢复', async () => {
  const fetchImpl = mockFetch(() => jsonResponse(200, makeCryptoPanicPayload()));
  const client = new CryptoPanicClient({
    apiKey: 'real-key',
    fetchImpl,
    maxRetries: 0,
    rateLimitPerMin: 2,
  });

  await client.fetchPosts({});
  await client.fetchPosts({});
  await assert.rejects(client.fetchPosts({}), (err: Error) => {
    return (err as CryptoPanicError).code === 'RATE_LIMITED';
  });

  client.resetRateLimit();
  assert.equal(client.currentRequestCount(), 0);
  const items = await client.fetchPosts({});
  assert.ok(items.length > 0);
});

// =============================================================================
// 14. 5xx 重试
// =============================================================================

test('5xx 触发指数退避重试，最终成功', async () => {
  let count = 0;
  const fetchImpl = mockFetch(() => {
    count++;
    if (count < 3) return jsonResponse(500, { error: 'server error' });
    return jsonResponse(200, makeCryptoPanicPayload());
  });
  const client = new CryptoPanicClient({
    apiKey: 'real-key',
    fetchImpl,
    maxRetries: 3,
    timeoutMs: 1000,
  });
  const items = await client.fetchPosts({});
  assert.equal(count, 3, 'should be called 3 times (2 fails + 1 success)');
  assert.equal(items.length, 2);
});

test('5xx 重试耗尽后降级到 mock', async () => {
  const fetchImpl = mockFetch(() => jsonResponse(500, { error: 'down' }));
  const client = new CryptoPanicClient({
    apiKey: 'real-key',
    fetchImpl,
    maxRetries: 2,
  });
  const items = await client.fetchPosts({});
  assert.ok(items.length > 0);
  assert.ok(items.every((i) => i.origin === 'mock'));
});

test('429 限流重试', async () => {
  let count = 0;
  const fetchImpl = mockFetch(() => {
    count++;
    if (count < 2) return jsonResponse(429, { error: 'too many requests' });
    return jsonResponse(200, makeCryptoPanicPayload());
  });
  const client = new CryptoPanicClient({
    apiKey: 'real-key',
    fetchImpl,
    maxRetries: 3,
    rateLimitPerMin: 100, // 关闭客户端限流，让 HTTP 429 走重试
  });
  const items = await client.fetchPosts({});
  assert.equal(count, 2);
  assert.equal(items.length, 2);
});

// =============================================================================
// 额外：NewsAggregator 集成翻译
// =============================================================================

test('NewsAggregator 集成：getLatest 自动生成中文标题', async () => {
  const fetchImpl = mockFetch(() => jsonResponse(200, makeCryptoPanicPayload()));
  const client = new CryptoPanicClient({ apiKey: 'real-key', fetchImpl, maxRetries: 0 });
  const agg = new NewsAggregator({ client, autoTranslate: true });

  const items = await agg.getLatest();
  assert.equal(items.length, 2);
  // 翻译应至少包含一个中文字符
  for (const item of items) {
    assert.ok(item.titleZh && /[一-龥]/.test(item.titleZh), `titleZh should contain Chinese, got: ${item.titleZh}`);
  }
});

// =============================================================================
// 常量校验
// =============================================================================

test('关键常量：30 min TTL + 5 req/min', () => {
  assert.equal(NEWS_CACHE_TTL_MS, 30 * 60_000);
  assert.equal(NEWS_RATE_LIMIT_PER_MIN, 5);
});

test('Mock 数据：覆盖 20+ 条主流币种新闻', () => {
  assert.ok(MOCK_NEWS.length >= 20);
  const symbols = new Set<string>();
  for (const n of MOCK_NEWS) {
    for (const c of n.currencies) symbols.add(c);
  }
  assert.ok(symbols.has('BTC'));
  assert.ok(symbols.has('ETH'));
  assert.ok(symbols.has('SOL'));
  assert.ok(symbols.has('BNB'));
});
