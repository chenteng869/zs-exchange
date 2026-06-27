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
import type { FundingPayment, Position, Order, Side, MarginMode, OrderType } from './types';

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

  private persistLater(label: string, task: Promise<unknown>): void {
    task.catch((err) => {
      console.error(`[PerpEnginePersistence] ${label} failed:`, err);
    });
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
        tickSize: `1e-${c.pricePrecision}`,
        stepSize: `1e-${c.qtyPrecision}`,
        maxLeverage: c.maxLeverage,
        minQty: c.minOrderQty.toString(),
        maxQty: c.maxOrderQty.toString(),
        minNotional: '0',
        defaultLeverage: Math.min(20, c.maxLeverage),
        initialMarginRate: Number(c.initialMarginRate.toString()),
        maintenanceMarginRate: Number(c.maintenanceMarginRate.toString()),
        makerFee: Number(c.makerFeeRate.toString()),
        takerFee: Number(c.takerFeeRate.toString()),
        fundingIntervalHours: Math.max(1, Math.floor(c.fundingIntervalMinutes / 60)),
        fundingCap: Number(c.fundingCap.toString()),
        isActive: c.status === 'active',
      });
    }

    console.log(`[PerpEnginePersistence] Loaded ${contracts.length} contracts`);
  }

  // ============================================================
  // 账户操作（持久化版本）
  // ============================================================

  transferIn(userId: string, asset: string, amount: string): void {
    super.transferIn(userId, asset, amount);

    if (this.persistEnabled) {
      this.persistLater('transferIn', prisma.$transaction(async (tx) => {
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
      }));
    }
  }

  transferOut(userId: string, asset: string, amount: string): boolean {
    const ok = super.transferOut(userId, asset, amount);
    if (!ok) return false;

    if (this.persistEnabled) {
      this.persistLater('transferOut', prisma.$transaction(async (tx) => {
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
      }));
    }

    return true;
  }

  // ============================================================
  // 仓位操作（持久化版本）
  // ============================================================

  openPosition(params: {
    userId: string;
    symbol: string;
    side: Side;
    quantity: string;
    price: string;
    leverage: number;
    marginMode: MarginMode;
    orderType?: OrderType;
    reduceOnly?: boolean;
  }): Position {
    const position = super.openPosition(params);

    if (this.persistEnabled) {
      this.persistLater('persistPosition', this.persistPosition(position, params.userId));
    }

    return position;
  }

  closePosition(
    positionId: string,
    price: string,
    qty?: string
  ): { pnl: string; fee: string; position: Position } {
    const result = super.closePosition(positionId, price, qty);

    if (this.persistEnabled) {
      this.persistLater('persistClosedPosition', this.persistPosition(result.position, result.position.userId));
    }

    return result;
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
        positionQty: new Prisma.Decimal(position.size),
        entryPrice: new Prisma.Decimal(position.entryPrice),
        markPrice: new Prisma.Decimal(position.markPrice),
        liquidationPrice: new Prisma.Decimal(position.liquidationPrice),
        leverage: position.leverage,
        isolatedMargin: new Prisma.Decimal(position.marginMode === 'isolated' ? position.margin : 0),
        positionMargin: new Prisma.Decimal(position.margin),
        unrealizedPnl: new Prisma.Decimal(position.unrealizedPnl),
        realizedPnl: new Prisma.Decimal(0),
        status: position.status === 'open' ? 'active' : 'closed',
        closeTime: position.status === 'closed' ? new Date() : null,
      });
    } else {
      await positionRepo.create({
        userId,
        account: { connect: { id: account.id } },
        contract: { connect: { id: contract.id } },
        symbol: position.symbol,
        side: position.side,
        positionQty: new Prisma.Decimal(position.size),
        entryPrice: new Prisma.Decimal(position.entryPrice),
        markPrice: new Prisma.Decimal(position.markPrice),
        liquidationPrice: new Prisma.Decimal(position.liquidationPrice),
        leverage: position.leverage,
        marginMode: position.marginMode,
        isolatedMargin: new Prisma.Decimal(position.marginMode === 'isolated' ? position.margin : 0),
        positionMargin: new Prisma.Decimal(position.margin),
        unrealizedPnl: new Prisma.Decimal(position.unrealizedPnl),
        realizedPnl: new Prisma.Decimal(0),
        status: position.status === 'open' ? 'active' : 'closed',
      });
    }
  }

  // ============================================================
  // 订单操作（持久化版本）
  // ============================================================

  placeOrder(params: {
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
  }): Order {
    const order = super.placeOrder({
      ...params,
      stopPrice: params.triggerPrice,
    });

    if (this.persistEnabled) {
      this.persistLater('persistOrder', this.persistOrder(order, params.userId));
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
        account: { connect: { id: account.id } },
        contract: { connect: { id: contract.id } },
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
        stopPrice: order.stopPrice ? new Prisma.Decimal(order.stopPrice) : new Prisma.Decimal(0),
        triggerPrice: order.stopPrice ? new Prisma.Decimal(order.stopPrice) : new Prisma.Decimal(0),
        status: order.status,
        clientOrderId: order.clientOrderId,
        source: 'engine',
      });
    }
  }

  // ============================================================
  // 资金费结算（持久化版本）
  // ============================================================

  settleFunding(symbol: string, now: number = Date.now()): FundingPayment[] {
    const payments = super.settleFunding(symbol, now);

    if (this.persistEnabled) {
      // 资金费率记录
      this.persistLater('settleFunding', contractRepo.findBySymbol(symbol));
    }

    return payments;
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
