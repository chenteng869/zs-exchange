/**
 * DAppX Mall Service - 错误码 + 异常类
 *
 * 工业级 Solana-first 架构
 * 错误码格式：DAPPX_MALL_<DOMAIN>_<NUMBER>（全大写）
 */

import { FjnError, type FjnErrorContext } from '../errors';

// ============================================================
// 错误码定义
// ============================================================
export const DAPPX_MALL_ERROR_CODES = {
  // 商户域 (1000-1099)
  MERCHANT_NOT_FOUND: 'DAPPX_MALL_MERCHANT_NOT_FOUND',
  MERCHANT_ALREADY_EXISTS: 'DAPPX_MALL_MERCHANT_ALREADY_EXISTS',
  MERCHANT_CLOSED: 'DAPPX_MALL_MERCHANT_CLOSED',
  MERCHANT_NOT_OPERABLE: 'DAPPX_MALL_MERCHANT_NOT_OPERABLE',
  MERCHANT_NOT_ACTIVE: 'DAPPX_MALL_MERCHANT_NOT_ACTIVE',
  MERCHANT_BLACKLISTED: 'DAPPX_MALL_MERCHANT_BLACKLISTED',
  MERCHANT_STATUS_INVALID: 'DAPPX_MALL_MERCHANT_STATUS_INVALID',
  MERCHANT_STATUS_TRANSITION_FORBIDDEN: 'DAPPX_MALL_MERCHANT_STATUS_TRANSITION_FORBIDDEN',
  MERCHANT_KYB_REQUIRED: 'DAPPX_MALL_MERCHANT_KYB_REQUIRED',
  MERCHANT_NAME_REQUIRED: 'DAPPX_MALL_MERCHANT_NAME_REQUIRED',
  MERCHANT_LEGAL_NAME_REQUIRED: 'DAPPX_MALL_MERCHANT_LEGAL_NAME_REQUIRED',
  MERCHANT_CONTACT_INVALID: 'DAPPX_MALL_MERCHANT_CONTACT_INVALID',
  MERCHANT_COUNTRY_CODE_INVALID: 'DAPPX_MALL_MERCHANT_COUNTRY_CODE_INVALID',
  MERCHANT_CATEGORY_INVALID: 'DAPPX_MALL_MERCHANT_CATEGORY_INVALID',
  MERCHANT_PLATFORM_FEE_INVALID: 'DAPPX_MALL_MERCHANT_PLATFORM_FEE_INVALID',
  MERCHANT_APPROVAL_REQUIRED: 'DAPPX_MALL_MERCHANT_APPROVAL_REQUIRED',

  // 商品域 (1100-1199)
  PRODUCT_NOT_FOUND: 'DAPPX_MALL_PRODUCT_NOT_FOUND',
  PRODUCT_ALREADY_EXISTS: 'DAPPX_MALL_PRODUCT_ALREADY_EXISTS',
  PRODUCT_DELETED: 'DAPPX_MALL_PRODUCT_DELETED',
  PRODUCT_ARCHIVED: 'DAPPX_MALL_PRODUCT_ARCHIVED',
  PRODUCT_NOT_PURCHASABLE: 'DAPPX_MALL_PRODUCT_NOT_PURCHASABLE',
  PRODUCT_STATUS_INVALID: 'DAPPX_MALL_PRODUCT_STATUS_INVALID',
  PRODUCT_STATUS_TRANSITION_FORBIDDEN: 'DAPPX_MALL_PRODUCT_STATUS_TRANSITION_FORBIDDEN',
  PRODUCT_NAME_REQUIRED: 'DAPPX_MALL_PRODUCT_NAME_REQUIRED',
  PRODUCT_NAME_TOO_LONG: 'DAPPX_MALL_PRODUCT_NAME_TOO_LONG',
  PRODUCT_PRICE_INVALID: 'DAPPX_MALL_PRODUCT_PRICE_INVALID',
  PRODUCT_PRICE_OUT_OF_RANGE: 'DAPPX_MALL_PRODUCT_PRICE_OUT_OF_RANGE',
  PRODUCT_CURRENCY_INVALID: 'DAPPX_MALL_PRODUCT_CURRENCY_INVALID',
  PRODUCT_STOCK_INVALID: 'DAPPX_MALL_PRODUCT_STOCK_INVALID',
  PRODUCT_STOCK_INSUFFICIENT: 'DAPPX_MALL_PRODUCT_STOCK_INSUFFICIENT',
  PRODUCT_STOCK_CHANGE_TYPE_INVALID: 'DAPPX_MALL_PRODUCT_STOCK_CHANGE_TYPE_INVALID',
  PRODUCT_MERCHANT_MISMATCH: 'DAPPX_MALL_PRODUCT_MERCHANT_MISMATCH',
  PRODUCT_GALLERY_LIMIT_EXCEEDED: 'DAPPX_MALL_PRODUCT_GALLERY_LIMIT_EXCEEDED',

  // 订单域 (1200-1299)
  ORDER_NOT_FOUND: 'DAPPX_MALL_ORDER_NOT_FOUND',
  ORDER_ALREADY_PAID: 'DAPPX_MALL_ORDER_ALREADY_PAID',
  ORDER_NOT_CANCELLABLE: 'DAPPX_MALL_ORDER_NOT_CANCELLABLE',
  ORDER_NOT_PAYABLE: 'DAPPX_MALL_ORDER_NOT_PAYABLE',
  ORDER_NOT_SHIPPABLE: 'DAPPX_MALL_ORDER_NOT_SHIPPABLE',
  ORDER_NOT_REFUNDABLE: 'DAPPX_MALL_ORDER_NOT_REFUNDABLE',
  ORDER_NOT_COMPLETABLE: 'DAPPX_MALL_ORDER_NOT_COMPLETABLE',
  ORDER_STATUS_INVALID: 'DAPPX_MALL_ORDER_STATUS_INVALID',
  ORDER_STATUS_TRANSITION_FORBIDDEN: 'DAPPX_MALL_ORDER_STATUS_TRANSITION_FORBIDDEN',
  ORDER_QUANTITY_INVALID: 'DAPPX_MALL_ORDER_QUANTITY_INVALID',
  ORDER_AMOUNT_INVALID: 'DAPPX_MALL_ORDER_AMOUNT_INVALID',
  ORDER_PAYMENT_METHOD_INVALID: 'DAPPX_MALL_ORDER_PAYMENT_METHOD_INVALID',
  ORDER_SHIPPING_ADDRESS_REQUIRED: 'DAPPX_MALL_ORDER_SHIPPING_ADDRESS_REQUIRED',
  ORDER_TRACKING_NO_INVALID: 'DAPPX_MALL_ORDER_TRACKING_NO_INVALID',
  ORDER_SHIPPING_COMPANY_INVALID: 'DAPPX_MALL_ORDER_SHIPPING_COMPANY_INVALID',
  ORDER_RISK_HOLD: 'DAPPX_MALL_ORDER_RISK_HOLD',
  ORDER_REFUND_REASON_REQUIRED: 'DAPPX_MALL_ORDER_REFUND_REASON_REQUIRED',
  ORDER_REFUND_AMOUNT_EXCEEDED: 'DAPPX_MALL_ORDER_REFUND_AMOUNT_EXCEEDED',
  ORDER_PAYMENT_EXPIRED: 'DAPPX_MALL_ORDER_PAYMENT_EXPIRED',
  ORDER_ALREADY_SHIPPED: 'DAPPX_MALL_ORDER_ALREADY_SHIPPED',
  ORDER_ALREADY_DELIVERED: 'DAPPX_MALL_ORDER_ALREADY_DELIVERED',
  ORDER_ALREADY_CANCELLED: 'DAPPX_MALL_ORDER_ALREADY_CANCELLED',

  // 物流域 (1300-1399)
  DELIVERY_NOT_FOUND: 'DAPPX_MALL_DELIVERY_NOT_FOUND',
  DELIVERY_STATUS_INVALID: 'DAPPX_MALL_DELIVERY_STATUS_INVALID',
  DELIVERY_STATUS_TRANSITION_FORBIDDEN: 'DAPPX_MALL_DELIVERY_STATUS_TRANSITION_FORBIDDEN',
  DELIVERY_TRACKING_NO_REQUIRED: 'DAPPX_MALL_DELIVERY_TRACKING_NO_REQUIRED',
  DELIVERY_COMPANY_REQUIRED: 'DAPPX_MALL_DELIVERY_COMPANY_REQUIRED',

  // 优惠券域 (1400-1499)
  COUPON_NOT_FOUND: 'DAPPX_MALL_COUPON_NOT_FOUND',
  COUPON_EXPIRED: 'DAPPX_MALL_COUPON_EXPIRED',
  COUPON_PAUSED: 'DAPPX_MALL_COUPON_PAUSED',
  COUPON_DISABLED: 'DAPPX_MALL_COUPON_DISABLED',
  COUPON_NOT_USABLE: 'DAPPX_MALL_COUPON_NOT_USABLE',
  COUPON_SUPPLY_EXHAUSTED: 'DAPPX_MALL_COUPON_SUPPLY_EXHAUSTED',
  COUPON_ALREADY_CLAIMED: 'DAPPX_MALL_COUPON_ALREADY_CLAIMED',
  COUPON_MIN_SPEND_NOT_MET: 'DAPPX_MALL_COUPON_MIN_SPEND_NOT_MET',
  COUPON_USER_SCOPE_NOT_ALLOWED: 'DAPPX_MALL_COUPON_USER_SCOPE_NOT_ALLOWED',
  COUPON_PRODUCT_SCOPE_NOT_MATCHED: 'DAPPX_MALL_COUPON_PRODUCT_SCOPE_NOT_MATCHED',
  COUPON_TYPE_INVALID: 'DAPPX_MALL_COUPON_TYPE_INVALID',
  COUPON_AMOUNT_INVALID: 'DAPPX_MALL_COUPON_AMOUNT_INVALID',

  // 结算域 (1500-1599)
  SETTLEMENT_NOT_FOUND: 'DAPPX_MALL_SETTLEMENT_NOT_FOUND',
  SETTLEMENT_NOT_APPROVABLE: 'DAPPX_MALL_SETTLEMENT_NOT_APPROVABLE',
  SETTLEMENT_NOT_PAYABLE: 'DAPPX_MALL_SETTLEMENT_NOT_PAYABLE',
  SETTLEMENT_NOT_CANCELLABLE: 'DAPPX_MALL_SETTLEMENT_NOT_CANCELLABLE',
  SETTLEMENT_STATUS_INVALID: 'DAPPX_MALL_SETTLEMENT_STATUS_INVALID',
  SETTLEMENT_STATUS_TRANSITION_FORBIDDEN: 'DAPPX_MALL_SETTLEMENT_STATUS_TRANSITION_FORBIDDEN',
  SETTLEMENT_PERIOD_INVALID: 'DAPPX_MALL_SETTLEMENT_PERIOD_INVALID',
  SETTLEMENT_AMOUNT_INVALID: 'DAPPX_MALL_SETTLEMENT_AMOUNT_INVALID',
  SETTLEMENT_ALREADY_EXISTS: 'DAPPX_MALL_SETTLEMENT_ALREADY_EXISTS',
  SETTLEMENT_APPROVAL_REQUIRED: 'DAPPX_MALL_SETTLEMENT_APPROVAL_REQUIRED',
  SETTLEMENT_PLATFORM_FEE_INVALID: 'DAPPX_MALL_SETTLEMENT_PLATFORM_FEE_INVALID',

  // 公共 (1900-1999)
  INTERNAL_ERROR: 'DAPPX_MALL_INTERNAL_ERROR',
  TRANSACTION_FAILED: 'DAPPX_MALL_TRANSACTION_FAILED',
  CONCURRENT_UPDATE: 'DAPPX_MALL_CONCURRENT_UPDATE',
  IDEMPOTENCY_KEY_CONFLICT: 'DAPPX_MALL_IDEMPOTENCY_KEY_CONFLICT',
  UNAUTHORIZED_OPERATION: 'DAPPX_MALL_UNAUTHORIZED_OPERATION',
} as const;

