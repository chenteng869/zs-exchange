/**
 * Stripe 信用卡支付客户端
 *
 * 职责：
 *  - 封装 Stripe REST API：
 *      POST /v1/payment_intents        创建支付
 *      POST /v1/payment_intents/:id/confirm  确认
 *      GET  /v1/payment_intents/:id    查询
 *      POST /v1/refunds                退款
 *      GET  /v1/refunds/:id            查询退款
 *  - 自动重试 5xx / 429 / TIMEOUT（指数退避）
 *  - 演示降级：API Key 包含 'mock' 时返回稳定 mock 数据
 *  - Webhook 签名校验（HMAC-SHA256，t=...,v1=...）
 *  - 不引外部依赖（fetch + node:crypto）
 *
 * 用法：
 *   const client = new StripeClient({ secretKey: 'sk_live_xxx' });
 *   const r = await client.createPaymentIntent({ ... });
 *   // 3DS: r.status === 'requires_action' → 前端跳转 r.threeDsUrl
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { logger as defaultLogger } from '../logger';
import { safeJsonParse } from '@/lib/security/safe-json-parse';
import {
  type CardBrand,
  type CardInfo,
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

export const STRIPE_API_BASE = 'https://api.stripe.com/v1';

export const STRIPE_DEFAULT_TIMEOUT_MS = 15_000;
export const STRIPE_DEFAULT_MAX_RETRIES = 3;
export const STRIPE_DEFAULT_BACKOFF_BASE_MS = 400;
export const STRIPE_DEFAULT_MAX_BACKOFF_MS = 5_000;

/** 固定手续费（演示）：2.9% + $0.30 */
export const STRIPE_FEE_PERCENT = 0.029;
export const STRIPE_FEE_FIXED = 0.3;

/** Stripe API 协议：6.5.0（写死便于兼容） */
const STRIPE_API_VERSION = '2024-06-20';

// =============================================================================
// 错误
// =============================================================================

