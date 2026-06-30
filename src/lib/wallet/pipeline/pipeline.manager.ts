/**
 * 流水线管理器 (Pipeline Manager)
 *
 * 职责：
 *  - 管理多个流水线实例的生命周期
 *  - 并发控制（限制同时运行的流水线数量）
 *  - 队列管理（FIFO 队列处理待执行的流水线）
 *  - 超时处理（自动清理超时的流水线）
 *  - 状态追踪（统计、监控）
 *  - 流水线查找和检索
 *  - 批量操作（批量取消、批量查询）
 */

import {
  PipelineStatus,
  type PipelineManagerConfig,
  type PipelineStats,
  type PipelineContext,
  type TransactionRequest,
  type PipelineResult,
  type PipelineConfig,
} from './pipeline.types';
import { EventEmitter } from 'events';
import { TransactionPipeline } from './transaction-pipeline';

// =============================================================================
// 队列项
// =============================================================================

interface QueueItem {
  id: string;
  request: TransactionRequest;
  config?: PipelineConfig;
  priority: number;
  addedAt: string;
  resolve: (result: PipelineResult) => void;
  reject: (error: Error) => void;
}

// =============================================================================
// 运行中的流水线
// =============================================================================

interface RunningPipeline {
  pipeline: TransactionPipeline;
  context: PipelineContext;
  startTime: number;
  timeoutMs?: number;
  timeoutTimer?: ReturnType<typeof setTimeout>;
}

interface PipelineSummary {
  pipelineId: string;
  walletId?: string;
  userId?: string;
  status: PipelineStatus;
  addedAt?: string;
  updatedAt?: string;
  priority?: number;
}

// =============================================================================
// 默认配置
// =============================================================================

const DEFAULT_CONFIG: Required<PipelineManagerConfig> = {
  maxConcurrent: 10,
  maxQueueSize: 100,
  globalTimeoutMs: 300000,
  cleanupDelayMs: 60000,
  stateStorage: undefined as any,
};

// =============================================================================
// PipelineManager 主类
// =============================================================================

/**
 * 流水线管理器
 *
 * 负责管理多个交易流水线实例，提供：
 * - 并发控制
 * - 队列管理
 * - 超时处理
 * - 状态统计
 * - 生命周期管理
 */
export class PipelineManager {
  private config: Required<PipelineManagerConfig>;
  private runningPipelines: Map<string, RunningPipeline> = new Map();
  private completedPipelines: Map<string, { context: PipelineContext; completedAt: number }> = new Map();
  private history: Array<{ context: PipelineContext; completedAt: number }> = [];
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private readonly emitter = new EventEmitter();

  constructor(config: PipelineManagerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupTimer();
  }

  // -------------------------------------------------------------------------
  // 公共方法 - 提交和执行
  // -------------------------------------------------------------------------

  /**
   * 提交交易到流水线队列
   * @param request 交易请求
   * @param config 流水线配置
   * @param priority 优先级（数字越大优先级越高）
   * @returns Promise<PipelineResult>
   */
  submit(
    request: TransactionRequest,
    config?: PipelineConfig,
    priority: number = 0,
  ): Promise<PipelineResult> {
    return new Promise((resolve, reject) => {
      if (this.queue.length >= this.config.maxQueueSize) {
        reject(new Error('流水线队列已满'));
        return;
      }

      const queueItem: QueueItem = {
        id: request.id,
        request,
        config,
        priority,
        addedAt: new Date().toISOString(),
        resolve,
        reject,
      };

      this.enqueue(queueItem);
      this.processQueue();
    });
  }

  /**
   * 立即执行一个流水线（跳过队列）
   * 注意：仍受并发限制，如果达到并发上限会抛出错误
   */
  async execute(
    request: TransactionRequest,
    config?: PipelineConfig,
  ): Promise<PipelineResult> {
    if (this.runningPipelines.size >= this.config.maxConcurrent) {
      throw new Error('已达到最大并发数，请使用 submit 方法排队');
    }

    return this.runPipeline(request, config);
  }

