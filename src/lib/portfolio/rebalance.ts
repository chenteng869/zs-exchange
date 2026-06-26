/**
 * 再平衡引擎（Rebalance Engine）
 *
 * 触发方式：
 *  - periodic      按固定周期
 *  - threshold     偏离阈值（>5%）
 *  - risk_parity   风险预算偏离
 *
 * 计划生成 → 优先级排序 → 模拟执行 → 成本估算
 *
 * 与 OrderEngine 集成：executePlan() 会调用可选的 orderPlacer 把交易发到撮合。
 * 若未注入，则仅做模拟执行（status='executed'，但不下真实单）。
 */

import {
  decAbs,
  decAdd,
  decDiv,
  decIsZero,
  decMul,
  decSub,
} from '@/lib/matching/decimal';
import {
  DEFAULT_DRIFT_THRESHOLD,
  REBALANCE_MIN_INTERVAL_DAYS,
  type AllocationTarget,
  type PortfolioAsset,
  type RebalancePlan,
  type RebalanceTrade,
} from './types';
import { AssetAggregator } from './asset-aggregator';

/** 下单回调 */
export type OrderPlacer = (trade: RebalanceTrade) => Promise<{ ok: boolean; orderId?: string; reason?: string }>;

export interface RebalanceEngineOptions {
  /** 偏离阈值（默认 0.05 = 5%） */
  driftThreshold?: number;
  /** 最小再平衡间隔（天） */
  minIntervalDays?: number;
  /** 单边交易费率（默认 0.001 = 0.1%） */
  feeRate?: number;
  /** 订单执行器（可选；未注入则仅模拟） */
  orderPlacer?: OrderPlacer;
}

export class RebalanceEngine {
  private driftThreshold: number;
  private minIntervalDays: number;
  private feeRate: number;
  private orderPlacer: OrderPlacer | null = null;
  private lastRebalanceAt: Map<string, number> = new Map();
  private plans: Map<string, RebalancePlan> = new Map();

  constructor(opts: RebalanceEngineOptions = {}) {
    this.driftThreshold = opts.driftThreshold ?? DEFAULT_DRIFT_THRESHOLD;
    this.minIntervalDays = opts.minIntervalDays ?? REBALANCE_MIN_INTERVAL_DAYS;
    this.feeRate = opts.feeRate ?? 0.001;
    this.orderPlacer = opts.orderPlacer ?? null;
  }

  /** 设置订单执行器 */
  setOrderPlacer(placer: OrderPlacer): void {
    this.orderPlacer = placer;
  }

  // -------------------------------------------------------------------------
  // 触发条件
  // -------------------------------------------------------------------------

  /** 周期触发：距上次再平衡 >= minIntervalDays */
  periodic(userId: string, intervalDays?: number): boolean {
    const interval = intervalDays ?? this.minIntervalDays;
    const last = this.lastRebalanceAt.get(userId) ?? 0;
    if (last === 0) return true;
    const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
    return days >= interval;
  }

  /** 阈值触发：任意资产权重偏离目标 > driftThreshold */
  shouldRebalanceByThreshold(
    assets: PortfolioAsset[],
    targets: AllocationTarget[],
    thresholdOverride?: number,
  ): boolean {
    const t = thresholdOverride ?? this.driftThreshold;
    const cur = this.currentAllocationMap(assets);
    for (const tg of targets) {
      const curW = Number(cur[tg.symbol] ?? '0');
      const tarW = Number(tg.targetWeight);
      if (Math.abs(tarW - curW) > t) return true;
    }
    return false;
  }

  /** 兼容旧名：与 shouldRebalanceByThreshold 等价 */
  threshold(
    assets: PortfolioAsset[],
    targets: AllocationTarget[],
    thresholdOverride?: number,
  ): boolean {
    return this.shouldRebalanceByThreshold(assets, targets, thresholdOverride);
  }

  /**
   * 风险预算触发：每个资产的风险贡献与目标预算偏差 > threshold
   * 简化为：权重偏离 threshold
   */
  riskParityTrigger(assets: PortfolioAsset[], targets: AllocationTarget[]): boolean {
    return this.threshold(assets, targets);
  }

  // -------------------------------------------------------------------------
  // 计划生成
  // -------------------------------------------------------------------------

