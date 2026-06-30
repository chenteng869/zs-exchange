/**
 * 短信服务单元测试（L-04：Twilio 短信服务）
 *
 * 覆盖：
 *  - Twilio 发送成功 / 5xx 重试 / 429 重试 / 4xx 失败
 *  - SmsTemplate 渲染 4 个内置模板 + 变量缺失
 *  - VerificationCodeService：生成、校验、过期、尝试次数、一次性
 *  - SmsRateLimiter：1 分钟 1 条 / 1 小时 5 条 / 1 天 15 条
 *  - E.164 校验
 *  - SmsService 端到端：sendOtp → verifyOtp
 *
 * 运行：npx tsx tests/sms-service.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  TwilioClient,
  SmsTemplate,
  VerificationCodeService,
  SmsRateLimiter,
  SmsService,
  SmsServiceError,
  isE164Phone,
  normalizeE164,
  BUILTIN_TEMPLATES,
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_MAX_ATTEMPTS,
  RATE_LIMITS,
  maskPhone,
} from '../src/lib/notification';

// =============================================================================
// 工具：构造 mock fetch
// =============================================================================

type FetchHandler = (url: string, init?: RequestInit) => Response | Promise<Response>;

function mockFetch(handler: FetchHandler, calls: { url: string; init?: RequestInit }[] = []): typeof fetch {
  const fn = (async (input: any, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    calls.push({ url, init });
    return handler(url, init);
  }) as unknown as typeof fetch;
  return fn;
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
// 1. Twilio 发送成功（mock fetch）
// =============================================================================

test('TwilioClient: 发送成功，Basic Auth + form-urlencoded', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchImpl = mockFetch((url, init) => {
    return jsonResponse(200, {
      sid: 'SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      status: 'queued',
      to: '+8613800138000',
      price: '-0.0075',
      price_unit: 'USD',
    });
  }, calls);

  const client = new TwilioClient({
    accountSid: 'ACtest',
    authToken: 'token',
    fromNumber: '+15005550006',
    fetchImpl,
    maxRetries: 0,
  });
  const r = await client.send({ to: '+8613800138000', body: 'hello' });

  assert.equal(r.status, 'queued');
  assert.equal(r.messageSid, 'SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  assert.equal(r.to, '+8613800138000');
  assert.equal(r.priceUnit, 'USD');
  assert.equal(calls.length, 1);

  // 校验 URL
  assert.equal(calls[0].url, 'https://api.twilio.com/2010-04-01/Accounts/ACtest/Messages.json');
  // 校验 Basic Auth
  const auth = (calls[0].init?.headers as Record<string, string>).Authorization;
  assert.ok(auth?.startsWith('Basic '), 'must use Basic auth');
  const decoded = Buffer.from(auth!.slice(6), 'base64').toString();
  assert.equal(decoded, 'ACtest:token');
  // 校验 form-urlencoded
  const body = calls[0].init?.body as string;
  assert.ok(body.startsWith('To=') && body.includes('From=%2B15005550006'));
  assert.ok(body.includes('Body=hello'));
  const ct = (calls[0].init?.headers as Record<string, string>)['Content-Type'];
  assert.equal(ct, 'application/x-www-form-urlencoded');
});

// =============================================================================
// 2. Twilio 5xx 重试
// =============================================================================

test('TwilioClient: 5xx 触发指数退避重试，最终成功', async () => {
  let count = 0;
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchImpl = mockFetch(() => {
    count++;
    if (count < 3) return textResponse(500, 'internal error');
    return jsonResponse(200, { sid: 'SMsuccess', status: 'sent', to: '+8613800138000' });
  }, calls);

  const client = new TwilioClient({
    accountSid: 'ACtest',
    authToken: 'token',
    fromNumber: '+15005550006',
    fetchImpl,
    maxRetries: 3,
    backoffBaseMs: 1, // 让测试快
  });
  const r = await client.send({ to: '+8613800138000', body: 'hello' });

  assert.equal(r.status, 'sent');
  assert.equal(r.messageSid, 'SMsuccess');
  assert.equal(count, 3, 'should be called 3 times (2 fails + 1 success)');
});

// =============================================================================
// 3. Twilio 429 重试
// =============================================================================

test('TwilioClient: 429 限流重试', async () => {
  let count = 0;
  const fetchImpl = mockFetch(() => {
    count++;
    if (count < 2) return textResponse(429, 'Too Many Requests');
    return jsonResponse(200, { sid: 'SMok', status: 'queued', to: '+8613800138000' });
  });

  const client = new TwilioClient({
    accountSid: 'ACtest',
    authToken: 'token',
    fromNumber: '+15005550006',
    fetchImpl,
    maxRetries: 3,
    backoffBaseMs: 1,
  });
  const r = await client.send({ to: '+8613800138000', body: 'hello' });
  assert.equal(r.status, 'queued');
  assert.equal(r.messageSid, 'SMok');
  assert.equal(count, 2);
});

// =============================================================================
// 4. Twilio 4xx 立即失败
// =============================================================================

test('TwilioClient: 4xx 错误立即返回 failed', async () => {
  let count = 0;
  const fetchImpl = mockFetch(() => {
    count++;
    return textResponse(400, JSON.stringify({ code: 21211, message: 'Invalid To Phone Number' }));
  });
  const client = new TwilioClient({
    accountSid: 'ACtest',
    authToken: 'token',
    fromNumber: '+15005550006',
    fetchImpl,
    maxRetries: 3,
  });
  const r = await client.send({ to: 'invalid', body: 'x' });
  assert.equal(r.status, 'failed');
  assert.ok(r.errorMessage?.includes('Invalid To Phone Number'));
  assert.equal(count, 1, 'no retry on 4xx');
});

// =============================================================================
// 5. Twilio mock 模式
// =============================================================================

test('TwilioClient: mock 模式直接返回 mock SID', async () => {
  const client = new TwilioClient({
    accountSid: 'ACtest',
    authToken: 'token',
    fromNumber: '+15005550006',
    mockMode: true,
  });
  const r = await client.send({ to: '+8613800138000', body: 'hello' });
  assert.equal(r.status, 'sent');
  assert.ok(r.messageSid.startsWith('MOCK'));
  assert.equal(r.to, '+8613800138000');
});

// =============================================================================
// 6. 模板渲染（4 个内置模板）
// =============================================================================

test('SmsTemplate: 渲染 4 个内置模板', () => {
  const tmpl = new SmsTemplate();

  const otpLogin = tmpl.render('OTP_LOGIN', { code: '654321' });
  assert.ok(otpLogin.includes('654321'));
  assert.ok(otpLogin.includes('5 分钟'));

  const otpReg = tmpl.render('OTP_REGISTER', { code: '111111' });
  assert.ok(otpReg.includes('111111'));
  assert.ok(otpReg.includes('萨摩亚'));

  const wd = tmpl.render('WITHDRAW_CONFIRM', { code: '888888', amount: '1.5', asset: 'BTC', address: '0xabc' });
  assert.ok(wd.includes('1.5'));
  assert.ok(wd.includes('BTC'));
  assert.ok(wd.includes('0xabc'));
  assert.ok(wd.includes('888888'));

  const la = tmpl.render('LOGIN_ALERT', { time: '2026-06-20 10:00:00', location: '上海' });
  assert.ok(la.includes('2026-06-20 10:00:00'));
  assert.ok(la.includes('上海'));
});

test('SmsTemplate: 模板不存在 / 变量缺失抛错', () => {
  const tmpl = new SmsTemplate();
  assert.throws(() => tmpl.render('NOT_EXIST', {}), /unknown template/);
  assert.throws(() => tmpl.render('WITHDRAW_CONFIRM', { code: '1' }), /missing variables/);
});

test('SmsTemplate: register / list / remove', () => {
  const tmpl = new SmsTemplate();
  const initial = tmpl.list().length;
  tmpl.register({ id: 'CUSTOM', body: 'Hi {name}!', variables: ['name'] });
  assert.equal(tmpl.list().length, initial + 1);
  assert.equal(tmpl.render('CUSTOM', { name: 'alice' }), 'Hi alice!');
  assert.equal(tmpl.remove('CUSTOM'), true);
  assert.equal(tmpl.has('CUSTOM'), false);
  // builtin 不可删除
  assert.equal(tmpl.remove('OTP_LOGIN'), false);
});

// =============================================================================
// 7. 验证码生成（6 位数字）
// =============================================================================

test('VerificationCodeService: 默认生成 6 位数字', () => {
  const svc = new VerificationCodeService();
  const { codeId, expiresAt } = svc.requestCode({ phone: '+8613800138000', purpose: 'login' });
  const record = svc.getCode(codeId);
  assert.ok(record);
  assert.equal(record!.code.length, VERIFICATION_CODE_LENGTH);
  assert.match(record!.code, /^\d{6}$/);
  assert.equal(record!.purpose, 'login');
  assert.equal(record!.phone, '+8613800138000');
  assert.equal(record!.attempts, 0);
  assert.equal(record!.used, false);
  assert.ok(expiresAt > record!.createdAt);
});

// =============================================================================
// 8. 验证码校验（正确 / 错误 / 过期 / 尝试次数）
// =============================================================================

test('VerificationCodeService: 正确 code → valid', () => {
  const svc = new VerificationCodeService();
  const { codeId } = svc.requestCode({ phone: '+8613800138000', purpose: 'login', code: '123456' });
  const r = svc.verifyCode({ codeId, code: '123456', purpose: 'login' });
  assert.deepEqual(r, { valid: true });
});

test('VerificationCodeService: 错误 code → mismatch', () => {
  const svc = new VerificationCodeService();
  const { codeId } = svc.requestCode({ phone: '+8613800138000', purpose: 'login', code: '123456' });
  const r = svc.verifyCode({ codeId, code: '000000', purpose: 'login' });
  assert.equal(r.valid, false);
  assert.equal(r.reason, 'mismatch');
});

test('VerificationCodeService: 过期 → expired', () => {
  let now = 1_000_000;
  const svc = new VerificationCodeService({ now: () => now });
  const { codeId } = svc.requestCode({ phone: '+8613800138000', purpose: 'login', code: '123456', ttlMs: 1000 });
  now += 2000; // 2s 后过期
  const r = svc.verifyCode({ codeId, code: '123456', purpose: 'login' });
  assert.equal(r.valid, false);
  assert.equal(r.reason, 'expired');
});

test('VerificationCodeService: 超过 max attempts → max_attempts', () => {
  const svc = new VerificationCodeService({ defaultMaxAttempts: 3 });
  const { codeId } = svc.requestCode({ phone: '+8613800138000', purpose: 'login', code: '123456' });
  for (let i = 0; i < 2; i++) {
    const r = svc.verifyCode({ codeId, code: '000000', purpose: 'login' });
    assert.equal(r.valid, false);
    assert.equal(r.reason, 'mismatch');
  }
  // 第 3 次：达到 maxAttempts → 强制 max_attempts
  const r3 = svc.verifyCode({ codeId, code: '000000', purpose: 'login' });
  assert.equal(r3.valid, false);
  assert.equal(r3.reason, 'max_attempts');
  // 再次尝试：已 used
  const r4 = svc.verifyCode({ codeId, code: '123456', purpose: 'login' });
  assert.equal(r4.reason, 'used');
});

// =============================================================================
// 9. 校验后失效（防重放）
// =============================================================================

test('VerificationCodeService: 校验成功后再次校验 → used', () => {
  const svc = new VerificationCodeService();
  const { codeId } = svc.requestCode({ phone: '+8613800138000', purpose: 'login', code: '123456' });
  const r1 = svc.verifyCode({ codeId, code: '123456', purpose: 'login' });
  assert.equal(r1.valid, true);
  const r2 = svc.verifyCode({ codeId, code: '123456', purpose: 'login' });
  assert.equal(r2.valid, false);
  assert.equal(r2.reason, 'used');
});

test('VerificationCodeService: purpose 不匹配 → wrong_purpose', () => {
  const svc = new VerificationCodeService();
  const { codeId } = svc.requestCode({ phone: '+8613800138000', purpose: 'login', code: '123456' });
  const r = svc.verifyCode({ codeId, code: '123456', purpose: 'withdraw' });
  assert.equal(r.valid, false);
  assert.equal(r.reason, 'wrong_purpose');
});

// =============================================================================
// 10. 频率限制：1 分钟 1 条
// =============================================================================

test('SmsRateLimiter: 同一手机号 1 分钟内第 2 条被拒', () => {
  const rl = new SmsRateLimiter();
  const phone = '+8613800138000';
  assert.equal(rl.checkAndConsume(phone, '1.1.1.1').allowed, true);
  const r2 = rl.check(phone, '1.1.1.1');
  assert.equal(r2.allowed, false);
  assert.equal(r2.violation, 'phone_minute');
  assert.ok((r2.retryAfterMs ?? 0) > 0);
});

// =============================================================================
// 11. 频率限制：1 小时 5 条
// =============================================================================

test('SmsRateLimiter: 同一手机号 1 小时内最多 5 条', () => {
  let now = 1_000_000;
  const rl = new SmsRateLimiter({
    now: () => now,
    rules: {
      // 把 phone_minute 窗口拉长，避开 1 分钟的提前限制
      phone_minute: { windowMs: 100, max: 100 },
    },
  });
  const phone = '+8613800138000';
  for (let i = 0; i < RATE_LIMITS.perPhonePerHour; i++) {
    now += 200; // 每次间隔 200ms
    const r = rl.checkAndConsume(phone, '1.1.1.1');
    assert.equal(r.allowed, true, `第 ${i + 1} 条应允许`);
  }
  // 第 6 条：应被拒
  now += 200;
  const r = rl.checkAndConsume(phone, '1.1.1.1');
  assert.equal(r.allowed, false);
  assert.equal(r.violation, 'phone_hour');
});

// =============================================================================
// 12. 频率限制：1 天 15 条
// =============================================================================

test('SmsRateLimiter: 同一手机号 1 天内最多 15 条', () => {
  let now = 1_000_000;
  const rl = new SmsRateLimiter({
    now: () => now,
    rules: {
      phone_minute: { windowMs: 100, max: 100 },
      phone_hour: { windowMs: 1000, max: 100 },
    },
  });
  const phone = '+8613800138000';
  for (let i = 0; i < RATE_LIMITS.perPhonePerDay; i++) {
    now += 200;
    const r = rl.checkAndConsume(phone, '1.1.1.1');
    assert.equal(r.allowed, true, `第 ${i + 1} 条应允许`);
  }
  now += 200;
  const r = rl.checkAndConsume(phone, '1.1.1.1');
  assert.equal(r.allowed, false);
  assert.equal(r.violation, 'phone_day');
});

// =============================================================================
// 13. 频率限制：同 IP 1 小时 20 条
// =============================================================================

test('SmsRateLimiter: 同 IP 1 小时内最多 20 条', () => {
  let now = 1_000_000;
  const rl = new SmsRateLimiter({
    now: () => now,
    rules: {
      phone_minute: { windowMs: 100, max: 100 },
      phone_hour: { windowMs: 1000, max: 100 },
      phone_day: { windowMs: 10000, max: 100 },
    },
  });
  for (let i = 0; i < RATE_LIMITS.perIpPerHour; i++) {
    now += 200;
    const phone = `+8613800138${String(i).padStart(4, '0')}`;
    const r = rl.checkAndConsume(phone, '5.5.5.5');
    assert.equal(r.allowed, true);
  }
  now += 200;
  const r = rl.checkAndConsume('+8613800138999', '5.5.5.5');
  assert.equal(r.allowed, false);
  assert.equal(r.violation, 'ip_hour');
});

// =============================================================================
// 14. 频率限制：全局 1 秒 100 条
// =============================================================================

test('SmsRateLimiter: 全局 1 秒内最多 100 条', () => {
  let now = 1_000_000;
  const rl = new SmsRateLimiter({
    now: () => now,
    rules: {
      phone_minute: { windowMs: 100, max: 100 },
      phone_hour: { windowMs: 1000, max: 100 },
      phone_day: { windowMs: 10000, max: 100 },
      ip_hour: { windowMs: 1000, max: 100 },
    },
  });
  for (let i = 0; i < RATE_LIMITS.globalPerSecond; i++) {
    const phone = `+8613800138${String(i % 10).padStart(4, '0')}`;
    const r = rl.checkAndConsume(phone, `1.1.1.${i % 20}`);
    assert.equal(r.allowed, true);
  }
  const r = rl.checkAndConsume('+8613800138000', '1.1.1.1');
  assert.equal(r.allowed, false);
  assert.equal(r.violation, 'global_second');
});

test('SmsRateLimiter: reset(phone) 清理该 phone 窗口', () => {
  let now = 1_000_000;
  const rl = new SmsRateLimiter({ now: () => now });
  rl.checkAndConsume('+8613800138000', '1.1.1.1');
  assert.equal(rl.check('+8613800138000', '1.1.1.1').allowed, false);
  rl.reset('+8613800138000');
  assert.equal(rl.check('+8613800138000', '1.1.1.1').allowed, true);
});

// =============================================================================
// 15. E.164 校验
// =============================================================================

test('isE164Phone: 接受合法 E.164，拒绝其他', () => {
  assert.equal(isE164Phone('+8613800138000'), true);
  assert.equal(isE164Phone('+15005550006'), true);
  assert.equal(isE164Phone('+1234567'), false, 'too short');
  assert.equal(isE164Phone('+0123456789'), false, 'leading 0 after +');
  assert.equal(isE164Phone('8613800138000'), false, 'missing +');
  assert.equal(isE164Phone('+86 138 0013 8000'), false, 'spaces');
  assert.equal(isE164Phone(''), false);
});

test('normalizeE164: 自动补 + 并处理 0086 前缀', () => {
  assert.equal(normalizeE164('+8613800138000'), '+8613800138000');
  assert.equal(normalizeE164('8613800138000'), '+8613800138000');
  assert.equal(normalizeE164('+86 138 0013 8000'), '+8613800138000');
  assert.equal(normalizeE164('008613800138000'), '+8613800138000');
  assert.equal(normalizeE164('123'), null);
});

// =============================================================================
// 16. SmsService 端到端：sendOtp → verifyOtp
// =============================================================================

test('SmsService: sendOpt → verifyOtp 完整流程（mock twilio）', async () => {
  const fetchImpl = mockFetch(() =>
    jsonResponse(200, { sid: 'SMabc', status: 'queued', to: '+8613800138000' }),
  );
  const twilio = new TwilioClient({
    accountSid: 'ACtest',
    authToken: 'token',
    fromNumber: '+15005550006',
    fetchImpl,
    maxRetries: 0,
  });
  const svc = new SmsService({ twilio });

  const r = await svc.sendOtp('+8613800138000', 'login');
  assert.ok(r.codeId);
  assert.ok(r.expiresAt > Date.now());
  assert.equal(r.maskedPhone, '+86****8000');
  assert.equal(r.result.messageSid, 'SMabc');

  // 取出真实 code 用于测试
  const record = svc.verification.getCode(r.codeId);
  assert.ok(record);
  const v = await svc.verifyOtp(r.codeId, record!.code, 'login');
  assert.equal(v.valid, true);

  // 二次校验 → used
  const v2 = await svc.verifyOtp(r.codeId, record!.code, 'login');
  assert.equal(v2.valid, false);
  assert.equal(v2.reason, 'used');
});

test('SmsService: sendOtp 在 mock 模式下也能正常完成', async () => {
  const twilio = new TwilioClient({
    accountSid: 'ACtest',
    authToken: 'token',
    fromNumber: '+15005550006',
    mockMode: true,
  });
  const svc = new SmsService({ twilio });
  const r = await svc.sendOtp('+8613800138000', 'register');
  assert.ok(r.result.messageSid.startsWith('MOCK'));
  const code = svc.verification.getCode(r.codeId)!.code;
  const v = await svc.verifyOtp(r.codeId, code, 'register');
  assert.equal(v.valid, true);
});

test('SmsService: 手机号非法 → invalid_phone', async () => {
  const twilio = new TwilioClient({ accountSid: 'a', authToken: 'b', fromNumber: '+15005550006', mockMode: true });
  const svc = new SmsService({ twilio });
  await assert.rejects(
    () => svc.sendOtp('not-a-phone', 'login'),
    (err: any) => err instanceof SmsServiceError && err.code === 'invalid_phone',
  );
});

test('SmsService: 频率限制 → rate_limited', async () => {
  const twilio = new TwilioClient({ accountSid: 'a', authToken: 'b', fromNumber: '+15005550006', mockMode: true });
  const svc = new SmsService({ twilio });
  await svc.sendOtp('+8613800138000', 'login');
  await assert.rejects(
    () => svc.sendOtp('+8613800138000', 'login'),
    (err: any) => err instanceof SmsServiceError && err.code === 'rate_limited',
  );
});

test('SmsService: sendWithdrawalConfirmation + verifyOtp', async () => {
  const twilio = new TwilioClient({ accountSid: 'a', authToken: 'b', fromNumber: '+15005550006', mockMode: true });
  const svc = new SmsService({ twilio });
  const r = await svc.sendWithdrawalConfirmation('+8613800138000', {
    amount: '0.5',
    asset: 'ETH',
    address: '0xabcdef',
  });
  const code = svc.verification.getCode(r.codeId)!.code;
  const v = await svc.verifyOtp(r.codeId, code, 'withdraw');
  assert.equal(v.valid, true);
});

test('SmsService: sendSecurityAlert / sendLoginNotification', async () => {
  const twilio = new TwilioClient({ accountSid: 'a', authToken: 'b', fromNumber: '+15005550006', mockMode: true });
  const svc = new SmsService({ twilio });
  const r1 = await svc.sendSecurityAlert('+8613800138000', 'large_withdraw', { amount: '10000' });
  assert.ok(r1.messageSid);
  const r2 = await svc.sendLoginNotification('+8613800138000', '上海', 'iPhone 16');
  assert.ok(r2.messageSid);
});

// =============================================================================
// 17. BUILTIN_TEMPLATES 数量
// =============================================================================

test('BUILTIN_TEMPLATES: 含 5 个内置模板', () => {
  assert.ok(BUILTIN_TEMPLATES.length >= 5);
  const ids = BUILTIN_TEMPLATES.map((t) => t.id);
  for (const id of ['OTP_LOGIN', 'OTP_REGISTER', 'WITHDRAW_CONFIRM', 'LOGIN_ALERT', 'SECURITY_ALERT']) {
    assert.ok(ids.includes(id), `builtin template ${id} missing`);
  }
});

test('maskPhone: 脱敏', () => {
  assert.equal(maskPhone('+8613800138000'), '+86****8000');
  assert.equal(maskPhone('13800138000'), '****8000');
  assert.equal(maskPhone('+12345'), '+12345');
});

// =============================================================================
// 18. sendBatch
// =============================================================================

test('TwilioClient: sendBatch 并行发送', async () => {
  let count = 0;
  const fetchImpl = mockFetch(() => {
    count++;
    return jsonResponse(200, { sid: `SM${count}`, status: 'sent', to: '+8613800138000' });
  });
  const client = new TwilioClient({ accountSid: 'a', authToken: 'b', fromNumber: '+15005550006', fetchImpl, maxRetries: 0 });
  const results = await client.sendBatch([
    { to: '+8613800138000', body: '1' },
    { to: '+8613800138001', body: '2' },
    { to: '+8613800138002', body: '3' },
  ]);
  assert.equal(results.length, 3);
  assert.ok(results.every((r) => r.status === 'sent'));
});

test('TwilioClient: getStatus (mock 模式直接返回 sent)', async () => {
  const client = new TwilioClient({ accountSid: 'a', authToken: 'b', fromNumber: '+15005550006', mockMode: true });
  const s = await client.getStatus('SMxxx');
  assert.equal(s, 'sent');
});
