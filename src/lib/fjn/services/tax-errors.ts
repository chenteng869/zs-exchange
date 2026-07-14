/**
 * FJN Tax Service - 错误体系
 *
 * 严格遵循 H033 + H015 工业级错误规范
 */
import {
  FjnError,
  FjnErrorContext,
  FjnNotFoundError,
  FjnConflictError,
  FjnValidationError,
  FjnBusinessRuleError,
  FjnStateMachineError,
} from '../errors';

export const TAX_ERROR_CODES = {
  // Rule
  RULE_NOT_FOUND: 'TAX_RULE_NOT_FOUND',
  RULE_ALREADY_EXISTS: 'TAX_RULE_ALREADY_EXISTS',
  RULE_NOT_ACTIVE: 'TAX_RULE_NOT_ACTIVE',
  RULE_INVALID_RATE: 'TAX_RULE_INVALID_RATE',
  RULE_EFFECTIVE_INVALID: 'TAX_RULE_EFFECTIVE_INVALID',
  RULE_ARCHIVED: 'TAX_RULE_ARCHIVED',

  // Record
  RECORD_NOT_FOUND: 'TAX_RECORD_NOT_FOUND',
  RECORD_ALREADY_EXISTS: 'TAX_RECORD_ALREADY_EXISTS',
  RECORD_STATUS_INVALID: 'TAX_RECORD_STATUS_INVALID',
  RECORD_NOT_PAYABLE: 'TAX_RECORD_NOT_PAYABLE',
  RECORD_NOT_ADJUSTABLE: 'TAX_RECORD_NOT_ADJUSTABLE',
  RECORD_NOT_REVERSIBLE: 'TAX_RECORD_NOT_REVERSIBLE',
  RECORD_TAXABLE_INVALID: 'TAX_RECORD_TAXABLE_INVALID',
  RECORD_TAX_AMOUNT_INVALID: 'TAX_RECORD_TAX_AMOUNT_INVALID',
  RECORD_TAX_RATE_MISMATCH: 'TAX_RECORD_TAX_RATE_MISMATCH',

  // Calculation
  AMOUNT_INVALID: 'TAX_AMOUNT_INVALID',
  CURRENCY_MISMATCH: 'TAX_CURRENCY_MISMATCH',
  RATE_INVALID: 'TAX_RATE_INVALID',
  MODE_INVALID: 'TAX_MODE_INVALID',

  // Report
  REPORT_NOT_FOUND: 'TAX_REPORT_NOT_FOUND',
  REPORT_ALREADY_EXISTS: 'TAX_REPORT_ALREADY_EXISTS',
  REPORT_STATUS_INVALID: 'TAX_REPORT_STATUS_INVALID',
  REPORT_NOT_SUBMITTABLE: 'TAX_REPORT_NOT_SUBMITTABLE',
  REPORT_NOT_PAYABLE: 'TAX_REPORT_NOT_PAYABLE',
  REPORT_PERIOD_INVALID: 'TAX_REPORT_PERIOD_INVALID',
  REPORT_NO_RECORDS: 'TAX_REPORT_NO_RECORDS',
  REPORT_SUBMISSION_FAILED: 'TAX_REPORT_SUBMISSION_FAILED',

  // General
  COUNTRY_NOT_SUPPORTED: 'TAX_COUNTRY_NOT_SUPPORTED',
  REGION_NOT_SUPPORTED: 'TAX_REGION_NOT_SUPPORTED',
  RULE_CODE_REQUIRED: 'TAX_RULE_CODE_REQUIRED',
  TAX_TYPE_REQUIRED: 'TAX_TAX_TYPE_REQUIRED',
  CURRENCY_REQUIRED: 'TAX_CURRENCY_REQUIRED',
  REASON_REQUIRED: 'TAX_REASON_REQUIRED',
  APPROVER_REQUIRED: 'TAX_APPROVER_REQUIRED',
} as const;

export type FjnTaxErrorCode = (typeof TAX_ERROR_CODES)[keyof typeof TAX_ERROR_CODES];
export const ALL_TAX_ERROR_CODES: readonly FjnTaxErrorCode[] = Object.values(TAX_ERROR_CODES);
export const TAX_ERROR_CODE_COUNT = ALL_TAX_ERROR_CODES.length;
export function isFjnTaxErrorCode(code: string): code is FjnTaxErrorCode {
  return ALL_TAX_ERROR_CODES.includes(code as FjnTaxErrorCode);
}

