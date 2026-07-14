/**
 * Approval Service - 工业级审批流服务
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.6.1
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md §3.16
 *
 * 职责：
 *  - Request 域：createRequest / startReview / approve / reject / cancel / execute / expire
 *  - Step 域：approveStep / rejectStep / skipStep / expireStep / advanceStep
 *  - 策略：selfApprovalForbidden（禁止自审）、applicantCancelOwn（申请人可撤销）、priorityEscalate
 *  - 调度：expireOverdueRequests（定时任务）
 *  - 查询：getRequest / getStep / listRequests / listSteps / getMyPending
 *
 * 链上集成：无（业务真相源链下）
 * 业务真相源：fjn_approval_requests + fjn_approval_steps
 *
 * 集成方式（其它 Service 调用）：
 *   const approval = await approvalService.createRequest({
 *     approvalType: APPROVAL_TYPE.POINTS_ADJUST,
 *     title: 'Adjustment for user X',
 *     applicantId: 'admin-001',
 *     payload: { userId, deltaAmount, reason },
 *     relatedType: 'points_account',
 *     relatedId: userId,
 *     amount: '1000.0000',
 *   });
 *   // 等待人工审批通过
 *   // 在 execute 时：业务 Service 再次校验 + 真正执行
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  APPROVAL_TYPE,
  APPROVAL_REQUEST_STATUS,
  APPROVAL_STEP_STATUS,
  APPROVAL_APPLICANT_TYPE,
  APPROVAL_PRIORITY,
  APPROVAL_DEFAULT_EXPIRES_HOURS,
  APPROVAL_TYPE_RISK_LEVEL,
  APPROVAL_STEPS_BY_RISK,
  APPROVAL_DEFAULT_CHAIN_ID,
  isValidApprovalType,
  isValidApprovalRequestStatus,
  isValidApprovalStepStatus,
  isValidApprovalApplicantType,
  isValidApprovalPriority,
  canTransitApprovalRequestStatus,
  isTerminalApprovalRequestStatus,
  getApprovalRiskLevel,
  getDefaultApprovalSteps,
  type FjnApprovalType,
  type FjnApprovalRequestStatus,
  type FjnApprovalStepStatus,
  type FjnApprovalApplicantType,
  type FjnApprovalPriority,
} from './approval-state-machine';
import {
  APPROVAL_EVENTS,
  APPROVAL_EVENT_SOURCES,
  type FjnApprovalEventSource,
} from './approval-events';
import {
  ApprovalRequestNotFoundError,
  ApprovalRequestTypeInvalidError,
  ApprovalRequestStatusInvalidError,
  ApprovalRequestAlreadyDecidedError,
  ApprovalRequestExpiredError,
  ApprovalRequestNotPendingError,
  ApprovalRequestNotApprovableError,
  ApprovalRequestNotRejectableError,
  ApprovalRequestNotCancellableError,
  ApprovalRequestNotExecutableError,
  ApprovalRequestExecutedError,
  ApprovalStepNotFoundError,
  ApprovalStepStatusInvalidError,
  ApprovalStepAlreadyDecidedError,
  ApprovalStepNotCurrentError,
  ApprovalApproverRequiredError,
  ApprovalApproverDuplicateError,
  ApprovalApproverNotAuthorizedError,
  ApprovalApplicantRequiredError,
  ApprovalApplicantTypeInvalidError,
  ApprovalTitleRequiredError,
  ApprovalPayloadRequiredError,
  ApprovalPriorityInvalidError,
  ApprovalExpiresAtInvalidError,
  ApprovalTotalStepsInvalidError,
  ApprovalCurrentStepInvalidError,
  ApprovalStepsCountMismatchError,
  ApprovalCannotApproveOwnError,
  ApprovalSelfApprovalForbiddenError,
  ApprovalCannotCancelOthersError,
  ApprovalCommentRequiredForRejectError,
} from './approval-errors';

// ============================================================
// 1. 入参接口
// ============================================================

/** 创建审批申请 */
export interface CreateApprovalRequestInput {
  approvalType: FjnApprovalType;
  title: string;
  description?: string;
  applicantId: string;
  applicantType?: FjnApprovalApplicantType;
  /** 业务负载（高危操作的参数） */
  payload: Prisma.InputJsonValue;
  /** 关联对象类型/ID/编号（可选） */
  relatedType?: string;
  relatedId?: string;
  relatedNo?: string;
  amount?: string;
  currency?: string;
  /** 总步骤数（默认按风险等级自动推导） */
  totalSteps?: number;
  /** 步骤定义（可选） */
  steps?: Array<{
    stepNo: number;
    stepName: string;
    approverRole?: string;
  }>;
  /** 优先级（默认 normal） */
  priority?: FjnApprovalPriority;
  /** 过期时间（默认按优先级推导） */
  expiresAt?: Date;
  /** 是否禁止自审（默认 true） */
  selfApprovalForbidden?: boolean;
  operatorId?: string;
}

