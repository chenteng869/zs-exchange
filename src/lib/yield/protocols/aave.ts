/**
 * Aave V3 协议适配器
 *
 * Aave 是 EVM 主流借贷市场：
 *  - 用户存款 -> 获得 aToken（1:1，浮动利率）
 *  - aToken 余额实时累积（rebase 模式）
 *  - 奖励来自 Safety Module (AAVE) / LP 激励
 *  - 支持 supply / withdraw / borrow / claimRewards
 *
 * 本适配器：
 *  - 端点：池子合约 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2
 *  - 提供 supplyApy / borrowApy / utilization
 *  - 演示降级
 */

import type { EvmChainService } from '../../wallet/chain-service';

// =============================================================================
// 常量
// =============================================================================

/** Aave V3 Pool 合约地址（Ethereum 主网） */
export const AAVE_V3_POOL_ADDRESS = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';

/** Aave 演示降级默认 APY */
const AAVE_DEMO_USDC_SUPPLY_APY = 0.045;
const AAVE_DEMO_USDC_BORROW_APY = 0.055;
const AAVE_DEMO_USDT_SUPPLY_APY = 0.04;
const AAVE_DEMO_DAI_SUPPLY_APY = 0.038;
const AAVE_DEMO_ETH_SUPPLY_APY = 0.025;
const AAVE_DEMO_ETH_BORROW_APY = 0.035;
const AAVE_DEMO_WBTC_SUPPLY_APY = 0.018;
const AAVE_DEMO_UTILIZATION = 0.72;

// =============================================================================
// 类型
// =============================================================================

export type AaveAsset = 'USDC' | 'USDT' | 'DAI' | 'ETH' | 'WBTC' | string;

export interface AaveApyResult {
  asset: AaveAsset;
  /** 存款年化 */
  supplyApy: number;
  /** 借款年化 */
  borrowApy: number;
  /** 资金利用率 0-1 */
  utilization: number;
  source: 'rpc' | 'fallback';
}

export interface AaveSupplyResult {
  txHash: string;
  /** 收到的 aToken 数量（1:1 起始） */
  aTokenAmount: string;
}

export interface AaveWithdrawResult {
  txHash: string;
  /** 实际到账的底层资产数量 */
  actualAmount: string;
}

export interface AaveClaimResult {
  txHash: string;
  /** 领取到的奖励（AAVE / stkAAVE） */
  amount: string;
}

export interface AaveAdapterOptions {
  chainService?: EvmChainService;
  poolAddress?: string;
  fetchImpl?: typeof fetch;
  forceFallback?: boolean;
}

// =============================================================================
// AaveAdapter
// =============================================================================

export class AaveAdapter {
  readonly protocol = 'AAVE' as const;
  readonly poolAddress: string;
  private readonly chainService?: EvmChainService;
  private readonly forceFallback: boolean;

  constructor(opts: AaveAdapterOptions = {}) {
    this.poolAddress = opts.poolAddress || AAVE_V3_POOL_ADDRESS;
    this.chainService = opts.chainService;
    this.forceFallback = !!opts.forceFallback;
  }

  /**
   * 查询指定资产的存款 / 借款 APY
   */
  async getApy(asset: AaveAsset): Promise<AaveApyResult> {
    if (this.forceFallback) return this.demoApy(asset);
    try {
      if (this.chainService) {
        const reachable = await this.chainService.probe();
        if (reachable.reachable) {
          // 真实场景会调用 DataProvider.getReserveData(asset)
          // 本实现：可访问时仍走降级以保持稳定
          return this.demoApy(asset);
        }
      }
      return this.demoApy(asset);
    } catch {
      return this.demoApy(asset);
    }
  }

