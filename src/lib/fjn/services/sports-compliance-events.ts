/**
 * Sports Compliance Service - 事件定义
 *
 * 工业级 Solana-first 架构
 */

export const SPORTS_COMPLIANCE_EVENTS = {
  CHECK_CREATED: 'sports.compliance.check.created',
  CHECK_PASSED: 'sports.compliance.check.passed',
  CHECK_FAILED: 'sports.compliance.check.failed',
  CHECK_REVIEW: 'sports.compliance.check.review',
  CHECK_REVIEWED: 'sports.compliance.check.reviewed',
  CHECK_OVERRIDDEN: 'sports.compliance.check.overridden',
  REGION_BLOCKED: 'sports.compliance.region.blocked',
  SANCTIONS_HIT: 'sports.compliance.sanctions.hit',
  PEP_HIT: 'sports.compliance.pep.hit',
  LIMIT_EXCEEDED: 'sports.compliance.limit.exceeded',
  AGE_REJECTED: 'sports.compliance.age.rejected',
  KYC_INSUFFICIENT: 'sports.compliance.kyc.insufficient',
  RISK_BLOCKED: 'sports.compliance.risk.blocked',
  AUDIT_LOG_WRITTEN: 'sports.compliance.audit.log_written',
} as const;

export const SPORTS_COMPLIANCE_EVENT_SOURCES = {
  SPORTS_COMPLIANCE_SERVICE: 'sports_compliance_service',
  SPORTS_ENGINE: 'sports_engine',
  REGION_SERVICE: 'region_service',
  KYC_SERVICE: 'kyc_service',
  RISK_SERVICE: 'risk_service',
  ADMIN: 'admin',
  COMPLIANCE_REVIEWER: 'compliance_reviewer',
} as const;

export type FjnSportsComplianceEvent =
  (typeof SPORTS_COMPLIANCE_EVENTS)[keyof typeof SPORTS_COMPLIANCE_EVENTS];

export type FjnSportsComplianceEventSource =
  (typeof SPORTS_COMPLIANCE_EVENT_SOURCES)[keyof typeof SPORTS_COMPLIANCE_EVENT_SOURCES];

export interface SportsComplianceCheckCreatedPayload {
  checkId: string;
  userId: string;
  eventId: string;
  marketId?: string;
  entryId?: string;
  checkType: string;
  result: string;
  regionCode?: string;
}

export interface SportsComplianceCheckReviewedPayload {
  checkId: string;
  userId: string;
  eventId: string;
  checkType: string;
  previousResult: string;
  newResult: string;
  reviewerId: string;
  comment?: string;
}

export interface SportsComplianceRegionBlockedPayload {
  checkId: string;
  userId: string;
  regionCode: string;
  licenseStatus: string;
}

export interface SportsComplianceSanctionsHitPayload {
  checkId: string;
  userId: string;
  sanctionsList: string;
  regionCode?: string;
}

export type FjnSportsComplianceEventPayload =
  | SportsComplianceCheckCreatedPayload
  | SportsComplianceCheckReviewedPayload
  | SportsComplianceRegionBlockedPayload
  | SportsComplianceSanctionsHitPayload
  | Record<string, unknown>;
