/**
 * FJN KYC Service - 事件定义
 *
 * 严格遵循 H018 §3 规范：
 *  - KYC / KYB 全部事件常量
 *  - 事件 source 枚举
 *  - 完整 Payload 接口（用于 outbox/事件总线）
 *
 * 用法：
 *   import { KYC_EVENTS, KYC_EVENT_SOURCES } from './kyc-events';
 *   await emitOutboxEvent(tx, KYC_EVENTS.KYC_SUBMITTED, payload);
 */

import type { FjnKycStatus, FjnKycLevel, FjnKycDocumentType, FjnKycProvider } from './kyc-state-machine';

// ============================================================
// 1. KYC / KYB 事件常量
// ============================================================

export const KYC_EVENTS = {
  // KYC 事件
  KYC_SUBMITTED: 'kyc.submitted.v1',
  KYC_APPROVED: 'kyc.approved.v1',
  KYC_REJECTED: 'kyc.rejected.v1',
  KYC_EXPIRED: 'kyc.expired.v1',
  KYC_MANUAL_REVIEW: 'kyc.manual_review.v1',
  KYC_RESUBMITTED: 'kyc.resubmitted.v1',

  // KYB 事件
  KYB_SUBMITTED: 'kyb.submitted.v1',
  KYB_APPROVED: 'kyb.approved.v1',
  KYB_REJECTED: 'kyb.rejected.v1',
  KYB_EXPIRED: 'kyb.expired.v1',
  KYB_MANUAL_REVIEW: 'kyb.manual_review.v1',
  KYB_RESUBMITTED: 'kyb.resubmitted.v1',
} as const;

export type FjnKycEventName = (typeof KYC_EVENTS)[keyof typeof KYC_EVENTS];

export const ALL_KYC_EVENTS: readonly FjnKycEventName[] = Object.values(KYC_EVENTS);

// ============================================================
// 2. 事件来源
// ============================================================

export const KYC_EVENT_SOURCES = {
  USER: 'user',
  ADMIN: 'admin',
  SYSTEM: 'system',
  THIRD_PARTY: 'third_party', // onfido / sumsub / jumio
  RISK_SERVICE: 'risk_service',
  SCHEDULER: 'scheduler',
} as const;

export type FjnKycEventSource =
  (typeof KYC_EVENT_SOURCES)[keyof typeof KYC_EVENT_SOURCES];

export const ALL_KYC_EVENT_SOURCES: readonly FjnKycEventSource[] =
  Object.values(KYC_EVENT_SOURCES);

// ============================================================
// 3. KYC Payload 接口
// ============================================================

/** KYC Submitted Payload */
export interface KycSubmittedPayload {
  occurred_at: string;
  source: FjnKycEventSource;
  kyc_id: string;
  user_id: string;
  kyc_level: FjnKycLevel;
  document_type: FjnKycDocumentType;
  document_country: string;
  provider?: FjnKycProvider;
  submitted_at: string;
}

/** KYC Approved Payload */
export interface KycApprovedPayload {
  occurred_at: string;
  source: FjnKycEventSource;
  kyc_id: string;
  user_id: string;
  reviewer_id?: string;
  approved_at: string;
  expires_at?: string;
  review_note?: string;
}

/** KYC Rejected Payload */
export interface KycRejectedPayload {
  occurred_at: string;
  source: FjnKycEventSource;
  kyc_id: string;
  user_id: string;
  reviewer_id?: string;
  rejected_at: string;
  review_note: string;
}

/** KYC Expired Payload */
export interface KycExpiredPayload {
  occurred_at: string;
  source: FjnKycEventSource;
  kyc_id: string;
  user_id: string;
  expired_at: string;
}

/** KYC Manual Review Payload */
export interface KycManualReviewPayload {
  occurred_at: string;
  source: FjnKycEventSource;
  kyc_id: string;
  user_id: string;
  reviewer_id?: string;
  review_note?: string;
}

/** KYC Resubmitted Payload */
export interface KycResubmittedPayload {
  occurred_at: string;
  source: FjnKycEventSource;
  kyc_id: string;
  user_id: string;
  previous_status: FjnKycStatus;
  submitted_at: string;
}

// ============================================================
// 4. KYB Payload 接口
// ============================================================

export interface KycCompanySubmittedPayload {
  occurred_at: string;
  source: FjnKycEventSource;
  kyb_id: string;
  user_id: string;
  company_name: string;
  registration_country: string;
  provider?: FjnKycProvider;
  submitted_at: string;
}

export interface KycCompanyApprovedPayload {
  occurred_at: string;
  source: FjnKycEventSource;
  kyb_id: string;
  user_id: string;
  reviewer_id?: string;
  approved_at: string;
  expires_at?: string;
  review_note?: string;
}

export interface KycCompanyRejectedPayload {
  occurred_at: string;
  source: FjnKycEventSource;
  kyb_id: string;
  user_id: string;
  reviewer_id?: string;
  rejected_at: string;
  review_note: string;
}

export interface KycCompanyExpiredPayload {
  occurred_at: string;
  source: FjnKycEventSource;
  kyb_id: string;
  user_id: string;
  expired_at: string;
}

export interface KycCompanyManualReviewPayload {
  occurred_at: string;
  source: FjnKycEventSource;
  kyb_id: string;
  user_id: string;
  reviewer_id?: string;
  review_note?: string;
}

export interface KycCompanyResubmittedPayload {
  occurred_at: string;
  source: FjnKycEventSource;
  kyb_id: string;
  user_id: string;
  previous_status: FjnKycStatus;
  submitted_at: string;
}

// ============================================================
// 5. 工具：按事件名推断 payload 类型
// ============================================================

export type FjnKycEventPayloadMap = {
  [KYC_EVENTS.KYC_SUBMITTED]: KycSubmittedPayload;
  [KYC_EVENTS.KYC_APPROVED]: KycApprovedPayload;
  [KYC_EVENTS.KYC_REJECTED]: KycRejectedPayload;
  [KYC_EVENTS.KYC_EXPIRED]: KycExpiredPayload;
  [KYC_EVENTS.KYC_MANUAL_REVIEW]: KycManualReviewPayload;
  [KYC_EVENTS.KYC_RESUBMITTED]: KycResubmittedPayload;
  [KYC_EVENTS.KYB_SUBMITTED]: KycCompanySubmittedPayload;
  [KYC_EVENTS.KYB_APPROVED]: KycCompanyApprovedPayload;
  [KYC_EVENTS.KYB_REJECTED]: KycCompanyRejectedPayload;
  [KYC_EVENTS.KYB_EXPIRED]: KycCompanyExpiredPayload;
  [KYC_EVENTS.KYB_MANUAL_REVIEW]: KycCompanyManualReviewPayload;
  [KYC_EVENTS.KYB_RESUBMITTED]: KycCompanyResubmittedPayload;
};
