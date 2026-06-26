/**
 * Curve 协议适配器
 *
 * Curve 是稳定币 / 同类资产 AMM：
 *  - 提供稳定币 LP（USDC/USDT/DAI、3pool、stETH/ETH 等）
 *  - 流动性提供者获得 Curve LP Token
 *  - 通过 Gauge 质押 LP -> 获得 CRV 奖励
 *  - vote-locked CRV (veCRV) 可 boost 奖励
 *
 * 方法：
 *  - getApy(pool): 交易手续费 + CRV 奖励
 *  - deposit(pool, amount): 添加流动性
 *  - withdraw(pool, amount): 移除流动性
 *  - getBalance(address, pool): LP 余额
 *  - claimRewards(): 领取 CRV
 *
 * 演示降级：稳定 mock APY。
 */

import type { EvmChainService } from '../../wallet/chain-service';

// =============================================================================
// 常量
// =============================================================================

/** 演示 Gauge 合约（3pool gauge） */
export const CURVE_GAUGE_3POOL = '0xbFcF63294aD7105dEa65aA58F8F5E2698Ff57778';

/** 演示默认 APY（base = 交易手续费，reward = CRV 释放） */
const CURVE_DEMO_3POOL_BASE = 0.012;
const CURVE_DEMO_3POOL_REWARD = 0.038;
const CURVE_DEMO_STETH_BASE = 0.008;
const CURVE_DEMO_STETH_REWARD = 0.025;
const CURVE_DEMO_TVL_3POOL = '3500000000';
const CURVE_DEMO_TVL_STETH = '4500000000';

// =============================================================================
// 类型
// =============================================================================

export type CurvePoolName = '3pool' | 'stETH' | 'FRAX' | 'GUSD' | string;

export interface CurveApyResult {
  pool: CurvePoolName;
  /** 基础 APY（交易费） */
  apyBase: number;
  /** CRV 奖励 APY */
  apyReward: number;
  /** 总 APY */
  apy: number;
  tvl: string;
  source: 'rpc' | 'fallback';
}

export interface CurveDepositResult {
  txHash: string;
  /** LP Token 数量 */
  lpTokenAmount: string;
}

export interface CurveWithdrawResult {
  txHash: string;
  /** 赎回的底层资产数量 */
  actualAmount: string;
}

export interface CurveClaimResult {
  txHash: string;
  /** 领取的 CRV 数量 */
  crvAmount: string;
}

export interface CurveAdapterOptions {
  chainService?: EvmChainService;
  gaugeAddress?: string;
  fetchImpl?: typeof fetch;
  forceFallback?: boolean;
}

// =============================================================================
// CurveAdapter
// =============================================================================

export class CurveAdapter {
  readonly protocol = 'CURVE' as const;
  readonly gaugeAddress: string;
  private readonly chainService?: EvmChainService;
  private readonly forceFallback: boolean;

  constructor(opts: CurveAdapterOptions = {}) {
    this.gaugeAddress = opts.gaugeAddress || CURVE_GAUGE_3POOL;
    this.chainService = opts.chainService;
    this.forceFallback = !!opts.forceFallback;
  }

  /**
   * 查询 Curve 池子 APY
   */
  async getApy(pool: CurvePoolName): Promise<CurveApyResult> {
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
   * 添加流动性 -> LP Token
   */
  async deposit(pool: CurvePoolName, amount: string, fromAddress: string = '0x0000000000000000000000000000000000000000'): Promise<CurveDepositResult> {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Amount must be > 0');
    }
    // Curve LP Token 演示：amount * 0.99
    const lpTokenAmount = (parseFloat(amount) * 0.99).toFixed(8);
    return {
      txHash: this.makeTxHash('deposit', pool, amount, fromAddress),
      lpTokenAmount,
    };
  }

  /**
   * 移除流动性
   */
  async withdraw(pool: CurvePoolName, amount: string, fromAddress: string = '0x0000000000000000000000000000000000000000'): Promise<CurveWithdrawResult> {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Amount must be > 0');
    }
    return {
      txHash: this.makeTxHash('withdraw', pool, amount, fromAddress),
      actualAmount: amount,
    };
  }

  /**
   * 查询 LP Token 余额
   */
  async getBalance(address: string, pool: CurvePoolName): Promise<string> {
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
   * 领取 CRV 奖励（通过 LiquidityGauge.claimable_tokens -> claim_rewards）
   */
  async claimRewards(fromAddress: string = '0x0000000000000000000000000000000000000000'): Promise<CurveClaimResult> {
    return {
      txHash: this.makeTxHash('claim', 'CRV', '0', fromAddress),
      crvAmount: '1.2',
    };
  }

  // -------------------------------------------------------------------------
  // 内部：演示降级
  // -------------------------------------------------------------------------

  private demoApy(pool: CurvePoolName): CurveApyResult {
    if (pool === '3pool') {
      return {
        pool,
        apyBase: CURVE_DEMO_3POOL_BASE,
        apyReward: CURVE_DEMO_3POOL_REWARD,
        apy: CURVE_DEMO_3POOL_BASE + CURVE_DEMO_3POOL_REWARD,
        tvl: CURVE_DEMO_TVL_3POOL,
        source: 'fallback',
      };
    }
    if (pool === 'stETH') {
      return {
        pool,
        apyBase: CURVE_DEMO_STETH_BASE,
        apyReward: CURVE_DEMO_STETH_REWARD,
        apy: CURVE_DEMO_STETH_BASE + CURVE_DEMO_STETH_REWARD,
        tvl: CURVE_DEMO_TVL_STETH,
        source: 'fallback',
      };
    }
    return {
      pool,
      apyBase: 0.01,
      apyReward: 0.025,
      apy: 0.035,
      tvl: '1000000000',
      source: 'fallback',
    };
  }

  private demoBalance(address: string, pool: CurvePoolName): string {
    const seed = parseInt(address.slice(2, 10) + pool.charCodeAt(0), 16);
    const bal = (seed % 8000) / 100;
    return bal.toFixed(4);
  }

  private makeTxHash(prefix: string, pool: string, amount: string, address: string): string {
    const input = `${prefix}-${pool}-${amount}-${address}-${Date.now()}`;
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = (h * 41 + input.charCodeAt(i)) >>> 0;
    }
    return '0x' + h.toString(16).padStart(8, '0').repeat(8).slice(0, 64);
  }
}

/** 创建 Curve 适配器 */
export function createCurveAdapter(opts?: CurveAdapterOptions): CurveAdapter {
  return new CurveAdapter(opts);
}
