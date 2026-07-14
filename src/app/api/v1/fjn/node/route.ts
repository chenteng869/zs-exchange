/**
 * FJN Node Service REST API
 * /api/v1/fjn/node
 *
 * 文档：H030（自建，文档缺失基于 schema 补齐）
 *
 * 业务域：
 *  - 节点生命周期：create / approve / activate / suspend / terminate / blacklist
 *  - KYB 审核：submit / approve / reject
 *  - 节点奖励：create / lock / risk / approve / payable / paid / recover / cancel / risk_hold
 *  - 节点服务记录：submit / approve / reject
 *  - OrderPaid 联动入口
 *
 * 支持的 actions:
 *  - GET  ?action=node-list           列出节点
 *  - GET  ?action=node-detail         节点详情
 *  - GET  ?action=node-by-user        按 userId 查询节点
 *  - GET  ?action=reward-list         列出奖励
 *  - GET  ?action=reward-detail       奖励详情
 *  - GET  ?action=reward-by-order     按订单查询奖励
 *  - GET  ?action=service-records     列出服务记录
 *  - GET  ?action=stats               统计概览
 *  - POST action=create-node          创建节点（admin）
 *  - POST action=approve-node         审核通过节点（admin）
 *  - POST action=activate-node        激活节点（admin）
 *  - POST action=suspend-node         暂停节点（admin）
 *  - POST action=terminate-node       终止节点（admin）
 *  - POST action=blacklist-node       黑名单节点（admin）
 *  - POST action=submit-kyb           提交 KYB
 *  - POST action=approve-kyb          审核 KYB（admin）
 *  - POST action=create-reward        创建节点奖励（admin）
 *  - POST action=lock-reward          锁定奖励（admin）
 *  - POST action=start-risk           进入风控（admin）
 *  - POST action=approve-reward       审核通过（admin）
 *  - POST action=mark-payable         转 payable（admin）
 *  - POST action=mark-paid            标记已支付（admin）
 *  - POST action=recover-reward       追回奖励（admin）
 *  - POST action=cancel-reward        取消奖励（admin）
 *  - POST action=risk-hold            风控冻结（admin）
 *  - POST action=submit-service-record    提交服务记录
 *  - POST action=review-service-record    审核服务记录（admin）
 *  - POST action=handle-order-paid        OrderPaid 联动入口（admin）
 */

import { NextRequest } from 'next/server';
import {
  success,
  badRequest,
  notFound,
  serverError,
  created,
} from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { FjnNodeService } from '@/lib/fjn/services/node-service';
import { FjnError } from '@/lib/fjn/errors';

// 强制动态路由：使用 nextUrl.searchParams 必须开启
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================
// GET 路由
// ============================================================

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');

  switch (action) {
    // ---------- 节点域 ----------
    case 'node-list':
      return withAuth(req, (ctx) => listNodes(req, ctx.userId));
    case 'node-detail':
      return withAuth(req, (ctx) => getNodeDetail(req, ctx.userId));
    case 'node-by-user':
      return withAuth(req, (ctx) => getNodeByUser(req, ctx.userId));

    // ---------- 奖励域 ----------
    case 'reward-list':
      return withAuth(req, (ctx) => listRewards(req, ctx.userId));
    case 'reward-detail':
      return withAuth(req, (ctx) => getRewardDetail(req, ctx.userId));
    case 'reward-by-order':
      return withAuth(req, () => getRewardsByOrder(req));

    // ---------- 服务记录域 ----------
    case 'service-records':
      return withAuth(req, (ctx) => listServiceRecords(req, ctx.userId));

    // ---------- 统计 ----------
    case 'stats':
      return withAuth(req, (ctx) => getStats(req, ctx.userId));

    default:
      return badRequest(
        'Invalid action. Supported: node-list, node-detail, node-by-user, reward-list, reward-detail, reward-by-order, service-records, stats',
      );
  }
}

