/**
 * /api/v1/admin/security/overview
 *
 * 真实化数据源（Q04-3.12.b1-api-routes）：
 *   - AuditLog
 *   - AuditLoginLog
 *   - AuditApiAccessLog
 *   - FjnSecurityAlert
 *   - FjnMfaFailureRecord
 *
 * 返回：{ summary, rows, meta }
 *
 * Q04-3.12.b1 硬约束：
 *   - 仅新增本 route.ts
 *   - 不改 schema.prisma / seed
 *   - 不返回 mock 数据
 *   - 失败 fallback 到 summary=0/rows=[]
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminPrisma } from '@/lib/admin/admin-db';
import {
  successResponse,
  errorResponse,
} from '@/lib/admin/api-response-schema';
import { withAdminAuth } from '@/lib/api/middleware';
import { AuthContext } from '@/lib/api/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_TAKE = 20;
const MAX_TAKE = 100;

function safeIso(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  try {
    return new Date(v as any).toISOString();
  } catch {
    return null;
  }
}

function safeNum(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async (_ctx: AuthContext) => {
  try {
    const url = new URL(req.url);
    const take = Math.min(
      Math.max(Number(url.searchParams.get('take')) || DEFAULT_TAKE, 1),
      MAX_TAKE,
    );
    const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0);

    const db = adminPrisma;
    const [
      auditLogs,
      loginLogs,
      apiAccessLogs,
      alerts,
      mfaFailures,
      rows,
    ] = await Promise.all([
      db.auditLog.count().catch(() => 0),
      db.auditLoginLog.count().catch(() => 0),
      db.auditApiAccessLog.count().catch(() => 0),
      db.fjnSecurityAlert.count().catch(() => 0),
      db.fjnMfaFailureRecord.count().catch(() => 0),
      db.auditLog
        .findMany({
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        })
        .catch(() => []),
    ]);

    const safeRows = (rows as any[]).map((r) => ({
      id: r?.id ?? null,
      actorId: r?.actorId ?? r?.userId ?? null,
      action: r?.action ?? null,
      resource: r?.resource ?? r?.resourceType ?? null,
      ip: r?.ip ?? r?.ipAddress ?? null,
      userAgent: r?.userAgent ?? null,
      status: r?.status ?? null,
      createdAt: safeIso(r?.createdAt),
    }));

    return NextResponse.json(
      successResponse({
        summary: {
          auditLogs: safeNum(auditLogs),
          loginLogs: safeNum(loginLogs),
          apiAccessLogs: safeNum(apiAccessLogs),
          alerts: safeNum(alerts),
          mfaFailures: safeNum(mfaFailures),
        },
        rows: safeRows,
        pagination: { take, skip, returned: safeRows.length },
      }),
    );
  } catch (e: any) {
    return NextResponse.json(
      errorResponse(
        'ADMIN_API_ERROR',
        e?.message || 'security overview query failed',
      ),
      { status: 500 },
    );
  }
  });
}
