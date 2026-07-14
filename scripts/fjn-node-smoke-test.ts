/**
 * FJN Node Service 冒烟测试
 *
 * 验证内容：
 *  - 节点状态机：7 个状态、合法/非法转移
 *  - KYB 状态机：4 个状态
 *  - 节点奖励状态机：10 个状态
 *  - 节点服务记录状态机：3 个状态
 *  - 3/3/2/2 节点奖励规则（strategic 不参与）
 *  - 5 级节点等级
 *  - 事件常量命名规范
 *  - 错误码 + 异常类
 *  - 工具函数
 *
 * 说明：
 *  - 本测试只覆盖纯逻辑部分（不依赖数据库）
 *  - 数据库相关方法（createNode / approveNode / createReward / submitKyb 等）需在真实 DB 环境下测试
 */

import {
  NODE_STATUS,
  NODE_STATUS_TRANSITIONS,
  ALL_NODE_STATUSES,
  TERMINAL_NODE_STATUSES,
  NODE_KYB_STATUS,
  NODE_KYB_STATUS_TRANSITIONS,
  ALL_NODE_KYB_STATUSES,
  TERMINAL_NODE_KYB_STATUSES,
  NODE_REWARD_STATUS,
  NODE_REWARD_STATUS_TRANSITIONS,
  ALL_NODE_REWARD_STATUSES,
  TERMINAL_NODE_REWARD_STATUSES,
  NODE_SERVICE_RECORD_STATUS,
  NODE_SERVICE_RECORD_STATUS_TRANSITIONS,
  ALL_NODE_SERVICE_RECORD_STATUSES,
  TERMINAL_NODE_SERVICE_RECORD_STATUSES,
  NODE_LEVELS,
  ALL_NODE_LEVELS,
  NODE_LEVEL_RANK,
  NODE_REWARD_RATES,
  NODE_LEVEL_RATES,
  NODE_REWARD_LEVELS,
  NODE_SERVICE_TYPES,
  canTransitNodeStatus,
  assertTransitNodeStatus,
  canTransitNodeKybStatus,
  assertTransitNodeKybStatus,
  canTransitNodeRewardStatus,
  assertTransitNodeRewardStatus,
  canTransitNodeServiceRecordStatus,
  assertTransitNodeServiceRecordStatus,
  nextNodeStatuses,
  nextNodeKybStatuses,
  nextNodeRewardStatuses,
  nextNodeServiceRecordStatuses,
  isTerminalNodeStatus,
  isTerminalNodeRewardStatus,
  isTerminalNodeKybStatus,
  isTerminalNodeServiceRecordStatus,
  isNodeRewardLockable,
  isNodeRewardApprovable,
  isNodeRewardPayableReward,
  isNodeRewardPayableNow,
  isNodeRewardRecoverable,
  isNodeRewardCancellable,
  isNodeRewardEligible,
  isNodeServiceRecordApprovable,
  isNodeRewardLevel,
  NODE_EVENTS,
  NODE_EVENT_SOURCES,
  ALL_NODE_EVENTS,
  NODE_EVENT_COUNT,
  isValidNodeEvent,
  isValidNodeEventSource,
  NODE_ERROR_CODES,
  FjnNodeError,
  FjnNodeNotFoundError,
  FjnNodeAlreadyExistsError,
  FjnNodeInvalidError,
  FjnNodeLevelInvalidError,
  FjnNodeRegionInvalidError,
  FjnNodeNotActiveError,
  FjnNodeNotApprovedError,
  FjnNodeSuspendedError,
  FjnNodeTerminatedError,
  FjnNodeBlacklistedError,
  FjnNodeRestrictedError,
  FjnNodeNotRewardEligibleError,
  FjnNodeKybNotSubmittedError,
  FjnNodeKybAlreadyApprovedError,
  FjnNodeKybInvalidStatusError,
  FjnNodeKybRequiredError,
  FjnNodeKybAgreementRequiredError,
  FjnNodeServiceRecordNotFoundError,
  FjnNodeServiceRecordInvalidError,
  FjnNodeServiceRecordTypeInvalidError,
  FjnNodeServiceRecordParticipantsInvalidError,
  FjnNodeRewardNotFoundError,
  FjnNodeRewardAlreadyExistsError,
  FjnNodeRewardStatusInvalidError,
  FjnNodeRewardTerminalStatusError,
  FjnNodeRewardAmountInvalidError,
  FjnNodeRewardAmountZeroError,
  FjnNodeRewardRateInvalidError,
  FjnNodeRewardLevelInvalidError,
  FjnNodeRewardStrategicNotEligibleError,
  FjnNodeRewardNotLockableError,
  FjnNodeRewardNotApprovableError,
  FjnNodeRewardNotPayableError,
  FjnNodeRewardNotRecoverableError,
  FjnNodeRewardNotCancellableError,
  FjnNodeRewardServiceRecordRequiredError,
  FjnNodeRewardServiceRecordNotApprovedError,
  FjnNodeRewardNoNodeError,
  FjnNodeOrderNotFoundError,
  FjnNodeOrderNotPaidError,
  FjnNodeRiskHoldError,
  FjnNodeApproverRequiredError,
  FjnNodeReviewerRequiredError,
  FjnNodeReasonRequiredError,
  isFjnNodeErrorCode,
  getNodeErrorCodeCount,
  FjnNodeService,
  createFjnNodeService,
} from '../src/lib/fjn';

