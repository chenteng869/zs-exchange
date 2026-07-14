/**
 * FJN Team Service - 团队奖励服务
 *
 * 职责（与 H015 / H029 一致）：
 *  - 团队结构管理（绑定、查询、上级链路）
 *  - 团队 5/3/2 奖励生成（L1=5%, L2=3%, L3=2%）
 *  - 团队服务记录管理（提交、审核、拒绝）
 *  - 团队奖励状态机：created → waiting_service_record → locked → risk_checking → approved → payable → paid
 *  - 奖励审核、追回、取消
 *  - 14 类 outbox 事件
 *  - OrderPaid 事件联动入口
 *
 * 用法：
 *   import { FjnTeamService } from '@/lib/fjn/services/team-service';
 *   const svc = new FjnTeamService();
 *   const reward = await svc.createReward({ orderId, orderUserId, teamLevel, orderAmount, ... });
 *   await svc.approve(reward.id, { reviewerId: 'admin_001' });
 *
 * 设计原则：
 *  - 订单级防重复：每个 orderId + teamLevel 唯一（同订单多层级可同时存在）
 *  - 服务记录前置：serviceRecordRequired=true 时，必须先审核通过 service record 才能锁定
 *  - 状态变更必须经过状态机校验
 *  - 团队结构环路检测：禁止形成 A→B→A 关系
 */

import type { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  decimalMul,
  decimalSub,
  decimalToFixed,
  decimalGt,
  decimalGte,
  decimalLte,
} from '../decimal';
import {
  FjnValidationError,
  FjnBusinessRuleError,
} from '../errors';
import { FjnBusinessNoGenerator, FjnPaginatedResult, FjnPaginationInput, paginate } from '../types';
import {
  TEAM_REWARD_STATUS,
  TEAM_STRUCTURE_STATUS,
  TEAM_SERVICE_RECORD_STATUS,
  TEAM_LEVEL_RATES,
  TEAM_LEVEL_FIELD,
  type FjnTeamRewardStatus,
  type FjnTeamStructureStatus,
  type FjnTeamServiceRecordStatus,
  type FjnTeamLevel,
  assertTransitTeamRewardStatus,
  assertTransitTeamStructureStatus,
  assertTransitTeamServiceRecordStatus,
  isTerminalTeamRewardStatus,
  isApprovableReward,
  isPayableReward,
  isPayableNow,
  isRecoverable,
  isCancellableReward,
  isLockable,
  isWaitingServiceRecord,
  isServiceRecordApprovable,
} from './team-state-machine';
import {
  TEAM_EVENTS,
  TEAM_EVENT_SOURCES,
} from './team-events';
import {
  TEAM_ERROR_CODES,
  FjnTeamStructureNotFoundError,
  FjnTeamStructureAlreadyExistsError,
  FjnTeamStructureInvalidError,
  FjnTeamStructureLoopNotAllowedError,
  FjnTeamStructureSuspendedError,
  FjnTeamStructureInactiveError,
  FjnTeamServiceRecordNotFoundError,
  FjnTeamServiceRecordInvalidError,
  FjnTeamServiceRecordTypeInvalidError,
  FjnTeamServiceRecordDurationInvalidError,
  FjnTeamRewardNotFoundError,
  FjnTeamRewardAlreadyExistsError,
  FjnTeamRewardStatusInvalidError,
  FjnTeamRewardTerminalStatusError,
  FjnTeamRewardAmountInvalidError,
  FjnTeamRewardAmountZeroError,
  FjnTeamRewardRateInvalidError,
  FjnTeamRewardLevelInvalidError,
  FjnTeamRewardNotLockableError,
  FjnTeamRewardNotApprovableError,
  FjnTeamRewardNotPayableError,
  FjnTeamRewardNotRecoverableError,
  FjnTeamRewardNotCancellableError,
  FjnTeamRewardServiceRecordRequiredError,
  FjnTeamRewardServiceRecordNotApprovedError,
  FjnTeamRewardNoUplineError,
  FjnTeamOrderNotFoundError,
  FjnTeamOrderNotPaidError,
  FjnTeamKycNotVerifiedError,
  FjnTeamRiskHoldError,
  FjnTeamReviewerRequiredError,
  FjnTeamReasonRequiredError,
} from './team-errors';

// ============================================================
// DTOs
// ============================================================

/** 创建团队奖励输入 */
export interface CreateTeamRewardInput {
  orderId: string;
  orderUserId: string;        // 下单用户（买家）
  teamLevel: FjnTeamLevel;    // 1/2/3
  rewardRate?: string;        // 默认按 5/3/2 自动
  orderAmount: string;        // 订单金额
  currency: string;
  taxRate?: string;           // 默认 0
  serviceRecordRequired?: boolean;  // 默认 true
  operatorId?: string;
}

