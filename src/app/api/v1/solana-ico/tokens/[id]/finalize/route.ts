/**
 * /api/v1/solana-ico/tokens/[id]/finalize
 * 完结 ICO（需要 scheduleId, merkleRoot）
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoTokenService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';

const finalizeSchema = z.object({
  scheduleId: z.string().uuid(),
  merkleRoot: z.string().min(1).max(128),
});

const tokenService = new IcoTokenService();

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const operatorId = (req as any).userId;
    const body = await req.json();
    const dto = finalizeSchema.parse(body);
    const token = await tokenService.finalizeToken(
      params.id,
      dto.scheduleId,
      dto.merkleRoot,
      operatorId
    );
    return NextResponse.json({ success: true, data: token });
  })
);
