/**
 * FJN Team Service 冒烟测试
 *
 * 验证内容：
 *  - 团队奖励状态机：10 个状态、合法/非法转移
 *  - 团队结构状态机：3 个状态
 *  - 团队服务记录状态机：3 个状态
 *  - 5/3/2 团队奖励规则
 *  - 事件常量命名规范
 *  - 错误码 + 异常类
 *  - 工具函数：isTerminal / canTransit / isLockable / isApprovable / isPayable / isRecoverable
 *
 * 说明：
 *  - 本测试只覆盖纯逻辑部分（不依赖数据库）
 *  - 数据库相关方法（createReward / approve / lock / submitServiceRecord 等）需在真实 DB 环境下测试
 */

import {
  TEAM_REWARD_STATUS,
  TEAM_REWARD_STATUS_TRANSITIONS,
  ALL_TEAM_REWARD_STATUSES,
  TERMINAL_TEAM_REWARD_STATUSES,
  TEAM_STRUCTURE_STATUS,
  TEAM_STRUCTURE_STATUS_TRANSITIONS,
  ALL_TEAM_STRUCTURE_STATUSES,
  TEAM_SERVICE_RECORD_STATUS,
  TEAM_SERVICE_RECORD_STATUS_TRANSITIONS,
  ALL_TEAM_SERVICE_RECORD_STATUSES,
  TERMINAL_TEAM_SERVICE_RECORD_STATUSES,
  TEAM_REWARD_RATES,
  TEAM_LEVEL_RATES,
  TEAM_LEVEL_FIELD,
  TEAM_SERVICE_TYPES,
  canTransitTeamRewardStatus,
  assertTransitTeamRewardStatus,
  canTransitTeamStructureStatus,
  assertTransitTeamStructureStatus,
  canTransitTeamServiceRecordStatus,
  assertTransitTeamServiceRecordStatus,
  nextTeamRewardStatuses,
  nextTeamStructureStatuses,
  nextTeamServiceRecordStatuses,
  isTerminalTeamRewardStatus,
  isWaitingServiceRecord,
  isLockable,
  isApprovableReward,
  isPayableReward,
  isPayableNow,
  isRecoverable,
  isCancellableReward,
  isServiceRecordApprovable,
  TEAM_EVENTS,
  TEAM_EVENT_SOURCES,
  ALL_TEAM_EVENTS,
  TEAM_EVENT_COUNT,
  isValidTeamEvent,
  isValidTeamEventSource,
  TEAM_ERROR_CODES,
  FjnTeamError,
  FjnTeamStructureNotFoundError,
  FjnTeamStructureAlreadyExistsError,
  FjnTeamStructureInvalidError,
  FjnTeamStructureLoopNotAllowedError,
  FjnTeamStructureSuspendedError,
  FjnTeamStructureInactiveError,
  FjnTeamServiceRecordNotFoundError,
  FjnTeamServiceRecordInvalidError,
  FjnTeamServiceRecordTypeInvalidError,
  FjnTeamServiceRecordDurationInvalidError,
  FjnTeamRewardNotFoundError,
  FjnTeamRewardAlreadyExistsError,
  FjnTeamRewardStatusInvalidError,
  FjnTeamRewardTerminalStatusError,
  FjnTeamRewardAmountInvalidError,
  FjnTeamRewardAmountZeroError,
  FjnTeamRewardRateInvalidError,
  FjnTeamRewardLevelInvalidError,
  FjnTeamRewardNotLockableError,
  FjnTeamRewardNotApprovableError,
  FjnTeamRewardNotPayableError,
  FjnTeamRewardNotRecoverableError,
  FjnTeamRewardNotCancellableError,
  FjnTeamRewardServiceRecordRequiredError,
  FjnTeamRewardServiceRecordNotApprovedError,
  FjnTeamRewardNoUplineError,
  FjnTeamOrderNotFoundError,
  FjnTeamOrderNotPaidError,
  FjnTeamKycNotVerifiedError,
  FjnTeamRiskHoldError,
  FjnTeamReviewerRequiredError,
  FjnTeamReasonRequiredError,
  isFjnTeamErrorCode,
  getTeamErrorCodeCount,
  FjnTeamService,
  createFjnTeamService,
} from '../src/lib/fjn';

