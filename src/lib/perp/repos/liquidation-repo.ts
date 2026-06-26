import { PerpLiquidation, Prisma } from '@prisma/client';
import { BaseRepository, PaginationParams, PaginatedResult, buildPagination, toPaginatedResult } from './base-repo';

export class LiquidationRepository extends BaseRepository {
  async findById(id: string): Promise<PerpLiquidation | null> {
    return this.prisma.perpLiquidation.findUnique({ where: { id } });
  }

  async findByLiquidationNo(liquidationNo: string): Promise<PerpLiquidation | null> {
    return this.prisma.perpLiquidation.findUnique({ where: { liquidationNo } });
  }

  async findByPositionId(positionId: string): Promise<PerpLiquidation[]> {
    return this.prisma.perpLiquidation.findMany({
      where: { positionId },
      orderBy: { liquidationTime: 'desc' },
    });
  }

  async findByUserId(userId: string, symbol?: string, limit = 100): Promise<PerpLiquidation[]> {
    const where: Prisma.PerpLiquidationWhereInput = { userId };
    if (symbol) where.symbol = symbol;
    return this.prisma.perpLiquidation.findMany({ where, orderBy: { liquidationTime: 'desc' }, take: limit });
  }

  async paginate(params: PaginationParams & {
    userId?: string;
    symbol?: string;
    status?: string;
    adlTriggered?: boolean;
    startTime?: Date;
    endTime?: Date;
  }): Promise<PaginatedResult<PerpLiquidation>> {
    const { skip, take, page, pageSize } = buildPagination(params);
    const where: Prisma.PerpLiquidationWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.symbol) where.symbol = params.symbol;
    if (params.status) where.status = params.status;
    if (params.adlTriggered !== undefined) where.adlTriggered = params.adlTriggered;
    if (params.startTime || params.endTime) {
      where.liquidationTime = {};
      if (params.startTime) where.liquidationTime.gte = params.startTime;
      if (params.endTime) where.liquidationTime.lte = params.endTime;
    }

    const [items, total] = await Promise.all([
      this.prisma.perpLiquidation.findMany({ where, skip, take, orderBy: { liquidationTime: 'desc' } }),
      this.prisma.perpLiquidation.count({ where }),
    ]);

    return toPaginatedResult(items, total, page, pageSize);
  }

  async create(data: Prisma.PerpLiquidationCreateInput): Promise<PerpLiquidation> {
    return this.prisma.perpLiquidation.create({ data });
  }

  async update(id: string, data: Prisma.PerpLiquidationUpdateInput): Promise<PerpLiquidation> {
    return this.prisma.perpLiquidation.update({ where: { id }, data });
  }

  async setStatus(id: string, status: string): Promise<PerpLiquidation> {
    return this.update(id, { status });
  }

  async countBySymbol(symbol: string, status?: string): Promise<number> {
    const where: Prisma.PerpLiquidationWhereInput = { symbol };
    if (status) where.status = status;
    return this.prisma.perpLiquidation.count({ where });
  }
}

export const liquidationRepo = new LiquidationRepository();
