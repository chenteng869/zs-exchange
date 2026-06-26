/**
 * 流动性池 (Liquidity Pool)
 *
 * 模拟 AMM (x*y=k) 自动做市商
 *  - 添加/移除流动性
 *  - 计算 LP 份额
 *  - TVL 统计
 */

import type { ID } from '@/types/models';

// =============================================================================
// 类型
// =============================================================================

export interface Pool {
  id: ID;
  baseAsset: string;
  quoteAsset: string;
  baseReserve: string;   // 储备 base 数量
  quoteReserve: string;  // 储备 quote 数量
  lpSupply: string;      // LP token 总量
  apr: number;           // %
  feeRate: number;       // 0.003 = 0.3%
  tvlUsdt: string;
  volume24h: string;
  createdAt: string;
}

export interface LPPosition {
  id: ID;
  userId: ID;
  poolId: ID;
  lpAmount: string;      // LP 份额
  shareRatio: number;    // 0.05 = 5%
  depositedAt: string;
}

// =============================================================================
// 工具
// =============================================================================

const k = (base: string, quote: string): string =>
  (parseFloat(base) * parseFloat(quote)).toFixed(8);

const sqrt = (n: number): number => Math.sqrt(n);

const decMul = (a: string, b: number | string): string =>
  (parseFloat(a) * parseFloat(String(b))).toFixed(8);

const decDiv = (a: string, b: number | string): string =>
  (parseFloat(a) / parseFloat(String(b))).toFixed(8);

// =============================================================================
// LiquidityService
// =============================================================================

export class LiquidityService {
  private pools: Map<ID, Pool> = new Map();
  private positions: Map<ID, LPPosition> = new Map();
  private userPositions: Map<ID, Set<ID>> = new Map();

  createPool(pool: Omit<Pool, 'lpSupply' | 'tvlUsdt' | 'volume24h' | 'createdAt'>): Pool {
    const full: Pool = {
      ...pool,
      lpSupply: '0',
      tvlUsdt: '0',
      volume24h: '0',
      createdAt: new Date().toISOString(),
    };
    this.pools.set(pool.id, full);
    return full;
  }

  getPool(id: ID): Pool | undefined {
    return this.pools.get(id);
  }

  getAllPools(): Pool[] {
    return Array.from(this.pools.values());
  }

  /**
   * 添加流动性（首次为初始建池）
   */
  addLiquidity(userId: ID, poolId: ID, baseAmount: string, quoteAmount: string): LPPosition {
    const pool = this.pools.get(poolId);
    if (!pool) throw new Error('Pool not found');
    if (parseFloat(baseAmount) <= 0 || parseFloat(quoteAmount) <= 0) {
      throw new Error('Amounts must be positive');
    }
    // 计算 LP
    const baseF = parseFloat(baseAmount);
    const quoteF = parseFloat(quoteAmount);
    const lpSupplyF = parseFloat(pool.lpSupply);

    let lpAmount: number;
    if (lpSupplyF === 0) {
      // 首次：LP = sqrt(base * quote)
      lpAmount = sqrt(baseF * quoteF);
    } else {
      // 非首次：LP = min(base/baseReserve, quote/quoteReserve) * lpSupply
      const fromBase = (baseF / parseFloat(pool.baseReserve)) * lpSupplyF;
      const fromQuote = (quoteF / parseFloat(pool.quoteReserve)) * lpSupplyF;
      lpAmount = Math.min(fromBase, fromQuote);
    }

    pool.baseReserve = (parseFloat(pool.baseReserve) + baseF).toFixed(8);
    pool.quoteReserve = (parseFloat(pool.quoteReserve) + quoteF).toFixed(8);
    pool.lpSupply = (lpSupplyF + lpAmount).toFixed(8);
    pool.tvlUsdt = decMul(k(pool.baseReserve, pool.quoteReserve), '0.5');

    const id = `lp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const pos: LPPosition = {
      id,
      userId,
      poolId,
      lpAmount: lpAmount.toFixed(8),
      shareRatio: lpAmount / parseFloat(pool.lpSupply),
      depositedAt: new Date().toISOString(),
    };
    this.positions.set(id, pos);
    this.attachToUser(userId, id);
    return pos;
  }

  /**
   * 移除流动性
   */
  removeLiquidity(userId: ID, positionId: ID): { base: string; quote: string } {
    const pos = this.positions.get(positionId);
    if (!pos) throw new Error('Position not found');
    if (pos.userId !== userId) throw new Error('Not owner');
    const pool = this.pools.get(pos.poolId);
    if (!pool) throw new Error('Pool not found');

    const lpF = parseFloat(pos.lpAmount);
    const supplyF = parseFloat(pool.lpSupply);
    const ratio = lpF / supplyF;

    const baseOut = (parseFloat(pool.baseReserve) * ratio).toFixed(8);
    const quoteOut = (parseFloat(pool.quoteReserve) * ratio).toFixed(8);

    pool.baseReserve = (parseFloat(pool.baseReserve) - parseFloat(baseOut)).toFixed(8);
    pool.quoteReserve = (parseFloat(pool.quoteReserve) - parseFloat(quoteOut)).toFixed(8);
    pool.lpSupply = (supplyF - lpF).toFixed(8);

    this.positions.delete(positionId);
    return { base: baseOut, quote: quoteOut };
  }

  /**
   * 计算 swap 输出（带 0.3% 手续费）
   *   amountIn + 0.3% fee
   */
  getSwapOutput(poolId: ID, assetIn: string, amountIn: string): { amountOut: string; priceImpact: string; fee: string } {
    const pool = this.pools.get(poolId);
    if (!pool) throw new Error('Pool not found');
    const inF = parseFloat(amountIn);
    const isBaseIn = assetIn === pool.baseAsset;
    const inReserve = parseFloat(isBaseIn ? pool.baseReserve : pool.quoteReserve);
    const outReserve = parseFloat(isBaseIn ? pool.quoteReserve : pool.baseReserve);
    // 0.3% 手续费
    const inWithFee = inF * (1 - pool.feeRate);
    // x*y=k 恒定乘积
    const amountOut = (inWithFee * outReserve) / (inReserve + inWithFee);
    const priceImpact = (inF / inReserve) * 100;
    return {
      amountOut: amountOut.toFixed(8),
      priceImpact: priceImpact.toFixed(4),
      fee: decMul(amountIn, pool.feeRate),
    };
  }

  getUserPositions(userId: ID): LPPosition[] {
    const ids = this.userPositions.get(userId) ?? new Set();
    return Array.from(ids)
      .map((id) => this.positions.get(id))
      .filter((p): p is LPPosition => Boolean(p));
  }

  private attachToUser(userId: ID, posId: ID): void {
    let set = this.userPositions.get(userId);
    if (!set) {
      set = new Set();
      this.userPositions.set(userId, set);
    }
    set.add(posId);
  }
}

// 重新导出工具（供测试）
export const helpers = { k, sqrt, decMul, decDiv };