  /**
   * 生成再平衡计划
   */
  generatePlan(
    userId: string,
    assets: PortfolioAsset[],
    targets: AllocationTarget[],
    strategy: 'periodic' | 'threshold' | 'risk_parity' = 'threshold',
  ): RebalancePlan {
    const currentAllocs = this.currentAllocationMap(assets);
    const targetAllocs = this.toAllocationMap(targets);
    const totalValue = this.totalValue(assets);
    const trades: RebalanceTrade[] = [];
    const allSymbols = new Set([
      ...Object.keys(currentAllocs),
      ...Object.keys(targetAllocs),
    ]);

    for (const sym of allSymbols) {
      const curW = Number(currentAllocs[sym] ?? '0');
      const tarW = Number(targetAllocs[sym] ?? '0');
      const drift = tarW - curW;
      if (Math.abs(drift) < this.driftThreshold) continue;
      const side: 'buy' | 'sell' = drift > 0 ? 'buy' : 'sell';
      const deltaValue = Math.abs(drift) * totalValue;
      // 查找 mark price
      const a = assets.find((x) => x.symbol === sym);
      const price = Number(a?.markPrice || '0');
      const quantity = price > 0 ? deltaValue / price : 0;
      const priority = Math.min(10, Math.max(1, Math.round(Math.abs(drift) * 100)));
      trades.push({
        symbol: sym,
        side,
        quantity: quantity.toString(),
        estimatedValue: deltaValue.toString(),
        priority,
        reason: `${strategy} rebalance: ${sym} ${(curW * 100).toFixed(2)}% → ${(tarW * 100).toFixed(2)}% (drift ${(drift * 100).toFixed(2)}%)`,
      });
    }

    // 按优先级降序
    trades.sort((a, b) => b.priority - a.priority);

    const expectedCost = trades.reduce(
      (s, t) => s + Number(t.estimatedValue) * this.feeRate,
      0,
    );
    const expectedImprovement = (trades.length > 0 ? this.driftThreshold * 100 : 0).toFixed(2);

    const id = `rb-${userId}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const plan: RebalancePlan = {
      id,
      userId,
      strategy,
      triggers: this.buildTriggers(strategy),
      currentAllocations: currentAllocs,
      targetAllocations: targetAllocs,
      trades,
      expectedCost: expectedCost.toString(),
      expectedImprovement,
      createdAt: Date.now(),
      status: 'pending',
    };
    this.plans.set(id, plan);
    return plan;
  }

  // -------------------------------------------------------------------------
  // 执行
  // -------------------------------------------------------------------------

  /** 执行计划：异步发送订单 */
  async executePlan(planId: string): Promise<RebalancePlan> {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`[rebalance] plan not found: ${planId}`);
    if (plan.status === 'executed') return plan;
    if (plan.status === 'cancelled') throw new Error(`[rebalance] plan cancelled: ${planId}`);

    if (this.orderPlacer) {
      for (const trade of plan.trades) {
        try {
          const res = await this.orderPlacer(trade);
          if (!res.ok) {
            // 部分失败：标记 plan 状态为 draft，等人工介入
            return { ...plan, status: 'draft' };
          }
        } catch (_e) {
          return { ...plan, status: 'draft' };
        }
      }
    }
    const executed: RebalancePlan = {
      ...plan,
      status: 'executed',
      executedAt: Date.now(),
    };
    this.plans.set(planId, executed);
    this.lastRebalanceAt.set(plan.userId, Date.now());
    return executed;
  }

  /** 取消计划 */
  cancelPlan(planId: string): boolean {
    const plan = this.plans.get(planId);
    if (!plan) return false;
    if (plan.status === 'executed') return false;
    this.plans.set(planId, { ...plan, status: 'cancelled' });
    return true;
  }

  /** 获取计划 */
  getPlan(planId: string): RebalancePlan | undefined {
    return this.plans.get(planId);
  }

  /** 列出某用户全部计划 */
  listPlans(userId: string): RebalancePlan[] {
    return Array.from(this.plans.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  private currentAllocationMap(assets: PortfolioAsset[]): Record<string, string> {
    const out: Record<string, string> = {};
    let total = 0;
    for (const a of assets) {
      total += Number(a.marketValue || '0');
    }
    if (total === 0) {
      for (const a of assets) out[a.symbol] = '0';
      return out;
    }
    for (const a of assets) {
      const mv = Number(a.marketValue || '0');
      out[a.symbol] = (mv / total).toString();
    }
    return out;
  }

  private toAllocationMap(targets: AllocationTarget[]): Record<string, string> {
    const out: Record<string, string> = {};
    let total = 0;
    for (const t of targets) total += Number(t.targetWeight);
    if (total === 0) {
      for (const t of targets) out[t.symbol] = t.targetWeight;
      return out;
    }
    for (const t of targets) {
      out[t.symbol] = (Number(t.targetWeight) / total).toString();
    }
    return out;
  }

  private totalValue(assets: PortfolioAsset[]): number {
    return assets.reduce((s, a) => s + Number(a.marketValue || '0'), 0);
  }

  private buildTriggers(strategy: 'periodic' | 'threshold' | 'risk_parity'): string[] {
    if (strategy === 'periodic') return [`every ${this.minIntervalDays}d`];
    if (strategy === 'threshold') return [`drift > ${(this.driftThreshold * 100).toFixed(1)}%`];
    return ['risk parity violation'];
  }
}

/**
 * 工厂
 */
export function createRebalanceEngine(opts?: RebalanceEngineOptions): RebalanceEngine {
  return new RebalanceEngine(opts);
}

/** 重导出 */
export { AssetAggregator, decAbs, decAdd, decDiv, decIsZero, decMul, decSub };
