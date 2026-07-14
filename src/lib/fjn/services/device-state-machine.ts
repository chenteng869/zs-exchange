/**
 * FJN Device Service - 状态机
 *
 * 严格遵循工业级分层（参考 H015 + H018）：
 *  - UserDevice 状态机：pending | active | trusted | blocked | revoked
 *  - TrustLog 状态机：trusted | untrusted | revoked（仅历史）
 *  - Blacklist 状态机：active | disabled | expired
 *  - RiskAssessment 状态机：scored | dismissed | actioned
 *  - Challenge 状态机：pending | verified | failed | expired | cancelled
 *
 * 业务背景：
 *  - 一个用户可绑定多个设备（1:N）
 *  - 每个设备有独立信任状态 + 风险评分
 *  - 黑名单：禁止登录/注册的设备指纹
 *  - 新设备登录需通过 challenge（OTP / 邮箱 / 人脸）
 *  - 风险评分结合 KYC 等级 + 风控引擎 + 行为画像
 *
 * 用法：
 *   import { USER_DEVICE_STATUS, canTransitUserDeviceStatus } from './device-state-machine';
 */

import { FjnStateMachineError } from '../errors';

// ============================================================
// 1. UserDevice 状态机
// ============================================================

/** UserDevice 状态（用户 ↔ 设备绑定） */
export const USER_DEVICE_STATUS = {
  PENDING: 'pending',       // 待验证（新设备，等待 challenge）
  ACTIVE: 'active',         // 已激活（通过基础验证，未达 trusted 级别）
  TRUSTED: 'trusted',       // 已信任（常驻设备）
  BLOCKED: 'blocked',       // 临时锁定（风控/安全事件）
  REVOKED: 'revoked',       // 已吊销（用户主动 / 管理员）
} as const;

export type FjnUserDeviceStatus =
  (typeof USER_DEVICE_STATUS)[keyof typeof USER_DEVICE_STATUS];

export const ALL_USER_DEVICE_STATUSES: readonly FjnUserDeviceStatus[] =
  Object.values(USER_DEVICE_STATUS);

/** 终态：REVOKED 不可恢复 */
export const TERMINAL_USER_DEVICE_STATUSES: readonly FjnUserDeviceStatus[] = [
  USER_DEVICE_STATUS.REVOKED,
] as const;

/** UserDevice 状态流转表 */
export const USER_DEVICE_STATUS_TRANSITIONS: Record<FjnUserDeviceStatus, readonly FjnUserDeviceStatus[]> = {
  [USER_DEVICE_STATUS.PENDING]: [
    USER_DEVICE_STATUS.ACTIVE,
    USER_DEVICE_STATUS.BLOCKED,
    USER_DEVICE_STATUS.REVOKED,
  ],
  [USER_DEVICE_STATUS.ACTIVE]: [
    USER_DEVICE_STATUS.TRUSTED,
    USER_DEVICE_STATUS.BLOCKED,
    USER_DEVICE_STATUS.REVOKED,
  ],
  [USER_DEVICE_STATUS.TRUSTED]: [
    USER_DEVICE_STATUS.ACTIVE,
    USER_DEVICE_STATUS.BLOCKED,
    USER_DEVICE_STATUS.REVOKED,
  ],
  [USER_DEVICE_STATUS.BLOCKED]: [
    USER_DEVICE_STATUS.ACTIVE,
    USER_DEVICE_STATUS.REVOKED,
  ],
  [USER_DEVICE_STATUS.REVOKED]: [],
} as const;

// ============================================================
// 2. Blacklist 状态机
// ============================================================

/** Blacklist 状态（设备黑名单） */
export const BLACKLIST_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
  EXPIRED: 'expired',
} as const;

export type FjnBlacklistStatus =
  (typeof BLACKLIST_STATUS)[keyof typeof BLACKLIST_STATUS];

export const ALL_BLACKLIST_STATUSES: readonly FjnBlacklistStatus[] =
  Object.values(BLACKLIST_STATUS);

export const BLACKLIST_STATUS_TRANSITIONS: Record<FjnBlacklistStatus, readonly FjnBlacklistStatus[]> = {
  [BLACKLIST_STATUS.ACTIVE]: [BLACKLIST_STATUS.DISABLED, BLACKLIST_STATUS.EXPIRED],
  [BLACKLIST_STATUS.DISABLED]: [BLACKLIST_STATUS.ACTIVE, BLACKLIST_STATUS.EXPIRED],
  [BLACKLIST_STATUS.EXPIRED]: [BLACKLIST_STATUS.ACTIVE],
} as const;

