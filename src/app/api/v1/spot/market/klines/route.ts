import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { spotMarketDataService } from '@/lib/spot/services';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const marketSymbol = searchParams.get('marketSymbol');
  const interval = searchParams.get('interval') || '1m';
  const limit = parseInt(searchParams.get('limit') || '100');

  if (!marketSymbol) {
    return badRequest('marketSymbol is required');
  }

  const klines = await spotMarketDataService.getKline(marketSymbol, interval, limit);
  return success(klines);
}