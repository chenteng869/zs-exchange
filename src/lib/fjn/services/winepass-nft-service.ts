/**
 * WinePass NFT Service - 369 权益 NFT 业务服务
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.3
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md §3.9
 *
 * 职责：
 *  - Collection 域：createCollection / pauseCollection / resumeCollection / deprecateCollection
 *  - Asset 域：mintAsset / burnAsset / freezeAsset / unfreezeAsset / transferAsset
 *  - Upgrade 域：createUpgradeOrder / payUpgrade / executeUpgrade / cancelUpgrade
 *  - Benefit 域：grantBenefit / listBenefits
 *  - Ownership 域：listOwnerships / transferOwnership
 *  - Chain Record 域：recordChain / confirmChainRecord
 *  - 查询：getCollection / getAsset / getUpgrade / listAssets / getAssetByTokenId
 *
 * 链上集成：SolanaNftService（mint / transfer / burn）+ SolanaRPC（txHash 确认）
 * 业务真相源：链下账本（FjnNftCollection / FjnNftAsset / FjnNftOwnership /
 *                          FjnNftBenefit / FjnNftUpgradeOrder / FjnNftChainRecord）
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  WINEPASS_NFT_TYPE,
  WINEPASS_COLLECTION_STATUS,
  WINEPASS_ASSET_STATUS,
  WINEPASS_UPGRADE_STATUS,
  WINEPASS_BENEFIT_TYPE,
  WINEPASS_TRANSFER_TYPE,
  WINEPASS_CHAIN_RECORD_STATUS,
  WINEPASS_PAYMENT_TYPE,
  WINEPASS_DEFAULT_CHAIN_ID,
  WINEPASS_DEFAULT_CLUSTER,
  WINEPASS_MIN_LEVEL,
  WINEPASS_MAX_LEVEL,
  WINEPASS_DEFAULT_LEVEL,
  WINEPASS_UPGRADE_BASE_COST,
  isValidWinepassNftType,
  isValidWinepassCollectionStatus,
  isValidWinepassAssetStatus,
  isValidWinepassUpgradeStatus,
  isValidWinepassBenefitType,
  type FjnWinepassNftType,
  type FjnWinepassCollectionStatus,
  type FjnWinepassAssetStatus,
  type FjnWinepassUpgradeStatus,
  type FjnWinepassBenefitType,
  type FjnWinepassTransferType,
  type FjnWinepassPaymentType,
} from './winepass-nft-state-machine';
import {
  WINEPASS_NFT_EVENTS,
  WINEPASS_NFT_EVENT_SOURCES,
  type FjnWinepassNftEventSource,
} from './winepass-nft-events';
import {
  WinepassCollectionNotFoundError,
  WinepassCollectionExistsError,
  WinepassCollectionPausedError,
  WinepassCollectionSupplyExceededError,
  WinepassCollectionNameRequiredError,
  WinepassCollectionSymbolInvalidError,
  WinepassCollectionTypeInvalidError,
  WinepassAssetNotFoundError,
  WinepassAssetNotOwnedError,
  WinepassAssetNotMintedError,
  WinepassAssetAlreadyMintedError,
  WinepassAssetFrozenError,
  WinepassAssetBurnedError,
  WinepassAssetNotUpgradableError,
  WinepassAssetMaxLevelError,
  WinepassAssetInvalidLevelError,
  WinepassAssetTokenIdMissingError,
  WinepassAssetTransferRestrictedError,
  WinepassUpgradeNotFoundError,
  WinepassUpgradeNotExecutableError,
  WinepassUpgradeNotCancellableError,
  WinepassUpgradeAmountInvalidError,
  WinepassUpgradePaymentInvalidError,
  WinepassBenefitTypeInvalidError,
  WinepassBenefitAmountInvalidError,
  WinepassOwnershipTransferNotAllowedError,
  WinepassSolanaNftMintFailedError,
  WinepassSolanaNftTransferFailedError,
  WinepassSolanaNftBurnFailedError,
  WinepassChainRecordNotFoundError,
} from './winepass-nft-errors';
import { FjnValidationError } from '../errors';

// ============================================================
// 1. 入参接口
// ============================================================

/** 创建 NFT Collection */
export interface CreateWinepassCollectionInput {
  name: string;
  symbol: string;
  nftType: FjnWinepassNftType;
  description?: string;
  imageUrl?: string;
  maxSupply: number;
  metadataUri?: string;
  contractAddress?: string;
  chainId?: string;
  createdBy?: string;
}

/** 铸造 NFT Asset */
export interface MintWinepassAssetInput {
  collectionId: string;
  ownerId: string;
  name: string;
  imageUrl?: string;
  attributes?: Prisma.InputJsonValue;
  initialPower?: string;
  level?: number;
  sourceType?: string;
  sourceId?: string;
  /** 链上 mint 完成后由 SolanaNftService 返回 */
  tokenId?: string;
  txHash?: string;
  operatorId?: string;
}

/** 转移 NFT */
export interface TransferWinepassAssetInput {
  assetId: string;
  fromUserId: string;
  toUserId: string;
  txHash?: string;
  operatorId?: string;
}

/** 销毁 NFT */
export interface BurnWinepassAssetInput {
  assetId: string;
  userId: string;
  reason: string;
  txHash?: string;
  operatorId?: string;
}

/** 冻结 NFT */
export interface FreezeWinepassAssetInput {
  assetId: string;
  reason: string;
  operatorId?: string;
}

/** 解冻 NFT */
export interface UnfreezeWinepassAssetInput {
  assetId: string;
  reason?: string;
  operatorId?: string;
}

