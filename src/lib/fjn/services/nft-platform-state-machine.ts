/**
 * NFT Platform Service - 状态机 + 枚举
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.6
 *
 * NFT Platform = 跨业务线的 NFT 平台（Bottle / Game / Sports / Club / Mall）
 * 复用 FjnNftCollection / FjnNftAsset（FJN 域内已有的 NFT 表）
 */

export const NFT_PLATFORM_KIND = {
  BOTTLE: 'bottle',
  GAME: 'game',
  SPORTS: 'sports',
  CLUB: 'club',
  MALL: 'mall',
  AI_TOOL: 'ai_tool',
  VIRTUAL_TRADING: 'virtual_trading',
} as const;
export type FjnNftPlatformKind = (typeof NFT_PLATFORM_KIND)[keyof typeof NFT_PLATFORM_KIND];

export const NFT_PLATFORM_LISTING_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  SOLD_OUT: 'sold_out',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;
export type FjnNftPlatformListingStatus =
  (typeof NFT_PLATFORM_LISTING_STATUS)[keyof typeof NFT_PLATFORM_LISTING_STATUS];

export const NFT_PLATFORM_TRADE_TYPE = {
  PRIMARY_SALE: 'primary_sale',
  SECONDARY_SALE: 'secondary_sale',
  AUCTION: 'auction',
  GIFT: 'gift',
} as const;
export type FjnNftPlatformTradeType =
  (typeof NFT_PLATFORM_TRADE_TYPE)[keyof typeof NFT_PLATFORM_TRADE_TYPE];

export const NFT_PLATFORM_ROYALTY_BPS_MAX = 1000; // 10%
export const NFT_PLATFORM_DEFAULT_CHAIN_ID = 'devnet';
export const NFT_PLATFORM_DEFAULT_CURRENCY = 'USDC';

export const isValidNftPlatformKind = (v: string): v is FjnNftPlatformKind =>
  Object.values(NFT_PLATFORM_KIND).includes(v as any);
export const isValidNftPlatformListingStatus = (v: string): v is FjnNftPlatformListingStatus =>
  Object.values(NFT_PLATFORM_LISTING_STATUS).includes(v as any);
export const isValidNftPlatformTradeType = (v: string): v is FjnNftPlatformTradeType =>
  Object.values(NFT_PLATFORM_TRADE_TYPE).includes(v as any);