let pass = 0, fail = 0;
function assert(name: string, cond: boolean, info?: any) {
  if (cond) { console.log(`  ✅ ${name}`); pass++; }
  else { console.log(`  ❌ ${name}`, info ?? ''); fail++; }
}

console.log('=== FJN Team Service 冒烟测试 ===\n');

// ============================================================
// [1] 团队奖励状态常量
// ============================================================
console.log('[1] 团队奖励状态常量');
assert('TEAM_REWARD_STATUS 包含 10 个状态', Object.keys(TEAM_REWARD_STATUS).length === 10, Object.keys(TEAM_REWARD_STATUS).length);
assert('CREATED = created', TEAM_REWARD_STATUS.CREATED === 'created');
assert('WAITING_SERVICE_RECORD = waiting_service_record', TEAM_REWARD_STATUS.WAITING_SERVICE_RECORD === 'waiting_service_record');
assert('LOCKED = locked', TEAM_REWARD_STATUS.LOCKED === 'locked');
assert('RISK_CHECKING = risk_checking', TEAM_REWARD_STATUS.RISK_CHECKING === 'risk_checking');
assert('APPROVED = approved', TEAM_REWARD_STATUS.APPROVED === 'approved');
assert('PAYABLE = payable', TEAM_REWARD_STATUS.PAYABLE === 'payable');
assert('PAID = paid', TEAM_REWARD_STATUS.PAID === 'paid');
assert('RECOVERED = recovered', TEAM_REWARD_STATUS.RECOVERED === 'recovered');
assert('CANCELLED = cancelled', TEAM_REWARD_STATUS.CANCELLED === 'cancelled');
assert('RISK_HOLD = risk_hold', TEAM_REWARD_STATUS.RISK_HOLD === 'risk_hold');
assert('ALL_TEAM_REWARD_STATUSES 包含 10 个', ALL_TEAM_REWARD_STATUSES.length === 10);
assert('TERMINAL_TEAM_REWARD_STATUSES 包含 3 个', TERMINAL_TEAM_REWARD_STATUSES.length === 3);

console.log('\n[2] 团队结构状态常量');
assert('TEAM_STRUCTURE_STATUS 包含 3 个', Object.keys(TEAM_STRUCTURE_STATUS).length === 3);
assert('ACTIVE = active', TEAM_STRUCTURE_STATUS.ACTIVE === 'active');
assert('INACTIVE = inactive', TEAM_STRUCTURE_STATUS.INACTIVE === 'inactive');
assert('SUSPENDED = suspended', TEAM_STRUCTURE_STATUS.SUSPENDED === 'suspended');

console.log('\n[3] 服务记录状态常量');
assert('TEAM_SERVICE_RECORD_STATUS 包含 3 个', Object.keys(TEAM_SERVICE_RECORD_STATUS).length === 3);
assert('PENDING = pending', TEAM_SERVICE_RECORD_STATUS.PENDING === 'pending');
assert('APPROVED = approved', TEAM_SERVICE_RECORD_STATUS.APPROVED === 'approved');
assert('REJECTED = rejected', TEAM_SERVICE_RECORD_STATUS.REJECTED === 'rejected');
assert('TERMINAL_TEAM_SERVICE_RECORD_STATUSES 包含 2 个', TERMINAL_TEAM_SERVICE_RECORD_STATUSES.length === 2);

// ============================================================
// [4] 5/3/2 团队奖励规则
// ============================================================
console.log('\n[4] 5/3/2 团队奖励规则');
assert('L1 = 0.05', TEAM_REWARD_RATES.LEVEL_1 === '0.05');
assert('L2 = 0.03', TEAM_REWARD_RATES.LEVEL_2 === '0.03');
assert('L3 = 0.02', TEAM_REWARD_RATES.LEVEL_3 === '0.02');
assert('TEAM_LEVEL_RATES[1] = 0.05', TEAM_LEVEL_RATES[1] === '0.05');
assert('TEAM_LEVEL_RATES[2] = 0.03', TEAM_LEVEL_RATES[2] === '0.03');
assert('TEAM_LEVEL_RATES[3] = 0.02', TEAM_LEVEL_RATES[3] === '0.02');
assert('TEAM_LEVEL_FIELD[1] = uplineLevel1', TEAM_LEVEL_FIELD[1] === 'uplineLevel1');
assert('TEAM_LEVEL_FIELD[2] = uplineLevel2', TEAM_LEVEL_FIELD[2] === 'uplineLevel2');
assert('TEAM_LEVEL_FIELD[3] = uplineLevel3', TEAM_LEVEL_FIELD[3] === 'uplineLevel3');

