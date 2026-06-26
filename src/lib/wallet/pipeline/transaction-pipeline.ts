/**
 * 交易流水线主类 (Transaction Pipeline)
 *
 * 职责：
 *  - 管理9阶段交易流水线的完整执行流程
 *  - 支持阶段跳过和重试机制
 *  - 支持中间状态持久化
 *  - 支持流水线回滚（部分阶段）
 *  - 阶段间数据传递
 *  - 中间件/管道模式支持
 *  - 进度追踪和事件回调
 *
 * 9 阶段流水线架构：
 *  1. build        - 交易构建阶段
 *  2. simulate     - 交易模拟阶段
 *  3. risk_check   - 风控检查阶段
 *  4. balance_check- 余额检查阶段
 *  5. signature    - 签名阶段
 *  6. broadcast    - 广播阶段
 *  7. confirmation - 确认阶段
 *  8. audit        - 审计阶段
 *  9. notify       - 通知阶段
 */

import {
  PipelineStage,
  PipelineStatus,
  StageStatus,
  type PipelineContext,
  type PipelineResult,
  type PipelineConfig,
  type StageDefinition,
  type PipelineError,
  type PipelineMiddleware,
  type MiddlewareContext,
  type TransactionRequest,
  type StageMetadata,
} from './pipeline.types';

import { createBuildStage } from './pipeline-stages/build.stage';
import { createSimulateStage } from './pipeline-stages/simulate.stage';
import { createRiskCheckStage } from './pipeline-stages/risk-check.stage';
import { createBalanceCheckStage } from './pipeline-stages/balance-check.stage';
import { createSignatureStage } from './pipeline-stages/signature.stage';
import { createBroadcastStage } from './pipeline-stages/broadcast.stage';
import { createConfirmationStage } from './pipeline-stages/confirmation.stage';
import { createAuditStage } from './pipeline-stages/audit.stage';
import { createNotifyStage } from './pipeline-stages/notify.stage';

// =============================================================================
// 常量
// =============================================================================

/**
 * 阶段执行顺序
 */
const STAGE_ORDER: PipelineStage[] = [
  PipelineStage.BUILD,
  PipelineStage.SIMULATE,
  PipelineStage.RISK_CHECK,
  PipelineStage.BALANCE_CHECK,
  PipelineStage.SIGNATURE,
  PipelineStage.BROADCAST,
  PipelineStage.CONFIRMATION,
  PipelineStage.AUDIT,
  PipelineStage.NOTIFY,
];

/**
 * 可回滚的阶段（在广播之前的阶段可以回滚）
 */
const ROLLBACKABLE_STAGES: PipelineStage[] = [
  PipelineStage.SIGNATURE,
  PipelineStage.BALANCE_CHECK,
  PipelineStage.RISK_CHECK,
  PipelineStage.SIMULATE,
  PipelineStage.BUILD,
];

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<Pick<PipelineConfig, 'maxRetries' | 'idPrefix' | 'autoRollback' | 'persistIntermediateState'>> = {
  idPrefix: 'txp',
  maxRetries: 3,
  autoRollback: false,
  persistIntermediateState: false,
};

// =============================================================================
// 工具函数
// =============================================================================

/**
 * 生成流水线 ID
 */
function generatePipelineId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * 创建初始阶段元数据
 */
function createInitialStageMetadata(stage: PipelineStage, maxRetries: number): StageMetadata {
  return {
    stage,
    status: StageStatus.PENDING,
    attempt: 0,
    maxAttempts: maxRetries + 1,
  };
}

/**
 * 创建流水线错误
 */
function createPipelineError(
  code: string,
  message: string,
  stage?: PipelineStage,
  details?: Record<string, unknown>,
  recoverable = true,
): PipelineError {
  return {
    code,
    message,
    stage,
    details,
    timestamp: new Date().toISOString(),
    recoverable,
    stack: new Error(message).stack,
  };
}

// =============================================================================
// TransactionPipeline 主类
// =============================================================================

