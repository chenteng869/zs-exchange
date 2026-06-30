/**
 * Nansen 链上情报模块单元测试 (P3-1)
 *
 * 覆盖：
 *  - NansenClient: getAddress / getAddressLabels / getSmartMoneySignals /
 *                  getTokenGodMode / getSmartMoneyHoldings / getLargeTransfers /
 *                  5xx 重试 / mock 降级
 *  - SignalEngine: 订阅 / 过滤 / groupByToken / calculateConviction
 *  - AlertManager: addRule / evaluateSignal / sendAlert (mock channels) / 历史
 *  - WalletProfiler: profile / getTopWallets / follow / unfollow
 *
 * 使用 mock fetch + 内置 demo 降级，不依赖外网。
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  NansenClient,
  NansenError,
  SignalEngine,
  AlertManager,
  WalletProfiler,
  InMemoryFollowStore,
  isMockMode,
  NANSEN_API_BASE,
  NANSEN_WHALE_THRESHOLD_USD,
  NANSEN_SUPPORTED_CHAINS,
  type SmartMoneySignal,
  type NansenAddress,
} from '../src/lib/nansen';

// =============================================================================
// Mock fetch 工具
// =============================================================================

type MockHandler = (url: string, init?: RequestInit) => {
  status?: number;
  body?: any;
  delay?: number;
  contentType?: string;
};

function createMockFetch(handler: MockHandler): typeof fetch {
  return (async (url: any, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url.toString();
    const r = handler(u, init);
    if (r.delay) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, r.delay);
        if (init?.signal) {
          init.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            const err = new Error('Aborted');
            err.name = 'AbortError';
          });
        }
      });
    }
    return {
      ok: r.status === undefined || (r.status >= 200 && r.status < 300),
      status: r.status || 200,
      statusText: r.status ? `HTTP ${r.status}` : 'OK',
      text: async () => (typeof r.body === 'string' ? r.body : JSON.stringify(r.body ?? {})),
      json: async () => r.body ?? {},
      headers: {
        get: (k: string) => (k.toLowerCase() === 'content-type' ? (r.contentType || 'application/json') : ''),
      },
    } as any;
  }) as unknown as typeof fetch;
}

/** 通用路由 mock：按 path 前缀返回 */
function createRoutedFetch(
  routes: Record<string, () => any>,
  opts: { failPaths?: RegExp[]; status500Paths?: RegExp[] } = {},
): typeof fetch {
  return createMockFetch((url) => {
    for (const re of opts.failPaths || []) if (re.test(url)) throw new Error('ECONNREFUSED');
    for (const re of opts.status500Paths || []) if (re.test(url)) return { status: 500, body: 'server error' };
    for (const [path, getter] of Object.entries(routes)) {
      if (url.includes(path)) return { status: 200, body: getter() };
    }
    return { status: 404, body: 'not found' };
  });
}

// =============================================================================
// 1. NansenClient 基础
// =============================================================================

test('NansenClient: 默认 baseUrl 与 mock 模式', () => {
  const c = new NansenClient();
  assert.equal(c.isMock(), true);
  // mock 模式：应无 apiKey
  assert.equal(isMockMode(''), true);
  assert.equal(isMockMode('real-key'), false);
  assert.equal(isMockMode('mock-key-123'), true);
});

test('NansenClient: getAddress (mock 模式返回稳定数据)', async () => {
  const c = new NansenClient();
  const a = await c.getAddress('0x1111111111111111111111111111111111111111', 'ethereum');
  assert.ok(a);
  assert.equal(a.chain, 'ethereum');
  assert.equal(a.address.toLowerCase(), '0x1111111111111111111111111111111111111111');
  assert.ok(Array.isArray(a.labels));
  assert.equal(typeof a.totalBalanceUsd, 'string');
  assert.equal(typeof a.txCount, 'number');
  assert.equal(typeof a.riskScore, 'number');
});

test('NansenClient: getAddress 不支持的链抛错', async () => {
  const c = new NansenClient();
  await assert.rejects(
    () => c.getAddress('0x1111111111111111111111111111111111111111', 'unknown-chain' as any),
    (err: unknown) => err instanceof NansenError && err.code === 'UNSUPPORTED_CHAIN',
  );
});

