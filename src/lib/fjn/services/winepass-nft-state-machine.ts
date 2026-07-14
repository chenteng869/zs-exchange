/**
 * WinePass NFT Service - 状态机 + 枚举
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.3 + §2.5
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md
 *
 * WinePass NFT = 369 权益 NFT（FJN 域）
 *  - 链上：Metaplex NFT（由 SolanaNftService 操作）
 *  - 链下：FjnNftCollection / FjnNftAsset / FjnNftOwnership / FjnNftBenefit / FjnNftUpgradeOrder / FjnNftChainRecord
 */

export const WINEPASS_NFT_TYPE = {
  WINEPASS: 'winepass',
  ECO_POWER: 'eco_power',
  CLUB: 'club',
  DAPPX_MALL: 'dappx_mall',
  VIRTUAL_TRADING: 'virtual_trading',
  GENESIS: 'genesis',
} as const;
export type FjnWinepassNftType = (typeof WINEPASS_NFT_TYPE)[keyof typeof WINEPASS_NFT_TYPE];

export const WINEPASS_COLLECTION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  DEPRECATED: 'deprecated',
} as const;
export type FjnWinepassCollectionStatus = (typeof WINEPASS_COLLECTION_STATUS)[keyof typeof WINEPASS_COLLECTION_STATUS];

export const WINEPASS_ASSET_STATUS = {
  PENDING_MINT: 'pending_mint',
  MINTING: 'minting',
  MINTED: 'minted',
  ACTIVE: 'active',
  UPGRADING: 'upgrading',
  UPGRADED: 'upgraded',
  LOCKED: 'locked',
  FROZEN: 'frozen',
  REVOKED: 'revoked',
  BURNED: 'burned',
  TRANSFER_RESTRICTED: 'transfer_restricted',
} as const;
export type FjnWinepassAssetStatus = (typeof WINEPASS_ASSET_STATUS)[keyof typeof WINEPASS_ASSET_STATUS];

export const WINEPASS_UPGRADE_STATUS = {
  CREATED: 'created',
  PAID: 'paid',
  UPGRADING: 'upgrading',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;
export type FjnWinepassUpgradeStatus = (typeof WINEPASS_UPGRADE_STATUS)[keyof typeof WINEPASS_UPGRADE_STATUS];

export const WINEPASS_BENEFIT_TYPE = {
  POINTS_BOOST: 'points_boost',
  FEE_DISCOUNT: 'fee_discount',
  RELEASE_BOOST: 'release_boost',
  GOVERNANCE: 'governance',
  AIRDROP: 'airdrop',
  PRIORITY: 'priority',
} as const;
export type FjnWinepassBenefitType = (typeof WINEPASS_BENEFIT_TYPE)[keyof typeof WINEPASS_BENEFIT_TYPE];

export const WINEPASS_TRANSFER_TYPE = {
  MINT: 'mint',
  TRANSFER: 'transfer',
  BURN: 'burn',
  FREEZE: 'freeze',
} as const;
export type FjnWinepassTransferType = (typeof WINEPASS_TRANSFER_TYPE)[keyof typeof WINEPASS_TRANSFER_TYPE];

export const WINEPASS_CHAIN_TYPE = {
  SOLANA: 'solana',
} as const;
export type FjnWinepassChainType = (typeof WINEPASS_CHAIN_TYPE)[keyof typeof WINEPASS_CHAIN_TYPE];

export const WINEPASS_PAYMENT_TYPE = {
  CFJ369: 'cfj369',
  TFJ369: 'tfj369',
  FJ369_TOKEN: 'fj369_token',
} as const;
export type FjnWinepassPaymentType = (typeof WINEPASS_PAYMENT_TYPE)[keyof typeof WINEPASS_PAYMENT_TYPE];

/** 链上记录状态 */
export const WINEPASS_CHAIN_RECORD_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
} as const;

/** 默认链 */
export const WINEPASS_DEFAULT_CHAIN_ID = 'devnet';
export const WINEPASS_DEFAULT_CLUSTER = 'devnet';

/** NFT 等级范围 */
export const WINEPASS_MIN_LEVEL = 1;
export const WINEPASS_MAX_LEVEL = 10;
export const WINEPASS_DEFAULT_LEVEL = 1;

/** 升级成本基数（cFJ369 per level diff） */
export const WINEPASS_UPGRADE_BASE_COST = '100.0000';

/** 校验器 */
export const isValidWinepassNftType = (v: string): v is FjnWinepassNftType =>
  Object.values(WINEPASS_NFT_TYPE).includes(v as any);
export const isValidWinepassCollectionStatus = (v: string): v is FjnWinepassCollectionStatus =>
  Object.values(WINEPASS_COLLECTION_STATUS).includes(v as any);
export const isValidWinepassAssetStatus = (v: string): v is FjnWinepassAssetStatus =>
  Object.values(WINEPASS_ASSET_STATUS).includes(v as any);
export const isValidWinepassUpgradeStatus = (v: string): v is FjnWinepassUpgradeStatus =>
  Object.values(WINEPASS_UPGRADE_STATUS).includes(v as any);
export const isValidWinepassBenefitType = (v: string): v is FjnWinepassBenefitType =>
  Object.values(WINEPASS_BENEFIT_TYPE).includes(v as any);
export const isValidWinepassTransferType = (v: string): v is FjnWinepassTransferType =>
  Object.values(WINEPASS_TRANSFER_TYPE).includes(v as any);
export const isValidWinepassChainType = (v: string): v is FjnWinepassChainType =>
  Object.values(WINEPASS_CHAIN_TYPE).includes(v as any);
export const isValidWinepassPaymentType = (v: string): v is FjnWinepassPaymentType =>
  Object.values(WINEPASS_PAYMENT_TYPE).includes(v as any);
