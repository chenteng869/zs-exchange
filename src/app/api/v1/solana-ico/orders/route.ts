/**
 * /api/v1/solana-ico/orders
 *
 *  - GET    /                  列表（支持 tokenId/userId/status 过滤）
 *  - POST   /                  创建订单（user）
 *  - GET    /:id               详情
 *  - POST   /:id/payment       支付回调（链上确认）
 *  - POST   /:id/confirm       链上最终确认
 *  - POST   /:id/vesting       进入释放
 *  - POST   /:id/refund        退款
 *  - POST   /:id/fail          标记失败
 *  - POST   /:id/cancel        取消
 *  - GET    /user/:userId/stats 用户购买统计
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoOrderService } from '@/lib/solana-ico';
import { withUserAuth, withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';

const createSchema = z.object({
  tokenId: z.string().uuid(),
  payMint: z.string().min(32).max(64),
  payAmount: z.string().min(1),
  regionCode: z.string().length(2).optional(),
  kycVerified: z.boolean().optional(),
  payerWallet: z.string().optional(),
  note: z.string().max(500).optional(),
});

const orderService = new IcoOrderService();

export const GET = withErrorHandler(
  withAdminAuth(async (req: NextRequest) => {
    const url = new URL(req.url);
    const tokenId = url.searchParams.get('tokenId') ?? undefined;
    const userId = url.searchParams.get('userId') ?? undefined;
    const status = url.searchParams.get('status') ?? undefined;
    const skip = Number(url.searchParams.get('skip') ?? 0);
    const take = Number(url.searchParams.get('take') ?? 20);
    const result = await orderService.listOrders({ tokenId, userId, status, skip, take });
    return NextResponse.json({ success: true, ...result });
  })
);

export const POST = withErrorHandler(
  withUserAuth(async (req: NextRequest) => {
    const userId = (req as any).userId;
    const body = await req.json();
    const dto = createSchema.parse({ ...body, userId });
    const order = await orderService.createOrder(dto as any);
    return NextResponse.json({ success: true, data: order }, { status: 201 });
  })
);
