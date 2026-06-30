/**
 * 活体检测多厂商适配器测试（任务 P1 J-02）
 *
 * 覆盖：
 *  1. 百度 Token 获取（mock fetch）
 *  2. 百度活体（视频 + 图片）
 *  3. 百度 5xx 重试
 *  4. 腾讯 TC3 签名正确性（对照官方签名格式）
 *  5. 腾讯活体检测
 *  6. 腾讯签名 Header 完整性
 *  7. 旷视 Basic Auth 头
 *  8. 旷视活体检测
 *  9. LivenessService first_success 策略
 * 10. LivenessService 自动降级（A 失败 → B）
 * 11. LivenessService 全部失败抛错
 * 12. LivenessService getStats 统计
 * 13. 单厂商不可用降级 < 5s
 * 14. 断网降级到 mock
 * 15. majority / all 聚合策略
 * 16. addProvider / removeProvider 动态管理
 * 17. onVerification 事件订阅
 *
 * 运行：
 *   npx tsx --test tests/liveness-providers.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';

import {
  BaiduLivenessClient,
  BAIDU_ENDPOINTS,
} from '../src/lib/kyc/liveness/baidu-client';
import {
  TencentLivenessClient,
  canonicalQueryString,
  buildCanonicalHeaders,
  sha256Hex,
  hmac256Hex,
  TENCENT_FACEID_API,
} from '../src/lib/kyc/liveness/tencent-client';
import {
  MegviiLivenessClient,
  MEGVII_ENDPOINTS,
} from '../src/lib/kyc/liveness/megvii-client';
import {
  LivenessService,
} from '../src/lib/kyc/liveness/liveness-service';
import {
  LIVENESS_DEFAULT_PROVIDER_PRIORITY,
  type LivenessResult,
  type LivenessProvider,
} from '../src/lib/kyc/liveness/types';
import { KycError } from '../src/lib/auth/errors';

// ---------------------------------------------------------------------------
// 测试工具
// ---------------------------------------------------------------------------

interface FetchCall {
  url: string;
  init: RequestInit | undefined;
}

const createMockFetch = (
  handler: (call: FetchCall, index: number, history: FetchCall[]) => Response | Promise<Response>,
) => {
  const history: FetchCall[] = [];
  let idx = 0;
  const fn = async (url: string, init?: RequestInit): Promise<Response> => {
    const call: FetchCall = { url, init };
    history.push(call);
    const cur = idx++;
    return handler(call, cur, history);
  };
  return Object.assign(fn, { history }) as typeof fetch & { history: FetchCall[] };
};

const jsonResponse = (status: number, body: any): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

// ===========================================================================
// 1. 百度
// ===========================================================================

test('baidu: token fetch (mock fetch)', async () => {
  let tokenCalls = 0;
  const fetchMock = createMockFetch((call, i) => {
    if (call.url.startsWith('https://aip.baidubce.com/oauth/2.0/token')) {
      tokenCalls += 1;
      return jsonResponse(200, {
        access_token: 'mock-access-token',
        expires_in: 2592000,
      });
    }
    // video verify
    return jsonResponse(200, {
      err_no: 0,
      err_msg: 'OK',
      result: {
        face_liveness: { score: 95, passed_actions: ['blink', 'mouth_open'] },
        face_match: { score: 92, matched_fields: ['id_card_number', 'name'] },
      },
    });
  });

  const client = new BaiduLivenessClient({
    apiKey: 'real-api-key',
    secretKey: 'real-secret',
    fetchImpl: fetchMock,
  });
  const result = await client.verifyWithVideo({
    userId: 'u1',
    type: 'video',
    videoUrl: 'https://oss.example.com/liveness.mp4',
    idCardNumber: '110101199003073116',
    name: '张三',
  });
  assert.equal(result.provider, 'BAIDU');
  assert.equal(result.passed, true);
  assert.equal(tokenCalls, 1);
  // 第二次调用命中缓存
  const r2 = await client.verifyWithVideo({
    userId: 'u2',
    type: 'video',
    videoUrl: 'https://oss.example.com/liveness2.mp4',
  });
  assert.equal(r2.passed, true);
  assert.equal(tokenCalls, 1, 'token 应当缓存复用');
});

test('baidu: liveness (video + image)', async () => {
  const fetchMock = createMockFetch((call) => {
    if (call.url.includes('/oauth/2.0/token')) {
      return jsonResponse(200, { access_token: 'tok', expires_in: 2592000 });
    }
    if (call.url.includes('/face/v1/faceverify')) {
      return jsonResponse(200, {
        err_no: 0,
        result: {
          face_liveness: { score: 96 },
          face_match: { score: 93 },
        },
      });
    }
    if (call.url.includes('/face/v3/faceverify')) {
      return jsonResponse(200, {
        err_no: 0,
        result: {
          face_liveness: { score: 97, spoofing: 0 },
          face_match: { score: 92 },
          quality_control: { score: 90 },
        },
      });
    }
    return jsonResponse(404, { error_code: 0 });
  });
  const client = new BaiduLivenessClient({
    apiKey: 'real', secretKey: 'real', fetchImpl: fetchMock,
  });
  const v = await client.verifyWithVideo({
    userId: 'u', type: 'video', videoUrl: 'https://x/y.mp4',
  });
  assert.equal(v.passed, true);
  assert.equal(v.livenessScore > 0.9, true);
  const img = await client.verifyWithImage({
    userId: 'u', type: 'silent', imageUrl: 'https://x/y.jpg',
  });
  assert.equal(img.passed, true);
  assert.equal(img.details?.spoof, false);
});

test('baidu: 5xx retries', async () => {
  let attempts = 0;
  const fetchMock = createMockFetch((call) => {
    if (call.url.includes('/oauth/2.0/token')) {
      return jsonResponse(200, { access_token: 'tok', expires_in: 2592000 });
    }
    attempts += 1;
    if (attempts < 3) {
      return new Response('boom', { status: 503 });
    }
    return jsonResponse(200, {
      err_no: 0,
      result: { face_liveness: { score: 96 }, face_match: { score: 92 } },
    });
  });
  const client = new BaiduLivenessClient({
    apiKey: 'real',
    secretKey: 'real',
    fetchImpl: fetchMock,
    retries: 3,
    retryBackoffMs: 1, // 加速测试
  });
  const r = await client.verifyWithVideo({
    userId: 'u', type: 'video', videoUrl: 'https://x/y.mp4',
  });
  assert.equal(r.passed, true);
  assert.equal(attempts, 3, '应当重试直到第 3 次成功');
});

test('baidu: mock api key triggers mock mode', async () => {
  const client = new BaiduLivenessClient({ apiKey: 'mock-key', secretKey: 'mock-secret' });
  assert.equal(client.isMock(), true);
  const r = await client.verifyWithVideo({
    userId: 'u', type: 'video', videoUrl: 'https://x/y.mp4',
  });
  assert.equal(r.passed, true);
  assert.equal(r.rawResponse?.mock, true);
});

// ===========================================================================
// 2. 腾讯云（TC3 签名）
// ===========================================================================

test('tencent: TC3 signRequest generates correct signature', () => {
  // 对照官方签名示例：https://cloud.tencent.com/document/api/1721/101843
  const client = new TencentLivenessClient({
    secretId: 'AKIDz8krbsJ5yKBZQpn74WFkmLPx3EXAMPLE',
    secretKey: 'Gu5t9xGARNpq86cd98joQYCN3EXAMPLEKEY',
  });
  const ts = 1700000000;
  const date = '2023-11-14';
  const body = '{"VideoBase64":"dGVzdA=="}';
  const signed = client.signRequest({
    method: 'POST',
    uri: '/',
    query: {},
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body,
    service: 'faceid',
    secretId: 'AKIDz8krbsJ5yKBZQpn74WFkmLPx3EXAMPLE',
    secretKey: 'Gu5t9xGARNpq86cd98joQYCN3EXAMPLEKEY',
    timestamp: ts,
    date,
  });
  // 1. Authorization 头存在 + 前缀
  assert.ok(signed.headers.Authorization.startsWith('TC3-HMAC-SHA256 '));
  // 2. 必须包含 Credential / SignedHeaders / Signature
  const auth = signed.headers.Authorization;
  assert.ok(auth.includes('Credential=AKIDz8krbsJ5yKBZQpn74WFkmLPx3EXAMPLE/2023-11-14/faceid/tc3_request'));
  assert.ok(auth.includes('SignedHeaders='));
  assert.ok(auth.includes('Signature='));
  // 3. 必要 header 齐全
  assert.equal(signed.headers['X-TC-Action'], 'DetectLiveFace');
  assert.equal(signed.headers['X-TC-Timestamp'], String(ts));
  assert.equal(signed.headers['X-TC-Version'], '2018-03-01');
  assert.equal(signed.headers['X-TC-Region'], 'ap-guangzhou');
  assert.equal(signed.headers['Host'], 'faceid.tencentcloudapi.com');
});

test('tencent: manually compute TC3 signature and compare', () => {
  // 同样的输入，独立用标准 SHA256/HMAC 计算，应与 signRequest 一致
  const secretId = 'AKIDz8krbsJ5yKBZQpn74WFkmLPx3EXAMPLE';
  const secretKey = 'Gu5t9xGARNpq86cd98joQYCN3EXAMPLEKEY';
  const method = 'POST';
  const uri = '/';
  const query = {};
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    Host: 'faceid.tencentcloudapi.com', // Host 必须参与签名
  };
  const body = '{"VideoBase64":"dGVzdA=="}';
  const service = 'faceid';
  const ts = 1700000000;
  const date = '2023-11-14';

  const hashedRequestPayload = sha256Hex(body);
  const canonicalHeaders = buildCanonicalHeaders(headers);
  const signedHeaders = Object.keys(headers)
    .map((k) => k.toLowerCase())
    .sort()
    .join(';');
  const queryString = canonicalQueryString(query);
  const canonicalRequest = [
    method,
    uri,
    queryString,
    canonicalHeaders,
    signedHeaders,
    hashedRequestPayload,
  ].join('\n');
  const credentialScope = `${date}/${service}/tc3_request`;
  const hashedCanonicalRequest = sha256Hex(canonicalRequest);
  const stringToSign = [
    'TC3-HMAC-SHA256',
    String(ts),
    credentialScope,
    hashedCanonicalRequest,
  ].join('\n');

  const secretDate = createHmac('sha256', `TC3${secretKey}`).update(date).digest();
  const secretService = createHmac('sha256', secretDate).update(service).digest();
  const secretSigning = createHmac('sha256', secretService).update('tc3_request').digest();
  const expectedSig = createHmac('sha256', secretSigning).update(stringToSign).digest('hex');

  const client = new TencentLivenessClient({ secretId, secretKey });
  const signed = client.signRequest({
    method, uri, query, headers, body, service, secretId, secretKey, timestamp: ts, date,
  });
  const actualSig = signed.headers.Authorization.split('Signature=')[1];
  assert.equal(actualSig, expectedSig, 'TC3 签名必须与标准算法完全一致');
});

test('tencent: liveness detection (mock fetch)', async () => {
  const fetchMock = createMockFetch((call) => {
    return jsonResponse(200, {
      Response: {
        Result: { Score: 96, Sim: 92, IsLiveness: true, Quality: 90 },
        RequestId: 'test',
      },
    });
  });
  const client = new TencentLivenessClient({
    secretId: 'real', secretKey: 'real', fetchImpl: fetchMock,
  });
  const r = await client.verifyWithVideo({
    userId: 'u', type: 'video', videoBase64: 'dGVzdA==',
    idCardNumber: '110101199003073116', name: '张三',
  });
  assert.equal(r.provider, 'TENCENT');
  assert.equal(r.passed, true);
  assert.equal(r.livenessScore > 0.9, true);
});

test('tencent: signature header contains all required fields', async () => {
  let capturedAuth = '';
  const fetchMock = createMockFetch((call) => {
    capturedAuth = (call.init?.headers as any)?.Authorization || '';
    return jsonResponse(200, {
      Response: { Result: { Score: 95, Sim: 90 }, RequestId: 'rid' },
    });
  });
  const client = new TencentLivenessClient({
    secretId: 'real', secretKey: 'real', fetchImpl: fetchMock,
  });
  await client.verifyWithVideo({
    userId: 'u', type: 'video', videoBase64: 'dGVzdA==',
  });
  assert.ok(capturedAuth.startsWith('TC3-HMAC-SHA256 '));
  assert.ok(capturedAuth.includes('Credential=real/'));
  assert.ok(capturedAuth.includes('/faceid/tc3_request'));
  assert.ok(capturedAuth.includes('SignedHeaders=content-type;host'));
  assert.ok(capturedAuth.includes('Signature='));
});

test('tencent: 5xx retries', async () => {
  let n = 0;
  const fetchMock = createMockFetch(() => {
    n += 1;
    if (n < 2) return new Response('boom', { status: 502 });
    return jsonResponse(200, { Response: { Result: { Score: 96, Sim: 92 } } });
  });
  const client = new TencentLivenessClient({
    secretId: 'real', secretKey: 'real', fetchImpl: fetchMock, retries: 3, retryBackoffMs: 1,
  });
  const r = await client.verifyWithVideo({
    userId: 'u', type: 'video', videoBase64: 'dGVzdA==',
  });
  assert.equal(r.passed, true);
  assert.equal(n, 2);
});

test('tencent: mock secret id triggers mock mode', async () => {
  const client = new TencentLivenessClient({
    secretId: 'mock-secret-id', secretKey: 'mock-secret',
  });
  assert.equal(client.isMock(), true);
  const r = await client.verifyWithVideo({
    userId: 'u', type: 'video', videoBase64: 'dGVzdA==',
  });
  assert.equal(r.passed, true);
});

// ===========================================================================
// 3. 旷视（Face++）
// ===========================================================================

test('megvii: Basic Auth header is correct', () => {
  const apiKey = 'my_api_key';
  const apiSecret = 'my_api_secret';
  const expected = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;
  const client = new MegviiLivenessClient({ apiKey, apiSecret });
  assert.equal(client.getAuthHeader(), expected);
});

test('megvii: liveness (video + image)', async () => {
  const fetchMock = createMockFetch((call) => {
    if (call.url.includes('/faceid/v1/faceverify')) {
      // 校验 Basic Auth
      const auth = (call.init?.headers as any)?.Authorization || '';
      assert.ok(auth.startsWith('Basic '));
      return jsonResponse(200, {
        liveness_result: 95,
        confidence: 92,
        idcard_number_match: true,
        idcard_name_match: true,
        face_quality: { score: 90 },
      });
    }
    if (call.url.includes('/faceid/v1/imageverify')) {
      return jsonResponse(200, { liveness_result: 96, confidence: 93 });
    }
    return jsonResponse(404, { error_message: 'not found' });
  });
  const client = new MegviiLivenessClient({ apiKey: 'k', apiSecret: 's', fetchImpl: fetchMock });
  const v = await client.verifyWithVideo({
    userId: 'u', type: 'video', videoUrl: 'https://x/y.mp4',
    idCardNumber: '110101199003073116', name: '张三',
  });
  assert.equal(v.passed, true);
  assert.deepEqual(v.details?.matchedFields, ['id_card_number', 'name']);
  const img = await client.verifyWithImage({
    userId: 'u', type: 'silent', imageUrl: 'https://x/y.jpg',
  });
  assert.equal(img.passed, true);
});

test('megvii: 5xx retries', async () => {
  let n = 0;
  const fetchMock = createMockFetch(() => {
    n += 1;
    if (n < 2) return new Response('boom', { status: 500 });
    return jsonResponse(200, { liveness_result: 95, confidence: 92 });
  });
  const client = new MegviiLivenessClient({
    apiKey: 'k', apiSecret: 's', fetchImpl: fetchMock, retries: 3, retryBackoffMs: 1,
  });
  const r = await client.verifyWithImage({ userId: 'u', type: 'silent', imageUrl: 'https://x' });
  assert.equal(r.passed, true);
  assert.equal(n, 2);
});

test('megvii: mock api key triggers mock mode', async () => {
  const client = new MegviiLivenessClient({ apiKey: 'mock_key', apiSecret: 'mock_secret' });
  assert.equal(client.isMock(), true);
  const r = await client.verifyWithVideo({ userId: 'u', type: 'video', videoUrl: 'https://x' });
  assert.equal(r.passed, true);
});

// ===========================================================================
// 4. LivenessService（多厂商切换 + 聚合）
// ===========================================================================

/** 工厂：基于 mock 客户端构造 LivenessService */
const buildService = (
  overrides: {
    baiduMock?: boolean;
    tencentMock?: boolean;
    megviiMock?: boolean;
    priority?: LivenessProvider[];
    strategy?: 'first_success' | 'majority' | 'all';
    overallTimeoutMs?: number;
  } = {},
) => {
  return new LivenessService({
    baidu: new BaiduLivenessClient({
      // 默认全部走 mock（apiKey 含 'mock'），避免在 LivenessService 测试中真实调远端
      apiKey: overrides.baiduMock === false ? 'real-key' : 'mock-key',
      secretKey: overrides.baiduMock === false ? 'real-secret' : 'mock-secret',
    }),
    tencent: new TencentLivenessClient({
      secretId: overrides.tencentMock === false ? 'real-secret-id' : 'mock-secret-id',
      secretKey: overrides.tencentMock === false ? 'real-secret-key' : 'mock-secret-key',
    }),
    megvii: new MegviiLivenessClient({
      apiKey: overrides.megviiMock === false ? 'real-key' : 'mock-key',
      apiSecret: overrides.megviiMock === false ? 'real-secret' : 'mock-secret',
    }),
    priority: overrides.priority,
    strategy: overrides.strategy,
    overallTimeoutMs: overrides.overallTimeoutMs,
  });
};

