/**
 * Convex 协议适配器
 *
 * Convex 是 Curve 的 yield 包装层：
 *  - 用户存入 Curve LP Token -> 获得 Convex deposit Token (cvxCRV / stkCVX 等)
 *  - Convex 自动 vote-lock 用户的 Curve LP，最大化 boost
 *  - 用户获得 Curve 交易费 + CRV + CVX 三重奖励
 *  - boost 机制：veCRV 投票影响奖励倍数
 *
 * 方法：
 *  - getApy(pool): 三层 APY（base + CRV + CVX）
 *  - deposit(pool, amount): 包装 LP Token
 *  - withdraw(pool, amount): 赎回 LP Token
 *  - getBalance(address, pool): 包装代币余额
 *  - claimRewards(): 一次性领取 CRV + CVX
 *
 * 演示降级：稳定 mock APY。
 */

import type { EvmChainService } from '../../wallet/chain-service';

// =============================================================================
// 常量
// =============================================================================

/** Convex Booster 合约 */
export const CONVEX_BOOSTER = '0xF403C135812408BFbE8713b5A23a04b3D48AAE31';

/** Convex 默认 boost 系数（1.0 = 无 boost） */
const CONVEX_DEMO_BOOST = 1.4;

/** 演示 APY */
const CONVEX_DEMO_3POOL_BASE = 0.012;
const CONVEX_DEMO_3POOL_CRV = 0.045;
const CONVEX_DEMO_3POOL_CVX = 0.018;
const CONVEX_DEMO_STETH_BASE = 0.008;
const CONVEX_DEMO_STETH_CRV = 0.032;
const CONVEX_DEMO_STETH_CVX = 0.012;

// =============================================================================
// 类型
// =============================================================================

export type ConvexPoolName = '3pool' | 'stETH' | string;

export interface ConvexApyResult {
  pool: ConvexPoolName;
  /** Curve 交易费基础 APY */
  apyBase: number;
  /** CRV 奖励 APY（已应用 boost） */
  apyCrv: number;
  /** CVX 奖励 APY */
  apyCvx: number;
  /** 总 APY */
  apy: number;
  /** Boost 系数（演示） */
  boost: number;
  source: 'rpc' | 'fallback';
}

export interface ConvexDepositResult {
  txHash: string;
  /** 包装代币（cvx deposit token）数量 */
  wrappedAmount: string;
}

export interface ConvexWithdrawResult {
  txHash: string;
  /** 赎回的 Curve LP 数量 */
  actualAmount: string;
}

export interface ConvexClaimResult {
  txHash: string;
  /** 领取的 CRV + CVX 总价值（演示） */
  totalAmount: string;
  crvAmount: string;
  cvxAmount: string;
}

export interface ConvexAdapterOptions {
  chainService?: EvmChainService;
  boosterAddress?: string;
  fetchImpl?: typeof fetch;
  forceFallback?: boolean;
}

// =============================================================================
// ConvexAdapter
// =============================================================================

export class ConvexAdapter {
  readonly protocol = 'CONVEX' as const;
  readonly boosterAddress: string;
  private readonly chainService?: EvmChainService;
  private readonly forceFallback: boolean;

  constructor(opts: ConvexAdapterOptions = {}) {
    this.boosterAddress = opts.boosterAddress || CONVEX_BOOSTER;
    this.chainService = opts.chainService;
    this.forceFallback = !!opts.forceFallback;
  }

  /**
   * 查询 Convex 池子 APY
   */
  async getApy(pool: ConvexPoolName): Promise<ConvexApyResult> {
    if (this.forceFallback) return this.demoApy(pool);
    try {
      if (this.chainService) {
        const reachable = await this.chainService.probe();
        if (reachable.reachable) return this.demoApy(pool);
      }
      return this.demoApy(pool);
    } catch {
      return this.demoApy(pool);
    }
  }

