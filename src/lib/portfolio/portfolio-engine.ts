/**
 * 投资组合引擎（Portfolio Engine）— 业务层门面
 *
 * 职责：
 *  - 整合 AssetAggregator / RiskEngine / AllocationEngine / RebalanceEngine / AttributionEngine
 *  - 提供面向业务层的统一 API
 *  - 事件总线（portfolioUpdate / rebalanceTrigger）
 *  - 模拟回测
 *  - 报表生成
 *
 * 依赖：
 *  - matching/decimal（金额）
 *  - 本目录下 5 个子模块
 *
 * 用法：
 *   const engine = new PortfolioEngine();
 *   engine.addAsset(...);
 *   const p = engine.getPortfolio('u1');
 *   const m = engine.getRiskMetrics('u1');
 *   const plan = engine.rebalance('u1', 'threshold');
 *   await engine.executeRebalance(plan.id);
 *   const report = engine.generateReport('u1', { start: ts1, end: ts2 });
 */

import {
  decAdd,
  decDiv,
  decIsZero,
  decMul,
  decSub,
} from '@/lib/matching/decimal';
import { AssetAggregator, makeAsset, type PriceSource } from './asset-aggregator';
import { RiskEngine, returnsFromPrices } from './risk-engine';
import { AllocationEngine } from './allocation';
import { RebalanceEngine, type OrderPlacer } from './rebalance';
import { AttributionEngine } from './attribution';
import {
  ASSET_CLASSES,
  MAX_DRAWDOWN_ALERT,
  type AllocationTarget,
  type AssetClass,
  type BacktestResult,
  type Portfolio,
  type PortfolioAsset,
  type PortfolioReport,
  type PortfolioRiskMetrics,
  type PerformanceAttribution,
  type RebalancePlan,
  type RiskProfile,
} from './types';

// =============================================================================
// 历史快照
// =============================================================================

interface Snapshot {
  time: number;
  totalValue: string;
  pnl: string;
}

// =============================================================================
// 引擎
// =============================================================================

export type PortfolioUpdateHandler = (p: Portfolio) => void;
export type RebalanceTriggerHandler = (plan: RebalancePlan) => void;

export interface PortfolioEngineOptions {
  priceSource?: PriceSource;
  orderPlacer?: OrderPlacer;
  /** 自动触发再平衡（默认 false） */
  autoRebalance?: boolean;
  /** 偏离阈值（默认 0.05） */
  driftThreshold?: number;
}

export class PortfolioEngine {
  private aggregator: AssetAggregator;
  private risk: RiskEngine;
  private allocator: AllocationEngine;
  private rebalancer: RebalanceEngine;
  private attribution: AttributionEngine;

  /** userId -> 目标配置 */
  private targetMap: Map<string, AllocationTarget[]> = new Map();
  /** 历史快照 */
  private snapshots: Map<string, Snapshot[]> = new Map();
  /** 资产收益历史：symbol -> 日收益序列 */
  private returnsHistory: Map<string, number[]> = new Map();
  /** 组合日收益历史（userId -> series） */
  private portfolioReturns: Map<string, number[]> = new Map();
  /** 市场（BTC）收益历史 */
  private marketReturns: number[] = [];

  private updateHandlers: Set<PortfolioUpdateHandler> = new Set();
  private rebalanceHandlers: Set<RebalanceTriggerHandler> = new Set();
  private autoRebalance: boolean;

  constructor(opts: PortfolioEngineOptions = {}) {
    this.aggregator = new AssetAggregator();
    if (opts.priceSource) this.aggregator.setPriceSource(opts.priceSource);
    this.risk = new RiskEngine();
    this.allocator = new AllocationEngine();
    this.rebalancer = new RebalanceEngine({
      driftThreshold: opts.driftThreshold,
      orderPlacer: opts.orderPlacer,
    });
    this.attribution = new AttributionEngine();
    this.autoRebalance = opts.autoRebalance ?? false;
  }

  // -------------------------------------------------------------------------
  // 基础
  // -------------------------------------------------------------------------

  setPriceSource(source: PriceSource): void {
    this.aggregator.setPriceSource(source);
  }

