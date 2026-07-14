/**
 * FJN Referral Service 冒烟测试
 *
 * 验证内容：
 *  - 推荐奖励状态机：9 个状态、合法/非法转移
 *  - 推荐关系状态机：4 个状态
 *  - 工具函数：isLockable/isApprovable/isPayableReward/isPayableNow/isRecoverable/isCancellable/isLockExpired/calculateLockUntil
 *  - 9 个事件常量 + 9 个事件源
 *  - 32 个错误码 + 23 个异常类
 *  - Service 类实例化
 *
 * 说明：
 *  - 本测试只覆盖纯逻辑部分（不依赖数据库）
 *  - 数据库相关方法（createReward/approve/lock 等）需在真实 DB 环境下测试
 */

import {
  REFERRAL_REWARD_STATUS,
  REFERRAL_REWARD_STATUS_TRANSITIONS,
  ALL_REFERRAL_REWARD_STATUSES,
  TERMINAL_REFERRAL_REWARD_STATUSES,
  REFERRAL_BINDING_STATUS,
  REFERRAL_BINDING_STATUS_TRANSITIONS,
  ALL_REFERRAL_BINDING_STATUSES,
  canTransitReferralRewardStatus,
  assertTransitReferralRewardStatus,
  canTransitReferralBindingStatus,
  assertTransitReferralBindingStatus,
  nextReferralRewardStatuses,
  isTerminalReferralRewardStatus,
  isLockable,
  isApprovableReward,
  isPayableReward,
  isPayableNow,
  isRecoverable,
  isCancellableReward,
  calculateLockUntil,
  isLockExpired,
} from '@/lib/fjn/services/referral-state-machine';
import {
  REFERRAL_EVENTS,
  REFERRAL_EVENT_SOURCES,
  ALL_REFERRAL_EVENTS,
  isValidReferralEvent,
  isValidReferralEventSource,
} from '@/lib/fjn/services/referral-events';
import {
  REFERRAL_ERROR_CODES,
  FjnReferralError,
  FjnReferralBindingNotFoundError,
  FjnReferralBindingAlreadyExistsError,
  FjnReferralBindingInvalidError,
  FjnReferralSelfNotAllowedError,
  FjnReferralRewardNotFoundError,
  FjnReferralRewardAlreadyExistsError,
  FjnReferralRewardStatusInvalidError,
  FjnReferralRewardTerminalStatusError,
  FjnReferralRewardAmountInvalidError,
  FjnReferralRewardAmountZeroError,
  FjnReferralRewardRateInvalidError,
  FjnReferralRewardNotPayableError,
  FjnReferralRewardNotRecoverableError,
  FjnReferralRewardNotApprovableError,
  FjnReferralRewardLockNotExpiredError,
  FjnReferralOrderNotFoundError,
  FjnReferralOrderNotPaidError,
  FjnReferralKycNotVerifiedError,
  FjnReferralRiskHoldError,
  FjnReferralApprovalRequiredError,
  FjnReferralReviewerRequiredError,
  FjnReferralReasonRequiredError,
  isFjnReferralErrorCode,
  getReferralErrorCodeCount,
} from '@/lib/fjn/services/referral-errors';
import { FjnReferralService, createFjnReferralService } from '@/lib/fjn/services/referral-service';

// ============================================================
// 工具
// ============================================================

let passCount = 0;
let failCount = 0;
const failures: string[] = [];

function assert(name: string, condition: boolean, detail?: unknown): void {
  if (condition) {
    passCount++;
    console.log(`  ✅ ${name}`);
  } else {
    failCount++;
    failures.push(`${name}${detail !== undefined ? ` (actual: ${JSON.stringify(detail)})` : ''}`);
    console.log(`  ❌ ${name}${detail !== undefined ? ` (actual: ${JSON.stringify(detail)})` : ''}`);
  }
}

console.log('=== FJN Referral Service 冒烟测试 ===');

