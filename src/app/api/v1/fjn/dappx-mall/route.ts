/**
 * FJN DAppX Mall Service REST API
 * /api/v1/fjn/dappx-mall
 *
 * 文档：H015 §3.16
 *
 * 端点：
 *  - GET  ?action=merchant-list           商户列表
 *  - GET  ?action=product-list            商品列表
 *  - GET  ?action=order-list              订单列表
 *  - GET  ?action=coupon-list             优惠券列表
 *  - GET  ?action=settlement-list         结算列表
 *  - POST action=merchant-status          变更商户状态 (admin)
 *  - POST action=merchant-approve-kyb     批准商户 KYB (admin)
 *  - POST action=product-status           变更商品状态 (admin)
 *  - POST action=order-ship               订单发货 (admin)
 *  - POST action=order-confirm            确认订单 (admin)
 *  - POST action=order-cancel             取消订单 (admin)
 *  - POST action=coupon-status            变更优惠券状态 (admin)
 *  - POST action=settlement-approve       批准结算 (admin)
 *  - POST action=settlement-pay           支付结算 (admin)
 */

import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAdminAuth } from '@/lib/api/middleware';
import { FjnDappxMallService } from '@/lib/fjn/services/dappx-mall-service';
import { FjnError } from '@/lib/fjn/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'merchant-list':
      return withAdminAuth(req, () => listMerchants(req));
    case 'product-list':
      return withAdminAuth(req, () => listProducts(req));
    case 'order-list':
      return withAdminAuth(req, () => listOrders(req));
    case 'coupon-list':
      return withAdminAuth(req, () => listCoupons(req));
    case 'settlement-list':
      return withAdminAuth(req, () => listSettlements(req));
    default:
      return badRequest('Invalid action. Supported (GET): merchant-list, product-list, order-list, coupon-list, settlement-list');
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'merchant-status':
      return withAdminAuth(req, (ctx) => changeMerchantStatus(req, ctx.userId));
    case 'merchant-approve-kyb':
      return withAdminAuth(req, (ctx) => approveMerchantKyb(req, ctx.userId));
    case 'product-status':
      return withAdminAuth(req, (ctx) => changeProductStatus(req, ctx.userId));
    case 'order-ship':
      return withAdminAuth(req, (ctx) => shipOrder(req, ctx.userId));
    case 'order-confirm':
      return withAdminAuth(req, (ctx) => confirmOrder(req, ctx.userId));
    case 'order-cancel':
      return withAdminAuth(req, (ctx) => cancelOrder(req, ctx.userId));
    case 'coupon-status':
      return withAdminAuth(req, (ctx) => changeCouponStatus(req, ctx.userId));
    case 'settlement-approve':
      return withAdminAuth(req, (ctx) => approveSettlement(req, ctx.userId));
    case 'settlement-pay':
      return withAdminAuth(req, (ctx) => paySettlement(req, ctx.userId));
    default:
      return badRequest('Invalid action. Supported (POST): merchant-status, merchant-approve-kyb, product-status, order-ship, order-confirm, order-cancel, coupon-status, settlement-approve, settlement-pay');
  }
}

