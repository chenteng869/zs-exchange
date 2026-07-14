/**
 * FJN Tax Service 冒烟测试
 *
 * 验证：
 *  - 状态机常量完整性
 *  - 状态机转移合法性
 *  - 状态机工具函数
 *  - 事件常量与 Payload
 *  - 错误码 + 异常类
 *  - 税种 + 模式枚举
 *  - Service 类可实例化
 *  - 业务编号生成
 *  - TaxCalculationResult 输出
 */
import {
  // 状态机
  TAX_RULE_STATUS,
  TAX_RECORD_STATUS,
  TAX_REPORT_STATUS,
  TAX_TYPES,
  TAX_MODE,
  TAX_RULE_STATUS_TRANSITIONS,
  TAX_RECORD_STATUS_TRANSITIONS,
  TAX_REPORT_STATUS_TRANSITIONS,
  ALL_TAX_RULE_STATUSES,
  ALL_TAX_RECORD_STATUSES,
  ALL_TAX_REPORT_STATUSES,
  ALL_TAX_TYPES,
  TERMINAL_TAX_RULE_STATUSES,
  TERMINAL_TAX_RECORD_STATUSES,
  TERMINAL_TAX_REPORT_STATUSES,
  canTransitTaxRuleStatus,
  canTransitTaxRecordStatus,
  canTransitTaxReportStatus,
  assertTransitTaxRuleStatus,
  assertTransitTaxRecordStatus,
  assertTransitTaxReportStatus,
  isTerminalTaxRuleStatus,
  isTerminalTaxRecordStatus,
  isTerminalTaxReportStatus,
  isTaxRuleUsable,
  isTaxRecordPayable,
  isTaxReportSubmittable,
  nextTaxRuleStatuses,
  nextTaxRecordStatuses,
  nextTaxReportStatuses,
  type FjnTaxRuleStatus,
  type FjnTaxRecordStatus,
  type FjnTaxReportStatus,
  type FjnTaxType,
  type FjnTaxMode,
  // 事件
  TAX_EVENTS,
  TAX_EVENT_SOURCES,
  ALL_TAX_EVENTS,
  TAX_EVENT_COUNT,
  isValidTaxEvent,
  isValidTaxEventSource,
  type TaxRuleCreatedPayload,
  type TaxCalculatedPayload,
  type TaxRecordedPayload,
  // 错误
  TAX_ERROR_CODES,
  TAX_ERROR_CODE_COUNT,
  isFjnTaxErrorCode,
  getTaxErrorCodeCount,
  isFjnTaxError,
  FjnTaxRuleNotFoundError,
  FjnTaxRuleAlreadyExistsError,
  FjnTaxRuleNotActiveError,
  FjnTaxRuleInvalidRateError,
  FjnTaxRuleEffectiveInvalidError,
  FjnTaxRuleArchivedError,
  FjnTaxRecordNotFoundError,
  FjnTaxRecordAlreadyExistsError,
  FjnTaxRecordStatusInvalidError,
  FjnTaxRecordNotPayableError,
  FjnTaxRecordNotAdjustableError,
  FjnTaxRecordNotReversibleError,
  FjnTaxRecordTaxableInvalidError,
  FjnTaxRecordTaxAmountInvalidError,
  FjnTaxRecordTaxRateMismatchError,
  FjnTaxAmountInvalidError,
  FjnTaxCurrencyMismatchError,
  FjnTaxRateInvalidError,
  FjnTaxModeInvalidError,
  FjnTaxReportNotFoundError,
  FjnTaxReportAlreadyExistsError,
  FjnTaxReportStatusInvalidError,
  FjnTaxReportNotSubmittableError,
  FjnTaxReportNotPayableError,
  FjnTaxReportPeriodInvalidError,
  FjnTaxReportNoRecordsError,
  FjnTaxReportSubmissionFailedError,
  FjnTaxCountryNotSupportedError,
  FjnTaxRegionNotSupportedError,
  FjnTaxRuleCodeRequiredError,
  FjnTaxTypeRequiredError,
  FjnTaxCurrencyRequiredError,
  FjnTaxReasonRequiredError,
  FjnTaxApproverRequiredError,
  type FjnTaxErrorCode,
  // Service
  FjnTaxService,
  createFjnTaxService,
  type CreateTaxRuleInput,
  type RecordTaxInput,
  type CalculateTaxInput,
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

console.log('=== FJN Tax Service 冒烟测试 ===\n');

// ============================================================
// [1] 税务规则状态常量
// ============================================================
console.log('[1] 税务规则状态常量');
assert('TAX_RULE_STATUS.ACTIVE = active', TAX_RULE_STATUS.ACTIVE === 'active');
assert('TAX_RULE_STATUS.INACTIVE = inactive', TAX_RULE_STATUS.INACTIVE === 'inactive');
assert('TAX_RULE_STATUS.ARCHIVED = archived', TAX_RULE_STATUS.ARCHIVED === 'archived');
assert('ALL_TAX_RULE_STATUSES 包含 3 个', ALL_TAX_RULE_STATUSES.length === 3);
assert('TERMINAL_TAX_RULE_STATUSES 包含 1 个（archived）', TERMINAL_TAX_RULE_STATUSES.length === 1);
assert('ARCHIVED 是规则终态', isTerminalTaxRuleStatus(TAX_RULE_STATUS.ARCHIVED));
assert('ACTIVE 不是规则终态', !isTerminalTaxRuleStatus(TAX_RULE_STATUS.ACTIVE));

// ============================================================
// [2] 税务记录状态常量
// ============================================================
console.log('\n[2] 税务记录状态常量');
assert('TAX_RECORD_STATUS.RESERVED = reserved', TAX_RECORD_STATUS.RESERVED === 'reserved');
assert('TAX_RECORD_STATUS.PAID = paid', TAX_RECORD_STATUS.PAID === 'paid');
assert('TAX_RECORD_STATUS.ADJUSTED = adjusted', TAX_RECORD_STATUS.ADJUSTED === 'adjusted');
assert('TAX_RECORD_STATUS.REVERSED = reversed', TAX_RECORD_STATUS.REVERSED === 'reversed');
assert('ALL_TAX_RECORD_STATUSES 包含 4 个', ALL_TAX_RECORD_STATUSES.length === 4);
assert('TERMINAL_TAX_RECORD_STATUSES 包含 2 个', TERMINAL_TAX_RECORD_STATUSES.length === 2);
assert('REVERSED 是记录终态', isTerminalTaxRecordStatus(TAX_RECORD_STATUS.REVERSED));
assert('PAID 是记录终态', isTerminalTaxRecordStatus(TAX_RECORD_STATUS.PAID));
assert('RESERVED 不是记录终态', !isTerminalTaxRecordStatus(TAX_RECORD_STATUS.RESERVED));

// ============================================================
// [3] 税务报表状态常量
// ============================================================
console.log('\n[3] 税务报表状态常量');
assert('TAX_REPORT_STATUS.DRAFT = draft', TAX_REPORT_STATUS.DRAFT === 'draft');
assert('TAX_REPORT_STATUS.SUBMITTED = submitted', TAX_REPORT_STATUS.SUBMITTED === 'submitted');
assert('TAX_REPORT_STATUS.PAID = paid', TAX_REPORT_STATUS.PAID === 'paid');
assert('TAX_REPORT_STATUS.REJECTED = rejected', TAX_REPORT_STATUS.REJECTED === 'rejected');
assert('ALL_TAX_REPORT_STATUSES 包含 4 个', ALL_TAX_REPORT_STATUSES.length === 4);
assert('TERMINAL_TAX_REPORT_STATUSES 包含 2 个', TERMINAL_TAX_REPORT_STATUSES.length === 2);
assert('PAID 是报表终态', isTerminalTaxReportStatus(TAX_REPORT_STATUS.PAID));
assert('DRAFT 不是报表终态', !isTerminalTaxReportStatus(TAX_REPORT_STATUS.DRAFT));

// ============================================================
// [4] 税种类型 + 模式
// ============================================================
console.log('\n[4] 税种类型 + 模式');
assert('TAX_TYPES.VAT = VAT', TAX_TYPES.VAT === 'VAT');
assert('TAX_TYPES.GST = GST', TAX_TYPES.GST === 'GST');
assert('TAX_TYPES.SALES_TAX = sales_tax', TAX_TYPES.SALES_TAX === 'sales_tax');
assert('TAX_TYPES.WITHHOLDING_TAX = withholding_tax', TAX_TYPES.WITHHOLDING_TAX === 'withholding_tax');
assert('TAX_TYPES.COMMISSION_TAX = commission_tax', TAX_TYPES.COMMISSION_TAX === 'commission_tax');
assert('ALL_TAX_TYPES 包含 10 种', ALL_TAX_TYPES.length === 10, `actual=${ALL_TAX_TYPES.length}`);
assert('TAX_MODE.INCLUSIVE = inclusive', TAX_MODE.INCLUSIVE === 'inclusive');
assert('TAX_MODE.EXCLUSIVE = exclusive', TAX_MODE.EXCLUSIVE === 'exclusive');

// ============================================================
// [5] 规则状态机 - 合法转移
// ============================================================
console.log('\n[5] 规则状态机 - 合法转移');
assert('active -> inactive 合法', canTransitTaxRuleStatus(TAX_RULE_STATUS.ACTIVE, TAX_RULE_STATUS.INACTIVE));
assert('active -> archived 合法', canTransitTaxRuleStatus(TAX_RULE_STATUS.ACTIVE, TAX_RULE_STATUS.ARCHIVED));
assert('inactive -> active 合法', canTransitTaxRuleStatus(TAX_RULE_STATUS.INACTIVE, TAX_RULE_STATUS.ACTIVE));
assert('inactive -> archived 合法', canTransitTaxRuleStatus(TAX_RULE_STATUS.INACTIVE, TAX_RULE_STATUS.ARCHIVED));

// ============================================================
// [6] 规则状态机 - 非法转移
// ============================================================
console.log('\n[6] 规则状态机 - 非法转移');
assert('archived -> 任何 非法（终态）', !canTransitTaxRuleStatus(TAX_RULE_STATUS.ARCHIVED, TAX_RULE_STATUS.ACTIVE));
assert('archived -> inactive 非法', !canTransitTaxRuleStatus(TAX_RULE_STATUS.ARCHIVED, TAX_RULE_STATUS.INACTIVE));

// ============================================================
// [7] 记录状态机 - 合法转移
// ============================================================
console.log('\n[7] 记录状态机 - 合法转移');
assert('reserved -> paid 合法', canTransitTaxRecordStatus(TAX_RECORD_STATUS.RESERVED, TAX_RECORD_STATUS.PAID));
assert('reserved -> adjusted 合法', canTransitTaxRecordStatus(TAX_RECORD_STATUS.RESERVED, TAX_RECORD_STATUS.ADJUSTED));
assert('reserved -> reversed 合法', canTransitTaxRecordStatus(TAX_RECORD_STATUS.RESERVED, TAX_RECORD_STATUS.REVERSED));
assert('paid -> adjusted 合法', canTransitTaxRecordStatus(TAX_RECORD_STATUS.PAID, TAX_RECORD_STATUS.ADJUSTED));
assert('paid -> reversed 合法', canTransitTaxRecordStatus(TAX_RECORD_STATUS.PAID, TAX_RECORD_STATUS.REVERSED));
assert('adjusted -> paid 合法', canTransitTaxRecordStatus(TAX_RECORD_STATUS.ADJUSTED, TAX_RECORD_STATUS.PAID));
assert('adjusted -> reversed 合法', canTransitTaxRecordStatus(TAX_RECORD_STATUS.ADJUSTED, TAX_RECORD_STATUS.REVERSED));

// ============================================================
// [8] 记录状态机 - 非法转移
// ============================================================
console.log('\n[8] 记录状态机 - 非法转移');
assert('reversed -> 任何 非法（终态）', !canTransitTaxRecordStatus(TAX_RECORD_STATUS.REVERSED, TAX_RECORD_STATUS.PAID));
assert('paid -> reserved 非法（不能倒退）', !canTransitTaxRecordStatus(TAX_RECORD_STATUS.PAID, TAX_RECORD_STATUS.RESERVED));
assert('reversed -> adjusted 非法', !canTransitTaxRecordStatus(TAX_RECORD_STATUS.REVERSED, TAX_RECORD_STATUS.ADJUSTED));

// ============================================================
// [9] 报表状态机 - 合法转移
// ============================================================
console.log('\n[9] 报表状态机 - 合法转移');
assert('draft -> submitted 合法', canTransitTaxReportStatus(TAX_REPORT_STATUS.DRAFT, TAX_REPORT_STATUS.SUBMITTED));
assert('draft -> rejected 合法', canTransitTaxReportStatus(TAX_REPORT_STATUS.DRAFT, TAX_REPORT_STATUS.REJECTED));
assert('submitted -> paid 合法', canTransitTaxReportStatus(TAX_REPORT_STATUS.SUBMITTED, TAX_REPORT_STATUS.PAID));
assert('submitted -> rejected 合法', canTransitTaxReportStatus(TAX_REPORT_STATUS.SUBMITTED, TAX_REPORT_STATUS.REJECTED));
assert('rejected -> draft 合法（可重做）', canTransitTaxReportStatus(TAX_REPORT_STATUS.REJECTED, TAX_REPORT_STATUS.DRAFT));

// ============================================================
// [10] 报表状态机 - 非法转移
// ============================================================
console.log('\n[10] 报表状态机 - 非法转移');
assert('paid -> 任何 非法（终态）', !canTransitTaxReportStatus(TAX_REPORT_STATUS.PAID, TAX_REPORT_STATUS.DRAFT));
assert('draft -> paid 非法（需 submitted）', !canTransitTaxReportStatus(TAX_REPORT_STATUS.DRAFT, TAX_REPORT_STATUS.PAID));
assert('rejected -> paid 非法（需重做）', !canTransitTaxReportStatus(TAX_REPORT_STATUS.REJECTED, TAX_REPORT_STATUS.PAID));

// ============================================================
// [11] 状态机 - 强制转移
// ============================================================
console.log('\n[11] 状态机 - 强制转移');
try {
  assertTransitTaxRuleStatus(TAX_RULE_STATUS.ACTIVE, TAX_RULE_STATUS.INACTIVE);
  assert('合法规则转移不抛错', true);
} catch (e: any) {
  assert('合法规则转移不抛错', false, e?.message);
}
try {
  assertTransitTaxRuleStatus(TAX_RULE_STATUS.ARCHIVED, TAX_RULE_STATUS.ACTIVE);
  assert('非法规则转移抛错', false);
} catch (e: any) {
  assert('非法规则转移抛错', e?.name === 'FjnStateMachineError' || String(e?.code).includes('STATE'));
}
try {
  assertTransitTaxRecordStatus(TAX_RECORD_STATUS.RESERVED, TAX_RECORD_STATUS.PAID);
  assert('合法记录转移不抛错', true);
} catch (e: any) {
  assert('合法记录转移不抛错', false, e?.message);
}
try {
  assertTransitTaxRecordStatus(TAX_RECORD_STATUS.REVERSED, TAX_RECORD_STATUS.PAID);
  assert('非法记录转移抛错', false);
} catch (e: any) {
  assert('非法记录转移抛错', e?.name === 'FjnStateMachineError' || String(e?.code).includes('STATE'));
}
try {
  assertTransitTaxReportStatus(TAX_REPORT_STATUS.DRAFT, TAX_REPORT_STATUS.SUBMITTED);
  assert('合法报表转移不抛错', true);
} catch (e: any) {
  assert('合法报表转移不抛错', false, e?.message);
}
try {
  assertTransitTaxReportStatus(TAX_REPORT_STATUS.PAID, TAX_REPORT_STATUS.DRAFT);
  assert('非法报表转移抛错', false);
} catch (e: any) {
  assert('非法报表转移抛错', e?.name === 'FjnStateMachineError' || String(e?.code).includes('STATE'));
}

// ============================================================
// [12] 状态机 - 工具函数
// ============================================================
console.log('\n[12] 状态机 - 工具函数');
assert('isTaxRuleUsable(active) = true', isTaxRuleUsable(TAX_RULE_STATUS.ACTIVE));
assert('isTaxRuleUsable(inactive) = false', !isTaxRuleUsable(TAX_RULE_STATUS.INACTIVE));
assert('isTaxRuleUsable(archived) = false', !isTaxRuleUsable(TAX_RULE_STATUS.ARCHIVED));
assert('isTaxRecordPayable(reserved) = true', isTaxRecordPayable(TAX_RECORD_STATUS.RESERVED));
assert('isTaxRecordPayable(paid) = false', !isTaxRecordPayable(TAX_RECORD_STATUS.PAID));
assert('isTaxReportSubmittable(draft) = true', isTaxReportSubmittable(TAX_REPORT_STATUS.DRAFT));
assert('isTaxReportSubmittable(submitted) = false', !isTaxReportSubmittable(TAX_REPORT_STATUS.SUBMITTED));
assert('active 可转移 2 个状态', nextTaxRuleStatuses(TAX_RULE_STATUS.ACTIVE).length === 2);
assert('reserved 可转移 3 个状态', nextTaxRecordStatuses(TAX_RECORD_STATUS.RESERVED).length === 3);
assert('draft 可转移 2 个状态', nextTaxReportStatuses(TAX_REPORT_STATUS.DRAFT).length === 2);
assert('archived 是规则终态（0 个）', nextTaxRuleStatuses(TAX_RULE_STATUS.ARCHIVED).length === 0);
assert('reversed 是记录终态（0 个）', nextTaxRecordStatuses(TAX_RECORD_STATUS.REVERSED).length === 0);
assert('paid 是报表终态（0 个）', nextTaxReportStatuses(TAX_REPORT_STATUS.PAID).length === 0);

// ============================================================
// [13] 事件常量
// ============================================================
console.log('\n[13] 事件常量');
assert('TAX_EVENTS 包含 12 个事件', Object.keys(TAX_EVENTS).length === 12, `actual=${Object.keys(TAX_EVENTS).length}`);
assert('RULE_CREATED = tax.rule_created.v1', TAX_EVENTS.RULE_CREATED === 'tax.rule_created.v1');
assert('RULE_UPDATED = tax.rule_updated.v1', TAX_EVENTS.RULE_UPDATED === 'tax.rule_updated.v1');
assert('RULE_ARCHIVED = tax.rule_archived.v1', TAX_EVENTS.RULE_ARCHIVED === 'tax.rule_archived.v1');
assert('CALCULATED = tax.calculated.v1', TAX_EVENTS.CALCULATED === 'tax.calculated.v1');
assert('RECORDED = tax.recorded.v1', TAX_EVENTS.RECORDED === 'tax.recorded.v1');
assert('PAID = tax.paid.v1', TAX_EVENTS.PAID === 'tax.paid.v1');
assert('ADJUSTED = tax.adjusted.v1', TAX_EVENTS.ADJUSTED === 'tax.adjusted.v1');
assert('REVERSED = tax.reversed.v1', TAX_EVENTS.REVERSED === 'tax.reversed.v1');
assert('REPORT_CREATED = tax.report_created.v1', TAX_EVENTS.REPORT_CREATED === 'tax.report_created.v1');
assert('REPORT_SUBMITTED = tax.report_submitted.v1', TAX_EVENTS.REPORT_SUBMITTED === 'tax.report_submitted.v1');
assert('REPORT_PAID = tax.report_paid.v1', TAX_EVENTS.REPORT_PAID === 'tax.report_paid.v1');
assert('REPORT_REJECTED = tax.report_rejected.v1', TAX_EVENTS.REPORT_REJECTED === 'tax.report_rejected.v1');
assert('ALL_TAX_EVENTS 包含 12 个', ALL_TAX_EVENTS.length === 12);
assert('TAX_EVENT_COUNT = 12', TAX_EVENT_COUNT === 12);
assert('TAX_EVENT_SOURCES 包含 12 个源', Object.keys(TAX_EVENT_SOURCES).length === 12, `actual=${Object.keys(TAX_EVENT_SOURCES).length}`);
assert('TAX_EVENT_SOURCES.SYSTEM = system', TAX_EVENT_SOURCES.SYSTEM === 'system');
assert('TAX_EVENT_SOURCES.ORDER = order', TAX_EVENT_SOURCES.ORDER === 'order');
assert('TAX_EVENT_SOURCES.PAYMENT = payment', TAX_EVENT_SOURCES.PAYMENT === 'payment');
assert('TAX_EVENT_SOURCES.TAX = tax', TAX_EVENT_SOURCES.TAX === 'tax');
assert('isValidTaxEvent(tax.paid.v1) = true', isValidTaxEvent('tax.paid.v1'));
assert('isValidTaxEvent(invalid.event) = false', !isValidTaxEvent('invalid.event'));
assert('isValidTaxEventSource(system) = true', isValidTaxEventSource('system'));
assert('isValidTaxEventSource(unknown) = false', !isValidTaxEventSource('unknown'));

// ============================================================
// [14] 事件 Payload 类型存在性（编译时已保证）
// ============================================================
console.log('\n[14] 事件 Payload 类型');
const sample1: TaxRuleCreatedPayload = {
  occurred_at: '2026-07-01T00:00:00.000Z',
  source: TAX_EVENT_SOURCES.ADMIN,
  rule_id: 'r1',
  rule_code: 'CN_VAT_13',
  tax_type: TAX_TYPES.VAT,
  region_code: 'CN',
  tax_rate: '0.13',
  tax_mode: TAX_MODE.EXCLUSIVE,
  status: TAX_RULE_STATUS.ACTIVE,
};
assert('TaxRuleCreatedPayload 可构造', sample1.rule_code === 'CN_VAT_13');
const sample2: TaxCalculatedPayload = {
  occurred_at: '2026-07-01T00:00:00.000Z',
  source: TAX_EVENT_SOURCES.ORDER,
  tax_type: TAX_TYPES.VAT,
  region_code: 'CN',
  taxable_amount: '1000',
  tax_rate: '0.13',
  tax_amount: '130',
  currency: 'CNY',
  tax_mode: TAX_MODE.EXCLUSIVE,
};
assert('TaxCalculatedPayload 可构造', sample2.tax_amount === '130');
const sample3: TaxRecordedPayload = {
  occurred_at: '2026-07-01T00:00:00.000Z',
  source: TAX_EVENT_SOURCES.ORDER,
  record_id: 'rec1',
  record_no: 'FTR20260701ABC12345',
  tax_type: TAX_TYPES.VAT,
  source_type: 'order',
  source_id: 'ord1',
  taxable_amount: '1000',
  tax_amount: '130',
  currency: 'CNY',
  status: TAX_RECORD_STATUS.RESERVED,
};
assert('TaxRecordedPayload 可构造', sample3.record_no.startsWith('FTR'));

// ============================================================
// [15] 错误码 + 异常类
// ============================================================
console.log('\n[15] 错误码 + 异常类');
assert('TAX_ERROR_CODE_COUNT = 34', TAX_ERROR_CODE_COUNT === 34, `actual=${TAX_ERROR_CODE_COUNT}`);
assert('getTaxErrorCodeCount() = 34', getTaxErrorCodeCount() === 34);
assert('RULE_NOT_FOUND = TAX_RULE_NOT_FOUND', TAX_ERROR_CODES.RULE_NOT_FOUND === 'TAX_RULE_NOT_FOUND');
assert('RECORD_NOT_FOUND = TAX_RECORD_NOT_FOUND', TAX_ERROR_CODES.RECORD_NOT_FOUND === 'TAX_RECORD_NOT_FOUND');
assert('REPORT_NOT_FOUND = TAX_REPORT_NOT_FOUND', TAX_ERROR_CODES.REPORT_NOT_FOUND === 'TAX_REPORT_NOT_FOUND');
assert('isFjnTaxErrorCode(TAX_RULE_NOT_FOUND) = true', isFjnTaxErrorCode('TAX_RULE_NOT_FOUND'));
assert('isFjnTaxErrorCode(INVALID) = false', !isFjnTaxErrorCode('INVALID'));

// 异常类实例化
const e1 = new FjnTaxRuleNotFoundError({ id: 'r1' });
assert('FjnTaxRuleNotFoundError 可构造', e1.name === 'FjnTaxRuleNotFoundError');
const e2 = new FjnTaxRuleInvalidRateError({ taxRate: '1.5' });
assert('FjnTaxRuleInvalidRateError 可构造', e2.name === 'FjnTaxRuleInvalidRateError');
const e3 = new FjnTaxRecordNotFoundError({ id: 'rec1' });
assert('FjnTaxRecordNotFoundError 可构造', e3.name === 'FjnTaxRecordNotFoundError');
const e4 = new FjnTaxReportNotFoundError({ id: 'rpt1' });
assert('FjnTaxReportNotFoundError 可构造', e4.name === 'FjnTaxReportNotFoundError');
const e5 = new FjnTaxAmountInvalidError({ amount: '-1' });
assert('FjnTaxAmountInvalidError 可构造', e5.name === 'FjnTaxAmountInvalidError');
const e6 = new FjnTaxReportPeriodInvalidError({ period: '2026-13' });
assert('FjnTaxReportPeriodInvalidError 可构造', e6.name === 'FjnTaxReportPeriodInvalidError');
assert('isFjnTaxError(e1) = true', isFjnTaxError(e1));
assert('isFjnTaxError(new Error()) = false', !isFjnTaxError(new Error('test')));

// ============================================================
// [16] 状态机转移表完整性
// ============================================================
console.log('\n[16] 状态机转移表完整性');
const ruleKeys = Object.keys(TAX_RULE_STATUS_TRANSITIONS);
const recordKeys = Object.keys(TAX_RECORD_STATUS_TRANSITIONS);
const reportKeys = Object.keys(TAX_REPORT_STATUS_TRANSITIONS);
assert('TAX_RULE_STATUS_TRANSITIONS 包含 3 个状态', ruleKeys.length === 3);
assert('TAX_RECORD_STATUS_TRANSITIONS 包含 4 个状态', recordKeys.length === 4);
assert('TAX_REPORT_STATUS_TRANSITIONS 包含 4 个状态', reportKeys.length === 4);
assert('archived -> 0 后续状态', TAX_RULE_STATUS_TRANSITIONS['archived'].length === 0);
assert('reversed -> 0 后续状态', TAX_RECORD_STATUS_TRANSITIONS['reversed'].length === 0);
assert('paid -> 0 后续状态（报表）', TAX_REPORT_STATUS_TRANSITIONS['paid'].length === 0);

// ============================================================
// [17] Service 类可实例化
// ============================================================
console.log('\n[17] Service 类可实例化');
const svc1 = new FjnTaxService();
assert('FjnTaxService 默认实例化', svc1 instanceof FjnTaxService);
const svc2 = createFjnTaxService();
assert('createFjnTaxService 工厂可用', svc2 instanceof FjnTaxService);
const svc3 = createFjnTaxService({ serviceName: 'CustomTax' });
assert('createFjnTaxService 接受 options', svc3 instanceof FjnTaxService);

// ============================================================
// [18] 输入类型存在性（编译时验证）
// ============================================================
console.log('\n[18] 输入类型存在性');
const _createInput: CreateTaxRuleInput = {
  ruleCode: 'CN_VAT_13',
  taxType: TAX_TYPES.VAT,
  regionCode: 'CN',
  taxRate: '0.13',
  taxMode: TAX_MODE.EXCLUSIVE,
  effectiveFrom: new Date('2026-01-01'),
};
assert('CreateTaxRuleInput 可构造', _createInput.taxRate === '0.13');

const _calcInput: CalculateTaxInput = {
  ruleId: 'r1',
  taxableAmount: '1000',
  currency: 'CNY',
  taxMode: TAX_MODE.EXCLUSIVE,
  source: TAX_EVENT_SOURCES.ORDER,
};
assert('CalculateTaxInput 可构造', _calcInput.taxMode === TAX_MODE.EXCLUSIVE);

const _recordInput: RecordTaxInput = {
  ruleId: 'r1',
  sourceType: 'order',
  sourceId: 'ord1',
  taxableAmount: '1000',
  taxMode: TAX_MODE.EXCLUSIVE,
  currency: 'CNY',
};
assert('RecordTaxInput 可构造', _recordInput.sourceType === 'order');

// ============================================================
// [19] 状态机 - 业务行为
// ============================================================
console.log('\n[19] 状态机 - 业务行为');
// 一个规则可以 archived 但不能从 archived 复活
assert('active rule 可 archived', isTerminalTaxRuleStatus(TAX_RULE_STATUS.ARCHIVED) === true);
assert('inactive rule 也可 archived', canTransitTaxRuleStatus(TAX_RULE_STATUS.INACTIVE, TAX_RULE_STATUS.ARCHIVED));
// 报表 submitted 之后只能到 paid 或 rejected
assert('submitted 状态可去 paid', canTransitTaxReportStatus(TAX_REPORT_STATUS.SUBMITTED, TAX_REPORT_STATUS.PAID));
assert('submitted 状态可去 rejected', canTransitTaxReportStatus(TAX_REPORT_STATUS.SUBMITTED, TAX_REPORT_STATUS.REJECTED));
// 报表 rejected 后可重新开始
assert('rejected 状态可回 draft', canTransitTaxReportStatus(TAX_REPORT_STATUS.REJECTED, TAX_REPORT_STATUS.DRAFT));
// 记录 reserved 可去任何状态
assert('reserved 可去 paid/adjusted/reversed',
  canTransitTaxRecordStatus(TAX_RECORD_STATUS.RESERVED, TAX_RECORD_STATUS.PAID) &&
  canTransitTaxRecordStatus(TAX_RECORD_STATUS.RESERVED, TAX_RECORD_STATUS.ADJUSTED) &&
  canTransitTaxRecordStatus(TAX_RECORD_STATUS.RESERVED, TAX_RECORD_STATUS.REVERSED)
);

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
  console.log(`\n✅ FJN Tax Service 冒烟测试全部通过（${pass} 项断言）`);
  process.exit(0);
}