/**
 * 交易流水线主类
 *
 * 负责编排和执行完整的交易流水线，支持：
 * - 9阶段顺序执行
 * - 中间件扩展
 * - 错误重试
 * - 状态持久化
 * - 部分回滚
 * - 进度追踪
 */
export class TransactionPipeline {
  private config: PipelineConfig;
  private stages: Map<PipelineStage, StageDefinition> = new Map();
  private middleware: PipelineMiddleware[] = [];
  private context: PipelineContext | null = null;
  private isRunning = false;
  private isPaused = false;
  private abortController: AbortController | null = null;

  constructor(config: PipelineConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeStages();
    if (this.config.middleware) {
      this.middleware = [...this.config.middleware];
    }
  }

  // -------------------------------------------------------------------------
  // 阶段初始化
  // -------------------------------------------------------------------------

  /**
   * 初始化所有阶段
   */
  private initializeStages(): void {
    const stageConfigs = this.config.stageConfigs || {};

    const buildStage = createBuildStage();
    this.applyStageConfig(buildStage, stageConfigs[PipelineStage.BUILD]);
    this.stages.set(PipelineStage.BUILD, buildStage);

    const simulateStage = createSimulateStage();
    this.applyStageConfig(simulateStage, stageConfigs[PipelineStage.SIMULATE]);
    this.stages.set(PipelineStage.SIMULATE, simulateStage);

    const riskCheckStage = createRiskCheckStage();
    this.applyStageConfig(riskCheckStage, stageConfigs[PipelineStage.RISK_CHECK]);
    this.stages.set(PipelineStage.RISK_CHECK, riskCheckStage);

    const balanceCheckStage = createBalanceCheckStage();
    this.applyStageConfig(balanceCheckStage, stageConfigs[PipelineStage.BALANCE_CHECK]);
    this.stages.set(PipelineStage.BALANCE_CHECK, balanceCheckStage);

    const signatureStage = createSignatureStage();
    this.applyStageConfig(signatureStage, stageConfigs[PipelineStage.SIGNATURE]);
    this.stages.set(PipelineStage.SIGNATURE, signatureStage);

    const broadcastStage = createBroadcastStage();
    this.applyStageConfig(broadcastStage, stageConfigs[PipelineStage.BROADCAST]);
    this.stages.set(PipelineStage.BROADCAST, broadcastStage);

    const confirmationStage = createConfirmationStage();
    this.applyStageConfig(confirmationStage, stageConfigs[PipelineStage.CONFIRMATION]);
    this.stages.set(PipelineStage.CONFIRMATION, confirmationStage);

    const auditStage = createAuditStage();
    this.applyStageConfig(auditStage, stageConfigs[PipelineStage.AUDIT]);
    this.stages.set(PipelineStage.AUDIT, auditStage);

    const notifyStage = createNotifyStage();
    this.applyStageConfig(notifyStage, stageConfigs[PipelineStage.NOTIFY]);
    this.stages.set(PipelineStage.NOTIFY, notifyStage);
  }

  /**
   * 应用阶段配置
   */
  private applyStageConfig(
    stage: StageDefinition,
    config?: Partial<StageDefinition>,
  ): void {
    if (!config) return;
    Object.assign(stage, config);
  }

  // -------------------------------------------------------------------------
  // 上下文管理
  // -------------------------------------------------------------------------

  /**
   * 初始化流水线上下文
   */
  private initializeContext(request: TransactionRequest): PipelineContext {
    const now = new Date().toISOString();
    const stageMetadata = {} as Record<PipelineStage, StageMetadata>;
    const maxRetries = this.config.maxRetries ?? DEFAULT_CONFIG.maxRetries;

    for (const stage of STAGE_ORDER) {
      stageMetadata[stage] = createInitialStageMetadata(
        stage,
        this.stages.get(stage)?.maxRetries ?? maxRetries,
      );
    }

    const context: PipelineContext = {
      pipelineId: generatePipelineId(this.config.idPrefix || DEFAULT_CONFIG.idPrefix),
      status: PipelineStatus.PENDING,
      request,
      stageData: {},
      stageMetadata,
      createdAt: now,
      updatedAt: now,
      skippedStages: this.config.skipStages || [],
      rollbackHistory: [],
      retryCount: 0,
      maxRetries,
      timeoutMs: this.config.timeoutMs,
      tags: [],
      metadata: {},
    };

    for (const stage of context.skippedStages) {
      context.stageMetadata[stage].skipped = true;
      context.stageMetadata[stage].status = StageStatus.SKIPPED;
      context.stageMetadata[stage].skipReason = '配置跳过';
    }

    return context;
  }

