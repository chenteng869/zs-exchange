/**
 * Adyen 信用卡支付客户端（备选，欧盟合规优先）
 *
 * 职责：
 *  - 封装 Adyen Checkout API：
 *      POST /payments                  创建支付（含 3DS 跳转）
 *      POST /payments/details          3DS challenge 提交附加信息
 *      POST /refunds                   退款
 *  - Basic Auth：`apiKey:merchantAccount`
 *  - 自动重试 5xx / 429 / TIMEOUT（指数退避）
 *  - 演示降级：API Key 包含 'mock' 时返回稳定 mock 数据
 *  - Webhook 标准通知签名校验（HMAC-SHA256）
 *  - 不引外部依赖（fetch + node:crypto）
 *
 * 用法：
 *   const client = new AdyenClient({ apiKey: 'AQEyhmfxL47PaRZH...', merchantAccount: 'SMY-ECOM' });
 *   const r = await client.createPayment({ ... });
 *   // 3DS: r.status === 'requires_3ds' → 前端跳转 r.threeDsUrl
 *   // 提交 challenge 后再调 client.getPaymentDetails(paymentId, details)
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { logger as defaultLogger } from '../logger';
import {
  type CardBrand,
  type PaymentProvider,
  type PaymentRequest,
  type PaymentResult,
  type PaymentStatus,
  type RefundRequest,
  type RefundResult,
  type SupportedCurrency,
  djb2,
  detectBrand,
  fromMinorUnit,
  toMinorUnit,
  PaymentError,
} from './types';

// =============================================================================
// 常量
// =============================================================================

export const ADYEN_TEST_BASE = 'https://checkout-test.adyen.com/v71';
export const ADYEN_LIVE_BASE = 'https://checkout-live.adyen.com/v71';

export const ADYEN_DEFAULT_TIMEOUT_MS = 15_000;
export const ADYEN_DEFAULT_MAX_RETRIES = 3;
export const ADYEN_DEFAULT_BACKOFF_BASE_MS = 400;
export const ADYEN_DEFAULT_MAX_BACKOFF_MS = 5_000;

/** Adyen 固定手续费（演示）：收单 + 0.12 EUR */
export const ADYEN_FEE_PERCENT = 0.025;
export const ADYEN_FEE_FIXED = 0.12;

// =============================================================================
// 错误
// =============================================================================

