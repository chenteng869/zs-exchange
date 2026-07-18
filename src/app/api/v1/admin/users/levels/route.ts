/**
 * /api/v1/admin/users/levels
 *
 * O2 替代 model 聚合（Q04-3.12.b1-api-routes，决策 b）：
 *   - 不新增 UserLevel/VipLevel/MembershipLevel
 *   - 用 CoreUser + KycApplication + WalletUserAssetBalance + WalletUserAssetLedger 聚合等级视图
 *
 * 等级口径：
 *   - basic     : 普通用户（无 KYC）
 *   - verified  : KYC 通过用户
 *   - active    : 有资产或流水用户
 *   - highValue : 资产或流水达到阈值用户
 *
 * 返回：{ summary, rows, meta }
 *
 * Q04-3.12.b1 硬约束：
 *   - 仅新增本 route.ts
 *   - 不改 schema.prisma / seed
 *   - 不返回 mock 数据
 *   - 失败 fallback 到 summary=0/rows=[]
 */

import { NextResponse } from 'next/server';
import { adminPrisma } from '@/lib/admin/admin-db';
import {
  successResponse,
  errorResponse,
} from '@/lib/admin/api-response-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_TAKE = 20;
const MAX_TAKE = 100;
const HIGH_VALUE_THRESHOLD = 10000; // 简单阈值口径

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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const take = Math.min(
      Math.max(Number(url.searchParams.get('take')) || DEFAULT_TAKE, 1),
      MAX_TAKE,
    );
    const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0);

    const db = adminPrisma;
    const [users, verified, active, highValue, rows] = await Promise.all([
      db.coreUser.count().catch(() => 0),
      db.kycApplication
        .count({ where: { status: 'APPROVED' as any } })
        .catch(() => 0),
      db.walletUserAssetBalance
        .count({ where: { balance: { gt: 0 } as any } })
        .catch(() => 0),
      db.walletUserAssetBalance
        .count({ where: { balance: { gte: HIGH_VALUE_THRESHOLD } as any } })
        .catch(() => 0),
      db.coreUser
        .findMany({
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        })
        .catch(() => []),
    ]);

    // 注：单条 user 的等级在 rows 侧不直接查 wallet 关联（避免 N+1），
    // 由前端通过其它聚合接口或后续 join 实现；本接口提供 summary。
    const safeRows = (rows as any[]).map((r) => ({
      id: r?.id ?? null,
      email: r?.email ?? null,
      username: r?.username ?? r?.displayName ?? null,
      status: r?.status ?? null,
      createdAt: safeIso(r?.createdAt),
      // 等级未在 user 表，UI 层可结合 summary 自行判定
      level: null,
    }));

    return NextResponse.json(
      successResponse({
        summary: {
          users: safeNum(users),
          verified: safeNum(verified),
          active: safeNum(active),
          highValue: safeNum(highValue),
          threshold: HIGH_VALUE_THRESHOLD,
        },
        rows: safeRows,
        pagination: { take, skip, returned: safeRows.length },
      }),
    );
  } catch (e: any) {
    return NextResponse.json(
      errorResponse(
        'ADMIN_API_ERROR',
        e?.message || 'users/levels query failed',
      ),
      { status: 500 },
    );
  }
}
