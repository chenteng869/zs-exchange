/**
 * FJN Team Service - 错误码 + 异常类
 *
 * 严格遵循 H029 §4 + 工业级分层：
 *  - 错误码使用 SCREAMING_SNAKE_CASE
 *  - 错误码映射到对应异常类与 HTTP 状态码
 *
 * 用法：
 *   import { FjnTeamRewardNotFoundError, TEAM_ERROR_CODES } from './team-errors';
 *   throw new FjnTeamRewardNotFoundError({ rewardId });
 */

import { FjnError, FjnErrorContext } from '../errors';

// ============================================================
// 1. 错误码常量
// ============================================================

export const TEAM_ERROR_CODES = {
  // ---------- 团队结构类 ----------
  STRUCTURE_NOT_FOUND: 'TEAM_STRUCTURE_NOT_FOUND',
  STRUCTURE_ALREADY_EXISTS: 'TEAM_STRUCTURE_ALREADY_EXISTS',
  STRUCTURE_INVALID: 'TEAM_STRUCTURE_INVALID',
  STRUCTURE_LOOP_NOT_ALLOWED: 'TEAM_STRUCTURE_LOOP_NOT_ALLOWED',
  STRUCTURE_SUSPENDED: 'TEAM_STRUCTURE_SUSPENDED',
  STRUCTURE_INACTIVE: 'TEAM_STRUCTURE_INACTIVE',

  // ---------- 服务记录类 ----------
  SERVICE_RECORD_NOT_FOUND: 'TEAM_SERVICE_RECORD_NOT_FOUND',
  SERVICE_RECORD_ALREADY_APPROVED: 'TEAM_SERVICE_RECORD_ALREADY_APPROVED',
  SERVICE_RECORD_INVALID: 'TEAM_SERVICE_RECORD_INVALID',
  SERVICE_RECORD_TYPE_INVALID: 'TEAM_SERVICE_RECORD_TYPE_INVALID',
  SERVICE_RECORD_DURATION_INVALID: 'TEAM_SERVICE_RECORD_DURATION_INVALID',

  // ---------- 团队奖励类 ----------
  REWARD_NOT_FOUND: 'TEAM_REWARD_NOT_FOUND',
  REWARD_ALREADY_EXISTS: 'TEAM_REWARD_ALREADY_EXISTS',
  REWARD_STATUS_INVALID: 'TEAM_REWARD_STATUS_INVALID',
  REWARD_TERMINAL_STATUS: 'TEAM_REWARD_TERMINAL_STATUS',
  REWARD_AMOUNT_INVALID: 'TEAM_REWARD_AMOUNT_INVALID',
  REWARD_AMOUNT_ZERO: 'TEAM_REWARD_AMOUNT_ZERO',
  REWARD_RATE_INVALID: 'TEAM_REWARD_RATE_INVALID',
  REWARD_LEVEL_INVALID: 'TEAM_REWARD_LEVEL_INVALID',
  REWARD_NOT_LOCKABLE: 'TEAM_REWARD_NOT_LOCKABLE',
  REWARD_NOT_APPROVABLE: 'TEAM_REWARD_NOT_APPROVABLE',
  REWARD_NOT_PAYABLE: 'TEAM_REWARD_NOT_PAYABLE',
  REWARD_NOT_RECOVERABLE: 'TEAM_REWARD_NOT_RECOVERABLE',
  REWARD_NOT_CANCELLABLE: 'TEAM_REWARD_NOT_CANCELLABLE',
  REWARD_SERVICE_RECORD_REQUIRED: 'TEAM_REWARD_SERVICE_RECORD_REQUIRED',
  REWARD_SERVICE_RECORD_NOT_APPROVED: 'TEAM_REWARD_SERVICE_RECORD_NOT_APPROVED',
  REWARD_NO_UPLINE: 'TEAM_REWARD_NO_UPLINE',

  // ---------- 业务关联类 ----------
  ORDER_NOT_FOUND: 'TEAM_ORDER_NOT_FOUND',
  ORDER_NOT_PAID: 'TEAM_ORDER_NOT_PAID',

  // ---------- KYC / 风控 ----------
  KYC_NOT_VERIFIED: 'TEAM_KYC_NOT_VERIFIED',
  RISK_HOLD: 'TEAM_RISK_HOLD',
  RISK_CHECK_FAILED: 'TEAM_RISK_CHECK_FAILED',

  // ---------- 审批类 ----------
  APPROVAL_REQUIRED: 'TEAM_APPROVAL_REQUIRED',
  APPROVAL_NOT_FOUND: 'TEAM_APPROVAL_NOT_FOUND',
  REVIEWER_REQUIRED: 'TEAM_REVIEWER_REQUIRED',
  REASON_REQUIRED: 'TEAM_REASON_REQUIRED',

  // ---------- 参数类 ----------
  PARAM_REQUIRED: 'TEAM_PARAM_REQUIRED',
  PARAM_INVALID: 'TEAM_PARAM_INVALID',

  // ---------- 系统类 ----------
  INTERNAL: 'TEAM_INTERNAL',
  EXTERNAL_SERVICE_ERROR: 'TEAM_EXTERNAL_SERVICE_ERROR',
} as const;

