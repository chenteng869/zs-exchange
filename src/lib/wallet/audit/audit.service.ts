/**
 * 审计主服务 (AuditService)
 *
 * 功能：
 *  - 统一审计入口
 *  - 审计日志记录
 *  - 证据链管理
 *  - 报表生成调度
 *  - 数据留存管理
 *  - 审计查询入口
 *  - 系统健康检查
 *  - 配置管理
 */

import {
  AuditLogEntry,
  AuditAction,
  AuditCategory,
  AuditStatus,
  AuditSeverity,
  AuditActor,
  AuditTarget,
  AuditLogMetadata,
  AuditQueryFilter,
  AuditStatistics,
  ComplianceReport,
  ReportType,
  ReportFormat,
  EvidenceChainBlock,
} from './audit.types';

import { AuditLogger } from './audit-logger/audit-logger';
import { EvidenceChain } from './evidence-chain/evidence-chain';
import { ComplianceReportService } from './compliance/compliance-report.service';
import { RetentionManager } from './retention-manager';
import { AuditQueryService } from './audit-query.service';

// ============================================================================
// 审计服务配置接口
// ============================================================================

export interface AuditServiceConfig {
  enabled?: boolean;
  logLevel?: AuditSeverity;
  enableEvidenceChain?: boolean;
  enableComplianceReporting?: boolean;
  enableRetentionManagement?: boolean;
  batchSize?: number;
  flushInterval?: number;
  evidenceChainBlockSize?: number;
  evidenceChainAnchorInterval?: number;
}

// ============================================================================
// 审计服务状态接口
// ============================================================================

export interface AuditServiceStatus {
  isRunning: boolean;
  isHealthy: boolean;
  uptime: number;
  stats: {
    totalLogs: number;
    logsToday: number;
    totalReports: number;
    evidenceBlocks: number;
    lastFlush?: number;
    lastAnchor?: number;
  };
  components: {
    logger: 'running' | 'stopped' | 'error';
    evidenceChain: 'running' | 'stopped' | 'error';
    compliance: 'running' | 'stopped' | 'error';
    retention: 'running' | 'stopped' | 'error';
    query: 'running' | 'stopped' | 'error';
  };
}

// ============================================================================
// 审计操作选项接口
// ============================================================================

export interface AuditOperationOptions {
  traceId?: string;
  category?: AuditCategory;
  severity?: AuditSeverity;
  chainId?: string;
  txHash?: string;
  blockNumber?: number;
  riskScore?: number;
  duration?: number;
  metadata?: AuditLogMetadata;
  details?: string;
  target?: AuditTarget;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

// ============================================================================
// 审计服务类
// ============================================================================

export class AuditService {
  private config: Required<AuditServiceConfig>;
  private logger: AuditLogger;
  private evidenceChain: EvidenceChain;
  private reportService: ComplianceReportService;
  private retentionManager: RetentionManager;
  private queryService: AuditQueryService;
  private isRunning = false;
  private startTime = 0;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private anchorTimer: ReturnType<typeof setInterval> | null = null;
  private onLogCallbacks: Array<(log: AuditLogEntry) => void> = [];
  private onErrorCallbacks: Array<(error: Error) => void> = [];

  // ========================================================================
  // 构造函数
  // ========================================================================

  constructor(config?: AuditServiceConfig) {
    this.config = {
      enabled: true,
      logLevel: AuditSeverity.INFO,
      enableEvidenceChain: true,
      enableComplianceReporting: true,
      enableRetentionManagement: true,
      batchSize: 100,
      flushInterval: 5000,
      evidenceChainBlockSize: 50,
      evidenceChainAnchorInterval: 3600000,
      ...config,
    };

    this.logger = new AuditLogger({
      batchSize: this.config.batchSize,
    });

    this.evidenceChain = new EvidenceChain({
      blockSize: this.config.evidenceChainBlockSize,
    });

    this.reportService = new ComplianceReportService();

    this.retentionManager = new RetentionManager();

    this.queryService = new AuditQueryService();
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 启动审计服务
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = Date.now();

    this.startFlushTimer();

    if (this.config.enableEvidenceChain) {
      this.startAnchorTimer();
    }

    if (this.config.enableRetentionManagement) {
      this.retentionManager.startAutoManagement();
    }

    this.recordServiceStart();
  }

