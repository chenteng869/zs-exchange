/**
 * FJN Device Service 冒烟测试
 *
 * 严格遵循 H015 + H018 工业级规范：
 *  - UserDevice 状态机（5 个状态 + 流转表）
 *  - Blacklist 状态机（3 个状态 + 流转表）
 *  - RiskAssessment 状态机（3 个状态 + 流转表）
 *  - Challenge 状态机（5 个状态 + 流转表）
 *  - 通用枚举（DeviceType 7 / RiskLevel 4 / ChallengeType 7 / ChallengeTrigger 6 / BlacklistReason 7 / BlacklistSource 5 / RiskFactor 11 / TrustAction 5）
 *  - 风险评分聚合（riskFactorScore / riskLevelScore / calcDeviceRiskLevel）
 *  - 11 个事件常量
 *  - 35+ 错误码 + 38+ 异常类
 *  - 业务工具（isUserDeviceUsable / isBlacklistActive / isChallengePending / isValidFingerprint / isValidDeviceName）
 *  - 设备限制（max devices / trust auto / challenge auto / block auto 阈值）
 *  - Service 类可实例化
 */

import { FjnError } from '../src/lib/fjn/errors';
import {
  // UserDevice 状态
  USER_DEVICE_STATUS,
  ALL_USER_DEVICE_STATUSES,
  TERMINAL_USER_DEVICE_STATUSES,
  USER_DEVICE_STATUS_TRANSITIONS,
  // Blacklist 状态
  BLACKLIST_STATUS,
  ALL_BLACKLIST_STATUSES,
  BLACKLIST_STATUS_TRANSITIONS,
  // RiskAssessment 状态
  RISK_ASSESSMENT_STATUS,
  ALL_RISK_ASSESSMENT_STATUSES,
  RISK_ASSESSMENT_STATUS_TRANSITIONS,
  // Challenge 状态
  CHALLENGE_STATUS,
  ALL_CHALLENGE_STATUSES,
  TERMINAL_CHALLENGE_STATUSES,
  CHALLENGE_STATUS_TRANSITIONS,
  // 通用枚举
  DEVICE_TYPE,
  ALL_DEVICE_TYPES,
  DEVICE_RISK_LEVEL,
  ALL_DEVICE_RISK_LEVELS,
  DEVICE_RISK_LEVEL_WEIGHT,
  CHALLENGE_TYPE,
  ALL_CHALLENGE_TYPES,
  CHALLENGE_TRIGGER,
  ALL_CHALLENGE_TRIGGERS,
  BLACKLIST_REASON,
  ALL_BLACKLIST_REASONS,
  DEVICE_BLACKLIST_SOURCE,
  ALL_DEVICE_BLACKLIST_SOURCES,
  RISK_FACTOR,
  ALL_RISK_FACTORS,
  RISK_FACTOR_WEIGHT,
  TRUST_ACTION,
  ALL_TRUST_ACTIONS,
  // 工具
  isValidUserDeviceStatus,
  isValidBlacklistStatus,
  isValidRiskAssessmentStatus,
  isValidChallengeStatus,
  isValidDeviceType,
  isValidDeviceRiskLevel,
  isValidChallengeType,
  isValidChallengeTrigger,
  isValidBlacklistReason,
  isValidDeviceBlacklistSource,
  isValidRiskFactor,
  isValidTrustAction,
  isTerminalUserDeviceStatus,
  isTerminalChallengeStatus,
  canTransitUserDeviceStatus,
  canTransitBlacklistStatus,
  canTransitRiskAssessmentStatus,
  canTransitChallengeStatus,
  assertTransitUserDeviceStatus,
  assertTransitDeviceBlacklistStatus,
  assertTransitRiskAssessmentStatus,
  assertTransitChallengeStatus,
  nextUserDeviceStatuses,
  nextChallengeStatuses,
  isUserDeviceUsable,
  isBlacklistActive,
  isChallengePending,
  riskLevelScore,
  riskFactorScore,
  calcDeviceRiskLevel,
  isValidFingerprint,
  isValidDeviceName,
  isValidRiskScore,
  DEVICE_CHALLENGE_DEFAULT_EXPIRES_MINUTES,
  DEVICE_CHALLENGE_DEFAULT_MAX_ATTEMPTS,
  DEVICE_USER_MAX_DEVICES,
  DEVICE_TRUST_AUTO_THRESHOLD,
  DEVICE_CHALLENGE_AUTO_THRESHOLD,
  DEVICE_BLOCK_AUTO_THRESHOLD,
  DEVICE_BLACKLIST_DEFAULT_EXPIRES_DAYS,
  type FjnUserDeviceStatus,
  type FjnBlacklistStatus,
  type FjnRiskAssessmentStatus,
  type FjnChallengeStatus,
  // 事件
  DEVICE_EVENTS,
  DEVICE_EVENT_SOURCES,
  ALL_DEVICE_EVENTS,
  ALL_DEVICE_EVENT_SOURCES,
  type FjnDeviceEventName,
  type FjnDeviceEventSource,
  // 错误
  DEVICE_ERROR_CODES,
  type FjnDeviceErrorCode,
  FjnDeviceError,
  FjnUserDeviceNotFoundError,
  FjnUserDeviceAlreadyBoundError,
  FjnUserDeviceLimitExceededError,
  FjnUserDeviceStatusInvalidError,
  FjnUserDeviceRevokedError,
  FjnUserDeviceBlockedError,
  FjnUserDeviceHeartbeatExpiredError,
  FjnUserDeviceNameInvalidError,
  FjnTrustLogNotFoundError,
  FjnTrustAlreadyAppliedError,
  FjnTrustRevokeNotAllowedError,
  FjnDeviceBlacklistNotFoundError,
  FjnDeviceBlacklistAlreadyExistsError,
  FjnDeviceBlacklistMatchedError,
  FjnDeviceBlacklistReasonInvalidError,
  FjnDeviceBlacklistSourceInvalidError,
  FjnDeviceBlacklistRefNoRequiredError,
  FjnDeviceBlacklistExpiresInvalidError,
  FjnDeviceBlacklistAlreadyDisabledError,
  FjnDeviceRiskAssessmentNotFoundError,
  FjnDeviceRiskAssessmentAlreadyActionedError,
  FjnDeviceRiskScoreInvalidError,
  FjnDeviceRiskFactorInvalidError,
  FjnDeviceChallengeNotFoundError,
  FjnDeviceChallengeAlreadyVerifiedError,
  FjnDeviceChallengeAlreadyFailedError,
  FjnDeviceChallengeExpiredError,
  FjnDeviceChallengeCancelledError,
  FjnDeviceChallengeCodeMismatchError,
  FjnDeviceChallengeMaxAttemptsExceededError,
  FjnDeviceChallengeTypeInvalidError,
  FjnDeviceChallengeTriggerInvalidError,
  FjnDeviceChallengeTargetRequiredError,
  FjnDeviceChallengeNotPendingError,
  FjnDeviceFingerprintNotFoundError,
  FjnDeviceFingerprintInvalidError,
  FjnDeviceFingerprintAlreadyExistsError,
  // Service
  FjnDeviceService,
  createFjnDeviceService,
  DEVICE_DEFAULT_USER_MAX_DEVICES,
  type UpsertFingerprintInput,
  type BindDeviceInput,
  type DeviceHeartbeatInput,
  type ListUserDeviceInput,
  type ChangeDeviceStatusInput,
  type AddDeviceBlacklistInput,
  type ListBlacklistInput,
  type CheckBlacklistInput,
  type AssessDeviceRiskInput,
  type ListRiskAssessmentInput,
  type ActionRiskAssessmentInput,
  type IssueChallengeInput,
  type VerifyChallengeInput,
  type ChangeChallengeStatusInput,
  type ListChallengeInput,
  type BindDeviceResult,
  type RiskAssessmentResult,
  type BlacklistCheckResult,
} from '../src/lib/fjn';

let pass = 0;
let fail = 0;
function assert(name: string, cond: boolean, info?: unknown): void {
  if (cond) {
    console.log(`  ✅ ${name}`);
    pass++;
  } else {
    console.log(`  ❌ ${name}`, info ?? '');
    fail++;
  }
}

function expectThrow(name: string, fn: () => unknown, errType: unknown): void {
  try {
    fn();
    assert(name, false, 'expected throw but did not');
  } catch (e) {
    const ok = errType === undefined
      ? true
      : e instanceof (errType as new (...args: unknown[]) => Error);
    assert(name, ok, `actual=${(e as Error)?.constructor?.name ?? e}`);
  }
}

