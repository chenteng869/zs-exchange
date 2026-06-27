import { Prisma, ReconciliationStatus, TransferChainType, WalletReconciliationRecord } from '@prisma/client';
import { BaseRepository } from './base-repo';
import { generateNo } from '../types';

export class ReconciliationRepository extends BaseRepository {
  async create(data: {
    chainType: TransferChainType;
    chainId: string;
    bizType: string;
    bizNo: string;
    txHash?: string;
    assetSymbol: string;
    contractAddress?: string;
    systemAmount?: string | Prisma.Decimal;
    chainAmount?: string | Prisma.Decimal;
    difference?: string | Prisma.Decimal;
    reason?: string;
  }): Promise<WalletReconciliationRecord> {
    const reconcileNo = generateNo('REC');

    return this.prisma.walletReconciliationRecord.create({
      data: {
        reconcileNo,
        chainType: data.chainType,
        chainId: data.chainId,
        bizType: data.bizType,
        bizNo: data.bizNo,
        txHash: data.txHash,
        assetSymbol: data.assetSymbol,
        contractAddress: data.contractAddress,
        systemAmount: data.systemAmount,
        chainAmount: data.chainAmount,
        difference: data.difference,
        reason: data.reason,
        status: ReconciliationStatus.pending,
      },
    });
  }

  async findByReconcileNo(reconcileNo: string): Promise<WalletReconciliationRecord | null> {
    return this.prisma.walletReconciliationRecord.findUnique({
      where: { reconcileNo },
    });
  }

  async findByBiz(bizType: string, bizNo: string): Promise<WalletReconciliationRecord | null> {
    return this.prisma.walletReconciliationRecord.findFirst({
      where: { bizType, bizNo },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markMatched(reconcileNo: string): Promise<WalletReconciliationRecord> {
    return this.prisma.walletReconciliationRecord.update({
      where: { reconcileNo },
      data: {
        status: ReconciliationStatus.matched,
        checkedAt: new Date(),
      },
    });
  }

  async markMismatched(params: {
    reconcileNo: string;
    difference: string | Prisma.Decimal;
    reason: string;
  }): Promise<WalletReconciliationRecord> {
    return this.prisma.walletReconciliationRecord.update({
      where: { reconcileNo: params.reconcileNo },
      data: {
        status: ReconciliationStatus.mismatched,
        difference: params.difference,
        reason: params.reason.slice(0, 1024),
        checkedAt: new Date(),
      },
    });
  }

  async markResolved(params: {
    reconcileNo: string;
    reason: string;
  }): Promise<WalletReconciliationRecord> {
    return this.prisma.walletReconciliationRecord.update({
      where: { reconcileNo: params.reconcileNo },
      data: {
        status: ReconciliationStatus.resolved,
        reason: params.reason.slice(0, 1024),
        resolvedAt: new Date(),
      },
    });
  }

  async markIgnored(reconcileNo: string, reason: string): Promise<WalletReconciliationRecord> {
    return this.prisma.walletReconciliationRecord.update({
      where: { reconcileNo },
      data: {
        status: ReconciliationStatus.ignored,
        reason: reason.slice(0, 1024),
      },
    });
  }

  async listPending(params: {
    chainType?: TransferChainType;
    chainId?: string;
    bizType?: string;
    limit?: number;
  }): Promise<WalletReconciliationRecord[]> {
    const where: Prisma.WalletReconciliationRecordWhereInput = {
      status: ReconciliationStatus.pending,
    };
    if (params.chainType) where.chainType = params.chainType;
    if (params.chainId) where.chainId = params.chainId;
    if (params.bizType) where.bizType = params.bizType;

    return this.prisma.walletReconciliationRecord.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: params.limit ?? 100,
    });
  }

  async listMismatched(limit = 100): Promise<WalletReconciliationRecord[]> {
    return this.prisma.walletReconciliationRecord.findMany({
      where: { status: ReconciliationStatus.mismatched },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async paginate(params: {
    page: number;
    pageSize: number;
    chainType?: TransferChainType;
    status?: ReconciliationStatus;
    bizType?: string;
  }): Promise<{ items: WalletReconciliationRecord[]; total: number; page: number; pageSize: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const where: Prisma.WalletReconciliationRecordWhereInput = {};
    if (params.chainType) where.chainType = params.chainType;
    if (params.status) where.status = params.status;
    if (params.bizType) where.bizType = params.bizType;

    const [items, total] = await Promise.all([
      this.prisma.walletReconciliationRecord.findMany({
        where,
        skip,
        take: params.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletReconciliationRecord.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async getStats(params: {
    chainType?: TransferChainType;
    chainId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    total: number;
    matched: number;
    mismatched: number;
    resolved: number;
    pending: number;
  }> {
    const where: Prisma.WalletReconciliationRecordWhereInput = {};
    if (params.chainType) where.chainType = params.chainType;
    if (params.chainId) where.chainId = params.chainId;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [total, matched, mismatched, resolved, pending] = await Promise.all([
      this.prisma.walletReconciliationRecord.count({ where }),
      this.prisma.walletReconciliationRecord.count({
        where: { ...where, status: ReconciliationStatus.matched },
      }),
      this.prisma.walletReconciliationRecord.count({
        where: { ...where, status: ReconciliationStatus.mismatched },
      }),
      this.prisma.walletReconciliationRecord.count({
        where: { ...where, status: ReconciliationStatus.resolved },
      }),
      this.prisma.walletReconciliationRecord.count({
        where: { ...where, status: ReconciliationStatus.pending },
      }),
    ]);

    return { total, matched, mismatched, resolved, pending };
  }
}

export const reconciliationRepo = new ReconciliationRepository();
