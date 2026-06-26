import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { tradePairRepository } from '@/repositories/trade-pair.repository';
import { tickerRepository } from '@/repositories/market.repository';
import { parsePagination, formatPaginatedResult } from '@/lib/api/pagination';
import { withRateLimit } from '@/lib/api/middleware';
import { normalizeTradeSymbol, normalizeTradeSymbolList } from '@/lib/trade/symbol';

export async function GET(req: NextRequest, { params }: { params: { symbol: string } }) {
  const symbol = params.symbol;

  if (symbol === 'tickers') {
    return withRateLimit(req, 'tickers', 60, 60 * 1000, () => getTickers(req));
  }

  if (symbol === 'pairs') {
    return getTradePairs(req);
  }

  return getTicker(normalizeTradeSymbol(symbol));
}

async function getTradePairs(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const pagination = parsePagination(searchParams);
  const status = searchParams.get('status') || 'active';

  const result = await tradePairRepository.paginate(pagination, { status } as any, {
    orderBy: { symbol: 'asc' },
  });

  return success(formatPaginatedResult(result));
}

async function getTickers(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const symbols = searchParams.get('symbols');

  let where: any = {};
  if (symbols) {
    const symbolList = symbols.split(',');
    where = { symbol: { in: symbolList } };
  }

  const tickers = symbols
    ? await tickerRepository.findBySymbols(normalizeTradeSymbolList(symbols))
    : await tickerRepository.findAllLatest();

  return success(tickers);
}

async function getTicker(symbol: string) {
  const ticker = await tickerRepository.findLatestBySymbol(symbol);

  if (!ticker) {
    return notFound('Ticker not found');
  }

  return success(ticker);
}
