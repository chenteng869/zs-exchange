/**
 * Audit Service - 错误码 + 异常类
 *
 * 工业级 Solana-first 架构
 */

import { FjnError, FjnErrorContext } from '../errors';

export const AUDIT_ERROR_CODES = {
  LOG_NOT_FOUND: 'AUDIT_LOG_NOT_FOUND',
  MODULE_INVALID: 'AUDIT_MODULE_INVALID',
  ACTION_INVALID: 'AUDIT_ACTION_INVALID',
  OPERATOR_ID_REQUIRED: 'AUDIT_OPERATOR_ID_REQUIRED',
  TARGET_TYPE_REQUIRED: 'AUDIT_TARGET_TYPE_REQUIRED',
  TARGET_ID_REQUIRED: 'AUDIT_TARGET_ID_REQUIRED',
  BEFORE_VALUE_REQUIRED: 'AUDIT_BEFORE_VALUE_REQUIRED',
  AFTER_VALUE_REQUIRED: 'AUDIT_AFTER_VALUE_REQUIRED',
  BOTH_VALUES_REQUIRED: 'AUDIT_BOTH_VALUES_REQUIRED',
  APPROVAL_NO_REQUIRED: 'AUDIT_APPROVAL_NO_REQUIRED',
  APPROVAL_NOT_FOUND: 'AUDIT_APPROVAL_NOT_FOUND',
  APPROVAL_NOT_APPROVED: 'AUDIT_APPROVAL_NOT_APPROVED',
  APPROVAL_EXPIRED: 'AUDIT_APPROVAL_EXPIRED',
  INTEGRITY_BROKEN: 'AUDIT_INTEGRITY_BROKEN',
  INTEGRITY_VERIFY_FAILED: 'AUDIT_INTEGRITY_VERIFY_FAILED',
  EXPORT_FORMAT_INVALID: 'AUDIT_EXPORT_FORMAT_INVALID',
  EXPORT_RANGE_INVALID: 'AUDIT_EXPORT_RANGE_INVALID',
  EXPORT_NOT_FOUND: 'AUDIT_EXPORT_NOT_FOUND',
  EXPORT_IN_PROGRESS: 'AUDIT_EXPORT_IN_PROGRESS',
  EXPORT_FAILED: 'AUDIT_EXPORT_FAILED',
  ARCHIVE_FAILED: 'AUDIT_ARCHIVE_FAILED',
  ARCHIVE_NOT_FOUND: 'AUDIT_ARCHIVE_NOT_FOUND',
  HASH_ALGO_INVALID: 'AUDIT_HASH_ALGO_INVALID',
  IMMUTABLE_OPERATION: 'AUDIT_IMMUTABLE_OPERATION',
  CHANGE_SUMMARY_REQUIRED: 'AUDIT_CHANGE_SUMMARY_REQUIRED',
  LOG_RECORD_FAILED: 'AUDIT_LOG_RECORD_FAILED',
  QUERY_RANGE_INVALID: 'AUDIT_QUERY_RANGE_INVALID',
  RISK_LEVEL_INVALID: 'AUDIT_RISK_LEVEL_INVALID',
  EXPORT_TOO_LARGE: 'AUDIT_EXPORT_TOO_LARGE',
} as const;

export type FjnAuditErrorCode =
  (typeof AUDIT_ERROR_CODES)[keyof typeof AUDIT_ERROR_CODES];

export class FjnAuditError extends FjnError {
  constructor(
    code: FjnAuditErrorCode,
    message: string,
    context?: FjnErrorContext,
    httpStatus?: number,
  ) {
    super({ code: code as any, message, context, httpStatus });
    this.name = 'FjnAuditError';
  }
}