// ============================================================
// POST 路由
// ============================================================

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');

  switch (action) {
    // ---------- 节点生命周期 ----------
    case 'create-node':
      return withAdminAuth(req, (ctx) => createNode(req, ctx.userId));
    case 'approve-node':
      return withAdminAuth(req, (ctx) => approveNode(req, ctx.userId));
    case 'activate-node':
      return withAdminAuth(req, (ctx) => activateNode(req, ctx.userId));
    case 'suspend-node':
      return withAdminAuth(req, (ctx) => suspendNode(req, ctx.userId));
    case 'terminate-node':
      return withAdminAuth(req, (ctx) => terminateNode(req, ctx.userId));
    case 'blacklist-node':
      return withAdminAuth(req, (ctx) => blacklistNode(req, ctx.userId));

    // ---------- KYB ----------
    case 'submit-kyb':
      return withAuth(req, (ctx) => submitKyb(req, ctx.userId));
    case 'approve-kyb':
      return withAdminAuth(req, (ctx) => approveKyb(req, ctx.userId));

    // ---------- 节点奖励状态机 ----------
    case 'create-reward':
      return withAdminAuth(req, (ctx) => createReward(req, ctx.userId));
    case 'lock-reward':
      return withAdminAuth(req, (ctx) => lockReward(req, ctx.userId));
    case 'start-risk':
      return withAdminAuth(req, (ctx) => startRiskCheck(req, ctx.userId));
    case 'approve-reward':
      return withAdminAuth(req, (ctx) => approveReward(req, ctx.userId));
    case 'mark-payable':
      return withAdminAuth(req, (ctx) => markPayable(req, ctx.userId));
    case 'mark-paid':
      return withAdminAuth(req, (ctx) => markPaid(req, ctx.userId));
    case 'recover-reward':
      return withAdminAuth(req, (ctx) => recoverReward(req, ctx.userId));
    case 'cancel-reward':
      return withAdminAuth(req, (ctx) => cancelReward(req, ctx.userId));
    case 'risk-hold':
      return withAdminAuth(req, (ctx) => riskHold(req, ctx.userId));

    // ---------- 服务记录 ----------
    case 'submit-service-record':
      return withAuth(req, (ctx) => submitServiceRecord(req, ctx.userId));
    case 'review-service-record':
      return withAdminAuth(req, (ctx) => reviewServiceRecord(req, ctx.userId));

    // ---------- 联动入口 ----------
    case 'handle-order-paid':
      return withAdminAuth(req, (ctx) => handleOrderPaid(req, ctx.userId));

    default:
      return badRequest(
        'Invalid action. Supported: create-node, approve-node, activate-node, suspend-node, terminate-node, blacklist-node, submit-kyb, approve-kyb, create-reward, lock-reward, start-risk, approve-reward, mark-payable, mark-paid, recover-reward, cancel-reward, risk-hold, submit-service-record, review-service-record, handle-order-paid',
      );
  }
}

// ============================================================
// 节点域 - GET 实现
// ============================================================

async function listNodes(req: NextRequest, userId: string) {
  try {
    const p = req.nextUrl.searchParams;
    const page = parseInt(p.get('page') || '1');
    const pageSize = parseInt(p.get('pageSize') || '20');
    const svc = new FjnNodeService();
    const result = await svc.listNodes({
      userId: p.get('userId') || undefined,
      nodeLevel: (p.get('nodeLevel') as any) || undefined,
      regionCode: p.get('regionCode') || undefined,
      countryCode: p.get('countryCode') || undefined,
      status: (p.get('status') as any) || undefined,
      kybStatus: (p.get('kybStatus') as any) || undefined,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node node-list');
  }
}

async function getNodeDetail(req: NextRequest, userId: string) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnNodeService();
    const node = await svc.findNodeById(id);
    if (!node) return notFound('Node not found');
    return success(node);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node node-detail');
  }
}

