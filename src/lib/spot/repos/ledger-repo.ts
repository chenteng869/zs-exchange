import { SpotAccountLedger, Prisma, SpotAccountLedgerType } from '@prisma/client';
import { BaseRepository, PaginationParams, PaginatedResult, buildPagination, toPaginatedResult } from './base-repo';

export class SpotAccountLedgerRepository extends BaseRepository {
  async findById(id: string): Promise<SpotAccountLedger | null> {
    return this.prisma.spotAccountLedger.findUnique({ where: { id } });
  }

  async findByLedgerNo(ledgerNo: string): Promise<SpotAccountLedger | null> {
    return this.prisma.spotAccountLedger.findUnique({ where: { ledgerNo } });
  }

  async findByUserId(userId: string): Promise<SpotAccountLedger[]> {
    return this.prisma.spotAccountLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByAccountId(accountId: string): Promise<SpotAccountLedger[]> {
    return this.prisma.spotAccountLedger.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByReference(referenceId: string, referenceType: string): Promise<SpotAccountLedger[]> {
    return this.prisma.spotAccountLedger.findMany({
      where: { referenceId, referenceType },
    });
  }

  async paginate(params: PaginationParams & { userId?: string; accountId?: string; type?: SpotAccountLedgerType; asset?: string }): Promise<PaginatedResult<SpotAccountLedger>> {
    const { skip, take, page, pageSize } = buildPagination(params);
    const where: Prisma.SpotAccountLedgerWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.accountId) where.accountId = params.accountId;
    if (params.type) where.type = params.type;
    if (params.asset) where.asset = params.asset;

    const [items, total] = await Promise.all([
      this.prisma.spotAccountLedger.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.spotAccountLedger.count({ where }),
    ]);

    return toPaginatedResult(items, total, page, pageSize);
  }

  async create(data: Prisma.SpotAccountLedgerCreateInput): Promise<SpotAccountLedger> {
    return this.prisma.spotAccountLedger.create({ data });
  }

  async createBatch(data: Prisma.SpotAccountLedgerCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return this.prisma.spotAccountLedger.createMany({ data, skipDuplicates: true });
  }
}

export const spotAccountLedgerRepo = new SpotAccountLedgerRepository();