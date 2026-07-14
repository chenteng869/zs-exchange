/**
 * FJN Node Service - 错误码 + 异常类
 *
 * 严格遵循 H030 设计 + 工业级分层：
 *  - 错误码使用 SCREAMING_SNAKE_CASE
 *  - 错误码映射到对应异常类与 HTTP 状态码
 *
 * 用法：
 *   import { FjnNodeNotFoundError, NODE_ERROR_CODES } from './node-errors';
 *   throw new FjnNodeNotFoundError({ nodeId });
 */

import { FjnError, FjnErrorContext } from '../errors';

// ============================================================
// 1. 错误码常量
// ============================================================

export const NODE_ERROR_CODES = {
  // ---------- 节点基础类 ----------
  NODE_NOT_FOUND: 'NODE_NOT_FOUND',
  NODE_ALREADY_EXISTS: 'NODE_ALREADY_EXISTS',
  NODE_INVALID: 'NODE_INVALID',
  NODE_LEVEL_INVALID: 'NODE_LEVEL_INVALID',
  NODE_REGION_INVALID: 'NODE_REGION_INVALID',
  NODE_NOT_ACTIVE: 'NODE_NOT_ACTIVE',
  NODE_NOT_APPROVED: 'NODE_NOT_APPROVED',
  NODE_SUSPENDED: 'NODE_SUSPENDED',
  NODE_TERMINATED: 'NODE_TERMINATED',
  NODE_BLACKLISTED: 'NODE_BLACKLISTED',
  NODE_RESTRICTED: 'NODE_RESTRICTED',
  NODE_NOT_REWARD_ELIGIBLE: 'NODE_NOT_REWARD_ELIGIBLE',
  NODE_ALREADY_TERMINATED: 'NODE_ALREADY_TERMINATED',
  NODE_ALREADY_BLACKLISTED: 'NODE_ALREADY_BLACKLISTED',

  // ---------- KYB 类 ----------
  KYB_NOT_SUBMITTED: 'NODE_KYB_NOT_SUBMITTED',
  KYB_ALREADY_APPROVED: 'NODE_KYB_ALREADY_APPROVED',
  KYB_ALREADY_REJECTED: 'NODE_KYB_ALREADY_REJECTED',
  KYB_INVALID_STATUS: 'NODE_KYB_INVALID_STATUS',
  KYB_REQUIRED: 'NODE_KYB_REQUIRED',
  KYB_AGREEMENT_REQUIRED: 'NODE_KYB_AGREEMENT_REQUIRED',

  // ---------- 服务记录类 ----------
  SERVICE_RECORD_NOT_FOUND: 'NODE_SERVICE_RECORD_NOT_FOUND',
  SERVICE_RECORD_INVALID: 'NODE_SERVICE_RECORD_INVALID',
  SERVICE_RECORD_TYPE_INVALID: 'NODE_SERVICE_RECORD_TYPE_INVALID',
  SERVICE_RECORD_PARTICIPANTS_INVALID: 'NODE_SERVICE_RECORD_PARTICIPANTS_INVALID',

  // ---------- 节点奖励类 ----------
  REWARD_NOT_FOUND: 'NODE_REWARD_NOT_FOUND',
  REWARD_ALREADY_EXISTS: 'NODE_REWARD_ALREADY_EXISTS',
  REWARD_STATUS_INVALID: 'NODE_REWARD_STATUS_INVALID',
  REWARD_TERMINAL_STATUS: 'NODE_REWARD_TERMINAL_STATUS',
  REWARD_AMOUNT_INVALID: 'NODE_REWARD_AMOUNT_INVALID',
  REWARD_AMOUNT_ZERO: 'NODE_REWARD_AMOUNT_ZERO',
  REWARD_RATE_INVALID: 'NODE_REWARD_RATE_INVALID',
  REWARD_LEVEL_INVALID: 'NODE_REWARD_LEVEL_INVALID',
  REWARD_STRATEGIC_NOT_ELIGIBLE: 'NODE_REWARD_STRATEGIC_NOT_ELIGIBLE',
  REWARD_NOT_LOCKABLE: 'NODE_REWARD_NOT_LOCKABLE',
  REWARD_NOT_APPROVABLE: 'NODE_REWARD_NOT_APPROVABLE',
  REWARD_NOT_PAYABLE: 'NODE_REWARD_NOT_PAYABLE',
  REWARD_NOT_RECOVERABLE: 'NODE_REWARD_NOT_RECOVERABLE',
  REWARD_NOT_CANCELLABLE: 'NODE_REWARD_NOT_CANCELLABLE',
  REWARD_SERVICE_RECORD_REQUIRED: 'NODE_REWARD_SERVICE_RECORD_REQUIRED',
  REWARD_SERVICE_RECORD_NOT_APPROVED: 'NODE_REWARD_SERVICE_RECORD_NOT_APPROVED',
  REWARD_NO_NODE: 'NODE_REWARD_NO_NODE',

  // ---------- 业务关联类 ----------
  ORDER_NOT_FOUND: 'NODE_ORDER_NOT_FOUND',
  ORDER_NOT_PAID: 'NODE_ORDER_NOT_PAID',
  USER_NOT_FOUND: 'NODE_USER_NOT_FOUND',

  // ---------- KYC / 风控 ----------
  KYC_NOT_VERIFIED: 'NODE_KYC_NOT_VERIFIED',
  RISK_HOLD: 'NODE_RISK_HOLD',
  RISK_CHECK_FAILED: 'NODE_RISK_CHECK_FAILED',

  // ---------- 审批类 ----------
  APPROVAL_REQUIRED: 'NODE_APPROVAL_REQUIRED',
  APPROVAL_NOT_FOUND: 'NODE_APPROVAL_NOT_FOUND',
  APPROVER_REQUIRED: 'NODE_APPROVER_REQUIRED',
  REVIEWER_REQUIRED: 'NODE_REVIEWER_REQUIRED',
  REASON_REQUIRED: 'NODE_REASON_REQUIRED',

  // ---------- 参数类 ----------
  PARAM_REQUIRED: 'NODE_PARAM_REQUIRED',
  PARAM_INVALID: 'NODE_PARAM_INVALID',
  COUNTRY_NOT_ALLOWED: 'NODE_COUNTRY_NOT_ALLOWED',
  REGION_CODE_INVALID: 'NODE_REGION_CODE_INVALID',

  // ---------- 系统类 ----------
  INTERNAL: 'NODE_INTERNAL',
  EXTERNAL_SERVICE_ERROR: 'NODE_EXTERNAL_SERVICE_ERROR',
} as const;

