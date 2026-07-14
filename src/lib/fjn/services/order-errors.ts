/**
 * FJN Order Service - 错误码常量
 *
 * 严格遵循 H020 §4 + 工业级分层：
 *  - 错误码使用 SCREAMING_SNAKE_CASE
 *  - 错误码映射到对应异常类与 HTTP 状态码
 *  - 错误码可在 API 响应中直接暴露给客户端
 *
 * 用法：
 *   throw new OrderNotFoundError(ORDER_ERROR_CODES.ORDER_NOT_FOUND, { orderId });
 */

import { FjnError, FjnErrorContext } from '../errors';

// ============================================================
// 错误码定义
// ============================================================

export const ORDER_ERROR_CODES = {
  // 资源类
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_ITEM_NOT_FOUND: 'ORDER_ITEM_NOT_FOUND',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  REFUND_NOT_FOUND: 'REFUND_NOT_FOUND',
  FULFILLMENT_NOT_FOUND: 'FULFILLMENT_NOT_FOUND',

  // 状态机类
  ORDER_STATUS_INVALID: 'ORDER_STATUS_INVALID',
  ORDER_CANNOT_BE_CANCELLED: 'ORDER_CANNOT_BE_CANCELLED',
  ORDER_CANNOT_BE_PAID: 'ORDER_CANNOT_BE_PAID',
  ORDER_CANNOT_BE_CONFIRMED: 'ORDER_CANNOT_BE_CONFIRMED',
  ORDER_CANNOT_BE_FULFILLED: 'ORDER_CANNOT_BE_FULFILLED',
  ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',
  ORDER_ALREADY_CANCELLED: 'ORDER_ALREADY_CANCELLED',
  ORDER_ALREADY_REFUNDED: 'ORDER_ALREADY_REFUNDED',
  ORDER_TERMINAL_STATUS: 'ORDER_TERMINAL_STATUS',

  // 业务字段类
  ORDER_PRODUCT_REQUIRED: 'ORDER_PRODUCT_REQUIRED',
  ORDER_AMOUNT_INVALID: 'ORDER_AMOUNT_INVALID',
  ORDER_QUANTITY_INVALID: 'ORDER_QUANTITY_INVALID',
  ORDER_USER_REQUIRED: 'ORDER_USER_REQUIRED',
  ORDER_CURRENCY_MISMATCH: 'ORDER_CURRENCY_MISMATCH',
  ORDER_ADDRESS_REQUIRED: 'ORDER_ADDRESS_REQUIRED',

  // 关联资源类
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_NOT_ACTIVE: 'PRODUCT_NOT_ACTIVE',
  PRODUCT_OUT_OF_STOCK: 'PRODUCT_OUT_OF_STOCK',
  PRODUCT_REGIONAL_RESTRICTED: 'PRODUCT_REGIONAL_RESTRICTED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_NOT_ALLOWED_TO_ORDER: 'USER_NOT_ALLOWED_TO_ORDER',
  USER_KYC_REQUIRED: 'USER_KYC_REQUIRED',

  // 风险控制类
  ORDER_RISK_HOLD: 'ORDER_RISK_HOLD',
  ORDER_REGION_BLOCKED: 'ORDER_REGION_BLOCKED',
  ORDER_STOCK_INSUFFICIENT: 'ORDER_STOCK_INSUFFICIENT',
  ORDER_BLACKLIST_HIT: 'ORDER_BLACKLIST_HIT',
  ORDER_DEVICE_ABNORMAL: 'ORDER_DEVICE_ABNORMAL',

  // 履约类
  FULFILLMENT_FAILED: 'FULFILLMENT_FAILED',
  FULFILLMENT_INVALID_STATUS: 'FULFILLMENT_INVALID_STATUS',
  SHIPPING_ADDRESS_REQUIRED: 'SHIPPING_ADDRESS_REQUIRED',
  NFT_MINT_FAILED: 'NFT_MINT_FAILED',
  POINTS_ISSUE_FAILED: 'POINTS_ISSUE_FAILED',

  // 退款类
  REFUND_AMOUNT_INVALID: 'REFUND_AMOUNT_INVALID',
  REFUND_WINDOW_EXPIRED: 'REFUND_WINDOW_EXPIRED',
  REFUND_ALREADY_REQUESTED: 'REFUND_ALREADY_REQUESTED',

  // 幂等类
  IDEMPOTENCY_KEY_CONFLICT: 'IDEMPOTENCY_KEY_CONFLICT',

  // 内部
  INTERNAL: 'FJN_INTERNAL',
} as const;

export type FjnOrderErrorCode = (typeof ORDER_ERROR_CODES)[keyof typeof ORDER_ERROR_CODES];

// ============================================================
// 异常工厂
// ============================================================

/**
 * 通用 Order 异常工厂
 *
 * 用法：
 *   throw new FjnOrderError(ORDER_ERROR_CODES.ORDER_NOT_FOUND, '订单不存在', { orderId });
 */
export class FjnOrderError extends FjnError {
  constructor(
    code: FjnOrderErrorCode,
    message: string,
    context?: FjnErrorContext,
    httpStatus?: number
  ) {
    super({
      code: code as any, // FjnErrorCode 兼容
      message,
      context,
      httpStatus: httpStatus ?? 400,
    });
    this.name = 'FjnOrderError';
  }
}

/** 订单未找到 */
export class FjnOrderNotFoundError extends FjnOrderError {
  constructor(message: string = '订单不存在', context?: FjnErrorContext) {
    super(ORDER_ERROR_CODES.ORDER_NOT_FOUND, message, context, 404);
    this.name = 'FjnOrderNotFoundError';
  }
}

/** 订单状态非法 */
export class FjnOrderStatusInvalidError extends FjnOrderError {
  constructor(message: string = '订单状态非法', context?: FjnErrorContext) {
    super(ORDER_ERROR_CODES.ORDER_STATUS_INVALID, message, context, 422);
    this.name = 'FjnOrderStatusInvalidError';
  }
}

/** 商品不可用 */
export class FjnProductNotActiveError extends FjnOrderError {
  constructor(message: string = '商品未上架', context?: FjnErrorContext) {
    super(ORDER_ERROR_CODES.PRODUCT_NOT_ACTIVE, message, context, 422);
    this.name = 'FjnProductNotActiveError';
  }
}

/** 库存不足 */
export class FjnStockInsufficientError extends FjnOrderError {
  constructor(message: string = '库存不足', context?: FjnErrorContext) {
    super(ORDER_ERROR_CODES.ORDER_STOCK_INSUFFICIENT, message, context, 422);
    this.name = 'FjnStockInsufficientError';
  }
}

/** 金额非法 */
export class FjnOrderAmountInvalidError extends FjnOrderError {
  constructor(message: string = '订单金额非法', context?: FjnErrorContext) {
    super(ORDER_ERROR_CODES.ORDER_AMOUNT_INVALID, message, context, 422);
    this.name = 'FjnOrderAmountInvalidError';
  }
}

/** 地区限制 */
export class FjnOrderRegionBlockedError extends FjnOrderError {
  constructor(message: string = '当前地区不可购买', context?: FjnErrorContext) {
    super(ORDER_ERROR_CODES.ORDER_REGION_BLOCKED, message, context, 403);
    this.name = 'FjnOrderRegionBlockedError';
  }
}
