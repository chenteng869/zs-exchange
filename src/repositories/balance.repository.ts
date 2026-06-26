import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class BalanceRepository extends BaseRepository<
  Prisma.TradeBalanceGetPayload<{}>,
  Prisma.TradeBalanceCreateInput,
  Prisma.TradeBalanceUpdateInput,
  Prisma.TradeBalanceWhereInput
> {
  constructor() {
    super('tradeBalance');
  }

  async findByUserIdAndCurrency(userId: string, currency: string) {
    return this.model.findFirst({
      where: { userId, currency },
    });
  }

  async findByUserId(userId: string) {
    return this.model.findMany({
      where: { userId },
      orderBy: { currency: 'asc' },
    });
  }

  async getAvailableBalance(userId: string, currency: string) {
    const balance = await this.findByUserIdAndCurrency(userId, currency);
    return balance ? balance.available : 0;
  }

  async lockBalance(userId: string, currency: string, amount: number) {
    const balance = await this.findByUserIdAndCurrency(userId, currency);
    if (!balance) {
      throw new Error(`Balance not found for user ${userId} and currency ${currency}`);
    }
    if (parseFloat(balance.available as any) < amount) {
      throw new Error('Insufficient balance');
    }
    return this.model.update({
      where: { id: balance.id },
      data: {
        available: { decrement: amount },
        frozen: { increment: amount },
      },
    });
  }

  async unlockBalance(userId: string, currency: string, amount: number) {
    const balance = await this.findByUserIdAndCurrency(userId, currency);
    if (!balance) {
      throw new Error(`Balance not found for user ${userId} and currency ${currency}`);
    }
    return this.model.update({
      where: { id: balance.id },
      data: {
        available: { increment: amount },
        frozen: { decrement: amount },
      },
    });
  }

  async addBalance(userId: string, currency: string, amount: number) {
    let balance = await this.findByUserIdAndCurrency(userId, currency);
    if (!balance) {
      balance = await this.model.create({
        data: {
          userId,
          currency,
          balance: amount,
          available: amount,
          frozen: 0,
          locked: 0,
        },
      });
    } else {
      balance = await this.model.update({
        where: { id: balance.id },
        data: {
          balance: { increment: amount },
          available: { increment: amount },
        },
      });
    }
    return balance;
  }

  async subtractBalance(userId: string, currency: string, amount: number) {
    const balance = await this.findByUserIdAndCurrency(userId, currency);
    if (!balance || parseFloat(balance.available as any) < amount) {
      throw new Error('Insufficient balance');
    }
    return this.model.update({
      where: { id: balance.id },
      data: {
        balance: { decrement: amount },
        available: { decrement: amount },
      },
    });
  }

  async moveFromFrozenToBalance(userId: string, currency: string, amount: number) {
    const balance = await this.findByUserIdAndCurrency(userId, currency);
    if (!balance || parseFloat(balance.frozen as any) < amount) {
      throw new Error('Insufficient frozen balance');
    }
    return this.model.update({
      where: { id: balance.id },
      data: {
        frozen: { decrement: amount },
        balance: { decrement: amount },
      },
    });
  }
}

export const balanceRepository = new BalanceRepository();
export default balanceRepository;