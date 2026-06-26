/**
 * 代币兑换 (Swap)
 *
 * - 直接兑换（同一池子）
 * - 三角兑换（base -> 中间币 -> quote）
 * - 滑点保护
 */

import type { ID } from '@/types/models';
import { LiquidityService } from './liquidity';

export interface SwapQuote {
  path: string[];              // 兑换路径
  amountIn: string;
  amountOut: string;
  priceImpact: string;         // %
  minReceived: string;         // amountOut * (1 - slippage)
  fee: string;
  feeRate: number;
}

export interface SwapParams {
  fromAsset: string;
  toAsset: string;
  amountIn: string;
  slippageBps?: number;        // 滑点（基点），默认 50 = 0.5%
}

export class SwapService {
  constructor(private readonly liquidity: LiquidityService) {}

  /**
   * 报价
   */
  quote(fromAsset: string, toAsset: string, amountIn: string, slippageBps: number = 50): SwapQuote {
    if (fromAsset === toAsset) throw new Error('Same asset');

    const pools = this.liquidity.getAllPools();

    // 1) 寻找直接兑换池
    const direct = pools.find(
      (p) =>
        (p.baseAsset === fromAsset && p.quoteAsset === toAsset) ||
        (p.baseAsset === toAsset && p.quoteAsset === fromAsset),
    );
    if (direct) {
      const out = this.liquidity.getSwapOutput(direct.id, fromAsset, amountIn);
      return {
        path: [fromAsset, toAsset],
        amountIn,
        amountOut: out.amountOut,
        priceImpact: out.priceImpact,
        minReceived: (parseFloat(out.amountOut) * (1 - slippageBps / 10_000)).toFixed(8),
        fee: out.fee,
        feeRate: direct.feeRate,
      };
    }

    // 2) 三角兑换：from -> USDT -> to
    const hop1 = pools.find(
      (p) =>
        (p.baseAsset === fromAsset && p.quoteAsset === 'USDT') ||
        (p.baseAsset === 'USDT' && p.quoteAsset === fromAsset),
    );
    const hop2 = pools.find(
      (p) =>
        (p.baseAsset === toAsset && p.quoteAsset === 'USDT') ||
        (p.baseAsset === 'USDT' && p.quoteAsset === toAsset),
    );
    if (hop1 && hop2) {
      const mid1 = this.liquidity.getSwapOutput(hop1.id, fromAsset, amountIn);
      const mid2 = this.liquidity.getSwapOutput(hop2.id, 'USDT', mid1.amountOut);
      return {
        path: [fromAsset, 'USDT', toAsset],
        amountIn,
        amountOut: mid2.amountOut,
        priceImpact: (parseFloat(mid1.priceImpact) + parseFloat(mid2.priceImpact)).toFixed(4),
        minReceived: (parseFloat(mid2.amountOut) * (1 - slippageBps / 10_000)).toFixed(8),
        fee: (parseFloat(mid1.fee) + parseFloat(mid2.fee)).toFixed(8),
        feeRate: hop1.feeRate,
      };
    }

    throw new Error('No route found');
  }

  /**
   * 执行兑换
   */
  swap(userId: ID, params: SwapParams): SwapQuote {
    const q = this.quote(params.fromAsset, params.toAsset, params.amountIn, params.slippageBps);
    if (parseFloat(q.amountOut) < parseFloat(q.minReceived)) {
      throw new Error('Slippage exceeded');
    }
    return q;
  }
}
