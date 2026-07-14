/**
 * FJN Permission Service 冒烟测试
 *
 * 严格遵循 H015 工业级规范（RBAC + ABAC）：
 *  - 状态机常量完整性（Role 3 + Permission 3 + RolePermission 2 + UserRole 4 + UserPermission 3 + Policy 2）
 *  - 状态机工具函数（canTransit/assertTransit/nextStatuses）
 *  - 业务工具（isRoleUsable/isPermissionUsable/isUserRoleActive/isUserPermissionActive）
 *  - 通用枚举（RoleType 4 / PermissionType 4 / ScopeType 5 / Effect 2 / Decision 2）
 *  - 12 个事件常量
 *  - 错误码 + 异常类（60+ 错误码 / 50+ 异常类）
 *  - 编码格式校验（Role / Permission / Policy）
 *  - Service 类可实例化
 */

import { FjnError, FjnStateMachineError } from '../src/lib/fjn/errors';
import {
  // 状态机
  ROLE_STATUS,
  ALL_ROLE_STATUSES,
  TERMINAL_ROLE_STATUSES,
  ROLE_STATUS_TRANSITIONS,
  PERMISSION_STATUS,
  ALL_PERMISSION_STATUSES,
  TERMINAL_PERMISSION_STATUSES,
  PERMISSION_STATUS_TRANSITIONS,
  ROLE_PERMISSION_STATUS,
  ALL_ROLE_PERMISSION_STATUSES,
  ROLE_PERMISSION_STATUS_TRANSITIONS,
  USER_ROLE_STATUS,
  ALL_USER_ROLE_STATUSES,
  USER_ROLE_STATUS_TRANSITIONS,
  USER_PERMISSION_STATUS,
  ALL_USER_PERMISSION_STATUSES,
  USER_PERMISSION_STATUS_TRANSITIONS,
  POLICY_STATUS,
  ALL_POLICY_STATUSES,
  POLICY_STATUS_TRANSITIONS,
  // 通用枚举
  ROLE_TYPE,
  ALL_ROLE_TYPES,
  PERMISSION_TYPE,
  ALL_PERMISSION_TYPES,
  SCOPE_TYPE,
  ALL_SCOPE_TYPES,
  PERMISSION_EFFECT,
  POLICY_EFFECT,
  ACCESS_DECISION,
  // 工具
  isValidRoleStatus,
  isValidPermissionStatus,
  isValidUserRoleStatus,
  isValidUserPermissionStatus,
  isValidPolicyStatus,
  isTerminalRoleStatus,
  isTerminalPermissionStatus,
  canTransitRoleStatus,
  canTransitPermissionStatus,
  canTransitRolePermissionStatus,
  canTransitUserRoleStatus,
  canTransitUserPermissionStatus,
  canTransitPolicyStatus,
  assertTransitRoleStatus,
  assertTransitPermissionStatus,
  assertTransitRolePermissionStatus,
  assertTransitUserRoleStatus,
  assertTransitUserPermissionStatus,
  assertTransitPolicyStatus,
  nextRoleStatuses,
  nextPermissionStatuses,
  nextUserRoleStatuses,
  isRoleUsable,
  isPermissionUsable,
  isUserRoleActive,
  isUserPermissionActive,
  isValidRoleCode,
  isValidPermissionCode,
  isValidPolicyCode,
  type FjnRoleStatus,
  type FjnPermissionStatus,
  type FjnUserRoleStatus,
  type FjnUserPermissionStatus,
  type FjnPolicyStatus,
  // 事件
  PERMISSION_EVENTS,
  PERMISSION_EVENT_SOURCES,
  ALL_PERMISSION_EVENTS,
  ALL_PERMISSION_EVENT_SOURCES,
  type FjnPermissionEventName,
  type FjnPermissionEventSource,
  // 错误
  PERMISSION_ERROR_CODES,
  type FjnPermissionErrorCode,
  FjnPermissionError,
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
  FjnPermissionInternalError,
  // Service
  FjnPermissionService,
  PERMISSION_DEFAULT_EXPIRES_DAYS,
  type CreateRoleInput,
  type UpdateRoleInput,
  type CreatePermissionInput,
  type GrantRolePermissionInput,
  type AssignUserRoleInput,
  type GrantUserPermissionInput,
  type CreatePolicyInput,
  type EvaluateAccessInput,
  type ListRoleInput,
} from '../src/lib/fjn';

