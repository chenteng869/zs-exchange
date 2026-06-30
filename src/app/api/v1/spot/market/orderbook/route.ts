import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { spotMarketDataService } from '@/lib/spot/services';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const marketSymbol = searchParams.get('marketSymbol');
  const depth = parseInt(searchParams.get('depth') || '20');

  if (!marketSymbol) {
    return badRequest('marketSymbol is required');
  }

  const orderbook = spotMarketDataService.getOrderBook(marketSymbol, depth);
  return success(orderbook);
}