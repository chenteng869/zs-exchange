import { SpotMarket, Prisma, SpotMarketStatus } from '@prisma/client';
import { BaseRepository, PaginationParams, PaginatedResult, buildPagination, toPaginatedResult } from './base-repo';

export class SpotMarketRepository extends BaseRepository {
  async findById(id: bigint): Promise<SpotMarket | null> {
    return this.prisma.spotMarket.findUnique({ where: { id } });
  }

  async findByMarketSymbol(marketSymbol: string): Promise<SpotMarket | null> {
    return this.prisma.spotMarket.findUnique({ where: { marketSymbol } });
  }

  async findByBaseAndQuote(baseAsset: string, quoteAsset: string): Promise<SpotMarket | null> {
    return this.prisma.spotMarket.findFirst({
      where: { baseAsset, quoteAsset },
    });
  }

  async findAllActive(): Promise<SpotMarket[]> {
    return this.prisma.spotMarket.findMany({
      where: { status: SpotMarketStatus.trading },
      orderBy: { marketSymbol: 'asc' },
    });
  }

  async findAll(): Promise<SpotMarket[]> {
    return this.prisma.spotMarket.findMany({
      orderBy: { marketSymbol: 'asc' },
    });
  }

  async paginate(params: PaginationParams & { status?: SpotMarketStatus; marketSymbol?: string }): Promise<PaginatedResult<SpotMarket>> {
    const { skip, take, page, pageSize } = buildPagination(params);
    const where: Prisma.SpotMarketWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.marketSymbol) where.marketSymbol = { contains: params.marketSymbol };

    const [items, total] = await Promise.all([
      this.prisma.spotMarket.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.spotMarket.count({ where }),
    ]);

    return toPaginatedResult(items, total, page, pageSize);
  }

  async create(data: Prisma.SpotMarketCreateInput): Promise<SpotMarket> {
    return this.prisma.spotMarket.create({ data });
  }

  async update(id: bigint, data: Prisma.SpotMarketUpdateInput): Promise<SpotMarket> {
    return this.prisma.spotMarket.update({ where: { id }, data });
  }

  async updateByMarketSymbol(marketSymbol: string, data: Prisma.SpotMarketUpdateInput): Promise<SpotMarket> {
    return this.prisma.spotMarket.update({ where: { marketSymbol }, data });
  }

  async setStatus(id: bigint, status: SpotMarketStatus): Promise<SpotMarket> {
    return this.update(id, { status });
  }

  async delete(id: bigint): Promise<SpotMarket> {
    return this.prisma.spotMarket.delete({ where: { id } });
  }
}

export const spotMarketRepo = new SpotMarketRepository();