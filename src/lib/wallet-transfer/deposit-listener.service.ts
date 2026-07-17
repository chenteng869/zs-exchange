import { DepositStatus, LedgerBizType, TransferChainType, WalletDepositRecord } from '@prisma/client';
import { depositRepo } from './repos/deposit.repo';
import { depositAddressRepo } from './repos/deposit-address.repo';
import { userAssetBalanceRepo } from './repos/user-asset-balance.repo';
import { chainCursorRepo } from './repos/chain-cursor.repo';
import { chainTransactionRepo } from './repos/chain-transaction.repo';
import { ChainConfig } from './types';
import prisma from '@/lib/prisma';

export interface DetectedDeposit {
  chainType: TransferChainType;
  chainId: string;
  txHash: string;
  blockNumber: bigint;
  blockHash?: string;
  blockTime?: Date;
  logIndex?: number;
  fromAddress?: string;
  toAddress: string;
  assetSymbol: string;
  contractAddress?: string;
  amount: string;
  confirmations: number;
}

const DEFAULT_SCANNER = 'default';

export class DepositListenerService {
  private chainConfigs: Map<string, ChainConfig> = new Map();

  registerChain(config: ChainConfig) {
    const key = `${config.chainType}:${config.chainId}`;
    this.chainConfigs.set(key, config);
  }

  async handleDetectedDeposit(deposit: DetectedDeposit): Promise<WalletDepositRecord> {
    const addressRecord = await depositAddressRepo.findByChainAddress({
      chainType: deposit.chainType,
      chainId: deposit.chainId,
      address: deposit.toAddress,
    });

    if (!addressRecord) {
      return this.upsertUnknownDeposit(deposit);
    }

    const depositRecord = await depositRepo.upsertDetected({
      chainType: deposit.chainType,
      chainId: deposit.chainId,
      txHash: deposit.txHash,
      logIndex: deposit.logIndex,
      userId: addressRecord.userId,
      walletId: addressRecord.walletId ?? undefined,
      toAddress: deposit.toAddress,
      fromAddress: deposit.fromAddress,
      assetSymbol: deposit.assetSymbol,
      contractAddress: deposit.contractAddress,
      amount: deposit.amount,
      blockNumber: deposit.blockNumber,
      blockHash: deposit.blockHash,
      blockTime: deposit.blockTime,
      confirmations: deposit.confirmations,
      requiredConfirmations: 12,
      decimals: 18,
      detectedAt: new Date(),
    });

    return depositRecord;
  }

  private async upsertUnknownDeposit(deposit: DetectedDeposit): Promise<WalletDepositRecord> {
    return depositRepo.upsertDetected({
      chainType: deposit.chainType,
      chainId: deposit.chainId,
      txHash: deposit.txHash,
      logIndex: deposit.logIndex,
      userId: '00000000-0000-0000-0000-000000000000',
      toAddress: deposit.toAddress,
      fromAddress: deposit.fromAddress,
      assetSymbol: deposit.assetSymbol,
      contractAddress: deposit.contractAddress,
      amount: deposit.amount,
      blockNumber: deposit.blockNumber,
      blockHash: deposit.blockHash,
      blockTime: deposit.blockTime,
      confirmations: deposit.confirmations,
      requiredConfirmations: 12,
      decimals: 18,
      detectedAt: new Date(),
    });
  }

  async checkAndConfirmDeposits(params: {
    chainType: TransferChainType;
    chainId: string;
    getTxConfirmations: (txHash: string) => Promise<number>;
    requiredConfirmations?: number;
  }): Promise<{ confirmed: number; skipped: number }> {
    const requiredConf = params.requiredConfirmations ?? 12;
    const pendingDeposits = await depositRepo.listPendingConfirmation({
      chainType: params.chainType,
      chainId: params.chainId,
      limit: 100,
    });

    let confirmed = 0;
    let skipped = 0;

    for (const deposit of pendingDeposits) {
      try {
        const confirmations = await params.getTxConfirmations(deposit.txHash);

        if (confirmations >= requiredConf) {
          await depositRepo.markConfirming({
            depositNo: deposit.depositNo,
            confirmations,
          });
          await this.processConfirmedDeposit(deposit.depositNo, confirmations);
          confirmed++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Failed to check deposit ${deposit.depositNo}:`, error);
        skipped++;
      }
    }

    return { confirmed, skipped };
  }

  async processConfirmedDeposit(depositNo: string, confirmations: number): Promise<WalletDepositRecord> {
    const deposit = await depositRepo.findByDepositNo(depositNo);
    if (!deposit) throw new Error('DEPOSIT_NOT_FOUND');
    if (deposit.status === DepositStatus.credited) return deposit;

    await depositRepo.markConfirmed({
      depositNo,
      confirmations,
    });

    const zeroUuid = '00000000-0000-0000-0000-000000000000';
    if (deposit.userId && deposit.userId !== zeroUuid) {
      await userAssetBalanceRepo.increaseAvailable({
        userId: deposit.userId,
        walletId: deposit.walletId ?? undefined,
        chainType: deposit.chainType,
        chainId: deposit.chainId,
        assetSymbol: deposit.assetSymbol,
        contractAddress: deposit.contractAddress ?? undefined,
        amount: deposit.amount,
        bizType: LedgerBizType.deposit,
        bizNo: deposit.depositNo,
        remark: `Deposit confirmed: ${deposit.txHash}`,
      });
    }

    const credited = await depositRepo.markCredited(depositNo);

    await chainTransactionRepo.create({
      bizType: 'deposit',
      bizNo: depositNo,
      chainType: deposit.chainType,
      chainId: deposit.chainId,
      fromAddress: deposit.fromAddress ?? undefined,
      toAddress: deposit.toAddress,
      assetSymbol: deposit.assetSymbol,
      contractAddress: deposit.contractAddress ?? undefined,
      amount: deposit.amount,
    });

    return credited;
  }

  async getCursor(chainType: TransferChainType, chainId: string, scannerName: string = DEFAULT_SCANNER) {
    return chainCursorRepo.getOrCreate({
      chainType,
      chainId,
      scannerName,
    });
  }

  async updateCursor(
    chainType: TransferChainType,
    chainId: string,
    blockHeight: bigint,
    blockHash?: string,
    scannerName: string = DEFAULT_SCANNER,
  ) {
    return chainCursorRepo.updateCursor({
      chainType,
      chainId,
      scannerName,
      currentBlock: blockHeight,
      safeBlock: blockHeight,
    });
  }

  async markCursorError(
    chainType: TransferChainType,
    chainId: string,
    error: string,
    scannerName: string = DEFAULT_SCANNER,
  ) {
    return chainCursorRepo.markError({
      chainType,
      chainId,
      scannerName,
      errorMessage: error,
    });
  }

  async listUserDeposits(params: {
    userId: string;
    chainType?: TransferChainType;
    chainId?: string;
    status?: DepositStatus;
    page: number;
    pageSize: number;
  }): Promise<{ items: WalletDepositRecord[]; total: number; page: number; pageSize: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const where: any = { userId: params.userId };
    if (params.chainType) where.chainType = params.chainType;
    if (params.chainId) where.chainId = params.chainId;
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      prisma.walletDepositRecord.findMany({
        where,
        skip,
        take: params.pageSize,
        orderBy: { detectedAt: 'desc' },
      }),
      prisma.walletDepositRecord.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }
}

export const depositListenerService = new DepositListenerService();
