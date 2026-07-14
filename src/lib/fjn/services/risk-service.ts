/**
 * FJN Risk Service - 核心业务服务
 *
 * 严格遵循 H034 + H015 工业级职责规范：
 *  - 风险规则 (FjnRiskRule)：CRUD + 启用/禁用
 *  - 风险事件 (FjnRiskEvent)：记录 + 状态机（open/reviewing/resolved/escalated）
 *  - 风险案件 (FjnRiskCase)：开案 + 分派 + 解决 + 关闭 + 重开
 *  - 风险分数 (FjnRiskScore)：按 user + scoreType 记录 + 等级推导
 *  - 黑名单 (FjnBlacklist)：添加/移除/过期
 *  - 设备指纹 (FjnDeviceFingerprint)：注册 + 更新 + visit count
 *
 * 业务规则：
 *  - 规则：unique ruleCode
 *  - 事件：unique eventNo
 *  - 案件：unique caseNo
 *  - 黑名单：unique(category, value)
 *  - 设备：unique fingerprint
 *  - 状态机：所有状态变更必须经过白名单校验
 *  - 终态：resolved（事件）| resolved/closed（案件）| removed（黑名单）
 *  - 风险分数累加：根据 riskLevel 自动推等级
 *
 * 用法：
 *   const svc = new FjnRiskService();
 *   const rule = await svc.createRule({ ruleCode, ruleName, ruleType, riskLevel, action, ruleConfig });
 *   const event = await svc.recordEvent({ eventType, userId, riskScore, action, sourceType, sourceId });
 *   const case0 = await svc.openCase({ userId, caseType, riskLevel, relatedEventIds });
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  RISK_EVENT_STATUS,
  RISK_CASE_STATUS,
  RISK_LEVEL,
  RISK_ACTION,
  RISK_TYPE,
  RISK_SCORE_TYPE,
  BLACKLIST_CATEGORY,
  BLACKLIST_SOURCE,
  isTerminalRiskEventStatus,
  isTerminalRiskCaseStatus,
  isRiskEventReviewable,
  isRiskEventResolvable,
  isRiskEventEscalable,
  isRiskCaseAssignable,
  isRiskCaseResolvable,
  deriveRiskLevelFromScore,
  assertTransitRiskEventStatus,
  assertTransitRiskCaseStatus,
  FjnRiskEventStatus,
  FjnRiskCaseStatus,
  FjnRiskLevel,
  FjnRiskAction,
  FjnRiskType,
  FjnRiskScoreType,
  FjnBlacklistCategory,
  FjnBlacklistSource,
} from './risk-state-machine';
import {
  RISK_EVENTS,
  RISK_EVENT_SOURCES,
  RiskRuleCreatedPayload,
  RiskRuleUpdatedPayload,
  RiskRuleDisabledPayload,
  RiskRuleEnabledPayload,
  RiskEventRecordedPayload,
  RiskEventReviewingPayload,
  RiskEventResolvedPayload,
  RiskEventEscalatedPayload,
  RiskCaseOpenedPayload,
  RiskCaseAssignedPayload,
  RiskCaseResolvedPayload,
  RiskCaseClosedPayload,
  RiskCaseReopenedPayload,
  RiskScoreUpdatedPayload,
  BlacklistAddedPayload,
  BlacklistRemovedPayload,
  BlacklistExpiredPayload,
  DeviceRegisteredPayload,
  DeviceUpdatedPayload,
  FjnRiskEventSource,
} from './risk-events';
import {
  FjnRiskRuleNotFoundError,
  FjnRiskRuleAlreadyExistsError,
  FjnRiskRuleNotActiveError,
  FjnRiskRuleInvalidConfigError,
  FjnRiskRuleInvalidLevelError,
  FjnRiskRuleInvalidActionError,
  FjnRiskRuleDisabledError,
  FjnRiskEventNotFoundError,
  FjnRiskEventAlreadyExistsError,
  FjnRiskEventStatusInvalidError,
  FjnRiskEventNotReviewableError,
  FjnRiskEventNotResolvableError,
  FjnRiskEventNotEscalableError,
  FjnRiskEventInvalidScoreError,
  FjnRiskCaseNotFoundError,
  FjnRiskCaseAlreadyExistsError,
  FjnRiskCaseStatusInvalidError,
  FjnRiskCaseNotAssignableError,
  FjnRiskCaseNotResolvableError,
  FjnRiskCaseNotClosableError,
  FjnRiskCaseNotReopenableError,
  FjnRiskCaseAssigneeRequiredError,
  FjnRiskScoreInvalidError,
  FjnRiskScoreNegativeError,
  FjnRiskScoreTypeInvalidError,
  FjnRiskScoreUserRequiredError,
  FjnRiskBlacklistNotFoundError,
  FjnRiskBlacklistAlreadyExistsError,
  FjnRiskBlacklistCategoryInvalidError,
  FjnRiskBlacklistValueRequiredError,
  FjnRiskBlacklistNotActiveError,
  FjnRiskBlacklistExpiredError,
  FjnRiskBlacklistTargetCheckFailedError,
  FjnRiskDeviceNotFoundError,
  FjnRiskDeviceAlreadyExistsError,
  FjnRiskDeviceFingerprintRequiredError,
  FjnRiskLevelInvalidError,
  FjnRiskActionInvalidError,
  FjnRiskTypeInvalidError,
  FjnRiskReasonRequiredError,
  FjnRiskReviewerRequiredError,
  FjnRiskResolutionRequiredError,
  FjnRiskOperatorRequiredError,
  FjnRiskEvaluationFailedError,
} from './risk-errors';

// ============================================================
// 1. 公共类型定义
// ============================================================

/** 入参：创建风险规则 */
export interface CreateRiskRuleInput {
  ruleCode: string;
  ruleName: string;
  ruleType: FjnRiskType;
  riskLevel: FjnRiskLevel;
  action: FjnRiskAction;
  ruleConfig: Record<string, unknown>;
  priority?: number;
  enabled?: boolean;
  operatorId?: string;
}

/** 入参：更新风险规则 */
export interface UpdateRiskRuleInput {
  ruleName?: string;
  riskLevel?: FjnRiskLevel;
  action?: FjnRiskAction;
  ruleConfig?: Record<string, unknown>;
  priority?: number;
  operatorId?: string;
}

/** 入参：禁用规则 */
export interface DisableRiskRuleInput {
  reason?: string;
  operatorId?: string;
}

/** 入参：启用规则 */
export interface EnableRiskRuleInput {
  operatorId?: string;
}

