/**
 * DAppX Mall Service - 状态机 + 枚举
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.5
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md §3.18
 *
 * 职责范围（FJN 域内 DAppX Mall，5 个核心表）：
 *  - FjnMerchant         商户管理（KYB 审核、状态机、平台费）
 *  - FjnMallProduct      商城商品（不含 369 主商品）
 *  - FjnMallOrder        商城订单（独立于 FjnOrder 链下真相）
 *  - FjnMallCoupon       优惠券
 *  - FjnMallSettlement   商家结算（按周期、平台费分账）
 *
 * 与主 Product Service 区别：
 *  - FjnProduct = 369 主商品 / AEP 算力包（统一平台售卖）
 *  - FjnMallProduct = 商户自营商品（多商户、平台抽佣）
 *
 * 与独立 Mall 业务域区别（src/lib/mall/）：
 *  - FjnDappxMall = FJN 域内 369 配套商城（链下为主，Solana Pay 结算）
 *  - src/lib/mall/ = 独立商城域（链下 + Solana Metaplex NFT 双轨）
 */

import {
  FJN_MERCHANT_STATUS,
  FJN_MALL_PRODUCT_STATUS,
  FJN_MALL_ORDER_STATUS,
  FJN_MALL_COUPON_STATUS,
  FJN_MALL_SETTLEMENT_STATUS,
  FJN_MALL_PAYMENT_METHOD,
  FJN_MALL_DELIVERY_STATUS,
  type FjnMerchantStatus,
  type FjnMallProductStatus,
  type FjnMallOrderStatus,
  type FjnMallCouponStatus,
  type FjnMallSettlementStatus,
  type FjnMallPaymentMethod,
  type FjnMallDeliveryStatus,
} from '../constants';

// 兼容层导出
export { FJN_MERCHANT_STATUS as MERCHANT_STATUS, type FjnMerchantStatus } from '../constants';
export { FJN_MALL_PRODUCT_STATUS as MALL_PRODUCT_STATUS, type FjnMallProductStatus } from '../constants';
export { FJN_MALL_ORDER_STATUS as MALL_ORDER_STATUS, type FjnMallOrderStatus } from '../constants';
export { FJN_MALL_COUPON_STATUS as MALL_COUPON_STATUS, type FjnMallCouponStatus } from '../constants';
export { FJN_MALL_SETTLEMENT_STATUS as MALL_SETTLEMENT_STATUS, type FjnMallSettlementStatus } from '../constants';
export { FJN_MALL_PAYMENT_METHOD as MALL_PAYMENT_METHOD, type FjnMallPaymentMethod } from '../constants';
export { FJN_MALL_DELIVERY_STATUS as MALL_DELIVERY_STATUS, type FjnMallDeliveryStatus } from '../constants';

/** 优惠券类型 */
export const COUPON_TYPE = {
  FIXED: 'fixed',           // 满减
  PERCENTAGE: 'percentage', // 折扣
} as const;
export type FjnCouponType = (typeof COUPON_TYPE)[keyof typeof COUPON_TYPE];

/** 优惠券使用范围 */
export const COUPON_USER_SCOPE = {
  ALL: 'all',
  NEW: 'new',
  VIP: 'vip',
  KYC: 'kyc',
  SPECIFIC: 'specific',
} as const;
export type FjnCouponUserScope = (typeof COUPON_USER_SCOPE)[keyof typeof COUPON_USER_SCOPE];

/** 商家分类 */
export const MERCHANT_CATEGORY = {
  GENERAL: 'general',
  WINE: 'wine',
  FOOD: 'food',
  GIFT: 'gift',
  ELECTRONICS: 'electronics',
  LIFESTYLE: 'lifestyle',
  SERVICE: 'service',
  NFT_GOODS: 'nft_goods',
} as const;
export type FjnMerchantCategory = (typeof MERCHANT_CATEGORY)[keyof typeof MERCHANT_CATEGORY];

/** 库存变更类型 */
export const MALL_STOCK_CHANGE_TYPE = {
  RESTOCK: 'restock',
  SALE: 'sale',
  RETURN: 'return',
  MANUAL_ADJUST: 'manual_adjust',
  RESERVE: 'reserve',
  RELEASE: 'release',
} as const;
export type FjnMallStockChangeType =
  (typeof MALL_STOCK_CHANGE_TYPE)[keyof typeof MALL_STOCK_CHANGE_TYPE];

