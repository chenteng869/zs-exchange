/**
 * FJN Region Service REST API
 * /api/v1/fjn/region
 *
 * 文档：H020 §6
 *
 * 端点：
 *  - GET  ?action=list-regions                列出地区
 *  - GET  ?action=region-detail&id=xxx        地区详情
 *  - GET  ?action=region-by-code&code=xxx     按 code 查地区
 *  - GET  ?action=list-restrictions           列出地区限制
 *  - GET  ?action=list-ip-geos                列出 IP Geo 段
 *  - GET  ?action=country-tree&countryCode=xx 国家树（3 级）
 *  - GET  ?action=descendants&id=xxx          下属地区
 *  - GET  ?action=path-to-root&id=xxx         到根节点的路径
 *  - GET  ?action=summary                     地区汇总
 *  - POST action=create-region                创建地区 (admin)
 *  - POST action=update-region                更新地区 (admin)
 *  - POST action=region-status                地区状态变更 disable/enable/deprecate (admin)
 *  - POST action=add-restriction              添加限制 (admin)
 *  - POST action=restriction-status           限制状态变更 disable/enable/expire (admin)
 *  - POST action=check-restriction            实时限制校验（核心）
 *  - POST action=register-ip-geo              注册 IP 段 (admin)
 *  - POST action=ip-geo-status                IP Geo 状态变更 (admin)
 *  - POST action=resolve-ip                   解析 IP 地址（核心）
 *
 * 合计 18 端点
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError, created } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { logger } from '@/lib/logger';
import { FjnRegionService } from '@/lib/fjn/services/region-service';
import { FjnError } from '@/lib/fjn/errors';

// 强制动态路由：使用 nextUrl.searchParams 必须开启
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================
// GET handlers
// ============================================================
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    // Region
    case 'list-regions':
      return withAuth(req, () => listRegions(req));
    case 'region-detail':
      return withAuth(req, () => getRegionDetail(req));
    case 'region-by-code':
      return withAuth(req, () => getRegionByCode(req));
    case 'country-tree':
      return withAuth(req, () => getCountryTree(req));
    case 'descendants':
      return withAuth(req, () => getDescendants(req));
    case 'path-to-root':
      return withAuth(req, () => getPathToRoot(req));

    // Restriction
    case 'list-restrictions':
      return withAuth(req, () => listRestrictions(req));

    // IP Geo
    case 'list-ip-geos':
      return withAdminAuth(req, () => listIpGeos(req));

    // Summary
    case 'summary':
      return withAdminAuth(req, () => getRegionSummary());

    default:
      return badRequest(
        'Invalid action. Supported (GET): list-regions, region-detail, region-by-code, country-tree, descendants, path-to-root, list-restrictions, list-ip-geos, summary',
      );
  }
}

// ============================================================
// POST handlers
// ============================================================
export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    // Region
    case 'create-region':
      return withAdminAuth(req, (ctx) => createRegion(req, ctx.userId));
    case 'update-region':
      return withAdminAuth(req, (ctx) => updateRegion(req, ctx.userId));
    case 'region-status':
      return withAdminAuth(req, (ctx) => changeRegionStatus(req, ctx.userId));

    // Restriction
    case 'add-restriction':
      return withAdminAuth(req, (ctx) => addRestriction(req, ctx.userId));
    case 'restriction-status':
      return withAdminAuth(req, (ctx) => changeRestrictionStatus(req, ctx.userId));
    case 'check-restriction':
      return withAuth(req, () => checkRestriction(req));

    // IP Geo
    case 'register-ip-geo':
      return withAdminAuth(req, (ctx) => registerIpGeo(req, ctx.userId));
    case 'ip-geo-status':
      return withAdminAuth(req, (ctx) => changeIpGeoStatus(req, ctx.userId));
    case 'resolve-ip':
      return withAuth(req, () => resolveIp(req));

    default:
      return badRequest(
        'Invalid action. Supported (POST): create-region, update-region, region-status, add-restriction, restriction-status, check-restriction, register-ip-geo, ip-geo-status, resolve-ip',
      );
  }
}

// ============================================================
// Region handlers
// ============================================================

/** 列出地区 */
async function listRegions(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const level = p.get('level') as any;
  const countryCode = p.get('countryCode') || undefined;
  const status = p.get('status') as any;
  const parentId = p.get('parentId');

  try {
    const svc = new FjnRegionService();
    const result = await svc.listRegions({
      level,
      countryCode,
      status,
      parentId: parentId === null ? null : parentId || undefined,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/region list-regions');
  }
}

/** 地区详情 */
async function getRegionDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnRegionService();
    const region = await svc.findRegionById(id);
    if (!region) return notFound('Region not found');
    return success(region);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/region region-detail');
  }
}