  /**
   * 更新上下文
   */
  private updateContext(updates: Partial<PipelineContext>): void {
    if (!this.context) return;
    Object.assign(this.context, updates, { updatedAt: new Date().toISOString() });
  }

  // -------------------------------------------------------------------------
  // 执行主流程
  // -------------------------------------------------------------------------

  /**
   * 执行完整流水线
   */
  async execute(request: TransactionRequest): Promise<PipelineResult> {
    if (this.isRunning) {
      throw new Error('流水线正在运行中');
    }

    this.isRunning = true;
    this.isPaused = false;
    this.abortController = new AbortController();

    try {
      this.context = this.initializeContext(request);
      this.updateContext({ status: PipelineStatus.RUNNING, startedAt: new Date().toISOString() });

      await this.persistStateIfNeeded();

      for (let i = 0; i < STAGE_ORDER.length; i++) {
        const stage = STAGE_ORDER[i];

        if (this.isPaused) {
          this.updateContext({ status: PipelineStatus.PAUSED });
          await this.waitForResume();
          this.updateContext({ status: PipelineStatus.RUNNING });
        }

        if (this.abortController?.signal.aborted) {
          throw createPipelineError('ABORTED', '流水线已被中止', stage, undefined, false);
        }

        const stageDef = this.stages.get(stage);
        if (!stageDef) {
          throw createPipelineError('STAGE_NOT_FOUND', `阶段未找到: ${stage}`, stage, undefined, false);
        }

        if (this.shouldSkipStage(stage)) {
          await this.handleSkippedStage(stage);
          continue;
        }

        try {
          await this.executeStage(stage, stageDef, i);
        } catch (error) {
          const pipelineError = this.toPipelineError(error, stage);
          this.updateContext({
            status: PipelineStatus.FAILED,
            failedStage: stage,
            error: pipelineError,
          });

          if (this.config.autoRollback) {
            await this.rollbackTo(stage);
          }

          this.config.onStageFail?.(stage, pipelineError, this.context!);
          this.config.onFail?.(pipelineError, this.context!);

          await this.persistStateIfNeeded();
          return this.buildResult();
        }
      }

      this.updateContext({
        status: PipelineStatus.COMPLETED,
        completedAt: new Date().toISOString(),
        totalDurationMs: Date.now() - new Date(this.context.startedAt!).getTime(),
      });

      this.config.onComplete?.(this.buildResult(), this.context);
      await this.persistStateIfNeeded();

      return this.buildResult();
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
  }

  /**
   * 执行单个阶段
   */
  private async executeStage(
    stage: PipelineStage,
    stageDef: StageDefinition,
    stageIndex: number,
  ): Promise<void> {
    const metadata = this.context!.stageMetadata[stage];
    metadata.status = StageStatus.RUNNING;
    metadata.startTime = new Date().toISOString();
    metadata.attempt = 1;

    this.updateContext({ currentStage: stage });
    this.config.onStageStart?.(stage, this.context!);

    try {
      if (stageDef.preCondition) {
        const prePassed = await stageDef.preCondition(this.context!);
        if (!prePassed) {
          throw createPipelineError(
            'PRECONDITION_FAILED',
            `阶段前置条件检查失败: ${stageDef.name}`,
            stage,
          );
        }
      }

      const executeWithMiddleware = this.wrapWithMiddleware(stage, stageIndex);
      await executeWithMiddleware();

      if (stageDef.postCondition) {
        const postPassed = await stageDef.postCondition(this.context!);
        if (!postPassed) {
          throw createPipelineError(
            'POSTCONDITION_FAILED',
            `阶段后置条件检查失败: ${stageDef.name}`,
            stage,
          );
        }
      }

      metadata.status = StageStatus.COMPLETED;
      metadata.endTime = new Date().toISOString();
      metadata.durationMs = Date.now() - new Date(metadata.startTime!).getTime();

      this.config.onStageComplete?.(stage, this.context!);

      const progress = this.calculateProgress();
      this.config.onProgress?.(progress, this.context!);

      await this.persistStateIfNeeded();
    } catch (error) {
      const pipelineError = this.toPipelineError(error, stage);

      if (stageDef.retryable && pipelineError.recoverable) {
        const retryResult = await this.tryRetry(stage, stageDef, pipelineError);
        if (retryResult) {
          metadata.status = StageStatus.COMPLETED;
          metadata.endTime = new Date().toISOString();
          metadata.durationMs = Date.now() - new Date(metadata.startTime!).getTime();

          this.config.onStageComplete?.(stage, this.context!);
          return;
        }
      }

      metadata.status = StageStatus.FAILED;
      metadata.endTime = new Date().toISOString();
      metadata.durationMs = Date.now() - new Date(metadata.startTime!).getTime();
      metadata.error = pipelineError;

      throw pipelineError;
    }
  }

  /**
   * 用中间件包装阶段执行
   */
  private wrapWithMiddleware(
    stage: PipelineStage,
    stageIndex: number,
  ): () => Promise<void> {
    const stageDef = this.stages.get(stage)!;
    const middlewares = [...this.middleware];

    const executeStage = async (): Promise<void> => {
      await stageDef.execute(this.context!, undefined);
    };

    if (middlewares.length === 0) {
      return executeStage;
    }

    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      if (i === middlewares.length) {
        await executeStage();
        return;
      }

      const middleware = middlewares[i];
      const middlewareCtx: MiddlewareContext = {
        ...this.context!,
        executingStage: stage,
        stageIndex,
        middlewareData: {},
      };

      await middleware(middlewareCtx, () => dispatch(i + 1));
    };

    return () => dispatch(0);
  }

