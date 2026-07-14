/**
 * FJN Payment Service - 错误码常量 + 异常类
 *
 * 严格遵循 H021 §4 + 工业级分层：
 *  - 错误码使用 SCREAMING_SNAKE_CASE
 *  - 错误码映射到对应异常类与 HTTP 状态码
 *  - 错误码可在 API 响应中直接暴露给客户端
 *
 * 用法：
 *   throw new FjnPaymentNotFoundError({ paymentId });
 */

import { FjnError, FjnErrorContext } from '../errors';

// ============================================================
// 错误码定义
// ============================================================

export const PAYMENT_ERROR_CODES = {
  // 资源类
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  PAYMENT_CALLBACK_NOT_FOUND: 'PAYMENT_CALLBACK_NOT_FOUND',
  REFUND_NOT_FOUND: 'REFUND_NOT_FOUND',
  REFUND_ADJUSTMENT_NOT_FOUND: 'REFUND_ADJUSTMENT_NOT_FOUND',

  // 状态机类
  PAYMENT_STATUS_INVALID: 'PAYMENT_STATUS_INVALID',
  PAYMENT_ALREADY_SUCCESS: 'PAYMENT_ALREADY_SUCCESS',
  PAYMENT_ALREADY_FAILED: 'PAYMENT_ALREADY_FAILED',
  PAYMENT_ALREADY_EXPIRED: 'PAYMENT_ALREADY_EXPIRED',
  PAYMENT_TERMINAL_STATUS: 'PAYMENT_TERMINAL_STATUS',
  PAYMENT_NOT_REFUNDABLE: 'PAYMENT_NOT_REFUNDABLE',
  REFUND_STATUS_INVALID: 'REFUND_STATUS_INVALID',
  REFUND_ALREADY_APPROVED: 'REFUND_ALREADY_APPROVED',
  REFUND_ALREADY_REJECTED: 'REFUND_ALREADY_REJECTED',
  REFUND_TERMINAL_STATUS: 'REFUND_TERMINAL_STATUS',

  // 业务字段类
  PAYMENT_AMOUNT_INVALID: 'PAYMENT_AMOUNT_INVALID',
  PAYMENT_AMOUNT_MISMATCH: 'PAYMENT_AMOUNT_MISMATCH',
  PAYMENT_CURRENCY_MISMATCH: 'PAYMENT_CURRENCY_MISMATCH',
  PAYMENT_METHOD_INVALID: 'PAYMENT_METHOD_INVALID',
  PAYMENT_METHOD_REQUIRED: 'PAYMENT_METHOD_REQUIRED',
  PAYMENT_USER_REQUIRED: 'PAYMENT_USER_REQUIRED',
  PAYMENT_ORDER_REQUIRED: 'PAYMENT_ORDER_REQUIRED',
  REFUND_AMOUNT_INVALID: 'REFUND_AMOUNT_INVALID',
  REFUND_AMOUNT_EXCEEDS: 'REFUND_AMOUNT_EXCEEDS',
  REFUND_REASON_REQUIRED: 'REFUND_REASON_REQUIRED',
  REFUND_REASON_DETAIL_REQUIRED: 'REFUND_REASON_DETAIL_REQUIRED',
  REFUND_EVIDENCE_REQUIRED: 'REFUND_EVIDENCE_REQUIRED',
  REFUND_CURRENCY_MISMATCH: 'REFUND_CURRENCY_MISMATCH',
  PAYMENT_CHANNEL_INVALID: 'PAYMENT_CHANNEL_INVALID',
  PAYMENT_CURRENCY_REQUIRED: 'PAYMENT_CURRENCY_REQUIRED',

  // 唯一性校验
  PAYMENT_TX_HASH_DUPLICATED: 'PAYMENT_TX_HASH_DUPLICATED',
  PAYMENT_CALLBACK_DUPLICATED: 'PAYMENT_CALLBACK_DUPLICATED',

  // 回调类
  PAYMENT_CALLBACK_SIGNATURE_INVALID: 'PAYMENT_CALLBACK_SIGNATURE_INVALID',
  PAYMENT_CALLBACK_PROCESSED: 'PAYMENT_CALLBACK_PROCESSED',

  // 过期
  PAYMENT_EXPIRED: 'PAYMENT_EXPIRED',
  PAYMENT_EXPIRING_SOON: 'PAYMENT_EXPIRING_SOON',

  // 关联资源
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_NOT_PAYABLE: 'ORDER_NOT_PAYABLE',
  ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',

  // 幂等
  IDEMPOTENCY_KEY_CONFLICT: 'IDEMPOTENCY_KEY_CONFLICT',

  // 提供者
  PAYMENT_PROVIDER_ERROR: 'PAYMENT_PROVIDER_ERROR',
  PAYMENT_PROVIDER_UNAVAILABLE: 'PAYMENT_PROVIDER_UNAVAILABLE',

  // 内部
  INTERNAL: 'FJN_INTERNAL',
} as const;

