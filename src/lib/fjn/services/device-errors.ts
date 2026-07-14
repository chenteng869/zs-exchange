/**
 * FJN Device Service - 错误码 + 异常类
 *
 * 严格遵循工业级分层（参考 H018 §4）：
 *  - 错误码使用 SCREAMING_SNAKE_CASE
 *  - 错误码映射到对应异常类与 HTTP 状态码
 *
 * 用法：
 *   import { FjnUserDeviceNotFoundError, DEVICE_ERROR_CODES } from './device-errors';
 *   throw new FjnUserDeviceNotFoundError({ userDeviceId });
 */

import { FjnError, FjnErrorContext } from '../errors';

// ============================================================
// 1. 错误码常量
// ============================================================

export const DEVICE_ERROR_CODES = {
  // ---------- UserDevice ----------
  USER_DEVICE_NOT_FOUND: 'DEVICE_USER_DEVICE_NOT_FOUND',
  USER_DEVICE_ALREADY_BOUND: 'DEVICE_USER_DEVICE_ALREADY_BOUND',
  USER_DEVICE_LIMIT_EXCEEDED: 'DEVICE_USER_DEVICE_LIMIT_EXCEEDED',
  USER_DEVICE_STATUS_INVALID: 'DEVICE_USER_DEVICE_STATUS_INVALID',
  USER_DEVICE_REVOKED: 'DEVICE_USER_DEVICE_REVOKED',
  USER_DEVICE_BLOCKED: 'DEVICE_USER_DEVICE_BLOCKED',
  USER_DEVICE_HEARTBEAT_EXPIRED: 'DEVICE_USER_DEVICE_HEARTBEAT_EXPIRED',
  USER_DEVICE_NAME_INVALID: 'DEVICE_USER_DEVICE_NAME_INVALID',

  // ---------- Trust ----------
  TRUST_LOG_NOT_FOUND: 'DEVICE_TRUST_LOG_NOT_FOUND',
  TRUST_ALREADY_APPLIED: 'DEVICE_TRUST_ALREADY_APPLIED',
  TRUST_REVOKE_NOT_ALLOWED: 'DEVICE_TRUST_REVOKE_NOT_ALLOWED',

  // ---------- Blacklist ----------
  BLACKLIST_NOT_FOUND: 'DEVICE_BLACKLIST_NOT_FOUND',
  BLACKLIST_ALREADY_EXISTS: 'DEVICE_BLACKLIST_ALREADY_EXISTS',
  BLACKLIST_DEVICE_MATCHED: 'DEVICE_BLACKLIST_DEVICE_MATCHED',
  BLACKLIST_REASON_INVALID: 'DEVICE_BLACKLIST_REASON_INVALID',
  BLACKLIST_SOURCE_INVALID: 'DEVICE_BLACKLIST_SOURCE_INVALID',
  BLACKLIST_REFNO_REQUIRED: 'DEVICE_BLACKLIST_REFNO_REQUIRED',
  BLACKLIST_EXPIRES_INVALID: 'DEVICE_BLACKLIST_EXPIRES_INVALID',
  BLACKLIST_ALREADY_DISABLED: 'DEVICE_BLACKLIST_ALREADY_DISABLED',

  // ---------- RiskAssessment ----------
  RISK_ASSESSMENT_NOT_FOUND: 'DEVICE_RISK_ASSESSMENT_NOT_FOUND',
  RISK_ASSESSMENT_ALREADY_ACTIONED: 'DEVICE_RISK_ASSESSMENT_ALREADY_ACTIONED',
  RISK_SCORE_INVALID: 'DEVICE_RISK_SCORE_INVALID',
  RISK_FACTOR_INVALID: 'DEVICE_RISK_FACTOR_INVALID',

  // ---------- Challenge ----------
  CHALLENGE_NOT_FOUND: 'DEVICE_CHALLENGE_NOT_FOUND',
  CHALLENGE_ALREADY_VERIFIED: 'DEVICE_CHALLENGE_ALREADY_VERIFIED',
  CHALLENGE_ALREADY_FAILED: 'DEVICE_CHALLENGE_ALREADY_FAILED',
  CHALLENGE_EXPIRED: 'DEVICE_CHALLENGE_EXPIRED',
  CHALLENGE_CANCELLED: 'DEVICE_CHALLENGE_CANCELLED',
  CHALLENGE_CODE_MISMATCH: 'DEVICE_CHALLENGE_CODE_MISMATCH',
  CHALLENGE_MAX_ATTEMPTS_EXCEEDED: 'DEVICE_CHALLENGE_MAX_ATTEMPTS_EXCEEDED',
  CHALLENGE_TYPE_INVALID: 'DEVICE_CHALLENGE_TYPE_INVALID',
  CHALLENGE_TRIGGER_INVALID: 'DEVICE_CHALLENGE_TRIGGER_INVALID',
  CHALLENGE_TARGET_REQUIRED: 'DEVICE_CHALLENGE_TARGET_REQUIRED',
  CHALLENGE_NOT_PENDING: 'DEVICE_CHALLENGE_NOT_PENDING',

  // ---------- Fingerprint ----------
  FINGERPRINT_NOT_FOUND: 'DEVICE_FINGERPRINT_NOT_FOUND',
  FINGERPRINT_INVALID: 'DEVICE_FINGERPRINT_INVALID',
  FINGERPRINT_ALREADY_EXISTS: 'DEVICE_FINGERPRINT_ALREADY_EXISTS',

  // ---------- 系统类 ----------
  INTERNAL: 'DEVICE_INTERNAL',
} as const;

