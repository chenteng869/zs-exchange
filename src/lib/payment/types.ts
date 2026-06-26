/**
 * Payment 模块统一类型定义 + 常量
 *
 * 覆盖：
 *  - 银行卡支付请求 / 结果
 *  - 退款请求 / 结果
 *  - 3DS 跳转 / 处理
 *  - 风控限额
 *  - 错误
 *
 * 不引入任何第三方类型（保持纯 TS）。
 */

import { logger as defaultLogger } from '../logger';

// =============================================================================
// Provider 标识
// =============================================================================

export type PaymentProvider = 'STRIPE' | 'ADYEN';

export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'unionpay'
  | 'jcb'
  | 'discover'
  | 'unknown';

// =============================================================================
// 货币
// =============================================================================

export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CNY',
  'JPY',
  'KRW',
  'HKD',
  'SGD',
  'AUD',
] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** 0 位小数的货币（JPY、KRW 等） */
export const ZERO_DECIMAL_CURRENCIES = ['JPY', 'KRW'] as const;
export type ZeroDecimalCurrency = (typeof ZERO_DECIMAL_CURRENCIES)[number];

/** 把法币金额换算为最小单位（分） */
export function toMinorUnit(amount: number, currency: string): number {
  const cur = currency.toUpperCase() as SupportedCurrency;
  if ((ZERO_DECIMAL_CURRENCIES as readonly string[]).includes(cur)) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

/** 把最小单位换算回主单位 */
export function fromMinorUnit(minor: number, currency: string): number {
  const cur = currency.toUpperCase() as SupportedCurrency;
  if ((ZERO_DECIMAL_CURRENCIES as readonly string[]).includes(cur)) {
    return minor;
  }
  return Math.round(minor) / 100;
}

// =============================================================================
// 风控限额
// =============================================================================

/**
 * 风控限额（按货币）。单位为主单位（USD = 美元，不是分）。
 *  - perTransaction : 单笔最大金额
 *  - per24hPerUser   : 单用户 24h 累计
 *  - perCard         : 单卡 24h 累计
 */
export const PAYMENT_LIMITS: {
  perTransaction: Record<SupportedCurrency, number>;
  per24hPerUser: Record<SupportedCurrency, number>;
  perCard: Record<SupportedCurrency, number>;
} = {
  perTransaction: {
    USD: 10000,
    EUR: 9000,
    GBP: 8000,
    CNY: 70000,
    JPY: 1_500_000,
    KRW: 13_000_000,
    HKD: 78000,
    SGD: 13500,
    AUD: 15000,
  },
  per24hPerUser: {
    USD: 50000,
    EUR: 45000,
    GBP: 40000,
    CNY: 350000,
    JPY: 7_500_000,
    KRW: 65_000_000,
    HKD: 390000,
    SGD: 67500,
    AUD: 75000,
  },
  perCard: {
    USD: 20000,
    EUR: 18000,
    GBP: 16000,
    CNY: 140000,
    JPY: 3_000_000,
    KRW: 26_000_000,
    HKD: 156000,
    SGD: 27000,
    AUD: 30000,
  },
};

// =============================================================================
// 卡信息
// =============================================================================

export interface CardInfo {
  /** 完整卡号（PAN），可含空格 */
  number: string;
  /** 1 - 12 */
  expMonth: number;
  /** 4 位年份，如 2028 */
  expYear: number;
  /** 3 - 4 位 CVC/CVV */
  cvc: string;
  /** 持卡人姓名 */
  holderName: string;
}

export interface BillingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  /** ISO 3166-1 alpha-2 */
  country: string;
}

// =============================================================================
// 支付请求 / 结果
// =============================================================================

export interface PaymentRequest {
  /** 平台 userId */
  userId: string;
  /** 法币金额（主单位，如 100 = $100.00） */
  amount: number;
  /** 法币币种 */
  currency: SupportedCurrency;
  /** 描述（账单显示） */
  description?: string;
  /** 卡信息 */
  card: CardInfo;
  /** 账单地址 */
  billingAddress?: BillingAddress;
  /** 透传元数据（Stripe/Adyen 会原样回传到 webhook） */
  metadata?: Record<string, string>;
  /** 账单描述（statement descriptor） */
  statementDescriptor?: string;
  /** 幂等键（推荐 UUID） */
  idempotencyKey: string;
  /** 是否强制 3DS（默认根据金额 / 地区自动判断） */
  requires3DS?: boolean;
  /** 强制指定 provider（默认根据地区自动选） */
  provider?: PaymentProvider;
}

export type PaymentStatus =
  | 'succeeded'
  | 'requires_action'
  | 'requires_3ds'
  | 'failed'
  | 'pending'
  | 'refunded'
  | 'partially_refunded';

