/**
 * FJN Revenue Service - 错误码 + 异常类
 *
 * 严格遵循 H022 §4 + 工业级分层：
 *  - 错误码使用 SCREAMING_SNAKE_CASE
 *  - 错误码映射到对应异常类与 HTTP 状态码
 *  - 错误码可在 API 响应中直接暴露给客户端
 *
 * 用法：
 *   import { FjnAllocationNotFoundError, REVENUE_ERROR_CODES } from './revenue-errors';
 *   throw new FjnAllocationNotFoundError({ allocationId });
 */

import { FjnError, FjnErrorContext } from '../errors';

// ============================================================
// 1. 错误码常量
// ============================================================

/**
 * Revenue Service 错误码
 *
 * 分类：
 *  - 资源类（NOT_FOUND / ALREADY_EXISTS）
 *  - 状态机类（STATUS_INVALID / TERMINAL_STATUS）
 *  - 金额类（AMOUNT_INVALID / RULE_INVALID）
 *  - 业务关联类（ORDER_NOT_FOUND / ORDER_NOT_PAID）
 *  - 规则类（RULE_NOT_FOUND / RULE_INVALID / RULE_INACTIVE）
 *  - 通用类（INTERNAL / INVALID_PARAMS）
 */
export const REVENUE_ERROR_CODES = {
  // ---------- 资源类 ----------
  ALLOCATION_NOT_FOUND: 'REVENUE_ALLOCATION_NOT_FOUND',
  ALLOCATION_ALREADY_EXISTS: 'REVENUE_ALLOCATION_ALREADY_EXISTS',
  REVERSAL_NOT_FOUND: 'REVENUE_REVERSAL_NOT_FOUND',
  REVERSAL_ALREADY_EXISTS: 'REVENUE_REVERSAL_REVERSAL_ALREADY_EXISTS',
  RULE_NOT_FOUND: 'REVENUE_RULE_NOT_FOUND',
  RULE_ITEM_NOT_FOUND: 'REVENUE_RULE_ITEM_NOT_FOUND',

  // ---------- 状态机类 ----------
  ALLOCATION_STATUS_INVALID: 'REVENUE_ALLOCATION_STATUS_INVALID',
  ALLOCATION_TERMINAL_STATUS: 'REVENUE_ALLOCATION_TERMINAL_STATUS',
  ALLOCATION_NOT_REVERSIBLE: 'REVENUE_ALLOCATION_NOT_REVERSIBLE',
  ALLOCATION_NOT_APPROVABLE: 'REVENUE_ALLOCATION_NOT_APPROVABLE',
  ALLOCATION_NOT_CALCULATED: 'REVENUE_ALLOCATION_NOT_CALCULATED',
  REVERSAL_STATUS_INVALID: 'REVENUE_REVERSAL_STATUS_INVALID',
  REVERSAL_TERMINAL_STATUS: 'REVENUE_REVERSAL_TERMINAL_STATUS',

  // ---------- 金额类 ----------
  ALLOCATION_AMOUNT_INVALID: 'REVENUE_ALLOCATION_AMOUNT_INVALID',
  ALLOCATION_AMOUNT_ZERO: 'REVENUE_ALLOCATION_AMOUNT_ZERO',
  ALLOCATION_AMOUNT_NEGATIVE: 'REVENUE_ALLOCATION_AMOUNT_NEGATIVE',
  ALLOCATION_NET_AMOUNT_NEGATIVE: 'REVENUE_ALLOCATION_NET_AMOUNT_NEGATIVE',
  ALLOCATION_CURRENCY_MISMATCH: 'REVENUE_ALLOCATION_CURRENCY_MISMATCH',
  REVERSAL_AMOUNT_INVALID: 'REVENUE_REVERSAL_AMOUNT_INVALID',
  REVERSAL_AMOUNT_EXCEEDS: 'REVENUE_REVERSAL_AMOUNT_EXCEEDS',

  // ---------- 业务关联类 ----------
  ORDER_NOT_FOUND: 'REVENUE_ORDER_NOT_FOUND',
  ORDER_NOT_PAID: 'REVENUE_ORDER_NOT_PAID',
  ORDER_ALREADY_ALLOCATED: 'REVENUE_ORDER_ALREADY_ALLOCATED',
  ORDER_CURRENCY_MISMATCH: 'REVENUE_ORDER_CURRENCY_MISMATCH',
  REFUND_NOT_FOUND: 'REVENUE_REFUND_NOT_FOUND',
  REFUND_NOT_APPROVED: 'REVENUE_REFUND_NOT_APPROVED',

  // ---------- 规则类 ----------
  RULE_INVALID: 'REVENUE_RULE_INVALID',
  RULE_INACTIVE: 'REVENUE_RULE_INACTIVE',
  RULE_EXPIRED: 'REVENUE_RULE_EXPIRED',
  RULE_VERSION_MISMATCH: 'REVENUE_RULE_VERSION_MISMATCH',
  RULE_PERCENTAGE_INVALID: 'REVENUE_RULE_PERCENTAGE_INVALID',
  RULE_PERCENTAGE_SUM_INVALID: 'REVENUE_RULE_PERCENTAGE_SUM_INVALID',
  RULE_PRODUCT_TYPE_MISMATCH: 'REVENUE_RULE_PRODUCT_TYPE_MISMATCH',

  // ---------- 参数类 ----------
  PARAM_REQUIRED: 'REVENUE_PARAM_REQUIRED',
  PARAM_INVALID: 'REVENUE_PARAM_INVALID',
  PARAMS_REQUIRED: 'REVENUE_PARAMS_REQUIRED',

  // ---------- 审批类 ----------
  REVIEWER_REQUIRED: 'REVENUE_REVIEWER_REQUIRED',
  REVIEW_NOTE_REQUIRED: 'REVENUE_REVIEW_NOTE_REQUIRED',
  ALREADY_REVIEWED: 'REVENUE_ALREADY_REVIEWED',

  // ---------- 系统类 ----------
  INTERNAL: 'REVENUE_INTERNAL',
  EXTERNAL_SERVICE_ERROR: 'REVENUE_EXTERNAL_SERVICE_ERROR',
} as const;