export type FjnNodeErrorCode =
  (typeof NODE_ERROR_CODES)[keyof typeof NODE_ERROR_CODES];

// ============================================================
// 2. 异常类
// ============================================================

/** Node 异常基类 */
export class FjnNodeError extends FjnError {
  constructor(
    code: FjnNodeErrorCode,
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
    this.name = 'FjnNodeError';
  }
}

// ---------- 节点基础类 ----------

export class FjnNodeNotFoundError extends FjnNodeError {
  constructor(message: string = '节点不存在', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.NODE_NOT_FOUND, message, context, 404);
    this.name = 'FjnNodeNotFoundError';
  }
}

export class FjnNodeAlreadyExistsError extends FjnNodeError {
  constructor(message: string = '节点已存在', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.NODE_ALREADY_EXISTS, message, context, 409);
    this.name = 'FjnNodeAlreadyExistsError';
  }
}

export class FjnNodeInvalidError extends FjnNodeError {
  constructor(message: string = '节点信息无效', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.NODE_INVALID, message, context, 422);
    this.name = 'FjnNodeInvalidError';
  }
}

export class FjnNodeLevelInvalidError extends FjnNodeError {
  constructor(message: string = '节点等级无效', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.NODE_LEVEL_INVALID, message, context, 400);
    this.name = 'FjnNodeLevelInvalidError';
  }
}

