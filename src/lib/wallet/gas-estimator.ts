/**
 * Gas 估算器（GasEstimator）
 *
 * 职责：
 *  - EIP-1559 gas 价格估算：maxFeePerGas + maxPriorityFeePerGas
 *  - 旧版 gas price 估算（兼容）
 *  - TRON 带宽估算
 *  - 加 20% buffer 防止 stuck
 *
 * 演示降级：RPC 不可用时返回稳定 mock 数据。
 */

import { RpcClient, ETH_PUBLIC_RPCS, BSC_PUBLIC_RPCS, weiToEther, etherToWei } from './rpc-client';
import { TronRpcClient, TRON_DEFAULT_ENDPOINTS, sunToTrx, SUN_PER_TRX } from './tron-rpc-client';

export type EvmChain = 'ETH' | 'BSC';
export type Chain = EvmChain | 'TRON';

export interface GasEstimateEip1559 {
  maxFeePerGas: string;        // hex (wei)
  maxPriorityFeePerGas: string; // hex (wei)
  baseFeePerGas: string;       // hex (wei)
  estimatedAt: string;
  source: 'rpc' | 'fallback';
}

export interface GasEstimateLegacy {
  gasPrice: string; // hex (wei)
  estimatedAt: string;
  source: 'rpc' | 'fallback';
}

export interface TrxBandwidthEstimate {
  /** 估算可用带宽 */
  bandwidth: number;
  /** 每次 TRX 转账消耗（标准值 270） */
  perTrxTransfer: number;
  /** 每次 TRC20 transfer 消耗（标准值 350） */
  perTrc20Transfer: number;
  estimatedAt: string;
  source: 'rpc' | 'fallback';
}

export interface GasEstimatorOptions {
  ethEndpoints?: string[];
  bscEndpoints?: string[];
  tronEndpoints?: string[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** 安全 buffer（默认 0.2 = 20%） */
  bufferMultiplier?: number;
}

const DEFAULT_BUFFER = 0.2;

// 各链的最小 maxPriorityFeePerGas 兜底值（避免 stale tip）
const FALLBACK_PRIORITY_FEE: Record<EvmChain, bigint> = {
  ETH: 1_500_000_000n,   // 1.5 gwei
  BSC: 1_000_000_000n,   // 1 gwei
};

const FALLBACK_GAS_PRICE: Record<EvmChain, bigint> = {
  ETH: 30_000_000_000n,  // 30 gwei
  BSC: 5_000_000_000n,   // 5 gwei
};

// =============================================================================
// GasEstimator 主类
// =============================================================================

export class GasEstimator {
  private readonly evmClients: Record<EvmChain, RpcClient>;
  private readonly tronClient: TronRpcClient;
  private readonly bufferMultiplier: number;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: GasEstimatorOptions = {}) {
    this.bufferMultiplier = opts.bufferMultiplier ?? DEFAULT_BUFFER;
    this.fetchImpl = opts.fetchImpl || (typeof fetch !== 'undefined' ? fetch : (() => {
      throw new Error('No fetch implementation');
    })());
    this.evmClients = {
      ETH: new RpcClient({
        endpoints: opts.ethEndpoints || ETH_PUBLIC_RPCS,
        chainName: 'ETH',
        fetchImpl: this.fetchImpl,
        timeoutMs: opts.timeoutMs,
        maxRetries: 1,
        healthCheckMs: 0,
      }),
      BSC: new RpcClient({
        endpoints: opts.bscEndpoints || BSC_PUBLIC_RPCS,
        chainName: 'BSC',
        fetchImpl: this.fetchImpl,
        timeoutMs: opts.timeoutMs,
        maxRetries: 1,
        healthCheckMs: 0,
      }),
    };
    this.tronClient = new TronRpcClient({
      endpoints: opts.tronEndpoints || TRON_DEFAULT_ENDPOINTS,
      fetchImpl: this.fetchImpl,
      timeoutMs: opts.timeoutMs,
      maxRetries: 1,
      healthCheckMs: 0,
    });
  }

  // -------------------------------------------------------------------------
  // 1. EIP-1559
  // -------------------------------------------------------------------------

  /**
   * 估算 EIP-1559 gas 价格
   *  - baseFee: 来自最新区块
   *  - maxPriorityFeePerGas: 来自历史区块（简化使用 1.5 gwei）
   *  - maxFeePerGas: baseFee * 2 + priorityFee（足够覆盖未来 6 个区块波动）
   *  - 加 buffer 防止 stuck
   */
  async estimateEip1559(chain: EvmChain): Promise<GasEstimateEip1559> {
    const client = this.evmClients[chain];
    try {
      const [blockHex, gasHex] = await client.batch<string>([
        { method: 'eth_blockNumber' },
        { method: 'eth_gasPrice' },
      ]);
      // baseFee ≈ eth_gasPrice（简化处理；实际应从 eth_getBlockByNumber('latest') 中读取 baseFeePerGas）
      const baseFee = BigInt(gasHex);
      const priorityFee = FALLBACK_PRIORITY_FEE[chain];
      // maxFeePerGas = baseFee * 2 + priorityFee（覆盖 6 个区块）
      const maxFeePerGas = baseFee * 2n + priorityFee;
      // 加 buffer
      const buffered = BigInt(Math.ceil(Number(maxFeePerGas) * (1 + this.bufferMultiplier)));
      return {
        maxFeePerGas: '0x' + buffered.toString(16),
        maxPriorityFeePerGas: '0x' + priorityFee.toString(16),
        baseFeePerGas: '0x' + baseFee.toString(16),
        estimatedAt: new Date().toISOString(),
        source: 'rpc',
      };
    } catch (err) {
      return this.fallbackEip1559(chain, err as Error);
    }
  }

