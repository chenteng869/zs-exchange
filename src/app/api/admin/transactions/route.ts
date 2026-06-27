import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const pageSize = Math.min(100, parseInt(params.get('pageSize') || '20'));
    const type = params.get('type') || '';
    const status = params.get('status') || '';

    const where: any = {};
    if (status) where.status = status;
    if (type === 'buy') where.side = 'buy';
    else if (type === 'sell') where.side = 'sell';

    const [list, total] = await Promise.all([
      prisma.tradeOrder.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          symbol: true,
          side: true,
          type: true,
          status: true,
          price: true,
          amount: true,
          filledAmount: true,
          executedValue: true,
          fee: true,
          feeCurrency: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.tradeOrder.count({ where }),
    ]);

    const items = list.map((o) => ({
      id: o.id,
      userId: o.userId,
      symbol: o.symbol,
      side: o.side,
      type: o.type,
      status: o.status,
      price: o.price?.toString() ?? null,
      amount: o.amount.toString(),
      filledAmount: o.filledAmount.toString(),
      executedValue: o.executedValue.toString(),
      fee: o.fee.toString(),
      feeCurrency: o.feeCurrency ?? '',
      source: o.source,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));

    return success({ items, total, page, pageSize });
  });
}
