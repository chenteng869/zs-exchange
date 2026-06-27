import { Prisma, SweepTaskStatus, TransferChainType, WalletSweepTask } from '@prisma/client';
import { BaseRepository } from './base-repo';
import { generateNo } from '../types';

export class SweepTaskRepository extends BaseRepository {
  async create(data: {
    chainType: TransferChainType;
    chainId: string;
    fromAddress: string;
    toAddress: string;
    assetSymbol: string;
    contractAddress?: string;
    amount: string | Prisma.Decimal;
    feeAmount?: string | Prisma.Decimal;
  }): Promise<WalletSweepTask> {
    const sweepNo = generateNo('SWP');

    return this.prisma.walletSweepTask.create({
      data: {
        sweepNo,
        chainType: data.chainType,
        chainId: data.chainId,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
        assetSymbol: data.assetSymbol,
        contractAddress: data.contractAddress ?? '',
        amount: data.amount,
        feeAmount: data.feeAmount ?? '0',
        status: SweepTaskStatus.pending,
      },
    });
  }

  async findBySweepNo(sweepNo: string): Promise<WalletSweepTask | null> {
    return this.prisma.walletSweepTask.findUnique({
      where: { sweepNo },
    });
  }

  async listPending(params: {
    chainType?: TransferChainType;
    chainId?: string;
    limit?: number;
  }): Promise<WalletSweepTask[]> {
    return this.prisma.walletSweepTask.findMany({
      where: {
        chainType: params.chainType,
        chainId: params.chainId,
        status: SweepTaskStatus.pending,
      },
      orderBy: { createdAt: 'asc' },
      take: params.limit ?? 100,
    });
  }

  async updateStatus(sweepNo: string, status: SweepTaskStatus): Promise<WalletSweepTask> {
    return this.prisma.walletSweepTask.update({
      where: { sweepNo },
      data: { status },
    });
  }

  async markSigned(sweepNo: string, rawTxRef?: string): Promise<WalletSweepTask> {
    return this.prisma.walletSweepTask.update({
      where: { sweepNo },
      data: {
        status: SweepTaskStatus.signed,
        rawTxRef,
      },
    });
  }

  async markBroadcasted(params: {
    sweepNo: string;
    txHash: string;
  }): Promise<WalletSweepTask> {
    return this.prisma.walletSweepTask.update({
      where: { sweepNo: params.sweepNo },
      data: {
        status: SweepTaskStatus.broadcasted,
        txHash: params.txHash,
        broadcastAt: new Date(),
      },
    });
  }

  async markConfirmed(sweepNo: string): Promise<WalletSweepTask> {
    return this.prisma.walletSweepTask.update({
      where: { sweepNo },
      data: {
        status: SweepTaskStatus.confirmed,
        confirmedAt: new Date(),
      },
    });
  }

  async markFailed(sweepNo: string, reason: string): Promise<WalletSweepTask> {
    return this.prisma.walletSweepTask.update({
      where: { sweepNo },
      data: {
        status: SweepTaskStatus.failed,
        failureReason: reason.slice(0, 1024),
      },
    });
  }

  async listBroadcastedForConfirmation(limit = 100): Promise<WalletSweepTask[]> {
    return this.prisma.walletSweepTask.findMany({
      where: {
        status: {
          in: [
            SweepTaskStatus.broadcasting,
            SweepTaskStatus.broadcasted,
          ],
        },
        txHash: { not: null },
      },
      orderBy: { broadcastAt: 'asc' },
      take: limit,
    });
  }

  async listByAddress(params: {
    address: string;
    status?: SweepTaskStatus;
    limit?: number;
  }): Promise<WalletSweepTask[]> {
    return this.prisma.walletSweepTask.findMany({
      where: {
        OR: [
          { fromAddress: params.address },
          { toAddress: params.address },
        ],
        status: params.status,
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit ?? 50,
    });
  }
}

export const sweepTaskRepo = new SweepTaskRepository();
