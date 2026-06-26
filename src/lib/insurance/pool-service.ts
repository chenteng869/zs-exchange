/**
 * 保险池服务（PoolService）
 *
 * 职责：
 *  - 入金（staking）：用户投入资金获得份额
 *  - 收益分配：保费按份额比例分配；协议收益
 *  - 损失准备：理赔赔付从池子支出
 *  - 退出：排队 → 7 天锁仓 → 到账；早退扣 5%
 *  - APY 计算：基于保费 / 池子规模
 *
 * 份额模型：
 *  - share = amount / totalShares * totalPooled
 *  - 初始 share = amount（池为空时 1:1）
 *  - 后续 share = amount / sharePrice（sharePrice = totalPooled/totalShares）
 */

import {
  decAdd,
  decCmp,
  decDiv,
  decIsPositive,
  decMax,
  decMin,
  decMul,
  decSub,
  decTruncate,
} from '@/lib/matching/decimal';
import {
  INSURANCE_EARLY_WITHDRAW_PENALTY,
  INSURANCE_GLOBAL_POOL_ID,
  INSURANCE_POOL_UTILIZATION_TARGET,
  INSURANCE_WITHDRAW_LOCKUP_DAYS,
  makeInsuranceId,
} from './types';
import type {
  ID,
  InsurancePool,
  InsuranceProduct,
  Policy,
  StakePosition,
  StakeStatus,
} from './types';

// ============================================================================
// 错误
// ============================================================================

export class PoolError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'PoolError';
  }
}

// ============================================================================
// 事件
// ============================================================================

export type PoolEvent =
  | { type: 'staked'; position: StakePosition; pool: InsurancePool }
  | { type: 'premium_distributed'; poolId: string; amount: string; pool: InsurancePool }
  | { type: 'yield_distributed'; poolId: string; amount: string; pool: InsurancePool }
  | { type: 'claim_deducted'; poolId: string; amount: string; pool: InsurancePool }
  | { type: 'withdraw_requested'; position: StakePosition }
  | { type: 'withdrawn'; position: StakePosition; penalty: string }
  | { type: 'rebalanced'; pool: InsurancePool };

export type PoolEventHandler = (event: PoolEvent) => void;

// ============================================================================
// 内部池状态
// ============================================================================

interface InternalPool {
  product: InsuranceProduct;
  totalStaked: string;     // 总入金
  totalShares: string;     // 总份额
  totalCoverage: string;   // 总保额
  totalClaims: string;     // 累计赔付
  totalPremium: string;    // 累计保费收入
  totalYield: string;      // 累计协议收益
  premiumRate: number;     // 当前保费率
  policies: number;        // 保单数
  participants: Set<string>; // 承保人集合
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// 引擎
// ============================================================================

export interface PoolServiceOptions {
  /** 全局池 ID（默认 'global'） */
  globalPoolId?: string;
  /** 锁仓天数 */
  withdrawLockupDays?: number;
  /** 早退惩罚 */
  earlyWithdrawPenalty?: number;
  /** 目标利用率 */
  utilizationTarget?: number;
  onEvent?: PoolEventHandler;
}

export class PoolService {
  private globalPoolId: string;
  private withdrawLockupDays: number;
  private earlyWithdrawPenalty: number;
  private utilizationTarget: number;
  private handler: PoolEventHandler | null = null;

  /** poolId (string) -> InternalPool */
  private pools: Map<string, InternalPool> = new Map();
  /** positionId -> StakePosition */
  private positions: Map<ID, StakePosition> = new Map();
  /** userId -> Set<positionId> */
  private userPositions: Map<ID, Set<ID>> = new Map();
  /** 历史 premium yield 快照（用于 APY 计算） */
  private premiumHistory: Map<string, { ts: number; amount: string }[]> = new Map();

  constructor(options: PoolServiceOptions = {}) {
    this.globalPoolId = options.globalPoolId ?? INSURANCE_GLOBAL_POOL_ID;
    this.withdrawLockupDays =
      options.withdrawLockupDays ?? INSURANCE_WITHDRAW_LOCKUP_DAYS;
    this.earlyWithdrawPenalty =
      options.earlyWithdrawPenalty ?? INSURANCE_EARLY_WITHDRAW_PENALTY;
    this.utilizationTarget =
      options.utilizationTarget ?? INSURANCE_POOL_UTILIZATION_TARGET;
    this.handler = options.onEvent || null;
  }

