import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const pageSize = Math.min(100, parseInt(params.get('pageSize') || '50'));
    const status = params.get('status') || '';

    const where: any = {};
    if (status) where.status = status;

    const [accounts, total] = await Promise.all([
      prisma.perpAccount.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          accountType: true,
          asset: true,
          balance: true,
          availableBalance: true,
          frozenBalance: true,
          marginBalance: true,
          unrealizedPnl: true,
          realizedPnl: true,
          riskRate: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.perpAccount.count({ where }),
    ]);

    const items = accounts.map((a) => {
      const riskRate = parseFloat(a.riskRate.toString()) * 100;
      const healthScore = Math.max(0, Math.min(100, 100 - riskRate));
      const statusMap: Record<string, string> = {
        healthy: 'healthy',
        caution: 'caution',
        danger: 'danger',
        liquidated: 'liquidated',
      };
      const derivedStatus =
        healthScore > 80 ? 'healthy' :
        healthScore > 60 ? 'caution' :
        healthScore > 30 ? 'danger' : 'liquidated';

      return {
        id: a.id,
        userId: a.userId,
        nickname: a.userId.slice(0, 8),
        totalAssets: parseFloat(a.balance.toString()),
        borrowedAmount: parseFloat(a.marginBalance.toString()),
        healthScore: parseFloat(healthScore.toFixed(1)),
        liquidationPrice: 0,
        interestRate: 0,
        dailyInterest: 0,
        leverageLevel: a.marginBalance.toNumber() > 0
          ? parseFloat((a.balance.toNumber() / a.availableBalance.toNumber()).toFixed(1)) || 1
          : 1,
        collateralValue: parseFloat(a.balance.toString()),
        status: derivedStatus,
        openSince: a.createdAt.toISOString().slice(0, 10),
      };
    });

    return success({ items, total, page, pageSize });
  });
}
