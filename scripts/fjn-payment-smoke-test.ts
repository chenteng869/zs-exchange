/**
 * FJN Payment Service 冒烟测试
 *
 * 验证内容：
 *  - 支付单状态机：合法/非法转移
 *  - 退款单状态机：合法/非法转移
 *  - 支付方式/链类型/支付提供者常量
 *  - 事件常量命名规范
 *  - 错误码 + 异常类
 *  - 工具函数：isTerminal / canTransit / isPayablePayment / isPaymentSucceeded / isRefundablePayment
 *  - 状态流转表完整性
 *
 * 说明：
 *  - 本测试只覆盖纯逻辑部分（不依赖数据库）
 *  - 数据库相关方法（createPayment / markSuccess / handleCallback 等）需在真实 DB 环境下测试
 */

import {
  PAYMENT_STATUS,
  PAYMENT_STATUS_TRANSITIONS,
  ALL_PAYMENT_STATUSES,
  TERMINAL_PAYMENT_STATUSES,
  REFUND_STATUS,
  REFUND_STATUS_TRANSITIONS,
  ALL_REFUND_STATUSES,
  TERMINAL_REFUND_STATUSES,
  PAYMENT_METHODS,
  CHAIN_TYPES,
  PAYMENT_PROVIDERS,
  REFUND_TYPES,
  REFUND_ADJUSTMENT_TYPES,
  canTransitPaymentStatus,
  assertTransitPaymentStatus,
  nextPaymentStatuses,
  canTransitRefundStatus,
  assertTransitRefundStatus,
  nextRefundStatuses,
  isTerminalPaymentStatus,
  isTerminalRefundStatus,
  isPayablePayment,
  isPaymentSucceeded,
  isRefundablePayment,
  PAYMENT_EVENTS,
  PAYMENT_EVENT_SOURCES,
  PAYMENT_ERROR_CODES,
  FjnPaymentNotFoundError,
  FjnPaymentStatusInvalidError,
  FjnPaymentAmountInvalidError,
  FjnPaymentAmountMismatchError,
  FjnPaymentCurrencyMismatchError,
  FjnPaymentTxHashDuplicatedError,
  FjnRefundNotFoundError,
  FjnRefundStatusInvalidError,
  FjnRefundAmountInvalidError,
  FjnPaymentExpiredError,
  FjnOrderNotPayableError,
  FjnPaymentCallbackSignatureInvalidError,
} from '../src/lib/fjn';

let pass = 0, fail = 0;
function assert(name: string, cond: boolean, info?: any) {
  if (cond) { console.log(`  ✅ ${name}`); pass++; }
  else { console.log(`  ❌ ${name}`, info ?? ''); fail++; }
}

console.log('=== FJN Payment Service 冒烟测试 ===\n');

// ============================================================
// [1] 支付单状态常量
// ============================================================
console.log('[1] 支付单状态常量');
assert('PAYMENT_STATUS 包含 11 个状态', Object.keys(PAYMENT_STATUS).length === 11, Object.keys(PAYMENT_STATUS).length);
assert('CREATED = created', PAYMENT_STATUS.CREATED === 'created');
assert('PENDING = pending', PAYMENT_STATUS.PENDING === 'pending');
assert('SUCCESS = success', PAYMENT_STATUS.SUCCESS === 'success');
assert('REFUNDED = refunded', PAYMENT_STATUS.REFUNDED === 'refunded');
assert('ALL_PAYMENT_STATUSES 包含 11 个', ALL_PAYMENT_STATUSES.length === 11);
assert('TERMINAL_PAYMENT_STATUSES 包含 4 个', TERMINAL_PAYMENT_STATUSES.length === 4);

console.log('\n[2] 退款单状态常量');
assert('REFUND_STATUS 包含 7 个', Object.keys(REFUND_STATUS).length === 7);
assert('REQUESTED = requested', REFUND_STATUS.REQUESTED === 'requested');
assert('APPROVED = approved', REFUND_STATUS.APPROVED === 'approved');
assert('REFUNDED = refunded', REFUND_STATUS.REFUNDED === 'refunded');
assert('ALL_REFUND_STATUSES 包含 7 个', ALL_REFUND_STATUSES.length === 7);
assert('TERMINAL_REFUND_STATUSES 包含 3 个', TERMINAL_REFUND_STATUSES.length === 3);

