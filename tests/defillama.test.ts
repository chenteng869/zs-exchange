/**
 * DeFiLlama 模块单元测试 (P1 G-01 / G-02 / G-03)
 *
 * 覆盖：
 *  - TVL 服务：listProtocols / getProtocol / getProtocolTvlHistory / getChainTvl / getTopByTvl / searchProtocols
 *  - DEX 交易量：listDexes / getDex / getDexVolume24h / getTopByVolume / getChainDexVolume
 *  - 稳定币：listStablecoins / getStablecoin / getStablecoinCirculatingHistory / getTopByCirculating / getPegHealth
 *  - 客户端：限流、重试、5xx、超时、断网降级
 *  - 缓存：TTL 命中
 *
 * 使用 mock fetch + 内存 fixture，不依赖外网。
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  DeFiLlamaClient,
  DefiLlamaError,
  RateLimiter,
  createDefiLlamaClient,
  DEFILLAMA_API_BASE,
  DEFILLAMA_COINS_BASE,
  DEFILLAMA_RATE_LIMIT_PER_SEC,
} from '../src/lib/defi/defillama-client';
import {
  TvlService,
  defaultMockTvlProvider,
  TVL_CACHE_TTL_MS,
  type Protocol,
} from '../src/lib/defi/tvl-service';
import {
  DexVolumeService,
  defaultMockDexProvider,
  DEX_VOLUME_CACHE_TTL_MS,
  type Dex,
} from '../src/lib/defi/dex-volume-service';
import {
  StablecoinService,
  defaultMockStablecoinProvider,
  STABLE_CACHE_TTL_MS,
  PEG_HEALTH_WARNING_THRESHOLD,
  PEG_HEALTH_CRITICAL_THRESHOLD,
  type Stablecoin,
} from '../src/lib/defi/stablecoin-service';

// =============================================================================
// Fixtures
// =============================================================================

const HERE = dirname(fileURLToPath(import.meta.url));
const FIX = (name: string) => JSON.parse(readFileSync(join(HERE, 'fixtures', 'defillama', name), 'utf-8'));

const PROTOCOLS_FIXTURE = () => FIX('protocols.json').data;
const PROTOCOL_LIDO_FIXTURE = () => FIX('protocol-lido.json');
const CHAINS_FIXTURE = () => FIX('chains.json').data;
const DEXES_FIXTURE = () => FIX('dexes.json');
const DEX_UNISWAP_V3_FIXTURE = () => FIX('dex-uniswap-v3.json');
const STABLECOINS_FIXTURE = () => FIX('stablecoins.json').peggedAssets;
const STABLECOIN_USDT_FIXTURE = () => FIX('stablecoin-usdt.json');

// =============================================================================
// Mock fetch 工具
// =============================================================================

type MockHandler = (url: string) => { status?: number; body?: any; delay?: number; contentType?: string };

function createMockFetch(handler: MockHandler | Map<string | RegExp, MockHandler>): typeof fetch {
  const map = handler instanceof Map ? handler : null;
  return (async (url: any, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url.toString();
    let h: MockHandler | undefined;
    if (map) {
      for (const [key, val] of map.entries()) {
        if (typeof key === 'string' ? u.startsWith(key) : (key as RegExp).test(u)) {
          h = val;
          break;
        }
      }
    } else {
      h = handler as MockHandler;
    }
    if (!h) {
      return { ok: false, status: 404, statusText: 'Not Found', text: async () => 'not found', json: async () => ({}), headers: { get: () => '' } } as any;
    }
    const result = h(u);
    if (result.delay) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, result.delay);
        if (init?.signal) {
          init.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            const err = new Error('Aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }
      });
    }
    return {
      ok: result.status === undefined || (result.status >= 200 && result.status < 300),
      status: result.status || 200,
      statusText: 'OK',
      text: async () => typeof result.body === 'string' ? result.body : JSON.stringify(result.body),
      json: async () => result.body,
      headers: { get: (k: string) => k.toLowerCase() === 'content-type' ? (result.contentType || 'application/json') : '' },
    } as any;
  }) as unknown as typeof fetch;
}

/** 路由式 mock：根据 path 解析返回不同的 fixture */
function createRoutedFetch(routes: Record<string, () => any>, opts: { failPaths?: RegExp[]; status500Paths?: RegExp[] } = {}): typeof fetch {
  return createMockFetch((url) => {
    for (const re of opts.failPaths || []) {
      if (re.test(url)) throw new Error('ECONNREFUSED');
    }
    for (const re of opts.status500Paths || []) {
      if (re.test(url)) return { status: 500, body: 'server error' };
    }
    for (const [path, getter] of Object.entries(routes)) {
      if (url.includes(path)) return { status: 200, body: getter() };
    }
    return { status: 404, body: 'not found' };
  });
}