export type FjnDeviceErrorCode =
  (typeof DEVICE_ERROR_CODES)[keyof typeof DEVICE_ERROR_CODES];

// ============================================================
// 2. 异常类
// ============================================================

/** Device 异常基类 */
export class FjnDeviceError extends FjnError {
  constructor(
    code: FjnDeviceErrorCode,
    message: string,
    context?: FjnErrorContext,
    httpStatus?: number,
  ) {
    super({
      code: code as any,
      message,
      context,
      httpStatus,
    });
    this.name = 'FjnDeviceError';
  }
}

// ---------- UserDevice 异常 ----------

export class FjnUserDeviceNotFoundError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.USER_DEVICE_NOT_FOUND,
      'UserDevice 绑定不存在',
      context,
      404,
    );
  }
}

export class FjnUserDeviceAlreadyBoundError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.USER_DEVICE_ALREADY_BOUND,
      '该设备已绑定到此用户',
      context,
      409,
    );
  }
}

export class FjnUserDeviceLimitExceededError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.USER_DEVICE_LIMIT_EXCEEDED,
      '用户已绑定设备数达到上限',
      context,
      409,
    );
  }
}

export class FjnUserDeviceStatusInvalidError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.USER_DEVICE_STATUS_INVALID,
      'UserDevice 状态非法',
      context,
      400,
    );
  }
}

export class FjnUserDeviceRevokedError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.USER_DEVICE_REVOKED,
      'UserDevice 已吊销',
      context,
      403,
    );
  }
}

export class FjnUserDeviceBlockedError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.USER_DEVICE_BLOCKED,
      'UserDevice 已锁定',
      context,
      403,
    );
  }
}

export class FjnUserDeviceHeartbeatExpiredError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.USER_DEVICE_HEARTBEAT_EXPIRED,
      'UserDevice 心跳已过期（长时间未活跃）',
      context,
      403,
    );
  }
}

export class FjnUserDeviceNameInvalidError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.USER_DEVICE_NAME_INVALID,
      '设备名格式非法（1-100 字符）',
      context,
      400,
    );
  }
}

// ---------- Trust 异常 ----------

export class FjnTrustLogNotFoundError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.TRUST_LOG_NOT_FOUND,
      'TrustLog 不存在',
      context,
      404,
    );
  }
}

export class FjnTrustAlreadyAppliedError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.TRUST_ALREADY_APPLIED,
      '当前状态下 Trust 行动已应用',
      context,
      409,
    );
  }
}

export class FjnTrustRevokeNotAllowedError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.TRUST_REVOKE_NOT_ALLOWED,
      '当前状态不允许 revoke（须先 untrust）',
      context,
      409,
    );
  }
}

// ---------- Blacklist 异常 ----------

export class FjnDeviceBlacklistNotFoundError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.BLACKLIST_NOT_FOUND,
      'Blacklist 记录不存在',
      context,
      404,
    );
  }
}

export class FjnDeviceBlacklistAlreadyExistsError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.BLACKLIST_ALREADY_EXISTS,
      '该设备已在黑名单中',
      context,
      409,
    );
  }
}

export class FjnDeviceBlacklistMatchedError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.BLACKLIST_DEVICE_MATCHED,
      '设备已列入黑名单，操作被拒绝',
      context,
      403,
    );
  }
}

export class FjnDeviceBlacklistReasonInvalidError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.BLACKLIST_REASON_INVALID,
      'Blacklist 原因非法',
      context,
      400,
    );
  }
}