console.log('\n[3] 支付方式/链/提供者常量');
assert('PAYMENT_METHODS 包含 10 种', Object.keys(PAYMENT_METHODS).length === 10);
assert('USDT = usdt', PAYMENT_METHODS.USDT === 'usdt');
assert('CHAIN_TYPES 包含 6 种', Object.keys(CHAIN_TYPES).length === 6);
assert('SOLANA = solana', CHAIN_TYPES.SOLANA === 'solana');
assert('PAYMENT_PROVIDERS 包含 7 种', Object.keys(PAYMENT_PROVIDERS).length === 7);
assert('STRIPE = stripe', PAYMENT_PROVIDERS.STRIPE === 'stripe');
assert('REFUND_TYPES 包含 2 种', Object.keys(REFUND_TYPES).length === 2);
assert('FULL = full', REFUND_TYPES.FULL === 'full');
assert('REFUND_ADJUSTMENT_TYPES 包含 8 种', Object.keys(REFUND_ADJUSTMENT_TYPES).length === 8);

// ============================================================
// [4] 支付单状态机 - 合法转移
// ============================================================
console.log('\n[4] 支付单状态机 - 合法转移');
assert('created -> pending 合法', canTransitPaymentStatus(PAYMENT_STATUS.CREATED, PAYMENT_STATUS.PENDING));
assert('created -> processing 合法', canTransitPaymentStatus(PAYMENT_STATUS.CREATED, PAYMENT_STATUS.PROCESSING));
assert('created -> cancelled 合法', canTransitPaymentStatus(PAYMENT_STATUS.CREATED, PAYMENT_STATUS.CANCELLED));
assert('pending -> success 合法', canTransitPaymentStatus(PAYMENT_STATUS.PENDING, PAYMENT_STATUS.SUCCESS));
assert('pending -> processing 合法', canTransitPaymentStatus(PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING));
assert('pending -> manual_review 合法', canTransitPaymentStatus(PAYMENT_STATUS.PENDING, PAYMENT_STATUS.MANUAL_REVIEW));
assert('pending -> expired 合法', canTransitPaymentStatus(PAYMENT_STATUS.PENDING, PAYMENT_STATUS.EXPIRED));
assert('processing -> success 合法', canTransitPaymentStatus(PAYMENT_STATUS.PROCESSING, PAYMENT_STATUS.SUCCESS));
assert('processing -> failed 合法', canTransitPaymentStatus(PAYMENT_STATUS.PROCESSING, PAYMENT_STATUS.FAILED));
assert('processing -> manual_review 合法', canTransitPaymentStatus(PAYMENT_STATUS.PROCESSING, PAYMENT_STATUS.MANUAL_REVIEW));
assert('processing -> refunding 合法', canTransitPaymentStatus(PAYMENT_STATUS.PROCESSING, PAYMENT_STATUS.REFUNDING));
assert('manual_review -> success 合法', canTransitPaymentStatus(PAYMENT_STATUS.MANUAL_REVIEW, PAYMENT_STATUS.SUCCESS));
assert('success -> refunding 合法', canTransitPaymentStatus(PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.REFUNDING));
assert('success -> partial_refunded 合法', canTransitPaymentStatus(PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.PARTIAL_REFUNDED));
assert('success -> refunded 合法', canTransitPaymentStatus(PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.REFUNDED));
assert('refunding -> refunded 合法', canTransitPaymentStatus(PAYMENT_STATUS.REFUNDING, PAYMENT_STATUS.REFUNDED));
assert('partial_refunded -> refunded 合法', canTransitPaymentStatus(PAYMENT_STATUS.PARTIAL_REFUNDED, PAYMENT_STATUS.REFUNDED));