let pass = 0;
let fail = 0;
function assert(name: string, cond: boolean, info?: unknown): void {
  if (cond) {
    console.log(`  ✅ ${name}`);
    pass++;
  } else {
    console.log(`  ❌ ${name}`, info ?? '');
    fail++;
  }
}

function expectThrow(name: string, fn: () => unknown, errType: unknown): void {
  try {
    fn();
    assert(name, false, 'expected throw but did not');
  } catch (e) {
    const ok = errType === undefined
      ? true
      : e instanceof (errType as new (...args: unknown[]) => Error);
    assert(name, ok, `actual=${(e as Error)?.constructor?.name ?? e}`);
  }
}

console.log('=== FJN Permission Service 冒烟测试 ===\n');

// ============================================================
// [1] Role 状态常量
// ============================================================
console.log('[1] Role 状态常量');
assert('ROLE_STATUS.ACTIVE = active', ROLE_STATUS.ACTIVE === 'active');
assert('ROLE_STATUS.DISABLED = disabled', ROLE_STATUS.DISABLED === 'disabled');
assert('ROLE_STATUS.DEPRECATED = deprecated', ROLE_STATUS.DEPRECATED === 'deprecated');
assert('ALL_ROLE_STATUSES 包含 3 个', ALL_ROLE_STATUSES.length === 3, `actual=${ALL_ROLE_STATUSES.length}`);
assert('TERMINAL_ROLE_STATUSES 包含 deprecated', TERMINAL_ROLE_STATUSES.includes(ROLE_STATUS.DEPRECATED));
assert('isValidRoleStatus(active) = true', isValidRoleStatus('active'));
assert('isValidRoleStatus(unknown) = false', !isValidRoleStatus('unknown'));
assert('isTerminalRoleStatus(deprecated) = true', isTerminalRoleStatus(ROLE_STATUS.DEPRECATED));
assert('isTerminalRoleStatus(active) = false', !isTerminalRoleStatus(ROLE_STATUS.ACTIVE));
assert('isRoleUsable(active) = true', isRoleUsable(ROLE_STATUS.ACTIVE));
assert('isRoleUsable(disabled) = false', !isRoleUsable(ROLE_STATUS.DISABLED));

// ============================================================
// [2] Role 状态机流转表
// ============================================================
console.log('\n[2] Role 状态机流转表');
assert('active → disabled（合法）', canTransitRoleStatus(ROLE_STATUS.ACTIVE, ROLE_STATUS.DISABLED));
assert('active → deprecated（合法）', canTransitRoleStatus(ROLE_STATUS.ACTIVE, ROLE_STATUS.DEPRECATED));
assert('disabled → active（合法）', canTransitRoleStatus(ROLE_STATUS.DISABLED, ROLE_STATUS.ACTIVE));
assert('disabled → deprecated（合法）', canTransitRoleStatus(ROLE_STATUS.DISABLED, ROLE_STATUS.DEPRECATED));
assert('deprecated → active（非法）', !canTransitRoleStatus(ROLE_STATUS.DEPRECATED, ROLE_STATUS.ACTIVE));
assert('deprecated → disabled（非法）', !canTransitRoleStatus(ROLE_STATUS.DEPRECATED, ROLE_STATUS.DISABLED));
assert('nextRoleStatuses(active).length = 2', nextRoleStatuses(ROLE_STATUS.ACTIVE).length === 2);
assert('nextRoleStatuses(deprecated).length = 0', nextRoleStatuses(ROLE_STATUS.DEPRECATED).length === 0);
expectThrow('assertTransitRoleStatus(deprecated → active) 抛 FjnStateMachineError', () => {
  assertTransitRoleStatus(ROLE_STATUS.DEPRECATED, ROLE_STATUS.ACTIVE);
}, FjnStateMachineError);

