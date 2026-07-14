/**
 * FJN Points Service REST API
 * /api/v1/fjn/points
 *
 * 文档：H021
 *
 * 端点：
 *  - GET  ?action=ledgers                流水列表（多维过滤 + 分页）
 *  - GET  ?action=global-summary&assetType=xxx   全网积分总览
 *  - GET  ?action=freezes&userId=xxx     用户冻结记录
 *  - POST action=freeze                  冻结积分 (admin)
 *  - POST action=unfreeze                解冻积分 (admin)
 *  - POST action=revoke-freeze           撤销冻结 (admin)
 */

import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAdminAuth } from '@/lib/api/middleware';
import { FjnPointsService } from '@/lib/fjn/services/points-service';
import { POINTS_ASSET_TYPE } from '@/lib/fjn/services/points-state-machine';
import { FjnError } from '@/lib/fjn/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'ledgers':
      return withAdminAuth(req, () => listLedgers(req));
    case 'global-summary':
      return withAdminAuth(req, () => globalSummary(req));
    case 'freezes':
      return withAdminAuth(req, () => listFreezes(req));
    default:
      return badRequest('Invalid action. Supported (GET): ledgers, global-summary, freezes');
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'freeze':
      return withAdminAuth(req, (ctx) => freezePoints(req, ctx.userId));
    case 'unfreeze':
      return withAdminAuth(req, (ctx) => unfreezePoints(req, ctx.userId));
    case 'revoke-freeze':
      return withAdminAuth(req, (ctx) => revokeFreeze(req, ctx.userId));
    default:
      return badRequest('Invalid action. Supported (POST): freeze, unfreeze, revoke-freeze');
  }
}

async function listLedgers(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const userId = p.get('userId') || undefined;
  const assetType = (p.get('assetType') as any) || undefined;
  const direction = (p.get('direction') as any) || undefined;
  const bizType = (p.get('bizType') as any) || undefined;
  try {
    const svc = new FjnPointsService();
    const result = await svc.listLedgers({ page, pageSize, userId, assetType, direction, bizType });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/points ledgers');
  }
}

async function globalSummary(req: NextRequest) {
  try {
    const svc = new FjnPointsService();
    const [fj369, cfj369] = await Promise.all([
      svc.getGlobalSummary(POINTS_ASSET_TYPE.FJ369_POINTS as any),
      svc.getGlobalSummary(POINTS_ASSET_TYPE.CFJ369 as any),
    ]);
    return success({ fj369_points: fj369, cfj369 });
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/points global-summary');
  }
}

async function listFreezes(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return badRequest('Missing userId');
  try {
    const svc = new FjnPointsService();
    const result = await svc.listFreezes(userId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/points freezes');
  }
}

async function freezePoints(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { userId, assetType, amount, reason } = body;
    if (!userId || !assetType || !amount || !reason) {
      return badRequest('Missing required: userId, assetType, amount, reason');
    }
    const svc = new FjnPointsService();
    const result = await svc.freezePoints({ userId, assetType, amount: String(amount), reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/points freeze');
  }
}

async function unfreezePoints(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { freezeId, unfreezeAmount, reason } = body;
    if (!freezeId || !unfreezeAmount) return badRequest('Missing required: freezeId, unfreezeAmount');
    const svc = new FjnPointsService();
    const result = await svc.unfreezePoints({ freezeId, unfreezeAmount: String(unfreezeAmount), reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/points unfreeze');
  }
}

async function revokeFreeze(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { freezeId, reason } = body;
    if (!freezeId || !reason) return badRequest('Missing required: freezeId, reason');
    const svc = new FjnPointsService();
    const result = await svc.revokeFreeze({ freezeId, reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/points revoke-freeze');
  }
}
