/**
 * 推送服务单元测试（L-01 / L-02 / L-03：FCM / APNs / HMS）
 *
 * 覆盖：
 *  1. FCM 发送成功（mock fetch + RSA key）
 *  2. FCM 5xx 重试（mock fetch）
 *  3. FCM UNREGISTERED → invalid_token
 *  4. FCM token 主题发送
 *  5. APNs 发送成功（mock fetch + EC key）
 *  6. APNs 410 Gone → invalid_token
 *  7. APNs 429 → rate_limited
 *  8. APNs JWT 构造正确（ES256）
 *  9. HMS 发送成功（mock fetch）
 * 10. HMS token 刷新
 * 11. HMS 限流
 * 12. PushService registerDevice / unregisterDevice
 * 13. PushService sendToUser 按 platform 选 provider
 * 14. PushService sendToUser 多设备并发
 * 15. PushService sendBroadcast
 * 16. PushService getStats
 * 17. 断网降级到 mock
 * 18. Provider 切换（FCM → APNs 自动降级）
 *
 * 运行：npx tsx tests/push-service.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import {
  FcmClient,
  ApnsClient,
  HmsClient,
  PushService,
  derToJose,
  createFcmClient,
  createApnsClient,
  createHmsClient,
  createPushService,
  base64UrlDecode,
  PUSH_BATCH_SIZE,
  type DeviceToken,
  type PushPayload,
} from '../src/lib/notification';

// =============================================================================
// 工具：mock fetch
// =============================================================================

type FetchHandler = (
  url: string,
  init?: RequestInit,
) => Response | Promise<Response>;

interface CallRecord {
  url: string;
  init?: RequestInit;
}

function mockFetch(handler: FetchHandler, calls: CallRecord[] = []): typeof fetch {
  const fn = (async (input: any, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    calls.push({ url, init });
    return handler(url, init);
  }) as unknown as typeof fetch;
  return fn;
}

function jsonResponse(status: number, body: any, extraHeaders: Record<string, string> = {}): Response {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...extraHeaders,
  };
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERR',
    headers: new Map(Object.entries(headers)) as any,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as unknown as Response;
}

function textResponse(status: number, body: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERR',
    headers: new Map() as any,
    text: async () => body,
    json: async () => JSON.parse(body),
  } as unknown as Response;
}

// =============================================================================
// 工具：生成临时 key pair（RSA for FCM、EC P-256 for APNs）
// =============================================================================

function generateRsaKeyPem(): string {
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  return privateKey;
}

function generateEcKeyPem(): string {
  const { privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  return privateKey;
}

// =============================================================================
// 1. FCM 发送成功（mock fetch + OAuth token）
// =============================================================================

test('FcmClient: 发送成功，OAuth token + Bearer auth + JSON body', async () => {
  const privateKey = generateRsaKeyPem();
  const calls: CallRecord[] = [];

  // 第一次：OAuth token；第二次：messages:send
  const fetchImpl = mockFetch((url) => {
    if (url.includes('oauth2.googleapis.com/token')) {
      return jsonResponse(200, {
        access_token: 'ya29.fake-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
      });
    }
    return jsonResponse(200, {
      name: 'projects/test-project/messages/1234567890',
    });
  }, calls);

  const client = new FcmClient({
    projectId: 'test-project',
    serviceAccount: {
      project_id: 'test-project',
      client_email: 'test@test.iam.gserviceaccount.com',
      private_key: privateKey,
    },
    fetchImpl,
    maxRetries: 0,
  });

  const r = await client.sendToToken('device-token-xxx', {
    title: 'BTC above 100k',
    body: 'Your alert triggered',
    data: { pair: 'BTCUSDT' },
  });

  assert.equal(r.status, 'success');
  assert.equal(r.provider, 'FCM');
  assert.equal(r.messageId, '1234567890');
  assert.equal(calls.length, 2, 'should be 2 calls: OAuth + messages:send');

  // 校验 OAuth 请求
  const oauthCall = calls[0];
  assert.ok(oauthCall.url.includes('oauth2.googleapis.com/token'));
  const oauthBody = oauthCall.init?.body as string;
  assert.ok(oauthBody.includes('grant_type='));
  assert.ok(oauthBody.includes('assertion='));
  // JWT 解析
  const assertion = decodeFormEncoded(oauthBody).assertion;
  const [h, p] = assertion.split('.');
  const header = JSON.parse(base64UrlDecode(h).toString('utf8'));
  const payload = JSON.parse(base64UrlDecode(p).toString('utf8'));
  assert.equal(header.alg, 'RS256');
  assert.equal(payload.iss, 'test@test.iam.gserviceaccount.com');
  assert.ok(payload.scope?.includes('firebase.messaging'));

  // 校验 messages:send 请求
  const sendCall = calls[1];
  assert.ok(sendCall.url.endsWith('/v1/projects/test-project/messages:send'));
  const auth = (sendCall.init?.headers as Record<string, string>).Authorization;
  assert.equal(auth, 'Bearer ya29.fake-access-token');
  const body = JSON.parse(sendCall.init?.body as string);
  assert.equal(body.message.token, 'device-token-xxx');
  assert.equal(body.message.notification.title, 'BTC above 100k');
  assert.equal(body.message.data.pair, 'BTCUSDT');
});

// =============================================================================
// 2. FCM 5xx 重试
// =============================================================================

test('FcmClient: 5xx 触发指数退避重试，最终成功', async () => {
  const privateKey = generateRsaKeyPem();
  let count = 0;

  const fetchImpl = mockFetch((url) => {
    if (url.includes('oauth2.googleapis.com/token')) {
      return jsonResponse(200, { access_token: 'tok', expires_in: 3600 });
    }
    count++;
    if (count < 3) {
      return jsonResponse(503, {
        error: { code: 503, status: 'UNAVAILABLE', message: 'service unavailable' },
      });
    }
    return jsonResponse(200, { name: 'projects/test-project/messages/ok' });
  });

  const client = new FcmClient({
    projectId: 'test-project',
    serviceAccount: {
      project_id: 'test-project',
      client_email: 'test@test.iam.gserviceaccount.com',
      private_key: privateKey,
    },
    fetchImpl,
    maxRetries: 3,
    backoffBaseMs: 1,
  });

  const r = await client.sendToToken('tok', { title: 't', body: 'b' });
  assert.equal(r.status, 'success');
  assert.equal(count, 3, 'should be called 3 times (2 fail + 1 success)');
});

// =============================================================================
// 3. FCM UNREGISTERED → invalid_token
// =============================================================================

test('FcmClient: UNREGISTERED → invalid_token，不再重试', async () => {
  const privateKey = generateRsaKeyPem();
  let count = 0;

  const fetchImpl = mockFetch((url) => {
    if (url.includes('oauth2.googleapis.com/token')) {
      return jsonResponse(200, { access_token: 'tok', expires_in: 3600 });
    }
    count++;
    return jsonResponse(404, {
      error: { code: 404, status: 'UNREGISTERED', message: 'Requested entity was not found.' },
    });
  });

  const client = new FcmClient({
    projectId: 'test-project',
    serviceAccount: {
      project_id: 'test-project',
      client_email: 'test@test.iam.gserviceaccount.com',
      private_key: privateKey,
    },
    fetchImpl,
    maxRetries: 3,
    backoffBaseMs: 1,
  });

  const r = await client.sendToToken('bad-token', { title: 't', body: 'b' });
  assert.equal(r.status, 'invalid_token');
  assert.equal(r.errorCode, '404');
  assert.equal(count, 1, 'should not retry on UNREGISTERED');
});

// =============================================================================
// 4. FCM token + 主题发送
// =============================================================================

test('FcmClient: sendToTopic / sendToCondition 构造 target', async () => {
  const privateKey = generateRsaKeyPem();
  const calls: CallRecord[] = [];

  const fetchImpl = mockFetch((url) => {
    if (url.includes('oauth2.googleapis.com/token')) {
      return jsonResponse(200, { access_token: 'tok', expires_in: 3600 });
    }
    return jsonResponse(200, { name: 'projects/p/messages/1' });
  }, calls);

  const client = new FcmClient({
    projectId: 'test-project',
    serviceAccount: {
      project_id: 'test-project',
      client_email: 'test@test.iam.gserviceaccount.com',
      private_key: privateKey,
    },
    fetchImpl,
    maxRetries: 0,
  });

  // sendToTopic
  const r1 = await client.sendToTopic('news', { title: 't', body: 'b' });
  assert.equal(r1.status, 'success');
  const body1 = JSON.parse(calls[1].init?.body as string);
  assert.equal(body1.message.topic, 'news');

  // sendToCondition：OAuth 缓存命中，只有 1 个新 call
  const r2 = await client.sendToCondition("'topic-a' in topics", { title: 't', body: 'b' });
  assert.equal(r2.status, 'success');
  const body2 = JSON.parse(calls[2].init?.body as string);
  assert.equal(body2.message.condition, "'topic-a' in topics");
});

// =============================================================================
// 5. APNs 发送成功（mock fetch + EC key）
// =============================================================================

test('ApnsClient: 发送成功，ES256 JWT + apns-topic header', async () => {
  const privateKey = generateEcKeyPem();
  const calls: CallRecord[] = [];

  const fetchImpl = mockFetch((url) => {
    assert.ok(url.includes('/3/device/'));
    return jsonResponse(200, '', { 'apns-id': 'apns-msg-123' });
  }, calls);

  const client = new ApnsClient({
    teamId: 'TEAM123456',
    keyId: 'KEY1234567',
    privateKey,
    bundleId: 'com.example.app',
    production: false,
    fetchImpl,
    maxRetries: 0,
  });

  const r = await client.sendToToken('device-token', {
    title: 'Hello',
    body: 'World',
    badge: 5,
  });

  assert.equal(r.status, 'success');
  assert.equal(r.provider, 'APNS');
  assert.equal(r.messageId, 'apns-msg-123');
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.includes('api.sandbox.push.apple.com/3/device/device-token'));

  const headers = calls[0].init?.headers as Record<string, string>;
  assert.ok(headers.authorization?.startsWith('bearer '));
  assert.equal(headers['apns-topic'], 'com.example.app');
  assert.equal(headers['apns-push-type'], 'alert');
  assert.equal(headers['apns-priority'], '5');

  const body = JSON.parse(calls[0].init?.body as string);
  assert.equal(body.aps.alert.title, 'Hello');
  assert.equal(body.aps.badge, 5);
});

// =============================================================================
// 6. APNs 410 Gone → invalid_token
// =============================================================================

test('ApnsClient: 410 Gone → invalid_token', async () => {
  const privateKey = generateEcKeyPem();
  const fetchImpl = mockFetch(() =>
    textResponse(410, JSON.stringify({ reason: 'Unregistered' })),
  );

  const client = new ApnsClient({
    teamId: 'T', keyId: 'K', privateKey, bundleId: 'b',
    fetchImpl, maxRetries: 0,
  });

  const r = await client.sendToToken('dead-token', { title: 't', body: 'b' });
  assert.equal(r.status, 'invalid_token');
  assert.equal(r.errorCode, '410');
});

// =============================================================================
// 7. APNs 429 → rate_limited
// =============================================================================

test('ApnsClient: 429 限流（rate_limited）', async () => {
  const privateKey = generateEcKeyPem();
  let count = 0;
  const fetchImpl = mockFetch(() => {
    count++;
    if (count < 2) return textResponse(429, JSON.stringify({ reason: 'TooManyRequests' }));
    return jsonResponse(200, '', { 'apns-id': 'apns-ok' });
  });

  const client = new ApnsClient({
    teamId: 'T', keyId: 'K', privateKey, bundleId: 'b',
    fetchImpl, maxRetries: 3, backoffBaseMs: 1,
  });

  const r = await client.sendToToken('t', { title: 't', body: 'b' });
  assert.equal(r.status, 'success');
  assert.equal(count, 2, 'should retry after 429');
});

// =============================================================================
// 8. APNs JWT 构造正确（ES256）
// =============================================================================

test('ApnsClient: JWT 头部 + 载荷 + ES256 签名格式正确', async () => {
  const privateKey = generateEcKeyPem();
  const calls: CallRecord[] = [];
  const fetchImpl = mockFetch(() => jsonResponse(200, '', { 'apns-id': 'a' }), calls);

  const client = new ApnsClient({
    teamId: 'TEAMID1234',
    keyId: 'KEYID12345',
    privateKey,
    bundleId: 'b',
    fetchImpl,
  });

  await client.sendToToken('t', { title: 't', body: 'b' });
  const auth = (calls[0].init?.headers as Record<string, string>).authorization!;
  const jwt = auth.replace(/^bearer /, '');

  const [h, p, s] = jwt.split('.');
  const header = JSON.parse(base64UrlDecode(h).toString('utf8'));
  const payload = JSON.parse(base64UrlDecode(p).toString('utf8'));
  const sig = base64UrlDecode(s);

  assert.equal(header.alg, 'ES256');
  assert.equal(header.kid, 'KEYID12345');
  assert.equal(payload.iss, 'TEAMID1234');
  assert.ok(typeof payload.iat === 'number');
  // ES256 签名固定 64 字节（r + s 各 32）
  assert.equal(sig.length, 64);
});

// =============================================================================
// 9. HMS 发送成功（mock fetch）
// =============================================================================

test('HmsClient: 发送成功，OAuth token + Bearer auth + JSON body', async () => {
  const calls: CallRecord[] = [];
  const fetchImpl = mockFetch((url) => {
    if (url.includes('oauth-login.cloud.huawei.com')) {
      return jsonResponse(200, { access_token: 'hms-tok', expires_in: 3600 });
    }
    return jsonResponse(200, { code: '80000000', msg: 'success', requestId: 'req-1' });
  }, calls);

  const client = new HmsClient({
    appId: '100000001',
    appSecret: 'hms-secret',
    fetchImpl,
    maxRetries: 0,
  });

  const r = await client.sendToToken('hms-token', {
    title: '华为推送',
    body: '测试',
    data: { type: 'price-alert' },
  });

  assert.equal(r.status, 'success');
  assert.equal(r.provider, 'HMS');
  assert.equal(calls.length, 2);
  assert.ok(calls[0].url.includes('oauth-login.cloud.huawei.com/oauth2/v3/token'));
  assert.ok(calls[1].url.includes('/v1/100000001/messages:send'));
  const auth = (calls[1].init?.headers as Record<string, string>).Authorization;
  assert.equal(auth, 'Bearer hms-tok');
  const body = JSON.parse(calls[1].init?.body as string);
  assert.deepEqual(body.target, { token: ['hms-token'] });
  assert.equal(body.payload.notification.title, '华为推送');
});

// =============================================================================
// 10. HMS token 刷新
// =============================================================================

test('HmsClient: refreshToken 主动清除缓存，下次重新拿', async () => {
  let tokenCalls = 0;
  const fetchImpl = mockFetch((url) => {
    if (url.includes('oauth-login.cloud.huawei.com')) {
      tokenCalls++;
      return jsonResponse(200, { access_token: `tok-${tokenCalls}`, expires_in: 3600 });
    }
    return jsonResponse(200, { code: '80000000' });
  });

  const client = new HmsClient({
    appId: 'a', appSecret: 's', fetchImpl, maxRetries: 0,
  });

  await client.sendToToken('t1', { title: 't', body: 'b' });
  assert.equal(tokenCalls, 1);
  // 第二次：缓存命中，不调用 OAuth
  await client.sendToToken('t2', { title: 't', body: 'b' });
  assert.equal(tokenCalls, 1);
  // 主动刷新
  await client.refreshToken();
  await client.sendToToken('t3', { title: 't', body: 'b' });
  assert.equal(tokenCalls, 2);
});

// =============================================================================
// 11. HMS 限流
// =============================================================================

test('HmsClient: 80100000 限流（rate_limited） + 重试', async () => {
  let count = 0;
  const fetchImpl = mockFetch((url) => {
    if (url.includes('oauth-login.cloud.huawei.com')) {
      return jsonResponse(200, { access_token: 'tok', expires_in: 3600 });
    }
    count++;
    if (count < 2) {
      return jsonResponse(200, { code: '80100000', message: 'rate limited' });
    }
    return jsonResponse(200, { code: '80000000' });
  });

  const client = new HmsClient({
    appId: 'a', appSecret: 's', fetchImpl, maxRetries: 3, backoffBaseMs: 1,
  });

  const r = await client.sendToToken('t', { title: 't', body: 'b' });
  assert.equal(r.status, 'success');
  assert.equal(count, 2);
});

// =============================================================================
// 12. PushService registerDevice / unregisterDevice
// =============================================================================

test('PushService: registerDevice / unregisterDevice / getUserDevices', () => {
  const svc = createPushService({});
  const d1: DeviceToken = { token: 'a', platform: 'android' };
  const d2: DeviceToken = { token: 'b', platform: 'ios' };

  svc.registerDevice('u1', d1);
  svc.registerDevice('u1', d2);
  assert.equal(svc.getUserDevices('u1').length, 2);

  // 重复注册 → 覆盖
  svc.registerDevice('u1', { token: 'a', platform: 'android', appVersion: '2.0' });
  assert.equal(svc.getUserDevices('u1').length, 2);
  assert.equal(svc.getUserDevices('u1')[0].appVersion, '2.0');

  // 注销
  svc.unregisterDevice('u1', 'a');
  assert.equal(svc.getUserDevices('u1').length, 1);
  assert.equal(svc.getUserDevices('u1')[0].token, 'b');

  // 清空后用户条目删除
  svc.unregisterDevice('u1', 'b');
  assert.equal(svc.getUserDevices('u1').length, 0);
});

// =============================================================================
// 13. PushService sendToUser 按 platform 选 provider
// =============================================================================

test('PushService: sendToUser 按 device.platform 选 provider', async () => {
  const fetchImpl = mockFetch((url) => {
    if (url.includes('oauth2.googleapis.com/token') || url.includes('oauth-login.cloud.huawei.com')) {
      return jsonResponse(200, { access_token: 'tok', expires_in: 3600 });
    }
    return jsonResponse(200, { name: 'projects/p/messages/1' });
  });

  const fcm = createFcmClient({
    projectId: 'p',
    serviceAccount: { project_id: 'p', client_email: 'c', private_key: 'k' },
    fetchImpl,
    maxRetries: 0,
    // 注意：未提供真实 RSA key，自动进入 mockMode（如果未 mockMode，则 OAuth 会失败）
    mockMode: true,
  });
  const hms = createHmsClient({
    appId: 'a', appSecret: 's', mockMode: true,
  });

  const svc = createPushService({ fcm, hms });
  svc.registerDevice('u1', { token: 'android-tok', platform: 'android' });
  svc.registerDevice('u1', { token: 'hms-tok', platform: 'harmony' });

  const results = await svc.sendToUser('u1', { title: 't', body: 'b' });
  assert.equal(results.length, 2);
  // android → FCM
  assert.equal(results.find((r) => r.token === 'android-tok')?.provider, 'FCM');
  // harmony → HMS
  assert.equal(results.find((r) => r.token === 'hms-tok')?.provider, 'HMS');
});

// =============================================================================
// 14. PushService sendToUser 多设备并发
// =============================================================================

test('PushService: sendToUser 多设备并发推送', async () => {
  const fcm = createFcmClient({ mockMode: true });
  const apns = createApnsClient({
    teamId: 'T', keyId: 'K', bundleId: 'b', mockMode: true,
  });
  const svc = createPushService({ fcm, apns });

  svc.registerDevice('u-multi', { token: 'a1', platform: 'android' });
  svc.registerDevice('u-multi', { token: 'a2', platform: 'android' });
  svc.registerDevice('u-multi', { token: 'i1', platform: 'ios' });

  const start = Date.now();
  const results = await svc.sendToUser('u-multi', { title: 't', body: 'b' });
  const elapsed = Date.now() - start;

  assert.equal(results.length, 3);
  assert.ok(results.every((r) => r.status === 'success'));
  // 并发执行，总耗时 < 串行预期
  assert.ok(elapsed < 1000, 'should be fast (mock mode)');
});

// =============================================================================
// 15. PushService sendBroadcast
// =============================================================================

test('PushService: sendBroadcast 走 FCM + HMS topic', async () => {
  const fcm = createFcmClient({ mockMode: true });
  const hms = createHmsClient({ appId: 'a', appSecret: 's', mockMode: true });
  const svc = createPushService({ fcm, hms });

  const results = await svc.sendBroadcast({ title: 'global', body: 'hi' });
  assert.equal(results.length, 2);
  const providers = results.map((r) => r.provider).sort();
  assert.deepEqual(providers, ['FCM', 'HMS']);
});

// =============================================================================
// 16. PushService getStats
// =============================================================================

test('PushService: getStats 统计 totalSent / successCount / byProvider', async () => {
  const fcm = createFcmClient({ mockMode: true });
  const svc = createPushService({ fcm });

  svc.registerDevice('u', { token: 't1', platform: 'android' });
  await svc.sendToUser('u', { title: 't', body: 'b' });
  await svc.sendToUser('u', { title: 't', body: 'b' });

  const stats = svc.getStats();
  assert.equal(stats.totalSent, 2);
  assert.equal(stats.successCount, 2);
  assert.equal(stats.failureCount, 0);
  assert.equal(stats.byProvider.FCM.sent, 2);
  assert.equal(stats.byProvider.FCM.success, 2);
  assert.equal(stats.byProvider.APNS.sent, 0);
});

// =============================================================================
// 17. 断网降级到 mock（未配置）
// =============================================================================

test('PushService: 未配置 client 时自动 mock 成功', async () => {
  const svc = createPushService({}); // 全部未配置
  svc.registerDevice('u', { token: 't', platform: 'android' });
  svc.registerDevice('u', { token: 't2', platform: 'ios' });
  svc.registerDevice('u', { token: 't3', platform: 'harmony' });

  const results = await svc.sendToUser('u', { title: 't', body: 'b' });
  assert.equal(results.length, 3);
  assert.ok(results.every((r) => r.status === 'success'));
  // messageId 是 MOCK-XXX
  assert.ok(results.every((r) => r.messageId.startsWith('MOCK-')));
});

// =============================================================================
// 18. Provider 切换（FCM 失败 → APNs 降级）
// =============================================================================

test('PushService: iOS FCM 失败时降级到 APNs', async () => {
  // FCM 配 mockMode 但 send 抛错模拟
  const fcmBad = {
    sendToToken: async () => ({
      messageId: '',
      provider: 'FCM' as const,
      token: 't',
      status: 'failed' as const,
      errorCode: '-1',
      errorMessage: 'simulated FCM failure',
      sentAt: Date.now(),
    }),
  } as any;

  const apns = createApnsClient({
    teamId: 'T', keyId: 'K', bundleId: 'b', mockMode: true,
  });

  const svc = createPushService({ fcm: fcmBad, apns });
  svc.registerDevice('u', { token: 'ios-tok', platform: 'ios' });

  const results = await svc.sendToUser('u', { title: 't', body: 'b' });
  // iOS → FCM 失败 → 降级 APNs
  assert.equal(results.length, 1);
  assert.equal(results[0].provider, 'APNS');
  assert.equal(results[0].status, 'success');
});

// =============================================================================
// 19. invalidateToken 清理失效 token
// =============================================================================

test('PushService: sendToUser 返回 invalid_token 时自动清理', async () => {
  const fcmBad = {
    sendToToken: async (token: string) => ({
      messageId: '',
      provider: 'FCM' as const,
      token,
      status: token === 'bad' ? ('invalid_token' as const) : ('success' as const),
      errorCode: token === 'bad' ? '404' : undefined,
      errorMessage: token === 'bad' ? 'UNREGISTERED' : undefined,
      sentAt: Date.now(),
    }),
  } as any;

  const svc = createPushService({ fcm: fcmBad });
  svc.registerDevice('u', { token: 'good', platform: 'android' });
  svc.registerDevice('u', { token: 'bad', platform: 'android' });

  const results = await svc.sendToUser('u', { title: 't', body: 'b' });
  assert.equal(results.length, 2);

  // bad token 已被清理
  const devices = svc.getUserDevices('u');
  assert.equal(devices.length, 1);
  assert.equal(devices[0].token, 'good');
});

// =============================================================================
// 20. derToJose 单元测试
// =============================================================================

test('derToJose: 把 ECDSA DER 签名转 64 字节 JOSE 格式', () => {
  // 构造标准 DER 签名（r=32 bytes, s=32 bytes）：
  //   0x30 0x44  - SEQUENCE, length=68 (0x44)
  //   0x02 0x20  - INTEGER (r), length=32
  //   [32 bytes r]
  //   0x02 0x20  - INTEGER (s), length=32
  //   [32 bytes s]
  const r = Buffer.alloc(32, 0x11);
  const s = Buffer.alloc(32, 0x22);
  const der = Buffer.concat([
    Buffer.from([0x30, 0x44, 0x02, 0x20]),
    r,
    Buffer.from([0x02, 0x20]),
    s,
  ]);
  const jose = derToJose(der, 32);
  assert.equal(jose.length, 64);
  assert.deepEqual(jose.subarray(0, 32), r);
  assert.deepEqual(jose.subarray(32, 64), s);
});

// =============================================================================
// 21. sendToUsers 批量
// =============================================================================

test('PushService: sendToUsers 批量发送', async () => {
  const fcm = createFcmClient({ mockMode: true });
  const svc = createPushService({ fcm });
  for (let i = 0; i < 5; i++) {
    svc.registerDevice(`u${i}`, { token: `t${i}`, platform: 'android' });
  }
  const results = await svc.sendToUsers(['u0', 'u1', 'u2', 'u3', 'u4'], { title: 't', body: 'b' });
  assert.equal(results.length, 5);
  assert.ok(results.every((r) => r.status === 'success'));
});

// =============================================================================
// 22. onPushSent 事件订阅
// =============================================================================

test('PushService: onPushSent 事件总线', async () => {
  const events: string[] = [];
  const fcm = createFcmClient({ mockMode: true });
  const svc = createPushService({ fcm });

  const unsub = svc.onPushSent((e) => events.push(e.type));
  svc.registerDevice('u', { token: 't', platform: 'android' });
  await svc.sendToUser('u', { title: 't', body: 'b' });

  assert.ok(events.includes('registered'));
  assert.ok(events.includes('sent'));
  unsub();
});

// =============================================================================
// 工具：解析 application/x-www-form-urlencoded
// =============================================================================

function decodeFormEncoded(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of s.split('&')) {
    const [k, v = ''] = part.split('=');
    out[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return out;
}