  // ==========================================================================
  // 1. 入金
  // ==========================================================================

  /**
   * 入金（staking）
   *  - 创建或追加 position
   *  - 更新池子总入金 + 总份额
   *  - sharePrice = totalPooled / totalShares（首笔 1:1）
   */
  stake(
    userId: ID,
    poolId: string,
    amount: string,
    lockupDays: number = this.withdrawLockupDays
  ): StakePosition {
    if (!decIsPositive(amount)) {
      throw new PoolError('INVALID_AMOUNT', 'amount must be > 0');
    }
    if (lockupDays < 0) {
      throw new PoolError('INVALID_LOCKUP', 'lockupDays must be >= 0');
    }
    const pool = this.ensurePool(poolId);

    // sharePrice = totalStaked / totalShares
    const sharePrice = this.getSharePrice(pool);
    const shareToMint = decTruncate(decMul(amount, decDiv('1', sharePrice, 18)), 8);

    const now = Date.now();
    const position: StakePosition = {
      id: makeInsuranceId('stk'),
      userId,
      poolId,
      amount,
      share: shareToMint,
      earnedPremium: '0',
      earnedYield: '0',
      lossReserve: '0',
      totalReturn: '0',
      apy: 0,
      lockupDays,
      status: 'active',
      stakedAt: now,
    };

    this.positions.set(position.id, position);
    const set = this.userPositions.get(userId) || new Set();
    set.add(position.id);
    this.userPositions.set(userId, set);

    // 更新池子
    pool.totalStaked = decTruncate(decAdd(pool.totalStaked, amount), 8);
    pool.totalShares = decTruncate(decAdd(pool.totalShares, shareToMint), 8);
    pool.participants.add(userId);
    pool.updatedAt = now;

    this.emit({
      type: 'staked',
      position: { ...position },
      pool: this.snapshotPool(poolId, pool),
    });
    return { ...position };
  }

  // ==========================================================================
  // 2. 收益分配
  // ==========================================================================

  /**
   * 分配保费
   *  - 把 policy 的 premium 按份额比例计入每个 active 仓位
   *  - 更新池子的 totalPremium
   */
  distributePremium(policy: Policy, poolId?: string): void {
    const poolKey = poolId || this.productPoolId(policy.product);
    const pool = this.ensurePool(poolKey);
    const amount = policy.premium;
    if (!decIsPositive(amount)) return;
    const totalShares = pool.totalShares;
    if (decIsPositive(totalShares) === false) {
      // 没有承保人 -> 保费进入准备金
      pool.totalPremium = decTruncate(decAdd(pool.totalPremium, amount), 8);
      pool.updatedAt = Date.now();
      return;
    }

    // 按比例分配
    for (const pos of this.positions.values()) {
      if (pos.status !== 'active') continue;
      if (pos.poolId !== poolKey) continue;
      const shareRatio = decDiv(pos.share, totalShares, 18);
      const portion = decTruncate(decMul(amount, shareRatio), 8);
      pos.earnedPremium = decTruncate(decAdd(pos.earnedPremium, portion), 8);
      pos.totalReturn = decTruncate(decAdd(pos.totalReturn, portion), 8);
      this.positions.set(pos.id, pos);
    }
    pool.totalPremium = decTruncate(decAdd(pool.totalPremium, amount), 8);
    pool.policies += 1;
    pool.totalCoverage = decTruncate(
      decAdd(pool.totalCoverage, policy.coverageAmount),
      8
    );
    pool.updatedAt = Date.now();

    this.recordPremiumHistory(poolKey, amount);

    this.emit({
      type: 'premium_distributed',
      poolId: poolKey,
      amount,
      pool: this.snapshotPool(poolKey, pool),
    });
  }

