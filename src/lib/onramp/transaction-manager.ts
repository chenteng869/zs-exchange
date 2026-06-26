/**
 * MoonPay 买币订单管理器（业务层）
 *
 * 职责：
 *  - 编排 MoonPayClient + 状态机
 *  - 内存 Map 存储订单（生产应替换为 Redis / DB）
 *  - 状态机：initiated → widget_opened → waiting_payment → processing → completed | failed | expired
 *  - 防止同一用户短时间重复下单（限流）
 *  - 订单与 userId 关联
 *  - 暴露订阅接口（onOrderUpdate）便于业务层入账
 *
 * 用法：
 *   const mgr = new MoonPayTransactionManager({ client, logger });
 *   const order = await mgr.createBuyOrder({ userId, crypto: 'USDT', fiat: 'USD', fiatAmount: 100, walletAddress });
 *   // 用户付款后 MoonPay 通过 webhook 回调 /api/webhooks/moonpay
 *   // handler 调 mgr.updateOrderFromWebhook 推进状态
 *   // 入账完成后 mgr.onOrderUpdate 触发回调
 */

import { logger as defaultLogger } from '../logger';
import {
  MoonPayClient,
  MOONPAY_ORDER_EXPIRE_MS,
  type MoonPayTransaction,
} from './moonpay-client';

// =============================================================================
// 公共类型
// =============================================================================

export type SupportedCrypto = 'USDT' | 'USDC' | 'BTC' | 'ETH';
export type SupportedFiat = 'USD' | 'EUR' | 'GBP' | 'CNY' | 'JPY' | 'KRW';

export type OrderStatus =
  | 'initiated'
  | 'widget_opened'
  | 'waiting_payment'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired';

export interface BuyOrderOptions {
  userId: string;
  crypto: SupportedCrypto;
  fiat: SupportedFiat;
  /** 法币金额（与 cryptoAmount 互斥） */
  fiatAmount?: number;
  /** 加密币金额 */
  cryptoAmount?: number;
  /** 用户平台入金地址 */
  walletAddress: string;
  /** 用户付款后跳转 URL */
  redirectUrl?: string;
  /** 备注（订单号、用户备注等） */
  note?: string;
}

export interface BuyOrder {
  /** 平台订单号（幂等） */
  id: string;
  userId: string;
  status: OrderStatus;
  crypto: string;
  fiat: string;
  fiatAmount: number;
  cryptoAmount: number;
  /** 当时成交 / 报价汇率 */
  rate: number;
  /** MoonPay / 平台手续费 */
  fee: number;
  /** MoonPay 内部交易 id */
  moonpayTxId?: string;
  /** MoonPay widget URL */
  moonpayRedirectUrl?: string;
  walletAddress: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  errorMessage?: string;
  /** 用户付款后跳转的 URL */
  redirectUrl?: string;
  /** 备注 */
  note?: string;
}

export type OrderUpdateHandler = (order: BuyOrder) => void | Promise<void>;

export interface MoonPayTransactionManagerOptions {
  client: MoonPayClient;
  logger?: typeof defaultLogger;
  now?: () => number;
  /** 同一用户最大并发活跃订单数，默认 3 */
  maxActivePerUser?: number;
  /** 单用户最短下单间隔（毫秒），默认 30s */
  minIntervalMs?: number;
  /** 订单过期时间（毫秒），默认 30 分钟 */
  expireMs?: number;
}

// =============================================================================
// 状态机
// =============================================================================

