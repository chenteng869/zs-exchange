/**
 * FJN Permission Service - 状态机
 *
 * 严格遵循工业级分层（参考 H015 + H018）：
 *  - Role 状态机：active | disabled | deprecated
 *  - Permission 状态机：active | disabled | deprecated
 *  - RolePermission 状态机：active | revoked
 *  - UserRole 状态机：active | revoked | expired | disabled
 *  - UserPermission 状态机：active | revoked | expired
 *  - AccessPolicy 状态机：active | disabled
 *
 * 状态机基于白名单，禁止隐式跳转。
 *
 * 用法：
 *   import { ROLE_STATUS, canTransitRoleStatus, assertTransitRoleStatus } from './permission-state-machine';
 */

import { FjnStateMachineError } from '../errors';

// ============================================================
// 1. Role 状态机
// ============================================================

/** Role 状态 */
export const ROLE_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
  DEPRECATED: 'deprecated',
} as const;

export type FjnRoleStatus = (typeof ROLE_STATUS)[keyof typeof ROLE_STATUS];

export const ALL_ROLE_STATUSES: readonly FjnRoleStatus[] =
  Object.values(ROLE_STATUS);

/** 终态：DEPRECATED 不可恢复（需新建角色） */
export const TERMINAL_ROLE_STATUSES: readonly FjnRoleStatus[] = [
  ROLE_STATUS.DEPRECATED,
] as const;

/** Role 状态流转表 */
export const ROLE_STATUS_TRANSITIONS: Record<FjnRoleStatus, readonly FjnRoleStatus[]> = {
  [ROLE_STATUS.ACTIVE]: [ROLE_STATUS.DISABLED, ROLE_STATUS.DEPRECATED],
  [ROLE_STATUS.DISABLED]: [ROLE_STATUS.ACTIVE, ROLE_STATUS.DEPRECATED],
  [ROLE_STATUS.DEPRECATED]: [],
} as const;

// ============================================================
// 2. Permission 状态机
// ============================================================

/** Permission 状态 */
export const PERMISSION_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
  DEPRECATED: 'deprecated',
} as const;

export type FjnPermissionStatus =
  (typeof PERMISSION_STATUS)[keyof typeof PERMISSION_STATUS];

export const ALL_PERMISSION_STATUSES: readonly FjnPermissionStatus[] =
  Object.values(PERMISSION_STATUS);

export const TERMINAL_PERMISSION_STATUSES: readonly FjnPermissionStatus[] = [
  PERMISSION_STATUS.DEPRECATED,
] as const;

/** Permission 状态流转表 */
export const PERMISSION_STATUS_TRANSITIONS: Record<FjnPermissionStatus, readonly FjnPermissionStatus[]> = {
  [PERMISSION_STATUS.ACTIVE]: [
    PERMISSION_STATUS.DISABLED,
    PERMISSION_STATUS.DEPRECATED,
  ],
  [PERMISSION_STATUS.DISABLED]: [
    PERMISSION_STATUS.ACTIVE,
    PERMISSION_STATUS.DEPRECATED,
  ],
  [PERMISSION_STATUS.DEPRECATED]: [],
} as const;

// ============================================================
// 3. RolePermission 状态机
// ============================================================

/** RolePermission 状态（角色绑定的权限） */
export const ROLE_PERMISSION_STATUS = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
} as const;

export type FjnRolePermissionStatus =
  (typeof ROLE_PERMISSION_STATUS)[keyof typeof ROLE_PERMISSION_STATUS];

export const ALL_ROLE_PERMISSION_STATUSES: readonly FjnRolePermissionStatus[] =
  Object.values(ROLE_PERMISSION_STATUS);

export const ROLE_PERMISSION_STATUS_TRANSITIONS: Record<FjnRolePermissionStatus, readonly FjnRolePermissionStatus[]> = {
  [ROLE_PERMISSION_STATUS.ACTIVE]: [ROLE_PERMISSION_STATUS.REVOKED],
  [ROLE_PERMISSION_STATUS.REVOKED]: [ROLE_PERMISSION_STATUS.ACTIVE],
} as const;