let pass = 0, fail = 0;
function assert(name: string, cond: boolean, info?: any) {
  if (cond) { console.log(`  ✅ ${name}`); pass++; }
  else { console.log(`  ❌ ${name}`, info ?? ''); fail++; }
}

console.log('=== FJN Node Service 冒烟测试 ===\n');

// ============================================================
// [1] 节点状态常量
// ============================================================
console.log('[1] 节点状态常量');
assert('NODE_STATUS 包含 7 个状态', Object.keys(NODE_STATUS).length === 7, Object.keys(NODE_STATUS).length);
assert('PENDING_REVIEW = pending_review', NODE_STATUS.PENDING_REVIEW === 'pending_review');
assert('APPROVED = approved', NODE_STATUS.APPROVED === 'approved');
assert('ACTIVE = active', NODE_STATUS.ACTIVE === 'active');
assert('RESTRICTED = restricted', NODE_STATUS.RESTRICTED === 'restricted');
assert('SUSPENDED = suspended', NODE_STATUS.SUSPENDED === 'suspended');
assert('TERMINATED = terminated', NODE_STATUS.TERMINATED === 'terminated');
assert('BLACKLISTED = blacklisted', NODE_STATUS.BLACKLISTED === 'blacklisted');
assert('ALL_NODE_STATUSES 包含 7 个', ALL_NODE_STATUSES.length === 7);
assert('TERMINAL_NODE_STATUSES 包含 2 个', TERMINAL_NODE_STATUSES.length === 2);

console.log('\n[2] KYB 状态常量');
assert('NODE_KYB_STATUS 包含 4 个', Object.keys(NODE_KYB_STATUS).length === 4);
assert('NOT_SUBMITTED = not_submitted', NODE_KYB_STATUS.NOT_SUBMITTED === 'not_submitted');
assert('SUBMITTED = submitted', NODE_KYB_STATUS.SUBMITTED === 'submitted');
assert('APPROVED = approved', NODE_KYB_STATUS.APPROVED === 'approved');
assert('REJECTED = rejected', NODE_KYB_STATUS.REJECTED === 'rejected');
assert('TERMINAL_NODE_KYB_STATUSES 包含 2 个', TERMINAL_NODE_KYB_STATUSES.length === 2);

console.log('\n[3] 节点奖励状态常量');
assert('NODE_REWARD_STATUS 包含 10 个', Object.keys(NODE_REWARD_STATUS).length === 10, Object.keys(NODE_REWARD_STATUS).length);
assert('CREATED = created', NODE_REWARD_STATUS.CREATED === 'created');
assert('WAITING_SERVICE_RECORD = waiting_service_record', NODE_REWARD_STATUS.WAITING_SERVICE_RECORD === 'waiting_service_record');
assert('LOCKED = locked', NODE_REWARD_STATUS.LOCKED === 'locked');
assert('RISK_CHECKING = risk_checking', NODE_REWARD_STATUS.RISK_CHECKING === 'risk_checking');
assert('APPROVED = approved', NODE_REWARD_STATUS.APPROVED === 'approved');
assert('PAYABLE = payable', NODE_REWARD_STATUS.PAYABLE === 'payable');
assert('PAID = paid', NODE_REWARD_STATUS.PAID === 'paid');
assert('RECOVERED = recovered', NODE_REWARD_STATUS.RECOVERED === 'recovered');
assert('CANCELLED = cancelled', NODE_REWARD_STATUS.CANCELLED === 'cancelled');
assert('RISK_HOLD = risk_hold', NODE_REWARD_STATUS.RISK_HOLD === 'risk_hold');
assert('ALL_NODE_REWARD_STATUSES 包含 10 个', ALL_NODE_REWARD_STATUSES.length === 10);
assert('TERMINAL_NODE_REWARD_STATUSES 包含 3 个', TERMINAL_NODE_REWARD_STATUSES.length === 3);

console.log('\n[4] 服务记录状态常量');
assert('NODE_SERVICE_RECORD_STATUS 包含 3 个', Object.keys(NODE_SERVICE_RECORD_STATUS).length === 3);
assert('PENDING = pending', NODE_SERVICE_RECORD_STATUS.PENDING === 'pending');
assert('APPROVED = approved', NODE_SERVICE_RECORD_STATUS.APPROVED === 'approved');
assert('REJECTED = rejected', NODE_SERVICE_RECORD_STATUS.REJECTED === 'rejected');

