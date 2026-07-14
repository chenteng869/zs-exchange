/**
 * Sports Pool Service - 错误码 + 异常类
 *
 * 工业级 Solana-first 架构
 */

import { FjnError, FjnErrorContext } from '../errors';

export const SPORTS_POOL_ERROR_CODES = {
  POOL_NOT_FOUND: 'SPORTS_POOL_NOT_FOUND',
  POOL_TYPE_INVALID: 'SPORTS_POOL_TYPE_INVALID',
  POOL_STATUS_INVALID: 'SPORTS_POOL_STATUS_INVALID',
  POOL_LOCKED: 'SPORTS_POOL_LOCKED',
  POOL_CLOSED: 'SPORTS_POOL_CLOSED',
  POOL_NAME_REQUIRED: 'SPORTS_POOL_NAME_REQUIRED',
  EVENT_NOT_FOUND: 'SPORTS_POOL_EVENT_NOT_FOUND',
  EVENT_STATUS_INVALID: 'SPORTS_POOL_EVENT_STATUS_INVALID',
  EVENT_NAME_REQUIRED: 'SPORTS_POOL_EVENT_NAME_REQUIRED',
  EVENT_TIME_INVALID: 'SPORTS_POOL_EVENT_TIME_INVALID',
  EVENT_OUTCOME_INVALID: 'SPORTS_POOL_EVENT_OUTCOME_INVALID',
  EVENT_TEAMS_REQUIRED: 'SPORTS_POOL_EVENT_TEAMS_REQUIRED',
  MARKET_NOT_FOUND: 'SPORTS_POOL_MARKET_NOT_FOUND',
  MARKET_STATUS_INVALID: 'SPORTS_POOL_MARKET_STATUS_INVALID',
  MARKET_LOCKED: 'SPORTS_POOL_MARKET_LOCKED',
  MARKET_TYPE_INVALID: 'SPORTS_POOL_MARKET_TYPE_INVALID',
  MARKET_ODDS_INVALID: 'SPORTS_POOL_MARKET_ODDS_INVALID',
  MARKET_OUTCOMES_REQUIRED: 'SPORTS_POOL_MARKET_OUTCOMES_REQUIRED',
  ENTRY_NOT_FOUND: 'SPORTS_POOL_ENTRY_NOT_FOUND',
  ENTRY_STATUS_INVALID: 'SPORTS_POOL_ENTRY_STATUS_INVALID',
  ENTRY_STAKE_INVALID: 'SPORTS_POOL_ENTRY_STAKE_INVALID',
  ENTRY_USER_ID_REQUIRED: 'SPORTS_POOL_ENTRY_USER_ID_REQUIRED',
  ENTRY_PAYMENT_METHOD_INVALID: 'SPORTS_POOL_ENTRY_PAYMENT_METHOD_INVALID',
  ENTRY_OUTCOME_REQUIRED: 'SPORTS_POOL_ENTRY_OUTCOME_REQUIRED',
  ENTRY_ALREADY_SETTLED: 'SPORTS_POOL_ENTRY_ALREADY_SETTLED',
  ENTRY_ALREADY_PAID: 'SPORTS_POOL_ENTRY_ALREADY_PAID',
  ENTRY_DUPLICATE: 'SPORTS_POOL_ENTRY_DUPLICATE',
  ENTRY_TX_HASH_DUPLICATE: 'SPORTS_POOL_ENTRY_TX_HASH_DUPLICATE',
  COMPLIANCE_FAILED: 'SPORTS_POOL_COMPLIANCE_FAILED',
  COMPLIANCE_REQUIRED: 'SPORTS_POOL_COMPLIANCE_REQUIRED',
  RISK_HOLD: 'SPORTS_POOL_RISK_HOLD',
  ORACLE_RESULT_INVALID: 'SPORTS_POOL_ORACLE_RESULT_INVALID',
  ORACLE_PUBLISHER_REQUIRED: 'SPORTS_POOL_ORACLE_PUBLISHER_REQUIRED',
  PAYOUT_FAILED: 'SPORTS_POOL_PAYOUT_FAILED',
  REFUND_FAILED: 'SPORTS_POOL_REFUND_FAILED',
  CATEGORY_INVALID: 'SPORTS_POOL_CATEGORY_INVALID',
  PAYOUT_AMOUNT_INVALID: 'SPORTS_POOL_PAYOUT_AMOUNT_INVALID',
} as const;

export type FjnSportsPoolErrorCode =
  (typeof SPORTS_POOL_ERROR_CODES)[keyof typeof SPORTS_POOL_ERROR_CODES];

export class FjnSportsPoolError extends FjnError {
  constructor(
    code: FjnSportsPoolErrorCode,
    message: string,
    context?: FjnErrorContext,
    httpStatus?: number,
  ) {
    super({ code: code as any, message, context, httpStatus });
    this.name = 'FjnSportsPoolError';
  }
}

