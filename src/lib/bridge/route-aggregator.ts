/**
 * 跨链桥路由聚合器
 *
 * 职责：
 *  - 并行向 4 个 provider 询价
 *  - 去重 + 排序
 *  - 按策略选择最佳路由（cheapest / fastest / most_secure / best_liquidity）
 *  - 生成带 TTL 的 Quote
 *  - 5s 内的同 quote 命中缓存
 */

import { LayerZeroBridge } from './layerzero-bridge';
import { WormholeBridge } from './wormhole-bridge';
import { StargateBridge } from './stargate-bridge';
import { AcrossBridge } from './across-bridge';
import {
  BridgeQuote,
  BridgeRoute,
  BridgeAdapterOptions,
  RouteQueryOptions,
  RouteSelectionStrategy,
  BRIDGE_QUOTE_TTL_MS,
  BRIDGE_CACHE_TTL_MS,
  genId,
  isValidEvmAddress,
} from './types';

// =============================================================================
// 缓存条目
// =============================================================================

interface CachedQuote {
  quote: BridgeQuote;
  createdAt: number;
}

// =============================================================================
// RouteAggregator
// =============================================================================

export class RouteAggregator {
  private readonly layerzero: LayerZeroBridge;
  private readonly wormhole: WormholeBridge;
  private readonly stargate: StargateBridge;
  private readonly across: AcrossBridge;
  private readonly cache: Map<string, CachedQuote> = new Map();

  constructor(opts: BridgeAdapterOptions = {}) {
    this.layerzero = new LayerZeroBridge(opts);
    this.wormhole = new WormholeBridge(opts);
    this.stargate = new StargateBridge(opts);
    this.across = new AcrossBridge(opts);
  }

  /** 直接访问 adapter（业务层用） */
  get providers() {
    return {
      layerzero: this.layerzero,
      wormhole: this.wormhole,
      stargate: this.stargate,
      across: this.across,
    };
  }

  // -------------------------------------------------------------------------
  // 询价
  // -------------------------------------------------------------------------

  /**
   * 4 provider 并行询价，返回按 totalFee 升序的路由列表
   */
  async getRoutes(opts: RouteQueryOptions): Promise<BridgeRoute[]> {
    const [lz, wh, sg, ax] = await Promise.all([
      this.safe(() => this.layerzero.buildRoute(opts)),
      this.safe(() => this.wormhole.buildRoute(opts)),
      this.safe(() => this.stargate.buildRoute(opts)),
      this.safe(() => this.across.buildRoute(opts)),
    ]);
    const routes: BridgeRoute[] = [lz, wh, sg, ax].filter((r): r is BridgeRoute => !!r);
    // 同币种去重（按 provider + 路径）—— 不同 provider 保留全部
    // 按 totalFee 升序
    routes.sort((a, b) => {
      const A = BigInt(a.totalFee);
      const B = BigInt(b.totalFee);
      return A === B ? 0 : A < B ? -1 : 1;
    });
    return routes;
  }

  /**
   * 按策略选择最佳路由
   */
  async getBestRoute(
    opts: RouteQueryOptions,
    strategy: RouteSelectionStrategy['strategy'] = 'cheapest',
  ): Promise<BridgeRoute | null> {
    const routes = await this.getRoutes(opts);
    if (routes.length === 0) return null;
    switch (strategy) {
      case 'cheapest': {
        let best = routes[0];
        for (const r of routes) {
          if (BigInt(r.totalFee) < BigInt(best.totalFee)) best = r;
        }
        return best;
      }
      case 'fastest': {
        let best = routes[0];
        for (const r of routes) {
          if (r.estimatedTime < best.estimatedTime) best = r;
        }
        return best;
      }
      case 'most_secure': {
        let best = routes[0];
        for (const r of routes) {
          if (r.securityScore > best.securityScore) best = r;
        }
        return best;
      }
      case 'best_liquidity': {
        let best = routes[0];
        for (const r of routes) {
          if (BigInt(r.liquidityAvailable) > BigInt(best.liquidityAvailable)) best = r;
        }
        return best;
      }
      default:
        return routes[0];
    }
  }

  // -------------------------------------------------------------------------
  // 报价（带 TTL + 5s 缓存）
  // -------------------------------------------------------------------------

  /**
   * 生成带 TTL 的 BridgeQuote
   * 5s 内同 opts 命中缓存直接返回
   */
  async getQuote(opts: RouteQueryOptions, userId: string, strategy: RouteSelectionStrategy['strategy'] = 'cheapest'): Promise<BridgeQuote | null> {
    // 接收方地址合法性预检
    if (opts.receiverAddress && !isValidEvmAddress(opts.receiverAddress)) {
      throw new Error(`Invalid receiver address: ${opts.receiverAddress}`);
    }
    const cacheKey = this.cacheKey(opts, strategy);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < BRIDGE_CACHE_TTL_MS && cached.quote.expiresAt > Date.now()) {
      return cached.quote;
    }

    const route = await this.getBestRoute(opts, strategy);
    if (!route) return null;

    const fromAmount = opts.amount;
    const toAmount = fromAmount; // 稳定币 1:1
    const totalFee = BigInt(route.totalFee);
    const amountBn = BigInt(fromAmount);
    const priceImpact = amountBn > 0n
      ? (totalFee * 10_000n / amountBn).toString() // bp
      : '0';
    const priceImpactPct = (Number(priceImpact) / 10_000).toFixed(6);

    const quote: BridgeQuote = {
      id: genId('quote'),
      userId,
      route,
      fromAmount,
      toAmount,
      rate: '1.0',
      priceImpact: priceImpactPct,
      expiresAt: Date.now() + BRIDGE_QUOTE_TTL_MS,
      createdAt: Date.now(),
    };

    this.cache.set(cacheKey, { quote, createdAt: Date.now() });
    // 限制缓存大小
    if (this.cache.size > 200) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    return quote;
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private cacheKey(opts: RouteQueryOptions, strategy: string): string {
    return `${opts.fromChain}->${opts.toChain}|${opts.fromToken}->${opts.toToken}|${opts.amount}|${strategy}`;
  }

  private async safe<T>(fn: () => T | Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch {
      return null;
    }
  }

  /** 清理缓存（用于测试） */
  clearCache(): void {
    this.cache.clear();
  }
}
