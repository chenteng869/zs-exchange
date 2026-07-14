/**
 * FJN Permission Service - 错误码 + 异常类
 *
 * 严格遵循工业级分层（参考 H018 §4）：
 *  - 错误码使用 SCREAMING_SNAKE_CASE
 *  - 错误码映射到对应异常类与 HTTP 状态码
 *
 * 用法：
 *   import { FjnRoleNotFoundError, PERMISSION_ERROR_CODES } from './permission-errors';
 *   throw new FjnRoleNotFoundError({ roleId });
 */

import { FjnError, FjnErrorContext } from '../errors';

// ============================================================
// 1. 错误码常量
// ============================================================

export const PERMISSION_ERROR_CODES = {
  // ---------- Role 通用 ----------
  ROLE_NOT_FOUND: 'PERMISSION_ROLE_NOT_FOUND',
  ROLE_ALREADY_EXISTS: 'PERMISSION_ROLE_ALREADY_EXISTS',
  ROLE_CODE_INVALID: 'PERMISSION_ROLE_CODE_INVALID',
  ROLE_NAME_REQUIRED: 'PERMISSION_ROLE_NAME_REQUIRED',
  ROLE_STATUS_INVALID: 'PERMISSION_ROLE_STATUS_INVALID',
  ROLE_SYSTEM_PROTECTED: 'PERMISSION_ROLE_SYSTEM_PROTECTED',
  ROLE_CANNOT_DELETE_HAS_USERS: 'PERMISSION_ROLE_CANNOT_DELETE_HAS_USERS',
  ROLE_CANNOT_DELETE_HAS_PERMISSIONS: 'PERMISSION_ROLE_CANNOT_DELETE_HAS_PERMISSIONS',
  ROLE_DISABLED: 'PERMISSION_ROLE_DISABLED',
  ROLE_DEPRECATED: 'PERMISSION_ROLE_DEPRECATED',

  // ---------- Permission 通用 ----------
  PERMISSION_NOT_FOUND: 'PERMISSION_NOT_FOUND',
  PERMISSION_ALREADY_EXISTS: 'PERMISSION_ALREADY_EXISTS',
  PERMISSION_CODE_INVALID: 'PERMISSION_CODE_INVALID',
  PERMISSION_NAME_REQUIRED: 'PERMISSION_NAME_REQUIRED',
  PERMISSION_STATUS_INVALID: 'PERMISSION_STATUS_INVALID',
  PERMISSION_SYSTEM_PROTECTED: 'PERMISSION_SYSTEM_PROTECTED',
  PERMISSION_DISABLED: 'PERMISSION_DISABLED',
  PERMISSION_RESOURCE_REQUIRED: 'PERMISSION_RESOURCE_REQUIRED',
  PERMISSION_ACTION_REQUIRED: 'PERMISSION_ACTION_REQUIRED',

  // ---------- RolePermission 关联 ----------
  ROLE_PERMISSION_ALREADY_GRANTED: 'PERMISSION_ROLE_PERMISSION_ALREADY_GRANTED',
  ROLE_PERMISSION_NOT_GRANTED: 'PERMISSION_ROLE_PERMISSION_NOT_GRANTED',
  ROLE_PERMISSION_REVOKED: 'PERMISSION_ROLE_PERMISSION_REVOKED',
  ROLE_PERMISSION_EXPIRED: 'PERMISSION_ROLE_PERMISSION_EXPIRED',
  ROLE_PERMISSION_SCOPE_INVALID: 'PERMISSION_ROLE_PERMISSION_SCOPE_INVALID',
  ROLE_PERMISSION_GRANTOR_REQUIRED: 'PERMISSION_ROLE_PERMISSION_GRANTOR_REQUIRED',

  // ---------- UserRole 关联 ----------
  USER_ROLE_NOT_FOUND: 'PERMISSION_USER_ROLE_NOT_FOUND',
  USER_ROLE_ALREADY_ASSIGNED: 'PERMISSION_USER_ROLE_ALREADY_ASSIGNED',
  USER_ROLE_REVOKED: 'PERMISSION_USER_ROLE_REVOKED',
  USER_ROLE_EXPIRED: 'PERMISSION_USER_ROLE_EXPIRED',
  USER_ROLE_DISABLED: 'PERMISSION_USER_ROLE_DISABLED',
  USER_ROLE_GRANTOR_REQUIRED: 'PERMISSION_USER_ROLE_GRANTOR_REQUIRED',
  USER_ROLE_SCOPE_INVALID: 'PERMISSION_USER_ROLE_SCOPE_INVALID',
  USER_ROLE_EXPIRES_INVALID: 'PERMISSION_USER_ROLE_EXPIRES_INVALID',

  // ---------- UserPermission 直授 ----------
  USER_PERMISSION_NOT_FOUND: 'PERMISSION_USER_PERMISSION_NOT_FOUND',
  USER_PERMISSION_ALREADY_GRANTED: 'PERMISSION_USER_PERMISSION_ALREADY_GRANTED',
  USER_PERMISSION_REVOKED: 'PERMISSION_USER_PERMISSION_REVOKED',
  USER_PERMISSION_EXPIRED: 'PERMISSION_USER_PERMISSION_EXPIRED',
  USER_PERMISSION_GRANTOR_REQUIRED: 'PERMISSION_USER_PERMISSION_GRANTOR_REQUIRED',
  USER_PERMISSION_SCOPE_INVALID: 'PERMISSION_USER_PERMISSION_SCOPE_INVALID',
  USER_PERMISSION_EFFECT_INVALID: 'PERMISSION_USER_PERMISSION_EFFECT_INVALID',

  // ---------- ABAC Policy ----------
  POLICY_NOT_FOUND: 'PERMISSION_POLICY_NOT_FOUND',
  POLICY_ALREADY_EXISTS: 'PERMISSION_POLICY_ALREADY_EXISTS',
  POLICY_CODE_INVALID: 'PERMISSION_POLICY_CODE_INVALID',
  POLICY_NAME_REQUIRED: 'PERMISSION_POLICY_NAME_REQUIRED',
  POLICY_STATUS_INVALID: 'PERMISSION_POLICY_STATUS_INVALID',
  POLICY_CONDITIONS_INVALID: 'PERMISSION_POLICY_CONDITIONS_INVALID',
  POLICY_EFFECT_INVALID: 'PERMISSION_POLICY_EFFECT_INVALID',
  POLICY_ACTIONS_REQUIRED: 'PERMISSION_POLICY_ACTIONS_REQUIRED',
  POLICY_SYSTEM_PROTECTED: 'PERMISSION_POLICY_SYSTEM_PROTECTED',
  POLICY_VALIDITY_INVALID: 'PERMISSION_POLICY_VALIDITY_INVALID',

  // ---------- 评估与拒绝 ----------
  ACCESS_DENIED: 'PERMISSION_ACCESS_DENIED',
  ACCESS_ALLOWED: 'PERMISSION_ACCESS_ALLOWED',
  EVALUATION_FAILED: 'PERMISSION_EVALUATION_FAILED',
  RESOURCE_NOT_SPECIFIED: 'PERMISSION_RESOURCE_NOT_SPECIFIED',
  ACTION_NOT_SPECIFIED: 'PERMISSION_ACTION_NOT_SPECIFIED',
  SCOPE_NOT_ALLOWED: 'PERMISSION_SCOPE_NOT_ALLOWED',
  EFFECT_INVALID: 'PERMISSION_EFFECT_INVALID',

  // ---------- 系统类 ----------
  INTERNAL: 'PERMISSION_INTERNAL',
} as const;