export class FjnNodeRegionInvalidError extends FjnNodeError {
  constructor(message: string = '区域代码无效', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.NODE_REGION_INVALID, message, context, 400);
    this.name = 'FjnNodeRegionInvalidError';
  }
}

export class FjnNodeNotActiveError extends FjnNodeError {
  constructor(message: string = '节点未激活', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.NODE_NOT_ACTIVE, message, context, 422);
    this.name = 'FjnNodeNotActiveError';
  }
}

export class FjnNodeNotApprovedError extends FjnNodeError {
  constructor(message: string = '节点未审核通过', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.NODE_NOT_APPROVED, message, context, 422);
    this.name = 'FjnNodeNotApprovedError';
  }
}

export class FjnNodeSuspendedError extends FjnNodeError {
  constructor(message: string = '节点已暂停', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.NODE_SUSPENDED, message, context, 422);
    this.name = 'FjnNodeSuspendedError';
  }
}

export class FjnNodeTerminatedError extends FjnNodeError {
  constructor(message: string = '节点已终止', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.NODE_TERMINATED, message, context, 422);
    this.name = 'FjnNodeTerminatedError';
  }
}

export class FjnNodeBlacklistedError extends FjnNodeError {
  constructor(message: string = '节点已被列入黑名单', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.NODE_BLACKLISTED, message, context, 422);
    this.name = 'FjnNodeBlacklistedError';
  }
}

export class FjnNodeRestrictedError extends FjnNodeError {
  constructor(message: string = '节点已受限', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.NODE_RESTRICTED, message, context, 422);
    this.name = 'FjnNodeRestrictedError';
  }
}

export class FjnNodeNotRewardEligibleError extends FjnNodeError {
  constructor(message: string = '节点当前不可接收订单奖励', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.NODE_NOT_REWARD_ELIGIBLE, message, context, 422);
    this.name = 'FjnNodeNotRewardEligibleError';
  }
}

export class FjnNodeAlreadyTerminatedError extends FjnNodeError {
  constructor(message: string = '节点已终止（终态）', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.NODE_ALREADY_TERMINATED, message, context, 422);
    this.name = 'FjnNodeAlreadyTerminatedError';
  }
}

export class FjnNodeAlreadyBlacklistedError extends FjnNodeError {
  constructor(message: string = '节点已在黑名单（终态）', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.NODE_ALREADY_BLACKLISTED, message, context, 422);
    this.name = 'FjnNodeAlreadyBlacklistedError';
  }
}

// ---------- KYB 类 ----------

export class FjnNodeKybNotSubmittedError extends FjnNodeError {
  constructor(message: string = '节点未提交 KYB', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.KYB_NOT_SUBMITTED, message, context, 422);
    this.name = 'FjnNodeKybNotSubmittedError';
  }
}

export class FjnNodeKybAlreadyApprovedError extends FjnNodeError {
  constructor(message: string = '节点 KYB 已通过', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.KYB_ALREADY_APPROVED, message, context, 409);
    this.name = 'FjnNodeKybAlreadyApprovedError';
  }
}

export class FjnNodeKybAlreadyRejectedError extends FjnNodeError {
  constructor(message: string = '节点 KYB 已拒绝', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.KYB_ALREADY_REJECTED, message, context, 409);
    this.name = 'FjnNodeKybAlreadyRejectedError';
  }
}

export class FjnNodeKybInvalidStatusError extends FjnNodeError {
  constructor(message: string = '节点 KYB 状态非法', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.KYB_INVALID_STATUS, message, context, 422);
    this.name = 'FjnNodeKybInvalidStatusError';
  }
}

export class FjnNodeKybRequiredError extends FjnNodeError {
  constructor(message: string = '节点需要先完成 KYB', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.KYB_REQUIRED, message, context, 422);
    this.name = 'FjnNodeKybRequiredError';
  }
}

export class FjnNodeKybAgreementRequiredError extends FjnNodeError {
  constructor(message: string = '节点需要签署合作协议', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.KYB_AGREEMENT_REQUIRED, message, context, 422);
    this.name = 'FjnNodeKybAgreementRequiredError';
  }
}

