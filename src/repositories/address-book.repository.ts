import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class AddressBookRepository extends BaseRepository<
  Prisma.WalletAddressBookGetPayload<{}>,
  Prisma.WalletAddressBookCreateInput,
  Prisma.WalletAddressBookUpdateInput,
  Prisma.WalletAddressBookWhereInput
> {
  constructor() {
    super('walletAddressBook');
  }

  async findByUserId(userId: string, pagination: PaginationParams, filters?: {
    chainType?: string;
    chainId?: string;
    assetSymbol?: string;
  }): Promise<PaginatedResult<Prisma.WalletAddressBookGetPayload<{}>>> {
    const where: any = { userId };
    if (filters?.chainType) where.chainType = filters.chainType;
    if (filters?.chainId) where.chainId = filters.chainId;
    if (filters?.assetSymbol) where.assetSymbol = filters.assetSymbol;
    where.isBlacklisted = false;

    return this.paginate(pagination, where, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByUserIdAndAddress(userId: string, address: string): Promise<Prisma.WalletAddressBookGetPayload<{}> | null> {
    return this.model.findFirst({
      where: { userId, address, isBlacklisted: false },
    });
  }
}

export const addressBookRepository = new AddressBookRepository();
export default addressBookRepository;