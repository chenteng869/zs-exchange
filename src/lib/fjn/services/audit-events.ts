/**
 * Audit Service - 事件定义
 *
 * 工业级 Solana-first 架构
 */

export const AUDIT_EVENTS = {
  LOG_RECORDED: 'audit.log.recorded',
  LOG_RECORD_FAILED: 'audit.log.record_failed',
  BULK_LOG_RECORDED: 'audit.log.bulk_recorded',
  EXPORT_INITIATED: 'audit.export.initiated',
  EXPORT_COMPLETED: 'audit.export.completed',
  EXPORT_FAILED: 'audit.export.failed',
  VERIFY_INITIATED: 'audit.verify.initiated',
  VERIFY_COMPLETED: 'audit.verify.completed',
  VERIFY_FAILED: 'audit.verify.failed',
  ARCHIVE_INITIATED: 'audit.archive.initiated',
  ARCHIVE_COMPLETED: 'audit.archive.completed',
  SUSPICIOUS_ACTIVITY_DETECTED: 'audit.suspicious.activity_detected',
  INTEGRITY_BROKEN: 'audit.integrity.broken',
} as const;

export const AUDIT_EVENT_SOURCES = {
  AUDIT_SERVICE: 'audit_service',
  SYSTEM: 'system',
  ADMIN: 'admin',
  COMPLIANCE: 'compliance',
  EXPORT_WORKER: 'export_worker',
  VERIFY_WORKER: 'verify_worker',
} as const;

export type FjnAuditEvent = (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS];

export type FjnAuditEventSource =
  (typeof AUDIT_EVENT_SOURCES)[keyof typeof AUDIT_EVENT_SOURCES];

export interface AuditLogRecordedPayload {
  logId: string;
  logNo: string;
  module: string;
  action: string;
  targetType: string;
  targetId: string;
  targetNo: string;
  operatorId: string;
  riskLevel: string;
  hasApproval: boolean;
  approvalNo?: string;
}

export interface AuditExportCompletedPayload {
  exportId: string;
  format: string;
  recordCount: number;
  fileUrl?: string;
  startedAt: string;
  completedAt: string;
}

export interface AuditVerifyCompletedPayload {
  totalChecked: number;
  validCount: number;
  invalidCount: number;
  result: string;
  brokenLogNo?: string;
  startedAt: string;
  completedAt: string;
}

export interface AuditSuspiciousActivityPayload {
  type: 'unauthorized_access' | 'rapid_changes' | 'unusual_pattern' | 'integrity_break';
  operatorId?: string;
  targetType?: string;
  targetId?: string;
  details: Record<string, unknown>;
}

export type FjnAuditEventPayload =
  | AuditLogRecordedPayload
  | AuditExportCompletedPayload
  | AuditVerifyCompletedPayload
  | AuditSuspiciousActivityPayload
  | Record<string, unknown>;
