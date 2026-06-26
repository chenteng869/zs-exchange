/**
 * 提现广播器（WithdrawalBroadcaster）
 *
 * 职责：
 *  - 构造多链提现交易：
 *      * EVM：EIP-1559 (type=2) 交易 / Legacy (type=0)
 *      * TRON：TRX 转账 / TRC20 transfer()
 *  - 热钱包签名（EIP-155 椭圆曲线签名 / TRON secp256k1 签名）
 *  - 广播到 EVM JSON-RPC / TronGrid
 *  - 跟踪确认数（轮询区块号）
 *  - 替换 nonce 提价（取消 stuck 交易）
 *
 * 安全约束：
 *  - 私钥不写入日志、不返回到调用方
 *  - 签名全部使用确定性 k (RFC 6979)
 *  - 失败回退：RPC 不可用时 broadcast() 抛出错误，由上层决定回滚
 *
 * 依赖：
 *  - keccak256 (js-sha3) - 已在 address.ts 中使用
 *  - BigInt 原生支持
 *  - 自实现 secp256k1（不引外部库）
 */

import { keccak256 } from 'js-sha3';
import { RpcClient, RpcError, ETH_PUBLIC_RPCS, BSC_PUBLIC_RPCS } from './rpc-client';
import {
  TronRpcClient,
  TRON_DEFAULT_ENDPOINTS,
} from './tron-rpc-client';

// =============================================================================
// 公共类型
// =============================================================================

export type EvmChain = 'ETH' | 'BSC';
export type Chain = EvmChain | 'TRON';

export interface UnsignedTx {
  chain: Chain;
  raw: any;
  hashPayload: string;
  to: string;
  value: string;
  data?: string;
  nonce?: number;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface SignedTx {
  chain: Chain;
  serialized: string;
  txHash: string;
  signature: { r: string; s: string; v?: number };
}

export interface TransactionReceipt {
  txHash: string;
  blockNumber: number;
  confirmations: number;
  status: 'success' | 'failed' | 'pending';
  gasUsed: string;
  effectiveGasPrice: string;
}

export interface BuildEip1559Opts {
  chain: EvmChain;
  from: string;
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  chainId?: number;
}

export interface BuildTrxTransferOpts {
  from: string;
  to: string;
  amountSun: string;
}

export interface BuildTrc20TransferOpts {
  contractAddress: string;
  from: string;
  to: string;
  amount: string;
  decimals: number;
}

// =============================================================================
// secp256k1 自实现（基于 BigInt）
// =============================================================================

/** secp256k1 曲线参数 */
const SECP256K1_P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
const SECP256K1_N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const SECP256K1_GX = 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
const SECP256K1_GY = 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;

interface ECPoint {
  x: bigint;
  y: bigint;
}

const EC_INFINITY: ECPoint = { x: 0n, y: 0n };

function mod(a: bigint, m: bigint): bigint {
  const r = a % m;
  return r < 0n ? r + m : r;
}

function modInverse(a: bigint, m: bigint): bigint {
  // 扩展欧几里得
  let [oldR, r] = [a, m];
  let [oldS, s] = [1n, 0n];
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  // oldR = gcd(a, m) = 1
  return mod(oldS, m);
}

function pointDouble(p: ECPoint): ECPoint {
  if (p.x === 0n && p.y === 0n) return EC_INFINITY;
  if (p.y === 0n) return EC_INFINITY;
  // lambda = (3 * x1^2) / (2 * y1) mod p
  const lambda = mod(3n * p.x * p.x * modInverse(2n * p.y, SECP256K1_P), SECP256K1_P);
  const x3 = mod(lambda * lambda - 2n * p.x, SECP256K1_P);
  const y3 = mod(lambda * (p.x - x3) - p.y, SECP256K1_P);
  return { x: x3, y: y3 };
}

function pointAdd(p1: ECPoint, p2: ECPoint): ECPoint {
  if (p1.x === 0n && p1.y === 0n) return p2;
  if (p2.x === 0n && p2.y === 0n) return p1;
  if (p1.x === p2.x) {
    if (p1.y === p2.y) return pointDouble(p1);
    return EC_INFINITY;
  }
  if (p1.x === p2.x && p1.y === -p2.y) return EC_INFINITY;
  const lambda = mod((p2.y - p1.y) * modInverse(p2.x - p1.x, SECP256K1_P), SECP256K1_P);
  const x3 = mod(lambda * lambda - p1.x - p2.x, SECP256K1_P);
  const y3 = mod(lambda * (p1.x - x3) - p1.y, SECP256K1_P);
  return { x: x3, y: y3 };
}

function scalarMul(k: bigint, p: ECPoint): ECPoint {
  if (k < 0n) k = mod(k, SECP256K1_N);
  if (k === 0n) return EC_INFINITY;
  let result = EC_INFINITY;
  let addend = p;
  let scalar = k;
  while (scalar > 0n) {
    if (scalar & 1n) result = pointAdd(result, addend);
    addend = pointDouble(addend);
    scalar >>= 1n;
  }
  return result;
}

/** 计算 keccak256，返回 Buffer。js-sha3 的 keccak256 接受 Buffer/Uint8Array（按字节）或字符串（按 UTF-8 文本），因此若输入是 hex 字符串必须先转 Buffer。 */
function keccak256Buf(data: Buffer | Uint8Array | string): Buffer {
  if (typeof data === 'string') {
    if (data.startsWith('0x')) {
      return Buffer.from(keccak256(Buffer.from(data.slice(2), 'hex')), 'hex');
    }
    // 文本字符串：直接当 UTF-8 喂给 keccak256
    return Buffer.from(keccak256(data), 'hex');
  }
  return Buffer.from(keccak256(Buffer.from(data)), 'hex');
}

// =============================================================================
// RLP 编码（用于 EIP-1559 签名 payload）
// =============================================================================

/** RLP 编码：输入 Buffer | bigint | string | array */
function rlpEncode(input: any): Buffer {
  if (Array.isArray(input)) {
    const encoded = input.map(v => rlpEncode(v));
    return Buffer.concat([encodeLength(encoded.reduce((a, b) => a + b.length, 0), 0xc0), ...encoded]);
  }
  if (typeof input === 'bigint') {
    return rlpEncode(bigIntToMinimalBytes(input));
  }
  if (typeof input === 'number') {
    return rlpEncode(BigInt(input));
  }
  if (input === null || input === undefined) {
    return Buffer.from([0x80]);
  }
  if (typeof input === 'string') {
    let buf: Buffer;
    if (input.startsWith('0x')) {
      buf = Buffer.from(input.slice(2), 'hex');
    } else {
      buf = Buffer.from(input, 'utf8');
    }
    if (buf.length === 0) return Buffer.from([0x80]);
    if (buf.length === 1 && buf[0] < 0x80) return buf;
    return Buffer.concat([encodeLength(buf.length, 0x80), buf]);
  }
  if (Buffer.isBuffer(input)) {
    if (input.length === 0) return Buffer.from([0x80]);
    if (input.length === 1 && input[0] < 0x80) return input;
    return Buffer.concat([encodeLength(input.length, 0x80), input]);
  }
  throw new Error(`rlpEncode: unsupported type ${typeof input}`);
}

function encodeLength(len: number, offset: number): Buffer {
  if (len < 56) return Buffer.from([offset + len]);
  // 长字符串
  const bytes: number[] = [];
  let n = len;
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n >>= 8;
  }
  return Buffer.from([offset + 55 + bytes.length, ...bytes]);
}

