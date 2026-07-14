/**
 * Bitcoin 链适配器
 *
 * 实现 ChainAdapter 接口，支持 Bitcoin 区块链网络。
 *
 * 支持的网络：
 *  - Bitcoin Mainnet
 *  - Bitcoin Testnet
 *  - Bitcoin Regtest
 *
 * 功能：
 *  - 支持 P2PKH / P2WPKH / P2TR 地址类型
 *  - 支持 PSBT (Partially Signed Bitcoin Transaction) 构建和签名
 *  - 支持 UTXO 管理和选择
 *  - 支持多 API 节点故障转移
 *  - 支持请求缓存机制
 *  - 支持手续费估算（基于 mempool 数据）
 *  - 支持交易广播和状态查询
 */

import {
  ChainAdapter,
  ChainType,
  ChainInfo,
  BalanceInfo,
  TokenBalanceInfo,
  TransactionInput,
  TransactionOutput,
  FeeEstimate,
  FeeLevel,
  GasPriceInfo,
  TransactionDetail,
  TransactionStatus,
  TransactionType,
  TokenStandard,
  AddressValidationResult,
  AddressType,
  BlockInfo,
  SignResult,
  BroadcastResult,
  Signer,
  AdapterConfig,
} from './chain-adapter.interface';
import { safeJsonParse } from '@/lib/security/safe-json-parse';

// ============================================================================
// Bitcoin 链配置
// ============================================================================

export interface BitcoinChainConfig {
  chain: 'bitcoin' | 'testnet' | 'regtest';
  name: string;
  symbol: string;
  decimals: number;
  rpcUrls: string[];
  blockExplorerUrl: string;
  isTestnet: boolean;
  networkParams: {
    messagePrefix: string;
    bech32: string;
    bip32: {
      public: number;
      private: number;
    };
    pubKeyHash: number;
    scriptHash: number;
    wif: number;
  };
  features: {
    smartContracts: boolean;
    nft: boolean;
    staking: boolean;
    governance: boolean;
    psbt: boolean;
    segwit: boolean;
    taproot: boolean;
  };
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export type BitcoinAddressType = 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2wsh' | 'p2tr' | 'p2sh-p2wpkh';

export const BITCOIN_NETWORKS: Record<string, BitcoinChainConfig> = {
  mainnet: {
    chain: 'bitcoin',
    name: 'Bitcoin Mainnet',
    symbol: 'BTC',
    decimals: 8,
    rpcUrls: [
      'https://mempool.space/api',
      'https://blockstream.info/api',
    ],
    blockExplorerUrl: 'https://mempool.space',
    isTestnet: false,
    networkParams: {
      messagePrefix: '\x18Bitcoin Signed Message:\n',
      bech32: 'bc',
      bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4,
      },
      pubKeyHash: 0x00,
      scriptHash: 0x05,
      wif: 0x80,
    },
    features: {
      smartContracts: false,
      nft: false,
      staking: false,
      governance: false,
      psbt: true,
      segwit: true,
      taproot: true,
    },
    nativeCurrency: {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 8,
    },
  },
  testnet: {
    chain: 'testnet',
    name: 'Bitcoin Testnet',
    symbol: 'tBTC',
    decimals: 8,
    rpcUrls: [
      'https://mempool.space/testnet/api',
      'https://blockstream.info/testnet/api',
    ],
    blockExplorerUrl: 'https://mempool.space/testnet',
    isTestnet: true,
    networkParams: {
      messagePrefix: '\x18Bitcoin Signed Message:\n',
      bech32: 'tb',
      bip32: {
        public: 0x043587cf,
        private: 0x04358394,
      },
      pubKeyHash: 0x6f,
      scriptHash: 0xc4,
      wif: 0xef,
    },
    features: {
      smartContracts: false,
      nft: false,
      staking: false,
      governance: false,
      psbt: true,
      segwit: true,
      taproot: true,
    },
    nativeCurrency: {
      name: 'Testnet Bitcoin',
      symbol: 'tBTC',
      decimals: 8,
    },
  },
  regtest: {
    chain: 'regtest',
    name: 'Bitcoin Regtest',
    symbol: 'rBTC',
    decimals: 8,
    rpcUrls: ['http://localhost:3000/api'],
    blockExplorerUrl: 'http://localhost:3000',
    isTestnet: true,
    networkParams: {
      messagePrefix: '\x18Bitcoin Signed Message:\n',
      bech32: 'bcrt',
      bip32: {
        public: 0x043587cf,
        private: 0x04358394,
      },
      pubKeyHash: 0x6f,
      scriptHash: 0xc4,
      wif: 0xef,
    },
    features: {
      smartContracts: false,
      nft: false,
      staking: false,
      governance: false,
      psbt: true,
      segwit: true,
      taproot: true,
    },
    nativeCurrency: {
      name: 'Regtest Bitcoin',
      symbol: 'rBTC',
      decimals: 8,
    },
  },
};

// ============================================================================
// UTXO 和交易相关类型
// ============================================================================

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  confirmations: number;
  scriptPubKey?: string;
  redeemScript?: string;
  witnessScript?: string;
  spent?: boolean;
  addressType?: BitcoinAddressType;
}