// ============================================================
// 4. UserRole 状态机
// ============================================================

/** UserRole 状态（用户绑定的角色） */
export const USER_ROLE_STATUS = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
  DISABLED: 'disabled',
} as const;

export type FjnUserRoleStatus =
  (typeof USER_ROLE_STATUS)[keyof typeof USER_ROLE_STATUS];

export const ALL_USER_ROLE_STATUSES: readonly FjnUserRoleStatus[] =
  Object.values(USER_ROLE_STATUS);

/** UserRole 状态流转表 */
export const USER_ROLE_STATUS_TRANSITIONS: Record<FjnUserRoleStatus, readonly FjnUserRoleStatus[]> = {
  [USER_ROLE_STATUS.ACTIVE]: [
    USER_ROLE_STATUS.REVOKED,
    USER_ROLE_STATUS.EXPIRED,
    USER_ROLE_STATUS.DISABLED,
  ],
  [USER_ROLE_STATUS.REVOKED]: [USER_ROLE_STATUS.ACTIVE],
  [USER_ROLE_STATUS.EXPIRED]: [USER_ROLE_STATUS.ACTIVE],
  [USER_ROLE_STATUS.DISABLED]: [USER_ROLE_STATUS.ACTIVE, USER_ROLE_STATUS.REVOKED],
} as const;

// ============================================================
// 5. UserPermission 状态机
// ============================================================

/** UserPermission 状态（用户直授权限） */
export const USER_PERMISSION_STATUS = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
} as const;

export type FjnUserPermissionStatus =
  (typeof USER_PERMISSION_STATUS)[keyof typeof USER_PERMISSION_STATUS];

export const ALL_USER_PERMISSION_STATUSES: readonly FjnUserPermissionStatus[] =
  Object.values(USER_PERMISSION_STATUS);

export const USER_PERMISSION_STATUS_TRANSITIONS: Record<FjnUserPermissionStatus, readonly FjnUserPermissionStatus[]> = {
  [USER_PERMISSION_STATUS.ACTIVE]: [
    USER_PERMISSION_STATUS.REVOKED,
    USER_PERMISSION_STATUS.EXPIRED,
  ],
  [USER_PERMISSION_STATUS.REVOKED]: [USER_PERMISSION_STATUS.ACTIVE],
  [USER_PERMISSION_STATUS.EXPIRED]: [USER_PERMISSION_STATUS.ACTIVE],
} as const;

// ============================================================
// 6. AccessPolicy 状态机
// ============================================================

/** AccessPolicy 状态 */
export const POLICY_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
} as const;

export type FjnPolicyStatus = (typeof POLICY_STATUS)[keyof typeof POLICY_STATUS];

export const ALL_POLICY_STATUSES: readonly FjnPolicyStatus[] =
  Object.values(POLICY_STATUS);

export const POLICY_STATUS_TRANSITIONS: Record<FjnPolicyStatus, readonly FjnPolicyStatus[]> = {
  [POLICY_STATUS.ACTIVE]: [POLICY_STATUS.DISABLED],
  [POLICY_STATUS.DISABLED]: [POLICY_STATUS.ACTIVE],
} as const;

// ============================================================
// 7. 通用枚举（Role 类型 / Permission 类型 / Scope / Effect / Decision）
// ============================================================

/** Role 类型 */
export const ROLE_TYPE = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  USER: 'user',
  SYSTEM: 'system',
} as const;

export type FjnRoleType = (typeof ROLE_TYPE)[keyof typeof ROLE_TYPE];
export const ALL_ROLE_TYPES: readonly FjnRoleType[] = Object.values(ROLE_TYPE);

/** Permission 类型 */
export const PERMISSION_TYPE = {
  API: 'api',
  MENU: 'menu',
  BUTTON: 'button',
  DATA: 'data',
} as const;

export type FjnPermissionType =
  (typeof PERMISSION_TYPE)[keyof typeof PERMISSION_TYPE];
export const ALL_PERMISSION_TYPES: readonly FjnPermissionType[] =
  Object.values(PERMISSION_TYPE);