export interface PaymentResult {
  /** Provider ID（pi_xxx / pspReference） */
  paymentId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  currency: string;
  /** 手续费（法币主单位） */
  fee: number;
  /** 实际到账（amount - fee） */
  netAmount: number;
  /** 授权码（auth code） */
  authCode?: string;
  errorCode?: string;
  errorMessage?: string;
  /** 3DS 跳转 URL（前端展示） */
  threeDsUrl?: string;
  createdAt: number;
  cardLast4: string;
  cardBrand: CardBrand;
}

// =============================================================================
// 退款
// =============================================================================

export type RefundReason = 'duplicate' | 'fraudulent' | 'requested_by_customer';

export interface RefundRequest {
  /** 原支付 ID */
  paymentId: string;
  /** 退款金额（不传 = 全额） */
  amount?: number;
  reason?: RefundReason;
  /** 幂等键 */
  idempotencyKey: string;
  /** 透传元数据 */
  metadata?: Record<string, string>;
}

export type RefundStatus = 'pending' | 'succeeded' | 'failed';

export interface RefundResult {
  refundId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  errorMessage?: string;
  createdAt: number;
}

// =============================================================================
// 3DS
// =============================================================================

export interface ThreeDSResult {
  paymentId: string;
  /** 3DS challenge 提交后返回的支付结果 */
  status: PaymentStatus;
  threeDsUrl?: string;
  errorMessage?: string;
}

// =============================================================================
// 业务层：订单状态
// =============================================================================

