/**
 * /api/v1/solana-ico/claims/schedule/[scheduleId]
 *  - GET  按 schedule 列出所有 claim
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoClaimService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const claimService = new IcoClaimService();

export const GET = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { scheduleId: string } }) => {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? undefined;
    const skip = Number(url.searchParams.get('skip') ?? 0);
    const take = Number(url.searchParams.get('take') ?? 50);

    const result = await claimService.listClaims({
      scheduleId: params.scheduleId,
      status,
      skip,
      take,
    });
    return NextResponse.json({ success: true, ...result });
  })
);
