/**
 * FJN Approval Service REST API
 * /api/v1/fjn/approval
 *
 * 文档：H035
 *
 * 端点：
 *  - GET  ?action=list                       列出审批请求（多维过滤 + 分页）
 *  - GET  ?action=detail&id=xxx              审批请求详情
 *  - GET  ?action=my-requests&applicantId=   我发起的申请
 *  - GET  ?action=pending-for-approver&approverId=  待我审批
 *  - POST action=create                      发起审批 (admin/system)
 *  - POST action=start-review                进入审核 (admin)
 *  - POST action=approve-step                通过当前步骤 (admin)
 *  - POST action=reject-step                 拒绝当前步骤 (admin)
 *  - POST action=skip-step                   跳过当前步骤 (admin)
 *  - POST action=cancel                      取消审批 (admin)
 *  - POST action=execute                     执行已通过的审批 (admin/system)
 *
 * 合计 11 端点
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { FjnApprovalService } from '@/lib/fjn/services/approval-service';
import { FjnError } from '@/lib/fjn/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================
// GET handlers
// ============================================================
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'list':
      return withAdminAuth(req, () => listRequests(req));
    case 'detail':
      return withAuth(req, () => getRequestDetail(req));
    case 'my-requests':
      return withAuth(req, (ctx) => listMyRequests(req, ctx.userId));
    case 'pending-for-approver':
      return withAdminAuth(req, (ctx) => listPendingForApprover(req, ctx.userId));
    default:
      return badRequest(
        'Invalid action. Supported (GET): list, detail, my-requests, pending-for-approver',
      );
  }
}

// ============================================================
// POST handlers
// ============================================================
export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'create':
      return withAuth(req, (ctx) => createRequest(req, ctx.userId));
    case 'start-review':
      return withAdminAuth(req, () => startReview(req));
    case 'approve-step':
      return withAdminAuth(req, (ctx) => approveStep(req, ctx.userId));
    case 'reject-step':
      return withAdminAuth(req, (ctx) => rejectStep(req, ctx.userId));
    case 'skip-step':
      return withAdminAuth(req, (ctx) => skipStep(req, ctx.userId));
    case 'cancel':
      return withAdminAuth(req, (ctx) => cancelRequest(req, ctx.userId));
    case 'execute':
      return withAdminAuth(req, (ctx) => executeRequest(req, ctx.userId));
    default:
      return badRequest(
        'Invalid action. Supported (POST): create, start-review, approve-step, reject-step, skip-step, cancel, execute',
      );
  }
}

// ============================================================
// GET impl
// ============================================================

async function listRequests(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const approvalType = p.get('approvalType') || undefined;
  const status = p.get('status') || undefined;
  const applicantId = p.get('applicantId') || undefined;
  const priority = p.get('priority') || undefined;
  const relatedType = p.get('relatedType') || undefined;
  const relatedId = p.get('relatedId') || undefined;

  try {
    const svc = new FjnApprovalService();
    const result = await svc.listRequests({
      approvalType: approvalType as any,
      status: status as any,
      applicantId,
      priority: priority as any,
      relatedType: relatedType as any,
      relatedId,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/approval list');
  }
}

async function getRequestDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnApprovalService();
    const request = await svc.getRequest(id);
    if (!request) return notFound('Approval request not found');
    return success(request);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/approval detail');
  }
}

async function listMyRequests(req: NextRequest, userId: string) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  try {
    const svc = new FjnApprovalService();
    const result = await svc.listMyRequests(userId, page, pageSize);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/approval my-requests');
  }
}

async function listPendingForApprover(req: NextRequest, approverId: string) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const targetApproverId = p.get('approverId') || approverId;
  try {
    const svc = new FjnApprovalService();
    const result = await svc.listPendingForApprover(targetApproverId, page, pageSize);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/approval pending-for-approver');
  }
}

// ============================================================
// POST impl
// ============================================================

async function createRequest(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { approvalType, title, description, applicantType, payload, priority, amount, currency, relatedType, relatedId, relatedNo, totalSteps, steps, expiresAt } = body;
    if (!approvalType || !title) return badRequest('Missing required: approvalType, title');
    const svc = new FjnApprovalService();
    const result = await svc.createRequest({
      approvalType,
      title,
      description,
      applicantId: userId,
      applicantType,
      payload: payload ?? {},
      priority,
      amount,
      currency,
      relatedType,
      relatedId,
      relatedNo,
      totalSteps,
      steps,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      operatorId: userId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/approval create');
  }
}

async function startReview(req: NextRequest) {
  try {
    const body = await req.json();
    const { approvalId, operatorId } = body;
    if (!approvalId) return badRequest('Missing required: approvalId');
    const svc = new FjnApprovalService();
    const result = await svc.startReview({ approvalId, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/approval start-review');
  }
}

async function approveStep(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { approvalId, approverRole, comment } = body;
    if (!approvalId) return badRequest('Missing required: approvalId');
    const svc = new FjnApprovalService();
    const result = await svc.approveStep({ approvalId, approverId: operatorId, approverRole, comment, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/approval approve-step');
  }
}

async function rejectStep(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { approvalId, approverRole, comment } = body;
    if (!approvalId || !comment) return badRequest('Missing required: approvalId, comment');
    const svc = new FjnApprovalService();
    const result = await svc.rejectStep({ approvalId, approverId: operatorId, approverRole, comment, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/approval reject-step');
  }
}

async function skipStep(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { approvalId, reason } = body;
    if (!approvalId || !reason) return badRequest('Missing required: approvalId, reason');
    const svc = new FjnApprovalService();
    const result = await svc.skipStep({ approvalId, reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/approval skip-step');
  }
}

async function cancelRequest(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { approvalId, reason } = body;
    if (!approvalId) return badRequest('Missing required: approvalId');
    const svc = new FjnApprovalService();
    const result = await svc.cancelRequest({ approvalId, reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/approval cancel');
  }
}

async function executeRequest(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { approvalId } = body;
    if (!approvalId) return badRequest('Missing required: approvalId');
    const svc = new FjnApprovalService();
    const result = await svc.executeRequest({ approvalId, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/approval execute');
  }
}
