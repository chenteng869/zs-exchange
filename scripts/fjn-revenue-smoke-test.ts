/**
 * FJN Revenue Service 冒烟测试
 *
 * 验证：
 *  - 状态机常量完整性
 *  - 状态机转移合法性
 *  - 状态机工具函数
 *  - 事件常量与 Payload
 *  - 错误码 + 异常类
 *  - 分账池类型与默认规则
 *  - Service 类可实例化
 *  - 业务编号生成
 *  - 跨 Service 联动验证
 */
import {
  // 状态机
  ALLOCATION_STATUS,
  ALLOCATION_STATUS_TRANSITIONS,
  ALL_ALLOCATION_STATUSES,
  TERMINAL_ALLOCATION_STATUSES,
  REVERSAL_STATUS,
  REVERSAL_STATUS_TRANSITIONS,
  ALL_REVERSAL_STATUSES,
  TERMINAL_REVERSAL_STATUSES,
  REVENUE_POOLS,
  WINE_369_REVENUE_RULE,
  canTransitAllocationStatus,
  canTransitReversalStatus,
  assertTransitAllocationStatus,
  assertTransitReversalStatus,
  isTerminalAllocationStatus,
  isTerminalReversalStatus,
  isApprovable,
  isReversible,
  isCancellableAllocation,
  isRiskCheckable,
  isAllocationSettled,
  nextAllocationStatuses,
  nextReversalStatuses,
  type FjnAllocationStatus,
  type FjnReversalStatus,
  type FjnRevenuePoolType,
  // 事件
  REVENUE_EVENTS,
  REVENUE_EVENT_SOURCES,
  ALL_REVENUE_EVENTS,
  isValidRevenueEvent,
  isValidRevenueEventSource,
  extractDomain,
  extractAction,
  type AllocatedPayload,
  type ApprovedPayload,
  type ReversedPayload,
  // 错误
  REVENUE_ERROR_CODES,
  FjnRevenueError,
  FjnAllocationNotFoundError,
  FjnAllocationAlreadyExistsError,
  FjnAllocationStatusInvalidError,
  FjnAllocationTerminalStatusError,
  FjnAllocationNotReversibleError,
  FjnAllocationNotApprovableError,
  FjnAllocationAmountInvalidError,
  FjnAllocationAmountZeroError,
  FjnReversalNotFoundError,
  FjnReversalAlreadyExistsError,
  FjnReversalStatusInvalidError,
  FjnReversalAmountInvalidError,
  FjnReversalAmountExceedsError,
  FjnRevenueOrderNotFoundError,
  FjnRevenueOrderNotPaidError,
  FjnRuleNotFoundError,
  FjnRuleInvalidError,
  FjnRuleInactiveError,
  FjnReviewerRequiredError,
  isFjnRevenueErrorCode,
  getRevenueErrorCodeCount,
  type FjnRevenueErrorCode,
  // Service
  FjnRevenueService,
  createFjnRevenueService,
  type CreateAllocationInput,
  type ApproveAllocationInput,
  type CreateReversalInput,
} from '../src/lib/fjn';

let pass = 0;
let fail = 0;
function assert(name: string, cond: boolean, info?: any) {
  if (cond) {
    console.log(`  ✅ ${name}`);
    pass++;
  } else {
    console.log(`  ❌ ${name}`, info ?? '');
    fail++;
  }
}

console.log('=== FJN Revenue Service 冒烟测试 ===\n');

// ============================================================
// [1] 分账主表状态常量
// ============================================================
console.log('[1] 分账主表状态常量');
assert('ALLOCATION_STATUS 包含 7 个状态', Object.keys(ALLOCATION_STATUS).length === 7, Object.keys(ALLOCATION_STATUS).length);
assert('PENDING = pending', ALLOCATION_STATUS.PENDING === 'pending');
assert('CALCULATED = calculated', ALLOCATION_STATUS.CALCULATED === 'calculated');
assert('RISK_CHECKING = risk_checking', ALLOCATION_STATUS.RISK_CHECKING === 'risk_checking');
assert('APPROVED = approved', ALLOCATION_STATUS.APPROVED === 'approved');
assert('SETTLED = settled', ALLOCATION_STATUS.SETTLED === 'settled');
assert('REVERSED = reversed', ALLOCATION_STATUS.REVERSED === 'reversed');
assert('CANCELLED = cancelled', ALLOCATION_STATUS.CANCELLED === 'cancelled');
assert('ALL_ALLOCATION_STATUSES 包含 7 个', ALL_ALLOCATION_STATUSES.length === 7);
assert('TERMINAL_ALLOCATION_STATUSES 包含 2 个', TERMINAL_ALLOCATION_STATUSES.length === 2);

