/**
 * WinePass NFT Service - 错误码 + 异常类
 */

import { FjnError, FjnErrorContext } from '../errors';

export const WINEPASS_NFT_ERROR_CODES = {
  WINEPASS_COLLECTION_NOT_FOUND: 'WINEPASS_COLLECTION_NOT_FOUND',
  WINEPASS_COLLECTION_EXISTS: 'WINEPASS_COLLECTION_EXISTS',
  WINEPASS_COLLECTION_PAUSED: 'WINEPASS_COLLECTION_PAUSED',
  WINEPASS_COLLECTION_DEPRECATED: 'WINEPASS_COLLECTION_DEPRECATED',
  WINEPASS_COLLECTION_SUPPLY_EXCEEDED: 'WINEPASS_COLLECTION_SUPPLY_EXCEEDED',
  WINEPASS_COLLECTION_NAME_REQUIRED: 'WINEPASS_COLLECTION_NAME_REQUIRED',
  WINEPASS_COLLECTION_SYMBOL_INVALID: 'WINEPASS_COLLECTION_SYMBOL_INVALID',
  WINEPASS_COLLECTION_TYPE_INVALID: 'WINEPASS_COLLECTION_TYPE_INVALID',

  WINEPASS_ASSET_NOT_FOUND: 'WINEPASS_ASSET_NOT_FOUND',
  WINEPASS_ASSET_NOT_OWNED: 'WINEPASS_ASSET_NOT_OWNED',
  WINEPASS_ASSET_NOT_MINTED: 'WINEPASS_ASSET_NOT_MINTED',
  WINEPASS_ASSET_ALREADY_MINTED: 'WINEPASS_ASSET_ALREADY_MINTED',
  WINEPASS_ASSET_FROZEN: 'WINEPASS_ASSET_FROZEN',
  WINEPASS_ASSET_BURNED: 'WINEPASS_ASSET_BURNED',
  WINEPASS_ASSET_NOT_UPGRADABLE: 'WINEPASS_ASSET_NOT_UPGRADABLE',
  WINEPASS_ASSET_MAX_LEVEL: 'WINEPASS_ASSET_MAX_LEVEL',
  WINEPASS_ASSET_INVALID_LEVEL: 'WINEPASS_ASSET_INVALID_LEVEL',
  WINEPASS_ASSET_TOKEN_ID_MISSING: 'WINEPASS_ASSET_TOKEN_ID_MISSING',
  WINEPASS_ASSET_TRANSFER_RESTRICTED: 'WINEPASS_ASSET_TRANSFER_RESTRICTED',

  WINEPASS_UPGRADE_NOT_FOUND: 'WINEPASS_UPGRADE_NOT_FOUND',
  WINEPASS_UPGRADE_ALREADY_PAID: 'WINEPASS_UPGRADE_ALREADY_PAID',
  WINEPASS_UPGRADE_NOT_EXECUTABLE: 'WINEPASS_UPGRADE_NOT_EXECUTABLE',
  WINEPASS_UPGRADE_NOT_CANCELLABLE: 'WINEPASS_UPGRADE_NOT_CANCELLABLE',
  WINEPASS_UPGRADE_AMOUNT_INVALID: 'WINEPASS_UPGRADE_AMOUNT_INVALID',
  WINEPASS_UPGRADE_PAYMENT_INVALID: 'WINEPASS_UPGRADE_PAYMENT_INVALID',

  WINEPASS_BENEFIT_TYPE_INVALID: 'WINEPASS_BENEFIT_TYPE_INVALID',
  WINEPASS_BENEFIT_AMOUNT_INVALID: 'WINEPASS_BENEFIT_AMOUNT_INVALID',

  WINEPASS_OWNERSHIP_NOT_FOUND: 'WINEPASS_OWNERSHIP_NOT_FOUND',
  WINEPASS_OWNERSHIP_TRANSFER_NOT_ALLOWED: 'WINEPASS_OWNERSHIP_TRANSFER_NOT_ALLOWED',

  WINEPASS_CHAIN_RECORD_NOT_FOUND: 'WINEPASS_CHAIN_RECORD_NOT_FOUND',
  WINEPASS_CHAIN_RECORD_TX_HASH_DUPLICATE: 'WINEPASS_CHAIN_RECORD_TX_HASH_DUPLICATE',

  WINEPASS_SOLANA_NFT_MINT_FAILED: 'WINEPASS_SOLANA_NFT_MINT_FAILED',
  WINEPASS_SOLANA_NFT_TRANSFER_FAILED: 'WINEPASS_SOLANA_NFT_TRANSFER_FAILED',
  WINEPASS_SOLANA_NFT_BURN_FAILED: 'WINEPASS_SOLANA_NFT_BURN_FAILED',
} as const;

export type FjnWinepassNftErrorCode = (typeof WINEPASS_NFT_ERROR_CODES)[keyof typeof WINEPASS_NFT_ERROR_CODES];

export class FjnWinepassNftError extends FjnError {
  constructor(code: FjnWinepassNftErrorCode, message: string, context?: FjnErrorContext, httpStatus?: number) {
    super({ code: code as any, message, context, httpStatus });
    this.name = 'FjnWinepassNftError';
  }
}

