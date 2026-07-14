/**
 * FJN Finance Service - 错误体系
 *
 * 严格遵循 H032 §3 + H015 工业级错误规范：
 *  - 错误码使用 FINANCE_xxx 命名
 *  - 错误码分组：账户(ACCOUNT_*) + 流水(LEDGER_*) + 结算(SETTLEMENT_*) + 业务规则
 *  - 每个错误对应一个语义化异常类
 *  - 异常继承自 FjnError，附加 httpStatus + context
 *
 * 用法：
 *   import { FjnFinanceAccountNotFoundError, isFjnFinanceErrorCode } from './finance-errors';
 *   if (!account) throw new FjnFinanceAccountNotFoundError({ accountId });
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

// ============================================================
// 1. 错误码定义
// ============================================================

export const FINANCE_ERROR_CODES = {
  // ---------- 账户 ----------
  ACCOUNT_NOT_FOUND: 'FINANCE_ACCOUNT_NOT_FOUND',
  ACCOUNT_ALREADY_EXISTS: 'FINANCE_ACCOUNT_ALREADY_EXISTS',
  ACCOUNT_FROZEN: 'FINANCE_ACCOUNT_FROZEN',
  ACCOUNT_CLOSED: 'FINANCE_ACCOUNT_CLOSED',
  ACCOUNT_STATUS_INVALID: 'FINANCE_ACCOUNT_STATUS_INVALID',
  ACCOUNT_TYPE_INVALID: 'FINANCE_ACCOUNT_TYPE_INVALID',
  ACCOUNT_BALANCE_NEGATIVE: 'FINANCE_ACCOUNT_BALANCE_NEGATIVE',

  // ---------- 流水 ----------
  LEDGER_NOT_FOUND: 'FINANCE_LEDGER_NOT_FOUND',
  LEDGER_ALREADY_REVERSED: 'FINANCE_LEDGER_ALREADY_REVERSED',
  LEDGER_ALREADY_VOIDED: 'FINANCE_LEDGER_ALREADY_VOIDED',
  LEDGER_AMOUNT_INVALID: 'FINANCE_LEDGER_AMOUNT_INVALID',
  LEDGER_AMOUNT_NEGATIVE: 'FINANCE_LEDGER_AMOUNT_NEGATIVE',
  LEDGER_AMOUNT_ZERO: 'FINANCE_LEDGER_AMOUNT_ZERO',
  LEDGER_DIRECTION_INVALID: 'FINANCE_LEDGER_DIRECTION_INVALID',
  LEDGER_BALANCE_MISMATCH: 'FINANCE_LEDGER_BALANCE_MISMATCH',
  LEDGER_CURRENCY_MISMATCH: 'FINANCE_LEDGER_CURRENCY_MISMATCH',
  LEDGER_SOURCE_INVALID: 'FINANCE_LEDGER_SOURCE_INVALID',
  LEDGER_REVERSE_NOT_ALLOWED: 'FINANCE_LEDGER_REVERSE_NOT_ALLOWED',

  // ---------- 结算单 ----------
  SETTLEMENT_NOT_FOUND: 'FINANCE_SETTLEMENT_NOT_FOUND',
  SETTLEMENT_ALREADY_EXISTS: 'FINANCE_SETTLEMENT_ALREADY_EXISTS',
  SETTLEMENT_STATUS_INVALID: 'FINANCE_SETTLEMENT_STATUS_INVALID',
  SETTLEMENT_NOT_APPROVABLE: 'FINANCE_SETTLEMENT_NOT_APPROVABLE',
  SETTLEMENT_NOT_PAYABLE: 'FINANCE_SETTLEMENT_NOT_PAYABLE',
  SETTLEMENT_NOT_CANCELLABLE: 'FINANCE_SETTLEMENT_NOT_CANCELLABLE',
  SETTLEMENT_AMOUNT_INVALID: 'FINANCE_SETTLEMENT_AMOUNT_INVALID',
  SETTLEMENT_PERIOD_INVALID: 'FINANCE_SETTLEMENT_PERIOD_INVALID',
  SETTLEMENT_NO_ITEMS: 'FINANCE_SETTLEMENT_NO_ITEMS',
  SETTLEMENT_ALREADY_PAID: 'FINANCE_SETTLEMENT_ALREADY_PAID',

  // ---------- 结算条目 ----------
  SETTLEMENT_ITEM_NOT_FOUND: 'FINANCE_SETTLEMENT_ITEM_NOT_FOUND',
  SETTLEMENT_ITEM_NOT_PAYABLE: 'FINANCE_SETTLEMENT_ITEM_NOT_PAYABLE',
  SETTLEMENT_ITEM_NOT_RETRIABLE: 'FINANCE_SETTLEMENT_ITEM_NOT_RETRIABLE',
  SETTLEMENT_ITEM_BANK_INFO_REQUIRED: 'FINANCE_SETTLEMENT_ITEM_BANK_INFO_REQUIRED',
  SETTLEMENT_ITEM_AMOUNT_INVALID: 'FINANCE_SETTLEMENT_ITEM_AMOUNT_INVALID',

  // ---------- 通用业务规则 ----------
  AMOUNT_INVALID: 'FINANCE_AMOUNT_INVALID',
  CURRENCY_MISMATCH: 'FINANCE_CURRENCY_MISMATCH',
  CURRENCY_NOT_SUPPORTED: 'FINANCE_CURRENCY_NOT_SUPPORTED',
  APPROVER_REQUIRED: 'FINANCE_APPROVER_REQUIRED',
  OPERATOR_REQUIRED: 'FINANCE_OPERATOR_REQUIRED',
  REASON_REQUIRED: 'FINANCE_REASON_REQUIRED',
  PERIOD_LOCKED: 'FINANCE_PERIOD_LOCKED',
  DAILY_LIMIT_EXCEEDED: 'FINANCE_DAILY_LIMIT_EXCEEDED',

  // ---------- 369 收入确认 ----------
  REVENUE_369_AMOUNT_MISMATCH: 'FINANCE_REVENUE_369_AMOUNT_MISMATCH',
  REVENUE_369_ORDER_REQUIRED: 'FINANCE_REVENUE_369_ORDER_REQUIRED',
  REVENUE_369_RULE_VERSION_INVALID: 'FINANCE_REVENUE_369_RULE_VERSION_INVALID',
  REVENUE_369_POOLS_NOT_INITIALIZED: 'FINANCE_REVENUE_369_POOLS_NOT_INITIALIZED',

  // ---------- 报表 ----------
  REPORT_PERIOD_INVALID: 'FINANCE_REPORT_PERIOD_INVALID',
  REPORT_NOT_FOUND: 'FINANCE_REPORT_NOT_FOUND',
} as const;

export type FjnFinanceErrorCode =
  (typeof FINANCE_ERROR_CODES)[keyof typeof FINANCE_ERROR_CODES];

/** 所有 Finance 错误码 */
export const ALL_FINANCE_ERROR_CODES: readonly FjnFinanceErrorCode[] = Object.values(
  FINANCE_ERROR_CODES,
);

