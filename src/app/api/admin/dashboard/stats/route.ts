import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');

    const where: any = {};
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000);
    const lastMonth = new Date(now.getTime() - 30 * 86400000);

    const [
      totalUsers,
      newUsersToday,
      totalOrders,
      totalTrades,
      totalDeposits,
      pendingWithdrawals,
      activePositions,
    ] = await Promise.all([
      prisma.coreUser.count(),
      prisma.coreUser.count({ where: { createdAt: { gte: yesterday } } }),
      prisma.tradeOrder.count(),
      prisma.tradeTrade.count(),
      prisma.walletDeposit.count({ where: { status: 'credited' } }),
      prisma.walletWithdrawal.count({ where: { status: { in: ['waiting_approval', 'created'] } } }),
      prisma.perpPosition.count({ where: { status: 'open' } }),
    ]);

    const [depositVolume, withdrawalVolume] = await Promise.all([
      prisma.walletDeposit.aggregate({ _sum: { amount: true }, where: { status: 'credited', ...where } }),
      prisma.walletWithdrawal.aggregate({ _sum: { amount: true }, where: { status: 'confirmed', ...where } }),
    ]);

    return success({
      totalUsers,
      newUsersToday,
      totalOrders,
      totalTrades,
      totalDeposits,
      pendingWithdrawals,
      activePositions,
      depositVolume: depositVolume._sum.amount?.toString() ?? '0',
      withdrawalVolume: withdrawalVolume._sum.amount?.toString() ?? '0',
      userGrowth: totalUsers > 0 ? (newUsersToday / totalUsers) * 100 : 0,
    });
  });
}
