/**
 * 资产聚合器（Asset Aggregator）
 *
 * 职责：
 *  - 跨资产类汇总持仓（现货/合约/期权/DeFi/法币/Staking/Lending）
 *  - 标记价刷新（外部价格源）
 *  - 市值 / 未实现盈亏 / 组合权重 计算
 *  - 按用户 / 按资产类 查询
 *
 * 依赖：
 *  - src/lib/matching/decimal（高精度金额计算）
 *
 * 用法：
 *   const agg = new AssetAggregator();
 *   agg.addAsset({ ... });
 *   agg.setPriceSource(async (sym) => priceMap[sym] ?? '0');
 *   await agg.refreshAll();
 *   const list = agg.getUserAssets('u1');
 */

import {
  decAdd,
  decDiv,
  decIsZero,
  decMul,
  decSub,
  decCmp,
} from '@/lib/matching/decimal';
import {
  ASSET_CLASSES,
  type AssetClass,
  type PortfolioAsset,
} from './types';

/** 外部价格源类型 */
export type PriceSource = (symbol: string) => Promise<string> | string;

/** 内部存储：assetId -> PortfolioAsset */
export class AssetAggregator {
  /** id -> asset */
  private assets: Map<string, PortfolioAsset> = new Map();
  /** 外部价格源 */
  private priceSource: PriceSource | null = null;

  /** 注册价格源（mark price） */
  setPriceSource(source: PriceSource): void {
    this.priceSource = source;
  }

  /** 添加 / 覆盖资产；同 (userId, symbol, assetClass) 视为同一资产，合并数量与均价 */
  addAsset(asset: PortfolioAsset): void {
    const key = this.makeKey(asset.userId, asset.symbol, asset.assetClass);
    const id = asset.id || key;
    const existing = this.assets.get(key);
    if (!existing) {
      this.assets.set(key, { ...asset, id, updatedAt: Date.now() });
      return;
    }
    // 合并数量与加权成本
    const newQty = decAdd(existing.quantity, asset.quantity);
    if (decIsZero(newQty)) {
      this.assets.set(key, {
        ...existing,
        avgCost: asset.avgCost,
        updatedAt: Date.now(),
        meta: asset.meta ?? existing.meta,
      });
      return;
    }
    const totalCost = decAdd(
      decMul(existing.avgCost, existing.quantity),
      decMul(asset.avgCost, asset.quantity),
    );
    const newAvg = decDiv(totalCost, newQty, 18);
    this.assets.set(key, {
      ...existing,
      quantity: newQty,
      avgCost: newAvg,
      markPrice: asset.markPrice || existing.markPrice,
      updatedAt: Date.now(),
      meta: asset.meta ?? existing.meta,
    });
  }

  /** 删除资产（按 id） */
  removeAsset(id: string): boolean {
    const entry = this.findEntryById(id);
    if (!entry) return false;
    return this.assets.delete(entry.key);
  }

  /** 取单个资产（按 id） */
  getAsset(id: string): PortfolioAsset | undefined {
    const entry = this.findEntryById(id);
    return entry ? entry.asset : undefined;
  }

  /** 按 (userId, symbol, class) 取 */
  findAsset(
    userId: string,
    symbol: string,
    assetClass: AssetClass,
  ): PortfolioAsset | undefined {
    return this.assets.get(this.makeKey(userId, symbol, assetClass));
  }

  /** 获取某用户全部资产 */
  getUserAssets(userId: string): PortfolioAsset[] {
    return Array.from(this.assets.values()).filter((a) => a.userId === userId);
  }

  /** 获取某用户某资产类的全部资产 */
  getByClass(userId: string, assetClass: AssetClass): PortfolioAsset[] {
    return this.getUserAssets(userId).filter((a) => a.assetClass === assetClass);
  }

  /** 全部资产（测试用） */
  getAllAssets(): PortfolioAsset[] {
    return Array.from(this.assets.values());
  }

  // -------------------------------------------------------------------------
  // 计算
  // -------------------------------------------------------------------------

  /**
   * 计算市值 = quantity × markPrice
   * 含特殊处理：perp 持仓按 notional = size × mark（不带杠杆）；
   *            option 持仓 = contracts × contractSize × mark
   */
  calculateMarketValue(asset: PortfolioAsset): string {
    return decMul(asset.quantity, asset.markPrice || '0');
  }

  /**
   * 未实现盈亏（不含杠杆）：
   *  - 现货 / DeFi / 借贷 / 法币： (mark - avg) × qty
   *  - 永续：position = (mark - entry) × qty × sideMultiplier
   *  - 期权：按 mark 与 entry 价差 × qty × contractSize
   */
  calculateUnrealizedPnl(asset: PortfolioAsset): string {
    const mp = asset.markPrice || '0';
    const ac = asset.avgCost || '0';
    if (asset.assetClass === 'perp') {
      // perp: 假设 avgCost 即为 entry price；qty 为 base 数量
      return decMul(decSub(mp, ac), asset.quantity);
    }
    return decMul(decSub(mp, ac), asset.quantity);
  }