// ============================================================
// [2] 冲销表状态常量
// ============================================================
console.log('\n[2] 冲销表状态常量');
assert('REVERSAL_STATUS 包含 4 个', Object.keys(REVERSAL_STATUS).length === 4, Object.keys(REVERSAL_STATUS).length);
assert('CREATED = created', REVERSAL_STATUS.CREATED === 'created');
assert('APPROVED = approved', REVERSAL_STATUS.APPROVED === 'approved');
assert('COMPLETED = completed', REVERSAL_STATUS.COMPLETED === 'completed');
assert('CANCELLED = cancelled', REVERSAL_STATUS.CANCELLED === 'cancelled');
assert('ALL_REVERSAL_STATUSES 包含 4 个', ALL_REVERSAL_STATUSES.length === 4);
assert('TERMINAL_REVERSAL_STATUSES 包含 2 个', TERMINAL_REVERSAL_STATUSES.length === 2);

// ============================================================
// [3] 分账池类型与默认规则
// ============================================================
console.log('\n[3] 分账池类型与默认规则');
assert('REVENUE_POOLS 包含 10 种', Object.keys(REVENUE_POOLS).length === 10, Object.keys(REVENUE_POOLS).length);
assert('WINE_COST_POOL = wine_cost_pool', REVENUE_POOLS.WINE_COST_POOL === 'wine_cost_pool');
assert('MARKET_ECOSYSTEM_POOL = market_ecosystem_pool', REVENUE_POOLS.MARKET_ECOSYSTEM_POOL === 'market_ecosystem_pool');
assert('COMPANY_POOL = company_pool', REVENUE_POOLS.COMPANY_POOL === 'company_pool');
assert('REFERRAL_REWARD_POOL = referral_reward_pool', REVENUE_POOLS.REFERRAL_REWARD_POOL === 'referral_reward_pool');
assert('TEAM_REWARD_POOL = team_reward_pool', REVENUE_POOLS.TEAM_REWARD_POOL === 'team_reward_pool');
assert('NODE_REWARD_POOL = node_reward_pool', REVENUE_POOLS.NODE_REWARD_POOL === 'node_reward_pool');
assert('WINE_369_REVENUE_RULE 包含 3 个', WINE_369_REVENUE_RULE.length === 3);
assert('WINE_369 默认比例 0.40', WINE_369_REVENUE_RULE[0].percentage === '0.40');
assert('WINE_369 默认比例 0.30', WINE_369_REVENUE_RULE[1].percentage === '0.30');
assert('WINE_369 默认比例 0.30', WINE_369_REVENUE_RULE[2].percentage === '0.30');
assert('比例之和 = 1.0', (0.40 + 0.30 + 0.30).toFixed(2) === '1.00');

// ============================================================
// [4] 分账状态机 - 合法转移
// ============================================================
console.log('\n[4] 分账状态机 - 合法转移');
assert('pending -> calculated 合法', canTransitAllocationStatus(ALLOCATION_STATUS.PENDING, ALLOCATION_STATUS.CALCULATED));
assert('pending -> cancelled 合法', canTransitAllocationStatus(ALLOCATION_STATUS.PENDING, ALLOCATION_STATUS.CANCELLED));
assert('calculated -> risk_checking 合法', canTransitAllocationStatus(ALLOCATION_STATUS.CALCULATED, ALLOCATION_STATUS.RISK_CHECKING));
assert('calculated -> approved 合法', canTransitAllocationStatus(ALLOCATION_STATUS.CALCULATED, ALLOCATION_STATUS.APPROVED));
assert('calculated -> cancelled 合法', canTransitAllocationStatus(ALLOCATION_STATUS.CALCULATED, ALLOCATION_STATUS.CANCELLED));
assert('risk_checking -> approved 合法', canTransitAllocationStatus(ALLOCATION_STATUS.RISK_CHECKING, ALLOCATION_STATUS.APPROVED));
assert('approved -> settled 合法', canTransitAllocationStatus(ALLOCATION_STATUS.APPROVED, ALLOCATION_STATUS.SETTLED));
assert('approved -> reversed 合法', canTransitAllocationStatus(ALLOCATION_STATUS.APPROVED, ALLOCATION_STATUS.REVERSED));
assert('approved -> cancelled 合法', canTransitAllocationStatus(ALLOCATION_STATUS.APPROVED, ALLOCATION_STATUS.CANCELLED));
assert('settled -> reversed 合法', canTransitAllocationStatus(ALLOCATION_STATUS.SETTLED, ALLOCATION_STATUS.REVERSED));

