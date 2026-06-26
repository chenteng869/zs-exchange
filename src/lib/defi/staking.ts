/**
 * 质押 (Staking)
 *
 * 活期/定期质押池
 *  - 自动按秒计息
 *  - 定期：到期才能解锁（需等 lockDays）
 *  - 活期：随时解锁（penalty=0）
 */

import type { ID } from '@/types/models';

// =============================================================================
// 类型
// =============================================================================

export type PoolType = 'flexible' | 'locked';

export interface StakingPool {
  id: ID;
  asset: string;
  type: PoolType;
  apy: number;            // 年化 %
  lockDays: number;       // 0 = 活期
  minAmount: string;
  maxAmount: string;
  totalStaked: string;
  capacity: string;
  enabled: boolean;
}

export interface StakePosition {
  id: ID;
  userId: ID;
  poolId: ID;
  asset: string;
  principal: string;
  rewards: string;        // 已结算
  pendingRewards: string; // 待领取
  apy: number;
  stakedAt: string;
  unlockAt: string | null;
  status: 'active' | 'unlocked' | 'claimed';
}

// =============================================================================
// 工具：按秒计息
// =============================================================================

function secondsBetween(from: string, to: string): number {
  return Math.max(0, (new Date(to).getTime() - new Date(from).getTime()) / 1000);
}

function bigAdd(a: string, b: string): string {
  return (parseFloat(a) + parseFloat(b)).toString();
}

function bigSub(a: string, b: string): string {
  return Math.max(0, parseFloat(a) - parseFloat(b)).toString();
}

// =============================================================================
// StakingService
// =============================================================================

export class StakingService {
  private pools: Map<ID, StakingPool> = new Map();
  private positions: Map<ID, StakePosition> = new Map();
  private userPositions: Map<ID, Set<ID>> = new Map();

  createPool(pool: Omit<StakingPool, 'totalStaked'>): StakingPool {
    const full: StakingPool = { ...pool, totalStaked: '0' };
    this.pools.set(pool.id, full);
    return full;
  }

  getPool(id: ID): StakingPool | undefined {
    return this.pools.get(id);
  }

  getAllPools(): StakingPool[] {
    return Array.from(this.pools.values()).filter((p) => p.enabled);
  }

  /**
   * 质押
   */
  stake(userId: ID, poolId: ID, amount: string): StakePosition {
    const pool = this.pools.get(poolId);
    if (!pool) throw new Error('Pool not found');
    if (parseFloat(amount) < parseFloat(pool.minAmount)) {
      throw new Error(`Below minimum ${pool.minAmount}`);
    }
    if (parseFloat(amount) > parseFloat(pool.maxAmount)) {
      throw new Error(`Above maximum ${pool.maxAmount}`);
    }

    const id = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const pos: StakePosition = {
      id,
      userId,
      poolId,
      asset: pool.asset,
      principal: amount,
      rewards: '0',
      pendingRewards: '0',
      apy: pool.apy,
      stakedAt: now,
      unlockAt: pool.lockDays > 0
        ? new Date(Date.now() + pool.lockDays * 86400_000).toISOString()
        : null,
      status: 'active',
    };
    this.positions.set(id, pos);
    this.attachToUser(userId, id);
    pool.totalStaked = bigAdd(pool.totalStaked, amount);
    return pos;
  }

  /**
   * 计算累计收益（按秒复利）
   */
  calculateRewards(positionId: ID): string {
    const pos = this.positions.get(positionId);
    if (!pos) throw new Error('Position not found');
    const secs = secondsBetween(pos.stakedAt, new Date().toISOString());
    // 单利: principal * apy / 100 / (365*24*3600) * secs
    const perSec = parseFloat(pos.principal) * (pos.apy / 100) / (365 * 24 * 3600);
    return (perSec * secs).toFixed(8);
  }

  /**
   * 解除质押
   */
  unstake(userId: ID, positionId: ID): { principal: string; rewards: string } {
    const pos = this.positions.get(positionId);
    if (!pos) throw new Error('Position not found');
    if (pos.userId !== userId) throw new Error('Not owner');
    if (pos.status !== 'active') throw new Error('Already exited');
    if (pos.unlockAt && new Date(pos.unlockAt).getTime() > Date.now()) {
      throw new Error('Still locked');
    }
    pos.pendingRewards = this.calculateRewards(positionId);
    pos.rewards = bigAdd(pos.rewards, pos.pendingRewards);
    pos.status = 'unlocked';
    const pool = this.pools.get(pos.poolId);
    if (pool) pool.totalStaked = bigSub(pool.totalStaked, pos.principal);
    return { principal: pos.principal, rewards: pos.rewards };
  }

  /**
   * 领取收益
   */
  claimRewards(userId: ID, positionId: ID): string {
    const pos = this.positions.get(positionId);
    if (!pos) throw new Error('Position not found');
    if (pos.userId !== userId) throw new Error('Not owner');
    const earned = this.calculateRewards(positionId);
    pos.rewards = bigAdd(pos.rewards, earned);
    pos.pendingRewards = '0';
    return earned;
  }

  getUserPositions(userId: ID): StakePosition[] {
    const ids = this.userPositions.get(userId) ?? new Set();
    return Array.from(ids)
      .map((id) => this.positions.get(id))
      .filter((p): p is StakePosition => Boolean(p));
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
