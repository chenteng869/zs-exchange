import { LedgerBizType, LedgerDirection, Prisma, WalletHotWalletLedger } from '@prisma/client';
import { BaseRepository } from './base-repo';
import { generateNo } from '../types';

export class HotWalletLedgerRepository extends BaseRepository {
  async create(data: {
    walletNo: string;
    chainType: any;
    chainId: string;
    assetSymbol: string;
    contractAddress?: string;
    direction: LedgerDirection;
    bizType: LedgerBizType;
    bizNo: string;
    amount: string | Prisma.Decimal;
    balanceBefore: string | Prisma.Decimal;
    balanceAfter: string | Prisma.Decimal;
    remark?: string;
  }): Promise<WalletHotWalletLedger> {
    const ledgerNo = generateNo('HWL');

    return this.prisma.walletHotWalletLedger.create({
      data: {
        ledgerNo,
        walletNo: data.walletNo,
        chainType: data.chainType,
        chainId: data.chainId,
        assetSymbol: data.assetSymbol,
        contractAddress: data.contractAddress ?? '',
        direction: data.direction,
        bizType: data.bizType,
        bizNo: data.bizNo,
        amount: data.amount,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        remark: data.remark,
      },
    });
  }

  async findByLedgerNo(ledgerNo: string): Promise<WalletHotWalletLedger | null> {
    return this.prisma.walletHotWalletLedger.findUnique({
      where: { ledgerNo },
    });
  }

  async findByBiz(bizType: LedgerBizType, bizNo: string): Promise<WalletHotWalletLedger | null> {
    return this.prisma.walletHotWalletLedger.findFirst({
      where: { bizType, bizNo },
    });
  }

  async listByWallet(params: {
    walletNo: string;
    assetSymbol?: string;
    bizType?: LedgerBizType;
    page: number;
    pageSize: number;
  }): Promise<{ items: WalletHotWalletLedger[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const where: Prisma.WalletHotWalletLedgerWhereInput = { walletNo: params.walletNo };
    if (params.assetSymbol) where.assetSymbol = params.assetSymbol;
    if (params.bizType) where.bizType = params.bizType;

    const [items, total] = await Promise.all([
      this.prisma.walletHotWalletLedger.findMany({
        where,
        skip,
        take: params.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletHotWalletLedger.count({ where }),
    ]);

    return { items, total };
  }

  async getWalletBalance(walletNo: string, assetSymbol: string, contractAddress?: string): Promise<{
    totalIn: Prisma.Decimal;
    totalOut: Prisma.Decimal;
    netBalance: Prisma.Decimal;
  }> {
    const [inRecords, outRecords] = await Promise.all([
      this.prisma.walletHotWalletLedger.findMany({
        where: {
          walletNo,
          assetSymbol,
          contractAddress: contractAddress ?? '',
          direction: LedgerDirection.in,
        },
        select: { amount: true },
      }),
      this.prisma.walletHotWalletLedger.findMany({
        where: {
          walletNo,
          assetSymbol,
          contractAddress: contractAddress ?? '',
          direction: LedgerDirection.out,
        },
        select: { amount: true },
      }),
    ]);

    const totalIn = inRecords.reduce((sum, r) => sum.add(r.amount), new Prisma.Decimal(0));
    const totalOut = outRecords.reduce((sum, r) => sum.add(r.amount), new Prisma.Decimal(0));

    return {
      totalIn,
      totalOut,
      netBalance: totalIn.sub(totalOut),
    };
  }
}

export const hotWalletLedgerRepo = new HotWalletLedgerRepository();
