/**
 * FJN Order Service - 订单服务
 *
 * 职责（与 H015 / H020 一致）：
 *  - 订单创建（含商品快照）
 *  - 订单查询（详情/列表）
 *  - 订单状态机（基于白名单转移表）
 *  - 订单取消（含原因记录）
 *  - 订单支付成功处理
 *  - 订单风控冻结
 *  - 订单状态日志
 *  - 订单明细快照（防止商品变更影响历史订单）
 *  - 履约任务预留
 *  - OrderCreated / OrderPaid 事件预留（Outbox 通过 H042 实现）
 *
 * 用法：
 *   import { FjnOrderService } from '@/lib/fjn/services/order-service';
 *   const orderSvc = new FjnOrderService();
 *   const productSvc = new FjnProductService();
 *   const order = await orderSvc.create({ userId, productId, quantity: 1, currency: 'USD' });
 *   await orderSvc.markPaid(order.id, { paymentId, paidAmount: '369', currency: 'USD' });
 *
 * 设计原则：
 *  - 所有状态变更必须经过状态机校验
 *  - 所有状态变更必须写入 FjnOrderStatusLog
 *  - 商品信息必须快照到 FjnOrderItem.benefitsSnapshot
 *  - 库存调整与订单创建必须在同一事务中
 *  - 支付成功后才生成履约任务（H020 §20 + 工业级补强）
 */

