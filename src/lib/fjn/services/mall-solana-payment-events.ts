/**
 * Mall Solana Payment Service - 事件定义
 */

export const MALL_SOLANA_PAYMENT_EVENTS = {
  PAYMENT_INTENT_CREATED: 'mall.payment.intent_created',
  PAYMENT_INTENT_PAID: 'mall.payment.intent_paid',
  PAYMENT_INTENT_EXPIRED: 'mall.payment.intent_expired',
  PAYMENT_INTENT_CANCELLED: 'mall.payment.intent_cancelled',
  ORDER_CREATED: 'mall.order.created',
  ORDER_PAID: 'mall.order.paid',
  ORDER_CONFIRMED: 'mall.order.confirmed',
  ORDER_COMPLETED: 'mall.order.completed',
  ORDER_FAILED: 'mall.order.failed',
  REFUND_REQUESTED: 'mall.refund.requested',
  REFUND_APPROVED: 'mall.refund.approved',
  REFUND_SUCCEEDED: 'mall.refund.succeeded',
  REFUND_FAILED: 'mall.refund.failed',
  SETTLEMENT_CREATED: 'mall.settlement.created',
  SETTLEMENT_PAID: 'mall.settlement.paid',
} as const;

export const MALL_SOLANA_PAYMENT_EVENT_SOURCES = {
  MALL_SERVICE: 'mall_solana_payment_service',
  SOLANA_PAY_SERVICE: 'solana_pay_service',
  ADMIN: 'admin',
  REFUND_WORKER: 'refund_worker',
} as const;

export type FjnMallSolanaPaymentEvent = (typeof MALL_SOLANA_PAYMENT_EVENTS)[keyof typeof MALL_SOLANA_PAYMENT_EVENTS];
export type FjnMallSolanaPaymentEventSource = (typeof MALL_SOLANA_PAYMENT_EVENT_SOURCES)[keyof typeof MALL_SOLANA_PAYMENT_EVENT_SOURCES];

export interface MallPaymentIntentCreatedPayload {
  intentNo: string;
  orderNo: string;
  userId: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  expiresAt: string;
}

export interface MallOrderPaidPayload {
  orderNo: string;
  userId: string;
  totalAmount: string;
  paidAmount: string;
  paymentMethod: string;
  txHash: string;
}

export type FjnMallSolanaPaymentEventPayload =
  | MallPaymentIntentCreatedPayload
  | MallOrderPaidPayload
  | Record<string, unknown>;