export class AuditLogNotFoundError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(AUDIT_ERROR_CODES.LOG_NOT_FOUND, 'Audit log not found', context, 404);
  }
}
export class AuditModuleInvalidError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(AUDIT_ERROR_CODES.MODULE_INVALID, 'Audit module is invalid', context, 400);
  }
}
export class AuditActionInvalidError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(AUDIT_ERROR_CODES.ACTION_INVALID, 'Audit action is invalid', context, 400);
  }
}
export class AuditOperatorIdRequiredError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.OPERATOR_ID_REQUIRED,
      'operatorId is required for audit log',
      context,
      400,
    );
  }
}
export class AuditTargetTypeRequiredError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.TARGET_TYPE_REQUIRED,
      'targetType is required for audit log',
      context,
      400,
    );
  }
}
export class AuditTargetIdRequiredError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(AUDIT_ERROR_CODES.TARGET_ID_REQUIRED, 'targetId is required for audit log', context, 400);
  }
}
export class AuditBeforeValueRequiredError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.BEFORE_VALUE_REQUIRED,
      'beforeValue is required for update/delete actions',
      context,
      400,
    );
  }
}
export class AuditAfterValueRequiredError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.AFTER_VALUE_REQUIRED,
      'afterValue is required for create/update actions',
      context,
      400,
    );
  }
}
export class AuditBothValuesRequiredError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.BOTH_VALUES_REQUIRED,
      'beforeValue and afterValue are both required for update',
      context,
      400,
    );
  }
}
export class AuditApprovalNoRequiredError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.APPROVAL_NO_REQUIRED,
      'approvalNo is required for high-risk operations',
      context,
      400,
    );
  }
}
export class AuditApprovalNotFoundError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.APPROVAL_NOT_FOUND,
      'Referenced approval request not found',
      context,
      404,
    );
  }
}
export class AuditApprovalNotApprovedError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_REQUIRED_NOT_APPROVED(),
      'Referenced approval is not in approved status',
      context,
      409,
    );
  }
}
function APPROVAL_REQUIRED_NOT_APPROVED() {
  return AUDIT_ERROR_CODES.APPROVAL_NOT_APPROVED;
}
export class AuditApprovalExpiredError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(AUDIT_ERROR_CODES.APPROVAL_EXPIRED, 'Referenced approval is expired', context, 410);
  }
}
export class AuditIntegrityBrokenError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.INTEGRITY_BROKEN,
      'Audit log integrity chain is broken',
      context,
      500,
    );
  }
}
export class AuditIntegrityVerifyFailedError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.INTEGRITY_VERIFY_FAILED,
      'Audit log integrity verification failed',
      context,
      500,
    );
  }
}
export class AuditExportFormatInvalidError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.EXPORT_FORMAT_INVALID,
      'Audit export format is invalid',
      context,
      400,
    );
  }
}
export class AuditExportRangeInvalidError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.EXPORT_RANGE_INVALID,
      'Audit export time range is invalid',
      context,
      400,
    );
  }
}
export class AuditExportNotFoundError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(AUDIT_ERROR_CODES.EXPORT_NOT_FOUND, 'Audit export not found', context, 404);
  }
}
export class AuditExportInProgressError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.EXPORT_IN_PROGRESS,
      'Audit export is in progress',
      context,
      409,
    );
  }
}
export class AuditExportFailedError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(AUDIT_ERROR_CODES.EXPORT_FAILED, 'Audit export failed', context, 500);
  }
}
export class AuditExportTooLargeError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.EXPORT_TOO_LARGE,
      'Audit export range is too large (exceeds 1M records)',
      context,
      422,
    );
  }
}
export class AuditArchiveFailedError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(AUDIT_ERROR_CODES.ARCHIVE_FAILED, 'Audit archive failed', context, 500);
  }
}
export class AuditArchiveNotFoundError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(AUDIT_ERROR_CODES.ARCHIVE_NOT_FOUND, 'Audit archive not found', context, 404);
  }
}
export class AuditHashAlgoInvalidError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.HASH_ALGO_INVALID,
      'Hash algorithm is invalid',
      context,
      400,
    );
  }
}
export class AuditImmutableOperationError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.IMMUTABLE_OPERATION,
      'Audit log is append-only; update/delete is not allowed',
      context,
      403,
    );
  }
}
export class AuditChangeSummaryRequiredError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.CHANGE_SUMMARY_REQUIRED,
      'changeSummary is required for high-risk operations',
      context,
      400,
    );
  }
}
export class AuditLogRecordFailedError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(AUDIT_ERROR_CODES.LOG_RECORD_FAILED, 'Failed to record audit log', context, 500);
  }
}
export class AuditQueryRangeInvalidError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(
      AUDIT_ERROR_CODES.QUERY_RANGE_INVALID,
      'Query range is invalid (start must be before end)',
      context,
      400,
    );
  }
}
export class AuditRiskLevelInvalidError extends FjnAuditError {
  constructor(context?: FjnErrorContext) {
    super(AUDIT_ERROR_CODES.RISK_LEVEL_INVALID, 'Audit risk level is invalid', context, 400);
  }
}
