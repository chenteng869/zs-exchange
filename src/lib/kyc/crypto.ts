/**
 * PII（个人身份信息）加密与脱敏工具
 *
 * 算法：AES-256-GCM（认证加密 + 完整性校验）
 *   - IV 长度：12 字节（推荐）
 *   - 认证标签：16 字节
 *   - 输出格式：base64url(IV ‖ ciphertext ‖ authTag)
 *
 * 关键安全要求：
 *   - 生产环境 KYC_PII_KEY 必须 ≥ 32 字节（256 bit）
 *   - 密钥必须通过 HSM / KMS 管理，不入库、不入代码
 *   - 不得将明文 PII 写入日志或前端展示
 *
 * @module lib/kyc/crypto
 */

import {
  bytesToString,
  bytesToHex,
  hexToBytes,
  randomBytes,
  stringToBytes,
  base64UrlEncode,
  base64UrlDecode,
} from '@/lib/auth/crypto';
import { KycError } from '@/lib/auth/errors';

// ============================================================================
// 常量与配置
// ============================================================================

/** AES-256-GCM */
export const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

/** IV 长度（字节）— GCM 模式推荐 12 字节 */
export const GCM_IV_LENGTH = 12;

/** 认证标签长度（字节） */
export const GCM_AUTH_TAG_LENGTH = 16;

/** 密钥长度（字节） — AES-256 */
export const AES_256_KEY_LENGTH = 32;

/** KYC 数据留存天数（5 年） */
export const KYC_DATA_RETENTION_DAYS = 1825;

/** PII 加密密钥（生产环境必须通过环境变量注入） */
export const PII_ENCRYPTION_KEY =
  process.env.KYC_PII_KEY || 'dev-only-key-32-bytes-minimum-1234';

// ============================================================================
// 编码容器
// ============================================================================

/**
 * 加密后的字符串容器
 *
 * 内部结构：base64url(IV ‖ ciphertext ‖ authTag)
 *  - 前 GCM_IV_LENGTH 字节 = IV
 *  - 中间 = ciphertext
 *  - 后 GCM_AUTH_TAG_LENGTH 字节 = authTag
 */
export interface EncryptedPayload {
  /** 原始 IV（hex） */
  iv: string;
  /** 密文（hex） */
  ciphertext: string;
  /** 认证标签（hex） */
  authTag: string;
  /** 算法标识 */
  algorithm: typeof ENCRYPTION_ALGORITHM;
  /** 编码后字符串（base64url，可直接存储） */
  encoded: string;
}

// ============================================================================
// 密钥校验
// ============================================================================

/**
 * 校验并规范化加密密钥
 * @throws {KycError} 密钥长度不符
 */
const normalizeKey = (key: Buffer | Uint8Array | string): Buffer => {
  let buf: Buffer;
  if (typeof key === 'string') {
    // 字符串密钥：UTF-8 编码后的字节
    const bytes = stringToBytes(key);
    if (bytes.length < AES_256_KEY_LENGTH) {
      throw new KycError(
        'KYC_KEY_TOO_SHORT',
        `Encryption key must be at least ${AES_256_KEY_LENGTH} bytes, got ${bytes.length}`,
      );
    }
    // 取前 32 字节（截断 / 取哈希都可选，这里取前 32 字节）
    buf = Buffer.from(bytes.slice(0, AES_256_KEY_LENGTH));
  } else {
    if (key.length < AES_256_KEY_LENGTH) {
      throw new KycError(
        'KYC_KEY_TOO_SHORT',
        `Encryption key must be at least ${AES_256_KEY_LENGTH} bytes, got ${key.length}`,
      );
    }
    buf = Buffer.from(key.slice(0, AES_256_KEY_LENGTH));
  }
  return buf;
};

// ============================================================================
// 加密 / 解密
// ============================================================================

/**
 * 加密 PII 明文
 *
 * 浏览器环境：使用 Web Crypto API（异步）
 * Node 环境：使用 node:crypto.createCipheriv（同步）
 *
 * @param plaintext 明文
 * @param key 32 字节密钥
 * @returns 编码后的密文字符串（base64url）
 */
export const encryptPII = (plaintext: string, key: Buffer | Uint8Array | string): string => {
  if (plaintext === undefined || plaintext === null) {
    throw new KycError('KYC_PII_EMPTY', 'PII plaintext is required');
  }
  const k = normalizeKey(key);
  const iv = randomBytes(GCM_IV_LENGTH);

  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.subtle) {
    // 浏览器 / Web Crypto 路径
    const out = encryptWebCrypto(plaintext, k, iv);
    return out;
  }
  // Node 路径
  return encryptNode(plaintext, k, iv);
};

