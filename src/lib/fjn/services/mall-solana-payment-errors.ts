/**
 * Mall Solana Payment Service - 错误码 + 异常类
 */

import { FjnError, FjnErrorContext } from '../errors';

export const MALL_SOLANA_PAYMENT_ERROR_CODES = {
  MALL_INTENT_NOT_FOUND: 'MALL_INTENT_NOT_FOUND',
  MALL_INTENT_ALREADY_PAID: 'MALL_INTENT_ALREADY_PAID',
  MALL_INTENT_EXPIRED: 'MALL_INTENT_EXPIRED',
  MALL_INTENT_CANCELLED: 'MALL_INTENT_CANCELLED',
  MALL_INTENT_AMOUNT_INVALID: 'MALL_INTENT_AMOUNT_INVALID',
  MALL_INTENT_AMOUNT_MISMATCH: 'MALL_INTENT_AMOUNT_MISMATCH',
  MALL_INTENT_CREATION_FAILED: 'MALL_INTENT_CREATION_FAILED',
  MALL_INTENT_TX_HASH_DUPLICATE: 'MALL_INTENT_TX_HASH_DUPLICATE',

  MALL_ORDER_NOT_FOUND: 'MALL_ORDER_NOT_FOUND',
  MALL_ORDER_STATUS_INVALID: 'MALL_ORDER_STATUS_INVALID',
  MALL_ORDER_NOT_PAYABLE: 'MALL_ORDER_NOT_PAYABLE',
  MALL_ORDER_ALREADY_PAID: 'MALL_ORDER_ALREADY_PAID',
  MALL_ORDER_NOT_REFUNDABLE: 'MALL_ORDER_NOT_REFUNDABLE',
  MALL_ORDER_AMOUNT_INVALID: 'MALL_ORDER_AMOUNT_INVALID',

  MALL_PRODUCT_NOT_FOUND: 'MALL_PRODUCT_NOT_FOUND',
  MALL_PRODUCT_NOT_ACTIVE: 'MALL_PRODUCT_NOT_ACTIVE',
  MALL_PRODUCT_STOCK_INSUFFICIENT: 'MALL_PRODUCT_STOCK_INSUFFICIENT',
  MALL_PRODUCT_PRICE_INVALID: 'MALL_PRODUCT_PRICE_INVALID',

  MALL_COUPON_NOT_FOUND: 'MALL_COUPON_NOT_FOUND',
  MALL_COUPON_NOT_ACTIVE: 'MALL_COUPON_NOT_ACTIVE',
  MALL_COUPON_EXPIRED: 'MALL_COUPON_EXPIRED',
  MALL_COUPON_MIN_SPEND_NOT_MET: 'MALL_COUPON_MIN_SPEND_NOT_MET',
  MALL_COUPON_SUPPLY_EXHAUSTED: 'MALL_COUPON_SUPPLY_EXHAUSTED',

  MALL_REFUND_NOT_FOUND: 'MALL_REFUND_NOT_FOUND',
  MALL_REFUND_STATUS_INVALID: 'MALL_REFUND_STATUS_INVALID',
  MALL_REFUND_AMOUNT_INVALID: 'MALL_REFUND_AMOUNT_INVALID',
  MALL_REFUND_AMOUNT_EXCEEDS: 'MALL_REFUND_AMOUNT_EXCEEDS',
  MALL_REFUND_NOT_APPROVABLE: 'MALL_REFUND_NOT_APPROVABLE',
  MALL_REFUND_SOLANA_FAILED: 'MALL_REFUND_SOLANA_FAILED',

  MALL_SETTLEMENT_NOT_FOUND: 'MALL_SETTLEMENT_NOT_FOUND',
  MALL_SETTLEMENT_ALREADY_PAID: 'MALL_SETTLEMENT_ALREADY_PAID',
  MALL_SETTLEMENT_NOT_APPROVABLE: 'MALL_SETTLEMENT_NOT_APPROVABLE',
  MALL_SETTLEMENT_AMOUNT_INVALID: 'MALL_SETTLEMENT_AMOUNT_INVALID',

  MALL_PAYMENT_METHOD_INVALID: 'MALL_PAYMENT_METHOD_INVALID',
  MALL_USER_ID_REQUIRED: 'MALL_USER_ID_REQUIRED',
  MALL_PLATFORM_FEE_CALC_FAILED: 'MALL_PLATFORM_FEE_CALC_FAILED',
} as const;

export type FjnMallSolanaPaymentErrorCode = (typeof MALL_SOLANA_PAYMENT_ERROR_CODES)[keyof typeof MALL_SOLANA_PAYMENT_ERROR_CODES];

export class FjnMallSolanaPaymentError extends FjnError {
  constructor(code: FjnMallSolanaPaymentErrorCode, message: string, context?: FjnErrorContext, httpStatus?: number) {
    super({ code: code as any, message, context, httpStatus });
    this.name = 'FjnMallSolanaPaymentError';
  }
}

