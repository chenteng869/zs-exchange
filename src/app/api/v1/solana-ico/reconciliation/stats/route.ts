/**
 * /api/v1/solana-ico/reconciliation/stats
 *
 *  - GET  对账统计
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoReconciliationService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const reconService = new IcoReconciliationService();

export const GET = withErrorHandler(
  withAdminAuth(async (req: NextRequest) => {
    const stats = await reconService.getReconciliationStats();
    return NextResponse.json({ success: true, data: stats });
  })
);
