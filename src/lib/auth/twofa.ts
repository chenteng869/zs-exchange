/**
 * 双因素认证（2FA / TOTP）模块
 *
 * 严格遵循 RFC 6238 (TOTP) 和 RFC 4226 (HOTP)：
 *  - 算法：HMAC-SHA1
 *  - 码位：6 位数字
 *  - 时间步长：30 秒
 *  - 编码：base32 secret（与 Google Authenticator 兼容）
 *
 * @module lib/auth/twofa
 */

import { base32Decode, base32Encode } from './base32';
import { hmacSha1 } from './crypto';
import { TwoFAError } from './errors';

// ============================================================================
// 配置
// ============================================================================

const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30; // 秒
const TOTP_ALGO = 'SHA-1';
/** 漂移窗口：±1 个时间步（共 3 个窗口） */
const TOTP_WINDOW = 1;
/** 备份码数量 */
const BACKUP_CODE_COUNT = 10;
/** 备份码长度 */
const BACKUP_CODE_LENGTH = 10;
/** TOTP secret 字节数（160 bit = 32 base32 字符） */
const SECRET_BYTES = 20;

// ============================================================================
// TOTP Secret
// ============================================================================

/**
 * 生成 32 字符 base32 TOTP secret
 * 默认 20 字节随机熵（160 bit），符合 RFC 4226 推荐
 */
export const generateTOTPSecret = (bytes: number = SECRET_BYTES): string => {
  // 引入 randomBytes 内部使用
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomBytes } = require('./crypto') as typeof import('./crypto');
  return base32Encode(randomBytes(bytes));
};

/**
 * 从 base32 secret 解码为原始字节
 */
export const decodeTOTPSecret = (secret: string): Uint8Array => {
  return base32Decode(secret);
};

// ============================================================================
// HOTP / TOTP 核心
// ============================================================================

/**
 * 计算 HOTP（HMAC-based OTP）
 * RFC 4226 标准实现
 */
const hotp = async (secret: Uint8Array, counter: bigint): Promise<string> => {
  // counter → 8 字节大端
  const buf = new Uint8Array(8);
  let c = counter;
  const mask = BigInt(0xff);
  for (let i = 7; i >= 0; i--) {
    buf[i] = Number(c & mask);
    c >>= BigInt(8);
  }

  const hmac = await hmacSha1(secret, buf);
  // 动态截断
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (code % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, '0');
  return otp;
};

/**
 * 计算 TOTP（Time-based OTP）
 * @param secret base32 secret
 * @param timestamp 可选时间戳（毫秒），默认当前时间
 */
export const generateTOTP = async (
  secret: string,
  timestamp: number = Date.now()
): Promise<string> => {
  const counter = BigInt(Math.floor(timestamp / 1000 / TOTP_PERIOD));
  const key = base32Decode(secret);
  return hotp(key, counter);
};

/**
 * 验证 TOTP 码
 * 支持 ±window 个时间步的漂移
 *
 * @param secret base32 secret
 * @param code 用户输入的 6 位码
 * @param timestamp 验证时间（毫秒），默认当前
 * @returns 是否有效
 */
export const verifyTOTPCode = async (
  secret: string,
  code: string,
  timestamp: number = Date.now()
): Promise<boolean> => {
  if (!code || !/^\d{6}$/.test(code)) {
    return false;
  }
  if (!secret) {
    throw new TwoFAError('TOTP_NO_SECRET', 'TOTP secret is required');
  }

  const key = base32Decode(secret);
  const currentCounter = BigInt(Math.floor(timestamp / 1000 / TOTP_PERIOD));

  // 验证当前窗口 + ±window
  for (let w = -TOTP_WINDOW; w <= TOTP_WINDOW; w++) {
    const counter = currentCounter + BigInt(w);
    const expected = await hotp(key, counter);
    if (constantTimeEqual(expected, code)) {
      return true;
    }
  }
  return false;
};

/** 常量时间字符串比较 */
const constantTimeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
};