/** 启动审查（pending → in_review） */
export interface StartReviewInput {
  approvalId: string;
  operatorId?: string;
}

/** 批准当前步骤 */
export interface ApproveStepInput {
  approvalId: string;
  approverId: string;
  approverRole?: string;
  comment?: string;
  operatorId?: string;
}

/** 拒绝当前步骤（任一拒绝 → 整个 request 拒绝） */
export interface RejectStepInput {
  approvalId: string;
  approverId: string;
  approverRole?: string;
  comment: string;
  operatorId?: string;
}

/** 跳过当前步骤（特殊场景） */
export interface SkipStepInput {
  approvalId: string;
  approverId?: string;
  comment?: string;
  reason?: string;
  operatorId?: string;
}

/** 取消申请 */
export interface CancelApprovalInput {
  approvalId: string;
  operatorId: string;
  reason: string;
}

/** 执行申请（approved → executed） */
export interface ExecuteApprovalInput {
  approvalId: string;
  executorId?: string;
  operatorId?: string;
}

/** 提升优先级 */
export interface EscalatePriorityInput {
  approvalId: string;
  newPriority: FjnApprovalPriority;
  operatorId: string;
  reason: string;
}

/** 过期申请（定时任务） */
export interface ExpireApprovalInput {
  approvalId: string;
  operatorId?: string;
}

/** 分页查询 */
export interface ListApprovalRequestsInput {
  page?: number;
  pageSize?: number;
  approvalType?: FjnApprovalType;
  status?: FjnApprovalRequestStatus;
  applicantId?: string;
  /** 当前步骤的 approver */
  currentApproverId?: string;
  priority?: FjnApprovalPriority;
  relatedType?: string;
  relatedId?: string;
}

// ============================================================
// 2. 返回类型
// ============================================================

export interface ApprovalStepView {
  id: string;
  requestId: string;
  stepNo: number;
  stepName: string;
  approverId: string | null;
  approverRole: string | null;
  status: FjnApprovalStepStatus;
  comment: string | null;
  approvedAt: Date | null;
  createdAt: Date;
}

export interface ApprovalRequestView {
  id: string;
  approvalNo: string;
  approvalType: FjnApprovalType;
  title: string;
  description: string | null;
  applicantId: string;
  applicantType: FjnApprovalApplicantType;
  payload: Prisma.JsonValue;
  relatedType: string | null;
  relatedId: string | null;
  relatedNo: string | null;
  amount: string | null;
  currency: string | null;
  currentStep: number;
  totalSteps: number;
  status: FjnApprovalRequestStatus;
  priority: FjnApprovalPriority;
  expiresAt: Date | null;
  approvedAt: Date | null;
  executedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  steps: ApprovalStepView[];
}

