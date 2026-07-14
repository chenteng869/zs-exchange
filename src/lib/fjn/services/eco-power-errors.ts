/**
 * Eco Power Service - 错误码 + 异常类
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.5
 */

import { FjnError, FjnErrorContext } from '../errors';

export const ECO_POWER_ERROR_CODES = {
  // 账户
  ACCOUNT_NOT_FOUND: 'FJN_ECO_POWER_ACCOUNT_NOT_FOUND',
  ACCOUNT_ALREADY_EXISTS: 'FJN_ECO_POWER_ACCOUNT_ALREADY_EXISTS',
  ACCOUNT_CLOSED: 'FJN_ECO_POWER_ACCOUNT_CLOSED',
  ACCOUNT_NOT_OPERABLE: 'FJN_ECO_POWER_ACCOUNT_NOT_OPERABLE',
  ACCOUNT_STATUS_INVALID: 'FJN_ECO_POWER_ACCOUNT_STATUS_INVALID',
  ACCOUNT_STATUS_TRANSITION_FORBIDDEN: 'FJN_ECO_POWER_ACCOUNT_STATUS_TRANSITION_FORBIDDEN',
  // 用户
  USER_ID_REQUIRED: 'FJN_ECO_POWER_USER_ID_REQUIRED',
  // 类型 / 枚举
  POWER_TYPE_INVALID: 'FJN_ECO_POWER_POWER_TYPE_INVALID',
  POWER_TYPE_NOT_FOUND_IN_ACCOUNT: 'FJN_ECO_POWER_POWER_TYPE_NOT_FOUND_IN_ACCOUNT',
  POWER_CHANGE_TYPE_INVALID: 'FJN_ECO_POWER_POWER_CHANGE_TYPE_INVALID',
  POWER_SOURCE_TYPE_INVALID: 'FJN_ECO_POWER_POWER_SOURCE_TYPE_INVALID',
  POWER_SNAPSHOT_TYPE_INVALID: 'FJN_ECO_POWER_POWER_SNAPSHOT_TYPE_INVALID',
  // 金额
  POWER_AMOUNT_REQUIRED: 'FJN_ECO_POWER_POWER_AMOUNT_REQUIRED',
  POWER_AMOUNT_INVALID: 'FJN_ECO_POWER_POWER_AMOUNT_INVALID',
  POWER_AMOUNT_OUT_OF_RANGE: 'FJN_ECO_POWER_POWER_AMOUNT_OUT_OF_RANGE',
  POWER_AMOUNT_ZERO: 'FJN_ECO_POWER_POWER_AMOUNT_ZERO',
  POWER_INSUFFICIENT: 'FJN_ECO_POWER_POWER_INSUFFICIENT',
  // 倍率 / 系数
  MEMBER_MULTIPLIER_INVALID: 'FJN_ECO_POWER_MEMBER_MULTIPLIER_INVALID',
  ACTIVITY_MULTIPLIER_INVALID: 'FJN_ECO_POWER_ACTIVITY_MULTIPLIER_INVALID',
  RISK_COEFFICIENT_INVALID: 'FJN_ECO_POWER_RISK_COEFFICIENT_INVALID',
  MULTIPLIER_OUT_OF_RANGE: 'FJN_ECO_POWER_MULTIPLIER_OUT_OF_RANGE',
  // 流水
  LEDGER_NOT_FOUND: 'FJN_ECO_POWER_LEDGER_NOT_FOUND',
  LEDGER_AMOUNT_INVALID: 'FJN_ECO_POWER_LEDGER_AMOUNT_INVALID',
  // 快照
  SNAPSHOT_NOT_FOUND: 'FJN_ECO_POWER_SNAPSHOT_NOT_FOUND',
  SNAPSHOT_ALREADY_EXISTS: 'FJN_ECO_POWER_SNAPSHOT_ALREADY_EXISTS',
  // 冻结
  FREEZE_AMOUNT_INVALID: 'FJN_ECO_POWER_FREEZE_AMOUNT_INVALID',
  FREEZE_REASON_REQUIRED: 'FJN_ECO_POWER_FREEZE_REASON_REQUIRED',
  UNFREEZE_REASON_REQUIRED: 'FJN_ECO_POWER_UNFREEZE_REASON_REQUIRED',
  // 转移
  TRANSFER_TO_SELF_FORBIDDEN: 'FJN_ECO_POWER_TRANSFER_TO_SELF_FORBIDDEN',
  TRANSFER_TARGET_ACCOUNT_NOT_FOUND: 'FJN_ECO_POWER_TRANSFER_TARGET_ACCOUNT_NOT_FOUND',
  // 释放
  RELEASE_CALCULATION_NOT_READY: 'FJN_ECO_POWER_RELEASE_CALCULATION_NOT_READY',
  RELEASE_CALCULATION_DUPLICATE: 'FJN_ECO_POWER_RELEASE_CALCULATION_DUPLICATE',
  // 过期
  EXPIRE_DATE_INVALID: 'FJN_ECO_POWER_EXPIRE_DATE_INVALID',
  // 操作
  SELF_ADJUST_FORBIDDEN: 'FJN_ECO_POWER_SELF_ADJUST_FORBIDDEN',
  RULE_CODE_REQUIRED: 'FJN_ECO_POWER_RULE_CODE_REQUIRED',
  RULE_VERSION_INVALID: 'FJN_ECO_POWER_RULE_VERSION_INVALID',
  // 通用
  INTERNAL_CALCULATION_ERROR: 'FJN_ECO_POWER_INTERNAL_CALCULATION_ERROR',
  EFFECTIVE_RECALCULATION_FAILED: 'FJN_ECO_POWER_EFFECTIVE_RECALCULATION_FAILED',
} as const;
export type FjnEcoPowerErrorCode =
  (typeof ECO_POWER_ERROR_CODES)[keyof typeof ECO_POWER_ERROR_CODES];

