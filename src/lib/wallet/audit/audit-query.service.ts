/**
 * 审计查询服务 (AuditQueryService)
 *
 * 功能：
 *  - 多维度审计查询
 *  - 高级搜索
 *  - 统计分析
 *  - 数据导出
 *  - 全文检索
 *  - 聚合查询
 *  - 时间范围查询
 *  - 分页和排序
 */

import {
  AuditLogEntry,
  AuditAction,
  AuditCategory,
  AuditStatus,
  AuditSeverity,
  AuditQueryFilter,
  AuditStatistics,
} from './audit.types';

// ============================================================================
// 查询服务配置接口
// ============================================================================

export interface AuditQueryServiceConfig {
  maxPageSize?: number;
  defaultPageSize?: number;
  maxQueryRange?: number;
  enableFullTextSearch?: boolean;
  cacheResults?: boolean;
  cacheTTL?: number;
}

// ============================================================================
// 查询结果接口
// ============================================================================

export interface QueryResult<T = AuditLogEntry> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  queryTime: number;
}

// ============================================================================
// 聚合结果接口
// ============================================================================

export interface AggregationResult {
  field: string;
  buckets: {
    key: string;
    count: number;
    percentage?: number;
  }[];
  total: number;
}

// ============================================================================
// 时间序列结果接口
// ============================================================================

export interface TimeSeriesResult {
  interval: string;
  dataPoints: {
    timestamp: number;
    count: number;
    value?: number;
  }[];
  total: number;
}

// ============================================================================
// 高级搜索条件接口
// ============================================================================

export interface AdvancedSearchCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' |
    'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'in' | 'not_in' |
    'between' | 'exists' | 'regex';
  value: unknown;
  caseSensitive?: boolean;
}

// ============================================================================
// 高级搜索查询接口
// ============================================================================

export interface AdvancedSearchQuery {
  conditions: AdvancedSearchCondition[];
  operator: 'AND' | 'OR';
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  page?: number;
  pageSize?: number;
}

// ============================================================================
// 导出配置接口
// ============================================================================

export interface ExportConfig {
  format: 'json' | 'csv' | 'xlsx';
  fields?: string[];
  includeHeaders?: boolean;
  filename?: string;
}

// ============================================================================
// 审计查询服务类
// ============================================================================

export class AuditQueryService {
  private config: Required<AuditQueryServiceConfig>;
  private logs: AuditLogEntry[] = [];
  private index: Map<string, AuditLogEntry> = new Map();
  private categoryIndex: Map<string, AuditLogEntry[]> = new Map();
  private actionIndex: Map<string, AuditLogEntry[]> = new Map();
  private statusIndex: Map<string, AuditLogEntry[]> = new Map();
  private severityIndex: Map<string, AuditLogEntry[]> = new Map();
  private userIdIndex: Map<string, AuditLogEntry[]> = new Map();
  private walletIdIndex: Map<string, AuditLogEntry[]> = new Map();
  private queryCache: Map<string, { result: QueryResult; timestamp: number }> = new Map();

  // ========================================================================
  // 构造函数
  // ========================================================================

  constructor(config?: AuditQueryServiceConfig) {
    this.config = {
      maxPageSize: 1000,
      defaultPageSize: 20,
      maxQueryRange: 365 * 24 * 60 * 60 * 1000,
      enableFullTextSearch: true,
      cacheResults: true,
      cacheTTL: 5 * 60 * 1000,
      ...config,
    };
  }

  // ========================================================================
  // 数据管理方法
  // ========================================================================

  /**
   * 添加审计日志
   */
  addLog(log: AuditLogEntry): void {
    this.logs.push(log);
    this.index.set(log.id, log);
    this.updateIndexes(log);
    this.invalidateCache();
  }

  /**
   * 批量添加审计日志
   */
  addLogs(logs: AuditLogEntry[]): void {
    for (const log of logs) {
      this.logs.push(log);
      this.index.set(log.id, log);
      this.updateIndexes(log);
    }
    this.invalidateCache();
  }

