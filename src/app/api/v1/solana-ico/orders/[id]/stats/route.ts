/**
 * /api/v1/solana-ico/orders/[id]/stats
 * 单个订单的统计信息（关联 claim 数量 / 总释放 / 剩余可领）
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoOrderService, IcoClaimService } from '@/lib/solana-ico';
import { withUserAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const orderService = new IcoOrderService();
const claimService = new IcoClaimService();

export const GET = withErrorHandler(
  withUserAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const order = await orderService.getOrder(params.id);
    const claims = await claimService.listClaims({ userId: order.userId });
    const filtered = claims.items.filter((c) => c.orderId === order.id);

    const totalClaimed = filtered
      .filter((c) => c.status === 'claimed')
      .reduce((acc, c) => acc + BigInt(c.amount), 0n)
      .toString();
    const totalPending = filtered
      .filter((c) => c.status === 'pending')
      .reduce((acc, c) => acc + BigInt(c.amount), 0n)
      .toString();
    const totalFailed = filtered
      .filter((c) => c.status === 'failed')
      .reduce((acc, c) => acc + BigInt(c.amount), 0n)
      .toString();

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderNo: order.orderNo,
          status: order.status,
          tokenAmount: order.tokenAmount,
          payAmount: order.payAmount,
          usdValue: order.usdValue.toString(),
        },
        claims: {
          total: filtered.length,
          claimed: filtered.filter((c) => c.status === 'claimed').length,
          pending: filtered.filter((c) => c.status === 'pending').length,
          failed: filtered.filter((c) => c.status === 'failed').length,
          totalClaimed,
          totalPending,
          totalFailed,
        },
      },
    });
  })
);
