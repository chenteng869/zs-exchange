/**
 * FJN Permission Service - 事件定义
 *
 * 严格遵循工业级规范（参考 H015 + H018）：
 *  - Role / Permission / 关联 / ABAC 全部事件常量
 *  - 事件 source 枚举
 *  - 完整 Payload 接口（用于 outbox/事件总线）
 *
 * 用法：
 *   import { PERMISSION_EVENTS, PERMISSION_EVENT_SOURCES } from './permission-events';
 *   await emitOutboxEvent(tx, PERMISSION_EVENTS.ROLE_CREATED, payload);
 */

import type {
  FjnRoleType,
  FjnPermissionType,
  FjnScopeType,
  FjnPermissionEffect,
  FjnPolicyEffect,
  FjnAccessDecision,
} from './permission-state-machine';

// ============================================================
// 1. Permission 事件常量（12 个）
// ============================================================

export const PERMISSION_EVENTS = {
  // Role 事件（5 个）
  ROLE_CREATED: 'permission.role.created.v1',
  ROLE_UPDATED: 'permission.role.updated.v1',
  ROLE_DISABLED: 'permission.role.disabled.v1',
  ROLE_ENABLED: 'permission.role.enabled.v1',
  ROLE_DEPRECATED: 'permission.role.deprecated.v1',

  // Permission 事件（3 个）
  PERMISSION_CREATED: 'permission.permission.created.v1',
  PERMISSION_UPDATED: 'permission.permission.updated.v1',
  PERMISSION_DISABLED: 'permission.permission.disabled.v1',

  // 关联事件（3 个）
  ROLE_PERMISSION_GRANTED: 'permission.role_permission.granted.v1',
  ROLE_PERMISSION_REVOKED: 'permission.role_permission.revoked.v1',
  USER_ROLE_ASSIGNED: 'permission.user_role.assigned.v1',

  // ABAC 事件（1 个）
  ACCESS_POLICY_CREATED: 'permission.access_policy.created.v1',
} as const;

export type FjnPermissionEventName =
  (typeof PERMISSION_EVENTS)[keyof typeof PERMISSION_EVENTS];

export const ALL_PERMISSION_EVENTS: readonly FjnPermissionEventName[] =
  Object.values(PERMISSION_EVENTS);

// ============================================================
// 2. 事件来源
// ============================================================

export const PERMISSION_EVENT_SOURCES = {
  USER: 'user',
  ADMIN: 'admin',
  SYSTEM: 'system',
  SCHEDULER: 'scheduler',
  RISK_SERVICE: 'risk_service',
  ABAC_ENGINE: 'abac_engine',
} as const;

export type FjnPermissionEventSource =
  (typeof PERMISSION_EVENT_SOURCES)[keyof typeof PERMISSION_EVENT_SOURCES];

export const ALL_PERMISSION_EVENT_SOURCES: readonly FjnPermissionEventSource[] =
  Object.values(PERMISSION_EVENT_SOURCES);

// ============================================================
// 3. Role Payload 接口
// ============================================================

/** Role Created Payload */
export interface RoleCreatedPayload {
  occurred_at: string;
  source: FjnPermissionEventSource;
  role_id: string;
  role_code: string;
  role_name: string;
  role_type: FjnRoleType;
  is_system: boolean;
  parent_id?: string;
  operator_id?: string;
}

/** Role Updated Payload */
export interface RoleUpdatedPayload {
  occurred_at: string;
  source: FjnPermissionEventSource;
  role_id: string;
  role_code: string;
  changed_fields: string[];
  operator_id?: string;
}

/** Role Disabled Payload */
export interface RoleDisabledPayload {
  occurred_at: string;
  source: FjnPermissionEventSource;
  role_id: string;
  role_code: string;
  reason?: string;
  operator_id?: string;
}

/** Role Enabled Payload */
export interface RoleEnabledPayload {
  occurred_at: string;
  source: FjnPermissionEventSource;
  role_id: string;
  role_code: string;
  operator_id?: string;
}

