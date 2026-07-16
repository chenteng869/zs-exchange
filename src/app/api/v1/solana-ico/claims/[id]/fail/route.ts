/**
 * /api/v1/solana-ico/claims/[id]/fail
 *  - POST  标记失败（admin / 系统）
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoClaimService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';

const failSchema = z.object({
  reason: z.string().min(1).max(500),
});

const claimService = new IcoClaimService();

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const body = await req.json();
    const dto = failSchema.parse(body);
    const claim = await claimService.markFailed(params.id, dto.reason);
    return NextResponse.json({ success: true, data: claim });
  })
);
