/**
 * /api/v1/solana-ico/orders/user/[userId]
 *  - GET  用户的订单列表
 *  - /stats 用户的购买统计
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
        { success: false, error: 'FORBIDDEN', message: 'Cannot query other user orders' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? undefined;
    const skip = Number(url.searchParams.get('skip') ?? 0);
    const take = Number(url.searchParams.get('take') ?? 20);

    const result = await orderService.listOrders({
      userId: params.userId,
      status,
      skip,
      take,
    });
    return NextResponse.json({ success: true, ...result });
  })
);
