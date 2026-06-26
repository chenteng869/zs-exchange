/**
 * 风控规则引擎
 *
 * 评估单个风控事件，返回 allow / review / block 决策。
 *
 * 评分机制：
 *  - 每个触发规则按权重扣分（subtract）
 *  - 总分 >= 80：allow
 *  - 30 <= 总分 < 80：review
 *  - 总分 < 30：block
 *
 * 规则可热加载：从 API 拉取后注入到 loadRules。
 *
 * @module lib/risk/engine
 */

import type { ID, ISODate, RiskCondition, RiskEvent, RiskRule } from '@/types/models';
import { randomString } from '@/lib/auth/crypto';
import { RiskError } from '@/lib/auth/errors';
import { runAmlChecks, detectLargeTransaction, LARGE_TX_THRESHOLD } from './aml';
import { checkAllLimits } from './limits';

// ============================================================================
// 类型
// =====================================================================================

export type RiskAction = 'allow' | 'review' | 'block';

export interface RiskDecision {
  action: RiskAction;
  /** 0-100 风险分（越高越安全） */
  score: number;
  /** 触发的规则及扣分明细 */
  triggered: Array<{ ruleId: ID; name: string; weight: number; reason: string }>;
  /** 备注 */
  notes: string[];
  /** 评估时间 */
  evaluatedAt: ISODate;
  /** 关联事件 ID */
  eventId: ID;
  /** 决策时间毫秒 */
  evaluationTimeMs: number;
}

export interface EvaluateContext {
  /** 用户 ID */
  userId: ID;
  /** KYC 等级 */
  kycLevel: 0 | 1 | 2 | 3;
  /** 事件类型 */
  eventType: string;
  /** 金额（USDT） */
  amountUsdt?: number;
  /** 交易/操作类型（用于限额） */
  txType?: 'deposit' | 'withdraw' | 'transfer' | 'trade';
  /** IP 国家 */
  ipCountry?: string;
  /** 用户常用国家 */
  homeCountry?: string;
  /** 收款方国家 */
  counterpartyCountry?: string;
  /** 持仓信息 */
  position?: {
    side: 'long' | 'short';
    entryPrice: number;
    quantity: number;
    leverage: number;
    margin: number;
  };
  /** 24h 内累计提现金额 */
  withdraw24hUsdt?: number;
  /** 24h 内提现笔数 */
  withdraw24hCount?: number;
  /** 业务时间 ISO */
  occurredAt?: ISODate;
  /** 设备指纹 */
  deviceFingerprint?: string;
  /** 自定义 payload */
  payload?: Record<string, unknown>;
}

// ============================================================================
// 默认规则
// ============================================================================

/**
 * 内置规则（按权重升序排列）
 * 热加载后会替换为后端下发的规则
 */
const DEFAULT_RULES: RiskRule[] = [
  {
    id: 'r-aml-large',
    name: '大额交易',
    type: 'large_withdraw',
    enabled: true,
    priority: 10,
    cooldownSeconds: 0,
    action: 'review',
    conditions: [
      { field: 'amountUsdt', operator: 'gte', value: LARGE_TX_THRESHOLD },
    ],
  },
  {
    id: 'r-aml-country',
    name: '高风险国家',
    type: 'aml_alert',
    enabled: true,
    priority: 5,
    cooldownSeconds: 0,
    action: 'block',
    conditions: [
      { field: 'counterpartyCountry', operator: 'in', value: ['KP', 'IR', 'MM'] },
    ],
  },
  {
    id: 'r-limit-exceeded',
    name: '超过限额',
    type: 'large_withdraw',
    enabled: true,
    priority: 1,
    cooldownSeconds: 0,
    action: 'block',
    conditions: [
      { field: 'limitExceeded', operator: 'eq', value: true },
    ],
  },
  {
    id: 'r-freq-withdraw',
    name: '高频提现',
    type: 'aml_alert',
    enabled: true,
    priority: 20,
    cooldownSeconds: 60,
    action: 'review',
    conditions: [
      { field: 'withdraw24hCount', operator: 'gte', value: 5 },
    ],
  },
  {
    id: 'r-ip-anomaly',
    name: 'IP 异常',
    type: 'login_anomaly',
    enabled: true,
    priority: 30,
    cooldownSeconds: 0,
    action: 'review',
    conditions: [
      { field: 'ipAnomaly', operator: 'eq', value: true },
    ],
  },
  {
    id: 'r-position-danger',
    name: '仓位强平风险',
    type: 'position_liquidation',
    enabled: true,
    priority: 2,
    cooldownSeconds: 0,
    action: 'review',
    conditions: [
      { field: 'positionRiskLevel', operator: 'in', value: ['danger', 'liquidatable'] },
    ],
  },
];

