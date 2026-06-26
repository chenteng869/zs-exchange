/**
 * 自动复投器 (AutoCompounder)
 *
 * 职责：
 *  - 定时器启动 / 停止
 *  - 对一个仓位执行复投：领取收益 -> 重新存入 -> 更新 lastCompoundTime
 *  - 触发条件三重门控：
 *      ① 累计收益 > $1（COMPOUND_MIN_THRESHOLD_USD）
 *      ② 距上次复投 > 24h（COMPOUND_MIN_INTERVAL_MS）
 *      ③ 当前 gas 价 < 50 Gwei（COMPOUND_GAS_PRICE_MAX_GWEI）
 *  - 批量优化：同协议多仓位合并为单次复投批次
 *  - 事件：onCompound / onTriggered
 */

import { EventEmitter } from 'events';
import type { ActionType, YieldAction, YieldPosition, YieldProtocol } from './types';
import {
  COMPOUND_GAS_PRICE_MAX_GWEI,
  COMPOUND_MIN_INTERVAL_MS,
  COMPOUND_MIN_THRESHOLD_USD,
  makeYieldId,
} from './types';

// =============================================================================
// 触发条件评估
// =============================================================================

export interface CompoundTriggerInput {
  position: YieldPosition;
  /** 当前 gas 价（Gwei） */
  currentGasGwei: number;
  /** 资产美元价（可选，未提供则按 $1 估算） */
  priceUsd?: number;
  /** 当前时间戳（默认 Date.now()） */
  now?: number;
}

export interface CompoundTriggerResult {
  shouldCompound: boolean;
  reasons: string[];
  /** 待复投的收益（美元） */
  pendingUsd: number;
}

// =============================================================================
// AutoCompounder
// =============================================================================

export interface AutoCompounderOptions {
  /** 复投周期（毫秒），默认 1 小时 */
  intervalMs?: number;
  /** 是否在创建时立即启动 */
  autoStart?: boolean;
  /** 自定义 gas 价获取（演示可固定 10 Gwei） */
  gasPriceProvider?: () => Promise<number> | number;
}

type CompoundHandler = (action: YieldAction) => void;
type BatchCompoundHandler = (actions: YieldAction[]) => void;

/**
 * 复投器：跟踪仓位集合并按周期触发复投。
 *
 * 设计：
 *  - 仓位在 YieldEngine 中管理，AutoCompounder 只持有引用
 *  - 通过事件解耦：实际收益计算 + 协议操作由外部注入
 *  - 内部仅做条件门控 + 调度
 */
export class AutoCompounder extends EventEmitter {
  private readonly intervalMs: number;
  private readonly gasPriceProvider: () => Promise<number> | number;
  private timer: NodeJS.Timeout | null = null;
  /** 复投执行钩子：单仓位 -> YieldAction */
  private executor: ((pos: YieldPosition) => Promise<YieldAction>) | null = null;
  /** 复投执行钩子：批量（同协议） */
  private batchExecutor: ((positions: YieldPosition[]) => Promise<YieldAction[]>) | null = null;
  private running = false;

  constructor(opts: AutoCompounderOptions = {}) {
    super();
    this.intervalMs = opts.intervalMs ?? 60 * 60_000;
    this.gasPriceProvider = opts.gasPriceProvider || (() => 10);
    if (opts.autoStart) this.start();
  }

  /**
   * 注入单仓位执行器
   */
  setExecutor(fn: (pos: YieldPosition) => Promise<YieldAction>): void {
    this.executor = fn;
  }

  /**
   * 注入批量执行器（优化 gas 消耗）
   */
  setBatchExecutor(fn: (positions: YieldPosition[]) => Promise<YieldAction[]>): void {
    this.batchExecutor = fn;
  }

  /**
   * 启动定时器
   */
  start(): void {
    if (this.timer) return;
    this.running = true;
    this.timer = setInterval(() => {
      this.tick().catch((err) => this.emit('error', err));
    }, this.intervalMs);
    // unref 防止阻塞进程退出
    this.timer.unref?.();
  }

