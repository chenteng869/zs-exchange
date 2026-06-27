import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const type = params.get('type') || 'user-growth';
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 86400000);
    const end = endDate ? new Date(endDate) : new Date();

    if (type === 'user-growth') {
      const users = await prisma.coreUser.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      const byDay: Record<string, number> = {};
      users.forEach((u) => {
        const day = u.createdAt.toISOString().slice(0, 10);
        byDay[day] = (byDay[day] || 0) + 1;
      });

      return success(Object.entries(byDay).map(([date, count]) => ({ date, count })));
    }

    if (type === 'transactions') {
      const trades = await prisma.tradeTrade.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true, price: true, amount: true },
        orderBy: { createdAt: 'asc' },
      });

      const byDay: Record<string, { count: number; volume: number }> = {};
      trades.forEach((t) => {
        const day = t.createdAt.toISOString().slice(0, 10);
        if (!byDay[day]) byDay[day] = { count: 0, volume: 0 };
        byDay[day].count++;
        byDay[day].volume += Number(t.price) * Number(t.amount);
      });

      return success(Object.entries(byDay).map(([date, v]) => ({ date, ...v })));
    }

    if (type === 'revenue') {
      const deposits = await prisma.walletDeposit.findMany({
        where: { createdAt: { gte: start, lte: end }, status: 'credited' },
        select: { createdAt: true, amount: true },
        orderBy: { createdAt: 'asc' },
      });

      const byDay: Record<string, number> = {};
      deposits.forEach((d) => {
        const day = d.createdAt.toISOString().slice(0, 10);
        byDay[day] = (byDay[day] || 0) + Number(d.amount);
      });

      return success(Object.entries(byDay).map(([date, amount]) => ({ date, amount })));
    }

    return badRequest('Invalid chart type');
  });
}
