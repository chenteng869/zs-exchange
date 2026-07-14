/**
 * FJN Referral Service - 错误码 + 异常类
 *
 * 严格遵循 H028 §4 + 工业级分层：
 *  - 错误码使用 SCREAMING_SNAKE_CASE
 *  - 错误码映射到对应异常类与 HTTP 状态码
 *
 * 用法：
 *   import { FjnReferralRewardNotFoundError, REFERRAL_ERROR_CODES } from './referral-errors';
 *   throw new FjnReferralRewardNotFoundError({ rewardId });
 */

import { FjnError, FjnErrorContext } from '../errors';

// ============================================================
// 1. 错误码常量
// ============================================================

export const REFERRAL_ERROR_CODES = {
  // ---------- 关系类 ----------
  BINDING_NOT_FOUND: 'REFERRAL_BINDING_NOT_FOUND',
  BINDING_INVALID: 'REFERRAL_BINDING_INVALID',
  BINDING_SELF_NOT_ALLOWED: 'REFERRAL_BINDING_SELF_NOT_ALLOWED',
  BINDING_ALREADY_EXISTS: 'REFERRAL_BINDING_ALREADY_EXISTS',

  // ---------- 奖励类 ----------
  REWARD_NOT_FOUND: 'REFERRAL_REWARD_NOT_FOUND',
  REWARD_ALREADY_EXISTS: 'REFERRAL_REWARD_ALREADY_EXISTS',
  REWARD_STATUS_INVALID: 'REFERRAL_REWARD_STATUS_INVALID',
  REWARD_TERMINAL_STATUS: 'REFERRAL_REWARD_TERMINAL_STATUS',
  REWARD_AMOUNT_INVALID: 'REFERRAL_REWARD_AMOUNT_INVALID',
  REWARD_AMOUNT_ZERO: 'REFERRAL_REWARD_AMOUNT_ZERO',
  REWARD_RATE_INVALID: 'REFERRAL_REWARD_RATE_INVALID',
  REWARD_NOT_PAYABLE: 'REFERRAL_REWARD_NOT_PAYABLE',
  REWARD_NOT_RECOVERABLE: 'REFERRAL_REWARD_NOT_RECOVERABLE',
  REWARD_NOT_APPROVABLE: 'REFERRAL_REWARD_NOT_APPROVABLE',
  REWARD_NOT_CANCELLABLE: 'REFERRAL_REWARD_NOT_CANCELLABLE',
  REWARD_LOCK_NOT_EXPIRED: 'REFERRAL_REWARD_LOCK_NOT_EXPIRED',

  // ---------- 业务关联类 ----------
  ORDER_NOT_FOUND: 'REFERRAL_ORDER_NOT_FOUND',
  ORDER_NOT_PAID: 'REFERRAL_ORDER_NOT_PAID',
  REFERRER_NOT_FOUND: 'REFERRAL_REFERRER_NOT_FOUND',
  BUYER_NOT_FOUND: 'REFERRAL_BUYER_NOT_FOUND',
  SELF_REFERRAL: 'REFERRAL_SELF_REFERRAL',

  // ---------- KYC / 风控 ----------
  KYC_NOT_VERIFIED: 'REFERRAL_KYC_NOT_VERIFIED',
  RISK_HOLD: 'REFERRAL_RISK_HOLD',
  RISK_CHECK_FAILED: 'REFERRAL_RISK_CHECK_FAILED',

  // ---------- 审批类 ----------
  APPROVAL_REQUIRED: 'REFERRAL_APPROVAL_REQUIRED',
  APPROVAL_NOT_FOUND: 'REFERRAL_APPROVAL_NOT_FOUND',
  REVIEWER_REQUIRED: 'REFERRAL_REVIEWER_REQUIRED',
  REASON_REQUIRED: 'REFERRAL_REASON_REQUIRED',

  // ---------- 参数类 ----------
  PARAM_REQUIRED: 'REFERRAL_PARAM_REQUIRED',
  PARAM_INVALID: 'REFERRAL_PARAM_INVALID',

  // ---------- 系统类 ----------
  INTERNAL: 'REFERRAL_INTERNAL',
  EXTERNAL_SERVICE_ERROR: 'REFERRAL_EXTERNAL_SERVICE_ERROR',
} as const;

export type FjnReferralErrorCode =
  (typeof REFERRAL_ERROR_CODES)[keyof typeof REFERRAL_ERROR_CODES];

// ============================================================
// 2. 异常类
// ============================================================

/** Referral 异常基类 */
export class FjnReferralError extends FjnError {
  constructor(
    code: FjnReferralErrorCode,
    message: string,
    context?: FjnErrorContext,
    httpStatus?: number
  ) {
    super({
      code: code as any,
      message,
      context,
      httpStatus: httpStatus ?? 400,
    });
    this.name = 'FjnReferralError';
  }
}

// ---------- 关系类 ----------

export class FjnReferralBindingNotFoundError extends FjnReferralError {
  constructor(message: string = '推荐关系不存在', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.BINDING_NOT_FOUND, message, context, 404);
    this.name = 'FjnReferralBindingNotFoundError';
  }
}

export class FjnReferralBindingInvalidError extends FjnReferralError {
  constructor(message: string = '推荐关系无效', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.BINDING_INVALID, message, context, 422);
    this.name = 'FjnReferralBindingInvalidError';
  }
}

export class FjnReferralSelfNotAllowedError extends FjnReferralError {
  constructor(message: string = '不能推荐自己', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.BINDING_SELF_NOT_ALLOWED, message, context, 422);
    this.name = 'FjnReferralSelfNotAllowedError';
  }
}

