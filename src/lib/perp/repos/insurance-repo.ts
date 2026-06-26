import { PerpInsuranceFund, Prisma } from '@prisma/client';
import { BaseRepository } from './base-repo';

export class InsuranceRepository extends BaseRepository {
  async findBySymbol(symbol: string): Promise<PerpInsuranceFund | null> {
    return this.prisma.perpInsuranceFund.findUnique({ where: { symbol } });
  }

  async findAll(): Promise<PerpInsuranceFund[]> {
    return this.prisma.perpInsuranceFund.findMany({ orderBy: { symbol: 'asc' } });
  }

  async create(data: Prisma.PerpInsuranceFundCreateInput): Promise<PerpInsuranceFund> {
    return this.prisma.perpInsuranceFund.create({ data });
  }

  async getOrCreate(symbol: string, asset: string, initialBalance: string = '0'): Promise<PerpInsuranceFund> {
    const existing = await this.findBySymbol(symbol);
    if (existing) return existing;

    try {
      return await this.create({
        symbol,
        asset,
        balance: initialBalance,
        totalContributed: '0',
        totalUsed: '0',
      });
    } catch {
      const fund = await this.findBySymbol(symbol);
      if (fund) return fund;
      throw new Error('Failed to create insurance fund');
    }
  }

  async contribute(symbol: string, amount: Prisma.Decimal, tx?: Prisma.TransactionClient): Promise<PerpInsuranceFund> {
    const client = tx || this.prisma;
    return client.perpInsuranceFund.update({
      where: { symbol },
      data: {
        balance: { increment: amount },
        totalContributed: { increment: amount },
      },
    });
  }

  async useFund(symbol: string, amount: Prisma.Decimal, tx?: Prisma.TransactionClient): Promise<PerpInsuranceFund> {
    const client = tx || this.prisma;
    return client.perpInsuranceFund.update({
      where: { symbol },
      data: {
        balance: { decrement: amount },
        totalUsed: { increment: amount },
      },
    });
  }

  async getBalance(symbol: string): Promise<Prisma.Decimal | null> {
    const fund = await this.findBySymbol(symbol);
    return fund?.balance || null;
  }
}

export const insuranceRepo = new InsuranceRepository();
