/**
 * FJN Order Service 冒烟测试
 *
 * 验证内容：
 *  - 状态机：合法/非法转移
 *  - 事件常量：所有事件命名规范
 *  - 错误码：枚举 + 异常类
 *  - 工具函数：isCancellable / isPayable / isFulfilling / nextOrderStatuses
 *  - 业务编号：OrderNo 生成
 *
 * 说明：
 *  - 本测试只覆盖纯逻辑部分（不依赖数据库）
 *  - 数据库相关方法（create / cancel / markPaid 等）需在真实 DB 环境下测试
 *    或后续用 mock prisma 测试
 */

import {
  ORDER_STATUS,
  ORDER_STATUS_TRANSITIONS,
  ALL_ORDER_STATUSES,
  TERMINAL_ORDER_STATUSES,
  canTransitOrderStatus,
  assertTransitOrderStatus,
  nextOrderStatuses,
  isTerminalOrderStatus,
  isCancellable,
  isPayable,
  isFulfilling,
  ORDER_EVENTS,
  ORDER_EVENT_SOURCES,
  ORDER_ERROR_CODES,
  FjnOrderNotFoundError,
  FjnOrderStatusInvalidError,
  FjnProductNotActiveError,
  FjnStockInsufficientError,
  FjnOrderAmountInvalidError,
  FjnOrderRegionBlockedError,
  ORDER_PAYMENT_STATUS,
  ORDER_REFUND_STATUS,
  ORDER_RISK_STATUS,
  ORDER_TYPES,
} from '../src/lib/fjn';

let pass = 0, fail = 0;
function assert(name: string, cond: boolean, info?: any) {
  if (cond) { console.log(`  ✅ ${name}`); pass++; }
  else { console.log(`  ❌ ${name}`, info ?? ''); fail++; }
}

console.log('=== FJN Order Service 冒烟测试 ===\n');

// ============================================================
// [1] 状态常量
// ============================================================
console.log('[1] 状态常量');
assert('ORDER_STATUS 包含 18 个状态', Object.keys(ORDER_STATUS).length === 18, Object.keys(ORDER_STATUS).length);
assert('CREATED = created', ORDER_STATUS.CREATED === 'created');
assert('PENDING_PAYMENT = pending_payment', ORDER_STATUS.PENDING_PAYMENT === 'pending_payment');
assert('PAID = paid', ORDER_STATUS.PAID === 'paid');
assert('REFUNDED = refunded', ORDER_STATUS.REFUNDED === 'refunded');
assert('EXPIRED = expired', ORDER_STATUS.EXPIRED === 'expired');
assert('ALL_ORDER_STATUSES 包含 18 个', ALL_ORDER_STATUSES.length === 18);
assert('TERMINAL_ORDER_STATUSES 包含 4 个', TERMINAL_ORDER_STATUSES.length === 4);

console.log('\n[2] 支付/退款/风控状态常量');
assert('ORDER_PAYMENT_STATUS 包含 6 个', Object.keys(ORDER_PAYMENT_STATUS).length === 6);
assert('ORDER_REFUND_STATUS 包含 6 个', Object.keys(ORDER_REFUND_STATUS).length === 6);
assert('ORDER_RISK_STATUS 包含 5 个', Object.keys(ORDER_RISK_STATUS).length === 5);
assert('ORDER_TYPES 包含 8 个类型', Object.keys(ORDER_TYPES).length === 8);

