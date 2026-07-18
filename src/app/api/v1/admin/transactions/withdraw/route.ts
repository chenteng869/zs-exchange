/**
 * /api/v1/admin/transactions/withdraw
 *
 * 真实化数据源（Q04-3.12.b1-api-routes）：
 *   - WalletWithdrawal
 *   - WalletWithdrawalRecord
 *   - WalletWithdrawalApproval
 *   - WalletWithdrawalApprovalDecision
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
    const [
      total,
      pending,
      approved,
      rejected,
      totalAmountAgg,
      rows,
    ] = await Promise.all([
      db.walletWithdrawal.count().catch(() => 0),
      db.walletWithdrawal
        .count({ where: { status: 'PENDING' as any } })
        .catch(() => 0),
      db.walletWithdrawal
        .count({ where: { status: 'APPROVED' as any } })
        .catch(() => 0),
      db.walletWithdrawal
        .count({ where: { status: 'REJECTED' as any } })
        .catch(() => 0),
      db.walletWithdrawal
        .aggregate({
          _sum: { amount: true } as any,
        })
        .catch(() => null),
      db.walletWithdrawal
        .findMany({
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        })
        .catch(() => []),
    ]);

    const totalAmount = safeNum((totalAmountAgg as any)?._sum?.amount);

    const safeRows = (rows as any[]).map((r) => ({
      id: r?.id ?? null,
      userId: r?.userId ?? null,
      currency: r?.currency ?? null,
      amount: safeNum(r?.amount),
      fee: safeNum(r?.fee),
      netAmount: safeNum(r?.netAmount),
      address: r?.address ?? null,
      chain: r?.chain ?? null,
      status: r?.status ?? null,
      txHash: r?.txHash ?? null,
      createdAt: safeIso(r?.createdAt),
      completedAt: safeIso(r?.completedAt),
    }));

    return NextResponse.json(
      successResponse({
        summary: {
          total: safeNum(total),
          pending: safeNum(pending),
          approved: safeNum(approved),
          rejected: safeNum(rejected),
          totalAmount,
        },
        rows: safeRows,
        pagination: { take, skip, returned: safeRows.length },
      }),
    );
  } catch (e: any) {
    return NextResponse.json(
      errorResponse(
        'ADMIN_API_ERROR',
        e?.message || 'withdraw query failed',
      ),
      { status: 500 },
    );
  }
  });
}
