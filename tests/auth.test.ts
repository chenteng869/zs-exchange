/**
 * 认证模块单元测试
 *
 * 覆盖：
 *  - 密码 hash/verify 往返
 *  - JWT sign/verify 往返
 *  - 过期 token 检测
 *  - 2FA TOTP 生成/验证
 *  - 备份码生成
 *
 * 运行：node --import tsx tests/auth.test.ts
 * 或在 package.json 添加：
 *   "test:auth": "node --import tsx tests/auth.test.ts"
 *
 * 依赖：项目根目录有 tsx 即可（推荐）。
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  hashPassword,
  verifyPassword,
  checkPasswordStrength,
  needsRehash,
} from '../src/lib/auth/password';
import { encodeJWT, verifyJWT, decodeJWT, isJWTExpired } from '../src/lib/auth/jwt';
import {
  generateTOTPSecret,
  generateTOTP,
  verifyTOTPCode,
  generateBackupCodes,
  generateQRCodeURL,
  parseOtpAuthURL,
  totpRemainingSeconds,
} from '../src/lib/auth/twofa';

// ---------------------------------------------------------------------------
// 密码测试
// ---------------------------------------------------------------------------

test('password: hash and verify roundtrip', async () => {
  const plain = 'MyStr0ng!Pass#2026';
  const hash = await hashPassword(plain);
  assert.ok(hash.startsWith('pbkdf2$'), 'hash should use pbkdf2 prefix');
  assert.ok((await verifyPassword(plain, hash)) === true);
  assert.ok((await verifyPassword('WrongPass', hash)) === false);
});

test('password: each hash is unique (salt randomness)', async () => {
  const plain = 'SamePassword123!';
  const h1 = await hashPassword(plain);
  const h2 = await hashPassword(plain);
  assert.notEqual(h1, h2, 'two hashes for same password must differ due to random salt');
  assert.ok((await verifyPassword(plain, h1)) === true);
  assert.ok((await verifyPassword(plain, h2)) === true);
});

test('password: weak passwords are rejected by checkPasswordStrength', () => {
  for (const pwd of ['123456', 'password', 'qwerty', 'admin', '111111']) {
    const r = checkPasswordStrength(pwd);
    assert.equal(r.valid, false, `${pwd} should be invalid`);
    assert.ok(r.score <= 1, `${pwd} should score low`);
  }
});

test('password: strong password passes strength check', () => {
  const r = checkPasswordStrength('Zx9!@#$%^&*()_+aVeryLongSecurePass2026');
  assert.equal(r.valid, true);
  assert.ok(r.score >= 3);
});

test('password: needsRehash detects outdated iterations', async () => {
  const oldHash = await hashPassword('Test1234!', undefined, 10000);
  assert.equal(needsRehash(oldHash, 100000), true);
  const newHash = await hashPassword('Test1234!');
  assert.equal(needsRehash(newHash, 100000), false);
});

// ---------------------------------------------------------------------------
// JWT 测试
// ---------------------------------------------------------------------------

const TEST_SECRET = 'test-jwt-secret-key-2026-32chars-min';

test('jwt: sign and verify roundtrip', async () => {
  const token = await encodeJWT(
    { sub: 'user_001', role: 'user' },
    { expiresIn: 600, issuer: 'zs.exchange', audience: 'zs.exchange.web' },
    TEST_SECRET
  );
  assert.equal(typeof token, 'string');
  assert.equal(token.split('.').length, 3);

  const claims = await verifyJWT(
    token,
    { issuer: 'zs.exchange', audience: 'zs.exchange.web' },
    TEST_SECRET
  );
  assert.equal(claims.sub, 'user_001');
  assert.equal(claims.iss, 'zs.exchange');
  assert.equal(claims.aud, 'zs.exchange.web');
  assert.ok(claims.exp !== undefined);
  assert.ok(claims.iat !== undefined);
});

test('jwt: expired token is detected', async () => {
  const token = await encodeJWT(
    { sub: 'user_exp' },
    { expiresIn: -10 }, // 10 秒前就过期
    TEST_SECRET
  );
  await assert.rejects(
    () => verifyJWT(token, {}, TEST_SECRET),
    /expired|JWT_EXPIRED/i
  );
  assert.equal(isJWTExpired(token), true);
});

test('jwt: decode without verify', async () => {
  const token = await encodeJWT(
    { sub: 'user_decode', custom: 42 },
    { expiresIn: 60 },
    TEST_SECRET
  );
  const claims = decodeJWT(token);
  assert.equal(claims?.sub, 'user_decode');
  assert.equal(claims?.custom, 42);
});

test('jwt: wrong secret fails verification', async () => {
  const token = await encodeJWT({ sub: 'u' }, { expiresIn: 60 }, TEST_SECRET);
  await assert.rejects(
    () => verifyJWT(token, {}, 'wrong-secret-12345678901234567890'),
    /signature|JWT_INVALID_SIGNATURE/i
  );
});

test('jwt: tampered token fails verification', async () => {
  const token = await encodeJWT({ sub: 'u' }, { expiresIn: 60 }, TEST_SECRET);
  const parts = token.split('.');
  // 篡改 payload
  parts[1] = parts[1] + 'x';
  const tampered = parts.join('.');
  await assert.rejects(() => verifyJWT(tampered, {}, TEST_SECRET));
});

// ---------------------------------------------------------------------------
// 2FA / TOTP 测试
// ---------------------------------------------------------------------------

test('totp: secret has 32 base32 chars (default 20 bytes)', () => {
  const secret = generateTOTPSecret();
  assert.equal(secret.length, 32);
  assert.match(secret, /^[A-Z2-7]+$/);
});

test('totp: generate and verify', async () => {
  const secret = generateTOTPSecret();
  const code = await generateTOTP(secret);
  assert.match(code, /^\d{6}$/);
  const valid = await verifyTOTPCode(secret, code);
  assert.equal(valid, true);
});

test('totp: wrong code is rejected', async () => {
  const secret = generateTOTPSecret();
  const valid = await verifyTOTPCode(secret, '000000');
  assert.equal(valid, false);
});

test('totp: invalid format rejected', async () => {
  const secret = generateTOTPSecret();
  assert.equal(await verifyTOTPCode(secret, 'abc123'), false);
  assert.equal(await verifyTOTPCode(secret, '12345'), false);
  assert.equal(await verifyTOTPCode(secret, ''), false);
});

test('totp: time drift within ±30s is accepted', async () => {
  const secret = generateTOTPSecret();
  const now = Date.now();
  // 取前 30 秒的码
  const pastCode = await generateTOTP(secret, now - 30 * 1000);
  assert.equal(await verifyTOTPCode(secret, pastCode, now), true);
});

test('totp: qrcode url roundtrip', () => {
  const secret = generateTOTPSecret();
  const url = generateQRCodeURL(secret, 'user@example.com', 'ZS Exchange');
  assert.ok(url.startsWith('otpauth://totp/'));
  const parsed = parseOtpAuthURL(url);
  assert.ok(parsed !== null);
  assert.equal(parsed!.secret, secret);
  assert.equal(parsed!.issuer, 'ZS Exchange');
  assert.equal(parsed!.account, 'user@example.com');
  assert.equal(parsed!.period, 30);
  assert.equal(parsed!.digits, 6);
});

test('totp: remaining seconds within (0, 30]', () => {
  const r = totpRemainingSeconds();
  assert.ok(r > 0 && r <= 30);
});

test('backup codes: default 10 codes with proper format', () => {
  const codes = generateBackupCodes();
  assert.equal(codes.length, 10);
  for (const c of codes) {
    // 格式 5-5
    assert.match(c, /^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
  }
  // 唯一性
  const set = new Set(codes);
  assert.equal(set.size, codes.length, 'backup codes must be unique');
});

test('backup codes: custom count and length', () => {
  const codes = generateBackupCodes(5, 8);
  assert.equal(codes.length, 5);
  for (const c of codes) {
    assert.match(c, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  }
});

// ---------------------------------------------------------------------------
// 会话测试（轻量）
// ---------------------------------------------------------------------------

test('session: import works', async () => {
  const session = await import('../src/lib/auth/session');
  const info = session.createSession('user_001', { device: 'test', ip: '127.0.0.1' });
  assert.ok(info.token.length > 0);
  assert.equal(info.userId, 'user_001');
  const got = session.getSession(info.token);
  assert.equal(got.userId, 'user_001');
  assert.ok(session.isSessionValid(info.token));
  assert.equal(session.destroySession(info.token), true);
  assert.equal(session.isSessionValid(info.token), false);
});
