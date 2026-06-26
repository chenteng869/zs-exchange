import { PerpInsuranceFund, Prisma } from '@prisma/client';
import { insuranceRepo } from '../repos';

export class InsuranceService {
  private repo: typeof insuranceRepo;

  constructor(customRepo?: typeof insuranceRepo) {
    this.repo = customRepo || insuranceRepo;
  }

  async getBySymbol(symbol: string): Promise<PerpInsuranceFund | null> {
    return this.repo.findBySymbol(symbol);
  }

  async getAll(): Promise<PerpInsuranceFund[]> {
    return this.repo.findAll();
  }

  async getOrCreate(symbol: string, asset: string, initialBalance = '0'): Promise<PerpInsuranceFund> {
    return this.repo.getOrCreate(symbol, asset, initialBalance);
  }

  async contribute(symbol: string, amount: Prisma.Decimal): Promise<PerpInsuranceFund> {
    return this.repo.contribute(symbol, amount);
  }

  async useFund(symbol: string, amount: Prisma.Decimal): Promise<PerpInsuranceFund> {
    const fund = await this.repo.findBySymbol(symbol);
    if (!fund) throw new Error('Insurance fund not found');
    if (new Prisma.Decimal(fund.balance).lt(amount)) {
      throw new Error('Insufficient insurance fund');
    }
    return this.repo.useFund(symbol, amount);
  }

  async getBalance(symbol: string): Promise<Prisma.Decimal | null> {
    return this.repo.getBalance(symbol);
  }

  async getSummary(symbol: string) {
    const fund = await this.repo.findBySymbol(symbol);
    if (!fund) return null;

    return {
      symbol: fund.symbol,
      asset: fund.asset,
      balance: fund.balance,
      totalContributed: fund.totalContributed,
      totalUsed: fund.totalUsed,
      utilizationRate: new Prisma.Decimal(fund.totalContributed).gt(0)
        ? new Prisma.Decimal(fund.totalUsed).div(fund.totalContributed)
        : new Prisma.Decimal(0),
    };
  }
}

export const insuranceService = new InsuranceService();
