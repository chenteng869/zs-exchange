/**
 * Release Claim Service - 错误码 + 异常类
 */

import { FjnError, FjnErrorContext } from '../errors';

export const RELEASE_ERROR_CODES = {
  // Pool
  RELEASE_POOL_NOT_FOUND: 'RELEASE_POOL_NOT_FOUND',
  RELEASE_POOL_EXISTS: 'RELEASE_POOL_EXISTS',
  RELEASE_POOL_STATUS_INVALID: 'RELEASE_POOL_STATUS_INVALID',
  RELEASE_POOL_NOT_APPROVABLE: 'RELEASE_POOL_NOT_APPROVABLE',
  RELEASE_POOL_NOT_CLAIMABLE: 'RELEASE_POOL_NOT_CLAIMABLE',
  RELEASE_POOL_ALREADY_CLOSED: 'RELEASE_POOL_ALREADY_CLOSED',
  RELEASE_POOL_ALREADY_CANCELLED: 'RELEASE_POOL_ALREADY_CANCELLED',
  RELEASE_POOL_TOTAL_INVALID: 'RELEASE_POOL_TOTAL_INVALID',
  RELEASE_POOL_PERIOD_INVALID: 'RELEASE_POOL_PERIOD_INVALID',
  RELEASE_POOL_NAME_REQUIRED: 'RELEASE_POOL_NAME_REQUIRED',
  RELEASE_POOL_TYPE_INVALID: 'RELEASE_POOL_TYPE_INVALID',
  RELEASE_POOL_APPROVER_REQUIRED: 'RELEASE_POOL_APPROVER_REQUIRED',
  RELEASE_POOL_MERKLE_ROOT_REQUIRED: 'RELEASE_POOL_MERKLE_ROOT_REQUIRED',

  // Calculation
  RELEASE_CALCULATION_NOT_FOUND: 'RELEASE_CALCULATION_NOT_FOUND',
  RELEASE_CALCULATION_EXISTS: 'RELEASE_CALCULATION_EXISTS',
  RELEASE_CALCULATION_STATUS_INVALID: 'RELEASE_CALCULATION_STATUS_INVALID',
  RELEASE_CALCULATION_NOT_APPROVABLE: 'RELEASE_CALCULATION_NOT_APPROVABLE',
  RELEASE_CALCULATION_RATIO_INVALID: 'RELEASE_CALCULATION_RATIO_INVALID',
  RELEASE_CALCULATION_AMOUNT_INVALID: 'RELEASE_CALCULATION_AMOUNT_INVALID',
  RELEASE_CALCULATION_MONTHLY_CAP_EXCEEDED: 'RELEASE_CALCULATION_MONTHLY_CAP_EXCEEDED',
  RELEASE_CALCULATION_RISK_BLOCKED: 'RELEASE_CALCULATION_RISK_BLOCKED',
  RELEASE_CALCULATION_USER_ID_REQUIRED: 'RELEASE_CALCULATION_USER_ID_REQUIRED',
  RELEASE_CALCULATION_EFFECTIVE_POWER_INVALID: 'RELEASE_CALCULATION_EFFECTIVE_POWER_INVALID',
  RELEASE_CALCULATION_NETWORK_TOTAL_INVALID: 'RELEASE_CALCULATION_NETWORK_TOTAL_INVALID',
  RELEASE_CALCULATION_PRECISION_LOSS: 'RELEASE_CALCULATION_PRECISION_LOSS',

  // Claim
  RELEASE_CLAIM_NOT_FOUND: 'RELEASE_CLAIM_NOT_FOUND',
  RELEASE_CLAIM_STATUS_INVALID: 'RELEASE_CLAIM_STATUS_INVALID',
  RELEASE_CLAIM_NOT_CLAIMABLE: 'RELEASE_CLAIM_NOT_CLAIMABLE',
  RELEASE_CLAIM_ALREADY_CLAIMED: 'RELEASE_CLAIM_ALREADY_CLAIMED',
  RELEASE_CLAIM_EXPIRED: 'RELEASE_CLAIM_EXPIRED',
  RELEASE_CLAIM_RISK_HOLD: 'RELEASE_CLAIM_RISK_HOLD',
  RELEASE_CLAIM_MERKLE_PROOF_INVALID: 'RELEASE_CLAIM_MERKLE_PROOF_INVALID',
  RELEASE_CLAIM_TX_HASH_DUPLICATE: 'RELEASE_CLAIM_TX_HASH_DUPLICATE',
  RELEASE_CLAIM_AMOUNT_EXCEEDS_CLAIMABLE: 'RELEASE_CLAIM_AMOUNT_EXCEEDS_CLAIMABLE',
  RELEASE_CLAIM_AMOUNT_INVALID: 'RELEASE_CLAIM_AMOUNT_INVALID',
  RELEASE_CLAIM_BLOCK_NUMBER_INVALID: 'RELEASE_CLAIM_BLOCK_NUMBER_INVALID',
  RELEASE_CLAIM_SOLANA_FAILED: 'RELEASE_CLAIM_SOLANA_FAILED',
  RELEASE_CLAIM_USER_QUOTA_EXCEEDED: 'RELEASE_CLAIM_USER_QUOTA_EXCEEDED',

  // Quota
  RELEASE_QUOTA_NOT_FOUND: 'RELEASE_QUOTA_NOT_FOUND',
  RELEASE_QUOTA_INSUFFICIENT: 'RELEASE_QUOTA_INSUFFICIENT',
  RELEASE_QUOTA_PERIOD_INVALID: 'RELEASE_QUOTA_PERIOD_INVALID',

  // General
  RELEASE_USER_ID_REQUIRED: 'RELEASE_USER_ID_REQUIRED',
  RELEASE_CURRENCY_INVALID: 'RELEASE_CURRENCY_INVALID',
} as const;

