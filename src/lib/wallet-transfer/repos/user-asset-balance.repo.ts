import { LedgerBizType, LedgerDirection, Prisma, TransferChainType, WalletUserAssetBalance, WalletUserAssetLedger } from '@prisma/client';
import { BaseRepository } from './base-repo';
import { generateNo } from '../types';

export class UserAssetBalanceRepository extends BaseRepository {
  async increaseAvailable(params: {
    userId: string;
    walletId?: string;
    chainType: TransferChainType;
    chainId: string;
    assetSymbol: string;
    contractAddress?: string;
    amount: string | Prisma.Decimal;
    bizType: LedgerBizType;
    bizNo: string;
    remark?: string;
  }): Promise<WalletUserAssetBalance> {
    const current = await this.prisma.walletUserAssetBalance.upsert({
      where: {
        userId_chainType_chainId_assetSymbol_contractAddress: {
          userId: params.userId,
          chainType: params.chainType,
          chainId: params.chainId,
          assetSymbol: params.assetSymbol,
          contractAddress: params.contractAddress ?? '',
        },
      },
      create: {
        userId: params.userId,
        walletId: params.walletId,
        chainType: params.chainType,
        chainId: params.chainId,
        assetSymbol: params.assetSymbol,
        contractAddress: params.contractAddress ?? '',
        available: '0',
        frozen: '0',
        total: '0',
      },
      update: {},
    });

    const amount = new Prisma.Decimal(params.amount);
    const before = current.available;
    const after = before.add(amount);

    const updated = await this.prisma.walletUserAssetBalance.update({
      where: { id: current.id },
      data: {
        available: { increment: amount },
        total: { increment: amount },
      },
    });

    await this.prisma.walletUserAssetLedger.create({
      data: {
        ledgerNo: generateNo('LED'),
        userId: params.userId,
        walletId: params.walletId,
        chainType: params.chainType,
        chainId: params.chainId,
        assetSymbol: params.assetSymbol,
        contractAddress: params.contractAddress ?? '',
        direction: LedgerDirection.in,
        bizType: params.bizType,
        bizNo: params.bizNo,
        amount,
        balanceBefore: before,
        balanceAfter: after,
        remark: params.remark,
      },
    });

    return updated;
  }

  async getBalance(params: {
    userId: string;
    chainType: TransferChainType;
    chainId: string;
    assetSymbol: string;
    contractAddress?: string;
  }): Promise<WalletUserAssetBalance | null> {
    return this.prisma.walletUserAssetBalance.findUnique({
      where: {
        userId_chainType_chainId_assetSymbol_contractAddress: {
          userId: params.userId,
          chainType: params.chainType,
          chainId: params.chainId,
          assetSymbol: params.assetSymbol,
          contractAddress: params.contractAddress ?? '',
        },
      },
    });
  }

  async freezeForWithdraw(params: {
    userId: string;
    chainType: TransferChainType;
    chainId: string;
    assetSymbol: string;
    contractAddress?: string;
    amount: string | Prisma.Decimal;
  }): Promise<WalletUserAssetBalance> {
    const balance = await this.prisma.walletUserAssetBalance.findUnique({
      where: {
        userId_chainType_chainId_assetSymbol_contractAddress: {
          userId: params.userId,
          chainType: params.chainType,
          chainId: params.chainId,
          assetSymbol: params.assetSymbol,
          contractAddress: params.contractAddress ?? '',
        },
      },
    });

    if (!balance) throw new Error('USER_BALANCE_NOT_FOUND');

    const amount = new Prisma.Decimal(params.amount);

    if (balance.available.lessThan(amount)) {
      throw new Error('USER_BALANCE_INSUFFICIENT');
    }

    return this.prisma.walletUserAssetBalance.update({
      where: { id: balance.id },
      data: {
        available: { decrement: amount },
        frozen: { increment: amount },
      },
    });
  }

  async consumeFrozenForWithdraw(params: {
    userId: string;
    chainType: TransferChainType;
    chainId: string;
    assetSymbol: string;
    contractAddress?: string;
    amount: string | Prisma.Decimal;
    withdrawNo: string;
  }): Promise<WalletUserAssetBalance> {
    const balance = await this.prisma.walletUserAssetBalance.findUnique({
      where: {
        userId_chainType_chainId_assetSymbol_contractAddress: {
          userId: params.userId,
          chainType: params.chainType,
          chainId: params.chainId,
          assetSymbol: params.assetSymbol,
          contractAddress: params.contractAddress ?? '',
        },
      },
    });

    if (!balance) throw new Error('USER_BALANCE_NOT_FOUND');

    const amount = new Prisma.Decimal(params.amount);

    if (balance.frozen.lessThan(amount)) {
      throw new Error('USER_FROZEN_BALANCE_INSUFFICIENT');
    }

    return this.prisma.walletUserAssetBalance.update({
      where: { id: balance.id },
      data: {
        frozen: { decrement: amount },
        total: { decrement: amount },
      },
    });
  }

  async releaseFrozenForWithdraw(params: {
    userId: string;
    chainType: TransferChainType;
    chainId: string;
    assetSymbol: string;
    contractAddress?: string;
    amount: string | Prisma.Decimal;
  }): Promise<WalletUserAssetBalance> {
    const amount = new Prisma.Decimal(params.amount);

    return this.prisma.walletUserAssetBalance.update({
      where: {
        userId_chainType_chainId_assetSymbol_contractAddress: {
          userId: params.userId,
          chainType: params.chainType,
          chainId: params.chainId,
          assetSymbol: params.assetSymbol,
          contractAddress: params.contractAddress ?? '',
        },
      },
      data: {
        frozen: { decrement: amount },
        available: { increment: amount },
      },
    });
  }

  async listLedgers(params: {
    userId: string;
    assetSymbol?: string;
    bizType?: LedgerBizType;
    page: number;
    pageSize: number;
  }): Promise<{ items: WalletUserAssetLedger[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const where: Prisma.WalletUserAssetLedgerWhereInput = { userId: params.userId };
    if (params.assetSymbol) where.assetSymbol = params.assetSymbol;
    if (params.bizType) where.bizType = params.bizType;

    const [items, total] = await Promise.all([
      this.prisma.walletUserAssetLedger.findMany({
        where,
        skip,
        take: params.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletUserAssetLedger.count({ where }),
    ]);

    return { items, total };
  }
}

export const userAssetBalanceRepo = new UserAssetBalanceRepository();