// ============================================================
// [5] 支付单状态机 - 非法转移
// ============================================================
console.log('\n[5] 支付单状态机 - 非法转移');
assert('created -> success 非法', !canTransitPaymentStatus(PAYMENT_STATUS.CREATED, PAYMENT_STATUS.SUCCESS));
assert('pending -> refunded 非法', !canTransitPaymentStatus(PAYMENT_STATUS.PENDING, PAYMENT_STATUS.REFUNDED));
assert('success -> pending 非法', !canTransitPaymentStatus(PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.PENDING));
assert('success -> failed 非法（成功后不可失败）', !canTransitPaymentStatus(PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.FAILED));
assert('failed -> anything 非法（终态）', !canTransitPaymentStatus(PAYMENT_STATUS.FAILED, PAYMENT_STATUS.SUCCESS));
assert('expired -> pending 非法（终态）', !canTransitPaymentStatus(PAYMENT_STATUS.EXPIRED, PAYMENT_STATUS.PENDING));
assert('refunded -> anything 非法（终态）', !canTransitPaymentStatus(PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.SUCCESS));
assert('cancelled -> anything 非法（终态）', !canTransitPaymentStatus(PAYMENT_STATUS.CANCELLED, PAYMENT_STATUS.PENDING));
assert('partial_refunded -> pending 非法', !canTransitPaymentStatus(PAYMENT_STATUS.PARTIAL_REFUNDED, PAYMENT_STATUS.PENDING));

// ============================================================
// [6] 退款单状态机
// ============================================================
console.log('\n[6] 退款单状态机 - 合法转移');
assert('requested -> reviewing 合法', canTransitRefundStatus(REFUND_STATUS.REQUESTED, REFUND_STATUS.REVIEWING));
assert('requested -> approved 合法', canTransitRefundStatus(REFUND_STATUS.REQUESTED, REFUND_STATUS.APPROVED));
assert('requested -> rejected 合法', canTransitRefundStatus(REFUND_STATUS.REQUESTED, REFUND_STATUS.REJECTED));
assert('reviewing -> approved 合法', canTransitRefundStatus(REFUND_STATUS.REVIEWING, REFUND_STATUS.APPROVED));
assert('reviewing -> rejected 合法', canTransitRefundStatus(REFUND_STATUS.REVIEWING, REFUND_STATUS.REJECTED));
assert('approved -> processing 合法', canTransitRefundStatus(REFUND_STATUS.APPROVED, REFUND_STATUS.PROCESSING));
assert('approved -> failed 合法', canTransitRefundStatus(REFUND_STATUS.APPROVED, REFUND_STATUS.FAILED));
assert('processing -> refunded 合法', canTransitRefundStatus(REFUND_STATUS.PROCESSING, REFUND_STATUS.REFUNDED));
assert('processing -> failed 合法', canTransitRefundStatus(REFUND_STATUS.PROCESSING, REFUND_STATUS.FAILED));

console.log('\n[7] 退款单状态机 - 非法转移');
assert('requested -> refunded 非法（需先 processing）', !canTransitRefundStatus(REFUND_STATUS.REQUESTED, REFUND_STATUS.REFUNDED));
assert('rejected -> approved 非法（终态）', !canTransitRefundStatus(REFUND_STATUS.REJECTED, REFUND_STATUS.APPROVED));
assert('refunded -> anything 非法（终态）', !canTransitRefundStatus(REFUND_STATUS.REFUNDED, REFUND_STATUS.PROCESSING));
assert('failed -> approved 非法（终态）', !canTransitRefundStatus(REFUND_STATUS.FAILED, REFUND_STATUS.APPROVED));

// ============================================================
// [8] 强制转移
// ============================================================
console.log('\n[8] 状态机 - 强制转移');
try {
  assertTransitPaymentStatus(PAYMENT_STATUS.PENDING, PAYMENT_STATUS.SUCCESS);
  assert('支付单合法转移不抛错', true);
} catch (e) {
  assert('支付单合法转移不抛错', false, e);
}
try {
  assertTransitPaymentStatus(PAYMENT_STATUS.PENDING, PAYMENT_STATUS.REFUNDED);
  assert('支付单非法转移抛错', false);
} catch (e: any) {
  assert('支付单非法转移抛 FjnStateMachineError', e.code === 'FJN_STATE_MACHINE');
}
try {
  assertTransitRefundStatus(REFUND_STATUS.REQUESTED, REFUND_STATUS.REFUNDED);
  assert('退款单非法转移抛错', false);
} catch (e: any) {
  assert('退款单非法转移抛错', e.code === 'FJN_STATE_MACHINE');
}

