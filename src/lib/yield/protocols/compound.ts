/**
 * Compound V3 (Comet) 协议适配器
 *
 * Compound 是 EVM 老牌借贷协议：
 *  - 用户存款 -> 获得 cToken（v2）或 baseToken + cToken（v3 Comet）
 *  - 本实现以 v3 Comet 为准，简化模型
 *  - 端点：https://api.compound.finance/api/v2
 *
 * 方法：
 *  - getApy(asset): 存款 / 借款 APY + 利用率
 *  - supply(asset, amount): 存款
 *  - withdraw(asset, amount): 提款
 *  - getBalance(address, asset): 余额
 *  - claimRewards(): 领取 COMP 奖励
 *
 * 演示降级：使用稳定 mock APY。
 */

import type { EvmChainService } from '../../wallet/chain-service';

// =============================================================================
// 常量
// =============================================================================

/** Compound 公共 API v2（参考） */
export const COMPOUND_API_BASE = 'https://api.compound.finance/api/v2';

/** 演示降级默认 APY */
const COMPOUND_DEMO_USDC_SUPPLY = 0.042;
const COMPOUND_DEMO_USDC_BORROW = 0.058;
const COMPOUND_DEMO_ETH_SUPPLY = 0.022;
const COMPOUND_DEMO_ETH_BORROW = 0.032;
const COMPOUND_DEMO_UTIL = 0.68;

// =============================================================================
// 类型
// =============================================================================

export type CompoundAsset = 'USDC' | 'ETH' | 'WBTC' | 'cETH' | 'cUSDC' | 'cDAI' | string;

export interface CompoundApyResult {
  asset: CompoundAsset;
  supplyApy: number;
  borrowApy: number;
  utilization: number;
  /** 治理代币 COMP 奖励年化（可选） */
  compRewardsApy: number;
  source: 'rpc' | 'fallback';
}

export interface CompoundSupplyResult {
  txHash: string;
  cTokenAmount: string;
}

export interface CompoundWithdrawResult {
  txHash: string;
  actualAmount: string;
}

export interface CompoundClaimResult {
  txHash: string;
  amount: string;
}

export interface CompoundAdapterOptions {
  chainService?: EvmChainService;
  apiBase?: string;
  fetchImpl?: typeof fetch;
  forceFallback?: boolean;
}

// =============================================================================
// CompoundAdapter
// =============================================================================

export class CompoundAdapter {
  readonly protocol = 'COMPOUND' as const;
  readonly apiBase: string;
  private readonly chainService?: EvmChainService;
  private readonly forceFallback: boolean;

  constructor(opts: CompoundAdapterOptions = {}) {
    this.apiBase = opts.apiBase || COMPOUND_API_BASE;
    this.chainService = opts.chainService;
    this.forceFallback = !!opts.forceFallback;
  }

  /**
   * 查询 APY
   * 真实场景会 GET {apiBase}/ctoken?addresses=cUSDC,...  解码 supplyRatePerBlock
   */
  async getApy(asset: CompoundAsset): Promise<CompoundApyResult> {
    if (this.forceFallback) return this.demoApy(asset);
    try {
      if (this.chainService) {
        const reachable = await this.chainService.probe();
        if (reachable.reachable) {
          return this.demoApy(asset);
        }
      }
      return this.demoApy(asset);
    } catch {
      return this.demoApy(asset);
    }
  }

  /**
   * 存款获得 cToken
   * 汇率模型：cToken 数量 = amount * 1e18 / exchangeRateCurrent
   * 演示假设 exchangeRate = 0.02（每 cToken 对应 0.02 底层），cToken = amount * 50
   */
  async supply(asset: CompoundAsset, amount: string, fromAddress: string = '0x0000000000000000000000000000000000000000'): Promise<CompoundSupplyResult> {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Amount must be > 0');
    }
    const exchangeRate = 0.02;
    const cTokenAmount = (parseFloat(amount) / exchangeRate).toFixed(8);
    return {
      txHash: this.makeTxHash('supply', asset, amount, fromAddress),
      cTokenAmount,
    };
  }

  /**
   * 提款销毁 cToken
   */
  async withdraw(asset: CompoundAsset, amount: string, fromAddress: string = '0x0000000000000000000000000000000000000000'): Promise<CompoundWithdrawResult> {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Amount must be > 0');
    }
    return {
      txHash: this.makeTxHash('withdraw', asset, amount, fromAddress),
      actualAmount: amount,
    };
  }

  /**
   * 查询地址的 cToken / 底层资产余额
   */
  async getBalance(address: string, asset: CompoundAsset): Promise<string> {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      throw new Error('Invalid address');
    }
    if (this.forceFallback || !this.chainService) {
      return this.demoBalance(address, asset);
    }
    try {
      const reachable = await this.chainService.probe();
      if (!reachable.reachable) return this.demoBalance(address, asset);
      return this.demoBalance(address, asset);
    } catch {
      return this.demoBalance(address, asset);
    }
  }

  /**
   * 领取 COMP 治理代币奖励
   */
  async claimRewards(fromAddress: string = '0x0000000000000000000000000000000000000000'): Promise<CompoundClaimResult> {
    return {
      txHash: this.makeTxHash('claim', 'COMP', '0', fromAddress),
      amount: '0.3',
    };
  }

  // -------------------------------------------------------------------------
  // 内部：演示降级
  // -------------------------------------------------------------------------

  private demoApy(asset: CompoundAsset): CompoundApyResult {
    const u = asset.toUpperCase();
    if (u === 'USDC' || u === 'CUSDC') {
      return {
        asset,
        supplyApy: COMPOUND_DEMO_USDC_SUPPLY,
        borrowApy: COMPOUND_DEMO_USDC_BORROW,
        utilization: COMPOUND_DEMO_UTIL,
        compRewardsApy: 0.012,
        source: 'fallback',
      };
    }
    if (u === 'ETH' || u === 'CETH') {
      return {
        asset,
        supplyApy: COMPOUND_DEMO_ETH_SUPPLY,
        borrowApy: COMPOUND_DEMO_ETH_BORROW,
        utilization: 0.55,
        compRewardsApy: 0.008,
        source: 'fallback',
      };
    }
    return {
      asset,
      supplyApy: 0.03,
      borrowApy: 0.045,
      utilization: 0.5,
      compRewardsApy: 0.01,
      source: 'fallback',
    };
  }

  private demoBalance(address: string, asset: CompoundAsset): string {
    const seed = parseInt(address.slice(2, 10) + asset.charCodeAt(0), 16);
    const bal = (seed % 5000) / 100;
    return bal.toFixed(4);
  }

  private makeTxHash(prefix: string, asset: string, amount: string, address: string): string {
    const input = `${prefix}-${asset}-${amount}-${address}-${Date.now()}`;
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = (h * 37 + input.charCodeAt(i)) >>> 0;
    }
    return '0x' + h.toString(16).padStart(8, '0').repeat(8).slice(0, 64);
  }
}

/** 创建 Compound 适配器 */
export function createCompoundAdapter(opts?: CompoundAdapterOptions): CompoundAdapter {
  return new CompoundAdapter(opts);
}
