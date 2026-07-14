/**
 * FJN Device Service - 事件定义
 *
 * 严格遵循工业级规范（参考 H015 + H018）：
 *  - UserDevice / Trust / Blacklist / Risk / Challenge 全部事件常量
 *  - 事件 source 枚举
 *  - 完整 Payload 接口（用于 outbox/事件总线）
 *
 * 用法：
 *   import { DEVICE_EVENTS, DEVICE_EVENT_SOURCES } from './device-events';
 *   await emitOutboxEvent(tx, DEVICE_EVENTS.DEVICE_BOUND, payload);
 */

import type {
  FjnUserDeviceStatus,
  FjnBlacklistStatus,
  FjnRiskAssessmentStatus,
  FjnChallengeStatus,
  FjnChallengeType,
  FjnChallengeTrigger,
  FjnDeviceRiskLevel,
  FjnDeviceType,
  FjnTrustAction,
  FjnBlacklistReason,
  FjnBlacklistSource,
  FjnRiskFactor,
} from './device-state-machine';

// ============================================================
// 1. Device 事件常量（11 个）
// ============================================================

export const DEVICE_EVENTS = {
  // UserDevice 事件（5 个）
  DEVICE_BOUND: 'device.user_device.bound.v1',
  DEVICE_TRUSTED: 'device.user_device.trusted.v1',
  DEVICE_BLOCKED: 'device.user_device.blocked.v1',
  DEVICE_REVOKED: 'device.user_device.revoked.v1',
  DEVICE_HEARTBEAT: 'device.user_device.heartbeat.v1',

  // Blacklist 事件（2 个）
  DEVICE_BLACKLISTED: 'device.blacklist.added.v1',
  DEVICE_UNBLACKLISTED: 'device.blacklist.removed.v1',

  // RiskAssessment 事件（1 个）
  DEVICE_RISK_SCORED: 'device.risk.scored.v1',

  // Challenge 事件（3 个）
  CHALLENGE_ISSUED: 'device.challenge.issued.v1',
  CHALLENGE_VERIFIED: 'device.challenge.verified.v1',
  CHALLENGE_FAILED: 'device.challenge.failed.v1',
} as const;

export type FjnDeviceEventName =
  (typeof DEVICE_EVENTS)[keyof typeof DEVICE_EVENTS];

export const ALL_DEVICE_EVENTS: readonly FjnDeviceEventName[] =
  Object.values(DEVICE_EVENTS);

// ============================================================
// 2. 事件来源
// ============================================================

export const DEVICE_EVENT_SOURCES = {
  USER: 'user',
  ADMIN: 'admin',
  SYSTEM: 'system',
  SCHEDULER: 'scheduler',
  RISK_ENGINE: 'risk_engine',
  KYC_SERVICE: 'kyc_service',
  REGION_SERVICE: 'region_service',
} as const;

export type FjnDeviceEventSource =
  (typeof DEVICE_EVENT_SOURCES)[keyof typeof DEVICE_EVENT_SOURCES];

export const ALL_DEVICE_EVENT_SOURCES: readonly FjnDeviceEventSource[] =
  Object.values(DEVICE_EVENT_SOURCES);

// ============================================================
// 3. UserDevice Payload
// ============================================================

/** Device Bound Payload（新设备绑定） */
export interface DeviceBoundPayload {
  occurred_at: string;
  source: FjnDeviceEventSource;
  user_device_id: string;
  user_id: string;
  fingerprint_id: string;
  fingerprint: string;
  device_type?: FjnDeviceType;
  device_name?: string;
  ip_address?: string;
  country_code?: string;
  initial_status: FjnUserDeviceStatus;
  requires_challenge: boolean;
  operator_id?: string;
}

/** Device Trusted Payload */
export interface DeviceTrustedPayload {
  occurred_at: string;
  source: FjnDeviceEventSource;
  user_device_id: string;
  user_id: string;
  fingerprint_id: string;
  trust_action: FjnTrustAction;
  risk_score?: number;
  operator_id?: string;
}

/** Device Blocked Payload */
export interface DeviceBlockedPayload {
  occurred_at: string;
  source: FjnDeviceEventSource;
  user_device_id: string;
  user_id: string;
  fingerprint_id: string;
  reason: string;
  expires_at?: string;
  operator_id?: string;
}

