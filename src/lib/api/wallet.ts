import { apiGet, apiPost } from './client';

export interface WalletBalance {
  id: string;
  userId: string;
  currency: string;
  balance: string;
  available: string;
  frozen: string;
  locked: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepositAddress {
  id: string;
  userId: string;
  currencyId: string;
  currency: string;
  address: string;
  tag?: string | null;
  chain: string;
  status: string;
  minDepositAmount: string;
  requiredConfirmations: number;
  reused: boolean;
}

export interface WalletDeposit {
  id: string;
  userId: string;
  currencyId: string;
  addressId: string;
  txHash: string;
  amount: string;
  fee: string;
  status: 'pending' | 'confirming' | 'confirmed' | 'credited' | string;
  confirmations: number;
  requiredConfirmations: number;
  blockNumber?: string | null;
  confirmedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepositIngestResult {
  deposit: WalletDeposit;
  balance: WalletBalance | null;
  credited: boolean;
  depositNo: string;
}

export interface WalletWithdrawal {
  id: string;
  userId: string;
  currencyId: string;
  amount: string;
  fee: string;
  totalAmount: string;
  destinationAddress: string;
  memo?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | string;
  txHash?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type WalletAccountKey = 'spot' | 'fund' | 'futures';

export type WalletAccountBalances = Record<WalletAccountKey, string>;

export interface WalletTransfer {
  id: string;
  ledgerId?: string;
  fromAccount: WalletAccountKey;
  toAccount: WalletAccountKey;
  currency: string;
  amount: string;
  status: 'completed' | 'pending' | 'failed' | string;
  createdAt?: string;
  completedAt?: string | null;
  accountBalances?: WalletAccountBalances;
  spotBalance?: WalletBalance | null;
}

export interface WalletTransferOverview {
  accountBalances: WalletAccountBalances;
  list: WalletTransfer[];
  total: number;
  page: number;
  pageSize: number;
}

export const walletApi = {
  getBalances: () => apiGet<WalletBalance[]>('/api/v1/wallet/balances'),

  getTransfers: (currency: string = 'USDT') =>
    apiGet<WalletTransferOverview>(
      `/api/v1/wallet/transfers?page=1&pageSize=20&currency=${encodeURIComponent(currency)}`,
    ),

  createTransfer: (input: {
    fromAccount: WalletAccountKey;
    toAccount: WalletAccountKey;
    currency: string;
    amount: string;
  }) => apiPost<WalletTransfer>('/api/v1/wallet/transfers', input),

  getDepositAddress: (currency: string, chain: string) =>
    apiPost<DepositAddress>('/api/v1/wallet/deposits', {
      action: 'address',
      currency,
      chain,
    }),

  getDeposits: (currency?: string) =>
    apiGet<{
      list: WalletDeposit[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/api/v1/wallet/deposits?page=1&pageSize=20${currency ? `&currency=${currency}` : ''}`),

  simulateDeposit: (input: {
    currency: string;
    chain: string;
    address: string;
    txHash: string;
    amount: string;
    confirmations: number;
  }) =>
    apiPost<DepositIngestResult>('/api/v1/wallet/deposits', {
      action: 'simulate',
      ...input,
    }),

  getWithdrawals: (currency?: string) =>
    apiGet<{
      list: WalletWithdrawal[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/api/v1/wallet/withdrawals?page=1&pageSize=20${currency ? `&currency=${currency}` : ''}`),

  createWithdrawal: (input: {
    currency: string;
    address: string;
    amount: string;
    memo?: string;
  }) => apiPost<WalletWithdrawal>('/api/v1/wallet/withdrawals', input),
};