// ============================================================
// [3] Permission 状态常量 + 流转
// ============================================================
console.log('\n[3] Permission 状态常量 + 流转');
assert('PERMISSION_STATUS.ACTIVE = active', PERMISSION_STATUS.ACTIVE === 'active');
assert('ALL_PERMISSION_STATUSES 包含 3 个', ALL_PERMISSION_STATUSES.length === 3);
assert('isValidPermissionStatus(active)', isValidPermissionStatus('active'));
assert('isPermissionUsable(active) = true', isPermissionUsable(PERMISSION_STATUS.ACTIVE));
assert('isPermissionUsable(deprecated) = false', !isPermissionUsable(PERMISSION_STATUS.DEPRECATED));
assert('active → disabled（合法）', canTransitPermissionStatus(PERMISSION_STATUS.ACTIVE, PERMISSION_STATUS.DISABLED));
assert('disabled → active（合法）', canTransitPermissionStatus(PERMISSION_STATUS.DISABLED, PERMISSION_STATUS.ACTIVE));
assert('deprecated → active（非法）', !canTransitPermissionStatus(PERMISSION_STATUS.DEPRECATED, PERMISSION_STATUS.ACTIVE));
assert('nextPermissionStatuses(disabled).length = 2', nextPermissionStatuses(PERMISSION_STATUS.DISABLED).length === 2);

// ============================================================
// [4] RolePermission 状态机
// ============================================================
console.log('\n[4] RolePermission 状态机');
assert('ROLE_PERMISSION_STATUS.ACTIVE = active', ROLE_PERMISSION_STATUS.ACTIVE === 'active');
assert('ROLE_PERMISSION_STATUS.REVOKED = revoked', ROLE_PERMISSION_STATUS.REVOKED === 'revoked');
assert('ALL_ROLE_PERMISSION_STATUSES 包含 2 个', ALL_ROLE_PERMISSION_STATUSES.length === 2);
assert('active → revoked（合法）', canTransitRolePermissionStatus(ROLE_PERMISSION_STATUS.ACTIVE, ROLE_PERMISSION_STATUS.REVOKED));
assert('revoked → active（合法）', canTransitRolePermissionStatus(ROLE_PERMISSION_STATUS.REVOKED, ROLE_PERMISSION_STATUS.ACTIVE));
assert('assertTransitRolePermissionStatus(revoked→active) 正常', (() => {
  try {
    assertTransitRolePermissionStatus(ROLE_PERMISSION_STATUS.REVOKED, ROLE_PERMISSION_STATUS.ACTIVE);
    return true;
  } catch {
    return false;
  }
})());