// ============================================================
// [9] 工具函数
// ============================================================
console.log('\n[9] 状态机 - 工具函数');
assert('isTerminalPaymentStatus(success) = false（可退款）', !isTerminalPaymentStatus(PAYMENT_STATUS.SUCCESS));
assert('isTerminalPaymentStatus(failed) = true', isTerminalPaymentStatus(PAYMENT_STATUS.FAILED));
assert('isTerminalPaymentStatus(expired) = true', isTerminalPaymentStatus(PAYMENT_STATUS.EXPIRED));
assert('isTerminalPaymentStatus(refunded) = true', isTerminalPaymentStatus(PAYMENT_STATUS.REFUNDED));
assert('isTerminalPaymentStatus(cancelled) = true', isTerminalPaymentStatus(PAYMENT_STATUS.CANCELLED));

assert('isTerminalRefundStatus(refunded) = true', isTerminalRefundStatus(REFUND_STATUS.REFUNDED));
assert('isTerminalRefundStatus(rejected) = true', isTerminalRefundStatus(REFUND_STATUS.REJECTED));
assert('isTerminalRefundStatus(failed) = true', isTerminalRefundStatus(REFUND_STATUS.FAILED));
assert('isTerminalRefundStatus(requested) = false', !isTerminalRefundStatus(REFUND_STATUS.REQUESTED));

assert('isPayablePayment(pending) = true', isPayablePayment(PAYMENT_STATUS.PENDING));
assert('isPayablePayment(processing) = false', !isPayablePayment(PAYMENT_STATUS.PROCESSING));
assert('isPayablePayment(success) = false', !isPayablePayment(PAYMENT_STATUS.SUCCESS));
assert('isPayablePayment(failed) = false', !isPayablePayment(PAYMENT_STATUS.FAILED));
assert('isPayablePayment(cancelled) = false', !isPayablePayment(PAYMENT_STATUS.CANCELLED));
assert('isPayablePayment(refunded) = false', !isPayablePayment(PAYMENT_STATUS.REFUNDED));

assert('isPaymentSucceeded(success) = true', isPaymentSucceeded(PAYMENT_STATUS.SUCCESS));
assert('isPaymentSucceeded(partial_refunded) = true', isPaymentSucceeded(PAYMENT_STATUS.PARTIAL_REFUNDED));
assert('isPaymentSucceeded(refunded) = true', isPaymentSucceeded(PAYMENT_STATUS.REFUNDED));
assert('isPaymentSucceeded(pending) = false', !isPaymentSucceeded(PAYMENT_STATUS.PENDING));
assert('isPaymentSucceeded(failed) = false', !isPaymentSucceeded(PAYMENT_STATUS.FAILED));

assert('isRefundablePayment(success) = true', isRefundablePayment(PAYMENT_STATUS.SUCCESS));
assert('isRefundablePayment(partial_refunded) = true', isRefundablePayment(PAYMENT_STATUS.PARTIAL_REFUNDED));
assert('isRefundablePayment(pending) = false', !isRefundablePayment(PAYMENT_STATUS.PENDING));
assert('isRefundablePayment(failed) = false', !isRefundablePayment(PAYMENT_STATUS.FAILED));
assert('isRefundablePayment(refunded) = false', !isRefundablePayment(PAYMENT_STATUS.REFUNDED));

// nextPaymentStatuses
const nextFromPending = nextPaymentStatuses(PAYMENT_STATUS.PENDING);
assert('pending 可转移到 6 个状态', nextFromPending.length === 6);

const nextFromRefunded = nextPaymentStatuses(PAYMENT_STATUS.REFUNDED);
assert('refunded 是支付单终态（0 个可转移）', nextFromRefunded.length === 0);

const nextFromRefundRequested = nextRefundStatuses(REFUND_STATUS.REQUESTED);
assert('退款 requested 可转移到 3 个状态', nextFromRefundRequested.length === 3);

// ============================================================
// [10] 事件常量
// ============================================================
console.log('\n[10] 事件常量');
assert('PAYMENT_EVENTS 包含 18 个事件', Object.keys(PAYMENT_EVENTS).length === 18);
assert('PAYMENT_CREATED = payment.created.v1', PAYMENT_EVENTS.PAYMENT_CREATED === 'payment.created.v1');
assert('PAYMENT_SUCCEEDED = payment.succeeded.v1', PAYMENT_EVENTS.PAYMENT_SUCCEEDED === 'payment.succeeded.v1');
assert('PAYMENT_FAILED = payment.failed.v1', PAYMENT_EVENTS.PAYMENT_FAILED === 'payment.failed.v1');
assert('REFUND_REQUESTED = refund.requested.v1', PAYMENT_EVENTS.REFUND_REQUESTED === 'refund.requested.v1');
assert('REFUND_APPROVED = refund.approved.v1', PAYMENT_EVENTS.REFUND_APPROVED === 'refund.approved.v1');
assert('REFUND_SUCCEEDED = refund.succeeded.v1', PAYMENT_EVENTS.REFUND_SUCCEEDED === 'refund.succeeded.v1');

