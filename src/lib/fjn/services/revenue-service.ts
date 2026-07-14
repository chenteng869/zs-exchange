/**
 * FJN Revenue Service - 收入分配服务
 *
 * 职责（与 H015 / H022 一致）：
 *  - 接收 OrderPaid / PaymentSucceeded 事件触发分账
 *  - 按规则（默认 40/30/30）计算分账明细
 *  - 分账状态机（pending → calculated → risk_checking → approved → settled → reversed）
 *  - 退款时生成冲销记录（负数），不删除原记录
 *  - 池汇总统计
 *  - 6 类 outbox 事件
 *
 * 用法：
 *   import { FjnRevenueService } from '@/lib/fjn/services/revenue-service';
 *   const revenueSvc = new FjnRevenueService();
 *   const allocation = await revenueSvc.createAllocation({ orderId, userId, paidAmount, ... });
 *   await revenueSvc.approve(allocation.id, { reviewerId: 'admin_001' });
 *
 * 设计原则：
 *  - 订单级防重复：每个订单只能有一条主分账（schema orderId @unique）
 *  - 状态变更必须经过状态机校验
 *  - 所有写操作必须在 Prisma 事务中
 *  - 冲销必须基于已存在的主分账
 *  - 规则版本化（ruleCode + ruleVersion）
 */

