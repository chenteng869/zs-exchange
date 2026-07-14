/**
 * Release Claim Service - 状态机 + 枚举
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.4 + §2.6
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md §3.11
 *
 * Release = 生态释放（每月/季度/特别）→ 用户按"有效算力"分账 → Merkle Claim
 *  - 链下：FjnReleasePool / FjnReleaseCalculation / FjnReleaseClaim / FjnUserReleaseQuota
 *  - 链上：Solana Anchor Claim Program（Merkle Proof）
 */

export const RELEASE_POOL_TYPE = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  SPECIAL: 'special',
} as const;
export type FjnReleasePoolType = (typeof RELEASE_POOL_TYPE)[keyof typeof RELEASE_POOL_TYPE];

export const RELEASE_POOL_STATUS = {
  CREATED: 'created',
  APPROVED: 'approved',
  SNAPSHOT_READY: 'snapshot_ready',
  CALCULATED: 'calculated',
  RISK_CHECKING: 'risk_checking',
  CLAIM_OPEN: 'claim_open',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;
export type FjnReleasePoolStatus = (typeof RELEASE_POOL_STATUS)[keyof typeof RELEASE_POOL_STATUS];

export const RELEASE_CALCULATION_STATUS = {
  CALCULATED: 'calculated',
  RISK_CHECKING: 'risk_checking',
  APPROVED: 'approved',
  CLAIMABLE: 'claimable',
  CLAIMED: 'claimed',
  CANCELLED: 'cancelled',
} as const;
export type FjnReleaseCalculationStatus =
  (typeof RELEASE_CALCULATION_STATUS)[keyof typeof RELEASE_CALCULATION_STATUS];

export const RELEASE_CLAIM_STATUS = {
  PENDING: 'pending',
  CLAIMABLE: 'claimable',
  PROCESSING: 'processing',
  CLAIMED: 'claimed',
  FAILED: 'failed',
  EXPIRED: 'expired',
  RISK_HOLD: 'risk_hold',
} as const;
export type FjnReleaseClaimStatus = (typeof RELEASE_CLAIM_STATUS)[keyof typeof RELEASE_CLAIM_STATUS];

export const RELEASE_RISK_STATUS = {
  NORMAL: 'normal',
  WARNING: 'warning',
  HOLD: 'hold',
  BLOCKED: 'blocked',
} as const;
export type FjnReleaseRiskStatus = (typeof RELEASE_RISK_STATUS)[keyof typeof RELEASE_RISK_STATUS];

export const RELEASE_PAYMENT_TYPE = {
  TFJ369: 'tfj369',
  FJ369_TOKEN: 'fj369_token',
  CFJ369: 'cfj369',
} as const;
export type FjnReleasePaymentType = (typeof RELEASE_PAYMENT_TYPE)[keyof typeof RELEASE_PAYMENT_TYPE];

/** Claim 过期默认天数（claim_open + 30 天） */
export const RELEASE_CLAIM_DEFAULT_EXPIRES_DAYS = 30;

/** Risk check 时默认 hold 比例 */
export const RELEASE_RISK_DEFAULT_HOLD_RATE = '0.0000';

/** 默认货币 */
export const RELEASE_DEFAULT_CURRENCY = 'FJ369';

/** 默认链 */
export const RELEASE_DEFAULT_CHAIN_ID = 'devnet';

/** 校验器 */
export const isValidReleasePoolType = (v: string): v is FjnReleasePoolType =>
  Object.values(RELEASE_POOL_TYPE).includes(v as any);
export const isValidReleasePoolStatus = (v: string): v is FjnReleasePoolStatus =>
  Object.values(RELEASE_POOL_STATUS).includes(v as any);
export const isValidReleaseCalculationStatus = (v: string): v is FjnReleaseCalculationStatus =>
  Object.values(RELEASE_CALCULATION_STATUS).includes(v as any);
export const isValidReleaseClaimStatus = (v: string): v is FjnReleaseClaimStatus =>
  Object.values(RELEASE_CLAIM_STATUS).includes(v as any);
export const isValidReleaseRiskStatus = (v: string): v is FjnReleaseRiskStatus =>
  Object.values(RELEASE_RISK_STATUS).includes(v as any);
export const isValidReleasePaymentType = (v: string): v is FjnReleasePaymentType =>
  Object.values(RELEASE_PAYMENT_TYPE).includes(v as any);

/** 状态机：Pool 合法转移 */
export const RELEASE_POOL_STATUS_TRANSITIONS: Record<FjnReleasePoolStatus, FjnReleasePoolStatus[]> = {
  [RELEASE_POOL_STATUS.CREATED]: [
    RELEASE_POOL_STATUS.APPROVED,
    RELEASE_POOL_STATUS.CANCELLED,
  ],
  [RELEASE_POOL_STATUS.APPROVED]: [
    RELEASE_POOL_STATUS.SNAPSHOT_READY,
    RELEASE_POOL_STATUS.CANCELLED,
  ],
  [RELEASE_POOL_STATUS.SNAPSHOT_READY]: [
    RELEASE_POOL_STATUS.CALCULATED,
    RELEASE_POOL_STATUS.CANCELLED,
  ],
  [RELEASE_POOL_STATUS.CALCULATED]: [
    RELEASE_POOL_STATUS.RISK_CHECKING,
    RELEASE_POOL_STATUS.CANCELLED,
  ],
  [RELEASE_POOL_STATUS.RISK_CHECKING]: [
    RELEASE_POOL_STATUS.CLAIM_OPEN,
    RELEASE_POOL_STATUS.CANCELLED,
  ],
  [RELEASE_POOL_STATUS.CLAIM_OPEN]: [
    RELEASE_POOL_STATUS.CLOSED,
  ],
  [RELEASE_POOL_STATUS.CLOSED]: [],
  [RELEASE_POOL_STATUS.CANCELLED]: [],
};

export const canTransitReleasePoolStatus = (
  from: FjnReleasePoolStatus,
  to: FjnReleasePoolStatus,
): boolean => (RELEASE_POOL_STATUS_TRANSITIONS[from] ?? []).includes(to);
