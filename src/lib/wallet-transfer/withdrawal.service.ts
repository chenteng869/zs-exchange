import {
  ApprovalStatus,
  LedgerBizType,
  TransferChainType,
  WithdrawalStatus,
  WalletWithdrawalRecord,
} from '@prisma/client';
import { withdrawalRepo } from './repos/withdrawal.repo';
import { withdrawalApprovalRepo } from './repos/withdrawal-approval.repo';
import { userAssetBalanceRepo } from './repos/user-asset-balance.repo';
import { hotWalletRepo } from './repos/hot-wallet.repo';
import { chainTransactionRepo } from './repos/chain-transaction.repo';
import { generateNo } from './types';

export interface CreateWithdrawalParams {
  userId: string;
  walletId?: string;
  chainType: TransferChainType;
  chainId: string;
  toAddress: string;
  assetSymbol: string;
  contractAddress?: string;
  amount: string;
  feeAmount: string;
  idempotencyKey?: string;
  riskScore?: number;
  riskLevel?: string;
  requiresApproval?: boolean;
  approvalRequiredCount?: number;
  orgId?: string;
}

export class WithdrawalService {
  async createWithdrawal(params: CreateWithdrawalParams): Promise<WalletWithdrawalRecord> {
    if (params.idempotencyKey) {
      const existing = await withdrawalRepo.findByIdempotencyKey(params.idempotencyKey);
      if (existing) return existing;
    }

    const netAmount = this.calculateNetAmount(params.amount, params.feeAmount);

    const withdrawal = await withdrawalRepo.create({
      userId: params.userId,
      walletId: params.walletId,
      chainType: params.chainType,
      chainId: params.chainId,
      toAddress: params.toAddress,
      assetSymbol: params.assetSymbol,
      contractAddress: params.contractAddress,
      amount: params.amount,
      feeAmount: params.feeAmount,
      netAmount,
      idempotencyKey: params.idempotencyKey,
    });

    await userAssetBalanceRepo.freezeForWithdraw({
      userId: params.userId,
      chainType: params.chainType,
      chainId: params.chainId,
      assetSymbol: params.assetSymbol,
      contractAddress: params.contractAddress,
      amount: params.amount,
    });

    if (params.riskScore !== undefined && params.riskLevel) {
      await withdrawalRepo.updateRisk({
        withdrawNo: withdrawal.withdrawNo,
        riskScore: params.riskScore,
        riskLevel: params.riskLevel,
      });
    }

    if (params.requiresApproval) {
      await this.initiateApproval({
        withdrawNo: withdrawal.withdrawNo,
        userId: params.userId,
        walletId: params.walletId,
        orgId: params.orgId,
        requiredCount: params.approvalRequiredCount ?? 2,
      });
    } else {
      await withdrawalRepo.updateStatus(withdrawal.withdrawNo, WithdrawalStatus.approved);
    }

    return withdrawalRepo.findByNo(withdrawal.withdrawNo) as Promise<WalletWithdrawalRecord>;
  }

  private async initiateApproval(params: {
    withdrawNo: string;
    userId: string;
    walletId?: string;
    orgId?: string;
    requiredCount: number;
  }) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const approval = await withdrawalApprovalRepo.create({
      withdrawNo: params.withdrawNo,
      userId: params.userId,
      walletId: params.walletId,
      orgId: params.orgId,
      requiredCount: params.requiredCount,
      expiresAt,
    });

