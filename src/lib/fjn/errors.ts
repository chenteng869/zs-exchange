/**
 * FJN 业务异常层级
 *
 * 严格遵循 H6 规范：
 *  - 所有业务异常必须可被 ExceptionFilter 捕获
 *  - 异常必须包含 code、message、context、httpStatus
 *  - 异常必须可被序列化（用于 API 响应 / 队列 / 链上回执）
 *
 * 用法：
 *   throw new FjnValidationError('USER_ID_REQUIRED', '用户 ID 必填', { field: 'userId' });
 *   throw new FjnInsufficientBalanceError('POINTS_NOT_ENOUGH', { asset: 'FJ369_POINTS', need: '100' });
 */

import { logger } from '../logger';

// ============================================================
// 错误码定义（与 API 响应 code 对应）
// ============================================================

export const FJN_ERROR_CODES = {
  // 通用
  INTERNAL: 'FJN_INTERNAL',
  VALIDATION: 'FJN_VALIDATION',
  NOT_FOUND: 'FJN_NOT_FOUND',
  CONFLICT: 'FJN_CONFLICT',
  UNAUTHORIZED: 'FJN_UNAUTHORIZED',
  FORBIDDEN: 'FJN_FORBIDDEN',

  // 业务规则
  BUSINESS_RULE: 'FJN_BUSINESS_RULE',
  STATE_MACHINE: 'FJN_STATE_MACHINE',
  APPROVAL_REQUIRED: 'FJN_APPROVAL_REQUIRED',

  // 资产
  INSUFFICIENT_BALANCE: 'FJN_INSUFFICIENT_BALANCE',
  KYC_REQUIRED: 'FJN_KYC_REQUIRED',
  REGION_RESTRICTED: 'FJN_REGION_RESTRICTED',

  // 外部
  EXTERNAL_SERVICE: 'FJN_EXTERNAL_SERVICE',
  RATE_LIMIT: 'FJN_RATE_LIMIT',
} as const;

export type FjnErrorCode = (typeof FJN_ERROR_CODES)[keyof typeof FJN_ERROR_CODES];

// ============================================================
// 异常基类
// ============================================================

export interface FjnErrorContext {
  [key: string]: unknown;
}

export interface FjnErrorOptions {
  code?: FjnErrorCode;
  message: string;
  context?: FjnErrorContext;
  httpStatus?: number;
  cause?: unknown;
}

/**
 * FJN 业务异常基类
 *
 * 所有 FJN 业务异常都必须继承此基类，便于 ExceptionFilter 统一处理
 */
export class FjnError extends Error {
  public readonly code: FjnErrorCode;
  public readonly context: FjnErrorContext;
  public readonly httpStatus: number;
  public readonly timestamp: string;
  public readonly cause?: unknown;

