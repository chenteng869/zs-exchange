import type { ActiveAccount, AccountRecord } from './account.types';
import { AccountRegistryService } from './account-registry.service';
import { WalletNotConnectedError, AccountNotFoundError } from '../../shared/errors';

export class ActiveAccountService {
  private activeAccount: ActiveAccount | null = null;

  constructor(private readonly registry: AccountRegistryService = new AccountRegistryService()) {}

  get(): ActiveAccount | null {
    return this.activeAccount;
  }

  async set(accountId: string, chainId: string): Promise<ActiveAccount> {
    const account = await this.registry.get(accountId);
    const address = account.addresses[chainId];
    if (!address) {
      throw new AccountNotFoundError(accountId);
    }
    await this.registry.markUsed(accountId);
    this.activeAccount = {
      accountId: account.accountId,
      address,
      chainId,
      type: account.type,
      metadata: account.metadata,
    };
    return this.activeAccount;
  }

  async setFromRecord(account: AccountRecord, chainId: string): Promise<ActiveAccount> {
    const address = account.addresses[chainId];
    if (!address) {
      throw new AccountNotFoundError(account.accountId);
    }
    await this.registry.markUsed(account.accountId);
    this.activeAccount = {
      accountId: account.accountId,
      address,
      chainId,
      type: account.type,
      metadata: account.metadata,
    };
    return this.activeAccount;
  }

  async getOrSetDefault(chainId: string, userId?: string): Promise<ActiveAccount> {
    if (this.activeAccount && this.activeAccount.chainId === chainId) {
      return this.activeAccount;
    }
    const account = await this.registry.getOrCreateDefault(userId);
    return this.setFromRecord(account, chainId);
  }

  async switchChain(chainId: string): Promise<ActiveAccount> {
    if (!this.activeAccount) {
      throw new WalletNotConnectedError();
    }
    const account = await this.registry.get(this.activeAccount.accountId);
    const address = account.addresses[chainId];
    if (!address) {
      throw new AccountNotFoundError(this.activeAccount.accountId);
    }
    this.activeAccount = {
      ...this.activeAccount,
      chainId,
      address,
    };
    return this.activeAccount;
  }

  async switchAccount(accountId: string): Promise<ActiveAccount> {
    const chainId = this.activeAccount?.chainId || '0x1';
    return this.set(accountId, chainId);
  }

  async getAccountRecord(): Promise<AccountRecord> {
    if (!this.activeAccount) {
      throw new WalletNotConnectedError();
    }
    return this.registry.get(this.activeAccount.accountId);
  }

  disconnect(): void {
    this.activeAccount = null;
  }

  isConnected(): boolean {
    return this.activeAccount !== null;
  }

  getAddress(): string | null {
    return this.activeAccount?.address || null;
  }

  getChainId(): string | null {
    return this.activeAccount?.chainId || null;
  }

  getAccountId(): string | null {
    return this.activeAccount?.accountId || null;
  }

  getAccountType(): string | null {
    return this.activeAccount?.type || null;
  }

  getMetadata(): AccountRecord['metadata'] | undefined {
    return this.activeAccount?.metadata;
  }
}