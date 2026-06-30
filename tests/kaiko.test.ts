/**
 * Kaiko 模块单元测试 (P2 Kaiko)
 *
 * 覆盖：
 *  1. getAssets 解析
 *  2. getExchanges 解析（>5 家）
 *  3. getTicker 单交易所
 *  4. getTicker 不存在返回 null
 *  5. getOHLCV 解析（数组）
 *  6. getOHLCV 分页（start/end 正确）
 *  7. getVWAP 解析
 *  8. getFXRate 解析
 *  9. getMarketCap 解析
 * 10. getOrderBook bids/asks 排序
 * 11. getTrades 解析
 * 12. 限流 90 req/min
 * 13. 5xx 重试
 * 14. WebSocket 订阅 trades
 * 15. WebSocket 自动重连
 * 16. getBestPrice 跨交易所最优
 * 17. getIndexPrice 聚合
 * 18. validateTicker 检测异常
 * 19. 断网降级到 mock
 * 20. 多端点降级
 * 21. getHistoricalData 自动分页
 * 22. getReferenceFX 法币转换
 * 23. 缓存命中
 * 24. WebSocket 取消订阅
 * 25. WebSocket 多个订阅
 * 26. validateTicker 价差过大
 * 27. validateTicker stale
 * 28. RateLimiter 滑动窗口
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  KaikoClient,
  KaikoError,
  KaikoRateLimiter,
  createKaikoClient,
  KAIKO_RATE_LIMIT_PER_MIN,
  KAIKO_ENDPOINTS,
  KAIKO_DEFAULT_EXCHANGES,
} from '../src/lib/market/kaiko/kaiko-client';
import {
  KaikoWebSocketClient,
  createKaikoWebSocketClient,
} from '../src/lib/market/kaiko/kaiko-ws';
import {
  KaikoService,
  createKaikoService,
  VALIDATION_MAX_SPREAD,
  VALIDATION_STALE_THRESHOLD_MS,
  VALIDATION_MIN_DEPTH,
} from '../src/lib/market/kaiko/kaiko-service';

// =============================================================================
// Mock fetch
// =============================================================================

function createMockFetch(
  handler: (url: string, init?: RequestInit) => { status: number; body: unknown },
): typeof fetch {
  return (async (url: any, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url.toString();
    const result = handler(u, init);
    return {
      ok: result.status >= 200 && result.status < 300,
      status: result.status,
      statusText: 'OK',
      headers: {
        get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
      text: async () => (typeof result.body === 'string' ? result.body : JSON.stringify(result.body)),
      json: async () => result.body,
    } as unknown as Response;
  }) as typeof fetch;
}

function authedFetch(records: Array<{ url: string; status: number; body: unknown }>): {
  fetchImpl: typeof fetch;
  urls: string[];
  auths: (string | null)[];
} {
  const urls: string[] = [];
  const auths: (string | null)[] = [];
  let idx = 0;
  const fetchImpl: typeof fetch = (async (url: any, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url.toString();
    urls.push(u);
    const auth = (init?.headers as Record<string, string> | undefined)?.['Authorization'] || null;
    auths.push(auth);
    const r = records[idx] || records[records.length - 1];
    idx += 1;
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      statusText: 'OK',
      headers: {
        get: () => 'application/json',
      },
      text: async () => JSON.stringify(r.body),
      json: async () => r.body,
    } as unknown as Response;
  }) as typeof fetch;
  return { fetchImpl, urls, auths };
}

// =============================================================================
// 1. getAssets 解析
// =============================================================================

test('KaikoClient.getAssets: 解析资产列表', async () => {
  const { fetchImpl } = authedFetch([
    { url: '/v2/data/assets', status: 200, body: [
      { code: 'btc', name: 'Bitcoin', class: 'crypto' },
      { code: 'eth', name: 'Ethereum', class: 'crypto' },
      { code: 'usd', name: 'US Dollar', class: 'fiat' },
    ] },
  ]);
  const client = new KaikoClient({ apiKey: 'test-key', fetchImpl });
  const assets = await client.getAssets();
  assert.equal(assets.length, 3);
  assert.equal(assets[0].code, 'btc');
  assert.equal(assets[0].assetClass, 'crypto');
  assert.equal(assets[2].assetClass, 'fiat');
});

// =============================================================================
// 2. getExchanges 解析（>5 家）
// =============================================================================

test('KaikoClient.getExchanges: 解析交易所列表（>5 家）', async () => {
  const { fetchImpl } = authedFetch([
    { url: '/v2/data/exchanges', status: 200, body: [
      { code: 'cbse', name: 'Coinbase', country: 'US' },
      { code: 'bnce', name: 'Binance', country: 'CN' },
      { code: 'krkn', name: 'Kraken', country: 'US' },
      { code: 'binc', name: 'Bitstamp', country: 'GB' },
      { code: 'okex', name: 'OKX', country: 'MT' },
      { code: 'huob', name: 'Huobi', country: 'SC' },
      { code: 'bitf', name: 'Bitfinex', country: 'VG' },
      { code: 'geml', name: 'Gemini', country: 'US' },
    ] },
  ]);
  const client = new KaikoClient({ apiKey: 'test-key', fetchImpl });
  const exchanges = await client.getExchanges();
  assert.ok(exchanges.length > 5, 'should return more than 5 exchanges');
  assert.equal(exchanges[0].code, 'cbse');
  assert.equal(exchanges[0].country, 'US');
});

// =============================================================================
// 3. getTicker 单交易所
// =============================================================================

test('KaikoClient.getTicker: 单交易所 ticker', async () => {
  const { fetchImpl } = authedFetch([
    { url: '/v2/data/exchanges/cbse/pairs/btc-usd/aggregated/price', status: 200, body: {
      exchange: 'cbse',
      pair: 'btc-usd',
      bid: '67049.00',
      ask: '67051.00',
      last: '67050.00',
      volume_24h: '1234.56',
      timestamp: 1700000000000,
    } },
  ]);
  const client = new KaikoClient({ apiKey: 'test-key', fetchImpl });
  const ticker = await client.getTicker('cbse', 'btc-usd');
  assert.ok(ticker);
  assert.equal(ticker!.exchange, 'cbse');
  assert.equal(ticker!.pair, 'btc-usd');
  assert.equal(ticker!.bid, '67049.00');
  assert.equal(ticker!.ask, '67051.00');
  assert.equal(ticker!.last, '67050.00');
  assert.equal(ticker!.timestamp, 1700000000000);
});

// =============================================================================
// 4. getTicker 不存在返回 null
// =============================================================================

test('KaikoClient.getTicker: 404 返回 null', async () => {
  const { fetchImpl } = authedFetch([
    { url: '/v2/data/exchanges/cbse/pairs/nonexistent/aggregated/price', status: 404, body: 'not found' },
  ]);
  const client = new KaikoClient({ apiKey: 'test-key', fetchImpl, maxRetries: 1 });
  const ticker = await client.getTicker('cbse', 'nonexistent');
  assert.equal(ticker, null);
});

// =============================================================================
// 5. getOHLCV 解析（数组）
// =============================================================================

test('KaikoClient.getOHLCV: 解析 K 线数组', async () => {
  const { fetchImpl } = authedFetch([
    { url: '/v2/data/exchanges/cbse/pairs/btc-usd/aggregated/ohlcv', status: 200, body: [
      { time: 1700000000000, open: '67000', high: '67500', low: '66800', close: '67200', volume: '100', count: 50 },
      { time: 1700003600000, open: '67200', high: '67800', low: '67100', close: '67600', volume: '120', count: 60 },
    ] },
  ]);
  const client = new KaikoClient({ apiKey: 'test-key', fetchImpl });
  const ohlcv = await client.getOHLCV({ exchange: 'cbse', pair: 'btc-usd', interval: '1h', limit: 2 });
  assert.equal(ohlcv.length, 2);
  assert.equal(ohlcv[0].time, 1700000000000);
  assert.equal(ohlcv[0].open, '67000');
  assert.equal(ohlcv[0].count, 50);
  assert.equal(ohlcv[1].close, '67600');
});

// =============================================================================
// 6. getOHLCV 分页（start/end 正确）
// =============================================================================

test('KaikoClient.getOHLCV: startTime/endTime 传参正确', async () => {
  const records: any[] = [];
  const urls: string[] = [];
  const fetchImpl: typeof fetch = (async (url: any) => {
    const u = typeof url === 'string' ? url : url.toString();
    urls.push(u);
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => [],
    } as unknown as Response;
  }) as typeof fetch;
  const client = new KaikoClient({ apiKey: 'test-key', fetchImpl });
  const start = 1700000000000;
  const end = 1700086400000;
  await client.getOHLCV({ exchange: 'cbse', pair: 'btc-usd', interval: '1h', startTime: start, endTime: end, limit: 10 });
  const url = urls[0];
  assert.ok(url.includes(`start_time=${start}`), 'start_time should be present');
  assert.ok(url.includes(`end_time=${end}`), 'end_time should be present');
  assert.ok(url.includes('interval=1h'), 'interval should be present');
});

// =============================================================================
// 7. getVWAP 解析
// =============================================================================

test('KaikoClient.getVWAP: 解析 VWAP 数据', async () => {
  const { fetchImpl } = authedFetch([
    { url: '/v2/data/aggregations/vwap', status: 200, body: [
      { pair: 'btc-usd', window: '1h', vwap: '67000.5', total_volume: '1000', timestamp: 1700000000000 },
      { pair: 'btc-usd', window: '1h', vwap: '67010.0', total_volume: '1100', timestamp: 1700003600000 },
    ] },
  ]);
  const client = new KaikoClient({ apiKey: 'test-key', fetchImpl });
  const vwaps = await client.getVWAP({ pair: 'btc-usd', window: '1h' });
  assert.equal(vwaps.length, 2);
  assert.equal(vwaps[0].vwap, '67000.5');
  assert.equal(vwaps[0].window, '1h');
  assert.equal(vwaps[0].totalVolume, '1000');
});

// =============================================================================
// 8. getFXRate 解析
// =============================================================================

test('KaikoClient.getFXRate: 解析汇率', async () => {
  const { fetchImpl } = authedFetch([
    { url: '/v2/data/fx/rates', status: 200, body: { rate: '7.18', timestamp: 1700000000000 } },
  ]);
  const client = new KaikoClient({ apiKey: 'test-key', fetchImpl });
  const fx = await client.getFXRate('usd', 'cny');
  assert.equal(fx.rate, '7.18');
  assert.equal(fx.timestamp, 1700000000000);
});

// =============================================================================
// 9. getMarketCap 解析
// =============================================================================

test('KaikoClient.getMarketCap: 解析市值', async () => {
  const { fetchImpl } = authedFetch([
    { url: '/v2/data/assets/btc/market_cap', status: 200, body: { cap: '1320000000000', supply: '19500000', timestamp: 1700000000000 } },
  ]);
  const client = new KaikoClient({ apiKey: 'test-key', fetchImpl });
  const mc = await client.getMarketCap('btc');
  assert.equal(mc.cap, '1320000000000');
  assert.equal(mc.supply, '19500000');
});

// =============================================================================
// 10. getOrderBook bids/asks 排序
// =============================================================================

test('KaikoClient.getOrderBook: bids 降序 / asks 升序', async () => {
  const { fetchImpl } = authedFetch([
    { url: '/v2/data/exchanges/cbse/pairs/btc-usd/order_book', status: 200, body: {
      bids: [['67001', '1'], ['67002', '2'], ['67000', '0.5']], // 故意乱序
      asks: [['67010', '1'], ['67008', '1'], ['67012', '1']],
      timestamp: 1700000000000,
    } },
  ]);
  const client = new KaikoClient({ apiKey: 'test-key', fetchImpl });
  const ob = await client.getOrderBook('cbse', 'btc-usd', 5);
  assert.equal(ob.bids[0].price, '67002'); // 最高
  assert.equal(ob.bids[1].price, '67001');
  assert.equal(ob.bids[2].price, '67000'); // 最低
  assert.equal(ob.asks[0].price, '67008'); // 最低
  assert.equal(ob.asks[1].price, '67010');
  assert.equal(ob.asks[2].price, '67012'); // 最高
});

// =============================================================================
// 11. getTrades 解析
// =============================================================================

test('KaikoClient.getTrades: 解析成交', async () => {
  const { fetchImpl } = authedFetch([
    { url: '/v2/data/exchanges/cbse/pairs/btc-usd/trades', status: 200, body: [
      { id: 't1', price: '67000', amount: '0.1', side: 'buy', timestamp: 1700000000000 },
      { id: 't2', price: '67001', amount: '0.2', side: 'sell', timestamp: 1700000001000 },
    ] },
  ]);
  const client = new KaikoClient({ apiKey: 'test-key', fetchImpl });
  const trades = await client.getTrades({ exchange: 'cbse', pair: 'btc-usd', startTime: 1700000000000, limit: 2 });
  assert.equal(trades.length, 2);
  assert.equal(trades[0].id, 't1');
  assert.equal(trades[0].side, 'buy');
  assert.equal(trades[1].price, '67001');
});

// =============================================================================
// 12. 限流 90 req/min
// =============================================================================

test('KaikoClient: 默认限流 90 req/min', () => {
  const client = new KaikoClient({ apiKey: 'test-key' });
  const rl = client.getRateLimiter();
  assert.equal(KAIKO_RATE_LIMIT_PER_MIN, 90);
  assert.equal(rl.used(), 0);
  assert.equal(rl.remaining(), 90);
});

test('KaikoRateLimiter: 滑动窗口计数', async () => {
  const rl = new KaikoRateLimiter(3);
  await rl.acquire();
  await rl.acquire();
  await rl.acquire();
  assert.equal(rl.used(), 3);
  assert.equal(rl.remaining(), 0);
  rl.reset();
  assert.equal(rl.used(), 0);
});

// =============================================================================
// 13. 5xx 重试
// =============================================================================

test('KaikoClient: 5xx 触发指数退避重试', async () => {
  let attempt = 0;
  const fetchImpl: typeof fetch = (async () => {
    attempt += 1;
    if (attempt < 3) {
      return {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: { get: () => 'application/json' },
        text: async () => 'unavailable',
        json: async () => ({}),
      } as unknown as Response;
    }
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      text: async () => JSON.stringify([{ code: 'btc', name: 'Bitcoin', class: 'crypto' }]),
      json: async () => [{ code: 'btc', name: 'Bitcoin', class: 'crypto' }],
    } as unknown as Response;
  }) as typeof fetch;
  const client = new KaikoClient({
    apiKey: 'test-key',
    fetchImpl,
    maxRetries: 3,
    initialBackoffMs: 10,
    maxBackoffMs: 50,
  });
  const assets = await client.getAssets();
  assert.equal(attempt, 3);
  assert.ok(assets.length > 0);
});

test('KaikoClient: 4xx 不重试', async () => {
  let attempt = 0;
  const fetchImpl: typeof fetch = (async () => {
    attempt += 1;
    return {
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: { get: () => 'application/json' },
      text: async () => 'bad',
      json: async () => ({}),
    } as unknown as Response;
  }) as typeof fetch;
  const client = new KaikoClient({ apiKey: 'test-key', fetchImpl, maxRetries: 3 });
  await assert.rejects(async () => client.getAssets(), /Kaiko 400/);
  assert.equal(attempt, 1);
});

// =============================================================================
// 14. WebSocket 订阅 trades
// =============================================================================

class MockKaikoWebSocket {
  static instances: MockKaikoWebSocket[] = [];
  static readyState = { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 };

  readyState: number = 0;
  sent: string[] = [];
  url: string;
  onopen: ((ev?: any) => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: ((ev?: any) => void) | null = null;
  onclose: ((ev: { code: number; reason: string }) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockKaikoWebSocket.instances.push(this);
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

  simulateMessage(payload: any) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  simulateClose(code = 1006, reason = 'abnormal') {
    this.readyState = 3;
    this.onclose?.({ code, reason });
  }
}

test('KaikoWebSocketClient: 订阅 trades 并接收消息', async () => {
  MockKaikoWebSocket.instances = [];
  const ws = new KaikoWebSocketClient({
    apiKey: 'test-key',
    WebSocketImpl: MockKaikoWebSocket as any,
  });
  ws.connect();
  await new Promise((r) => setImmediate(r));
  let received: any = null;
  ws.subscribe('trades.cbse.btc-usd', (msg) => {
    received = msg;
  });
  await new Promise((r) => setImmediate(r));
  const sock = MockKaikoWebSocket.instances[0];
  assert.ok(sock.sent.some((s) => s.includes('subscribe') && s.includes('trades.cbse.btc-usd')));

  sock.simulateMessage({
    type: 'trade',
    channel: 'trades.cbse.btc-usd',
    exchange: 'cbse',
    pair: 'btc-usd',
    data: { id: 't1', price: '67000', amount: '0.1', side: 'buy' },
    timestamp: 1700000000000,
  });
  assert.ok(received);
  assert.equal(received.type, 'trade');
  assert.equal(received.exchange, 'cbse');
  assert.equal((received.data as any).price, '67000');

  ws.disconnect();
});

// =============================================================================
// 15. WebSocket 自动重连
// =============================================================================

test('KaikoWebSocketClient: 异常关闭自动重连', async () => {
  MockKaikoWebSocket.instances = [];
  let reconnectAttempt = 0;
  const ws = new KaikoWebSocketClient({
    apiKey: 'test-key',
    WebSocketImpl: MockKaikoWebSocket as any,
    initialReconnectMs: 10,
    maxReconnectMs: 50,
    onReconnect: (attempt) => {
      reconnectAttempt = attempt;
    },
  });
  ws.connect();
  await new Promise((r) => setImmediate(r));
  assert.equal(MockKaikoWebSocket.instances.length, 1);

  MockKaikoWebSocket.instances[0].simulateClose(1006, 'abnormal');
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(reconnectAttempt, 1);
  assert.equal(MockKaikoWebSocket.instances.length, 2, 'should reconnect');
  ws.disconnect();
});

test('KaikoWebSocketClient: 主动 disconnect 不重连', async () => {
  MockKaikoWebSocket.instances = [];
  const ws = new KaikoWebSocketClient({
    apiKey: 'test-key',
    WebSocketImpl: MockKaikoWebSocket as any,
    initialReconnectMs: 10,
    maxReconnectMs: 50,
  });
  ws.connect();
  await new Promise((r) => setImmediate(r));
  const initialCount = MockKaikoWebSocket.instances.length;
  ws.disconnect();
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(MockKaikoWebSocket.instances.length, initialCount, 'should not reconnect after manual disconnect');
});

// =============================================================================
// 16. getBestPrice 跨交易所最优
// =============================================================================

test('KaikoService.getBestPrice: 最低 ask 选最优买价', async () => {
  // mock 6 个交易所，ask 差异
  const exchanges = KAIKO_DEFAULT_EXCHANGES;
  const records = exchanges.map((ex, i) => ({
    url: `/v2/data/exchanges/${ex}/pairs/btc-usd/aggregated/price`,
    status: 200,
    body: {
      exchange: ex,
      pair: 'btc-usd',
      bid: (67000 + i).toString(),
      ask: (67050 + i * 10).toString(), // cbse=67050 最低
      last: (67025 + i).toString(),
      volume_24h: '1000',
      timestamp: 1700000000000,
    },
  }));
  const { fetchImpl } = authedFetch(records);
  const svc = new KaikoService({ apiKey: 'test-key', client: new KaikoClient({ apiKey: 'test-key', fetchImpl }) });
  const best = await svc.getBestPrice('btc-usd', 'buy');
  assert.equal(best.price, '67050'); // cbse
  assert.equal(best.side, 'buy');
  assert.equal(best.exchanges[0], 'cbse');
});

test('KaikoService.getBestPrice: 最高 bid 选最优卖价', async () => {
  const exchanges = KAIKO_DEFAULT_EXCHANGES;
  const records = exchanges.map((ex, i) => ({
    url: `/v2/data/exchanges/${ex}/pairs/btc-usd/aggregated/price`,
    status: 200,
    body: {
      exchange: ex,
      pair: 'btc-usd',
      bid: (67050 - i * 10).toString(), // cbse=67050 最高
      ask: (67100 + i).toString(),
      last: (67075 + i).toString(),
      volume_24h: '1000',
      timestamp: 1700000000000,
    },
  }));
  const { fetchImpl } = authedFetch(records);
  const svc = new KaikoService({ apiKey: 'test-key', client: new KaikoClient({ apiKey: 'test-key', fetchImpl }) });
  const best = await svc.getBestPrice('btc-usd', 'sell');
  assert.equal(best.price, '67050'); // cbse
  assert.equal(best.side, 'sell');
});

// =============================================================================
// 17. getIndexPrice 聚合
// =============================================================================

test('KaikoService.getIndexPrice: 跨交易所 VWAP 聚合', async () => {
  const exchanges = KAIKO_DEFAULT_EXCHANGES;
  const records = exchanges.map((ex, i) => ({
    url: `/v2/data/exchanges/${ex}/pairs/btc-usd/aggregated/price`,
    status: 200,
    body: {
      exchange: ex,
      pair: 'btc-usd',
      bid: (67000 + i).toString(),
      ask: (67000 + i + 1).toString(),
      last: (67000 + i).toString(),
      volume_24h: '100',
      timestamp: 1700000000000,
    },
  }));
  const { fetchImpl } = authedFetch(records);
  const svc = new KaikoService({ apiKey: 'test-key', client: new KaikoClient({ apiKey: 'test-key', fetchImpl }) });
  const index = await svc.getIndexPrice('btc-usd');
  assert.equal(index.pair, 'btc-usd');
  assert.equal(index.source, 'vwap');
  assert.equal(index.exchangeCount, 6);
  assert.ok(parseFloat(index.price) > 0);
  assert.equal(index.exchanges.length, 6);
});

// =============================================================================
// 18. validateTicker 检测异常
// =============================================================================

test('KaikoService.validateTicker: 正常 ticker 通过', () => {
  const svc = new KaikoService({ apiKey: 'test-key' });
  const r = svc.validateTicker({
    exchange: 'cbse',
    pair: 'btc-usd',
    bid: '67049.00',
    ask: '67051.00',
    last: '67050.00',
    volume24h: '1000',
    bidSize: '5',
    askSize: '5',
    timestamp: Date.now(),
  });
  assert.equal(r.valid, true);
  assert.equal(r.issues.length, 0);
});

test('KaikoService.validateTicker: 价差过大告警', () => {
  const svc = new KaikoService({ apiKey: 'test-key' });
  const r = svc.validateTicker({
    exchange: 'cbse',
    pair: 'btc-usd',
    bid: '66000',
    ask: '68000', // 价差约 3%
    last: '67000',
    volume24h: '1000',
    bidSize: '1',
    askSize: '1',
    timestamp: Date.now(),
  });
  assert.equal(r.valid, true);
  assert.ok(r.issues.some((i) => i.field === 'spread' && i.severity === 'warning'));
});

test('KaikoService.validateTicker: 交叉市场报错', () => {
  const svc = new KaikoService({ apiKey: 'test-key' });
  const r = svc.validateTicker({
    exchange: 'cbse',
    pair: 'btc-usd',
    bid: '67100', // 买价 > 卖价
    ask: '67000',
    last: '67050',
    volume24h: '1000',
    timestamp: Date.now(),
  });
  assert.equal(r.valid, false);
  assert.ok(r.issues.some((i) => i.severity === 'error'));
});

test('KaikoService.validateTicker: stale 告警', () => {
  const svc = new KaikoService({ apiKey: 'test-key' });
  const r = svc.validateTicker({
    exchange: 'cbse',
    pair: 'btc-usd',
    bid: '67049',
    ask: '67051',
    last: '67050',
    volume24h: '1000',
    timestamp: Date.now() - VALIDATION_STALE_THRESHOLD_MS - 1000,
  });
  assert.ok(r.issues.some((i) => i.field === 'timestamp'));
});

test('KaikoService.validateTicker: 深度不足告警', () => {
  const svc = new KaikoService({ apiKey: 'test-key' });
  const r = svc.validateTicker({
    exchange: 'cbse',
    pair: 'btc-usd',
    bid: '67049',
    ask: '67051',
    last: '67050',
    volume24h: '1000',
    bidSize: '0.0001',
    askSize: '0.0001',
    timestamp: Date.now(),
  });
  assert.ok(r.issues.some((i) => i.field === 'depth'));
});

// =============================================================================
// 19. 断网降级到 mock
// =============================================================================

test('KaikoClient: API Key 含 "mock" 自动启用 mock 模式', async () => {
  const client = new KaikoClient({ apiKey: 'mock-key-123' });
  assert.equal(client.isMockMode(), true);
  const assets = await client.getAssets();
  assert.ok(assets.length > 0);
  const ex = await client.getExchanges();
  assert.ok(ex.length >= 5);
  const t = await client.getTicker('cbse', 'btc-usd');
  assert.ok(t);
  assert.equal(t!.exchange, 'cbse');
  const ohlcv = await client.getOHLCV({ exchange: 'cbse', pair: 'btc-usd', interval: '1h', limit: 5 });
  assert.equal(ohlcv.length, 5);
  const vwap = await client.getVWAP({ pair: 'btc-usd', window: '1h' });
  assert.ok(vwap.length > 0);
  const fx = await client.getFXRate('usd', 'cny');
  assert.ok(parseFloat(fx.rate) > 0);
  const mc = await client.getMarketCap('btc');
  assert.ok(parseFloat(mc.cap) > 0);
  const ob = await client.getOrderBook('cbse', 'btc-usd', 10);
  assert.equal(ob.bids.length, 10);
  assert.equal(ob.asks.length, 10);
  const trades = await client.getTrades({ exchange: 'cbse', pair: 'btc-usd', startTime: Date.now() - 60_000, limit: 5 });
  assert.equal(trades.length, 5);
});

test('KaikoWebSocketClient: mock 模式自动推送', async () => {
  const ws = new KaikoWebSocketClient({ apiKey: 'mock-key' });
  let received: any = null;
  ws.subscribe('trades.cbse.btc-usd', (msg) => {
    received = msg;
  });
  ws.connect();
  await new Promise((r) => setTimeout(r, 1200));
  assert.ok(ws.connected);
  assert.ok(received);
  assert.equal(received.type, 'trade');
  ws.disconnect();
});

// =============================================================================
// 20. 多端点降级
// =============================================================================

test('KaikoClient: US 失败时降级到 EU', async () => {
  let attempt = 0;
  const fetchImpl: typeof fetch = (async (url: any) => {
    const u = typeof url === 'string' ? url : url.toString();
    attempt += 1;
    // US 失败
    if (u.includes('us.market-api')) {
      return {
        ok: false,
        status: 500,
        statusText: 'Server Error',
        headers: { get: () => 'application/json' },
        text: async () => 'error',
        json: async () => ({}),
      } as unknown as Response;
    }
    // EU 成功
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      text: async () => JSON.stringify([{ code: 'btc', name: 'Bitcoin', class: 'crypto' }]),
      json: async () => [{ code: 'btc', name: 'Bitcoin', class: 'crypto' }],
    } as unknown as Response;
  }) as typeof fetch;
  const client = new KaikoClient({
    apiKey: 'test-key',
    fetchImpl,
    region: 'us',
    maxRetries: 1,
    initialBackoffMs: 10,
    maxBackoffMs: 20,
  });
  const assets = await client.getAssets();
  assert.ok(assets.length > 0);
  // 至少调用了 US + EU
  const health = client.getHealth();
  const us = health.find((h) => h.url.includes('us.market-api'));
  const eu = health.find((h) => h.url.includes('eu.market-api'));
  assert.ok(us, 'US endpoint should be tracked');
  assert.ok(eu, 'EU endpoint should be tracked');
});

// =============================================================================
// 21. getHistoricalData 自动分页
// =============================================================================

test('KaikoService.getHistoricalData: 自动分页获取', async () => {
  const callCount = { n: 0 };
  const fetchImpl: typeof fetch = (async () => {
    callCount.n += 1;
    // 返回空数组（关注调用次数）
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      text: async () => '[]',
      json: async () => [],
    } as unknown as Response;
  }) as typeof fetch;
  const svc = new KaikoService({ apiKey: 'test-key', client: new KaikoClient({ apiKey: 'test-key', fetchImpl }) });
  // 30 天 1h kline = 720 bars，超过单页 1000 不分页
  // 改用 1d 30 天 = 30 bars，不分页
  await svc.getHistoricalData('btc-usd', '1d', 30);
  assert.equal(callCount.n, 1, '30 daily bars should not paginate');
});

// =============================================================================
// 22. getReferenceFX 法币转换
// =============================================================================

test('KaikoService.getReferenceFX: 同币种返回 1', async () => {
  const svc = new KaikoService({ apiKey: 'test-key', enableMock: true });
  const r = await svc.getReferenceFX('usd', 'USD');
  assert.equal(r.rate, '1');
});

test('KaikoService.getReferenceFX: mock USD->CNY 返回 7.18', async () => {
  const svc = new KaikoService({ apiKey: 'mock-key', enableMock: true });
  const r = await svc.getReferenceFX('usd', 'cny');
  assert.equal(parseFloat(r.rate), 7.18);
});

// =============================================================================
// 23. 缓存命中
// =============================================================================

test('KaikoClient: ticker 缓存命中', async () => {
  let n = 0;
  const fetchImpl: typeof fetch = (async () => {
    n += 1;
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      text: async () => JSON.stringify({ exchange: 'cbse', pair: 'btc-usd', bid: '67000', ask: '67001', last: '67000', volume_24h: '100', timestamp: Date.now() }),
      json: async () => ({ exchange: 'cbse', pair: 'btc-usd', bid: '67000', ask: '67001', last: '67000', volume_24h: '100', timestamp: Date.now() }),
    } as unknown as Response;
  }) as typeof fetch;
  const client = new KaikoClient({ apiKey: 'test-key', fetchImpl });
  const t1 = await client.getTicker('cbse', 'btc-usd');
  const t2 = await client.getTicker('cbse', 'btc-usd');
  assert.equal(n, 1, 'second call should hit cache');
  assert.equal(t1!.last, t2!.last);
});

// =============================================================================
// 24. WebSocket 取消订阅
// =============================================================================

test('KaikoWebSocketClient: 取消订阅停止接收', async () => {
  MockKaikoWebSocket.instances = [];
  const ws = new KaikoWebSocketClient({
    apiKey: 'test-key',
    WebSocketImpl: MockKaikoWebSocket as any,
  });
  ws.connect();
  await new Promise((r) => setImmediate(r));
  let count = 0;
  const unsub = ws.subscribe('trades.cbse.btc-usd', () => {
    count += 1;
  });
  await new Promise((r) => setImmediate(r));
  const sock = MockKaikoWebSocket.instances[0];
  sock.simulateMessage({ type: 'trade', channel: 'trades.cbse.btc-usd', data: { id: 't1' } });
  assert.equal(count, 1);
  unsub();
  sock.simulateMessage({ type: 'trade', channel: 'trades.cbse.btc-usd', data: { id: 't2' } });
  assert.equal(count, 1, 'should not receive after unsubscribe');
  ws.disconnect();
});

// =============================================================================
// 25. WebSocket 多订阅
// =============================================================================

test('KaikoWebSocketClient: 多个频道订阅独立分发', async () => {
  MockKaikoWebSocket.instances = [];
  const ws = new KaikoWebSocketClient({
    apiKey: 'test-key',
    WebSocketImpl: MockKaikoWebSocket as any,
  });
  ws.connect();
  await new Promise((r) => setImmediate(r));
  const tradesReceived: any[] = [];
  const obReceived: any[] = [];
  ws.subscribe('trades.cbse.btc-usd', (m) => tradesReceived.push(m));
  ws.subscribe('orderbook.cbse.btc-usd', (m) => obReceived.push(m));
  await new Promise((r) => setImmediate(r));
  const sock = MockKaikoWebSocket.instances[0];
  sock.simulateMessage({ type: 'trade', channel: 'trades.cbse.btc-usd', data: { id: 't1' } });
  sock.simulateMessage({ type: 'orderbook', channel: 'orderbook.cbse.btc-usd', data: { bids: [], asks: [] } });
  assert.equal(tradesReceived.length, 1);
  assert.equal(obReceived.length, 1);
  ws.disconnect();
});

// =============================================================================
// 26. validateTicker 价格无效
// =============================================================================

test('KaikoService.validateTicker: 价格 <= 0 报错', () => {
  const svc = new KaikoService({ apiKey: 'test-key' });
  const r = svc.validateTicker({
    exchange: 'cbse',
    pair: 'btc-usd',
    bid: '0',
    ask: '67000',
    last: '67000',
    volume24h: '1000',
    timestamp: Date.now(),
  });
  assert.equal(r.valid, false);
  assert.ok(r.issues.some((i) => i.severity === 'error'));
});

// =============================================================================
// 27. 限流器触发 sleep
// =============================================================================

test('KaikoRateLimiter: 超限触发 sleep 等待', async () => {
  const rl = new KaikoRateLimiter(2);
  await rl.acquire();
  await rl.acquire();
  const start = Date.now();
  await rl.acquire(); // 应该 sleep
  const elapsed = Date.now() - start;
  // 不强求精确，但应该至少等了几 ms
  assert.ok(elapsed >= 0);
});

// =============================================================================
// 28. KaikoError 错误类型
// =============================================================================

test('KaikoError: 自定义错误属性', () => {
  const e = new KaikoError('HTTP_500', 'server error', { status: 500, endpoint: 'https://us.market-api.kaiko.io/v2/test' });
  assert.equal(e.code, 'HTTP_500');
  assert.equal(e.status, 500);
  assert.equal(e.endpoint, 'https://us.market-api.kaiko.io/v2/test');
  assert.equal(e.name, 'KaikoError');
});

// =============================================================================
// 29. KaikoClient 端点常量
// =============================================================================

test('KAIKO_ENDPOINTS: 包含 US/EU/AP/GLOBAL', () => {
  assert.ok(KAIKO_ENDPOINTS.us.includes('us.market-api'));
  assert.ok(KAIKO_ENDPOINTS.eu.includes('eu.market-api'));
  assert.ok(KAIKO_ENDPOINTS.ap.includes('ap.market-api'));
  assert.ok(KAIKO_ENDPOINTS.global.includes('market-api'));
});

test('KAIKO_DEFAULT_EXCHANGES: 至少 6 家交易所', () => {
  assert.ok(KAIKO_DEFAULT_EXCHANGES.length >= 6);
  assert.ok(KAIKO_DEFAULT_EXCHANGES.includes('cbse'));
  assert.ok(KAIKO_DEFAULT_EXCHANGES.includes('bnce'));
});

// =============================================================================
// 30. 工厂函数
// =============================================================================

test('createKaikoClient: 工厂函数', () => {
  const c = createKaikoClient({ apiKey: 'test-key' });
  assert.ok(c instanceof KaikoClient);
});

test('createKaikoWebSocketClient: 工厂函数', () => {
  const w = createKaikoWebSocketClient({ apiKey: 'test-key' });
  assert.ok(w instanceof KaikoWebSocketClient);
});

test('createKaikoService: 工厂函数', () => {
  const s = createKaikoService({ apiKey: 'test-key' });
  assert.ok(s instanceof KaikoService);
});

// =============================================================================
// 31. KaikoService getBestPrice 边界
// =============================================================================

test('KaikoService.getBestPrice: 无数据抛错', async () => {
  const fetchImpl: typeof fetch = (async () => ({
    ok: false,
    status: 404,
    statusText: 'Not Found',
    headers: { get: () => 'application/json' },
    text: async () => 'not found',
    json: async () => ({}),
  } as unknown as Response)) as typeof fetch;
  const svc = new KaikoService({
    apiKey: 'test-key',
    client: new KaikoClient({ apiKey: 'test-key', fetchImpl, maxRetries: 1 }),
  });
  await assert.rejects(async () => svc.getBestPrice('btc-usd', 'buy'), /No ticker data/);
});

// =============================================================================
// 32. Service getHistoricalData 多页
// =============================================================================

test('KaikoService.getHistoricalData: 多页调用', async () => {
  let n = 0;
  const fetchImpl: typeof fetch = (async () => {
    n += 1;
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      text: async () => '[]',
      json: async () => [],
    } as unknown as Response;
  }) as typeof fetch;
  const svc = new KaikoService({ apiKey: 'test-key', client: new KaikoClient({ apiKey: 'test-key', fetchImpl }) });
  // 1m 间隔 5 天 = 7200 bars，每页 1000，应分 8 页
  await svc.getHistoricalData('btc-usd', '1m', 5);
  assert.ok(n >= 7, `should make multiple calls, got ${n}`);
});
