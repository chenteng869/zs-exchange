import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const pageSize = Math.min(100, parseInt(params.get('pageSize') || '50'));
    const status = params.get('status') || 'active';
    const symbol = params.get('symbol') || '';

    const where: any = {};
    if (status) where.status = status;
    if (symbol) where.symbol = { contains: symbol.toUpperCase() };

    const [positions, total] = await Promise.all([
      prisma.perpPosition.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { openTime: 'desc' },
        select: {
          id: true,
          userId: true,
          symbol: true,
          side: true,
          positionQty: true,
          entryPrice: true,
          markPrice: true,
          liquidationPrice: true,
          leverage: true,
          marginMode: true,
          positionMargin: true,
          unrealizedPnl: true,
          realizedPnl: true,
          status: true,
          openTime: true,
        },
      }),
      prisma.perpPosition.count({ where }),
    ]);

    const items = positions.map((p) => {
      const entryPrice = parseFloat(p.entryPrice.toString());
      const markPrice = parseFloat(p.markPrice.toString());
      const qty = parseFloat(p.positionQty.toString());
      const pnl = parseFloat(p.unrealizedPnl.toString());
      const margin = parseFloat(p.positionMargin.toString());
      const pnlPercent = margin > 0 ? (pnl / margin) * 100 : 0;

      return {
        id: p.id,
        symbol: p.symbol,
        side: p.side,
        leverage: `${p.leverage}x`,
        openPrice: entryPrice,
        currentPrice: markPrice,
        quantity: qty,
        margin,
        pnl,
        pnlPercent: parseFloat(pnlPercent.toFixed(2)),
        status: p.status,
        liquidationPrice: parseFloat(p.liquidationPrice.toString()),
        userId: p.userId,
        openTime: p.openTime.toISOString().slice(0, 19).replace('T', ' '),
      };
    });

    return success({ items, total, page, pageSize });
  });
}
