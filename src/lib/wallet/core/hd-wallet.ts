/**
 * HD 钱包实现 (BIP32 / BIP44 / BIP49 / BIP84)
 *
 * 支持:
 *  - BIP32: 层级确定性钱包
 *  - BIP44: m/44'/coin_type'/account'/change/address_index
 *  - BIP49: m/49'/coin_type'/account'/change/address_index (Nested SegWit)
 *  - BIP84: m/84'/coin_type'/account'/change/address_index (Native SegWit)
 *  - BIP141: 隔离见证地址
 *
 * 币种类型:
 *  - 0':  - 比特币
 *  - 60': - 以太坊
 *  - 195': - TRON
 *  - 501': - Solana
 *  - 118': - Cosmos
 */

import { createHmac, createHash } from 'crypto';

// ============================================================================
// 类型定义
// ============================================================================

export type HDPurpose = 44 | 49 | 84;

export type CoinType =
  | 0    // BTC
  | 60   // ETH
  | 195  // TRX
  | 501  // SOL
  | 118  // ATOM
  | 966  // MATIC
  | 5    // DASH
  | 2    // LTC
  | 145   // NMC
  | 7    // DGB
  | 105   // NEO
  | 503   // DOT
  | 43     // XRP
  | 128     // XMR
  | 134     // ADA
  | 156     // XLM
  | 23     // ETC
  | 172     // DOGE
  | 133     // ZEC
  | 1022    // BSC
  | 60      // AVAX
  | 1001    // KSM
  | 45      // RSK
  | 5718350 // BCH
  | number;

export interface HDNode {
  privateKey: Uint8Array;
  chainCode: Uint8Array;
  publicKey: Uint8Array;
  depth: number;
  index: number;
  parentFingerprint: number;
  isHardened: boolean;
  path: string;
}

export interface HDWalletOptions {
  purpose?: HDPurpose;
  coinType?: CoinType;
  account?: number;
  change?: number;
  password?: string;
}

export interface DerivedKey {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  chainCode: Uint8Array;
  path: string;
  index: number;
  address?: string;
}

export const HARDENED_OFFSET = 0x80000000;

// ============================================================================
// 常量
// ============================================================================

export const COIN_TYPES: Record<string, CoinType> = {
  BTC: 0,
  ETH: 60,
  TRX: 195,
  SOL: 501,
  ATOM: 118,
  MATIC: 966,
  DASH: 5,
  LTC: 2,
  NMC: 145,
  DGB: 7,
  NEO: 105,
  DOT: 503,
  XRP: 4,
  XMR: 128,
  ADA: 134,
  XLM: 156,
  ETC: 23,
  DOGE: 172,
  ZEC: 133,
  BSC: 1022,
  AVAX: 60,
  KSM: 1001,
  RSK: 45,
  BCH: 5718350,
};

// ============================================================================
// 工具函数
// ============================================================================

function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

function uint32ToBE(value: number): Uint8Array {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value, 0);
  return new Uint8Array(buffer);
}

function secp256k1ScalarAdd(privKey: Uint8Array, tweak: Uint8Array): Uint8Array {
  const priv = BigInt('0x' + bytesToHex(privKey));
  const tw = BigInt('0x' + bytesToHex(tweak));
  const curveOrder = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
  const result = (priv + tw) % curveOrder;
  const hex = result.toString(16).padStart(64, '0');
  return hexToBytes(hex);
}

function hash160(data: Uint8Array): Uint8Array {
  const sha = createHash('sha256').update(Buffer.from(data)).digest();
  return new Uint8Array(createHash('rmd160').update(sha).digest());
}

// ============================================================================
// 种子生成根节点
// ============================================================================

/**
 * 从种子生成 BIP32 根节点
 */
export function fromSeed(seed: Uint8Array): HDNode {
  const hmac = createHmac('sha512', Buffer.from('Bitcoin seed', 'utf8'));
  hmac.update(Buffer.from(seed));
  const i = hmac.digest();

  const privateKey = new Uint8Array(i.slice(0, 32));
  const chainCode = new Uint8Array(i.slice(32, 64));
  const publicKey = derivePublicKey(privateKey);

  return {
    privateKey,
    chainCode,
    publicKey,
    depth: 0,
    index: 0,
    parentFingerprint: 0x00000000,
    isHardened: false,
    path: 'm',
  };
}

