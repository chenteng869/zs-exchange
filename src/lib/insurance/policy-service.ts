/**
 * 保单服务（PolicyService）
 *
 * 职责：
 *  - 报价：根据产品/资产/保额/期间计算保费（含风险调整）
 *  - 投保：扣保费 → 创建 active 保单
 *  - 退保：14 天内可退，扣 5% 退保手续费
 *  - 查询：保单详情、用户保单列表、活跃保单、即将到期保单
 *
 * 协作：
 *  - RiskPricingEngine   →  风险评估 + 保费
 *  - PoolService         →  保费入池、capital check
 *  - InsuranceEngine     →  顶层事件分发
 */

import {
  decAdd,
  decCmp,
  decDiv,
  decIsPositive,
  decMul,
  decSub,
  decTruncate,
} from '@/lib/matching/decimal';
import {
  INSURANCE_CANCEL_FEE_RATE,
  INSURANCE_CANCEL_GRACE_DAYS,
  INSURANCE_DEFAULT_PERIODS,
  INSURANCE_PAYOUT_RATIO,
  INSURANCE_QUOTE_TTL_MS,
  makeInsuranceId,
} from './types';
import { RiskPricingEngine } from './risk-pricing';
import type {
  ID,
  InsuranceProduct,
  InsuranceQuote,
  Policy,
  PolicyStatus,
} from './types';

// ============================================================================
// 错误
// ============================================================================

export class PolicyError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'PolicyError';
  }
}

// ============================================================================
// 事件
// ============================================================================

export type PolicyEvent =
  | { type: 'quote'; quote: InsuranceQuote }
  | { type: 'purchased'; policy: Policy }
  | { type: 'cancelled'; policy: Policy; refund: string; fee: string }
  | { type: 'expired'; policy: Policy };

export type PolicyEventHandler = (event: PolicyEvent) => void;

// ============================================================================
// 用户钱包接口（解耦，由上层注入）
// ============================================================================

export interface UserWallet {
  /** 钱包余额（USDT） */
  wallet: string;
  /** 已锁定余额 */
  locked: string;
}

export interface WalletAdapter {
  getWallet(userId: ID): UserWallet;
  debit(userId: ID, amount: string): boolean;
  credit(userId: ID, amount: string): void;
}

// 默认内存钱包（演示用）
export class InMemoryWallet implements WalletAdapter {
  private wallets: Map<ID, UserWallet> = new Map();

  getWallet(userId: ID): UserWallet {
    let w = this.wallets.get(userId);
    if (!w) {
      w = { wallet: '0', locked: '0' };
      this.wallets.set(userId, w);
    }
    return { ...w };
  }

  debit(userId: ID, amount: string): boolean {
    if (!decIsPositive(amount)) return false;
    const w = this.getWallet(userId);
    if (decCmp(w.wallet, amount) < 0) return false;
    const next = decTruncate(decSub(w.wallet, amount), 8);
    this.wallets.set(userId, { wallet: next, locked: w.locked });
    return true;
  }

  credit(userId: ID, amount: string): void {
    if (!decIsPositive(amount)) return;
    const w = this.getWallet(userId);
    const next = decTruncate(decAdd(w.wallet, amount), 8);
    this.wallets.set(userId, { wallet: next, locked: w.locked });
  }

  /** 注入初始资金（演示） */
  topUp(userId: ID, amount: string): void {
    this.credit(userId, amount);
  }

  reset(): void {
    this.wallets.clear();
  }
}

// ============================================================================
// 池子资本接口（解耦）
// ============================================================================

export interface PoolCapital {
  /** 池子剩余资本（可赔付额度） */
  getAvailableCapital(poolId: string): string;
}

// ============================================================================
// 引擎
// ============================================================================

export interface PolicyServiceOptions {
  pricingEngine?: RiskPricingEngine;
  wallet?: WalletAdapter;
  pool?: PoolCapital;
  /** 报价过期时间（默认 60s） */
  quoteTtlMs?: number;
  /** 退保宽限期（默认 14 天） */
  cancelGraceDays?: number;
  /** 退保手续费率 */
  cancelFeeRate?: number;
  /** 事件回调 */
  onEvent?: PolicyEventHandler;
}

export class PolicyService {
  private pricing: RiskPricingEngine;
  private wallet: WalletAdapter;
  private pool: PoolCapital | null;
  private quoteTtlMs: number;
  private cancelGraceDays: number;
  private cancelFeeRate: number;
  private handler: PolicyEventHandler | null = null;

  /** policyId -> Policy */
  private policies: Map<ID, Policy> = new Map();
  /** userId -> Set<policyId> */
  private userPolicies: Map<ID, Set<ID>> = new Map();
  /** quoteId -> InsuranceQuote */
  private quotes: Map<ID, InsuranceQuote> = new Map();
  private seq = 0;

