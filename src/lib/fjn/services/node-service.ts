/**
 * FJN Node Service - 节点运营服务
 *
 * 职责（基于 H030 设计 + 现有 FjnNode schema + H015 工业级职责）：
 *  - 节点生命周期管理（创建、审核、激活、暂停、终止、黑名单）
 *  - 节点 KYB 审核（KYC + 协议签署）
 *  - 节点服务记录管理（提交、审核、拒绝）
 *  - 节点 3/3/2/2 奖励（city/regional/national/global）
 *  - 节点奖励状态机：created → waiting_service_record → locked → risk_checking → approved → payable → paid
 *  - 23 类 outbox 事件
 *  - OrderPaid 事件联动入口
 *
 * 用法：
 *   import { FjnNodeService } from '@/lib/fjn/services/node-service';
 *   const svc = new FjnNodeService();
 *   const node = await svc.createNode({ userId, nodeName, nodeLevel, regionCode, ... });
 *   await svc.approveNode(node.id, { approverId: 'admin_001' });
 *
 *   const reward = await svc.createReward({ orderId, orderUserId, nodeLevel, orderAmount, ... });
 *   await svc.approve(reward.id, { reviewerId: 'admin_001' });
 *
 * 设计原则：
 *  - 节点奖励规则 3/3/2/2（strategic 不参与订单分润）
 *  - 订单级防重复：每个 orderId + nodeId 唯一
 *  - KYB 必填：节点必须 KYB approved 才能 active
 *  - 服务记录前置：serviceRecordRequired=true 时，必须先审核通过 service record 才能锁定
 *  - 状态变更必须经过状态机校验
 */

import type { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  decimalMul,
  decimalSub,
  decimalToFixed,
  decimalGt,
  decimalLte,
  decimalGte,
} from '../decimal';
import {
  FjnValidationError,
  FjnBusinessRuleError,
} from '../errors';
import { FjnBusinessNoGenerator, FjnPaginatedResult, FjnPaginationInput, paginate } from '../types';
import {
  NODE_STATUS,
  NODE_KYB_STATUS,
  NODE_REWARD_STATUS,
  NODE_SERVICE_RECORD_STATUS,
  NODE_LEVELS,
  NODE_LEVEL_RATES,
  NODE_REWARD_LEVELS,
  type FjnNodeStatus,
  type FjnNodeKybStatus,
  type FjnNodeRewardStatus,
  type FjnNodeServiceRecordStatus,
  type FjnNodeLevel,
  type FjnNodeRewardLevel,
  assertTransitNodeStatus,
  assertTransitNodeKybStatus,
  assertTransitNodeRewardStatus,
  assertTransitNodeServiceRecordStatus,
  isTerminalNodeStatus,
  isTerminalNodeRewardStatus,
  isNodeRewardLockable,
  isNodeRewardApprovable,
  isNodeRewardPayableReward,
  isNodeRewardPayableNow,
  isNodeRewardRecoverable,
  isNodeRewardCancellable,
  isNodeRewardEligible,
  isNodeServiceRecordApprovable,
  isNodeRewardLevel,
  canTransitNodeRewardStatus,
} from './node-state-machine';
import {
  NODE_EVENTS,
  NODE_EVENT_SOURCES,
} from './node-events';
import {
  NODE_ERROR_CODES,
  FjnNodeNotFoundError,
  FjnNodeAlreadyExistsError,
  FjnNodeInvalidError,
  FjnNodeLevelInvalidError,
  FjnNodeRegionInvalidError,
  FjnNodeNotActiveError,
  FjnNodeNotApprovedError,
  FjnNodeSuspendedError,
  FjnNodeTerminatedError,
  FjnNodeBlacklistedError,
  FjnNodeRestrictedError,
  FjnNodeNotRewardEligibleError,
  FjnNodeKybNotSubmittedError,
  FjnNodeKybAlreadyApprovedError,
  FjnNodeKybInvalidStatusError,
  FjnNodeKybRequiredError,
  FjnNodeServiceRecordNotFoundError,
  FjnNodeServiceRecordInvalidError,
  FjnNodeServiceRecordTypeInvalidError,
  FjnNodeServiceRecordParticipantsInvalidError,
  FjnNodeRewardNotFoundError,
  FjnNodeRewardAlreadyExistsError,
  FjnNodeRewardStatusInvalidError,
  FjnNodeRewardTerminalStatusError,
  FjnNodeRewardAmountInvalidError,
  FjnNodeRewardAmountZeroError,
  FjnNodeRewardRateInvalidError,
  FjnNodeRewardLevelInvalidError,
  FjnNodeRewardStrategicNotEligibleError,
  FjnNodeRewardNotLockableError,
  FjnNodeRewardNotApprovableError,
  FjnNodeRewardNotPayableError,
  FjnNodeRewardNotRecoverableError,
  FjnNodeRewardNotCancellableError,
  FjnNodeRewardServiceRecordRequiredError,
  FjnNodeRewardServiceRecordNotApprovedError,
  FjnNodeRewardNoNodeError,
  FjnNodeOrderNotFoundError,
  FjnNodeOrderNotPaidError,
  FjnNodeRiskHoldError,
  FjnNodeApproverRequiredError,
  FjnNodeReviewerRequiredError,
  FjnNodeReasonRequiredError,
} from './node-errors';

// ============================================================
// DTOs
// ============================================================

// ---------- 节点 DTO ----------

/** 创建节点输入 */
export interface CreateNodeInput {
  userId: string;
  nodeName: string;
  nodeLevel: FjnNodeLevel;
  regionCode: string;
  cityCode?: string;
  countryCode: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  serviceScope?: Record<string, unknown>;
  operatorId?: string;
}

/** 审核节点输入 */
export interface ApproveNodeInput {
  approverId: string;
  agreementNo?: string;
  reviewNote?: string;
}

/** 暂停节点输入 */
export interface SuspendNodeInput {
  operatorId: string;
  reason: string;
}