import type { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import { FjnDecimal, decimalMul, decimalSub, decimalToFixed, decimalEq, decimalGt, decimalGte, decimalSum } from '../decimal';
import {
  FjnValidationError,
  FjnNotFoundError,
  FjnConflictError,
  FjnBusinessRuleError,
} from '../errors';
import { FjnBusinessNoGenerator, FjnPaginatedResult, FjnPaginationInput, paginate } from '../types';
import { FJN_DEFAULT_CURRENCY } from '../constants';
import {
  ALLOCATION_STATUS,
  REVERSAL_STATUS,
  WINE_369_REVENUE_RULE,
  type FjnAllocationStatus,
  type FjnReversalStatus,
  type FjnRevenuePoolType,
  assertTransitAllocationStatus,
  assertTransitReversalStatus,
  canTransitAllocationStatus,
  isTerminalAllocationStatus,
  isApprovable,
  isReversible,
  isCancellableAllocation,
} from './revenue-state-machine';
import { REVENUE_EVENTS, REVENUE_EVENT_SOURCES } from './revenue-events';
import {
  REVENUE_ERROR_CODES,
  FjnAllocationNotFoundError,
  FjnAllocationAlreadyExistsError,
  FjnAllocationStatusInvalidError,
  FjnAllocationTerminalStatusError,
  FjnAllocationNotReversibleError,
  FjnAllocationNotApprovableError,
  FjnAllocationAmountInvalidError,
  FjnAllocationAmountZeroError,
  FjnReversalNotFoundError,
  FjnReversalAlreadyExistsError,
  FjnReversalStatusInvalidError,
  FjnReversalAmountInvalidError,
  FjnReversalAmountExceedsError,
  FjnRevenueOrderNotFoundError,
  FjnRevenueOrderNotPaidError,
  FjnRuleNotFoundError,
  FjnRuleInvalidError,
  FjnRuleInactiveError,
  FjnReviewerRequiredError,
} from './revenue-errors';

// ============================================================
// DTOs
// ============================================================

/** 创建分账输入 */
export interface CreateAllocationInput {
  orderId: string;
  orderNo: string;
  userId: string;
  productType: string;
  paidAmount: string;
  taxAmount?: string;
  currency: string;
  ruleId?: string;
  ruleVersion?: string;
  operatorId?: string;
}

/** 分账查询输入 */
export interface ListAllocationInput extends FjnPaginationInput {
  allocationNo?: string;
  orderId?: string;
  userId?: string;
  productType?: string;
  status?: FjnAllocationStatus;
  startDate?: Date;
  endDate?: Date;
}

/** 审核通过输入 */
export interface ApproveAllocationInput {
  reviewerId: string;
  reviewNote?: string;
}

/** 取消分账输入 */
export interface CancelAllocationInput {
  reason: string;
  operatorId?: string;
}

/** 冲销输入 */
export interface CreateReversalInput {
  originalAllocationId: string;
  orderId: string;
  refundId?: string;
  reason: string;
  reversedAmount?: string; // 不传则按全部
  operatorId?: string;
}

/** 冲销查询输入 */
export interface ListReversalInput extends FjnPaginationInput {
  reversalNo?: string;
  orderId?: string;
  refundId?: string;
  status?: FjnReversalStatus;
  startDate?: Date;
  endDate?: Date;
}

/** 池汇总查询输入 */
export interface PoolSummaryInput {
  poolType?: FjnRevenuePoolType;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
}

// ============================================================
// Revenue Service 实现
// ============================================================

export class FjnRevenueService extends FjnServiceBase {
  constructor(options?: FjnServiceOptions) {
    super({ ...options, serviceName: options?.serviceName ?? 'FjnRevenueService' });
  }

  // ============================================================
  // 1. 分账主表 CRUD
  // ============================================================

  /**
   * 创建分账（防重复：每个 orderId 唯一）
   *
   * 流程：
   *   1. 验证订单已支付
   *   2. 验证金额 > 0
   *   3. 计算净收入 = paidAmount - taxAmount
   *   4. 按规则分配（默认 40/30/30）
   *   5. 写入主表+明细（事务）
   *   6. 触发 ALLOCATED 事件
   */
  async createAllocation(input: CreateAllocationInput): Promise<any> {
    try {
      // 参数校验
      this.validateCreateAllocationInput(input);

      return await this.withTransaction(async (tx) => {
        // 1. 验证订单存在且已支付
        const order = await tx.fjnOrder.findUnique({
          where: { id: input.orderId },
          select: {
            id: true,
            orderNo: true,
            userId: true,
            status: true,
            paidAmount: true,
            totalAmount: true,
            currency: true,
            orderType: true,
          },
        });
        if (!order) {
          throw new FjnRevenueOrderNotFoundError('订单不存在', { orderId: input.orderId });
        }
        if (order.status !== 'paid' && order.status !== 'payment_processing' && order.status !== 'fulfilling' && order.status !== 'fulfilled' && order.status !== 'completed') {
          throw new FjnRevenueOrderNotPaidError('订单未支付，不能分账', {
            orderId: input.orderId,
            orderStatus: order.status,
          });
        }
        if (order.currency !== input.currency) {
          throw new FjnBusinessRuleError('订单币种与分账币种不一致', {
            orderCurrency: order.currency,
            inputCurrency: input.currency,
          });
        }

        // 2. 防重复：orderId 唯一
        const existing = await tx.fjnRevenueAllocation.findUnique({
          where: { orderId: input.orderId },
        });
        if (existing) {
          throw new FjnAllocationAlreadyExistsError('该订单已存在分账记录', {
            orderId: input.orderId,
            existingAllocationId: existing.id,
          });
        }

        // 3. 计算净收入
        const taxAmount = input.taxAmount ?? '0';
        const netAmount = decimalSub(input.paidAmount, taxAmount);
        if (!decimalGte(netAmount, '0')) {
          throw new FjnAllocationAmountInvalidError('分账净收入不能为负', {
            paidAmount: input.paidAmount,
            taxAmount,
            netAmount: netAmount.toFixed(),
          });
        }

        // 4. 选择规则
        const rule = await this.resolveRule(tx, input);

        // 5. 计算分账明细
        const items = this.calculateItems({
          productType: input.productType,
          netAmount,
          rule,
        });

        // 6. 生成分账单编号
        const allocationNo = await this.generateUniqueAllocationNo(tx);

        // 7. 写入主表
        const allocation = await tx.fjnRevenueAllocation.create({
          data: {
            allocationNo,
            orderId: input.orderId,
            ruleId: rule.ruleId,
            ruleCode: rule.ruleCode,
            ruleVersion: rule.ruleVersion,
            paidAmount: decimalToFixed(input.paidAmount),
            taxAmount: decimalToFixed(taxAmount),
            netAmount: decimalToFixed(netAmount),
            currency: input.currency,
            status: ALLOCATION_STATUS.CALCULATED,
            calculatedAt: new Date(),
            ...this.fillAuditFields({}, input.operatorId),
          },
        });

        // 8. 写入明细
        for (const item of items) {
          await tx.fjnRevenueAllocationItem.create({
            data: {
              allocationId: allocation.id,
              poolType: item.poolType,
              poolName: item.poolName,
              percentage: item.percentage,
              allocatedAmount: item.amount,
              currency: input.currency,
              description: item.description,
            },
          });
        }

        // 9. 写状态日志
        await tx.fjnOrderStatusLog.create({
          data: {
            orderId: input.orderId,
            fromStatus: order.status,
            toStatus: order.status,
            reason: `分账创建: ${allocationNo}`,
            operatorId: input.operatorId,
            operatorType: REVENUE_EVENT_SOURCES.SYSTEM,
          },
        }).catch(() => {
          // 订单状态日志表如果不存在，忽略
        });

        // 10. 写 outbox 事件（待 H042 Worker 消费）
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: REVENUE_EVENTS.ALLOCATED,
              aggregateType: 'FjnRevenueAllocation',
              aggregateId: allocation.id,
              payload: {
                allocation_id: allocation.id,
                allocation_no: allocation.allocationNo,
                order_id: allocation.orderId,
                user_id: input.userId,
                product_type: input.productType,
                paid_amount: allocation.paidAmount.toString(),
                tax_amount: allocation.taxAmount.toString(),
                net_amount: allocation.netAmount.toString(),
                currency: allocation.currency,
                rule_id: allocation.ruleId,
                rule_version: allocation.ruleVersion,
                status: allocation.status,
                items: items.map((it) => ({
                  pool_type: it.poolType,
                  percentage: it.percentage,
                  amount: it.amount,
                  currency: input.currency,
                })),
                occurred_at: new Date().toISOString(),
                source: REVENUE_EVENT_SOURCES.ORDER,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // outbox 表如果不存在，忽略
        }

        this.log('info', '分账创建成功', {
          allocationId: allocation.id,
          allocationNo,
          orderId: input.orderId,
        });

        // 事务内用 tx 查询带 include 的完整结果（事务外查会因未 commit 看不到）
        return await tx.fjnRevenueAllocation.findUnique({
          where: { id: allocation.id },
          include: { items: true, reversals: true },
        });
      });
    } catch (e) {
      throw this.wrapError(e, '创建分账失败');
    }
  }

  /** 按 ID 查询分账 */
  async findAllocationById(id: string): Promise<any> {
    try {
      const allocation = await this.prisma.fjnRevenueAllocation.findUnique({
        where: { id },
        include: { items: true, reversals: true },
      });
      if (!allocation) {
        throw new FjnAllocationNotFoundError('分账单不存在', { id });
      }
      return allocation;
    } catch (e) {
      throw this.wrapError(e, '查询分账失败');
    }
  }

  /** 按单号查询分账 */
  async findAllocationByAllocationNo(allocationNo: string): Promise<any> {
    try {
      const allocation = await this.prisma.fjnRevenueAllocation.findUnique({
        where: { allocationNo },
        include: { items: true, reversals: true },
      });
      if (!allocation) {
        throw new FjnAllocationNotFoundError('分账单不存在', { allocationNo });
      }
      return allocation;
    } catch (e) {
      throw this.wrapError(e, '查询分账失败');
    }
  }

  /** 按订单 ID 查询分账 */
  async findAllocationByOrderId(orderId: string): Promise<any> {
    try {
      const allocation = await this.prisma.fjnRevenueAllocation.findUnique({
        where: { orderId },
        include: { items: true, reversals: true },
      });
      if (!allocation) {
        throw new FjnAllocationNotFoundError('该订单未分账', { orderId });
      }
      return allocation;
    } catch (e) {
      throw this.wrapError(e, '查询分账失败');
    }
  }

  /** 分账列表 */
  async listAllocations(input: ListAllocationInput): Promise<FjnPaginatedResult<any>> {
    try {
      const where: Prisma.FjnRevenueAllocationWhereInput = {};
      if (input.allocationNo) where.allocationNo = input.allocationNo;
      if (input.orderId) where.orderId = input.orderId;
      // userId 字段在 FjnRevenueAllocation 中不存在，需通过 order 关联查询
      if (input.userId) where.order = { userId: input.userId };
      if (input.status) where.status = input.status;
      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) (where.createdAt as any).gte = input.startDate;
        if (input.endDate) (where.createdAt as any).lte = input.endDate;
      }

      const [items, total] = await Promise.all([
        this.prisma.fjnRevenueAllocation.findMany({
          where,
          include: { items: true, reversals: true },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.fjnRevenueAllocation.count({ where }),
      ]);

      return paginate(items as any[], total, input);
    } catch (e) {
      throw this.wrapError(e, '查询分账列表失败');
    }
  }

  // ============================================================
  // 2. 状态机操作
  // ============================================================

  /** 进入风控审核 */
  async startRiskCheck(allocationId: string, operatorId?: string): Promise<any> {
    try {
      return await this.withTransaction(async (tx) => {
        const allocation = await tx.fjnRevenueAllocation.findUnique({ where: { id: allocationId } });
        if (!allocation) {
          throw new FjnAllocationNotFoundError('分账单不存在', { allocationId });
        }
        if (isTerminalAllocationStatus(allocation.status as FjnAllocationStatus)) {
          throw new FjnAllocationTerminalStatusError();
        }
        assertTransitAllocationStatus(
          allocation.status as FjnAllocationStatus,
          ALLOCATION_STATUS.RISK_CHECKING
        );

        const updated = await tx.fjnRevenueAllocation.update({
          where: { id: allocationId },
          data: { status: ALLOCATION_STATUS.RISK_CHECKING },
        });

        this.log('info', '分账进入风控', { allocationId, operatorId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '进入风控失败');
    }
  }

  /** 审核通过（calculated/risk_checking → approved） */
  async approve(allocationId: string, input: ApproveAllocationInput): Promise<any> {
    try {
      if (!input.reviewerId) {
        throw new FjnReviewerRequiredError('审核人必填');
      }

      return await this.withTransaction(async (tx) => {
        const allocation = await tx.fjnRevenueAllocation.findUnique({
          where: { id: allocationId },
          include: { order: { select: { userId: true } } },
        });
        if (!allocation) {
          throw new FjnAllocationNotFoundError('分账单不存在', { allocationId });
        }
        const currentStatus = allocation.status as FjnAllocationStatus;
        if (!isApprovable(currentStatus)) {
          throw new FjnAllocationNotApprovableError(
            `当前状态 [${currentStatus}] 不可审核`,
            { currentStatus }
          );
        }
        assertTransitAllocationStatus(currentStatus, ALLOCATION_STATUS.APPROVED);

        const updated = await tx.fjnRevenueAllocation.update({
          where: { id: allocationId },
          data: {
            status: ALLOCATION_STATUS.APPROVED,
            approvedBy: input.reviewerId,
            approvedAt: new Date(),
          },
        });

        // 写 outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: REVENUE_EVENTS.APPROVED,
              aggregateType: 'FjnRevenueAllocation',
              aggregateId: allocationId,
              payload: {
                allocation_id: allocationId,
                allocation_no: updated.allocationNo,
                order_id: updated.orderId,
                user_id: allocation.order?.userId,
                currency: updated.currency,
                reviewer_id: input.reviewerId,
                review_note: input.reviewNote,
                approved_at: new Date().toISOString(),
                occurred_at: new Date().toISOString(),
                source: REVENUE_EVENT_SOURCES.ADMIN,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '分账审核通过', { allocationId, reviewerId: input.reviewerId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '审核分账失败');
    }
  }

  /** 标记已结算（approved → settled） */
  async markSettled(allocationId: string, operatorId?: string): Promise<any> {
    try {
      return await this.withTransaction(async (tx) => {
        const allocation = await tx.fjnRevenueAllocation.findUnique({ where: { id: allocationId } });
        if (!allocation) {
          throw new FjnAllocationNotFoundError('分账单不存在', { allocationId });
        }
        const currentStatus = allocation.status as FjnAllocationStatus;
        if (isTerminalAllocationStatus(currentStatus)) {
          throw new FjnAllocationTerminalStatusError();
        }
        assertTransitAllocationStatus(currentStatus, ALLOCATION_STATUS.SETTLED);

        const updated = await tx.fjnRevenueAllocation.update({
          where: { id: allocationId },
          data: {
            status: ALLOCATION_STATUS.SETTLED,
            settledAt: new Date(),
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: REVENUE_EVENTS.SETTLED,
              aggregateType: 'FjnRevenueAllocation',
              aggregateId: allocationId,
              payload: {
                allocation_id: allocationId,
                allocation_no: updated.allocationNo,
                order_id: updated.orderId,
                currency: updated.currency,
                settled_by: operatorId ?? 'system',
                settled_at: new Date().toISOString(),
                total_settled: updated.netAmount.toString(),
                occurred_at: new Date().toISOString(),
                source: REVENUE_EVENT_SOURCES.FINANCE,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '分账已结算', { allocationId, operatorId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '标记已结算失败');
    }
  }

  /** 取消分账（任意非终态 → cancelled） */
  async cancel(allocationId: string, input: CancelAllocationInput): Promise<any> {
    try {
      if (!input.reason || input.reason.trim().length === 0) {
        throw new FjnValidationError('取消原因必填', { field: 'reason' });
      }

      return await this.withTransaction(async (tx) => {
        const allocation = await tx.fjnRevenueAllocation.findUnique({ where: { id: allocationId } });
        if (!allocation) {
          throw new FjnAllocationNotFoundError('分账单不存在', { allocationId });
        }
        const currentStatus = allocation.status as FjnAllocationStatus;
        if (!isCancellableAllocation(currentStatus)) {
          throw new FjnAllocationTerminalStatusError(
            `当前状态 [${currentStatus}] 不可取消`,
            { currentStatus }
          );
        }
        assertTransitAllocationStatus(currentStatus, ALLOCATION_STATUS.CANCELLED);

        const updated = await tx.fjnRevenueAllocation.update({
          where: { id: allocationId },
          data: { status: ALLOCATION_STATUS.CANCELLED },
        });

        this.log('info', '分账已取消', {
          allocationId,
          reason: input.reason,
          operatorId: input.operatorId,
        });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '取消分账失败');
    }
  }

  // ============================================================
  // 3. 冲销（退款反转）
  // ============================================================

  /** 创建冲销 */
  async createReversal(input: CreateReversalInput): Promise<any> {
    try {
      if (!input.reason || input.reason.trim().length === 0) {
        throw new FjnValidationError('冲销原因必填', { field: 'reason' });
      }

      return await this.withTransaction(async (tx) => {
        // 1. 查询原分账
        const allocation = await tx.fjnRevenueAllocation.findUnique({
          where: { id: input.originalAllocationId },
          include: { items: true, reversals: true },
        });
        if (!allocation) {
          throw new FjnAllocationNotFoundError('原分账单不存在', {
            originalAllocationId: input.originalAllocationId,
          });
        }
        if (allocation.orderId !== input.orderId) {
          throw new FjnValidationError('订单 ID 与原分账不匹配', {
            orderId: input.orderId,
            allocationOrderId: allocation.orderId,
          });
        }

        // 2. 防重复冲销
        const existingReversal = await tx.fjnRevenueReversal.findFirst({
          where: { allocationId: input.originalAllocationId },
        });
        if (existingReversal) {
          throw new FjnReversalAlreadyExistsError('该分账已存在冲销记录', {
            allocationId: input.originalAllocationId,
            existingReversalId: existingReversal.id,
          });
        }

        // 3. 校验可冲销
        const currentStatus = allocation.status as FjnAllocationStatus;
        if (!isReversible(currentStatus)) {
          throw new FjnAllocationNotReversibleError(
            `当前状态 [${currentStatus}] 不可冲销`,
            { currentStatus }
          );
        }

        // 4. 计算冲销金额
        const fullNetAmount = allocation.netAmount.toString();
        const reversedAmount = input.reversedAmount ?? fullNetAmount;
        if (!decimalGt(reversedAmount, '0')) {
          throw new FjnReversalAmountInvalidError('冲销金额必须大于 0', { reversedAmount });
        }
        if (decimalGt(reversedAmount, fullNetAmount)) {
          throw new FjnReversalAmountExceedsError('冲销金额超过原分账金额', {
            reversedAmount,
            originalNetAmount: fullNetAmount,
          });
        }

        // 5. 生 成冲销单号
        const reversalNo = await this.generateUniqueReversalNo(tx);

        // 6. 写入冲销主表
        const reversal = await tx.fjnRevenueReversal.create({
          data: {
            reversalNo,
            allocationId: input.originalAllocationId,
            refundId: input.refundId,
            reversedAmount: decimalToFixed(reversedAmount),
            reason: input.reason,
            operatorId: input.operatorId,
          },
        });

        // 7. 更新原分账状态 → reversed
        await tx.fjnRevenueAllocation.update({
          where: { id: input.originalAllocationId },
          data: {
            status: ALLOCATION_STATUS.REVERSED,
            reversedAt: new Date(),
          },
        });

        // 8. outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: REVENUE_EVENTS.REVERSED,
              aggregateType: 'FjnRevenueReversal',
              aggregateId: reversal.id,
              payload: {
                reversal_id: reversal.id,
                reversal_no: reversal.reversalNo,
                original_allocation_id: input.originalAllocationId,
                order_id: input.orderId,
                refund_id: input.refundId,
                reversed_amount: decimalToFixed(reversedAmount),
                currency: allocation.currency,
                items: allocation.items.map((it) => ({
                  pool_type: it.poolType,
                  reverse_amount: decimalToFixed(decimalMul(it.allocatedAmount.toString(), '-1')),
                })),
                occurred_at: new Date().toISOString(),
                source: REVENUE_EVENT_SOURCES.REVERSAL,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '冲销创建成功', {
          reversalId: reversal.id,
          allocationId: input.originalAllocationId,
        });

        return this.findReversalById(reversal.id);
      });
    } catch (e) {
      throw this.wrapError(e, '创建冲销失败');
    }
  }

  /** 按 ID 查询冲销 */
  async findReversalById(id: string): Promise<any> {
    try {
      const reversal = await this.prisma.fjnRevenueReversal.findUnique({
        where: { id },
        include: { allocation: true },
      });
      if (!reversal) {
        throw new FjnReversalNotFoundError('冲销单不存在', { id });
      }
      return reversal;
    } catch (e) {
      throw this.wrapError(e, '查询冲销失败');
    }
  }

  /** 按单号查询冲销 */
  async findReversalByReversalNo(reversalNo: string): Promise<any> {
    try {
      const reversal = await this.prisma.fjnRevenueReversal.findUnique({
        where: { reversalNo },
        include: { allocation: true },
      });
      if (!reversal) {
        throw new FjnReversalNotFoundError('冲销单不存在', { reversalNo });
      }
      return reversal;
    } catch (e) {
      throw this.wrapError(e, '查询冲销失败');
    }
  }

  /** 按原分账 ID 查询冲销 */
  async findReversalByAllocationId(allocationId: string): Promise<any> {
    try {
      const reversal = await this.prisma.fjnRevenueReversal.findFirst({
        where: { allocationId },
        include: { allocation: true },
      });
      return reversal;
    } catch (e) {
      throw this.wrapError(e, '查询冲销失败');
    }
  }

  /** 冲销列表 */
  async listReversals(input: ListReversalInput): Promise<FjnPaginatedResult<any>> {
    try {
      // orderId / status 字段在 FjnRevenueReversal 中不存在，需通过 allocation 关联查询
      const where: Prisma.FjnRevenueReversalWhereInput = {};
      if (input.reversalNo) where.reversalNo = input.reversalNo;
      if (input.refundId) where.refundId = input.refundId;
      if (input.orderId) where.allocation = { orderId: input.orderId };
      if (input.status) where.allocation = { ...(where.allocation as any ?? {}), status: input.status };
      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) (where.createdAt as any).gte = input.startDate;
        if (input.endDate) (where.createdAt as any).lte = input.endDate;
      }

      const [items, total] = await Promise.all([
        this.prisma.fjnRevenueReversal.findMany({
          where,
          include: { allocation: true },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.fjnRevenueReversal.count({ where }),
      ]);

      return paginate(items as any[], total, input);
    } catch (e) {
      throw this.wrapError(e, '查询冲销列表失败');
    }
  }

  // ============================================================
  // 4. 池汇总
  // ============================================================

  /**
   * 池汇总统计
   * 按 poolType + currency 聚合 amount
   */
  async poolSummary(input: PoolSummaryInput): Promise<{
    items: Array<{ pool_type: FjnRevenuePoolType; currency: string; total_amount: string; count: number }>;
    generated_at: string;
  }> {
    try {
      const where: Prisma.FjnRevenueAllocationItemWhereInput = {};
      if (input.poolType) where.poolType = input.poolType;
      if (input.currency) where.currency = input.currency;
      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) (where.createdAt as any).gte = input.startDate;
        if (input.endDate) (where.createdAt as any).lte = input.endDate;
      }

      const rows = await this.prisma.fjnRevenueAllocationItem.groupBy({
        by: ['poolType', 'currency'],
        where,
        _sum: { allocatedAmount: true },
        _count: { _all: true },
      });

      return {
        items: rows.map((r) => ({
          pool_type: r.poolType as FjnRevenuePoolType,
          currency: r.currency,
          total_amount: r._sum.allocatedAmount?.toString() ?? '0.0000',
          count: r._count._all,
        })),
        generated_at: new Date().toISOString(),
      };
    } catch (e) {
      throw this.wrapError(e, '池汇总失败');
    }
  }

  // ============================================================
  // 5. OrderService 联动入口
  // ============================================================

  /**
   * OrderPaid 事件处理器（联动入口）
   * OrderService / PaymentService 在订单支付成功后调用此方法
   */
  async handleOrderPaid(input: CreateAllocationInput): Promise<any> {
    return await this.createAllocation({
      ...input,
      operatorId: input.operatorId ?? 'system.order.paid',
    });
  }

  // ============================================================
  // 6. 私有辅助方法
  // ============================================================

  /** 校验创建分账输入 */
  private validateCreateAllocationInput(input: CreateAllocationInput): void {
    if (!input.orderId) throw new FjnValidationError('orderId 必填', { field: 'orderId' });
    if (!input.userId) throw new FjnValidationError('userId 必填', { field: 'userId' });
    if (!input.productType) throw new FjnValidationError('productType 必填', { field: 'productType' });
    if (!input.paidAmount || !decimalGt(input.paidAmount, '0')) {
      throw new FjnAllocationAmountZeroError('paidAmount 必须大于 0', {
        paidAmount: input.paidAmount,
      });
    }
    if (!input.currency) throw new FjnValidationError('currency 必填', { field: 'currency' });
  }

  /** 解析规则（默认 wine_369 → 40/30/30） */
  private async resolveRule(
    tx: any,
    input: CreateAllocationInput
  ): Promise<{
    ruleId: string;
    ruleCode: string;
    ruleVersion: string;
    items: Array<{ poolType: FjnRevenuePoolType; poolName: string; percentage: string; description?: string }>;
  }> {
    // 1. 优先按 input.ruleId / ruleVersion 查找
    if (input.ruleId) {
      const rule = await tx.fjnRevenueRule.findUnique({
        where: { id: input.ruleId },
        include: { items: true },
      });
      if (!rule) {
        throw new FjnRuleNotFoundError('指定规则不存在', { ruleId: input.ruleId });
      }
      if (rule.status !== 'active') {
        throw new FjnRuleInactiveError('指定规则未生效', { ruleId: input.ruleId, status: rule.status });
      }
      return {
        ruleId: rule.id,
        ruleCode: rule.ruleCode,
        ruleVersion: rule.version,
        items: rule.items
          .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
          .map((it: any) => ({
            poolType: it.poolType as FjnRevenuePoolType,
            poolName: it.poolName,
            percentage: it.percentage.toString(),
            description: it.description ?? undefined,
          })),
      };
    }

    // 2. 查找 active 规则
    const activeRule = await tx.fjnRevenueRule.findFirst({
      where: {
        status: 'active',
        OR: [{ productType: input.productType }, { productType: null }],
      },
      include: { items: true },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (activeRule) {
      return {
        ruleId: activeRule.id,
        ruleCode: activeRule.ruleCode,
        ruleVersion: activeRule.version,
        items: activeRule.items
          .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
          .map((it: any) => ({
            poolType: it.poolType as FjnRevenuePoolType,
            poolName: it.poolName,
            percentage: it.percentage.toString(),
            description: it.description ?? undefined,
          })),
      };
    }

    // 3. 兜底：使用硬编码 WINE_369_REVENUE_RULE
    return {
      ruleId: '00000000-0000-0000-0000-000000000000', // 虚拟 ID（占位）
      ruleCode: 'WINE_369_DEFAULT',
      ruleVersion: input.ruleVersion ?? 'V1',
      items: WINE_369_REVENUE_RULE.map((it) => ({
        poolType: it.poolType,
        poolName: this.getPoolName(it.poolType),
        percentage: it.percentage,
      })),
    };
  }

  /** 计算分账明细 */
  private calculateItems(params: {
    productType: string;
    netAmount: any;
    rule: { items: Array<{ poolType: FjnRevenuePoolType; poolName: string; percentage: string; description?: string }> };
  }): Array<{ poolType: FjnRevenuePoolType; poolName: string; percentage: string; amount: string; description?: string }> {
    if (!params.rule.items || params.rule.items.length === 0) {
      throw new FjnRuleInvalidError('分账规则无明细项', { productType: params.productType });
    }
    return params.rule.items.map((item) => ({
      poolType: item.poolType,
      poolName: item.poolName,
      percentage: item.percentage,
      amount: decimalToFixed(decimalMul(params.netAmount, item.percentage)),
      description: item.description,
    }));
  }

  /** 池名称辅助 */
  private getPoolName(poolType: FjnRevenuePoolType): string {
    const names: Record<FjnRevenuePoolType, string> = {
      wine_cost_pool: '酒成本池',
      market_ecosystem_pool: '市场生态池',
      company_pool: '公司池',
      referral_reward_pool: '推荐奖励池',
      team_reward_pool: '团队奖励池',
      node_reward_pool: '节点奖励池',
      points_incentive_pool: '积分激励池',
      dappx_nft_ai_pool: 'DAppX NFT AI 池',
      treasury_activity_pool: '资金活动池',
      tax_reserved_pool: '税务储备池',
    };
    return names[poolType] ?? poolType;
  }

  /** 生成分账单号（带唯一性重试） */
  private async generateUniqueAllocationNo(tx: any): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const no = FjnBusinessNoGenerator.allocationNo(Date.now() % 1000000 + i);
      const exists = await tx.fjnRevenueAllocation.findUnique({ where: { allocationNo: no } });
      if (!exists) return no;
    }
    // 退化：时间戳
    return `ALC${Date.now()}`;
  }

  /** 生成冲销单号 */
  private async generateUniqueReversalNo(tx: any): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const no = `RVR${Date.now()}${String(i).padStart(2, '0')}`;
      const exists = await tx.fjnRevenueReversal.findUnique({ where: { reversalNo: no } });
      if (!exists) return no;
    }
    return `RVR${Date.now()}`;
  }
}

// ============================================================
// Factory
// ============================================================

export function createFjnRevenueService(options?: FjnServiceOptions): FjnRevenueService {
  return new FjnRevenueService(options);
}
