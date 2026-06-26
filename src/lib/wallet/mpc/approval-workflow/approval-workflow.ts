/**
 * 审批工作流 (ApprovalWorkflow)
 *
 * 负责：
 *  - 审批流程模板的定义与管理
 *  - 多阶段审批流程的编排与流转
 *  - 审批阶段的条件判断与跳转
 *  - 与审批服务的深度集成
 *  - 审批流程的监控与统计
 *  - 支持单人、多人、顺序、并行、任意数等多种审批模式
 */

import {
  ApprovalFlow,
  ApprovalStage,
  ApprovalRequest,
  ApprovalStatus,
  ApprovalMode,
  ApprovalConfig,
  ApproverInfo,
  TransactionSummary,
  MPCError,
  MPCErrorCode,
  WalletTier,
} from '../mpc.types';
import { ApprovalService } from './approval-service';

// =============================================================================
// 工作流配置接口
// =============================================================================

export interface ApprovalWorkflowOptions {
  /** 审批服务 */
  approvalService?: ApprovalService;
  /** 是否自动流转到下一阶段 */
  autoAdvanceStages?: boolean;
  /** 阶段间的冷却时间（毫秒） */
  stageCooldownMs?: number;
  /** 最大重试次数 */
  maxRetryCount?: number;
}

// =============================================================================
// 工作流执行上下文
// =============================================================================

export interface WorkflowExecutionContext {
  /** 签名请求 ID */
  signatureRequestId: string;
  /** 审批流程 ID */
  flowId: string;
  /** 当前阶段索引 */
  currentStageIndex: number;
  /** 交易金额 */
  amount?: string;
  /** 钱包层级 */
  walletTier?: WalletTier;
  /** 创建人 ID */
  createdBy: string;
  /** 交易摘要 */
  transactionSummary?: TransactionSummary;
  /** 额外上下文数据 */
  extra?: Record<string, unknown>;
}

// =============================================================================
// 工作流执行状态
// =============================================================================

export interface WorkflowExecutionState {
  /** 执行 ID */
  executionId: string;
  /** 流程 ID */
  flowId: string;
  /** 签名请求 ID */
  signatureRequestId: string;
  /** 当前阶段索引 */
  currentStageIndex: number;
  /** 已完成的阶段索引列表 */
  completedStages: number[];
  /** 被跳过的阶段索引列表 */
  skippedStages: number[];
  /** 总体状态 */
  overallStatus: ApprovalStatus;
  /** 各阶段审批请求 ID 映射 */
  stageRequestIds: Map<number, string>;
  /** 开始时间 */
  startTime: Date;
  /** 结束时间 */
  endTime?: Date;
  /** 重试次数 */
  retryCount: number;
}

// =============================================================================
// 阶段评估结果
// =============================================================================

export interface StageEvaluationResult {
  /** 是否应该执行此阶段 */
  shouldExecute: boolean;
  /** 跳过原因（如果跳过） */
  skipReason?: string;
  /** 需要调整的审批配置 */
  adjustedConfig?: Partial<ApprovalConfig>;
}

// =============================================================================
// 审批工作流主类
// =============================================================================

export class ApprovalWorkflow {
  private approvalFlows: Map<string, ApprovalFlow> = new Map();
  private executionStates: Map<string, WorkflowExecutionState> = new Map();
  private approvalService: ApprovalService;
  private autoAdvanceStages: boolean;
  private stageCooldownMs: number;
  private maxRetryCount: number;

  private stats = {
    totalWorkflowsStarted: 0,
    totalWorkflowsCompleted: 0,
    totalWorkflowsRejected: 0,
    totalWorkflowsExpired: 0,
    totalStagesExecuted: 0,
    averageWorkflowDurationMs: 0,
    totalWorkflowDurationMs: 0,
  };

  constructor(options: ApprovalWorkflowOptions = {}) {
    this.approvalService = options.approvalService || new ApprovalService();
    this.autoAdvanceStages = options.autoAdvanceStages ?? true;
    this.stageCooldownMs = options.stageCooldownMs || 0;
    this.maxRetryCount = options.maxRetryCount || 3;
  }

  // ===========================================================================
  // 审批流程模板管理
  // ===========================================================================

