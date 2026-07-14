/**
 * FJN Risk Service - 状态机
 *
 * 严格遵循 H034 + H015 工业级状态机规范：
 *  - 风险事件 (FjnRiskEvent) 状态机：open | reviewing | resolved | escalated
 *  - 风险案件 (FjnRiskCase) 状态机：open | investigating | resolved | escalated | closed
 *  - 风险等级枚举：low | medium | high | critical
 *  - 风险动作枚举：pass | warning | manual_review | limit | freeze_asset | freeze_account | reject | recover | blacklist
 *  - 黑名单状态：active | expired | removed
 *  - 设备状态：normal | suspicious | blocked
 *
 * 设计原则：
 *  - 状态机基于白名单，禁止隐式跳转
 *  - 终态明确：resolved / closed / rejected
 *  - escalated 状态可回到 investigating 或 resolved
 *  - 案件可以重新打开（closed -> open）
 */

import { FjnStateMachineError } from '../errors';

// ============================================================
// 1. 风险事件状态
// ============================================================

export const RISK_EVENT_STATUS = {
  OPEN: 'open',
  REVIEWING: 'reviewing',
  RESOLVED: 'resolved',
  ESCALATED: 'escalated',
} as const;

export type FjnRiskEventStatus = (typeof RISK_EVENT_STATUS)[keyof typeof RISK_EVENT_STATUS];

export const ALL_RISK_EVENT_STATUSES: readonly FjnRiskEventStatus[] = [
  RISK_EVENT_STATUS.OPEN,
  RISK_EVENT_STATUS.REVIEWING,
  RISK_EVENT_STATUS.RESOLVED,
  RISK_EVENT_STATUS.ESCALATED,
] as const;

export const TERMINAL_RISK_EVENT_STATUSES: readonly FjnRiskEventStatus[] = [
  RISK_EVENT_STATUS.RESOLVED,
] as const;

export const RISK_EVENT_STATUS_TRANSITIONS: Record<FjnRiskEventStatus, readonly FjnRiskEventStatus[]> = {
  [RISK_EVENT_STATUS.OPEN]: [
    RISK_EVENT_STATUS.REVIEWING,
    RISK_EVENT_STATUS.RESOLVED,
    RISK_EVENT_STATUS.ESCALATED,
  ],
  [RISK_EVENT_STATUS.REVIEWING]: [
    RISK_EVENT_STATUS.RESOLVED,
    RISK_EVENT_STATUS.ESCALATED,
  ],
  [RISK_EVENT_STATUS.ESCALATED]: [
    RISK_EVENT_STATUS.REVIEWING,
    RISK_EVENT_STATUS.RESOLVED,
  ],
  [RISK_EVENT_STATUS.RESOLVED]: [],
} as const;

// ============================================================
// 2. 风险案件状态
// ============================================================