// ============================================================
// [3] 状态机：合法转移
// ============================================================
console.log('\n[3] 状态机 - 合法转移');
assert('created -> pending_payment 合法', canTransitOrderStatus(ORDER_STATUS.CREATED, ORDER_STATUS.PENDING_PAYMENT));
assert('created -> cancelled 合法', canTransitOrderStatus(ORDER_STATUS.CREATED, ORDER_STATUS.CANCELLED));
assert('pending_payment -> paid 合法', canTransitOrderStatus(ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAID));
assert('pending_payment -> payment_processing 合法', canTransitOrderStatus(ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYMENT_PROCESSING));
assert('pending_payment -> expired 合法', canTransitOrderStatus(ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.EXPIRED));
assert('paid -> confirmed 合法', canTransitOrderStatus(ORDER_STATUS.PAID, ORDER_STATUS.CONFIRMED));
assert('paid -> risk_hold 合法', canTransitOrderStatus(ORDER_STATUS.PAID, ORDER_STATUS.RISK_HOLD));
assert('confirmed -> fulfilling 合法', canTransitOrderStatus(ORDER_STATUS.CONFIRMED, ORDER_STATUS.FULFILLING));
assert('fulfilling -> fulfilled 合法', canTransitOrderStatus(ORDER_STATUS.FULFILLING, ORDER_STATUS.FULFILLED));
assert('fulfilled -> completed 合法', canTransitOrderStatus(ORDER_STATUS.FULFILLED, ORDER_STATUS.COMPLETED));
assert('refund_requested -> refund_reviewing 合法', canTransitOrderStatus(ORDER_STATUS.REFUND_REQUESTED, ORDER_STATUS.REFUND_REVIEWING));
assert('refund_reviewing -> refunded 合法', canTransitOrderStatus(ORDER_STATUS.REFUND_REVIEWING, ORDER_STATUS.REFUNDED));
assert('refund_reviewing -> partial_refunded 合法', canTransitOrderStatus(ORDER_STATUS.REFUND_REVIEWING, ORDER_STATUS.PARTIAL_REFUNDED));
assert('partial_refunded -> completed 合法', canTransitOrderStatus(ORDER_STATUS.PARTIAL_REFUNDED, ORDER_STATUS.COMPLETED));
assert('risk_hold -> confirmed 合法', canTransitOrderStatus(ORDER_STATUS.RISK_HOLD, ORDER_STATUS.CONFIRMED));
assert('risk_hold -> cancelled 合法', canTransitOrderStatus(ORDER_STATUS.RISK_HOLD, ORDER_STATUS.CANCELLED));

// ============================================================
// [4] 状态机：非法转移
// ============================================================
console.log('\n[4] 状态机 - 非法转移');
assert('created -> paid 非法', !canTransitOrderStatus(ORDER_STATUS.CREATED, ORDER_STATUS.PAID));
assert('created -> confirmed 非法', !canTransitOrderStatus(ORDER_STATUS.CREATED, ORDER_STATUS.CONFIRMED));
assert('pending_payment -> fulfilled 非法', !canTransitOrderStatus(ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.FULFILLED));
assert('pending_payment -> completed 非法', !canTransitOrderStatus(ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.COMPLETED));
assert('paid -> cancelled 非法', !canTransitOrderStatus(ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED));
assert('paid -> fulfilled 非法', !canTransitOrderStatus(ORDER_STATUS.PAID, ORDER_STATUS.FULFILLED));
assert('confirmed -> created 非法', !canTransitOrderStatus(ORDER_STATUS.CONFIRMED, ORDER_STATUS.CREATED));
assert('cancelled -> pending_payment 非法（终态）', !canTransitOrderStatus(ORDER_STATUS.CANCELLED, ORDER_STATUS.PENDING_PAYMENT));
assert('cancelled -> paid 非法（终态）', !canTransitOrderStatus(ORDER_STATUS.CANCELLED, ORDER_STATUS.PAID));
assert('refunded -> anything 非法（终态）', !canTransitOrderStatus(ORDER_STATUS.REFUNDED, ORDER_STATUS.COMPLETED));
assert('failed -> paid 非法（终态）', !canTransitOrderStatus(ORDER_STATUS.FAILED, ORDER_STATUS.PAID));
assert('expired -> pending_payment 非法（终态）', !canTransitOrderStatus(ORDER_STATUS.EXPIRED, ORDER_STATUS.PENDING_PAYMENT));
assert('completed -> fulfilling 非法（completed 只能退款）', !canTransitOrderStatus(ORDER_STATUS.COMPLETED, ORDER_STATUS.FULFILLING));
assert('completed -> cancelled 非法', !canTransitOrderStatus(ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED));

// ============================================================
// [5] 状态机：强制转移
// ============================================================
console.log('\n[5] 状态机 - 强制转移（assertTransitOrderStatus）');
try {
  assertTransitOrderStatus(ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAID);
  assert('合法转移不抛错', true);
} catch (e) {
  assert('合法转移不抛错', false, e);
}
try {
  assertTransitOrderStatus(ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED);
  assert('非法转移抛错', false);
} catch (e: any) {
  assert('非法转移抛 FjnStateMachineError', e.code === 'FJN_STATE_MACHINE');
  assert('异常包含 from/to', e.context?.from === 'paid' && e.context?.to === 'cancelled');
}

