/**
 * 收益聚合引擎 (YieldEngine)
 *
 * 业务层：聚合 scanner / adapters / compounder / risk-assessor，对外提供：
 *  - 仓位管理：deposit / withdraw / claimRewards / migrate
 *  - 查询：getPosition / getUserPositions / getStats
 *  - 自动复投：enableAutoCompound / disableAutoCompound / compoundAll
 *  - 优化：recommendBestYield / optimizeAllocation
 *  - 事件：onPositionUpdate / onAutoCompound / onRewardClaim
 *
 * 仓位为内部状态，金额用 string（避免浮点精度问题）。
 * pendingRewards 字段由外部定期刷新（外部 cron / 用户主动 compound）。
 */

import { EventEmitter } from 'events';
import type { ID } from '@/types/models';
import type {
  ActionType,
  RebalanceAction,
  RiskTier,
  YieldAction,
  YieldComparison,
  YieldPool,
  YieldPosition,
  YieldProtocol,
  YieldRecommendation,
  YieldStats,
} from './types';
import { makeYieldId, scoreToRiskTier } from './types';
import { LidoAdapter, type LidoAdapterOptions } from './protocols/lido';
import { AaveAdapter, type AaveAdapterOptions } from './protocols/aave';
import { CompoundAdapter, type CompoundAdapterOptions } from './protocols/compound';
import { CurveAdapter, type CurveAdapterOptions } from './protocols/curve';
import { ConvexAdapter, type ConvexAdapterOptions } from './protocols/convex';
import { YieldScanner, type YieldScannerOptions } from './yield-scanner';
import { AutoCompounder, type AutoCompounderOptions } from './auto-compounder';
import { RiskAssessor } from './risk-assessor';

// =============================================================================
// 引擎配置
// =============================================================================

export interface YieldEngineOptions {
  lido?: LidoAdapterOptions;
  aave?: AaveAdapterOptions;
  compound?: CompoundAdapterOptions;
  curve?: CurveAdapterOptions;
  convex?: ConvexAdapterOptions;
  scanner?: YieldScannerOptions;
  compounder?: AutoCompounderOptions;
}

// =============================================================================
// YieldEngine
// =============================================================================

/**
 * 业务主类
 */
export class YieldEngine extends EventEmitter {
  private readonly lido: LidoAdapter;
  private readonly aave: AaveAdapter;
  private readonly compound: CompoundAdapter;
  private readonly curve: CurveAdapter;
  private readonly convex: ConvexAdapter;
  private readonly scanner: YieldScanner;
  private readonly compounder: AutoCompounder;
  private readonly riskAssessor: RiskAssessor;

  /** 全部仓位：positionId -> YieldPosition */
  private positions: Map<ID, YieldPosition> = new Map();
  /** 全部操作：actionId -> YieldAction */
  private actions: Map<ID, YieldAction> = new Map();
  /** userId -> Set<positionId> */
  private userIndex: Map<ID, Set<ID>> = new Map();
  /** userId -> Set<actionId> */
  private userActionIndex: Map<ID, Set<ID>> = new Map();
  /** 启用自动复投的 positionId 集合 */
  private autoCompoundSet: Set<ID> = new Set();
  /** 用户风险偏好：userId -> 默认低风险 */
  private userRiskPref: Map<ID, RiskTier> = new Map();

  constructor(opts: YieldEngineOptions = {}) {
    super();
    this.lido = new LidoAdapter(opts.lido);
    this.aave = new AaveAdapter(opts.aave);
    this.compound = new CompoundAdapter(opts.compound);
    this.curve = new CurveAdapter(opts.curve);
    this.convex = new ConvexAdapter(opts.convex);
    this.scanner = new YieldScanner({
      lido: this.lido,
      aave: this.aave,
      compound: this.compound,
      curve: this.curve,
      convex: this.convex,
      ...opts.scanner,
    });
    this.compounder = new AutoCompounder({
      ...opts.compounder,
    });
    this.riskAssessor = new RiskAssessor();

    // 注入执行器：把 engine 的 compound 实现接入 compounder
    this.compounder.setExecutor(async (pos) => this.executeCompound(pos));
    this.compounder.setBatchExecutor(async (positions) => this.executeBatchCompound(positions));
  }

  // ===========================================================================
  // 仓位管理
  // ===========================================================================

