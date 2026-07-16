/**
 * /api/v1/solana-ico/vesting
 *
 *  - GET    /                       列表
 *  - POST   /                       创建 schedule
 *  - GET    /:id                    详情
 *  - POST   /:id/activate           激活
 *  - POST   /:id/bind-chain         绑定链上
 *  - POST   /:id/merkle             更新 merkle root
 *  - POST   /:id/pause              暂停
 *  - POST   /:id/resume             恢复
 *  - POST   /:id/complete           完成
 *  - POST   /:id/cancel             取消
 *  - GET    /:id/claimable?userId   用户可领取金额
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoVestingService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';

const createSchema = z.object({
  tokenId: z.string().uuid(),
  name: z.string().min(1).max(128),
  totalAmount: z.string().min(1),
  tgePercent: z.string().optional(),
  cliffDays: z.number().int().min(0).optional(),
  vestingDays: z.number().int().min(0),
  vestingType: z.enum(['linear', 'cliff', 'step']).optional(),
  tgeAt: z.string().datetime().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  authority: z.string().min(32).max(64),
  metadata: z.record(z.any()).optional(),
});

const vestingService = new IcoVestingService();

export const GET = withErrorHandler(
  withAdminAuth(async (req: NextRequest) => {
    const url = new URL(req.url);
    const tokenId = url.searchParams.get('tokenId') ?? undefined;
    const status = url.searchParams.get('status') ?? undefined;
    const skip = Number(url.searchParams.get('skip') ?? 0);
    const take = Number(url.searchParams.get('take') ?? 20);
    const result = await vestingService.listSchedules({ tokenId, status, skip, take });
    return NextResponse.json({ success: true, ...result });
  })
);

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest) => {
    const body = await req.json();
    const dto = createSchema.parse(body);
    const operatorId = (req as any).userId;
    const schedule = await vestingService.createSchedule({
      ...dto,
      tgeAt: dto.tgeAt ? new Date(dto.tgeAt) : undefined,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
      createdBy: operatorId,
    });
    return NextResponse.json({ success: true, data: schedule }, { status: 201 });
  })
);