// ============================================================
// [5] 节点等级（5 级）
// ============================================================
console.log('\n[5] 节点等级');
assert('NODE_LEVELS 包含 5 个等级', Object.keys(NODE_LEVELS).length === 5);
assert('CITY = city', NODE_LEVELS.CITY === 'city');
assert('REGIONAL = regional', NODE_LEVELS.REGIONAL === 'regional');
assert('NATIONAL = national', NODE_LEVELS.NATIONAL === 'national');
assert('GLOBAL = global', NODE_LEVELS.GLOBAL === 'global');
assert('STRATEGIC = strategic', NODE_LEVELS.STRATEGIC === 'strategic');
assert('ALL_NODE_LEVELS 包含 5 个', ALL_NODE_LEVELS.length === 5);
assert('NODE_LEVEL_RANK[city] = 1', NODE_LEVEL_RANK[NODE_LEVELS.CITY] === 1);
assert('NODE_LEVEL_RANK[strategic] = 5', NODE_LEVEL_RANK[NODE_LEVELS.STRATEGIC] === 5);

// ============================================================
// [6] 节点奖励规则（3/3/2/2，strategic 不参与）
// ============================================================
console.log('\n[6] 节点奖励规则 3/3/2/2');
assert('CITY = 0.03', NODE_REWARD_RATES.CITY === '0.03');
assert('REGIONAL = 0.03', NODE_REWARD_RATES.REGIONAL === '0.03');
assert('NATIONAL = 0.02', NODE_REWARD_RATES.NATIONAL === '0.02');
assert('GLOBAL = 0.02', NODE_REWARD_RATES.GLOBAL === '0.02');
assert('STRATEGIC = 0', NODE_REWARD_RATES.STRATEGIC === '0');

assert('NODE_LEVEL_RATES[city] = 0.03', NODE_LEVEL_RATES.city === '0.03');
assert('NODE_LEVEL_RATES[regional] = 0.03', NODE_LEVEL_RATES.regional === '0.03');
assert('NODE_LEVEL_RATES[national] = 0.02', NODE_LEVEL_RATES.national === '0.02');
assert('NODE_LEVEL_RATES[global] = 0.02', NODE_LEVEL_RATES.global === '0.02');

assert('NODE_REWARD_LEVELS 包含 4 个（不含 strategic）', NODE_REWARD_LEVELS.length === 4);
assert('NODE_REWARD_LEVELS 不含 strategic', !(NODE_REWARD_LEVELS as readonly string[]).includes('strategic'));

assert('isNodeRewardLevel(city) = true', isNodeRewardLevel(NODE_LEVELS.CITY));
assert('isNodeRewardLevel(strategic) = false', !isNodeRewardLevel(NODE_LEVELS.STRATEGIC));

// ============================================================
// [7] 节点状态机 - 合法转移
// ============================================================
console.log('\n[7] 节点状态机 - 合法转移');
assert('pending_review -> approved 合法', canTransitNodeStatus(NODE_STATUS.PENDING_REVIEW, NODE_STATUS.APPROVED));
assert('pending_review -> blacklisted 合法', canTransitNodeStatus(NODE_STATUS.PENDING_REVIEW, NODE_STATUS.BLACKLISTED));
assert('approved -> active 合法', canTransitNodeStatus(NODE_STATUS.APPROVED, NODE_STATUS.ACTIVE));
assert('approved -> suspended 合法', canTransitNodeStatus(NODE_STATUS.APPROVED, NODE_STATUS.SUSPENDED));
assert('active -> restricted 合法', canTransitNodeStatus(NODE_STATUS.ACTIVE, NODE_STATUS.RESTRICTED));
assert('active -> suspended 合法', canTransitNodeStatus(NODE_STATUS.ACTIVE, NODE_STATUS.SUSPENDED));
assert('active -> terminated 合法', canTransitNodeStatus(NODE_STATUS.ACTIVE, NODE_STATUS.TERMINATED));
assert('restricted -> active 合法', canTransitNodeStatus(NODE_STATUS.RESTRICTED, NODE_STATUS.ACTIVE));
assert('restricted -> suspended 合法', canTransitNodeStatus(NODE_STATUS.RESTRICTED, NODE_STATUS.SUSPENDED));
assert('suspended -> active 合法', canTransitNodeStatus(NODE_STATUS.SUSPENDED, NODE_STATUS.ACTIVE));
assert('suspended -> terminated 合法', canTransitNodeStatus(NODE_STATUS.SUSPENDED, NODE_STATUS.TERMINATED));

