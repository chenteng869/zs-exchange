import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const currencies = await prisma.walletCurrency.findMany({
      orderBy: { symbol: 'asc' },
      select: {
        id: true,
        symbol: true,
        name: true,
        decimals: true,
        blockchain: true,
        isActive: true,
        depositEnabled: true,
        withdrawalEnabled: true,
        createdAt: true,
      },
    });

    const items = currencies.map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      decimals: c.decimals,
      chain: c.blockchain,
      price: 0,
      priceChange: 0,
      volume: 0,
      active: c.isActive,
    }));

    return success(items);
  });
}
