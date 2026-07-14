/**
 * FJN Permission Service REST API
 * /api/v1/fjn/permission
 *
 * 文档：H019 §6
 *
 * 端点：
 *  - GET  ?action=roles                        列出角色
 *  - GET  ?action=role-detail&id=xxx           角色详情
 *  - GET  ?action=role-by-code&code=xxx        按 code 查角色
 *  - GET  ?action=permissions                  列出权限
 *  - GET  ?action=permission-detail&id=xxx     权限详情
 *  - GET  ?action=permission-by-code&code=xxx  按 code 查权限
 *  - GET  ?action=role-permissions&roleId=xxx  角色的权限列表
 *  - GET  ?action=user-roles                   用户角色列表
 *  - GET  ?action=user-effective-roles&userId  用户的有效角色（聚合）
 *  - GET  ?action=user-permissions&userId=xxx  用户直授权限
 *  - GET  ?action=policies                     列出 ABAC 策略
 *  - GET  ?action=access-logs                  访问日志
 *  - GET  ?action=summary                      RBAC+ABAC 汇总
 *  - POST action=create-role                   创建角色 (admin)
 *  - POST action=update-role                   更新角色 (admin)
 *  - POST action=role-status                   角色状态变更 disable/enable/deprecate (admin)
 *  - POST action=create-permission             创建权限 (admin)
 *  - POST action=update-permission             更新权限 (admin)
 *  - POST action=disable-permission            禁用权限 (admin)
 *  - POST action=grant-role-permission         给角色授权 (admin)
 *  - POST action=revoke-role-permission        撤销角色权限 (admin)
 *  - POST action=assign-user-role              分配角色给用户 (admin)
 *  - POST action=revoke-user-role              撤销用户角色 (admin)
 *  - POST action=grant-user-permission         直授用户权限 (admin)
 *  - POST action=revoke-user-permission        撤销用户直授权限 (admin)
 *  - POST action=create-policy                 创建 ABAC 策略 (admin)
 *  - POST action=update-policy                 更新 ABAC 策略 (admin)
 *  - POST action=disable-policy                禁用 ABAC 策略 (admin)
 *  - POST action=evaluate-access               访问评估（核心 RBAC+ABAC）
 *  - POST action=log-access                    记录访问日志
 *
 * 合计 29 端点
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError, created } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { logger } from '@/lib/logger';
import { FjnPermissionService } from '@/lib/fjn/services/permission-service';
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
    // Role
    case 'roles':
      return withAuth(req, () => listRoles(req));
    case 'role-detail':
      return withAuth(req, () => getRoleDetail(req));
    case 'role-by-code':
      return withAuth(req, () => getRoleByCode(req));

    // Permission
    case 'permissions':
      return withAuth(req, () => listPermissions(req));
    case 'permission-detail':
      return withAuth(req, () => getPermissionDetail(req));
    case 'permission-by-code':
      return withAuth(req, () => getPermissionByCode(req));

    // RolePermission
    case 'role-permissions':
      return withAuth(req, () => listRolePermissions(req));

    // P1-1 IDOR 修复：角色分配 → admin only
    case 'user-roles':
      return withAdminAuth(req, () => listUserRoles(req));
    // P1-1 IDOR 修复：用户看自己的有效角色，admin 看任何
    case 'user-effective-roles':
      return withAuth(req, (ctx) =>
        getUserEffectiveRoles(req, ctx.userId, ctx.user?.userType === 'admin'),
      );
    // P1-1 IDOR 修复：直授权限 → admin only
    case 'user-permissions':
      return withAdminAuth(req, () => listUserPermissions(req));

    // Policy (ABAC)
    case 'policies':
      return withAuth(req, () => listPolicies(req));

    // AccessLog
    case 'access-logs':
      return withAdminAuth(req, () => listAccessLogs(req));

    // Summary
    case 'summary':
      return withAdminAuth(req, () => getPermissionSummary());

    default:
      return badRequest(
        'Invalid action. Supported (GET): roles, role-detail, role-by-code, permissions, permission-detail, permission-by-code, role-permissions, user-roles, user-effective-roles, user-permissions, policies, access-logs, summary',
      );
  }
}

// ============================================================
// POST handlers
// ============================================================
export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    // Role
    case 'create-role':
      return withAdminAuth(req, (ctx) => createRole(req, ctx.userId));
    case 'update-role':
      return withAdminAuth(req, (ctx) => updateRole(req, ctx.userId));
    case 'role-status':
      return withAdminAuth(req, (ctx) => changeRoleStatus(req, ctx.userId));

    // Permission
    case 'create-permission':
      return withAdminAuth(req, (ctx) => createPermission(req, ctx.userId));
    case 'update-permission':
      return withAdminAuth(req, (ctx) => updatePermission(req, ctx.userId));
    case 'disable-permission':
      return withAdminAuth(req, (ctx) => disablePermission(req, ctx.userId));

    // RolePermission
    case 'grant-role-permission':
      return withAdminAuth(req, (ctx) => grantRolePermission(req, ctx.userId));
    case 'revoke-role-permission':
      return withAdminAuth(req, (ctx) => revokeRolePermission(req, ctx.userId));

    // UserRole
    case 'assign-user-role':
      return withAdminAuth(req, (ctx) => assignUserRole(req, ctx.userId));
    case 'revoke-user-role':
      return withAdminAuth(req, (ctx) => revokeUserRole(req, ctx.userId));

    // UserPermission
    case 'grant-user-permission':
      return withAdminAuth(req, (ctx) => grantUserPermission(req, ctx.userId));
    case 'revoke-user-permission':
      return withAdminAuth(req, (ctx) => revokeUserPermission(req, ctx.userId));

    // Policy (ABAC)
    case 'create-policy':
      return withAdminAuth(req, (ctx) => createPolicy(req, ctx.userId));
    case 'update-policy':
      return withAdminAuth(req, (ctx) => updatePolicy(req, ctx.userId));
    case 'disable-policy':
      return withAdminAuth(req, (ctx) => disablePolicy(req, ctx.userId));

    // Access
    case 'evaluate-access':
      return withAuth(req, (ctx) => evaluateAccess(req, ctx.userId));
    case 'log-access':
      return withAuth(req, (ctx) => logAccess(req, ctx.userId));

    default:
      return badRequest(
        'Invalid action. Supported (POST): create-role, update-role, role-status, create-permission, update-permission, disable-permission, grant-role-permission, revoke-role-permission, assign-user-role, revoke-user-role, grant-user-permission, revoke-user-permission, create-policy, update-policy, disable-policy, evaluate-access, log-access',
      );
  }
}

// ============================================================
// Role GET handlers
// ============================================================

/** 列出角色 */
async function listRoles(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const status = p.get('status') as any;
  const roleType = p.get('roleType') as any;
  const isSystem = p.get('isSystem') === 'true' ? true : p.get('isSystem') === 'false' ? false : undefined;
  const parentId = p.get('parentId') || undefined;

  try {
    const svc = new FjnPermissionService();
    const result = await svc.listRoles({ status, roleType, isSystem, parentId, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission roles');
  }
}

/** 角色详情 */
async function getRoleDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnPermissionService();
    const role = await svc.findRoleById(id);
    if (!role) return notFound('Role not found');
    return success(role);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/permission role-detail');
  }
}

