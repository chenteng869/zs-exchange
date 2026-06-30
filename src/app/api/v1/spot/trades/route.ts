import { NextRequest } from 'next/server';
import { success, badRequest, internalError } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { spotTradeService } from '@/lib/spot/services';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const searchParams = req.nextUrl.searchParams;
      const marketSymbol = searchParams.get('marketSymbol');
      const orderId = searchParams.get('orderId');
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '50');

      const result = await spotTradeService.list({
        userId: ctx.userId,
        marketSymbol,
        orderId,
        page,
        pageSize,
      });

      return success(result);
    } catch (error) {
      return internalError(error instanceof Error ? error.message : 'Failed to get trades');
    }
  });
}