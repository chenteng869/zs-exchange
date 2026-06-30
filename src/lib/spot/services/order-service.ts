import { SpotOrder, SpotMarket, Prisma, SpotOrderStatus, SpotOrderSide, SpotOrderType, SpotOrderTimeInForce } from '@prisma/client';
import { spotOrderRepo, spotAccountRepo, spotMarketRepo } from '../repos';
import { PaginationParams, PaginatedResult } from '../repos/base-repo';
import { spotMarketService } from './market-service';
import { spotAccountService } from './account-service';

export interface PlaceOrderParams {
  userId: string;
  marketSymbol: string;
  side: SpotOrderSide;
  orderType: SpotOrderType;
  price?: Prisma.Decimal;
  quantity: Prisma.Decimal;
  timeInForce?: SpotOrderTimeInForce;
  stopPrice?: Prisma.Decimal;
  clientOrderId?: string;
  source?: string;
}

export class SpotOrderService {
  private orderRepo: typeof spotOrderRepo;
  private marketService: typeof spotMarketService;
  private accountService: typeof spotAccountService;

  constructor(customOrderRepo?: typeof spotOrderRepo, customMarketService?: typeof spotMarketService, customAccountService?: typeof spotAccountService) {
    this.orderRepo = customOrderRepo || spotOrderRepo;
    this.marketService = customMarketService || spotMarketService;
    this.accountService = customAccountService || spotAccountService;
  }

  async getById(id: string): Promise<SpotOrder | null> {
    return this.orderRepo.findById(id);
  }

  async getByOrderNo(orderNo: string): Promise<SpotOrder | null> {
    return this.orderRepo.findByOrderNo(orderNo);
  }

  async getByClientOrderId(clientOrderId: string): Promise<SpotOrder | null> {
    return this.orderRepo.findByClientOrderId(clientOrderId);
  }

  async getByUserId(userId: string): Promise<SpotOrder[]> {
    return this.orderRepo.findByUserId(userId);
  }

  async getByUserIdAndMarket(userId: string, marketSymbol: string): Promise<SpotOrder[]> {
    return this.orderRepo.findByUserIdAndMarket(userId, marketSymbol);
  }

  async getOpenOrders(userId: string): Promise<SpotOrder[]> {
    return this.orderRepo.findOpenOrdersByUserId(userId);
  }

  async getOpenOrdersByMarket(marketId: bigint): Promise<SpotOrder[]> {
    return this.orderRepo.findOpenOrdersByMarket(marketId);
  }

  async list(params: PaginationParams & {
    userId?: string;
    marketSymbol?: string;
    status?: SpotOrderStatus;
    side?: SpotOrderSide;
    orderType?: SpotOrderType;
  }): Promise<PaginatedResult<SpotOrder>> {
    return this.orderRepo.paginate(params);
  }

  async validateOrder(params: PlaceOrderParams): Promise<{ market: SpotMarket; error?: string }> {
    const market = await this.marketService.validateMarket(params.marketSymbol);
    if (!market) {
      return { market: null as unknown as SpotMarket, error: 'Market not found or not trading' };
    }

    const price = params.orderType === SpotOrderType.market ? new Prisma.Decimal(0) : params.price;
    const quantity = params.quantity;

    if (quantity.lte(0)) {
      return { market, error: 'Quantity must be positive' };
    }

    if (quantity.lt(market.minQuantity)) {
      return { market, error: `Quantity must be at least ${market.minQuantity}` };
    }

    if (market.maxQuantity.gt(0) && quantity.gt(market.maxQuantity)) {
      return { market, error: `Quantity must be at most ${market.maxQuantity}` };
    }

    if (params.orderType !== SpotOrderType.market) {
      if (!price || price.lte(0)) {
        return { market, error: 'Price must be positive for limit orders' };
      }
    }

    if (params.orderType === SpotOrderType.limit || params.orderType === SpotOrderType.stop_limit) {
      const notional = price!.mul(quantity);
      if (notional.lt(market.minNotional)) {
        return { market, error: `Order value must be at least ${market.minNotional}` };
      }
      if (market.maxNotional.gt(0) && notional.gt(market.maxNotional)) {
        return { market, error: `Order value must be at most ${market.maxNotional}` };
      }
    }

    if (params.orderType === SpotOrderType.stop_limit || params.orderType === SpotOrderType.stop_market) {
      if (!params.stopPrice || params.stopPrice.lte(0)) {
        return { market, error: 'Stop price must be positive' };
      }
    }

    return { market };
  }

  async createOrder(params: PlaceOrderParams): Promise<SpotOrder> {
    return this.placeOrder(params);
  }

