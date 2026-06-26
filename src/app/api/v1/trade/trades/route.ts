import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { tradeRepository } from '@/repositories/trade.repository';
import { parsePagination, formatPaginatedResult } from '@/lib/api/pagination';
import { normalizeTradeSymbol } from '@/lib/trade/symbol';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const searchParams = req.nextUrl.searchParams;
    const pagination = parsePagination(searchParams);
    const symbol = searchParams.get('symbol');
    const side = searchParams.get('side');

    const filters: any = {};
    if (symbol) filters.symbol = normalizeTradeSymbol(symbol);
    if (side) filters.side = side;

    const result = await tradeRepository.findByUserId(ctx.userId, pagination, filters);
    return success(formatPaginatedResult(result));
  });
}
