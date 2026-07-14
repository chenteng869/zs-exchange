/**
 * FJN Risk Service - 错误体系
 *
 * 严格遵循 H034 + H015 工业级错误规范
 */
import {
  FjnError,
  FjnErrorContext,
  FjnNotFoundError,
  FjnConflictError,
  FjnValidationError,
  FjnBusinessRuleError,
  FjnStateMachineError,
  FjnForbiddenError,
} from '../errors';

export const RISK_ERROR_CODES = {
  // Rule
  RULE_NOT_FOUND: 'RISK_RULE_NOT_FOUND',
  RULE_ALREADY_EXISTS: 'RISK_RULE_ALREADY_EXISTS',
  RULE_NOT_ACTIVE: 'RISK_RULE_NOT_ACTIVE',
  RULE_INVALID_CONFIG: 'RISK_RULE_INVALID_CONFIG',
  RULE_INVALID_LEVEL: 'RISK_RULE_INVALID_LEVEL',
  RULE_INVALID_ACTION: 'RISK_RULE_INVALID_ACTION',
  RULE_DISABLED: 'RISK_RULE_DISABLED',

  // Event
  EVENT_NOT_FOUND: 'RISK_EVENT_NOT_FOUND',
  EVENT_ALREADY_EXISTS: 'RISK_EVENT_ALREADY_EXISTS',
  EVENT_STATUS_INVALID: 'RISK_EVENT_STATUS_INVALID',
  EVENT_NOT_REVIEWABLE: 'RISK_EVENT_NOT_REVIEWABLE',
  EVENT_NOT_RESOLVABLE: 'RISK_EVENT_NOT_RESOLVABLE',
  EVENT_NOT_ESCALABLE: 'RISK_EVENT_NOT_ESCALABLE',
  EVENT_INVALID_SCORE: 'RISK_EVENT_INVALID_SCORE',

  // Case
  CASE_NOT_FOUND: 'RISK_CASE_NOT_FOUND',
  CASE_ALREADY_EXISTS: 'RISK_CASE_ALREADY_EXISTS',
  CASE_STATUS_INVALID: 'RISK_CASE_STATUS_INVALID',
  CASE_NOT_ASSIGNABLE: 'RISK_CASE_NOT_ASSIGNABLE',
  CASE_NOT_RESOLVABLE: 'RISK_CASE_NOT_RESOLVABLE',
  CASE_NOT_CLOSABLE: 'RISK_CASE_NOT_CLOSABLE',
  CASE_NOT_REOPENABLE: 'RISK_CASE_NOT_REOPENABLE',
  CASE_ASSIGNEE_REQUIRED: 'RISK_CASE_ASSIGNEE_REQUIRED',

  // Score
  SCORE_INVALID: 'RISK_SCORE_INVALID',
  SCORE_NEGATIVE: 'RISK_SCORE_NEGATIVE',
  SCORE_TYPE_INVALID: 'RISK_SCORE_TYPE_INVALID',
  SCORE_USER_REQUIRED: 'RISK_SCORE_USER_REQUIRED',

  // Blacklist
  BLACKLIST_NOT_FOUND: 'RISK_BLACKLIST_NOT_FOUND',
  BLACKLIST_ALREADY_EXISTS: 'RISK_BLACKLIST_ALREADY_EXISTS',
  BLACKLIST_CATEGORY_INVALID: 'RISK_BLACKLIST_CATEGORY_INVALID',
  BLACKLIST_VALUE_REQUIRED: 'RISK_BLACKLIST_VALUE_REQUIRED',
  BLACKLIST_NOT_ACTIVE: 'RISK_BLACKLIST_NOT_ACTIVE',
  BLACKLIST_EXPIRED: 'RISK_BLACKLIST_EXPIRED',
  BLACKLIST_TARGET_CHECK_FAILED: 'RISK_BLACKLIST_TARGET_CHECK_FAILED',

  // Device
  DEVICE_NOT_FOUND: 'RISK_DEVICE_NOT_FOUND',
  DEVICE_ALREADY_EXISTS: 'RISK_DEVICE_ALREADY_EXISTS',
  DEVICE_FINGERPRINT_REQUIRED: 'RISK_DEVICE_FINGERPRINT_REQUIRED',
  DEVICE_NOT_NORMAL: 'RISK_DEVICE_NOT_NORMAL',

  // General
  RISK_LEVEL_INVALID: 'RISK_RISK_LEVEL_INVALID',
  RISK_ACTION_INVALID: 'RISK_RISK_ACTION_INVALID',
  RISK_TYPE_INVALID: 'RISK_RISK_TYPE_INVALID',
  REASON_REQUIRED: 'RISK_REASON_REQUIRED',
  REVIEWER_REQUIRED: 'RISK_REVIEWER_REQUIRED',
  RESOLUTION_REQUIRED: 'RISK_RESOLUTION_REQUIRED',
  OPERATOR_REQUIRED: 'RISK_OPERATOR_REQUIRED',
  TARGET_TYPE_INVALID: 'RISK_TARGET_TYPE_INVALID',
  TARGET_ID_REQUIRED: 'RISK_TARGET_ID_REQUIRED',
  EVALUATION_FAILED: 'RISK_EVALUATION_FAILED',
} as const;

