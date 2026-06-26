import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { klineRepository } from '@/repositories/market.repository';
import { withRateLimit } from '@/lib/api/middleware';
import { normalizeTradeSymbol } from '@/lib/trade/symbol';

const INTERVAL_MAP: Record<string, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '2h': 7200,
  '4h': 14400,
  '6h': 21600,
  '12h': 43200,
  '1d': 86400,
  '1w': 604800,
  '1M': 2592000,
};

export async function GET(req: NextRequest, { params }: { params: { symbol: string } }) {
  const symbol = normalizeTradeSymbol(params.symbol);
  const searchParams = req.nextUrl.searchParams;
  const interval = searchParams.get('interval') || '1h';
  const limit = parseInt(searchParams.get('limit') || '500');
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');

  if (!INTERVAL_MAP[interval]) {
    return badRequest('Invalid interval. Valid values: 1m,5m,15m,30m,1h,2h,4h,6h,12h,1d,1w,1M');
  }

  return withRateLimit(req, `klines:${symbol}`, 60, 60 * 1000, async () => {
    const klines = await klineRepository.getKlines(
      symbol,
      interval,
      startTime ? new Date(parseInt(startTime, 10)) : undefined,
      endTime ? new Date(parseInt(endTime, 10)) : undefined,
      Math.min(1000, limit),
    );

    const sorted = klines.map((k: any) => [
      k.openTime.getTime(),
      k.open.toString(),
      k.high.toString(),
      k.low.toString(),
      k.close.toString(),
      k.volume.toString(),
      k.closeTime.getTime(),
      k.quoteVolume.toString(),
      k.trades,
      '0',
      '0',
      '0',
    ]);

    return success(sorted);
  });
}
