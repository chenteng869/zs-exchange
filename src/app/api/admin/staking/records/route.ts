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

    const [records, total] = await Promise.all([
      prisma.defiStaking.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          amount: true,
          reward: true,
          status: true,
          stakedAt: true,
          unlockedAt: true,
          createdAt: true,
          pool: {
            select: { name: true, currency: true, lockupDays: true },
          },
        },
      }),
      prisma.defiStaking.count({ where }),
    ]);

    const items = records.map((r) => ({
      id: r.id,
      userId: r.userId,
      userAddress: r.userId.slice(0, 8) + '...' + r.userId.slice(-4),
      poolName: r.pool.name,
      token: r.pool.currency,
      amount: parseFloat(r.amount.toString()).toFixed(6),
      stakedAt: r.stakedAt.toISOString().slice(0, 19).replace('T', ' '),
      expiresAt: r.unlockedAt ? r.unlockedAt.toISOString().slice(0, 19).replace('T', ' ') : '-',
      status: r.status,
      rewards: `${parseFloat(r.reward.toString()).toFixed(6)} ${r.pool.currency}`,
    }));

    return success({ items, total, page, pageSize });
  });
}
