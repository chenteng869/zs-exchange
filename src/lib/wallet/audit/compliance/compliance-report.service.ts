/**
 * 合规报表服务 (ComplianceReportService)
 *
 * 功能：
 *  - 统一报表生成入口
 *  - 报表模板管理
 *  - 报表调度和定时生成
 *  - 报表导出（CSV/Excel/PDF/JSON）
 *  - 报表存储和检索
 *  - 报表审批流程
 *  - 报表分发
 *  - 报表生命周期管理
 */

import {
  ComplianceReport,
  ReportType,
  ReportFormat,
  ReportStatus,
  ReportSchedule,
  ReportSection,
  AuditLogEntry,
  AuditQueryFilter,
  RetentionClass,
} from '../audit.types';

import { DailySummaryReport } from './report-templates/daily-summary.report';
import { TransactionReport } from './report-templates/transaction-report';
import { UserActivityReport } from './report-templates/user-activity.report';
import { RiskAlertReport } from './report-templates/risk-alert.report';
import { RegulatoryReport } from './report-templates/regulatory-report';

// ============================================================================
// 报表服务配置接口
// ============================================================================

export interface ComplianceReportServiceConfig {
  storagePath?: string;
  defaultLocale?: string;
  defaultTimezone?: string;
  retentionDays?: {
    hot: number;
    warm: number;
    cold: number;
  };
  autoArchive?: boolean;
  enableScheduling?: boolean;
  maxConcurrentReports?: number;
  exportFormats?: ReportFormat[];
}

// ============================================================================
// 报表生成任务接口
// ============================================================================

export interface ReportGenerationTask {
  id: string;
  reportType: ReportType;
  format: ReportFormat;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  parameters: Record<string, unknown>;
  reportId?: string;
  error?: string;
}

// ============================================================================
// 报表调度配置接口
// ============================================================================

export interface ReportScheduleConfig {
  id: string;
  reportType: ReportType;
  schedule: ReportSchedule;
  format: ReportFormat;
  enabled: boolean;
  parameters?: Record<string, unknown>;
  distributionList?: string[];
  lastRun?: number;
  nextRun?: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// 报表导出结果接口
// ============================================================================

export interface ReportExportResult {
  reportId: string;
  format: ReportFormat;
  fileName: string;
  content: string | Uint8Array;
  size: number;
  mimeType: string;
  generatedAt: number;
}

// ============================================================================
// 报表统计信息接口
// ============================================================================

export interface ReportStatistics {
  totalReports: number;
  byType: Record<ReportType, number>;
  byStatus: Record<ReportStatus, number>;
  bySchedule: Record<ReportSchedule, number>;
  generatedToday: number;
  generatedThisWeek: number;
  generatedThisMonth: number;
  failedReports: number;
  averageGenerationTime?: number;
}

// ============================================================================
// 合规报表服务类
// ============================================================================

export class ComplianceReportService {
  private config: Required<ComplianceReportServiceConfig>;
  private reports: Map<string, ComplianceReport> = new Map();
  private generationTasks: Map<string, ReportGenerationTask> = new Map();
  private schedules: Map<string, ReportScheduleConfig> = new Map();
  private isRunning = false;
  private schedulerTimer: ReturnType<typeof setInterval> | null = null;
  private onReportGeneratedCallbacks: Array<(report: ComplianceReport) => void> = [];
  private onReportFailedCallbacks: Array<(taskId: string, error: string) => void> = [];

  // ========================================================================
  // 构造函数
  // ========================================================================

  constructor(config?: ComplianceReportServiceConfig) {
    this.config = {
      storagePath: './data/reports',
      defaultLocale: 'zh-CN',
      defaultTimezone: 'Asia/Shanghai',
      retentionDays: {
        hot: 30,
        warm: 90,
        cold: 365,
      },
      autoArchive: true,
      enableScheduling: false,
      maxConcurrentReports: 3,
      exportFormats: [ReportFormat.JSON, ReportFormat.CSV],
      ...config,
    };
  }

  // ========================================================================
  // 报表生成方法
  // ========================================================================