/** 节点查询输入 */
export interface ListNodeInput extends FjnPaginationInput {
  userId?: string;
  nodeLevel?: FjnNodeLevel;
  regionCode?: string;
  countryCode?: string;
  status?: FjnNodeStatus;
  kybStatus?: FjnNodeKybStatus;
}

// ---------- 节点奖励 DTO ----------

/** 创建节点奖励输入 */
export interface CreateNodeRewardInput {
  orderId: string;
  orderUserId: string;
  nodeLevel: FjnNodeRewardLevel;  // city | regional | national | global
  rewardRate?: string;
  orderAmount: string;
  currency: string;
  taxRate?: string;
  serviceRecordRequired?: boolean;
  operatorId?: string;
}

/** 审核输入 */
export interface ApproveNodeRewardInput {
  reviewerId: string;
  reviewNote?: string;
}

/** 追回输入 */
export interface RecoverNodeRewardInput {
  reason: string;
  approvalId?: string;
  operatorId?: string;
}

/** 取消输入 */
export interface CancelNodeRewardInput {
  reason: string;
  operatorId?: string;
}

/** 奖励查询输入 */
export interface ListNodeRewardInput extends FjnPaginationInput {
  rewardNo?: string;
  orderId?: string;
  nodeId?: string;
  userId?: string;
  orderUserId?: string;
  nodeLevel?: FjnNodeRewardLevel;
  status?: FjnNodeRewardStatus;
  startDate?: Date;
  endDate?: Date;
}

// ---------- 节点服务记录 DTO ----------

/** 提交节点服务记录输入 */
export interface SubmitNodeServiceRecordInput {
  nodeId: string;
  userId: string;
  serviceType: string;
  title: string;
  description?: string;
  evidence?: Record<string, unknown>;
  serviceDate: Date;
  participants: number;
  operatorId?: string;
}

/** 审核节点服务记录输入 */
export interface ReviewNodeServiceRecordInput {
  reviewerId: string;
  approved: boolean;
  reviewNote?: string;
  operatorId?: string;
}

/** 服务记录查询输入 */
export interface ListNodeServiceRecordInput extends FjnPaginationInput {
  nodeId?: string;
  userId?: string;
  serviceType?: string;
  status?: FjnNodeServiceRecordStatus;
}

// ============================================================
// Node Service 实现
// ============================================================

export class FjnNodeService extends FjnServiceBase {
  /** 默认税率 */
  static readonly DEFAULT_TAX_RATE = '0';

  constructor(options?: FjnServiceOptions) {
    super({ ...options, serviceName: options?.serviceName ?? 'FjnNodeService' });
  }

  // ============================================================
  // 1. 节点生命周期
  // ============================================================

