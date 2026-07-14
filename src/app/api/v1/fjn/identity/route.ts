/**
 * FJN Identity Service REST API
 * /api/v1/fjn/identity
 *
 * 文档：H016
 *
 * 端点：
 *  - GET  ?action=list                用户列表（多维过滤 + 分页）
 *  - GET  ?action=detail&id=xxx        用户详情
 *  - POST action=change-status         变更用户状态 (admin)
 *  - POST action=close                 关闭用户 (admin)
 *  - POST action=change-vip-level      变更 VIP 等级 (admin)
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAdminAuth } from '@/lib/api/middleware';
import { FjnIdentityService } from '@/lib/fjn/services/identity-service';
import { FjnError } from '@/lib/fjn/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'list':
      return withAdminAuth(req, () => listUsers(req));
    case 'detail':
      return withAdminAuth(req, () => getUserDetail(req));
    default:
      return badRequest('Invalid action. Supported (GET): list, detail');
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'change-status':
      return withAdminAuth(req, (ctx) => changeStatus(req, ctx.userId));
    case 'close':
      return withAdminAuth(req, (ctx) => closeUser(req, ctx.userId));
    case 'change-vip-level':
      return withAdminAuth(req, () => changeVipLevel(req));
    default:
      return badRequest('Invalid action. Supported (POST): change-status, close, change-vip-level');
  }
}

async function listUsers(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const status = (p.get('status') as any) || undefined;
  const userType = (p.get('userType') as any) || undefined;
  const countryCode = p.get('countryCode') || undefined;
  const search = p.get('search') || undefined;
  try {
    const svc = new FjnIdentityService();
    const result = await svc.listUsers({ status, userType, countryCode, search, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/identity list');
  }
}

async function getUserDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnIdentityService();
    const user = await svc.getUserById(id);
    if (!user) return notFound('User not found');
    return success(user);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/identity detail');
  }
}

async function changeStatus(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { userId, toStatus, reason } = body;
    if (!userId || !toStatus) return badRequest('Missing required: userId, toStatus');
    const svc = new FjnIdentityService();
    const result = await svc.changeStatus({ userId, toStatus, reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/identity change-status');
  }
}

async function closeUser(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { userId, reason } = body;
    if (!userId || !reason) return badRequest('Missing required: userId, reason');
    const svc = new FjnIdentityService();
    const result = await svc.closeUser({ userId, reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/identity close');
  }
}

async function changeVipLevel(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, toLevel, reason } = body;
    if (!userId || toLevel == null || !reason) return badRequest('Missing required: userId, toLevel, reason');
    const svc = new FjnIdentityService();
    const result = await svc.changeVipLevel({ userId, toLevel, reason });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/identity change-vip-level');
  }
}