  /**
   * 分配协议收益（如其它 DeFi 协议收益）
   *  - 与保费分配类似，但更新 earnedYield
   */
  distributeYield(poolId: string, amount: string): void {
    if (!decIsPositive(amount)) return;
    const pool = this.ensurePool(poolId);
    if (!decIsPositive(pool.totalShares)) {
      pool.totalYield = decTruncate(decAdd(pool.totalYield, amount), 8);
      pool.updatedAt = Date.now();
      return;
    }
    for (const pos of this.positions.values()) {
      if (pos.status !== 'active') continue;
      if (pos.poolId !== poolId) continue;
      const shareRatio = decDiv(pos.share, pool.totalShares, 18);
      const portion = decTruncate(decMul(amount, shareRatio), 8);
      pos.earnedYield = decTruncate(decAdd(pos.earnedYield, portion), 8);
      pos.totalReturn = decTruncate(decAdd(pos.totalReturn, portion), 8);
      this.positions.set(pos.id, pos);
    }
    pool.totalYield = decTruncate(decAdd(pool.totalYield, amount), 8);
    pool.updatedAt = Date.now();

    this.emit({
      type: 'yield_distributed',
      poolId,
      amount,
      pool: this.snapshotPool(poolId, pool),
    });
  }

  // ==========================================================================
  // 3. 损失准备
  // ==========================================================================

  /**
   * 赔付扣除
   *  - 从池子总入金中扣除
   *  - 记录为 lossReserve 计入各仓位
   *  - 若池子资金不足：先扣光再透支
   */
  deductForClaim(opts: {
    poolId: string;
    amount: string;
    userId?: ID;
  }): { paid: string; shortfall: string } {
    const pool = this.ensurePool(opts.poolId);
    const available = decTruncate(decSub(pool.totalStaked, pool.totalClaims), 8);
    const pay = decTruncate(opts.amount, 8);
    const actuallyPaid = decMin(available, pay);
    const shortfall = decTruncate(decSub(pay, actuallyPaid), 8);

    pool.totalClaims = decTruncate(decAdd(pool.totalClaims, actuallyPaid), 8);
    pool.updatedAt = Date.now();

    // 按份额扣除 lossReserve
    if (decIsPositive(pool.totalShares)) {
      const reservePerShare = decDiv(actuallyPaid, pool.totalShares, 18);
      for (const pos of this.positions.values()) {
        if (pos.poolId !== opts.poolId) continue;
        const reserve = decTruncate(decMul(reservePerShare, pos.share), 8);
        pos.lossReserve = decTruncate(decAdd(pos.lossReserve, reserve), 8);
        pos.totalReturn = decTruncate(decSub(pos.totalReturn, reserve), 8);
        this.positions.set(pos.id, pos);
      }
    }

    this.emit({
      type: 'claim_deducted',
      poolId: opts.poolId,
      amount: actuallyPaid,
      pool: this.snapshotPool(opts.poolId, pool),
    });
    return { paid: actuallyPaid, shortfall };
  }

  /**
   * 调整保费率（基于当前利用率）
   *  - 利用率 < target：降费率
   *  - 利用率 > target：升费率（最多 5x）
   */
  rebalanceReserves(): void {
    for (const [poolId, pool] of this.pools) {
      const utilization = decIsPositive(pool.totalStaked)
        ? Number(decDiv(pool.totalCoverage, pool.totalStaked, 8))
        : 0;
      // 简单策略：费率 = 基础 * (0.5 + utilization)
      const baseRate = this.getBaseRate(pool.product);
      const newRate = baseRate * (0.5 + utilization);
      const capped = Math.min(newRate, baseRate * 5);
      pool.premiumRate = capped;
      pool.updatedAt = Date.now();
      this.emit({
        type: 'rebalanced',
        pool: this.snapshotPool(poolId, pool),
      });
    }
  }

  // ==========================================================================
  // 4. APY 计算
  // ==========================================================================

