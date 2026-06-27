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

    const pools = await prisma.defiStakingPool.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        currency: true,
        contractAddress: true,
        apy: true,
        totalStaked: true,
        minStakeAmount: true,
        maxStakeAmount: true,
        lockupDays: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { stakes: true } },
      },
    });

    const items = pools.map((p) => ({
      id: p.id,
      name: p.name,
      token: p.currency,
      tokenAddress: p.contractAddress,
      apr: parseFloat(p.apy.toString()),
      minStake: parseFloat(p.minStakeAmount.toString()),
      maxStake: parseFloat(p.maxStakeAmount.toString()),
      lockPeriod: p.lockupDays,
      totalStaked: parseFloat(p.totalStaked.toString()),
      activeUsers: p._count.stakes,
      status: p.status,
      createdAt: p.createdAt.toISOString().slice(0, 10),
      updatedAt: p.updatedAt.toISOString().slice(0, 10),
      configHistory: [],
    }));

    return success(items);
  });
}