// ============================================================
// [8] 节点状态机 - 非法转移
// ============================================================
console.log('\n[8] 节点状态机 - 非法转移');
assert('pending_review -> active 非法（必须先 approved）', !canTransitNodeStatus(NODE_STATUS.PENDING_REVIEW, NODE_STATUS.ACTIVE));
assert('pending_review -> restricted 非法', !canTransitNodeStatus(NODE_STATUS.PENDING_REVIEW, NODE_STATUS.RESTRICTED));
assert('approved -> terminated 非法（必须先 active）', !canTransitNodeStatus(NODE_STATUS.APPROVED, NODE_STATUS.TERMINATED));
assert('terminated -> anything 非法（终态）', !canTransitNodeStatus(NODE_STATUS.TERMINATED, NODE_STATUS.ACTIVE));
assert('blacklisted -> anything 非法（终态）', !canTransitNodeStatus(NODE_STATUS.BLACKLISTED, NODE_STATUS.ACTIVE));
assert('active -> pending_review 非法（不可回退）', !canTransitNodeStatus(NODE_STATUS.ACTIVE, NODE_STATUS.PENDING_REVIEW));

// ============================================================
// [9] KYB 状态机
// ============================================================
console.log('\n[9] KYB 状态机');
assert('not_submitted -> submitted 合法', canTransitNodeKybStatus(NODE_KYB_STATUS.NOT_SUBMITTED, NODE_KYB_STATUS.SUBMITTED));
assert('submitted -> approved 合法', canTransitNodeKybStatus(NODE_KYB_STATUS.SUBMITTED, NODE_KYB_STATUS.APPROVED));
assert('submitted -> rejected 合法', canTransitNodeKybStatus(NODE_KYB_STATUS.SUBMITTED, NODE_KYB_STATUS.REJECTED));
assert('approved -> submitted 合法（重新提交）', canTransitNodeKybStatus(NODE_KYB_STATUS.APPROVED, NODE_KYB_STATUS.SUBMITTED));
assert('rejected -> submitted 合法（重新提交）', canTransitNodeKybStatus(NODE_KYB_STATUS.REJECTED, NODE_KYB_STATUS.SUBMITTED));

assert('not_submitted -> approved 非法', !canTransitNodeKybStatus(NODE_KYB_STATUS.NOT_SUBMITTED, NODE_KYB_STATUS.APPROVED));
assert('approved -> rejected 非法（终态）', !canTransitNodeKybStatus(NODE_KYB_STATUS.APPROVED, NODE_KYB_STATUS.REJECTED));
assert('rejected -> approved 非法（终态）', !canTransitNodeKybStatus(NODE_KYB_STATUS.REJECTED, NODE_KYB_STATUS.APPROVED));

// ============================================================
// [10] 节点奖励状态机 - 合法转移
// ============================================================
console.log('\n[10] 节点奖励状态机 - 合法转移');
assert('created -> waiting_service_record 合法', canTransitNodeRewardStatus(NODE_REWARD_STATUS.CREATED, NODE_REWARD_STATUS.WAITING_SERVICE_RECORD));
assert('created -> cancelled 合法', canTransitNodeRewardStatus(NODE_REWARD_STATUS.CREATED, NODE_REWARD_STATUS.CANCELLED));
assert('waiting_service_record -> locked 合法', canTransitNodeRewardStatus(NODE_REWARD_STATUS.WAITING_SERVICE_RECORD, NODE_REWARD_STATUS.LOCKED));
assert('waiting_service_record -> cancelled 合法', canTransitNodeRewardStatus(NODE_REWARD_STATUS.WAITING_SERVICE_RECORD, NODE_REWARD_STATUS.CANCELLED));
assert('locked -> risk_checking 合法', canTransitNodeRewardStatus(NODE_REWARD_STATUS.LOCKED, NODE_REWARD_STATUS.RISK_CHECKING));
assert('locked -> approved 合法', canTransitNodeRewardStatus(NODE_REWARD_STATUS.LOCKED, NODE_REWARD_STATUS.APPROVED));
assert('risk_checking -> approved 合法', canTransitNodeRewardStatus(NODE_REWARD_STATUS.RISK_CHECKING, NODE_REWARD_STATUS.APPROVED));
assert('risk_checking -> payable 合法', canTransitNodeRewardStatus(NODE_REWARD_STATUS.RISK_CHECKING, NODE_REWARD_STATUS.PAYABLE));
assert('risk_checking -> risk_hold 合法', canTransitNodeRewardStatus(NODE_REWARD_STATUS.RISK_CHECKING, NODE_REWARD_STATUS.RISK_HOLD));
assert('approved -> payable 合法', canTransitNodeRewardStatus(NODE_REWARD_STATUS.APPROVED, NODE_REWARD_STATUS.PAYABLE));
assert('approved -> recovered 合法', canTransitNodeRewardStatus(NODE_REWARD_STATUS.APPROVED, NODE_REWARD_STATUS.RECOVERED));
assert('payable -> paid 合法', canTransitNodeRewardStatus(NODE_REWARD_STATUS.PAYABLE, NODE_REWARD_STATUS.PAID));
assert('payable -> recovered 合法', canTransitNodeRewardStatus(NODE_REWARD_STATUS.PAYABLE, NODE_REWARD_STATUS.RECOVERED));
assert('paid -> recovered 合法', canTransitNodeRewardStatus(NODE_REWARD_STATUS.PAID, NODE_REWARD_STATUS.RECOVERED));
assert('risk_hold -> approved 合法', canTransitNodeRewardStatus(NODE_REWARD_STATUS.RISK_HOLD, NODE_REWARD_STATUS.APPROVED));