test('LivenessService: first_success returns first mock provider', async () => {
  const service = buildService({ priority: ['BAIDU', 'TENCENT', 'MEGVII'] });
  const r = await service.verify({
    userId: 'u', type: 'video', videoUrl: 'https://x/y.mp4',
  });
  assert.equal(r.provider, 'BAIDU');
  assert.equal(r.passed, true);
});

test('LivenessService: auto fallback A fail → B', async () => {
  // BAIDU 真实（不 mock）+ fetch 抛错 → 自动降级到 TENCENT mock 通过
  const fetchMock = createMockFetch(() => {
    throw new Error('baidu network down');
  });
  const service = new LivenessService({
    baidu: new BaiduLivenessClient({ apiKey: 'real-key', secretKey: 'real-secret', fetchImpl: fetchMock }),
    tencent: new TencentLivenessClient({ secretId: 'mock-secret-id', secretKey: 'mock' }),
    megvii: new MegviiLivenessClient({ apiKey: 'mock-key', apiSecret: 'mock' }),
    priority: ['BAIDU', 'TENCENT', 'MEGVII'],
  });
  const r = await service.verify({
    userId: 'u', type: 'video', videoUrl: 'https://x/y.mp4',
  });
  assert.equal(r.provider, 'TENCENT');
  assert.equal(r.passed, true);
  const stats = service.getStats();
  assert.equal(stats.failureCount, 1);
  assert.equal(stats.successCount, 1);
});

