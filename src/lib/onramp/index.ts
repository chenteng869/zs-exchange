/**
 * Onramp（法币入金）模块统一导出
 *
 * 模块组成：
 *  - moonpay-client         MoonPay REST API 客户端（v3 公共 + v1 私有）
 *  - transaction-manager    买币订单管理器（业务层 + 状态机）
 *  - webhook-verifier       MoonPay Webhook 签名校验（HMAC-SHA256）
 *  - webhook-handler        框架无关的 webhook 纯函数处理入口
 *
 * 用法：
 *   import {
 *     MoonPayClient,
 *     MoonPayTransactionManager,
 *     handleMoonPayWebhook,
 *     verifyMoonPaySignature,
 *   } from '@/lib/onramp';
 */

// MoonPay REST API 客户端
export {
  MoonPayClient,
  createMoonPayClient,
  MoonPayApiError,
  MOONPAY_API_KEY_PUBLIC,
  MOONPAY_API_KEY_SECRET,
  MOONPAY_WEBHOOK_SECRET,
  MOONPAY_DEFAULT_BASE_CURRENCY,
  MOONPAY_ORDER_EXPIRE_MS,
  MOONPAY_WIDGET_BASE,
  type MoonPayCurrency,
  type CreateTransactionOptions,
  type CreateTransactionResult,
  type MoonPayTransaction,
  type GetPriceOptions,
  type GetPriceResult,
  type GetExchangeLimitsResult,
  type MoonPayClientOptions,
} from './moonpay-client';

// 买币订单管理器
export {
  MoonPayTransactionManager,
  createMoonPayTransactionManager,
  MoonPayManagerError,
  canTransition,
  type SupportedCrypto,
  type SupportedFiat,
  type OrderStatus,
  type BuyOrderOptions,
  type BuyOrder,
  type OrderUpdateHandler,
  type MoonPayTransactionManagerOptions,
  type MoonPayWebhookPayload,
} from './transaction-manager';

// Webhook 签名校验
export {
  verifyMoonPaySignature,
  signMoonPayWebhook,
  MoonPayWebhookSignatureError,
} from './webhook-verifier';

// Webhook 纯函数处理
export {
  handleMoonPayWebhook,
  type HandleMoonPayWebhookResult,
  type HandleMoonPayWebhookOptions,
} from './webhook-handler';
