/**
 * FJN Permission Service - 核心业务服务
 *
 * 严格遵循 H015 工业级职责规范（RBAC + ABAC 混合）：
 *  - Role 域：create / update / enable / disable / deprecate / find / list
 *  - Permission 域：create / update / enable / disable / find / list
 *  - RolePermission 域：grant / revoke / list
 *  - UserRole 域：assign / revoke / expire / list / getEffectiveRoles
 *  - UserPermission 域：grant / revoke / list
 *  - Policy (ABAC) 域：create / update / enable / disable / list / evaluateAccess
 *  - AccessLog 域：logAccess / listAccessLogs
 *  - 工具：getPermissionSummary
 *
 * 状态机白名单（参考 permission-state-machine）：
 *  - Role: active | disabled | deprecated
 *  - Permission: active | disabled | deprecated
 *  - UserRole: active | revoked | expired | disabled
 *  - UserPermission: active | revoked | expired
 *  - Policy: active | disabled
 *
 * 12 个 outbox 事件常量（Role 5 + Permission 3 + 关联 3 + ABAC 1）
 *
 * 用法：
 *   const svc = new FjnPermissionService();
 *   const role = await svc.createRole({ roleCode, roleName, roleType });
 *   const decision = await svc.evaluateAccess({ userId, resource, action });
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import { FjnError } from '../errors';
import {
  ROLE_STATUS,
  PERMISSION_STATUS,
  USER_ROLE_STATUS,
  USER_PERMISSION_STATUS,
  POLICY_STATUS,
  ROLE_TYPE,
  PERMISSION_TYPE,
  SCOPE_TYPE,
  PERMISSION_EFFECT,
  POLICY_EFFECT,
  ACCESS_DECISION,
  isValidRoleStatus,
  isValidPermissionStatus,
  isValidUserRoleStatus,
  isValidUserPermissionStatus,
  isValidPolicyStatus,
  canTransitRoleStatus,
  canTransitPermissionStatus,
  canTransitUserRoleStatus,
  canTransitUserPermissionStatus,
  canTransitPolicyStatus,
  assertTransitRoleStatus,
  assertTransitPermissionStatus,
  assertTransitUserRoleStatus,
  assertTransitUserPermissionStatus,
  assertTransitPolicyStatus,
  isValidRoleCode,
  isValidPermissionCode,
  isValidPolicyCode,
  isRoleUsable,
  isPermissionUsable,
  isUserRoleActive,
  isUserPermissionActive,
  type FjnRoleStatus,
  type FjnPermissionStatus,
  type FjnUserRoleStatus,
  type FjnUserPermissionStatus,
  type FjnPolicyStatus,
  type FjnRoleType,
  type FjnPermissionType,
  type FjnScopeType,
  type FjnPermissionEffect,
  type FjnPolicyEffect,
  type FjnAccessDecision,
} from './permission-state-machine';
import {
  PERMISSION_EVENTS,
  PERMISSION_EVENT_SOURCES,
  type RoleCreatedPayload,
  type RoleUpdatedPayload,
  type RoleDisabledPayload,
  type RoleEnabledPayload,
  type RoleDeprecatedPayload,
  type PermissionCreatedPayload,
  type PermissionUpdatedPayload,
  type PermissionDisabledPayload,
  type RolePermissionGrantedPayload,
  type RolePermissionRevokedPayload,
  type UserRoleAssignedPayload,
  type AccessPolicyCreatedPayload,
  type FjnPermissionEventSource,
} from './permission-events';
import {
  FjnRoleNotFoundError,
  FjnRoleAlreadyExistsError,
  FjnRoleCodeInvalidError,
  FjnRoleNameRequiredError,
  FjnRoleStatusInvalidError,
  FjnRoleSystemProtectedError,
  FjnRoleCannotDeleteError,
  FjnRoleDisabledError,
  FjnRoleDeprecatedError,
  FjnPermissionNotFoundError,
  FjnPermissionAlreadyExistsError,
  FjnPermissionCodeInvalidError,
  FjnPermissionNameRequiredError,
  FjnPermissionStatusInvalidError,
  FjnPermissionSystemProtectedError,
  FjnPermissionDisabledError,
  FjnPermissionResourceRequiredError,
  FjnPermissionActionRequiredError,
  FjnRolePermissionAlreadyGrantedError,
  FjnRolePermissionNotGrantedError,
  FjnRolePermissionRevokedError,
  FjnRolePermissionScopeInvalidError,
  FjnRolePermissionGrantorRequiredError,
  FjnUserRoleNotFoundError,
  FjnUserRoleAlreadyAssignedError,
  FjnUserRoleRevokedError,
  FjnUserRoleDisabledError,
  FjnUserRoleGrantorRequiredError,
  FjnUserRoleScopeInvalidError,
  FjnUserRoleExpiresInvalidError,
  FjnUserPermissionNotFoundError,
  FjnUserPermissionAlreadyGrantedError,
  FjnUserPermissionRevokedError,
  FjnUserPermissionGrantorRequiredError,
  FjnUserPermissionScopeInvalidError,
  FjnUserPermissionEffectInvalidError,
  FjnPolicyNotFoundError,
  FjnPolicyAlreadyExistsError,
  FjnPolicyCodeInvalidError,
  FjnPolicyNameRequiredError,
  FjnPolicyStatusInvalidError,
  FjnPolicyConditionsInvalidError,
  FjnPolicyEffectInvalidError,
  FjnPolicyActionsRequiredError,
  FjnPolicySystemProtectedError,
  FjnPolicyValidityInvalidError,
  FjnAccessDeniedError,
  FjnEvaluationFailedError,
  FjnResourceNotSpecifiedError,
  FjnActionNotSpecifiedError,
  FjnScopeNotAllowedError,
  FjnEffectInvalidError,
} from './permission-errors';

// ============================================================
// 1. 公共常量
// ============================================================

/** 角色/权限默认有效期（天），0 表示永不过期 */
export const PERMISSION_DEFAULT_EXPIRES_DAYS = 0;

// ============================================================
// 2. 入参接口
// ============================================================

/** 入参：创建 Role */
export interface CreateRoleInput {
  roleCode: string;
  roleName: string;
  description?: string;
  roleType?: FjnRoleType;
  parentId?: string;
  sort?: number;
  metadata?: Record<string, unknown>;
  operatorId?: string;
}

/** 入参：更新 Role */
export interface UpdateRoleInput {
  roleName?: string;
  description?: string;
  parentId?: string;
  sort?: number;
  metadata?: Record<string, unknown>;
  operatorId?: string;
}

/** 入参：禁用/启用/废弃 Role */
export interface ChangeRoleStatusInput {
  reason?: string;
  operatorId?: string;
}

/** 入参：创建 Permission */
export interface CreatePermissionInput {
  permissionCode: string;
  permissionName: string;
  description?: string;
  resource: string;
  action: string;
  permissionType?: FjnPermissionType;
  parentId?: string;
  sort?: number;
  metadata?: Record<string, unknown>;
  operatorId?: string;
}

/** 入参：更新 Permission */
export interface UpdatePermissionInput {
  permissionName?: string;
  description?: string;
  sort?: number;
  metadata?: Record<string, unknown>;
  operatorId?: string;
}

/** 入参：给角色授权 */
export interface GrantRolePermissionInput {
  scope?: FjnScopeType;
  scopeValue?: string;
  conditions?: Record<string, unknown>;
  expiresDays?: number;
  grantedBy?: string;
  operatorId?: string;
}

/** 入参：撤销角色权限 */
export interface RevokeRolePermissionInput {
  operatorId?: string;
}

/** 入参：分配角色给用户 */
export interface AssignUserRoleInput {
  scope?: FjnScopeType;
  scopeValue?: string;
  expiresDays?: number;
  grantedBy?: string;
  operatorId?: string;
}

/** 入参：撤销用户角色 */
export interface RevokeUserRoleInput {
  reason?: string;
  operatorId?: string;
}

/** 入参：直授用户权限 */
export interface GrantUserPermissionInput {
  effect?: FjnPermissionEffect;
  scope?: FjnScopeType;
  scopeValue?: string;
  conditions?: Record<string, unknown>;
  expiresDays?: number;
  grantedBy?: string;
  operatorId?: string;
}

