export type ChainType = 'evm' | 'tron' | 'solana';

export type DepositStatus =
  | 'detected'
  | 'confirming'
  | 'confirmed'
  | 'credited'
  | 'failed'
  | 'ignored'
  | 'orphaned';

export type WithdrawalStatus =
  | 'created'
  | 'risk_checking'
  | 'waiting_approval'
  | 'approved'
  | 'hot_wallet_locking'
  | 'building'
  | 'signing'
  | 'signed'
  | 'broadcasting'
  | 'broadcasted'
  | 'confirming'
  | 'confirmed'
  | 'failed'
  | 'rejected'
  | 'canceled'
  | 'compensation_required'
  | 'manual_review';

export interface ChainOption {
  chainType: ChainType;
  chainId: string;
  chainName: string;
  nativeSymbol: string;
  enabled: boolean;
}

export interface AssetOption {
  assetSymbol: string;
  chainType: ChainType;
  chainId: string;
  contractAddress?: string;
  decimals: number;
  withdrawEnabled: boolean;
  depositEnabled: boolean;
  minWithdrawAmount?: string;
  withdrawFee?: string;
}

export interface DepositAddress {
  userId: string;
  walletId?: string;
  chainType: ChainType;
  chainId: string;
  address: string;
  memo?: string;
  addressIndex?: number;
}

export interface DepositRecord {
  depositNo: string;
  chainType: ChainType;
  chainId: string;
  txHash: string;
  fromAddress?: string;
  toAddress: string;
  assetSymbol: string;
  amount: string;
  confirmations: number;
  requiredConfirmations: number;
  status: DepositStatus;
  detectedAt: string;
  creditedAt?: string;
}

export interface WithdrawRecord {
  withdrawNo: string;
  chainType: ChainType;
  chainId: string;
  toAddress: string;
  assetSymbol: string;
  amount: string;
  feeAmount: string;
  netAmount: string;
  txHash?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  status: WithdrawalStatus;
  requestedAt: string;
  confirmedAt?: string;
}

export interface WithdrawQuote {
  assetSymbol: string;
  amount: string;
  feeAmount: string;
  netAmount: string;
  estimatedNetworkFee?: string;
  minWithdrawAmount?: string;
  risk?: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    reasons: string[];
    requiresSecondConfirm: boolean;
  };
}

export interface AddressBookEntry {
  id: string;
  userId: string;
  chainType: ChainType;
  chainId: string;
  assetSymbol: string;
  address: string;
  label: string;
  isBlacklisted?: boolean;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}