export type FjnDappxMallErrorCode =
  (typeof DAPPX_MALL_ERROR_CODES)[keyof typeof DAPPX_MALL_ERROR_CODES];

export const isFjnDappxMallErrorCode = (c: string): c is FjnDappxMallErrorCode =>
  Object.values(DAPPX_MALL_ERROR_CODES).includes(c as any);

export const getDappxMallErrorCodeCount = (): number =>
  Object.keys(DAPPX_MALL_ERROR_CODES).length;

// ============================================================
// 错误基类
// ============================================================
export class FjnDappxMallError extends FjnError {
  constructor(params: { code: FjnDappxMallErrorCode; message?: string; context?: FjnErrorContext; cause?: unknown }) {
    super({
      code: params.code as any,
      message: params.message ?? params.code,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'FjnDappxMallError';
  }
}

// ============================================================
// 商户错误
// ============================================================
export class MerchantNotFoundError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.MERCHANT_NOT_FOUND,
      message: message ?? `Merchant not found: ${JSON.stringify(ctx)}`,
      context: ctx,
    });
  }
}
export class MerchantAlreadyExistsError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.MERCHANT_ALREADY_EXISTS,
      message: message ?? `Merchant already exists: ${JSON.stringify(ctx)}`,
      context: ctx,
    });
  }
}
export class MerchantClosedError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.MERCHANT_CLOSED,
      message: message ?? 'Merchant is closed',
      context: ctx,
    });
  }
}
export class MerchantNotOperableError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.MERCHANT_NOT_OPERABLE,
      message: message ?? `Merchant is not operable: ${JSON.stringify(ctx)}`,
      context: ctx,
    });
  }
}
export class MerchantNotActiveError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.MERCHANT_NOT_ACTIVE,
      message: message ?? 'Merchant is not active',
      context: ctx,
    });
  }
}
export class MerchantBlacklistedError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.MERCHANT_BLACKLISTED,
      message: message ?? 'Merchant is blacklisted',
      context: ctx,
    });
  }
}
export class MerchantStatusInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.MERCHANT_STATUS_INVALID,
      message: message ?? `Invalid merchant status: ${JSON.stringify(ctx)}`,
      context: ctx,
    });
  }
}
export class MerchantStatusTransitionForbiddenError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.MERCHANT_STATUS_TRANSITION_FORBIDDEN,
      message: message ?? `Illegal merchant status transition: ${JSON.stringify(ctx)}`,
      context: ctx,
    });
  }
}
export class MerchantKybRequiredError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.MERCHANT_KYB_REQUIRED,
      message: message ?? 'Merchant KYB is required',
      context: ctx,
    });
  }
}
export class MerchantNameRequiredError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.MERCHANT_NAME_REQUIRED,
      message: message ?? 'Merchant name is required',
      context: ctx,
    });
  }
}
export class MerchantLegalNameRequiredError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.MERCHANT_LEGAL_NAME_REQUIRED,
      message: message ?? 'Merchant legal name is required',
      context: ctx,
    });
  }
}
export class MerchantContactInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.MERCHANT_CONTACT_INVALID,
      message: message ?? 'Invalid merchant contact info',
      context: ctx,
    });
  }
}
export class MerchantCountryCodeInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.MERCHANT_COUNTRY_CODE_INVALID,
      message: message ?? 'Invalid merchant country code',
      context: ctx,
    });
  }
}
export class MerchantCategoryInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.MERCHANT_CATEGORY_INVALID,
      message: message ?? 'Invalid merchant category',
      context: ctx,
    });
  }
}
export class MerchantPlatformFeeInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.MERCHANT_PLATFORM_FEE_INVALID,
      message: message ?? 'Invalid platform fee rate',
      context: ctx,
    });
  }
}
export class MerchantApprovalRequiredError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.MERCHANT_APPROVAL_REQUIRED,
      message: message ?? 'Merchant approval is required',
      context: ctx,
    });
  }
}

