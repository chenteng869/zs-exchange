/**
 * Rule Engine Service - 异常体系
 */

import { FjnError, FjnErrorContext } from '../errors';

export const RULE_ERROR_CODES = {
  NOT_FOUND: 'RULE_NOT_FOUND',
  ILLEGAL_TRANSITION: 'RULE_ILLEGAL_TRANSITION',
  DUPLICATE_CODE: 'RULE_DUPLICATE_CODE',
  INVALID_DSL: 'RULE_INVALID_DSL',
  EVALUATION_FAILED: 'RULE_EVALUATION_FAILED',
} as const;

export type FjnRuleErrorCode = (typeof RULE_ERROR_CODES)[keyof typeof RULE_ERROR_CODES];

export class FjnRuleError extends FjnError {
  public readonly ruleErrorCode: FjnRuleErrorCode;

  constructor(code: FjnRuleErrorCode, message: string, context?: FjnErrorContext) {
    super({ code: 'FJN_INTERNAL' as any, message, context });
    (this as { name: string }).name = 'FjnRuleError';
    this.ruleErrorCode = code;
  }
}

export class FjnRuleNotFoundError extends FjnRuleError {
  constructor(ruleId: string) {
    super(RULE_ERROR_CODES.NOT_FOUND, `Rule not found: ${ruleId}`, { ruleId });
    (this as { name: string }).name = 'FjnRuleNotFoundError';
  }
}

export class FjnRuleIllegalTransitionError extends FjnRuleError {
  constructor(from: string, to: string) {
    super(RULE_ERROR_CODES.ILLEGAL_TRANSITION, `Illegal transition: ${from} -> ${to}`, { from, to });
    (this as { name: string }).name = 'FjnRuleIllegalTransitionError';
  }
}

export class FjnRuleInvalidDSLError extends FjnRuleError {
  constructor(message: string, dsl?: unknown) {
    super(RULE_ERROR_CODES.INVALID_DSL, message, { dsl });
    (this as { name: string }).name = 'FjnRuleInvalidDSLError';
  }
}
