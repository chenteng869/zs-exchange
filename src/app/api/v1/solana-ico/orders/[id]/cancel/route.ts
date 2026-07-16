/**
 * /api/v1/solana-ico/orders/[id]/cancel
 * 用户取消订单
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoOrderService } from '@/lib/solana-ico';
import { withUserAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const orderService = new IcoOrderService();

export const POST = withErrorHandler(
  withUserAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const userId = (req as any).userId;
    const order = await orderService.cancelOrder(params.id, userId);
    return NextResponse.json({ success: true, data: order });
  })
);