// ============================================================
// 商品错误
// ============================================================
export class ProductNotFoundError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_NOT_FOUND,
      message: message ?? `Product not found: ${JSON.stringify(ctx)}`,
      context: ctx,
    });
  }
}
export class ProductAlreadyExistsError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_ALREADY_EXISTS,
      message: message ?? `Product already exists: ${JSON.stringify(ctx)}`,
      context: ctx,
    });
  }
}
export class ProductDeletedError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_DELETED,
      message: message ?? 'Product has been deleted',
      context: ctx,
    });
  }
}
export class ProductArchivedError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_ARCHIVED,
      message: message ?? 'Product has been archived',
      context: ctx,
    });
  }
}
export class ProductNotPurchasableError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_NOT_PURCHASABLE,
      message: message ?? 'Product is not purchasable',
      context: ctx,
    });
  }
}
export class ProductStatusInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_STATUS_INVALID,
      message: message ?? 'Invalid product status',
      context: ctx,
    });
  }
}
export class ProductStatusTransitionForbiddenError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_STATUS_TRANSITION_FORBIDDEN,
      message: message ?? 'Illegal product status transition',
      context: ctx,
    });
  }
}
export class ProductNameRequiredError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_NAME_REQUIRED,
      message: message ?? 'Product name is required',
      context: ctx,
    });
  }
}
export class ProductNameTooLongError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_NAME_TOO_LONG,
      message: message ?? 'Product name too long',
      context: ctx,
    });
  }
}
export class ProductPriceInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_PRICE_INVALID,
      message: message ?? 'Invalid product price',
      context: ctx,
    });
  }
}
export class ProductPriceOutOfRangeError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_PRICE_OUT_OF_RANGE,
      message: message ?? 'Product price out of range',
      context: ctx,
    });
  }
}
export class ProductCurrencyInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_CURRENCY_INVALID,
      message: message ?? 'Invalid product currency',
      context: ctx,
    });
  }
}
export class ProductStockInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_STOCK_INVALID,
      message: message ?? 'Invalid product stock',
      context: ctx,
    });
  }
}
export class ProductStockInsufficientError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_STOCK_INSUFFICIENT,
      message: message ?? 'Product stock insufficient',
      context: ctx,
    });
  }
}
export class ProductStockChangeTypeInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_STOCK_CHANGE_TYPE_INVALID,
      message: message ?? 'Invalid stock change type',
      context: ctx,
    });
  }
}
export class ProductMerchantMismatchError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_MERCHANT_MISMATCH,
      message: message ?? 'Product does not belong to merchant',
      context: ctx,
    });
  }
}
export class ProductGalleryLimitExceededError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.PRODUCT_GALLERY_LIMIT_EXCEEDED,
      message: message ?? 'Product gallery limit exceeded',
      context: ctx,
    });
  }
}

