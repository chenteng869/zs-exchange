/**
 * FJN Points Service - 错误码 + 异常类
 *
 * 严格遵循工业级分层（参考 H023 §4）：
 *  - 错误码使用 SCREAMING_SNAKE_CASE
 *  - 错误码映射到对应异常类与 HTTP 状态码
 *
 * 用法：
 *   import { FjnPointsAccountNotFoundError, POINTS_ERROR_CODES } from './points-errors';
 *   throw new FjnPointsAccountNotFoundError({ userId, assetType });
 */

import { FjnError, FjnErrorContext } from '../errors';

// ============================================================
// 1. 错误码常量
// ============================================================

export const POINTS_ERROR_CODES = {
  // ---------- Account 通用 ----------
  POINTS_ACCOUNT_NOT_FOUND: 'POINTS_ACCOUNT_NOT_FOUND',
  POINTS_ACCOUNT_EXISTS: 'POINTS_ACCOUNT_EXISTS',
  POINTS_ACCOUNT_FROZEN: 'POINTS_ACCOUNT_FROZEN',
  POINTS_ACCOUNT_CLOSED: 'POINTS_ACCOUNT_CLOSED',
  POINTS_ACCOUNT_STATUS_INVALID: 'POINTS_ACCOUNT_STATUS_INVALID',

  // ---------- Ledger / 流水 ----------
  POINTS_LEDGER_NOT_FOUND: 'POINTS_LEDGER_NOT_FOUND',
  POINTS_LEDGER_AMOUNT_INVALID: 'POINTS_LEDGER_AMOUNT_INVALID',
  POINTS_LEDGER_BALANCE_MISMATCH: 'POINTS_LEDGER_BALANCE_MISMATCH',
  POINTS_LEDGER_DUPLICATE: 'POINTS_LEDGER_DUPLICATE',
  POINTS_LEDGER_DIRECTION_INVALID: 'POINTS_LEDGER_DIRECTION_INVALID',
  POINTS_LEDGER_CHANGE_TYPE_INVALID: 'POINTS_LEDGER_CHANGE_TYPE_INVALID',
  POINTS_LEDGER_SOURCE_TYPE_INVALID: 'POINTS_LEDGER_SOURCE_TYPE_INVALID',
  POINTS_LEDGER_BIZ_TYPE_INVALID: 'POINTS_LEDGER_BIZ_TYPE_INVALID',

  // ---------- Balance / 余额 ----------
  POINTS_INSUFFICIENT_AVAILABLE: 'POINTS_INSUFFICIENT_AVAILABLE',
  POINTS_INSUFFICIENT_FROZEN: 'POINTS_INSUFFICIENT_FROZEN',
  POINTS_INSUFFICIENT_LOCKED: 'POINTS_INSUFFICIENT_LOCKED',
  POINTS_AMOUNT_MUST_BE_POSITIVE: 'POINTS_AMOUNT_MUST_BE_POSITIVE',
  POINTS_AMOUNT_TOO_LARGE: 'POINTS_AMOUNT_TOO_LARGE',
  POINTS_BALANCE_NEGATIVE: 'POINTS_BALANCE_NEGATIVE',

  // ---------- Freeze / 冻结 ----------
  POINTS_FREEZE_NOT_FOUND: 'POINTS_FREEZE_NOT_FOUND',
  POINTS_FREEZE_EXISTS: 'POINTS_FREEZE_EXISTS',
  POINTS_FREEZE_NOT_ACTIVE: 'POINTS_FREEZE_NOT_ACTIVE',
  POINTS_FREEZE_AMOUNT_EXCEEDS_AVAILABLE: 'POINTS_FREEZE_AMOUNT_EXCEEDS_AVAILABLE',
  POINTS_FREEZE_REASON_REQUIRED: 'POINTS_FREEZE_REASON_REQUIRED',
  POINTS_FREEZE_EXPIRES_INVALID: 'POINTS_FREEZE_EXPIRES_INVALID',
  POINTS_UNFREEZE_AMOUNT_EXCEEDS_FREEZE: 'POINTS_UNFREEZE_AMOUNT_EXCEEDS_FREEZE',

  // ---------- Reversal / 冲正 ----------
  POINTS_REVERSAL_NOT_FOUND: 'POINTS_REVERSAL_NOT_FOUND',
  POINTS_REVERSAL_NOT_PENDING: 'POINTS_REVERSAL_NOT_PENDING',
  POINTS_REVERSAL_AMOUNT_EXCEEDS_ORIGINAL: 'POINTS_REVERSAL_AMOUNT_EXCEEDS_ORIGINAL',
  POINTS_REVERSAL_REASON_REQUIRED: 'POINTS_REVERSAL_REASON_REQUIRED',
  POINTS_REVERSAL_DUPLICATE: 'POINTS_REVERSAL_DUPLICATE',

  // ---------- Rule / 规则 ----------
  POINTS_RULE_NOT_FOUND: 'POINTS_RULE_NOT_FOUND',
  POINTS_RULE_EXISTS: 'POINTS_RULE_EXISTS',
  POINTS_RULE_NOT_ACTIVE: 'POINTS_RULE_NOT_ACTIVE',
  POINTS_RULE_NOT_APPROVED: 'POINTS_RULE_NOT_APPROVED',
  POINTS_RULE_EFFECTIVE_INVALID: 'POINTS_RULE_EFFECTIVE_INVALID',
  POINTS_RULE_VERSION_INVALID: 'POINTS_RULE_VERSION_INVALID',
  POINTS_RULE_CONTENT_INVALID: 'POINTS_RULE_CONTENT_INVALID',
  POINTS_RULE_STATUS_INVALID: 'POINTS_RULE_STATUS_INVALID',

  // ---------- Snapshot / 快照 ----------
  POINTS_SNAPSHOT_NOT_FOUND: 'POINTS_SNAPSHOT_NOT_FOUND',
  POINTS_SNAPSHOT_EXISTS: 'POINTS_SNAPSHOT_EXISTS',
  POINTS_SNAPSHOT_TYPE_INVALID: 'POINTS_SNAPSHOT_TYPE_INVALID',
  POINTS_SNAPSHOT_FAILED: 'POINTS_SNAPSHOT_FAILED',

  // ---------- Risk / 风控 ----------
  POINTS_RISK_BLOCKED: 'POINTS_RISK_BLOCKED',
  POINTS_RISK_HOLD: 'POINTS_RISK_HOLD',

  // ---------- 业务校验 ----------
  POINTS_USER_ID_REQUIRED: 'POINTS_USER_ID_REQUIRED',
  POINTS_ASSET_TYPE_INVALID: 'POINTS_ASSET_TYPE_INVALID',
  POINTS_GRANT_AMOUNT_EXCEEDS_RULE: 'POINTS_GRANT_AMOUNT_EXCEEDS_RULE',
  POINTS_CONVERSION_RATIO_INVALID: 'POINTS_CONVERSION_RATIO_INVALID',
  POINTS_KYC_LEVEL_INSUFFICIENT: 'POINTS_KYC_LEVEL_INSUFFICIENT',
  POINTS_REGION_RESTRICTED: 'POINTS_REGION_RESTRICTED',

  // ---------- 系统类 ----------
  INTERNAL: 'POINTS_INTERNAL',
} as const;

