import { PerpAccount, Prisma } from '@prisma/client';
import { BaseRepository, PaginationParams, PaginatedResult, buildPagination, toPaginatedResult } from './base-repo';

export class AccountRepository extends BaseRepository {
  async findById(id: string): Promise<PerpAccount | null> {
    return this.prisma.perpAccount.findUnique({ where: { id } });
  }

  async findByUserAssetType(userId: string, asset: string, accountType: string): Promise<PerpAccount | null> {
    return this.prisma.perpAccount.findUnique({
      where: { userId_asset_accountType: { userId, asset, accountType } },
    });
  }

  async findByUserId(userId: string): Promise<PerpAccount[]> {
    return this.prisma.perpAccount.findMany({ where: { userId } });
  }

  async paginate(params: PaginationParams & { userId?: string; asset?: string; status?: string }): Promise<PaginatedResult<PerpAccount>> {
    const { skip, take, page, pageSize } = buildPagination(params);
    const where: Prisma.PerpAccountWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.asset) where.asset = params.asset;
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.perpAccount.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.perpAccount.count({ where }),
    ]);

    return toPaginatedResult(items, total, page, pageSize);
  }

  async create(data: Prisma.PerpAccountCreateInput): Promise<PerpAccount> {
    return this.prisma.perpAccount.create({ data });
  }

  async getOrCreate(userId: string, asset: string, accountType: string): Promise<PerpAccount> {
    const existing = await this.findByUserAssetType(userId, asset, accountType);
    if (existing) return existing;

    try {
      return await this.create({
        userId,
        asset,
        accountType,
      });
    } catch {
      const account = await this.findByUserAssetType(userId, asset, accountType);
      if (account) return account;
      throw new Error('Failed to create perp account');
    }
  }

  async update(id: string, data: Prisma.PerpAccountUpdateInput): Promise<PerpAccount> {
    return this.prisma.perpAccount.update({ where: { id }, data });
  }

  async setStatus(id: string, status: string): Promise<PerpAccount> {
    return this.update(id, { status });
  }

  async adjustBalance(
    id: string,
    amount: Prisma.Decimal,
    tx?: Prisma.TransactionClient
  ): Promise<PerpAccount> {
    const client = tx || this.prisma;
    return client.perpAccount.update({
      where: { id },
      data: {
        balance: { increment: amount },
        availableBalance: { increment: amount },
      },
    });
  }

  async freezeBalance(
    id: string,
    amount: Prisma.Decimal,
    tx?: Prisma.TransactionClient
  ): Promise<PerpAccount> {
    const client = tx || this.prisma;
    return client.perpAccount.update({
      where: { id },
      data: {
        availableBalance: { decrement: amount },
        frozenBalance: { increment: amount },
      },
    });
  }

  async unfreezeBalance(
    id: string,
    amount: Prisma.Decimal,
    tx?: Prisma.TransactionClient
  ): Promise<PerpAccount> {
    const client = tx || this.prisma;
    return client.perpAccount.update({
      where: { id },
      data: {
        frozenBalance: { decrement: amount },
        availableBalance: { increment: amount },
      },
    });
  }
}

export const accountRepo = new AccountRepository();
