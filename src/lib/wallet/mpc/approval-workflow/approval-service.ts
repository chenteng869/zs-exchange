/**
 * 审批服务 (ApprovalService)
 *
 * 负责：
 *  - 审批请求的创建与管理
 *  - 审批操作（通过/拒绝/委托/评论）
 *  - 审批状态跟踪
 *  - 审批超时处理
 *  - 审批历史记录
 */

import {
  ApprovalRequest,
  ApprovalStatus,
  ApprovalMode,
  ApprovalConfig,
  ApproverInfo,
  ApprovalHistoryEntry,
  TransactionSummary,
  MPCError,
  MPCErrorCode,
  ApprovalFlow,
  ApprovalStage,
} from '../mpc.types';
import { ApprovalNotifier } from './approval-notifier';

// =============================================================================
// 审批服务配置接口
// =============================================================================

export interface ApprovalServiceOptions {
  /** 审批通知器 */
  notifier?: ApprovalNotifier;
  /** 默认超时时间（秒） */
  defaultTimeoutSeconds?: number;
  /** 是否启用自动过期检查 */
  enableAutoExpire?: boolean;
  /** 过期检查间隔（毫秒） */
  expireCheckIntervalMs?: number;
}

// =============================================================================
// 审批服务类
// =============================================================================

export class ApprovalService {
  private approvalRequests: Map<string, ApprovalRequest> = new Map();
  private approvalFlows: Map<string, ApprovalFlow> = new Map();
  private notifier: ApprovalNotifier;
  private defaultTimeoutSeconds: number;
  private enableAutoExpire: boolean;
  private expireCheckIntervalMs: number;
  private expireCheckTimer?: NodeJS.Timeout;

  private stats = {
    totalCreated: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalExpired: 0,
    totalCancelled: 0,
    averageApprovalTimeMs: 0,
    totalApprovalTimeMs: 0,
  };

  constructor(options: ApprovalServiceOptions = {}) {
    this.notifier = options.notifier || new ApprovalNotifier();
    this.defaultTimeoutSeconds = options.defaultTimeoutSeconds || 86400;
    this.enableAutoExpire = options.enableAutoExpire ?? true;
    this.expireCheckIntervalMs = options.expireCheckIntervalMs || 60 * 1000;

    if (this.enableAutoExpire) {
      this.startExpireCheck();
    }
  }

  // ===========================================================================
  // 审批流程管理
  // ===========================================================================

  /**
   * 注册审批流程模板
   */
  registerApprovalFlow(flow: ApprovalFlow): void {
    this.approvalFlows.set(flow.id, flow);
  }

  /**
   * 批量注册审批流程模板
   */
  registerApprovalFlows(flows: ApprovalFlow[]): void {
    for (const flow of flows) {
      this.registerApprovalFlow(flow);
    }
  }

  /**
   * 获取审批流程模板
   */
  getApprovalFlow(flowId: string): ApprovalFlow | undefined {
    return this.approvalFlows.get(flowId);
  }

  /**
   * 获取所有审批流程模板
   */
  getAllApprovalFlows(): ApprovalFlow[] {
    return Array.from(this.approvalFlows.values());
  }

  /**
   * 删除审批流程模板
   */
  removeApprovalFlow(flowId: string): void {
    this.approvalFlows.delete(flowId);
  }

  // ===========================================================================
  // 审批请求创建
  // ===========================================================================

  /**
   * 创建审批请求
   */
  createApprovalRequest(params: {
    signatureRequestId: string;
    title: string;
    description?: string;
    config: ApprovalConfig;
    approvers: ApproverInfo[];
    createdBy: string;
    transactionSummary?: TransactionSummary;
    approvalFlowId?: string;
  }): ApprovalRequest {
    const now = new Date();
    const timeoutSeconds = params.config.timeoutSeconds || this.defaultTimeoutSeconds;
    const expiresAt = new Date(now.getTime() + timeoutSeconds * 1000);

    const request: ApprovalRequest = {
      id: this.generateId('ar'),
      signatureRequestId: params.signatureRequestId,
      approvalFlowId: params.approvalFlowId || '',
      title: params.title,
      description: params.description,
      status: ApprovalStatus.PENDING,
      currentStageIndex: 0,
      config: params.config,
      approvers: params.approvers,
      approvedBy: [],
      approvalHistory: [],
      createdBy: params.createdBy,
      createdAt: now,
      expiresAt,
      transactionSummary: params.transactionSummary,
    };

    this.approvalRequests.set(request.id, request);
    this.stats.totalCreated++;

    this.addHistoryEntry(request, {
      userId: params.createdBy,
      userName: 'System',
      action: 'comment',
      comment: '创建审批请求',
    });

    this.notifier.notifyApprovalRequested(request, params.approvers).catch(console.error);

    return request;
  }