// ============================================================
// 3. RiskAssessment 状态机
// ============================================================

/** RiskAssessment 状态（设备风险评估） */
export const RISK_ASSESSMENT_STATUS = {
  SCORED: 'scored',         // 已评分
  DISMISSED: 'dismissed',   // 已忽略（误报）
  ACTIONED: 'actioned',     // 已处置（触发风控措施）
} as const;

export type FjnRiskAssessmentStatus =
  (typeof RISK_ASSESSMENT_STATUS)[keyof typeof RISK_ASSESSMENT_STATUS];

export const ALL_RISK_ASSESSMENT_STATUSES: readonly FjnRiskAssessmentStatus[] =
  Object.values(RISK_ASSESSMENT_STATUS);

export const RISK_ASSESSMENT_STATUS_TRANSITIONS: Record<FjnRiskAssessmentStatus, readonly FjnRiskAssessmentStatus[]> = {
  [RISK_ASSESSMENT_STATUS.SCORED]: [
    RISK_ASSESSMENT_STATUS.DISMISSED,
    RISK_ASSESSMENT_STATUS.ACTIONED,
  ],
  [RISK_ASSESSMENT_STATUS.DISMISSED]: [RISK_ASSESSMENT_STATUS.ACTIONED],
  [RISK_ASSESSMENT_STATUS.ACTIONED]: [],
} as const;

// ============================================================
// 4. Challenge 状态机（新设备验证）
// ============================================================

/** Challenge 状态（设备挑战） */
export const CHALLENGE_STATUS = {
  PENDING: 'pending',       // 待验证
  VERIFIED: 'verified',     // 已通过
  FAILED: 'failed',         // 已失败（达到最大尝试次数或验证码错误）
  EXPIRED: 'expired',       // 已过期（超时）
  CANCELLED: 'cancelled',   // 已取消（用户主动）
} as const;

export type FjnChallengeStatus =
  (typeof CHALLENGE_STATUS)[keyof typeof CHALLENGE_STATUS];

export const ALL_CHALLENGE_STATUSES: readonly FjnChallengeStatus[] =
  Object.values(CHALLENGE_STATUS);

/** 终态：VERIFIED / FAILED / EXPIRED / CANCELLED */
export const TERMINAL_CHALLENGE_STATUSES: readonly FjnChallengeStatus[] = [
  CHALLENGE_STATUS.VERIFIED,
  CHALLENGE_STATUS.FAILED,
  CHALLENGE_STATUS.EXPIRED,
  CHALLENGE_STATUS.CANCELLED,
] as const;

export const CHALLENGE_STATUS_TRANSITIONS: Record<FjnChallengeStatus, readonly FjnChallengeStatus[]> = {
  [CHALLENGE_STATUS.PENDING]: [
    CHALLENGE_STATUS.VERIFIED,
    CHALLENGE_STATUS.FAILED,
    CHALLENGE_STATUS.EXPIRED,
    CHALLENGE_STATUS.CANCELLED,
  ],
  [CHALLENGE_STATUS.VERIFIED]: [],
  [CHALLENGE_STATUS.FAILED]: [],
  [CHALLENGE_STATUS.EXPIRED]: [],
  [CHALLENGE_STATUS.CANCELLED]: [],
} as const;

// ============================================================
// 5. 通用枚举
// ============================================================

/** 设备类型 */
export const DEVICE_TYPE = {
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
  TABLET: 'tablet',
  TV: 'tv',
  IOT: 'iot',
  SERVER: 'server',
  UNKNOWN: 'unknown',
} as const;

export type FjnDeviceType = (typeof DEVICE_TYPE)[keyof typeof DEVICE_TYPE];
export const ALL_DEVICE_TYPES: readonly FjnDeviceType[] = Object.values(DEVICE_TYPE);

/** 风险等级 */
export const DEVICE_RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type FjnDeviceRiskLevel =
  (typeof DEVICE_RISK_LEVEL)[keyof typeof DEVICE_RISK_LEVEL];
export const ALL_DEVICE_RISK_LEVELS: readonly FjnDeviceRiskLevel[] =
  Object.values(DEVICE_RISK_LEVEL);

