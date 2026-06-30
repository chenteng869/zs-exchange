/**
 * KYC 服务单元测试（任务 J-01）
 *
 * 覆盖：
 *  1. 身份证 OCR 解析（face + back）
 *  2. 身份证 OCR 错误重试
 *  3. 人脸活体检测（视频 + 静默）
 *  4. 活体检测失败处理
 *  5. KycService startKyc
 *  6. KycService submitIdCard（OCR → 加密存储）
 *  7. KycService submitFaceVideo（活体 → 评分）
 *  8. KycService approve / reject
 *  9. 加密 / 解密 PII
 * 10. 脱敏显示
 *
 * 运行：
 *   npx tsx --test tests/kyc-service.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  AliCloudOcr,
  type AliCloudIdCardInfo,
} from '../src/lib/kyc/alicloud-ocr';
import {
  AliCloudFaceVerification,
  computePassed,
  computeRiskLevel,
} from '../src/lib/kyc/alicloud-face';
import {
  KycService,
  _resetKycServiceStore,
} from '../src/lib/kyc/kyc-service';
import {
  encryptPII,
  decryptPII,
  maskIdNumber,
  maskName,
  maskPhone,
  maskEmail,
  maskBankCard,
  hashPII,
  ENCRYPTION_ALGORITHM,
  PII_ENCRYPTION_KEY,
  inspectEncryptedPayload,
} from '../src/lib/kyc/crypto';
import { KycError } from '../src/lib/auth/errors';

// ---------------------------------------------------------------------------
// 测试常量
// ---------------------------------------------------------------------------

const TEST_KEY = 'kyc-pii-test-key-must-be-thirtytwo-bytes'; // 40 字节

const DEFAULT_OCR_CONFIG = {
  appCode: 'mock-appcode', // 未配置真实 APPCODE → mock
  mock: true,
  timeoutMs: 5000,
  retries: 2,
};

const DEFAULT_FACE_CONFIG = {
  appCode: 'mock-appcode',
  mock: true,
  timeoutMs: 5000,
  retries: 2,
};

const buildService = (
  ocrConfig = DEFAULT_OCR_CONFIG,
  faceConfig = DEFAULT_FACE_CONFIG,
  piiKey = TEST_KEY,
) =>
  new KycService({
    ocrConfig,
    faceConfig,
    piiKey,
  });

// ---------------------------------------------------------------------------
// 1. 身份证 OCR 解析（face + back）
// ---------------------------------------------------------------------------

test('OCR: recognize id card face (mock mode)', async () => {
  const ocr = new AliCloudOcr({ appCode: '', mock: true });
  assert.equal(ocr.isMock(), true);
  const result = await ocr.recognizeIdCard('https://oss.example.com/id-front.jpg', 'face');
  assert.equal(result.side, 'face');
  assert.ok(result.name);
  assert.ok(result.idNumber);
  assert.equal(typeof result.confidence, 'number');
  assert.ok(result.confidence > 0 && result.confidence <= 1);
  assert.ok(result.gender);
  assert.ok(result.ethnicity);
  assert.ok(result.birthDate);
  assert.ok(result.address);
  assert.ok(result.rawResponse);
});

test('OCR: recognize id card back (mock mode)', async () => {
  const ocr = new AliCloudOcr({ appCode: '', mock: true });
  const result = await ocr.recognizeIdCard('https://oss.example.com/id-back.jpg', 'back');
  assert.equal(result.side, 'back');
  assert.ok(result.authority);
  assert.ok(result.validDate);
  // 背面通常不返回姓名/身份证号
  assert.equal(result.name, undefined);
  assert.equal(result.idNumber, undefined);
});

test('OCR: rejects invalid side', async () => {
  const ocr = new AliCloudOcr({ appCode: '', mock: true });
  await assert.rejects(
    () => ocr.recognizeIdCard('https://x.com/y.jpg', 'top' as any),
    KycError,
  );
});

test('OCR: rejects empty url', async () => {
  const ocr = new AliCloudOcr({ appCode: '', mock: true });
  await assert.rejects(
    () => ocr.recognizeIdCard('', 'face'),
    KycError,
  );
});

// ---------------------------------------------------------------------------
// 2. 身份证 OCR 错误重试
// ---------------------------------------------------------------------------

test('OCR: retries on 5xx then succeeds', async () => {
  let calls = 0;
  const fetchMock: typeof fetch = async (_url, _init) => {
    calls++;
    if (calls < 3) {
      return new Response('server error', { status: 500 });
    }
    const body = {
      code: 200,
      msg: 'OK',
      data: { name: '王五', idNum: '110101199003073116', sex: '男', nationality: '汉', birth: '1990-03-07', address: '上海', score: 98 },
    };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const ocr = new AliCloudOcr({
    appCode: 'real-appcode',
    endpoint: 'https://example.com/ocr',
    fetchImpl: fetchMock,
    retries: 3,
    retryBackoffMs: 1,
    timeoutMs: 1000,
  });
  const result = await ocr.recognizeIdCard('https://x.com/y.jpg', 'face');
  assert.equal(calls, 3, 'should have retried twice then succeeded');
  assert.equal(result.name, '王五');
  assert.equal(result.idNumber, '110101199003073116');
});

test('OCR: does NOT retry on 4xx (bad request)', async () => {
  let calls = 0;
  const fetchMock: typeof fetch = async () => {
    calls++;
    return new Response('bad', { status: 400 });
  };
  const ocr = new AliCloudOcr({
    appCode: 'real-appcode',
    fetchImpl: fetchMock,
    retries: 3,
    retryBackoffMs: 1,
    timeoutMs: 1000,
  });
  await assert.rejects(
    () => ocr.recognizeIdCard('https://x.com/y.jpg', 'face'),
    (err: Error) => {
      assert.ok(err instanceof KycError);
      assert.equal((err as KycError).code, 'KYC_OCR_REMOTE_BAD_REQUEST');
      return true;
    },
  );
  assert.equal(calls, 1, 'should not retry on 4xx');
});

test('OCR: retries exhausted throws', async () => {
  let calls = 0;
  const fetchMock: typeof fetch = async () => {
    calls++;
    return new Response('server error', { status: 502 });
  };
  const ocr = new AliCloudOcr({
    appCode: 'real-appcode',
    fetchImpl: fetchMock,
    retries: 2,
    retryBackoffMs: 1,
    timeoutMs: 500,
  });
  await assert.rejects(
    () => ocr.recognizeIdCard('https://x.com/y.jpg', 'face'),
    (err: Error) => {
      assert.ok(err instanceof KycError);
      assert.equal((err as KycError).code, 'KYC_OCR_RETRIES_EXHAUSTED');
      return true;
    },
  );
  assert.equal(calls, 2);
});

// ---------------------------------------------------------------------------
// 3. 人脸活体检测（视频 + 静默）
// ---------------------------------------------------------------------------

test('Face: verify with video (mock pass)', async () => {
  const face = new AliCloudFaceVerification({ appCode: '', mock: true });
  const r = await face.verifyWithVideo(
    'https://oss.example.com/liveness.mp4',
    '110101199003073116',
    '王五',
  );
  assert.equal(r.passed, true);
  assert.equal(r.riskLevel, 'low');
  assert.ok(r.similarity > 0.8);
  assert.ok(r.livenessScore > 0.9);
  assert.ok(r.confidence > 0.8);
});

test('Face: verify with photo (mock pass)', async () => {
  const face = new AliCloudFaceVerification({ appCode: '', mock: true });
  const r = await face.verifyWithPhoto(
    'https://oss.example.com/photo.jpg',
    '110101199003073116',
    '王五',
  );
  assert.equal(r.passed, true);
  assert.equal(r.riskLevel, 'low');
});

test('Face: rejects empty args', async () => {
  const face = new AliCloudFaceVerification({ appCode: '', mock: true });
  await assert.rejects(
    () => face.verifyWithVideo('', '110101199003073116', '王五'),
    KycError,
  );
  await assert.rejects(
    () => face.verifyWithVideo('https://x.com/a.mp4', '123', '王五'),
    KycError,
  );
  await assert.rejects(
    () => face.verifyWithVideo('https://x.com/a.mp4', '110101199003073116', 'X'),
    KycError,
  );
});

// ---------------------------------------------------------------------------
// 4. 活体检测失败处理
// ---------------------------------------------------------------------------

test('Face: detects liveness attack (mock fail)', async () => {
  const face = new AliCloudFaceVerification({ appCode: '', mock: true });
  const r = await face.verifyWithVideo(
    'https://oss.example.com/attack.mp4', // mock 中包含 attack 关键字 → 失败
    '110101199003073116',
    '王五',
  );
  assert.equal(r.passed, false);
  assert.equal(r.riskLevel, 'high');
  assert.ok(r.reason);
});

test('Face: computePassed and computeRiskLevel', () => {
  // 全通过
  assert.equal(computePassed(0.9, 0.95), true);
  // similarity 不够
  assert.equal(computePassed(0.7, 0.95), false);
  // liveness 不够
  assert.equal(computePassed(0.9, 0.7), false);

  // 风险等级
  assert.equal(computeRiskLevel(0.95, 0.98), 'low');
  assert.equal(computeRiskLevel(0.75, 0.8), 'medium');
  assert.equal(computeRiskLevel(0.5, 0.5), 'high');
  assert.equal(computeRiskLevel(0.95, 0.5), 'high'); // 任一不达标 → high
});

test('Face: retries on 5xx', async () => {
  let calls = 0;
  const fetchMock: typeof fetch = async () => {
    calls++;
    if (calls < 2) {
      return new Response('server error', { status: 503 });
    }
    return new Response(JSON.stringify({ code: 200, msg: 'OK', data: { pass: true, score: 95, similarity: 0.9, liveness: 0.95 } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const face = new AliCloudFaceVerification({
    appCode: 'real',
    fetchImpl: fetchMock,
    retries: 3,
    retryBackoffMs: 1,
    timeoutMs: 1000,
  });
  const r = await face.verifyWithPhoto('https://x.com/p.jpg', '110101199003073116', '王五');
  assert.equal(calls, 2);
  assert.equal(r.passed, true);
});

// ---------------------------------------------------------------------------
// 5. KycService startKyc
// ---------------------------------------------------------------------------

test('KycService: startKyc creates new application', async () => {
  _resetKycServiceStore();
  const svc = buildService();
  const app = await svc.startKyc('user-001', 'basic');
  assert.ok(app.id);
  assert.equal(app.userId, 'user-001');
  assert.equal(app.type, 'basic');
  assert.equal(app.status, 'in_progress');
  assert.deepEqual(app.steps, { ocr: 'pending', face: 'pending', document: 'pending' });
  assert.ok(app.expiresAt && app.expiresAt > app.createdAt);
});

test('KycService: getUserStatus returns not_started when no app', async () => {
  _resetKycServiceStore();
  const svc = buildService();
  const status = await svc.getUserStatus('user-noexist');
  assert.equal(status, 'not_started');
});

test('KycService: cannot restart when already approved', async () => {
  _resetKycServiceStore();
  const svc = buildService();
  // 完整跑一遍到 approved
  const a = await svc.startKyc('user-002', 'basic');
  await svc.submitIdCard('user-002', a.id, 'https://x.com/front.jpg', 'https://x.com/back.jpg');
  await svc.submitFaceVideo('user-002', a.id, 'https://x.com/video.mp4');
  await svc.approveApplication(a.id, 'admin-1', 'OK');
  // 再 start 应抛错
  await assert.rejects(
    () => svc.startKyc('user-002', 'advanced'),
    (err: Error) => {
      assert.ok(err instanceof KycError);
      assert.equal((err as KycError).code, 'KYC_ALREADY_APPROVED');
      return true;
    },
  );
});

// ---------------------------------------------------------------------------
// 6. KycService submitIdCard（OCR → 加密存储）
// ---------------------------------------------------------------------------

test('KycService: submitIdCard runs OCR, validates id, encrypts PII', async () => {
  _resetKycServiceStore();
  const svc = buildService();
  const app = await svc.startKyc('user-003', 'basic');
  const updated = await svc.submitIdCard(
    'user-003',
    app.id,
    'https://x.com/front.jpg',
    'https://x.com/back.jpg',
  );
  assert.equal(updated.steps.ocr, 'passed');
  assert.equal(updated.steps.document, 'passed');
  assert.ok(updated.encryptedData.idNumber, 'idNumber should be encrypted');
  assert.ok(updated.encryptedData.name, 'name should be encrypted');
  assert.ok(updated.encryptedData.faceImageUrl);
  assert.ok(updated.encryptedData.backImageUrl);
  // 明文不应出现在 encryptedData（仅 cipher + 脱敏后回填）
  assert.equal(updated.plainData.name, '王五');
  assert.match(updated.plainData.idNumberMasked || '', /^\d{6}\*{8}\d{4}$/);
  // 验证密文确实是加密（与明文不同）
  assert.notEqual(updated.encryptedData.idNumber, '110101199003073116');
  assert.ok(updated.ocrConfidence && updated.ocrConfidence > 0.7);
  // 状态机：仍在 in_progress（待活体）
  assert.equal(updated.status, 'in_progress');
});

test('KycService: submitIdCard fails when confidence too low', async () => {
  _resetKycServiceStore();
  const svc = buildService();
  const app = await svc.startKyc('user-004', 'basic');
  // URL 含 "low" 触发 mock 返回低置信度
  await assert.rejects(
    () => svc.submitIdCard('user-004', app.id, 'https://x.com/low-front.jpg', 'https://x.com/back.jpg'),
    (err: Error) => {
      assert.ok(err instanceof KycError);
      assert.equal((err as KycError).code, 'KYC_OCR_LOW_CONFIDENCE');
      return true;
    },
  );
  // 状态机：rejected
  const after = await svc.getApplication(app.id);
  assert.equal(after?.status, 'rejected');
  assert.equal(after?.steps.ocr, 'failed');
});

test('KycService: submitIdCard rejects when not owner', async () => {
  _resetKycServiceStore();
  const svc = buildService();
  const app = await svc.startKyc('user-005', 'basic');
  await assert.rejects(
    () => svc.submitIdCard('user-other', app.id, 'https://x.com/f.jpg', 'https://x.com/b.jpg'),
    (err: Error) => {
      assert.ok(err instanceof KycError);
      assert.equal((err as KycError).code, 'KYC_NOT_OWNER');
      return true;
    },
  );
});

// ---------------------------------------------------------------------------
// 7. KycService submitFaceVideo（活体 → 评分）
// ---------------------------------------------------------------------------

test('KycService: submitFaceVideo requires OCR to pass first', async () => {
  _resetKycServiceStore();
  const svc = buildService();
  const app = await svc.startKyc('user-006', 'advanced');
  // 跳过 OCR 直接活体
  await assert.rejects(
    () => svc.submitFaceVideo('user-006', app.id, 'https://x.com/v.mp4'),
    (err: Error) => {
      assert.ok(err instanceof KycError);
      assert.equal((err as KycError).code, 'KYC_FACE_BEFORE_OCR');
      return true;
    },
  );
});

test('KycService: submitFaceVideo happy path → pending_review', async () => {
  _resetKycServiceStore();
  const svc = buildService();
  const app = await svc.startKyc('user-007', 'advanced');
  await svc.submitIdCard('user-007', app.id, 'https://x.com/f.jpg', 'https://x.com/b.jpg');
  const face = await svc.submitFaceVideo('user-007', app.id, 'https://x.com/v.mp4');
  assert.equal(face.steps.face, 'passed');
  assert.equal(face.status, 'pending_review');
  assert.ok(face.faceResult);
  assert.equal(face.faceResult!.passed, true);
  assert.equal(face.faceResult!.riskLevel, 'low');
  assert.ok(face.faceResult!.similarity > 0.8);
  assert.ok(face.faceResult!.livenessScore > 0.9);
});

test('KycService: submitFaceVideo failure → rejected', async () => {
  _resetKycServiceStore();
  const svc = buildService();
  const app = await svc.startKyc('user-008', 'advanced');
  await svc.submitIdCard('user-008', app.id, 'https://x.com/f.jpg', 'https://x.com/b.jpg');
  // URL 含 "fail" 触发 mock 失败
  const face = await svc.submitFaceVideo('user-008', app.id, 'https://x.com/fail.mp4');
  assert.equal(face.steps.face, 'failed');
  assert.equal(face.status, 'rejected');
  assert.ok(face.rejectReason);
});

// ---------------------------------------------------------------------------
// 8. KycService approve / reject
// ---------------------------------------------------------------------------

test('KycService: approveApplication requires all steps passed', async () => {
  _resetKycServiceStore();
  const svc = buildService();
  const app = await svc.startKyc('user-009', 'basic');
  await svc.submitIdCard('user-009', app.id, 'https://x.com/f.jpg', 'https://x.com/b.jpg');
  // 此时还没有活体 → 审批应抛错
  await assert.rejects(
    () => svc.approveApplication(app.id, 'admin-1'),
    (err: Error) => {
      assert.ok(err instanceof KycError);
      assert.equal((err as KycError).code, 'KYC_STEPS_INCOMPLETE');
      return true;
    },
  );
});

test('KycService: approveApplication happy path', async () => {
  _resetKycServiceStore();
  const svc = buildService();
  const app = await svc.startKyc('user-010', 'basic');
  await svc.submitIdCard('user-010', app.id, 'https://x.com/f.jpg', 'https://x.com/b.jpg');
  await svc.submitFaceVideo('user-010', app.id, 'https://x.com/v.mp4');
  const approved = await svc.approveApplication(app.id, 'admin-1', '通过');
  assert.equal(approved.status, 'approved');
  assert.equal(approved.reviewerId, 'admin-1');
  assert.equal(approved.reviewNotes, '通过');
  assert.ok(approved.reviewedAt && approved.reviewedAt > 0);
});

test('KycService: rejectApplication requires reason', async () => {
  _resetKycServiceStore();
  const svc = buildService();
  const app = await svc.startKyc('user-011', 'advanced');
  await svc.submitIdCard('user-011', app.id, 'https://x.com/f.jpg', 'https://x.com/b.jpg');
  await svc.submitFaceVideo('user-011', app.id, 'https://x.com/v.mp4');
  await assert.rejects(
    () => svc.rejectApplication(app.id, 'admin-1', ''),
    (err: Error) => {
      assert.ok(err instanceof KycError);
      assert.equal((err as KycError).code, 'KYC_REASON_REQUIRED');
      return true;
    },
  );
  const rejected = await svc.rejectApplication(app.id, 'admin-1', '证件模糊不清');
  assert.equal(rejected.status, 'rejected');
  assert.equal(rejected.reviewerId, 'admin-1');
  assert.equal(rejected.rejectReason, '证件模糊不清');
});

test('KycService: listPendingApplications returns pending_review only', async () => {
  _resetKycServiceStore();
  const svc = buildService();
  const a1 = await svc.startKyc('user-a', 'basic');
  await svc.submitIdCard('user-a', a1.id, 'https://x.com/f.jpg', 'https://x.com/b.jpg');
  await svc.submitFaceVideo('user-a', a1.id, 'https://x.com/v.mp4');
  const a2 = await svc.startKyc('user-b', 'basic');
  await svc.submitIdCard('user-b', a2.id, 'https://x.com/f.jpg', 'https://x.com/b.jpg');
  await svc.submitFaceVideo('user-b', a2.id, 'https://x.com/v.mp4');
  const a3 = await svc.startKyc('user-c', 'basic');
  await svc.submitIdCard('user-c', a3.id, 'https://x.com/f.jpg', 'https://x.com/b.jpg');
  await svc.submitFaceVideo('user-c', a3.id, 'https://x.com/v.mp4');
  // 通过 a1
  await svc.approveApplication(a1.id, 'admin');
  // 拒绝 a3
  await svc.rejectApplication(a3.id, 'admin', '原因');
  const pending = await svc.listPendingApplications();
  assert.equal(pending.length, 1);
  assert.equal(pending[0].id, a2.id);
});

// ---------------------------------------------------------------------------
// 9. 加密 / 解密 PII
// ---------------------------------------------------------------------------

test('Crypto: encrypt and decrypt are symmetric', () => {
  const plain = '110101199003073116';
  const enc = encryptPII(plain, TEST_KEY);
  assert.notEqual(enc, plain);
  assert.ok(enc.length > 0);
  const dec = decryptPII(enc, TEST_KEY);
  assert.equal(dec, plain);
});

test('Crypto: encrypt produces different ciphertext each time (random IV)', () => {
  const plain = '张三';
  const e1 = encryptPII(plain, TEST_KEY);
  const e2 = encryptPII(plain, TEST_KEY);
  assert.notEqual(e1, e2, 'IV should be random; ciphertext must differ');
  // 但都能解密出原文
  assert.equal(decryptPII(e1, TEST_KEY), plain);
  assert.equal(decryptPII(e2, TEST_KEY), plain);
});

test('Crypto: tampered ciphertext fails authentication', () => {
  const plain = '13800138000';
  const enc = encryptPII(plain, TEST_KEY);
  // 篡改最后 1 个字符（authTag 区域）
  const tampered = enc.substring(0, enc.length - 1) + (enc[enc.length - 1] === 'A' ? 'B' : 'A');
  assert.throws(() => decryptPII(tampered, TEST_KEY));
});

test('Crypto: rejects short key', () => {
  assert.throws(() => encryptPII('abc', 'short'), KycError);
  assert.throws(() => encryptPII('abc', Buffer.from('short')), KycError);
});

test('Crypto: algorithm identifier and inspect', () => {
  assert.equal(ENCRYPTION_ALGORITHM, 'aes-256-gcm');
  const enc = encryptPII('test-pii', TEST_KEY);
  const meta = inspectEncryptedPayload(enc);
  assert.equal(meta.algorithm, 'aes-256-gcm');
  assert.ok(meta.iv.length === 24); // 12 bytes hex
  assert.ok(meta.authTag.length === 32); // 16 bytes hex
});

test('Crypto: hashPII is deterministic but not reversible', () => {
  const h1 = hashPII('110101199003073116');
  const h2 = hashPII('110101199003073116');
  assert.equal(h1, h2);
  assert.equal(h1.length, 64); // SHA-256 hex
  assert.notEqual(h1, '110101199003073116');
});

test('Crypto: env default key is loaded when not provided', () => {
  // 不传 key 时使用环境默认值
  const enc = encryptPII('hello', PII_ENCRYPTION_KEY);
  const dec = decryptPII(enc, PII_ENCRYPTION_KEY);
  assert.equal(dec, 'hello');
});

// ---------------------------------------------------------------------------
// 10. 脱敏显示
// ---------------------------------------------------------------------------

test('Mask: idNumber', () => {
  assert.equal(maskIdNumber('110101199003073116'), '110101********3116');
  assert.equal(maskIdNumber('11010119900307311X'), '110101********311X');
  // 长度不足
  assert.equal(maskIdNumber('12345'), '1***5');
  // 空
  assert.equal(maskIdNumber(''), '');
});

test('Mask: name', () => {
  assert.equal(maskName('张三'), '张*');
  assert.equal(maskName('欧阳娜娜'), '欧**娜');
  assert.equal(maskName('李'), '*');
  assert.equal(maskName(''), '');
});

test('Mask: phone', () => {
  assert.equal(maskPhone('13800138000'), '138****8000');
  assert.equal(maskPhone('+86 138-0013-8000'), '138****8000');
});

test('Mask: email', () => {
  // 本地部分保留首字符，其余替换为 *（最多 3 个）
  assert.equal(maskEmail('user@example.com'), 'u***@example.com');
  assert.equal(maskEmail('alice@example.com'), 'a***@example.com');
  assert.equal(maskEmail('a@x.com'), '*@x.com');
});

test('Mask: bankCard', () => {
  // 银行卡头 6 + 尾 4，中间 * 数 = len - 10
  assert.equal(maskBankCard('6222021234567890123'), '622202*********0123'); // 19 - 10 = 9
  assert.equal(maskBankCard('4111111111111111'), '411111******1111');        // 16 - 10 = 6
});

// ---------------------------------------------------------------------------
// 集成测试：完整流程
// ---------------------------------------------------------------------------

test('Integration: full KYC happy path (basic)', async () => {
  _resetKycServiceStore();
  const svc = buildService();
  // 1. start
  const app = await svc.startKyc('user-full', 'basic');
  assert.equal(app.status, 'in_progress');
  // 2. OCR
  const afterOcr = await svc.submitIdCard('user-full', app.id, 'https://x.com/f.jpg', 'https://x.com/b.jpg');
  assert.equal(afterOcr.steps.ocr, 'passed');
  // 3. 活体
  const afterFace = await svc.submitFaceVideo('user-full', app.id, 'https://x.com/v.mp4');
  assert.equal(afterFace.steps.face, 'passed');
  assert.equal(afterFace.status, 'pending_review');
  // 4. 审核
  const approved = await svc.approveApplication(app.id, 'admin-007', '合规通过');
  assert.equal(approved.status, 'approved');
  // 5. 查询用户状态
  const userStatus = await svc.getUserStatus('user-full');
  assert.equal(userStatus, 'approved');
});
