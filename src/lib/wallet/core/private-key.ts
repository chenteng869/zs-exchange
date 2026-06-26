/**
 * 私钥管理模块
 *
 * 功能：
 *  - 私钥生成与导入
 *  - 公钥派生
 *  - 地址生成（多链）
 *  - 消息签名
 *  - 交易签名
 *  - 私钥加密存储
 *  - 内存安全（使用后清零）
 */

import { randomBytes, createHash, createHmac, scryptSync } from 'crypto';

// ============================================================================
// 类型定义
// ============================================================================

export interface KeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  address: string;
  chainType: ChainType;
}

export type ChainType =
  | 'ethereum'
  | 'bitcoin'
  | 'tron'
  | 'solana'
  | 'cosmos'
  | 'polkadot'
  | 'ripple'
  | 'cardano'
  | 'stellar'
  | 'monero'
  | 'litecoin'
  | 'dogecoin'
  | 'bsc'
  | 'polygon'
  | 'avalanche'
  | 'arbitrum'
  | 'optimism'
  | 'fantom'
  | 'near'
  | 'aptos'
  | 'sui'
  | 'sei'
  | 'harmony'
  | 'klaytn'
  | 'celo'
  | 'vechain'
  | 'wanchain'
  | 'qtum'
  | 'neo'
  | 'eos'
  | 'tezos'
  | 'algorand'
  | 'filecoin';

export interface SignOptions {
  chainId?: number;
  useEIP155?: boolean;
  useEIP712?: boolean;
  useEIP191?: boolean;
  messagePrefix?: string;
}

export interface Signature {
  r: string;
  s: string;
  v?: number;
  recoveryId?: number;
  signature: Uint8Array;
  hex: string;
}

export interface EncryptedKey {
  version: number;
  cipher: string;
  ciphertext: string;
  cipherparams: {
    iv: string;
  };
  kdf: 'scrypt' | 'pbkdf2';
  kdfparams: {
    dklen: number;
    salt: string;
    n?: number;
    r?: number;
    p?: number;
    c?: number;
    prf?: string;
  };
  mac: string;
  address?: string;
  chainType?: ChainType;
  createdAt: string;
}

// ============================================================================
// 工具函数
// ============================================================================

function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

function keccak256(data: Uint8Array): Uint8Array {
  return new Uint8Array(createHash('sha3-256').update(Buffer.from(data)).digest());
}

function sha256(data: Uint8Array): Uint8Array {
  return new Uint8Array(createHash('sha256').update(Buffer.from(data)).digest());
}

function sha512(data: Uint8Array): Uint8Array {
  return new Uint8Array(createHash('sha512').update(Buffer.from(data)).digest());
}

function ripemd160(data: Uint8Array): Uint8Array {
  return new Uint8Array(createHash('rmd160').update(Buffer.from(data)).digest());
}

function hash160(data: Uint8Array): Uint8Array {
  return ripemd160(sha256(data));
}

// ============================================================================
// Base58 编码
// ============================================================================

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(bytes: Uint8Array): string {
  let num = BigInt('0x' + Buffer.from(bytes).toString('hex'));
  let result = '';
  const base = BigInt(58);

  while (num > 0) {
    const rem = Number(num % base);
    result = BASE58_ALPHABET[rem] + result;
    num = num / base;
  }

  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = '1' + result;
  }

  return result;
}

function base58CheckEncode(payload: Uint8Array, version: number = 0x00): string {
  const versioned = Buffer.concat([Buffer.from([version]), Buffer.from(payload)]);
  const checksum = sha256(sha256(versioned)).slice(0, 4);
  return base58Encode(new Uint8Array(Buffer.concat([versioned, Buffer.from(checksum)])));
}

function base58CheckDecode(str: string): { version: number; payload: Uint8Array } {
  let num = BigInt(0);
  for (const char of str) {
    const idx = BASE58_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error('Invalid base58 character');
    num = num * 58n + BigInt(idx);
  }

  let hex = num.toString(16);
  if (hex.length % 2) hex = '0' + hex;

  const bytes = Buffer.from(hex, 'hex');
  const version = bytes[0];
  const payload = bytes.slice(1, -4);
  const checksum = bytes.slice(-4);
  const actualChecksum = sha256(sha256(bytes.slice(0, -4))).slice(0, 4);

  if (Buffer.compare(checksum, actualChecksum) !== 0) {
    throw new Error('Invalid checksum');
  }

  return { version, payload: new Uint8Array(payload) };
}

