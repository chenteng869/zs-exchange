/**
 * 链地址生成与校验
 *
 * 支持的链：
 *  - BTC  bech32 (bc1q...) + 校验和
 *  - ETH  EIP-55 校验和（keccak256）
 *  - TRX  T + base58
 *  - BSC  同 ETH 格式
 *  - SOL  base58
 *
 * 地址生成基于种子 SHA-256，地址校验和采用真实 EIP-55 (keccak256) 与 bech32 算法。
 */

import { createHash } from 'crypto';
import { keccak256 } from 'js-sha3';

// =============================================================================
// 自定义错误
// =============================================================================

export class AddressError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'AddressError';
  }
}

// =============================================================================
// 常量
// =============================================================================

/** BIP-39 英文词表前 12 个常用词（用于模拟 HD 派生） */
export const BIP39_SAMPLE = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent',
  'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident',
];

/** 链标识 */
export type Chain = 'BTC' | 'ETH' | 'BSC' | 'TRX' | 'SOL';

/** base58 字符集（Bitcoin/IPFS 排序） */
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
/** TRON base58 字符集（与 Bitcoin 相同） */
const BASE58_MAP: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  for (let i = 0; i < BASE58_ALPHABET.length; i++) m[BASE58_ALPHABET[i]] = i;
  return m;
})();

/** bech32 字符集 */
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

// =============================================================================
// 工具函数
// =============================================================================

/** SHA-256 */
function sha256(data: Buffer | string): Buffer {
  return createHash('sha256').update(data).digest();
}

/** 16 进制编码 */
function toHex(buf: Buffer): string {
  return buf.toString('hex');
}

/** 16 进制解码 */
function fromHex(hex: string): Buffer {
  return Buffer.from(hex, 'hex');
}

/** 生成确定性伪随机字节（基于 seed，可重现） */
function seededBytes(seed: string, len: number): Buffer {
  const out: number[] = [];
  let h = sha256(seed);
  while (out.length < len) {
    h = sha256(h);
    for (let i = 0; i < h.length && out.length < len; i++) out.push(h[i]);
  }
  return Buffer.from(out);
}

// =============================================================================
// base58 编码/解码
// =============================================================================

export function base58Encode(buffer: Buffer): string {
  if (buffer.length === 0) return '';
  // 计算前导 0
  let zeros = 0;
  while (zeros < buffer.length && buffer[zeros] === 0) zeros++;

  const size = Math.ceil((buffer.length * 138) / 100) + 1;
  const b58: number[] = new Array(size).fill(0);
  let length = 0;

  for (let i = zeros; i < buffer.length; i++) {
    let carry = buffer[i];
    let j = 0;
    for (let k = size - 1; (carry !== 0 || j < length) && k >= 0; k--, j++) {
      carry += 256 * b58[k];
      b58[k] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    length = j;
  }

  let it = size - length;
  while (it < size && b58[it] === 0) it++;

  let str = '1'.repeat(zeros);
  for (; it < size; it++) str += BASE58_ALPHABET[b58[it]];
  return str;
}

export function base58Decode(str: string): Buffer {
  if (str.length === 0) return Buffer.alloc(0);
  let zeros = 0;
  while (zeros < str.length && str[zeros] === '1') zeros++;

  const size = Math.ceil((str.length * 733) / 1000) + 1;
  const b256: number[] = new Array(size).fill(0);
  let length = 0;

  for (let i = zeros; i < str.length; i++) {
    const c = str[i];
    if (!(c in BASE58_MAP)) {
      throw new AddressError('BASE58_INVALID_CHAR', `Invalid base58 char: ${c}`);
    }
    let carry = BASE58_MAP[c];
    let j = 0;
    for (let k = size - 1; (carry !== 0 || j < length) && k >= 0; k--, j++) {
      carry += 58 * b256[k];
      b256[k] = carry & 0xff;
      carry >>= 8;
    }
    length = j;
  }

  let it = size - length;
  while (it < size && b256[it] === 0) it++;

  const out = Buffer.alloc(zeros + (size - it));
  let idx = zeros;
  while (it < size) out[idx++] = b256[it];
  return out;
}

// =============================================================================
// bech32 编码/校验（BTC segwit 地址）
// =============================================================================

/** bech32 校验和多项式 */
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

/** bech32 创建校验和 */
function bech32HrpExpand(hrp: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) >> 5);
  out.push(0);
  for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) & 31);
  return out;
}

