/**
 * Reporting Service - 事件定义
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.10
 *
 * 全部事件通过 outbox 模式写入 `outboxEvent` 表，由 worker 异步消费
 * 事件命名空间：`fjn.reporting.*`
 */

export const REPORTING_EVENTS = {
  // 报表生命周期
  REQUESTED: 'fjn.reporting.requested',
  GENERATION_STARTED: 'fjn.reporting.generation_started',
  GENERATION_PROGRESS: 'fjn.reporting.generation_progress',
  GENERATION_FAILED: 'fjn.reporting.generation_failed',
  READY: 'fjn.reporting.ready',
  EXPIRED: 'fjn.reporting.expired',
  // 导出
  EXPORT_REQUESTED: 'fjn.reporting.export_requested',
  EXPORT_READY: 'fjn.reporting.export_ready',
  EXPORT_FAILED: 'fjn.reporting.export_failed',
  // 关键指标
  KEY_METRICS_UPDATED: 'fjn.reporting.key_metrics_updated',
  ANOMALY_DETECTED: 'fjn.reporting.anomaly_detected',
  // 对账
  CHAIN_RECONCILIATION_DONE: 'fjn.reporting.chain_reconciliation_done',
  CHAIN_RECONCILIATION_MISMATCH: 'fjn.reporting.chain_reconciliation_mismatch',
  // 删除
  ARCHIVED: 'fjn.reporting.archived',
} as const;
export type FjnReportingEvent =
  (typeof REPORTING_EVENTS)[keyof typeof REPORTING_EVENTS];

export const REPORTING_EVENT_SOURCES = {
  REPORTING_SERVICE: 'fjn.reporting.service',
  REPORTING_WORKER: 'fjn.reporting.worker',
  REPORTING_SCHEDULER: 'fjn.reporting.scheduler',
  REPORTING_API: 'fjn.reporting.api',
} as const;
export type FjnReportingEventSource =
  (typeof REPORTING_EVENT_SOURCES)[keyof typeof REPORTING_EVENT_SOURCES];

export const ALL_REPORTING_EVENTS: FjnReportingEvent[] = Object.values(REPORTING_EVENTS);
export const REPORTING_EVENT_COUNT = ALL_REPORTING_EVENTS.length;

export const isValidReportingEvent = (e: string): e is FjnReportingEvent =>
  Object.values(REPORTING_EVENTS).includes(e as any);

export const isValidReportingEventSource = (s: string): s is FjnReportingEventSource =>
  Object.values(REPORTING_EVENT_SOURCES).includes(s as any);

/** Payload 类型 */
export interface ReportRequestedPayload {
  reportId: string;
  reportNo: string;
  reportType: string;
  period: string;
  granularity: string;
  trigger: string;
  requestedBy: string;
}

export interface ReportGenerationStartedPayload {
  reportId: string;
  reportNo: string;
  reportType: string;
  period: string;
  startedAt: string;
}

export interface ReportGenerationProgressPayload {
  reportId: string;
  reportNo: string;
  reportType: string;
  progress: number; // 0-100
  stage: string;
}

export interface ReportGenerationFailedPayload {
  reportId: string;
  reportNo: string;
  reportType: string;
  period: string;
  error: string;
  failedAt: string;
}

export interface ReportReadyPayload {
  reportId: string;
  reportNo: string;
  reportType: string;
  period: string;
  granularity: string;
  generatedBy: string | null;
  recordCount: number;
  fileSizeBytes: number;
  expiresAt: string;
}

export interface ReportExpiredPayload {
  reportId: string;
  reportNo: string;
  reportType: string;
  period: string;
  expiredAt: string;
}

export interface ReportExportRequestedPayload {
  reportId: string;
  reportNo: string;
  format: string;
  requestedBy: string;
}

export interface ReportExportReadyPayload {
  reportId: string;
  reportNo: string;
  format: string;
  downloadUrl: string;
  fileSizeBytes: number;
  expiresAt: string;
}

export interface ReportExportFailedPayload {
  reportId: string;
  reportNo: string;
  format: string;
  error: string;
}

export interface ReportKeyMetricsUpdatedPayload {
  reportType: string;
  period: string;
  metrics: Record<string, number | string>;
  computedAt: string;
}

export interface ReportAnomalyDetectedPayload {
  reportType: string;
  period: string;
  metric: string;
  expected: number | string;
  actual: number | string;
  severity: string;
}

export interface ReportChainReconciliationDonePayload {
  period: string;
  matched: number;
  mismatched: number;
  totalChecked: number;
}

export interface ReportChainReconciliationMismatchPayload {
  period: string;
  recordId: string;
  chainValue: string;
  dbValue: string;
  diff: string;
  severity: string;
}

export interface ReportArchivedPayload {
  reportId: string;
  reportNo: string;
  archivedBy: string;
  reason: string;
}

export type ReportingEventPayload =
  | ReportRequestedPayload
  | ReportGenerationStartedPayload
  | ReportGenerationProgressPayload
  | ReportGenerationFailedPayload
  | ReportReadyPayload
  | ReportExpiredPayload
  | ReportExportRequestedPayload
  | ReportExportReadyPayload
  | ReportExportFailedPayload
  | ReportKeyMetricsUpdatedPayload
  | ReportAnomalyDetectedPayload
  | ReportChainReconciliationDonePayload
  | ReportChainReconciliationMismatchPayload
  | ReportArchivedPayload;
