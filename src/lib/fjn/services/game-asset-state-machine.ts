/**
 * Game Asset Service - 状态机 + 枚举
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.7
 *
 * Game Asset = 369 生态内的游戏内资产（道具 / 角色 / 装备）
 * 数据落地：FjnOperationLog（payload JSON）作为游戏资产账本
 */

export const GAME_ASSET_KIND = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  CHARACTER: 'character',
  SKIN: 'skin',
  CONSUMABLE: 'consumable',
  CURRENCY: 'currency',
  TICKET: 'ticket',
} as const;
export type FjnGameAssetKind = (typeof GAME_ASSET_KIND)[keyof typeof GAME_ASSET_KIND];

export const GAME_ASSET_RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHIC: 'mythic',
} as const;
export type FjnGameAssetRarity = (typeof GAME_ASSET_RARITY)[keyof typeof GAME_ASSET_RARITY];

export const GAME_ASSET_STATUS = {
  LOCKED: 'locked',
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  TRADED: 'traded',
  CONSUMED: 'consumed',
  DESTROYED: 'destroyed',
} as const;
export type FjnGameAssetStatus = (typeof GAME_ASSET_STATUS)[keyof typeof GAME_ASSET_STATUS];

export const GAME_ASSET_OPERATION = {
  MINT: 'mint',
  TRANSFER: 'transfer',
  CONSUME: 'consume',
  TRADE: 'trade',
  UPGRADE: 'upgrade',
  DESTROY: 'destroy',
} as const;
export type FjnGameAssetOperation = (typeof GAME_ASSET_OPERATION)[keyof typeof GAME_ASSET_OPERATION];

export const GAME_ASSET_DEFAULT_CHAIN_ID = 'devnet';

export const isValidGameAssetKind = (v: string): v is FjnGameAssetKind =>
  Object.values(GAME_ASSET_KIND).includes(v as any);
export const isValidGameAssetRarity = (v: string): v is FjnGameAssetRarity =>
  Object.values(GAME_ASSET_RARITY).includes(v as any);
export const isValidGameAssetStatus = (v: string): v is FjnGameAssetStatus =>
  Object.values(GAME_ASSET_STATUS).includes(v as any);
export const isValidGameAssetOperation = (v: string): v is FjnGameAssetOperation =>
  Object.values(GAME_ASSET_OPERATION).includes(v as any);
