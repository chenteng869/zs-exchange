/**
 * DeFi 保险池（Insurance Pool）核心类型定义
 *
 * 设计原则：
 *  - 所有金额/价格均以 string 表示，复用 src/lib/matching/decimal
 *  - 与 Nexus Mutual / InsurAce / Cover Protocol 的核心模型对齐
 *  - 业务侧通过 InsuranceEngine 整合 PolicyService / ClaimEngine / PoolService
 *
 * 业务流程：
 *  1. 承保人 stake → 池子获得流动性
 *  2. 投保人买保单 → 付保费（保费按份额分配给承保人）
 *  3. 出险时投保人提交 Claim → 调查 / 投票 / 决定
 *  4. 决定通过 → 从池子赔付（按 INSURANCE_PAYOUT_RATIO 比例）
 *  5. 承保人可领取保费 + 协议收益，或在锁仓后退出
 */

import type { ID } from '@/types/models';

// 重新导出 ID 便于上层使用
export type { ID } from '@/types/models';

// ============================================================================
// 产品 / 状态枚举
// ============================================================================

/** 保险产品 */
export type InsuranceProduct =
  | 'exchange_hack'
  | 'smart_contract'
  | 'stablecoin_depeg'
  | 'oracle_failure'
  | 'liquidation_penalty';

/** 保单状态 */
export type PolicyStatus = 'pending' | 'active' | 'expired' | 'cancelled' | 'claimed';

/** 理赔状态 */
export type ClaimStatus =
  | 'submitted'
  | 'investigating'
  | 'approved'
  | 'rejected'
  | 'paid';

/** 质押状态 */
export type StakeStatus = 'active' | 'withdrawing' | 'withdrawn';

// ============================================================================
// 保单 / 理赔 / 投票
// ============================================================================

/** 保单 */
export interface Policy {
  id: ID;
  userId: ID;
  product: InsuranceProduct;
  /** 保额（如 10000 USDT） */
  coverageAmount: string;
  /** 已付保费 */
  premium: string;
  /** 费率 0.005 = 0.5% */
  premiumRate: number;
  /** 30 / 90 / 180 / 365 */
  coveragePeriodDays: number;
  startTime: number;
  endTime: number;
  status: PolicyStatus;
  /** 被保资产（可选，如 USDT、BTC） */
  coveredAsset?: string;
  /** 被保地址（可选） */
  coveredAddress?: string;
  txHash?: string;
  createdAt: number;
}

/** 理赔 */
export interface Claim {
  id: ID;
  policyId: ID;
  userId: ID;
  /** 申请赔付金额 */
  amount: string;
  reason: string;
  evidence: ClaimEvidence[];
  status: ClaimStatus;
  submittedAt: number;
  investigatedAt?: number;
  decidedAt?: number;
  paidAt?: number;
  payoutAmount?: string;
  rejectionReason?: string;
  investigatorId?: string;
  voting?: ClaimVoting;
}

/** 证据 */
export interface ClaimEvidence {
  type: 'tx_hash' | 'screenshot' | 'document' | 'attestation';
  content: string;
  uploadedAt: number;
  url?: string;
}

/** 投票治理 */
export interface ClaimVoting {
  type: 'token_weighted' | 'one_person_one_vote' | 'expert_panel';
  startTime: number;
  endTime: number;
  voters: Voter[];
  approved: number;
  rejected: number;
  /** 通过阈值 0.66 = 2/3 */
  threshold: number;
  status: 'pending' | 'passed' | 'rejected' | 'expired';
}

/** 投票人 */
export interface Voter {
  address: string;
  vote: 'approve' | 'reject';
  weight: number;
  reason?: string;
  timestamp: number;
}

// ============================================================================
// 承保（Staking）
// ============================================================================