  setOrderPlacer(placer: OrderPlacer): void {
    this.rebalancer.setOrderPlacer(placer);
  }

  /** 添加资产（便捷方法） */
  addAsset(asset: PortfolioAsset): void {
    this.aggregator.addAsset(asset);
    const updated = this.aggregator.recomputeUserAssets(asset.userId);
    this.emitUpdate(asset.userId, updated);
  }

  /** 移除资产 */
  removeAsset(id: string): void {
    this.aggregator.removeAsset(id);
  }

  /** 取某用户全部资产 */
  getAssets(userId: string): PortfolioAsset[] {
    return this.aggregator.getUserAssets(userId);
  }

  /** 按资产类 */
  getAssetsByClass(userId: string, assetClass: AssetClass): PortfolioAsset[] {
    return this.aggregator.getByClass(userId, assetClass);
  }

  /** 刷新全部价格 */
  async refreshPrices(): Promise<void> {
    await this.aggregator.refreshAll();
    const userIds = new Set(this.aggregator.getAllAssets().map((a) => a.userId));
    for (const u of userIds) {
      const assets = this.aggregator.recomputeUserAssets(u);
      this.emitUpdate(u, assets);
    }
  }

  // -------------------------------------------------------------------------
  // 组合快照
  // -------------------------------------------------------------------------

  /**
   * 获取完整组合视图
   */
  getPortfolio(userId: string): Portfolio {
    const assets = this.aggregator.recomputeUserAssets(userId);
    const totalValue = assets.reduce(
      (s, a) => decAdd(s, a.marketValue || '0'),
      '0',
    );
    const totalCost = assets.reduce(
      (s, a) => decAdd(s, decMul(a.avgCost || '0', a.quantity)),
      '0',
    );
    const totalPnl = decSub(totalValue, totalCost);
    const totalPnlPct = decIsZero(totalCost) ? '0' : decDiv(totalPnl, totalCost, 18);
    const byAssetClass = this.byAssetClass(assets, totalValue);
    const bySymbol: Record<string, PortfolioAsset> = {};
    for (const a of assets) bySymbol[a.symbol] = a;
    const sn = this.snapshots.get(userId) ?? [];
    const last = sn[sn.length - 1];
    const yesterday = sn[sn.length - 2];
    const week = sn[sn.length - 8] ?? last;
    const month = sn[sn.length - 31] ?? last;
    const year = sn[sn.length - 366] ?? last;
    const riskMetrics = this.getRiskMetrics(userId);
    return {
      userId,
      totalValue,
      totalCost,
      totalPnl,
      totalPnlPct,
      dailyPnl: last && yesterday ? decSub(last.totalValue, yesterday.totalValue) : '0',
      weeklyPnl: last && week ? decSub(last.totalValue, week.totalValue) : '0',
      monthlyPnl: last && month ? decSub(last.totalValue, month.totalValue) : '0',
      yearlyPnl: last && year ? decSub(last.totalValue, year.totalValue) : '0',
      cash: '0',
      assets,
      byAssetClass,
      bySymbol,
      riskMetrics,
      updatedAt: Date.now(),
    };
  }

  /**
   * 计算某用户某段时间的业绩归因
   */
  getPerformance(userId: string, period: { start: number; end: number }): PerformanceAttribution {
    const assets = this.aggregator.getUserAssets(userId);
    const portfolioWeights: Record<string, number> = {};
    const portfolioReturns: Record<string, number> = {};
    const benchmarkWeights: Record<string, number> = {};
    const benchmarkReturns: Record<string, number> = {};
    for (const a of assets) {
      portfolioWeights[a.symbol] = Number(a.allocation);
      const ret = this.returnsHistory.get(a.symbol) ?? [];
      portfolioReturns[a.symbol] = ret.length > 0 ? ret[ret.length - 1] : 0;
      // 基准 = 等权 BTC 之外
      benchmarkWeights[a.symbol] = 1 / Math.max(1, assets.length);
      benchmarkReturns[a.symbol] = (this.marketReturns[this.marketReturns.length - 1] ?? 0);
    }
    return this.attribution.brinsonAttribution(period, {
      portfolioWeights,
      benchmarkWeights,
      portfolioReturns,
      benchmarkReturns,
    });
  }

