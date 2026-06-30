import { SpotAccount, SpotAccountLedger, Prisma, SpotAccountLedgerType } from '@prisma/client';
import { spotAccountRepo, spotAccountLedgerRepo } from '../repos';
import { PaginationParams, PaginatedResult } from '../repos/base-repo';

export class SpotAccountService {
  private accountRepo: typeof spotAccountRepo;
  private ledgerRepo: typeof spotAccountLedgerRepo;

  constructor(customAccountRepo?: typeof spotAccountRepo, customLedgerRepo?: typeof spotAccountLedgerRepo) {
    this.accountRepo = customAccountRepo || spotAccountRepo;
    this.ledgerRepo = customLedgerRepo || spotAccountLedgerRepo;
  }

  async getById(id: string): Promise<SpotAccount | null> {
    return this.accountRepo.findById(id);
  }

  async getByUserIdAndAsset(userId: string, asset: string): Promise<SpotAccount | null> {
    return this.accountRepo.findByUserIdAndAsset(userId, asset);
  }

  async getByUserId(userId: string): Promise<SpotAccount[]> {
    return this.accountRepo.findByUserId(userId);
  }

  async getBalances(userId: string): Promise<Array<{ asset: string; balance: Prisma.Decimal; available: Prisma.Decimal; frozen: Prisma.Decimal }>> {
    const accounts = await this.accountRepo.findByUserId(userId);
    return accounts.map(account => ({
      asset: account.asset,
      balance: account.balance,
      available: account.available,
      frozen: account.frozen,
    }));
  }

  async getBalance(userId: string, asset: string): Promise<{ asset: string; balance: Prisma.Decimal; available: Prisma.Decimal; frozen: Prisma.Decimal } | null> {
    const account = await this.accountRepo.findByUserIdAndAsset(userId, asset);
    if (!account) return null;
    return {
      asset: account.asset,
      balance: account.balance,
      available: account.available,
      frozen: account.frozen,
    };
  }

  async list(params: PaginationParams & { userId?: string; asset?: string; status?: string }): Promise<PaginatedResult<SpotAccount>> {
    return this.accountRepo.paginate(params);
  }

  async create(data: Prisma.SpotAccountCreateInput): Promise<SpotAccount> {
    return this.accountRepo.create(data);
  }

  async ensureAccount(userId: string, asset: string): Promise<SpotAccount> {
    return this.accountRepo.ensureAccount(userId, asset);
  }

  async freeze(userId: string, asset: string, amount: Prisma.Decimal): Promise<SpotAccount> {
    const account = await this.accountRepo.findByUserIdAndAsset(userId, asset);
    if (!account) {
      throw new Error(`Account not found for user ${userId} and asset ${asset}`);
    }
    if (account.available.lt(amount)) {
      throw new Error(`Insufficient available balance. Available: ${account.available}, Required: ${amount}`);
    }
    return this.accountRepo.freeze(account.id, amount);
  }

  async unfreeze(userId: string, asset: string, amount: Prisma.Decimal): Promise<SpotAccount> {
    const account = await this.accountRepo.findByUserIdAndAsset(userId, asset);
    if (!account) {
      throw new Error(`Account not found for user ${userId} and asset ${asset}`);
    }
    if (account.frozen.lt(amount)) {
      throw new Error(`Insufficient frozen balance. Frozen: ${account.frozen}, Required: ${amount}`);
    }
    return this.accountRepo.unfreeze(account.id, amount);
  }

  async consumeFrozen(userId: string, asset: string, amount: Prisma.Decimal): Promise<SpotAccount> {
    const account = await this.accountRepo.findByUserIdAndAsset(userId, asset);
    if (!account) {
      throw new Error(`Account not found for user ${userId} and asset ${asset}`);
    }
    if (account.frozen.lt(amount)) {
      throw new Error(`Insufficient frozen balance. Frozen: ${account.frozen}, Required: ${amount}`);
    }
    return this.accountRepo.consumeFrozen(account.id, amount);
  }

  async addBalance(userId: string, asset: string, amount: Prisma.Decimal): Promise<SpotAccount> {
    const account = await this.accountRepo.ensureAccount(userId, asset);
    return this.accountRepo.addBalance(account.id, amount);
  }

  async subtractBalance(userId: string, asset: string, amount: Prisma.Decimal): Promise<SpotAccount> {
    const account = await this.accountRepo.findByUserIdAndAsset(userId, asset);
    if (!account) {
      throw new Error(`Account not found for user ${userId} and asset ${asset}`);
    }
    if (account.available.lt(amount)) {
      throw new Error(`Insufficient available balance. Available: ${account.available}, Required: ${amount}`);
    }
    return this.accountRepo.subtractBalance(account.id, amount);
  }

  async transferIn(userId: string, asset: string, amount: Prisma.Decimal, referenceId: string, remark?: string): Promise<SpotAccount> {
    const account = await this.addBalance(userId, asset, amount);
    await this.createLedger(account.id, userId, asset, SpotAccountLedgerType.transfer_in, 'in', amount, account.balance.sub(amount), account.balance, referenceId, 'transfer', remark);
    return account;
  }

  async transferOut(userId: string, asset: string, amount: Prisma.Decimal, referenceId: string, remark?: string): Promise<SpotAccount> {
    const account = await this.accountRepo.findByUserIdAndAsset(userId, asset);
    if (!account) {
      throw new Error(`Account not found for user ${userId} and asset ${asset}`);
    }
    if (account.available.lt(amount)) {
      throw new Error(`Insufficient available balance. Available: ${account.available}, Required: ${amount}`);
    }
    const balanceBefore = account.balance;
    const updatedAccount = await this.accountRepo.subtractBalance(account.id, amount);
    await this.createLedger(account.id, userId, asset, SpotAccountLedgerType.transfer_out, 'out', amount, balanceBefore, updatedAccount.balance, referenceId, 'transfer', remark);
    return updatedAccount;
  }

  async createLedger(accountId: string, userId: string, asset: string, type: SpotAccountLedgerType, direction: string, amount: Prisma.Decimal, balanceBefore: Prisma.Decimal, balanceAfter: Prisma.Decimal, referenceId: string, referenceType: string, remark?: string): Promise<SpotAccountLedger> {
    return this.ledgerRepo.create({
      ledgerNo: `LG${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      userId,
      account: { connect: { id: accountId } },
      asset,
      type,
      direction,
      amount,
      balanceBefore,
      balanceAfter,
      referenceId,
      referenceType,
      remark,
    });
  }

  async getLedgers(userId: string): Promise<SpotAccountLedger[]> {
    return this.ledgerRepo.findByUserId(userId);
  }

  async getAccountLedgers(accountId: string): Promise<SpotAccountLedger[]> {
    return this.ledgerRepo.findByAccountId(accountId);
  }

  async getLedgersPaginated(params: PaginationParams & { userId?: string; accountId?: string; type?: SpotAccountLedgerType; asset?: string }): Promise<PaginatedResult<SpotAccountLedger>> {
    return this.ledgerRepo.paginate(params);
  }

  async setStatus(id: string, status: string): Promise<SpotAccount> {
    return this.accountRepo.setStatus(id, status);
  }
}

export const spotAccountService = new SpotAccountService();