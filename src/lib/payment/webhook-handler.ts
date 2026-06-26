/**
 * Payment Webhook 处理（纯函数形式）
 *
 * 与 Next.js / Express 框架解耦，方便在不同环境复用：
 *  - 单元测试直接调用
 *  - Next.js App Router 接收 raw body 后调用
 *  - Express 接收 `req.rawBody` 后调用
 *
 * 流程：
 *  1. 校验签名（防伪造）
 *  2. 解析 JSON
 *  3. 标准化 payload → 内部 WebhookEvent
 *  4. 调用 manager.processWebhook 推进订单状态
 *  5. 返回处理结果
 *
 * 涉及：
 *  - handleStripeWebhook(rawBody, signature, secret, manager)
 *  - handleAdyenWebhook(rawBody, hmacKey, manager)
 */

import type { StripeClient } from './stripe-client';
import type { AdyenClient } from './adyen-client';
import type { PaymentService } from './payment-service';
import type { WebhookEvent, WebhookEventType } from './types';

// =============================================================================
// 通用结果
// =============================================================================

export interface HandleWebhookResult {
  ok: boolean;
  processed: number;
  events: Array<{
    orderId?: string;
    type: WebhookEventType;
    provider: 'STRIPE' | 'ADYEN';
  }>;
  errors: string[];
}

// =============================================================================
// Stripe
// =============================================================================

export interface HandleStripeWebhookOptions {
  rawBody: string;
  signature: string;
  /** 注入 StripeClient 用于验签（推荐从其拿 webhookSecret） */
  client: StripeClient;
  manager: PaymentService;
  /** 跳过签名校验（仅测试用） */
  skipSignatureCheck?: boolean;
}

/**
 * 处理 Stripe webhook 回调
 */
export async function handleStripeWebhook(
  rawBody: string,
  signature: string,
  client: StripeClient,
  manager: PaymentService,
): Promise<HandleWebhookResult> {
  const errors: string[] = [];
  const events: HandleWebhookResult['events'] = [];

  // 1. 验签
  const verify = client.verifyWebhookSignature(rawBody, signature);
  if (!verify.valid) {
    return {
      ok: false,
      processed: 0,
      events: [],
      errors: [`signature invalid: ${verify.code ?? 'unknown'}`],
    };
  }
  const event = verify.event;
  if (!event) {
    return {
      ok: false,
      processed: 0,
      events: [],
      errors: ['event body is empty'],
    };
  }

  // 2. 标准化
  const normalized = normalizeStripeEvent(event);
  if (!normalized) {
    return {
      ok: true,
      processed: 0,
      events: [],
      errors: ['unsupported event type'],
    };
  }

  // 3. 调 manager
  try {
    const order = manager.processWebhook(normalized);
    events.push({
      orderId: order?.id,
      type: normalized.type,
      provider: 'STRIPE',
    });
  } catch (err) {
    errors.push(`[PROCESS] ${(err as Error).message}`);
  }

  return {
    ok: errors.length === 0,
    processed: events.length,
    events,
    errors,
  };
}

// =============================================================================
// Adyen
// =============================================================================

export interface HandleAdyenWebhookOptions {
  rawBody: string;
  client: AdyenClient;
  manager: PaymentService;
  skipSignatureCheck?: boolean;
}

/**
 * 处理 Adyen webhook 标准通知。
 */
export async function handleAdyenWebhook(
  rawBody: string,
  client: AdyenClient,
  manager: PaymentService,
): Promise<HandleWebhookResult> {
  const errors: string[] = [];
  const events: HandleWebhookResult['events'] = [];

  // 1. 验签
  const verify = client.verifyWebhookSignature(rawBody);
  if (!verify.valid) {
    return {
      ok: false,
      processed: 0,
      events: [],
      errors: [`signature invalid: ${verify.code ?? 'unknown'}`],
    };
  }
  const payload = verify.payload;
  if (!payload) {
    return {
      ok: false,
      processed: 0,
      events: [],
      errors: ['payload missing'],
    };
  }

  // 2. 标准化
  const normalized = normalizeAdyenEvent(payload);
  if (!normalized) {
    return {
      ok: true,
      processed: 0,
      events: [],
      errors: ['unsupported event code'],
    };
  }

  // 3. 调 manager
  try {
    const order = manager.processWebhook(normalized);
    events.push({
      orderId: order?.id,
      type: normalized.type,
      provider: 'ADYEN',
    });
  } catch (err) {
    errors.push(`[PROCESS] ${(err as Error).message}`);
  }

  return {
    ok: errors.length === 0,
    processed: events.length,
    events,
    errors,
  };
}