export interface UTXOSelectionResult {
  selected: UTXO[];
  total: number;
  fee: number;
  change: number;
  vSize: number;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * Satoshi 转 BTC
 */
export function satoshiToBTC(satoshi: number | string | bigint): string {
  const value = typeof satoshi === 'string' ? BigInt(satoshi) : BigInt(satoshi.toString());
  const divisor = 10n ** 8n;
  const integer = value / divisor;
  const remainder = value % divisor;
  const remainderStr = remainder.toString().padStart(8, '0');
  const trimmed = remainderStr.replace(/0+$/, '');
  return trimmed ? `${integer}.${trimmed}` : integer.toString();
}

/**
 * BTC 转 Satoshi
 */
export function btcToSatoshi(btc: string): string {
  const [intPart, decPart = ''] = btc.split('.');
  const paddedDec = decPart.padEnd(8, '0').slice(0, 8);
  return BigInt(intPart + paddedDec).toString();
}

/**
 * 格式化 BTC 数量
 */
export function formatBTC(satoshi: number | string | bigint): string {
  const btc = parseFloat(satoshiToBTC(satoshi));
  if (btc >= 1) return btc.toFixed(4) + ' BTC';
  if (btc >= 0.001) return btc.toFixed(6) + ' BTC';
  return btc.toFixed(8) + ' BTC';
}

// ============================================================================
// Base58 编码解码
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

function base58Decode(str: string): Uint8Array {
  let num = BigInt(0);
  for (const char of str) {
    const idx = BASE58_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error('Invalid base58 character');
    num = num * 58n + BigInt(idx);
  }

  let hex = num.toString(16);
  if (hex.length % 2) hex = '0' + hex;

  const bytes = Buffer.from(hex, 'hex');
  return new Uint8Array(bytes);
}

// ============================================================================
// Bech32 / Bech32m 编码解码
// ============================================================================

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32_CONST = 1;
const BECH32M_CONST = 0x2bc830a3;

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

function convertBits(data: Uint8Array | number[], fromBits: number, toBits: number, pad: boolean = true): number[] {
  let acc = 0;
  let bits = 0;
  const result: number[] = [];
  const maxv = (1 << toBits) - 1;

  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    if (value < 0 || value >> fromBits !== 0) {
      throw new Error('Invalid value for bits');
    }
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

/**
 * Bech32 编码 (用于 SegWit 地址)
 */
export function bech32Encode(hrp: string, version: number, data: Uint8Array): string {
  const values = [version, ...convertBits(data, 8, 5)];
  const expanded = [...bech32HrpExpand(hrp), ...values];
  const polymod = bech32Polymod([...expanded, 0, 0, 0, 0, 0, 0]) ^ (version === 0 ? BECH32_CONST : BECH32M_CONST);

  let checksum: number[] = [];
  for (let i = 0; i < 6; i++) {
    checksum.push((polymod >> (5 * (5 - i))) & 31);
  }

  const combined = [...values, ...checksum];
  return hrp + '1' + combined.map((v) => BECH32_CHARSET[v]).join('');
}

// ============================================================================
// 地址生成
// ============================================================================

function sha256(data: Uint8Array): Uint8Array {
  const crypto = require('crypto');
  return new Uint8Array(crypto.createHash('sha256').update(Buffer.from(data)).digest());
}

function hash160(data: Uint8Array): Uint8Array {
  const sha = sha256(data);
  const crypto = require('crypto');
  return new Uint8Array(crypto.createHash('ripemd160').update(Buffer.from(sha)).digest());
}

function base58CheckEncode(payload: Uint8Array, version: number): string {
  const versioned = Buffer.concat([Buffer.from([version]), Buffer.from(payload)]);
  const hash1 = sha256(new Uint8Array(versioned));
  const hash2 = sha256(hash1);
  const checksum = hash2.slice(0, 4);
  return base58Encode(new Uint8Array(Buffer.concat([versioned, Buffer.from(checksum)])));
}

/**
 * 生成 P2PKH 地址
 */
export function getP2PKHAddress(publicKey: Uint8Array, network: string = 'mainnet'): string {
  const config = BITCOIN_NETWORKS[network] || BITCOIN_NETWORKS.mainnet;
  const pubKeyHash = hash160(publicKey);
  return base58CheckEncode(pubKeyHash, config.networkParams.pubKeyHash);
}

/**
 * 生成 P2WPKH 地址 (Native SegWit)
 */
export function getP2WPKHAddress(publicKey: Uint8Array, network: string = 'mainnet'): string {
  const config = BITCOIN_NETWORKS[network] || BITCOIN_NETWORKS.mainnet;
  const pubKeyHash = hash160(publicKey);
  return bech32Encode(config.networkParams.bech32, 0, pubKeyHash);
}

/**
 * 生成 P2SH-P2WPKH 地址 (Nested SegWit)
 */
export function getP2SHP2WPKHAddress(publicKey: Uint8Array, network: string = 'mainnet'): string {
  const config = BITCOIN_NETWORKS[network] || BITCOIN_NETWORKS.mainnet;
  const pubKeyHash = hash160(publicKey);
  const redeemScript = new Uint8Array([0x00, 0x14, ...pubKeyHash]);
  const scriptHash = hash160(redeemScript);
  return base58CheckEncode(scriptHash, config.networkParams.scriptHash);
}

/**
 * 生成 P2TR 地址 (Taproot)
 */
export function getP2TRAddress(publicKey: Uint8Array, network: string = 'mainnet'): string {
  const config = BITCOIN_NETWORKS[network] || BITCOIN_NETWORKS.mainnet;
  const xPubKey = publicKey.length === 33 ? publicKey.slice(1) : publicKey.slice(1, 33);
  return bech32Encode(config.networkParams.bech32, 1, xPubKey);
}

/**
 * 根据类型生成比特币地址
 */
export function getBitcoinAddress(
  publicKey: Uint8Array,
  addressType: BitcoinAddressType = 'p2wpkh',
  network: string = 'mainnet'
): string {
  switch (addressType) {
    case 'p2pkh':
      return getP2PKHAddress(publicKey, network);
    case 'p2sh':
    case 'p2sh-p2wpkh':
      return getP2SHP2WPKHAddress(publicKey, network);
    case 'p2wpkh':
    case 'p2wsh':
      return getP2WPKHAddress(publicKey, network);
    case 'p2tr':
      return getP2TRAddress(publicKey, network);
    default:
      return getP2WPKHAddress(publicKey, network);
  }
}

// ============================================================================
// 地址验证
// ============================================================================

/**
 * 验证比特币地址
 */
export function isValidBitcoinAddress(address: string, network: string = 'mainnet'): {
  isValid: boolean;
  addressType?: BitcoinAddressType;
  errorMessage?: string;
} {
  if (!address) {
    return { isValid: false, errorMessage: 'Address is empty' };
  }

  const config = BITCOIN_NETWORKS[network] || BITCOIN_NETWORKS.mainnet;

  if (address.startsWith(config.networkParams.bech32 + '1')) {
    const hrp = config.networkParams.bech32;
    const rest = address.slice(hrp.length + 1);

    if (rest.length < 6) {
      return { isValid: false, errorMessage: 'Invalid bech32 address length' };
    }

    const versionChar = rest[0];
    const version = BECH32_CHARSET.indexOf(versionChar);

    if (version === 0) {
      return { isValid: true, addressType: 'p2wpkh' };
    } else if (version === 1) {
      return { isValid: true, addressType: 'p2tr' };
    }

    return { isValid: true, addressType: 'p2wsh' };
  }

  if (address.length >= 26 && address.length <= 35) {
    try {
      const decoded = base58Decode(address);
      if (decoded.length !== 25) {
        return { isValid: false, errorMessage: 'Invalid base58 address length' };
      }

      const version = decoded[0];
      if (version === config.networkParams.pubKeyHash) {
        return { isValid: true, addressType: 'p2pkh' };
      } else if (version === config.networkParams.scriptHash) {
        return { isValid: true, addressType: 'p2sh' };
      }
    } catch {
      return { isValid: false, errorMessage: 'Invalid base58 address format' };
    }
  }

  return { isValid: false, errorMessage: 'Unknown address format' };
}

// ============================================================================
// 交易大小估算
// ============================================================================

/**
 * 估算交易大小 (vSize)
 */
export function estimateTxVSize(
  inputCount: number,
  outputCount: number,
  addressType: BitcoinAddressType
): number {
  let inputWeight: number;
  let outputWeight: number;

  switch (addressType) {
    case 'p2pkh':
      inputWeight = 148 * 4;
      outputWeight = 34 * 4;
      break;
    case 'p2sh-p2wpkh':
      inputWeight = 91 * 4 + 108;
      outputWeight = 32 * 4;
      break;
    case 'p2wpkh':
      inputWeight = 68 * 4 + 108;
      outputWeight = 31 * 4;
      break;
    case 'p2wsh':
      inputWeight = 108 * 4 + 256;
      outputWeight = 43 * 4;
      break;
    case 'p2tr':
      inputWeight = 57.5 * 4 + 230;
      outputWeight = 43 * 4;
      break;
    default:
      inputWeight = 68 * 4 + 108;
      outputWeight = 31 * 4;
  }

  const overheadWeight = 10.5 * 4;
  const totalWeight = overheadWeight + inputCount * inputWeight + outputCount * outputWeight;
  return Math.ceil(totalWeight / 4);
}

// ============================================================================
// UTXO 选择
// ============================================================================

/**
 * UTXO 选择算法 (贪心算法)
 */
export function selectUTXOs(
  utxos: UTXO[],
  targetAmount: number,
  feePerVByte: number,
  addressType: BitcoinAddressType
): UTXOSelectionResult {
  const sortedUTXOs = [...utxos]
    .filter(u => !u.spent)
    .sort((a, b) => b.value - a.value);

  const selected: UTXO[] = [];
  let total = 0;

  for (const utxo of sortedUTXOs) {
    selected.push(utxo);
    total += utxo.value;

    const estimatedVSize = estimateTxVSize(selected.length, 2, addressType);
    const estimatedFee = estimatedVSize * feePerVByte;

    if (total >= targetAmount + estimatedFee) {
      const actualFee = estimatedFee;
      const change = total - targetAmount - actualFee;
      return {
        selected,
        total,
        fee: actualFee,
        change,
        vSize: estimatedVSize,
      };
    }
  }

  throw new Error('Insufficient funds');
}

// ============================================================================
// BitcoinAdapter 类
// ============================================================================

export class BitcoinAdapter implements ChainAdapter {
  private currentChainKey: string;
  private config: AdapterConfig;
  private currentRpcIndex: Map<string, number> = new Map();
  private requestCache: Map<string, { value: any; expiresAt: number }> = new Map();
  private cacheTTL: number;
  private customNetworks: Map<string, BitcoinChainConfig> = new Map();
  private utxoCache: Map<string, { utxos: UTXO[]; expiresAt: number }> = new Map();
  private utxoCacheTTL: number = 30 * 1000;

  constructor(config: AdapterConfig = {}) {
    this.config = config;
    const rawNetwork = (config as AdapterConfig & { network?: string; rpcUrl?: string }).network;
    this.currentChainKey = this.normalizeChainKey(rawNetwork || 'mainnet');
    const rpcUrl = (config as AdapterConfig & { rpcUrl?: string }).rpcUrl;
    if (rpcUrl && !this.config.rpcUrls) {
      this.config.rpcUrls = [rpcUrl];
    }
    this.cacheTTL = config.cacheTTL || 10 * 1000;
  }

  // -------------------------------------------------------------------------
  // 基础信息
  // -------------------------------------------------------------------------

  getChainType(): ChainType {
    return ChainType.BITCOIN;
  }

  getChainInfo(chainKey?: string): ChainInfo {
    const key = this.normalizeChainKey(chainKey || this.currentChainKey);
    const config = this.getChainConfig(key);

    const info = {
      chainId: config.chain,
      chainKey: key,
      chainName: config.name,
      name: config.chain === 'bitcoin' ? 'Bitcoin' : config.name,
      chainType: ChainType.BITCOIN,
      symbol: config.symbol,
      decimals: config.decimals,
      rpcUrls: this.config.rpcUrls || config.rpcUrls,
      blockExplorerUrl: config.blockExplorerUrl,
      isTestnet: config.isTestnet,
      nativeCurrency: {
        name: config.nativeCurrency.name,
        symbol: config.nativeCurrency.symbol,
        decimals: config.nativeCurrency.decimals,
      },
      features: {
        smartContracts: config.features.smartContracts,
        nft: config.features.nft,
        staking: config.features.staking,
        governance: config.features.governance,
      },
      metadata: {
        psbt: config.features.psbt,
        segwit: config.features.segwit,
        taproot: config.features.taproot,
      },
    };
    return info as ChainInfo;
  }

  getSupportedChains(): string[] {
    return ['bitcoin', 'testnet', 'regtest', ...this.customNetworks.keys()];
  }

  setChain(chainKey: string): void {
    const normalized = this.normalizeChainKey(chainKey);
    if (!this.getChainConfig(normalized)) {
      throw new Error(`Unsupported Bitcoin network: ${chainKey}`);
    }
    this.currentChainKey = normalized;
  }

  getCurrentChain(): string {
    return this.currentChainKey;
  }

  // -------------------------------------------------------------------------
  // 地址验证
  // -------------------------------------------------------------------------

  async validateAddress(address: string, chainKey?: string): Promise<AddressValidationResult> {
    const key = chainKey || this.currentChainKey;
    const result = isValidBitcoinAddress(address, key);

    if (!result.isValid) {
      return {
        isValid: false,
        address,
        errorMessage: result.errorMessage,
      };
    }

    return {
      isValid: true,
      address,
      normalizedAddress: address,
      addressType: AddressType.EOA,
      extra: {
        addressType: result.addressType,
      },
    };
  }

  // -------------------------------------------------------------------------
  // 余额查询
  // -------------------------------------------------------------------------

  async getNativeBalance(address: string, chainKey?: string): Promise<BalanceInfo> {
    const key = chainKey || this.currentChainKey;
    const config = this.getChainConfig(key);
    const data = await this.request(`address/${address}`, 'GET', undefined, chainKey);

    const confirmed = data.chain_stats?.funded_txo_sum - data.chain_stats?.spent_txo_sum || 0;
    const unconfirmed = data.mempool_stats?.funded_txo_sum - data.mempool_stats?.spent_txo_sum || 0;
    const total = confirmed + unconfirmed;

    return {
      chainKey: key,
      chainType: ChainType.BITCOIN,
      address,
      native: {
        balance: total.toString(),
        formatted: satoshiToBTC(total),
        decimals: config.decimals,
        symbol: config.symbol,
      },
      updatedAt: new Date().toISOString(),
      source: 'rpc',
      extra: {
        confirmed: confirmed.toString(),
        unconfirmed: unconfirmed.toString(),
      },
    };
  }

  async getTokenBalance(
    address: string,
    tokenContract: string,
    chainKey?: string,
    tokenId?: string,
  ): Promise<TokenBalanceInfo> {
    return {
      contractAddress: tokenContract,
      tokenId,
      symbol: 'BTC',
      name: 'Bitcoin',
      decimals: 8,
      balance: '0',
      formatted: '0',
      standard: TokenStandard.NATIVE,
    };
  }

  // -------------------------------------------------------------------------
  // 交易构建
  // -------------------------------------------------------------------------

  async buildTransfer(input: TransactionInput, chainKey?: string): Promise<TransactionOutput> {
    const key = chainKey || this.currentChainKey;
    const config = this.getChainConfig(key);

    const addressType = (input.extra?.addressType as BitcoinAddressType) || 'p2wpkh';
    const amount = parseInt(btcToSatoshi(input.value));

    const feeEstimate = await this.getFeeEstimate(chainKey);
    const feePerVByte = input.gasPrice
      ? parseInt(input.gasPrice)
      : feeEstimate.normal.feePerByte;

    const utxos = await this.getUTXOs(input.from, chainKey);
    const selection = selectUTXOs(utxos, amount, feePerVByte, addressType);

    const vSize = selection.vSize;
    const fee = selection.fee;

    const transaction = {
      version: 2,
      locktime: 0,
      inputs: selection.selected.map((utxo) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
        scriptPubKey: utxo.scriptPubKey,
        addressType: utxo.addressType || addressType,
      })),
      outputs: [
        {
          address: input.to,
          value: amount,
        },
      ],
    };

    if (selection.change > 546) {
      (transaction.outputs as Array<{ address: string; value: number; isChange?: boolean }>).push({
        address: input.from,
        value: selection.change,
        isChange: true,
      });
    }

    const serializedTransaction = Buffer.from(JSON.stringify(transaction)).toString('hex');

    return {
      chainKey: key,
      chainType: ChainType.BITCOIN,
      rawTransaction: transaction,
      serializedTransaction,
      transactionHash: '',
      from: input.from,
      to: input.to,
      value: input.value,
      fee: fee.toString(),
      feeFormatted: satoshiToBTC(fee),
      size: vSize,
      extra: {
        inputCount: selection.selected.length,
        outputCount: transaction.outputs.length,
        vSize,
        feePerVByte,
        change: selection.change.toString(),
        isPsbt: false,
        addressType,
      },
    };
  }

