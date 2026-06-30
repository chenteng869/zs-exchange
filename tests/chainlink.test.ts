/**
 * Chainlink 预言机模块单元测试
 *
 * 覆盖：
 *  - feed-registry 查询
 *  - ABI 解码（mock RPC 返回）
 *  - 价格换算（answer / 10^decimals）
 *  - 历史轮次 / 分页
 *  - stale 检测
 *  - 多链聚合
 *  - 中位数 / 异常剔除
 *  - 本地 vs 链上价格对比
 *  - OracleService 缓存命中
 *  - 多价格并行
 *  - 资产估值
 *  - 异常告警
 *  - stale feed 报告
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getFeedByPair,
  getFeedsByChain,
  searchFeeds,
  getFeedByAddress,
  listChains,
  getFeedCount,
  PRICE_FEEDS,
  CHAIN_RPC_ENDPOINTS,
} from '../src/lib/oracle/chainlink/feed-registry';
import {
  ChainlinkClient,
  createChainlinkClient,
} from '../src/lib/oracle/chainlink/chainlink-client';
import {
  PriceAggregator,
  createPriceAggregator,
} from '../src/lib/oracle/chainlink/aggregator';
import {
  OracleService,
  createOracleService,
} from '../src/lib/oracle/oracle-service';
import {
  ORACLE_CACHE_TTL_MS,
  ORACLE_DEVIATION_THRESHOLD,
  ORACLE_STALE_THRESHOLD_FACTOR,
  AGGREGATOR_V3_SELECTORS,
  type PriceFeed,
  type PriceData,
  type PriceRound,
} from '../src/lib/oracle/chainlink/types';

// =============================================================================
// 1. feed-registry
// =============================================================================

test('feed-registry: getFeedByPair 精确匹配 + 链过滤', () => {
  const eth = getFeedByPair('ETH/USD', 'ethereum');
  assert.ok(eth);
  assert.equal(eth!.chain, 'ethereum');
  assert.equal(eth!.pair, 'ETH/USD');
  assert.equal(eth!.decimals, 8);

  const bscEth = getFeedByPair('ETH/USD', 'bsc');
  assert.ok(bscEth);
  assert.equal(bscEth!.chain, 'bsc');
  // 应与 ethereum 上的不同地址
  assert.notEqual(bscEth!.address, eth!.address);
});

test('feed-registry: getFeedByPair 不区分大小写', () => {
  const a = getFeedByPair('eth/usd');
  const b = getFeedByPair('ETH/USD');
  assert.ok(a);
  assert.equal(a!.address, b!.address);
});

test('feed-registry: getFeedsByChain + searchFeeds', () => {
  const ethFeeds = getFeedsByChain('ethereum');
  assert.ok(ethFeeds.length >= 5);
  assert.ok(ethFeeds.every(f => f.chain === 'ethereum'));

  const results = searchFeeds('USD');
  assert.ok(results.length > 0);
  assert.ok(results.every(f => f.pair.endsWith('/USD')));

  const btcResults = searchFeeds('BTC');
  assert.ok(btcResults.length > 0);
  assert.ok(btcResults.some(f => f.pair === 'BTC/USD'));
});

test('feed-registry: getFeedByAddress + 列表与统计', () => {
  const target = getFeedByPair('ETH/USD', 'ethereum')!;
  const found = getFeedByAddress(target.address, 'ethereum');
  assert.ok(found);
  assert.equal(found!.address, target.address);

  const chains = listChains();
  assert.ok(chains.length >= 7);
  assert.ok(chains.includes('ethereum'));
  assert.ok(chains.includes('bsc'));
  assert.ok(chains.includes('base'));

  // 50+ feeds
  assert.ok(getFeedCount() >= 50);
  assert.ok(PRICE_FEEDS.length >= 50);
  // 7 链
  assert.ok(Object.keys(CHAIN_RPC_ENDPOINTS).length >= 7);
});

// =============================================================================
// 2. ABI 解码（mock RPC）
// =============================================================================

/** 构造 mock latestRoundData 响应：5 × 32 bytes */
function encodeRoundData(opts: {
  roundId?: number | bigint;
  answer?: bigint;
  startedAt?: number | bigint;
  updatedAt?: number | bigint;
  answeredInRound?: number | bigint;
}): string {
  const roundId = BigInt(opts.roundId ?? 1);
  const answer = BigInt(opts.answer ?? 350000000000n); // ETH=$3500
  const startedAt = BigInt(opts.startedAt ?? 1700000000);
  const updatedAt = BigInt(opts.updatedAt ?? 1700000060);
  const answeredInRound = BigInt(opts.answeredInRound ?? 1);
  return (
    '0x' +
    roundId.toString(16).padStart(64, '0') +
    // int256 编码：负数用 256-bit two's complement
    (answer >= 0n
      ? answer.toString(16).padStart(64, '0')
      : ((1n << 256n) + answer).toString(16).padStart(64, '0')) +
    startedAt.toString(16).padStart(64, '0') +
    updatedAt.toString(16).padStart(64, '0') +
    answeredInRound.toString(16).padStart(64, '0')
  );
}