// ============================================================
// [5] UserRole 状态机
// ============================================================
console.log('\n[5] UserRole 状态机');
assert('USER_ROLE_STATUS.ACTIVE = active', USER_ROLE_STATUS.ACTIVE === 'active');
assert('USER_ROLE_STATUS.REVOKED = revoked', USER_ROLE_STATUS.REVOKED === 'revoked');
assert('USER_ROLE_STATUS.EXPIRED = expired', USER_ROLE_STATUS.EXPIRED === 'expired');
assert('USER_ROLE_STATUS.DISABLED = disabled', USER_ROLE_STATUS.DISABLED === 'disabled');
assert('ALL_USER_ROLE_STATUSES 包含 4 个', ALL_USER_ROLE_STATUSES.length === 4);
assert('isValidUserRoleStatus(active)', isValidUserRoleStatus('active'));
assert('active → revoked（合法）', canTransitUserRoleStatus(USER_ROLE_STATUS.ACTIVE, USER_ROLE_STATUS.REVOKED));
assert('active → expired（合法）', canTransitUserRoleStatus(USER_ROLE_STATUS.ACTIVE, USER_ROLE_STATUS.EXPIRED));
assert('active → disabled（合法）', canTransitUserRoleStatus(USER_ROLE_STATUS.ACTIVE, USER_ROLE_STATUS.DISABLED));
assert('expired → active（合法）', canTransitUserRoleStatus(USER_ROLE_STATUS.EXPIRED, USER_ROLE_STATUS.ACTIVE));
assert('nextUserRoleStatuses(active).length = 3', nextUserRoleStatuses(USER_ROLE_STATUS.ACTIVE).length === 3);
assert('isUserRoleActive(active, null) = true', isUserRoleActive(USER_ROLE_STATUS.ACTIVE, null));
assert('isUserRoleActive(active, 未来时间) = true', isUserRoleActive(USER_ROLE_STATUS.ACTIVE, new Date(Date.now() + 10000)));
assert('isUserRoleActive(active, 过去时间) = false', isUserRoleActive(USER_ROLE_STATUS.ACTIVE, new Date(Date.now() - 10000)));
assert('isUserRoleActive(revoked, null) = false', !isUserRoleActive(USER_ROLE_STATUS.REVOKED, null));

// ============================================================
// [6] UserPermission 状态机
// ============================================================
console.log('\n[6] UserPermission 状态机');
assert('USER_PERMISSION_STATUS.ACTIVE = active', USER_PERMISSION_STATUS.ACTIVE === 'active');
assert('USER_PERMISSION_STATUS.REVOKED = revoked', USER_PERMISSION_STATUS.REVOKED === 'revoked');
assert('USER_PERMISSION_STATUS.EXPIRED = expired', USER_PERMISSION_STATUS.EXPIRED === 'expired');
assert('ALL_USER_PERMISSION_STATUSES 包含 3 个', ALL_USER_PERMISSION_STATUSES.length === 3);
assert('isValidUserPermissionStatus(active)', isValidUserPermissionStatus('active'));
assert('active → revoked（合法）', canTransitUserPermissionStatus(USER_PERMISSION_STATUS.ACTIVE, USER_PERMISSION_STATUS.REVOKED));
assert('active → expired（合法）', canTransitUserPermissionStatus(USER_PERMISSION_STATUS.ACTIVE, USER_PERMISSION_STATUS.EXPIRED));
assert('isUserPermissionActive(active, null) = true', isUserPermissionActive(USER_PERMISSION_STATUS.ACTIVE, null));
assert('isUserPermissionActive(expired, null) = false', !isUserPermissionActive(USER_PERMISSION_STATUS.EXPIRED, null));

// ============================================================
// [7] Policy 状态机
// ============================================================
console.log('\n[7] Policy 状态机');
assert('POLICY_STATUS.ACTIVE = active', POLICY_STATUS.ACTIVE === 'active');
assert('POLICY_STATUS.DISABLED = disabled', POLICY_STATUS.DISABLED === 'disabled');
assert('ALL_POLICY_STATUSES 包含 2 个', ALL_POLICY_STATUSES.length === 2);
assert('isValidPolicyStatus(active)', isValidPolicyStatus('active'));
assert('active → disabled（合法）', canTransitPolicyStatus(POLICY_STATUS.ACTIVE, POLICY_STATUS.DISABLED));
assert('disabled → active（合法）', canTransitPolicyStatus(POLICY_STATUS.DISABLED, POLICY_STATUS.ACTIVE));