// 规则缓存
let RULES: RiskRule[] = [...DEFAULT_RULES];

/** 加载自定义规则（热加载） */
export const loadRules = (rules: RiskRule[]): void => {
  RULES = [...rules].sort((a, b) => a.priority - b.priority);
};

/** 追加规则 */
export const addRule = (rule: RiskRule): void => {
  RULES.push(rule);
  RULES.sort((a, b) => a.priority - b.priority);
};

/** 列出所有规则 */
export const listRules = (): RiskRule[] => [...RULES];

// ============================================================================
// 条件求值
// =====================================================================================

const compare = (a: unknown, op: RiskCondition['operator'], b: unknown): boolean => {
  switch (op) {
    case 'eq':
      return a === b;
    case 'gt':
      return Number(a) > Number(b);
    case 'gte':
      return Number(a) >= Number(b);
    case 'lt':
      return Number(a) < Number(b);
    case 'lte':
      return Number(a) <= Number(b);
    case 'in':
      return Array.isArray(b) && b.includes(a as string);
    case 'between': {
      if (!Array.isArray(b) || b.length !== 2) return false;
      const n = Number(a);
      return n >= Number(b[0]) && n <= Number(b[1]);
    }
    case 'regex':
      return typeof b === 'string' && new RegExp(b).test(String(a));
    default:
      return false;
  }
};

/**
 * 检查规则的每个条件是否全部满足
 */
const ruleMatches = (rule: RiskRule, ctx: Record<string, unknown>): boolean => {
  return rule.conditions.every((c) => {
    const fieldValue = ctx[c.field];
    return compare(fieldValue, c.operator, c.value);
  });
};

// ============================================================================
// 评估
// ============================================================================

/**
 * 评估风控事件
 * 复杂度：O(R * C)，R = 规则数，C = 平均条件数
 */
