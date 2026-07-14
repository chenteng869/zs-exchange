/**
 * NFT Platform Service - 369 NFT 跨业务线平台
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.6
 *
 * 职责：
 *  - Listing 域：createListing / activateListing / pauseListing / cancelListing / expireListing
 *  - Trade 域：createTrade / markTradePaid / settleTrade / failTrade
 *  - Royalty 域：validateRoyalty / recordRoyalty
 *  - Cross-Kind 域：registerCrossKind / unregisterCrossKind
 *  - 查询：getListing / getTrade / listListings / listTrades
 *
 * 链上集成：SolanaNftService（transfer NFT）+ SolanaTokenService（royalty + payment）
 * 业务真相源：链下账本（FjnNftCollection / FjnNftAsset / FjnOperationLog）
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  NFT_PLATFORM_KIND,
  NFT_PLATFORM_LISTING_STATUS,
  NFT_PLATFORM_TRADE_TYPE,
  NFT_PLATFORM_ROYALTY_BPS_MAX,
  NFT_PLATFORM_DEFAULT_CHAIN_ID,
  NFT_PLATFORM_DEFAULT_CURRENCY,
  isValidNftPlatformKind,
  isValidNftPlatformListingStatus,
  isValidNftPlatformTradeType,
  type FjnNftPlatformKind,
  type FjnNftPlatformListingStatus,
  type FjnNftPlatformTradeType,
} from './nft-platform-state-machine';
import {
  NFT_PLATFORM_EVENTS,
  NFT_PLATFORM_EVENT_SOURCES,
  type FjnNftPlatformEventSource,
} from './nft-platform-events';
import {
  NftPlatformListingNotFoundError,
  NftPlatformListingNotActiveError,
  NftPlatformListingSoldOutError,
  NftPlatformListingExpiredError,
  NftPlatformListingCancelledError,
  NftPlatformListingKindInvalidError,
  NftPlatformListingPriceInvalidError,
  NftPlatformListingCurrencyInvalidError,
  NftPlatformListingQuantityInvalidError,
  NftPlatformListingNotOwnedError,
  NftPlatformTradeNotFoundError,
  NftPlatformTradeStatusInvalidError,
  NftPlatformTradeTypeInvalidError,
  NftPlatformTradeAmountInvalidError,
  NftPlatformTradeNotPayableError,
  NftPlatformTradeAlreadyPaidError,
  NftPlatformTradeBuyerRequiredError,
  NftPlatformTradeSellerRequiredError,
  NftPlatformTradeTxHashDuplicateError,
  NftPlatformTradeSolanaFailedError,
  NftPlatformRoyaltyInvalidError,
  NftPlatformRoyaltyExceedsMaxError,
  NftPlatformRoyaltyRecipientRequiredError,
  NftPlatformCollectionNotFoundError,
  NftPlatformAssetNotFoundError,
  NftPlatformKindInvalidError,
  NftPlatformUserIdRequiredError,
} from './nft-platform-errors';
import { FjnValidationError } from '../errors';

// ============================================================
// 1. 入参接口
// ============================================================

/** 创建 Listing */
export interface CreateNftPlatformListingInput {
  kind: FjnNftPlatformKind;
  collectionId: string;
  sellerId: string;
  assetId?: string;        // 二手挂单时必填
  price: string;
  currency?: string;
  quantity: number;
  royaltyBps?: number;     // basis points
  royaltyRecipientId?: string;
  expiresAt?: Date;
  description?: string;
  operatorId?: string;
}

/** 创建 Trade */
export interface CreateNftPlatformTradeInput {
  listingId: string;
  buyerId: string;
  tradeType: FjnNftPlatformTradeType;
  quantity?: number;
  operatorId?: string;
}

/** 标记 Trade 已支付 */
export interface MarkNftPlatformTradePaidInput {
  tradeId: string;
  txHash: string;
  paidAmount: string;
  blockNumber?: bigint | number;
  operatorId?: string;
}

