import type { AccountRecord, AccountType, AccountStatus, AccountRegistryStorage } from './account.types';
import { AccountNotFoundError } from '../../shared/errors';

export class AccountRegistryStorageService implements AccountRegistryStorage {
  private accounts = new Map<string, AccountRecord>();

  async save(account: AccountRecord): Promise<void> {
    this.accounts.set(account.accountId, account);
  }

  async get(accountId: string): Promise<AccountRecord | undefined> {
    return this.accounts.get(accountId);
  }

  async getAll(): Promise<AccountRecord[]> {
    return Array.from(this.accounts.values());
  }

  async findByUserId(userId: string): Promise<AccountRecord[]> {
    return Array.from(this.accounts.values()).filter((account) => account.userId === userId);
  }

  async findByAddress(address: string, chainId?: string): Promise<AccountRecord[]> {
    return Array.from(this.accounts.values()).filter((account) => {
      if (chainId) {
        return account.addresses[chainId]?.toLowerCase() === address.toLowerCase();
      }
      return Object.values(account.addresses).some((addr) => addr.toLowerCase() === address.toLowerCase());
    });
  }

  async update(account: AccountRecord): Promise<void> {
    this.accounts.set(account.accountId, { ...account, updatedAt: Date.now() });
  }

  async delete(accountId: string): Promise<void> {
    this.accounts.delete(accountId);
  }

  async clear(): Promise<void> {
    this.accounts.clear();
  }
}

export interface AccountCreateOptions {
  accountId: string;
  userId?: string;
  type: AccountType;
  addresses: Record<string, string>;
  metadata?: AccountRecord['metadata'];
}

export class AccountRegistryService {
  constructor(private readonly storage: AccountRegistryStorage = new AccountRegistryStorageService()) {}

  async create(options: AccountCreateOptions): Promise<AccountRecord> {
    const now = Date.now();
    const account: AccountRecord = {
      ...options,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    await this.storage.save(account);
    return account;
  }

  async get(accountId: string): Promise<AccountRecord> {
    const account = await this.storage.get(accountId);
    if (!account) {
      throw new AccountNotFoundError(accountId);
    }
    return account;
  }

  async findByUserId(userId: string): Promise<AccountRecord[]> {
    return this.storage.findByUserId(userId);
  }

  async findByAddress(address: string, chainId?: string): Promise<AccountRecord[]> {
    return this.storage.findByAddress(address, chainId);
  }

  async getAll(): Promise<AccountRecord[]> {
    return this.storage.getAll();
  }

  async getActiveAccounts(userId?: string): Promise<AccountRecord[]> {
    const accounts = userId ? await this.findByUserId(userId) : await this.getAll();
    return accounts.filter((account) => account.status === 'active');
  }

  async update(account: AccountRecord): Promise<AccountRecord> {
    await this.storage.update(account);
    return account;
  }

  async updateAddresses(accountId: string, addresses: Record<string, string>): Promise<AccountRecord> {
    const account = await this.get(accountId);
    account.addresses = { ...account.addresses, ...addresses };
    account.updatedAt = Date.now();
    await this.storage.update(account);
    return account;
  }

  async updateMetadata(accountId: string, metadata: AccountRecord['metadata']): Promise<AccountRecord> {
    const account = await this.get(accountId);
    account.metadata = { ...account.metadata, ...metadata };
    account.updatedAt = Date.now();
    await this.storage.update(account);
    return account;
  }

  async setStatus(accountId: string, status: AccountStatus): Promise<AccountRecord> {
    const account = await this.get(accountId);
    account.status = status;
    account.updatedAt = Date.now();
    await this.storage.update(account);
    return account;
  }

  async markUsed(accountId: string): Promise<AccountRecord> {
    const account = await this.get(accountId);
    account.lastUsedAt = Date.now();
    account.updatedAt = Date.now();
    await this.storage.update(account);
    return account;
  }

  async delete(accountId: string): Promise<void> {
    await this.storage.delete(accountId);
  }

  async clear(): Promise<void> {
    await this.storage.clear();
  }

  async getAddress(accountId: string, chainId: string): Promise<string> {
    const account = await this.get(accountId);
    const address = account.addresses[chainId];
    if (!address) {
      throw new AccountNotFoundError(accountId);
    }
    return address;
  }

  async getOrCreateDefault(userId?: string): Promise<AccountRecord> {
    const existing = await this.getActiveAccounts(userId);
    if (existing.length > 0) {
      return existing[0];
    }
    return this.create({
      accountId: `default_${Date.now()}`,
      userId,
      type: 'eoa',
      addresses: {},
      metadata: { name: 'Default Account' },
    });
  }
}