/** 风险等级权重（用于评分聚合） */
export const DEVICE_RISK_LEVEL_WEIGHT: Record<FjnDeviceRiskLevel, number> = {
  [DEVICE_RISK_LEVEL.LOW]: 10,
  [DEVICE_RISK_LEVEL.MEDIUM]: 40,
  [DEVICE_RISK_LEVEL.HIGH]: 75,
  [DEVICE_RISK_LEVEL.CRITICAL]: 100,
};

/** 挑战类型 */
export const CHALLENGE_TYPE = {
  OTP_EMAIL: 'otp_email',
  OTP_SMS: 'otp_sms',
  OTP_TOTP: 'otp_totp',
  BIOMETRIC_FACE: 'biometric_face',
  BIOMETRIC_FINGER: 'biometric_finger',
  SECURITY_QUESTION: 'security_question',
  ADMIN_APPROVAL: 'admin_approval',
} as const;

export type FjnChallengeType =
  (typeof CHALLENGE_TYPE)[keyof typeof CHALLENGE_TYPE];
export const ALL_CHALLENGE_TYPES: readonly FjnChallengeType[] =
  Object.values(CHALLENGE_TYPE);

/** 挑战触发原因 */
export const CHALLENGE_TRIGGER = {
  NEW_DEVICE: 'new_device',
  SUSPICIOUS_LOCATION: 'suspicious_location',
  HIGH_RISK_SCORE: 'high_risk_score',
  PASSWORD_RESET: 'password_reset',
  SENSITIVE_OPERATION: 'sensitive_operation',
  ADMIN_FORCED: 'admin_forced',
} as const;

export type FjnChallengeTrigger =
  (typeof CHALLENGE_TRIGGER)[keyof typeof CHALLENGE_TRIGGER];
export const ALL_CHALLENGE_TRIGGERS: readonly FjnChallengeTrigger[] =
  Object.values(CHALLENGE_TRIGGER);

/** 黑名单添加原因 */
export const BLACKLIST_REASON = {
  FRAUD: 'fraud',
  ABUSE: 'abuse',
  STOLEN_DEVICE: 'stolen_device',
  TERRORIST_FINANCING: 'terrorist_financing',
  SANCTIONS: 'sanctions',
  AML_VIOLATION: 'aml_violation',
  INTERNAL: 'internal',
} as const;

export type FjnBlacklistReason =
  (typeof BLACKLIST_REASON)[keyof typeof BLACKLIST_REASON];
export const ALL_BLACKLIST_REASONS: readonly FjnBlacklistReason[] =
  Object.values(BLACKLIST_REASON);

/** 黑名单来源 */
export const BLACKLIST_SOURCE = {
  ADMIN: 'admin',
  RISK_ENGINE: 'risk_engine',
  REGULATOR: 'regulator',
  PARTNER: 'partner',
  INTERNAL: 'internal',
} as const;

export type FjnBlacklistSource =
  (typeof BLACKLIST_SOURCE)[keyof typeof BLACKLIST_SOURCE];
export const ALL_BLACKLIST_SOURCES: readonly FjnBlacklistSource[] =
  Object.values(BLACKLIST_SOURCE);

/** 风险评估触发因素 */
export const RISK_FACTOR = {
  NEW_DEVICE: 'new_device',
  UNUSUAL_LOCATION: 'unusual_location',
  UNUSUAL_TIME: 'unusual_time',
  MULTIPLE_FAILED_LOGIN: 'multiple_failed_login',
  VELOCITY: 'velocity',
  DEVICE_FINGERPRINT_MISMATCH: 'device_fingerprint_mismatch',
  KNOWN_FRAUD_PATTERN: 'known_fraud_pattern',
  LOW_KYC: 'low_kyc',
  HIGH_RISK_REGION: 'high_risk_region',
  BLACKLISTED_IP: 'blacklisted_ip',
  IMPOSSIBLE_TRAVEL: 'impossible_travel',
} as const;

export type FjnRiskFactor = (typeof RISK_FACTOR)[keyof typeof RISK_FACTOR];
export const ALL_RISK_FACTORS: readonly FjnRiskFactor[] = Object.values(RISK_FACTOR);

