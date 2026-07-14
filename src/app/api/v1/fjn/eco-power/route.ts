/**
 * EcoPower Service REST API
 * /api/v1/fjn/eco-power
 *
 * 文档：H015 §3.10
 *
 * 端点：
 *  - GET  ?action=account-list           算力账户列表
 *  - GET  ?action=ledger-list            算力流水列表
 *  - POST action=freeze-power            冻结算力 (admin)
 *  - POST action=unfreeze-power          解冻算力 (admin)
 */

import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAdminAuth } from '@/lib/api/middleware';
import { FjnEcoPowerService } from '@/lib/fjn/services/eco-power-service';
import { FjnEcoPowerError } from '@/lib/fjn/services/eco-power-errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'account-list':
      return withAdminAuth(req, () => listAccounts(req));
    case 'ledger-list':
      return withAdminAuth(req, () => listLedgers(req));
    default:
      return badRequest('Invalid action. Supported (GET): account-list, ledger-list');
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'freeze-power':
      return withAdminAuth(req, (ctx) => freezePower(req, ctx.userId));
    case 'unfreeze-power':
      return withAdminAuth(req, (ctx) => unfreezePower(req, ctx.userId));
    default:
      return badRequest('Invalid action. Supported (POST): freeze-power, unfreeze-power');
  }
}

async function listAccounts(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const status = (p.get('status') as any) || undefined;
  try {
    const svc = new FjnEcoPowerService();
    const result = await svc.listAccounts({ status, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnEcoPowerError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/eco-power account-list');
  }
}

async function listLedgers(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const userId = p.get('userId') || undefined;
  const powerType = (p.get('powerType') as any) || undefined;
  const changeType = (p.get('changeType') as any) || undefined;
  try {
    const svc = new FjnEcoPowerService();
    const result = await svc.listLedgers({ userId, powerType, changeType, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnEcoPowerError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/eco-power ledger-list');
  }
}

async function freezePower(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { userId, powerType, amount, reason } = body;
    if (!userId || !powerType || !amount || !reason) {
      return badRequest('Missing required: userId, powerType, amount, reason');
    }
    const svc = new FjnEcoPowerService();
    const result = await svc.freezePower({ userId, powerType, amount: String(amount), reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnEcoPowerError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/eco-power freeze-power');
  }
}

async function unfreezePower(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { userId, ledgerId, reason } = body;
    if (!userId || !ledgerId || !reason) return badRequest('Missing required: userId, ledgerId, reason');
    const svc = new FjnEcoPowerService();
    const result = await svc.unfreezePower({ userId, ledgerId, reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnEcoPowerError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/eco-power unfreeze-power');
  }
}