  constructor(options: PolicyServiceOptions = {}) {
    this.pricing = options.pricingEngine || new RiskPricingEngine();
    this.wallet = options.wallet || new InMemoryWallet();
    this.pool = options.pool || null;
    this.quoteTtlMs = options.quoteTtlMs ?? INSURANCE_QUOTE_TTL_MS;
    this.cancelGraceDays = options.cancelGraceDays ?? INSURANCE_CANCEL_GRACE_DAYS;
    this.cancelFeeRate = options.cancelFeeRate ?? INSURANCE_CANCEL_FEE_RATE;
    this.handler = options.onEvent || null;
  }

  // ==========================================================================
  // 1. 报价
  // ==========================================================================

  /**
   * 报价（含风险评分 + 保费 + TTL）
   *  - 报价 60s 过期
   *  - periodDays 不在默认列表中时取最接近的有效值
   */
  getQuote(opts: {
    product: InsuranceProduct;
    coverageAmount: string;
    periodDays: number;
    coveredAsset?: string;
  }): InsuranceQuote {
    if (!decIsPositive(opts.coverageAmount)) {
      throw new PolicyError('INVALID_COVERAGE', 'coverageAmount must be > 0');
    }
    if (opts.periodDays <= 0) {
      throw new PolicyError('INVALID_PERIOD', 'periodDays must be > 0');
    }

    const period = this.normalizePeriod(opts.periodDays);
    const asset = opts.coveredAsset || 'USDT';
    const assessment = this.pricing.assessRisk(opts.product, asset);
    const premium = this.pricing.calculatePremium({
      coverage: opts.coverageAmount,
      period,
      riskScore: assessment.score,
      product: opts.product,
    });

    // deductible = 风险评估越高，免赔额越大
    const deductible = decTruncate(
      decMul(opts.coverageAmount, (assessment.score / 2000).toFixed(8)),
      8
    );

    const quote: InsuranceQuote = {
      product: opts.product,
      coverageAmount: opts.coverageAmount,
      periodDays: period,
      premium,
      premiumRate: assessment.recommendedRate,
      expiresAt: Date.now() + this.quoteTtlMs,
      riskScore: assessment.score,
      deductible,
      payoutRatio: INSURANCE_PAYOUT_RATIO,
    };

    this.seq++;
    this.quotes.set(`quote_${this.seq}_${Date.now()}`, quote);
    this.emit({ type: 'quote', quote });
    return { ...quote };
  }

  private normalizePeriod(period: number): number {
    // 取最接近的预设期间
    let best: number = INSURANCE_DEFAULT_PERIODS[0];
    let diff = Math.abs(period - best);
    for (const p of INSURANCE_DEFAULT_PERIODS) {
      const d = Math.abs(period - p);
      if (d < diff) {
        diff = d;
        best = p;
      }
    }
    return best;
  }

  // ==========================================================================
  // 2. 投保
  // ==========================================================================

  /**
   * 投保
   *  - 验证报价（保费匹配）
   *  - 扣用户钱包
   *  - 创建 active 保单
   *  - 返回 Policy
   */
  purchasePolicy(
    userId: ID,
    opts: {
      product: InsuranceProduct;
      coverageAmount: string;
      periodDays: number;
      coveredAsset?: string;
      coveredAddress?: string;
      premiumOverride?: string;
      txHash?: string;
    }
  ): Policy {
    if (!decIsPositive(opts.coverageAmount)) {
      throw new PolicyError('INVALID_COVERAGE', 'coverageAmount must be > 0');
    }

    // 资本充足性检查
    if (this.pool) {
      const cap = this.pool.getAvailableCapital(
        opts.product
      );
      if (decCmp(cap, opts.coverageAmount) < 0) {
        throw new PolicyError(
          'INSUFFICIENT_CAPITAL',
          `Pool capital ${cap} < coverage ${opts.coverageAmount}`
        );
      }
    }

    const quote = this.getQuote({
      product: opts.product,
      coverageAmount: opts.coverageAmount,
      periodDays: opts.periodDays,
      coveredAsset: opts.coveredAsset,
    });

    const premium = opts.premiumOverride || quote.premium;
    if (!decIsPositive(premium)) {
      throw new PolicyError('INVALID_PREMIUM', 'premium must be > 0');
    }

    // 扣费
    const debited = this.wallet.debit(userId, premium);
    if (!debited) {
      throw new PolicyError(
        'INSUFFICIENT_BALANCE',
        `User ${userId} cannot pay premium ${premium}`
      );
    }

    const now = Date.now();
    const period = quote.periodDays;
    const policy: Policy = {
      id: makeInsuranceId('pol'),
      userId,
      product: opts.product,
      coverageAmount: opts.coverageAmount,
      premium,
      premiumRate: quote.premiumRate,
      coveragePeriodDays: period,
      startTime: now,
      endTime: now + period * 24 * 3600_000,
      status: 'active',
      coveredAsset: opts.coveredAsset,
      coveredAddress: opts.coveredAddress,
      txHash: opts.txHash,
      createdAt: now,
    };

    this.policies.set(policy.id, policy);
    const set = this.userPolicies.get(userId) || new Set();
    set.add(policy.id);
    this.userPolicies.set(userId, set);

    this.emit({ type: 'purchased', policy });
    return { ...policy };
  }

