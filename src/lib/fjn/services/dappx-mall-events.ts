/**
 * DAppX Mall Service - 事件常量 + Payload
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.5
 *
 * 事件命名规范：fjn.dappx_mall.<entity>.<action>
 *  - fjn.dappx_mall.merchant.*
 *  - fjn.dappx_mall.product.*
 *  - fjn.dappx_mall.order.*
 *  - fjn.dappx_mall.coupon.*
 *  - fjn.dappx_mall.settlement.*
 */

// ============================================================
// 事件来源
// ============================================================
export const DAPPX_MALL_EVENT_SOURCES = {
  DAPPX_MALL_SERVICE: 'fjn.dappx_mall.service',
  MERCHANT_API: 'fjn.dappx_mall.api.merchant',
  ORDER_API: 'fjn.dappx_mall.api.order',
  COUPON_API: 'fjn.dappx_mall.api.coupon',
  SETTLEMENT_API: 'fjn.dappx_mall.api.settlement',
  ADMIN_API: 'fjn.dappx_mall.api.admin',
  SOLANA_PAY: 'fjn.dappx_mall.solana_pay',
  RISK_ENGINE: 'fjn.dappx_mall.risk',
  DELIVERY_TRACKER: 'fjn.dappx_mall.delivery',
} as const;

export type FjnDappxMallEventSource =
  (typeof DAPPX_MALL_EVENT_SOURCES)[keyof typeof DAPPX_MALL_EVENT_SOURCES];

// ============================================================
// 事件常量
// ============================================================
export const DAPPX_MALL_EVENTS = {
  // 商户
  MERCHANT_CREATED: 'fjn.dappx_mall.merchant.created',
  MERCHANT_UPDATED: 'fjn.dappx_mall.merchant.updated',
  MERCHANT_STATUS_CHANGED: 'fjn.dappx_mall.merchant.status_changed',
  MERCHANT_APPROVED: 'fjn.dappx_mall.merchant.approved',
  MERCHANT_ACTIVATED: 'fjn.dappx_mall.merchant.activated',
  MERCHANT_SUSPENDED: 'fjn.dappx_mall.merchant.suspended',
  MERCHANT_CLOSED: 'fjn.dappx_mall.merchant.closed',
  MERCHANT_BLACKLISTED: 'fjn.dappx_mall.merchant.blacklisted',

  // 商品
  PRODUCT_CREATED: 'fjn.dappx_mall.product.created',
  PRODUCT_UPDATED: 'fjn.dappx_mall.product.updated',
  PRODUCT_STATUS_CHANGED: 'fjn.dappx_mall.product.status_changed',
  PRODUCT_ACTIVATED: 'fjn.dappx_mall.product.activated',
  PRODUCT_DEACTIVATED: 'fjn.dappx_mall.product.deactivated',
  PRODUCT_SOLD_OUT: 'fjn.dappx_mall.product.sold_out',
  PRODUCT_RESTOCKED: 'fjn.dappx_mall.product.restocked',
  PRODUCT_ARCHIVED: 'fjn.dappx_mall.product.archived',
  PRODUCT_STOCK_ADJUSTED: 'fjn.dappx_mall.product.stock_adjusted',
  PRODUCT_STOCK_LOW: 'fjn.dappx_mall.product.stock_low',

  // 订单
  ORDER_CREATED: 'fjn.dappx_mall.order.created',
  ORDER_PAYMENT_PENDING: 'fjn.dappx_mall.order.payment_pending',
  ORDER_PAID: 'fjn.dappx_mall.order.paid',
  ORDER_PAYMENT_FAILED: 'fjn.dappx_mall.order.payment_failed',
  ORDER_PAYMENT_EXPIRED: 'fjn.dappx_mall.order.payment_expired',
  ORDER_RISK_CHECKING: 'fjn.dappx_mall.order.risk_checking',
  ORDER_RISK_HOLD: 'fjn.dappx_mall.order.risk_hold',
  ORDER_CONFIRMED: 'fjn.dappx_mall.order.confirmed',
  ORDER_FULFILLING: 'fjn.dappx_mall.order.fulfilling',
  ORDER_SHIPPED: 'fjn.dappx_mall.order.shipped',
  ORDER_DELIVERED: 'fjn.dappx_mall.order.delivered',
  ORDER_COMPLETED: 'fjn.dappx_mall.order.completed',
  ORDER_REFUND_REQUESTED: 'fjn.dappx_mall.order.refund_requested',
  ORDER_REFUND_APPROVED: 'fjn.dappx_mall.order.refund_approved',
  ORDER_RETURN_REQUESTED: 'fjn.dappx_mall.order.return_requested',
  ORDER_REFUNDED: 'fjn.dappx_mall.order.refunded',
  ORDER_CANCELLED: 'fjn.dappx_mall.order.cancelled',

  // 物流
  DELIVERY_SHIPPED: 'fjn.dappx_mall.delivery.shipped',
  DELIVERY_IN_TRANSIT: 'fjn.dappx_mall.delivery.in_transit',
  DELIVERY_EXCEPTION: 'fjn.dappx_mall.delivery.exception',
  DELIVERY_RETURNED: 'fjn.dappx_mall.delivery.returned',

  // 优惠券
  COUPON_CREATED: 'fjn.dappx_mall.coupon.created',
  COUPON_UPDATED: 'fjn.dappx_mall.coupon.updated',
  COUPON_STATUS_CHANGED: 'fjn.dappx_mall.coupon.status_changed',
  COUPON_CLAIMED: 'fjn.dappx_mall.coupon.claimed',
  COUPON_USED: 'fjn.dappx_mall.coupon.used',
  COUPON_EXPIRED: 'fjn.dappx_mall.coupon.expired',

  // 结算
  SETTLEMENT_CREATED: 'fjn.dappx_mall.settlement.created',
  SETTLEMENT_APPROVED: 'fjn.dappx_mall.settlement.approved',
  SETTLEMENT_PAID: 'fjn.dappx_mall.settlement.paid',
  SETTLEMENT_CANCELLED: 'fjn.dappx_mall.settlement.cancelled',
} as const;

