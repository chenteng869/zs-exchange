/**
 * NFT Platform Service - 错误码 + 异常类
 */

import { FjnError, FjnErrorContext } from '../errors';

export const NFT_PLATFORM_ERROR_CODES = {
  NFT_PLATFORM_LISTING_NOT_FOUND: 'NFT_PLATFORM_LISTING_NOT_FOUND',
  NFT_PLATFORM_LISTING_NOT_ACTIVE: 'NFT_PLATFORM_LISTING_NOT_ACTIVE',
  NFT_PLATFORM_LISTING_NOT_PAUSED: 'NFT_PLATFORM_LISTING_NOT_PAUSED',
  NFT_PLATFORM_LISTING_SOLD_OUT: 'NFT_PLATFORM_LISTING_SOLD_OUT',
  NFT_PLATFORM_LISTING_EXPIRED: 'NFT_PLATFORM_LISTING_EXPIRED',
  NFT_PLATFORM_LISTING_CANCELLED: 'NFT_PLATFORM_LISTING_CANCELLED',
  NFT_PLATFORM_LISTING_KIND_INVALID: 'NFT_PLATFORM_LISTING_KIND_INVALID',
  NFT_PLATFORM_LISTING_PRICE_INVALID: 'NFT_PLATFORM_LISTING_PRICE_INVALID',
  NFT_PLATFORM_LISTING_CURRENCY_INVALID: 'NFT_PLATFORM_LISTING_CURRENCY_INVALID',
  NFT_PLATFORM_LISTING_QUANTITY_INVALID: 'NFT_PLATFORM_LISTING_QUANTITY_INVALID',
  NFT_PLATFORM_LISTING_NOT_OWNED: 'NFT_PLATFORM_LISTING_NOT_OWNED',

  NFT_PLATFORM_TRADE_NOT_FOUND: 'NFT_PLATFORM_TRADE_NOT_FOUND',
  NFT_PLATFORM_TRADE_STATUS_INVALID: 'NFT_PLATFORM_TRADE_STATUS_INVALID',
  NFT_PLATFORM_TRADE_TYPE_INVALID: 'NFT_PLATFORM_TRADE_TYPE_INVALID',
  NFT_PLATFORM_TRADE_AMOUNT_INVALID: 'NFT_PLATFORM_TRADE_AMOUNT_INVALID',
  NFT_PLATFORM_TRADE_NOT_PAYABLE: 'NFT_PLATFORM_TRADE_NOT_PAYABLE',
  NFT_PLATFORM_TRADE_ALREADY_PAID: 'NFT_PLATFORM_TRADE_ALREADY_PAID',
  NFT_PLATFORM_TRADE_BUYER_REQUIRED: 'NFT_PLATFORM_TRADE_BUYER_REQUIRED',
  NFT_PLATFORM_TRADE_SELLER_REQUIRED: 'NFT_PLATFORM_TRADE_SELLER_REQUIRED',
  NFT_PLATFORM_TRADE_TX_HASH_DUPLICATE: 'NFT_PLATFORM_TRADE_TX_HASH_DUPLICATE',
  NFT_PLATFORM_TRADE_SOLANA_FAILED: 'NFT_PLATFORM_TRADE_SOLANA_FAILED',

  NFT_PLATFORM_ROYALTY_INVALID: 'NFT_PLATFORM_ROYALTY_INVALID',
  NFT_PLATFORM_ROYALTY_EXCEEDS_MAX: 'NFT_PLATFORM_ROYALTY_EXCEEDS_MAX',
  NFT_PLATFORM_ROYALTY_RECIPIENT_REQUIRED: 'NFT_PLATFORM_ROYALTY_RECIPIENT_REQUIRED',

  NFT_PLATFORM_COLLECTION_NOT_FOUND: 'NFT_PLATFORM_COLLECTION_NOT_FOUND',
  NFT_PLATFORM_ASSET_NOT_FOUND: 'NFT_PLATFORM_ASSET_NOT_FOUND',
  NFT_PLATFORM_KIND_INVALID: 'NFT_PLATFORM_KIND_INVALID',
  NFT_PLATFORM_USER_ID_REQUIRED: 'NFT_PLATFORM_USER_ID_REQUIRED',
} as const;

export type FjnNftPlatformErrorCode =
  (typeof NFT_PLATFORM_ERROR_CODES)[keyof typeof NFT_PLATFORM_ERROR_CODES];

