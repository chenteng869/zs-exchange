/**
 * /api/v1/solana-ico/orders/[id]/fail
 * 标记订单失败
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoOrderService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';

const schema = z.object({ reason: z.string().min(1).max(500) });
const orderService = new IcoOrderService();

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const body = await req.json();
    const dto = schema.parse(body);
    const order = await orderService.failOrder(params.id, dto.reason);
    return NextResponse.json({ success: true, data: order });
  })
);
