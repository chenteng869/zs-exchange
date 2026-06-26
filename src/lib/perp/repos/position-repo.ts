import { PerpPosition, Prisma } from '@prisma/client';
import { BaseRepository, PaginationParams, PaginatedResult, buildPagination, toPaginatedResult } from './base-repo';

export class PositionRepository extends BaseRepository {
  async findById(id: string): Promise<PerpPosition | null> {
    return this.prisma.perpPosition.findUnique({ where: { id } });
  }

  async findByUserSymbolSideMargin(
    userId: string,
    symbol: string,
    side: string,
    marginMode: string
  ): Promise<PerpPosition | null> {
    return this.prisma.perpPosition.findUnique({
      where: { userId_symbol_side_marginMode: { userId, symbol, side, marginMode } },
    });
  }

  async findByUserId(userId: string, symbol?: string): Promise<PerpPosition[]> {
    const where: Prisma.PerpPositionWhereInput = { userId, status: 'active' };
    if (symbol) where.symbol = symbol;
    return this.prisma.perpPosition.findMany({ where, orderBy: { updateTime: 'desc' } });
  }

  async findBySymbol(symbol: string, status = 'active'): Promise<PerpPosition[]> {
    return this.prisma.perpPosition.findMany({
      where: { symbol, status },
      orderBy: { positionQty: 'desc' },
    });
  }

  async paginate(params: PaginationParams & {
    userId?: string;
    symbol?: string;
    side?: string;
    status?: string;
    marginMode?: string;
  }): Promise<PaginatedResult<PerpPosition>> {
    const { skip, take, page, pageSize } = buildPagination(params);
    const where: Prisma.PerpPositionWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.symbol) where.symbol = params.symbol;
    if (params.side) where.side = params.side;
    if (params.status) where.status = params.status;
    if (params.marginMode) where.marginMode = params.marginMode;

    const [items, total] = await Promise.all([
      this.prisma.perpPosition.findMany({ where, skip, take, orderBy: { updateTime: 'desc' } }),
      this.prisma.perpPosition.count({ where }),
    ]);

    return toPaginatedResult(items, total, page, pageSize);
  }

  async create(data: Prisma.PerpPositionCreateInput): Promise<PerpPosition> {
    return this.prisma.perpPosition.create({ data });
  }

  async update(id: string, data: Prisma.PerpPositionUpdateInput): Promise<PerpPosition> {
    return this.prisma.perpPosition.update({ where: { id }, data });
  }

  async setStatus(id: string, status: string, closeTime?: Date): Promise<PerpPosition> {
    const data: Prisma.PerpPositionUpdateInput = { status };
    if (closeTime) data.closeTime = closeTime;
    return this.update(id, data);
  }

  async updateMarkPrice(id: string, markPrice: Prisma.Decimal, unrealizedPnl: Prisma.Decimal): Promise<PerpPosition> {
    return this.update(id, { markPrice, unrealizedPnl });
  }

  async updateLiquidationPrice(id: string, liquidationPrice: Prisma.Decimal): Promise<PerpPosition> {
    return this.update(id, { liquidationPrice });
  }

  async findAllActiveForLiquidation(symbol: string, batchSize = 100): Promise<PerpPosition[]> {
    return this.prisma.perpPosition.findMany({
      where: { symbol, status: 'active' },
      orderBy: { unrealizedPnl: 'asc' },
      take: batchSize,
    });
  }
}

export const positionRepo = new PositionRepository();
