import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(params.get('limit') || '10'), 50);

    const [recentUsers, recentTrades, recentDeposits, recentWithdrawals] = await Promise.all([
      prisma.coreUser.findMany({
        take: Math.ceil(limit / 4),
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, email: true, createdAt: true },
      }),
      prisma.tradeTrade.findMany({
        take: Math.ceil(limit / 4),
        orderBy: { createdAt: 'desc' },
        select: { id: true, symbol: true, price: true, amount: true, side: true, createdAt: true },
      }),
      prisma.walletDeposit.findMany({
        take: Math.ceil(limit / 4),
        orderBy: { createdAt: 'desc' },
        select: { id: true, amount: true, status: true, createdAt: true, currency: { select: { symbol: true } } },
      }),
      prisma.walletWithdrawal.findMany({
        take: Math.ceil(limit / 4),
        orderBy: { createdAt: 'desc' },
        select: { id: true, amount: true, status: true, createdAt: true, currency: { select: { symbol: true } } },
      }),
    ]);

    const activities = [
      ...recentUsers.map((u) => ({ type: 'user_register', id: u.id, label: `New user: ${u.username}`, createdAt: u.createdAt })),
      ...recentTrades.map((t) => ({ type: 'trade', id: t.id, label: `Trade: ${t.side.toUpperCase()} ${t.amount} ${t.symbol} @ ${t.price}`, createdAt: t.createdAt })),
      ...recentDeposits.map((d) => ({ type: 'deposit', id: d.id, label: `Deposit: ${d.amount} ${d.currency.symbol} (${d.status})`, createdAt: d.createdAt })),
      ...recentWithdrawals.map((w) => ({ type: 'withdrawal', id: w.id, label: `Withdrawal: ${w.amount} ${w.currency.symbol} (${w.status})`, createdAt: w.createdAt })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return success(activities);
  });
}