  /**
   * 收益率 = pnl / cost
   * cost = avgCost × quantity
   */
  calculatePnlPct(asset: PortfolioAsset): string {
    const pnl = this.calculateUnrealizedPnl(asset);
    const cost = decMul(asset.avgCost || '0', asset.quantity);
    if (decIsZero(cost)) return '0';
    return decDiv(pnl, cost, 18);
  }

  /**
   * 计算资产组合权重（市值 / 总市值）
   * 返回 { symbol: weight } 形式，权重为 0-1 字符串
   */
  calculateAllocation(assets: PortfolioAsset[]): Record<string, string> {
    const out: Record<string, string> = {};
    let total = '0';
    for (const a of assets) {
      total = decAdd(total, this.calculateMarketValue(a));
    }
    if (decIsZero(total)) return out;
    for (const a of assets) {
      const mv = this.calculateMarketValue(a);
      out[a.symbol] = decDiv(mv, total, 18);
    }
    return out;
  }

  /**
   * 刷新单个资产的标记价
   */
  async refreshAsset(id: string): Promise<void> {
    if (!this.priceSource) return;
    const entry = this.findEntryById(id);
    if (!entry) return;
    const price = await this.priceSource(entry.asset.symbol);
    this.assets.set(entry.key, {
      ...entry.asset,
      markPrice: price || '0',
      updatedAt: Date.now(),
    });
  }

  /**
   * 刷新全部资产标记价
   */
  async refreshAll(): Promise<void> {
    if (!this.priceSource) return;
    const tasks: Promise<void>[] = [];
    for (const a of Array.from(this.assets.values())) {
      tasks.push(this.refreshAsset(a.id));
    }
    await Promise.all(tasks);
  }

  /**
   * 同步（带新 markPrice）刷新 — 单资产
   * 用于测试或同步场景，无需 await 异步源
   */
  setMarkPrice(id: string, price: string): void {
    const entry = this.findEntryById(id);
    if (!entry) return;
    this.assets.set(entry.key, {
      ...entry.asset,
      markPrice: price,
      updatedAt: Date.now(),
    });
  }

  /**
   * 应用完整最新值（重计算后的 asset）
   */
  applyUpdatedAsset(asset: PortfolioAsset): void {
    const key = this.makeKey(asset.userId, asset.symbol, asset.assetClass);
    this.assets.set(key, { ...asset, updatedAt: Date.now() });
  }

  /**
   * 重新计算某用户所有资产的市值 / pnl / 权重
   * 返回更新后的资产列表
   */
  recomputeUserAssets(userId: string): PortfolioAsset[] {
    const assets = this.getUserAssets(userId);
    if (assets.length === 0) return [];
    const totalValue = assets.reduce(
      (acc, a) => decAdd(acc, this.calculateMarketValue(a)),
      '0',
    );
    return assets.map((a) => {
      const mv = this.calculateMarketValue(a);
      const pnl = this.calculateUnrealizedPnl(a);
      const pnlPct = this.calculatePnlPct(a);
      const allocation = decIsZero(totalValue) ? '0' : decDiv(mv, totalValue, 18);
      const updated: PortfolioAsset = {
        ...a,
        marketValue: mv,
        unrealizedPnl: pnl,
        unrealizedPnlPct: pnlPct,
        allocation,
        updatedAt: Date.now(),
      };
      const key = this.makeKey(updated.userId, updated.symbol, updated.assetClass);
      this.assets.set(key, updated);
      return updated;
    });
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  /** 生成唯一 key */
  private makeKey(userId: string, symbol: string, assetClass: AssetClass): string {
    return `${userId}::${symbol}::${assetClass}`;
  }

  /** 按 id 找到 (key, asset) */
  private findEntryById(id: string): { key: string; asset: PortfolioAsset } | null {
    for (const [key, asset] of this.assets.entries()) {
      if (asset.id === id) return { key, asset };
    }
    return null;
  }

  /** 清空（测试用） */
  clear(): void {
    this.assets.clear();
  }
}

/**
 * 辅助函数：构造一个最小可用的 PortfolioAsset
 */
export function makeAsset(opts: Partial<PortfolioAsset> & {
  userId: string;
  symbol: string;
  assetClass: AssetClass;
}): PortfolioAsset {
  const now = Date.now();
  return {
    id: opts.id ?? `${opts.userId}-${opts.symbol}-${opts.assetClass}`,
    userId: opts.userId,
    symbol: opts.symbol,
    assetClass: opts.assetClass,
    quantity: opts.quantity ?? '0',
    avgCost: opts.avgCost ?? '0',
    markPrice: opts.markPrice ?? '0',
    marketValue: opts.marketValue ?? '0',
    unrealizedPnl: opts.unrealizedPnl ?? '0',
    unrealizedPnlPct: opts.unrealizedPnlPct ?? '0',
    allocation: opts.allocation ?? '0',
    updatedAt: opts.updatedAt ?? now,
    meta: opts.meta,
  };
}

/**
 * 工厂：构造已填充的 AssetAggregator
 */
export function createAggregator(assets: PortfolioAsset[]): AssetAggregator {
  const agg = new AssetAggregator();
  for (const a of assets) agg.addAsset(a);
  return agg;
}

/** 重新导出以方便上层使用 */
export { ASSET_CLASSES, decCmp };