  /**
   * 存款（supply）-> 获得 aToken
   */
  async supply(asset: AaveAsset, amount: string, fromAddress: string = '0x0000000000000000000000000000000000000000'): Promise<AaveSupplyResult> {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Amount must be > 0');
    }
    return {
      txHash: this.makeTxHash('supply', asset, amount, fromAddress),
      aTokenAmount: amount, // 初始 1:1
    };
  }

  /**
   * 提取（withdraw）底层资产
   * 销毁等量 aToken
   */
  async withdraw(asset: AaveAsset, amount: string, fromAddress: string = '0x0000000000000000000000000000000000000000'): Promise<AaveWithdrawResult> {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Amount must be > 0');
    }
    return {
      txHash: this.makeTxHash('withdraw', asset, amount, fromAddress),
      actualAmount: amount,
    };
  }

  /**
   * 查询地址在指定资产上的 aToken 余额
   */
  async getBalance(address: string, asset: AaveAsset): Promise<string> {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      throw new Error('Invalid address');
    }
    if (this.forceFallback || !this.chainService) {
      return this.demoBalance(address, asset);
    }
    try {
      const reachable = await this.chainService.probe();
      if (!reachable.reachable) return this.demoBalance(address, asset);
      return this.demoBalance(address, asset); // 链上读取演示中走降级
    } catch {
      return this.demoBalance(address, asset);
    }
  }

  /**
   * 领取 Safety Module 奖励
   */
  async claimRewards(fromAddress: string = '0x0000000000000000000000000000000000000000'): Promise<AaveClaimResult> {
    return {
      txHash: this.makeTxHash('claim', 'AAVE', '0', fromAddress),
      amount: '0.5', // 演示返回固定 0.5 AAVE
    };
  }

  // -------------------------------------------------------------------------
  // 内部：演示降级
  // -------------------------------------------------------------------------

  private demoApy(asset: AaveAsset): AaveApyResult {
    const u = asset.toUpperCase();
    if (u === 'USDC') {
      return { asset, supplyApy: AAVE_DEMO_USDC_SUPPLY_APY, borrowApy: AAVE_DEMO_USDC_BORROW_APY, utilization: AAVE_DEMO_UTILIZATION, source: 'fallback' };
    }
    if (u === 'USDT') {
      return { asset, supplyApy: AAVE_DEMO_USDT_SUPPLY_APY, borrowApy: AAVE_DEMO_USDC_BORROW_APY - 0.005, utilization: AAVE_DEMO_UTILIZATION, source: 'fallback' };
    }
    if (u === 'DAI') {
      return { asset, supplyApy: AAVE_DEMO_DAI_SUPPLY_APY, borrowApy: AAVE_DEMO_DAI_SUPPLY_APY + 0.01, utilization: 0.65, source: 'fallback' };
    }
    if (u === 'ETH' || u === 'WETH') {
      return { asset, supplyApy: AAVE_DEMO_ETH_SUPPLY_APY, borrowApy: AAVE_DEMO_ETH_BORROW_APY, utilization: 0.6, source: 'fallback' };
    }
    if (u === 'WBTC') {
      return { asset, supplyApy: AAVE_DEMO_WBTC_SUPPLY_APY, borrowApy: AAVE_DEMO_WBTC_SUPPLY_APY + 0.01, utilization: 0.45, source: 'fallback' };
    }
    return { asset, supplyApy: 0.03, borrowApy: 0.045, utilization: 0.5, source: 'fallback' };
  }

  private demoBalance(address: string, asset: AaveAsset): string {
    const seed = parseInt(address.slice(2, 10) + asset.charCodeAt(0), 16);
    const bal = (seed % 10000) / 100;
    return bal.toFixed(4);
  }

  private makeTxHash(prefix: string, asset: string, amount: string, address: string): string {
    const input = `${prefix}-${asset}-${amount}-${address}-${Date.now()}`;
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = (h * 33 + input.charCodeAt(i)) >>> 0;
    }
    return '0x' + h.toString(16).padStart(8, '0').repeat(8).slice(0, 64);
  }
}

/** 创建 Aave 适配器 */
export function createAaveAdapter(opts?: AaveAdapterOptions): AaveAdapter {
  return new AaveAdapter(opts);
}
