/**
 * 统一多链 SDK（ChainClient）
 *
 * 目标：让业务层用同一个接口访问 ETH / BSC / TRON / Solana / Bitcoin 等所有链。
 *
 * 设计要点：
 *  - 接口统一：余额 / 链状态 / 交易 / 健康 / 生命周期
 *  - 适配器模式：不修改 EvmChainService / TronChainService 原始实现
 *  - 错误传播一致：底层 RpcError 保持类型透传
 *  - 演示降级：所有适配器在 RPC 不可用时返回 source='fallback'
 *
 * 接入方式：
 *   const registry = createDefaultRegistry({ apiKeys: { eth: 'xxx', bsc: 'yyy', tron: 'zzz' } });
 *   const balances = await registry.getBalances('0x...', [{ chain: 'ETH' }, { chain: 'BSC' }]);
 */

import {
  EvmChainService,
  type NativeBalance as EvmNativeBalance,
  type TokenBalance as EvmTokenBalance,
  type ChainStatus as EvmChainStatus,
  type TransactionInfo as EvmTransactionInfo,
} from './chain-service';
import {
  TronChainService,
  type NativeBalance as TronNativeBalance,
  type TokenBalance as TronTokenBalance,
  type ChainStatus as TronChainStatus,
  type TransactionInfo as TronTransactionInfo,
} from './tron-service';
import type { NodeHealth } from './rpc-client';

// =============================================================================
// 统一类型
// =============================================================================

/** 链标识 */
export type ChainId = 'ETH' | 'BSC' | 'POLYGON' | 'ARBITRUM' | 'OPTIMISM' | 'BASE' | 'SOLANA' | 'TRON' | 'BITCOIN';

/** 代币引用 */
export interface TokenRef {
  /** 代币符号（如 USDT、USDC） */
  symbol: string;
  /** 精度 */
  decimals: number;
  /** EVM/TRC20 合约地址 */
  contractAddress?: string;
  /** Solana SPL mint */
  mint?: string;
  /** 原币标识（symbol === unit 时可省略） */
  isNative?: boolean;
}

/** 链状态 */
export interface ChainStatus {
  chain: ChainId;
  blockNumber: number;
  gasPrice: string;
  gasPriceUnit: string;
  source: 'rpc' | 'fallback';
  updatedAt: string;
}

/** 统一余额 */
export interface ChainBalance {
  chain: ChainId;
  address: string;
  symbol: string;
  decimals: number;
  /** EVM/TRC20 合约地址 */
  contractAddress?: string;
  /** SPL mint */
  mint?: string;
  balance: string;        // 人类可读
  balanceRaw: string;     // 最小单位
  unit: string;
  source: 'rpc' | 'fallback';
  updatedAt: string;
}

/** 交易信息（与 EVM/TRON 保持一致） */
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

/** 探测结果 */
export interface ProbeResult {
  chain: ChainId;
  reachable: boolean;
  healthy: boolean;
  blockNumber?: number;
  latencyMs?: number;
}

/** 健康信息 */
export interface HealthInfo {
  chain: ChainId;
  url: string;
  healthy: boolean;
  latencyMs?: number;
  blockNumber?: number;
  lastCheck: number;
  consecutiveFailures: number;
}

// =============================================================================
// 统一接口
// =============================================================================

/**
 * 业务层只需要依赖这个接口，不直接接触具体服务实现。
 * 不同链的差异（地址格式 / RPC 方法 / 单位换算）由适配器屏蔽。
 */
export interface ChainClient {
  readonly chain: ChainId;

  // 余额
  getNativeBalance(address: string): Promise<ChainBalance>;
  getTokenBalance(address: string, token: TokenRef): Promise<ChainBalance>;

  // 链状态
  getChainStatus(): Promise<ChainStatus>;
  getBlockNumber(): Promise<number>;
  getGasPrice(): Promise<string>;

  // 交易
  getTransaction(txHash: string): Promise<TransactionInfo | null>;
  getTransactionHistory(address: string, limit?: number): Promise<TransactionInfo[]>;

  // 健康
  probe(): Promise<ProbeResult>;
  getHealth(): HealthInfo[];

  // 生命周期
  start(): void;
  stop(): void;
}

/** 适配器构造选项 */
export interface EvmAdapterOptions {
  apiKey?: string;
  endpoints?: string[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  fallbackToDemo?: boolean;
  healthCheckMs?: number;
}

export interface TronAdapterOptions {
  apiKey?: string;
  endpoints?: string[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  fallbackToDemo?: boolean;
  healthCheckMs?: number;
}

// =============================================================================
// EVM 适配器
// =============================================================================

/**
 * 将 EvmChainService 适配到 ChainClient。
 * 不修改 EvmChainService 内部实现，仅做类型 / 字段映射。
 *
 * 2026-07-11 升级：支持 5 条 EVM 链（ETH/BSC/Polygon/Arbitrum/Optimism）
 */
export class EvmChainClientAdapter implements ChainClient {
  public readonly chain: ChainId;
  private readonly service: EvmChainService;
  /** EVM 原币符号 */
  private readonly nativeSymbol: 'ETH' | 'BNB' | 'MATIC';
  private readonly nativeDecimals: number = 18;