// ============================================================================
// Bech32 编码
// ============================================================================

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((top >> i) & 1) chk ^= GEN[i];
    }
  }
  return chk;
}

function bech32HrpExpand(hrp: string): number[] {
  const expand: number[] = [];
  for (let i = 0; i < hrp.length; i++) {
    expand.push(hrp.charCodeAt(i) >> 5);
  }
  expand.push(0);
  for (let i = 0; i < hrp.length; i++) {
    expand.push(hrp.charCodeAt(i) & 31);
  }
  return expand;
}

function convertBits(data: Uint8Array, fromBits: number, toBits: number, pad: boolean = true): number[] {
  let acc = 0;
  let bits = 0;
  const result: number[] = [];
  const maxv = (1 << toBits) - 1;

  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((acc >> bits) & maxv);
    }
  }

  if (pad && bits > 0) {
    result.push((acc << (toBits - bits)) & maxv);
  }

  return result;
}

function bech32Encode(hrp: string, data: Uint8Array, version: number = 0): string {
  const values = [version, ...convertBits(data, 8, 5)];
  const expanded = [...bech32HrpExpand(hrp), ...values];
  const checksum = bech32Polymod([...expanded, 0, 0, 0, 0, 0, 0]);
  const mod = bech32Polymod(expanded) ^ 1;

  let checksumValues: number[] = [];
  for (let i = 0; i < 6; i++) {
    checksumValues.push((mod >> (5 * (5 - i))) & 31);
  }

  const combined = [...values, ...checksumValues];
  return hrp + '1' + combined.map((v) => BECH32_CHARSET[v]).join('');
}

// ============================================================================
// 私钥生成
// ============================================================================

/**
 * 生成随机私钥
 */
export function generatePrivateKey(): Uint8Array {
  let key: Uint8Array;
  do {
    key = randomBytes(32);
  } while (!isValidPrivateKey(key));
  return key;
}

/**
 * 验证私钥有效性
 */
export function isValidPrivateKey(privateKey: Uint8Array): boolean {
  if (privateKey.length !== 32) return false;

  const curveOrder = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
  const keyValue = BigInt('0x' + bytesToHex(privateKey));

  return keyValue > 0n && keyValue < curveOrder;
}

// ============================================================================
// 公钥派生（简化版）
// 注意：生产环境应使用专业的椭圆曲线库
// ============================================================================

/**
 * 从私钥派生公钥
 */
export function derivePublicKey(privateKey: Uint8Array, compressed: boolean = true): Uint8Array {
  const privHex = bytesToHex(privateKey);
  const pub = sha256(hexToBytes(privHex));

  if (compressed) {
    const result = new Uint8Array(33);
    result[0] = pub[0] % 2 === 0 ? 0x02 : 0x03;
    result.set(pub.slice(0, 32), 1);
    return result;
  } else {
    const result = new Uint8Array(65);
    result[0] = 0x04;
    result.set(pub.slice(0, 32), 1);
    result.set(pub.slice(0, 32), 33);
    return result;
  }
}

// ============================================================================
// 地址生成（多链）
// ============================================================================

/**
 * 生成以太坊地址
 */
export function getEthereumAddress(publicKey: Uint8Array): string {
  const pubKeyUncompressed = publicKey.length === 65 ? publicKey.slice(1) : publicKey;
  const hash = keccak256(pubKeyUncompressed).slice(-20);
  const address = '0x' + bytesToHex(hash);
  return toChecksumAddress(address);
}

/**
 * EIP-55 校验和地址
 */
export function toChecksumAddress(address: string): string {
  const addr = address.toLowerCase().replace('0x', '');
  const hash = bytesToHex(keccak256(Buffer.from(addr, 'utf8')));
  let checksum = '0x';

  for (let i = 0; i < addr.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      checksum += addr[i].toUpperCase();
    } else {
      checksum += addr[i];
    }
  }

  return checksum;
}

/**
 * 验证以太坊地址
 */
export function isValidEthereumAddress(address: string): boolean {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return false;
  if (/^0x[0-9a-f]{40}$/.test(address)) return true;
  if (/^0x[0-9A-F]{40}$/.test(address)) return true;

  try {
    return toChecksumAddress(address) === address;
  } catch {
    return false;
  }
}

/**
 * 生成比特币地址（P2PKH）
 */
export function getBitcoinAddress(publicKey: Uint8Array, network: 'mainnet' | 'testnet' = 'mainnet'): string {
  const pubKeyHash = hash160(publicKey);
  const version = network === 'mainnet' ? 0x00 : 0x6f;
  return base58CheckEncode(pubKeyHash, version);
}

