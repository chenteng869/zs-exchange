/**
 * /api/v1/solana-ico/claims/user/[userId]/pending
 * 用户的待领取列表（可领取时间 <= now）
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoClaimService } from '@/lib/solana-ico';
import { withUserAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const claimService = new IcoClaimService();

export const GET = withErrorHandler(
  withUserAuth(async (req: NextRequest, { params }: { params: { userId: string } }) => {
    const requestUserId = (req as any).userId;
    if (requestUserId !== params.userId) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Cannot query other user pending claims' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const scheduleId = url.searchParams.get('scheduleId') ?? undefined;
    const items = await claimService.getUserPendingClaims(params.userId, scheduleId);
    return NextResponse.json({ success: true, items, total: items.length });
  })
);
