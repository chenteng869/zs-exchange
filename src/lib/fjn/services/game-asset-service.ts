/**
 * Game Asset Service - 369 生态内游戏资产
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.7
 *
 * 职责：
 *  - Asset 域：mintAsset / transferAsset / consumeAsset / upgradeAsset / destroyAsset
 *  - Inventory 域：getInventory / getInventoryByKind
 *  - 查询：getAsset / listAssets / getUserGameSummary
 *
 * 链上集成：SolanaNftService（NFT 化 game asset）+ SolanaTokenService（currency）
 * 业务真相源：FjnOperationLog（payload JSON 作为 game asset 账本）
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  GAME_ASSET_KIND,
  GAME_ASSET_RARITY,
  GAME_ASSET_STATUS,
  GAME_ASSET_OPERATION,
  GAME_ASSET_DEFAULT_CHAIN_ID,
  isValidGameAssetKind,
  isValidGameAssetRarity,
  isValidGameAssetStatus,
  isValidGameAssetOperation,
  type FjnGameAssetKind,
  type FjnGameAssetRarity,
  type FjnGameAssetStatus,
  type FjnGameAssetOperation,
} from './game-asset-state-machine';
import {
  GAME_ASSET_EVENTS,
  GAME_ASSET_EVENT_SOURCES,
  type FjnGameAssetEventSource,
} from './game-asset-events';
import {
  GameAssetNotFoundError,
  GameAssetNotOwnedError,
  GameAssetLockedError,
  GameAssetDestroyedError,
  GameAssetNotConsumableError,
  GameAssetNotTradeableError,
  GameAssetNotUpgradableError,
  GameAssetNotAvailableError,
  GameAssetKindInvalidError,
  GameAssetRarityInvalidError,
  GameAssetStatusInvalidError,
  GameAssetOperationInvalidError,
  GameAssetQuantityInvalidError,
  GameAssetQuantityInsufficientError,
  GameAssetMaxLevelReachedError,
  GameAssetTxHashDuplicateError,
  GameAssetSolanaFailedError,
  GameAssetUserIdRequiredError,
  GameAssetTransferRestrictedError,
} from './game-asset-errors';
import { FjnValidationError } from '../errors';

const GAME_ASSET_MAX_LEVEL = 20;

/** 入参 */
export interface MintGameAssetInput {
  userId: string;
  kind: FjnGameAssetKind;
  rarity: FjnGameAssetRarity;
  name: string;
  quantity: number;
  attributes?: Prisma.InputJsonValue;
  sourceType?: string;
  sourceId?: string;
  operatorId?: string;
}
export interface TransferGameAssetInput {
  assetId: string;
  fromUserId: string;
  toUserId: string;
  quantity: number;
  txHash?: string;
  operatorId?: string;
}
export interface ConsumeGameAssetInput {
  assetId: string;
  userId: string;
  quantity: number;
  reason: string;
  operatorId?: string;
}
export interface UpgradeGameAssetInput {
  assetId: string;
  userId: string;
  materialAssetIds: string[];
  operatorId?: string;
}
export interface DestroyGameAssetInput {
  assetId: string;
  userId: string;
  reason: string;
  operatorId?: string;
}

/** 返回 */
export interface GameAssetSummary {
  id: string;
  assetNo: string;
  kind: FjnGameAssetKind;
  rarity: FjnGameAssetRarity;
  name: string;
  ownerId: string;
  quantity: number;
  level: number;
  status: FjnGameAssetStatus;
  txHash?: string | null;
}

