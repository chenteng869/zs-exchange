/**
 * /api/v1/solana-ico/tokens/[id]/sale
 * 推进到 sale 状态（正式公开发售）
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoTokenService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const tokenService = new IcoTokenService();

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const operatorId = (req as any).userId;
    const token = await tokenService.startPublicSale(params.id, operatorId);
    return NextResponse.json({ success: true, data: token });
  })
);