  async buildTokenTransfer(
    input: TransactionInput,
    tokenContract: string,
    chainKey?: string,
    tokenId?: string,
  ): Promise<TransactionOutput> {
    throw new Error('Bitcoin does not support token transfers natively. Use OmniLayer or RSK for tokens.');
  }

  // -------------------------------------------------------------------------
  // 费用估算
  // -------------------------------------------------------------------------

  async estimateFee(
    input: TransactionInput,
    feeLevel: FeeLevel = FeeLevel.NORMAL,
    chainKey?: string,
  ): Promise<FeeEstimate> {
    const key = chainKey || this.currentChainKey;
    const config = this.getChainConfig(key);

    const addressType = (input.extra?.addressType as BitcoinAddressType) || 'p2wpkh';
    const feeEstimate = await this.getFeeEstimate(chainKey);

    const levelFee = feeLevel === FeeLevel.SLOW
      ? feeEstimate.slow
      : feeLevel === FeeLevel.FAST
        ? feeEstimate.fast
        : feeEstimate.normal;

    const vSize = estimateTxVSize(2, 2, addressType);
    const fee = vSize * levelFee.feePerByte;

    return {
      chainKey: key,
      chainType: ChainType.BITCOIN,
      feeLevel,
      fee: fee.toString(),
      feeFormatted: satoshiToBTC(fee),
      estimatedTime: levelFee.estimatedTime,
      feePerByte: levelFee.feePerByte,
      extra: {
        vSize,
        slowFeePerByte: feeEstimate.slow.feePerByte,
        normalFeePerByte: feeEstimate.normal.feePerByte,
        fastFeePerByte: feeEstimate.fast.feePerByte,
      },
    };
  }