/** 合法状态转移表 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  initiated: ['widget_opened', 'waiting_payment', 'failed', 'expired'],
  widget_opened: ['waiting_payment', 'failed', 'expired'],
  waiting_payment: ['processing', 'failed', 'expired'],
  processing: ['completed', 'failed', 'expired'],
  completed: [],
  failed: [],
  expired: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// MoonPayTransactionManager
// =============================================================================

export class MoonPayTransactionManager {
  public readonly client: MoonPayClient;
  private readonly orders: Map<string, BuyOrder> = new Map();
  private readonly handlers: Set<OrderUpdateHandler> = new Set();
  /** userId -> 最近一次下单时间 */
  private readonly lastOrderAt: Map<string, number> = new Map();
  /** userId -> 当前活跃订单数 */
  private readonly activeCount: Map<string, number> = new Map();
  private readonly logger: typeof defaultLogger;
  private readonly now: () => number;
  private readonly maxActivePerUser: number;
  private readonly minIntervalMs: number;
  private readonly expireMs: number;

  constructor(opts: MoonPayTransactionManagerOptions) {
    if (!opts?.client) throw new Error('MoonPayTransactionManager: client is required');
    this.client = opts.client;
    this.logger = opts.logger ?? defaultLogger;
    this.now = opts.now ?? (() => Date.now());
    this.maxActivePerUser = opts.maxActivePerUser ?? 3;
    this.minIntervalMs = opts.minIntervalMs ?? 30_000;
    this.expireMs = opts.expireMs ?? MOONPAY_ORDER_EXPIRE_MS;
  }

  // -------------------------------------------------------------------------
  // 订阅
  // -------------------------------------------------------------------------

  /** 订阅订单更新事件（可多次订阅），返回取消订阅的函数 */
  onOrderUpdate(handler: OrderUpdateHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  private async emit(order: BuyOrder): Promise<void> {
    for (const h of this.handlers) {
      try {
        await h(order);
      } catch (err) {
        this.logger.warn(
          `[MoonPayTransactionManager] onOrderUpdate handler failed: ${(err as Error).message}`,
        );
      }
    }
  }

  // -------------------------------------------------------------------------
  // 限流
  // -------------------------------------------------------------------------

  private checkRateLimit(userId: string): { allowed: boolean; reason?: string; retryAfterMs?: number } {
    const now = this.now();
    const last = this.lastOrderAt.get(userId);
    if (last && now - last < this.minIntervalMs) {
      return {
        allowed: false,
        reason: 'too_frequent',
        retryAfterMs: this.minIntervalMs - (now - last),
      };
    }
    const active = this.activeCount.get(userId) ?? 0;
    if (active >= this.maxActivePerUser) {
      return { allowed: false, reason: 'too_many_active', retryAfterMs: 60_000 };
    }
    return { allowed: true };
  }

  private recordOrderCreated(userId: string): void {
    this.lastOrderAt.set(userId, this.now());
    this.activeCount.set(userId, (this.activeCount.get(userId) ?? 0) + 1);
  }

  private recordOrderClosed(userId: string): void {
    const cur = this.activeCount.get(userId) ?? 0;
    this.activeCount.set(userId, Math.max(0, cur - 1));
  }

  // -------------------------------------------------------------------------
  // 查询
  // -------------------------------------------------------------------------

  getOrder(id: string): BuyOrder | null {
    return this.orders.get(id) ?? null;
  }

  /** 通过 MoonPay 交易 id 反查 */
  getOrderByMoonpayId(moonpayTxId: string): BuyOrder | null {
    for (const o of this.orders.values()) {
      if (o.moonpayTxId === moonpayTxId) return o;
    }
    return null;
  }

  /** 列出指定用户的订单，按时间倒序 */
  listUserOrders(userId: string, limit?: number): BuyOrder[] {
    const all: BuyOrder[] = [];
    for (const o of this.orders.values()) {
      if (o.userId === userId) all.push(o);
    }
    all.sort((a, b) => b.createdAt - a.createdAt);
    return typeof limit === 'number' ? all.slice(0, limit) : all;
  }

  /** 列出所有未完成订单（用于对账） */
  listPendingOrders(): BuyOrder[] {
    const out: BuyOrder[] = [];
    for (const o of this.orders.values()) {
      if (o.status !== 'completed' && o.status !== 'failed' && o.status !== 'expired') {
        out.push(o);
      }
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  }

  /** 全部订单数量（测试用） */
  size(): number {
    return this.orders.size;
  }

  // -------------------------------------------------------------------------
  // 创建订单
  // -------------------------------------------------------------------------

  /**
   * 创建买币订单
   *  - 检查限流
   *  - 生成平台订单号（order-{timestamp}-{random}）
   *  - 调用 MoonPayClient.createTransaction 获取 widget URL
   *  - 记录到内存，状态 = initiated
   *  - 通知订阅者
   */
  async createBuyOrder(opts: BuyOrderOptions): Promise<BuyOrder> {
    if (!opts.userId) throw new MoonPayManagerError('INVALID_PARAMS', 'userId is required');
    if (!opts.walletAddress) throw new MoonPayManagerError('INVALID_PARAMS', 'walletAddress is required');
    if (!opts.crypto) throw new MoonPayManagerError('INVALID_PARAMS', 'crypto is required');
    if (!opts.fiat) throw new MoonPayManagerError('INVALID_PARAMS', 'fiat is required');
    if (typeof opts.fiatAmount !== 'number' && typeof opts.cryptoAmount !== 'number') {
      throw new MoonPayManagerError('INVALID_PARAMS', 'fiatAmount or cryptoAmount is required');
    }

    // 1. 限流
    const rl = this.checkRateLimit(opts.userId);
    if (!rl.allowed) {
      throw new MoonPayManagerError(
        rl.reason === 'too_frequent' ? 'RATE_LIMITED' : 'TOO_MANY_ACTIVE',
        `rate limited: ${rl.reason}`,
        { retryAfterMs: rl.retryAfterMs },
      );
    }

    // 2. 生成平台订单号
    const id = this.generateOrderId();
    const externalId = id;

    // 3. 报价（mock 模式 + 真实模式都由 client 内部决定）
    let rate = 1;
    let fee = 0;
    let cryptoAmount = 0;
    let fiatAmount = 0;
    try {
      const price = await this.client.getPrice({
        cryptoCurrency: opts.crypto,
        baseCurrency: opts.fiat,
        amount: opts.fiatAmount,
        cryptoAmount: opts.cryptoAmount,
      });
      rate = price.rate || 1;
      fee = (price.fee || 0) + (price.networkFee || 0);
      cryptoAmount = price.cryptoAmount;
      fiatAmount = price.baseAmount;
    } catch (err) {
      // 报价失败不影响下单（widget 里仍会展示），使用传入值
      this.logger.warn(
        `[MoonPayTransactionManager] getPrice failed: ${(err as Error).message}, using input values`,
      );
      rate = guessRate(opts.crypto);
      fiatAmount = opts.fiatAmount ?? (opts.cryptoAmount ?? 0) * rate;
      cryptoAmount = opts.cryptoAmount ?? (opts.fiatAmount ?? 0) / rate;
      fee = 4.99;
    }

    // 4. 创建 MoonPay 订单
    const tx = await this.client.createTransaction({
      cryptoCurrency: opts.crypto,
      baseCurrency: opts.fiat,
      walletAddress: opts.walletAddress,
      baseAmount: opts.fiatAmount,
      cryptoAmount: opts.cryptoAmount,
      externalTransactionId: externalId,
      redirectURL: opts.redirectUrl,
      network: guessNetwork(opts.crypto),
    });

    // 5. 写入订单
    const order: BuyOrder = {
      id,
      userId: opts.userId,
      status: 'initiated',
      crypto: opts.crypto,
      fiat: opts.fiat,
      fiatAmount,
      cryptoAmount,
      rate,
      fee,
      moonpayTxId: tx.id,
      moonpayRedirectUrl: tx.redirectUrl,
      walletAddress: opts.walletAddress,
      createdAt: this.now(),
      updatedAt: this.now(),
      redirectUrl: opts.redirectUrl,
      note: opts.note,
    };
    this.orders.set(id, order);
    this.recordOrderCreated(opts.userId);

    this.logger.info(
      `[MoonPayTransactionManager] created buy order ${id} user=${opts.userId} ${opts.crypto}/${opts.fiat}`,
    );
    await this.emit(order);
    return order;
  }

  /** 标记 widget 已被用户打开（用于状态机推进） */
  markWidgetOpened(id: string): BuyOrder | null {
    return this.transitionStatus(id, 'widget_opened');
  }

  // -------------------------------------------------------------------------
  // Webhook 更新
  // -------------------------------------------------------------------------

  /**
   * 由 webhook handler 调用：根据 MoonPay 回调事件推进状态
   * 兼容以下事件类型：
   *  - transactionCreated
   *  - transactionUpdated
   *  - transactionFailed
   *  - transactionCompleted
   */
  updateOrderFromWebhook(
    externalTransactionId: string,
    webhook: MoonPayWebhookPayload,
  ): BuyOrder | null {
    // 1. 找到订单
    let order: BuyOrder | null = this.orders.get(externalTransactionId) ?? null;
    if (!order && webhook.id) {
      order = this.getOrderByMoonpayId(webhook.id);
    }
    if (!order) {
      this.logger.warn(
        `[MoonPayTransactionManager] webhook for unknown order: ${externalTransactionId}`,
      );
      return null;
    }

    // 2. 更新金额 / 状态
    if (webhook.id) {
      // MoonPay 的真实 transaction id 优先于 mock id
      order.moonpayTxId = webhook.id;
    }
    if (typeof webhook.baseAmount === 'number') order.fiatAmount = webhook.baseAmount;
    if (typeof webhook.cryptoAmount === 'number') order.cryptoAmount = webhook.cryptoAmount;
    if (typeof webhook.fee === 'number') order.fee = webhook.fee;
    if (typeof webhook.rate === 'number' && webhook.rate > 0) order.rate = webhook.rate;

    // 3. 状态推进
    let next: OrderStatus | null = null;
    switch (webhook.type) {
      case 'transactionCreated':
        next = 'waiting_payment';
        break;
      case 'transactionUpdated':
        if (webhook.status === 'waitingPayment') next = 'waiting_payment';
        else if (webhook.status === 'pending') next = 'processing';
        else if (webhook.status === 'waitingAuthorization') next = 'processing';
        else if (webhook.status === 'completed') next = 'completed';
        else if (webhook.status === 'failed') next = 'failed';
        break;
      case 'transactionCompleted':
        next = 'completed';
        break;
      case 'transactionFailed':
        next = 'failed';
        break;
      default:
        // 未知事件：保守处理
        this.logger.warn(`[MoonPayTransactionManager] unknown webhook type: ${webhook.type}`);
        break;
    }

    if (webhook.failureReason) order.errorMessage = webhook.failureReason;

    if (next) {
      // 这里 silent=true 仅避免在 transitionStatus 内部重复 emit，
      // 下面手动 emit 一次以保证订阅者收到状态变更通知。
      const updated = this.transitionStatus(order.id, next, /* silent */ true);
      if (updated) {
        if (next === 'completed') updated.completedAt = this.now();
        void this.emit(updated);
        return updated;
      }
    }
    order.updatedAt = this.now();
    this.orders.set(order.id, order);
    void this.emit(order);
    return order;
  }

  /**
   * 直接设置状态（内部使用，校验合法性）
   * @param silent true 时不触发订阅者
   */
  private transitionStatus(id: string, next: OrderStatus, silent = false): BuyOrder | null {
    const order = this.orders.get(id);
    if (!order) return null;
    if (order.status === next) return order;
    if (!canTransition(order.status, next)) {
      this.logger.warn(
        `[MoonPayTransactionManager] illegal transition ${order.status} -> ${next} for order ${id}`,
      );
      return null;
    }
    const prev = order.status;
    order.status = next;
    order.updatedAt = this.now();
    if (next === 'completed' || next === 'failed' || next === 'expired') {
      this.recordOrderClosed(order.userId);
      if (next === 'completed') order.completedAt = this.now();
    }
    this.orders.set(id, order);
    this.logger.info(`[MoonPayTransactionManager] ${id} ${prev} -> ${next}`);
    if (!silent) {
      void this.emit(order);
    }
    return order;
  }

  // -------------------------------------------------------------------------
  // 过期检查
  // -------------------------------------------------------------------------

  /**
   * 扫描并过期超时的订单
   *  - 通常由 cron 每分钟调用一次
   *  - 状态 = initiated / widget_opened / waiting_payment 且超过 expireMs
   */
  expireStaleOrders(now: number = this.now()): BuyOrder[] {
    const out: BuyOrder[] = [];
    for (const order of this.orders.values()) {
      if (
        (order.status === 'initiated' ||
          order.status === 'widget_opened' ||
          order.status === 'waiting_payment' ||
          order.status === 'processing') &&
        now - order.createdAt > this.expireMs
      ) {
        const u = this.transitionStatus(order.id, 'expired', true);
        if (u) {
          u.errorMessage = u.errorMessage ?? 'order expired';
          out.push(u);
          void this.emit(u);
        }
      }
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private generateOrderId(): string {
    const ts = this.now().toString(36);
    const rand = Math.floor(Math.random() * 0xfffff).toString(36).padStart(4, '0');
    return `ord-${ts}-${rand}`;
  }
}

// =============================================================================
// Webhook payload（共用类型，由 webhook-handler 引入）
// =============================================================================

export interface MoonPayWebhookPayload {
  /** 事件类型：transactionCreated / transactionUpdated / transactionFailed / transactionCompleted */
  type: string;
  /** MoonPay 内部交易 id */
  id?: string;
  /** 平台订单号（创建时传入的 externalTransactionId） */
  externalTransactionId?: string;
  /** 内部状态 */
  status?: string;
  baseCurrency?: string;
  baseAmount?: number;
  cryptoCurrency?: string;
  cryptoAmount?: number;
  rate?: number;
  fee?: number;
  networkFee?: number;
  failureReason?: string;
  walletAddress?: string;
}

// =============================================================================
// 错误
// =============================================================================

export class MoonPayManagerError extends Error {
  public readonly code: string;
  public readonly meta?: Record<string, unknown>;
  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(message);
    this.name = 'MoonPayManagerError';
    this.code = code;
    this.meta = meta;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// =============================================================================
// 工具
// =============================================================================

function guessRate(crypto: string): number {
  const c = crypto.toLowerCase();
  if (c.startsWith('btc')) return 65000;
  if (c.startsWith('eth')) return 3500;
  if (c.startsWith('usdt') || c.startsWith('usdc')) return 1;
  return 1;
}

function guessNetwork(crypto: string): string {
  const c = crypto.toLowerCase();
  if (c.includes('polygon')) return 'polygon';
  if (c.includes('solana')) return 'solana';
  if (c.includes('bsc')) return 'bsc';
  return 'ethereum';
}

// =============================================================================
// 工厂
// =============================================================================

export function createMoonPayTransactionManager(
  opts: MoonPayTransactionManagerOptions,
): MoonPayTransactionManager {
  return new MoonPayTransactionManager(opts);
}

export default MoonPayTransactionManager;