/** Finance 错误码总数 */
export const FINANCE_ERROR_CODE_COUNT = ALL_FINANCE_ERROR_CODES.length;

/** 判断字符串是否为合法的 Finance 错误码 */
export function isFjnFinanceErrorCode(code: string): code is FjnFinanceErrorCode {
  return ALL_FINANCE_ERROR_CODES.includes(code as FjnFinanceErrorCode);
}

// ============================================================
// 2. 账户错误类
// ============================================================

export class FjnFinanceAccountNotFoundError extends FjnNotFoundError {
  constructor(context: FjnErrorContext) {
    super(`财务账户不存在: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceAccountNotFoundError';
  }
}

export class FjnFinanceAccountAlreadyExistsError extends FjnConflictError {
  constructor(context: FjnErrorContext) {
    super(`财务账户已存在: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceAccountAlreadyExistsError';
  }
}

export class FjnFinanceAccountFrozenError extends FjnBusinessRuleError {
  constructor(context: FjnErrorContext) {
    super(`财务账户已冻结，无法操作`, context);
    this.name = 'FjnFinanceAccountFrozenError';
  }
}

export class FjnFinanceAccountClosedError extends FjnBusinessRuleError {
  constructor(context: FjnErrorContext) {
    super(`财务账户已关闭，无法操作`, context);
    this.name = 'FjnFinanceAccountClosedError';
  }
}

export class FjnFinanceAccountStatusInvalidError extends FjnStateMachineError {
  constructor(context: FjnErrorContext) {
    super(`财务账户状态非法: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceAccountStatusInvalidError';
  }
}

export class FjnFinanceAccountTypeInvalidError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`财务账户类型非法: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceAccountTypeInvalidError';
  }
}

export class FjnFinanceAccountBalanceNegativeError extends FjnBusinessRuleError {
  constructor(context: FjnErrorContext) {
    super(`财务账户余额不可为负: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceAccountBalanceNegativeError';
  }
}

// ============================================================
// 3. 流水错误类
// ============================================================

export class FjnFinanceLedgerNotFoundError extends FjnNotFoundError {
  constructor(context: FjnErrorContext) {
    super(`财务流水不存在: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceLedgerNotFoundError';
  }
}

export class FjnFinanceLedgerAlreadyReversedError extends FjnConflictError {
  constructor(context: FjnErrorContext) {
    super(`财务流水已冲销: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceLedgerAlreadyReversedError';
  }
}

export class FjnFinanceLedgerAlreadyVoidedError extends FjnConflictError {
  constructor(context: FjnErrorContext) {
    super(`财务流水已作废: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceLedgerAlreadyVoidedError';
  }
}

export class FjnFinanceLedgerAmountInvalidError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`财务流水金额非法: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceLedgerAmountInvalidError';
  }
}

export class FjnFinanceLedgerAmountNegativeError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`财务流水金额不可为负: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceLedgerAmountNegativeError';
  }
}

export class FjnFinanceLedgerAmountZeroError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`财务流水金额不能为 0: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceLedgerAmountZeroError';
  }
}

export class FjnFinanceLedgerDirectionInvalidError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`财务流水方向非法: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceLedgerDirectionInvalidError';
  }
}

