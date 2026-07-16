/**
 * /api/v1/solana-ico/orders/user/[userId]/stats
 * 用户的 ICO 购买统计
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoOrderService } from '@/lib/solana-ico';
import { withUserAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const orderService = new IcoOrderService();

export const GET = withErrorHandler(
  withUserAuth(async (req: NextRequest, { params }: { params: { userId: string } }) => {
    const requestUserId = (req as any).userId;
    if (requestUserId !== params.userId) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Cannot query other user stats' },
        { status: 403 }
      );
    }
    const stats = await orderService.getUserPurchaseStats(params.userId);
    return NextResponse.json({ success: true, data: stats });
  })
);
