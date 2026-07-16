/**
 * /api/v1/solana-ico/claims/user/[userId]
 *
 *  - GET    用户的所有 claim 记录
 *  - /stats 用户的领取统计
 *  - /pending 用户的待领取列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoClaimService } from '@/lib/solana-ico';
import { withUserAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const claimService = new IcoClaimService();

export const GET = withErrorHandler(
  withUserAuth(async (req: NextRequest, { params }: { params: { userId: string } }) => {
    const url = new URL(req.url);
    const skip = Number(url.searchParams.get('skip') ?? 0);
    const take = Number(url.searchParams.get('take') ?? 20);

    // 防止越权：用户只能查询自己的 claim
    const requestUserId = (req as any).userId;
    if (requestUserId !== params.userId) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Cannot query other user claims' },
        { status: 403 }
      );
    }

    const items = await claimService.getUserClaimHistory(params.userId, skip, take);
    return NextResponse.json({ success: true, items, total: items.length });
  })
);