export const isFjnEcoPowerErrorCode = (c: string): c is FjnEcoPowerErrorCode =>
  Object.values(ECO_POWER_ERROR_CODES).includes(c as any);

export const getEcoPowerErrorCodeCount = (): number =>
  Object.keys(ECO_POWER_ERROR_CODES).length;

/** Eco Power 业务异常基类 */
export class FjnEcoPowerError extends FjnError {
  constructor(params: {
    code: FjnEcoPowerErrorCode;
    message: string;
    context?: FjnErrorContext;
    cause?: unknown;
  }) {
    super({
      code: params.code as unknown as FjnError['code'],
      message: params.message,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'FjnEcoPowerError';
  }
}

export class AccountNotFoundError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.ACCOUNT_NOT_FOUND,
      message: 'Power account not found',
      context: ctx,
    });
    this.name = 'AccountNotFoundError';
  }
}
export class AccountAlreadyExistsError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.ACCOUNT_ALREADY_EXISTS,
      message: 'Power account already exists',
      context: ctx,
    });
    this.name = 'AccountAlreadyExistsError';
  }
}
export class AccountClosedError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.ACCOUNT_CLOSED,
      message: 'Power account has been closed',
      context: ctx,
    });
    this.name = 'AccountClosedError';
  }
}
export class AccountNotOperableError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.ACCOUNT_NOT_OPERABLE,
      message: 'Power account not operable in current status',
      context: ctx,
    });
    this.name = 'AccountNotOperableError';
  }
}
export class AccountStatusInvalidError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.ACCOUNT_STATUS_INVALID,
      message: 'Power account status invalid',
      context: ctx,
    });
    this.name = 'AccountStatusInvalidError';
  }
}
export class AccountStatusTransitionForbiddenError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.ACCOUNT_STATUS_TRANSITION_FORBIDDEN,
      message: 'Power account status transition forbidden',
      context: ctx,
    });
    this.name = 'AccountStatusTransitionForbiddenError';
  }
}