export type FjnReleaseErrorCode = (typeof RELEASE_ERROR_CODES)[keyof typeof RELEASE_ERROR_CODES];

export class FjnReleaseError extends FjnError {
  constructor(code: FjnReleaseErrorCode, message: string, context?: FjnErrorContext, httpStatus?: number) {
    super({ code: code as any, message, context, httpStatus });
    this.name = 'FjnReleaseError';
  }
}

// Pool
export class ReleasePoolNotFoundError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_POOL_NOT_FOUND, 'Release pool not found', context, 404);
  }
}
export class ReleasePoolExistsError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_POOL_EXISTS, 'Release pool already exists', context, 409);
  }
}
export class ReleasePoolStatusInvalidError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_POOL_STATUS_INVALID, 'Release pool status invalid for operation', context, 409);
  }
}
export class ReleasePoolNotApprovableError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_POOL_NOT_APPROVABLE, 'Release pool is not approvable', context, 409);
  }
}
export class ReleasePoolNotClaimableError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_POOL_NOT_CLAIMABLE, 'Release pool is not open for claim', context, 409);
  }
}
export class ReleasePoolAlreadyClosedError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_POOL_ALREADY_CLOSED, 'Release pool is already closed', context, 409);
  }
}
export class ReleasePoolAlreadyCancelledError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_POOL_ALREADY_CANCELLED, 'Release pool is already cancelled', context, 409);
  }
}
export class ReleasePoolTotalInvalidError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_POOL_TOTAL_INVALID, 'Release pool total amount is invalid', context, 400);
  }
}
export class ReleasePoolPeriodInvalidError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_POOL_PERIOD_INVALID, 'Release pool period format is invalid (expected YYYY-MM)', context, 400);
  }
}
export class ReleasePoolNameRequiredError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_POOL_NAME_REQUIRED, 'Release pool name is required', context, 400);
  }
}
export class ReleasePoolTypeInvalidError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_POOL_TYPE_INVALID, 'Release pool type is invalid', context, 400);
  }
}
export class ReleasePoolApproverRequiredError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_POOL_APPROVER_REQUIRED, 'Release pool approver is required', context, 400);
  }
}
export class ReleasePoolMerkleRootRequiredError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_POOL_MERKLE_ROOT_REQUIRED, 'Release pool merkle root is required', context, 400);
  }
}

