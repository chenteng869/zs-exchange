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

    const pools = await prisma.defiLiquidityPool.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        token0: true,
        token1: true,
        contractAddress: true,
        tvl: true,
        apy: true,
        feeRate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { positions: true } },
      },
    });

    const items = pools.map((p) => ({
      id: p.id,
      name: p.name,
      token0: p.token0,
      token1: p.token1,
      fee: parseFloat(p.feeRate.toString()) * 100,
      tvl: parseFloat(p.tvl.toString()),
      volume24h: 0,
      apr: parseFloat(p.apy.toString()),
      status: p.status === 'active' ? 'active' : p.status === 'warning' ? 'warning' : 'error',
      contractAddress: p.contractAddress,
      price: 0,
      priceChange: 0,
      liquidity: { token0: 0, token1: 0 },
      transactions: p._count.positions,
      lastUpdate: p.updatedAt.toISOString().slice(0, 19).replace('T', ' '),
      alerts: [],
    }));

    return success(items);
  });
}