  /**
   * 根据审批流程模板创建审批请求
   */
  createApprovalRequestFromFlow(params: {
    signatureRequestId: string;
    flowId: string;
    createdBy: string;
    transactionSummary?: TransactionSummary;
    amount?: string;
  }): ApprovalRequest {
    const flow = this.approvalFlows.get(params.flowId);
    if (!flow) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `审批流程不存在: ${params.flowId}`,
      );
    }

    if (!flow.enabled) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `审批流程已禁用: ${params.flowId}`,
      );
    }

    const applicableStage = this.findApplicableStage(flow, params.amount);
    if (!applicableStage) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `没有适用于当前金额的审批阶段`,
      );
    }

    const config: ApprovalConfig = {
      mode: applicableStage.mode,
      requiredApprovals: applicableStage.requiredApprovals,
      approvers: applicableStage.approvers.map((a) => a.userId),
      timeoutSeconds: applicableStage.timeoutSeconds,
      allowDelegation: true,
      approvalLevel: applicableStage.order,
    };

    return this.createApprovalRequest({
      signatureRequestId: params.signatureRequestId,
      title: flow.name,
      description: flow.description,
      config,
      approvers: applicableStage.approvers,
      createdBy: params.createdBy,
      transactionSummary: params.transactionSummary,
      approvalFlowId: flow.id,
    });
  }

  /**
   * 查找适用的审批阶段
   */
  private findApplicableStage(
    flow: ApprovalFlow,
    amount?: string,
  ): ApprovalStage | undefined {
    if (!amount || BigInt(amount) === BigInt(0)) {
      return flow.stages.sort((a, b) => a.order - b.order)[0];
    }

    const amt = BigInt(amount);
    const sortedStages = [...flow.stages].sort((a, b) => b.order - a.order);

    for (const stage of sortedStages) {
      const minAmount = flow.stages.find((s) => s.id === stage.id)?.order || 0;
      if (amt >= BigInt(minAmount)) {
        return stage;
      }
    }

    return flow.stages.sort((a, b) => a.order - b.order)[0];
  }

  // ===========================================================================
  // 审批操作
  // ===========================================================================

  /**
   * 批准审批请求
   */
  approve(
    requestId: string,
    approverId: string,
    comment?: string,
    ipAddress?: string,
    deviceInfo?: string,
  ): ApprovalRequest {
    const request = this.getApprovalRequest(requestId);

    if (request.status !== ApprovalStatus.PENDING) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `审批请求状态不允许批准: ${request.status}`,
      );
    }

    const approver = request.approvers.find((a) => a.userId === approverId);
    if (!approver) {
      throw new MPCError(
        MPCErrorCode.UNAUTHORIZED,
        `用户 ${approverId} 不是此审批的审批人`,
      );
    }

    if (request.approvedBy.includes(approverId)) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `用户 ${approverId} 已经批准过此请求`,
      );
    }

    request.approvedBy.push(approverId);

    this.addHistoryEntry(request, {
      userId: approverId,
      userName: approver.userName,
      action: 'approve',
      comment,
      ipAddress,
      deviceInfo,
    });

    const isApproved = this.checkApprovalComplete(request);
    if (isApproved) {
      request.status = ApprovalStatus.APPROVED;
      request.completedAt = new Date();
      this.stats.totalApproved++;
      this.updateAverageApprovalTime(request);
      this.notifier.notifyApprovalCompleted(request, ApprovalStatus.APPROVED).catch(console.error);
    } else {
      this.notifier.notifyApprovalApproved(request, approver).catch(console.error);
    }

    return request;
  }

  /**
   * 拒绝审批请求
   */
  reject(
    requestId: string,
    approverId: string,
    reason: string,
    ipAddress?: string,
    deviceInfo?: string,
  ): ApprovalRequest {
    const request = this.getApprovalRequest(requestId);

    if (request.status !== ApprovalStatus.PENDING) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `审批请求状态不允许拒绝: ${request.status}`,
      );
    }

    const approver = request.approvers.find((a) => a.userId === approverId);
    if (!approver) {
      throw new MPCError(
        MPCErrorCode.UNAUTHORIZED,
        `用户 ${approverId} 不是此审批的审批人`,
      );
    }

    request.status = ApprovalStatus.REJECTED;
    request.rejectedBy = {
      userId: approverId,
      reason,
      rejectedAt: new Date(),
    };
    request.completedAt = new Date();

    this.addHistoryEntry(request, {
      userId: approverId,
      userName: approver.userName,
      action: 'reject',
      comment: reason,
      ipAddress,
      deviceInfo,
    });

    this.stats.totalRejected++;
    this.notifier.notifyApprovalRejected(request, approver, reason).catch(console.error);

    return request;
  }

  /**
   * 取消审批请求
   */
  cancel(requestId: string, cancelledBy: string, reason?: string): ApprovalRequest {
    const request = this.getApprovalRequest(requestId);

    if (
      request.status !== ApprovalStatus.PENDING &&
      request.status !== ApprovalStatus.EXPIRED
    ) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `审批请求状态不允许取消: ${request.status}`,
      );
    }

    request.status = ApprovalStatus.CANCELLED;
    request.completedAt = new Date();

    this.addHistoryEntry(request, {
      userId: cancelledBy,
      userName: cancelledBy,
      action: 'comment',
      comment: `取消审批: ${reason || '无原因'}`,
    });

    this.stats.totalCancelled++;
    return request;
  }

  /**
   * 添加评论
   */
  addComment(
    requestId: string,
    userId: string,
    userName: string,
    comment: string,
  ): ApprovalRequest {
    const request = this.getApprovalRequest(requestId);

    this.addHistoryEntry(request, {
      userId,
      userName,
      action: 'comment',
      comment,
    });

    return request;
  }

  /**
   * 委托审批
   */
  delegate(
    requestId: string,
    fromUserId: string,
    toUserId: string,
    toUserName: string,
    reason?: string,
  ): ApprovalRequest {
    const request = this.getApprovalRequest(requestId);

    if (!request.config.allowDelegation) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        '此审批不允许委托',
      );
    }

    if (request.status !== ApprovalStatus.PENDING) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `审批请求状态不允许委托: ${request.status}`,
      );
    }

    const fromApprover = request.approvers.find((a) => a.userId === fromUserId);
    if (!fromApprover) {
      throw new MPCError(
        MPCErrorCode.UNAUTHORIZED,
        `用户 ${fromUserId} 不是此审批的审批人`,
      );
    }

    const newApprover: ApproverInfo = {
      userId: toUserId,
      userName: toUserName,
      role: fromApprover.role,
      weight: fromApprover.weight,
    };

    request.approvers = request.approvers.map((a) =>
      a.userId === fromUserId ? newApprover : a,
    );

    this.addHistoryEntry(request, {
      userId: fromUserId,
      userName: fromApprover.userName,
      action: 'delegate',
      comment: `委托给 ${toUserName}: ${reason || '无原因'}`,
    });

    return request;
  }

  // ===========================================================================
  // 审批状态查询
  // ===========================================================================

  /**
   * 获取审批请求
   */
  getApprovalRequest(requestId: string): ApprovalRequest {
    const request = this.approvalRequests.get(requestId);
    if (!request) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `审批请求不存在: ${requestId}`,
      );
    }
    return request;
  }

  /**
   * 获取审批请求（安全版本，不抛异常）
   */
  findApprovalRequest(requestId: string): ApprovalRequest | undefined {
    return this.approvalRequests.get(requestId);
  }

  /**
   * 获取签名请求对应的审批请求
   */
  getApprovalRequestBySignatureRequest(signatureRequestId: string): ApprovalRequest | undefined {
    for (const request of this.approvalRequests.values()) {
      if (request.signatureRequestId === signatureRequestId) {
        return request;
      }
    }
    return undefined;
  }

  /**
   * 获取用户的审批请求列表
   */
  getUserApprovalRequests(
    userId: string,
    status?: ApprovalStatus,
  ): ApprovalRequest[] {
    const requests: ApprovalRequest[] = [];

    for (const request of this.approvalRequests.values()) {
      const isApprover = request.approvers.some((a) => a.userId === userId);
      const isCreator = request.createdBy === userId;

      if (!isApprover && !isCreator) continue;
      if (status && request.status !== status) continue;

      requests.push(request);
    }

    return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * 获取待处理的审批请求
   */
  getPendingApprovals(approverId: string): ApprovalRequest[] {
    return this.getUserApprovalRequests(approverId, ApprovalStatus.PENDING).filter(
      (r) => r.approvers.some((a) => a.userId === approverId) && !r.approvedBy.includes(approverId),
    );
  }

  /**
   * 检查审批是否已完成
   */
  checkApprovalComplete(request: ApprovalRequest): boolean {
    switch (request.config.mode) {
      case ApprovalMode.SINGLE:
        return request.approvedBy.length >= 1;

      case ApprovalMode.MULTIPLE:
        return request.approvedBy.length >= request.approvers.length;

      case ApprovalMode.ANY_OF:
        return request.approvedBy.length >= (request.config.requiredApprovals || 1);

      case ApprovalMode.SEQUENTIAL:
      case ApprovalMode.PARALLEL:
        return request.approvedBy.length >= (request.config.requiredApprovals || request.approvers.length);

      default:
        return request.approvedBy.length >= 1;
    }
  }

  // ===========================================================================
  // 过期处理
  // ===========================================================================

  /**
   * 启动过期检查
   */
  private startExpireCheck(): void {
    this.expireCheckTimer = setInterval(() => {
      this.checkExpiredApprovals();
    }, this.expireCheckIntervalMs) as unknown as NodeJS.Timeout;
  }

  /**
   * 检查过期的审批
   */
  private checkExpiredApprovals(): void {
    const now = new Date();

    for (const request of this.approvalRequests.values()) {
      if (request.status === ApprovalStatus.PENDING && now > request.expiresAt) {
        this.expireApproval(request);
      }
    }
  }

  /**
   * 过期审批
   */
  private expireApproval(request: ApprovalRequest): void {
    request.status = ApprovalStatus.EXPIRED;
    request.completedAt = new Date();

    this.addHistoryEntry(request, {
      userId: 'system',
      userName: 'System',
      action: 'comment',
      comment: '审批已过期',
    });

    this.stats.totalExpired++;
    this.notifier.notifyApprovalExpired(request).catch(console.error);
  }

  /**
   * 手动触发过期检查
   */
  triggerExpireCheck(): void {
    this.checkExpiredApprovals();
  }

  // ===========================================================================
  // 历史记录
  // ===========================================================================

  /**
   * 添加历史记录条目
   */
  private addHistoryEntry(
    request: ApprovalRequest,
    entry: Omit<ApprovalHistoryEntry, 'id' | 'timestamp'>,
  ): void {
    const historyEntry: ApprovalHistoryEntry = {
      id: this.generateId('ah'),
      timestamp: new Date(),
      ...entry,
    };
    request.approvalHistory.push(historyEntry);
  }

  /**
   * 获取审批历史
   */
  getApprovalHistory(requestId: string): ApprovalHistoryEntry[] {
    const request = this.getApprovalRequest(requestId);
    return [...request.approvalHistory].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  // ===========================================================================
  // 统计信息
  // ===========================================================================

  /**
   * 获取统计信息
   */
  getStats() {
    const pendingCount = Array.from(this.approvalRequests.values()).filter(
      (r) => r.status === ApprovalStatus.PENDING,
    ).length;

    return {
      ...this.stats,
      pendingCount,
      totalRequests: this.approvalRequests.size,
      approvalRate:
        this.stats.totalCreated > 0
          ? this.stats.totalApproved / this.stats.totalCreated
          : 0,
    };
  }

  /**
   * 更新平均审批时间
   */
  private updateAverageApprovalTime(request: ApprovalRequest): void {
    if (!request.completedAt) return;

    const approvalTime = request.completedAt.getTime() - request.createdAt.getTime();
    this.stats.totalApprovalTimeMs += approvalTime;
    this.stats.averageApprovalTimeMs =
      this.stats.totalApprovalTimeMs / this.stats.totalApproved;
  }

  // ===========================================================================
  // 工具方法
  // ===========================================================================

  /**
   * 生成 ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * 检查用户是否可以审批
   */
  canApprove(requestId: string, userId: string): boolean {
    const request = this.findApprovalRequest(requestId);
    if (!request) return false;
    if (request.status !== ApprovalStatus.PENDING) return false;
    if (!request.approvers.some((a) => a.userId === userId)) return false;
    if (request.approvedBy.includes(userId)) return false;
    return true;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.expireCheckTimer) {
      clearInterval(this.expireCheckTimer);
      this.expireCheckTimer = undefined;
    }
    this.notifier.dispose();
  }
}