// =============================================================================
// 内部：Stripe 事件标准化
// =============================================================================

function normalizeStripeEvent(event: any): WebhookEvent | null {
  const type = String(event?.type ?? '');
  const typeMap: Record<string, WebhookEventType> = {
    'payment_intent.succeeded': 'payment_intent.succeeded',
    'payment_intent.processing': 'payment_intent.processing',
    'payment_intent.canceled': 'payment_intent.canceled',
    'payment_intent.payment_failed': 'payment_intent.payment_failed',
    'payment_intent.requires_action': 'payment_intent.requires_action',
    'charge.refunded': 'charge.refunded',
    'charge.dispute.created': 'charge.dispute.created',
    'refund.failed': 'refund.failed',
  };
  const mapped = typeMap[type];
  if (!mapped) return null;

  const obj = event?.data?.object ?? {};
  const externalRef =
    obj.metadata?.idempotencyKey ??
    obj.metadata?.userId ?? // 兜底
    undefined;
  return {
    type: mapped,
    provider: 'STRIPE',
    paymentId: obj.id,
    refundId: obj.refunds?.data?.[0]?.id ?? obj.latest_charge,
    amount:
      typeof obj.amount === 'number' && obj.currency
        ? Number(obj.amount) / (['JPY', 'KRW'].includes(String(obj.currency).toUpperCase()) ? 1 : 100)
        : typeof obj.amount === 'number'
          ? Number(obj.amount) / 100
          : undefined,
    currency: obj.currency ? String(obj.currency).toUpperCase() : undefined,
    externalRef,
    status: obj.status,
    failureReason: obj.last_payment_error?.message ?? obj.failure_reason,
    raw: event,
    receivedAt: Date.now(),
  };
}

// =============================================================================
// 内部：Adyen 事件标准化
// =============================================================================

function normalizeAdyenEvent(payload: any): WebhookEvent | null {
  const code = String(payload.eventCode ?? '').toLowerCase();
  const success = String(payload.success ?? '').toLowerCase() === 'true';

  // 事件类型映射
  let type: WebhookEventType;
  if (code === 'authorisation' && success) {
    type = 'payment_intent.succeeded';
  } else if (code === 'authorisation' && !success) {
    type = 'payment_intent.payment_failed';
  } else if (code === 'authorisation' && payload.additionalData?.threeDS2AuthenticationReason) {
    type = 'payment_intent.requires_action';
  } else if (code === 'refund' || code === 'refunded') {
    type = 'charge.refunded';
  } else if (code === 'chargeback' || code === 'chargeback_reversed' || code === 'dispute') {
    type = 'charge.dispute.created';
  } else if (code === 'cancellation' || code === 'canceled' || code === 'cancelled') {
    type = 'payment_intent.canceled';
  } else if (code === 'pending') {
    type = 'payment_intent.processing';
  } else {
    type = 'notification';
  }

  const amount = payload.amount?.value;
  const currency = payload.amount?.currency;
  const amountMajor =
    typeof amount === 'number' && currency
      ? Number(amount) / (['JPY', 'KRW'].includes(String(currency).toUpperCase()) ? 1 : 100)
      : undefined;

  return {
    type,
    provider: 'ADYEN',
    paymentId: payload.pspReference,
    refundId: payload.additionalData?.modificationPspReference ?? payload.originalReference,
    amount: amountMajor,
    currency: currency ? String(currency).toUpperCase() : undefined,
    externalRef: payload.merchantReference,
    status: success ? 'succeeded' : 'failed',
    failureReason: payload.reason,
    raw: payload,
    receivedAt: Date.now(),
  };
}
