/**
 * FJN Revenue Service REST API
 * /api/v1/fjn/revenue
 *
 * 文档：H022 §6
 *
 * 支持的 actions:
 *  - GET  ?action=list            列出分账
 *  - GET  ?action=detail&id=xxx   分账详情
 *  - GET  ?action=pool-list       列出分账池
 *  - GET  ?action=ledger-list     列出账本流水
 *  - GET  ?action=stats           统计概览
 *  - POST action=allocate         触发分账（admin）
 *  - POST action=settle           结算分账（admin）
 *  - POST action=reverse          冲销分账（admin）
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError, created } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { logger } from '@/lib/logger';
import { FjnRevenueService } from '@/lib/fjn/services/revenue-service';
import { calculateWine369Revenue } from '@/lib/fjn/decimal';
import { prisma } from '@/lib/prisma';
import { FjnError } from '@/lib/fjn/errors';

// 强制动态路由：使用 nextUrl.searchParams 必须开启
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'list':
      return withAuth(req, (ctx) => listAllocations(req, ctx.userId));
    case 'detail':
      return withAuth(req, (ctx) => getAllocationDetail(req, ctx.userId));
    case 'pool-list':
      return withAuth(req, () => listPools(req));
    case 'ledger-list':
      return withAuth(req, (ctx) => listLedger(req, ctx.userId));
    case 'stats':
      return withAuth(req, (ctx) => getStats(req, ctx.userId));
    case 'preview-369':
      return withAuth(req, () => previewWine369(req));
    default:
      return badRequest('Invalid action. Supported: list, detail, pool-list, ledger-list, stats, preview-369');
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'allocate':
      return withAdminAuth(req, (ctx) => allocate(req, ctx.userId));
    case 'settle':
      return withAdminAuth(req, (ctx) => settle(req, ctx.userId));
    case 'reverse':
      return withAdminAuth(req, (ctx) => reverse(req, ctx.userId));
    default:
      return badRequest('Invalid action. Supported: allocate, settle, reverse');
  }
}

async function listAllocations(req: NextRequest, userId: string) {
  try {
    const p = req.nextUrl.searchParams;
    const page = parseInt(p.get('page') || '1');
    const pageSize = parseInt(p.get('pageSize') || '20');
    const status = p.get('status') || undefined;
    const orderId = p.get('orderId') || undefined;

    const where: any = {};
    if (status) where.status = status;
    if (orderId) where.orderId = orderId;

    const [items, total] = await Promise.all([
      prisma.fjnRevenueAllocation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.fjnRevenueAllocation.count({ where }),
    ]);

    return success({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/revenue list');
  }
}

async function getAllocationDetail(req: NextRequest, userId: string) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');

  try {
    const allocation = await prisma.fjnRevenueAllocation.findUnique({
      where: { id },
      include: { items: true, reversals: true },
    });
    if (!allocation) return notFound('Allocation not found');
    return success(allocation);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/revenue detail');
  }
}

async function listPools(req: NextRequest) {
  try {
    // 注：FJN Revenue 没有独立的 Pool 表（由 fjnRevenueAllocationItem 表达）
    // 此处返回 369 分账项作为池子快照
    const p = req.nextUrl.searchParams;
    const poolType = p.get('poolType') || undefined;
    const where: any = {};
    if (poolType) where.poolType = poolType;
    const items = await prisma.fjnRevenueAllocationItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return success({ items, total: items.length });
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/revenue pool-list');
  }
}

async function listLedger(req: NextRequest, userId: string) {
  try {
    // 注：FJN Revenue 没有独立的 Ledger 表（由 fjnRevenueAllocation + items 表达）
    const p = req.nextUrl.searchParams;
    const page = parseInt(p.get('page') || '1');
    const pageSize = parseInt(p.get('pageSize') || '20');
    const allocationId = p.get('allocationId') || undefined;
    const where: any = {};
    if (allocationId) where.allocationId = allocationId;

    const [items, total] = await Promise.all([
      prisma.fjnRevenueAllocationItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.fjnRevenueAllocationItem.count({ where }),
    ]);
    return success({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/revenue ledger-list');
  }
}

async function getStats(req: NextRequest, userId: string) {
  try {
    const [allocations, settled, totalRevenue] = await Promise.all([
      prisma.fjnRevenueAllocation.count(),
      prisma.fjnRevenueAllocation.count({ where: { status: 'settled' } }),
      prisma.fjnRevenueAllocation.aggregate({
        _sum: { paidAmount: true },
        where: { status: 'settled' },
      }),
    ]);
    return success({
      totalAllocations: allocations,
      settledAllocations: settled,
      totalRevenue: totalRevenue._sum.paidAmount?.toString() ?? '0',
    });
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/revenue stats');
  }
}

async function previewWine369(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const paidAmount = p.get('paidAmount');
    const taxAmount = p.get('taxAmount') || '0';
    const currency = p.get('currency') || 'CNY';
    if (!paidAmount) return badRequest('Missing paidAmount');
    const result = calculateWine369Revenue({ paidAmount, taxAmount, currency, ruleVersion: 'v3.6.9' });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/revenue preview-369');
  }
}

async function allocate(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { orderId, orderNo, userId, productType, paidAmount, currency, taxAmount, ruleVersion } = body;
    if (!orderId || !orderNo || !userId || !productType || !paidAmount || !currency) {
      return badRequest('Missing required: orderId, orderNo, userId, productType, paidAmount, currency');
    }
    const svc = new FjnRevenueService();
    const result = await svc.createAllocation({
      orderId,
      orderNo,
      userId,
      productType,
      paidAmount,
      taxAmount: taxAmount ?? '0',
      currency,
      ruleVersion: ruleVersion ?? 'v3.6.9',
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/revenue allocate');
  }
}

async function settle(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { allocationId, reviewNote } = body;
    if (!allocationId) return badRequest('Missing required: allocationId');
    const svc = new FjnRevenueService();
    // 管理后台"结算"= 一步走完 审核通过(calculated/risk_checking -> approved) + 标记已结算(approved -> settled)
    // reviewerId 使用已认证的管理员 ctx.userId（真实 UUID），不信任客户端传入值，避免写入 approvedBy(Uuid) 列时类型不匹配
    await svc.approve(allocationId, { reviewerId: operatorId, reviewNote });
    const result = await svc.markSettled(allocationId, operatorId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/revenue settle');
  }
}

async function reverse(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { originalAllocationId, orderId, reason } = body;
    if (!originalAllocationId || !orderId || !reason) {
      return badRequest('Missing required: originalAllocationId, orderId, reason');
    }
    const svc = new FjnRevenueService();
    const result = await svc.createReversal({ originalAllocationId, orderId, reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/revenue reverse');
  }
}