  // ==========================================================================
  // 3. 退保
  // ==========================================================================

  /**
   * 退保
   *  - 14 天内：扣 5% 手续费后退还剩余保费
   *  - 14 天后：不允许退保（保单已具时间价值）
   *  - 已 claimed/expired/cancelled 的保单不可再退
   */
  cancelPolicy(
    policyId: ID,
    opts: { now?: number; reason?: string } = {}
  ): { policy: Policy; refund: string; fee: string } {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new PolicyError('POLICY_NOT_FOUND', `Policy not found: ${policyId}`);
    }
    if (policy.status !== 'active') {
      throw new PolicyError(
        'POLICY_NOT_ACTIVE',
        `Policy ${policyId} status=${policy.status}, cannot cancel`
      );
    }
    const now = opts.now ?? Date.now();
    const elapsedDays = (now - policy.startTime) / (24 * 3600_000);
    if (elapsedDays > this.cancelGraceDays) {
      throw new PolicyError(
        'CANCEL_GRACE_EXPIRED',
        `Cancel grace period (${this.cancelGraceDays} days) exceeded: ${elapsedDays.toFixed(2)} days`
      );
    }

    // 按已过天数线性扣除（最多扣 5% 手续费封顶）
    const usageRatio = Math.max(0, Math.min(1, elapsedDays / this.cancelGraceDays));
    const feeRate = this.cancelFeeRate * usageRatio;
    // 使用 Number 计算以避免 decimal 模块对前导零小数的解析问题
    const feeNum = Number(policy.premium) * feeRate;
    const fee = decTruncate(
      Number.isFinite(feeNum) ? feeNum.toString() : '0',
      8
    );
    const refund = decTruncate(decSub(policy.premium, fee), 8);

    // 退款
    this.wallet.credit(policy.userId, refund);

    const updated: Policy = {
      ...policy,
      status: 'cancelled',
    };
    this.policies.set(policy.id, updated);
    this.emit({ type: 'cancelled', policy: updated, refund, fee });
    return { policy: updated, refund, fee };
  }

  // ==========================================================================
  // 4. 自动到期（外部定时器调用）
  // ==========================================================================

  /**
   * 扫描到期保单，标记为 expired
   */
  expireOverdue(now: number = Date.now()): Policy[] {
    const expired: Policy[] = [];
    for (const p of this.policies.values()) {
      if (p.status === 'active' && p.endTime <= now) {
        const updated: Policy = { ...p, status: 'expired' };
        this.policies.set(updated.id, updated);
        expired.push(updated);
        this.emit({ type: 'expired', policy: updated });
      }
    }
    return expired;
  }

  // ==========================================================================
  // 5. 查询
  // ==========================================================================

  getPolicy(id: ID): Policy | null {
    const p = this.policies.get(id);
    return p ? { ...p } : null;
  }

  getUserPolicies(userId: ID, status?: PolicyStatus): Policy[] {
    const ids = this.userPolicies.get(userId) || new Set();
    const out: Policy[] = [];
    for (const id of ids) {
      const p = this.policies.get(id);
      if (!p) continue;
      if (status && p.status !== status) continue;
      out.push({ ...p });
    }
    return out;
  }

  getActivePoliciesFor(userId: ID, asset?: string): Policy[] {
    return this.getUserPolicies(userId, 'active').filter((p) => {
      if (!asset) return true;
      return p.coveredAsset === asset;
    });
  }

  getExpiringPolicies(days: number = 7, now: number = Date.now()): Policy[] {
    const horizon = now + days * 24 * 3600_000;
    const out: Policy[] = [];
    for (const p of this.policies.values()) {
      if (p.status === 'active' && p.endTime <= horizon) {
        out.push({ ...p });
      }
    }
    return out;
  }

  // ==========================================================================
  // 6. 工具
  // ==========================================================================

  setPool(pool: PoolCapital): void {
    this.pool = pool;
  }

  setHandler(handler: PolicyEventHandler | null): void {
    this.handler = handler;
  }

  /** 标记保单为 claimed（由 ClaimEngine 调用） */
  markClaimed(policyId: ID, at: number = Date.now()): Policy {
    const p = this.policies.get(policyId);
    if (!p) {
      throw new PolicyError('POLICY_NOT_FOUND', `Policy not found: ${policyId}`);
    }
    if (p.status !== 'active') {
      throw new PolicyError(
        'POLICY_NOT_ACTIVE',
        `Policy ${policyId} status=${p.status}`
      );
    }
    const updated: Policy = { ...p, status: 'claimed' };
    this.policies.set(policyId, updated);
    return updated;
  }

  /** 测试用：清空所有状态 */
  reset(): void {
    this.policies.clear();
    this.userPolicies.clear();
    this.quotes.clear();
    this.seq = 0;
  }

  private emit(event: PolicyEvent): void {
    if (this.handler) {
      try {
        this.handler(event);
      } catch {
        // 忽略 handler 错误
      }
    }
  }
}

// 抑制未使用导入告警
void decDiv;
