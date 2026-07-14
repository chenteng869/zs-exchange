/**
 * FJN Audit Service REST API
 * /api/v1/fjn/audit
 *
 * 文档：H036
 *
 * 端点：
 *  - GET  ?action=list                         查询审计日志（多维过滤 + 分页）
 *  - GET  ?action=detail&id=xxx                日志详情
 *  - GET  ?action=timeline&targetType&targetId 对象操作时间线
 *
 * 合计 3 端点（写入类操作 record/exportLogs/archiveLogs 由系统内部调用，不对外暴露）
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAdminAuth } from '@/lib/api/middleware';
import { FjnAuditService } from '@/lib/fjn/services/audit-service';
import { FjnError } from '@/lib/fjn/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'list':
      return withAdminAuth(req, () => listLogs(req));
    case 'detail':
      return withAdminAuth(req, () => getLogDetail(req));
    case 'timeline':
      return withAdminAuth(req, () => getTimeline(req));
    default:
      return badRequest('Invalid action. Supported (GET): list, detail, timeline');
  }
}

async function listLogs(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const module = p.get('module') || undefined;
  const action = p.get('action_') || undefined;
  const targetType = p.get('targetType') || undefined;
  const targetId = p.get('targetId') || undefined;
  const operatorId = p.get('operatorId') || undefined;
  const startTime = p.get('startTime') ? new Date(p.get('startTime')!) : undefined;
  const endTime = p.get('endTime') ? new Date(p.get('endTime')!) : undefined;

  try {
    const svc = new FjnAuditService();
    const result = await svc.query({
      module,
      action,
      targetType,
      targetId,
      operatorId,
      startTime,
      endTime,
      page,
      pageSize,
    } as any);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/audit list');
  }
}

async function getLogDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnAuditService();
    const log = await svc.getLog(id);
    if (!log) return notFound('Audit log not found');
    return success(log);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/audit detail');
  }
}

async function getTimeline(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const targetType = p.get('targetType');
  const targetId = p.get('targetId');
  if (!targetType || !targetId) return badRequest('Missing required: targetType, targetId');
  try {
    const svc = new FjnAuditService();
    const result = await svc.getObjectTimeline(targetType, targetId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/audit timeline');
  }
}
