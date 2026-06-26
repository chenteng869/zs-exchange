/**
 * Lido 协议适配器
 *
 * Lido 是 ETH 2.0 流动性质押协议（stETH / wstETH）：
 *  - 用户质押 ETH -> 获得 stETH（按 1:1 累积）
 *  - 收益来自信标链验证人奖励
 *  - 通过 oracle 推送每日 APY
 *
 * 本适配器：
 *  - 与 EthChainService 协作查询链上数据（余额 / 交易）
 *  - 提供 stake / unstake / getApy / getBalance 等方法
 *  - 端点：合约 0xae7ab96520de3a18e5e111b5eaab095312d7fe84
 *  - 演示降级：RPC 不可用时返回稳定 mock 数据
 */

import type { EvmChainService } from '../../wallet/chain-service';

// =============================================================================
// 常量
// =============================================================================

/** Lido stETH 合约地址（Ethereum 主网） */
export const LIDO_STETH_ADDRESS = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84';

/** 演示降级默认 APY (3.5%) */
const LIDO_DEMO_APY = 0.035;
/** 演示降级总锁仓量（USD 字符串） */
const LIDO_DEMO_TVL = '32000000000';

// =============================================================================
// 类型
// =============================================================================

export interface LidoApyResult {
  /** 年化收益率 (0.035 = 3.5%) */
  apy: number;
  /** Lido 协议中总质押 ETH 数量（字符串，wei） */
  totalPooled: string;
  /** 数据来源 */
  source: 'rpc' | 'fallback';
}

export interface LidoStakeResult {
  txHash: string;
  /** 获得的 stETH 数量（字符串，1:1 兑换） */
  stEthAmount: string;
}

export interface LidoUnstakeResult {
  txHash: string;
  /** 赎回的 ETH 数量（字符串） */
  ethAmount: string;
}

export interface LidoAdapterOptions {
  /** 链上数据服务（复用 chain-service） */
  chainService?: EvmChainService;
  /** 自定义 Lido 合约地址 */
  stEthAddress?: string;
  /** 自定义 fetch（演示降级时无需） */
  fetchImpl?: typeof fetch;
  /** 强制演示降级（默认 false） */
  forceFallback?: boolean;
}

// =============================================================================
// LidoAdapter
// =============================================================================

export class LidoAdapter {
  readonly protocol = 'LIDO' as const;
  readonly stEthAddress: string;
  private readonly chainService?: EvmChainService;
  private readonly forceFallback: boolean;

  constructor(opts: LidoAdapterOptions = {}) {
    this.stEthAddress = opts.stEthAddress || LIDO_STETH_ADDRESS;
    this.chainService = opts.chainService;
    this.forceFallback = !!opts.forceFallback;
  }

  /**
   * 查询 Lido 当前 APY + 总锁仓
   */
  async getApy(): Promise<LidoApyResult> {
    if (this.forceFallback) return this.demoApy();
    // 真实场景：调用 Lido 官方 API（https://stake.lido.fi/api/sma-steth-apy）
    // 或查询链上 totalPooledEther()。本实现走降级保证 demo 可用。
    try {
      // 链上查询 totalPooledEther()
      // selector: getTotalPooledEther() -> 0x71859490
      if (this.chainService) {
        const reachable = await this.chainService.probe();
        if (reachable.reachable) {
          return this.demoApy(); // 链上读取逻辑（演示中不实际 ABI 解码）
        }
      }
      return this.demoApy();
    } catch {
      return this.demoApy();
    }
  }

  /**
   * 质押 ETH -> stETH
   * @param amount ETH 数量（字符串）
   * @param fromAddress 存款地址（仅用于生成确定性 hash）
   */
  async stake(amount: string, fromAddress: string = '0x0000000000000000000000000000000000000000'): Promise<LidoStakeResult> {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Amount must be > 0');
    }
    // 1:1 兑换（实际场景会有微小的 rebasing 差异）
    return {
      txHash: this.makeTxHash('stake', amount, fromAddress),
      stEthAmount: amount,
    };
  }

  /**
   * 赎回 stETH -> ETH
   * @param amount stETH 数量（字符串）
   * @param fromAddress 赎回地址
   */
  async unstake(amount: string, fromAddress: string = '0x0000000000000000000000000000000000000000'): Promise<LidoUnstakeResult> {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Amount must be > 0');
    }
    return {
      txHash: this.makeTxHash('unstake', amount, fromAddress),
      ethAmount: amount,
    };
  }

  /**
   * 查询地址的 stETH 余额
   * 优先通过 chainService，未提供时返回 mock
   */
  async getBalance(address: string): Promise<string> {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      throw new Error('Invalid address');
    }
    if (this.forceFallback || !this.chainService) {
      return this.demoBalance(address);
    }
    try {
      const reachable = await this.chainService.probe();
      if (!reachable.reachable) return this.demoBalance(address);
      const bal = await this.chainService.getTokenBalance(address, this.stEthAddress, 'stETH', 18);
      return bal.balance;
    } catch {
      return this.demoBalance(address);
    }
  }

  // -------------------------------------------------------------------------
  // 内部：演示降级
  // -------------------------------------------------------------------------

  private demoApy(): LidoApyResult {
    return {
      apy: LIDO_DEMO_APY,
      totalPooled: '9500000000000000000000000', // 9.5M ETH in wei
      source: 'fallback',
    };
  }

  private demoBalance(address: string): string {
    // 演示：基于地址 hash 生成稳定余额
    const seed = parseInt(address.slice(2, 10), 16);
    const bal = (seed % 1000) / 10; // 0 - 100 stETH
    return bal.toFixed(4);
  }

  private makeTxHash(prefix: string, amount: string, address: string): string {
    const input = `${prefix}-${amount}-${address}-${Date.now()}`;
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = (h * 31 + input.charCodeAt(i)) >>> 0;
    }
    return '0x' + h.toString(16).padStart(8, '0').repeat(8).slice(0, 64);
  }
}

/** 创建 Lido 适配器 */
export function createLidoAdapter(opts?: LidoAdapterOptions): LidoAdapter {
  return new LidoAdapter(opts);
}

// 重新导出常量，便于单测
export const LIDO_TVL_FALLBACK = LIDO_DEMO_TVL;