function bech32VerifyChecksum(hrp: string, data: number[]): boolean {
  return bech32Polymod(bech32HrpExpand(hrp).concat(data)) === 1;
}

/** bech32 编码类型：bech32 (BIP-173) 或 bech32m (BIP-350) */
export type Bech32Encoding = 'bech32' | 'bech32m';

function bech32CreateChecksum(hrp: string, data: number[], encoding: Bech32Encoding = 'bech32'): number[] {
  const constant = encoding === 'bech32m' ? 0x2bc830a3 : 1;
  const values = bech32HrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const mod = bech32Polymod(values) ^ constant;
  const ret: number[] = [];
  for (let i = 0; i < 6; i++) ret.push((mod >> 5 * (5 - i)) & 31);
  return ret;
}

/**
 * 5-bit 与 8-bit 之间的数据转换（BIP-173/350）
 * @param data 输入数据（每个元素在 [0, 2^from - 1] 范围内）
 * @param from 源位宽
 * @param to 目标位宽（必须为 5 或 8）
 * @param pad 是否在末尾补 0（仅当 pad=true 且最后一组不足 to 位时生效）
 */
export function convertBits(data: number[], from: number, to: number, pad = true): number[] {
  if (from < 1 || from > 8 || to < 1 || to > 8) {
    throw new AddressError('BECH32_INVALID_BIT_WIDTH', `Invalid bit width: from=${from}, to=${to}`);
  }
  let acc = 0;
  let bits = 0;
  const ret: number[] = [];
  const maxv = (1 << to) - 1;
  const maxAcc = (1 << (from + to - 1)) - 1;
  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    if (!Number.isInteger(v) || v < 0 || (v >>> from) !== 0) {
      throw new AddressError('BECH32_INVALID_VALUE', `Invalid value ${v} for ${from}-bit data at index ${i}`);
    }
    acc = ((acc << from) | v) & maxAcc;
    bits += from;
    while (bits >= to) {
      bits -= to;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) ret.push((acc << (to - bits)) & maxv);
  } else if (bits >= from || ((acc << (to - bits)) & maxv) !== 0) {
    throw new AddressError('BECH32_NOT_PADDED', 'Invalid padding in convertBits');
  }
  return ret;
}

export function bech32Encode(hrp: string, data: number[], encoding: Bech32Encoding = 'bech32'): string {
  if (typeof hrp !== 'string' || hrp.length === 0) {
    throw new AddressError('BECH32_INVALID_HRP', 'hrp must be a non-empty string');
  }
  if (!Array.isArray(data)) {
    throw new AddressError('BECH32_INVALID_DATA', 'data must be an array');
  }
  // 校验 data 全部为非负整数且在 0-31 范围（5-bit 范围）
  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    if (!Number.isInteger(v) || v < 0 || v >= 32) {
      throw new AddressError('BECH32_INVALID_VALUE', `Invalid bech32 data value at index ${i}: ${v} (expected 0-31)`);
    }
  }
  const combined = data.concat(bech32CreateChecksum(hrp, data, encoding));
  let ret = hrp + '1';
  for (let i = 0; i < combined.length; i++) {
    const b = combined[i];
    if (b < 0 || b >= BECH32_CHARSET.length) {
      throw new AddressError('BECH32_INVALID_VALUE', `Invalid bech32 value at ${i}: ${b}`);
    }
    ret += BECH32_CHARSET[b];
  }
  return ret;
}

