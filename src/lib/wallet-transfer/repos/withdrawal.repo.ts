import { ApprovalStatus, Prisma, TransferChainType, WithdrawalStatus, WalletWithdrawalRecord } from '@prisma/client';
import { BaseRepository } from './base-repo';
import { generateNo, buildPagination, toPaginatedResult, PaginationParams, PaginatedResult } from '../types';

export class WithdrawalRepository extends BaseRepository {
  async create(data: {
    userId: string;
    walletId?: string;
    chainType: TransferChainType;
    chainId: string;
    toAddress: string;
    assetSymbol: string;
    contractAddress?: string;
    amount: string | Prisma.Decimal;
    feeAmount: string | Prisma.Decimal;
    netAmount: string | Prisma.Decimal;
    idempotencyKey?: string;
  }): Promise<WalletWithdrawalRecord> {
    const withdrawNo = generateNo('WIT');

    return this.prisma.walletWithdrawalRecord.create({
      data: {
        withdrawNo,
        idempotencyKey: data.idempotencyKey,
        userId: data.userId,
        walletId: data.walletId,
        chainType: data.chainType,
        chainId: data.chainId,
        toAddress: data.toAddress,
        assetSymbol: data.assetSymbol,
        contractAddress: data.contractAddress ?? '',
        amount: data.amount,
        feeAmount: data.feeAmount,
        netAmount: data.netAmount,
        status: WithdrawalStatus.created,
        requestedAt: new Date(),
      },
    });
  }

  async findByNo(withdrawNo: string): Promise<WalletWithdrawalRecord | null> {
    return this.prisma.walletWithdrawalRecord.findUnique({
      where: { withdrawNo },
      include: { approvals: true },
    });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<WalletWithdrawalRecord | null> {
    return this.prisma.walletWithdrawalRecord.findUnique({
      where: { idempotencyKey },
    });
  }

  async paginate(params: PaginationParams & {
    userId?: string;
    status?: WithdrawalStatus;
    chainType?: TransferChainType;
    chainId?: string;
  }): Promise<PaginatedResult<WalletWithdrawalRecord>> {
    const { skip, take, page, pageSize } = buildPagination(params);
    const where: Prisma.WalletWithdrawalRecordWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.status) where.status = params.status;
    if (params.chainType) where.chainType = params.chainType;
    if (params.chainId) where.chainId = params.chainId;

    const [items, total] = await Promise.all([
      this.prisma.walletWithdrawalRecord.findMany({
        where,
        skip,
        take,
        orderBy: { requestedAt: 'desc' },
      }),
      this.prisma.walletWithdrawalRecord.count({ where }),
    ]);

    return toPaginatedResult(items, total, page, pageSize);
  }

  async updateStatus(withdrawNo: string, status: WithdrawalStatus): Promise<WalletWithdrawalRecord> {
    return this.prisma.walletWithdrawalRecord.update({
      where: { withdrawNo },
      data: { status },
    });
  }

  async updateRisk(params: {
    withdrawNo: string;
    riskScore: number;
    riskLevel: string;
  }): Promise<WalletWithdrawalRecord> {
    return this.prisma.walletWithdrawalRecord.update({
      where: { withdrawNo: params.withdrawNo },
      data: {
        riskScore: params.riskScore,
        riskLevel: params.riskLevel,
      },
    });
  }

  async markWaitingApproval(params: {
    withdrawNo: string;
    approvalNo: string;
  }): Promise<WalletWithdrawalRecord> {
    return this.prisma.walletWithdrawalRecord.update({
      where: { withdrawNo: params.withdrawNo },
      data: {
        status: WithdrawalStatus.waiting_approval,
        approvalNo: params.approvalNo,
        approvalStatus: ApprovalStatus.pending,
      },
    });
  }

  async markApproved(withdrawNo: string): Promise<WalletWithdrawalRecord> {
    return this.prisma.walletWithdrawalRecord.update({
      where: { withdrawNo },
      data: {
        status: WithdrawalStatus.approved,
        approvalStatus: ApprovalStatus.approved,
        approvedAt: new Date(),
      },
    });
  }

  async assignHotWallet(params: {
    withdrawNo: string;
    hotWalletNo: string;
    fromAddress: string;
  }): Promise<WalletWithdrawalRecord> {
    return this.prisma.walletWithdrawalRecord.update({
      where: { withdrawNo: params.withdrawNo },
      data: {
        hotWalletNo: params.hotWalletNo,
        fromAddress: params.fromAddress,
      },
    });
  }

  async markSigned(params: {
    withdrawNo: string;
    rawTxRef?: string;
    signedTxHash?: string;
  }): Promise<WalletWithdrawalRecord> {
    return this.prisma.walletWithdrawalRecord.update({
      where: { withdrawNo: params.withdrawNo },
      data: {
        status: WithdrawalStatus.signed,
        rawTxRef: params.rawTxRef,
        signedTxHash: params.signedTxHash,
        signedAt: new Date(),
      },
    });
  }

  async markBroadcasted(params: {
    withdrawNo: string;
    txHash: string;
    nonce?: bigint;
  }): Promise<WalletWithdrawalRecord> {
    return this.prisma.walletWithdrawalRecord.update({
      where: { withdrawNo: params.withdrawNo },
      data: {
        status: WithdrawalStatus.broadcasted,
        txHash: params.txHash,
        nonce: params.nonce,
        broadcastAt: new Date(),
      },
    });
  }

  async markConfirmed(withdrawNo: string): Promise<WalletWithdrawalRecord> {
    return this.prisma.walletWithdrawalRecord.update({
      where: { withdrawNo },
      data: {
        status: WithdrawalStatus.confirmed,
        confirmedAt: new Date(),
      },
    });
  }

  async markFailed(withdrawNo: string, reason: string): Promise<WalletWithdrawalRecord> {
    return this.prisma.walletWithdrawalRecord.update({
      where: { withdrawNo },
      data: {
        status: WithdrawalStatus.failed,
        failureReason: reason.slice(0, 1024),
        failedAt: new Date(),
      },
    });
  }

  async markRejected(withdrawNo: string, reason: string): Promise<WalletWithdrawalRecord> {
    return this.prisma.walletWithdrawalRecord.update({
      where: { withdrawNo },
      data: {
        status: WithdrawalStatus.rejected,
        failureReason: reason.slice(0, 1024),
      },
    });
  }

  async markCanceled(withdrawNo: string): Promise<WalletWithdrawalRecord> {
    return this.prisma.walletWithdrawalRecord.update({
      where: { withdrawNo },
      data: {
        status: WithdrawalStatus.canceled,
        canceledAt: new Date(),
      },
    });
  }

  async listBroadcastedForConfirmation(limit = 100): Promise<WalletWithdrawalRecord[]> {
    return this.prisma.walletWithdrawalRecord.findMany({
      where: {
        status: {
          in: [
            WithdrawalStatus.broadcasted,
            WithdrawalStatus.confirming,
          ],
        },
        txHash: { not: null },
      },
      orderBy: { broadcastAt: 'asc' },
      take: limit,
    });
  }

  async listPendingApproval(limit = 100): Promise<WalletWithdrawalRecord[]> {
    return this.prisma.walletWithdrawalRecord.findMany({
      where: { status: WithdrawalStatus.waiting_approval },
      orderBy: { requestedAt: 'asc' },
      take: limit,
    });
  }
}

export const withdrawalRepo = new WithdrawalRepository();
