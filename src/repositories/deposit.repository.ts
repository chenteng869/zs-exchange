import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class DepositRepository extends BaseRepository<
  Prisma.WalletDepositGetPayload<{}>,
  Prisma.WalletDepositCreateInput,
  Prisma.WalletDepositUpdateInput,
  Prisma.WalletDepositWhereInput
> {
  constructor() {
    super('walletDeposit');
  }

  async findByTxHash(txHash: string) {
    return this.model.findUnique({ where: { txHash } });
  }

  async findByUserId(userId: string, pagination: PaginationParams, filters?: {
    currency?: string;
    status?: string;
  }): Promise<PaginatedResult<Prisma.WalletDepositGetPayload<{}>>> {
    const where: any = { userId };
    if (filters?.currency) where.currencyId = filters.currency;
    if (filters?.status) where.status = filters.status;

    return this.paginate(pagination, where, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findPendingDeposits(currencyId?: string) {
    const where: any = { status: 'pending' };
    if (currencyId) where.currencyId = currencyId;

    return this.model.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByAddressId(addressId: string) {
    return this.model.findMany({
      where: { addressId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateConfirmations(id: string, confirmations: number) {
    return this.update(id, { confirmations } as any);
  }

  async updateStatus(id: string, status: string, confirmedAt?: Date) {
    return this.update(id, { status, confirmedAt: confirmedAt || new Date() } as any);
  }

  async getDepositVolume(userId: string, currencyId: string, startTime: Date, endTime: Date) {
    const result = await this.model.aggregate({
      where: {
        userId,
        currencyId,
        status: { in: ['confirmed', 'credited'] },
        createdAt: { gte: startTime, lte: endTime },
      },
      _sum: { amount: true, fee: true },
      _count: true,
    });
    return {
      totalAmount: result._sum.amount || 0,
      totalFee: result._sum.fee || 0,
      count: result._count,
    };
  }
}

export const depositRepository = new DepositRepository();
export default depositRepository;