// ============================================================
// [5] 团队奖励状态机 - 合法转移
// ============================================================
console.log('\n[5] 团队奖励状态机 - 合法转移');
assert('created -> waiting_service_record 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.CREATED, TEAM_REWARD_STATUS.WAITING_SERVICE_RECORD));
assert('created -> cancelled 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.CREATED, TEAM_REWARD_STATUS.CANCELLED));
assert('waiting_service_record -> locked 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.WAITING_SERVICE_RECORD, TEAM_REWARD_STATUS.LOCKED));
assert('waiting_service_record -> risk_checking 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.WAITING_SERVICE_RECORD, TEAM_REWARD_STATUS.RISK_CHECKING));
assert('waiting_service_record -> cancelled 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.WAITING_SERVICE_RECORD, TEAM_REWARD_STATUS.CANCELLED));
assert('locked -> risk_checking 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.LOCKED, TEAM_REWARD_STATUS.RISK_CHECKING));
assert('locked -> approved 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.LOCKED, TEAM_REWARD_STATUS.APPROVED));
assert('risk_checking -> approved 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.RISK_CHECKING, TEAM_REWARD_STATUS.APPROVED));
assert('risk_checking -> payable 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.RISK_CHECKING, TEAM_REWARD_STATUS.PAYABLE));
assert('risk_checking -> risk_hold 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.RISK_CHECKING, TEAM_REWARD_STATUS.RISK_HOLD));
assert('approved -> payable 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.APPROVED, TEAM_REWARD_STATUS.PAYABLE));
assert('approved -> recovered 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.APPROVED, TEAM_REWARD_STATUS.RECOVERED));
assert('payable -> paid 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.PAYABLE, TEAM_REWARD_STATUS.PAID));
assert('payable -> recovered 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.PAYABLE, TEAM_REWARD_STATUS.RECOVERED));
assert('paid -> recovered 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.PAID, TEAM_REWARD_STATUS.RECOVERED));
assert('risk_hold -> approved 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.RISK_HOLD, TEAM_REWARD_STATUS.APPROVED));
assert('risk_hold -> cancelled 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.RISK_HOLD, TEAM_REWARD_STATUS.CANCELLED));
assert('risk_hold -> recovered 合法', canTransitTeamRewardStatus(TEAM_REWARD_STATUS.RISK_HOLD, TEAM_REWARD_STATUS.RECOVERED));

// ============================================================
// [6] 团队奖励状态机 - 非法转移
// ============================================================
console.log('\n[6] 团队奖励状态机 - 非法转移');
assert('created -> paid 非法', !canTransitTeamRewardStatus(TEAM_REWARD_STATUS.CREATED, TEAM_REWARD_STATUS.PAID));
assert('created -> approved 非法', !canTransitTeamRewardStatus(TEAM_REWARD_STATUS.CREATED, TEAM_REWARD_STATUS.APPROVED));
assert('created -> locked 非法（必须先 waiting_service_record）', !canTransitTeamRewardStatus(TEAM_REWARD_STATUS.CREATED, TEAM_REWARD_STATUS.LOCKED));
assert('waiting_service_record -> paid 非法', !canTransitTeamRewardStatus(TEAM_REWARD_STATUS.WAITING_SERVICE_RECORD, TEAM_REWARD_STATUS.PAID));
assert('locked -> payable 非法（必须先 approved）', !canTransitTeamRewardStatus(TEAM_REWARD_STATUS.LOCKED, TEAM_REWARD_STATUS.PAYABLE));
assert('approved -> locked 非法（不可回退）', !canTransitTeamRewardStatus(TEAM_REWARD_STATUS.APPROVED, TEAM_REWARD_STATUS.LOCKED));
assert('paid -> payable 非法（paid 后只能 recovered）', !canTransitTeamRewardStatus(TEAM_REWARD_STATUS.PAID, TEAM_REWARD_STATUS.PAYABLE));
assert('paid -> approved 非法（不可回退）', !canTransitTeamRewardStatus(TEAM_REWARD_STATUS.PAID, TEAM_REWARD_STATUS.APPROVED));
assert('recovered -> anything 非法（终态）', !canTransitTeamRewardStatus(TEAM_REWARD_STATUS.RECOVERED, TEAM_REWARD_STATUS.PAID));
assert('cancelled -> anything 非法（终态）', !canTransitTeamRewardStatus(TEAM_REWARD_STATUS.CANCELLED, TEAM_REWARD_STATUS.APPROVED));

// ============================================================
// [7] 团队结构状态机
// ============================================================
console.log('\n[7] 团队结构状态机');
assert('active -> inactive 合法', canTransitTeamStructureStatus(TEAM_STRUCTURE_STATUS.ACTIVE, TEAM_STRUCTURE_STATUS.INACTIVE));
assert('active -> suspended 合法', canTransitTeamStructureStatus(TEAM_STRUCTURE_STATUS.ACTIVE, TEAM_STRUCTURE_STATUS.SUSPENDED));
assert('inactive -> active 合法', canTransitTeamStructureStatus(TEAM_STRUCTURE_STATUS.INACTIVE, TEAM_STRUCTURE_STATUS.ACTIVE));
assert('suspended -> active 合法', canTransitTeamStructureStatus(TEAM_STRUCTURE_STATUS.SUSPENDED, TEAM_STRUCTURE_STATUS.ACTIVE));
assert('suspended -> inactive 合法', canTransitTeamStructureStatus(TEAM_STRUCTURE_STATUS.SUSPENDED, TEAM_STRUCTURE_STATUS.INACTIVE));
assert('inactive -> suspended 合法', canTransitTeamStructureStatus(TEAM_STRUCTURE_STATUS.INACTIVE, TEAM_STRUCTURE_STATUS.SUSPENDED));

// ============================================================
// [8] 团队服务记录状态机
// ============================================================
console.log('\n[8] 团队服务记录状态机');
assert('pending -> approved 合法', canTransitTeamServiceRecordStatus(TEAM_SERVICE_RECORD_STATUS.PENDING, TEAM_SERVICE_RECORD_STATUS.APPROVED));
assert('pending -> rejected 合法', canTransitTeamServiceRecordStatus(TEAM_SERVICE_RECORD_STATUS.PENDING, TEAM_SERVICE_RECORD_STATUS.REJECTED));
assert('approved -> rejected 非法（终态）', !canTransitTeamServiceRecordStatus(TEAM_SERVICE_RECORD_STATUS.APPROVED, TEAM_SERVICE_RECORD_STATUS.REJECTED));
assert('rejected -> approved 非法（终态）', !canTransitTeamServiceRecordStatus(TEAM_SERVICE_RECORD_STATUS.REJECTED, TEAM_SERVICE_RECORD_STATUS.APPROVED));
assert('approved -> pending 非法（不可回退）', !canTransitTeamServiceRecordStatus(TEAM_SERVICE_RECORD_STATUS.APPROVED, TEAM_SERVICE_RECORD_STATUS.PENDING));

// ============================================================
// [9] 强制转移
// ============================================================
console.log('\n[9] 状态机 - 强制转移');
try {
  assertTransitTeamRewardStatus(TEAM_REWARD_STATUS.CREATED, TEAM_REWARD_STATUS.WAITING_SERVICE_RECORD);
  assert('合法转移不抛错', true);
} catch (e) {
  assert('合法转移不抛错', false, e);
}
try {
  assertTransitTeamRewardStatus(TEAM_REWARD_STATUS.CREATED, TEAM_REWARD_STATUS.PAID);
  assert('非法转移应该抛错', false);
} catch (e: any) {
  assert('非法转移抛 FjnStateMachineError', e.code === 'FJN_STATE_MACHINE');
}
try {
  assertTransitTeamStructureStatus(TEAM_STRUCTURE_STATUS.ACTIVE, TEAM_STRUCTURE_STATUS.INACTIVE);
  assert('团队结构合法转移不抛错', true);
} catch (e) {
  assert('团队结构合法转移不抛错', false, e);
}
try {
  assertTransitTeamServiceRecordStatus(TEAM_SERVICE_RECORD_STATUS.PENDING, TEAM_SERVICE_RECORD_STATUS.APPROVED);
  assert('服务记录合法转移不抛错', true);
} catch (e) {
  assert('服务记录合法转移不抛错', false, e);
}

// ============================================================
// [10] 工具函数
// ============================================================
console.log('\n[10] 状态机 - 工具函数');
assert('isTerminalTeamRewardStatus(paid) = true', isTerminalTeamRewardStatus(TEAM_REWARD_STATUS.PAID));
assert('isTerminalTeamRewardStatus(recovered) = true', isTerminalTeamRewardStatus(TEAM_REWARD_STATUS.RECOVERED));
assert('isTerminalTeamRewardStatus(cancelled) = true', isTerminalTeamRewardStatus(TEAM_REWARD_STATUS.CANCELLED));
assert('isTerminalTeamRewardStatus(approved) = false', !isTerminalTeamRewardStatus(TEAM_REWARD_STATUS.APPROVED));
assert('isTerminalTeamRewardStatus(created) = false', !isTerminalTeamRewardStatus(TEAM_REWARD_STATUS.CREATED));

assert('isWaitingServiceRecord(waiting_service_record) = true', isWaitingServiceRecord(TEAM_REWARD_STATUS.WAITING_SERVICE_RECORD));
assert('isWaitingServiceRecord(locked) = false', !isWaitingServiceRecord(TEAM_REWARD_STATUS.LOCKED));

assert('isLockable(created) = true', isLockable(TEAM_REWARD_STATUS.CREATED));
assert('isLockable(waiting_service_record) = true', isLockable(TEAM_REWARD_STATUS.WAITING_SERVICE_RECORD));
assert('isLockable(locked) = false', !isLockable(TEAM_REWARD_STATUS.LOCKED));
assert('isLockable(approved) = false', !isLockable(TEAM_REWARD_STATUS.APPROVED));

assert('isApprovableReward(locked) = true', isApprovableReward(TEAM_REWARD_STATUS.LOCKED));
assert('isApprovableReward(risk_checking) = true', isApprovableReward(TEAM_REWARD_STATUS.RISK_CHECKING));
assert('isApprovableReward(approved) = false', !isApprovableReward(TEAM_REWARD_STATUS.APPROVED));

assert('isPayableReward(approved) = true', isPayableReward(TEAM_REWARD_STATUS.APPROVED));
assert('isPayableReward(risk_checking) = true', isPayableReward(TEAM_REWARD_STATUS.RISK_CHECKING));
assert('isPayableReward(locked) = false', !isPayableReward(TEAM_REWARD_STATUS.LOCKED));

assert('isPayableNow(payable) = true', isPayableNow(TEAM_REWARD_STATUS.PAYABLE));
assert('isPayableNow(approved) = false', !isPayableNow(TEAM_REWARD_STATUS.APPROVED));

assert('isRecoverable(approved) = true', isRecoverable(TEAM_REWARD_STATUS.APPROVED));
assert('isRecoverable(payable) = true', isRecoverable(TEAM_REWARD_STATUS.PAYABLE));
assert('isRecoverable(paid) = true', isRecoverable(TEAM_REWARD_STATUS.PAID));
assert('isRecoverable(risk_hold) = true', isRecoverable(TEAM_REWARD_STATUS.RISK_HOLD));
assert('isRecoverable(locked) = false', !isRecoverable(TEAM_REWARD_STATUS.LOCKED));

assert('isCancellableReward(created) = true', isCancellableReward(TEAM_REWARD_STATUS.CREATED));
assert('isCancellableReward(waiting_service_record) = true', isCancellableReward(TEAM_REWARD_STATUS.WAITING_SERVICE_RECORD));
assert('isCancellableReward(paid) = false', !isCancellableReward(TEAM_REWARD_STATUS.PAID));
assert('isCancellableReward(cancelled) = false', !isCancellableReward(TEAM_REWARD_STATUS.CANCELLED));

assert('isServiceRecordApprovable(pending) = true', isServiceRecordApprovable(TEAM_SERVICE_RECORD_STATUS.PENDING));
assert('isServiceRecordApprovable(approved) = false', !isServiceRecordApprovable(TEAM_SERVICE_RECORD_STATUS.APPROVED));

// nextTeamRewardStatuses
const nextFromCreated = nextTeamRewardStatuses(TEAM_REWARD_STATUS.CREATED);
assert('created 可转移到 2 个状态', nextFromCreated.length === 2);
const nextFromPaid = nextTeamRewardStatuses(TEAM_REWARD_STATUS.PAID);
assert('paid 可转移到 1 个状态（只能 recovered）', nextFromPaid.length === 1);
const nextFromRecovered = nextTeamRewardStatuses(TEAM_REWARD_STATUS.RECOVERED);
assert('recovered 是终态（0 个可转移）', nextFromRecovered.length === 0);

// nextTeamStructureStatuses
const nextFromActive = nextTeamStructureStatuses(TEAM_STRUCTURE_STATUS.ACTIVE);
assert('active 可转移到 2 个状态', nextFromActive.length === 2);

// nextTeamServiceRecordStatuses
const nextFromPending = nextTeamServiceRecordStatuses(TEAM_SERVICE_RECORD_STATUS.PENDING);
assert('pending 可转移到 2 个状态', nextFromPending.length === 2);

// ============================================================
// [11] 事件常量
// ============================================================
console.log('\n[11] 事件常量');
assert('TEAM_EVENTS 包含 14 个事件', Object.keys(TEAM_EVENTS).length === 14, Object.keys(TEAM_EVENTS).length);
assert('ALL_TEAM_EVENTS === 14', ALL_TEAM_EVENTS.length === 14);
assert('TEAM_EVENT_COUNT === 14', TEAM_EVENT_COUNT === 14);
assert('STRUCTURE_CREATED = team.structure_created.v1', TEAM_EVENTS.STRUCTURE_CREATED === 'team.structure_created.v1');
assert('REWARD_CREATED = team.reward_created.v1', TEAM_EVENTS.REWARD_CREATED === 'team.reward_created.v1');
assert('REWARD_LOCKED = team.reward_locked.v1', TEAM_EVENTS.REWARD_LOCKED === 'team.reward_locked.v1');
assert('REWARD_APPROVED = team.reward_approved.v1', TEAM_EVENTS.REWARD_APPROVED === 'team.reward_approved.v1');
assert('REWARD_PAID = team.reward_paid.v1', TEAM_EVENTS.REWARD_PAID === 'team.reward_paid.v1');
assert('SERVICE_RECORD_APPROVED = team.service_record_approved.v1', TEAM_EVENTS.SERVICE_RECORD_APPROVED === 'team.service_record_approved.v1');

assert('TEAM_EVENT_SOURCES 包含 10 个', Object.keys(TEAM_EVENT_SOURCES).length === 10);
assert('SYSTEM = system', TEAM_EVENT_SOURCES.SYSTEM === 'system');
assert('TEAM = team', TEAM_EVENT_SOURCES.TEAM === 'team');
assert('SERVICE = service', TEAM_EVENT_SOURCES.SERVICE === 'service');

assert('isValidTeamEvent(team.reward_created.v1) = true', isValidTeamEvent('team.reward_created.v1'));
assert('isValidTeamEvent(invalid.event) = false', !isValidTeamEvent('invalid.event'));
assert('isValidTeamEventSource(system) = true', isValidTeamEventSource('system'));
assert('isValidTeamEventSource(invalid) = false', !isValidTeamEventSource('invalid'));

// ============================================================
// [12] 错误码 + 异常类
// ============================================================
console.log('\n[12] 错误码 + 异常类');
assert('TEAM_ERROR_CODES 包含 40+ 个', Object.keys(TEAM_ERROR_CODES).length >= 40, getTeamErrorCodeCount());
assert('STRUCTURE_NOT_FOUND', TEAM_ERROR_CODES.STRUCTURE_NOT_FOUND === 'TEAM_STRUCTURE_NOT_FOUND');
assert('REWARD_NOT_FOUND', TEAM_ERROR_CODES.REWARD_NOT_FOUND === 'TEAM_REWARD_NOT_FOUND');
assert('REWARD_ALREADY_EXISTS', TEAM_ERROR_CODES.REWARD_ALREADY_EXISTS === 'TEAM_REWARD_ALREADY_EXISTS');
assert('REWARD_SERVICE_RECORD_REQUIRED', TEAM_ERROR_CODES.REWARD_SERVICE_RECORD_REQUIRED === 'TEAM_REWARD_SERVICE_RECORD_REQUIRED');
assert('REWARD_NO_UPLINE', TEAM_ERROR_CODES.REWARD_NO_UPLINE === 'TEAM_REWARD_NO_UPLINE');

// 异常类测试
const err1 = new FjnTeamRewardNotFoundError();
assert('FjnTeamRewardNotFoundError code 正确', err1.code === 'TEAM_REWARD_NOT_FOUND');
assert('FjnTeamRewardNotFoundError httpStatus = 404', err1.httpStatus === 404);

const err2 = new FjnTeamRewardAlreadyExistsError();
assert('FjnTeamRewardAlreadyExistsError code 正确', err2.code === 'TEAM_REWARD_ALREADY_EXISTS');
assert('FjnTeamRewardAlreadyExistsError httpStatus = 409', err2.httpStatus === 409);

const err3 = new FjnTeamRewardLevelInvalidError();
assert('FjnTeamRewardLevelInvalidError code 正确', err3.code === 'TEAM_REWARD_LEVEL_INVALID');
assert('FjnTeamRewardLevelInvalidError httpStatus = 400', err3.httpStatus === 400);

const err4 = new FjnTeamRewardServiceRecordRequiredError();
assert('FjnTeamRewardServiceRecordRequiredError code 正确', err4.code === 'TEAM_REWARD_SERVICE_RECORD_REQUIRED');
assert('FjnTeamRewardServiceRecordRequiredError httpStatus = 422', err4.httpStatus === 422);

const err5 = new FjnTeamReviewerRequiredError();
assert('FjnTeamReviewerRequiredError code 正确', err5.code === 'TEAM_REVIEWER_REQUIRED');
assert('FjnTeamReviewerRequiredError httpStatus = 400', err5.httpStatus === 400);

const err6 = new FjnTeamStructureLoopNotAllowedError();
assert('FjnTeamStructureLoopNotAllowedError code 正确', err6.code === 'TEAM_STRUCTURE_LOOP_NOT_ALLOWED');

const err7 = new FjnTeamRewardNoUplineError();
assert('FjnTeamRewardNoUplineError code 正确', err7.code === 'TEAM_REWARD_NO_UPLINE');

assert('isFjnTeamErrorCode(TEAM_REWARD_NOT_FOUND) = true', isFjnTeamErrorCode('TEAM_REWARD_NOT_FOUND'));
assert('isFjnTeamErrorCode(INVALID) = false', !isFjnTeamErrorCode('INVALID'));
assert('getTeamErrorCodeCount() >= 40', getTeamErrorCodeCount() >= 40);

// ============================================================
// [13] 服务类型常量
// ============================================================
console.log('\n[13] 服务类型常量');
assert('TEAM_SERVICE_TYPES 包含 5 个', Object.keys(TEAM_SERVICE_TYPES).length === 5);
assert('TRAINING = training', TEAM_SERVICE_TYPES.TRAINING === 'training');
assert('COMMUNITY = community', TEAM_SERVICE_TYPES.COMMUNITY === 'community');
assert('AFTER_SALES = after_sales', TEAM_SERVICE_TYPES.AFTER_SALES === 'after_sales');
assert('PROMOTION = promotion', TEAM_SERVICE_TYPES.PROMOTION === 'promotion');
assert('COMPLIANCE = compliance', TEAM_SERVICE_TYPES.COMPLIANCE === 'compliance');

// ============================================================
// [14] Service 类实例化
// ============================================================
console.log('\n[14] Service 类实例化');
const svc1 = new FjnTeamService();
assert('FjnTeamService 实例化成功', svc1 instanceof FjnTeamService);
assert('FjnTeamService 名称正确', svc1['serviceName'] === 'FjnTeamService');

const svc2 = createFjnTeamService();
assert('createFjnTeamService 工厂方法成功', svc2 instanceof FjnTeamService);

const svc3 = new FjnTeamService({ serviceName: 'CustomTeamService' });
assert('自定义 serviceName 生效', svc3['serviceName'] === 'CustomTeamService');

// ============================================================
// 总结
// ============================================================
console.log('\n=== 测试结果 ===');
console.log(`✅ 通过: ${pass}`);
console.log(`❌ 失败: ${fail}`);
console.log(`📊 合计: ${pass + fail}`);
console.log(`📈 通过率: ${((pass / (pass + fail)) * 100).toFixed(2)}%`);

if (fail > 0) {
  console.log('\n❌ 有测试失败');
  process.exit(1);
} else {
  console.log('\n✅ 全部测试通过');
  process.exit(0);
}
