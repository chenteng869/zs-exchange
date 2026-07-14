/**
 * Rule Engine Service - 业务规则引擎
 *
 * 文档：docs/369福建老酒源代码-开发/H-RuleEngine-Service.md
 *
 * 职责：
 *  - 注册规则（DSL 风格 JSON：when/then）
 *  - 求值（基于 facts 输入）
 *  - 版本管理（ruleVersion + effectiveFrom/To）
 *  - 审计（每次求值记录 rule_eval_log）
 *  - 跨 Service 复用：风控、税务、奖励、KYC 决策
 *
 * 状态机：
 *  draft -> active -> deprecated
 *              \\-> disabled
 *
 * 注意：当前实现使用 in-memory 规则存储 + outbox 事件持久化
 * （数据库表 fjnRule / fjnRuleEvalLog 待补 schema 后切换为 Prisma）
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import { RULE_EVENT, FjnRuleEventType } from './rule-engine-events';
import { RULE_STATUS, canTransitRuleStatus, FjnRuleStatus } from './rule-engine-state-machine';

// ============================================================
// DSL 类型
// ============================================================

export type FjnRuleCondition =
  | { op: 'and' | 'or'; children: FjnRuleCondition[] }
  | { op: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'regex'; field: string; value: unknown }
  | { op: 'always' };

export interface FjnRule {
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  domain: string;
  condition: FjnRuleCondition;
  action: Record<string, unknown>;
  priority: number;
  status: FjnRuleStatus;
  effectiveFrom: Date;
  effectiveTo?: Date;
  version: number;
  createdAt: Date;
}

export interface FjnRuleRegisterInput {
  ruleCode: string;
  ruleName: string;
  domain: string;
  condition: FjnRuleCondition;
  action: Record<string, unknown>;
  priority?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

// ============================================================
// In-Memory Store（生产可切换为 Prisma）
// ============================================================

const ruleStore = new Map<string, FjnRule>();
const codeIndex = new Map<string, string>(); // ruleCode -> ruleId
const evalLogStore: Array<{
  ruleId: string;
  userId?: string;
  facts: Record<string, unknown>;
  matched: boolean;
  evaluatedAt: Date;
}> = [];

// ============================================================
// Service 实现
// ============================================================

export class FjnRuleEngineService extends FjnServiceBase {
  constructor(options?: FjnServiceOptions) {
    super(options);
  }

  // ------------------------------------------------------------
  // 注册规则
  // ------------------------------------------------------------
  async registerRule(input: FjnRuleRegisterInput): Promise<{ ruleId: string; version: number }> {
    return this.withTransaction(async (tx) => {
      const existing = codeIndex.has(input.ruleCode)
        ? ruleStore.get(codeIndex.get(input.ruleCode)!)
        : undefined;
      const newVersion = (existing?.version ?? 0) + 1;
      const ruleId = `rule-${input.ruleCode}-v${newVersion}-${Date.now().toString(36)}`;
      const rule: FjnRule = {
        ruleId,
        ruleCode: input.ruleCode,
        ruleName: input.ruleName,
        domain: input.domain,
        condition: input.condition,
        action: input.action,
        priority: input.priority ?? 0,
        status: RULE_STATUS.DRAFT,
        effectiveFrom: input.effectiveFrom ?? new Date(),
        effectiveTo: input.effectiveTo,
        version: newVersion,
        createdAt: new Date(),
      };
      ruleStore.set(ruleId, rule);
      codeIndex.set(input.ruleCode, ruleId);

      await (tx as any).outboxEvent.create({
        data: {
          eventType: RULE_EVENT.RULE_REGISTERED,
          payload: {
            ruleId,
            ruleCode: input.ruleCode,
            version: newVersion,
            domain: input.domain,
            occurredAt: new Date().toISOString(),
          } as unknown as Prisma.InputJsonValue,
          status: 'pending',
          retryCount: 0,
        },
      });

      this.log('info', `Rule registered: ${input.ruleCode} v${newVersion}`);
      return { ruleId, version: newVersion };
    });
  }

  // ------------------------------------------------------------
  // 状态转移
  // ------------------------------------------------------------
  async activateRule(ruleId: string): Promise<void> {
    return this.transitionStatus(ruleId, RULE_STATUS.ACTIVE, RULE_EVENT.RULE_ACTIVATED);
  }

  async disableRule(ruleId: string): Promise<void> {
    return this.transitionStatus(ruleId, RULE_STATUS.DISABLED, RULE_EVENT.RULE_DISABLED);
  }

  async deprecateRule(ruleId: string): Promise<void> {
    return this.transitionStatus(ruleId, RULE_STATUS.DEPRECATED, RULE_EVENT.RULE_DEPRECATED);
  }

  private async transitionStatus(
    ruleId: string,
    to: FjnRuleStatus,
    eventType: FjnRuleEventType,
  ): Promise<void> {
    return this.withTransaction(async (tx) => {
      const rule = ruleStore.get(ruleId);
      if (!rule) throw new Error(`Rule not found: ${ruleId}`);
      if (!canTransitRuleStatus(rule.status, to)) {
        throw new Error(`Illegal transition: ${rule.status} -> ${to}`);
      }
      rule.status = to;
      ruleStore.set(ruleId, rule);
      await (tx as any).outboxEvent.create({
        data: {
          eventType,
          payload: {
            ruleId,
            ruleCode: rule.ruleCode,
            version: rule.version,
            toStatus: to,
            occurredAt: new Date().toISOString(),
          } as unknown as Prisma.InputJsonValue,
          status: 'pending',
          retryCount: 0,
        },
      });
      this.log('info', `Rule ${rule.ruleCode} -> ${to}`);
    });
  }

  // ------------------------------------------------------------
  // 求值
  // ------------------------------------------------------------
  async evaluate(
    domain: string,
    facts: Record<string, unknown>,
    options?: { userId?: string; trace?: boolean },
  ): Promise<{
    matched: Array<{ ruleId: string; ruleCode: string; action: Record<string, unknown> }>;
    count: number;
    detail?: Array<{ ruleCode: string; matched: boolean }>;
  }> {
    const now = new Date();
    const candidates: FjnRule[] = [];
    for (const r of ruleStore.values()) {
      if (r.domain !== domain) continue;
      if (r.status !== RULE_STATUS.ACTIVE) continue;
      if (r.effectiveFrom > now) continue;
      if (r.effectiveTo && r.effectiveTo < now) continue;
      candidates.push(r);
    }
    candidates.sort((a, b) => b.priority - a.priority);

    const trace = options?.trace ?? false;
    const matched: Array<{ ruleId: string; ruleCode: string; action: Record<string, unknown> }> = [];
    const detail: Array<{ ruleCode: string; matched: boolean }> = [];

    for (const rule of candidates) {
      const ok = this.evalCondition(rule.condition, facts);
      detail.push({ ruleCode: rule.ruleCode, matched: ok });
      if (ok) {
        matched.push({ ruleId: rule.ruleId, ruleCode: rule.ruleCode, action: rule.action });
        evalLogStore.push({
          ruleId: rule.ruleId,
          userId: options?.userId,
          facts,
          matched: true,
          evaluatedAt: now,
        });
      }
    }

    return {
      matched,
      count: matched.length,
      detail: trace ? detail : undefined,
    };
  }

  // ------------------------------------------------------------
  // 列出规则
  // ------------------------------------------------------------
  async listRules(filter: { domain?: string; status?: FjnRuleStatus; skip?: number; take?: number }): Promise<FjnRule[]> {
    let arr = Array.from(ruleStore.values());
    if (filter.domain) arr = arr.filter((r) => r.domain === filter.domain);
    if (filter.status) arr = arr.filter((r) => r.status === filter.status);
    arr.sort((a, b) => {
      if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.version - a.version;
    });
    const skip = filter.skip ?? 0;
    const take = filter.take ?? 20;
    return arr.slice(skip, skip + take);
  }

  async getRuleByCode(ruleCode: string): Promise<FjnRule | null> {
    const id = codeIndex.get(ruleCode);
    if (!id) return null;
    return ruleStore.get(id) ?? null;
  }

  // ------------------------------------------------------------
  // 私有：条件求值器
  // ------------------------------------------------------------
  private evalCondition(c: FjnRuleCondition, facts: Record<string, unknown>): boolean {
    switch (c.op) {
      case 'always':
        return true;
      case 'and':
        return c.children.every((ch) => this.evalCondition(ch, facts));
      case 'or':
        return c.children.some((ch) => this.evalCondition(ch, facts));
      case 'eq':
        return facts[c.field] === c.value;
      case 'ne':
        return facts[c.field] !== c.value;
      case 'gt':
        return Number(facts[c.field]) > Number(c.value);
      case 'gte':
        return Number(facts[c.field]) >= Number(c.value);
      case 'lt':
        return Number(facts[c.field]) < Number(c.value);
      case 'lte':
        return Number(facts[c.field]) <= Number(c.value);
      case 'in':
        return Array.isArray(c.value) && c.value.includes(facts[c.field]);
      case 'nin':
        return Array.isArray(c.value) && !c.value.includes(facts[c.field]);
      case 'contains':
        return String(facts[c.field] ?? '').includes(String(c.value));
      case 'regex': {
        try {
          return new RegExp(String(c.value)).test(String(facts[c.field] ?? ''));
        } catch {
          return false;
        }
      }
      default:
        return false;
    }
  }
}
