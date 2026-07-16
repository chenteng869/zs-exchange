/**
 * /api/v1/solana-ico/orders/[id]
 *  - GET  详情
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoOrderService } from '@/lib/solana-ico';
import { withErrorHandler } from '@/lib/api/error-handler';
import { withUserAuth, withAdminAuth } from '@/lib/api/middleware';

const orderService = new IcoOrderService();

export const GET = withErrorHandler(
  withUserAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const order = await orderService.getOrder(params.id);
    return NextResponse.json({ success: true, data: order });
  })
);