// ---------- 服务记录类 ----------

export class FjnNodeServiceRecordNotFoundError extends FjnNodeError {
  constructor(message: string = '节点服务记录不存在', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.SERVICE_RECORD_NOT_FOUND, message, context, 404);
    this.name = 'FjnNodeServiceRecordNotFoundError';
  }
}

export class FjnNodeServiceRecordInvalidError extends FjnNodeError {
  constructor(message: string = '节点服务记录无效', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.SERVICE_RECORD_INVALID, message, context, 422);
    this.name = 'FjnNodeServiceRecordInvalidError';
  }
}

export class FjnNodeServiceRecordTypeInvalidError extends FjnNodeError {
  constructor(message: string = '节点服务记录类型无效', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.SERVICE_RECORD_TYPE_INVALID, message, context, 400);
    this.name = 'FjnNodeServiceRecordTypeInvalidError';
  }
}

export class FjnNodeServiceRecordParticipantsInvalidError extends FjnNodeError {
  constructor(message: string = '节点服务记录参与人数无效', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.SERVICE_RECORD_PARTICIPANTS_INVALID, message, context, 400);
    this.name = 'FjnNodeServiceRecordParticipantsInvalidError';
  }
}

// ---------- 节点奖励类 ----------

export class FjnNodeRewardNotFoundError extends FjnNodeError {
  constructor(message: string = '节点奖励不存在', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_NOT_FOUND, message, context, 404);
    this.name = 'FjnNodeRewardNotFoundError';
  }
}

export class FjnNodeRewardAlreadyExistsError extends FjnNodeError {
  constructor(message: string = '该订单已存在节点奖励', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_ALREADY_EXISTS, message, context, 409);
    this.name = 'FjnNodeRewardAlreadyExistsError';
  }
}

export class FjnNodeRewardStatusInvalidError extends FjnNodeError {
  constructor(message: string = '节点奖励状态非法', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_STATUS_INVALID, message, context, 422);
    this.name = 'FjnNodeRewardStatusInvalidError';
  }
}

export class FjnNodeRewardTerminalStatusError extends FjnNodeError {
  constructor(message: string = '节点奖励已处于终态', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_TERMINAL_STATUS, message, context, 422);
    this.name = 'FjnNodeRewardTerminalStatusError';
  }
}

export class FjnNodeRewardAmountInvalidError extends FjnNodeError {
  constructor(message: string = '节点奖励金额无效', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_AMOUNT_INVALID, message, context, 400);
    this.name = 'FjnNodeRewardAmountInvalidError';
  }
}

export class FjnNodeRewardAmountZeroError extends FjnNodeError {
  constructor(message: string = '节点奖励金额不能为零', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_AMOUNT_ZERO, message, context, 400);
    this.name = 'FjnNodeRewardAmountZeroError';
  }
}

export class FjnNodeRewardRateInvalidError extends FjnNodeError {
  constructor(message: string = '节点奖励比例无效', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_RATE_INVALID, message, context, 400);
    this.name = 'FjnNodeRewardRateInvalidError';
  }
}

export class FjnNodeRewardLevelInvalidError extends FjnNodeError {
  constructor(message: string = '节点奖励等级无效', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_LEVEL_INVALID, message, context, 400);
    this.name = 'FjnNodeRewardLevelInvalidError';
  }
}

export class FjnNodeRewardStrategicNotEligibleError extends FjnNodeError {
  constructor(message: string = '战略节点不参与订单分润', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_STRATEGIC_NOT_ELIGIBLE, message, context, 422);
    this.name = 'FjnNodeRewardStrategicNotEligibleError';
  }
}

export class FjnNodeRewardNotLockableError extends FjnNodeError {
  constructor(message: string = '节点奖励当前不可锁定', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_NOT_LOCKABLE, message, context, 422);
    this.name = 'FjnNodeRewardNotLockableError';
  }
}

