/**
 * FJN Order Service REST API
 * /api/v1/fjn/order
 *
 * 文档：H020
 *
 * 端点：
 *  - GET  ?action=list                列出订单（多维过滤 + 分页）
 *  - GET  ?action=detail&id=xxx       订单详情（含商品行）
 *  - POST action=cancel               取消订单 (admin)
 *  - POST action=confirm              确认订单 (admin)
 *  - POST action=mark-refunded        标记已退款 (admin)
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAdminAuth } from '@/lib/api/middleware';
import { FjnOrderService } from '@/lib/fjn/services/order-service';
import { FjnError } from '@/lib/fjn/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'list':
      return withAdminAuth(req, () => listOrders(req));
    case 'detail':
      return withAdminAuth(req, () => getOrderDetail(req));
    default:
      return badRequest('Invalid action. Supported (GET): list, detail');
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'cancel':
      return withAdminAuth(req, (ctx) => cancelOrder(req, ctx.userId));
    case 'confirm':
      return withAdminAuth(req, (ctx) => confirmOrder(req, ctx.userId));
    default:
      return badRequest('Invalid action. Supported (POST): cancel, confirm');
  }
}

async function listOrders(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const status = p.get('status') || undefined;
  const orderType = p.get('orderType') || undefined;
  const orderNo = p.get('orderNo') || undefined;
  const userId = p.get('userId') || undefined;
  try {
    const svc = new FjnOrderService();
    const result = await svc.list({ status, orderType, orderNo, userId, page, pageSize } as any);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/order list');
  }
}

async function getOrderDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnOrderService();
    const order = await svc.findById(id, { include: { items: true } as any });
    if (!order) return notFound('Order not found');
    return success(order);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/order detail');
  }
}

async function cancelOrder(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { orderId, reason } = body;
    if (!orderId || !reason) return badRequest('Missing required: orderId, reason');
    const svc = new FjnOrderService();
    const result = await svc.cancel({ orderId, reason, operatorId, operatorType: 'admin' });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/order cancel');
  }
}

async function confirmOrder(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { orderId } = body;
    if (!orderId) return badRequest('Missing required: orderId');
    const svc = new FjnOrderService();
    const result = await svc.confirm({ orderId, operatorId } as any);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/order confirm');
  }
}
