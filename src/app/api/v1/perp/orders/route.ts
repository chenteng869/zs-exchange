import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError } from '@/lib/api/response';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { orderService, contractService } from '@/lib/perp/services';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const action = p.get('action');

  switch (action) {
    case 'list':
      return withAuth(req, (ctx) => listOrders(req, ctx.userId));
    case 'open':
      return withAuth(req, (ctx) => getOpenOrders(req, ctx.userId));
    case 'history':
      return withAuth(req, (ctx) => getOrderHistory(req, ctx.userId));
    case 'detail':
      return withAuth(req, (ctx) => getOrderDetail(req, ctx.userId));
    case 'admin-list':
      return withAdminAuth(req, () => adminListOrders(req));
    default:
      return badRequest('Invalid action');
  }
}

export async function POST(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const action = p.get('action');

  switch (action) {
    case 'place':
      return withAuth(req, (ctx) => placeOrder(req, ctx.userId));
    case 'cancel':
      return withAuth(req, (ctx) => cancelOrder(req, ctx.userId));
    case 'cancel-all':
      return withAuth(req, (ctx) => cancelAllOrders(req, ctx.userId));
    default:
      return badRequest('Invalid action');
  }
}

async function listOrders(req: NextRequest, userId: string) {
  const p = req.nextUrl.searchParams;
  const symbol = p.get('symbol') || undefined;
  const side = p.get('side') || undefined;
  const status = p.get('status') || undefined;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');

  try {
    const result = await orderService.list({ userId, symbol, side, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    logger.error('[api:perp/orders] list error', e);
    return serverError(e.message);
  }
}

async function getOpenOrders(req: NextRequest, userId: string) {
  const symbol = req.nextUrl.searchParams.get('symbol') || undefined;
  try {
    const orders = await orderService.getUserOrders(userId, symbol, 'open');
    return success({ orders, total: orders.length });
  } catch (e: any) {
    logger.error('[api:perp/orders] get open orders error', e);
    return serverError(e.message);
  }
}

async function getOrderHistory(req: NextRequest, userId: string) {
  const p = req.nextUrl.searchParams;
  const symbol = p.get('symbol') || undefined;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');

  try {
    const result = await orderService.list({
      userId,
      symbol,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    logger.error('[api:perp/orders] history error', e);
    return serverError(e.message);
  }
}

async function getOrderDetail(req: NextRequest, userId: string) {
  const orderId = req.nextUrl.searchParams.get('orderId');
  if (!orderId) return badRequest('Missing orderId');

  try {
    const order = await orderService.getById(orderId);
    if (!order) return notFound('Order not found');
    if (order.userId !== userId) return badRequest('Unauthorized');
    return success(order);
  } catch (e: any) {
    logger.error('[api:perp/orders] detail error', e);
    return serverError(e.message);
  }
}

async function placeOrder(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { symbol, side, type, quantity, price, leverage, marginMode, stopLoss, takeProfit, clientOrderId, reduceOnly } = body;

    if (!symbol || !side || !type || !quantity || !leverage) {
      return badRequest('Missing required parameters: symbol, side, type, quantity, leverage');
    }

    const qty = new Prisma.Decimal(quantity);
    const priceDecimal = price ? new Prisma.Decimal(price) : undefined;

    const validation = await orderService.validateOrder({
      userId,
      symbol,
      side,
      qty,
      price: priceDecimal,
      leverage: Number(leverage),
      marginMode: marginMode || 'isolated',
      orderType: type,
    });
    if (!validation.valid) return badRequest(validation.reason || 'Validation failed');

    const contract = await contractService.getBySymbol(symbol);
    if (!contract) return notFound('Contract not found');

    const isMarket = type === 'market';
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
      reduceOnly: reduceOnly || false,
      status: isMarket ? 'filled' : 'open',
      filledQty: isMarket ? quantity : '0',
      avgFillPrice: isMarket ? (price || '0') : '0',
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
      reduceOnly: order.reduceOnly,
      status: order.status,
      filledQty: order.filledQty,
      avgFillPrice: order.avgFillPrice,
      stopPrice: order.stopPrice,
      triggerPrice: order.triggerPrice,
      createdAt: order.createdAt.getTime(),
      updatedAt: order.updatedAt.getTime(),
    });
  } catch (e: any) {
    logger.error('[api:perp/orders] place error', e);
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
    if (!['open', 'partial'].includes(order.status)) {
      return badRequest(`Cannot cancel order with status: ${order.status}`);
    }

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
    logger.error('[api:perp/orders] cancel error', e);
    return serverError(e.message);
  }
}

async function cancelAllOrders(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { symbol } = body;

    const openOrders = await orderService.getUserOrders(userId, symbol, 'open');
    const results = await Promise.allSettled(
      openOrders.map((o) => orderService.cancelOrder(o.id))
    );

    const cancelled = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return success({ cancelled, failed, total: openOrders.length });
  } catch (e: any) {
    logger.error('[api:perp/orders] cancel-all error', e);
    return serverError(e.message);
  }
}

async function adminListOrders(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const symbol = p.get('symbol') || undefined;
  const userId = p.get('userId') || undefined;
  const status = p.get('status') || undefined;
  const side = p.get('side') || undefined;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '50');

  try {
    const result = await orderService.list({ userId, symbol, side, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    logger.error('[api:perp/orders] admin list error', e);
    return serverError(e.message);
  }
}