export class FjnNodeRewardNotApprovableError extends FjnNodeError {
  constructor(message: string = '节点奖励当前不可审核', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_NOT_APPROVABLE, message, context, 422);
    this.name = 'FjnNodeRewardNotApprovableError';
  }
}

export class FjnNodeRewardNotPayableError extends FjnNodeError {
  constructor(message: string = '节点奖励当前不可支付', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_NOT_PAYABLE, message, context, 422);
    this.name = 'FjnNodeRewardNotPayableError';
  }
}

export class FjnNodeRewardNotRecoverableError extends FjnNodeError {
  constructor(message: string = '节点奖励当前不可追回', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_NOT_RECOVERABLE, message, context, 422);
    this.name = 'FjnNodeRewardNotRecoverableError';
  }
}

export class FjnNodeRewardNotCancellableError extends FjnNodeError {
  constructor(message: string = '节点奖励当前不可取消', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_NOT_CANCELLABLE, message, context, 422);
    this.name = 'FjnNodeRewardNotCancellableError';
  }
}

export class FjnNodeRewardServiceRecordRequiredError extends FjnNodeError {
  constructor(message: string = '节点奖励需要服务记录', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_SERVICE_RECORD_REQUIRED, message, context, 422);
    this.name = 'FjnNodeRewardServiceRecordRequiredError';
  }
}

export class FjnNodeRewardServiceRecordNotApprovedError extends FjnNodeError {
  constructor(message: string = '服务记录未审核通过', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_SERVICE_RECORD_NOT_APPROVED, message, context, 422);
    this.name = 'FjnNodeRewardServiceRecordNotApprovedError';
  }
}

export class FjnNodeRewardNoNodeError extends FjnNodeError {
  constructor(message: string = '用户无对应节点，无法发放节点奖励', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REWARD_NO_NODE, message, context, 422);
    this.name = 'FjnNodeRewardNoNodeError';
  }
}

// ---------- 业务关联类 ----------

export class FjnNodeOrderNotFoundError extends FjnNodeError {
  constructor(message: string = '订单不存在', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.ORDER_NOT_FOUND, message, context, 404);
    this.name = 'FjnNodeOrderNotFoundError';
  }
}

export class FjnNodeOrderNotPaidError extends FjnNodeError {
  constructor(message: string = '订单未支付', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.ORDER_NOT_PAID, message, context, 422);
    this.name = 'FjnNodeOrderNotPaidError';
  }
}

// ---------- KYC / 风控 ----------

export class FjnNodeKycNotVerifiedError extends FjnNodeError {
  constructor(message: string = 'KYC 未认证', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.KYC_NOT_VERIFIED, message, context, 422);
    this.name = 'FjnNodeKycNotVerifiedError';
  }
}

export class FjnNodeRiskHoldError extends FjnNodeError {
  constructor(message: string = '风控冻结中', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.RISK_HOLD, message, context, 422);
    this.name = 'FjnNodeRiskHoldError';
  }
}

// ---------- 审批类 ----------

export class FjnNodeApproverRequiredError extends FjnNodeError {
  constructor(message: string = '审核人必填', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.APPROVER_REQUIRED, message, context, 400);
    this.name = 'FjnNodeApproverRequiredError';
  }
}

export class FjnNodeReviewerRequiredError extends FjnNodeError {
  constructor(message: string = '审核人必填', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REVIEWER_REQUIRED, message, context, 400);
    this.name = 'FjnNodeReviewerRequiredError';
  }
}

export class FjnNodeReasonRequiredError extends FjnNodeError {
  constructor(message: string = '原因必填', context?: FjnErrorContext) {
    super(NODE_ERROR_CODES.REASON_REQUIRED, message, context, 400);
    this.name = 'FjnNodeReasonRequiredError';
  }
}

// ============================================================
// 3. 工具函数
// ============================================================

export function isFjnNodeErrorCode(code: string): code is FjnNodeErrorCode {
  return Object.values(NODE_ERROR_CODES).includes(code as FjnNodeErrorCode);
}

export function getNodeErrorCodeCount(): number {
  return Object.keys(NODE_ERROR_CODES).length;
}