  // -------------------------------------------------------------------------
  // 2. Legacy
  // -------------------------------------------------------------------------

  /** 旧版 gas price 估算（兼容老交易） */
  async estimateLegacy(chain: EvmChain): Promise<GasEstimateLegacy> {
    const client = this.evmClients[chain];
    try {
      const gasHex = await client.call<string>('eth_gasPrice');
      const gasPrice = BigInt(gasHex);
      const buffered = BigInt(Math.ceil(Number(gasPrice) * (1 + this.bufferMultiplier)));
      return {
        gasPrice: '0x' + buffered.toString(16),
        estimatedAt: new Date().toISOString(),
        source: 'rpc',
      };
    } catch (err) {
      return this.fallbackLegacy(chain, err as Error);
    }
  }

  // -------------------------------------------------------------------------
  // 3. TRON 带宽
  // -------------------------------------------------------------------------

  /**
   * TRON 带宽估算
   *  - 默认每个账户 1500 带宽（免费额度）
   *  - TRX 转账消耗 270 带宽
   *  - TRC20 transfer 消耗 350 带宽
   *  - 若不够需冻结 TRX 获取额外带宽（每 1 TRX = 600 带宽）
   */
  async estimateTrxBandwidth(address?: string): Promise<TrxBandwidthEstimate> {
    // TRON 带宽是账户级属性，简化查询 account info
    if (address) {
      try {
        const res = await this.tronClient.request<any>(`/v1/accounts/${address}`);
        const acc = Array.isArray(res?.data) ? res.data[0] : res?.data;
        const freeNet = Number(acc?.free_net_usage_remaining ?? 1500);
        return {
          bandwidth: freeNet,
          perTrxTransfer: 270,
          perTrc20Transfer: 350,
          estimatedAt: new Date().toISOString(),
          source: 'rpc',
        };
      } catch (err) {
        return this.fallbackTrxBandwidth(err as Error);
      }
    }
    return this.fallbackTrxBandwidth(new Error('No address provided'));
  }

  // -------------------------------------------------------------------------
  // 演示降级
  // -------------------------------------------------------------------------

  private fallbackEip1559(chain: EvmChain, _err: Error): GasEstimateEip1559 {
    const baseFee = FALLBACK_GAS_PRICE[chain];
    const priorityFee = FALLBACK_PRIORITY_FEE[chain];
    const maxFee = baseFee * 2n + priorityFee;
    const buffered = BigInt(Math.ceil(Number(maxFee) * (1 + this.bufferMultiplier)));
    return {
      maxFeePerGas: '0x' + buffered.toString(16),
      maxPriorityFeePerGas: '0x' + priorityFee.toString(16),
      baseFeePerGas: '0x' + baseFee.toString(16),
      estimatedAt: new Date().toISOString(),
      source: 'fallback',
    };
  }

  private fallbackLegacy(chain: EvmChain, _err: Error): GasEstimateLegacy {
    const gasPrice = FALLBACK_GAS_PRICE[chain];
    const buffered = BigInt(Math.ceil(Number(gasPrice) * (1 + this.bufferMultiplier)));
    return {
      gasPrice: '0x' + buffered.toString(16),
      estimatedAt: new Date().toISOString(),
      source: 'fallback',
    };
  }

  private fallbackTrxBandwidth(_err: Error): TrxBandwidthEstimate {
    return {
      bandwidth: 1500,
      perTrxTransfer: 270,
      perTrc20Transfer: 350,
      estimatedAt: new Date().toISOString(),
      source: 'fallback',
    };
  }

  /** 关闭后台资源 */
  close(): void {
    for (const chain of Object.keys(this.evmClients) as EvmChain[]) {
      this.evmClients[chain].stopHealthCheck();
    }
  }
}

// =============================================================================
// 工厂
// =============================================================================

/** 创建 ETH 链 gas 估算器 */
export function createEthGasEstimator(fetchImpl?: typeof fetch): GasEstimator {
  return new GasEstimator({ fetchImpl });
}

/** 创建 BSC 链 gas 估算器 */
export function createBscGasEstimator(fetchImpl?: typeof fetch): GasEstimator {
  return new GasEstimator({ fetchImpl });
}

// 抑制未使用变量
void weiToEther;
void etherToWei;
void sunToTrx;
void SUN_PER_TRX;
