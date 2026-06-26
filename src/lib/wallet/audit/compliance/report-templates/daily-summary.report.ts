import {
  ComplianceReport,
  ReportType,
  ReportFormat,
  ReportStatus,
  ReportSchedule,
  RetentionClass,
  AuditCategory,
  AuditSeverity,
  AuditAction,
  AuditLogEntry,
  AuditStatistics,
} from '../../audit.types';

export interface DailySummaryReportConfig {
  reportDate?: Date;
  includeCharts?: boolean;
  includeTables?: boolean;
  includeSummary?: boolean;
  locale?: string;
  timezone?: string;
}

export interface DailySummaryData {
  date: string;
  totalAuditLogs: number;
  totalUsers: number;
  totalWallets: number;
  totalTransactions: number;
  totalVolume?: string;
  byCategory: Record<AuditCategory, number>;
  bySeverity: Record<AuditSeverity, number>;
  byStatus: Record<string, number>;
  byAction: Record<AuditAction, number>;
  topActions: { action: AuditAction; count: number; percentage: number }[];
  securityAlerts: { total: number; high: number; critical: number };
  failedOperations: number;
  successfulOperations: number;
  peakHour: number;
  peakHourCount: number;
  hourlyDistribution: number[];
  newUsers: number;
  activeUsers: number;
  newWallets: number;
  loginSuccess: number;
  loginFailed: number;
  transactionVolume: { deposits: number; withdrawals: number; swaps: number };
  dappInteractions: number;
  signatureOperations: number;
}

export class DailySummaryReport {
  private config: DailySummaryReportConfig;

  constructor(config?: DailySummaryReportConfig) {
    this.config = config || {};
  }

  generate(logs: AuditLogEntry[], format: ReportFormat = ReportFormat.JSON): ComplianceReport {
    const now = Date.now();
    return {
      id: `report_daily_${now}`,
      reportType: ReportType.DAILY_SUMMARY,
      title: 'Daily Summary Report',
      format,
      status: ReportStatus.COMPLETED,
      schedule: ReportSchedule.DAILY,
      periodStart: now - 86400000,
      periodEnd: now,
      generatedAt: now,
      parameters: {},
      sections: [],
      statistics: { totalRecords: logs.length, filteredRecords: logs.length, summaryMetrics: {} },
      dataSources: [],
      approvals: [],
      distributionList: [],
      retentionClass: RetentionClass.HOT,
      isArchived: false,
      version: 1,
    };
  }
}