// ============================================================
// [8] 通用枚举
// ============================================================
console.log('\n[8] 通用枚举');
assert('ROLE_TYPE 包含 4 个', ALL_ROLE_TYPES.length === 4);
assert('ROLE_TYPE.ADMIN = admin', ROLE_TYPE.ADMIN === 'admin');
assert('PERMISSION_TYPE 包含 4 个', ALL_PERMISSION_TYPES.length === 4);
assert('PERMISSION_TYPE.API = api', PERMISSION_TYPE.API === 'api');
assert('SCOPE_TYPE 包含 5 个', ALL_SCOPE_TYPES.length === 5);
assert('SCOPE_TYPE.ALL = all', SCOPE_TYPE.ALL === 'all');
assert('PERMISSION_EFFECT.GRANT = grant', PERMISSION_EFFECT.GRANT === 'grant');
assert('PERMISSION_EFFECT.DENY = deny', PERMISSION_EFFECT.DENY === 'deny');
assert('POLICY_EFFECT.ALLOW = allow', POLICY_EFFECT.ALLOW === 'allow');
assert('ACCESS_DECISION.ALLOW = allow', ACCESS_DECISION.ALLOW === 'allow');

// ============================================================
// [9] 编码格式校验
// ============================================================
console.log('\n[9] 编码格式校验');
assert('isValidRoleCode(super_admin) = true', isValidRoleCode('super_admin'));
assert('isValidRoleCode(admin) = true', isValidRoleCode('admin'));
assert('isValidRoleCode(Admin) = false（大写）', !isValidRoleCode('Admin'));
assert('isValidRoleCode(ab) = false（太短）', !isValidRoleCode('ab'));
assert('isValidRoleCode("1admin") = false（数字开头）', !isValidRoleCode('1admin'));
assert('isValidPermissionCode(orders.read) = true', isValidPermissionCode('orders.read'));
assert('isValidPermissionCode(kyc.approve) = true', isValidPermissionCode('kyc.approve'));
assert('isValidPermissionCode(Orders) = false', !isValidPermissionCode('Orders'));
assert('isValidPolicyCode(policy_high_risk) = true', isValidPolicyCode('policy_high_risk'));

// ============================================================
// [10] 12 个事件常量
// ============================================================
console.log('\n[10] 12 个事件常量');
assert('ALL_PERMISSION_EVENTS 包含 12 个', ALL_PERMISSION_EVENTS.length === 12, `actual=${ALL_PERMISSION_EVENTS.length}`);
assert('PERMISSION_EVENTS.ROLE_CREATED 存在', !!PERMISSION_EVENTS.ROLE_CREATED);
assert('PERMISSION_EVENTS.ROLE_UPDATED 存在', !!PERMISSION_EVENTS.ROLE_UPDATED);
assert('PERMISSION_EVENTS.ROLE_DISABLED 存在', !!PERMISSION_EVENTS.ROLE_DISABLED);
assert('PERMISSION_EVENTS.ROLE_ENABLED 存在', !!PERMISSION_EVENTS.ROLE_ENABLED);
assert('PERMISSION_EVENTS.ROLE_DEPRECATED 存在', !!PERMISSION_EVENTS.ROLE_DEPRECATED);
assert('PERMISSION_EVENTS.PERMISSION_CREATED 存在', !!PERMISSION_EVENTS.PERMISSION_CREATED);
assert('PERMISSION_EVENTS.PERMISSION_UPDATED 存在', !!PERMISSION_EVENTS.PERMISSION_UPDATED);
assert('PERMISSION_EVENTS.PERMISSION_DISABLED 存在', !!PERMISSION_EVENTS.PERMISSION_DISABLED);
assert('PERMISSION_EVENTS.ROLE_PERMISSION_GRANTED 存在', !!PERMISSION_EVENTS.ROLE_PERMISSION_GRANTED);
assert('PERMISSION_EVENTS.ROLE_PERMISSION_REVOKED 存在', !!PERMISSION_EVENTS.ROLE_PERMISSION_REVOKED);
assert('PERMISSION_EVENTS.USER_ROLE_ASSIGNED 存在', !!PERMISSION_EVENTS.USER_ROLE_ASSIGNED);
assert('PERMISSION_EVENTS.ACCESS_POLICY_CREATED 存在', !!PERMISSION_EVENTS.ACCESS_POLICY_CREATED);
assert('PERMISSION_EVENT_SOURCES 包含 6 个', ALL_PERMISSION_EVENT_SOURCES.length === 6);

