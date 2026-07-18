/**
 * /api/v1/admin/wallet/transactions
 *
 * 真实化数据源（Q04-3.12.b1-api-routes）：
 *   - WalletUserAssetBalance
 *   - WalletUserAssetLedger
 *   - WalletDepositRecord
 *   - WalletChainTransaction
 *   - WalletWithdrawal
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
      ledgerCount,
      depositCount,
      withdrawalCount,
      chainTxCount,
      totalBalanceAgg,
      rows,
    ] = await Promise.all([
      db.walletUserAssetLedger.count().catch(() => 0),
      db.walletDepositRecord.count().catch(() => 0),
      db.walletWithdrawal.count().catch(() => 0),
      db.walletChainTransaction.count().catch(() => 0),
      db.walletUserAssetBalance
        .aggregate({ _sum: { balance: true } as any })
        .catch(() => null),
      db.walletUserAssetLedger
        .findMany({
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        })
        .catch(() => []),
    ]);

    const totalBalance = safeNum((totalBalanceAgg as any)?._sum?.balance);

    const safeRows = (rows as any[]).map((r) => ({
      id: r?.id ?? null,
      userId: r?.userId ?? null,
      asset: r?.asset ?? r?.currency ?? null,
      type: r?.type ?? null,
      direction: r?.direction ?? null,
      amount: safeNum(r?.amount),
      balance: safeNum(r?.balance),
      txHash: r?.txHash ?? null,
      refType: r?.refType ?? null,
      refId: r?.refId ?? null,
      createdAt: safeIso(r?.createdAt),
    }));

    return NextResponse.json(
      successResponse({
        summary: {
          ledgerCount: safeNum(ledgerCount),
          depositCount: safeNum(depositCount),
          withdrawalCount: safeNum(withdrawalCount),
          chainTxCount: safeNum(chainTxCount),
          totalBalance,
        },
        rows: safeRows,
        pagination: { take, skip, returned: safeRows.length },
      }),
    );
  } catch (e: any) {
    return NextResponse.json(
      errorResponse(
        'ADMIN_API_ERROR',
        e?.message || 'wallet transactions query failed',
      ),
      { status: 500 },
    );
  }
  });
}