/** 作用域类型 */
export const SCOPE_TYPE = {
  ALL: 'all',
  OWN: 'own',
  TEAM: 'team',
  REGION: 'region',
  CUSTOM: 'custom',
} as const;

export type FjnScopeType = (typeof SCOPE_TYPE)[keyof typeof SCOPE_TYPE];
export const ALL_SCOPE_TYPES: readonly FjnScopeType[] = Object.values(SCOPE_TYPE);

/** 权限效果 */
export const PERMISSION_EFFECT = {
  GRANT: 'grant',
  DENY: 'deny',
} as const;

export type FjnPermissionEffect =
  (typeof PERMISSION_EFFECT)[keyof typeof PERMISSION_EFFECT];

/** ABAC 策略效果 */
export const POLICY_EFFECT = {
  ALLOW: 'allow',
  DENY: 'deny',
} as const;

export type FjnPolicyEffect =
  (typeof POLICY_EFFECT)[keyof typeof POLICY_EFFECT];

/** 访问决策 */
export const ACCESS_DECISION = {
  ALLOW: 'allow',
  DENY: 'deny',
} as const;

export type FjnAccessDecision =
  (typeof ACCESS_DECISION)[keyof typeof ACCESS_DECISION];

// ============================================================
// 8. 通用状态机工具
// ============================================================

/** 判断状态是否合法（Role） */
export function isValidRoleStatus(s: string): s is FjnRoleStatus {
  return (ALL_ROLE_STATUSES as readonly string[]).includes(s);
}

/** 判断状态是否合法（Permission） */
export function isValidPermissionStatus(s: string): s is FjnPermissionStatus {
  return (ALL_PERMISSION_STATUSES as readonly string[]).includes(s);
}

/** 判断状态是否合法（UserRole） */
export function isValidUserRoleStatus(s: string): s is FjnUserRoleStatus {
  return (ALL_USER_ROLE_STATUSES as readonly string[]).includes(s);
}

/** 判断状态是否合法（UserPermission） */
export function isValidUserPermissionStatus(
  s: string,
): s is FjnUserPermissionStatus {
  return (ALL_USER_PERMISSION_STATUSES as readonly string[]).includes(s);
}

/** 判断状态是否合法（Policy） */
export function isValidPolicyStatus(s: string): s is FjnPolicyStatus {
  return (ALL_POLICY_STATUSES as readonly string[]).includes(s);
}

/** 判断是否终态（Role） */
export function isTerminalRoleStatus(s: FjnRoleStatus): boolean {
  return TERMINAL_ROLE_STATUSES.includes(s);
}

/** 判断是否终态（Permission） */
export function isTerminalPermissionStatus(s: FjnPermissionStatus): boolean {
  return TERMINAL_PERMISSION_STATUSES.includes(s);
}

/** Role 状态机：判断是否可转移 */
export function canTransitRoleStatus(
  from: FjnRoleStatus,
  to: FjnRoleStatus,
): boolean {
  return ROLE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Role 状态机：强制可转移（失败抛 FjnStateMachineError） */
export function assertTransitRoleStatus(
  from: FjnRoleStatus,
  to: FjnRoleStatus,
): void {
  if (!canTransitRoleStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 Role 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: ROLE_STATUS_TRANSITIONS[from] },
    );
  }
}

/** Permission 状态机：判断是否可转移 */
export function canTransitPermissionStatus(
  from: FjnPermissionStatus,
  to: FjnPermissionStatus,
): boolean {
  return PERMISSION_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Permission 状态机：强制可转移 */
export function assertTransitPermissionStatus(
  from: FjnPermissionStatus,
  to: FjnPermissionStatus,
): void {
  if (!canTransitPermissionStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 Permission 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: PERMISSION_STATUS_TRANSITIONS[from] },
    );
  }
}

/** RolePermission 状态机：判断是否可转移 */
export function canTransitRolePermissionStatus(
  from: FjnRolePermissionStatus,
  to: FjnRolePermissionStatus,
): boolean {
  return ROLE_PERMISSION_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** RolePermission 状态机：强制可转移 */
export function assertTransitRolePermissionStatus(
  from: FjnRolePermissionStatus,
  to: FjnRolePermissionStatus,
): void {
  if (!canTransitRolePermissionStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 RolePermission 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: ROLE_PERMISSION_STATUS_TRANSITIONS[from] },
    );
  }
}

