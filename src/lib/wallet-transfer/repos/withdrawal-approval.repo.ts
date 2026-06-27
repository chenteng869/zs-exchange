import { ApprovalStatus, WalletWithdrawalApproval, WalletWithdrawalApprovalDecision } from '@prisma/client';
import { BaseRepository } from './base-repo';
import { generateNo } from '../types';

export class WithdrawalApprovalRepository extends BaseRepository {
  async create(data: {
    withdrawNo: string;
    userId: string;
    walletId?: string;
    orgId?: string;
    requiredCount: number;
    approverRoles?: string[];
    expiresAt: Date;
    reason?: string;
  }): Promise<WalletWithdrawalApproval> {
    const approvalNo = generateNo('APR');

    return this.prisma.walletWithdrawalApproval.create({
      data: {
        approvalNo,
        withdrawNo: data.withdrawNo,
        userId: data.userId,
        walletId: data.walletId,
        orgId: data.orgId,
        requiredCount: data.requiredCount,
        approvedCount: 0,
        approverRoles: data.approverRoles ?? [],
        status: ApprovalStatus.pending,
        expiresAt: data.expiresAt,
        reason: data.reason,
      },
    });
  }

  async findByApprovalNo(approvalNo: string): Promise<WalletWithdrawalApproval | null> {
    return this.prisma.walletWithdrawalApproval.findUnique({
      where: { approvalNo },
    });
  }

  async approve(data: {
    approvalNo: string;
    withdrawNo: string;
    approverId: string;
    approverRole: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<WalletWithdrawalApproval> {
    await this.prisma.walletWithdrawalApprovalDecision.create({
      data: {
        approvalNo: data.approvalNo,
        withdrawNo: data.withdrawNo,
        approverId: data.approverId,
        approverRole: data.approverRole,
        decision: 'approve',
        reason: data.reason,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    const approval = await this.prisma.walletWithdrawalApproval.update({
      where: { approvalNo: data.approvalNo },
      data: {
        approvedCount: { increment: 1 },
      },
    });

    if (approval.approvedCount + 1 >= approval.requiredCount) {
      return this.prisma.walletWithdrawalApproval.update({
        where: { approvalNo: data.approvalNo },
        data: {
          status: ApprovalStatus.approved,
          approvedAt: new Date(),
        },
      });
    }

    return approval;
  }

  async reject(data: {
    approvalNo: string;
    withdrawNo: string;
    approverId: string;
    approverRole: string;
    reason?: string;
  }): Promise<WalletWithdrawalApproval> {
    await this.prisma.walletWithdrawalApprovalDecision.create({
      data: {
        approvalNo: data.approvalNo,
        withdrawNo: data.withdrawNo,
        approverId: data.approverId,
        approverRole: data.approverRole,
        decision: 'reject',
        reason: data.reason,
      },
    });

    return this.prisma.walletWithdrawalApproval.update({
      where: { approvalNo: data.approvalNo },
      data: {
        status: ApprovalStatus.rejected,
        rejectedAt: new Date(),
        reason: data.reason,
      },
    });
  }

  async listPending(params: {
    orgId?: string;
    userId?: string;
    limit?: number;
  }): Promise<WalletWithdrawalApproval[]> {
    return this.prisma.walletWithdrawalApproval.findMany({
      where: {
        orgId: params.orgId,
        userId: params.userId,
        status: ApprovalStatus.pending,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'asc' },
      take: params.limit ?? 100,
    });
  }

  async expireOld(now = new Date()): Promise<{ count: number }> {
    const result = await this.prisma.walletWithdrawalApproval.updateMany({
      where: {
        status: ApprovalStatus.pending,
        expiresAt: { lt: now },
      },
      data: {
        status: ApprovalStatus.expired,
      },
    });

    return { count: result.count };
  }

  async findDecisions(approvalNo: string): Promise<WalletWithdrawalApprovalDecision[]> {
    return this.prisma.walletWithdrawalApprovalDecision.findMany({
      where: { approvalNo },
      orderBy: { createdAt: 'asc' },
    });
  }
}

export const withdrawalApprovalRepo = new WithdrawalApprovalRepository();