export const RISK_CASE_STATUS = {
  OPEN: 'open',
  INVESTIGATING: 'investigating',
  ESCALATED: 'escalated',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export type FjnRiskCaseStatus = (typeof RISK_CASE_STATUS)[keyof typeof RISK_CASE_STATUS];

export const ALL_RISK_CASE_STATUSES: readonly FjnRiskCaseStatus[] = [
  RISK_CASE_STATUS.OPEN,
  RISK_CASE_STATUS.INVESTIGATING,
  RISK_CASE_STATUS.ESCALATED,
  RISK_CASE_STATUS.RESOLVED,
  RISK_CASE_STATUS.CLOSED,
] as const;

export const TERMINAL_RISK_CASE_STATUSES: readonly FjnRiskCaseStatus[] = [
  RISK_CASE_STATUS.RESOLVED,
  RISK_CASE_STATUS.CLOSED,
] as const;

export const RISK_CASE_STATUS_TRANSITIONS: Record<FjnRiskCaseStatus, readonly FjnRiskCaseStatus[]> = {
  [RISK_CASE_STATUS.OPEN]: [
    RISK_CASE_STATUS.INVESTIGATING,
    RISK_CASE_STATUS.ESCALATED,
    RISK_CASE_STATUS.CLOSED,
  ],
  [RISK_CASE_STATUS.INVESTIGATING]: [
    RISK_CASE_STATUS.ESCALATED,
    RISK_CASE_STATUS.RESOLVED,
    RISK_CASE_STATUS.CLOSED,
  ],
  [RISK_CASE_STATUS.ESCALATED]: [
    RISK_CASE_STATUS.INVESTIGATING,
    RISK_CASE_STATUS.RESOLVED,
    RISK_CASE_STATUS.CLOSED,
  ],
  [RISK_CASE_STATUS.RESOLVED]: [RISK_CASE_STATUS.CLOSED],
  [RISK_CASE_STATUS.CLOSED]: [RISK_CASE_STATUS.OPEN], // 案件可重新打开
} as const;

// ============================================================
// 3. 风险等级
// ============================================================

export const RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type FjnRiskLevel = (typeof RISK_LEVEL)[keyof typeof RISK_LEVEL];

export const ALL_RISK_LEVELS: readonly FjnRiskLevel[] = Object.values(RISK_LEVEL);

// 风险等级数值映射（用于分数聚合）
export const RISK_LEVEL_SCORE: Record<FjnRiskLevel, number> = {
  [RISK_LEVEL.LOW]: 10,
  [RISK_LEVEL.MEDIUM]: 30,
  [RISK_LEVEL.HIGH]: 60,
  [RISK_LEVEL.CRITICAL]: 100,
} as const;

// ============================================================
// 4. 风险动作
// ============================================================

export const RISK_ACTION = {
  PASS: 'pass',
  WARNING: 'warning',
  MANUAL_REVIEW: 'manual_review',
  LIMIT: 'limit',
  FREEZE_ASSET: 'freeze_asset',
  FREEZE_ACCOUNT: 'freeze_account',
  REJECT: 'reject',
  RECOVER: 'recover',
  BLACKLIST: 'blacklist',
} as const;

export type FjnRiskAction = (typeof RISK_ACTION)[keyof typeof RISK_ACTION];

export const ALL_RISK_ACTIONS: readonly FjnRiskAction[] = Object.values(RISK_ACTION);

// ============================================================
// 5. 风险类型
// ============================================================

export const RISK_TYPE = {
  SELF_REFERRAL: 'self_referral',
  CYCLE_REFERRAL: 'cycle_referral',
  MULTI_ACCOUNT: 'multi_account',
  SAME_DEVICE: 'same_device',
  ABNORMAL_IP: 'abnormal_ip',
  ABNORMAL_PAYMENT: 'abnormal_payment',
  REFUND_ARBITRAGE: 'refund_arbitrage',
  POINTS_FARMING: 'points_farming',
  POWER_FARMING: 'power_farming',
  TPOINTS_WASH: 'tpoints_wash',
  NFT_ABNORMAL: 'nft_abnormal',
  MALL_FAKE: 'mall_fake',
  VIRTUAL_POINTS_FARMING: 'virtual_points_farming',
  GAMING_ABNORMAL: 'gaming_abnormal',
  PROMOTION_VIOLATION: 'promotion_violation',
  NODE_VIOLATION: 'node_violation',
  ADMIN_ABNORMAL: 'admin_abnormal',
} as const;

export type FjnRiskType = (typeof RISK_TYPE)[keyof typeof RISK_TYPE];

export const ALL_RISK_TYPES: readonly FjnRiskType[] = Object.values(RISK_TYPE);

// ============================================================
// 6. 评分类型
// ============================================================

export const RISK_SCORE_TYPE = {
  USER: 'user',
  ORDER: 'order',
  PAYMENT: 'payment',
  DEVICE: 'device',
  IP: 'ip',
} as const;

export type FjnRiskScoreType = (typeof RISK_SCORE_TYPE)[keyof typeof RISK_SCORE_TYPE];

export const ALL_RISK_SCORE_TYPES: readonly FjnRiskScoreType[] = Object.values(RISK_SCORE_TYPE);

// ============================================================
// 7. 黑名单分类
// ============================================================

export const BLACKLIST_CATEGORY = {
  USER: 'user',
  DEVICE: 'device',
  IP: 'ip',
  WALLET: 'wallet',
  EMAIL: 'email',
  PHONE: 'phone',
} as const;

export type FjnBlacklistCategory = (typeof BLACKLIST_CATEGORY)[keyof typeof BLACKLIST_CATEGORY];

export const ALL_BLACKLIST_CATEGORIES: readonly FjnBlacklistCategory[] = Object.values(BLACKLIST_CATEGORY);

// ============================================================
// 8. 黑名单来源
// ============================================================

export const BLACKLIST_SOURCE = {
  MANUAL: 'manual',
  AUTO: 'auto',
  SYSTEM: 'system',
} as const;

export type FjnBlacklistSource = (typeof BLACKLIST_SOURCE)[keyof typeof BLACKLIST_SOURCE];

// ============================================================
// 9. 工具函数
// ============================================================

export function isTerminalRiskEventStatus(s: FjnRiskEventStatus): boolean {
  return TERMINAL_RISK_EVENT_STATUSES.includes(s);
}
export function isTerminalRiskCaseStatus(s: FjnRiskCaseStatus): boolean {
  return TERMINAL_RISK_CASE_STATUSES.includes(s);
}

export function canTransitRiskEventStatus(from: FjnRiskEventStatus, to: FjnRiskEventStatus): boolean {
  return RISK_EVENT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
export function canTransitRiskCaseStatus(from: FjnRiskCaseStatus, to: FjnRiskCaseStatus): boolean {
  return RISK_CASE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitRiskEventStatus(from: FjnRiskEventStatus, to: FjnRiskEventStatus): void {
  if (!canTransitRiskEventStatus(from, to)) {
    throw new FjnStateMachineError(`非法风险事件状态转移: ${from} -> ${to}`, {
      from,
      to,
      allowedNext: RISK_EVENT_STATUS_TRANSITIONS[from],
    });
  }
}
export function assertTransitRiskCaseStatus(from: FjnRiskCaseStatus, to: FjnRiskCaseStatus): void {
  if (!canTransitRiskCaseStatus(from, to)) {
    throw new FjnStateMachineError(`非法风险案件状态转移: ${from} -> ${to}`, {
      from,
      to,
      allowedNext: RISK_CASE_STATUS_TRANSITIONS[from],
    });
  }
}

export function nextRiskEventStatuses(from: FjnRiskEventStatus): readonly FjnRiskEventStatus[] {
  return RISK_EVENT_STATUS_TRANSITIONS[from] ?? [];
}
export function nextRiskCaseStatuses(from: FjnRiskCaseStatus): readonly FjnRiskCaseStatus[] {
  return RISK_CASE_STATUS_TRANSITIONS[from] ?? [];
}

/** 风险事件可审核 */
export function isRiskEventReviewable(s: FjnRiskEventStatus): boolean {
  return s === RISK_EVENT_STATUS.OPEN || s === RISK_EVENT_STATUS.REVIEWING;
}
/** 风险事件可解决 */
export function isRiskEventResolvable(s: FjnRiskEventStatus): boolean {
  return s === RISK_EVENT_STATUS.OPEN || s === RISK_EVENT_STATUS.REVIEWING || s === RISK_EVENT_STATUS.ESCALATED;
}
/** 风险事件可升级 */
export function isRiskEventEscalable(s: FjnRiskEventStatus): boolean {
  return s === RISK_EVENT_STATUS.OPEN || s === RISK_EVENT_STATUS.REVIEWING;
}
/** 风险案件可分派 */
export function isRiskCaseAssignable(s: FjnRiskCaseStatus): boolean {
  return s === RISK_CASE_STATUS.OPEN || s === RISK_CASE_STATUS.INVESTIGATING;
}
/** 风险案件可解决 */
export function isRiskCaseResolvable(s: FjnRiskCaseStatus): boolean {
  return s !== RISK_CASE_STATUS.RESOLVED && s !== RISK_CASE_STATUS.CLOSED;
}

/** 根据分数自动推导风险等级 */
export function deriveRiskLevelFromScore(score: number): FjnRiskLevel {
  if (score >= 80) return RISK_LEVEL.CRITICAL;
  if (score >= 50) return RISK_LEVEL.HIGH;
  if (score >= 20) return RISK_LEVEL.MEDIUM;
  return RISK_LEVEL.LOW;
}