export class FjnReferralBindingAlreadyExistsError extends FjnReferralError {
  constructor(message: string = '推荐关系已存在', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.BINDING_ALREADY_EXISTS, message, context, 409);
    this.name = 'FjnReferralBindingAlreadyExistsError';
  }
}

// ---------- 奖励类 ----------

export class FjnReferralRewardNotFoundError extends FjnReferralError {
  constructor(message: string = '推荐奖励不存在', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.REWARD_NOT_FOUND, message, context, 404);
    this.name = 'FjnReferralRewardNotFoundError';
  }
}

export class FjnReferralRewardAlreadyExistsError extends FjnReferralError {
  constructor(message: string = '该订单已存在推荐奖励', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.REWARD_ALREADY_EXISTS, message, context, 409);
    this.name = 'FjnReferralRewardAlreadyExistsError';
  }
}

export class FjnReferralRewardStatusInvalidError extends FjnReferralError {
  constructor(message: string = '推荐奖励状态非法', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.REWARD_STATUS_INVALID, message, context, 422);
    this.name = 'FjnReferralRewardStatusInvalidError';
  }
}

export class FjnReferralRewardTerminalStatusError extends FjnReferralError {
  constructor(message: string = '推荐奖励已处于终态', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.REWARD_TERMINAL_STATUS, message, context, 422);
    this.name = 'FjnReferralRewardTerminalStatusError';
  }
}

export class FjnReferralRewardAmountInvalidError extends FjnReferralError {
  constructor(message: string = '推荐奖励金额无效', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.REWARD_AMOUNT_INVALID, message, context, 400);
    this.name = 'FjnReferralRewardAmountInvalidError';
  }
}

export class FjnReferralRewardAmountZeroError extends FjnReferralError {
  constructor(message: string = '推荐奖励金额不能为零', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.REWARD_AMOUNT_ZERO, message, context, 400);
    this.name = 'FjnReferralRewardAmountZeroError';
  }
}

export class FjnReferralRewardRateInvalidError extends FjnReferralError {
  constructor(message: string = '推荐奖励比例无效', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.REWARD_RATE_INVALID, message, context, 400);
    this.name = 'FjnReferralRewardRateInvalidError';
  }
}

export class FjnReferralRewardNotPayableError extends FjnReferralError {
  constructor(message: string = '推荐奖励当前不可支付', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.REWARD_NOT_PAYABLE, message, context, 422);
    this.name = 'FjnReferralRewardNotPayableError';
  }
}

export class FjnReferralRewardNotRecoverableError extends FjnReferralError {
  constructor(message: string = '推荐奖励当前不可追回', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.REWARD_NOT_RECOVERABLE, message, context, 422);
    this.name = 'FjnReferralRewardNotRecoverableError';
  }
}

export class FjnReferralRewardNotApprovableError extends FjnReferralError {
  constructor(message: string = '推荐奖励当前不可审核', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.REWARD_NOT_APPROVABLE, message, context, 422);
    this.name = 'FjnReferralRewardNotApprovableError';
  }
}

export class FjnReferralRewardLockNotExpiredError extends FjnReferralError {
  constructor(message: string = '锁定期未满', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.REWARD_LOCK_NOT_EXPIRED, message, context, 422);
    this.name = 'FjnReferralRewardLockNotExpiredError';
  }
}

// ---------- 业务关联类 ----------

export class FjnReferralOrderNotFoundError extends FjnReferralError {
  constructor(message: string = '订单不存在', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.ORDER_NOT_FOUND, message, context, 404);
    this.name = 'FjnReferralOrderNotFoundError';
  }
}

export class FjnReferralOrderNotPaidError extends FjnReferralError {
  constructor(message: string = '订单未支付', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.ORDER_NOT_PAID, message, context, 422);
    this.name = 'FjnReferralOrderNotPaidError';
  }
}

// ---------- KYC / 风控 ----------

export class FjnReferralKycNotVerifiedError extends FjnReferralError {
  constructor(message: string = 'KYC 未认证', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.KYC_NOT_VERIFIED, message, context, 422);
    this.name = 'FjnReferralKycNotVerifiedError';
  }
}

export class FjnReferralRiskHoldError extends FjnReferralError {
  constructor(message: string = '风控冻结中', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.RISK_HOLD, message, context, 422);
    this.name = 'FjnReferralRiskHoldError';
  }
}

// ---------- 审批类 ----------

export class FjnReferralApprovalRequiredError extends FjnReferralError {
  constructor(message: string = '需要审批', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.APPROVAL_REQUIRED, message, context, 422);
    this.name = 'FjnReferralApprovalRequiredError';
  }
}

export class FjnReferralReviewerRequiredError extends FjnReferralError {
  constructor(message: string = '审核人必填', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.REVIEWER_REQUIRED, message, context, 400);
    this.name = 'FjnReferralReviewerRequiredError';
  }
}

export class FjnReferralReasonRequiredError extends FjnReferralError {
  constructor(message: string = '原因必填', context?: FjnErrorContext) {
    super(REFERRAL_ERROR_CODES.REASON_REQUIRED, message, context, 400);
    this.name = 'FjnReferralReasonRequiredError';
  }
}

// ============================================================
// 3. 工具函数
// ============================================================

export function isFjnReferralErrorCode(code: string): code is FjnReferralErrorCode {
  return Object.values(REFERRAL_ERROR_CODES).includes(code as FjnReferralErrorCode);
}

export function getReferralErrorCodeCount(): number {
  return Object.keys(REFERRAL_ERROR_CODES).length;
}
