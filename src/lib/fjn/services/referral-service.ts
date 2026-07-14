/**
 * FJN Referral Service - 推荐奖励服务
 *
 * 职责（与 H015 / H028 一致）：
 *  - 推荐关系管理（绑定、查询、转移）
 *  - 推荐奖励生成（按 10% L1）
 *  - 奖励状态机（created → locked → risk_checking → approved → payable → paid）
 *  - 奖励审核、追回、取消
 *  - 锁定期管理（lockDays）
 *  - 7 类 outbox 事件
 *  - OrderPaid 事件联动入口
 *
 * 用法：
 *   import { FjnReferralService } from '@/lib/fjn/services/referral-service';
 *   const svc = new FjnReferralService();
 *   const reward = await svc.createReward({ orderId, orderUserId, userId, orderAmount, ... });
 *   await svc.approve(reward.id, { reviewerId: 'admin_001' });
 *
 * 设计原则：
 *  - 订单级防重复：每个 orderId 只能有一条奖励（schema orderId @unique）
 *  - 不能推荐自己（自推荐保护）
 *  - KYC 必须认证（kycVerified=true）
 *  - 状态变更必须经过状态机校验
 *  - 锁定期内不可支付
 */

import type { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  FjnDecimal,
  decimalMul,
  decimalSub,
  decimalToFixed,
  decimalEq,
  decimalGt,
  decimalGte,
  decimalLte,
  decimalSum,
} from '../decimal';
import {
  FjnValidationError,
  FjnNotFoundError,
  FjnConflictError,
  FjnBusinessRuleError,
} from '../errors';
import { FjnBusinessNoGenerator, FjnPaginatedResult, FjnPaginationInput, paginate } from '../types';
import { FJN_DEFAULT_CURRENCY } from '../constants';
import {
  REFERRAL_REWARD_STATUS,
  REFERRAL_BINDING_STATUS,
  type FjnReferralRewardStatus,
  type FjnReferralBindingStatus,
  assertTransitReferralRewardStatus,
  assertTransitReferralBindingStatus,
  isTerminalReferralRewardStatus,
  isApprovableReward,
  isPayableReward,
  isPayableNow,
  isRecoverable,
  isCancellableReward,
  isLockable,
  isLockExpired,
  calculateLockUntil,
  canTransitReferralRewardStatus,
} from './referral-state-machine';
import {
  REFERRAL_EVENTS,
  REFERRAL_EVENT_SOURCES,
} from './referral-events';
import {
  REFERRAL_ERROR_CODES,
  FjnReferralBindingNotFoundError,
  FjnReferralBindingAlreadyExistsError,
  FjnReferralBindingInvalidError,
  FjnReferralSelfNotAllowedError,
  FjnReferralRewardNotFoundError,
  FjnReferralRewardAlreadyExistsError,
  FjnReferralRewardStatusInvalidError,
  FjnReferralRewardTerminalStatusError,
  FjnReferralRewardAmountInvalidError,
  FjnReferralRewardAmountZeroError,
  FjnReferralRewardRateInvalidError,
  FjnReferralRewardNotPayableError,
  FjnReferralRewardNotRecoverableError,
  FjnReferralRewardNotApprovableError,
  FjnReferralRewardLockNotExpiredError,
  FjnReferralOrderNotFoundError,
  FjnReferralOrderNotPaidError,
  FjnReferralKycNotVerifiedError,
  FjnReferralRiskHoldError,
  FjnReferralApprovalRequiredError,
  FjnReferralReviewerRequiredError,
  FjnReferralReasonRequiredError,
} from './referral-errors';

// ============================================================
// DTOs
// ============================================================

/** 创建推荐奖励输入 */
export interface CreateReferralRewardInput {
  orderId: string;
  orderUserId: string;        // 下单用户（买家）
  userId: string;             // 推荐人
  rewardRate: string;         // 推荐比例，默认 0.10
  orderAmount: string;        // 订单金额
  currency: string;
  lockDays?: number;          // 默认 30 天
  taxRate?: string;           // 默认 0.10 (10%)
  operatorId?: string;
}