export type FjnRiskErrorCode = (typeof RISK_ERROR_CODES)[keyof typeof RISK_ERROR_CODES];
export const ALL_RISK_ERROR_CODES: readonly FjnRiskErrorCode[] = Object.values(RISK_ERROR_CODES);
export const RISK_ERROR_CODE_COUNT = ALL_RISK_ERROR_CODES.length;
export function isFjnRiskErrorCode(code: string): code is FjnRiskErrorCode {
  return ALL_RISK_ERROR_CODES.includes(code as FjnRiskErrorCode);
}

// Rule errors
export class FjnRiskRuleNotFoundError extends FjnNotFoundError {
  constructor(ctx: FjnErrorContext) { super(`风险规则不存在: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskRuleNotFoundError'; }
}
export class FjnRiskRuleAlreadyExistsError extends FjnConflictError {
  constructor(ctx: FjnErrorContext) { super(`风险规则已存在: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskRuleAlreadyExistsError'; }
}
export class FjnRiskRuleNotActiveError extends FjnBusinessRuleError {
  constructor(ctx: FjnErrorContext) { super(`风险规则未启用: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskRuleNotActiveError'; }
}
export class FjnRiskRuleInvalidConfigError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`风险规则配置非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskRuleInvalidConfigError'; }
}
export class FjnRiskRuleInvalidLevelError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`风险规则等级非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskRuleInvalidLevelError'; }
}
export class FjnRiskRuleInvalidActionError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`风险规则动作非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskRuleInvalidActionError'; }
}
export class FjnRiskRuleDisabledError extends FjnBusinessRuleError {
  constructor(ctx: FjnErrorContext) { super(`风险规则已禁用: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskRuleDisabledError'; }
}

// Event errors
export class FjnRiskEventNotFoundError extends FjnNotFoundError {
  constructor(ctx: FjnErrorContext) { super(`风险事件不存在: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskEventNotFoundError'; }
}
export class FjnRiskEventAlreadyExistsError extends FjnConflictError {
  constructor(ctx: FjnErrorContext) { super(`风险事件已存在: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskEventAlreadyExistsError'; }
}
export class FjnRiskEventStatusInvalidError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`风险事件状态非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskEventStatusInvalidError'; }
}
export class FjnRiskEventNotReviewableError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`风险事件不可审核: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskEventNotReviewableError'; }
}
export class FjnRiskEventNotResolvableError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`风险事件不可解决: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskEventNotResolvableError'; }
}
export class FjnRiskEventNotEscalableError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`风险事件不可升级: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskEventNotEscalableError'; }
}
export class FjnRiskEventInvalidScoreError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`风险事件分数非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskEventInvalidScoreError'; }
}

// Case errors
export class FjnRiskCaseNotFoundError extends FjnNotFoundError {
  constructor(ctx: FjnErrorContext) { super(`风险案件不存在: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskCaseNotFoundError'; }
}
export class FjnRiskCaseAlreadyExistsError extends FjnConflictError {
  constructor(ctx: FjnErrorContext) { super(`风险案件已存在: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskCaseAlreadyExistsError'; }
}
export class FjnRiskCaseStatusInvalidError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`风险案件状态非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskCaseStatusInvalidError'; }
}
export class FjnRiskCaseNotAssignableError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`风险案件不可分派: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskCaseNotAssignableError'; }
}
export class FjnRiskCaseNotResolvableError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`风险案件不可解决: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskCaseNotResolvableError'; }
}
export class FjnRiskCaseNotClosableError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`风险案件不可关闭: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskCaseNotClosableError'; }
}
export class FjnRiskCaseNotReopenableError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`风险案件不可重开: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskCaseNotReopenableError'; }
}
export class FjnRiskCaseAssigneeRequiredError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`风险案件受理人必填: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskCaseAssigneeRequiredError'; }
}

// Score errors
export class FjnRiskScoreInvalidError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`风险分数非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskScoreInvalidError'; }
}
export class FjnRiskScoreNegativeError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`风险分数不能为负: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskScoreNegativeError'; }
}
export class FjnRiskScoreTypeInvalidError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`风险分数类型非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskScoreTypeInvalidError'; }
}
export class FjnRiskScoreUserRequiredError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`风险分数用户必填: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskScoreUserRequiredError'; }
}

// Blacklist errors
export class FjnRiskBlacklistNotFoundError extends FjnNotFoundError {
  constructor(ctx: FjnErrorContext) { super(`黑名单记录不存在: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskBlacklistNotFoundError'; }
}
export class FjnRiskBlacklistAlreadyExistsError extends FjnConflictError {
  constructor(ctx: FjnErrorContext) { super(`黑名单记录已存在: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskBlacklistAlreadyExistsError'; }
}
export class FjnRiskBlacklistCategoryInvalidError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`黑名单分类非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskBlacklistCategoryInvalidError'; }
}
export class FjnRiskBlacklistValueRequiredError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`黑名单值必填: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskBlacklistValueRequiredError'; }
}
export class FjnRiskBlacklistNotActiveError extends FjnBusinessRuleError {
  constructor(ctx: FjnErrorContext) { super(`黑名单记录未激活: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskBlacklistNotActiveError'; }
}
export class FjnRiskBlacklistExpiredError extends FjnBusinessRuleError {
  constructor(ctx: FjnErrorContext) { super(`黑名单记录已过期: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskBlacklistExpiredError'; }
}
export class FjnRiskBlacklistTargetCheckFailedError extends FjnForbiddenError {
  constructor(ctx: FjnErrorContext) { super(`目标命中黑名单: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskBlacklistTargetCheckFailedError'; }
}

// Device errors
export class FjnRiskDeviceNotFoundError extends FjnNotFoundError {
  constructor(ctx: FjnErrorContext) { super(`设备指纹不存在: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskDeviceNotFoundError'; }
}
export class FjnRiskDeviceAlreadyExistsError extends FjnConflictError {
  constructor(ctx: FjnErrorContext) { super(`设备指纹已存在: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskDeviceAlreadyExistsError'; }
}
export class FjnRiskDeviceFingerprintRequiredError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`设备指纹必填: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskDeviceFingerprintRequiredError'; }
}
export class FjnRiskDeviceNotNormalError extends FjnBusinessRuleError {
  constructor(ctx: FjnErrorContext) { super(`设备状态非 normal: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskDeviceNotNormalError'; }
}

// General errors
export class FjnRiskLevelInvalidError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`风险等级非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskLevelInvalidError'; }
}
export class FjnRiskActionInvalidError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`风险动作非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskActionInvalidError'; }
}
export class FjnRiskTypeInvalidError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`风险类型非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskTypeInvalidError'; }
}
export class FjnRiskReasonRequiredError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`原因必填: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskReasonRequiredError'; }
}
export class FjnRiskReviewerRequiredError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`审核人必填: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskReviewerRequiredError'; }
}
export class FjnRiskResolutionRequiredError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`处理结果必填: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskResolutionRequiredError'; }
}
export class FjnRiskOperatorRequiredError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`操作人必填: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskOperatorRequiredError'; }
}
export class FjnRiskTargetTypeInvalidError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`目标类型非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskTargetTypeInvalidError'; }
}
export class FjnRiskTargetIdRequiredError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`目标 ID 必填: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskTargetIdRequiredError'; }
}
export class FjnRiskEvaluationFailedError extends FjnBusinessRuleError {
  constructor(ctx: FjnErrorContext) { super(`风险评估失败: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnRiskEvaluationFailedError'; }
}

export function getRiskErrorCodeCount(): number { return RISK_ERROR_CODE_COUNT; }
export function isFjnRiskError(e: unknown): boolean {
  if (e instanceof FjnError) return e.name.startsWith('FjnRisk');
  return false;
}