  /**
   * 更新索引
   */
  private updateIndexes(log: AuditLogEntry): void {
    if (!this.categoryIndex.has(log.category)) {
      this.categoryIndex.set(log.category, []);
    }
    this.categoryIndex.get(log.category)!.push(log);

    if (!this.actionIndex.has(log.action)) {
      this.actionIndex.set(log.action, []);
    }
    this.actionIndex.get(log.action)!.push(log);

    if (!this.statusIndex.has(log.status)) {
      this.statusIndex.set(log.status, []);
    }
    this.statusIndex.get(log.status)!.push(log);

    if (!this.severityIndex.has(log.severity)) {
      this.severityIndex.set(log.severity, []);
    }
    this.severityIndex.get(log.severity)!.push(log);

    if (log.actor.userId) {
      if (!this.userIdIndex.has(log.actor.userId)) {
        this.userIdIndex.set(log.actor.userId, []);
      }
      this.userIdIndex.get(log.actor.userId)!.push(log);
    }

    if (log.actor.walletId) {
      if (!this.walletIdIndex.has(log.actor.walletId)) {
        this.walletIdIndex.set(log.actor.walletId, []);
      }
      this.walletIdIndex.get(log.actor.walletId)!.push(log);
    }
  }

  /**
   * 失效缓存
   */
  private invalidateCache(): void {
    this.queryCache.clear();
  }

  /**
   * 根据 ID 获取日志
   */
  getLogById(id: string): AuditLogEntry | undefined {
    return this.index.get(id);
  }

  // ========================================================================
  // 基础查询方法
  // ========================================================================

  /**
   * 查询审计日志
   */
  query(
    filter: AuditQueryFilter = {},
    page: number = 1,
    pageSize?: number,
    sortField: string = 'timestamp',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): QueryResult {
    const cacheKey = this.generateCacheKey(filter, page, pageSize, sortField, sortOrder);

    if (this.config.cacheResults && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.config.cacheTTL) {
        return cached.result;
      }
      this.queryCache.delete(cacheKey);
    }

    const effectivePageSize = Math.min(
      pageSize || this.config.defaultPageSize,
      this.config.maxPageSize
    );

    let filtered = this.applyFilter(this.logs, filter);

    filtered = this.sortLogs(filtered, sortField, sortOrder);

    const total = filtered.length;
    const totalPages = Math.ceil(total / effectivePageSize);
    const start = (page - 1) * effectivePageSize;
    const end = start + effectivePageSize;
    const data = filtered.slice(start, end);

    const result: QueryResult = {
      data,
      total,
      page,
      pageSize: effectivePageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      queryTime: Date.now(),
    };

    if (this.config.cacheResults) {
      this.queryCache.set(cacheKey, { result, timestamp: Date.now() });
    }