export type FjnPermissionErrorCode =
  (typeof PERMISSION_ERROR_CODES)[keyof typeof PERMISSION_ERROR_CODES];

// ============================================================
// 2. 异常类
// ============================================================

/** Permission 异常基类 */
export class FjnPermissionError extends FjnError {
  constructor(
    code: FjnPermissionErrorCode,
    message: string,
    context?: FjnErrorContext,
    httpStatus?: number,
  ) {
    super({
      code: code as any,
      message,
      context,
      httpStatus,
    });
    this.name = 'FjnPermissionError';
  }
}

// ---------- Role 异常 ----------

export class FjnRoleNotFoundError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ROLE_NOT_FOUND,
      'Role 不存在',
      context,
      404,
    );
  }
}

export class FjnRoleAlreadyExistsError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ROLE_ALREADY_EXISTS,
      'Role 代码已存在',
      context,
      409,
    );
  }
}

export class FjnRoleCodeInvalidError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ROLE_CODE_INVALID,
      'Role 代码格式非法（^[a-z][a-z0-9_]{2,63}$）',
      context,
      400,
    );
  }
}

export class FjnRoleNameRequiredError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ROLE_NAME_REQUIRED,
      'Role 名称必填',
      context,
      400,
    );
  }
}

export class FjnRoleStatusInvalidError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ROLE_STATUS_INVALID,
      'Role 状态非法',
      context,
      400,
    );
  }
}

export class FjnRoleSystemProtectedError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ROLE_SYSTEM_PROTECTED,
      '系统内置 Role 不可修改/删除',
      context,
      403,
    );
  }
}