test('LivenessService: all fail throws KYC_LIVENESS_ALL_FAILED', async () => {
  // 临时构造：所有厂商都网络错误
  const fetchMock = createMockFetch(() => {
    throw new Error('offline');
  });
  const service = new LivenessService({
    baidu: new BaiduLivenessClient({ apiKey: 'real-key', secretKey: 'real-secret', fetchImpl: fetchMock }),
    tencent: new TencentLivenessClient({ secretId: 'real-secret-id', secretKey: 'real', fetchImpl: fetchMock }),
    megvii: new MegviiLivenessClient({ apiKey: 'real-key', apiSecret: 'real-secret', fetchImpl: fetchMock }),
    priority: ['BAIDU', 'TENCENT', 'MEGVII'],
    overallTimeoutMs: 1_000,
  });
  await assert.rejects(
    service.verify({ userId: 'u', type: 'video', videoUrl: 'https://x/y.mp4' }),
    (err: unknown) => {
      assert.ok(err instanceof KycError);
      assert.equal((err as KycError).code, 'KYC_LIVENESS_ALL_FAILED');
      return true;
    },
  );
});

test('LivenessService: getStats aggregates per provider', async () => {
  const service = buildService();
  const p1 = await service.verify({ userId: 'u1', type: 'video', videoUrl: 'https://x/y.mp4' });
  const p2 = await service.verify({ userId: 'u2', type: 'silent', imageUrl: 'https://x/y.jpg' });
  const stats = service.getStats();
  assert.equal(stats.totalCalls >= 2, true);
  assert.equal(stats.successCount >= 2, true);
  // 每次 verify 至少调用 1 个厂商（默认 BAIDU 优先）
  assert.equal(p1.passed, true, 'p1 应通过');
  assert.equal(p2.passed, true, 'p2 应通过');
  assert.equal(stats.byProvider.BAIDU.calls >= 1, true, `BAIDU.calls=${stats.byProvider.BAIDU.calls} 应 >= 1`);
  // avgLatency 可能为 0（mock 同步极快）；但 success 计数应正确
  assert.equal(stats.byProvider.BAIDU.success >= 1, true, `BAIDU.success=${stats.byProvider.BAIDU.success} 应 >= 1`);
});