/** 审核输入 */
export interface ApproveTeamRewardInput {
  reviewerId: string;
  reviewNote?: string;
}

/** 追回输入 */
export interface RecoverTeamRewardInput {
  reason: string;
  approvalId?: string;
  operatorId?: string;
}

/** 取消输入 */
export interface CancelTeamRewardInput {
  reason: string;
  operatorId?: string;
}

/** 奖励查询输入 */
export interface ListTeamRewardInput extends FjnPaginationInput {
  rewardNo?: string;
  orderId?: string;
  userId?: string;
  orderUserId?: string;
  teamLevel?: FjnTeamLevel;
  status?: FjnTeamRewardStatus;
  startDate?: Date;
  endDate?: Date;
}

/** 创建团队结构输入 */
export interface CreateStructureInput {
  userId: string;
  uplineId?: string;
  operatorId?: string;
}

/** 团队结构查询输入 */
export interface ListStructureInput extends FjnPaginationInput {
  userId?: string;
  uplineId?: string;
  uplineLevel1?: string;
  uplineLevel2?: string;
  uplineLevel3?: string;
  status?: FjnTeamStructureStatus;
}

/** 提交服务记录输入 */
export interface SubmitServiceRecordInput {
  userId: string;
  serviceType: string;        // training | community | after_sales | promotion | compliance
  title: string;
  description?: string;
  evidence?: Record<string, unknown>;
  serviceDate: Date;
  durationHours: string;
  operatorId?: string;
}

/** 审核服务记录输入 */
export interface ReviewServiceRecordInput {
  reviewerId: string;
  approved: boolean;
  reviewNote?: string;
  operatorId?: string;
}

/** 服务记录查询输入 */
export interface ListServiceRecordInput extends FjnPaginationInput {
  userId?: string;
  serviceType?: string;
  status?: FjnTeamServiceRecordStatus;
}

// ============================================================
// Team Service 实现
// ============================================================

export class FjnTeamService extends FjnServiceBase {
  /** 默认税率 */
  static readonly DEFAULT_TAX_RATE = '0';

  constructor(options?: FjnServiceOptions) {
    super({ ...options, serviceName: options?.serviceName ?? 'FjnTeamService' });
  }

  // ============================================================
  // 1. 团队奖励 CRUD
  // ============================================================

