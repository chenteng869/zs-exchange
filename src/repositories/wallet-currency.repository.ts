import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class WalletCurrencyRepository extends BaseRepository<
  Prisma.WalletCurrencyGetPayload<{}>,
  Prisma.WalletCurrencyCreateInput,
  Prisma.WalletCurrencyUpdateInput,
  Prisma.WalletCurrencyWhereInput
> {
  constructor() {
    super('walletCurrency');
  }

  async findBySymbol(symbol: string) {
    return this.model.findUnique({ where: { symbol } });
  }

  async findActiveCurrencies(): Promise<Prisma.WalletCurrencyGetPayload<{}>[]> {
    return this.model.findMany({
      where: { isActive: true },
      orderBy: { symbol: 'asc' },
    });
  }

  async findDepositEnabled(): Promise<Prisma.WalletCurrencyGetPayload<{}>[]> {
    return this.model.findMany({
      where: { isActive: true, depositEnabled: true },
      orderBy: { symbol: 'asc' },
    });
  }

  async findWithdrawalEnabled(): Promise<Prisma.WalletCurrencyGetPayload<{}>[]> {
    return this.model.findMany({
      where: { isActive: true, withdrawalEnabled: true },
      orderBy: { symbol: 'asc' },
    });
  }

  async findByBlockchain(blockchain: string) {
    return this.model.findMany({
      where: { blockchain, isActive: true },
      orderBy: { symbol: 'asc' },
    });
  }

  async searchCurrencies(
    keyword: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Prisma.WalletCurrencyGetPayload<{}>>> {
    const where = {
      OR: [
        { symbol: { contains: keyword, mode: 'insensitive' as const } },
        { name: { contains: keyword, mode: 'insensitive' as const } },
      ],
    };
    return this.paginate(pagination, where as any, {
      orderBy: { symbol: 'asc' as const },
    });
  }

  async updateStatus(symbol: string, isActive: boolean) {
    return this.model.update({
      where: { symbol },
      data: { isActive },
    });
  }

  async updateDepositEnabled(symbol: string, depositEnabled: boolean) {
    return this.model.update({
      where: { symbol },
      data: { depositEnabled },
    });
  }

  async updateWithdrawalEnabled(symbol: string, withdrawalEnabled: boolean) {
    return this.model.update({
      where: { symbol },
      data: { withdrawalEnabled },
    });
  }
}

export const walletCurrencyRepository = new WalletCurrencyRepository();
export default walletCurrencyRepository;