test('LivenessService: degraded < 5s on single provider unavailable', async () => {
  // 让 BAIDU 真实（不 mock）且 fetch 失败 → 自动降级到 TENCENT mock
  const fetchMock = createMockFetch(() => {
    throw new Error('network down');
  });
  const service = new LivenessService({
    baidu: new BaiduLivenessClient({ apiKey: 'real-key', secretKey: 'real-secret', fetchImpl: fetchMock }),
    tencent: new TencentLivenessClient({ secretId: 'mock-secret-id', secretKey: 'mock' }),
    megvii: new MegviiLivenessClient({ apiKey: 'mock-key', apiSecret: 'mock' }),
    priority: ['BAIDU', 'TENCENT', 'MEGVII'],
    overallTimeoutMs: 5_000,
  });
  const start = Date.now();
  const r = await service.verify({ userId: 'u', type: 'video', videoUrl: 'https://x/y.mp4' });
  const elapsed = Date.now() - start;
  assert.equal(r.provider, 'TENCENT');
  assert.ok(elapsed < 5_000, `降级耗时 ${elapsed}ms 应 < 5000ms`);
});

test('LivenessService: all providers network down → throws', async () => {
  const fetchMock = createMockFetch(() => {
    throw new Error('offline');
  });
  const service = new LivenessService({
    baidu: new BaiduLivenessClient({ apiKey: 'real-key', secretKey: 'real-secret', fetchImpl: fetchMock }),
    tencent: new TencentLivenessClient({ secretId: 'real-secret-id', secretKey: 'real', fetchImpl: fetchMock }),
    megvii: new MegviiLivenessClient({ apiKey: 'real-key', apiSecret: 'real', fetchImpl: fetchMock }),
    priority: ['BAIDU', 'TENCENT', 'MEGVII'],
    overallTimeoutMs: 1_000,
  });
  await assert.rejects(
    service.verify({ userId: 'u', type: 'video', videoUrl: 'https://x/y.mp4' }),
    (err: unknown) => err instanceof KycError && (err as KycError).code === 'KYC_LIVENESS_ALL_FAILED',
  );
});