export const evaluateRisk = async (
  event: RiskEvent | { userId?: ID; type: string; payload?: Record<string, unknown> },
  ctx: EvaluateContext
): Promise<RiskDecision> => {
  if (!ctx || !ctx.userId) {
    throw new RiskError('RISK_NO_CTX', 'Evaluate context with userId is required');
  }

  const start = Date.now();

  // 1) AML 检测
  const amlTx = {
    id: `tx_${Date.now()}_${randomString(4)}`,
    userId: ctx.userId,
    amountUsdt: ctx.amountUsdt ?? 0,
    occurredAt: ctx.occurredAt ?? new Date().toISOString(),
    type: ctx.txType ?? 'withdraw',
    country: ctx.counterpartyCountry,
    ipCountry: ctx.ipCountry,
    userHomeCountry: ctx.homeCountry,
  };
  const amlAlerts = runAmlChecks(amlTx);

  // 2) 限额检查
  let limitExceeded = false;
  if (ctx.amountUsdt && ctx.txType) {
    const { passed } = checkAllLimits(
      ctx.userId,
      ctx.kycLevel,
      ctx.txType === 'deposit' ? 'deposit' : 'withdraw',
      ctx.amountUsdt
    );
    limitExceeded = !passed;
  }

  // 3) 仓位风险
  let positionRiskLevel: string | undefined;
  if (ctx.position) {
    const { calculateMarginRatio } = await import('./positions');
    const res = calculateMarginRatio(
      {
        side: ctx.position.side,
        entryPrice: String(ctx.position.entryPrice),
        quantity: String(ctx.position.quantity),
        leverage: ctx.position.leverage,
        margin: String(ctx.position.margin),
        maintenanceMargin: '0',
      },
      String(ctx.position.entryPrice)
    );
    positionRiskLevel = res.riskLevel;
  }

  // 4) IP 异常
  const ipAnomaly =
    !!ctx.ipCountry && !!ctx.homeCountry && ctx.ipCountry !== ctx.homeCountry;

  // 5) 构造规则求值上下文
  const evalCtx: Record<string, unknown> = {
    amountUsdt: ctx.amountUsdt ?? 0,
    counterpartyCountry: ctx.counterpartyCountry,
    limitExceeded,
    withdraw24hCount: ctx.withdraw24hCount ?? 0,
    ipAnomaly,
    positionRiskLevel,
    ...(event.payload ?? {}),
    ...ctx.payload,
  };

  // 6) 规则求值
  const triggered: RiskDecision['triggered'] = [];
  const notes: string[] = [];
  let totalWeight = 0;
  for (const rule of RULES) {
    if (!rule.enabled) continue;
    if (ruleMatches(rule, evalCtx)) {
      // 权重：按 priority 倒数 + action 因子
      const weight = ruleWeight(rule);
      triggered.push({
        ruleId: rule.id,
        name: rule.name,
        weight,
        reason: `规则 [${rule.name}] 触发 (action=${rule.action})`,
      });
      totalWeight += weight;
      notes.push(`⚠ ${rule.name}: ${describeRule(rule, evalCtx)}`);
    }
  }

  // AML 告警作为额外扣分
  for (const a of amlAlerts) {
    const w = a.level === 'critical' ? 80 : a.level === 'high' ? 60 : 30;
    triggered.push({
      ruleId: a.id,
      name: `AML: ${a.reason}`,
      weight: w,
      reason: a.reason,
    });
    totalWeight += w;
    notes.push(`🚨 AML ${a.level.toUpperCase()}: ${a.reason}`);
  }

  // 7) 决策
  let action: RiskAction = 'allow';
  let score = Math.max(0, 100 - totalWeight);
  if (score < 30) action = 'block';
  else if (score < 80) action = 'review';

  // KYC 等级越低风险越高（基础分调整）
  if (ctx.kycLevel === 0 && (ctx.txType === 'withdraw' || ctx.amountUsdt)) {
    score -= 30;
    notes.push('未完成 KYC 认证');
  } else if (ctx.kycLevel === 1 && (ctx.amountUsdt ?? 0) >= 5000) {
    score -= 10;
    notes.push('Lv.1 KYC，金额较大');
  }

  if (score < 0) score = 0;
  if (score < 30) action = 'block';
  else if (score < 80 && action === 'allow') action = 'review';

  const eventId =
    (event as { id?: string }).id ?? `risk_${Date.now()}_${randomString(6)}`;
  return {
    action,
    score,
    triggered,
    notes,
    evaluatedAt: new Date().toISOString(),
    eventId,
    evaluationTimeMs: Date.now() - start,
  };
};

const ruleWeight = (rule: RiskRule): number => {
  // priority 越小权重越大；review 类规则权重应低于 block
  // 设计上规则与 AML 告警互补，规则提供"软"信号以避免与 AML 硬告警重复计分
  const base = Math.max(1, 100 - rule.priority);
  const actionFactor =
    rule.action === 'block' ? 1.5 : rule.action === 'review' ? 0.1 : 0.05;
  return Math.round(base * actionFactor);
};

const describeRule = (rule: RiskRule, ctx: Record<string, unknown>): string => {
  return rule.conditions
    .map((c) => `${c.field}=${JSON.stringify(ctx[c.field])} ${c.operator} ${JSON.stringify(c.value)}`)
    .join(' AND ');
};

/** 检测单笔是否大额（便捷函数） */
export { detectLargeTransaction };