/** Role Deprecated Payload */
export interface RoleDeprecatedPayload {
  occurred_at: string;
  source: FjnPermissionEventSource;
  role_id: string;
  role_code: string;
  reason?: string;
  operator_id?: string;
}

// ============================================================
// 4. Permission Payload 接口
// ============================================================

/** Permission Created Payload */
export interface PermissionCreatedPayload {
  occurred_at: string;
  source: FjnPermissionEventSource;
  permission_id: string;
  permission_code: string;
  permission_name: string;
  resource: string;
  action: string;
  permission_type: FjnPermissionType;
  is_system: boolean;
  operator_id?: string;
}

/** Permission Updated Payload */
export interface PermissionUpdatedPayload {
  occurred_at: string;
  source: FjnPermissionEventSource;
  permission_id: string;
  permission_code: string;
  changed_fields: string[];
  operator_id?: string;
}

/** Permission Disabled Payload */
export interface PermissionDisabledPayload {
  occurred_at: string;
  source: FjnPermissionEventSource;
  permission_id: string;
  permission_code: string;
  reason?: string;
  operator_id?: string;
}

// ============================================================
// 5. 关联事件 Payload
// ============================================================

/** Role Permission Granted Payload */
export interface RolePermissionGrantedPayload {
  occurred_at: string;
  source: FjnPermissionEventSource;
  role_id: string;
  role_code: string;
  permission_id: string;
  permission_code: string;
  scope: FjnScopeType;
  scope_value?: string;
  expires_at?: string;
  operator_id?: string;
}

/** Role Permission Revoked Payload */
export interface RolePermissionRevokedPayload {
  occurred_at: string;
  source: FjnPermissionEventSource;
  role_id: string;
  role_code: string;
  permission_id: string;
  permission_code: string;
  operator_id?: string;
}

/** User Role Assigned Payload */
export interface UserRoleAssignedPayload {
  occurred_at: string;
  source: FjnPermissionEventSource;
  user_id: string;
  role_id: string;
  role_code: string;
  scope: FjnScopeType;
  scope_value?: string;
  expires_at?: string;
  operator_id?: string;
}

// ============================================================
// 6. ABAC 事件 Payload
// ============================================================

/** Access Policy Created Payload */
export interface AccessPolicyCreatedPayload {
  occurred_at: string;
  source: FjnPermissionEventSource;
  policy_id: string;
  policy_code: string;
  policy_name: string;
  effect: FjnPolicyEffect;
  resource: string;
  actions: string[];
  priority: number;
  operator_id?: string;
}

// ============================================================
// 7. 工具：按事件名推断 payload 类型
// ============================================================

export type FjnPermissionEventPayloadMap = {
  [PERMISSION_EVENTS.ROLE_CREATED]: RoleCreatedPayload;
  [PERMISSION_EVENTS.ROLE_UPDATED]: RoleUpdatedPayload;
  [PERMISSION_EVENTS.ROLE_DISABLED]: RoleDisabledPayload;
  [PERMISSION_EVENTS.ROLE_ENABLED]: RoleEnabledPayload;
  [PERMISSION_EVENTS.ROLE_DEPRECATED]: RoleDeprecatedPayload;
  [PERMISSION_EVENTS.PERMISSION_CREATED]: PermissionCreatedPayload;
  [PERMISSION_EVENTS.PERMISSION_UPDATED]: PermissionUpdatedPayload;
  [PERMISSION_EVENTS.PERMISSION_DISABLED]: PermissionDisabledPayload;
  [PERMISSION_EVENTS.ROLE_PERMISSION_GRANTED]: RolePermissionGrantedPayload;
  [PERMISSION_EVENTS.ROLE_PERMISSION_REVOKED]: RolePermissionRevokedPayload;
  [PERMISSION_EVENTS.USER_ROLE_ASSIGNED]: UserRoleAssignedPayload;
  [PERMISSION_EVENTS.ACCESS_POLICY_CREATED]: AccessPolicyCreatedPayload;
};
