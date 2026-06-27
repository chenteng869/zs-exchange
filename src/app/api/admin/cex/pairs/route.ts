import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const status = params.get('status') || '';

    const where: any = {};
    if (status) where.status = status;

    const pairs = await prisma.tradePair.findMany({
      where,
      orderBy: { symbol: 'asc' },
      select: {
        id: true,
        symbol: true,
        baseCurrency: true,
        quoteCurrency: true,
        status: true,
        makerFeeRate: true,
        takerFeeRate: true,
        minOrderAmount: true,
        minOrderValue: true,
        basePrecision: true,
        quotePrecision: true,
        createdAt: true,
        _count: { select: { orders: true, trades: true } },
      },
    });

    const items = pairs.map((p) => ({
      id: p.id,
      symbol: p.symbol,
      base: p.baseCurrency,
      quote: p.quoteCurrency,
      status: p.status,
      makerFeeRate: p.makerFeeRate.toString(),
      takerFeeRate: p.takerFeeRate.toString(),
      minOrderAmount: p.minOrderAmount.toString(),
      minOrderValue: p.minOrderValue.toString(),
      basePrecision: p.basePrecision,
      quotePrecision: p.quotePrecision,
      totalOrders: p._count.orders,
      totalTrades: p._count.trades,
      createdAt: p.createdAt.toISOString(),
    }));

    return success(items);
  });
}

export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const body = await req.json();
    const { id, status, makerFeeRate, takerFeeRate } = body;

    if (!id) {
      const { badRequest } = await import('@/lib/api/response');
      return badRequest('id required');
    }

    const data: any = {};
    if (status) data.status = status;
    if (makerFeeRate !== undefined) data.makerFeeRate = makerFeeRate;
    if (takerFeeRate !== undefined) data.takerFeeRate = takerFeeRate;

    const updated = await prisma.tradePair.update({ where: { id }, data });
    return success({ id: updated.id, status: updated.status });
  });
}
