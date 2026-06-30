import { Prisma, SpotOrder, SpotOrderSide, SpotOrderStatus, SpotTrade, SpotTradeRole } from '@prisma/client';
import { spotAccountService } from './account-service';
import { spotTradeService, CreateTradeManyParams } from './trade-service';
import { spotOrderService } from './order-service';
import { spotMarketService } from './market-service';
import { logger } from '@/lib/logger';

export interface SettlementResult {
  success: boolean;
  trade?: SpotTrade;
  error?: string;
}

export class SpotSettlementService {
  async settleTrade(makerOrder: SpotOrder, takerOrder: SpotOrder, price: Prisma.Decimal, quantity: Prisma.Decimal): Promise<SettlementResult> {
    try {
      const market = await spotMarketService.getById(makerOrder.marketId);
      if (!market) {
        return { success: false, error: 'Market not found' };
      }

      const tradeValue = price.mul(quantity);
      const takerFee = tradeValue.mul(market.takerFeeRate);
      const makerFee = tradeValue.mul(market.makerFeeRate);

      if (takerOrder.side === SpotOrderSide.buy) {
        await spotAccountService.consumeFrozen(takerOrder.userId, market.quoteAsset, tradeValue);
        await spotAccountService.addBalance(takerOrder.userId, market.baseAsset, quantity);
        await spotAccountService.subtractBalance(takerOrder.userId, market.quoteAsset, takerFee);

        await spotAccountService.consumeFrozen(makerOrder.userId, market.baseAsset, quantity);
        await spotAccountService.addBalance(makerOrder.userId, market.quoteAsset, tradeValue);
        await spotAccountService.subtractBalance(makerOrder.userId, market.quoteAsset, makerFee);
      } else {
        await spotAccountService.consumeFrozen(takerOrder.userId, market.baseAsset, quantity);
        await spotAccountService.addBalance(takerOrder.userId, market.quoteAsset, tradeValue);
        await spotAccountService.subtractBalance(takerOrder.userId, market.quoteAsset, takerFee);

        await spotAccountService.consumeFrozen(makerOrder.userId, market.quoteAsset, tradeValue);
        await spotAccountService.addBalance(makerOrder.userId, market.baseAsset, quantity);
        await spotAccountService.subtractBalance(makerOrder.userId, market.quoteAsset, makerFee);
      }

      await this.createTradeRecords(makerOrder, takerOrder, price, quantity, tradeValue, takerFee, makerFee, market);

      await this.updateOrderAfterTrade(makerOrder, quantity, price);
      await this.updateOrderAfterTrade(takerOrder, quantity, price);

      const trade = await spotTradeService.getByOrderId(takerOrder.id);

      return { success: true, trade: trade[0] };
    } catch (error) {
      logger.error('[spot-settlement] settleTrade failed', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async createTradeRecords(makerOrder: SpotOrder, takerOrder: SpotOrder, price: Prisma.Decimal, quantity: Prisma.Decimal, value: Prisma.Decimal, takerFee: Prisma.Decimal, makerFee: Prisma.Decimal, market: { quoteAsset: string; marketSymbol: string }) {
    const trades: CreateTradeManyParams[] = [
      {
        tradeNo: `ST${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        orderId: takerOrder.id,
        counterOrderId: makerOrder.id,
        userId: takerOrder.userId,
        counterUserId: makerOrder.userId,
        marketId: takerOrder.marketId,
        marketSymbol: market.marketSymbol,
        side: takerOrder.side,
        price,
        quantity,
        value,
        fee: takerFee,
        feeCurrency: market.quoteAsset,
        role: SpotTradeRole.taker,
        makerOrderNo: makerOrder.orderNo,
        takerOrderNo: takerOrder.orderNo,
      },
      {
        tradeNo: `ST${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        orderId: makerOrder.id,
        counterOrderId: takerOrder.id,
        userId: makerOrder.userId,
        counterUserId: takerOrder.userId,
        marketId: makerOrder.marketId,
        marketSymbol: market.marketSymbol,
        side: makerOrder.side,
        price,
        quantity,
        value,
        fee: makerFee,
        feeCurrency: market.quoteAsset,
        role: SpotTradeRole.maker,
        makerOrderNo: makerOrder.orderNo,
        takerOrderNo: takerOrder.orderNo,
      },
    ];

    await spotTradeService.createBatch(trades);
  }

  private async updateOrderAfterTrade(order: SpotOrder, filledQty: Prisma.Decimal, price: Prisma.Decimal) {
    order.filledQuantity = order.filledQuantity.add(filledQty);
    order.remainingQuantity = order.remainingQuantity.sub(filledQty);
    order.executedValue = order.executedValue.add(price.mul(filledQty));

    if (order.remainingQuantity.lte(0)) {
      order.status = SpotOrderStatus.filled;
    } else {
      order.status = SpotOrderStatus.partially_filled;
    }

    await spotOrderService.update(order.id, {
      filledQuantity: order.filledQuantity,
      remainingQuantity: order.remainingQuantity,
      executedValue: order.executedValue,
      status: order.status,
    });
  }

  async settleCancellation(order: SpotOrder): Promise<SettlementResult> {
    try {
      const market = await spotMarketService.getById(order.marketId);
      if (!market) {
        return { success: false, error: 'Market not found' };
      }

      if (order.remainingQuantity.gt(0)) {
        if (order.side === SpotOrderSide.buy) {
          const frozenValue = order.price.mul(order.remainingQuantity);
          await spotAccountService.unfreeze(order.userId, market.quoteAsset, frozenValue);
        } else {
          await spotAccountService.unfreeze(order.userId, market.baseAsset, order.remainingQuantity);
        }
      }

      order.status = SpotOrderStatus.canceled;
      order.canceledAt = new Date();

      await spotOrderService.update(order.id, {
        status: order.status,
        canceledAt: order.canceledAt,
      });

      return { success: true };
    } catch (error) {
      logger.error('[spot-settlement] settleCancellation failed', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async settleExpired(order: SpotOrder): Promise<SettlementResult> {
    return this.settleCancellation(order);
  }
}

export const spotSettlementService = new SpotSettlementService();