test('LivenessService: addProvider / removeProvider', () => {
  const service = buildService({ priority: ['BAIDU', 'MEGVII'] });
  const before = service.getPriority();
  assert.deepEqual(before, ['BAIDU', 'MEGVII']);
  service.addProvider('TENCENT', 0);
  const after = service.getPriority();
  assert.deepEqual(after, ['TENCENT', 'BAIDU', 'MEGVII']);
  service.removeProvider('BAIDU');
  assert.deepEqual(service.getPriority(), ['TENCENT', 'MEGVII']);
});

test('LivenessService: onVerification event subscription', async () => {
  const service = buildService({ priority: ['BAIDU'] });
  const seen: LivenessResult[] = [];
  const off = service.onVerification((r) => seen.push(r));
  await service.verify({ userId: 'u', type: 'video', videoUrl: 'https://x/y.mp4' });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].provider, 'BAIDU');
  off();
  await service.verify({ userId: 'u2', type: 'video', videoUrl: 'https://x/y.mp4' });
  assert.equal(seen.length, 1, '反订阅后应不再收到事件');
});

test('LivenessService: majority strategy', async () => {
  // 3 个厂商都 mock，2 个通过，1 个失败 → majority 通过
  const service = buildService({
    priority: ['BAIDU', 'TENCENT', 'MEGVII'],
    strategy: 'majority',
  });
  const r = await service.verify({ userId: 'u', type: 'video', videoUrl: 'https://x/y.mp4' });
  assert.equal(r.passed, true);
  // 合并 rawResponse 应包含 3 个结果
  assert.ok(r.rawResponse?.merged);
  assert.equal((r.rawResponse?.results || []).length, 3);
});