export type FjnDappxMallEvent = (typeof DAPPX_MALL_EVENTS)[keyof typeof DAPPX_MALL_EVENTS];

// ============================================================
// 事件 Payload 类型
// ============================================================

// ----- 商户 -----
export interface MerchantCreatedPayload {
  merchantId: string;
  merchantNo: string;
  userId: string;
  merchantName: string;
  legalName: string;
  countryCode: string;
  kybStatus: string;
  category?: string;
  createdAt: string;
}

export interface MerchantUpdatedPayload {
  merchantId: string;
  merchantNo: string;
  changes: Record<string, unknown>;
  operatorId?: string;
  updatedAt: string;
}

export interface MerchantStatusChangedPayload {
  merchantId: string;
  merchantNo: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  operatorId?: string;
  changedAt: string;
}

export interface MerchantApprovedPayload {
  merchantId: string;
  merchantNo: string;
  approvedBy: string;
  approvedAt: string;
}

export interface MerchantActivatedPayload {
  merchantId: string;
  merchantNo: string;
  activatedAt: string;
}

export interface MerchantSuspendedPayload {
  merchantId: string;
  merchantNo: string;
  reason: string;
  operatorId?: string;
  suspendedAt: string;
}

export interface MerchantClosedPayload {
  merchantId: string;
  merchantNo: string;
  reason: string;
  operatorId?: string;
  closedAt: string;
}

export interface MerchantBlacklistedPayload {
  merchantId: string;
  merchantNo: string;
  reason: string;
  operatorId: string;
  blacklistedAt: string;
}

// ----- 商品 -----
export interface ProductCreatedPayload {
  productId: string;
  productNo: string;
  merchantId: string;
  name: string;
  price: string;
  currency: string;
  stock: number;
  acceptPoints: boolean;
  acceptToken: boolean;
  status: string;
  createdAt: string;
}

export interface ProductUpdatedPayload {
  productId: string;
  productNo: string;
  merchantId: string;
  changes: Record<string, unknown>;
  updatedAt: string;
}

export interface ProductStatusChangedPayload {
  productId: string;
  productNo: string;
  merchantId: string;
  fromStatus: string;
  toStatus: string;
  operatorId?: string;
  changedAt: string;
}

export interface ProductActivatedPayload {
  productId: string;
  productNo: string;
  merchantId: string;
  activatedAt: string;
}