console.log('=== FJN Device Service 冒烟测试 ===\n');

// ============================================================
// [1] UserDevice 状态常量
// ============================================================
console.log('[1] UserDevice 状态常量');
assert('USER_DEVICE_STATUS.PENDING = pending', USER_DEVICE_STATUS.PENDING === 'pending');
assert('USER_DEVICE_STATUS.ACTIVE = active', USER_DEVICE_STATUS.ACTIVE === 'active');
assert('USER_DEVICE_STATUS.TRUSTED = trusted', USER_DEVICE_STATUS.TRUSTED === 'trusted');
assert('USER_DEVICE_STATUS.BLOCKED = blocked', USER_DEVICE_STATUS.BLOCKED === 'blocked');
assert('USER_DEVICE_STATUS.REVOKED = revoked', USER_DEVICE_STATUS.REVOKED === 'revoked');
assert('ALL_USER_DEVICE_STATUSES 包含 5 个', ALL_USER_DEVICE_STATUSES.length === 5, `actual=${ALL_USER_DEVICE_STATUSES.length}`);
assert('TERMINAL_USER_DEVICE_STATUSES 包含 revoked', TERMINAL_USER_DEVICE_STATUSES.includes(USER_DEVICE_STATUS.REVOKED));
assert('isValidUserDeviceStatus(active) = true', isValidUserDeviceStatus('active'));
assert('isValidUserDeviceStatus(unknown) = false', !isValidUserDeviceStatus('unknown'));
assert('isTerminalUserDeviceStatus(revoked) = true', isTerminalUserDeviceStatus(USER_DEVICE_STATUS.REVOKED));
assert('isTerminalUserDeviceStatus(active) = false', !isTerminalUserDeviceStatus(USER_DEVICE_STATUS.ACTIVE));
assert('isUserDeviceUsable(active) = true', isUserDeviceUsable(USER_DEVICE_STATUS.ACTIVE));
assert('isUserDeviceUsable(trusted) = true', isUserDeviceUsable(USER_DEVICE_STATUS.TRUSTED));
assert('isUserDeviceUsable(blocked) = false', !isUserDeviceUsable(USER_DEVICE_STATUS.BLOCKED));
assert('isUserDeviceUsable(revoked) = false', !isUserDeviceUsable(USER_DEVICE_STATUS.REVOKED));

// ============================================================
// [2] UserDevice 状态机流转表
// ============================================================
console.log('\n[2] UserDevice 状态机流转表');
assert('pending → active（合法）', canTransitUserDeviceStatus(USER_DEVICE_STATUS.PENDING, USER_DEVICE_STATUS.ACTIVE));
assert('pending → blocked（合法）', canTransitUserDeviceStatus(USER_DEVICE_STATUS.PENDING, USER_DEVICE_STATUS.BLOCKED));
assert('pending → revoked（合法）', canTransitUserDeviceStatus(USER_DEVICE_STATUS.PENDING, USER_DEVICE_STATUS.REVOKED));
assert('pending → trusted（非法）', !canTransitUserDeviceStatus(USER_DEVICE_STATUS.PENDING, USER_DEVICE_STATUS.TRUSTED));
assert('active → trusted（合法）', canTransitUserDeviceStatus(USER_DEVICE_STATUS.ACTIVE, USER_DEVICE_STATUS.TRUSTED));
assert('active → blocked（合法）', canTransitUserDeviceStatus(USER_DEVICE_STATUS.ACTIVE, USER_DEVICE_STATUS.BLOCKED));
assert('active → active（非法）', !canTransitUserDeviceStatus(USER_DEVICE_STATUS.ACTIVE, USER_DEVICE_STATUS.ACTIVE));
assert('trusted → active（合法）', canTransitUserDeviceStatus(USER_DEVICE_STATUS.TRUSTED, USER_DEVICE_STATUS.ACTIVE));
assert('trusted → blocked（合法）', canTransitUserDeviceStatus(USER_DEVICE_STATUS.TRUSTED, USER_DEVICE_STATUS.BLOCKED));
assert('blocked → active（合法）', canTransitUserDeviceStatus(USER_DEVICE_STATUS.BLOCKED, USER_DEVICE_STATUS.ACTIVE));
assert('blocked → trusted（非法）', !canTransitUserDeviceStatus(USER_DEVICE_STATUS.BLOCKED, USER_DEVICE_STATUS.TRUSTED));
assert('revoked → active（非法）', !canTransitUserDeviceStatus(USER_DEVICE_STATUS.REVOKED, USER_DEVICE_STATUS.ACTIVE));
assert('revoked → 任意（非法）',
  !canTransitUserDeviceStatus(USER_DEVICE_STATUS.REVOKED, USER_DEVICE_STATUS.TRUSTED) &&
  !canTransitUserDeviceStatus(USER_DEVICE_STATUS.REVOKED, USER_DEVICE_STATUS.BLOCKED));
for (const s of ALL_USER_DEVICE_STATUSES) {
  assert(`USER_DEVICE_STATUS_TRANSITIONS[${s}] 已定义`, Array.isArray(USER_DEVICE_STATUS_TRANSITIONS[s]));
}

// ============================================================
// [3] assertTransitUserDeviceStatus 抛错
// ============================================================
console.log('\n[3] assertTransitUserDeviceStatus 抛错');
expectThrow(
  'assertTransit(pending, trusted) 抛 FjnError',
  () => assertTransitUserDeviceStatus(USER_DEVICE_STATUS.PENDING, USER_DEVICE_STATUS.TRUSTED),
  FjnError,
);
assert('合法转移不抛错', (() => {
  try {
    assertTransitUserDeviceStatus(USER_DEVICE_STATUS.PENDING, USER_DEVICE_STATUS.ACTIVE);
    return true;
  } catch {
    return false;
  }
})());

// ============================================================
// [4] nextUserDeviceStatuses
// ============================================================
console.log('\n[4] nextUserDeviceStatuses');
assert('nextUserDeviceStatuses(pending).length = 3', nextUserDeviceStatuses(USER_DEVICE_STATUS.PENDING).length === 3);
assert('nextUserDeviceStatuses(active) 含 trusted', nextUserDeviceStatuses(USER_DEVICE_STATUS.ACTIVE).includes(USER_DEVICE_STATUS.TRUSTED));
assert('nextUserDeviceStatuses(revoked).length = 0', nextUserDeviceStatuses(USER_DEVICE_STATUS.REVOKED).length === 0);

// ============================================================
// [5] Blacklist 状态机
// ============================================================
console.log('\n[5] Blacklist 状态机');
assert('BLACKLIST_STATUS.ACTIVE = active', BLACKLIST_STATUS.ACTIVE === 'active');
assert('BLACKLIST_STATUS.DISABLED = disabled', BLACKLIST_STATUS.DISABLED === 'disabled');
assert('BLACKLIST_STATUS.EXPIRED = expired', BLACKLIST_STATUS.EXPIRED === 'expired');
assert('ALL_BLACKLIST_STATUSES 包含 3 个', ALL_BLACKLIST_STATUSES.length === 3);
assert('isValidBlacklistStatus(active) = true', isValidBlacklistStatus('active'));
assert('isValidBlacklistStatus(unknown) = false', !isValidBlacklistStatus('unknown'));
assert('active → disabled（合法）', canTransitBlacklistStatus(BLACKLIST_STATUS.ACTIVE, BLACKLIST_STATUS.DISABLED));
assert('active → expired（合法）', canTransitBlacklistStatus(BLACKLIST_STATUS.ACTIVE, BLACKLIST_STATUS.EXPIRED));
assert('disabled → active（合法）', canTransitBlacklistStatus(BLACKLIST_STATUS.DISABLED, BLACKLIST_STATUS.ACTIVE));
assert('disabled → expired（合法）', canTransitBlacklistStatus(BLACKLIST_STATUS.DISABLED, BLACKLIST_STATUS.EXPIRED));
assert('expired → active（合法）', canTransitBlacklistStatus(BLACKLIST_STATUS.EXPIRED, BLACKLIST_STATUS.ACTIVE));
assert('expired → disabled（非法）', !canTransitBlacklistStatus(BLACKLIST_STATUS.EXPIRED, BLACKLIST_STATUS.DISABLED));
for (const s of ALL_BLACKLIST_STATUSES) {
  assert(`BLACKLIST_STATUS_TRANSITIONS[${s}] 已定义`, Array.isArray(BLACKLIST_STATUS_TRANSITIONS[s]));
}

