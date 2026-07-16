import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { orderService, contractService, accountService } from '@/lib/perp/services';
import { accountRepo, positionRepo, orderRepo, prisma } from '@/lib/perp/repos';
import { MarginCalculator } from '@/lib/perp/margin-calculator';
import { tickerService } from '@/lib/crypto/services';
import { Prisma } from '@prisma/client';

const marginCalculator = new MarginCalculator();

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
    return handleApiError(e, 'api:perp/orders list');
  }
}

async function getOpenOrders(req: NextRequest, userId: string) {
  const symbol = req.nextUrl.searchParams.get('symbol') || undefined;
  try {
    const orders = await orderService.getUserOrders(userId, symbol, 'open');
    return success({ orders, total: orders.length });
  } catch (e: any) {
    return handleApiError(e, 'api:perp/orders get open orders');
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
    return handleApiError(e, 'api:perp/orders history');
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
    return handleApiError(e, 'api:perp/orders detail');
  }
}

/**
 * 下单。
 *  - 市价单：立即按真实标记价（src/lib/crypto 行情源）成交 —— 计算名义价值/初始保证金，
 *    校验账户可用余额，冻结保证金，开仓/加仓，订单标记为 filled。
 *  - 限价单：暂不支持自动撮合，仅挂单（status=open），与此前行为一致。
 */
async function placeOrder(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { symbol, side, type, quantity, price, leverage, marginMode, stopLoss, takeProfit, clientOrderId, reduceOnly } = body;

    if (!symbol || !side || !type || !quantity || !leverage) {
      return badRequest('Missing required parameters: symbol, side, type, quantity, leverage');
    }

    const qty = new Prisma.Decimal(quantity);
    const priceDecimal = price ? new Prisma.Decimal(price) : undefined;
    const mode: 'isolated' | 'cross' = marginMode === 'cross' ? 'cross' : 'isolated';
    const lev = Number(leverage);

    const validation = await orderService.validateOrder({
      userId,
      symbol,
      side,
      qty,
      price: priceDecimal,
      leverage: lev,
      marginMode: mode,
      orderType: type,
    });
    if (!validation.valid) return badRequest(validation.reason || 'Validation failed');

    const contract = await contractService.getBySymbol(symbol);
    if (!contract) return notFound('Contract not found');

    const account = await accountService.getOrCreate(userId, 'USDT', 'cross');
    const positionSide = side === 'buy' ? 'long' : 'short';
    const isMarket = type === 'market';

    if (!isMarket) {
      // 限价单：仅挂单，不立即成交
      const order = await orderRepo.create({
        orderNo: `PO${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        userId,
        account: { connect: { id: account.id } },
        contract: { connect: { id: contract.id } },
        symbol,
        side,
        positionSide,
        orderType: type,
        price: priceDecimal || new Prisma.Decimal(0),
        qty,
        filledQty: new Prisma.Decimal(0),
        avgFillPrice: new Prisma.Decimal(0),
        leverage: lev,
        marginMode: mode,
        reduceOnly: !!reduceOnly,
        stopPrice: stopLoss ? new Prisma.Decimal(stopLoss) : new Prisma.Decimal(0),
        triggerPrice: takeProfit ? new Prisma.Decimal(takeProfit) : new Prisma.Decimal(0),
        clientOrderId: clientOrderId || null,
        status: 'open',
        source: 'api',
      });
      return success(formatOrder(order));
    }

    // 市价单：取真实标记价立即成交
    const ticker = await tickerService.getTicker(contract.baseAsset);
    if (!ticker || !ticker.price) {
      return badRequest('Market price unavailable, please retry');
    }
    const fillPrice = new Prisma.Decimal(ticker.price);

    const notional = qty.mul(fillPrice);
    const contractLike = {
      maxLeverage: contract.maxLeverage,
      initialMarginRate: Number(contract.initialMarginRate),
      maintenanceMarginRate: Number(contract.maintenanceMarginRate),
    } as any;
    const initialMargin = new Prisma.Decimal(
      marginCalculator.calculateInitialMargin(notional.toString(), lev, mode, contractLike)
    );

    if (account.availableBalance.lt(initialMargin)) {
      return badRequest(`Insufficient margin: need ${initialMargin.toString()} USDT, available ${account.availableBalance.toString()} USDT`);
    }

    const { order } = await prisma.$transaction(async (tx) => {
      await accountRepo.freezeBalance(account.id, initialMargin, tx);

      const existing = await positionRepo.findByUserSymbolSideMargin(userId, symbol, positionSide, mode);
      let position;
      if (existing && existing.status === 'active') {
        const nextQty = existing.positionQty.add(qty);
        const nextEntry = new Prisma.Decimal(
          marginCalculator.calculateWeightedEntryPrice(
            existing.positionQty.toString(), existing.entryPrice.toString(), qty.toString(), fillPrice.toString(),
          ),
        );
        const nextMargin = existing.positionMargin.add(initialMargin);
        const liqPrice = new Prisma.Decimal(
          marginCalculator.calculateLiquidationPrice(positionSide, nextEntry.toString(), lev, Number(contract.maintenanceMarginRate), mode),
        );
        position = await positionRepo.update(existing.id, {
          positionQty: nextQty,
          entryPrice: nextEntry,
          markPrice: fillPrice,
          liquidationPrice: liqPrice,
          leverage: lev,
          isolatedMargin: mode === 'isolated' ? nextMargin : new Prisma.Decimal(0),
          positionMargin: nextMargin,
        }, tx);
      } else {
        const liqPrice = new Prisma.Decimal(
          marginCalculator.calculateLiquidationPrice(positionSide, fillPrice.toString(), lev, Number(contract.maintenanceMarginRate), mode),
        );
        position = await positionRepo.create({
          userId,
          account: { connect: { id: account.id } },
          contract: { connect: { id: contract.id } },
          symbol,
          side: positionSide,
          positionQty: qty,
          entryPrice: fillPrice,
          markPrice: fillPrice,
          liquidationPrice: liqPrice,
          leverage: lev,
          marginMode: mode,
          isolatedMargin: mode === 'isolated' ? initialMargin : new Prisma.Decimal(0),
          positionMargin: initialMargin,
          status: 'active',
        }, tx);
      }

      const createdOrder = await orderRepo.create({
        orderNo: `PO${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        userId,
        account: { connect: { id: account.id } },
        contract: { connect: { id: contract.id } },
        position: { connect: { id: position.id } },
        symbol,
        side,
        positionSide,
        orderType: type,
        price: priceDecimal || fillPrice,
        qty,
        filledQty: qty,
        avgFillPrice: fillPrice,
        leverage: lev,
        marginMode: mode,
        reduceOnly: !!reduceOnly,
        stopPrice: stopLoss ? new Prisma.Decimal(stopLoss) : new Prisma.Decimal(0),
        triggerPrice: takeProfit ? new Prisma.Decimal(takeProfit) : new Prisma.Decimal(0),
        clientOrderId: clientOrderId || null,
        status: 'filled',
        source: 'api',
      }, tx);

      return { order: createdOrder, position };
    });

    return success(formatOrder(order));
  } catch (e: any) {
    return handleApiError(e, 'api:perp/orders place');
  }
}

function formatOrder(order: any) {
  return {
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
    positionId: order.positionId ?? null,
    createdAt: order.createdAt.getTime(),
    updatedAt: order.updatedAt.getTime(),
  };
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
    return handleApiError(e, 'api:perp/orders cancel');
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
    return handleApiError(e, 'api:perp/orders cancel-all');
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
    return handleApiError(e, 'api:perp/orders admin list');
  }
}