test('NansenClient: getAddressLabels 批量 (mock)', async () => {
  const c = new NansenClient();
  const result = await c.getAddressLabels(
    [
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
      '0x3333333333333333333333333333333333333333',
    ],
    'ethereum',
  );
  assert.equal(Object.keys(result).length, 3);
  for (const labels of Object.values(result)) {
    assert.ok(Array.isArray(labels));
  }
});

test('NansenClient: getSmartMoneySignals (mock)', async () => {
  const c = new NansenClient();
  const signals = await c.getSmartMoneySignals({ chain: 'ethereum', limit: 5 });
  assert.equal(signals.length, 5);
  for (const s of signals) {
    assert.equal(s.chain, 'ethereum');
    assert.ok(s.signalType);
    assert.ok(s.token.symbol);
    assert.equal(typeof s.amountUsd, 'string');
    assert.equal(typeof s.confidence, 'number');
  }
});

test('NansenClient: getTokenGodMode (mock)', async () => {
  const c = new NansenClient();
  const god = await c.getTokenGodMode('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'ethereum');
  assert.ok(god);
  assert.equal(god.chain, 'ethereum');
  assert.ok(god.totalSmartMoneyValue);
  assert.ok(Array.isArray(god.topHolders));
  assert.equal(typeof god.concentration, 'number');
  assert.ok(god.bySource);
});

test('NansenClient: getSmartMoneyHoldings (mock)', async () => {
  const c = new NansenClient();
  const hs = await c.getSmartMoneyHoldings('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'ethereum', 5);
  assert.equal(hs.length, 5);
  for (const h of hs) {
    assert.equal(h.chain, 'ethereum');
    assert.equal(h.tokenAddress.toLowerCase(), '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
    assert.equal(h.source === 'onchain' || h.source === 'inferred', true);
  }
});

test('NansenClient: getLargeTransfers (mock)', async () => {
  const c = new NansenClient();
  const xs = await c.getLargeTransfers({ chain: 'ethereum', minUsd: NANSEN_WHALE_THRESHOLD_USD, limit: 3 });
  assert.equal(xs.length, 3);
  for (const t of xs) {
    assert.equal(t.chain, 'ethereum');
    assert.ok(Number(t.amountUsd) >= NANSEN_WHALE_THRESHOLD_USD);
  }
});

test('NansenClient: getFlowIntelligence (mock)', async () => {
  const c = new NansenClient();
  const flow = await c.getFlowIntelligence('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'ethereum', '7d');
  assert.equal(flow.chain, 'ethereum');
  assert.equal(flow.period, '7d');
  assert.ok(flow.netFlow);
  assert.ok(flow.bySource);
});

test('NansenClient: HTTP 5xx 触发重试（最终降级到 mock）', async () => {
  const fetchImpl = createRoutedFetch(
    { '/addresses': () => ({ address: '0xabc', chain: 'ethereum' }) },
    { status500Paths: [/^https?:\/\/api\.nansen\.ai/] },
  );
  const c = new NansenClient({ apiKey: 'real-key', fetchImpl, maxRetries: 2, initialBackoffMs: 5, maxBackoffMs: 10 });
  // 5xx 全部失败 + 启用降级 → 走 mock
  const a = await c.getAddress('0xabc', 'ethereum');
  assert.ok(a);
  // mock 模式下应得到 labels
  assert.ok(Array.isArray(a.labels));
});

test('NansenClient: HTTP 4xx 立即抛出', async () => {
  const fetchImpl = createMockFetch(() => ({ status: 404, body: 'not found' }));
  const c = new NansenClient({ apiKey: 'real-key', fetchImpl, maxRetries: 3, initialBackoffMs: 5, maxBackoffMs: 10, enableFallback: false });
  await assert.rejects(
    () => c.getAddress('0xabc', 'ethereum'),
    (err: unknown) => err instanceof NansenError && err.code === 'HTTP_404',
  );
});

test('NansenClient: 8 链支持矩阵', () => {
  assert.equal(NANSEN_SUPPORTED_CHAINS.length, 8);
  assert.ok(NANSEN_SUPPORTED_CHAINS.includes('ethereum'));
  assert.ok(NANSEN_SUPPORTED_CHAINS.includes('solana'));
  assert.equal(NANSEN_API_BASE, 'https://api.nansen.ai/v1');
});

// =============================================================================
// 2. SignalEngine
// =============================================================================

test('SignalEngine: subscribeSignals + ingestSignal 触发回调', () => {
  const client = new NansenClient();
  const engine = new SignalEngine({ client, pollIntervalMs: 60_000, initialLookbackMs: 0 });
  const received: SmartMoneySignal[] = [];
  const off = engine.subscribeSignals({ chains: ['ethereum'] }, (s) => {
    received.push(s);
  });
  const signal: SmartMoneySignal = {
    id: 't1',
    chain: 'ethereum',
    walletAddress: '0xabc',
    signalType: 'buy',
    token: { symbol: 'WETH', address: '0xweth', decimals: 18 },
    amount: '1',
    amountUsd: '100000',
    txHash: '0xtx',
    blockNumber: 1,
    timestamp: Date.now(),
    triggeredRules: [],
    confidence: 0.8,
  };
  engine.ingestSignal(signal);
  engine.ingestSignal({ ...signal, id: 't2', chain: 'bsc' }); // 不匹配链
  assert.equal(received.length, 1);
  assert.equal(received[0].id, 't1');
  off();
  engine.ingestSignal({ ...signal, id: 't3' });
  assert.equal(received.length, 1);
  engine.close();
});

test('SignalEngine: filterByAmount / filterByTime / groupByToken / calculateConviction', () => {
  const client = new NansenClient();
  const engine = new SignalEngine({ client });
  const now = Date.now();
  const signals: SmartMoneySignal[] = [
    { id: 'a', chain: 'ethereum', walletAddress: '0x1', signalType: 'buy', token: { symbol: 'WETH', address: '0xa', decimals: 18 }, amount: '1', amountUsd: '50000', txHash: '0x', blockNumber: 1, timestamp: now, triggeredRules: [], confidence: 0.7 },
    { id: 'b', chain: 'ethereum', walletAddress: '0x2', signalType: 'buy', token: { symbol: 'WETH', address: '0xa', decimals: 18 }, amount: '1', amountUsd: '200000', txHash: '0x', blockNumber: 1, timestamp: now - 1000, triggeredRules: [], confidence: 0.9 },
    { id: 'c', chain: 'ethereum', walletAddress: '0x1', signalType: 'sell', token: { symbol: 'USDC', address: '0xb', decimals: 6 }, amount: '1', amountUsd: '80000', txHash: '0x', blockNumber: 1, timestamp: now - 5000, triggeredRules: [], confidence: 0.6 },
  ];

  // filterByAmount
  const highValue = engine.filterByAmount(signals, 100_000);
  assert.equal(highValue.length, 1);
  assert.equal(highValue[0].id, 'b');

  // filterByTime
  const recent = engine.filterByTime(signals, now - 2000);
  assert.equal(recent.length, 2);

  // groupByToken
  const grouped = engine.groupByToken(signals);
  assert.ok(grouped['WETH']);
  assert.equal(grouped['WETH'].buyCount, 2);
  assert.equal(grouped['WETH'].sellCount, 0);
  assert.equal(grouped['USDC'].sellCount, 1);
  assert.ok(grouped['WETH'].netFlow.startsWith('250000') || grouped['WETH'].netFlow === '250000');

  // calculateConviction
  const conv = engine.calculateConviction(signals);
  assert.ok(conv > 0 && conv <= 1, `conviction should be (0,1], got ${conv}`);
  const empty = engine.calculateConviction([]);
  assert.equal(empty, 0);

  engine.close();
});

// =============================================================================
// 3. AlertManager
// =============================================================================

test('AlertManager: addRule + listRules + removeRule', () => {
  const mgr = new AlertManager();
  const r1 = mgr.addRule({ type: 'smart_money_buy', thresholdUsd: 50_000, channels: ['push'] });
  const r2 = mgr.addRule({ type: 'whale_transfer', channels: ['email', 'webhook'], webhookUrls: ['https://x'] });
  assert.equal(mgr.listRules().length, 2);
  assert.equal(r1.type, 'smart_money_buy');
  assert.equal(r2.priority, 'high'); // default for whale
  assert.equal(mgr.removeRule(r1.id), true);
  assert.equal(mgr.listRules().length, 1);
  assert.equal(mgr.removeRule('not-exist'), false);
});

test('AlertManager: evaluateSignal 触发并应用 cooldown', () => {
  let now = 1_000_000;
  const mgr = new AlertManager({ now: () => now });
  mgr.addRule({ type: 'smart_money_buy', thresholdUsd: 50_000, channels: ['push'], cooldownMs: 60_000 });
  const sig: SmartMoneySignal = {
    id: 's1', chain: 'ethereum', walletAddress: '0x1', signalType: 'buy',
    token: { symbol: 'WETH', address: '0xw', decimals: 18 },
    amount: '1', amountUsd: '100000', txHash: '0x', blockNumber: 1, timestamp: now,
    triggeredRules: [], confidence: 0.8,
  };
  const fired1 = mgr.evaluateSignal(sig);
  assert.equal(fired1.length, 1);
  assert.equal(fired1[0].priority, 'medium');
  assert.equal(fired1[0].channels.length, 1);

  // cooldown 期内不重复
  now += 30_000;
  const fired2 = mgr.evaluateSignal(sig);
  assert.equal(fired2.length, 0);

  // cooldown 之后再次触发
  now += 60_000;
  const fired3 = mgr.evaluateSignal(sig);
  assert.equal(fired3.length, 1);
});

test('AlertManager: sendAlert 通过 mock push / email / webhook', async () => {
  let emailCalls = 0;
  let pushCalls = 0;
  let webhookCalls = 0;
  const email = {
    sendSecurityAlert: async (_u: string, _to: string, _t: string, _v: any) => {
      emailCalls++;
      return { ok: true };
    },
  };
  const push = {
    sendToUser: async (uid: string, payload: any) => {
      pushCalls++;
      return [{ userId: uid, status: 'success', provider: 'FCM', messageId: 'm', sentAt: Date.now() }];
    },
  };
  const webhookFetch = createMockFetch((url) => {
    if (url.startsWith('https://hook')) {
      webhookCalls++;
      return { status: 200, body: { ok: true } };
    }
    return { status: 404, body: 'not found' };
  });
  const mgr = new AlertManager({ email, push, webhook: { fetchImpl: webhookFetch } });
  const recipients = ['u1', 'u2'];
  const emails = ['a@x.com'];
  mgr.addRule({
    type: 'whale_transfer',
    channels: ['email', 'push', 'webhook'],
    recipients,
    recipientEmails: emails,
    webhookUrls: ['https://hook'],
    thresholdUsd: 100,
  });
  const sig: SmartMoneySignal = {
    id: 's2', chain: 'ethereum', walletAddress: '0x9', signalType: 'buy',
    token: { symbol: 'WETH', address: '0xw', decimals: 18 },
    amount: '1', amountUsd: '5000000', txHash: '0x', blockNumber: 1, timestamp: Date.now(),
    triggeredRules: [], confidence: 0.9,
  };
  const fired = mgr.evaluateSignal(sig);
  assert.equal(fired.length, 1);
  const result = await mgr.sendAlert(fired[0]);
  assert.equal(result.email, emails.length);
  assert.equal(result.push, recipients.length);
  assert.equal(result.webhook, 1);
  assert.equal(emailCalls, emails.length);
  assert.equal(pushCalls, recipients.length);
  assert.equal(webhookCalls, 1);
});

test('AlertManager: getAlerts / markAsRead / getStats', () => {
  const mgr = new AlertManager();
  mgr.addRule({ type: 'smart_money_buy', thresholdUsd: 100, channels: ['push'], cooldownMs: 0 });
  for (let i = 0; i < 3; i++) {
    mgr.evaluateSignal({
      id: `a${i}`, chain: 'ethereum', walletAddress: '0x', signalType: 'buy',
      token: { symbol: 'WETH', address: '0x', decimals: 18 },
      amount: '1', amountUsd: '1000', txHash: '0x', blockNumber: 1, timestamp: Date.now() + i * 1000,
      triggeredRules: [], confidence: 0.5,
    });
  }
  const all = mgr.getAlerts();
  assert.equal(all.length, 3);
  const stats = mgr.getStats();
  assert.equal(stats.total, 3);
  assert.equal(stats.unread, 3);
  assert.ok(mgr.markAsRead(all[0].id));
  assert.equal(mgr.getAlerts({ unreadOnly: true }).length, 2);
  assert.equal(mgr.markAllAsRead(), 2);
  assert.equal(mgr.getStats().unread, 0);
});

// =============================================================================
// 4. WalletProfiler
// =============================================================================

test('WalletProfiler: profile + PnL + winRate', async () => {
  const client = new NansenClient();
  const profiler = new WalletProfiler({ client });
  const addr = '0x1111111111111111111111111111111111111111';
  const profile = await profiler.profile(addr, 'ethereum');
  assert.ok(profile);
  assert.equal(profile.address.toLowerCase(), addr);

  const pnl = await profiler.getPnL(addr, 'ethereum', 30);
  assert.equal(typeof pnl.realized, 'string');
  assert.equal(typeof pnl.unrealized, 'string');
  assert.equal(typeof pnl.total, 'string');
  assert.ok(pnl.winRate >= 0 && pnl.winRate <= 1);

  const wr = await profiler.getWinRate(addr, 'ethereum', 30);
  assert.equal(wr, pnl.winRate);
});

test('WalletProfiler: getTopWallets 按 pnl 降序', async () => {
  const client = new NansenClient();
  const profiler = new WalletProfiler({ client });
  const top = await profiler.getTopWallets('30d', 'pnl', 5);
  assert.ok(top.length > 0);
  for (let i = 1; i < top.length; i++) {
    assert.ok(Number(top[i - 1].totalPnlUsd) >= Number(top[i].totalPnlUsd));
  }
  for (let i = 0; i < top.length; i++) {
    assert.equal(top[i].rank, i + 1);
  }

  // by volume
  const byVol = await profiler.getTopWallets('7d', 'volume', 3);
  assert.equal(byVol.length, 3);
  for (let i = 1; i < byVol.length; i++) {
    const a = parseFloat(byVol[i - 1].metric.replace(/[^0-9.\-]/g, '')) || 0;
    const b = parseFloat(byVol[i].metric.replace(/[^0-9.\-]/g, '')) || 0;
    assert.ok(a >= b);
  }
});

test('WalletProfiler: follow / unfollow / getFollowed', async () => {
  const client = new NansenClient();
  const store = new InMemoryFollowStore();
  const profiler = new WalletProfiler({ client, followStore: store });
  const u1 = 'user-1';
  const a1 = '0x1111111111111111111111111111111111111111';
  const a2 = '0x2222222222222222222222222222222222222222';
  profiler.follow(a1, u1, 'ethereum', 'whale A');
  profiler.follow(a2, u1, 'arbitrum', 'whale B');
  const list = await profiler.getFollowed(u1);
  assert.equal(list.length, 2);
  const addresses = list.map((x) => x.address.toLowerCase()).sort();
  assert.deepEqual(addresses, [a1, a2].map((x) => x.toLowerCase()).sort());

  assert.equal(profiler.unfollow(a1, u1, 'ethereum'), true);
  const after = await profiler.getFollowed(u1);
  assert.equal(after.length, 1);
  assert.equal(after[0].address.toLowerCase(), a2);
});

// =============================================================================
// 5. 演示降级（mock 模式全局可用）
// =============================================================================

test('演示降级: 无 apiKey / 含 mock 字符串即走 mock 路径', () => {
  const c1 = new NansenClient({ apiKey: undefined });
  const c2 = new NansenClient({ apiKey: 'MOCK-KEY' });
  const c3 = new NansenClient({ apiKey: 'real-prod-key' });
  assert.equal(c1.isMock(), true);
  assert.equal(c2.isMock(), true);
  assert.equal(c3.isMock(), false);
});

test('演示降级: 真实 API 5xx 时 fallback 到 mock 数据', async () => {
  const fetchImpl = createMockFetch(() => ({ status: 503, body: 'unavailable' }));
  const c = new NansenClient({
    apiKey: 'real-key',
    fetchImpl,
    maxRetries: 2,
    initialBackoffMs: 5,
    maxBackoffMs: 10,
    enableFallback: true,
  });
  const sigs = await c.getSmartMoneySignals({ limit: 2 });
  assert.equal(sigs.length, 2);
  // mock 数据下 signals 应该有有效结构
  assert.equal(sigs[0].chain, 'ethereum');
});