// ============================================================
// [1] 推荐奖励状态常量
// ============================================================
console.log('\n[1] 推荐奖励状态常量');
assert('REFERRAL_REWARD_STATUS 包含 9 个状态', Object.keys(REFERRAL_REWARD_STATUS).length === 9, Object.keys(REFERRAL_REWARD_STATUS).length);
assert('CREATED = created', REFERRAL_REWARD_STATUS.CREATED === 'created');
assert('LOCKED = locked', REFERRAL_REWARD_STATUS.LOCKED === 'locked');
assert('RISK_CHECKING = risk_checking', REFERRAL_REWARD_STATUS.RISK_CHECKING === 'risk_checking');
assert('APPROVED = approved', REFERRAL_REWARD_STATUS.APPROVED === 'approved');
assert('PAYABLE = payable', REFERRAL_REWARD_STATUS.PAYABLE === 'payable');
assert('PAID = paid', REFERRAL_REWARD_STATUS.PAID === 'paid');
assert('RECOVERED = recovered', REFERRAL_REWARD_STATUS.RECOVERED === 'recovered');
assert('CANCELLED = cancelled', REFERRAL_REWARD_STATUS.CANCELLED === 'cancelled');
assert('RISK_HOLD = risk_hold', REFERRAL_REWARD_STATUS.RISK_HOLD === 'risk_hold');
assert('ALL_REFERRAL_REWARD_STATUSES 包含 9 个', ALL_REFERRAL_REWARD_STATUSES.length === 9);
assert('TERMINAL_REFERRAL_REWARD_STATUSES 包含 2 个', TERMINAL_REFERRAL_REWARD_STATUSES.length === 2);

// ============================================================
// [2] 推荐关系状态常量
// ============================================================
console.log('\n[2] 推荐关系状态常量');
assert('REFERRAL_BINDING_STATUS 包含 4 个状态', Object.keys(REFERRAL_BINDING_STATUS).length === 4, Object.keys(REFERRAL_BINDING_STATUS).length);
assert('ACTIVE = active', REFERRAL_BINDING_STATUS.ACTIVE === 'active');
assert('INVALID = invalid', REFERRAL_BINDING_STATUS.INVALID === 'invalid');
assert('TRANSFERRED = transferred', REFERRAL_BINDING_STATUS.TRANSFERRED === 'transferred');
assert('CANCELLED = cancelled', REFERRAL_BINDING_STATUS.CANCELLED === 'cancelled');
assert('ALL_REFERRAL_BINDING_STATUSES 包含 4 个', ALL_REFERRAL_BINDING_STATUSES.length === 4);

// ============================================================
// [3] 推荐奖励状态机 - 合法转移
// ============================================================
console.log('\n[3] 推荐奖励状态机 - 合法转移');
assert('created -> locked 合法', canTransitReferralRewardStatus('created', 'locked'));
assert('created -> risk_checking 合法', canTransitReferralRewardStatus('created', 'risk_checking'));
assert('created -> cancelled 合法', canTransitReferralRewardStatus('created', 'cancelled'));
assert('locked -> risk_checking 合法', canTransitReferralRewardStatus('locked', 'risk_checking'));
assert('locked -> approved 合法', canTransitReferralRewardStatus('locked', 'approved'));
assert('risk_checking -> approved 合法', canTransitReferralRewardStatus('risk_checking', 'approved'));
assert('risk_checking -> payable 合法', canTransitReferralRewardStatus('risk_checking', 'payable'));
assert('risk_checking -> risk_hold 合法', canTransitReferralRewardStatus('risk_checking', 'risk_hold'));
assert('approved -> payable 合法', canTransitReferralRewardStatus('approved', 'payable'));
assert('approved -> recovered 合法', canTransitReferralRewardStatus('approved', 'recovered'));
assert('payable -> paid 合法', canTransitReferralRewardStatus('payable', 'paid'));
assert('payable -> recovered 合法', canTransitReferralRewardStatus('payable', 'recovered'));
assert('paid -> recovered 合法', canTransitReferralRewardStatus('paid', 'recovered'));
assert('risk_hold -> approved 合法', canTransitReferralRewardStatus('risk_hold', 'approved'));
assert('risk_hold -> recovered 合法', canTransitReferralRewardStatus('risk_hold', 'recovered'));