export interface ApprovalRequestSummary {
  id: string;
  approvalNo: string;
  approvalType: FjnApprovalType;
  title: string;
  applicantId: string;
  applicantType: FjnApprovalApplicantType;
  currentStep: number;
  totalSteps: number;
  status: FjnApprovalRequestStatus;
  priority: FjnApprovalPriority;
  amount: string | null;
  currency: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

// ============================================================
// 3. Service 实现
// ============================================================

export class FjnApprovalService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnApprovalService' });
  }

  // ==========================================================
  // 3.0 工具方法
  // ==========================================================

  private generateApprovalNo(): string {
    return `APR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  /** 发出 outbox 事件 */
  private async emitEvent(
    tx: any,
    eventType: string,
    payload: Record<string, unknown>,
    source: FjnApprovalEventSource = APPROVAL_EVENT_SOURCES.APPROVAL_SERVICE,
  ): Promise<void> {
    await (tx as any).outboxEvent.create({
      data: {
        eventType,
        payload: { ...payload, occurred_at: new Date().toISOString(), source },
        status: 'pending',
        retryCount: 0,
      },
    });
  }

  // ==========================================================
  // 3.1 Request 域
  // ==========================================================

  /**
   * 创建审批申请
   *  - 自动按 approvalType 推导 totalSteps / expiresAt
   *  - 自动创建 N 个 step 记录
   *  - 默认 status = pending
   *  - 写 outbox 事件 REQUEST_CREATED
   */
  async createRequest(input: CreateApprovalRequestInput) {
    if (!input.approvalType || !isValidApprovalType(input.approvalType)) {
      throw new ApprovalRequestTypeInvalidError({ approvalType: input.approvalType });
    }
    if (!input.title) throw new ApprovalTitleRequiredError();
    if (!input.applicantId) throw new ApprovalApplicantRequiredError();
    if (input.applicantType && !isValidApprovalApplicantType(input.applicantType)) {
      throw new ApprovalApplicantTypeInvalidError({ applicantType: input.applicantType });
    }
    if (!input.payload) throw new ApprovalPayloadRequiredError();
    if (input.priority && !isValidApprovalPriority(input.priority)) {
      throw new ApprovalPriorityInvalidError({ priority: input.priority });
    }

    const applicantType = input.applicantType ?? APPROVAL_APPLICANT_TYPE.ADMIN;
    const priority = input.priority ?? APPROVAL_PRIORITY.NORMAL;
    const totalSteps = input.totalSteps ?? getDefaultApprovalSteps(input.approvalType);
    if (totalSteps < 1 || totalSteps > 10) {
      throw new ApprovalTotalStepsInvalidError({ totalSteps });
    }
    if (input.steps && input.steps.length !== totalSteps) {
      throw new ApprovalStepsCountMismatchError({
        provided: input.steps.length,
        totalSteps,
      });
    }

    // 默认过期时间
    let expiresAt = input.expiresAt;
    if (!expiresAt) {
      const hours = APPROVAL_DEFAULT_EXPIRES_HOURS[priority] ?? 72;
      expiresAt = new Date(Date.now() + hours * 3600 * 1000);
    } else if (expiresAt.getTime() <= Date.now()) {
      throw new ApprovalExpiresAtInvalidError({ expiresAt: expiresAt.toISOString() });
    }

    return this.withTransaction(async (tx) => {
      const approvalNo = this.generateApprovalNo();

      // 创建 request
      const created = await (tx as any).fjnApprovalRequest.create({
        data: {
          approvalNo,
          approvalType: input.approvalType,
          title: input.title,
          description: input.description ?? null,
          applicantId: input.applicantId,
          applicantType,
          payload: input.payload,
          relatedType: input.relatedType ?? null,
          relatedId: input.relatedId ?? null,
          relatedNo: input.relatedNo ?? null,
          amount: input.amount ?? null,
          currency: input.currency ?? null,
          currentStep: 1,
          totalSteps,
          status: APPROVAL_REQUEST_STATUS.PENDING,
          priority,
          expiresAt,
        },
      });

      // 创建 steps
      const stepDefs =
        input.steps ??
        Array.from({ length: totalSteps }, (_, i) => ({
          stepNo: i + 1,
          stepName: `Step ${i + 1} of ${totalSteps}`,
          approverRole: undefined,
        }));

      const createdSteps: ApprovalStepView[] = [];
      for (const def of stepDefs) {
        const step = await (tx as any).fjnApprovalStep.create({
          data: {
            requestId: created.id,
            stepNo: def.stepNo,
            stepName: def.stepName,
            approverRole: def.approverRole ?? null,
            status: APPROVAL_STEP_STATUS.PENDING,
          },
        });
        createdSteps.push({
          id: step.id,
          requestId: step.requestId,
          stepNo: step.stepNo,
          stepName: step.stepName,
          approverId: step.approverId,
          approverRole: step.approverRole,
          status: step.status as FjnApprovalStepStatus,
          comment: step.comment,
          approvedAt: step.approvedAt,
          createdAt: step.createdAt,
        });
      }

      await this.emitEvent(tx, APPROVAL_EVENTS.REQUEST_CREATED, {
        approvalId: created.id,
        approvalNo,
        approvalType: input.approvalType,
        title: input.title,
        applicantId: input.applicantId,
        applicantType,
        totalSteps,
        priority,
        expiresAt: expiresAt.toISOString(),
        amount: input.amount ?? null,
        currency: input.currency ?? null,
        relatedType: input.relatedType ?? null,
        relatedId: input.relatedId ?? null,
      });

      this.log('info', `Approval request created: ${approvalNo}`, {
        approvalType: input.approvalType,
        totalSteps,
        priority,
      });

      return {
        id: created.id,
        approvalNo,
        approvalType: input.approvalType,
        title: input.title,
        description: input.description ?? null,
        applicantId: input.applicantId,
        applicantType,
        payload: input.payload as Prisma.JsonValue,
        relatedType: input.relatedType ?? null,
        relatedId: input.relatedId ?? null,
        relatedNo: input.relatedNo ?? null,
        amount: input.amount ?? null,
        currency: input.currency ?? null,
        currentStep: 1,
        totalSteps,
        status: APPROVAL_REQUEST_STATUS.PENDING,
        priority,
        expiresAt,
        approvedAt: null,
        executedAt: null,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        steps: createdSteps,
      } as ApprovalRequestView;
    });
  }

  /** 启动审查（pending → in_review） */
  async startReview(input: StartReviewInput) {
    if (!input.approvalId) throw new ApprovalRequestNotFoundError();
    return this.withTransaction(async (tx) => {
      const req = await (tx as any).fjnApprovalRequest.findUnique({
        where: { id: input.approvalId },
        include: { steps: { orderBy: { stepNo: 'asc' } } },
      });
      if (!req) throw new ApprovalRequestNotFoundError({ approvalId: input.approvalId });
      if (req.expiresAt && req.expiresAt.getTime() < Date.now()) {
        throw new ApprovalRequestExpiredError({ approvalId: input.approvalId });
      }
      if (!canTransitApprovalRequestStatus(
        req.status as FjnApprovalRequestStatus,
        APPROVAL_REQUEST_STATUS.IN_REVIEW,
      )) {
        throw new ApprovalRequestStatusInvalidError({
          approvalNo: req.approvalNo,
          from: req.status,
          to: APPROVAL_REQUEST_STATUS.IN_REVIEW,
        });
      }

      const updated = await (tx as any).fjnApprovalRequest.update({
        where: { id: input.approvalId },
        data: { status: APPROVAL_REQUEST_STATUS.IN_REVIEW },
      });

      await this.emitEvent(tx, APPROVAL_EVENTS.REQUEST_IN_REVIEW, {
        approvalId: input.approvalId,
        approvalNo: req.approvalNo,
        operatorId: input.operatorId,
      });

      this.log('info', `Approval request in review: ${req.approvalNo}`);
      return updated;
    });
  }

  /**
   * 批准当前步骤
   *  - 校验 self-approval 规则
   *  - 校验 approver 已设置
   *  - 校验是 current step
   *  - 写入 step
   *  - 若 currentStep == totalSteps：request = approved
   *  - 否则：currentStep += 1，request 仍为 in_review
   */
  async approveStep(input: ApproveStepInput) {
    if (!input.approvalId) throw new ApprovalRequestNotFoundError();
    if (!input.approverId) throw new ApprovalApproverRequiredError();

    return this.withTransaction(async (tx) => {
      const req = await (tx as any).fjnApprovalRequest.findUnique({
        where: { id: input.approvalId },
        include: { steps: { orderBy: { stepNo: 'asc' } } },
      });
      if (!req) throw new ApprovalRequestNotFoundError({ approvalId: input.approvalId });

      // 防自审
      if (input.approverId === req.applicantId) {
        throw new ApprovalCannotApproveOwnError({ approvalId: input.approvalId });
      }

      if (req.expiresAt && req.expiresAt.getTime() < Date.now()) {
        throw new ApprovalRequestExpiredError({ approvalId: input.approvalId });
      }

      if (
        req.status !== APPROVAL_REQUEST_STATUS.IN_REVIEW &&
        req.status !== APPROVAL_REQUEST_STATUS.PENDING
      ) {
        throw new ApprovalRequestNotApprovableError({
          approvalId: input.approvalId,
          status: req.status,
        });
      }

      const currentStep = req.steps.find((s: any) => s.stepNo === req.currentStep);
      if (!currentStep) {
        throw new ApprovalStepNotCurrentError({
          approvalId: input.approvalId,
          currentStep: req.currentStep,
        });
      }
      if (currentStep.status !== APPROVAL_STEP_STATUS.PENDING) {
        throw new ApprovalStepAlreadyDecidedError({
          stepId: currentStep.id,
          status: currentStep.status,
        });
      }

      // 防止同一步骤的同一 approver 重复决策（这里通过 approverId 写入来检查）
      if (currentStep.approverId && currentStep.approverId !== input.approverId) {
        // 已分配给其它 approver
        throw new ApprovalApproverNotAuthorizedError({
          stepId: currentStep.id,
          approverId: input.approverId,
          expectedApproverId: currentStep.approverId,
        });
      }

      // 写入 step
      const updatedStep = await (tx as any).fjnApprovalStep.update({
        where: { id: currentStep.id },
        data: {
          approverId: input.approverId,
          approverRole: input.approverRole ?? null,
          status: APPROVAL_STEP_STATUS.APPROVED,
          comment: input.comment ?? null,
          approvedAt: new Date(),
        },
      });

      // 推进 request
      let newRequestStatus = req.status;
      let newCurrentStep = req.currentStep;
      let newApprovedAt: Date | null = null;

      if (req.currentStep >= req.totalSteps) {
        // 最后一步：整个 request approved
        newRequestStatus = APPROVAL_REQUEST_STATUS.APPROVED;
        newApprovedAt = new Date();
      } else {
        // 推进到下一步
        newCurrentStep = req.currentStep + 1;
        // pending → in_review 自动转换
        if (req.status === APPROVAL_REQUEST_STATUS.PENDING) {
          newRequestStatus = APPROVAL_REQUEST_STATUS.IN_REVIEW;
        }
      }

      const updatedReq = await (tx as any).fjnApprovalRequest.update({
        where: { id: input.approvalId },
        data: {
          status: newRequestStatus,
          currentStep: newCurrentStep,
          ...(newApprovedAt ? { approvedAt: newApprovedAt } : {}),
        },
        include: { steps: { orderBy: { stepNo: 'asc' } } },
      });

      await this.emitEvent(tx, APPROVAL_EVENTS.STEP_APPROVED, {
        approvalId: input.approvalId,
        approvalNo: req.approvalNo,
        stepNo: currentStep.stepNo,
        stepName: currentStep.stepName,
        approverId: input.approverId,
        approverRole: input.approverRole,
        decision: 'approved',
        comment: input.comment,
        requestStatus: newRequestStatus,
        currentStep: newCurrentStep,
      });

      if (req.currentStep < req.totalSteps) {
        await this.emitEvent(tx, APPROVAL_EVENTS.STEP_ADVANCED, {
          approvalId: input.approvalId,
          approvalNo: req.approvalNo,
          fromStep: req.currentStep,
          toStep: newCurrentStep,
        });
      }

      if (newRequestStatus === APPROVAL_REQUEST_STATUS.APPROVED) {
        await this.emitEvent(tx, APPROVAL_EVENTS.REQUEST_APPROVED, {
          approvalId: input.approvalId,
          approvalNo: req.approvalNo,
          approvedAt: newApprovedAt!.toISOString(),
          approverId: input.approverId,
        });
      }

      this.log('info', `Approval step approved: ${req.approvalNo} step ${currentStep.stepNo}`, {
        approverId: input.approverId,
        requestStatus: newRequestStatus,
      });

      return {
        ...updatedReq,
        steps: updatedReq.steps.map((s: any) => ({
          id: s.id,
          requestId: s.requestId,
          stepNo: s.stepNo,
          stepName: s.stepName,
          approverId: s.approverId,
          approverRole: s.approverRole,
          status: s.status,
          comment: s.comment,
          approvedAt: s.approvedAt,
          createdAt: s.createdAt,
        })),
      } as ApprovalRequestView;
    });
  }

  /**
   * 拒绝当前步骤
   *  - 任一拒绝 → 整个 request 拒绝
   *  - 强制要求 comment
   */
  async rejectStep(input: RejectStepInput) {
    if (!input.approvalId) throw new ApprovalRequestNotFoundError();
    if (!input.approverId) throw new ApprovalApproverRequiredError();
    if (!input.comment || !input.comment.trim()) {
      throw new ApprovalCommentRequiredForRejectError({ approvalId: input.approvalId });
    }

    return this.withTransaction(async (tx) => {
      const req = await (tx as any).fjnApprovalRequest.findUnique({
        where: { id: input.approvalId },
        include: { steps: { orderBy: { stepNo: 'asc' } } },
      });
      if (!req) throw new ApprovalRequestNotFoundError({ approvalId: input.approvalId });
      if (input.approverId === req.applicantId) {
        throw new ApprovalCannotApproveOwnError({ approvalId: input.approvalId });
      }
      if (req.expiresAt && req.expiresAt.getTime() < Date.now()) {
        throw new ApprovalRequestExpiredError({ approvalId: input.approvalId });
      }
      if (
        req.status !== APPROVAL_REQUEST_STATUS.IN_REVIEW &&
        req.status !== APPROVAL_REQUEST_STATUS.PENDING
      ) {
        throw new ApprovalRequestNotRejectableError({
          approvalId: input.approvalId,
          status: req.status,
        });
      }

      const currentStep = req.steps.find((s: any) => s.stepNo === req.currentStep);
      if (!currentStep) {
        throw new ApprovalStepNotCurrentError({
          approvalId: input.approvalId,
          currentStep: req.currentStep,
        });
      }
      if (currentStep.status !== APPROVAL_STEP_STATUS.PENDING) {
        throw new ApprovalStepAlreadyDecidedError({
          stepId: currentStep.id,
          status: currentStep.status,
        });
      }

      const updatedStep = await (tx as any).fjnApprovalStep.update({
        where: { id: currentStep.id },
        data: {
          approverId: input.approverId,
          approverRole: input.approverRole ?? null,
          status: APPROVAL_STEP_STATUS.REJECTED,
          comment: input.comment,
          approvedAt: new Date(),
        },
      });

      const updatedReq = await (tx as any).fjnApprovalRequest.update({
        where: { id: input.approvalId },
        data: { status: APPROVAL_REQUEST_STATUS.REJECTED },
        include: { steps: { orderBy: { stepNo: 'asc' } } },
      });

      await this.emitEvent(tx, APPROVAL_EVENTS.STEP_REJECTED, {
        approvalId: input.approvalId,
        approvalNo: req.approvalNo,
        stepNo: currentStep.stepNo,
        stepName: currentStep.stepName,
        approverId: input.approverId,
        approverRole: input.approverRole,
        decision: 'rejected',
        comment: input.comment,
        requestStatus: APPROVAL_REQUEST_STATUS.REJECTED,
        currentStep: req.currentStep,
      });

      await this.emitEvent(tx, APPROVAL_EVENTS.REQUEST_REJECTED, {
        approvalId: input.approvalId,
        approvalNo: req.approvalNo,
        approverId: input.approverId,
        comment: input.comment,
      });

      this.log('info', `Approval step rejected: ${req.approvalNo} step ${currentStep.stepNo}`, {
        approverId: input.approverId,
      });

      return {
        ...updatedReq,
        steps: updatedReq.steps.map((s: any) => ({
          id: s.id,
          requestId: s.requestId,
          stepNo: s.stepNo,
          stepName: s.stepName,
          approverId: s.approverId,
          approverRole: s.approverRole,
          status: s.status,
          comment: s.comment,
          approvedAt: s.approvedAt,
          createdAt: s.createdAt,
        })),
      } as ApprovalRequestView;
    });
  }

  /** 跳过当前步骤 */
  async skipStep(input: SkipStepInput) {
    if (!input.approvalId) throw new ApprovalRequestNotFoundError();
    if (!input.approverId) throw new ApprovalApproverRequiredError();
    if (!input.comment || !input.comment.trim()) {
      throw new ApprovalCommentRequiredForRejectError({ approvalId: input.approvalId });
    }

    return this.withTransaction(async (tx) => {
      const req = await (tx as any).fjnApprovalRequest.findUnique({
        where: { id: input.approvalId },
        include: { steps: { orderBy: { stepNo: 'asc' } } },
      });
      if (!req) throw new ApprovalRequestNotFoundError({ approvalId: input.approvalId });
      if (
        req.status !== APPROVAL_REQUEST_STATUS.IN_REVIEW &&
        req.status !== APPROVAL_REQUEST_STATUS.PENDING
      ) {
        throw new ApprovalRequestStatusInvalidError({
          approvalId: input.approvalId,
          status: req.status,
        });
      }

      const currentStep = req.steps.find((s: any) => s.stepNo === req.currentStep);
      if (!currentStep) {
        throw new ApprovalStepNotCurrentError({
          approvalId: input.approvalId,
          currentStep: req.currentStep,
        });
      }
      if (currentStep.status !== APPROVAL_STEP_STATUS.PENDING) {
        throw new ApprovalStepAlreadyDecidedError({
          stepId: currentStep.id,
          status: currentStep.status,
        });
      }

      await (tx as any).fjnApprovalStep.update({
        where: { id: currentStep.id },
        data: {
          approverId: input.approverId,
          status: APPROVAL_STEP_STATUS.SKIPPED,
          comment: input.comment,
          approvedAt: new Date(),
        },
      });

      let newRequestStatus = req.status;
      let newCurrentStep = req.currentStep;
      if (req.currentStep >= req.totalSteps) {
        newRequestStatus = APPROVAL_REQUEST_STATUS.APPROVED;
      } else {
        newCurrentStep = req.currentStep + 1;
        if (req.status === APPROVAL_REQUEST_STATUS.PENDING) {
          newRequestStatus = APPROVAL_REQUEST_STATUS.IN_REVIEW;
        }
      }

      const updatedReq = await (tx as any).fjnApprovalRequest.update({
        where: { id: input.approvalId },
        data: { status: newRequestStatus, currentStep: newCurrentStep },
        include: { steps: { orderBy: { stepNo: 'asc' } } },
      });

      await this.emitEvent(tx, APPROVAL_EVENTS.STEP_SKIPPED, {
        approvalId: input.approvalId,
        approvalNo: req.approvalNo,
        stepNo: currentStep.stepNo,
        approverId: input.approverId,
        comment: input.comment,
      });

      this.log('info', `Approval step skipped: ${req.approvalNo} step ${currentStep.stepNo}`);
      return updatedReq as unknown as ApprovalRequestView;
    });
  }

  /**
   * 取消申请
   *  - 仅 applicant 本人可取消（applicantId 校验）
   *  - 仅在 pending/in_review/approved 状态可取消
   *  - 取消后不可再执行
   */
  async cancelRequest(input: CancelApprovalInput) {
    if (!input.approvalId) throw new ApprovalRequestNotFoundError();
    if (!input.operatorId) throw new ApprovalApproverRequiredError({ reason: 'operatorId required' });

    return this.withTransaction(async (tx) => {
      const req = await (tx as any).fjnApprovalRequest.findUnique({
        where: { id: input.approvalId },
      });
      if (!req) throw new ApprovalRequestNotFoundError({ approvalId: input.approvalId });

      // 仅 applicant 本人可取消
      if (input.operatorId !== req.applicantId) {
        throw new ApprovalCannotCancelOthersError({
          approvalId: input.approvalId,
          operatorId: input.operatorId,
          applicantId: req.applicantId,
        });
      }

      if (!canTransitApprovalRequestStatus(
        req.status as FjnApprovalRequestStatus,
        APPROVAL_REQUEST_STATUS.CANCELLED,
      )) {
        throw new ApprovalRequestNotCancellableError({
          approvalId: input.approvalId,
          status: req.status,
        });
      }

      const updated = await (tx as any).fjnApprovalRequest.update({
        where: { id: input.approvalId },
        data: { status: APPROVAL_REQUEST_STATUS.CANCELLED },
      });

      await this.emitEvent(tx, APPROVAL_EVENTS.REQUEST_CANCELLED, {
        approvalId: input.approvalId,
        approvalNo: req.approvalNo,
        reason: input.reason,
        operatorId: input.operatorId,
      });

      this.log('info', `Approval request cancelled: ${req.approvalNo}`, {
        reason: input.reason,
      });
      return updated;
    });
  }

  /**
   * 执行申请（approved → executed）
   *  - 业务 Service 真正执行高危操作时调用
   *  - 校验状态必须是 approved
   *  - 写 outbox 事件 REQUEST_EXECUTED
   */
  async executeRequest(input: ExecuteApprovalInput) {
    if (!input.approvalId) throw new ApprovalRequestNotFoundError();
    if (!input.executorId) throw new ApprovalApproverRequiredError({ reason: 'executorId required' });

    return this.withTransaction(async (tx) => {
      const req = await (tx as any).fjnApprovalRequest.findUnique({
        where: { id: input.approvalId },
      });
      if (!req) throw new ApprovalRequestNotFoundError({ approvalId: input.approvalId });
      if (req.status === APPROVAL_REQUEST_STATUS.EXECUTED) {
        throw new ApprovalRequestExecutedError({ approvalId: input.approvalId });
      }
      if (req.status !== APPROVAL_REQUEST_STATUS.APPROVED) {
        throw new ApprovalRequestNotExecutableError({
          approvalId: input.approvalId,
          status: req.status,
        });
      }

      const updated = await (tx as any).fjnApprovalRequest.update({
        where: { id: input.approvalId },
        data: {
          status: APPROVAL_REQUEST_STATUS.EXECUTED,
          executedAt: new Date(),
        },
      });

      await this.emitEvent(tx, APPROVAL_EVENTS.REQUEST_EXECUTED, {
        approvalId: input.approvalId,
        approvalNo: req.approvalNo,
        approvalType: req.approvalType,
        executorId: input.executorId,
        relatedType: req.relatedType,
        relatedId: req.relatedId,
        executedAt: updated.executedAt!.toISOString(),
      });

      this.log('info', `Approval request executed: ${req.approvalNo}`, {
        executorId: input.executorId,
      });
      return updated;
    });
  }

  /** 提升优先级 */
  async escalatePriority(input: EscalatePriorityInput) {
    if (!input.approvalId) throw new ApprovalRequestNotFoundError();
    if (!input.operatorId) throw new ApprovalApproverRequiredError();
    if (!isValidApprovalPriority(input.newPriority)) {
      throw new ApprovalPriorityInvalidError({ newPriority: input.newPriority });
    }

    return this.withTransaction(async (tx) => {
      const req = await (tx as any).fjnApprovalRequest.findUnique({
        where: { id: input.approvalId },
      });
      if (!req) throw new ApprovalRequestNotFoundError({ approvalId: input.approvalId });
      if (isTerminalApprovalRequestStatus(req.status as FjnApprovalRequestStatus)) {
        throw new ApprovalRequestStatusInvalidError({
          approvalId: input.approvalId,
          status: req.status,
        });
      }

      // 重新计算 expiresAt
      const hours = APPROVAL_DEFAULT_EXPIRES_HOURS[input.newPriority] ?? 72;
      const expiresAt = new Date(Date.now() + hours * 3600 * 1000);

      const updated = await (tx as any).fjnApprovalRequest.update({
        where: { id: input.approvalId },
        data: { priority: input.newPriority, expiresAt },
      });

      await this.emitEvent(tx, APPROVAL_EVENTS.PRIORITY_ESCALATED, {
        approvalId: input.approvalId,
        approvalNo: req.approvalNo,
        oldPriority: req.priority,
        newPriority: input.newPriority,
        reason: input.reason,
        operatorId: input.operatorId,
      });

      this.log('info', `Approval priority escalated: ${req.approvalNo}`, {
        from: req.priority,
        to: input.newPriority,
        reason: input.reason,
      });
      return updated;
    });
  }

  /** 过期申请（定时任务调用） */
  async expireRequest(input: ExpireApprovalInput) {
    if (!input.approvalId) throw new ApprovalRequestNotFoundError();
    return this.withTransaction(async (tx) => {
      const req = await (tx as any).fjnApprovalRequest.findUnique({
        where: { id: input.approvalId },
        include: { steps: { orderBy: { stepNo: 'asc' } } },
      });
      if (!req) throw new ApprovalRequestNotFoundError({ approvalId: input.approvalId });
      if (isTerminalApprovalRequestStatus(req.status as FjnApprovalRequestStatus)) {
        return req; // 终态不变
      }
      if (!req.expiresAt || req.expiresAt.getTime() >= Date.now()) {
        return req; // 未过期
      }

      // 标记当前 step 为 expired
      const currentStep = req.steps.find((s: any) => s.stepNo === req.currentStep);
      if (currentStep && currentStep.status === APPROVAL_STEP_STATUS.PENDING) {
        await (tx as any).fjnApprovalStep.update({
          where: { id: currentStep.id },
          data: { status: APPROVAL_STEP_STATUS.EXPIRED },
        });
      }

      const updated = await (tx as any).fjnApprovalRequest.update({
        where: { id: input.approvalId },
        data: { status: APPROVAL_REQUEST_STATUS.EXPIRED },
      });

      await this.emitEvent(tx, APPROVAL_EVENTS.REQUEST_EXPIRED, {
        approvalId: input.approvalId,
        approvalNo: req.approvalNo,
        expiresAt: req.expiresAt?.toISOString() ?? null,
        operatorId: input.operatorId,
      });

      this.log('info', `Approval request expired: ${req.approvalNo}`);
      return updated;
    });
  }

  /**
   * 批量过期（定时任务）
   *  - 找出所有 expiresAt < now 且 status ∈ {pending, in_review} 的申请
   *  - 逐个调用 expireRequest
   */
  async expireOverdueRequests(options: { batchSize?: number; operatorId?: string } = {}) {
    const batchSize = options.batchSize ?? 100;
    const now = new Date();
    const overdue = await (this.prisma as any).fjnApprovalRequest.findMany({
      where: {
        status: { in: [APPROVAL_REQUEST_STATUS.PENDING, APPROVAL_REQUEST_STATUS.IN_REVIEW] },
        expiresAt: { lt: now },
      },
      take: batchSize,
      orderBy: { expiresAt: 'asc' },
    });

    let expiredCount = 0;
    for (const req of overdue) {
      try {
        await this.expireRequest({ approvalId: req.id, operatorId: options.operatorId });
        expiredCount++;
      } catch (e) {
        this.log('error', `Failed to expire approval ${req.approvalNo}`, {
          error: (e as Error).message,
        });
      }
    }
    this.log('info', `Expired ${expiredCount} overdue approval requests`);
    return { expiredCount, total: overdue.length };
  }

  // ==========================================================
  // 3.2 查询
  // ==========================================================

  async getRequest(approvalId: string) {
    if (!approvalId) throw new ApprovalRequestNotFoundError();
    const req = await (this.prisma as any).fjnApprovalRequest.findUnique({
      where: { id: approvalId },
      include: { steps: { orderBy: { stepNo: 'asc' } } },
    });
    if (!req) throw new ApprovalRequestNotFoundError({ approvalId });
    return {
      ...req,
      steps: req.steps.map((s: any) => ({
        id: s.id,
        requestId: s.requestId,
        stepNo: s.stepNo,
        stepName: s.stepName,
        approverId: s.approverId,
        approverRole: s.approverRole,
        status: s.status,
        comment: s.comment,
        approvedAt: s.approvedAt,
        createdAt: s.createdAt,
      })),
    } as ApprovalRequestView;
  }

  async getStep(stepId: string) {
    if (!stepId) throw new ApprovalStepNotFoundError();
    const step = await (this.prisma as any).fjnApprovalStep.findUnique({
      where: { id: stepId },
    });
    if (!step) throw new ApprovalStepNotFoundError({ stepId });
    return step as ApprovalStepView;
  }

  async listRequests(input: ListApprovalRequestsInput) {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, 200);
    const where: any = {};
    if (input.approvalType) where.approvalType = input.approvalType;
    if (input.status) where.status = input.status;
    if (input.applicantId) where.applicantId = input.applicantId;
    if (input.priority) where.priority = input.priority;
    if (input.relatedType) where.relatedType = input.relatedType;
    if (input.relatedId) where.relatedId = input.relatedId;

    const [items, total] = await Promise.all([
      (this.prisma as any).fjnApprovalRequest.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).fjnApprovalRequest.count({ where }),
    ]);

    return {
      items: items.map((r: any) => ({
        id: r.id,
        approvalNo: r.approvalNo,
        approvalType: r.approvalType,
        title: r.title,
        applicantId: r.applicantId,
        applicantType: r.applicantType,
        currentStep: r.currentStep,
        totalSteps: r.totalSteps,
        status: r.status,
        priority: r.priority,
        amount: r.amount?.toString() ?? null,
        currency: r.currency,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      })) as ApprovalRequestSummary[],
      total,
      page,
      pageSize,
    };
  }

  /**
   * 列出指定申请人申请
   */
  async listMyRequests(applicantId: string, page = 1, pageSize = 20) {
    return this.listRequests({ applicantId, page, pageSize });
  }

  /**
   * 列出当前 approver 待审批（currentStep 的 approverRole 匹配 / currentStep 的 approver 字段空）
   *  - 简化：只按 status = in_review / pending 查询
   */
  async listPendingForApprover(approverId: string, page = 1, pageSize = 20) {
    return this.listRequests({
      status: APPROVAL_REQUEST_STATUS.IN_REVIEW,
      page,
      pageSize,
    });
  }
}

// 工厂函数
export function createFjnApprovalService(options: FjnServiceOptions = {}) {
  return new FjnApprovalService(options);
}