// ============================================================
// [5] 分账状态机 - 非法转移
// ============================================================
console.log('\n[5] 分账状态机 - 非法转移');
assert('pending -> approved 非法（需 calculated）', !canTransitAllocationStatus(ALLOCATION_STATUS.PENDING, ALLOCATION_STATUS.APPROVED));
assert('pending -> settled 非法', !canTransitAllocationStatus(ALLOCATION_STATUS.PENDING, ALLOCATION_STATUS.SETTLED));
assert('pending -> reversed 非法', !canTransitAllocationStatus(ALLOCATION_STATUS.PENDING, ALLOCATION_STATUS.REVERSED));
assert('calculated -> settled 非法（需 approved）', !canTransitAllocationStatus(ALLOCATION_STATUS.CALCULATED, ALLOCATION_STATUS.SETTLED));
assert('approved -> pending 非法', !canTransitAllocationStatus(ALLOCATION_STATUS.APPROVED, ALLOCATION_STATUS.PENDING));
assert('reversed -> 任何 非法（终态）', !canTransitAllocationStatus(ALLOCATION_STATUS.REVERSED, ALLOCATION_STATUS.APPROVED));
assert('cancelled -> 任何 非法（终态）', !canTransitAllocationStatus(ALLOCATION_STATUS.CANCELLED, ALLOCATION_STATUS.APPROVED));
assert('settled -> approved 非法（不可回退）', !canTransitAllocationStatus(ALLOCATION_STATUS.SETTLED, ALLOCATION_STATUS.APPROVED));
assert('settled -> cancelled 非法', !canTransitAllocationStatus(ALLOCATION_STATUS.SETTLED, ALLOCATION_STATUS.CANCELLED));

// ============================================================
// [6] 冲销状态机 - 合法转移
// ============================================================
console.log('\n[6] 冲销状态机 - 合法转移');
assert('created -> approved 合法', canTransitReversalStatus(REVERSAL_STATUS.CREATED, REVERSAL_STATUS.APPROVED));
assert('created -> cancelled 合法', canTransitReversalStatus(REVERSAL_STATUS.CREATED, REVERSAL_STATUS.CANCELLED));
assert('approved -> completed 合法', canTransitReversalStatus(REVERSAL_STATUS.APPROVED, REVERSAL_STATUS.COMPLETED));
assert('approved -> cancelled 合法', canTransitReversalStatus(REVERSAL_STATUS.APPROVED, REVERSAL_STATUS.CANCELLED));

// ============================================================
// [7] 冲销状态机 - 非法转移
// ============================================================
console.log('\n[7] 冲销状态机 - 非法转移');
assert('created -> completed 非法（需 approved）', !canTransitReversalStatus(REVERSAL_STATUS.CREATED, REVERSAL_STATUS.COMPLETED));
assert('completed -> 任何 非法（终态）', !canTransitReversalStatus(REVERSAL_STATUS.COMPLETED, REVERSAL_STATUS.APPROVED));
assert('cancelled -> 任何 非法（终态）', !canTransitReversalStatus(REVERSAL_STATUS.CANCELLED, REVERSAL_STATUS.APPROVED));

// ============================================================
// [8] 状态机 - 强制转移
// ============================================================
console.log('\n[8] 状态机 - 强制转移');
try {
  assertTransitAllocationStatus(ALLOCATION_STATUS.PENDING, ALLOCATION_STATUS.CALCULATED);
  assert('合法分账转移不抛错', true);
} catch (e: any) {
  assert('合法分账转移不抛错', false, e?.message);
}
try {
  assertTransitAllocationStatus(ALLOCATION_STATUS.PENDING, ALLOCATION_STATUS.SETTLED);
  assert('非法分账转移抛错', false);
} catch (e: any) {
  assert('非法分账转移抛错', e?.name === 'FjnStateMachineError' || e?.code?.includes('STATE'));
}
try {
  assertTransitReversalStatus(REVERSAL_STATUS.CREATED, REVERSAL_STATUS.COMPLETED);
  assert('非法冲销转移抛错', false);
} catch (e: any) {
  assert('非法冲销转移抛错', e?.name === 'FjnStateMachineError' || e?.code?.includes('STATE'));
}