// ============================================================
// [4] 推荐奖励状态机 - 非法转移
// ============================================================
console.log('\n[4] 推荐奖励状态机 - 非法转移');
assert('created -> paid 非法', !canTransitReferralRewardStatus('created', 'paid'));
assert('created -> approved 非法', !canTransitReferralRewardStatus('created', 'approved'));
assert('locked -> paid 非法', !canTransitReferralRewardStatus('locked', 'paid'));
assert('approved -> paid 非法（必须先 payable）', !canTransitReferralRewardStatus('approved', 'paid'));
assert('paid -> payable 非法（paid 后只能 recovered）', !canTransitReferralRewardStatus('paid', 'payable'));
assert('recovered -> anything 非法（终态）', !canTransitReferralRewardStatus('recovered', 'paid'));
assert('cancelled -> anything 非法（终态）', !canTransitReferralRewardStatus('cancelled', 'locked'));

// ============================================================
// [5] 推荐关系状态机
// ============================================================
console.log('\n[5] 推荐关系状态机');
assert('active -> invalid 合法', canTransitReferralBindingStatus('active', 'invalid'));
assert('active -> transferred 合法', canTransitReferralBindingStatus('active', 'transferred'));
assert('active -> cancelled 合法', canTransitReferralBindingStatus('active', 'cancelled'));
assert('invalid -> active 合法', canTransitReferralBindingStatus('invalid', 'active'));
assert('invalid -> cancelled 合法', canTransitReferralBindingStatus('invalid', 'cancelled'));
assert('transferred -> anything 非法（终态）', !canTransitReferralBindingStatus('transferred', 'active'));
assert('cancelled -> anything 非法（终态）', !canTransitReferralBindingStatus('cancelled', 'active'));

// ============================================================
// [6] 状态机 - 强制转移
// ============================================================
console.log('\n[6] 状态机 - 强制转移');
let thrown = false;
try {
  assertTransitReferralRewardStatus('created', 'locked');
} catch {
  thrown = true;
}
assert('合法转移不抛错', !thrown);

thrown = false;
try {
  assertTransitReferralRewardStatus('created', 'paid');
} catch {
  thrown = true;
}
assert('非法转移抛 FjnStateMachineError', thrown);

thrown = false;
try {
  assertTransitReferralBindingStatus('cancelled', 'active');
} catch {
  thrown = true;
}
assert('关系非法转移抛 FjnStateMachineError', thrown);

// ============================================================
// [7] 工具函数 - 状态判断
// ============================================================
console.log('\n[7] 工具函数 - 状态判断');
assert('isTerminalReferralRewardStatus(paid) = false（paid 可追回）', !isTerminalReferralRewardStatus('paid'));
assert('isTerminalReferralRewardStatus(recovered) = true', isTerminalReferralRewardStatus('recovered'));
assert('isTerminalReferralRewardStatus(cancelled) = true', isTerminalReferralRewardStatus('cancelled'));
assert('isTerminalReferralRewardStatus(approved) = false', !isTerminalReferralRewardStatus('approved'));
assert('isTerminalReferralRewardStatus(locked) = false', !isTerminalReferralRewardStatus('locked'));

assert('isLockable(created) = true', isLockable('created'));
assert('isLockable(locked) = false', !isLockable('locked'));
assert('isLockable(approved) = false', !isLockable('approved'));

assert('isApprovableReward(locked) = true', isApprovableReward('locked'));
assert('isApprovableReward(risk_checking) = true', isApprovableReward('risk_checking'));
assert('isApprovableReward(approved) = false', !isApprovableReward('approved'));
assert('isApprovableReward(created) = false', !isApprovableReward('created'));

