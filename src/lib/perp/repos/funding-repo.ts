import { PerpFundingRate, PerpFundingPayment, Prisma } from '@prisma/client';
import { BaseRepository, PaginationParams, PaginatedResult, buildPagination, toPaginatedResult } from './base-repo';

export class FundingRepository extends BaseRepository {
  async getLatestRate(symbol: string): Promise<PerpFundingRate | null> {
    return this.prisma.perpFundingRate.findFirst({
      where: { symbol },
      orderBy: { fundingTime: 'desc' },
    });
  }

  async getRateHistory(symbol: string, limit = 100): Promise<PerpFundingRate[]> {
    return this.prisma.perpFundingRate.findMany({
      where: { symbol },
      orderBy: { fundingTime: 'desc' },
      take: limit,
    });
  }

  async createRate(data: Prisma.PerpFundingRateCreateInput): Promise<PerpFundingRate> {
    return this.prisma.perpFundingRate.create({ data });
  }

  async findPaymentById(id: string): Promise<PerpFundingPayment | null> {
    return this.prisma.perpFundingPayment.findUnique({ where: { id } });
  }

  async findPaymentByNo(paymentNo: string): Promise<PerpFundingPayment | null> {
    return this.prisma.perpFundingPayment.findUnique({ where: { paymentNo } });
  }

  async findPaymentsByUser(userId: string, symbol?: string, limit = 100): Promise<PerpFundingPayment[]> {
    const where: Prisma.PerpFundingPaymentWhereInput = { userId };
    if (symbol) where.symbol = symbol;
    return this.prisma.perpFundingPayment.findMany({ where, orderBy: { fundingTime: 'desc' }, take: limit });
  }

  async findPaymentsByPosition(positionId: string): Promise<PerpFundingPayment[]> {
    return this.prisma.perpFundingPayment.findMany({
      where: { positionId },
      orderBy: { fundingTime: 'asc' },
    });
  }

  async paginatePayments(params: PaginationParams & {
    userId?: string;
    symbol?: string;
    status?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<PaginatedResult<PerpFundingPayment>> {
    const { skip, take, page, pageSize } = buildPagination(params);
    const where: Prisma.PerpFundingPaymentWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.symbol) where.symbol = params.symbol;
    if (params.status) where.status = params.status;
    if (params.startTime || params.endTime) {
      where.fundingTime = {};
      if (params.startTime) where.fundingTime.gte = params.startTime;
      if (params.endTime) where.fundingTime.lte = params.endTime;
    }

    const [items, total] = await Promise.all([
      this.prisma.perpFundingPayment.findMany({ where, skip, take, orderBy: { fundingTime: 'desc' } }),
      this.prisma.perpFundingPayment.count({ where }),
    ]);

    return toPaginatedResult(items, total, page, pageSize);
  }

  async createPayment(data: Prisma.PerpFundingPaymentCreateInput): Promise<PerpFundingPayment> {
    return this.prisma.perpFundingPayment.create({ data });
  }

  async createManyPayments(data: Prisma.PerpFundingPaymentCreateManyInput[]): Promise<number> {
    const result = await this.prisma.perpFundingPayment.createMany({ data });
    return result.count;
  }

  async updatePaymentStatus(id: string, status: string): Promise<PerpFundingPayment> {
    return this.prisma.perpFundingPayment.update({ where: { id }, data: { status } });
  }
}

export const fundingRepo = new FundingRepository();
