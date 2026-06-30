import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { spotMarketDataService } from '@/lib/spot/services';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const marketSymbol = searchParams.get('marketSymbol');

  if (marketSymbol) {
    const ticker = await spotMarketDataService.getTicker(marketSymbol);
    return success(ticker || {});
  }

  const tickers = await spotMarketDataService.getAllTickers();
  return success(tickers);
}