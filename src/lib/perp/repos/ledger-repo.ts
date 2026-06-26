import { PerpLedger, Prisma } from '@prisma/client';
import { BaseRepository, PaginationParams, PaginatedResult, buildPagination, toPaginatedResult } from './base-repo';

export type LedgerType =
  | 'deposit'
  | 'withdraw'
  | 'transfer_in'
  | 'transfer_out'
  | 'open_position'
  | 'close_position'
  | 'realized_pnl'
  | 'funding_fee'
  | 'trading_fee'
  | 'liquidation_penalty'
  | 'insurance_contribution'
  | 'insurance_usage'
  | 'margin_adjust'
  | 'bonus'
  | 'commission'
  | 'rebate'
  | 'other';

export class LedgerRepository extends BaseRepository {
  async findById(id: string): Promise<PerpLedger | null> {
    return this.prisma.perpLedger.findUnique({ where: { id } });
  }

  async findByLedgerNo(ledgerNo: string): Promise<PerpLedger | null> {
    return this.prisma.perpLedger.findUnique({ where: { ledgerNo } });
  }

  async findByAccountId(accountId: string, limit = 100): Promise<PerpLedger[]> {
    return this.prisma.perpLedger.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByUserId(userId: string, type?: string, limit = 100): Promise<PerpLedger[]> {
    const where: Prisma.PerpLedgerWhereInput = { userId };
    if (type) where.type = type;
    return this.prisma.perpLedger.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit });
  }

  async paginate(params: PaginationParams & {
    userId?: string;
    accountId?: string;
    asset?: string;
    type?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<PaginatedResult<PerpLedger>> {
    const { skip, take, page, pageSize } = buildPagination(params);
    const where: Prisma.PerpLedgerWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.accountId) where.accountId = params.accountId;
    if (params.asset) where.asset = params.asset;
    if (params.type) where.type = params.type;
    if (params.startTime || params.endTime) {
      where.createdAt = {};
      if (params.startTime) where.createdAt.gte = params.startTime;
      if (params.endTime) where.createdAt.lte = params.endTime;
    }

    const [items, total] = await Promise.all([
      this.prisma.perpLedger.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.perpLedger.count({ where }),
    ]);

    return toPaginatedResult(items, total, page, pageSize);
  }

  async create(data: Prisma.PerpLedgerCreateInput): Promise<PerpLedger> {
    return this.prisma.perpLedger.create({ data });
  }

  async createMany(data: Prisma.PerpLedgerCreateManyInput[]): Promise<number> {
    const result = await this.prisma.perpLedger.createMany({ data });
    return result.count;
  }

  async recordLedger(
    accountId: string,
    userId: string,
    asset: string,
    changeAmount: Prisma.Decimal,
    balanceAfter: Prisma.Decimal,
    type: string,
    direction: 'in' | 'out',
    referenceId?: string,
    referenceType?: string,
    description?: string,
    tx?: Prisma.TransactionClient
  ): Promise<PerpLedger> {
    const client = tx || this.prisma;
    return client.perpLedger.create({
      data: {
        ledgerNo: `PLG${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        accountId,
        userId,
        asset,
        changeAmount,
        balanceAfter,
        type,
        direction,
        referenceId,
        referenceType,
        description,
      },
    });
  }
}

export const ledgerRepo = new LedgerRepository();
