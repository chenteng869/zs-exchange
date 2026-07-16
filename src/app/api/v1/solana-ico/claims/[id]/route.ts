/**
 * /api/v1/solana-ico/claims/[id]
 *
 *  - GET   详情（user / admin）
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoClaimService } from '@/lib/solana-ico';
import { withUserAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const claimService = new IcoClaimService();

export const GET = withErrorHandler(
  withUserAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const claim = await claimService.getClaim(params.id);
    return NextResponse.json({ success: true, data: claim });
  })
);