/** 按 code 查角色 */
async function getRoleByCode(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return badRequest('Missing code');
  try {
    const svc = new FjnPermissionService();
    const role = await svc.findRoleByCode(code);
    if (!role) return notFound('Role not found');
    return success(role);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/permission role-by-code');
  }
}

// ============================================================
// Role POST handlers
// ============================================================

/** 创建角色 */
async function createRole(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { roleCode, roleName, description, roleType, parentId, sort, metadata } = body;
    if (!roleCode || !roleName) return badRequest('Missing required: roleCode, roleName');
    const svc = new FjnPermissionService();
    const result = await svc.createRole({
      roleCode, roleName, description, roleType, parentId, sort, metadata,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission create-role');
  }
}

/** 更新角色 */
async function updateRole(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, roleName, description, parentId, sort, metadata } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnPermissionService();
    const result = await svc.updateRole(id, {
      roleName, description, parentId, sort, metadata,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission update-role');
  }
}

/** 角色状态变更（disable / enable / deprecate） */
async function changeRoleStatus(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, targetStatus, reason } = body;
    if (!id || !targetStatus) return badRequest('Missing required: id, targetStatus');
    const svc = new FjnPermissionService();
    let result;
    if (targetStatus === 'disabled') result = await svc.disableRole(id, { reason, operatorId });
    else if (targetStatus === 'enabled') result = await svc.enableRole(id, { operatorId });
    else if (targetStatus === 'deprecated') result = await svc.deprecateRole(id, { reason, operatorId });
    else return badRequest('targetStatus must be one of: disabled, enabled, deprecated');
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission role-status');
  }
}

// ============================================================
// Permission handlers
// ============================================================

