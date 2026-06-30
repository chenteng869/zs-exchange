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
    const depositNo = searchParams.get('depositNo');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const chainType = searchParams.get('chainType');

    const where: any = {};
    if (depositNo) where.depositNo = { contains: depositNo };
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (chainType) where.chainType = chainType;

    const result = await prisma.walletDepositRecord.findMany({
      where,
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
      orderBy: { detectedAt: 'desc' },
    });

    const total = await prisma.walletDepositRecord.count({ where });

    return success({
      items: result,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
  });
}

async function GET_BY_ID(req: NextRequest, { params }: { params: { depositNo: string } }) {
  return withAdminAuth(req, async (ctx: AuthContext) => {
    const deposit = await prisma.walletDepositRecord.findUnique({
      where: { depositNo: params.depositNo },
    });

    if (!deposit) {
      return notFound('Deposit not found');
    }

    return success(deposit);
  });
}

async function POST_CREDIT_RETRY(req: NextRequest, { params }: { params: { depositNo: string } }) {
  return withAdminAuth(req, async (ctx: AuthContext) => {
    const deposit = await prisma.walletDepositRecord.findUnique({
      where: { depositNo: params.depositNo },
    });

    if (!deposit) {
      return notFound('Deposit not found');
    }

    if (deposit.status === 'credited') {
      return badRequest('Deposit has already been credited');
    }

    if (deposit.status !== 'confirmed') {
      return badRequest('Deposit is not confirmed yet');
    }

    await prisma.walletDepositRecord.update({
      where: { depositNo: params.depositNo },
      data: {
        status: 'credited',
        creditedAt: new Date(),
      },
    });

    await prisma.walletUserAssetBalance.upsert({
      where: {
        userId_chainType_chainId_assetSymbol_contractAddress: {
          userId: deposit.userId,
          chainType: deposit.chainType,
          chainId: deposit.chainId,
          assetSymbol: deposit.assetSymbol,
          contractAddress: deposit.contractAddress || '',
        },
      },
      create: {
        userId: deposit.userId,
        chainType: deposit.chainType,
        chainId: deposit.chainId,
        assetSymbol: deposit.assetSymbol,
        contractAddress: deposit.contractAddress,
        available: deposit.amount,
        frozen: 0,
        total: deposit.amount,
      },
      update: {
        available: { increment: deposit.amount },
        total: { increment: deposit.amount },
      },
    });

    await prisma.walletUserAssetLedger.create({
      data: {
        ledgerNo: `LG-${Date.now()}`,
        userId: deposit.userId,
        chainType: deposit.chainType,
        chainId: deposit.chainId,
        assetSymbol: deposit.assetSymbol,
        contractAddress: deposit.contractAddress,
        direction: 'in',
        bizType: 'deposit',
        bizNo: deposit.depositNo,
        amount: deposit.amount,
        balanceBefore: 0,
        balanceAfter: deposit.amount,
      },
    });

    return success({ message: 'Deposit credited successfully' });
  });
}