// Calculation
export class ReleaseCalculationNotFoundError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CALCULATION_NOT_FOUND, 'Release calculation not found', context, 404);
  }
}
export class ReleaseCalculationExistsError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CALCULATION_EXISTS, 'Release calculation already exists for this user+pool', context, 409);
  }
}
export class ReleaseCalculationStatusInvalidError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CALCULATION_STATUS_INVALID, 'Release calculation status invalid', context, 409);
  }
}
export class ReleaseCalculationNotApprovableError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CALCULATION_NOT_APPROVABLE, 'Release calculation is not approvable', context, 409);
  }
}
export class ReleaseCalculationRatioInvalidError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CALCULATION_RATIO_INVALID, 'Release calculation user ratio is invalid', context, 422);
  }
}
export class ReleaseCalculationAmountInvalidError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CALCULATION_AMOUNT_INVALID, 'Release calculation amount is invalid', context, 422);
  }
}
export class ReleaseCalculationMonthlyCapExceededError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CALCULATION_MONTHLY_CAP_EXCEEDED, 'Release calculation exceeds monthly cap', context, 422);
  }
}
export class ReleaseCalculationRiskBlockedError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CALCULATION_RISK_BLOCKED, 'Release calculation risk blocked', context, 403);
  }
}
export class ReleaseCalculationUserIdRequiredError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CALCULATION_USER_ID_REQUIRED, 'Release calculation userId is required', context, 400);
  }
}
export class ReleaseCalculationEffectivePowerInvalidError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CALCULATION_EFFECTIVE_POWER_INVALID, 'Release calculation effective power is invalid', context, 400);
  }
}
export class ReleaseCalculationNetworkTotalInvalidError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CALCULATION_NETWORK_TOTAL_INVALID, 'Release calculation network total power is invalid', context, 400);
  }
}
export class ReleaseCalculationPrecisionLossError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CALCULATION_PRECISION_LOSS, 'Release calculation precision loss detected', context, 500);
  }
}

// Claim
export class ReleaseClaimNotFoundError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CLAIM_NOT_FOUND, 'Release claim not found', context, 404);
  }
}
export class ReleaseClaimStatusInvalidError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CLAIM_STATUS_INVALID, 'Release claim status invalid', context, 409);
  }
}
export class ReleaseClaimNotClaimableError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CLAIM_NOT_CLAIMABLE, 'Release claim is not claimable', context, 409);
  }
}
export class ReleaseClaimAlreadyClaimedError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CLAIM_ALREADY_CLAIMED, 'Release claim is already claimed', context, 409);
  }
}
export class ReleaseClaimExpiredError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CLAIM_EXPIRED, 'Release claim is expired', context, 410);
  }
}
export class ReleaseClaimRiskHoldError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CLAIM_RISK_HOLD, 'Release claim is on risk hold', context, 403);
  }
}
export class ReleaseClaimMerkleProofInvalidError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CLAIM_MERKLE_PROOF_INVALID, 'Release claim merkle proof is invalid', context, 422);
  }
}
export class ReleaseClaimTxHashDuplicateError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CLAIM_TX_HASH_DUPLICATE, 'Release claim txHash is duplicated', context, 409);
  }
}
export class ReleaseClaimAmountExceedsClaimableError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CLAIM_AMOUNT_EXCEEDS_CLAIMABLE, 'Release claim amount exceeds claimable', context, 422);
  }
}
export class ReleaseClaimAmountInvalidError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CLAIM_AMOUNT_INVALID, 'Release claim amount is invalid', context, 400);
  }
}
export class ReleaseClaimBlockNumberInvalidError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CLAIM_BLOCK_NUMBER_INVALID, 'Release claim blockNumber is invalid', context, 400);
  }
}
export class ReleaseClaimSolanaFailedError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CLAIM_SOLANA_FAILED, 'Solana on-chain release claim failed', context, 502);
  }
}
export class ReleaseClaimUserQuotaExceededError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CLAIM_USER_QUOTA_EXCEEDED, 'Release claim user quota exceeded', context, 422);
  }
}

// Quota
export class ReleaseQuotaNotFoundError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_QUOTA_NOT_FOUND, 'Release user quota not found', context, 404);
  }
}
export class ReleaseQuotaInsufficientError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_QUOTA_INSUFFICIENT, 'Release user quota insufficient', context, 422);
  }
}
export class ReleaseQuotaPeriodInvalidError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_QUOTA_PERIOD_INVALID, 'Release user quota period is invalid', context, 400);
  }
}

// General
export class ReleaseUserIdRequiredError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_USER_ID_REQUIRED, 'Release userId is required', context, 400);
  }
}
export class ReleaseCurrencyInvalidError extends FjnReleaseError {
  constructor(context?: FjnErrorContext) {
    super(RELEASE_ERROR_CODES.RELEASE_CURRENCY_INVALID, 'Release currency is invalid', context, 400);
  }
}