  /**
   * 计算池子 APY
   *  - 基于最近 period 天的保费收入 / 池子总规模
   *  - 输出年化（period = 30）
   */
  calculateApy(poolId: string, periodDays: number = 30): number {
    const pool = this.pools.get(poolId);
    if (!pool) return 0;
    if (!decIsPositive(pool.totalStaked)) return 0;

    const history = this.premiumHistory.get(poolId) || [];
    const cutoff = Date.now() - periodDays * 24 * 3600_000;
    let sum = '0';
    for (const h of history) {
      if (h.ts >= cutoff) {
        sum = decAdd(sum, h.amount);
      }
    }

    // period 收益 / 池子规模 = 期间收益率 → 年化
    const periodReturn = Number(decDiv(sum, pool.totalStaked, 18));
    return periodReturn * (365 / periodDays);
  }

  // ==========================================================================
  // 5. 退出
  // ==========================================================================

  /**
   * 申请退出（排队）
   *  - 标记为 withdrawing
   *  - 7 天后到账（unlockTime 基于 stakedAt 计算，保证一致性）
   */
  requestWithdraw(positionId: ID, now: number = Date.now()): StakePosition {
    const pos = this.positions.get(positionId);
    if (!pos) {
      throw new PoolError('POSITION_NOT_FOUND', `Position not found: ${positionId}`);
    }
    if (pos.status !== 'active') {
      throw new PoolError(
        'POSITION_NOT_ACTIVE',
        `Position status=${pos.status}`
      );
    }
    const updated: StakePosition = {
      ...pos,
      status: 'withdrawing',
      withdrawRequestAt: now,
      unlockTime: pos.stakedAt + pos.lockupDays * 24 * 3600_000,
    };
    this.positions.set(positionId, updated);
    this.emit({ type: 'withdraw_requested', position: updated });
    return { ...updated };
  }

  /**
   * 处理退出
   *  - 退还本金 + 收益 - lossReserve
   *  - 早退（在 unlockTime 之前）扣 5% 惩罚
   *  - 标记为 withdrawn，从池子扣除
   */
  processWithdraw(positionId: ID, now: number = Date.now()): {
    position: StakePosition;
    payout: string;
    penalty: string;
  } {
    const pos = this.positions.get(positionId);
    if (!pos) {
      throw new PoolError('POSITION_NOT_FOUND', `Position not found: ${positionId}`);
    }
    if (pos.status !== 'withdrawing') {
      throw new PoolError(
        'NOT_WITHDRAWING',
        `Position status=${pos.status}, must be withdrawing`
      );
    }
    if (pos.unlockTime === undefined) {
      throw new PoolError('NO_UNLOCK_TIME', 'unlockTime not set');
    }

    const isEarly = now < pos.unlockTime;
    const penaltyRate = isEarly ? this.earlyWithdrawPenalty : 0;
    // 应退 = 本金 + 收益 - 准备金
    const gross = decTruncate(
      decAdd(
        decAdd(pos.amount, pos.totalReturn),
        '0'
      ),
      8
    );
    // 防止 gross < amount 的极端情况
    const safeGross = decMax(gross, pos.amount);
    // lossReserve 已从 totalReturn 中扣除
    const payout0 = decTruncate(decSub(safeGross, pos.lossReserve), 8);
    // 使用 Number 计算以避免 decimal 模块对小数（如 0.05 -> "0.05000000"）的解析问题
    const payout0Num = Number(payout0);
    const penaltyNum = payout0Num * penaltyRate;
    const payoutNum = payout0Num - penaltyNum;
    const penalty = decTruncate(
      Number.isFinite(penaltyNum) ? penaltyNum.toString() : '0',
      8
    );
    const payout = decTruncate(
      Number.isFinite(payoutNum) ? payoutNum.toString() : payout0,
      8
    );

    // 更新池子
    const pool = this.ensurePool(pos.poolId);
    pool.totalStaked = decTruncate(decMax(decSub(pool.totalStaked, pos.amount), '0'), 8);
    pool.totalShares = decTruncate(
      decMax(decSub(pool.totalShares, pos.share), '0'),
      8
    );
    pool.updatedAt = now;

    const updated: StakePosition = {
      ...pos,
      status: 'withdrawn',
    };
    this.positions.set(positionId, updated);
    this.emit({ type: 'withdrawn', position: updated, penalty });
    return { position: updated, payout, penalty };
  }