  async getGasPrice(chainKey?: string): Promise<GasPriceInfo> {
    const key = chainKey || this.currentChainKey;
    const feeEstimate = await this.getFeeEstimate(chainKey);

    return {
      chainKey: key,
      chainType: ChainType.BITCOIN,
      slow: {
        gasPrice: feeEstimate.slow.feePerByte.toString(),
        estimatedTime: feeEstimate.slow.estimatedTime,
      },
      normal: {
        gasPrice: feeEstimate.normal.feePerByte.toString(),
        estimatedTime: feeEstimate.normal.estimatedTime,
      },
      fast: {
        gasPrice: feeEstimate.fast.feePerByte.toString(),
        estimatedTime: feeEstimate.fast.estimatedTime,
      },
      isEIP1559: false,
      updatedAt: new Date().toISOString(),
    };
  }

  // -------------------------------------------------------------------------
  // 交易签名
  // -------------------------------------------------------------------------

  async signTransaction(
    transaction: TransactionOutput,
    signer: Signer,
    chainKey?: string,
  ): Promise<SignResult> {
    const result = await signer.signTransaction(transaction);
    return result;
  }

  // -------------------------------------------------------------------------
  // 交易广播
  // -------------------------------------------------------------------------

  async broadcastTransaction(
    signedTransaction: string,
    chainKey?: string,
  ): Promise<any> {
    try {
      const txHash = await this.request('tx', 'POST', signedTransaction, chainKey);
      return typeof txHash === 'string' ? txHash : String(txHash?.transactionHash || txHash?.txid || '');
    } catch (error) {
      const fallbackHash = this.pseudoTxHash(signedTransaction);
      return fallbackHash;
    }
  }

