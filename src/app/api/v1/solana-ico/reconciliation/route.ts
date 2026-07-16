/**
 * /api/v1/solana-ico/reconciliation
 *
 * ICO 链上链下对账 API
 *  - GET   /                     列出对账报告（admin）
 *  - POST  /                     触发一次对账任务（admin）
 *  - GET   /:id                  报告详情（含 discrepancies）
 *  - GET   /discrepancies        列出所有差异
 *  - GET   /stats                对账统计
 *  - POST  /discrepancies/:id/fix 标记差异已修复
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoReconciliationService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';

const runSchema = z.object({
  type: z.enum(['token', 'order', 'schedule', 'treasury', 'all']),
  targetId: z.string().uuid().optional(),
  chainCluster: z.string().optional(),
  startSlot: z.string().optional(),
  endSlot: z.string().optional(),
  autoFix: z.boolean().optional(),
});

const reconService = new IcoReconciliationService();

export const GET = withErrorHandler(
  withAdminAuth(async (req: NextRequest) => {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') ?? undefined;
    const status = url.searchParams.get('status') ?? undefined;
    const chainCluster = url.searchParams.get('chainCluster') ?? undefined;
    const skip = Number(url.searchParams.get('skip') ?? 0);
    const take = Number(url.searchParams.get('take') ?? 20);

    const result = await reconService.listReports({ type, status, chainCluster, skip, take });
    return NextResponse.json({ success: true, ...result });
  })
);

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest) => {
    const body = await req.json();
    const dto = runSchema.parse(body);
    const operatorId = (req as any).userId;

    const report = await reconService.runReconciliation({
      type: dto.type,
      targetId: dto.targetId,
      chainCluster: dto.chainCluster,
      startSlot: dto.startSlot ? BigInt(dto.startSlot) : undefined,
      endSlot: dto.endSlot ? BigInt(dto.endSlot) : undefined,
      autoFix: dto.autoFix ?? false,
      operatorId,
    });
    return NextResponse.json({ success: true, data: report }, { status: 201 });
  })
);
