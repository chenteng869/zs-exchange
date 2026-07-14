/**
 * FJN Payment Service - 事件常量
 *
 * 严格遵循 H021 §3 + H042 Outbox 规范：
 *  - 事件命名格式：<domain>.<action>.<version>
 *  - 所有事件必须先写 outbox 表，再异步发布（H042）
 *  - 事件 payload 全部使用 snake_case
 *
 * 工业级补强：
 *  - 完整覆盖 Payment 生命周期（created / pending / processing / success / failed / expired / refunding / partial_refunded / refunded）
 *  - 完整覆盖 Refund 生命周期（requested / reviewing / approved / rejected / processing / succeeded / failed）
 *  - 提供 7 个核心 payload 接口（结构化、可校验）
 */

export const PAYMENT_EVENTS = {
  // 支付单生命周期
  PAYMENT_CREATED: 'payment.created.v1',
  PAYMENT_PENDING: 'payment.pending.v1',
  PAYMENT_PROCESSING: 'payment.processing.v1',
  PAYMENT_SUCCEEDED: 'payment.succeeded.v1',
  PAYMENT_FAILED: 'payment.failed.v1',
  PAYMENT_EXPIRED: 'payment.expired.v1',
  PAYMENT_CANCELLED: 'payment.cancelled.v1',
  PAYMENT_MANUAL_REVIEW: 'payment.manual_review.v1',

  // 退款单生命周期
  PAYMENT_REFUNDING: 'payment.refunding.v1',
  PAYMENT_PARTIAL_REFUNDED: 'payment.partial_refunded.v1',
  PAYMENT_REFUNDED: 'payment.refunded.v1',

  // 退款事件
  REFUND_REQUESTED: 'refund.requested.v1',
  REFUND_REVIEWING: 'refund.reviewing.v1',
  REFUND_APPROVED: 'refund.approved.v1',
  REFUND_REJECTED: 'refund.rejected.v1',
  REFUND_PROCESSING: 'refund.processing.v1',
  REFUND_SUCCEEDED: 'refund.succeeded.v1',
  REFUND_FAILED: 'refund.failed.v1',
} as const;

export type FjnPaymentEvent = (typeof PAYMENT_EVENTS)[keyof typeof PAYMENT_EVENTS];

/** 事件源 */
export const PAYMENT_EVENT_SOURCES = {
  SYSTEM: 'system',
  USER: 'user',
  ADMIN: 'admin',
  CRON: 'cron',
  WEBHOOK: 'webhook',           // 支付通道回调
  CHAIN: 'chain',               // 链上监听
  RISK: 'risk',                 // 风控触发
  ORDER: 'order',               // Order Service 触发
  REFUND: 'refund',             // 退款服务触发
} as const;

export type FjnPaymentEventSource = (typeof PAYMENT_EVENT_SOURCES)[keyof typeof PAYMENT_EVENT_SOURCES];

/** PaymentCreated 事件 payload */
export interface PaymentCreatedPayload {
  payment_id: string;
  payment_no: string;
  order_id: string;
  user_id: string;
  payment_method: string;
  payment_channel?: string;
  amount: string;
  currency: string;
  chain_type?: string;
  receiver_address?: string;
  expired_at?: string;
  created_at: string;
}

/** PaymentSucceeded 事件 payload */
export interface PaymentSucceededPayload {
  payment_id: string;
  payment_no: string;
  order_id: string;
  user_id: string;
  amount: string;
  currency: string;
  tx_hash?: string;
  chain_type?: string;
  from_address?: string;
  to_address?: string;
  paid_at: string;
  source: string;     // webhook | simulate | admin | chain
}

/** PaymentFailed 事件 payload */
export interface PaymentFailedPayload {
  payment_id: string;
  payment_no: string;
  order_id: string;
  user_id: string;
  amount: string;
  currency: string;
  reason: string;
  failed_at: string;
  source: string;
}

/** PaymentExpired 事件 payload */
export interface PaymentExpiredPayload {
  payment_id: string;
  payment_no: string;
  order_id: string;
  user_id: string;
  amount: string;
  currency: string;
  expired_at: string;
  created_at: string;
}

/** RefundRequested 事件 payload */
export interface RefundRequestedPayload {
  refund_id: string;
  refund_no: string;
  order_id: string;
  payment_id: string;
  user_id: string;
  refund_type: string;     // full | partial
  refund_amount: string;
  currency: string;
  reason: string;
  requested_at: string;
}

/** RefundApproved 事件 payload */
export interface RefundApprovedPayload {
  refund_id: string;
  refund_no: string;
  order_id: string;
  payment_id: string;
  user_id: string;
  refund_amount: string;
  currency: string;
  reviewer_id: string;
  review_note?: string;
  approved_at: string;
}

/** RefundRejected 事件 payload */
export interface RefundRejectedPayload {
  refund_id: string;
  refund_no: string;
  order_id: string;
  payment_id: string;
  user_id: string;
  refund_amount: string;
  currency: string;
  reviewer_id: string;
  review_note: string;
  rejected_at: string;
}

/** RefundSucceeded 事件 payload */
export interface RefundSucceededPayload {
  refund_id: string;
  refund_no: string;
  order_id: string;
  payment_id: string;
  user_id: string;
  refund_amount: string;
  currency: string;
  tx_hash?: string;
  refunded_at: string;
  source: string;
}

/** 通用 Payment 事件 payload */
export type PaymentEventPayload =
  | PaymentCreatedPayload
  | PaymentSucceededPayload
  | PaymentFailedPayload
  | PaymentExpiredPayload
  | RefundRequestedPayload
  | RefundApprovedPayload
  | RefundRejectedPayload
  | RefundSucceededPayload
  | Record<string, unknown>;
