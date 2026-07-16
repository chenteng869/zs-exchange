/**
 * /api/v1/solana-ico/claims
 *
 * 释放领取记录管理
 *  - GET    /                  列表（admin）
 *  - POST   /                  批量生成待领取（admin / cron）
 *  - GET    /:id               详情
 *  - POST   /:id/submit        提交领取（user）
 *  - POST   /:id/fail          标记失败（admin / system）
 *  - POST   /:id/expire        标记过期（admin / system）
 *  - GET    /user/:userId      用户的领取记录
 *  - GET    /user/:userId/pending 用户的待领取列表
 *  - GET    /user/:userId/stats   用户的领取统计
 *  - GET    /schedule/:scheduleId 按 schedule 列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoClaimService } from '@/lib/solana-ico';
import { withAdminAuth, withUserAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';

const generateSchema = z.object({
  scheduleId: z.string().uuid(),
  allocations: z
    .array(
      z.object({
        userId: z.string().uuid(),
        orderId: z.string().uuid(),
        amount: z.string().min(1),
        merkleProof: z.array(z.string()),
        leafHash: z.string().min(1),
        claimableAt: z.string().datetime(),
      })
    )
    .min(1),
});

const claimService = new IcoClaimService();

export const GET = withErrorHandler(
  withAdminAuth(async (req: NextRequest) => {
    const url = new URL(req.url);
    const scheduleId = url.searchParams.get('scheduleId') ?? undefined;
    const userId = url.searchParams.get('userId') ?? undefined;
    const status = url.searchParams.get('status') ?? undefined;
    const skip = Number(url.searchParams.get('skip') ?? 0);
    const take = Number(url.searchParams.get('take') ?? 20);

    const result = await claimService.listClaims({ scheduleId, userId, status, skip, take });
    return NextResponse.json({ success: true, ...result });
  })
);

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest) => {
    const body = await req.json();
    const dto = generateSchema.parse({
      ...body,
      allocations: body.allocations?.map((a: any) => ({
        ...a,
        claimableAt: new Date(a.claimableAt),
      })),
    });
    const operatorId = (req as any).userId;
    const claims = await claimService.generateClaims({
      ...dto,
      operatorId,
    } as any);
    return NextResponse.json({ success: true, data: claims, count: claims.length }, { status: 201 });
  })
);
