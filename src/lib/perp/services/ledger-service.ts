import { PerpLedger, Prisma } from '@prisma/client';
import { ledgerRepo, accountRepo } from '../repos';
import { PaginationParams, PaginatedResult } from '../repos/base-repo';

export class LedgerService {
  private ledgerRepo: typeof ledgerRepo;
  private accountRepo: typeof accountRepo;

  constructor(
    customLedgerRepo?: typeof ledgerRepo,
    customAccountRepo?: typeof accountRepo
  ) {
    this.ledgerRepo = customLedgerRepo || ledgerRepo;
    this.accountRepo = customAccountRepo || accountRepo;
  }

  async getById(id: string): Promise<PerpLedger | null> {
    return this.ledgerRepo.findById(id);
  }

  async getByLedgerNo(ledgerNo: string): Promise<PerpLedger | null> {
    return this.ledgerRepo.findByLedgerNo(ledgerNo);
  }

  async list(params: PaginationParams & {
    userId?: string;
    accountId?: string;
    asset?: string;
    type?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<PaginatedResult<PerpLedger>> {
    return this.ledgerRepo.paginate(params);
  }

  async getUserLedger(userId: string, type?: string, limit = 100): Promise<PerpLedger[]> {
    return this.ledgerRepo.findByUserId(userId, type, limit);
  }

  async getAccountLedger(accountId: string, limit = 100): Promise<PerpLedger[]> {
    return this.ledgerRepo.findByAccountId(accountId, limit);
  }

  async record(
    accountId: string,
    userId: string,
    asset: string,
    changeAmount: Prisma.Decimal,
    type: string,
    direction: 'in' | 'out',
    options: {
      referenceId?: string;
      referenceType?: string;
      description?: string;
      tx?: any;
    } = {}
  ): Promise<PerpLedger> {
    const account = await this.accountRepo.findById(accountId);
    if (!account) throw new Error('Account not found');

    const balanceAfter = new Prisma.Decimal(account.balance).add(changeAmount);

    return this.ledgerRepo.recordLedger(
      accountId,
      userId,
      asset,
      changeAmount,
      balanceAfter,
      type,
      direction,
      options.referenceId,
      options.referenceType,
      options.description,
      options.tx
    );
  }

  async getStatistics(userId: string, asset: string, startTime: Date, endTime: Date) {
    const records = await this.ledgerRepo.paginate({
      userId,
      page: 1,
      pageSize: 1000,
      startTime,
      endTime,
    });

    let totalIn = new Prisma.Decimal(0);
    let totalOut = new Prisma.Decimal(0);
    let feeTotal = new Prisma.Decimal(0);
    let pnlTotal = new Prisma.Decimal(0);
    let fundingTotal = new Prisma.Decimal(0);

    for (const record of records.items) {
      const amount = new Prisma.Decimal(record.changeAmount);
      if (amount.gt(0)) {
        totalIn = totalIn.add(amount);
      } else {
        totalOut = totalOut.add(amount.abs());
      }

      if (record.type === 'trading_fee') {
        feeTotal = feeTotal.add(amount.abs());
      } else if (record.type === 'realized_pnl') {
        pnlTotal = pnlTotal.add(amount);
      } else if (record.type === 'funding_fee') {
        fundingTotal = fundingTotal.add(amount);
      }
    }

    return {
      totalRecords: records.total,
      totalIn,
      totalOut,
      netChange: totalIn.sub(totalOut),
      feeTotal,
      pnlTotal,
      fundingTotal,
    };
  }
}

export const ledgerService = new LedgerService();
