/**
 * Release Claim Service - 事件定义
 *
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §8.3
 */

export const RELEASE_EVENTS = {
  POOL_CREATED: 'release.pool.created',
  POOL_APPROVED: 'release.pool.approved',
  POOL_SNAPSHOT_READY: 'release.pool.snapshot_ready',
  POOL_CALCULATED: 'release.pool.calculated',
  POOL_RISK_CHECKING: 'release.pool.risk_checking',
  POOL_CLAIM_OPEN: 'release.pool.claim_open',
  POOL_CLOSED: 'release.pool.closed',
  POOL_CANCELLED: 'release.pool.cancelled',
  CALCULATION_CREATED: 'release.calculation.created',
  CALCULATION_APPROVED: 'release.calculation.approved',
  CALCULATION_RISK_HOLD: 'release.calculation.risk_hold',
  CALCULATION_CLAIMABLE: 'release.calculation.claimable',
  CALCULATION_CLAIMED: 'release.calculation.claimed',
  CLAIM_CREATED: 'release.claim.created',
  CLAIM_PROCESSING: 'release.claim.processing',
  CLAIM_SUCCEEDED: 'release.claim.succeeded',
  CLAIM_FAILED: 'release.claim.failed',
  CLAIM_EXPIRED: 'release.claim.expired',
  CLAIM_RISK_HOLD: 'release.claim.risk_hold',
  QUOTA_DEDUCTED: 'release.quota.deducted',
  QUOTA_RESTORED: 'release.quota.restored',
} as const;

export const RELEASE_EVENT_SOURCES = {
  RELEASE_SERVICE: 'release_service',
  ADMIN: 'admin',
  RISK_ENGINE: 'risk_engine',
  CRON_JOB: 'cron_job',
  MERKLE_WORKER: 'merkle_worker',
  SOLANA_CLAIM_WORKER: 'solana_claim_worker',
} as const;

export type FjnReleaseEvent = (typeof RELEASE_EVENTS)[keyof typeof RELEASE_EVENTS];
export type FjnReleaseEventSource = (typeof RELEASE_EVENT_SOURCES)[keyof typeof RELEASE_EVENT_SOURCES];

export interface ReleasePoolCreatedPayload {
  poolNo: string;
  poolName: string;
  period: string;
  poolType: string;
  totalAmount: string;
  currency: string;
}

export interface ReleasePoolClaimOpenPayload {
  poolNo: string;
  merkleRoot: string;
  totalAmount: string;
  networkPower: string;
  networkUsers: number;
}

export interface ReleaseClaimSucceededPayload {
  claimNo: string;
  poolNo: string;
  userId: string;
  claimedAmount: string;
  txHash: string;
}

export type FjnReleaseEventPayload =
  | ReleasePoolCreatedPayload
  | ReleasePoolClaimOpenPayload
  | ReleaseClaimSucceededPayload
  | Record<string, unknown>;