// ============================================================
// [11] 节点奖励状态机 - 非法转移
// ============================================================
console.log('\n[11] 节点奖励状态机 - 非法转移');
assert('created -> paid 非法', !canTransitNodeRewardStatus(NODE_REWARD_STATUS.CREATED, NODE_REWARD_STATUS.PAID));
assert('created -> approved 非法', !canTransitNodeRewardStatus(NODE_REWARD_STATUS.CREATED, NODE_REWARD_STATUS.APPROVED));
assert('created -> locked 非法（必须先 waiting_service_record）', !canTransitNodeRewardStatus(NODE_REWARD_STATUS.CREATED, NODE_REWARD_STATUS.LOCKED));
assert('locked -> payable 非法（必须先 approved）', !canTransitNodeRewardStatus(NODE_REWARD_STATUS.LOCKED, NODE_REWARD_STATUS.PAYABLE));
assert('paid -> payable 非法（paid 后只能 recovered）', !canTransitNodeRewardStatus(NODE_REWARD_STATUS.PAID, NODE_REWARD_STATUS.PAYABLE));
assert('recovered -> anything 非法（终态）', !canTransitNodeRewardStatus(NODE_REWARD_STATUS.RECOVERED, NODE_REWARD_STATUS.PAID));
assert('cancelled -> anything 非法（终态）', !canTransitNodeRewardStatus(NODE_REWARD_STATUS.CANCELLED, NODE_REWARD_STATUS.APPROVED));

// ============================================================
// [12] 节点服务记录状态机
// ============================================================
console.log('\n[12] 节点服务记录状态机');
assert('pending -> approved 合法', canTransitNodeServiceRecordStatus(NODE_SERVICE_RECORD_STATUS.PENDING, NODE_SERVICE_RECORD_STATUS.APPROVED));
assert('pending -> rejected 合法', canTransitNodeServiceRecordStatus(NODE_SERVICE_RECORD_STATUS.PENDING, NODE_SERVICE_RECORD_STATUS.REJECTED));
assert('approved -> rejected 非法（终态）', !canTransitNodeServiceRecordStatus(NODE_SERVICE_RECORD_STATUS.APPROVED, NODE_SERVICE_RECORD_STATUS.REJECTED));
assert('rejected -> approved 非法（终态）', !canTransitNodeServiceRecordStatus(NODE_SERVICE_RECORD_STATUS.REJECTED, NODE_SERVICE_RECORD_STATUS.APPROVED));

// ============================================================
// [13] 强制转移
// ============================================================
console.log('\n[13] 状态机 - 强制转移');
try {
  assertTransitNodeRewardStatus(NODE_REWARD_STATUS.CREATED, NODE_REWARD_STATUS.WAITING_SERVICE_RECORD);
  assert('节点奖励合法转移不抛错', true);
} catch (e) {
  assert('节点奖励合法转移不抛错', false, e);
}
try {
  assertTransitNodeRewardStatus(NODE_REWARD_STATUS.CREATED, NODE_REWARD_STATUS.PAID);
  assert('节点奖励非法转移应该抛错', false);
} catch (e: any) {
  assert('节点奖励非法转移抛 FjnStateMachineError', e.code === 'FJN_STATE_MACHINE');
}
try {
  assertTransitNodeStatus(NODE_STATUS.PENDING_REVIEW, NODE_STATUS.APPROVED);
  assert('节点合法转移不抛错', true);
} catch (e) {
  assert('节点合法转移不抛错', false, e);
}
try {
  assertTransitNodeKybStatus(NODE_KYB_STATUS.SUBMITTED, NODE_KYB_STATUS.APPROVED);
  assert('KYB 合法转移不抛错', true);
} catch (e) {
  assert('KYB 合法转移不抛错', false, e);
}