export class FjnGameAssetService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnGameAssetService' });
  }

  private generateAssetNo(): string {
    return `GA-AST-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  private async emitEvent(
    tx: any,
    eventType: string,
    payload: Record<string, unknown>,
    source: FjnGameAssetEventSource = GAME_ASSET_EVENT_SOURCES.GAME_ASSET_SERVICE,
  ): Promise<void> {
    await (tx as any).outboxEvent.create({
      data: {
        eventType,
        payload: { ...payload, occurred_at: new Date().toISOString(), source },
        status: 'pending',
        retryCount: 0,
      },
    });
  }

  private async callSolanaGameAssetMint(
    assetNo: string,
    kind: string,
    ownerId: string,
  ): Promise<{ txHash: string; mintAddress: string }> {
    const mintAddress = `mock-mint-${assetNo}-${Math.random().toString(36).slice(2, 10)}`;
    const txHash = `mock-tx-mint-${assetNo}-${Date.now()}`;
    this.log('info', `Solana Game Asset mint placeholder`, { assetNo, kind, ownerId, mintAddress, txHash });
    return { txHash, mintAddress };
  }

  // ==========================================================
  // 1. Asset 域
  // ==========================================================

  /**
   * 铸造游戏资产
   *  - 链上：SolanaNftService.mintNft 或 SolanaTokenService.mintTo
   *  - 链下：FjnOperationLog（payload JSON）
   */
  async mintAsset(input: MintGameAssetInput) {
    if (!input.userId) throw new GameAssetUserIdRequiredError();
    if (!isValidGameAssetKind(input.kind)) {
      throw new GameAssetKindInvalidError({ kind: input.kind });
    }
    if (!isValidGameAssetRarity(input.rarity)) {
      throw new GameAssetRarityInvalidError({ rarity: input.rarity });
    }
    if (input.quantity <= 0) {
      throw new GameAssetQuantityInvalidError({ quantity: input.quantity });
    }

    return this.withTransaction(async (tx) => {
      const assetNo = this.generateAssetNo();
      // 链上
      let txHash = '';
      let mintAddress = '';
      try {
        const onchain = await this.callSolanaGameAssetMint(assetNo, input.kind, input.userId);
        txHash = onchain.txHash;
        mintAddress = onchain.mintAddress;
      } catch (e) {
        throw new GameAssetSolanaFailedError({ assetNo, originalError: (e as Error).message });
      }

      const created = await (tx as any).fjnOperationLog.create({
        data: {
          operationType: 'game_asset',
          refType: input.kind,
          refId: input.userId,
          operatorId: input.userId,
          payload: {
            assetNo,
            kind: input.kind,
            rarity: input.rarity,
            name: input.name,
            ownerId: input.userId,
            quantity: input.quantity,
            level: 1,
            status: GAME_ASSET_STATUS.AVAILABLE,
            attributes: input.attributes ?? {},
            txHash,
            mintAddress,
            sourceType: input.sourceType ?? null,
            sourceId: input.sourceId ?? null,
            chainId: GAME_ASSET_DEFAULT_CHAIN_ID,
            createdAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, GAME_ASSET_EVENTS.ASSET_MINTED, {
        assetNo,
        kind: input.kind,
        rarity: input.rarity,
        ownerId: input.userId,
        quantity: input.quantity,
        txHash,
        operatorId: input.operatorId,
      });

      this.log('info', `Game asset minted: ${assetNo}`, { kind: input.kind, rarity: input.rarity });
      return {
        id: created.id,
        assetNo,
        kind: input.kind,
        rarity: input.rarity,
        name: input.name,
        ownerId: input.userId,
        quantity: input.quantity,
        level: 1,
        status: GAME_ASSET_STATUS.AVAILABLE,
        txHash,
      } as GameAssetSummary;
    });
  }

  /**
   * 转移游戏资产
   */
  async transferAsset(input: TransferGameAssetInput) {
    if (!input.fromUserId || !input.toUserId) throw new GameAssetUserIdRequiredError();
    if (input.quantity <= 0) {
      throw new GameAssetQuantityInvalidError({ quantity: input.quantity });
    }

    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.assetId } });
      if (!log) throw new GameAssetNotFoundError({ assetId: input.assetId });
      const asset = log.payload as any;
      if (asset.ownerId !== input.fromUserId) {
        throw new GameAssetNotOwnedError({ assetNo: asset.assetNo, ownerId: asset.ownerId });
      }
      if (asset.status === GAME_ASSET_STATUS.DESTROYED) {
        throw new GameAssetDestroyedError({ assetNo: asset.assetNo });
      }
      if (asset.status === GAME_ASSET_STATUS.LOCKED) {
        throw new GameAssetLockedError({ assetNo: asset.assetNo });
      }
      if (asset.status === GAME_ASSET_STATUS.IN_USE) {
        throw new GameAssetTransferRestrictedError({ assetNo: asset.assetNo, status: asset.status });
      }
      if (asset.quantity < input.quantity) {
        throw new GameAssetQuantityInsufficientError({
          assetNo: asset.assetNo,
          available: asset.quantity,
          requested: input.quantity,
        });
      }

      // 链上：SolanaNftService / SolanaTokenService transfer（占位）
      const txHash = input.txHash ?? `mock-game-transfer-${asset.assetNo}-${Date.now()}`;

      // 链下：原 asset.quantity 减少
      if (asset.quantity === input.quantity) {
        // 全部转出：直接变更 owner
        await (tx as any).fjnOperationLog.update({
          where: { id: input.assetId },
          data: {
            payload: { ...asset, ownerId: input.toUserId, txHash, transferredAt: new Date().toISOString() } as Prisma.InputJsonValue,
          },
        });
      } else {
        // 部分转出：原 asset 减少 + 新增 toUser 的副本
        await (tx as any).fjnOperationLog.update({
          where: { id: input.assetId },
          data: {
            payload: { ...asset, quantity: asset.quantity - input.quantity, txHash } as Prisma.InputJsonValue,
          },
        });
        const newAssetNo = this.generateAssetNo();
        await (tx as any).fjnOperationLog.create({
          data: {
            operationType: 'game_asset',
            refType: asset.kind,
            refId: input.toUserId,
            operatorId: input.toUserId,
            payload: {
              ...asset,
              assetNo: newAssetNo,
              ownerId: input.toUserId,
              quantity: input.quantity,
              transferredFrom: input.fromUserId,
              parentAssetNo: asset.assetNo,
              txHash,
              createdAt: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        });
      }

      await this.emitEvent(tx, GAME_ASSET_EVENTS.ASSET_TRANSFERRED, {
        assetNo: asset.assetNo,
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
        quantity: input.quantity,
        txHash,
        operatorId: input.operatorId,
      });

      this.log('info', `Game asset transferred: ${asset.assetNo}`, { from: input.fromUserId, to: input.toUserId, quantity: input.quantity });
      return { assetNo: asset.assetNo, fromUserId: input.fromUserId, toUserId: input.toUserId, quantity: input.quantity, txHash };
    });
  }

  /** 消费游戏资产（如消耗品 / 票） */
  async consumeAsset(input: ConsumeGameAssetInput) {
    if (!input.userId) throw new GameAssetUserIdRequiredError();
    if (input.quantity <= 0) throw new GameAssetQuantityInvalidError({ quantity: input.quantity });
    if (!input.reason) throw new FjnValidationError('Consume reason is required', { assetId: input.assetId });

    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.assetId } });
      if (!log) throw new GameAssetNotFoundError({ assetId: input.assetId });
      const asset = log.payload as any;
      if (asset.ownerId !== input.userId) {
        throw new GameAssetNotOwnedError({ assetNo: asset.assetNo, ownerId: asset.ownerId });
      }
      if (asset.kind !== GAME_ASSET_KIND.CONSUMABLE && asset.kind !== GAME_ASSET_KIND.TICKET && asset.kind !== GAME_ASSET_KIND.CURRENCY) {
        throw new GameAssetNotConsumableError({ assetNo: asset.assetNo, kind: asset.kind });
      }
      if (asset.quantity < input.quantity) {
        throw new GameAssetQuantityInsufficientError({
          assetNo: asset.assetNo,
          available: asset.quantity,
          requested: input.quantity,
        });
      }

      const newQty = asset.quantity - input.quantity;
      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.assetId },
        data: {
          payload: { ...asset, quantity: newQty, status: newQty === 0 ? GAME_ASSET_STATUS.CONSUMED : asset.status, consumedReason: input.reason, consumedAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, GAME_ASSET_EVENTS.ASSET_CONSUMED, {
        assetNo: asset.assetNo,
        userId: input.userId,
        quantity: input.quantity,
        reason: input.reason,
        operatorId: input.operatorId,
      });

      this.log('info', `Game asset consumed: ${asset.assetNo}`, { quantity: input.quantity, reason: input.reason });
      return updated;
    });
  }

  /** 升级游戏资产 */
  async upgradeAsset(input: UpgradeGameAssetInput) {
    if (!input.userId) throw new GameAssetUserIdRequiredError();

    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.assetId } });
      if (!log) throw new GameAssetNotFoundError({ assetId: input.assetId });
      const asset = log.payload as any;
      if (asset.ownerId !== input.userId) {
        throw new GameAssetNotOwnedError({ assetNo: asset.assetNo, ownerId: asset.ownerId });
      }
      if (asset.status === GAME_ASSET_STATUS.DESTROYED) {
        throw new GameAssetDestroyedError({ assetNo: asset.assetNo });
      }
      if (asset.level >= GAME_ASSET_MAX_LEVEL) {
        throw new GameAssetMaxLevelReachedError({ assetNo: asset.assetNo, currentLevel: asset.level, max: GAME_ASSET_MAX_LEVEL });
      }

      // 消耗材料
      for (const materialId of input.materialAssetIds) {
        const materialLog = await (tx as any).fjnOperationLog.findUnique({ where: { id: materialId } });
        if (!materialLog) throw new GameAssetNotFoundError({ assetId: materialId });
        const material = materialLog.payload as any;
        if (material.ownerId !== input.userId) {
          throw new GameAssetNotOwnedError({ assetNo: material.assetNo, ownerId: material.ownerId });
        }
        await (tx as any).fjnOperationLog.update({
          where: { id: materialId },
          data: {
            payload: { ...material, quantity: 0, status: GAME_ASSET_STATUS.CONSUMED, consumedReason: 'upgrade_material', consumedAt: new Date().toISOString() } as Prisma.InputJsonValue,
          },
        });
      }

      const newLevel = asset.level + 1;
      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.assetId },
        data: {
          payload: { ...asset, level: newLevel, upgradedAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, GAME_ASSET_EVENTS.ASSET_UPGRADED, {
        assetNo: asset.assetNo,
        userId: input.userId,
        fromLevel: asset.level,
        toLevel: newLevel,
        operatorId: input.operatorId,
      });

      this.log('info', `Game asset upgraded: ${asset.assetNo}`, { from: asset.level, to: newLevel });
      return updated;
    });
  }

  /** 销毁游戏资产 */
  async destroyAsset(input: DestroyGameAssetInput) {
    if (!input.userId) throw new GameAssetUserIdRequiredError();
    if (!input.reason) throw new FjnValidationError('Destroy reason is required', { assetId: input.assetId });

    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.assetId } });
      if (!log) throw new GameAssetNotFoundError({ assetId: input.assetId });
      const asset = log.payload as any;
      if (asset.ownerId !== input.userId) {
        throw new GameAssetNotOwnedError({ assetNo: asset.assetNo, ownerId: asset.ownerId });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.assetId },
        data: {
          payload: { ...asset, status: GAME_ASSET_STATUS.DESTROYED, destroyReason: input.reason, destroyedAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, GAME_ASSET_EVENTS.ASSET_DESTROYED, {
        assetNo: asset.assetNo,
        userId: input.userId,
        reason: input.reason,
        operatorId: input.operatorId,
      });

      this.log('info', `Game asset destroyed: ${asset.assetNo}`, { reason: input.reason });
      return updated;
    });
  }

  // ==========================================================
  // 2. 查询域
  // ==========================================================

  async getAsset(assetId: string) {
    const log = await (this.prisma as any).fjnOperationLog.findUnique({ where: { id: assetId } });
    if (!log) throw new GameAssetNotFoundError({ assetId });
    return log;
  }

  /** 用户背包（按 kind 过滤） */
  async getInventory(userId: string, kind?: FjnGameAssetKind) {
    if (!userId) throw new GameAssetUserIdRequiredError();
    const all = await (this.prisma as any).fjnOperationLog.findMany({
      where: { operationType: 'game_asset' },
      orderBy: { createdAt: 'desc' },
    });
    return all.filter((l: any) => {
      const p = l.payload;
      if (p.ownerId !== userId) return false;
      if (p.status === GAME_ASSET_STATUS.DESTROYED) return false;
      if (kind && p.kind !== kind) return false;
      return true;
    });
  }

  /** 用户游戏汇总 */
  async getUserGameSummary(userId: string) {
    if (!userId) throw new GameAssetUserIdRequiredError();
    const all = await this.getInventory(userId);

    const byKind: Record<string, number> = {};
    const byRarity: Record<string, number> = {};
    let totalAssets = 0;
    for (const log of all) {
      const p = log.payload;
      byKind[p.kind] = (byKind[p.kind] ?? 0) + p.quantity;
      byRarity[p.rarity] = (byRarity[p.rarity] ?? 0) + p.quantity;
      totalAssets += p.quantity;
    }

    return {
      userId,
      totalAssets,
      byKind,
      byRarity,
      uniqueAssetTypes: all.length,
    };
  }
}
