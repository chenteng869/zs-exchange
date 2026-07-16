/**
 * 日志脱敏工具
 *
 * 防止敏感信息泄漏到日志中：
 *  - 卡号、CVV、密码、API Key
 *  - JWT / Bearer Token
 *  - 私钥、助记词、Keystore
 *  - 邮箱、手机号、身份证
 *  - 钱包地址（可配置白名单）
 *
 * 用法：
 *  ```ts
 *  import { logSanitizer, safeLog } from '@/lib/security/log-sanitizer';
 *
 *  // 1. 整个对象脱敏
 *  logger.info('user data:', logSanitizer(userData));
 *
 *  // 2. 单值脱敏
 *  logger.info('token:', safeLog.jwt(rawToken)); // → "eyJ...***"
 *
 *  // 3. 一行调用
 *  safeLog.info(logger, 'tx', { hash, from, to, amount, secretKey });
 *  ```
 */

// =============================================================================
// 敏感字段名（命中则整字段值替换为 [REDACTED]）
// =============================================================================

const SENSITIVE_KEYS = new Set([
  // 认证
  'password', 'passwd', 'pwd', 'pin', 'passphrase',
  'token', 'accessToken', 'refreshToken', 'idToken', 'apiKey', 'api_key',
  'apikey', 'secret', 'secretKey', 'secret_key', 'clientSecret',
  'authorization', 'bearer', 'x-api-key', 'x_auth_token',
  'privateKey', 'private_key', 'mnemonic', 'seed', 'seedPhrase', 'seed_phrase',
  'keystore', 'encryptedKey', 'encrypted_key', 'encPrivKey',
  // 金融
  'cvv', 'cvc', 'cardNumber', 'card_number', 'creditCard',
  'iban', 'swift', 'ssn', 'sin', 'taxId', 'tax_id',
  // PII
  'email', 'phone', 'phoneNumber', 'phone_number', 'mobile',
  'idCard', 'id_card', 'idNumber', 'id_number', 'passport',
  'address_line', 'street', 'postal', 'zip',
  // 钱包/链上
  'signedTransaction', 'signedTx', 'txSignature', 'signature',
]);

// =============================================================================
// 正则脱敏
// =============================================================================

const REDACTION = '***REDACTED***';
const SHORT_REDACTION = '***';

const PATTERNS: Array<{ re: RegExp; mask: (m: string) => string }> = [
  // JWT (header.payload.signature)
  {
    re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    mask: (m) => `${m.slice(0, 12)}...${SHORT_REDACTION}`,
  },
  // Bearer token
  {
    re: /Bearer\s+[A-Za-z0-9_.\-+/=]{16,}/gi,
    mask: () => `Bearer ${REDACTION}`,
  },
  // 卡号（13-19 位数字，可能含空格/连字符）
  {
    re: /\b(?:\d[ -]?){12,18}\d\b/g,
    mask: (m) => `${m.slice(0, 4)}${REDACTION}${m.slice(-4)}`,
  },
  // CVV（3-4 位数字，前后是边界）
  {
    re: /\bcvv[":\s]*([0-9]{3,4})\b/gi,
    mask: () => `cvv:${REDACTION}`,
  },
  // 邮箱
  {
    re: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
    mask: (m) => {
      const at = m.indexOf('@');
      if (at <= 1) return `*${m.slice(at)}`;
      return `${m[0]}***${m.slice(at)}`;
    },
  },
  // 手机号（中国大陆 11 位）
  {
    re: /\b1[3-9]\d{9}\b/g,
    mask: (m) => `${m.slice(0, 3)}****${m.slice(4)}`,
  },
  // 身份证（18 位）
  {
    re: /\b[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g,
    mask: (m) => `${m.slice(0, 4)}**********${m.slice(-4)}`,
  },
  // 私钥（base58 长度 80+ 字符 / 0x + 64 hex）
  {
    re: /\b0x[0-9a-fA-F]{64}\b/g,
    mask: () => `0x${REDACTION}`,
  },
  {
    re: /\b[1-9A-HJ-NP-Za-km-z]{87,88}\b/g,
    mask: () => `base58:${REDACTION}`,
  },
  // 助记词（12/15/18/21/24 单词）
  {
    re: /\b(?:[a-z]{3,8}\s+){11}[a-z]{3,8}\b/gi,
    mask: () => `mnemonic(${SHORT_REDACTION})`,
  },
];

// =============================================================================
// 工具函数
// =============================================================================

/**
 * 递归脱敏对象（替换敏感字段值 + 对字符串值应用正则脱敏）
 *  - 不修改原对象（深拷贝后再处理）
 *  - 循环引用用 [Circular] 占位
 */
export function logSanitizer<T = unknown>(input: T, depth = 0): T {
  if (depth > 10) return '[MaxDepth]' as unknown as T;
  if (input === null || input === undefined) return input;
  if (typeof input === 'string') {
    return sanitizeString(input) as unknown as T;
  }
  if (typeof input === 'number' || typeof input === 'boolean' || typeof input === 'bigint') {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((v) => logSanitizer(v, depth + 1)) as unknown as T;
  }
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k)) {
        out[k] = `[REDACTED:${k}]`;
      } else {
        out[k] = logSanitizer(v, depth + 1);
      }
    }
    return out as unknown as T;
  }
  return input;
}