  /**
   * 尝试重试阶段
   */
  private async tryRetry(
    stage: PipelineStage,
    stageDef: StageDefinition,
    error: PipelineError,
  ): Promise<boolean> {
    const metadata = this.context!.stageMetadata[stage];
    const maxRetries = stageDef.maxRetries;

    while (metadata.attempt <= maxRetries) {
      metadata.attempt++;
      metadata.status = StageStatus.RETRYING;

      this.config.onStageRetry?.(stage, metadata.attempt, this.context!);

      await this.delay(stageDef.retryDelayMs * metadata.attempt);

      try {
        const executeWithMiddleware = this.wrapWithMiddleware(
          stage,
          STAGE_ORDER.indexOf(stage),
        );
        await executeWithMiddleware();

        if (stageDef.postCondition) {
          const postPassed = await stageDef.postCondition(this.context!);
          if (!postPassed) {
            throw createPipelineError(
              'POSTCONDITION_FAILED',
              `重试后置条件检查失败: ${stageDef.name}`,
              stage,
            );
          }
        }

        return true;
      } catch (retryError) {
        const retryPipelineError = this.toPipelineError(retryError, stage);
        metadata.error = retryPipelineError;

        if (metadata.attempt > maxRetries || !retryPipelineError.recoverable) {
          return false;
        }
      }
    }

    return false;
  }

  // -------------------------------------------------------------------------
  // 跳过处理
  // -------------------------------------------------------------------------

  /**
   * 判断是否应该跳过阶段
   */
  private shouldSkipStage(stage: PipelineStage): boolean {
    if (!this.context) return false;

    if (this.context.skippedStages.includes(stage)) {
      return true;
    }

    const stageDef = this.stages.get(stage);
    if (!stageDef) return false;

    for (const dep of stageDef.dependsOn) {
      const depMetadata = this.context.stageMetadata[dep];
      if (depMetadata.skipped) {
        return true;
      }
    }

    return false;
  }

