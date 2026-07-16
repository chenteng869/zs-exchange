/**
 * /api/v1/solana-ico/orders/[id]/vesting
 * 订单进入释放阶段
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoOrderService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';

const schema = z.object({
  vestingStartAt: z.string().datetime(),
  vestingEndAt: z.string().datetime(),
});

const orderService = new IcoOrderService();

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const body = await req.json();
    const dto = schema.parse(body);
    const order = await orderService.startVesting(
      params.id,
      new Date(dto.vestingStartAt),
      new Date(dto.vestingEndAt)
    );
    return NextResponse.json({ success: true, data: order });
  })
);
