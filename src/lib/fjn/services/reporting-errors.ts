/**
 * Reporting Service - 错误码 + 异常类
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.10
 *
 * 错误码格式：FJN_REPORTING_*
 */

import { FjnError, FjnErrorContext } from '../errors';

/** Reporting 错误码 */
export const REPORTING_ERROR_CODES = {
  REPORT_TYPE_INVALID: 'FJN_REPORTING_REPORT_TYPE_INVALID',
  REPORT_NOT_FOUND: 'FJN_REPORTING_REPORT_NOT_FOUND',
  REPORT_ALREADY_EXISTS: 'FJN_REPORTING_REPORT_ALREADY_EXISTS',
  REPORT_STATUS_INVALID: 'FJN_REPORTING_REPORT_STATUS_INVALID',
  REPORT_GENERATION_FAILED: 'FJN_REPORTING_REPORT_GENERATION_FAILED',
  REPORT_NOT_READY: 'FJN_REPORTING_REPORT_NOT_READY',
  REPORT_EXPIRED: 'FJN_REPORTING_REPORT_EXPIRED',
  REPORT_PERIOD_INVALID: 'FJN_REPORTING_REPORT_PERIOD_INVALID',
  REPORT_GRANULARITY_INVALID: 'FJN_REPORTING_REPORT_GRANULARITY_INVALID',
  REPORT_TRIGGER_INVALID: 'FJN_REPORTING_REPORT_TRIGGER_INVALID',
  REPORT_VISIBILITY_INVALID: 'FJN_REPORTING_REPORT_VISIBILITY_INVALID',
  REPORT_EXPORT_FORMAT_INVALID: 'FJN_REPORTING_REPORT_EXPORT_FORMAT_INVALID',
  REPORT_EXPORT_FAILED: 'FJN_REPORTING_REPORT_EXPORT_FAILED',
  REPORT_DATA_MISSING: 'FJN_REPORTING_REPORT_DATA_MISSING',
  REPORT_DATA_INVALID: 'FJN_REPORTING_REPORT_DATA_INVALID',
  REPORT_SUMMARY_INVALID: 'FJN_REPORTING_REPORT_SUMMARY_INVALID',
  REPORT_REQUESTED_BY_REQUIRED: 'FJN_REPORTING_REPORT_REQUESTED_BY_REQUIRED',
  REPORT_NO_REQUIRED: 'FJN_REPORTING_REPORT_NO_REQUIRED',
  REPORT_TYPE_REQUIRED: 'FJN_REPORTING_REPORT_TYPE_REQUIRED',
  REPORT_PERIOD_REQUIRED: 'FJN_REPORTING_REPORT_PERIOD_REQUIRED',
  REPORT_ANOMALY_THRESHOLD_INVALID: 'FJN_REPORTING_REPORT_ANOMALY_THRESHOLD_INVALID',
  REPORT_CHAIN_RECONCILIATION_MISMATCH: 'FJN_REPORTING_REPORT_CHAIN_RECONCILIATION_MISMATCH',
  REPORT_ARCHIVE_FAILED: 'FJN_REPORTING_REPORT_ARCHIVE_FAILED',
  REPORT_NOT_ARCHIVABLE: 'FJN_REPORTING_REPORT_NOT_ARCHIVABLE',
  REPORT_VISIBILITY_DENIED: 'FJN_REPORTING_REPORT_VISIBILITY_DENIED',
  REPORT_DATA_SOURCE_UNAVAILABLE: 'FJN_REPORTING_REPORT_DATA_SOURCE_UNAVAILABLE',
} as const;
export type FjnReportingErrorCode =
  (typeof REPORTING_ERROR_CODES)[keyof typeof REPORTING_ERROR_CODES];

export const isFjnReportingErrorCode = (c: string): c is FjnReportingErrorCode =>
  Object.values(REPORTING_ERROR_CODES).includes(c as any);

export const getReportingErrorCodeCount = (): number =>
  Object.keys(REPORTING_ERROR_CODES).length;

/** Reporting 业务异常基类 */
export class FjnReportingError extends FjnError {
  constructor(params: {
    code: FjnReportingErrorCode;
    message: string;
    context?: FjnErrorContext;
    cause?: unknown;
  }) {
    super({
      code: params.code as unknown as FjnError['code'],
      message: params.message,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'FjnReportingError';
  }
}

// ============ 报表类型/期间/触发 ============
export class ReportTypeInvalidError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_TYPE_INVALID,
      message: 'Invalid report type',
      context: ctx,
    });
    this.name = 'ReportTypeInvalidError';
  }
}
export class ReportTypeRequiredError extends FjnReportingError {
  constructor() {
    super({
      code: REPORTING_ERROR_CODES.REPORT_TYPE_REQUIRED,
      message: 'Report type is required',
    });
    this.name = 'ReportTypeRequiredError';
  }
}
export class ReportPeriodInvalidError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_PERIOD_INVALID,
      message: 'Invalid report period format',
      context: ctx,
    });
    this.name = 'ReportPeriodInvalidError';
  }
}
export class ReportPeriodRequiredError extends FjnReportingError {
  constructor() {
    super({
      code: REPORTING_ERROR_CODES.REPORT_PERIOD_REQUIRED,
      message: 'Report period is required',
    });
    this.name = 'ReportPeriodRequiredError';
  }
}
export class ReportGranularityInvalidError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_GRANULARITY_INVALID,
      message: 'Invalid report granularity',
      context: ctx,
    });
    this.name = 'ReportGranularityInvalidError';
  }
}
export class ReportTriggerInvalidError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_TRIGGER_INVALID,
      message: 'Invalid report trigger',
      context: ctx,
    });
    this.name = 'ReportTriggerInvalidError';
  }
}
export class ReportVisibilityInvalidError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_VISIBILITY_INVALID,
      message: 'Invalid report visibility',
      context: ctx,
    });
    this.name = 'ReportVisibilityInvalidError';
  }
}
export class ReportExportFormatInvalidError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_EXPORT_FORMAT_INVALID,
      message: 'Invalid report export format',
      context: ctx,
    });
    this.name = 'ReportExportFormatInvalidError';
  }
}

