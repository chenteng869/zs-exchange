/**
 * /api/v1/solana-ico/tokens/[id]/bind-mint
 * 绑定链上 SPL Token mint address
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoTokenService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';

const bindSchema = z.object({
  mintAddress: z.string().min(32).max(64),
});

const tokenService = new IcoTokenService();

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const operatorId = (req as any).userId;
    const body = await req.json();
    const dto = bindSchema.parse(body);
    const token = await tokenService.bindMintAddress(params.id, dto.mintAddress, operatorId);
    return NextResponse.json({ success: true, data: token });
  })
);