// Rule errors
export class FjnTaxRuleNotFoundError extends FjnNotFoundError {
  constructor(ctx: FjnErrorContext) { super(`税务规则不存在: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRuleNotFoundError'; }
}
export class FjnTaxRuleAlreadyExistsError extends FjnConflictError {
  constructor(ctx: FjnErrorContext) { super(`税务规则已存在: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRuleAlreadyExistsError'; }
}
export class FjnTaxRuleNotActiveError extends FjnBusinessRuleError {
  constructor(ctx: FjnErrorContext) { super(`税务规则未激活: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRuleNotActiveError'; }
}
export class FjnTaxRuleInvalidRateError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`税务规则税率非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRuleInvalidRateError'; }
}
export class FjnTaxRuleEffectiveInvalidError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`税务规则生效期非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRuleEffectiveInvalidError'; }
}
export class FjnTaxRuleArchivedError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`税务规则已归档: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRuleArchivedError'; }
}

// Record errors
export class FjnTaxRecordNotFoundError extends FjnNotFoundError {
  constructor(ctx: FjnErrorContext) { super(`税务记录不存在: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRecordNotFoundError'; }
}
export class FjnTaxRecordAlreadyExistsError extends FjnConflictError {
  constructor(ctx: FjnErrorContext) { super(`税务记录已存在: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRecordAlreadyExistsError'; }
}
export class FjnTaxRecordStatusInvalidError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`税务记录状态非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRecordStatusInvalidError'; }
}
export class FjnTaxRecordNotPayableError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`税务记录不可支付: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRecordNotPayableError'; }
}
export class FjnTaxRecordNotAdjustableError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`税务记录不可调整: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRecordNotAdjustableError'; }
}
export class FjnTaxRecordNotReversibleError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`税务记录不可冲销: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRecordNotReversibleError'; }
}
export class FjnTaxRecordTaxableInvalidError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`税务记录应税金额非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRecordTaxableInvalidError'; }
}
export class FjnTaxRecordTaxAmountInvalidError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`税务记录税额非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRecordTaxAmountInvalidError'; }
}
export class FjnTaxRecordTaxRateMismatchError extends FjnBusinessRuleError {
  constructor(ctx: FjnErrorContext) { super(`税务记录税率不匹配: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRecordTaxRateMismatchError'; }
}

// Calculation errors
export class FjnTaxAmountInvalidError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`金额非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxAmountInvalidError'; }
}
export class FjnTaxCurrencyMismatchError extends FjnBusinessRuleError {
  constructor(ctx: FjnErrorContext) { super(`币种不匹配: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxCurrencyMismatchError'; }
}
export class FjnTaxRateInvalidError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`税率非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRateInvalidError'; }
}
export class FjnTaxModeInvalidError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`税务模式非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxModeInvalidError'; }
}

// Report errors
export class FjnTaxReportNotFoundError extends FjnNotFoundError {
  constructor(ctx: FjnErrorContext) { super(`税务报表不存在: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxReportNotFoundError'; }
}
export class FjnTaxReportAlreadyExistsError extends FjnConflictError {
  constructor(ctx: FjnErrorContext) { super(`税务报表已存在: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxReportAlreadyExistsError'; }
}
export class FjnTaxReportStatusInvalidError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`税务报表状态非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxReportStatusInvalidError'; }
}
export class FjnTaxReportNotSubmittableError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`税务报表不可提交: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxReportNotSubmittableError'; }
}
export class FjnTaxReportNotPayableError extends FjnStateMachineError {
  constructor(ctx: FjnErrorContext) { super(`税务报表不可支付: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxReportNotPayableError'; }
}
export class FjnTaxReportPeriodInvalidError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`税务报表周期非法: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxReportPeriodInvalidError'; }
}
export class FjnTaxReportNoRecordsError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`税务报表无记录: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxReportNoRecordsError'; }
}
export class FjnTaxReportSubmissionFailedError extends FjnBusinessRuleError {
  constructor(ctx: FjnErrorContext) { super(`税务报表提交失败: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxReportSubmissionFailedError'; }
}

// General
export class FjnTaxCountryNotSupportedError extends FjnBusinessRuleError {
  constructor(ctx: FjnErrorContext) { super(`国家不支持: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxCountryNotSupportedError'; }
}
export class FjnTaxRegionNotSupportedError extends FjnBusinessRuleError {
  constructor(ctx: FjnErrorContext) { super(`地区不支持: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRegionNotSupportedError'; }
}
export class FjnTaxRuleCodeRequiredError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`税务规则编码必填: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxRuleCodeRequiredError'; }
}
export class FjnTaxTypeRequiredError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`税种必填: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxTypeRequiredError'; }
}
export class FjnTaxCurrencyRequiredError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`币种必填: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxCurrencyRequiredError'; }
}
export class FjnTaxReasonRequiredError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`原因必填: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxReasonRequiredError'; }
}
export class FjnTaxApproverRequiredError extends FjnValidationError {
  constructor(ctx: FjnErrorContext) { super(`审核人必填: ${JSON.stringify(ctx)}`, ctx); this.name = 'FjnTaxApproverRequiredError'; }
}

export function getTaxErrorCodeCount(): number { return TAX_ERROR_CODE_COUNT; }
export function isFjnTaxError(e: unknown): boolean {
  if (e instanceof FjnError) return e.name.startsWith('FjnTax');
  return false;
}