test('LivenessService: all strategy merges results', async () => {
  const service = buildService({
    priority: ['BAIDU', 'MEGVII'],
    strategy: 'all',
  });
  const r = await service.verify({ userId: 'u', type: 'silent', imageUrl: 'https://x/y.jpg' });
  assert.ok(r.rawResponse?.merged);
  assert.equal((r.rawResponse?.providers || []).length, 2);
});

test('LivenessService: default priority is ALICLOUD-first then others', () => {
  // 单元测试：仅校验默认常量
  assert.deepEqual(LIVENESS_DEFAULT_PROVIDER_PRIORITY, ['ALICLOUD', 'BAIDU', 'TENCENT', 'MEGVII']);
});

test('LivenessService: preferred providers override default', async () => {
  const service = buildService({ priority: ['BAIDU', 'TENCENT', 'MEGVII'] });
  const r = await service.verify(
    { userId: 'u', type: 'video', videoUrl: 'https://x/y.mp4' },
    ['MEGVII'], // 临时指定 MEGVII 最先
  );
  assert.equal(r.provider, 'MEGVII');
});

test('LivenessService: missing userId throws', async () => {
  const service = buildService();
  await assert.rejects(
    // @ts-ignore 故意缺 userId
    service.verify({ type: 'video', videoUrl: 'https://x' }),
    (err: unknown) => err instanceof KycError && (err as KycError).code === 'KYC_LIVENESS_INPUT',
  );
});

// ===========================================================================
// 5. 综合：降级 < 5s
// ===========================================================================

test('LivenessService: complete degradation scenario < 5s', async () => {
  // 模拟 BAIDU + TENCENT 都不可用，MEGVII mock 成功
  const fetchMock = createMockFetch(() => {
    throw new Error('provider down');
  });
  const service = new LivenessService({
    baidu: new BaiduLivenessClient({ apiKey: 'real-key', secretKey: 'real-secret', fetchImpl: fetchMock }),
    tencent: new TencentLivenessClient({ secretId: 'real-secret-id', secretKey: 'real', fetchImpl: fetchMock }),
    megvii: new MegviiLivenessClient({ apiKey: 'mock-key', apiSecret: 'mock-secret' }),
    priority: ['BAIDU', 'TENCENT', 'MEGVII'],
    overallTimeoutMs: 5_000,
  });
  const start = Date.now();
  const r = await service.verify({ userId: 'u', type: 'video', videoUrl: 'https://x/y.mp4' });
  const elapsed = Date.now() - start;
  assert.equal(r.provider, 'MEGVII');
  assert.equal(r.passed, true);
  assert.ok(elapsed < 5_000, `降级耗时 ${elapsed}ms 应 < 5s`);
});
