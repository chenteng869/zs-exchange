/**
 * TRON 链上数据服务（余额 / 交易历史）
 *
 * 基于 Trongrid HTTP API（api.trongrid.io）实现：
 *  - 原币余额（TRX，单位 SUN 1e6）
 *  - TRC20 代币余额（/v1/accounts/{addr}/tokens/trc20）
 *  - 区块高度（/wallet/getnowblock）
 *  - 交易历史（/v1/accounts/{address}/transactions + /transactions/trc20）
 *  - 演示降级：API 不可用时返回稳定 mock 数据
 *
 * 使用专用 TronRpcClient（与 EVM 用的 RpcClient 区分），
 * 支持 API Key 注入 / 429 限流切换 / 5xx 自动故障转移。
 */

import {
  TronRpcClient,
  TronRpcError,
  sunToTrx as sunToTrxUtil,
  trc20Format,
  TRON_DEFAULT_ENDPOINTS,
  TRON_SHASTA_ENDPOINTS,
  TRON_NILE_ENDPOINTS,
  type TronNetwork,
} from './tron-rpc-client';
import type { NodeHealth } from './rpc-client';

// =============================================================================
// 关键合约地址 / 精度
// =============================================================================

/** USDT (TRC20) 主网合约地址 */
export const TRC20_USDT_MAINNET = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
/** USDT 精度 */
export const TRC20_USDT_DECIMALS = 6;

/** USDC (TRC20) 主网合约地址 */
export const TRC20_USDC_MAINNET = 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8';
/** USDC 精度 */
export const TRC20_USDC_DECIMALS = 6;

// =============================================================================
// 地址校验
// =============================================================================

/**
 * 校验 TRX / TRC20 base58 地址。
 *  - 以 T 开头
 *  - 长度 34
 *  - 仅 base58 字符（无 0/O/I/l）
 */
const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/;
export function isValidTrxAddress(address: string): boolean {
  if (!address || address.length !== 34) return false;
  if (!address.startsWith('T')) return false;
  return BASE58_RE.test(address);
}

// =============================================================================
// 类型
// =============================================================================

export type TronChain = 'TRX';

export interface NativeBalance {
  chain: TronChain;
  address: string;
  network: TronNetwork;
  /** TRX 单位 */
  balance: string;
  /** SUN 单位 */
  balanceSun: string;
  unit: 'TRX';
  source: 'rpc' | 'fallback';
  updatedAt: string;
}

export interface TokenBalance {
  chain: TronChain;
  address: string;
  network: TronNetwork;
  contractAddress: string;
  symbol: string;
  decimals: number;
  balance: string;
  balanceRaw: string;
  unit: string;
  source: 'rpc' | 'fallback';
  updatedAt: string;
}

export interface ChainStatus {
  chain: TronChain;
  network: TronNetwork;
  blockNumber: number;
  /** TRON 块时间戳（毫秒） */
  blockTime: number;
  gasPrice: string;
  gasPriceUnit: 'TRX';
  source: 'rpc' | 'fallback';
  updatedAt: string;
}

export interface TransactionInfo {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  valueFormatted: string;
  asset: string;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
  method?: string;
}

export interface TronChainServiceOptions {
  /** 端点列表（覆盖默认网络） */
  endpoints?: string[];
  /** 网络（mainnet / shasta / nile） */
  network?: TronNetwork;
  /** Trongrid API Key */
  apiKey?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  fallbackToDemo?: boolean;
  healthCheckMs?: number;
}

// =============================================================================
// TronChainService
// =============================================================================

export class TronChainService {
  private readonly client: TronRpcClient;
  private readonly network: TronNetwork;
  private readonly fallbackToDemo: boolean;
  private readonly endpoints: string[];

  constructor(opts: TronChainServiceOptions = {}) {
    this.network = opts.network || 'mainnet';
    this.fallbackToDemo = opts.fallbackToDemo !== false;
    this.endpoints = opts.endpoints || this.defaultEndpoints(this.network);

    this.client = new TronRpcClient({
      endpoints: this.endpoints,
      apiKey: opts.apiKey,
      fetchImpl: opts.fetchImpl,
      timeoutMs: opts.timeoutMs,
      maxRetries: opts.maxRetries,
      healthCheckMs: opts.healthCheckMs,
    });
  }

