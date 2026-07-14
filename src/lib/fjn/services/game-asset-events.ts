/**
 * Game Asset Service - 事件定义
 */

export const GAME_ASSET_EVENTS = {
  ASSET_MINTED: 'game.asset.minted',
  ASSET_TRANSFERRED: 'game.asset.transferred',
  ASSET_CONSUMED: 'game.asset.consumed',
  ASSET_TRADED: 'game.asset.traded',
  ASSET_UPGRADED: 'game.asset.upgraded',
  ASSET_DESTROYED: 'game.asset.destroyed',
  INVENTORY_UPDATED: 'game.inventory.updated',
  WALLET_UPDATED: 'game.wallet.updated',
} as const;

export const GAME_ASSET_EVENT_SOURCES = {
  GAME_ASSET_SERVICE: 'game_asset_service',
  GAME_ENGINE: 'game_engine',
  PLAYER: 'player',
  ADMIN: 'admin',
} as const;

export type FjnGameAssetEvent = (typeof GAME_ASSET_EVENTS)[keyof typeof GAME_ASSET_EVENTS];
export type FjnGameAssetEventSource = (typeof GAME_ASSET_EVENT_SOURCES)[keyof typeof GAME_ASSET_EVENT_SOURCES];

export interface GameAssetMintedPayload {
  assetNo: string;
  kind: string;
  rarity: string;
  ownerId: string;
  quantity: number;
}

export interface GameAssetTransferredPayload {
  assetNo: string;
  fromUserId: string;
  toUserId: string;
  txHash?: string;
}

export type FjnGameAssetEventPayload =
  | GameAssetMintedPayload
  | GameAssetTransferredPayload
  | Record<string, unknown>;