export class StripeApiError extends PaymentError {
  constructor(
    code: string,
    message: string,
    opts: { status?: number; body?: unknown } = {},
  ) {
    super(code, message, { provider: 'STRIPE', status: opts.status, body: opts.body });
    this.name = 'StripeApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// =============================================================================
// 客户端配置
// =============================================================================

export interface StripeClientOptions {
  secretKey?: string;
  /** webhook 签名密钥（whsec_xxx） */
  webhookSecret?: string;
  apiBase?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  backoffBaseMs?: number;
  maxBackoffMs?: number;
  mockMode?: boolean;
  logger?: typeof defaultLogger;
  now?: () => number;
  /** 额外 header */
  extraHeaders?: Record<string, string>;
}

// =============================================================================
// StripeClient
// =============================================================================

export class StripeClient {
  public readonly secretKey: string;
  public readonly webhookSecret: string;
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

  constructor(opts: StripeClientOptions = {}) {
    this.secretKey =
      opts.secretKey ??
      (typeof process !== 'undefined' ? process.env?.STRIPE_SECRET_KEY : undefined) ??
      'sk_test_mock';
    this.webhookSecret =
      opts.webhookSecret ??
      (typeof process !== 'undefined' ? process.env?.STRIPE_WEBHOOK_SECRET : undefined) ??
      'whsec_mock';
    const explicitMock = !!opts.mockMode;
    this.mockMode = explicitMock || isMockKey(this.secretKey);
    this.apiBase = (opts.apiBase ?? STRIPE_API_BASE).replace(/\/+$/, '');
    this.fetchImpl =
      opts.fetchImpl ??
      (typeof fetch !== 'undefined'
        ? fetch
        : (() => {
            throw new Error('StripeClient: no fetch implementation available');
          })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? STRIPE_DEFAULT_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries ?? STRIPE_DEFAULT_MAX_RETRIES;
    this.backoffBaseMs = opts.backoffBaseMs ?? STRIPE_DEFAULT_BACKOFF_BASE_MS;
    this.maxBackoffMs = opts.maxBackoffMs ?? STRIPE_DEFAULT_MAX_BACKOFF_MS;
    this.logger = opts.logger ?? defaultLogger;
    this.now = opts.now ?? (() => Date.now());
    this.extraHeaders = opts.extraHeaders ?? {};
  }

  // -------------------------------------------------------------------------
  // 内部：HTTP
  // -------------------------------------------------------------------------

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

  private buildFormBody(fields: Record<string, string | number | boolean | undefined>): string {
    const parts: string[] = [];
    const append = (key: string, val: unknown) => {
      if (val === undefined || val === null) return;
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
    };
    for (const [k, v] of Object.entries(fields)) {
      if (v === undefined || v === null) continue;
      append(k, v);
    }
    return parts.join('&');
  }

  private async postForm<T = any>(path: string, fields: Record<string, unknown>): Promise<T> {
    if (this.mockMode) {
      throw new StripeApiError('MOCK_MODE', 'client running in mock mode');
    }
    const url = `${this.apiBase}${path}`;
    const body = this.buildFormBody(fields as any);
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const resp = await this.fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${this.secretKey}`,
            'Stripe-Version': STRIPE_API_VERSION,
            'Idempotency-Key': String((fields as any)['idempotency_key'] ?? ''),
            ...this.extraHeaders,
          },
          body,
        });
        if (this.shouldRetryStatus(resp.status) && attempt < this.maxRetries) {
          const backoff = Math.min(this.maxBackoffMs, this.backoffBaseMs * 2 ** attempt);
          this.logger.warn(
            `[Stripe] POST ${path} -> ${resp.status}, retry in ${backoff}ms (attempt ${attempt + 1}/${this.maxRetries})`,
          );
          await this.sleep(backoff);
          continue;
        }
        const text = await safeText(resp);
        if (!resp.ok) {
          // 4xx 不重试
          const code = (() => {
            if (resp.status === 401 || resp.status === 403) return 'UNAUTHORIZED';
            if (resp.status === 400) return 'BAD_REQUEST';
            if (resp.status === 404) return 'NOT_FOUND';
            return 'HTTP_ERROR';
          })();
          throw new StripeApiError(
            code,
            `Stripe POST ${path} -> ${resp.status}: ${text.slice(0, 200)}`,
            { status: resp.status, body: text },
          );
        }
        return safeJsonParse<T>(text, {
          context: 'stripe-post-response',
          maxBytes: 10 * 1024 * 1024,
        }) as T;
      } catch (err) {
        lastErr = err;
        if (
          err instanceof StripeApiError &&
          (err.code === 'UNAUTHORIZED' || err.code === 'BAD_REQUEST' || err.code === 'NOT_FOUND')
        ) {
          throw err;
        }
        if (attempt < this.maxRetries) {
          const backoff = Math.min(this.maxBackoffMs, this.backoffBaseMs * 2 ** attempt);
          this.logger.warn(
            `[Stripe] POST ${path} failed: ${(err as Error).message}, retry in ${backoff}ms`,
          );
          await this.sleep(backoff);
          continue;
        }
      }
    }
    throw new StripeApiError(
      'NETWORK_ERROR',
      `Stripe POST ${path} failed after ${this.maxRetries + 1} attempts: ${(lastErr as Error)?.message ?? 'unknown'}`,
    );
  }

  private async getJson<T = any>(path: string, query: Record<string, string | number> = {}): Promise<T> {
    if (this.mockMode) {
      throw new StripeApiError('MOCK_MODE', 'client running in mock mode');
    }
    const url = new URL(this.apiBase + path);
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.set(k, String(v));
    }
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const resp = await this.fetchWithTimeout(url.toString(), {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${this.secretKey}`,
            ...this.extraHeaders,
          },
        });
        if (this.shouldRetryStatus(resp.status) && attempt < this.maxRetries) {
          const backoff = Math.min(this.maxBackoffMs, this.backoffBaseMs * 2 ** attempt);
          this.logger.warn(`[Stripe] GET ${path} -> ${resp.status}, retry in ${backoff}ms`);
          await this.sleep(backoff);
          continue;
        }
        const text = await safeText(resp);
        if (!resp.ok) {
          throw new StripeApiError(
            resp.status === 401 || resp.status === 403 ? 'UNAUTHORIZED' : 'HTTP_ERROR',
            `Stripe GET ${path} -> ${resp.status}: ${text.slice(0, 200)}`,
            { status: resp.status, body: text },
          );
        }
        return safeJsonParse<T>(text, {
          context: 'stripe-get-response',
          maxBytes: 10 * 1024 * 1024,
        }) as T;
      } catch (err) {
        lastErr = err;
        if (err instanceof StripeApiError && err.code === 'UNAUTHORIZED') throw err;
        if (attempt < this.maxRetries) {
          const backoff = Math.min(this.maxBackoffMs, this.backoffBaseMs * 2 ** attempt);
          await this.sleep(backoff);
          continue;
        }
      }
    }
    throw new StripeApiError(
      'NETWORK_ERROR',
      `Stripe GET ${path} failed after ${this.maxRetries + 1} attempts`,
    );
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  private buildCardFields(card: CardInfo, prefix = 'payment_method_data[card]'): Record<string, string | number> {
    const num = card.number.replace(/[\s-]/g, '');
    return {
      [`${prefix}[number]`]: num,
      [`${prefix}[exp_month]`]: card.expMonth,
      [`${prefix}[exp_year]`]: card.expYear,
      [`${prefix}[cvc]`]: card.cvc,
    };
  }

  private buildBillingFields(addr: NonNullable<PaymentRequest['billingAddress']>): Record<string, string> {
    return {
      'payment_method_data[billing_details][address][line1]': addr.line1,
      'payment_method_data[billing_details][address][line2]': addr.line2 || '',
      'payment_method_data[billing_details][address][city]': addr.city,
      'payment_method_data[billing_details][address][state]': addr.state || '',
      'payment_method_data[billing_details][address][postal_code]': addr.postalCode,
      'payment_method_data[billing_details][address][country]': addr.country,
      'payment_method_data[billing_details][name]': addr.name,
    };
  }

  private calcFee(amount: number, currency: SupportedCurrency): number {
    // 0 位小数的货币不抽 fixed fee（JPY 之类）
    const zeroDec = ['JPY', 'KRW'].includes(currency.toUpperCase());
    const fee = amount * STRIPE_FEE_PERCENT + (zeroDec ? 0 : STRIPE_FEE_FIXED);
    return Math.round(fee * 100) / 100;
  }

  private parseIntent(intent: any): PaymentResult {
    const status = mapStripeStatus(intent.status);
    const amount = fromMinorUnit(Number(intent.amount ?? 0), String(intent.currency ?? 'usd').toUpperCase());
    const last4 = String(intent.payment_method_options?.card?.last4 ?? intent.charges?.data?.[0]?.payment_method_details?.card?.last4 ?? '');
    const brandRaw = String(
      intent.payment_method_options?.card?.brand ?? intent.charges?.data?.[0]?.payment_method_details?.card?.brand ?? 'unknown',
    ).toLowerCase();
    const brand = mapStripeBrand(brandRaw);
    const fee = fromMinorUnit(
      Number(intent.charges?.data?.[0]?.application_fee_amount ?? 0) || 0,
      String(intent.currency ?? 'usd').toUpperCase(),
    );
    const netAmount = Math.max(0, Math.round((amount - fee) * 100) / 100);
    return {
      paymentId: String(intent.id ?? ''),
      provider: 'STRIPE' as PaymentProvider,
      status,
      amount,
      currency: String(intent.currency ?? 'usd').toUpperCase(),
      fee,
      netAmount,
      authCode: intent.charges?.data?.[0]?.payment_method_details?.card?.authorization_code,
      threeDsUrl: intent.next_action?.redirect_to_url?.url,
      errorCode: intent.last_payment_error?.code,
      errorMessage: intent.last_payment_error?.message,
      createdAt: Number(intent.created ?? Math.floor(this.now() / 1000)) * 1000,
      cardLast4: last4,
      cardBrand: brand,
    };
  }

  // -------------------------------------------------------------------------
  // 公共 API — PaymentIntent
  // -------------------------------------------------------------------------

  /**
   * 创建支付并直接 confirm。
   *  - confirm=true: 一步完成（同时支持 3DS）
   *  - return_url: 3DS 跳转回前端
   *  - 演示：当 status=requires_action 时返回 threeDsUrl
   */
  async createPaymentIntent(opts: PaymentRequest): Promise<PaymentResult> {
    if (!opts.userId) throw new StripeApiError('BAD_REQUEST', 'userId is required');
    if (!opts.idempotencyKey) throw new StripeApiError('BAD_REQUEST', 'idempotencyKey is required');
    if (!opts.card?.number) throw new StripeApiError('BAD_REQUEST', 'card is required');

    const amountMinor = toMinorUnit(opts.amount, opts.currency);
    if (amountMinor <= 0) {
      throw new StripeApiError('BAD_REQUEST', 'amount must be > 0');
    }

    // mock 模式
    if (this.mockMode) {
      return this.buildMockPayment(opts);
    }

    const fields: Record<string, unknown> = {
      amount: amountMinor,
      currency: opts.currency.toLowerCase(),
      confirm: 'true',
      'automatic_payment_methods[enabled]': 'true',
      'automatic_payment_methods[allow_redirects]': 'always',
      'payment_method_data[type]': 'card',
      ...this.buildCardFields(opts.card),
      'metadata[userId]': opts.userId,
      'metadata[idempotencyKey]': opts.idempotencyKey,
    };
    if (opts.card.holderName) {
      fields['payment_method_data[billing_details][name]'] = opts.card.holderName;
    }
    if (opts.billingAddress) {
      Object.assign(fields, this.buildBillingFields(opts.billingAddress));
    }
    if (opts.description) {
      fields.description = opts.description;
    }
    if (opts.statementDescriptor) {
      fields.statement_descriptor = opts.statementDescriptor.slice(0, 22);
    }
    if (opts.metadata) {
      for (const [k, v] of Object.entries(opts.metadata)) {
        if (typeof v === 'string') fields[`metadata[${k}]`] = v;
      }
    }
    if (opts.requires3DS) {
      fields['payment_method_options[card][request_three_d_secure]'] = 'any';
    }
    fields['return_url'] =
      `https://example.com/payment/3ds/callback?pid={PAYMENT_INTENT_ID}&idk=${encodeURIComponent(opts.idempotencyKey)}`;

    const intent = await this.postForm<any>('/payment_intents', {
      ...fields,
      idempotency_key: opts.idempotencyKey,
    });
    return this.parseIntent(intent);
  }

  /** 单独 confirm（前端提交 3DS 完成后调） */
  async confirmPaymentIntent(id: string, paymentMethodId?: string): Promise<PaymentResult> {
    if (this.mockMode) {
      // mock：返回一个成功结果
      return {
        paymentId: id,
        provider: 'STRIPE',
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
    const fields: Record<string, unknown> = {};
    if (paymentMethodId) fields.payment_method = paymentMethodId;
    const intent = await this.postForm<any>(`/payment_intents/${encodeURIComponent(id)}/confirm`, fields);
    return this.parseIntent(intent);
  }

  /** 查询支付 */
  async getPaymentIntent(id: string): Promise<PaymentResult> {
    if (this.mockMode) {
      return {
        paymentId: id,
        provider: 'STRIPE',
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
    const intent = await this.getJson<any>(`/payment_intents/${encodeURIComponent(id)}`);
    return this.parseIntent(intent);
  }

  // -------------------------------------------------------------------------
  // 公共 API — Refund
  // -------------------------------------------------------------------------

  async createRefund(req: RefundRequest): Promise<RefundResult> {
    if (!req.paymentId) throw new StripeApiError('BAD_REQUEST', 'paymentId is required');
    if (!req.idempotencyKey) throw new StripeApiError('BAD_REQUEST', 'idempotencyKey is required');

    if (this.mockMode) {
      const refundId = `re_mock_${djb2(req.idempotencyKey).toString(16)}`;
      return {
        refundId,
        paymentId: req.paymentId,
        amount: req.amount ?? 0,
        currency: 'USD',
        status: 'succeeded',
        createdAt: this.now(),
      };
    }

    const fields: Record<string, unknown> = {
      payment_intent: req.paymentId,
    };
    if (typeof req.amount === 'number') {
      // 演示：以美元处理（生产应从原支付取 currency）
      fields.amount = toMinorUnit(req.amount, 'USD');
    }
    if (req.reason) {
      fields.reason = req.reason;
    }
    if (req.metadata) {
      for (const [k, v] of Object.entries(req.metadata)) {
        if (typeof v === 'string') fields[`metadata[${k}]`] = v;
      }
    }
    const refund = await this.postForm<any>('/refunds', {
      ...fields,
      idempotency_key: req.idempotencyKey,
    });
    return {
      refundId: String(refund.id ?? ''),
      paymentId: String(refund.payment_intent ?? req.paymentId),
      amount: fromMinorUnit(Number(refund.amount ?? 0), String(refund.currency ?? 'usd').toUpperCase()),
      currency: String(refund.currency ?? 'usd').toUpperCase(),
      status: (refund.status === 'succeeded'
        ? 'succeeded'
        : refund.status === 'failed'
          ? 'failed'
          : 'pending') as RefundResult['status'],
      errorMessage: refund.failure_reason,
      createdAt: Number(refund.created ?? Math.floor(this.now() / 1000)) * 1000,
    };
  }

  async getRefund(id: string): Promise<RefundResult> {
    if (this.mockMode) {
      return {
        refundId: id,
        paymentId: '',
        amount: 0,
        currency: 'USD',
        status: 'succeeded',
        createdAt: this.now(),
      };
    }
    const refund = await this.getJson<any>(`/refunds/${encodeURIComponent(id)}`);
    return {
      refundId: String(refund.id ?? ''),
      paymentId: String(refund.payment_intent ?? ''),
      amount: fromMinorUnit(Number(refund.amount ?? 0), String(refund.currency ?? 'usd').toUpperCase()),
      currency: String(refund.currency ?? 'usd').toUpperCase(),
      status: (refund.status === 'succeeded'
        ? 'succeeded'
        : refund.status === 'failed'
          ? 'failed'
          : 'pending') as RefundResult['status'],
      errorMessage: refund.failure_reason,
      createdAt: Number(refund.created ?? Math.floor(this.now() / 1000)) * 1000,
    };
  }

  // -------------------------------------------------------------------------
  // Webhook 签名
  // -------------------------------------------------------------------------

  /**
   * 校验 Stripe webhook 签名。
   * header 格式：`Stripe-Signature: t={timestamp},v1={sig}[,v1={sig2}]`
   *  - 拼接 `timestamp.rawBody`
   *  - HMAC-SHA256(secret, payload)  → hex
   *  - 使用 `crypto.timingSafeEqual` 防时序攻击
   */
  verifyWebhookSignature(
    rawBody: string,
    signature: string,
    toleranceSec: number = 300,
  ): { valid: boolean; event?: any; code?: string } {
    if (!this.webhookSecret) {
      return { valid: false, code: 'KEY_MISSING' };
    }
    if (!signature) {
      return { valid: false, code: 'SIGNATURE_MISSING' };
    }
    const parts = signature.split(',').map((s) => s.trim());
    let ts: string | null = null;
    const sigs: string[] = [];
    for (const p of parts) {
      const [k, v] = p.split('=');
      if (k === 't') ts = v;
      else if (k === 'v1' && v) sigs.push(v);
    }
    if (!ts || sigs.length === 0) {
      return { valid: false, code: 'SIGNATURE_INVALID' };
    }
    const tsNum = Number(ts);
    if (!Number.isFinite(tsNum)) {
      return { valid: false, code: 'SIGNATURE_INVALID' };
    }
    const now = Math.floor(this.now() / 1000);
    if (Math.abs(now - tsNum) > toleranceSec) {
      return { valid: false, code: 'TIMESTAMP_OUT_OF_TOLERANCE' };
    }
    const payload = `${ts}.${rawBody}`;
    const expected = createHmac('sha256', this.webhookSecret).update(payload, 'utf8').digest('hex');
    const a = Buffer.from(expected, 'utf8');
    let matched = false;
    for (const sig of sigs) {
      const b = Buffer.from(sig.toLowerCase(), 'utf8');
      if (a.length !== b.length) continue;
      try {
        if (timingSafeEqual(a, b)) {
          matched = true;
          break;
        }
      } catch {
        // ignore
      }
    }
    if (!matched) return { valid: false, code: 'SIGNATURE_INVALID' };
    const event = safeJsonParse<any>(rawBody, {
      context: 'stripe-webhook-body',
      maxBytes: 10 * 1024 * 1024,
      silent: true,
    });
    if (!event) return { valid: true, code: 'INVALID_JSON' };
    return { valid: true, event };
  }

  /** 工具：构造一个 webhook 签名（用于测试） */
  signWebhook(rawBody: string, timestamp: number = Math.floor(this.now() / 1000)): string {
    const payload = `${timestamp}.${rawBody}`;
    const sig = createHmac('sha256', this.webhookSecret).update(payload, 'utf8').digest('hex');
    return `t=${timestamp},v1=${sig}`;
  }

  // -------------------------------------------------------------------------
  // Mock 构造
  // -------------------------------------------------------------------------

  private buildMockPayment(opts: PaymentRequest): PaymentResult {
    const num = opts.card.number.replace(/[\s-]/g, '');
    const brand = detectBrand(num);
    const last4 = num.slice(-4);
    const id = `pi_mock_${djb2(opts.idempotencyKey).toString(16)}`;
    // mock：默认直接 succeeded（演示场景可预测），
    // 仅在显式 requires3DS=true 时返回 3DS，便于测试
    const require3ds = !!opts.requires3DS;
    const fee = this.calcFee(opts.amount, opts.currency);
    const net = Math.max(0, Math.round((opts.amount - fee) * 100) / 100);
    const baseResult: PaymentResult = {
      paymentId: id,
      provider: 'STRIPE',
      status: require3ds ? 'requires_3ds' : 'succeeded',
      amount: opts.amount,
      currency: opts.currency,
      fee,
      netAmount: net,
      authCode: 'AUTH' + djb2(id).toString(16).slice(0, 6).toUpperCase(),
      createdAt: this.now(),
      cardLast4: last4 || '0000',
      cardBrand: brand,
    };
    if (require3ds) {
      baseResult.threeDsUrl = `https://hooks.stripe.com/3d_secure_2_eap/begin/${id}?return_url=https%3A%2F%2Fexample.com%2Fpayment%2F3ds%2Fcallback`;
    }
    return baseResult;
  }
}

// =============================================================================
// 工具
// =============================================================================

function isMockKey(key: string | undefined): boolean {
  if (!key) return true;
  if (key.includes('mock')) return true;
  if (key === 'sk_test_mock' || key === 'whsec_mock') return true;
  return false;
}

function mapStripeStatus(s: any): PaymentStatus {
  const v = String(s ?? '').toLowerCase();
  if (v === 'succeeded') return 'succeeded';
  if (v === 'processing') return 'pending';
  if (v === 'requires_action') return 'requires_action';
  if (v === 'requires_confirmation' || v === 'requires_capture') return 'requires_3ds';
  if (v === 'canceled') return 'failed';
  if (v === 'requires_payment_method') return 'failed';
  return 'pending';
}

function mapStripeBrand(raw: string): CardBrand {
  const v = raw.toLowerCase();
  if (v === 'visa') return 'visa';
  if (v === 'mastercard') return 'mastercard';
  if (v === 'amex' || v === 'american_express') return 'amex';
  if (v === 'unionpay') return 'unionpay';
  if (v === 'jcb') return 'jcb';
  if (v === 'discover') return 'discover';
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

export function createStripeClient(opts?: StripeClientOptions): StripeClient {
  return new StripeClient(opts);
}

export default StripeClient;
