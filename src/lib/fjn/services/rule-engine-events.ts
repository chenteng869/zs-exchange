/**
 * Rule Engine Service - 事件常量
 */

export const RULE_EVENT = {
  RULE_REGISTERED: 'rule.registered',
  RULE_UPDATED: 'rule.updated',
  RULE_ACTIVATED: 'rule.activated',
  RULE_DISABLED: 'rule.disabled',
  RULE_DEPRECATED: 'rule.deprecated',
  RULE_EVALUATED: 'rule.evaluated',
} as const;
export type FjnRuleEventType = (typeof RULE_EVENT)[keyof typeof RULE_EVENT];
