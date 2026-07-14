/**
 * Mall Solana Payment Service - 状态机 + 枚举
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.5
 *
 * Mall 商城 + Solana Pay 集成
 *  - 复用 FjnMallProduct / FjnMallOrder / FjnMallCoupon / FjnMallSettlement
 *  - 链上：Solana Pay（Payment Intent）做实时结算
 */

export const MALL_PAYMENT_METHOD = {
  SOLANA_PAY: 'solana_pay',
  TFJ369: 'tfj369',
  FJ369_TOKEN: 'fj369_token',
  CFJ369: 'cfj369',
  HYBRID: 'hybrid',
} as const;
export type FjnMallPaymentMethod = (typeof MALL_PAYMENT_METHOD)[keyof typeof MALL_PAYMENT_METHOD];

export const MALL_PAYMENT_STATUS = {
  CREATED: 'created',
  INTENT_GENERATED: 'intent_generated',
  PENDING_PAYMENT: 'pending_payment',
  PROCESSING: 'processing',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  FAILED: 'failed',
  EXPIRED: 'expired',
  REFUND_REQUESTED: 'refund_requested',
  REFUNDED: 'refunded',
  RISK_HOLD: 'risk_hold',
} as const;
export type FjnMallPaymentStatus = (typeof MALL_PAYMENT_STATUS)[keyof typeof MALL_PAYMENT_STATUS];

export const MALL_INTENT_STATUS = {
  ACTIVE: 'active',
  PAID: 'paid',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;
export type FjnMallIntentStatus = (typeof MALL_INTENT_STATUS)[keyof typeof MALL_INTENT_STATUS];

export const MALL_REFUND_STATUS = {
  REQUESTED: 'requested',
  APPROVED: 'approved',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;
export type FjnMallRefundStatus = (typeof MALL_REFUND_STATUS)[keyof typeof MALL_REFUND_STATUS];

export const MALL_PLATFORM_FEE_RATE = '0.0500'; // 5%
export const MALL_INTENT_DEFAULT_EXPIRES_MINUTES = 30;
export const MALL_DEFAULT_CURRENCY = 'USD';
export const MALL_DEFAULT_CHAIN_ID = 'devnet';

export const isValidMallPaymentMethod = (v: string): v is FjnMallPaymentMethod =>
  Object.values(MALL_PAYMENT_METHOD).includes(v as any);
export const isValidMallPaymentStatus = (v: string): v is FjnMallPaymentStatus =>
  Object.values(MALL_PAYMENT_STATUS).includes(v as any);
export const isValidMallIntentStatus = (v: string): v is FjnMallIntentStatus =>
  Object.values(MALL_INTENT_STATUS).includes(v as any);
export const isValidMallRefundStatus = (v: string): v is FjnMallRefundStatus =>
  Object.values(MALL_REFUND_STATUS).includes(v as any);