  /**
   * 计算风险指标
   */
  getRiskMetrics(userId: string): PortfolioRiskMetrics {
    const assets = this.aggregator.recomputeUserAssets(userId);
    const rets = this.portfolioReturns.get(userId) ?? [];
    const equity = this.equityCurve(userId);
    return this.risk.calculatePortfolioRisk(
      rets,
      equity,
      assets,
      this.marketReturns,
      this.totalEquity(assets),
    );
  }

  // -------------------------------------------------------------------------
  // 资产配置
  // -------------------------------------------------------------------------

  setAllocation(userId: string, targets: AllocationTarget[]): void {
    this.targetMap.set(userId, targets);
  }

  getAllocation(userId: string): AllocationTarget[] {
    return this.targetMap.get(userId) ?? [];
  }

  /** 按风险偏好配置（conservative/balanced/aggressive） */
  setAllocationByProfile(userId: string, profile: RiskProfile): AllocationTarget[] {
    const tg = this.allocator.fromRiskProfile(profile);
    this.setAllocation(userId, tg);
    return tg;
  }

  /** 资产配置 60-40 策略 */
  setSixtyForty(userId: string): AllocationTarget[] {
    const tg = this.allocator.sixtyForty();
    this.setAllocation(userId, tg);
    return tg;
  }

  /** 风险平价（基于历史收益） */
  setRiskParity(userId: string): AllocationTarget[] {
    const assets = this.aggregator.getUserAssets(userId);
    if (assets.length === 0) return [];
    const returns = assets.map((a) => this.returnsHistory.get(a.symbol) ?? [0]);
    const tg = this.allocator.riskParity(returns);
    this.setAllocation(userId, tg);
    return tg;
  }

  // -------------------------------------------------------------------------
  // 再平衡
  // -------------------------------------------------------------------------

  /**
   * 触发再平衡（生成计划）
   * @param strategy 'periodic' | 'threshold' | 'risk_parity'
   */
  rebalance(
    userId: string,
    strategy: 'periodic' | 'threshold' | 'risk_parity' = 'threshold',
  ): RebalancePlan {
    const assets = this.aggregator.recomputeUserAssets(userId);
    const targets = this.targetMap.get(userId) ?? this.allocator.equalWeight(
      Array.from(new Set(assets.map((a) => a.symbol))),
    );
    const plan = this.rebalancer.generatePlan(userId, assets, targets, strategy);
    for (const h of this.rebalanceHandlers) h(plan);
    return plan;
  }

  async executeRebalance(planId: string): Promise<RebalancePlan> {
    const plan = await this.rebalancer.executePlan(planId);
    // 同步更新内部资产（按 trades）
    const assets = this.aggregator.getUserAssets(plan.userId);
    const map = new Map(assets.map((a) => [a.symbol, a]));
    for (const t of plan.trades) {
      const a = map.get(t.symbol);
      if (!a) continue;
      const delta = Number(t.estimatedValue) / Math.max(1e-12, Number(a.markPrice));
      const sign = t.side === 'buy' ? 1 : -1;
      const newQty = Number(a.quantity) + sign * delta;
      a.quantity = newQty.toString();
      a.marketValue = decMul(a.quantity, a.markPrice);
      this.aggregator.applyUpdatedAsset(a);
    }
    this.aggregator.recomputeUserAssets(plan.userId);
    this.emitUpdate(plan.userId, this.aggregator.getUserAssets(plan.userId));
    return plan;
  }

  // -------------------------------------------------------------------------
  // 回测
  // -------------------------------------------------------------------------

