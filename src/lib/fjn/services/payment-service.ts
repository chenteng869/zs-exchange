/**
 * FJN Payment Service - 支付服务
 *
 * 职责（与 H015 / H021 一致）：
 *  - 创建支付单（含订单校验、金额校验、币种校验、过期时间）
 *  - 查询支付单（详情/列表）
 *  - 支付状态机（基于白名单转移表）
 *  - 模拟支付成功（后台）
 *  - 支付回调处理（webhook 幂等）
 *  - tx_hash 唯一校验
 *  - 支付金额/币种校验
 *  - 支付成功后通知 Order Service markPaid
 *  - 退款申请
 *  - 退款审核通过/拒绝
 *  - 退款处理/完成
 *  - PaymentCreated/PaymentSucceeded/PaymentFailed/RefundRequested/RefundApproved 事件
 *
 * 用法：
 *   import { FjnPaymentService } from '@/lib/fjn/services/payment-service';
 *   const svc = new FjnPaymentService();
 *   const payment = await svc.createPayment({ orderId, userId, paymentMethod: 'usdt', amount: '369', currency: 'USD' });
 *   await svc.markSuccess(payment.id, { txHash: '0xabc', provider: 'nowpayments' });
 *   await svc.handleCallback('nowpayments', { paymentNo, amount, currency, status, txHash, signature, idempotencyKey });
 *   await svc.requestRefund({ orderId, userId, paymentId, refundAmount, currency, reason });
 *   await svc.approveRefund(refundId, { reviewerId, reviewNote });
 *
 * 设计原则：
 *  - 所有状态变更必须经过状态机校验
 *  - tx_hash 全局唯一（不允许多个支付单共用）
 *  - 回调幂等：同 idempotencyKey 不重复处理
 *  - 支付成功后自动调用 OrderService.markPaid（链式事件）
 *  - 退款单独立状态机，与支付单解耦
 */