/** Device Revoked Payload */
export interface DeviceRevokedPayload {
  occurred_at: string;
  source: FjnDeviceEventSource;
  user_device_id: string;
  user_id: string;
  fingerprint_id: string;
  reason?: string;
  operator_id?: string;
}

/** Device Heartbeat Payload（设备活跃上报） */
export interface DeviceHeartbeatPayload {
  occurred_at: string;
  source: FjnDeviceEventSource;
  user_device_id: string;
  user_id: string;
  fingerprint_id: string;
  ip_address?: string;
  country_code?: string;
  session_id?: string;
}

// ============================================================
// 4. Blacklist Payload
// ============================================================

/** Device Blacklisted Payload */
export interface DeviceBlacklistedPayload {
  occurred_at: string;
  source: FjnDeviceEventSource;
  blacklist_id: string;
  fingerprint: string;
  reason: FjnBlacklistReason;
  blacklist_source: FjnBlacklistSource;
  ref_no?: string;
  expires_at?: string;
  operator_id?: string;
}

/** Device Unblacklisted Payload */
export interface DeviceUnblacklistedPayload {
  occurred_at: string;
  source: FjnDeviceEventSource;
  blacklist_id: string;
  fingerprint: string;
  reason?: string;
  operator_id?: string;
}

// ============================================================
// 5. RiskAssessment Payload
// ============================================================

/** Device Risk Scored Payload */
export interface DeviceRiskScoredPayload {
  occurred_at: string;
  source: FjnDeviceEventSource;
  risk_id: string;
  user_device_id?: string;
  user_id?: string;
  fingerprint: string;
  risk_score: number;
  risk_level: FjnDeviceRiskLevel;
  factors: FjnRiskFactor[];
  action: 'none' | 'challenge' | 'block' | 'trust';
  operator_id?: string;
}

// ============================================================
// 6. Challenge Payload
// ============================================================

/** Challenge Issued Payload */
export interface ChallengeIssuedPayload {
  occurred_at: string;
  source: FjnDeviceEventSource;
  challenge_id: string;
  user_id: string;
  user_device_id: string;
  challenge_type: FjnChallengeType;
  trigger: FjnChallengeTrigger;
  target: string; // 邮箱/手机号（脱敏）
  expires_at: string;
  max_attempts: number;
}

/** Challenge Verified Payload */
export interface ChallengeVerifiedPayload {
  occurred_at: string;
  source: FjnDeviceEventSource;
  challenge_id: string;
  user_id: string;
  user_device_id: string;
  challenge_type: FjnChallengeType;
  attempts: number;
  ip_address?: string;
}

/** Challenge Failed Payload */
export interface ChallengeFailedPayload {
  occurred_at: string;
  source: FjnDeviceEventSource;
  challenge_id: string;
  user_id: string;
  user_device_id: string;
  challenge_type: FjnChallengeType;
  attempts: number;
  reason: string;
}

// ============================================================
// 7. 工具：按事件名推断 payload 类型
// ============================================================

export type FjnDeviceEventPayloadMap = {
  [DEVICE_EVENTS.DEVICE_BOUND]: DeviceBoundPayload;
  [DEVICE_EVENTS.DEVICE_TRUSTED]: DeviceTrustedPayload;
  [DEVICE_EVENTS.DEVICE_BLOCKED]: DeviceBlockedPayload;
  [DEVICE_EVENTS.DEVICE_REVOKED]: DeviceRevokedPayload;
  [DEVICE_EVENTS.DEVICE_HEARTBEAT]: DeviceHeartbeatPayload;
  [DEVICE_EVENTS.DEVICE_BLACKLISTED]: DeviceBlacklistedPayload;
  [DEVICE_EVENTS.DEVICE_UNBLACKLISTED]: DeviceUnblacklistedPayload;
  [DEVICE_EVENTS.DEVICE_RISK_SCORED]: DeviceRiskScoredPayload;
  [DEVICE_EVENTS.CHALLENGE_ISSUED]: ChallengeIssuedPayload;
  [DEVICE_EVENTS.CHALLENGE_VERIFIED]: ChallengeVerifiedPayload;
  [DEVICE_EVENTS.CHALLENGE_FAILED]: ChallengeFailedPayload;
};

/** 推断 outbox 事件对应 payload 类型 */
export type FjnDeviceEventPayload<E extends FjnDeviceEventName> =
  FjnDeviceEventPayloadMap[E];
