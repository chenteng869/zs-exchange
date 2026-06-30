import { SpotAccount, Prisma } from '@prisma/client';
import { BaseRepository, PaginationParams, PaginatedResult, buildPagination, toPaginatedResult } from './base-repo';

export class SpotAccountRepository extends BaseRepository {
  async findById(id: string): Promise<SpotAccount | null> {
    return this.prisma.spotAccount.findUnique({ where: { id } });
  }

  async findByUserIdAndAsset(userId: string, asset: string): Promise<SpotAccount | null> {
    return this.prisma.spotAccount.findUnique({
      where: { userId_asset: { userId, asset } },
    });
  }

  async findByUserId(userId: string): Promise<SpotAccount[]> {
    return this.prisma.spotAccount.findMany({
      where: { userId },
    });
  }

  async findByAsset(asset: string): Promise<SpotAccount[]> {
    return this.prisma.spotAccount.findMany({
      where: { asset },
    });
  }

  async paginate(params: PaginationParams & { userId?: string; asset?: string; status?: string }): Promise<PaginatedResult<SpotAccount>> {
    const { skip, take, page, pageSize } = buildPagination(params);
    const where: Prisma.SpotAccountWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.asset) where.asset = params.asset;
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.spotAccount.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.spotAccount.count({ where }),
    ]);

    return toPaginatedResult(items, total, page, pageSize);
  }

  async create(data: Prisma.SpotAccountCreateInput): Promise<SpotAccount> {
    return this.prisma.spotAccount.create({ data });
  }

  async update(id: string, data: Prisma.SpotAccountUpdateInput): Promise<SpotAccount> {
    return this.prisma.spotAccount.update({ where: { id }, data });
  }

  async updateByUserIdAndAsset(userId: string, asset: string, data: Prisma.SpotAccountUpdateInput): Promise<SpotAccount> {
    return this.prisma.spotAccount.update({
      where: { userId_asset: { userId, asset } },
      data,
    });
  }

  async freeze(id: string, amount: Prisma.Decimal): Promise<SpotAccount> {
    return this.prisma.spotAccount.update({
      where: { id },
      data: {
        available: { decrement: amount },
        frozen: { increment: amount },
      },
    });
  }

  async unfreeze(id: string, amount: Prisma.Decimal): Promise<SpotAccount> {
    return this.prisma.spotAccount.update({
      where: { id },
      data: {
        available: { increment: amount },
        frozen: { decrement: amount },
      },
    });
  }

  async consumeFrozen(id: string, amount: Prisma.Decimal): Promise<SpotAccount> {
    return this.prisma.spotAccount.update({
      where: { id },
      data: {
        balance: { decrement: amount },
        frozen: { decrement: amount },
      },
    });
  }

  async addBalance(id: string, amount: Prisma.Decimal): Promise<SpotAccount> {
    return this.prisma.spotAccount.update({
      where: { id },
      data: {
        balance: { increment: amount },
        available: { increment: amount },
      },
    });
  }

  async subtractBalance(id: string, amount: Prisma.Decimal): Promise<SpotAccount> {
    return this.prisma.spotAccount.update({
      where: { id },
      data: {
        balance: { decrement: amount },
        available: { decrement: amount },
      },
    });
  }

  async setStatus(id: string, status: string): Promise<SpotAccount> {
    return this.update(id, { status });
  }

  async ensureAccount(userId: string, asset: string): Promise<SpotAccount> {
    const existing = await this.findByUserIdAndAsset(userId, asset);
    if (existing) return existing;

    return this.create({
      userId,
      asset,
      balance: new Prisma.Decimal(0),
      available: new Prisma.Decimal(0),
      frozen: new Prisma.Decimal(0),
    });
  }
}

export const spotAccountRepo = new SpotAccountRepository();