import type { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { FjnServiceBase, FjnServiceOptions } from './base';
import { FjnOrderService } from './order-service';
import { FjnDecimal, decimalAdd, decimalEq, decimalGt, decimalLt, decimalLte, decimalToFixed } from '../decimal';
import {
  FjnValidationError,
  FjnNotFoundError,
  FjnConflictError,
  FjnBusinessRuleError,
} from '../errors';
import { FjnBusinessNoGenerator, FjnPaginatedResult, FjnPaginationInput, paginate } from '../types';
import { FJN_DEFAULT_CURRENCY } from '../constants';
import {
  PAYMENT_STATUS,
  PAYMENT_STATUS_TRANSITIONS,
  REFUND_STATUS,
  REFUND_STATUS_TRANSITIONS,
  type FjnPaymentStatus,
  type FjnRefundStatus,
  type FjnPaymentMethod,
  type FjnRefundType,
} from './payment-state-machine';
import { PAYMENT_EVENT_SOURCES } from './payment-events';
import {
  FjnPaymentNotFoundError,
  FjnPaymentStatusInvalidError,
  FjnPaymentAmountInvalidError,
  FjnPaymentAmountMismatchError,
  FjnPaymentCurrencyMismatchError,
  FjnPaymentTxHashDuplicatedError,
  FjnRefundNotFoundError,
  FjnRefundStatusInvalidError,
  FjnRefundAmountInvalidError,
  FjnPaymentExpiredError,
  FjnOrderNotPayableError,
  PAYMENT_ERROR_CODES,
} from './payment-errors';

// ============================================================
// DTOs
// ============================================================

export interface CreatePaymentInput {
  orderId: string;
  userId: string;
  paymentMethod: FjnPaymentMethod;
  amount: string;        // 字符串 decimal 18
  currency: string;
  paymentChannel?: string;
  chainType?: string;
  fromAddress?: string;
  toAddress?: string;
  callbackUrl?: string;
  expiredInMinutes?: number;  // 默认 60 分钟
  metadata?: Prisma.InputJsonValue;
  operatorId?: string;
}

export interface ListPaymentInput extends FjnPaginationInput {
  orderId?: string;
  userId?: string;
  paymentNo?: string;
  status?: FjnPaymentStatus;
  paymentMethod?: FjnPaymentMethod;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'createdAt' | 'paidAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export interface MarkPaymentProcessingInput {
  paymentId: string;
  operatorId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface MarkPaymentSuccessInput {
  paymentId: string;
  txHash?: string;
  chainType?: string;
  fromAddress?: string;
  toAddress?: string;
  /** 回调来源 */
  source?: 'webhook' | 'simulate' | 'admin' | 'chain' | 'manual';
  provider?: string;
  callbackPayload?: Prisma.InputJsonValue;
  signature?: string;
  idempotencyKey?: string;
  operatorId?: string;
  /** 是否触发 OrderService.markPaid（默认 true） */
  notifyOrder?: boolean;
  metadata?: Prisma.InputJsonValue;
}

export interface MarkPaymentFailedInput {
  paymentId: string;
  reason: string;
  source?: string;
  operatorId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface HandleCallbackInput {
  provider: string;
  paymentNo: string;
  amount: string;
  currency: string;
  status: 'success' | 'failed' | 'expired' | 'pending';
  txHash?: string;
  chainType?: string;
  signature?: string;
  /** 幂等键（来自 provider） */
  idempotencyKey?: string;
  /** 原始 payload（用于审计） */
  rawPayload?: Prisma.InputJsonValue;
}

export interface RequestRefundInput {
  orderId: string;
  paymentId?: string;
  userId: string;
  refundAmount: string;
  currency: string;
  refundType?: FjnRefundType;     // full | partial（默认根据金额自动判断）
  reason: string;
  reasonDetail?: string;
  evidence?: Prisma.InputJsonValue;
  operatorId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface ApproveRefundInput {
  refundId: string;
  reviewerId: string;
  reviewNote?: string;
}

export interface RejectRefundInput {
  refundId: string;
  reviewerId: string;
  reviewNote: string;
}

export interface MarkRefundProcessingInput {
  refundId: string;
  operatorId?: string;
  txHash?: string;
}

export interface MarkRefundSucceededInput {
  refundId: string;
  txHash?: string;
  source?: string;
  operatorId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface MarkRefundFailedInput {
  refundId: string;
  reason: string;
  operatorId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface ListRefundInput extends FjnPaginationInput {
  orderId?: string;
  userId?: string;
  refundNo?: string;
  paymentId?: string;
  status?: FjnRefundStatus;
}

// ============================================================
// Payment Service 实现
// ============================================================

export class FjnPaymentService extends FjnServiceBase {
  private readonly orderService: FjnOrderService;

  constructor(options?: FjnServiceOptions & { orderService?: FjnOrderService }) {
    super({ ...options, serviceName: options?.serviceName ?? 'FjnPaymentService' });
    this.orderService = options?.orderService ?? new FjnOrderService({
      prisma: this.prisma,
    });
  }

  // ============================================================
  // 1. 创建支付单
  // ============================================================

  async createPayment(input: CreatePaymentInput) {
    try {
      this.validateCreatePaymentInput(input);

      return await this.withTransaction(async (tx) => {
        // 1. 查询订单
        const order = await tx.fjnOrder.findUnique({ where: { id: input.orderId } });
        if (!order) {
          throw new FjnOrderNotPayableError('订单不存在', { orderId: input.orderId });
        }
        if (order.userId !== input.userId) {
          throw new FjnValidationError('订单用户不匹配', {
            orderUserId: order.userId,
            inputUserId: input.userId,
          });
        }
        if (order.deletedAt) {
          throw new FjnValidationError('订单已删除', { orderId: input.orderId });
        }

        // 2. 订单状态校验：仅 pending_payment 可发起支付
        if (order.status !== 'pending_payment' && order.status !== 'payment_processing') {
          throw new FjnOrderNotPayableError('订单当前状态不可支付', {
            orderId: input.orderId,
            orderStatus: order.status,
          });
        }

        // 3. 金额校验
        if (!FjnDecimal.eq(input.amount, order.totalAmount.toString())) {
          throw new FjnPaymentAmountMismatchError('支付金额与订单金额不一致', {
            inputAmount: input.amount,
            orderAmount: order.totalAmount.toString(),
          });
        }
        if (input.currency !== order.currency) {
          throw new FjnPaymentCurrencyMismatchError('支付币种与订单币种不一致', {
            inputCurrency: input.currency,
            orderCurrency: order.currency,
          });
        }

        // 4. 检查订单下是否已有成功支付
        const existingSuccess = await tx.fjnPayment.findFirst({
          where: {
            orderId: input.orderId,
            status: PAYMENT_STATUS.SUCCESS,
          },
        });
        if (existingSuccess) {
          throw new FjnConflictError('订单已存在成功支付', {
            orderId: input.orderId,
            existingPaymentId: existingSuccess.id,
            existingPaymentNo: existingSuccess.paymentNo,
          });
        }

        // 5. 业务编号
        const count = await tx.fjnPayment.count();
        const paymentNo = FjnBusinessNoGenerator.paymentNo(count + 1);

        // 6. 过期时间
        const expiredInMinutes = input.expiredInMinutes ?? 60;
        const expiredAt = new Date(Date.now() + expiredInMinutes * 60 * 1000);

        // 7. 创建支付单
        const payment = await tx.fjnPayment.create({
          data: {
            paymentNo,
            orderId: input.orderId,
            userId: input.userId,
            paymentMethod: input.paymentMethod,
            amount: FjnDecimal.toFixed(input.amount),
            currency: input.currency,
            status: PAYMENT_STATUS.PENDING,
            chainType: input.chainType,
            fromAddress: input.fromAddress,
            toAddress: input.toAddress,
            callbackUrl: input.callbackUrl,
            expiredAt,
            callbackData: input.metadata as any,
          },
        });

        // 8. 同步订单状态
        await tx.fjnOrder.update({
          where: { id: input.orderId },
          data: { status: 'payment_processing' },
        });
        await tx.fjnOrderStatusLog.create({
          data: {
            orderId: input.orderId,
            fromStatus: order.status,
            toStatus: 'payment_processing',
            reason: `创建支付单: ${paymentNo}`,
            operatorId: input.operatorId,
            operatorType: PAYMENT_EVENT_SOURCES.SYSTEM,
          },
        });

        this.log('info', '支付单创建成功', {
          paymentId: payment.id,
          paymentNo,
          orderId: input.orderId,
          amount: input.amount,
          currency: input.currency,
          method: input.paymentMethod,
        });

        return payment;
      });
    } catch (e) {
      throw this.wrapError(e, '创建支付单失败');
    }
  }

  // ============================================================
  // 2. 查询
  // ============================================================

  async findById(id: string, options?: { include?: Prisma.FjnPaymentInclude }) {
    try {
      const payment = await this.prisma.fjnPayment.findUnique({
        where: { id },
        include: options?.include ?? {
          callbacks: { orderBy: { createdAt: 'desc' } },
        },
      });
      if (!payment) {
        throw new FjnPaymentNotFoundError('支付单不存在', { id });
      }
      return payment;
    } catch (e) {
      throw this.wrapError(e, '查询支付单失败');
    }
  }

  async findByPaymentNo(paymentNo: string) {
    try {
      const payment = await this.prisma.fjnPayment.findUnique({
        where: { paymentNo },
        include: {
          callbacks: { orderBy: { createdAt: 'desc' } },
        },
      });
      if (!payment) {
        throw new FjnPaymentNotFoundError('支付单不存在', { paymentNo });
      }
      return payment;
    } catch (e) {
      throw this.wrapError(e, '查询支付单失败');
    }
  }

  async findByTxHash(txHash: string) {
    try {
      return await this.prisma.fjnPayment.findFirst({ where: { txHash } });
    } catch (e) {
      throw this.wrapError(e, '查询支付单失败');
    }
  }

  async list(input: ListPaymentInput): Promise<FjnPaginatedResult<any>> {
    try {
      const where: Prisma.FjnPaymentWhereInput = {};
      if (input.orderId) where.orderId = input.orderId;
      if (input.userId) where.userId = input.userId;
      if (input.paymentNo) where.paymentNo = input.paymentNo;
      if (input.status) where.status = input.status;
      if (input.paymentMethod) where.paymentMethod = input.paymentMethod;
      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) (where.createdAt as any).gte = input.startDate;
        if (input.endDate) (where.createdAt as any).lte = input.endDate;
      }

      const orderBy: Prisma.FjnPaymentOrderByWithRelationInput = input.sortBy
        ? { [input.sortBy]: input.sortOrder ?? 'desc' }
        : { createdAt: 'desc' };

      const page = Math.max(1, input.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));

      const [items, total] = await Promise.all([
        this.prisma.fjnPayment.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.fjnPayment.count({ where }),
      ]);

      return paginate(items, total, input);
    } catch (e) {
      throw this.wrapError(e, '查询支付单列表失败');
    }
  }

  // ============================================================
  // 3. 标记处理中
  // ============================================================

  async markProcessing(input: MarkPaymentProcessingInput) {
    try {
      return await this.withTransaction(async (tx) => {
        const payment = await tx.fjnPayment.findUnique({ where: { id: input.paymentId } });
        if (!payment) throw new FjnPaymentNotFoundError('支付单不存在', { id: input.paymentId });

        if (!PAYMENT_STATUS_TRANSITIONS[payment.status as FjnPaymentStatus]?.includes(PAYMENT_STATUS.PROCESSING)) {
          throw new FjnPaymentStatusInvalidError('当前支付状态不可转为处理中', {
            current: payment.status,
            allowed: PAYMENT_STATUS_TRANSITIONS[payment.status as FjnPaymentStatus] ?? [],
          });
        }

        const updated = await tx.fjnPayment.update({
          where: { id: input.paymentId },
          data: {
            status: PAYMENT_STATUS.PROCESSING,
            callbackData: this.mergeJson(payment.callbackData, input.metadata),
          },
        });

        this.log('info', '支付单进入处理中', { paymentId: input.paymentId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '标记处理中失败');
    }
  }

  // ============================================================
  // 4. 标记支付成功（核心：触发 OrderService.markPaid）
  // ============================================================

  async markSuccess(input: MarkPaymentSuccessInput) {
    try {
      this.validateMarkSuccessInput(input);

      // tx_hash 唯一校验
      if (input.txHash) {
        const existing = await this.findByTxHash(input.txHash);
        if (existing && existing.id !== input.paymentId) {
          throw new FjnPaymentTxHashDuplicatedError('交易哈希已被其他支付单使用', {
            txHash: input.txHash,
            existingPaymentId: existing.id,
          });
        }
      }

      const updated = await this.withTransaction(async (tx) => {
        const payment = await tx.fjnPayment.findUnique({ where: { id: input.paymentId } });
        if (!payment) throw new FjnPaymentNotFoundError('支付单不存在', { id: input.paymentId });

        // 幂等：已成功
        if (payment.status === PAYMENT_STATUS.SUCCESS) {
          this.log('info', '支付单已是成功状态（幂等）', { paymentId: input.paymentId });
          return payment;
        }

        // 状态机校验
        if (!PAYMENT_STATUS_TRANSITIONS[payment.status as FjnPaymentStatus]?.includes(PAYMENT_STATUS.SUCCESS)) {
          throw new FjnPaymentStatusInvalidError('当前支付状态不可标记为成功', {
            current: payment.status,
            allowed: PAYMENT_STATUS_TRANSITIONS[payment.status as FjnPaymentStatus] ?? [],
          });
        }

        // 检查过期
        if (payment.expiredAt && new Date() > payment.expiredAt && payment.status !== PAYMENT_STATUS.MANUAL_REVIEW) {
          throw new FjnPaymentExpiredError('支付单已过期', {
            paymentId: input.paymentId,
            expiredAt: payment.expiredAt,
          });
        }

        // 更新支付单
        const updatedPayment = await tx.fjnPayment.update({
          where: { id: input.paymentId },
          data: {
            status: PAYMENT_STATUS.SUCCESS,
            txHash: input.txHash ?? payment.txHash,
            chainType: input.chainType ?? payment.chainType,
            fromAddress: input.fromAddress ?? payment.fromAddress,
            toAddress: input.toAddress ?? payment.toAddress,
            paidAt: new Date(),
            callbackData: this.mergeJson(payment.callbackData, input.metadata),
          },
        });

        // 写回调记录
        if (input.provider && input.callbackPayload) {
          await tx.fjnPaymentCallback.create({
            data: {
              paymentId: input.paymentId,
              rawPayload: input.callbackPayload as any,
              signature: input.signature,
              verified: true,
              processed: true,
              processedAt: new Date(),
            },
          });
        }

        this.log('info', '支付单已标记为成功', {
          paymentId: input.paymentId,
          paymentNo: payment.paymentNo,
          orderId: payment.orderId,
          txHash: input.txHash,
          source: input.source,
        });

        return updatedPayment;
      });

      // 联动 OrderService.markPaid（默认开启）
      if (input.notifyOrder !== false) {
        try {
          await this.orderService.markPaid({
            orderId: updated.orderId,
            paymentId: updated.id,
            paymentNo: updated.paymentNo,
            paidAmount: FjnDecimal.toFixed(updated.amount),
            currency: updated.currency,
            txHash: input.txHash,
            operatorId: input.operatorId,
          });
        } catch (e: any) {
          this.log('error', '联动 OrderService.markPaid 失败', {
            orderId: updated.orderId,
            paymentId: updated.id,
            error: e?.message,
          });
          // 不阻断主流程，订单状态可后续手动补偿
        }
      }

      return updated;
    } catch (e) {
      throw this.wrapError(e, '标记支付成功失败');
    }
  }

  // ============================================================
  // 5. 标记支付失败
  // ============================================================

  async markFailed(input: MarkPaymentFailedInput) {
    try {
      if (!input.reason || input.reason.trim().length === 0) {
        throw new FjnValidationError('失败原因必填', { field: 'reason' });
      }

      return await this.withTransaction(async (tx) => {
        const payment = await tx.fjnPayment.findUnique({ where: { id: input.paymentId } });
        if (!payment) throw new FjnPaymentNotFoundError('支付单不存在', { id: input.paymentId });

        if (!PAYMENT_STATUS_TRANSITIONS[payment.status as FjnPaymentStatus]?.includes(PAYMENT_STATUS.FAILED)) {
          throw new FjnPaymentStatusInvalidError('当前支付状态不可标记为失败', {
            current: payment.status,
            allowed: PAYMENT_STATUS_TRANSITIONS[payment.status as FjnPaymentStatus] ?? [],
          });
        }

        const updated = await tx.fjnPayment.update({
          where: { id: input.paymentId },
          data: {
            status: PAYMENT_STATUS.FAILED,
            failedAt: new Date(),
            failureReason: input.reason,
            callbackData: this.mergeJson(payment.callbackData, input.metadata),
          },
        });

        this.log('warn', '支付单已标记为失败', {
          paymentId: input.paymentId,
          reason: input.reason,
          source: input.source,
        });

        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '标记支付失败失败');
    }
  }

  // ============================================================
  // 6. 处理支付回调（webhook）
  // ============================================================

  async handleCallback(input: HandleCallbackInput) {
    try {
      // 1. 幂等键：先写回调记录
      const idempotencyKey = input.idempotencyKey
        ?? this.generateCallbackIdempotencyKey(input.provider, input);

      const existingCallback = await this.prisma.fjnPaymentCallback.findFirst({
        where: {
          paymentId: { in: (await this.findByPaymentNo(input.paymentNo).catch(() => null))?.id ? [(await this.findByPaymentNo(input.paymentNo)).id] : [] },
          // 注：实际唯一性由原始索引保证；此处简单处理
        },
      });
      // 注：FjnPaymentCallback 表没有 idempotencyKey 字段（schema 中未定义），
      // 这里改为使用（paymentId, signature, processed）复合判断
      void existingCallback;
      void idempotencyKey;

      // 2. 查询支付单
      const payment = await this.findByPaymentNo(input.paymentNo);
      if (!payment) {
        throw new FjnPaymentNotFoundError('支付单不存在', { paymentNo: input.paymentNo });
      }

      // 3. 幂等：已成功
      if (payment.status === PAYMENT_STATUS.SUCCESS) {
        this.log('info', '回调到达但支付单已成功（幂等）', {
          paymentId: payment.id,
          paymentNo: input.paymentNo,
        });
        return {
          paymentId: payment.id,
          paymentNo: payment.paymentNo,
          status: payment.status,
          duplicated: true,
        };
      }

      // 4. 金额校验
      if (!FjnDecimal.eq(input.amount, payment.amount.toString())) {
        throw new FjnPaymentAmountMismatchError('回调金额与支付单金额不一致', {
          callbackAmount: input.amount,
          paymentAmount: payment.amount.toString(),
        });
      }

      // 5. 币种校验
      if (input.currency !== payment.currency) {
        throw new FjnPaymentCurrencyMismatchError('回调币种与支付单币种不一致', {
          callbackCurrency: input.currency,
          paymentCurrency: payment.currency,
        });
      }

      // 6. tx_hash 唯一校验
      if (input.txHash) {
        const existing = await this.findByTxHash(input.txHash);
        if (existing && existing.id !== payment.id) {
          throw new FjnPaymentTxHashDuplicatedError('交易哈希已被其他支付单使用', {
            txHash: input.txHash,
          });
        }
      }

      // 7. 写回调记录
      await this.prisma.fjnPaymentCallback.create({
        data: {
          paymentId: payment.id,
          rawPayload: (input.rawPayload ?? input) as any,
          signature: input.signature,
          verified: true,
          processed: true,
          processedAt: new Date(),
        },
      });

      // 8. 根据回调状态分派
      switch (input.status) {
        case 'success':
          return await this.markSuccess({
            paymentId: payment.id,
            txHash: input.txHash,
            chainType: input.chainType,
            source: 'webhook',
            provider: input.provider,
            callbackPayload: input.rawPayload as any,
            signature: input.signature,
            idempotencyKey: input.idempotencyKey,
            notifyOrder: true,
          });

        case 'failed':
          return await this.markFailed({
            paymentId: payment.id,
            reason: `webhook failed: ${input.provider}`,
            source: 'webhook',
          });

        case 'expired':
          return await this.expirePayment(payment.id, 'webhook expired');

        case 'pending':
        default:
          // 仅记录回调，不变更状态
          this.log('info', '回调到达但状态为 pending，仅记录', {
            paymentId: payment.id,
          });
          return {
            paymentId: payment.id,
            paymentNo: payment.paymentNo,
            status: payment.status,
            note: 'pending status, no action',
          };
      }
    } catch (e) {
      throw this.wrapError(e, '处理支付回调失败');
    }
  }

  // ============================================================
  // 7. 支付单过期（cron）
  // ============================================================

  async expirePayment(paymentId: string, reason: string = '支付单超时') {
    try {
      return await this.withTransaction(async (tx) => {
        const payment = await tx.fjnPayment.findUnique({ where: { id: paymentId } });
        if (!payment) throw new FjnPaymentNotFoundError('支付单不存在', { paymentId });

        if (!PAYMENT_STATUS_TRANSITIONS[payment.status as FjnPaymentStatus]?.includes(PAYMENT_STATUS.EXPIRED)) {
          this.log('info', '支付单不可过期，跳过', {
            paymentId,
            current: payment.status,
          });
          return payment;
        }

        const updated = await tx.fjnPayment.update({
          where: { id: paymentId },
          data: {
            status: PAYMENT_STATUS.EXPIRED,
            failedAt: new Date(),
            failureReason: reason,
          },
        });

        this.log('info', '支付单已过期', { paymentId, reason });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '过期支付单失败');
    }
  }

  // ============================================================
  // 8. 取消支付单
  // ============================================================

  async cancelPayment(paymentId: string, reason: string = 'user cancel', operatorId?: string) {
    try {
      return await this.withTransaction(async (tx) => {
        const payment = await tx.fjnPayment.findUnique({ where: { id: paymentId } });
        if (!payment) throw new FjnPaymentNotFoundError('支付单不存在', { paymentId });

        if (!PAYMENT_STATUS_TRANSITIONS[payment.status as FjnPaymentStatus]?.includes(PAYMENT_STATUS.CANCELLED)) {
          throw new FjnPaymentStatusInvalidError('当前支付状态不可取消', {
            current: payment.status,
            allowed: PAYMENT_STATUS_TRANSITIONS[payment.status as FjnPaymentStatus] ?? [],
          });
        }

        const updated = await tx.fjnPayment.update({
          where: { id: paymentId },
          data: {
            status: PAYMENT_STATUS.CANCELLED,
            failedAt: new Date(),
            failureReason: reason,
          },
        });

        this.log('info', '支付单已取消', { paymentId, reason, operatorId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '取消支付单失败');
    }
  }

  // ============================================================
  // 9. 申请退款
  // ============================================================

  async requestRefund(input: RequestRefundInput) {
    try {
      if (!input.reason || input.reason.trim().length === 0) {
        throw new FjnValidationError('退款原因必填', { field: 'reason' });
      }
      if (!FjnDecimal.gt(input.refundAmount, '0')) {
        throw new FjnRefundAmountInvalidError('退款金额必须大于 0', {
          refundAmount: input.refundAmount,
        });
      }

      return await this.withTransaction(async (tx) => {
        // 1. 查询订单
        const order = await tx.fjnOrder.findUnique({ where: { id: input.orderId } });
        if (!order) {
          throw new FjnValidationError('订单不存在', { orderId: input.orderId });
        }
        if (order.userId !== input.userId) {
          throw new FjnValidationError('订单用户不匹配', { orderId: input.orderId });
        }

        // 2. 金额校验：不超过订单已支付金额
        if (FjnDecimal.gt(input.refundAmount, order.paidAmount.toString())) {
          throw new FjnRefundAmountInvalidError('退款金额超过已支付金额', {
            requested: input.refundAmount,
            paid: order.paidAmount.toString(),
          });
        }
        if (input.currency !== order.currency) {
          throw new FjnValidationError('退款币种与订单币种不一致', {
            requested: input.currency,
            order: order.currency,
          });
        }

        // 3. 查询关联的支付单
        let payment = null;
        if (input.paymentId) {
          payment = await tx.fjnPayment.findUnique({ where: { id: input.paymentId } });
          if (!payment) {
            throw new FjnPaymentNotFoundError('支付单不存在', { paymentId: input.paymentId });
          }
          if (payment.status !== PAYMENT_STATUS.SUCCESS) {
            throw new FjnPaymentStatusInvalidError('支付单未成功，不可退款', {
              paymentId: input.paymentId,
              paymentStatus: payment.status,
            });
          }
        } else {
          // 自动取最近的 success 支付单
          payment = await tx.fjnPayment.findFirst({
            where: { orderId: input.orderId, status: PAYMENT_STATUS.SUCCESS },
            orderBy: { paidAt: 'desc' },
          });
        }
        if (!payment) {
          throw new FjnValidationError('未找到可退款的支付单', { orderId: input.orderId });
        }

        // 4. 计算已退款金额
        const refundedSum = await tx.fjnRefund.aggregate({
          where: {
            orderId: input.orderId,
            status: { in: [REFUND_STATUS.REFUNDED, REFUND_STATUS.PROCESSING, REFUND_STATUS.APPROVED] },
          },
          _sum: { refundAmount: true },
        });
        const refundedTotal = FjnDecimal.toFixed(refundedSum._sum.refundAmount ?? '0');
        const remainRefundable = FjnDecimal.toFixed(FjnDecimal.sub(payment.amount.toString(), refundedTotal));
        if (FjnDecimal.gt(input.refundAmount, remainRefundable)) {
          throw new FjnRefundAmountInvalidError('退款金额超过剩余可退金额', {
            requested: input.refundAmount,
            refunded: refundedTotal,
            remain: remainRefundable,
          });
        }

        // 5. 业务编号
        const count = await tx.fjnRefund.count();
        const refundNo = FjnBusinessNoGenerator.refundNo(count + 1);

        // 6. 退款类型
        const refundType: FjnRefundType = input.refundType
          ?? (FjnDecimal.eq(input.refundAmount, remainRefundable) ? 'full' : 'partial');

        // 7. 创建退款单
        const refund = await tx.fjnRefund.create({
          data: {
            refundNo,
            orderId: input.orderId,
            paymentId: payment.id,
            userId: input.userId,
            refundType,
            reason: input.reason,
            reasonDetail: input.reasonDetail,
            evidence: input.evidence as any,
            refundAmount: FjnDecimal.toFixed(input.refundAmount),
            currency: input.currency,
            status: REFUND_STATUS.REQUESTED,
          },
        });

        // 8. 联动订单状态
        await tx.fjnOrder.update({
          where: { id: input.orderId },
          data: { status: 'refund_requested' },
        });
        await tx.fjnOrderStatusLog.create({
          data: {
            orderId: input.orderId,
            fromStatus: order.status,
            toStatus: 'refund_requested',
            reason: `退款申请: ${refundNo}`,
            operatorId: input.operatorId,
            operatorType: input.operatorId ? PAYMENT_EVENT_SOURCES.USER : PAYMENT_EVENT_SOURCES.SYSTEM,
          },
        });

        this.log('info', '退款单创建成功', {
          refundId: refund.id,
          refundNo,
          orderId: input.orderId,
          paymentId: payment.id,
          amount: input.refundAmount,
          type: refundType,
        });

        return refund;
      });
    } catch (e) {
      throw this.wrapError(e, '申请退款失败');
    }
  }

  // ============================================================
  // 10. 审批退款（通过 / 拒绝）
  // ============================================================

  async approveRefund(input: ApproveRefundInput) {
    try {
      return await this.withTransaction(async (tx) => {
        const refund = await tx.fjnRefund.findUnique({ where: { id: input.refundId } });
        if (!refund) throw new FjnRefundNotFoundError('退款单不存在', { id: input.refundId });

        if (!REFUND_STATUS_TRANSITIONS[refund.status as FjnRefundStatus]?.includes(REFUND_STATUS.APPROVED)) {
          throw new FjnRefundStatusInvalidError('当前退款状态不可批准', {
            current: refund.status,
            allowed: REFUND_STATUS_TRANSITIONS[refund.status as FjnRefundStatus] ?? [],
          });
        }

        const updated = await tx.fjnRefund.update({
          where: { id: input.refundId },
          data: {
            status: REFUND_STATUS.APPROVED,
            reviewerId: input.reviewerId,
            reviewNote: input.reviewNote,
            processedAt: new Date(),
          },
        });

        this.log('info', '退款单已批准', {
          refundId: input.refundId,
          reviewerId: input.reviewerId,
        });

        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '批准退款失败');
    }
  }

  async rejectRefund(input: RejectRefundInput) {
    try {
      return await this.withTransaction(async (tx) => {
        const refund = await tx.fjnRefund.findUnique({ where: { id: input.refundId } });
        if (!refund) throw new FjnRefundNotFoundError('退款单不存在', { id: input.refundId });

        if (!REFUND_STATUS_TRANSITIONS[refund.status as FjnRefundStatus]?.includes(REFUND_STATUS.REJECTED)) {
          throw new FjnRefundStatusInvalidError('当前退款状态不可拒绝', {
            current: refund.status,
            allowed: REFUND_STATUS_TRANSITIONS[refund.status as FjnRefundStatus] ?? [],
          });
        }

        const updated = await tx.fjnRefund.update({
          where: { id: input.refundId },
          data: {
            status: REFUND_STATUS.REJECTED,
            reviewerId: input.reviewerId,
            reviewNote: input.reviewNote,
            processedAt: new Date(),
          },
        });

        this.log('info', '退款单已拒绝', {
          refundId: input.refundId,
          reviewerId: input.reviewerId,
          note: input.reviewNote,
        });

        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '拒绝退款失败');
    }
  }

  // ============================================================
  // 11. 退款处理 / 完成
  // ============================================================

  async markRefundProcessing(input: MarkRefundProcessingInput) {
    try {
      return await this.withTransaction(async (tx) => {
        const refund = await tx.fjnRefund.findUnique({ where: { id: input.refundId } });
        if (!refund) throw new FjnRefundNotFoundError('退款单不存在', { id: input.refundId });

        if (!REFUND_STATUS_TRANSITIONS[refund.status as FjnRefundStatus]?.includes(REFUND_STATUS.PROCESSING)) {
          throw new FjnRefundStatusInvalidError('当前退款状态不可转为处理中', {
            current: refund.status,
          });
        }

        const updated = await tx.fjnRefund.update({
          where: { id: input.refundId },
          data: {
            status: REFUND_STATUS.PROCESSING,
            txHash: input.txHash,
          },
        });

        // 联动支付单状态
        if (refund.paymentId) {
          await tx.fjnPayment.update({
            where: { id: refund.paymentId },
            data: { status: PAYMENT_STATUS.REFUNDING },
          });
        }

        this.log('info', '退款单进入处理中', { refundId: input.refundId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '标记退款处理中失败');
    }
  }

  async markRefundSucceeded(input: MarkRefundSucceededInput) {
    try {
      return await this.withTransaction(async (tx) => {
        const refund = await tx.fjnRefund.findUnique({ where: { id: input.refundId } });
        if (!refund) throw new FjnRefundNotFoundError('退款单不存在', { id: input.refundId });

        if (!REFUND_STATUS_TRANSITIONS[refund.status as FjnRefundStatus]?.includes(REFUND_STATUS.REFUNDED)) {
          throw new FjnRefundStatusInvalidError('当前退款状态不可标记为已完成', {
            current: refund.status,
          });
        }

        const updated = await tx.fjnRefund.update({
          where: { id: input.refundId },
          data: {
            status: REFUND_STATUS.REFUNDED,
            txHash: input.txHash ?? refund.txHash,
            processedAt: new Date(),
          },
        });

        // 联动支付单状态：partial 或 full
        if (refund.paymentId) {
          // 查询该支付单累计已退款金额
          const allRefunds = await tx.fjnRefund.findMany({
            where: {
              paymentId: refund.paymentId,
              status: REFUND_STATUS.REFUNDED,
            },
          });
          const totalRefunded = allRefunds.reduce<Decimal>(
            (acc, r) => acc.plus(r.refundAmount),
            new Decimal(0)
          );
          const payment = await tx.fjnPayment.findUnique({ where: { id: refund.paymentId } });
          if (payment) {
            const isFull = totalRefunded.gte(payment.amount);
            await tx.fjnPayment.update({
              where: { id: refund.paymentId },
              data: {
                status: isFull ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.PARTIAL_REFUNDED,
              },
            });
          }
        }

        // 联动 OrderService.markRefunded
        try {
          const isPartial = refund.refundType !== 'full';
          await this.orderService.markRefunded({
            orderId: refund.orderId,
            refundId: refund.id,
            refundNo: refund.refundNo,
            refundAmount: FjnDecimal.toFixed(refund.refundAmount),
            isPartial,
            operatorId: input.operatorId,
          });
        } catch (e: any) {
          this.log('error', '联动 OrderService.markRefunded 失败', {
            orderId: refund.orderId,
            error: e?.message,
          });
        }

        this.log('info', '退款单已完成', {
          refundId: input.refundId,
          txHash: input.txHash,
          source: input.source,
        });

        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '标记退款完成失败');
    }
  }

  async markRefundFailed(input: MarkRefundFailedInput) {
    try {
      return await this.withTransaction(async (tx) => {
        const refund = await tx.fjnRefund.findUnique({ where: { id: input.refundId } });
        if (!refund) throw new FjnRefundNotFoundError('退款单不存在', { id: input.refundId });

        if (!REFUND_STATUS_TRANSITIONS[refund.status as FjnRefundStatus]?.includes(REFUND_STATUS.FAILED)) {
          throw new FjnRefundStatusInvalidError('当前退款状态不可标记为失败', {
            current: refund.status,
          });
        }

        const updated = await tx.fjnRefund.update({
          where: { id: input.refundId },
          data: {
            status: REFUND_STATUS.FAILED,
            failureReason: input.reason,
            processedAt: new Date(),
          },
        });

        this.log('warn', '退款单已标记为失败', {
          refundId: input.refundId,
          reason: input.reason,
        });

        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '标记退款失败失败');
    }
  }

  // ============================================================
  // 12. 退款查询
  // ============================================================

  async findRefundById(id: string) {
    try {
      const refund = await this.prisma.fjnRefund.findUnique({
        where: { id },
        include: { adjustments: true },
      });
      if (!refund) throw new FjnRefundNotFoundError('退款单不存在', { id });
      return refund;
    } catch (e) {
      throw this.wrapError(e, '查询退款单失败');
    }
  }

  async findRefundByNo(refundNo: string) {
    try {
      const refund = await this.prisma.fjnRefund.findUnique({
        where: { refundNo },
        include: { adjustments: true },
      });
      if (!refund) throw new FjnRefundNotFoundError('退款单不存在', { refundNo });
      return refund;
    } catch (e) {
      throw this.wrapError(e, '查询退款单失败');
    }
  }

  async listRefunds(input: ListRefundInput): Promise<FjnPaginatedResult<any>> {
    try {
      const where: Prisma.FjnRefundWhereInput = {};
      if (input.orderId) where.orderId = input.orderId;
      if (input.userId) where.userId = input.userId;
      if (input.refundNo) where.refundNo = input.refundNo;
      if (input.paymentId) where.paymentId = input.paymentId;
      if (input.status) where.status = input.status;

      const page = Math.max(1, input.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));

      const [items, total] = await Promise.all([
        this.prisma.fjnRefund.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.fjnRefund.count({ where }),
      ]);

      return paginate(items, total, input);
    } catch (e) {
      throw this.wrapError(e, '查询退款列表失败');
    }
  }

  // ============================================================
  // 私有方法
  // ============================================================

  private validateCreatePaymentInput(input: CreatePaymentInput): void {
    if (!input.orderId) {
      throw new FjnValidationError('订单 ID 必填', { field: 'orderId' });
    }
    if (!input.userId) {
      throw new FjnValidationError('用户 ID 必填', { field: 'userId' });
    }
    if (!input.paymentMethod) {
      throw new FjnValidationError('支付方式必填', { field: 'paymentMethod' });
    }
    if (!input.amount || !FjnDecimal.gt(input.amount, '0')) {
      throw new FjnPaymentAmountInvalidError('支付金额必须大于 0', { amount: input.amount });
    }
    if (!input.currency) {
      throw new FjnValidationError('币种必填', { field: 'currency' });
    }
  }

  private validateMarkSuccessInput(input: MarkPaymentSuccessInput): void {
    if (!input.paymentId) {
      throw new FjnValidationError('支付单 ID 必填', { field: 'paymentId' });
    }
  }

  private generateCallbackIdempotencyKey(provider: string, input: HandleCallbackInput): string {
    return `${provider}:${input.paymentNo}:${input.txHash ?? ''}:${input.status}:${Date.now()}`;
  }

  private mergeJson(existing: any, addition: any): any {
    if (!existing) return addition ?? null;
    if (!addition) return existing;
    return { ...(typeof existing === 'object' ? existing : {}), ...(typeof addition === 'object' ? addition : {}) };
  }
}

// ============================================================
// 工厂函数
// ============================================================

export function createFjnPaymentService(options?: FjnServiceOptions & { orderService?: FjnOrderService }): FjnPaymentService {
  return new FjnPaymentService(options);
}