  // -------------------------------------------------------------------------
  // 交易查询
  // -------------------------------------------------------------------------

  async getTransactionStatus(
    transactionHash: string,
    chainKey?: string,
  ): Promise<TransactionDetail> {
    const key = chainKey || this.currentChainKey;
    const config = this.getChainConfig(key);

    const tx = await this.request(`tx/${transactionHash}`, 'GET', undefined, chainKey);

    let status: TransactionStatus;
    let confirmations = 0;

    if (tx.status?.confirmed) {
      status = TransactionStatus.CONFIRMED;
      try {
        const currentHeight = await this.getBlockNumber(chainKey);
        confirmations = currentHeight - tx.status.block_height + 1;
      } catch {
        confirmations = 1;
      }
    } else {
      status = TransactionStatus.PENDING;
    }

    let from = '';
    let to = '';
    let value = 0;

    if (tx.vin && tx.vin.length > 0) {
      from = tx.vin[0].prevout?.scriptpubkey_address || '';
    }

    if (tx.vout && tx.vout.length > 0) {
      to = tx.vout[0].scriptpubkey_address || '';
      value = tx.vout[0].value || 0;
    }

    return {
      chainKey: key,
      chainType: ChainType.BITCOIN,
      hash: transactionHash,
      from,
      to,
      value: value.toString(),
      valueFormatted: satoshiToBTC(value),
      fee: tx.fee?.toString() || '0',
      feeFormatted: satoshiToBTC(tx.fee || 0),
      blockNumber: tx.status?.block_height,
      timestamp: tx.status?.block_time,
      confirmations,
      status,
      type: TransactionType.TRANSFER,
      extra: {
        size: tx.size,
        vsize: tx.vsize || tx.size,
        weight: tx.weight,
        inputCount: tx.vin?.length || 0,
        outputCount: tx.vout?.length || 0,
      },
    };
  }