// ============ 报表对象 ============
export class ReportNotFoundError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_NOT_FOUND,
      message: 'Report not found',
      context: ctx,
    });
    this.name = 'ReportNotFoundError';
  }
}
export class ReportAlreadyExistsError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_ALREADY_EXISTS,
      message: 'Report with same no/type/period already exists',
      context: ctx,
    });
    this.name = 'ReportAlreadyExistsError';
  }
}
export class ReportNoRequiredError extends FjnReportingError {
  constructor() {
    super({
      code: REPORTING_ERROR_CODES.REPORT_NO_REQUIRED,
      message: 'Report no is required',
    });
    this.name = 'ReportNoRequiredError';
  }
}
export class ReportStatusInvalidError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_STATUS_INVALID,
      message: 'Invalid report status transition',
      context: ctx,
    });
    this.name = 'ReportStatusInvalidError';
  }
}
export class ReportNotReadyError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_NOT_READY,
      message: 'Report is not ready for export',
      context: ctx,
    });
    this.name = 'ReportNotReadyError';
  }
}
export class ReportExpiredError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_EXPIRED,
      message: 'Report has expired',
      context: ctx,
    });
    this.name = 'ReportExpiredError';
  }
}
export class ReportNotArchivableError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_NOT_ARCHIVABLE,
      message: 'Report cannot be archived in current status',
      context: ctx,
    });
    this.name = 'ReportNotArchivableError';
  }
}
export class ReportArchiveFailedError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_ARCHIVE_FAILED,
      message: 'Failed to archive report',
      context: ctx,
    });
    this.name = 'ReportArchiveFailedError';
  }
}
export class ReportVisibilityDeniedError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_VISIBILITY_DENIED,
      message: 'User is not allowed to access this report visibility',
      context: ctx,
    });
    this.name = 'ReportVisibilityDeniedError';
  }
}

// ============ 生成/导出失败 ============
export class ReportGenerationFailedError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_GENERATION_FAILED,
      message: 'Report generation failed',
      context: ctx,
    });
    this.name = 'ReportGenerationFailedError';
  }
}
export class ReportExportFailedError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_EXPORT_FAILED,
      message: 'Report export failed',
      context: ctx,
    });
    this.name = 'ReportExportFailedError';
  }
}
export class ReportDataSourceUnavailableError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_DATA_SOURCE_UNAVAILABLE,
      message: 'Report data source unavailable',
      context: ctx,
    });
    this.name = 'ReportDataSourceUnavailableError';
  }
}

// ============ 数据校验 ============
export class ReportDataMissingError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_DATA_MISSING,
      message: 'Report data is missing',
      context: ctx,
    });
    this.name = 'ReportDataMissingError';
  }
}
export class ReportDataInvalidError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_DATA_INVALID,
      message: 'Report data is invalid',
      context: ctx,
    });
    this.name = 'ReportDataInvalidError';
  }
}
export class ReportSummaryInvalidError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_SUMMARY_INVALID,
      message: 'Report summary is invalid',
      context: ctx,
    });
    this.name = 'ReportSummaryInvalidError';
  }
}
export class ReportRequestedByRequiredError extends FjnReportingError {
  constructor() {
    super({
      code: REPORTING_ERROR_CODES.REPORT_REQUESTED_BY_REQUIRED,
      message: 'Report requestedBy is required',
    });
    this.name = 'ReportRequestedByRequiredError';
  }
}

// ============ 风控/对账 ============
export class ReportAnomalyThresholdInvalidError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_ANOMALY_THRESHOLD_INVALID,
      message: 'Anomaly threshold must be a positive number',
      context: ctx,
    });
    this.name = 'ReportAnomalyThresholdInvalidError';
  }
}
export class ReportChainReconciliationMismatchError extends FjnReportingError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: REPORTING_ERROR_CODES.REPORT_CHAIN_RECONCILIATION_MISMATCH,
      message: 'Chain reconciliation mismatch',
      context: ctx,
    });
    this.name = 'ReportChainReconciliationMismatchError';
  }
}