  constructor(chain: 'ETH' | 'BSC' | 'POLYGON' | 'ARBITRUM' | 'OPTIMISM', opts: EvmAdapterOptions = {}) {
    this.chain = chain;
    // 原币符号映射
    if (chain === 'POLYGON') {
      this.nativeSymbol = 'MATIC';
    } else if (chain === 'BSC') {
      this.nativeSymbol = 'BNB';
    } else {
      this.nativeSymbol = 'ETH';
    }
    // EVM service 内部 chain 仅接受 ETH/BSC，其他链用 ETH 走 JSON-RPC 协议
    const serviceChain: 'ETH' | 'BSC' = (chain === 'BSC') ? 'BSC' : 'ETH';
    this.service = new EvmChainService({
      chain: serviceChain,
      apiKey: opts.apiKey,
      endpoints: opts.endpoints,
      fetchImpl: opts.fetchImpl,
      timeoutMs: opts.timeoutMs,
      fallbackToDemo: opts.fallbackToDemo,
      healthCheckMs: opts.healthCheckMs,
    });
  }

  // -------------------------------------------------------------------------
  // 余额
  // -------------------------------------------------------------------------

  async getNativeBalance(address: string): Promise<ChainBalance> {
    const b = await this.service.getNativeBalance(address);
    return mapEvmNativeBalance(b, this.chain, this.nativeSymbol, this.nativeDecimals);
  }

  async getTokenBalance(address: string, token: TokenRef): Promise<ChainBalance> {
    if (!token.contractAddress) {
      throw new Error(`getTokenBalance on EVM requires contractAddress for ${token.symbol}`);
    }
    const t = await this.service.getTokenBalance(
      address,
      token.contractAddress,
      token.symbol,
      token.decimals,
    );
    return mapEvmTokenBalance(t, this.chain);
  }

  // -------------------------------------------------------------------------
  // 链状态
  // -------------------------------------------------------------------------

  async getChainStatus(): Promise<ChainStatus> {
    const s = await this.service.getChainStatus();
    return mapEvmChainStatus(s, this.chain);
  }

  async getBlockNumber(): Promise<number> {
    const s = await this.getChainStatus();
    return s.blockNumber;
  }

  async getGasPrice(): Promise<string> {
    const s = await this.getChainStatus();
    return s.gasPrice;
  }

  // -------------------------------------------------------------------------
  // 交易
  // -------------------------------------------------------------------------

  async getTransaction(txHash: string): Promise<TransactionInfo | null> {
    const t = await this.service.getTransaction(txHash);
    return t ? mapEvmTransaction(t) : null;
  }

  async getTransactionHistory(address: string, limit: number = 10): Promise<TransactionInfo[]> {
    const list = await this.service.getTransactionHistory(address, limit);
    return list.map(mapEvmTransaction);
  }

  // -------------------------------------------------------------------------
  // 健康 / 生命周期
  // -------------------------------------------------------------------------

  async probe(): Promise<ProbeResult> {
    const start = Date.now();
    try {
      const r = await this.service.probe();
      return {
        chain: this.chain,
        reachable: r.reachable,
        healthy: r.healthy,
        blockNumber: r.blockNumber,
        latencyMs: Date.now() - start,
      };
    } catch {
      return { chain: this.chain, reachable: false, healthy: false, latencyMs: Date.now() - start };
    }
  }

  getHealth(): HealthInfo[] {
    return this.service.getHealth().map(h => mapNodeHealth(h, this.chain));
  }

  start(): void { this.service.start(); }
  stop(): void { this.service.stop(); }
}

// =============================================================================
// TRON 适配器
// =============================================================================

/**
 * 将 TronChainService 适配到 ChainClient。
 * Tron 余额单位 SUN，适配为 TRX（decimals=6）以保持业务层一致性。
 */
export class TronChainClientAdapter implements ChainClient {
  public readonly chain: ChainId = 'TRON';
  private readonly service: TronChainService;

  constructor(opts: TronAdapterOptions = {}) {
    this.service = new TronChainService({
      apiKey: opts.apiKey,
      endpoints: opts.endpoints,
      fetchImpl: opts.fetchImpl,
      timeoutMs: opts.timeoutMs,
      fallbackToDemo: opts.fallbackToDemo,
      healthCheckMs: opts.healthCheckMs,
    });
  }

  async getNativeBalance(address: string): Promise<ChainBalance> {
    const b = await this.service.getNativeBalance(address);
    return mapTronNativeBalance(b);
  }

  async getTokenBalance(address: string, token: TokenRef): Promise<ChainBalance> {
    if (!token.contractAddress) {
      throw new Error(`getTokenBalance on TRON requires contractAddress for ${token.symbol}`);
    }
    const t = await this.service.getTokenBalance(
      address,
      token.contractAddress,
      token.symbol,
      token.decimals,
    );
    return mapTronTokenBalance(t);
  }