export class FjnNftPlatformError extends FjnError {
  constructor(code: FjnNftPlatformErrorCode, message: string, context?: FjnErrorContext, httpStatus?: number) {
    super({ code: code as any, message, context, httpStatus });
    this.name = 'FjnNftPlatformError';
  }
}

export class NftPlatformListingNotFoundError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_LISTING_NOT_FOUND, 'NFT platform listing not found', context, 404);
  }
}
export class NftPlatformListingNotActiveError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_LISTING_NOT_ACTIVE, 'NFT platform listing is not active', context, 409);
  }
}
export class NftPlatformListingSoldOutError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_LISTING_SOLD_OUT, 'NFT platform listing is sold out', context, 410);
  }
}
export class NftPlatformListingExpiredError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_LISTING_EXPIRED, 'NFT platform listing is expired', context, 410);
  }
}
export class NftPlatformListingCancelledError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_LISTING_CANCELLED, 'NFT platform listing is cancelled', context, 409);
  }
}
export class NftPlatformListingKindInvalidError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_LISTING_KIND_INVALID, 'NFT platform listing kind is invalid', context, 400);
  }
}
export class NftPlatformListingPriceInvalidError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_LISTING_PRICE_INVALID, 'NFT platform listing price is invalid', context, 400);
  }
}
export class NftPlatformListingCurrencyInvalidError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_LISTING_CURRENCY_INVALID, 'NFT platform listing currency is invalid', context, 400);
  }
}
export class NftPlatformListingQuantityInvalidError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_LISTING_QUANTITY_INVALID, 'NFT platform listing quantity is invalid', context, 400);
  }
}
export class NftPlatformListingNotOwnedError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_LISTING_NOT_OWNED, 'NFT platform listing is not owned by user', context, 403);
  }
}

export class NftPlatformTradeNotFoundError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_TRADE_NOT_FOUND, 'NFT platform trade not found', context, 404);
  }
}
export class NftPlatformTradeStatusInvalidError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_TRADE_STATUS_INVALID, 'NFT platform trade status invalid', context, 409);
  }
}
export class NftPlatformTradeTypeInvalidError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_TRADE_TYPE_INVALID, 'NFT platform trade type is invalid', context, 400);
  }
}
export class NftPlatformTradeAmountInvalidError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_TRADE_AMOUNT_INVALID, 'NFT platform trade amount is invalid', context, 400);
  }
}
export class NftPlatformTradeNotPayableError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_TRADE_NOT_PAYABLE, 'NFT platform trade is not payable', context, 409);
  }
}
export class NftPlatformTradeAlreadyPaidError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_TRADE_ALREADY_PAID, 'NFT platform trade is already paid', context, 409);
  }
}
export class NftPlatformTradeBuyerRequiredError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_TRADE_BUYER_REQUIRED, 'NFT platform trade buyer is required', context, 400);
  }
}
export class NftPlatformTradeSellerRequiredError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_TRADE_SELLER_REQUIRED, 'NFT platform trade seller is required', context, 400);
  }
}
export class NftPlatformTradeTxHashDuplicateError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_TRADE_TX_HASH_DUPLICATE, 'NFT platform trade txHash is duplicated', context, 409);
  }
}
export class NftPlatformTradeSolanaFailedError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_TRADE_SOLANA_FAILED, 'Solana on-chain NFT platform trade failed', context, 502);
  }
}

export class NftPlatformRoyaltyInvalidError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_ROYALTY_INVALID, 'NFT platform royalty is invalid', context, 400);
  }
}
export class NftPlatformRoyaltyExceedsMaxError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_ROYALTY_EXCEEDS_MAX, 'NFT platform royalty exceeds max', context, 422);
  }
}
export class NftPlatformRoyaltyRecipientRequiredError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_ROYALTY_RECIPIENT_REQUIRED, 'NFT platform royalty recipient is required', context, 400);
  }
}

export class NftPlatformCollectionNotFoundError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_COLLECTION_NOT_FOUND, 'NFT platform collection not found', context, 404);
  }
}
export class NftPlatformAssetNotFoundError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_ASSET_NOT_FOUND, 'NFT platform asset not found', context, 404);
  }
}
export class NftPlatformKindInvalidError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_KIND_INVALID, 'NFT platform kind is invalid', context, 400);
  }
}
export class NftPlatformUserIdRequiredError extends FjnNftPlatformError {
  constructor(context?: FjnErrorContext) {
    super(NFT_PLATFORM_ERROR_CODES.NFT_PLATFORM_USER_ID_REQUIRED, 'NFT platform userId is required', context, 400);
  }
}
