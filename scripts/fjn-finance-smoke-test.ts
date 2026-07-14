/**
 * FJN Finance Service 冒烟测试
 *
 * 验证：
 *  - 4 个状态机：账户/流水/结算单/结算条目
 *  - 14 个事件常量 + Payload
 *  - 47 个错误码 + 异常类
 *  - Service 类可实例化
 *  - 工厂函数
 *  - 模块导出完整性
 *  - 跨 Service 联动验证
 */
import {
  // 状态机
  FINANCE_ACCOUNT_STATUS,
  FINANCE_ACCOUNT_STATUS_TRANSITIONS,
  ALL_FINANCE_ACCOUNT_STATUSES,
  TERMINAL_FINANCE_ACCOUNT_STATUSES,
  FINANCE_LEDGER_STATUS,
  FINANCE_LEDGER_STATUS_TRANSITIONS,
  ALL_FINANCE_LEDGER_STATUSES,
  TERMINAL_FINANCE_LEDGER_STATUSES,
  FINANCE_DIRECTION,
  FINANCE_SETTLEMENT_STATUS,
  FINANCE_SETTLEMENT_STATUS_TRANSITIONS,
  ALL_FINANCE_SETTLEMENT_STATUSES,
  TERMINAL_FINANCE_SETTLEMENT_STATUSES,
  FINANCE_SETTLEMENT_ITEM_STATUS,
  FINANCE_SETTLEMENT_ITEM_STATUS_TRANSITIONS,
  ALL_FINANCE_SETTLEMENT_ITEM_STATUSES,
  TERMINAL_FINANCE_SETTLEMENT_ITEM_STATUSES,
  FINANCE_ACCOUNT_TYPES,
  ALL_FINANCE_ACCOUNT_TYPES,
  FINANCE_BUSINESS_TYPES,
  ALL_FINANCE_BUSINESS_TYPES,
  FINANCE_SETTLEMENT_TYPES,
  ALL_FINANCE_SETTLEMENT_TYPES,
  canTransitFinanceAccountStatus,
  canTransitFinanceLedgerStatus,
  canTransitFinanceSettlementStatus,
  canTransitFinanceSettlementItemStatus,
  assertTransitFinanceAccountStatus,
  assertTransitFinanceLedgerStatus,
  assertTransitFinanceSettlementStatus,
  assertTransitFinanceSettlementItemStatus,
  isTerminalFinanceAccountStatus,
  isTerminalFinanceLedgerStatus,
  isTerminalFinanceSettlementStatus,
  isTerminalFinanceSettlementItemStatus,
  isFinanceAccountOperable,
  isFinanceLedgerReversible,
  isFinanceSettlementApprovable,
  isFinanceSettlementPayable,
  isFinanceSettlementCancellable,
  isFinanceSettlementItemPayable,
  isFinanceSettlementItemRetriable,
  nextFinanceAccountStatuses,
  nextFinanceLedgerStatuses,
  nextFinanceSettlementStatuses,
  nextFinanceSettlementItemStatuses,
  // 事件
  FINANCE_EVENTS,
  FINANCE_EVENT_SOURCES,
  ALL_FINANCE_EVENTS,
  FINANCE_EVENT_COUNT,
  isValidFinanceEvent,
  isValidFinanceEventSource,
  // 错误
  FINANCE_ERROR_CODES,
  ALL_FINANCE_ERROR_CODES,
  FINANCE_ERROR_CODE_COUNT,
  isFjnFinanceErrorCode,
  getFinanceErrorCodeCount,
  isFjnFinanceError,
  FjnFinanceAccountNotFoundError,
  FjnFinanceAccountAlreadyExistsError,
  FjnFinanceAccountFrozenError,
  FjnFinanceAccountClosedError,
  FjnFinanceAccountStatusInvalidError,
  FjnFinanceAccountTypeInvalidError,
  FjnFinanceAccountBalanceNegativeError,
  FjnFinanceLedgerNotFoundError,
  FjnFinanceLedgerAlreadyReversedError,
  FjnFinanceLedgerAlreadyVoidedError,
  FjnFinanceLedgerAmountInvalidError,
  FjnFinanceLedgerAmountNegativeError,
  FjnFinanceLedgerAmountZeroError,
  FjnFinanceLedgerDirectionInvalidError,
  FjnFinanceLedgerBalanceMismatchError,
  FjnFinanceLedgerCurrencyMismatchError,
  FjnFinanceLedgerSourceInvalidError,
  FjnFinanceLedgerReverseNotAllowedError,
  FjnFinanceSettlementNotFoundError,
  FjnFinanceSettlementAlreadyExistsError,
  FjnFinanceSettlementStatusInvalidError,
  FjnFinanceSettlementNotApprovableError,
  FjnFinanceSettlementNotPayableError,
  FjnFinanceSettlementNotCancellableError,
  FjnFinanceSettlementAmountInvalidError,
  FjnFinanceSettlementPeriodInvalidError,
  FjnFinanceSettlementNoItemsError,
  FjnFinanceSettlementAlreadyPaidError,
  FjnFinanceSettlementItemNotFoundError,
  FjnFinanceSettlementItemNotPayableError,
  FjnFinanceSettlementItemNotRetriableError,
  FjnFinanceSettlementItemBankInfoRequiredError,
  FjnFinanceSettlementItemAmountInvalidError,
  FjnFinanceAmountInvalidError,
  FjnFinanceCurrencyMismatchError,
  FjnFinanceCurrencyNotSupportedError,
  FjnFinanceApproverRequiredError,
  FjnFinanceOperatorRequiredError,
  FjnFinanceReasonRequiredError,
  FjnFinancePeriodLockedError,
  FjnFinanceDailyLimitExceededError,
  FjnFinanceRevenue369AmountMismatchError,
  FjnFinanceRevenue369OrderRequiredError,
  FjnFinanceRevenue369RuleVersionInvalidError,
  FjnFinanceRevenue369PoolsNotInitializedError,
  FjnFinanceReportPeriodInvalidError,
  FjnFinanceReportNotFoundError,
  // Service
  FjnFinanceService,
  createFjnFinanceService,
  // 跨 Service
  FjnRevenueService,
  FjnOrderService,
  FjnPaymentService,
} from '../src/lib/fjn';

