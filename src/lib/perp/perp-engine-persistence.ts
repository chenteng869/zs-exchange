/**
 * 永续合约持久化引擎（PerpEnginePersistence）
 *
 *  在 PerpEngine 内存版的基础上，增加 Prisma Repository 持久化能力。
 *  - 所有关键状态变更同步写入数据库
 *  - 支持从数据库恢复内存状态
 *  - 事务保证资金安全
 *
 *  架构：
 *    PerpEngine（内存核心）
 *      ↓ 同步
 *    Prisma Repos（持久化）
 *      ↓
 *    PostgreSQL
 */

import {
  decAdd,
  decCmp,
  decDiv,
  decIsZero,
  decIsPositive,
  decMul,
  decSub,
  decTruncate,
} from '@/lib/matching/decimal';
import { PerpEngine, PerpError } from './perp-engine';
import type { Position, Order, Side, MarginMode, OrderType } from './types';

import {
  contractRepo,
  accountRepo,
  positionRepo,
  orderRepo,
  tradeRepo,
  fundingRepo,
  liquidationRepo,
  insuranceRepo,
  ledgerRepo,
  prisma,
} from './repos';
import { Prisma } from '@prisma/client';

export interface PersistOptions {
  /** 是否开启持久化 */
  enabled?: boolean;
  /** 是否从数据库加载初始数据 */
  loadFromDb?: boolean;
}

export class PerpEnginePersistence extends PerpEngine {
  private persistEnabled: boolean;

  constructor(options: PersistOptions = {}) {
    super();
    this.persistEnabled = options.enabled ?? true;

    if (options.loadFromDb) {
      this.loadFromDatabase().catch((err) => {
        console.error('[PerpEnginePersistence] Failed to load from DB:', err);
      });
    }
  }

  // ============================================================
  // 数据库加载
  // ============================================================

  async loadFromDatabase(): Promise<void> {
    if (!this.persistEnabled) return;

    console.log('[PerpEnginePersistence] Loading state from database...');

    const contracts = await contractRepo.findAllActive();
    for (const c of contracts) {
      // 同步到 ContractRegistry
      this['registry'].upsertContract({
        symbol: c.symbol,
        baseAsset: c.baseAsset,
        quoteAsset: c.quoteAsset,
        maxLeverage: c.maxLeverage,
        minQty: c.minOrderQty.toString(),
        initialMarginRate: c.initialMarginRate.toString(),
        maintenanceMarginRate: c.maintenanceMarginRate.toString(),
        makerFeeRate: c.makerFeeRate.toString(),
        takerFeeRate: c.takerFeeRate.toString(),
        fundingIntervalMin: c.fundingIntervalMinutes,
      });
    }

    console.log(`[PerpEnginePersistence] Loaded ${contracts.length} contracts`);
  }

  // ============================================================
  // 账户操作（持久化版本）
  // ============================================================

  async transferIn(userId: string, asset: string, amount: string): Promise<void> {
    super.transferIn(userId, asset, amount);

    if (this.persistEnabled) {
      await prisma.$transaction(async (tx) => {
        const account = await accountRepo.getOrCreate(userId, asset, 'cross');
        const updated = await accountRepo.adjustBalance(
          account.id,
          new Prisma.Decimal(amount),
          tx as any
        );
        await ledgerRepo.recordLedger(
          account.id,
          userId,
          asset,
          new Prisma.Decimal(amount),
          updated.balance,
          'deposit',
          'in',
          undefined,
          'transfer_in',
          'Transfer in to perp account',
          tx as any
        );
      });
    }
  }

  async transferOut(userId: string, asset: string, amount: string): Promise<void> {
    super.transferOut(userId, asset, amount);

    if (this.persistEnabled) {
      await prisma.$transaction(async (tx) => {
        const account = await accountRepo.findByUserAssetType(userId, asset, 'cross');
        if (!account) throw new PerpError('ACCOUNT_NOT_FOUND', 'Account not found');

        const updated = await accountRepo.adjustBalance(
          account.id,
          new Prisma.Decimal(amount).negated(),
          tx as any
        );
        await ledgerRepo.recordLedger(
          account.id,
          userId,
          asset,
          new Prisma.Decimal(amount).negated(),
          updated.balance,
          'withdraw',
          'out',
          undefined,
          'transfer_out',
          'Transfer out from perp account',
          tx as any
        );
      });
    }
  }

  // ============================================================
  // 仓位操作（持久化版本）
  // ============================================================

  async openPosition(params: {
    userId: string;
    symbol: string;
    side: Side;
    quantity: string;
    price: string;
    leverage: number;
    marginMode: MarginMode;
    orderType?: OrderType;
    reduceOnly?: boolean;
  }): Promise<Position> {
    const position = super.openPosition(params);

    if (this.persistEnabled) {
      await this.persistPosition(position, params.userId);
    }

    return position;
  }