export class SportsPoolNotFoundError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.POOL_NOT_FOUND, 'Sports pool not found', context, 404);
  }
}
export class SportsPoolTypeInvalidError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.POOL_TYPE_INVALID, 'Sports pool type is invalid', context, 400);
  }
}
export class SportsPoolStatusInvalidError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.POOL_STATUS_INVALID, 'Sports pool status is invalid', context, 409);
  }
}
export class SportsPoolLockedError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.POOL_LOCKED, 'Sports pool is locked', context, 423);
  }
}
export class SportsPoolClosedError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.POOL_CLOSED, 'Sports pool is closed', context, 410);
  }
}
export class SportsPoolNameRequiredError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.POOL_NAME_REQUIRED, 'Sports pool name is required', context, 400);
  }
}

export class SportsEventNotFoundError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.EVENT_NOT_FOUND, 'Sports event not found', context, 404);
  }
}
export class SportsEventStatusInvalidError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.EVENT_STATUS_INVALID, 'Sports event status is invalid', context, 409);
  }
}
export class SportsEventNameRequiredError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.EVENT_NAME_REQUIRED, 'Sports event name is required', context, 400);
  }
}
export class SportsEventTimeInvalidError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.EVENT_TIME_INVALID, 'Sports event start time is invalid', context, 400);
  }
}
export class SportsEventOutcomeInvalidError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.EVENT_OUTCOME_INVALID, 'Sports event outcome is invalid', context, 400);
  }
}
export class SportsEventTeamsRequiredError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.EVENT_TEAMS_REQUIRED, 'Sports event home/away teams are required', context, 400);
  }
}

export class SportsMarketNotFoundError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.MARKET_NOT_FOUND, 'Sports market not found', context, 404);
  }
}
export class SportsMarketStatusInvalidError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.MARKET_STATUS_INVALID, 'Sports market status is invalid', context, 409);
  }
}
export class SportsMarketLockedError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.MARKET_LOCKED, 'Sports market is locked', context, 423);
  }
}
export class SportsMarketTypeInvalidError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.MARKET_TYPE_INVALID, 'Sports market type is invalid', context, 400);
  }
}
export class SportsMarketOddsInvalidError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.MARKET_ODDS_INVALID, 'Sports market odds is invalid (must be >= 1.01)', context, 400);
  }
}
export class SportsMarketOutcomesRequiredError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.MARKET_OUTCOMES_REQUIRED, 'Sports market outcomes are required', context, 400);
  }
}

export class SportsEntryNotFoundError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.ENTRY_NOT_FOUND, 'Sports entry not found', context, 404);
  }
}
export class SportsEntryStatusInvalidError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.ENTRY_STATUS_INVALID, 'Sports entry status is invalid', context, 409);
  }
}
export class SportsEntryStakeInvalidError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.ENTRY_STAKE_INVALID, 'Sports entry stake is invalid', context, 400);
  }
}
export class SportsEntryUserIdRequiredError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.ENTRY_USER_ID_REQUIRED, 'Sports entry userId is required', context, 400);
  }
}
export class SportsEntryPaymentMethodInvalidError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.ENTRY_PAYMENT_METHOD_INVALID, 'Sports entry payment method is invalid', context, 400);
  }
}
export class SportsEntryOutcomeRequiredError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.ENTRY_OUTCOME_REQUIRED, 'Sports entry outcome is required', context, 400);
  }
}
export class SportsEntryAlreadySettledError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.ENTRY_ALREADY_SETTLED, 'Sports entry already settled', context, 409);
  }
}
export class SportsEntryAlreadyPaidError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.ENTRY_ALREADY_PAID, 'Sports entry already paid', context, 409);
  }
}
export class SportsEntryDuplicateError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.ENTRY_DUPLICATE, 'Sports entry is duplicate', context, 409);
  }
}
export class SportsEntryTxHashDuplicateError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.ENTRY_TX_HASH_DUPLICATE, 'Sports entry txHash is duplicated', context, 409);
  }
}

export class SportsComplianceFailedError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.COMPLIANCE_FAILED, 'Sports compliance check failed', context, 451);
  }
}
export class SportsComplianceRequiredError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.COMPLIANCE_REQUIRED, 'Sports compliance check is required', context, 400);
  }
}
export class SportsRiskHoldError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.RISK_HOLD, 'Sports entry is on risk hold', context, 423);
  }
}

export class SportsOracleResultInvalidError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.ORACLE_RESULT_INVALID, 'Oracle result is invalid', context, 400);
  }
}
export class SportsOraclePublisherRequiredError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.ORACLE_PUBLISHER_REQUIRED, 'Oracle publisher is required', context, 400);
  }
}
export class SportsPayoutFailedError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.PAYOUT_FAILED, 'Sports payout failed', context, 502);
  }
}
export class SportsRefundFailedError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.REFUND_FAILED, 'Sports refund failed', context, 502);
  }
}
export class SportsCategoryInvalidError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.CATEGORY_INVALID, 'Sports category is invalid', context, 400);
  }
}
export class SportsPayoutAmountInvalidError extends FjnSportsPoolError {
  constructor(context?: FjnErrorContext) {
    super(SPORTS_POOL_ERROR_CODES.PAYOUT_AMOUNT_INVALID, 'Payout amount is invalid', context, 400);
  }
}