export class FjnDeviceBlacklistSourceInvalidError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.BLACKLIST_SOURCE_INVALID,
      'Blacklist 来源非法',
      context,
      400,
    );
  }
}

export class FjnDeviceBlacklistRefNoRequiredError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.BLACKLIST_REFNO_REQUIRED,
      'Fraud/Sanctions 类型必须提供 refNo（合规文号/制裁清单号）',
      context,
      400,
    );
  }
}

export class FjnDeviceBlacklistExpiresInvalidError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.BLACKLIST_EXPIRES_INVALID,
      'Blacklist 过期时间非法（必须晚于当前时刻）',
      context,
      400,
    );
  }
}

export class FjnDeviceBlacklistAlreadyDisabledError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.BLACKLIST_ALREADY_DISABLED,
      'Blacklist 已停用',
      context,
      409,
    );
  }
}

// ---------- RiskAssessment 异常 ----------

export class FjnDeviceRiskAssessmentNotFoundError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.RISK_ASSESSMENT_NOT_FOUND,
      'RiskAssessment 不存在',
      context,
      404,
    );
  }
}

export class FjnDeviceRiskAssessmentAlreadyActionedError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.RISK_ASSESSMENT_ALREADY_ACTIONED,
      'RiskAssessment 已处置',
      context,
      409,
    );
  }
}

export class FjnDeviceRiskScoreInvalidError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.RISK_SCORE_INVALID,
      '风险分数非法（0-100）',
      context,
      400,
    );
  }
}

export class FjnDeviceRiskFactorInvalidError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.RISK_FACTOR_INVALID,
      '风险因子非法',
      context,
      400,
    );
  }
}

// ---------- Challenge 异常 ----------

export class FjnDeviceChallengeNotFoundError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.CHALLENGE_NOT_FOUND,
      'Challenge 不存在',
      context,
      404,
    );
  }
}

export class FjnDeviceChallengeAlreadyVerifiedError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.CHALLENGE_ALREADY_VERIFIED,
      'Challenge 已通过',
      context,
      409,
    );
  }
}

export class FjnDeviceChallengeAlreadyFailedError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.CHALLENGE_ALREADY_FAILED,
      'Challenge 已失败',
      context,
      409,
    );
  }
}

export class FjnDeviceChallengeExpiredError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.CHALLENGE_EXPIRED,
      'Challenge 已过期',
      context,
      410,
    );
  }
}

export class FjnDeviceChallengeCancelledError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.CHALLENGE_CANCELLED,
      'Challenge 已取消',
      context,
      410,
    );
  }
}

export class FjnDeviceChallengeCodeMismatchError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.CHALLENGE_CODE_MISMATCH,
      '验证码错误',
      context,
      400,
    );
  }
}

export class FjnDeviceChallengeMaxAttemptsExceededError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.CHALLENGE_MAX_ATTEMPTS_EXCEEDED,
      'Challenge 达到最大尝试次数',
      context,
      429,
    );
  }
}

export class FjnDeviceChallengeTypeInvalidError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.CHALLENGE_TYPE_INVALID,
      'Challenge 类型非法',
      context,
      400,
    );
  }
}

export class FjnDeviceChallengeTriggerInvalidError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.CHALLENGE_TRIGGER_INVALID,
      'Challenge 触发原因非法',
      context,
      400,
    );
  }
}

export class FjnDeviceChallengeTargetRequiredError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.CHALLENGE_TARGET_REQUIRED,
      'Challenge 接收方必填（email/phone）',
      context,
      400,
    );
  }
}

export class FjnDeviceChallengeNotPendingError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.CHALLENGE_NOT_PENDING,
      'Challenge 不在 pending 状态',
      context,
      409,
    );
  }
}

// ---------- Fingerprint 异常 ----------

export class FjnDeviceFingerprintNotFoundError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.FINGERPRINT_NOT_FOUND,
      'DeviceFingerprint 不存在',
      context,
      404,
    );
  }
}

export class FjnDeviceFingerprintInvalidError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.FINGERPRINT_INVALID,
      'Fingerprint 格式非法（16-255 字符，字母数字_-）',
      context,
      400,
    );
  }
}

export class FjnDeviceFingerprintAlreadyExistsError extends FjnDeviceError {
  constructor(context?: FjnErrorContext) {
    super(
      DEVICE_ERROR_CODES.FINGERPRINT_ALREADY_EXISTS,
      'Fingerprint 已存在',
      context,
      409,
    );
  }
}
