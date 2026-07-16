/**
 * /api/v1/solana-ico/orders/by-tx/[signature]
 *  - GET  通过链上 tx 签名查订单（用于幂等回调查询）
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoOrderService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const orderService = new IcoOrderService();

export const GET = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { signature: string } }) => {
    const order = await orderService.getOrderByTxSignature(params.signature);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Order not found for this tx signature' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: order });
  })
);