  /**
   * 生成报表
   */
  async generateReport(
    reportType: ReportType,
    logs: AuditLogEntry[],
    format: ReportFormat = ReportFormat.JSON,
    parameters?: Record<string, unknown>
  ): Promise<ComplianceReport> {
    const taskId = this.createGenerationTask(reportType, format, parameters || {});

    try {
      this.updateTaskStatus(taskId, 'generating', 10);

      let report: ComplianceReport;

      switch (reportType) {
        case ReportType.DAILY_SUMMARY:
          report = this.generateDailySummaryReport(logs, format, parameters);
          break;
        case ReportType.TRANSACTION_REPORT:
          report = this.generateTransactionReport(logs, format, parameters);
          break;
        case ReportType.USER_ACTIVITY:
          report = this.generateUserActivityReport(logs, format, parameters);
          break;
        case ReportType.RISK_ALERT:
          report = this.generateRiskAlertReport(logs, format, parameters);
          break;
        case ReportType.REGULATORY:
          report = this.generateRegulatoryReport(logs, format, parameters);
          break;
        default:
          throw new Error(`不支持的报表类型: ${reportType}`);
      }

      this.updateTaskStatus(taskId, 'completed', 100);
      this.reports.set(report.id, report);
      this.generationTasks.get(taskId)!.reportId = report.id;

      for (const callback of this.onReportGeneratedCallbacks) {
        callback(report);
      }

      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.updateTaskStatus(taskId, 'failed', 0, errorMessage);

      for (const callback of this.onReportFailedCallbacks) {
        callback(taskId, errorMessage);
      }

      throw error;
    }
  }

  /**
   * 生成日汇总报表
   */
  private generateDailySummaryReport(
    logs: AuditLogEntry[],
    format: ReportFormat,
    parameters?: Record<string, unknown>
  ): ComplianceReport {
    const report = new DailySummaryReport(parameters as any);
    return report.generate(logs, format);
  }

  /**
   * 生成交易报表
   */
  private generateTransactionReport(
    logs: AuditLogEntry[],
    format: ReportFormat,
    parameters?: Record<string, unknown>
  ): ComplianceReport {
    const report = new TransactionReport(parameters as any);
    return report.generate(logs, format);
  }

  /**
   * 生成用户活动报表
   */
  private generateUserActivityReport(
    logs: AuditLogEntry[],
    format: ReportFormat,
    parameters?: Record<string, unknown>
  ): ComplianceReport {
    const report = new UserActivityReport(parameters as any);
    return report.generate(logs, format);
  }

  /**
   * 生成风险告警报表
   */
  private generateRiskAlertReport(
    logs: AuditLogEntry[],
    format: ReportFormat,
    parameters?: Record<string, unknown>
  ): ComplianceReport {
    const report = new RiskAlertReport(parameters as any);
    return report.generate(logs, format);
  }

  /**
   * 生成监管报送报表
   */
  private generateRegulatoryReport(
    logs: AuditLogEntry[],
    format: ReportFormat,
    parameters?: Record<string, unknown>
  ): ComplianceReport {
    const report = new RegulatoryReport(parameters as any);
    return report.generate(logs, format);
  }

  /**
   * 创建生成任务
   */
  private createGenerationTask(
    reportType: ReportType,
    format: ReportFormat,
    parameters: Record<string, unknown>
  ): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const task: ReportGenerationTask = {
      id: taskId,
      reportType,
      format,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
      parameters,
    };

    this.generationTasks.set(taskId, task);
    return taskId;
  }

  /**
   * 更新任务状态
   */
  private updateTaskStatus(
    taskId: string,
    status: ReportGenerationTask['status'],
    progress: number,
    error?: string
  ): void {
    const task = this.generationTasks.get(taskId);
    if (!task) return;

    task.status = status;
    task.progress = progress;

    if (status === 'generating' && !task.startedAt) {
      task.startedAt = Date.now();
    }
    if (status === 'completed' || status === 'failed') {
      task.completedAt = Date.now();
    }
    if (error) {
      task.error = error;
    }
  }

  // ========================================================================
  // 报表查询方法
  // ========================================================================

  /**
   * 根据 ID 获取报表
   */
  getReportById(reportId: string): ComplianceReport | undefined {
    return this.reports.get(reportId);
  }