  /**
   * 停止审计服务
   */
  stop(): void {
    if (!this.isRunning) return;

    this.flush();

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.anchorTimer) {
      clearInterval(this.anchorTimer);
      this.anchorTimer = null;
    }

    if (this.config.enableRetentionManagement) {
      this.retentionManager.stopAutoManagement();
    }

    this.recordServiceStop();

    this.isRunning = false;
  }

  /**
   * 启动刷新定时器
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * 启动锚定定时器
   */
  private startAnchorTimer(): void {
    this.anchorTimer = setInterval(() => {
      this.anchorEvidenceChain();
    }, this.config.evidenceChainAnchorInterval);
  }

  /**
   * 记录服务启动
   */
  private recordServiceStart(): void {
    this.logInternal(
      AuditAction.SYSTEM_START,
      AuditCategory.SYSTEM,
      '审计系统启动',
      {
        severity: AuditSeverity.INFO,
        metadata: {
          config: JSON.stringify(this.config),
        },
      }
    );
  }

  /**
   * 记录服务停止
   */
  private recordServiceStop(): void {
    this.logInternal(
      AuditAction.SYSTEM_STOP,
      AuditCategory.SYSTEM,
      '审计系统停止',
      {
        severity: AuditSeverity.INFO,
        metadata: {
          uptime: Date.now() - this.startTime,
        },
      }
    );
  }

  // ========================================================================
  // 审计日志方法
  // ========================================================================

  /**
   * 记录审计日志
   */
  log(
    action: AuditAction,
    category: AuditCategory,
    description: string,
    actor: AuditActor,
    options: AuditOperationOptions = {}
  ): AuditLogEntry | null {
    if (!this.config.enabled) return null;

    if (this.severityToNumber(options.severity || AuditSeverity.INFO) <
        this.severityToNumber(this.config.logLevel)) {
      return null;
    }

    const logEntry = this.buildLogEntry(action, category, description, actor, options);

    this.logger.log(logEntry);
    this.queryService.addLog(logEntry);

    if (this.config.enableEvidenceChain) {
      this.evidenceChain.addAuditLog(logEntry);
    }

    if (this.config.enableRetentionManagement) {
      this.retentionManager.classifyAuditLog(logEntry);
    }

    for (const callback of this.onLogCallbacks) {
      callback(logEntry);
    }

    return logEntry;
  }

  /**
   * 内部日志记录（不触发外部回调）
   */
  private logInternal(
    action: AuditAction,
    category: AuditCategory,
    description: string,
    options: AuditOperationOptions = {}
  ): AuditLogEntry {
    const actor: AuditActor = {
      id: 'audit_system',
      type: 'system',
    };

    const logEntry = this.buildLogEntry(action, category, description, actor, options);

    this.logger.log(logEntry);
    this.queryService.addLog(logEntry);

    return logEntry;
  }

  /**
   * 构建审计日志条目
   */
  private buildLogEntry(
    action: AuditAction,
    category: AuditCategory,
    description: string,
    actor: AuditActor,
    options: AuditOperationOptions
  ): AuditLogEntry {
    const now = Date.now();

    return {
      id: this.generateId(),
      traceId: options.traceId || this.generateTraceId(),
      timestamp: now,
      action,
      category,
      status: AuditStatus.COMPLETED,
      severity: options.severity || AuditSeverity.INFO,
      actor,
      target: options.target,
      description,
      details: options.details,
      metadata: options.metadata || {},
      chainId: options.chainId,
      txHash: options.txHash,
      blockNumber: options.blockNumber,
      riskScore: options.riskScore,
      duration: options.duration,
      requestId: options.requestId,
      ip: options.ip,
      userAgent: options.userAgent,
      indexedFields: ['action', 'category', 'status', 'severity', 'timestamp'],
    };
  }

  // ========================================================================
  // 快捷审计方法
  // ========================================================================

