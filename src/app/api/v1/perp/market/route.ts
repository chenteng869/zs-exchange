import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError } from '@/lib/api/response';
import { withAuth } from '@/lib/api/middleware';
import { perpEngine } from '@/lib/perp/engine-singleton';
import {
  positionService,
  orderService,
  fundingService,
  tradeService,
  contractService,
} from '@/lib/perp/services';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';
import { tickerRepository, klineRepository, depthRepository } from '@/repositories/market.repository';

const BINANCE_REST = 'https://fapi.binance.com/fapi/v1';

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const action = p.get('action');

  switch (action) {
    case 'ticker':       return getTicker(req);
    case 'orderbook':    return getOrderBook(req);
    case 'klines':       return getKlines(req);
    case 'trades':       return getRecentTrades(req);
    case 'funding-rate': return getFundingRate(req);
    case 'contracts':    return getContracts();
    case 'positions':    return withAuth(req, (ctx) => getPositions(req, ctx.userId));
    case 'funding-history': return withAuth(req, (ctx) => getFundingHistory(req, ctx.userId));
    default:             return badRequest('Invalid action');
  }
}

export async function POST(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const action = p.get('action');

  switch (action) {
    case 'place-order':    return withAuth(req, (ctx) => placeOrder(req, ctx.userId));
    case 'cancel-order':   return withAuth(req, (ctx) => cancelOrder(req, ctx.userId));
    case 'open-position':  return withAuth(req, (ctx) => openPosition(req, ctx.userId));
    case 'close-position': return withAuth(req, (ctx) => closePosition(req, ctx.userId));
    default:               return badRequest('Invalid action');
  }
}

// ─── public market data ──────────────────────────────────────────────────────

async function getTicker(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') || 'BTCUSDT';
  try {
    const [ticker, contract, fundingRate] = await Promise.all([
      tickerRepository.findBySymbol(symbol),
      contractService.getBySymbol(symbol),
      fundingService.getLatestRate(symbol),
    ]);

    if (ticker) {
      return success({
        symbol,
        lastPrice: ticker.price,
        open24h: ticker.open,
        high24h: ticker.high,
        low24h: ticker.low,
        change24h: ticker.change,
        changePercent24h: ticker.changePercent,
        volume24h: ticker.volume,
        quoteVolume24h: ticker.quoteVolume,
        bestBid: ticker.bidPrice,
        bestBidQty: ticker.bidAmount,
        bestAsk: ticker.askPrice,
        bestAskQty: ticker.askAmount,
        fundingRate: fundingRate?.fundingRate ?? '0.0001',
        nextFundingTime: fundingRate?.fundingTime
          ? new Date(fundingRate.fundingTime).getTime()
          : Date.now() + 4 * 3600000,
        openInterest: '0',
        openInterestValue: '0',
        maxLeverage: contract?.maxLeverage ?? 125,
        updatedAt: ticker.timestamp?.getTime() ?? Date.now(),
      });
    }
  } catch (e) {
    logger.warn('[api:perp] ticker db fetch failed', e);
  }

  return success({ symbol, lastPrice: '0', error: 'market_data_unavailable' });
}

async function getOrderBook(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const symbol = p.get('symbol') || 'BTCUSDT';
  const limit = Math.min(parseInt(p.get('limit') || '20'), 100);

  try {
    const depth = await depthRepository.findLatestBySymbol(symbol);
    if (depth) {
      return success({
        symbol,
        timestamp: depth.timestamp?.getTime() ?? Date.now(),
        bids: depth.bids,
        asks: depth.asks,
      });
    }
  } catch (e) {
    logger.warn('[api:perp] orderbook db fetch failed', e);
  }
  return success({ symbol, timestamp: Date.now(), bids: [], asks: [] });
}

async function getKlines(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const symbol = p.get('symbol') || 'BTCUSDT';
  const interval = p.get('interval') || '1h';
  const limit = Math.min(parseInt(p.get('limit') || '100'), 1000);

  try {
    const klines = await klineRepository.getKlines(symbol, interval, undefined, undefined, limit);
    if (klines && klines.length > 0) {
      return success(klines.map((k) => [
        k.openTime.getTime(),
        k.open, k.high, k.low, k.close,
        k.volume, k.quoteVolume,
        k.tradeCount ?? 0,
      ]));
    }
  } catch (e) {
    logger.warn('[api:perp] klines db fetch failed', e);
  }
  return success([]);
}

async function getRecentTrades(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const symbol = p.get('symbol') || 'BTCUSDT';
  const limit = Math.min(parseInt(p.get('limit') || '50'), 200);

  try {
    const result = await tradeService.list({ symbol, page: 1, pageSize: limit });
    return success(
      result.items.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        price: t.price,
        quantity: t.qty,
        side: t.side,
        timestamp: t.tradeTime.getTime(),
      }))
    );
  } catch (e) {
    logger.error('[api:perp] get recent trades error', e);
    return success([]);
  }
}