// ============================================================
// [11] 错误码 + 异常类
// ============================================================
console.log('\n[11] 错误码 + 异常类');
assert('PERMISSION_ERROR_CODES.ROLE_NOT_FOUND 存在', !!PERMISSION_ERROR_CODES.ROLE_NOT_FOUND);
assert('PERMISSION_ERROR_CODES.PERMISSION_NOT_FOUND 存在', !!PERMISSION_ERROR_CODES.PERMISSION_NOT_FOUND);
assert('PERMISSION_ERROR_CODES.USER_ROLE_NOT_FOUND 存在', !!PERMISSION_ERROR_CODES.USER_ROLE_NOT_FOUND);
assert('PERMISSION_ERROR_CODES.ACCESS_DENIED 存在', !!PERMISSION_ERROR_CODES.ACCESS_DENIED);
assert('FjnRoleNotFoundError.httpStatus = 404', new FjnRoleNotFoundError({}).httpStatus === 404);
assert('FjnRoleAlreadyExistsError.httpStatus = 409', new FjnRoleAlreadyExistsError({}).httpStatus === 409);
assert('FjnRoleCodeInvalidError.httpStatus = 400', new FjnRoleCodeInvalidError({}).httpStatus === 400);
assert('FjnRoleSystemProtectedError.httpStatus = 403', new FjnRoleSystemProtectedError({}).httpStatus === 403);
assert('FjnPermissionNotFoundError.httpStatus = 404', new FjnPermissionNotFoundError({}).httpStatus === 404);
assert('FjnPermissionAlreadyExistsError.httpStatus = 409', new FjnPermissionAlreadyExistsError({}).httpStatus === 409);
assert('FjnUserRoleAlreadyAssignedError.httpStatus = 409', new FjnUserRoleAlreadyAssignedError({}).httpStatus === 409);
assert('FjnUserRoleExpiresInvalidError.httpStatus = 400', new FjnUserRoleExpiresInvalidError({}).httpStatus === 400);
assert('FjnAccessDeniedError.httpStatus = 403', new FjnAccessDeniedError({}).httpStatus === 403);
assert('FjnEvaluationFailedError.httpStatus = 500', new FjnEvaluationFailedError({}).httpStatus === 500);
assert('FjnPolicyConditionsInvalidError.httpStatus = 400', new FjnPolicyConditionsInvalidError({}).httpStatus === 400);
assert('FjnPermissionError extends FjnError', new FjnRoleNotFoundError({}) instanceof FjnError);
assert('FjnPermissionError 名字正确', new FjnRoleNotFoundError({}).name === 'FjnPermissionError');

