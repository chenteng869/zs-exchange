/**
 * /api/v1/solana-ico/vesting/[id]/resume
 * 恢复 schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoVestingService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const vestingService = new IcoVestingService();

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const operatorId = (req as any).userId;
    const schedule = await vestingService.resumeSchedule(params.id, operatorId);
    return NextResponse.json({ success: true, data: schedule });
  })
);