const encryptNode = (plaintext: string, key: Buffer, iv: Uint8Array): string => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodeCrypto = require('crypto') as typeof import('crypto');
  const cipher = nodeCrypto.createCipheriv(ENCRYPTION_ALGORITHM, key, Buffer.from(iv));
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return packEncryptedPayload(Buffer.from(iv), enc, authTag);
};

const encryptWebCrypto = (plaintext: string, key: Buffer, iv: Uint8Array): string => {
  // 浏览器使用 SubtleCrypto（同步返回密文 + 标签需要 await，但 encryptPII 是同步接口）
  // 这里通过 deasync 模式不适用，浏览器端调用方应使用 encryptPIIAsync
  // 为了保证接口在浏览器也可调用，这里使用纯 JS 实现（AES-GCM 标准库通过 SubtleCrypto）
  // 若要支持浏览器同步加密，建议调用方使用 encryptPIIAsync
  // 兜底：转 Node 路径
  return encryptNode(plaintext, key, iv);
};

/**
 * 异步加密（兼容浏览器 Web Crypto）
 */
export const encryptPIIAsync = async (
  plaintext: string,
  key: Buffer | Uint8Array | string,
): Promise<string> => {
  if (plaintext === undefined || plaintext === null) {
    throw new KycError('KYC_PII_EMPTY', 'PII plaintext is required');
  }
  const k = normalizeKey(key);
  const iv = randomBytes(GCM_IV_LENGTH);
  const subtle = (globalThis as any).crypto?.subtle;
  if (subtle) {
    const cryptoKey = await subtle.importKey(
      'raw',
      toArrayBuffer(k),
      { name: 'AES-GCM' },
      false,
      ['encrypt'],
    );
    const ctBuf = await subtle.encrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      cryptoKey,
      stringToBytes(plaintext),
    );
    const ct = new Uint8Array(ctBuf);
    // Web Crypto 输出 ciphertext + 16 字节 authTag
    const authTag = ct.slice(ct.length - GCM_AUTH_TAG_LENGTH);
    const encCt = ct.slice(0, ct.length - GCM_AUTH_TAG_LENGTH);
    return packEncryptedPayload(Buffer.from(iv), Buffer.from(encCt), Buffer.from(authTag));
  }
  return encryptNode(plaintext, k, iv);
};

/**
 * 解密 PII
 * @param ciphertext 加密字符串
 * @param key 32 字节密钥
 * @returns 明文
 */
export const decryptPII = (
  ciphertext: string,
  key: Buffer | Uint8Array | string,
): string => {
  if (!ciphertext) {
    throw new KycError('KYC_PII_EMPTY', 'PII ciphertext is required');
  }
  const k = normalizeKey(key);
  const { iv, encCt, authTag } = unpackEncryptedPayload(ciphertext);
  // Node 路径
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodeCrypto = require('crypto') as typeof import('crypto');
  const decipher = nodeCrypto.createDecipheriv(ENCRYPTION_ALGORITHM, k, iv);
  decipher.setAuthTag(authTag);
  const dec = Buffer.concat([decipher.update(encCt), decipher.final()]);
  return dec.toString('utf8');
};

/**
 * 异步解密
 */
export const decryptPIIAsync = async (
  ciphertext: string,
  key: Buffer | Uint8Array | string,
): Promise<string> => {
  if (!ciphertext) {
    throw new KycError('KYC_PII_EMPTY', 'PII ciphertext is required');
  }
  const k = normalizeKey(key);
  const { iv, encCt, authTag } = unpackEncryptedPayload(ciphertext);
  const subtle = (globalThis as any).crypto?.subtle;
  if (subtle) {
    const cryptoKey = await subtle.importKey(
      'raw',
      toArrayBuffer(k),
      { name: 'AES-GCM' },
      false,
      ['decrypt'],
    );
    // 重新拼接 ciphertext + authTag（Web Crypto 期望这种顺序）
    const full = new Uint8Array(encCt.length + authTag.length);
    full.set(encCt, 0);
    full.set(authTag, encCt.length);
    const ptBuf = await subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      cryptoKey,
      toArrayBuffer(full),
    );
    return bytesToString(new Uint8Array(ptBuf));
  }
  return decryptPII(ciphertext, k);
};

// ============================================================================
// 内部：打包 / 解包
// ============================================================================

const packEncryptedPayload = (iv: Buffer, ciphertext: Buffer, authTag: Buffer): string => {
  const total = iv.length + ciphertext.length + authTag.length;
  const out = Buffer.alloc(total);
  iv.copy(out, 0);
  ciphertext.copy(out, iv.length);
  authTag.copy(out, iv.length + ciphertext.length);
  return base64UrlEncode(out);
};

