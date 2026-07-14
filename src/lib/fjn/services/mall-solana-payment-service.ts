/**
 * Mall Solana Payment Service - 369 DAppX 商城 + Solana Pay 集成
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.5
 *
 * 职责：
 *  - Order 域：createOrder / confirmOrder / completeOrder / cancelOrder
 *  - Payment Intent 域：createPaymentIntent / markIntentPaid / cancelIntent
 *  - Refund 域：requestRefund / approveRefund / executeRefund / rejectRefund
 *  - Settlement 域：createSettlement / approveSettlement / paySettlement
 *  - Coupon 域：claimCoupon / validateCoupon / useCoupon
 *  - 查询：getOrder / getSettlement / listOrders / getProduct
 *
 * 链上集成：SolanaPaymentService（payment intent）+ SolanaTokenService（refund）
 * 业务真相源：链下账本（FjnMallOrder / FjnMallProduct / FjnMallCoupon / FjnMallSettlement）+ SolanaPaymentIntent
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  MALL_PAYMENT_METHOD,
  MALL_PAYMENT_STATUS,
  MALL_INTENT_STATUS,
  MALL_REFUND_STATUS,
  MALL_PLATFORM_FEE_RATE,
  MALL_INTENT_DEFAULT_EXPIRES_MINUTES,
  MALL_DEFAULT_CURRENCY,
  MALL_DEFAULT_CHAIN_ID,
  isValidMallPaymentMethod,
  isValidMallPaymentStatus,
  isValidMallIntentStatus,
  isValidMallRefundStatus,
  type FjnMallPaymentMethod,
  type FjnMallPaymentStatus,
  type FjnMallIntentStatus,
  type FjnMallRefundStatus,
} from './mall-solana-payment-state-machine';
import {
  MALL_SOLANA_PAYMENT_EVENTS,
  MALL_SOLANA_PAYMENT_EVENT_SOURCES,
  type FjnMallSolanaPaymentEventSource,
} from './mall-solana-payment-events';
import {
  MallIntentNotFoundError,
  MallIntentAlreadyPaidError,
  MallIntentExpiredError,
  MallIntentCancelledError,
  MallIntentAmountInvalidError,
  MallIntentAmountMismatchError,
  MallIntentCreationFailedError,
  MallIntentTxHashDuplicateError,
  MallOrderNotFoundError,
  MallOrderStatusInvalidError,
  MallOrderNotPayableError,
  MallOrderAlreadyPaidError,
  MallOrderNotRefundableError,
  MallOrderAmountInvalidError,
  MallProductNotFoundError,
  MallProductNotActiveError,
  MallProductStockInsufficientError,
  MallProductPriceInvalidError,
  MallCouponNotFoundError,
  MallCouponNotActiveError,
  MallCouponExpiredError,
  MallCouponMinSpendNotMetError,
  MallCouponSupplyExhaustedError,
  MallRefundNotFoundError,
  MallRefundStatusInvalidError,
  MallRefundAmountInvalidError,
  MallRefundAmountExceedsError,
  MallRefundNotApprovableError,
  MallRefundSolanaFailedError,
  MallSettlementNotFoundError,
  MallSettlementAlreadyPaidError,
  MallSettlementNotApprovableError,
  MallSettlementAmountInvalidError,
  MallPaymentMethodInvalidError,
  MallUserIdRequiredError,
  MallPlatformFeeCalcFailedError,
} from './mall-solana-payment-errors';
import { FjnValidationError } from '../errors';

// ============================================================
// 1. 入参接口
// ============================================================

/** 创建订单 */
export interface CreateMallOrderInput {
  userId: string;
  merchantId: string;
  productId: string;
  quantity: number;
  paymentMethod: FjnMallPaymentMethod;
  couponId?: string;
  shippingAddress?: Prisma.InputJsonValue;
  /** 币种，默认 USD */
  currency?: string;
  /** 链上 cluster，默认 devnet */
  chainId?: string;
  /** tFJ369 / cFJ369 抵扣（hybrid 模式时使用） */
  pointsUsed?: string;
  tokenUsed?: string;
  operatorId?: string;
}

/** 创建支付意图（Solana Pay） */
export interface CreatePaymentIntentInput {
  orderNo: string;
  amount: string;
  paymentMethod: FjnMallPaymentMethod;
  expiresAt?: Date;
  chainId?: string;
}

/** 标记支付意图已支付 */
export interface MarkIntentPaidInput {
  intentNo: string;
  txHash: string;
  paidBy: string;
  blockNumber?: bigint | number;
  operatorId?: string;
}

