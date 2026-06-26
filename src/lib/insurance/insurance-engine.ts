/**
 * 保险业务引擎（InsuranceEngine）
 *
 * 业务层 + 集成：
 *  - 整合 PolicyService / ClaimEngine / PoolService
 *  - 集成事件总线（onPolicyIssued / onClaimSubmitted / ...）
 *  - 提供业务级 API：getQuote / purchase / claim / stake / withdraw
 *  - 报表：getPoolStats / getProductStats / getUserStats
 *
 * 典型用法：
 *   const ins = new InsuranceEngine();
 *   ins.deposit('u1', '10000');
 *   const quote = ins.getQuote({ product: 'smart_contract', coverageAmount: '1000', periodDays: 30 });
 *   const policy = ins.purchase('u1', { ... });
 *   ins.stake('provider1', '5000', 30);
 *   const claim = ins.submitClaim('u1', { policyId: policy.id, amount: '500', reason: '...', evidence: [...] });
 *   ins.approveClaim(claim.id);
 *   ins.payoutClaim(claim.id);
 */

import { decIsPositive, decTruncate } from '@/lib/matching/decimal';
import { PoolService } from './pool-service';
import { PolicyService, InMemoryWallet } from './policy-service';
import { ClaimEngine } from './claim-engine';
import { RiskPricingEngine } from './risk-pricing';
import { INSURANCE_GLOBAL_POOL_ID } from './types';
import type {
  Claim,
  ClaimEvidence,
  ClaimVoting,
  ID,
  InsurancePool,
  InsuranceProduct,
  InsuranceQuote,
  Policy,
  StakePosition,
  Voter,
} from './types';

// ============================================================================
// 事件
// ============================================================================

export type InsuranceEvent =
  | { type: 'policy_issued'; policy: Policy; quote: InsuranceQuote }
  | { type: 'claim_submitted'; claim: Claim }
  | { type: 'claim_approved'; claim: Claim }
  | { type: 'payout'; claim: Claim; amount: string }
  | { type: 'staked'; position: StakePosition }
  | { type: 'withdraw_completed'; position: StakePosition; payout: string };

export type InsuranceEventHandler = (event: InsuranceEvent) => void;

type Unsub = () => void;

// ============================================================================
// 用户统计
// ============================================================================

export interface UserInsuranceStats {
  policies: number;
  activePolicies: number;
  staked: string;
  earned: string;
  coverage: string;
  claims: number;
}

// ============================================================================
// 引擎
// ============================================================================

export interface InsuranceEngineOptions {
  pricingEngine?: RiskPricingEngine;
  poolService?: PoolService;
  policyService?: PolicyService;
  claimEngine?: ClaimEngine;
  /** 初始 pool 资金注入（演示） */
  initialPoolDeposit?: string;
}

export class InsuranceEngine {
  private pricing: RiskPricingEngine;
  private pool: PoolService;
  private policySvc: PolicyService;
  private claims: ClaimEngine;
  private wallet: InMemoryWallet;

  private handlers: Set<InsuranceEventHandler> = new Set();
  private _initialPoolDeposit: string;