/** 风险因子权重 */
export const RISK_FACTOR_WEIGHT: Record<FjnRiskFactor, number> = {
  [RISK_FACTOR.NEW_DEVICE]: 15,
  [RISK_FACTOR.UNUSUAL_LOCATION]: 25,
  [RISK_FACTOR.UNUSUAL_TIME]: 10,
  [RISK_FACTOR.MULTIPLE_FAILED_LOGIN]: 30,
  [RISK_FACTOR.VELOCITY]: 20,
  [RISK_FACTOR.DEVICE_FINGERPRINT_MISMATCH]: 40,
  [RISK_FACTOR.KNOWN_FRAUD_PATTERN]: 50,
  [RISK_FACTOR.LOW_KYC]: 20,
  [RISK_FACTOR.HIGH_RISK_REGION]: 35,
  [RISK_FACTOR.BLACKLISTED_IP]: 60,
  [RISK_FACTOR.IMPOSSIBLE_TRAVEL]: 45,
};

/** Trust 行动 */
export const TRUST_ACTION = {
  TRUST: 'trust',
  UNTRUST: 'untrust',
  REVOKE: 'revoke',
  BLOCK: 'block',
  UNBLOCK: 'unblock',
} as const;

export type FjnTrustAction = (typeof TRUST_ACTION)[keyof typeof TRUST_ACTION];
export const ALL_TRUST_ACTIONS: readonly FjnTrustAction[] = Object.values(TRUST_ACTION);

// ============================================================
// 6. 工具：状态机校验
// ============================================================

export function isValidUserDeviceStatus(s: string): s is FjnUserDeviceStatus {
  return (ALL_USER_DEVICE_STATUSES as readonly string[]).includes(s);
}

export function isValidBlacklistStatus(s: string): s is FjnBlacklistStatus {
  return (ALL_BLACKLIST_STATUSES as readonly string[]).includes(s);
}

export function isValidRiskAssessmentStatus(
  s: string,
): s is FjnRiskAssessmentStatus {
  return (ALL_RISK_ASSESSMENT_STATUSES as readonly string[]).includes(s);
}

export function isValidChallengeStatus(s: string): s is FjnChallengeStatus {
  return (ALL_CHALLENGE_STATUSES as readonly string[]).includes(s);
}

export function isValidDeviceType(s: string): s is FjnDeviceType {
  return (ALL_DEVICE_TYPES as readonly string[]).includes(s);
}

export function isValidDeviceRiskLevel(s: string): s is FjnDeviceRiskLevel {
  return (ALL_DEVICE_RISK_LEVELS as readonly string[]).includes(s);
}

export function isValidChallengeType(s: string): s is FjnChallengeType {
  return (ALL_CHALLENGE_TYPES as readonly string[]).includes(s);
}

export function isValidChallengeTrigger(s: string): s is FjnChallengeTrigger {
  return (ALL_CHALLENGE_TRIGGERS as readonly string[]).includes(s);
}

export function isValidBlacklistReason(s: string): s is FjnBlacklistReason {
  return (ALL_BLACKLIST_REASONS as readonly string[]).includes(s);
}

export function isValidBlacklistSource(s: string): s is FjnBlacklistSource {
  return (ALL_BLACKLIST_SOURCES as readonly string[]).includes(s);
}

export function isValidRiskFactor(s: string): s is FjnRiskFactor {
  return (ALL_RISK_FACTORS as readonly string[]).includes(s);
}

export function isValidTrustAction(s: string): s is FjnTrustAction {
  return (ALL_TRUST_ACTIONS as readonly string[]).includes(s);
}

export function isTerminalUserDeviceStatus(s: FjnUserDeviceStatus): boolean {
  return TERMINAL_USER_DEVICE_STATUSES.includes(s);
}

export function isTerminalChallengeStatus(s: FjnChallengeStatus): boolean {
  return TERMINAL_CHALLENGE_STATUSES.includes(s);
}

export function canTransitUserDeviceStatus(
  from: FjnUserDeviceStatus,
  to: FjnUserDeviceStatus,
): boolean {
  return USER_DEVICE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitUserDeviceStatus(
  from: FjnUserDeviceStatus,
  to: FjnUserDeviceStatus,
): void {
  if (!canTransitUserDeviceStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 UserDevice 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: USER_DEVICE_STATUS_TRANSITIONS[from] },
    );
  }
}

export function canTransitBlacklistStatus(
  from: FjnBlacklistStatus,
  to: FjnBlacklistStatus,
): boolean {
  return BLACKLIST_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitBlacklistStatus(
  from: FjnBlacklistStatus,
  to: FjnBlacklistStatus,
): void {
  if (!canTransitBlacklistStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 Blacklist 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: BLACKLIST_STATUS_TRANSITIONS[from] },
    );
  }
}