// ============================================================
// [6] 状态机：工具函数
// ============================================================
console.log('\n[6] 状态机 - 工具函数');
assert('isTerminalOrderStatus(refunded) = true', isTerminalOrderStatus(ORDER_STATUS.REFUNDED));
assert('isTerminalOrderStatus(cancelled) = true', isTerminalOrderStatus(ORDER_STATUS.CANCELLED));
assert('isTerminalOrderStatus(failed) = true', isTerminalOrderStatus(ORDER_STATUS.FAILED));
assert('isTerminalOrderStatus(expired) = true', isTerminalOrderStatus(ORDER_STATUS.EXPIRED));
assert('isTerminalOrderStatus(paid) = false', !isTerminalOrderStatus(ORDER_STATUS.PAID));
assert('isTerminalOrderStatus(confirmed) = false', !isTerminalOrderStatus(ORDER_STATUS.CONFIRMED));

assert('isCancellable(pending_payment) = true', isCancellable(ORDER_STATUS.PENDING_PAYMENT));
assert('isCancellable(paid) = false', !isCancellable(ORDER_STATUS.PAID));
assert('isCancellable(cancelled) = false', !isCancellable(ORDER_STATUS.CANCELLED));
assert('isCancellable(refunded) = false', !isCancellable(ORDER_STATUS.REFUNDED));
assert('isCancellable(risk_hold) = true', isCancellable(ORDER_STATUS.RISK_HOLD));

assert('isPayable(pending_payment) = true', isPayable(ORDER_STATUS.PENDING_PAYMENT));
assert('isPayable(created) = false', !isPayable(ORDER_STATUS.CREATED));
assert('isPayable(paid) = false（不能再次支付）', !isPayable(ORDER_STATUS.PAID));
assert('isPayable(cancelled) = false', !isPayable(ORDER_STATUS.CANCELLED));

assert('isFulfilling(confirmed) = true', isFulfilling(ORDER_STATUS.CONFIRMED));
assert('isFulfilling(processing) = true', isFulfilling(ORDER_STATUS.PROCESSING));
assert('isFulfilling(fulfilling) = true', isFulfilling(ORDER_STATUS.FULFILLING));
assert('isFulfilling(fulfilled) = true', isFulfilling(ORDER_STATUS.FULFILLED));
assert('isFulfilling(pending_payment) = false', !isFulfilling(ORDER_STATUS.PENDING_PAYMENT));
assert('isFulfilling(paid) = false', !isFulfilling(ORDER_STATUS.PAID));

// ============================================================
// [7] 状态机：nextOrderStatuses
// ============================================================
console.log('\n[7] 状态机 - nextOrderStatuses');
const nextFromCreated = nextOrderStatuses(ORDER_STATUS.CREATED);
assert('created 可转移到 2 个状态', nextFromCreated.length === 2);
assert('created -> pending_payment', nextFromCreated.includes(ORDER_STATUS.PENDING_PAYMENT));
assert('created -> cancelled', nextFromCreated.includes(ORDER_STATUS.CANCELLED));

const nextFromPaid = nextOrderStatuses(ORDER_STATUS.PAID);
assert('paid 可转移到 5 个状态', nextFromPaid.length === 5);

const nextFromRefunded = nextOrderStatuses(ORDER_STATUS.REFUNDED);
assert('refunded 是终态（0 个可转移）', nextFromRefunded.length === 0);

// ============================================================
// [8] 事件常量
// ============================================================
console.log('\n[8] 事件常量');
assert('ORDER_EVENTS 包含 18 个事件', Object.keys(ORDER_EVENTS).length === 18);
assert('ORDER_CREATED = order.created.v1', ORDER_EVENTS.ORDER_CREATED === 'order.created.v1');
assert('ORDER_PAID = order.paid.v1', ORDER_EVENTS.ORDER_PAID === 'order.paid.v1');
assert('ORDER_CANCELLED = order.cancelled.v1', ORDER_EVENTS.ORDER_CANCELLED === 'order.cancelled.v1');
assert('ORDER_REFUNDED = order.refunded.v1', ORDER_EVENTS.ORDER_REFUNDED === 'order.refunded.v1');
assert('ORDER_FULFILLED = order.fulfilled.v1', ORDER_EVENTS.ORDER_FULFILLED === 'order.fulfilled.v1');

// 事件源
assert('ORDER_EVENT_SOURCES 包含 8 个来源', Object.keys(ORDER_EVENT_SOURCES).length === 8);
assert('SYSTEM = system', ORDER_EVENT_SOURCES.SYSTEM === 'system');
assert('USER = user', ORDER_EVENT_SOURCES.USER === 'user');
assert('PAYMENT = payment', ORDER_EVENT_SOURCES.PAYMENT === 'payment');
assert('RISK = risk', ORDER_EVENT_SOURCES.RISK === 'risk');

