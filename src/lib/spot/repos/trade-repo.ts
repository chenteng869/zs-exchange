import { SpotTrade, Prisma, SpotOrderSide, SpotTradeRole } from '@prisma/client';
import { BaseRepository, PaginationParams, PaginatedResult, buildPagination, toPaginatedResult } from './base-repo';

export class SpotTradeRepository extends BaseRepository {
  async findById(id: string): Promise<SpotTrade | null> {
    return this.prisma.spotTrade.findUnique({ where: { id } });
  }

  async findByTradeNo(tradeNo: string): Promise<SpotTrade | null> {
    return this.prisma.spotTrade.findUnique({ where: { tradeNo } });
  }

  async findByOrderId(orderId: string): Promise<SpotTrade[]> {
    return this.prisma.spotTrade.findMany({
      where: { orderId },
      orderBy: { tradeTime: 'desc' },
    });
  }

  async findByUserId(userId: string): Promise<SpotTrade[]> {
    return this.prisma.spotTrade.findMany({
      where: { userId },
      orderBy: { tradeTime: 'desc' },
    });
  }

  async findByUserIdAndMarket(userId: string, marketSymbol: string): Promise<SpotTrade[]> {
    return this.prisma.spotTrade.findMany({
      where: { userId, marketSymbol },
      orderBy: { tradeTime: 'desc' },
    });
  }

  async findByMarket(marketId: bigint): Promise<SpotTrade[]> {
    return this.prisma.spotTrade.findMany({
      where: { marketId },
      orderBy: { tradeTime: 'desc' },
    });
  }

  async findRecentTrades(marketId: bigint, limit: number = 50): Promise<SpotTrade[]> {
    return this.prisma.spotTrade.findMany({
      where: { marketId },
      orderBy: { tradeTime: 'desc' },
      take: limit,
    });
  }

  async paginate(params: PaginationParams & {
    userId?: string;
    marketSymbol?: string;
    orderId?: string;
    side?: SpotOrderSide;
    role?: SpotTradeRole;
  }): Promise<PaginatedResult<SpotTrade>> {
    const { skip, take, page, pageSize } = buildPagination(params);
    const where: Prisma.SpotTradeWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.marketSymbol) where.marketSymbol = params.marketSymbol;
    if (params.orderId) where.orderId = params.orderId;
    if (params.side) where.side = params.side;
    if (params.role) where.role = params.role;

    const [items, total] = await Promise.all([
      this.prisma.spotTrade.findMany({ where, skip, take, orderBy: { tradeTime: 'desc' } }),
      this.prisma.spotTrade.count({ where }),
    ]);

    return toPaginatedResult(items, total, page, pageSize);
  }

  async create(data: Prisma.SpotTradeCreateInput): Promise<SpotTrade> {
    return this.prisma.spotTrade.create({ data });
  }

  async createBatch(data: Prisma.SpotTradeCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return this.prisma.spotTrade.createMany({ data, skipDuplicates: true });
  }

  async get24hVolume(marketId: bigint): Promise<Prisma.Decimal> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.prisma.spotTrade.aggregate({
      where: { marketId, tradeTime: { gte: twentyFourHoursAgo } },
      _sum: { value: true },
    });
    return result._sum.value || new Prisma.Decimal(0);
  }
}

export const spotTradeRepo = new SpotTradeRepository();