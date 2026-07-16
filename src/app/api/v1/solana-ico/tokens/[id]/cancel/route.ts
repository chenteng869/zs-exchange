/**
 * /api/v1/solana-ico/tokens/[id]/cancel
 * 取消 ICO
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoTokenService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';

const cancelSchema = z.object({
  reason: z.string().min(1).max(500),
});

const tokenService = new IcoTokenService();

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const operatorId = (req as any).userId;
    const body = await req.json();
    const dto = cancelSchema.parse(body);
    const token = await tokenService.cancelToken(params.id, dto.reason, operatorId);
    return NextResponse.json({ success: true, data: token });
  })
);