async function listMerchants(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const status = (p.get('status') as any) || undefined;
  const category = (p.get('category') as any) || undefined;
  const search = p.get('search') || undefined;
  try {
    const svc = new FjnDappxMallService();
    const result = await svc.listMerchants({ status, category, search, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/dappx-mall merchant-list');
  }
}

async function listProducts(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const merchantId = p.get('merchantId') || undefined;
  const status = (p.get('status') as any) || undefined;
  const search = p.get('search') || undefined;
  try {
    const svc = new FjnDappxMallService();
    const result = await svc.listProducts({ merchantId, status, search, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/dappx-mall product-list');
  }
}

async function listOrders(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const userId = p.get('userId') || undefined;
  const merchantId = p.get('merchantId') || undefined;
  const status = (p.get('status') as any) || undefined;
  try {
    const svc = new FjnDappxMallService();
    const result = await svc.listOrders({ userId, merchantId, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/dappx-mall order-list');
  }
}

async function listCoupons(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const status = (p.get('status') as any) || undefined;
  try {
    const svc = new FjnDappxMallService();
    const result = await svc.listCoupons({ status, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/dappx-mall coupon-list');
  }
}

async function listSettlements(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const merchantId = p.get('merchantId') || undefined;
  const status = (p.get('status') as any) || undefined;
  try {
    const svc = new FjnDappxMallService();
    const result = await svc.listSettlements({ merchantId, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/dappx-mall settlement-list');
  }
}

async function changeMerchantStatus(req: NextRequest, operatorId: string) {
  try {
    const { merchantId, toStatus, reason } = await req.json();
    if (!merchantId || !toStatus) return badRequest('Missing required: merchantId, toStatus');
    const svc = new FjnDappxMallService();
    const result = await svc.changeMerchantStatus({ merchantId, toStatus, reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/dappx-mall merchant-status');
  }
}

async function approveMerchantKyb(req: NextRequest, operatorId: string) {
  try {
    const { merchantId } = await req.json();
    if (!merchantId) return badRequest('Missing required: merchantId');
    const svc = new FjnDappxMallService();
    const result = await svc.approveKyb(merchantId, operatorId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/dappx-mall merchant-approve-kyb');
  }
}

async function changeProductStatus(req: NextRequest, operatorId: string) {
  try {
    const { productId, toStatus, reason } = await req.json();
    if (!productId || !toStatus) return badRequest('Missing required: productId, toStatus');
    const svc = new FjnDappxMallService();
    const result = await svc.changeProductStatus({ productId, toStatus, reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/dappx-mall product-status');
  }
}

async function shipOrder(req: NextRequest, operatorId: string) {
  try {
    const { orderId, trackingNo, shippingCompany } = await req.json();
    if (!orderId || !trackingNo || !shippingCompany) return badRequest('Missing required: orderId, trackingNo, shippingCompany');
    const svc = new FjnDappxMallService();
    const result = await svc.shipOrder({ orderId, trackingNo, shippingCompany, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/dappx-mall order-ship');
  }
}

async function confirmOrder(req: NextRequest, operatorId: string) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return badRequest('Missing required: orderId');
    const svc = new FjnDappxMallService();
    const result = await svc.confirmOrder(orderId, operatorId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/dappx-mall order-confirm');
  }
}

async function cancelOrder(req: NextRequest, operatorId: string) {
  try {
    const { orderId, reason } = await req.json();
    if (!orderId) return badRequest('Missing required: orderId');
    const svc = new FjnDappxMallService();
    const result = await svc.cancelOrder(orderId, reason, operatorId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/dappx-mall order-cancel');
  }
}

async function changeCouponStatus(req: NextRequest, operatorId: string) {
  try {
    const { couponId, toStatus, reason } = await req.json();
    if (!couponId || !toStatus) return badRequest('Missing required: couponId, toStatus');
    const svc = new FjnDappxMallService();
    const result = await svc.changeCouponStatus({ couponId, toStatus, reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/dappx-mall coupon-status');
  }
}

async function approveSettlement(req: NextRequest, operatorId: string) {
  try {
    const { settlementId } = await req.json();
    if (!settlementId) return badRequest('Missing required: settlementId');
    const svc = new FjnDappxMallService();
    const result = await svc.approveSettlement({ settlementId, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/dappx-mall settlement-approve');
  }
}

async function paySettlement(req: NextRequest, operatorId: string) {
  try {
    const { settlementId, txSignature } = await req.json();
    if (!settlementId) return badRequest('Missing required: settlementId');
    const svc = new FjnDappxMallService();
    const result = await svc.paySettlement({ settlementId, txSignature, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/dappx-mall settlement-pay');
  }
}