  async getChainStatus(): Promise<ChainStatus> {
    const s = await this.service.getChainStatus();
    return mapTronChainStatus(s);
  }

  async getBlockNumber(): Promise<number> {
    const s = await this.getChainStatus();
    return s.blockNumber;
  }

  async getGasPrice(): Promise<string> {
    const s = await this.getChainStatus();
    return s.gasPrice;
  }

  async getTransaction(txHash: string): Promise<TransactionInfo | null> {
    const t = await this.service.getTransaction(txHash);
    return t ? mapTronTransaction(t) : null;
  }

  async getTransactionHistory(address: string, limit: number = 10): Promise<TransactionInfo[]> {
    const list = await this.service.getTransactionHistory(address, limit);
    return list.map(t => mapTronTransaction(t));
  }

  async probe(): Promise<ProbeResult> {
    const start = Date.now();
    try {
      const r = await this.service.probe();
      return {
        chain: this.chain,
        reachable: r.reachable,
        healthy: r.healthy,
        blockNumber: r.blockNumber,
        latencyMs: Date.now() - start,
      };
    } catch {
      return { chain: this.chain, reachable: false, healthy: false, latencyMs: Date.now() - start };
    }
  }

  getHealth(): HealthInfo[] {
    return this.service.getHealth().map(h => mapNodeHealth(h, this.chain));
  }

  start(): void { this.service.start(); }
  stop(): void { this.service.stop(); }
}

// =============================================================================
// 映射工具（Evm -> Chain）
// =============================================================================

function mapEvmNativeBalance(
  b: EvmNativeBalance,
  chain: ChainId,
  symbol: 'ETH' | 'BNB' | 'MATIC',
  decimals: number,
): ChainBalance {
  return {
    chain,
    address: b.address,
    symbol,
    decimals,
    balance: b.balance,
    balanceRaw: b.balanceWei,
    unit: b.unit,
    source: b.source,
    updatedAt: b.updatedAt,
  };
}

function mapEvmTokenBalance(t: EvmTokenBalance, chain: ChainId): ChainBalance {
  return {
    chain,
    address: t.address,
    symbol: t.symbol,
    decimals: t.decimals,
    contractAddress: t.tokenAddress,
    balance: t.balance,
    balanceRaw: t.balanceRaw,
    unit: t.symbol,
    source: t.source,
    updatedAt: t.updatedAt,
  };
}

function mapEvmChainStatus(s: EvmChainStatus, chain: ChainId): ChainStatus {
  return {
    chain,
    blockNumber: s.blockNumber,
    gasPrice: s.gasPrice,
    gasPriceUnit: s.gasPriceUnit,
    source: s.source,
    updatedAt: s.updatedAt,
  };
}

function mapEvmTransaction(t: EvmTransactionInfo): TransactionInfo {
  return {
    hash: t.hash,
    blockNumber: t.blockNumber,
    from: t.from,
    to: t.to,
    value: t.value,
    valueFormatted: t.valueFormatted,
    asset: t.asset,
    timestamp: t.timestamp,
    status: t.status,
    method: t.method,
  };
}

// =============================================================================
// 映射工具（Tron -> Chain）
// =============================================================================

function mapTronNativeBalance(b: TronNativeBalance): ChainBalance {
  return {
    chain: 'TRON',
    address: b.address,
    symbol: 'TRX',
    decimals: 6,
    balance: b.balance,
    balanceRaw: b.balanceSun,
    unit: b.unit,
    source: b.source,
    updatedAt: b.updatedAt,
  };
}

function mapTronTokenBalance(t: TronTokenBalance): ChainBalance {
  return {
    chain: 'TRON',
    address: t.address,
    symbol: t.symbol,
    decimals: t.decimals,
    contractAddress: t.contractAddress,
    balance: t.balance,
    balanceRaw: t.balanceRaw,
    unit: t.unit,
    source: t.source,
    updatedAt: t.updatedAt,
  };
}

function mapTronChainStatus(s: TronChainStatus): ChainStatus {
  return {
    chain: 'TRON',
    blockNumber: s.blockNumber,
    gasPrice: s.gasPrice,
    gasPriceUnit: s.gasPriceUnit,
    source: s.source,
    updatedAt: s.updatedAt,
  };
}

function mapTronTransaction(t: TronTransactionInfo): TransactionInfo {
  return {
    hash: t.hash,
    blockNumber: t.blockNumber,
    from: t.from,
    to: t.to,
    value: t.value,
    valueFormatted: t.valueFormatted,
    asset: t.asset,
    timestamp: t.timestamp,
    status: t.status,
    method: t.method,
  };
}

function mapNodeHealth(h: NodeHealth, chain: ChainId): HealthInfo {
  return {
    chain,
    url: h.url,
    healthy: h.healthy,
    latencyMs: h.latencyMs,
    blockNumber: h.blockNumber,
    lastCheck: h.lastCheck,
    consecutiveFailures: h.consecutiveFailures,
  };
}