  /**
   * 记录钱包操作
   */
  logWalletOperation(
    action: AuditAction,
    description: string,
    actor: AuditActor,
    options: AuditOperationOptions = {}
  ): AuditLogEntry | null {
    return this.log(action, AuditCategory.WALLET, description, actor, {
      ...options,
      category: AuditCategory.WALLET,
    });
  }

  /**
   * 记录交易操作
   */
  logTransactionOperation(
    action: AuditAction,
    description: string,
    actor: AuditActor,
    options: AuditOperationOptions = {}
  ): AuditLogEntry | null {
    return this.log(action, AuditCategory.TRANSACTION, description, actor, {
      ...options,
      category: AuditCategory.TRANSACTION,
    });
  }

  /**
   * 记录签名操作
   */
  logSignatureOperation(
    action: AuditAction,
    description: string,
    actor: AuditActor,
    options: AuditOperationOptions = {}
  ): AuditLogEntry | null {
    return this.log(action, AuditCategory.SIGNATURE, description, actor, {
      ...options,
      category: AuditCategory.SIGNATURE,
    });
  }

  /**
   * 记录安全事件
   */
  logSecurityEvent(
    action: AuditAction,
    description: string,
    actor: AuditActor,
    severity: AuditSeverity = AuditSeverity.HIGH,
    options: AuditOperationOptions = {}
  ): AuditLogEntry | null {
    return this.log(action, AuditCategory.SECURITY, description, actor, {
      ...options,
      category: AuditCategory.SECURITY,
      severity,
    });
  }

  /**
   * 记录权限变更
   */
  logPermissionChange(
    action: AuditAction,
    description: string,
    actor: AuditActor,
    options: AuditOperationOptions = {}
  ): AuditLogEntry | null {
    return this.log(action, AuditCategory.PERMISSION, description, actor, {
      ...options,
      category: AuditCategory.PERMISSION,
      severity: AuditSeverity.MEDIUM,
    });
  }

  // ========================================================================
  // 证据链方法
  // ========================================================================

  /**
   * 手动刷新
   */
  flush(): void {
    void this.logger.flush();
  }

