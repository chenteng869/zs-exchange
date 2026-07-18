/**
 * /api/v1/admin/security/incident-response
 *
 * O2 替代 model 聚合（Q04-3.12.b1-api-routes，决策 b）：
 *   - 不新增 SecurityIncident/IncidentResponse
 *   - 用 FjnSecurityAlert + FjnMfaFailureRecord + FjnAlertConfig 聚合安全事件响应视图
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
    const [alerts, openAlerts, mfaFailures, configs, rows] = await Promise.all([
      db.fjnSecurityAlert.count().catch(() => 0),
      db.fjnSecurityAlert
        .count({ where: { status: { in: ['OPEN', 'ACK', 'NEW'] as any } } })
        .catch(() => 0),
      db.fjnMfaFailureRecord.count().catch(() => 0),
      db.fjnAlertConfig.count().catch(() => 0),
      db.fjnSecurityAlert
        .findMany({
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        })
        .catch(() => []),
    ]);

    const safeRows = (rows as any[]).map((r) => ({
      id: r?.id ?? null,
      type: r?.type ?? r?.alertType ?? null,
      severity: r?.severity ?? null,
      status: r?.status ?? null,
      actor: r?.actor ?? r?.userId ?? null,
      message: r?.message ?? null,
      source: r?.source ?? null,
      createdAt: safeIso(r?.createdAt),
      resolvedAt: safeIso(r?.resolvedAt),
    }));

    return NextResponse.json(
      successResponse({
        summary: {
          alerts: safeNum(alerts),
          openAlerts: safeNum(openAlerts),
          mfaFailures: safeNum(mfaFailures),
          configs: safeNum(configs),
        },
        rows: safeRows,
        pagination: { take, skip, returned: safeRows.length },
      }),
    );
  } catch (e: any) {
    return NextResponse.json(
      errorResponse(
        'ADMIN_API_ERROR',
        e?.message || 'security/incident-response query failed',
      ),
      { status: 500 },
    );
  }
  });
}