// Intent
export class MallIntentNotFoundError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_INTENT_NOT_FOUND, 'Mall payment intent not found', context, 404);
  }
}
export class MallIntentAlreadyPaidError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_INTENT_ALREADY_PAID, 'Mall payment intent is already paid', context, 409);
  }
}
export class MallIntentExpiredError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_INTENT_EXPIRED, 'Mall payment intent is expired', context, 410);
  }
}
export class MallIntentCancelledError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_INTENT_CANCELLED, 'Mall payment intent is cancelled', context, 409);
  }
}
export class MallIntentAmountInvalidError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_INTENT_AMOUNT_INVALID, 'Mall payment intent amount is invalid', context, 400);
  }
}
export class MallIntentAmountMismatchError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_INTENT_AMOUNT_MISMATCH, 'Mall payment intent amount mismatch', context, 422);
  }
}
export class MallIntentCreationFailedError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_INTENT_CREATION_FAILED, 'Mall payment intent creation failed', context, 502);
  }
}
export class MallIntentTxHashDuplicateError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_INTENT_TX_HASH_DUPLICATE, 'Mall payment intent txHash is duplicated', context, 409);
  }
}

// Order
export class MallOrderNotFoundError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_ORDER_NOT_FOUND, 'Mall order not found', context, 404);
  }
}
export class MallOrderStatusInvalidError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_ORDER_STATUS_INVALID, 'Mall order status invalid', context, 409);
  }
}
export class MallOrderNotPayableError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_ORDER_NOT_PAYABLE, 'Mall order is not payable', context, 409);
  }
}
export class MallOrderAlreadyPaidError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_ORDER_ALREADY_PAID, 'Mall order is already paid', context, 409);
  }
}
export class MallOrderNotRefundableError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_ORDER_NOT_REFUNDABLE, 'Mall order is not refundable', context, 409);
  }
}
export class MallOrderAmountInvalidError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_ORDER_AMOUNT_INVALID, 'Mall order amount is invalid', context, 400);
  }
}

// Product
export class MallProductNotFoundError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_PRODUCT_NOT_FOUND, 'Mall product not found', context, 404);
  }
}
export class MallProductNotActiveError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_PRODUCT_NOT_ACTIVE, 'Mall product is not active', context, 409);
  }
}
export class MallProductStockInsufficientError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_PRODUCT_STOCK_INSUFFICIENT, 'Mall product stock is insufficient', context, 422);
  }
}
export class MallProductPriceInvalidError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_PRODUCT_PRICE_INVALID, 'Mall product price is invalid', context, 400);
  }
}

// Coupon
export class MallCouponNotFoundError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_COUPON_NOT_FOUND, 'Mall coupon not found', context, 404);
  }
}
export class MallCouponNotActiveError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_COUPON_NOT_ACTIVE, 'Mall coupon is not active', context, 409);
  }
}
export class MallCouponExpiredError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_COUPON_EXPIRED, 'Mall coupon is expired', context, 410);
  }
}
export class MallCouponMinSpendNotMetError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_COUPON_MIN_SPEND_NOT_MET, 'Mall coupon minimum spend not met', context, 422);
  }
}
export class MallCouponSupplyExhaustedError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_COUPON_SUPPLY_EXHAUSTED, 'Mall coupon supply exhausted', context, 410);
  }
}

// Refund
export class MallRefundNotFoundError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_REFUND_NOT_FOUND, 'Mall refund not found', context, 404);
  }
}
export class MallRefundStatusInvalidError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_REFUND_STATUS_INVALID, 'Mall refund status invalid', context, 409);
  }
}
export class MallRefundAmountInvalidError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_REFUND_AMOUNT_INVALID, 'Mall refund amount is invalid', context, 400);
  }
}
export class MallRefundAmountExceedsError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_REFUND_AMOUNT_EXCEEDS, 'Mall refund amount exceeds original payment', context, 422);
  }
}
export class MallRefundNotApprovableError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_REFUND_NOT_APPROVABLE, 'Mall refund is not approvable', context, 409);
  }
}
export class MallRefundSolanaFailedError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_REFUND_SOLANA_FAILED, 'Solana on-chain mall refund failed', context, 502);
  }
}

// Settlement
export class MallSettlementNotFoundError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_SETTLEMENT_NOT_FOUND, 'Mall settlement not found', context, 404);
  }
}
export class MallSettlementAlreadyPaidError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_SETTLEMENT_ALREADY_PAID, 'Mall settlement is already paid', context, 409);
  }
}
export class MallSettlementNotApprovableError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_SETTLEMENT_NOT_APPROVABLE, 'Mall settlement is not approvable', context, 409);
  }
}
export class MallSettlementAmountInvalidError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_SETTLEMENT_AMOUNT_INVALID, 'Mall settlement amount is invalid', context, 400);
  }
}

// General
export class MallPaymentMethodInvalidError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_PAYMENT_METHOD_INVALID, 'Mall payment method is invalid', context, 400);
  }
}
export class MallUserIdRequiredError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_USER_ID_REQUIRED, 'Mall userId is required', context, 400);
  }
}
export class MallPlatformFeeCalcFailedError extends FjnMallSolanaPaymentError {
  constructor(context?: FjnErrorContext) {
    super(MALL_SOLANA_PAYMENT_ERROR_CODES.MALL_PLATFORM_FEE_CALC_FAILED, 'Mall platform fee calculation failed', context, 500);
  }
}