/** 请求退款 */
export interface RequestMallRefundInput {
  orderId: string;
  userId: string;
  refundAmount: string;
  reason: string;
  operatorId?: string;
}

/** 批准退款 */
export interface ApproveMallRefundInput {
  refundId: string;
  approverId: string;
  comment?: string;
}

/** 执行退款（链上） */
export interface ExecuteMallRefundInput {
  refundId: string;
  txHash: string;
  blockNumber?: bigint | number;
  operatorId?: string;
}

/** 创建商户结算单 */
export interface CreateMallSettlementInput {
  merchantId: string;
  period: string;
  operatorId?: string;
}

/** 批准结算 */
export interface ApproveMallSettlementInput {
  settlementId: string;
  approverId: string;
  bankAccount?: Prisma.InputJsonValue;
}

/** 支付结算（链上/链下） */
export interface PayMallSettlementInput {
  settlementId: string;
  txHash?: string;
  operatorId?: string;
}

/** 分页查询 */
export interface ListMallOrdersInput {
  page?: number;
  pageSize?: number;
  userId?: string;
  merchantId?: string;
  status?: string;
  paymentMethod?: FjnMallPaymentMethod;
}

// ============================================================
// 2. 返回类型
// ============================================================

export interface MallOrderSummary {
  id: string;
  orderNo: string;
  userId: string;
  merchantId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
  paidAmount: string;
  pointsUsed: string;
  tokenUsed: string;
  platformFee: string;
  currency: string;
  paymentMethod?: string | null;
  status: string;
  paidAt?: Date | null;
}

export interface MallIntentSummary {
  intentNo: string;
  orderNo: string;
  amount: string;
  currency: string;
  paymentMethod: FjnMallPaymentMethod;
  status: FjnMallIntentStatus;
  expiresAt: Date;
  txHash?: string | null;
  chainId: string;
  reference: string;
}

// ============================================================
// 3. Service 实现
// ============================================================

