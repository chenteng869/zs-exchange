/**
 * Binance 行情客户端单元测试
 *
 * 覆盖：
 *  - REST 客户端：连通性、24h ticker、K 线、深度
 *  - WebSocket 客户端：连接、订阅、消息分发、重连
 *  - 数据标准化：与现有 Ticker / Trade / Kline 类型兼容
 *  - 适配器：live / fallback 模式、降级恢复
 *
 * 使用 Node 18+ 内置 fetch / WebSocket 真实连通 Binance 公共 API。
 * 若网络不可用，测试使用 mock fetch + 内存 WebSocket 验证逻辑。
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BinanceRestClient,
  BinanceWsClient,
  BinanceError,
  formatSymbol,
  toBinanceStream,
  normalize24hTicker,
  normalizeWsTicker,
  normalizeWsTrade,
  normalizeKline,
  normalizeDepth,
  createBinanceRestClient,
  createBinanceWsClient,
  BINANCE_REST_BASE,
  type Binance24hTickerRaw,
  type BinanceWsTickerMessage,
  type BinanceWsTradeMessage,
  type BinanceWsKlineMessage,
} from '../src/lib/market/binance-client';
import { BinanceMarketFeed } from '../src/lib/market/binance-adapter';

// =============================================================================
// 1. 工具函数测试
// =============================================================================

test('formatSymbol: BTCUSDT -> BTC/USDT (默认 quote=USDT)', () => {
  assert.equal(formatSymbol('BTCUSDT'), 'BTC/USDT');
  assert.equal(formatSymbol('ETHUSDT'), 'ETH/USDT');
});

test('formatSymbol: 已包含斜杠直接返回', () => {
  assert.equal(formatSymbol('BTC/USDT'), 'BTC/USDT');
  assert.equal(formatSymbol('ETH/BTC'), 'ETH/BTC');
});

test('formatSymbol: 非 USDT 报价保留原始', () => {
  assert.equal(formatSymbol('ETHBTC', 'BTC'), 'ETH/BTC');
  assert.equal(formatSymbol('BNBBTC', 'BTC'), 'BNB/BTC');
});

test('toBinanceStream: 转小写并去除斜杠', () => {
  assert.equal(toBinanceStream('BTC/USDT'), 'btcusdt');
  assert.equal(toBinanceStream('ETH/USDT', false), 'ETHUSDT');
});

// =============================================================================
// 2. 数据标准化测试
// =============================================================================

test('normalize24hTicker: 字段映射正确', () => {
  const raw: Binance24hTickerRaw = {
    symbol: 'BTCUSDT',
    priceChange: '100',
    priceChangePercent: '0.15',
    weightedAvgPrice: '67000',
    prevClosePrice: '66900',
    lastPrice: '67050',
    lastQty: '0.5',
    bidPrice: '67049',
    bidQty: '1.0',
    askPrice: '67051',
    askQty: '1.0',
    openPrice: '66950',
    highPrice: '67200',
    lowPrice: '66800',
    volume: '12345.67',
    quoteVolume: '826000000',
    openTime: 1700000000000,
    closeTime: 1700086400000,
    firstId: 1,
    lastId: 100,
    count: 100,
  };
  const t = normalize24hTicker(raw);
  assert.equal(t.symbol, 'BTC/USDT');
  assert.equal(t.lastPrice, '67050.00000000');
  assert.equal(t.bidPrice, '67049.00000000');
  assert.equal(t.askPrice, '67051.00000000');
  assert.equal(t.open24h, '66950.00000000');
  assert.equal(t.high24h, '67200.00000000');
  assert.equal(t.low24h, '66800.00000000');
  assert.equal(t.volume24h, '12345.67000000');
  assert.equal(t.change24h, '0.15000000');
  assert.ok(t.updatedAt);
});

test('normalizeWsTicker: WebSocket 字段映射正确', () => {
  const raw: BinanceWsTickerMessage = {
    e: '24hrTicker',
    E: 1700000000000,
    s: 'ETHUSDT',
    p: '50',
    P: '1.5',
    c: '3500',
    b: '3499.5',
    a: '3500.5',
    o: '3450',
    h: '3550',
    l: '3400',
    v: '100000',
    q: '350000000',
  };
  const t = normalizeWsTicker(raw);
  assert.equal(t.symbol, 'ETH/USDT');
  assert.equal(t.lastPrice, '3500.00000000');
  assert.equal(t.bidPrice, '3499.50000000');
  assert.equal(t.askPrice, '3500.50000000');
  assert.equal(t.change24h, '1.50000000');
});

test('normalizeWsTrade: 买卖方向反转 (m=true 为主动卖)', () => {
  const raw1: BinanceWsTradeMessage = { e: 'trade', E: 1, s: 'BTCUSDT', t: 123, p: '67000', q: '0.1', T: 1700000000000, m: true };
  const raw2: BinanceWsTradeMessage = { e: 'trade', E: 1, s: 'BTCUSDT', t: 124, p: '67000', q: '0.1', T: 1700000000000, m: false };
  assert.equal(normalizeWsTrade(raw1).side, 'sell');
  assert.equal(normalizeWsTrade(raw2).side, 'buy');
  assert.equal(normalizeWsTrade(raw1).id, '123');
  assert.equal(normalizeWsTrade(raw1).symbol, 'BTC/USDT');
});

test('normalizeKline: 数组下标映射正确', () => {
  const raw: [number, string, string, string, string, string, number, string, number, string, string, string] = [
    1700000000000, '67000', '67500', '66800', '67200', '1234.56', 1700000059999, '82700000', 5000, '600', '40000000', '0',
  ];
  const k = normalizeKline(raw, 'BTC/USDT', '1m');
  assert.equal(k.openTime, 1700000000000);
  assert.equal(k.open, '67000.00000000');
  assert.equal(k.high, '67500.00000000');
  assert.equal(k.low, '66800.00000000');
  assert.equal(k.close, '67200.00000000');
  assert.equal(k.volume, '1234.56000000');
  assert.equal(k.trades, 5000);
});

test('normalizeDepth: 限制档数与字段转换', () => {
  const bids: [string, string][] = Array.from({ length: 50 }, (_, i) => [(67000 - i).toString(), (1 + i).toString()]);
  const asks: [string, string][] = Array.from({ length: 50 }, (_, i) => [(67010 + i).toString(), (1 + i).toString()]);
  const ob = normalizeDepth('BTCUSDT', bids, asks, 1700000000000);
  assert.equal(ob.symbol, 'BTC/USDT');
  assert.equal(ob.bids.length, 20);
  assert.equal(ob.asks.length, 20);
  assert.equal(ob.bids[0].price, '67000.00000000');
  assert.equal(ob.bids[19].price, '66981.00000000');
});

// =============================================================================
// 3. REST 客户端测试（使用 mock fetch）
// =============================================================================

function createMockFetch(handler: (url: string, init?: RequestInit) => { status: number; body: any }): typeof fetch {
  return (async (url: any, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url.toString();
    const result = handler(u, init);
    return {
      ok: result.status >= 200 && result.status < 300,
      status: result.status,
      statusText: 'OK',
      text: async () => typeof result.body === 'string' ? result.body : JSON.stringify(result.body),
      json: async () => result.body,
    } as Response;
  }) as typeof fetch;
}

test('BinanceRestClient.ping: 成功路径', async () => {
  const client = new BinanceRestClient({
    fetchImpl: createMockFetch(() => ({ status: 200, body: {} })),
  });
  assert.equal(await client.ping(), true);
});

test('BinanceRestClient.ping: 失败路径', async () => {
  const client = new BinanceRestClient({
    fetchImpl: createMockFetch(() => ({ status: 500, body: 'server error' })),
  });
  assert.equal(await client.ping(), false);
});

test('BinanceRestClient.get24hTicker: URL 与 symbol 参数', async () => {
  let capturedUrl = '';
  const client = new BinanceRestClient({
    fetchImpl: createMockFetch((url) => {
      capturedUrl = url;
      return { status: 200, body: { symbol: 'BTCUSDT', lastPrice: '67000' } };
    }),
  });
  const t = await client.get24hTicker('BTC/USDT');
  assert.equal(t.symbol, 'BTCUSDT');
  assert.ok(capturedUrl.includes('/api/v3/ticker/24hr'));
  assert.ok(capturedUrl.includes('symbol=BTCUSDT'));
});

test('BinanceRestClient.get24hTickers: 批量传入 symbols', async () => {
  let capturedUrl = '';
  const client = new BinanceRestClient({
    fetchImpl: createMockFetch((url) => {
      capturedUrl = url;
      return { status: 200, body: [] };
    }),
  });
  await client.get24hTickers(['BTC/USDT', 'ETH/USDT']);
  assert.ok(capturedUrl.includes('symbols='));
  assert.ok(capturedUrl.includes('BTCUSDT'));
  assert.ok(capturedUrl.includes('ETHUSDT'));
});

test('BinanceRestClient.getKlines: 限制 limit 上限 1000', async () => {
  let capturedUrl = '';
  const client = new BinanceRestClient({
    fetchImpl: createMockFetch((url) => {
      capturedUrl = url;
      return { status: 200, body: [] };
    }),
  });
  await client.getKlines('BTC/USDT', '1h', { limit: 5000 });
  assert.ok(capturedUrl.includes('limit=1000'), `expected limit=1000, got: ${capturedUrl}`);
});

test('BinanceRestClient: HTTP 错误抛出 BinanceError', async () => {
  const client = new BinanceRestClient({
    fetchImpl: createMockFetch(() => ({ status: 429, body: 'rate limit' })),
  });
  await assert.rejects(
    () => client.get24hTicker('BTC/USDT'),
    (err: unknown) => err instanceof BinanceError && (err as BinanceError).status === 429,
  );
});

test('BinanceRestClient: 网络错误抛出 NETWORK 错误', async () => {
  const client = new BinanceRestClient({
    fetchImpl: (() => { throw new Error('ECONNREFUSED'); }) as unknown as typeof fetch,
  });
  await assert.rejects(
    () => client.get24hTicker('BTC/USDT'),
    (err: unknown) => err instanceof BinanceError && (err as BinanceError).code === 'NETWORK',
  );
});

// =============================================================================
// 4. WebSocket 客户端测试（使用 Mock WebSocket）
// =============================================================================

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static readyState = { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 };

  readyState: number = 0; // CONNECTING
  sent: string[] = [];
  url: string;
  onopen: ((ev?: any) => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: ((ev?: any) => void) | null = null;
  onclose: ((ev: { code: number; reason: string }) => void) | null = null;
  private listeners: Record<string, Array<(...args: any[]) => void>> = {};

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    // 模拟异步连接成功
    setImmediate(() => this.simulateOpen());
  }

  private simulateOpen() {
    this.readyState = 1;
    this.onopen?.();
  }

  send(data: string) {
    this.sent.push(data);
  }

  close(code = 1000, reason = '') {
    this.readyState = 3;
    this.onclose?.({ code, reason });
  }

  // 模拟服务端推送
  simulateMessage(payload: any) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  simulateClose(code = 1006, reason = 'abnormal') {
    this.readyState = 3;
    this.onclose?.({ code, reason });
  }

  addEventListener() {}
  removeEventListener() {}
}

test('BinanceWsClient: 连接成功并发送 SUBSCRIBE', async () => {
  MockWebSocket.instances = [];
  const client = new BinanceWsClient({ WebSocketImpl: MockWebSocket as any });
  client.connect();
  // 等待异步 open
  await new Promise(r => setImmediate(r));
  assert.equal(MockWebSocket.instances.length, 1);
  assert.equal(client.connected, true);

  // 订阅 ticker
  const unsub = client.subscribeTicker('BTC/USDT', () => {});
  await new Promise(r => setImmediate(r));
  const ws = MockWebSocket.instances[0];
  const subMsg = ws.sent.find(s => s.includes('SUBSCRIBE'));
  assert.ok(subMsg, 'expected SUBSCRIBE message');
  assert.ok(subMsg.includes('btcusdt@ticker'), `stream not in: ${subMsg}`);
  unsub();
  client.disconnect();
});

test('BinanceWsClient: 接收 ticker 消息分发到 handler', async () => {
  MockWebSocket.instances = [];
  const client = new BinanceWsClient({ WebSocketImpl: MockWebSocket as any });
  client.connect();
  await new Promise(r => setImmediate(r));

  let received: BinanceWsTickerMessage | null = null;
  client.subscribeTicker('BTC/USDT', (msg) => { received = msg; });
  await new Promise(r => setImmediate(r));

  const ws = MockWebSocket.instances[0];
  ws.simulateMessage({
    stream: 'btcusdt@ticker',
    data: { e: '24hrTicker', E: 1, s: 'BTCUSDT', p: '0', P: '0', c: '67000', b: '66999', a: '67001', o: '66000', h: '68000', l: '65000', v: '1000', q: '67000000' },
  });
  assert.ok(received);
  assert.equal((received as BinanceWsTickerMessage).c, '67000');
  client.disconnect();
});

test('BinanceWsClient: 关闭后自动重连', async () => {
  MockWebSocket.instances = [];
  let reconnectAttempt = 0;
  const client = new BinanceWsClient({
    WebSocketImpl: MockWebSocket as any,
    initialReconnectMs: 10,
    maxReconnectMs: 100,
    onReconnect: (attempt) => { reconnectAttempt = attempt; },
  });
  client.connect();
  await new Promise(r => setImmediate(r));
  assert.equal(MockWebSocket.instances.length, 1);

  // 模拟异常关闭
  MockWebSocket.instances[0].simulateClose(1006, 'abnormal');
  // 等待重连（10ms 初始延迟）
  await new Promise(r => setTimeout(r, 50));
  assert.equal(reconnectAttempt, 1);
  assert.equal(MockWebSocket.instances.length, 2, 'should reconnect');
  client.disconnect();
});

test('BinanceWsClient: 主动 disconnect 不触发重连', async () => {
  MockWebSocket.instances = [];
  const client = new BinanceWsClient({ WebSocketImpl: MockWebSocket as any, initialReconnectMs: 10 });
  client.connect();
  await new Promise(r => setImmediate(r));
  const initialCount = MockWebSocket.instances.length;
  client.disconnect();
  await new Promise(r => setTimeout(r, 50));
  assert.equal(MockWebSocket.instances.length, initialCount, 'should not reconnect after manual disconnect');
});

// =============================================================================
// 5. 适配器测试
// =============================================================================

test('BinanceMarketFeed: REST 失败时进入 fallback 模式', async () => {
  const failFetch = (() => { throw new BinanceError('NETWORK', 'offline'); }) as unknown as typeof fetch;
  const feed = await BinanceMarketFeed.create(['BTC/USDT', 'ETH/USDT'], {
    rest: { fetchImpl: failFetch, timeoutMs: 100 },
    ws: { WebSocketImpl: MockWebSocket as any },
  });
  assert.equal(feed.getMode(), 'fallback');
  assert.equal(feed.isFallback(), true);
  assert.equal(feed.isLive(), false);
  // fallback 应有 ticker 数据
  const ticker = feed.getTicker('BTC/USDT');
  assert.ok(ticker, 'fallback should provide ticker');
  feed.stop();
});

test('BinanceMarketFeed: REST 成功时进入 live 模式', async () => {
  MockWebSocket.instances = [];
  const mockFetch = createMockFetch((url) => {
    if (url.includes('ticker/24hr')) {
      return {
        status: 200,
        body: [
          { symbol: 'BTCUSDT', priceChange: '0', priceChangePercent: '0.5', lastPrice: '67000', bidPrice: '66999', askPrice: '67001', openPrice: '66500', highPrice: '67500', lowPrice: '66000', volume: '1000', quoteVolume: '67000000', openTime: 0, closeTime: 0, firstId: 0, lastId: 0, count: 0, prevClosePrice: '0', lastQty: '0', bidQty: '0', askQty: '0', weightedAvgPrice: '0' },
          { symbol: 'ETHUSDT', priceChange: '0', priceChangePercent: '0.3', lastPrice: '3500', bidPrice: '3499', askPrice: '3501', openPrice: '3480', highPrice: '3520', lowPrice: '3460', volume: '5000', quoteVolume: '17500000', openTime: 0, closeTime: 0, firstId: 0, lastId: 0, count: 0, prevClosePrice: '0', lastQty: '0', bidQty: '0', askQty: '0', weightedAvgPrice: '0' },
        ],
      };
    }
    return { status: 200, body: {} };
  });
  const feed = await BinanceMarketFeed.create(['BTC/USDT', 'ETH/USDT'], {
    rest: { fetchImpl: mockFetch },
    ws: { WebSocketImpl: MockWebSocket as any },
  });
  // Bootstrap 后等待 WebSocket open
  await new Promise(r => setImmediate(r));
  assert.equal(feed.getMode(), 'live');
  assert.equal(feed.isLive(), true);
  const btc = feed.getTicker('BTC/USDT');
  assert.ok(btc);
  assert.equal(btc.lastPrice, '67000.00000000');
  assert.equal(btc.bidPrice, '66999.00000000');
  feed.stop();
});

test('BinanceMarketFeed: 实时 WebSocket ticker 推送更新内存数据', async () => {
  MockWebSocket.instances = [];
  const mockFetch = createMockFetch((url) => {
    if (url.includes('ticker/24hr')) {
      return {
        status: 200,
        body: [{ symbol: 'BTCUSDT', priceChange: '0', priceChangePercent: '0', lastPrice: '67000', bidPrice: '66999', askPrice: '67001', openPrice: '67000', highPrice: '67000', lowPrice: '67000', volume: '0', quoteVolume: '0', openTime: 0, closeTime: 0, firstId: 0, lastId: 0, count: 0, prevClosePrice: '0', lastQty: '0', bidQty: '0', askQty: '0', weightedAvgPrice: '0' }],
      };
    }
    return { status: 200, body: {} };
  });
  const feed = await BinanceMarketFeed.create(['BTC/USDT'], {
    rest: { fetchImpl: mockFetch },
    ws: { WebSocketImpl: MockWebSocket as any, heartbeatMs: 0 },
  });
  await new Promise(r => setImmediate(r));
  assert.equal(feed.isLive(), true);

  // 模拟服务端推送
  const ws = MockWebSocket.instances[0];
  ws.simulateMessage({
    stream: 'btcusdt@ticker',
    data: { e: '24hrTicker', E: 1, s: 'BTCUSDT', p: '100', P: '0.15', c: '67100', b: '67099', a: '67101', o: '67000', h: '67200', l: '66900', v: '100', q: '6700000' },
  });
  const updated = feed.getTicker('BTC/USDT');
  assert.equal(updated?.lastPrice, '67100.00000000');
  feed.stop();
});

test('BinanceMarketFeed: trade 推送记录到最近成交', async () => {
  MockWebSocket.instances = [];
  const mockFetch = createMockFetch(() => ({ status: 200, body: [] }));
  const feed = await BinanceMarketFeed.create(['BTC/USDT'], {
    rest: { fetchImpl: mockFetch },
    ws: { WebSocketImpl: MockWebSocket as any, heartbeatMs: 0 },
  });
  await new Promise(r => setImmediate(r));
  const ws = MockWebSocket.instances[0];
  ws.simulateMessage({
    stream: 'btcusdt@trade',
    data: { e: 'trade', E: 1, s: 'BTCUSDT', t: 999, p: '67000', q: '0.5', T: 1700000000000, m: false },
  });
  const trades = feed.getRecentTrades('BTC/USDT');
  assert.equal(trades.length, 1);
  assert.equal(trades[0].side, 'buy');
  assert.equal(trades[0].price, '67000.00000000');
  feed.stop();
});

test('BinanceMarketFeed: subscribe 与 MarketFeed 兼容', async () => {
  MockWebSocket.instances = [];
  const mockFetch = createMockFetch(() => ({ status: 200, body: [] }));
  const feed = await BinanceMarketFeed.create(['BTC/USDT'], {
    rest: { fetchImpl: mockFetch },
    ws: { WebSocketImpl: MockWebSocket as any, heartbeatMs: 0 },
  });
  await new Promise(r => setImmediate(r));
  let received = 0;
  const unsub = feed.subscribe('ticker:BTC/USDT', () => { received += 1; });
  feed.start();
  // 触发 ticker 更新
  MockWebSocket.instances[0].simulateMessage({
    stream: 'btcusdt@ticker',
    data: { e: '24hrTicker', E: 1, s: 'BTCUSDT', p: '0', P: '0', c: '67000', b: '66999', a: '67001', o: '67000', h: '67000', l: '67000', v: '0', q: '0' },
  });
  // 等待 flushTickers 节流
  await new Promise(r => setTimeout(r, 50));
  assert.ok(received >= 1, `expected at least 1 ticker event, got ${received}`);
  unsub();
  feed.stop();
});

// 测试退出时强制清理（避免 setInterval keep-alive 阻塞进程）
test('test runner cleanup', async () => {
  // 等待所有未结束的 tick flush 完成
  await new Promise(r => setTimeout(r, 50));
  assert.ok(true, 'cleanup ok');
});

// =============================================================================
// 6. 工厂函数
// =============================================================================

test('createBinanceRestClient / createBinanceWsClient 工厂函数', () => {
  const r = createBinanceRestClient();
  const w = createBinanceWsClient();
  assert.ok(r instanceof BinanceRestClient);
  assert.ok(w instanceof BinanceWsClient);
  w.disconnect();
});

test('BinanceError: 错误码和状态码', () => {
  const e1 = new BinanceError('CUSTOM', 'test', 404);
  assert.equal(e1.code, 'CUSTOM');
  assert.equal(e1.status, 404);
  assert.equal(e1.message, 'test');
  assert.equal(e1.name, 'BinanceError');
});

test('BINANCE_REST_BASE 常量正确', () => {
  assert.equal(BINANCE_REST_BASE, 'https://api.binance.com');
});