/** 入参：记录风险事件 */
export interface RecordRiskEventInput {
  eventType: FjnRiskType;
  userId?: string;
  riskScore: number;
  riskLevel?: FjnRiskLevel; // 不传则根据 riskScore 推导
  sourceType?: string;
  sourceId?: string;
  ruleId?: string;
  payload?: Record<string, unknown>;
  action?: FjnRiskAction; // 不传则用 action default
  source?: FjnRiskEventSource;
  operatorId?: string;
}

/** 入参：审核风险事件 */
export interface ReviewRiskEventInput {
  reviewerId: string;
  operatorId?: string;
}

/** 入参：解决风险事件 */
export interface ResolveRiskEventInput {
  resolution: string;
  reviewerId?: string;
  reviewNote?: string;
  operatorId?: string;
}

/** 入参：升级风险事件 */
export interface EscalateRiskEventInput {
  reason: string;
  targetLevel: FjnRiskLevel;
  operatorId?: string;
}

/** 入参：开案 */
export interface OpenRiskCaseInput {
  userId: string;
  caseType: FjnRiskType;
  riskLevel: FjnRiskLevel;
  description?: string;
  relatedEventIds?: string[];
  source?: FjnRiskEventSource;
  operatorId?: string;
}

/** 入参：分派案件 */
export interface AssignRiskCaseInput {
  assignedTo: string;
  operatorId?: string;
}

/** 入参：解决案件 */
export interface ResolveRiskCaseInput {
  resolution: string;
  action: FjnRiskAction;
  operatorId?: string;
}

/** 入参：关闭案件 */
export interface CloseRiskCaseInput {
  resolution: string;
  operatorId?: string;
}

/** 入参：重开案件 */
export interface ReopenRiskCaseInput {
  reason: string;
  operatorId?: string;
}

/** 入参：更新风险分数 */
export interface UpdateRiskScoreInput {
  userId: string;
  scoreType: FjnRiskScoreType;
  score: number;
  riskLevel?: FjnRiskLevel;
  factors?: Record<string, unknown>;
  source?: FjnRiskEventSource;
  operatorId?: string;
}

/** 入参：添加黑名单 */
export interface AddBlacklistInput {
  category: FjnBlacklistCategory;
  value: string;
  reason: string;
  userId?: string;
  source?: FjnBlacklistSource;
  expiresAt?: Date | string;
  operatorId?: string;
}

/** 入参：移除黑名单 */
export interface RemoveBlacklistInput {
  reason: string;
  operatorId?: string;
}

/** 入参：注册设备 */
export interface RegisterDeviceInput {
  fingerprint: string;
  userId?: string;
  userAgent?: string;
  deviceType?: string;
  osVersion?: string;
  browserVersion?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  ipAddress?: string;
  countryCode?: string;
  source?: FjnRiskEventSource;
  operatorId?: string;
}

// ============================================================
// 2. RiskService 主体
// ============================================================