  constructor(options: InsuranceEngineOptions = {}) {
    this.pricing = options.pricingEngine || new RiskPricingEngine();
    this.pool = options.poolService || new PoolService();
    this.wallet = new InMemoryWallet();
    this._initialPoolDeposit = options.initialPoolDeposit || '0';

    this.policySvc =
      options.policyService ||
      new PolicyService({
        pricingEngine: this.pricing,
        wallet: this.wallet,
        pool: {
          getAvailableCapital: (poolId: string) => {
            // 把 poolId 'global:smart_contract' 转成 totalStaked
            const id = poolId.includes(':') ? poolId : `${INSURANCE_GLOBAL_POOL_ID}:${poolId}`;
            const p = this.pool.getPool(id);
            return p ? p.totalStaked : '0';
          },
        },
      });

    this.claims = options.claimEngine || new ClaimEngine();

    // 注入依赖
    this.claims.setPolicyLookup({
      getPolicy: (id: ID) => this.policySvc.getPolicy(id),
      markClaimed: (id: ID, at?: number) => this.policySvc.markClaimed(id, at),
    });
    this.claims.setPayoutSink({
      payout: (userId: ID, amount: string, claimId: ID) => {
        // 从对应池子扣款
        const claim = this.claims.getClaim(claimId);
        if (!claim) return false;
        const policy = this.policySvc.getPolicy(claim.policyId);
        if (!policy) return false;
        const poolId = `${INSURANCE_GLOBAL_POOL_ID}:${policy.product}`;
        const r = this.pool.deductForClaim({ poolId, amount, userId });
        // 退款到用户钱包
        this.wallet.credit(userId, r.paid);
        return r.shortfall === '0' || decIsPositive(r.paid);
      },
    });

    // 转发 Policy 事件 → 保费入池
    this.policySvc.setHandler((evt) => {
      if (evt.type === 'purchased') {
        const poolId = `${INSURANCE_GLOBAL_POOL_ID}:${evt.policy.product}`;
        this.pool.distributePremium(evt.policy, poolId);
        this.emit({ type: 'policy_issued', policy: evt.policy, quote: { premium: evt.policy.premium } as InsuranceQuote });
      }
    });
    // 转发 Claim 事件
    this.claims.setHandler((evt) => {
      if (evt.type === 'submitted') {
        this.emit({ type: 'claim_submitted', claim: evt.claim });
      } else if (evt.type === 'approved') {
        this.emit({ type: 'claim_approved', claim: evt.claim });
      } else if (evt.type === 'paid') {
        this.emit({ type: 'payout', claim: evt.claim, amount: evt.amount });
      }
    });
    // 转发 Pool 事件
    this.pool.setHandler((evt) => {
      if (evt.type === 'staked') {
        this.emit({ type: 'staked', position: evt.position });
      } else if (evt.type === 'withdrawn') {
        this.emit({
          type: 'withdraw_completed',
          position: evt.position,
          payout: '0',
        });
      }
    });

    // 初始池子入金
    if (decIsPositive(this._initialPoolDeposit)) {
      this.pool.stake('__system__', INSURANCE_GLOBAL_POOL_ID, this._initialPoolDeposit, 0);
    }
  }

  // ==========================================================================
  // 1. 用户钱包
  // ==========================================================================

  /** 给用户充值（演示） */
  deposit(userId: ID, amount: string): void {
    this.wallet.topUp(userId, amount);
  }

  getWallet(userId: ID): { wallet: string; locked: string } {
    return this.wallet.getWallet(userId);
  }

  // ==========================================================================
  // 2. 报价 / 投保
  // ==========================================================================

  getQuote(opts: {
    product: InsuranceProduct;
    coverageAmount: string;
    periodDays: number;
    coveredAsset?: string;
  }): InsuranceQuote {
    return this.policySvc.getQuote(opts);
  }

  purchase(
    userId: ID,
    opts: {
      product: InsuranceProduct;
      coverageAmount: string;
      periodDays: number;
      coveredAsset?: string;
      coveredAddress?: string;
      premiumOverride?: string;
    }
  ): Policy {
    return this.policySvc.purchasePolicy(userId, opts);
  }

  cancel(policyId: ID, reason?: string) {
    return this.policySvc.cancelPolicy(policyId, { reason });
  }

  // ==========================================================================
  // 3. 理赔
  // ==========================================================================

  submitClaim(
    userId: ID,
    opts: {
      policyId: ID;
      amount: string;
      reason: string;
      evidence: ClaimEvidence[];
    }
  ): Claim {
    return this.claims.submitClaim({
      policyId: opts.policyId,
      userId,
      amount: opts.amount,
      reason: opts.reason,
      evidence: opts.evidence,
    });
  }

  investigateClaim(
    claimId: ID,
    investigatorId: string,
    notes?: string,
    addEvidence?: ClaimEvidence[]
  ): Claim {
    return this.claims.investigate(claimId, investigatorId, { notes, addEvidence });
  }

  startVoting(claimId: ID, opts?: Partial<ClaimVoting>): ClaimVoting {
    return this.claims.createVoting(claimId, opts);
  }

  vote(claimId: ID, voter: { address: string; vote: 'approve' | 'reject'; weight?: number; reason?: string }): {
    claim: Claim;
    voter: Voter;
  } {
    return this.claims.voteOnClaim(claimId, voter);
  }

  approveClaim(claimId: ID, amount?: string): Claim {
    return this.claims.approveClaim(claimId, amount);
  }

  rejectClaim(claimId: ID, reason: string): Claim {
    return this.claims.rejectClaim(claimId, reason);
  }

  payoutClaim(claimId: ID): Claim {
    return this.claims.payoutClaim(claimId);
  }

