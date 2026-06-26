/**
 * 告警引擎（AlertEngine）
 *
 * 职责：
 *  - 维护一组告警规则（AlertRule）
 *  - 周期调用 evaluate() 评估规则
 *  - 维护告警生命周期：firing → resolved
 *  - 内置 cooldown 抑制重复告警
 *  - 通过 onAlert(handler) 订阅告警事件
 *
 * 设计原则：
 *  - 纯内存实现，不依赖 Redis/DB
 *  - 规则评估器 (evaluator) 是异步函数，由调用方注入实际业务逻辑
 *  - 同一 rule.id 同时只能存在一个 firing 告警
 */

import { EventEmitter } from 'events';

// =============================================================================
// 公共类型
// =============================================================================

/** 告警严重等级 */
export type AlertSeverity = 'P0' | 'P1' | 'P2' | 'P3';

/** 告警状态机：firing（正在触发）→ resolved（已恢复），pending 为中间过渡 */
export type AlertStatus = 'firing' | 'resolved' | 'pending';

/** 告警事件 */
export interface Alert {
  /** 唯一 id（rule.id + 时间戳） */
  id: string;
  /** 规则 id */
  rule: string;
  /** 严重等级 */
  severity: AlertSeverity;
  /** 当前状态 */
  status: AlertStatus;
  /** 人类可读消息 */
  message: string;
  /** 触发时的上下文（任意 JSON 可序列化对象） */
  context: Record<string, any>;
  /** 触发时间（ms） */
  firedAt: number;
  /** 解决时间（ms） */
  resolvedAt?: number;
}

/** 告警事件回调 */
export type AlertHandler = (alert: Alert) => void | Promise<void>;

/** 告警规则 */
export interface AlertRule {
  /** 唯一 id */
  id: string;
  /** 描述 */
  description: string;
  /** 严重等级 */
  severity: AlertSeverity;
  /**
   * 评估器：返回 true 表示触发，false 表示未触发。
   * 当规则从未触发切换为触发时，生成 firing 告警；
   * 当规则从触发切换为未触发时，生成 resolved 告警。
   */
  evaluator: () => Promise<boolean> | boolean;
  /** 同一规则的最小触发间隔（ms），默认 60_000（1 分钟） */
  cooldownMs?: number;
  /**
   * 可选上下文提供者：在 firing 时返回上下文（注入到 Alert.context）。
   * 解析后无需提供。
   */
  contextProvider?: () => Record<string, any> | Promise<Record<string, any>>;
}

// =============================================================================
// 内部状态
// =============================================================================

interface RuleState {
  /** 该规则上一次评估结果 */
  lastFiring: boolean;
  /** 上次 firing 告警的 id */
  lastAlertId?: string;
  /** 上次 firing 触发时间（ms，用于 cooldown） */
  lastFiredAt: number;
  /** 已 resolved 告警的 id 列表（用于历史查询） */
  resolvedIds: string[];
}

const DEFAULT_COOLDOWN_MS = 60_000;

// =============================================================================
// AlertEngine
// =============================================================================

export interface AlertEngineOptions {
  /** 默认 cooldown（ms），默认 60_000 */
  defaultCooldownMs?: number;
  /** 时间提供者（用于测试） */
  now?: () => number;
  /** id 生成器（用于测试） */
  idGen?: () => string;
}

export class AlertEngine extends EventEmitter {
  private readonly rules: Map<string, AlertRule> = new Map();
  private readonly states: Map<string, RuleState> = new Map();
  private readonly activeAlerts: Map<string, Alert> = new Map();
  private readonly resolvedAlerts: Map<string, Alert> = new Map();
  private readonly handlers: AlertHandler[] = [];
  private readonly defaultCooldownMs: number;
  private readonly now: () => number;
  private readonly idGen: () => string;

  constructor(opts: AlertEngineOptions = {}) {
    super();
    this.defaultCooldownMs = opts.defaultCooldownMs ?? DEFAULT_COOLDOWN_MS;
    this.now = opts.now ?? Date.now;
    this.idGen = opts.idGen ?? (() => `${this.now()}-${Math.random().toString(36).slice(2, 8)}`);
  }

  // -------------------------------------------------------------------------
  // 规则管理
  // -------------------------------------------------------------------------

