/**
 * FJN Order Service - 事件常量
 *
 * 严格遵循 H020 §3 + H042 Outbox 规范：
 *  - 事件命名格式：<domain>.<action>.<version>
 *  - 所有事件必须先写 outbox 表，再异步发布（H042）
 *  - 事件 payload 全部使用 snake_case
 *
 * 工业级补强：
 *  - 为 OrderCreated/OrderPaid/OrderCancelled 等核心事件添加详细 payload schema 说明
 *  - 增加 OrderConfirmed/OrderRiskHeld/OrderFulfilling/OrderFulfilled/OrderCompleted/OrderRefunded/OrderExpired 完整生命周期事件
 */

export const ORDER_EVENTS = {
  // 订单生命周期
  ORDER_CREATED: 'order.created.v1',
  ORDER_PENDING_PAYMENT: 'order.pending_payment.v1',
  ORDER_PAYMENT_PROCESSING: 'order.payment_processing.v1',
  ORDER_PAID: 'order.paid.v1',
  ORDER_RISK_CHECKING: 'order.risk_checking.v1',
  ORDER_CONFIRMED: 'order.confirmed.v1',
  ORDER_PROCESSING: 'order.processing.v1',
  ORDER_FULFILLING: 'order.fulfilling.v1',
  ORDER_FULFILLED: 'order.fulfilled.v1',
  ORDER_COMPLETED: 'order.completed.v1',
  ORDER_REFUND_REQUESTED: 'order.refund_requested.v1',
  ORDER_REFUND_REVIEWING: 'order.refund_reviewing.v1',
  ORDER_PARTIAL_REFUNDED: 'order.partial_refunded.v1',
  ORDER_REFUNDED: 'order.refunded.v1',
  ORDER_CANCELLED: 'order.cancelled.v1',
  ORDER_RISK_HOLD: 'order.risk_held.v1',
  ORDER_FAILED: 'order.failed.v1',
  ORDER_EXPIRED: 'order.expired.v1',
} as const;

export type FjnOrderEvent = (typeof ORDER_EVENTS)[keyof typeof ORDER_EVENTS];

/** 事件源 */
export const ORDER_EVENT_SOURCES = {
  SYSTEM: 'system',
  USER: 'user',
  ADMIN: 'admin',
  PAYMENT: 'payment',
  RISK: 'risk',
  CRON: 'cron',
  FULFILLMENT: 'fulfillment',
  EXTERNAL: 'external', // 外部服务回调
} as const;

export type FjnOrderEventSource = (typeof ORDER_EVENT_SOURCES)[keyof typeof ORDER_EVENT_SOURCES];

/** OrderCreated 事件 payload */
export interface OrderCreatedPayload {
  order_id: string;
  order_no: string;
  user_id: string;
  order_type: string;
  product_id: string;
  product_type: string;
  quantity: number;
  subtotal_amount: string;
  tax_amount: string;
  total_amount: string;
  currency: string;
  referrer_id?: string;
  country_code: string;
  created_at: string;
}

/** OrderPaid 事件 payload */
export interface OrderPaidPayload {
  order_id: string;
  order_no: string;
  user_id: string;
  product_id: string;
  product_type: string;
  paid_amount: string;
  tax_amount: string;
  total_amount: string;
  currency: string;
  payment_id?: string;
  payment_no?: string;
  paid_at: string;
}

/** OrderCancelled 事件 payload */
export interface OrderCancelledPayload {
  order_id: string;
  order_no: string;
  user_id: string;
  from_status: string;
  cancelled_at: string;
  reason?: string;
  operator_id?: string;
  operator_type: string;
}

/** OrderConfirmed 事件 payload */
export interface OrderConfirmedPayload {
  order_id: string;
  order_no: string;
  user_id: string;
  product_id: string;
  product_type: string;
  confirmed_at: string;
  operator_id?: string;
  operator_type: string;
}

/** OrderRiskHeld 事件 payload */
export interface OrderRiskHeldPayload {
  order_id: string;
  order_no: string;
  user_id: string;
  from_status: string;
  reason: string;
  risk_score?: number;
  risk_level?: string;
  operator_id?: string;
  operator_type: string;
}

/** OrderFulfilled 事件 payload */
export interface OrderFulfilledPayload {
  order_id: string;
  order_no: string;
  user_id: string;
  product_id: string;
  product_type: string;
  fulfilled_at: string;
  task_id?: string;
  task_no?: string;
}

/** OrderRefunded 事件 payload */
export interface OrderRefundedPayload {
  order_id: string;
  order_no: string;
  user_id: string;
  refund_id?: string;
  refund_no?: string;
  refund_amount: string;
  is_partial: boolean;
  currency: string;
  refunded_at: string;
  reason?: string;
}

/** 通用 Order 事件 payload */
export type OrderEventPayload =
  | OrderCreatedPayload
  | OrderPaidPayload
  | OrderCancelledPayload
  | OrderConfirmedPayload
  | OrderRiskHeldPayload
  | OrderFulfilledPayload
  | OrderRefundedPayload
  | Record<string, unknown>;