assert('isPayableReward(approved) = true', isPayableReward('approved'));
assert('isPayableReward(risk_checking) = true', isPayableReward('risk_checking'));
assert('isPayableReward(locked) = false', !isPayableReward('locked'));

assert('isPayableNow(payable) = true', isPayableNow('payable'));
assert('isPayableNow(approved) = false', !isPayableNow('approved'));
assert('isPayableNow(paid) = false', !isPayableNow('paid'));

assert('isRecoverable(approved) = true', isRecoverable('approved'));
assert('isRecoverable(payable) = true', isRecoverable('payable'));
assert('isRecoverable(paid) = true', isRecoverable('paid'));
assert('isRecoverable(risk_hold) = true', isRecoverable('risk_hold'));
assert('isRecoverable(locked) = false', !isRecoverable('locked'));
assert('isRecoverable(recovered) = false', !isRecoverable('recovered'));

assert('isCancellableReward(created) = true', isCancellableReward('created'));
assert('isCancellableReward(locked) = true', isCancellableReward('locked'));
assert('isCancellableReward(paid) = false', !isCancellableReward('paid'));
assert('isCancellableReward(recovered) = false', !isCancellableReward('recovered'));

// ============================================================
// [8] 工具函数 - 锁定期
// ============================================================
console.log('\n[8] 工具函数 - 锁定期');
const baseTime = new Date('2026-07-01T00:00:00Z');
const lockUntil30 = calculateLockUntil(30, baseTime);
assert('calculateLockUntil(30天) 增加 30 天', lockUntil30.getTime() === baseTime.getTime() + 30 * 24 * 3600 * 1000);
const lockUntil7 = calculateLockUntil(7, baseTime);
assert('calculateLockUntil(7天) 增加 7 天', lockUntil7.getTime() === baseTime.getTime() + 7 * 24 * 3600 * 1000);

const pastLock = new Date('2026-06-01T00:00:00Z');
const futureNow = new Date('2026-07-15T00:00:00Z');
assert('isLockExpired(过去时间, 30天) = true', isLockExpired(pastLock, 30, futureNow));
assert('isLockExpired(null, 30天) = false', !isLockExpired(null, 30, futureNow));
const recentLock = new Date('2026-07-10T00:00:00Z');
assert('isLockExpired(未到期, 30天) = false', !isLockExpired(recentLock, 30, futureNow));

// ============================================================
// [9] 工具函数 - nextReferralRewardStatuses
// ============================================================
console.log('\n[9] 工具函数 - nextReferralRewardStatuses');
assert('created 可转移到 3 个状态', nextReferralRewardStatuses('created').length === 3);
assert('paid 可转移到 1 个状态（只能 recovered）', nextReferralRewardStatuses('paid').length === 1);
assert('recovered 是终态（0 个可转移）', nextReferralRewardStatuses('recovered').length === 0);
assert('cancelled 是终态（0 个可转移）', nextReferralRewardStatuses('cancelled').length === 0);
assert('approved 可转移到 3 个状态', nextReferralRewardStatuses('approved').length === 3);

// ============================================================
// [10] 状态流转表完整性
// ============================================================
console.log('\n[10] 状态流转表完整性');
for (const status of ALL_REFERRAL_REWARD_STATUSES) {
  const trans = REFERRAL_REWARD_STATUS_TRANSITIONS[status];
  assert(`${status} 有转移表条目`, Array.isArray(trans));
}
for (const status of TERMINAL_REFERRAL_REWARD_STATUSES) {
  const trans = REFERRAL_REWARD_STATUS_TRANSITIONS[status];
  assert(`终态 ${status} 转移表为空`, trans.length === 0);
}

