/**
 * /api/v1/solana-ico/orders/[id]/payment
 * 支付回调（链上确认）
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoOrderService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';

const schema = z.object({
  txSignature: z.string().min(64).max(128),
  payerWallet: z.string().min(32).max(64),
  confirmedAt: z.string().datetime(),
  confirmedSlot: z.string().optional(),
});

const orderService = new IcoOrderService();

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const body = await req.json();
    const dto = schema.parse(body);
    const order = await orderService.processPayment({
      orderId: params.id,
      txSignature: dto.txSignature,
      payerWallet: dto.payerWallet,
      confirmedAt: new Date(dto.confirmedAt),
      confirmedSlot: dto.confirmedSlot ? BigInt(dto.confirmedSlot) : undefined,
    });
    return NextResponse.json({ success: true, data: order });
  })
);
