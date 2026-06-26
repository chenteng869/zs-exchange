import { PerpFundingRate, PerpFundingPayment, Prisma } from '@prisma/client';
import { fundingRepo, positionRepo, accountRepo, contractRepo } from '../repos';
import { PaginationParams, PaginatedResult } from '../repos/base-repo';

export class FundingService {
  private fundingRepo: typeof fundingRepo;
  private positionRepo: typeof positionRepo;
  private accountRepo: typeof accountRepo;
  private contractRepo: typeof contractRepo;

  constructor(
    customFundingRepo?: typeof fundingRepo,
    customPositionRepo?: typeof positionRepo,
    customAccountRepo?: typeof accountRepo,
    customContractRepo?: typeof contractRepo
  ) {
    this.fundingRepo = customFundingRepo || fundingRepo;
    this.positionRepo = customPositionRepo || positionRepo;
    this.accountRepo = customAccountRepo || accountRepo;
    this.contractRepo = customContractRepo || contractRepo;
  }

  async getLatestRate(symbol: string): Promise<PerpFundingRate | null> {
    return this.fundingRepo.getLatestRate(symbol);
  }

  async getRateHistory(symbol: string, limit = 100): Promise<PerpFundingRate[]> {
    return this.fundingRepo.getRateHistory(symbol, limit);
  }

  async listPayments(params: PaginationParams & {
    userId?: string;
    symbol?: string;
    status?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<PaginatedResult<PerpFundingPayment>> {
    return this.fundingRepo.paginatePayments(params);
  }

  async getUserPayments(userId: string, symbol?: string, limit = 100): Promise<PerpFundingPayment[]> {
    return this.fundingRepo.findPaymentsByUser(userId, symbol, limit);
  }

  async recordRate(data: Prisma.PerpFundingRateCreateInput): Promise<PerpFundingRate> {
    return this.fundingRepo.createRate(data);
  }

  calculateFundingFee(
    positionSize: Prisma.Decimal,
    markPrice: Prisma.Decimal,
    fundingRate: Prisma.Decimal
  ): Prisma.Decimal {
    const notional = positionSize.mul(markPrice);
    return notional.mul(fundingRate).abs();
  }

  async settleFunding(symbol: string, fundingRate: Prisma.Decimal): Promise<number> {
    const contract = await this.contractRepo.findBySymbol(symbol);
    if (!contract) throw new Error('Contract not found');

    const positions = await this.positionRepo.findBySymbol(symbol, 'active');
    const payments: Prisma.PerpFundingPaymentCreateManyInput[] = [];
    let count = 0;

    for (const pos of positions) {
      const positionValue = new Prisma.Decimal(pos.positionQty).mul(pos.markPrice);
      const fee = positionValue.mul(fundingRate).abs();
      const direction = pos.side === 'long' ? (fundingRate.gt(0) ? 'out' : 'in') : (fundingRate.gt(0) ? 'in' : 'out');

      payments.push({
        paymentNo: `FP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}_${pos.id.substring(0, 4)}`,
        userId: pos.userId,
        accountId: pos.accountId,
        positionId: pos.id,
        contractId: contract.id,
        symbol,
        fundingRate,
        fundingAmount: fee,
        direction,
        fundingTime: new Date(),
        status: 'completed',
      });

      count++;
    }

    if (payments.length > 0) {
      await this.fundingRepo.createManyPayments(payments);
    }

    return count;
  }
}

export const fundingService = new FundingService();