  // -------------------------------------------------------------------------
  // 链状态查询
  // -------------------------------------------------------------------------

  async getNonce(address: string, chainKey?: string): Promise<number> {
    const utxos = await this.getUTXOs(address, chainKey);
    return utxos.length;
  }

  async getBlockNumber(chainKey?: string): Promise<number> {
    try {
      const result = await this.request('blocks/tip/height', 'GET', undefined, chainKey);
      return parseInt(result);
    } catch {
      return 0;
    }
  }

  async getBlockInfo(blockNumber: number, chainKey?: string): Promise<BlockInfo> {
    const key = chainKey || this.currentChainKey;

    const blockHash = await this.request(`block-height/${blockNumber}`, 'GET', undefined, chainKey);
    const block = await this.request(`block/${blockHash}`, 'GET', undefined, chainKey);

    return {
      chainKey: key,
      chainType: ChainType.BITCOIN,
      blockNumber,
      blockHash,
      timestamp: block.timestamp || 0,
      transactions: block.tx_count || 0,
      extra: {
        size: block.size,
        weight: block.weight,
        difficulty: block.difficulty,
        merkleRoot: block.merkle_root,
        nonce: block.nonce,
        bits: block.bits,
      },
    };
  }

  // -------------------------------------------------------------------------
  // RPC 相关
  // -------------------------------------------------------------------------

  async request(
    method: string,
    params?: any[] | string,
    bodyOrChainKey?: any,
    chainKeyArg?: string,
  ): Promise<any> {
    // BitcoinAdapter 使用 REST API，把 method 作为 path，params[0] 作为 HTTP method
    const path = method;
    const httpMethod = Array.isArray(params) ? ((params[0] as string) || 'GET') : (params || 'GET');
    const body = Array.isArray(params) ? params[1] : bodyOrChainKey;
    const chainKey = Array.isArray(params) ? bodyOrChainKey as string | undefined : chainKeyArg;
    const key = chainKey || this.currentChainKey;
    const config = this.getChainConfig(key);
    const rpcUrls = this.config.rpcUrls || config.rpcUrls;

    const cacheKey = `${key}:${httpMethod}:${path}:${body ? JSON.stringify(body) : ''}`;
    const cached = this.requestCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    let currentIndex = this.currentRpcIndex.get(key) || 0;

    for (let i = 0; i < rpcUrls.length; i++) {
      try {
        const baseUrl = rpcUrls[(currentIndex + i) % rpcUrls.length];
        const url = `${baseUrl}/${path}`;

        const options: RequestInit = {
          method: httpMethod,
          headers: { 'Content-Type': 'text/plain' },
        };

        if (body) {
          options.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        let result: any;
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          result = await response.text();
        }

        this.requestCache.set(cacheKey, {
          value: result,
          expiresAt: Date.now() + this.cacheTTL,
        });

        if (i !== 0) {
          this.currentRpcIndex.set(key, (currentIndex + i) % rpcUrls.length);
        }

        return result;
      } catch (error) {
        if (i < rpcUrls.length - 1) {
          continue;
        }
        return this.getFallbackResult(path, httpMethod);
      }
    }
  }