    return result;
  }

  /**
   * 应用过滤器
   */
  private applyFilter(logs: AuditLogEntry[], filter: AuditQueryFilter): AuditLogEntry[] {
    return logs.filter((log) => {
      if (filter.actions && filter.actions.length > 0) {
        if (!filter.actions.includes(log.action)) return false;
      }
      if (filter.categories && filter.categories.length > 0) {
        if (!filter.categories.includes(log.category)) return false;
      }
      if (filter.statuses && filter.statuses.length > 0) {
        if (!filter.statuses.includes(log.status)) return false;
      }
      if (filter.severities && filter.severities.length > 0) {
        if (!filter.severities.includes(log.severity)) return false;
      }
      if (filter.startTime && log.timestamp < filter.startTime) return false;
      if (filter.endTime && log.timestamp > filter.endTime) return false;
      if (filter.userId && log.actor.userId !== filter.userId) return false;
      if (filter.walletId && log.actor.walletId !== filter.walletId &&
          log.target?.walletId !== filter.walletId) return false;
      if (filter.traceId && log.traceId !== filter.traceId) return false;
      if (filter.txHash && log.txHash !== filter.txHash) return false;
      if (filter.chainId && log.chainId !== filter.chainId) return false;
      if (filter.keyword) {
        const keyword = filter.keyword.toLowerCase();
        const searchableText = this.getSearchableText(log);
        if (!searchableText.includes(keyword)) return false;
      }
      if (filter.minRiskScore !== undefined &&
          (log.riskScore === undefined || log.riskScore < filter.minRiskScore)) return false;
      if (filter.maxRiskScore !== undefined &&
          (log.riskScore === undefined || log.riskScore > filter.maxRiskScore)) return false;

      return true;
    });
  }

  /**
   * 获取可搜索文本
   */
  private getSearchableText(log: AuditLogEntry): string {
    const parts: string[] = [
      log.id,
      log.traceId || '',
      log.action,
      log.category,
      log.status,
      log.severity,
      log.description,
      log.details || '',
      log.actor.id,
      log.actor.userId || '',
      log.actor.walletId || '',
      log.actor.address ? String(log.actor.address) : '',
      log.actor.ip || '',
      log.chainId || '',
      log.txHash || '',
    ];

    if (log.target) {
      parts.push(log.target.id || '');
      parts.push(log.target.walletId || '');
      parts.push(log.target.address ? String(log.target.address) : '');
    }

    if (log.metadata) {
      for (const value of Object.values(log.metadata)) {
        if (typeof value === 'string' || typeof value === 'number') {
          parts.push(String(value));
        }
      }
    }

    return parts.join(' ').toLowerCase();
  }

  /**
   * 排序日志
   */
  private sortLogs(
    logs: AuditLogEntry[],
    sortField: string,
    sortOrder: 'asc' | 'desc'
  ): AuditLogEntry[] {
    return [...logs].sort((a, b) => {
      let aValue: unknown;
      let bValue: unknown;

      switch (sortField) {
        case 'timestamp':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        case 'action':
          aValue = a.action;
          bValue = b.action;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'severity':
          aValue = this.severityToNumber(a.severity);
          bValue = this.severityToNumber(b.severity);
          break;
        case 'riskScore':
          aValue = a.riskScore || 0;
          bValue = b.riskScore || 0;
          break;
        default:
          aValue = (a as unknown as Record<string, unknown>)[sortField];
          bValue = (b as unknown as Record<string, unknown>)[sortField];
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue || '');
      const bStr = String(bValue || '');

      return sortOrder === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }

  /**
   * 严重级别转数值
   */
  private severityToNumber(severity: AuditSeverity): number {
    switch (severity) {
      case AuditSeverity.CRITICAL: return 4;
      case AuditSeverity.HIGH: return 3;
      case AuditSeverity.MEDIUM: return 2;
      case AuditSeverity.LOW: return 1;
      case AuditSeverity.INFO: return 0;
      default: return 0;
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(
    filter: AuditQueryFilter,
    page: number,
    pageSize?: number,
    sortField?: string,
    sortOrder?: string
  ): string {
    return JSON.stringify({ filter, page, pageSize, sortField, sortOrder });
  }

  // ========================================================================
  // 高级搜索方法
  // ========================================================================

  /**
   * 高级搜索
   */
  advancedSearch(query: AdvancedSearchQuery): QueryResult {
    const { conditions, operator, sort, page = 1, pageSize } = query;

    const effectivePageSize = Math.min(pageSize || this.config.defaultPageSize, this.config.maxPageSize);

    let filtered = this.logs.filter((log) => {
      const results = conditions.map((condition) =>
        this.evaluateCondition(log, condition)
      );

      if (operator === 'AND') {
        return results.every(Boolean);
      } else {
        return results.some(Boolean);
      }
    });

    if (sort) {
      filtered = this.sortLogs(filtered, sort.field, sort.order);
    } else {
      filtered = this.sortLogs(filtered, 'timestamp', 'desc');
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / effectivePageSize);
    const start = (page - 1) * effectivePageSize;
    const end = start + effectivePageSize;

    return {
      data: filtered.slice(start, end),
      total,
      page,
      pageSize: effectivePageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      queryTime: Date.now(),
    };
  }

  /**
   * 评估条件
   */
  private evaluateCondition(log: AuditLogEntry, condition: AdvancedSearchCondition): boolean {
    const value = this.getNestedValue(log as unknown as Record<string, unknown>, condition.field);
    const target = condition.value;

    switch (condition.operator) {
      case 'equals':
        return value === target;
      case 'not_equals':
        return value !== target;
      case 'contains':
        return String(value || '').toLowerCase().includes(String(target).toLowerCase());
      case 'starts_with':
        return String(value || '').toLowerCase().startsWith(String(target).toLowerCase());
      case 'ends_with':
        return String(value || '').toLowerCase().endsWith(String(target).toLowerCase());
      case 'greater_than':
        return Number(value) > Number(target);
      case 'less_than':
        return Number(value) < Number(target);
      case 'greater_equal':
        return Number(value) >= Number(target);
      case 'less_equal':
        return Number(value) <= Number(target);
      case 'in':
        return Array.isArray(target) && target.includes(value);
      case 'not_in':
        return Array.isArray(target) && !target.includes(value);
      case 'between':
        if (!Array.isArray(target) || target.length !== 2) return false;
        return Number(value) >= Number(target[0]) && Number(value) <= Number(target[1]);
      case 'exists':
        return value !== undefined && value !== null;
      case 'regex':
        try {
          const regex = new RegExp(String(target), condition.caseSensitive ? '' : 'i');
          return regex.test(String(value || ''));
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  /**
   * 获取嵌套值
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  // ========================================================================
  // 聚合查询方法
  // ========================================================================

  /**
   * 按字段聚合
   */
  aggregate(
    field: string,
    filter: AuditQueryFilter = {}
  ): AggregationResult {
    const filtered = this.applyFilter(this.logs, filter);

    const bucketsMap = new Map<string, number>();

    for (const log of filtered) {
      const value = String(this.getNestedValue(log as unknown as Record<string, unknown>, field) || 'unknown');
      bucketsMap.set(value, (bucketsMap.get(value) || 0) + 1);
    }

    const buckets = Array.from(bucketsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({
        key,
        count,
        percentage: filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0,
      }));

    return {
      field,
      buckets,
      total: filtered.length,
    };
  }

  /**
   * 时间序列统计
   */
  timeSeries(
    interval: 'hour' | 'day' | 'week' | 'month' = 'day',
    filter: AuditQueryFilter = {}
  ): TimeSeriesResult {
    const filtered = this.applyFilter(this.logs, filter);

    if (filtered.length === 0) {
      return { interval, dataPoints: [], total: 0 };
    }

    const dataPointsMap = new Map<number, number>();

    for (const log of filtered) {
      const bucketTs = this.getBucketTimestamp(log.timestamp, interval);
      dataPointsMap.set(bucketTs, (dataPointsMap.get(bucketTs) || 0) + 1);
    }

    const dataPoints = Array.from(dataPointsMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([timestamp, count]) => ({ timestamp, count }));

    return {
      interval,
      dataPoints,
      total: filtered.length,
    };
  }

  /**
   * 获取时间桶时间戳
   */
  private getBucketTimestamp(timestamp: number, interval: string): number {
    const date = new Date(timestamp);

    switch (interval) {
      case 'hour':
        date.setMinutes(0, 0, 0);
        break;
      case 'day':
        date.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const day = date.getDay() || 7;
        date.setDate(date.getDate() - day + 1);
        date.setHours(0, 0, 0, 0);
        break;
      case 'month':
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        break;
    }

    return date.getTime();
  }

  // ========================================================================
  // 统计分析方法
  // ========================================================================

  /**
   * 获取统计信息
   */
  getStatistics(filter: AuditQueryFilter = {}): AuditStatistics {
    const filtered = this.applyFilter(this.logs, filter);

    const byCategory: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let errors = 0;
    let warnings = 0;
    let highRiskCount = 0;
    let totalDuration = 0;
    let durationCount = 0;

    for (const log of filtered) {
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byStatus[log.status] = (byStatus[log.status] || 0) + 1;
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;

      if (log.status === 'failed') errors++;
      if (log.severity === AuditSeverity.WARNING || log.severity === AuditSeverity.HIGH) warnings++;
      if (log.riskScore && log.riskScore >= 70) highRiskCount++;

      if (log.duration !== undefined) {
        totalDuration += log.duration;
        durationCount++;
      }
    }

    const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

    return {
      totalLogs: filtered.length,
      totalCount: filtered.length,
      byCategory: byCategory as Record<AuditCategory, number>,
      byAction: byAction as Record<AuditAction, number>,
      byStatus: byStatus as Record<AuditStatus, number>,
      bySeverity: bySeverity as Record<AuditSeverity, number>,
      byDate: {},
      errors,
      failedCount: errors,
      warnings,
      highRiskCount,
      uniqueUsers: 0,
      uniqueWallets: 0,
      totalTransactions: 0,
      averageDuration: avgDuration,
      timeRange: filtered.length > 0
        ? {
          start: filtered[filtered.length - 1].timestamp,
          end: filtered[0].timestamp,
        }
        : undefined,
    };
  }

  // ========================================================================
  // 数据导出方法
  // ========================================================================

  /**
   * 导出数据
   */
  exportData(filter: AuditQueryFilter, config: ExportConfig): string {
    const filtered = this.applyFilter(this.logs, filter);

    switch (config.format) {
      case 'json':
        return this.exportAsJson(filtered, config.fields);
      case 'csv':
        return this.exportAsCsv(filtered, config.fields, config.includeHeaders);
      case 'xlsx':
        return this.exportAsCsv(filtered, config.fields, config.includeHeaders);
      default:
        throw new Error(`不支持的导出格式: ${config.format}`);
    }
  }

  /**
   * 导出为 JSON
   */
  private exportAsJson(logs: AuditLogEntry[], fields?: string[]): string {
    if (fields && fields.length > 0) {
      const filtered = logs.map((log) => {
        const result: Record<string, unknown> = {};
        for (const field of fields) {
          result[field] = this.getNestedValue(log as unknown as Record<string, unknown>, field);
        }
        return result;
      });
      return JSON.stringify(filtered, null, 2);
    }
    return JSON.stringify(logs, null, 2);
  }

  /**
   * 导出为 CSV
   */
  private exportAsCsv(
    logs: AuditLogEntry[],
    fields?: string[],
    includeHeaders: boolean = true
  ): string {
    const defaultFields = [
      'id', 'timestamp', 'action', 'category', 'status', 'severity',
      'actor.userId', 'actor.walletId', 'description',
    ];

    const exportFields = fields && fields.length > 0 ? fields : defaultFields;

    const lines: string[] = [];

    if (includeHeaders) {
      lines.push(exportFields.map((f) => `"${f}"`).join(','));
    }

    for (const log of logs) {
      const values = exportFields.map((field) => {
        const value = this.getNestedValue(log as unknown as Record<string, unknown>, field);
        const str = String(value || '').replace(/"/g, '""');
        return `"${str}"`;
      });
      lines.push(values.join(','));
    }

    return lines.join('\n');
  }

  // ========================================================================
  // 全文搜索方法
  // ========================================================================

  /**
   * 全文搜索
   */
  fullTextSearch(
    query: string,
    filter: AuditQueryFilter = {},
    page: number = 1,
    pageSize?: number
  ): QueryResult {
    if (!this.config.enableFullTextSearch) {
      throw new Error('全文搜索未启用');
    }

    const extendedFilter = { ...filter, keyword: query };
    return this.query(extendedFilter, page, pageSize);
  }

  // ========================================================================
  // 实用方法
  // ========================================================================

  /**
   * 获取所有日志数量
   */
  getTotalCount(): number {
    return this.logs.length;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * 清除所有数据
   */
  clear(): void {
    this.logs = [];
    this.index.clear();
    this.categoryIndex.clear();
    this.actionIndex.clear();
    this.statusIndex.clear();
    this.severityIndex.clear();
    this.userIdIndex.clear();
    this.walletIdIndex.clear();
    this.queryCache.clear();
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default AuditQueryService;
