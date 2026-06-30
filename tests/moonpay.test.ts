/**
 * MoonPay 第三方买币集成测试
 *
 * 覆盖 16+ 个核心场景：
 *  1. getCurrencies 解析（mock 模式）
 *  2. getCurrency 单个查询
 *  3. getExchangeLimits 解析
 *  4. getPrice 计算
 *  5. createTransaction 返回 redirectUrl（mock 模式）
 *  6. getTransaction 状态查询（mock 模式）
 *  7. 真实 API 模式：getCurrencies 解析
 *  8. TransactionManager createBuyOrder
 *  9. TransactionManager 状态机流转
 * 10. updateOrderFromWebhook（4 种事件）
 * 11. 订单与 user 关联
 * 12. 限流保护（同用户短时间重复下单）
 * 13. 5xx 重试
 * 14. 断网降级到 mock（API Key 无效时）
 * 15. Webhook 签名校验（正 / 错 / 缺）
 * 16. 完整流程：创建 → webhook → 完成
 * 17. 订单过期清理
 * 18. subscribe（onOrderUpdate）触发
 *
 * 运行：npx tsx --test tests/moonpay.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import {
  MoonPayClient,
  MoonPayTransactionManager,
  MoonPayApiError,
  MoonPayManagerError,
  MOONPAY_API_KEY_PUBLIC,
  MOONPAY_API_KEY_SECRET,
  MOONPAY_WIDGET_BASE,
  MOONPAY_DEFAULT_BASE_CURRENCY,
  verifyMoonPaySignature,
  signMoonPayWebhook,
  MoonPayWebhookSignatureError,
  handleMoonPayWebhook,
  type BuyOrder,
} from '../src/lib/onramp';

// =============================================================================
// 测试常量
// =============================================================================

const USER_WALLET = '0x' + 'a'.repeat(40);
const TEST_SECRET = 'test-webhook-secret-' + Date.now().toString(36);

function buildMockClient(opts: Partial<ConstructorParameters<typeof MoonPayClient>[0]> = {}): MoonPayClient {
  return new MoonPayClient({
    apiKeyPublic: 'pk_test_mock',
    apiKeySecret: 'sk_test_mock',
    fetchImpl: opts.fetchImpl,
    maxRetries: opts.maxRetries ?? 0,
    backoffBaseMs: opts.backoffBaseMs ?? 10,
    timeoutMs: opts.timeoutMs ?? 1000,
    ...opts,
  });
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

function textResponse(status: number, body: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERR',
    text: async () => body,
    json: async () => JSON.parse(body),
  } as Response;
}

// =============================================================================
// 1. getCurrencies（mock 模式）
// =============================================================================

test('MoonPayClient.getCurrencies: mock 模式返回内置列表', async () => {
  const client = buildMockClient();
  const list = await client.getCurrencies();
  assert.ok(list.length > 0, 'should have currencies');
  const usdt = list.find((c) => c.code === 'usdt' || c.id === 'usdt');
  assert.ok(usdt, 'should include usdt');
  assert.equal(usdt!.type, 'crypto');
  assert.ok(typeof usdt!.minAmount === 'number');
});

// =============================================================================
// 2. getCurrency 单个查询
// =============================================================================

test('MoonPayClient.getCurrency: 返回指定币种详情', async () => {
  const client = buildMockClient();
  const ccy = await client.getCurrency('usdt');
  assert.ok(ccy);
  assert.equal(ccy!.code, 'usdt');
  assert.equal(ccy!.type, 'crypto');
  assert.ok(ccy!.isBuySupported);

  const missing = await client.getCurrency('not-a-real-coin-xxx');
  assert.equal(missing, null);
});

// =============================================================================
// 3. getExchangeLimits 解析
// =============================================================================

test('MoonPayClient.getExchangeLimits: 解析 min/max 限额', async () => {
  const client = buildMockClient();
  const lim = await client.getExchangeLimits('usdt', 'usd');
  assert.equal(lim.cryptoCurrency, 'usdt');
  assert.equal(lim.baseCurrency, 'usd');
  assert.ok(lim.minBaseAmount > 0);
  assert.ok(lim.maxBaseAmount >= lim.minBaseAmount);
  assert.ok(lim.minCryptoAmount > 0);
  assert.ok(lim.maxCryptoAmount >= lim.minCryptoAmount);
  assert.equal(lim.source, 'mock');
});

// =============================================================================
// 4. getPrice 计算
// =============================================================================

test('MoonPayClient.getPrice: 计算 baseAmount / cryptoAmount / rate', async () => {
  const client = buildMockClient();
  const p = await client.getPrice({
    cryptoCurrency: 'usdt',
    baseCurrency: 'usd',
    amount: 100,
  });
  assert.equal(p.baseCurrency, 'usd');
  assert.equal(p.cryptoCurrency, 'usdt');
  assert.equal(p.baseAmount, 100);
  assert.ok(p.cryptoAmount > 0);
  assert.ok(p.rate > 0);
  assert.ok(p.fee >= 0);
  // 100 USDT ≈ 100 USD，rate 应该约等于 1
  assert.ok(p.rate >= 0.9 && p.rate <= 1.1, `rate ${p.rate} should be ~1 for stablecoin`);
});

// =============================================================================
// 5. createTransaction 返回 redirectUrl
// =============================================================================

test('MoonPayClient.createTransaction: mock 模式返回 redirectUrl', async () => {
  const client = buildMockClient();
  const tx = await client.createTransaction({
    cryptoCurrency: 'USDT',
    baseCurrency: 'USD',
    walletAddress: USER_WALLET,
    externalTransactionId: 'test-ext-001',
    baseAmount: 100,
  });
  assert.ok(tx.id, 'should have id');
  assert.ok(tx.redirectUrl, 'should have redirectUrl');
  assert.ok(tx.redirectUrl.startsWith(MOONPAY_WIDGET_BASE + '/'), 'redirectUrl points to moonpay widget');
  assert.ok(tx.redirectUrl.includes('apiKey=pk_test_mock'), 'uses public apiKey');
  assert.ok(tx.redirectUrl.includes('currencyCode=usdt'), 'crypto code in url');
  assert.ok(tx.redirectUrl.includes('baseCurrencyCode=usd'), 'base currency in url');
  assert.ok(tx.redirectUrl.includes(`walletAddress=${USER_WALLET}`), 'wallet address in url');
  assert.ok(tx.redirectUrl.includes('externalTransactionId=test-ext-001'), 'external id in url');
  assert.equal(tx.status, 'waitingPayment');
});

// =============================================================================
// 6. getTransaction 状态查询（mock 模式）
// =============================================================================

test('MoonPayClient.getTransaction: mock 模式返回 completed 状态', async () => {
  const client = buildMockClient();
  const tx = await client.getTransaction('mp-fake-id-001');
  assert.ok(tx);
  assert.equal(tx!.status, 'completed');
  assert.equal(tx!.cryptoCurrency, 'usdt');
});

// =============================================================================
// 7. 真实 API 模式：getCurrencies 解析
// =============================================================================

test('MoonPayClient.getCurrencies: 真实 API 模式解析响应', async () => {
  const fakeApi = [
    {
      id: 'usdt_polygon',
      code: 'usdt_polygon',
      name: 'Tether USD (Polygon)',
      type: 'crypto',
      metadata: { contractAddress: '0xabc', chainId: '137', network: 'polygon' },
      minAmount: 0.001,
      maxAmount: 100000,
      precision: 6,
      isBuySupported: true,
    },
    {
      id: 'usd',
      code: 'usd',
      name: 'US Dollar',
      type: 'fiat',
      precision: 2,
    },
  ];
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchImpl = (async (url: any, init?: RequestInit) => {
    calls.push({ url: typeof url === 'string' ? url : url.toString(), init });
    return jsonResponse(200, fakeApi);
  }) as unknown as typeof fetch;

  const client = new MoonPayClient({
    apiKeyPublic: 'pk_test_real',
    apiKeySecret: 'sk_test_real',
    fetchImpl,
    maxRetries: 0,
    backoffBaseMs: 10,
  });
  // 注意：真实 API 模式下，两个 key 都不是 mock 字符串，所以不会自动 mock
  // 强制关闭 mock 模式（虽然上面没设置，但 key 看起来像真实 key）
  // 由于 isMockKey 检查包含 'mock' 子串，这里 apiKeyPublic = 'pk_test_real' 不含 mock，apiKeySecret 同理
  // 实际上 isMockKey 会在包含 'mock' 子串时返回 true，但这里都不含
  // 但我们设置的是 pk_test_real / sk_test_real，构造函数会判断 implicit mock = false
  const list = await client.getCurrencies();
  assert.equal(list.length, 2);
  assert.equal(list[0].id, 'usdt_polygon');
  assert.equal(list[0].type, 'crypto');
  assert.equal(list[0].metadata?.chainId, '137');
  assert.equal(list[1].type, 'fiat');
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.includes('/v3/currencies'));
  assert.ok(calls[0].url.includes('apiKey=pk_test_real'));
});

// =============================================================================
// 8. TransactionManager createBuyOrder
// =============================================================================

test('MoonPayTransactionManager.createBuyOrder: 生成订单 + 写入内存', async () => {
  const client = buildMockClient();
  const mgr = new MoonPayTransactionManager({ client, minIntervalMs: 0 });
  const order = await mgr.createBuyOrder({
    userId: 'user-001',
    crypto: 'USDT',
    fiat: 'USD',
    fiatAmount: 100,
    walletAddress: USER_WALLET,
  });
  assert.ok(order.id.startsWith('ord-'));
  assert.equal(order.userId, 'user-001');
  assert.equal(order.status, 'initiated');
  assert.equal(order.crypto, 'USDT');
  assert.equal(order.fiat, 'USD');
  assert.ok(order.moonpayTxId);
  assert.ok(order.moonpayRedirectUrl);
  assert.ok(order.fiatAmount > 0);
  assert.ok(order.cryptoAmount > 0);
  assert.equal(mgr.size(), 1);
  assert.equal(mgr.getOrder(order.id)?.id, order.id);
});

// =============================================================================
// 9. TransactionManager 状态机流转
// =============================================================================

test('MoonPayTransactionManager: 状态机正确流转 initiated → completed', async () => {
  const client = buildMockClient();
  const mgr = new MoonPayTransactionManager({ client, minIntervalMs: 0 });
  const order = await mgr.createBuyOrder({
    userId: 'user-002',
    crypto: 'USDT',
    fiat: 'USD',
    fiatAmount: 50,
    walletAddress: USER_WALLET,
  });
  // 初始
  assert.equal(order.status, 'initiated');
  // 推进 widget_opened
  const o1 = mgr.markWidgetOpened(order.id);
  assert.equal(o1?.status, 'widget_opened');
  // 推进 waiting_payment
  const o2 = mgr.updateOrderFromWebhook(order.id, {
    type: 'transactionCreated',
    externalTransactionId: order.id,
    status: 'waitingPayment',
  });
  assert.equal(o2?.status, 'waiting_payment');
  // 推进 processing
  const o3 = mgr.updateOrderFromWebhook(order.id, {
    type: 'transactionUpdated',
    externalTransactionId: order.id,
    status: 'pending',
  });
  assert.equal(o3?.status, 'processing');
  // 推进 completed
  const o4 = mgr.updateOrderFromWebhook(order.id, {
    type: 'transactionCompleted',
    externalTransactionId: order.id,
    status: 'completed',
    cryptoAmount: 49.5,
    baseAmount: 50,
  });
  assert.equal(o4?.status, 'completed');
  assert.ok(o4?.completedAt);
  assert.equal(o4?.cryptoAmount, 49.5);
});

test('MoonPayTransactionManager: 非法状态转移被拒绝', async () => {
  const client = buildMockClient();
  const mgr = new MoonPayTransactionManager({ client, minIntervalMs: 0 });
  const order = await mgr.createBuyOrder({
    userId: 'user-002b',
    crypto: 'USDT',
    fiat: 'USD',
    fiatAmount: 50,
    walletAddress: USER_WALLET,
  });
  // 推进到 completed：initiated -> waiting_payment -> processing -> completed
  mgr.updateOrderFromWebhook(order.id, {
    type: 'transactionCreated',
    externalTransactionId: order.id,
  });
  mgr.updateOrderFromWebhook(order.id, {
    type: 'transactionUpdated',
    externalTransactionId: order.id,
    status: 'pending',
  });
  mgr.updateOrderFromWebhook(order.id, {
    type: 'transactionCompleted',
    externalTransactionId: order.id,
  });
  assert.equal(mgr.getOrder(order.id)?.status, 'completed');

  // 尝试从 completed 推进到 processing（应被拒绝）
  const o = mgr.updateOrderFromWebhook(order.id, {
    type: 'transactionUpdated',
    externalTransactionId: order.id,
    status: 'pending',
  });
  // status 不会变成 processing
  assert.equal(o?.status, 'completed');
});

// =============================================================================
// 10. updateOrderFromWebhook（4 种事件）
// =============================================================================

test('MoonPayTransactionManager.updateOrderFromWebhook: 4 种事件类型', async () => {
  const client = buildMockClient();
  const mgr = new MoonPayTransactionManager({ client, minIntervalMs: 0 });

  // 准备 4 个订单
  const orders: BuyOrder[] = [];
  for (let i = 0; i < 4; i++) {
    const o = await mgr.createBuyOrder({
      userId: `user-evt-${i}`,
      crypto: 'USDT',
      fiat: 'USD',
      fiatAmount: 100,
      walletAddress: USER_WALLET,
    });
    orders.push(o);
  }

  // transactionCreated
  const r1 = mgr.updateOrderFromWebhook(orders[0].id, {
    type: 'transactionCreated',
    externalTransactionId: orders[0].id,
  });
  assert.equal(r1?.status, 'waiting_payment');

  // transactionUpdated (status=pending → processing)
  mgr.markWidgetOpened(orders[1].id);
  mgr.updateOrderFromWebhook(orders[1].id, {
    type: 'transactionCreated',
    externalTransactionId: orders[1].id,
  });
  const r2 = mgr.updateOrderFromWebhook(orders[1].id, {
    type: 'transactionUpdated',
    externalTransactionId: orders[1].id,
    status: 'pending',
  });
  assert.equal(r2?.status, 'processing');

  // transactionCompleted（需要先经过 waiting_payment → processing）
  mgr.updateOrderFromWebhook(orders[2].id, {
    type: 'transactionCreated',
    externalTransactionId: orders[2].id,
  });
  mgr.updateOrderFromWebhook(orders[2].id, {
    type: 'transactionUpdated',
    externalTransactionId: orders[2].id,
    status: 'pending',
  });
  const r3 = mgr.updateOrderFromWebhook(orders[2].id, {
    type: 'transactionCompleted',
    externalTransactionId: orders[2].id,
  });
  assert.equal(r3?.status, 'completed');

  // transactionFailed
  const r4 = mgr.updateOrderFromWebhook(orders[3].id, {
    type: 'transactionFailed',
    externalTransactionId: orders[3].id,
    failureReason: 'card_declined',
  });
  assert.equal(r4?.status, 'failed');
  assert.equal(r4?.errorMessage, 'card_declined');
});

// =============================================================================
// 11. 订单与 user 关联
// =============================================================================

test('MoonPayTransactionManager: 订单与 user 关联 + listUserOrders', async () => {
  const client = buildMockClient();
  const mgr = new MoonPayTransactionManager({ client, minIntervalMs: 0 });
  await mgr.createBuyOrder({
    userId: 'alice',
    crypto: 'USDT',
    fiat: 'USD',
    fiatAmount: 10,
    walletAddress: USER_WALLET,
  });
  await mgr.createBuyOrder({
    userId: 'alice',
    crypto: 'USDC',
    fiat: 'EUR',
    fiatAmount: 20,
    walletAddress: USER_WALLET,
  });
  await mgr.createBuyOrder({
    userId: 'bob',
    crypto: 'BTC',
    fiat: 'USD',
    fiatAmount: 30,
    walletAddress: USER_WALLET,
  });
  const aliceOrders = mgr.listUserOrders('alice');
  assert.equal(aliceOrders.length, 2);
  assert.ok(aliceOrders.every((o) => o.userId === 'alice'));

  const bobOrders = mgr.listUserOrders('bob');
  assert.equal(bobOrders.length, 1);
  assert.equal(bobOrders[0].userId, 'bob');

  const allPending = mgr.listPendingOrders();
  assert.equal(allPending.length, 3);
});

// =============================================================================
// 12. 限流保护
// =============================================================================

test('MoonPayTransactionManager: 同用户短时间重复下单被限流', async () => {
  const client = buildMockClient();
  const mgr = new MoonPayTransactionManager({
    client,
    minIntervalMs: 5_000,
    maxActivePerUser: 2,
  });
  // 第一次成功
  await mgr.createBuyOrder({
    userId: 'rate-user',
    crypto: 'USDT',
    fiat: 'USD',
    fiatAmount: 10,
    walletAddress: USER_WALLET,
  });
  // 第二次：时间太近，应被限流
  await assert.rejects(
    () => mgr.createBuyOrder({
      userId: 'rate-user',
      crypto: 'USDT',
      fiat: 'USD',
      fiatAmount: 10,
      walletAddress: USER_WALLET,
    }),
    (err: Error) => {
      assert.ok(err instanceof MoonPayManagerError);
      assert.equal(err.code, 'RATE_LIMITED');
      return true;
    },
  );
});

test('MoonPayTransactionManager: maxActivePerUser 限制并发活跃订单', async () => {
  const client = buildMockClient();
  const mgr = new MoonPayTransactionManager({
    client,
    minIntervalMs: 0,
    maxActivePerUser: 2,
  });
  // 创建 2 个
  await mgr.createBuyOrder({
    userId: 'active-user',
    crypto: 'USDT',
    fiat: 'USD',
    fiatAmount: 10,
    walletAddress: USER_WALLET,
  });
  await mgr.createBuyOrder({
    userId: 'active-user',
    crypto: 'USDT',
    fiat: 'USD',
    fiatAmount: 10,
    walletAddress: USER_WALLET,
  });
  // 第三个：活跃数超限
  await assert.rejects(
    () => mgr.createBuyOrder({
      userId: 'active-user',
      crypto: 'USDT',
      fiat: 'USD',
      fiatAmount: 10,
      walletAddress: USER_WALLET,
    }),
    (err: Error) => {
      assert.ok(err instanceof MoonPayManagerError);
      assert.equal(err.code, 'TOO_MANY_ACTIVE');
      return true;
    },
  );
});

// =============================================================================
// 13. 5xx 重试
// =============================================================================

test('MoonPayClient: 5xx 触发重试并最终成功', async () => {
  let callCount = 0;
  const fetchImpl = (async (url: any, init?: RequestInit) => {
    callCount++;
    if (callCount < 3) {
      return jsonResponse(500, { error: 'server_error' });
    }
    return jsonResponse(200, [
      { id: 'usdt', code: 'usdt', name: 'Tether USD', type: 'crypto' },
    ]);
  }) as unknown as typeof fetch;

  const client = new MoonPayClient({
    apiKeyPublic: 'pk_test_real',
    apiKeySecret: 'sk_test_real',
    fetchImpl,
    maxRetries: 3,
    backoffBaseMs: 1,
    timeoutMs: 1000,
  });
  const list = await client.getCurrencies();
  assert.equal(list.length, 1);
  assert.equal(callCount, 3); // 2 次失败 + 1 次成功
});

test('MoonPayClient: 4xx 不重试', async () => {
  let callCount = 0;
  const fetchImpl = (async (url: any) => {
    callCount++;
    return jsonResponse(400, { error: 'bad_request' });
  }) as unknown as typeof fetch;
  const client = new MoonPayClient({
    apiKeyPublic: 'pk_test_real',
    apiKeySecret: 'sk_test_real',
    fetchImpl,
    maxRetries: 3,
    backoffBaseMs: 1,
    timeoutMs: 1000,
  });
  await assert.rejects(
    () => client.getCurrencies(),
    (err: Error) => {
      assert.ok(err instanceof MoonPayApiError);
      return true;
    },
  );
  assert.equal(callCount, 1); // 4xx 不重试
});

test('MoonPayClient: 401 抛 UNAUTHORIZED', async () => {
  const fetchImpl = (async () => jsonResponse(401, { error: 'unauthorized' })) as unknown as typeof fetch;
  const client = new MoonPayClient({
    apiKeyPublic: 'pk_test_real',
    apiKeySecret: 'sk_test_real',
    fetchImpl,
    maxRetries: 0,
  });
  await assert.rejects(
    () => client.getCurrencies(),
    (err: Error) => {
      assert.ok(err instanceof MoonPayApiError);
      assert.equal((err as MoonPayApiError).code, 'UNAUTHORIZED');
      return true;
    },
  );
});

// =============================================================================
// 14. 断网降级到 mock（API Key 含 mock 字符串时）
// =============================================================================

test('MoonPayClient: API Key 包含 mock 子串时自动 mock 模式', async () => {
  // key 包含 'mock' 会触发 isMockKey 返回 true
  const client = new MoonPayClient({
    apiKeyPublic: 'pk_mock_demo',
    apiKeySecret: 'sk_mock_demo',
  });
  // 应该走 mock 路径，不发请求
  const list = await client.getCurrencies();
  assert.ok(list.length > 0);
  const tx = await client.createTransaction({
    cryptoCurrency: 'usdt',
    baseCurrency: 'usd',
    walletAddress: USER_WALLET,
    externalTransactionId: 'demo-001',
    baseAmount: 100,
  });
  assert.ok(tx.redirectUrl);
});

test('MoonPayClient: 网络失败时抛 NETWORK_ERROR', async () => {
  const fetchImpl = (async () => {
    throw new Error('network down');
  }) as unknown as typeof fetch;
  const client = new MoonPayClient({
    apiKeyPublic: 'pk_test_real',
    apiKeySecret: 'sk_test_real',
    fetchImpl,
    maxRetries: 2,
    backoffBaseMs: 1,
    timeoutMs: 500,
  });
  await assert.rejects(
    () => client.getCurrencies(),
    (err: Error) => {
      assert.ok(err instanceof MoonPayApiError);
      assert.equal((err as MoonPayApiError).code, 'NETWORK_ERROR');
      return true;
    },
  );
});

// =============================================================================
// 15. Webhook 签名校验（正 / 错 / 缺）
// =============================================================================

test('verifyMoonPaySignature: 正确签名通过', () => {
  const body = JSON.stringify({ type: 'transactionCreated', id: 'mp-1' });
  const sig = signMoonPayWebhook(body, TEST_SECRET);
  assert.equal(verifyMoonPaySignature(body, sig, TEST_SECRET), true);
});

test('verifyMoonPaySignature: 错误签名抛 SIGNATURE_INVALID', () => {
  const body = JSON.stringify({ type: 'transactionCreated' });
  const wrong = signMoonPayWebhook(body, 'wrong-secret');
  assert.throws(
    () => verifyMoonPaySignature(body, wrong, TEST_SECRET),
    (err: Error) => {
      assert.ok(err instanceof MoonPayWebhookSignatureError);
      assert.equal((err as MoonPayWebhookSignatureError).code, 'SIGNATURE_INVALID');
      return true;
    },
  );
});

test('verifyMoonPaySignature: 缺失签名抛 SIGNATURE_MISSING', () => {
  const body = JSON.stringify({ type: 'transactionCreated' });
  assert.throws(
    () => verifyMoonPaySignature(body, '', TEST_SECRET),
    (err: Error) => {
      assert.ok(err instanceof MoonPayWebhookSignatureError);
      assert.equal((err as MoonPayWebhookSignatureError).code, 'SIGNATURE_MISSING');
      return true;
    },
  );
});

test('verifyMoonPaySignature: 缺失 secret 抛 KEY_MISSING', () => {
  const body = JSON.stringify({ type: 'transactionCreated' });
  assert.throws(
    () => verifyMoonPaySignature(body, 'abc', ''),
    (err: Error) => {
      assert.ok(err instanceof MoonPayWebhookSignatureError);
      assert.equal((err as MoonPayWebhookSignatureError).code, 'KEY_MISSING');
      return true;
    },
  );
});

test('verifyMoonPaySignature: 长度不符抛 LENGTH_MISMATCH', () => {
  const body = 'hello';
  const short = 'abc';
  assert.throws(
    () => verifyMoonPaySignature(body, short, TEST_SECRET),
    (err: Error) => {
      assert.ok(err instanceof MoonPayWebhookSignatureError);
      assert.equal((err as MoonPayWebhookSignatureError).code, 'LENGTH_MISMATCH');
      return true;
    },
  );
});

// =============================================================================
// 16. 完整流程：创建 → webhook → 完成
// =============================================================================

test('完整流程：创建订单 → webhook (created) → (updated) → (completed)', async () => {
  const client = buildMockClient();
  const mgr = new MoonPayTransactionManager({ client, minIntervalMs: 0 });

  // 1. 订阅
  const seen: string[] = [];
  const unsub = mgr.onOrderUpdate((order) => {
    seen.push(order.status);
  });

  // 2. 创建
  const order = await mgr.createBuyOrder({
    userId: 'e2e-user',
    crypto: 'USDT',
    fiat: 'USD',
    fiatAmount: 200,
    walletAddress: USER_WALLET,
  });
  assert.equal(order.status, 'initiated');

  // 3. 模拟 webhook: created
  const body1 = JSON.stringify({
    type: 'transactionCreated',
    id: 'mp-real-001',
    externalTransactionId: order.id,
    status: 'waitingPayment',
    baseCurrency: 'usd',
    baseCurrencyAmount: 200,
    cryptoCurrency: 'usdt',
    cryptoCurrencyAmount: 199,
  });
  const sig1 = signMoonPayWebhook(body1, TEST_SECRET);
  const r1 = await handleMoonPayWebhook(body1, sig1, TEST_SECRET, mgr);
  assert.equal(r1.ok, true);
  assert.equal(r1.processed, 1);
  const o1 = mgr.getOrder(order.id)!;
  assert.equal(o1.status, 'waiting_payment');
  assert.equal(o1.moonpayTxId, 'mp-real-001');

  // 4. 模拟 webhook: updated (pending)
  const body2 = JSON.stringify({
    type: 'transactionUpdated',
    id: 'mp-real-001',
    externalTransactionId: order.id,
    status: 'pending',
  });
  const sig2 = signMoonPayWebhook(body2, TEST_SECRET);
  await handleMoonPayWebhook(body2, sig2, TEST_SECRET, mgr);
  assert.equal(mgr.getOrder(order.id)?.status, 'processing');

  // 5. 模拟 webhook: completed
  const body3 = JSON.stringify({
    type: 'transactionCompleted',
    id: 'mp-real-001',
    externalTransactionId: order.id,
    status: 'completed',
    cryptoCurrencyAmount: 199.5,
  });
  const sig3 = signMoonPayWebhook(body3, TEST_SECRET);
  const r3 = await handleMoonPayWebhook(body3, sig3, TEST_SECRET, mgr);
  assert.equal(r3.ok, true);
  const finalOrder = mgr.getOrder(order.id)!;
  assert.equal(finalOrder.status, 'completed');
  assert.equal(finalOrder.cryptoAmount, 199.5);
  assert.ok(finalOrder.completedAt);

  // 6. 订阅触发了
  assert.ok(seen.includes('waiting_payment'));
  assert.ok(seen.includes('processing'));
  assert.ok(seen.includes('completed'));

  unsub();
});

test('handleMoonPayWebhook: 错误签名返回 ok=false, 401', async () => {
  const client = buildMockClient();
  const mgr = new MoonPayTransactionManager({ client, minIntervalMs: 0 });
  const body = JSON.stringify({ type: 'transactionCreated', externalTransactionId: 'x' });
  const wrong = signMoonPayWebhook(body, 'wrong');
  const r = await handleMoonPayWebhook(body, wrong, TEST_SECRET, mgr);
  assert.equal(r.ok, false);
  assert.equal(r.processed, 0);
  assert.ok(r.errors[0].includes('SIGNATURE'));
});

test('handleMoonPayWebhook: 无效 JSON 返回 ok=false', async () => {
  const client = buildMockClient();
  const mgr = new MoonPayTransactionManager({ client, minIntervalMs: 0 });
  const body = 'not json {';
  const sig = signMoonPayWebhook(body, TEST_SECRET);
  const r = await handleMoonPayWebhook(body, sig, TEST_SECRET, mgr);
  assert.equal(r.ok, false);
  assert.ok(r.errors[0].includes('Invalid JSON'));
});

test('handleMoonPayWebhook: 孤儿订单（无匹配 externalTransactionId）记录 ORPHAN 错误', async () => {
  const client = buildMockClient();
  const mgr = new MoonPayTransactionManager({ client, minIntervalMs: 0 });
  const body = JSON.stringify({
    type: 'transactionCreated',
    id: 'mp-orphan',
    externalTransactionId: 'not-existing-order',
  });
  const sig = signMoonPayWebhook(body, TEST_SECRET);
  const r = await handleMoonPayWebhook(body, sig, TEST_SECRET, mgr);
  assert.equal(r.ok, false);
  assert.ok(r.errors[0].includes('ORPHAN'));
});

// =============================================================================
// 17. 订单过期清理
// =============================================================================

test('MoonPayTransactionManager.expireStaleOrders: 超时订单转 expired', async () => {
  const client = buildMockClient();
  const mgr = new MoonPayTransactionManager({
    client,
    minIntervalMs: 0,
    expireMs: 1000, // 1 秒
  });
  const order = await mgr.createBuyOrder({
    userId: 'exp-user',
    crypto: 'USDT',
    fiat: 'USD',
    fiatAmount: 50,
    walletAddress: USER_WALLET,
  });
  // 立即扫描：不应过期
  let expired = mgr.expireStaleOrders();
  assert.equal(expired.length, 0);
  // 模拟时间快进
  expired = mgr.expireStaleOrders(Date.now() + 5000);
  assert.equal(expired.length, 1);
  assert.equal(expired[0].status, 'expired');
  assert.equal(mgr.getOrder(order.id)?.status, 'expired');
});

// =============================================================================
// 18. 订阅（onOrderUpdate）触发
// =============================================================================

test('MoonPayTransactionManager.onOrderUpdate: 多次订阅均触发', async () => {
  const client = buildMockClient();
  const mgr = new MoonPayTransactionManager({ client, minIntervalMs: 0 });
  const seen1: string[] = [];
  const seen2: string[] = [];
  const off1 = mgr.onOrderUpdate((o) => { seen1.push(o.status); });
  const off2 = mgr.onOrderUpdate((o) => { seen2.push(o.status); });

  await mgr.createBuyOrder({
    userId: 'sub-user',
    crypto: 'USDT',
    fiat: 'USD',
    fiatAmount: 10,
    walletAddress: USER_WALLET,
  });

  assert.equal(seen1.length, 1);
  assert.equal(seen2.length, 1);
  assert.equal(seen1[0], 'initiated');

  // 取消第一个
  off1();
  await mgr.createBuyOrder({
    userId: 'sub-user-2',
    crypto: 'USDT',
    fiat: 'USD',
    fiatAmount: 10,
    walletAddress: USER_WALLET,
  });
  assert.equal(seen1.length, 1); // 未增加
  assert.equal(seen2.length, 2); // 增加

  off2();
});

// =============================================================================
// 19. 工厂函数 + 关键常量
// =============================================================================

test('工厂函数：createMoonPayClient / createMoonPayTransactionManager 存在', async () => {
  const { createMoonPayClient, createMoonPayTransactionManager } = await import('../src/lib/onramp');
  const client = createMoonPayClient();
  assert.ok(client instanceof MoonPayClient);
  const mgr = createMoonPayTransactionManager({ client, minIntervalMs: 0 });
  assert.ok(mgr instanceof MoonPayTransactionManager);
});

test('关键常量：默认值正确', async () => {
  assert.equal(MOONPAY_DEFAULT_BASE_CURRENCY, 'usd');
  assert.ok(MOONPAY_WIDGET_BASE.startsWith('https://'));
  assert.equal(typeof MOONPAY_API_KEY_PUBLIC, 'string');
  assert.equal(typeof MOONPAY_API_KEY_SECRET, 'string');
});

// =============================================================================
// 20. canTransition
// =============================================================================

test('canTransition: 合法 / 非法转移', async () => {
  const { canTransition } = await import('../src/lib/onramp');
  assert.equal(canTransition('initiated', 'widget_opened'), true);
  assert.equal(canTransition('initiated', 'completed'), false);
  assert.equal(canTransition('completed', 'processing'), false);
  assert.equal(canTransition('waiting_payment', 'processing'), true);
  // 状态相同时允许（幂等）
  assert.equal(canTransition('completed', 'completed'), true);
});
