/**
 * FJN Reporting Service REST API
 * /api/v1/fjn/reporting
 *
 * 文档：H039
 *
 * 端点：
 *  - GET  ?action=list          列出报表快照（多维过滤 + 分页）
 *  - GET  ?action=detail&id=xxx 报表详情
 *
 * 注：报表生成（generateSalesReport 等聚合分析）涉及大量业务规则，暂不对外暴露写操作，
 * 仅提供只读查询，避免半成品的生成逻辑被前端误触发。
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAdminAuth } from '@/lib/api/middleware';
import { FjnReportingService } from '@/lib/fjn/services/reporting-service';
import { FjnError } from '@/lib/fjn/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'list':
      return withAdminAuth(req, () => listReports(req));
    case 'detail':
      return withAdminAuth(req, () => getReportDetail(req));
    default:
      return badRequest('Invalid action. Supported (GET): list, detail');
  }
}

async function listReports(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const reportType = p.get('reportType') || undefined;
  const status = p.get('status') || undefined;
  const period = p.get('period') || undefined;

  try {
    const svc = new FjnReportingService();
    const result = await svc.listReports({ reportType, status, period, page, pageSize } as any);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/reporting list');
  }
}

async function getReportDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnReportingService();
    const report = await svc.getReportById(id);
    if (!report) return notFound('Report not found');
    return success(report);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/reporting detail');
  }
}