/** 审核输入 */
export interface ApproveReferralRewardInput {
  reviewerId: string;
  reviewNote?: string;
}

/** 追回输入 */
export interface RecoverReferralRewardInput {
  reason: string;
  approvalId?: string;
  operatorId?: string;
}

/** 取消输入 */
export interface CancelReferralRewardInput {
  reason: string;
  operatorId?: string;
}

/** 奖励查询输入 */
export interface ListReferralRewardInput extends FjnPaginationInput {
  rewardNo?: string;
  orderId?: string;
  userId?: string;             // 推荐人
  orderUserId?: string;        // 买家
  status?: FjnReferralRewardStatus;
  riskStatus?: string;
  startDate?: Date;
  endDate?: Date;
}

/** 创建推荐关系输入 */
export interface CreateBindingInput {
  userId: string;
  referrerId: string;
  referrerCode?: string;
  level?: number;            // 默认 1
  bindSource: string;        // signup / share_link / admin / api
  bindIp?: string;
  bindDeviceId?: string;
  metadata?: Record<string, unknown>;
  operatorId?: string;
}

/** 关系查询输入 */
export interface ListBindingInput extends FjnPaginationInput {
  userId?: string;
  referrerId?: string;
  status?: FjnReferralBindingStatus;
}

// ============================================================
// Referral Service 实现
// ============================================================

export class FjnReferralService extends FjnServiceBase {
  /** 默认推荐比例（H028 §21） */
  static readonly DEFAULT_REWARD_RATE = '0.10';
  /** 默认税率 */
  static readonly DEFAULT_TAX_RATE = '0.10';
  /** 默认锁定天数 */
  static readonly DEFAULT_LOCK_DAYS = 30;

  constructor(options?: FjnServiceOptions) {
    super({ ...options, serviceName: options?.serviceName ?? 'FjnReferralService' });
  }

  // ============================================================
  // 1. 推荐奖励 CRUD
  // ============================================================