// ============================================================
// [11] 事件常量
// ============================================================
console.log('\n[11] 事件常量');
assert('REFERRAL_EVENTS 包含 9 个事件', Object.keys(REFERRAL_EVENTS).length === 9, Object.keys(REFERRAL_EVENTS).length);
assert('ALL_REFERRAL_EVENTS === 9', ALL_REFERRAL_EVENTS.length === 9);
assert('BINDING_SNAPSHOT_CREATED = referral.binding_snapshot_created.v1', REFERRAL_EVENTS.BINDING_SNAPSHOT_CREATED === 'referral.binding_snapshot_created.v1');
assert('REWARD_CREATED = referral.reward_created.v1', REFERRAL_EVENTS.REWARD_CREATED === 'referral.reward_created.v1');
assert('REWARD_LOCKED = referral.reward_locked.v1', REFERRAL_EVENTS.REWARD_LOCKED === 'referral.reward_locked.v1');
assert('REWARD_APPROVED = referral.reward_approved.v1', REFERRAL_EVENTS.REWARD_APPROVED === 'referral.reward_approved.v1');
assert('REWARD_PAID = referral.reward_paid.v1', REFERRAL_EVENTS.REWARD_PAID === 'referral.reward_paid.v1');
assert('REWARD_RECOVERED = referral.reward_recovered.v1', REFERRAL_EVENTS.REWARD_RECOVERED === 'referral.reward_recovered.v1');
assert('REWARD_CANCELLED = referral.reward_cancelled.v1', REFERRAL_EVENTS.REWARD_CANCELLED === 'referral.reward_cancelled.v1');
assert('REWARD_RISK_HOLD = referral.reward_risk_hold.v1', REFERRAL_EVENTS.REWARD_RISK_HOLD === 'referral.reward_risk_hold.v1');
assert('REFERRAL_EVENT_SOURCES 包含 9 个', Object.keys(REFERRAL_EVENT_SOURCES).length === 9, Object.keys(REFERRAL_EVENT_SOURCES).length);
assert('SYSTEM = system', REFERRAL_EVENT_SOURCES.SYSTEM === 'system');
assert('USER = user', REFERRAL_EVENT_SOURCES.USER === 'user');
assert('ADMIN = admin', REFERRAL_EVENT_SOURCES.ADMIN === 'admin');
assert('ORDER = order', REFERRAL_EVENT_SOURCES.ORDER === 'order');
assert('PAYMENT = payment', REFERRAL_EVENT_SOURCES.PAYMENT === 'payment');
assert('RISK = risk', REFERRAL_EVENT_SOURCES.RISK === 'risk');
assert('isValidReferralEvent(referral.reward_created.v1) = true', isValidReferralEvent('referral.reward_created.v1'));
assert('isValidReferralEvent(invalid.event) = false', !isValidReferralEvent('invalid.event'));
assert('isValidReferralEventSource(system) = true', isValidReferralEventSource('system'));
assert('isValidReferralEventSource(invalid) = false', !isValidReferralEventSource('invalid'));

// ============================================================
// [12] 错误码 + 异常类
// ============================================================
console.log('\n[12] 错误码 + 异常类');
assert('REFERRAL_ERROR_CODES 包含 32 个', Object.keys(REFERRAL_ERROR_CODES).length === 32, getReferralErrorCodeCount());
assert('getReferralErrorCodeCount() === 32', getReferralErrorCodeCount() === 32);
assert('BINDING_NOT_FOUND', REFERRAL_ERROR_CODES.BINDING_NOT_FOUND === 'REFERRAL_BINDING_NOT_FOUND');
assert('REWARD_NOT_FOUND', REFERRAL_ERROR_CODES.REWARD_NOT_FOUND === 'REFERRAL_REWARD_NOT_FOUND');
assert('SELF_REFERRAL', REFERRAL_ERROR_CODES.SELF_REFERRAL === 'REFERRAL_SELF_REFERRAL');
assert('KYC_NOT_VERIFIED', REFERRAL_ERROR_CODES.KYC_NOT_VERIFIED === 'REFERRAL_KYC_NOT_VERIFIED');
assert('RISK_HOLD', REFERRAL_ERROR_CODES.RISK_HOLD === 'REFERRAL_RISK_HOLD');