  async closePosition(params: {
    userId: string;
    symbol: string;
    side: Side;
    quantity?: string;
    price?: string;
    marginMode?: MarginMode;
  }): Promise<Position> {
    const position = super.closePosition(params);

    if (this.persistEnabled) {
      await this.persistPosition(position, params.userId);
    }

    return position;
  }

  private async persistPosition(position: Position, userId: string): Promise<void> {
    const contract = await contractRepo.findBySymbol(position.symbol);
    if (!contract) return;

    const account = await accountRepo.getOrCreate(userId, 'USDT', 'cross');

    const existing = await positionRepo.findByUserSymbolSideMargin(
      userId,
      position.symbol,
      position.side,
      position.marginMode
    );

    if (existing) {
      await positionRepo.update(existing.id, {
        positionQty: new Prisma.Decimal(position.quantity),
        entryPrice: new Prisma.Decimal(position.entryPrice),
        markPrice: new Prisma.Decimal(position.markPrice),
        liquidationPrice: new Prisma.Decimal(position.liquidationPrice),
        leverage: position.leverage,
        isolatedMargin: new Prisma.Decimal(position.isolatedMargin || 0),
        positionMargin: new Prisma.Decimal(position.margin),
        unrealizedPnl: new Prisma.Decimal(position.unrealizedPnl),
        realizedPnl: new Prisma.Decimal(position.realizedPnl),
        status: position.status === 'open' ? 'active' : 'closed',
        closeTime: position.status === 'closed' ? new Date() : null,
      });
    } else {
      await positionRepo.create({
        userId,
        accountId: account.id,
        contractId: contract.id,
        symbol: position.symbol,
        side: position.side,
        positionQty: new Prisma.Decimal(position.quantity),
        entryPrice: new Prisma.Decimal(position.entryPrice),
        markPrice: new Prisma.Decimal(position.markPrice),
        liquidationPrice: new Prisma.Decimal(position.liquidationPrice),
        leverage: position.leverage,
        marginMode: position.marginMode,
        isolatedMargin: new Prisma.Decimal(position.isolatedMargin || 0),
        positionMargin: new Prisma.Decimal(position.margin),
        unrealizedPnl: new Prisma.Decimal(position.unrealizedPnl),
        realizedPnl: new Prisma.Decimal(position.realizedPnl),
        status: position.status === 'open' ? 'active' : 'closed',
      });
    }
  }

  // ============================================================
  // 订单操作（持久化版本）
  // ============================================================

  async placeOrder(params: {
    userId: string;
    symbol: string;
    side: Side;
    type: OrderType;
    quantity: string;
    price?: string;
    leverage?: number;
    marginMode?: MarginMode;
    reduceOnly?: boolean;
    postOnly?: boolean;
    timeInForce?: string;
    triggerPrice?: string;
    clientOrderId?: string;
  }): Promise<Order> {
    const order = super.placeOrder(params);

    if (this.persistEnabled) {
      await this.persistOrder(order, params.userId);
    }

    return order;
  }

  private async persistOrder(order: Order, userId: string): Promise<void> {
    const contract = await contractRepo.findBySymbol(order.symbol);
    if (!contract) return;

    const account = await accountRepo.getOrCreate(userId, 'USDT', 'cross');

    const existing = await orderRepo.findByOrderNo(order.id);
    if (existing) {
      await orderRepo.update(existing.id, {
        status: order.status,
        filledQty: new Prisma.Decimal(order.filledQty || 0),
        avgFillPrice: order.avgFillPrice ? new Prisma.Decimal(order.avgFillPrice) : new Prisma.Decimal(0),
      });
    } else {
      await orderRepo.create({
        orderNo: order.id,
        userId,
        accountId: account.id,
        contractId: contract.id,
        symbol: order.symbol,
        side: order.side,
        positionSide: order.side === 'long' ? 'long' : 'short',
        orderType: order.type,
        price: order.price ? new Prisma.Decimal(order.price) : new Prisma.Decimal(0),
        qty: new Prisma.Decimal(order.quantity),
        leverage: order.leverage || 1,
        marginMode: order.marginMode || 'cross',
        reduceOnly: order.reduceOnly || false,
        postOnly: false,
        timeInForce: 'GTC',
        status: order.status,
        clientOrderId: order.clientOrderId,
        source: 'engine',
      });
    }
  }

  // ============================================================
  // 资金费结算（持久化版本）
  // ============================================================

  async settleFunding(symbol: string): Promise<void> {
    super.settleFunding(symbol);

    if (this.persistEnabled) {
      // 资金费率记录
      const contract = await contractRepo.findBySymbol(symbol);
      if (!contract) return;

      // 标记价格同步等后续完善
    }
  }

  // ============================================================
  // 配置方法
  // ============================================================

  setPersistenceEnabled(enabled: boolean): void {
    this.persistEnabled = enabled;
  }

  isPersistenceEnabled(): boolean {
    return this.persistEnabled;
  }
}

// 全局单例（持久化版）
export const globalPerpEngine = new PerpEnginePersistence({
  enabled: process.env.NODE_ENV === 'production',
  loadFromDb: false,
});