  // ==========================================================================
  // 6. 查询
  // ==========================================================================

  getPosition(id: ID): StakePosition | null {
    const p = this.positions.get(id);
    return p ? { ...p } : null;
  }

  getUserPositions(userId: ID, status?: StakeStatus): StakePosition[] {
    const ids = this.userPositions.get(userId) || new Set();
    const out: StakePosition[] = [];
    for (const id of ids) {
      const p = this.positions.get(id);
      if (!p) continue;
      if (status && p.status !== status) continue;
      out.push({ ...p });
    }
    return out;
  }

  getPool(poolId: string): InsurancePool | null {
    const p = this.pools.get(poolId);
    return p ? this.snapshotPool(poolId, p) : null;
  }

  getAllPools(): InsurancePool[] {
    return Array.from(this.pools.entries()).map(([id, p]) =>
      this.snapshotPool(id, p)
    );
  }

  getPoolByProduct(product: InsuranceProduct): InsurancePool {
    const id = this.productPoolId(product);
    return this.snapshotPool(id, this.ensurePool(id));
  }

  // ==========================================================================
  // 7. 内部
  // ==========================================================================

  private productPoolId(product: InsuranceProduct): string {
    return `${this.globalPoolId}:${product}`;
  }

  private ensurePool(poolId: string): InternalPool {
    let p = this.pools.get(poolId);
    if (!p) {
      // 解析 product
      let product: InsuranceProduct = 'smart_contract';
      if (poolId.includes(':')) {
        const tail = poolId.split(':')[1] as InsuranceProduct;
        product = tail;
      }
      p = {
        product,
        totalStaked: '0',
        totalShares: '0',
        totalCoverage: '0',
        totalClaims: '0',
        totalPremium: '0',
        totalYield: '0',
        premiumRate: this.getBaseRate(product),
        policies: 0,
        participants: new Set(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.pools.set(poolId, p);
    }
    return p;
  }

  private getBaseRate(product: InsuranceProduct): number {
    const map: Record<InsuranceProduct, number> = {
      exchange_hack: 0.008,
      smart_contract: 0.012,
      stablecoin_depeg: 0.005,
      oracle_failure: 0.003,
      liquidation_penalty: 0.006,
    };
    return map[product];
  }

  private getSharePrice(pool: InternalPool): string {
    if (!decIsPositive(pool.totalShares)) return '1';
    return decTruncate(decDiv(pool.totalStaked, pool.totalShares, 18), 8);
  }

  private snapshotPool(poolId: string, pool: InternalPool): InsurancePool {
    const utilization = decIsPositive(pool.totalStaked)
      ? decTruncate(decDiv(pool.totalCoverage, pool.totalStaked, 8), 8)
      : '0';
    const claimRatio = decIsPositive(pool.totalPremium)
      ? decTruncate(decDiv(pool.totalClaims, pool.totalPremium, 8), 8)
      : '0';
    return {
      id: poolId,
      product: pool.product,
      totalStaked: pool.totalStaked,
      totalCoverage: pool.totalCoverage,
      totalClaims: pool.totalClaims,
      utilizationRate: utilization,
      premiumRate: pool.premiumRate,
      claimRatio,
      participants: pool.participants.size,
      policies: pool.policies,
      updatedAt: pool.updatedAt,
    };
  }

  private recordPremiumHistory(poolId: string, amount: string): void {
    const list = this.premiumHistory.get(poolId) || [];
    list.push({ ts: Date.now(), amount });
    // 仅保留 365 天
    const cutoff = Date.now() - 365 * 24 * 3600_000;
    const filtered = list.filter((h) => h.ts >= cutoff);
    this.premiumHistory.set(poolId, filtered);
  }

  setHandler(handler: PoolEventHandler | null): void {
    this.handler = handler;
  }

  reset(): void {
    this.pools.clear();
    this.positions.clear();
    this.userPositions.clear();
    this.premiumHistory.clear();
  }

  private emit(event: PoolEvent): void {
    if (this.handler) {
      try {
        this.handler(event);
      } catch {
        // 忽略
      }
    }
  }
}
