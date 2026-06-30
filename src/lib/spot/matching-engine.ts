import { EventEmitter } from 'events';
import { Prisma } from '@prisma/client';
import { SpotOrder, SpotMarket, SpotOrderStatus, SpotOrderSide, SpotOrderType, SpotOrderTimeInForce, SpotTrade, SpotTradeRole, SpotAccountLedgerType } from '@prisma/client';
import { spotOrderService } from './services/order-service';
import { spotAccountService } from './services/account-service';
import { spotTradeService } from './services/trade-service';
import { spotMarketService } from './services/market-service';
import { spotOrderRepo } from './repos';
import { logger } from '@/lib/logger';

export type SpotEngineEvent = 'orderMatched' | 'orderCancelled' | 'orderRejected' | 'orderAccepted' | 'orderFilled';

export interface MatchResult {
  makerOrderId: string;
  takerOrderId: string;
  price: Prisma.Decimal;
  quantity: Prisma.Decimal;
  executedAt: string;
}

export interface BookLevel {
  price: Prisma.Decimal;
  quantity: Prisma.Decimal;
  orders: Array<{ orderId: string; quantity: Prisma.Decimal; userId: string }>;
}

export class SpotMatchingEngine {
  private readonly orderbooks = new Map<string, { bids: Map<string, BookLevel>; asks: Map<string, BookLevel> }>();
  private readonly orders = new Map<string, SpotOrder>();
  private readonly userOrders = new Map<string, Set<string>>();
  private readonly recentTrades = new Map<string, SpotTrade[]>();
  private readonly recentTradeCap = 1000;
  private readonly emitter = new EventEmitter();

  on(event: SpotEngineEvent, listener: (payload: unknown) => void): this {
    this.emitter.on(event, listener);
    return this;
  }

  off(event: SpotEngineEvent, listener: (payload: unknown) => void): this {
    this.emitter.off(event, listener);
    return this;
  }

  private emit(event: SpotEngineEvent, payload: unknown) {
    try {
      this.emitter.emit(event, payload);
    } catch (e) {
      logger.error('[spot-engine] listener error', e);
    }
  }

  async registerMarket(market: SpotMarket): Promise<void> {
    const symbol = market.marketSymbol;
    if (!this.orderbooks.has(symbol)) {
      this.orderbooks.set(symbol, { bids: new Map(), asks: new Map() });
    }

    const existingOrders = await spotOrderRepo.findOpenOrdersByMarket(market.id);
    for (const order of existingOrders) {
      this.orders.set(order.id, order);
      this.addToBook(order);
      this.trackUserOrder(order.userId, order.id);
    }
  }

  getOrderBook(marketSymbol: string, depth: number = 20): { bids: Array<{ price: string; quantity: string }>; asks: Array<{ price: string; quantity: string }> } {
    const book = this.getBook(marketSymbol);
    const bids = Array.from(book.bids.values())
      .sort((a, b) => parseFloat(b.price.toString()) - parseFloat(a.price.toString()))
      .slice(0, depth)
      .map(level => ({ price: level.price.toString(), quantity: level.quantity.toString() }));

    const asks = Array.from(book.asks.values())
      .sort((a, b) => parseFloat(a.price.toString()) - parseFloat(b.price.toString()))
      .slice(0, depth)
      .map(level => ({ price: level.price.toString(), quantity: level.quantity.toString() }));

    return { bids, asks };
  }

  getRecentTrades(marketSymbol: string, limit: number = 50): SpotTrade[] {
    const list = this.recentTrades.get(marketSymbol) ?? [];
    return list.slice(-limit).reverse();
  }

  getOpenOrders(userId?: string, marketSymbol?: string): SpotOrder[] {
    const out: SpotOrder[] = [];
    if (userId) {
      const set = this.userOrders.get(userId);
      if (!set) return [];
      for (const oid of set) {
        const o = this.orders.get(oid);
        if (!o) continue;
        if (marketSymbol && o.marketSymbol !== marketSymbol) continue;
        out.push(o);
      }
    } else {
      for (const o of this.orders.values()) {
        if (marketSymbol && o.marketSymbol !== marketSymbol) continue;
        out.push(o);
      }
    }
    return out;
  }

