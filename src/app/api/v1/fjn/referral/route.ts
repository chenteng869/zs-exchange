/**
 * FJN Referral Service REST API
 * /api/v1/fjn/referral
 *
 * 文档：H028 §6
 *
 * 支持的 actions:
 *  - GET  ?action=list              列出推荐奖励
 *  - GET  ?action=detail&id=xxx     奖励详情
 *  - GET  ?action=by-order&orderId  按订单查询奖励
 *  - GET  ?action=bindings          列出推荐关系
 *  - GET  ?action=stats             统计概览
 *  - POST action=create             创建推荐奖励（admin）
 *  - POST action=approve            审核通过
 *  - POST action=recover            追回
 *  - POST action=cancel             取消
 *  - POST action=bind               创建推荐关系
 *  - POST action=handle-order-paid  OrderPaid 联动入口
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError, created } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { logger } from '@/lib/logger';
import { FjnReferralService } from '@/lib/fjn/services/referral-service';
import { prisma } from '@/lib/prisma';
import { FjnError } from '@/lib/fjn/errors';

// 强制动态路由：使用 nextUrl.searchParams 必须开启
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'list':
      return withAuth(req, (ctx) => listRewards(req, ctx.userId));
    case 'detail':
      return withAuth(req, (ctx) => getRewardDetail(req, ctx.userId));
    case 'by-order':
      return withAuth(req, () => getByOrder(req));
    case 'bindings':
      return withAuth(req, (ctx) => listBindings(req, ctx.userId));
    case 'stats':
      return withAuth(req, (ctx) => getStats(req, ctx.userId));
    default:
      return badRequest('Invalid action. Supported: list, detail, by-order, bindings, stats');
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'create':
      return withAdminAuth(req, (ctx) => createReward(req, ctx.userId));
    case 'approve':
      return withAdminAuth(req, (ctx) => approveReward(req, ctx.userId));
    case 'recover':
      return withAdminAuth(req, (ctx) => recoverReward(req, ctx.userId));
    case 'cancel':
      return withAdminAuth(req, (ctx) => cancelReward(req, ctx.userId));
    case 'bind':
      return withAdminAuth(req, (ctx) => createBinding(req, ctx.userId));
    case 'handle-order-paid':
      return withAdminAuth(req, (ctx) => handleOrderPaid(req, ctx.userId));
    default:
      return badRequest('Invalid action. Supported: create, approve, recover, cancel, bind, handle-order-paid');
  }
}

async function listRewards(req: NextRequest, userId: string) {
  try {
    const p = req.nextUrl.searchParams;
    const page = parseInt(p.get('page') || '1');
    const pageSize = parseInt(p.get('pageSize') || '20');
    const status = p.get('status') || undefined;
    const svc = new FjnReferralService();
    const result = await svc.listRewards({
      userId: p.get('userId') || undefined,
      orderUserId: p.get('orderUserId') || undefined,
      status: status as any,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/referral list');
  }
}

async function getRewardDetail(req: NextRequest, userId: string) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnReferralService();
    const reward = await svc.findRewardById(id);
    if (!reward) return notFound('Reward not found');
    return success(reward);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/referral detail');
  }
}

async function getByOrder(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId');
  if (!orderId) return badRequest('Missing orderId');
  try {
    const svc = new FjnReferralService();
    const reward = await svc.findRewardByOrderId(orderId);
    if (!reward) return notFound('No reward for this order');
    return success(reward);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/referral by-order');
  }
}

async function listBindings(req: NextRequest, userId: string) {
  try {
    const p = req.nextUrl.searchParams;
    const page = parseInt(p.get('page') || '1');
    const pageSize = parseInt(p.get('pageSize') || '20');
    const svc = new FjnReferralService();
    const result = await svc.listBindings({
      userId: p.get('userId') || undefined,
      referrerId: p.get('referrerId') || undefined,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/referral bindings');
  }
}

async function getStats(req: NextRequest, userId: string) {
  try {
    const [total, byStatus, totalAmount] = await Promise.all([
      prisma.fjnReferralReward.count(),
      prisma.fjnReferralReward.groupBy({ by: ['status'], _count: true }),
      prisma.fjnReferralReward.aggregate({ _sum: { rewardAmount: true } }),
    ]);
    return success({
      total,
      byStatus,
      totalRewardAmount: totalAmount._sum.rewardAmount?.toString() ?? '0',
    });
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/referral stats');
  }
}

async function createReward(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { orderId, orderUserId, userId, orderAmount, currency, rewardRate, lockDays, taxRate } = body;
    if (!orderId || !orderUserId || !userId || !orderAmount || !currency) {
      return badRequest('Missing required: orderId, orderUserId, userId, orderAmount, currency');
    }
    const svc = new FjnReferralService();
    const result = await svc.createReward({
      orderId,
      orderUserId,
      userId,
      orderAmount,
      currency,
      rewardRate: rewardRate ?? '0.10',
      lockDays: lockDays ?? 30,
      taxRate: taxRate ?? '0',
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/referral create');
  }
}

async function approveReward(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { rewardId, reviewerId, reviewNote } = body;
    if (!rewardId || !reviewerId) return badRequest('Missing required: rewardId, reviewerId');
    const svc = new FjnReferralService();
    const result = await svc.approve(rewardId, { reviewerId, reviewNote });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/referral approve');
  }
}

async function recoverReward(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { rewardId, reason, approvalId } = body;
    if (!rewardId || !reason) return badRequest('Missing required: rewardId, reason');
    const svc = new FjnReferralService();
    const result = await svc.recover(rewardId, { reason, approvalId, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/referral recover');
  }
}

async function cancelReward(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { rewardId, reason } = body;
    if (!rewardId || !reason) return badRequest('Missing required: rewardId, reason');
    const svc = new FjnReferralService();
    const result = await svc.cancel(rewardId, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/referral cancel');
  }
}

async function createBinding(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { userId, referrerId, referrerCode, level, bindSource, bindIp, bindDeviceId, metadata } = body;
    if (!userId || !referrerId || !bindSource) {
      return badRequest('Missing required: userId, referrerId, bindSource');
    }
    const svc = new FjnReferralService();
    const result = await svc.createBinding({
      userId,
      referrerId,
      referrerCode,
      level: level ?? 1,
      bindSource,
      bindIp,
      bindDeviceId,
      metadata,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/referral bind');
  }
}

async function handleOrderPaid(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { orderId, orderUserId, orderAmount, currency } = body;
    if (!orderId || !orderUserId || !orderAmount || !currency) {
      return badRequest('Missing required: orderId, orderUserId, orderAmount, currency');
    }
    const svc = new FjnReferralService();
    const result = await svc.handleOrderPaid({
      orderId,
      orderUserId,
      orderAmount,
      currency,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/referral handle-order-paid');
  }
}
