/**
 * 用户安全告警查询 API
 * /api/v1/user/alerts
 *
 * 端点（使用 ?action=xxx 模式）：
 *  - GET  ?action=recent              最近的安全告警（默认最近 30 天）
 *  - GET  ?action=summary             用户安全态势摘要
 *
 * 权限：仅认证用户（requireAuth）
 *  用途：用户在 H5 端查看自己账号的安全告警
 */

import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { queryAlerts } from '@/lib/monitoring/alert-management';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const action = req.nextUrl.searchParams.get('action') || 'recent';

    try {
      switch (action) {
        case 'recent':
          return await getRecent(ctx, req);
        case 'summary':
          return await getSummary(ctx);
        default:
          return badRequest(`Invalid action: ${action}. Supported: recent, summary`);
      }
    } catch (e) {
      return handleApiError(e, `api:user/alerts GET ${action}`);
    }
  });
}

async function getRecent(ctx: AuthContext, req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(req.nextUrl.searchParams.get('pageSize') || '10', 10);

  const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await queryAlerts({
    userId: ctx.userId,
    startTime,
    page,
    pageSize,
    orderBy: 'createdAt',
    orderDir: 'desc',
  });

  // 简化 metadata / userAgent（不暴露给前端）
  const sanitizedAlerts = result.alerts.map((a: any) => ({
    id: a.id,
    type: a.type,
    severity: a.severity,
    message: a.message,
    ipAddress: a.ipAddress,
    acknowledged: a.acknowledged,
    resolvedAt: a.resolvedAt,
    createdAt: a.createdAt,
  }));

  return success({
    days,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
    alerts: sanitizedAlerts,
  });
}

async function getSummary(ctx: AuthContext) {
  const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalAlerts, unacknowledged, bySeverity, byType, mfaFailures] = await Promise.all([
    (prisma as any).fjnSecurityAlert.count({
      where: { userId: ctx.userId, createdAt: { gte: last30d } },
    }),
    (prisma as any).fjnSecurityAlert.count({
      where: { userId: ctx.userId, createdAt: { gte: last30d }, acknowledged: false },
    }),
    (prisma as any).fjnSecurityAlert.groupBy({
      by: ['severity'],
      where: { userId: ctx.userId, createdAt: { gte: last30d } },
      _count: { id: true },
    }),
    (prisma as any).fjnSecurityAlert.groupBy({
      by: ['type'],
      where: { userId: ctx.userId, createdAt: { gte: last30d } },
      _count: { id: true },
    }),
    (prisma as any).fjnMfaFailureRecord.count({
      where: { userId: ctx.userId, createdAt: { gte: last30d } },
    }),
  ]);

  const bySeverityMap: Record<string, number> = {};
  for (const r of bySeverity) bySeverityMap[r.severity] = r._count.id;
  const byTypeMap: Record<string, number> = {};
  for (const r of byType) byTypeMap[r.type] = r._count.id;

  return success({
    period: '30d',
    totalAlerts,
    unacknowledged,
    bySeverity: bySeverityMap,
    byType: byTypeMap,
    mfaFailureCount: mfaFailures,
  });
}