  /**
   * 停止
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  /**
   * 立即执行一次 tick（用于测试或手动触发）
   */
  async tick(positions?: YieldPosition[]): Promise<YieldAction[]> {
    const list = positions || [];
    const gas = await Promise.resolve(this.gasPriceProvider());
    const triggered = list.filter((p) =>
      this.shouldCompound({
        position: p,
        currentGasGwei: gas,
      }).shouldCompound,
    );
    if (triggered.length === 0) return [];

    this.emit('triggered', triggered);
    const actions: YieldAction[] = [];

    // 批量：按协议分组
    const groups = this.groupByProtocol(triggered);
    for (const [protocol, group] of groups) {
      if (this.batchExecutor && group.length > 1) {
        const batch = await this.batchExecutor(group);
        for (const a of batch) {
          actions.push(a);
          this.emit('compound', a);
        }
      } else if (this.executor) {
        for (const pos of group) {
          const a = await this.executor(pos);
          actions.push(a);
          this.emit('compound', a);
        }
      } else {
        // 没有注入执行器：构造空 action（mock 模式）
        for (const pos of group) {
          const a = this.mockCompoundAction(pos, protocol);
          actions.push(a);
          this.emit('compound', a);
        }
      }
    }
    return actions;
  }

  /**
   * 对单个仓位执行复投
   */
  async compound(position: YieldPosition): Promise<YieldAction> {
    const trigger = this.shouldCompound({ position, currentGasGwei: await Promise.resolve(this.gasPriceProvider()) });
    if (!trigger.shouldCompound) {
      throw new Error(`Compound not triggered: ${trigger.reasons.join('; ')}`);
    }
    if (this.executor) {
      const a = await this.executor(position);
      this.emit('compound', a);
      return a;
    }
    return this.mockCompoundAction(position, position.protocol);
  }

  /**
   * 复投触发条件判断
   */
  shouldCompound(input: CompoundTriggerInput): CompoundTriggerResult {
    const { position, currentGasGwei, priceUsd = 1, now = Date.now() } = input;
    const reasons: string[] = [];
    let pass = true;

    // 1) 收益阈值
    const pendingUsd = parseFloat(position.pendingRewards) * priceUsd;
    if (pendingUsd < COMPOUND_MIN_THRESHOLD_USD) {
      pass = false;
      reasons.push(
        `pending rewards ${pendingUsd.toFixed(4)} USD below threshold ${COMPOUND_MIN_THRESHOLD_USD}`,
      );
    }

    // 2) 时间间隔
    const elapsed = now - position.lastCompoundTime;
    if (elapsed < COMPOUND_MIN_INTERVAL_MS) {
      pass = false;
      reasons.push(
        `interval ${(elapsed / 3600_000).toFixed(2)}h < min ${COMPOUND_MIN_INTERVAL_MS / 3600_000}h`,
      );
    }

    // 3) Gas
    if (currentGasGwei > COMPOUND_GAS_PRICE_MAX_GWEI) {
      pass = false;
      reasons.push(
        `gas ${currentGasGwei} Gwei > max ${COMPOUND_GAS_PRICE_MAX_GWEI} Gwei`,
      );
    }

    // 4) 状态
    if (position.status !== 'active') {
      pass = false;
      reasons.push(`position status ${position.status} not active`);
    }

    return { shouldCompound: pass, reasons, pendingUsd };
  }

  /**
   * 订阅：单次复投完成
   */
  onCompound(handler: CompoundHandler): () => void {
    this.on('compound', handler);
    return () => this.off('compound', handler);
  }

  /**
   * 订阅：批量触发事件
   */
  onTriggered(handler: (positions: YieldPosition[]) => void): () => void {
    this.on('triggered', handler);
    return () => this.off('triggered', handler);
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private groupByProtocol(positions: YieldPosition[]): Map<YieldProtocol, YieldPosition[]> {
    const m = new Map<YieldProtocol, YieldPosition[]>();
    for (const p of positions) {
      let arr = m.get(p.protocol);
      if (!arr) {
        arr = [];
        m.set(p.protocol, arr);
      }
      arr.push(p);
    }
    return m;
  }

  private mockCompoundAction(position: YieldPosition, protocol: YieldProtocol): YieldAction {
    return {
      id: makeYieldId('act'),
      userId: position.userId,
      positionId: position.id,
      type: 'compound' as ActionType,
      protocol,
      amount: position.pendingRewards,
      status: 'confirmed',
      createdAt: Date.now(),
      confirmedAt: Date.now(),
    };
  }
}

/** 工厂函数 */
export function createAutoCompounder(opts?: AutoCompounderOptions): AutoCompounder {
  return new AutoCompounder(opts);
}
