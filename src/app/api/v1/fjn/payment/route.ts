/**
 * FJN Payment Service REST API
 * /api/v1/fjn/payment
 *
 * 文档：H021
 *
 * 端点：
 *  - GET  ?action=list                支付单列表（多维过滤 + 分页）
 *  - GET  ?action=detail&id=xxx       支付单详情
 *  - GET  ?action=refund-list         退款单列表
 *  - POST action=approve-refund       批准退款 (admin)
 *  - POST action=reject-refund        拒绝退款 (admin)
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAdminAuth } from '@/lib/api/middleware';
import { FjnPaymentService } from '@/lib/fjn/services/payment-service';
import { FjnError } from '@/lib/fjn/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'list':
      return withAdminAuth(req, () => listPayments(req));
    case 'detail':
      return withAdminAuth(req, () => getPaymentDetail(req));
    case 'refund-list':
      return withAdminAuth(req, () => listRefunds(req));
    default:
      return badRequest('Invalid action. Supported (GET): list, detail, refund-list');
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'approve-refund':
      return withAdminAuth(req, (ctx) => approveRefund(req, ctx.userId));
    case 'reject-refund':
      return withAdminAuth(req, (ctx) => rejectRefund(req, ctx.userId));
    default:
      return badRequest('Invalid action. Supported (POST): approve-refund, reject-refund');
  }
}

async function listPayments(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const orderId = p.get('orderId') || undefined;
  const userId = p.get('userId') || undefined;
  const status = (p.get('status') as any) || undefined;
  const paymentMethod = (p.get('paymentMethod') as any) || undefined;
  try {
    const svc = new FjnPaymentService();
    const result = await svc.list({ orderId, userId, status, paymentMethod, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/payment list');
  }
}

async function getPaymentDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnPaymentService();
    const payment = await svc.findById(id);
    if (!payment) return notFound('Payment not found');
    return success(payment);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/payment detail');
  }
}

async function listRefunds(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const orderId = p.get('orderId') || undefined;
  const userId = p.get('userId') || undefined;
  const status = (p.get('status') as any) || undefined;
  try {
    const svc = new FjnPaymentService();
    const result = await svc.listRefunds({ orderId, userId, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/payment refund-list');
  }
}

async function approveRefund(req: NextRequest, reviewerId: string) {
  try {
    const body = await req.json();
    const { refundId, reviewNote } = body;
    if (!refundId) return badRequest('Missing required: refundId');
    const svc = new FjnPaymentService();
    const result = await svc.approveRefund({ refundId, reviewerId, reviewNote });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/payment approve-refund');
  }
}

async function rejectRefund(req: NextRequest, reviewerId: string) {
  try {
    const body = await req.json();
    const { refundId, reviewNote } = body;
    if (!refundId || !reviewNote) return badRequest('Missing required: refundId, reviewNote');
    const svc = new FjnPaymentService();
    const result = await svc.rejectRefund({ refundId, reviewerId, reviewNote });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/payment reject-refund');
  }
}