  /** 注册规则（覆盖同名） */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    if (!this.states.has(rule.id)) {
      this.states.set(rule.id, {
        lastFiring: false,
        lastFiredAt: 0,
        resolvedIds: [],
      });
    }
  }

  /** 移除规则 */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.states.delete(ruleId);
    // 清理 active/resolved
    for (const a of Array.from(this.activeAlerts.values())) {
      if (a.rule === ruleId) this.activeAlerts.delete(a.id);
    }
    for (const a of Array.from(this.resolvedAlerts.values())) {
      if (a.rule === ruleId) this.resolvedAlerts.delete(a.id);
    }
  }

  /** 列出所有规则 */
  listRules(): AlertRule[] {
    return Array.from(this.rules.values()).map(r => ({ ...r }));
  }

  // -------------------------------------------------------------------------
  // 事件订阅
  // -------------------------------------------------------------------------

  /** 订阅告警事件（firing + resolved） */
  onAlert(handler: AlertHandler): () => void {
    this.handlers.push(handler);
    return () => {
      const idx = this.handlers.indexOf(handler);
      if (idx >= 0) this.handlers.splice(idx, 1);
    };
  }

  // -------------------------------------------------------------------------
  // 状态查询
  // -------------------------------------------------------------------------

  /** 获取所有 firing 告警 */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /** 获取所有 resolved 告警（历史） */
  getResolvedAlerts(): Alert[] {
    return Array.from(this.resolvedAlerts.values());
  }

  /** 获取某条告警 */
  getAlert(id: string): Alert | undefined {
    return this.activeAlerts.get(id) ?? this.resolvedAlerts.get(id);
  }

  // -------------------------------------------------------------------------
  // 核心：评估所有规则
  // -------------------------------------------------------------------------

  /**
   * 评估所有规则，返回本次评估触发的告警事件列表（firing + resolved）。
   * 该方法本身是同步的（内部用 Promise.all），返回的是评估完成后的告警。
   * 如果希望"评估完成时执行副作用"，请在调用方 await。
   */
  async evaluate(): Promise<Alert[]> {
    const fired: Alert[] = [];
    const ruleIds = Array.from(this.rules.keys());

    // 并发评估所有规则
    const results = await Promise.all(
      ruleIds.map(async (id) => {
        const rule = this.rules.get(id)!;
        try {
          const shouldFire = await rule.evaluator();
          const ctx = shouldFire && rule.contextProvider
            ? await rule.contextProvider()
            : {};
          return { id, shouldFire: !!shouldFire, context: ctx, error: null as any };
        } catch (err) {
          return {
            id,
            shouldFire: false,
            context: {},
            error: err as Error,
          };
        }
      }),
    );

    for (const r of results) {
      const rule = this.rules.get(r.id)!;
      const state = this.states.get(r.id)!;
      const wasFiring = state.lastFiring;

      if (r.error) {
        // 评估器抛错：视为非触发（不升级告警，避免噪声）
        // 可选：升级为内部 warning
        continue;
      }

      if (r.shouldFire) {
        if (!wasFiring) {
          // 未触发 → 触发：检查 cooldown
          const cooldown = rule.cooldownMs ?? this.defaultCooldownMs;
          const now = this.now();
          // cooldown 严格 > 上次触发时间：避免边界重复
          if (now - state.lastFiredAt > cooldown) {
            const alert: Alert = {
              id: this.idGen(),
              rule: rule.id,
              severity: rule.severity,
              status: 'firing',
              message: rule.description,
              context: r.context,
              firedAt: now,
            };
            this.activeAlerts.set(alert.id, alert);
            state.lastAlertId = alert.id;
            state.lastFiredAt = now;
            state.lastFiring = true;
            fired.push(alert);
            await this.dispatch(alert);
          }
        }
        // 持续 firing：什么都不做（避免告警风暴）
      } else {
        if (wasFiring) {
          // 触发 → 恢复
          const prev = state.lastAlertId ? this.activeAlerts.get(state.lastAlertId) : undefined;
          const alert: Alert = {
            id: this.idGen(),
            rule: rule.id,
            severity: rule.severity,
            status: 'resolved',
            message: `Resolved: ${rule.description}`,
            context: r.context,
            firedAt: prev?.firedAt ?? this.now(),
            resolvedAt: this.now(),
          };
          this.resolvedAlerts.set(alert.id, alert);
          state.resolvedIds.push(alert.id);
          if (prev) this.activeAlerts.delete(prev.id);
          state.lastFiring = false;
          fired.push(alert);
          await this.dispatch(alert);
        }
      }
    }

    return fired;
  }

  /** 向所有 handler 派发告警（handler 抛错不中断） */
  private async dispatch(alert: Alert): Promise<void> {
    for (const h of this.handlers) {
      try {
        await h(alert);
      } catch (err) {
        // 静默：handler 错误不应影响引擎
        // eslint-disable-next-line no-console
        console.error('[AlertEngine] handler error:', err);
      }
    }
    this.emit('alert', alert);
  }

  // -------------------------------------------------------------------------
  // 维护
  // -------------------------------------------------------------------------

  /** 清理已 resolved 历史（避免内存泄漏） */
  pruneResolved(keepLast: number = 100): number {
    const all = Array.from(this.resolvedAlerts.values())
      .sort((a, b) => (a.resolvedAt ?? 0) - (b.resolvedAt ?? 0));
    if (all.length <= keepLast) return 0;
    const toRemove = all.slice(0, all.length - keepLast);
    for (const a of toRemove) this.resolvedAlerts.delete(a.id);
    return toRemove.length;
  }

  /** 清空所有状态 */
  clear(): void {
    this.rules.clear();
    this.states.clear();
    this.activeAlerts.clear();
    this.resolvedAlerts.clear();
    this.handlers.length = 0;
    this.removeAllListeners();
  }
}

export default AlertEngine;