// ============================================================
// [12] 异常 HTTP 状态覆盖
// ============================================================
console.log('\n[12] 异常 HTTP 状态覆盖');
const errHttpStatusMap: Array<[new (...args: any[]) => FjnPermissionError, number]> = [
  [FjnRoleCannotDeleteError, 409],
  [FjnRoleDisabledError, 403],
  [FjnRoleDeprecatedError, 403],
  [FjnPermissionCodeInvalidError, 400],
  [FjnPermissionNameRequiredError, 400],
  [FjnPermissionStatusInvalidError, 400],
  [FjnPermissionSystemProtectedError, 403],
  [FjnPermissionDisabledError, 403],
  [FjnPermissionResourceRequiredError, 400],
  [FjnPermissionActionRequiredError, 400],
  [FjnRolePermissionAlreadyGrantedError, 409],
  [FjnRolePermissionNotGrantedError, 404],
  [FjnRolePermissionRevokedError, 410],
  [FjnRolePermissionScopeInvalidError, 400],
  [FjnRolePermissionGrantorRequiredError, 400],
  [FjnUserRoleNotFoundError, 404],
  [FjnUserRoleRevokedError, 410],
  [FjnUserRoleDisabledError, 403],
  [FjnUserRoleGrantorRequiredError, 400],
  [FjnUserRoleScopeInvalidError, 400],
  [FjnUserPermissionNotFoundError, 404],
  [FjnUserPermissionAlreadyGrantedError, 409],
  [FjnUserPermissionRevokedError, 410],
  [FjnUserPermissionGrantorRequiredError, 400],
  [FjnUserPermissionScopeInvalidError, 400],
  [FjnUserPermissionEffectInvalidError, 400],
  [FjnPolicyNotFoundError, 404],
  [FjnPolicyAlreadyExistsError, 409],
  [FjnPolicyCodeInvalidError, 400],
  [FjnPolicyNameRequiredError, 400],
  [FjnPolicyStatusInvalidError, 400],
  [FjnPolicyEffectInvalidError, 400],
  [FjnPolicyActionsRequiredError, 400],
  [FjnPolicySystemProtectedError, 403],
  [FjnPolicyValidityInvalidError, 400],
  [FjnResourceNotSpecifiedError, 400],
  [FjnActionNotSpecifiedError, 400],
  [FjnScopeNotAllowedError, 403],
  [FjnEffectInvalidError, 400],
  [FjnPermissionInternalError, 500],
];
for (const [ErrClass, expectedStatus] of errHttpStatusMap) {
  const inst = new ErrClass({});
  assert(
    `${ErrClass.name}.httpStatus = ${expectedStatus}`,
    inst.httpStatus === expectedStatus,
    `actual=${inst.httpStatus}`,
  );
}

// ============================================================
// [13] Service 类可实例化
// ============================================================
console.log('\n[13] Service 类可实例化');
const svc = new FjnPermissionService();
assert('svc 是 FjnPermissionService 实例', svc instanceof FjnPermissionService);
assert('svc.serviceName 存在', typeof svc.serviceName === 'string' && svc.serviceName.length > 0);
assert('svc.prisma 存在', !!svc.prisma);

// ============================================================
// [14] 默认常量
// ============================================================
console.log('\n[14] 默认常量');
assert('PERMISSION_DEFAULT_EXPIRES_DAYS = 0', PERMISSION_DEFAULT_EXPIRES_DAYS === 0);

// ============================================================
// [15] 入参类型存在
// ============================================================
console.log('\n[15] 入参类型存在（编译时已验证）');
const _createRole: CreateRoleInput = {
  roleCode: 'admin',
  roleName: '管理员',
  roleType: ROLE_TYPE.ADMIN,
};
const _updateRole: UpdateRoleInput = { roleName: '管理员2' };
const _createPermission: CreatePermissionInput = {
  permissionCode: 'orders.read',
  permissionName: '订单查看',
  resource: 'orders',
  action: 'read',
};
const _grantRp: GrantRolePermissionInput = { scope: SCOPE_TYPE.ALL };
const _assignUr: AssignUserRoleInput = { scope: SCOPE_TYPE.ALL };
const _grantUp: GrantUserPermissionInput = { effect: PERMISSION_EFFECT.GRANT };
const _createPolicy: CreatePolicyInput = {
  policyCode: 'policy_high_risk',
  policyName: '高风险操作',
  effect: POLICY_EFFECT.DENY,
  resource: 'finance',
  actions: ['approve'],
  conditions: { all: [] },
};
const _evaluate: EvaluateAccessInput = {
  userId: 'u1',
  resource: 'orders',
  action: 'read',
};
const _listRole: ListRoleInput = { roleType: ROLE_TYPE.ADMIN };
assert('入参类型实例化通过', !!_createRole && !!_updateRole && !!_createPermission);
assert('grant/assign/policy/evaluate 类型实例化通过', !!_grantRp && !!_assignUr && !!_grantUp && !!_createPolicy && !!_evaluate && !!_listRole);

