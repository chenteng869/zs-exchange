/**
 * /api/v1/solana-ico/tokens/[id]/presale
 * 推进到 presale 状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoTokenService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const tokenService = new IcoTokenService();

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const operatorId = (req as any).userId;
    const token = await tokenService.startPresale(params.id, operatorId);
    return NextResponse.json({ success: true, data: token });
  })
);