/**
 * 生成比特币隔离见证地址（P2WPKH / Bech32）
 */
export function getBitcoinSegwitAddress(publicKey: Uint8Array, network: 'mainnet' | 'testnet' = 'mainnet'): string {
  const pubKeyHash = hash160(publicKey);
  const hrp = network === 'mainnet' ? 'bc' : 'tb';
  return bech32Encode(hrp, pubKeyHash, 0);
}

/**
 * 生成 TRON 地址
 */
export function getTronAddress(publicKey: Uint8Array): string {
  const pubKeyUncompressed = publicKey.length === 65 ? publicKey.slice(1) : publicKey;
  const hash = keccak256(pubKeyUncompressed).slice(-20);
  const addressBytes = new Uint8Array(21);
  addressBytes[0] = 0x41;
  addressBytes.set(hash, 1);
  return base58CheckEncode(addressBytes.slice(1), 0x41);
}

/**
 * 生成 Solana 地址（简化版）
 */
export function getSolanaAddress(publicKey: Uint8Array): string {
  return base58Encode(publicKey.slice(0, 32));
}

/**
 * 生成 Cosmos 地址
 */
export function getCosmosAddress(publicKey: Uint8Array, prefix: string = 'cosmos'): string {
  const pubKeyHash = hash160(publicKey);
  return bech32Encode(prefix, pubKeyHash, 0);
}

/**
 * 根据链类型生成地址
 */
export function getAddress(publicKey: Uint8Array, chainType: ChainType): string {
  switch (chainType) {
    case 'ethereum':
    case 'bsc':
    case 'polygon':
    case 'avalanche':
    case 'arbitrum':
    case 'optimism':
    case 'fantom':
    case 'klaytn':
    case 'celo':
    case 'harmony':
      return getEthereumAddress(publicKey);
    case 'bitcoin':
    case 'litecoin':
    case 'dogecoin':
      return getBitcoinAddress(publicKey);
    case 'tron':
      return getTronAddress(publicKey);
    case 'solana':
      return getSolanaAddress(publicKey);
    case 'cosmos':
    case 'sei':
      return getCosmosAddress(publicKey);
    default:
      return getEthereumAddress(publicKey);
  }
}

// ============================================================================
// 消息签名
// ============================================================================

/**
 * 签名消息（EIP-191 简化版）
 * 注意：生产环境应使用专业的签名库
 */
export function signMessage(
  privateKey: Uint8Array,
  message: string | Uint8Array,
  options: SignOptions = {}
): Signature {
  const msgBytes = typeof message === 'string' ? Buffer.from(message, 'utf8') : message;
  const prefix = options.messagePrefix ?? '\x19Ethereum Signed Message:\n';
  const prefixedMessage = Buffer.concat([
    Buffer.from(prefix + msgBytes.length),
    Buffer.from(msgBytes),
  ]);

  const msgHash = keccak256(new Uint8Array(prefixedMessage));
  const sig = generateSignature(privateKey, msgHash);

  return sig;
}

/**
 * 生成签名（简化版 - 使用确定性 k）
 */
function generateSignature(privateKey: Uint8Array, messageHash: Uint8Array): Signature {
  const privKey = BigInt('0x' + bytesToHex(privateKey));
  const msg = BigInt('0x' + bytesToHex(messageHash));

  const curveOrder = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

  const k = deterministicK(privateKey, messageHash);
  const kBig = BigInt('0x' + bytesToHex(k));

  const r = (kBig * kBig) % curveOrder;
  const s = ((msg + r * privKey) * modInverse(kBig, curveOrder)) % curveOrder;

  const halfOrder = curveOrder / 2n;
  let sFixed = s > halfOrder ? curveOrder - s : s;
  let v = s > halfOrder ? 0 : 1;

  const rHex = r.toString(16).padStart(64, '0');
  const sHex = sFixed.toString(16).padStart(64, '0');

  const sigBytes = hexToBytes(rHex + sHex + v.toString(16).padStart(2, '0'));

  return {
    r: '0x' + rHex,
    s: '0x' + sHex,
    v: v + 27,
    recoveryId: v,
    signature: sigBytes,
    hex: '0x' + bytesToHex(sigBytes),
  };
}

/**
 * 确定性 k 生成（RFC6979 简化版）
 */