/** 创建升级单 */
export interface CreateWinepassUpgradeInput {
  assetId: string;
  userId: string;
  toLevel: number;
  paymentType: FjnWinepassPaymentType;
}

/** 支付升级单 */
export interface PayWinepassUpgradeInput {
  upgradeId: string;
  paidAmount: string;
  txHash?: string;
  operatorId?: string;
}

/** 执行升级单（链上 + 链下） */
export interface ExecuteWinepassUpgradeInput {
  upgradeId: string;
  txHash?: string;
  operatorId?: string;
}

/** 授予 Benefit */
export interface GrantWinepassBenefitInput {
  assetId: string;
  benefitType: FjnWinepassBenefitType;
  amount: string;
  config?: Prisma.InputJsonValue;
  description?: string;
}

/** 记录链上操作 */
export interface RecordWinepassChainInput {
  assetId: string;
  recordType: 'mint' | 'transfer' | 'upgrade' | 'burn' | 'freeze';
  chainType?: string;
  chainId?: string;
  txHash: string;
  blockNumber?: bigint | number;
  payload?: Prisma.InputJsonValue;
}

/** 分页查询 */
export interface ListWinepassAssetsInput {
  page?: number;
  pageSize?: number;
  collectionId?: string;
  ownerId?: string;
  status?: FjnWinepassAssetStatus;
  nftType?: FjnWinepassNftType;
}

// ============================================================
// 2. 返回类型
// ============================================================

export interface WinepassCollectionSummary {
  id: string;
  collectionNo: string;
  name: string;
  symbol: string;
  nftType: FjnWinepassNftType;
  maxSupply: number;
  totalSupply: number;
  status: FjnWinepassCollectionStatus;
  chainId: string;
  contractAddress?: string | null;
}

export interface WinepassAssetSummary {
  id: string;
  assetNo: string;
  collectionId: string;
  ownerId?: string | null;
  tokenId?: string | null;
  name: string;
  imageUrl?: string | null;
  power: string;
  level: number;
  status: FjnWinepassAssetStatus;
  txHash?: string | null;
  mintedAt?: Date | null;
}

export interface WinepassUpgradeSummary {
  id: string;
  upgradeNo: string;
  assetId: string;
  userId: string;
  fromLevel: number;
  toLevel: number;
  upgradeCost: string;
  paidAmount: string;
  paymentType: FjnWinepassPaymentType;
  status: FjnWinepassUpgradeStatus;
  txHash?: string | null;
  completedAt?: Date | null;
}

// ============================================================
// 3. Service 实现
// ============================================================

