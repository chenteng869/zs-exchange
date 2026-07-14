/**
 * tFJ369 Service - 错误码 + 异常类
 */

import { FjnError, FjnErrorContext } from '../errors';

export const TFJ369_ERROR_CODES = {
  TFJ369_USER_ID_REQUIRED: 'TFJ369_USER_ID_REQUIRED',
  TFJ369_ACCOUNT_NOT_FOUND: 'TFJ369_ACCOUNT_NOT_FOUND',
  TFJ369_ACCOUNT_FROZEN: 'TFJ369_ACCOUNT_FROZEN',
  TFJ369_ACCOUNT_CLOSED: 'TFJ369_ACCOUNT_CLOSED',
  TFJ369_AMOUNT_INVALID: 'TFJ369_AMOUNT_INVALID',
  TFJ369_BALANCE_INSUFFICIENT: 'TFJ369_BALANCE_INSUFFICIENT',
  TFJ369_LEDGER_DIRECTION_INVALID: 'TFJ369_LEDGER_DIRECTION_INVALID',
  TFJ369_LEDGER_CHANGE_TYPE_INVALID: 'TFJ369_LEDGER_CHANGE_TYPE_INVALID',
  TFJ369_LOCK_NOT_FOUND: 'TFJ369_LOCK_NOT_FOUND',
  TFJ369_LOCK_AMOUNT_INVALID: 'TFJ369_LOCK_AMOUNT_INVALID',
  TFJ369_LOCK_NOT_ACTIVE: 'TFJ369_LOCK_NOT_ACTIVE',
  TFJ369_CONVERSION_NOT_FOUND: 'TFJ369_CONVERSION_NOT_FOUND',
  TFJ369_CONVERSION_RATIO_INVALID: 'TFJ369_CONVERSION_RATIO_INVALID',
  TFJ369_CONVERSION_CFJ369_INSUFFICIENT: 'TFJ369_CONVERSION_CFJ369_INSUFFICIENT',
  TFJ369_CONVERSION_REGION_BLOCKED: 'TFJ369_CONVERSION_REGION_BLOCKED',
  TFJ369_CONVERSION_RISK_BLOCKED: 'TFJ369_CONVERSION_RISK_BLOCKED',
  TFJ369_CONVERSION_KYC_REQUIRED: 'TFJ369_CONVERSION_KYC_REQUIRED',
  TFJ369_CONVERSION_INVALID_STATUS: 'TFJ369_CONVERSION_INVALID_STATUS',
  TFJ369_CONVERSION_ALREADY_EXECUTED: 'TFJ369_CONVERSION_ALREADY_EXECUTED',
  TFJ369_MEMBER_LEVEL_INVALID: 'TFJ369_MEMBER_LEVEL_INVALID',
  TFJ369_RISK_BLOCKED: 'TFJ369_RISK_BLOCKED',
  TFJ369_SOLANA_MINT_FAILED: 'TFJ369_SOLANA_MINT_FAILED',
  TFJ369_SOLANA_BURN_FAILED: 'TFJ369_SOLANA_BURN_FAILED',
} as const;

export type FjnTfj369ErrorCode = (typeof TFJ369_ERROR_CODES)[keyof typeof TFJ369_ERROR_CODES];

export class FjnTfj369Error extends FjnError {
  constructor(code: FjnTfj369ErrorCode, message: string, context?: FjnErrorContext, httpStatus?: number) {
    super({ code: code as any, message, context, httpStatus });
    this.name = 'FjnTfj369Error';
  }
}

export class Tfj369UserIdRequiredError extends FjnTfj369Error {
  constructor(context?: FjnErrorContext) {
    super(TFJ369_ERROR_CODES.TFJ369_USER_ID_REQUIRED, 'tFJ369 userId is required', context, 400);
  }
}
export class Tfj369AccountNotFoundError extends FjnTfj369Error {
  constructor(context?: FjnErrorContext) {
    super(TFJ369_ERROR_CODES.TFJ369_ACCOUNT_NOT_FOUND, 'tFJ369 account not found', context, 404);
  }
}
export class Tfj369AccountFrozenError extends FjnTfj369Error {
  constructor(context?: FjnErrorContext) {
    super(TFJ369_ERROR_CODES.TFJ369_ACCOUNT_FROZEN, 'tFJ369 account is frozen', context, 423);
  }
}
export class Tfj369AccountClosedError extends FjnTfj369Error {
  constructor(context?: FjnErrorContext) {
    super(TFJ369_ERROR_CODES.TFJ369_ACCOUNT_CLOSED, 'tFJ369 account is closed', context, 410);
  }
}
export class Tfj369AmountInvalidError extends FjnTfj369Error {
  constructor(context?: FjnErrorContext) {
    super(TFJ369_ERROR_CODES.TFJ369_AMOUNT_INVALID, 'tFJ369 amount is invalid', context, 400);
  }
}
export class Tfj369BalanceInsufficientError extends FjnTfj369Error {
  constructor(context?: FjnErrorContext) {
    super(TFJ369_ERROR_CODES.TFJ369_BALANCE_INSUFFICIENT, 'tFJ369 available balance is insufficient', context, 402);
  }
}
export class Tfj369LockNotFoundError extends FjnTfj369Error {
  constructor(context?: FjnErrorContext) {
    super(TFJ369_ERROR_CODES.TFJ369_LOCK_NOT_FOUND, 'tFJ369 lock not found', context, 404);
  }
}
export class Tfj369ConversionNotFoundError extends FjnTfj369Error {
  constructor(context?: FjnErrorContext) {
    super(TFJ369_ERROR_CODES.TFJ369_CONVERSION_NOT_FOUND, 'tFJ369 conversion order not found', context, 404);
  }
}
export class Tfj369ConversionRegionBlockedError extends FjnTfj369Error {
  constructor(context?: FjnErrorContext) {
    super(TFJ369_ERROR_CODES.TFJ369_CONVERSION_REGION_BLOCKED, 'Region does not allow tFJ369 conversion', context, 403);
  }
}
export class Tfj369ConversionRiskBlockedError extends FjnTfj369Error {
  constructor(context?: FjnErrorContext) {
    super(TFJ369_ERROR_CODES.TFJ369_CONVERSION_RISK_BLOCKED, 'Risk decision blocks tFJ369 conversion', context, 403);
  }
}
export class Tfj369ConversionKycRequiredError extends FjnTfj369Error {
  constructor(context?: FjnErrorContext) {
    super(TFJ369_ERROR_CODES.TFJ369_CONVERSION_KYC_REQUIRED, 'KYC is required for tFJ369 conversion', context, 403);
  }
}
export class Tfj369RiskBlockedError extends FjnTfj369Error {
  constructor(context?: FjnErrorContext) {
    super(TFJ369_ERROR_CODES.TFJ369_RISK_BLOCKED, 'Risk decision blocks the tFJ369 operation', context, 403);
  }
}
export class Tfj369SolanaMintFailedError extends FjnTfj369Error {
  constructor(context?: FjnErrorContext) {
    super(TFJ369_ERROR_CODES.TFJ369_SOLANA_MINT_FAILED, 'Solana on-chain mint for tFJ369 failed', context, 502);
  }
}
export class Tfj369SolanaBurnFailedError extends FjnTfj369Error {
  constructor(context?: FjnErrorContext) {
    super(TFJ369_ERROR_CODES.TFJ369_SOLANA_BURN_FAILED, 'Solana on-chain burn for tFJ369 failed', context, 502);
  }
}