    await withdrawalRepo.markWaitingApproval({
      withdrawNo: params.withdrawNo,
      approvalNo: approval.approvalNo,
    });
  }

  private calculateNetAmount(amount: string, fee: string): string {
    const amt = parseFloat(amount);
    const f = parseFloat(fee);
    return (amt - f).toString();
  }

  async approveWithdrawal(params: {
    withdrawNo: string;
    approverId: string;
    approverRole: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<WalletWithdrawalRecord> {
    const withdrawal = await withdrawalRepo.findByNo(params.withdrawNo);
    if (!withdrawal) throw new Error('WITHDRAWAL_NOT_FOUND');
    if (withdrawal.status !== WithdrawalStatus.waiting_approval) {
      throw new Error('WITHDRAWAL_NOT_WAITING_APPROVAL');
    }

    const approval = await withdrawalApprovalRepo.approve({
      approvalNo: withdrawal.approvalNo!,
      withdrawNo: params.withdrawNo,
      approverId: params.approverId,
      approverRole: params.approverRole,
      reason: params.reason,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    if (approval.status === ApprovalStatus.approved) {
      await withdrawalRepo.markApproved(params.withdrawNo);
    }

    return withdrawalRepo.findByNo(params.withdrawNo) as Promise<WalletWithdrawalRecord>;
  }

  async rejectWithdrawal(params: {
    withdrawNo: string;
    approverId: string;
    approverRole: string;
    reason: string;
  }): Promise<WalletWithdrawalRecord> {
    const withdrawal = await withdrawalRepo.findByNo(params.withdrawNo);
    if (!withdrawal) throw new Error('WITHDRAWAL_NOT_FOUND');

    await withdrawalApprovalRepo.reject({
      approvalNo: withdrawal.approvalNo!,
      withdrawNo: params.withdrawNo,
      approverId: params.approverId,
      approverRole: params.approverRole,
      reason: params.reason,
    });

    await withdrawalRepo.markRejected(params.withdrawNo, params.reason);

    await userAssetBalanceRepo.releaseFrozenForWithdraw({
      userId: withdrawal.userId,
      chainType: withdrawal.chainType,
      chainId: withdrawal.chainId,
      assetSymbol: withdrawal.assetSymbol,
      contractAddress: withdrawal.contractAddress ?? undefined,
      amount: withdrawal.amount,
    });

    return withdrawalRepo.findByNo(params.withdrawNo) as Promise<WalletWithdrawalRecord>;
  }

  async cancelWithdrawal(withdrawNo: string, userId: string): Promise<WalletWithdrawalRecord> {
    const withdrawal = await withdrawalRepo.findByNo(withdrawNo);
    if (!withdrawal) throw new Error('WITHDRAWAL_NOT_FOUND');
    if (withdrawal.userId !== userId) throw new Error('NOT_AUTHORIZED');

    const cancellableStatuses: WithdrawalStatus[] = [
      WithdrawalStatus.created,
      WithdrawalStatus.risk_checking,
      WithdrawalStatus.waiting_approval,
      WithdrawalStatus.approved,
    ];

    if (!cancellableStatuses.includes(withdrawal.status)) {
      throw new Error('WITHDRAWAL_CANNOT_CANCEL');
    }

    await withdrawalRepo.markCanceled(withdrawNo);

    await userAssetBalanceRepo.releaseFrozenForWithdraw({
      userId: withdrawal.userId,
      chainType: withdrawal.chainType,
      chainId: withdrawal.chainId,
      assetSymbol: withdrawal.assetSymbol,
      contractAddress: withdrawal.contractAddress ?? undefined,
      amount: withdrawal.amount,
    });

    return withdrawalRepo.findByNo(withdrawNo) as Promise<WalletWithdrawalRecord>;
  }

  async assignHotWallet(withdrawNo: string): Promise<WalletWithdrawalRecord> {
    const withdrawal = await withdrawalRepo.findByNo(withdrawNo);
    if (!withdrawal) throw new Error('WITHDRAWAL_NOT_FOUND');
    if (withdrawal.status !== WithdrawalStatus.approved) {
      throw new Error('WITHDRAWAL_NOT_APPROVED');
    }

    const hotWallets = await hotWalletRepo.listAvailableHotWallets({
      chainType: withdrawal.chainType,
      chainId: withdrawal.chainId,
      assetSymbol: withdrawal.assetSymbol,
      contractAddress: withdrawal.contractAddress ?? undefined,
    });

    if (hotWallets.length === 0) {
      throw new Error('NO_AVAILABLE_HOT_WALLET');
    }

    const selectedWallet = hotWallets[0];

    await hotWalletRepo.lockBalance({
      walletNo: selectedWallet.walletNo,
      amount: withdrawal.amount,
      bizType: 'withdrawal',
      bizNo: withdrawNo,
      lockNo: generateNo('HLK'),
    });

    return withdrawalRepo.assignHotWallet({
      withdrawNo,
      hotWalletNo: selectedWallet.walletNo,
      fromAddress: selectedWallet.address,
    });
  }

  async markSigned(params: {
    withdrawNo: string;
    rawTxRef?: string;
    signedTxHash?: string;
  }): Promise<WalletWithdrawalRecord> {
    return withdrawalRepo.markSigned(params);
  }

  async markBroadcasted(params: {
    withdrawNo: string;
    txHash: string;
    nonce?: bigint;
  }): Promise<WalletWithdrawalRecord> {
    const withdrawal = await withdrawalRepo.findByNo(params.withdrawNo);
    if (!withdrawal) throw new Error('WITHDRAWAL_NOT_FOUND');

    const result = await withdrawalRepo.markBroadcasted(params);

    await chainTransactionRepo.create({
      bizType: 'withdrawal',
      bizNo: params.withdrawNo,
      chainType: withdrawal.chainType,
      chainId: withdrawal.chainId,
      fromAddress: withdrawal.fromAddress ?? undefined,
      toAddress: withdrawal.toAddress,
      assetSymbol: withdrawal.assetSymbol,
      contractAddress: withdrawal.contractAddress ?? undefined,
      amount: withdrawal.amount,
    });

    return result;
  }

  async markConfirmed(withdrawNo: string): Promise<WalletWithdrawalRecord> {
    const withdrawal = await withdrawalRepo.findByNo(withdrawNo);
    if (!withdrawal) throw new Error('WITHDRAWAL_NOT_FOUND');

    await userAssetBalanceRepo.consumeFrozenForWithdraw({
      userId: withdrawal.userId,
      chainType: withdrawal.chainType,
      chainId: withdrawal.chainId,
      assetSymbol: withdrawal.assetSymbol,
      contractAddress: withdrawal.contractAddress ?? undefined,
      amount: withdrawal.amount,
      withdrawNo,
    });

    return withdrawalRepo.markConfirmed(withdrawNo);
  }

  async markFailed(withdrawNo: string, reason: string): Promise<WalletWithdrawalRecord> {
    const withdrawal = await withdrawalRepo.findByNo(withdrawNo);
    if (!withdrawal) throw new Error('WITHDRAWAL_NOT_FOUND');

    const result = await withdrawalRepo.markFailed(withdrawNo, reason);

    await userAssetBalanceRepo.releaseFrozenForWithdraw({
      userId: withdrawal.userId,
      chainType: withdrawal.chainType,
      chainId: withdrawal.chainId,
      assetSymbol: withdrawal.assetSymbol,
      contractAddress: withdrawal.contractAddress ?? undefined,
      amount: withdrawal.amount,
    });

    return result;
  }

  async getWithdrawal(withdrawNo: string) {
    return withdrawalRepo.findByNo(withdrawNo);
  }

  async listUserWithdrawals(params: {
    userId: string;
    chainType?: TransferChainType;
    chainId?: string;
    status?: WithdrawalStatus;
    page: number;
    pageSize: number;
  }) {
    return withdrawalRepo.paginate({
      userId: params.userId,
      chainType: params.chainType,
      chainId: params.chainId,
      status: params.status,
      page: params.page,
      pageSize: params.pageSize,
    });
  }
}

export const withdrawalService = new WithdrawalService();