  /**
   * 存入本金到指定协议的池子
   */
  async deposit(
    userId: ID,
    protocol: YieldProtocol,
    poolSymbol: string,
    amount: string,
  ): Promise<YieldPosition> {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Amount must be > 0');
    }
    const pool = await this.findPool(protocol, poolSymbol);
    const now = Date.now();
    const id = makeYieldId('pos');
    const position: YieldPosition = {
      id,
      userId,
      protocol,
      pool,
      depositedAmount: amount,
      share: amount,
      currentValue: amount,
      earnedAmount: '0',
      apy: pool.apy,
      entryTime: now,
      lastCompoundTime: now,
      autoCompound: false,
      riskTier: pool.riskTier,
      status: 'active',
      pendingRewards: '0',
    };
    this.positions.set(id, position);
    this.attachToUser(this.userIndex, userId, id);

    // 记录操作
    this.recordAction({
      id: makeYieldId('act'),
      userId,
      positionId: id,
      type: 'stake' as ActionType,
      protocol,
      amount,
      status: 'confirmed',
      createdAt: now,
      confirmedAt: now,
    });

    this.emitPositionUpdate(position, 'deposit');
    return position;
  }

  /**
   * 提取仓位
   */
  async withdraw(positionId: ID, amount: string): Promise<YieldAction> {
    const pos = this.positions.get(positionId);
    if (!pos) throw new Error('Position not found');
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Amount must be > 0');
    }
    if (parseFloat(amount) > parseFloat(pos.currentValue)) {
      throw new Error('Withdraw exceeds current value');
    }
    pos.status = 'withdrawing';
    pos.currentValue = (parseFloat(pos.currentValue) - parseFloat(amount)).toFixed(8);
    if (parseFloat(pos.currentValue) === 0) {
      pos.status = 'closed';
    }
    this.autoCompoundSet.delete(positionId);

    const action = this.recordAction({
      id: makeYieldId('act'),
      userId: pos.userId,
      positionId,
      type: 'unstake' as ActionType,
      protocol: pos.protocol,
      amount,
      status: 'confirmed',
      createdAt: Date.now(),
      confirmedAt: Date.now(),
    });
    this.emitPositionUpdate(pos, 'withdraw');
    return action;
  }

  /**
   * 领取收益
   */
  async claimRewards(positionId: ID): Promise<YieldAction> {
    const pos = this.positions.get(positionId);
    if (!pos) throw new Error('Position not found');
    if (parseFloat(pos.pendingRewards) <= 0) {
      throw new Error('No pending rewards');
    }
    const claimed = pos.pendingRewards;
    pos.earnedAmount = (parseFloat(pos.earnedAmount) + parseFloat(claimed)).toFixed(8);
    pos.pendingRewards = '0';
    pos.lastCompoundTime = Date.now();

    const action = this.recordAction({
      id: makeYieldId('act'),
      userId: pos.userId,
      positionId,
      type: 'claim' as ActionType,
      protocol: pos.protocol,
      amount: claimed,
      status: 'confirmed',
      createdAt: Date.now(),
      confirmedAt: Date.now(),
    });
    this.emit('rewardClaim', action, pos);
    this.emitPositionUpdate(pos, 'claim');
    return action;
  }

  /**
   * 迁移仓位到目标协议
   */
  async migrate(positionId: ID, targetProtocol: YieldProtocol, targetPoolSymbol: string): Promise<YieldPosition> {
    const pos = this.positions.get(positionId);
    if (!pos) throw new Error('Position not found');
    if (pos.protocol === targetProtocol) {
      throw new Error('Already on target protocol');
    }
    const targetPool = await this.findPool(targetProtocol, targetPoolSymbol);
    // 模拟：withdraw 全部 -> 重新 deposit
    const amount = pos.currentValue;
    pos.status = 'closed';
    this.autoCompoundSet.delete(positionId);

    const newPos = await this.deposit(pos.userId, targetProtocol, targetPoolSymbol, amount);
    // 记录 migrate 操作
    this.recordAction({
      id: makeYieldId('act'),
      userId: pos.userId,
      positionId: newPos.id,
      type: 'migrate' as ActionType,
      protocol: targetProtocol,
      amount,
      status: 'confirmed',
      createdAt: Date.now(),
      confirmedAt: Date.now(),
    });
    this.emitPositionUpdate(newPos, 'migrate');
    void targetPool;
    return newPos;
  }

  // ===========================================================================
  // 查询
  // ===========================================================================

  getPosition(id: ID): YieldPosition | null {
    return this.positions.get(id) || null;
  }

  getUserPositions(userId: ID, status?: YieldPosition['status']): YieldPosition[] {
    const ids = this.userIndex.get(userId) ?? new Set();
    const list: YieldPosition[] = [];
    for (const id of ids) {
      const p = this.positions.get(id);
      if (!p) continue;
      if (status && p.status !== status) continue;
      list.push(p);
    }
    return list;
  }

  getUserActions(userId: ID, limit: number = 50): YieldAction[] {
    const ids = this.userActionIndex.get(userId) ?? new Set();
    const out: YieldAction[] = [];
    for (const id of ids) {
      const a = this.actions.get(id);
      if (a) out.push(a);
    }
    out.sort((a, b) => b.createdAt - a.createdAt);
    return out.slice(0, limit);
  }

  /**
   * 用户收益统计
   */
  async getStats(userId: ID): Promise<YieldStats> {
    const positions = this.getUserPositions(userId, 'active');
    const byProtocol = this.emptyByProtocol();
    let totalDeposited = 0;
    let totalValue = 0;
    let totalEarned = 0;
    let apySum = 0;
    let apyCount = 0;
    const riskDistribution: Record<RiskTier, { value: string; pct: string }> = {
      low: { value: '0', pct: '0' },
      medium: { value: '0', pct: '0' },
      high: { value: '0', pct: '0' },
      very_high: { value: '0', pct: '0' },
    };
    for (const p of positions) {
      const v = parseFloat(p.currentValue);
      const d = parseFloat(p.depositedAmount);
      const e = parseFloat(p.earnedAmount);
      totalValue += v;
      totalDeposited += d;
      totalEarned += e;
      apySum += p.apy;
      apyCount += 1;

      // by protocol
      const slot = byProtocol[p.protocol];
      slot.deposited = (parseFloat(slot.deposited) + d).toFixed(8);
      slot.value = (parseFloat(slot.value) + v).toFixed(8);
      slot.earned = (parseFloat(slot.earned) + e).toFixed(8);
      slot.apy = p.apy;

      // by risk
      riskDistribution[p.riskTier].value = (parseFloat(riskDistribution[p.riskTier].value) + v).toFixed(8);
    }
    const averageApy = apyCount > 0 ? apySum / apyCount : 0;
    // 百分比
    for (const tier of Object.keys(riskDistribution) as RiskTier[]) {
      const v = parseFloat(riskDistribution[tier].value);
      riskDistribution[tier].pct = totalValue > 0 ? ((v / totalValue) * 100).toFixed(2) : '0';
    }
    // 复利化日收益
    const dailyRate = Math.pow(1 + averageApy, 1 / 365) - 1;
    const dailyEarnings = (totalValue * dailyRate).toFixed(8);
    const projectedYearly = (totalValue * (Math.pow(1 + averageApy, 1) - 1)).toFixed(8);
    return {
      userId,
      totalDeposited: totalDeposited.toFixed(8),
      totalValue: totalValue.toFixed(8),
      totalEarned: totalEarned.toFixed(8),
      averageApy,
      byProtocol,
      riskDistribution,
      dailyEarnings,
      projectedYearly,
    };
  }

  // ===========================================================================
  // 自动复投
  // ===========================================================================

  enableAutoCompound(positionId: ID): void {
    const pos = this.positions.get(positionId);
    if (!pos) throw new Error('Position not found');
    pos.autoCompound = true;
    this.autoCompoundSet.add(positionId);
  }

  disableAutoCompound(positionId: ID): void {
    const pos = this.positions.get(positionId);
    if (!pos) return;
    pos.autoCompound = false;
    this.autoCompoundSet.delete(positionId);
  }

  /**
   * 立即对所有启用自动复投的仓位执行
   */
  async compoundAll(userId?: ID): Promise<YieldAction[]> {
    const positions = Array.from(this.autoCompoundSet)
      .map((id) => this.positions.get(id))
      .filter((p): p is YieldPosition => Boolean(p))
      .filter((p) => !userId || p.userId === userId);
    return this.compounder.tick(positions);
  }

  /**
   * 启动 compounder 定时器
   */
  startAutoCompoundLoop(): void {
    this.compounder.start();
  }

  stopAutoCompoundLoop(): void {
    this.compounder.stop();
  }

  /**
   * 直接访问 compounder（高级用法）
   */
  getCompounder(): AutoCompounder {
    return this.compounder;
  }

  // ===========================================================================
  // 优化
  // ===========================================================================

  /**
   * 推荐某资产的最佳收益池
   *  - 风险过滤：用户偏好过滤
   *  - APY 比较：选最高
   *  - 给出理由
   */
  async recommendBestYield(
    userId: ID,
    asset: string,
    amount: string,
  ): Promise<YieldRecommendation> {
    if (parseFloat(amount) <= 0) {
      throw new Error('Amount must be > 0');
    }
    const riskPref = this.userRiskPref.get(userId) || 'low';
    const comparison: YieldComparison = await this.scanner.getBestYield(asset);
    const candidates = comparison.pools.filter((p) => this.riskMatchesPref(p.riskTier, riskPref));
    const pool = candidates[0] || comparison.best;
    const metrics = await this.riskAssessor.assessProtocol(pool.protocol);
    const reason = this.buildReason(pool, metrics, riskPref);
    return {
      protocol: pool.protocol,
      pool,
      expectedApy: pool.apy,
      reason,
    };
  }

  /**
   * 用户风险偏好设置
   */
  setUserRiskPreference(userId: ID, tier: RiskTier): void {
    this.userRiskPref.set(userId, tier);
  }

  /**
   * 资产再平衡：返回建议迁移列表
   *  - 策略：迁移到当前更高 APY 同等风险池
   */
  async optimizeAllocation(userId: ID): Promise<{ rebalances: RebalanceAction[] }> {
    const positions = this.getUserPositions(userId, 'active');
    const rebalances: RebalanceAction[] = [];
    for (const pos of positions) {
      const comparison = await this.scanner.getBestYield(pos.pool.underlyingAsset);
      const sameRisk = comparison.pools.find(
        (p) => p.protocol !== pos.protocol && p.riskTier === pos.riskTier,
      );
      if (sameRisk && sameRisk.apy > pos.apy * 1.05) {
        rebalances.push({
          fromPositionId: pos.id,
          toProtocol: sameRisk.protocol,
          toPoolSymbol: sameRisk.symbol,
          amount: pos.currentValue,
          reason: `${sameRisk.protocol} ${sameRisk.symbol} 提供 ${(sameRisk.apy * 100).toFixed(2)}% APY, 比当前高 ${(((sameRisk.apy - pos.apy) / pos.apy) * 100).toFixed(1)}%`,
        });
      }
    }
    return { rebalances };
  }

  // ===========================================================================
  // 事件订阅
  // ===========================================================================

  onPositionUpdate(handler: (pos: YieldPosition, op: string) => void): () => void {
    this.on('positionUpdate', handler);
    return () => this.off('positionUpdate', handler);
  }

  onAutoCompound(handler: (action: YieldAction) => void): () => void {
    this.on('autoCompound', handler);
    return () => this.off('autoCompound', handler);
  }

  onRewardClaim(handler: (action: YieldAction, pos: YieldPosition) => void): () => void {
    this.on('rewardClaim', handler);
    return () => this.off('rewardClaim', handler);
  }

  // ===========================================================================
  // 内部
  // ===========================================================================

  private async findPool(protocol: YieldProtocol, symbol: string): Promise<YieldPool> {
    const pools = await this.scanner.scanPools();
    const match = pools.find(
      (p) => p.protocol === protocol && p.symbol.toUpperCase() === symbol.toUpperCase(),
    );
    if (!match) {
      throw new Error(`Pool not found: ${protocol} / ${symbol}`);
    }
    return match;
  }

  private recordAction(input: YieldAction): YieldAction {
    this.actions.set(input.id, input);
    this.attachToUser(this.userActionIndex, input.userId, input.id);
    return input;
  }

  private attachToUser(map: Map<ID, Set<ID>>, userId: ID, id: ID): void {
    let set = map.get(userId);
    if (!set) {
      set = new Set();
      map.set(userId, set);
    }
    set.add(id);
  }

  private emitPositionUpdate(pos: YieldPosition, op: string): void {
    this.emit('positionUpdate', pos, op);
  }

  private async executeCompound(pos: YieldPosition): Promise<YieldAction> {
    if (parseFloat(pos.pendingRewards) <= 0) {
      // 演示：根据 APY + 时间生成 pending rewards
      this.accruePendingRewards(pos);
    }
    const claimed = pos.pendingRewards;
    pos.earnedAmount = (parseFloat(pos.earnedAmount) + parseFloat(claimed)).toFixed(8);
    pos.pendingRewards = '0';
    pos.lastCompoundTime = Date.now();
    pos.currentValue = (parseFloat(pos.currentValue) + parseFloat(claimed)).toFixed(8);

    const action = this.recordAction({
      id: makeYieldId('act'),
      userId: pos.userId,
      positionId: pos.id,
      type: 'compound' as ActionType,
      protocol: pos.protocol,
      amount: claimed,
      status: 'confirmed',
      createdAt: Date.now(),
      confirmedAt: Date.now(),
    });
    this.emit('autoCompound', action);
    this.emitPositionUpdate(pos, 'compound');
    return action;
  }

  private async executeBatchCompound(positions: YieldPosition[]): Promise<YieldAction[]> {
    const out: YieldAction[] = [];
    for (const pos of positions) {
      out.push(await this.executeCompound(pos));
    }
    return out;
  }

  /**
   * 演示：根据 APY + 距 lastCompoundTime 累加 pending rewards
   */
  accruePendingRewards(pos: YieldPosition, now: number = Date.now()): void {
    const elapsedSec = Math.max(0, (now - pos.lastCompoundTime) / 1000);
    const apy = pos.apy;
    const principal = parseFloat(pos.currentValue);
    const rewards = (principal * apy * elapsedSec) / (365 * 24 * 3600);
    pos.pendingRewards = (parseFloat(pos.pendingRewards) + rewards).toFixed(8);
  }

  private riskMatchesPref(poolTier: RiskTier, pref: RiskTier): boolean {
    const order: RiskTier[] = ['low', 'medium', 'high', 'very_high'];
    const poolIdx = order.indexOf(poolTier);
    const prefIdx = order.indexOf(pref);
    return poolIdx <= prefIdx;
  }

  private buildReason(pool: YieldPool, _metrics: unknown, pref: RiskTier): string {
    const apyStr = (pool.apy * 100).toFixed(2);
    const risk = pool.riskTier;
    if (risk === 'low') {
      return `${pool.protocol} ${pool.symbol} 年化 ${apyStr}%, 风险 ${risk}, 符合用户风险偏好 (${pref})`;
    }
    return `${pool.protocol} ${pool.symbol} 年化 ${apyStr}%, 风险 ${risk}, 在用户风险偏好 (${pref}) 范围内`;
  }

  private emptyByProtocol(): Record<YieldProtocol, { deposited: string; value: string; earned: string; apy: number }> {
    return {
      LIDO: { deposited: '0', value: '0', earned: '0', apy: 0 },
      AAVE: { deposited: '0', value: '0', earned: '0', apy: 0 },
      COMPOUND: { deposited: '0', value: '0', earned: '0', apy: 0 },
      CURVE: { deposited: '0', value: '0', earned: '0', apy: 0 },
      CONVEX: { deposited: '0', value: '0', earned: '0', apy: 0 },
      YEARN: { deposited: '0', value: '0', earned: '0', apy: 0 },
      BEEFY: { deposited: '0', value: '0', earned: '0', apy: 0 },
      UNISWAP: { deposited: '0', value: '0', earned: '0', apy: 0 },
      PANCAKESWAP: { deposited: '0', value: '0', earned: '0', apy: 0 },
    };
  }

  // ===========================================================================
  // 公共访问器
  // ===========================================================================

  getScanner(): YieldScanner { return this.scanner; }
  getRiskAssessor(): RiskAssessor { return this.riskAssessor; }
  getAdapters(): { lido: LidoAdapter; aave: AaveAdapter; compound: CompoundAdapter; curve: CurveAdapter; convex: ConvexAdapter } {
    return { lido: this.lido, aave: this.aave, compound: this.compound, curve: this.curve, convex: this.convex };
  }
}

/** 工厂 */
export function createYieldEngine(opts?: YieldEngineOptions): YieldEngine {
  return new YieldEngine(opts);
}