// ============================================================
// 订单错误
// ============================================================
export class OrderNotFoundError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_NOT_FOUND,
      message: message ?? `Order not found: ${JSON.stringify(ctx)}`,
      context: ctx,
    });
  }
}
export class OrderAlreadyPaidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_ALREADY_PAID,
      message: message ?? 'Order already paid',
      context: ctx,
    });
  }
}
export class OrderNotCancellableError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_NOT_CANCELLABLE,
      message: message ?? 'Order cannot be cancelled in current state',
      context: ctx,
    });
  }
}
export class OrderNotPayableError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_NOT_PAYABLE,
      message: message ?? 'Order is not in payable state',
      context: ctx,
    });
  }
}
export class OrderNotShippableError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_NOT_SHIPPABLE,
      message: message ?? 'Order is not in shippable state',
      context: ctx,
    });
  }
}
export class OrderNotRefundableError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_NOT_REFUNDABLE,
      message: message ?? 'Order is not refundable',
      context: ctx,
    });
  }
}
export class OrderNotCompletableError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_NOT_COMPLETABLE,
      message: message ?? 'Order is not completable',
      context: ctx,
    });
  }
}
export class OrderStatusInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_STATUS_INVALID,
      message: message ?? 'Invalid order status',
      context: ctx,
    });
  }
}
export class OrderStatusTransitionForbiddenError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_STATUS_TRANSITION_FORBIDDEN,
      message: message ?? 'Illegal order status transition',
      context: ctx,
    });
  }
}
export class OrderQuantityInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_QUANTITY_INVALID,
      message: message ?? 'Invalid order quantity',
      context: ctx,
    });
  }
}
export class OrderAmountInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_AMOUNT_INVALID,
      message: message ?? 'Invalid order amount',
      context: ctx,
    });
  }
}
export class OrderPaymentMethodInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_PAYMENT_METHOD_INVALID,
      message: message ?? 'Invalid payment method',
      context: ctx,
    });
  }
}
export class OrderShippingAddressRequiredError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_SHIPPING_ADDRESS_REQUIRED,
      message: message ?? 'Shipping address is required',
      context: ctx,
    });
  }
}
export class OrderTrackingNoInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_TRACKING_NO_INVALID,
      message: message ?? 'Invalid tracking number',
      context: ctx,
    });
  }
}
export class OrderShippingCompanyInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_SHIPPING_COMPANY_INVALID,
      message: message ?? 'Invalid shipping company',
      context: ctx,
    });
  }
}
export class OrderRiskHoldError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_RISK_HOLD,
      message: message ?? 'Order is on risk hold',
      context: ctx,
    });
  }
}
export class OrderRefundReasonRequiredError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_REFUND_REASON_REQUIRED,
      message: message ?? 'Refund reason is required',
      context: ctx,
    });
  }
}
export class OrderRefundAmountExceededError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_REFUND_AMOUNT_EXCEEDED,
      message: message ?? 'Refund amount exceeds order total',
      context: ctx,
    });
  }
}
export class OrderPaymentExpiredError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_PAYMENT_EXPIRED,
      message: message ?? 'Order payment has expired',
      context: ctx,
    });
  }
}
export class OrderAlreadyShippedError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_ALREADY_SHIPPED,
      message: message ?? 'Order already shipped',
      context: ctx,
    });
  }
}
export class OrderAlreadyDeliveredError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_ALREADY_DELIVERED,
      message: message ?? 'Order already delivered',
      context: ctx,
    });
  }
}
export class OrderAlreadyCancelledError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.ORDER_ALREADY_CANCELLED,
      message: message ?? 'Order already cancelled',
      context: ctx,
    });
  }
}

