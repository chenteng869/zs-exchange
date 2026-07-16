/**
 * /api/v1/solana-ico/reconciliation/[id]
 *
 *  - GET  报告详情
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoReconciliationService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const reconService = new IcoReconciliationService();

export const GET = withErrorHandler(
  withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const report = await reconService.getReport(params.id);
    return NextResponse.json({ success: true, data: report });
  })
);
