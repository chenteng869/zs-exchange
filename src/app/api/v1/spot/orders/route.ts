import { NextRequest } from 'next/server';
import { success, badRequest, notFound, internalError } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { spotOrderService, spotMarketService } from '@/lib/spot/services';
import { getSpotMatchingEngine } from '@/lib/spot/matching-engine';
import { SpotOrderSide, SpotOrderType, SpotOrderStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const searchParams = req.nextUrl.searchParams;
    const marketSymbol = searchParams.get('marketSymbol');
    const status = searchParams.get('status') as SpotOrderStatus | undefined;
    const side = searchParams.get('side') as SpotOrderSide | undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await spotOrderService.list({
      userId: ctx.userId,
      marketSymbol,
      status,
      side,
      page,
      pageSize,
    });

    return success(result);
  });
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const body = await req.json();
      const { marketSymbol, side, orderType, price, quantity, timeInForce } = body;

      if (!marketSymbol || !side || !orderType || !quantity) {
        return badRequest('marketSymbol, side, orderType, and quantity are required');
      }

      if (!['buy', 'sell'].includes(side)) {
        return badRequest('Side must be buy or sell');
      }

      if (!['limit', 'market'].includes(orderType)) {
        return badRequest('Order type must be limit or market');
      }

      if (orderType === 'limit' && !price) {
        return badRequest('Price is required for limit orders');
      }

      const market = await spotMarketService.getBySymbol(marketSymbol);
      if (!market || market.status !== 'trading') {
        return badRequest('Market is not available');
      }

      const order = await spotOrderService.createOrder({
        userId: ctx.userId,
        marketSymbol: market.marketSymbol,
        side: side as SpotOrderSide,
        orderType: orderType as SpotOrderType,
        price: orderType === 'limit' ? price : undefined,
        quantity,
        timeInForce: timeInForce || 'GTC',
      });

      const engine = getSpotMatchingEngine();
      const { order: matchedOrder, trades } = await engine.submitOrder(order);

      return success({
        order: matchedOrder,
        trades,
        matched: trades.length > 0,
      });
    } catch (error) {
      return internalError(error instanceof Error ? error.message : 'Failed to place order');
    }
  });
}

export async function DELETE(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const body = await req.json();
      const { orderId } = body;

      if (!orderId) {
        return badRequest('Order ID is required');
      }

      const order = await spotOrderService.getById(orderId);
      if (!order) {
        return notFound('Order not found');
      }

      if (order.userId !== ctx.userId) {
        return badRequest('Unauthorized to cancel this order');
      }

      const engine = getSpotMatchingEngine();
      const cancelledOrder = await engine.cancelOrder(orderId);

      return success(cancelledOrder);
    } catch (error) {
      return internalError(error instanceof Error ? error.message : 'Failed to cancel order');
    }
  });
}