// ============================================================
// 物流错误
// ============================================================
export class DeliveryNotFoundError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.DELIVERY_NOT_FOUND,
      message: message ?? 'Delivery record not found',
      context: ctx,
    });
  }
}
export class DeliveryStatusInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.DELIVERY_STATUS_INVALID,
      message: message ?? 'Invalid delivery status',
      context: ctx,
    });
  }
}
export class DeliveryStatusTransitionForbiddenError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.DELIVERY_STATUS_TRANSITION_FORBIDDEN,
      message: message ?? 'Illegal delivery status transition',
      context: ctx,
    });
  }
}
export class DeliveryTrackingNoRequiredError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.DELIVERY_TRACKING_NO_REQUIRED,
      message: message ?? 'Tracking number is required',
      context: ctx,
    });
  }
}
export class DeliveryCompanyRequiredError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.DELIVERY_COMPANY_REQUIRED,
      message: message ?? 'Shipping company is required',
      context: ctx,
    });
  }
}

// ============================================================
// 优惠券错误
// ============================================================
export class CouponNotFoundError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.COUPON_NOT_FOUND,
      message: message ?? `Coupon not found: ${JSON.stringify(ctx)}`,
      context: ctx,
    });
  }
}
export class CouponExpiredError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.COUPON_EXPIRED,
      message: message ?? 'Coupon has expired',
      context: ctx,
    });
  }
}
export class CouponPausedError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.COUPON_PAUSED,
      message: message ?? 'Coupon is paused',
      context: ctx,
    });
  }
}
export class CouponDisabledError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.COUPON_DISABLED,
      message: message ?? 'Coupon is disabled',
      context: ctx,
    });
  }
}
export class CouponNotUsableError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.COUPON_NOT_USABLE,
      message: message ?? 'Coupon is not usable',
      context: ctx,
    });
  }
}
export class CouponSupplyExhaustedError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.COUPON_SUPPLY_EXHAUSTED,
      message: message ?? 'Coupon supply exhausted',
      context: ctx,
    });
  }
}
export class CouponAlreadyClaimedError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.COUPON_ALREADY_CLAIMED,
      message: message ?? 'Coupon already claimed by user',
      context: ctx,
    });
  }
}
export class CouponMinSpendNotMetError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.COUPON_MIN_SPEND_NOT_MET,
      message: message ?? 'Order amount does not meet coupon minimum spend',
      context: ctx,
    });
  }
}
export class CouponUserScopeNotAllowedError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.COUPON_USER_SCOPE_NOT_ALLOWED,
      message: message ?? 'User is not in coupon scope',
      context: ctx,
    });
  }
}
export class CouponProductScopeNotMatchedError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.COUPON_PRODUCT_SCOPE_NOT_MATCHED,
      message: message ?? 'Coupon does not apply to selected products',
      context: ctx,
    });
  }
}
export class CouponTypeInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.COUPON_TYPE_INVALID,
      message: message ?? 'Invalid coupon type',
      context: ctx,
    });
  }
}
export class CouponAmountInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.COUPON_AMOUNT_INVALID,
      message: message ?? 'Invalid coupon amount',
      context: ctx,
    });
  }
}

