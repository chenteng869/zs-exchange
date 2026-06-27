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

    const contracts = await prisma.perpContract.findMany({
      where,
      orderBy: { symbol: 'asc' },
      select: {
        id: true,
        symbol: true,
        baseAsset: true,
        quoteAsset: true,
        marginAsset: true,
        contractType: true,
        maxLeverage: true,
        minOrderQty: true,
        maxOrderQty: true,
        initialMarginRate: true,
        maintenanceMarginRate: true,
        makerFeeRate: true,
        takerFeeRate: true,
        fundingIntervalMinutes: true,
        status: true,
        createdAt: true,
        _count: { select: { positions: true, orders: true, trades: true } },
      },
    });

    const items = contracts.map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: `${c.baseAsset} ${c.contractType === 'perpetual' ? '永续合约' : '交割合约'}`,
      underlying: c.baseAsset,
      leverage: c.maxLeverage,
      positionSize: 0,
      markPrice: 0,
      indexPrice: 0,
      fundingRate: 0,
      openInterest: 0,
      volume24h: 0,
      liquidationPrice: 0,
      direction: 'neutral',
      status: (c.status === 'active' ? 'active' : c.status === 'suspended' ? 'suspended' : 'settled') as string,
      marginRatio: parseFloat(c.initialMarginRate.toString()) * 100,
      pnl24h: 0,
      totalPositions: c._count.positions,
      totalOrders: c._count.orders,
    }));

    return success(items);
  });
}

export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const body = await req.json();
    const { id, status, maxLeverage } = body;

    if (!id) {
      const { badRequest } = await import('@/lib/api/response');
      return badRequest('id required');
    }

    const data: any = {};
    if (status) data.status = status;
    if (maxLeverage !== undefined) data.maxLeverage = maxLeverage;

    const updated = await prisma.perpContract.update({ where: { id }, data });
    return success({ id: updated.id, status: updated.status });
  });
}
