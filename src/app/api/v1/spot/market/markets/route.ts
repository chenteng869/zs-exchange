import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { spotMarketService } from '@/lib/spot/services';
import { SpotMarketStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get('status') as SpotMarketStatus | undefined;
  const baseAsset = searchParams.get('baseAsset');
  const quoteAsset = searchParams.get('quoteAsset');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  const markets = await spotMarketService.list({
    page,
    pageSize,
    status,
    baseAsset,
    quoteAsset,
  });

  return success(markets);
}