/** 按 code 查地区 */
async function getRegionByCode(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return badRequest('Missing code');
  try {
    const svc = new FjnRegionService();
    const region = await svc.findRegionByCode(code);
    if (!region) return notFound('Region not found');
    return success(region);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/region region-by-code');
  }
}

/** 国家树（3 级：country → province → city） */
async function getCountryTree(req: NextRequest) {
  const countryCode = req.nextUrl.searchParams.get('countryCode');
  if (!countryCode) return badRequest('Missing countryCode');
  try {
    const svc = new FjnRegionService();
    const tree = await svc.getCountryTree(countryCode);
    return success({ countryCode, tree });
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/region country-tree');
  }
}

/** 下属地区 */
async function getDescendants(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnRegionService();
    const descendants = await svc.getDescendants(id);
    return success({ regionId: id, descendants, total: descendants.length });
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/region descendants');
  }
}

/** 到根节点的路径 */
async function getPathToRoot(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnRegionService();
    const path = await svc.getPathToRoot(id);
    return success({ regionId: id, path, depth: path.length });
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/region path-to-root');
  }
}

/** 创建地区 */
async function createRegion(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { regionCode, regionName, level, parentId, countryCode, subdivisionCode, locale, timezone, latitude, longitude, sort, metadata } = body;
    if (!regionCode || !regionName || !level || !countryCode) {
      return badRequest('Missing required: regionCode, regionName, level, countryCode');
    }
    const svc = new FjnRegionService();
    const result = await svc.createRegion({
      regionCode, regionName, level, parentId, countryCode, subdivisionCode, locale, timezone,
      latitude, longitude, sort, metadata,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/region create-region');
  }
}

/** 更新地区 */
async function updateRegion(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, regionName, subdivisionCode, locale, timezone, latitude, longitude, sort, metadata } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnRegionService();
    const result = await svc.updateRegion(id, {
      regionName, subdivisionCode, locale, timezone, latitude, longitude, sort, metadata,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/region update-region');
  }
}

/** 地区状态变更 */
async function changeRegionStatus(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, targetStatus, reason } = body;
    if (!id || !targetStatus) return badRequest('Missing required: id, targetStatus');
    const svc = new FjnRegionService();
    let result;
    if (targetStatus === 'disabled') result = await svc.disableRegion(id, { reason, operatorId });
    else if (targetStatus === 'enabled') result = await svc.enableRegion(id, { operatorId });
    else if (targetStatus === 'deprecated') result = await svc.deprecateRegion(id, { reason, operatorId });
    else return badRequest('targetStatus must be one of: disabled, enabled, deprecated');
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/region region-status');
  }
}

// ============================================================
// Restriction handlers
// ============================================================

