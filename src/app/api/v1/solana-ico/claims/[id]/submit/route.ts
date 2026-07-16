/**
 * /api/v1/solana-ico/claims/[id]/submit
 *  - POST  用户提交链上领取
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoClaimService } from '@/lib/solana-ico';
import { withUserAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';

const submitSchema = z.object({
  txSignature: z.string().min(64).max(128),
});

const claimService = new IcoClaimService();

export const POST = withErrorHandler(
  withUserAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const userId = (req as any).userId;
    const body = await req.json();
    const dto = submitSchema.parse(body);
    const claim = await claimService.submitClaim({
      claimId: params.id,
      userId,
      txSignature: dto.txSignature,
    });
    return NextResponse.json({ success: true, data: claim });
  })
);