export class FjnRiskService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnRiskService' });
  }

  // ============================================================
  // 2.1 规则域
  // ============================================================

  /** 创建风险规则 */
  async createRule(input: CreateRiskRuleInput): Promise<Record<string, unknown>> {
    if (!input.ruleCode) throw new FjnRiskRuleInvalidConfigError({ reason: 'ruleCode required' });
    if (!input.ruleName) throw new FjnRiskRuleInvalidConfigError({ reason: 'ruleName required' });
    if (!ALL_RISK_TYPE_VALUES.includes(input.ruleType)) {
      throw new FjnRiskTypeInvalidError({ value: input.ruleType });
    }
    if (!ALL_RISK_LEVEL_VALUES.includes(input.riskLevel)) {
      throw new FjnRiskLevelInvalidError({ value: input.riskLevel });
    }
    if (!ALL_RISK_ACTION_VALUES.includes(input.action)) {
      throw new FjnRiskActionInvalidError({ value: input.action });
    }
    if (!input.ruleConfig || typeof input.ruleConfig !== 'object') {
      throw new FjnRiskRuleInvalidConfigError({ reason: 'ruleConfig must be object' });
    }

    return this.withTransaction(async (tx) => {
      const existing = await tx.fjnRiskRule.findUnique({ where: { ruleCode: input.ruleCode } });
      if (existing) {
        throw new FjnRiskRuleAlreadyExistsError({ ruleCode: input.ruleCode });
      }
      const created = await tx.fjnRiskRule.create({
        data: {
          ruleCode: input.ruleCode,
          ruleName: input.ruleName,
          ruleType: input.ruleType,
          riskLevel: input.riskLevel,
          ruleConfig: input.ruleConfig as Prisma.InputJsonValue,
          action: input.action,
          priority: input.priority ?? 100,
          enabled: input.enabled ?? true,
        },
      });
      const payload: RiskRuleCreatedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? RISK_EVENT_SOURCES.ADMIN : RISK_EVENT_SOURCES.SYSTEM,
        rule_id: created.id,
        rule_code: created.ruleCode,
        rule_name: created.ruleName,
        rule_type: created.ruleType as FjnRiskType,
        risk_level: created.riskLevel as FjnRiskLevel,
        action: created.action as FjnRiskAction,
        enabled: created.enabled,
      };
      await this.emitOutboxEvent(tx, RISK_EVENTS.RULE_CREATED, payload as unknown as Record<string, unknown>);
      return this.formatRule(created);
    });
  }

  /** 按 ID 查询规则 */
  async findRuleById(id: string): Promise<Record<string, unknown> | null> {
    const r = await this.prisma.fjnRiskRule.findUnique({ where: { id } });
    return r ? this.formatRule(r) : null;
  }

  /** 按 code 查询规则 */
  async findRuleByCode(ruleCode: string): Promise<Record<string, unknown> | null> {
    const r = await this.prisma.fjnRiskRule.findUnique({ where: { ruleCode } });
    return r ? this.formatRule(r) : null;
  }

  /** 列出规则 */
  async listRules(params: {
    ruleType?: FjnRiskType;
    riskLevel?: FjnRiskLevel;
    enabled?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Record<string, unknown>[]; total: number }> {
    const where: Prisma.FjnRiskRuleWhereInput = {};
    if (params.ruleType) where.ruleType = params.ruleType;
    if (params.riskLevel) where.riskLevel = params.riskLevel;
    if (params.enabled !== undefined) where.enabled = params.enabled;
    const [items, total] = await Promise.all([
      this.prisma.fjnRiskRule.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        take: params.limit ?? 50,
        skip: params.offset ?? 0,
      }),
      this.prisma.fjnRiskRule.count({ where }),
    ]);
    return { items: items.map((r) => this.formatRule(r)), total };
  }

  /** 更新规则 */
  async updateRule(id: string, input: UpdateRiskRuleInput): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const rule = await tx.fjnRiskRule.findUnique({ where: { id } });
      if (!rule) throw new FjnRiskRuleNotFoundError({ id });
      const data: Prisma.FjnRiskRuleUpdateInput = {};
      const changes: Record<string, unknown> = {};
      if (input.ruleName !== undefined) { data.ruleName = input.ruleName; changes.rule_name = input.ruleName; }
      if (input.riskLevel !== undefined) {
        if (!ALL_RISK_LEVEL_VALUES.includes(input.riskLevel)) throw new FjnRiskLevelInvalidError({ value: input.riskLevel });
        data.riskLevel = input.riskLevel;
        changes.risk_level = input.riskLevel;
      }
      if (input.action !== undefined) {
        if (!ALL_RISK_ACTION_VALUES.includes(input.action)) throw new FjnRiskActionInvalidError({ value: input.action });
        data.action = input.action;
        changes.action = input.action;
      }
      if (input.ruleConfig !== undefined) { data.ruleConfig = input.ruleConfig as Prisma.InputJsonValue; changes.rule_config = input.ruleConfig; }
      if (input.priority !== undefined) { data.priority = input.priority; changes.priority = input.priority; }
      if (Object.keys(data).length === 0) {
        return this.formatRule(rule);
      }
      const updated = await tx.fjnRiskRule.update({ where: { id }, data });
      const payload: RiskRuleUpdatedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? RISK_EVENT_SOURCES.ADMIN : RISK_EVENT_SOURCES.SYSTEM,
        rule_id: updated.id,
        rule_code: updated.ruleCode,
        changes,
      };
      await this.emitOutboxEvent(tx, RISK_EVENTS.RULE_UPDATED, payload as unknown as Record<string, unknown>);
      return this.formatRule(updated);
    });
  }

  /** 启用规则 */
  async enableRule(id: string, input: EnableRiskRuleInput = {}): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const rule = await tx.fjnRiskRule.findUnique({ where: { id } });
      if (!rule) throw new FjnRiskRuleNotFoundError({ id });
      if (rule.enabled) return this.formatRule(rule);
      const updated = await tx.fjnRiskRule.update({ where: { id }, data: { enabled: true } });
      const payload: RiskRuleEnabledPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? RISK_EVENT_SOURCES.ADMIN : RISK_EVENT_SOURCES.SYSTEM,
        rule_id: updated.id,
        rule_code: updated.ruleCode,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, RISK_EVENTS.RULE_ENABLED, payload as unknown as Record<string, unknown>);
      return this.formatRule(updated);
    });
  }

  /** 禁用规则 */
  async disableRule(id: string, input: DisableRiskRuleInput = {}): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const rule = await tx.fjnRiskRule.findUnique({ where: { id } });
      if (!rule) throw new FjnRiskRuleNotFoundError({ id });
      if (!rule.enabled) return this.formatRule(rule);
      const updated = await tx.fjnRiskRule.update({ where: { id }, data: { enabled: false } });
      const payload: RiskRuleDisabledPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? RISK_EVENT_SOURCES.ADMIN : RISK_EVENT_SOURCES.SYSTEM,
        rule_id: updated.id,
        rule_code: updated.ruleCode,
        reason: input.reason,
      };
      await this.emitOutboxEvent(tx, RISK_EVENTS.RULE_DISABLED, payload as unknown as Record<string, unknown>);
      return this.formatRule(updated);
    });
  }

  // ============================================================
  // 2.2 事件域
  // ============================================================

  /** 记录风险事件 */
  async recordEvent(input: RecordRiskEventInput): Promise<Record<string, unknown>> {
    if (!input.eventType) throw new FjnRiskTypeInvalidError({ reason: 'eventType required' });
    if (!ALL_RISK_TYPE_VALUES.includes(input.eventType)) {
      throw new FjnRiskTypeInvalidError({ value: input.eventType });
    }
    if (typeof input.riskScore !== 'number' || Number.isNaN(input.riskScore)) {
      throw new FjnRiskEventInvalidScoreError({ score: input.riskScore });
    }
    if (input.riskScore < 0) {
      throw new FjnRiskEventInvalidScoreError({ score: input.riskScore, reason: 'score must be >= 0' });
    }
    const riskLevel = input.riskLevel ?? deriveRiskLevelFromScore(input.riskScore);
    if (!ALL_RISK_LEVEL_VALUES.includes(riskLevel)) {
      throw new FjnRiskLevelInvalidError({ value: riskLevel });
    }
    const action = input.action ?? RISK_ACTION.WARNING;
    if (!ALL_RISK_ACTION_VALUES.includes(action)) {
      throw new FjnRiskActionInvalidError({ value: action });
    }

    return this.withTransaction(async (tx) => {
      // 校验关联规则（如有）
      if (input.ruleId) {
        const rule = await tx.fjnRiskRule.findUnique({ where: { id: input.ruleId } });
        if (!rule) throw new FjnRiskRuleNotFoundError({ id: input.ruleId });
        if (!rule.enabled) throw new FjnRiskRuleDisabledError({ id: input.ruleId });
      }
      const event = await tx.fjnRiskEvent.create({
        data: {
          eventNo: this.generateEventNo(),
          ruleId: input.ruleId ?? null,
          userId: input.userId ?? null,
          eventType: input.eventType,
          riskLevel,
          riskScore: Math.floor(input.riskScore),
          sourceType: input.sourceType ?? null,
          sourceId: input.sourceId ?? null,
          payload: (input.payload as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          action,
          status: RISK_EVENT_STATUS.OPEN,
        },
      });
      const payload: RiskEventRecordedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.source ?? this.resolveEventSource(input.sourceType),
        event_id: event.id,
        event_no: event.eventNo,
        event_type: event.eventType as FjnRiskType,
        user_id: event.userId ?? undefined,
        risk_level: event.riskLevel as FjnRiskLevel,
        risk_score: event.riskScore,
        source_type: event.sourceType ?? undefined,
        source_id: event.sourceId ?? undefined,
        action: event.action as FjnRiskAction,
        status: event.status as FjnRiskEventStatus,
      };
      await this.emitOutboxEvent(tx, RISK_EVENTS.EVENT_RECORDED, payload as unknown as Record<string, unknown>);

      // 同步更新用户风险分数
      if (input.userId) {
        const userLevel = deriveRiskLevelFromScore(input.riskScore);
        await tx.fjnRiskScore.create({
          data: {
            userId: input.userId,
            scoreType: 'user',
            score: Math.floor(input.riskScore),
            riskLevel: userLevel,
            factors: (input.payload as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          },
        });
        const scorePayload: RiskScoreUpdatedPayload = {
          occurred_at: new Date().toISOString(),
          source: input.source ?? RISK_EVENT_SOURCES.RISK,
          user_id: input.userId,
          score_type: 'user',
          score: Math.floor(input.riskScore),
          risk_level: userLevel,
          factors: input.payload,
        };
        await this.emitOutboxEvent(tx, RISK_EVENTS.SCORE_UPDATED, scorePayload as unknown as Record<string, unknown>);
      }

      return this.formatEvent(event);
    });
  }

  /** 按 ID 查询事件 */
  async findEventById(id: string): Promise<Record<string, unknown> | null> {
    const e = await this.prisma.fjnRiskEvent.findUnique({ where: { id } });
    return e ? this.formatEvent(e) : null;
  }

  /** 按 eventNo 查询 */
  async findEventByNo(eventNo: string): Promise<Record<string, unknown> | null> {
    const e = await this.prisma.fjnRiskEvent.findUnique({ where: { eventNo } });
    return e ? this.formatEvent(e) : null;
  }

  /** 列出事件 */
  async listEvents(params: {
    eventType?: FjnRiskType;
    riskLevel?: FjnRiskLevel;
    status?: FjnRiskEventStatus;
    userId?: string;
    sourceType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Record<string, unknown>[]; total: number }> {
    const where: Prisma.FjnRiskEventWhereInput = {};
    if (params.eventType) where.eventType = params.eventType;
    if (params.riskLevel) where.riskLevel = params.riskLevel;
    if (params.status) where.status = params.status;
    if (params.userId) where.userId = params.userId;
    if (params.sourceType) where.sourceType = params.sourceType;
    const [items, total] = await Promise.all([
      this.prisma.fjnRiskEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.limit ?? 50,
        skip: params.offset ?? 0,
      }),
      this.prisma.fjnRiskEvent.count({ where }),
    ]);
    return { items: items.map((e) => this.formatEvent(e)), total };
  }

  /** 审核事件（open/reviewing -> reviewing） */
  async reviewEvent(id: string, input: ReviewRiskEventInput): Promise<Record<string, unknown>> {
    if (!input.reviewerId) throw new FjnRiskReviewerRequiredError({});
    return this.withTransaction(async (tx) => {
      const e = await tx.fjnRiskEvent.findUnique({ where: { id } });
      if (!e) throw new FjnRiskEventNotFoundError({ id });
      const from = e.status as FjnRiskEventStatus;
      if (!isRiskEventReviewable(from)) {
        throw new FjnRiskEventNotReviewableError({ id, status: from });
      }
      const updated = await tx.fjnRiskEvent.update({
        where: { id },
        data: { status: RISK_EVENT_STATUS.REVIEWING, reviewerId: input.reviewerId },
      });
      const payload: RiskEventReviewingPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? RISK_EVENT_SOURCES.ADMIN : RISK_EVENT_SOURCES.SYSTEM,
        event_id: updated.id,
        event_no: updated.eventNo,
        reviewer_id: input.reviewerId,
      };
      await this.emitOutboxEvent(tx, RISK_EVENTS.EVENT_REVIEWING, payload as unknown as Record<string, unknown>);
      return this.formatEvent(updated);
    });
  }

  /** 解决事件（任意非终态 -> resolved） */
  async resolveEvent(id: string, input: ResolveRiskEventInput): Promise<Record<string, unknown>> {
    if (!input.resolution) throw new FjnRiskResolutionRequiredError({});
    return this.withTransaction(async (tx) => {
      const e = await tx.fjnRiskEvent.findUnique({ where: { id } });
      if (!e) throw new FjnRiskEventNotFoundError({ id });
      const from = e.status as FjnRiskEventStatus;
      if (!isRiskEventResolvable(from)) {
        throw new FjnRiskEventNotResolvableError({ id, status: from });
      }
      assertTransitRiskEventStatus(from, RISK_EVENT_STATUS.RESOLVED);
      const updated = await tx.fjnRiskEvent.update({
        where: { id },
        data: {
          status: RISK_EVENT_STATUS.RESOLVED,
          reviewNote: input.reviewNote ?? input.resolution,
          resolvedAt: new Date(),
          reviewerId: input.reviewerId ?? e.reviewerId,
        },
      });
      const payload: RiskEventResolvedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? RISK_EVENT_SOURCES.ADMIN : RISK_EVENT_SOURCES.SYSTEM,
        event_id: updated.id,
        event_no: updated.eventNo,
        reviewer_id: updated.reviewerId ?? undefined,
        review_note: updated.reviewNote ?? undefined,
        resolution: input.resolution,
      };
      await this.emitOutboxEvent(tx, RISK_EVENTS.EVENT_RESOLVED, payload as unknown as Record<string, unknown>);
      return this.formatEvent(updated);
    });
  }

  /** 升级事件（open/reviewing -> escalated） */
  async escalateEvent(id: string, input: EscalateRiskEventInput): Promise<Record<string, unknown>> {
    if (!input.reason) throw new FjnRiskReasonRequiredError({ context: 'escalate_event' });
    if (!ALL_RISK_LEVEL_VALUES.includes(input.targetLevel)) {
      throw new FjnRiskLevelInvalidError({ value: input.targetLevel });
    }
    return this.withTransaction(async (tx) => {
      const e = await tx.fjnRiskEvent.findUnique({ where: { id } });
      if (!e) throw new FjnRiskEventNotFoundError({ id });
      const from = e.status as FjnRiskEventStatus;
      if (!isRiskEventEscalable(from)) {
        throw new FjnRiskEventNotEscalableError({ id, status: from });
      }
      const updated = await tx.fjnRiskEvent.update({
        where: { id },
        data: {
          status: RISK_EVENT_STATUS.ESCALATED,
          riskLevel: input.targetLevel,
          reviewNote: input.reason,
        },
      });
      const payload: RiskEventEscalatedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? RISK_EVENT_SOURCES.ADMIN : RISK_EVENT_SOURCES.SYSTEM,
        event_id: updated.id,
        event_no: updated.eventNo,
        reason: input.reason,
        target_level: input.targetLevel,
      };
      await this.emitOutboxEvent(tx, RISK_EVENTS.EVENT_ESCALATED, payload as unknown as Record<string, unknown>);
      return this.formatEvent(updated);
    });
  }

  // ============================================================
  // 2.3 案件域
  // ============================================================

  /** 开案 */
  async openCase(input: OpenRiskCaseInput): Promise<Record<string, unknown>> {
    if (!input.userId) throw new FjnRiskScoreUserRequiredError({ context: 'case_user' });
    if (!ALL_RISK_TYPE_VALUES.includes(input.caseType)) {
      throw new FjnRiskTypeInvalidError({ value: input.caseType });
    }
    if (!ALL_RISK_LEVEL_VALUES.includes(input.riskLevel)) {
      throw new FjnRiskLevelInvalidError({ value: input.riskLevel });
    }
    return this.withTransaction(async (tx) => {
      const c = await tx.fjnRiskCase.create({
        data: {
          caseNo: this.generateCaseNo(),
          userId: input.userId,
          caseType: input.caseType,
          riskLevel: input.riskLevel,
          description: input.description ?? null,
          relatedEvents: (input.relatedEventIds
            ? { event_ids: input.relatedEventIds }
            : Prisma.JsonNull) as Prisma.InputJsonValue,
          status: RISK_CASE_STATUS.OPEN,
        },
      });
      const payload: RiskCaseOpenedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.source ?? RISK_EVENT_SOURCES.SYSTEM,
        case_id: c.id,
        case_no: c.caseNo,
        case_type: c.caseType as FjnRiskType,
        user_id: c.userId,
        risk_level: c.riskLevel as FjnRiskLevel,
        related_event_ids: input.relatedEventIds,
      };
      await this.emitOutboxEvent(tx, RISK_EVENTS.CASE_OPENED, payload as unknown as Record<string, unknown>);
      return this.formatCase(c);
    });
  }

  /** 按 ID 查询案件 */
  async findCaseById(id: string): Promise<Record<string, unknown> | null> {
    const c = await this.prisma.fjnRiskCase.findUnique({ where: { id } });
    return c ? this.formatCase(c) : null;
  }

  /** 按 caseNo 查询 */
  async findCaseByNo(caseNo: string): Promise<Record<string, unknown> | null> {
    const c = await this.prisma.fjnRiskCase.findUnique({ where: { caseNo } });
    return c ? this.formatCase(c) : null;
  }

  /** 列出案件 */
  async listCases(params: {
    userId?: string;
    caseType?: FjnRiskType;
    riskLevel?: FjnRiskLevel;
    status?: FjnRiskCaseStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Record<string, unknown>[]; total: number }> {
    const where: Prisma.FjnRiskCaseWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.caseType) where.caseType = params.caseType;
    if (params.riskLevel) where.riskLevel = params.riskLevel;
    if (params.status) where.status = params.status;
    const [items, total] = await Promise.all([
      this.prisma.fjnRiskCase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.limit ?? 50,
        skip: params.offset ?? 0,
      }),
      this.prisma.fjnRiskCase.count({ where }),
    ]);
    return { items: items.map((c) => this.formatCase(c)), total };
  }

  /** 分派案件 */
  async assignCase(id: string, input: AssignRiskCaseInput): Promise<Record<string, unknown>> {
    if (!input.assignedTo) throw new FjnRiskCaseAssigneeRequiredError({});
    return this.withTransaction(async (tx) => {
      const c = await tx.fjnRiskCase.findUnique({ where: { id } });
      if (!c) throw new FjnRiskCaseNotFoundError({ id });
      const from = c.status as FjnRiskCaseStatus;
      if (!isRiskCaseAssignable(from)) {
        throw new FjnRiskCaseNotAssignableError({ id, status: from });
      }
      const updated = await tx.fjnRiskCase.update({
        where: { id },
        data: {
          status: RISK_CASE_STATUS.INVESTIGATING,
          assignedTo: input.assignedTo,
        },
      });
      const payload: RiskCaseAssignedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? RISK_EVENT_SOURCES.ADMIN : RISK_EVENT_SOURCES.SYSTEM,
        case_id: updated.id,
        case_no: updated.caseNo,
        assigned_to: input.assignedTo,
      };
      await this.emitOutboxEvent(tx, RISK_EVENTS.CASE_ASSIGNED, payload as unknown as Record<string, unknown>);
      return this.formatCase(updated);
    });
  }

  /** 解决案件（任意非终态 -> resolved） */
  async resolveCase(id: string, input: ResolveRiskCaseInput): Promise<Record<string, unknown>> {
    if (!input.resolution) throw new FjnRiskResolutionRequiredError({});
    if (!ALL_RISK_ACTION_VALUES.includes(input.action)) {
      throw new FjnRiskActionInvalidError({ value: input.action });
    }
    return this.withTransaction(async (tx) => {
      const c = await tx.fjnRiskCase.findUnique({ where: { id } });
      if (!c) throw new FjnRiskCaseNotFoundError({ id });
      const from = c.status as FjnRiskCaseStatus;
      if (!isRiskCaseResolvable(from)) {
        throw new FjnRiskCaseNotResolvableError({ id, status: from });
      }
      assertTransitRiskCaseStatus(from, RISK_CASE_STATUS.RESOLVED);
      const updated = await tx.fjnRiskCase.update({
        where: { id },
        data: {
          status: RISK_CASE_STATUS.RESOLVED,
          resolution: input.resolution,
          resolvedAt: new Date(),
        },
      });
      const payload: RiskCaseResolvedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? RISK_EVENT_SOURCES.ADMIN : RISK_EVENT_SOURCES.SYSTEM,
        case_id: updated.id,
        case_no: updated.caseNo,
        resolution: input.resolution,
        action: input.action,
      };
      await this.emitOutboxEvent(tx, RISK_EVENTS.CASE_RESOLVED, payload as unknown as Record<string, unknown>);
      return this.formatCase(updated);
    });
  }

  /** 关闭案件（resolved/investigating/... -> closed） */
  async closeCase(id: string, input: CloseRiskCaseInput): Promise<Record<string, unknown>> {
    if (!input.resolution) throw new FjnRiskResolutionRequiredError({});
    return this.withTransaction(async (tx) => {
      const c = await tx.fjnRiskCase.findUnique({ where: { id } });
      if (!c) throw new FjnRiskCaseNotFoundError({ id });
      const from = c.status as FjnRiskCaseStatus;
      assertTransitRiskCaseStatus(from, RISK_CASE_STATUS.CLOSED);
      const updated = await tx.fjnRiskCase.update({
        where: { id },
        data: {
          status: RISK_CASE_STATUS.CLOSED,
          resolution: c.resolution ?? input.resolution,
        },
      });
      const payload: RiskCaseClosedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? RISK_EVENT_SOURCES.ADMIN : RISK_EVENT_SOURCES.SYSTEM,
        case_id: updated.id,
        case_no: updated.caseNo,
        resolution: input.resolution,
      };
      await this.emitOutboxEvent(tx, RISK_EVENTS.CASE_CLOSED, payload as unknown as Record<string, unknown>);
      return this.formatCase(updated);
    });
  }

  /** 重开案件（closed -> open） */
  async reopenCase(id: string, input: ReopenRiskCaseInput): Promise<Record<string, unknown>> {
    if (!input.reason) throw new FjnRiskReasonRequiredError({ context: 'reopen_case' });
    return this.withTransaction(async (tx) => {
      const c = await tx.fjnRiskCase.findUnique({ where: { id } });
      if (!c) throw new FjnRiskCaseNotFoundError({ id });
      const from = c.status as FjnRiskCaseStatus;
      if (from !== RISK_CASE_STATUS.CLOSED) {
        throw new FjnRiskCaseNotReopenableError({ id, status: from });
      }
      assertTransitRiskCaseStatus(from, RISK_CASE_STATUS.OPEN);
      const updated = await tx.fjnRiskCase.update({
        where: { id },
        data: {
          status: RISK_CASE_STATUS.OPEN,
          resolution: null,
          resolvedAt: null,
        },
      });
      const payload: RiskCaseReopenedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? RISK_EVENT_SOURCES.ADMIN : RISK_EVENT_SOURCES.SYSTEM,
        case_id: updated.id,
        case_no: updated.caseNo,
        reason: input.reason,
      };
      await this.emitOutboxEvent(tx, RISK_EVENTS.CASE_REOPENED, payload as unknown as Record<string, unknown>);
      return this.formatCase(updated);
    });
  }

  // ============================================================
  // 2.4 风险分数域
  // ============================================================

  /** 更新风险分数（新增一条历史记录） */
  async updateScore(input: UpdateRiskScoreInput): Promise<Record<string, unknown>> {
    if (!input.userId) throw new FjnRiskScoreUserRequiredError({});
    if (!ALL_RISK_SCORE_TYPE_VALUES.includes(input.scoreType)) {
      throw new FjnRiskScoreTypeInvalidError({ value: input.scoreType });
    }
    if (typeof input.score !== 'number' || Number.isNaN(input.score)) {
      throw new FjnRiskScoreInvalidError({ score: input.score });
    }
    if (input.score < 0) {
      throw new FjnRiskScoreNegativeError({ score: input.score });
    }
    const riskLevel = input.riskLevel ?? deriveRiskLevelFromScore(input.score);
    if (!ALL_RISK_LEVEL_VALUES.includes(riskLevel)) {
      throw new FjnRiskLevelInvalidError({ value: riskLevel });
    }
    const created = await this.prisma.fjnRiskScore.create({
      data: {
        userId: input.userId,
        scoreType: input.scoreType,
        score: Math.floor(input.score),
        riskLevel,
        factors: (input.factors as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
    const payload: RiskScoreUpdatedPayload = {
      occurred_at: new Date().toISOString(),
      source: input.source ?? RISK_EVENT_SOURCES.RISK,
      user_id: input.userId,
      score_type: input.scoreType,
      score: created.score,
      risk_level: riskLevel,
      factors: input.factors,
    };
    await this.emitOutboxEventNoTx(RISK_EVENTS.SCORE_UPDATED, payload as unknown as Record<string, unknown>);
    return this.formatScore(created);
  }

  /** 获取用户最新分数 */
  async getLatestUserScore(userId: string, scoreType: FjnRiskScoreType = 'user'): Promise<Record<string, unknown> | null> {
    const s = await this.prisma.fjnRiskScore.findFirst({
      where: { userId, scoreType },
      orderBy: { recordedAt: 'desc' },
    });
    return s ? this.formatScore(s) : null;
  }

  /** 列出用户分数历史 */
  async listUserScores(userId: string, params: { scoreType?: FjnRiskScoreType; limit?: number } = {}): Promise<{ items: Record<string, unknown>[]; total: number }> {
    const where: Prisma.FjnRiskScoreWhereInput = { userId };
    if (params.scoreType) where.scoreType = params.scoreType;
    const [items, total] = await Promise.all([
      this.prisma.fjnRiskScore.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
        take: params.limit ?? 50,
      }),
      this.prisma.fjnRiskScore.count({ where }),
    ]);
    return { items: items.map((s) => this.formatScore(s)), total };
  }

  // ============================================================
  // 2.5 黑名单域
  // ============================================================

  /** 添加黑名单 */
  async addBlacklist(input: AddBlacklistInput): Promise<Record<string, unknown>> {
    if (!ALL_BLACKLIST_CATEGORY_VALUES.includes(input.category)) {
      throw new FjnRiskBlacklistCategoryInvalidError({ value: input.category });
    }
    if (!input.value) throw new FjnRiskBlacklistValueRequiredError({});
    if (!input.reason) throw new FjnRiskReasonRequiredError({ context: 'add_blacklist' });
    const source: FjnBlacklistSource = input.source ?? BLACKLIST_SOURCE.MANUAL;
    const expiresAt = input.expiresAt
      ? (typeof input.expiresAt === 'string' ? new Date(input.expiresAt) : input.expiresAt)
      : null;
    if (expiresAt && isNaN(expiresAt.getTime())) {
      throw new FjnRiskBlacklistValueRequiredError({ reason: 'invalid expiresAt' });
    }
    return this.withTransaction(async (tx) => {
      const existing = await tx.fjnBlacklist.findFirst({
        where: { category: input.category, value: input.value },
      });
      if (existing && existing.enabled) {
        throw new FjnRiskBlacklistAlreadyExistsError({
          category: input.category,
          value: input.value,
        });
      }
      // 若存在但已 disabled，更新
      if (existing && !existing.enabled) {
        const updated = await tx.fjnBlacklist.update({
          where: { id: existing.id },
          data: {
            enabled: true,
            reason: input.reason,
            source,
            expiresAt,
            addedBy: input.operatorId ?? null,
            userId: input.userId ?? null,
          },
        });
        const payload: BlacklistAddedPayload = {
          occurred_at: new Date().toISOString(),
          source: input.operatorId ? RISK_EVENT_SOURCES.ADMIN : RISK_EVENT_SOURCES.SYSTEM,
          blacklist_id: updated.id,
          category: updated.category as FjnBlacklistCategory,
          value: updated.value,
          reason: input.reason,
          expires_at: expiresAt?.toISOString(),
        };
        await this.emitOutboxEvent(tx, RISK_EVENTS.BLACKLIST_ADDED, payload as unknown as Record<string, unknown>);
        return this.formatBlacklist(updated);
      }
      // 新建
      const created = await tx.fjnBlacklist.create({
        data: {
          category: input.category,
          value: input.value,
          reason: input.reason,
          source,
          enabled: true,
          expiresAt,
          addedBy: input.operatorId ?? null,
          userId: input.userId ?? null,
        },
      });
      const payload: BlacklistAddedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? RISK_EVENT_SOURCES.ADMIN : RISK_EVENT_SOURCES.SYSTEM,
        blacklist_id: created.id,
        category: created.category as FjnBlacklistCategory,
        value: created.value,
        reason: input.reason,
        expires_at: expiresAt?.toISOString(),
      };
      await this.emitOutboxEvent(tx, RISK_EVENTS.BLACKLIST_ADDED, payload as unknown as Record<string, unknown>);
      return this.formatBlacklist(created);
    });
  }

  /** 按 ID 查询黑名单 */
  async findBlacklistById(id: string): Promise<Record<string, unknown> | null> {
    const b = await this.prisma.fjnBlacklist.findUnique({ where: { id } });
    return b ? this.formatBlacklist(b) : null;
  }

  /** 列出黑名单 */
  async listBlacklists(params: {
    category?: FjnBlacklistCategory;
    enabled?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Record<string, unknown>[]; total: number }> {
    const where: Prisma.FjnBlacklistWhereInput = {};
    if (params.category) where.category = params.category;
    if (params.enabled !== undefined) where.enabled = params.enabled;
    const [items, total] = await Promise.all([
      this.prisma.fjnBlacklist.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.limit ?? 50,
        skip: params.offset ?? 0,
      }),
      this.prisma.fjnBlacklist.count({ where }),
    ]);
    return { items: items.map((b) => this.formatBlacklist(b)), total };
  }

  /** 移除黑名单（软删除：enabled = false） */
  async removeBlacklist(id: string, input: RemoveBlacklistInput): Promise<Record<string, unknown>> {
    if (!input.reason) throw new FjnRiskReasonRequiredError({ context: 'remove_blacklist' });
    return this.withTransaction(async (tx) => {
      const b = await tx.fjnBlacklist.findUnique({ where: { id } });
      if (!b) throw new FjnRiskBlacklistNotFoundError({ id });
      if (!b.enabled) {
        throw new FjnRiskBlacklistNotActiveError({ id, reason: input.reason });
      }
      const updated = await tx.fjnBlacklist.update({
        where: { id },
        data: { enabled: false },
      });
      const payload: BlacklistRemovedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? RISK_EVENT_SOURCES.ADMIN : RISK_EVENT_SOURCES.SYSTEM,
        blacklist_id: updated.id,
        category: updated.category as FjnBlacklistCategory,
        value: updated.value,
        reason: input.reason,
      };
      await this.emitOutboxEvent(tx, RISK_EVENTS.BLACKLIST_REMOVED, payload as unknown as Record<string, unknown>);
      return this.formatBlacklist(updated);
    });
  }

  /** 检查目标是否在黑名单中 */
  async checkBlacklist(category: FjnBlacklistCategory, value: string): Promise<Record<string, unknown> | null> {
    const b = await this.prisma.fjnBlacklist.findFirst({
      where: {
        category,
        value,
        enabled: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    return b ? this.formatBlacklist(b) : null;
  }

  /** 扫描过期黑名单（定时任务调用） */
  async expireBlacklists(): Promise<{ expired: number }> {
    const now = new Date();
    const result = await this.prisma.fjnBlacklist.updateMany({
      where: { enabled: true, expiresAt: { lt: now } },
      data: { enabled: false },
    });
    return { expired: result.count };
  }

  // ============================================================
  // 2.6 设备指纹域
  // ============================================================

  /** 注册设备 */
  async registerDevice(input: RegisterDeviceInput): Promise<Record<string, unknown>> {
    if (!input.fingerprint) throw new FjnRiskDeviceFingerprintRequiredError({});
    return this.withTransaction(async (tx) => {
      const existing = await tx.fjnDeviceFingerprint.findUnique({
        where: { fingerprint: input.fingerprint },
      });
      if (existing) {
        // 已存在：更新 lastSeenAt + visitCount + riskLevel
        const updated = await tx.fjnDeviceFingerprint.update({
          where: { id: existing.id },
          data: {
            lastSeenAt: new Date(),
            visitCount: existing.visitCount + 1,
            userId: input.userId ?? existing.userId,
            ipAddress: input.ipAddress ?? existing.ipAddress,
            userAgent: input.userAgent ?? existing.userAgent,
            countryCode: input.countryCode ?? existing.countryCode,
          },
        });
        const payload: DeviceUpdatedPayload = {
          occurred_at: new Date().toISOString(),
          source: input.source ?? RISK_EVENT_SOURCES.SYSTEM,
          device_id: updated.id,
          fingerprint: updated.fingerprint,
          risk_level: updated.riskLevel as FjnRiskLevel,
          visit_count: updated.visitCount,
        };
        await this.emitOutboxEvent(tx, RISK_EVENTS.DEVICE_UPDATED, payload as unknown as Record<string, unknown>);
        return this.formatDevice(updated);
      }
      const created = await tx.fjnDeviceFingerprint.create({
        data: {
          fingerprint: input.fingerprint,
          userId: input.userId ?? null,
          userAgent: input.userAgent ?? null,
          deviceType: input.deviceType ?? null,
          osVersion: input.osVersion ?? null,
          browserVersion: input.browserVersion ?? null,
          screenResolution: input.screenResolution ?? null,
          timezone: input.timezone ?? null,
          language: input.language ?? null,
          ipAddress: input.ipAddress ?? null,
          countryCode: input.countryCode ?? null,
          riskLevel: 'low',
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
          visitCount: 1,
        },
      });
      const payload: DeviceRegisteredPayload = {
        occurred_at: new Date().toISOString(),
        source: input.source ?? RISK_EVENT_SOURCES.SYSTEM,
        device_id: created.id,
        fingerprint: created.fingerprint,
        user_id: created.userId ?? undefined,
        ip_address: created.ipAddress ?? undefined,
        country_code: created.countryCode ?? undefined,
        risk_level: created.riskLevel as FjnRiskLevel,
      };
      await this.emitOutboxEvent(tx, RISK_EVENTS.DEVICE_REGISTERED, payload as unknown as Record<string, unknown>);
      return this.formatDevice(created);
    });
  }

  /** 按 fingerprint 查询设备 */
  async findDeviceByFingerprint(fingerprint: string): Promise<Record<string, unknown> | null> {
    const d = await this.prisma.fjnDeviceFingerprint.findUnique({ where: { fingerprint } });
    return d ? this.formatDevice(d) : null;
  }

  /** 列出设备 */
  async listDevices(params: {
    userId?: string;
    riskLevel?: FjnRiskLevel;
    countryCode?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Record<string, unknown>[]; total: number }> {
    const where: Prisma.FjnDeviceFingerprintWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.riskLevel) where.riskLevel = params.riskLevel;
    if (params.countryCode) where.countryCode = params.countryCode;
    const [items, total] = await Promise.all([
      this.prisma.fjnDeviceFingerprint.findMany({
        where,
        orderBy: { lastSeenAt: 'desc' },
        take: params.limit ?? 50,
        skip: params.offset ?? 0,
      }),
      this.prisma.fjnDeviceFingerprint.count({ where }),
    ]);
    return { items: items.map((d) => this.formatDevice(d)), total };
  }

  // ============================================================
  // 3. 内部工具
  // ============================================================

  /** 解析事件源 */
  private resolveEventSource(sourceType: string | undefined): FjnRiskEventSource {
    if (!sourceType) return RISK_EVENT_SOURCES.SYSTEM;
    const map: Record<string, FjnRiskEventSource> = {
      order: RISK_EVENT_SOURCES.ORDER,
      payment: RISK_EVENT_SOURCES.PAYMENT,
      referral: RISK_EVENT_SOURCES.REFERRAL,
      reward: RISK_EVENT_SOURCES.REWARD,
      kyc: RISK_EVENT_SOURCES.KYC,
      wallet: RISK_EVENT_SOURCES.WALLET,
      node: RISK_EVENT_SOURCES.NODE,
      team: RISK_EVENT_SOURCES.TEAM,
    };
    return map[sourceType] ?? RISK_EVENT_SOURCES.SYSTEM;
  }

  /** 生成风险事件编号：FRE + YYYYMMDD + 8位随机 */
  private generateEventNo(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `FRE${date}${random}`;
  }

  /** 生成风险案件编号：FRC + YYYYMMDD + 8位随机 */
  private generateCaseNo(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `FRC${date}${random}`;
  }

  /** 写入 outbox 事件（事务内） */
  private async emitOutboxEvent(
    tx: any,
    eventType: string,
    payload: object,
  ): Promise<void> {
    try {
      await (tx as any).outboxEvent.create({
        data: {
          eventType,
          payload: payload as any,
          status: 'pending',
          retryCount: 0,
        },
      });
    } catch (e) {
      this.log('warn', `emitOutboxEvent failed (${eventType})`, { error: (e as Error).message });
    }
  }

  /** 非事务 outbox 事件 */
  private async emitOutboxEventNoTx(
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      await (this.prisma as any).outboxEvent.create({
        data: {
          eventType,
          payload: payload as any,
          status: 'pending',
          retryCount: 0,
        },
      });
    } catch (e) {
      this.log('warn', `emitOutboxEventNoTx failed (${eventType})`, { error: (e as Error).message });
    }
  }

  private formatRule(r: any): Record<string, unknown> {
    return {
      rule_id: r.id,
      rule_code: r.ruleCode,
      rule_name: r.ruleName,
      rule_type: r.ruleType,
      risk_level: r.riskLevel,
      rule_config: r.ruleConfig ?? null,
      action: r.action,
      priority: r.priority,
      enabled: r.enabled,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    };
  }

  private formatEvent(e: any): Record<string, unknown> {
    return {
      event_id: e.id,
      event_no: e.eventNo,
      rule_id: e.ruleId,
      user_id: e.userId,
      event_type: e.eventType,
      risk_level: e.riskLevel,
      risk_score: e.riskScore,
      source_type: e.sourceType,
      source_id: e.sourceId,
      payload: e.payload ?? null,
      action: e.action,
      status: e.status,
      reviewer_id: e.reviewerId,
      review_note: e.reviewNote,
      resolved_at: e.resolvedAt,
      created_at: e.createdAt,
      updated_at: e.updatedAt,
    };
  }

  private formatCase(c: any): Record<string, unknown> {
    return {
      case_id: c.id,
      case_no: c.caseNo,
      user_id: c.userId,
      case_type: c.caseType,
      risk_level: c.riskLevel,
      description: c.description,
      related_events: c.relatedEvents ?? null,
      status: c.status,
      assigned_to: c.assignedTo,
      resolution: c.resolution,
      resolved_at: c.resolvedAt,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    };
  }

  private formatScore(s: any): Record<string, unknown> {
    return {
      score_id: s.id,
      user_id: s.userId,
      score_type: s.scoreType,
      score: s.score,
      risk_level: s.riskLevel,
      factors: s.factors ?? null,
      recorded_at: s.recordedAt,
    };
  }

  private formatBlacklist(b: any): Record<string, unknown> {
    return {
      blacklist_id: b.id,
      category: b.category,
      value: b.value,
      reason: b.reason,
      source: b.source,
      enabled: b.enabled,
      expires_at: b.expiresAt,
      added_by: b.addedBy,
      user_id: b.userId,
      created_at: b.createdAt,
    };
  }

  private formatDevice(d: any): Record<string, unknown> {
    return {
      device_id: d.id,
      fingerprint: d.fingerprint,
      user_id: d.userId,
      user_agent: d.userAgent,
      device_type: d.deviceType,
      os_version: d.osVersion,
      browser_version: d.browserVersion,
      screen_resolution: d.screenResolution,
      timezone: d.timezone,
      language: d.language,
      ip_address: d.ipAddress,
      country_code: d.countryCode,
      risk_level: d.riskLevel,
      first_seen_at: d.firstSeenAt,
      last_seen_at: d.lastSeenAt,
      visit_count: d.visitCount,
    };
  }
}

const ALL_RISK_TYPE_VALUES: readonly FjnRiskType[] = Object.values(RISK_TYPE);
const ALL_RISK_LEVEL_VALUES: readonly FjnRiskLevel[] = Object.values(RISK_LEVEL);
const ALL_RISK_ACTION_VALUES: readonly FjnRiskAction[] = Object.values(RISK_ACTION);
const ALL_RISK_SCORE_TYPE_VALUES: readonly FjnRiskScoreType[] = Object.values(RISK_SCORE_TYPE);
const ALL_BLACKLIST_CATEGORY_VALUES: readonly FjnBlacklistCategory[] = Object.values(BLACKLIST_CATEGORY);

/** 工厂函数 */
export function createFjnRiskService(options: FjnServiceOptions = {}): FjnRiskService {
  return new FjnRiskService(options);
}
