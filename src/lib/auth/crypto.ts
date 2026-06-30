/**
 * 跨平台加密工具
 *
 * 浏览器端：使用 Web Crypto API（subtle.crypto）
 * Node 端：使用 node:crypto 模块
 * 两端在功能层（HMAC-SHA256、PBKDF2、随机数）上对齐。
 *
 * @module lib/auth/crypto
 */

type BinaryData = ArrayBuffer | Uint8Array;

type CryptoGlobal = { crypto?: { subtle?: unknown; getRandomValues?: (a: Uint8Array) => Uint8Array } };

/** 获取全局 crypto 引用（浏览器） */
const getCryptoGlobal = (): CryptoGlobal | null => {
  if (typeof globalThis === 'undefined') return null;
  const g = (globalThis as unknown) as CryptoGlobal;
  if (!g.crypto || typeof g.crypto.subtle === 'undefined') return null;
  return g;
};

/** 判断是否在浏览器环境（具备 Web Crypto） */
const isBrowser = (): boolean => getCryptoGlobal() !== null;

/** 统一 Buffer/ArrayBuffer 工具 */
const toArrayBuffer = (data: BinaryData): ArrayBuffer => {
  if (data instanceof ArrayBuffer) return data;
  // 复制一份，避免 Uint8Array 视图共享内存
  const buf = new ArrayBuffer(data.byteLength);
  new Uint8Array(buf).set(data);
  return buf;
};

const toUint8Array = (data: BinaryData): Uint8Array => {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
};

// ============================================================================
// 随机数
// ============================================================================

/**
 * 生成加密安全的随机字节
 * @param length 字节数
 */
export const randomBytes = (length: number): Uint8Array => {
  if (length <= 0) {
    throw new RangeError('randomBytes: length must be > 0');
  }
  if (isBrowser()) {
    const g = getCryptoGlobal()!;
    const arr = new Uint8Array(length);
    g.crypto!.getRandomValues!(arr);
    return arr;
  }
  // Node 环境
  // eslint-disable-next-line
  const nodeCrypto = require('crypto') as typeof import('crypto');
  return new Uint8Array(nodeCrypto.randomBytes(length));
};

/** 生成 URL-safe 的随机字符串（base64url 编码） */
export const randomString = (bytes: number = 32): string =>
  base64UrlEncode(randomBytes(bytes));

// ============================================================================
// Base64 / Hex
// ============================================================================

/** base64url 编码（无 padding，URL safe） */
export const base64UrlEncode = (data: BinaryData): string => {
  const bytes = toUint8Array(data);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = isBrowser()
    ? btoa(binary)
    : (Buffer.from(binary, 'binary') as Buffer).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/** base64url 解码 */
export const base64UrlDecode = (input: string): Uint8Array => {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const binary = isBrowser()
    ? atob(b64)
    : (Buffer.from(b64, 'base64') as Buffer).toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

/** 字节转 hex */
export const bytesToHex = (data: BinaryData): string => {
  const bytes = toUint8Array(data);
  let s = '';
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, '0');
  }
  return s;
};

/** hex 转字节 */
export const hexToBytes = (hex: string): Uint8Array => {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex length');
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
};

/** 字符串 → UTF-8 字节 */
export const stringToBytes = (str: string): Uint8Array => {
  if (isBrowser()) {
    return new TextEncoder().encode(str);
  }
  return new Uint8Array(Buffer.from(str, 'utf8'));
};

/** 字节 → UTF-8 字符串 */
export const bytesToString = (bytes: BinaryData): string => {
  if (isBrowser()) {
    return new TextDecoder().decode(toUint8Array(bytes));
  }
  return Buffer.from(toUint8Array(bytes)).toString('utf8');
};

// ============================================================================
// HMAC / Hash
// ============================================================================

/** HMAC-SHA1（用于 TOTP） */
export const hmacSha1 = async (key: BinaryData, data: BinaryData): Promise<Uint8Array> => {
  return hmac(key, data, 'SHA-1');
};

/** HMAC-SHA256（用于 JWT 签名） */
export const hmacSha256 = async (
  key: BinaryData,
  data: BinaryData
): Promise<Uint8Array> => {
  return hmac(key, data, 'SHA-256');
};

