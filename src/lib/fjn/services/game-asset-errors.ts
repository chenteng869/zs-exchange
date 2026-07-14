/**
 * Game Asset Service - 错误码 + 异常类
 */

import { FjnError, FjnErrorContext } from '../errors';

export const GAME_ASSET_ERROR_CODES = {
  GAME_ASSET_NOT_FOUND: 'GAME_ASSET_NOT_FOUND',
  GAME_ASSET_NOT_OWNED: 'GAME_ASSET_NOT_OWNED',
  GAME_ASSET_LOCKED: 'GAME_ASSET_LOCKED',
  GAME_ASSET_DESTROYED: 'GAME_ASSET_DESTROYED',
  GAME_ASSET_NOT_CONSUMABLE: 'GAME_ASSET_NOT_CONSUMABLE',
  GAME_ASSET_NOT_TRADEABLE: 'GAME_ASSET_NOT_TRADEABLE',
  GAME_ASSET_NOT_UPGRADABLE: 'GAME_ASSET_NOT_UPGRADABLE',
  GAME_ASSET_NOT_AVAILABLE: 'GAME_ASSET_NOT_AVAILABLE',
  GAME_ASSET_KIND_INVALID: 'GAME_ASSET_KIND_INVALID',
  GAME_ASSET_RARITY_INVALID: 'GAME_ASSET_RARITY_INVALID',
  GAME_ASSET_STATUS_INVALID: 'GAME_ASSET_STATUS_INVALID',
  GAME_ASSET_OPERATION_INVALID: 'GAME_ASSET_OPERATION_INVALID',
  GAME_ASSET_QUANTITY_INVALID: 'GAME_ASSET_QUANTITY_INVALID',
  GAME_ASSET_QUANTITY_INSUFFICIENT: 'GAME_ASSET_QUANTITY_INSUFFICIENT',
  GAME_ASSET_MAX_LEVEL_REACHED: 'GAME_ASSET_MAX_LEVEL_REACHED',
  GAME_ASSET_TX_HASH_DUPLICATE: 'GAME_ASSET_TX_HASH_DUPLICATE',
  GAME_ASSET_SOLANA_FAILED: 'GAME_ASSET_SOLANA_FAILED',
  GAME_ASSET_USER_ID_REQUIRED: 'GAME_ASSET_USER_ID_REQUIRED',
  GAME_ASSET_TRANSFER_RESTRICTED: 'GAME_ASSET_TRANSFER_RESTRICTED',
} as const;

export type FjnGameAssetErrorCode = (typeof GAME_ASSET_ERROR_CODES)[keyof typeof GAME_ASSET_ERROR_CODES];

export class FjnGameAssetError extends FjnError {
  constructor(code: FjnGameAssetErrorCode, message: string, context?: FjnErrorContext, httpStatus?: number) {
    super({ code: code as any, message, context, httpStatus });
    this.name = 'FjnGameAssetError';
  }
}

export class GameAssetNotFoundError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_NOT_FOUND, 'Game asset not found', context, 404);
  }
}
export class GameAssetNotOwnedError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_NOT_OWNED, 'Game asset is not owned by user', context, 403);
  }
}
export class GameAssetLockedError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_LOCKED, 'Game asset is locked', context, 423);
  }
}
export class GameAssetDestroyedError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_DESTROYED, 'Game asset is destroyed', context, 410);
  }
}
export class GameAssetNotConsumableError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_NOT_CONSUMABLE, 'Game asset is not consumable', context, 422);
  }
}
export class GameAssetNotTradeableError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_NOT_TRADEABLE, 'Game asset is not tradeable', context, 422);
  }
}
export class GameAssetNotUpgradableError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_NOT_UPGRADABLE, 'Game asset is not upgradable', context, 422);
  }
}
export class GameAssetNotAvailableError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_NOT_AVAILABLE, 'Game asset is not available', context, 409);
  }
}
export class GameAssetKindInvalidError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_KIND_INVALID, 'Game asset kind is invalid', context, 400);
  }
}
export class GameAssetRarityInvalidError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_RARITY_INVALID, 'Game asset rarity is invalid', context, 400);
  }
}
export class GameAssetStatusInvalidError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_STATUS_INVALID, 'Game asset status is invalid', context, 409);
  }
}
export class GameAssetOperationInvalidError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_OPERATION_INVALID, 'Game asset operation is invalid', context, 400);
  }
}
export class GameAssetQuantityInvalidError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_QUANTITY_INVALID, 'Game asset quantity is invalid', context, 400);
  }
}
export class GameAssetQuantityInsufficientError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_QUANTITY_INSUFFICIENT, 'Game asset quantity is insufficient', context, 422);
  }
}
export class GameAssetMaxLevelReachedError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_MAX_LEVEL_REACHED, 'Game asset max level reached', context, 422);
  }
}
export class GameAssetTxHashDuplicateError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_TX_HASH_DUPLICATE, 'Game asset txHash is duplicated', context, 409);
  }
}
export class GameAssetSolanaFailedError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_SOLANA_FAILED, 'Solana on-chain game asset operation failed', context, 502);
  }
}
export class GameAssetUserIdRequiredError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_USER_ID_REQUIRED, 'Game asset userId is required', context, 400);
  }
}
export class GameAssetTransferRestrictedError extends FjnGameAssetError {
  constructor(context?: FjnErrorContext) {
    super(GAME_ASSET_ERROR_CODES.GAME_ASSET_TRANSFER_RESTRICTED, 'Game asset transfer is restricted', context, 403);
  }
}