  /**
   * 存入 Curve LP Token -> Convex 包装
   */
  async deposit(pool: ConvexPoolName, amount: string, fromAddress: string = '0x0000000000000000000000000000000000000000'): Promise<ConvexDepositResult> {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Amount must be > 0');
    }
    return {
      txHash: this.makeTxHash('deposit', pool, amount, fromAddress),
      wrappedAmount: amount, // 1:1 包装
    };
  }

  /**
   * 赎回 Convex 包装 -> Curve LP
   */
  async withdraw(pool: ConvexPoolName, amount: string, fromAddress: string = '0x0000000000000000000000000000000000000000'): Promise<ConvexWithdrawResult> {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Amount must be > 0');
    }
    return {
      txHash: this.makeTxHash('withdraw', pool, amount, fromAddress),
      actualAmount: amount,
    };
  }

  /**
   * 查询 Convex 包装代币余额
   */
  async getBalance(address: string, pool: ConvexPoolName): Promise<string> {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      throw new Error('Invalid address');
    }
    if (this.forceFallback || !this.chainService) {
      return this.demoBalance(address, pool);
    }
    try {
      const reachable = await this.chainService.probe();
      if (!reachable.reachable) return this.demoBalance(address, pool);
      return this.demoBalance(address, pool);
    } catch {
      return this.demoBalance(address, pool);
    }
  }

  /**
   * 一次性领取 CRV + CVX 奖励
   */
  async claimRewards(fromAddress: string = '0x0000000000000000000000000000000000000000'): Promise<ConvexClaimResult> {
    return {
      txHash: this.makeTxHash('claim', 'CRV+CVX', '0', fromAddress),
      crvAmount: '1.5',
      cvxAmount: '0.8',
      totalAmount: '2.3',
    };
  }

  /**
   * 模拟 boost 系数（用户持有 Convex LP 时长影响）
   */
  calculateBoost(lpAmount: string, baseBoost: number = 1.0): number {
    // 持有越多 boost 越高，封顶 2.5
    const v = parseFloat(lpAmount);
    if (v <= 0) return baseBoost;
    return Math.min(2.5, baseBoost + Math.log10(1 + v) * 0.2);
  }

  // -------------------------------------------------------------------------
  // 内部：演示降级
  // -------------------------------------------------------------------------

  private demoApy(pool: ConvexPoolName): ConvexApyResult {
    if (pool === '3pool') {
      const apy = CONVEX_DEMO_3POOL_BASE + CONVEX_DEMO_3POOL_CRV + CONVEX_DEMO_3POOL_CVX;
      return {
        pool,
        apyBase: CONVEX_DEMO_3POOL_BASE,
        apyCrv: CONVEX_DEMO_3POOL_CRV,
        apyCvx: CONVEX_DEMO_3POOL_CVX,
        apy,
        boost: CONVEX_DEMO_BOOST,
        source: 'fallback',
      };
    }
    if (pool === 'stETH') {
      const apy = CONVEX_DEMO_STETH_BASE + CONVEX_DEMO_STETH_CRV + CONVEX_DEMO_STETH_CVX;
      return {
        pool,
        apyBase: CONVEX_DEMO_STETH_BASE,
        apyCrv: CONVEX_DEMO_STETH_CRV,
        apyCvx: CONVEX_DEMO_STETH_CVX,
        apy,
        boost: CONVEX_DEMO_BOOST,
        source: 'fallback',
      };
    }
    return {
      pool,
      apyBase: 0.01,
      apyCrv: 0.03,
      apyCvx: 0.01,
      apy: 0.05,
      boost: CONVEX_DEMO_BOOST,
      source: 'fallback',
    };
  }

  private demoBalance(address: string, pool: ConvexPoolName): string {
    const seed = parseInt(address.slice(2, 10) + pool.charCodeAt(0), 16);
    const bal = (seed % 6000) / 100;
    return bal.toFixed(4);
  }

  private makeTxHash(prefix: string, pool: string, amount: string, address: string): string {
    const input = `${prefix}-${pool}-${amount}-${address}-${Date.now()}`;
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = (h * 43 + input.charCodeAt(i)) >>> 0;
    }
    return '0x' + h.toString(16).padStart(8, '0').repeat(8).slice(0, 64);
  }
}

/** 创建 Convex 适配器 */
export function createConvexAdapter(opts?: ConvexAdapterOptions): ConvexAdapter {
  return new ConvexAdapter(opts);
}
