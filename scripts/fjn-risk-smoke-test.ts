/**
 * FJN Risk Service 冒烟测试
 *
 * 验证：
 *  - 状态机常量完整性
 *  - 状态机转移合法性
 *  - 状态机工具函数
 *  - 风险等级 / 动作 / 类型枚举
 *  - 风险分数等级推导
 *  - 事件常量与 Payload
 *  - 错误码 + 异常类
 *  - Service 类可实例化
 *  - 业务编号生成
 */
import {
  // 状态机
  RISK_EVENT_STATUS,
  RISK_CASE_STATUS,
  RISK_LEVEL,
  RISK_ACTION,
  RISK_TYPE,
  RISK_SCORE_TYPE,
  BLACKLIST_CATEGORY,
  BLACKLIST_SOURCE,
  RISK_EVENT_STATUS_TRANSITIONS,
  RISK_CASE_STATUS_TRANSITIONS,
  ALL_RISK_EVENT_STATUSES,
  ALL_RISK_CASE_STATUSES,
  ALL_RISK_LEVELS,
  ALL_RISK_ACTIONS,
  ALL_RISK_TYPES,
  ALL_RISK_SCORE_TYPES,
  ALL_BLACKLIST_CATEGORIES,
  TERMINAL_RISK_EVENT_STATUSES,
  TERMINAL_RISK_CASE_STATUSES,
  RISK_LEVEL_SCORE,
  canTransitRiskEventStatus,
  canTransitRiskCaseStatus,
  assertTransitRiskEventStatus,
  assertTransitRiskCaseStatus,
  isTerminalRiskEventStatus,
  isTerminalRiskCaseStatus,
  isRiskEventReviewable,
  isRiskEventResolvable,
  isRiskEventEscalable,
  isRiskCaseAssignable,
  isRiskCaseResolvable,
  nextRiskEventStatuses,
  nextRiskCaseStatuses,
  deriveRiskLevelFromScore,
  type FjnRiskEventStatus,
  type FjnRiskCaseStatus,
  type FjnRiskLevel,
  type FjnRiskAction,
  type FjnRiskType,
  type FjnBlacklistCategory,
  // 事件
  RISK_EVENTS,
  RISK_EVENT_SOURCES,
  ALL_RISK_EVENTS,
  RISK_EVENT_COUNT,
  isValidRiskEvent,
  isValidRiskEventSource,
  type RiskRuleCreatedPayload,
  type RiskEventRecordedPayload,
  type BlacklistAddedPayload,
  // 错误
  RISK_ERROR_CODES,
  RISK_ERROR_CODE_COUNT,
  isFjnRiskErrorCode,
  getRiskErrorCodeCount,
  isFjnRiskError,
  FjnRiskRuleNotFoundError,
  FjnRiskRuleAlreadyExistsError,
  FjnRiskRuleNotActiveError,
  FjnRiskRuleInvalidConfigError,
  FjnRiskEventNotFoundError,
  FjnRiskEventNotReviewableError,
  FjnRiskEventNotResolvableError,
  FjnRiskEventNotEscalableError,
  FjnRiskEventInvalidScoreError,
  FjnRiskCaseNotFoundError,
  FjnRiskCaseNotAssignableError,
  FjnRiskCaseNotResolvableError,
  FjnRiskCaseNotClosableError,
  FjnRiskCaseNotReopenableError,
  FjnRiskCaseAssigneeRequiredError,
  FjnRiskScoreInvalidError,
  FjnRiskScoreNegativeError,
  FjnRiskScoreTypeInvalidError,
  FjnRiskBlacklistNotFoundError,
  FjnRiskBlacklistAlreadyExistsError,
  FjnRiskBlacklistCategoryInvalidError,
  FjnRiskBlacklistValueRequiredError,
  FjnRiskDeviceNotFoundError,
  FjnRiskDeviceAlreadyExistsError,
  FjnRiskDeviceFingerprintRequiredError,
  FjnRiskLevelInvalidError,
  FjnRiskActionInvalidError,
  FjnRiskTypeInvalidError,
  FjnRiskReasonRequiredError,
  FjnRiskReviewerRequiredError,
  FjnRiskResolutionRequiredError,
  FjnRiskEvaluationFailedError,
  type FjnRiskErrorCode,
  // Service
  FjnRiskService,
  createFjnRiskService,
  type CreateRiskRuleInput,
  type RecordRiskEventInput,
  type AddBlacklistInput,
  type RegisterDeviceInput,
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

console.log('=== FJN Risk Service 冒烟测试 ===\n');

// ============================================================
// [1] 风险事件状态常量
// ============================================================
console.log('[1] 风险事件状态常量');
assert('RISK_EVENT_STATUS.OPEN = open', RISK_EVENT_STATUS.OPEN === 'open');
assert('RISK_EVENT_STATUS.REVIEWING = reviewing', RISK_EVENT_STATUS.REVIEWING === 'reviewing');
assert('RISK_EVENT_STATUS.RESOLVED = resolved', RISK_EVENT_STATUS.RESOLVED === 'resolved');
assert('RISK_EVENT_STATUS.ESCALATED = escalated', RISK_EVENT_STATUS.ESCALATED === 'escalated');
assert('ALL_RISK_EVENT_STATUSES 包含 4 个', ALL_RISK_EVENT_STATUSES.length === 4);
assert('TERMINAL_RISK_EVENT_STATUSES 包含 1 个', TERMINAL_RISK_EVENT_STATUSES.length === 1);
assert('RESOLVED 是事件终态', isTerminalRiskEventStatus(RISK_EVENT_STATUS.RESOLVED));
assert('OPEN 不是事件终态', !isTerminalRiskEventStatus(RISK_EVENT_STATUS.OPEN));

// ============================================================
// [2] 风险案件状态常量
// ============================================================
console.log('\n[2] 风险案件状态常量');
assert('RISK_CASE_STATUS.OPEN = open', RISK_CASE_STATUS.OPEN === 'open');
assert('RISK_CASE_STATUS.INVESTIGATING = investigating', RISK_CASE_STATUS.INVESTIGATING === 'investigating');
assert('RISK_CASE_STATUS.ESCALATED = escalated', RISK_CASE_STATUS.ESCALATED === 'escalated');
assert('RISK_CASE_STATUS.RESOLVED = resolved', RISK_CASE_STATUS.RESOLVED === 'resolved');
assert('RISK_CASE_STATUS.CLOSED = closed', RISK_CASE_STATUS.CLOSED === 'closed');
assert('ALL_RISK_CASE_STATUSES 包含 5 个', ALL_RISK_CASE_STATUSES.length === 5);
assert('TERMINAL_RISK_CASE_STATUSES 包含 2 个', TERMINAL_RISK_CASE_STATUSES.length === 2);
assert('RESOLVED 是案件终态', isTerminalRiskCaseStatus(RISK_CASE_STATUS.RESOLVED));
assert('CLOSED 是案件终态', isTerminalRiskCaseStatus(RISK_CASE_STATUS.CLOSED));
assert('OPEN 不是案件终态', !isTerminalRiskCaseStatus(RISK_CASE_STATUS.OPEN));

// ============================================================
// [3] 风险等级 + 动作 + 类型
// ============================================================
console.log('\n[3] 风险等级 + 动作 + 类型');
assert('RISK_LEVEL.LOW = low', RISK_LEVEL.LOW === 'low');
assert('RISK_LEVEL.MEDIUM = medium', RISK_LEVEL.MEDIUM === 'medium');
assert('RISK_LEVEL.HIGH = high', RISK_LEVEL.HIGH === 'high');
assert('RISK_LEVEL.CRITICAL = critical', RISK_LEVEL.CRITICAL === 'critical');
assert('ALL_RISK_LEVELS 包含 4 个', ALL_RISK_LEVELS.length === 4);
assert('RISK_LEVEL_SCORE.low = 10', RISK_LEVEL_SCORE.low === 10);
assert('RISK_LEVEL_SCORE.medium = 30', RISK_LEVEL_SCORE.medium === 30);
assert('RISK_LEVEL_SCORE.high = 60', RISK_LEVEL_SCORE.high === 60);
assert('RISK_LEVEL_SCORE.critical = 100', RISK_LEVEL_SCORE.critical === 100);
assert('RISK_ACTION.PASS = pass', RISK_ACTION.PASS === 'pass');
assert('RISK_ACTION.WARNING = warning', RISK_ACTION.WARNING === 'warning');
assert('RISK_ACTION.REJECT = reject', RISK_ACTION.REJECT === 'reject');
assert('RISK_ACTION.FREEZE_ASSET = freeze_asset', RISK_ACTION.FREEZE_ASSET === 'freeze_asset');
assert('RISK_ACTION.BLACKLIST = blacklist', RISK_ACTION.BLACKLIST === 'blacklist');
assert('ALL_RISK_ACTIONS 包含 9 个', ALL_RISK_ACTIONS.length === 9, `actual=${ALL_RISK_ACTIONS.length}`);
assert('RISK_TYPE.SELF_REFERRAL = self_referral', RISK_TYPE.SELF_REFERRAL === 'self_referral');
assert('RISK_TYPE.MULTI_ACCOUNT = multi_account', RISK_TYPE.MULTI_ACCOUNT === 'multi_account');
assert('RISK_TYPE.ABNORMAL_PAYMENT = abnormal_payment', RISK_TYPE.ABNORMAL_PAYMENT === 'abnormal_payment');
assert('ALL_RISK_TYPES 包含 17 个', ALL_RISK_TYPES.length === 17, `actual=${ALL_RISK_TYPES.length}`);

// ============================================================
// [4] 风险分数类型 + 黑名单
// ============================================================
console.log('\n[4] 风险分数类型 + 黑名单');
assert('RISK_SCORE_TYPE.USER = user', RISK_SCORE_TYPE.USER === 'user');
assert('RISK_SCORE_TYPE.ORDER = order', RISK_SCORE_TYPE.ORDER === 'order');
assert('RISK_SCORE_TYPE.PAYMENT = payment', RISK_SCORE_TYPE.PAYMENT === 'payment');
assert('RISK_SCORE_TYPE.DEVICE = device', RISK_SCORE_TYPE.DEVICE === 'device');
assert('RISK_SCORE_TYPE.IP = ip', RISK_SCORE_TYPE.IP === 'ip');
assert('ALL_RISK_SCORE_TYPES 包含 5 个', ALL_RISK_SCORE_TYPES.length === 5);
assert('BLACKLIST_CATEGORY.USER = user', BLACKLIST_CATEGORY.USER === 'user');
assert('BLACKLIST_CATEGORY.DEVICE = device', BLACKLIST_CATEGORY.DEVICE === 'device');
assert('BLACKLIST_CATEGORY.WALLET = wallet', BLACKLIST_CATEGORY.WALLET === 'wallet');
assert('ALL_BLACKLIST_CATEGORIES 包含 6 个', ALL_BLACKLIST_CATEGORIES.length === 6);
assert('BLACKLIST_SOURCE.MANUAL = manual', BLACKLIST_SOURCE.MANUAL === 'manual');
assert('BLACKLIST_SOURCE.AUTO = auto', BLACKLIST_SOURCE.AUTO === 'auto');
assert('BLACKLIST_SOURCE.SYSTEM = system', BLACKLIST_SOURCE.SYSTEM === 'system');

// ============================================================
// [5] 风险事件状态机 - 合法转移
// ============================================================
console.log('\n[5] 风险事件状态机 - 合法转移');
assert('open -> reviewing 合法', canTransitRiskEventStatus(RISK_EVENT_STATUS.OPEN, RISK_EVENT_STATUS.REVIEWING));
assert('open -> resolved 合法', canTransitRiskEventStatus(RISK_EVENT_STATUS.OPEN, RISK_EVENT_STATUS.RESOLVED));
assert('open -> escalated 合法', canTransitRiskEventStatus(RISK_EVENT_STATUS.OPEN, RISK_EVENT_STATUS.ESCALATED));
assert('reviewing -> resolved 合法', canTransitRiskEventStatus(RISK_EVENT_STATUS.REVIEWING, RISK_EVENT_STATUS.RESOLVED));
assert('reviewing -> escalated 合法', canTransitRiskEventStatus(RISK_EVENT_STATUS.REVIEWING, RISK_EVENT_STATUS.ESCALATED));
assert('escalated -> reviewing 合法', canTransitRiskEventStatus(RISK_EVENT_STATUS.ESCALATED, RISK_EVENT_STATUS.REVIEWING));
assert('escalated -> resolved 合法', canTransitRiskEventStatus(RISK_EVENT_STATUS.ESCALATED, RISK_EVENT_STATUS.RESOLVED));

// ============================================================
// [6] 风险事件状态机 - 非法转移
// ============================================================
console.log('\n[6] 风险事件状态机 - 非法转移');
assert('resolved -> 任何 非法（终态）', !canTransitRiskEventStatus(RISK_EVENT_STATUS.RESOLVED, RISK_EVENT_STATUS.OPEN));
assert('resolved -> reviewing 非法', !canTransitRiskEventStatus(RISK_EVENT_STATUS.RESOLVED, RISK_EVENT_STATUS.REVIEWING));
assert('resolved -> escalated 非法', !canTransitRiskEventStatus(RISK_EVENT_STATUS.RESOLVED, RISK_EVENT_STATUS.ESCALATED));

// ============================================================
// [7] 风险案件状态机 - 合法转移
// ============================================================
console.log('\n[7] 风险案件状态机 - 合法转移');
assert('open -> investigating 合法', canTransitRiskCaseStatus(RISK_CASE_STATUS.OPEN, RISK_CASE_STATUS.INVESTIGATING));
assert('open -> escalated 合法', canTransitRiskCaseStatus(RISK_CASE_STATUS.OPEN, RISK_CASE_STATUS.ESCALATED));
assert('open -> closed 合法', canTransitRiskCaseStatus(RISK_CASE_STATUS.OPEN, RISK_CASE_STATUS.CLOSED));
assert('investigating -> escalated 合法', canTransitRiskCaseStatus(RISK_CASE_STATUS.INVESTIGATING, RISK_CASE_STATUS.ESCALATED));
assert('investigating -> resolved 合法', canTransitRiskCaseStatus(RISK_CASE_STATUS.INVESTIGATING, RISK_CASE_STATUS.RESOLVED));
assert('investigating -> closed 合法', canTransitRiskCaseStatus(RISK_CASE_STATUS.INVESTIGATING, RISK_CASE_STATUS.CLOSED));
assert('escalated -> investigating 合法', canTransitRiskCaseStatus(RISK_CASE_STATUS.ESCALATED, RISK_CASE_STATUS.INVESTIGATING));
assert('escalated -> resolved 合法', canTransitRiskCaseStatus(RISK_CASE_STATUS.ESCALATED, RISK_CASE_STATUS.RESOLVED));
assert('resolved -> closed 合法', canTransitRiskCaseStatus(RISK_CASE_STATUS.RESOLVED, RISK_CASE_STATUS.CLOSED));
assert('closed -> open 合法（可重开）', canTransitRiskCaseStatus(RISK_CASE_STATUS.CLOSED, RISK_CASE_STATUS.OPEN));

// ============================================================
// [8] 风险案件状态机 - 非法转移
// ============================================================
console.log('\n[8] 风险案件状态机 - 非法转移');
assert('open -> resolved 非法（需 investigating）', !canTransitRiskCaseStatus(RISK_CASE_STATUS.OPEN, RISK_CASE_STATUS.RESOLVED));
assert('resolved -> open 非法（只能重开 closed）', !canTransitRiskCaseStatus(RISK_CASE_STATUS.RESOLVED, RISK_CASE_STATUS.OPEN));
assert('resolved -> investigating 非法', !canTransitRiskCaseStatus(RISK_CASE_STATUS.RESOLVED, RISK_CASE_STATUS.INVESTIGATING));
assert('closed -> resolved 非法（需重开）', !canTransitRiskCaseStatus(RISK_CASE_STATUS.CLOSED, RISK_CASE_STATUS.RESOLVED));

// ============================================================
// [9] 状态机 - 强制转移
// ============================================================
console.log('\n[9] 状态机 - 强制转移');
try {
  assertTransitRiskEventStatus(RISK_EVENT_STATUS.OPEN, RISK_EVENT_STATUS.REVIEWING);
  assert('合法事件转移不抛错', true);
} catch (e: any) {
  assert('合法事件转移不抛错', false, e?.message);
}
try {
  assertTransitRiskEventStatus(RISK_EVENT_STATUS.RESOLVED, RISK_EVENT_STATUS.OPEN);
  assert('非法事件转移抛错', false);
} catch (e: any) {
  assert('非法事件转移抛错', e?.name === 'FjnStateMachineError' || String(e?.code).includes('STATE'));
}
try {
  assertTransitRiskCaseStatus(RISK_CASE_STATUS.CLOSED, RISK_CASE_STATUS.OPEN);
  assert('合法案件重开不抛错', true);
} catch (e: any) {
  assert('合法案件重开不抛错', false, e?.message);
}
try {
  assertTransitRiskCaseStatus(RISK_CASE_STATUS.OPEN, RISK_CASE_STATUS.RESOLVED);
  assert('非法案件转移抛错', false);
} catch (e: any) {
  assert('非法案件转移抛错', e?.name === 'FjnStateMachineError' || String(e?.code).includes('STATE'));
}

// ============================================================
// [10] 状态机 - 工具函数
// ============================================================
console.log('\n[10] 状态机 - 工具函数');
assert('isRiskEventReviewable(open) = true', isRiskEventReviewable(RISK_EVENT_STATUS.OPEN));
assert('isRiskEventReviewable(reviewing) = true', isRiskEventReviewable(RISK_EVENT_STATUS.REVIEWING));
assert('isRiskEventReviewable(resolved) = false', !isRiskEventReviewable(RISK_EVENT_STATUS.RESOLVED));
assert('isRiskEventResolvable(escalated) = true', isRiskEventResolvable(RISK_EVENT_STATUS.ESCALATED));
assert('isRiskEventResolvable(resolved) = false', !isRiskEventResolvable(RISK_EVENT_STATUS.RESOLVED));
assert('isRiskEventEscalable(open) = true', isRiskEventEscalable(RISK_EVENT_STATUS.OPEN));
assert('isRiskEventEscalable(escalated) = false', !isRiskEventEscalable(RISK_EVENT_STATUS.ESCALATED));
assert('isRiskCaseAssignable(open) = true', isRiskCaseAssignable(RISK_CASE_STATUS.OPEN));
assert('isRiskCaseAssignable(investigating) = true', isRiskCaseAssignable(RISK_CASE_STATUS.INVESTIGATING));
assert('isRiskCaseAssignable(resolved) = false', !isRiskCaseAssignable(RISK_CASE_STATUS.RESOLVED));
assert('isRiskCaseResolvable(open) = true', isRiskCaseResolvable(RISK_CASE_STATUS.OPEN));
assert('isRiskCaseResolvable(closed) = false', !isRiskCaseResolvable(RISK_CASE_STATUS.CLOSED));
assert('open 事件可转移 3 个', nextRiskEventStatuses(RISK_EVENT_STATUS.OPEN).length === 3);
assert('resolved 事件是终态（0 个）', nextRiskEventStatuses(RISK_EVENT_STATUS.RESOLVED).length === 0);
assert('open 案件可转移 3 个', nextRiskCaseStatuses(RISK_CASE_STATUS.OPEN).length === 3);
assert('closed 案件可重开（1 个）', nextRiskCaseStatuses(RISK_CASE_STATUS.CLOSED).length === 1);

// ============================================================
// [11] 风险等级推导
// ============================================================
console.log('\n[11] 风险等级推导');
assert('score 0 -> low', deriveRiskLevelFromScore(0) === 'low');
assert('score 19 -> low', deriveRiskLevelFromScore(19) === 'low');
assert('score 20 -> medium', deriveRiskLevelFromScore(20) === 'medium');
assert('score 49 -> medium', deriveRiskLevelFromScore(49) === 'medium');
assert('score 50 -> high', deriveRiskLevelFromScore(50) === 'high');
assert('score 79 -> high', deriveRiskLevelFromScore(79) === 'high');
assert('score 80 -> critical', deriveRiskLevelFromScore(80) === 'critical');
assert('score 100 -> critical', deriveRiskLevelFromScore(100) === 'critical');

// ============================================================
// [12] 事件常量
// ============================================================
console.log('\n[12] 事件常量');
assert('RISK_EVENTS 包含 19 个', Object.keys(RISK_EVENTS).length === 19, `actual=${Object.keys(RISK_EVENTS).length}`);
assert('RULE_CREATED = risk.rule_created.v1', RISK_EVENTS.RULE_CREATED === 'risk.rule_created.v1');
assert('RULE_UPDATED = risk.rule_updated.v1', RISK_EVENTS.RULE_UPDATED === 'risk.rule_updated.v1');
assert('RULE_DISABLED = risk.rule_disabled.v1', RISK_EVENTS.RULE_DISABLED === 'risk.rule_disabled.v1');
assert('EVENT_RECORDED = risk.event_recorded.v1', RISK_EVENTS.EVENT_RECORDED === 'risk.event_recorded.v1');
assert('EVENT_REVIEWING = risk.event_reviewing.v1', RISK_EVENTS.EVENT_REVIEWING === 'risk.event_reviewing.v1');
assert('EVENT_RESOLVED = risk.event_resolved.v1', RISK_EVENTS.EVENT_RESOLVED === 'risk.event_resolved.v1');
assert('EVENT_ESCALATED = risk.event_escalated.v1', RISK_EVENTS.EVENT_ESCALATED === 'risk.event_escalated.v1');
assert('CASE_OPENED = risk.case_opened.v1', RISK_EVENTS.CASE_OPENED === 'risk.case_opened.v1');
assert('CASE_ASSIGNED = risk.case_assigned.v1', RISK_EVENTS.CASE_ASSIGNED === 'risk.case_assigned.v1');
assert('CASE_RESOLVED = risk.case_resolved.v1', RISK_EVENTS.CASE_RESOLVED === 'risk.case_resolved.v1');
assert('CASE_CLOSED = risk.case_closed.v1', RISK_EVENTS.CASE_CLOSED === 'risk.case_closed.v1');
assert('SCORE_UPDATED = risk.score_updated.v1', RISK_EVENTS.SCORE_UPDATED === 'risk.score_updated.v1');
assert('BLACKLIST_ADDED = risk.blacklist_added.v1', RISK_EVENTS.BLACKLIST_ADDED === 'risk.blacklist_added.v1');
assert('BLACKLIST_REMOVED = risk.blacklist_removed.v1', RISK_EVENTS.BLACKLIST_REMOVED === 'risk.blacklist_removed.v1');
assert('DEVICE_REGISTERED = risk.device_registered.v1', RISK_EVENTS.DEVICE_REGISTERED === 'risk.device_registered.v1');
assert('ALL_RISK_EVENTS 包含 19 个', ALL_RISK_EVENTS.length === 19);
assert('RISK_EVENT_COUNT = 19', RISK_EVENT_COUNT === 19);
assert('RISK_EVENT_SOURCES 包含 14 个', Object.keys(RISK_EVENT_SOURCES).length === 14, `actual=${Object.keys(RISK_EVENT_SOURCES).length}`);
assert('RISK_EVENT_SOURCES.SYSTEM = system', RISK_EVENT_SOURCES.SYSTEM === 'system');
assert('RISK_EVENT_SOURCES.ORDER = order', RISK_EVENT_SOURCES.ORDER === 'order');
assert('RISK_EVENT_SOURCES.PAYMENT = payment', RISK_EVENT_SOURCES.PAYMENT === 'payment');
assert('RISK_EVENT_SOURCES.RISK = risk', RISK_EVENT_SOURCES.RISK === 'risk');
assert('isValidRiskEvent(risk.event_recorded.v1) = true', isValidRiskEvent('risk.event_recorded.v1'));
assert('isValidRiskEvent(invalid) = false', !isValidRiskEvent('invalid.event'));
assert('isValidRiskEventSource(system) = true', isValidRiskEventSource('system'));
assert('isValidRiskEventSource(unknown) = false', !isValidRiskEventSource('unknown'));

// ============================================================
// [13] 事件 Payload 类型
// ============================================================
console.log('\n[13] 事件 Payload 类型');
const s1: RiskRuleCreatedPayload = {
  occurred_at: '2026-07-01T00:00:00.000Z',
  source: RISK_EVENT_SOURCES.ADMIN,
  rule_id: 'r1',
  rule_code: 'SELF_REFERRAL_V1',
  rule_name: '自推荐检测',
  rule_type: RISK_TYPE.SELF_REFERRAL,
  risk_level: RISK_LEVEL.HIGH,
  action: RISK_ACTION.MANUAL_REVIEW,
  enabled: true,
};
assert('RiskRuleCreatedPayload 可构造', s1.rule_code === 'SELF_REFERRAL_V1');
const s2: RiskEventRecordedPayload = {
  occurred_at: '2026-07-01T00:00:00.000Z',
  source: RISK_EVENT_SOURCES.ORDER,
  event_id: 'e1',
  event_no: 'FRE20260701ABC12345',
  event_type: RISK_TYPE.ABNORMAL_PAYMENT,
  user_id: 'u1',
  risk_level: RISK_LEVEL.HIGH,
  risk_score: 60,
  source_type: 'order',
  source_id: 'o1',
  action: RISK_ACTION.WARNING,
  status: RISK_EVENT_STATUS.OPEN,
};
assert('RiskEventRecordedPayload 可构造', s2.risk_score === 60);
const s3: BlacklistAddedPayload = {
  occurred_at: '2026-07-01T00:00:00.000Z',
  source: RISK_EVENT_SOURCES.ADMIN,
  blacklist_id: 'b1',
  category: BLACKLIST_CATEGORY.USER,
  value: 'malicious_user',
  reason: 'multiple fraud',
};
assert('BlacklistAddedPayload 可构造', s3.value === 'malicious_user');

// ============================================================
// [14] 错误码 + 异常类
// ============================================================
console.log('\n[14] 错误码 + 异常类');
assert('RISK_ERROR_CODE_COUNT = 47', RISK_ERROR_CODE_COUNT === 47, `actual=${RISK_ERROR_CODE_COUNT}`);
assert('getRiskErrorCodeCount() = 47', getRiskErrorCodeCount() === 47);
assert('RULE_NOT_FOUND = RISK_RULE_NOT_FOUND', RISK_ERROR_CODES.RULE_NOT_FOUND === 'RISK_RULE_NOT_FOUND');
assert('EVENT_NOT_FOUND = RISK_EVENT_NOT_FOUND', RISK_ERROR_CODES.EVENT_NOT_FOUND === 'RISK_EVENT_NOT_FOUND');
assert('CASE_NOT_FOUND = RISK_CASE_NOT_FOUND', RISK_ERROR_CODES.CASE_NOT_FOUND === 'RISK_CASE_NOT_FOUND');
assert('BLACKLIST_NOT_FOUND = RISK_BLACKLIST_NOT_FOUND', RISK_ERROR_CODES.BLACKLIST_NOT_FOUND === 'RISK_BLACKLIST_NOT_FOUND');
assert('DEVICE_NOT_FOUND = RISK_DEVICE_NOT_FOUND', RISK_ERROR_CODES.DEVICE_NOT_FOUND === 'RISK_DEVICE_NOT_FOUND');
assert('isFjnRiskErrorCode(RISK_RULE_NOT_FOUND) = true', isFjnRiskErrorCode('RISK_RULE_NOT_FOUND'));
assert('isFjnRiskErrorCode(INVALID) = false', !isFjnRiskErrorCode('INVALID'));

// 异常类实例化
const e1 = new FjnRiskRuleNotFoundError({ id: 'r1' });
assert('FjnRiskRuleNotFoundError 可构造', e1.name === 'FjnRiskRuleNotFoundError');
const e2 = new FjnRiskEventNotFoundError({ id: 'e1' });
assert('FjnRiskEventNotFoundError 可构造', e2.name === 'FjnRiskEventNotFoundError');
const e3 = new FjnRiskCaseNotFoundError({ id: 'c1' });
assert('FjnRiskCaseNotFoundError 可构造', e3.name === 'FjnRiskCaseNotFoundError');
const e4 = new FjnRiskBlacklistNotFoundError({ id: 'b1' });
assert('FjnRiskBlacklistNotFoundError 可构造', e4.name === 'FjnRiskBlacklistNotFoundError');
const e5 = new FjnRiskDeviceNotFoundError({ id: 'd1' });
assert('FjnRiskDeviceNotFoundError 可构造', e5.name === 'FjnRiskDeviceNotFoundError');
const e6 = new FjnRiskLevelInvalidError({ value: 'unknown' });
assert('FjnRiskLevelInvalidError 可构造', e6.name === 'FjnRiskLevelInvalidError');
assert('isFjnRiskError(e1) = true', isFjnRiskError(e1));
assert('isFjnRiskError(new Error()) = false', !isFjnRiskError(new Error('test')));

// ============================================================
// [15] 状态机转移表完整性
// ============================================================
console.log('\n[15] 状态机转移表完整性');
const eventKeys = Object.keys(RISK_EVENT_STATUS_TRANSITIONS);
const caseKeys = Object.keys(RISK_CASE_STATUS_TRANSITIONS);
assert('RISK_EVENT_STATUS_TRANSITIONS 包含 4 个状态', eventKeys.length === 4);
assert('RISK_CASE_STATUS_TRANSITIONS 包含 5 个状态', caseKeys.length === 5);
assert('event resolved 是终态（0 后续）', RISK_EVENT_STATUS_TRANSITIONS['resolved'].length === 0);
assert('case closed 可重开（1 后续）', RISK_CASE_STATUS_TRANSITIONS['closed'].length === 1);
assert('case resolved 可关闭（1 后续）', RISK_CASE_STATUS_TRANSITIONS['resolved'].length === 1);

// ============================================================
// [16] Service 类可实例化
// ============================================================
console.log('\n[16] Service 类可实例化');
const svc1 = new FjnRiskService();
assert('FjnRiskService 默认实例化', svc1 instanceof FjnRiskService);
const svc2 = createFjnRiskService();
assert('createFjnRiskService 工厂可用', svc2 instanceof FjnRiskService);
const svc3 = createFjnRiskService({ serviceName: 'CustomRisk' });
assert('createFjnRiskService 接受 options', svc3 instanceof FjnRiskService);

// ============================================================
// [17] 输入类型存在性
// ============================================================
console.log('\n[17] 输入类型存在性');
const _createRule: CreateRiskRuleInput = {
  ruleCode: 'SELF_REF_V1',
  ruleName: '自推荐',
  ruleType: RISK_TYPE.SELF_REFERRAL,
  riskLevel: RISK_LEVEL.HIGH,
  action: RISK_ACTION.MANUAL_REVIEW,
  ruleConfig: { maxReferrals: 5 },
};
assert('CreateRiskRuleInput 可构造', _createRule.ruleCode === 'SELF_REF_V1');

const _recordEvent: RecordRiskEventInput = {
  eventType: RISK_TYPE.ABNORMAL_PAYMENT,
  riskScore: 60,
  riskLevel: RISK_LEVEL.HIGH,
  sourceType: 'order',
  sourceId: 'o1',
  userId: 'u1',
  source: RISK_EVENT_SOURCES.ORDER,
};
assert('RecordRiskEventInput 可构造', _recordEvent.riskScore === 60);

const _addBl: AddBlacklistInput = {
  category: BLACKLIST_CATEGORY.USER,
  value: 'malicious_user',
  reason: 'fraud',
  source: BLACKLIST_SOURCE.MANUAL,
};
assert('AddBlacklistInput 可构造', _addBl.value === 'malicious_user');

const _regDev: RegisterDeviceInput = {
  fingerprint: 'fp12345',
  userId: 'u1',
  userAgent: 'Mozilla/5.0',
  ipAddress: '127.0.0.1',
};
assert('RegisterDeviceInput 可构造', _regDev.fingerprint === 'fp12345');

// ============================================================
// [18] 业务行为
// ============================================================
console.log('\n[18] 业务行为');
// 风险事件 open 状态下可审核、解决、升级
assert('open 事件 3 路径', nextRiskEventStatuses(RISK_EVENT_STATUS.OPEN).length === 3);
// 风险案件 open 状态可分派、升级、关闭
assert('open 案件 3 路径', nextRiskCaseStatuses(RISK_CASE_STATUS.OPEN).length === 3);
// 风险案件 closed 可重开
assert('closed 案件可重开', canTransitRiskCaseStatus(RISK_CASE_STATUS.CLOSED, RISK_CASE_STATUS.OPEN));
// escalated 案件可回落
assert('escalated 案件可回落 investigating', canTransitRiskCaseStatus(RISK_CASE_STATUS.ESCALATED, RISK_CASE_STATUS.INVESTIGATING));
// 风险等级映射正确
assert('low -> 10', RISK_LEVEL_SCORE['low'] === 10);
assert('critical -> 100', RISK_LEVEL_SCORE['critical'] === 100);

// ============================================================
// 总结
// ============================================================
console.log(`\n=== 总结 ===`);
console.log(`通过: ${pass}`);
console.log(`失败: ${fail}`);
console.log(`总计: ${pass + fail}`);

if (fail > 0) {
  console.log(`\n❌ 冒烟测试失败：${fail} 项断言不通过`);
  process.exit(1);
} else {
  console.log(`\n✅ FJN Risk Service 冒烟测试全部通过（${pass} 项断言）`);
  process.exit(0);
}
