/**
 * Web3 钱包审计与合规系统 - 统一导出入口
 *
 * 本模块提供完整的 Web3 钱包全链路审计与合规报表功能，包括：
 *  - 全链路审计：操作/交易/签名全链路追踪
 *  - 证据链：不可篡改的审计证据链
 *  - 合规报表：监管合规报表生成
 *  - 数据留存：审计数据生命周期管理
 *  - 审计查询：多维度审计查询和分析
 */

import {
  AuditService,
} from './audit.service';
import {
  AuditLogger,
} from './audit-logger/audit-logger';
import {
  AuditMiddleware,
} from './audit-logger/audit-middleware';
import {
  EvidenceChain,
} from './evidence-chain/evidence-chain';
import {
  HashingService,
} from './evidence-chain/hashing.service';
import {
  MerkleTree,
} from './evidence-chain/merkle-tree';
import {
  ComplianceReportService,
} from './compliance/compliance-report.service';
import { DailySummaryReport } from './compliance/report-templates/daily-summary.report';
import { TransactionReport } from './compliance/report-templates/transaction-report';
import { UserActivityReport } from './compliance/report-templates/user-activity.report';
import { RiskAlertReport } from './compliance/report-templates/risk-alert.report';
import { RegulatoryReport } from './compliance/report-templates/regulatory-report';
import {
  RetentionManager,
} from './retention-manager';
import {
  AuditQueryService,
} from './audit-query.service';

// ============================================================================
// 类型定义导出
// ============================================================================

export {
  AuditAction,
  AuditCategory,
  AuditStatus,
  AuditSeverity,
  AuditEvidenceType,
  DataSensitivity,
  RetentionClass,
  RetentionAction,
  ReportType,
  ReportFormat,
  ReportStatus,
  ReportSchedule,
  HashAlgorithm,
  AuditError,
} from './audit.types';

export type {
  AuditActor,
  AuditTarget,
  AuditLogEntry,
  AuditLogMetadata,
  AuditEvidence,
  EvidenceChainBlock,
  AuditQueryFilter,
  AuditStatistics,
  ComplianceReport,
  ReportSection,
  ReportStatistics,
  RetentionPolicy,
  ReportColumn,
  ReportChartData,
  ReportApproval,
  AuditSystemConfig as AuditConfig,
  EvidenceChainBlock as EvidenceBlock,
  MerkleProof,
} from './audit.types';

// ============================================================================
// 审计日志模块导出
// ============================================================================

export { AuditLogger } from './audit-logger/audit-logger';
export type { AuditLoggerConfig, LogEntryOptions } from './audit-logger/audit-logger';

export { AuditMiddleware } from './audit-logger/audit-middleware';
export type {
  AuditMiddlewareConfig,
  AuditRequestContext as AuditContext,
  TransactionAuditMiddleware,
  SignatureAuditMiddleware,
  PermissionAuditMiddleware,
} from './audit-logger/audit-middleware';

// ============================================================================
// 证据链模块导出
// ============================================================================

export { EvidenceChain } from './evidence-chain/evidence-chain';
export type {
  ChainVerificationResult,
  ChainVerificationResult as VerificationResult,
  AnchorResult,
} from './evidence-chain/evidence-chain';

export { HashingService } from './evidence-chain/hashing.service';
export type {
  HashResult,
  HashVerificationResult,
  HashingServiceConfig,
} from './evidence-chain/hashing.service';

export { MerkleTree } from './evidence-chain/merkle-tree';
export type {
  MerkleTreeConfig,
} from './evidence-chain/merkle-tree';

// ============================================================================
// 合规报表模块导出
// ============================================================================

export { ComplianceReportService } from './compliance/compliance-report.service';
export type {
  ComplianceReportServiceConfig,
  ReportGenerationTask,
  ReportScheduleConfig,
  ReportExportResult,
  ReportStatistics as ComplianceReportStatistics,
} from './compliance/compliance-report.service';

// 报表模板导出
export { DailySummaryReport } from './compliance/report-templates/daily-summary.report';
export type { DailySummaryReportConfig, DailySummaryData as DailyStatistics } from './compliance/report-templates/daily-summary.report';

export { TransactionReport } from './compliance/report-templates/transaction-report';
export type {
  TransactionReportConfig,
  TransactionStatistics,
  TransactionDetail,
} from './compliance/report-templates/transaction-report';

export { UserActivityReport } from './compliance/report-templates/user-activity.report';
export type {
  UserActivityReportConfig,
  UserActivityData,
} from './compliance/report-templates/user-activity.report';

export { RiskAlertReport } from './compliance/report-templates/risk-alert.report';
export type {
  RiskAlertReportConfig,
  RiskAlertStatus,
  RiskType,
  RiskAlertData,
  RiskAlertDetail,
} from './compliance/report-templates/risk-alert.report';

export { RegulatoryReport } from './compliance/report-templates/regulatory-report';
export type {
  RegulatoryReportConfig,
  RegulatorySubmissionType,
  Regulator,
  RegulatoryFieldMapping,
  SuspiciousTransactionReport,
  LargeTransactionReport,
  KYCStatistics,
  RegulatoryReportData,
} from './compliance/report-templates/regulatory-report';

// ============================================================================
// 数据留存模块导出
// ============================================================================

export { RetentionManager } from './retention-manager';
export type {
  RetentionManagerConfig,
  DataClassification,
  ArchiveTask,
  PurgeTask,
  ComplianceCheckResult,
  ComplianceFinding,
  RetentionStatistics,
} from './retention-manager';

// ============================================================================
// 审计查询模块导出
// ============================================================================

export { AuditQueryService } from './audit-query.service';
export type {
  AuditQueryServiceConfig,
  QueryResult,
  AggregationResult,
  TimeSeriesResult,
  AdvancedSearchCondition,
  AdvancedSearchQuery,
  ExportConfig,
} from './audit-query.service';

// ============================================================================
// 主服务导出
// ============================================================================

export { AuditService } from './audit.service';
export type {
  AuditServiceConfig,
  AuditServiceStatus,
  AuditOperationOptions,
} from './audit.service';

// ============================================================================
// 默认导出
// ============================================================================

export default {
  AuditService,
  AuditLogger,
  AuditMiddleware,
  EvidenceChain,
  HashingService,
  MerkleTree,
  ComplianceReportService,
  DailySummaryReport,
  TransactionReport,
  UserActivityReport,
  RiskAlertReport,
  RegulatoryReport,
  RetentionManager,
  AuditQueryService,
};