export type FjnTeamErrorCode =
  (typeof TEAM_ERROR_CODES)[keyof typeof TEAM_ERROR_CODES];

// ============================================================
// 2. 异常类
// ============================================================

/** Team 异常基类 */
export class FjnTeamError extends FjnError {
  constructor(
    code: FjnTeamErrorCode,
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
    this.name = 'FjnTeamError';
  }
}

// ---------- 团队结构类 ----------

export class FjnTeamStructureNotFoundError extends FjnTeamError {
  constructor(message: string = '团队结构不存在', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.STRUCTURE_NOT_FOUND, message, context, 404);
    this.name = 'FjnTeamStructureNotFoundError';
  }
}

export class FjnTeamStructureAlreadyExistsError extends FjnTeamError {
  constructor(message: string = '团队结构已存在', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.STRUCTURE_ALREADY_EXISTS, message, context, 409);
    this.name = 'FjnTeamStructureAlreadyExistsError';
  }
}

export class FjnTeamStructureInvalidError extends FjnTeamError {
  constructor(message: string = '团队结构无效', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.STRUCTURE_INVALID, message, context, 422);
    this.name = 'FjnTeamStructureInvalidError';
  }
}

export class FjnTeamStructureLoopNotAllowedError extends FjnTeamError {
  constructor(message: string = '禁止形成团队关系环路', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.STRUCTURE_LOOP_NOT_ALLOWED, message, context, 422);
    this.name = 'FjnTeamStructureLoopNotAllowedError';
  }
}

export class FjnTeamStructureSuspendedError extends FjnTeamError {
  constructor(message: string = '团队结构已暂停', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.STRUCTURE_SUSPENDED, message, context, 422);
    this.name = 'FjnTeamStructureSuspendedError';
  }
}

export class FjnTeamStructureInactiveError extends FjnTeamError {
  constructor(message: string = '团队结构已失效', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.STRUCTURE_INACTIVE, message, context, 422);
    this.name = 'FjnTeamStructureInactiveError';
  }
}

// ---------- 服务记录类 ----------

export class FjnTeamServiceRecordNotFoundError extends FjnTeamError {
  constructor(message: string = '团队服务记录不存在', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.SERVICE_RECORD_NOT_FOUND, message, context, 404);
    this.name = 'FjnTeamServiceRecordNotFoundError';
  }
}

export class FjnTeamServiceRecordAlreadyApprovedError extends FjnTeamError {
  constructor(message: string = '团队服务记录已审核通过', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.SERVICE_RECORD_ALREADY_APPROVED, message, context, 409);
    this.name = 'FjnTeamServiceRecordAlreadyApprovedError';
  }
}

export class FjnTeamServiceRecordInvalidError extends FjnTeamError {
  constructor(message: string = '团队服务记录无效', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.SERVICE_RECORD_INVALID, message, context, 422);
    this.name = 'FjnTeamServiceRecordInvalidError';
  }
}

export class FjnTeamServiceRecordTypeInvalidError extends FjnTeamError {
  constructor(message: string = '团队服务记录类型无效', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.SERVICE_RECORD_TYPE_INVALID, message, context, 400);
    this.name = 'FjnTeamServiceRecordTypeInvalidError';
  }
}

export class FjnTeamServiceRecordDurationInvalidError extends FjnTeamError {
  constructor(message: string = '团队服务记录时长无效', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.SERVICE_RECORD_DURATION_INVALID, message, context, 400);
    this.name = 'FjnTeamServiceRecordDurationInvalidError';
  }
}

// ---------- 团队奖励类 ----------

export class FjnTeamRewardNotFoundError extends FjnTeamError {
  constructor(message: string = '团队奖励不存在', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REWARD_NOT_FOUND, message, context, 404);
    this.name = 'FjnTeamRewardNotFoundError';
  }
}

export class FjnTeamRewardAlreadyExistsError extends FjnTeamError {
  constructor(message: string = '该订单已存在团队奖励', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REWARD_ALREADY_EXISTS, message, context, 409);
    this.name = 'FjnTeamRewardAlreadyExistsError';
  }
}

export class FjnTeamRewardStatusInvalidError extends FjnTeamError {
  constructor(message: string = '团队奖励状态非法', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REWARD_STATUS_INVALID, message, context, 422);
    this.name = 'FjnTeamRewardStatusInvalidError';
  }
}

export class FjnTeamRewardTerminalStatusError extends FjnTeamError {
  constructor(message: string = '团队奖励已处于终态', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REWARD_TERMINAL_STATUS, message, context, 422);
    this.name = 'FjnTeamRewardTerminalStatusError';
  }
}

export class FjnTeamRewardAmountInvalidError extends FjnTeamError {
  constructor(message: string = '团队奖励金额无效', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REWARD_AMOUNT_INVALID, message, context, 400);
    this.name = 'FjnTeamRewardAmountInvalidError';
  }
}

export class FjnTeamRewardAmountZeroError extends FjnTeamError {
  constructor(message: string = '团队奖励金额不能为零', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REWARD_AMOUNT_ZERO, message, context, 400);
    this.name = 'FjnTeamRewardAmountZeroError';
  }
}