// ============================================================
// [14] 工具函数
// ============================================================
console.log('\n[14] 状态机 - 工具函数');
assert('isTerminalNodeStatus(terminated) = true', isTerminalNodeStatus(NODE_STATUS.TERMINATED));
assert('isTerminalNodeStatus(blacklisted) = true', isTerminalNodeStatus(NODE_STATUS.BLACKLISTED));
assert('isTerminalNodeStatus(active) = false', !isTerminalNodeStatus(NODE_STATUS.ACTIVE));
assert('isTerminalNodeStatus(approved) = false', !isTerminalNodeStatus(NODE_STATUS.APPROVED));

assert('isTerminalNodeRewardStatus(paid) = true', isTerminalNodeRewardStatus(NODE_REWARD_STATUS.PAID));
assert('isTerminalNodeRewardStatus(recovered) = true', isTerminalNodeRewardStatus(NODE_REWARD_STATUS.RECOVERED));
assert('isTerminalNodeRewardStatus(cancelled) = true', isTerminalNodeRewardStatus(NODE_REWARD_STATUS.CANCELLED));
assert('isTerminalNodeRewardStatus(approved) = false', !isTerminalNodeRewardStatus(NODE_REWARD_STATUS.APPROVED));

assert('isTerminalNodeKybStatus(approved) = true', isTerminalNodeKybStatus(NODE_KYB_STATUS.APPROVED));
assert('isTerminalNodeKybStatus(rejected) = true', isTerminalNodeKybStatus(NODE_KYB_STATUS.REJECTED));
assert('isTerminalNodeKybStatus(submitted) = false', !isTerminalNodeKybStatus(NODE_KYB_STATUS.SUBMITTED));

assert('isTerminalNodeServiceRecordStatus(approved) = true', isTerminalNodeServiceRecordStatus(NODE_SERVICE_RECORD_STATUS.APPROVED));
assert('isTerminalNodeServiceRecordStatus(pending) = false', !isTerminalNodeServiceRecordStatus(NODE_SERVICE_RECORD_STATUS.PENDING));

assert('isNodeRewardLockable(created) = true', isNodeRewardLockable(NODE_REWARD_STATUS.CREATED));
assert('isNodeRewardLockable(waiting_service_record) = true', isNodeRewardLockable(NODE_REWARD_STATUS.WAITING_SERVICE_RECORD));
assert('isNodeRewardLockable(locked) = false', !isNodeRewardLockable(NODE_REWARD_STATUS.LOCKED));

assert('isNodeRewardApprovable(locked) = true', isNodeRewardApprovable(NODE_REWARD_STATUS.LOCKED));
assert('isNodeRewardApprovable(risk_checking) = true', isNodeRewardApprovable(NODE_REWARD_STATUS.RISK_CHECKING));
assert('isNodeRewardApprovable(approved) = false', !isNodeRewardApprovable(NODE_REWARD_STATUS.APPROVED));

assert('isNodeRewardPayableReward(approved) = true', isNodeRewardPayableReward(NODE_REWARD_STATUS.APPROVED));
assert('isNodeRewardPayableReward(risk_checking) = true', isNodeRewardPayableReward(NODE_REWARD_STATUS.RISK_CHECKING));

assert('isNodeRewardPayableNow(payable) = true', isNodeRewardPayableNow(NODE_REWARD_STATUS.PAYABLE));
assert('isNodeRewardPayableNow(approved) = false', !isNodeRewardPayableNow(NODE_REWARD_STATUS.APPROVED));

assert('isNodeRewardRecoverable(approved) = true', isNodeRewardRecoverable(NODE_REWARD_STATUS.APPROVED));
assert('isNodeRewardRecoverable(payable) = true', isNodeRewardRecoverable(NODE_REWARD_STATUS.PAYABLE));
assert('isNodeRewardRecoverable(paid) = true', isNodeRewardRecoverable(NODE_REWARD_STATUS.PAID));
assert('isNodeRewardRecoverable(risk_hold) = true', isNodeRewardRecoverable(NODE_REWARD_STATUS.RISK_HOLD));
assert('isNodeRewardRecoverable(locked) = false', !isNodeRewardRecoverable(NODE_REWARD_STATUS.LOCKED));

assert('isNodeRewardCancellable(created) = true', isNodeRewardCancellable(NODE_REWARD_STATUS.CREATED));
assert('isNodeRewardCancellable(paid) = false', !isNodeRewardCancellable(NODE_REWARD_STATUS.PAID));
assert('isNodeRewardCancellable(cancelled) = false', !isNodeRewardCancellable(NODE_REWARD_STATUS.CANCELLED));

assert('isNodeRewardEligible(active) = true', isNodeRewardEligible(NODE_STATUS.ACTIVE));
assert('isNodeRewardEligible(approved) = true', isNodeRewardEligible(NODE_STATUS.APPROVED));
assert('isNodeRewardEligible(suspended) = false', !isNodeRewardEligible(NODE_STATUS.SUSPENDED));
assert('isNodeRewardEligible(terminated) = false', !isNodeRewardEligible(NODE_STATUS.TERMINATED));
assert('isNodeRewardEligible(blacklisted) = false', !isNodeRewardEligible(NODE_STATUS.BLACKLISTED));

