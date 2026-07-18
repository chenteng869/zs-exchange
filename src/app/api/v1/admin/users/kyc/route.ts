/**
 * /api/v1/admin/users/kyc
 *
 * 真实化数据源（Q04-3.12.b1-api-routes）：
 *   - KycApplication
 *   - KycRiskAssessment
 *   - KycComplianceFreeze
 *   - CoreUser
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
      const [total, pending, approved, rejected, frozen, highRisk, rows] =
        await Promise.all([
          db.kycApplication.count().catch(() => 0),
          db.kycApplication.count({ where: { status: 'PENDING' as any } }).catch(() => 0),
          db.kycApplication.count({ where: { status: 'APPROVED' as any } }).catch(() => 0),
          db.kycApplication.count({ where: { status: 'REJECTED' as any } }).catch(() => 0),
          db.kycComplianceFreeze.count().catch(() => 0),
          db.kycRiskAssessment.count({ where: { riskLevel: { in: ['HIGH', 'CRITICAL'] as any } } }).catch(() => 0),
          db.kycApplication
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
        status: r?.status ?? null,
        level: r?.level ?? null,
        fullName: r?.fullName ?? null,
        country: r?.country ?? null,
        documentType: r?.documentType ?? null,
        documentNumber: r?.documentNumber ?? null,
        submittedAt: safeIso(r?.submittedAt ?? r?.createdAt),
        reviewedAt: safeIso(r?.reviewedAt),
        createdAt: safeIso(r?.createdAt),
        updatedAt: safeIso(r?.updatedAt),
      }));

      return NextResponse.json(
        successResponse({
          summary: {
            total: safeNum(total),
            pending: safeNum(pending),
            approved: safeNum(approved),
            rejected: safeNum(rejected),
            frozen: safeNum(frozen),
            highRisk: safeNum(highRisk),
          },
          rows: safeRows,
          pagination: { take, skip, returned: safeRows.length },
        }),
      );
    } catch (e: any) {
      return NextResponse.json(
        errorResponse(
          'ADMIN_API_ERROR',
          e?.message || 'KYC overview query failed',
        ),
        { status: 500 },
      );
    }
  });
}
