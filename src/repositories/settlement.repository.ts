import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class SettlementBatchRepository extends BaseRepository<
  Prisma.SettlementBatchGetPayload<{}>,
  Prisma.SettlementBatchCreateInput,
  Prisma.SettlementBatchUpdateInput,
  Prisma.SettlementBatchWhereInput
> {
  constructor() {
    super('settlementBatch');
  }

  async findByType(type: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.SettlementBatchGetPayload<{}>>> {
    return this.paginate(pagination, { type } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByStatus(status: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.SettlementBatchGetPayload<{}>>> {
    return this.paginate(pagination, { status } as any, {
      orderBy: { startTime: 'asc' as const },
    });
  }

  async findPending() {
    return this.model.findMany({
      where: { status: 'pending' },
      orderBy: { startTime: 'asc' },
    });
  }

  async completeBatch(id: string) {
    return this.update(id, { status: 'completed', completedAt: new Date() } as any);
  }

  async getSummary(startTime: Date, endTime: Date) {
    const result = await this.model.aggregate({
      where: {
        createdAt: { gte: startTime, lte: endTime },
        status: 'completed',
      },
      _sum: { totalAmount: true, recordsCount: true },
      _count: true,
    });
    return {
      totalBatches: result._count,
      totalAmount: result._sum.totalAmount || 0,
      totalRecords: result._sum.recordsCount || 0,
    };
  }
}

export class SettlementRecordRepository extends BaseRepository<
  Prisma.SettlementRecordGetPayload<{}>,
  Prisma.SettlementRecordCreateInput,
  Prisma.SettlementRecordUpdateInput,
  Prisma.SettlementRecordWhereInput
> {
  constructor() {
    super('settlementRecord');
  }

  async findByBatchId(batchId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.SettlementRecordGetPayload<{}>>> {
    return this.paginate(pagination, { batchId } as any, {
      orderBy: { createdAt: 'asc' as const },
    });
  }

  async findByUserId(userId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.SettlementRecordGetPayload<{}>>> {
    return this.paginate(pagination, { userId } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByUserAndType(userId: string, type: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.SettlementRecordGetPayload<{}>>> {
    return this.paginate(pagination, { userId, type } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async getBalance(userId: string, currency: string) {
    const result = await this.model.aggregate({
      where: { userId, currency },
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  }
}

export class SettlementClearingRepository extends BaseRepository<
  Prisma.SettlementClearingGetPayload<{}>,
  Prisma.SettlementClearingCreateInput,
  Prisma.SettlementClearingUpdateInput,
  Prisma.SettlementClearingWhereInput
> {
  constructor() {
    super('settlementClearing');
  }

  async findByTradeId(tradeId: string) {
    return this.model.findFirst({ where: { tradeId } });
  }

  async findByStatus(status: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.SettlementClearingGetPayload<{}>>> {
    return this.paginate(pagination, { status } as any, {
      orderBy: { createdAt: 'asc' as const },
    });
  }

  async findPending() {
    return this.model.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async complete(id: string) {
    return this.update(id, { status: 'completed', completedAt: new Date() } as any);
  }
}

export class TradePositionRepository extends BaseRepository<
  Prisma.TradePositionGetPayload<{}>,
  Prisma.TradePositionCreateInput,
  Prisma.TradePositionUpdateInput,
  Prisma.TradePositionWhereInput
> {
  constructor() {
    super('tradePosition');
  }

  async findByUserId(userId: string, symbol?: string) {
    const where: any = { userId, status: 'open' };
    if (symbol) where.symbol = symbol;

    return this.model.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySymbol(symbol: string) {
    return this.model.findMany({
      where: { symbol, status: 'open' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserAndSymbol(userId: string, symbol: string, positionSide: string) {
    return this.model.findFirst({
      where: { userId, symbol, positionSide, status: 'open' },
    });
  }

  async updatePosition(id: string, data: Partial<Prisma.TradePositionUpdateInput>) {
    return this.update(id, data as any);
  }

  async closePosition(id: string) {
    return this.update(id, { status: 'closed', closedAt: new Date() } as any);
  }
}

export class TradeFeeRecordRepository extends BaseRepository<
  Prisma.TradeFeeRecordGetPayload<{}>,
  Prisma.TradeFeeRecordCreateInput,
  Prisma.TradeFeeRecordUpdateInput,
  Prisma.TradeFeeRecordWhereInput
> {
  constructor() {
    super('tradeFeeRecord');
  }

  async findByUserId(userId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.TradeFeeRecordGetPayload<{}>>> {
    return this.paginate(pagination, { userId } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByTradeId(tradeId: string) {
    return this.model.findFirst({ where: { tradeId } });
  }

  async findByType(type: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.TradeFeeRecordGetPayload<{}>>> {
    return this.paginate(pagination, { type } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async getTotalFees(userId: string, startTime: Date, endTime: Date) {
    const result = await this.model.aggregate({
      where: {
        userId,
        createdAt: { gte: startTime, lte: endTime },
      },
      _sum: { amount: true },
      _count: true,
    });
    return {
      totalFees: result._sum.amount || 0,
      feeCount: result._count,
    };
  }
}

export const settlementBatchRepository = new SettlementBatchRepository();
export const settlementRecordRepository = new SettlementRecordRepository();
export const settlementClearingRepository = new SettlementClearingRepository();
export const tradePositionRepository = new TradePositionRepository();
export const tradeFeeRecordRepository = new TradeFeeRecordRepository();
export default settlementBatchRepository;