  /**
   * 锚定证据链到区块链
   */
  async anchorEvidenceChain(): Promise<string | null> {
    if (!this.config.enableEvidenceChain) return null;

    try {
      const result = await this.evidenceChain.anchorLatestBlock();
      return result.txHash ?? null;
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * 验证证据链完整性
   */
  async verifyEvidenceChain(): Promise<boolean> {
    if (!this.config.enableEvidenceChain) return true;
    const result = await this.evidenceChain.verifyChain();
    return result.valid;
  }

  /**
   * 获取证据链区块
   */
  getEvidenceBlocks(): EvidenceChainBlock[] {
    return this.evidenceChain.getAllBlocks();
  }

  // ========================================================================
  // 报表方法
  // ========================================================================

  /**
   * 生成报表
   */
  async generateReport(
    reportType: ReportType,
    format: ReportFormat = ReportFormat.JSON,
    filter?: AuditQueryFilter
  ): Promise<ComplianceReport> {
    const logs = this.queryService.query(filter || {}).data;
    return this.reportService.generateReport(reportType, logs, format);
  }

  /**
   * 生成日汇总报表
   */
  async generateDailyReport(date?: Date): Promise<ComplianceReport> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const filter: AuditQueryFilter = {
      startTime: startOfDay.getTime(),
      endTime: endOfDay.getTime(),
    };

    return this.generateReport(ReportType.DAILY_SUMMARY, ReportFormat.JSON, filter);
  }

  /**
   * 获取报表服务
   */
  getReportService(): ComplianceReportService {
    return this.reportService;
  }

  // ========================================================================
  // 查询方法
  // ========================================================================

  /**
   * 查询审计日志
   */
  queryLogs(
    filter: AuditQueryFilter = {},
    page?: number,
    pageSize?: number,
    sortField?: string,
    sortOrder?: 'asc' | 'desc'
  ) {
    return this.queryService.query(filter, page, pageSize, sortField, sortOrder);
  }

  /**
   * 获取审计统计
   */
  getStatistics(filter: AuditQueryFilter = {}): AuditStatistics {
    return this.queryService.getStatistics(filter);
  }

  /**
   * 获取查询服务
   */
  getQueryService(): AuditQueryService {
    return this.queryService;
  }

  // ========================================================================
  // 留存管理方法
  // ========================================================================

  /**
   * 获取留存管理器
   */
  getRetentionManager(): RetentionManager {
    return this.retentionManager;
  }

  /**
   * 执行合规检查
   */
  performComplianceCheck() {
    return this.retentionManager.performComplianceCheck();
  }

  // ========================================================================
  // 状态和健康检查方法
  // ========================================================================

  /**
   * 获取服务状态
   */
  getStatus(): AuditServiceStatus {
    const stats = this.queryService.getStatistics();
    const reportStats = this.reportService.getStatistics();
    const blocks = this.evidenceChain.getAllBlocks();

    return {
      isRunning: this.isRunning,
      isHealthy: this.isRunning,
      uptime: this.isRunning ? Date.now() - this.startTime : 0,
      stats: {
        totalLogs: stats.totalLogs || stats.totalCount || 0,
        logsToday: this.getLogsToday(),
        totalReports: reportStats.totalReports,
        evidenceBlocks: blocks.length,
      },
      components: {
        logger: this.isRunning ? 'running' : 'stopped',
        evidenceChain: this.config.enableEvidenceChain ? 'running' : 'stopped',
        compliance: this.config.enableComplianceReporting ? 'running' : 'stopped',
        retention: this.config.enableRetentionManagement ? 'running' : 'stopped',
        query: 'running',
      },
    };
  }

  /**
   * 获取今日日志数
   */
  private getLogsToday(): number {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.queryService.query({
      startTime: startOfDay.getTime(),
    }).total;
  }

  /**
   * 健康检查
   */
  healthCheck(): { healthy: boolean; details: Record<string, unknown> } {
    const details: Record<string, unknown> = {
      serviceRunning: this.isRunning,
      loggerHealthy: true,
      queryHealthy: true,
    };

    if (this.config.enableEvidenceChain) {
      details.evidenceChainHealthy = this.evidenceChain.verifyChain();
    }

    const healthy = this.isRunning && Object.values(details).every((v) => v !== false);

    return { healthy, details };
  }

  // ========================================================================
  // 事件回调方法
  // ========================================================================

  /**
   * 注册日志回调
   */
  onLog(callback: (log: AuditLogEntry) => void): void {
    this.onLogCallbacks.push(callback);
  }

  /**
   * 注册错误回调
   */
  onError(callback: (error: Error) => void): void {
    this.onErrorCallbacks.push(callback);
  }

  /**
   * 处理错误
   */
  private handleError(error: Error): void {
    for (const callback of this.onErrorCallbacks) {
      callback(error);
    }
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 生成 ID
   */
  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `audit_${timestamp}_${random}`;
  }

  /**
   * 生成 Trace ID
   */
  private generateTraceId(): string {
    const timestamp = Date.now().toString(36);
    const random1 = Math.random().toString(36).slice(2, 8);
    const random2 = Math.random().toString(36).slice(2, 8);
    return `trace_${timestamp}_${random1}_${random2}`;
  }

  /**
   * 严重级别转数值
   */
  private severityToNumber(severity: AuditSeverity): number {
    switch (severity) {
      case AuditSeverity.CRITICAL: return 5;
      case AuditSeverity.HIGH: return 4;
      case AuditSeverity.MEDIUM: return 3;
      case AuditSeverity.LOW: return 2;
      case AuditSeverity.INFO: return 1;
      case AuditSeverity.DEBUG: return 0;
      default: return 1;
    }
  }

  /**
   * 获取审计日志记录器
   */
  getLogger(): AuditLogger {
    return this.logger;
  }

  /**
   * 获取证据链
   */
  getEvidenceChain(): EvidenceChain {
    return this.evidenceChain;
  }

  // ========================================================================
  // 清理方法
  // ========================================================================

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stop();
    this.onLogCallbacks = [];
    this.onErrorCallbacks = [];
    this.queryService.clear();
    this.retentionManager.destroy();
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default AuditService;