export type PaymentOrderStatus =
  | 'initiated'
  | '3ds_required'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export interface PaymentOrder {
  /** 平台订单号（幂等键） */
  id: string;
  userId: string;
  provider: PaymentProvider;
  status: PaymentOrderStatus;
  amount: number;
  currency: SupportedCurrency;
  fee: number;
  netAmount: number;
  /** provider 的 payment id */
  providerPaymentId?: string;
  cardLast4: string;
  cardBrand: CardBrand;
  threeDsUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
  refunds: RefundResult[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  refundedAt?: number;
}

// =============================================================================
// Webhook 事件
// =============================================================================

export type WebhookEventType =
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.processing'
  | 'payment_intent.canceled'
  | 'payment_intent.requires_action'
  | 'charge.refunded'
  | 'charge.dispute.created'
  | 'refund.failed'
  | 'notification' // Adyen 标准通知
  | 'unknown';

export interface WebhookEvent {
  type: WebhookEventType;
  provider: PaymentProvider;
  /** provider 支付 ID */
  paymentId?: string;
  /** provider 退款 ID */
  refundId?: string;
  /** 金额（主单位） */
  amount?: number;
  currency?: string;
  /** 平台订单号（idempotencyKey 或 metadata 透传） */
  externalRef?: string;
  status?: string;
  failureReason?: string;
  raw?: unknown;
  receivedAt: number;
}

// =============================================================================
// 业务层事件订阅
// =============================================================================

export type PaymentUpdateHandler = (
  order: PaymentOrder,
  event: WebhookEvent | { type: 'create' | 'update' | 'refund' | '3ds'; at: number },
) => void | Promise<void>;

// =============================================================================
// 错误
// =============================================================================

export class PaymentError extends Error {
  public readonly code: string;
  public readonly provider?: PaymentProvider;
  public readonly status?: number;
  public readonly body?: unknown;
  constructor(
    code: string,
    message: string,
    opts: { provider?: PaymentProvider; status?: number; body?: unknown } = {},
  ) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.provider = opts.provider;
    this.status = opts.status;
    this.body = opts.body;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PaymentValidationError extends PaymentError {
  constructor(code: string, message: string) {
    super(code, message);
    this.name = 'PaymentValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// =============================================================================
// 工具：地区 → Provider 决策
// =============================================================================

/**
 * 根据账单地址或用户国家，决策默认 provider。
 *  - 欧盟国家 → Adyen（合规更好）
 *  - 其他 → Stripe
 *  - 没传国家 → Stripe
 */
export function pickProviderByCountry(country: string | undefined): PaymentProvider {
  if (!country) return 'STRIPE';
  const c = country.toUpperCase();
  // 欧盟 27 国 + EEA（粗略列举）
  const EU = new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
    'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
    'SI', 'ES', 'SE',
    'IS', 'LI', 'NO', // EEA
  ]);
  if (EU.has(c)) return 'ADYEN';
  return 'STRIPE';
}

// =============================================================================
// 工具：判断是否需要 3DS
// =============================================================================

/**
 * 简单启发式：金额 > 30 美元等值 → 需要 3DS；
 * 欧盟国家所有金额都需要 3DS（强客户认证 SCA）。
 */
export function shouldRequire3DS(opts: {
  amount: number;
  currency: SupportedCurrency;
  country?: string;
  force?: boolean;
}): boolean {
  if (opts.force) return true;
  const c = (opts.country || '').toUpperCase();
  if (['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'IE', 'PT', 'AT', 'FI'].includes(c)) {
    // SCA 强认证：欧盟 30 EUR 等值以上必须 3DS
    const threshold = getEurEquivalent(opts.amount, opts.currency);
    return threshold >= 30;
  }
  // 其他地区：30 美元等值以上
  const threshold = getEurEquivalent(opts.amount, opts.currency);
  return threshold >= 30;
}

/** 极简汇率换算（演示用，生产应查实时汇率） */
function getEurEquivalent(amount: number, currency: string): number {
  const c = currency.toUpperCase();
  const rough: Record<string, number> = {
    USD: 0.92,
    EUR: 1,
    GBP: 1.17,
    CNY: 0.13,
    JPY: 0.0061,
    KRW: 0.00069,
    HKD: 0.12,
    SGD: 0.68,
    AUD: 0.6,
  };
  return amount * (rough[c] ?? 1);
}

// =============================================================================
// 工具：Luhn 校验
// =============================================================================

/**
 * 校验卡号合法性。
 *  - 去空格
 *  - Luhn 校验
 *  - 品牌识别（前缀）
 *  - 返回 last4
 */
export function validateCard(number: string): {
  valid: boolean;
  brand: CardBrand;
  last4: string;
  errors: string[];
} {
  const errors: string[] = [];
  const cleaned = (number || '').replace(/[\s-]/g, '');
  if (!cleaned) {
    errors.push('card number is required');
    return { valid: false, brand: 'unknown', last4: '', errors };
  }
  if (!/^\d+$/.test(cleaned)) {
    errors.push('card number must be digits only');
  }
  if (cleaned.length < 12 || cleaned.length > 19) {
    errors.push(`card number length invalid: ${cleaned.length}`);
  }

  const brand = detectBrand(cleaned);
  if (brand === 'unknown') {
    errors.push('unable to detect card brand');
  }

  // Luhn
  let sum = 0;
  let alt = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let d = cleaned.charCodeAt(i) - 48;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  const luhnOk = sum % 10 === 0 && cleaned.length >= 12;
  if (!luhnOk) errors.push('luhn check failed');

  return {
    valid: errors.length === 0,
    brand,
    last4: cleaned.slice(-4),
    errors,
  };
}

/** 卡号前缀 → 品牌 */
export function detectBrand(num: string): CardBrand {
  const n = (num || '').replace(/[\s-]/g, '');
  if (!n) return 'unknown';
  // Visa: 4xxx
  if (/^4\d{12,18}$/.test(n)) return 'visa';
  // Mastercard: 51-55 / 2221-2720
  if (/^(5[1-5]\d{14}|2(2[2-9][1-9]|[2-8]\d{3}|[89]\d{2})\d{10,12})$/.test(n)) return 'mastercard';
  // Amex: 34 / 37
  if (/^3[47]\d{13}$/.test(n)) return 'amex';
  // UnionPay: 62 / 81
  if (/^(62|81)\d{14,17}$/.test(n)) return 'unionpay';
  // JCB: 35
  if (/^35(2[89]|[3-8]\d)\d{12,15}$/.test(n)) return 'jcb';
  // Discover: 6011 / 65 / 644-649
  if (/^(6011|65|64[4-9])\d{12,16}$/.test(n)) return 'discover';
  return 'unknown';
}

// =============================================================================
// 工具：校验 CVC / 过期
// =============================================================================

/** CVC 校验：3 位（普通卡） 或 4 位（Amex） */
export function validateCvc(cvc: string, brand: CardBrand): { valid: boolean; reason?: string } {
  if (!cvc) return { valid: false, reason: 'cvc is required' };
  if (!/^\d+$/.test(cvc)) return { valid: false, reason: 'cvc must be digits only' };
  if (brand === 'amex') {
    return cvc.length === 4
      ? { valid: true }
      : { valid: false, reason: 'amex cvc must be 4 digits' };
  }
  return cvc.length === 3
    ? { valid: true }
    : { valid: false, reason: 'cvc must be 3 digits' };
}

/** 过期日期校验：未过期 + 格式合法 */
export function validateExpiry(
  expMonth: number,
  expYear: number,
  now: number = Date.now(),
): { valid: boolean; reason?: string } {
  if (!Number.isInteger(expMonth) || expMonth < 1 || expMonth > 12) {
    return { valid: false, reason: 'expMonth must be 1-12' };
  }
  if (!Number.isInteger(expYear) || expYear < 1970 || expYear > 9999) {
    return { valid: false, reason: 'expYear invalid' };
  }
  const y = expYear < 100 ? 2000 + expYear : expYear;
  // 月份末日 + 1 天 = 过期
  const lastDay = new Date(y, expMonth, 0, 23, 59, 59, 999).getTime();
  if (now > lastDay) {
    return { valid: false, reason: 'card expired' };
  }
  return { valid: true };
}

// =============================================================================
// 风控结果（业务层使用）
// =============================================================================

export interface RiskCheckResult {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
}

// =============================================================================
// 工具：稳定 hash（mock 用）
// =============================================================================

/** djb2 hash，用于 mock 数据生成 */
export function djb2(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0;
}

// =============================================================================
// Logger 复用
// =============================================================================

export { defaultLogger };