/** 退款原因 */
export const REFUND_REASON = {
  BUYER_REMORSE: 'buyer_remorse',
  DAMAGED: 'damaged',
  NOT_AS_DESCRIBED: 'not_as_described',
  LATE_DELIVERY: 'late_delivery',
  WRONG_ITEM: 'wrong_item',
  OTHER: 'other',
} as const;
export type FjnRefundReason = (typeof REFUND_REASON)[keyof typeof REFUND_REASON];

// ============================================================
// 状态机：商户
// ============================================================
export const MERCHANT_STATUS_TRANSITIONS: Record<FjnMerchantStatus, FjnMerchantStatus[]> = {
  pending_review: ['approved', 'closed'],
  approved: ['active', 'restricted', 'closed'],
  active: ['restricted', 'suspended', 'closed'],
  restricted: ['active', 'suspended', 'closed'],
  suspended: ['active', 'closed'],
  blacklisted: ['closed'],
  closed: [],
};

// ============================================================
// 状态机：商城商品
// ============================================================
export const MALL_PRODUCT_STATUS_TRANSITIONS: Record<FjnMallProductStatus, FjnMallProductStatus[]> = {
  draft: ['active', 'archived'],
  active: ['sold_out', 'inactive', 'archived'],
  sold_out: ['active', 'inactive', 'archived'],
  inactive: ['active', 'archived'],
  archived: [],
};

// ============================================================
// 状态机：商城订单
// ============================================================
export const MALL_ORDER_STATUS_TRANSITIONS: Record<FjnMallOrderStatus, FjnMallOrderStatus[]> = {
  created: ['pending_payment', 'cancelled'],
  pending_payment: ['paid', 'cancelled', 'expired'],
  paid: ['risk_checking', 'confirmed', 'refund_requested'],
  risk_checking: ['confirmed', 'refund_requested', 'risk_hold'],
  confirmed: ['fulfilling', 'refund_requested'],
  fulfilling: ['shipped', 'refund_requested'],
  shipped: ['delivered', 'return_requested'],
  delivered: ['completed', 'return_requested'],
  completed: ['return_requested'],
  refund_requested: ['refunded', 'cancelled'],
  return_requested: ['refunded', 'completed'],
  refunded: [],
  cancelled: [],
  expired: [],
  risk_hold: ['confirmed', 'refund_requested', 'cancelled'],
};

// ============================================================
// 状态机：优惠券
// ============================================================
export const MALL_COUPON_STATUS_TRANSITIONS: Record<FjnMallCouponStatus, FjnMallCouponStatus[]> = {
  active: ['paused', 'expired'],
  paused: ['active', 'expired'],
  expired: [],
  disabled: ['active'],
};

// ============================================================
// 状态机：商家结算
// ============================================================
export const MALL_SETTLEMENT_STATUS_TRANSITIONS: Record<
  FjnMallSettlementStatus,
  FjnMallSettlementStatus[]
> = {
  created: ['approved', 'cancelled'],
  approved: ['paid', 'cancelled'],
  paid: [],
  cancelled: [],
};

// ============================================================
// 状态机：物流
// ============================================================
export const MALL_DELIVERY_STATUS_TRANSITIONS: Record<FjnMallDeliveryStatus, FjnMallDeliveryStatus[]> = {
  pending: ['shipped', 'cancelled'],
  shipped: ['in_transit', 'delivered'],
  in_transit: ['delivered', 'exception'],
  delivered: ['completed'],
  exception: ['in_transit', 'returned'],
  returned: ['completed'],
  completed: [],
  cancelled: [],
};

// ============================================================
// 校验器
// ============================================================
export const isValidMerchantStatus = (s: string): s is FjnMerchantStatus =>
  Object.values(FJN_MERCHANT_STATUS).includes(s as any);

export const isValidMallProductStatus = (s: string): s is FjnMallProductStatus =>
  Object.values(FJN_MALL_PRODUCT_STATUS).includes(s as any);

export const isValidMallOrderStatus = (s: string): s is FjnMallOrderStatus =>
  Object.values(FJN_MALL_ORDER_STATUS).includes(s as any);

export const isValidMallCouponStatus = (s: string): s is FjnMallCouponStatus =>
  Object.values(FJN_MALL_COUPON_STATUS).includes(s as any);