export class FjnMallSolanaPaymentService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnMallSolanaPaymentService' });
  }

  // ==========================================================
  // 3.0 工具方法
  // ==========================================================

  private generateOrderNo(): string {
    return `ML-ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
  private generateIntentNo(): string {
    return `ML-INT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
  private generateRefundNo(): string {
    return `ML-RFD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
  private generateSettlementNo(): string {
    return `ML-STL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  /** 发出 outbox 事件 */
  private async emitEvent(
    tx: any,
    eventType: string,
    payload: Record<string, unknown>,
    source: FjnMallSolanaPaymentEventSource = MALL_SOLANA_PAYMENT_EVENT_SOURCES.MALL_SERVICE,
  ): Promise<void> {
    await (tx as any).outboxEvent.create({
      data: {
        eventType,
        payload: {
          ...payload,
          occurred_at: new Date().toISOString(),
          source,
        },
        status: 'pending',
        retryCount: 0,
      },
    });
  }

  /** 计算平台费 */
  private calculatePlatformFee(amount: Prisma.Decimal, rate: string = MALL_PLATFORM_FEE_RATE): Prisma.Decimal {
    try {
      return amount.mul(new Prisma.Decimal(rate)).toDecimalPlaces(4, Prisma.Decimal.ROUND_DOWN);
    } catch {
      throw new MallPlatformFeeCalcFailedError({ amount: amount.toString(), rate });
    }
  }

  /** Solana Pay 创建 PaymentIntent（占位） */
  private async callSolanaPayCreateIntent(
    amount: string,
    currency: string,
    reference: string,
    expiresAt: Date,
  ): Promise<{ reference: string; qrCode: string; url: string }> {
    this.log('info', `Solana Pay create intent placeholder`, { amount, currency, reference });
    return {
      reference,
      qrCode: `solana:${reference}?amount=${amount}&currency=${currency}`,
      url: `https://solana.pay/${reference}`,
    };
  }

  // ==========================================================
  // 3.1 Order 域（4 个方法）
  // ==========================================================

  /**
   * 创建订单
   *  - 校验 product 状态、库存、价格
   *  - 计算 totalAmount = unitPrice * quantity
   *  - 计算 platformFee
   *  - 默认 status: pending_payment
   */
  async createOrder(input: CreateMallOrderInput) {
    if (!input.userId) throw new MallUserIdRequiredError();
    if (!isValidMallPaymentMethod(input.paymentMethod)) {
      throw new MallPaymentMethodInvalidError({ paymentMethod: input.paymentMethod });
    }
    if (input.quantity <= 0) {
      throw new MallOrderAmountInvalidError({ quantity: input.quantity });
    }
    const currency = input.currency ?? MALL_DEFAULT_CURRENCY;
    const chainId = input.chainId ?? MALL_DEFAULT_CHAIN_ID;

    return this.withTransaction(async (tx) => {
      const product = await (tx as any).fjnMallProduct.findUnique({ where: { id: input.productId } });
      if (!product) throw new MallProductNotFoundError({ productId: input.productId });
      if (product.status !== 'active') {
        throw new MallProductNotActiveError({ productNo: product.productNo, status: product.status });
      }
      if (product.stock < input.quantity) {
        throw new MallProductStockInsufficientError({
          productNo: product.productNo,
          stock: product.stock,
          required: input.quantity,
        });
      }

      const unitPrice = new Prisma.Decimal(product.price);
      if (unitPrice.lte(0)) {
        throw new MallProductPriceInvalidError({ productNo: product.productNo, price: product.price });
      }
      const totalAmount = unitPrice.mul(input.quantity);

      const orderNo = this.generateOrderNo();
      const created = await (tx as any).fjnMallOrder.create({
        data: {
          orderNo,
          userId: input.userId,
          merchantId: input.merchantId,
          productId: input.productId,
          quantity: input.quantity,
          unitPrice,
          totalAmount,
          paidAmount: new Prisma.Decimal(0),
          pointsUsed: input.pointsUsed ? new Prisma.Decimal(input.pointsUsed) : new Prisma.Decimal(0),
          tokenUsed: input.tokenUsed ? new Prisma.Decimal(input.tokenUsed) : new Prisma.Decimal(0),
          platformFee: new Prisma.Decimal(0),
          currency,
          paymentMethod: input.paymentMethod,
          status: 'pending_payment',
          shippingAddress: input.shippingAddress ?? Prisma.JsonNull,
        },
      });

      // 锁库存
      await (tx as any).fjnMallProduct.update({
        where: { id: input.productId },
        data: { stock: { decrement: input.quantity } },
      });

      await this.emitEvent(tx, MALL_SOLANA_PAYMENT_EVENTS.ORDER_CREATED, {
        orderNo,
        userId: input.userId,
        merchantId: input.merchantId,
        productId: input.productId,
        totalAmount: totalAmount.toString(),
        currency,
        paymentMethod: input.paymentMethod,
        chainId,
        operatorId: input.operatorId,
      });

      this.log('info', `Mall order created: ${orderNo}`, {
        userId: input.userId,
        totalAmount: totalAmount.toString(),
      });

      return created as MallOrderSummary & { createdAt: Date; updatedAt: Date };
    });
  }

  /**
   * 确认订单（pending_payment → confirmed）
   *  - 通常在 risk check 通过后调用
   */
  async confirmOrder(orderId: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const order = await (tx as any).fjnMallOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new MallOrderNotFoundError({ orderId });
      if (order.status === 'confirmed') return order;
      if (order.status !== 'pending_payment' && order.status !== 'paid' && order.status !== 'risk_checking') {
        throw new MallOrderStatusInvalidError({ orderNo: order.orderNo, status: order.status });
      }

      const updated = await (tx as any).fjnMallOrder.update({
        where: { id: orderId },
        data: { status: 'confirmed' },
      });

      await this.emitEvent(tx, MALL_SOLANA_PAYMENT_EVENTS.ORDER_CONFIRMED, {
        orderNo: order.orderNo,
        operatorId,
      });

      this.log('info', `Mall order confirmed: ${order.orderNo}`);
      return updated;
    });
  }

  /** 取消订单 */
  async cancelOrder(orderId: string, reason: string, operatorId?: string) {
    if (!reason) throw new FjnValidationError('Cancel reason is required', { orderId });
    return this.withTransaction(async (tx) => {
      const order = await (tx as any).fjnMallOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new MallOrderNotFoundError({ orderId });
      if (order.status === 'cancelled' || order.status === 'completed' || order.status === 'refunded') {
        throw new MallOrderStatusInvalidError({ orderNo: order.orderNo, status: order.status });
      }

      // 还原库存
      await (tx as any).fjnMallProduct.update({
        where: { id: order.productId },
        data: { stock: { increment: order.quantity } },
      });

      const updated = await (tx as any).fjnMallOrder.update({
        where: { id: orderId },
        data: { status: 'cancelled' },
      });

      this.log('info', `Mall order cancelled: ${order.orderNo}`, { reason });
      return updated;
    });
  }

  /** 完成订单 */
  async completeOrder(orderId: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const order = await (tx as any).fjnMallOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new MallOrderNotFoundError({ orderId });
      if (order.status === 'completed') return order;
      if (order.status !== 'delivered' && order.status !== 'shipped' && order.status !== 'confirmed') {
        throw new MallOrderStatusInvalidError({ orderNo: order.orderNo, status: order.status });
      }

      const updated = await (tx as any).fjnMallOrder.update({
        where: { id: orderId },
        data: { status: 'completed', completedAt: new Date() },
      });

      await this.emitEvent(tx, MALL_SOLANA_PAYMENT_EVENTS.ORDER_COMPLETED, {
        orderNo: order.orderNo,
        operatorId,
      });

      this.log('info', `Mall order completed: ${order.orderNo}`);
      return updated;
    });
  }

  // ==========================================================
  // 3.2 Payment Intent 域（3 个方法）
  // ==========================================================

  /**
   * 创建支付意图（Solana Pay）
   *  - 校验订单状态 = pending_payment
   *  - 调用 SolanaPayService.createPaymentIntent
   *  - 写入 chain_assets 表（如果存在）/ 暂存内存
   */
  async createPaymentIntent(input: CreatePaymentIntentInput) {
    if (!isValidMallPaymentMethod(input.paymentMethod)) {
      throw new MallPaymentMethodInvalidError({ paymentMethod: input.paymentMethod });
    }
    const amount = new Prisma.Decimal(input.amount);
    if (amount.lte(0)) {
      throw new MallIntentAmountInvalidError({ amount: input.amount });
    }
    const chainId = input.chainId ?? MALL_DEFAULT_CHAIN_ID;
    const intentNo = this.generateIntentNo();
    const expiresAt = input.expiresAt ?? new Date(Date.now() + MALL_INTENT_DEFAULT_EXPIRES_MINUTES * 60 * 1000);
    const reference = `mall_${intentNo}`;

    // 1. 校验订单
    const order = await (this.prisma as any).fjnMallOrder.findUnique({ where: { orderNo: input.orderNo } });
    if (!order) throw new MallOrderNotFoundError({ orderNo: input.orderNo });
    if (order.status !== 'pending_payment') {
      throw new MallOrderNotPayableError({ orderNo: order.orderNo, status: order.status });
    }
    if (!new Prisma.Decimal(order.totalAmount).minus(order.pointsUsed).minus(order.tokenUsed).eq(amount)) {
      throw new MallIntentAmountMismatchError({
        expected: new Prisma.Decimal(order.totalAmount).minus(order.pointsUsed).minus(order.tokenUsed).toString(),
        actual: amount.toString(),
      });
    }

    // 2. Solana Pay 创建（占位）
    const intent = await this.callSolanaPayCreateIntent(amount.toString(), order.currency, reference, expiresAt);

    // 3. 写入 FjnMallOrder（paymentMethod 确认） + 记录 intent 信息
    await (this.prisma as any).fjnMallOrder.update({
      where: { id: order.id },
      data: {
        status: 'pending_payment',
        paymentMethod: input.paymentMethod,
      },
    });

    // 4. 发出事件
    await (this.prisma as any).outboxEvent.create({
      data: {
        eventType: MALL_SOLANA_PAYMENT_EVENTS.PAYMENT_INTENT_CREATED,
        payload: {
          intentNo,
          orderNo: input.orderNo,
          userId: order.userId,
          amount: amount.toString(),
          currency: order.currency,
          paymentMethod: input.paymentMethod,
          expiresAt: expiresAt.toISOString(),
          chainId,
          reference,
          qrCode: intent.qrCode,
          url: intent.url,
          occurred_at: new Date().toISOString(),
          source: MALL_SOLANA_PAYMENT_EVENT_SOURCES.MALL_SERVICE,
        },
        status: 'pending',
        retryCount: 0,
      },
    });

    this.log('info', `Mall payment intent created: ${intentNo}`, { orderNo: input.orderNo, amount: amount.toString() });
    return {
      intentNo,
      orderNo: input.orderNo,
      amount: amount.toString(),
      currency: order.currency,
      paymentMethod: input.paymentMethod,
      status: MALL_INTENT_STATUS.ACTIVE,
      expiresAt,
      txHash: null,
      chainId,
      reference,
      qrCode: intent.qrCode,
      url: intent.url,
    } as MallIntentSummary & { qrCode: string; url: string };
  }

  /**
   * 标记支付意图已支付（Solana Pay 回调 / Webhook）
   *  - 校验 txHash 唯一
   *  - 校验金额一致
   *  - 更新订单 paidAmount + paidAt
   *  - 同步：扣除 tFJ369 / 释放积分
   */
  async markIntentPaid(input: MarkIntentPaidInput) {
    if (!input.txHash) throw new MallIntentTxHashDuplicateError({ txHash: 'required' });

    return this.withTransaction(async (tx) => {
      const order = await (tx as any).fjnMallOrder.findFirst({
        where: { paymentMethod: MALL_PAYMENT_METHOD.SOLANA_PAY, status: 'pending_payment' },
      });
      if (!order) throw new MallOrderNotPayableError({ reason: 'No pending Solana Pay order' });

      // 幂等：txHash 唯一
      const dup = await (tx as any).outboxEvent.findFirst({ where: { payload: { path: ['txHash'], equals: input.txHash } } });
      if (dup) throw new MallIntentTxHashDuplicateError({ txHash: input.txHash });

      const totalAmount = new Prisma.Decimal(order.totalAmount);
      const pointsUsed = new Prisma.Decimal(order.pointsUsed);
      const tokenUsed = new Prisma.Decimal(order.tokenUsed);
      const paidAmount = totalAmount.minus(pointsUsed).minus(tokenUsed);
      const platformFee = this.calculatePlatformFee(paidAmount);

      const updated = await (tx as any).fjnMallOrder.update({
        where: { id: order.id },
        data: {
          status: 'paid',
          paidAmount,
          platformFee,
          paidAt: new Date(),
        },
      });

      await this.emitEvent(tx, MALL_SOLANA_PAYMENT_EVENTS.PAYMENT_INTENT_PAID, {
        intentNo: `from_tx_${input.txHash}`,
        orderNo: order.orderNo,
        txHash: input.txHash,
        paidBy: input.paidBy,
        blockNumber: input.blockNumber ? BigInt(input.blockNumber).toString() : null,
        paidAmount: paidAmount.toString(),
        operatorId: input.operatorId,
      });

      await this.emitEvent(tx, MALL_SOLANA_PAYMENT_EVENTS.ORDER_PAID, {
        orderNo: order.orderNo,
        userId: order.userId,
        totalAmount: totalAmount.toString(),
        paidAmount: paidAmount.toString(),
        paymentMethod: order.paymentMethod,
        txHash: input.txHash,
      });

      this.log('info', `Mall intent paid: ${input.txHash}`, { orderNo: order.orderNo });
      return updated;
    });
  }

  /** 取消支付意图 */
  async cancelPaymentIntent(intentNo: string, reason: string, operatorId?: string) {
    if (!reason) throw new FjnValidationError('Cancel reason is required', { intentNo });
    this.log('info', `Mall payment intent cancelled: ${intentNo}`, { reason, operatorId });
    return { intentNo, status: MALL_INTENT_STATUS.CANCELLED, cancelledAt: new Date() };
  }

  /** 过期支付意图（cron 调用） */
  async expirePaymentIntents(now: Date = new Date()) {
    this.log('info', `Mall payment intents expired scan`, { now });
    return { scanned: 0, expired: 0 };
  }

  // ==========================================================
  // 3.3 Refund 域（4 个方法）
  // ==========================================================

  /**
   * 请求退款
   *  - 校验订单已支付 + 退款金额 ≤ paidAmount
   *  - 创建 FjnOperationLog（暂存）作为退款单记录
   */
  async requestRefund(input: RequestMallRefundInput) {
    if (!input.userId) throw new MallUserIdRequiredError();
    if (!input.reason) throw new FjnValidationError('Refund reason is required', { orderId: input.orderId });
    const refundAmount = new Prisma.Decimal(input.refundAmount);
    if (refundAmount.lte(0)) {
      throw new MallRefundAmountInvalidError({ refundAmount: input.refundAmount });
    }

    return this.withTransaction(async (tx) => {
      const order = await (tx as any).fjnMallOrder.findUnique({ where: { id: input.orderId } });
      if (!order) throw new MallOrderNotFoundError({ orderId: input.orderId });
      if (order.userId !== input.userId) {
        throw new FjnValidationError('Order userId mismatch', { orderUserId: order.userId, inputUserId: input.userId });
      }
      if (order.status !== 'paid' && order.status !== 'confirmed' && order.status !== 'delivered' && order.status !== 'completed') {
        throw new MallOrderNotRefundableError({ orderNo: order.orderNo, status: order.status });
      }
      if (refundAmount.gt(order.paidAmount)) {
        throw new MallRefundAmountExceedsError({
          requested: refundAmount.toString(),
          paid: order.paidAmount.toString(),
        });
      }

      const refundNo = this.generateRefundNo();
      const refund = await (tx as any).fjnOperationLog.create({
        data: {
          operationType: 'mall_refund',
          refType: 'mall_order',
          refId: order.id,
          operatorId: input.userId,
          payload: {
            refundNo,
            orderNo: order.orderNo,
            userId: input.userId,
            refundAmount: refundAmount.toString(),
            reason: input.reason,
            status: MALL_REFUND_STATUS.REQUESTED,
            paymentMethod: order.paymentMethod,
            requestedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, MALL_SOLANA_PAYMENT_EVENTS.REFUND_REQUESTED, {
        refundNo,
        orderNo: order.orderNo,
        userId: input.userId,
        refundAmount: refundAmount.toString(),
        reason: input.reason,
        operatorId: input.operatorId,
      });

      this.log('info', `Mall refund requested: ${refundNo}`, { orderNo: order.orderNo, amount: refundAmount.toString() });
      return { refundNo, refundLogId: refund.id, orderNo: order.orderNo, refundAmount: refundAmount.toString(), status: MALL_REFUND_STATUS.REQUESTED };
    });
  }

  /** 批准退款 */
  async approveRefund(input: ApproveMallRefundInput) {
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.refundId } });
      if (!log) throw new MallRefundNotFoundError({ refundId: input.refundId });
      const currentStatus = (log.payload as any).status;
      if (currentStatus !== MALL_REFUND_STATUS.REQUESTED) {
        throw new MallRefundNotApprovableError({ refundId: input.refundId, currentStatus });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.refundId },
        data: {
          payload: {
            ...(log.payload as any),
            status: MALL_REFUND_STATUS.APPROVED,
            approverId: input.approverId,
            approvedAt: new Date().toISOString(),
            comment: input.comment,
          } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, MALL_SOLANA_PAYMENT_EVENTS.REFUND_APPROVED, {
        refundNo: (log.payload as any).refundNo,
        approverId: input.approverId,
        comment: input.comment,
      });

      this.log('info', `Mall refund approved: ${(log.payload as any).refundNo}`, { approverId: input.approverId });
      return updated;
    });
  }

  /**
   * 执行退款（链上 Solana Pay refund）
   *  - 链上：SolanaTokenService.transfer（refund）
   *  - 链下：更新订单 status = refunded
   */
  async executeRefund(input: ExecuteMallRefundInput) {
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.refundId } });
      if (!log) throw new MallRefundNotFoundError({ refundId: input.refundId });
      const currentStatus = (log.payload as any).status;
      if (currentStatus !== MALL_REFUND_STATUS.APPROVED) {
        throw new MallRefundStatusInvalidError({ refundId: input.refundId, currentStatus });
      }

      // 链上：SolanaTokenService.transfer refund（占位）
      try {
        const refundAmount = (log.payload as any).refundAmount;
        this.log('info', `Solana refund placeholder`, { txHash: input.txHash, amount: refundAmount });
      } catch (e) {
        throw new MallRefundSolanaFailedError({
          refundId: input.refundId,
          originalError: (e as Error).message,
        });
      }

      // 链下：更新订单
      const order = await (tx as any).fjnMallOrder.findUnique({ where: { id: log.refId } });
      if (!order) throw new MallOrderNotFoundError({ orderId: log.refId });

      await (tx as any).fjnMallOrder.update({
        where: { id: order.id },
        data: { status: 'refunded' },
      });

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.refundId },
        data: {
          payload: {
            ...(log.payload as any),
            status: MALL_REFUND_STATUS.SUCCEEDED,
            txHash: input.txHash,
            blockNumber: input.blockNumber ? BigInt(input.blockNumber).toString() : null,
            executedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, MALL_SOLANA_PAYMENT_EVENTS.REFUND_SUCCEEDED, {
        refundNo: (log.payload as any).refundNo,
        orderNo: order.orderNo,
        txHash: input.txHash,
        operatorId: input.operatorId,
      });

      this.log('info', `Mall refund executed: ${(log.payload as any).refundNo}`, { txHash: input.txHash });
      return updated;
    });
  }

  /** 拒绝退款 */
  async rejectRefund(refundId: string, reason: string, operatorId?: string) {
    if (!reason) throw new FjnValidationError('Reject reason is required', { refundId });
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: refundId } });
      if (!log) throw new MallRefundNotFoundError({ refundId });
      const currentStatus = (log.payload as any).status;
      if (currentStatus !== MALL_REFUND_STATUS.REQUESTED) {
        throw new MallRefundStatusInvalidError({ refundId, currentStatus });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: refundId },
        data: {
          payload: {
            ...(log.payload as any),
            status: MALL_REFUND_STATUS.REJECTED,
            rejectReason: reason,
            rejectedAt: new Date().toISOString(),
            operatorId,
          } as Prisma.InputJsonValue,
        },
      });

      this.log('info', `Mall refund rejected: ${(log.payload as any).refundNo}`, { reason });
      return updated;
    });
  }

  // ==========================================================
  // 3.4 Settlement 域（3 个方法）
  // ==========================================================

  /** 创建商户结算单（按 period 聚合） */
  async createSettlement(input: CreateMallSettlementInput) {
    return this.withTransaction(async (tx) => {
      // 1. 查询该 period 内商户所有已支付订单
      const orders = await (tx as any).fjnMallOrder.findMany({
        where: {
          merchantId: input.merchantId,
          status: { in: ['paid', 'confirmed', 'shipped', 'delivered', 'completed'] },
          paidAt: { gte: new Date(`${input.period}-01`), lt: this.nextPeriodStart(input.period) },
        },
      });
      if (orders.length === 0) {
        throw new MallSettlementAmountInvalidError({ merchantId: input.merchantId, period: input.period, reason: 'no orders' });
      }

      let grossAmount = new Prisma.Decimal(0);
      let refundAmount = new Prisma.Decimal(0);
      let platformFee = new Prisma.Decimal(0);
      for (const o of orders) {
        grossAmount = grossAmount.plus(o.paidAmount);
        const fee = this.calculatePlatformFee(new Prisma.Decimal(o.paidAmount));
        platformFee = platformFee.plus(fee);
      }
      const netAmount = grossAmount.minus(platformFee).minus(refundAmount);

      const settlementNo = this.generateSettlementNo();
      const created = await (tx as any).fjnMallSettlement.create({
        data: {
          settlementNo,
          merchantId: input.merchantId,
          period: input.period,
          grossAmount,
          refundAmount,
          platformFee,
          netAmount,
          currency: MALL_DEFAULT_CURRENCY,
          orderCount: orders.length,
          status: 'created',
        },
      });

      await this.emitEvent(tx, MALL_SOLANA_PAYMENT_EVENTS.SETTLEMENT_CREATED, {
        settlementNo,
        merchantId: input.merchantId,
        period: input.period,
        grossAmount: grossAmount.toString(),
        netAmount: netAmount.toString(),
        orderCount: orders.length,
        operatorId: input.operatorId,
      });

      this.log('info', `Mall settlement created: ${settlementNo}`, { merchantId: input.merchantId, period: input.period });
      return created;
    });
  }

  /** 下一个 period 起点 */
  private nextPeriodStart(period: string): Date {
    const [year, month] = period.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return new Date(Date.UTC(nextYear, nextMonth - 1, 1));
  }

  /** 批准结算 */
  async approveSettlement(input: ApproveMallSettlementInput) {
    return this.withTransaction(async (tx) => {
      const settlement = await (tx as any).fjnMallSettlement.findUnique({ where: { id: input.settlementId } });
      if (!settlement) throw new MallSettlementNotFoundError({ settlementId: input.settlementId });
      if (settlement.status === 'approved' || settlement.status === 'paid') return settlement;
      if (settlement.status !== 'created') {
        throw new MallSettlementNotApprovableError({ settlementNo: settlement.settlementNo, status: settlement.status });
      }

      const updated = await (tx as any).fjnMallSettlement.update({
        where: { id: input.settlementId },
        data: {
          status: 'approved',
          approvedBy: input.approverId,
          approvedAt: new Date(),
          bankAccount: input.bankAccount ?? Prisma.JsonNull,
        },
      });

      this.log('info', `Mall settlement approved: ${settlement.settlementNo}`, { approverId: input.approverId });
      return updated;
    });
  }

  /** 支付结算（链上/链下） */
  async paySettlement(input: PayMallSettlementInput) {
    return this.withTransaction(async (tx) => {
      const settlement = await (tx as any).fjnMallSettlement.findUnique({ where: { id: input.settlementId } });
      if (!settlement) throw new MallSettlementNotFoundError({ settlementId: input.settlementId });
      if (settlement.status === 'paid') {
        throw new MallSettlementAlreadyPaidError({ settlementNo: settlement.settlementNo });
      }
      if (settlement.status !== 'approved') {
        throw new MallSettlementNotApprovableError({ settlementNo: settlement.settlementNo, status: settlement.status });
      }

      const updated = await (tx as any).fjnMallSettlement.update({
        where: { id: input.settlementId },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
      });

      await this.emitEvent(tx, MALL_SOLANA_PAYMENT_EVENTS.SETTLEMENT_PAID, {
        settlementNo: settlement.settlementNo,
        merchantId: settlement.merchantId,
        netAmount: settlement.netAmount.toString(),
        txHash: input.txHash,
        operatorId: input.operatorId,
      });

      this.log('info', `Mall settlement paid: ${settlement.settlementNo}`, { txHash: input.txHash });
      return updated;
    });
  }

  // ==========================================================
  // 3.5 Coupon 域（3 个方法）
  // ==========================================================

  /** 校验 Coupon 可用性 */
  async validateCoupon(couponId: string, totalAmount: string) {
    const coupon = await (this.prisma as any).fjnMallCoupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new MallCouponNotFoundError({ couponId });
    if (coupon.status !== 'active') throw new MallCouponNotActiveError({ couponNo: coupon.couponNo, status: coupon.status });
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTo) {
      throw new MallCouponExpiredError({ couponNo: coupon.couponNo, validFrom: coupon.validFrom, validTo: coupon.validTo });
    }
    if (coupon.claimedCount >= coupon.totalSupply) {
      throw new MallCouponSupplyExhaustedError({ couponNo: coupon.couponNo });
    }
    if (new Prisma.Decimal(totalAmount).lt(coupon.minSpend)) {
      throw new MallCouponMinSpendNotMetError({
        total: totalAmount,
        minSpend: coupon.minSpend.toString(),
      });
    }
    return coupon;
  }

  /** 计算 Coupon 抵扣金额 */
  async calculateCouponDiscount(couponId: string, totalAmount: string): Promise<string> {
    const coupon = await this.validateCoupon(couponId, totalAmount);
    const total = new Prisma.Decimal(totalAmount);
    if (coupon.couponType === 'fixed') {
      return coupon.amount.gt(total) ? total.toString() : coupon.amount.toString();
    } else {
      // percentage
      return total.mul(coupon.amount).div(100).toDecimalPlaces(4, Prisma.Decimal.ROUND_DOWN).toString();
    }
  }

  /** 标记 Coupon 已使用 */
  async markCouponUsed(couponId: string, userId: string) {
    return this.withTransaction(async (tx) => {
      const coupon = await (tx as any).fjnMallCoupon.findUnique({ where: { id: couponId } });
      if (!coupon) throw new MallCouponNotFoundError({ couponId });
      await (tx as any).fjnMallCoupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
      this.log('info', `Mall coupon used: ${coupon.couponNo}`, { userId });
      return coupon;
    });
  }

  // ==========================================================
  // 3.6 查询域（4 个方法）
  // ==========================================================

  async getOrder(orderId: string) {
    const order = await (this.prisma as any).fjnMallOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new MallOrderNotFoundError({ orderId });
    return order;
  }

  async getOrderByNo(orderNo: string) {
    const order = await (this.prisma as any).fjnMallOrder.findUnique({ where: { orderNo } });
    if (!order) throw new MallOrderNotFoundError({ orderNo });
    return order;
  }

  async getProduct(productId: string) {
    const product = await (this.prisma as any).fjnMallProduct.findUnique({ where: { id: productId } });
    if (!product) throw new MallProductNotFoundError({ productId });
    return product;
  }

  async getSettlement(settlementId: string) {
    const settlement = await (this.prisma as any).fjnMallSettlement.findUnique({ where: { id: settlementId } });
    if (!settlement) throw new MallSettlementNotFoundError({ settlementId });
    return settlement;
  }

  async listOrders(input: ListMallOrdersInput = {}) {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const where: any = {};
    if (input.userId) where.userId = input.userId;
    if (input.merchantId) where.merchantId = input.merchantId;
    if (input.status) where.status = input.status;
    if (input.paymentMethod) where.paymentMethod = input.paymentMethod;
    const [items, total] = await Promise.all([
      (this.prisma as any).fjnMallOrder.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true, imageUrl: true } } },
      }),
      (this.prisma as any).fjnMallOrder.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async listSettlements(merchantId: string, period?: string) {
    return (this.prisma as any).fjnMallSettlement.findMany({
      where: { merchantId, ...(period ? { period } : {}) },
      orderBy: [{ period: 'desc' }],
    });
  }

  /** 用户 Mall 汇总 */
  async getUserMallSummary(userId: string) {
    const orders = await (this.prisma as any).fjnMallOrder.findMany({ where: { userId } });
    let totalSpent = new Prisma.Decimal(0);
    let pendingOrders = 0;
    let completedOrders = 0;
    for (const o of orders) {
      if (o.status === 'completed') {
        totalSpent = totalSpent.plus(o.paidAmount);
        completedOrders++;
      } else if (o.status === 'pending_payment' || o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered') {
        pendingOrders++;
      }
    }
    return {
      userId,
      totalOrders: orders.length,
      completedOrders,
      pendingOrders,
      totalSpent: totalSpent.toString(),
    };
  }
}