// ============================================================
// [9] 状态机 - 工具函数
// ============================================================
console.log('\n[9] 状态机 - 工具函数');
assert('isTerminalAllocationStatus(pending) = false', !isTerminalAllocationStatus(ALLOCATION_STATUS.PENDING));
assert('isTerminalAllocationStatus(reversed) = true', isTerminalAllocationStatus(ALLOCATION_STATUS.REVERSED));
assert('isTerminalAllocationStatus(cancelled) = true', isTerminalAllocationStatus(ALLOCATION_STATUS.CANCELLED));
assert('isTerminalReversalStatus(completed) = true', isTerminalReversalStatus(REVERSAL_STATUS.COMPLETED));
assert('isTerminalReversalStatus(cancelled) = true', isTerminalReversalStatus(REVERSAL_STATUS.CANCELLED));
assert('isTerminalReversalStatus(created) = false', !isTerminalReversalStatus(REVERSAL_STATUS.CREATED));
assert('isApprovable(calculated) = true', isApprovable(ALLOCATION_STATUS.CALCULATED));
assert('isApprovable(risk_checking) = true', isApprovable(ALLOCATION_STATUS.RISK_CHECKING));
assert('isApprovable(pending) = false', !isApprovable(ALLOCATION_STATUS.PENDING));
assert('isApprovable(approved) = false', !isApprovable(ALLOCATION_STATUS.APPROVED));
assert('isReversible(approved) = true', isReversible(ALLOCATION_STATUS.APPROVED));
assert('isReversible(settled) = true', isReversible(ALLOCATION_STATUS.SETTLED));
assert('isReversible(calculated) = false', !isReversible(ALLOCATION_STATUS.CALCULATED));
assert('isReversible(reversed) = false', !isReversible(ALLOCATION_STATUS.REVERSED));
assert('isCancellableAllocation(pending) = true', isCancellableAllocation(ALLOCATION_STATUS.PENDING));
assert('isCancellableAllocation(calculated) = true', isCancellableAllocation(ALLOCATION_STATUS.CALCULATED));
assert('isCancellableAllocation(reversed) = false', !isCancellableAllocation(ALLOCATION_STATUS.REVERSED));
assert('isCancellableAllocation(cancelled) = false', !isCancellableAllocation(ALLOCATION_STATUS.CANCELLED));
assert('isRiskCheckable(calculated) = true', isRiskCheckable(ALLOCATION_STATUS.CALCULATED));
assert('isRiskCheckable(pending) = false', !isRiskCheckable(ALLOCATION_STATUS.PENDING));
assert('isAllocationSettled(settled) = true', isAllocationSettled(ALLOCATION_STATUS.SETTLED));
assert('isAllocationSettled(approved) = false', !isAllocationSettled(ALLOCATION_STATUS.APPROVED));
assert('pending 可转移到 2 个状态', nextAllocationStatuses(ALLOCATION_STATUS.PENDING).length === 2);
assert('approved 可转移到 3 个状态', nextAllocationStatuses(ALLOCATION_STATUS.APPROVED).length === 3);
assert('reversed 是终态（0 个可转移）', nextAllocationStatuses(ALLOCATION_STATUS.REVERSED).length === 0);
assert('冲销 created 可转移到 2 个状态', nextReversalStatuses(REVERSAL_STATUS.CREATED).length === 2);

