import { PerpAccount, Prisma } from '@prisma/client';
import { accountRepo, ledgerRepo } from '../repos';
import { PaginationParams, PaginatedResult } from '../repos/base-repo';

export class AccountService {
  private accountRepo: typeof accountRepo;
  private ledgerRepo: typeof ledgerRepo;

  constructor(
    customAccountRepo?: typeof accountRepo,
    customLedgerRepo?: typeof ledgerRepo
  ) {
    this.accountRepo = customAccountRepo || accountRepo;
    this.ledgerRepo = customLedgerRepo || ledgerRepo;
  }

  async getById(id: string): Promise<PerpAccount | null> {
    return this.accountRepo.findById(id);
  }

  async getByUserAssetType(userId: string, asset: string, accountType: string): Promise<PerpAccount | null> {
    return this.accountRepo.findByUserAssetType(userId, asset, accountType);
  }

  async getOrCreate(userId: string, asset: string, accountType: string): Promise<PerpAccount> {
    return this.accountRepo.getOrCreate(userId, asset, accountType);
  }

  async list(params: PaginationParams & { userId?: string; asset?: string; status?: string }): Promise<PaginatedResult<PerpAccount>> {
    return this.accountRepo.paginate(params);
  }

  async deposit(
    userId: string,
    asset: string,
    amount: Prisma.Decimal,
    referenceId?: string,
    description?: string
  ): Promise<PerpAccount> {
    const account = await this.getOrCreate(userId, asset, 'cross');

    return this.accountRepo.withTransaction(async (tx) => {
      const updated = await this.accountRepo.adjustBalance(account.id, amount, tx as any);

      await this.ledgerRepo.recordLedger(
        account.id,
        userId,
        asset,
        amount,
        updated.balance,
        'deposit',
        'in',
        referenceId,
        'deposit',
        description || 'Deposit to perp account',
        tx as any
      );

      return updated;
    });
  }

  async withdraw(
    userId: string,
    asset: string,
    amount: Prisma.Decimal,
    referenceId?: string,
    description?: string
  ): Promise<PerpAccount> {
    const account = await this.getOrCreate(userId, asset, 'cross');

    if (new Prisma.Decimal(account.availableBalance).lt(amount)) {
      throw new Error('Insufficient available balance');
    }

    return this.accountRepo.withTransaction(async (tx) => {
      const updated = await this.accountRepo.adjustBalance(account.id, amount.negated(), tx as any);

      await this.ledgerRepo.recordLedger(
        account.id,
        userId,
        asset,
        amount.negated(),
        updated.balance,
        'withdraw',
        'out',
        referenceId,
        'withdraw',
        description || 'Withdraw from perp account',
        tx as any
      );

      return updated;
    });
  }

  async freezeMargin(
    accountId: string,
    amount: Prisma.Decimal,
    referenceId?: string
  ): Promise<PerpAccount> {
    const account = await this.accountRepo.findById(accountId);
    if (!account) throw new Error('Account not found');

    if (new Prisma.Decimal(account.availableBalance).lt(amount)) {
      throw new Error('Insufficient available balance');
    }

    return this.accountRepo.freezeBalance(accountId, amount);
  }

  async unfreezeMargin(
    accountId: string,
    amount: Prisma.Decimal
  ): Promise<PerpAccount> {
    return this.accountRepo.unfreezeBalance(accountId, amount);
  }

  async setStatus(id: string, status: string): Promise<PerpAccount> {
    return this.accountRepo.setStatus(id, status);
  }

  async getAccountSummary(userId: string, asset: string) {
    const account = await this.accountRepo.findByUserAssetType(userId, asset, 'cross');
    if (!account) return null;

    return {
      totalWalletBalance: account.balance,
      availableBalance: account.availableBalance,
      frozenBalance: account.frozenBalance,
      marginBalance: account.marginBalance,
      unrealizedPnl: account.unrealizedPnl,
      realizedPnl: account.realizedPnl,
      fundingFeePaid: account.fundingFeePaid,
      fundingFeeReceived: account.fundingFeeReceived,
      riskRate: account.riskRate,
    };
  }
}

export const accountService = new AccountService();
