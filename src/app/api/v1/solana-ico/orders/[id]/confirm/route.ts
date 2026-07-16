/**
 * /api/v1/solana-ico/orders/[id]/confirm
 * 链上交易最终确认
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoOrderService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';

const schema = z.object({ scheduleId: z.string().uuid().optional() });
const orderService = new IcoOrderService();

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const body = await req.json().catch(() => ({}));
    const dto = schema.parse(body);
    const order = await orderService.confirmOrder(params.id, dto.scheduleId);
    return NextResponse.json({ success: true, data: order });
  })
);
