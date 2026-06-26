import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class WalletAddressRepository extends BaseRepository<
  Prisma.WalletAddressGetPayload<{}>,
  Prisma.WalletAddressCreateInput,
  Prisma.WalletAddressUpdateInput,
  Prisma.WalletAddressWhereInput
> {
  constructor() {
    super('walletAddress');
  }

  async findByAddress(address: string) {
    return this.model.findUnique({ where: { address } });
  }

  async findByUserId(userId: string, currencyId?: string) {
    const where: any = { userId };
    if (currencyId) where.currencyId = currencyId;

    return this.model.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserIdAndCurrency(userId: string, currencyId: string) {
    return this.model.findFirst({
      where: { userId, currencyId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveByCurrency(currencyId: string) {
    return this.model.findMany({
      where: { currencyId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivateAddress(id: string) {
    return this.update(id, { status: 'inactive' } as any);
  }
}

export class WalletHotColdRepository extends BaseRepository<
  Prisma.WalletHotColdGetPayload<{}>,
  Prisma.WalletHotColdCreateInput,
  Prisma.WalletHotColdUpdateInput,
  Prisma.WalletHotColdWhereInput
> {
  constructor() {
    super('walletHotCold');
  }

  async findByType(type: string) {
    return this.model.findMany({
      where: { type, status: 'active' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByCurrency(currencyId: string) {
    return this.model.findMany({
      where: { currencyId, status: 'active' },
      orderBy: { type: 'asc' },
    });
  }

  async findHotWallet(currencyId: string) {
    return this.model.findFirst({
      where: { currencyId, type: 'hot', status: 'active' },
    });
  }

  async findColdWallet(currencyId: string) {
    return this.model.findFirst({
      where: { currencyId, type: 'cold', status: 'active' },
    });
  }

  async updateBalance(id: string, balance: number) {
    return this.update(id, { balance } as any);
  }
}

export const walletAddressRepository = new WalletAddressRepository();
export const walletHotColdRepository = new WalletHotColdRepository();
export default walletAddressRepository;