import type { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import { FjnProductService } from './product-service';
import { FjnDecimal, decimalAdd, decimalSub, decimalMul, decimalEq, decimalGt, decimalToFixed } from '../decimal';
import {
  FjnValidationError,
  FjnNotFoundError,
  FjnConflictError,
  FjnBusinessRuleError,
  FjnKycRequiredError,
  FjnRegionRestrictedError,
} from '../errors';
import { FjnBusinessNoGenerator, FjnPaginatedResult, FjnPaginationInput, paginate } from '../types';
import {
  FJN_DEFAULT_COUNTRY,
  FJN_DEFAULT_CURRENCY,
  FJN_PRODUCT_STATUS as ProductStatus,
} from '../constants';
import {
  ORDER_STATUS,
  ORDER_STATUS_TRANSITIONS,
  ORDER_PAYMENT_STATUS,
  ORDER_REFUND_STATUS,
  ORDER_RISK_STATUS,
  ORDER_TYPES,
  type FjnOrderStatus,
  type FjnOrderPaymentStatus,
  type FjnOrderRefundStatus,
  type FjnOrderRiskStatus,
  type FjnOrderType,
} from './order-state-machine';
import { ORDER_EVENT_SOURCES } from './order-events';
import {
  FjnOrderNotFoundError,
  FjnOrderStatusInvalidError,
  FjnProductNotActiveError,
  FjnStockInsufficientError,
  FjnOrderAmountInvalidError,
  FjnOrderRegionBlockedError,
  ORDER_ERROR_CODES,
} from './order-errors';

// ============================================================
// DTOs
// ============================================================

export interface CreateOrderInput {
  /** 用户 ID */
  userId: string;
  /** 商品 ID */
  productId: string;
  /** 数量（默认 1） */
  quantity?: number;
  /** 币种（默认 USD） */
  currency?: string;
  /** 国家代码（默认 CN） */
  countryCode?: string;
  /** 推荐人 ID */
  referrerId?: string;
  /** 推荐码 */
  referralCode?: string;
  /** 收货地址 */
  shippingAddress?: Prisma.InputJsonValue;
  /** 账单地址 */
  billingAddress?: Prisma.InputJsonValue;
  /** 联系人姓名 */
  contactName?: string;
  /** 联系人电话 */
  contactPhone?: string;
  /** 联系人邮箱 */
  contactEmail?: string;
  /** 备注 */
  remark?: string;
  /** 幂等键 */
  idempotencyKey?: string;
  /** 元数据 */
  metadata?: Prisma.InputJsonValue;
  /** 操作人 */
  operatorId?: string;
}

export interface ListOrderInput extends FjnPaginationInput {
  userId?: string;
  orderNo?: string;
  orderType?: FjnOrderType;
  status?: FjnOrderStatus;
  paymentStatus?: FjnOrderPaymentStatus;
  refundStatus?: FjnOrderRefundStatus;
  riskStatus?: FjnOrderRiskStatus;
  productId?: string;
  productType?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'createdAt' | 'paidAt' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}

export interface CancelOrderInput {
  orderId: string;
  reason: string;
  operatorId?: string;
  operatorType?: 'user' | 'admin' | 'system' | 'cron';
  metadata?: Prisma.InputJsonValue;
}

export interface MarkOrderPaidInput {
  orderId: string;
  paymentId: string;
  paymentNo: string;
  paidAmount: string;
  currency: string;
  txHash?: string;
  operatorId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface RiskHoldOrderInput {
  orderId: string;
  reason: string;
  riskScore?: number;
  riskLevel?: string;
  operatorId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface ConfirmOrderInput {
  orderId: string;
  operatorId?: string;
  operatorType?: 'admin' | 'system' | 'cron';
  metadata?: Prisma.InputJsonValue;
}

export interface StartFulfillingInput {
  orderId: string;
  fulfillmentType: 'physical_wine' | 'digital_rights' | 'nft_mint' | 'points_issue';
  operatorId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface FulfillmentDoneInput {
  orderId: string;
  taskId: string;
  operatorId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface CompleteOrderInput {
  orderId: string;
  operatorId?: string;
  operatorType?: 'admin' | 'system' | 'cron';
  metadata?: Prisma.InputJsonValue;
}

export interface RequestRefundInput {
  orderId: string;
  reason: string;
  refundAmount?: string;
  operatorId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface MarkRefundedInput {
  orderId: string;
  refundId: string;
  refundNo: string;
  refundAmount: string;
  isPartial: boolean;
  operatorId?: string;
  metadata?: Prisma.InputJsonValue;
}

// ============================================================
// Order Service 实现
// ============================================================

export class FjnOrderService extends FjnServiceBase {
  private readonly productService: FjnProductService;

  constructor(options?: FjnServiceOptions & { productService?: FjnProductService }) {
    super({ ...options, serviceName: options?.serviceName ?? 'FjnOrderService' });
    this.productService = options?.productService ?? new FjnProductService({
      prisma: this.prisma,
    });
  }

  // ============================================================
  // 1. 创建订单
  // ============================================================

  /**
   * 创建订单
   *
   * 流程：
   *  1. 校验输入
   *  2. 查询商品（active 状态、库存、地区限制）
   *  3. 锁定库存（同事务）
   *  4. 计算金额（单价 × 数量 + 税）
   *  5. 写入订单主表 + 订单明细（含权益快照）
   *  6. 写入初始状态日志
   *  7. 抛出 OrderCreated 事件（内存层；H042 阶段改为 outbox）
   */
  async create(input: CreateOrderInput) {
    try {
      this.validateCreateInput(input);

      return await this.withTransaction(async (tx) => {
        // 1. 查询商品（含权益、地区规则）
        const product = await tx.fjnProduct.findUnique({
          where: { id: input.productId },
          include: {
            benefits: true,
            regionRules: true,
          },
        });
        if (!product || product.deletedAt) {
          throw new FjnNotFoundError('商品不存在', { productId: input.productId });
        }
        if (product.status !== ProductStatus.ACTIVE) {
          throw new FjnProductNotActiveError('商品未上架', {
            productId: input.productId,
            status: product.status,
          });
        }

        // 2. 校验地区
        const countryCode = input.countryCode ?? FJN_DEFAULT_COUNTRY;
        if (product.blockedRegions && product.blockedRegions.length > 0
          && product.blockedRegions.includes(countryCode)) {
          throw new FjnOrderRegionBlockedError('当前地区禁止购买', {
            productId: input.productId,
            countryCode,
          });
        }
        if (product.allowedRegions && product.allowedRegions.length > 0
          && !product.allowedRegions.includes(countryCode)) {
          throw new FjnOrderRegionBlockedError('当前地区不在白名单', {
            productId: input.productId,
            countryCode,
          });
        }

        // 3. 校验币种
        const currency = input.currency ?? product.currency ?? FJN_DEFAULT_CURRENCY;
        if (currency !== product.currency) {
          throw new FjnValidationError('订单币种与商品币种不一致', {
            orderCurrency: currency,
            productCurrency: product.currency,
          });
        }

        // 4. 校验数量 + 库存
        const quantity = input.quantity ?? 1;
        if (quantity < 1 || !Number.isInteger(quantity)) {
          throw new FjnValidationError('数量必须为正整数', { quantity });
        }
        if (product.stock < quantity) {
          throw new FjnStockInsufficientError('库存不足', {
            productId: input.productId,
            available: product.stock,
            requested: quantity,
          });
        }

        // 5. 锁定库存（事务内）
        const newStock = product.stock - quantity;
        await tx.fjnProduct.update({
          where: { id: input.productId },
          data: { stock: newStock },
        });
        await tx.fjnProductInventoryLog.create({
          data: {
            productId: input.productId,
            changeType: 'sale',
            changeQty: -quantity,
            beforeStock: product.stock,
            afterStock: newStock,
            remark: `订单锁定库存`,
            operatorId: input.operatorId,
          },
        });
        if (newStock === 0) {
          await tx.fjnProduct.update({
            where: { id: input.productId },
            data: { status: ProductStatus.SOLD_OUT },
          });
        }

        // 6. 计算金额
        const unitPrice = FjnDecimal.toFixed(product.price);
        const subtotal = FjnDecimal.toFixed(FjnDecimal.mul(unitPrice, quantity));
        const taxAmount = FjnDecimal.toFixed('0'); // 税额由 tax service 计算（H022）
        const totalAmount = FjnDecimal.toFixed(FjnDecimal.add(subtotal, taxAmount));

        // 7. 业务编号
        const count = await tx.fjnOrder.count();
        const orderNo = FjnBusinessNoGenerator.orderNo(count + 1);

        // 8. 写入订单主表
        const order = await tx.fjnOrder.create({
          data: {
            orderNo,
            userId: input.userId,
            orderType: this.mapProductTypeToOrderType(product.productType),
            status: ORDER_STATUS.PENDING_PAYMENT,
            subtotalAmount: subtotal,
            discountAmount: '0',
            taxAmount,
            shippingAmount: '0',
            totalAmount,
            paidAmount: '0',
            currency,
            referrerId: input.referrerId,
            referralCode: input.referralCode,
            countryCode,
            shippingAddress: input.shippingAddress as any,
            billingAddress: input.billingAddress as any,
            contactName: input.contactName,
            contactPhone: input.contactPhone,
            contactEmail: input.contactEmail,
            remark: input.remark,
            metadata: input.metadata as any,
            riskScore: 0,
            riskLevel: 'low',
          },
        });

        // 9. 写入订单明细（含权益快照）
        await tx.fjnOrderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            productName: product.name,
            productType: product.productType,
            unitPrice,
            quantity,
            subtotal,
            taxAmount,
            total: subtotal,
            benefitsSnapshot: this.snapshotBenefits(product.benefits) as any,
          },
        });

        // 10. 写入初始状态日志
        await tx.fjnOrderStatusLog.create({
          data: {
            orderId: order.id,
            fromStatus: null,
            toStatus: ORDER_STATUS.PENDING_PAYMENT,
            reason: '订单创建',
            operatorId: input.operatorId,
            operatorType: input.operatorId ? ORDER_EVENT_SOURCES.USER : ORDER_EVENT_SOURCES.SYSTEM,
          },
        });

        this.log('info', '订单创建成功', {
          orderId: order.id,
          orderNo,
          productId: product.id,
          userId: input.userId,
          totalAmount,
        });

        return order;
      });
    } catch (e) {
      throw this.wrapError(e, '创建订单失败');
    }
  }

  // ============================================================
  // 2. 查询
  // ============================================================

  async findById(id: string, options?: { include?: Prisma.FjnOrderInclude }) {
    try {
      const order = await this.prisma.fjnOrder.findUnique({
        where: { id },
        include: options?.include ?? {
          items: true,
          statusLogs: { orderBy: { createdAt: 'desc' } },
          payments: { orderBy: { createdAt: 'desc' } },
          refunds: { orderBy: { createdAt: 'desc' } },
          fulfillments: true,
        },
      });
      if (!order) {
        throw new FjnOrderNotFoundError('订单不存在', { id });
      }
      return order;
    } catch (e) {
      throw this.wrapError(e, '查询订单失败');
    }
  }

  async findByOrderNo(orderNo: string) {
    try {
      const order = await this.prisma.fjnOrder.findUnique({
        where: { orderNo },
        include: {
          items: true,
          statusLogs: { orderBy: { createdAt: 'desc' } },
        },
      });
      if (!order) {
        throw new FjnOrderNotFoundError('订单不存在', { orderNo });
      }
      return order;
    } catch (e) {
      throw this.wrapError(e, '查询订单失败');
    }
  }

  async list(input: ListOrderInput): Promise<FjnPaginatedResult<any>> {
    try {
      const where: Prisma.FjnOrderWhereInput = { deletedAt: null };
      if (input.userId) where.userId = input.userId;
      if (input.orderNo) where.orderNo = input.orderNo;
      if (input.orderType) where.orderType = input.orderType;
      if (input.status) where.status = input.status;
      if (input.paymentStatus) where.payments = { some: { status: input.paymentStatus } };
      if (input.refundStatus) where.refunds = { some: { status: input.refundStatus } };
      if (input.riskStatus) where.riskLevel = input.riskStatus;
      if (input.productId) where.items = { some: { productId: input.productId } };
      if (input.productType) where.items = { some: { productType: input.productType } };
      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) (where.createdAt as any).gte = input.startDate;
        if (input.endDate) (where.createdAt as any).lte = input.endDate;
      }

      const orderBy: Prisma.FjnOrderOrderByWithRelationInput = input.sortBy
        ? { [input.sortBy]: input.sortOrder ?? 'desc' }
        : { createdAt: 'desc' };

      const page = Math.max(1, input.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));

      const [items, total] = await Promise.all([
        this.prisma.fjnOrder.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            items: true,
          },
        }),
        this.prisma.fjnOrder.count({ where }),
      ]);

      return paginate(items, total, input);
    } catch (e) {
      throw this.wrapError(e, '查询订单列表失败');
    }
  }

  // ============================================================
  // 3. 取消订单
  // ============================================================

  async cancel(input: CancelOrderInput) {
    try {
      this.validateCancelInput(input);

      return await this.withTransaction(async (tx) => {
        const order = await tx.fjnOrder.findUnique({
          where: { id: input.orderId },
          include: { items: true },
        });
        if (!order) throw new FjnOrderNotFoundError('订单不存在', { id: input.orderId });
        if (order.deletedAt) throw new FjnValidationError('订单已删除', { id: input.orderId });

        // 状态机校验
        if (!ORDER_STATUS_TRANSITIONS[order.status as FjnOrderStatus]?.includes(ORDER_STATUS.CANCELLED)) {
          throw new FjnOrderStatusInvalidError('当前订单状态不可取消', {
            current: order.status,
            allowed: ORDER_STATUS_TRANSITIONS[order.status as FjnOrderStatus] ?? [],
          });
        }

        // 释放库存（仅在锁定了库存的状态）
        if (this.shouldReleaseStock(order.status as FjnOrderStatus)) {
          for (const item of order.items) {
            const product = await tx.fjnProduct.findUnique({ where: { id: item.productId } });
            if (!product) continue;
            const newStock = product.stock + item.quantity;
            await tx.fjnProduct.update({
              where: { id: item.productId },
              data: {
                stock: newStock,
                soldCount: Math.max(0, product.soldCount - item.quantity),
                // 如果之前被标记为 sold_out，恢复为 active
                status: product.status === ProductStatus.SOLD_OUT ? ProductStatus.ACTIVE : product.status,
              },
            });
            await tx.fjnProductInventoryLog.create({
              data: {
                productId: item.productId,
                changeType: 'return',
                changeQty: item.quantity,
                beforeStock: product.stock,
                afterStock: newStock,
                remark: `订单取消释放库存: ${order.orderNo}`,
                operatorId: input.operatorId,
              },
            });
          }
        }

        // 更新订单状态
        const updated = await tx.fjnOrder.update({
          where: { id: input.orderId },
          data: {
            status: ORDER_STATUS.CANCELLED,
            cancelledAt: new Date(),
            metadata: this.mergeMetadata(order.metadata, input.metadata),
          },
        });

        // 写入状态日志
        await tx.fjnOrderStatusLog.create({
          data: {
            orderId: input.orderId,
            fromStatus: order.status,
            toStatus: ORDER_STATUS.CANCELLED,
            reason: input.reason,
            operatorId: input.operatorId,
            operatorType: input.operatorType ?? (input.operatorId ? ORDER_EVENT_SOURCES.USER : ORDER_EVENT_SOURCES.SYSTEM),
          },
        });

        this.log('info', '订单已取消', {
          orderId: input.orderId,
          fromStatus: order.status,
          reason: input.reason,
        });

        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '取消订单失败');
    }
  }

  // ============================================================
  // 4. 标记支付成功
  // ============================================================

  async markPaid(input: MarkOrderPaidInput) {
    try {
      this.validateMarkPaidInput(input);

      return await this.withTransaction(async (tx) => {
        const order = await tx.fjnOrder.findUnique({ where: { id: input.orderId } });
        if (!order) throw new FjnOrderNotFoundError('订单不存在', { id: input.orderId });
        if (order.deletedAt) throw new FjnValidationError('订单已删除', { id: input.orderId });

        // 幂等检查：已支付
        if (order.status === ORDER_STATUS.PAID) {
          this.log('info', '订单已是支付状态（幂等）', { orderId: input.orderId });
          return order;
        }

        // 状态机校验
        if (!ORDER_STATUS_TRANSITIONS[order.status as FjnOrderStatus]?.includes(ORDER_STATUS.PAID)) {
          throw new FjnOrderStatusInvalidError('当前订单状态不可标记为已支付', {
            current: order.status,
            allowed: ORDER_STATUS_TRANSITIONS[order.status as FjnOrderStatus] ?? [],
          });
        }

        // 金额校验
        if (FjnDecimal.lt(input.paidAmount, order.totalAmount.toString())) {
          throw new FjnOrderAmountInvalidError('支付金额不足', {
            paid: input.paidAmount,
            required: order.totalAmount.toString(),
          });
        }
        if (input.currency !== order.currency) {
          throw new FjnValidationError('支付币种与订单币种不一致', {
            paid: input.currency,
            order: order.currency,
          });
        }

        // 更新订单
        const updated = await tx.fjnOrder.update({
          where: { id: input.orderId },
          data: {
            status: ORDER_STATUS.PAID,
            paidAmount: input.paidAmount,
            paidAt: new Date(),
            metadata: this.mergeMetadata(order.metadata, {
              ...(input.metadata as any ?? {}),
              paymentId: input.paymentId,
              paymentNo: input.paymentNo,
              txHash: input.txHash,
            }),
          },
        });

        // 写入状态日志
        await tx.fjnOrderStatusLog.create({
          data: {
            orderId: input.orderId,
            fromStatus: order.status,
            toStatus: ORDER_STATUS.PAID,
            reason: `支付成功: ${input.paymentNo}`,
            operatorId: input.operatorId,
            operatorType: ORDER_EVENT_SOURCES.PAYMENT,
          },
        });

        // 增加商品销量
        const items = await tx.fjnOrderItem.findMany({ where: { orderId: input.orderId } });
        for (const item of items) {
          await tx.fjnProduct.update({
            where: { id: item.productId },
            data: { soldCount: { increment: item.quantity } },
          });
        }

        this.log('info', '订单已标记为已支付', {
          orderId: input.orderId,
          paidAmount: input.paidAmount,
          paymentId: input.paymentId,
        });

        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '标记支付成功失败');
    }
  }

  // ============================================================
  // 5. 风控冻结
  // ============================================================

  async riskHold(input: RiskHoldOrderInput) {
    try {
      this.validateRiskHoldInput(input);

      return await this.withTransaction(async (tx) => {
        const order = await tx.fjnOrder.findUnique({ where: { id: input.orderId } });
        if (!order) throw new FjnOrderNotFoundError('订单不存在', { id: input.orderId });

        if (!ORDER_STATUS_TRANSITIONS[order.status as FjnOrderStatus]?.includes(ORDER_STATUS.RISK_HOLD)) {
          throw new FjnOrderStatusInvalidError('当前订单状态不可冻结', {
            current: order.status,
            allowed: ORDER_STATUS_TRANSITIONS[order.status as FjnOrderStatus] ?? [],
          });
        }

        const updated = await tx.fjnOrder.update({
          where: { id: input.orderId },
          data: {
            status: ORDER_STATUS.RISK_HOLD,
            riskScore: input.riskScore ?? order.riskScore,
            riskLevel: input.riskLevel ?? order.riskLevel,
            metadata: this.mergeMetadata(order.metadata, input.metadata),
          },
        });

        await tx.fjnOrderStatusLog.create({
          data: {
            orderId: input.orderId,
            fromStatus: order.status,
            toStatus: ORDER_STATUS.RISK_HOLD,
            reason: input.reason,
            operatorId: input.operatorId,
            operatorType: ORDER_EVENT_SOURCES.RISK,
          },
        });

        this.log('warn', '订单已被风控冻结', {
          orderId: input.orderId,
          reason: input.reason,
          riskScore: input.riskScore,
        });

        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '风控冻结订单失败');
    }
  }

  // ============================================================
  // 6. 确认订单（已支付后或风控解除后）
  // ============================================================

  async confirm(input: ConfirmOrderInput) {
    try {
      return await this.withTransaction(async (tx) => {
        const order = await tx.fjnOrder.findUnique({ where: { id: input.orderId } });
        if (!order) throw new FjnOrderNotFoundError('订单不存在', { id: input.orderId });

        if (!ORDER_STATUS_TRANSITIONS[order.status as FjnOrderStatus]?.includes(ORDER_STATUS.CONFIRMED)) {
          throw new FjnOrderStatusInvalidError('当前订单状态不可确认', {
            current: order.status,
            allowed: ORDER_STATUS_TRANSITIONS[order.status as FjnOrderStatus] ?? [],
          });
        }

        const updated = await tx.fjnOrder.update({
          where: { id: input.orderId },
          data: {
            status: ORDER_STATUS.CONFIRMED,
            confirmedAt: new Date(),
          },
        });

        await tx.fjnOrderStatusLog.create({
          data: {
            orderId: input.orderId,
            fromStatus: order.status,
            toStatus: ORDER_STATUS.CONFIRMED,
            reason: '订单已确认',
            operatorId: input.operatorId,
            operatorType: input.operatorType ?? ORDER_EVENT_SOURCES.SYSTEM,
          },
        });

        this.log('info', '订单已确认', { orderId: input.orderId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '确认订单失败');
    }
  }

  // ============================================================
  // 7. 开始履约（生成履约任务）
  // ============================================================

  async startFulfilling(input: StartFulfillingInput) {
    try {
      return await this.withTransaction(async (tx) => {
        const order = await tx.fjnOrder.findUnique({ where: { id: input.orderId } });
        if (!order) throw new FjnOrderNotFoundError('订单不存在', { id: input.orderId });

        // 仅 confirmed/processing 可进入 fulfilling
        const startFulfillingAllowed: readonly FjnOrderStatus[] = [
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.PROCESSING,
        ];
        if (!startFulfillingAllowed.includes(order.status as FjnOrderStatus)) {
          throw new FjnOrderStatusInvalidError('当前订单状态不可开始履约', {
            current: order.status,
            allowed: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING],
          });
        }

        // 创建履约任务
        const count = await tx.fjnFulfillmentTask.count();
        const taskNo = `FCT${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(count + 1).padStart(6, '0')}`;
        const task = await tx.fjnFulfillmentTask.create({
          data: {
            taskNo,
            orderId: input.orderId,
            fulfillmentType: input.fulfillmentType,
            status: 'pending',
            // schema 中 FjnFulfillmentTask 没有 metadata 字段，存到 contactInfo (JsonB)
            ...(input.metadata !== undefined
              ? { contactInfo: input.metadata as Prisma.InputJsonValue }
              : {}),
          },
        });

        // 同时写入对应的履约明细
        const items = await tx.fjnOrderItem.findMany({ where: { orderId: input.orderId } });
        for (const item of items) {
          // 解析权益快照，决定履约内容
          const benefits = (item.benefitsSnapshot as any) ?? [];
          if (Array.isArray(benefits) && benefits.length > 0) {
            for (const benefit of benefits) {
              await tx.fjnFulfillmentItem.create({
                data: {
                  taskId: task.id,
                  benefitType: benefit.benefitType ?? 'unknown',
                  benefitRef: benefit.benefitRef ?? null,
                  quantity: FjnDecimal.toFixed(benefit.amount ?? item.quantity),
                  status: 'pending',
                  payload: benefit as any,
                },
              });
            }
          } else {
            // 兜底：以订单明细数量生成履约项
            await tx.fjnFulfillmentItem.create({
              data: {
                taskId: task.id,
                benefitType: input.fulfillmentType,
                quantity: FjnDecimal.toFixed(item.quantity),
                status: 'pending',
              },
            });
          }
        }

        // 更新订单状态
        const updated = await tx.fjnOrder.update({
          where: { id: input.orderId },
          data: { status: ORDER_STATUS.FULFILLING },
        });

        await tx.fjnOrderStatusLog.create({
          data: {
            orderId: input.orderId,
            fromStatus: order.status,
            toStatus: ORDER_STATUS.FULFILLING,
            reason: `开始履约: ${taskNo}`,
            operatorId: input.operatorId,
            operatorType: ORDER_EVENT_SOURCES.FULFILLMENT,
          },
        });

        this.log('info', '订单开始履约', {
          orderId: input.orderId,
          taskId: task.id,
          taskNo,
          fulfillmentType: input.fulfillmentType,
        });

        return { order: updated, task };
      });
    } catch (e) {
      throw this.wrapError(e, '开始履约失败');
    }
  }

  // ============================================================
  // 8. 履约完成
  // ============================================================

  async markFulfilled(input: FulfillmentDoneInput) {
    try {
      return await this.withTransaction(async (tx) => {
        const order = await tx.fjnOrder.findUnique({ where: { id: input.orderId } });
        if (!order) throw new FjnOrderNotFoundError('订单不存在', { id: input.orderId });

        if (order.status !== ORDER_STATUS.FULFILLING) {
          throw new FjnOrderStatusInvalidError('订单未处于履约中状态', {
            current: order.status,
            expected: ORDER_STATUS.FULFILLING,
          });
        }

        // 更新履约任务
        await tx.fjnFulfillmentTask.update({
          where: { id: input.taskId },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        });

        // 更新订单
        const updated = await tx.fjnOrder.update({
          where: { id: input.orderId },
          data: {
            status: ORDER_STATUS.FULFILLED,
            fulfilledAt: new Date(),
          },
        });

        await tx.fjnOrderStatusLog.create({
          data: {
            orderId: input.orderId,
            fromStatus: order.status,
            toStatus: ORDER_STATUS.FULFILLED,
            reason: '履约完成',
            operatorId: input.operatorId,
            operatorType: ORDER_EVENT_SOURCES.FULFILLMENT,
          },
        });

        this.log('info', '订单履约完成', { orderId: input.orderId, taskId: input.taskId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '履约完成失败');
    }
  }

  // ============================================================
  // 9. 完成订单（用户确认收货后）
  // ============================================================

  async complete(input: CompleteOrderInput) {
    try {
      return await this.withTransaction(async (tx) => {
        const order = await tx.fjnOrder.findUnique({ where: { id: input.orderId } });
        if (!order) throw new FjnOrderNotFoundError('订单不存在', { id: input.orderId });

        if (!ORDER_STATUS_TRANSITIONS[order.status as FjnOrderStatus]?.includes(ORDER_STATUS.COMPLETED)) {
          throw new FjnOrderStatusInvalidError('当前订单状态不可完成', {
            current: order.status,
            allowed: ORDER_STATUS_TRANSITIONS[order.status as FjnOrderStatus] ?? [],
          });
        }

        const updated = await tx.fjnOrder.update({
          where: { id: input.orderId },
          data: {
            status: ORDER_STATUS.COMPLETED,
            completedAt: new Date(),
          },
        });

        await tx.fjnOrderStatusLog.create({
          data: {
            orderId: input.orderId,
            fromStatus: order.status,
            toStatus: ORDER_STATUS.COMPLETED,
            reason: '订单完成',
            operatorId: input.operatorId,
            operatorType: input.operatorType ?? ORDER_EVENT_SOURCES.SYSTEM,
          },
        });

        this.log('info', '订单已完成', { orderId: input.orderId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '完成订单失败');
    }
  }

  // ============================================================
  // 10. 申请退款
  // ============================================================

  async requestRefund(input: RequestRefundInput) {
    try {
      if (!input.reason || input.reason.trim().length === 0) {
        throw new FjnValidationError('退款原因必填', { orderId: input.orderId });
      }

      return await this.withTransaction(async (tx) => {
        const order = await tx.fjnOrder.findUnique({ where: { id: input.orderId } });
        if (!order) throw new FjnOrderNotFoundError('订单不存在', { id: input.orderId });

        if (!ORDER_STATUS_TRANSITIONS[order.status as FjnOrderStatus]?.includes(ORDER_STATUS.REFUND_REQUESTED)) {
          throw new FjnOrderStatusInvalidError('当前订单状态不可申请退款', {
            current: order.status,
            allowed: ORDER_STATUS_TRANSITIONS[order.status as FjnOrderStatus] ?? [],
          });
        }

        // 退款金额校验
        if (input.refundAmount) {
          if (FjnDecimal.lt(input.refundAmount, '0')
            || FjnDecimal.gt(input.refundAmount, order.paidAmount.toString())) {
            throw new FjnValidationError('退款金额非法', {
              requested: input.refundAmount,
              paid: order.paidAmount.toString(),
            });
          }
        }

        const updated = await tx.fjnOrder.update({
          where: { id: input.orderId },
          data: {
            status: ORDER_STATUS.REFUND_REQUESTED,
            metadata: this.mergeMetadata(order.metadata, {
              ...(input.metadata as any ?? {}),
              refundReason: input.reason,
              refundAmount: input.refundAmount,
            }),
          },
        });

        await tx.fjnOrderStatusLog.create({
          data: {
            orderId: input.orderId,
            fromStatus: order.status,
            toStatus: ORDER_STATUS.REFUND_REQUESTED,
            reason: input.reason,
            operatorId: input.operatorId,
            operatorType: input.operatorId ? ORDER_EVENT_SOURCES.USER : ORDER_EVENT_SOURCES.SYSTEM,
          },
        });

        this.log('info', '订单退款已申请', {
          orderId: input.orderId,
          reason: input.reason,
          refundAmount: input.refundAmount,
        });

        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '申请退款失败');
    }
  }

  // ============================================================
  // 11. 标记退款成功
  // ============================================================

  async markRefunded(input: MarkRefundedInput) {
    try {
      return await this.withTransaction(async (tx) => {
        const order = await tx.fjnOrder.findUnique({ where: { id: input.orderId } });
        if (!order) throw new FjnOrderNotFoundError('订单不存在', { id: input.orderId });

        const targetStatus = input.isPartial
          ? ORDER_STATUS.PARTIAL_REFUNDED
          : ORDER_STATUS.REFUNDED;

        if (!ORDER_STATUS_TRANSITIONS[order.status as FjnOrderStatus]?.includes(targetStatus)) {
          throw new FjnOrderStatusInvalidError('当前订单状态不可标记为已退款', {
            current: order.status,
            target: targetStatus,
            allowed: ORDER_STATUS_TRANSITIONS[order.status as FjnOrderStatus] ?? [],
          });
        }

        const updated = await tx.fjnOrder.update({
          where: { id: input.orderId },
          data: {
            status: targetStatus,
            refundedAt: new Date(),
            metadata: this.mergeMetadata(order.metadata, {
              ...(input.metadata as any ?? {}),
              refundId: input.refundId,
              refundNo: input.refundNo,
              refundAmount: input.refundAmount,
            }),
          },
        });

        await tx.fjnOrderStatusLog.create({
          data: {
            orderId: input.orderId,
            fromStatus: order.status,
            toStatus: targetStatus,
            reason: `退款成功: ${input.refundNo}`,
            operatorId: input.operatorId,
            operatorType: ORDER_EVENT_SOURCES.SYSTEM,
          },
        });

        this.log('info', '订单已标记为已退款', {
          orderId: input.orderId,
          refundId: input.refundId,
          isPartial: input.isPartial,
          refundAmount: input.refundAmount,
        });

        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '标记退款成功失败');
    }
  }

  // ============================================================
  // 12. 订单过期（cron 调用）
  // ============================================================

  async expire(orderId: string, reason: string = '订单超时', operatorId?: string) {
    try {
      return await this.withTransaction(async (tx) => {
        const order = await tx.fjnOrder.findUnique({ where: { id: orderId } });
        if (!order) throw new FjnOrderNotFoundError('订单不存在', { orderId });

        if (!ORDER_STATUS_TRANSITIONS[order.status as FjnOrderStatus]?.includes(ORDER_STATUS.EXPIRED)) {
          this.log('info', '订单不可过期，跳过', {
            orderId,
            current: order.status,
          });
          return order;
        }

        const updated = await tx.fjnOrder.update({
          where: { id: orderId },
          data: { status: ORDER_STATUS.EXPIRED },
        });

        await tx.fjnOrderStatusLog.create({
          data: {
            orderId,
            fromStatus: order.status,
            toStatus: ORDER_STATUS.EXPIRED,
            reason,
            operatorId,
            operatorType: ORDER_EVENT_SOURCES.CRON,
          },
        });

        this.log('info', '订单已过期', { orderId, reason });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '订单过期失败');
    }
  }

  // ============================================================
  // 私有方法
  // ============================================================

  private validateCreateInput(input: CreateOrderInput): void {
    if (!input.userId) {
      throw new FjnValidationError('用户 ID 必填', { field: 'userId' });
    }
    if (!input.productId) {
      throw new FjnValidationError('商品 ID 必填', { field: 'productId' });
    }
  }

  private validateCancelInput(input: CancelOrderInput): void {
    if (!input.orderId) {
      throw new FjnValidationError('订单 ID 必填', { field: 'orderId' });
    }
    if (!input.reason || input.reason.trim().length === 0) {
      throw new FjnValidationError('取消原因必填', { field: 'reason' });
    }
  }

  private validateMarkPaidInput(input: MarkOrderPaidInput): void {
    if (!input.orderId) {
      throw new FjnValidationError('订单 ID 必填', { field: 'orderId' });
    }
    if (!input.paymentId) {
      throw new FjnValidationError('支付单 ID 必填', { field: 'paymentId' });
    }
    if (!input.paymentNo) {
      throw new FjnValidationError('支付单号必填', { field: 'paymentNo' });
    }
    if (!input.paidAmount || FjnDecimal.lte(input.paidAmount, '0')) {
      throw new FjnValidationError('支付金额必须大于 0', { paidAmount: input.paidAmount });
    }
    if (!input.currency) {
      throw new FjnValidationError('币种必填', { field: 'currency' });
    }
  }

  private validateRiskHoldInput(input: RiskHoldOrderInput): void {
    if (!input.orderId) {
      throw new FjnValidationError('订单 ID 必填', { field: 'orderId' });
    }
    if (!input.reason || input.reason.trim().length === 0) {
      throw new FjnValidationError('风控原因必填', { field: 'reason' });
    }
  }

  private mapProductTypeToOrderType(productType: string): FjnOrderType {
    const map: Record<string, FjnOrderType> = {
      wine_369: ORDER_TYPES.WINE_ORDER,
      aep_1: ORDER_TYPES.AEP_ORDER,
      aep_2: ORDER_TYPES.AEP_ORDER,
      aep_3: ORDER_TYPES.AEP_ORDER,
      aep_4: ORDER_TYPES.AEP_ORDER,
      aep_5: ORDER_TYPES.AEP_ORDER,
      mall_goods: ORDER_TYPES.MALL_ORDER,
      nft_upgrade: ORDER_TYPES.NFT_UPGRADE,
      ai_package: ORDER_TYPES.AI_SERVICE,
      virtual_points: ORDER_TYPES.VIRTUAL_POINTS,
      corporate: ORDER_TYPES.CORPORATE_SERVICE,
      event_ticket: ORDER_TYPES.EVENT_TICKET,
    };
    return map[productType] ?? ORDER_TYPES.WINE_ORDER;
  }

  private shouldReleaseStock(status: FjnOrderStatus): boolean {
    const stockHoldingStatuses: readonly FjnOrderStatus[] = [
      ORDER_STATUS.PENDING_PAYMENT,
      ORDER_STATUS.PAYMENT_PROCESSING,
      ORDER_STATUS.PAID,
      ORDER_STATUS.RISK_CHECKING,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PROCESSING,
    ];
    return stockHoldingStatuses.includes(status);
  }

  private snapshotBenefits(benefits: any[]): unknown {
    return (benefits ?? []).map(b => ({
      benefitType: b.benefitType,
      amount: FjnDecimal.toFixed(b.amount ?? '0'),
      description: b.description,
      config: b.config,
    }));
  }

  private mergeMetadata(existing: any, addition: any): any {
    if (!existing) return addition ?? {};
    if (!addition) return existing;
    return { ...(typeof existing === 'object' ? existing : {}), ...(typeof addition === 'object' ? addition : {}) };
  }
}

// ============================================================
// 工厂函数
// ============================================================

export function createFjnOrderService(options?: FjnServiceOptions & { productService?: FjnProductService }): FjnOrderService {
  return new FjnOrderService(options);
}