  /**
   * 创建审批流程模板
   */
  createFlow(params: {
    name: string;
    description?: string;
    stages: Omit<ApprovalStage, 'id'>[];
    applicableTiers?: WalletTier[];
    minAmount?: string;
    maxAmount?: string;
    createdBy: string;
  }): ApprovalFlow {
    const now = new Date();
    const flow: ApprovalFlow = {
      id: this.generateId('flow'),
      name: params.name,
      description: params.description,
      enabled: true,
      stages: params.stages.map((stage, index) => ({
        ...stage,
        id: this.generateId('stage'),
        order: stage.order ?? index,
      })),
      applicableTiers: params.applicableTiers,
      minAmount: params.minAmount,
      maxAmount: params.maxAmount,
      createdBy: params.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    this.approvalFlows.set(flow.id, flow);
    return flow;
  }

  /**
   * 注册审批流程模板
   */
  registerFlow(flow: ApprovalFlow): void {
    this.approvalFlows.set(flow.id, flow);
  }

  /**
   * 批量注册审批流程模板
   */
  registerFlows(flows: ApprovalFlow[]): void {
    for (const flow of flows) {
      this.registerFlow(flow);
    }
  }

  /**
   * 更新审批流程模板
   */
  updateFlow(flowId: string, updates: Partial<ApprovalFlow>): ApprovalFlow {
    const flow = this.getFlow(flowId);
    const updated: ApprovalFlow = {
      ...flow,
      ...updates,
      updatedAt: new Date(),
    };
    this.approvalFlows.set(flowId, updated);
    return updated;
  }

  /**
   * 获取审批流程模板
   */
  getFlow(flowId: string): ApprovalFlow {
    const flow = this.approvalFlows.get(flowId);
    if (!flow) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `审批流程不存在: ${flowId}`,
      );
    }
    return flow;
  }

  /**
   * 查找审批流程（安全版本）
   */
  findFlow(flowId: string): ApprovalFlow | undefined {
    return this.approvalFlows.get(flowId);
  }

  /**
   * 获取所有审批流程模板
   */
  getAllFlows(): ApprovalFlow[] {
    return Array.from(this.approvalFlows.values());
  }

  /**
   * 删除审批流程模板
   */
  deleteFlow(flowId: string): void {
    if (!this.approvalFlows.has(flowId)) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `审批流程不存在: ${flowId}`,
      );
    }
    this.approvalFlows.delete(flowId);
  }

  /**
   * 启用/禁用审批流程
   */
  setFlowEnabled(flowId: string, enabled: boolean): ApprovalFlow {
    return this.updateFlow(flowId, { enabled });
  }

  // ===========================================================================
  // 流程匹配置
  // ===========================================================================

  /**
   * 根据条件匹配合适的审批流程
   */
  matchFlow(params: {
    walletTier?: WalletTier;
    amount?: string;
    chainType?: string;
  }): ApprovalFlow | undefined {
    const flows = this.getAllFlows().filter((f) => f.enabled);

    for (const flow of flows) {
      if (this.isFlowApplicable(flow, params)) {
        return flow;
      }
    }

    return undefined;
  }

  /**
   * 检查流程是否适用
   */
  private isFlowApplicable(
    flow: ApprovalFlow,
    params: {
      walletTier?: WalletTier;
      amount?: string;
      chainType?: string;
    },
  ): boolean {
    if (flow.applicableTiers && flow.applicableTiers.length > 0) {
      if (!params.walletTier || !flow.applicableTiers.includes(params.walletTier)) {
        return false;
      }
    }

    if (params.amount && flow.minAmount) {
      if (BigInt(params.amount) < BigInt(flow.minAmount)) {
        return false;
      }
    }

    if (params.amount && flow.maxAmount) {
      if (BigInt(params.amount) > BigInt(flow.maxAmount)) {
        return false;
      }
    }

    return true;
  }

  // ===========================================================================
  // 工作流执行
  // ===========================================================================

  /**
   * 启动审批工作流
   */
  startWorkflow(context: WorkflowExecutionContext): WorkflowExecutionState {
    const flow = this.getFlow(context.flowId);

    if (!flow.enabled) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `审批流程已禁用: ${context.flowId}`,
      );
    }

    const executionState: WorkflowExecutionState = {
      executionId: this.generateId('exec'),
      flowId: context.flowId,
      signatureRequestId: context.signatureRequestId,
      currentStageIndex: 0,
      completedStages: [],
      skippedStages: [],
      overallStatus: ApprovalStatus.PENDING,
      stageRequestIds: new Map(),
      startTime: new Date(),
      retryCount: 0,
    };

    this.executionStates.set(executionState.executionId, executionState);
    this.stats.totalWorkflowsStarted++;

    this.executeCurrentStage(executionState, context);

    return executionState;
  }

  /**
   * 执行当前阶段
   */
  private executeCurrentStage(
    state: WorkflowExecutionState,
    context: WorkflowExecutionContext,
  ): void {
    const flow = this.getFlow(state.flowId);
    const sortedStages = [...flow.stages].sort((a, b) => a.order - b.order);

    if (state.currentStageIndex >= sortedStages.length) {
      this.completeWorkflow(state, ApprovalStatus.APPROVED);
      return;
    }

    const currentStage = sortedStages[state.currentStageIndex];
    const evaluation = this.evaluateStage(currentStage, context);

    if (!evaluation.shouldExecute) {
      state.skippedStages.push(state.currentStageIndex);
      this.stats.totalStagesExecuted++;

      if (this.autoAdvanceStages) {
        setTimeout(() => {
          this.advanceToNextStage(state, context);
        }, this.stageCooldownMs);
      }
      return;
    }

    const config: ApprovalConfig = {
      mode: currentStage.mode,
      requiredApprovals: currentStage.requiredApprovals,
      approvers: currentStage.approvers.map((a) => a.userId),
      timeoutSeconds: currentStage.timeoutSeconds,
      allowDelegation: true,
      approvalLevel: currentStage.order,
      ...evaluation.adjustedConfig,
    };

    const approvalRequest = this.approvalService.createApprovalRequest({
      signatureRequestId: context.signatureRequestId,
      title: `${flow.name} - ${currentStage.name}`,
      description: currentStage.name,
      config,
      approvers: currentStage.approvers,
      createdBy: context.createdBy,
      transactionSummary: context.transactionSummary,
      approvalFlowId: flow.id,
    });

    state.stageRequestIds.set(state.currentStageIndex, approvalRequest.id);
    this.stats.totalStagesExecuted++;
  }

  /**
   * 评估阶段是否应该执行
   */
  private evaluateStage(
    stage: ApprovalStage,
    context: WorkflowExecutionContext,
  ): StageEvaluationResult {
    const result: StageEvaluationResult = {
      shouldExecute: true,
    };

    if (stage.skippable && context.amount) {
      const amount = BigInt(context.amount);
      if (amount === BigInt(0)) {
        result.shouldExecute = false;
        result.skipReason = '零金额交易跳过审批';
        return result;
      }
    }

    if (stage.skippable && stage.skipCondition) {
      const skipMatch = this.evaluateSkipCondition(stage.skipCondition, context);
      if (skipMatch) {
        result.shouldExecute = false;
        result.skipReason = stage.skipCondition;
        return result;
      }
    }

    return result;
  }

  /**
   * 评估跳过条件
   */
  private evaluateSkipCondition(
    condition: string,
    context: WorkflowExecutionContext,
  ): boolean {
    try {
      if (condition.includes('amount <') && context.amount) {
        const match = condition.match(/amount\s*<\s*(\d+)/);
        if (match) {
          const threshold = BigInt(match[1]);
          return BigInt(context.amount) < threshold;
        }
      }

      if (condition.includes('tier ==') && context.walletTier) {
        const match = condition.match(/tier\s*==\s*['"]?(\w+)['"]?/);
        if (match) {
          return context.walletTier === match[1];
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * 推进到下一阶段
   */
  private advanceToNextStage(
    state: WorkflowExecutionState,
    context: WorkflowExecutionContext,
  ): void {
    const flow = this.getFlow(state.flowId);
    const sortedStages = [...flow.stages].sort((a, b) => a.order - b.order);

    state.currentStageIndex++;

    if (state.currentStageIndex >= sortedStages.length) {
      this.completeWorkflow(state, ApprovalStatus.APPROVED);
    } else {
      this.executeCurrentStage(state, context);
    }
  }

  /**
   * 处理阶段审批完成
   */
  handleStageApprovalComplete(
    executionId: string,
    stageIndex: number,
    status: ApprovalStatus,
  ): void {
    const state = this.getExecutionState(executionId);
    const flow = this.getFlow(state.flowId);
    const sortedStages = [...flow.stages].sort((a, b) => a.order - b.order);

    if (stageIndex !== state.currentStageIndex) {
      return;
    }

    if (status === ApprovalStatus.REJECTED) {
      state.completedStages.push(stageIndex);
      this.completeWorkflow(state, ApprovalStatus.REJECTED);
      this.stats.totalWorkflowsRejected++;
      return;
    }

    if (status === ApprovalStatus.EXPIRED) {
      state.completedStages.push(stageIndex);
      this.completeWorkflow(state, ApprovalStatus.EXPIRED);
      this.stats.totalWorkflowsExpired++;
      return;
    }

    if (status === ApprovalStatus.APPROVED) {
      state.completedStages.push(stageIndex);

      if (this.autoAdvanceStages) {
        const context: WorkflowExecutionContext = {
          signatureRequestId: state.signatureRequestId,
          flowId: state.flowId,
          currentStageIndex: state.currentStageIndex,
          createdBy: 'system',
        };

        setTimeout(() => {
          this.advanceToNextStage(state, context);
        }, this.stageCooldownMs);
      }
    }
  }

  /**
   * 完成工作流
   */
  private completeWorkflow(
    state: WorkflowExecutionState,
    finalStatus: ApprovalStatus,
  ): void {
    state.overallStatus = finalStatus;
    state.endTime = new Date();

    if (finalStatus === ApprovalStatus.APPROVED) {
      this.stats.totalWorkflowsCompleted++;
      const duration = state.endTime.getTime() - state.startTime.getTime();
      this.stats.totalWorkflowDurationMs += duration;
      this.stats.averageWorkflowDurationMs =
        this.stats.totalWorkflowDurationMs / this.stats.totalWorkflowsCompleted;
    }
  }

  // ===========================================================================
  // 执行状态查询
  // ===========================================================================

  /**
   * 获取执行状态
   */
  getExecutionState(executionId: string): WorkflowExecutionState {
    const state = this.executionStates.get(executionId);
    if (!state) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `工作流执行不存在: ${executionId}`,
      );
    }
    return state;
  }

  /**
   * 查找执行状态
   */
  findExecutionState(executionId: string): WorkflowExecutionState | undefined {
    return this.executionStates.get(executionId);
  }

  /**
   * 根据签名请求 ID 获取执行状态
   */
  getExecutionBySignatureRequest(
    signatureRequestId: string,
  ): WorkflowExecutionState | undefined {
    for (const state of this.executionStates.values()) {
      if (state.signatureRequestId === signatureRequestId) {
        return state;
      }
    }
    return undefined;
  }

  /**
   * 获取工作流进度
   */
  getWorkflowProgress(executionId: string): {
    currentStage: number;
    totalStages: number;
    completedStages: number;
    progressPercent: number;
  } {
    const state = this.getExecutionState(executionId);
    const flow = this.getFlow(state.flowId);
    const totalStages = flow.stages.length;
    const completed = state.completedStages.length + state.skippedStages.length;
    const progressPercent = totalStages > 0 ? (completed / totalStages) * 100 : 0;

    return {
      currentStage: state.currentStageIndex,
      totalStages,
      completedStages: completed,
      progressPercent,
    };
  }

  // ===========================================================================
  // 阶段管理
  // ===========================================================================

  /**
   * 添加阶段
   */
  addStage(
    flowId: string,
    stage: Omit<ApprovalStage, 'id'>,
  ): ApprovalFlow {
    const flow = this.getFlow(flowId);
    const newStage: ApprovalStage = {
      ...stage,
      id: this.generateId('stage'),
    };
    flow.stages.push(newStage);
    flow.updatedAt = new Date();
    this.approvalFlows.set(flowId, flow);
    return flow;
  }

  /**
   * 更新阶段
   */
  updateStage(
    flowId: string,
    stageId: string,
    updates: Partial<ApprovalStage>,
  ): ApprovalFlow {
    const flow = this.getFlow(flowId);
    const stageIndex = flow.stages.findIndex((s) => s.id === stageId);
    if (stageIndex === -1) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `阶段不存在: ${stageId}`,
      );
    }
    flow.stages[stageIndex] = {
      ...flow.stages[stageIndex],
      ...updates,
    };
    flow.updatedAt = new Date();
    this.approvalFlows.set(flowId, flow);
    return flow;
  }

  /**
   * 删除阶段
   */
  removeStage(flowId: string, stageId: string): ApprovalFlow {
    const flow = this.getFlow(flowId);
    const initialLength = flow.stages.length;
    flow.stages = flow.stages.filter((s) => s.id !== stageId);
    if (flow.stages.length === initialLength) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `阶段不存在: ${stageId}`,
      );
    }
    flow.updatedAt = new Date();
    this.approvalFlows.set(flowId, flow);
    return flow;
  }

  /**
   * 重新排序阶段
   */
  reorderStages(flowId: string, stageOrder: string[]): ApprovalFlow {
    const flow = this.getFlow(flowId);
    const orderedStages: ApprovalStage[] = [];

    for (let i = 0; i < stageOrder.length; i++) {
      const stage = flow.stages.find((s) => s.id === stageOrder[i]);
      if (stage) {
        orderedStages.push({ ...stage, order: i });
      }
    }

    const remainingStages = flow.stages.filter(
      (s) => !stageOrder.includes(s.id),
    );
    remainingStages.forEach((stage, i) => {
      orderedStages.push({ ...stage, order: stageOrder.length + i });
    });

    flow.stages = orderedStages;
    flow.updatedAt = new Date();
    this.approvalFlows.set(flowId, flow);
    return flow;
  }

  // ===========================================================================
  // 统计信息
  // ===========================================================================

  /**
   * 获取工作流统计信息
   */
  getStats() {
    const activeExecutions = Array.from(this.executionStates.values()).filter(
      (s) => s.overallStatus === ApprovalStatus.PENDING,
    ).length;

    return {
      ...this.stats,
      activeExecutions,
      totalFlows: this.approvalFlows.size,
      completionRate:
        this.stats.totalWorkflowsStarted > 0
          ? this.stats.totalWorkflowsCompleted / this.stats.totalWorkflowsStarted
          : 0,
      rejectionRate:
        this.stats.totalWorkflowsStarted > 0
          ? this.stats.totalWorkflowsRejected / this.stats.totalWorkflowsStarted
          : 0,
    };
  }

  /**
   * 获取指定流程的统计
   */
  getFlowStats(flowId: string) {
    const flowExecutions = Array.from(this.executionStates.values()).filter(
      (s) => s.flowId === flowId,
    );

    const approved = flowExecutions.filter(
      (s) => s.overallStatus === ApprovalStatus.APPROVED,
    ).length;
    const rejected = flowExecutions.filter(
      (s) => s.overallStatus === ApprovalStatus.REJECTED,
    ).length;
    const expired = flowExecutions.filter(
      (s) => s.overallStatus === ApprovalStatus.EXPIRED,
    ).length;
    const pending = flowExecutions.filter(
      (s) => s.overallStatus === ApprovalStatus.PENDING,
    ).length;

    return {
      totalExecutions: flowExecutions.length,
      approved,
      rejected,
      expired,
      pending,
      approvalRate: flowExecutions.length > 0 ? approved / flowExecutions.length : 0,
    };
  }

  // ===========================================================================
  // 工具方法
  // ===========================================================================

  /**
   * 生成唯一 ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * 获取审批服务实例
   */
  getApprovalService(): ApprovalService {
    return this.approvalService;
  }

  /**
   * 手动推进工作流
   */
  advanceWorkflow(
    executionId: string,
    context: WorkflowExecutionContext,
  ): void {
    const state = this.getExecutionState(executionId);
    if (state.overallStatus !== ApprovalStatus.PENDING) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `工作流状态不允许推进: ${state.overallStatus}`,
      );
    }
    this.advanceToNextStage(state, context);
  }

  /**
   * 取消工作流
   */
  cancelWorkflow(executionId: string, cancelledBy: string, reason?: string): void {
    const state = this.getExecutionState(executionId);
    if (state.overallStatus !== ApprovalStatus.PENDING) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `工作流状态不允许取消: ${state.overallStatus}`,
      );
    }

    for (const [, requestId] of state.stageRequestIds) {
      try {
        this.approvalService.cancel(requestId, cancelledBy, reason);
      } catch {
        // 忽略已完成的审批请求取消错误
      }
    }

    state.overallStatus = ApprovalStatus.CANCELLED;
    state.endTime = new Date();
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.approvalService.dispose();
  }
}