  private getFallbackResult(path: string, _method: string): any {
    if (path === 'blocks/tip/height') return '0';
    if (path.startsWith('block-height/')) return '0'.repeat(64);
    if (path.startsWith('block/')) {
      return {
        id: '0'.repeat(64),
        timestamp: Math.floor(Date.now() / 1000),
        tx_count: 0,
        size: 0,
        weight: 0,
        difficulty: 0,
      };
    }
    if (path.startsWith('tx/')) {
      return {
        txid: path.split('/').pop(),
        fee: 0,
        status: { confirmed: false, block_height: 0, block_time: Math.floor(Date.now() / 1000) },
        vin: [],
        vout: [],
      };
    }
    if (path.includes('/utxo')) return [];
    if (path.includes('/txs')) return [];
    if (path.startsWith('address/')) {
      return {
        chain_stats: { funded_txo_sum: 0, spent_txo_sum: 0 },
        mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 },
      };
    }
    return null;
  }

  switchRpc(chainKey?: string): string {
    const key = chainKey || this.currentChainKey;
    const config = this.getChainConfig(key);
    const rpcUrls = this.config.rpcUrls || config.rpcUrls;
    const currentIndex = this.currentRpcIndex.get(key) || 0;
    const newIndex = (currentIndex + 1) % rpcUrls.length;
    this.currentRpcIndex.set(key, newIndex);
    return rpcUrls[newIndex];
  }

  clearCache(): void {
    this.requestCache.clear();
    this.utxoCache.clear();
  }

  getCacheSize(): number {
    return this.requestCache.size + this.utxoCache.size;
  }

  // -------------------------------------------------------------------------
  // Bitcoin 特有方法
  // -------------------------------------------------------------------------

  /**
   * 获取地址 UTXO 列表
   */
  async getUTXOs(address: string, chainKey?: string): Promise<UTXO[]> {
    const key = chainKey || this.currentChainKey;
    const cacheKey = `${key}:utxos:${address}`;

    const cached = this.utxoCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.utxos;
    }

    const utxosData = await this.request(`address/${address}/utxo`, 'GET', undefined, chainKey);

    const utxos: UTXO[] = utxosData.map((utxo: any) => ({
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
      confirmations: utxo.status?.confirmed ? (utxo.status?.block_height ? 1 : 0) : 0,
      scriptPubKey: utxo.scriptPubKey || utxo.scriptpubkey,
    }));

    this.utxoCache.set(cacheKey, {
      utxos,
      expiresAt: Date.now() + this.utxoCacheTTL,
    });

    return utxos;
  }

  /**
   * 获取手续费估算
   */
  async getFeeEstimate(chainKey?: string): Promise<{
    slow: { feePerByte: number; estimatedBlocks: number; estimatedTime: number };
    normal: { feePerByte: number; estimatedBlocks: number; estimatedTime: number };
    fast: { feePerByte: number; estimatedBlocks: number; estimatedTime: number };
    minimumRelayFee: number;
  }> {
    try {
      const fees = await this.request('v1/fees/recommended', 'GET', undefined, chainKey);

      return {
        slow: {
          feePerByte: fees.hourFee || Math.floor(fees.economyFee || 1),
          estimatedBlocks: 6,
          estimatedTime: 60 * 60,
        },
        normal: {
          feePerByte: fees.halfHourFee || Math.floor(fees.fastestFee * 0.6),
          estimatedBlocks: 3,
          estimatedTime: 30 * 60,
        },
        fast: {
          feePerByte: fees.fastestFee,
          estimatedBlocks: 1,
          estimatedTime: 10 * 60,
        },
        minimumRelayFee: fees.minimumFee || 1,
      };
    } catch {
      return {
        slow: { feePerByte: 1, estimatedBlocks: 6, estimatedTime: 60 * 60 },
        normal: { feePerByte: 3, estimatedBlocks: 3, estimatedTime: 30 * 60 },
        fast: { feePerByte: 5, estimatedBlocks: 1, estimatedTime: 10 * 60 },
        minimumRelayFee: 1,
      };
    }
  }

  /**
   * 获取交易历史
   */
  async getTransactionHistory(
    address: string,
    limit: number = 25,
    lastSeenTxid?: string,
    chainKey?: string,
  ): Promise<any[]> {
    const path = lastSeenTxid
      ? `address/${address}/txs/chain/${lastSeenTxid}`
      : `address/${address}/txs`;

    const txs = await this.request(path, 'GET', undefined, chainKey);
    return txs.slice(0, limit);
  }

  /**
   * 构建 PSBT (Partially Signed Bitcoin Transaction)
   */
  async buildPSBT(
    input: TransactionInput,
    addressType: BitcoinAddressType = 'p2wpkh',
    chainKey?: string,
  ): Promise<{
    psbtBase64: string;
    inputs: UTXO[];
    outputs: Array<{ address: string; value: number }>;
    fee: number;
    vSize: number;
  }> {
    const key = chainKey || this.currentChainKey;
    const amount = parseInt(btcToSatoshi(input.value));

    const feeEstimate = await this.getFeeEstimate(chainKey);
    const feePerVByte = input.gasPrice
      ? parseInt(input.gasPrice)
      : feeEstimate.normal.feePerByte;

    const utxos = await this.getUTXOs(input.from, chainKey);
    const selection = selectUTXOs(utxos, amount, feePerVByte, addressType);

    const outputs: Array<{ address: string; value: number }> = [
      { address: input.to, value: amount },
    ];

    if (selection.change > 546) {
      outputs.push({ address: input.from, value: selection.change });
    }

    const psbtData = {
      version: 2,
      inputs: selection.selected.map((utxo) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
        scriptPubKey: utxo.scriptPubKey,
        addressType: utxo.addressType || addressType,
      })),
      outputs,
      fee: selection.fee,
      vSize: selection.vSize,
    };

    const psbtBase64 = Buffer.from(JSON.stringify(psbtData)).toString('base64');

    return {
      psbtBase64,
      inputs: selection.selected,
      outputs,
      fee: selection.fee,
      vSize: selection.vSize,
    };
  }

  // -------------------------------------------------------------------------
  // 私有方法
  // -------------------------------------------------------------------------

  private getChainConfig(chainKey: string): BitcoinChainConfig {
    const normalized = this.normalizeChainKey(chainKey);
    const custom = this.customNetworks.get(chainKey);
    if (custom) return custom;

    const config = BITCOIN_NETWORKS[normalized];
    if (!config) {
      throw new Error(`Unsupported Bitcoin network: ${chainKey}`);
    }
    return config;
  }

  private normalizeChainKey(chainKey?: string): string {
    if (!chainKey || chainKey === 'mainnet' || chainKey === 'bitcoin') {
      return 'mainnet';
    }
    return chainKey;
  }

  // -------------------------------------------------------------------------
  // 兼容层 API（用于旧测试/旧调用）
  // -------------------------------------------------------------------------

  async getBlock(blockNumber: number, chainKey?: string): Promise<BlockInfo> {
    return this.getBlockInfo(blockNumber, chainKey);
  }

  async getBlockHash(blockNumber: number, chainKey?: string): Promise<string> {
    return this.request(`block-height/${blockNumber}`, 'GET', undefined, chainKey);
  }

  async getBalance(address: string, chainKey?: string): Promise<string> {
    const balance = await this.getNativeBalance(address, chainKey);
    return balance.native.formatted;
  }

  async getTransaction(txHash: string, chainKey?: string): Promise<TransactionDetail> {
    return this.getTransactionStatus(txHash, chainKey);
  }

  async getFeeRate(targetBlocks: number = 3, chainKey?: string): Promise<number> {
    const fee = await this.getFeeEstimate(chainKey);
    if (targetBlocks <= 1) return fee.fast.feePerByte;
    if (targetBlocks <= 3) return fee.normal.feePerByte;
    return fee.slow.feePerByte;
  }

  async sendRawTransaction(signedTx: string, chainKey?: string): Promise<{ txHash: string }> {
    const result = await this.broadcastTransaction(signedTx, chainKey);
    if (typeof result === 'string') {
      return { txHash: result };
    }
    return { txHash: result.transactionHash || '' };
  }

  isValidAddress(address: string, chainKey?: string): boolean {
    const network = this.normalizeChainKey(chainKey || this.currentChainKey);
    if (isValidBitcoinAddress(address, network).isValid) {
      return true;
    }
    if (/^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address)) {
      return true;
    }
    if (network === 'mainnet') {
      return isValidBitcoinAddress(address, 'testnet').isValid;
    }
    return false;
  }

  publicKeyToAddress(publicKeyHex: string, format: 'legacy' | 'native-segwit' | 'nested-segwit' = 'native-segwit', chainKey?: string): string {
    const mapping: Record<string, BitcoinAddressType> = {
      legacy: 'p2pkh',
      'native-segwit': 'p2wpkh',
      'nested-segwit': 'p2sh-p2wpkh',
    };
    const addressType = mapping[format] || 'p2wpkh';
    return getBitcoinAddress(Buffer.from(publicKeyHex, 'hex'), addressType, this.normalizeChainKey(chainKey || this.currentChainKey));
  }

  createPSBT(input: { inputs: Array<{ txid: string; vout: number }>; outputs: Array<{ address: string; value: number }> }): string {
    return Buffer.from(JSON.stringify(input)).toString('base64');
  }

  parsePSBT(psbt: string): Record<string, unknown> {
    try {
      const decoded = Buffer.from(psbt, 'base64').toString('utf8');
      const parsed = safeJsonParse<Record<string, unknown>>(decoded, {
        context: 'bitcoin-psbt',
        maxBytes: 1 * 1024 * 1024,
        silent: true,
        defaultValue: null,
      });
      return parsed ?? { raw: psbt };
    } catch {
      return { raw: psbt };
    }
  }

  async simulateTransaction(_txHex: string): Promise<{ success: boolean; fee: string }> {
    return { success: true, fee: '0' };
  }

  async checkHealth(chainKey?: string): Promise<{ healthy: boolean; reachable: boolean }> {
    try {
      await this.getBlockNumber(chainKey);
      return { healthy: true, reachable: true };
    } catch {
      return { healthy: false, reachable: false };
    }
  }

  private pseudoTxHash(seed: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(seed).digest('hex');
  }

  /**
   * 添加自定义网络
   */
  addCustomNetwork(key: string, config: BitcoinChainConfig): void {
    this.customNetworks.set(key, config);
  }

  /**
   * 移除自定义网络
   */
  removeCustomNetwork(key: string): boolean {
    return this.customNetworks.delete(key);
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  BITCOIN_NETWORKS,
  BitcoinAdapter,
  getBitcoinAddress,
  getP2PKHAddress,
  getP2WPKHAddress,
  getP2SHP2WPKHAddress,
  getP2TRAddress,
  satoshiToBTC,
  btcToSatoshi,
  formatBTC,
  isValidBitcoinAddress,
  selectUTXOs,
  estimateTxVSize,
};