  // -------------------------------------------------------------------------
  // 公共方法 - 流水线控制
  // -------------------------------------------------------------------------

  /**
   * 暂停指定流水线
   */
  pausePipeline(pipelineId: string): boolean {
    const running = this.runningPipelines.get(pipelineId);
    if (!running) return false;
    return running.pipeline.pause();
  }

  /**
   * 恢复指定流水线
   */
  resumePipeline(pipelineId: string): boolean {
    const running = this.runningPipelines.get(pipelineId);
    if (!running) return false;
    return running.pipeline.resume();
  }

  /**
   * 取消指定流水线
   */
  cancelPipeline(pipelineId: string): boolean {
    const running = this.runningPipelines.get(pipelineId);
    if (!running) return false;

    const cancelled = running.pipeline.abort?.() ?? (running.pipeline as { cancel?: () => boolean }).cancel?.() ?? false;
    if (cancelled && running.timeoutTimer) {
      clearTimeout(running.timeoutTimer);
    }

    return cancelled;
  }

  /**
   * 取消所有运行中的流水线
   */
  cancelAll(): number {
    let count = 0;
    for (const [id, running] of this.runningPipelines) {
      if (running.pipeline.abort()) {
        count++;
      }
      if (running.timeoutTimer) {
        clearTimeout(running.timeoutTimer);
      }
    }
    return count;
  }

  /**
   * 列出流水线（运行中、队列中、已完成）
   */
  listPipelines(filters: {
    walletId?: string;
    userId?: string;
    status?: PipelineStatus;
    page?: number;
    pageSize?: number;
  } = {}): PipelineSummary[] {
    const items: PipelineSummary[] = [];

    for (const [pipelineId, running] of this.runningPipelines) {
      items.push({
        pipelineId,
        walletId: running.context.request.walletId,
        userId: running.context.request.userId,
        status: running.context.status,
        updatedAt: running.context.updatedAt,
      });
    }

    for (const queued of this.queue) {
      items.push({
        pipelineId: queued.id,
        walletId: queued.request.walletId,
        userId: queued.request.userId,
        status: PipelineStatus.PENDING,
        addedAt: queued.addedAt,
        priority: queued.priority,
      });
    }

    for (const [pipelineId, { context, completedAt }] of this.completedPipelines) {
      items.push({
        pipelineId,
        walletId: context.request.walletId,
        userId: context.request.userId,
        status: context.status,
        updatedAt: new Date(completedAt).toISOString(),
      });
    }

    const filtered = items.filter((item) => {
      if (filters.walletId && item.walletId !== filters.walletId) return false;
      if (filters.userId && item.userId !== filters.userId) return false;
      if (filters.status && item.status !== filters.status) return false;
      return true;
    });

    const page = Math.max(filters.page ?? 1, 1);
    const pageSize = Math.max(filters.pageSize ?? (filtered.length || 1), 1);
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }

  /**
   * 注册事件监听器
   */
  on(event: string, listener: (...args: unknown[]) => void): this {
    this.emitter.on(event, listener);
    return this;
  }

  /**
   * 移除事件监听器
   */
  off(event: string, listener: (...args: unknown[]) => void): this {
    this.emitter.off(event, listener);
    return this;
  }

  /**
   * 重试流水线
   */
  async retry(pipelineId: string): Promise<PipelineResult> {
    const context = this.getPipelineContext(pipelineId);
    if (!context) {
      return {
        pipelineId,
        status: PipelineStatus.RETRYING,
        request: { id: pipelineId } as TransactionRequest,
        totalRetries: 0,
        stageDurations: {} as Record<PipelineStatus, number>,
      } as PipelineResult;
    }

    return this.execute(context.request, { timeoutMs: context.timeoutMs });
  }