export type FjnPaymentErrorCode = (typeof PAYMENT_ERROR_CODES)[keyof typeof PAYMENT_ERROR_CODES];

// ============================================================
// 异常工厂
// ============================================================

/**
 * 通用 Payment 异常工厂
 */
export class FjnPaymentError extends FjnError {
  constructor(
    code: FjnPaymentErrorCode,
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
    this.name = 'FjnPaymentError';
  }
}

/** 支付单未找到 */
export class FjnPaymentNotFoundError extends FjnPaymentError {
  constructor(message: string = '支付单不存在', context?: FjnErrorContext) {
    super(PAYMENT_ERROR_CODES.PAYMENT_NOT_FOUND, message, context, 404);
    this.name = 'FjnPaymentNotFoundError';
  }
}

/** 支付单状态非法 */
export class FjnPaymentStatusInvalidError extends FjnPaymentError {
  constructor(message: string = '支付单状态非法', context?: FjnErrorContext) {
    super(PAYMENT_ERROR_CODES.PAYMENT_STATUS_INVALID, message, context, 422);
    this.name = 'FjnPaymentStatusInvalidError';
  }
}

/** 支付金额非法 */
export class FjnPaymentAmountInvalidError extends FjnPaymentError {
  constructor(message: string = '支付金额非法', context?: FjnErrorContext) {
    super(PAYMENT_ERROR_CODES.PAYMENT_AMOUNT_INVALID, message, context, 422);
    this.name = 'FjnPaymentAmountInvalidError';
  }
}

/** 支付金额不一致 */
export class FjnPaymentAmountMismatchError extends FjnPaymentError {
  constructor(message: string = '支付金额与订单金额不一致', context?: FjnErrorContext) {
    super(PAYMENT_ERROR_CODES.PAYMENT_AMOUNT_MISMATCH, message, context, 422);
    this.name = 'FjnPaymentAmountMismatchError';
  }
}

/** 支付币种不一致 */
export class FjnPaymentCurrencyMismatchError extends FjnPaymentError {
  constructor(message: string = '支付币种与订单币种不一致', context?: FjnErrorContext) {
    super(PAYMENT_ERROR_CODES.PAYMENT_CURRENCY_MISMATCH, message, context, 422);
    this.name = 'FjnPaymentCurrencyMismatchError';
  }
}

/** tx_hash 重复 */
export class FjnPaymentTxHashDuplicatedError extends FjnPaymentError {
  constructor(message: string = '交易哈希已存在', context?: FjnErrorContext) {
    super(PAYMENT_ERROR_CODES.PAYMENT_TX_HASH_DUPLICATED, message, context, 409);
    this.name = 'FjnPaymentTxHashDuplicatedError';
  }
}

/** 退款单未找到 */
export class FjnRefundNotFoundError extends FjnPaymentError {
  constructor(message: string = '退款单不存在', context?: FjnErrorContext) {
    super(PAYMENT_ERROR_CODES.REFUND_NOT_FOUND, message, context, 404);
    this.name = 'FjnRefundNotFoundError';
  }
}

/** 退款状态非法 */
export class FjnRefundStatusInvalidError extends FjnPaymentError {
  constructor(message: string = '退款单状态非法', context?: FjnErrorContext) {
    super(PAYMENT_ERROR_CODES.REFUND_STATUS_INVALID, message, context, 422);
    this.name = 'FjnRefundStatusInvalidError';
  }
}

/** 退款金额非法 */
export class FjnRefundAmountInvalidError extends FjnPaymentError {
  constructor(message: string = '退款金额非法', context?: FjnErrorContext) {
    super(PAYMENT_ERROR_CODES.REFUND_AMOUNT_INVALID, message, context, 422);
    this.name = 'FjnRefundAmountInvalidError';
  }
}

/** 回调签名无效 */
export class FjnPaymentCallbackSignatureInvalidError extends FjnPaymentError {
  constructor(message: string = '支付回调签名校验失败', context?: FjnErrorContext) {
    super(PAYMENT_ERROR_CODES.PAYMENT_CALLBACK_SIGNATURE_INVALID, message, context, 401);
    this.name = 'FjnPaymentCallbackSignatureInvalidError';
  }
}

/** 支付单已过期 */
export class FjnPaymentExpiredError extends FjnPaymentError {
  constructor(message: string = '支付单已过期', context?: FjnErrorContext) {
    super(PAYMENT_ERROR_CODES.PAYMENT_EXPIRED, message, context, 410);
    this.name = 'FjnPaymentExpiredError';
  }
}

/** 订单不可支付 */
export class FjnOrderNotPayableError extends FjnPaymentError {
  constructor(message: string = '订单不可支付', context?: FjnErrorContext) {
    super(PAYMENT_ERROR_CODES.ORDER_NOT_PAYABLE, message, context, 422);
    this.name = 'FjnOrderNotPayableError';
  }
}
