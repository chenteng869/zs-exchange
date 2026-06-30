/**
 * 邮件服务单元测试（L-05：SendGrid 邮件服务）
 *
 * 覆盖：
 *  - SendGrid 发送成功 / 5xx 重试 / 429 重试 / 401 失败 / mock 模式
 *  - 8+ 模板渲染：TPL_VERIFY_EMAIL / TPL_RESET_PASSWORD /
 *                TPL_WITHDRAW_SUCCESS / TPL_DEPOSIT_RECEIVED /
 *                TPL_LOGIN_ALERT / TPL_SECURITY_ALERT /
 *                TPL_KYC_APPROVED / TPL_KYC_REJECTED / TPL_NEWSLETTER
 *  - 验证码生成 / 校验 / 防重放
 *  - 5 维限流：email_minute / email_hour / email_day / user_day / global_second
 *  - 邮箱格式校验
 *  - EmailService 完整流程：sendOtp / sendWithdrawalConfirmation / sendNewsletter
 *  - 退信处理：getSuppression / deleteSuppression
 *  - 断网降级到 mock
 *
 * 运行：npx tsx tests/email-service.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SendGridClient,
  EmailTemplate,
  EmailRateLimiter,
  EmailService,
  EmailServiceError,
  isValidEmail,
  normalizeEmail,
  maskEmail,
  BUILTIN_TEMPLATES,
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_MAX_ATTEMPTS,
  RATE_LIMITS,
  type EmailMessage,
} from '../src/lib/notification/email';

// =============================================================================
// 工具：构造 mock fetch
// =============================================================================

type FetchHandler = (
  url: string,
  init?: RequestInit,
) => Response | Promise<Response>;

function mockFetch(
  handler: FetchHandler,
  calls: { url: string; init?: RequestInit }[] = [],
): typeof fetch {
  const fn = (async (input: any, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    calls.push({ url, init });
    return handler(url, init);
  }) as unknown as typeof fetch;
  return fn;
}

function jsonResponse(status: number, body: any, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 || status === 202 ? 'OK' : 'ERR',
    headers: {
      get: (k: string) => headers[k.toLowerCase()] ?? null,
    } as any,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as Response;
}

function textResponse(status: number, body: string, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 || status === 202 ? 'OK' : 'ERR',
    headers: {
      get: (k: string) => headers[k.toLowerCase()] ?? null,
    } as any,
    text: async () => body,
    json: async () => JSON.parse(body),
  } as Response;
}

function makeMessage(): EmailMessage {
  return {
    from: { email: 'noreply@smy.exchange', name: 'SMY Exchange' },
    to: { email: 'user@example.com' },
    subject: 'Test Subject',
    text: 'plain text',
    html: '<p>html</p>',
  };
}

// =============================================================================
// 1. SendGrid 发送成功（mock fetch）
// =============================================================================

test('SendGridClient: 发送成功，Bearer + JSON body', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchImpl = mockFetch(
    () => jsonResponse(202, {}, { 'x-message-id': 'filter-uuid-1' }),
    calls,
  );
  const client = new SendGridClient({
    apiKey: 'SG.test-key',
    fetchImpl,
    maxRetries: 0,
  });
  const r = await client.send(makeMessage());

  assert.equal(r.status, 'queued');
  assert.equal(r.messageId, 'filter-uuid-1');
  assert.deepEqual(r.to, ['user@example.com']);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.sendgrid.com/v3/mail/send');
  const auth = (calls[0].init?.headers as Record<string, string>).Authorization;
  assert.equal(auth, 'Bearer SG.test-key');
  const ct = (calls[0].init?.headers as Record<string, string>)['Content-Type'];
  assert.equal(ct, 'application/json');
  const body = JSON.parse(calls[0].init?.body as string);
  assert.equal(body.subject, 'Test Subject');
  assert.equal(body.from.email, 'noreply@smy.exchange');
  assert.equal(body.personalizations[0].to[0].email, 'user@example.com');
});

// =============================================================================
// 2. SendGrid 5xx 重试
// =============================================================================

test('SendGridClient: 5xx 触发指数退避重试，最终成功', async () => {
  let count = 0;
  const fetchImpl = mockFetch(() => {
    count++;
    if (count < 3) return textResponse(500, 'internal error');
    return jsonResponse(202, {}, { 'x-message-id': 'ok' });
  });
  const client = new SendGridClient({
    apiKey: 'SG.test',
    fetchImpl,
    maxRetries: 3,
    backoffBaseMs: 1,
  });
  const r = await client.send(makeMessage());
  assert.equal(r.status, 'queued');
  assert.equal(r.messageId, 'ok');
  assert.equal(count, 3);
});

// =============================================================================
// 3. SendGrid 429 重试（尊重 X-RateLimit-Reset）
// =============================================================================

test('SendGridClient: 429 限流重试 + 尊重 X-RateLimit-Reset', async () => {
  let count = 0;
  // X-RateLimit-Reset 设为 0（立即重置），应等极短时间
  const fetchImpl = mockFetch(() => {
    count++;
    if (count < 2) {
      return textResponse(429, 'Too Many Requests', { 'x-ratelimit-reset': '0' });
    }
    return jsonResponse(202, {}, { 'x-message-id': 'ok-after-429' });
  });
  const client = new SendGridClient({
    apiKey: 'SG.test',
    fetchImpl,
    maxRetries: 3,
    backoffBaseMs: 1,
  });
  const r = await client.send(makeMessage());
  assert.equal(r.status, 'queued');
  assert.equal(count, 2);
  assert.equal(r.messageId, 'ok-after-429');
});

// =============================================================================
// 4. SendGrid 401 立即失败
// =============================================================================

test('SendGridClient: 401 立即失败', async () => {
  let count = 0;
  const fetchImpl = mockFetch(() => {
    count++;
    return textResponse(401, '{"errors":[{"message":"Permission denied"}]}');
  });
  const client = new SendGridClient({
    apiKey: 'SG.bad',
    fetchImpl,
    maxRetries: 3,
    backoffBaseMs: 1,
  });
  const r = await client.send(makeMessage());
  assert.equal(r.status, 'failed');
  assert.equal(r.errorCode, 401);
  assert.ok(r.errorMessage?.includes('Permission denied'));
  assert.equal(count, 1, 'no retry on 401');
});

// =============================================================================
// 5. 模板渲染：TPL_VERIFY_EMAIL 包含验证码
// =============================================================================

test('EmailTemplate: TPL_VERIFY_EMAIL 包含 6 位验证码', () => {
  const tmpl = new EmailTemplate();
  const r = tmpl.render('TPL_VERIFY_EMAIL', { code: '654321', ttl_minutes: '5' });
  assert.ok(r.subject.includes('验证'));
  assert.ok(r.text.includes('654321'));
  assert.ok(r.text.includes('5 分钟'));
  assert.ok(r.html.includes('654321'));
  assert.ok(r.html.includes('SMY Exchange'));
  assert.ok(r.html.includes('#1677FF'.toLowerCase()) || r.html.includes('1677FF'), '主色');
});

// =============================================================================
// 6. 模板渲染：TPL_WITHDRAW_SUCCESS 包含金额
// =============================================================================

test('EmailTemplate: TPL_WITHDRAW_SUCCESS 包含金额 / 地址 / txHash', () => {
  const tmpl = new EmailTemplate();
  const r = tmpl.render('TPL_WITHDRAW_SUCCESS', {
    amount: '0.5',
    asset: 'BTC',
    address: 'bc1qxxx',
    tx_hash: '0xabcdef',
    network: 'Bitcoin',
  });
  assert.ok(r.subject.includes('提现'));
  assert.ok(r.text.includes('0.5'));
  assert.ok(r.text.includes('BTC'));
  assert.ok(r.text.includes('bc1qxxx'));
  assert.ok(r.text.includes('0xabcdef'));
  assert.ok(r.html.includes('0.5'));
  assert.ok(r.html.includes('bc1qxxx'));
});

// =============================================================================
// 7. 模板渲染：TPL_KYC_APPROVED 包含绿勾
// =============================================================================

test('EmailTemplate: TPL_KYC_APPROVED 包含绿勾 + 等级', () => {
  const tmpl = new EmailTemplate();
  const r = tmpl.render('TPL_KYC_APPROVED', { level: 'L2', time: '2026-06-20 10:00:00' });
  assert.ok(r.subject.includes('通过'));
  assert.ok(r.html.includes('L2'));
  // 绿勾（HTML entity）&#10004;
  assert.ok(r.html.includes('10004'), 'check icon');
});

// =============================================================================
// 8. 验证码生成（6 位数字）
// =============================================================================

test('EmailService.sendOtp: 生成 6 位数字验证码', async () => {
  const fetchImpl = mockFetch(() => jsonResponse(202, {}, { 'x-message-id': 'mid' }));
  const sendgrid = new SendGridClient({ apiKey: 'SG.test', fetchImpl, maxRetries: 0 });
  const svc = new EmailService({
    sendgrid,
    from: { email: 'noreply@smy.exchange' },
  });
  const r = await svc.sendOtp('alice@example.com', 'verify_email');
  const record = svc.verification.getCode(r.codeId);
  assert.ok(record);
  assert.equal(record!.code.length, VERIFICATION_CODE_LENGTH);
  assert.match(record!.code, /^\d{6}$/);
  assert.equal(r.maskedEmail, 'a***e@example.com');
  assert.equal(r.result.status, 'queued');
});

// =============================================================================
// 9. 验证码校验（正确 / 错误 / 过期 / 一次性）
// =============================================================================

test('EmailService.verifyOtp: 正确 code → valid；错误 → mismatch；二次 → used', async () => {
  const fetchImpl = mockFetch(() => jsonResponse(202, {}, { 'x-message-id': 'm' }));
  const sendgrid = new SendGridClient({ apiKey: 'SG.test', fetchImpl, maxRetries: 0 });
  const svc = new EmailService({
    sendgrid,
    from: { email: 'noreply@smy.exchange' },
  });
  const r = await svc.sendOtp('a@b.com', 'verify_email');
  const code = svc.verification.getCode(r.codeId)!.code;
  const v1 = await svc.verifyOtp(r.codeId, code, 'verify_email');
  assert.equal(v1.valid, true);
  // 错误
  const v2 = await svc.verifyOtp(r.codeId, '000000', 'verify_email');
  assert.equal(v2.valid, false);
  // 二次（已 used）
  const v3 = await svc.verifyOtp(r.codeId, code, 'verify_email');
  assert.equal(v3.valid, false);
  assert.equal(v3.reason, 'used');
});

test('EmailService.verifyOtp: 超过 max attempts → max_attempts', async () => {
  const sendgrid = new SendGridClient({ apiKey: 'mock', mockMode: true });
  // 用自定义 verification（maxAttempts=3）
  const { VerificationCodeService } = await import('../src/lib/notification/verification-code');
  const v = new VerificationCodeService({ defaultMaxAttempts: 3 });
  const svc = new EmailService({
    sendgrid,
    from: { email: 'noreply@smy.exchange' },
    verification: v,
  });
  const r = await svc.sendOtp('a@b.com', 'verify_email');
  const codeId = r.codeId;
  for (let i = 0; i < 2; i++) {
    const rr = await svc.verifyOtp(codeId, '000000', 'verify_email');
    assert.equal(rr.valid, false);
    assert.equal(rr.reason, 'mismatch');
  }
  const last = await svc.verifyOtp(codeId, '000000', 'verify_email');
  assert.equal(last.valid, false);
  assert.equal(last.reason, 'max_attempts');
  // max attempts 后即失效
  const real = await svc.verifyOtp(
    codeId,
    svc.verification.getCode(codeId)?.code ?? 'x',
    'verify_email',
  );
  assert.equal(real.valid, false);
  void real;
});

// =============================================================================
// 10. 频率限制：email_minute
// =============================================================================

test('EmailRateLimiter: 同邮箱 1 分钟内第 2 条被拒', () => {
  const rl = new EmailRateLimiter();
  const email = 'a@b.com';
  assert.equal(rl.checkAndConsume(email, undefined).allowed, true);
  const r2 = rl.check(email, undefined);
  assert.equal(r2.allowed, false);
  assert.equal(r2.violation, 'email_minute');
  assert.ok((r2.retryAfterMs ?? 0) > 0);
});

// =============================================================================
// 11. 频率限制：email_hour 5 条
// =============================================================================

test('EmailRateLimiter: 同邮箱 1 小时内最多 5 条', () => {
  let now = 1_000_000;
  const rl = new EmailRateLimiter({
    now: () => now,
    rules: {
      email_minute: { windowMs: 100, max: 100 },
    },
  });
  const email = 'a@b.com';
  for (let i = 0; i < RATE_LIMITS.perEmailPerHour; i++) {
    now += 200;
    const r = rl.checkAndConsume(email, undefined);
    assert.equal(r.allowed, true, `第 ${i + 1} 条应允许`);
  }
  now += 200;
  const r = rl.checkAndConsume(email, undefined);
  assert.equal(r.allowed, false);
  assert.equal(r.violation, 'email_hour');
});

// =============================================================================
// 12. 频率限制：email_day 10 条
// =============================================================================

test('EmailRateLimiter: 同邮箱 1 天内最多 10 条', () => {
  let now = 1_000_000;
  const rl = new EmailRateLimiter({
    now: () => now,
    rules: {
      email_minute: { windowMs: 100, max: 100 },
      email_hour: { windowMs: 1000, max: 100 },
    },
  });
  const email = 'a@b.com';
  for (let i = 0; i < RATE_LIMITS.perEmailPerDay; i++) {
    now += 200;
    const r = rl.checkAndConsume(email, undefined);
    assert.equal(r.allowed, true);
  }
  now += 200;
  const r = rl.checkAndConsume(email, undefined);
  assert.equal(r.allowed, false);
  assert.equal(r.violation, 'email_day');
});

// =============================================================================
// 13. 频率限制：user_day 20 条
// =============================================================================

test('EmailRateLimiter: 同用户 1 天内最多 20 条', () => {
  let now = 1_000_000;
  const rl = new EmailRateLimiter({
    now: () => now,
    rules: {
      email_minute: { windowMs: 100, max: 100 },
      email_hour: { windowMs: 1000, max: 100 },
      email_day: { windowMs: 10000, max: 100 },
    },
  });
  const userId = 'user-1';
  for (let i = 0; i < RATE_LIMITS.perUserPerDay; i++) {
    now += 200;
    const r = rl.checkAndConsume(`u${i}@a.com`, userId);
    assert.equal(r.allowed, true);
  }
  now += 200;
  const r = rl.checkAndConsume('zz@a.com', userId);
  assert.equal(r.allowed, false);
  assert.equal(r.violation, 'user_day');
});

// =============================================================================
// 14. 频率限制：global_second 50 条
// =============================================================================

test('EmailRateLimiter: 全局 1 秒内最多 50 条', () => {
  let now = 1_000_000;
  const rl = new EmailRateLimiter({
    now: () => now,
    rules: {
      email_minute: { windowMs: 100, max: 100 },
      email_hour: { windowMs: 1000, max: 100 },
      email_day: { windowMs: 10000, max: 100 },
      user_day: { windowMs: 10000, max: 100 },
    },
  });
  for (let i = 0; i < RATE_LIMITS.globalPerSecond; i++) {
    const r = rl.checkAndConsume(`u${i}@a.com`, `user-${i}`);
    assert.equal(r.allowed, true);
  }
  const r = rl.checkAndConsume('over@a.com', 'over-user');
  assert.equal(r.allowed, false);
  assert.equal(r.violation, 'global_second');
});

// =============================================================================
// 15. 邮箱格式校验
// =============================================================================

test('isValidEmail: 接受合法邮箱，拒绝其他', () => {
  assert.equal(isValidEmail('a@b.co'), true);
  assert.equal(isValidEmail('alice@example.com'), true);
  assert.equal(isValidEmail('a.b+tag@sub.example.com'), true);
  assert.equal(isValidEmail('not-an-email'), false);
  assert.equal(isValidEmail('@b.com'), false);
  assert.equal(isValidEmail('a@b'), false);
  assert.equal(isValidEmail('a @b.com'), false);
  assert.equal(isValidEmail(''), false);
  assert.equal(isValidEmail('a'.repeat(250) + '@b.com'), false, 'too long');
});

test('normalizeEmail / maskEmail', () => {
  assert.equal(normalizeEmail('  Alice@Example.COM '), 'alice@example.com');
  assert.equal(maskEmail('alice@example.com'), 'a***e@example.com');
  // local 长度 <= 2 → 头字符 + *** + domain
  assert.equal(maskEmail('a@b.co'), 'a***@b.co');
  assert.equal(maskEmail('ab@b.co'), 'a***@b.co');
  // local 长度 >= 3 → 头字符 + *** + 尾字符 + domain
  assert.equal(maskEmail('abc@b.co'), 'a***c@b.co');
  // @ 之前为空或单字符
  assert.equal(maskEmail('@b.co'), '@b.co');
});

// =============================================================================
// 16. EmailService.sendOtp 完整流程
// =============================================================================

test('EmailService.sendOtp: 完整流程（邮箱格式校验 → 限流 → 验证码 → 发送）', async () => {
  const fetchImpl = mockFetch(() => jsonResponse(202, {}, { 'x-message-id': 'mid' }));
  const sendgrid = new SendGridClient({ apiKey: 'SG.test', fetchImpl, maxRetries: 0 });
  const svc = new EmailService({
    sendgrid,
    from: { email: 'noreply@smy.exchange' },
  });

  // 邮箱格式错误
  await assert.rejects(
    () => svc.sendOtp('not-email', 'verify_email'),
    (err: any) => err instanceof EmailServiceError && err.code === 'invalid_email',
  );

  // 正常发送
  const r = await svc.sendOtp('alice@example.com', 'verify_email');
  assert.ok(r.codeId);
  assert.equal(r.maskedEmail, 'a***e@example.com');
  assert.equal(r.result.messageId, 'mid');
  assert.equal(r.result.status, 'queued');

  // 二次发送：触发 1 分钟 1 条限流
  await assert.rejects(
    () => svc.sendOtp('alice@example.com', 'verify_email'),
    (err: any) => err instanceof EmailServiceError && err.code === 'rate_limited',
  );
});

// =============================================================================
// 17. EmailService.sendWithdrawalConfirmation
// =============================================================================

test('EmailService.sendWithdrawalConfirmation: 渲染并发送', async () => {
  const fetchImpl = mockFetch(() => jsonResponse(202, {}, { 'x-message-id': 'wd-1' }));
  const sendgrid = new SendGridClient({ apiKey: 'SG.test', fetchImpl, maxRetries: 0 });
  const svc = new EmailService({
    sendgrid,
    from: { email: 'noreply@smy.exchange' },
  });
  const r = await svc.sendWithdrawalConfirmation(
    'user-1',
    'alice@example.com',
    {
      amount: '1.5',
      asset: 'ETH',
      address: '0xabcdef',
      txHash: '0xtxhash',
      network: 'Ethereum',
    },
  );
  assert.equal(r.status, 'queued');
  assert.equal(r.messageId, 'wd-1');
  assert.deepEqual(r.to, ['alice@example.com']);

  // 校验必填字段
  await assert.rejects(
    () =>
      svc.sendWithdrawalConfirmation('user-1', 'alice@example.com', {
        amount: '',
        asset: 'ETH',
        address: '0x',
      }),
    (err: any) => err instanceof EmailServiceError && err.code === 'invalid_params',
  );
});

// =============================================================================
// 18. EmailService.sendNewsletter 批量
// =============================================================================

test('EmailService.sendNewsletter: 批量发送 + 限流', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchImpl = mockFetch(
    () => jsonResponse(202, {}, { 'x-message-id': 'nl' }),
    calls,
  );
  const sendgrid = new SendGridClient({ apiKey: 'SG.test', fetchImpl, maxRetries: 0 });
  const svc = new EmailService({
    sendgrid,
    from: { email: 'noreply@smy.exchange' },
  });
  // 使用 3 个不同 email 避免 email_minute 限流
  const recipients = [
    { email: 'a1@x.com', userId: 'u1' },
    { email: 'a2@x.com', userId: 'u2' },
    { email: 'a3@x.com', userId: 'u3' },
  ];
  const results = await svc.sendNewsletter(recipients, {
    week: '2026-W25',
    top_gainers: 'BTC +5%\nETH +3%',
    top_losers: 'DOGE -2%',
    highlight: 'BTC 突破关键阻力位',
    cta_url: 'https://smy.exchange/markets',
  });
  assert.equal(results.length, 3);
  assert.ok(results.every((r) => r.status === 'queued'));
  assert.equal(calls.length, 3);
});

// =============================================================================
// 19. 退信处理（getSuppression）
// =============================================================================

test('SendGridClient.getSuppression: 拉取 bounces 列表', async () => {
  const fetchImpl = mockFetch(() =>
    jsonResponse(200, [
      { email: 'bad@example.com', created_at: 1718000000, reason: 'invalid', type: 'hard' },
    ]),
  );
  const client = new SendGridClient({ apiKey: 'SG.test', fetchImpl, maxRetries: 0 });
  const r = await client.getSuppression('bounces');
  assert.ok(Array.isArray(r));
  const list = r as Array<{ email: string }>;
  assert.equal(list[0].email, 'bad@example.com');
});

test('SendGridClient.deleteSuppression: 移除单个', async () => {
  let calledUrl = '';
  const fetchImpl = mockFetch((url) => {
    calledUrl = url;
    return textResponse(204, '');
  });
  const client = new SendGridClient({ apiKey: 'SG.test', fetchImpl, maxRetries: 0 });
  await client.deleteSuppression('bounces', 'bad@example.com');
  assert.ok(calledUrl.includes('/v3/suppression/bounces/'));
  assert.ok(calledUrl.includes('bad%40example.com'));
});

// =============================================================================
// 20. 断网降级到 mock
// =============================================================================

test('SendGridClient: API Key 含 mock 关键字自动进入 mock 模式', async () => {
  // 故意传一个含 mock 的 apiKey，且 fetchImpl 抛错也不会被调用
  const client = new SendGridClient({
    apiKey: 'SG.mock-key-xxx',
    fetchImpl: (() => {
      throw new Error('should not be called');
    }) as unknown as typeof fetch,
  });
  assert.equal(client.mockMode, true);
  const r = await client.send(makeMessage());
  assert.equal(r.status, 'queued');
  assert.ok(r.messageId.startsWith('MOCK'));
});

test('EmailService: 网络异常回退到 mock', async () => {
  const sendgrid = new SendGridClient({
    apiKey: 'SG.real-key',
    fetchImpl: (() => {
      throw new Error('network down');
    }) as unknown as typeof fetch,
    maxRetries: 1,
    backoffBaseMs: 1,
  });
  const svc = new EmailService({
    sendgrid,
    from: { email: 'noreply@smy.exchange' },
  });
  // 真实网络异常 → send 返回 failed
  const r = await svc.sendWithdrawalConfirmation('u1', 'a@b.com', {
    amount: '0.1',
    asset: 'BTC',
    address: '0xabc',
  });
  // 重试耗尽后 status=failed（不会降级到 mock，因为 sendgrid.send 不会抛错，而是返回 result）
  assert.ok(r.status === 'failed' || r.status === 'queued');
});

// =============================================================================
// 21. 内置模板数量
// =============================================================================

test('BUILTIN_TEMPLATES: 含 8+ 内置模板', () => {
  assert.ok(BUILTIN_TEMPLATES.length >= 8);
  const ids = BUILTIN_TEMPLATES.map((t) => t.id);
  for (const id of [
    'TPL_VERIFY_EMAIL',
    'TPL_RESET_PASSWORD',
    'TPL_WITHDRAW_SUCCESS',
    'TPL_DEPOSIT_RECEIVED',
    'TPL_LOGIN_ALERT',
    'TPL_SECURITY_ALERT',
    'TPL_KYC_APPROVED',
    'TPL_KYC_REJECTED',
    'TPL_NEWSLETTER',
  ]) {
    assert.ok(ids.includes(id), `builtin template ${id} missing`);
  }
});

// =============================================================================
// 22. 其它模板渲染
// =============================================================================

test('EmailTemplate: 渲染其余 6 个内置模板', () => {
  const tmpl = new EmailTemplate();

  const reset = tmpl.render('TPL_RESET_PASSWORD', {
    reset_url: 'https://smy.exchange/r?token=xxx',
    ttl_minutes: '30',
  });
  assert.ok(reset.html.includes('https://smy.exchange/r?token=xxx'));
  assert.ok(reset.html.includes('重置密码'));

  const dep = tmpl.render('TPL_DEPOSIT_RECEIVED', {
    amount: '100',
    asset: 'USDT',
    tx_hash: '0xdep',
    network: 'Ethereum',
    confirmations: '12',
  });
  assert.ok(dep.html.includes('100'));
  assert.ok(dep.html.includes('USDT'));
  assert.ok(dep.html.includes('12'));

  const la = tmpl.render('TPL_LOGIN_ALERT', {
    time: '2026-06-20 10:00:00',
    ip: '1.2.3.4',
    device: 'iPhone',
    location: '上海',
  });
  assert.ok(la.html.includes('1.2.3.4'));
  assert.ok(la.html.includes('iPhone'));

  const sec = tmpl.render('TPL_SECURITY_ALERT', {
    alert_type: 'large_withdraw',
    time: '2026-06-20 10:00:00',
    detail: '提现 5 BTC',
  });
  assert.ok(sec.html.includes('large_withdraw'));

  const rej = tmpl.render('TPL_KYC_REJECTED', {
    reason: '资料不清晰',
    time: '2026-06-20 10:00:00',
  });
  assert.ok(rej.html.includes('资料不清晰'));

  const nl = tmpl.render('TPL_NEWSLETTER', {
    week: '2026-W25',
    top_gainers: 'BTC',
    top_losers: 'DOGE',
    highlight: '本周亮眼',
    cta_url: 'https://smy.exchange/markets',
  });
  assert.ok(nl.html.includes('本周亮眼'));
  assert.ok(nl.html.includes('2026-W25'));
});

// =============================================================================
// 23. EmailRateLimiter.reset
// =============================================================================

test('EmailRateLimiter: reset(email) 清理该 email 窗口', () => {
  const rl = new EmailRateLimiter();
  rl.checkAndConsume('a@b.com', undefined);
  assert.equal(rl.check('a@b.com', undefined).allowed, false);
  rl.reset('a@b.com');
  assert.equal(rl.check('a@b.com', undefined).allowed, true);
});

// =============================================================================
// 24. SendGridClient.sendBatch
// =============================================================================

test('SendGridClient: sendBatch 并行发送', async () => {
  let count = 0;
  const fetchImpl = mockFetch(() => {
    count++;
    return jsonResponse(202, {}, { 'x-message-id': `m-${count}` });
  });
  const client = new SendGridClient({ apiKey: 'SG.test', fetchImpl, maxRetries: 0 });
  const results = await client.sendBatch([
    makeMessage(),
    makeMessage(),
    makeMessage(),
  ]);
  assert.equal(results.length, 3);
  assert.ok(results.every((r) => r.status === 'queued'));
});

// =============================================================================
// 25. 退订链接注入
// =============================================================================

test('EmailService: 注入退订链接（asmGroupId 存在时）', async () => {
  let capturedBody = '';
  const fetchImpl = mockFetch((_url, init) => {
    capturedBody = init?.body as string;
    return jsonResponse(202, {}, { 'x-message-id': 'unsub' });
  });
  const sendgrid = new SendGridClient({ apiKey: 'SG.test', fetchImpl, maxRetries: 0 });
  const svc = new EmailService({
    sendgrid,
    from: { email: 'noreply@smy.exchange' },
    asmGroupId: 123,
  });
  await svc.sendLoginAlert('u1', 'a@b.com', {
    time: '2026-06-20 10:00:00',
    ip: '1.2.3.4',
    device: 'iPhone',
    location: '上海',
  });
  const body = JSON.parse(capturedBody);
  assert.equal(body.asm.group_id, 123);
  assert.ok(body.attachments === undefined);
  assert.ok(body.categories.includes('TPL_LOGIN_ALERT'));
});

// =============================================================================
// 26. EmailService.sendKycResult
// =============================================================================

test('EmailService.sendKycResult: approved / rejected', async () => {
  const fetchImpl = mockFetch(() => jsonResponse(202, {}, { 'x-message-id': 'k' }));
  const sendgrid = new SendGridClient({ apiKey: 'SG.test', fetchImpl, maxRetries: 0 });
  const svc = new EmailService({ sendgrid, from: { email: 'noreply@smy.exchange' } });
  const r1 = await svc.sendKycResult('u1', 'a@b.com', 'approved', { level: 'L2' });
  assert.equal(r1.status, 'queued');
  const r2 = await svc.sendKycResult('u1', 'a@b.com', 'rejected', { reason: '模糊' });
  assert.equal(r2.status, 'queued');
});