  async placeOrder(params: PlaceOrderParams): Promise<SpotOrder> {
    const validation = await this.validateOrder(params);
    if (validation.error) {
      throw new Error(validation.error);
    }

    const market = validation.market;
    const price = params.orderType === SpotOrderType.market ? new Prisma.Decimal(0) : params.price!;
    const quantity = params.quantity;

    if (params.side === SpotOrderSide.buy) {
      const requiredQuote = price.mul(quantity);
      await this.accountService.freeze(params.userId, market.quoteAsset, requiredQuote);
    } else {
      await this.accountService.freeze(params.userId, market.baseAsset, quantity);
    }

    const baseAccount = await spotAccountRepo.findByUserIdAndAsset(params.userId, market.baseAsset);
    const quoteAccount = await spotAccountRepo.findByUserIdAndAsset(params.userId, market.quoteAsset);

    const account = params.side === SpotOrderSide.buy && quoteAccount ? quoteAccount : baseAccount;
    const orderData: Prisma.SpotOrderCreateInput = {
      orderNo: `SO${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      userId: params.userId,
      account: account ? { connect: { id: account.id } } : undefined,
      market: { connect: { id: market.id } },
      marketSymbol: market.marketSymbol,
      side: params.side,
      orderType: params.orderType,
      price,
      quantity,
      filledQuantity: new Prisma.Decimal(0),
      remainingQuantity: quantity,
      executedValue: new Prisma.Decimal(0),
      fee: new Prisma.Decimal(0),
      feeCurrency: params.side === SpotOrderSide.buy ? market.quoteAsset : market.baseAsset,
      timeInForce: params.timeInForce || SpotOrderTimeInForce.GTC,
      stopPrice: params.stopPrice,
      status: SpotOrderStatus.open,
      clientOrderId: params.clientOrderId,
      source: params.source || 'web',
    };

    return this.orderRepo.create(orderData);
  }

  async cancelOrder(orderId: string): Promise<SpotOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === SpotOrderStatus.filled || order.status === SpotOrderStatus.canceled || order.status === SpotOrderStatus.expired) {
      throw new Error('Order cannot be canceled');
    }

    const updatedOrder = await this.orderRepo.cancel(orderId);

    if (order.remainingQuantity.gt(0)) {
      const market = await this.marketService.getById(order.marketId);
      if (!market) throw new Error('Market not found');

      if (order.side === SpotOrderSide.buy) {
        const frozenValue = order.price.mul(order.remainingQuantity);
        await this.accountService.unfreeze(order.userId, market.quoteAsset, frozenValue);
      } else {
        await this.accountService.unfreeze(order.userId, market.baseAsset, order.remainingQuantity);
      }
    }

    return updatedOrder;
  }

  async cancelByOrderNo(orderNo: string): Promise<SpotOrder> {
    const order = await this.orderRepo.findByOrderNo(orderNo);
    if (!order) {
      throw new Error('Order not found');
    }
    return this.cancelOrder(order.id);
  }

  async expireOrder(orderId: string): Promise<SpotOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const updatedOrder = await this.orderRepo.expire(orderId);

    if (order.remainingQuantity.gt(0)) {
      const market = await this.marketService.getById(order.marketId);
      if (!market) throw new Error('Market not found');

      if (order.side === SpotOrderSide.buy) {
        const frozenValue = order.price.mul(order.remainingQuantity);
        await this.accountService.unfreeze(order.userId, market.quoteAsset, frozenValue);
      } else {
        await this.accountService.unfreeze(order.userId, market.baseAsset, order.remainingQuantity);
      }
    }

    return updatedOrder;
  }

  async updateOrderStatus(orderId: string, status: SpotOrderStatus): Promise<SpotOrder> {
    return this.orderRepo.updateStatus(orderId, status);
  }

  async updateFilled(orderNo: string, filledQuantity: Prisma.Decimal, executedValue: Prisma.Decimal, remainingQuantity: Prisma.Decimal): Promise<SpotOrder> {
    return this.orderRepo.updateFilled(orderNo, filledQuantity, executedValue, remainingQuantity);
  }

  async addFilled(orderNo: string, filledQuantity: Prisma.Decimal, executedValue: Prisma.Decimal): Promise<SpotOrder> {
    return this.orderRepo.addFilled(orderNo, filledQuantity, executedValue);
  }

  async addFee(orderNo: string, fee: Prisma.Decimal): Promise<SpotOrder> {
    return this.orderRepo.addFee(orderNo, fee);
  }

  async update(orderId: string, data: Partial<Prisma.SpotOrderUpdateInput>): Promise<SpotOrder> {
    return this.orderRepo.update(orderId, data);
  }

  async deleteOrder(orderId: string): Promise<SpotOrder> {
    return this.orderRepo.delete(orderId);
  }

  async getOrderHistory(userId: string, marketSymbol?: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResult<SpotOrder>> {
    return this.orderRepo.paginate({
      page,
      pageSize,
      userId,
      marketSymbol,
    });
  }

  async getOpenOrdersPaginated(userId: string, marketSymbol?: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResult<SpotOrder>> {
    return this.orderRepo.paginate({
      page,
      pageSize,
      userId,
      marketSymbol,
      status: SpotOrderStatus.open,
    });
  }
}

export const spotOrderService = new SpotOrderService();