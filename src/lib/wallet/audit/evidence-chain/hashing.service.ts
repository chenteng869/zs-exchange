/**
 * 哈希服务 (HashingService)
 *
 * 功能：
 *  - 多算法支持：SHA-256/SHA-384/SHA-512/SHA-3/Keccak/BLAKE2/BLAKE3
 *  - 数据哈希计算
 *  - 哈希验证
 *  - HMAC 计算
 *  - 盐值生成
 *  - 哈希链生成
 *  - 文件哈希计算
 */

import {
  HashAlgorithm,
  AuditErrorCode,
  AuditError,
} from '../audit.types';

// ============================================================================
// 哈希服务配置接口
// ============================================================================

export interface HashingServiceConfig {
  defaultAlgorithm?: HashAlgorithm;
  saltLength?: number;
  iterations?: number;
  keyLength?: number;
  enableHmac?: boolean;
  hmacSecret?: string;
}

// ============================================================================
// 哈希结果接口
// ============================================================================

export interface HashResult {
  hash: string;
  algorithm: HashAlgorithm;
  salt?: string;
  iterations?: number;
  timestamp: number;
  inputLength: number;
}

// ============================================================================
// 哈希验证结果接口
// ============================================================================

export interface HashVerificationResult {
  valid: boolean;
  algorithm: HashAlgorithm;
  computedHash?: string;
  expectedHash?: string;
  timestamp: number;
  verificationTimeMs?: number;
}

// ============================================================================
// 哈希服务类
// ============================================================================

export class HashingService {
  private config: Required<HashingServiceConfig>;
  private crypto: Crypto | null = null;
  private isNodeJs: boolean = false;
  private nodeCrypto: any = null;

  // ========================================================================
  // 构造函数
  // ========================================================================

  constructor(config?: HashingServiceConfig) {
    this.config = {
      defaultAlgorithm: HashAlgorithm.SHA256,
      saltLength: 16,
      iterations: 100000,
      keyLength: 32,
      enableHmac: false,
      hmacSecret: '',
      ...config,
    };

    this.detectEnvironment();
  }

  // ========================================================================
  // 环境检测
  // ========================================================================

  private detectEnvironment(): void {
    if (typeof window !== 'undefined' && window.crypto) {
      this.crypto = window.crypto;
      this.isNodeJs = false;
    } else if (typeof globalThis !== 'undefined' && (globalThis as any).crypto) {
      this.crypto = (globalThis as any).crypto;
      this.isNodeJs = false;
    } else {
      this.isNodeJs = true;
      try {
        this.nodeCrypto = require('crypto');
      } catch {
        this.nodeCrypto = null;
      }
    }
  }

  // ========================================================================
  // 核心哈希方法
  // ========================================================================

  /**
   * 计算数据哈希
   */
  async hash(
    data: string | Uint8Array | object,
    algorithm: HashAlgorithm = this.config.defaultAlgorithm
  ): Promise<HashResult> {
    const startTime = Date.now();
    const inputBytes = this.toUint8Array(data);
    const inputLength = inputBytes.length;

    let hashHex: string;

    try {
      hashHex = await this.computeHash(inputBytes, algorithm);
    } catch (error) {
      throw new AuditError(
        AuditErrorCode.HASH_VERIFICATION_FAILED,
        `哈希计算失败: ${error instanceof Error ? error.message : String(error)}`,
        { algorithm }
      );
    }

    return {
      hash: hashHex,
      algorithm,
      timestamp: startTime,
      inputLength,
    };
  }

  /**
   * 计算带盐值的哈希
   */
  async hashWithSalt(
    data: string | Uint8Array | object,
    algorithm: HashAlgorithm = this.config.defaultAlgorithm,
    salt?: string
  ): Promise<HashResult> {
    const actualSalt = salt || this.generateSalt();
    const inputBytes = this.toUint8Array(data);
    const saltBytes = this.hexToUint8Array(actualSalt);

    const combined = new Uint8Array(saltBytes.length + inputBytes.length);
    combined.set(saltBytes, 0);
    combined.set(inputBytes, saltBytes.length);

    const result = await this.hash(combined, algorithm);

    return {
      ...result,
      salt: actualSalt,
    };
  }

