/**
 * /api/v1/solana-ico/tokens/[id]/stats
 * 销售统计
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoTokenService } from '@/lib/solana-ico';
import { withErrorHandler } from '@/lib/api/error-handler';

const tokenService = new IcoTokenService();

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const stats = await tokenService.getSalesStats(params.id);
  return NextResponse.json({ success: true, data: stats });
});
