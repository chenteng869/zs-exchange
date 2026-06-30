import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { AuthContext } from '@/lib/api/auth';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';
import { parsePagination } from '@/lib/api/pagination';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async (ctx: AuthContext) => {
    const searchParams = req.nextUrl.searchParams;
    const pagination = parsePagination(searchParams);
    const withdrawNo = searchParams.get('withdrawNo');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const riskLevel = searchParams.get('riskLevel');
    const chainType = searchParams.get('chainType');

    const where: any = {};
    if (withdrawNo) where.withdrawNo = { contains: withdrawNo };
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (riskLevel) where.riskLevel = riskLevel;
    if (chainType) where.chainType = chainType;

    const result = await prisma.walletWithdrawalRecord.findMany({
      where,
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
      orderBy: { requestedAt: 'desc' },
      include: {
        approvals: true,
      },
    });

    const total = await prisma.walletWithdrawalRecord.count({ where });

    return success({
      items: result,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
  });
}

async function GET_BY_ID(req: NextRequest, { params }: { params: { withdrawNo: string } }) {
  return withAdminAuth(req, async (ctx: AuthContext) => {
    const withdrawal = await prisma.walletWithdrawalRecord.findUnique({
      where: { withdrawNo: params.withdrawNo },
      include: {
        approvals: true,
      },
    });

    if (!withdrawal) {
      return notFound('Withdrawal not found');
    }

    return success(withdrawal);
  });
}

async function POST_CANCEL(req: NextRequest, { params }: { params: { withdrawNo: string } }) {
  return withAdminAuth(req, async (ctx: AuthContext) => {
    const body = await req.json();
    const { reason } = body;

    const withdrawal = await prisma.walletWithdrawalRecord.findUnique({
      where: { withdrawNo: params.withdrawNo },
    });

    if (!withdrawal) {
      return notFound('Withdrawal not found');
    }

    if (withdrawal.status === 'confirmed') {
      return badRequest('Cannot cancel confirmed withdrawal');
    }

    if (withdrawal.status === 'broadcasting' || withdrawal.status === 'broadcasted') {
      return badRequest('Cannot cancel withdrawal that is being broadcasted');
    }

    await prisma.walletWithdrawalRecord.update({
      where: { withdrawNo: params.withdrawNo },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
        failureReason: reason || 'Admin canceled',
      },
    });

    if (withdrawal.status === 'approved') {
      await prisma.walletHotWalletLock.updateMany({
        where: { bizNo: params.withdrawNo, status: 'locked' },
        data: { status: 'released', releasedAt: new Date() },
      });
    }

    if (withdrawal.status === 'approved') {
      await prisma.walletUserAssetBalance.upsert({
        where: {
          userId_chainType_chainId_assetSymbol_contractAddress: {
            userId: withdrawal.userId,
            chainType: withdrawal.chainType,
            chainId: withdrawal.chainId,
            assetSymbol: withdrawal.assetSymbol,
            contractAddress: withdrawal.contractAddress || '',
          },
        },
        create: {
          userId: withdrawal.userId,
          chainType: withdrawal.chainType,
          chainId: withdrawal.chainId,
          assetSymbol: withdrawal.assetSymbol,
          contractAddress: withdrawal.contractAddress,
          available: withdrawal.amount,
          frozen: 0,
          total: withdrawal.amount,
        },
        update: {
          available: { increment: withdrawal.amount },
        },
      });
    }

    return success({ message: 'Withdrawal canceled successfully' });
  });
}