export class FjnTeamRewardRateInvalidError extends FjnTeamError {
  constructor(message: string = '团队奖励比例无效', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REWARD_RATE_INVALID, message, context, 400);
    this.name = 'FjnTeamRewardRateInvalidError';
  }
}

export class FjnTeamRewardLevelInvalidError extends FjnTeamError {
  constructor(message: string = '团队奖励层级无效', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REWARD_LEVEL_INVALID, message, context, 400);
    this.name = 'FjnTeamRewardLevelInvalidError';
  }
}

export class FjnTeamRewardNotLockableError extends FjnTeamError {
  constructor(message: string = '团队奖励当前不可锁定', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REWARD_NOT_LOCKABLE, message, context, 422);
    this.name = 'FjnTeamRewardNotLockableError';
  }
}

export class FjnTeamRewardNotApprovableError extends FjnTeamError {
  constructor(message: string = '团队奖励当前不可审核', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REWARD_NOT_APPROVABLE, message, context, 422);
    this.name = 'FjnTeamRewardNotApprovableError';
  }
}

export class FjnTeamRewardNotPayableError extends FjnTeamError {
  constructor(message: string = '团队奖励当前不可支付', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REWARD_NOT_PAYABLE, message, context, 422);
    this.name = 'FjnTeamRewardNotPayableError';
  }
}

export class FjnTeamRewardNotRecoverableError extends FjnTeamError {
  constructor(message: string = '团队奖励当前不可追回', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REWARD_NOT_RECOVERABLE, message, context, 422);
    this.name = 'FjnTeamRewardNotRecoverableError';
  }
}

export class FjnTeamRewardNotCancellableError extends FjnTeamError {
  constructor(message: string = '团队奖励当前不可取消', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REWARD_NOT_CANCELLABLE, message, context, 422);
    this.name = 'FjnTeamRewardNotCancellableError';
  }
}

export class FjnTeamRewardServiceRecordRequiredError extends FjnTeamError {
  constructor(message: string = '团队奖励需要服务记录', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REWARD_SERVICE_RECORD_REQUIRED, message, context, 422);
    this.name = 'FjnTeamRewardServiceRecordRequiredError';
  }
}

export class FjnTeamRewardServiceRecordNotApprovedError extends FjnTeamError {
  constructor(message: string = '服务记录未审核通过', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REWARD_SERVICE_RECORD_NOT_APPROVED, message, context, 422);
    this.name = 'FjnTeamRewardServiceRecordNotApprovedError';
  }
}

export class FjnTeamRewardNoUplineError extends FjnTeamError {
  constructor(message: string = '用户无团队上级，无法发放团队奖励', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REWARD_NO_UPLINE, message, context, 422);
    this.name = 'FjnTeamRewardNoUplineError';
  }
}

// ---------- 业务关联类 ----------

export class FjnTeamOrderNotFoundError extends FjnTeamError {
  constructor(message: string = '订单不存在', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.ORDER_NOT_FOUND, message, context, 404);
    this.name = 'FjnTeamOrderNotFoundError';
  }
}

export class FjnTeamOrderNotPaidError extends FjnTeamError {
  constructor(message: string = '订单未支付', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.ORDER_NOT_PAID, message, context, 422);
    this.name = 'FjnTeamOrderNotPaidError';
  }
}

// ---------- KYC / 风控 ----------

export class FjnTeamKycNotVerifiedError extends FjnTeamError {
  constructor(message: string = 'KYC 未认证', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.KYC_NOT_VERIFIED, message, context, 422);
    this.name = 'FjnTeamKycNotVerifiedError';
  }
}

export class FjnTeamRiskHoldError extends FjnTeamError {
  constructor(message: string = '风控冻结中', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.RISK_HOLD, message, context, 422);
    this.name = 'FjnTeamRiskHoldError';
  }
}

// ---------- 审批类 ----------

export class FjnTeamApprovalRequiredError extends FjnTeamError {
  constructor(message: string = '需要审批', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.APPROVAL_REQUIRED, message, context, 422);
    this.name = 'FjnTeamApprovalRequiredError';
  }
}

export class FjnTeamReviewerRequiredError extends FjnTeamError {
  constructor(message: string = '审核人必填', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REVIEWER_REQUIRED, message, context, 400);
    this.name = 'FjnTeamReviewerRequiredError';
  }
}

export class FjnTeamReasonRequiredError extends FjnTeamError {
  constructor(message: string = '原因必填', context?: FjnErrorContext) {
    super(TEAM_ERROR_CODES.REASON_REQUIRED, message, context, 400);
    this.name = 'FjnTeamReasonRequiredError';
  }
}

// ============================================================
// 3. 工具函数
// ============================================================

export function isFjnTeamErrorCode(code: string): code is FjnTeamErrorCode {
  return Object.values(TEAM_ERROR_CODES).includes(code as FjnTeamErrorCode);
}

export function getTeamErrorCodeCount(): number {
  return Object.keys(TEAM_ERROR_CODES).length;
}