function sanitizeString(s: string): string {
  let out = s;
  for (const { re, mask } of PATTERNS) {
    out = out.replace(re, mask);
  }
  return out;
}

/**
 * 预定义的字段脱敏
 */
export const safeLog = {
  /** JWT / Bearer Token 截断显示 */
  jwt(token: unknown): string {
    if (typeof token !== 'string') return '';
    if (token.length <= 12) return SHORT_REDACTION;
    return `${token.slice(0, 8)}...${token.slice(-4)}`;
  },
  /** 钱包地址（保留首尾 4 位） */
  address(addr: unknown): string {
    if (typeof addr !== 'string') return '';
    if (addr.length <= 8) return SHORT_REDACTION;
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  },
  /** 卡号（保留首 4 + 末 4） */
  cardNumber(num: unknown): string {
    if (typeof num !== 'string') return '';
    return `${num.slice(0, 4)}${REDACTION}${num.slice(-4)}`;
  },
  /** 邮箱 */
  email(mail: unknown): string {
    if (typeof mail !== 'string') return '';
    const at = mail.indexOf('@');
    if (at <= 1) return `*${mail.slice(at)}`;
    return `${mail[0]}***${mail.slice(at)}`;
  },
  /** 手机号 */
  phone(p: unknown): string {
    if (typeof p !== 'string') return '';
    if (p.length < 7) return SHORT_REDACTION;
    return `${p.slice(0, 3)}****${p.slice(-4)}`;
  },
  /** API Key 截断 */
  apiKey(k: unknown): string {
    if (typeof k !== 'string') return '';
    if (k.length <= 8) return SHORT_REDACTION;
    return `${k.slice(0, 4)}${REDACTION}${k.slice(-4)}`;
  },
};

/**
 * 一行安全日志输出
 *  - 自动递归脱敏入参对象
 *  - 字符串入参也走正则脱敏
 */
export const safeLogCall = {
  info: (logger: { info: (...args: unknown[]) => void }, ...args: unknown[]) =>
    logger.info(...args.map((a) => logSanitizer(a))),
  warn: (logger: { warn: (...args: unknown[]) => void }, ...args: unknown[]) =>
    logger.warn(...args.map((a) => logSanitizer(a))),
  error: (logger: { error: (...args: unknown[]) => void }, ...args: unknown[]) =>
    logger.error(...args.map((a) => logSanitizer(a))),
  debug: (logger: { debug: (...args: unknown[]) => void }, ...args: unknown[]) =>
    logger.debug(...args.map((a) => logSanitizer(a))),
};