export type FjnRevenueErrorCode =
  (typeof REVENUE_ERROR_CODES)[keyof typeof REVENUE_ERROR_CODES];

// ============================================================
// 2. 异常类
// ============================================================

/** Revenue Service 异常基类 */
export class FjnRevenueError extends FjnError {
  constructor(
    code: FjnRevenueErrorCode,
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
    this.name = 'FjnRevenueError';
  }
}

// ---------- 资源类异常 ----------

/** 分账单不存在（404） */
export class FjnAllocationNotFoundError extends FjnRevenueError {
  constructor(message: string = '分账单不存在', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.ALLOCATION_NOT_FOUND, message, context, 404);
    this.name = 'FjnAllocationNotFoundError';
  }
}

/** 分账单已存在（409） */
export class FjnAllocationAlreadyExistsError extends FjnRevenueError {
  constructor(message: string = '该订单已存在分账记录', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.ALLOCATION_ALREADY_EXISTS, message, context, 409);
    this.name = 'FjnAllocationAlreadyExistsError';
  }
}

/** 冲销单不存在（404） */
export class FjnReversalNotFoundError extends FjnRevenueError {
  constructor(message: string = '冲销单不存在', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.REVERSAL_NOT_FOUND, message, context, 404);
    this.name = 'FjnReversalNotFoundError';
  }
}

/** 冲销单已存在（409） */
export class FjnReversalAlreadyExistsError extends FjnRevenueError {
  constructor(message: string = '该分账已存在冲销记录', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.REVERSAL_ALREADY_EXISTS, message, context, 409);
    this.name = 'FjnReversalAlreadyExistsError';
  }
}

/** 规则不存在（404） */
export class FjnRuleNotFoundError extends FjnRevenueError {
  constructor(message: string = '分账规则不存在', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.RULE_NOT_FOUND, message, context, 404);
    this.name = 'FjnRuleNotFoundError';
  }
}

// ---------- 状态机类异常 ----------

/** 分账状态非法（422） */
export class FjnAllocationStatusInvalidError extends FjnRevenueError {
  constructor(message: string = '分账状态非法', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.ALLOCATION_STATUS_INVALID, message, context, 422);
    this.name = 'FjnAllocationStatusInvalidError';
  }
}

/** 分账已处于终态（422） */
export class FjnAllocationTerminalStatusError extends FjnRevenueError {
  constructor(message: string = '分账已处于终态，不可操作', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.ALLOCATION_TERMINAL_STATUS, message, context, 422);
    this.name = 'FjnAllocationTerminalStatusError';
  }
}

/** 分账不可冲销（422） */
export class FjnAllocationNotReversibleError extends FjnRevenueError {
  constructor(message: string = '当前状态不可冲销', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.ALLOCATION_NOT_REVERSIBLE, message, context, 422);
    this.name = 'FjnAllocationNotReversibleError';
  }
}

