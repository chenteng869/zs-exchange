/**
 * Sports Compliance Service - 错误码 + 异常类
 *
 * 工业级 Solana-first 架构
 */

import { FjnError, FjnErrorContext } from '../errors';

export const SPORTS_COMPLIANCE_ERROR_CODES = {
  CHECK_NOT_FOUND: 'SPORTS_COMPLIANCE_CHECK_NOT_FOUND',
  CHECK_TYPE_INVALID: 'SPORTS_COMPLIANCE_CHECK_TYPE_INVALID',
  RESULT_INVALID: 'SPORTS_COMPLIANCE_RESULT_INVALID',
  USER_ID_REQUIRED: 'SPORTS_COMPLIANCE_USER_ID_REQUIRED',
  EVENT_ID_REQUIRED: 'SPORTS_COMPLIANCE_EVENT_ID_REQUIRED',
  REGION_BLOCKED: 'SPORTS_COMPLIANCE_REGION_BLOCKED',
  REGION_CODE_INVALID: 'SPORTS_COMPLIANCE_REGION_CODE_INVALID',
  AGE_REJECTED: 'SPORTS_COMPLIANCE_AGE_REJECTED',
  AGE_INVALID: 'SPORTS_COMPLIANCE_AGE_INVALID',
  KYC_INSUFFICIENT: 'SPORTS_COMPLIANCE_KYC_INSUFFICIENT',
  KYC_LEVEL_INVALID: 'SPORTS_COMPLIANCE_KYC_LEVEL_INVALID',
  SANCTIONS_HIT: 'SPORTS_COMPLIANCE_SANCTIONS_HIT',
  PEP_HIT: 'SPORTS_COMPLIANCE_PEP_HIT',
  RISK_BLOCKED: 'SPORTS_COMPLIANCE_RISK_BLOCKED',
  RISK_SCORE_INVALID: 'SPORTS_COMPLIANCE_RISK_SCORE_INVALID',
  LIMIT_EXCEEDED: 'SPORTS_COMPLIANCE_LIMIT_EXCEEDED',
  LIMIT_INVALID: 'SPORTS_COMPLIANCE_LIMIT_INVALID',
  REVIEWER_REQUIRED: 'SPORTS_COMPLIANCE_REVIEWER_REQUIRED',
  REVIEW_INVALID_STATE: 'SPORTS_COMPLIANCE_REVIEW_INVALID_STATE',
  DECISION_INVALID: 'SPORTS_COMPLIANCE_DECISION_INVALID',
  EVENT_NOT_FOUND: 'SPORTS_COMPLIANCE_EVENT_NOT_FOUND',
} as const;

export type FjnSportsComplianceErrorCode =
  (typeof SPORTS_COMPLIANCE_ERROR_CODES)[keyof typeof SPORTS_COMPLIANCE_ERROR_CODES];

export class FjnSportsComplianceError extends FjnError {
  constructor(
    code: FjnSportsComplianceErrorCode,
    message: string,
    context?: FjnErrorContext,
    httpStatus?: number,
  ) {
    super({ code: code as any, message, context, httpStatus });
    this.name = 'FjnSportsComplianceError';
  }
}

export class SportsComplianceCheckNotFoundError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.CHECK_NOT_FOUND,
      'Sports compliance check not found',
      context,
      404,
    );
  }
}

export class SportsComplianceCheckTypeInvalidError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.CHECK_TYPE_INVALID,
      'Sports compliance check type is invalid',
      context,
      400,
    );
  }
}

export class SportsComplianceResultInvalidError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.RESULT_INVALID,
      'Sports compliance result is invalid',
      context,
      400,
    );
  }
}

export class SportsComplianceUserIdRequiredError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.USER_ID_REQUIRED,
      'Sports compliance userId is required',
      context,
      400,
    );
  }
}

export class SportsComplianceEventIdRequiredError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.EVENT_ID_REQUIRED,
      'Sports compliance eventId is required',
      context,
      400,
    );
  }
}

export class SportsComplianceRegionBlockedError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.REGION_BLOCKED,
      'Sports betting is blocked in this region',
      context,
      451,
    );
  }
}

export class SportsComplianceRegionCodeInvalidError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.REGION_CODE_INVALID,
      'Region code is invalid (must be ISO-3166-1 alpha-2)',
      context,
      400,
    );
  }
}

export class SportsComplianceAgeRejectedError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.AGE_REJECTED,
      'User does not meet minimum age requirement',
      context,
      451,
    );
  }
}

export class SportsComplianceAgeInvalidError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.AGE_INVALID,
      'Age is invalid (must be non-negative integer)',
      context,
      400,
    );
  }
}

export class SportsComplianceKycInsufficientError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.KYC_INSUFFICIENT,
      'KYC level is insufficient for this sports operation',
      context,
      451,
    );
  }
}

export class SportsComplianceKycLevelInvalidError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.KYC_LEVEL_INVALID,
      'KYC level is invalid',
      context,
      400,
    );
  }
}

export class SportsComplianceSanctionsHitError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.SANCTIONS_HIT,
      'User is on a sanctions list',
      context,
      451,
    );
  }
}

export class SportsCompliancePepHitError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.PEP_HIT,
      'User is a politically exposed person (PEP)',
      context,
      451,
    );
  }
}

export class SportsComplianceRiskBlockedError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.RISK_BLOCKED,
      'Risk score is too high, sports operation is blocked',
      context,
      451,
    );
  }
}

export class SportsComplianceRiskScoreInvalidError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.RISK_SCORE_INVALID,
      'Risk score is invalid (must be 0-100)',
      context,
      400,
    );
  }
}

export class SportsComplianceLimitExceededError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.LIMIT_EXCEEDED,
      'Sports betting limit exceeded',
      context,
      422,
    );
  }
}

export class SportsComplianceLimitInvalidError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.LIMIT_INVALID,
      'Limit value is invalid (must be positive decimal string)',
      context,
      400,
    );
  }
}

export class SportsComplianceReviewerRequiredError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.REVIEWER_REQUIRED,
      'Compliance reviewer is required for review action',
      context,
      400,
    );
  }
}

export class SportsComplianceReviewInvalidStateError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.REVIEW_INVALID_STATE,
      'Compliance check cannot be reviewed in current state',
      context,
      409,
    );
  }
}

export class SportsComplianceDecisionInvalidError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.DECISION_INVALID,
      'Compliance decision is invalid',
      context,
      400,
    );
  }
}

export class SportsComplianceEventNotFoundError extends FjnSportsComplianceError {
  constructor(context?: FjnErrorContext) {
    super(
      SPORTS_COMPLIANCE_ERROR_CODES.EVENT_NOT_FOUND,
      'Sports event not found',
      context,
      404,
    );
  }
}