export class FjnFinanceLedgerBalanceMismatchError extends FjnBusinessRuleError {
  constructor(context: FjnErrorContext) {
    super(`财务流水余额不匹配: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceLedgerBalanceMismatchError';
  }
}

export class FjnFinanceLedgerCurrencyMismatchError extends FjnBusinessRuleError {
  constructor(context: FjnErrorContext) {
    super(`财务流水币种不匹配: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceLedgerCurrencyMismatchError';
  }
}

export class FjnFinanceLedgerSourceInvalidError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`财务流水来源非法: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceLedgerSourceInvalidError';
  }
}

export class FjnFinanceLedgerReverseNotAllowedError extends FjnBusinessRuleError {
  constructor(context: FjnErrorContext) {
    super(`财务流水不允许冲销: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceLedgerReverseNotAllowedError';
  }
}

// ============================================================
// 4. 结算单错误类
// ============================================================

export class FjnFinanceSettlementNotFoundError extends FjnNotFoundError {
  constructor(context: FjnErrorContext) {
    super(`结算单不存在: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceSettlementNotFoundError';
  }
}

export class FjnFinanceSettlementAlreadyExistsError extends FjnConflictError {
  constructor(context: FjnErrorContext) {
    super(`结算单已存在: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceSettlementAlreadyExistsError';
  }
}

export class FjnFinanceSettlementStatusInvalidError extends FjnStateMachineError {
  constructor(context: FjnErrorContext) {
    super(`结算单状态非法: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceSettlementStatusInvalidError';
  }
}

export class FjnFinanceSettlementNotApprovableError extends FjnStateMachineError {
  constructor(context: FjnErrorContext) {
    super(`结算单不可审核: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceSettlementNotApprovableError';
  }
}

export class FjnFinanceSettlementNotPayableError extends FjnStateMachineError {
  constructor(context: FjnErrorContext) {
    super(`结算单不可支付: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceSettlementNotPayableError';
  }
}

export class FjnFinanceSettlementNotCancellableError extends FjnStateMachineError {
  constructor(context: FjnErrorContext) {
    super(`结算单不可取消: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceSettlementNotCancellableError';
  }
}

export class FjnFinanceSettlementAmountInvalidError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`结算单金额非法: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceSettlementAmountInvalidError';
  }
}

export class FjnFinanceSettlementPeriodInvalidError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`结算单周期非法: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceSettlementPeriodInvalidError';
  }
}

export class FjnFinanceSettlementNoItemsError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`结算单无条目: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceSettlementNoItemsError';
  }
}

export class FjnFinanceSettlementAlreadyPaidError extends FjnConflictError {
  constructor(context: FjnErrorContext) {
    super(`结算单已支付: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceSettlementAlreadyPaidError';
  }
}

