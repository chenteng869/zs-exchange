/**
 * /api/v1/solana-ico/vesting/[id]/merkle
 * 更新 Merkle 根
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoVestingService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';

const schema = z.object({
  merkleRoot: z.string().min(1).max(128),
  leafCount: z.number().int().min(0),
});

const vestingService = new IcoVestingService();

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const operatorId = (req as any).userId;
    const body = await req.json();
    const dto = schema.parse(body);
    const schedule = await vestingService.updateMerkleRoot(
      params.id,
      dto.merkleRoot,
      dto.leafCount,
      operatorId
    );
    return NextResponse.json({ success: true, data: schedule });
  })
);