/** 入参：撤销用户直授权限 */
export interface RevokeUserPermissionInput {
  reason?: string;
  operatorId?: string;
}

/** 入参：创建 ABAC Policy */
export interface CreatePolicyInput {
  policyCode: string;
  policyName: string;
  description?: string;
  effect: FjnPolicyEffect;
  resource: string;
  actions: string[];
  conditions: Record<string, unknown>;
  priority?: number;
  validFrom?: Date;
  validTo?: Date;
  metadata?: Record<string, unknown>;
  operatorId?: string;
}

/** 入参：更新 ABAC Policy */
export interface UpdatePolicyInput {
  policyName?: string;
  description?: string;
  conditions?: Record<string, unknown>;
  priority?: number;
  validFrom?: Date | null;
  validTo?: Date | null;
  metadata?: Record<string, unknown>;
  operatorId?: string;
}

/** 入参：访问评估 */
export interface EvaluateAccessInput {
  userId: string;
  resource: string;
  action: string;
  context?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  logAccess?: boolean;
}

/** 入参：评估结果 */
export interface AccessDecisionResult {
  decision: FjnAccessDecision;
  reason: string;
  matchedRoles: string[];
  matchedPermissions: string[];
  matchedPolicies: string[];
  evaluatedAt: string;
  latencyMs: number;
}

/** 入参：列表 Role 查询 */
export interface ListRoleInput {
  status?: FjnRoleStatus;
  roleType?: FjnRoleType;
  isSystem?: boolean;
  parentId?: string;
  page?: number;
  pageSize?: number;
}

/** 入参：列表 Permission 查询 */
export interface ListPermissionInput {
  status?: FjnPermissionStatus;
  resource?: string;
  action?: string;
  permissionType?: FjnPermissionType;
  page?: number;
  pageSize?: number;
}

/** 入参：列表 UserRole 查询 */
export interface ListUserRoleInput {
  userId?: string;
  roleId?: string;
  status?: FjnUserRoleStatus;
  page?: number;
  pageSize?: number;
}

/** 入参：列表 AccessLog 查询 */
export interface ListAccessLogInput {
  userId?: string;
  resource?: string;
  action?: string;
  decision?: FjnAccessDecision;
  startTime?: Date;
  endTime?: Date;
  page?: number;
  pageSize?: number;
}

// ============================================================
// 3. Permission Service 主体
// ============================================================

/**
 * FJN Permission Service 主类
 *
 * 公开方法约 25 个，按业务域分组：
 *  - Role 域（6）：createRole / findRoleById / findRoleByCode / listRoles / updateRole / disableRole / enableRole / deprecateRole
 *  - Permission 域（6）：createPermission / findPermissionById / findPermissionByCode / listPermissions / updatePermission / disablePermission
 *  - RolePermission 域（3）：grantRolePermission / revokeRolePermission / listRolePermissions
 *  - UserRole 域（4）：assignUserRole / revokeUserRole / listUserRoles / getUserEffectiveRoles
 *  - UserPermission 域（3）：grantUserPermission / revokeUserPermission / listUserPermissions
 *  - Policy (ABAC) 域（5）：createPolicy / updatePolicy / disablePolicy / listPolicies / evaluateAccess
 *  - AccessLog 域（2）：logAccess / listAccessLogs
 *  - 工具（1）：getPermissionSummary
 */
