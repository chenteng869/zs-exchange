/**
 * Payment 模块统一导出
 *
 * 模块组成：
 *  - types             类型定义 + 常量 + Luhn 校验
 *  - stripe-client     Stripe REST API 客户端
 *  - adyen-client      Adyen Checkout API 客户端
 *  - payment-service   业务层（状态机 + 风控 + 订单）
 *  - webhook-handler   框架无关的 webhook 纯函数处理入口
 *
 * 用法：
 *   import {
 *     PaymentService,
 *     StripeClient,
 *     AdyenClient,
 *     handleStripeWebhook,
 *     handleAdyenWebhook,
 *     validateCard,
 *     PAYMENT_LIMITS,
 *   } from '@/lib/payment';
 */

// 类型 + 工具
export {
  // 类型
  type PaymentProvider,
  type CardBrand,
  type CardInfo,
  type BillingAddress,
  type PaymentRequest,
  type PaymentResult,
  type PaymentStatus,
  type RefundRequest,
  type RefundResult,
  type RefundReason,
  type RefundStatus,
  type ThreeDSResult,
  type PaymentOrder,
  type PaymentOrderStatus,
  type PaymentUpdateHandler,
  type WebhookEvent,
  type WebhookEventType,
  type SupportedCurrency,
  type ZeroDecimalCurrency,
  type RiskCheckResult,
  // 常量
  SUPPORTED_CURRENCIES,
  ZERO_DECIMAL_CURRENCIES,
  PAYMENT_LIMITS,
  // 工具
  toMinorUnit,
  fromMinorUnit,
  pickProviderByCountry,
  shouldRequire3DS,
  validateCard,
  validateCvc,
  validateExpiry,
  detectBrand,
  djb2,
  // 错误
  PaymentError,
  PaymentValidationError,
} from './types';

// Stripe 客户端
export {
  StripeClient,
  createStripeClient,
  StripeApiError,
  STRIPE_API_BASE,
  STRIPE_DEFAULT_TIMEOUT_MS,
  STRIPE_DEFAULT_MAX_RETRIES,
  STRIPE_DEFAULT_BACKOFF_BASE_MS,
  STRIPE_DEFAULT_MAX_BACKOFF_MS,
  STRIPE_FEE_PERCENT,
  STRIPE_FEE_FIXED,
  type StripeClientOptions,
} from './stripe-client';

// Adyen 客户端
export {
  AdyenClient,
  createAdyenClient,
  AdyenApiError,
  ADYEN_TEST_BASE,
  ADYEN_LIVE_BASE,
  ADYEN_DEFAULT_TIMEOUT_MS,
  ADYEN_DEFAULT_MAX_RETRIES,
  ADYEN_DEFAULT_BACKOFF_BASE_MS,
  ADYEN_DEFAULT_MAX_BACKOFF_MS,
  ADYEN_FEE_PERCENT,
  ADYEN_FEE_FIXED,
  type AdyenClientOptions,
  type AdyenNotificationPayload,
} from './adyen-client';

// 业务层
export {
  PaymentService,
  createPaymentService,
  canTransition as canTransitionPayment,
  type PaymentServiceOptions,
} from './payment-service';

// Webhook 处理
export {
  handleStripeWebhook,
  handleAdyenWebhook,
  type HandleWebhookResult,
  type HandleStripeWebhookOptions,
  type HandleAdyenWebhookOptions,
} from './webhook-handler';