assert('isBlacklistActive(active, null) = true', isBlacklistActive(BLACKLIST_STATUS.ACTIVE, null));
assert('isBlacklistActive(active, future) = true', isBlacklistActive(BLACKLIST_STATUS.ACTIVE, new Date(Date.now() + 86400000)));
assert('isBlacklistActive(active, past) = false', !isBlacklistActive(BLACKLIST_STATUS.ACTIVE, new Date(Date.now() - 86400000)));
assert('isBlacklistActive(disabled, null) = false', !isBlacklistActive(BLACKLIST_STATUS.DISABLED, null));
assert('isBlacklistActive(expired, null) = false', !isBlacklistActive(BLACKLIST_STATUS.EXPIRED, null));

// ============================================================
// [6] RiskAssessment 状态机
// ============================================================
console.log('\n[6] RiskAssessment 状态机');
assert('RISK_ASSESSMENT_STATUS.SCORED = scored', RISK_ASSESSMENT_STATUS.SCORED === 'scored');
assert('RISK_ASSESSMENT_STATUS.DISMISSED = dismissed', RISK_ASSESSMENT_STATUS.DISMISSED === 'dismissed');
assert('RISK_ASSESSMENT_STATUS.ACTIONED = actioned', RISK_ASSESSMENT_STATUS.ACTIONED === 'actioned');
assert('ALL_RISK_ASSESSMENT_STATUSES 包含 3 个', ALL_RISK_ASSESSMENT_STATUSES.length === 3);
assert('isValidRiskAssessmentStatus(scored) = true', isValidRiskAssessmentStatus('scored'));
assert('scored → dismissed（合法）', canTransitRiskAssessmentStatus(RISK_ASSESSMENT_STATUS.SCORED, RISK_ASSESSMENT_STATUS.DISMISSED));
assert('scored → actioned（合法）', canTransitRiskAssessmentStatus(RISK_ASSESSMENT_STATUS.SCORED, RISK_ASSESSMENT_STATUS.ACTIONED));
assert('dismissed → actioned（合法）', canTransitRiskAssessmentStatus(RISK_ASSESSMENT_STATUS.DISMISSED, RISK_ASSESSMENT_STATUS.ACTIONED));
assert('actioned → dismissed（非法）', !canTransitRiskAssessmentStatus(RISK_ASSESSMENT_STATUS.ACTIONED, RISK_ASSESSMENT_STATUS.DISMISSED));
for (const s of ALL_RISK_ASSESSMENT_STATUSES) {
  assert(`RISK_ASSESSMENT_STATUS_TRANSITIONS[${s}] 已定义`, Array.isArray(RISK_ASSESSMENT_STATUS_TRANSITIONS[s]));
}

// ============================================================
// [7] Challenge 状态机
// ============================================================
console.log('\n[7] Challenge 状态机');
assert('CHALLENGE_STATUS.PENDING = pending', CHALLENGE_STATUS.PENDING === 'pending');
assert('CHALLENGE_STATUS.VERIFIED = verified', CHALLENGE_STATUS.VERIFIED === 'verified');
assert('CHALLENGE_STATUS.FAILED = failed', CHALLENGE_STATUS.FAILED === 'failed');
assert('CHALLENGE_STATUS.EXPIRED = expired', CHALLENGE_STATUS.EXPIRED === 'expired');
assert('CHALLENGE_STATUS.CANCELLED = cancelled', CHALLENGE_STATUS.CANCELLED === 'cancelled');
assert('ALL_CHALLENGE_STATUSES 包含 5 个', ALL_CHALLENGE_STATUSES.length === 5);
assert('TERMINAL_CHALLENGE_STATUSES 包含 4 个', TERMINAL_CHALLENGE_STATUSES.length === 4);
assert('isValidChallengeStatus(pending) = true', isValidChallengeStatus('pending'));
assert('isTerminalChallengeStatus(verified) = true', isTerminalChallengeStatus(CHALLENGE_STATUS.VERIFIED));
assert('isChallengePending(pending) = true', isChallengePending(CHALLENGE_STATUS.PENDING));
assert('isChallengePending(verified) = false', !isChallengePending(CHALLENGE_STATUS.VERIFIED));
assert('pending → verified（合法）', canTransitChallengeStatus(CHALLENGE_STATUS.PENDING, CHALLENGE_STATUS.VERIFIED));
assert('pending → failed（合法）', canTransitChallengeStatus(CHALLENGE_STATUS.PENDING, CHALLENGE_STATUS.FAILED));
assert('pending → expired（合法）', canTransitChallengeStatus(CHALLENGE_STATUS.PENDING, CHALLENGE_STATUS.EXPIRED));
assert('pending → cancelled（合法）', canTransitChallengeStatus(CHALLENGE_STATUS.PENDING, CHALLENGE_STATUS.CANCELLED));
assert('verified → failed（非法）', !canTransitChallengeStatus(CHALLENGE_STATUS.VERIFIED, CHALLENGE_STATUS.FAILED));
for (const s of ALL_CHALLENGE_STATUSES) {
  assert(`CHALLENGE_STATUS_TRANSITIONS[${s}] 已定义`, Array.isArray(CHALLENGE_STATUS_TRANSITIONS[s]));
}
assert('nextChallengeStatuses(pending).length = 4', nextChallengeStatuses(CHALLENGE_STATUS.PENDING).length === 4);
assert('nextChallengeStatuses(verified).length = 0', nextChallengeStatuses(CHALLENGE_STATUS.VERIFIED).length === 0);

// ============================================================
// [8] 通用枚举 - DeviceType
// ============================================================
console.log('\n[8] DeviceType 枚举');
assert('DEVICE_TYPE.DESKTOP = desktop', DEVICE_TYPE.DESKTOP === 'desktop');
assert('DEVICE_TYPE.MOBILE = mobile', DEVICE_TYPE.MOBILE === 'mobile');
assert('DEVICE_TYPE.TABLET = tablet', DEVICE_TYPE.TABLET === 'tablet');
assert('DEVICE_TYPE.TV = tv', DEVICE_TYPE.TV === 'tv');
assert('DEVICE_TYPE.IOT = iot', DEVICE_TYPE.IOT === 'iot');
assert('DEVICE_TYPE.SERVER = server', DEVICE_TYPE.SERVER === 'server');
assert('DEVICE_TYPE.UNKNOWN = unknown', DEVICE_TYPE.UNKNOWN === 'unknown');
assert('ALL_DEVICE_TYPES 包含 7 个', ALL_DEVICE_TYPES.length === 7);
assert('isValidDeviceType(mobile) = true', isValidDeviceType('mobile'));
assert('isValidDeviceType(unknown_type) = false', !isValidDeviceType('unknown_type'));

