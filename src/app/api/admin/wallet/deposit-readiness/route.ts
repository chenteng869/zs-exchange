import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import { buildDepositReadinessReport } from '@/lib/wallet/deposit-readiness';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const report = await buildDepositReadinessReport({
      currency: params.get('currency') || undefined,
      chain: params.get('chain') || undefined,
      probeRpc: params.get('probeRpc') !== 'false',
      requireMoonPay: params.get('requireMoonPay') !== 'false',
    });

    return success(report, report.status === 'blocked' ? 503 : 200);
  });
}