export class UserIdRequiredError extends FjnEcoPowerError {
  constructor() {
    super({
      code: ECO_POWER_ERROR_CODES.USER_ID_REQUIRED,
      message: 'User ID is required',
    });
    this.name = 'UserIdRequiredError';
  }
}

export class PowerTypeInvalidError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.POWER_TYPE_INVALID,
      message: 'Power type invalid',
      context: ctx,
    });
    this.name = 'PowerTypeInvalidError';
  }
}
export class PowerTypeNotFoundInAccountError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.POWER_TYPE_NOT_FOUND_IN_ACCOUNT,
      message: 'Power type not found in account field mapping',
      context: ctx,
    });
    this.name = 'PowerTypeNotFoundInAccountError';
  }
}
export class PowerChangeTypeInvalidError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.POWER_CHANGE_TYPE_INVALID,
      message: 'Power change type invalid',
      context: ctx,
    });
    this.name = 'PowerChangeTypeInvalidError';
  }
}
export class PowerSourceTypeInvalidError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.POWER_SOURCE_TYPE_INVALID,
      message: 'Power source type invalid',
      context: ctx,
    });
    this.name = 'PowerSourceTypeInvalidError';
  }
}
export class PowerSnapshotTypeInvalidError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.POWER_SNAPSHOT_TYPE_INVALID,
      message: 'Power snapshot type invalid',
      context: ctx,
    });
    this.name = 'PowerSnapshotTypeInvalidError';
  }
}

export class PowerAmountRequiredError extends FjnEcoPowerError {
  constructor() {
    super({
      code: ECO_POWER_ERROR_CODES.POWER_AMOUNT_REQUIRED,
      message: 'Power amount is required',
    });
    this.name = 'PowerAmountRequiredError';
  }
}
export class PowerAmountInvalidError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.POWER_AMOUNT_INVALID,
      message: 'Power amount invalid',
      context: ctx,
    });
    this.name = 'PowerAmountInvalidError';
  }
}
export class PowerAmountOutOfRangeError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.POWER_AMOUNT_OUT_OF_RANGE,
      message: 'Power amount out of range',
      context: ctx,
    });
    this.name = 'PowerAmountOutOfRangeError';
  }
}
export class PowerAmountZeroError extends FjnEcoPowerError {
  constructor() {
    super({
      code: ECO_POWER_ERROR_CODES.POWER_AMOUNT_ZERO,
      message: 'Power amount cannot be zero',
    });
    this.name = 'PowerAmountZeroError';
  }
}
export class PowerInsufficientError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.POWER_INSUFFICIENT,
      message: 'Power balance insufficient',
      context: ctx,
    });
    this.name = 'PowerInsufficientError';
  }
}

export class MemberMultiplierInvalidError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.MEMBER_MULTIPLIER_INVALID,
      message: 'Member multiplier invalid',
      context: ctx,
    });
    this.name = 'MemberMultiplierInvalidError';
  }
}
export class ActivityMultiplierInvalidError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.ACTIVITY_MULTIPLIER_INVALID,
      message: 'Activity multiplier invalid',
      context: ctx,
    });
    this.name = 'ActivityMultiplierInvalidError';
  }
}
export class RiskCoefficientInvalidError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.RISK_COEFFICIENT_INVALID,
      message: 'Risk coefficient invalid',
      context: ctx,
    });
    this.name = 'RiskCoefficientInvalidError';
  }
}
export class MultiplierOutOfRangeError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.MULTIPLIER_OUT_OF_RANGE,
      message: 'Multiplier out of range',
      context: ctx,
    });
    this.name = 'MultiplierOutOfRangeError';
  }
}

export class LedgerNotFoundError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.LEDGER_NOT_FOUND,
      message: 'Power ledger not found',
      context: ctx,
    });
    this.name = 'LedgerNotFoundError';
  }
}
export class LedgerAmountInvalidError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.LEDGER_AMOUNT_INVALID,
      message: 'Ledger amount invalid',
      context: ctx,
    });
    this.name = 'LedgerAmountInvalidError';
  }
}