export class FjnWinepassNftService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnWinepassNftService' });
  }

  // ==========================================================
  // 3.0 工具方法
  // ==========================================================

  /** 生成 collectionNo: WP-COL-{时间戳}-{6位随机} */
  private generateCollectionNo(): string {
    return `WP-COL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  /** 生成 assetNo: WP-AST-{时间戳}-{6位随机} */
  private generateAssetNo(): string {
    return `WP-AST-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  /** 生成 upgradeNo: WP-UPG-{时间戳}-{6位随机} */
  private generateUpgradeNo(): string {
    return `WP-UPG-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  /** 发出 outbox 事件 */
  private async emitNftEvent(
    tx: any,
    eventType: string,
    payload: Record<string, unknown>,
    source: FjnWinepassNftEventSource = WINEPASS_NFT_EVENT_SOURCES.WINEPASS_SERVICE,
  ): Promise<void> {
    await (tx as any).outboxEvent.create({
      data: {
        eventType,
        payload: {
          ...payload,
          occurred_at: new Date().toISOString(),
          source,
        },
        status: 'pending',
        retryCount: 0,
      },
    });
  }

  /** 链上铸造（mock 调用 SolanaNftService，真实场景由调用方注入结果） */
  private async callSolanaNftMint(
    collectionNo: string,
    assetNo: string,
    ownerId: string,
    name: string,
    symbol: string,
    imageUrl: string | undefined,
  ): Promise<{ tokenId: string; txHash: string }> {
    // 工业级：这里应调用 SolanaNftService.mintNft
    // 当前步骤中先返回占位值，待链上集成测试时接入真实方法
    const tokenId = `${symbol}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const txHash = `mock-tx-${assetNo}-${Date.now()}`;
    this.log('info', `Solana NFT mint placeholder`, { collectionNo, assetNo, ownerId, tokenId, txHash });
    return { tokenId, txHash };
  }

  // ==========================================================
  // 3.1 Collection 域（4 个方法）
  // ==========================================================

  /**
   * 创建 NFT Collection
   *  - 链上合约地址：可由 SolanaNftService.createCollection 返回
   *  - 链下：写入 FjnNftCollection
   */
  async createCollection(input: CreateWinepassCollectionInput) {
    if (!input.name) throw new WinepassCollectionNameRequiredError();
    if (!input.symbol || input.symbol.length < 2 || input.symbol.length > 16) {
      throw new WinepassCollectionSymbolInvalidError({ symbol: input.symbol });
    }
    if (!isValidWinepassNftType(input.nftType)) {
      throw new WinepassCollectionTypeInvalidError({ nftType: input.nftType });
    }
    if (input.maxSupply <= 0) {
      throw new FjnValidationError('maxSupply must be > 0', { maxSupply: input.maxSupply });
    }

    return this.withTransaction(async (tx) => {
      const collectionNo = this.generateCollectionNo();
      const chainId = input.chainId ?? WINEPASS_DEFAULT_CHAIN_ID;

      const created = await (tx as any).fjnNftCollection.create({
        data: {
          collectionNo,
          name: input.name,
          symbol: input.symbol.toUpperCase(),
          nftType: input.nftType,
          description: input.description ?? null,
          imageUrl: input.imageUrl ?? null,
          totalSupply: 0,
          maxSupply: input.maxSupply,
          chainType: 'solana',
          chainId,
          contractAddress: input.contractAddress ?? null,
          metadataUri: input.metadataUri ?? null,
          status: WINEPASS_COLLECTION_STATUS.ACTIVE,
          createdBy: input.createdBy ?? null,
        },
      });

      await this.emitNftEvent(tx, WINEPASS_NFT_EVENTS.COLLECTION_CREATED, {
        collectionNo,
        name: input.name,
        nftType: input.nftType,
        maxSupply: input.maxSupply,
        chainId,
        operatorId: input.createdBy,
      });

      this.log('info', `WinePass collection created: ${collectionNo}`, { name: input.name });
      return created as WinepassCollectionSummary & { createdAt: Date; updatedAt: Date };
    });
  }

  /**
   * 暂停 Collection（不允许铸造新 NFT）
   */
  async pauseCollection(collectionId: string, reason?: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const collection = await (tx as any).fjnNftCollection.findUnique({ where: { id: collectionId } });
      if (!collection) throw new WinepassCollectionNotFoundError({ collectionId });
      if (collection.status === WINEPASS_COLLECTION_STATUS.PAUSED) return collection;
      if (collection.status === WINEPASS_COLLECTION_STATUS.DEPRECATED) {
        throw new FjnValidationError('Cannot pause a deprecated collection', { collectionId });
      }

      const updated = await (tx as any).fjnNftCollection.update({
        where: { id: collectionId },
        data: { status: WINEPASS_COLLECTION_STATUS.PAUSED },
      });

      await this.emitNftEvent(tx, WINEPASS_NFT_EVENTS.COLLECTION_PAUSED, {
        collectionNo: collection.collectionNo,
        reason,
        operatorId,
      });

      this.log('info', `Collection paused: ${collection.collectionNo}`, { collectionId, reason });
      return updated;
    });
  }

  /** 恢复 Collection */
  async resumeCollection(collectionId: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const collection = await (tx as any).fjnNftCollection.findUnique({ where: { id: collectionId } });
      if (!collection) throw new WinepassCollectionNotFoundError({ collectionId });
      if (collection.status === WINEPASS_COLLECTION_STATUS.ACTIVE) return collection;
      if (collection.status === WINEPASS_COLLECTION_STATUS.DEPRECATED) {
        throw new FjnValidationError('Cannot resume a deprecated collection', { collectionId });
      }

      const updated = await (tx as any).fjnNftCollection.update({
        where: { id: collectionId },
        data: { status: WINEPASS_COLLECTION_STATUS.ACTIVE },
      });

      await this.emitNftEvent(tx, WINEPASS_NFT_EVENTS.COLLECTION_RESUMED, {
        collectionNo: collection.collectionNo,
        operatorId,
      });

      this.log('info', `Collection resumed: ${collection.collectionNo}`);
      return updated;
    });
  }

  /** 管理后台：列出 Collection（分页） */
  async listCollections(input: { nftType?: FjnWinepassNftType; status?: FjnWinepassCollectionStatus; page?: number; pageSize?: number } = {}) {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, 100);
    const where: any = {};
    if (input.nftType) where.nftType = input.nftType;
    if (input.status) where.status = input.status;
    const [items, total] = await Promise.all([
      (this.prisma as any).fjnNftCollection.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).fjnNftCollection.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  /** 废弃 Collection（不可恢复） */
  async deprecateCollection(collectionId: string, reason: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const collection = await (tx as any).fjnNftCollection.findUnique({ where: { id: collectionId } });
      if (!collection) throw new WinepassCollectionNotFoundError({ collectionId });
      if (!reason) throw new FjnValidationError('Deprecation reason is required', { collectionId });

      const updated = await (tx as any).fjnNftCollection.update({
        where: { id: collectionId },
        data: { status: WINEPASS_COLLECTION_STATUS.DEPRECATED },
      });

      await this.emitNftEvent(tx, WINEPASS_NFT_EVENTS.COLLECTION_PAUSED, {
        collectionNo: collection.collectionNo,
        reason: `deprecated: ${reason}`,
        operatorId,
      });

      this.log('warn', `Collection deprecated: ${collection.collectionNo}`, { reason });
      return updated;
    });
  }

  // ==========================================================
  // 3.2 Asset 域（5 个方法）
  // ==========================================================

  /**
   * 铸造 NFT Asset
   *  1) 校验 Collection 状态
   *  2) 调用 SolanaNftService.mintNft（占位实现）
   *  3) 链下创建 FjnNftAsset + FjnNftOwnership + FjnNftChainRecord
   *  4) Collection.totalSupply += 1
   */
  async mintAsset(input: MintWinepassAssetInput) {
    return this.withTransaction(async (tx) => {
      const collection = await (tx as any).fjnNftCollection.findUnique({ where: { id: input.collectionId } });
      if (!collection) throw new WinepassCollectionNotFoundError({ collectionId: input.collectionId });
      if (collection.status === WINEPASS_COLLECTION_STATUS.PAUSED) {
        throw new WinepassCollectionPausedError({ collectionNo: collection.collectionNo });
      }
      if (collection.status === WINEPASS_COLLECTION_STATUS.DEPRECATED) {
        throw new FjnValidationError('Cannot mint on deprecated collection', { collectionId: input.collectionId });
      }
      if (collection.totalSupply >= collection.maxSupply) {
        throw new WinepassCollectionSupplyExceededError({
          collectionNo: collection.collectionNo,
          totalSupply: collection.totalSupply,
          maxSupply: collection.maxSupply,
        });
      }

      const level = input.level ?? WINEPASS_DEFAULT_LEVEL;
      if (level < WINEPASS_MIN_LEVEL || level > WINEPASS_MAX_LEVEL) {
        throw new WinepassAssetInvalidLevelError({ level });
      }

      const assetNo = this.generateAssetNo();

      // Step 1: 链上铸造
      let tokenId = input.tokenId ?? '';
      let txHash = input.txHash ?? '';
      if (!tokenId || !txHash) {
        try {
          const onchain = await this.callSolanaNftMint(
            collection.collectionNo,
            assetNo,
            input.ownerId,
            input.name,
            collection.symbol,
            input.imageUrl ?? collection.imageUrl ?? undefined,
          );
          tokenId = onchain.tokenId;
          txHash = onchain.txHash;
        } catch (e) {
          throw new WinepassSolanaNftMintFailedError({
            assetNo,
            collectionId: input.collectionId,
            originalError: (e as Error).message,
          });
        }
      }

      // Step 2: 链下账本
      const initialPower = input.initialPower ?? '0.0000';
      const asset = await (tx as any).fjnNftAsset.create({
        data: {
          assetNo,
          collectionId: input.collectionId,
          ownerId: input.ownerId,
          tokenId,
          name: input.name,
          imageUrl: input.imageUrl ?? null,
          attributes: input.attributes ?? Prisma.JsonNull,
          power: new Prisma.Decimal(initialPower),
          level,
          status: WINEPASS_ASSET_STATUS.MINTED,
          sourceType: input.sourceType ?? null,
          sourceId: input.sourceId ?? null,
          txHash,
          mintedAt: new Date(),
        },
      });

      // Step 3: 所有权记录
      await (tx as any).fjnNftOwnership.create({
        data: {
          assetId: asset.id,
          ownerId: input.ownerId,
          fromUserId: null,
          toUserId: input.ownerId,
          transferType: WINEPASS_TRANSFER_TYPE.MINT,
          txHash,
        },
      });

      // Step 4: 链上记录
      await (tx as any).fjnNftChainRecord.create({
        data: {
          assetId: asset.id,
          recordType: 'mint',
          chainType: 'solana',
          chainId: collection.chainId,
          txHash,
          payload: {
            collectionNo: collection.collectionNo,
            ownerId: input.ownerId,
            tokenId,
            assetNo,
          } as Prisma.InputJsonValue,
          status: WINEPASS_CHAIN_RECORD_STATUS.PENDING,
        },
      });

      // Step 5: Collection.totalSupply += 1
      await (tx as any).fjnNftCollection.update({
        where: { id: input.collectionId },
        data: { totalSupply: { increment: 1 } },
      });

      // Step 6: 事件
      await this.emitNftEvent(tx, WINEPASS_NFT_EVENTS.ASSET_MINTED, {
        assetNo,
        collectionNo: collection.collectionNo,
        ownerId: input.ownerId,
        tokenId,
        txHash,
        operatorId: input.operatorId,
      });

      this.log('info', `WinePass NFT minted: ${assetNo}`, { collectionNo: collection.collectionNo, ownerId: input.ownerId });
      return asset as WinepassAssetSummary & { createdAt: Date; updatedAt: Date };
    });
  }

  /**
   * 转移 NFT
   *  - 校验所有权 + 状态
   *  - 调用 SolanaNftService.transferNft（占位）
   *  - 链下：ownerId 更新 + FjnNftOwnership 记录 + FjnNftChainRecord
   */
  async transferAsset(input: TransferWinepassAssetInput) {
    return this.withTransaction(async (tx) => {
      const asset = await (tx as any).fjnNftAsset.findUnique({ where: { id: input.assetId } });
      if (!asset) throw new WinepassAssetNotFoundError({ assetId: input.assetId });
      if (asset.ownerId !== input.fromUserId) {
        throw new WinepassAssetNotOwnedError({ assetId: input.assetId, ownerId: asset.ownerId });
      }
      if (asset.status === WINEPASS_ASSET_STATUS.BURNED) {
        throw new WinepassAssetBurnedError({ assetNo: asset.assetNo });
      }
      if (asset.status === WINEPASS_ASSET_STATUS.FROZEN) {
        throw new WinepassAssetFrozenError({ assetNo: asset.assetNo });
      }
      if (asset.status === WINEPASS_ASSET_STATUS.LOCKED) {
        throw new WinepassAssetTransferRestrictedError({ assetNo: asset.assetNo });
      }
      if (asset.status !== WINEPASS_ASSET_STATUS.MINTED && asset.status !== WINEPASS_ASSET_STATUS.ACTIVE) {
        throw new WinepassAssetTransferRestrictedError({ assetNo: asset.assetNo, status: asset.status });
      }

      const txHash = input.txHash ?? `mock-tx-transfer-${asset.assetNo}-${Date.now()}`;

      // 链上：SolanaNftService.transferNft（占位）
      this.log('info', `Solana NFT transfer placeholder`, { assetNo: asset.assetNo, from: input.fromUserId, to: input.toUserId, txHash });

      // 链下：更新所有者
      const updated = await (tx as any).fjnNftAsset.update({
        where: { id: input.assetId },
        data: { ownerId: input.toUserId },
      });

      // 所有权记录
      await (tx as any).fjnNftOwnership.create({
        data: {
          assetId: input.assetId,
          ownerId: input.toUserId,
          fromUserId: input.fromUserId,
          toUserId: input.toUserId,
          transferType: WINEPASS_TRANSFER_TYPE.TRANSFER,
          txHash,
        },
      });

      // 链上记录
      await (tx as any).fjnNftChainRecord.create({
        data: {
          assetId: input.assetId,
          recordType: 'transfer',
          chainType: 'solana',
          chainId: WINEPASS_DEFAULT_CHAIN_ID,
          txHash,
          payload: {
            fromUserId: input.fromUserId,
            toUserId: input.toUserId,
            assetNo: asset.assetNo,
          } as Prisma.InputJsonValue,
          status: WINEPASS_CHAIN_RECORD_STATUS.PENDING,
        },
      });

      await this.emitNftEvent(tx, WINEPASS_NFT_EVENTS.ASSET_TRANSFERRED, {
        assetNo: asset.assetNo,
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
        txHash,
        operatorId: input.operatorId,
      });

      this.log('info', `WinePass NFT transferred: ${asset.assetNo}`, { from: input.fromUserId, to: input.toUserId });
      return updated;
    });
  }

  /**
   * 销毁 NFT
   *  - 链上：SolanaNftService.burnNft（占位）
   *  - 链下：FjnNftAsset.status='burned' + FjnNftOwnership + FjnNftChainRecord
   */
  async burnAsset(input: BurnWinepassAssetInput) {
    return this.withTransaction(async (tx) => {
      const asset = await (tx as any).fjnNftAsset.findUnique({ where: { id: input.assetId } });
      if (!asset) throw new WinepassAssetNotFoundError({ assetId: input.assetId });
      if (asset.ownerId !== input.userId) {
        throw new WinepassAssetNotOwnedError({ assetId: input.assetId, ownerId: asset.ownerId });
      }
      if (asset.status === WINEPASS_ASSET_STATUS.BURNED) {
        throw new WinepassAssetBurnedError({ assetNo: asset.assetNo });
      }

      const txHash = input.txHash ?? `mock-tx-burn-${asset.assetNo}-${Date.now()}`;

      // 链上：SolanaNftService.burnNft（占位）
      this.log('info', `Solana NFT burn placeholder`, { assetNo: asset.assetNo, txHash });

      const updated = await (tx as any).fjnNftAsset.update({
        where: { id: input.assetId },
        data: { status: WINEPASS_ASSET_STATUS.BURNED },
      });

      await (tx as any).fjnNftOwnership.create({
        data: {
          assetId: input.assetId,
          ownerId: input.userId,
          fromUserId: input.userId,
          toUserId: null,
          transferType: WINEPASS_TRANSFER_TYPE.BURN,
          txHash,
        },
      });

      await (tx as any).fjnNftChainRecord.create({
        data: {
          assetId: input.assetId,
          recordType: 'burn',
          chainType: 'solana',
          chainId: WINEPASS_DEFAULT_CHAIN_ID,
          txHash,
          payload: {
            assetNo: asset.assetNo,
            reason: input.reason,
          } as Prisma.InputJsonValue,
          status: WINEPASS_CHAIN_RECORD_STATUS.PENDING,
        },
      });

      // 销毁时 collection.totalSupply -= 1
      await (tx as any).fjnNftCollection.update({
        where: { id: asset.collectionId },
        data: { totalSupply: { decrement: 1 } },
      });

      await this.emitNftEvent(tx, WINEPASS_NFT_EVENTS.ASSET_BURNED, {
        assetNo: asset.assetNo,
        userId: input.userId,
        reason: input.reason,
        txHash,
        operatorId: input.operatorId,
      });

      this.log('info', `WinePass NFT burned: ${asset.assetNo}`, { reason: input.reason });
      return updated;
    });
  }

  /** 冻结 NFT */
  async freezeAsset(input: FreezeWinepassAssetInput) {
    return this.withTransaction(async (tx) => {
      const asset = await (tx as any).fjnNftAsset.findUnique({ where: { id: input.assetId } });
      if (!asset) throw new WinepassAssetNotFoundError({ assetId: input.assetId });
      if (asset.status === WINEPASS_ASSET_STATUS.FROZEN) return asset;
      if (asset.status === WINEPASS_ASSET_STATUS.BURNED) {
        throw new WinepassAssetBurnedError({ assetNo: asset.assetNo });
      }

      const updated = await (tx as any).fjnNftAsset.update({
        where: { id: input.assetId },
        data: { status: WINEPASS_ASSET_STATUS.FROZEN },
      });

      await (tx as any).fjnNftChainRecord.create({
        data: {
          assetId: input.assetId,
          recordType: 'freeze',
          chainType: 'solana',
          chainId: WINEPASS_DEFAULT_CHAIN_ID,
          txHash: `mock-freeze-${asset.assetNo}-${Date.now()}`,
          payload: { reason: input.reason, assetNo: asset.assetNo } as Prisma.InputJsonValue,
          status: WINEPASS_CHAIN_RECORD_STATUS.PENDING,
        },
      });

      await this.emitNftEvent(tx, WINEPASS_NFT_EVENTS.ASSET_FROZEN, {
        assetNo: asset.assetNo,
        reason: input.reason,
        operatorId: input.operatorId,
      });

      this.log('warn', `WinePass NFT frozen: ${asset.assetNo}`, { reason: input.reason });
      return updated;
    });
  }

  /** 解冻 NFT */
  async unfreezeAsset(input: UnfreezeWinepassAssetInput) {
    return this.withTransaction(async (tx) => {
      const asset = await (tx as any).fjnNftAsset.findUnique({ where: { id: input.assetId } });
      if (!asset) throw new WinepassAssetNotFoundError({ assetId: input.assetId });
      if (asset.status !== WINEPASS_ASSET_STATUS.FROZEN) return asset;

      const updated = await (tx as any).fjnNftAsset.update({
        where: { id: input.assetId },
        data: { status: WINEPASS_ASSET_STATUS.ACTIVE },
      });

      await this.emitNftEvent(tx, WINEPASS_NFT_EVENTS.ASSET_UNFROZEN, {
        assetNo: asset.assetNo,
        reason: input.reason,
        operatorId: input.operatorId,
      });

      this.log('info', `WinePass NFT unfrozen: ${asset.assetNo}`);
      return updated;
    });
  }

  // ==========================================================
  // 3.3 Upgrade 域（4 个方法）
  // ==========================================================

  /**
   * 创建升级单
   *  - 校验 Asset 状态 + toLevel 合法性
   *  - 计算 upgradeCost = (toLevel - fromLevel) * WINEPASS_UPGRADE_BASE_COST
   */
  async createUpgradeOrder(input: CreateWinepassUpgradeInput) {
    if (!Object.values(WINEPASS_PAYMENT_TYPE).includes(input.paymentType as any)) {
      throw new WinepassUpgradePaymentInvalidError({ paymentType: input.paymentType });
    }
    return this.withTransaction(async (tx) => {
      const asset = await (tx as any).fjnNftAsset.findUnique({ where: { id: input.assetId } });
      if (!asset) throw new WinepassAssetNotFoundError({ assetId: input.assetId });
      if (asset.ownerId !== input.userId) {
        throw new WinepassAssetNotOwnedError({ assetId: input.assetId, ownerId: asset.ownerId });
      }
      if (asset.status === WINEPASS_ASSET_STATUS.BURNED) {
        throw new WinepassAssetBurnedError({ assetNo: asset.assetNo });
      }
      if (asset.status === WINEPASS_ASSET_STATUS.FROZEN) {
        throw new WinepassAssetFrozenError({ assetNo: asset.assetNo });
      }
      if (input.toLevel <= asset.level) {
        throw new WinepassAssetNotUpgradableError({
          assetNo: asset.assetNo,
          fromLevel: asset.level,
          toLevel: input.toLevel,
        });
      }
      if (input.toLevel > WINEPASS_MAX_LEVEL) {
        throw new WinepassAssetMaxLevelError({ assetNo: asset.assetNo, currentLevel: asset.level, maxLevel: WINEPASS_MAX_LEVEL });
      }

      const levelDiff = input.toLevel - asset.level;
      const upgradeCost = new Prisma.Decimal(WINEPASS_UPGRADE_BASE_COST).mul(levelDiff);

      const upgradeNo = this.generateUpgradeNo();
      const order = await (tx as any).fjnNftUpgradeOrder.create({
        data: {
          upgradeNo,
          assetId: input.assetId,
          userId: input.userId,
          fromLevel: asset.level,
          toLevel: input.toLevel,
          upgradeCost,
          paidAmount: new Prisma.Decimal(0),
          paymentType: input.paymentType,
          status: WINEPASS_UPGRADE_STATUS.CREATED,
        },
      });

      await this.emitNftEvent(tx, WINEPASS_NFT_EVENTS.UPGRADE_REQUESTED, {
        upgradeNo,
        assetNo: asset.assetNo,
        fromLevel: asset.level,
        toLevel: input.toLevel,
        paidAmount: '0',
        paymentType: input.paymentType,
      });

      this.log('info', `WinePass upgrade order created: ${upgradeNo}`, {
        assetNo: asset.assetNo,
        fromLevel: asset.level,
        toLevel: input.toLevel,
      });

      return order as WinepassUpgradeSummary & { createdAt: Date; updatedAt: Date; failureReason: string | null };
    });
  }

  /** 支付升级单（链上 payment 完成后回填 paidAmount + txHash） */
  async payUpgradeOrder(input: PayWinepassUpgradeInput) {
    const paid = new Prisma.Decimal(input.paidAmount);
    if (paid.lte(0)) throw new WinepassUpgradeAmountInvalidError({ paidAmount: input.paidAmount });

    return this.withTransaction(async (tx) => {
      const order = await (tx as any).fjnNftUpgradeOrder.findUnique({ where: { id: input.upgradeId } });
      if (!order) throw new WinepassUpgradeNotFoundError({ upgradeId: input.upgradeId });
      if (order.status !== WINEPASS_UPGRADE_STATUS.CREATED) {
        throw new WinepassUpgradeNotExecutableError({ upgradeId: input.upgradeId, status: order.status });
      }
      if (paid.lt(order.upgradeCost)) {
        throw new WinepassUpgradeAmountInvalidError({
          upgradeId: input.upgradeId,
          paid: paid.toString(),
          required: order.upgradeCost.toString(),
        });
      }

      const updated = await (tx as any).fjnNftUpgradeOrder.update({
        where: { id: input.upgradeId },
        data: {
          paidAmount: paid,
          txHash: input.txHash ?? order.txHash,
          status: WINEPASS_UPGRADE_STATUS.PAID,
        },
      });

      this.log('info', `WinePass upgrade paid: ${order.upgradeNo}`, { paidAmount: paid.toString() });
      return updated;
    });
  }

  /**
   * 执行升级单
   *  - 校验 status=paid
   *  - 链上：调用 SolanaNftService.upgradeNft（占位）
   *  - 链下：FjnNftAsset.level=toLevel + FjnNftChainRecord + FjnNftUpgradeOrder.status=completed
   */
  async executeUpgradeOrder(input: ExecuteWinepassUpgradeInput) {
    return this.withTransaction(async (tx) => {
      const order = await (tx as any).fjnNftUpgradeOrder.findUnique({ where: { id: input.upgradeId } });
      if (!order) throw new WinepassUpgradeNotFoundError({ upgradeId: input.upgradeId });
      if (order.status !== WINEPASS_UPGRADE_STATUS.PAID) {
        throw new WinepassUpgradeNotExecutableError({ upgradeId: input.upgradeId, status: order.status });
      }

      // 升级中
      await (tx as any).fjnNftUpgradeOrder.update({
        where: { id: input.upgradeId },
        data: { status: WINEPASS_UPGRADE_STATUS.UPGRADING },
      });

      const asset = await (tx as any).fjnNftAsset.findUnique({ where: { id: order.assetId } });
      if (!asset) throw new WinepassAssetNotFoundError({ assetId: order.assetId });

      const txHash = input.txHash ?? order.txHash ?? `mock-upgrade-${order.upgradeNo}-${Date.now()}`;

      // 链上：SolanaNftService.upgradeNft（占位）
      this.log('info', `Solana NFT upgrade placeholder`, { assetNo: asset.assetNo, upgradeNo: order.upgradeNo, txHash });

      // 链下：提升 level
      const updatedAsset = await (tx as any).fjnNftAsset.update({
        where: { id: order.assetId },
        data: { level: order.toLevel, status: WINEPASS_ASSET_STATUS.UPGRADED },
      });

      // 链上记录
      await (tx as any).fjnNftChainRecord.create({
        data: {
          assetId: order.assetId,
          recordType: 'upgrade',
          chainType: 'solana',
          chainId: WINEPASS_DEFAULT_CHAIN_ID,
          txHash,
          payload: {
            upgradeNo: order.upgradeNo,
            fromLevel: order.fromLevel,
            toLevel: order.toLevel,
            assetNo: asset.assetNo,
          } as Prisma.InputJsonValue,
          status: WINEPASS_CHAIN_RECORD_STATUS.PENDING,
        },
      });

      // 升级单完成
      const completedOrder = await (tx as any).fjnNftUpgradeOrder.update({
        where: { id: input.upgradeId },
        data: {
          status: WINEPASS_UPGRADE_STATUS.COMPLETED,
          txHash,
          completedAt: new Date(),
        },
      });

      await this.emitNftEvent(tx, WINEPASS_NFT_EVENTS.UPGRADE_COMPLETED, {
        upgradeNo: order.upgradeNo,
        assetNo: asset.assetNo,
        fromLevel: order.fromLevel,
        toLevel: order.toLevel,
        paidAmount: order.paidAmount.toString(),
        paymentType: order.paymentType,
        txHash,
      });

      this.log('info', `WinePass upgrade completed: ${order.upgradeNo}`, {
        assetNo: asset.assetNo,
        fromLevel: order.fromLevel,
        toLevel: order.toLevel,
      });

      return { asset: updatedAsset, upgrade: completedOrder };
    });
  }

  /** 取消升级单 */
  async cancelUpgradeOrder(upgradeId: string, reason: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const order = await (tx as any).fjnNftUpgradeOrder.findUnique({ where: { id: upgradeId } });
      if (!order) throw new WinepassUpgradeNotFoundError({ upgradeId });
      if (order.status !== WINEPASS_UPGRADE_STATUS.CREATED && order.status !== WINEPASS_UPGRADE_STATUS.PAID) {
        throw new WinepassUpgradeNotCancellableError({ upgradeId, status: order.status });
      }
      if (!reason) throw new FjnValidationError('Cancellation reason is required', { upgradeId });

      const updated = await (tx as any).fjnNftUpgradeOrder.update({
        where: { id: upgradeId },
        data: {
          status: WINEPASS_UPGRADE_STATUS.CANCELLED,
          failureReason: reason,
        },
      });

      this.log('info', `WinePass upgrade cancelled: ${order.upgradeNo}`, { reason, operatorId });
      return updated;
    });
  }

  // ==========================================================
  // 3.4 Benefit 域（2 个方法）
  // ==========================================================

  /** 授予 Benefit */
  async grantBenefit(input: GrantWinepassBenefitInput) {
    if (!isValidWinepassBenefitType(input.benefitType)) {
      throw new WinepassBenefitTypeInvalidError({ benefitType: input.benefitType });
    }
    const amount = new Prisma.Decimal(input.amount);
    if (amount.lte(0)) {
      throw new WinepassBenefitAmountInvalidError({ amount: input.amount });
    }

    return this.withTransaction(async (tx) => {
      const asset = await (tx as any).fjnNftAsset.findUnique({ where: { id: input.assetId } });
      if (!asset) throw new WinepassAssetNotFoundError({ assetId: input.assetId });

      const benefit = await (tx as any).fjnNftBenefit.create({
        data: {
          assetId: input.assetId,
          benefitType: input.benefitType,
          amount,
          config: input.config ?? Prisma.JsonNull,
          description: input.description ?? null,
        },
      });

      await this.emitNftEvent(tx, WINEPASS_NFT_EVENTS.BENEFIT_GRANTED, {
        assetNo: asset.assetNo,
        benefitType: input.benefitType,
        amount: amount.toString(),
      });

      this.log('info', `WinePass benefit granted: ${asset.assetNo}`, {
        benefitType: input.benefitType,
        amount: amount.toString(),
      });
      return benefit;
    });
  }

  /** 列出 Asset 的所有 Benefit */
  async listBenefits(assetId: string) {
    const asset = await (this.prisma as any).fjnNftAsset.findUnique({ where: { id: assetId } });
    if (!asset) throw new WinepassAssetNotFoundError({ assetId });
    return (this.prisma as any).fjnNftBenefit.findMany({
      where: { assetId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==========================================================
  // 3.5 Chain Record 域（2 个方法）
  // ==========================================================

  /** 手动登记链上记录（用于链上事件监听回调） */
  async recordChainTransaction(input: RecordWinepassChainInput) {
    // 幂等：txHash 唯一性检查
    const existing = await (this.prisma as any).fjnNftChainRecord.findFirst({
      where: { txHash: input.txHash, recordType: input.recordType },
    });
    if (existing) return existing;

    return this.withTransaction(async (tx) => {
      const asset = await (tx as any).fjnNftAsset.findUnique({ where: { id: input.assetId } });
      if (!asset) throw new WinepassAssetNotFoundError({ assetId: input.assetId });

      const record = await (tx as any).fjnNftChainRecord.create({
        data: {
          assetId: input.assetId,
          recordType: input.recordType,
          chainType: input.chainType ?? 'solana',
          chainId: input.chainId ?? WINEPASS_DEFAULT_CHAIN_ID,
          txHash: input.txHash,
          blockNumber: input.blockNumber ? BigInt(input.blockNumber) : null,
          payload: input.payload ?? Prisma.JsonNull,
          status: WINEPASS_CHAIN_RECORD_STATUS.PENDING,
        },
      });

      this.log('info', `WinePass chain record created: ${input.txHash}`, { assetNo: asset.assetNo, recordType: input.recordType });
      return record;
    });
  }

  /** 确认链上记录（监听回调中调用） */
  async confirmChainRecord(recordId: string, blockNumber?: bigint | number) {
    return this.withTransaction(async (tx) => {
      const record = await (tx as any).fjnNftChainRecord.findUnique({ where: { id: recordId } });
      if (!record) throw new WinepassChainRecordNotFoundError({ recordId });
      if (record.status === WINEPASS_CHAIN_RECORD_STATUS.CONFIRMED) return record;

      const updated = await (tx as any).fjnNftChainRecord.update({
        where: { id: recordId },
        data: {
          status: WINEPASS_CHAIN_RECORD_STATUS.CONFIRMED,
          confirmedAt: new Date(),
          blockNumber: blockNumber ? BigInt(blockNumber) : record.blockNumber,
        },
      });

      const asset = await (tx as any).fjnNftAsset.findUnique({ where: { id: record.assetId } });
      await this.emitNftEvent(tx, WINEPASS_NFT_EVENTS.CHAIN_RECORD_CONFIRMED, {
        assetNo: asset?.assetNo,
        recordId,
        txHash: record.txHash,
        recordType: record.recordType,
        blockNumber: updated.blockNumber?.toString(),
      });

      this.log('info', `WinePass chain record confirmed: ${record.txHash}`);
      return updated;
    });
  }

  // ==========================================================
  // 3.6 查询域（5 个方法）
  // ==========================================================

  async getCollection(collectionId: string) {
    const collection = await (this.prisma as any).fjnNftCollection.findUnique({ where: { id: collectionId } });
    if (!collection) throw new WinepassCollectionNotFoundError({ collectionId });
    return collection;
  }

  async getAsset(assetId: string) {
    const asset = await (this.prisma as any).fjnNftAsset.findUnique({ where: { id: assetId } });
    if (!asset) throw new WinepassAssetNotFoundError({ assetId });
    return asset;
  }

  async getAssetByTokenId(tokenId: string) {
    const asset = await (this.prisma as any).fjnNftAsset.findUnique({ where: { tokenId } });
    if (!asset) throw new WinepassAssetNotFoundError({ tokenId });
    return asset;
  }

  async getUpgrade(upgradeId: string) {
    const order = await (this.prisma as any).fjnNftUpgradeOrder.findUnique({ where: { id: upgradeId } });
    if (!order) throw new WinepassUpgradeNotFoundError({ upgradeId });
    return order;
  }

  async listAssets(input: ListWinepassAssetsInput = {}) {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const where: any = {};
    if (input.collectionId) where.collectionId = input.collectionId;
    if (input.ownerId) where.ownerId = input.ownerId;
    if (input.status) where.status = input.status;

    // 如果按 nftType 过滤，需要 join collection
    if (input.nftType) {
      where.collection = { nftType: input.nftType };
    }

    const [items, total] = await Promise.all([
      (this.prisma as any).fjnNftAsset.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { collection: { select: { collectionNo: true, nftType: true, symbol: true } } },
      }),
      (this.prisma as any).fjnNftAsset.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async listOwnerships(assetId: string) {
    const asset = await (this.prisma as any).fjnNftAsset.findUnique({ where: { id: assetId } });
    if (!asset) throw new WinepassAssetNotFoundError({ assetId });
    return (this.prisma as any).fjnNftOwnership.findMany({
      where: { assetId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * 用户 WinePass NFT 汇总
   *  - 资产总数 / 不同 collection 数 / 累计 power / 累计 benefit
   */
  async getUserWinepassSummary(userId: string) {
    const assets = await (this.prisma as any).fjnNftAsset.findMany({
      where: { ownerId: userId, status: { not: WINEPASS_ASSET_STATUS.BURNED } },
      include: { collection: { select: { nftType: true, collectionNo: true } } },
    });

    const totalAssets = assets.length;
    const collectionSet = new Set(assets.map((a: any) => a.collectionId));
    const totalCollections = collectionSet.size;

    let totalPower = new Prisma.Decimal(0);
    let totalBenefits = 0;
    for (const asset of assets) {
      totalPower = totalPower.plus(asset.power);
      const benefitCount = await (this.prisma as any).fjnNftBenefit.count({ where: { assetId: asset.id } });
      totalBenefits += benefitCount;
    }

    return {
      userId,
      totalAssets,
      totalCollections,
      totalPower: totalPower.toString(),
      totalBenefits,
      assets: assets.map((a: any) => ({
        assetNo: a.assetNo,
        collectionNo: a.collection.collectionNo,
        nftType: a.collection.nftType,
        level: a.level,
        power: a.power.toString(),
        status: a.status,
      })),
    };
  }
}