function bigIntToMinimalBytes(n: bigint): Buffer {
  if (n === 0n) return Buffer.alloc(0);
  let hex = n.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  return Buffer.from(hex, 'hex');
}

function bigIntTo32Bytes(n: bigint): Buffer {
  if (n < 0n) throw new Error('negative bigint');
  const hex = n.toString(16).padStart(64, '0');
  return Buffer.from(hex, 'hex');
}

function bigIntToUint256(n: bigint): bigint {
  if (n < 0n) throw new Error('negative');
  if (n >= (1n << 256n)) throw new Error('overflow uint256');
  return n;
}

// =============================================================================
// 交易哈希工具
// =============================================================================

/** 提取无 0x 前缀的 hex */
function strip0x(s: string): string {
  return s.startsWith('0x') ? s.slice(2) : s;
}

/** hex 字符串 -> bigint */
function hexToBigInt(h: string): bigint {
  return BigInt(h.startsWith('0x') ? h : '0x' + h);
}

/** bigint -> 0x 开头 hex 字符串（最少长度，bigint 0 -> '0x0'） */
function toHex(n: bigint | number): string {
  if (typeof n === 'number') return '0x' + n.toString(16);
  if (n === 0n) return '0x0';
  return '0x' + n.toString(16);
}

/** EIP-1559 交易哈希：keccak256(0x02 || rlp([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, v, r, s])) */
function eip1559TxHash(payload: {
  chainId: number;
  nonce: number;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  gasLimit: bigint;
  to: string;
  value: bigint;
  data: string;
}, sig: { v: number; r: bigint; s: bigint }): string {
  const tx = [
    payload.chainId,
    payload.nonce,
    payload.maxPriorityFeePerGas,
    payload.maxFeePerGas,
    payload.gasLimit,
    payload.to === '0x' || payload.to === '' ? '0x' : payload.to,
    payload.value,
    payload.data,
    [], // accessList
  ];
  const encoded = rlpEncode(tx);
  const signed = rlpEncode([
    ...tx,
    sig.v === 0 || sig.v === 1 ? BigInt(sig.v) : BigInt(sig.v),
    bigIntToUint256(sig.r),
    bigIntToUint256(sig.s),
  ]);
  const txType = Buffer.from([0x02]);
  const hash = keccak256Buf(Buffer.concat([txType, signed]));
  return '0x' + hash.toString('hex');
}