let pass = 0;
let fail = 0;
function assert(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name}`, detail ?? '');
  }
}

console.log('\n========== FJN Finance Service 冒烟测试 ==========\n');

// [1] 财务账户状态机
console.log('[1] 财务账户状态机');
assert('FINANCE_ACCOUNT_STATUS.ACTIVE = active', FINANCE_ACCOUNT_STATUS.ACTIVE === 'active');
assert('FINANCE_ACCOUNT_STATUS.FROZEN = frozen', FINANCE_ACCOUNT_STATUS.FROZEN === 'frozen');
assert('FINANCE_ACCOUNT_STATUS.CLOSED = closed', FINANCE_ACCOUNT_STATUS.CLOSED === 'closed');
assert('所有 3 个账户状态在列表中', ALL_FINANCE_ACCOUNT_STATUSES.length === 3);
assert('CLOSED 是账户终态', TERMINAL_FINANCE_ACCOUNT_STATUSES.includes('closed' as any));
assert('ACTIVE 不是账户终态', !isTerminalFinanceAccountStatus('active'));
assert('CLOSED 是账户终态', isTerminalFinanceAccountStatus('closed'));
assert('ACTIVE 可转移至 FROZEN', canTransitFinanceAccountStatus('active', 'frozen'));
assert('ACTIVE 可转移至 CLOSED', canTransitFinanceAccountStatus('active', 'closed'));
assert('FROZEN 可转移至 ACTIVE', canTransitFinanceAccountStatus('frozen', 'active'));
assert('FROZEN 可转移至 CLOSED', canTransitFinanceAccountStatus('frozen', 'closed'));
assert('CLOSED 不可转移', !canTransitFinanceAccountStatus('closed', 'active'));
assert('ACTIVE 不可直接跳到 CLOSED 状态外的状态', !canTransitFinanceAccountStatus('active', 'active'));
assert('isFinanceAccountOperable(ACTIVE) = true', isFinanceAccountOperable('active'));
assert('isFinanceAccountOperable(FROZEN) = false', !isFinanceAccountOperable('frozen'));
assert('isFinanceAccountOperable(CLOSED) = false', !isFinanceAccountOperable('closed'));

// assertTransitFinanceAccountStatus
try {
  assertTransitFinanceAccountStatus('active', 'frozen');
  assert('assertTransitFinanceAccountStatus(active, frozen) 不抛异常', true);
} catch (e) {
  assert('assertTransitFinanceAccountStatus(active, frozen) 不抛异常', false, e);
}
try {
  assertTransitFinanceAccountStatus('closed', 'active');
  assert('assertTransitFinanceAccountStatus(closed, active) 抛异常', false);
} catch (e) {
  assert('assertTransitFinanceAccountStatus(closed, active) 抛异常', true);
}

// [2] 财务流水状态机
console.log('\n[2] 财务流水状态机');
assert('FINANCE_LEDGER_STATUS.POSTED = posted', FINANCE_LEDGER_STATUS.POSTED === 'posted');
assert('FINANCE_LEDGER_STATUS.REVERSED = reversed', FINANCE_LEDGER_STATUS.REVERSED === 'reversed');
assert('FINANCE_LEDGER_STATUS.VOID = void', FINANCE_LEDGER_STATUS.VOID === 'void');
assert('所有 3 个流水状态在列表中', ALL_FINANCE_LEDGER_STATUSES.length === 3);
assert('POSTED 不是终态', !isTerminalFinanceLedgerStatus('posted'));
assert('REVERSED 是终态', isTerminalFinanceLedgerStatus('reversed'));
assert('VOID 是终态', isTerminalFinanceLedgerStatus('void'));
assert('POSTED 可冲销', canTransitFinanceLedgerStatus('posted', 'reversed'));
assert('POSTED 可作废', canTransitFinanceLedgerStatus('posted', 'void'));
assert('REVERSED 不可转移', FINANCE_LEDGER_STATUS_TRANSITIONS['reversed'].length === 0);
assert('isFinanceLedgerReversible(POSTED) = true', isFinanceLedgerReversible('posted'));
assert('isFinanceLedgerReversible(REVERSED) = false', !isFinanceLedgerReversible('reversed'));

// [3] 结算单状态机
console.log('\n[3] 结算单状态机');
assert('FINANCE_SETTLEMENT_STATUS.CREATED = created', FINANCE_SETTLEMENT_STATUS.CREATED === 'created');
assert('FINANCE_SETTLEMENT_STATUS.APPROVED = approved', FINANCE_SETTLEMENT_STATUS.APPROVED === 'approved');
assert('FINANCE_SETTLEMENT_STATUS.PAID = paid', FINANCE_SETTLEMENT_STATUS.PAID === 'paid');
assert('FINANCE_SETTLEMENT_STATUS.CANCELLED = cancelled', FINANCE_SETTLEMENT_STATUS.CANCELLED === 'cancelled');
assert('所有 4 个结算单状态在列表中', ALL_FINANCE_SETTLEMENT_STATUSES.length === 4);
assert('PAID 是结算单终态', TERMINAL_FINANCE_SETTLEMENT_STATUSES.includes('paid' as any));
assert('CANCELLED 是结算单终态', TERMINAL_FINANCE_SETTLEMENT_STATUSES.includes('cancelled' as any));
assert('CREATED -> APPROVED 合法', canTransitFinanceSettlementStatus('created', 'approved'));
assert('APPROVED -> PAID 合法', canTransitFinanceSettlementStatus('approved', 'paid'));
assert('CREATED -> CANCELLED 合法', canTransitFinanceSettlementStatus('created', 'cancelled'));
assert('APPROVED -> CANCELLED 合法', canTransitFinanceSettlementStatus('approved', 'cancelled'));
assert('PAID 不可转移', FINANCE_SETTLEMENT_STATUS_TRANSITIONS['paid'].length === 0);
assert('isFinanceSettlementApprovable(CREATED) = true', isFinanceSettlementApprovable('created'));
assert('isFinanceSettlementPayable(APPROVED) = true', isFinanceSettlementPayable('approved'));
assert('isFinanceSettlementCancellable(CREATED) = true', isFinanceSettlementCancellable('created'));
assert('isFinanceSettlementCancellable(PAID) = false', !isFinanceSettlementCancellable('paid'));

// [4] 结算条目状态机
console.log('\n[4] 结算条目状态机');
assert('FINANCE_SETTLEMENT_ITEM_STATUS.PENDING = pending', FINANCE_SETTLEMENT_ITEM_STATUS.PENDING === 'pending');
assert('FINANCE_SETTLEMENT_ITEM_STATUS.PAID = paid', FINANCE_SETTLEMENT_ITEM_STATUS.PAID === 'paid');
assert('FINANCE_SETTLEMENT_ITEM_STATUS.FAILED = failed', FINANCE_SETTLEMENT_ITEM_STATUS.FAILED === 'failed');
assert('所有 3 个条目状态在列表中', ALL_FINANCE_SETTLEMENT_ITEM_STATUSES.length === 3);
assert('PENDING 可转移 PAID', canTransitFinanceSettlementItemStatus('pending', 'paid'));
assert('PENDING 可转移 FAILED', canTransitFinanceSettlementItemStatus('pending', 'failed'));
assert('FAILED 可重试 PENDING', canTransitFinanceSettlementItemStatus('failed', 'pending'));
assert('PAID 不可转移', FINANCE_SETTLEMENT_ITEM_STATUS_TRANSITIONS['paid'].length === 0);
assert('isFinanceSettlementItemPayable(PENDING) = true', isFinanceSettlementItemPayable('pending'));
assert('isFinanceSettlementItemRetriable(FAILED) = true', isFinanceSettlementItemRetriable('failed'));

// [5] 工具函数
console.log('\n[5] 状态机工具函数');
const nextAcc = nextFinanceAccountStatuses('active');
assert('nextFinanceAccountStatuses(active) 包含 2 个', nextAcc.length === 2);
assert('nextFinanceAccountStatuses(active) 包含 frozen', nextAcc.includes('frozen'));
const nextStl = nextFinanceSettlementStatuses('approved');
assert('nextFinanceSettlementStatuses(approved) 包含 paid', nextStl.includes('paid'));
assert('nextFinanceSettlementStatuses(approved) 包含 cancelled', nextStl.includes('cancelled'));

// [6] 业务枚举
console.log('\n[6] 业务枚举');
assert('FINANCE_DIRECTION.IN = in', FINANCE_DIRECTION.IN === 'in');
assert('FINANCE_DIRECTION.OUT = out', FINANCE_DIRECTION.OUT === 'out');
assert('10 个账户类型', ALL_FINANCE_ACCOUNT_TYPES.length === 10);
assert('WINE_COST_POOL = wine_cost_pool', FINANCE_ACCOUNT_TYPES.WINE_COST_POOL === 'wine_cost_pool');
assert('MARKET_ECOSYSTEM_POOL = market_ecosystem_pool', FINANCE_ACCOUNT_TYPES.MARKET_ECOSYSTEM_POOL === 'market_ecosystem_pool');
assert('COMPANY_POOL = company_pool', FINANCE_ACCOUNT_TYPES.COMPANY_POOL === 'company_pool');
assert('14 个业务类型', ALL_FINANCE_BUSINESS_TYPES.length === 14);
assert('INCOME 业务类型', FINANCE_BUSINESS_TYPES.INCOME === 'income');
assert('5 个结算单类型', ALL_FINANCE_SETTLEMENT_TYPES.length === 5);
assert('REFERRAL 结算单', FINANCE_SETTLEMENT_TYPES.REFERRAL === 'referral');

// [7] 事件常量
console.log('\n[7] 事件常量');
assert('FINANCE_EVENTS.ACCOUNT_CREATED 存在', !!FINANCE_EVENTS.ACCOUNT_CREATED);
assert('FINANCE_EVENTS.LEDGER_POSTED 存在', !!FINANCE_EVENTS.LEDGER_POSTED);
assert('FINANCE_EVENTS.REVENUE_RECOGNIZED 存在', !!FINANCE_EVENTS.REVENUE_RECOGNIZED);
assert('FINANCE_EVENTS.REVENUE_369_ALLOCATED 存在', !!FINANCE_EVENTS.REVENUE_369_ALLOCATED);
assert('FINANCE_EVENTS.SETTLEMENT_CREATED 存在', !!FINANCE_EVENTS.SETTLEMENT_CREATED);
assert('FINANCE_EVENT_COUNT = 15', FINANCE_EVENT_COUNT === 15);
assert('ALL_FINANCE_EVENTS 包含 15 个', ALL_FINANCE_EVENTS.length === 15);
assert('isValidFinanceEvent(finance.account_created.v1) = true', isValidFinanceEvent('finance.account_created.v1'));
assert('isValidFinanceEvent(foo.bar) = false', !isValidFinanceEvent('foo.bar'));

// [8] 事件源
console.log('\n[8] 事件源');
assert('14 个事件源', Object.keys(FINANCE_EVENT_SOURCES).length === 14);
assert('FINANCE_EVENT_SOURCES.REVENUE = revenue', FINANCE_EVENT_SOURCES.REVENUE === 'revenue');
assert('FINANCE_EVENT_SOURCES.SETTLEMENT = settlement', FINANCE_EVENT_SOURCES.SETTLEMENT === 'settlement');
assert('isValidFinanceEventSource(revenue) = true', isValidFinanceEventSource('revenue'));
assert('isValidFinanceEventSource(invalid) = false', !isValidFinanceEventSource('invalid'));

// [9] 错误码
console.log('\n[9] 错误码');
assert('FINANCE_ERROR_CODES.ACCOUNT_NOT_FOUND 存在', !!FINANCE_ERROR_CODES.ACCOUNT_NOT_FOUND);
assert('FINANCE_ERROR_CODES.LEDGER_NOT_FOUND 存在', !!FINANCE_ERROR_CODES.LEDGER_NOT_FOUND);
assert('FINANCE_ERROR_CODES.SETTLEMENT_NOT_FOUND 存在', !!FINANCE_ERROR_CODES.SETTLEMENT_NOT_FOUND);
assert('FINANCE_ERROR_CODES.REVENUE_369_AMOUNT_MISMATCH 存在', !!FINANCE_ERROR_CODES.REVENUE_369_AMOUNT_MISMATCH);
assert('FINANCE_ERROR_CODE_COUNT = 47', FINANCE_ERROR_CODE_COUNT === 47);
assert('ALL_FINANCE_ERROR_CODES 包含 47 个', ALL_FINANCE_ERROR_CODES.length === 47);
assert('isFjnFinanceErrorCode(FINANCE_ACCOUNT_NOT_FOUND) = true', isFjnFinanceErrorCode('FINANCE_ACCOUNT_NOT_FOUND'));
assert('isFjnFinanceErrorCode(INVALID) = false', !isFjnFinanceErrorCode('INVALID'));
assert('getFinanceErrorCodeCount() = 47', getFinanceErrorCodeCount() === 47);

// [10] 异常类
console.log('\n[10] 异常类');
assert('FjnFinanceAccountNotFoundError 继承 FjnError', new FjnFinanceAccountNotFoundError({ id: 'a' }) instanceof Error);
assert('FjnFinanceAccountNotFoundError httpStatus = 404', new FjnFinanceAccountNotFoundError({}).httpStatus === 404);
assert('FjnFinanceAccountAlreadyExistsError httpStatus = 409', new FjnFinanceAccountAlreadyExistsError({}).httpStatus === 409);
assert('FjnFinanceAccountFrozenError httpStatus = 422', new FjnFinanceAccountFrozenError({}).httpStatus === 422);
assert('FjnFinanceLedgerAmountZeroError httpStatus = 400', new FjnFinanceLedgerAmountZeroError({}).httpStatus === 400);
assert('FjnFinanceSettlementStatusInvalidError httpStatus = 422', new FjnFinanceSettlementStatusInvalidError({}).httpStatus === 422);
assert('FjnFinanceApproverRequiredError httpStatus = 400', new FjnFinanceApproverRequiredError({}).httpStatus === 400);
assert('FjnFinanceRevenue369AmountMismatchError httpStatus = 422', new FjnFinanceRevenue369AmountMismatchError({}).httpStatus === 422);

// isFjnFinanceError
assert('isFjnFinanceError(FjnFinanceAccountNotFoundError) = true', isFjnFinanceError(new FjnFinanceAccountNotFoundError({})));
assert('isFjnFinanceError(普通 Error) = false', !isFjnFinanceError(new Error('test')));

// [11] 状态流转表完整性
console.log('\n[11] 状态流转表完整性');
const allAccStatus: string[] = ['active', 'frozen', 'closed'];
allAccStatus.forEach((s) => {
  assert(`账户状态 ${s} 在流转表中`, !!FINANCE_ACCOUNT_STATUS_TRANSITIONS[s as any]);
});
const allStlStatus: string[] = ['created', 'approved', 'paid', 'cancelled'];
allStlStatus.forEach((s) => {
  assert(`结算单状态 ${s} 在流转表中`, !!FINANCE_SETTLEMENT_STATUS_TRANSITIONS[s as any]);
});
assert('所有结算单终态不可转移', TERMINAL_FINANCE_SETTLEMENT_STATUSES.every((s) => FINANCE_SETTLEMENT_STATUS_TRANSITIONS[s].length === 0));
assert('所有账户终态不可转移', TERMINAL_FINANCE_ACCOUNT_STATUSES.every((s) => FINANCE_ACCOUNT_STATUS_TRANSITIONS[s].length === 0));

// [12] Service 类可实例化
console.log('\n[12] Service 类可实例化');
const svc = new FjnFinanceService();
assert('FjnFinanceService 可实例化', svc instanceof FjnFinanceService);
assert('serviceName 默认值', svc.serviceName === 'FjnFinanceService');
assert('prisma 已注入', !!svc.prisma);
const factorySvc = createFjnFinanceService();
assert('createFjnFinanceService 工厂正常', factorySvc instanceof FjnFinanceService);
const customSvc = createFjnFinanceService({ serviceName: 'CustomFinance' });
assert('自定义 serviceName 生效', customSvc.serviceName === 'CustomFinance');

// [13] 模块导出完整性
console.log('\n[13] 模块导出完整性');
assert('state-machine 导出 FINANCE_ACCOUNT_STATUS', !!FINANCE_ACCOUNT_STATUS);
assert('state-machine 导出 canTransitFinanceAccountStatus', typeof canTransitFinanceAccountStatus === 'function');
assert('events 导出 FINANCE_EVENTS', !!FINANCE_EVENTS);
assert('events 导出 FINANCE_EVENT_SOURCES', !!FINANCE_EVENT_SOURCES);
assert('errors 导出 FINANCE_ERROR_CODES', !!FINANCE_ERROR_CODES);
assert('errors 导出 FjnFinanceAccountNotFoundError', typeof FjnFinanceAccountNotFoundError === 'function');

// [14] 跨 Service 联动验证
console.log('\n[14] 跨 Service 联动验证');
assert('FjnFinanceService + FjnRevenueService + FjnOrderService + FjnPaymentService 可同时导入',
  !!FjnFinanceService && !!FjnRevenueService && !!FjnOrderService && !!FjnPaymentService);

// [15] 状态机强制转移
console.log('\n[15] 状态机强制转移');
try {
  assertTransitFinanceAccountStatus('active', 'frozen');
  assert('assertTransitFinanceAccountStatus(active->frozen) 正常', true);
} catch {
  assert('assertTransitFinanceAccountStatus(active->frozen) 正常', false);
}
try {
  assertTransitFinanceLedgerStatus('posted', 'reversed');
  assert('assertTransitFinanceLedgerStatus(posted->reversed) 正常', true);
} catch {
  assert('assertTransitFinanceLedgerStatus(posted->reversed) 正常', false);
}
try {
  assertTransitFinanceSettlementStatus('created', 'approved');
  assert('assertTransitFinanceSettlementStatus(created->approved) 正常', true);
} catch {
  assert('assertTransitFinanceSettlementStatus(created->approved) 正常', false);
}
try {
  assertTransitFinanceSettlementItemStatus('pending', 'paid');
  assert('assertTransitFinanceSettlementItemStatus(pending->paid) 正常', true);
} catch {
  assert('assertTransitFinanceSettlementItemStatus(pending->paid) 正常', false);
}

// [16] 异常抛出
console.log('\n[16] 异常抛出');
try {
  throw new FjnFinanceAccountNotFoundError({ id: 'test' });
} catch (e: any) {
  assert('FjnFinanceAccountNotFoundError 抛出后 message 正确', e.message.includes('财务账户不存在'));
  assert('FjnFinanceAccountNotFoundError 抛出后 code 正确', e.code === 'FJN_NOT_FOUND');
}
try {
  throw new FjnFinanceRevenue369AmountMismatchError({ total: '100' });
} catch (e: any) {
  assert('FjnFinanceRevenue369AmountMismatchError 抛出后 code 正确', e.code === 'FJN_BUSINESS_RULE');
  assert('FjnFinanceRevenue369AmountMismatchError message 包含 369', e.message.includes('369'));
}

console.log(`\n========== 测试结果 ==========`);
console.log(`✅ 通过: ${pass}`);
console.log(`❌ 失败: ${fail}`);
console.log(`📊 合计: ${pass + fail}`);
console.log(`📈 通过率: ${((pass / (pass + fail)) * 100).toFixed(2)}%`);

if (fail > 0) {
  console.log(`\n❌ 有 ${fail} 个测试失败`);
  process.exit(1);
} else {
  console.log(`\n✅ 全部测试通过`);
  process.exit(0);
}
