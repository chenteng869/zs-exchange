/**
 * /api/v1/solana-ico/reconciliation/discrepancies/[id]/fix
 *  - POST  人工标记差异已修复
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoReconciliationService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';

const fixSchema = z.object({
  note: z.string().min(1).max(1000),
});

const reconService = new IcoReconciliationService();

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const operatorId = (req as any).userId;
    const body = await req.json();
    const dto = fixSchema.parse(body);
    const result = await reconService.markDiscrepancyFixed(params.id, dto.note, operatorId);
    return NextResponse.json({ success: true, data: result });
  })
);