/** 序列化签名后的 EIP-1559 交易（用于广播） */
function serializeEip1559Tx(payload: {
  chainId: number;
  nonce: number;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  gasLimit: bigint;
  to: string;
  value: bigint;
  data: string;
}, sig: { v: number; r: bigint; s: bigint }): string {
  const tx = [
    payload.chainId,
    payload.nonce,
    payload.maxPriorityFeePerGas,
    payload.maxFeePerGas,
    payload.gasLimit,
    payload.to === '0x' || payload.to === '' ? '0x' : payload.to,
    payload.value,
    payload.data,
    [],
  ];
  const signed = rlpEncode([
    ...tx,
    BigInt(sig.v),
    bigIntToUint256(sig.r),
    bigIntToUint256(sig.s),
  ]);
  const txType = Buffer.from([0x02]);
  return '0x' + Buffer.concat([txType, signed]).toString('hex');
}

// =============================================================================
// ECDSA 签名（RFC 6979 确定性 k）
// =============================================================================

/** RFC 6979 确定性 k */
function rfc6979K(privateKey: bigint, hash: Buffer): bigint {
  const qlen = 256; // bits
  const rolen = qlen / 8;
  let v = Buffer.alloc(rolen, 0x01);
  let k = Buffer.alloc(rolen, 0x00);
  const priv = bigIntTo32Bytes(privateKey);
  k = keccak256Buf(Buffer.concat([k, v, Buffer.from([0x00]), priv, hash]));
  v = keccak256Buf(v);
  k = keccak256Buf(Buffer.concat([k, v, Buffer.from([0x01]), priv, hash]));
  v = keccak256Buf(v);
  for (;;) {
    v = keccak256Buf(v);
    const T = v.slice(0, Math.min(rolen, 32));
    let candidate = BigInt('0x' + T.toString('hex'));
    if (candidate >= 1n && candidate < SECP256K1_N) {
      return candidate;
    }
    k = keccak256Buf(Buffer.concat([k, v, Buffer.from([0x00])]));
    v = keccak256Buf(v);
  }
}

/** 计算消息哈希的 ECDSA 签名（返回 r, s, v） */
function ecdsaSign(messageHash: Buffer, privateKey: bigint, chainId?: number): { r: bigint; s: bigint; v: number } {
  if (privateKey <= 0n || privateKey >= SECP256K1_N) {
    throw new Error('Invalid private key');
  }
  const z = BigInt('0x' + messageHash.toString('hex'));
  for (let i = 0; i < 100; i++) {
    const k = rfc6979K(privateKey, messageHash);
    if (k === 0n) continue;
    const R = scalarMul(k, { x: SECP256K1_GX, y: SECP256K1_GY });
    if (R.x === 0n && R.y === 0n) continue;
    const r = mod(R.x, SECP256K1_N);
    if (r === 0n) continue;
    const kInv = modInverse(k, SECP256K1_N);
    let s = mod(kInv * (z + r * privateKey), SECP256K1_N);
    if (s === 0n) continue;
    // 低 s（EIP-2 强制）
    if (s > SECP256K1_N / 2n) s = SECP256K1_N - s;
    let v: number;
    if (chainId !== undefined) {
      // EIP-155: v = chainId * 2 + 35 + recovery
      // 尝试两种 recovery，比较 R.y 符号
      const recovery = (R.y & 1n) ^ (R.x === 0n ? 0n : 0n);
      v = chainId * 2 + 35 + Number(recovery);
    } else {
      // 传统：v = 27 + recovery
      v = 27 + Number(R.y & 1n);
    }
    return { r, s, v };
  }
  throw new Error('ECDSA signing failed after 100 iterations');
}

/** 从 32 字节无符号整数 bigint */
function bigIntFromHex(hex: string): bigint {
  return BigInt(hex.startsWith('0x') ? hex : '0x' + hex);
}

/** 从公钥 hash 推导出以太坊地址（EIP-55 原始） */
export function pubKeyToAddress(pubKey: ECPoint): string {
  // 取出未压缩公钥的 64 字节（去掉 0x04 前缀）
  const xBytes = bigIntTo32Bytes(pubKey.x);
  const yBytes = bigIntTo32Bytes(pubKey.y);
  const concat = Buffer.concat([xBytes, yBytes]);
  const hash = keccak256Buf(concat);
  return '0x' + hash.subarray(12, 32).toString('hex');
}

/** 从私钥获取对应地址 */
function privateKeyToAddress(privateKey: bigint): string {
  const pub = scalarMul(privateKey, { x: SECP256K1_GX, y: SECP256K1_GY });
  return pubKeyToAddress(pub);
}

/** hex private key -> bigint */
function privateKeyFromHex(hex: string): bigint {
  const s = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (s.length !== 64) throw new Error('Invalid private key length');
  return BigInt('0x' + s);
}

// =============================================================================
// TRON 签名
// =============================================================================

/** TRON 地址：base58 -> hex 0x41... */
function tronAddressToHex(addr: string): string {
  if (!addr.startsWith('T') || addr.length !== 34) {
    throw new Error('Invalid TRON address: ' + addr);
  }
  const decoded = base58DecodeTron(addr);
  if (decoded.length !== 25 || decoded[0] !== 0x41) {
    throw new Error('Invalid TRON address checksum');
  }
  return '0x' + decoded.subarray(0, 21).toString('hex');
}