  /**
   * 模拟回测：给定 targets 与历史价格 → 评估配置效果
   * 注：纯计算回测，不实际下单
   */
  async backtestAllocation(
    userId: string,
    targets: AllocationTarget[],
    period: { start: number; end: number },
    initialValue: string = '10000',
  ): Promise<BacktestResult> {
    const symbols = targets.map((t) => t.symbol);
    const returns: number[][] = symbols.map((s) => this.returnsHistory.get(s) ?? [0]);
    const equityCurve: { time: number; value: string }[] = [];
    const trades: BacktestResult['trades'] = [];
    let value = Number(initialValue);
    equityCurve.push({ time: period.start, value: value.toString() });
    const n = Math.min(...returns.map((r) => r.length));
    for (let t = 0; t < n; t++) {
      // 期末再平衡
      if (t > 0 && t % 7 === 0) {
        // 周度再平衡
        for (let i = 0; i < symbols.length; i++) {
          trades.push({
            time: period.start + t * 86_400_000,
            symbol: symbols[i],
            side: 'buy',
            quantity: '0',
            price: '0',
          });
        }
      }
      let r = 0;
      for (let i = 0; i < symbols.length; i++) {
        r += Number(targets[i].targetWeight) * (returns[i][t] ?? 0);
      }
      value = value * (1 + r);
      equityCurve.push({
        time: period.start + t * 86_400_000,
        value: value.toString(),
      });
    }
    const equity = equityCurve.map((p) => Number(p.value));
    const rets = returnsFromPrices(equity);
    const totalReturn = (value - Number(initialValue)) / Number(initialValue);
    const final: BacktestResult = {
      userId,
      period,
      initialValue,
      finalValue: value.toString(),
      totalReturn: totalReturn.toString(),
      annualizedReturn: this.risk.calculateCalmar([Number(initialValue), value]) * 0.1,
      sharpeRatio: this.risk.calculateSharpe(rets),
      sortinoRatio: this.risk.calculateSortino(rets),
      maxDrawdown: this.risk.calculateMaxDrawdown(equity),
      equityCurve,
      trades,
    };
    return final;
  }

  // -------------------------------------------------------------------------
  // 收益 / 行情注入（用于测试与生产）
  // -------------------------------------------------------------------------

  /** 注入某 symbol 的日收益历史（最新在末尾） */
  pushReturns(symbol: string, dailyReturns: number[]): void {
    this.returnsHistory.set(symbol, dailyReturns);
  }

  /** 注入市场（基准）日收益 */
  pushMarketReturns(dailyReturns: number[]): void {
    this.marketReturns = dailyReturns;
  }

  /** 推入组合快照（用于 dailyPnl 等指标） */
  pushSnapshot(userId: string, totalValue: string, pnl: string = '0'): void {
    const list = this.snapshots.get(userId) ?? [];
    list.push({ time: Date.now(), totalValue, pnl });
    this.snapshots.set(userId, list);
  }

  /** 推入组合日收益（外部行情归一） */
  pushPortfolioReturn(userId: string, dailyReturn: number): void {
    const list = this.portfolioReturns.get(userId) ?? [];
    list.push(dailyReturn);
    this.portfolioReturns.set(userId, list);
  }

  // -------------------------------------------------------------------------
  // 事件
  // -------------------------------------------------------------------------

  onPortfolioUpdate(handler: PortfolioUpdateHandler): () => void {
    this.updateHandlers.add(handler);
    return () => this.updateHandlers.delete(handler);
  }

  onRebalanceTrigger(handler: RebalanceTriggerHandler): () => void {
    this.rebalanceHandlers.add(handler);
    return () => this.rebalanceHandlers.delete(handler);
  }

  private emitUpdate(userId: string, assets: PortfolioAsset[]): void {
    if (this.updateHandlers.size === 0) return;
    const portfolio = this.assemblePortfolio(userId, assets);
    for (const h of this.updateHandlers) h(portfolio);
    if (this.autoRebalance) this.checkAutoRebalance(userId, assets);
  }

  private assemblePortfolio(userId: string, assets: PortfolioAsset[]): Portfolio {
    const totalValue = assets.reduce(
      (s, a) => decAdd(s, a.marketValue || '0'),
      '0',
    );
    const totalCost = assets.reduce(
      (s, a) => decAdd(s, decMul(a.avgCost || '0', a.quantity)),
      '0',
    );
    const totalPnl = decSub(totalValue, totalCost);
    const totalPnlPct = decIsZero(totalCost) ? '0' : decDiv(totalPnl, totalCost, 18);
    return {
      userId,
      totalValue,
      totalCost,
      totalPnl,
      totalPnlPct,
      dailyPnl: '0',
      weeklyPnl: '0',
      monthlyPnl: '0',
      yearlyPnl: '0',
      cash: '0',
      assets,
      byAssetClass: this.byAssetClass(assets, totalValue),
      bySymbol: Object.fromEntries(assets.map((a) => [a.symbol, a])),
      riskMetrics: this.getRiskMetrics(userId),
      updatedAt: Date.now(),
    };
  }