export function bech32Decode(addr: string, encoding: Bech32Encoding | null = null): { hrp: string; data: number[]; encoding: Bech32Encoding } {
  if (typeof addr !== 'string' || addr.length === 0) {
    throw new AddressError('BECH32_INVALID_INPUT', 'addr must be a non-empty string');
  }
  const lower = addr.toLowerCase();
  const upper = addr.toUpperCase();
  if (lower !== addr && upper !== addr) {
    throw new AddressError('BECH32_MIXED_CASE', 'bech32 cannot have mixed case');
  }
  const finalAddr = lower;
  const pos = finalAddr.lastIndexOf('1');
  if (pos < 1 || pos + 7 > finalAddr.length || finalAddr.length > 90) {
    throw new AddressError('BECH32_INVALID_LENGTH', 'Invalid bech32 length');
  }
  const hrp = finalAddr.substring(0, pos);
  const data: number[] = [];
  for (let i = pos + 1; i < finalAddr.length; i++) {
    const idx = BECH32_CHARSET.indexOf(finalAddr[i]);
    if (idx === -1) {
      throw new AddressError('BECH32_INVALID_CHAR', `Invalid bech32 char: ${finalAddr[i]}`);
    }
    data.push(idx);
  }
  // 自动探测编码
  const detected: Bech32Encoding = encoding ?? (
    bech32Polymod(bech32HrpExpand(hrp).concat(data)) === 1 ? 'bech32' : 'bech32m'
  );
  const expectedConst = detected === 'bech32m' ? 0x2bc830a3 : 1;
  if (bech32Polymod(bech32HrpExpand(hrp).concat(data)) !== expectedConst) {
    throw new AddressError('BECH32_INVALID_CHECKSUM', `Invalid ${detected} checksum`);
  }
  return { hrp, data: data.slice(0, -6), encoding: detected };
}

// =============================================================================
// EIP-55 校验和编码
// =============================================================================

/**
 * EIP-55 校验和地址
 *  1. 去掉 0x 前缀，转小写
 *  2. 计算 keccak256（**真实以太坊算法**，不再是 SHA-256 模拟）
 *  3. 对每个 16 进制字符，若对应 hash 位置的 nibble >= 8 则大写
 *  4. 输出 0x + 40 字符大小写混合地址
 */
export function toChecksumAddress(address: string): string {
  if (typeof address !== 'string') {
    throw new AddressError('ETH_INVALID_INPUT', 'address must be a string');
  }
  const stripped = address.toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]{40}$/.test(stripped)) {
    throw new AddressError('ETH_INVALID_FORMAT', 'Address must be 40 hex chars (0-9, a-f)');
  }
  // 真实 keccak256（与以太坊完全一致）
  const hash = keccak256(stripped);
  let ret = '0x';
  for (let i = 0; i < stripped.length; i++) {
    const c = stripped[i];
    if (/[0-9]/.test(c)) {
      ret += c;
    } else if (parseInt(hash[i], 16) >= 8) {
      ret += c.toUpperCase();
    } else {
      ret += c;
    }
  }
  return ret;
}

// =============================================================================
// 各链地址生成
// =============================================================================

/**
 * BTC bech32 地址（bc1q... P2WPKH）
 * witness v0 + 20 字节 RIPEMD-160(SHA-256(pubkey)) 程序哈希
 * 编码：version (0) 作为 5-bit 值 + program 的 8→5 转换 (无 pad)
 */
export function generateBtcAddress(seed: string): string {
  // 模拟：从 seed 派生 20 字节程序哈希
  const programHash = seededBytes(`btc:${seed}`, 20);
  // segwit 编码规则：witness version (0) 作为 5-bit 值 (0) 加入 data
  // program bytes 用 pad=false 转为 5-bit 组
  const data5: number[] = [0, ...convertBits(Array.from(programHash), 8, 5, false)];
  return bech32Encode('bc', data5, 'bech32');
}

/**
 * BTC bech32m 地址（bc1p... P2TR / Taproot）
 * witness v1 + 32 字节 x-only 公钥
 * 32 字节 = 256 bits，需要 pad 到 260 bits (52 个 5-bit 值)
 */
export function generateBtcTaprootAddress(seed: string): string {
  const pubkey = seededBytes(`btc-tr:${seed}`, 32);
  const data5: number[] = [1, ...convertBits(Array.from(pubkey), 8, 5, true)];
  return bech32Encode('bc', data5, 'bech32m');
}

/**
 * ETH 地址（0x + 40 hex + EIP-55 校验和）
 */
export function generateEthAddress(seed: string): string {
  const bytes = seededBytes(`eth:${seed}`, 20);
  const hex = toHex(bytes);
  return toChecksumAddress('0x' + hex);
}

/**
 * TRX 地址（T 开头 + base58，34 字节：21 字节 0x41 + payload + 4 字节校验）
 */