  // ==========================================================================
  // 4. 承保
  // ==========================================================================

  stake(userId: ID, amount: string, lockupDays?: number, product?: InsuranceProduct): StakePosition {
    const poolId = product
      ? `${INSURANCE_GLOBAL_POOL_ID}:${product}`
      : INSURANCE_GLOBAL_POOL_ID;
    return this.pool.stake(userId, poolId, amount, lockupDays);
  }

  distributeYield(poolId: string, amount: string): void {
    this.pool.distributeYield(poolId, amount);
  }

  rebalancePools(): void {
    this.pool.rebalanceReserves();
  }

  requestWithdraw(positionId: ID): StakePosition {
    return this.pool.requestWithdraw(positionId);
  }

  processWithdraw(positionId: ID): { position: StakePosition; payout: string; penalty: string } {
    const r = this.pool.processWithdraw(positionId);
    // 退款到用户钱包
    if (decIsPositive(r.payout)) {
      this.wallet.credit(r.position.userId, r.payout);
    }
    return r;
  }

  // ==========================================================================
  // 5. 报表
  // ==========================================================================

  getPoolStats(poolId: string): InsurancePool {
    return this.pool.getPool(poolId) || this.pool.getPoolByProduct('smart_contract');
  }

  getProductStats(product: InsuranceProduct): InsurancePool {
    return this.pool.getPoolByProduct(product);
  }

  getUserStats(userId: ID): UserInsuranceStats {
    const policies = this.policySvc.getUserPolicies(userId);
    const positions = this.pool.getUserPositions(userId);
    const claims = this.claims.getUserClaims(userId);
    let staked = '0';
    let earned = '0';
    let coverage = '0';
    for (const p of positions) {
      staked = decTruncate((Number(staked) + Number(p.amount)).toString(), 8);
      earned = decTruncate((Number(earned) + Number(p.totalReturn)).toString(), 8);
    }
    for (const pol of policies) {
      if (pol.status === 'active') {
        coverage = decTruncate((Number(coverage) + Number(pol.coverageAmount)).toString(), 8);
      }
    }
    return {
      policies: policies.length,
      activePolicies: policies.filter((p) => p.status === 'active').length,
      staked,
      earned,
      coverage,
      claims: claims.length,
    };
  }

  // ==========================================================================
  // 6. 事件订阅
  // ==========================================================================

  onPolicyIssued(handler: (policy: Policy, quote: InsuranceQuote) => void): Unsub {
    const wrap = (e: InsuranceEvent) => {
      if (e.type === 'policy_issued') handler(e.policy, e.quote);
    };
    return this.subscribe(wrap);
  }

  onClaimSubmitted(handler: (claim: Claim) => void): Unsub {
    const wrap = (e: InsuranceEvent) => {
      if (e.type === 'claim_submitted') handler(e.claim);
    };
    return this.subscribe(wrap);
  }

  onClaimApproved(handler: (claim: Claim) => void): Unsub {
    const wrap = (e: InsuranceEvent) => {
      if (e.type === 'claim_approved') handler(e.claim);
    };
    return this.subscribe(wrap);
  }

  onPayout(handler: (claim: Claim, amount: string) => void): Unsub {
    const wrap = (e: InsuranceEvent) => {
      if (e.type === 'payout') handler(e.claim, e.amount);
    };
    return this.subscribe(wrap);
  }

  onStaked(handler: (position: StakePosition) => void): Unsub {
    const wrap = (e: InsuranceEvent) => {
      if (e.type === 'staked') handler(e.position);
    };
    return this.subscribe(wrap);
  }

  private subscribe(handler: InsuranceEventHandler): Unsub {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  // ==========================================================================
  // 7. 直接访问子服务
  // ==========================================================================

  getPolicyService(): PolicyService {
    return this.policySvc;
  }

  getClaimEngine(): ClaimEngine {
    return this.claims;
  }

  getPoolService(): PoolService {
    return this.pool;
  }

  getPricingEngine(): RiskPricingEngine {
    return this.pricing;
  }

  /** 清空所有状态（测试用） */
  reset(): void {
    this.policySvc.reset();
    this.claims.reset();
    this.pool.reset();
    this.wallet.reset();
    this.handlers.clear();
  }

  private emit(event: InsuranceEvent): void {
    for (const h of this.handlers) {
      try {
        h(event);
      } catch {
        // 忽略
      }
    }
  }
}
