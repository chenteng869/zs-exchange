/**
 * PaymentService — 业务层
 *
 * 职责：
 *  - 编排 StripeClient / AdyenClient
 *  - 校验卡号（Luhn）/ 过期 / CVV
 *  - 风控（黑名单 / 单笔限额 / 24h 限额 / 单卡限额）
 *  - 订单状态机：initiated → 3ds_required → processing → succeeded | failed | refunded
 *  - 内存 Map 存储订单（生产应替换为 Redis / DB）
 *  - 订阅 onPaymentUpdate
 *  - 处理 webhook（来自 webhook-handler）
 *
 * 用法：
 *   const stripe = new StripeClient({ secretKey: 'sk_xxx' });
 *   const adyen = new AdyenClient({ apiKey: 'AQEy...', merchantAccount: 'SMY-ECOM' });
 *   const svc = new PaymentService({ stripe, adyen });
 *   const r = await svc.createPayment({ userId, amount, currency, card, ... });
 *   // 3DS: r.status === 'requires_3ds' → 前端跳转 r.threeDsUrl → 提交 challenge 后调 handle3DSResult
 *   svc.onPaymentUpdate((order, event) => { ... });
 */

import { logger as defaultLogger } from '../logger';
import { StripeClient } from './stripe-client';
import { AdyenClient } from './adyen-client';
import {
  type PaymentOrder,
  type PaymentOrderStatus,
  type PaymentProvider,
  type PaymentRequest,
  type PaymentResult,
  type PaymentUpdateHandler,
  type RefundRequest,
  type RefundResult,
  type SupportedCurrency,
  type WebhookEvent,
  PAYMENT_LIMITS,
  PaymentError,
  PaymentValidationError,
  detectBrand,
  pickProviderByCountry,
  shouldRequire3DS,
  validateCard,
  validateCvc,
  validateExpiry,
} from './types';

// =============================================================================
// 状态机
// =============================================================================

const ALLOWED_TRANSITIONS: Record<PaymentOrderStatus, PaymentOrderStatus[]> = {
  initiated: ['3ds_required', 'processing', 'succeeded', 'failed'],
  '3ds_required': ['processing', 'succeeded', 'failed'],
  processing: ['succeeded', 'failed'],
  succeeded: ['refunded', 'partially_refunded', 'failed'],
  failed: [],
  refunded: [],
  partially_refunded: ['refunded'],
};