const hmac = async (
  key: BinaryData,
  data: BinaryData,
  algo: 'SHA-1' | 'SHA-256'
): Promise<Uint8Array> => {
  if (isBrowser()) {
    const g = getCryptoGlobal()!;
    const subtle = (g.crypto as unknown as { subtle: SubtleCrypto }).subtle;
    const cryptoKey = await subtle.importKey(
      'raw',
      toArrayBuffer(key),
      { name: 'HMAC', hash: { name: algo } },
      false,
      ['sign']
    );
    const sig = await subtle.sign('HMAC', cryptoKey, toArrayBuffer(data));
    return new Uint8Array(sig);
  }
  // Node
  // eslint-disable-next-line
  const nodeCrypto = require('crypto') as typeof import('crypto');
  const hashAlgo = algo === 'SHA-1' ? 'sha1' : 'sha256';
  return new Uint8Array(nodeCrypto.createHmac(hashAlgo, Buffer.from(toUint8Array(key))).update(Buffer.from(toUint8Array(data))).digest());
};

/** SHA-256 */
export const sha256 = async (data: BinaryData): Promise<Uint8Array> => {
  if (isBrowser()) {
    const g = getCryptoGlobal()!;
    const subtle = (g.crypto as unknown as { subtle: SubtleCrypto }).subtle;
    const buf = await subtle.digest('SHA-256', toArrayBuffer(data));
    return new Uint8Array(buf);
  }
  // eslint-disable-next-line
  const nodeCrypto = require('crypto') as typeof import('crypto');
  return new Uint8Array(nodeCrypto.createHash('sha256').update(Buffer.from(toUint8Array(data))).digest());
};

// ============================================================================
// PBKDF2（用于密码哈希）
// ============================================================================

/**
 * PBKDF2-HMAC-SHA256 派生密钥
 * @param password 密码字节
 * @param salt 盐字节
 * @param iterations 迭代次数（推荐 ≥ 100000）
 * @param keyLen 输出字节数
 */
export const pbkdf2 = async (
  password: BinaryData,
  salt: BinaryData,
  iterations: number,
  keyLen: number = 32
): Promise<Uint8Array> => {
  if (iterations < 1000) {
    throw new RangeError('pbkdf2: iterations too low, must be >= 1000');
  }
  if (isBrowser()) {
    const g = getCryptoGlobal()!;
    const subtle = (g.crypto as unknown as { subtle: SubtleCrypto }).subtle;
    const baseKey = await subtle.importKey(
      'raw',
      toArrayBuffer(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const buf = await subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: toArrayBuffer(salt),
        iterations,
        hash: 'SHA-256',
      },
      baseKey,
      keyLen * 8
    );
    return new Uint8Array(buf);
  }
  // Node
  // eslint-disable-next-line
  const nodeCrypto = require('crypto') as typeof import('crypto');
  return new Uint8Array(
    nodeCrypto.pbkdf2Sync(
      Buffer.from(toUint8Array(password)),
      Buffer.from(toUint8Array(salt)),
      iterations,
      keyLen,
      'sha256'
    )
  );
};

/**
 * 异步 PBKDF2（避免阻塞 Node 主线程）
 */
export const pbkdf2Async = (
  password: BinaryData,
  salt: BinaryData,
  iterations: number,
  keyLen: number = 32
): Promise<Uint8Array> => {
  if (isBrowser()) {
    return pbkdf2(password, salt, iterations, keyLen);
  }
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line
    const nodeCrypto = require('crypto') as typeof import('crypto');
    nodeCrypto.pbkdf2(
      Buffer.from(toUint8Array(password)),
      Buffer.from(toUint8Array(salt)),
      iterations,
      keyLen,
      'sha256',
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(new Uint8Array(derivedKey));
      }
    );
  });
};

// ============================================================================
// 常量时间比较（防时序攻击）
// ============================================================================

/**
 * 常量时间比较两个 Uint8Array
 * 复杂度：O(n)
 */
export const timingSafeEqual = (a: BinaryData, b: BinaryData): boolean => {
  const aa = toUint8Array(a);
  const bb = toUint8Array(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) {
    diff |= aa[i] ^ bb[i];
  }
  return diff === 0;
};
