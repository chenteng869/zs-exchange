/**
 * /api/v1/admin/fujian/identity
 *
 * 真实化数据源（Q04-3.12.b1-api-routes）：
 *   - FjnUserKyc
 *   - FjnUserKyb
 *   - FjnKycReviewLog
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
    const [userKyc, userKyb, reviews, pending, rows] = await Promise.all([
      db.fjnUserKyc.count().catch(() => 0),
      db.fjnUserKyb.count().catch(() => 0),
      db.fjnKycReviewLog.count().catch(() => 0),
      db.fjnUserKyc
        .count({ where: { status: { in: ['PENDING', 'SUBMITTED'] as any } } })
        .catch(() => 0),
      db.fjnUserKyc
        .findMany({
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        })
        .catch(() => []),
    ]);

    const safeRows = (rows as any[]).map((r) => ({
      id: r?.id ?? null,
      userId: r?.userId ?? null,
      realName: r?.realName ?? null,
      idType: r?.idType ?? null,
      idNumber: r?.idNumber ?? null,
      status: r?.status ?? null,
      submittedAt: safeIso(r?.submittedAt ?? r?.createdAt),
      reviewedAt: safeIso(r?.reviewedAt),
      createdAt: safeIso(r?.createdAt),
    }));

    return NextResponse.json(
      successResponse({
        summary: {
          userKyc: safeNum(userKyc),
          userKyb: safeNum(userKyb),
          reviews: safeNum(reviews),
          pending: safeNum(pending),
        },
        rows: safeRows,
        pagination: { take, skip, returned: safeRows.length },
      }),
    );
  } catch (e: any) {
    return NextResponse.json(
      errorResponse(
        'ADMIN_API_ERROR',
        e?.message || 'fujian/identity query failed',
      ),
      { status: 500 },
    );
  }
  });
}