  getOrder(orderId: string): SpotOrder | undefined {
    return this.orders.get(orderId);
  }

  async submitOrder(order: SpotOrder): Promise<{ order: SpotOrder; trades: SpotTrade[]; matchResults: MatchResult[] }> {
    const market = await spotMarketService.getById(order.marketId);
    if (!market) {
      throw new Error('Market not found');
    }

    this.orders.set(order.id, order);
    this.trackUserOrder(order.userId, order.id);

    const matchResults: MatchResult[] = [];
    const trades: SpotTrade[] = [];

    if (order.orderType === SpotOrderType.market || order.orderType === SpotOrderType.limit) {
      const results = await this.matchOrder(order, market);
      matchResults.push(...results);

      for (const result of results) {
        const trade = await this.settleMatch(order, result, market);
        if (trade) {
          trades.push(trade);
          this.recordTrade(trade);
        }
      }
    }

    this.updateOrderState(order, market);

    if (order.status === SpotOrderStatus.filled) {
      this.untrackUserOrder(order.userId, order.id);
      this.removeFromBook(order);
      this.emit('orderFilled', { order });
    } else if (order.status === SpotOrderStatus.partially_filled && order.orderType === SpotOrderType.limit) {
      this.updateInBook(order);
      this.emit('orderAccepted', { order });
    } else if (order.status === SpotOrderStatus.open) {
      this.addToBook(order);
      this.emit('orderAccepted', { order });
    }

    return { order, trades, matchResults };
  }

  async cancelOrder(orderId: string): Promise<SpotOrder> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const market = await spotMarketService.getById(order.marketId);
    if (!market) {
      throw new Error('Market not found');
    }

    this.removeFromBook(order);
    this.orders.delete(orderId);
    this.untrackUserOrder(order.userId, orderId);

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

    await spotOrderRepo.update(orderId, { status: order.status, canceledAt: order.canceledAt });

    this.emit('orderCancelled', { order });

