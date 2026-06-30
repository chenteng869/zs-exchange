import { NextRequest } from 'next/server';
import { success, badRequest, notFound, forbidden } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { approvalNo: string } }) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const approval = await prisma.walletWithdrawalApproval.findUnique({
      where: { approvalNo: params.approvalNo },
      include: {
        withdrawal: true,
      },
    });

    if (!approval) {
      return notFound('Approval not found');
    }

    return success(approval);
  });
}

export async function POST(req: NextRequest, { params }: { params: { approvalNo: string } }) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const body = await req.json();
    const { decision, reason, ipAddress, userAgent } = body;

    if (!decision || !['approve', 'reject'].includes(decision)) {
      return badRequest('Invalid decision. Must be "approve" or "reject"');
    }

    const approval = await prisma.walletWithdrawalApproval.findUnique({
      where: { approvalNo: params.approvalNo },
      include: { withdrawal: true },
    });

    if (!approval) {
      return notFound('Approval not found');
    }

    if (approval.status !== 'pending') {
      return badRequest('Approval is no longer pending');
    }

    const existingDecision = await prisma.walletWithdrawalApprovalDecision.findUnique({
      where: { approvalNo_approverId: { approvalNo: params.approvalNo, approverId: ctx.userId } },
    });

    if (existingDecision) {
      return badRequest('You have already made a decision for this approval');
    }

    const approverRole = 'admin';

    await prisma.walletWithdrawalApprovalDecision.create({
      data: {
        approvalNo: params.approvalNo,
        withdrawNo: approval.withdrawNo,
        approverId: ctx.userId,
        approverRole,
        decision: decision.toUpperCase(),
        reason,
        ipAddress: ipAddress || '',
        userAgent: userAgent || '',
      },
    });

    const updatedApproval = await prisma.walletWithdrawalApproval.update({
      where: { approvalNo: params.approvalNo },
      data: {
        approvedCount: decision === 'approve' ? { increment: 1 } : undefined,
      },
    });

    let newStatus = updatedApproval.status;
    if (decision === 'reject') {
      newStatus = 'rejected';
    } else if (updatedApproval.approvedCount >= updatedApproval.requiredCount) {
      newStatus = 'approved';
    }

    await prisma.walletWithdrawalApproval.update({
      where: { approvalNo: params.approvalNo },
      data: { status: newStatus as any },
    });

    if (newStatus === 'approved') {
      await prisma.walletWithdrawalRecord.update({
        where: { withdrawNo: approval.withdrawNo },
        data: {
          status: 'approved',
          approvalStatus: 'approved',
          approvedAt: new Date(),
        },
      });
    } else if (newStatus === 'rejected') {
      await prisma.walletWithdrawalRecord.update({
        where: { withdrawNo: approval.withdrawNo },
        data: {
          status: 'rejected',
          approvalStatus: 'rejected',
        },
      });
    }

    return success({ message: `Approval ${decision}d successfully` });
  });
}