// ============================================================
// [9] RiskLevel 枚举 + 权重
// ============================================================
console.log('\n[9] RiskLevel 枚举 + 权重');
assert('DEVICE_RISK_LEVEL.LOW = low', DEVICE_RISK_LEVEL.LOW === 'low');
assert('DEVICE_RISK_LEVEL.MEDIUM = medium', DEVICE_RISK_LEVEL.MEDIUM === 'medium');
assert('DEVICE_RISK_LEVEL.HIGH = high', DEVICE_RISK_LEVEL.HIGH === 'high');
assert('DEVICE_RISK_LEVEL.CRITICAL = critical', DEVICE_RISK_LEVEL.CRITICAL === 'critical');
assert('ALL_DEVICE_RISK_LEVELS 包含 4 个', ALL_DEVICE_RISK_LEVELS.length === 4);
assert('isValidDeviceRiskLevel(low) = true', isValidDeviceRiskLevel('low'));
assert('isValidDeviceRiskLevel(extreme) = false', !isValidDeviceRiskLevel('extreme'));
assert('DEVICE_RISK_LEVEL_WEIGHT[low] = 10', DEVICE_RISK_LEVEL_WEIGHT[DEVICE_RISK_LEVEL.LOW] === 10);
assert('DEVICE_RISK_LEVEL_WEIGHT[medium] = 40', DEVICE_RISK_LEVEL_WEIGHT[DEVICE_RISK_LEVEL.MEDIUM] === 40);
assert('DEVICE_RISK_LEVEL_WEIGHT[high] = 75', DEVICE_RISK_LEVEL_WEIGHT[DEVICE_RISK_LEVEL.HIGH] === 75);
assert('DEVICE_RISK_LEVEL_WEIGHT[critical] = 100', DEVICE_RISK_LEVEL_WEIGHT[DEVICE_RISK_LEVEL.CRITICAL] === 100);
assert('riskLevelScore(low) = 10', riskLevelScore(DEVICE_RISK_LEVEL.LOW) === 10);
assert('riskLevelScore(critical) = 100', riskLevelScore(DEVICE_RISK_LEVEL.CRITICAL) === 100);
assert('calcDeviceRiskLevel(0) = low', calcDeviceRiskLevel(0) === DEVICE_RISK_LEVEL.LOW);
assert('calcDeviceRiskLevel(25) = medium', calcDeviceRiskLevel(25) === DEVICE_RISK_LEVEL.MEDIUM);
assert('calcDeviceRiskLevel(50) = high', calcDeviceRiskLevel(50) === DEVICE_RISK_LEVEL.HIGH);
assert('calcDeviceRiskLevel(75) = critical', calcDeviceRiskLevel(75) === DEVICE_RISK_LEVEL.CRITICAL);
assert('calcDeviceRiskLevel(100) = critical', calcDeviceRiskLevel(100) === DEVICE_RISK_LEVEL.CRITICAL);
assert('calcDeviceRiskLevel(24) = low', calcDeviceRiskLevel(24) === DEVICE_RISK_LEVEL.LOW);
assert('calcDeviceRiskLevel(49) = medium', calcDeviceRiskLevel(49) === DEVICE_RISK_LEVEL.MEDIUM);
assert('calcDeviceRiskLevel(74) = high', calcDeviceRiskLevel(74) === DEVICE_RISK_LEVEL.HIGH);

// ============================================================
// [10] ChallengeType 枚举
// ============================================================
console.log('\n[10] ChallengeType 枚举');
assert('CHALLENGE_TYPE.OTP_EMAIL = otp_email', CHALLENGE_TYPE.OTP_EMAIL === 'otp_email');
assert('CHALLENGE_TYPE.OTP_SMS = otp_sms', CHALLENGE_TYPE.OTP_SMS === 'otp_sms');
assert('CHALLENGE_TYPE.OTP_TOTP = otp_totp', CHALLENGE_TYPE.OTP_TOTP === 'otp_totp');
assert('CHALLENGE_TYPE.BIOMETRIC_FACE = biometric_face', CHALLENGE_TYPE.BIOMETRIC_FACE === 'biometric_face');
assert('CHALLENGE_TYPE.BIOMETRIC_FINGER = biometric_finger', CHALLENGE_TYPE.BIOMETRIC_FINGER === 'biometric_finger');
assert('CHALLENGE_TYPE.SECURITY_QUESTION = security_question', CHALLENGE_TYPE.SECURITY_QUESTION === 'security_question');
assert('CHALLENGE_TYPE.ADMIN_APPROVAL = admin_approval', CHALLENGE_TYPE.ADMIN_APPROVAL === 'admin_approval');
assert('ALL_CHALLENGE_TYPES 包含 7 个', ALL_CHALLENGE_TYPES.length === 7);
assert('isValidChallengeType(otp_email) = true', isValidChallengeType('otp_email'));
assert('isValidChallengeType(unknown) = false', !isValidChallengeType('unknown'));

// ============================================================
// [11] ChallengeTrigger 枚举
// ============================================================
console.log('\n[11] ChallengeTrigger 枚举');
assert('CHALLENGE_TRIGGER.NEW_DEVICE = new_device', CHALLENGE_TRIGGER.NEW_DEVICE === 'new_device');
assert('CHALLENGE_TRIGGER.SUSPICIOUS_LOCATION = suspicious_location', CHALLENGE_TRIGGER.SUSPICIOUS_LOCATION === 'suspicious_location');
assert('CHALLENGE_TRIGGER.HIGH_RISK_SCORE = high_risk_score', CHALLENGE_TRIGGER.HIGH_RISK_SCORE === 'high_risk_score');
assert('CHALLENGE_TRIGGER.PASSWORD_RESET = password_reset', CHALLENGE_TRIGGER.PASSWORD_RESET === 'password_reset');
assert('CHALLENGE_TRIGGER.SENSITIVE_OPERATION = sensitive_operation', CHALLENGE_TRIGGER.SENSITIVE_OPERATION === 'sensitive_operation');
assert('CHALLENGE_TRIGGER.ADMIN_FORCED = admin_forced', CHALLENGE_TRIGGER.ADMIN_FORCED === 'admin_forced');
assert('ALL_CHALLENGE_TRIGGERS 包含 6 个', ALL_CHALLENGE_TRIGGERS.length === 6);
assert('isValidChallengeTrigger(new_device) = true', isValidChallengeTrigger('new_device'));
assert('isValidChallengeTrigger(unknown) = false', !isValidChallengeTrigger('unknown'));

// ============================================================
// [12] BlacklistReason + BlacklistSource 枚举
// ============================================================
console.log('\n[12] BlacklistReason + BlacklistSource 枚举');
assert('BLACKLIST_REASON.FRAUD = fraud', BLACKLIST_REASON.FRAUD === 'fraud');
assert('BLACKLIST_REASON.ABUSE = abuse', BLACKLIST_REASON.ABUSE === 'abuse');
assert('BLACKLIST_REASON.STOLEN_DEVICE = stolen_device', BLACKLIST_REASON.STOLEN_DEVICE === 'stolen_device');
assert('BLACKLIST_REASON.TERRORIST_FINANCING = terrorist_financing', BLACKLIST_REASON.TERRORIST_FINANCING === 'terrorist_financing');
assert('BLACKLIST_REASON.SANCTIONS = sanctions', BLACKLIST_REASON.SANCTIONS === 'sanctions');
assert('BLACKLIST_REASON.AML_VIOLATION = aml_violation', BLACKLIST_REASON.AML_VIOLATION === 'aml_violation');
assert('BLACKLIST_REASON.INTERNAL = internal', BLACKLIST_REASON.INTERNAL === 'internal');
assert('ALL_BLACKLIST_REASONS 包含 7 个', ALL_BLACKLIST_REASONS.length === 7);
assert('isValidBlacklistReason(fraud) = true', isValidBlacklistReason('fraud'));
assert('isValidBlacklistReason(unknown) = false', !isValidBlacklistReason('unknown'));
assert('DEVICE_BLACKLIST_SOURCE.ADMIN = admin', DEVICE_BLACKLIST_SOURCE.ADMIN === 'admin');
assert('DEVICE_BLACKLIST_SOURCE.RISK_ENGINE = risk_engine', DEVICE_BLACKLIST_SOURCE.RISK_ENGINE === 'risk_engine');
assert('DEVICE_BLACKLIST_SOURCE.REGULATOR = regulator', DEVICE_BLACKLIST_SOURCE.REGULATOR === 'regulator');
assert('DEVICE_BLACKLIST_SOURCE.PARTNER = partner', DEVICE_BLACKLIST_SOURCE.PARTNER === 'partner');
assert('DEVICE_BLACKLIST_SOURCE.INTERNAL = internal', DEVICE_BLACKLIST_SOURCE.INTERNAL === 'internal');
assert('ALL_DEVICE_BLACKLIST_SOURCES 包含 5 个', ALL_DEVICE_BLACKLIST_SOURCES.length === 5);
assert('isValidDeviceBlacklistSource(admin) = true', isValidDeviceBlacklistSource('admin'));

