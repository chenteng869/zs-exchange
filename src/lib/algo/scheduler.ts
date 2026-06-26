/**
 * AlgoScheduler - 轻量级定时任务调度器
 *
 *  - 单线程 tick 模式，频率 100ms
 *  - 适合算法交易子单调度：startTime + intervalSec
 *  - 不依赖外部库
 */

import { ALGO_SCHEDULER_TICK_MS } from './types';

export interface ScheduledJob {
  id: string;
  /** 计划执行时间戳（ms） */
  executeAt: number;
  callback: () => void | Promise<void>;
  /** 是否可重复执行 */
  repeat?: boolean;
  /** 重复间隔（ms） */
  repeatMs?: number;
  /** 关联的 algoId（用于批量取消） */
  algoId?: string;
  /** 标签 */
  tag?: string;
  createdAt: number;
}

export class AlgoScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private timer: ReturnType<typeof setInterval> | null = null;
  private tickMs: number;
  private running = false;
  private executionCount = 0;

  constructor(tickMs: number = ALGO_SCHEDULER_TICK_MS) {
    this.tickMs = tickMs;
  }

  /**
   * 启动调度器（惰性，首次 scheduleJob 时也会自动启动）
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.timer = setInterval(() => this.tick(), this.tickMs);
  }

  /**
   * 停止调度器
   */
  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * 调度一次性任务
   */
  scheduleJob(
    id: string,
    executeAt: number,
    callback: () => void | Promise<void>,
    options: { algoId?: string; tag?: string } = {},
  ): ScheduledJob {
    const job: ScheduledJob = {
      id,
      executeAt,
      callback,
      algoId: options.algoId,
      tag: options.tag,
      createdAt: Date.now(),
    };
    this.jobs.set(id, job);
    this.start();
    return job;
  }

  /**
   * 调度重复任务
   */
  scheduleRepeating(
    id: string,
    firstExecuteAt: number,
    repeatMs: number,
    callback: () => void | Promise<void>,
    options: { algoId?: string; tag?: string } = {},
  ): ScheduledJob {
    // 重复任务的 callback 会自动更新 executeAt
    const wrappedCallback = (): void => {
      try {
        const result = callback();
        if (result instanceof Promise) {
          result.catch((e) => {
            // eslint-disable-next-line no-console
            console.error(`[AlgoScheduler] repeating job ${id} failed:`, e);
          });
        }
      } finally {
        // 不论 callback 是否抛错，都重排下一轮
        if (this.jobs.has(id)) {
          const existing = this.jobs.get(id)!;
          this.jobs.set(id, {
            ...existing,
            executeAt: Date.now() + repeatMs,
          });
        }
      }
    };
    const job: ScheduledJob = {
      id,
      executeAt: firstExecuteAt,
      callback: wrappedCallback,
      repeat: true,
      repeatMs,
      algoId: options.algoId,
      tag: options.tag,
      createdAt: Date.now(),
    };
    this.jobs.set(id, job);
    this.start();
    return job;
  }

  /**
   * 取消单个任务
   */
  cancelJob(id: string): boolean {
    return this.jobs.delete(id);
  }

  /**
   * 取消指定 algoId 的所有任务
   */
  cancelByAlgo(algoId: string): number {
    let count = 0;
    for (const [id, job] of this.jobs.entries()) {
      if (job.algoId === algoId) {
        this.jobs.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * 取消带特定 tag 的所有任务
   */
  cancelByTag(tag: string): number {
    let count = 0;
    for (const [id, job] of this.jobs.entries()) {
      if (job.tag === tag) {
        this.jobs.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * 获取所有未执行任务
   */
  getPendingJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => a.executeAt - b.executeAt);
  }

  /**
   * 获取指定 algoId 的任务
   */
  getJobsByAlgo(algoId: string): ScheduledJob[] {
    return this.getPendingJobs().filter((j) => j.algoId === algoId);
  }

  /**
   * 获取任务数量
   */
  size(): number {
    return this.jobs.size;
  }

  /**
   * 同步等待直到指定时间戳（用于测试 / 模拟）
   */
  async waitUntil(timestamp: number): Promise<void> {
    return new Promise((resolve) => {
      const check = (): void => {
        if (Date.now() >= timestamp) resolve();
        else setTimeout(check, Math.min(50, timestamp - Date.now()));
      };
      check();
    });
  }

  /**
   * 手动触发一次 tick（用于测试）
   */
  tickNow(): number {
    const before = this.jobs.size;
    this.tick();
    return before - this.jobs.size;
  }

  /**
   * 重置（清空所有任务并停止）
   */
  reset(): void {
    this.stop();
    this.jobs.clear();
    this.executionCount = 0;
  }

  /**
   * 获取执行统计
   */
  getStats(): { total: number; executed: number } {
    return { total: this.executionCount, executed: this.executionCount };
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private tick(): void {
    const now = Date.now();
    const toExecute: ScheduledJob[] = [];
    for (const job of this.jobs.values()) {
      if (job.executeAt <= now) {
        toExecute.push(job);
      }
    }
    for (const job of toExecute) {
      // 一次性任务：执行前删除
      // 重复任务：保留，由 callback 自己更新 executeAt
      if (!job.repeat) {
        this.jobs.delete(job.id);
      }
      this.executionCount++;
      try {
        const result = job.callback();
        if (result instanceof Promise) {
          result.catch((e) => {
            // 静默失败（生产环境应接入 logger）
            // eslint-disable-next-line no-console
            console.error(`[AlgoScheduler] job ${job.id} failed:`, e);
          });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`[AlgoScheduler] job ${job.id} threw:`, e);
      }
    }
  }
}
