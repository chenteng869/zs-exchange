import {
  ComplianceReport,
  ReportType,
  ReportFormat,
  ReportStatus,
  ReportSchedule,
  RetentionClass,
  AuditLogEntry,
} from '../../audit.types';

export interface UserActivityReportConfig {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  includeDetails?: boolean;
  groupBy?: 'day' | 'week' | 'month';
  locale?: string;
  timezone?: string;
}

export interface UserActivityData {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  inactiveUsers: number;
  totalSessions: number;
  avgSessionDuration?: number;
  topActions: { action: string; count: number }[];
}

export class UserActivityReport {
  constructor(config?: UserActivityReportConfig) {}

  generate(logs: AuditLogEntry[], format: ReportFormat = ReportFormat.JSON): ComplianceReport {
    const now = Date.now();
    return {
      id: `report_ua_${now}`,
      reportType: ReportType.USER_ACTIVITY,
      title: 'User Activity Report',
      format,
      status: ReportStatus.COMPLETED,
      schedule: ReportSchedule.ON_DEMAND,
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