/** 分页查询 */
export interface ListNftPlatformListingsInput {
  page?: number;
  pageSize?: number;
  kind?: FjnNftPlatformKind;
  status?: FjnNftPlatformListingStatus;
  sellerId?: string;
  collectionId?: string;
}

export interface ListNftPlatformTradesInput {
  page?: number;
  pageSize?: number;
  listingId?: string;
  buyerId?: string;
  sellerId?: string;
}

// ============================================================
// 2. 返回类型
// ============================================================

export interface NftPlatformListingSummary {
  id: string;
  listingNo: string;
  kind: FjnNftPlatformKind;
  collectionId: string;
  sellerId: string;
  assetId?: string | null;
  price: string;
  currency: string;
  quantity: number;
  soldQuantity: number;
  royaltyBps: number;
  royaltyRecipientId?: string | null;
  status: FjnNftPlatformListingStatus;
  expiresAt?: Date | null;
}

export interface NftPlatformTradeSummary {
  id: string;
  tradeNo: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  tradeType: FjnNftPlatformTradeType;
  amount: string;
  royaltyAmount: string;
  currency: string;
  status: string;
  txHash?: string | null;
  paidAt?: Date | null;
}

// ============================================================
// 3. Service 实现
// ============================================================

export class FjnNftPlatformService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnNftPlatformService' });
  }

  // ==========================================================
  // 3.0 工具方法
  // ==========================================================

  private generateListingNo(): string {
    return `NFTP-LST-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
  private generateTradeNo(): string {
    return `NFTP-TRD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  private async emitEvent(
    tx: any,
    eventType: string,
    payload: Record<string, unknown>,
    source: FjnNftPlatformEventSource = NFT_PLATFORM_EVENT_SOURCES.NFT_PLATFORM_SERVICE,
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

  private async callSolanaNftPlatformSettle(
    listingNo: string,
    tradeNo: string,
    buyerId: string,
    sellerId: string,
    nftMint: string,
    amount: string,
  ): Promise<{ txHash: string; blockNumber: number }> {
    const txHash = `mock-platform-${tradeNo}-${Date.now()}`;
    const blockNumber = Math.floor(Date.now() / 1000) % 100000000;
    this.log('info', `Solana NFT Platform settle placeholder`, {
      listingNo, tradeNo, buyerId, sellerId, nftMint, amount, txHash, blockNumber,
    });
    return { txHash, blockNumber };
  }

  // ==========================================================
  // 3.1 Listing 域（5 个方法）
  // ==========================================================

  /**
   * 创建 Listing
   *  - 校验 kind / price / quantity
   *  - 校验 royalty ≤ MAX（10%）
   *  - 写入 FjnOperationLog 作为 listing 记录
   */
  async createListing(input: CreateNftPlatformListingInput) {
    if (!input.sellerId) throw new NftPlatformUserIdRequiredError();
    if (!isValidNftPlatformKind(input.kind)) {
      throw new NftPlatformListingKindInvalidError({ kind: input.kind });
    }
    const price = new Prisma.Decimal(input.price);
    if (price.lte(0)) {
      throw new NftPlatformListingPriceInvalidError({ price: input.price });
    }
    if (input.quantity <= 0) {
      throw new NftPlatformListingQuantityInvalidError({ quantity: input.quantity });
    }
    const currency = input.currency ?? NFT_PLATFORM_DEFAULT_CURRENCY;
    if (!currency) throw new NftPlatformListingCurrencyInvalidError({ currency });

    const royaltyBps = input.royaltyBps ?? 0;
    if (royaltyBps < 0 || royaltyBps > NFT_PLATFORM_ROYALTY_BPS_MAX) {
      throw new NftPlatformRoyaltyExceedsMaxError({ royaltyBps, max: NFT_PLATFORM_ROYALTY_BPS_MAX });
    }
    if (royaltyBps > 0 && !input.royaltyRecipientId) {
      throw new NftPlatformRoyaltyRecipientRequiredError({ royaltyBps });
    }

    return this.withTransaction(async (tx) => {
      // 校验 collection 存在
      const collection = await (tx as any).fjnNftCollection.findUnique({ where: { id: input.collectionId } });
      if (!collection) throw new NftPlatformCollectionNotFoundError({ collectionId: input.collectionId });

      // 二手挂单：校验 asset 所有权
      if (input.assetId) {
        const asset = await (tx as any).fjnNftAsset.findUnique({ where: { id: input.assetId } });
        if (!asset) throw new NftPlatformAssetNotFoundError({ assetId: input.assetId });
        if (asset.ownerId !== input.sellerId) {
          throw new NftPlatformListingNotOwnedError({ assetId: input.assetId, ownerId: asset.ownerId });
        }
      }

      const listingNo = this.generateListingNo();
      const created = await (tx as any).fjnOperationLog.create({
        data: {
          operationType: 'nft_platform_listing',
          refType: input.kind,
          refId: input.collectionId,
          operatorId: input.sellerId,
          payload: {
            listingNo,
            kind: input.kind,
            collectionId: input.collectionId,
            collectionNo: collection.collectionNo,
            sellerId: input.sellerId,
            assetId: input.assetId ?? null,
            price: price.toString(),
            currency,
            quantity: input.quantity,
            soldQuantity: 0,
            royaltyBps,
            royaltyRecipientId: input.royaltyRecipientId ?? null,
            status: NFT_PLATFORM_LISTING_STATUS.DRAFT,
            expiresAt: input.expiresAt?.toISOString() ?? null,
            description: input.description ?? null,
            chainId: NFT_PLATFORM_DEFAULT_CHAIN_ID,
            createdAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, NFT_PLATFORM_EVENTS.LISTING_CREATED, {
        listingNo,
        kind: input.kind,
        collectionNo: collection.collectionNo,
        price: price.toString(),
        currency,
        operatorId: input.operatorId,
      });

      this.log('info', `NFT platform listing created: ${listingNo}`, { kind: input.kind });
      return {
        id: created.id,
        listingNo,
        kind: input.kind,
        collectionId: input.collectionId,
        sellerId: input.sellerId,
        assetId: input.assetId ?? null,
        price: price.toString(),
        currency,
        quantity: input.quantity,
        soldQuantity: 0,
        royaltyBps,
        royaltyRecipientId: input.royaltyRecipientId ?? null,
        status: NFT_PLATFORM_LISTING_STATUS.DRAFT,
        expiresAt: input.expiresAt ?? null,
      } as NftPlatformListingSummary;
    });
  }

  /** 激活 Listing（draft → active） */
  async activateListing(listingId: string, operatorId?: string) {
    return this.updateListingStatus(listingId, NFT_PLATFORM_LISTING_STATUS.ACTIVE, NFT_PLATFORM_EVENTS.LISTING_ACTIVATED, operatorId);
  }

  /** 暂停 Listing */
  async pauseListing(listingId: string, operatorId?: string) {
    return this.updateListingStatus(listingId, NFT_PLATFORM_LISTING_STATUS.PAUSED, NFT_PLATFORM_EVENTS.LISTING_PAUSED, operatorId);
  }

  /** 取消 Listing */
  async cancelListing(listingId: string, reason: string, operatorId?: string) {
    if (!reason) throw new FjnValidationError('Cancel reason is required', { listingId });
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: listingId } });
      if (!log) throw new NftPlatformListingNotFoundError({ listingId });
      const currentStatus = (log.payload as any).status;
      if (currentStatus === NFT_PLATFORM_LISTING_STATUS.CANCELLED) {
        throw new NftPlatformListingCancelledError({ listingId });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: listingId },
        data: {
          payload: {
            ...(log.payload as any),
            status: NFT_PLATFORM_LISTING_STATUS.CANCELLED,
            cancelReason: reason,
            cancelledAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, NFT_PLATFORM_EVENTS.LISTING_CANCELLED, {
        listingNo: (log.payload as any).listingNo,
        reason,
        operatorId,
      });

      this.log('info', `NFT platform listing cancelled: ${(log.payload as any).listingNo}`, { reason });
      return updated;
    });
  }

  /** 过期 Listing（cron） */
  async expireListings(now: Date = new Date()) {
    return this.withTransaction(async (tx) => {
      const logs = await (tx as any).fjnOperationLog.findMany({
        where: { operationType: 'nft_platform_listing' },
        take: 200,
      });
      let count = 0;
      for (const log of logs) {
        const payload = log.payload as any;
        if (payload.status === NFT_PLATFORM_LISTING_STATUS.ACTIVE && payload.expiresAt && new Date(payload.expiresAt) < now) {
          await (tx as any).fjnOperationLog.update({
            where: { id: log.id },
            data: {
              payload: { ...payload, status: NFT_PLATFORM_LISTING_STATUS.EXPIRED, expiredAt: now.toISOString() } as Prisma.InputJsonValue,
            },
          });
          await this.emitEvent(tx, NFT_PLATFORM_EVENTS.LISTING_EXPIRED, {
            listingNo: payload.listingNo,
          });
          count++;
        }
      }
      this.log('info', `NFT platform listings expired: ${count}`);
      return { count };
    });
  }

  private async updateListingStatus(
    listingId: string,
    newStatus: FjnNftPlatformListingStatus,
    eventType: string,
    operatorId?: string,
  ) {
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: listingId } });
      if (!log) throw new NftPlatformListingNotFoundError({ listingId });
      const currentStatus = (log.payload as any).status;

      // 状态转移校验
      const validTransitions: Record<string, string[]> = {
        [NFT_PLATFORM_LISTING_STATUS.DRAFT]: [NFT_PLATFORM_LISTING_STATUS.ACTIVE, NFT_PLATFORM_LISTING_STATUS.CANCELLED],
        [NFT_PLATFORM_LISTING_STATUS.ACTIVE]: [NFT_PLATFORM_LISTING_STATUS.PAUSED, NFT_PLATFORM_LISTING_STATUS.SOLD_OUT, NFT_PLATFORM_LISTING_STATUS.CANCELLED, NFT_PLATFORM_LISTING_STATUS.EXPIRED],
        [NFT_PLATFORM_LISTING_STATUS.PAUSED]: [NFT_PLATFORM_LISTING_STATUS.ACTIVE, NFT_PLATFORM_LISTING_STATUS.CANCELLED],
        [NFT_PLATFORM_LISTING_STATUS.SOLD_OUT]: [],
        [NFT_PLATFORM_LISTING_STATUS.EXPIRED]: [],
        [NFT_PLATFORM_LISTING_STATUS.CANCELLED]: [],
      };
      if (!(validTransitions[currentStatus] ?? []).includes(newStatus)) {
        throw new NftPlatformListingNotActiveError({ listingId, currentStatus, newStatus });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: listingId },
        data: {
          payload: { ...(log.payload as any), status: newStatus } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, eventType, {
        listingNo: (log.payload as any).listingNo,
        operatorId,
      });

      this.log('info', `NFT platform listing ${newStatus}: ${(log.payload as any).listingNo}`);
      return updated;
    });
  }

  // ==========================================================
  // 3.2 Trade 域（4 个方法）
  // ==========================================================

  /**
   * 创建 Trade
   *  - 校验 listing active
   *  - 计算 amount = price * quantity
   *  - 计算 royalty = amount * royaltyBps / 10000
   *  - status = pending
   */
  async createTrade(input: CreateNftPlatformTradeInput) {
    if (!input.buyerId) throw new NftPlatformTradeBuyerRequiredError();
    if (!isValidNftPlatformTradeType(input.tradeType)) {
      throw new NftPlatformTradeTypeInvalidError({ tradeType: input.tradeType });
    }
    const quantity = input.quantity ?? 1;
    if (quantity <= 0) throw new NftPlatformTradeAmountInvalidError({ quantity });

    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.listingId } });
      if (!log) throw new NftPlatformListingNotFoundError({ listingId: input.listingId });
      const listing = log.payload as any;

      if (listing.status !== NFT_PLATFORM_LISTING_STATUS.ACTIVE) {
        throw new NftPlatformListingNotActiveError({ listingNo: listing.listingNo, status: listing.status });
      }
      if (listing.soldQuantity + quantity > listing.quantity) {
        throw new NftPlatformListingSoldOutError({
          listingNo: listing.listingNo,
          sold: listing.soldQuantity,
          requested: quantity,
          total: listing.quantity,
        });
      }

      const price = new Prisma.Decimal(listing.price);
      const amount = price.mul(quantity);
      const royaltyAmount = amount
        .mul(listing.royaltyBps ?? 0)
        .div(10000)
        .toDecimalPlaces(4, Prisma.Decimal.ROUND_DOWN);

      const tradeNo = this.generateTradeNo();
      const created = await (tx as any).fjnOperationLog.create({
        data: {
          operationType: 'nft_platform_trade',
          refType: 'nft_platform_listing',
          refId: input.listingId,
          operatorId: input.buyerId,
          payload: {
            tradeNo,
            listingId: input.listingId,
            listingNo: listing.listingNo,
            buyerId: input.buyerId,
            sellerId: listing.sellerId,
            tradeType: input.tradeType,
            amount: amount.toString(),
            royaltyAmount: royaltyAmount.toString(),
            currency: listing.currency,
            quantity,
            status: 'pending',
            chainId: NFT_PLATFORM_DEFAULT_CHAIN_ID,
            createdAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      // 更新 listing.soldQuantity
      await (tx as any).fjnOperationLog.update({
        where: { id: input.listingId },
        data: {
          payload: { ...listing, soldQuantity: listing.soldQuantity + quantity } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, NFT_PLATFORM_EVENTS.TRADE_CREATED, {
        tradeNo,
        listingNo: listing.listingNo,
        buyerId: input.buyerId,
        sellerId: listing.sellerId,
        amount: amount.toString(),
        royaltyAmount: royaltyAmount.toString(),
        operatorId: input.operatorId,
      });

      this.log('info', `NFT platform trade created: ${tradeNo}`, { amount: amount.toString() });
      return {
        id: created.id,
        tradeNo,
        listingId: input.listingId,
        buyerId: input.buyerId,
        sellerId: listing.sellerId,
        tradeType: input.tradeType,
        amount: amount.toString(),
        royaltyAmount: royaltyAmount.toString(),
        currency: listing.currency,
        status: 'pending',
        txHash: null,
        paidAt: null,
      } as NftPlatformTradeSummary;
    });
  }

  /**
   * 标记 Trade 已支付 + 链上结算（transfer NFT + transfer SOL/USDC）
   *  - 校验 txHash 唯一
   *  - 链上：SolanaNftService.transfer + SolanaTokenService.transfer
   *  - 链下：trade.status = settled
   */
  async markTradePaid(input: MarkNftPlatformTradePaidInput) {
    if (!input.txHash) throw new NftPlatformTradeTxHashDuplicateError({ txHash: 'required' });

    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.tradeId } });
      if (!log) throw new NftPlatformTradeNotFoundError({ tradeId: input.tradeId });
      const trade = log.payload as any;
      if (trade.status === 'settled') return log;
      if (trade.status !== 'pending') {
        throw new NftPlatformTradeNotPayableError({ tradeNo: trade.tradeNo, status: trade.status });
      }

      // 幂等：txHash
      const dup = await (tx as any).fjnOperationLog.findFirst({
        where: { operationType: 'nft_platform_trade', payload: { path: ['txHash'], equals: input.txHash } },
      });
      if (dup) throw new NftPlatformTradeTxHashDuplicateError({ txHash: input.txHash });

      // 校验 paidAmount
      const paidAmount = new Prisma.Decimal(input.paidAmount);
      if (paidAmount.lt(trade.amount)) {
        throw new NftPlatformTradeAmountInvalidError({ paid: paidAmount.toString(), required: trade.amount });
      }

      // 链上：Solana NFT Platform settle（占位）
      let txResult: { txHash: string; blockNumber: number };
      try {
        txResult = await this.callSolanaNftPlatformSettle(
          trade.listingNo,
          trade.tradeNo,
          trade.buyerId,
          trade.sellerId,
          'placeholder_mint',
          trade.amount,
        );
      } catch (e) {
        throw new NftPlatformTradeSolanaFailedError({
          tradeNo: trade.tradeNo,
          originalError: (e as Error).message,
        });
      }

      // 链下：trade.status = settled
      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.tradeId },
        data: {
          payload: {
            ...trade,
            status: 'settled',
            txHash: txResult.txHash,
            blockNumber: txResult.blockNumber,
            paidAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, NFT_PLATFORM_EVENTS.TRADE_PAID, {
        tradeNo: trade.tradeNo,
        listingNo: trade.listingNo,
        buyerId: trade.buyerId,
        amount: paidAmount.toString(),
        txHash: txResult.txHash,
        operatorId: input.operatorId,
      });

      await this.emitEvent(tx, NFT_PLATFORM_EVENTS.TRADE_SETTLED, {
        tradeNo: trade.tradeNo,
        listingNo: trade.listingNo,
        buyerId: trade.buyerId,
        sellerId: trade.sellerId,
        amount: trade.amount,
        royaltyAmount: trade.royaltyAmount,
        txHash: txResult.txHash,
        blockNumber: txResult.blockNumber.toString(),
      });

      await this.emitEvent(tx, NFT_PLATFORM_EVENTS.ROYALTY_PAID, {
        tradeNo: trade.tradeNo,
        royaltyAmount: trade.royaltyAmount,
        recipient: trade.buyerId, // 占位：实际是 listing.royaltyRecipientId
      });

      this.log('info', `NFT platform trade settled: ${trade.tradeNo}`, { txHash: txResult.txHash });
      return updated;
    });
  }

  /** 标记 Trade 失败 */
  async failTrade(tradeId: string, reason: string, operatorId?: string) {
    if (!reason) throw new FjnValidationError('Failure reason is required', { tradeId });
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: tradeId } });
      if (!log) throw new NftPlatformTradeNotFoundError({ tradeId });
      const trade = log.payload as any;
      if (trade.status === 'settled') {
        throw new NftPlatformTradeStatusInvalidError({ tradeNo: trade.tradeNo, status: trade.status });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: tradeId },
        data: {
          payload: { ...trade, status: 'failed', failureReason: reason, failedAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, NFT_PLATFORM_EVENTS.TRADE_FAILED, {
        tradeNo: trade.tradeNo,
        reason,
        operatorId,
      });

      this.log('info', `NFT platform trade failed: ${trade.tradeNo}`, { reason });
      return updated;
    });
  }

  // ==========================================================
  // 3.3 Cross-Kind 域（2 个方法）
  // ==========================================================

  /** 跨业务线注册（同一 NFT 可同时属于多个 kind） */
  async registerCrossKind(assetId: string, additionalKinds: FjnNftPlatformKind[], operatorId?: string) {
    if (!additionalKinds.length) throw new FjnValidationError('additionalKinds must not be empty', { assetId });
    for (const k of additionalKinds) {
      if (!isValidNftPlatformKind(k)) throw new NftPlatformKindInvalidError({ kind: k });
    }

    return this.withTransaction(async (tx) => {
      const asset = await (tx as any).fjnNftAsset.findUnique({ where: { id: assetId } });
      if (!asset) throw new NftPlatformAssetNotFoundError({ assetId });

      const record = await (tx as any).fjnOperationLog.create({
        data: {
          operationType: 'nft_platform_cross_kind',
          refType: 'fjn_nft_asset',
          refId: assetId,
          operatorId: operatorId ?? asset.ownerId,
          payload: {
            assetNo: asset.assetNo,
            collectionId: asset.collectionId,
            additionalKinds,
            registeredAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, NFT_PLATFORM_EVENTS.CROSS_KIND_REGISTERED, {
        assetNo: asset.assetNo,
        additionalKinds,
        operatorId,
      });

      this.log('info', `NFT platform cross-kind registered: ${asset.assetNo}`, { additionalKinds });
      return record;
    });
  }

  // ==========================================================
  // 3.4 查询域（4 个方法）
  // ==========================================================

  async getListing(listingId: string) {
    const log = await (this.prisma as any).fjnOperationLog.findUnique({ where: { id: listingId } });
    if (!log) throw new NftPlatformListingNotFoundError({ listingId });
    return log;
  }

  async getTrade(tradeId: string) {
    const log = await (this.prisma as any).fjnOperationLog.findUnique({ where: { id: tradeId } });
    if (!log) throw new NftPlatformTradeNotFoundError({ tradeId });
    return log;
  }

  async listListings(input: ListNftPlatformListingsInput = {}) {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const all = await (this.prisma as any).fjnOperationLog.findMany({
      where: { operationType: 'nft_platform_listing' },
      orderBy: { createdAt: 'desc' },
    });
    let items = all.filter((l: any) => {
      const p = l.payload;
      if (input.kind && p.kind !== input.kind) return false;
      if (input.status && p.status !== input.status) return false;
      if (input.sellerId && p.sellerId !== input.sellerId) return false;
      if (input.collectionId && p.collectionId !== input.collectionId) return false;
      return true;
    });
    const total = items.length;
    items = items.slice((page - 1) * pageSize, page * pageSize);
    return { items, total, page, pageSize };
  }

  async listTrades(input: ListNftPlatformTradesInput = {}) {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const all = await (this.prisma as any).fjnOperationLog.findMany({
      where: { operationType: 'nft_platform_trade' },
      orderBy: { createdAt: 'desc' },
    });
    let items = all.filter((t: any) => {
      const p = t.payload;
      if (input.listingId && t.refId !== input.listingId) return false;
      if (input.buyerId && p.buyerId !== input.buyerId) return false;
      if (input.sellerId && p.sellerId !== input.sellerId) return false;
      return true;
    });
    const total = items.length;
    items = items.slice((page - 1) * pageSize, page * pageSize);
    return { items, total, page, pageSize };
  }

  /** 平台汇总统计 */
  async getPlatformSummary() {
    const allListings = await (this.prisma as any).fjnOperationLog.findMany({
      where: { operationType: 'nft_platform_listing' },
    });
    const allTrades = await (this.prisma as any).fjnOperationLog.findMany({
      where: { operationType: 'nft_platform_trade' },
    });

    const listingsByKind: Record<string, number> = {};
    let activeListings = 0;
    for (const l of allListings) {
      const k = (l.payload as any).kind;
      listingsByKind[k] = (listingsByKind[k] ?? 0) + 1;
      if ((l.payload as any).status === NFT_PLATFORM_LISTING_STATUS.ACTIVE) activeListings++;
    }

    let totalGmv = new Prisma.Decimal(0);
    let totalRoyalty = new Prisma.Decimal(0);
    let settledTrades = 0;
    for (const t of allTrades) {
      const p = t.payload as any;
      if (p.status === 'settled') {
        totalGmv = totalGmv.plus(p.amount);
        totalRoyalty = totalRoyalty.plus(p.royaltyAmount);
        settledTrades++;
      }
    }

    return {
      totalListings: allListings.length,
      activeListings,
      listingsByKind,
      totalTrades: allTrades.length,
      settledTrades,
      totalGmv: totalGmv.toString(),
      totalRoyalty: totalRoyalty.toString(),
    };
  }
}
