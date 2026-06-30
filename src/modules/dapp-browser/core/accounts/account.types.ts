export type AccountType = 'eoa' | 'smart' | 'mpc' | 'hardware';

export type AccountStatus = 'active' | 'locked' | 'disabled' | 'hidden';

export interface ChainInfo {
  chainId: string;
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorerUrl?: string;
  decimals: number;
  iconUrl?: string;
}

export interface AccountRecord {
  accountId: string;
  userId?: string;
  type: AccountType;
  addresses: Record<string, string>;
  metadata?: {
    name?: string;
    description?: string;
    color?: string;
    derivationPath?: string;
  };
  status: AccountStatus;
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
}

export interface ActiveAccount {
  accountId: string;
  address: string;
  chainId: string;
  type: AccountType;
  metadata?: AccountRecord['metadata'];
}

export interface AccountSelectionOptions {
  accountId?: string;
  chainId?: string;
  type?: AccountType;
}

export interface AccountRegistryStorage {
  save(account: AccountRecord): Promise<void>;
  get(accountId: string): Promise<AccountRecord | undefined>;
  getAll(): Promise<AccountRecord[]>;
  findByUserId(userId: string): Promise<AccountRecord[]>;
  findByAddress(address: string, chainId?: string): Promise<AccountRecord[]>;
  update(account: AccountRecord): Promise<void>;
  delete(accountId: string): Promise<void>;
  clear(): Promise<void>;
}
