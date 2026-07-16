import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { orderRepository } from '@/repositories/order.repository';
import { balanceRepository } from '@/repositories/balance.repository';
import { tradePairRepository } from '@/repositories/trade-pair.repository';
import { parsePagination, formatPaginatedResult } from '@/lib/api/pagination';
import { placeSpotLimitOrder } from '@/lib/trade/spot-order-service';
import { normalizeTradeSymbol } from '@/lib/trade/symbol';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const searchParams = req.nextUrl.searchParams;
    const pagination = parsePagination(searchParams);
    const symbol = searchParams.get('symbol');
    const side = searchParams.get('side');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const result = await orderRepository.findByUserId(ctx.userId, pagination, {
      symbol: symbol ? normalizeTradeSymbol(symbol) : undefined,
      side: side || undefined,
      status: status || undefined,
      type: type || undefined,
    });

    return success(formatPaginatedResult(result));
  });
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const body = await req.json();
    const { symbol: rawSymbol, side, type, price, amount, quantity } = body;
    const symbol = rawSymbol ? normalizeTradeSymbol(rawSymbol) : '';

    if (!symbol || !side || !type) {
      return badRequest('Symbol, side, and type are required');
    }

    if (!['buy', 'sell'].includes(side)) {
      return badRequest('Side must be buy or sell');
    }

    if (!['market', 'limit'].includes(type)) {
      return badRequest('Type must be market or limit');
    }

    if (type === 'market') {
      return badRequest('Market orders are not enabled yet');
    }

    const tradePair = await tradePairRepository.findBySymbol(symbol);
    if (!tradePair || tradePair.status !== 'active') {
      return badRequest('Trading pair is not available');
    }

    const orderAmount = parseFloat(amount || quantity || 0);
    if (isNaN(orderAmount) || orderAmount <= 0) {
      return badRequest('Invalid amount');
    }

    if (orderAmount < parseFloat(tradePair.minOrderAmount as any)) {
      return badRequest(`Minimum order amount is ${tradePair.minOrderAmount}`);
    }

    let totalPrice = 0;
    if (type === 'limit') {
      if (!price || parseFloat(price) <= 0) {
        return badRequest('Price is required for limit orders');
      }
      totalPrice = orderAmount * parseFloat(price);
      if (totalPrice < parseFloat(tradePair.minOrderValue as any)) {
        return badRequest(`Minimum order value is ${tradePair.minOrderValue}`);
      }
    }

    if (side === 'buy') {
      const balance = await balanceRepository.findByUserIdAndCurrency(
        ctx.userId,
        tradePair.quoteCurrency,
      );
      const available = parseFloat(balance?.available as any || 0);

      if (type === 'limit' && available < totalPrice) {
        return badRequest('Insufficient balance');
      }

      const result = await placeSpotLimitOrder({
        userId: ctx.userId,
        pair: tradePair,
        side,
        price: parseFloat(price),
        amount: orderAmount,
        source: 'api',
      });

      return success({
        ...result.order,
        trades: result.trades,
        matched: result.trades.length > 0,
      });
    } else {
      const balance = await balanceRepository.findByUserIdAndCurrency(
        ctx.userId,
        tradePair.baseCurrency,
      );
      const available = parseFloat(balance?.available as any || 0);

      if (available < orderAmount) {
        return badRequest('Insufficient balance');
      }

      const result = await placeSpotLimitOrder({
        userId: ctx.userId,
        pair: tradePair,
        side,
        price: parseFloat(price),
        amount: orderAmount,
        source: 'api',
      });

      return success({
        ...result.order,
        trades: result.trades,
        matched: result.trades.length > 0,
      });
    }
  });
}

export async function DELETE(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    // 2026-07-11 修复：orderId 优先从 query 读取，body 兜底
    const searchParams = req.nextUrl.searchParams;
    let orderId = searchParams.get('orderId');
    let symbol: string | undefined = searchParams.get('symbol') || undefined;
    if (!orderId) {
      try {
        const body = await req.json();
        orderId = body.orderId;
        symbol = symbol || body.symbol;
      } catch { /* body may be empty for DELETE */ }
    }
    if (!orderId) {
      return badRequest('Order ID is required (query: orderId)');
    }

    const order = await orderRepository.findById(orderId);
    if (!order) {
      return notFound('Order not found');
    }

    if (order.userId !== ctx.userId) {
      return badRequest('Unauthorized');
    }

    if (!['pending', 'open', 'partial'].includes(order.status)) {
      return badRequest('Order cannot be cancelled');
    }

    const tradePair = await tradePairRepository.findBySymbol(order.symbol);
    if (tradePair) {
      const remainingAmount = parseFloat(order.remainingAmount as any);
      const price = parseFloat(order.price as any);

      if (order.side === 'buy' && price > 0) {
        const unfreezeAmount = remainingAmount * price;
        await balanceRepository.unlockBalance(ctx.userId, tradePair.quoteCurrency, unfreezeAmount);
      } else if (order.side === 'sell') {
        await balanceRepository.unlockBalance(ctx.userId, tradePair.baseCurrency, remainingAmount);
      }
    }

    const cancelledOrder = await orderRepository.updateStatus(orderId, 'cancelled');
    return success(cancelledOrder);
  });
}
