import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class TradePairRepository extends BaseRepository<
  Prisma.TradePairGetPayload<{}>,
  Prisma.TradePairCreateInput,
  Prisma.TradePairUpdateInput,
  Prisma.TradePairWhereInput
> {
  constructor() {
    super('tradePair');
  }

  async findBySymbol(symbol: string) {
    return this.model.findUnique({ where: { symbol } });
  }

  async findActivePairs(): Promise<Prisma.TradePairGetPayload<{}>[]> {
    return this.model.findMany({
      where: { status: 'active' },
      orderBy: { symbol: 'asc' },
    });
  }

  async findByBaseCurrency(baseCurrency: string) {
    return this.model.findMany({
      where: { baseCurrency, status: 'active' },
      orderBy: { symbol: 'asc' },
    });
  }

  async findByQuoteCurrency(quoteCurrency: string) {
    return this.model.findMany({
      where: { quoteCurrency, status: 'active' },
      orderBy: { symbol: 'asc' },
    });
  }

  async searchPairs(
    keyword: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Prisma.TradePairGetPayload<{}>>> {
    const where = {
      OR: [
        { symbol: { contains: keyword, mode: 'insensitive' as const } },
        { baseCurrency: { contains: keyword, mode: 'insensitive' as const } },
        { quoteCurrency: { contains: keyword, mode: 'insensitive' as const } },
      ],
    };
    return this.paginate(pagination, where as any, {
      orderBy: { symbol: 'asc' as const },
    });
  }

  async updateStatus(symbol: string, status: string) {
    return this.model.update({
      where: { symbol },
      data: { status },
    });
  }

  async updateFeeRate(symbol: string, makerFeeRate: number, takerFeeRate: number) {
    return this.model.update({
      where: { symbol },
      data: { makerFeeRate, takerFeeRate },
    });
  }
}

export const tradePairRepository = new TradePairRepository();
export default tradePairRepository;