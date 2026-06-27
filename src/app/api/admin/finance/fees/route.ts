import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const pageSize = Math.min(100, parseInt(params.get('pageSize') || '50'));
    const currency = params.get('currency') || '';
    const type = params.get('type') || '';

    const where: any = {};
    if (currency) where.currency = currency;
    if (type) where.type = type;

    const [records, total] = await Promise.all([
      prisma.tradeFeeRecord.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          currency: true,
          amount: true,
          rate: true,
          type: true,
          createdAt: true,
        },
      }),
      prisma.tradeFeeRecord.count({ where }),
    ]);

    const items = records.map((r) => ({
      id: r.id,
      type: '收入',
      amount: parseFloat(r.amount.toString()),
      currency: r.currency,
      date: r.createdAt.toISOString().slice(0, 10),
      category: r.type || '交易手续费',
      status: 'completed',
      userId: r.userId,
      rate: parseFloat(r.rate.toString()),
      createdAt: r.createdAt.toISOString(),
    }));

    const totalRevenue = items.reduce((sum, r) => sum + r.amount, 0);

    return success({ items, total, page, pageSize, totalRevenue });
  });
}