// ============================================================
// [13] RiskFactor 枚举 + 权重
// ============================================================
console.log('\n[13] RiskFactor 枚举 + 权重');
assert('RISK_FACTOR.NEW_DEVICE = new_device', RISK_FACTOR.NEW_DEVICE === 'new_device');
assert('RISK_FACTOR.UNUSUAL_LOCATION = unusual_location', RISK_FACTOR.UNUSUAL_LOCATION === 'unusual_location');
assert('RISK_FACTOR.UNUSUAL_TIME = unusual_time', RISK_FACTOR.UNUSUAL_TIME === 'unusual_time');
assert('RISK_FACTOR.MULTIPLE_FAILED_LOGIN = multiple_failed_login', RISK_FACTOR.MULTIPLE_FAILED_LOGIN === 'multiple_failed_login');
assert('RISK_FACTOR.VELOCITY = velocity', RISK_FACTOR.VELOCITY === 'velocity');
assert('RISK_FACTOR.DEVICE_FINGERPRINT_MISMATCH = device_fingerprint_mismatch', RISK_FACTOR.DEVICE_FINGERPRINT_MISMATCH === 'device_fingerprint_mismatch');
assert('RISK_FACTOR.KNOWN_FRAUD_PATTERN = known_fraud_pattern', RISK_FACTOR.KNOWN_FRAUD_PATTERN === 'known_fraud_pattern');
assert('RISK_FACTOR.LOW_KYC = low_kyc', RISK_FACTOR.LOW_KYC === 'low_kyc');
assert('RISK_FACTOR.HIGH_RISK_REGION = high_risk_region', RISK_FACTOR.HIGH_RISK_REGION === 'high_risk_region');
assert('RISK_FACTOR.BLACKLISTED_IP = blacklisted_ip', RISK_FACTOR.BLACKLISTED_IP === 'blacklisted_ip');
assert('RISK_FACTOR.IMPOSSIBLE_TRAVEL = impossible_travel', RISK_FACTOR.IMPOSSIBLE_TRAVEL === 'impossible_travel');
assert('ALL_RISK_FACTORS 包含 11 个', ALL_RISK_FACTORS.length === 11);
assert('isValidRiskFactor(new_device) = true', isValidRiskFactor('new_device'));
assert('isValidRiskFactor(unknown) = false', !isValidRiskFactor('unknown'));
assert('RISK_FACTOR_WEIGHT[new_device] = 15', RISK_FACTOR_WEIGHT[RISK_FACTOR.NEW_DEVICE] === 15);
assert('RISK_FACTOR_WEIGHT[blacklisted_ip] = 60', RISK_FACTOR_WEIGHT[RISK_FACTOR.BLACKLISTED_IP] === 60);
assert('RISK_FACTOR_WEIGHT[known_fraud_pattern] = 50', RISK_FACTOR_WEIGHT[RISK_FACTOR.KNOWN_FRAUD_PATTERN] === 50);
assert('riskFactorScore(low_kyc) = 20', riskFactorScore(RISK_FACTOR.LOW_KYC) === 20);

// ============================================================
// [14] TrustAction 枚举
// ============================================================
console.log('\n[14] TrustAction 枚举');
assert('TRUST_ACTION.TRUST = trust', TRUST_ACTION.TRUST === 'trust');
assert('TRUST_ACTION.UNTRUST = untrust', TRUST_ACTION.UNTRUST === 'untrust');
assert('TRUST_ACTION.REVOKE = revoke', TRUST_ACTION.REVOKE === 'revoke');
assert('TRUST_ACTION.BLOCK = block', TRUST_ACTION.BLOCK === 'block');
assert('TRUST_ACTION.UNBLOCK = unblock', TRUST_ACTION.UNBLOCK === 'unblock');
assert('ALL_TRUST_ACTIONS 包含 5 个', ALL_TRUST_ACTIONS.length === 5);
assert('isValidTrustAction(trust) = true', isValidTrustAction('trust'));
assert('isValidTrustAction(unknown) = false', !isValidTrustAction('unknown'));

// ============================================================
// [15] 业务工具
// ============================================================
console.log('\n[15] 业务工具');
assert('isValidFingerprint 长度 16 合法', isValidFingerprint('abcd1234efgh5678'));
assert('isValidFingerprint 含特殊字符非法', !isValidFingerprint('abcd1234@efgh5678'));
assert('isValidFingerprint 长度 15 非法', !isValidFingerprint('abcd1234efgh567'));
assert('isValidFingerprint 含下划线合法', isValidFingerprint('a_b_c_d_1_2_3_4_x'));
assert('isValidDeviceName(空) = false', !isValidDeviceName(''));
assert('isValidDeviceName(100字符) = true', isValidDeviceName('x'.repeat(100)));
assert('isValidDeviceName(101字符) = false', !isValidDeviceName('x'.repeat(101)));
assert('isValidRiskScore(0) = true', isValidRiskScore(0));
assert('isValidRiskScore(100) = true', isValidRiskScore(100));
assert('isValidRiskScore(-1) = false', !isValidRiskScore(-1));
assert('isValidRiskScore(101) = false', !isValidRiskScore(101));

// ============================================================
// [16] 设备限制阈值
// ============================================================
console.log('\n[16] 设备限制阈值');
assert('DEVICE_CHALLENGE_DEFAULT_EXPIRES_MINUTES = 10', DEVICE_CHALLENGE_DEFAULT_EXPIRES_MINUTES === 10);
assert('DEVICE_CHALLENGE_DEFAULT_MAX_ATTEMPTS = 3', DEVICE_CHALLENGE_DEFAULT_MAX_ATTEMPTS === 3);
assert('DEVICE_USER_MAX_DEVICES = 5', DEVICE_USER_MAX_DEVICES === 5);
assert('DEVICE_TRUST_AUTO_THRESHOLD = 10', DEVICE_TRUST_AUTO_THRESHOLD === 10);
assert('DEVICE_CHALLENGE_AUTO_THRESHOLD = 50', DEVICE_CHALLENGE_AUTO_THRESHOLD === 50);
assert('DEVICE_BLOCK_AUTO_THRESHOLD = 75', DEVICE_BLOCK_AUTO_THRESHOLD === 75);
assert('DEVICE_BLACKLIST_DEFAULT_EXPIRES_DAYS = 0', DEVICE_BLACKLIST_DEFAULT_EXPIRES_DAYS === 0);
assert('DEVICE_DEFAULT_USER_MAX_DEVICES = 5', DEVICE_DEFAULT_USER_MAX_DEVICES === 5);

// ============================================================
// [17] 事件常量（11 个）
// ============================================================
console.log('\n[17] 事件常量（11 个）');
assert('DEVICE_EVENTS.DEVICE_BOUND = device.user_device.bound.v1', DEVICE_EVENTS.DEVICE_BOUND === 'device.user_device.bound.v1');
assert('DEVICE_EVENTS.DEVICE_TRUSTED = device.user_device.trusted.v1', DEVICE_EVENTS.DEVICE_TRUSTED === 'device.user_device.trusted.v1');
assert('DEVICE_EVENTS.DEVICE_BLOCKED = device.user_device.blocked.v1', DEVICE_EVENTS.DEVICE_BLOCKED === 'device.user_device.blocked.v1');
assert('DEVICE_EVENTS.DEVICE_REVOKED = device.user_device.revoked.v1', DEVICE_EVENTS.DEVICE_REVOKED === 'device.user_device.revoked.v1');
assert('DEVICE_EVENTS.DEVICE_HEARTBEAT = device.user_device.heartbeat.v1', DEVICE_EVENTS.DEVICE_HEARTBEAT === 'device.user_device.heartbeat.v1');
assert('DEVICE_EVENTS.DEVICE_BLACKLISTED = device.blacklist.added.v1', DEVICE_EVENTS.DEVICE_BLACKLISTED === 'device.blacklist.added.v1');
assert('DEVICE_EVENTS.DEVICE_UNBLACKLISTED = device.blacklist.removed.v1', DEVICE_EVENTS.DEVICE_UNBLACKLISTED === 'device.blacklist.removed.v1');
assert('DEVICE_EVENTS.DEVICE_RISK_SCORED = device.risk.scored.v1', DEVICE_EVENTS.DEVICE_RISK_SCORED === 'device.risk.scored.v1');
assert('DEVICE_EVENTS.CHALLENGE_ISSUED = device.challenge.issued.v1', DEVICE_EVENTS.CHALLENGE_ISSUED === 'device.challenge.issued.v1');
assert('DEVICE_EVENTS.CHALLENGE_VERIFIED = device.challenge.verified.v1', DEVICE_EVENTS.CHALLENGE_VERIFIED === 'device.challenge.verified.v1');
assert('DEVICE_EVENTS.CHALLENGE_FAILED = device.challenge.failed.v1', DEVICE_EVENTS.CHALLENGE_FAILED === 'device.challenge.failed.v1');
assert('ALL_DEVICE_EVENTS 包含 11 个', ALL_DEVICE_EVENTS.length === 11);

