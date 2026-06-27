import {
  HotWalletRole,
  HotWalletStatus,
  LedgerBizType,
  LedgerDirection,
  Prisma,
  TransferChainType,
  WalletHotWallet,
} from '@prisma/client';
import { hotWalletRepo } from './repos/hot-wallet.repo';
import { hotWalletLedgerRepo } from './repos/hot-wallet-ledger.repo';
import { hotWalletLockRepo } from './repos/hot-wallet-lock.repo';
import { sweepTaskRepo } from './repos/sweep-task.repo';
import { prisma } from './repos/base-repo';
import { generateNo } from './types';

export interface CreateHotWalletParams {
  chainType: TransferChainType;
  chainId: string;
  address: string;
  assetSymbol?: string;
  contractAddress?: string;
  walletRole: HotWalletRole;
  minBalance?: string;
  maxBalance?: string;
  sweepThreshold?: string;
  keyRef?: string;
  provider?: string;
}

export class HotWalletService {
  async createHotWallet(params: CreateHotWalletParams): Promise<WalletHotWallet> {
    return hotWalletRepo.create(params);
  }

  async getHotWallet(walletNo: string): Promise<WalletHotWallet | null> {
    return hotWalletRepo.findByWalletNo(walletNo);
  }

  async listHotWallets(params: {
    chainType?: TransferChainType;
    chainId?: string;
    walletRole?: HotWalletRole;
    status?: HotWalletStatus;
  }): Promise<WalletHotWallet[]> {
    if (params.walletRole && params.chainType && params.chainId) {
      return hotWalletRepo.listByRole({
        chainType: params.chainType,
        chainId: params.chainId,
        walletRole: params.walletRole,
        status: params.status,
      });
    }

    const where: Prisma.WalletHotWalletWhereInput = {};
    if (params.chainType) where.chainType = params.chainType;
    if (params.chainId) where.chainId = params.chainId;
    if (params.walletRole) where.walletRole = params.walletRole;
    if (params.status) where.status = params.status;

    return prisma.walletHotWallet.findMany({
      where,
      orderBy: { id: 'asc' },
    });
  }

  async updateBalance(params: {
    walletNo: string;
    balance: string;
    availableBalance?: string;
    lockedBalance?: string;
  }): Promise<WalletHotWallet> {
    const wallet = await hotWalletRepo.findByWalletNo(params.walletNo);
    if (!wallet) throw new Error('HOT_WALLET_NOT_FOUND');

    const beforeBalance = wallet.balance;

    const updated = await hotWalletRepo.updateBalance({
      walletNo: params.walletNo,
      balance: params.balance,
      availableBalance: params.availableBalance,
      lockedBalance: params.lockedBalance,
    });

    const diff = new Prisma.Decimal(params.balance).sub(beforeBalance);
    if (!diff.isZero()) {
      await hotWalletLedgerRepo.create({
        walletNo: params.walletNo,
        chainType: wallet.chainType,
        chainId: wallet.chainId,
        assetSymbol: wallet.assetSymbol ?? 'UNKNOWN',
        contractAddress: wallet.contractAddress ?? undefined,
        direction: diff.greaterThan(0) ? LedgerDirection.in : LedgerDirection.out,
        bizType: LedgerBizType.manual_adjust,
        bizNo: generateNo('BSY'),
        amount: diff.abs(),
        balanceBefore: beforeBalance,
        balanceAfter: params.balance,
        remark: 'Balance sync update',
      });
    }

    return updated;
  }

  async checkAndInitiateSweep(params: {
    walletNo: string;
    currentBalance: string;
  }): Promise<any | null> {
    const wallet = await hotWalletRepo.findByWalletNo(params.walletNo);
    if (!wallet) throw new Error('HOT_WALLET_NOT_FOUND');

    const balance = new Prisma.Decimal(params.currentBalance);
    const threshold = new Prisma.Decimal(wallet.sweepThreshold ?? '0');

    if (balance.lessThanOrEqualTo(threshold)) {
      return null;
    }

    const targetWallet = await hotWalletRepo.findSweepTarget({
      chainType: wallet.chainType,
      chainId: wallet.chainId,
      assetSymbol: wallet.assetSymbol,
      contractAddress: wallet.contractAddress ?? undefined,
    });

    if (!targetWallet || targetWallet.walletNo === wallet.walletNo) {
      return null;
    }

    const sweepAmount = balance.sub(threshold);

    const sweepTask = await sweepTaskRepo.create({
      chainType: wallet.chainType,
      chainId: wallet.chainId,
      fromAddress: wallet.address,
      toAddress: targetWallet.address,
      assetSymbol: wallet.assetSymbol ?? 'UNKNOWN',
      contractAddress: wallet.contractAddress ?? undefined,
      amount: sweepAmount.toString(),
    });

    return sweepTask;
  }

  async freezeWallet(walletNo: string): Promise<WalletHotWallet> {
    return hotWalletRepo.freeze(walletNo);
  }

  async unfreezeWallet(walletNo: string): Promise<WalletHotWallet> {
    return hotWalletRepo.unfreeze(walletNo);
  }

  async listWalletLedgers(params: {
    walletNo: string;
    assetSymbol?: string;
    bizType?: LedgerBizType;
    page: number;
    pageSize: number;
  }) {
    return hotWalletLedgerRepo.listByWallet(params);
  }

  async listWalletLocks(walletNo: string, status?: any) {
    return hotWalletLockRepo.listByWallet(walletNo, status);
  }

  async releaseExpiredLocks(): Promise<{ count: number }> {
    return hotWalletLockRepo.expireOld();
  }

  async getWalletStats(walletNo: string, assetSymbol: string, contractAddress?: string) {
    return hotWalletLedgerRepo.getWalletBalance(walletNo, assetSymbol, contractAddress);
  }
}

export const hotWalletService = new HotWalletService();
