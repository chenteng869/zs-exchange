import { PerpTrade, Prisma } from '@prisma/client';
import { BaseRepository, PaginationParams, PaginatedResult, buildPagination, toPaginatedResult } from './base-repo';

export class TradeRepository extends BaseRepository {
  async findById(id: string): Promise<PerpTrade | null> {
    return this.prisma.perpTrade.findUnique({ where: { id } });
  }

  async findByTradeNo(tradeNo: string): Promise<PerpTrade | null> {
    return this.prisma.perpTrade.findUnique({ where: { tradeNo } });
  }

  async findByOrderId(orderId: string): Promise<PerpTrade[]> {
    return this.prisma.perpTrade.findMany({ where: { orderId }, orderBy: { tradeTime: 'asc' } });
  }

  async findByUserId(userId: string, symbol?: string, limit = 100): Promise<PerpTrade[]> {
    const where: Prisma.PerpTradeWhereInput = { userId };
    if (symbol) where.symbol = symbol;
    return this.prisma.perpTrade.findMany({ where, orderBy: { tradeTime: 'desc' }, take: limit });
  }

  async paginate(params: PaginationParams & {
    userId?: string;
    symbol?: string;
    side?: string;
    orderId?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<PaginatedResult<PerpTrade>> {
    const { skip, take, page, pageSize } = buildPagination(params);
    const where: Prisma.PerpTradeWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.symbol) where.symbol = params.symbol;
    if (params.side) where.side = params.side;
    if (params.orderId) where.orderId = params.orderId;
    if (params.startTime || params.endTime) {
      where.tradeTime = {};
      if (params.startTime) where.tradeTime.gte = params.startTime;
      if (params.endTime) where.tradeTime.lte = params.endTime;
    }

    const [items, total] = await Promise.all([
      this.prisma.perpTrade.findMany({ where, skip, take, orderBy: { tradeTime: 'desc' } }),
      this.prisma.perpTrade.count({ where }),
    ]);

    return toPaginatedResult(items, total, page, pageSize);
  }

  async create(data: Prisma.PerpTradeCreateInput): Promise<PerpTrade> {
    return this.prisma.perpTrade.create({ data });
  }

  async createMany(data: Prisma.PerpTradeCreateManyInput[]): Promise<number> {
    const result = await this.prisma.perpTrade.createMany({ data });
    return result.count;
  }
}

export const tradeRepo = new TradeRepository();