/** 分账不可审核（422） */
export class FjnAllocationNotApprovableError extends FjnRevenueError {
  constructor(message: string = '当前状态不可审核', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.ALLOCATION_NOT_APPROVABLE, message, context, 422);
    this.name = 'FjnAllocationNotApprovableError';
  }
}

/** 冲销状态非法（422） */
export class FjnReversalStatusInvalidError extends FjnRevenueError {
  constructor(message: string = '冲销状态非法', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.REVERSAL_STATUS_INVALID, message, context, 422);
    this.name = 'FjnReversalStatusInvalidError';
  }
}

// ---------- 金额类异常 ----------

/** 分账金额无效（400） */
export class FjnAllocationAmountInvalidError extends FjnRevenueError {
  constructor(message: string = '分账金额无效', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.ALLOCATION_AMOUNT_INVALID, message, context, 400);
    this.name = 'FjnAllocationAmountInvalidError';
  }
}

/** 分账金额为零（400） */
export class FjnAllocationAmountZeroError extends FjnRevenueError {
  constructor(message: string = '分账金额不能为零', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.ALLOCATION_AMOUNT_ZERO, message, context, 400);
    this.name = 'FjnAllocationAmountZeroError';
  }
}

/** 冲销金额无效（400） */
export class FjnReversalAmountInvalidError extends FjnRevenueError {
  constructor(message: string = '冲销金额无效', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.REVERSAL_AMOUNT_INVALID, message, context, 400);
    this.name = 'FjnReversalAmountInvalidError';
  }
}

/** 冲销金额超限（422） */
export class FjnReversalAmountExceedsError extends FjnRevenueError {
  constructor(message: string = '冲销金额超过原分账金额', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.REVERSAL_AMOUNT_EXCEEDS, message, context, 422);
    this.name = 'FjnReversalAmountExceedsError';
  }
}

// ---------- 业务关联类异常 ----------

/** 订单不存在（404） */
export class FjnRevenueOrderNotFoundError extends FjnRevenueError {
  constructor(message: string = '订单不存在', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.ORDER_NOT_FOUND, message, context, 404);
    this.name = 'FjnRevenueOrderNotFoundError';
  }
}

/** 订单未支付（422） */
export class FjnRevenueOrderNotPaidError extends FjnRevenueError {
  constructor(message: string = '订单未支付，不能分账', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.ORDER_NOT_PAID, message, context, 422);
    this.name = 'FjnRevenueOrderNotPaidError';
  }
}

// ---------- 规则类异常 ----------

/** 规则无效（400） */
export class FjnRuleInvalidError extends FjnRevenueError {
  constructor(message: string = '分账规则无效', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.RULE_INVALID, message, context, 400);
    this.name = 'FjnRuleInvalidError';
  }
}

/** 规则未生效（422） */
export class FjnRuleInactiveError extends FjnRevenueError {
  constructor(message: string = '分账规则未生效', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.RULE_INACTIVE, message, context, 422);
    this.name = 'FjnRuleInactiveError';
  }
}

/** 规则比例无效（400） */
export class FjnRulePercentageInvalidError extends FjnRevenueError {
  constructor(message: string = '分账规则比例无效', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.RULE_PERCENTAGE_INVALID, message, context, 400);
    this.name = 'FjnRulePercentageInvalidError';
  }
}

/** 规则比例之和不为 1（400） */
export class FjnRulePercentageSumInvalidError extends FjnRevenueError {
  constructor(message: string = '分账规则比例之和必须等于 1', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.RULE_PERCENTAGE_SUM_INVALID, message, context, 400);
    this.name = 'FjnRulePercentageSumInvalidError';
  }
}

// ---------- 审批类异常 ----------

/** 审核人必填（400） */
export class FjnReviewerRequiredError extends FjnRevenueError {
  constructor(message: string = '审核人必填', context?: FjnErrorContext) {
    super(REVENUE_ERROR_CODES.REVIEWER_REQUIRED, message, context, 400);
    this.name = 'FjnReviewerRequiredError';
  }
}

// ============================================================
// 3. 工具函数
// ============================================================

/** 校验错误码是否属于 Revenue Service */
export function isFjnRevenueErrorCode(code: string): code is FjnRevenueErrorCode {
  return Object.values(REVENUE_ERROR_CODES).includes(code as FjnRevenueErrorCode);
}

/** 获取所有错误码数量 */
export function getRevenueErrorCodeCount(): number {
  return Object.keys(REVENUE_ERROR_CODES).length;
}
