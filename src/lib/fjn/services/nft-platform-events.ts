/**
 * NFT Platform Service - 事件定义
 */

export const NFT_PLATFORM_EVENTS = {
  LISTING_CREATED: 'nft_platform.listing.created',
  LISTING_ACTIVATED: 'nft_platform.listing.activated',
  LISTING_PAUSED: 'nft_platform.listing.paused',
  LISTING_SOLD_OUT: 'nft_platform.listing.sold_out',
  LISTING_EXPIRED: 'nft_platform.listing.expired',
  LISTING_CANCELLED: 'nft_platform.listing.cancelled',
  TRADE_CREATED: 'nft_platform.trade.created',
  TRADE_PAID: 'nft_platform.trade.paid',
  TRADE_SETTLED: 'nft_platform.trade.settled',
  TRADE_FAILED: 'nft_platform.trade.failed',
  ROYALTY_PAID: 'nft_platform.royalty.paid',
  CROSS_KIND_REGISTERED: 'nft_platform.cross_kind.registered',
} as const;

export const NFT_PLATFORM_EVENT_SOURCES = {
  NFT_PLATFORM_SERVICE: 'nft_platform_service',
  SOLANA_NFT_SERVICE: 'solana_nft_service',
  MARKETPLACE: 'marketplace',
  ADMIN: 'admin',
} as const;

export type FjnNftPlatformEvent = (typeof NFT_PLATFORM_EVENTS)[keyof typeof NFT_PLATFORM_EVENTS];
export type FjnNftPlatformEventSource = (typeof NFT_PLATFORM_EVENT_SOURCES)[keyof typeof NFT_PLATFORM_EVENT_SOURCES];

export interface NftPlatformListingCreatedPayload {
  listingNo: string;
  kind: string;
  collectionNo: string;
  price: string;
  currency: string;
}

export interface NftPlatformTradeSettledPayload {
  tradeNo: string;
  listingNo: string;
  buyerId: string;
  sellerId: string;
  amount: string;
  royaltyAmount: string;
  txHash: string;
}

export type FjnNftPlatformEventPayload =
  | NftPlatformListingCreatedPayload
  | NftPlatformTradeSettledPayload
  | Record<string, unknown>;