assert('isNodeServiceRecordApprovable(pending) = true', isNodeServiceRecordApprovable(NODE_SERVICE_RECORD_STATUS.PENDING));
assert('isNodeServiceRecordApprovable(approved) = false', !isNodeServiceRecordApprovable(NODE_SERVICE_RECORD_STATUS.APPROVED));

// next 状态数
const nextFromCreated = nextNodeRewardStatuses(NODE_REWARD_STATUS.CREATED);
assert('created 可转移到 2 个状态', nextFromCreated.length === 2);
const nextFromPaid = nextNodeRewardStatuses(NODE_REWARD_STATUS.PAID);
assert('paid 可转移到 1 个状态（只能 recovered）', nextFromPaid.length === 1);
const nextFromRecovered = nextNodeRewardStatuses(NODE_REWARD_STATUS.RECOVERED);
assert('recovered 是终态（0 个可转移）', nextFromRecovered.length === 0);

const nextFromActive = nextNodeStatuses(NODE_STATUS.ACTIVE);
assert('active 可转移到 4 个状态', nextFromActive.length === 4);

const nextFromTerminated = nextNodeStatuses(NODE_STATUS.TERMINATED);
assert('terminated 是终态（0 个可转移）', nextFromTerminated.length === 0);

const nextFromKybNotSubmitted = nextNodeKybStatuses(NODE_KYB_STATUS.NOT_SUBMITTED);
assert('not_submitted 可转移到 1 个状态', nextFromKybNotSubmitted.length === 1);

// ============================================================
// [15] 服务类型常量
// ============================================================
console.log('\n[15] 服务类型常量');
assert('NODE_SERVICE_TYPES 包含 4 个', Object.keys(NODE_SERVICE_TYPES).length === 4);
assert('MERCHANT_EXPANSION = merchant_expansion', NODE_SERVICE_TYPES.MERCHANT_EXPANSION === 'merchant_expansion');
assert('USER_EDUCATION = user_education', NODE_SERVICE_TYPES.USER_EDUCATION === 'user_education');
assert('COMPLIANCE = compliance', NODE_SERVICE_TYPES.COMPLIANCE === 'compliance');
assert('PROMOTION = promotion', NODE_SERVICE_TYPES.PROMOTION === 'promotion');

// ============================================================
// [16] 事件常量
// ============================================================
console.log('\n[16] 事件常量');
assert('NODE_EVENTS 包含 22 个事件', Object.keys(NODE_EVENTS).length === 22, Object.keys(NODE_EVENTS).length);
assert('ALL_NODE_EVENTS === 22', ALL_NODE_EVENTS.length === 22);
assert('NODE_EVENT_COUNT === 22', NODE_EVENT_COUNT === 22);
assert('NODE_CREATED = node.created.v1', NODE_EVENTS.NODE_CREATED === 'node.created.v1');
assert('NODE_APPROVED = node.approved.v1', NODE_EVENTS.NODE_APPROVED === 'node.approved.v1');
assert('KYB_APPROVED = node.kyb_approved.v1', NODE_EVENTS.KYB_APPROVED === 'node.kyb_approved.v1');
assert('REWARD_CREATED = node.reward_created.v1', NODE_EVENTS.REWARD_CREATED === 'node.reward_created.v1');
assert('REWARD_LOCKED = node.reward_locked.v1', NODE_EVENTS.REWARD_LOCKED === 'node.reward_locked.v1');
assert('REWARD_PAID = node.reward_paid.v1', NODE_EVENTS.REWARD_PAID === 'node.reward_paid.v1');
assert('SERVICE_RECORD_APPROVED = node.service_record_approved.v1', NODE_EVENTS.SERVICE_RECORD_APPROVED === 'node.service_record_approved.v1');
assert('NODE_TERMINATED = node.terminated.v1', NODE_EVENTS.NODE_TERMINATED === 'node.terminated.v1');
assert('NODE_BLACKLISTED = node.blacklisted.v1', NODE_EVENTS.NODE_BLACKLISTED === 'node.blacklisted.v1');

assert('NODE_EVENT_SOURCES 包含 11 个', Object.keys(NODE_EVENT_SOURCES).length === 11);
assert('SYSTEM = system', NODE_EVENT_SOURCES.SYSTEM === 'system');
assert('COMPLIANCE = compliance', NODE_EVENT_SOURCES.COMPLIANCE === 'compliance');
assert('NODE = node', NODE_EVENT_SOURCES.NODE === 'node');
assert('SERVICE = service', NODE_EVENT_SOURCES.SERVICE === 'service');

