/**
 * /api/v1/solana-ico/vesting/[id]/bind-chain
 * 绑定链上 Anchor PDA
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoVestingService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';

const schema = z.object({
  chainScheduleId: z.string().min(32).max(64),
  chainTxSig: z.string().min(64).max(128),
});

const vestingService = new IcoVestingService();

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const operatorId = (req as any).userId;
    const body = await req.json();
    const dto = schema.parse(body);
    const schedule = await vestingService.bindToChain(
      { scheduleId: params.id, chainScheduleId: dto.chainScheduleId, chainTxSig: dto.chainTxSig },
      operatorId
    );
    return NextResponse.json({ success: true, data: schedule });
  })
);