export const isValidMallSettlementStatus = (s: string): s is FjnMallSettlementStatus =>
  Object.values(FJN_MALL_SETTLEMENT_STATUS).includes(s as any);

export const isValidMallPaymentMethod = (m: string): m is FjnMallPaymentMethod =>
  Object.values(FJN_MALL_PAYMENT_METHOD).includes(m as any);

export const isValidMallDeliveryStatus = (d: string): d is FjnMallDeliveryStatus =>
  Object.values(FJN_MALL_DELIVERY_STATUS).includes(d as any);

export const isValidCouponType = (t: string): t is FjnCouponType =>
  Object.values(COUPON_TYPE).includes(t as any);

export const isValidCouponUserScope = (s: string): s is FjnCouponUserScope =>
  Object.values(COUPON_USER_SCOPE).includes(s as any);

export const isValidMerchantCategory = (c: string): c is FjnMerchantCategory =>
  Object.values(MERCHANT_CATEGORY).includes(c as any);

export const isValidMallStockChangeType = (t: string): t is FjnMallStockChangeType =>
  Object.values(MALL_STOCK_CHANGE_TYPE).includes(t as any);

export const isValidRefundReason = (r: string): r is FjnRefundReason =>
  Object.values(REFUND_REASON).includes(r as any);

// ============================================================
// 状态流转工具
// ============================================================
export const canTransitMerchantStatus = (
  from: FjnMerchantStatus,
  to: FjnMerchantStatus,
): boolean => (MERCHANT_STATUS_TRANSITIONS[from] ?? []).includes(to);

export const assertTransitMerchantStatus = (
  from: FjnMerchantStatus,
  to: FjnMerchantStatus,
): void => {
  if (!canTransitMerchantStatus(from, to)) {
    throw new Error(`[DAppX Mall] Illegal merchant status transition: ${from} -> ${to}`);
  }
};

export const canTransitMallProductStatus = (
  from: FjnMallProductStatus,
  to: FjnMallProductStatus,
): boolean => (MALL_PRODUCT_STATUS_TRANSITIONS[from] ?? []).includes(to);

export const assertTransitMallProductStatus = (
  from: FjnMallProductStatus,
  to: FjnMallProductStatus,
): void => {
  if (!canTransitMallProductStatus(from, to)) {
    throw new Error(`[DAppX Mall] Illegal product status transition: ${from} -> ${to}`);
  }
};

export const canTransitMallOrderStatus = (
  from: FjnMallOrderStatus,
  to: FjnMallOrderStatus,
): boolean => (MALL_ORDER_STATUS_TRANSITIONS[from] ?? []).includes(to);

export const assertTransitMallOrderStatus = (
  from: FjnMallOrderStatus,
  to: FjnMallOrderStatus,
): void => {
  if (!canTransitMallOrderStatus(from, to)) {
    throw new Error(`[DAppX Mall] Illegal order status transition: ${from} -> ${to}`);
  }
};

export const canTransitMallSettlementStatus = (
  from: FjnMallSettlementStatus,
  to: FjnMallSettlementStatus,
): boolean => (MALL_SETTLEMENT_STATUS_TRANSITIONS[from] ?? []).includes(to);

export const assertTransitMallSettlementStatus = (
  from: FjnMallSettlementStatus,
  to: FjnMallSettlementStatus,
): void => {
  if (!canTransitMallSettlementStatus(from, to)) {
    throw new Error(`[DAppX Mall] Illegal settlement status transition: ${from} -> ${to}`);
  }
};

// ============================================================
// 终态判定
// ============================================================
export const isTerminalMerchantStatus = (s: FjnMerchantStatus): boolean =>
  s === 'closed' || s === 'blacklisted';

export const isTerminalMallProductStatus = (s: FjnMallProductStatus): boolean =>
  s === 'archived';

export const isTerminalMallOrderStatus = (s: FjnMallOrderStatus): boolean =>
  s === 'completed' || s === 'refunded' || s === 'cancelled' || s === 'expired';

export const isTerminalMallSettlementStatus = (s: FjnMallSettlementStatus): boolean =>
  s === 'paid' || s === 'cancelled';

// ============================================================
// 业务可用状态
// ============================================================
export const isMerchantOperable = (s: FjnMerchantStatus): boolean =>
  s === 'active' || s === 'approved' || s === 'restricted';

export const isMerchantActive = (s: FjnMerchantStatus): boolean => s === 'active';

