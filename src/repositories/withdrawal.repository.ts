import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class WithdrawalRepository extends BaseRepository<
  Prisma.WalletWithdrawalGetPayload<{}>,
  Prisma.WalletWithdrawalCreateInput,
  Prisma.WalletWithdrawalUpdateInput,
  Prisma.WalletWithdrawalWhereInput
> {
  constructor() {
    super('walletWithdrawal');
  }

  async findByUserId(userId: string, pagination: PaginationParams, filters?: {
    currency?: string;
    status?: string;
  }): Promise<PaginatedResult<Prisma.WalletWithdrawalGetPayload<{}>>> {
    const where: any = { userId };
    if (filters?.currency) where.currencyId = filters.currency;
    if (filters?.status) where.status = filters.status;

    return this.paginate(pagination, where, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findPendingWithdrawals(currencyId?: string) {
    const where: any = { status: 'pending' };
    if (currencyId) where.currencyId = currencyId;

    return this.model.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByStatus(status: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.WalletWithdrawalGetPayload<{}>>> {
    return this.paginate(pagination, { status } as any, {
      orderBy: { createdAt: 'asc' as const },
    });
  }

  async updateStatus(id: string, status: string, txHash?: string) {
    const data: any = { status };
    if (txHash) data.txHash = txHash;
    if (status === 'completed') data.confirmedAt = new Date();
    return this.update(id, data);
  }

  async setTxHash(id: string, txHash: string) {
    return this.update(id, { txHash } as any);
  }

  async getWithdrawalVolume(userId: string, currencyId: string, startTime: Date, endTime: Date) {
    const result = await this.model.aggregate({
      where: {
        userId,
        currencyId,
        status: 'completed',
        createdAt: { gte: startTime, lte: endTime },
      },
      _sum: { amount: true, fee: true, totalAmount: true },
      _count: true,
    });
    return {
      totalAmount: result._sum.amount || 0,
      totalFee: result._sum.fee || 0,
      totalWithdrawn: result._sum.totalAmount || 0,
      count: result._count,
    };
  }

  async getDailyWithdrawalTotal(userId: string, currencyId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.model.aggregate({
      where: {
        userId,
        currencyId,
        status: { in: ['pending', 'processing', 'completed'] },
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      _sum: { totalAmount: true },
    });
    return parseFloat(result._sum.totalAmount as any) || 0;
  }
}

export const withdrawalRepository = new WithdrawalRepository();
export default withdrawalRepository;