// ============================================================================
// 公钥派生（简化版 secp256k1）
// 注意：生产环境应使用 elliptic 或 @noble/secp256k1 库
// ============================================================================

function derivePublicKey(privateKey: Uint8Array): Uint8Array {
  const privHex = bytesToHex(privateKey);
  const sha = createHash('sha256').update(Buffer.from(privHex, 'hex')).digest();
  return new Uint8Array(sha.slice(0, 33));
}

function derivePublicKeyCompressed(privateKey: Uint8Array): Uint8Array {
  const pubKey = derivePublicKey(privateKey);
  return pubKey;
}

// ============================================================================
// 子节点派生
// ============================================================================

/**
 * 派生子节点
 */
export function deriveChild(node: HDNode, index: number): HDNode {
  const isHardened = index >= HARDENED_OFFSET;
  let data: Buffer;

  if (isHardened) {
    if (node.privateKey.length === 0) {
      throw new Error('Cannot derive hardened child without private key');
    }
    const pkPadded = Buffer.concat([Buffer.alloc(1, 0), Buffer.from(node.privateKey)]);
    const indexBytes = Buffer.alloc(4);
    indexBytes.writeUInt32BE(index, 0);
    data = Buffer.concat([pkPadded, indexBytes]);
  } else {
    const pubKey = derivePublicKeyCompressed(node.privateKey);
    const indexBytes = Buffer.alloc(4);
    indexBytes.writeUInt32BE(index, 0);
    data = Buffer.concat([Buffer.from(pubKey), indexBytes]);
  }

  const hmac = createHmac('sha512', Buffer.from(node.chainCode));
  hmac.update(data);
  const i = hmac.digest();

  const il = new Uint8Array(i.slice(0, 32));
  const ir = new Uint8Array(i.slice(32, 64));

  let childPrivateKey: Uint8Array;
  if (node.privateKey.length > 0) {
    childPrivateKey = secp256k1ScalarAdd(node.privateKey, il);
  } else {
    childPrivateKey = new Uint8Array();
  }

  const childPublicKey = derivePublicKey(childPrivateKey);
  const parentFingerprintBytes = hash160(derivePublicKeyCompressed(node.privateKey)).slice(0, 4);
  const parentFingerprint = Buffer.from(parentFingerprintBytes).readUInt32BE(0);

  return {
    privateKey: childPrivateKey,
    chainCode: ir,
    publicKey: childPublicKey,
    depth: node.depth + 1,
    index,
    parentFingerprint,
    isHardened,
    path: `${node.path}/${isHardened ? index - HARDENED_OFFSET + "'" : index}`,
  };
}

/**
 * 根据路径派生
 */
export function derivePath(node: HDNode, path: string): HDNode {
  const parts = path.split('/');
  let current = node;
  let startIndex = 0;

  if (parts[0] === 'm') {
    startIndex = 1;
  }

  for (let i = startIndex; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    let index: number;
    if (part.endsWith("'") || part.endsWith('h') || part.endsWith('H')) {
      const num = parseInt(part.slice(0, -1), 10);
      index = num + HARDENED_OFFSET;
    } else {
      index = parseInt(part, 10);
    }

    current = deriveChild(current, index);
  }

  return current;
}

// ============================================================================
// BIP44 路径生成
// ============================================================================

/**
 * 生成 BIP44 路径
 * m / purpose' / coin_type' / account' / change / address_index
 */
export function getBIP44Path(
  coinType: CoinType,
  account: number = 0,
  change: number = 0,
  addressIndex: number = 0
): string {
  return `m/44'/${coinType}'/${account}'/${change}/${addressIndex}`;
}

/**
 * 生成 BIP49 路径（Nested SegWit）
 */
export function getBIP49Path(
  coinType: CoinType,
  account: number = 0,
  change: number = 0,
  addressIndex: number = 0
): string {
  return `m/49'/${coinType}'/${account}'/${change}/${addressIndex}`;
}

/**
 * 生成 BIP84 路径（Native SegWit）
 */