export class FjnPermissionService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnPermissionService' });
  }

  // ============================================================
  // 4.1 Role 域
  // ============================================================

  /** 创建 Role */
  async createRole(input: CreateRoleInput): Promise<Record<string, unknown>> {
    if (!input.roleCode || !isValidRoleCode(input.roleCode)) {
      throw new FjnRoleCodeInvalidError({ value: input.roleCode });
    }
    if (!input.roleName) {
      throw new FjnRoleNameRequiredError({});
    }
    const roleType = input.roleType ?? ROLE_TYPE.OPERATOR;
    if (!(Object.values(ROLE_TYPE) as string[]).includes(roleType)) {
      throw new FjnRoleStatusInvalidError({ roleType });
    }

    return this.withTransaction(async (tx) => {
      const existing = await tx.fjnRole.findUnique({
        where: { roleCode: input.roleCode },
      });
      if (existing) {
        throw new FjnRoleAlreadyExistsError({ roleCode: input.roleCode });
      }
      if (input.parentId) {
        const parent = await tx.fjnRole.findUnique({ where: { id: input.parentId } });
        if (!parent) {
          throw new FjnRoleNotFoundError({ parentId: input.parentId });
        }
      }

      const role = await tx.fjnRole.create({
        data: {
          roleCode: input.roleCode,
          roleName: input.roleName,
          description: input.description ?? null,
          roleType,
          status: ROLE_STATUS.ACTIVE,
          isSystem: false,
          parentId: input.parentId ?? null,
          sort: input.sort ?? 0,
          metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });

      const payload: RoleCreatedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId
          ? PERMISSION_EVENT_SOURCES.ADMIN
          : PERMISSION_EVENT_SOURCES.SYSTEM,
        role_id: role.id,
        role_code: role.roleCode,
        role_name: role.roleName,
        role_type: role.roleType as FjnRoleType,
        is_system: role.isSystem,
        parent_id: role.parentId ?? undefined,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, PERMISSION_EVENTS.ROLE_CREATED, payload);
      return this.formatRole(role);
    });
  }

  /** 按 ID 查询 Role */
  async findRoleById(id: string): Promise<Record<string, unknown> | null> {
    const role = await this.prisma.fjnRole.findUnique({ where: { id } });
    return role ? this.formatRole(role) : null;
  }

  /** 按 code 查询 Role */
  async findRoleByCode(roleCode: string): Promise<Record<string, unknown> | null> {
    const role = await this.prisma.fjnRole.findUnique({ where: { roleCode } });
    return role ? this.formatRole(role) : null;
  }

  /** 列出 Role */
  async listRoles(
    params: ListRoleInput,
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnRoleWhereInput = { deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.roleType) where.roleType = params.roleType;
    if (params.isSystem !== undefined) where.isSystem = params.isSystem;
    if (params.parentId) where.parentId = params.parentId;

    const [items, total] = await Promise.all([
      this.prisma.fjnRole.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnRole.count({ where }),
    ]);
    return {
      items: items.map((r) => this.formatRole(r)),
      total,
      page,
      pageSize,
    };
  }

  /** 更新 Role */
  async updateRole(
    id: string,
    input: UpdateRoleInput,
  ): Promise<Record<string, unknown>> {
    if (!input.roleName) {
      throw new FjnRoleNameRequiredError({ context: 'update' });
    }
    return this.withTransaction(async (tx) => {
      const role = await tx.fjnRole.findUnique({ where: { id } });
      if (!role) throw new FjnRoleNotFoundError({ id });
      if (role.isSystem) {
        throw new FjnRoleSystemProtectedError({ id, roleCode: role.roleCode });
      }

      const changedFields: string[] = [];
      const data: Prisma.FjnRoleUpdateInput = {};
      if (input.roleName !== undefined && input.roleName !== role.roleName) {
        data.roleName = input.roleName;
        changedFields.push('roleName');
      }
      if (input.description !== undefined && input.description !== role.description) {
        data.description = input.description;
        changedFields.push('description');
      }
      if (input.parentId !== undefined && input.parentId !== role.parentId) {
        data.parentId = input.parentId;
        changedFields.push('parentId');
      }
      if (input.sort !== undefined && input.sort !== role.sort) {
        data.sort = input.sort;
        changedFields.push('sort');
      }
      if (input.metadata !== undefined) {
        data.metadata = input.metadata as Prisma.InputJsonValue;
        changedFields.push('metadata');
      }
      if (changedFields.length === 0) {
        return this.formatRole(role);
      }

      const updated = await tx.fjnRole.update({ where: { id }, data });

      const payload: RoleUpdatedPayload = {
        occurred_at: new Date().toISOString(),
        source: PERMISSION_EVENT_SOURCES.ADMIN,
        role_id: updated.id,
        role_code: updated.roleCode,
        changed_fields: changedFields,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, PERMISSION_EVENTS.ROLE_UPDATED, payload);
      return this.formatRole(updated);
    });
  }

  /** 禁用 Role */
  async disableRole(
    id: string,
    input: ChangeRoleStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const role = await tx.fjnRole.findUnique({ where: { id } });
      if (!role) throw new FjnRoleNotFoundError({ id });
      if (role.isSystem) {
        throw new FjnRoleSystemProtectedError({ id, roleCode: role.roleCode });
      }
      if (!isValidRoleStatus(role.status)) {
        throw new FjnRoleStatusInvalidError({ id, status: role.status });
      }
      if (!canTransitRoleStatus(role.status as FjnRoleStatus, ROLE_STATUS.DISABLED)) {
        throw new FjnRoleStatusInvalidError({
          id,
          from: role.status,
          to: ROLE_STATUS.DISABLED,
        });
      }
      assertTransitRoleStatus(role.status as FjnRoleStatus, ROLE_STATUS.DISABLED);

      const updated = await tx.fjnRole.update({
        where: { id },
        data: { status: ROLE_STATUS.DISABLED },
      });

      const payload: RoleDisabledPayload = {
        occurred_at: new Date().toISOString(),
        source: PERMISSION_EVENT_SOURCES.ADMIN,
        role_id: updated.id,
        role_code: updated.roleCode,
        reason: input.reason,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, PERMISSION_EVENTS.ROLE_DISABLED, payload);
      return this.formatRole(updated);
    });
  }

  /** 启用 Role */
  async enableRole(
    id: string,
    input: ChangeRoleStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const role = await tx.fjnRole.findUnique({ where: { id } });
      if (!role) throw new FjnRoleNotFoundError({ id });
      if (!isValidRoleStatus(role.status)) {
        throw new FjnRoleStatusInvalidError({ id, status: role.status });
      }
      if (!canTransitRoleStatus(role.status as FjnRoleStatus, ROLE_STATUS.ACTIVE)) {
        throw new FjnRoleStatusInvalidError({
          id,
          from: role.status,
          to: ROLE_STATUS.ACTIVE,
        });
      }
      assertTransitRoleStatus(role.status as FjnRoleStatus, ROLE_STATUS.ACTIVE);

      const updated = await tx.fjnRole.update({
        where: { id },
        data: { status: ROLE_STATUS.ACTIVE },
      });

      const payload: RoleEnabledPayload = {
        occurred_at: new Date().toISOString(),
        source: PERMISSION_EVENT_SOURCES.ADMIN,
        role_id: updated.id,
        role_code: updated.roleCode,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, PERMISSION_EVENTS.ROLE_ENABLED, payload);
      return this.formatRole(updated);
    });
  }

  /** 废弃 Role（终态） */
  async deprecateRole(
    id: string,
    input: ChangeRoleStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const role = await tx.fjnRole.findUnique({ where: { id } });
      if (!role) throw new FjnRoleNotFoundError({ id });
      if (role.isSystem) {
        throw new FjnRoleSystemProtectedError({ id, roleCode: role.roleCode });
      }
      if (!canTransitRoleStatus(role.status as FjnRoleStatus, ROLE_STATUS.DEPRECATED)) {
        throw new FjnRoleStatusInvalidError({
          id,
          from: role.status,
          to: ROLE_STATUS.DEPRECATED,
        });
      }
      assertTransitRoleStatus(role.status as FjnRoleStatus, ROLE_STATUS.DEPRECATED);

      const updated = await tx.fjnRole.update({
        where: { id },
        data: { status: ROLE_STATUS.DEPRECATED },
      });

      const payload: RoleDeprecatedPayload = {
        occurred_at: new Date().toISOString(),
        source: PERMISSION_EVENT_SOURCES.ADMIN,
        role_id: updated.id,
        role_code: updated.roleCode,
        reason: input.reason,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, PERMISSION_EVENTS.ROLE_DEPRECATED, payload);
      return this.formatRole(updated);
    });
  }

  // ============================================================
  // 4.2 Permission 域
  // ============================================================

  /** 创建 Permission */
  async createPermission(
    input: CreatePermissionInput,
  ): Promise<Record<string, unknown>> {
    if (!input.permissionCode || !isValidPermissionCode(input.permissionCode)) {
      throw new FjnPermissionCodeInvalidError({ value: input.permissionCode });
    }
    if (!input.permissionName) {
      throw new FjnPermissionNameRequiredError({});
    }
    if (!input.resource) {
      throw new FjnPermissionResourceRequiredError({});
    }
    if (!input.action) {
      throw new FjnPermissionActionRequiredError({});
    }
    const permissionType = input.permissionType ?? PERMISSION_TYPE.API;
    if (!(Object.values(PERMISSION_TYPE) as string[]).includes(permissionType)) {
      throw new FjnPermissionStatusInvalidError({ permissionType });
    }

    return this.withTransaction(async (tx) => {
      const existing = await tx.fjnPermission.findUnique({
        where: { permissionCode: input.permissionCode },
      });
      if (existing) {
        throw new FjnPermissionAlreadyExistsError({
          permissionCode: input.permissionCode,
        });
      }
      if (input.parentId) {
        const parent = await tx.fjnPermission.findUnique({
          where: { id: input.parentId },
        });
        if (!parent) {
          throw new FjnPermissionNotFoundError({ parentId: input.parentId });
        }
      }

      const permission = await tx.fjnPermission.create({
        data: {
          permissionCode: input.permissionCode,
          permissionName: input.permissionName,
          description: input.description ?? null,
          resource: input.resource,
          action: input.action,
          permissionType,
          status: PERMISSION_STATUS.ACTIVE,
          isSystem: false,
          parentId: input.parentId ?? null,
          sort: input.sort ?? 0,
          metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });

      const payload: PermissionCreatedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId
          ? PERMISSION_EVENT_SOURCES.ADMIN
          : PERMISSION_EVENT_SOURCES.SYSTEM,
        permission_id: permission.id,
        permission_code: permission.permissionCode,
        permission_name: permission.permissionName,
        resource: permission.resource,
        action: permission.action,
        permission_type: permission.permissionType as FjnPermissionType,
        is_system: permission.isSystem,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, PERMISSION_EVENTS.PERMISSION_CREATED, payload);
      return this.formatPermission(permission);
    });
  }

  /** 按 ID 查询 Permission */
  async findPermissionById(
    id: string,
  ): Promise<Record<string, unknown> | null> {
    const p = await this.prisma.fjnPermission.findUnique({ where: { id } });
    return p ? this.formatPermission(p) : null;
  }

  /** 按 code 查询 Permission */
  async findPermissionByCode(
    permissionCode: string,
  ): Promise<Record<string, unknown> | null> {
    const p = await this.prisma.fjnPermission.findUnique({
      where: { permissionCode },
    });
    return p ? this.formatPermission(p) : null;
  }

  /** 列出 Permission */
  async listPermissions(
    params: ListPermissionInput,
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnPermissionWhereInput = { deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.resource) where.resource = params.resource;
    if (params.action) where.action = params.action;
    if (params.permissionType) where.permissionType = params.permissionType;

    const [items, total] = await Promise.all([
      this.prisma.fjnPermission.findMany({
        where,
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnPermission.count({ where }),
    ]);
    return {
      items: items.map((p) => this.formatPermission(p)),
      total,
      page,
      pageSize,
    };
  }

  /** 更新 Permission */
  async updatePermission(
    id: string,
    input: UpdatePermissionInput,
  ): Promise<Record<string, unknown>> {
    if (!input.permissionName) {
      throw new FjnPermissionNameRequiredError({ context: 'update' });
    }
    return this.withTransaction(async (tx) => {
      const p = await tx.fjnPermission.findUnique({ where: { id } });
      if (!p) throw new FjnPermissionNotFoundError({ id });
      if (p.isSystem) {
        throw new FjnPermissionSystemProtectedError({
          id,
          permissionCode: p.permissionCode,
        });
      }

      const changedFields: string[] = [];
      const data: Prisma.FjnPermissionUpdateInput = {};
      if (input.permissionName !== undefined && input.permissionName !== p.permissionName) {
        data.permissionName = input.permissionName;
        changedFields.push('permissionName');
      }
      if (input.description !== undefined && input.description !== p.description) {
        data.description = input.description;
        changedFields.push('description');
      }
      if (input.sort !== undefined && input.sort !== p.sort) {
        data.sort = input.sort;
        changedFields.push('sort');
      }
      if (input.metadata !== undefined) {
        data.metadata = input.metadata as Prisma.InputJsonValue;
        changedFields.push('metadata');
      }
      if (changedFields.length === 0) {
        return this.formatPermission(p);
      }

      const updated = await tx.fjnPermission.update({ where: { id }, data });

      const payload: PermissionUpdatedPayload = {
        occurred_at: new Date().toISOString(),
        source: PERMISSION_EVENT_SOURCES.ADMIN,
        permission_id: updated.id,
        permission_code: updated.permissionCode,
        changed_fields: changedFields,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, PERMISSION_EVENTS.PERMISSION_UPDATED, payload);
      return this.formatPermission(updated);
    });
  }

  /** 禁用 Permission */
  async disablePermission(
    id: string,
    input: { reason?: string; operatorId?: string } = {},
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const p = await tx.fjnPermission.findUnique({ where: { id } });
      if (!p) throw new FjnPermissionNotFoundError({ id });
      if (p.isSystem) {
        throw new FjnPermissionSystemProtectedError({
          id,
          permissionCode: p.permissionCode,
        });
      }
      if (!canTransitPermissionStatus(
        p.status as FjnPermissionStatus,
        PERMISSION_STATUS.DISABLED,
      )) {
        throw new FjnPermissionStatusInvalidError({
          id,
          from: p.status,
          to: PERMISSION_STATUS.DISABLED,
        });
      }
      assertTransitPermissionStatus(
        p.status as FjnPermissionStatus,
        PERMISSION_STATUS.DISABLED,
      );

      const updated = await tx.fjnPermission.update({
        where: { id },
        data: { status: PERMISSION_STATUS.DISABLED },
      });

      const payload: PermissionDisabledPayload = {
        occurred_at: new Date().toISOString(),
        source: PERMISSION_EVENT_SOURCES.ADMIN,
        permission_id: updated.id,
        permission_code: updated.permissionCode,
        reason: input.reason,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, PERMISSION_EVENTS.PERMISSION_DISABLED, payload);
      return this.formatPermission(updated);
    });
  }

  // ============================================================
  // 4.3 RolePermission 域
  // ============================================================

  /** 给角色授权 */
  async grantRolePermission(
    roleId: string,
    permissionId: string,
    input: GrantRolePermissionInput = {},
  ): Promise<Record<string, unknown>> {
    if (!input.grantedBy) {
      throw new FjnRolePermissionGrantorRequiredError({});
    }
    const scope = input.scope ?? SCOPE_TYPE.ALL;
    if (!(Object.values(SCOPE_TYPE) as string[]).includes(scope)) {
      throw new FjnRolePermissionScopeInvalidError({ scope });
    }
    if (
      (scope === SCOPE_TYPE.REGION || scope === SCOPE_TYPE.CUSTOM) &&
      !input.scopeValue
    ) {
      throw new FjnRolePermissionScopeInvalidError({
        scope,
        reason: 'region/custom 作用域必须提供 scopeValue',
      });
    }
    const expiresDays = input.expiresDays ?? PERMISSION_DEFAULT_EXPIRES_DAYS;
    const expiresAt =
      expiresDays > 0
        ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000)
        : null;

    return this.withTransaction(async (tx) => {
      const role = await tx.fjnRole.findUnique({ where: { id: roleId } });
      if (!role) throw new FjnRoleNotFoundError({ roleId });
      if (!isRoleUsable(role.status as FjnRoleStatus)) {
        throw new FjnRoleDisabledError({ roleId, status: role.status });
      }
      const permission = await tx.fjnPermission.findUnique({
        where: { id: permissionId },
      });
      if (!permission) throw new FjnPermissionNotFoundError({ permissionId });
      if (!isPermissionUsable(permission.status as FjnPermissionStatus)) {
        throw new FjnPermissionDisabledError({
          permissionId,
          status: permission.status,
        });
      }

      const existing = await tx.fjnRolePermission.findUnique({
        where: {
          roleId_permissionId_scope_scopeValue: {
            roleId,
            permissionId,
            scope,
            scopeValue: input.scopeValue ?? null,
          } as any,
        },
      });
      if (existing && existing.status === 'active') {
        throw new FjnRolePermissionAlreadyGrantedError({
          roleId,
          permissionId,
          scope,
          scopeValue: input.scopeValue,
        });
      }
      let rp;
      if (existing) {
        rp = await tx.fjnRolePermission.update({
          where: { id: existing.id },
          data: {
            status: 'active',
            conditions: (input.conditions as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            grantedBy: input.grantedBy ?? null,
            grantedAt: new Date(),
            expiresAt,
          },
        });
      } else {
        rp = await tx.fjnRolePermission.create({
          data: {
            roleId,
            permissionId,
            scope,
            scopeValue: input.scopeValue ?? null,
            conditions: (input.conditions as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            grantedBy: input.grantedBy ?? null,
            grantedAt: new Date(),
            expiresAt,
            status: 'active',
          },
        });
      }

      const payload: RolePermissionGrantedPayload = {
        occurred_at: new Date().toISOString(),
        source: PERMISSION_EVENT_SOURCES.ADMIN,
        role_id: roleId,
        role_code: role.roleCode,
        permission_id: permissionId,
        permission_code: permission.permissionCode,
        scope,
        scope_value: input.scopeValue,
        expires_at: expiresAt?.toISOString(),
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, PERMISSION_EVENTS.ROLE_PERMISSION_GRANTED, payload);
      return this.formatRolePermission(rp);
    });
  }

  /** 撤销角色权限 */
  async revokeRolePermission(
    roleId: string,
    permissionId: string,
    input: RevokeRolePermissionInput = {},
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const role = await tx.fjnRole.findUnique({ where: { id: roleId } });
      if (!role) throw new FjnRoleNotFoundError({ roleId });
      const permission = await tx.fjnPermission.findUnique({
        where: { id: permissionId },
      });
      if (!permission) throw new FjnPermissionNotFoundError({ permissionId });

      const rp = await tx.fjnRolePermission.findFirst({
        where: { roleId, permissionId, status: 'active' },
      });
      if (!rp) {
        throw new FjnRolePermissionNotGrantedError({ roleId, permissionId });
      }

      const updated = await tx.fjnRolePermission.update({
        where: { id: rp.id },
        data: { status: 'revoked' },
      });

      const payload: RolePermissionRevokedPayload = {
        occurred_at: new Date().toISOString(),
        source: PERMISSION_EVENT_SOURCES.ADMIN,
        role_id: roleId,
        role_code: role.roleCode,
        permission_id: permissionId,
        permission_code: permission.permissionCode,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, PERMISSION_EVENTS.ROLE_PERMISSION_REVOKED, payload);
      return this.formatRolePermission(updated);
    });
  }

  /** 列出角色已授权的权限 */
  async listRolePermissions(
    roleId: string,
    params: { activeOnly?: boolean; page?: number; pageSize?: number } = {},
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnRolePermissionWhereInput = { roleId };
    if (params.activeOnly) where.status = 'active';

    const [items, total] = await Promise.all([
      this.prisma.fjnRolePermission.findMany({
        where,
        orderBy: { grantedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnRolePermission.count({ where }),
    ]);
    return {
      items: items.map((rp) => this.formatRolePermission(rp)),
      total,
      page,
      pageSize,
    };
  }

  // ============================================================
  // 4.4 UserRole 域
  // ============================================================

  /** 分配角色给用户 */
  async assignUserRole(
    userId: string,
    roleId: string,
    input: AssignUserRoleInput = {},
  ): Promise<Record<string, unknown>> {
    if (!input.grantedBy) {
      throw new FjnUserRoleGrantorRequiredError({});
    }
    const scope = input.scope ?? SCOPE_TYPE.ALL;
    if (!(Object.values(SCOPE_TYPE) as string[]).includes(scope)) {
      throw new FjnUserRoleScopeInvalidError({ scope });
    }
    if (
      (scope === SCOPE_TYPE.REGION || scope === SCOPE_TYPE.CUSTOM) &&
      !input.scopeValue
    ) {
      throw new FjnUserRoleScopeInvalidError({
        scope,
        reason: 'region/custom 作用域必须提供 scopeValue',
      });
    }
    const expiresDays = input.expiresDays ?? PERMISSION_DEFAULT_EXPIRES_DAYS;
    const expiresAt =
      expiresDays > 0
        ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000)
        : null;
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      throw new FjnUserRoleExpiresInvalidError({ expiresAt });
    }

    return this.withTransaction(async (tx) => {
      const role = await tx.fjnRole.findUnique({ where: { id: roleId } });
      if (!role) throw new FjnRoleNotFoundError({ roleId });
      if (role.status === ROLE_STATUS.DEPRECATED) {
        throw new FjnRoleDeprecatedError({ roleId, roleCode: role.roleCode });
      }
      if (role.status === ROLE_STATUS.DISABLED) {
        throw new FjnRoleDisabledError({ roleId, roleCode: role.roleCode });
      }

      const existing = await tx.fjnUserRole.findFirst({
        where: {
          userId,
          roleId,
          scope,
          scopeValue: input.scopeValue ?? null,
        },
      });
      if (existing && existing.status === USER_ROLE_STATUS.ACTIVE) {
        throw new FjnUserRoleAlreadyAssignedError({
          userId,
          roleId,
          scope,
        });
      }
      let ur;
      if (existing) {
        ur = await tx.fjnUserRole.update({
          where: { id: existing.id },
          data: {
            status: USER_ROLE_STATUS.ACTIVE,
            grantedBy: input.grantedBy ?? null,
            grantedAt: new Date(),
            expiresAt,
            revokedAt: null,
            revokedBy: null,
            revokeReason: null,
          },
        });
      } else {
        ur = await tx.fjnUserRole.create({
          data: {
            userId,
            roleId,
            scope,
            scopeValue: input.scopeValue ?? null,
            grantedBy: input.grantedBy ?? null,
            grantedAt: new Date(),
            expiresAt,
            status: USER_ROLE_STATUS.ACTIVE,
          },
        });
      }

      const payload: UserRoleAssignedPayload = {
        occurred_at: new Date().toISOString(),
        source: PERMISSION_EVENT_SOURCES.ADMIN,
        user_id: userId,
        role_id: roleId,
        role_code: role.roleCode,
        scope,
        scope_value: input.scopeValue,
        expires_at: expiresAt?.toISOString(),
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, PERMISSION_EVENTS.USER_ROLE_ASSIGNED, payload);
      return this.formatUserRole(ur);
    });
  }

  /** 撤销用户角色 */
  async revokeUserRole(
    userRoleId: string,
    input: RevokeUserRoleInput = {},
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const ur = await tx.fjnUserRole.findUnique({ where: { id: userRoleId } });
      if (!ur) throw new FjnUserRoleNotFoundError({ userRoleId });
      if (ur.status === USER_ROLE_STATUS.REVOKED) {
        throw new FjnUserRoleRevokedError({ userRoleId });
      }

      const updated = await tx.fjnUserRole.update({
        where: { id: userRoleId },
        data: {
          status: USER_ROLE_STATUS.REVOKED,
          revokedAt: new Date(),
          revokedBy: input.operatorId ?? null,
          revokeReason: input.reason ?? null,
        },
      });
      return this.formatUserRole(updated);
    });
  }

  /** 列出用户的角色 */
  async listUserRoles(
    params: ListUserRoleInput,
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnUserRoleWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.roleId) where.roleId = params.roleId;
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.fjnUserRole.findMany({
        where,
        orderBy: { grantedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnUserRole.count({ where }),
    ]);
    return {
      items: items.map((ur) => this.formatUserRole(ur)),
      total,
      page,
      pageSize,
    };
  }

  /** 获取用户生效角色（active + 未过期） */
  async getUserEffectiveRoles(userId: string): Promise<{
    userId: string;
    roleCodes: string[];
    roleIds: string[];
    items: Record<string, unknown>[];
  }> {
    const userRoles = await this.prisma.fjnUserRole.findMany({
      where: {
        userId,
        status: USER_ROLE_STATUS.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    // 检查 role 状态
    const roleIds = userRoles.map((ur) => ur.roleId);
    const roles = roleIds.length
      ? await this.prisma.fjnRole.findMany({
          where: { id: { in: roleIds }, status: ROLE_STATUS.ACTIVE, deletedAt: null },
        })
      : [];
    const activeRoleIds = new Set(roles.map((r) => r.id));
    const items = userRoles
      .filter((ur) => activeRoleIds.has(ur.roleId))
      .map((ur) => this.formatUserRole(ur));

    return {
      userId,
      roleCodes: roles.map((r) => r.roleCode),
      roleIds: roles.map((r) => r.id),
      items,
    };
  }

  // ============================================================
  // 4.5 UserPermission 域
  // ============================================================

  /** 直授用户权限 */
  async grantUserPermission(
    userId: string,
    permissionId: string,
    input: GrantUserPermissionInput = {},
  ): Promise<Record<string, unknown>> {
    if (!input.grantedBy) {
      throw new FjnUserPermissionGrantorRequiredError({});
    }
    const effect = input.effect ?? PERMISSION_EFFECT.GRANT;
    if (!(Object.values(PERMISSION_EFFECT) as string[]).includes(effect)) {
      throw new FjnUserPermissionEffectInvalidError({ effect });
    }
    const scope = input.scope ?? SCOPE_TYPE.ALL;
    if (!(Object.values(SCOPE_TYPE) as string[]).includes(scope)) {
      throw new FjnUserPermissionScopeInvalidError({ scope });
    }
    if (
      (scope === SCOPE_TYPE.REGION || scope === SCOPE_TYPE.CUSTOM) &&
      !input.scopeValue
    ) {
      throw new FjnUserPermissionScopeInvalidError({
        scope,
        reason: 'region/custom 作用域必须提供 scopeValue',
      });
    }
    const expiresDays = input.expiresDays ?? PERMISSION_DEFAULT_EXPIRES_DAYS;
    const expiresAt =
      expiresDays > 0
        ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000)
        : null;

    return this.withTransaction(async (tx) => {
      const permission = await tx.fjnPermission.findUnique({
        where: { id: permissionId },
      });
      if (!permission) throw new FjnPermissionNotFoundError({ permissionId });
      if (!isPermissionUsable(permission.status as FjnPermissionStatus)) {
        throw new FjnPermissionDisabledError({
          permissionId,
          status: permission.status,
        });
      }

      const existing = await tx.fjnUserPermission.findFirst({
        where: {
          userId,
          permissionId,
          effect,
          scope,
          scopeValue: input.scopeValue ?? null,
        },
      });
      if (existing && existing.status === USER_PERMISSION_STATUS.ACTIVE) {
        throw new FjnUserPermissionAlreadyGrantedError({
          userId,
          permissionId,
          effect,
          scope,
        });
      }
      let up;
      if (existing) {
        up = await tx.fjnUserPermission.update({
          where: { id: existing.id },
          data: {
            status: USER_PERMISSION_STATUS.ACTIVE,
            conditions: (input.conditions as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            grantedBy: input.grantedBy ?? null,
            grantedAt: new Date(),
            expiresAt,
            revokedAt: null,
            revokedBy: null,
            revokeReason: null,
          },
        });
      } else {
        up = await tx.fjnUserPermission.create({
          data: {
            userId,
            permissionId,
            effect,
            scope,
            scopeValue: input.scopeValue ?? null,
            conditions: (input.conditions as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            grantedBy: input.grantedBy ?? null,
            grantedAt: new Date(),
            expiresAt,
            status: USER_PERMISSION_STATUS.ACTIVE,
          },
        });
      }
      return this.formatUserPermission(up);
    });
  }

  /** 撤销用户直授权限 */
  async revokeUserPermission(
    userPermissionId: string,
    input: RevokeUserPermissionInput = {},
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const up = await tx.fjnUserPermission.findUnique({
        where: { id: userPermissionId },
      });
      if (!up) throw new FjnUserPermissionNotFoundError({ userPermissionId });
      if (up.status === USER_PERMISSION_STATUS.REVOKED) {
        throw new FjnUserPermissionRevokedError({ userPermissionId });
      }

      const updated = await tx.fjnUserPermission.update({
        where: { id: userPermissionId },
        data: {
          status: USER_PERMISSION_STATUS.REVOKED,
          revokedAt: new Date(),
          revokedBy: input.operatorId ?? null,
          revokeReason: input.reason ?? null,
        },
      });
      return this.formatUserPermission(updated);
    });
  }

  /** 列出用户直授权限 */
  async listUserPermissions(
    userId: string,
    params: { activeOnly?: boolean; page?: number; pageSize?: number } = {},
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnUserPermissionWhereInput = { userId };
    if (params.activeOnly) where.status = USER_PERMISSION_STATUS.ACTIVE;

    const [items, total] = await Promise.all([
      this.prisma.fjnUserPermission.findMany({
        where,
        orderBy: { grantedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnUserPermission.count({ where }),
    ]);
    return {
      items: items.map((up) => this.formatUserPermission(up)),
      total,
      page,
      pageSize,
    };
  }

  // ============================================================
  // 4.6 Policy (ABAC) 域
  // ============================================================

  /** 创建 ABAC Policy */
  async createPolicy(input: CreatePolicyInput): Promise<Record<string, unknown>> {
    if (!input.policyCode || !isValidPolicyCode(input.policyCode)) {
      throw new FjnPolicyCodeInvalidError({ value: input.policyCode });
    }
    if (!input.policyName) {
      throw new FjnPolicyNameRequiredError({});
    }
    if (!(Object.values(POLICY_EFFECT) as string[]).includes(input.effect)) {
      throw new FjnPolicyEffectInvalidError({ effect: input.effect });
    }
    if (!input.resource) {
      throw new FjnResourceNotSpecifiedError({ context: 'policy resource' });
    }
    if (!input.actions || input.actions.length === 0) {
      throw new FjnPolicyActionsRequiredError({});
    }
    if (!input.conditions || typeof input.conditions !== 'object') {
      throw new FjnPolicyConditionsInvalidError({});
    }
    if (input.validFrom && input.validTo && input.validFrom >= input.validTo) {
      throw new FjnPolicyValidityInvalidError({
        validFrom: input.validFrom,
        validTo: input.validTo,
      });
    }

    return this.withTransaction(async (tx) => {
      const existing = await tx.fjnAccessPolicy.findUnique({
        where: { policyCode: input.policyCode },
      });
      if (existing) {
        throw new FjnPolicyAlreadyExistsError({ policyCode: input.policyCode });
      }

      const policy = await tx.fjnAccessPolicy.create({
        data: {
          policyCode: input.policyCode,
          policyName: input.policyName,
          description: input.description ?? null,
          effect: input.effect,
          resource: input.resource,
          actions: input.actions as any,
          conditions: input.conditions as Prisma.InputJsonValue,
          priority: input.priority ?? 100,
          status: POLICY_STATUS.ACTIVE,
          isSystem: false,
          validFrom: input.validFrom ?? null,
          validTo: input.validTo ?? null,
          metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          createdBy: input.operatorId ?? null,
        },
      });

      const payload: AccessPolicyCreatedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId
          ? PERMISSION_EVENT_SOURCES.ADMIN
          : PERMISSION_EVENT_SOURCES.SYSTEM,
        policy_id: policy.id,
        policy_code: policy.policyCode,
        policy_name: policy.policyName,
        effect: policy.effect as FjnPolicyEffect,
        resource: policy.resource,
        actions: policy.actions as string[],
        priority: policy.priority,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, PERMISSION_EVENTS.ACCESS_POLICY_CREATED, payload);
      return this.formatPolicy(policy);
    });
  }

  /** 更新 Policy */
  async updatePolicy(
    id: string,
    input: UpdatePolicyInput,
  ): Promise<Record<string, unknown>> {
    if (!input.policyName) {
      throw new FjnPolicyNameRequiredError({ context: 'update' });
    }
    if (input.validFrom && input.validTo && input.validFrom >= input.validTo) {
      throw new FjnPolicyValidityInvalidError({
        validFrom: input.validFrom,
        validTo: input.validTo,
      });
    }
    return this.withTransaction(async (tx) => {
      const p = await tx.fjnAccessPolicy.findUnique({ where: { id } });
      if (!p) throw new FjnPolicyNotFoundError({ id });
      if (p.isSystem) {
        throw new FjnPolicySystemProtectedError({ id, policyCode: p.policyCode });
      }

      const data: Prisma.FjnAccessPolicyUpdateInput = {};
      if (input.policyName !== undefined) data.policyName = input.policyName;
      if (input.description !== undefined) data.description = input.description;
      if (input.conditions !== undefined) {
        data.conditions = input.conditions as Prisma.InputJsonValue;
      }
      if (input.priority !== undefined) data.priority = input.priority;
      if (input.validFrom !== undefined) {
        data.validFrom = input.validFrom;
      }
      if (input.validTo !== undefined) {
        data.validTo = input.validTo;
      }
      if (input.metadata !== undefined) {
        data.metadata = input.metadata as Prisma.InputJsonValue;
      }
      const updated = await tx.fjnAccessPolicy.update({ where: { id }, data });
      return this.formatPolicy(updated);
    });
  }

  /** 禁用 Policy */
  async disablePolicy(
    id: string,
    input: { reason?: string; operatorId?: string } = {},
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const p = await tx.fjnAccessPolicy.findUnique({ where: { id } });
      if (!p) throw new FjnPolicyNotFoundError({ id });
      if (p.isSystem) {
        throw new FjnPolicySystemProtectedError({ id, policyCode: p.policyCode });
      }
      if (!canTransitPolicyStatus(p.status as FjnPolicyStatus, POLICY_STATUS.DISABLED)) {
        throw new FjnPolicyStatusInvalidError({
          id,
          from: p.status,
          to: POLICY_STATUS.DISABLED,
        });
      }
      assertTransitPolicyStatus(p.status as FjnPolicyStatus, POLICY_STATUS.DISABLED);

      const updated = await tx.fjnAccessPolicy.update({
        where: { id },
        data: { status: POLICY_STATUS.DISABLED },
      });
      return this.formatPolicy(updated);
    });
  }

  /** 列出 Policy */
  async listPolicies(
    params: { status?: FjnPolicyStatus; resource?: string; page?: number; pageSize?: number } = {},
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnAccessPolicyWhereInput = { deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.resource) where.resource = params.resource;

    const [items, total] = await Promise.all([
      this.prisma.fjnAccessPolicy.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnAccessPolicy.count({ where }),
    ]);
    return {
      items: items.map((p) => this.formatPolicy(p)),
      total,
      page,
      pageSize,
    };
  }

  // ============================================================
  // 4.7 访问评估（ABAC 引擎）
  // ============================================================

  /**
   * 评估用户是否有权限访问资源
   * 流程：
   *  1. 获取用户生效角色（active + 未过期）
   *  2. 收集角色关联权限（active + 未过期）
   *  3. 检查用户直授权限（deny 优先于 grant）
   *  4. ABAC Policy 评估（按 priority 升序）
   *  5. 决定 allow / deny，写入 AccessLog
   */
  async evaluateAccess(input: EvaluateAccessInput): Promise<AccessDecisionResult> {
    const startTime = Date.now();
    if (!input.userId) {
      throw new FjnResourceNotSpecifiedError({ context: 'userId required' });
    }
    if (!input.resource) {
      throw new FjnResourceNotSpecifiedError({});
    }
    if (!input.action) {
      throw new FjnActionNotSpecifiedError({});
    }

    try {
      // Step 1: 用户生效角色
      const effective = await this.getUserEffectiveRoles(input.userId);
      const matchedRoles = effective.roleCodes;
      const roleIds = effective.roleIds;

      // Step 2: 收集角色关联权限
      const rolePermissions = roleIds.length
        ? await this.prisma.fjnRolePermission.findMany({
            where: {
              roleId: { in: roleIds },
              status: 'active',
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          })
        : [];
      const rpPermissionIds = rolePermissions.map((rp) => rp.permissionId);
      const rpPermissions = rpPermissionIds.length
        ? await this.prisma.fjnPermission.findMany({
            where: {
              id: { in: rpPermissionIds },
              status: PERMISSION_STATUS.ACTIVE,
              deletedAt: null,
            },
          })
        : [];
      const permissionMap = new Map(rpPermissions.map((p) => [p.id, p]));
      const permissionCodesFromRoles: string[] = [];
      let resourceMatched = false;
      for (const rp of rolePermissions) {
        const p = permissionMap.get(rp.permissionId);
        if (!p) continue;
        // resource 通配符或精确匹配
        if (p.resource === input.resource || p.resource === '*') {
          permissionCodesFromRoles.push(p.permissionCode);
          if (p.action === input.action || p.action === '*') {
            resourceMatched = true;
          }
        }
      }

      // Step 3: 用户直授权限
      const userPermissions = await this.prisma.fjnUserPermission.findMany({
        where: {
          userId: input.userId,
          status: USER_PERMISSION_STATUS.ACTIVE,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      const upPermissionIds = userPermissions.map((up) => up.permissionId);
      const upPermissions = upPermissionIds.length
        ? await this.prisma.fjnPermission.findMany({
            where: {
              id: { in: upPermissionIds },
              status: PERMISSION_STATUS.ACTIVE,
              deletedAt: null,
            },
          })
        : [];
      const upPermissionMap = new Map(upPermissions.map((p) => [p.id, p]));
      const userPermissionCodes: string[] = [];
      let userDenied = false;
      let userGranted = false;
      for (const up of userPermissions) {
        const p = upPermissionMap.get(up.permissionId);
        if (!p) continue;
        if (p.resource === input.resource || p.resource === '*') {
          userPermissionCodes.push(p.permissionCode);
          if (p.action === input.action || p.action === '*') {
            if (up.effect === PERMISSION_EFFECT.DENY) {
              userDenied = true;
            } else if (up.effect === PERMISSION_EFFECT.GRANT) {
              userGranted = true;
            }
          }
        }
      }

      // Step 4: ABAC Policy
      const policies = await this.prisma.fjnAccessPolicy.findMany({
        where: {
          status: POLICY_STATUS.ACTIVE,
          deletedAt: null,
          resource: { in: [input.resource, '*'] },
          OR: [
            { validFrom: null },
            { validFrom: { lte: new Date() } },
          ],
          AND: [
            {
              OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
            },
          ],
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      });
      const matchedPolicyIds: string[] = [];
      let policyDenied = false;
      let policyAllowed = false;
      for (const p of policies) {
        const actions = (p.actions as string[]) ?? [];
        if (
          actions.includes(input.action) ||
          actions.includes('*')
        ) {
          // 简单条件评估：conditions 包含 { all: [...] } 或 { any: [...] } 或 { expr: '...' }
          const conds = (p.conditions as Record<string, unknown>) ?? {};
          const matched = this.evaluatePolicyConditions(conds, input.context ?? {});
          if (matched) {
            matchedPolicyIds.push(p.id);
            if (p.effect === POLICY_EFFECT.DENY) {
              policyDenied = true;
            } else if (p.effect === POLICY_EFFECT.ALLOW) {
              policyAllowed = true;
            }
          }
        }
      }

      // Step 5: 决策
      let decision: FjnAccessDecision;
      let reason: string;
      if (userDenied || policyDenied) {
        decision = ACCESS_DECISION.DENY;
        reason = userDenied
          ? '用户直授 deny'
          : 'ABAC Policy deny';
      } else if (userGranted || policyAllowed || resourceMatched) {
        decision = ACCESS_DECISION.ALLOW;
        reason = userGranted
          ? '用户直授 grant'
          : policyAllowed
          ? 'ABAC Policy allow'
          : '角色授权';
      } else {
        decision = ACCESS_DECISION.DENY;
        reason = '无匹配权限';
      }

      const latencyMs = Date.now() - startTime;
      const result: AccessDecisionResult = {
        decision,
        reason,
        matchedRoles,
        matchedPermissions: Array.from(
          new Set([...permissionCodesFromRoles, ...userPermissionCodes]),
        ),
        matchedPolicies: matchedPolicyIds,
        evaluatedAt: new Date().toISOString(),
        latencyMs,
      };

      // Step 6: 记录访问日志
      if (input.logAccess !== false) {
        await this.logAccess({
          userId: input.userId,
          resource: input.resource,
          action: input.action,
          decision,
          reason,
          matchedRoles,
          matchedPermissions: result.matchedPermissions,
          matchedPolicies: matchedPolicyIds,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          requestId: input.requestId,
          latencyMs,
        });
      }

      return result;
    } catch (e) {
      if (e instanceof FjnError) throw e;
      throw new FjnEvaluationFailedError({
        error: (e as Error).message,
        resource: input.resource,
        action: input.action,
      });
    }
  }

  /**
   * 简单 ABAC 条件评估
   * 支持：
   *  - { all: [{path, op, value}, ...] }
   *  - { any: [...] }
   *  - { not: {...} }
   *  - { path, op, value }  // 单个条件
   */
  private evaluatePolicyConditions(
    conds: Record<string, unknown>,
    context: Record<string, unknown>,
  ): boolean {
    if (conds.all && Array.isArray(conds.all)) {
      return (conds.all as Record<string, unknown>[]).every((c) =>
        this.evaluatePolicyConditions(c, context),
      );
    }
    if (conds.any && Array.isArray(conds.any)) {
      return (conds.any as Record<string, unknown>[]).some((c) =>
        this.evaluatePolicyConditions(c, context),
      );
    }
    if (conds.not) {
      return !this.evaluatePolicyConditions(conds.not as Record<string, unknown>, context);
    }
    if (conds.path && conds.op) {
      return this.evalSimpleCondition(
        conds.path as string,
        conds.op as string,
        conds.value,
        context,
      );
    }
    // 没有任何条件 → 默认匹配
    return true;
  }

  /** 简单条件：path 支持点号分层 (user.kycLevel) */
  private evalSimpleCondition(
    path: string,
    op: string,
    expected: unknown,
    context: Record<string, unknown>,
  ): boolean {
    const parts = path.split('.');
    let val: any = context;
    for (const p of parts) {
      if (val && typeof val === 'object' && p in val) {
        val = val[p];
      } else {
        val = undefined;
        break;
      }
    }
    switch (op) {
      case 'eq':
        return val === expected;
      case 'ne':
        return val !== expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(val);
      case 'notIn':
        return Array.isArray(expected) && !expected.includes(val);
      case 'gt':
        return typeof val === 'number' && typeof expected === 'number' && val > expected;
      case 'gte':
        return typeof val === 'number' && typeof expected === 'number' && val >= expected;
      case 'lt':
        return typeof val === 'number' && typeof expected === 'number' && val < expected;
      case 'lte':
        return typeof val === 'number' && typeof expected === 'number' && val <= expected;
      case 'contains':
        return typeof val === 'string' && typeof expected === 'string' && val.includes(expected);
      case 'exists':
        return val !== undefined && val !== null;
      default:
        return false;
    }
  }

  // ============================================================
  // 4.8 AccessLog 域
  // ============================================================

  /** 记录访问日志 */
  async logAccess(params: {
    userId?: string;
    userNo?: string;
    resource: string;
    action: string;
    decision: FjnAccessDecision;
    reason?: string;
    matchedRoles?: string[];
    matchedPermissions?: string[];
    matchedPolicies?: string[];
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    latencyMs?: number;
    metadata?: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const log = await this.prisma.fjnAccessLog.create({
      data: {
        userId: params.userId ?? null,
        userNo: params.userNo ?? null,
        resource: params.resource,
        action: params.action,
        decision: params.decision,
        reason: params.reason ?? null,
        matchedRoles: (params.matchedRoles ?? []) as any,
        matchedPermissions: (params.matchedPermissions ?? []) as any,
        matchedPolicies: (params.matchedPolicies ?? []) as any,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        requestId: params.requestId ?? null,
        latencyMs: params.latencyMs ?? null,
        metadata: (params.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
    return {
      log_id: log.id,
      user_id: log.userId,
      resource: log.resource,
      action: log.action,
      decision: log.decision,
      created_at: log.createdAt,
    };
  }

  /** 列出访问日志 */
  async listAccessLogs(
    params: ListAccessLogInput,
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnAccessLogWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.resource) where.resource = params.resource;
    if (params.action) where.action = params.action;
    if (params.decision) where.decision = params.decision;
    if (params.startTime || params.endTime) {
      where.createdAt = {};
      if (params.startTime) where.createdAt.gte = params.startTime;
      if (params.endTime) where.createdAt.lte = params.endTime;
    }

    const [items, total] = await Promise.all([
      this.prisma.fjnAccessLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnAccessLog.count({ where }),
    ]);
    return {
      items: items.map((l) => this.formatAccessLog(l)),
      total,
      page,
      pageSize,
    };
  }

  // ============================================================
  // 4.9 汇总统计
  // ============================================================

  /** Permission 汇总 */
  async getPermissionSummary(): Promise<Record<string, unknown>> {
    const [
      roleTotal,
      roleActive,
      roleDisabled,
      roleDeprecated,
      permissionTotal,
      permissionActive,
      policyTotal,
      policyActive,
      userRoleTotal,
      userRoleActive,
      userPermissionTotal,
      accessLogTotal,
      accessLogAllow,
    ] = await Promise.all([
      this.prisma.fjnRole.count({ where: { deletedAt: null } }),
      this.prisma.fjnRole.count({ where: { status: ROLE_STATUS.ACTIVE, deletedAt: null } }),
      this.prisma.fjnRole.count({ where: { status: ROLE_STATUS.DISABLED, deletedAt: null } }),
      this.prisma.fjnRole.count({ where: { status: ROLE_STATUS.DEPRECATED, deletedAt: null } }),
      this.prisma.fjnPermission.count({ where: { deletedAt: null } }),
      this.prisma.fjnPermission.count({
        where: { status: PERMISSION_STATUS.ACTIVE, deletedAt: null },
      }),
      this.prisma.fjnAccessPolicy.count({ where: { deletedAt: null } }),
      this.prisma.fjnAccessPolicy.count({
        where: { status: POLICY_STATUS.ACTIVE, deletedAt: null },
      }),
      this.prisma.fjnUserRole.count(),
      this.prisma.fjnUserRole.count({ where: { status: USER_ROLE_STATUS.ACTIVE } }),
      this.prisma.fjnUserPermission.count(),
      this.prisma.fjnAccessLog.count(),
      this.prisma.fjnAccessLog.count({ where: { decision: ACCESS_DECISION.ALLOW } }),
    ]);

    return {
      roles: {
        total: roleTotal,
        active: roleActive,
        disabled: roleDisabled,
        deprecated: roleDeprecated,
      },
      permissions: {
        total: permissionTotal,
        active: permissionActive,
        disabled: permissionTotal - permissionActive,
      },
      policies: {
        total: policyTotal,
        active: policyActive,
        disabled: policyTotal - policyActive,
      },
      userRoles: {
        total: userRoleTotal,
        active: userRoleActive,
      },
      userPermissions: {
        total: userPermissionTotal,
      },
      accessLogs: {
        total: accessLogTotal,
        allow: accessLogAllow,
        deny: accessLogTotal - accessLogAllow,
      },
    };
  }

  // ============================================================
  // 5. 工具方法
  // ============================================================

  /** 写入 outbox 事件（事务内） */
  private async emitOutboxEvent(
    tx: any,
    eventType: string,
    payload: object,
  ): Promise<void> {
    try {
      await (tx as any).outboxEvent.create({
        data: {
          eventType,
          payload: payload as any,
          status: 'pending',
          retryCount: 0,
        },
      });
    } catch (e) {
      this.log('warn', `emitOutboxEvent failed (${eventType})`, {
        error: (e as Error).message,
      });
    }
  }

  /** 格式化 Role */
  private formatRole(r: any): Record<string, unknown> {
    return {
      role_id: r.id,
      role_code: r.roleCode,
      role_name: r.roleName,
      description: r.description,
      role_type: r.roleType,
      status: r.status,
      is_system: r.isSystem,
      parent_id: r.parentId,
      sort: r.sort,
      metadata: r.metadata ?? null,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    };
  }

  /** 格式化 Permission */
  private formatPermission(p: any): Record<string, unknown> {
    return {
      permission_id: p.id,
      permission_code: p.permissionCode,
      permission_name: p.permissionName,
      description: p.description,
      resource: p.resource,
      action: p.action,
      permission_type: p.permissionType,
      status: p.status,
      is_system: p.isSystem,
      parent_id: p.parentId,
      sort: p.sort,
      metadata: p.metadata ?? null,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    };
  }

  /** 格式化 RolePermission */
  private formatRolePermission(rp: any): Record<string, unknown> {
    return {
      role_permission_id: rp.id,
      role_id: rp.roleId,
      permission_id: rp.permissionId,
      scope: rp.scope,
      scope_value: rp.scopeValue,
      conditions: rp.conditions ?? null,
      granted_by: rp.grantedBy,
      granted_at: rp.grantedAt,
      expires_at: rp.expiresAt,
      status: rp.status,
      created_at: rp.createdAt,
      updated_at: rp.updatedAt,
    };
  }

  /** 格式化 UserRole */
  private formatUserRole(ur: any): Record<string, unknown> {
    return {
      user_role_id: ur.id,
      user_id: ur.userId,
      role_id: ur.roleId,
      scope: ur.scope,
      scope_value: ur.scopeValue,
      granted_by: ur.grantedBy,
      granted_at: ur.grantedAt,
      expires_at: ur.expiresAt,
      status: ur.status,
      revoked_at: ur.revokedAt,
      revoked_by: ur.revokedBy,
      revoke_reason: ur.revokeReason,
      metadata: ur.metadata ?? null,
      created_at: ur.createdAt,
      updated_at: ur.updatedAt,
    };
  }

  /** 格式化 UserPermission */
  private formatUserPermission(up: any): Record<string, unknown> {
    return {
      user_permission_id: up.id,
      user_id: up.userId,
      permission_id: up.permissionId,
      effect: up.effect,
      scope: up.scope,
      scope_value: up.scopeValue,
      conditions: up.conditions ?? null,
      granted_by: up.grantedBy,
      granted_at: up.grantedAt,
      expires_at: up.expiresAt,
      status: up.status,
      revoked_at: up.revokedAt,
      revoked_by: up.revokedBy,
      revoke_reason: up.revokeReason,
      metadata: up.metadata ?? null,
      created_at: up.createdAt,
      updated_at: up.updatedAt,
    };
  }

  /** 格式化 Policy */
  private formatPolicy(p: any): Record<string, unknown> {
    return {
      policy_id: p.id,
      policy_code: p.policyCode,
      policy_name: p.policyName,
      description: p.description,
      effect: p.effect,
      resource: p.resource,
      actions: p.actions,
      conditions: p.conditions ?? null,
      priority: p.priority,
      status: p.status,
      is_system: p.isSystem,
      valid_from: p.validFrom,
      valid_to: p.validTo,
      metadata: p.metadata ?? null,
      created_by: p.createdBy,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    };
  }

  /** 格式化 AccessLog */
  private formatAccessLog(l: any): Record<string, unknown> {
    return {
      log_id: l.id,
      user_id: l.userId,
      user_no: l.userNo,
      resource: l.resource,
      action: l.action,
      decision: l.decision,
      reason: l.reason,
      matched_roles: l.matchedRoles,
      matched_permissions: l.matchedPermissions,
      matched_policies: l.matchedPolicies,
      ip_address: l.ipAddress,
      user_agent: l.userAgent,
      request_id: l.requestId,
      latency_ms: l.latencyMs,
      metadata: l.metadata ?? null,
      created_at: l.createdAt,
    };
  }
}