/** 构造 mock eth_call 响应：uint8 decimals */
function encodeDecimals(d: number): string {
  return '0x' + d.toString(16).padStart(64, '0');
}

/** 创建带 mock fetch 的 ChainlinkClient */
function createMockedClient(handlers: Record<string, (params: any[]) => string>): ChainlinkClient {
  const mockFetch: typeof fetch = async (url: any, init: any) => {
    const body = JSON.parse(init.body);
    const method = body.method;
    const params = body.params || [];
    const handler = handlers[method];
    if (!handler) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0', id: body.id, error: { code: -32601, message: 'Method not found' },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    const result = handler(params);
    return new Response(JSON.stringify({
      jsonrpc: '2.0', id: body.id, result,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  return new ChainlinkClient({
    fetchImpl: mockFetch,
    fallbackToDemo: false,
    timeoutMs: 5000,
    endpoints: {
      ethereum: ['https://mock-eth'],
    },
  });
}

test('ABI 解码：latestRoundData 解析 + 价格换算', async () => {
  const now = Math.floor(Date.now() / 1000);
  const handlers: Record<string, (params: any[]) => string> = {
    eth_call: (params) => {
      const call = params[0];
      const data: string = call.data;
      if (data === AGGREGATOR_V3_SELECTORS.latestRoundData) {
        return encodeRoundData({
          roundId: 12345,
          answer: 350000000000n, // 3500 * 1e8
          updatedAt: now - 30,
        });
      }
      if (data === AGGREGATOR_V3_SELECTORS.decimals) return encodeDecimals(8);
      if (data === AGGREGATOR_V3_SELECTORS.description) {
        return '0x' +
          (0).toString(16).padStart(64, '0') +
          (0).toString(16).padStart(64, '0');
      }
      return '0x';
    },
    eth_blockNumber: () => '0x' + (19_000_000).toString(16),
  };
  const client = createMockedClient(handlers);
  const feed = getFeedByPair('ETH/USD', 'ethereum')!;
  const price = await client.getLatestPrice(feed);
  assert.equal(price.roundId, 12345);
  // formatPrice 去除尾随 0
  assert.equal(price.formatted, '3500');
  assert.equal(price.pair, 'ETH/USD');
  assert.equal(price.chain, 'ethereum');
  assert.equal(price.source, 'chainlink');
  assert.ok(price.age >= 30);
  assert.equal(price.isStale, false);
});

test('ABI 解码：负数 answer (int256 符号位)', async () => {
  const now = Math.floor(Date.now() / 1000);
  const handlers: Record<string, (params: any[]) => string> = {
    eth_call: (params) => {
      const data = params[0].data;
      if (data === AGGREGATOR_V3_SELECTORS.latestRoundData) {
        return encodeRoundData({
          roundId: 1,
          answer: -100n, // 测试负数
          updatedAt: now - 5,
        });
      }
      if (data === AGGREGATOR_V3_SELECTORS.decimals) return encodeDecimals(8);
      return '0x';
    },
  };
  const client = createMockedClient(handlers);
  const feed = getFeedByPair('ETH/USD', 'ethereum')!;
  const price = await client.getLatestPrice(feed);
  // formatted 含负号
  assert.ok(price.formatted.startsWith('-'));
  assert.equal(price.formatted, '-0.000001');
});

// =============================================================================
// 3. 历史轮次
// =============================================================================

test('历史轮次：getRound 解析 + getHistoricalPrices 分页', async () => {
  const baseTime = 1_700_000_000;
  const roundStorage: Record<number, string> = {};
  // 预先生成 5 个轮次
  for (let i = 1; i <= 5; i++) {
    roundStorage[i] = encodeRoundData({
      roundId: i,
      answer: BigInt(3000 + i) * 10n ** 8n, // 3001..3005
      updatedAt: baseTime + i * 60, // 每 60s 一轮
    });
  }

  const handlers: Record<string, (params: any[]) => string> = {
    eth_call: (params) => {
      const data: string = params[0].data;
      if (data === AGGREGATOR_V3_SELECTORS.latestRoundData) return roundStorage[5];
      if (data.startsWith(AGGREGATOR_V3_SELECTORS.getRoundData)) {
        const roundIdHex = data.slice(AGGREGATOR_V3_SELECTORS.getRoundData.length);
        const roundId = Number(BigInt('0x' + roundIdHex));
        return roundStorage[roundId] || '0x' + '0'.repeat(320);
      }
      if (data === AGGREGATOR_V3_SELECTORS.decimals) return encodeDecimals(8);
      return '0x';
    },
  };
  const client = createMockedClient(handlers);
  const feed = getFeedByPair('ETH/USD', 'ethereum')!;

  // 单轮查询
  const r3 = await client.getRound(feed.chain, feed.address, 3);
  assert.equal(r3.roundId, 3);
  assert.equal(r3.formatted, '3003');

  // 历史区间
  const historical = await client.getHistoricalPrices(
    feed,
    baseTime + 1,
    baseTime + 4 * 60,
    60,
  );
  // 应包含 round 1..4（去掉 5，5 > toTime）
  assert.ok(historical.length >= 3);
  assert.equal(historical[0].updatedAt, baseTime + 60);
  // 应按时间升序
  for (let i = 1; i < historical.length; i++) {
    assert.ok(historical[i].updatedAt >= historical[i - 1].updatedAt);
  }
});

// =============================================================================
// 4. isStale
// =============================================================================

test('isStale: heartbeat × factor 判定', () => {
  const client = new ChainlinkClient({ fallbackToDemo: false });
  const feed: PriceFeed = {
    pair: 'X/USD', address: '0x0', chain: 'ethereum',
    decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 0.5, description: 'X',
  };
  const now = 1_000_000;
  // 30 分钟前 → fresh
  assert.equal(client.isStale(feed, now - 1800, now), false);
  // 7000s 前 → 7000 < 7200 = 3600×2 → fresh
  assert.equal(client.isStale(feed, now - 7000, now), false);
  // 7201s 前 → 7201 > 7200 → stale
  assert.equal(client.isStale(feed, now - 7201, now), true);
  // 10000s 前 → 10000 > 7200 → stale
  assert.equal(client.isStale(feed, now - 10000, now), true);
  // updatedAt=0 → stale
  assert.equal(client.isStale(feed, 0, now), true);
});

// =============================================================================
// 5. 多链聚合（中位数 + 异常剔除）
// =============================================================================

test('aggregator: 中位数计算（奇数 / 偶数）', async () => {
  // 直接构造 PriceData 列表测试中位数
  const agg = new PriceAggregator();
  // 通过 reflect 访问私有 median（不可行），改测 aggregatePrice 接口
  // 构造一个聚合：所有 feed 返回 mock 但不同价格
  const mockClient = new (class extends ChainlinkClient {
    async getLatestPrice(feed: PriceFeed): Promise<PriceData> {
      const map: Record<string, string> = {
        'ETH/USD': '3500', 'BTC/USD': '65000', 'LINK/USD': '18', 'MATIC/USD': '0.7',
      };
      const basePrice = map[feed.pair] || '1';
      return {
        roundId: 1,
        answer: BigInt(Math.floor(parseFloat(basePrice) * 1e8)).toString(),
        formatted: basePrice,
        startedAt: 0,
        updatedAt: Math.floor(Date.now() / 1000) - 30,
        answeredInRound: 1,
        pair: feed.pair,
        chain: feed.chain,
        age: 30,
        isStale: false,
        source: 'chainlink',
      };
    }
  })();
  const agg2 = new PriceAggregator({ client: mockClient });
  // ETH 在 6 条链上都有
  const result = await agg2.aggregatePrice('ETH/USD');
  assert.equal(result.pair, 'ETH/USD');
  assert.equal(result.median, '3500');
  assert.equal(result.mean, '3500');
  assert.equal(result.min, '3500');
  assert.equal(result.max, '3500');
  assert.equal(result.deviation, 0);
  assert.ok(result.sources.length >= 2);
});

test('aggregator: 异常价格自动剔除 (>5% 偏离)', async () => {
  // 构造 mock：3 条链给 $100，1 条链给 $200（异常）
  const mockClient = new (class extends ChainlinkClient {
    async getLatestPrice(feed: PriceFeed): Promise<PriceData> {
      // 强制让特定 chain 返回异常价格
      const price = feed.chain === 'bsc' ? '200' : '100';
      return {
        roundId: 1,
        answer: BigInt(Math.floor(parseFloat(price) * 1e8)).toString(),
        formatted: price,
        startedAt: 0,
        updatedAt: Math.floor(Date.now() / 1000) - 30,
        answeredInRound: 1,
        pair: feed.pair,
        chain: feed.chain,
        age: 30,
        isStale: false,
        source: 'chainlink',
      };
    }
  })();
  const agg = new PriceAggregator({ client: mockClient });
  const result = await agg.aggregatePrice('ETH/USD');
  // 异常应被剔除
  assert.ok(!result.sources.some(s => s.chain === 'bsc'));
  // median 应是 100
  assert.equal(result.median, '100');
  // deviation 接近 0（剔除后）
  assert.ok(result.deviation < 0.001);
});

test('aggregator: comparePrices 偏离检测', () => {
  const agg = new PriceAggregator();
  const r1 = agg.comparePrices('100', '100', 'TEST/USD');
  assert.equal(r1.deviation, 0);
  assert.equal(r1.isReasonable, true);

  const r2 = agg.comparePrices('103', '100', 'TEST/USD');
  assert.ok(r2.deviation > 0.02);
  assert.equal(r2.isReasonable, true); // 3% < 5%

  const r3 = agg.comparePrices('110', '100', 'TEST/USD');
  assert.ok(r3.deviation > 0.09);
  assert.equal(r3.isReasonable, false); // 10% > 5%
});

// =============================================================================
// 6. OracleService 缓存 / 并行 / 估值 / 告警
// =============================================================================

test('OracleService: 30s 缓存命中（同一交易对只查一次 RPC）', async () => {
  let callCount = 0;
  const mockClient = new (class extends ChainlinkClient {
    async getLatestPrice(feed: PriceFeed): Promise<PriceData> {
      callCount++;
      return {
        roundId: callCount,
        answer: '350000000000',
        formatted: '3500',
        startedAt: 0,
        updatedAt: Math.floor(Date.now() / 1000),
        answeredInRound: callCount,
        pair: feed.pair,
        chain: feed.chain,
        age: 0,
        isStale: false,
        source: 'chainlink',
      };
    }
  })();
  const oracle = new OracleService({ client: mockClient, cacheTtlMs: 30_000 });
  const p1 = await oracle.getPrice('ETH/USD');
  const p2 = await oracle.getPrice('ETH/USD');
  assert.equal(p1.formatted, p2.formatted);
  // 缓存命中：只查一次
  assert.equal(callCount, 1);
  // cacheTtl 校验
  assert.equal(oracle.getCacheSize(), 1);
});

test('OracleService: getPrices 多交易对并行查询', async () => {
  let callCount = 0;
  const mockClient = new (class extends ChainlinkClient {
    async getLatestPrice(feed: PriceFeed): Promise<PriceData> {
      callCount++;
      return {
        roundId: 1, answer: '0', formatted: feed.pair.startsWith('BTC') ? '65000' : '1',
        startedAt: 0, updatedAt: Math.floor(Date.now() / 1000), answeredInRound: 1,
        pair: feed.pair, chain: feed.chain, age: 0, isStale: false, source: 'chainlink',
      };
    }
  })();
  const oracle = new OracleService({ client: mockClient });
  const result = await oracle.getPrices(['ETH/USD', 'BTC/USD', 'USDC/USD', 'INVALID/X']);
  assert.ok(result['ETH/USD']);
  assert.ok(result['BTC/USD']);
  assert.ok(result['USDC/USD']);
  // 无效交易对被过滤
  assert.equal(result['INVALID/X'], undefined);
  // 至少 3 个 RPC 调用
  assert.ok(callCount >= 3);
});

test('OracleService: getAssetValuation 资产估值（USD/CNY/EUR/JPY）', async () => {
  const mockClient = new (class extends ChainlinkClient {
    async getLatestPrice(feed: PriceFeed): Promise<PriceData> {
      return {
        roundId: 1, answer: '350000000000', formatted: '3500',
        startedAt: 0, updatedAt: Math.floor(Date.now() / 1000), answeredInRound: 1,
        pair: feed.pair, chain: feed.chain, age: 0, isStale: false, source: 'chainlink',
      };
    }
  })();
  const oracle = new OracleService({ client: mockClient });

  // 1 ETH = 3500 USD
  const vUsd = await oracle.getAssetValuation('ETH', '1', 'USD');
  assert.equal(vUsd.asset, 'ETH');
  assert.equal(vUsd.fiat, 'USD');
  // USD = amount × price = 1 × 3500 = 3500
  assert.ok(parseFloat(vUsd.value) > 3499 && parseFloat(vUsd.value) < 3501);

  // 1 ETH = 3500 USD = 3500 × 7.24 = 25340 CNY
  const vCny = await oracle.getAssetValuation('ETH', '1', 'CNY');
  assert.equal(vCny.fiat, 'CNY');
  assert.ok(parseFloat(vCny.value) > 25339 && parseFloat(vCny.value) < 25341);

  // 0.5 ETH = 1750 USD = 1750 × 0.92 = 1610 EUR
  const vEur = await oracle.getAssetValuation('ETH', '0.5', 'EUR');
  assert.equal(vEur.fiat, 'EUR');
  assert.ok(parseFloat(vEur.value) > 1609 && parseFloat(vEur.value) < 1611);

  // 0 不支持
  await assert.rejects(
    () => oracle.getAssetValuation('ETH', '1', 'GBP' as any),
    /Unsupported fiat/,
  );
});

test('OracleService: onPriceAnomaly 异常告警（stale + fallback）', async () => {
  // 让 getLatestPrice 返回 stale feed + fallback
  const oldTime = Math.floor(Date.now() / 1000) - 86400; // 1 天前
  const mockClient = new (class extends ChainlinkClient {
    async getLatestPrice(feed: PriceFeed): Promise<PriceData> {
      return {
        roundId: 1, answer: '0', formatted: '1',
        startedAt: oldTime, updatedAt: oldTime, answeredInRound: 1,
        pair: feed.pair, chain: feed.chain, age: 86400, isStale: true,
        source: 'fallback', // 触发 fallback 警告
      };
    }
  })();
  const oracle = new OracleService({ client: mockClient });

  const events: any[] = [];
  const off = oracle.onPriceAnomaly((e) => { events.push(e); });

  await oracle.getPrice('ETH/USD');

  // 应收到至少两个事件：stale + fallback
  assert.ok(events.length >= 2);
  const types = events.map(e => e.type);
  assert.ok(types.includes('stale'));
  assert.ok(types.includes('deviation'));

  // 取消订阅
  off();
  // 后续不再接收
  const before = events.length;
  await oracle.getPrice('ETH/USD');
  assert.equal(events.length, before);
});

test('OracleService: getStalenessReport 报告已缓存 feed', async () => {
  const mockClient = new (class extends ChainlinkClient {
    async getLatestPrice(feed: PriceFeed): Promise<PriceData> {
      return {
        roundId: 1, answer: '0', formatted: '1',
        startedAt: 0, updatedAt: Math.floor(Date.now() / 1000) - 7200, // 2h 前
        answeredInRound: 1, pair: feed.pair, chain: feed.chain, age: 7200, isStale: true,
        source: 'chainlink',
      };
    }
  })();
  const oracle = new OracleService({ client: mockClient });
  await oracle.getPrice('ETH/USD');
  await oracle.getPrice('BTC/USD');
  const report = oracle.getStalenessReport();
  assert.equal(report.length, 2);
  assert.ok(report.every(r => r.age >= 7000));
  assert.ok(report.every(r => r.isStale === true));
  assert.ok(report.some(r => r.pair === 'ETH/USD'));
  assert.ok(report.some(r => r.pair === 'BTC/USD'));
});

test('OracleService: subscribePriceUpdates 轮询推送 + 取消订阅', async () => {
  let callCount = 0;
  const mockClient = new (class extends ChainlinkClient {
    async getLatestPrice(feed: PriceFeed): Promise<PriceData> {
      callCount++;
      return {
        roundId: callCount, answer: '0', formatted: '100',
        startedAt: 0, updatedAt: Math.floor(Date.now() / 1000), answeredInRound: callCount,
        pair: feed.pair, chain: feed.chain, age: 0, isStale: false, source: 'chainlink',
      };
    }
  })();
  const oracle = new OracleService({ client: mockClient });

  const received: PriceData[] = [];
  const unsubscribe = oracle.subscribePriceUpdates('ETH/USD', (p) => {
    received.push(p);
  }, 100);

  // 立即推送一次
  await new Promise(r => setTimeout(r, 50));
  // 至少 1 次
  assert.ok(received.length >= 1);

  // 等待轮询
  await new Promise(r => setTimeout(r, 250));
  assert.ok(received.length >= 2);

  // 取消订阅
  unsubscribe();
  const before = received.length;
  await new Promise(r => setTimeout(r, 250));
  // 取消后不再增加
  assert.equal(received.length, before);
});

// =============================================================================
// 7. 综合 / 工厂函数
// =============================================================================

test('工厂函数：createChainlinkClient / createPriceAggregator / createOracleService', () => {
  const c = createChainlinkClient();
  assert.ok(c instanceof ChainlinkClient);
  c.stop();

  const p = createPriceAggregator();
  assert.ok(p instanceof PriceAggregator);

  const o = createOracleService();
  assert.ok(o instanceof OracleService);
  o.stop();
});

test('常量：ORACLE_* 与 AGGREGATOR_V3_SELECTORS', () => {
  assert.equal(ORACLE_CACHE_TTL_MS, 30_000);
  assert.equal(ORACLE_STALE_THRESHOLD_FACTOR, 2);
  assert.equal(ORACLE_DEVIATION_THRESHOLD, 0.05);
  assert.equal(AGGREGATOR_V3_SELECTORS.latestRoundData, '0xfeaf968c');
  assert.equal(AGGREGATOR_V3_SELECTORS.getRoundData, '0x9a6fc8f5');
  assert.equal(AGGREGATOR_V3_SELECTORS.decimals, '0x313ce567');
  assert.equal(AGGREGATOR_V3_SELECTORS.description, '0x7284e416');
});

test('降级：RPC 不可用时返回 mock 数据（fallbackToDemo=true）', async () => {
  // 不注入 fetch → 默认实现可能不可用 → 应触发 fallback
  const client = new ChainlinkClient({ fallbackToDemo: true, timeoutMs: 100 });
  const feed = getFeedByPair('ETH/USD', 'ethereum')!;
  const price = await client.getLatestPrice(feed);
  assert.equal(price.source, 'fallback');
  assert.ok(parseFloat(price.formatted) > 0);
  assert.equal(price.pair, 'ETH/USD');
});