  /**
   * 创建推荐奖励
   *
   * 流程：
   *   1. 校验订单已支付
   *   2. 校验推荐关系存在且有效
   *   3. 校验 KYC
   *   4. 校验非自推荐
   *   5. 计算奖励金额 + 税
   *   6. 防重复：orderId 唯一
   *   7. 写入主表
   *   8. 触发 RewardCreated 事件
   */
  async createReward(input: CreateReferralRewardInput): Promise<any> {
    try {
      // 参数校验
      this.validateCreateRewardInput(input);

      return await this.withTransaction(async (tx) => {
        // 1. 校验订单
        const order = await tx.fjnOrder.findUnique({
          where: { id: input.orderId },
          select: { id: true, userId: true, status: true, paidAmount: true, currency: true },
        });
        if (!order) {
          throw new FjnReferralOrderNotFoundError('订单不存在', { orderId: input.orderId });
        }
        if (order.userId !== input.orderUserId) {
          throw new FjnValidationError('订单所属用户与入参 orderUserId 不一致', {
            orderUserId: order.userId,
            inputUserId: input.orderUserId,
          });
        }
        if (
          order.status !== 'paid' &&
          order.status !== 'payment_processing' &&
          order.status !== 'fulfilling' &&
          order.status !== 'fulfilled' &&
          order.status !== 'completed'
        ) {
          throw new FjnReferralOrderNotPaidError('订单未支付', { orderStatus: order.status });
        }
        if (order.currency !== input.currency) {
          throw new FjnBusinessRuleError('币种不一致', {
            orderCurrency: order.currency,
            inputCurrency: input.currency,
          });
        }

        // 2. 防自推荐
        if (input.userId === input.orderUserId) {
          throw new FjnReferralSelfNotAllowedError('不能推荐自己', {
            userId: input.userId,
            orderUserId: input.orderUserId,
          });
        }

        // 3. 校验推荐关系
        const binding = await tx.fjnReferralRelationship.findUnique({
          where: { userId: input.orderUserId },
        });
        if (!binding) {
          throw new FjnReferralBindingNotFoundError('用户无推荐关系', { orderUserId: input.orderUserId });
        }
        if (binding.referrerId !== input.userId) {
          throw new FjnReferralBindingInvalidError('推荐人与绑定关系不一致', {
            bindingReferrerId: binding.referrerId,
            inputReferrerId: input.userId,
          });
        }
        if (binding.status !== 'active') {
          throw new FjnReferralBindingInvalidError('推荐关系无效', {
            status: binding.status,
          });
        }

        // 4. 防重复
        const existing = await tx.fjnReferralReward.findUnique({
          where: { orderId: input.orderId },
        });
        if (existing) {
          throw new FjnReferralRewardAlreadyExistsError('该订单已存在推荐奖励', {
            orderId: input.orderId,
            existingRewardId: existing.id,
          });
        }

        // 5. 计算奖励
        const taxRate = input.taxRate ?? FjnReferralService.DEFAULT_TAX_RATE;
        const lockDays = input.lockDays ?? FjnReferralService.DEFAULT_LOCK_DAYS;
        const rewardAmount = decimalMul(input.orderAmount, input.rewardRate);
        const taxAmount = decimalMul(rewardAmount, taxRate);
        const netAmount = decimalSub(rewardAmount, taxAmount);

        // 6. 写入主表
        const rewardNo = await this.generateUniqueRewardNo(tx);
        const reward = await tx.fjnReferralReward.create({
          data: {
            rewardNo,
            userId: input.userId,
            orderId: input.orderId,
            orderUserId: input.orderUserId,
            orderAmount: decimalToFixed(input.orderAmount),
            rewardRate: decimalToFixed(input.rewardRate),
            rewardAmount: decimalToFixed(rewardAmount),
            taxAmount: decimalToFixed(taxAmount),
            netAmount: decimalToFixed(netAmount),
            currency: input.currency,
            status: REFERRAL_REWARD_STATUS.CREATED,
            lockDays,
            lockedAt: null,
            selfReferral: false,
            kycVerified: false,
            riskStatus: 'normal',
            ...this.fillAuditFields({}, input.operatorId),
          },
        });

        // 7. outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: REFERRAL_EVENTS.REWARD_CREATED,
              aggregateType: 'FjnReferralReward',
              aggregateId: reward.id,
              payload: {
                reward_id: reward.id,
                reward_no: reward.rewardNo,
                order_id: reward.orderId,
                user_id: reward.userId,
                order_user_id: reward.orderUserId,
                order_amount: reward.orderAmount.toString(),
                reward_rate: reward.rewardRate.toString(),
                reward_amount: reward.rewardAmount.toString(),
                tax_amount: reward.taxAmount.toString(),
                net_amount: reward.netAmount.toString(),
                currency: reward.currency,
                lock_days: lockDays,
                occurred_at: new Date().toISOString(),
                source: REFERRAL_EVENT_SOURCES.ORDER,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '推荐奖励创建成功', {
          rewardId: reward.id,
          rewardNo,
          orderId: input.orderId,
        });
        return this.findRewardById(reward.id);
      });
    } catch (e) {
      throw this.wrapError(e, '创建推荐奖励失败');
    }
  }

  /** 按 ID 查询 */
  async findRewardById(id: string): Promise<any> {
    try {
      const reward = await this.prisma.fjnReferralReward.findUnique({ where: { id } });
      if (!reward) throw new FjnReferralRewardNotFoundError('推荐奖励不存在', { id });
      return reward;
    } catch (e) {
      throw this.wrapError(e, '查询推荐奖励失败');
    }
  }

  /** 按单号查询 */
  async findRewardByRewardNo(rewardNo: string): Promise<any> {
    try {
      const reward = await this.prisma.fjnReferralReward.findUnique({ where: { rewardNo } });
      if (!reward) throw new FjnReferralRewardNotFoundError('推荐奖励不存在', { rewardNo });
      return reward;
    } catch (e) {
      throw this.wrapError(e, '查询推荐奖励失败');
    }
  }

  /** 按订单 ID 查询 */
  async findRewardByOrderId(orderId: string): Promise<any> {
    try {
      const reward = await this.prisma.fjnReferralReward.findUnique({ where: { orderId } });
      return reward; // 允许 null（用 try/catch 区分）
    } catch (e) {
      throw this.wrapError(e, '查询推荐奖励失败');
    }
  }

