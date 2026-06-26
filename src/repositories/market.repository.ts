import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class TickerRepository extends BaseRepository<
  Prisma.MarketTickerGetPayload<{}>,
  Prisma.MarketTickerCreateInput,
  Prisma.MarketTickerUpdateInput,
  Prisma.MarketTickerWhereInput
> {
  constructor() {
    super('marketTicker');
  }

  async findBySymbol(symbol: string) {
    return this.model.findFirst({
      where: { symbol },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLatestBySymbol(symbol: string) {
    return this.model.findFirst({
      where: { symbol },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findAllLatest() {
    const symbols = await this.model.findMany({
      distinct: ['symbol'],
      select: { symbol: true },
    });

    const tickers = [];
    for (const { symbol } of symbols) {
      const ticker = await this.findLatestBySymbol(symbol);
      if (ticker) tickers.push(ticker);
    }
    return tickers;
  }

  async findBySymbols(symbols: string[]) {
    const results = [];
    for (const symbol of symbols) {
      const ticker = await this.findLatestBySymbol(symbol);
      if (ticker) results.push(ticker);
    }
    return results;
  }

  async get24hVolume(symbol: string) {
    const now = new Date();
    const _24hAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return this.model.findMany({
      where: {
        symbol,
        timestamp: { gte: _24hAgo, lte: now },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async deleteOld(days: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return this.model.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
  }
}

export class KlineRepository extends BaseRepository<
  Prisma.MarketKlineGetPayload<{}>,
  Prisma.MarketKlineCreateInput,
  Prisma.MarketKlineUpdateInput,
  Prisma.MarketKlineWhereInput
> {
  constructor() {
    super('marketKline');
  }

  async getKlines(symbol: string, interval: string, startTime?: Date, endTime?: Date, limit: number = 500) {
    const where: any = { symbol, interval };
    if (startTime) where.openTime = { ...where.openTime || {}, gte: startTime };
    if (endTime) where.openTime = { ...where.openTime || {}, lte: endTime };

    return this.model.findMany({
      where,
      orderBy: { openTime: 'asc' },
      take: limit,
    });
  }

  async getLatestKline(symbol: string, interval: string) {
    return this.model.findFirst({
      where: { symbol, interval },
      orderBy: { openTime: 'desc' },
    });
  }

  async deleteOld(symbol: string, interval: string, beforeDate: Date) {
    return this.model.deleteMany({
      where: {
        symbol,
        interval,
        openTime: { lt: beforeDate },
      },
    });
  }

  async bulkInsert(klines: Prisma.MarketKlineCreateInput[]) {
    return this.model.createMany({ data: klines });
  }
}

export class DepthRepository extends BaseRepository<
  Prisma.MarketDepthGetPayload<{}>,
  Prisma.MarketDepthCreateInput,
  Prisma.MarketDepthUpdateInput,
  Prisma.MarketDepthWhereInput
> {
  constructor() {
    super('marketDepth');
  }

  async findLatestBySymbol(symbol: string) {
    return this.model.findFirst({
      where: { symbol },
      orderBy: { timestamp: 'desc' },
    });
  }

  async deleteOld(days: number = 1) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return this.model.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
  }
}

export const tickerRepository = new TickerRepository();
export const klineRepository = new KlineRepository();
export const depthRepository = new DepthRepository();
export default tickerRepository;