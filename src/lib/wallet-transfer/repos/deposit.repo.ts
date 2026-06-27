import { DepositStatus, Prisma, TransferChainType, WalletDepositRecord } from '@prisma/client';
import { BaseRepository } from './base-repo';
import { generateNo } from '../types';

export class DepositRepository extends BaseRepository {
  async upsertDetected(data: {
    userId: string;
    walletId?: string;
    chainType: TransferChainType;
    chainId: string;
    txHash: string;
    logIndex?: number;
    instructionIndex?: number;
    innerInstructionIndex?: number;
    fromAddress?: string;
    toAddress: string;
    assetSymbol: string;
    contractAddress?: string;
    tokenAccount?: string;
    amount: string | Prisma.Decimal;
    amountRaw?: string;
    decimals: number;
    blockNumber: bigint | number;
    blockHash?: string;
    blockTime?: Date;
    requiredConfirmations: number;
    confirmations?: number;
    detectedAt: Date;
  }): Promise<WalletDepositRecord> {
    const depositNo = generateNo('DEP');

    return this.prisma.walletDepositRecord.upsert({
      where: {
        chainType_chainId_txHash_logIndex: {
          chainType: data.chainType,
          chainId: data.chainId,
          txHash: data.txHash,
          logIndex: data.logIndex ?? 0,
        },
      },
      create: {
        depositNo,
        userId: data.userId,
        walletId: data.walletId,
        chainType: data.chainType,
        chainId: data.chainId,
        txHash: data.txHash,
        logIndex: data.logIndex ?? 0,
        instructionIndex: data.instructionIndex,
        innerInstructionIndex: data.innerInstructionIndex,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
        assetSymbol: data.assetSymbol,
        contractAddress: data.contractAddress,
        tokenAccount: data.tokenAccount,
        amount: data.amount,
        amountRaw: data.amountRaw,
        decimals: data.decimals,
        blockNumber: BigInt(data.blockNumber),
        blockHash: data.blockHash,
        blockTime: data.blockTime,
        requiredConfirmations: data.requiredConfirmations,
        confirmations: data.confirmations ?? 0,
        status: DepositStatus.detected,
        detectedAt: data.detectedAt,
      },
      update: {
        blockNumber: BigInt(data.blockNumber),
        blockHash: data.blockHash,
        blockTime: data.blockTime,
      },
    });
  }

  async findByDepositNo(depositNo: string): Promise<WalletDepositRecord | null> {
    return this.prisma.walletDepositRecord.findUnique({
      where: { depositNo },
    });
  }

  async listPendingConfirmation(params: {
    chainType?: TransferChainType;
    chainId?: string;
    limit?: number;
  }): Promise<WalletDepositRecord[]> {
    return this.prisma.walletDepositRecord.findMany({
      where: {
        chainType: params.chainType,
        chainId: params.chainId,
        status: {
          in: [
            DepositStatus.detected,
            DepositStatus.confirming,
          ],
        },
      },
      orderBy: { blockNumber: 'asc' },
      take: params.limit ?? 200,
    });
  }

  async markConfirming(params: {
    depositNo: string;
    confirmations: number;
  }): Promise<WalletDepositRecord> {
    return this.prisma.walletDepositRecord.update({
      where: { depositNo: params.depositNo },
      data: {
        status: DepositStatus.confirming,
        confirmations: params.confirmations,
      },
    });
  }

  async markConfirmed(params: {
    depositNo: string;
    confirmations: number;
  }): Promise<WalletDepositRecord> {
    return this.prisma.walletDepositRecord.update({
      where: { depositNo: params.depositNo },
      data: {
        status: DepositStatus.confirmed,
        confirmations: params.confirmations,
        confirmedAt: new Date(),
      },
    });
  }

  async listConfirmable(limit = 100): Promise<WalletDepositRecord[]> {
    return this.prisma.walletDepositRecord.findMany({
      where: {
        status: DepositStatus.confirmed,
        creditedAt: null,
      },
      orderBy: { confirmedAt: 'asc' },
      take: limit,
    });
  }

  async markCredited(depositNo: string): Promise<WalletDepositRecord> {
    return this.prisma.walletDepositRecord.update({
      where: { depositNo },
      data: {
        status: DepositStatus.credited,
        creditedAt: new Date(),
      },
    });
  }

  async markFailed(depositNo: string, reason: string): Promise<WalletDepositRecord> {
    return this.prisma.walletDepositRecord.update({
      where: { depositNo },
      data: {
        status: DepositStatus.failed,
        failureReason: reason.slice(0, 1024),
      },
    });
  }

  async markIgnored(depositNo: string, reason: string): Promise<WalletDepositRecord> {
    return this.prisma.walletDepositRecord.update({
      where: { depositNo },
      data: {
        status: DepositStatus.ignored,
        failureReason: reason.slice(0, 1024),
        ignoredAt: new Date(),
      },
    });
  }
}

export const depositRepo = new DepositRepository();
