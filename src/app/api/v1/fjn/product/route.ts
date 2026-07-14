/**
 * FJN Product Service REST API
 * /api/v1/fjn/product
 *
 * 文档：H019
 *
 * 端点：
 *  - GET  ?action=list                列出商品（多维过滤 + 分页）
 *  - GET  ?action=detail&id=xxx       商品详情
 *  - POST action=create               创建商品 (admin)
 *  - POST action=update               更新商品 (admin)
 *  - POST action=submit-review        提交审核 (admin)
 *  - POST action=review               审核通过/拒绝 (admin)
 *  - POST action=list-product         上架 (admin)
 *  - POST action=delist               下架 (admin)
 *  - POST action=pause                暂停 (admin)
 *  - POST action=resume               恢复 (admin)
 *  - POST action=archive              归档 (admin)
 *  - POST action=adjust-stock         调整库存 (admin)
 *  - POST action=delete               软删除 (admin)
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAdminAuth } from '@/lib/api/middleware';
import { FjnProductService } from '@/lib/fjn/services/product-service';
import { FjnError } from '@/lib/fjn/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'list':
      return withAdminAuth(req, () => listProducts(req));
    case 'detail':
      return withAdminAuth(req, () => getProductDetail(req));
    default:
      return badRequest('Invalid action. Supported (GET): list, detail');
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'create':
      return withAdminAuth(req, (ctx) => createProduct(req, ctx.userId));
    case 'update':
      return withAdminAuth(req, (ctx) => updateProduct(req, ctx.userId));
    case 'submit-review':
      return withAdminAuth(req, (ctx) => submitForReview(req, ctx.userId));
    case 'review':
      return withAdminAuth(req, (ctx) => reviewProduct(req, ctx.userId));
    case 'list-product':
      return withAdminAuth(req, (ctx) => listProductOnShelf(req, ctx.userId));
    case 'delist':
      return withAdminAuth(req, (ctx) => delistProduct(req, ctx.userId));
    case 'pause':
      return withAdminAuth(req, (ctx) => pauseProduct(req, ctx.userId));
    case 'resume':
      return withAdminAuth(req, (ctx) => resumeProduct(req, ctx.userId));
    case 'archive':
      return withAdminAuth(req, (ctx) => archiveProduct(req, ctx.userId));
    case 'adjust-stock':
      return withAdminAuth(req, (ctx) => adjustStock(req, ctx.userId));
    case 'delete':
      return withAdminAuth(req, (ctx) => deleteProduct(req, ctx.userId));
    default:
      return badRequest('Invalid action. Supported (POST): create, update, submit-review, review, list-product, delist, pause, resume, archive, adjust-stock, delete');
  }
}

async function listProducts(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const productType = p.get('productType') || undefined;
  const status = p.get('status') || undefined;
  const search = p.get('search') || undefined;
  try {
    const svc = new FjnProductService();
    const result = await svc.list({ productType, status, search, page, pageSize } as any);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/product list');
  }
}

async function getProductDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnProductService();
    const product = await svc.findById(id);
    if (!product) return notFound('Product not found');
    return success(product);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/product detail');
  }
}

async function createProduct(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { productType, name, subtitle, description, price, currency, costPrice, stock, imageUrl, metadata } = body;
    if (!productType || !name || !price) return badRequest('Missing required: productType, name, price');
    const svc = new FjnProductService();
    const result = await svc.create({
      productType,
      name,
      subtitle,
      description,
      price: String(price),
      currency,
      costPrice: costPrice != null ? String(costPrice) : undefined,
      stock,
      imageUrl,
      metadata,
      operatorId: userId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/product create');
  }
}

async function updateProduct(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { id, name, subtitle, description, price, costPrice, stock, imageUrl, metadata } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnProductService();
    const result = await svc.update(id, {
      name,
      subtitle,
      description,
      price: price != null ? String(price) : undefined,
      costPrice: costPrice != null ? String(costPrice) : undefined,
      stock,
      imageUrl,
      metadata,
      operatorId: userId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/product update');
  }
}

async function submitForReview(req: NextRequest, userId: string) {
  try {
    const { id } = await req.json();
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnProductService();
    const result = await svc.submitForReview(id, userId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/product submit-review');
  }
}

async function reviewProduct(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { id, approved, reason } = body;
    if (!id || approved == null) return badRequest('Missing required: id, approved');
    const svc = new FjnProductService();
    const result = await svc.review({ productId: id, approved, reason, operatorId: userId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/product review');
  }
}

async function listProductOnShelf(req: NextRequest, userId: string) {
  try {
    const { id } = await req.json();
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnProductService();
    const result = await svc.listProduct(id, userId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/product list-product');
  }
}

async function delistProduct(req: NextRequest, userId: string) {
  try {
    const { id, reason } = await req.json();
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnProductService();
    const result = await svc.delistProduct(id, reason, userId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/product delist');
  }
}

async function pauseProduct(req: NextRequest, userId: string) {
  try {
    const { id, reason } = await req.json();
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnProductService();
    const result = await svc.pauseProduct(id, reason, userId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/product pause');
  }
}

async function resumeProduct(req: NextRequest, userId: string) {
  try {
    const { id } = await req.json();
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnProductService();
    const result = await svc.resumeProduct(id, userId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/product resume');
  }
}

async function archiveProduct(req: NextRequest, userId: string) {
  try {
    const { id, reason } = await req.json();
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnProductService();
    const result = await svc.archiveProduct(id, reason, userId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/product archive');
  }
}

async function adjustStock(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { productId, delta, changeType, note } = body;
    if (!productId || delta == null || !changeType) return badRequest('Missing required: productId, delta, changeType');
    const svc = new FjnProductService();
    const result = await svc.adjustStock({ productId, delta, changeType, note, operatorId: userId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/product adjust-stock');
  }
}

async function deleteProduct(req: NextRequest, userId: string) {
  try {
    const { id } = await req.json();
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnProductService();
    await svc.softDelete(id, userId);
    return success({ id, deleted: true });
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/product delete');
  }
}