// ============================================================
// [10] 事件常量
// ============================================================
console.log('\n[10] 事件常量');
assert('REVENUE_EVENTS 包含 8 个事件', Object.keys(REVENUE_EVENTS).length === 8, Object.keys(REVENUE_EVENTS).length);
assert('ALLOCATION_REQUESTED = revenue.allocation_requested.v1', REVENUE_EVENTS.ALLOCATION_REQUESTED === 'revenue.allocation_requested.v1');
assert('ALLOCATED = revenue.allocated.v1', REVENUE_EVENTS.ALLOCATED === 'revenue.allocated.v1');
assert('APPROVED = revenue.approved.v1', REVENUE_EVENTS.APPROVED === 'revenue.approved.v1');
assert('SETTLED = revenue.settled.v1', REVENUE_EVENTS.SETTLED === 'revenue.settled.v1');
assert('REVERSAL_REQUESTED = revenue.reversal_requested.v1', REVENUE_EVENTS.REVERSAL_REQUESTED === 'revenue.reversal_requested.v1');
assert('REVERSED = revenue.reversed.v1', REVENUE_EVENTS.REVERSED === 'revenue.reversed.v1');
assert('ALL_REVENUE_EVENTS 包含 8 个', ALL_REVENUE_EVENTS.length === 8);
assert('REVENUE_EVENT_SOURCES 包含 9 个', Object.keys(REVENUE_EVENT_SOURCES).length === 9, Object.keys(REVENUE_EVENT_SOURCES).length);
assert('SYSTEM = system', REVENUE_EVENT_SOURCES.SYSTEM === 'system');
assert('ORDER = order', REVENUE_EVENT_SOURCES.ORDER === 'order');
assert('FINANCE = finance', REVENUE_EVENT_SOURCES.FINANCE === 'finance');
assert('isValidRevenueEvent(ALLOCATED) = true', isValidRevenueEvent(REVENUE_EVENTS.ALLOCATED));
assert('isValidRevenueEvent(foo) = false', !isValidRevenueEvent('foo'));
assert('isValidRevenueEventSource(SYSTEM) = true', isValidRevenueEventSource(REVENUE_EVENT_SOURCES.SYSTEM));
assert('isValidRevenueEventSource(bar) = false', !isValidRevenueEventSource('bar'));
assert('extractDomain(revenue.allocated.v1) = revenue', extractDomain(REVENUE_EVENTS.ALLOCATED) === 'revenue');
assert('extractAction(revenue.allocated.v1) = allocated', extractAction(REVENUE_EVENTS.ALLOCATED) === 'allocated');

// ============================================================
// [11] 事件 Payload
// ============================================================
console.log('\n[11] 事件 Payload 类型校验');
const allocatedPayload: AllocatedPayload = {
  allocation_id: 'a1',
  allocation_no: 'ALC001',
  order_id: 'o1',
  user_id: 'u1',
  product_type: 'wine_369',
  paid_amount: '369',
  tax_amount: '0',
  net_amount: '369',
  currency: 'USD',
  rule_id: 'r1',
  rule_version: 'V1',
  status: ALLOCATION_STATUS.CALCULATED,
  items: [
    { pool_type: REVENUE_POOLS.WINE_COST_POOL, percentage: '0.40', amount: '147.6', currency: 'USD' },
  ],
  occurred_at: '2026-07-01T00:00:00.000Z',
  source: REVENUE_EVENT_SOURCES.ORDER,
};
assert('AllocatedPayload 可构造', allocatedPayload.allocation_id === 'a1');

const approvedPayload: ApprovedPayload = {
  allocation_id: 'a1',
  allocation_no: 'ALC001',
  order_id: 'o1',
  user_id: 'u1',
  currency: 'USD',
  reviewer_id: 'admin',
  review_note: 'ok',
  approved_at: '2026-07-01T00:00:00.000Z',
  occurred_at: '2026-07-01T00:00:00.000Z',
  source: REVENUE_EVENT_SOURCES.ADMIN,
};
assert('ApprovedPayload 可构造', approvedPayload.reviewer_id === 'admin');

const reversedPayload: ReversedPayload = {
  reversal_id: 'rv1',
  reversal_no: 'RVR001',
  original_allocation_id: 'a1',
  order_id: 'o1',
  refund_id: 'rfn1',
  reversed_amount: '369',
  currency: 'USD',
  items: [{ pool_type: REVENUE_POOLS.WINE_COST_POOL, reverse_amount: '-147.6' }],
  occurred_at: '2026-07-01T00:00:00.000Z',
  source: REVENUE_EVENT_SOURCES.REVERSAL,
};
assert('ReversedPayload 可构造', reversedPayload.reversal_id === 'rv1');