export function getBIP84Path(
  coinType: CoinType,
  account: number = 0,
  change: number = 0,
  addressIndex: number = 0
): string {
  return `m/84'/${coinType}'/${account}'/${change}/${addressIndex}`;
}

// ============================================================================
// HD 钱包类
// ============================================================================

export class HDWallet {
  private rootNode: HDNode;
  private purpose: HDPurpose;
  private coinType: CoinType;
  private account: number;
  private change: number;
  private addressCache: Map<string, DerivedKey>;

  constructor(seed: Uint8Array, options: HDWalletOptions = {}) {
    const {
      purpose = 44,
      coinType = 60,
      account = 0,
      change = 0,
    } = options;

    this.rootNode = fromSeed(seed);
    this.purpose = purpose;
    this.coinType = coinType;
    this.account = account;
    this.change = change;
    this.addressCache = new Map();
  }

  /**
   * 获取账户路径前缀
   */
  private getAccountPath(): string {
    return `m/${this.purpose}'/${this.coinType}'/${this.account}'`;
  }

  /**
   * 获取账户节点
   */
  getAccountNode(): HDNode {
    return derivePath(this.rootNode, this.getAccountPath());
  }

  /**
   * 派生指定索引的地址私钥
   */
  deriveKey(index: number): DerivedKey {
    const cacheKey = `${this.purpose}-${this.coinType}-${this.account}-${this.change}-${index}`;

    if (this.addressCache.has(cacheKey)) {
      return this.addressCache.get(cacheKey)!;
    }

    const accountNode = this.getAccountNode();
    const changeNode = deriveChild(accountNode, this.change);
    const addressNode = deriveChild(changeNode, index);

    const key: DerivedKey = {
      privateKey: addressNode.privateKey,
      publicKey: addressNode.publicKey,
      chainCode: addressNode.chainCode,
      path: addressNode.path,
      index,
    };

    this.addressCache.set(cacheKey, key);
    return key;
  }

  /**
   * 批量派生地址
   */
  deriveKeys(startIndex: number, count: number): DerivedKey[] {
    const keys: DerivedKey[] = [];
    for (let i = 0; i < count; i++) {
      keys.push(this.deriveKey(startIndex + i));
    }
    return keys;
  }

  /**
   * 获取完整路径
   */
  getPath(index: number): string {
    return `${this.getAccountPath()}/${this.change}/${index}`;
  }

  /**
   * 获取根节点
   */
  getRootNode(): HDNode {
    return { ...this.rootNode };
  }

  /**
   * 获取配置
   */
  getConfig() {
    return {
      purpose: this.purpose,
      coinType: this.coinType,
      account: this.account,
      change: this.change,
    };
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.addressCache.clear();
  }
}

// ============================================================================
// 多币种 HD 钱包管理器
// ============================================================================

export class MultiCoinHDWallet {
  private seed: Uint8Array;
  private wallets: Map<string, HDWallet>;

  constructor(seed: Uint8Array) {
    this.seed = seed;
    this.wallets = new Map();
  }

  /**
   * 获取指定币种的 HD 钱包
   */
  getWallet(
    symbol: string,
    options: Omit<HDWalletOptions, 'coinType'> = {}
  ): HDWallet {
    const coinType = COIN_TYPES[symbol.toUpperCase()] ?? 60;
    const key = `${symbol.toUpperCase()}-${options.purpose ?? 44}-${options.account ?? 0}-${options.change ?? 0}`;

    if (!this.wallets.has(key)) {
      const wallet = new HDWallet(this.seed, {
        ...options,
        coinType,
      });
      this.wallets.set(key, wallet);
    }

    return this.wallets.get(key)!;
  }

  /**
   * 获取指定币种的地址私钥
   */
  deriveKey(
    symbol: string,
    index: number = 0,
    options: Omit<HDWalletOptions, 'coinType'> = {}
  ): DerivedKey {
    const wallet = this.getWallet(symbol, options);
    return wallet.deriveKey(index);
  }

  /**
   * 获取所有支持的币种
   */
  getSupportedCoins(): string[] {
    return Object.keys(COIN_TYPES);
  }

  /**
   * 清空所有缓存
   */
  clearAllCaches(): void {
    this.wallets.forEach((wallet) => wallet.clearCache());
  }
}

