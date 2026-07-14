/**
 * FJN KYC Service - 错误码 + 异常类
 *
 * 严格遵循 H018 §4 + 工业级分层：
 *  - 错误码使用 SCREAMING_SNAKE_CASE
 *  - 错误码映射到对应异常类与 HTTP 状态码
 *
 * 用法：
 *   import { FjnKycNotFoundError, KYC_ERROR_CODES } from './kyc-errors';
 *   throw new FjnKycNotFoundError({ kycId });
 */

import { FjnError, FjnErrorContext } from '../errors';

// ============================================================
// 1. 错误码常量
// ============================================================

export const KYC_ERROR_CODES = {
  // ---------- KYC 通用 ----------
  KYC_NOT_FOUND: 'KYC_NOT_FOUND',
  KYC_ALREADY_SUBMITTED: 'KYC_ALREADY_SUBMITTED',
  KYC_ALREADY_APPROVED: 'KYC_ALREADY_APPROVED',
  KYC_ALREADY_REJECTED: 'KYC_ALREADY_REJECTED',
  KYC_STATUS_INVALID: 'KYC_STATUS_INVALID',
  KYC_STATUS_NOT_REVIEWABLE: 'KYC_STATUS_NOT_REVIEWABLE',
  KYC_STATUS_NOT_APPROVABLE: 'KYC_STATUS_NOT_APPROVABLE',
  KYC_STATUS_NOT_REJECTABLE: 'KYC_STATUS_NOT_REJECTABLE',
  KYC_STATUS_NOT_MANUAL_REVIEWABLE: 'KYC_STATUS_NOT_MANUAL_REVIEWABLE',
  KYC_STATUS_NOT_EXPIRED: 'KYC_STATUS_NOT_EXPIRED',
  KYC_STATUS_NOT_RESUBMITTABLE: 'KYC_STATUS_NOT_RESUBMITTABLE',
  KYC_DOCUMENT_REQUIRED: 'KYC_DOCUMENT_REQUIRED',
  KYC_DOCUMENT_TYPE_INVALID: 'KYC_DOCUMENT_TYPE_INVALID',
  KYC_DOCUMENT_COUNTRY_INVALID: 'KYC_DOCUMENT_COUNTRY_INVALID',
  KYC_LEVEL_INVALID: 'KYC_LEVEL_INVALID',
  KYC_PROVIDER_INVALID: 'KYC_PROVIDER_INVALID',
  KYC_RISK_STATUS_INVALID: 'KYC_RISK_STATUS_INVALID',
  KYC_USER_ID_REQUIRED: 'KYC_USER_ID_REQUIRED',
  KYC_REVIEWER_ID_REQUIRED: 'KYC_REVIEWER_ID_REQUIRED',
  KYC_REVIEW_NOTE_REQUIRED: 'KYC_REVIEW_NOTE_REQUIRED',
  KYC_REVIEW_NOTE_TOO_SHORT: 'KYC_REVIEW_NOTE_TOO_SHORT',

  // ---------- KYB 通用 ----------
  KYB_NOT_FOUND: 'KYB_NOT_FOUND',
  KYB_ALREADY_SUBMITTED: 'KYB_ALREADY_SUBMITTED',
  KYB_ALREADY_APPROVED: 'KYB_ALREADY_APPROVED',
  KYB_STATUS_INVALID: 'KYB_STATUS_INVALID',
  KYB_STATUS_NOT_REVIEWABLE: 'KYB_STATUS_NOT_REVIEWABLE',
  KYB_DOCUMENT_REQUIRED: 'KYB_DOCUMENT_REQUIRED',
  KYB_COMPANY_NAME_REQUIRED: 'KYB_COMPANY_NAME_REQUIRED',
  KYB_REGISTRATION_COUNTRY_INVALID: 'KYB_REGISTRATION_COUNTRY_INVALID',

  // ---------- 审核日志 ----------
  REVIEW_LOG_NOT_FOUND: 'KYC_REVIEW_LOG_NOT_FOUND',
  REVIEW_LOG_INVALID: 'KYC_REVIEW_LOG_INVALID',

  // ---------- 系统类 ----------
  INTERNAL: 'KYC_INTERNAL',
  EXTERNAL_SERVICE_ERROR: 'KYC_EXTERNAL_SERVICE_ERROR',
  THIRD_PARTY_TIMEOUT: 'KYC_THIRD_PARTY_TIMEOUT',
} as const;

export type FjnKycErrorCode =
  (typeof KYC_ERROR_CODES)[keyof typeof KYC_ERROR_CODES];

// ============================================================
// 2. 异常类
// ============================================================

/** KYC 异常基类 */
export class FjnKycError extends FjnError {
  constructor(
    code: FjnKycErrorCode,
    message: string,
    context?: FjnErrorContext,
    httpStatus?: number,
  ) {
    super({
      code: code as any,
      message,
      context,
      httpStatus,
    });
    this.name = 'FjnKycError';
  }
}