export class WinepassCollectionNotFoundError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_COLLECTION_NOT_FOUND, 'WinePass NFT collection not found', context, 404);
  }
}
export class WinepassCollectionExistsError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_COLLECTION_EXISTS, 'WinePass NFT collection already exists', context, 409);
  }
}
export class WinepassCollectionPausedError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_COLLECTION_PAUSED, 'WinePass NFT collection is paused', context, 423);
  }
}
export class WinepassCollectionSupplyExceededError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_COLLECTION_SUPPLY_EXCEEDED, 'WinePass NFT collection supply exceeded', context, 422);
  }
}
export class WinepassCollectionNameRequiredError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_COLLECTION_NAME_REQUIRED, 'WinePass NFT collection name is required', context, 400);
  }
}
export class WinepassCollectionSymbolInvalidError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_COLLECTION_SYMBOL_INVALID, 'WinePass NFT collection symbol is invalid', context, 400);
  }
}
export class WinepassCollectionTypeInvalidError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_COLLECTION_TYPE_INVALID, 'WinePass NFT collection type is invalid', context, 400);
  }
}
export class WinepassAssetNotFoundError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_ASSET_NOT_FOUND, 'WinePass NFT asset not found', context, 404);
  }
}
export class WinepassAssetNotOwnedError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_ASSET_NOT_OWNED, 'WinePass NFT asset is not owned by user', context, 403);
  }
}
export class WinepassAssetNotMintedError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_ASSET_NOT_MINTED, 'WinePass NFT asset is not minted yet', context, 409);
  }
}
export class WinepassAssetAlreadyMintedError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_ASSET_ALREADY_MINTED, 'WinePass NFT asset is already minted', context, 409);
  }
}
export class WinepassAssetFrozenError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_ASSET_FROZEN, 'WinePass NFT asset is frozen', context, 423);
  }
}
export class WinepassAssetBurnedError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_ASSET_BURNED, 'WinePass NFT asset is burned', context, 410);
  }
}
export class WinepassAssetNotUpgradableError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_ASSET_NOT_UPGRADABLE, 'WinePass NFT asset is not upgradable', context, 422);
  }
}
export class WinepassAssetMaxLevelError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_ASSET_MAX_LEVEL, 'WinePass NFT asset is at max level', context, 422);
  }
}
export class WinepassAssetInvalidLevelError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_ASSET_INVALID_LEVEL, 'WinePass NFT asset level is invalid', context, 400);
  }
}
export class WinepassAssetTokenIdMissingError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_ASSET_TOKEN_ID_MISSING, 'WinePass NFT asset tokenId is missing', context, 422);
  }
}
export class WinepassAssetTransferRestrictedError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_ASSET_TRANSFER_RESTRICTED, 'WinePass NFT asset transfer is restricted', context, 403);
  }
}
export class WinepassUpgradeNotFoundError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_UPGRADE_NOT_FOUND, 'WinePass NFT upgrade order not found', context, 404);
  }
}
export class WinepassUpgradeNotExecutableError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_UPGRADE_NOT_EXECUTABLE, 'WinePass NFT upgrade is not executable', context, 409);
  }
}
export class WinepassUpgradeNotCancellableError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_UPGRADE_NOT_CANCELLABLE, 'WinePass NFT upgrade is not cancellable', context, 409);
  }
}
export class WinepassUpgradeAmountInvalidError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_UPGRADE_AMOUNT_INVALID, 'WinePass NFT upgrade amount is invalid', context, 400);
  }
}
export class WinepassUpgradePaymentInvalidError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_UPGRADE_PAYMENT_INVALID, 'WinePass NFT upgrade payment type is invalid', context, 400);
  }
}
export class WinepassBenefitTypeInvalidError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_BENEFIT_TYPE_INVALID, 'WinePass NFT benefit type is invalid', context, 400);
  }
}
export class WinepassBenefitAmountInvalidError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_BENEFIT_AMOUNT_INVALID, 'WinePass NFT benefit amount is invalid', context, 400);
  }
}
export class WinepassOwnershipTransferNotAllowedError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_OWNERSHIP_TRANSFER_NOT_ALLOWED, 'WinePass NFT asset transfer is not allowed', context, 403);
  }
}
export class WinepassChainRecordNotFoundError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_CHAIN_RECORD_NOT_FOUND, 'WinePass NFT chain record not found', context, 404);
  }
}
export class WinepassChainRecordTxHashDuplicateError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_CHAIN_RECORD_TX_HASH_DUPLICATE, 'WinePass NFT chain record txHash already exists', context, 409);
  }
}
export class WinepassCollectionDeprecatedError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_COLLECTION_DEPRECATED, 'WinePass NFT collection is deprecated', context, 410);
  }
}
export class WinepassUpgradeAlreadyPaidError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_UPGRADE_ALREADY_PAID, 'WinePass NFT upgrade order is already paid', context, 409);
  }
}
export class WinepassOwnershipNotFoundError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_OWNERSHIP_NOT_FOUND, 'WinePass NFT ownership record not found', context, 404);
  }
}
export class WinepassSolanaNftMintFailedError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_SOLANA_NFT_MINT_FAILED, 'Solana on-chain WinePass NFT mint failed', context, 502);
  }
}
export class WinepassSolanaNftTransferFailedError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_SOLANA_NFT_TRANSFER_FAILED, 'Solana on-chain WinePass NFT transfer failed', context, 502);
  }
}
export class WinepassSolanaNftBurnFailedError extends FjnWinepassNftError {
  constructor(context?: FjnErrorContext) {
    super(WINEPASS_NFT_ERROR_CODES.WINEPASS_SOLANA_NFT_BURN_FAILED, 'Solana on-chain WinePass NFT burn failed', context, 502);
  }
}