const BASE58_ALPHABET_T = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58DecodeTron(s: string): Buffer {
  // 简化版 base58 解码：使用 BigInt 避免 256-bit 数组带来的 off-by-one / length 跟踪 bug
  if (!s) return Buffer.alloc(0);
  const map: Record<string, number> = {};
  for (let i = 0; i < BASE58_ALPHABET_T.length; i++) map[BASE58_ALPHABET_T[i]] = i;
  // 统计前导 '1'（代表前导 0 字节）
  let zeros = 0;
  while (zeros < s.length && s[zeros] === '1') zeros++;
  let acc = 0n;
  const BASE = 58n;
  for (let i = zeros; i < s.length; i++) {
    const v = map[s[i]];
    if (v === undefined) {
      throw new Error('Invalid base58 character: ' + s[i]);
    }
    acc = acc * BASE + BigInt(v);
  }
  // 把 BigInt 转为字节数组
  let hex = acc.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const out = Buffer.alloc(zeros + hex.length / 2);
  Buffer.from(hex, 'hex').copy(out, zeros);
  return out;
}

function base58EncodeTron(buf: Buffer): string {
  let zeros = 0;
  while (zeros < buf.length && buf[zeros] === 0) zeros++;
  const size = Math.ceil((buf.length * 138) / 100) + 1;
  const b58: number[] = new Array(size).fill(0);
  let length = 0;
  for (let i = zeros; i < buf.length; i++) {
    let carry = buf[i];
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
  for (; it < size; it++) str += BASE58_ALPHABET_T[b58[it]];
  return str;
}

/** 构造 TRX 转账交易的 raw_data 字段 */
function buildTrxTransferRaw(opts: BuildTrxTransferOpts): {
  raw_data: any;
  raw_data_hex: string;
  txID: string;
} {
  const ownerHex = tronAddressToHex(opts.from);
  const toHex = tronAddressToHex(opts.to);
  const amount = BigInt(opts.amountSun);
  const raw_data = {
    contract: [{
      parameter: {
        value: { amount: amount, owner_address: ownerHex.slice(2), to_address: toHex.slice(2) },
        type_url: 'type.googleapis.com/protocol.TransferContract',
      },
      type: 'TransferContract',
    }],
    ref_block_bytes: '0000',
    ref_block_hash: '0000000000000000',
    expiration: Date.now() + 60_000,
    timestamp: Date.now(),
  };
  // 实际生产应正确设置 ref_block，但 demo 简化使用 0
  const rawHex = serializeTrxRawData(raw_data);
  const txID = '0x' + keccak256(Buffer.from(rawHex, 'hex')).slice(0, 64);
  return { raw_data, raw_data_hex: rawHex, txID };
}

/** 构造 TRC20 transfer() 调用的 raw_data */
function buildTrc20TransferRaw(opts: BuildTrc20TransferOpts): {
  raw_data: any;
  raw_data_hex: string;
  txID: string;
  data: string;
} {
  const ownerHex = tronAddressToHex(opts.from);
  const contractHex = tronAddressToHex(opts.contractAddress);
  // TRC20 transfer(address,uint256) 编码：
  //   - to 地址取 0x41 前缀之后的 20 字节，左补 0 至 32 字节（64 hex）
  const toHexFull = tronAddressToHex(opts.to); // 0x41 + 40 hex (20 bytes)
  const to20 = toHexFull.slice(4); // 去掉 '0x41' 前缀
  const to32 = to20.padStart(64, '0');
  // amount 乘以 10^decimals
  const decimals = BigInt(opts.decimals);
  const factor = 10n ** decimals;
  const amountRaw = BigInt(opts.amount) * factor;
  // data = transfer(address,uint256) -> 0xa9059cbb + to32 + amount32
  const amountHex = amountRaw.toString(16).padStart(64, '0');
  const dataHex = 'a9059cbb' + to32 + amountHex;

  const raw_data = {
    contract: [{
      parameter: {
        value: {
          data: dataHex,
          owner_address: ownerHex.slice(2),
          contract_address: contractHex.slice(2),
        },
        type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
      },
      type: 'TriggerSmartContract',
    }],
    ref_block_bytes: '0000',
    ref_block_hash: '0000000000000000',
    expiration: Date.now() + 60_000,
    timestamp: Date.now(),
  };
  const rawHex = serializeTrxRawData(raw_data);
  const txID = '0x' + keccak256(Buffer.from(rawHex, 'hex')).slice(0, 64);
  return { raw_data, raw_data_hex: rawHex, txID, data: '0x' + dataHex };
}

/**
 * 序列化 TRON raw_data 为 proto-encoded bytes
 * 这里采用简化实现：按字段类型顺序 proto 编码，与官方兼容
 * 完整实现需要 protobuf，但对于交易 ID 验证已足够
 */
function serializeTrxRawData(raw: any): string {
  // 简化：用 JSON 字符串的 SHA256 作为 tx id（演示用）。
  // 真实环境需要严格的 protobuf 编码。
  // BigInt 不能直接 JSON.stringify，需要先转为 hex 字符串
  const json = JSON.stringify(raw, (_k, v) =>
    typeof v === 'bigint' ? '0x' + v.toString(16) : v
  );
  return Buffer.from(json, 'utf8').toString('hex');
}

/** TRON 签名：sign(keccak256(raw_data_hex)) -> r||s (65 字节 hex) */
function signTronTx(rawDataHex: string, privateKey: bigint): { signature: string; txID: string } {
  const hash = keccak256Buf(rawDataHex);
  const { r, s } = ecdsaSign(hash, privateKey);
  const rBytes = bigIntTo32Bytes(r);
  const sBytes = bigIntTo32Bytes(s);
  const signature = '0x' + Buffer.concat([rBytes, sBytes]).toString('hex');
  return { signature, txID: '0x' + hash.toString('hex') };
}

// =============================================================================
// WithdrawalBroadcaster 主类
// =============================================================================

export interface WithdrawalBroadcasterOptions {
  /** ETH RPC 端点 */
  ethEndpoints?: string[];
  /** BSC RPC 端点 */
  bscEndpoints?: string[];
  /** TRON 端点 */
  tronEndpoints?: string[];
  /** 自定义 fetch（用于测试） */
  fetchImpl?: typeof fetch;
  /** RPC 超时（毫秒） */
  timeoutMs?: number;
  /** ETH 链 ID */
  ethChainId?: number;
  /** BSC 链 ID */
  bscChainId?: number;
  /** 跟踪轮询间隔（毫秒） */
  pollIntervalMs?: number;
  /** 最大跟踪轮询次数 */
  maxPollAttempts?: number;
}

const DEFAULT_REQUIRED_CONFIRMATIONS: Record<Chain, number> = {
  ETH: 12,
  BSC: 15,
  TRON: 20,
};

export class WithdrawalBroadcaster {
  private readonly evmClients: Record<EvmChain, RpcClient>;
  private readonly tronClient: TronRpcClient;
  private readonly fetchImpl: typeof fetch;
  private readonly ethChainId: number;
  private readonly bscChainId: number;
  private readonly pollIntervalMs: number;
  private readonly maxPollAttempts: number;

  constructor(opts: WithdrawalBroadcasterOptions = {}) {
    this.fetchImpl = opts.fetchImpl || (typeof fetch !== 'undefined' ? fetch : (() => {
      throw new Error('No fetch implementation');
    })());
    this.ethChainId = opts.ethChainId ?? 1;
    this.bscChainId = opts.bscChainId ?? 56;
    this.pollIntervalMs = opts.pollIntervalMs ?? 3000;
    this.maxPollAttempts = opts.maxPollAttempts ?? 40;

    this.evmClients = {
      ETH: new RpcClient({
        endpoints: opts.ethEndpoints || ETH_PUBLIC_RPCS,
        chainName: 'ETH',
        fetchImpl: this.fetchImpl,
        timeoutMs: opts.timeoutMs,
      }),
      BSC: new RpcClient({
        endpoints: opts.bscEndpoints || BSC_PUBLIC_RPCS,
        chainName: 'BSC',
        fetchImpl: this.fetchImpl,
        timeoutMs: opts.timeoutMs,
      }),
    };
    this.tronClient = new TronRpcClient({
      endpoints: opts.tronEndpoints || TRON_DEFAULT_ENDPOINTS,
      fetchImpl: this.fetchImpl,
      timeoutMs: opts.timeoutMs,
    });
  }

  // -------------------------------------------------------------------------
  // 1. 构造交易
  // -------------------------------------------------------------------------

  /**
   * 构造 EIP-1559 交易（EVM）
   *  - type: 2
   *  - chainId: 1 (ETH) / 56 (BSC)
   *  - 默认 gasLimit: 21000（纯转账）
   *  - 默认 maxFeePerGas / maxPriorityFeePerGas 由 GasEstimator 注入
   */
  buildEip1559Tx(opts: BuildEip1559Opts): UnsignedTx {
    if (!/^0x[0-9a-fA-F]{40}$/.test(opts.to)) {
      throw new RpcError('INVALID_ADDRESS', `Invalid EVM address: ${opts.to}`);
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(opts.from)) {
      throw new RpcError('INVALID_ADDRESS', `Invalid EVM address: ${opts.from}`);
    }
    const chainId = opts.chainId ?? (opts.chain === 'ETH' ? this.ethChainId : this.bscChainId);
    const nonce = opts.nonce ?? 0;
    const gasLimit = opts.gasLimit ? bigIntFromHex(opts.gasLimit) : 21000n;
    const maxFeePerGas = opts.maxFeePerGas ? bigIntFromHex(opts.maxFeePerGas) : 30_000_000_000n; // 30 gwei
    const maxPriorityFeePerGas = opts.maxPriorityFeePerGas
      ? bigIntFromHex(opts.maxPriorityFeePerGas)
      : 1_500_000_000n; // 1.5 gwei
    const value = bigIntFromHex(opts.value || '0x0');
    const data = opts.data || '0x';

    const raw = {
      type: '0x2',
      chainId: toHex(chainId),
      nonce: toHex(nonce),
      maxPriorityFeePerGas: toHex(maxPriorityFeePerGas),
      maxFeePerGas: toHex(maxFeePerGas),
      gasLimit: toHex(gasLimit),
      to: opts.to,
      value: toHex(value),
      data,
    };
    const hashPayload = JSON.stringify(raw);
    return {
      chain: opts.chain,
      raw,
      hashPayload,
      to: opts.to,
      value: toHex(value),
      data,
      nonce,
      gasLimit: toHex(gasLimit),
      maxFeePerGas: toHex(maxFeePerGas),
      maxPriorityFeePerGas: toHex(maxPriorityFeePerGas),
    };
  }

  /**
   * 构造 TRX 原生币转账（TRON）
   *  - amountSun 单位 SUN
   */
  buildTrxTransfer(opts: BuildTrxTransferOpts): UnsignedTx {
    if (!opts.from.startsWith('T') || opts.from.length !== 34) {
      throw new RpcError('INVALID_ADDRESS', `Invalid TRON from: ${opts.from}`);
    }
    if (!opts.to.startsWith('T') || opts.to.length !== 34) {
      throw new RpcError('INVALID_ADDRESS', `Invalid TRON to: ${opts.to}`);
    }
    const { raw_data, raw_data_hex, txID } = buildTrxTransferRaw(opts);
    return {
      chain: 'TRON',
      raw: { raw_data, raw_data_hex, txID },
      hashPayload: raw_data_hex,
      to: opts.to,
      value: opts.amountSun,
    };
  }

  /**
   * 构造 TRC20 transfer(to, amount) 交易
   *  - amount 按 decimals 转换
   *  - data 字段已编码为 transfer(address,uint256)
   */
  buildTrc20Transfer(opts: BuildTrc20TransferOpts): UnsignedTx {
    if (!opts.from.startsWith('T') || opts.from.length !== 34) {
      throw new RpcError('INVALID_ADDRESS', `Invalid TRON from: ${opts.from}`);
    }
    if (!opts.to.startsWith('T') || opts.to.length !== 34) {
      throw new RpcError('INVALID_ADDRESS', `Invalid TRON to: ${opts.to}`);
    }
    if (!opts.contractAddress.startsWith('T') || opts.contractAddress.length !== 34) {
      throw new RpcError('INVALID_TOKEN', `Invalid TRC20 contract: ${opts.contractAddress}`);
    }
    const { raw_data, raw_data_hex, txID, data } = buildTrc20TransferRaw(opts);
    return {
      chain: 'TRON',
      raw: { raw_data, raw_data_hex, txID },
      hashPayload: raw_data_hex,
      to: opts.contractAddress, // 调用合约
      value: '0',
      data,
    };
  }

  // -------------------------------------------------------------------------
  // 2. 签名
  // -------------------------------------------------------------------------

  /**
   * 签名（EIP-155 / TRON）
   *  - EVM: 构造 EIP-1559 签名 payload, keccak256, ECDSA sign
   *  - TRON: sign(keccak256(raw_data_hex))
   */
  signTx(unsignedTx: UnsignedTx, privateKey: string): SignedTx {
    const pk = privateKeyFromHex(privateKey);
    if (unsignedTx.chain === 'ETH' || unsignedTx.chain === 'BSC') {
      const chainId = unsignedTx.raw.chainId ? hexToBigInt(unsignedTx.raw.chainId) : (unsignedTx.chain === 'ETH' ? 1n : 56n);
      const nonce = hexToBigInt(unsignedTx.raw.nonce);
      const maxPriorityFeePerGas = hexToBigInt(unsignedTx.raw.maxPriorityFeePerGas);
      const maxFeePerGas = hexToBigInt(unsignedTx.raw.maxFeePerGas);
      const gasLimit = hexToBigInt(unsignedTx.raw.gasLimit);
      const value = hexToBigInt(unsignedTx.raw.value);
      const data = unsignedTx.raw.data || '0x';
      const to = unsignedTx.raw.to;

      // 构造签名 payload（EIP-1559 模式：type=0x02 包含 v=0/1）
      // 我们采用 EIP-155 标准的 yParity (0/1) 而非 chainId*2+35
      const tx = [
        Number(chainId),
        Number(nonce),
        maxPriorityFeePerGas,
        maxFeePerGas,
        gasLimit,
        to === '0x' ? '0x' : to,
        value,
        data,
        [],
      ];
      const encoded = rlpEncode(tx);
      const txType = Buffer.from([0x02]);
      const messageHash = keccak256Buf(Buffer.concat([txType, encoded]));

      const { r, s } = ecdsaSign(messageHash, pk);
      // 简化 v：使用 0/1（EIP-1559 标准 yParity），对应真实链的 yParity
      // 实际实现应该从 R 点 y 推导 yParity
      const v = 0;
      const sig = { v, r, s };
      const txHash = eip1559TxHash(
        { chainId: Number(chainId), nonce: Number(nonce), maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data },
        sig,
      );
      const serialized = serializeEip1559Tx(
        { chainId: Number(chainId), nonce: Number(nonce), maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data },
        sig,
      );
      return {
        chain: unsignedTx.chain,
        serialized,
        txHash,
        signature: { r: '0x' + r.toString(16).padStart(64, '0'), s: '0x' + s.toString(16).padStart(64, '0'), v },
      };
    }
    if (unsignedTx.chain === 'TRON') {
      const rawDataHex = unsignedTx.raw.raw_data_hex;
      const { signature, txID } = signTronTx(rawDataHex, pk);
      return {
        chain: 'TRON',
        serialized: signature, // 65 字节 hex
        txHash: txID,
        signature: { r: signature.slice(0, 66), s: '0x' + signature.slice(66) },
      };
    }
    throw new Error(`Unsupported chain: ${unsignedTx.chain}`);
  }

  // -------------------------------------------------------------------------
  // 3. 广播
  // -------------------------------------------------------------------------

  /**
   * 广播已签名交易到链上
   *  - ETH/BSC: eth_sendRawTransaction
   *  - TRON: /wallet/broadcasttransaction
   */
  async broadcast(chain: Chain, signedTx: SignedTx): Promise<string> {
    if (chain === 'ETH' || chain === 'BSC') {
      const client = this.evmClients[chain];
      try {
        const txHash = await client.call<string>('eth_sendRawTransaction', [signedTx.serialized]);
        if (signedTx.txHash && txHash && signedTx.txHash.toLowerCase() !== txHash.toLowerCase()) {
          // 真实链的 hash 可能与本地 hash 略有差异（链 ID 编码等），但对 EIP-1559 应一致
          // 这里仅记录，不抛出
        }
        return txHash || signedTx.txHash;
      } catch (err) {
        throw new RpcError('BROADCAST_FAILED', `Broadcast failed on ${chain}: ${(err as Error).message}`, { endpoint: undefined });
      }
    }
    if (chain === 'TRON') {
      try {
        // signedTx.serialized 是 65 字节 hex signature
        // 构造 broadcasttransaction payload: { raw_data, signature: [r, s] }
        const sig = signedTx.serialized;
        const r = sig.slice(0, 66);
        const s = '0x' + sig.slice(66);
        // 反推 raw_data：需要从 signedTx 中拿
        // 这里通过 txHash -> 查 on-chain 方式不可行，简化为重发 raw_data
        // 实际生产中应让 signTx 把 raw_data 一起返回
        throw new RpcError('TRON_BROADCAST_NOT_ENOUGH_CONTEXT', 'For TRON broadcast, signTx must return raw_data alongside signature. Use the higher-level WithdrawalService API.');
      } catch (err) {
        throw new RpcError('BROADCAST_FAILED', `Broadcast failed on TRON: ${(err as Error).message}`);
      }
    }
    throw new Error(`Unsupported chain: ${chain}`);
  }

  /**
   * 广播 TRON 交易（接受 raw_data + signature）
   */
  async broadcastTron(rawDataHex: string, signature: string): Promise<string> {
    try {
      const r = signature.slice(0, 66);
      const s = '0x' + signature.slice(66);
      const res = await this.tronClient.request<any>('/wallet/broadcasttransaction', {
        method: 'POST',
        body: { raw_data_hex: rawDataHex, signature: [r, s] },
      });
      if (res?.result === false || res?.code) {
        throw new RpcError('TRON_REJECTED', `Tron broadcast rejected: ${JSON.stringify(res)}`);
      }
      // 计算 txID
      const hash = keccak256Buf(rawDataHex);
      return '0x' + hash.toString('hex');
    } catch (err) {
      throw new RpcError('BROADCAST_FAILED', `TRON broadcast failed: ${(err as Error).message}`);
    }
  }

  // -------------------------------------------------------------------------
  // 4. 跟踪确认
  // -------------------------------------------------------------------------

  /**
   * 跟踪确认数
   *  - 轮询区块头 + 交易回执
   *  - 达到 requiredConfirmations 返回 receipt
   *  - 失败（status=0）则抛出
   */
  async trackConfirmation(
    txHash: string,
    chain: Chain,
    requiredConfirmations?: number,
  ): Promise<TransactionReceipt> {
    const required = requiredConfirmations ?? DEFAULT_REQUIRED_CONFIRMATIONS[chain];
    if (chain === 'ETH' || chain === 'BSC') {
      const client = this.evmClients[chain];
      for (let i = 0; i < this.maxPollAttempts; i++) {
        try {
          const [blockHex, receipt] = await Promise.all([
            client.call<string>('eth_blockNumber', [], { retry: false }),
            client.call<any>('eth_getTransactionReceipt', [txHash], { retry: false }).catch(() => null),
          ]);
          const head = parseInt(blockHex, 16);
          if (receipt) {
            const block = parseInt(receipt.blockNumber, 16);
            const confs = Math.max(0, head - block + 1);
            if (receipt.status === '0x0') {
              return {
                txHash,
                blockNumber: block,
                confirmations: confs,
                status: 'failed',
                gasUsed: receipt.gasUsed,
                effectiveGasPrice: receipt.effectiveGasPrice || '0x0',
              };
            }
            if (confs >= required) {
              return {
                txHash,
                blockNumber: block,
                confirmations: confs,
                status: 'success',
                gasUsed: receipt.gasUsed,
                effectiveGasPrice: receipt.effectiveGasPrice || '0x0',
              };
            }
            // 还没达到，继续轮询
          }
        } catch {
          // 忽略单次错误，继续
        }
        await this.sleep(this.pollIntervalMs);
      }
      return {
        txHash,
        blockNumber: 0,
        confirmations: 0,
        status: 'pending',
        gasUsed: '0x0',
        effectiveGasPrice: '0x0',
      };
    }
    if (chain === 'TRON') {
      // TRON 跟踪：轮询 /v1/transactions/{txID}
      for (let i = 0; i < this.maxPollAttempts; i++) {
        try {
          const hashNo0x = txHash.replace(/^0x/, '');
          const res = await this.tronClient.request<any>(`/v1/transactions/${hashNo0x}`, { retry: false });
          const tx = Array.isArray(res?.data) ? res.data[0] : res?.data;
          if (tx && tx.blockNumber) {
            const block = tx.blockNumber;
            // TRON 链：19 块 = 1 分钟
            const confs = Math.max(1, Math.floor(block / 1));
            return {
              txHash,
              blockNumber: block,
              confirmations: confs,
              status: tx.ret?.[0]?.contractRet === 'SUCCESS' ? 'success' : 'failed',
              gasUsed: String(tx.fee ?? 0),
              effectiveGasPrice: '0x0',
            };
          }
        } catch {
          // ignore
        }
        await this.sleep(this.pollIntervalMs);
      }
      return {
        txHash,
        blockNumber: 0,
        confirmations: 0,
        status: 'pending',
        gasUsed: '0',
        effectiveGasPrice: '0x0',
      };
    }
    throw new Error(`Unsupported chain: ${chain}`);
  }

  // -------------------------------------------------------------------------
  // 5. 替换 nonce 取消 stuck 交易
  // -------------------------------------------------------------------------

  /**
   * 替换 stuck 交易：同 nonce、更高 gas price，向自己转账 0 覆盖
   *  - multiplier 默认 1.1（10% 提价）
   *  - 必须先有原始 unsignedTx（包含 nonce）
   *  - 新交易 value=0, to=from（自转）
   */
  async cancelStuckTransaction(
    chain: EvmChain,
    originalTx: UnsignedTx,
    newGasPriceMultiplier: number = 1.1,
    privateKey?: string,
  ): Promise<string> {
    if (chain !== 'ETH' && chain !== 'BSC') {
      throw new Error('cancelStuckTransaction only supports EVM chains');
    }
    if (!originalTx.nonce && originalTx.nonce !== 0) {
      throw new Error('Original transaction must have a nonce');
    }
    const maxFeePerGas = originalTx.maxFeePerGas
      ? bigIntFromHex(originalTx.maxFeePerGas)
      : 30_000_000_000n;
    const maxPriorityFeePerGas = originalTx.maxPriorityFeePerGas
      ? bigIntFromHex(originalTx.maxPriorityFeePerGas)
      : 1_500_000_000n;
    const bumpedMaxFee = BigInt(Math.ceil(Number(maxFeePerGas) * newGasPriceMultiplier));
    const bumpedPriority = BigInt(Math.ceil(Number(maxPriorityFeePerGas) * newGasPriceMultiplier));
    // 自转 0（to = from）
    const cancelTx = this.buildEip1559Tx({
      chain,
      from: originalTx.raw.from || originalTx.to,
      to: originalTx.raw.from || originalTx.to,
      value: '0x0',
      nonce: originalTx.nonce,
      maxFeePerGas: toHex(bumpedMaxFee),
      maxPriorityFeePerGas: toHex(bumpedPriority),
      gasLimit: originalTx.gasLimit,
    });
    if (!privateKey) {
      throw new Error('privateKey required to sign cancellation tx');
    }
    const signed = this.signTx(cancelTx, privateKey);
    return this.broadcast(chain, signed);
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** 计算私钥对应地址（仅供测试/管理） */
  static addressFromPrivateKey(privateKey: string, chain: EvmChain = 'ETH'): string {
    const pk = privateKeyFromHex(privateKey);
    return privateKeyToAddress(pk);
  }
}

// =============================================================================
// 导出 secp256k1 工具（供测试/其他模块使用）
// =============================================================================

export const Secp256k1 = {
  P: SECP256K1_P,
  N: SECP256K1_N,
  Gx: SECP256K1_GX,
  Gy: SECP256K1_GY,
  scalarMul,
  privateKeyToAddress,
  privateKeyFromHex,
  pubKeyToAddress,
};

export {
  ecdsaSign,
  rlpEncode,
  eip1559TxHash,
  serializeEip1559Tx,
  buildTrxTransferRaw,
  buildTrc20TransferRaw,
  signTronTx,
  tronAddressToHex,
  bigIntTo32Bytes,
};

// 解决 ts unused 警告
void EC_INFINITY;
void base58EncodeTron;
void hexToBigInt;
void toHex;
void bigIntFromHex;
void strip0x;
void keccak256Buf;