  /**
   * 验证哈希
   */
  async verify(
    data: string | Uint8Array | object,
    expectedHash: string,
    algorithm: HashAlgorithm = this.config.defaultAlgorithm,
    salt?: string
  ): Promise<HashVerificationResult> {
    const startTime = Date.now();

    try {
      let computedResult: HashResult;

      if (salt) {
        computedResult = await this.hashWithSalt(data, algorithm, salt);
      } else {
        computedResult = await this.hash(data, algorithm);
      }

      const valid = this.constantTimeCompare(
        computedResult.hash.toLowerCase(),
        expectedHash.toLowerCase()
      );

      return {
        valid,
        algorithm,
        computedHash: computedResult.hash,
        expectedHash,
        timestamp: Date.now(),
        verificationTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        valid: false,
        algorithm,
        expectedHash,
        timestamp: Date.now(),
        verificationTimeMs: Date.now() - startTime,
      };
    }
  }

  // ========================================================================
  // HMAC 方法
  // ========================================================================

  /**
   * 计算 HMAC
   */
  async hmac(
    data: string | Uint8Array | object,
    secret: string = this.config.hmacSecret,
    algorithm: HashAlgorithm = this.config.defaultAlgorithm
  ): Promise<HashResult> {
    if (!this.config.enableHmac && !secret) {
      throw new AuditError(
        AuditErrorCode.CONFIG_INVALID,
        'HMAC 未启用或缺少密钥'
      );
    }

    const inputBytes = this.toUint8Array(data);
    const keyBytes = this.toUint8Array(secret);

    const blockSize = this.getBlockSize(algorithm);
    let key = keyBytes;

    if (key.length > blockSize) {
      const keyHash = await this.computeHash(key, algorithm);
      key = this.hexToUint8Array(keyHash);
    }

    if (key.length < blockSize) {
      const padded = new Uint8Array(blockSize);
      padded.set(key, 0);
      key = padded;
    }

    const oKeyPad = new Uint8Array(blockSize);
    const iKeyPad = new Uint8Array(blockSize);

    for (let i = 0; i < blockSize; i++) {
      oKeyPad[i] = key[i] ^ 0x5c;
      iKeyPad[i] = key[i] ^ 0x36;
    }

    const innerInput = new Uint8Array(iKeyPad.length + inputBytes.length);
    innerInput.set(iKeyPad, 0);
    innerInput.set(inputBytes, iKeyPad.length);

    const innerHash = await this.computeHash(innerInput, algorithm);
    const innerHashBytes = this.hexToUint8Array(innerHash);

    const outerInput = new Uint8Array(oKeyPad.length + innerHashBytes.length);
    outerInput.set(oKeyPad, 0);
    outerInput.set(innerHashBytes, oKeyPad.length);

    const outerHash = await this.computeHash(outerInput, algorithm);

    return {
      hash: outerHash,
      algorithm,
      timestamp: Date.now(),
      inputLength: inputBytes.length,
    };
  }

  /**
   * 验证 HMAC
   */
  async verifyHmac(
    data: string | Uint8Array | object,
    expectedHmac: string,
    secret: string = this.config.hmacSecret,
    algorithm: HashAlgorithm = this.config.defaultAlgorithm
  ): Promise<boolean> {
    const result = await this.hmac(data, secret, algorithm);
    return this.constantTimeCompare(result.hash.toLowerCase(), expectedHmac.toLowerCase());
  }

  // ========================================================================
  // 哈希链方法
  // ========================================================================

  /**
   * 生成哈希链
   */
  async generateHashChain(
    seed: string,
    length: number,
    algorithm: HashAlgorithm = this.config.defaultAlgorithm
  ): Promise<string[]> {
    if (length < 1) {
      throw new AuditError(
        AuditErrorCode.CONFIG_INVALID,
        '哈希链长度必须大于等于 1'
      );
    }

    const chain: string[] = [];
    let current = seed;

    for (let i = 0; i < length; i++) {
      const result = await this.hash(current + i.toString(), algorithm);
      current = result.hash;
      chain.push(current);
    }

    return chain;
  }