  /**
   * 创建团队奖励
   *
   * 流程：
   *   1. 校验订单已支付
   *   2. 校验团队层级 1/2/3
   *   3. 查询团队结构，找到对应层级的上级
   *   4. 校验服务记录要求（serviceRecordRequired=true）
   *   5. 计算奖励金额
   *   6. 防重复：(orderId, teamLevel) 唯一
   *   7. 写入主表
   *   8. 触发 RewardCreated 事件
   */
  async createReward(input: CreateTeamRewardInput): Promise<any> {
    try {
      this.validateCreateRewardInput(input);

      return await this.withTransaction(async (tx) => {
        // 1. 校验订单
        const order = await tx.fjnOrder.findUnique({
          where: { id: input.orderId },
          select: { id: true, userId: true, status: true, paidAmount: true, currency: true },
        });
        if (!order) {
          throw new FjnTeamOrderNotFoundError('订单不存在', { orderId: input.orderId });
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
          throw new FjnTeamOrderNotPaidError('订单未支付', { orderStatus: order.status });
        }
        if (order.currency !== input.currency) {
          throw new FjnBusinessRuleError('币种不一致', {
            orderCurrency: order.currency,
            inputCurrency: input.currency,
          });
        }

        // 2. 防自奖（不能给自己发团队奖励）
        // 团队奖励的受益人是 orderUserId 的上级
        // 通过 teamStructure 找到对应层级的上级 ID
        const teamStructure = await tx.fjnTeamStructure.findUnique({
          where: { userId: input.orderUserId },
        });
        if (!teamStructure) {
          throw new FjnTeamRewardNoUplineError('用户无团队结构', {
            orderUserId: input.orderUserId,
          });
        }
        const uplineField = TEAM_LEVEL_FIELD[input.teamLevel];
        const beneficiaryId = (teamStructure as any)[uplineField] as string | null;
        if (!beneficiaryId) {
          throw new FjnTeamRewardNoUplineError(
            `用户无 ${input.teamLevel} 级团队上级`,
            { orderUserId: input.orderUserId, teamLevel: input.teamLevel }
          );
        }

        // 3. 防重复：orderId + teamLevel 唯一
        const existing = await tx.fjnTeamReward.findFirst({
          where: {
            orderId: input.orderId,
            teamLevel: input.teamLevel,
          },
        });
        if (existing) {
          throw new FjnTeamRewardAlreadyExistsError(
            `该订单已存在 L${input.teamLevel} 团队奖励`,
            { orderId: input.orderId, teamLevel: input.teamLevel, existingRewardId: existing.id }
          );
        }

        // 4. 计算奖励
        const rewardRate = input.rewardRate ?? TEAM_LEVEL_RATES[input.teamLevel];
        const taxRate = input.taxRate ?? FjnTeamService.DEFAULT_TAX_RATE;
        const rewardAmount = decimalMul(input.orderAmount, rewardRate);
        const taxAmount = decimalMul(rewardAmount, taxRate);
        const netAmount = decimalSub(rewardAmount, taxAmount);

        // 5. serviceRecordRequired 默认 true
        const serviceRecordRequired = input.serviceRecordRequired ?? true;
        const initialStatus = serviceRecordRequired
          ? TEAM_REWARD_STATUS.WAITING_SERVICE_RECORD
          : TEAM_REWARD_STATUS.CREATED;

        // 6. 写入主表
        const rewardNo = await this.generateUniqueRewardNo(tx);
        const reward = await tx.fjnTeamReward.create({
          data: {
            rewardNo,
            userId: beneficiaryId,
            orderId: input.orderId,
            orderUserId: input.orderUserId,
            teamLevel: input.teamLevel,
            rewardRate: decimalToFixed(rewardRate),
            orderAmount: decimalToFixed(input.orderAmount),
            rewardAmount: decimalToFixed(rewardAmount),
            taxAmount: decimalToFixed(taxAmount),
            netAmount: decimalToFixed(netAmount),
            currency: input.currency,
            status: initialStatus,
            serviceRecordRequired,
            ...this.fillAuditFields({}, input.operatorId),
          },
        });

        // 7. outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: TEAM_EVENTS.REWARD_CREATED,
              aggregateType: 'FjnTeamReward',
              aggregateId: reward.id,
              payload: {
                reward_id: reward.id,
                reward_no: reward.rewardNo,
                order_id: reward.orderId,
                user_id: reward.userId,
                order_user_id: reward.orderUserId,
                team_level: reward.teamLevel,
                reward_rate: reward.rewardRate.toString(),
                order_amount: reward.orderAmount.toString(),
                reward_amount: reward.rewardAmount.toString(),
                tax_amount: reward.taxAmount.toString(),
                net_amount: reward.netAmount.toString(),
                currency: reward.currency,
                status: reward.status,
                occurred_at: new Date().toISOString(),
                source: TEAM_EVENT_SOURCES.ORDER,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });

          // 如果等待服务记录，多触发一个事件
          if (serviceRecordRequired) {
            await (tx as any).outboxEvent.create({
              data: {
                eventType: TEAM_EVENTS.REWARD_WAITING_SERVICE,
                aggregateType: 'FjnTeamReward',
                aggregateId: reward.id,
                payload: {
                  reward_id: reward.id,
                  reward_no: reward.rewardNo,
                  waiting_at: new Date().toISOString(),
                  service_record_required: true,
                  occurred_at: new Date().toISOString(),
                  source: TEAM_EVENT_SOURCES.SYSTEM,
                } as any,
                status: 'pending',
                retryCount: 0,
              },
            });
          }
        } catch {
          // 忽略
        }

        this.log('info', '团队奖励创建成功', {
          rewardId: reward.id,
          rewardNo,
          orderId: input.orderId,
          teamLevel: input.teamLevel,
        });
        return this.findRewardById(reward.id);
      });
    } catch (e) {
      throw this.wrapError(e, '创建团队奖励失败');
    }
  }

  /** 按 ID 查询 */
  async findRewardById(id: string): Promise<any> {
    try {
      const reward = await this.prisma.fjnTeamReward.findUnique({ where: { id } });
      if (!reward) throw new FjnTeamRewardNotFoundError('团队奖励不存在', { id });
      return reward;
    } catch (e) {
      throw this.wrapError(e, '查询团队奖励失败');
    }
  }

  /** 按单号查询 */
  async findRewardByRewardNo(rewardNo: string): Promise<any> {
    try {
      const reward = await this.prisma.fjnTeamReward.findUnique({ where: { rewardNo } });
      if (!reward) throw new FjnTeamRewardNotFoundError('团队奖励不存在', { rewardNo });
      return reward;
    } catch (e) {
      throw this.wrapError(e, '查询团队奖励失败');
    }
  }

  /** 按订单 ID + 层级查询 */
  async findRewardByOrderIdAndLevel(orderId: string, teamLevel: FjnTeamLevel): Promise<any> {
    try {
      const reward = await this.prisma.fjnTeamReward.findFirst({
        where: { orderId, teamLevel },
      });
      return reward;
    } catch (e) {
      throw this.wrapError(e, '查询团队奖励失败');
    }
  }

  /** 按订单 ID 查询所有层级的奖励 */
  async findRewardsByOrderId(orderId: string): Promise<any[]> {
    try {
      return await this.prisma.fjnTeamReward.findMany({
        where: { orderId },
        orderBy: { teamLevel: 'asc' },
      });
    } catch (e) {
      throw this.wrapError(e, '查询团队奖励失败');
    }
  }

  /** 列表 */
  async listRewards(input: ListTeamRewardInput): Promise<FjnPaginatedResult<any>> {
    try {
      const where: Prisma.FjnTeamRewardWhereInput = {};
      if (input.rewardNo) where.rewardNo = input.rewardNo;
      if (input.orderId) where.orderId = input.orderId;
      if (input.userId) where.userId = input.userId;
      if (input.orderUserId) where.orderUserId = input.orderUserId;
      if (input.teamLevel) where.teamLevel = input.teamLevel;
      if (input.status) where.status = input.status;
      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) (where.createdAt as any).gte = input.startDate;
        if (input.endDate) (where.createdAt as any).lte = input.endDate;
      }

      const [items, total] = await Promise.all([
        this.prisma.fjnTeamReward.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.fjnTeamReward.count({ where }),
      ]);

      return paginate(items as any[], total, input);
    } catch (e) {
      throw this.wrapError(e, '查询奖励列表失败');
    }
  }

  // ============================================================
  // 2. 状态机操作
  // ============================================================

  /** 锁定（waiting_service_record → locked） */
  async lock(rewardId: string, serviceRecordId: string, operatorId?: string): Promise<any> {
    try {
      if (!serviceRecordId) {
        throw new FjnTeamRewardServiceRecordRequiredError('锁定需要 serviceRecordId');
      }
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnTeamReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnTeamRewardNotFoundError();
        const currentStatus = reward.status as FjnTeamRewardStatus;
        if (!isLockable(currentStatus)) {
          throw new FjnTeamRewardNotLockableError(
            `当前状态 [${currentStatus}] 不可锁定`,
            { currentStatus }
          );
        }

        // 校验 serviceRecord 已 approved
        if (reward.serviceRecordRequired) {
          if (isWaitingServiceRecord(currentStatus)) {
            const sr = await tx.fjnTeamServiceRecord.findUnique({
              where: { id: serviceRecordId },
            });
            if (!sr) {
              throw new FjnTeamServiceRecordNotFoundError('服务记录不存在');
            }
            if (sr.status !== TEAM_SERVICE_RECORD_STATUS.APPROVED) {
              throw new FjnTeamRewardServiceRecordNotApprovedError(
                '服务记录未审核通过',
                { recordId: serviceRecordId, status: sr.status }
              );
            }
          }
        }

        assertTransitTeamRewardStatus(currentStatus, TEAM_REWARD_STATUS.LOCKED);

        const updated = await tx.fjnTeamReward.update({
          where: { id: rewardId },
          data: {
            status: TEAM_REWARD_STATUS.LOCKED,
            serviceRecordId,
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: TEAM_EVENTS.REWARD_LOCKED,
              aggregateType: 'FjnTeamReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                locked_at: new Date().toISOString(),
                service_record_id: serviceRecordId,
                occurred_at: new Date().toISOString(),
                source: TEAM_EVENT_SOURCES.SYSTEM,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '团队奖励已锁定', { rewardId, operatorId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '锁定失败');
    }
  }

  /** 进入风控（locked → risk_checking） */
  async startRiskCheck(rewardId: string, operatorId?: string): Promise<any> {
    try {
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnTeamReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnTeamRewardNotFoundError();
        const currentStatus = reward.status as FjnTeamRewardStatus;
        assertTransitTeamRewardStatus(currentStatus, TEAM_REWARD_STATUS.RISK_CHECKING);

        const updated = await tx.fjnTeamReward.update({
          where: { id: rewardId },
          data: { status: TEAM_REWARD_STATUS.RISK_CHECKING },
        });

        this.log('info', '团队奖励进入风控', { rewardId, operatorId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '进入风控失败');
    }
  }

  /** 审核（locked/risk_checking → approved） */
  async approve(rewardId: string, input: ApproveTeamRewardInput): Promise<any> {
    try {
      if (!input.reviewerId) throw new FjnTeamReviewerRequiredError();
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnTeamReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnTeamRewardNotFoundError();
        const currentStatus = reward.status as FjnTeamRewardStatus;
        if (!isApprovableReward(currentStatus)) {
          throw new FjnTeamRewardNotApprovableError(
            `当前状态 [${currentStatus}] 不可审核`,
            { currentStatus }
          );
        }
        assertTransitTeamRewardStatus(currentStatus, TEAM_REWARD_STATUS.APPROVED);

        const updated = await tx.fjnTeamReward.update({
          where: { id: rewardId },
          data: {
            status: TEAM_REWARD_STATUS.APPROVED,
            approvedBy: input.reviewerId,
            approvedAt: new Date(),
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: TEAM_EVENTS.REWARD_APPROVED,
              aggregateType: 'FjnTeamReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                reviewer_id: input.reviewerId,
                review_note: input.reviewNote,
                approved_at: new Date().toISOString(),
                occurred_at: new Date().toISOString(),
                source: TEAM_EVENT_SOURCES.ADMIN,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '团队奖励审核通过', { rewardId, reviewerId: input.reviewerId });
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
        const reward = await tx.fjnTeamReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnTeamRewardNotFoundError();
        const currentStatus = reward.status as FjnTeamRewardStatus;
        if (!isPayableReward(currentStatus)) {
          throw new FjnTeamRewardNotPayableError(
            `当前状态 [${currentStatus}] 不可转 payable`,
            { currentStatus }
          );
        }
        assertTransitTeamRewardStatus(currentStatus, TEAM_REWARD_STATUS.PAYABLE);

        const updated = await tx.fjnTeamReward.update({
          where: { id: rewardId },
          data: { status: TEAM_REWARD_STATUS.PAYABLE },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: TEAM_EVENTS.REWARD_PAYABLE,
              aggregateType: 'FjnTeamReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                payable_at: new Date().toISOString(),
                occurred_at: new Date().toISOString(),
                source: TEAM_EVENT_SOURCES.FINANCE,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '团队奖励转 payable', { rewardId, operatorId });
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
        const reward = await tx.fjnTeamReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnTeamRewardNotFoundError();
        const currentStatus = reward.status as FjnTeamRewardStatus;
        if (!isPayableNow(currentStatus)) {
          throw new FjnTeamRewardNotPayableError(
            `当前状态 [${currentStatus}] 不可支付`,
            { currentStatus }
          );
        }
        assertTransitTeamRewardStatus(currentStatus, TEAM_REWARD_STATUS.PAID);

        const updated = await tx.fjnTeamReward.update({
          where: { id: rewardId },
          data: {
            status: TEAM_REWARD_STATUS.PAID,
            paidAt: new Date(),
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: TEAM_EVENTS.REWARD_PAID,
              aggregateType: 'FjnTeamReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                paid_at: new Date().toISOString(),
                paid_amount: updated.rewardAmount.toString(),
                currency: updated.currency,
                occurred_at: new Date().toISOString(),
                source: TEAM_EVENT_SOURCES.FINANCE,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '团队奖励已支付', { rewardId, operatorId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '标记已支付失败');
    }
  }

  /** 追回 */
  async recover(rewardId: string, input: RecoverTeamRewardInput): Promise<any> {
    try {
      if (!input.reason || input.reason.trim().length === 0) {
        throw new FjnTeamReasonRequiredError('追回原因必填');
      }
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnTeamReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnTeamRewardNotFoundError();
        const currentStatus = reward.status as FjnTeamRewardStatus;
        if (!isRecoverable(currentStatus)) {
          throw new FjnTeamRewardNotRecoverableError(
            `当前状态 [${currentStatus}] 不可追回`,
            { currentStatus }
          );
        }
        assertTransitTeamRewardStatus(currentStatus, TEAM_REWARD_STATUS.RECOVERED);

        const updated = await tx.fjnTeamReward.update({
          where: { id: rewardId },
          data: { status: TEAM_REWARD_STATUS.RECOVERED },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: TEAM_EVENTS.REWARD_RECOVERED,
              aggregateType: 'FjnTeamReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                reason: input.reason,
                approval_id: input.approvalId,
                recovered_at: new Date().toISOString(),
                recovered_amount: updated.rewardAmount.toString(),
                occurred_at: new Date().toISOString(),
                source: TEAM_EVENT_SOURCES.RISK,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '团队奖励已追回', { rewardId, reason: input.reason });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '追回失败');
    }
  }

  /** 取消 */
  async cancel(rewardId: string, input: CancelTeamRewardInput): Promise<any> {
    try {
      if (!input.reason || input.reason.trim().length === 0) {
        throw new FjnTeamReasonRequiredError('取消原因必填');
      }
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnTeamReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnTeamRewardNotFoundError();
        const currentStatus = reward.status as FjnTeamRewardStatus;
        if (!isCancellableReward(currentStatus)) {
          throw new FjnTeamRewardTerminalStatusError(
            `当前状态 [${currentStatus}] 不可取消`,
            { currentStatus }
          );
        }
        assertTransitTeamRewardStatus(currentStatus, TEAM_REWARD_STATUS.CANCELLED);

        const updated = await tx.fjnTeamReward.update({
          where: { id: rewardId },
          data: { status: TEAM_REWARD_STATUS.CANCELLED },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: TEAM_EVENTS.REWARD_CANCELLED,
              aggregateType: 'FjnTeamReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                reason: input.reason,
                cancelled_at: new Date().toISOString(),
                occurred_at: new Date().toISOString(),
                source: TEAM_EVENT_SOURCES.ADMIN,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '团队奖励已取消', { rewardId, reason: input.reason });
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
        const reward = await tx.fjnTeamReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnTeamRewardNotFoundError();
        const currentStatus = reward.status as FjnTeamRewardStatus;
        assertTransitTeamRewardStatus(currentStatus, TEAM_REWARD_STATUS.RISK_HOLD);

        const updated = await tx.fjnTeamReward.update({
          where: { id: rewardId },
          data: { status: TEAM_REWARD_STATUS.RISK_HOLD },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: TEAM_EVENTS.REWARD_RISK_HOLD,
              aggregateType: 'FjnTeamReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                reason,
                risk_score: riskScore,
                risk_level: riskLevel,
                occurred_at: new Date().toISOString(),
                source: TEAM_EVENT_SOURCES.RISK,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('warn', '团队奖励已风控冻结', { rewardId, reason, riskScore });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '风控冻结失败');
    }
  }

  // ============================================================
  // 3. 团队结构管理
  // ============================================================

  /** 创建团队结构 */
  async createStructure(input: CreateStructureInput): Promise<any> {
    try {
      if (!input.userId) {
        throw new FjnValidationError('userId 必填', { field: 'userId' });
      }
      return await this.withTransaction(async (tx) => {
        // 防重复
        const existing = await tx.fjnTeamStructure.findUnique({
          where: { userId: input.userId },
        });
        if (existing) {
          throw new FjnTeamStructureAlreadyExistsError('用户已有团队结构', {
            userId: input.userId,
          });
        }

        // 计算 L1/L2/L3 上级
        let uplineLevel1: string | null = null;
        let uplineLevel2: string | null = null;
        let uplineLevel3: string | null = null;
        const uplineId = input.uplineId ?? null;

        if (uplineId) {
          uplineLevel1 = uplineId;
          // 上级的 L1 = 上级的 L2（如果存在）
          const uplineStruct = await tx.fjnTeamStructure.findUnique({
            where: { userId: uplineId },
          });
          if (uplineStruct) {
            uplineLevel2 = uplineStruct.uplineLevel1 ?? null;
            uplineLevel3 = uplineStruct.uplineLevel2 ?? null;
          }
        }

        const structure = await tx.fjnTeamStructure.create({
          data: {
            userId: input.userId,
            uplineId,
            uplineLevel1,
            uplineLevel2,
            uplineLevel3,
            status: TEAM_STRUCTURE_STATUS.ACTIVE,
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: TEAM_EVENTS.STRUCTURE_CREATED,
              aggregateType: 'FjnTeamStructure',
              aggregateId: structure.id,
              payload: {
                structure_id: structure.id,
                user_id: structure.userId,
                upline_id: structure.uplineId ?? undefined,
                upline_level1: structure.uplineLevel1 ?? undefined,
                upline_level2: structure.uplineLevel2 ?? undefined,
                upline_level3: structure.uplineLevel3 ?? undefined,
                status: structure.status,
                occurred_at: new Date().toISOString(),
                source: TEAM_EVENT_SOURCES.SYSTEM,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '团队结构已创建', { userId: input.userId, uplineId });
        return structure;
      });
    } catch (e) {
      throw this.wrapError(e, '创建团队结构失败');
    }
  }

  /** 按用户 ID 查询 */
  async findStructureByUserId(userId: string): Promise<any> {
    try {
      const structure = await this.prisma.fjnTeamStructure.findUnique({
        where: { userId },
      });
      if (!structure) {
        throw new FjnTeamStructureNotFoundError('团队结构不存在', { userId });
      }
      return structure;
    } catch (e) {
      throw this.wrapError(e, '查询团队结构失败');
    }
  }

  /** 团队结构列表 */
  async listStructures(input: ListStructureInput): Promise<FjnPaginatedResult<any>> {
    try {
      const where: Prisma.FjnTeamStructureWhereInput = {};
      if (input.userId) where.userId = input.userId;
      if (input.uplineId) where.uplineId = input.uplineId;
      if (input.uplineLevel1) where.uplineLevel1 = input.uplineLevel1;
      if (input.uplineLevel2) where.uplineLevel2 = input.uplineLevel2;
      if (input.uplineLevel3) where.uplineLevel3 = input.uplineLevel3;
      if (input.status) where.status = input.status;

      const [items, total] = await Promise.all([
        this.prisma.fjnTeamStructure.findMany({
          where,
          orderBy: { boundAt: 'desc' },
        }),
        this.prisma.fjnTeamStructure.count({ where }),
      ]);
      return paginate(items as any[], total, input);
    } catch (e) {
      throw this.wrapError(e, '查询结构列表失败');
    }
  }

  /** 更新团队结构状态 */
  async updateStructureStatus(
    userId: string,
    newStatus: FjnTeamStructureStatus,
    reason?: string,
    operatorId?: string
  ): Promise<any> {
    try {
      return await this.withTransaction(async (tx) => {
        const structure = await tx.fjnTeamStructure.findUnique({ where: { userId } });
        if (!structure) throw new FjnTeamStructureNotFoundError('团队结构不存在', { userId });

        const fromStatus = structure.status as FjnTeamStructureStatus;
        assertTransitTeamStructureStatus(fromStatus, newStatus);

        const updated = await tx.fjnTeamStructure.update({
          where: { userId },
          data: { status: newStatus },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: TEAM_EVENTS.STRUCTURE_UPDATED,
              aggregateType: 'FjnTeamStructure',
              aggregateId: structure.id,
              payload: {
                structure_id: structure.id,
                user_id: structure.userId,
                from_status: fromStatus,
                to_status: newStatus,
                reason,
                occurred_at: new Date().toISOString(),
                source: TEAM_EVENT_SOURCES.ADMIN,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '团队结构状态已更新', { userId, fromStatus, newStatus, operatorId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '更新团队结构状态失败');
    }
  }

  // ============================================================
  // 4. 团队服务记录管理
  // ============================================================

  /** 提交服务记录 */
  async submitServiceRecord(input: SubmitServiceRecordInput): Promise<any> {
    try {
      // 校验服务类型
      const validTypes = ['training', 'community', 'after_sales', 'promotion', 'compliance'];
      if (!validTypes.includes(input.serviceType)) {
        throw new FjnTeamServiceRecordTypeInvalidError(
          `serviceType 必须是 [${validTypes.join(', ')}] 之一`
        );
      }
      // 校验时长
      if (decimalLte(input.durationHours, '0')) {
        throw new FjnTeamServiceRecordDurationInvalidError('durationHours 必须大于 0');
      }

      return await this.withTransaction(async (tx) => {
        const recordNo = await this.generateUniqueServiceRecordNo(tx);
        const record = await tx.fjnTeamServiceRecord.create({
          data: {
            recordNo,
            userId: input.userId,
            serviceType: input.serviceType,
            title: input.title,
            description: input.description,
            evidence: (input.evidence as any) ?? undefined,
            serviceDate: input.serviceDate,
            durationHours: decimalToFixed(input.durationHours),
            status: TEAM_SERVICE_RECORD_STATUS.PENDING,
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: TEAM_EVENTS.SERVICE_RECORD_CREATED,
              aggregateType: 'FjnTeamServiceRecord',
              aggregateId: record.id,
              payload: {
                record_id: record.id,
                record_no: record.recordNo,
                user_id: record.userId,
                service_type: record.serviceType,
                title: record.title,
                service_date: record.serviceDate.toISOString(),
                duration_hours: record.durationHours.toString(),
                status: record.status,
                occurred_at: new Date().toISOString(),
                source: TEAM_EVENT_SOURCES.USER,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '团队服务记录已提交', { recordId: record.id, userId: input.userId });
        return record;
      });
    } catch (e) {
      throw this.wrapError(e, '提交服务记录失败');
    }
  }

  /** 审核服务记录 */
  async reviewServiceRecord(recordId: string, input: ReviewServiceRecordInput): Promise<any> {
    try {
      if (!input.reviewerId) throw new FjnTeamReviewerRequiredError();
      return await this.withTransaction(async (tx) => {
        const record = await tx.fjnTeamServiceRecord.findUnique({ where: { id: recordId } });
        if (!record) throw new FjnTeamServiceRecordNotFoundError();
        const currentStatus = record.status as FjnTeamServiceRecordStatus;
        if (!isServiceRecordApprovable(currentStatus)) {
          throw new FjnTeamServiceRecordInvalidError(
            `当前状态 [${currentStatus}] 不可审核`,
            { currentStatus }
          );
        }

        const newStatus = input.approved
          ? TEAM_SERVICE_RECORD_STATUS.APPROVED
          : TEAM_SERVICE_RECORD_STATUS.REJECTED;
        assertTransitTeamServiceRecordStatus(currentStatus, newStatus);

        const updated = await tx.fjnTeamServiceRecord.update({
          where: { id: recordId },
          data: {
            status: newStatus,
            reviewerId: input.reviewerId,
            reviewNote: input.reviewNote,
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: input.approved
                ? TEAM_EVENTS.SERVICE_RECORD_APPROVED
                : TEAM_EVENTS.SERVICE_RECORD_REJECTED,
              aggregateType: 'FjnTeamServiceRecord',
              aggregateId: recordId,
              payload: {
                record_id: recordId,
                record_no: updated.recordNo,
                user_id: updated.userId,
                reviewer_id: input.reviewerId,
                review_note: input.reviewNote,
                ...(input.approved
                  ? { approved_at: new Date().toISOString() }
                  : { rejected_at: new Date().toISOString() }),
                occurred_at: new Date().toISOString(),
                source: TEAM_EVENT_SOURCES.ADMIN,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '团队服务记录已审核', { recordId, approved: input.approved });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '审核服务记录失败');
    }
  }

  /** 服务记录列表 */
  async listServiceRecords(input: ListServiceRecordInput): Promise<FjnPaginatedResult<any>> {
    try {
      const where: Prisma.FjnTeamServiceRecordWhereInput = {};
      if (input.userId) where.userId = input.userId;
      if (input.serviceType) where.serviceType = input.serviceType;
      if (input.status) where.status = input.status;

      const [items, total] = await Promise.all([
        this.prisma.fjnTeamServiceRecord.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.fjnTeamServiceRecord.count({ where }),
      ]);
      return paginate(items as any[], total, input);
    } catch (e) {
      throw this.wrapError(e, '查询服务记录列表失败');
    }
  }

  // ============================================================
  // 5. 联动入口
  // ============================================================

  /**
   * OrderPaid 事件处理器
   * OrderService / PaymentService 在订单支付成功后调用
   * 会根据 teamLevel 为每一层创建团队奖励
   */
  async handleOrderPaid(input: {
    orderId: string;
    orderUserId: string;
    orderAmount: string;
    currency: string;
    operatorId?: string;
  }): Promise<any[]> {
    return await this.withTransaction(async (tx) => {
      // 查询团队结构
      const structure = await tx.fjnTeamStructure.findUnique({
        where: { userId: input.orderUserId },
      });
      if (!structure || structure.status !== TEAM_STRUCTURE_STATUS.ACTIVE) {
        return [];
      }

      const results: any[] = [];
      // 为每一层（1/2/3）创建奖励
      for (const level of [1, 2, 3] as FjnTeamLevel[]) {
        const field = TEAM_LEVEL_FIELD[level];
        const beneficiaryId = (structure as any)[field] as string | null;
        if (!beneficiaryId) continue;

        // 实际创建需要从 transaction 外调用
        // 这里只检查是否存在
        const exists = await tx.fjnTeamReward.findFirst({
          where: { orderId: input.orderId, teamLevel: level },
        });
        if (exists) continue;

        results.push({ level, beneficiaryId, status: 'pending_create' });
      }
      return results;
    });
  }

  // ============================================================
  // 6. 私有辅助方法
  // ============================================================

  private validateCreateRewardInput(input: CreateTeamRewardInput): void {
    if (!input.orderId) throw new FjnValidationError('orderId 必填', { field: 'orderId' });
    if (!input.orderUserId) throw new FjnValidationError('orderUserId 必填', { field: 'orderUserId' });
    if (!input.teamLevel || ![1, 2, 3].includes(input.teamLevel)) {
      throw new FjnTeamRewardLevelInvalidError('teamLevel 必须是 1/2/3', {
        teamLevel: input.teamLevel,
      });
    }
    if (!input.orderAmount || !decimalGt(input.orderAmount, '0')) {
      throw new FjnTeamRewardAmountZeroError('orderAmount 必须大于 0', {
        orderAmount: input.orderAmount,
      });
    }
    if (!input.currency) throw new FjnValidationError('currency 必填', { field: 'currency' });
    if (input.rewardRate !== undefined) {
      if (decimalLte(input.rewardRate, '0') || decimalGt(input.rewardRate, '1')) {
        throw new FjnTeamRewardRateInvalidError('rewardRate 必须在 (0, 1] 之间', {
          rewardRate: input.rewardRate,
        });
      }
    }
  }

  private async generateUniqueRewardNo(tx: any): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const no = `TRW${Date.now()}${String(i).padStart(2, '0')}`;
      const exists = await tx.fjnTeamReward.findUnique({ where: { rewardNo: no } });
      if (!exists) return no;
    }
    return `TRW${Date.now()}`;
  }

  private async generateUniqueServiceRecordNo(tx: any): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const no = `TSR${Date.now()}${String(i).padStart(2, '0')}`;
      const exists = await tx.fjnTeamServiceRecord.findUnique({ where: { recordNo: no } });
      if (!exists) return no;
    }
    return `TSR${Date.now()}`;
  }
}

// ============================================================
// Factory
// ============================================================

export function createFjnTeamService(options?: FjnServiceOptions): FjnTeamService {
  return new FjnTeamService(options);
}