// ============================================================
// [12] 错误码 + 异常类
// ============================================================
console.log('\n[12] 错误码 + 异常类');
assert('REVENUE_ERROR_CODES 包含 35+ 个', getRevenueErrorCodeCount() >= 35, getRevenueErrorCodeCount());
assert('ALLOCATION_NOT_FOUND 存在', REVENUE_ERROR_CODES.ALLOCATION_NOT_FOUND === 'REVENUE_ALLOCATION_NOT_FOUND');
assert('REVERSAL_NOT_FOUND 存在', REVENUE_ERROR_CODES.REVERSAL_NOT_FOUND === 'REVENUE_REVERSAL_NOT_FOUND');
assert('RULE_NOT_FOUND 存在', REVENUE_ERROR_CODES.RULE_NOT_FOUND === 'REVENUE_RULE_NOT_FOUND');
assert('ALLOCATED 状态码一致', REVENUE_ERROR_CODES.ALLOCATION_NOT_REVERSIBLE === 'REVENUE_ALLOCATION_NOT_REVERSIBLE');

// 异常类
try {
  throw new FjnAllocationNotFoundError('test', { id: 'a1' });
} catch (e: any) {
  assert('FjnAllocationNotFoundError.name 正确', e.name === 'FjnAllocationNotFoundError');
  assert('FjnAllocationNotFoundError.code 正确', e.code === 'REVENUE_ALLOCATION_NOT_FOUND');
  assert('FjnAllocationNotFoundError.httpStatus = 404', e.httpStatus === 404);
}
try {
  throw new FjnAllocationAlreadyExistsError();
} catch (e: any) {
  assert('FjnAllocationAlreadyExistsError.code 正确', e.code === 'REVENUE_ALLOCATION_ALREADY_EXISTS');
  assert('FjnAllocationAlreadyExistsError.httpStatus = 409', e.httpStatus === 409);
}
try {
  throw new FjnAllocationStatusInvalidError();
} catch (e: any) {
  assert('FjnAllocationStatusInvalidError.httpStatus = 422', e.httpStatus === 422);
}
try {
  throw new FjnAllocationAmountZeroError();
} catch (e: any) {
  assert('FjnAllocationAmountZeroError.httpStatus = 400', e.httpStatus === 400);
}
try {
  throw new FjnReversalNotFoundError();
} catch (e: any) {
  assert('FjnReversalNotFoundError.name 正确', e.name === 'FjnReversalNotFoundError');
  assert('FjnReversalNotFoundError.httpStatus = 404', e.httpStatus === 404);
}
try {
  throw new FjnReversalAlreadyExistsError();
} catch (e: any) {
  assert('FjnReversalAlreadyExistsError.httpStatus = 409', e.httpStatus === 409);
}
try {
  throw new FjnReversalStatusInvalidError();
} catch (e: any) {
  assert('FjnReversalStatusInvalidError.httpStatus = 422', e.httpStatus === 422);
}
try {
  throw new FjnReversalAmountExceedsError();
} catch (e: any) {
  assert('FjnReversalAmountExceedsError.httpStatus = 422', e.httpStatus === 422);
}
try {
  throw new FjnRevenueOrderNotFoundError();
} catch (e: any) {
  assert('FjnRevenueOrderNotFoundError.httpStatus = 404', e.httpStatus === 404);
}
try {
  throw new FjnRevenueOrderNotPaidError();
} catch (e: any) {
  assert('FjnRevenueOrderNotPaidError.httpStatus = 422', e.httpStatus === 422);
}
try {
  throw new FjnRuleNotFoundError();
} catch (e: any) {
  assert('FjnRuleNotFoundError.httpStatus = 404', e.httpStatus === 404);
}
try {
  throw new FjnRuleInvalidError();
} catch (e: any) {
  assert('FjnRuleInvalidError.httpStatus = 400', e.httpStatus === 400);
}
try {
  throw new FjnRuleInactiveError();
} catch (e: any) {
  assert('FjnRuleInactiveError.httpStatus = 422', e.httpStatus === 422);
}
try {
  throw new FjnReviewerRequiredError();
} catch (e: any) {
  assert('FjnReviewerRequiredError.httpStatus = 400', e.httpStatus === 400);
}
try {
  throw new FjnAllocationTerminalStatusError();
} catch (e: any) {
  assert('FjnAllocationTerminalStatusError.httpStatus = 422', e.httpStatus === 422);
}
try {
  throw new FjnAllocationNotReversibleError();
} catch (e: any) {
  assert('FjnAllocationNotReversibleError.httpStatus = 422', e.httpStatus === 422);
}
try {
  throw new FjnAllocationNotApprovableError();
} catch (e: any) {
  assert('FjnAllocationNotApprovableError.httpStatus = 422', e.httpStatus === 422);
}
try {
  throw new FjnAllocationAmountInvalidError();
} catch (e: any) {
  assert('FjnAllocationAmountInvalidError.httpStatus = 400', e.httpStatus === 400);
}
try {
  throw new FjnReversalAmountInvalidError();
} catch (e: any) {
  assert('FjnReversalAmountInvalidError.httpStatus = 400', e.httpStatus === 400);
}
assert('isFjnRevenueErrorCode(ALLOCATION_NOT_FOUND) = true', isFjnRevenueErrorCode(REVENUE_ERROR_CODES.ALLOCATION_NOT_FOUND));
assert('isFjnRevenueErrorCode(FOO_BAR) = false', !isFjnRevenueErrorCode('FOO_BAR'));