export interface ProductDeactivatedPayload {
  productId: string;
  productNo: string;
  merchantId: string;
  reason?: string;
  deactivatedAt: string;
}

export interface ProductSoldOutPayload {
  productId: string;
  productNo: string;
  merchantId: string;
  soldAt: string;
}

export interface ProductRestockedPayload {
  productId: string;
  productNo: string;
  merchantId: string;
  addedStock: number;
  newStock: number;
  operatorId?: string;
  restockedAt: string;
}

export interface ProductArchivedPayload {
  productId: string;
  productNo: string;
  merchantId: string;
  archivedAt: string;
}

export interface ProductStockAdjustedPayload {
  productId: string;
  productNo: string;
  delta: number;
  balanceBefore: number;
  balanceAfter: number;
  changeType: string;
  reason?: string;
  operatorId?: string;
  adjustedAt: string;
}

export interface ProductStockLowPayload {
  productId: string;
  productNo: string;
  merchantId: string;
  currentStock: number;
  threshold: number;
  detectedAt: string;
}

// ----- 订单 -----
export interface OrderCreatedPayload {
  orderId: string;
  orderNo: string;
  userId: string;
  merchantId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
  currency: string;
  paymentMethod?: string;
  shippingAddress?: Record<string, unknown>;
  createdAt: string;
}

export interface OrderPaymentPendingPayload {
  orderId: string;
  orderNo: string;
  paymentIntentId?: string;
  expiresAt?: string;
  pendingAt: string;
}

export interface OrderPaidPayload {
  orderId: string;
  orderNo: string;
  userId: string;
  merchantId: string;
  totalAmount: string;
  paidAmount: string;
  paymentMethod: string;
  txSignature?: string;
  paidAt: string;
}

export interface OrderPaymentFailedPayload {
  orderId: string;
  orderNo: string;
  reason: string;
  failedAt: string;
}

export interface OrderPaymentExpiredPayload {
  orderId: string;
  orderNo: string;
  expiredAt: string;
}

export interface OrderRiskCheckingPayload {
  orderId: string;
  orderNo: string;
  triggeredBy: string;
  checkingAt: string;
}

export interface OrderRiskHoldPayload {
  orderId: string;
  orderNo: string;
  reason: string;
  heldAt: string;
}

export interface OrderConfirmedPayload {
  orderId: string;
  orderNo: string;
  confirmedAt: string;
}

export interface OrderFulfillingPayload {
  orderId: string;
  orderNo: string;
  fulfillingAt: string;
}

export interface OrderShippedPayload {
  orderId: string;
  orderNo: string;
  trackingNo?: string;
  shippingCompany?: string;
  shippedAt: string;
}

export interface OrderDeliveredPayload {
  orderId: string;
  orderNo: string;
  deliveredAt: string;
}

export interface OrderCompletedPayload {
  orderId: string;
  orderNo: string;
  completedAt: string;
}

export interface OrderRefundRequestedPayload {
  orderId: string;
  orderNo: string;
  reason: string;
  requestedAt: string;
}

export interface OrderRefundApprovedPayload {
  orderId: string;
  orderNo: string;
  refundAmount: string;
  approvedBy: string;
  approvedAt: string;
}

export interface OrderReturnRequestedPayload {
  orderId: string;
  orderNo: string;
  reason: string;
  requestedAt: string;
}

export interface OrderRefundedPayload {
  orderId: string;
  orderNo: string;
  refundAmount: string;
  refundedAt: string;
}

export interface OrderCancelledPayload {
  orderId: string;
  orderNo: string;
  reason?: string;
  cancelledAt: string;
}

// ----- 物流 -----
export interface DeliveryShippedPayload {
  orderId: string;
  orderNo: string;
  trackingNo: string;
  shippingCompany: string;
  shippedAt: string;
}

export interface DeliveryInTransitPayload {
  orderId: string;
  orderNo: string;
  location?: string;
  inTransitAt: string;
}

export interface DeliveryExceptionPayload {
  orderId: string;
  orderNo: string;
  reason: string;
  exceptionAt: string;
}

export interface DeliveryReturnedPayload {
  orderId: string;
  orderNo: string;
  reason: string;
  returnedAt: string;
}