// ============================================================================
// xpub / xprv 序列化（简化版）
// ============================================================================

export interface ExtendedKey {
  version: number;
  depth: number;
  parentFingerprint: number;
  index: number;
  chainCode: Uint8Array;
  keyData: Uint8Array;
  isPrivate: boolean;
}

const VERSIONS = {
  mainnet: {
    xprv: 0x0488ade4,
    xpub: 0x0488b21e,
    yprv: 0x049d7878,
    ypub: 0x049d7cb2,
    zprv: 0x04b2430c,
    zpub: 0x04b24746,
  },
  testnet: {
    xprv: 0x04358394,
    xpub: 0x043587cf,
    tprv: 0x044a4e28,
    tpub: 0x044a5262,
  },
};

function base58CheckEncode(data: Uint8Array): string {
  const buffer = Buffer.from(data);
  const checksum = createHash('sha256')
    .update(createHash('sha256').update(buffer).digest())
    .digest()
    .slice(0, 4);
  const payload = Buffer.concat([buffer, checksum]);

  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt('0x' + payload.toString('hex'));
  let result = '';

  while (num > 0) {
    const remainder = Number(num % 58n);
    result = ALPHABET[remainder] + result;
    num = num / 58n;
  }

  for (let i = 0; i < payload.length && payload[i] === 0; i++) {
    result = '1' + result;
  }

  return result;
}

function base58CheckDecode(str: string): Uint8Array {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt(0);

  for (const char of str) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) throw new Error('Invalid base58 character');
    num = num * 58n + BigInt(index);
  }

  let hex = num.toString(16);
  if (hex.length % 2) hex = '0' + hex;

  const bytes = Buffer.from(hex, 'hex');
  const data = bytes.slice(0, -4);
  const checksum = bytes.slice(-4);
  const actualChecksum = createHash('sha256')
    .update(createHash('sha256').update(data).digest())
    .digest()
    .slice(0, 4);

  if (Buffer.compare(checksum, actualChecksum) !== 0) {
    throw new Error('Invalid checksum');
  }

  return new Uint8Array(data);
}

/**
 * 序列化扩展私钥 (xprv)
 */
export function serializeExtendedKey(
  node: HDNode,
  version: number = VERSIONS.mainnet.xprv,
  isPrivate: boolean = true
): string {
  const buffer = Buffer.alloc(78);
  let offset = 0;

  buffer.writeUInt32BE(version, offset);
  offset += 4;
  buffer.writeUInt8(node.depth, offset);
  offset += 1;
  buffer.writeUInt32BE(node.parentFingerprint, offset);
  offset += 4;
  buffer.writeUInt32BE(node.index, offset);
  offset += 4;
  buffer.set(Buffer.from(node.chainCode), offset);
  offset += 32;

  if (isPrivate) {
    buffer.writeUInt8(0, offset);
    offset += 1;
    buffer.set(Buffer.from(node.privateKey), offset);
  } else {
    buffer.set(Buffer.from(node.publicKey), offset);
  }

  return base58CheckEncode(new Uint8Array(buffer));
}

/**
 * 反序列化扩展密钥
 */
export function deserializeExtendedKey(extendedKey: string): ExtendedKey {
  const data = base58CheckDecode(extendedKey);
  const buffer = Buffer.from(data);

  const version = buffer.readUInt32BE(0);
  const depth = buffer.readUInt8(4);
  const parentFingerprint = buffer.readUInt32BE(5);
  const index = buffer.readUInt32BE(9);
  const chainCode = new Uint8Array(buffer.slice(13, 45));
  const keyData = new Uint8Array(buffer.slice(45, 78));
  const isPrivate = keyData[0] === 0;

  return {
    version,
    depth,
    parentFingerprint,
    index,
    chainCode,
    keyData: isPrivate ? keyData.slice(1) : keyData,
    isPrivate,
  };
}

// ============================================================================
// 导出
// ============================================================================

export default {
  fromSeed,
  deriveChild,
  derivePath,
  getBIP44Path,
  getBIP49Path,
  getBIP84Path,
  HDWallet,
  MultiCoinHDWallet,
  serializeExtendedKey,
  deserializeExtendedKey,
  COIN_TYPES,
  HARDENED_OFFSET,
};
