import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { depthRepository } from '@/repositories/market.repository';
import { withRateLimit } from '@/lib/api/middleware';
import { getSpotOrderBookSnapshot } from '@/lib/trade/order-book-service';
import { normalizeTradeSymbol } from '@/lib/trade/symbol';

export async function GET(req: NextRequest, { params }: { params: { symbol: string } }) {
  const symbol = normalizeTradeSymbol(params.symbol);
  const searchParams = req.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '20');

  return withRateLimit(req, `depth:${symbol}`, 30, 60 * 1000, async () => {
    const depth = await depthRepository.findLatestBySymbol(symbol);

    if (!depth) {
      return success(await getSpotOrderBookSnapshot(symbol, limit));
    }

    const asks = (depth.asks as any[] || []).slice(0, Math.min(limit, 100));
    const bids = (depth.bids as any[] || []).slice(0, Math.min(limit, 100));
    const normalizeLevel = (level: any) => Array.isArray(level)
      ? [String(level[0] ?? '0'), String(level[1] ?? '0')]
      : [String(level?.price ?? '0'), String(level?.amount ?? level?.quantity ?? '0')];

    return success({
      symbol,
      lastUpdateId: depth.id,
      timestamp: depth.timestamp.getTime(),
      bids: bids.map(normalizeLevel),
      asks: asks.map(normalizeLevel),
    });
  });
}