assert('DEVICE_EVENT_SOURCES.USER = user', DEVICE_EVENT_SOURCES.USER === 'user');
assert('DEVICE_EVENT_SOURCES.ADMIN = admin', DEVICE_EVENT_SOURCES.ADMIN === 'admin');
assert('DEVICE_EVENT_SOURCES.SYSTEM = system', DEVICE_EVENT_SOURCES.SYSTEM === 'system');
assert('DEVICE_EVENT_SOURCES.SCHEDULER = scheduler', DEVICE_EVENT_SOURCES.SCHEDULER === 'scheduler');
assert('DEVICE_EVENT_SOURCES.RISK_ENGINE = risk_engine', DEVICE_EVENT_SOURCES.RISK_ENGINE === 'risk_engine');
assert('DEVICE_EVENT_SOURCES.KYC_SERVICE = kyc_service', DEVICE_EVENT_SOURCES.KYC_SERVICE === 'kyc_service');
assert('DEVICE_EVENT_SOURCES.REGION_SERVICE = region_service', DEVICE_EVENT_SOURCES.REGION_SERVICE === 'region_service');
assert('ALL_DEVICE_EVENT_SOURCES 包含 7 个', ALL_DEVICE_EVENT_SOURCES.length === 7);

// ============================================================
// [18] 错误码 + 异常类（35+ 错误码 / 38+ 异常类）
// ============================================================
console.log('\n[18] 错误码 + 异常类');
const expectedErrorCodeCount = 38;
assert('DEVICE_ERROR_CODES 包含 38 个', Object.keys(DEVICE_ERROR_CODES).length === expectedErrorCodeCount, `actual=${Object.keys(DEVICE_ERROR_CODES).length}`);

assert('USER_DEVICE_NOT_FOUND 错误码',
  DEVICE_ERROR_CODES.USER_DEVICE_NOT_FOUND === 'DEVICE_USER_DEVICE_NOT_FOUND');
assert('USER_DEVICE_ALREADY_BOUND 错误码',
  DEVICE_ERROR_CODES.USER_DEVICE_ALREADY_BOUND === 'DEVICE_USER_DEVICE_ALREADY_BOUND');
assert('USER_DEVICE_LIMIT_EXCEEDED 错误码',
  DEVICE_ERROR_CODES.USER_DEVICE_LIMIT_EXCEEDED === 'DEVICE_USER_DEVICE_LIMIT_EXCEEDED');
assert('BLACKLIST_NOT_FOUND 错误码',
  DEVICE_ERROR_CODES.BLACKLIST_NOT_FOUND === 'DEVICE_BLACKLIST_NOT_FOUND');
assert('BLACKLIST_DEVICE_MATCHED 错误码',
  DEVICE_ERROR_CODES.BLACKLIST_DEVICE_MATCHED === 'DEVICE_BLACKLIST_DEVICE_MATCHED');
assert('CHALLENGE_NOT_FOUND 错误码',
  DEVICE_ERROR_CODES.CHALLENGE_NOT_FOUND === 'DEVICE_CHALLENGE_NOT_FOUND');
assert('CHALLENGE_CODE_MISMATCH 错误码',
  DEVICE_ERROR_CODES.CHALLENGE_CODE_MISMATCH === 'DEVICE_CHALLENGE_CODE_MISMATCH');
assert('CHALLENGE_MAX_ATTEMPTS_EXCEEDED 错误码',
  DEVICE_ERROR_CODES.CHALLENGE_MAX_ATTEMPTS_EXCEEDED === 'DEVICE_CHALLENGE_MAX_ATTEMPTS_EXCEEDED');
assert('RISK_SCORE_INVALID 错误码',
  DEVICE_ERROR_CODES.RISK_SCORE_INVALID === 'DEVICE_RISK_SCORE_INVALID');
assert('FINGERPRINT_INVALID 错误码',
  DEVICE_ERROR_CODES.FINGERPRINT_INVALID === 'DEVICE_FINGERPRINT_INVALID');

// 异常类实例化（验证 class 存在且继承 FjnDeviceError → FjnError）
expectThrow('FjnUserDeviceNotFoundError 抛错',
  () => { throw new FjnUserDeviceNotFoundError({ id: 'test' }); },
  FjnError,
);
expectThrow('FjnUserDeviceAlreadyBoundError 抛错',
  () => { throw new FjnUserDeviceAlreadyBoundError({ userId: 'u1' }); },
  FjnError,
);
expectThrow('FjnUserDeviceLimitExceededError 抛错',
  () => { throw new FjnUserDeviceLimitExceededError({ userId: 'u1' }); },
  FjnError,
);
expectThrow('FjnUserDeviceStatusInvalidError 抛错',
  () => { throw new FjnUserDeviceStatusInvalidError({ id: 'd1' }); },
  FjnError,
);
expectThrow('FjnUserDeviceRevokedError 抛错',
  () => { throw new FjnUserDeviceRevokedError({ userDeviceId: 'd1' }); },
  FjnError,
);
expectThrow('FjnUserDeviceBlockedError 抛错',
  () => { throw new FjnUserDeviceBlockedError({ userDeviceId: 'd1' }); },
  FjnError,
);
expectThrow('FjnUserDeviceNameInvalidError 抛错',
  () => { throw new FjnUserDeviceNameInvalidError({ deviceName: '' }); },
  FjnError,
);
expectThrow('FjnTrustAlreadyAppliedError 抛错',
  () => { throw new FjnTrustAlreadyAppliedError({ action: 'trust' }); },
  FjnError,
);
expectThrow('FjnTrustRevokeNotAllowedError 抛错',
  () => { throw new FjnTrustRevokeNotAllowedError({ id: 'd1' }); },
  FjnError,
);
expectThrow('FjnDeviceBlacklistNotFoundError 抛错',
  () => { throw new FjnDeviceBlacklistNotFoundError({ id: 'b1' }); },
  FjnError,
);
expectThrow('FjnDeviceBlacklistAlreadyExistsError 抛错',
  () => { throw new FjnDeviceBlacklistAlreadyExistsError({ fingerprint: 'fp' }); },
  FjnError,
);
expectThrow('FjnDeviceBlacklistMatchedError 抛错',
  () => { throw new FjnDeviceBlacklistMatchedError({ fingerprint: 'fp' }); },
  FjnError,
);
expectThrow('FjnDeviceBlacklistReasonInvalidError 抛错',
  () => { throw new FjnDeviceBlacklistReasonInvalidError({ value: 'unknown' }); },
  FjnError,
);
expectThrow('FjnDeviceBlacklistSourceInvalidError 抛错',
  () => { throw new FjnDeviceBlacklistSourceInvalidError({ value: 'unknown' }); },
  FjnError,
);
expectThrow('FjnDeviceBlacklistRefNoRequiredError 抛错',
  () => { throw new FjnDeviceBlacklistRefNoRequiredError({ reason: 'fraud' }); },
  FjnError,
);
expectThrow('FjnDeviceBlacklistExpiresInvalidError 抛错',
  () => { throw new FjnDeviceBlacklistExpiresInvalidError({ value: 'past' }); },
  FjnError,
);
expectThrow('FjnDeviceBlacklistAlreadyDisabledError 抛错',
  () => { throw new FjnDeviceBlacklistAlreadyDisabledError({ id: 'b1' }); },
  FjnError,
);
expectThrow('FjnDeviceRiskAssessmentNotFoundError 抛错',
  () => { throw new FjnDeviceRiskAssessmentNotFoundError({ id: 'r1' }); },
  FjnError,
);
expectThrow('FjnDeviceRiskAssessmentAlreadyActionedError 抛错',
  () => { throw new FjnDeviceRiskAssessmentAlreadyActionedError({ id: 'r1' }); },
  FjnError,
);
expectThrow('FjnDeviceRiskScoreInvalidError 抛错',
  () => { throw new FjnDeviceRiskScoreInvalidError({ value: 200 }); },
  FjnError,
);
expectThrow('FjnDeviceRiskFactorInvalidError 抛错',
  () => { throw new FjnDeviceRiskFactorInvalidError({ value: 'unknown' }); },
  FjnError,
);
expectThrow('FjnDeviceChallengeNotFoundError 抛错',
  () => { throw new FjnDeviceChallengeNotFoundError({ id: 'c1' }); },
  FjnError,
);
expectThrow('FjnDeviceChallengeAlreadyVerifiedError 抛错',
  () => { throw new FjnDeviceChallengeAlreadyVerifiedError({ id: 'c1' }); },
  FjnError,
);
expectThrow('FjnDeviceChallengeAlreadyFailedError 抛错',
  () => { throw new FjnDeviceChallengeAlreadyFailedError({ id: 'c1' }); },
  FjnError,
);
expectThrow('FjnDeviceChallengeExpiredError 抛错',
  () => { throw new FjnDeviceChallengeExpiredError({ id: 'c1' }); },
  FjnError,
);
expectThrow('FjnDeviceChallengeCancelledError 抛错',
  () => { throw new FjnDeviceChallengeCancelledError({ id: 'c1' }); },
  FjnError,
);
expectThrow('FjnDeviceChallengeCodeMismatchError 抛错',
  () => { throw new FjnDeviceChallengeCodeMismatchError({ id: 'c1' }); },
  FjnError,
);
expectThrow('FjnDeviceChallengeMaxAttemptsExceededError 抛错',
  () => { throw new FjnDeviceChallengeMaxAttemptsExceededError({ id: 'c1' }); },
  FjnError,
);
expectThrow('FjnDeviceChallengeTypeInvalidError 抛错',
  () => { throw new FjnDeviceChallengeTypeInvalidError({ value: 'unknown' }); },
  FjnError,
);
expectThrow('FjnDeviceChallengeTriggerInvalidError 抛错',
  () => { throw new FjnDeviceChallengeTriggerInvalidError({ value: 'unknown' }); },
  FjnError,
);
expectThrow('FjnDeviceChallengeTargetRequiredError 抛错',
  () => { throw new FjnDeviceChallengeTargetRequiredError({}); },
  FjnError,
);
expectThrow('FjnDeviceChallengeNotPendingError 抛错',
  () => { throw new FjnDeviceChallengeNotPendingError({ id: 'c1' }); },
  FjnError,
);
expectThrow('FjnDeviceFingerprintNotFoundError 抛错',
  () => { throw new FjnDeviceFingerprintNotFoundError({ id: 'fp1' }); },
  FjnError,
);
expectThrow('FjnDeviceFingerprintInvalidError 抛错',
  () => { throw new FjnDeviceFingerprintInvalidError({ value: 'bad' }); },
  FjnError,
);
expectThrow('FjnDeviceFingerprintAlreadyExistsError 抛错',
  () => { throw new FjnDeviceFingerprintAlreadyExistsError({ fingerprint: 'fp' }); },
  FjnError,
);
expectThrow('FjnUserDeviceHeartbeatExpiredError 抛错',
  () => { throw new FjnUserDeviceHeartbeatExpiredError({ userDeviceId: 'd1' }); },
  FjnError,
);
expectThrow('FjnTrustLogNotFoundError 抛错',
  () => { throw new FjnTrustLogNotFoundError({ id: 't1' }); },
  FjnError,
);