export class FjnRoleCannotDeleteError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ROLE_CANNOT_DELETE_HAS_USERS,
      'Role 仍被用户绑定，不可删除',
      context,
      409,
    );
  }
}

export class FjnRoleDisabledError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ROLE_DISABLED,
      'Role 已被禁用',
      context,
      403,
    );
  }
}

export class FjnRoleDeprecatedError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ROLE_DEPRECATED,
      'Role 已被废弃，不可使用',
      context,
      403,
    );
  }
}

// ---------- Permission 异常 ----------

export class FjnPermissionNotFoundError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.PERMISSION_NOT_FOUND,
      'Permission 不存在',
      context,
      404,
    );
  }
}

export class FjnPermissionAlreadyExistsError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.PERMISSION_ALREADY_EXISTS,
      'Permission 代码已存在',
      context,
      409,
    );
  }
}

export class FjnPermissionCodeInvalidError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.PERMISSION_CODE_INVALID,
      'Permission 代码格式非法（^[a-z][a-z0-9_.]{2,127}$）',
      context,
      400,
    );
  }
}

export class FjnPermissionNameRequiredError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.PERMISSION_NAME_REQUIRED,
      'Permission 名称必填',
      context,
      400,
    );
  }
}

export class FjnPermissionStatusInvalidError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.PERMISSION_STATUS_INVALID,
      'Permission 状态非法',
      context,
      400,
    );
  }
}

export class FjnPermissionSystemProtectedError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.PERMISSION_SYSTEM_PROTECTED,
      '系统内置 Permission 不可修改/删除',
      context,
      403,
    );
  }
}

export class FjnPermissionDisabledError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.PERMISSION_DISABLED,
      'Permission 已被禁用',
      context,
      403,
    );
  }
}

export class FjnPermissionResourceRequiredError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.PERMISSION_RESOURCE_REQUIRED,
      'Permission 资源名必填',
      context,
      400,
    );
  }
}

export class FjnPermissionActionRequiredError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.PERMISSION_ACTION_REQUIRED,
      'Permission 操作必填',
      context,
      400,
    );
  }
}

// ---------- RolePermission 异常 ----------

export class FjnRolePermissionAlreadyGrantedError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ROLE_PERMISSION_ALREADY_GRANTED,
      'Role 已拥有该权限（相同 scope）',
      context,
      409,
    );
  }
}

export class FjnRolePermissionNotGrantedError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ROLE_PERMISSION_NOT_GRANTED,
      'Role 未拥有该权限',
      context,
      404,
    );
  }
}

export class FjnRolePermissionRevokedError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ROLE_PERMISSION_REVOKED,
      'RolePermission 已撤销',
      context,
      410,
    );
  }
}

export class FjnRolePermissionExpiredError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ROLE_PERMISSION_EXPIRED,
      'RolePermission 已过期',
      context,
      410,
    );
  }
}

export class FjnRolePermissionScopeInvalidError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ROLE_PERMISSION_SCOPE_INVALID,
      'RolePermission 作用域非法（all | own | team | region | custom）',
      context,
      400,
    );
  }
}

export class FjnRolePermissionGrantorRequiredError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ROLE_PERMISSION_GRANTOR_REQUIRED,
      '授权人 ID 必填',
      context,
      400,
    );
  }
}

// ---------- UserRole 异常 ----------

export class FjnUserRoleNotFoundError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.USER_ROLE_NOT_FOUND,
      '用户未绑定该角色',
      context,
      404,
    );
  }
}

export class FjnUserRoleAlreadyAssignedError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.USER_ROLE_ALREADY_ASSIGNED,
      '用户已拥有该角色（相同 scope）',
      context,
      409,
    );
  }
}

export class FjnUserRoleRevokedError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.USER_ROLE_REVOKED,
      'UserRole 已撤销',
      context,
      410,
    );
  }
}

export class FjnUserRoleExpiredError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.USER_ROLE_EXPIRED,
      'UserRole 已过期',
      context,
      410,
    );
  }
}

export class FjnUserRoleDisabledError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.USER_ROLE_DISABLED,
      'UserRole 已禁用',
      context,
      403,
    );
  }
}

export class FjnUserRoleGrantorRequiredError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.USER_ROLE_GRANTOR_REQUIRED,
      '分配人 ID 必填',
      context,
      400,
    );
  }
}

export class FjnUserRoleScopeInvalidError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.USER_ROLE_SCOPE_INVALID,
      'UserRole 作用域非法',
      context,
      400,
    );
  }
}

