/**
 * Trades 模块单元测试
 *
 * 覆盖：
 *  1. 解析单笔 trade 消息（normalizeTradeWs）
 *  2. 解析组合流（combined stream）的 trade
 *  3. WebSocket subscribe + unsubscribe
 *  4. TradesFeed 多订阅者
 *  5. 缓存最近 200 笔（环形裁剪）
 *  6. 自动重连（指数退避）
 *  7. 降级到 mock（REST 失败 → mock 成交）
 *  8. REST 拉取历史（fetchRecentTrades）
 *
 * 使用 Node 18+ 内置 fetch / WebSocket。
 * 全部走 mock fetch / MockWebSocket，无外网依赖。
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  BinanceRestClient,
  BinanceWsClient,
  normalizeTradeWs,
  normalizeTradeRestWithSymbol,
  type BinanceWsTradeMessage,
  type NormalizedTrade,
} from '../src/lib/market/binance-client';

import {
  TradesFeed,
  generateMockTrades,
  DEFAULT_TRADE_CACHE_SIZE,
  createTradesFeed,
  type TradesFeedOptions,
} from '../src/lib/market/trades-feed';

// =============================================================================
// 测试辅助
// =============================================================================

/** Mock fetch：根据 URL 返回不同响应 */
function createMockFetch(
  handler: (url: string) => { status: number; body: unknown },
): typeof fetch {
  return (async (url: any) => {
    const u = typeof url === 'string' ? url : url.toString();
    const r = handler(u);
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      statusText: 'OK',
      text: async () => (typeof r.body === 'string' ? r.body : JSON.stringify(r.body)),
      json: async () => r.body,
    } as Response;
  }) as unknown as typeof fetch;
}

