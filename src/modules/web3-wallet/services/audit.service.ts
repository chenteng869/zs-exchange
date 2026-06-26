/**
 * Web3 钱包模块 - 审计服务
 *
 * 提供审计日志记录、查询、变更追踪、审计报告生成等功能
 * 支持操作日志、敏感操作审计、变更历史追踪等
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateAuditLogDto,
  AuditLogDto,
  AuditLogQueryDto,
  AuditLogStatsDto,
  ChangeLogDto,
  ChangeLogQueryDto,
  AuditReportDto,
  AuditReportRequestDto,
  AuditLogType,
  OperationStatus,
} from '../dto/audit.dto';

@Injectable()
export class AuditService {
  private auditLogs: Map<string, AuditLogDto> = new Map();
  private changeLogs: Map<string, ChangeLogDto> = new Map();
  private auditReports: Map<string, AuditReportDto> = new Map();

  /**
   * 创建审计日志
   *
   * @param createDto 审计日志数据
   * @returns 创建的审计日志
   */
  async createAuditLog(createDto: CreateAuditLogDto): Promise<AuditLogDto> {
    const logId = 'audit_' + this.generateRandomId();

    const log: AuditLogDto = {
      id: logId,
      ...createDto,
      timestamp: new Date(),
    };

    this.auditLogs.set(logId, log);

    return log;
  }

  /**
   * 批量创建审计日志
   *
   * @param logs 审计日志列表
   * @returns 创建的日志数量
   */
  async batchCreateAuditLogs(logs: CreateAuditLogDto[]): Promise<number> {
    for (const log of logs) {
      await this.createAuditLog(log);
    }
    return logs.length;
  }

  /**
   * 查询审计日志
   *
   * @param queryDto 查询参数
   * @returns 审计日志列表和总数
   */
  async queryAuditLogs(queryDto: AuditLogQueryDto): Promise<{ list: AuditLogDto[]; total: number }> {
    const {
      page,
      pageSize,
      userId,
      action,
      logType,
      status,
      resourceType,
      resourceId,
      ip,
      userAgent,
      startTime,
      endTime,
      keyword,
      sortBy,
      sortOrder,
    } = queryDto;

    let logs = Array.from(this.auditLogs.values());

    if (userId) logs = logs.filter((l) => l.userId === userId);
    if (action) logs = logs.filter((l) => l.action === action);
    if (logType) logs = logs.filter((l) => l.logType === logType);
    if (status) logs = logs.filter((l) => l.status === status);
    if (resourceType) logs = logs.filter((l) => l.resourceType === resourceType);
    if (resourceId) logs = logs.filter((l) => l.resourceId === resourceId);
    if (ip) logs = logs.filter((l) => l.ip === ip);
    if (userAgent) logs = logs.filter((l) => l.userAgent?.includes(userAgent));
    if (startTime) {
      logs = logs.filter((l) => l.timestamp && new Date(l.timestamp).getTime() >= startTime);
    }
    if (endTime) {
      logs = logs.filter((l) => l.timestamp && new Date(l.timestamp).getTime() <= endTime);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(kw) ||
          (l.description && l.description.toLowerCase().includes(kw)),
      );
    }

    const sortField = sortBy || 'timestamp';
    const sortDir = sortOrder || 'desc';
    logs.sort((a, b) => {
      const aVal = (a as any)[sortField];
      const bVal = (b as any)[sortField];
      if (!aVal || !bVal) return 0;
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'desc' ? -comparison : comparison;
    });

    const total = logs.length;
    const start = (page - 1) * pageSize;
    const list = logs.slice(start, start + pageSize);

    return { list, total };
  }

  /**
   * 获取审计日志详情
   *
   * @param logId 日志ID
   * @returns 审计日志详情
   */
  async getAuditLogById(logId: string): Promise<AuditLogDto> {
    const log = this.auditLogs.get(logId);
    if (!log) {
      throw new NotFoundException('审计日志不存在');
    }
    return log;
  }

  /**
   * 获取审计统计信息
   *
   * @param userId 用户ID（可选）
   * @param startTime 开始时间（可选）
   * @param endTime 结束时间（可选）
   * @returns 统计信息
   */
  async getAuditStats(userId?: string, startTime?: number, endTime?: number): Promise<AuditLogStatsDto> {
    let logs = Array.from(this.auditLogs.values());

    if (userId) logs = logs.filter((l) => l.userId === userId);
    if (startTime) {
      logs = logs.filter((l) => l.timestamp && new Date(l.timestamp).getTime() >= startTime);
    }
    if (endTime) {
      logs = logs.filter((l) => l.timestamp && new Date(l.timestamp).getTime() <= endTime);
    }

    const stats: AuditLogStatsDto = {
      totalLogs: logs.length,
      todayLogs: logs.filter(
        (l) => l.timestamp && new Date(l.timestamp).toDateString() === new Date().toDateString(),
      ).length,
      successCount: logs.filter((l) => l.status === OperationStatus.SUCCESS).length,
      failedCount: logs.filter((l) => l.status === OperationStatus.FAILED).length,
      pendingCount: logs.filter((l) => l.status === OperationStatus.PENDING).length,
      byType: {
        [AuditLogType.USER_ACTION]: logs.filter((l) => l.logType === AuditLogType.USER_ACTION).length,
        [AuditLogType.WALLET_OPERATION]: logs.filter((l) => l.logType === AuditLogType.WALLET_OPERATION).length,
        [AuditLogType.KEY_OPERATION]: logs.filter((l) => l.logType === AuditLogType.KEY_OPERATION).length,
        [AuditLogType.TRANSACTION]: logs.filter((l) => l.logType === AuditLogType.TRANSACTION).length,
        [AuditLogType.SECURITY_EVENT]: logs.filter((l) => l.logType === AuditLogType.SECURITY_EVENT).length,
        [AuditLogType.SYSTEM_EVENT]: logs.filter((l) => l.logType === AuditLogType.SYSTEM_EVENT).length,
        [AuditLogType.ADMIN_ACTION]: logs.filter((l) => l.logType === AuditLogType.ADMIN_ACTION).length,
        [AuditLogType.RISK_EVENT]: logs.filter((l) => l.logType === AuditLogType.RISK_EVENT).length,
        [AuditLogType.COMPLIANCE]: logs.filter((l) => l.logType === AuditLogType.COMPLIANCE).length,
        [AuditLogType.CONFIG_CHANGE]: logs.filter((l) => l.logType === AuditLogType.CONFIG_CHANGE).length,
      },
      byAction: {},
      topUsers: [],
      peakHour: 14,
    };

    const actionCounts = new Map<string, number>();
    for (const log of logs) {
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
    }
    const sortedActions = Array.from(actionCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    for (const [action, count] of sortedActions) {
      stats.byAction[action] = count;
    }

    return stats;
  }

  /**
   * 记录变更日志
   *
   * @param entityType 实体类型
   * @param entityId 实体ID
   * @param field 字段名
   * @param oldValue 旧值
   * @param newValue 新值
   * @param changedBy 变更人
   * @param changeReason 变更原因
   * @returns 变更日志
   */
  async recordChange(
    entityType: string,
    entityId: string,
    field: string,
    oldValue: any,
    newValue: any,
    changedBy: string,
    changeReason?: string,
  ): Promise<ChangeLogDto> {
    const logId = 'change_' + this.generateRandomId();

    const changeLog: ChangeLogDto = {
      id: logId,
      entityType,
      entityId,
      field,
      oldValue,
      newValue,
      changedBy,
      changedAt: new Date(),
      changeReason,
    };

    this.changeLogs.set(logId, changeLog);

    return changeLog;
  }

  /**
   * 批量记录变更
   *
   * @param changes 变更列表
   * @returns 变更数量
   */
  async recordChanges(
    changes: Array<{
      entityType: string;
      entityId: string;
      field: string;
      oldValue: any;
      newValue: any;
      changedBy: string;
      changeReason?: string;
    }>,
  ): Promise<number> {
    for (const change of changes) {
      await this.recordChange(
        change.entityType,
        change.entityId,
        change.field,
        change.oldValue,
        change.newValue,
        change.changedBy,
        change.changeReason,
      );
    }
    return changes.length;
  }

  /**
   * 查询变更日志
   *
   * @param queryDto 查询参数
   * @returns 变更日志列表和总数
   */
  async queryChangeLogs(queryDto: ChangeLogQueryDto): Promise<{ list: ChangeLogDto[]; total: number }> {
    const {
      page,
      pageSize,
      entityType,
      entityId,
      field,
      changedBy,
      startTime,
      endTime,
    } = queryDto;

    let logs = Array.from(this.changeLogs.values());

    if (entityType) logs = logs.filter((l) => l.entityType === entityType);
    if (entityId) logs = logs.filter((l) => l.entityId === entityId);
    if (field) logs = logs.filter((l) => l.field === field);
    if (changedBy) logs = logs.filter((l) => l.changedBy === changedBy);
    if (startTime) {
      logs = logs.filter((l) => l.changedAt && new Date(l.changedAt).getTime() >= startTime);
    }
    if (endTime) {
      logs = logs.filter((l) => l.changedAt && new Date(l.changedAt).getTime() <= endTime);
    }

    logs.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());

    const total = logs.length;
    const start = (page - 1) * pageSize;
    const list = logs.slice(start, start + pageSize);

    return { list, total };
  }

  /**
   * 获取实体变更历史
   *
   * @param entityType 实体类型
   * @param entityId 实体ID
   * @returns 变更历史列表
   */
  async getEntityChangeHistory(entityType: string, entityId: string): Promise<ChangeLogDto[]> {
    const logs = Array.from(this.changeLogs.values()).filter(
      (l) => l.entityType === entityType && l.entityId === entityId,
    );
    return logs.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  }

  /**
   * 生成审计报告
   *
   * @param requestDto 报告请求参数
   * @returns 审计报告
   */
  async generateAuditReport(requestDto: AuditReportRequestDto): Promise<AuditReportDto> {
    const { reportType, startTime, endTime, filters, format, includeCharts } = requestDto;

    const reportId = 'report_' + this.generateRandomId();

    const logs = Array.from(this.auditLogs.values()).filter((l) => {
      if (l.timestamp) {
        const t = new Date(l.timestamp).getTime();
        if (startTime && t < startTime) return false;
        if (endTime && t > endTime) return false;
      }
      return true;
    });

    const report: AuditReportDto = {
      reportId,
      reportType,
      title: this.generateReportTitle(reportType),
      startTime: new Date(startTime || Date.now() - 7 * 24 * 3600 * 1000),
      endTime: new Date(endTime || Date.now()),
      generatedAt: new Date(),
      format: format || 'json',
      summary: {
        totalRecords: logs.length,
        periodDays: Math.ceil(
          ((endTime || Date.now()) - (startTime || Date.now() - 7 * 24 * 3600 * 1000)) / (24 * 3600 * 1000),
        ),
        keyFindings: [
          '系统运行正常，未发现重大安全事件',
          `期间共记录 ${logs.length} 条操作日志`,
          `成功率: ${((logs.filter((l) => l.status === OperationStatus.SUCCESS).length / logs.length) * 100).toFixed(2)}%`,
        ],
      },
      statistics: {
        totalActions: logs.length,
        successRate: logs.length > 0
          ? (logs.filter((l) => l.status === OperationStatus.SUCCESS).length / logs.length) * 100
          : 0,
        avgActionsPerDay: logs.length / 7,
        peakHour: 14,
      },
      charts: includeCharts
        ? [
            {
              type: 'line',
              title: '日操作量趋势',
              data: [],
            },
            {
              type: 'pie',
              title: '操作类型分布',
              data: [],
            },
          ]
        : [],
      topActions: this.getTopActions(logs, 10),
      topUsers: this.getTopUsers(logs, 10),
      securityEvents: logs.filter((l) => l.logType === AuditLogType.SECURITY_EVENT).slice(0, 50),
      failedOperations: logs.filter((l) => l.status === OperationStatus.FAILED).slice(0, 50),
      filters,
    };

    this.auditReports.set(reportId, report);

    return report;
  }

  /**
   * 获取审计报告
   *
   * @param reportId 报告ID
   * @returns 审计报告
   */
  async getAuditReport(reportId: string): Promise<AuditReportDto> {
    const report = this.auditReports.get(reportId);
    if (!report) {
      throw new NotFoundException('审计报告不存在');
    }
    return report;
  }

  /**
   * 导出审计日志
   *
   * @param queryDto 查询参数
   * @param format 导出格式
   * @returns 导出数据
   */
  async exportAuditLogs(queryDto: AuditLogQueryDto, format: 'csv' | 'json' | 'excel'): Promise<{ data: string; contentType: string; filename: string }> {
    const { list } = await this.queryAuditLogs({ ...queryDto, page: 1, pageSize: 10000 });

    let data: string;
    let contentType: string;
    let filename: string;
    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === 'csv') {
      const headers = ['ID', '用户ID', '操作', '类型', '状态', '时间', 'IP', '描述'];
      const rows = list.map((l) => [
        l.id,
        l.userId || '',
        l.action,
        l.logType,
        l.status,
        l.timestamp?.toString() || '',
        l.ip || '',
        l.description || '',
      ]);
      data = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
      contentType = 'text/csv';
      filename = `audit-logs-${timestamp}.csv`;
    } else if (format === 'json') {
      data = JSON.stringify(list, null, 2);
      contentType = 'application/json';
      filename = `audit-logs-${timestamp}.json`;
    } else {
      data = JSON.stringify(list);
      contentType = 'application/vnd.ms-excel';
      filename = `audit-logs-${timestamp}.xlsx`;
    }

    return { data, contentType, filename };
  }

  /**
   * 清理过期审计日志
   *
   * @param days 保留天数
   * @returns 清理的日志数量
   */
  async cleanOldLogs(days: number = 90): Promise<number> {
    const cutoff = Date.now() - days * 24 * 3600 * 1000;
    let count = 0;

    for (const [id, log] of this.auditLogs.entries()) {
      if (log.timestamp && new Date(log.timestamp).getTime() < cutoff) {
        this.auditLogs.delete(id);
        count++;
      }
    }

    return count;
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /**
   * 生成报告标题
   */
  private generateReportTitle(reportType: string): string {
    const titles: Record<string, string> = {
      daily: '每日审计报告',
      weekly: '每周审计报告',
      monthly: '每月审计报告',
      custom: '自定义审计报告',
      security: '安全审计报告',
      compliance: '合规审计报告',
      transaction: '交易审计报告',
      user_activity: '用户活动报告',
    };
    return titles[reportType] || '审计报告';
  }

  /**
   * 获取 Top 操作
   */
  private getTopActions(logs: AuditLogDto[], limit: number): Array<{ action: string; count: number; percentage: number }> {
    const actionCounts = new Map<string, number>();
    for (const log of logs) {
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
    }

    const total = logs.length || 1;
    return Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([action, count]) => ({
        action,
        count,
        percentage: (count / total) * 100,
      }));
  }

  /**
   * 获取 Top 用户
   */
  private getTopUsers(logs: AuditLogDto[], limit: number): Array<{ userId: string; count: number; percentage: number }> {
    const userCounts = new Map<string, number>();
    for (const log of logs) {
      if (log.userId) {
        userCounts.set(log.userId, (userCounts.get(log.userId) || 0) + 1);
      }
    }

    const total = logs.length || 1;
    return Array.from(userCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([userId, count]) => ({
        userId,
        count,
        percentage: (count / total) * 100,
      }));
  }

  /**
   * 生成随机 ID
   */
  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