// ----- 优惠券 -----
export interface CouponCreatedPayload {
  couponId: string;
  couponNo: string;
  name: string;
  couponType: string;
  amount: string;
  minSpend: string;
  totalSupply: number;
  validFrom: string;
  validTo: string;
  createdAt: string;
}

export interface CouponUpdatedPayload {
  couponId: string;
  couponNo: string;
  changes: Record<string, unknown>;
  updatedAt: string;
}

export interface CouponStatusChangedPayload {
  couponId: string;
  couponNo: string;
  fromStatus: string;
  toStatus: string;
  changedAt: string;
}

export interface CouponClaimedPayload {
  couponId: string;
  couponNo: string;
  userId: string;
  claimedAt: string;
}

export interface CouponUsedPayload {
  couponId: string;
  couponNo: string;
  userId: string;
  orderId: string;
  usedAt: string;
}

export interface CouponExpiredPayload {
  couponId: string;
  couponNo: string;
  expiredAt: string;
}

// ----- 结算 -----
export interface SettlementCreatedPayload {
  settlementId: string;
  settlementNo: string;
  merchantId: string;
  period: string;
  grossAmount: string;
  refundAmount: string;
  platformFee: string;
  netAmount: string;
  currency: string;
  orderCount: number;
  createdAt: string;
}

export interface SettlementApprovedPayload {
  settlementId: string;
  settlementNo: string;
  merchantId: string;
  approvedBy: string;
  approvedAt: string;
}

export interface SettlementPaidPayload {
  settlementId: string;
  settlementNo: string;
  merchantId: string;
  paidAmount: string;
  txSignature?: string;
  paidAt: string;
}

export interface SettlementCancelledPayload {
  settlementId: string;
  settlementNo: string;
  reason: string;
  cancelledAt: string;
}

// ============================================================
// 联合类型
// ============================================================
export type DappxMallEventPayload =
  | MerchantCreatedPayload
  | MerchantUpdatedPayload
  | MerchantStatusChangedPayload
  | MerchantApprovedPayload
  | MerchantActivatedPayload
  | MerchantSuspendedPayload
  | MerchantClosedPayload
  | MerchantBlacklistedPayload
  | ProductCreatedPayload
  | ProductUpdatedPayload
  | ProductStatusChangedPayload
  | ProductActivatedPayload
  | ProductDeactivatedPayload
  | ProductSoldOutPayload
  | ProductRestockedPayload
  | ProductArchivedPayload
  | ProductStockAdjustedPayload
  | ProductStockLowPayload
  | OrderCreatedPayload
  | OrderPaymentPendingPayload
  | OrderPaidPayload
  | OrderPaymentFailedPayload
  | OrderPaymentExpiredPayload
  | OrderRiskCheckingPayload
  | OrderRiskHoldPayload
  | OrderConfirmedPayload
  | OrderFulfillingPayload
  | OrderShippedPayload
  | OrderDeliveredPayload
  | OrderCompletedPayload
  | OrderRefundRequestedPayload
  | OrderRefundApprovedPayload
  | OrderReturnRequestedPayload
  | OrderRefundedPayload
  | OrderCancelledPayload
  | DeliveryShippedPayload
  | DeliveryInTransitPayload
  | DeliveryExceptionPayload
  | DeliveryReturnedPayload
  | CouponCreatedPayload
  | CouponUpdatedPayload
  | CouponStatusChangedPayload
  | CouponClaimedPayload
  | CouponUsedPayload
  | CouponExpiredPayload
  | SettlementCreatedPayload
  | SettlementApprovedPayload
  | SettlementPaidPayload
  | SettlementCancelledPayload;

// ============================================================
// 工具
// ============================================================
export const ALL_DAPPX_MALL_EVENTS = Object.values(DAPPX_MALL_EVENTS);
export const DAPPX_MALL_EVENT_COUNT = ALL_DAPPX_MALL_EVENTS.length;

export const isValidDappxMallEvent = (e: string): e is FjnDappxMallEvent =>
  (ALL_DAPPX_MALL_EVENTS as string[]).includes(e);

export const isValidDappxMallEventSource = (s: string): s is FjnDappxMallEventSource =>
  Object.values(DAPPX_MALL_EVENT_SOURCES).includes(s as any);
