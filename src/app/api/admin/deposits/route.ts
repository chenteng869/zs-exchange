import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const pageSize = Math.min(100, parseInt(params.get('pageSize') || '20'));
    const status = params.get('status') || '';

    const where: any = {};
    if (status) where.status = status;

    const [list, total] = await Promise.all([
      prisma.walletDeposit.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          amount: true,
          fee: true,
          status: true,
          txHash: true,
          confirmations: true,
          requiredConfirmations: true,
          createdAt: true,
          confirmedAt: true,
          currency: { select: { symbol: true, name: true } },
        },
      }),
      prisma.walletDeposit.count({ where }),
    ]);

    const items = list.map((d) => ({
      id: d.id,
      userId: d.userId,
      currency: d.currency.symbol,
      currencyName: d.currency.name,
      amount: d.amount.toString(),
      fee: d.fee.toString(),
      status: d.status,
      txHash: d.txHash,
      confirmations: d.confirmations,
      requiredConfirmations: d.requiredConfirmations,
      createdAt: d.createdAt.toISOString(),
      confirmedAt: d.confirmedAt?.toISOString() ?? null,
    }));

    return success({ items, total, page, pageSize });
  });
}