assert('PAYMENT_EVENT_SOURCES 包含 9 个', Object.keys(PAYMENT_EVENT_SOURCES).length === 9);
assert('WEBHOOK = webhook', PAYMENT_EVENT_SOURCES.WEBHOOK === 'webhook');
assert('CHAIN = chain', PAYMENT_EVENT_SOURCES.CHAIN === 'chain');
assert('ORDER = order', PAYMENT_EVENT_SOURCES.ORDER === 'order');

// ============================================================
// [11] 错误码 + 异常类
// ============================================================
console.log('\n[11] 错误码 + 异常类');
assert('PAYMENT_ERROR_CODES 包含 40+ 个', Object.keys(PAYMENT_ERROR_CODES).length >= 40);
assert('PAYMENT_NOT_FOUND = PAYMENT_NOT_FOUND', PAYMENT_ERROR_CODES.PAYMENT_NOT_FOUND === 'PAYMENT_NOT_FOUND');
assert('PAYMENT_TX_HASH_DUPLICATED', PAYMENT_ERROR_CODES.PAYMENT_TX_HASH_DUPLICATED === 'PAYMENT_TX_HASH_DUPLICATED');
assert('REFUND_NOT_FOUND', PAYMENT_ERROR_CODES.REFUND_NOT_FOUND === 'REFUND_NOT_FOUND');
assert('PAYMENT_CALLBACK_SIGNATURE_INVALID', PAYMENT_ERROR_CODES.PAYMENT_CALLBACK_SIGNATURE_INVALID === 'PAYMENT_CALLBACK_SIGNATURE_INVALID');

// FjnPaymentNotFoundError
try {
  throw new FjnPaymentNotFoundError();
} catch (e: any) {
  assert('FjnPaymentNotFoundError.name 正确', e.name === 'FjnPaymentNotFoundError');
  assert('FjnPaymentNotFoundError.code 正确', e.code === 'PAYMENT_NOT_FOUND');
  assert('FjnPaymentNotFoundError.httpStatus = 404', e.httpStatus === 404);
}

// FjnPaymentStatusInvalidError
try {
  throw new FjnPaymentStatusInvalidError('测试', { from: 'pending' });
} catch (e: any) {
  assert('FjnPaymentStatusInvalidError.code 正确', e.code === 'PAYMENT_STATUS_INVALID');
  assert('FjnPaymentStatusInvalidError.httpStatus = 422', e.httpStatus === 422);
}

// FjnPaymentAmountInvalidError
try {
  throw new FjnPaymentAmountInvalidError('金额错误', { amount: '0' });
} catch (e: any) {
  assert('FjnPaymentAmountInvalidError.code 正确', e.code === 'PAYMENT_AMOUNT_INVALID');
}

// FjnPaymentAmountMismatchError
try {
  throw new FjnPaymentAmountMismatchError();
} catch (e: any) {
  assert('FjnPaymentAmountMismatchError.code 正确', e.code === 'PAYMENT_AMOUNT_MISMATCH');
}

// FjnPaymentCurrencyMismatchError
try {
  throw new FjnPaymentCurrencyMismatchError();
} catch (e: any) {
  assert('FjnPaymentCurrencyMismatchError.code 正确', e.code === 'PAYMENT_CURRENCY_MISMATCH');
}

// FjnPaymentTxHashDuplicatedError
try {
  throw new FjnPaymentTxHashDuplicatedError();
} catch (e: any) {
  assert('FjnPaymentTxHashDuplicatedError.code 正确', e.code === 'PAYMENT_TX_HASH_DUPLICATED');
  assert('FjnPaymentTxHashDuplicatedError.httpStatus = 409', e.httpStatus === 409);
}