export type FjnPointsErrorCode =
  (typeof POINTS_ERROR_CODES)[keyof typeof POINTS_ERROR_CODES];

// ============================================================
// 2. 异常基类
// ============================================================

export class FjnPointsError extends FjnError {
  constructor(
    code: FjnPointsErrorCode,
    message: string,
    context?: FjnErrorContext,
    httpStatus?: number,
  ) {
    super({
      code: code as any,
      message,
      context,
      httpStatus,
    });
    this.name = 'FjnPointsError';
  }
}

// ============================================================
// 3. Account 异常
// ============================================================

export class FjnPointsAccountNotFoundError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_ACCOUNT_NOT_FOUND,
      '积分账户不存在',
      context,
      404,
    );
  }
}

export class FjnPointsAccountExistsError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_ACCOUNT_EXISTS,
      '积分账户已存在',
      context,
      409,
    );
  }
}

export class FjnPointsAccountFrozenError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_ACCOUNT_FROZEN,
      '积分账户已冻结，操作不可用',
      context,
      403,
    );
  }
}

export class FjnPointsAccountClosedError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_ACCOUNT_CLOSED,
      '积分账户已销户',
      context,
      403,
    );
  }
}

export class FjnPointsAccountStatusInvalidError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_ACCOUNT_STATUS_INVALID,
      '积分账户状态非法',
      context,
      400,
    );
  }
}

