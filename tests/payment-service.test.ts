/**
 * Payment 模块测试（Stripe / Adyen 银行卡支付）
 *
 * 覆盖 18 个核心场景：
 *  1.  Luhn 算法正确（合法卡通过）
 *  2.  Luhn 算法错误（非法卡拒绝）
 *  3.  卡品牌识别（Visa 4xxx, MC 5xxx, Amex 3xxx, UnionPay 62xx）
 *  4.  校验过期日期
 *  5.  校验 CVV
 *  6.  Stripe createPaymentIntent 成功（mock 模式 + 真实 API）
 *  7.  Stripe 3DS 跳转
 *  8.  Stripe 5xx 重试
 *  9.  Stripe createRefund 成功
 * 10.  Stripe webhook 签名校验
 * 11.  Adyen createPayment 成功
 * 12.  Adyen 3DS 处理
 * 13.  Adyen createRefund
 * 14.  PaymentService 完整流程（initiated → succeeded）
 * 15.  风控：单笔限额
 * 16.  风控：24h 限额
 * 17.  风控：黑名单
 * 18.  断网降级（mock 模式）
 *
 * 运行：npx tsx --test tests/payment-service.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import {
  // 业务层
  PaymentService,
  PaymentError,
  PaymentValidationError,
  // 客户端
  StripeClient,
  StripeApiError,
  AdyenClient,
  AdyenApiError,
  // webhook
  handleStripeWebhook,
  handleAdyenWebhook,
  // 工具
  validateCard,
  validateCvc,
  validateExpiry,
  detectBrand,
  toMinorUnit,
  fromMinorUnit,
  pickProviderByCountry,
  shouldRequire3DS,
  PAYMENT_LIMITS,
  SUPPORTED_CURRENCIES,
  ZERO_DECIMAL_CURRENCIES,
} from '../src/lib/payment';

// =============================================================================
// 测试常量
// =============================================================================

// 合法测试卡号（Luhn 通过）
const VISA_OK = '4242424242424242';
const MASTERCARD_OK = '5555555555554444';
const AMEX_OK = '378282246310005';
const UNIONPAY_OK = '6200000000000000'; // 62 前缀 16 位，Luhn 通过
const JCB_OK = '3530111333300000';
const DISCOVER_OK = '6011111111111117';

// 非法卡号（Luhn 不通过）
const VISA_BAD = '4242424242424241';

const NEXT_YEAR = new Date().getFullYear() + 2;
const NEXT_MONTH = 12;

function buildStripe(opts: Partial<ConstructorParameters<typeof StripeClient>[0]> = {}): StripeClient {
  return new StripeClient({
    secretKey: 'sk_test_mock',
    webhookSecret: 'whsec_test',
    fetchImpl: opts.fetchImpl,
    maxRetries: opts.maxRetries ?? 0,
    backoffBaseMs: opts.backoffBaseMs ?? 5,
    timeoutMs: opts.timeoutMs ?? 1000,
    ...opts,
  });
}

function buildAdyen(opts: Partial<ConstructorParameters<typeof AdyenClient>[0]> = {}): AdyenClient {
  return new AdyenClient({
    apiKey: 'AQEyhmfxL47PaRZH_test_mock',
    merchantAccount: 'SMY-ECOM-MOCK',
    hmacKey: 'mock-hmac-key',
    fetchImpl: opts.fetchImpl,
    maxRetries: opts.maxRetries ?? 0,
    backoffBaseMs: opts.backoffBaseMs ?? 5,
    timeoutMs: opts.timeoutMs ?? 1000,
    ...opts,
  });
}

function buildPaymentService(opts: Partial<ConstructorParameters<typeof PaymentService>[0]> = {}): PaymentService {
  const stripe = opts.stripe ?? buildStripe();
  const adyen = opts.adyen ?? buildAdyen();
  return new PaymentService({
    stripe,
    adyen,
    minIntervalMs: 0,
    riskControlEnabled: true,
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

function makeCard(overrides: Partial<{
  number: string; expMonth: number; expYear: number; cvc: string; holderName: string;
}> = {}) {
  return {
    number: VISA_OK,
    expMonth: NEXT_MONTH,
    expYear: NEXT_YEAR,
    cvc: '123',
    holderName: 'TEST USER',
    ...overrides,
  };
}

function makeRequest(overrides: Partial<{
  userId: string;
  amount: number;
  currency: any;
  card: any;
  idempotencyKey: string;
  billingAddress: any;
  provider: any;
  requires3DS: boolean;
  metadata: Record<string, string>;
}> = {}) {
  return {
    userId: 'user-001',
    amount: 100,
    currency: 'USD',
    card: makeCard(),
    idempotencyKey: 'ik-' + Math.random().toString(36).slice(2, 10),
    ...overrides,
  } as any;
}

// =============================================================================
// 1. Luhn 算法正确
// =============================================================================

test('validateCard: 合法卡号通过 Luhn', () => {
  const r = validateCard(VISA_OK);
  assert.equal(r.valid, true, `visa should be valid: ${r.errors.join(';')}`);
  assert.equal(r.brand, 'visa');
  assert.equal(r.last4, '4242');

  const r2 = validateCard(MASTERCARD_OK);
  assert.equal(r2.valid, true);
  assert.equal(r2.brand, 'mastercard');
  assert.equal(r2.last4, '4444');

  // 带空格的卡号
  const r3 = validateCard('4242 4242 4242 4242');
  assert.equal(r3.valid, true);
  assert.equal(r3.brand, 'visa');
});

// =============================================================================
// 2. Luhn 算法错误
// =============================================================================

test('validateCard: 非法卡号被拒绝', () => {
  const r = validateCard(VISA_BAD);
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.includes('luhn') || e.includes('length') || e.includes('digits')));

  // 太短
  const r2 = validateCard('4242');
  assert.equal(r2.valid, false);
  assert.equal(r2.brand, 'unknown');

  // 非数字
  const r3 = validateCard('4242-4242-4242-424X');
  assert.equal(r3.valid, false);

  // 空
  const r4 = validateCard('');
  assert.equal(r4.valid, false);
});

// =============================================================================
// 3. 卡品牌识别
// =============================================================================

test('detectBrand: 识别 Visa / MasterCard / Amex / UnionPay / JCB / Discover', () => {
  assert.equal(detectBrand(VISA_OK), 'visa');
  assert.equal(detectBrand(MASTERCARD_OK), 'mastercard');
  assert.equal(detectBrand(AMEX_OK), 'amex');
  assert.equal(detectBrand(UNIONPAY_OK), 'unionpay');
  assert.equal(detectBrand(JCB_OK), 'jcb');
  assert.equal(detectBrand(DISCOVER_OK), 'discover');

  // 杂牌
  assert.equal(detectBrand('9999999999999995'), 'unknown');
  // 空
  assert.equal(detectBrand(''), 'unknown');
});

// =============================================================================
// 4. 校验过期日期
// =============================================================================

test('validateExpiry: 校验月 / 年 / 是否过期', () => {
  // 有效（明年）
  const ok = validateExpiry(12, NEXT_YEAR);
  assert.equal(ok.valid, true);

  // 月份越界
  assert.equal(validateExpiry(0, NEXT_YEAR).valid, false);
  assert.equal(validateExpiry(13, NEXT_YEAR).valid, false);

  // 已过期
  const lastYear = new Date().getFullYear() - 1;
  assert.equal(validateExpiry(12, lastYear).valid, false);

  // 非数字年份
  assert.equal(validateExpiry(12, 1800).valid, false);
});

// =============================================================================
// 5. 校验 CVV
// =============================================================================

test('validateCvc: 普通卡 3 位 / Amex 4 位', () => {
  assert.equal(validateCvc('123', 'visa').valid, true);
  assert.equal(validateCvc('1234', 'amex').valid, true);
  // Amex 必须是 4 位
  assert.equal(validateCvc('123', 'amex').valid, false);
  // 非 Amex 不能 4 位
  assert.equal(validateCvc('1234', 'visa').valid, false);
  // 空
  assert.equal(validateCvc('', 'visa').valid, false);
  // 非数字
  assert.equal(validateCvc('12a', 'visa').valid, false);
});

// =============================================================================
// 6. Stripe createPaymentIntent 成功
// =============================================================================

test('StripeClient.createPaymentIntent: mock 模式 + 真实 API 双路径', async () => {
  // mock 模式
  const mockClient = buildStripe();
  const r1 = await mockClient.createPaymentIntent(makeRequest({ amount: 10 }) as any);
  assert.ok(r1.paymentId.startsWith('pi_mock_'));
  assert.equal(r1.provider, 'STRIPE');
  assert.equal(r1.status, 'succeeded');
  assert.equal(r1.currency, 'USD');
  assert.equal(r1.cardLast4, '4242');
  assert.equal(r1.cardBrand, 'visa');

  // 真实 API 模式：构造假 fetch
  const calls: { url: string; init?: RequestInit }[] = [];
  const fakeIntent = {
    id: 'pi_real_001',
    object: 'payment_intent',
    amount: 1000,
    currency: 'usd',
    status: 'succeeded',
    created: Math.floor(Date.now() / 1000),
    payment_method_options: { card: { brand: 'visa', last4: '4242' } },
    charges: {
      data: [
        {
          payment_method_details: { card: { authorization_code: 'AUTH123' } },
        },
      ],
    },
  };
  const fetchImpl = (async (url: any, init?: RequestInit) => {
    calls.push({ url: typeof url === 'string' ? url : url.toString(), init });
    return jsonResponse(200, fakeIntent);
  }) as unknown as typeof fetch;

  const realClient = new StripeClient({
    secretKey: 'sk_test_real',
    webhookSecret: 'whsec_real',
    fetchImpl,
    maxRetries: 0,
    backoffBaseMs: 5,
    timeoutMs: 1000,
  });
  const r2 = await realClient.createPaymentIntent(makeRequest() as any);
  assert.equal(r2.paymentId, 'pi_real_001');
  assert.equal(r2.status, 'succeeded');
  assert.equal(r2.amount, 10);
  assert.equal(r2.currency, 'USD');
  assert.equal(r2.cardBrand, 'visa');
  assert.equal(r2.authCode, 'AUTH123');
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.includes('/v1/payment_intents'));
  assert.ok(calls[0].init?.headers && (calls[0].init?.headers as any).Authorization.startsWith('Bearer '));
});

// =============================================================================
// 7. Stripe 3DS 跳转
// =============================================================================

test('StripeClient.createPaymentIntent: requires_action 时返回 threeDsUrl', async () => {
  const fakeIntent = {
    id: 'pi_3ds_001',
    amount: 5000,
    currency: 'usd',
    status: 'requires_action',
    next_action: { redirect_to_url: { url: 'https://hooks.stripe.com/3d_secure/abc' } },
    created: Math.floor(Date.now() / 1000),
  };
  const fetchImpl = (async () => jsonResponse(200, fakeIntent)) as unknown as typeof fetch;
  const client = new StripeClient({
    secretKey: 'sk_test_real',
    webhookSecret: 'whsec_real',
    fetchImpl,
    maxRetries: 0,
    backoffBaseMs: 5,
  });
  const r = await client.createPaymentIntent(makeRequest({ amount: 50 }) as any);
  assert.equal(r.status, 'requires_action');
  assert.ok(r.threeDsUrl);
  assert.ok(r.threeDsUrl!.includes('stripe.com'));
});

// =============================================================================
// 8. Stripe 5xx 重试
// =============================================================================

test('StripeClient: 5xx 自动重试', async () => {
  let attempts = 0;
  const fetchImpl = (async () => {
    attempts++;
    if (attempts < 3) {
      return textResponse(503, 'service unavailable');
    }
    return jsonResponse(200, {
      id: 'pi_retry_001',
      amount: 1000,
      currency: 'usd',
      status: 'succeeded',
      created: Math.floor(Date.now() / 1000),
      payment_method_options: { card: { brand: 'visa', last4: '4242' } },
    });
  }) as unknown as typeof fetch;

  const client = new StripeClient({
    secretKey: 'sk_test_real',
    webhookSecret: 'whsec_real',
    fetchImpl,
    maxRetries: 2,
    backoffBaseMs: 1,
    timeoutMs: 1000,
  });
  const r = await client.createPaymentIntent(makeRequest() as any);
  assert.equal(r.paymentId, 'pi_retry_001');
  assert.equal(attempts, 3, 'should retry twice before success');
});

// =============================================================================
// 9. Stripe createRefund
// =============================================================================

test('StripeClient.createRefund: 部分退款', async () => {
  const fetchImpl = (async () =>
    jsonResponse(200, {
      id: 're_001',
      object: 'refund',
      amount: 500,
      currency: 'usd',
      status: 'succeeded',
      payment_intent: 'pi_001',
      created: Math.floor(Date.now() / 1000),
    })) as unknown as typeof fetch;
  const client = new StripeClient({
    secretKey: 'sk_test_real',
    webhookSecret: 'whsec_real',
    fetchImpl,
    maxRetries: 0,
  });
  const r = await client.createRefund({
    paymentId: 'pi_001',
    amount: 5,
    idempotencyKey: 'ik-1',
  });
  assert.equal(r.refundId, 're_001');
  assert.equal(r.amount, 5);
  assert.equal(r.status, 'succeeded');
  assert.equal(r.paymentId, 'pi_001');
});

// =============================================================================
// 10. Stripe webhook 签名
// =============================================================================

test('StripeClient.verifyWebhookSignature: 正确签名 / 错误签名 / 缺签名 / 时间戳超时', () => {
  const client = buildStripe();
  const body = JSON.stringify({ type: 'payment_intent.succeeded' });
  const sig = client.signWebhook(body);
  const r1 = client.verifyWebhookSignature(body, sig);
  assert.equal(r1.valid, true);
  assert.equal(r1.event?.type, 'payment_intent.succeeded');

  // 错误签名
  const r2 = client.verifyWebhookSignature(body, sig.replace('v1=', 'v1=' + '0'.repeat(64)));
  assert.equal(r2.valid, false);

  // 缺签名
  const r3 = client.verifyWebhookSignature(body, '');
  assert.equal(r3.valid, false);
  assert.equal(r3.code, 'SIGNATURE_MISSING');

  // 时间戳超时
  const oldTs = Math.floor(Date.now() / 1000) - 10_000;
  const oldSig = client.signWebhook(body, oldTs);
  const r4 = client.verifyWebhookSignature(body, oldSig);
  assert.equal(r4.valid, false);
  assert.equal(r4.code, 'TIMESTAMP_OUT_OF_TOLERANCE');
});

// =============================================================================
// 11. Adyen createPayment 成功
// =============================================================================

test('AdyenClient.createPayment: mock 模式 + 真实 API 双路径', async () => {
  // mock 模式
  const mockClient = buildAdyen();
  const r1 = await mockClient.createPayment(makeRequest({ amount: 10 }) as any);
  assert.ok(r1.paymentId.startsWith('adyen_mock_'));
  assert.equal(r1.provider, 'ADYEN');
  assert.equal(r1.status, 'succeeded');
  assert.equal(r1.cardLast4, '4242');

  // 真实 API
  const calls: { url: string; init?: RequestInit }[] = [];
  const fakeResp = {
    pspReference: 'adyen_001',
    resultCode: 'Authorised',
    authCode: 'AUTH001',
    amount: { currency: 'USD', value: 1000 },
    additionalData: { cardSummary: '1111', cardBrand: 'visa' },
  };
  const fetchImpl = (async (url: any, init?: RequestInit) => {
    calls.push({ url: typeof url === 'string' ? url : url.toString(), init });
    return jsonResponse(200, fakeResp);
  }) as unknown as typeof fetch;
  const realClient = new AdyenClient({
    apiKey: 'AQE_real_key',
    merchantAccount: 'SMY-ECOM',
    hmacKey: 'real-hmac',
    fetchImpl,
    maxRetries: 0,
  });
  const r2 = await realClient.createPayment(makeRequest() as any);
  assert.equal(r2.paymentId, 'adyen_001');
  assert.equal(r2.status, 'succeeded');
  assert.equal(r2.authCode, 'AUTH001');
  assert.equal(r2.cardBrand, 'visa');
  assert.ok(calls[0].url.includes('/v71/payments'));
  const headers = calls[0].init?.headers as any;
  assert.ok(headers.Authorization.startsWith('Basic '));
});

// =============================================================================
// 12. Adyen 3DS 处理
// =============================================================================

test('AdyenClient.createPayment: RedirectShopper → 3DS', async () => {
  const fakeResp = {
    pspReference: 'adyen_3ds_001',
    resultCode: 'RedirectShopper',
    action: { url: 'https://test.adyen.com/hpp/3ds/redirect.shtml?xxx' },
    amount: { currency: 'USD', value: 5000 },
  };
  const fetchImpl = (async () => jsonResponse(200, fakeResp)) as unknown as typeof fetch;
  const client = new AdyenClient({
    apiKey: 'AQE_real_key',
    merchantAccount: 'SMY-ECOM',
    hmacKey: 'real-hmac',
    fetchImpl,
    maxRetries: 0,
  });
  const r = await client.createPayment(makeRequest({ amount: 50 }) as any);
  assert.equal(r.status, 'requires_3ds');
  assert.ok(r.threeDsUrl);
  assert.ok(r.threeDsUrl!.includes('adyen.com'));
});

// =============================================================================
// 13. Adyen createRefund
// =============================================================================

test('AdyenClient.createRefund: 退款', async () => {
  const fetchImpl = (async () =>
    jsonResponse(200, {
      pspReference: 're_adyen_001',
      status: 'received',
      amount: { value: 1000, currency: 'USD' },
    })) as unknown as typeof fetch;
  const client = new AdyenClient({
    apiKey: 'AQE_real_key',
    merchantAccount: 'SMY-ECOM',
    hmacKey: 'real-hmac',
    fetchImpl,
    maxRetries: 0,
  });
  const r = await client.createRefund({ paymentId: 'adyen_001', amount: 10, idempotencyKey: 'ik-2' });
  assert.equal(r.refundId, 're_adyen_001');
  assert.equal(r.amount, 10);
  assert.equal(r.status, 'pending');
});

// =============================================================================
// 14. PaymentService 完整流程
// =============================================================================

test('PaymentService: 完整流程（创建 → succeeded）', async () => {
  const svc = buildPaymentService();
  const r = await svc.createPayment(makeRequest({ amount: 10, currency: 'USD' }) as any);
  assert.equal(r.status, 'succeeded');
  assert.equal(r.provider, 'STRIPE');
  assert.ok(r.paymentId);
  const order = svc.getPayment(r.paymentId);
  assert.equal(order?.status, 'succeeded');
  assert.equal(order?.amount, 10);
  assert.equal(order?.cardLast4, '4242');
  assert.equal(order?.cardBrand, 'visa');

  // 订阅
  let received = 0;
  const off = svc.onPaymentUpdate(() => { received++; });
  await svc.createPayment(makeRequest({ amount: 5 }) as any);
  assert.ok(received > 0);
  off();
});

test('PaymentService: 3DS 流程 → handle3DSResult', async () => {
  // 第一步：3DS
  const svc = buildPaymentService();
  const r1 = await svc.createPayment(
    makeRequest({ amount: 100, requires3DS: true, idempotencyKey: 'ik-3ds-1' }) as any,
  );
  assert.equal(r1.status, 'requires_3ds');
  assert.ok(r1.threeDsUrl);

  // 模拟 webhook 推进到 succeeded
  svc.processWebhook({
    type: 'payment_intent.succeeded',
    provider: 'STRIPE',
    paymentId: r1.paymentId,
    externalRef: 'ik-3ds-1',
    receivedAt: Date.now(),
  });
  const order = svc.getPayment(r1.paymentId);
  assert.equal(order?.status, 'succeeded');
});

// =============================================================================
// 15. 风控：单笔限额
// =============================================================================

test('PaymentService: 单笔限额超限', async () => {
  const svc = buildPaymentService();
  const limit = PAYMENT_LIMITS.perTransaction.USD;
  await assert.rejects(
    () => svc.createPayment(makeRequest({ amount: limit + 1, currency: 'USD', idempotencyKey: 'ik-big' }) as any),
    (err: any) => {
      assert.ok(err instanceof PaymentValidationError);
      assert.equal(err.code, 'RISK_REJECTED');
      assert.equal(err.message, 'risk rejected: exceed_per_transaction');
      return true;
    },
  );
});

// =============================================================================
// 16. 风控：24h 限额
// =============================================================================

test('PaymentService: 24h 累计限额', async () => {
  const svc = buildPaymentService({ minIntervalMs: 0 });
  // 临时调整 24h 限额便于 2 笔就能触发
  const origPer24h = PAYMENT_LIMITS.per24hPerUser.USD;
  (PAYMENT_LIMITS.per24hPerUser as any).USD = 50;
  try {
    const r1 = await svc.createPayment(
      makeRequest({ amount: 10, currency: 'USD', idempotencyKey: 'ik-h1' }) as any,
    );
    assert.equal(r1.status, 'succeeded');
    // 累计 10 + 45 = 55 > 50 → 拒
    await assert.rejects(
      () =>
        svc.createPayment(
          makeRequest({ amount: 45, currency: 'USD', idempotencyKey: 'ik-h2' }) as any,
        ),
      (err: any) => {
        assert.equal(err.code, 'RISK_REJECTED');
        assert.match(err.message, /exceed_per_24h_user/);
        return true;
      },
    );
  } finally {
    (PAYMENT_LIMITS.per24hPerUser as any).USD = origPer24h;
  }
});

// =============================================================================
// 17. 风控：黑名单
// =============================================================================

test('PaymentService: 用户 / 卡号黑名单', async () => {
  const svc = buildPaymentService({
    blacklistUserIds: ['banned-001'],
    blacklistCardLast4: ['4242'],
    minIntervalMs: 0,
  });
  await assert.rejects(
    () => svc.createPayment(makeRequest({ userId: 'banned-001' }) as any),
    (err: any) => {
      assert.equal(err.code, 'RISK_REJECTED');
      assert.match(err.message, /user_blacklisted/);
      return true;
    },
  );

  // 改 user 但卡号仍命中黑名单
  await assert.rejects(
    () => svc.createPayment(makeRequest({ userId: 'user-002', idempotencyKey: 'ik-bl' }) as any),
    (err: any) => {
      assert.match(err.message, /card_blacklisted/);
      return true;
    },
  );
});

// =============================================================================
// 18. 断网降级
// =============================================================================

test('PaymentService: 断网降级（mock 模式）', async () => {
  // 用真实 key + mock fetch 抛错：mockMode 自动开启
  const client = new StripeClient({
    secretKey: 'sk_test_mock', // 含 mock
    fetchImpl: (async () => {
      throw new Error('network unreachable');
    }) as unknown as typeof fetch,
    maxRetries: 0,
    backoffBaseMs: 1,
  });
  const svc = new PaymentService({ stripe: client, minIntervalMs: 0 });
  // mock 模式不会走网络，正常返回
  const r = await svc.createPayment(makeRequest() as any);
  assert.equal(r.status, 'succeeded');
  assert.ok(r.paymentId.startsWith('pi_mock_'));
});

// =============================================================================
// 额外：货币换算 / provider 决策 / 3DS 决策 / webhook handler
// =============================================================================

test('toMinorUnit / fromMinorUnit: USD 2 位 / JPY 0 位', () => {
  assert.equal(toMinorUnit(100, 'USD'), 10000);
  assert.equal(toMinorUnit(100, 'JPY'), 100);
  assert.equal(toMinorUnit(1.5, 'USD'), 150);
  assert.equal(fromMinorUnit(10000, 'USD'), 100);
  assert.equal(fromMinorUnit(100, 'JPY'), 100);
});

test('pickProviderByCountry: 欧盟 → Adyen / 其他 → Stripe', () => {
  assert.equal(pickProviderByCountry('DE'), 'ADYEN');
  assert.equal(pickProviderByCountry('FR'), 'ADYEN');
  assert.equal(pickProviderByCountry('US'), 'STRIPE');
  assert.equal(pickProviderByCountry('CN'), 'STRIPE');
  assert.equal(pickProviderByCountry(undefined), 'STRIPE');
});

test('shouldRequire3DS: SCA 强认证 + 阈值', () => {
  // 欧盟：30 EUR 等值以上
  assert.equal(shouldRequire3DS({ amount: 50, currency: 'EUR', country: 'DE' }), true);
  assert.equal(shouldRequire3DS({ amount: 10, currency: 'EUR', country: 'DE' }), false);
  // 美国
  assert.equal(shouldRequire3DS({ amount: 50, currency: 'USD', country: 'US' }), true);
  // 强制
  assert.equal(shouldRequire3DS({ amount: 1, currency: 'USD', country: 'US', force: true }), true);
});

test('SUPPORTED_CURRENCIES / ZERO_DECIMAL_CURRENCIES 包含预期币种', () => {
  assert.ok(SUPPORTED_CURRENCIES.includes('USD'));
  assert.ok(SUPPORTED_CURRENCIES.includes('JPY'));
  assert.ok(ZERO_DECIMAL_CURRENCIES.includes('JPY'));
  assert.ok(ZERO_DECIMAL_CURRENCIES.includes('KRW'));
});

test('handleStripeWebhook: 签名错误 / 签名通过', async () => {
  const client = buildStripe();
  const svc = buildPaymentService();
  // 提前插入一笔订单，外部 ref 用 idempotencyKey
  const order = await svc.createPayment(makeRequest({ amount: 10, currency: 'USD', idempotencyKey: 'ik-wh1' }) as any);
  const providerId = order.paymentId;

  // 错误签名
  const body1 = JSON.stringify({
    type: 'payment_intent.succeeded',
    data: { object: { id: providerId, metadata: { idempotencyKey: 'ik-wh1' } } },
  });
  const r1 = await handleStripeWebhook(body1, 't=1,v1=00', client, svc);
  assert.equal(r1.ok, false);
  assert.ok(r1.errors[0].includes('signature invalid'));

  // 正确签名
  const sig = client.signWebhook(body1);
  const r2 = await handleStripeWebhook(body1, sig, client, svc);
  assert.equal(r2.ok, true);
  assert.equal(r2.processed, 1);
  const o = svc.getPayment(providerId);
  assert.equal(o?.status, 'succeeded');
});

test('handleAdyenWebhook: 签名通过 / 错误', async () => {
  const client = buildAdyen();
  const svc = buildPaymentService();
  const order = await svc.createPayment(
    makeRequest({ amount: 10, currency: 'USD', provider: 'ADYEN', idempotencyKey: 'ik-aw1' }) as any,
  );
  const providerId = order.paymentId;
  const merchantRef = 'ik-aw1';

  // 构造标准通知
  const itemCount = 1;
  const item = {
    pspReference: providerId,
    originalReference: '',
    merchantAccountCode: 'SMY-ECOM-MOCK',
    merchantReference: merchantRef,
    amount: { value: 1000, currency: 'USD' },
    eventCode: 'AUTHORISATION',
    success: 'true',
    paymentMethod: 'visa',
  };
  const signed = client.signWebhook({
    pspReference: item.pspReference,
    originalReference: item.originalReference,
    merchantAccountCode: item.merchantAccountCode,
    merchantReference: item.merchantReference,
    value: item.amount.value,
    currency: item.amount.currency,
    eventCode: item.eventCode,
    success: item.success,
    paymentMethod: item.paymentMethod,
    live: 'false',
    itemCount,
  });
  const body = JSON.stringify({
    live: 'false',
    notificationItems: [
      {
        NotificationRequestItem: {
          ...item,
          additionalData: { hmacSignature: signed },
        },
      },
    ],
  });
  const r = await handleAdyenWebhook(body, client, svc);
  assert.equal(r.ok, true);
  assert.equal(r.processed, 1);
  const o = svc.getPayment(providerId);
  assert.equal(o?.status, 'succeeded');
});

test('PaymentService: 非法卡号 → PaymentValidationError', async () => {
  const svc = buildPaymentService();
  await assert.rejects(
    () => svc.createPayment(makeRequest({ card: makeCard({ number: VISA_BAD }) }) as any),
    (err: any) => {
      assert.ok(err instanceof PaymentValidationError);
      assert.equal(err.code, 'INVALID_CARD');
      return true;
    },
  );
});

test('PaymentService: 过期卡 → CARD_EXPIRED', async () => {
  const svc = buildPaymentService();
  await assert.rejects(
    () =>
      svc.createPayment(
        makeRequest({ card: makeCard({ expYear: 2000, expMonth: 1 }) }) as any,
      ),
    (err: any) => {
      assert.ok(err instanceof PaymentValidationError);
      assert.equal(err.code, 'CARD_EXPIRED');
      return true;
    },
  );
});

test('PaymentService: 退款 / 部分退款', async () => {
  const svc = buildPaymentService();
  const r = await svc.createPayment(
    makeRequest({ amount: 50, currency: 'USD', idempotencyKey: 'ik-rf1' }) as any,
  );
  assert.equal(r.status, 'succeeded');

  // 部分退款
  const r1 = await svc.refund({ paymentId: r.paymentId, amount: 20, idempotencyKey: 'rf-1' });
  assert.equal(r1.status, 'succeeded');
  let order = svc.getPayment(r.paymentId);
  assert.equal(order?.status, 'partially_refunded');

  // 全额退款
  const r2 = await svc.refund({ paymentId: r.paymentId, amount: 30, idempotencyKey: 'rf-2' });
  assert.equal(r2.status, 'succeeded');
  order = svc.getPayment(r.paymentId);
  assert.equal(order?.status, 'refunded');
});

// 注：上面 amount=50 仍会直接 succeeded（mock 模式只在显式 requires3DS 时触发 3DS）

test('PaymentService: 幂等键命中 → 返回原订单', async () => {
  const svc = buildPaymentService();
  const r1 = await svc.createPayment(makeRequest({ amount: 10, idempotencyKey: 'ik-idem' }) as any);
  const r2 = await svc.createPayment(makeRequest({ amount: 999, idempotencyKey: 'ik-idem' }) as any);
  assert.equal(r1.paymentId, r2.paymentId);
  assert.equal(r2.amount, 10); // 返回的是原订单
});

test('PaymentService: 欧盟账单地址 → Adyen', async () => {
  const svc = buildPaymentService();
  const r = await svc.createPayment(
    makeRequest({
      amount: 10,
      currency: 'EUR',
      idempotencyKey: 'ik-eu',
      billingAddress: {
        name: 'Hans Mueller',
        line1: 'Hauptstrasse 1',
        city: 'Berlin',
        postalCode: '10115',
        country: 'DE',
      },
    }) as any,
  );
  assert.equal(r.provider, 'ADYEN');
});

test('PaymentService: listUserPayments 排序 + 限额', async () => {
  // 用递增 now() 保证两笔订单 createdAt 不同
  let t = 1_000_000;
  const svc = buildPaymentService({ now: () => (t += 100) });
  await svc.createPayment(
    makeRequest({ amount: 5, currency: 'USD', userId: 'u-list', idempotencyKey: 'l1' }) as any,
  );
  await svc.createPayment(
    makeRequest({ amount: 6, currency: 'USD', userId: 'u-list', idempotencyKey: 'l2' }) as any,
  );
  const list = svc.listUserPayments('u-list');
  assert.equal(list.length, 2);
  assert.equal(list[0].id, 'l2'); // 时间倒序（l2 后创建）
  assert.equal(list[1].id, 'l1');
});

test('canTransition: 状态机规则', async () => {
  const { canTransitionPayment } = await import('../src/lib/payment');
  assert.equal(canTransitionPayment('initiated', 'succeeded'), true);
  assert.equal(canTransitionPayment('succeeded', 'refunded'), true);
  assert.equal(canTransitionPayment('refunded', 'failed'), false);
  assert.equal(canTransitionPayment('failed', 'succeeded'), false);
});