// ============================================================
// [13] 状态流转表完整性
// ============================================================
console.log('\n[13] 状态流转表完整性');
assert('所有 7 个分账状态都在流转表中', ALL_ALLOCATION_STATUSES.every((s) => ALLOCATION_STATUS_TRANSITIONS[s] !== undefined));
assert('所有分账状态的转移都是数组', ALL_ALLOCATION_STATUSES.every((s) => Array.isArray(ALLOCATION_STATUS_TRANSITIONS[s])));
assert('所有分账终态的转移列表都为空', TERMINAL_ALLOCATION_STATUSES.every((s) => ALLOCATION_STATUS_TRANSITIONS[s].length === 0));
assert('所有 4 个冲销状态都在流转表中', ALL_REVERSAL_STATUSES.every((s) => REVERSAL_STATUS_TRANSITIONS[s] !== undefined));
assert('所有冲销终态的转移列表都为空', TERMINAL_REVERSAL_STATUSES.every((s) => REVERSAL_STATUS_TRANSITIONS[s].length === 0));

// ============================================================
// [14] Service 类可实例化
// ============================================================
console.log('\n[14] Service 类可实例化');
try {
  const svc = new FjnRevenueService();
  assert('FjnRevenueService 可实例化', svc !== null);
  assert('serviceName 默认值', svc['serviceName'] === 'FjnRevenueService');
  assert('prisma 已注入', svc['prisma'] !== undefined);
} catch (e: any) {
  assert('FjnRevenueService 可实例化', false, e?.message);
}
try {
  const svc2 = createFjnRevenueService({ serviceName: 'CustomRevenue' });
  assert('createFjnRevenueService factory 正常', svc2['serviceName'] === 'CustomRevenue');
} catch (e: any) {
  assert('createFjnRevenueService factory 正常', false, e?.message);
}

// ============================================================
// [15] 模块导出完整性
// ============================================================
console.log('\n[15] 模块导出完整性');
assert('state-machine 导出 ALLOCATION_STATUS', ALLOCATION_STATUS !== undefined);
assert('state-machine 导出 canTransitAllocationStatus', typeof canTransitAllocationStatus === 'function');
assert('events 导出 REVENUE_EVENTS', REVENUE_EVENTS !== undefined);
assert('events 导出 REVENUE_EVENT_SOURCES', REVENUE_EVENT_SOURCES !== undefined);
assert('errors 导出 REVENUE_ERROR_CODES', REVENUE_ERROR_CODES !== undefined);
assert('errors 导出 FjnAllocationNotFoundError', typeof FjnAllocationNotFoundError === 'function');

// ============================================================
// [16] 跨 Service 联动验证
// ============================================================
console.log('\n[16] 跨 Service 联动验证');
try {
  // 确认 RevenueService 可与 FjnOrderService / FjnPaymentService 一起导入
  const { FjnOrderService } = require('../src/lib/fjn/services/order-service');
  const { FjnPaymentService } = require('../src/lib/fjn/services/payment-service');
  assert('FjnRevenueService + FjnOrderService + FjnPaymentService 可同时导入', true);
} catch (e: any) {
  assert('FjnRevenueService + FjnOrderService + FjnPaymentService 可同时导入', false, e?.message);
}

// ============================================================
console.log('\n========== 测试结果 ==========');
console.log(`✅ 通过: ${pass}`);
console.log(`❌ 失败: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