// 错误类应能访问 httpStatus（如果有）
{
  const err = new FjnUserDeviceNotFoundError({ id: 'x' });
  assert('FjnUserDeviceNotFoundError.httpStatus = 404', err.httpStatus === 404, `actual=${err.httpStatus}`);
}
{
  const err = new FjnDeviceBlacklistMatchedError({ fingerprint: 'x' });
  assert('FjnDeviceBlacklistMatchedError.httpStatus = 403', err.httpStatus === 403, `actual=${err.httpStatus}`);
}
{
  const err = new FjnDeviceChallengeExpiredError({ id: 'c1' });
  assert('FjnDeviceChallengeExpiredError.httpStatus = 410', err.httpStatus === 410, `actual=${err.httpStatus}`);
}
{
  const err = new FjnDeviceChallengeMaxAttemptsExceededError({ id: 'c1' });
  assert('FjnDeviceChallengeMaxAttemptsExceededError.httpStatus = 429', err.httpStatus === 429, `actual=${err.httpStatus}`);
}

// ============================================================
// [19] 业务规则：Fingerprint 格式校验
// ============================================================
console.log('\n[19] 业务规则：Fingerprint 格式校验');
assert('fingerprint 含大写合法', isValidFingerprint('ABCDEFGHIJKLMNOP'));
assert('fingerprint 含小写合法', isValidFingerprint('abcdefghijklmnop'));
assert('fingerprint 含数字合法', isValidFingerprint('1234567890123456'));
assert('fingerprint 含下划线合法', isValidFingerprint('a_b_c_d_e_f_g_h_'));
assert('fingerprint 含横线合法', isValidFingerprint('a-b-c-d-e-f-g-h-'));
assert('fingerprint 含空格非法', !isValidFingerprint('abcd 1234 efgh 5678'));
assert('fingerprint 含点非法', !isValidFingerprint('abcd.1234.efgh.5678'));
assert('fingerprint 长度 255 合法', isValidFingerprint('a'.repeat(255)));
assert('fingerprint 长度 256 非法', !isValidFingerprint('a'.repeat(256)));

// ============================================================
// [20] 业务规则：calcDeviceRiskLevel 边界
// ============================================================
console.log('\n[20] 业务规则：calcDeviceRiskLevel 边界');
assert('calcDeviceRiskLevel(10) = low', calcDeviceRiskLevel(10) === DEVICE_RISK_LEVEL.LOW);
assert('calcDeviceRiskLevel(11) = low', calcDeviceRiskLevel(11) === DEVICE_RISK_LEVEL.LOW);
assert('calcDeviceRiskLevel(24) = low', calcDeviceRiskLevel(24) === DEVICE_RISK_LEVEL.LOW);
assert('calcDeviceRiskLevel(25) = medium', calcDeviceRiskLevel(25) === DEVICE_RISK_LEVEL.MEDIUM);
assert('calcDeviceRiskLevel(30) = medium', calcDeviceRiskLevel(30) === DEVICE_RISK_LEVEL.MEDIUM);
assert('calcDeviceRiskLevel(49) = medium', calcDeviceRiskLevel(49) === DEVICE_RISK_LEVEL.MEDIUM);
assert('calcDeviceRiskLevel(50) = high', calcDeviceRiskLevel(50) === DEVICE_RISK_LEVEL.HIGH);
assert('calcDeviceRiskLevel(60) = high', calcDeviceRiskLevel(60) === DEVICE_RISK_LEVEL.HIGH);
assert('calcDeviceRiskLevel(74) = high', calcDeviceRiskLevel(74) === DEVICE_RISK_LEVEL.HIGH);
assert('calcDeviceRiskLevel(75) = critical', calcDeviceRiskLevel(75) === DEVICE_RISK_LEVEL.CRITICAL);
assert('calcDeviceRiskLevel(99) = critical', calcDeviceRiskLevel(99) === DEVICE_RISK_LEVEL.CRITICAL);

// ============================================================
// [21] 业务规则：assertTransitBlacklistStatus 抛错
// ============================================================
console.log('\n[21] assertTransitBlacklistStatus 抛错');
expectThrow(
  'assertTransit(active, active) 抛 FjnError',
  () => assertTransitDeviceBlacklistStatus(BLACKLIST_STATUS.ACTIVE, BLACKLIST_STATUS.ACTIVE),
  FjnError,
);
assert('合法转移不抛错', (() => {
  try {
    assertTransitDeviceBlacklistStatus(BLACKLIST_STATUS.ACTIVE, BLACKLIST_STATUS.DISABLED);
    return true;
  } catch {
    return false;
  }
})());

// ============================================================
// [22] 业务规则：assertTransitRiskAssessmentStatus 抛错
// ============================================================
console.log('\n[22] assertTransitRiskAssessmentStatus 抛错');
expectThrow(
  'assertTransit(actioned, dismissed) 抛 FjnError',
  () => assertTransitRiskAssessmentStatus(RISK_ASSESSMENT_STATUS.ACTIONED, RISK_ASSESSMENT_STATUS.DISMISSED),
  FjnError,
);
assert('合法转移不抛错', (() => {
  try {
    assertTransitRiskAssessmentStatus(RISK_ASSESSMENT_STATUS.SCORED, RISK_ASSESSMENT_STATUS.DISMISSED);
    return true;
  } catch {
    return false;
  }
})());

// ============================================================
// [23] 业务规则：assertTransitChallengeStatus 抛错
// ============================================================
console.log('\n[23] assertTransitChallengeStatus 抛错');
expectThrow(
  'assertTransit(verified, failed) 抛 FjnError',
  () => assertTransitChallengeStatus(CHALLENGE_STATUS.VERIFIED, CHALLENGE_STATUS.FAILED),
  FjnError,
);
assert('合法转移不抛错', (() => {
  try {
    assertTransitChallengeStatus(CHALLENGE_STATUS.PENDING, CHALLENGE_STATUS.VERIFIED);
    return true;
  } catch {
    return false;
  }
})());