// FjnRefundNotFoundError
try {
  throw new FjnRefundNotFoundError();
} catch (e: any) {
  assert('FjnRefundNotFoundError.name 正确', e.name === 'FjnRefundNotFoundError');
  assert('FjnRefundNotFoundError.httpStatus = 404', e.httpStatus === 404);
}

// FjnRefundStatusInvalidError
try {
  throw new FjnRefundStatusInvalidError();
} catch (e: any) {
  assert('FjnRefundStatusInvalidError.code 正确', e.code === 'REFUND_STATUS_INVALID');
}

// FjnRefundAmountInvalidError
try {
  throw new FjnRefundAmountInvalidError();
} catch (e: any) {
  assert('FjnRefundAmountInvalidError.code 正确', e.code === 'REFUND_AMOUNT_INVALID');
}

// FjnPaymentExpiredError
try {
  throw new FjnPaymentExpiredError();
} catch (e: any) {
  assert('FjnPaymentExpiredError.code 正确', e.code === 'PAYMENT_EXPIRED');
  assert('FjnPaymentExpiredError.httpStatus = 410', e.httpStatus === 410);
}

// FjnOrderNotPayableError
try {
  throw new FjnOrderNotPayableError();
} catch (e: any) {
  assert('FjnOrderNotPayableError.code 正确', e.code === 'ORDER_NOT_PAYABLE');
}

// FjnPaymentCallbackSignatureInvalidError
try {
  throw new FjnPaymentCallbackSignatureInvalidError();
} catch (e: any) {
  assert('FjnPaymentCallbackSignatureInvalidError.code 正确', e.code === 'PAYMENT_CALLBACK_SIGNATURE_INVALID');
  assert('FjnPaymentCallbackSignatureInvalidError.httpStatus = 401', e.httpStatus === 401);
}

// ============================================================
// [12] 状态流转表完整性
// ============================================================
console.log('\n[12] 状态流转表完整性');

// 支付单
let allPaymentInFlow = true;
for (const status of ALL_PAYMENT_STATUSES) {
  if (!PAYMENT_STATUS_TRANSITIONS[status]) {
    allPaymentInFlow = false;
    console.log(`  ❌ 支付单状态 ${status} 不在流转表中`);
  }
}
assert('所有 11 个支付单状态都在流转表中', allPaymentInFlow);

let allPaymentHaveTransitions = true;
for (const status of ALL_PAYMENT_STATUSES) {
  const trans = PAYMENT_STATUS_TRANSITIONS[status];
  if (!Array.isArray(trans)) {
    allPaymentHaveTransitions = false;
  }
}
assert('所有支付单状态的转移都是数组', allPaymentHaveTransitions);

const paymentTerminalTransitions = TERMINAL_PAYMENT_STATUSES.map(s => PAYMENT_STATUS_TRANSITIONS[s]);
const allPaymentTerminalsEmpty = paymentTerminalTransitions.every(t => t.length === 0);
assert('所有支付单终态的转移列表都为空', allPaymentTerminalsEmpty);

// 退款单
let allRefundInFlow = true;
for (const status of ALL_REFUND_STATUSES) {
  if (!REFUND_STATUS_TRANSITIONS[status]) {
    allRefundInFlow = false;
    console.log(`  ❌ 退款单状态 ${status} 不在流转表中`);
  }
}
assert('所有 7 个退款单状态都在流转表中', allRefundInFlow);

const refundTerminalTransitions = TERMINAL_REFUND_STATUSES.map(s => REFUND_STATUS_TRANSITIONS[s]);
const allRefundTerminalsEmpty = refundTerminalTransitions.every(t => t.length === 0);
assert('所有退款单终态的转移列表都为空', allRefundTerminalsEmpty);

// ============================================================
// [13] 跨 Service 联动验证（imports）
// ============================================================
console.log('\n[13] 跨 Service 联动验证');
try {
  // 确保 PaymentService 和 OrderService 同时可被导入
  const { FjnPaymentService, FjnOrderService } = require('../src/lib/fjn');
  assert('FjnPaymentService 和 FjnOrderService 可同时导入', typeof FjnPaymentService === 'function' && typeof FjnOrderService === 'function');
} catch (e: any) {
  assert('FjnPaymentService 和 FjnOrderService 可同时导入', false, e?.message);
}

console.log('\n========== 测试结果 ==========');
console.log(`✅ 通过: ${pass}`);
console.log(`❌ 失败: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
