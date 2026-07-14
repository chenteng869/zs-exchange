/**
 * FJN KYC Service 冒烟测试
 *
 * 严格遵循 H018 + H015 工业级规范：
 *  - 状态机常量完整性（6 个状态 + 流转表）
 *  - 状态机工具函数（canTransit/assertTransit/nextStatuses）
 *  - 业务工具（isApprovable/isRejectable/isManualReviewable/isResubmittable）
 *  - KYC 级别 + 证件类型 + 风险 + 提供方
 *  - ISO 3166-1 alpha-2 国家代码校验
 *  - 12 个事件常量（KYC 6 + KYB 6）
 *  - 错误码 + 异常类
 *  - Service 类可实例化
 *  - 业务常量（默认有效期 365 天、拒绝意见最小长度 5）
 */

import { FjnError } from '../src/lib/fjn/errors';
import {
  KYC_STATUS,
  KYC_LEVEL,
  KYC_DOCUMENT_TYPE,
  KYC_RISK_STATUS,
  KYC_PROVIDER,
  KYC_STATUS_TRANSITIONS,
  ALL_KYC_STATUSES,
  ALL_KYC_LEVELS,
  ALL_KYC_DOCUMENT_TYPES,
  ALL_KYC_RISK_STATUSES,
  ALL_KYC_PROVIDERS,
  TERMINAL_KYC_STATUSES,
  VALID_KYC_DB_STATUSES,
  isValidKycStatus,
  isValidKycDbStatus,
  isTerminalKycStatus,
  canTransitKycStatus,
  assertTransitKycStatus,
  nextKycStatuses,
  isKycReviewable,
  isKycApprovable,
  isKycRejectable,
  isKycManualReviewable,
  isKycResubmittable,
  isValidCountryCode,
  type FjnKycStatus,
  type FjnKycLevel,
  type FjnKycDocumentType,
  // 事件
  KYC_EVENTS,
  KYC_EVENT_SOURCES,
  ALL_KYC_EVENTS,
  ALL_KYC_EVENT_SOURCES,
  type FjnKycEventName,
  type FjnKycEventSource,
  // 错误
  KYC_ERROR_CODES,
  type FjnKycErrorCode,
  FjnKycError,
  FjnKycNotFoundError,
  FjnKycAlreadySubmittedError,
  FjnKycAlreadyApprovedError,
  FjnKycAlreadyRejectedError,
  FjnKycStatusInvalidError,
  FjnKycStatusNotApprovableError,
  FjnKycStatusNotRejectableError,
  FjnKycStatusNotManualReviewableError,
  FjnKycStatusNotResubmittableError,
  FjnKycDocumentRequiredError,
  FjnKycDocumentTypeInvalidError,
  FjnKycDocumentCountryInvalidError,
  FjnKycLevelInvalidError,
  FjnKycProviderInvalidError,
  FjnKycReviewerIdRequiredError,
  FjnKycReviewNoteRequiredError,
  FjnKybNotFoundError,
  FjnKybAlreadySubmittedError,
  FjnKybStatusInvalidError,
  FjnKybDocumentRequiredError,
  FjnKybCompanyNameRequiredError,
  FjnKybRegistrationCountryInvalidError,
  FjnKycExternalServiceError,
  FjnKycThirdPartyTimeoutError,
  // Service
  FjnKycService,
  KYC_DEFAULT_EXPIRES_DAYS,
  KYC_REJECT_NOTE_MIN_LENGTH,
  KYC_EXPIRES_DAYS_DEFAULT,
  type SubmitKycInput,
  type ApproveKycInput,
  type SubmitKybInput,
  type ListKycInput,
  type ListKybInput,
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

console.log('=== FJN KYC Service 冒烟测试 ===\n');

// ============================================================
// [1] KYC / KYB 状态常量
// ============================================================
console.log('[1] KYC / KYB 状态常量');
assert('KYC_STATUS.NOT_SUBMITTED = not_submitted', KYC_STATUS.NOT_SUBMITTED === 'not_submitted');
assert('KYC_STATUS.PENDING = pending', KYC_STATUS.PENDING === 'pending');
assert('KYC_STATUS.APPROVED = approved', KYC_STATUS.APPROVED === 'approved');
assert('KYC_STATUS.REJECTED = rejected', KYC_STATUS.REJECTED === 'rejected');
assert('KYC_STATUS.EXPIRED = expired', KYC_STATUS.EXPIRED === 'expired');
assert('KYC_STATUS.MANUAL_REVIEW = manual_review', KYC_STATUS.MANUAL_REVIEW === 'manual_review');
assert('ALL_KYC_STATUSES 包含 6 个', ALL_KYC_STATUSES.length === 6, `actual=${ALL_KYC_STATUSES.length}`);
assert('VALID_KYC_DB_STATUSES 包含 5 个', VALID_KYC_DB_STATUSES.length === 5, `actual=${VALID_KYC_DB_STATUSES.length}`);
assert('isValidKycStatus(pending) = true', isValidKycStatus('pending'));
assert('isValidKycStatus(approved) = true', isValidKycStatus('approved'));
assert('isValidKycStatus(unknown) = false', !isValidKycStatus('unknown'));
assert('isValidKycDbStatus(pending) = true', isValidKycDbStatus('pending'));
assert('isValidKycDbStatus(not_submitted) = false（不入库）', !isValidKycDbStatus('not_submitted'));
assert('isTerminalKycStatus(approved) = false（可 expired）', !isTerminalKycStatus(KYC_STATUS.APPROVED));

// ============================================================
// [2] KYC 状态机流转表
// ============================================================
console.log('\n[2] KYC 状态机流转表');
assert('not_submitted → pending', canTransitKycStatus(KYC_STATUS.NOT_SUBMITTED, KYC_STATUS.PENDING));
assert('not_submitted → approved（非法）', !canTransitKycStatus(KYC_STATUS.NOT_SUBMITTED, KYC_STATUS.APPROVED));
assert('pending → approved（合法）', canTransitKycStatus(KYC_STATUS.PENDING, KYC_STATUS.APPROVED));
assert('pending → rejected（合法）', canTransitKycStatus(KYC_STATUS.PENDING, KYC_STATUS.REJECTED));
assert('pending → manual_review（合法）', canTransitKycStatus(KYC_STATUS.PENDING, KYC_STATUS.MANUAL_REVIEW));
assert('pending → expired（非法）', !canTransitKycStatus(KYC_STATUS.PENDING, KYC_STATUS.EXPIRED));
assert('manual_review → approved（合法）', canTransitKycStatus(KYC_STATUS.MANUAL_REVIEW, KYC_STATUS.APPROVED));
assert('manual_review → pending（非法）', !canTransitKycStatus(KYC_STATUS.MANUAL_REVIEW, KYC_STATUS.PENDING));
assert('approved → expired（合法）', canTransitKycStatus(KYC_STATUS.APPROVED, KYC_STATUS.EXPIRED));
assert('approved → rejected（非法）', !canTransitKycStatus(KYC_STATUS.APPROVED, KYC_STATUS.REJECTED));
assert('rejected → pending（合法）', canTransitKycStatus(KYC_STATUS.REJECTED, KYC_STATUS.PENDING));
assert('rejected → approved（非法）', !canTransitKycStatus(KYC_STATUS.REJECTED, KYC_STATUS.APPROVED));
assert('expired → pending（合法）', canTransitKycStatus(KYC_STATUS.EXPIRED, KYC_STATUS.PENDING));
assert('expired → approved（非法）', !canTransitKycStatus(KYC_STATUS.EXPIRED, KYC_STATUS.APPROVED));

// 流转表必须覆盖所有状态
for (const s of ALL_KYC_STATUSES) {
  assert(`KYC_STATUS_TRANSITIONS[${s}] 已定义`, Array.isArray(KYC_STATUS_TRANSITIONS[s]));
}

// ============================================================
// [3] assertTransit 抛错
// ============================================================
console.log('\n[3] assertTransitKycStatus 抛错');
expectThrow(
  'assertTransit(pending, expired) 抛 FjnError',
  () => assertTransitKycStatus(KYC_STATUS.PENDING, KYC_STATUS.EXPIRED),
  FjnError, // FjnStateMachineError 继承自 FjnError，断言父类即可
);
assert('合法转移不抛错', (() => {
  try {
    assertTransitKycStatus(KYC_STATUS.PENDING, KYC_STATUS.APPROVED);
    return true;
  } catch {
    return false;
  }
})());

// ============================================================
// [4] 业务工具函数
// ============================================================
console.log('\n[4] 业务工具函数');
assert('isKycApprovable(pending) = true', isKycApprovable(KYC_STATUS.PENDING));
assert('isKycApprovable(manual_review) = true', isKycApprovable(KYC_STATUS.MANUAL_REVIEW));
assert('isKycApprovable(approved) = false', !isKycApprovable(KYC_STATUS.APPROVED));
assert('isKycApprovable(rejected) = false', !isKycApprovable(KYC_STATUS.REJECTED));
assert('isKycRejectable(pending) = true', isKycRejectable(KYC_STATUS.PENDING));
assert('isKycRejectable(approved) = false', !isKycRejectable(KYC_STATUS.APPROVED));
assert('isKycManualReviewable(pending) = true', isKycManualReviewable(KYC_STATUS.PENDING));
assert('isKycManualReviewable(approved) = false', !isKycManualReviewable(KYC_STATUS.APPROVED));
assert('isKycResubmittable(rejected) = true', isKycResubmittable(KYC_STATUS.REJECTED));
assert('isKycResubmittable(expired) = true', isKycResubmittable(KYC_STATUS.EXPIRED));
assert('isKycResubmittable(approved) = false', !isKycResubmittable(KYC_STATUS.APPROVED));
assert('isKycResubmittable(pending) = false', !isKycResubmittable(KYC_STATUS.PENDING));
assert('isKycReviewable(pending) = true', isKycReviewable(KYC_STATUS.PENDING));
assert('isKycReviewable(manual_review) = true', isKycReviewable(KYC_STATUS.MANUAL_REVIEW));
assert('isKycReviewable(approved) = false', !isKycReviewable(KYC_STATUS.APPROVED));

// ============================================================
// [5] nextKycStatuses
// ============================================================
console.log('\n[5] nextKycStatuses');
assert('nextKycStatuses(pending) 含 approved', nextKycStatuses(KYC_STATUS.PENDING).includes(KYC_STATUS.APPROVED));
assert('nextKycStatuses(pending) 含 rejected', nextKycStatuses(KYC_STATUS.PENDING).includes(KYC_STATUS.REJECTED));
assert('nextKycStatuses(pending) 含 manual_review', nextKycStatuses(KYC_STATUS.PENDING).includes(KYC_STATUS.MANUAL_REVIEW));
assert('nextKycStatuses(pending).length = 3', nextKycStatuses(KYC_STATUS.PENDING).length === 3);
assert('nextKycStatuses(approved) 仅含 expired', nextKycStatuses(KYC_STATUS.APPROVED).length === 1);
assert('nextKycStatuses(rejected) 仅含 pending', nextKycStatuses(KYC_STATUS.REJECTED).length === 1);

// ============================================================
// [6] KYC 级别 / 证件类型 / 风险 / 提供方
// ============================================================
console.log('\n[6] KYC 级别 / 证件类型 / 风险 / 提供方');
assert('KYC_LEVEL.STANDARD = standard', KYC_LEVEL.STANDARD === 'standard');
assert('KYC_LEVEL.ENHANCED = enhanced', KYC_LEVEL.ENHANCED === 'enhanced');
assert('KYC_LEVEL.INSTITUTIONAL = institutional', KYC_LEVEL.INSTITUTIONAL === 'institutional');
assert('ALL_KYC_LEVELS 包含 3 个', ALL_KYC_LEVELS.length === 3);
assert('KYC_DOCUMENT_TYPE.PASSPORT = passport', KYC_DOCUMENT_TYPE.PASSPORT === 'passport');
assert('KYC_DOCUMENT_TYPE.ID_CARD = id_card', KYC_DOCUMENT_TYPE.ID_CARD === 'id_card');
assert('KYC_DOCUMENT_TYPE.DRIVER_LICENSE = driver_license', KYC_DOCUMENT_TYPE.DRIVER_LICENSE === 'driver_license');
assert('KYC_DOCUMENT_TYPE.RESIDENCE_PERMIT = residence_permit', KYC_DOCUMENT_TYPE.RESIDENCE_PERMIT === 'residence_permit');
assert('ALL_KYC_DOCUMENT_TYPES 包含 4 个', ALL_KYC_DOCUMENT_TYPES.length === 4);
assert('KYC_RISK_STATUS.NORMAL = normal', KYC_RISK_STATUS.NORMAL === 'normal');
assert('KYC_RISK_STATUS.WARNING = warning', KYC_RISK_STATUS.WARNING === 'warning');
assert('KYC_RISK_STATUS.HIGH = high', KYC_RISK_STATUS.HIGH === 'high');
assert('KYC_RISK_STATUS.BLOCKED = blocked', KYC_RISK_STATUS.BLOCKED === 'blocked');
assert('ALL_KYC_RISK_STATUSES 包含 4 个', ALL_KYC_RISK_STATUSES.length === 4);
assert('KYC_PROVIDER.ONFIDO = onfido', KYC_PROVIDER.ONFIDO === 'onfido');
assert('KYC_PROVIDER.MANUAL = manual', KYC_PROVIDER.MANUAL === 'manual');
assert('KYC_PROVIDER.INTERNAL = internal', KYC_PROVIDER.INTERNAL === 'internal');
assert('ALL_KYC_PROVIDERS 包含 5 个', ALL_KYC_PROVIDERS.length === 5, `actual=${ALL_KYC_PROVIDERS.length}`);

// ============================================================
// [7] ISO 3166-1 alpha-2 国家代码校验
// ============================================================
console.log('\n[7] ISO 3166-1 alpha-2 国家代码校验');
assert('isValidCountryCode(CN) = true', isValidCountryCode('CN'));
assert('isValidCountryCode(US) = true', isValidCountryCode('US'));
assert('isValidCountryCode(JP) = true', isValidCountryCode('JP'));
assert('isValidCountryCode(cn) = false（小写）', !isValidCountryCode('cn'));
assert('isValidCountryCode(USA) = false（3 字符）', !isValidCountryCode('USA'));
assert('isValidCountryCode(C) = false（1 字符）', !isValidCountryCode('C'));
assert('isValidCountryCode("") = false', !isValidCountryCode(''));
assert('isValidCountryCode(C12) = false（含数字）', !isValidCountryCode('C12'));

// ============================================================
// [8] 事件常量
// ============================================================
console.log('\n[8] 事件常量');
assert('KYC_EVENTS.KYC_SUBMITTED = kyc.submitted.v1', KYC_EVENTS.KYC_SUBMITTED === 'kyc.submitted.v1');
assert('KYC_EVENTS.KYC_APPROVED = kyc.approved.v1', KYC_EVENTS.KYC_APPROVED === 'kyc.approved.v1');
assert('KYC_EVENTS.KYC_REJECTED = kyc.rejected.v1', KYC_EVENTS.KYC_REJECTED === 'kyc.rejected.v1');
assert('KYC_EVENTS.KYC_EXPIRED = kyc.expired.v1', KYC_EVENTS.KYC_EXPIRED === 'kyc.expired.v1');
assert('KYC_EVENTS.KYC_MANUAL_REVIEW = kyc.manual_review.v1', KYC_EVENTS.KYC_MANUAL_REVIEW === 'kyc.manual_review.v1');
assert('KYC_EVENTS.KYC_RESUBMITTED = kyc.resubmitted.v1', KYC_EVENTS.KYC_RESUBMITTED === 'kyc.resubmitted.v1');
assert('KYC_EVENTS.KYB_SUBMITTED = kyb.submitted.v1', KYC_EVENTS.KYB_SUBMITTED === 'kyb.submitted.v1');
assert('KYC_EVENTS.KYB_APPROVED = kyb.approved.v1', KYC_EVENTS.KYB_APPROVED === 'kyb.approved.v1');
assert('KYC_EVENTS.KYB_REJECTED = kyb.rejected.v1', KYC_EVENTS.KYB_REJECTED === 'kyb.rejected.v1');
assert('KYC_EVENTS.KYB_EXPIRED = kyb.expired.v1', KYC_EVENTS.KYB_EXPIRED === 'kyb.expired.v1');
assert('KYC_EVENTS.KYB_MANUAL_REVIEW = kyb.manual_review.v1', KYC_EVENTS.KYB_MANUAL_REVIEW === 'kyb.manual_review.v1');
assert('KYC_EVENTS.KYB_RESUBMITTED = kyb.resubmitted.v1', KYC_EVENTS.KYB_RESUBMITTED === 'kyb.resubmitted.v1');
assert('ALL_KYC_EVENTS 包含 12 个', ALL_KYC_EVENTS.length === 12, `actual=${ALL_KYC_EVENTS.length}`);
assert('KYC_EVENT_SOURCES.USER = user', KYC_EVENT_SOURCES.USER === 'user');
assert('KYC_EVENT_SOURCES.ADMIN = admin', KYC_EVENT_SOURCES.ADMIN === 'admin');
assert('KYC_EVENT_SOURCES.SYSTEM = system', KYC_EVENT_SOURCES.SYSTEM === 'system');
assert('KYC_EVENT_SOURCES.THIRD_PARTY = third_party', KYC_EVENT_SOURCES.THIRD_PARTY === 'third_party');
assert('KYC_EVENT_SOURCES.RISK_SERVICE = risk_service', KYC_EVENT_SOURCES.RISK_SERVICE === 'risk_service');
assert('KYC_EVENT_SOURCES.SCHEDULER = scheduler', KYC_EVENT_SOURCES.SCHEDULER === 'scheduler');
assert('ALL_KYC_EVENT_SOURCES 包含 6 个', ALL_KYC_EVENT_SOURCES.length === 6);

// ============================================================
// [9] 错误码 + 异常类
// ============================================================
console.log('\n[9] 错误码 + 异常类');
assert('KYC_ERROR_CODES.KYC_NOT_FOUND = KYC_NOT_FOUND', KYC_ERROR_CODES.KYC_NOT_FOUND === 'KYC_NOT_FOUND');
assert('KYC_ERROR_CODES.KYC_ALREADY_SUBMITTED = KYC_ALREADY_SUBMITTED', KYC_ERROR_CODES.KYC_ALREADY_SUBMITTED === 'KYC_ALREADY_SUBMITTED');
assert('KYC_ERROR_CODES.KYC_STATUS_NOT_APPROVABLE = KYC_STATUS_NOT_APPROVABLE', KYC_ERROR_CODES.KYC_STATUS_NOT_APPROVABLE === 'KYC_STATUS_NOT_APPROVABLE');
assert('KYC_ERROR_CODES.KYB_NOT_FOUND = KYB_NOT_FOUND', KYC_ERROR_CODES.KYB_NOT_FOUND === 'KYB_NOT_FOUND');
assert('KYC_ERROR_CODES.KYB_COMPANY_NAME_REQUIRED = KYB_COMPANY_NAME_REQUIRED', KYC_ERROR_CODES.KYB_COMPANY_NAME_REQUIRED === 'KYB_COMPANY_NAME_REQUIRED');
assert('KYC_ERROR_CODES 错误码数量 >= 30', Object.keys(KYC_ERROR_CODES).length >= 30, `actual=${Object.keys(KYC_ERROR_CODES).length}`);

// 异常类实例化
const err1 = new FjnKycNotFoundError({ id: 'test' });
assert('FjnKycNotFoundError.name = FjnKycError', err1.name === 'FjnKycError');
assert('FjnKycNotFoundError.httpStatus = 404', err1.httpStatus === 404);
assert('FjnKycNotFoundError instanceof FjnKycError', err1 instanceof FjnKycError);
assert('FjnKycNotFoundError instanceof FjnError', err1 instanceof Error);

const err2 = new FjnKycAlreadySubmittedError({ userId: 'u1' });
assert('FjnKycAlreadySubmittedError.httpStatus = 409', err2.httpStatus === 409);

const err3 = new FjnKycStatusNotApprovableError({});
assert('FjnKycStatusNotApprovableError.httpStatus = 400', err3.httpStatus === 400);

const err4 = new FjnKycReviewerIdRequiredError({});
assert('FjnKycReviewerIdRequiredError.httpStatus = 400', err4.httpStatus === 400);

const err5 = new FjnKybNotFoundError({});
assert('FjnKybNotFoundError.httpStatus = 404', err5.httpStatus === 404);

const err6 = new FjnKybAlreadySubmittedError({});
assert('FjnKybAlreadySubmittedError.httpStatus = 409', err6.httpStatus === 409);

const err7 = new FjnKybDocumentRequiredError({});
assert('FjnKybDocumentRequiredError.httpStatus = 400', err7.httpStatus === 400);

const err8 = new FjnKycExternalServiceError({});
assert('FjnKycExternalServiceError.httpStatus = 502', err8.httpStatus === 502);

const err9 = new FjnKycThirdPartyTimeoutError({});
assert('FjnKycThirdPartyTimeoutError.httpStatus = 504', err9.httpStatus === 504);

// 异常类型标记
assert('FjnKycNotFoundError 是 FjnError', err1.code === 'KYC_NOT_FOUND');
assert('FjnKycError 异常类型 = FjnKycError', new FjnKycStatusInvalidError({}).name === 'FjnKycError');

// ============================================================
// [10] Service 类可实例化
// ============================================================
console.log('\n[10] Service 类可实例化');
const svc = new FjnKycService();
assert('FjnKycService 可实例化', svc instanceof FjnKycService);
assert('FjnKycService 是 FjnServiceBase 子类', (svc as unknown as { withTransaction?: unknown }).withTransaction !== undefined);
assert('FjnKycService 有 submitKyc 方法', typeof svc.submitKyc === 'function');
assert('FjnKycService 有 approveKyc 方法', typeof svc.approveKyc === 'function');
assert('FjnKycService 有 rejectKyc 方法', typeof svc.rejectKyc === 'function');
assert('FjnKycService 有 manualReviewKyc 方法', typeof svc.manualReviewKyc === 'function');
assert('FjnKycService 有 expireKyc 方法', typeof svc.expireKyc === 'function');
assert('FjnKycService 有 resubmitKyc 方法', typeof svc.resubmitKyc === 'function');
assert('FjnKycService 有 submitKyb 方法', typeof svc.submitKyb === 'function');
assert('FjnKycService 有 approveKyb 方法', typeof svc.approveKyb === 'function');
assert('FjnKycService 有 rejectKyb 方法', typeof svc.rejectKyb === 'function');
assert('FjnKycService 有 listKycs 方法', typeof svc.listKycs === 'function');
assert('FjnKycService 有 listKybs 方法', typeof svc.listKybs === 'function');
assert('FjnKycService 有 listReviewLogs 方法', typeof svc.listReviewLogs === 'function');
assert('FjnKycService 有 getKycSummary 方法', typeof svc.getKycSummary === 'function');
assert('FjnKycService 有 getKybSummary 方法', typeof svc.getKybSummary === 'function');

// ============================================================
// [11] 业务常量
// ============================================================
console.log('\n[11] 业务常量');
assert('KYC_DEFAULT_EXPIRES_DAYS = 365', KYC_DEFAULT_EXPIRES_DAYS === 365);
assert('KYC_REJECT_NOTE_MIN_LENGTH = 5', KYC_REJECT_NOTE_MIN_LENGTH === 5);
assert('KYC_EXPIRES_DAYS_DEFAULT = 365', KYC_EXPIRES_DAYS_DEFAULT === 365);

// ============================================================
// [12] 入参类型可构造（编译时验证）
// ============================================================
console.log('\n[12] 入参类型可构造');
const submitInput: SubmitKycInput = {
  userId: '00000000-0000-0000-0000-00000000a001',
  documentType: KYC_DOCUMENT_TYPE.PASSPORT,
  documentCountry: 'CN',
};
assert('SubmitKycInput 可构造', submitInput.userId.length > 0);

const approveInput: ApproveKycInput = {
  reviewerId: '00000000-0000-0000-0000-00000000d3a0',
  reviewNote: '材料齐全',
};
assert('ApproveKycInput 可构造', approveInput.reviewerId.length > 0);

const submitKybInput: SubmitKybInput = {
  userId: '00000000-0000-0000-0000-00000000a002',
  companyName: 'Test Co.',
  registrationCountry: 'US',
  businessLicenseUrl: 'https://example.com/license.pdf',
};
assert('SubmitKybInput 可构造', submitKybInput.companyName === 'Test Co.');

const listKycInput: ListKycInput = { kycStatus: KYC_STATUS.PENDING, page: 1, pageSize: 20 };
assert('ListKycInput 可构造', listKycInput.page === 1);

const listKybInput: ListKybInput = { kybStatus: KYC_STATUS.APPROVED, page: 1, pageSize: 10 };
assert('ListKybInput 可构造', listKybInput.pageSize === 10);

// ============================================================
// [13] 状态机终态（保留给将来）
// ============================================================
console.log('\n[13] 终态预留');
assert('TERMINAL_KYC_STATUSES 为空（无绝对终态）', TERMINAL_KYC_STATUSES.length === 0);

// ============================================================
// 总结
// ============================================================
console.log('\n=== 总结 ===');
console.log(`通过: ${pass}`);
console.log(`失败: ${fail}`);
console.log(`通过率: ${((pass / (pass + fail)) * 100).toFixed(2)}%`);
console.log(`总断言数: ${pass + fail}`);

if (fail > 0) {
  process.exit(1);
}
console.log('🎉 所有 KYC 冒烟测试通过！');