// ============================================================
// [9] 错误码 + 异常类
// ============================================================
console.log('\n[9] 错误码 + 异常类');
assert('ORDER_ERROR_CODES 包含 35+ 个', Object.keys(ORDER_ERROR_CODES).length >= 35);
assert('ORDER_NOT_FOUND = ORDER_NOT_FOUND', ORDER_ERROR_CODES.ORDER_NOT_FOUND === 'ORDER_NOT_FOUND');
assert('PRODUCT_NOT_ACTIVE = PRODUCT_NOT_ACTIVE', ORDER_ERROR_CODES.PRODUCT_NOT_ACTIVE === 'PRODUCT_NOT_ACTIVE');
assert('ORDER_STOCK_INSUFFICIENT', ORDER_ERROR_CODES.ORDER_STOCK_INSUFFICIENT === 'ORDER_STOCK_INSUFFICIENT');

// FjnOrderNotFoundError
try {
  throw new FjnOrderNotFoundError();
} catch (e: any) {
  assert('FjnOrderNotFoundError.name 正确', e.name === 'FjnOrderNotFoundError');
  assert('FjnOrderNotFoundError.code 正确', e.code === 'ORDER_NOT_FOUND');
  assert('FjnOrderNotFoundError.httpStatus = 404', e.httpStatus === 404);
}

// FjnOrderStatusInvalidError
try {
  throw new FjnOrderStatusInvalidError('测试', { from: 'paid' });
} catch (e: any) {
  assert('FjnOrderStatusInvalidError.code 正确', e.code === 'ORDER_STATUS_INVALID');
  assert('FjnOrderStatusInvalidError.httpStatus = 422', e.httpStatus === 422);
  assert('FjnOrderStatusInvalidError context 传递', e.context?.from === 'paid');
}

// FjnProductNotActiveError
try {
  throw new FjnProductNotActiveError('商品未上架');
} catch (e: any) {
  assert('FjnProductNotActiveError.code 正确', e.code === 'PRODUCT_NOT_ACTIVE');
  assert('FjnProductNotActiveError.httpStatus = 422', e.httpStatus === 422);
}

// FjnStockInsufficientError
try {
  throw new FjnStockInsufficientError('库存不足', { available: 0, requested: 5 });
} catch (e: any) {
  assert('FjnStockInsufficientError.code 正确', e.code === 'ORDER_STOCK_INSUFFICIENT');
  assert('FjnStockInsufficientError.httpStatus = 422', e.httpStatus === 422);
  assert('FjnStockInsufficientError context 完整', e.context?.available === 0 && e.context?.requested === 5);
}

// FjnOrderAmountInvalidError
try {
  throw new FjnOrderAmountInvalidError();
} catch (e: any) {
  assert('FjnOrderAmountInvalidError.code 正确', e.code === 'ORDER_AMOUNT_INVALID');
}

// FjnOrderRegionBlockedError
try {
  throw new FjnOrderRegionBlockedError('地区限制', { country: 'XX' });
} catch (e: any) {
  assert('FjnOrderRegionBlockedError.code 正确', e.code === 'ORDER_REGION_BLOCKED');
  assert('FjnOrderRegionBlockedError.httpStatus = 403', e.httpStatus === 403);
}

// ============================================================
// [10] 状态流转表完整性
// ============================================================
console.log('\n[10] 状态流转表完整性');
let allStatesInFlow = true;
for (const status of ALL_ORDER_STATUSES) {
  if (!ORDER_STATUS_TRANSITIONS[status]) {
    allStatesInFlow = false;
    console.log(`  ❌ 状态 ${status} 不在流转表中`);
  }
}
assert('所有 18 个状态都在流转表中', allStatesInFlow);

// 每个状态都有转移列表（即使是空数组）
let allHaveTransitions = true;
for (const status of ALL_ORDER_STATUSES) {
  const trans = ORDER_STATUS_TRANSITIONS[status];
  if (!Array.isArray(trans)) {
    allHaveTransitions = false;
    console.log(`  ❌ 状态 ${status} 转移列表非数组`);
  }
}
assert('所有状态的转移都是数组', allHaveTransitions);

// 终态的转移列表应该为空
const terminalTransitions = TERMINAL_ORDER_STATUSES.map(s => ORDER_STATUS_TRANSITIONS[s]);
const allTerminalsEmpty = terminalTransitions.every(t => t.length === 0);
assert('所有终态的转移列表都为空', allTerminalsEmpty);

console.log('\n========== 测试结果 ==========');
console.log(`✅ 通过: ${pass}`);
console.log(`❌ 失败: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