  constructor(options: FjnErrorOptions) {
    super(options.message);
    this.name = 'FjnError';
    this.code = options.code ?? FJN_ERROR_CODES.INTERNAL;
    this.context = options.context ?? {};
    this.httpStatus = options.httpStatus ?? 500;
    this.timestamp = new Date().toISOString();
    if (options.cause !== undefined) this.cause = options.cause;

    // 维护堆栈
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /** 序列化为 API 响应 */
  toJSON() {
    return {
      success: false,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
    };
  }

  /** 输出日志 */
  log() {
    logger.error(`[${this.code}] ${this.message}`, {
      context: this.context,
      stack: this.stack,
    });
  }
}

// ============================================================
// 校验错误（参数 / 业务字段）
// ============================================================

export class FjnValidationError extends FjnError {
  constructor(message: string, context?: FjnErrorContext) {
    super({
      code: FJN_ERROR_CODES.VALIDATION,
      message,
      context,
      httpStatus: 400,
    });
    this.name = 'FjnValidationError';
  }
}

// ============================================================
// 资源未找到
// ============================================================

export class FjnNotFoundError extends FjnError {
  constructor(message: string, context?: FjnErrorContext) {
    super({
      code: FJN_ERROR_CODES.NOT_FOUND,
      message,
      context,
      httpStatus: 404,
    });
    this.name = 'FjnNotFoundError';
  }
}

// ============================================================
// 冲突（唯一约束 / 重复 / 锁）
// ============================================================

export class FjnConflictError extends FjnError {
  constructor(message: string, context?: FjnErrorContext) {
    super({
      code: FJN_ERROR_CODES.CONFLICT,
      message,
      context,
      httpStatus: 409,
    });
    this.name = 'FjnConflictError';
  }
}

// ============================================================
// 未授权
// ============================================================

export class FjnUnauthorizedError extends FjnError {
  constructor(message: string, context?: FjnErrorContext) {
    super({
      code: FJN_ERROR_CODES.UNAUTHORIZED,
      message,
      context,
      httpStatus: 401,
    });
    this.name = 'FjnUnauthorizedError';
  }
}

// ============================================================
// 权限不足
// ============================================================

export class FjnForbiddenError extends FjnError {
  constructor(message: string, context?: FjnErrorContext) {
    super({
      code: FJN_ERROR_CODES.FORBIDDEN,
      message,
      context,
      httpStatus: 403,
    });
    this.name = 'FjnForbiddenError';
  }
}

// ============================================================
// 业务规则违反（非状态机类）
// ============================================================

export class FjnBusinessRuleError extends FjnError {
  constructor(message: string, context?: FjnErrorContext) {
    super({
      code: FJN_ERROR_CODES.BUSINESS_RULE,
      message,
      context,
      httpStatus: 422,
    });
    this.name = 'FjnBusinessRuleError';
  }
}

// ============================================================
// 状态机非法转移
// ============================================================

export class FjnStateMachineError extends FjnError {
  constructor(message: string, context?: FjnErrorContext) {
    super({
      code: FJN_ERROR_CODES.STATE_MACHINE,
      message,
      context,
      httpStatus: 422,
    });
    this.name = 'FjnStateMachineError';
  }
}

// ============================================================
// 余额不足
// ============================================================

export class FjnInsufficientBalanceError extends FjnError {
  constructor(message: string, context?: FjnErrorContext) {
    super({
      code: FJN_ERROR_CODES.INSUFFICIENT_BALANCE,
      message,
      context,
      httpStatus: 422,
    });
    this.name = 'FjnInsufficientBalanceError';
  }
}

// ============================================================
// KYC 等级不足
// ============================================================

export class FjnKycRequiredError extends FjnError {
  constructor(message: string, context?: FjnErrorContext) {
    super({
      code: FJN_ERROR_CODES.KYC_REQUIRED,
      message,
      context,
      httpStatus: 403,
    });
    this.name = 'FjnKycRequiredError';
  }
}

// ============================================================
// 地区限制
// ============================================================

export class FjnRegionRestrictedError extends FjnError {
  constructor(message: string, context?: FjnErrorContext) {
    super({
      code: FJN_ERROR_CODES.REGION_RESTRICTED,
      message,
      context,
      httpStatus: 403,
    });
    this.name = 'FjnRegionRestrictedError';
  }
}

// ============================================================
// 外部服务失败
// ============================================================

export class FjnExternalServiceError extends FjnError {
  constructor(message: string, context?: FjnErrorContext) {
    super({
      code: FJN_ERROR_CODES.EXTERNAL_SERVICE,
      message,
      context,
      httpStatus: 502,
    });
    this.name = 'FjnExternalServiceError';
  }
}

// ============================================================
// 限流
// ============================================================

export class FjnRateLimitError extends FjnError {
  constructor(message: string, context?: FjnErrorContext) {
    super({
      code: FJN_ERROR_CODES.RATE_LIMIT,
      message,
      context,
      httpStatus: 429,
    });
    this.name = 'FjnRateLimitError';
  }
}

// ============================================================
// 需要审批
// ============================================================

export class FjnApprovalRequiredError extends FjnError {
  constructor(message: string, context?: FjnErrorContext) {
    super({
      code: FJN_ERROR_CODES.APPROVAL_REQUIRED,
      message,
      context,
      httpStatus: 403,
    });
    this.name = 'FjnApprovalRequiredError';
  }
}