async function getNodeByUser(req: NextRequest, userId: string) {
  const userIdParam = req.nextUrl.searchParams.get('userId');
  if (!userIdParam) return badRequest('Missing userId');
  try {
    const svc = new FjnNodeService();
    const node = await svc.findNodeByUserId(userIdParam);
    if (!node) return notFound('Node not found');
    return success(node);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node node-by-user');
  }
}

// ============================================================
// 节点域 - POST 实现
// ============================================================

async function createNode(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const {
      userId,
      nodeName,
      nodeLevel,
      regionCode,
      cityCode,
      countryCode,
      contactName,
      contactPhone,
      contactEmail,
      serviceScope,
    } = body;

    if (
      !userId ||
      !nodeName ||
      !nodeLevel ||
      !regionCode ||
      !countryCode ||
      !contactName ||
      !contactPhone ||
      !contactEmail
    ) {
      return badRequest(
        'Missing required: userId, nodeName, nodeLevel, regionCode, countryCode, contactName, contactPhone, contactEmail',
      );
    }

    const svc = new FjnNodeService();
    const result = await svc.createNode({
      userId,
      nodeName,
      nodeLevel,
      regionCode,
      cityCode,
      countryCode,
      contactName,
      contactPhone,
      contactEmail,
      serviceScope,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node create-node');
  }
}

async function approveNode(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { nodeId, agreementNo, reviewNote } = body;
    if (!nodeId) return badRequest('Missing required: nodeId');
    const svc = new FjnNodeService();
    const result = await svc.approveNode(nodeId, {
      approverId: operatorId,
      agreementNo,
      reviewNote,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node approve-node');
  }
}

async function activateNode(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { nodeId } = body;
    if (!nodeId) return badRequest('Missing required: nodeId');
    const svc = new FjnNodeService();
    const result = await svc.activateNode(nodeId, operatorId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node activate-node');
  }
}

async function suspendNode(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { nodeId, reason } = body;
    if (!nodeId || !reason) return badRequest('Missing required: nodeId, reason');
    const svc = new FjnNodeService();
    const result = await svc.suspendNode(nodeId, {
      operatorId,
      reason,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node suspend-node');
  }
}

async function terminateNode(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { nodeId, reason } = body;
    if (!nodeId || !reason) return badRequest('Missing required: nodeId, reason');
    const svc = new FjnNodeService();
    const result = await svc.terminateNode(nodeId, {
      operatorId,
      reason,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node terminate-node');
  }
}

async function blacklistNode(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { nodeId, reason } = body;
    if (!nodeId || !reason) return badRequest('Missing required: nodeId, reason');
    const svc = new FjnNodeService();
    const result = await svc.blacklistNode(nodeId, {
      operatorId,
      reason,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node blacklist-node');
  }
}

// ============================================================
// KYB - POST 实现
// ============================================================

async function submitKyb(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { nodeId } = body;
    if (!nodeId) return badRequest('Missing required: nodeId');
    const svc = new FjnNodeService();
    const result = await svc.submitKyb(nodeId, userId);
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node submit-kyb');
  }
}

async function approveKyb(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { nodeId, approved, reason } = body;
    if (!nodeId || approved === undefined) {
      return badRequest('Missing required: nodeId, approved');
    }
    const svc = new FjnNodeService();
    const result = await svc.approveKyb(nodeId, Boolean(approved), operatorId, reason);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node approve-kyb');
  }
}

// ============================================================
// 节点奖励 - GET 实现
// ============================================================

async function listRewards(req: NextRequest, userId: string) {
  try {
    const p = req.nextUrl.searchParams;
    const page = parseInt(p.get('page') || '1');
    const pageSize = parseInt(p.get('pageSize') || '20');
    const svc = new FjnNodeService();
    const result = await svc.listRewards({
      rewardNo: p.get('rewardNo') || undefined,
      orderId: p.get('orderId') || undefined,
      nodeId: p.get('nodeId') || undefined,
      userId: p.get('userId') || undefined,
      orderUserId: p.get('orderUserId') || undefined,
      nodeLevel: (p.get('nodeLevel') as any) || undefined,
      status: (p.get('status') as any) || undefined,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node reward-list');
  }
}

async function getRewardDetail(req: NextRequest, userId: string) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnNodeService();
    const reward = await svc.findRewardById(id);
    if (!reward) return notFound('Reward not found');
    return success(reward);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node reward-detail');
  }
}

async function getRewardsByOrder(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId');
  if (!orderId) return badRequest('Missing orderId');
  try {
    const svc = new FjnNodeService();
    const rewards = await svc.findRewardsByOrderId(orderId);
    return success({ items: rewards, total: rewards.length });
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node reward-by-order');
  }
}

// ============================================================
// 节点奖励 - POST 实现
// ============================================================

async function createReward(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const {
      orderId,
      orderUserId,
      nodeLevel,
      rewardRate,
      orderAmount,
      currency,
      taxRate,
      serviceRecordRequired,
    } = body;

    if (!orderId || !orderUserId || !nodeLevel || !orderAmount || !currency) {
      return badRequest(
        'Missing required: orderId, orderUserId, nodeLevel, orderAmount, currency',
      );
    }

    const svc = new FjnNodeService();
    const result = await svc.createReward({
      orderId,
      orderUserId,
      nodeLevel,
      rewardRate,
      orderAmount,
      currency,
      taxRate,
      serviceRecordRequired,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node create-reward');
  }
}

async function lockReward(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { rewardId, serviceRecordId } = body;
    if (!rewardId) return badRequest('Missing required: rewardId');
    const svc = new FjnNodeService();
    const result = await svc.lock(rewardId, serviceRecordId, operatorId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node lock-reward');
  }
}

async function startRiskCheck(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { rewardId } = body;
    if (!rewardId) return badRequest('Missing required: rewardId');
    const svc = new FjnNodeService();
    const result = await svc.startRiskCheck(rewardId, operatorId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node start-risk');
  }
}

async function approveReward(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { rewardId, reviewerId, reviewNote } = body;
    const reviewer = reviewerId || operatorId;
    if (!rewardId || !reviewer) return badRequest('Missing required: rewardId, reviewerId');
    const svc = new FjnNodeService();
    const result = await svc.approve(rewardId, {
      reviewerId: reviewer,
      reviewNote,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node approve-reward');
  }
}

async function markPayable(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { rewardId } = body;
    if (!rewardId) return badRequest('Missing required: rewardId');
    const svc = new FjnNodeService();
    const result = await svc.markPayable(rewardId, operatorId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node mark-payable');
  }
}

async function markPaid(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { rewardId } = body;
    if (!rewardId) return badRequest('Missing required: rewardId');
    const svc = new FjnNodeService();
    const result = await svc.markPaid(rewardId, operatorId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node mark-paid');
  }
}

async function recoverReward(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { rewardId, reason, approvalId } = body;
    if (!rewardId || !reason) return badRequest('Missing required: rewardId, reason');
    const svc = new FjnNodeService();
    const result = await svc.recover(rewardId, {
      reason,
      approvalId,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node recover-reward');
  }
}

async function cancelReward(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { rewardId, reason } = body;
    if (!rewardId || !reason) return badRequest('Missing required: rewardId, reason');
    const svc = new FjnNodeService();
    const result = await svc.cancel(rewardId, {
      reason,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node cancel-reward');
  }
}

async function riskHold(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { rewardId, reason, riskScore, riskLevel } = body;
    if (!rewardId || !reason || riskScore === undefined || !riskLevel) {
      return badRequest('Missing required: rewardId, reason, riskScore, riskLevel');
    }
    const svc = new FjnNodeService();
    const result = await svc.riskHold(rewardId, reason, Number(riskScore), riskLevel);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node risk-hold');
  }
}

// ============================================================
// 服务记录 - GET 实现
// ============================================================

async function listServiceRecords(req: NextRequest, userId: string) {
  try {
    const p = req.nextUrl.searchParams;
    const page = parseInt(p.get('page') || '1');
    const pageSize = parseInt(p.get('pageSize') || '20');
    const svc = new FjnNodeService();
    const result = await svc.listServiceRecords({
      nodeId: p.get('nodeId') || undefined,
      userId: p.get('userId') || undefined,
      serviceType: p.get('serviceType') || undefined,
      status: (p.get('status') as any) || undefined,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node service-records');
  }
}

// ============================================================
// 服务记录 - POST 实现
// ============================================================

async function submitServiceRecord(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const {
      nodeId,
      serviceType,
      title,
      description,
      evidence,
      serviceDate,
      participants,
    } = body;
    if (!nodeId || !serviceType || !title || !serviceDate || participants === undefined) {
      return badRequest(
        'Missing required: nodeId, serviceType, title, serviceDate, participants',
      );
    }
    const svc = new FjnNodeService();
    const result = await svc.submitServiceRecord({
      nodeId,
      userId,
      serviceType,
      title,
      description,
      evidence,
      serviceDate: new Date(serviceDate),
      participants: Number(participants),
      operatorId: userId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node submit-service-record');
  }
}

async function reviewServiceRecord(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { recordId, approved, reviewNote } = body;
    if (!recordId || approved === undefined) {
      return badRequest('Missing required: recordId, approved');
    }
    const svc = new FjnNodeService();
    const result = await svc.reviewServiceRecord(recordId, {
      reviewerId: operatorId,
      approved: Boolean(approved),
      reviewNote,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node review-service-record');
  }
}

// ============================================================
// 联动入口 - POST 实现
// ============================================================

async function handleOrderPaid(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { orderId, orderUserId, orderAmount, currency } = body;
    if (!orderId || !orderUserId || !orderAmount || !currency) {
      return badRequest(
        'Missing required: orderId, orderUserId, orderAmount, currency',
      );
    }
    const svc = new FjnNodeService();
    const result = await svc.handleOrderPaid({
      orderId,
      orderUserId,
      orderAmount,
      currency,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/node handle-order-paid');
  }
}

// ============================================================
// 统计 - GET 实现
// ============================================================

async function getStats(req: NextRequest, userId: string) {
  try {
    const [
      totalNodes,
      nodesByLevel,
      nodesByStatus,
      totalRewards,
      rewardsByLevel,
      rewardsByStatus,
      totalRewardAmount,
      totalRecords,
      recordsByStatus,
    ] = await Promise.all([
      // 节点统计
      prisma.fjnNode.count(),
      prisma.fjnNode.groupBy({
        by: ['nodeLevel'],
        _count: true,
      }),
      prisma.fjnNode.groupBy({
        by: ['status'],
        _count: true,
      }),
      // 奖励统计
      prisma.fjnNodeReward.count(),
      prisma.fjnNodeReward.groupBy({
        by: ['nodeLevel'],
        _count: true,
        _sum: { rewardAmount: true },
      }),
      prisma.fjnNodeReward.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.fjnNodeReward.aggregate({
        _sum: { rewardAmount: true },
      }),
      // 服务记录统计
      prisma.fjnNodeServiceRecord.count(),
      prisma.fjnNodeServiceRecord.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return success({
      nodes: {
        total: totalNodes,
        byLevel: nodesByLevel,
        byStatus: nodesByStatus,
      },
      rewards: {
        total: totalRewards,
        byLevel: rewardsByLevel,
        byStatus: rewardsByStatus,
        totalRewardAmount:
          totalRewardAmount._sum.rewardAmount?.toString() ?? '0',
      },
      serviceRecords: {
        total: totalRecords,
        byStatus: recordsByStatus,
      },
    });
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/node stats');
  }
}