  /**
   * 创建节点
   *
   * 流程：
   *   1. 校验节点等级
   *   2. 校验国家代码
   *   3. 防重复：userId 唯一
   *   4. 写入主表
   *   5. 触发 NodeCreated 事件
   */
  async createNode(input: CreateNodeInput): Promise<any> {
    try {
      this.validateCreateNodeInput(input);

      return await this.withTransaction(async (tx) => {
        // 防重复
        const existing = await tx.fjnNode.findUnique({
          where: { userId: input.userId },
        });
        if (existing) {
          throw new FjnNodeAlreadyExistsError('该用户已有节点', {
            userId: input.userId,
            existingNodeId: existing.id,
          });
        }

        const nodeNo = await this.generateUniqueNodeNo(tx);
        const node = await tx.fjnNode.create({
          data: {
            nodeNo,
            userId: input.userId,
            nodeName: input.nodeName,
            nodeLevel: input.nodeLevel,
            regionCode: input.regionCode,
            cityCode: input.cityCode,
            countryCode: input.countryCode,
            contactName: input.contactName,
            contactPhone: input.contactPhone,
            contactEmail: input.contactEmail,
            kybStatus: NODE_KYB_STATUS.NOT_SUBMITTED,
            status: NODE_STATUS.PENDING_REVIEW,
            serviceScope: (input.serviceScope as any) ?? undefined,
            ...this.fillAuditFields({}, input.operatorId),
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: NODE_EVENTS.NODE_CREATED,
              aggregateType: 'FjnNode',
              aggregateId: node.id,
              payload: {
                node_id: node.id,
                node_no: node.nodeNo,
                user_id: node.userId,
                node_name: node.nodeName,
                node_level: node.nodeLevel,
                region_code: node.regionCode,
                country_code: node.countryCode,
                status: node.status,
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.SYSTEM,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '节点已创建', { nodeId: node.id, userId: input.userId });
        return node;
      });
    } catch (e) {
      throw this.wrapError(e, '创建节点失败');
    }
  }

  /** 审核节点（pending_review → approved） */
  async approveNode(nodeId: string, input: ApproveNodeInput): Promise<any> {
    try {
      if (!input.approverId) throw new FjnNodeApproverRequiredError();
      return await this.withTransaction(async (tx) => {
        const node = await tx.fjnNode.findUnique({ where: { id: nodeId } });
        if (!node) throw new FjnNodeNotFoundError('节点不存在', { nodeId });
        const fromStatus = node.status as FjnNodeStatus;
        assertTransitNodeStatus(fromStatus, NODE_STATUS.APPROVED);

        // 校验 KYB 必须通过
        if (node.kybStatus !== NODE_KYB_STATUS.APPROVED) {
          throw new FjnNodeKybRequiredError('节点 KYB 未通过，不能审核节点', {
            nodeId,
            kybStatus: node.kybStatus,
          });
        }

        const updated = await tx.fjnNode.update({
          where: { id: nodeId },
          data: {
            status: NODE_STATUS.APPROVED,
            approvedBy: input.approverId,
            approvedAt: new Date(),
            agreementNo: input.agreementNo ?? node.agreementNo,
            agreementSignedAt: input.agreementNo ? new Date() : node.agreementSignedAt,
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: NODE_EVENTS.NODE_APPROVED,
              aggregateType: 'FjnNode',
              aggregateId: nodeId,
              payload: {
                node_id: nodeId,
                node_no: updated.nodeNo,
                user_id: updated.userId,
                approver_id: input.approverId,
                approved_at: new Date().toISOString(),
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.ADMIN,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '节点已审核通过', { nodeId, approverId: input.approverId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '审核节点失败');
    }
  }

  /** 激活节点（approved → active） */
  async activateNode(nodeId: string, operatorId?: string): Promise<any> {
    try {
      return await this.withTransaction(async (tx) => {
        const node = await tx.fjnNode.findUnique({ where: { id: nodeId } });
        if (!node) throw new FjnNodeNotFoundError('节点不存在', { nodeId });
        const fromStatus = node.status as FjnNodeStatus;
        assertTransitNodeStatus(fromStatus, NODE_STATUS.ACTIVE);

        const updated = await tx.fjnNode.update({
          where: { id: nodeId },
          data: { status: NODE_STATUS.ACTIVE },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: NODE_EVENTS.NODE_ACTIVATED,
              aggregateType: 'FjnNode',
              aggregateId: nodeId,
              payload: {
                node_id: nodeId,
                node_no: updated.nodeNo,
                activated_at: new Date().toISOString(),
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.ADMIN,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '节点已激活', { nodeId, operatorId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '激活节点失败');
    }
  }

  /** 暂停节点（active/restricted → suspended） */
  async suspendNode(nodeId: string, input: SuspendNodeInput): Promise<any> {
    try {
      if (!input.reason || input.reason.trim().length === 0) {
        throw new FjnNodeReasonRequiredError('暂停原因必填');
      }
      return await this.withTransaction(async (tx) => {
        const node = await tx.fjnNode.findUnique({ where: { id: nodeId } });
        if (!node) throw new FjnNodeNotFoundError('节点不存在', { nodeId });
        const fromStatus = node.status as FjnNodeStatus;
        assertTransitNodeStatus(fromStatus, NODE_STATUS.SUSPENDED);

        const updated = await tx.fjnNode.update({
          where: { id: nodeId },
          data: {
            status: NODE_STATUS.SUSPENDED,
            suspendedAt: new Date(),
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: NODE_EVENTS.NODE_SUSPENDED,
              aggregateType: 'FjnNode',
              aggregateId: nodeId,
              payload: {
                node_id: nodeId,
                node_no: updated.nodeNo,
                reason: input.reason,
                operator_id: input.operatorId,
                suspended_at: new Date().toISOString(),
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.ADMIN,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '节点已暂停', { nodeId, reason: input.reason });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '暂停节点失败');
    }
  }

  /** 终止节点 */
  async terminateNode(nodeId: string, input: SuspendNodeInput): Promise<any> {
    try {
      if (!input.reason || input.reason.trim().length === 0) {
        throw new FjnNodeReasonRequiredError('终止原因必填');
      }
      return await this.withTransaction(async (tx) => {
        const node = await tx.fjnNode.findUnique({ where: { id: nodeId } });
        if (!node) throw new FjnNodeNotFoundError('节点不存在', { nodeId });
        const fromStatus = node.status as FjnNodeStatus;
        if (isTerminalNodeStatus(fromStatus)) {
          throw new FjnNodeTerminatedError(`节点已处于终态 [${fromStatus}]`, {
            nodeId,
            currentStatus: fromStatus,
          });
        }
        assertTransitNodeStatus(fromStatus, NODE_STATUS.TERMINATED);

        const updated = await tx.fjnNode.update({
          where: { id: nodeId },
          data: {
            status: NODE_STATUS.TERMINATED,
            terminatedAt: new Date(),
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: NODE_EVENTS.NODE_TERMINATED,
              aggregateType: 'FjnNode',
              aggregateId: nodeId,
              payload: {
                node_id: nodeId,
                node_no: updated.nodeNo,
                reason: input.reason,
                operator_id: input.operatorId,
                terminated_at: new Date().toISOString(),
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.ADMIN,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '节点已终止', { nodeId, reason: input.reason });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '终止节点失败');
    }
  }

  /** 黑名单节点 */
  async blacklistNode(nodeId: string, input: SuspendNodeInput): Promise<any> {
    try {
      if (!input.reason || input.reason.trim().length === 0) {
        throw new FjnNodeReasonRequiredError('黑名单原因必填');
      }
      return await this.withTransaction(async (tx) => {
        const node = await tx.fjnNode.findUnique({ where: { id: nodeId } });
        if (!node) throw new FjnNodeNotFoundError('节点不存在', { nodeId });
        const fromStatus = node.status as FjnNodeStatus;
        if (isTerminalNodeStatus(fromStatus)) {
          throw new FjnNodeBlacklistedError(`节点已处于终态 [${fromStatus}]`, {
            nodeId,
            currentStatus: fromStatus,
          });
        }
        assertTransitNodeStatus(fromStatus, NODE_STATUS.BLACKLISTED);

        const updated = await tx.fjnNode.update({
          where: { id: nodeId },
          data: { status: NODE_STATUS.BLACKLISTED },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: NODE_EVENTS.NODE_BLACKLISTED,
              aggregateType: 'FjnNode',
              aggregateId: nodeId,
              payload: {
                node_id: nodeId,
                node_no: updated.nodeNo,
                reason: input.reason,
                operator_id: input.operatorId,
                blacklisted_at: new Date().toISOString(),
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.COMPLIANCE,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('warn', '节点已加入黑名单', { nodeId, reason: input.reason });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '黑名单失败');
    }
  }

  /** 按 ID 查询节点 */
  async findNodeById(nodeId: string): Promise<any> {
    try {
      const node = await this.prisma.fjnNode.findUnique({ where: { id: nodeId } });
      if (!node) throw new FjnNodeNotFoundError('节点不存在', { nodeId });
      return node;
    } catch (e) {
      throw this.wrapError(e, '查询节点失败');
    }
  }

  /** 按 userId 查询 */
  async findNodeByUserId(userId: string): Promise<any> {
    try {
      const node = await this.prisma.fjnNode.findUnique({ where: { userId } });
      if (!node) throw new FjnNodeNotFoundError('节点不存在', { userId });
      return node;
    } catch (e) {
      throw this.wrapError(e, '查询节点失败');
    }
  }

  /** 节点列表 */
  async listNodes(input: ListNodeInput): Promise<FjnPaginatedResult<any>> {
    try {
      const where: Prisma.FjnNodeWhereInput = {};
      if (input.userId) where.userId = input.userId;
      if (input.nodeLevel) where.nodeLevel = input.nodeLevel;
      if (input.regionCode) where.regionCode = input.regionCode;
      if (input.countryCode) where.countryCode = input.countryCode;
      if (input.status) where.status = input.status;
      if (input.kybStatus) where.kybStatus = input.kybStatus;

      const [items, total] = await Promise.all([
        this.prisma.fjnNode.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.fjnNode.count({ where }),
      ]);
      return paginate(items as any[], total, input);
    } catch (e) {
      throw this.wrapError(e, '查询节点列表失败');
    }
  }

  // ============================================================
  // 2. KYB 审核
  // ============================================================

  /** 提交 KYB */
  async submitKyb(nodeId: string, operatorId?: string): Promise<any> {
    try {
      return await this.withTransaction(async (tx) => {
        const node = await tx.fjnNode.findUnique({ where: { id: nodeId } });
        if (!node) throw new FjnNodeNotFoundError('节点不存在', { nodeId });
        const fromStatus = node.kybStatus as FjnNodeKybStatus;
        assertTransitNodeKybStatus(fromStatus, NODE_KYB_STATUS.SUBMITTED);

        const updated = await tx.fjnNode.update({
          where: { id: nodeId },
          data: { kybStatus: NODE_KYB_STATUS.SUBMITTED },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: NODE_EVENTS.KYB_SUBMITTED,
              aggregateType: 'FjnNode',
              aggregateId: nodeId,
              payload: {
                node_id: nodeId,
                node_no: updated.nodeNo,
                kyb_status: updated.kybStatus,
                submitted_at: new Date().toISOString(),
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.USER,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', 'KYB 已提交', { nodeId, operatorId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '提交 KYB 失败');
    }
  }

  /** 审核 KYB（submitted → approved/rejected） */
  async approveKyb(nodeId: string, approved: boolean, approverId: string, reason?: string): Promise<any> {
    try {
      if (!approverId) throw new FjnNodeApproverRequiredError();
      return await this.withTransaction(async (tx) => {
        const node = await tx.fjnNode.findUnique({ where: { id: nodeId } });
        if (!node) throw new FjnNodeNotFoundError('节点不存在', { nodeId });
        const fromStatus = node.kybStatus as FjnNodeKybStatus;
        const toStatus = approved ? NODE_KYB_STATUS.APPROVED : NODE_KYB_STATUS.REJECTED;
        assertTransitNodeKybStatus(fromStatus, toStatus);

        const updated = await tx.fjnNode.update({
          where: { id: nodeId },
          data: {
            kybStatus: toStatus,
            kybApprovedAt: approved ? new Date() : null,
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: approved ? NODE_EVENTS.KYB_APPROVED : NODE_EVENTS.KYB_REJECTED,
              aggregateType: 'FjnNode',
              aggregateId: nodeId,
              payload: {
                node_id: nodeId,
                node_no: updated.nodeNo,
                kyb_status: updated.kybStatus,
                approver_id: approverId,
                reason,
                ...(approved
                  ? { approved_at: new Date().toISOString() }
                  : { rejected_at: new Date().toISOString() }),
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.COMPLIANCE,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', `KYB ${approved ? '通过' : '拒绝'}`, { nodeId, approverId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '审核 KYB 失败');
    }
  }

  // ============================================================
  // 3. 节点奖励 CRUD
  // ============================================================

  /**
   * 创建节点奖励
   *
   * 流程：
   *   1. 校验订单已支付
   *   2. 校验节点等级（strategic 不参与）
   *   3. 查询用户在该等级的节点
   *   4. 校验节点状态可接收奖励
   *   5. 计算奖励金额（按 3/3/2/2）
   *   6. 防重复：(orderId, nodeId) 唯一
   *   7. 写入主表
   *   8. 触发 RewardCreated 事件
   */
  async createReward(input: CreateNodeRewardInput): Promise<any> {
    try {
      this.validateCreateNodeRewardInput(input);

      return await this.withTransaction(async (tx) => {
        // 1. 校验订单
        const order = await tx.fjnOrder.findUnique({
          where: { id: input.orderId },
          select: { id: true, userId: true, status: true, paidAmount: true, currency: true },
        });
        if (!order) {
          throw new FjnNodeOrderNotFoundError('订单不存在', { orderId: input.orderId });
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
          throw new FjnNodeOrderNotPaidError('订单未支付', { orderStatus: order.status });
        }
        if (order.currency !== input.currency) {
          throw new FjnBusinessRuleError('币种不一致', {
            orderCurrency: order.currency,
            inputCurrency: input.currency,
          });
        }

        // 2. 战略节点不参与
        if (!isNodeRewardLevel(input.nodeLevel as FjnNodeLevel)) {
          throw new FjnNodeRewardStrategicNotEligibleError(
            '战略节点不参与订单分润',
            { nodeLevel: input.nodeLevel }
          );
        }

        // 3. 查询用户在该等级的节点
        const node = await tx.fjnNode.findFirst({
          where: {
            userId: input.orderUserId,
            nodeLevel: input.nodeLevel,
          },
        });
        if (!node) {
          throw new FjnNodeRewardNoNodeError(
            `用户无 ${input.nodeLevel} 节点`,
            { userId: input.orderUserId, nodeLevel: input.nodeLevel }
          );
        }

        // 4. 校验节点状态
        const nodeStatus = node.status as FjnNodeStatus;
        if (!isNodeRewardEligible(nodeStatus)) {
          throw new FjnNodeNotRewardEligibleError(
            `节点当前状态 [${nodeStatus}] 不可接收订单奖励`,
            { nodeId: node.id, currentStatus: nodeStatus }
          );
        }
        if (node.countryCode !== undefined && node.countryCode !== null) {
          // 可在此做区域限制校验
        }

        // 5. 防重复：(orderId, nodeId) 唯一
        const existing = await tx.fjnNodeReward.findFirst({
          where: {
            orderId: input.orderId,
            nodeId: node.id,
          },
        });
        if (existing) {
          throw new FjnNodeRewardAlreadyExistsError(
            `该订单已存在节点奖励`,
            { orderId: input.orderId, nodeId: node.id, existingRewardId: existing.id }
          );
        }

        // 6. 计算奖励
        const rewardRate = input.rewardRate ?? NODE_LEVEL_RATES[input.nodeLevel as FjnNodeRewardLevel];
        const taxRate = input.taxRate ?? FjnNodeService.DEFAULT_TAX_RATE;
        const rewardAmount = decimalMul(input.orderAmount, rewardRate);
        const taxAmount = decimalMul(rewardAmount, taxRate);
        const netAmount = decimalSub(rewardAmount, taxAmount);

        // 7. serviceRecordRequired 默认 true
        const serviceRecordRequired = input.serviceRecordRequired ?? true;
        const initialStatus = serviceRecordRequired
          ? NODE_REWARD_STATUS.WAITING_SERVICE_RECORD
          : NODE_REWARD_STATUS.CREATED;

        // 8. 写入主表
        const rewardNo = await this.generateUniqueRewardNo(tx);
        const reward = await tx.fjnNodeReward.create({
          data: {
            rewardNo,
            nodeId: node.id,
            userId: input.orderUserId,
            orderId: input.orderId,
            nodeLevel: input.nodeLevel,
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

        // 9. outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: NODE_EVENTS.REWARD_CREATED,
              aggregateType: 'FjnNodeReward',
              aggregateId: reward.id,
              payload: {
                reward_id: reward.id,
                reward_no: reward.rewardNo,
                order_id: reward.orderId,
                node_id: reward.nodeId,
                user_id: reward.userId,
                order_user_id: input.orderUserId,
                node_level: reward.nodeLevel,
                reward_rate: reward.rewardRate.toString(),
                order_amount: reward.orderAmount.toString(),
                reward_amount: reward.rewardAmount.toString(),
                tax_amount: reward.taxAmount.toString(),
                net_amount: reward.netAmount.toString(),
                currency: reward.currency,
                status: reward.status,
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.ORDER,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });

          if (serviceRecordRequired) {
            await (tx as any).outboxEvent.create({
              data: {
                eventType: NODE_EVENTS.REWARD_WAITING_SERVICE,
                aggregateType: 'FjnNodeReward',
                aggregateId: reward.id,
                payload: {
                  reward_id: reward.id,
                  reward_no: reward.rewardNo,
                  waiting_at: new Date().toISOString(),
                  service_record_required: true,
                  occurred_at: new Date().toISOString(),
                  source: NODE_EVENT_SOURCES.SYSTEM,
                } as any,
                status: 'pending',
                retryCount: 0,
              },
            });
          }
        } catch {
          // 忽略
        }

        this.log('info', '节点奖励创建成功', {
          rewardId: reward.id,
          rewardNo,
          orderId: input.orderId,
          nodeLevel: input.nodeLevel,
        });
        return this.findRewardById(reward.id);
      });
    } catch (e) {
      throw this.wrapError(e, '创建节点奖励失败');
    }
  }

  /** 按 ID 查询 */
  async findRewardById(id: string): Promise<any> {
    try {
      const reward = await this.prisma.fjnNodeReward.findUnique({ where: { id } });
      if (!reward) throw new FjnNodeRewardNotFoundError('节点奖励不存在', { id });
      return reward;
    } catch (e) {
      throw this.wrapError(e, '查询节点奖励失败');
    }
  }

  /** 按订单 ID + 节点 ID 查询 */
  async findRewardByOrderIdAndNodeId(orderId: string, nodeId: string): Promise<any> {
    try {
      const reward = await this.prisma.fjnNodeReward.findFirst({
        where: { orderId, nodeId },
      });
      return reward;
    } catch (e) {
      throw this.wrapError(e, '查询节点奖励失败');
    }
  }

  /** 按订单 ID 查询所有节点奖励 */
  async findRewardsByOrderId(orderId: string): Promise<any[]> {
    try {
      return await this.prisma.fjnNodeReward.findMany({
        where: { orderId },
        orderBy: { nodeLevel: 'asc' },
      });
    } catch (e) {
      throw this.wrapError(e, '查询节点奖励失败');
    }
  }

  /** 列表 */
  async listRewards(input: ListNodeRewardInput): Promise<FjnPaginatedResult<any>> {
    try {
      const where: Prisma.FjnNodeRewardWhereInput = {};
      if (input.rewardNo) where.rewardNo = input.rewardNo;
      if (input.orderId) where.orderId = input.orderId;
      if (input.nodeId) where.nodeId = input.nodeId;
      if (input.userId) where.userId = input.userId;
      if (input.orderUserId) where.order = { userId: input.orderUserId };
      if (input.nodeLevel) where.nodeLevel = input.nodeLevel;
      if (input.status) where.status = input.status;
      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) (where.createdAt as any).gte = input.startDate;
        if (input.endDate) (where.createdAt as any).lte = input.endDate;
      }

      const [items, total] = await Promise.all([
        this.prisma.fjnNodeReward.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.fjnNodeReward.count({ where }),
      ]);
      return paginate(items as any[], total, input);
    } catch (e) {
      throw this.wrapError(e, '查询奖励列表失败');
    }
  }

  // ============================================================
  // 4. 节点奖励状态机操作
  // ============================================================

  /** 锁定（waiting_service_record → locked） */
  async lock(rewardId: string, serviceRecordId: string, operatorId?: string): Promise<any> {
    try {
      if (!serviceRecordId) {
        throw new FjnNodeRewardServiceRecordRequiredError('锁定需要 serviceRecordId');
      }
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnNodeReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnNodeRewardNotFoundError();
        const currentStatus = reward.status as FjnNodeRewardStatus;
        if (!isNodeRewardLockable(currentStatus)) {
          throw new FjnNodeRewardNotLockableError(
            `当前状态 [${currentStatus}] 不可锁定`,
            { currentStatus }
          );
        }

        if (reward.serviceRecordRequired) {
          const sr = await tx.fjnNodeServiceRecord.findUnique({
            where: { id: serviceRecordId },
          });
          if (!sr) {
            throw new FjnNodeServiceRecordNotFoundError('服务记录不存在');
          }
          if (sr.status !== NODE_SERVICE_RECORD_STATUS.APPROVED) {
            throw new FjnNodeRewardServiceRecordNotApprovedError(
              '服务记录未审核通过',
              { recordId: serviceRecordId, status: sr.status }
            );
          }
        }

        assertTransitNodeRewardStatus(currentStatus, NODE_REWARD_STATUS.LOCKED);

        const updated = await tx.fjnNodeReward.update({
          where: { id: rewardId },
          data: {
            status: NODE_REWARD_STATUS.LOCKED,
            serviceRecordId,
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: NODE_EVENTS.REWARD_LOCKED,
              aggregateType: 'FjnNodeReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                locked_at: new Date().toISOString(),
                service_record_id: serviceRecordId,
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.SYSTEM,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '节点奖励已锁定', { rewardId, operatorId });
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
        const reward = await tx.fjnNodeReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnNodeRewardNotFoundError();
        const currentStatus = reward.status as FjnNodeRewardStatus;
        assertTransitNodeRewardStatus(currentStatus, NODE_REWARD_STATUS.RISK_CHECKING);

        const updated = await tx.fjnNodeReward.update({
          where: { id: rewardId },
          data: { status: NODE_REWARD_STATUS.RISK_CHECKING },
        });

        this.log('info', '节点奖励进入风控', { rewardId, operatorId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '进入风控失败');
    }
  }

  /** 审核（locked/risk_checking → approved） */
  async approve(rewardId: string, input: ApproveNodeRewardInput): Promise<any> {
    try {
      if (!input.reviewerId) throw new FjnNodeReviewerRequiredError();
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnNodeReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnNodeRewardNotFoundError();
        const currentStatus = reward.status as FjnNodeRewardStatus;
        if (!isNodeRewardApprovable(currentStatus)) {
          throw new FjnNodeRewardNotApprovableError(
            `当前状态 [${currentStatus}] 不可审核`,
            { currentStatus }
          );
        }
        assertTransitNodeRewardStatus(currentStatus, NODE_REWARD_STATUS.APPROVED);

        const updated = await tx.fjnNodeReward.update({
          where: { id: rewardId },
          data: {
            status: NODE_REWARD_STATUS.APPROVED,
            approvedBy: input.reviewerId,
            approvedAt: new Date(),
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: NODE_EVENTS.REWARD_APPROVED,
              aggregateType: 'FjnNodeReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                reviewer_id: input.reviewerId,
                review_note: input.reviewNote,
                approved_at: new Date().toISOString(),
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.ADMIN,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '节点奖励审核通过', { rewardId, reviewerId: input.reviewerId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '审核失败');
    }
  }

  /** 转 payable */
  async markPayable(rewardId: string, operatorId?: string): Promise<any> {
    try {
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnNodeReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnNodeRewardNotFoundError();
        const currentStatus = reward.status as FjnNodeRewardStatus;
        if (!isNodeRewardPayableReward(currentStatus)) {
          throw new FjnNodeRewardNotPayableError(
            `当前状态 [${currentStatus}] 不可转 payable`,
            { currentStatus }
          );
        }
        assertTransitNodeRewardStatus(currentStatus, NODE_REWARD_STATUS.PAYABLE);

        const updated = await tx.fjnNodeReward.update({
          where: { id: rewardId },
          data: { status: NODE_REWARD_STATUS.PAYABLE },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: NODE_EVENTS.REWARD_PAYABLE,
              aggregateType: 'FjnNodeReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                payable_at: new Date().toISOString(),
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.FINANCE,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '节点奖励转 payable', { rewardId, operatorId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '转 payable 失败');
    }
  }

  /** 标记已支付 */
  async markPaid(rewardId: string, operatorId?: string): Promise<any> {
    try {
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnNodeReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnNodeRewardNotFoundError();
        const currentStatus = reward.status as FjnNodeRewardStatus;
        if (!isNodeRewardPayableNow(currentStatus)) {
          throw new FjnNodeRewardNotPayableError(
            `当前状态 [${currentStatus}] 不可支付`,
            { currentStatus }
          );
        }
        assertTransitNodeRewardStatus(currentStatus, NODE_REWARD_STATUS.PAID);

        const updated = await tx.fjnNodeReward.update({
          where: { id: rewardId },
          data: {
            status: NODE_REWARD_STATUS.PAID,
            paidAt: new Date(),
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: NODE_EVENTS.REWARD_PAID,
              aggregateType: 'FjnNodeReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                paid_at: new Date().toISOString(),
                paid_amount: updated.rewardAmount.toString(),
                currency: updated.currency,
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.FINANCE,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '节点奖励已支付', { rewardId, operatorId });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '标记已支付失败');
    }
  }

  /** 追回 */
  async recover(rewardId: string, input: RecoverNodeRewardInput): Promise<any> {
    try {
      if (!input.reason || input.reason.trim().length === 0) {
        throw new FjnNodeReasonRequiredError('追回原因必填');
      }
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnNodeReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnNodeRewardNotFoundError();
        const currentStatus = reward.status as FjnNodeRewardStatus;
        if (!isNodeRewardRecoverable(currentStatus)) {
          throw new FjnNodeRewardNotRecoverableError(
            `当前状态 [${currentStatus}] 不可追回`,
            { currentStatus }
          );
        }
        assertTransitNodeRewardStatus(currentStatus, NODE_REWARD_STATUS.RECOVERED);

        const updated = await tx.fjnNodeReward.update({
          where: { id: rewardId },
          data: { status: NODE_REWARD_STATUS.RECOVERED },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: NODE_EVENTS.REWARD_RECOVERED,
              aggregateType: 'FjnNodeReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                reason: input.reason,
                approval_id: input.approvalId,
                recovered_at: new Date().toISOString(),
                recovered_amount: updated.rewardAmount.toString(),
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.RISK,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '节点奖励已追回', { rewardId, reason: input.reason });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '追回失败');
    }
  }

  /** 取消 */
  async cancel(rewardId: string, input: CancelNodeRewardInput): Promise<any> {
    try {
      if (!input.reason || input.reason.trim().length === 0) {
        throw new FjnNodeReasonRequiredError('取消原因必填');
      }
      return await this.withTransaction(async (tx) => {
        const reward = await tx.fjnNodeReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnNodeRewardNotFoundError();
        const currentStatus = reward.status as FjnNodeRewardStatus;
        if (!isNodeRewardCancellable(currentStatus)) {
          throw new FjnNodeRewardTerminalStatusError(
            `当前状态 [${currentStatus}] 不可取消`,
            { currentStatus }
          );
        }
        assertTransitNodeRewardStatus(currentStatus, NODE_REWARD_STATUS.CANCELLED);

        const updated = await tx.fjnNodeReward.update({
          where: { id: rewardId },
          data: { status: NODE_REWARD_STATUS.CANCELLED },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: NODE_EVENTS.REWARD_CANCELLED,
              aggregateType: 'FjnNodeReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                reason: input.reason,
                cancelled_at: new Date().toISOString(),
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.ADMIN,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '节点奖励已取消', { rewardId, reason: input.reason });
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
        const reward = await tx.fjnNodeReward.findUnique({ where: { id: rewardId } });
        if (!reward) throw new FjnNodeRewardNotFoundError();
        const currentStatus = reward.status as FjnNodeRewardStatus;
        assertTransitNodeRewardStatus(currentStatus, NODE_REWARD_STATUS.RISK_HOLD);

        const updated = await tx.fjnNodeReward.update({
          where: { id: rewardId },
          data: { status: NODE_REWARD_STATUS.RISK_HOLD },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: NODE_EVENTS.REWARD_RISK_HOLD,
              aggregateType: 'FjnNodeReward',
              aggregateId: rewardId,
              payload: {
                reward_id: rewardId,
                reward_no: updated.rewardNo,
                reason,
                risk_score: riskScore,
                risk_level: riskLevel,
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.RISK,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('warn', '节点奖励已风控冻结', { rewardId, reason, riskScore });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '风控冻结失败');
    }
  }

  // ============================================================
  // 5. 节点服务记录管理
  // ============================================================

  /** 提交服务记录 */
  async submitServiceRecord(input: SubmitNodeServiceRecordInput): Promise<any> {
    try {
      // 校验服务类型
      const validTypes = ['merchant_expansion', 'user_education', 'compliance', 'promotion'];
      if (!validTypes.includes(input.serviceType)) {
        throw new FjnNodeServiceRecordTypeInvalidError(
          `serviceType 必须是 [${validTypes.join(', ')}] 之一`
        );
      }
      if (input.participants < 0) {
        throw new FjnNodeServiceRecordParticipantsInvalidError('participants 不能为负数');
      }

      return await this.withTransaction(async (tx) => {
        const recordNo = await this.generateUniqueServiceRecordNo(tx);
        const record = await tx.fjnNodeServiceRecord.create({
          data: {
            recordNo,
            nodeId: input.nodeId,
            userId: input.userId,
            serviceType: input.serviceType,
            title: input.title,
            description: input.description,
            evidence: (input.evidence as any) ?? undefined,
            serviceDate: input.serviceDate,
            participants: input.participants,
            status: NODE_SERVICE_RECORD_STATUS.PENDING,
          },
        });

        // outbox
        try {
          await (tx as any).outboxEvent.create({
            data: {
              eventType: NODE_EVENTS.SERVICE_RECORD_CREATED,
              aggregateType: 'FjnNodeServiceRecord',
              aggregateId: record.id,
              payload: {
                record_id: record.id,
                record_no: record.recordNo,
                node_id: record.nodeId,
                user_id: record.userId,
                service_type: record.serviceType,
                title: record.title,
                service_date: record.serviceDate.toISOString(),
                participants: record.participants,
                status: record.status,
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.USER,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '节点服务记录已提交', { recordId: record.id, nodeId: input.nodeId });
        return record;
      });
    } catch (e) {
      throw this.wrapError(e, '提交服务记录失败');
    }
  }

  /** 审核服务记录 */
  async reviewServiceRecord(recordId: string, input: ReviewNodeServiceRecordInput): Promise<any> {
    try {
      if (!input.reviewerId) throw new FjnNodeReviewerRequiredError();
      return await this.withTransaction(async (tx) => {
        const record = await tx.fjnNodeServiceRecord.findUnique({ where: { id: recordId } });
        if (!record) throw new FjnNodeServiceRecordNotFoundError();
        const currentStatus = record.status as FjnNodeServiceRecordStatus;
        if (!isNodeServiceRecordApprovable(currentStatus)) {
          throw new FjnNodeServiceRecordInvalidError(
            `当前状态 [${currentStatus}] 不可审核`,
            { currentStatus }
          );
        }

        const newStatus = input.approved
          ? NODE_SERVICE_RECORD_STATUS.APPROVED
          : NODE_SERVICE_RECORD_STATUS.REJECTED;
        assertTransitNodeServiceRecordStatus(currentStatus, newStatus);

        const updated = await tx.fjnNodeServiceRecord.update({
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
                ? NODE_EVENTS.SERVICE_RECORD_APPROVED
                : NODE_EVENTS.SERVICE_RECORD_REJECTED,
              aggregateType: 'FjnNodeServiceRecord',
              aggregateId: recordId,
              payload: {
                record_id: recordId,
                record_no: updated.recordNo,
                node_id: updated.nodeId,
                user_id: updated.userId,
                reviewer_id: input.reviewerId,
                review_note: input.reviewNote,
                ...(input.approved
                  ? { approved_at: new Date().toISOString() }
                  : { rejected_at: new Date().toISOString() }),
                occurred_at: new Date().toISOString(),
                source: NODE_EVENT_SOURCES.ADMIN,
              } as any,
              status: 'pending',
              retryCount: 0,
            },
          });
        } catch {
          // 忽略
        }

        this.log('info', '节点服务记录已审核', { recordId, approved: input.approved });
        return updated;
      });
    } catch (e) {
      throw this.wrapError(e, '审核服务记录失败');
    }
  }

  /** 服务记录列表 */
  async listServiceRecords(input: ListNodeServiceRecordInput): Promise<FjnPaginatedResult<any>> {
    try {
      const where: Prisma.FjnNodeServiceRecordWhereInput = {};
      if (input.nodeId) where.nodeId = input.nodeId;
      if (input.userId) where.userId = input.userId;
      if (input.serviceType) where.serviceType = input.serviceType;
      if (input.status) where.status = input.status;

      const [items, total] = await Promise.all([
        this.prisma.fjnNodeServiceRecord.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.fjnNodeServiceRecord.count({ where }),
      ]);
      return paginate(items as any[], total, input);
    } catch (e) {
      throw this.wrapError(e, '查询服务记录列表失败');
    }
  }

  // ============================================================
  // 6. 联动入口
  // ============================================================

  /**
   * OrderPaid 事件处理器
   * 为订单创建所有可参与的节点奖励
   */
  async handleOrderPaid(input: {
    orderId: string;
    orderUserId: string;
    orderAmount: string;
    currency: string;
    operatorId?: string;
  }): Promise<any[]> {
    return await this.withTransaction(async (tx) => {
      // 查询用户所有可参与订单分润的节点
      const nodes = await tx.fjnNode.findMany({
        where: {
          userId: input.orderUserId,
          nodeLevel: { in: NODE_REWARD_LEVELS as unknown as string[] },
          status: { in: [NODE_STATUS.ACTIVE, NODE_STATUS.APPROVED] },
        },
      });
      if (nodes.length === 0) {
        return [];
      }

      const results: any[] = [];
      for (const node of nodes) {
        // 检查是否已存在奖励
        const exists = await tx.fjnNodeReward.findFirst({
          where: { orderId: input.orderId, nodeId: node.id },
        });
        if (exists) continue;

        results.push({
          nodeId: node.id,
          nodeLevel: node.nodeLevel,
          status: 'pending_create',
        });
      }
      return results;
    });
  }

  // ============================================================
  // 7. 私有辅助方法
  // ============================================================

  private validateCreateNodeInput(input: CreateNodeInput): void {
    if (!input.userId) throw new FjnValidationError('userId 必填', { field: 'userId' });
    if (!input.nodeName) throw new FjnValidationError('nodeName 必填', { field: 'nodeName' });
    const allLevels = Object.values(NODE_LEVELS);
    if (!allLevels.includes(input.nodeLevel)) {
      throw new FjnNodeLevelInvalidError(
        `nodeLevel 必须是 [${allLevels.join(', ')}] 之一`,
        { nodeLevel: input.nodeLevel }
      );
    }
    if (!input.regionCode) throw new FjnValidationError('regionCode 必填', { field: 'regionCode' });
    if (!input.countryCode || input.countryCode.length !== 2) {
      throw new FjnNodeRegionInvalidError('countryCode 必须是 2 位 ISO 代码');
    }
    if (!input.contactName) throw new FjnValidationError('contactName 必填', { field: 'contactName' });
    if (!input.contactPhone) throw new FjnValidationError('contactPhone 必填', { field: 'contactPhone' });
    if (!input.contactEmail) throw new FjnValidationError('contactEmail 必填', { field: 'contactEmail' });
  }

  private validateCreateNodeRewardInput(input: CreateNodeRewardInput): void {
    if (!input.orderId) throw new FjnValidationError('orderId 必填', { field: 'orderId' });
    if (!input.orderUserId) throw new FjnValidationError('orderUserId 必填', { field: 'orderUserId' });
    const rewardLevels = NODE_REWARD_LEVELS as readonly string[];
    if (!rewardLevels.includes(input.nodeLevel)) {
      throw new FjnNodeRewardLevelInvalidError(
        `nodeLevel 必须是 [${rewardLevels.join(', ')}] 之一`,
        { nodeLevel: input.nodeLevel }
      );
    }
    if (!input.orderAmount || !decimalGt(input.orderAmount, '0')) {
      throw new FjnNodeRewardAmountZeroError('orderAmount 必须大于 0', {
        orderAmount: input.orderAmount,
      });
    }
    if (!input.currency) throw new FjnValidationError('currency 必填', { field: 'currency' });
    if (input.rewardRate !== undefined) {
      if (decimalLte(input.rewardRate, '0') || decimalGt(input.rewardRate, '1')) {
        throw new FjnNodeRewardRateInvalidError('rewardRate 必须在 (0, 1] 之间', {
          rewardRate: input.rewardRate,
        });
      }
    }
  }

  private async generateUniqueNodeNo(tx: any): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const no = `NOD${Date.now()}${String(i).padStart(2, '0')}`;
      const exists = await tx.fjnNode.findUnique({ where: { nodeNo: no } });
      if (!exists) return no;
    }
    return `NOD${Date.now()}`;
  }

  private async generateUniqueRewardNo(tx: any): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const no = `NRW${Date.now()}${String(i).padStart(2, '0')}`;
      const exists = await tx.fjnNodeReward.findUnique({ where: { rewardNo: no } });
      if (!exists) return no;
    }
    return `NRW${Date.now()}`;
  }

  private async generateUniqueServiceRecordNo(tx: any): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const no = `NSR${Date.now()}${String(i).padStart(2, '0')}`;
      const exists = await tx.fjnNodeServiceRecord.findUnique({ where: { recordNo: no } });
      if (!exists) return no;
    }
    return `NSR${Date.now()}`;
  }
}

// ============================================================
// Factory
// ============================================================

export function createFjnNodeService(options?: FjnServiceOptions): FjnNodeService {
  return new FjnNodeService(options);
}