/** UserRole 状态机：判断是否可转移 */
export function canTransitUserRoleStatus(
  from: FjnUserRoleStatus,
  to: FjnUserRoleStatus,
): boolean {
  return USER_ROLE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** UserRole 状态机：强制可转移 */
export function assertTransitUserRoleStatus(
  from: FjnUserRoleStatus,
  to: FjnUserRoleStatus,
): void {
  if (!canTransitUserRoleStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 UserRole 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: USER_ROLE_STATUS_TRANSITIONS[from] },
    );
  }
}

/** UserPermission 状态机：判断是否可转移 */
export function canTransitUserPermissionStatus(
  from: FjnUserPermissionStatus,
  to: FjnUserPermissionStatus,
): boolean {
  return USER_PERMISSION_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** UserPermission 状态机：强制可转移 */
export function assertTransitUserPermissionStatus(
  from: FjnUserPermissionStatus,
  to: FjnUserPermissionStatus,
): void {
  if (!canTransitUserPermissionStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 UserPermission 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: USER_PERMISSION_STATUS_TRANSITIONS[from] },
    );
  }
}

/** Policy 状态机：判断是否可转移 */
export function canTransitPolicyStatus(
  from: FjnPolicyStatus,
  to: FjnPolicyStatus,
): boolean {
  return POLICY_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Policy 状态机：强制可转移 */
export function assertTransitPolicyStatus(
  from: FjnPolicyStatus,
  to: FjnPolicyStatus,
): void {
  if (!canTransitPolicyStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 Policy 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: POLICY_STATUS_TRANSITIONS[from] },
    );
  }
}

/** 下一个合法状态集合 */
export function nextRoleStatuses(from: FjnRoleStatus): readonly FjnRoleStatus[] {
  return ROLE_STATUS_TRANSITIONS[from] ?? [];
}

export function nextPermissionStatuses(
  from: FjnPermissionStatus,
): readonly FjnPermissionStatus[] {
  return PERMISSION_STATUS_TRANSITIONS[from] ?? [];
}

export function nextUserRoleStatuses(
  from: FjnUserRoleStatus,
): readonly FjnUserRoleStatus[] {
  return USER_ROLE_STATUS_TRANSITIONS[from] ?? [];
}

/** 业务工具函数 */

/** Role 是否可用（active 且非 deprecated） */
export function isRoleUsable(s: FjnRoleStatus): boolean {
  return s === ROLE_STATUS.ACTIVE;
}

/** Permission 是否可用 */
export function isPermissionUsable(s: FjnPermissionStatus): boolean {
  return s === PERMISSION_STATUS.ACTIVE;
}

/** UserRole 是否生效（active 且未过期） */
export function isUserRoleActive(
  s: FjnUserRoleStatus,
  expiresAt: Date | null | undefined,
): boolean {
  if (s !== USER_ROLE_STATUS.ACTIVE) return false;
  if (!expiresAt) return true;
  return expiresAt.getTime() > Date.now();
}

/** UserPermission 是否生效 */
export function isUserPermissionActive(
  s: FjnUserPermissionStatus,
  expiresAt: Date | null | undefined,
): boolean {
  if (s !== USER_PERMISSION_STATUS.ACTIVE) return false;
  if (!expiresAt) return true;
  return expiresAt.getTime() > Date.now();
}

/** Role 编码格式校验：^[a-z][a-z0-9_]{2,63}$ */
export function isValidRoleCode(code: string): boolean {
  return /^[a-z][a-z0-9_]{2,63}$/.test(code);
}

/** Permission 编码格式校验：^[a-z][a-z0-9_.]{2,127}$ */
export function isValidPermissionCode(code: string): boolean {
  return /^[a-z][a-z0-9_.]{2,127}$/.test(code);
}

/** Policy 编码格式校验：^[a-z][a-z0-9_]{2,127}$ */
export function isValidPolicyCode(code: string): boolean {
  return /^[a-z][a-z0-9_]{2,127}$/.test(code);
}