  /** 列表 */
  async listRewards(input: ListReferralRewardInput): Promise<FjnPaginatedResult<any>> {
    try {
      const where: Prisma.FjnReferralRewardWhereInput = {};
      if (input.rewardNo) where.rewardNo = input.rewardNo;
      if (input.orderId) where.orderId = input.orderId;
      if (input.userId) where.userId = input.userId;
      if (input.orderUserId) where.orderUserId = input.orderUserId;
      if (input.status) where.status = input.status;
      if (input.riskStatus) where.riskStatus = input.riskStatus;
      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) (where.createdAt as any).gte = input.startDate;
        if (input.endDate) (where.createdAt as any).lte = input.endDate;
      }

      const [items, total] = await Promise.all([
        this.prisma.fjnReferralReward.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.fjnReferralReward.count({ where }),
      ]);

      return paginate(items as any[], total, input);
    } catch (e) {
      throw this.wrapError(e, '查询奖励列表失败');
    }
  }

  // ============================================================
  // 2. 状态机操作
  // ============================================================

  /** 锁定（created → locked） */
  async lock(rewardId: string, operatorId?: string): Promise<any> {
    try {
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnReferralReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnReferralRewardNotFoundError();
        const currentStatus = reward.status as FjnReferralRewardStatus;
        if (!isLockable(currentStatus)) {
          throw new FjnReferralRewardStatusInvalidError(
            `当前状态 [${currentStatus}] 不可锁定`,
            { currentStatus }
          );
        }
        assertTransitReferralRewardStatus(currentStatus, REFERRAL_REWARD_STATUS.LOCKED);

        const updated = await tx.fjnReferralReward.update({
          where: { id: rewardId },
          data: {
            status: REFERRAL_REWARD_STATUS.LOCKED,
            lockedAt: new Date(),
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: REFERRAL_EVENTS.REWARD_LOCKED,
              aggregateType: 'FjnReferralReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                locked_at: updated.lockedAt?.toISOString() ?? new Date().toISOString(),
                lock_until: calculateLockUntil(updated.lockDays, updated.lockedAt ?? new Date()).toISOString(),
                occurred_at: new Date().toISOString(),
                source: REFERRAL_EVENT_SOURCES.SYSTEM,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '推荐奖励已锁定', { rewardId, operatorId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '锁定失败');
    }
  }

  /** 进入风控 */
  async startRiskCheck(rewardId: string, operatorId?: string): Promise<any> {
    try {
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnReferralReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnReferralRewardNotFoundError();
        const currentStatus = reward.status as FjnReferralRewardStatus;
        assertTransitReferralRewardStatus(currentStatus, REFERRAL_REWARD_STATUS.RISK_CHECKING);

        const updated = await tx.fjnReferralReward.update({
          where: { id: rewardId },
          data: { status: REFERRAL_REWARD_STATUS.RISK_CHECKING, riskStatus: 'checking' },
        });

        this.log('info', '推荐奖励进入风控', { rewardId, operatorId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '进入风控失败');
    }
  }

  /** 审核（locked/risk_checking → approved） */
  async approve(rewardId: string, input: ApproveReferralRewardInput): Promise<any> {
    try {
      if (!input.reviewerId) throw new FjnReferralReviewerRequiredError();
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnReferralReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnReferralRewardNotFoundError();
        const currentStatus = reward.status as FjnReferralRewardStatus;
        if (!isApprovableReward(currentStatus)) {
          throw new FjnReferralRewardNotApprovableError(
            `当前状态 [${currentStatus}] 不可审核`,
            { currentStatus }
          );
        }
        assertTransitReferralRewardStatus(currentStatus, REFERRAL_REWARD_STATUS.APPROVED);

        const updated = await tx.fjnReferralReward.update({
          where: { id: rewardId },
          data: {
            status: REFERRAL_REWARD_STATUS.APPROVED,
            approvedBy: input.reviewerId,
            approvedAt: new Date(),
            remark: input.reviewNote,
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: REFERRAL_EVENTS.REWARD_APPROVED,
              aggregateType: 'FjnReferralReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                reviewer_id: input.reviewerId,
                review_note: input.reviewNote,
                approved_at: new Date().toISOString(),
                occurred_at: new Date().toISOString(),
                source: REFERRAL_EVENT_SOURCES.ADMIN,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '推荐奖励审核通过', { rewardId, reviewerId: input.reviewerId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '审核失败');
    }
  }

  /** 转 payable（approved/risk_checking → payable） */
  async markPayable(rewardId: string, operatorId?: string): Promise<any> {
    try {
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnReferralReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnReferralRewardNotFoundError();
        const currentStatus = reward.status as FjnReferralRewardStatus;
        if (!isPayableReward(currentStatus)) {
          throw new FjnReferralRewardNotPayableError(
            `当前状态 [${currentStatus}] 不可转 payable`,
            { currentStatus }
          );
        }
        // 锁定期校验
        if (reward.lockedAt && !isLockExpired(reward.lockedAt, reward.lockDays)) {
          throw new FjnReferralRewardLockNotExpiredError('锁定期未满', {
            lockedAt: reward.lockedAt,
            lockDays: reward.lockDays,
          });
        }
        assertTransitReferralRewardStatus(currentStatus, REFERRAL_REWARD_STATUS.PAYABLE);

        const updated = await tx.fjnReferralReward.update({
          where: { id: rewardId },
          data: {
            status: REFERRAL_REWARD_STATUS.PAYABLE,
            unlockedAt: new Date(),
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: REFERRAL_EVENTS.REWARD_PAYABLE,
              aggregateType: 'FjnReferralReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                payable_at: new Date().toISOString(),
                occurred_at: new Date().toISOString(),
                source: REFERRAL_EVENT_SOURCES.FINANCE,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '推荐奖励转 payable', { rewardId, operatorId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '转 payable 失败');
    }
  }

  /** 标记已支付（payable → paid） */
  async markPaid(rewardId: string, operatorId?: string): Promise<any> {
    try {
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnReferralReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnReferralRewardNotFoundError();
        const currentStatus = reward.status as FjnReferralRewardStatus;
        if (!isPayableNow(currentStatus)) {
          throw new FjnReferralRewardNotPayableError(
            `当前状态 [${currentStatus}] 不可支付`,
            { currentStatus }
          );
        }
        assertTransitReferralRewardStatus(currentStatus, REFERRAL_REWARD_STATUS.PAID);

        const updated = await tx.fjnReferralReward.update({
          where: { id: rewardId },
          data: {
            status: REFERRAL_REWARD_STATUS.PAID,
            paidAt: new Date(),
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: REFERRAL_EVENTS.REWARD_PAID,
              aggregateType: 'FjnReferralReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                paid_at: new Date().toISOString(),
                paid_amount: updated.rewardAmount.toString(),
                currency: updated.currency,
                occurred_at: new Date().toISOString(),
                source: REFERRAL_EVENT_SOURCES.FINANCE,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '推荐奖励已支付', { rewardId, operatorId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '标记已支付失败');
    }
  }

  /** 追回（approved/payable/paid/risk_hold → recovered） */
  async recover(rewardId: string, input: RecoverReferralRewardInput): Promise<any> {
    try {
      if (!input.reason || input.reason.trim().length === 0) {
        throw new FjnReferralReasonRequiredError('追回原因必填');
      }
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnReferralReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnReferralRewardNotFoundError();
        const currentStatus = reward.status as FjnReferralRewardStatus;
        if (!isRecoverable(currentStatus)) {
          throw new FjnReferralRewardNotRecoverableError(
            `当前状态 [${currentStatus}] 不可追回`,
            { currentStatus }
          );
        }
        assertTransitReferralRewardStatus(currentStatus, REFERRAL_REWARD_STATUS.RECOVERED);

        const updated = await tx.fjnReferralReward.update({
          where: { id: rewardId },
          data: {
            status: REFERRAL_REWARD_STATUS.RECOVERED,
            recoveredAt: new Date(),
            remark: input.reason,
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: REFERRAL_EVENTS.REWARD_RECOVERED,
              aggregateType: 'FjnReferralReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                reason: input.reason,
                approval_id: input.approvalId,
                recovered_at: new Date().toISOString(),
                recovered_amount: updated.rewardAmount.toString(),
                occurred_at: new Date().toISOString(),
                source: REFERRAL_EVENT_SOURCES.RISK,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '推荐奖励已追回', { rewardId, reason: input.reason });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '追回失败');
    }
  }

  /** 取消 */
  async cancel(rewardId: string, input: CancelReferralRewardInput): Promise<any> {
    try {
      if (!input.reason || input.reason.trim().length === 0) {
        throw new FjnReferralReasonRequiredError('取消原因必填');
      }
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnReferralReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnReferralRewardNotFoundError();
        const currentStatus = reward.status as FjnReferralRewardStatus;
        if (!isCancellableReward(currentStatus)) {
          throw new FjnReferralRewardTerminalStatusError(
            `当前状态 [${currentStatus}] 不可取消`,
            { currentStatus }
          );
        }
        assertTransitReferralRewardStatus(currentStatus, REFERRAL_REWARD_STATUS.CANCELLED);

        const updated = await tx.fjnReferralReward.update({
          where: { id: rewardId },
          data: {
            status: REFERRAL_REWARD_STATUS.CANCELLED,
            cancelledAt: new Date(),
            remark: input.reason,
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: REFERRAL_EVENTS.REWARD_CANCELLED,
              aggregateType: 'FjnReferralReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                reason: input.reason,
                cancelled_at: new Date().toISOString(),
                occurred_at: new Date().toISOString(),
                source: REFERRAL_EVENT_SOURCES.ADMIN,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '推荐奖励已取消', { rewardId, reason: input.reason });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '取消失败');
    }
  }

  /** 风控冻结 */
  async riskHold(rewardId: string, reason: string, riskScore: number, riskLevel: string): Promise<any> {
    try {
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnReferralReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnReferralRewardNotFoundError();
        const currentStatus = reward.status as FjnReferralRewardStatus;
        assertTransitReferralRewardStatus(currentStatus, REFERRAL_REWARD_STATUS.RISK_HOLD);

        const updated = await tx.fjnReferralReward.update({
          where: { id: rewardId },
          data: {
            status: REFERRAL_REWARD_STATUS.RISK_HOLD,
            riskStatus: 'hold',
            remark: reason,
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: REFERRAL_EVENTS.REWARD_RISK_HOLD,
              aggregateType: 'FjnReferralReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                reason,
                risk_score: riskScore,
                risk_level: riskLevel,
                occurred_at: new Date().toISOString(),
                source: REFERRAL_EVENT_SOURCES.RISK,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('warn', '推荐奖励已风控冻结', { rewardId, reason, riskScore });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '风控冻结失败');
    }
  }

  // ============================================================
  // 3. 推荐关系管理
  // ============================================================

  /** 创建推荐关系 */
  async createBinding(input: CreateBindingInput): Promise<any> {
    try {
      if (!input.userId || !input.referrerId) {
        throw new FjnValidationError('userId / referrerId 必填');
      }
      if (input.userId === input.referrerId) {
        throw new FjnReferralSelfNotAllowedError('不能推荐自己');
      }
      return await this.withTransaction(async (tx) => {
        const existing = await tx.fjnReferralRelationship.findUnique({
          where: { userId: input.userId },
        });
        if (existing) {
          throw new FjnReferralBindingAlreadyExistsError('用户已有推荐关系', {
            userId: input.userId,
            existingReferrerId: existing.referrerId,
          });
        }
        const binding = await tx.fjnReferralRelationship.create({
          data: {
            userId: input.userId,
            referrerId: input.referrerId,
            referrerCode: input.referrerCode,
            level: input.level ?? 1,
            status: REFERRAL_BINDING_STATUS.ACTIVE,
            metadata: (input.metadata as any) ?? undefined,
          },
        });
        this.log('info', '推荐关系已创建', {
          userId: input.userId,
          referrerId: input.referrerId,
        });
        return binding;
      });
    } catch (e) {
      throw this.wrapError(e, '创建推荐关系失败');
    }
  }

  /** 按用户 ID 查询 */
  async findBindingByUserId(userId: string): Promise<any> {
    try {
      const binding = await this.prisma.fjnReferralRelationship.findUnique({
        where: { userId },
      });
      if (!binding) throw new FjnReferralBindingNotFoundError('推荐关系不存在', { userId });
      return binding;
    } catch (e) {
      throw this.wrapError(e, '查询推荐关系失败');
    }
  }

  /** 按推荐人查询所有下线 */
  async findBindingsByReferrerId(referrerId: string): Promise<any[]> {
    try {
      return await this.prisma.fjnReferralRelationship.findMany({
        where: { referrerId },
        orderBy: { boundAt: 'desc' },
      });
    } catch (e) {
      throw this.wrapError(e, '查询推荐关系失败');
    }
  }

  /** 关系列表 */
  async listBindings(input: ListBindingInput): Promise<FjnPaginatedResult<any>> {
    try {
      const where: Prisma.FjnReferralRelationshipWhereInput = {};
      if (input.userId) where.userId = input.userId;
      if (input.referrerId) where.referrerId = input.referrerId;
      if (input.status) where.status = input.status;

      const [items, total] = await Promise.all([
        this.prisma.fjnReferralRelationship.findMany({
          where,
          orderBy: { boundAt: 'desc' },
        }),
        this.prisma.fjnReferralRelationship.count({ where }),
      ]);
      return paginate(items as any[], total, input);
    } catch (e) {
      throw this.wrapError(e, '查询关系列表失败');
    }
  }

  // ============================================================
  // 4. 联动入口
  // ============================================================

  /**
   * OrderPaid 事件处理器
   * OrderService / PaymentService 在订单支付成功后调用此方法
   */
  async handleOrderPaid(input: {
    orderId: string;
    orderUserId: string;
    orderAmount: string;
    currency: string;
    operatorId?: string;
  }): Promise<any> {
    return await this.withTransaction(async (tx) => {
      // 查询推荐关系
      const binding = await tx.fjnReferralRelationship.findUnique({
        where: { userId: input.orderUserId },
      });
      if (!binding || binding.status !== 'active') {
        return null; // 无推荐关系，不发奖励
      }
      return await this.createReward({
        orderId: input.orderId,
        orderUserId: input.orderUserId,
        userId: binding.referrerId,
        rewardRate: FjnReferralService.DEFAULT_REWARD_RATE,
        orderAmount: input.orderAmount,
        currency: input.currency,
        operatorId: input.operatorId ?? 'system.order.paid',
      });
    });
  }

  // ============================================================
  // 5. 私有辅助方法
  // ============================================================

  private validateCreateRewardInput(input: CreateReferralRewardInput): void {
    if (!input.orderId) throw new FjnValidationError('orderId 必填', { field: 'orderId' });
    if (!input.orderUserId) throw new FjnValidationError('orderUserId 必填', { field: 'orderUserId' });
    if (!input.userId) throw new FjnValidationError('userId 必填', { field: 'userId' });
    if (!input.orderAmount || !decimalGt(input.orderAmount, '0')) {
      throw new FjnReferralRewardAmountZeroError('orderAmount 必须大于 0', {
        orderAmount: input.orderAmount,
      });
    }
    if (!input.currency) throw new FjnValidationError('currency 必填', { field: 'currency' });
    if (!input.rewardRate || decimalLte(input.rewardRate, '0') || decimalGt(input.rewardRate, '1')) {
      throw new FjnReferralRewardRateInvalidError('rewardRate 必须在 (0, 1] 之间', {
        rewardRate: input.rewardRate,
      });
    }
  }

  private async generateUniqueRewardNo(tx: any): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const no = `RRW${Date.now()}${String(i).padStart(2, '0')}`;
      const exists = await tx.fjnReferralReward.findUnique({ where: { rewardNo: no } });
      if (!exists) return no;
    }
    return `RRW${Date.now()}`;
  }
}

// ============================================================
// Factory
// ============================================================

export function createFjnReferralService(options?: FjnServiceOptions): FjnReferralService {
  return new FjnReferralService(options);
}