export class AdyenApiError extends PaymentError {
  constructor(
    code: string,
    message: string,
    opts: { status?: number; body?: unknown } = {},
  ) {
    super(code, message, { provider: 'ADYEN', status: opts.status, body: opts.body });
    this.name = 'AdyenApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// =============================================================================
// 客户端配置
// =============================================================================

export interface AdyenClientOptions {
  apiKey?: string;
  merchantAccount?: string;
  /** webhook HMAC key（Configuration -> HMAC Key for Notification Webhooks） */
  hmacKey?: string;
  /** live 模式默认 false（test） */
  live?: boolean;
  apiBase?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  backoffBaseMs?: number;
  maxBackoffMs?: number;
  mockMode?: boolean;
  logger?: typeof defaultLogger;
  now?: () => number;
  extraHeaders?: Record<string, string>;
}

// =============================================================================
// AdyenClient
// =============================================================================

export class AdyenClient {
  public readonly apiKey: string;
  public readonly merchantAccount: string;
  public readonly hmacKey: string;
  public readonly live: boolean;
  public readonly mockMode: boolean;
  private readonly apiBase: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly backoffBaseMs: number;
  private readonly maxBackoffMs: number;
  private readonly logger: typeof defaultLogger;
  private readonly now: () => number;
  private readonly extraHeaders: Record<string, string>;

  constructor(opts: AdyenClientOptions = {}) {
    this.apiKey =
      opts.apiKey ??
      (typeof process !== 'undefined' ? process.env?.ADYEN_API_KEY : undefined) ??
      'AQEyhmfxL47PaRZH_test_mock';
    this.merchantAccount =
      opts.merchantAccount ??
      (typeof process !== 'undefined' ? process.env?.ADYEN_MERCHANT_ACCOUNT : undefined) ??
      'SMY-ECOM-MOCK';
    this.hmacKey =
      opts.hmacKey ??
      (typeof process !== 'undefined' ? process.env?.ADYEN_HMAC_KEY : undefined) ??
      'mock-hmac-key';
    this.live = !!opts.live;
    const explicitMock = !!opts.mockMode;
    this.mockMode = explicitMock || isMockKey(this.apiKey) || isMockKey(this.merchantAccount);
    this.apiBase = (opts.apiBase ?? (this.live ? ADYEN_LIVE_BASE : ADYEN_TEST_BASE)).replace(/\/+$/, '');
    this.fetchImpl =
      opts.fetchImpl ??
      (typeof fetch !== 'undefined'
        ? fetch
        : (() => {
            throw new Error('AdyenClient: no fetch implementation available');
          })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? ADYEN_DEFAULT_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries ?? ADYEN_DEFAULT_MAX_RETRIES;
    this.backoffBaseMs = opts.backoffBaseMs ?? ADYEN_DEFAULT_BACKOFF_BASE_MS;
    this.maxBackoffMs = opts.maxBackoffMs ?? ADYEN_DEFAULT_MAX_BACKOFF_MS;
    this.logger = opts.logger ?? defaultLogger;
    this.now = opts.now ?? (() => Date.now());
    this.extraHeaders = opts.extraHeaders ?? {};
  }

  // -------------------------------------------------------------------------
  // 内部：HTTP
  // -------------------------------------------------------------------------

  private get authHeader(): string {
    // Adyen: "Basic " + base64("apiKey:merchantAccount")
    const token = Buffer.from(`${this.apiKey}:${this.merchantAccount}`, 'utf8').toString('base64');
    return `Basic ${token}`;
  }

  private async fetchWithTimeout(input: string, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetchImpl(input, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  private shouldRetryStatus(status: number): boolean {
    if (status === 408 || status === 429) return true;
    return status >= 500 && status < 600;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  private async postJson<T = any>(path: string, body: Record<string, unknown>): Promise<T> {
    if (this.mockMode) {
      throw new AdyenApiError('MOCK_MODE', 'client running in mock mode');
    }
    const url = `${this.apiBase}${path}`;
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const resp = await this.fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: this.authHeader,
            'Idempotency-Key': String((body as any).idempotencyKey ?? ''),
            ...this.extraHeaders,
          },
          body: JSON.stringify(body),
        });
        if (this.shouldRetryStatus(resp.status) && attempt < this.maxRetries) {
          const backoff = Math.min(this.maxBackoffMs, this.backoffBaseMs * 2 ** attempt);
          this.logger.warn(
            `[Adyen] POST ${path} -> ${resp.status}, retry in ${backoff}ms (attempt ${attempt + 1}/${this.maxRetries})`,
          );
          await this.sleep(backoff);
          continue;
        }
        const text = await safeText(resp);
        if (!resp.ok) {
          const code = (() => {
            if (resp.status === 401 || resp.status === 403) return 'UNAUTHORIZED';
            if (resp.status === 400 || resp.status === 422) return 'BAD_REQUEST';
            if (resp.status === 404) return 'NOT_FOUND';
            return 'HTTP_ERROR';
          })();
          throw new AdyenApiError(
            code,
            `Adyen POST ${path} -> ${resp.status}: ${text.slice(0, 200)}`,
            { status: resp.status, body: text },
          );
        }
        return (await JSON.parse(text)) as T;
      } catch (err) {
        lastErr = err;
        if (
          err instanceof AdyenApiError &&
          (err.code === 'UNAUTHORIZED' || err.code === 'BAD_REQUEST' || err.code === 'NOT_FOUND')
        ) {
          throw err;
        }
        if (attempt < this.maxRetries) {
          const backoff = Math.min(this.maxBackoffMs, this.backoffBaseMs * 2 ** attempt);
          this.logger.warn(
            `[Adyen] POST ${path} failed: ${(err as Error).message}, retry in ${backoff}ms`,
          );
          await this.sleep(backoff);
          continue;
        }
      }
    }
    throw new AdyenApiError(
      'NETWORK_ERROR',
      `Adyen POST ${path} failed after ${this.maxRetries + 1} attempts: ${(lastErr as Error)?.message ?? 'unknown'}`,
    );
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  private calcFee(amount: number, currency: SupportedCurrency): number {
    const zeroDec = ['JPY', 'KRW'].includes(currency.toUpperCase());
    const fee = amount * ADYEN_FEE_PERCENT + (zeroDec ? 0 : ADYEN_FEE_FIXED);
    return Math.round(fee * 100) / 100;
  }

  private parsePayment(resp: any): PaymentResult {
    const status = mapAdyenResultCode(resp.resultCode);
    const amountMinor = Number(resp.amount?.value ?? 0);
    const currency = String(resp.amount?.currency ?? 'USD').toUpperCase();
    const amount = fromMinorUnit(amountMinor, currency);
    const fee = this.calcFee(amount, currency as SupportedCurrency);
    const netAmount = Math.max(0, Math.round((amount - fee) * 100) / 100);
    const cardData = resp.additionalData ?? {};
    const last4 = String(cardData.cardSummary ?? cardData.lastFour ?? '').slice(-4) || '0000';
    const brandRaw = String(cardData.cardBrand ?? cardData.brand ?? 'unknown').toLowerCase();
    const brand = mapAdyenBrand(brandRaw);
    return {
      paymentId: String(resp.pspReference ?? ''),
      provider: 'ADYEN' as PaymentProvider,
      status,
      amount,
      currency,
      fee,
      netAmount,
      authCode: resp.authCode,
      threeDsUrl: resp.action?.url,
      errorCode: resp.refusalReason,
      errorMessage: resp.refusalReason ?? resp.resultCode,
      createdAt: this.now(),
      cardLast4: last4,
      cardBrand: brand,
    };
  }

  // -------------------------------------------------------------------------
  // 公共 API — Payment
  // -------------------------------------------------------------------------

  /**
   * 创建支付。
   *  - 3DS：resultCode = 'RedirectShopper' → 返回 threeDsUrl
   *  - 成功：resultCode = 'Authorised' → status = 'succeeded'
   *  - 拒绝：resultCode = 'Refused' → status = 'failed'
   */
  async createPayment(opts: PaymentRequest): Promise<PaymentResult> {
    if (!opts.userId) throw new AdyenApiError('BAD_REQUEST', 'userId is required');
    if (!opts.idempotencyKey) throw new AdyenApiError('BAD_REQUEST', 'idempotencyKey is required');
    if (!opts.card?.number) throw new AdyenApiError('BAD_REQUEST', 'card is required');

    const amountMinor = toMinorUnit(opts.amount, opts.currency);

    if (this.mockMode) {
      return this.buildMockPayment(opts);
    }

    const num = opts.card.number.replace(/[\s-]/g, '');
    const body: Record<string, unknown> = {
      merchantAccount: this.merchantAccount,
      amount: { currency: opts.currency, value: amountMinor },
      reference: opts.idempotencyKey,
      paymentMethod: {
        type: 'scheme',
        number: num,
        expiryMonth: String(opts.card.expMonth).padStart(2, '0'),
        expiryYear: String(opts.card.expYear).slice(-2),
        holderName: opts.card.holderName,
        cvc: opts.card.cvc,
      },
      shopperReference: opts.userId,
      shopperInteraction: 'Ecommerce',
      recurringProcessingModel: 'Unscheduled',
      threeDS2RequestData: {
        challengeWindowSize: '05',
      },
      additionalData: {
        metadata_userId: opts.userId,
        metadata_idempotencyKey: opts.idempotencyKey,
        ...(opts.metadata as Record<string, string> | undefined),
      },
      returnUrl: `https://example.com/payment/3ds/callback?idk=${encodeURIComponent(opts.idempotencyKey)}`,
      idempotencyKey: opts.idempotencyKey,
    };
    if (opts.requires3DS) {
      body.authenticationData = { threeDSRequestData: { challengeIndicator: '31' } };
    }
    if (opts.billingAddress) {
      body.billingAddress = {
        city: opts.billingAddress.city,
        country: opts.billingAddress.country,
        houseNumberOrName: opts.billingAddress.line1,
        postalCode: opts.billingAddress.postalCode,
        stateOrProvince: opts.billingAddress.state,
        street: opts.billingAddress.line2,
      };
      body.shopperName = { firstName: opts.billingAddress.name, lastName: '' };
    }

    const resp = await this.postJson<any>('/payments', body);
    return this.parsePayment(resp);
  }

  /**
   * 提交 3DS challenge 后的附加信息。
   *  - 前端把 challenge 收集到的 `details`（MD / PaRes / etc.）原样回传
   *  - 服务端转发到 Adyen
   */
  async getPaymentDetails(paymentId: string, details: Record<string, string>): Promise<PaymentResult> {
    if (this.mockMode) {
      // mock：返回 succeeded
      return {
        paymentId,
        provider: 'ADYEN',
        status: 'succeeded',
        amount: 0,
        currency: 'USD',
        fee: 0,
        netAmount: 0,
        createdAt: this.now(),
        cardLast4: '0000',
        cardBrand: 'unknown',
      };
    }
    const body = {
      details,
      paymentData: paymentId, // pspReference 或 paymentData token
    };
    const resp = await this.postJson<any>('/payments/details', body);
    return this.parsePayment(resp);
  }

  // -------------------------------------------------------------------------
  // 公共 API — Refund
  // -------------------------------------------------------------------------

  async createRefund(req: RefundRequest): Promise<RefundResult> {
    if (!req.paymentId) throw new AdyenApiError('BAD_REQUEST', 'paymentId is required');

    if (this.mockMode) {
      const refundId = `adyen_refund_mock_${djb2(req.idempotencyKey).toString(16)}`;
      return {
        refundId,
        paymentId: req.paymentId,
        amount: req.amount ?? 0,
        currency: 'USD',
        status: 'succeeded',
        createdAt: this.now(),
      };
    }

    const body: Record<string, unknown> = {
      merchantAccount: this.merchantAccount,
      originalReference: req.paymentId,
      reference: req.idempotencyKey,
      amount: req.amount
        ? { currency: 'USD', value: toMinorUnit(req.amount, 'USD') }
        : undefined,
      reason: req.reason,
      idempotencyKey: req.idempotencyKey,
    };
    const resp = await this.postJson<any>('/refunds', body);
    return {
      refundId: String(resp.pspReference ?? ''),
      paymentId: req.paymentId,
      amount: fromMinorUnit(Number(resp.amount?.value ?? 0), String(resp.amount?.currency ?? 'USD').toUpperCase()),
      currency: String(resp.amount?.currency ?? 'USD').toUpperCase(),
      status: (resp.status === 'received' || resp.status === 'succeeded'
        ? 'pending'
        : resp.status === 'failed'
          ? 'failed'
          : 'succeeded') as RefundResult['status'],
      errorMessage: resp.message,
      createdAt: this.now(),
    };
  }

  // -------------------------------------------------------------------------
  // Webhook 标准通知签名
  // -------------------------------------------------------------------------

  /**
   * 校验 Adyen 标准通知 webhook。
   * 算法：
   *   signedPayload = `${pspReference}|${originalReference}|${merchantAccountCode}|`
   *                   `${merchantReference}|${value}|${currency}|${eventCode}|`
   *                   `${success}|${paymentMethod}|${live}|${notificationItemsCount}`
   *   data = base64(HMAC-SHA256(hmacKey, signedPayload))
   *  - header 中 `additionalData`（含 `hmacSignature`）需要单独算并比较
   *  - 此处简化：直接校验 notificationItems 单项的 signature 字段
   */
  verifyWebhookSignature(
    rawBody: string,
  ): { valid: boolean; payload?: AdyenNotificationPayload; code?: string } {
    if (!this.hmacKey) {
      return { valid: false, code: 'KEY_MISSING' };
    }
    let parsed: any;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return { valid: false, code: 'INVALID_JSON' };
    }
    const items = parsed?.notificationItems ?? [];
    if (!Array.isArray(items) || items.length === 0) {
      return { valid: false, code: 'NO_ITEMS' };
    }
    for (const wrap of items) {
      const n = wrap?.NotificationRequestItem;
      if (!n) continue;
      const additional = n.additionalData ?? {};
      const sigsToCheck: string[] = [];
      if (additional.hmacSignature) sigsToCheck.push(String(additional.hmacSignature));
      if (n.signedData) sigsToCheck.push(String(n.signedData));
      // 至少要有一个签名
      if (sigsToCheck.length === 0) {
        return { valid: false, code: 'SIGNATURE_MISSING' };
      }
      const signedPayload = [
        n.pspReference ?? '',
        n.originalReference ?? '',
        n.merchantAccountCode ?? '',
        n.merchantReference ?? '',
        n.amount?.value ?? '',
        n.amount?.currency ?? '',
        n.eventCode ?? '',
        n.success ?? '',
        n.paymentMethod ?? '',
        parsed.live ?? '',
        String(items.length),
      ].join('\\');
      const expected = Buffer.from(
        createHmac('sha256', this.hmacKey).update(signedPayload, 'utf8').digest('base64'),
      );
      let matched = false;
      for (const sig of sigsToCheck) {
        const b = Buffer.from(sig, 'utf8');
        if (expected.length !== b.length) continue;
        try {
          if (timingSafeEqual(expected, b)) {
            matched = true;
            break;
          }
        } catch {
          // ignore
        }
      }
      if (!matched) return { valid: false, code: 'SIGNATURE_INVALID' };
    }
    const first = items[0]?.NotificationRequestItem;
    return {
      valid: true,
      payload: first as AdyenNotificationPayload,
    };
  }

  /** 工具：构造一个 webhook 签名（用于测试） */
  signWebhook(item: {
    pspReference: string;
    originalReference?: string;
    merchantAccountCode: string;
    merchantReference: string;
    value: number;
    currency: string;
    eventCode: string;
    success: string;
    paymentMethod?: string;
    live: string;
    itemCount: number;
  }): string {
    const signedPayload = [
      item.pspReference,
      item.originalReference ?? '',
      item.merchantAccountCode,
      item.merchantReference,
      String(item.value),
      item.currency,
      item.eventCode,
      item.success,
      item.paymentMethod ?? '',
      item.live,
      String(item.itemCount),
    ].join('\\');
    return createHmac('sha256', this.hmacKey).update(signedPayload, 'utf8').digest('base64');
  }

  // -------------------------------------------------------------------------
  // Mock 构造
  // -------------------------------------------------------------------------

  private buildMockPayment(opts: PaymentRequest): PaymentResult {
    const num = opts.card.number.replace(/[\s-]/g, '');
    const brand = detectBrand(num);
    const last4 = num.slice(-4) || '0000';
    const pspRef = `adyen_mock_${djb2(opts.idempotencyKey).toString(16)}`;
    // mock：默认直接 succeeded（演示场景可预测），
    // 仅在显式 requires3DS=true 时返回 3DS
    const require3ds = !!opts.requires3DS;
    const fee = this.calcFee(opts.amount, opts.currency);
    const net = Math.max(0, Math.round((opts.amount - fee) * 100) / 100);
    const base: PaymentResult = {
      paymentId: pspRef,
      provider: 'ADYEN',
      status: require3ds ? 'requires_3ds' : 'succeeded',
      amount: opts.amount,
      currency: opts.currency,
      fee,
      netAmount: net,
      authCode: 'AUTH' + djb2(pspRef).toString(16).slice(0, 6).toUpperCase(),
      createdAt: this.now(),
      cardLast4: last4,
      cardBrand: brand,
    };
    if (require3ds) {
      base.threeDsUrl = `https://test.adyen.com/hpp/3ds/redirect.shtml?pspReference=${pspRef}`;
    }
    return base;
  }
}

// =============================================================================
// 类型
// =============================================================================

export interface AdyenNotificationPayload {
  pspReference?: string;
  originalReference?: string;
  merchantAccountCode?: string;
  merchantReference?: string;
  amount?: { value: number; currency: string };
  eventCode?: string;
  success?: string;
  paymentMethod?: string;
  reason?: string;
  additionalData?: Record<string, string>;
  additionalData_signed?: string;
}

// =============================================================================
// 工具
// =============================================================================

function isMockKey(key: string | undefined): boolean {
  if (!key) return true;
  if (key.includes('mock')) return true;
  if (key.startsWith('AQEyhmfxL47PaRZH_test_mock')) return true;
  return false;
}

function mapAdyenResultCode(code: any): PaymentStatus {
  const v = String(code ?? '').toLowerCase();
  if (v === 'authorised' || v === 'authorisedandwaitfor3ds' || v === 'authorisedandsettled') return 'succeeded';
  if (v === 'redirectshopper' || v === 'authenticationnotrequired' || v === 'challenge-shopper') return 'requires_3ds';
  if (v === 'pending' || v === 'received' || v === 'awaiting') return 'pending';
  if (v === 'refused' || v === 'cancelled' || v === 'error' || v === 'canceled') return 'failed';
  return 'pending';
}

function mapAdyenBrand(raw: string): CardBrand {
  const v = raw.toLowerCase();
  if (v.includes('visa')) return 'visa';
  if (v.includes('master') || v.includes('mc')) return 'mastercard';
  if (v.includes('amex') || v.includes('american')) return 'amex';
  if (v.includes('union') || v.includes('cup')) return 'unionpay';
  if (v.includes('jcb')) return 'jcb';
  if (v.includes('discover') || v.includes('diners')) return 'discover';
  return 'unknown';
}

async function safeText(r: Response): Promise<string> {
  try {
    return await r.text();
  } catch {
    return '';
  }
}

// =============================================================================
// 工厂
// =============================================================================

export function createAdyenClient(opts?: AdyenClientOptions): AdyenClient {
  return new AdyenClient(opts);
}

export default AdyenClient;