// ============================================================
// 4. Ledger 异常
// ============================================================

export class FjnPointsLedgerNotFoundError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_LEDGER_NOT_FOUND,
      '积分流水不存在',
      context,
      404,
    );
  }
}

export class FjnPointsLedgerAmountInvalidError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_LEDGER_AMOUNT_INVALID,
      '积分流水金额非法（必须 > 0）',
      context,
      400,
    );
  }
}

export class FjnPointsLedgerBalanceMismatchError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_LEDGER_BALANCE_MISMATCH,
      '积分流水余额不连续（balanceBefore/balanceAfter 不一致）',
      context,
      422,
    );
  }
}

export class FjnPointsLedgerDuplicateError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_LEDGER_DUPLICATE,
      '积分流水重复（同一 sourceId+changeType 已存在）',
      context,
      409,
    );
  }
}

export class FjnPointsLedgerDirectionInvalidError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_LEDGER_DIRECTION_INVALID,
      '积分流水方向非法（earn/spend）',
      context,
      400,
    );
  }
}

export class FjnPointsLedgerChangeTypeInvalidError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_LEDGER_CHANGE_TYPE_INVALID,
      '积分变更类型非法',
      context,
      400,
    );
  }
}

export class FjnPointsLedgerSourceTypeInvalidError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_LEDGER_SOURCE_TYPE_INVALID,
      '积分来源类型非法',
      context,
      400,
    );
  }
}

export class FjnPointsLedgerBizTypeInvalidError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_LEDGER_BIZ_TYPE_INVALID,
      '积分业务类型非法',
      context,
      400,
    );
  }
}

// ============================================================
// 5. Balance 异常
// ============================================================

export class FjnPointsInsufficientAvailableError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_INSUFFICIENT_AVAILABLE,
      '积分可用余额不足',
      context,
      422,
    );
  }
}

export class FjnPointsInsufficientFrozenError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_INSUFFICIENT_FROZEN,
      '积分冻结余额不足',
      context,
      422,
    );
  }
}

export class FjnPointsInsufficientLockedError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_INSUFFICIENT_LOCKED,
      '积分锁定余额不足',
      context,
      422,
    );
  }
}

export class FjnPointsAmountMustBePositiveError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_AMOUNT_MUST_BE_POSITIVE,
      '积分金额必须 > 0',
      context,
      400,
    );
  }
}

export class FjnPointsAmountTooLargeError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_AMOUNT_TOO_LARGE,
      '积分金额超过单笔上限',
      context,
      422,
    );
  }
}

export class FjnPointsBalanceNegativeError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_BALANCE_NEGATIVE,
      '积分余额为负，禁止操作',
      context,
      422,
    );
  }
}

// ============================================================
// 6. Freeze 异常
// ============================================================

export class FjnPointsFreezeNotFoundError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_FREEZE_NOT_FOUND,
      '积分冻结记录不存在',
      context,
      404,
    );
  }
}

export class FjnPointsFreezeNotActiveError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_FREEZE_NOT_ACTIVE,
      '积分冻结记录已解冻或已撤销',
      context,
      409,
    );
  }
}

export class FjnPointsFreezeAmountExceedsAvailableError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_FREEZE_AMOUNT_EXCEEDS_AVAILABLE,
      '冻结金额超过可用余额',
      context,
      422,
    );
  }
}

export class FjnPointsFreezeReasonRequiredError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_FREEZE_REASON_REQUIRED,
      '积分冻结必须提供 reason',
      context,
      400,
    );
  }
}

export class FjnPointsFreezeExpiresInvalidError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_FREEZE_EXPIRES_INVALID,
      '冻结过期时间非法（必须晚于当前时刻）',
      context,
      400,
    );
  }
}

export class FjnPointsUnfreezeAmountExceedsFreezeError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_UNFREEZE_AMOUNT_EXCEEDS_FREEZE,
      '解冻金额超过冻结金额',
      context,
      422,
    );
  }
}

// ============================================================
// 7. Reversal 异常
// ============================================================

export class FjnPointsReversalNotFoundError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_REVERSAL_NOT_FOUND,
      '积分冲正记录不存在',
      context,
      404,
    );
  }
}