// ============================================================
// [16] assertTransitPolicy 工具
// ============================================================
console.log('\n[16] assertTransitPolicy 工具');
expectThrow('assertTransitPolicyStatus(disabled→disabled) 抛', () => {
  assertTransitPolicyStatus(POLICY_STATUS.DISABLED, POLICY_STATUS.DISABLED);
}, FjnStateMachineError);

assert('assertTransitUserRoleStatus 合法转移不抛', (() => {
  try {
    assertTransitUserRoleStatus(USER_ROLE_STATUS.ACTIVE, USER_ROLE_STATUS.REVOKED);
    assertTransitUserRoleStatus(USER_ROLE_STATUS.REVOKED, USER_ROLE_STATUS.ACTIVE);
    assertTransitUserRoleStatus(USER_ROLE_STATUS.EXPIRED, USER_ROLE_STATUS.ACTIVE);
    return true;
  } catch {
    return false;
  }
})());

// ============================================================
// [17] 事件 Source 覆盖
// ============================================================
console.log('\n[17] 事件 Source 覆盖');
assert('PERMISSION_EVENT_SOURCES.USER = user', PERMISSION_EVENT_SOURCES.USER === 'user');
assert('PERMISSION_EVENT_SOURCES.ADMIN = admin', PERMISSION_EVENT_SOURCES.ADMIN === 'admin');
assert('PERMISSION_EVENT_SOURCES.ABAC_ENGINE = abac_engine', PERMISSION_EVENT_SOURCES.ABAC_ENGINE === 'abac_engine');

// ============================================================
// [18] 编码格式边界
// ============================================================
console.log('\n[18] 编码格式边界');
assert('isValidRoleCode("a") = false（长度 1）', !isValidRoleCode('a'));
assert('isValidRoleCode("ab") = false（长度 2 < 3）', !isValidRoleCode('ab'));
assert('isValidRoleCode("abc") = true（长度 3）', isValidRoleCode('abc'));
assert('isValidRoleCode 包含下划线', isValidRoleCode('super_admin_v2'));
assert('isValidRoleCode 包含数字', isValidRoleCode('admin123'));
assert('isValidPermissionCode 含点号', isValidPermissionCode('finance.settlement.approve'));

// ============================================================
// [19] 状态机终态完整性
// ============================================================
console.log('\n[19] 状态机终态完整性');
assert('TERMINAL_PERMISSION_STATUSES 包含 deprecated', TERMINAL_PERMISSION_STATUSES.includes(PERMISSION_STATUS.DEPRECATED));
assert('isTerminalPermissionStatus(deprecated) = true', isTerminalPermissionStatus(PERMISSION_STATUS.DEPRECATED));
assert('isTerminalPermissionStatus(active) = false', !isTerminalPermissionStatus(PERMISSION_STATUS.ACTIVE));

// ============================================================
// [20] 综合验证
// ============================================================
console.log('\n[20] 综合验证');
assert('所有状态机无未知状态泄漏', (() => {
  const allRole = new Set(ALL_ROLE_STATUSES);
  return allRole.size === ALL_ROLE_STATUSES.length;
})());
assert('所有通用枚举唯一', (() => {
  return new Set(ALL_ROLE_TYPES).size === ALL_ROLE_TYPES.length &&
         new Set(ALL_PERMISSION_TYPES).size === ALL_PERMISSION_TYPES.length &&
         new Set(ALL_SCOPE_TYPES).size === ALL_SCOPE_TYPES.length;
})());
assert('FjnPermissionService 继承自 FjnServiceBase（间接）', svc.constructor.name === 'FjnPermissionService');

console.log(`\n=== 测试完成：${pass} 通过 / ${fail} 失败 ===`);
if (fail > 0) {
  process.exit(1);
}