// =============================================================================
// 1. DeFiLlamaClient 基础
// =============================================================================

test('DeFiLlamaClient: 默认端点使用 llama.fi', () => {
  const client = new DeFiLlamaClient();
  const ep = client.getSortedEndpoints();
  assert.equal(ep[0], DEFILLAMA_API_BASE);
  assert.ok(ep.length >= 1);
});

test('DeFiLlamaClient: probe 成功路径', async () => {
  const fetchImpl = createRoutedFetch({
    '/protocols': () => PROTOCOLS_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const r = await client.probe();
  assert.equal(r.reachable, true);
  assert.ok(r.latencyMs >= 0);
});

test('DeFiLlamaClient: HTTP_4xx 立即抛出（不重试）', async () => {
  let calls = 0;
  const fetchImpl = createMockFetch(() => {
    calls++;
    return { status: 404, body: 'not found' };
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0, maxRetries: 5 });
  await assert.rejects(
    () => client.get('/protocols', {}, { retries: 5 }),
    (err: unknown) => err instanceof DefiLlamaError && (err as DefiLlamaError).code === 'HTTP_404',
  );
  // 4xx 只调用 1 次（不重试）
  assert.equal(calls, 1);
});

test('DeFiLlamaClient: HTTP_5xx 触发重试', async () => {
  let calls = 0;
  const fetchImpl = createMockFetch(() => {
    calls++;
    if (calls < 3) return { status: 500, body: 'server error' };
    return { status: 200, body: PROTOCOLS_FIXTURE() };
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0, maxRetries: 3, initialBackoffMs: 10, maxBackoffMs: 30 });
  const result = await client.get<any[]>('/protocols');
  assert.ok(Array.isArray(result));
  assert.equal(calls, 3);
});

test('DeFiLlamaClient: TIMEOUT 抛出', async () => {
  const fetchImpl = createMockFetch(() => ({ delay: 5000 })); // 5s
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0, timeoutMs: 50, maxRetries: 1, endpoints: ['https://primary.test', 'https://backup.test'] });
  await assert.rejects(
    () => client.get('/protocols', {}, { retries: 1 }),
    (err: unknown) => {
      if (!(err instanceof DefiLlamaError)) return false;
      // 可能是 TIMEOUT（备份节点也超时）或 ALL_ENDPOINTS_FAILED（所有节点都失败）
      return err.code === 'TIMEOUT' || err.code === 'ALL_ENDPOINTS_FAILED';
    },
  );
});

test('RateLimiter: 5 req/s 触发降速', async () => {
  const limiter = new RateLimiter(5);
  const t0 = Date.now();
  // 连发 6 个：前 5 个立即通过，第 6 个需等待
  for (let i = 0; i < 5; i++) await limiter.acquire();
  const usedAfter5 = limiter.used();
  assert.equal(usedAfter5, 5);
  await limiter.acquire(); // 第 6 个需等待
  const t1 = Date.now();
  // 至少应等待接近 1000ms（窗口滑出）
  assert.ok(t1 - t0 >= 800, `expected wait >= 800ms, got ${t1 - t0}ms`);
});