export class FjnPointsReversalNotPendingError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_REVERSAL_NOT_PENDING,
      '积分冲正记录不在 pending 状态',
      context,
      409,
    );
  }
}

export class FjnPointsReversalAmountExceedsOriginalError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_REVERSAL_AMOUNT_EXCEEDS_ORIGINAL,
      '冲正金额超过原流水金额',
      context,
      422,
    );
  }
}

export class FjnPointsReversalReasonRequiredError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_REVERSAL_REASON_REQUIRED,
      '积分冲正必须提供 reason',
      context,
      400,
    );
  }
}

export class FjnPointsReversalDuplicateError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_REVERSAL_DUPLICATE,
      '积分冲正重复（同一原流水 + 原因已存在）',
      context,
      409,
    );
  }
}

// ============================================================
// 8. Rule 异常
// ============================================================

export class FjnPointsRuleNotFoundError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_RULE_NOT_FOUND,
      '积分规则不存在',
      context,
      404,
    );
  }
}

export class FjnPointsRuleExistsError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_RULE_EXISTS,
      '积分规则 code+version 已存在',
      context,
      409,
    );
  }
}

export class FjnPointsRuleNotActiveError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_RULE_NOT_ACTIVE,
      '积分规则不在 active 状态',
      context,
      409,
    );
  }
}

export class FjnPointsRuleNotApprovedError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_RULE_NOT_APPROVED,
      '积分规则未审批通过',
      context,
      403,
    );
  }
}

export class FjnPointsRuleEffectiveInvalidError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_RULE_EFFECTIVE_INVALID,
      '积分规则生效时间非法',
      context,
      400,
    );
  }
}

export class FjnPointsRuleVersionInvalidError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_RULE_VERSION_INVALID,
      '积分规则版本号格式非法',
      context,
      400,
    );
  }
}

export class FjnPointsRuleContentInvalidError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_RULE_CONTENT_INVALID,
      '积分规则内容非法（ruleContent JSON 校验失败）',
      context,
      400,
    );
  }
}

export class FjnPointsRuleStatusInvalidError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_RULE_STATUS_INVALID,
      '积分规则状态非法',
      context,
      400,
    );
  }
}

// ============================================================
// 9. Snapshot 异常
// ============================================================

export class FjnPointsSnapshotNotFoundError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_SNAPSHOT_NOT_FOUND,
      '积分快照不存在',
      context,
      404,
    );
  }
}

export class FjnPointsSnapshotFailedError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_SNAPSHOT_FAILED,
      '积分快照生成失败',
      context,
      500,
    );
  }
}

export class FjnPointsSnapshotTypeInvalidError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_SNAPSHOT_TYPE_INVALID,
      '积分快照类型非法',
      context,
      400,
    );
  }
}

// ============================================================
// 10. Risk 异常
// ============================================================

export class FjnPointsRiskBlockedError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_RISK_BLOCKED,
      '积分操作已被风控拦截',
      context,
      403,
    );
  }
}

export class FjnPointsRiskHoldError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_RISK_HOLD,
      '积分操作已被风控挂起',
      context,
      423,
    );
  }
}

// ============================================================
// 11. 业务校验异常
// ============================================================

export class FjnPointsUserIdRequiredError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_USER_ID_REQUIRED,
      '用户 ID 必填',
      context,
      400,
    );
  }
}

export class FjnPointsAssetTypeInvalidError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_ASSET_TYPE_INVALID,
      '积分资产类型非法（fj369_points/cfj369）',
      context,
      400,
    );
  }
}

export class FjnPointsGrantAmountExceedsRuleError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_GRANT_AMOUNT_EXCEEDS_RULE,
      '发放积分超过规则上限',
      context,
      422,
    );
  }
}

export class FjnPointsConversionRatioInvalidError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_CONVERSION_RATIO_INVALID,
      '积分转换比例非法',
      context,
      400,
    );
  }
}

export class FjnPointsKycLevelInsufficientError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_KYC_LEVEL_INSUFFICIENT,
      'KYC 等级不足，无法发放/转换积分',
      context,
      403,
    );
  }
}

export class FjnPointsRegionRestrictedError extends FjnPointsError {
  constructor(context?: FjnErrorContext) {
    super(
      POINTS_ERROR_CODES.POINTS_REGION_RESTRICTED,
      '当前地区不可用积分',
      context,
      403,
    );
  }
}