  /**
   * 搜索报表
   */
  searchReports(
    filters: {
      type?: ReportType;
      status?: ReportStatus;
      schedule?: ReportSchedule;
      startDate?: number;
      endDate?: number;
      keyword?: string;
    } = {}
  ): ComplianceReport[] {
    let results = Array.from(this.reports.values());

    if (filters.type) {
      results = results.filter((r) => r.reportType === filters.type);
    }
    if (filters.status) {
      results = results.filter((r) => r.status === filters.status);
    }
    if (filters.schedule) {
      results = results.filter((r) => r.schedule === filters.schedule);
    }
    if (filters.startDate) {
      results = results.filter((r) => r.generatedAt >= filters.startDate!);
    }
    if (filters.endDate) {
      results = results.filter((r) => r.generatedAt <= filters.endDate!);
    }
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(keyword) ||
          r.description.toLowerCase().includes(keyword)
      );
    }

    return results.sort((a, b) => b.generatedAt - a.generatedAt);
  }

  /**
   * 获取报表列表
   */
  listReports(
    page: number = 1,
    pageSize: number = 20
  ): { reports: ComplianceReport[]; total: number; page: number; pageSize: number } {
    const allReports = Array.from(this.reports.values()).sort(
      (a, b) => b.generatedAt - a.generatedAt
    );

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      reports: allReports.slice(start, end),
      total: allReports.length,
      page,
      pageSize,
    };
  }

  /**
   * 获取生成任务状态
   */
  getGenerationTask(taskId: string): ReportGenerationTask | undefined {
    return this.generationTasks.get(taskId);
  }

  // ========================================================================
  // 报表导出方法
  // ========================================================================

  /**
   * 导出报表
   */
  exportReport(reportId: string, format: ReportFormat): ReportExportResult {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`报表不存在: ${reportId}`);
    }

    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case ReportFormat.JSON:
        content = this.exportAsJson(report);
        mimeType = 'application/json';
        extension = 'json';
        break;
      case ReportFormat.CSV:
        content = this.exportAsCsv(report);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case ReportFormat.EXCEL:
        content = this.exportAsExcel(report);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        break;
      case ReportFormat.PDF:
        content = this.exportAsPdf(report);
        mimeType = 'application/pdf';
        extension = 'pdf';
        break;
      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }

    const fileName = `${report.reportType}_${this.formatDate(report.generatedAt)}.${extension}`;

    return {
      reportId,
      format,
      fileName,
      content,
      size: content.length,
      mimeType,
      generatedAt: Date.now(),
    };
  }

  /**
   * 导出为 JSON
   */
  private exportAsJson(report: ComplianceReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * 导出为 CSV
   */
  private exportAsCsv(report: ComplianceReport): string {
    const lines: string[] = [];

    lines.push(`报表标题,${report.title}`);
    lines.push(`报表类型,${report.reportType}`);
    lines.push(`生成时间,${new Date(report.generatedAt).toISOString()}`);
    lines.push(`周期开始,${new Date(report.periodStart).toISOString()}`);
    lines.push(`周期结束,${new Date(report.periodEnd).toISOString()}`);
    lines.push('');

    lines.push('统计指标');
    if (report.statistics) {
      lines.push(`总记录数,${report.statistics.totalRecords}`);
      lines.push(`过滤记录数,${report.statistics.filteredRecords}`);
      if (report.statistics.summaryMetrics) {
        for (const [key, value] of Object.entries(report.statistics.summaryMetrics)) {
          lines.push(`${key},${value}`);
        }
      }
    }
    lines.push('');

    lines.push('报表章节');
    lines.push('章节ID,章节标题,章节类型,描述');
    for (const section of report.sections) {
      lines.push(`${section.id},"${section.title}",${section.type},"${section.description}"`);
    }

    return lines.join('\n');
  }

  /**
   * 导出为 Excel（简化版，实际项目中使用 xlsx 库）
   */
  private exportAsExcel(report: ComplianceReport): string {
    return this.exportAsCsv(report);
  }

  /**
   * 导出为 PDF（简化版，实际项目中使用 pdf-lib 或 puppeteer）
   */
  private exportAsPdf(report: ComplianceReport): string {
    return this.exportAsJson(report);
  }

  /**
   * 格式化日期
   */
  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return (
      date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0') +
      '_' +
      String(date.getHours()).padStart(2, '0') +
      String(date.getMinutes()).padStart(2, '0')
    );
  }

  // ========================================================================
  // 报表调度方法
  // ========================================================================

  /**
   * 添加调度配置
   */
  addSchedule(config: Omit<ReportScheduleConfig, 'id' | 'createdAt' | 'updatedAt'>): ReportScheduleConfig {
    const id = `schedule_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const scheduleConfig: ReportScheduleConfig = {
      ...config,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nextRun: this.calculateNextRun(config.schedule),
    };

    this.schedules.set(id, scheduleConfig);
    return scheduleConfig;
  }

  /**
   * 更新调度配置
   */
  updateSchedule(
    scheduleId: string,
    updates: Partial<ReportScheduleConfig>
  ): ReportScheduleConfig | undefined {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return undefined;

    Object.assign(schedule, updates, { updatedAt: Date.now() });

    if (updates.schedule) {
      schedule.nextRun = this.calculateNextRun(updates.schedule);
    }

    return schedule;
  }

  /**
   * 删除调度配置
   */
  deleteSchedule(scheduleId: string): boolean {
    return this.schedules.delete(scheduleId);
  }

  /**
   * 获取调度配置列表
   */
  listSchedules(): ReportScheduleConfig[] {
    return Array.from(this.schedules.values()).sort(
      (a, b) => (a.nextRun || 0) - (b.nextRun || 0)
    );
  }

  /**
   * 计算下次运行时间
   */
  private calculateNextRun(schedule: ReportSchedule): number | undefined {
    const now = Date.now();

    switch (schedule) {
      case ReportSchedule.DAILY: {
        const next = new Date();
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);
        return next.getTime();
      }
      case ReportSchedule.WEEKLY: {
        const next = new Date();
        next.setDate(next.getDate() + (7 - next.getDay()));
        next.setHours(0, 0, 0, 0);
        return next.getTime();
      }
      case ReportSchedule.MONTHLY: {
        const next = new Date();
        next.setMonth(next.getMonth() + 1, 1);
        next.setHours(0, 0, 0, 0);
        return next.getTime();
      }
      case ReportSchedule.QUARTERLY: {
        const next = new Date();
        const currentQuarter = Math.floor(next.getMonth() / 3);
        next.setMonth((currentQuarter + 1) * 3, 1);
        next.setHours(0, 0, 0, 0);
        return next.getTime();
      }
      case ReportSchedule.YEARLY: {
        const next = new Date();
        next.setFullYear(next.getFullYear() + 1, 0, 1);
        next.setHours(0, 0, 0, 0);
        return next.getTime();
      }
      default:
        return undefined;
    }
  }

  /**
   * 启动调度器
   */
  startScheduler(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.config.enableScheduling = true;

    this.schedulerTimer = setInterval(() => {
      this.checkSchedules();
    }, 60 * 1000);
  }

  /**
   * 停止调度器
   */
  stopScheduler(): void {
    this.isRunning = false;
    this.config.enableScheduling = false;

    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  /**
   * 检查调度
   */
  private checkSchedules(): void {
    const now = Date.now();

    for (const schedule of this.schedules.values()) {
      if (!schedule.enabled) continue;
      if (!schedule.nextRun) continue;
      if (schedule.nextRun > now) continue;

      this.executeScheduledReport(schedule);
    }
  }

  /**
   * 执行定时报表
   */
  private async executeScheduledReport(schedule: ReportScheduleConfig): Promise<void> {
    try {
      schedule.lastRun = Date.now();
      schedule.nextRun = this.calculateNextRun(schedule.schedule);
      schedule.updatedAt = Date.now();
    } catch (error) {
      console.error('定时报表执行失败:', error);
    }
  }

  // ========================================================================
  // 报表审批方法
  // ========================================================================

  /**
   * 提交审批
   */
  submitForApproval(reportId: string, approver: string): boolean {
    const report = this.reports.get(reportId);
    if (!report) return false;

    report.status = ReportStatus.PENDING_APPROVAL;
    report.approvals.push({
      id: `approval-${Date.now()}`,
      approverId: approver,
      approver,
      role: 'approver',
      status: 'pending',
      requestedAt: Date.now(),
      comment: '',
    });

    return true;
  }

  /**
   * 审批报表
   */
  approveReport(
    reportId: string,
    approver: string,
    approved: boolean,
    comment?: string
  ): boolean {
    const report = this.reports.get(reportId);
    if (!report) return false;

    const approval = report.approvals.find((a) => a.approverId === approver && a.status === 'pending');
    if (!approval) return false;

    approval.status = approved ? 'approved' : 'rejected';
    approval.decidedAt = Date.now();
    approval.comment = comment || '';

    const hasPending = report.approvals.some((a) => a.status === 'pending');
    const allApproved = report.approvals.every((a) => a.status === 'approved');
    const hasRejected = report.approvals.some((a) => a.status === 'rejected');

    if (hasRejected) {
      report.status = ReportStatus.REJECTED;
    } else if (!hasPending && allApproved) {
      report.status = ReportStatus.APPROVED;
    }

    return true;
  }

  // ========================================================================
  // 报表生命周期方法
  // ========================================================================

  /**
   * 归档报表
   */
  archiveReport(reportId: string): boolean {
    const report = this.reports.get(reportId);
    if (!report) return false;

    report.isArchived = true;
    report.retentionClass = RetentionClass.COLD;

    return true;
  }

  /**
   * 取消归档
   */
  unarchiveReport(reportId: string): boolean {
    const report = this.reports.get(reportId);
    if (!report) return false;

    report.isArchived = false;
    report.retentionClass = RetentionClass.WARM;

    return true;
  }

  /**
   * 删除报表
   */
  deleteReport(reportId: string): boolean {
    return this.reports.delete(reportId);
  }

  // ========================================================================
  // 统计方法
  // ========================================================================

  /**
   * 获取报表统计信息
   */
  getStatistics(): ReportStatistics {
    const allReports = Array.from(this.reports.values());
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const bySchedule: Record<string, number> = {};
    let generatedToday = 0;
    let generatedThisWeek = 0;
    let generatedThisMonth = 0;
    let failed = 0;

    for (const report of allReports) {
      byType[report.reportType] = (byType[report.reportType] || 0) + 1;
      byStatus[report.status] = (byStatus[report.status] || 0) + 1;
      bySchedule[report.schedule] = (bySchedule[report.schedule] || 0) + 1;

      if (report.generatedAt >= oneDayAgo) generatedToday++;
      if (report.generatedAt >= oneWeekAgo) generatedThisWeek++;
      if (report.generatedAt >= oneMonthAgo) generatedThisMonth++;
      if (report.status === ReportStatus.FAILED) failed++;
    }

    return {
      totalReports: allReports.length,
      byType: byType as Record<ReportType, number>,
      byStatus: byStatus as Record<ReportStatus, number>,
      bySchedule: bySchedule as Record<ReportSchedule, number>,
      generatedToday,
      generatedThisWeek,
      generatedThisMonth,
      failedReports: failed,
    };
  }

  // ========================================================================
  // 事件回调方法
  // ========================================================================

  /**
   * 注册报表生成成功回调
   */
  onReportGenerated(callback: (report: ComplianceReport) => void): void {
    this.onReportGeneratedCallbacks.push(callback);
  }

  /**
   * 注册报表生成失败回调
   */
  onReportFailed(callback: (taskId: string, error: string) => void): void {
    this.onReportFailedCallbacks.push(callback);
  }

  // ========================================================================
  // 清理方法
  // ========================================================================

  /**
   * 清理过期的生成任务
   */
  cleanupOldTasks(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let count = 0;

    for (const [taskId, task] of this.generationTasks.entries()) {
      if (task.createdAt < now - maxAgeMs) {
        this.generationTasks.delete(taskId);
        count++;
      }
    }

    return count;
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopScheduler();
    this.onReportGeneratedCallbacks = [];
    this.onReportFailedCallbacks = [];
    this.reports.clear();
    this.generationTasks.clear();
    this.schedules.clear();
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default ComplianceReportService;