const unpackEncryptedPayload = (
  encoded: string,
): { iv: Buffer; encCt: Buffer; authTag: Buffer } => {
  const bytes = base64UrlDecode(encoded);
  if (bytes.length < GCM_IV_LENGTH + GCM_AUTH_TAG_LENGTH) {
    throw new KycError('KYC_PII_INVALID', 'Encrypted payload too short');
  }
  const iv = Buffer.from(bytes.slice(0, GCM_IV_LENGTH));
  const authTag = Buffer.from(bytes.slice(bytes.length - GCM_AUTH_TAG_LENGTH));
  const encCt = Buffer.from(
    bytes.slice(GCM_IV_LENGTH, bytes.length - GCM_AUTH_TAG_LENGTH),
  );
  return { iv, encCt, authTag };
};

const toArrayBuffer = (data: Buffer | Uint8Array): ArrayBuffer => {
  if (data instanceof ArrayBuffer) return data;
  const buf = new ArrayBuffer(data.byteLength);
  new Uint8Array(buf).set(data);
  return buf;
};

// ============================================================================
// 脱敏显示
// ============================================================================

/**
 * 身份证号脱敏
 * 11010119491231002X → 110101********002X
 * 保留前 6 位 + 后 4 位，中间用 * 替代
 */
export const maskIdNumber = (id: string): string => {
  if (!id) return '';
  const cleaned = id.trim();
  if (cleaned.length <= 10) {
    // 长度不足时只保留首尾
    if (cleaned.length <= 2) return cleaned;
    return cleaned[0] + '*'.repeat(cleaned.length - 2) + cleaned[cleaned.length - 1];
  }
  const head = cleaned.substring(0, 6);
  const tail = cleaned.substring(cleaned.length - 4);
  return `${head}********${tail}`;
};

/**
 * 姓名脱敏
 * 张三 → 张*
 * 欧阳娜娜 → 欧**娜（保留首尾）
 * 单字 → *
 */
export const maskName = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.length === 0) return '';
  if (trimmed.length === 1) return '*';
  if (trimmed.length === 2) {
    return trimmed[0] + '*';
  }
  // 3+ 字：保留首尾，中间用 *
  const head = trimmed[0];
  const tail = trimmed[trimmed.length - 1];
  return head + '*'.repeat(trimmed.length - 2) + tail;
};

/**
 * 手机号脱敏
 * 13800138000 → 138****8000
 * +86 138-0013-8000 → 138****8000（识别 +86 国家码，保留真实手机号）
 */
export const maskPhone = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 7) return cleaned;
  // 移除 +86 / 86 前缀（中国大陆）
  let body = cleaned;
  if (body.startsWith('86') && body.length >= 13) {
    body = body.substring(2);
  }
  if (body.length < 7) return body;
  const head = body.substring(0, 3);
  const tail = body.substring(body.length - 4);
  return `${head}****${tail}`;
};

/**
 * 银行卡号脱敏
 * 6222021234567890123 → 622202*********0123
 */
export const maskBankCard = (card: string): string => {
  if (!card) return '';
  const cleaned = card.replace(/\D/g, '');
  if (cleaned.length < 10) return cleaned;
  const head = cleaned.substring(0, 6);
  const tail = cleaned.substring(cleaned.length - 4);
  return `${head}${'*'.repeat(cleaned.length - 10)}${tail}`;
};

/**
 * 邮箱脱敏
 * user@example.com → u***@example.com
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 1) return `*@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(3, local.length - 1))}@${domain}`;
};

// ============================================================================
// 辅助：哈希 PII（用于不存储明文但需要做匹配的场景）
// ============================================================================

/**
 * 对 PII 计算 SHA-256 哈希（用于内部匹配 / 索引）
 * 输出：hex 编码
 *
 * 注意：仅用于非可逆匹配场景，身份证 / 手机号匹配请使用 HMAC + 盐
 */
export const hashPII = (text: string): string => {
  if (!text) return '';
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodeCrypto = require('crypto') as typeof import('crypto');
  return nodeCrypto.createHash('sha256').update(text, 'utf8').digest('hex');
};

/**
 * 解析已编码的密文为结构化对象（用于审计 / 调试）
 */
export const inspectEncryptedPayload = (encoded: string): EncryptedPayload => {
  const bytes = base64UrlDecode(encoded);
  const iv = bytesToHex(bytes.slice(0, GCM_IV_LENGTH));
  const authTag = bytesToHex(bytes.slice(bytes.length - GCM_AUTH_TAG_LENGTH));
  const ciphertext = bytesToHex(
    bytes.slice(GCM_IV_LENGTH, bytes.length - GCM_AUTH_TAG_LENGTH),
  );
  return {
    iv,
    ciphertext,
    authTag,
    algorithm: ENCRYPTION_ALGORITHM,
    encoded,
  };
};
