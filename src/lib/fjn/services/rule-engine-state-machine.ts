/**
 * Rule Engine Service - 状态机 + 常量 + 校验
 */

export const RULE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  DISABLED: 'disabled',
  DEPRECATED: 'deprecated',
} as const;
export type FjnRuleStatus = (typeof RULE_STATUS)[keyof typeof RULE_STATUS];

export const RULE_STATUS_TRANSITIONS: Record<FjnRuleStatus, readonly FjnRuleStatus[]> = {
  [RULE_STATUS.DRAFT]: [RULE_STATUS.ACTIVE, RULE_STATUS.DISABLED],
  [RULE_STATUS.ACTIVE]: [RULE_STATUS.DISABLED, RULE_STATUS.DEPRECATED],
  [RULE_STATUS.DISABLED]: [RULE_STATUS.ACTIVE, RULE_STATUS.DEPRECATED],
  [RULE_STATUS.DEPRECATED]: [],
} as const;

export function isValidRuleStatus(s: string): s is FjnRuleStatus {
  return Object.values(RULE_STATUS).includes(s as FjnRuleStatus);
}

export function canTransitRuleStatus(from: FjnRuleStatus, to: FjnRuleStatus): boolean {
  return (RULE_STATUS_TRANSITIONS[from] ?? []).includes(to);
}
