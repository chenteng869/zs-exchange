/**
 * FJN Release Service REST API
 * /api/v1/fjn/release
 *
 * 文档：H012
 *
 * 端点：
 *  - GET  ?action=pool-list              释放池列表
 *  - GET  ?action=claim-list             领取记录列表
 *  - GET  ?action=calculation-list       某释放池的用户分配明细（需 poolId）
 *  - POST action=create-pool             创建释放池 (admin)
 *  - POST action=approve-pool            批准释放池 (admin)
 *  - POST action=close-pool              关闭释放池 (admin)
 *  - POST action=cancel-pool             取消释放池 (admin)
 */

import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAdminAuth } from '@/lib/api/middleware';
import { FjnReleaseService } from '@/lib/fjn/services/release-service';
import { FjnReleaseError } from '@/lib/fjn/services/release-errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'pool-list':
      return withAdminAuth(req, () => listPools(req));
    case 'claim-list':
      return withAdminAuth(req, () => listClaims(req));
    case 'calculation-list':
      return withAdminAuth(req, () => listCalculations(req));
    default:
      return badRequest('Invalid action. Supported (GET): pool-list, claim-list, calculation-list');
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'create-pool':
      return withAdminAuth(req, (ctx) => createPool(req, ctx.userId));
    case 'approve-pool':
      return withAdminAuth(req, (ctx) => approvePool(req, ctx.userId));
    case 'close-pool':
      return withAdminAuth(req, (ctx) => closePool(req, ctx.userId));
    case 'cancel-pool':
      return withAdminAuth(req, (ctx) => cancelPool(req, ctx.userId));
    default:
      return badRequest('Invalid action. Supported (POST): create-pool, approve-pool, close-pool, cancel-pool');
  }
}

async function listPools(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const period = p.get('period') || undefined;
  const poolType = (p.get('poolType') as any) || undefined;
  const status = (p.get('status') as any) || undefined;
  try {
    const svc = new FjnReleaseService();
    const result = await svc.listPools({ period, poolType, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnReleaseError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/release pool-list');
  }
}

async function listClaims(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const poolId = p.get('poolId') || undefined;
  const userId = p.get('userId') || undefined;
  const status = (p.get('status') as any) || undefined;
  try {
    const svc = new FjnReleaseService();
    const result = await svc.listClaims({ poolId, userId, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnReleaseError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/release claim-list');
  }
}

async function listCalculations(req: NextRequest) {
  const poolId = req.nextUrl.searchParams.get('poolId');
  if (!poolId) return badRequest('Missing poolId');
  try {
    const userId = req.nextUrl.searchParams.get('userId') || undefined;
    const svc = new FjnReleaseService();
    const result = await svc.listCalculations(poolId, userId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnReleaseError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/release calculation-list');
  }
}

async function createPool(req: NextRequest, createdBy: string) {
  try {
    const body = await req.json();
    const { poolName, period, poolType, totalAmount, currency, description, monthlyCap } = body;
    if (!poolName || !period || !poolType || !totalAmount) {
      return badRequest('Missing required: poolName, period, poolType, totalAmount');
    }
    const svc = new FjnReleaseService();
    const result = await svc.createPool({ poolName, period, poolType, totalAmount: String(totalAmount), currency, description, monthlyCap, createdBy });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnReleaseError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/release create-pool');
  }
}

async function approvePool(req: NextRequest, approverId: string) {
  try {
    const body = await req.json();
    const { poolId, comment } = body;
    if (!poolId) return badRequest('Missing required: poolId');
    const svc = new FjnReleaseService();
    const result = await svc.approvePool({ poolId, approverId, comment });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnReleaseError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/release approve-pool');
  }
}

async function closePool(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { poolId, reason } = body;
    if (!poolId || !reason) return badRequest('Missing required: poolId, reason');
    const svc = new FjnReleaseService();
    const result = await svc.closePool({ poolId, reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnReleaseError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/release close-pool');
  }
}

async function cancelPool(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { poolId, reason } = body;
    if (!poolId || !reason) return badRequest('Missing required: poolId, reason');
    const svc = new FjnReleaseService();
    const result = await svc.cancelPool({ poolId, reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnReleaseError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/release cancel-pool');
  }
}
