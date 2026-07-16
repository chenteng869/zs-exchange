/**
 * /api/v1/solana-ico/orders/[id]/mark-claimed
 * 标记订单完成（用户已领完所有 token）
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoOrderService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const orderService = new IcoOrderService();

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const order = await orderService.markClaimed(params.id);
    return NextResponse.json({ success: true, data: order });
  })
);