/** 列出权限 */
async function listPermissions(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const status = p.get('status') as any;
  const resource = p.get('resource') || undefined;
  const action = p.get('action') || undefined;
  const permissionType = p.get('permissionType') as any;

  try {
    const svc = new FjnPermissionService();
    const result = await svc.listPermissions({ status, resource, action, permissionType, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission permissions');
  }
}

/** 权限详情 */
async function getPermissionDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnPermissionService();
    const perm = await svc.findPermissionById(id);
    if (!perm) return notFound('Permission not found');
    return success(perm);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/permission permission-detail');
  }
}

/** 按 code 查权限 */
async function getPermissionByCode(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return badRequest('Missing code');
  try {
    const svc = new FjnPermissionService();
    const perm = await svc.findPermissionByCode(code);
    if (!perm) return notFound('Permission not found');
    return success(perm);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/permission permission-by-code');
  }
}

/** 创建权限 */
async function createPermission(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { permissionCode, permissionName, description, resource, action, permissionType, parentId, sort, metadata } = body;
    if (!permissionCode || !permissionName || !resource || !action) {
      return badRequest('Missing required: permissionCode, permissionName, resource, action');
    }
    const svc = new FjnPermissionService();
    const result = await svc.createPermission({
      permissionCode, permissionName, description, resource, action, permissionType, parentId, sort, metadata,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission create-permission');
  }
}

/** 更新权限 */
async function updatePermission(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, permissionName, description, sort, metadata } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnPermissionService();
    const result = await svc.updatePermission(id, {
      permissionName, description, sort, metadata,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission update-permission');
  }
}

/** 禁用权限 */
async function disablePermission(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnPermissionService();
    const result = await svc.disablePermission(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission disable-permission');
  }
}

// ============================================================
// Role-Permission handlers
// ============================================================

/** 角色的权限列表 */
async function listRolePermissions(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const roleId = p.get('roleId');
  if (!roleId) return badRequest('Missing roleId');
  const activeOnly = p.get('activeOnly') === 'true' ? true : p.get('activeOnly') === 'false' ? false : undefined;

  try {
    const svc = new FjnPermissionService();
    const result = await svc.listRolePermissions(roleId, { activeOnly, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission role-permissions');
  }
}

/** 给角色授权 */
async function grantRolePermission(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { roleId, permissionId, scope, scopeValue, conditions, expiresDays, grantedBy } = body;
    if (!roleId || !permissionId) return badRequest('Missing required: roleId, permissionId');
    const svc = new FjnPermissionService();
    const result = await svc.grantRolePermission(roleId, permissionId, {
      scope, scopeValue, conditions, expiresDays, grantedBy: grantedBy || operatorId, operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission grant-role-permission');
  }
}

/** 撤销角色权限 */
async function revokeRolePermission(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { roleId, permissionId } = body;
    if (!roleId || !permissionId) return badRequest('Missing required: roleId, permissionId');
    const svc = new FjnPermissionService();
    const result = await svc.revokeRolePermission(roleId, permissionId, { operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission revoke-role-permission');
  }
}

// ============================================================
// User-Role handlers
// ============================================================

/** 列出用户角色 */
async function listUserRoles(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const userId = p.get('userId') || undefined;
  const roleId = p.get('roleId') || undefined;
  const status = p.get('status') as any;

  try {
    const svc = new FjnPermissionService();
    const result = await svc.listUserRoles({ userId, roleId, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission user-roles');
  }
}

/** 用户的有效角色（聚合所有来源） */
async function getUserEffectiveRoles(req: NextRequest, ctxUserId: string, isAdmin: boolean) {
  // P1-1 IDOR 防护：非 admin 强制 ctxUserId
  const queryUserId = req.nextUrl.searchParams.get('userId');
  const userId = isAdmin ? (queryUserId || ctxUserId) : ctxUserId;
  if (!userId) return badRequest('Missing userId');
  try {
    const svc = new FjnPermissionService();
    const result = await svc.getUserEffectiveRoles(userId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission user-effective-roles');
  }
}

/** 分配角色给用户 */
async function assignUserRole(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { userId, roleId, scope, scopeValue, expiresDays, grantedBy } = body;
    if (!userId || !roleId) return badRequest('Missing required: userId, roleId');
    const svc = new FjnPermissionService();
    const result = await svc.assignUserRole(userId, roleId, {
      scope, scopeValue, expiresDays, grantedBy: grantedBy || operatorId, operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission assign-user-role');
  }
}

/** 撤销用户角色 */
async function revokeUserRole(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { userRoleId, reason } = body;
    if (!userRoleId) return badRequest('Missing required: userRoleId');
    const svc = new FjnPermissionService();
    const result = await svc.revokeUserRole(userRoleId, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission revoke-user-role');
  }
}

// ============================================================
// User-Permission handlers
// ============================================================

/** 列出用户直授权限 */
async function listUserPermissions(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const userId = p.get('userId');
  if (!userId) return badRequest('Missing userId');
  const activeOnly = p.get('activeOnly') === 'true' ? true : p.get('activeOnly') === 'false' ? false : undefined;

  try {
    const svc = new FjnPermissionService();
    const result = await svc.listUserPermissions(userId, { activeOnly, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission user-permissions');
  }
}

/** 直授用户权限 */
async function grantUserPermission(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { userId, permissionId, effect, scope, scopeValue, conditions, expiresDays, grantedBy } = body;
    if (!userId || !permissionId) return badRequest('Missing required: userId, permissionId');
    const svc = new FjnPermissionService();
    const result = await svc.grantUserPermission(userId, permissionId, {
      effect, scope, scopeValue, conditions, expiresDays, grantedBy: grantedBy || operatorId, operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission grant-user-permission');
  }
}

/** 撤销用户直授权限 */
async function revokeUserPermission(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { userPermissionId, reason } = body;
    if (!userPermissionId) return badRequest('Missing required: userPermissionId');
    const svc = new FjnPermissionService();
    const result = await svc.revokeUserPermission(userPermissionId, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission revoke-user-permission');
  }
}

// ============================================================
// Policy (ABAC) handlers
// ============================================================

/** 列出策略 */
async function listPolicies(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const status = p.get('status') as any;
  const resource = p.get('resource') || undefined;

  try {
    const svc = new FjnPermissionService();
    const result = await svc.listPolicies({ status, resource, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission policies');
  }
}

/** 创建策略 */
async function createPolicy(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { policyCode, policyName, description, effect, resource, actions, conditions, priority, validFrom, validTo, metadata } = body;
    if (!policyCode || !policyName || !effect || !resource || !actions || !conditions) {
      return badRequest('Missing required: policyCode, policyName, effect, resource, actions, conditions');
    }
    const svc = new FjnPermissionService();
    const result = await svc.createPolicy({
      policyCode, policyName, description, effect, resource, actions, conditions, priority,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validTo: validTo ? new Date(validTo) : undefined,
      metadata,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission create-policy');
  }
}

/** 更新策略 */
async function updatePolicy(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, policyName, description, conditions, priority, validFrom, validTo, metadata } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnPermissionService();
    const result = await svc.updatePolicy(id, {
      policyName, description, conditions, priority,
      validFrom: validFrom === null ? null : validFrom ? new Date(validFrom) : undefined,
      validTo: validTo === null ? null : validTo ? new Date(validTo) : undefined,
      metadata,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission update-policy');
  }
}

/** 禁用策略 */
async function disablePolicy(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnPermissionService();
    const result = await svc.disablePolicy(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission disable-policy');
  }
}

// ============================================================
// Access handlers
// ============================================================

/** 访问评估（核心：RBAC+ABAC 聚合） */
async function evaluateAccess(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { resource, action, context, ipAddress, userAgent, requestId, logAccess } = body;
    if (!resource || !action) return badRequest('Missing required: resource, action');
    const svc = new FjnPermissionService();
    const result = await svc.evaluateAccess({
      userId, resource, action, context, ipAddress, userAgent, requestId, logAccess,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission evaluate-access');
  }
}

/** 记录访问日志 */
async function logAccess(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { resource, action, decision, reason, matchedRoles, matchedPermissions, matchedPolicies, ipAddress, userAgent, requestId, latencyMs, metadata } = body;
    if (!resource || !action || !decision) return badRequest('Missing required: resource, action, decision');
    const svc = new FjnPermissionService();
    const result = await svc.logAccess({
      userId, resource, action, decision, reason, matchedRoles, matchedPermissions, matchedPolicies,
      ipAddress, userAgent, requestId, latencyMs, metadata,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission log-access');
  }
}

/** 列出访问日志 */
async function listAccessLogs(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const userId = p.get('userId') || undefined;
  const resource = p.get('resource') || undefined;
  const action = p.get('action') || undefined;
  const decision = p.get('decision') as any;
  const startTime = p.get('startTime');
  const endTime = p.get('endTime');

  try {
    const svc = new FjnPermissionService();
    const result = await svc.listAccessLogs({
      userId, resource, action, decision,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      page, pageSize,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission access-logs');
  }
}

/** RBAC+ABAC 汇总 */
async function getPermissionSummary() {
  try {
    const svc = new FjnPermissionService();
    const result = await svc.getPermissionSummary();
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/permission summary');
  }
}
