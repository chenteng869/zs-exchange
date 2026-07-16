/**
 * /api/v1/solana-ico/vesting/[id]
 *  - GET  详情
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoVestingService } from '@/lib/solana-ico';
import { withErrorHandler } from '@/lib/api/error-handler';
import { withAdminAuth } from '@/lib/api/middleware';

const vestingService = new IcoVestingService();

export const GET = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const schedule = await vestingService.getSchedule(params.id);
    return NextResponse.json({ success: true, data: schedule });
  })
);
