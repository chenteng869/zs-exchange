/**
 * WinePass NFT Service - 事件定义
 *
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §8.3
 */

export const WINEPASS_NFT_EVENTS = {
  COLLECTION_CREATED: 'winepass.collection.created',
  COLLECTION_PAUSED: 'winepass.collection.paused',
  COLLECTION_RESUMED: 'winepass.collection.resumed',
  ASSET_MINTED: 'winepass.asset.minted',
  ASSET_TRANSFERRED: 'winepass.asset.transferred',
  ASSET_BURNED: 'winepass.asset.burned',
  ASSET_FROZEN: 'winepass.asset.frozen',
  ASSET_UNFROZEN: 'winepass.asset.unfrozen',
  ASSET_UPGRADED: 'winepass.asset.upgraded',
  BENEFIT_GRANTED: 'winepass.benefit.granted',
  UPGRADE_REQUESTED: 'winepass.upgrade.requested',
  UPGRADE_COMPLETED: 'winepass.upgrade.completed',
  UPGRADE_FAILED: 'winepass.upgrade.failed',
  CHAIN_RECORD_CONFIRMED: 'winepass.chain_record.confirmed',
} as const;

export const WINEPASS_NFT_EVENT_SOURCES = {
  WINEPASS_SERVICE: 'winepass_service',
  SOLANA_NFT_SERVICE: 'solana_nft_service',
  ADMIN: 'admin',
  UPGRADE_WORKER: 'upgrade_worker',
} as const;

export type FjnWinepassNftEvent = (typeof WINEPASS_NFT_EVENTS)[keyof typeof WINEPASS_NFT_EVENTS];
export type FjnWinepassNftEventSource = (typeof WINEPASS_NFT_EVENT_SOURCES)[keyof typeof WINEPASS_NFT_EVENT_SOURCES];

export interface WinepassCollectionCreatedPayload {
  collectionNo: string;
  name: string;
  nftType: string;
  maxSupply: number;
  chainId: string;
}
export interface WinepassAssetMintedPayload {
  assetNo: string;
  collectionNo: string;
  ownerId: string;
  tokenId?: string;
  txHash?: string;
}
export interface WinepassAssetUpgradedPayload {
  assetNo: string;
  fromLevel: number;
  toLevel: number;
  paidAmount: string;
  paymentType: string;
  txHash?: string;
}
export type FjnWinepassNftEventPayload =
  | WinepassCollectionCreatedPayload
  | WinepassAssetMintedPayload
  | WinepassAssetUpgradedPayload
  | Record<string, unknown>;