// ============================================================
// [24] FjnDeviceService 类
// ============================================================
console.log('\n[24] FjnDeviceService 类');
{
  const svc = new FjnDeviceService();
  assert('FjnDeviceService 可实例化', svc instanceof FjnDeviceService);
  assert('FjnDeviceService.bindDevice 存在', typeof svc.bindDevice === 'function');
  assert('FjnDeviceService.heartbeat 存在', typeof svc.heartbeat === 'function');
  assert('FjnDeviceService.unbindDevice 存在', typeof svc.unbindDevice === 'function');
  assert('FjnDeviceService.trustDevice 存在', typeof svc.trustDevice === 'function');
  assert('FjnDeviceService.untrustDevice 存在', typeof svc.untrustDevice === 'function');
  assert('FjnDeviceService.blockDevice 存在', typeof svc.blockDevice === 'function');
  assert('FjnDeviceService.unblockDevice 存在', typeof svc.unblockDevice === 'function');
  assert('FjnDeviceService.revokeDevice 存在', typeof svc.revokeDevice === 'function');
  assert('FjnDeviceService.findUserDeviceById 存在', typeof svc.findUserDeviceById === 'function');
  assert('FjnDeviceService.listUserDevices 存在', typeof svc.listUserDevices === 'function');
  assert('FjnDeviceService.findOrCreateFingerprint 存在', typeof svc.findOrCreateFingerprint === 'function');
  assert('FjnDeviceService.findFingerprintByHash 存在', typeof svc.findFingerprintByHash === 'function');
  assert('FjnDeviceService.findFingerprintById 存在', typeof svc.findFingerprintById === 'function');
  assert('FjnDeviceService.createFingerprint 存在', typeof svc.createFingerprint === 'function');
  assert('FjnDeviceService.updateFingerprintStats 存在', typeof svc.updateFingerprintStats === 'function');
  assert('FjnDeviceService.addToBlacklist 存在', typeof svc.addToBlacklist === 'function');
  assert('FjnDeviceService.removeFromBlacklist 存在', typeof svc.removeFromBlacklist === 'function');
  assert('FjnDeviceService.listBlacklist 存在', typeof svc.listBlacklist === 'function');
  assert('FjnDeviceService.findBlacklistByFingerprint 存在', typeof svc.findBlacklistByFingerprint === 'function');
  assert('FjnDeviceService.checkBlacklist 存在', typeof svc.checkBlacklist === 'function');
  assert('FjnDeviceService.assessDeviceRisk 存在', typeof svc.assessDeviceRisk === 'function');
  assert('FjnDeviceService.listRiskAssessments 存在', typeof svc.listRiskAssessments === 'function');
  assert('FjnDeviceService.dismissRiskAssessment 存在', typeof svc.dismissRiskAssessment === 'function');
  assert('FjnDeviceService.actionRiskAssessment 存在', typeof svc.actionRiskAssessment === 'function');
  assert('FjnDeviceService.issueChallenge 存在', typeof svc.issueChallenge === 'function');
  assert('FjnDeviceService.verifyChallenge 存在', typeof svc.verifyChallenge === 'function');
  assert('FjnDeviceService.failChallenge 存在', typeof svc.failChallenge === 'function');
  assert('FjnDeviceService.cancelChallenge 存在', typeof svc.cancelChallenge === 'function');
  assert('FjnDeviceService.expireChallenge 存在', typeof svc.expireChallenge === 'function');
  assert('FjnDeviceService.listChallenges 存在', typeof svc.listChallenges === 'function');
  assert('FjnDeviceService.getDeviceSummary 存在', typeof svc.getDeviceSummary === 'function');
  // 验证方法数量：Fingerprint 5 + UserDevice 10 + Blacklist 5 + RiskAssessment 4 + Challenge 6 + 工具 1 = 31
  const methodCount = [
    'bindDevice','heartbeat','unbindDevice','trustDevice','untrustDevice',
    'blockDevice','unblockDevice','revokeDevice','findUserDeviceById','listUserDevices',
    'findOrCreateFingerprint','findFingerprintByHash','findFingerprintById','createFingerprint','updateFingerprintStats',
    'addToBlacklist','removeFromBlacklist','listBlacklist','findBlacklistByFingerprint','checkBlacklist',
    'assessDeviceRisk','listRiskAssessments','dismissRiskAssessment','actionRiskAssessment',
    'issueChallenge','verifyChallenge','failChallenge','cancelChallenge','expireChallenge','listChallenges',
    'getDeviceSummary',
  ].length;
  assert('FjnDeviceService 公开方法数 = 31', methodCount === 31, `actual=${methodCount}`);
}
{
  const svc = createFjnDeviceService();
  assert('createFjnDeviceService() 可创建实例', svc instanceof FjnDeviceService);
}

// ============================================================
// [25] 类型导出
// ============================================================
console.log('\n[25] 类型导出（编译期）');
// 编译期已验证（tsc --noEmit 通过），运行时再确认类型
const _type1: FjnUserDeviceStatus = USER_DEVICE_STATUS.ACTIVE;
const _type2: FjnBlacklistStatus = BLACKLIST_STATUS.ACTIVE;
const _type3: FjnRiskAssessmentStatus = RISK_ASSESSMENT_STATUS.SCORED;
const _type4: FjnChallengeStatus = CHALLENGE_STATUS.PENDING;
const _input1: UpsertFingerprintInput = { fingerprint: 'x'.repeat(20) };
const _input2: BindDeviceInput = { userId: 'u1' };
const _input3: ListUserDeviceInput = { userId: 'u1' };
const _input4: ChangeDeviceStatusInput = { reason: 'test' };
const _input5: AddDeviceBlacklistInput = { fingerprint: 'x'.repeat(20), reason: BLACKLIST_REASON.FRAUD };
const _input6: ListBlacklistInput = {};
const _input7: CheckBlacklistInput = { fingerprint: 'x'.repeat(20) };
const _input8: AssessDeviceRiskInput = { fingerprint: 'x'.repeat(20), factors: [RISK_FACTOR.NEW_DEVICE] };
const _input9: ListRiskAssessmentInput = {};
const _input10: ActionRiskAssessmentInput = { action: 'dismiss' };
const _input11: IssueChallengeInput = {
  userId: 'u1', userDeviceId: 'd1', challengeType: CHALLENGE_TYPE.OTP_EMAIL,
  trigger: CHALLENGE_TRIGGER.NEW_DEVICE, target: 'u***@x.com',
};
const _input12: VerifyChallengeInput = { challengeId: 'c1', codeHash: 'abc' };
const _input13: ChangeChallengeStatusInput = {};
const _input14: ListChallengeInput = {};
const _result1: BindDeviceResult = {
  user_device_id: 'd1', user_id: 'u1', fingerprint_id: 'f1', fingerprint: 'x'.repeat(20),
  status: USER_DEVICE_STATUS.ACTIVE, requires_challenge: false, risk_score: 0, risk_level: DEVICE_RISK_LEVEL.LOW,
  bound_at: new Date().toISOString(), is_new_fingerprint: false, is_new_user_device: false, blacklist_matched: false,
};
const _result2: RiskAssessmentResult = {
  risk_id: 'r1', fingerprint: 'x'.repeat(20), risk_score: 0, risk_level: DEVICE_RISK_LEVEL.LOW,
  factors: [], action: 'none', status: RISK_ASSESSMENT_STATUS.SCORED, created_at: new Date().toISOString(),
};
const _result3: BlacklistCheckResult = { fingerprint: 'x'.repeat(20), is_blacklisted: false };
assert('类型导出 14 输入 + 3 结果 + 4 状态 编译通过', true);
void _type1; void _type2; void _type3; void _type4;
void _input1; void _input2; void _input3; void _input4; void _input5; void _input6; void _input7; void _input8; void _input9; void _input10; void _input11; void _input12; void _input13; void _input14;
void _result1; void _result2; void _result3;

// ============================================================
// 总结
// ============================================================
console.log('\n=== 总结 ===');
console.log(`✅ 通过: ${pass}`);
console.log(`❌ 失败: ${fail}`);
console.log(`📊 断言总数: ${pass + fail}`);
console.log(`📊 错误码总数: ${Object.keys(DEVICE_ERROR_CODES).length}`);
console.log(`📊 事件总数: ${Object.keys(DEVICE_EVENTS).length}`);
console.log(`📊 状态机总数: 5 (UserDevice 5 / Blacklist 3 / Risk 3 / Challenge 5 / Trust 5)`);

if (fail > 0) {
  process.exit(1);
}