/** 列出地区限制 */
async function listRestrictions(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const regionId = p.get('regionId') || undefined;
  const restrictionType = p.get('restrictionType') as any;
  const status = p.get('status') as any;

  try {
    const svc = new FjnRegionService();
    const result = await svc.listRestrictions({ regionId, restrictionType, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/region list-restrictions');
  }
}

/** 添加限制 */
async function addRestriction(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { regionId, restrictionType, restrictionSource, reason, refNo, validFrom, expiresDays, expiresAt, metadata } = body;
    if (!regionId || !restrictionType) return badRequest('Missing required: regionId, restrictionType');
    const svc = new FjnRegionService();
    const result = await svc.addRestriction(regionId, {
      restrictionType, restrictionSource, reason, refNo,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      expiresDays, expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      metadata,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/region add-restriction');
  }
}

/** 限制状态变更 */
async function changeRestrictionStatus(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { restrictionId, targetStatus, reason } = body;
    if (!restrictionId || !targetStatus) return badRequest('Missing required: restrictionId, targetStatus');
    const svc = new FjnRegionService();
    let result;
    if (targetStatus === 'disabled') result = await svc.disableRestriction(restrictionId, { reason, operatorId });
    else if (targetStatus === 'enabled') result = await svc.enableRestriction(restrictionId, { operatorId });
    else if (targetStatus === 'expired') result = await svc.expireRestriction(restrictionId);
    else return badRequest('targetStatus must be one of: disabled, enabled, expired');
    return success(result);
  } catch (e:any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/region restriction-status');
  }
}

/** 实时限制校验（核心） */
async function checkRestriction(req: NextRequest) {
  try {
    const body = await req.json();
    const { regionId, kycLevel, userId, action } = body;
    if (!regionId) return badRequest('Missing required: regionId');
    const svc = new FjnRegionService();
    const result = await svc.checkRestriction(regionId, { kycLevel, userId, action });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/region check-restriction');
  }
}

// ============================================================
// IP Geo handlers
// ============================================================

/** 列出 IP Geo 段 */
async function listIpGeos(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const ipVersion = p.get('ipVersion') as any;
  const regionId = p.get('regionId') || undefined;
  const countryCode = p.get('countryCode') || undefined;
  const status = p.get('status') as any;

  try {
    const svc = new FjnRegionService();
    const result = await svc.listIpGeos({ ipVersion, regionId, countryCode, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/region list-ip-geos');
  }
}

/** 注册 IP 段 */
async function registerIpGeo(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { ipVersion, ipRangeStart, ipRangeEnd, regionId, countryCode, provinceCode, cityCode, isp, connectionType, confidence, source } = body;
    if (!ipRangeStart || !ipRangeEnd || !regionId || !countryCode) {
      return badRequest('Missing required: ipRangeStart, ipRangeEnd, regionId, countryCode');
    }
    const svc = new FjnRegionService();
    const result = await svc.registerIpGeo({
      ipVersion, ipRangeStart, ipRangeEnd, regionId, countryCode, provinceCode, cityCode,
      isp, connectionType, confidence, source,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/region register-ip-geo');
  }
}

/** IP Geo 状态变更 */
async function changeIpGeoStatus(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, targetStatus } = body;
    if (!id || !targetStatus) return badRequest('Missing required: id, targetStatus');
    const svc = new FjnRegionService();
    let result;
    if (targetStatus === 'disabled') result = await svc.disableIpGeo(id);
    else if (targetStatus === 'enabled') result = await svc.enableIpGeo(id);
    else return badRequest('targetStatus must be one of: disabled, enabled');
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/region ip-geo-status');
  }
}

/** 解析 IP 地址（核心） */
async function resolveIp(req: NextRequest) {
  try {
    const body = await req.json();
    const { ipAddress } = body;
    if (!ipAddress) return badRequest('Missing required: ipAddress');
    const svc = new FjnRegionService();
    const result = await svc.resolveIp({ ipAddress });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/region resolve-ip');
  }
}

// ============================================================
// Summary
// ============================================================

/** 地区汇总 */
async function getRegionSummary() {
  try {
    const svc = new FjnRegionService();
    const result = await svc.getRegionSummary();
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/region summary');
  }
}