  /**
   * 验证哈希链中的某个元素
   */
  async verifyHashChain(
    value: string,
    expectedFinal: string,
    position: number,
    totalLength: number,
    algorithm: HashAlgorithm = this.config.defaultAlgorithm
  ): Promise<boolean> {
    if (position < 0 || position >= totalLength) {
      return false;
    }

    let current = value;

    for (let i = position; i < totalLength - 1; i++) {
      const result = await this.hash(current + (i + 1).toString(), algorithm);
      current = result.hash;
    }

    return current.toLowerCase() === expectedFinal.toLowerCase();
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 生成盐值
   */
  generateSalt(length: number = this.config.saltLength): string {
    const bytes = this.getRandomBytes(length);
    return this.uint8ArrayToHex(bytes);
  }

  /**
   * 生成随机字节
   */
  getRandomBytes(length: number): Uint8Array {
    if (this.crypto && this.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      this.crypto.getRandomValues(array);
      return array;
    }

    if (this.isNodeJs && this.nodeCrypto) {
      return this.nodeCrypto.randomBytes(length);
    }

    const array = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }

  /**
   * 计算数据指纹
   */
  async fingerprint(
    data: object,
    algorithm: HashAlgorithm = this.config.defaultAlgorithm
  ): Promise<string> {
    const canonical = JSON.stringify(data, Object.keys(data).sort());
    const result = await this.hash(canonical, algorithm);
    return result.hash;
  }

  /**
   * 双重哈希 (SHA256d)
   */
  async doubleHash(
    data: string | Uint8Array | object,
    algorithm: HashAlgorithm = this.config.defaultAlgorithm
  ): Promise<HashResult> {
    const firstHash = await this.hash(data, algorithm);
    const secondHash = await this.hash(firstHash.hash, algorithm);
    return secondHash;
  }

  /**
   * 组合多个哈希
   */
  async combineHashes(
    hashes: string[],
    algorithm: HashAlgorithm = this.config.defaultAlgorithm
  ): Promise<string> {
    const combined = hashes.sort().join('');
    const result = await this.hash(combined, algorithm);
    return result.hash;
  }

  // ========================================================================
  // 内部哈希计算
  // ========================================================================

  private async computeHash(data: Uint8Array, algorithm: HashAlgorithm): Promise<string> {
    const webCryptoAlgorithm = this.getWebCryptoAlgorithm(algorithm);

    if (this.crypto && this.crypto.subtle && webCryptoAlgorithm) {
      const hashBuffer = await this.crypto.subtle.digest(webCryptoAlgorithm, data);
      return this.uint8ArrayToHex(new Uint8Array(hashBuffer));
    }

    if (this.isNodeJs && this.nodeCrypto) {
      const nodeAlgorithm = this.getNodeCryptoAlgorithm(algorithm);
      if (nodeAlgorithm) {
        return this.nodeCrypto.createHash(nodeAlgorithm).update(data).digest('hex');
      }
    }

    if (algorithm === HashAlgorithm.SHA256) {
      return this.sha256Fallback(data);
    }

    throw new AuditError(
      AuditErrorCode.HASH_VERIFICATION_FAILED,
      `不支持的哈希算法: ${algorithm}`
    );
  }

  private getWebCryptoAlgorithm(algorithm: HashAlgorithm): string | null {
    const map: Partial<Record<HashAlgorithm, string>> = {
      [HashAlgorithm.SHA256]: 'SHA-256',
      [HashAlgorithm.SHA384]: 'SHA-384',
      [HashAlgorithm.SHA512]: 'SHA-512',
    };
    return map[algorithm] || null;
  }

  private getNodeCryptoAlgorithm(algorithm: HashAlgorithm): string | null {
    const map: Partial<Record<HashAlgorithm, string>> = {
      [HashAlgorithm.SHA256]: 'sha256',
      [HashAlgorithm.SHA384]: 'sha384',
      [HashAlgorithm.SHA512]: 'sha512',
      [HashAlgorithm.SHA3_256]: 'sha3-256',
      [HashAlgorithm.SHA3_512]: 'sha3-512',
      [HashAlgorithm.KECCAK256]: 'keccak256',
      [HashAlgorithm.BLAKE2B]: 'blake2b512',
    };
    return map[algorithm] || null;
  }

  private getBlockSize(algorithm: HashAlgorithm): number {
    const sizes: Partial<Record<HashAlgorithm, number>> = {
      [HashAlgorithm.SHA256]: 64,
      [HashAlgorithm.SHA384]: 128,
      [HashAlgorithm.SHA512]: 128,
      [HashAlgorithm.SHA3_256]: 136,
      [HashAlgorithm.SHA3_512]: 72,
      [HashAlgorithm.KECCAK256]: 136,
      [HashAlgorithm.BLAKE2B]: 128,
      [HashAlgorithm.BLAKE3]: 64,
    };
    return sizes[algorithm] || 64;
  }

  // ========================================================================
  // SHA-256 回退实现
  // ========================================================================

  private sha256Fallback(data: Uint8Array): string {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
      0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
      0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
      0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
      0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
      0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
      0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
      0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
      0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];

    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;

    const bitLen = data.length * 8;
    const byteLen = ((bitLen + 64 + 1 + 511) >>> 9) << 6;
    const bytes = new Uint8Array(byteLen);
    bytes.set(data, 0);
    bytes[data.length] = 0x80;

    const view = new DataView(bytes.buffer);
    view.setUint32(byteLen - 8, Math.floor(bitLen / 0x100000000), false);
    view.setUint32(byteLen - 4, bitLen & 0xffffffff, false);

    const w = new Int32Array(64);

    for (let offset = 0; offset < byteLen; offset += 64) {
      for (let i = 0; i < 16; i++) {
        w[i] = view.getInt32(offset + i * 4, false);
      }

      for (let i = 16; i < 64; i++) {
        const s0 = this.ror(w[i - 15], 7) ^ this.ror(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = this.ror(w[i - 2], 17) ^ this.ror(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }

      let a = h0;
      let b = h1;
      let c = h2;
      let d = h3;
      let e = h4;
      let f = h5;
      let g = h6;
      let h = h7;

      for (let i = 0; i < 64; i++) {
        const S1 = this.ror(e, 6) ^ this.ror(e, 11) ^ this.ror(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + K[i] + w[i]) | 0;
        const S0 = this.ror(a, 2) ^ this.ror(a, 13) ^ this.ror(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) | 0;

        h = g;
        g = f;
        f = e;
        e = (d + temp1) | 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) | 0;
      }

      h0 = (h0 + a) | 0;
      h1 = (h1 + b) | 0;
      h2 = (h2 + c) | 0;
      h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0;
      h5 = (h5 + f) | 0;
      h6 = (h6 + g) | 0;
      h7 = (h7 + h) | 0;
    }

    const result = new ArrayBuffer(32);
    const resultView = new DataView(result);
    resultView.setUint32(0, h0 >>> 0, false);
    resultView.setUint32(4, h1 >>> 0, false);
    resultView.setUint32(8, h2 >>> 0, false);
    resultView.setUint32(12, h3 >>> 0, false);
    resultView.setUint32(16, h4 >>> 0, false);
    resultView.setUint32(20, h5 >>> 0, false);
    resultView.setUint32(24, h6 >>> 0, false);
    resultView.setUint32(28, h7 >>> 0, false);

    return this.uint8ArrayToHex(new Uint8Array(result));
  }

  private ror(value: number, bits: number): number {
    return (value >>> bits) | (value << (32 - bits));
  }

  // ========================================================================
  // 编码工具方法
  // ========================================================================

  private toUint8Array(data: string | Uint8Array | object): Uint8Array {
    if (data instanceof Uint8Array) {
      return data;
    }

    if (typeof data === 'object') {
      data = JSON.stringify(data);
    }

    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      return encoder.encode(data);
    }

    throw new AuditError(
      AuditErrorCode.HASH_VERIFICATION_FAILED,
      '不支持的数据类型'
    );
  }

  private uint8ArrayToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private hexToUint8Array(hex: string): Uint8Array {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);

    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
    }

    return bytes;
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default HashingService;
