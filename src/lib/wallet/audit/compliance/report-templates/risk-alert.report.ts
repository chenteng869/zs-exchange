import {
  ComplianceReport,
  ReportType,
  ReportFormat,
  ReportStatus,
  ReportSchedule,
  RetentionClass,
  AuditSeverity,
  AuditLogEntry,
} from '../../audit.types';

export interface RiskAlertReportConfig {
  startDate?: Date;
  endDate?: Date;
  minSeverity?: AuditSeverity;
  status?: RiskAlertStatus;
  includeDetails?: boolean;
  groupBy?: 'day' | 'week' | 'month';
  locale?: string;
  timezone?: string;
}

export enum RiskAlertStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
  ESCALATED = 'escalated',
}

export enum RiskType {
  FRAUD = 'fraud',
  MONEY_LAUNDERING = 'money_laundering',
  PHISHING = 'phishing',
  MALWARE = 'malware',
  HACK = 'hack',
  SCAM = 'scam',
  SANCTIONS = 'sanctions',
  DARKNET = 'darknet',
  MIXER = 'mixer',
  STOLEN_FUNDS = 'stolen_funds',
  HIGH_RISK_ADDRESS = 'high_risk_address',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  UNUSUAL_TRANSACTION = 'unusual_transaction',
  LARGE_TRANSACTION = 'large_transaction',
  RAPID_TRANSACTIONS = 'rapid_transactions',
  ABNORMAL_ACCESS = 'abnormal_access',
}

export interface RiskAlertData {
  totalAlerts: number;
  openAlerts: number;
  resolvedAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  byType: Record<string, number>;
  byDay: Record<string, number>;
  topRiskyUsers: { userId: string; alertCount: number }[];
  topRiskyAddresses: { address: string; alertCount: number; riskType: string }[];
}

export interface RiskAlertDetail {
  alertId: string;
  type: RiskType;
  severity: AuditSeverity;
  status: RiskAlertStatus;
  userId?: string;
  address?: string;
  description: string;
  detectedAt: number;
}

export class RiskAlertReport {
  constructor(config?: RiskAlertReportConfig) {}

  generate(logs: AuditLogEntry[], format: ReportFormat = ReportFormat.JSON): ComplianceReport {
    const now = Date.now();
    return {
      id: `report_risk_${now}`,
      reportType: ReportType.RISK_ALERT,
      title: 'Risk Alert Report',
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
