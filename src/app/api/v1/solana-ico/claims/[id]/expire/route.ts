/**
 * /api/v1/solana-ico/claims/[id]/expire
 *  - POST  标记过期（admin / 系统）
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoClaimService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const claimService = new IcoClaimService();

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const claim = await claimService.markExpired(params.id);
    return NextResponse.json({ success: true, data: claim });
  })
);