  private checkAutoRebalance(userId: string, assets: PortfolioAsset[]): void {
    const targets = this.targetMap.get(userId);
    if (!targets || targets.length === 0) return;
    if (this.rebalancer.threshold(assets, targets)) {
      this.rebalance(userId, 'threshold');
    }
  }

  // -------------------------------------------------------------------------
  // 报表
  // -------------------------------------------------------------------------

  /**
   * 生成组合报告
   */
  generateReport(userId: string, period: { start: number; end: number }): PortfolioReport {
    const portfolio = this.getPortfolio(userId);
    const riskMetrics = this.getRiskMetrics(userId);
    const attribution = this.getPerformance(userId, period);
    const targets = this.targetMap.get(userId) ?? [];
    let rebalanceSuggestion: RebalancePlan | undefined;
    if (targets.length > 0) {
      rebalanceSuggestion = this.rebalancer.generatePlan(
        userId,
        portfolio.assets,
        targets,
        'threshold',
      );
    }
    return {
      userId,
      generatedAt: Date.now(),
      period,
      portfolio,
      riskMetrics,
      attribution,
      rebalanceSuggestion,
      summary: {
        totalReturn: portfolio.totalPnlPct,
        riskLevel: this.classifyRisk(riskMetrics),
        concentrationRisk: riskMetrics.concentration >= 0.3,
        rebalanceNeeded: rebalanceSuggestion ? rebalanceSuggestion.trades.length > 0 : false,
      },
    };
  }

  private classifyRisk(m: PortfolioRiskMetrics): 'low' | 'medium' | 'high' {
    if (m.volatility < 0.2) return 'low';
    if (m.volatility < 0.5) return 'medium';
    return 'high';
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  private byAssetClass(
    assets: PortfolioAsset[],
    totalValue: string,
  ): Portfolio['byAssetClass'] {
    const out: Portfolio['byAssetClass'] = {} as Portfolio['byAssetClass'];
    for (const c of ASSET_CLASSES) out[c] = { value: '0', pct: '0' };
    let total = '0';
    for (const a of assets) {
      const cur = out[a.assetClass];
      cur.value = decAdd(cur.value, a.marketValue);
      total = decAdd(total, a.marketValue);
    }
    if (!decIsZero(total)) {
      for (const c of ASSET_CLASSES) {
        out[c].pct = decDiv(out[c].value, total, 18);
      }
    }
    void totalValue;
    return out;
  }

  private equityCurve(userId: string): number[] {
    const sn = this.snapshots.get(userId) ?? [];
    return sn.map((s) => Number(s.totalValue));
  }

  private totalEquity(assets: PortfolioAsset[]): number {
    return assets.reduce((s, a) => s + Number(a.marketValue || '0'), 0);
  }

  // -------------------------------------------------------------------------
  // 子模块访问
  // -------------------------------------------------------------------------

  getAggregator(): AssetAggregator {
    return this.aggregator;
  }
  getRiskEngine(): RiskEngine {
    return this.risk;
  }
  getAllocationEngine(): AllocationEngine {
    return this.allocator;
  }
  getRebalanceEngine(): RebalanceEngine {
    return this.rebalancer;
  }
  getAttributionEngine(): AttributionEngine {
    return this.attribution;
  }
}

// =============================================================================
// 工厂
// =============================================================================

export function createPortfolioEngine(opts?: PortfolioEngineOptions): PortfolioEngine {
  return new PortfolioEngine(opts);
}

// =============================================================================
// 重导出
// =============================================================================

export { makeAsset, AssetAggregator };
export type { PriceSource };
export { MAX_DRAWDOWN_ALERT };
