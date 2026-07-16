/**
 * /api/v1/solana-ico/vesting/[id]/claimable
 *  - GET  查询用户在指定 schedule 下的可领取金额
 *    query: ?userId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoVestingService } from '@/lib/solana-ico';
import { withUserAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const vestingService = new IcoVestingService();

export const GET = withErrorHandler(
  withUserAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') ?? (req as any).userId;
    const requestUserId = (req as any).userId;
    if (requestUserId !== userId) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Cannot query other user claimable' },
        { status: 403 }
      );
    }
    const result = await vestingService.calculateClaimable(params.id, userId);
    return NextResponse.json({ success: true, data: result });
  })
);