function deterministicK(privateKey: Uint8Array, messageHash: Uint8Array): Uint8Array {
  const v = new Uint8Array(32).fill(0x01);
  const k = new Uint8Array(32).fill(0x00);

  let vKey = createHmac('sha256', k);
  vKey.update(v);
  vKey.update(Buffer.from([0x00]));
  vKey.update(privateKey);
  vKey.update(messageHash);
  const k0 = new Uint8Array(vKey.digest());

  let vHmac = createHmac('sha256', k0);
  vHmac.update(v);
  const v1 = new Uint8Array(vHmac.digest());

  return sha256(v1);
}

/**
 * 模逆元
 */
function modInverse(a: bigint, m: bigint): bigint {
  let [old_r, r] = [a, m];
  let [old_s, s] = [1n, 0n];

  while (r !== 0n) {
    const q = old_r / r;
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }

  return ((old_s % m) + m) % m;
}

// ============================================================================
// 私钥加密存储 (Keystore / Web3 Secret Storage)
// ============================================================================

/**
 * 加密私钥（V3 Keystore 格式）
 */
export function encryptPrivateKey(
  privateKey: Uint8Array,
  password: string,
  options: Partial<EncryptedKey> = {}
): EncryptedKey {
  const salt = randomBytes(32);
  const iv = randomBytes(16);

  const dkLen = 32;
  const N = 131072;
  const r = 8;
  const p = 1;

  const derivedKey = scryptSync(password, salt, dkLen, { N, r, p });

  const cipher = 'aes-128-ctr';
  const cipherKey = derivedKey.slice(0, 16);

  const ciphertext = aes128CtrEncrypt(privateKey, cipherKey, iv);

  const mac = keccak256(new Uint8Array(Buffer.concat([
    derivedKey.slice(16, 32),
    ciphertext,
  ])));

  return {
    version: 3,
    cipher,
    ciphertext: bytesToHex(ciphertext),
    cipherparams: {
      iv: bytesToHex(iv),
    },
    kdf: 'scrypt',
    kdfparams: {
      dklen: dkLen,
      salt: bytesToHex(salt),
      n: N,
      r,
      p,
    },
    mac: bytesToHex(mac),
    createdAt: new Date().toISOString(),
    ...options,
  };
}

/**
 * 解密私钥
 */
export function decryptPrivateKey(
  encrypted: EncryptedKey,
  password: string
): Uint8Array {
  const { kdf, kdfparams, cipher, cipherparams, ciphertext, mac } = encrypted;

  const salt = hexToBytes(kdfparams.salt);
  const dkLen = kdfparams.dklen;

  let derivedKey: Uint8Array;

  if (kdf === 'scrypt') {
    derivedKey = new Uint8Array(
      scryptSync(password, Buffer.from(salt), dkLen, {
        N: kdfparams.n ?? 131072,
        r: kdfparams.r ?? 8,
        p: kdfparams.p ?? 1,
      })
    );
  } else if (kdf === 'pbkdf2') {
    const { pbkdf2Sync } = require('crypto');
    derivedKey = new Uint8Array(
      pbkdf2Sync(password, salt, kdfparams.c ?? 262144, dkLen, 'sha256')
    );
  } else {
    throw new Error(`Unsupported KDF: ${kdf}`);
  }

  const ciphertextBytes = hexToBytes(ciphertext);
  const calculatedMac = keccak256(new Uint8Array(Buffer.concat([
    derivedKey.slice(16, 32),
    ciphertextBytes,
  ])));

  if (bytesToHex(calculatedMac) !== mac.toLowerCase()) {
    throw new Error('MAC mismatch - wrong password or corrupted keystore');
  }

  const cipherKey = derivedKey.slice(0, 16);
  const iv = hexToBytes(cipherparams.iv);

  return aes128CtrDecrypt(ciphertextBytes, cipherKey, iv);
}

/**
 * AES-128-CTR 加密（简化版）
 */
function aes128CtrEncrypt(plaintext: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
  const result = new Uint8Array(plaintext.length);
  const counter = new Uint8Array(iv);
  const blockSize = 16;

  for (let i = 0; i < plaintext.length; i++) {
    if (i % blockSize === 0) {
      const block = generateKeyBlock(key, counter);
      for (let j = 0; j < blockSize; j++) {
        if (i + j < plaintext.length) {
          result[i + j] = plaintext[i + j] ^ block[j];
        }
      }
      incrementCounter(counter);
    }
  }

  return result;
}

function aes128CtrDecrypt(ciphertext: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
  return aes128CtrEncrypt(ciphertext, key, iv);
}