    return order;
  }

  private getBook(marketSymbol: string): { bids: Map<string, BookLevel>; asks: Map<string, BookLevel> } {
    let book = this.orderbooks.get(marketSymbol);
    if (!book) {
      book = { bids: new Map(), asks: new Map() };
      this.orderbooks.set(marketSymbol, book);
    }
    return book;
  }

  private addToBook(order: SpotOrder): void {
    if (order.status !== SpotOrderStatus.open && order.status !== SpotOrderStatus.partially_filled) {
      return;
    }

    const book = this.getBook(order.marketSymbol);
    const isBuy = order.side === SpotOrderSide.buy;
    const levels = isBuy ? book.bids : book.asks;
    const priceKey = order.price.toString();

    let level = levels.get(priceKey);
    if (!level) {
      level = { price: order.price, quantity: new Prisma.Decimal(0), orders: [] };
      levels.set(priceKey, level);
    }

    level.quantity = level.quantity.add(order.remainingQuantity);
    level.orders.push({ orderId: order.id, quantity: order.remainingQuantity, userId: order.userId });
  }

  private removeFromBook(order: SpotOrder): void {
    const book = this.getBook(order.marketSymbol);
    const isBuy = order.side === SpotOrderSide.buy;
    const levels = isBuy ? book.bids : book.asks;
    const priceKey = order.price.toString();

    const level = levels.get(priceKey);
    if (!level) return;

    const orderIndex = level.orders.findIndex(o => o.orderId === order.id);
    if (orderIndex !== -1) {
      level.quantity = level.quantity.sub(level.orders[orderIndex].quantity);
      level.orders.splice(orderIndex, 1);

      if (level.quantity.lte(0) || level.orders.length === 0) {
        levels.delete(priceKey);
      }
    }
  }

  private updateInBook(order: SpotOrder): void {
    this.removeFromBook(order);
    this.addToBook(order);
  }

  private async matchOrder(order: SpotOrder, market: SpotMarket): Promise<MatchResult[]> {
    const results: MatchResult[] = [];
    const book = this.getBook(order.marketSymbol);
    const isBuy = order.side === SpotOrderSide.buy;
    const counterLevels = isBuy ? book.asks : book.bids;

    const counterLevelsArray = Array.from(counterLevels.entries())
      .map(([key, level]) => level)
      .sort((a, b) => isBuy 
        ? parseFloat(a.price.toString()) - parseFloat(b.price.toString()) 
        : parseFloat(b.price.toString()) - parseFloat(a.price.toString()));

    let remainingQuantity = order.remainingQuantity;

    for (const level of counterLevelsArray) {
      if (remainingQuantity.lte(0)) break;

      const shouldMatch = isBuy
        ? order.orderType === SpotOrderType.market || level.price.lte(order.price)
        : order.orderType === SpotOrderType.market || level.price.gte(order.price);

      if (!shouldMatch) break;

      for (const bookOrder of [...level.orders]) {
        if (remainingQuantity.lte(0)) break;

        if (bookOrder.userId === order.userId) continue;

        const counterOrder = this.orders.get(bookOrder.orderId);
        if (!counterOrder) continue;

        const matchQty = Prisma.Decimal.min(remainingQuantity, bookOrder.quantity);
        const matchPrice = level.price;

        results.push({
          makerOrderId: bookOrder.orderId,
          takerOrderId: order.id,
          price: matchPrice,
          quantity: matchQty,
          executedAt: new Date().toISOString(),
        });

        remainingQuantity = remainingQuantity.sub(matchQty);

        await this.updateMakerOrder(counterOrder, matchQty, matchPrice, market);
      }
    }

    return results;
  }

  private async updateMakerOrder(makerOrder: SpotOrder, filledQty: Prisma.Decimal, price: Prisma.Decimal, market: SpotMarket): Promise<void> {
    makerOrder.filledQuantity = makerOrder.filledQuantity.add(filledQty);
    makerOrder.remainingQuantity = makerOrder.remainingQuantity.sub(filledQty);
    makerOrder.executedValue = makerOrder.executedValue.add(price.mul(filledQty));

    if (makerOrder.remainingQuantity.lte(0)) {
      makerOrder.status = SpotOrderStatus.filled;
      this.untrackUserOrder(makerOrder.userId, makerOrder.id);
      this.removeFromBook(makerOrder);
      this.emit('orderFilled', { order: makerOrder });
    } else {
      makerOrder.status = SpotOrderStatus.partially_filled;
      this.updateInBook(makerOrder);
    }

    this.orders.set(makerOrder.id, makerOrder);
    await spotOrderRepo.update(makerOrder.id, {
      filledQuantity: makerOrder.filledQuantity,
      remainingQuantity: makerOrder.remainingQuantity,
      executedValue: makerOrder.executedValue,
      status: makerOrder.status,
    });

    if (makerOrder.side === SpotOrderSide.sell) {
      await spotAccountService.consumeFrozen(makerOrder.userId, market.baseAsset, filledQty);
      await spotAccountService.addBalance(makerOrder.userId, market.quoteAsset, price.mul(filledQty));
    } else {
      await spotAccountService.consumeFrozen(makerOrder.userId, market.quoteAsset, price.mul(filledQty));
      await spotAccountService.addBalance(makerOrder.userId, market.baseAsset, filledQty);
    }
  }

  private async settleMatch(takerOrder: SpotOrder, matchResult: MatchResult, market: SpotMarket): Promise<SpotTrade | null> {
    const makerOrder = this.orders.get(matchResult.makerOrderId);
    if (!makerOrder) return null;

    const tradePrice = matchResult.price;
    const tradeQty = matchResult.quantity;
    const tradeValue = tradePrice.mul(tradeQty);

    const takerFeeRate = market.takerFeeRate;
    const makerFeeRate = market.makerFeeRate;

    const takerFee = tradeValue.mul(takerFeeRate);
    const makerFee = tradeValue.mul(makerFeeRate);

    if (takerOrder.side === SpotOrderSide.buy) {
      await spotAccountService.consumeFrozen(takerOrder.userId, market.quoteAsset, tradeValue);
      await spotAccountService.addBalance(takerOrder.userId, market.baseAsset, tradeQty);
      await spotAccountService.subtractBalance(takerOrder.userId, market.quoteAsset, takerFee);
    } else {
      await spotAccountService.consumeFrozen(takerOrder.userId, market.baseAsset, tradeQty);
      await spotAccountService.addBalance(takerOrder.userId, market.quoteAsset, tradeValue);
      await spotAccountService.subtractBalance(takerOrder.userId, market.quoteAsset, takerFee);
    }

    const trade = await spotTradeService.create({
      orderId: takerOrder.id,
      counterOrderId: makerOrder.id,
      userId: takerOrder.userId,
      counterUserId: makerOrder.userId,
      marketId: market.id,
      marketSymbol: market.marketSymbol,
      side: takerOrder.side,
      price: tradePrice,
      quantity: tradeQty,
      value: tradeValue,
      fee: takerFee,
      feeCurrency: market.quoteAsset,
      role: SpotTradeRole.taker,
      makerOrderNo: makerOrder.orderNo,
      takerOrderNo: takerOrder.orderNo,
    });

    await spotTradeService.create({
      orderId: makerOrder.id,
      counterOrderId: takerOrder.id,
      userId: makerOrder.userId,
      counterUserId: takerOrder.userId,
      marketId: market.id,
      marketSymbol: market.marketSymbol,
      side: makerOrder.side,
      price: tradePrice,
      quantity: tradeQty,
      value: tradeValue,
      fee: makerFee,
      feeCurrency: market.quoteAsset,
      role: SpotTradeRole.maker,
      makerOrderNo: makerOrder.orderNo,
      takerOrderNo: takerOrder.orderNo,
    });

    await spotOrderRepo.addFee(takerOrder.orderNo, takerFee);
    await spotOrderRepo.addFee(makerOrder.orderNo, makerFee);

    return trade;
  }

  private updateOrderState(order: SpotOrder, market: SpotMarket): void {
    if (order.remainingQuantity.lte(0)) {
      order.status = SpotOrderStatus.filled;
    } else if (order.filledQuantity.gt(0)) {
      order.status = SpotOrderStatus.partially_filled;
    } else {
      order.status = SpotOrderStatus.open;
    }

    this.orders.set(order.id, order);

    if (order.status === SpotOrderStatus.filled) {
      if (order.side === SpotOrderSide.buy) {
        const unfrozenValue = order.price.mul(order.remainingQuantity);
        if (unfrozenValue.gt(0)) {
          spotAccountService.unfreeze(order.userId, market.quoteAsset, unfrozenValue);
        }
      } else {
        if (order.remainingQuantity.gt(0)) {
          spotAccountService.unfreeze(order.userId, market.baseAsset, order.remainingQuantity);
        }
      }
    }

    spotOrderRepo.update(order.id, {
      filledQuantity: order.filledQuantity,
      remainingQuantity: order.remainingQuantity,
      executedValue: order.executedValue,
      status: order.status,
    });
  }

  private recordTrade(trade: SpotTrade): void {
    const list = this.recentTrades.get(trade.marketSymbol) ?? [];
    list.push(trade);
    if (list.length > this.recentTradeCap) {
      list.splice(0, list.length - this.recentTradeCap);
    }
    this.recentTrades.set(trade.marketSymbol, list);
  }

  private trackUserOrder(userId: string, orderId: string): void {
    let set = this.userOrders.get(userId);
    if (!set) {
      set = new Set();
      this.userOrders.set(userId, set);
    }
    set.add(orderId);
  }

  private untrackUserOrder(userId: string, orderId: string): void {
    const set = this.userOrders.get(userId);
    if (set) set.delete(orderId);
  }
}

let _instance: SpotMatchingEngine | null = null;

export function getSpotMatchingEngine(): SpotMatchingEngine {
  if (!_instance) _instance = new SpotMatchingEngine();
  return _instance;
}

export function setSpotMatchingEngine(engine: SpotMatchingEngine): void {
  _instance = engine;
}