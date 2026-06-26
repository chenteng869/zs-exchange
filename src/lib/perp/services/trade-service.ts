import { PerpTrade, Prisma } from '@prisma/client';
import { tradeRepo, orderRepo, positionRepo } from '../repos';
import { PaginationParams, PaginatedResult } from '../repos/base-repo';

export class TradeService {
  private tradeRepo: typeof tradeRepo;
  private orderRepo: typeof orderRepo;
  private positionRepo: typeof positionRepo;

  constructor(
    customTradeRepo?: typeof tradeRepo,
    customOrderRepo?: typeof orderRepo,
    customPositionRepo?: typeof positionRepo
  ) {
    this.tradeRepo = customTradeRepo || tradeRepo;
    this.orderRepo = customOrderRepo || orderRepo;
    this.positionRepo = customPositionRepo || positionRepo;
  }

  async getById(id: string): Promise<PerpTrade | null> {
    return this.tradeRepo.findById(id);
  }

  async getByTradeNo(tradeNo: string): Promise<PerpTrade | null> {
    return this.tradeRepo.findByTradeNo(tradeNo);
  }

  async list(params: PaginationParams & {
    userId?: string;
    symbol?: string;
    side?: string;
    orderId?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<PaginatedResult<PerpTrade>> {
    return this.tradeRepo.paginate(params);
  }

  async getUserTrades(userId: string, symbol?: string, limit = 100): Promise<PerpTrade[]> {
    return this.tradeRepo.findByUserId(userId, symbol, limit);
  }

  async getOrderTrades(orderId: string): Promise<PerpTrade[]> {
    return this.tradeRepo.findByOrderId(orderId);
  }

  async recordTrade(data: Prisma.PerpTradeCreateInput): Promise<PerpTrade> {
    const tradeNo = `PT${Date.now()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    return this.tradeRepo.create({ ...data, tradeNo });
  }

  async recordTrades(data: Prisma.PerpTradeCreateManyInput[]): Promise<number> {
    return this.tradeRepo.createMany(data);
  }

  async calculatePnl(positionId: string): Promise<{
    realizedPnl: Prisma.Decimal;
    totalQty: Prisma.Decimal;
  }> {
    const position = await this.positionRepo.findById(positionId);
    if (!position) throw new Error('Position not found');

    return {
      realizedPnl: position.realizedPnl,
      totalQty: position.positionQty,
    };
  }
}

export const tradeService = new TradeService();