export class FjnUserRoleExpiresInvalidError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.USER_ROLE_EXPIRES_INVALID,
      'UserRole 过期时间必须晚于当前时间',
      context,
      400,
    );
  }
}

// ---------- UserPermission 异常 ----------

export class FjnUserPermissionNotFoundError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.USER_PERMISSION_NOT_FOUND,
      '用户未直授该权限',
      context,
      404,
    );
  }
}

export class FjnUserPermissionAlreadyGrantedError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.USER_PERMISSION_ALREADY_GRANTED,
      '用户已直授该权限（相同 effect + scope）',
      context,
      409,
    );
  }
}

export class FjnUserPermissionRevokedError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.USER_PERMISSION_REVOKED,
      'UserPermission 已撤销',
      context,
      410,
    );
  }
}

export class FjnUserPermissionExpiredError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.USER_PERMISSION_EXPIRED,
      'UserPermission 已过期',
      context,
      410,
    );
  }
}

export class FjnUserPermissionGrantorRequiredError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.USER_PERMISSION_GRANTOR_REQUIRED,
      '直授人 ID 必填',
      context,
      400,
    );
  }
}

export class FjnUserPermissionScopeInvalidError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.USER_PERMISSION_SCOPE_INVALID,
      'UserPermission 作用域非法',
      context,
      400,
    );
  }
}

export class FjnUserPermissionEffectInvalidError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.USER_PERMISSION_EFFECT_INVALID,
      'UserPermission effect 非法（grant | deny）',
      context,
      400,
    );
  }
}

// ---------- Policy 异常 ----------

export class FjnPolicyNotFoundError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.POLICY_NOT_FOUND,
      'AccessPolicy 不存在',
      context,
      404,
    );
  }
}

export class FjnPolicyAlreadyExistsError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.POLICY_ALREADY_EXISTS,
      'AccessPolicy 代码已存在',
      context,
      409,
    );
  }
}

export class FjnPolicyCodeInvalidError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.POLICY_CODE_INVALID,
      'Policy 代码格式非法',
      context,
      400,
    );
  }
}

export class FjnPolicyNameRequiredError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.POLICY_NAME_REQUIRED,
      'Policy 名称必填',
      context,
      400,
    );
  }
}

export class FjnPolicyStatusInvalidError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.POLICY_STATUS_INVALID,
      'Policy 状态非法',
      context,
      400,
    );
  }
}

export class FjnPolicyConditionsInvalidError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.POLICY_CONDITIONS_INVALID,
      'Policy 条件表达式非法（必须为非空 JSON 对象）',
      context,
      400,
    );
  }
}

export class FjnPolicyEffectInvalidError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.POLICY_EFFECT_INVALID,
      'Policy effect 非法（allow | deny）',
      context,
      400,
    );
  }
}

export class FjnPolicyActionsRequiredError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.POLICY_ACTIONS_REQUIRED,
      'Policy 必须至少包含一个 action',
      context,
      400,
    );
  }
}

export class FjnPolicySystemProtectedError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.POLICY_SYSTEM_PROTECTED,
      '系统内置 Policy 不可修改/删除',
      context,
      403,
    );
  }
}

export class FjnPolicyValidityInvalidError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.POLICY_VALIDITY_INVALID,
      'Policy 有效期非法（validFrom < validTo）',
      context,
      400,
    );
  }
}

// ---------- 评估与拒绝 ----------

export class FjnAccessDeniedError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ACCESS_DENIED,
      '访问被拒绝',
      context,
      403,
    );
  }
}

export class FjnEvaluationFailedError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.EVALUATION_FAILED,
      '访问评估失败',
      context,
      500,
    );
  }
}

export class FjnResourceNotSpecifiedError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.RESOURCE_NOT_SPECIFIED,
      '资源名必填',
      context,
      400,
    );
  }
}

export class FjnActionNotSpecifiedError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.ACTION_NOT_SPECIFIED,
      '操作必填',
      context,
      400,
    );
  }
}

export class FjnScopeNotAllowedError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.SCOPE_NOT_ALLOWED,
      '作用域不允许该操作',
      context,
      403,
    );
  }
}

export class FjnEffectInvalidError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.EFFECT_INVALID,
      '权限效果非法（grant | deny）',
      context,
      400,
    );
  }
}

// ---------- 系统异常 ----------

export class FjnPermissionInternalError extends FjnPermissionError {
  constructor(context?: FjnErrorContext) {
    super(
      PERMISSION_ERROR_CODES.INTERNAL,
      'Permission Service 内部错误',
      context,
      500,
    );
  }
}
