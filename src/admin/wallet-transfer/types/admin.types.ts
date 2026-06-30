export interface HotWalletSummary {
  walletNo: string;
  chainType: string;
  chainId: string;
  address: string;
  assetSymbol: string;
  walletRole: string;
  balance: string;
  availableBalance: string;
  lockedBalance: string;
  status: string;
}

export interface WithdrawalApproval {
  withdrawNo: string;
  userId: string;
  assetSymbol: string;
  amount: string;
  toAddress: string;
  riskLevel: string;
  approvalStatus: string;
  requestedAt: string;
}

export interface ReconciliationRecord {
  reconcileNo: string;
  chainType: string;
  chainId: string;
  bizType: string;
  bizNo: string;
  assetSymbol: string;
  systemAmount: string;
  chainAmount: string;
  difference: string;
  status: string;
  reason: string;
}

export interface CompensationTask {
  taskNo: string;
  withdrawNo: string;
  userId: string;
  assetSymbol: string;
  amount: string;
  status: string;
  createdAt: string;
}