  /**
   * 处理跳过的阶段
   */
  private async handleSkippedStage(stage: PipelineStage): Promise<void> {
    const metadata = this.context!.stageMetadata[stage];
    metadata.status = StageStatus.SKIPPED;
    metadata.skipped = true;
    metadata.startTime = new Date().toISOString();
    metadata.endTime = new Date().toISOString();
    metadata.durationMs = 0;

    const progress = this.calculateProgress();
    this.config.onProgress?.(progress, this.context!);
  }

  // -------------------------------------------------------------------------
  // 回滚
  // -------------------------------------------------------------------------

  /**
   * 回滚到指定阶段之前
   */
  async rollbackTo(targetStage: PipelineStage): Promise<void> {
    if (!this.context) {
      throw new Error('流水线未初始化');
    }

    const currentIndex = STAGE_ORDER.indexOf(targetStage);
    const rollbackStages = ROLLBACKABLE_STAGES.filter(
      (s) => STAGE_ORDER.indexOf(s) < currentIndex,
    ).reverse();

    for (const stage of rollbackStages) {
      const stageDef = this.stages.get(stage);
      const metadata = this.context.stageMetadata[stage];

      if (!stageDef || metadata.status !== StageStatus.COMPLETED) {
        continue;
      }

      if (stageDef.rollback) {
        try {
          await stageDef.rollback(this.context);
          metadata.status = StageStatus.ROLLED_BACK;

          this.context.rollbackHistory.push({
            fromStage: targetStage,
            toStage: stage,
            reason: '流水线回滚',
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.warn(`回滚阶段 ${stage} 失败:`, error);
        }
      }
    }

    this.updateContext({ status: PipelineStatus.ROLLED_BACK });
    await this.persistStateIfNeeded();
  }

  /**
   * 完整回滚
   */
  async fullRollback(): Promise<void> {
    if (!this.context || !this.context.currentStage) {
      return;
    }
    await this.rollbackTo(this.context.currentStage);
  }

  // -------------------------------------------------------------------------
  // 暂停/恢复
  // -------------------------------------------------------------------------

  /**
   * 暂停流水线
   */
  pause(): boolean {
    if (!this.isRunning) return false;
    this.isPaused = true;
    return true;
  }

  /**
   * 恢复流水线
   */
  resume(): boolean {
    if (!this.isPaused) return false;
    this.isPaused = false;
    return true;
  }

  /**
   * 等待恢复
   */
  private waitForResume(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (!this.isPaused || !this.isRunning) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  /**
   * 中止流水线
   */
  abort(): boolean {
    if (!this.isRunning) return false;
    this.abortController?.abort();
    return true;
  }

  // -------------------------------------------------------------------------
  // 状态持久化
  // -------------------------------------------------------------------------

  /**
   * 如果需要则持久化状态
   */
  private async persistStateIfNeeded(): Promise<void> {
    if (!this.config.persistIntermediateState || !this.config.stateStorage || !this.context) {
      return;
    }

    try {
      await this.config.stateStorage.save(this.context.pipelineId, this.context);
    } catch (error) {
      console.warn('持久化流水线状态失败:', error);
    }
  }

  /**
   * 从持久化状态恢复
   */
  async restoreState(pipelineId: string): Promise<boolean> {
    if (!this.config.stateStorage) {
      return false;
    }

    const context = await this.config.stateStorage.load(pipelineId);
    if (!context) {
      return false;
    }

    this.context = context;
    return true;
  }

  // -------------------------------------------------------------------------
  // 进度计算
  // -------------------------------------------------------------------------

  /**
   * 计算当前进度
   */
  private calculateProgress(): number {
    if (!this.context) return 0;

    let totalWeight = 0;
    let completedWeight = 0;

    for (const stage of STAGE_ORDER) {
      const stageDef = this.stages.get(stage);
      const weight = stageDef?.weight || 10;
      totalWeight += weight;

      const metadata = this.context.stageMetadata[stage];
      if (
        metadata.status === StageStatus.COMPLETED ||
        metadata.status === StageStatus.SKIPPED ||
        metadata.status === StageStatus.ROLLED_BACK
      ) {
        completedWeight += weight;
      } else if (metadata.status === StageStatus.RUNNING || metadata.status === StageStatus.RETRYING) {
        completedWeight += weight / 2;
      }
    }

    return totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
  }

  // -------------------------------------------------------------------------
  // 结果构建
  // -------------------------------------------------------------------------

  /**
   * 构建流水线结果
   */
  private buildResult(): PipelineResult {
    if (!this.context) {
      throw new Error('流水线未初始化');
    }

    const ctx = this.context;
    const stageDurations = {} as Record<PipelineStage, number>;

    for (const stage of STAGE_ORDER) {
      stageDurations[stage] = ctx.stageMetadata[stage]?.durationMs || 0;
    }

    const result: PipelineResult = {
      pipelineId: ctx.pipelineId,
      status: ctx.status,
      request: ctx.request,
      buildResult: ctx.stageData[PipelineStage.BUILD],
      simulationResult: ctx.stageData[PipelineStage.SIMULATE],
      riskCheckResult: ctx.stageData[PipelineStage.RISK_CHECK],
      balanceCheckResult: ctx.stageData[PipelineStage.BALANCE_CHECK],
      signatureResult: ctx.stageData[PipelineStage.SIGNATURE],
      broadcastResult: ctx.stageData[PipelineStage.BROADCAST],
      confirmationResult: ctx.stageData[PipelineStage.CONFIRMATION],
      auditResult: ctx.stageData[PipelineStage.AUDIT],
      notifyResult: ctx.stageData[PipelineStage.NOTIFY],
      error: ctx.error,
      failedStage: ctx.failedStage,
      startedAt: ctx.startedAt,
      completedAt: ctx.completedAt,
      totalDurationMs: ctx.totalDurationMs,
      totalRetries: ctx.retryCount,
      stageDurations,
    };

    return result;
  }

  // -------------------------------------------------------------------------
  // 中间件管理
  // -------------------------------------------------------------------------

  /**
   * 添加中间件
   */
  use(middleware: PipelineMiddleware): this {
    this.middleware.push(middleware);
    return this;
  }

  /**
   * 移除中间件
   */
  removeMiddleware(middleware: PipelineMiddleware): boolean {
    const index = this.middleware.indexOf(middleware);
    if (index !== -1) {
      this.middleware.splice(index, 1);
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // 工具方法
  // -------------------------------------------------------------------------

  /**
   * 转换为流水线错误
   */
  private toPipelineError(error: unknown, stage?: PipelineStage): PipelineError {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      return error as PipelineError;
    }

    const message = error instanceof Error ? error.message : String(error);
    return createPipelineError('UNKNOWN_ERROR', message, stage, { originalError: error });
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // -------------------------------------------------------------------------
  // Getter 方法
  // -------------------------------------------------------------------------

  /**
   * 获取当前上下文
   */
  getContext(): PipelineContext | null {
    return this.context;
  }

  /**
   * 获取当前状态
   */
  getStatus(): PipelineStatus {
    return this.context?.status || PipelineStatus.PENDING;
  }

  /**
   * 获取流水线 ID
   */
  getPipelineId(): string | null {
    return this.context?.pipelineId || null;
  }

  /**
   * 获取阶段定义
   */
  getStageDef(stage: PipelineStage): StageDefinition | undefined {
    return this.stages.get(stage);
  }

  /**
   * 获取所有阶段定义
   */
  getAllStageDefs(): StageDefinition[] {
    return STAGE_ORDER.map((s) => this.stages.get(s)).filter((s): s is StageDefinition => !!s);
  }

  /**
   * 检查是否正在运行
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * 检查是否已暂停
   */
  get paused(): boolean {
    return this.isPaused;
  }
}

// =============================================================================
// 工厂函数
// =============================================================================

/**
 * 创建交易流水线
 */
export function createTransactionPipeline(config?: PipelineConfig): TransactionPipeline {
  return new TransactionPipeline(config);
}

/**
 * 快速执行交易流水线
 */
export async function executeTransactionPipeline(
  request: TransactionRequest,
  config?: PipelineConfig,
): Promise<PipelineResult> {
  const pipeline = new TransactionPipeline(config);
  return pipeline.execute(request);
}

export default TransactionPipeline;
