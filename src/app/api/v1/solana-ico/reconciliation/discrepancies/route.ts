/**
 * /api/v1/solana-ico/reconciliation/discrepancies
 *
 *  - GET  列出对账差异
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoReconciliationService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const reconService = new IcoReconciliationService();

export const GET = withErrorHandler(
  withAdminAuth(async (req: NextRequest) => {
    const url = new URL(req.url);
    const reportId = url.searchParams.get('reportId') ?? undefined;
    const type = url.searchParams.get('type') ?? undefined;
    const severity = url.searchParams.get('severity') ?? undefined;
    const autoFixedParam = url.searchParams.get('autoFixed');
    const autoFixed = autoFixedParam === 'true' ? true : autoFixedParam === 'false' ? false : undefined;
    const skip = Number(url.searchParams.get('skip') ?? 0);
    const take = Number(url.searchParams.get('take') ?? 50);

    const result = await reconService.listDiscrepancies({
      reportId,
      type,
      severity,
      autoFixed,
      skip,
      take,
    });
    return NextResponse.json({ success: true, ...result });
  })
);