/** 内存 WebSocket：可被测试驱动 */
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static readyState = { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 };

  readyState = 0; // CONNECTING
  sent: string[] = [];
  url: string;
  onopen: ((ev?: unknown) => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: ((ev?: unknown) => void) | null = null;
  onclose: ((ev: { code: number; reason: string }) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    setImmediate(() => this.simulateOpen());
  }

  private simulateOpen(): void {
    this.readyState = 1;
    this.onopen?.();
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(code = 1000, reason = ''): void {
    this.readyState = 3;
    this.onclose?.({ code, reason });
  }

  simulateMessage(payload: unknown): void {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  simulateClose(code = 1006, reason = 'abnormal'): void {
    this.readyState = 3;
    this.onclose?.({ code, reason });
  }

  addEventListener(): void { /* noop */ }
  removeEventListener(): void { /* noop */ }
}

/** 工具：等待 n 个微任务 + 1 个宏任务 */
const wait = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

/** 构造一个合法的 ws trade payload */
function wsTradePayload(overrides: Partial<BinanceWsTradeMessage> = {}): BinanceWsTradeMessage {
  return {
    e: 'trade',
    E: 1_700_000_000_000,
    s: 'BTCUSDT',
    t: 123456,
    p: '67000',
    q: '0.1',
    T: 1_700_000_000_000,
    m: false,
    ...overrides,
  };
}

// =============================================================================
// 1. 解析单笔 trade 消息
// =============================================================================

test('Case 1 - 解析单笔 trade 消息: normalizeTradeWs 字段映射正确', () => {
  const raw = wsTradePayload({ s: 'BTCUSDT', t: 999, p: '67000.123', q: '0.5', m: true });
  const t = normalizeTradeWs(raw, 'ws');

  assert.equal(t.symbol, 'BTC/USDT');
  assert.equal(t.price, '67000.12300000');
  assert.equal(t.qty, '0.50000000');
  assert.equal(t.time, 1_700_000_000_000);
  assert.equal(t.isBuyerMaker, true);
  assert.equal(t.tradeId, '999');
  assert.equal(t.source, 'ws');
});

test('Case 1b - REST 原始消息: normalizeTradeRestWithSymbol 补齐 symbol', () => {
  const raw = {
    id: 12345,
    price: '3500.5',
    qty: '2.5',
    quoteQty: '8751.25',
    time: 1_700_000_000_000,
    isBuyerMaker: false,
    isBestMatch: true,
  };
  const t = normalizeTradeRestWithSymbol(raw, 'ETH/USDT');

  assert.equal(t.symbol, 'ETH/USDT');
  assert.equal(t.price, '3500.50000000');
  assert.equal(t.qty, '2.50000000');
  assert.equal(t.time, 1_700_000_000_000);
  assert.equal(t.isBuyerMaker, false);
  assert.equal(t.tradeId, '12345');
  assert.equal(t.source, 'rest');
});

// =============================================================================
// 2. 解析组合流（combined stream）的 trade
// =============================================================================

test('Case 2 - 解析组合流 trade: BinanceWsClient 分发到 subscribeTrade handler', async () => {
  MockWebSocket.instances = [];
  const client = new BinanceWsClient({
    WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    heartbeatMs: 0,
  });
  client.connect();
  await wait();

  const received: NormalizedTrade[] = [];
  // 直接通过 subscribeTrades 验证组合流
  const unsub = client.subscribeTrades(['BTC/USDT', 'ETH/USDT'], (t) => received.push(t));
  await wait();

  const ws = MockWebSocket.instances[0];
  // 模拟组合流（{ stream, data }）
  ws.simulateMessage({
    stream: 'btcusdt@trade',
    data: wsTradePayload({ s: 'BTCUSDT', t: 1, p: '67000', q: '0.1', m: false }),
  });
  ws.simulateMessage({
    stream: 'ethusdt@trade',
    data: wsTradePayload({ s: 'ETHUSDT', t: 2, p: '3500', q: '1.0', m: true }),
  });

  assert.equal(received.length, 2, '应收到 2 笔成交');
  assert.equal(received[0].symbol, 'BTC/USDT');
  assert.equal(received[0].source, 'ws');
  assert.equal(received[0].isBuyerMaker, false);
  assert.equal(received[1].symbol, 'ETH/USDT');
  assert.equal(received[1].isBuyerMaker, true);

  unsub();
  client.disconnect();
});

// =============================================================================
// 3. 订阅 + 取消订阅
// =============================================================================

test('Case 3 - 订阅 + 取消订阅: unsub 之后不再收到推送', async () => {
  MockWebSocket.instances = [];
  const client = new BinanceWsClient({
    WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    heartbeatMs: 0,
  });
  client.connect();
  await wait();

  const received: NormalizedTrade[] = [];
  const unsub = client.subscribeTrades(['BTC/USDT'], (t) => received.push(t));
  await wait();

  const ws = MockWebSocket.instances[0];
  ws.simulateMessage({
    stream: 'btcusdt@trade',
    data: wsTradePayload({ t: 100 }),
  });
  assert.equal(received.length, 1);

  // 取消订阅
  unsub();
  await wait();
  // 后续推送不应触发回调
  ws.simulateMessage({
    stream: 'btcusdt@trade',
    data: wsTradePayload({ t: 101 }),
  });
  assert.equal(received.length, 1, '取消订阅后不应再收到');

  client.disconnect();
});

// =============================================================================
// 4. 多订阅者
// =============================================================================

test('Case 4 - TradesFeed 多订阅者: 同一 symbol 多个 callback 同时触发', async () => {
  MockWebSocket.instances = [];
  const feed = new TradesFeed({
    ws: { WebSocketImpl: MockWebSocket as unknown as typeof WebSocket, heartbeatMs: 0 },
    rest: { fetchImpl: createMockFetch(() => ({ status: 200, body: [] })) },
  });
  feed.start();
  await wait();

  const a: NormalizedTrade[] = [];
  const b: NormalizedTrade[] = [];
  feed.subscribe('BTC/USDT', (t) => a.push(t));
  feed.subscribe('BTC/USDT', (t) => b.push(t));
  await wait();

  const ws = MockWebSocket.instances[0];
  ws.simulateMessage({
    stream: 'btcusdt@trade',
    data: wsTradePayload({ t: 1, s: 'BTCUSDT' }),
  });

  assert.equal(a.length, 1);
  assert.equal(b.length, 1);
  assert.equal(a[0].tradeId, b[0].tradeId);

  feed.stop();
});

// =============================================================================
// 5. 缓存最近 200 笔（环形裁剪）
// =============================================================================

test('Case 5 - 缓存最近 200 笔: 超过上限后环形裁剪 + getRecent 倒序返回', async () => {
  MockWebSocket.instances = [];
  const cacheSize = 200;
  const feed = new TradesFeed({
    cacheSize,
    ws: { WebSocketImpl: MockWebSocket as unknown as typeof WebSocket, heartbeatMs: 0 },
    rest: { fetchImpl: createMockFetch(() => ({ status: 200, body: [] })) },
  });
  feed.start();
  await wait();

  const unsub = feed.subscribe('BTC/USDT', () => { /* drain */ });
  await wait();

  const ws = MockWebSocket.instances[0];
  // 推送 250 笔，超过 cacheSize 50 笔
  for (let i = 0; i < 250; i += 1) {
    ws.simulateMessage({
      stream: 'btcusdt@trade',
      data: wsTradePayload({ t: 1000 + i, s: 'BTCUSDT' }),
    });
  }
  await wait();

  // getRecent 不传 limit 时只返回默认 50，传 cacheSize 取全部
  const all = feed.getRecent('BTC/USDT', cacheSize);
  assert.equal(all.length, cacheSize, `缓存应为 ${cacheSize}，实际 ${all.length}`);
  // 最后一条 tradeId 应该是 1000 + 249 = 1249
  assert.equal(all[all.length - 1].tradeId, String(1000 + 249));
  // 第一条应是 1000 + 50 = 1050（最旧的被裁掉了）
  assert.equal(all[0].tradeId, String(1000 + 50));

  // 默认 limit（50）应返回最近 50 笔
  const defaultLimit = feed.getRecent('BTC/USDT');
  assert.equal(defaultLimit.length, 50, '默认 limit 应为 50');
  assert.equal(defaultLimit[0].tradeId, String(1000 + 200));

  // limit 边界
  const ten = feed.getRecent('BTC/USDT', 10);
  assert.equal(ten.length, 10);
  assert.equal(ten[0].tradeId, String(1000 + 240));

  unsub();
  feed.stop();
});

// =============================================================================
// 6. 自动重连（指数退避）
// =============================================================================

test('Case 6 - 重连机制: WS 异常关闭后自动重连，退避延迟递增', async () => {
  MockWebSocket.instances = [];
  const reconnectDelays: number[] = [];
  const client = new BinanceWsClient({
    WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    initialReconnectMs: 10,
    maxReconnectMs: 80,
    heartbeatMs: 0,
    onReconnect: (_attempt, delay) => reconnectDelays.push(delay),
  });
  client.connect();
  await wait();
  assert.equal(MockWebSocket.instances.length, 1);

  // 触发首次异常关闭
  MockWebSocket.instances[0].simulateClose(1006, 'abnormal');
  await wait(30);
  assert.equal(MockWebSocket.instances.length, 2, '第一次重连应已建立');
  assert.equal(reconnectDelays.length, 1);

  // 第二次
  MockWebSocket.instances[1].simulateClose(1006, 'abnormal');
  await wait(60);
  assert.equal(MockWebSocket.instances.length, 3, '第二次重连应已建立');
  assert.equal(reconnectDelays.length, 2);
  // 第二次延迟应 >= 第一次（指数退避）
  assert.ok(
    reconnectDelays[1] >= reconnectDelays[0],
    `第二次延迟应 >= 第一次：${reconnectDelays[0]} -> ${reconnectDelays[1]}`,
  );

  // 主动 disconnect 不应再触发重连
  client.disconnect();
  await wait(80);
  assert.equal(MockWebSocket.instances.length, 3, '手动 disconnect 后不再重连');
});

// =============================================================================
// 7. 降级到 mock（断网时返回 5 笔模拟成交）
// =============================================================================

test('Case 7 - 降级到 mock: REST 失败时自动 emit 5 笔模拟成交', async () => {
  MockWebSocket.instances = [];
  const fallbackEvents: Array<{ symbol: string; reason: string }> = [];

  const feed = new TradesFeed({
    mockTradesPerSymbol: 5,
    ws: { WebSocketImpl: MockWebSocket as unknown as typeof WebSocket, heartbeatMs: 0 },
    rest: {
      fetchImpl: (() => { throw new Error('ECONNREFUSED'); }) as unknown as typeof fetch,
    },
    onFallback: (sym, reason) => fallbackEvents.push({ symbol: sym, reason }),
  });
  feed.start();
  await wait();

  const received: NormalizedTrade[] = [];
  const unsub = feed.subscribe('BTC/USDT', (t) => received.push(t));
  // 等待 bootstrapSymbol 的失败 → fallback 流程
  await wait(50);

  // 缓存应有 5 条 mock
  const cached = feed.getRecent('BTC/USDT');
  assert.equal(cached.length, 5, '降级后缓存 5 笔 mock');
  assert.ok(cached.every(t => t.source === 'mock'), '所有 mock 数据应标记 source=mock');
  assert.ok(cached.every(t => t.symbol === 'BTC/USDT'), 'symbol 应为 BTC/USDT');

  // 订阅者应收到过至少 5 次回调
  assert.ok(received.length >= 5, `订阅者至少收到 5 次回调，实际 ${received.length}`);

  // 降级回调被触发
  assert.ok(fallbackEvents.length >= 1, 'onFallback 应至少触发 1 次');
  assert.equal(fallbackEvents[0].symbol, 'BTC/USDT');

  unsub();
  feed.stop();
});

test('Case 7b - generateMockTrades: 数量、symbol、时间戳正确', () => {
  const trades = generateMockTrades({ symbol: 'BTC/USDT', count: 3, basePrice: 67000 });
  assert.equal(trades.length, 3);
  assert.ok(trades.every(t => t.symbol === 'BTC/USDT'));
  assert.ok(trades.every(t => t.source === 'mock'));
  assert.ok(trades.every(t => typeof t.price === 'string'));
  assert.ok(trades.every(t => /^\d+\.\d{8}$/.test(t.price)), '价格保留 8 位小数');
  // 时间戳递增
  assert.ok(trades[1].time > trades[0].time);
  assert.ok(trades[2].time > trades[1].time);
});

// =============================================================================
// 8. REST 拉取历史
// =============================================================================

test('Case 8 - REST 拉取历史: BinanceRestClient.fetchRecentTrades 返回 NormalizedTrade[]', async () => {
  const sample = [
    { id: 100, price: '67000', qty: '0.1', quoteQty: '6700', time: 1_700_000_000_000, isBuyerMaker: false, isBestMatch: true },
    { id: 101, price: '67001', qty: '0.2', quoteQty: '13400.2', time: 1_700_000_000_500, isBuyerMaker: true, isBestMatch: true },
  ];
  let capturedUrl = '';
  const client = new BinanceRestClient({
    fetchImpl: createMockFetch((url) => {
      capturedUrl = url;
      return { status: 200, body: sample };
    }),
  });

  const trades = await client.fetchRecentTrades('BTC/USDT', 50);
  assert.equal(trades.length, 2);
  assert.equal(trades[0].symbol, 'BTC/USDT');
  assert.equal(trades[0].tradeId, '100');
  assert.equal(trades[0].price, '67000.00000000');
  assert.equal(trades[1].isBuyerMaker, true);
  assert.equal(trades[1].source, 'rest');
  assert.ok(capturedUrl.includes('/api/v3/trades'));
  assert.ok(capturedUrl.includes('symbol=BTCUSDT'));
  assert.ok(capturedUrl.includes('limit=50'));
});

test('Case 8b - REST 拉取历史: TradesFeed.fetchRecentTrades 透传 REST', async () => {
  MockWebSocket.instances = [];
  const sample = [
    { id: 1, price: '100', qty: '1', quoteQty: '100', time: 1, isBuyerMaker: false, isBestMatch: true },
  ];
  const feed = new TradesFeed({
    ws: { WebSocketImpl: MockWebSocket as unknown as typeof WebSocket, heartbeatMs: 0 },
    rest: { fetchImpl: createMockFetch(() => ({ status: 200, body: sample })) },
  });
  feed.start();
  const trades = await feed.fetchRecentTrades('ETH/USDT', 10);
  assert.equal(trades.length, 1);
  assert.equal(trades[0].symbol, 'ETH/USDT');
  assert.equal(trades[0].source, 'rest');
  feed.stop();
});

// =============================================================================
// 9. 额外：模拟"订阅 5 笔 trade 推送，能正常解析"
// =============================================================================

test('Case 9 - 模拟 5 笔推送: TradesFeed 订阅后能解析所有推送并写入缓存', async () => {
  MockWebSocket.instances = [];
  const feed = new TradesFeed({
    ws: { WebSocketImpl: MockWebSocket as unknown as typeof WebSocket, heartbeatMs: 0 },
    rest: { fetchImpl: createMockFetch(() => ({ status: 200, body: [] })) },
  });
  feed.start();
  await wait();

  const received: NormalizedTrade[] = [];
  const unsub = feed.subscribe('BTC/USDT', (t) => received.push(t));
  await wait();

  const ws = MockWebSocket.instances[0];
  const tradeIds = [1001, 1002, 1003, 1004, 1005];
  for (let i = 0; i < tradeIds.length; i += 1) {
    ws.simulateMessage({
      stream: 'btcusdt@trade',
      data: wsTradePayload({
        s: 'BTCUSDT',
        t: tradeIds[i],
        p: (67000 + i).toString(),
        q: (0.1 * (i + 1)).toString(),
        m: i % 2 === 0,
        T: 1_700_000_000_000 + i * 100,
      }),
    });
  }
  await wait();

  assert.equal(received.length, 5, '应解析 5 笔 trade');
  for (let i = 0; i < 5; i += 1) {
    assert.equal(received[i].tradeId, String(tradeIds[i]));
    assert.equal(received[i].symbol, 'BTC/USDT');
    assert.equal(received[i].price, `${67000 + i}.00000000`);
    assert.equal(received[i].qty, `${(0.1 * (i + 1)).toFixed(8)}`);
    assert.equal(received[i].isBuyerMaker, i % 2 === 0);
  }
  assert.equal(feed.getRecent('BTC/USDT').length, 5);

  unsub();
  feed.stop();
});

// =============================================================================
// 10. 工厂函数 + 常量
// =============================================================================

test('Case 10 - createTradesFeed 工厂 + DEFAULT_TRADE_CACHE_SIZE 常量', () => {
  const feed = createTradesFeed({
    ws: { WebSocketImpl: MockWebSocket as unknown as typeof WebSocket, heartbeatMs: 0 },
    rest: { fetchImpl: createMockFetch(() => ({ status: 200, body: [] })) },
  });
  assert.ok(feed instanceof TradesFeed);
  assert.equal(DEFAULT_TRADE_CACHE_SIZE, 200);
  feed.stop();
});

// 测试退出清理
test('trades feed test runner cleanup', async () => {
  await wait(50);
  assert.ok(true, 'cleanup ok');
});