// ============================================================
// 结算错误
// ============================================================
export class SettlementNotFoundError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.SETTLEMENT_NOT_FOUND,
      message: message ?? 'Settlement not found',
      context: ctx,
    });
  }
}
export class SettlementNotApprovableError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.SETTLEMENT_NOT_APPROVABLE,
      message: message ?? 'Settlement is not approvable',
      context: ctx,
    });
  }
}
export class SettlementNotPayableError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.SETTLEMENT_NOT_PAYABLE,
      message: message ?? 'Settlement is not payable',
      context: ctx,
    });
  }
}
export class SettlementNotCancellableError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.SETTLEMENT_NOT_CANCELLABLE,
      message: message ?? 'Settlement is not cancellable',
      context: ctx,
    });
  }
}
export class SettlementStatusInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.SETTLEMENT_STATUS_INVALID,
      message: message ?? 'Invalid settlement status',
      context: ctx,
    });
  }
}
export class SettlementStatusTransitionForbiddenError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.SETTLEMENT_STATUS_TRANSITION_FORBIDDEN,
      message: message ?? 'Illegal settlement status transition',
      context: ctx,
    });
  }
}
export class SettlementPeriodInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.SETTLEMENT_PERIOD_INVALID,
      message: message ?? 'Invalid settlement period',
      context: ctx,
    });
  }
}
export class SettlementAmountInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.SETTLEMENT_AMOUNT_INVALID,
      message: message ?? 'Invalid settlement amount',
      context: ctx,
    });
  }
}
export class SettlementAlreadyExistsError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.SETTLEMENT_ALREADY_EXISTS,
      message: message ?? 'Settlement already exists for this period',
      context: ctx,
    });
  }
}
export class SettlementApprovalRequiredError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.SETTLEMENT_APPROVAL_REQUIRED,
      message: message ?? 'Settlement approval is required before payment',
      context: ctx,
    });
  }
}
export class SettlementPlatformFeeInvalidError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.SETTLEMENT_PLATFORM_FEE_INVALID,
      message: message ?? 'Invalid platform fee',
      context: ctx,
    });
  }
}

// ============================================================
// 公共错误
// ============================================================
export class DappxMallInternalError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.INTERNAL_ERROR,
      message: message ?? 'Internal DAppX Mall error',
      context: ctx,
    });
  }
}
export class TransactionFailedError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.TRANSACTION_FAILED,
      message: message ?? 'Transaction failed',
      context: ctx,
    });
  }
}
export class ConcurrentUpdateError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.CONCURRENT_UPDATE,
      message: message ?? 'Concurrent update detected',
      context: ctx,
    });
  }
}
export class IdempotencyKeyConflictError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.IDEMPOTENCY_KEY_CONFLICT,
      message: message ?? 'Idempotency key conflict',
      context: ctx,
    });
  }
}
export class UnauthorizedOperationError extends FjnDappxMallError {
  constructor(ctx: FjnErrorContext = {}, message?: string) {
    super({
      code: DAPPX_MALL_ERROR_CODES.UNAUTHORIZED_OPERATION,
      message: message ?? 'Unauthorized operation',
      context: ctx,
    });
  }
}