// ============================================================
// 5. 结算条目错误类
// ============================================================

export class FjnFinanceSettlementItemNotFoundError extends FjnNotFoundError {
  constructor(context: FjnErrorContext) {
    super(`结算条目不存在: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceSettlementItemNotFoundError';
  }
}

export class FjnFinanceSettlementItemNotPayableError extends FjnStateMachineError {
  constructor(context: FjnErrorContext) {
    super(`结算条目不可支付: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceSettlementItemNotPayableError';
  }
}

export class FjnFinanceSettlementItemNotRetriableError extends FjnStateMachineError {
  constructor(context: FjnErrorContext) {
    super(`结算条目不可重试: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceSettlementItemNotRetriableError';
  }
}

export class FjnFinanceSettlementItemBankInfoRequiredError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`结算条目银行信息必填: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceSettlementItemBankInfoRequiredError';
  }
}

export class FjnFinanceSettlementItemAmountInvalidError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`结算条目金额非法: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceSettlementItemAmountInvalidError';
  }
}

// ============================================================
// 6. 通用业务规则错误
// ============================================================

export class FjnFinanceAmountInvalidError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`金额非法: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceAmountInvalidError';
  }
}

export class FjnFinanceCurrencyMismatchError extends FjnBusinessRuleError {
  constructor(context: FjnErrorContext) {
    super(`币种不匹配: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceCurrencyMismatchError';
  }
}

export class FjnFinanceCurrencyNotSupportedError extends FjnBusinessRuleError {
  constructor(context: FjnErrorContext) {
    super(`币种不支持: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceCurrencyNotSupportedError';
  }
}

export class FjnFinanceApproverRequiredError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`审核人必填: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceApproverRequiredError';
  }
}

export class FjnFinanceOperatorRequiredError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`操作人必填: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceOperatorRequiredError';
  }
}

export class FjnFinanceReasonRequiredError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`原因必填: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceReasonRequiredError';
  }
}

export class FjnFinancePeriodLockedError extends FjnConflictError {
  constructor(context: FjnErrorContext) {
    super(`财务周期已锁定: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinancePeriodLockedError';
  }
}

export class FjnFinanceDailyLimitExceededError extends FjnBusinessRuleError {
  constructor(context: FjnErrorContext) {
    super(`日累计限额超出: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceDailyLimitExceededError';
  }
}

// ============================================================
// 7. 369 收入确认错误
// ============================================================

export class FjnFinanceRevenue369AmountMismatchError extends FjnBusinessRuleError {
  constructor(context: FjnErrorContext) {
    super(`369 分账金额不匹配（40/30/30）: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceRevenue369AmountMismatchError';
  }
}

export class FjnFinanceRevenue369OrderRequiredError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`369 分账订单必填: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceRevenue369OrderRequiredError';
  }
}

export class FjnFinanceRevenue369RuleVersionInvalidError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`369 分账规则版本非法: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceRevenue369RuleVersionInvalidError';
  }
}

export class FjnFinanceRevenue369PoolsNotInitializedError extends FjnBusinessRuleError {
  constructor(context: FjnErrorContext) {
    super(`369 池子未初始化: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceRevenue369PoolsNotInitializedError';
  }
}

// ============================================================
// 8. 报表错误
// ============================================================

export class FjnFinanceReportPeriodInvalidError extends FjnValidationError {
  constructor(context: FjnErrorContext) {
    super(`报表周期非法: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceReportPeriodInvalidError';
  }
}

export class FjnFinanceReportNotFoundError extends FjnNotFoundError {
  constructor(context: FjnErrorContext) {
    super(`报表不存在: ${JSON.stringify(context)}`, context);
    this.name = 'FjnFinanceReportNotFoundError';
  }
}

// ============================================================
// 9. 工具函数
// ============================================================

/** 获取错误码总数 */
export function getFinanceErrorCodeCount(): number {
  return FINANCE_ERROR_CODE_COUNT;
}

/** 判断错误是否为 Finance 错误 */
export function isFjnFinanceError(e: unknown): boolean {
  if (e instanceof FjnError) {
    // 通过 name 匹配（所有 Finance 错误的 name 都以 'FjnFinance' 开头）
    return e.name.startsWith('FjnFinance');
  }
  return false;
}