assert('isValidNodeEvent(node.created.v1) = true', isValidNodeEvent('node.created.v1'));
assert('isValidNodeEvent(invalid.event) = false', !isValidNodeEvent('invalid.event'));
assert('isValidNodeEventSource(system) = true', isValidNodeEventSource('system'));
assert('isValidNodeEventSource(invalid) = false', !isValidNodeEventSource('invalid'));

// ============================================================
// [17] 错误码 + 异常类
// ============================================================
console.log('\n[17] 错误码 + 异常类');
assert('NODE_ERROR_CODES 包含 58 个', Object.keys(NODE_ERROR_CODES).length === 58, getNodeErrorCodeCount());
assert('NODE_NOT_FOUND', NODE_ERROR_CODES.NODE_NOT_FOUND === 'NODE_NOT_FOUND');
assert('NODE_BLACKLISTED', NODE_ERROR_CODES.NODE_BLACKLISTED === 'NODE_BLACKLISTED');
assert('KYB_REQUIRED', NODE_ERROR_CODES.KYB_REQUIRED === 'NODE_KYB_REQUIRED');
assert('REWARD_STRATEGIC_NOT_ELIGIBLE', NODE_ERROR_CODES.REWARD_STRATEGIC_NOT_ELIGIBLE === 'NODE_REWARD_STRATEGIC_NOT_ELIGIBLE');
assert('REWARD_NO_NODE', NODE_ERROR_CODES.REWARD_NO_NODE === 'NODE_REWARD_NO_NODE');

const err1 = new FjnNodeNotFoundError();
assert('FjnNodeNotFoundError code 正确', err1.code === 'NODE_NOT_FOUND');
assert('FjnNodeNotFoundError httpStatus = 404', err1.httpStatus === 404);

const err2 = new FjnNodeAlreadyExistsError();
assert('FjnNodeAlreadyExistsError code 正确', err2.code === 'NODE_ALREADY_EXISTS');
assert('FjnNodeAlreadyExistsError httpStatus = 409', err2.httpStatus === 409);

const err3 = new FjnNodeLevelInvalidError();
assert('FjnNodeLevelInvalidError code 正确', err3.code === 'NODE_LEVEL_INVALID');
assert('FjnNodeLevelInvalidError httpStatus = 400', err3.httpStatus === 400);

const err4 = new FjnNodeKybRequiredError();
assert('FjnNodeKybRequiredError code 正确', err4.code === 'NODE_KYB_REQUIRED');
assert('FjnNodeKybRequiredError httpStatus = 422', err4.httpStatus === 422);

const err5 = new FjnNodeRewardStrategicNotEligibleError();
assert('FjnNodeRewardStrategicNotEligibleError code 正确', err5.code === 'NODE_REWARD_STRATEGIC_NOT_ELIGIBLE');

const err6 = new FjnNodeRewardNoNodeError();
assert('FjnNodeRewardNoNodeError code 正确', err6.code === 'NODE_REWARD_NO_NODE');

const err7 = new FjnNodeApproverRequiredError();
assert('FjnNodeApproverRequiredError code 正确', err7.code === 'NODE_APPROVER_REQUIRED');
assert('FjnNodeApproverRequiredError httpStatus = 400', err7.httpStatus === 400);

const err8 = new FjnNodeBlacklistedError();
assert('FjnNodeBlacklistedError code 正确', err8.code === 'NODE_BLACKLISTED');
assert('FjnNodeBlacklistedError httpStatus = 422', err8.httpStatus === 422);

const err9 = new FjnNodeTerminatedError();
assert('FjnNodeTerminatedError code 正确', err9.code === 'NODE_TERMINATED');

const err10 = new FjnNodeReasonRequiredError();
assert('FjnNodeReasonRequiredError code 正确', err10.code === 'NODE_REASON_REQUIRED');
assert('FjnNodeReasonRequiredError httpStatus = 400', err10.httpStatus === 400);

assert('isFjnNodeErrorCode(NODE_NOT_FOUND) = true', isFjnNodeErrorCode('NODE_NOT_FOUND'));
assert('isFjnNodeErrorCode(INVALID) = false', !isFjnNodeErrorCode('INVALID'));
assert('getNodeErrorCodeCount() === 58', getNodeErrorCodeCount() === 58);

// ============================================================
// [18] Service 类实例化
// ============================================================
console.log('\n[18] Service 类实例化');
const svc1 = new FjnNodeService();
assert('FjnNodeService 实例化成功', svc1 instanceof FjnNodeService);
assert('FjnNodeService 名称正确', svc1['serviceName'] === 'FjnNodeService');

const svc2 = createFjnNodeService();
assert('createFjnNodeService 工厂方法成功', svc2 instanceof FjnNodeService);

const svc3 = new FjnNodeService({ serviceName: 'CustomNodeService' });
assert('自定义 serviceName 生效', svc3['serviceName'] === 'CustomNodeService');

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
