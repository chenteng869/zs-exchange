import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const pageSize = Math.min(100, parseInt(params.get('pageSize') || '50'));
    const chain = params.get('chain') || '';

    const where: any = {};
    if (chain && chain !== 'all') where.chainType = chain;

    const [balances, total] = await Promise.all([
      prisma.walletUserAssetBalance.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { total: 'desc' },
        select: {
          id: true,
          assetSymbol: true,
          chainType: true,
          chainId: true,
          available: true,
          frozen: true,
          total: true,
          updatedAt: true,
        },
      }),
      prisma.walletUserAssetBalance.count({ where }),
    ]);

    const grouped: Record<string, { symbol: string; chain: string; total: number; available: number; frozen: number }> = {};
    for (const b of balances) {
      const key = b.assetSymbol;
      if (!grouped[key]) {
        grouped[key] = { symbol: b.assetSymbol, chain: String(b.chainType), total: 0, available: 0, frozen: 0 };
      }
      grouped[key].total += parseFloat(b.total.toString());
      grouped[key].available += parseFloat(b.available.toString());
      grouped[key].frozen += parseFloat(b.frozen.toString());
    }

    const items = Object.values(grouped).map((g, i) => ({
      id: String(i + 1),
      symbol: g.symbol,
      name: g.symbol,
      chain: g.chain,
      balance: g.total.toFixed(6),
      valueUSD: '$0',
      change24h: 0,
      share: 0,
      status: 'active',
    }));

    return success({ items, total, page, pageSize });
  });
}
