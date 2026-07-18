/**
 * /api/v1/admin/fujian/products
 *
 * 真实化数据源（Q04-3.12.b1-api-routes）：
 *   - FjnProduct
 *   - FjnProductVersion
 *   - FjnProductBenefit
 *   - FjnProductRuleBinding
 *   - FjnProductRegionRule
 *   - FjnProductInventoryLog
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
      products,
      activeVersions,
      benefits,
      inventoryLogs,
      rows,
    ] = await Promise.all([
      db.fjnProduct.count().catch(() => 0),
      db.fjnProductVersion.count({ where: { active: true } as any }).catch(() => 0),
      db.fjnProductBenefit.count().catch(() => 0),
      db.fjnProductInventoryLog.count().catch(() => 0),
      db.fjnProduct
        .findMany({
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        })
        .catch(() => []),
    ]);

    const safeRows = (rows as any[]).map((r) => ({
      id: r?.id ?? null,
      name: r?.name ?? null,
      code: r?.code ?? null,
      category: r?.category ?? null,
      status: r?.status ?? null,
      price: safeNum(r?.price),
      currency: r?.currency ?? null,
      stock: safeNum(r?.stock),
      description: r?.description ?? null,
      createdAt: safeIso(r?.createdAt),
      updatedAt: safeIso(r?.updatedAt),
    }));

    return NextResponse.json(
      successResponse({
        summary: {
          products: safeNum(products),
          activeVersions: safeNum(activeVersions),
          benefits: safeNum(benefits),
          inventoryLogs: safeNum(inventoryLogs),
        },
        rows: safeRows,
        pagination: { take, skip, returned: safeRows.length },
      }),
    );
  } catch (e: any) {
    return NextResponse.json(
      errorResponse(
        'ADMIN_API_ERROR',
        e?.message || 'fujian/products query failed',
      ),
      { status: 500 },
    );
  }
  });
}