/**
 * 计算当前 TOTP 剩余有效时间（秒）
 */
export const totpRemainingSeconds = (timestamp: number = Date.now()): number => {
  const periodMs = TOTP_PERIOD * 1000;
  return Math.ceil((periodMs - (timestamp % periodMs)) / 1000);
};

/**
 * 计算当前 TOTP 进度（0-1）
 */
export const totpProgress = (timestamp: number = Date.now()): number => {
  const periodMs = TOTP_PERIOD * 1000;
  return (timestamp % periodMs) / periodMs;
};

// ============================================================================
// 备份码
// ============================================================================

/**
 * 生成一次性恢复码
 * 默认 10 个 10 位 base32-ish 字符（去除易混淆的 0/1/O/I）
 *
 * @param count 数量
 * @param length 单个长度
 */
export const generateBackupCodes = (
  count: number = BACKUP_CODE_COUNT,
  length: number = BACKUP_CODE_LENGTH
): string[] => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomBytes } = require('./crypto') as typeof import('./crypto');
  // 去除 0/1/O/I/L 等易混淆字符
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(length);
    let s = '';
    for (let j = 0; j < length; j++) {
      s += alphabet[bytes[j] % alphabet.length];
    }
    // 偶数长度时按半分割；奇数时左半少一位
    const half = Math.floor(length / 2);
    const formatted = length % 2 === 0
      ? `${s.slice(0, half)}-${s.slice(half)}`
      : `${s.slice(0, half)}-${s.slice(half + 1)}`;
    codes.push(formatted);
  }
  return codes;
};

/**
 * 计算备份码的 SHA-256 哈希（用于存储与验证）
 */
export const hashBackupCode = async (code: string): Promise<string> => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { sha256, bytesToHex, stringToBytes } = require('./crypto') as typeof import('./crypto');
  const normalized = code.replace(/-/g, '').toUpperCase();
  const hash = await sha256(stringToBytes(normalized));
  return bytesToHex(hash);
};

// ============================================================================
// otpauth:// URI（用于 QR 码）
// ============================================================================

/**
 * 生成 otpauth:// URI
 * 兼容 Google Authenticator / Authy / 1Password
 *
 * @param secret base32 secret
 * @param account 用户标识（邮箱/用户名）
 * @param issuer 发行方（公司名）
 * @param period 时间步长（默认 30s）
 * @param digits 码位数（默认 6）
 */
export const generateQRCodeURL = (
  secret: string,
  account: string,
  issuer: string = 'ZS Exchange',
  period: number = TOTP_PERIOD,
  digits: number = TOTP_DIGITS
): string => {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    algorithm: TOTP_ALGO,
    digits: digits.toString(),
    period: period.toString(),
    issuer,
  });
  return `otpauth://totp/${label}?${params.toString()}`;
};

/**
 * 解析 otpauth:// URI
 */
export const parseOtpAuthURL = (
  uri: string
): { secret: string; account: string; issuer: string; period: number; digits: number; algorithm: string } | null => {
  try {
    if (!uri.startsWith('otpauth://totp/')) return null;
    const rest = uri.substring('otpauth://totp/'.length);
    const qIndex = rest.indexOf('?');
    if (qIndex < 0) return null;
    const labelPart = decodeURIComponent(rest.substring(0, qIndex));
    const query = new URLSearchParams(rest.substring(qIndex + 1));

    const colonIndex = labelPart.indexOf(':');
    const issuer = query.get('issuer') ?? (colonIndex >= 0 ? labelPart.substring(0, colonIndex) : '');
    const account = colonIndex >= 0 ? labelPart.substring(colonIndex + 1) : labelPart;

    return {
      secret: query.get('secret') ?? '',
      account,
      issuer,
      period: parseInt(query.get('period') ?? '30', 10),
      digits: parseInt(query.get('digits') ?? '6', 10),
      algorithm: query.get('algorithm') ?? 'SHA1',
    };
  } catch {
    return null;
  }
};
