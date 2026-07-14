/**
 * FJN Team Service REST API
 * /api/v1/fjn/team
 *
 * 文档：H029 §6
 *
 * 支持的 actions:
 *  - GET  ?action=list                  列出团队奖励
 *  - GET  ?action=detail&id=xxx         奖励详情
 *  - GET  ?action=by-order&orderId      按订单查询奖励
 *  - GET  ?action=structures            列出团队结构
 *  - GET  ?action=service-records       列出服务记录
 *  - GET  ?action=stats                 统计概览
 *  - POST action=create                 创建团队奖励（admin）
 *  - POST action=approve                审核通过
 *  - POST action=recover                追回
 *  - POST action=cancel                 取消
 *  - POST action=create-structure       创建团队结构
 *  - POST action=submit-service-record  提交服务记录
 *  - POST action=review-service-record  审核服务记录
 *  - POST action=handle-order-paid      OrderPaid 联动入口
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError, created } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { logger } from '@/lib/logger';
import { FjnTeamService } from '@/lib/fjn/services/team-service';
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
    case 'structures':
      return withAuth(req, (ctx) => listStructures(req, ctx.userId));
    case 'service-records':
      return withAuth(req, (ctx) => listServiceRecords(req, ctx.userId));
    case 'stats':
      return withAuth(req, (ctx) => getStats(req, ctx.userId));
    default:
      return badRequest('Invalid action. Supported: list, detail, by-order, structures, service-records, stats');
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
    case 'create-structure':
      return withAdminAuth(req, (ctx) => createStructure(req, ctx.userId));
    case 'submit-service-record':
      return withAuth(req, (ctx) => submitServiceRecord(req, ctx.userId));
    case 'review-service-record':
      return withAdminAuth(req, (ctx) => reviewServiceRecord(req, ctx.userId));
    case 'handle-order-paid':
      return withAdminAuth(req, (ctx) => handleOrderPaid(req, ctx.userId));
    default:
      return badRequest('Invalid action. Supported: create, approve, recover, cancel, create-structure, submit-service-record, review-service-record, handle-order-paid');
  }
}

async function listRewards(req: NextRequest, userId: string) {
  try {
    const p = req.nextUrl.searchParams;
    const page = parseInt(p.get('page') || '1');
    const pageSize = parseInt(p.get('pageSize') || '20');
    const svc = new FjnTeamService();
    const result = await svc.listRewards({
      userId: p.get('userId') || undefined,
      orderUserId: p.get('orderUserId') || undefined,
      teamLevel: (p.get('teamLevel') as any) || undefined,
      status: (p.get('status') as any) || undefined,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/team list');
  }
}

async function getRewardDetail(req: NextRequest, userId: string) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnTeamService();
    const reward = await svc.findRewardById(id);
    if (!reward) return notFound('Reward not found');
    return success(reward);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/team detail');
  }
}

async function getByOrder(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId');
  if (!orderId) return badRequest('Missing orderId');
  try {
    const svc = new FjnTeamService();
    const rewards = await svc.findRewardsByOrderId(orderId);
    return success({ items: rewards, total: rewards.length });
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/team by-order');
  }
}

async function listStructures(req: NextRequest, userId: string) {
  try {
    const p = req.nextUrl.searchParams;
    const page = parseInt(p.get('page') || '1');
    const pageSize = parseInt(p.get('pageSize') || '20');
    const svc = new FjnTeamService();
    const result = await svc.listStructures({
      userId: p.get('userId') || undefined,
      uplineId: p.get('uplineId') || undefined,
      status: (p.get('status') as any) || undefined,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/team structures');
  }
}

async function listServiceRecords(req: NextRequest, userId: string) {
  try {
    const p = req.nextUrl.searchParams;
    const page = parseInt(p.get('page') || '1');
    const pageSize = parseInt(p.get('pageSize') || '20');
    const svc = new FjnTeamService();
    const result = await svc.listServiceRecords({
      userId: p.get('userId') || undefined,
      serviceType: p.get('serviceType') || undefined,
      status: (p.get('status') as any) || undefined,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/team service-records');
  }
}

async function getStats(req: NextRequest, userId: string) {
  try {
    const [total, byLevel, totalAmount] = await Promise.all([
      prisma.fjnTeamReward.count(),
      prisma.fjnTeamReward.groupBy({ by: ['teamLevel'], _count: true, _sum: { rewardAmount: true } }),
      prisma.fjnTeamReward.aggregate({ _sum: { rewardAmount: true } }),
    ]);
    return success({ total, byLevel, totalRewardAmount: totalAmount._sum.rewardAmount?.toString() ?? '0' });
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/team stats');
  }
}

async function createReward(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { orderId, orderUserId, orderAmount, currency, teamLevel, rewardRate, taxRate } = body;
    if (!orderId || !orderUserId || !orderAmount || !currency || !teamLevel) {
      return badRequest('Missing required: orderId, orderUserId, orderAmount, currency, teamLevel');
    }
    const svc = new FjnTeamService();
    const result = await svc.createReward({
      orderId,
      orderUserId,
      teamLevel,
      rewardRate,
      orderAmount,
      currency,
      taxRate,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/team create');
  }
}

async function approveReward(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { rewardId, reviewerId, reviewNote } = body;
    if (!rewardId || !reviewerId) return badRequest('Missing required: rewardId, reviewerId');
    const svc = new FjnTeamService();
    const result = await svc.approve(rewardId, { reviewerId, reviewNote });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/team approve');
  }
}

async function recoverReward(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { rewardId, reason, approvalId } = body;
    if (!rewardId || !reason) return badRequest('Missing required: rewardId, reason');
    const svc = new FjnTeamService();
    const result = await svc.recover(rewardId, { reason, approvalId, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/team recover');
  }
}

async function cancelReward(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { rewardId, reason } = body;
    if (!rewardId || !reason) return badRequest('Missing required: rewardId, reason');
    const svc = new FjnTeamService();
    const result = await svc.cancel(rewardId, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/team cancel');
  }
}

async function createStructure(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { userId, uplineId } = body;
    if (!userId) return badRequest('Missing required: userId');
    const svc = new FjnTeamService();
    const result = await svc.createStructure({
      userId,
      uplineId,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/team create-structure');
  }
}

async function submitServiceRecord(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { serviceType, title, description, evidence, serviceDate, durationHours } = body;
    if (!serviceType || !title || !serviceDate || !durationHours) {
      return badRequest('Missing required: serviceType, title, serviceDate, durationHours');
    }
    const svc = new FjnTeamService();
    const result = await svc.submitServiceRecord({
      userId,
      serviceType,
      title,
      description,
      evidence,
      serviceDate: new Date(serviceDate),
      durationHours,
      operatorId: userId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/team submit-service-record');
  }
}

async function reviewServiceRecord(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { recordId, approved, reviewNote } = body;
    if (!recordId || approved === undefined) return badRequest('Missing required: recordId, approved');
    const svc = new FjnTeamService();
    const result = await svc.reviewServiceRecord(recordId, {
      reviewerId: operatorId,
      approved: Boolean(approved),
      reviewNote,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/team review-service-record');
  }
}

async function handleOrderPaid(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { orderId, orderUserId, orderAmount, currency } = body;
    if (!orderId || !orderUserId || !orderAmount || !currency) {
      return badRequest('Missing required: orderId, orderUserId, orderAmount, currency');
    }
    const svc = new FjnTeamService();
    const result = await svc.handleOrderPaid({
      orderId,
      orderUserId,
      orderAmount,
      currency,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/team handle-order-paid');
  }
}