  /**
   * 获取历史记录
   */
  getHistory(filters: { walletId?: string; userId?: string } = {}): Array<{ pipelineId: string; walletId?: string; userId?: string; status: PipelineStatus; completedAt: number }> {
    return this.history
      .map((item) => ({
        pipelineId: item.context.pipelineId,
        walletId: item.context.request.walletId,
        userId: item.context.request.userId,
        status: item.context.status,
        completedAt: item.completedAt,
      }))
      .filter((item) => {
        if (filters.walletId && item.walletId !== filters.walletId) return false;
        if (filters.userId && item.userId !== filters.userId) return false;
        return true;
      });
  }

  /**
   * 清除历史记录
   */
  clearHistory(walletId?: string): void {
    if (!walletId) {
      this.history = [];
      return;
    }

    this.history = this.history.filter((item) => item.context.request.walletId !== walletId);
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.shutdown();
    this.emitter.removeAllListeners();
  }

  // -------------------------------------------------------------------------
  // 公共方法 - 查询
  // -------------------------------------------------------------------------

  /**
   * 获取流水线状态
   */
  getPipelineStatus(pipelineId: string): PipelineStatus | null {
    const running = this.runningPipelines.get(pipelineId);
    if (running) {
      return running.context.status;
    }

    const completed = this.completedPipelines.get(pipelineId);
    if (completed) {
      return completed.context.status;
    }

    const queued = this.queue.find((q) => q.id === pipelineId);
    if (queued) {
      return PipelineStatus.PENDING;
    }

    return null;
  }

  /**
   * 获取流水线上下文
   */
  getPipelineContext(pipelineId: string): PipelineContext | null {
    const running = this.runningPipelines.get(pipelineId);
    if (running) {
      return running.context;
    }

    const completed = this.completedPipelines.get(pipelineId);
    if (completed) {
      return completed.context;
    }

    return null;
  }

  /**
   * 列出所有运行中的流水线
   */
  listRunning(): Array<{ pipelineId: string; status: PipelineStatus; startTime: string }> {
    const result: Array<{ pipelineId: string; status: PipelineStatus; startTime: string }> = [];

    for (const [id, running] of this.runningPipelines) {
      result.push({
        pipelineId: id,
        status: running.context.status,
        startTime: new Date(running.startTime).toISOString(),
      });
    }

    return result;
  }

  /**
   * 列出队列中的流水线
   */
  listQueued(): Array<{ id: string; addedAt: string; priority: number; position: number }> {
    return this.queue.map((item, index) => ({
      id: item.id,
      addedAt: item.addedAt,
      priority: item.priority,
      position: index + 1,
    }));
  }

  /**
   * 获取统计信息
   */
  getStats(): PipelineStats {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;

    let completed = 0;
    let failed = 0;
    let rolledBack = 0;
    let totalDuration = 0;
    let lastHourCount = 0;
    let lastDayCount = 0;

    for (const { context, completedAt } of this.completedPipelines.values()) {
      switch (context.status) {
        case PipelineStatus.COMPLETED:
          completed++;
          break;
        case PipelineStatus.FAILED:
          failed++;
          break;
        case PipelineStatus.ROLLED_BACK:
          rolledBack++;
          break;
      }

      if (context.totalDurationMs) {
        totalDuration += context.totalDurationMs;
      }

      if (completedAt >= oneHourAgo) {
        lastHourCount++;
      }
      if (completedAt >= oneDayAgo) {
        lastDayCount++;
      }
    }

    const totalCompleted = completed + failed + rolledBack;
    const averageDurationMs = totalCompleted > 0 ? totalDuration / totalCompleted : 0;
    const total = this.runningPipelines.size + this.queue.length + totalCompleted;
    const successRate = totalCompleted > 0 ? (completed / totalCompleted) * 100 : 100;

    return {
      total,
      running: this.runningPipelines.size,
      pending: this.queue.length,
      completed,
      failed,
      rolledBack,
      averageDurationMs,
      successRate,
      lastHourCount,
      lastDayCount,
      byStatus: {
        [PipelineStatus.COMPLETED]: completed,
        [PipelineStatus.FAILED]: failed,
        [PipelineStatus.ROLLED_BACK]: rolledBack,
        [PipelineStatus.RUNNING]: this.runningPipelines.size,
        [PipelineStatus.PENDING]: this.queue.length,
      },
      concurrent: this.runningPipelines.size,
    };
  }