export function generateTrxAddress(seed: string): string {
  // 21 字节：0x41 前缀 + 20 字节 payload
  const payload = seededBytes(`trx:${seed}`, 20);
  const raw = Buffer.concat([Buffer.from([0x41]), payload]);
  // 校验：双 SHA-256
  const hash = sha256(sha256(raw));
  const check = hash.subarray(0, 4);
  const fullAddr = Buffer.concat([raw, check]);
  return base58Encode(fullAddr);
}

/** BSC 同 ETH（使用不同的 seed 前缀避免重复） */
export function generateBscAddress(seed: string): string {
  return generateEthAddress(`bsc:${seed}`);
}

/** SOL 地址（base58，32 字节公钥） */
export function generateSolAddress(seed: string): string {
  const pubkey = seededBytes(`sol:${seed}`, 32);
  return base58Encode(pubkey);
}

// =============================================================================
// 统一生成入口
// =============================================================================

export function generateAddress(chain: Chain, seed: string): string {
  switch (chain) {
    case 'BTC':
      return generateBtcAddress(seed);
    case 'ETH':
      return generateEthAddress(seed);
    case 'BSC':
      return generateBscAddress(seed);
    case 'TRX':
      return generateTrxAddress(seed);
    case 'SOL':
      return generateSolAddress(seed);
    default:
      throw new AddressError('UNSUPPORTED_CHAIN', `Unsupported chain: ${chain}`);
  }
}

// =============================================================================
// 校验
// =============================================================================

/**
 * 校验链地址格式
 *  - 校验字符集、长度、checksum
 */
export function validateAddress(chain: Chain, address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  try {
    switch (chain) {
      case 'BTC': {
        // 仅支持 bech32 bc1
        if (!address.startsWith('bc1')) return false;
        const { hrp, data } = bech32Decode(address);
        if (hrp !== 'bc') return false;
        if (data.length === 0) return false;
        return true;
      }
      case 'ETH': {
        if (!/^0x[0-9A-Fa-f]{40}$/.test(address)) return false;
        // 严格 EIP-55：若地址包含大小写混合，必须与重新计算一致
        if (address !== address.toLowerCase() && address !== address.toUpperCase()) {
          try {
            return toChecksumAddress(address) === address;
          } catch {
            return false;
          }
        }
        // 全大写或全小写地址均为合法（EIP-55 兼容输入）
        return true;
      }
      case 'BSC': {
        if (!/^0x[0-9A-Fa-f]{40}$/.test(address)) return false;
        // BSC 与 ETH 使用同样的 EIP-55 校验和（EIP-55 派生自 keccak256，跨链等价）
        if (address !== address.toLowerCase() && address !== address.toUpperCase()) {
          try {
            return toChecksumAddress(address) === address;
          } catch {
            return false;
          }
        }
        return true;
      }
      case 'TRX': {
        if (!address.startsWith('T')) return false;
        if (address.length !== 34) return false;
        const decoded = base58Decode(address);
        if (decoded.length !== 25) return false;
        // 校验和
        const payload = decoded.subarray(0, 21);
        const check = decoded.subarray(21, 25);
        const hash = sha256(sha256(payload));
        return hash[0] === check[0] && hash[1] === check[1] &&
               hash[2] === check[2] && hash[3] === check[3];
      }
      case 'SOL': {
        if (address.length < 32 || address.length > 44) return false;
        try {
          const decoded = base58Decode(address);
          return decoded.length === 32;
        } catch {
          return false;
        }
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

// =============================================================================
// HD 派生（简化）
// =============================================================================

/**
 * 简化的 HD 派生
 *   mnemonic: 12 个助记词（用 BIP39_SAMPLE 中选取）
 *   index: 派生索引
 *
 * 实际 BIP-32/BIP-44 派生非常复杂，这里使用 SHA-256(mnemonic|index) 做种子。
 */
export function deriveAddress(
  mnemonic: string[],
  index: number,
  chain: Chain = 'ETH',
): string {
  if (!Array.isArray(mnemonic) || mnemonic.length === 0) {
    throw new AddressError('MNEMONIC_EMPTY', 'Mnemonic must not be empty');
  }
  if (!Number.isInteger(index) || index < 0) {
    throw new AddressError('INDEX_INVALID', 'Index must be a non-negative integer');
  }
  const joined = mnemonic.join(' ') + `:${index}`;
  return generateAddress(chain, joined);
}