// ---------- KYC 异常 ----------

export class FjnKycNotFoundError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(KYC_ERROR_CODES.KYC_NOT_FOUND, 'KYC 记录不存在', context, 404);
  }
}

export class FjnKycAlreadySubmittedError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYC_ALREADY_SUBMITTED,
      'KYC 已有进行中的申请（pending / manual_review / approved）',
      context,
      409,
    );
  }
}

export class FjnKycAlreadyApprovedError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYC_ALREADY_APPROVED,
      'KYC 已通过，不可重复审核',
      context,
      409,
    );
  }
}

export class FjnKycAlreadyRejectedError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYC_ALREADY_REJECTED,
      'KYC 已拒绝',
      context,
      409,
    );
  }
}

export class FjnKycStatusInvalidError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYC_STATUS_INVALID,
      'KYC 状态非法',
      context,
      400,
    );
  }
}

export class FjnKycStatusNotApprovableError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYC_STATUS_NOT_APPROVABLE,
      '当前 KYC 状态不可通过（需 pending 或 manual_review）',
      context,
      400,
    );
  }
}

export class FjnKycStatusNotRejectableError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYC_STATUS_NOT_REJECTABLE,
      '当前 KYC 状态不可拒绝（需 pending 或 manual_review）',
      context,
      400,
    );
  }
}

export class FjnKycStatusNotManualReviewableError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYC_STATUS_NOT_MANUAL_REVIEWABLE,
      '当前 KYC 状态不可转人工复核（仅 pending）',
      context,
      400,
    );
  }
}

export class FjnKycStatusNotResubmittableError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYC_STATUS_NOT_RESUBMITTABLE,
      '当前 KYC 状态不可重新提交（需 rejected 或 expired）',
      context,
      400,
    );
  }
}

export class FjnKycDocumentRequiredError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYC_DOCUMENT_REQUIRED,
      '必须提交证件（document_front_url 或 document_number_hash）',
      context,
      400,
    );
  }
}

export class FjnKycDocumentTypeInvalidError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYC_DOCUMENT_TYPE_INVALID,
      '证件类型非法（仅 passport / id_card / driver_license / residence_permit）',
      context,
      400,
    );
  }
}

export class FjnKycDocumentCountryInvalidError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYC_DOCUMENT_COUNTRY_INVALID,
      '证件国家代码非法（需 ISO 3166-1 alpha-2）',
      context,
      400,
    );
  }
}

export class FjnKycLevelInvalidError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYC_LEVEL_INVALID,
      'KYC 等级非法（仅 standard / enhanced / institutional）',
      context,
      400,
    );
  }
}

export class FjnKycProviderInvalidError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYC_PROVIDER_INVALID,
      'KYC 提供方非法',
      context,
      400,
    );
  }
}

export class FjnKycReviewerIdRequiredError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYC_REVIEWER_ID_REQUIRED,
      '审核人 ID 必填',
      context,
      400,
    );
  }
}

export class FjnKycReviewNoteRequiredError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYC_REVIEW_NOTE_REQUIRED,
      '拒绝时审核意见必填',
      context,
      400,
    );
  }
}

// ---------- KYB 异常 ----------

export class FjnKybNotFoundError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(KYC_ERROR_CODES.KYB_NOT_FOUND, 'KYB 记录不存在', context, 404);
  }
}

export class FjnKybAlreadySubmittedError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYB_ALREADY_SUBMITTED,
      'KYB 已有进行中的申请',
      context,
      409,
    );
  }
}

export class FjnKybStatusInvalidError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(KYC_ERROR_CODES.KYB_STATUS_INVALID, 'KYB 状态非法', context, 400);
  }
}

export class FjnKybDocumentRequiredError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYB_DOCUMENT_REQUIRED,
      '必须提交营业执照或注册号',
      context,
      400,
    );
  }
}

export class FjnKybCompanyNameRequiredError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYB_COMPANY_NAME_REQUIRED,
      '公司名称必填',
      context,
      400,
    );
  }
}

export class FjnKybRegistrationCountryInvalidError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.KYB_REGISTRATION_COUNTRY_INVALID,
      '注册国家代码非法（需 ISO 3166-1 alpha-2）',
      context,
      400,
    );
  }
}

// ---------- 系统异常 ----------

export class FjnKycExternalServiceError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      'KYC 第三方服务异常',
      context,
      502,
    );
  }
}

export class FjnKycThirdPartyTimeoutError extends FjnKycError {
  constructor(context?: FjnErrorContext) {
    super(
      KYC_ERROR_CODES.THIRD_PARTY_TIMEOUT,
      'KYC 第三方服务超时',
      context,
      504,
    );
  }
}