  // -------------------------------------------------------------------------
  // 公共方法 - 队列操作
  // -------------------------------------------------------------------------

  /**
   * 从队列中移除
   */
  removeFromQueue(id: string): boolean {
    const index = this.queue.findIndex((q) => q.id === id);
    if (index === -1) return false;

    const item = this.queue[index];
    this.queue.splice(index, 1);
    item.reject(new Error('已从队列中移除'));
    return true;
  }

  /**
   * 清空队列
   */
  clearQueue(): number {
    const count = this.queue.length;
    for (const item of this.queue) {
      item.reject(new Error('队列已清空'));
    }
    this.queue = [];
    return count;
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 队列管理
  // -------------------------------------------------------------------------

  /**
   * 入队（按优先级排序）
   */
  private enqueue(item: QueueItem): void {
    let inserted = false;

    for (let i = 0; i < this.queue.length; i++) {
      if (item.priority > this.queue[i].priority) {
        this.queue.splice(i, 0, item);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      this.queue.push(item);
    }
  }

  /**
   * 出队
   */
  private dequeue(): QueueItem | undefined {
    return this.queue.shift();
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (
        this.queue.length > 0 &&
        this.runningPipelines.size < this.config.maxConcurrent
      ) {
        const item = this.dequeue();
        if (!item) break;

        this.runPipeline(item.request, item.config)
          .then(item.resolve)
          .catch(item.reject);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 流水线执行
  // -------------------------------------------------------------------------

  /**
   * 运行一个流水线
   */
  private async runPipeline(
    request: TransactionRequest,
    config?: PipelineConfig,
  ): Promise<PipelineResult> {
    const pipeline = new TransactionPipeline(config);
    const pipelineId = (request as { id?: string }).id || `txp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const context = this.createPipelineContext(pipelineId, request, config);
    const running: RunningPipeline = {
      pipeline,
      context,
      startTime: Date.now(),
      timeoutMs: config?.timeoutMs || this.config.globalTimeoutMs,
    };

    this.runningPipelines.set(pipelineId, running);

    try {
      const resultPromise = pipeline.execute(request);
      if (running.timeoutMs && running.timeoutMs > 0) {
        running.timeoutTimer = setTimeout(() => {
          this.handleTimeout(pipelineId);
        }, running.timeoutMs);
      }

      const result = await resultPromise;

      this.onPipelineComplete(pipelineId, result);

      return result;
    } catch (error) {
      this.onPipelineError(pipelineId, error as Error);
      throw error;
    }
  }

  /**
   * 流水线完成处理
   */
  private onPipelineComplete(pipelineId: string, result: PipelineResult): void {
    const running = this.runningPipelines.get(pipelineId);
    if (!running) return;

    if (running.timeoutTimer) {
      clearTimeout(running.timeoutTimer);
    }

    const completedAt = Date.now();
    running.context.status = result.status;
    running.context.updatedAt = result.completedAt || new Date(completedAt).toISOString();
    running.context.completedAt = result.completedAt;
    running.context.totalDurationMs = result.totalDurationMs;
    this.completedPipelines.set(pipelineId, {
      context: running.context,
      completedAt,
    });
    this.history.push({ context: running.context, completedAt });

    this.runningPipelines.delete(pipelineId);
    this.emitter.emit('complete', result);
    this.processQueue();
  }

  /**
   * 流水线错误处理
   */
  private onPipelineError(pipelineId: string, error: Error): void {
    const running = this.runningPipelines.get(pipelineId);
    if (!running) return;

    if (running.timeoutTimer) {
      clearTimeout(running.timeoutTimer);
    }

    const completedAt = Date.now();
    running.context.status = PipelineStatus.FAILED;
    running.context.error = {
      code: 'PIPELINE_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
      recoverable: true,
    };
    this.completedPipelines.set(pipelineId, {
      context: running.context,
      completedAt,
    });
    this.history.push({ context: running.context, completedAt });

    this.runningPipelines.delete(pipelineId);
    this.emitter.emit('error', error);
    this.processQueue();
  }

  /**
   * 处理超时
   */
  private handleTimeout(pipelineId: string): void {
    const running = this.runningPipelines.get(pipelineId);
    if (!running) return;

    running.pipeline.abort?.();
    (running.pipeline as { cancel?: () => boolean }).cancel?.();

    const completedAt = Date.now();
    running.context.status = PipelineStatus.TIMEOUT;
    running.context.error = {
      code: 'TIMEOUT',
      message: `流水线执行超时（${running.timeoutMs}ms）`,
      stage: running.context.currentStage,
      timestamp: new Date().toISOString(),
      recoverable: false,
    };

    this.completedPipelines.set(pipelineId, {
      context: running.context,
      completedAt,
    });
    this.history.push({ context: running.context, completedAt });

    this.runningPipelines.delete(pipelineId);
    this.processQueue();
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 清理
  // -------------------------------------------------------------------------

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) return;

    this.cleanupTimer = setInterval(() => {
      this.cleanupCompleted();
    }, this.config.cleanupDelayMs);
  }

  /**
   * 清理已完成的流水线
   */
  private cleanupCompleted(): void {
    const maxAge = this.config.cleanupDelayMs * 10;
    const now = Date.now();
    let count = 0;

    for (const [id, { completedAt }] of this.completedPipelines) {
      if (now - completedAt > maxAge) {
        this.completedPipelines.delete(id);
        count++;
      }
    }
  }

  // -------------------------------------------------------------------------
  // 公共方法 - 生命周期
  // -------------------------------------------------------------------------

  /**
   * 关闭管理器
   * 停止所有流水线和定时器
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.cancelAll();
    this.clearQueue();
  }

  private createPipelineContext(
    pipelineId: string,
    request: TransactionRequest,
    config?: PipelineConfig,
  ): PipelineContext {
    const now = new Date().toISOString();
    return {
      pipelineId,
      status: PipelineStatus.RUNNING,
      request,
      stageData: {},
      stageMetadata: {} as PipelineContext['stageMetadata'],
      createdAt: now,
      updatedAt: now,
      startedAt: now,
      skippedStages: [],
      rollbackHistory: [],
      retryCount: 0,
      maxRetries: config?.maxRetries ?? 3,
      timeoutMs: config?.timeoutMs || this.config.globalTimeoutMs,
    };
  }

  // -------------------------------------------------------------------------
  // Getter
  // -------------------------------------------------------------------------

  /**
   * 获取当前并发数
   */
  get concurrentCount(): number {
    return this.runningPipelines.size;
  }

  /**
   * 获取队列长度
   */
  get queueLength(): number {
    return this.queue.length;
  }

  /**
   * 获取最大并发数
   */
  get maxConcurrent(): number {
    return this.config.maxConcurrent;
  }
}

// =============================================================================
// 单例
// =============================================================================

let defaultManager: PipelineManager | null = null;

/**
 * 获取默认的流水线管理器单例
 */
export function getDefaultPipelineManager(): PipelineManager {
  if (!defaultManager) {
    defaultManager = new PipelineManager();
  }
  return defaultManager;
}

/**
 * 重置默认管理器（主要用于测试）
 */
export function resetDefaultPipelineManager(): void {
  if (defaultManager) {
    defaultManager.shutdown();
    defaultManager = null;
  }
}

// =============================================================================
// 工厂函数
// =============================================================================

/**
 * 创建流水线管理器
 */
export function createPipelineManager(config?: PipelineManagerConfig): PipelineManager {
  return new PipelineManager(config);
}

export default PipelineManager;