/** 承保仓位 */
export interface StakePosition {
  id: ID;
  userId: ID;
  poolId: string;
  amount: string;
  share: string;
  earnedPremium: string;
  earnedYield: string;
  lossReserve: string;
  totalReturn: string;
  apy: number;
  lockupDays: number;
  status: StakeStatus;
  stakedAt: number;
  withdrawRequestAt?: number;
  unlockTime?: number;
}

// ============================================================================
// 池子 / 报价 / 风险
// ============================================================================

/** 保险池 */
export interface InsurancePool {
  id: string;
  product: InsuranceProduct;
  totalStaked: string;
  totalCoverage: string;
  totalClaims: string;
  /** 利用率 = coverage / staked */
  utilizationRate: string;
  premiumRate: number;
  claimRatio: string;
  participants: number;
  policies: number;
  updatedAt: number;
}

/** 报价 */
export interface InsuranceQuote {
  product: InsuranceProduct;
  coverageAmount: string;
  periodDays: number;
  premium: string;
  premiumRate: number;
  expiresAt: number;
  /** 0-100 */
  riskScore: number;
  deductible: string;
  /** 0.9 = 90% 赔付 */
  payoutRatio: number;
}

/** 风险评估 */
export interface RiskAssessment {
  product: InsuranceProduct;
  targetAsset: string;
  /** 0-100 (100=最危险) */
  score: number;
  factors: {
    smartContractRisk: number;
    liquidityRisk: number;
    historicalIncidents: number;
    auditScore: number;
    centralizationRisk: number;
  };
  recommendedRate: number;
  reason: string;
}

// ============================================================================
// 关键常量
// ============================================================================

/** 默认可选保险期间（天） */
export const INSURANCE_DEFAULT_PERIODS = [30, 90, 180, 365] as const;

/** 14 天无理由退保宽限期 */
export const INSURANCE_CANCEL_GRACE_DAYS = 14;

/** 退保手续费率（5%） */
export const INSURANCE_CANCEL_FEE_RATE = 0.05;

/** 5 类产品基础年化保费率（APR 表示） */
export const INSURANCE_BASE_RATES: Record<InsuranceProduct, number> = {
  exchange_hack: 0.008, // 0.8%
  smart_contract: 0.012, // 1.2%
  stablecoin_depeg: 0.005, // 0.5%
  oracle_failure: 0.003, // 0.3%
  liquidation_penalty: 0.006, // 0.6%
};

/** 投票持续 7 天 */
export const INSURANCE_CLAIM_VOTING_DURATION_MS = 7 * 24 * 3600_000;

/** 通过阈值（2/3） */
export const INSURANCE_VOTING_THRESHOLD = 0.66;

/** 默认赔付比例 90% */
export const INSURANCE_PAYOUT_RATIO = 0.9;

/** 早退惩罚 5% */
export const INSURANCE_EARLY_WITHDRAW_PENALTY = 0.05;

/** 退出锁定期 7 天 */
export const INSURANCE_WITHDRAW_LOCKUP_DAYS = 7;

/** 池子目标利用率 80% */
export const INSURANCE_POOL_UTILIZATION_TARGET = 0.8;

/** 报价有效期 60s */
export const INSURANCE_QUOTE_TTL_MS = 60_000;

/** 全局池 ID */
export const INSURANCE_GLOBAL_POOL_ID = 'global';

// ============================================================================
// 辅助函数
// ============================================================================

/** 生成演示用 ID（带前缀） */
export function makeInsuranceId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 产品显示名 */
export const INSURANCE_PRODUCT_LABEL: Record<InsuranceProduct, string> = {
  exchange_hack: '交易所被盗',
  smart_contract: '智能合约漏洞',
  stablecoin_depeg: '稳定币脱锚',
  oracle_failure: '预言机故障',
  liquidation_penalty: '强平罚金',
};

/** 根据天数获取年化费率（保费率是年化的，按期间折算） */
export function annualToPeriodRate(annualRate: number, periodDays: number): number {
  return annualRate * (periodDays / 365);
}
