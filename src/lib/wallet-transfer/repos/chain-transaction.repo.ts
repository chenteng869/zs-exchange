import { ChainTxStatus, Prisma, TransferChainType, WalletChainTransaction } from '@prisma/client';
import { BaseRepository } from './base-repo';
import { generateNo } from '../types';

export class ChainTransactionRepository extends BaseRepository {
  async create(data: {
    bizType: string;
    bizNo: string;
    chainType: TransferChainType;
    chainId: string;
    fromAddress?: string;
    toAddress?: string;
    assetSymbol?: string;
    contractAddress?: string;
    amount?: string | Prisma.Decimal;
  }): Promise<WalletChainTransaction> {
    const chainTxNo = generateNo('CTX');

    return this.prisma.walletChainTransaction.create({
      data: {
        chainTxNo,
        bizType: data.bizType,
        bizNo: data.bizNo,
        chainType: data.chainType,
        chainId: data.chainId,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
        assetSymbol: data.assetSymbol,
        contractAddress: data.contractAddress,
        amount: data.amount,
        status: ChainTxStatus.created,
      },
    });
  }

  async findByChainTxNo(chainTxNo: string): Promise<WalletChainTransaction | null> {
    return this.prisma.walletChainTransaction.findUnique({
      where: { chainTxNo },
    });
  }

  async findByBiz(bizType: string, bizNo: string): Promise<WalletChainTransaction | null> {
    return this.prisma.walletChainTransaction.findUnique({
      where: {
        bizType_bizNo: {
          bizType,
          bizNo,
        },
      },
    });
  }

  async markSigned(params: {
    chainTxNo: string;
    signedTxHash?: string;
    rawTxRef?: string;
  }): Promise<WalletChainTransaction> {
    return this.prisma.walletChainTransaction.update({
      where: { chainTxNo: params.chainTxNo },
      data: {
        status: ChainTxStatus.signed,
        signedTxHash: params.signedTxHash,
        rawTxRef: params.rawTxRef,
      },
    });
  }

  async markBroadcasted(params: {
    chainTxNo: string;
    txHash: string;
    nonce?: bigint;
  }): Promise<WalletChainTransaction> {
    return this.prisma.walletChainTransaction.update({
      where: { chainTxNo: params.chainTxNo },
      data: {
        status: ChainTxStatus.broadcasted,
        txHash: params.txHash,
        nonce: params.nonce,
        broadcastAt: new Date(),
      },
    });
  }

  async markConfirmed(params: {
    chainTxNo: string;
    blockNumber?: bigint;
    confirmations?: number;
  }): Promise<WalletChainTransaction> {
    return this.prisma.walletChainTransaction.update({
      where: { chainTxNo: params.chainTxNo },
      data: {
        status: ChainTxStatus.confirmed,
        blockNumber: params.blockNumber,
        confirmations: params.confirmations ?? 1,
        confirmedAt: new Date(),
      },
    });
  }

  async markFailed(chainTxNo: string, reason: string): Promise<WalletChainTransaction> {
    return this.prisma.walletChainTransaction.update({
      where: { chainTxNo },
      data: {
        status: ChainTxStatus.failed,
        failureReason: reason.slice(0, 1024),
      },
    });
  }

  async markDropped(chainTxNo: string): Promise<WalletChainTransaction> {
    return this.prisma.walletChainTransaction.update({
      where: { chainTxNo },
      data: { status: ChainTxStatus.dropped },
    });
  }

  async markReplaced(params: {
    chainTxNo: string;
    replacementTxHash: string;
  }): Promise<WalletChainTransaction> {
    return this.prisma.walletChainTransaction.update({
      where: { chainTxNo: params.chainTxNo },
      data: {
        status: ChainTxStatus.replaced,
        txHash: params.replacementTxHash,
      },
    });
  }

  async listPendingBroadcast(limit = 100): Promise<WalletChainTransaction[]> {
    return this.prisma.walletChainTransaction.findMany({
      where: {
        status: {
          in: [
            ChainTxStatus.created,
            ChainTxStatus.signed,
          ],
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async listBroadcastedForConfirmation(limit = 100): Promise<WalletChainTransaction[]> {
    return this.prisma.walletChainTransaction.findMany({
      where: {
        status: ChainTxStatus.broadcasted,
        txHash: { not: null },
      },
      orderBy: { broadcastAt: 'asc' },
      take: limit,
    });
  }

  async listByAddress(params: {
    address: string;
    chainType?: TransferChainType;
    chainId?: string;
    status?: ChainTxStatus;
    limit?: number;
  }): Promise<WalletChainTransaction[]> {
    const where: Prisma.WalletChainTransactionWhereInput = {
      OR: [
        { fromAddress: params.address },
        { toAddress: params.address },
      ],
    };
    if (params.chainType) where.chainType = params.chainType;
    if (params.chainId) where.chainId = params.chainId;
    if (params.status) where.status = params.status;

    return this.prisma.walletChainTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params.limit ?? 50,
    });
  }
}

export const chainTransactionRepo = new ChainTransactionRepository();