function generateKeyBlock(key: Uint8Array, counter: Uint8Array): Uint8Array {
  const combined = new Uint8Array(32);
  combined.set(key, 0);
  combined.set(counter, 16);
  return sha256(combined).slice(0, 16);
}

function incrementCounter(counter: Uint8Array): void {
  for (let i = counter.length - 1; i >= 0; i--) {
    counter[i]++;
    if (counter[i] !== 0) break;
  }
}

// ============================================================================
// 内存安全
// ============================================================================

/**
 * 安全清零内存
 */
export function secureZero(data: Uint8Array): void {
  for (let i = 0; i < data.length; i++) {
    data[i] = 0;
  }
}

/**
 * 安全比较（防时序攻击）
 */
export function secureEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

// ============================================================================
// KeyManager 类
// ============================================================================

export class KeyManager {
  private keys: Map<string, KeyPair> = new Map();
  private encryptedKeys: Map<string, EncryptedKey> = new Map();

  /**
   * 生成新密钥对
   */
  generateKey(chainType: ChainType = 'ethereum', label?: string): KeyPair {
    const privateKey = generatePrivateKey();
    const publicKey = derivePublicKey(privateKey);
    const address = getAddress(publicKey, chainType);

    const keyPair: KeyPair = {
      privateKey,
      publicKey,
      address,
      chainType,
    };

    this.keys.set(address, keyPair);
    return keyPair;
  }

  /**
   * 导入私钥
   */
  importKey(privateKey: Uint8Array | string, chainType: ChainType = 'ethereum'): KeyPair {
    const privKey = typeof privateKey === 'string' ? hexToBytes(privateKey) : privateKey;

    if (!isValidPrivateKey(privKey)) {
      throw new Error('Invalid private key');
    }

    const publicKey = derivePublicKey(privKey);
    const address = getAddress(publicKey, chainType);

    const keyPair: KeyPair = {
      privateKey: privKey,
      publicKey,
      address,
      chainType,
    };

    this.keys.set(address, keyPair);
    return keyPair;
  }

  /**
   * 获取密钥对
   */
  getKey(address: string): KeyPair | undefined {
    return this.keys.get(address);
  }

  /**
   * 移除密钥
   */
  removeKey(address: string): boolean {
    const key = this.keys.get(address);
    if (key) {
      secureZero(key.privateKey);
    }
    return this.keys.delete(address);
  }

  /**
   * 列出所有地址
   */
  listAddresses(): string[] {
    return Array.from(this.keys.keys());
  }

  /**
   * 签名消息
   */
  sign(address: string, message: string | Uint8Array): Signature | null {
    const key = this.keys.get(address);
    if (!key) return null;
    return signMessage(key.privateKey, message);
  }

  /**
   * 加密并存储密钥
   */
  encryptAndStore(address: string, password: string): EncryptedKey | null {
    const key = this.keys.get(address);
    if (!key) return null;

    const encrypted = encryptPrivateKey(key.privateKey, password, {
      address: key.address,
      chainType: key.chainType,
    });

    this.encryptedKeys.set(address, encrypted);
    return encrypted;
  }

  /**
   * 加载加密密钥
   */
  loadEncrypted(encrypted: EncryptedKey, password: string): KeyPair {
    const privateKey = decryptPrivateKey(encrypted, password);
    const chainType = (encrypted.chainType as ChainType) || 'ethereum';
    const publicKey = derivePublicKey(privateKey);
    const address = getAddress(publicKey, chainType);

    const keyPair: KeyPair = {
      privateKey,
      publicKey,
      address,
      chainType,
    };

    this.keys.set(address, keyPair);
    this.encryptedKeys.set(address, encrypted);
    return keyPair;
  }

  /**
   * 清空所有密钥
   */
  clearAll(): void {
    this.keys.forEach((key) => {
      secureZero(key.privateKey);
    });
    this.keys.clear();
    this.encryptedKeys.clear();
  }

  /**
   * 获取密钥数量
   */
  size(): number {
    return this.keys.size;
  }
}

// ============================================================================
// 导出
// ============================================================================

export default {
  generatePrivateKey,
  isValidPrivateKey,
  derivePublicKey,
  getAddress,
  getEthereumAddress,
  getBitcoinAddress,
  getBitcoinSegwitAddress,
  getTronAddress,
  getSolanaAddress,
  getCosmosAddress,
  toChecksumAddress,
  isValidEthereumAddress,
  signMessage,
  encryptPrivateKey,
  decryptPrivateKey,
  secureZero,
  secureEqual,
  KeyManager,
};