const e1 = new FjnReferralRewardNotFoundError();
assert('FjnReferralRewardNotFoundError code 正确', e1.code === 'REFERRAL_REWARD_NOT_FOUND');
assert('FjnReferralRewardNotFoundError httpStatus = 404', e1.httpStatus === 404);

const e2 = new FjnReferralBindingAlreadyExistsError();
assert('FjnReferralBindingAlreadyExistsError code 正确', e2.code === 'REFERRAL_BINDING_ALREADY_EXISTS');
assert('FjnReferralBindingAlreadyExistsError httpStatus = 409', e2.httpStatus === 409);

const e3 = new FjnReferralSelfNotAllowedError();
assert('FjnReferralSelfNotAllowedError code 正确', e3.code === 'REFERRAL_BINDING_SELF_NOT_ALLOWED');
assert('FjnReferralSelfNotAllowedError httpStatus = 422', e3.httpStatus === 422);

const e4 = new FjnReferralRewardNotApprovableError();
assert('FjnReferralRewardNotApprovableError code 正确', e4.code === 'REFERRAL_REWARD_NOT_APPROVABLE');
assert('FjnReferralRewardNotApprovableError httpStatus = 422', e4.httpStatus === 422);

const e5 = new FjnReferralKycNotVerifiedError();
assert('FjnReferralKycNotVerifiedError code 正确', e5.code === 'REFERRAL_KYC_NOT_VERIFIED');
assert('FjnReferralKycNotVerifiedError httpStatus = 422', e5.httpStatus === 422);

const e6 = new FjnReferralRiskHoldError();
assert('FjnReferralRiskHoldError code 正确', e6.code === 'REFERRAL_RISK_HOLD');
assert('FjnReferralRiskHoldError httpStatus = 422', e6.httpStatus === 422);

const e7 = new FjnReferralReasonRequiredError();
assert('FjnReferralReasonRequiredError code 正确', e7.code === 'REFERRAL_REASON_REQUIRED');
assert('FjnReferralReasonRequiredError httpStatus = 400', e7.httpStatus === 400);

assert('isFjnReferralErrorCode(REFERRAL_REWARD_NOT_FOUND) = true', isFjnReferralErrorCode('REFERRAL_REWARD_NOT_FOUND'));
assert('isFjnReferralErrorCode(INVALID) = false', !isFjnReferralErrorCode('INVALID'));

// 异常类继承验证
assert('FjnReferralRewardNotFoundError 继承 FjnReferralError', e1 instanceof FjnReferralError);
assert('FjnReferralRewardNotFoundError 继承 Error', e1 instanceof Error);

// ============================================================
// [13] Service 类实例化
// ============================================================
console.log('\n[13] Service 类实例化');
const svc1 = new FjnReferralService();
assert('FjnReferralService 实例化成功', svc1 !== null);
assert('FjnReferralService 名称正确', svc1.serviceName === 'FjnReferralService');
const svc2 = createFjnReferralService();
assert('createFjnReferralService 工厂方法成功', svc2 !== null);
const svc3 = new FjnReferralService({ serviceName: 'CustomReferral' });
assert('自定义 serviceName 生效', svc3.serviceName === 'CustomReferral');

// ============================================================
// 测试结果
// ============================================================
console.log('\n=== 测试结果 ===');
console.log(`✅ 通过: ${passCount}`);
console.log(`❌ 失败: ${failCount}`);
console.log(`📊 合计: ${passCount + failCount}`);
const totalNum = passCount + failCount;
const rate = totalNum > 0 ? ((passCount / totalNum) * 100).toFixed(2) : '0.00';
console.log(`📈 通过率: ${rate}%`);

if (failCount > 0) {
  console.log('\n❌ 失败明细:');
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
  process.exit(1);
} else {
  console.log('\n✅ 全部测试通过');
  process.exit(0);
}