export class SnapshotNotFoundError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.SNAPSHOT_NOT_FOUND,
      message: 'Power snapshot not found',
      context: ctx,
    });
    this.name = 'SnapshotNotFoundError';
  }
}
export class SnapshotAlreadyExistsError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.SNAPSHOT_ALREADY_EXISTS,
      message: 'Power snapshot already exists',
      context: ctx,
    });
    this.name = 'SnapshotAlreadyExistsError';
  }
}

export class FreezeAmountInvalidError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.FREEZE_AMOUNT_INVALID,
      message: 'Freeze amount invalid',
      context: ctx,
    });
    this.name = 'FreezeAmountInvalidError';
  }
}
export class FreezeReasonRequiredError extends FjnEcoPowerError {
  constructor() {
    super({
      code: ECO_POWER_ERROR_CODES.FREEZE_REASON_REQUIRED,
      message: 'Freeze reason is required',
    });
    this.name = 'FreezeReasonRequiredError';
  }
}
export class UnfreezeReasonRequiredError extends FjnEcoPowerError {
  constructor() {
    super({
      code: ECO_POWER_ERROR_CODES.UNFREEZE_REASON_REQUIRED,
      message: 'Unfreeze reason is required',
    });
    this.name = 'UnfreezeReasonRequiredError';
  }
}

export class TransferToSelfForbiddenError extends FjnEcoPowerError {
  constructor() {
    super({
      code: ECO_POWER_ERROR_CODES.TRANSFER_TO_SELF_FORBIDDEN,
      message: 'Cannot transfer power to self',
    });
    this.name = 'TransferToSelfForbiddenError';
  }
}
export class TransferTargetAccountNotFoundError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.TRANSFER_TARGET_ACCOUNT_NOT_FOUND,
      message: 'Transfer target power account not found',
      context: ctx,
    });
    this.name = 'TransferTargetAccountNotFoundError';
  }
}

export class ReleaseCalculationNotReadyError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.RELEASE_CALCULATION_NOT_READY,
      message: 'Release calculation not ready',
      context: ctx,
    });
    this.name = 'ReleaseCalculationNotReadyError';
  }
}
export class ReleaseCalculationDuplicateError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.RELEASE_CALCULATION_DUPLICATE,
      message: 'Release calculation already exists for this snapshot',
      context: ctx,
    });
    this.name = 'ReleaseCalculationDuplicateError';
  }
}

export class ExpireDateInvalidError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.EXPIRE_DATE_INVALID,
      message: 'Expire date invalid',
      context: ctx,
    });
    this.name = 'ExpireDateInvalidError';
  }
}

export class SelfAdjustForbiddenError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.SELF_ADJUST_FORBIDDEN,
      message: 'Cannot self-adjust own power account',
      context: ctx,
    });
    this.name = 'SelfAdjustForbiddenError';
  }
}
export class RuleCodeRequiredError extends FjnEcoPowerError {
  constructor() {
    super({
      code: ECO_POWER_ERROR_CODES.RULE_CODE_REQUIRED,
      message: 'Rule code is required',
    });
    this.name = 'RuleCodeRequiredError';
  }
}
export class RuleVersionInvalidError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.RULE_VERSION_INVALID,
      message: 'Rule version invalid',
      context: ctx,
    });
    this.name = 'RuleVersionInvalidError';
  }
}

export class InternalCalculationError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.INTERNAL_CALCULATION_ERROR,
      message: 'Internal calculation error',
      context: ctx,
    });
    this.name = 'InternalCalculationError';
  }
}
export class EffectiveRecalculationFailedError extends FjnEcoPowerError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: ECO_POWER_ERROR_CODES.EFFECTIVE_RECALCULATION_FAILED,
      message: 'Effective power recalculation failed',
      context: ctx,
    });
    this.name = 'EffectiveRecalculationFailedError';
  }
}
