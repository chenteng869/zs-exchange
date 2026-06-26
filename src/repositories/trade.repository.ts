import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class TradeRepository extends BaseRepository<
  Prisma.TradeTradeGetPayload<{}>,
  Prisma.TradeTradeCreateInput,
  Prisma.TradeTradeUpdateInput,
  Prisma.TradeTradeWhereInput
> {
  constructor() {
    super('tradeTrade');
  }

  async findByUserId(userId: string, pagination: PaginationParams, filters?: {
    symbol?: string;
    side?: string;
  }): Promise<PaginatedResult<Prisma.TradeTradeGetPayload<{}>>> {
    const where: any = { userId };
    if (filters?.symbol) where.symbol = filters.symbol;
    if (filters?.side) where.side = filters.side;

    return this.paginate(pagination, where, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByOrderId(orderId: string) {
    return this.model.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySymbol(symbol: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.TradeTradeGetPayload<{}>>> {
    return this.paginate(pagination, { symbol } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async getRecentTrades(symbol: string, limit: number = 50) {
    return this.model.findMany({
      where: { symbol },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getTradeVolume(symbol: string, startTime: Date, endTime: Date) {
    const result = await this.model.aggregate({
      where: {
        symbol,
        createdAt: { gte: startTime, lte: endTime },
      },
      _sum: { amount: true, value: true, fee: true },
      _count: true,
    });
    return {
      volume: result._sum.amount || 0,
      quoteVolume: result._sum.value || 0,
      totalFee: result._sum.fee || 0,
      tradeCount: result._count,
    };
  }

  async getUserTradeVolume(userId: string, startTime: Date, endTime: Date) {
    const result = await this.model.aggregate({
      where: {
        userId,
        createdAt: { gte: startTime, lte: endTime },
      },
      _sum: { value: true, fee: true },
      _count: true,
    });
    return {
      volume: result._sum.value || 0,
      totalFee: result._sum.fee || 0,
      tradeCount: result._count,
    };
  }
}

export const tradeRepository = new TradeRepository();
export default tradeRepository;