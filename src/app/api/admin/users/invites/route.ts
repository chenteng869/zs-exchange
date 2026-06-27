import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const pageSize = Math.min(100, parseInt(params.get('pageSize') || '50'));

    const [users, total, directCounts] = await Promise.all([
      prisma.coreUser.findMany({
        where: { referralCode: { not: null } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          referralCode: true,
          vipLevel: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.coreUser.count({ where: { referralCode: { not: null } } }),
      prisma.coreUser.groupBy({
        by: ['referredBy'],
        where: { referredBy: { not: null } },
        _count: { id: true },
      }),
    ]);

    const directMap: Record<string, number> = {};
    for (const row of directCounts) {
      if (row.referredBy) directMap[row.referredBy] = row._count.id;
    }

    const items = users.map((u) => ({
      id: u.id,
      user: u.id.slice(0, 8) + '...' + u.id.slice(-4),
      username: u.username,
      level: `LV${Math.max(1, u.vipLevel || 1)}`,
      inviteCode: u.referralCode ?? '',
      directInvites: directMap[u.id] ?? 0,
      indirectInvites: 0,
      totalInvites: directMap[u.id] ?? 0,
      totalRewards: 0,
      pendingRewards: 0,
      registerDate: u.createdAt.toISOString().slice(0, 10),
      status: u.status === 'active' ? 'active' : 'inactive',
    }));

    return success({ items, total, page, pageSize });
  });
}