  private defaultEndpoints(network: TronNetwork): string[] {
    if (network === 'shasta') return [...TRON_SHASTA_ENDPOINTS];
    if (network === 'nile') return [...TRON_NILE_ENDPOINTS];
    return [...TRON_DEFAULT_ENDPOINTS];
  }

  // -------------------------------------------------------------------------
  // 生命周期
  // -------------------------------------------------------------------------

  start(): void {
    this.client.startHealthCheck();
  }

  stop(): void {
    this.client.stopHealthCheck();
  }

  getHealth(): NodeHealth[] {
    return this.client.getHealth();
  }

  /** 探测连通性 */
  async probe(): Promise<{ reachable: boolean; healthy: boolean; blockNumber?: number }> {
    try {
      const block = await this.client.request<any>('/wallet/getnowblock', { method: 'POST', body: {} });
      const blockNumber = block?.block_header?.raw_data?.number;
      return { reachable: true, healthy: true, blockNumber };
    } catch {
      return { reachable: false, healthy: false };
    }
  }

  // -------------------------------------------------------------------------
  // 余额
  // -------------------------------------------------------------------------

  async getNativeBalance(address: string): Promise<NativeBalance> {
    if (!isValidTrxAddress(address)) {
      throw new TronRpcError('INVALID_ADDRESS', `Invalid TRON address: ${address}`);
    }
    try {
      const res = await this.client.request<any>(`/v1/accounts/${address}`);
      const acc = Array.isArray(res?.data) ? res.data[0] : res?.data;
      const balanceSun = String(acc?.balance ?? '0');
      return {
        chain: 'TRX',
        address,
        network: this.network,
        balance: sunToTrxUtil(balanceSun),
        balanceSun,
        unit: 'TRX',
        source: 'rpc',
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      return this.demoNativeBalance(address, err as Error);
    }
  }

  async getTrc20Balance(
    address: string,
    contractAddress: string,
    symbol: string = 'UNKNOWN',
    decimals: number = TRC20_USDT_DECIMALS,
  ): Promise<TokenBalance> {
    if (!isValidTrxAddress(address)) {
      throw new TronRpcError('INVALID_ADDRESS', `Invalid TRON address: ${address}`);
    }
    if (!isValidTrxAddress(contractAddress)) {
      throw new TronRpcError('INVALID_TOKEN', `Invalid TRC20 contract: ${contractAddress}`);
    }
    try {
      // 注（2026-07-08 实测校验）：TronGrid 已下线 /v1/accounts/{address}/tokens/trc20，
      // TRC20 余额改为内嵌在 /v1/accounts/{address} 响应的 trc20 字段（数组，每项为 {合约地址: 原始余额字符串}）。
      const res = await this.client.request<any>(`/v1/accounts/${address}`);
      const acc = Array.isArray(res?.data) ? res.data[0] : res?.data;
      const trc20List: Array<Record<string, string>> = Array.isArray(acc?.trc20) ? acc.trc20 : [];
      const entry = trc20List.find(t => Object.keys(t)[0]?.toLowerCase() === contractAddress.toLowerCase());
      const balanceRaw = entry ? Object.values(entry)[0] : '0';
      return {
        chain: 'TRX',
        address,
        network: this.network,
        contractAddress,
        symbol,
        decimals,
        balance: trc20Format(balanceRaw, decimals),
        balanceRaw,
        unit: symbol,
        source: 'rpc',
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      return this.demoTokenBalance(address, contractAddress, symbol, decimals, err as Error);
    }
  }

  /** 兼容 ChainClient 适配器：统一的 getTokenBalance */
  async getTokenBalance(
    address: string,
    contractAddress: string,
    symbol?: string,
    decimals?: number,
  ): Promise<TokenBalance> {
    return this.getTrc20Balance(address, contractAddress, symbol, decimals);
  }

  // -------------------------------------------------------------------------
  // 链状态
  // -------------------------------------------------------------------------

  async getChainStatus(): Promise<ChainStatus> {
    try {
      const block = await this.client.request<any>('/wallet/getnowblock', { method: 'POST', body: {} });
      const raw = block?.block_header?.raw_data;
      return {
        chain: 'TRX',
        network: this.network,
        blockNumber: raw?.number ?? 0,
        blockTime: Number(raw?.timestamp ?? Date.now()),
        gasPrice: '0',
        gasPriceUnit: 'TRX',
        source: 'rpc',
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      return this.demoChainStatus(err as Error);
    }
  }

  async getTransactionCount(_address: string): Promise<number> {
    return 0;
  }

  // -------------------------------------------------------------------------
  // 交易
  // -------------------------------------------------------------------------

  async getTransaction(txHash: string): Promise<TransactionInfo | null> {
    if (!/^[0-9a-fA-F]{64}$/.test(txHash)) {
      throw new TronRpcError('INVALID_TX_HASH', `Invalid TRON tx hash: ${txHash}`);
    }
    try {
      const res = await this.client.request<any>(`/v1/transactions/${txHash}`);
      const tx = Array.isArray(res?.data) ? res.data[0] : res?.data;
      if (!tx) return null;
      const raw = tx.raw_data?.contract?.[0]?.parameter?.value;
      const owner = raw?.owner_address || '';
      const to = raw?.to_address || raw?.contract_address || '';
      const amount = String(raw?.amount ?? '0');
      return {
        hash: tx.txID || txHash,
        blockNumber: tx.blockNumber ?? 0,
        from: this.hexToBase58(owner),
        to: this.hexToBase58(to),
        value: amount,
        valueFormatted: sunToTrxUtil(amount),
        asset: 'TRX',
        timestamp: tx.block_timestamp ?? 0,
        status: tx.blockNumber ? 'success' : 'pending',
      };
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      return this.demoTransaction(txHash, err as Error);
    }
  }

  async getTransactionHistory(address: string, limit: number = 10): Promise<TransactionInfo[]> {
    if (!isValidTrxAddress(address)) {
      throw new TronRpcError('INVALID_ADDRESS', `Invalid TRON address: ${address}`);
    }
    if (limit < 1 || limit > 100) {
      throw new TronRpcError('INVALID_LIMIT', `Limit must be 1-100, got ${limit}`);
    }
    try {
      const res = await this.client.request<any>(`/v1/accounts/${address}/transactions/trc20?limit=${limit}`);
      const list: any[] = Array.isArray(res?.data) ? res.data : [];
      return list.map((tx) => {
        const symbol = tx.token_info?.symbol || 'USDT';
        const decimals = tx.token_info?.decimals || TRC20_USDT_DECIMALS;
        const valueHex = tx.value || '0';
        const valueRaw = this.hexBalanceToBigInt(valueHex).toString();
        return {
          hash: (tx.transaction_id || '').replace(/^0x/, ''),
          blockNumber: 0,
          from: tx.from || '',
          to: tx.to || '',
          value: valueRaw,
          valueFormatted: trc20Format(valueRaw, decimals),
          asset: symbol,
          timestamp: tx.block_timestamp ?? 0,
          status: tx.confirmed ? 'success' : 'pending',
        } satisfies TransactionInfo;
      });
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      return this.demoTransactionHistory(address, limit, err as Error);
    }
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  /**
   * 将 Trongrid 返回的 hex 余额（无 0x 前缀）安全转为 BigInt。
   * 同时支持已经是十进制字符串或带 0x 前缀的输入。
   */
  private hexBalanceToBigInt(value: string | number | bigint): bigint {
    try {
      if (typeof value === 'bigint') return value;
      if (typeof value === 'number') return BigInt(value);
      const s = String(value).trim();
      if (!s) return 0n;
      if (/^0x[0-9a-fA-F]+$/.test(s)) return BigInt(s);
      if (/^[0-9a-fA-F]+$/.test(s)) return BigInt('0x' + s);
      // 已经是十进制
      return BigInt(s);
    } catch {
      return 0n;
    }
  }

  private hexToBase58(hex: string): string {
    if (!hex) return '';
    try {
      const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
      if (!/^[0-9a-fA-F]+$/.test(cleaned)) return '';
      const bytes = Buffer.from(cleaned, 'hex');
      return this.base58Encode(bytes);
    } catch {
      return '';
    }
  }

  private base58Encode(buf: Uint8Array): string {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    if (buf.length === 0) return '';
    let zeros = 0;
    while (zeros < buf.length && buf[zeros] === 0) zeros++;
    const digits: number[] = [];
    for (let i = zeros; i < buf.length; i++) {
      let carry = buf[i];
      for (let j = 0; j < digits.length; j++) {
        carry += digits[j] << 8;
        digits[j] = carry % 58;
        carry = (carry / 58) | 0;
      }
      while (carry > 0) {
        digits.push(carry % 58);
        carry = (carry / 58) | 0;
      }
    }
    let result = '';
    for (let i = 0; i < zeros; i++) result += ALPHABET[0];
    for (let i = digits.length - 1; i >= 0; i--) result += ALPHABET[digits[i]];
    return result;
  }

  // -------------------------------------------------------------------------
  // 演示降级
  // -------------------------------------------------------------------------

  private demoNativeBalance(address: string, _err: Error): NativeBalance {
    const seed = address.charCodeAt(1) || 1;
    const balanceSun = (seed % 100_000_000) + 1_000_000;
    return {
      chain: 'TRX',
      address,
      network: this.network,
      balance: sunToTrxUtil(balanceSun),
      balanceSun: balanceSun.toString(),
      unit: 'TRX',
      source: 'fallback',
      updatedAt: new Date().toISOString(),
    };
  }

  private demoTokenBalance(
    address: string,
    contractAddress: string,
    symbol: string,
    decimals: number,
    _err: Error,
  ): TokenBalance {
    const seed = address.charCodeAt(1) * 31 + contractAddress.charCodeAt(1);
    const raw = ((seed % 1_000_000) + 1) * 10 ** Math.min(decimals, 6);
    return {
      chain: 'TRX',
      address,
      network: this.network,
      contractAddress,
      symbol,
      decimals,
      balance: trc20Format(raw, decimals),
      balanceRaw: BigInt(raw).toString(),
      unit: symbol,
      source: 'fallback',
      updatedAt: new Date().toISOString(),
    };
  }

  private demoChainStatus(_err: Error): ChainStatus {
    return {
      chain: 'TRX',
      network: this.network,
      blockNumber: 72_000_000,
      blockTime: Date.now(),
      gasPrice: '0',
      gasPriceUnit: 'TRX',
      source: 'fallback',
      updatedAt: new Date().toISOString(),
    };
  }

  private demoTransaction(txHash: string, _err: Error): TransactionInfo {
    return {
      hash: txHash,
      blockNumber: 0,
      from: 'T' + '0'.repeat(33),
      to: 'T' + '0'.repeat(33),
      value: '0',
      valueFormatted: '0',
      asset: 'TRX',
      timestamp: Date.now() - 3600_000,
      status: 'success',
    };
  }

  private demoTransactionHistory(address: string, limit: number, _err: Error): TransactionInfo[] {
    const out: TransactionInfo[] = [];
    const seed = address.charCodeAt(1) || 1;
    for (let i = 0; i < limit; i++) {
      const valueRaw = (BigInt(seed) + BigInt(i)) * 10n ** 6n + 1_000_000n;
      out.push({
        hash: '0x' + (BigInt(seed) + BigInt(i)).toString(16).padStart(64, '0'),
        blockNumber: 0,
        from: address,
        to: 'T' + ((seed + i * 7) >>> 0).toString(16).padStart(33, '0').slice(0, 33),
        value: valueRaw.toString(),
        valueFormatted: trc20Format(valueRaw, TRC20_USDT_DECIMALS),
        asset: 'USDT',
        timestamp: Date.now() - i * 3600_000,
        status: 'success',
      });
    }
    return out;
  }
}

// =============================================================================
// 工厂函数
// =============================================================================

export function createTronService(
  apiKey?: string,
  opts?: Partial<TronChainServiceOptions>,
): TronChainService {
  return new TronChainService({ apiKey, ...opts });
}

/** 探测 TRON 主网连通性 */
export async function probeTron(
  apiKey?: string,
  fetchImpl?: typeof fetch,
): Promise<{ reachable: boolean; healthy: boolean; blockNumber?: number }> {
  const svc = new TronChainService({
    apiKey,
    fetchImpl,
    fallbackToDemo: false,
    healthCheckMs: 0,
  });
  try {
    const r = await svc.probe();
    return r;
  } finally {
    svc.stop();
  }
}