export function canTransitRiskAssessmentStatus(
  from: FjnRiskAssessmentStatus,
  to: FjnRiskAssessmentStatus,
): boolean {
  return RISK_ASSESSMENT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitRiskAssessmentStatus(
  from: FjnRiskAssessmentStatus,
  to: FjnRiskAssessmentStatus,
): void {
  if (!canTransitRiskAssessmentStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 RiskAssessment 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: RISK_ASSESSMENT_STATUS_TRANSITIONS[from] },
    );
  }
}

export function canTransitChallengeStatus(
  from: FjnChallengeStatus,
  to: FjnChallengeStatus,
): boolean {
  return CHALLENGE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitChallengeStatus(
  from: FjnChallengeStatus,
  to: FjnChallengeStatus,
): void {
  if (!canTransitChallengeStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 Challenge 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: CHALLENGE_STATUS_TRANSITIONS[from] },
    );
  }
}

export function nextUserDeviceStatuses(
  from: FjnUserDeviceStatus,
): readonly FjnUserDeviceStatus[] {
  return USER_DEVICE_STATUS_TRANSITIONS[from] ?? [];
}

export function nextChallengeStatuses(
  from: FjnChallengeStatus,
): readonly FjnChallengeStatus[] {
  return CHALLENGE_STATUS_TRANSITIONS[from] ?? [];
}

// ============================================================
// 7. 业务工具
// ============================================================

/** UserDevice 是否可用（active / trusted） */
export function isUserDeviceUsable(s: FjnUserDeviceStatus): boolean {
  return s === USER_DEVICE_STATUS.ACTIVE || s === USER_DEVICE_STATUS.TRUSTED;
}

/** Blacklist 是否生效（active 且未过期） */
export function isBlacklistActive(
  s: FjnBlacklistStatus,
  expiresAt: Date | null | undefined,
): boolean {
  if (s !== BLACKLIST_STATUS.ACTIVE) return false;
  if (!expiresAt) return true;
  return expiresAt.getTime() > Date.now();
}

/** Challenge 是否待验证 */
export function isChallengePending(s: FjnChallengeStatus): boolean {
  return s === CHALLENGE_STATUS.PENDING;
}

/** 风险等级分值（用于聚合评分） */
export function riskLevelScore(level: FjnDeviceRiskLevel): number {
  return DEVICE_RISK_LEVEL_WEIGHT[level];
}

/** 风险因子分值 */
export function riskFactorScore(factor: FjnRiskFactor): number {
  return RISK_FACTOR_WEIGHT[factor];
}

/** 判断风险等级（根据分数） */
export function calcDeviceRiskLevel(score: number): FjnDeviceRiskLevel {
  if (score >= 75) return DEVICE_RISK_LEVEL.CRITICAL;
  if (score >= 50) return DEVICE_RISK_LEVEL.HIGH;
  if (score >= 25) return DEVICE_RISK_LEVEL.MEDIUM;
  return DEVICE_RISK_LEVEL.LOW;
}

/** Fingerprint 格式校验：^[a-zA-Z0-9_-]{16,255}$ */
export function isValidFingerprint(fp: string): boolean {
  return /^[a-zA-Z0-9_-]{16,255}$/.test(fp);
}

/** 设备名格式校验：1-100 字符 */
export function isValidDeviceName(name: string): boolean {
  return name.length >= 1 && name.length <= 100;
}

/** 风险分数范围校验：0-100 */
export function isValidRiskScore(score: number): boolean {
  return score >= 0 && score <= 100;
}

// ============================================================
// 8. 默认业务常量
// ============================================================

/** 默认 Challenge 有效期（分钟） */
export const DEVICE_CHALLENGE_DEFAULT_EXPIRES_MINUTES = 10;

/** 默认 Challenge 最大尝试次数 */
export const DEVICE_CHALLENGE_DEFAULT_MAX_ATTEMPTS = 3;

/** 默认用户最大绑定设备数 */
export const DEVICE_USER_MAX_DEVICES = 5;

/** 默认风险分数阈值（达到后自动 trusted） */
export const DEVICE_TRUST_AUTO_THRESHOLD = 10;

/** 默认风险分数阈值（达到后强制 challenge） */
export const DEVICE_CHALLENGE_AUTO_THRESHOLD = 50;

/** 默认风险分数阈值（达到后自动 blocked） */
export const DEVICE_BLOCK_AUTO_THRESHOLD = 75;

/** 默认黑名单有效期（天），0 表示永久 */
export const DEVICE_BLACKLIST_DEFAULT_EXPIRES_DAYS = 0;