async function getFundingRate(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') || 'BTCUSDT';
  try {
    const rate = await fundingService.getLatestRate(symbol);
    if (rate) {
      return success({
        symbol,
        fundingRate: rate.fundingRate,
        predictedRate: rate.fundingRate,
        nextFundingTime: rate.fundingTime ? new Date(rate.fundingTime).getTime() : Date.now() + 4 * 3600000,
        fundingIntervalHours: 8,
        premiumIndex: rate.premiumIndex,
        interestRate: rate.interestRate,
      });
    }
  } catch (e) {
    logger.error('[api:perp] get funding rate error', e);
  }
  return success({
    symbol,
    fundingRate: '0.0001',
    predictedRate: '0.00012',
    nextFundingTime: Date.now() + 4 * 3600000,
    fundingIntervalHours: 8,
    premiumIndex: '0.00008',
    interestRate: '0.00002',
  });
}

async function getContracts() {
  try {
    const contracts = await contractService.getActiveContracts();
    return success(contracts);
  } catch (e) {
    logger.error('[api:perp] get contracts error', e);
    return serverError('Failed to get contracts');
  }
}

// ─── auth-protected endpoints ────────────────────────────────────────────────

async function getPositions(req: NextRequest, userId: string) {
  const symbol = req.nextUrl.searchParams.get('symbol') || undefined;
  try {
    const positions = await positionService.getUserPositions(userId, symbol);
    return success({ positions, total: positions.length });
  } catch (e: any) {
    logger.error('[api:perp] get positions error', e);
    return serverError(e.message);
  }
}

async function getFundingHistory(req: NextRequest, userId: string) {
  const p = req.nextUrl.searchParams;
  const symbol = p.get('symbol') || undefined;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');

  try {
    const result = await fundingService.listPayments({
      userId,
      symbol,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    logger.error('[api:perp] funding history error', e);
    return serverError(e.message);
  }
}

async function placeOrder(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { symbol, side, type, quantity, price, leverage, marginMode, stopLoss, takeProfit, clientOrderId } = body;

    if (!symbol || !side || !type || !quantity || !leverage) {
      return badRequest('Missing required parameters');
    }

    const validation = await orderService.validateOrder({
      userId,
      symbol,
      side,
      qty: new Prisma.Decimal(quantity),
      price: price ? new Prisma.Decimal(price) : undefined,
      leverage: Number(leverage),
      marginMode: marginMode || 'isolated',
      orderType: type,
    });

    if (!validation.valid) {
      return badRequest(validation.reason || 'Order validation failed');
    }

    const contract = await contractService.getBySymbol(symbol);
    if (!contract) return notFound('Contract not found');

    const order = await orderService.placeOrder({
      userId,
      contractId: contract.id,
      symbol,
      side,
      positionSide: side === 'buy' ? 'long' : 'short',
      orderType: type,
      qty: quantity,
      price: price || '0',
      leverage: Number(leverage),
      marginMode: marginMode || 'isolated',
      stopPrice: stopLoss || '0',
      triggerPrice: takeProfit || '0',
      clientOrderId: clientOrderId || null,
      status: type === 'market' ? 'filled' : 'open',
      filledQty: type === 'market' ? quantity : '0',
      avgFillPrice: type === 'market' ? (price || '0') : '0',
      account: { connect: { id: '' } },
      contract: { connect: { id: contract.id } },
    } as any);

    return success({
      orderId: order.id,
      orderNo: order.orderNo,
      clientOrderId: order.clientOrderId,
      symbol: order.symbol,
      side: order.side,
      type: order.orderType,
      quantity: order.qty,
      price: order.price,
      leverage: order.leverage,
      marginMode: order.marginMode,
      status: order.status,
      filledQty: order.filledQty,
      avgFillPrice: order.avgFillPrice,
      createdAt: order.createdAt.getTime(),
    });
  } catch (e: any) {
    logger.error('[api:perp] place order error', e);
    return serverError(e.message);
  }
}

async function cancelOrder(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) return badRequest('Missing orderId');

    const order = await orderService.getById(orderId);
    if (!order) return notFound('Order not found');
    if (order.userId !== userId) return badRequest('Unauthorized');
    if (order.status !== 'open') return badRequest('Order cannot be cancelled');

    const cancelled = await orderService.cancelOrder(orderId);
    return success({
      success: true,
      orderId: cancelled.id,
      orderNo: cancelled.orderNo,
      symbol: cancelled.symbol,
      status: cancelled.status,
      cancelledAt: Date.now(),
    });
  } catch (e: any) {
    logger.error('[api:perp] cancel order error', e);
    return serverError(e.message);
  }
}

async function openPosition(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { symbol, side, quantity, price, leverage, marginMode } = body;

    if (!symbol || !side || !quantity || !leverage) {
      return badRequest('Missing required parameters');
    }

    const result = perpEngine.openPosition({
      userId,
      symbol,
      side,
      quantity,
      price: price || '1',
      leverage: Number(leverage),
      marginMode: (marginMode || 'isolated') as any,
    });

    return success(result);
  } catch (e: any) {
    logger.error('[api:perp] open position error', e);
    return serverError(e.message);
  }
}

async function closePosition(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { positionId, quantity, price } = body;

    if (!positionId) return badRequest('Missing positionId');

    const position = await positionService.getById(positionId);
    if (!position) return notFound('Position not found');
    if (position.userId !== userId) return badRequest('Unauthorized');

    const result = perpEngine.closePosition(
      positionId,
      price || '1',
      quantity || String(position.positionQty)
    );

    return success(result);
  } catch (e: any) {
    logger.error('[api:perp] close position error', e);
    return serverError(e.message);
  }
}