export const isMallProductPurchasable = (s: FjnMallProductStatus): boolean =>
  s === 'active';

export const isMallProductOnShelf = (s: FjnMallProductStatus): boolean =>
  s === 'active' || s === 'sold_out';

export const isOrderCancellable = (s: FjnMallOrderStatus): boolean =>
  s === 'created' || s === 'pending_payment';

export const isOrderPayable = (s: FjnMallOrderStatus): boolean =>
  s === 'pending_payment';

export const isOrderCompleted = (s: FjnMallOrderStatus): boolean =>
  s === 'completed' || s === 'refunded';

export const isCouponUsable = (s: FjnMallCouponStatus): boolean => s === 'active';

export const isSettlementPayable = (s: FjnMallSettlementStatus): boolean =>
  s === 'approved';

// ============================================================
// 默认值
// ============================================================
export const MALL_DEFAULT_CURRENCY = 'USD';
export const MALL_DEFAULT_PLATFORM_FEE_RATE = '0.05';
export const MALL_MAX_PLATFORM_FEE_RATE = '0.30';
export const MALL_MIN_PLATFORM_FEE_RATE = '0';
export const MALL_DEFAULT_QUANTITY = 1;
export const MALL_MAX_QUANTITY = 999;
export const MALL_NAME_MAX_LENGTH = 200;
export const MALL_DESCRIPTION_MAX_LENGTH = 5000;
export const MALL_GALLERY_MAX_COUNT = 20;
export const MALL_COUPON_AMOUNT_MIN = '0.01';
export const MALL_COUPON_AMOUNT_MAX = '99999';
export const MALL_COUPON_PERCENTAGE_MIN = '0.01';
export const MALL_COUPON_PERCENTAGE_MAX = '0.95';
export const MALL_PRODUCT_STOCK_MIN = 0;
export const MALL_PRODUCT_STOCK_MAX = 999999;
export const MALL_DEFAULT_TIMEOUT_MINUTES = 30;
export const MALL_SETTLEMENT_PERIOD_DAILY = 'DAILY';
export const MALL_SETTLEMENT_PERIOD_WEEKLY = 'WEEKLY';
export const MALL_SETTLEMENT_PERIOD_MONTHLY = 'MONTHLY';
export const MALL_DEFAULT_SETTLEMENT_PERIOD = MALL_SETTLEMENT_PERIOD_MONTHLY;
export const MALL_TRACKING_NUMBER_MAX_LENGTH = 100;
export const MALL_SHIPPING_COMPANY_MAX_LENGTH = 100;

// ============================================================
// 校验函数
// ============================================================
export const isValidMallPrice = (price: string): boolean => {
  if (!price) return false;
  const num = Number(price);
  if (isNaN(num) || num <= 0) return false;
  return num <= 99999999;
};

export const isValidMallStock = (stock: number): boolean =>
  Number.isInteger(stock) &&
  stock >= MALL_PRODUCT_STOCK_MIN &&
  stock <= MALL_PRODUCT_STOCK_MAX;

export const isValidPlatformFeeRate = (rate: string): boolean => {
  const num = Number(rate);
  if (isNaN(num)) return false;
  return num >= Number(MALL_MIN_PLATFORM_FEE_RATE) && num <= Number(MALL_MAX_PLATFORM_FEE_RATE);
};

export const isValidCouponAmount = (amount: string, type: FjnCouponType): boolean => {
  if (!amount) return false;
  const num = Number(amount);
  if (isNaN(num) || num <= 0) return false;
  if (type === COUPON_TYPE.FIXED) {
    return num >= Number(MALL_COUPON_AMOUNT_MIN) && num <= Number(MALL_COUPON_AMOUNT_MAX);
  }
  return (
    num >= Number(MALL_COUPON_PERCENTAGE_MIN) && num <= Number(MALL_COUPON_PERCENTAGE_MAX)
  );
};

export const isValidQuantity = (qty: number): boolean =>
  Number.isInteger(qty) && qty >= 1 && qty <= MALL_MAX_QUANTITY;

export const isValidSettlementPeriod = (period: string): boolean =>
  [
    MALL_SETTLEMENT_PERIOD_DAILY,
    MALL_SETTLEMENT_PERIOD_WEEKLY,
    MALL_SETTLEMENT_PERIOD_MONTHLY,
  ].includes(period);