export function canTransition(from: PaymentOrderStatus, to: PaymentOrderStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// 风控
// =============================================================================

export interface RiskCheckResult {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
}

export interface PaymentServiceOptions {
  stripe: StripeClient;
  adyen?: AdyenClient;
  logger?: typeof defaultLogger;
  now?: () => number;
  /** 默认 provider（未指定 + 未传国家时） */
  defaultProvider?: PaymentProvider;
  /** 黑名单 userId（命中即拒绝） */
  blacklistUserIds?: string[];
  /** 黑名单卡号（last4） */
  blacklistCardLast4?: string[];
  /** 是否启用风控（默认 true） */
  riskControlEnabled?: boolean;
  /** 限流：单用户最短下单间隔 ms，默认 5_000 */
  minIntervalMs?: number;
}

// =============================================================================
// PaymentService
// =============================================================================

export class PaymentService {
  public readonly stripe: StripeClient;
  public readonly adyen?: AdyenClient;
  public readonly defaultProvider: PaymentProvider;
  public readonly blacklistUserIds: Set<string>;
  public readonly blacklistCardLast4: Set<string>;
  public readonly riskControlEnabled: boolean;
  private readonly orders: Map<string, PaymentOrder> = new Map();
  private readonly handlers: Set<PaymentUpdateHandler> = new Set();
  /** userId -> 最近一次下单时间 */
  private readonly lastOrderAt: Map<string, number> = new Map();
  private readonly logger: typeof defaultLogger;
  private readonly now: () => number;
  private readonly minIntervalMs: number;

  constructor(opts: PaymentServiceOptions) {
    if (!opts?.stripe) throw new PaymentError('BAD_REQUEST', 'stripe client is required');
    this.stripe = opts.stripe;
    this.adyen = opts.adyen;
    this.defaultProvider = opts.defaultProvider ?? 'STRIPE';
    this.blacklistUserIds = new Set(opts.blacklistUserIds ?? []);
    this.blacklistCardLast4 = new Set(opts.blacklistCardLast4 ?? []);
    this.riskControlEnabled = opts.riskControlEnabled ?? true;
    this.logger = opts.logger ?? defaultLogger;
    this.now = opts.now ?? (() => Date.now());
    this.minIntervalMs = opts.minIntervalMs ?? 5_000;
  }

  // -------------------------------------------------------------------------
  // 订阅
  // -------------------------------------------------------------------------

  onPaymentUpdate(handler: PaymentUpdateHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private async emit(
    order: PaymentOrder,
    event: WebhookEvent | { type: 'create' | 'update' | 'refund' | '3ds'; at: number },
  ): Promise<void> {
    for (const h of this.handlers) {
      try {
        await h(order, event);
      } catch (err) {
        this.logger.warn(`[PaymentService] handler failed: ${(err as Error).message}`);
      }
    }
  }

  // -------------------------------------------------------------------------
  // 风控
  // -------------------------------------------------------------------------

  private checkRisk(
    req: PaymentRequest,
    last4: string,
  ): RiskCheckResult {
    if (!this.riskControlEnabled) return { allowed: true };

    // 1. 黑名单
    if (this.blacklistUserIds.has(req.userId)) {
      return { allowed: false, reason: 'user_blacklisted' };
    }
    if (last4 && this.blacklistCardLast4.has(last4)) {
      return { allowed: false, reason: 'card_blacklisted' };
    }

    // 2. 限频
    const last = this.lastOrderAt.get(req.userId);
    const now = this.now();
    if (last && now - last < this.minIntervalMs) {
      return {
        allowed: false,
        reason: 'too_frequent',
        retryAfterMs: this.minIntervalMs - (now - last),
      };
    }

    // 3. 单笔限额
    const perTx = PAYMENT_LIMITS.perTransaction[req.currency];
    if (typeof perTx === 'number' && req.amount > perTx) {
      return { allowed: false, reason: 'exceed_per_transaction' };
    }

    // 4. 24h 单用户 / 单卡
    const limit24h = PAYMENT_LIMITS.per24hPerUser[req.currency];
    const cardLimit24h = PAYMENT_LIMITS.perCard[req.currency];
    const userTotal = this.sumUser24h(req.userId, req.currency);
    const cardTotal = last4 ? this.sumCard24h(last4, req.currency) : 0;
    if (typeof limit24h === 'number' && userTotal + req.amount > limit24h) {
      return { allowed: false, reason: 'exceed_per_24h_user' };
    }
    if (typeof cardLimit24h === 'number' && cardTotal + req.amount > cardLimit24h) {
      return { allowed: false, reason: 'exceed_per_24h_card' };
    }

    return { allowed: true };
  }

  private sumUser24h(userId: string, currency: SupportedCurrency): number {
    const cutoff = this.now() - 24 * 3600_000;
    let sum = 0;
    for (const o of this.orders.values()) {
      if (o.userId === userId && o.currency === currency && o.createdAt >= cutoff && o.status === 'succeeded') {
        sum += o.amount;
      }
    }
    return sum;
  }

  private sumCard24h(last4: string, currency: SupportedCurrency): number {
    const cutoff = this.now() - 24 * 3600_000;
    let sum = 0;
    for (const o of this.orders.values()) {
      if (o.cardLast4 === last4 && o.currency === currency && o.createdAt >= cutoff && o.status === 'succeeded') {
        sum += o.amount;
      }
    }
    return sum;
  }

  // -------------------------------------------------------------------------
  // Provider 选择
  // -------------------------------------------------------------------------

  private pickProvider(req: PaymentRequest): PaymentProvider {
    if (req.provider) return req.provider;
    if (req.billingAddress?.country) {
      return pickProviderByCountry(req.billingAddress.country);
    }
    return this.defaultProvider;
  }

  // -------------------------------------------------------------------------
  // 创建支付
  // -------------------------------------------------------------------------

  async createPayment(req: PaymentRequest): Promise<PaymentResult> {
    // 1. 基础字段
    if (!req.userId) throw new PaymentValidationError('INVALID_PARAMS', 'userId is required');
    if (!req.idempotencyKey) {
      throw new PaymentValidationError('INVALID_PARAMS', 'idempotencyKey is required');
    }
    if (typeof req.amount !== 'number' || req.amount <= 0) {
      throw new PaymentValidationError('INVALID_PARAMS', 'amount must be > 0');
    }

    // 2. 幂等：同 key 已存在 → 返回原订单
    const existed = this.orders.get(req.idempotencyKey);
    if (existed) {
      return this.toPaymentResult(existed);
    }

    // 3. Luhn / 过期 / CVC
    const card = validateCard(req.card.number);
    if (!card.valid) {
      throw new PaymentValidationError('INVALID_CARD', `card invalid: ${card.errors.join('; ')}`);
    }
    const cvc = validateCvc(req.card.cvc, card.brand);
    if (!cvc.valid) {
      throw new PaymentValidationError('INVALID_CVC', cvc.reason ?? 'cvc invalid');
    }
    const exp = validateExpiry(req.card.expMonth, req.card.expYear, this.now());
    if (!exp.valid) {
      throw new PaymentValidationError('CARD_EXPIRED', exp.reason ?? 'expiry invalid');
    }

    // 4. 风控
    const risk = this.checkRisk(req, card.last4);
    if (!risk.allowed) {
      const order: PaymentOrder = {
        id: req.idempotencyKey,
        userId: req.userId,
        provider: this.pickProvider(req),
        status: 'failed',
        amount: req.amount,
        currency: req.currency,
        fee: 0,
        netAmount: 0,
        cardLast4: card.last4,
        cardBrand: card.brand,
        errorCode: 'RISK_REJECTED',
        errorMessage: risk.reason,
        idempotencyKey: req.idempotencyKey,
        metadata: req.metadata,
        refunds: [],
        createdAt: this.now(),
        updatedAt: this.now(),
      };
      this.orders.set(req.idempotencyKey, order);
      await this.emit(order, { type: 'create', at: this.now() });
      throw new PaymentValidationError('RISK_REJECTED', `risk rejected: ${risk.reason}`);
    }

    // 5. 选 provider
    const provider = this.pickProvider(req);

    // 6. 构造订单（先写 initiated，调用后根据返回状态调整）
    const order: PaymentOrder = {
      id: req.idempotencyKey,
      userId: req.userId,
      provider,
      status: 'initiated',
      amount: req.amount,
      currency: req.currency,
      fee: 0,
      netAmount: 0,
      cardLast4: card.last4,
      cardBrand: card.brand,
      idempotencyKey: req.idempotencyKey,
      metadata: req.metadata,
      refunds: [],
      createdAt: this.now(),
      updatedAt: this.now(),
    };
    this.orders.set(req.idempotencyKey, order);
    this.lastOrderAt.set(req.userId, this.now());
    await this.emit(order, { type: 'create', at: this.now() });

    // 7. 调 provider
    try {
      const result = provider === 'ADYEN'
        ? await this.adyen!.createPayment(req)
        : await this.stripe.createPaymentIntent(req);

      // 8. 更新订单
      this.applyResult(order, result);
      return this.toPaymentResult(order);
    } catch (err) {
      order.status = 'failed';
      order.errorCode = (err as PaymentError).code ?? 'PROVIDER_ERROR';
      order.errorMessage = (err as Error).message;
      order.updatedAt = this.now();
      this.orders.set(order.id, order);
      await this.emit(order, { type: 'update', at: this.now() });
      throw err;
    }
  }

  // -------------------------------------------------------------------------
  // 3DS 结果处理
  // -------------------------------------------------------------------------

  async handle3DSResult(
    paymentId: string,
    callbackData: Record<string, string>,
  ): Promise<PaymentResult> {
    const order = this.findOrderByProviderId(paymentId);
    if (!order) {
      throw new PaymentValidationError('NOT_FOUND', `payment not found: ${paymentId}`);
    }
    if (order.status !== '3ds_required' && order.status !== 'processing') {
      // 已经处理过：直接返回
      return this.toPaymentResult(order);
    }
    if (order.provider === 'ADYEN' && this.adyen) {
      const result = await this.adyen.getPaymentDetails(paymentId, callbackData);
      this.applyResult(order, result);
      await this.emit(order, { type: '3ds', at: this.now() });
      return this.toPaymentResult(order);
    }
    if (order.provider === 'STRIPE') {
      const result = await this.stripe.confirmPaymentIntent(
        paymentId,
        callbackData.payment_method,
      );
      this.applyResult(order, result);
      await this.emit(order, { type: '3ds', at: this.now() });
      return this.toPaymentResult(order);
    }
    throw new PaymentError('NO_PROVIDER', 'no client available for provider');
  }

  // -------------------------------------------------------------------------
  // 退款
  // -------------------------------------------------------------------------

  async refund(req: RefundRequest): Promise<RefundResult> {
    if (!req.paymentId) throw new PaymentValidationError('INVALID_PARAMS', 'paymentId is required');
    const order = this.findOrderByProviderId(req.paymentId);
    if (!order) throw new PaymentValidationError('NOT_FOUND', `payment not found: ${req.paymentId}`);
    if (order.status !== 'succeeded' && order.status !== 'partially_refunded') {
      throw new PaymentValidationError(
        'INVALID_STATUS',
        `cannot refund in status ${order.status}`,
      );
    }
    const refundAmount = req.amount ?? order.amount;
    if (refundAmount <= 0 || refundAmount > order.amount) {
      throw new PaymentValidationError('INVALID_AMOUNT', 'refund amount invalid');
    }

    const result = order.provider === 'ADYEN' && this.adyen
      ? await this.adyen.createRefund({ ...req, paymentId: order.providerPaymentId ?? req.paymentId })
      : await this.stripe.createRefund({ ...req, paymentId: order.providerPaymentId ?? req.paymentId });

    if (result.status === 'failed') {
      throw new PaymentError('REFUND_FAILED', result.errorMessage ?? 'refund failed');
    }
    order.refunds.push(result);
    // 累计已退（含本次）= order.amount 时 = 全额
    const refundedSoFar = order.refunds.reduce((s, r) => s + r.amount, 0);
    if (refundedSoFar >= order.amount) {
      order.status = 'refunded';
      order.refundedAt = this.now();
    } else {
      order.status = 'partially_refunded';
    }
    order.updatedAt = this.now();
    this.orders.set(order.id, order);
    await this.emit(order, { type: 'refund', at: this.now() });
    return result;
  }

  // -------------------------------------------------------------------------
  // 查询
  // -------------------------------------------------------------------------

  getPayment(id: string): PaymentOrder | null {
    return this.orders.get(id) ?? this.findOrderByProviderId(id);
  }

  listUserPayments(userId: string, limit?: number): PaymentOrder[] {
    const arr: PaymentOrder[] = [];
    for (const o of this.orders.values()) {
      if (o.userId === userId) arr.push(o);
    }
    arr.sort((a, b) => b.createdAt - a.createdAt);
    return typeof limit === 'number' ? arr.slice(0, limit) : arr;
  }

  /** 通过 provider 的 payment id 反查 */
  findOrderByProviderId(paymentId: string): PaymentOrder | null {
    for (const o of this.orders.values()) {
      if (o.providerPaymentId === paymentId) return o;
    }
    return null;
  }

  size(): number {
    return this.orders.size;
  }

  // -------------------------------------------------------------------------
  // Webhook 处理
  // -------------------------------------------------------------------------

  /**
   * 由 webhook-handler 调用：根据 webhook 事件推进订单状态
   * 兼容：
   *  - payment_intent.succeeded    → succeeded
   *  - payment_intent.payment_failed → failed
   *  - payment_intent.processing   → processing
   *  - payment_intent.canceled     → failed
   *  - charge.refunded             → refunded
   *  - charge.dispute.created      → 标记 errorMessage
   *  - refund.failed               → 错误记录
   *  - notification                → 通用
   */
  processWebhook(event: WebhookEvent): PaymentOrder | null {
    // 1. 找订单（优先 provider id，否则 idempotencyKey）
    let order: PaymentOrder | null = null;
    if (event.paymentId) {
      order = this.findOrderByProviderId(event.paymentId);
    }
    if (!order && event.externalRef) {
      order = this.orders.get(event.externalRef) ?? null;
    }
    if (!order) {
      this.logger.warn(
        `[PaymentService] webhook for unknown order: provider=${event.provider} paymentId=${event.paymentId} ref=${event.externalRef}`,
      );
      return null;
    }

    // 2. 写 provider 引用
    if (event.paymentId && !order.providerPaymentId) {
      order.providerPaymentId = event.paymentId;
    }

    // 3. 状态推进
    switch (event.type) {
      case 'payment_intent.succeeded':
        this.transitionStatus(order.id, 'succeeded', true);
        if (typeof event.amount === 'number') {
          order.amount = event.amount;
          order.netAmount = Math.max(0, Math.round((event.amount - order.fee) * 100) / 100);
        }
        order.completedAt = this.now();
        break;
      case 'payment_intent.processing':
        this.transitionStatus(order.id, 'processing', true);
        break;
      case 'payment_intent.canceled':
        this.transitionStatus(order.id, 'failed', true);
        order.errorCode = 'CANCELED';
        order.errorMessage = event.failureReason ?? 'canceled';
        break;
      case 'payment_intent.payment_failed':
        this.transitionStatus(order.id, 'failed', true);
        order.errorCode = 'PAYMENT_FAILED';
        order.errorMessage = event.failureReason ?? 'payment failed';
        break;
      case 'payment_intent.requires_action':
        this.transitionStatus(order.id, '3ds_required', true);
        break;
      case 'charge.refunded':
        this.transitionStatus(order.id, 'refunded', true);
        order.refundedAt = this.now();
        break;
      case 'charge.dispute.created':
        order.errorCode = 'DISPUTE';
        order.errorMessage = event.failureReason ?? 'dispute opened';
        break;
      case 'refund.failed':
        // 记录在 refunds 上
        this.logger.warn(`[PaymentService] refund failed: ${event.paymentId}`);
        break;
      default:
        break;
    }
    order.updatedAt = this.now();
    this.orders.set(order.id, order);
    void this.emit(order, event);
    return order;
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private applyResult(order: PaymentOrder, result: PaymentResult): void {
    if (result.provider && result.provider !== order.provider) {
      // 极少见：fallback 到了不同 provider
      order.provider = result.provider;
    }
    if (result.paymentId) {
      order.providerPaymentId = result.paymentId;
    }
    order.fee = result.fee;
    order.netAmount = result.netAmount;
    order.threeDsUrl = result.threeDsUrl;

    switch (result.status) {
      case 'succeeded':
        this.transitionStatus(order.id, 'succeeded', true);
        order.completedAt = this.now();
        break;
      case 'requires_action':
      case 'requires_3ds':
        this.transitionStatus(order.id, '3ds_required', true);
        break;
      case 'pending':
        this.transitionStatus(order.id, 'processing', true);
        break;
      case 'failed':
        this.transitionStatus(order.id, 'failed', true);
        order.errorCode = result.errorCode ?? 'PROVIDER_ERROR';
        order.errorMessage = result.errorMessage ?? 'payment failed';
        break;
      case 'refunded':
        this.transitionStatus(order.id, 'refunded', true);
        order.refundedAt = this.now();
        break;
      case 'partially_refunded':
        this.transitionStatus(order.id, 'partially_refunded', true);
        break;
    }
    order.updatedAt = this.now();
    this.orders.set(order.id, order);
  }

  private transitionStatus(
    id: string,
    next: PaymentOrderStatus,
    silent = false,
  ): PaymentOrder | null {
    const order = this.orders.get(id);
    if (!order) return null;
    if (order.status === next) return order;
    if (!canTransition(order.status, next)) {
      this.logger.warn(
        `[PaymentService] illegal transition ${order.status} -> ${next} for order ${id}`,
      );
      return null;
    }
    const prev = order.status;
    order.status = next;
    this.logger.info(`[PaymentService] ${id} ${prev} -> ${next}`);
    if (!silent) {
      void this.emit(order, { type: 'update', at: this.now() });
    }
    return order;
  }

  private toPaymentResult(order: PaymentOrder): PaymentResult {
    return {
      paymentId: order.providerPaymentId ?? order.id,
      provider: order.provider,
      status: this.mapStatus(order.status),
      amount: order.amount,
      currency: order.currency,
      fee: order.fee,
      netAmount: order.netAmount,
      threeDsUrl: order.threeDsUrl,
      errorCode: order.errorCode,
      errorMessage: order.errorMessage,
      createdAt: order.createdAt,
      cardLast4: order.cardLast4,
      cardBrand: order.cardBrand,
    };
  }

  private mapStatus(s: PaymentOrderStatus): PaymentResult['status'] {
    switch (s) {
      case 'succeeded':
        return 'succeeded';
      case '3ds_required':
        return 'requires_3ds';
      case 'processing':
        return 'pending';
      case 'failed':
        return 'failed';
      case 'refunded':
        return 'refunded';
      case 'partially_refunded':
        return 'partially_refunded';
      default:
        return 'pending';
    }
  }
}

// =============================================================================
// 工厂
// =============================================================================

export function createPaymentService(opts: PaymentServiceOptions): PaymentService {
  return new PaymentService(opts);
}

export default PaymentService;

// 重新导出 validateCard 工具方便调用方单独用
export { validateCard, detectBrand };