test('RateLimiter: 0 = 不限流', async () => {
  const limiter = new RateLimiter(0);
  for (let i = 0; i < 20; i++) await limiter.acquire();
  assert.equal(limiter.used(), 0);
});

// =============================================================================
// 2. G-01 TVL 服务
// =============================================================================

test('G-01 listProtocols: 解析 fixture 正确', async () => {
  const fetchImpl = createRoutedFetch({
    '/protocols': () => PROTOCOLS_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new TvlService({ client });
  const list = await svc.listProtocols();
  assert.equal(list.length, 5);
  const lido = list.find((p) => p.slug === 'lido');
  assert.ok(lido);
  assert.equal(lido!.name, 'Lido');
  assert.equal(lido!.category, 'Liquid Staking');
  assert.equal(lido!.tvl, 32_450_000_000);
  assert.equal(lido!.change_1d, 0.5);
  assert.ok(lido!.chain.includes('Ethereum'));
});

test('G-01 getProtocol: 按 slug 解析', async () => {
  const fetchImpl = createRoutedFetch({
    '/protocol/lido': () => PROTOCOL_LIDO_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new TvlService({ client });
  const p = await svc.getProtocol('lido');
  assert.ok(p);
  assert.equal(p!.slug, 'lido');
  assert.equal(p!.currentChainTvls['Ethereum'], 31_800_000_000);
  assert.ok(p!.tvlHistory.length >= 5);
  assert.ok(p!.tvlHistory.every((h) => h.tvl > 0 && h.date > 0));
});

test('G-01 getProtocolTvlHistory: 解析时间序列', async () => {
  const fetchImpl = createRoutedFetch({
    '/protocol/lido': () => PROTOCOL_LIDO_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new TvlService({ client });
  const hist = await svc.getProtocolTvlHistory('lido');
  assert.ok(hist.length >= 5);
  // 时间戳应为毫秒（> 1e12）
  assert.ok(hist[0].date > 1_000_000_000_000);
  // TVL 应单调递增或平稳
  for (let i = 1; i < hist.length; i++) {
    assert.ok(hist[i].date > hist[i - 1].date, 'date should be ascending');
  }
});

test('G-01 getChainTvl: 解析链 TVL', async () => {
  const fetchImpl = createRoutedFetch({
    '/v2/chains': () => CHAINS_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new TvlService({ client });
  const eth = await svc.getChainTvl('Ethereum');
  assert.ok(eth);
  assert.equal(eth!.tokenSymbol, 'ETH');
  assert.equal(eth!.tvl, 65_400_000_000);
});

test('G-01 getTopByTvl: 排序正确', async () => {
  const fetchImpl = createRoutedFetch({
    '/protocols': () => PROTOCOLS_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new TvlService({ client });
  const top = await svc.getTopByTvl(3);
  assert.equal(top.length, 3);
  // 第一名 Lido（32.45B），第二 Aave（12.35B），第三 Uniswap（6.8B）
  assert.equal(top[0].slug, 'lido');
  assert.equal(top[1].slug, 'aave');
  assert.equal(top[2].slug, 'uniswap');
  // TVL 单调递减
  for (let i = 1; i < top.length; i++) {
    assert.ok(top[i - 1].tvl >= top[i].tvl);
  }
});

test('G-01 searchProtocols: 模糊匹配', async () => {
  const fetchImpl = createRoutedFetch({
    '/protocols': () => PROTOCOLS_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new TvlService({ client });
  const found = await svc.searchProtocols('eth');
  assert.ok(found.length >= 1);
  // 至少能匹配 Lido / Aave / Uniswap 任一
  const slugs = found.map((p) => p.slug);
  assert.ok(slugs.includes('lido') || slugs.includes('aave') || slugs.includes('uniswap'));
});

test('G-01 getGlobalTvl: 求和 + 加权变化', async () => {
  const fetchImpl = createRoutedFetch({
    '/v2/chains': () => CHAINS_FIXTURE(),
    '/protocols': () => PROTOCOLS_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new TvlService({ client });
  const g = await svc.getGlobalTvl();
  // 总和 = 65.4B + 3.12B + 1.85B + 1.4B + 0.92B + 0.75B + 2.65B = 76.09B
  assert.ok(g.total > 75_000_000_000 && g.total < 78_000_000_000, `unexpected total: ${g.total}`);
  assert.ok(g.change_1d > 0, 'weighted change_1d should be positive');
});

test('G-01 缓存命中: 同一方法第二次调用 fetch 计数不增加', async () => {
  let calls = 0;
  const fetchImpl = createMockFetch(() => {
    calls++;
    return { status: 200, body: PROTOCOLS_FIXTURE() };
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new TvlService({ client, cacheTtlMs: 60_000 });
  const a = await svc.listProtocols();
  const b = await svc.listProtocols();
  assert.equal(a.length, b.length);
  assert.equal(calls, 1, 'should hit cache on 2nd call');
});

test('G-01 TTL=0: 关闭缓存', async () => {
  let calls = 0;
  const fetchImpl = createMockFetch(() => {
    calls++;
    return { status: 200, body: PROTOCOLS_FIXTURE() };
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new TvlService({ client, cacheTtlMs: 0 });
  await svc.listProtocols();
  await svc.listProtocols();
  assert.equal(calls, 2, 'cache disabled should refetch');
});

// =============================================================================
// 3. G-02 DEX 交易量服务
// =============================================================================

test('G-02 listDexes: 解析 fixture', async () => {
  const fetchImpl = createRoutedFetch({
    '/overview/dexs': () => DEXES_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new DexVolumeService({ client });
  const list = await svc.listDexes();
  assert.ok(list.length >= 5);
  const uni = list.find((d) => d.slug === 'uniswap-v3');
  assert.ok(uni);
  assert.equal(uni!.total24h, 1_280_000_000);
  assert.equal(uni!.category, 'Dexes');
  assert.equal(uni!.primaryChain, 'Ethereum');
  assert.ok(uni!.chains.includes('Arbitrum'));
});

test('G-02 getDex: 单个 DEX 详情 + 历史', async () => {
  const fetchImpl = createRoutedFetch({
    '/overview/dexs/uniswap-v3': () => DEX_UNISWAP_V3_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new DexVolumeService({ client });
  const d = await svc.getDex('uniswap-v3');
  assert.ok(d);
  assert.equal(d!.slug, 'uniswap-v3');
  assert.equal(d!.total24h, 1_280_000_000);
  assert.ok(d!.volumeHistory.length >= 5);
  assert.equal(d!.methodology, DEX_UNISWAP_V3_FIXTURE().methodology);
});

test('G-02 getDexVolume24h: 无 slug 时返回全局求和', async () => {
  const fetchImpl = createRoutedFetch({
    '/overview/dexs': () => DEXES_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new DexVolumeService({ client });
  const r = await svc.getDexVolume24h();
  assert.ok(r.total24h > 4_000_000_000, `unexpected total: ${r.total24h}`);
  assert.ok(r.breakdown.length >= 5);
});

test('G-02 getDexVolume24h: 指定 slug', async () => {
  const fetchImpl = createRoutedFetch({
    '/overview/dexs/uniswap-v3': () => DEX_UNISWAP_V3_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new DexVolumeService({ client });
  const r = await svc.getDexVolume24h('uniswap-v3');
  assert.equal(r.total24h, 1_280_000_000);
  assert.equal(r.breakdown.length, 1);
});

test('G-02 getTopByVolume: 排序正确', async () => {
  const fetchImpl = createRoutedFetch({
    '/overview/dexs': () => DEXES_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new DexVolumeService({ client });
  const top = await svc.getTopByVolume(3);
  assert.equal(top.length, 3);
  // Uniswap (1.28B) > Hyperliquid (1.12B) > PancakeSwap (0.85B)
  assert.equal(top[0].slug, 'uniswap-v3');
  assert.ok(top[0].total24h >= top[1].total24h);
  assert.ok(top[1].total24h >= top[2].total24h);
});

test('G-02 getTopByVolume: 按链过滤', async () => {
  const fetchImpl = createRoutedFetch({
    '/overview/dexs': () => DEXES_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new DexVolumeService({ client });
  const eth = await svc.getTopByVolume(10, 'Ethereum');
  assert.ok(eth.every((d) => d.chains.includes('Ethereum') || d.primaryChain === 'Ethereum'));
});

test('G-02 getChainDexVolume: 链聚合', async () => {
  const fetchImpl = createRoutedFetch({
    '/overview/dexs': () => DEXES_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new DexVolumeService({ client });
  const v = await svc.getChainDexVolume('Ethereum');
  assert.equal(v.chain, 'Ethereum');
  assert.ok(v.total24h > 1_000_000_000);
});

// =============================================================================
// 4. G-03 稳定币服务
// =============================================================================

test('G-03 listStablecoins: 解析 fixture', async () => {
  const fetchImpl = createRoutedFetch({
    '/stablecoins': () => STABLECOINS_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new StablecoinService({ client });
  const list = await svc.listStablecoins();
  assert.ok(list.length >= 5);
  const usdt = list.find((s) => s.symbol === 'USDT');
  assert.ok(usdt);
  assert.equal(usdt!.id, '1');
  assert.equal(usdt!.pegType, 'USD');
  assert.equal(usdt!.circulating, 118_500_000_000);
  assert.equal(usdt!.price, 0.9998);
  assert.ok(usdt!.pegDeviation >= 0);
});

test('G-03 getStablecoin: 单个详情 + 链分布', async () => {
  const fetchImpl = createRoutedFetch({
    '/stablecoin/1': () => STABLECOIN_USDT_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new StablecoinService({ client });
  const s = await svc.getStablecoin('1');
  assert.ok(s);
  assert.equal(s!.symbol, 'USDT');
  assert.equal(s!.currentChainBalances['Ethereum'], 65_000_000_000);
  assert.equal(s!.currentChainBalances['Tron'], 28_000_000_000);
  // total 字段应被排除
  assert.equal(s!.currentChainBalances['total'], undefined);
  assert.ok(s!.circulatingPools.length >= 2);
  assert.ok(s!.history.length >= 5);
});

test('G-03 getStablecoinCirculatingHistory: 解析历史', async () => {
  const fetchImpl = createRoutedFetch({
    '/stablecoin/1': () => STABLECOIN_USDT_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new StablecoinService({ client });
  const hist = await svc.getStablecoinCirculatingHistory('1', 4);
  assert.equal(hist.length, 4);
  // 日期单调递增
  for (let i = 1; i < hist.length; i++) {
    assert.ok(hist[i].date > hist[i - 1].date);
  }
  // 流通量都 > 0
  assert.ok(hist.every((h) => h.circulating > 0));
});

test('G-03 getTopByCirculating: 排序正确', async () => {
  const fetchImpl = createRoutedFetch({
    '/stablecoins': () => STABLECOINS_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new StablecoinService({ client });
  const top = await svc.getTopByCirculating(3);
  assert.equal(top.length, 3);
  // USDT (118.5B) > USDC (35.4B) > WBTC (8.5B)
  assert.equal(top[0].symbol, 'USDT');
  assert.equal(top[1].symbol, 'USDC');
  // 单调递减
  for (let i = 1; i < top.length; i++) {
    assert.ok(top[i - 1].circulating >= top[i].circulating);
  }
});

test('G-03 getTopByCirculating: pegType 过滤', async () => {
  const fetchImpl = createRoutedFetch({
    '/stablecoins': () => STABLECOINS_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new StablecoinService({ client });
  const eur = await svc.getTopByCirculating(10, 'EUR');
  assert.ok(eur.length >= 1);
  assert.ok(eur.every((s) => s.pegType === 'EUR'));
});

test('G-03 getPegHealth: 阈值正确 (healthy / warning / critical)', async () => {
  const fetchImpl = createRoutedFetch({
    '/stablecoins': () => STABLECOINS_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new StablecoinService({ client });
  const health = await svc.getPegHealth();
  // USDT 偏离 0.0002 < 0.005 → healthy
  const usdt = health.find((h) => h.symbol === 'USDT');
  assert.ok(usdt);
  assert.equal(usdt!.health, 'healthy');
  // USDD 偏离 0.0130 > 0.01 → critical
  const usdd = health.find((h) => h.symbol === 'USDD');
  assert.ok(usdd);
  assert.equal(usdd!.health, 'critical');
  // FDUSD 偏离 0.0015 < 0.005 → healthy
  const fdusd = health.find((h) => h.symbol === 'FDUSD');
  assert.ok(fdusd);
  assert.equal(fdusd!.health, 'healthy');
  // 自定义阈值
  const svc2 = new StablecoinService({
    client,
    pegHealthWarningThreshold: 0.001,
    pegHealthCriticalThreshold: 0.002,
  });
  const health2 = await svc2.getPegHealth();
  // 同样 USDT 偏离 0.0002 < 0.001 → healthy
  // USDe 偏离 0.001 >= 0.001 → warning
  const usde2 = health2.find((h) => h.symbol === 'USDe');
  assert.ok(usde2);
  assert.equal(usde2!.health, 'warning');
});

test('G-03 getTotalStablecoinMarketCap: 求和 + updatedAt', async () => {
  const fetchImpl = createRoutedFetch({
    '/stablecoins': () => STABLECOINS_FIXTURE(),
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0 });
  const svc = new StablecoinService({ client });
  const r = await svc.getTotalStablecoinMarketCap();
  assert.ok(r.total > 0);
  assert.ok(r.updatedAt > 0);
});

// =============================================================================
// 5. 降级 & 限流集成
// =============================================================================

test('断网降级: TvlService 在网络错误时返回 mock', async () => {
  const fetchImpl = createMockFetch(() => {
    throw new Error('ECONNREFUSED');
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0, maxRetries: 1, initialBackoffMs: 1 });
  const svc = new TvlService({ client });
  const list = await svc.listProtocols();
  assert.ok(list.length > 0, 'fallback should return non-empty mock');
  // 验证 mock 数据合理（非全 0 / NaN）
  assert.ok(list.every((p) => p.tvl > 0 && Number.isFinite(p.tvl)));
});

test('断网降级: DexVolumeService 在网络错误时返回 mock', async () => {
  const fetchImpl = createMockFetch(() => {
    throw new Error('ECONNREFUSED');
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0, maxRetries: 1, initialBackoffMs: 1 });
  const svc = new DexVolumeService({ client });
  const list = await svc.listDexes();
  assert.ok(list.length > 0);
  assert.ok(list.every((d) => d.total24h > 0));
});

test('断网降级: StablecoinService 在网络错误时返回 mock', async () => {
  const fetchImpl = createMockFetch(() => {
    throw new Error('ECONNREFUSED');
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0, maxRetries: 1, initialBackoffMs: 1 });
  const svc = new StablecoinService({ client });
  const list = await svc.listStablecoins();
  assert.ok(list.length > 0);
  assert.ok(list.every((s) => s.circulating > 0));
});

test('断网降级: 关闭 fallback 时返回空', async () => {
  const fetchImpl = createMockFetch(() => {
    throw new Error('ECONNREFUSED');
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 0, maxRetries: 1, initialBackoffMs: 1, enableFallback: false });
  const svc = new TvlService({ client });
  const list = await svc.listProtocols();
  assert.deepEqual(list, []);
});

test('限流集成: 6 个并发请求触发降速', async () => {
  let calls = 0;
  const fetchImpl = createMockFetch(() => {
    calls++;
    return { status: 200, body: PROTOCOLS_FIXTURE() };
  });
  const client = new DeFiLlamaClient({ fetchImpl, rateLimitPerSec: 5, maxRetries: 1, initialBackoffMs: 1 });
  const t0 = Date.now();
  // 6 个并发请求
  const results = await Promise.all([
    client.get('/protocols', {}, { retries: 1 }),
    client.get('/protocols', {}, { retries: 1 }),
    client.get('/protocols', {}, { retries: 1 }),
    client.get('/protocols', {}, { retries: 1 }),
    client.get('/protocols', {}, { retries: 1 }),
    client.get('/protocols', {}, { retries: 1 }),
  ]);
  const t1 = Date.now();
  assert.equal(results.length, 6);
  assert.ok(results.every((r) => Array.isArray(r)));
  // 至少有一个请求被推迟（总耗时 > 300ms）
  assert.ok(t1 - t0 >= 300, `expected concurrent rate-limited calls to take >= 300ms, got ${t1 - t0}ms`);
});

test('限流集成: 启用 DEFILLAMA_RATE_LIMIT_PER_SEC 常量 = 5', () => {
  assert.equal(DEFILLAMA_RATE_LIMIT_PER_SEC, 5);
});

// =============================================================================
// 6. 默认 mock 提供器独立可用
// =============================================================================

test('默认 mock: TvlService mock 数据合理', () => {
  const mock = defaultMockTvlProvider();
  assert.ok(mock.protocols.length > 0);
  assert.ok(mock.chainTvls.length > 0);
  assert.ok(mock.globalTvl.total > 0);
  assert.ok(mock.protocols.every((p) => p.tvl > 0 && Number.isFinite(p.tvl) && p.change_1d !== undefined));
});

test('默认 mock: DexVolumeService mock 数据合理', () => {
  const mock = defaultMockDexProvider();
  assert.ok(mock.dexes.length > 0);
  assert.ok(mock.chainVolumes.length > 0);
  assert.ok(mock.globalVolume.total24h > 0);
  assert.ok(mock.dexes.every((d) => d.total24h > 0));
});

test('默认 mock: StablecoinService mock 数据合理', () => {
  const mock = defaultMockStablecoinProvider();
  assert.ok(mock.stablecoins.length > 0);
  assert.ok(mock.totalMarketCap.total > 0);
  assert.ok(mock.stablecoins.every((s) => s.circulating > 0 && s.symbol.length > 0));
});

// =============================================================================
// 7. 模块导出 & 常量
// =============================================================================

test('模块导出: 关键常量', () => {
  assert.equal(typeof TVL_CACHE_TTL_MS, 'number');
  assert.equal(typeof DEX_VOLUME_CACHE_TTL_MS, 'number');
  assert.equal(typeof STABLE_CACHE_TTL_MS, 'number');
  assert.equal(typeof PEG_HEALTH_WARNING_THRESHOLD, 'number');
  assert.equal(typeof PEG_HEALTH_CRITICAL_THRESHOLD, 'number');
  // 阈值关系正确
  assert.ok(PEG_HEALTH_CRITICAL_THRESHOLD > PEG_HEALTH_WARNING_THRESHOLD);
});

test('模块导出: 工厂函数 createDefiLlamaClient', () => {
  const client = createDefiLlamaClient();
  assert.ok(client instanceof DeFiLlamaClient);
});

test('DefiLlamaError: 错误字段正确', () => {
  const err = new DefiLlamaError('HTTP_500', 'fail', { status: 500, endpoint: 'https://x' });
  assert.equal(err.code, 'HTTP_500');
  assert.equal(err.status, 500);
  assert.equal(err.endpoint, 'https://x');
  assert.equal(err.name, 'DefiLlamaError');
});

test('TVL 缓存 TTL = 5 min', () => {
  assert.equal(TVL_CACHE_TTL_MS, 5 * 60_000);
});

test('DEX 缓存 TTL = 1 min', () => {
  assert.equal(DEX_VOLUME_CACHE_TTL_MS, 60_000);
});

test('Stable 缓存 TTL = 5 min', () => {
  assert.equal(STABLE_CACHE_TTL_MS, 5 * 60_000);
});
