/**
 * 审计日志主类 (AuditLogger)
 *
 * 功能：
 *  - 操作审计：记录所有用户操作和系统操作
 *  - 交易审计：记录所有交易相关操作
 *  - 签名审计：记录所有签名操作
 *  - 权限变更审计：记录权限和角色变更
 *  - 批量日志处理
 *  - 日志过滤和查询
 *  - 日志导出
 *  - 审计追踪链路
 */

import {
  AuditAction,
  AuditStatus,
  AuditSeverity,
  AuditCategory,
  AuditLogEntry,
  AuditActor,
  AuditTarget,
  AuditLogMetadata,
  AuditQueryFilter,
  AuditStatistics,
  AuditSystemConfig,
  DEFAULT_AUDIT_CONFIG,
  RetentionClass,
  DataSensitivity,
  AuditErrorCode,
  AuditError,
} from '../audit.types';

// ============================================================================
// 审计日志配置接口
// ============================================================================

export interface AuditLoggerConfig {
  maxLogEntries?: number;
  enableBatchProcessing?: boolean;
  batchSize?: number;
  flushIntervalMs?: number;
  defaultSeverity?: AuditSeverity;
  defaultCategory?: AuditCategory;
  sensitiveFields?: string[];
  enableTraceId?: boolean;
  enableDurationTracking?: boolean;
  onLogEntry?: (entry: AuditLogEntry) => void;
  onError?: (error: AuditError) => void;
}

// ============================================================================
// 审计日志记录选项
// ============================================================================

export interface LogEntryOptions {
  action: AuditAction;
  category?: AuditCategory;
  status?: AuditStatus;
  severity?: AuditSeverity;
  actor: Partial<AuditActor> & Pick<AuditActor, 'type'>;
  target?: Partial<AuditTarget>;
  description: string;
  metadata?: AuditLogMetadata;
  relatedLogIds?: string[];
  riskScore?: number;
  riskFactors?: string[];
  durationMs?: number;
  errorCode?: string;
  errorMessage?: string;
  requestId?: string;
  sessionId?: string;
  traceId?: string;
  chainId?: string;
  txHash?: string;
  blockNumber?: number;
  retentionClass?: RetentionClass;
}

// ============================================================================
// 活动审计追踪器
// ============================================================================

interface ActiveTrace {
  traceId: string;
  spanId: string;
  startTime: number;
  action: AuditAction;
  metadata: AuditLogMetadata;
}

// ============================================================================
// 审计日志主类
// ============================================================================

export class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private config: Required<AuditSystemConfig>;
  private loggerConfig: AuditLoggerConfig;
  private activeTraces: Map<string, ActiveTrace> = new Map();
  private batchBuffer: AuditLogEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private logCounter = 0;
  private isInitialized = false;
  private onLogEntryCallback?: (entry: AuditLogEntry) => void;
  private onErrorCallback?: (error: AuditError) => void;

  // ========================================================================
  // 构造函数
  // ========================================================================

  constructor(config?: Partial<AuditSystemConfig>, loggerConfig?: AuditLoggerConfig) {
    this.config = { ...DEFAULT_AUDIT_CONFIG, ...config } as Required<AuditSystemConfig>;
    this.loggerConfig = {
      maxLogEntries: this.config.maxLogEntries,
      enableBatchProcessing: this.config.asyncLogging,
      batchSize: this.config.batchSize,
      flushIntervalMs: this.config.flushIntervalMs,
      defaultSeverity: AuditSeverity.MEDIUM,
      defaultCategory: AuditCategory.CUSTOM,
      sensitiveFields: this.config.sensitiveFields,
      enableTraceId: true,
      enableDurationTracking: true,
      ...loggerConfig,
    };

    this.onLogEntryCallback = loggerConfig?.onLogEntry;
    this.onErrorCallback = loggerConfig?.onError;

    this.initialize();
  }

  // ========================================================================
  // 初始化
  // ========================================================================

  private initialize(): void {
    if (this.isInitialized) return;

    if (this.loggerConfig.enableBatchProcessing) {
      this.startFlushTimer();
    }

    this.isInitialized = true;
  }

  private startFlushTimer(): void {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => {
      this.flushBatch().catch((err) => {
        this.handleError(new AuditError(
          AuditErrorCode.LOG_FAILED,
          '批量刷入失败',
          { error: err instanceof Error ? err.message : String(err) }
        ));
      });
    }, this.loggerConfig.flushIntervalMs);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  // ========================================================================
  // 核心日志记录方法
  // ========================================================================

  /**
   * 记录审计日志
   */
  log(options: LogEntryOptions): AuditLogEntry {
    const entry = this.createLogEntry(options);

    if (this.loggerConfig.enableBatchProcessing) {
      this.batchBuffer.push(entry);
      if (this.batchBuffer.length >= this.loggerConfig.batchSize) {
        this.flushBatch().catch(() => {});
      }
    } else {
      this.addLogEntry(entry);
    }

    if (this.onLogEntryCallback) {
      try {
        this.onLogEntryCallback(entry);
      } catch (err) {
        this.handleError(new AuditError(
          AuditErrorCode.LOG_FAILED,
          '日志回调执行失败',
          { error: err instanceof Error ? err.message : String(err) }
        ));
      }
    }

    return entry;
  }

  /**
   * 创建审计日志条目
   */
  private createLogEntry(options: LogEntryOptions): AuditLogEntry {
    const id = this.generateId('audit');
    const timestamp = Date.now();
    const traceId = options.traceId || this.generateTraceId();
    const spanId = this.generateSpanId();

    const category = options.category || this.getCategoryByAction(options.action);
    const severity = options.severity || this.loggerConfig.defaultSeverity;
    const status = options.status || AuditStatus.COMPLETED;

    const sanitizedMetadata = this.sanitizeMetadata(options.metadata || {});

    const entry: AuditLogEntry = {
      id,
      traceId,
      spanId,
      timestamp,
      action: options.action,
      category,
      status,
      severity,
      actor: this.buildActor(options.actor),
      target: options.target ? this.buildTarget(options.target) : undefined,
      description: options.description,
      metadata: sanitizedMetadata,
      relatedLogIds: options.relatedLogIds || [],
      riskScore: options.riskScore,
      riskFactors: options.riskFactors,
      durationMs: options.durationMs,
      errorCode: options.errorCode,
      errorMessage: options.errorMessage,
      requestId: options.requestId,
      sessionId: options.sessionId,
      chainId: options.chainId,
      txHash: options.txHash,
      blockNumber: options.blockNumber,
      indexedFields: this.buildIndexedFields(options),
      retentionClass: options.retentionClass || this.config.defaultRetentionClass,
      isArchived: false,
    };

    return entry;
  }

  /**
   * 添加日志条目到存储
   */
  private addLogEntry(entry: AuditLogEntry): void {
    this.logs.unshift(entry);
    this.logCounter++;

    if (this.logs.length > this.loggerConfig.maxLogEntries) {
      this.logs = this.logs.slice(0, this.loggerConfig.maxLogEntries);
    }
  }

  /**
   * 公共刷新方法，将 batch buffer 中的条目刷入存储
   */
  async flush(): Promise<number> {
    return this.flushBatch();
  }

  /**
   * 批量刷入
   */
  async flushBatch(): Promise<number> {
    if (this.batchBuffer.length === 0) return 0;

    const entries = [...this.batchBuffer];
    this.batchBuffer = [];

    for (const entry of entries) {
      this.addLogEntry(entry);
    }

    return entries.length;
  }

  // ========================================================================
  // 操作审计方法
  // ========================================================================

  /**
   * 记录钱包操作
   */
  logWalletOperation(
    action: AuditAction,
    walletId: string,
    userId: string,
    description: string,
    metadata?: AuditLogMetadata,
    status: AuditStatus = AuditStatus.COMPLETED,
    severity?: AuditSeverity
  ): AuditLogEntry {
    return this.log({
      action,
      category: AuditCategory.WALLET,
      status,
      severity: severity || this.getSeverityByAction(action),
      actor: { type: 'user', userId, walletId },
      target: { type: 'wallet', id: walletId },
      description,
      metadata,
    });
  }

  /**
   * 记录交易操作
   */
  logTransactionOperation(
    action: AuditAction,
    walletId: string,
    userId: string,
    txHash: string,
    chainId: string,
    description: string,
    metadata?: AuditLogMetadata,
    status: AuditStatus = AuditStatus.COMPLETED,
    severity?: AuditSeverity
  ): AuditLogEntry {
    return this.log({
      action,
      category: AuditCategory.TRANSACTION,
      status,
      severity: severity || AuditSeverity.MEDIUM,
      actor: { type: 'user', userId, walletId },
      target: { type: 'transaction', id: txHash, chainId },
      description,
      metadata,
      txHash,
      chainId,
    });
  }

  /**
   * 记录签名操作
   */
  logSignatureOperation(
    action: AuditAction,
    walletId: string,
    userId: string,
    signerAddress: string,
    description: string,
    metadata?: AuditLogMetadata,
    status: AuditStatus = AuditStatus.COMPLETED,
    severity?: AuditSeverity
  ): AuditLogEntry {
    return this.log({
      action,
      category: AuditCategory.SIGNATURE,
      status,
      severity: severity || AuditSeverity.HIGH,
      actor: { type: 'user', userId, walletId, address: signerAddress },
      target: { type: 'wallet', id: walletId, address: signerAddress },
      description,
      metadata,
    });
  }

  /**
   * 记录权限变更
   */
  logPermissionChange(
    action: AuditAction,
    userId: string,
    targetUserId: string,
    description: string,
    metadata?: AuditLogMetadata,
    severity: AuditSeverity = AuditSeverity.HIGH
  ): AuditLogEntry {
    return this.log({
      action,
      category: AuditCategory.PERMISSION,
      status: AuditStatus.COMPLETED,
      severity,
      actor: { type: 'admin', userId },
      target: { type: 'account', id: targetUserId },
      description,
      metadata,
    });
  }

  /**
   * 记录 DApp 操作
   */
  logDAppOperation(
    action: AuditAction,
    walletId: string,
    userId: string,
    dappUrl: string,
    dappName: string,
    description: string,
    metadata?: AuditLogMetadata,
    status: AuditStatus = AuditStatus.COMPLETED
  ): AuditLogEntry {
    return this.log({
      action,
      category: AuditCategory.DAPP,
      status,
      severity: this.getSeverityByAction(action),
      actor: { type: 'dapp', userId, walletId, dappUrl, dappName },
      target: { type: 'dapp', name: dappName },
      description,
      metadata,
    });
  }

  /**
   * 记录安全事件
   */
  logSecurityEvent(
    action: AuditAction,
    description: string,
    severity: AuditSeverity = AuditSeverity.HIGH,
    metadata?: AuditLogMetadata,
    actor?: Partial<AuditActor>
  ): AuditLogEntry {
    return this.log({
      action,
      category: AuditCategory.SECURITY,
      status: AuditStatus.COMPLETED,
      severity,
      actor: (actor || { type: 'system' }) as Partial<AuditActor> & Pick<AuditActor, 'type'>,
      description,
      metadata,
    });
  }

  /**
   * 记录认证操作
   */
  logAuthentication(
    action: AuditAction,
    userId: string | undefined,
    description: string,
    status: AuditStatus = AuditStatus.COMPLETED,
    metadata?: AuditLogMetadata,
    ipAddress?: string,
    deviceId?: string
  ): AuditLogEntry {
    const severity = status === AuditStatus.FAILED ? AuditSeverity.HIGH : AuditSeverity.LOW;

    return this.log({
      action,
      category: AuditCategory.AUTHENTICATION,
      status,
      severity,
      actor: { type: 'user', userId, ipAddress, deviceId },
      description,
      metadata,
    });
  }

  // ========================================================================
  // 审计追踪方法
  // ========================================================================

  /**
   * 开始追踪
   */
  startTrace(
    action: AuditAction,
    actor: Partial<AuditActor> & Pick<AuditActor, 'type'>,
    description: string,
    metadata?: AuditLogMetadata
  ): string {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();

    const trace: ActiveTrace = {
      traceId,
      spanId,
      startTime: Date.now(),
      action,
      metadata: metadata || {},
    };

    this.activeTraces.set(traceId, trace);

    return traceId;
  }

  /**
   * 结束追踪并记录日志
   */
  endTrace(
    traceId: string,
    options: {
      status?: AuditStatus;
      severity?: AuditSeverity;
      description?: string;
      metadata?: AuditLogMetadata;
      errorCode?: string;
      errorMessage?: string;
      target?: Partial<AuditTarget>;
    } = {}
  ): AuditLogEntry | null {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return null;

    const durationMs = Date.now() - trace.startTime;
    const status = options.status || AuditStatus.COMPLETED;

    const entry = this.log({
      action: trace.action,
      status,
      severity: options.severity || this.getSeverityByAction(trace.action),
      actor: { type: 'user' },
      target: options.target,
      description: options.description || '操作完成',
      metadata: { ...trace.metadata, ...options.metadata },
      traceId,
      durationMs,
      errorCode: options.errorCode,
      errorMessage: options.errorMessage,
    });

    this.activeTraces.delete(traceId);

    return entry;
  }

  /**
   * 获取活跃追踪数量
   */
  getActiveTraceCount(): number {
    return this.activeTraces.size;
  }

  // ========================================================================
  // 查询方法
  // ========================================================================

  /**
   * 获取所有日志
   */
  getAllLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  /**
   * 根据 ID 获取日志
   */
  getLogById(id: string): AuditLogEntry | undefined {
    return this.logs.find((log) => log.id === id);
  }

  /**
   * 根据追踪 ID 获取日志
   */
  getLogsByTraceId(traceId: string): AuditLogEntry[] {
    return this.logs.filter((log) => log.traceId === traceId);
  }

  /**
   * 根据钱包 ID 获取日志
   */
  getLogsByWalletId(walletId: string): AuditLogEntry[] {
    return this.logs.filter((log) =>
      log.actor.walletId === walletId || log.target?.walletId === walletId
    );
  }

  /**
   * 根据用户 ID 获取日志
   */
  getLogsByUserId(userId: string): AuditLogEntry[] {
    return this.logs.filter((log) => log.actor.userId === userId);
  }

  /**
   * 根据交易哈希获取日志
   */
  getLogsByTxHash(txHash: string): AuditLogEntry[] {
    return this.logs.filter((log) => log.txHash === txHash);
  }

  // ========================================================================
  // 统计方法
  // ========================================================================

  /**
   * 获取统计信息
   */
  getStatistics(startDate?: number, endDate?: number): AuditStatistics {
    let logs = this.logs;

    if (startDate) {
      logs = logs.filter((l) => l.timestamp >= startDate);
    }
    if (endDate) {
      logs = logs.filter((l) => l.timestamp <= endDate);
    }

    const byCategory = {} as Record<AuditCategory, number>;
    const byAction = {} as Record<AuditAction, number>;
    const bySeverity = {} as Record<AuditSeverity, number>;
    const byStatus = {} as Record<AuditStatus, number>;
    const byDate: Record<string, number> = {};

    const userIds = new Set<string>();
    const walletIds = new Set<string>();
    let highRiskCount = 0;
    let failedCount = 0;
    let totalTransactions = 0;

    for (const log of logs) {
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
      byStatus[log.status] = (byStatus[log.status] || 0) + 1;

      const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
      byDate[dateKey] = (byDate[dateKey] || 0) + 1;

      if (log.actor.userId) userIds.add(log.actor.userId);
      if (log.actor.walletId) walletIds.add(log.actor.walletId);
      if (log.target?.walletId) walletIds.add(log.target.walletId);

      if (log.riskScore && log.riskScore >= 70) highRiskCount++;
      if (log.status === AuditStatus.FAILED) failedCount++;
      if (log.category === AuditCategory.TRANSACTION) totalTransactions++;
    }

    return {
      totalLogs: logs.length,
      byCategory,
      byAction,
      bySeverity,
      byStatus,
      byDate,
      highRiskCount,
      failedCount,
      uniqueUsers: userIds.size,
      uniqueWallets: walletIds.size,
      totalTransactions,
    };
  }

  /**
   * 获取日志总数
   */
  getLogCount(): number {
    return this.logs.length;
  }

  // ========================================================================
  // 导出方法
  // ========================================================================

  /**
   * 导出为 JSON 格式
   */
  exportAsJson(filter?: AuditQueryFilter): string {
    const logs = this.applyFilter(filter || {});
    return JSON.stringify(logs, null, 2);
  }

  /**
   * 导出为 CSV 格式
   */
  exportAsCsv(filter?: AuditQueryFilter): string {
    const logs = this.applyFilter(filter || {});

    const headers = [
      'id',
      'timestamp',
      'action',
      'category',
      'status',
      'severity',
      'actor_type',
      'actor_id',
      'target_type',
      'target_id',
      'description',
      'riskScore',
      'txHash',
      'chainId',
      'durationMs',
    ];

    const escapeCsv = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = logs.map((log) =>
      headers
        .map((header) => {
          switch (header) {
            case 'actor_type':
              return escapeCsv(log.actor.type);
            case 'actor_id':
              return escapeCsv(log.actor.userId || log.actor.id || '');
            case 'target_type':
              return escapeCsv(log.target?.type || '');
            case 'target_id':
              return escapeCsv(log.target?.id || '');
            default:
              return escapeCsv((log as unknown as Record<string, unknown>)[header]);
          }
        })
        .join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  // ========================================================================
  // 内部工具方法
  // ========================================================================

  /**
   * 应用过滤器
   */
  private applyFilter(filter: AuditQueryFilter): AuditLogEntry[] {
    let logs = [...this.logs];

    if (filter.action) {
      const actions = Array.isArray(filter.action) ? filter.action : [filter.action];
      logs = logs.filter((l) => actions.includes(l.action));
    }

    if (filter.category) {
      const categories = Array.isArray(filter.category) ? filter.category : [filter.category];
      logs = logs.filter((l) => categories.includes(l.category));
    }

    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      logs = logs.filter((l) => statuses.includes(l.status));
    }

    if (filter.severity) {
      const severities = Array.isArray(filter.severity) ? filter.severity : [filter.severity];
      logs = logs.filter((l) => severities.includes(l.severity));
    }

    if (filter.startDate) {
      logs = logs.filter((l) => l.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      logs = logs.filter((l) => l.timestamp <= filter.endDate!);
    }

    if (filter.walletId) {
      logs = logs.filter(
        (l) => l.actor.walletId === filter.walletId || l.target?.walletId === filter.walletId
      );
    }

    if (filter.userId) {
      logs = logs.filter((l) => l.actor.userId === filter.userId);
    }

    if (filter.txHash) {
      logs = logs.filter((l) => l.txHash === filter.txHash);
    }

    if (filter.search) {
      const search = filter.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.description.toLowerCase().includes(search) ||
          l.action.toLowerCase().includes(search) ||
          JSON.stringify(l.metadata).toLowerCase().includes(search)
      );
    }

    const sortBy = filter.sortBy || 'timestamp';
    const sortOrder = filter.sortOrder || 'desc';
    logs.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortBy];
      const bVal = (b as unknown as Record<string, unknown>)[sortBy];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      }

      const aStr = String(aVal || '');
      const bStr = String(bVal || '');
      return sortOrder === 'desc' ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
    });

    if (filter.page && filter.pageSize) {
      const start = (filter.page - 1) * filter.pageSize;
      const end = start + filter.pageSize;
      logs = logs.slice(start, end);
    }

    return logs;
  }

  /**
   * 根据动作推断类别
   */
  private getCategoryByAction(action: AuditAction): AuditCategory {
    const categoryMap: Partial<Record<AuditAction, AuditCategory>> = {
      [AuditAction.WALLET_CREATE]: AuditCategory.WALLET,
      [AuditAction.WALLET_IMPORT]: AuditCategory.WALLET,
      [AuditAction.WALLET_EXPORT]: AuditCategory.WALLET,
      [AuditAction.WALLET_DELETE]: AuditCategory.WALLET,
      [AuditAction.SIGN_TRANSACTION]: AuditCategory.SIGNATURE,
      [AuditAction.SIGN_MESSAGE]: AuditCategory.SIGNATURE,
      [AuditAction.TRANSACTION_BUILD]: AuditCategory.TRANSACTION,
      [AuditAction.TRANSACTION_BROADCAST]: AuditCategory.TRANSACTION,
      [AuditAction.DEPOSIT_DETECTED]: AuditCategory.DEPOSIT_WITHDRAWAL,
      [AuditAction.WITHDRAWAL_REQUEST]: AuditCategory.DEPOSIT_WITHDRAWAL,
      [AuditAction.DAPP_CONNECT]: AuditCategory.DAPP,
      [AuditAction.LOGIN_SUCCESS]: AuditCategory.AUTHENTICATION,
      [AuditAction.LOGIN_FAILED]: AuditCategory.AUTHENTICATION,
      [AuditAction.PERMISSION_GRANT]: AuditCategory.PERMISSION,
      [AuditAction.SECURITY_ALERT]: AuditCategory.SECURITY,
      [AuditAction.KYC_SUBMIT]: AuditCategory.COMPLIANCE,
      [AuditAction.SWAP_EXECUTE]: AuditCategory.DEFI,
      [AuditAction.NFT_TRANSFER]: AuditCategory.NFT,
    };

    return categoryMap[action] || AuditCategory.CUSTOM;
  }

  /**
   * 根据动作推断严重程度
   */
  private getSeverityByAction(action: AuditAction): AuditSeverity {
    const highSeverityActions = [
      AuditAction.KEY_EXPORT,
      AuditAction.WALLET_DELETE,
      AuditAction.PERMISSION_GRANT,
      AuditAction.PERMISSION_REVOKE,
      AuditAction.UNAUTHORIZED_ACCESS,
      AuditAction.SANCTIONS_HIT,
      AuditAction.FRAUD_DETECTED,
    ];

    const criticalSeverityActions = [
      AuditAction.KEY_DELETE,
      AuditAction.MALWARE_DETECTED,
      AuditAction.PHISHING_DETECTED,
    ];

    if (criticalSeverityActions.includes(action)) {
      return AuditSeverity.CRITICAL;
    }
    if (highSeverityActions.includes(action)) {
      return AuditSeverity.HIGH;
    }

    return AuditSeverity.MEDIUM;
  }

  /**
   * 构建参与者对象
   */
  private buildActor(actor: Partial<AuditActor> & Pick<AuditActor, 'type'>): AuditActor {
    return {
      type: actor.type,
      id: actor.id,
      userId: actor.userId,
      walletId: actor.walletId,
      address: actor.address,
      dappUrl: actor.dappUrl,
      dappName: actor.dappName,
      apiKeyId: actor.apiKeyId,
      role: actor.role,
      ipAddress: this.config.ipAnonymization ? this.anonymizeIp(actor.ipAddress) : actor.ipAddress,
      userAgent: this.config.includeUserAgent ? actor.userAgent : undefined,
      deviceId: actor.deviceId,
      location: this.config.includeLocation ? actor.location : undefined,
    };
  }

  /**
   * 构建目标对象
   */
  private buildTarget(target: Partial<AuditTarget>): AuditTarget {
    return {
      type: target.type || 'system',
      id: target.id,
      walletId: target.walletId,
      address: target.address,
      name: target.name,
      symbol: target.symbol,
      chainId: target.chainId,
      metadata: target.metadata,
    };
  }

  /**
   * 构建索引字段
   */
  private buildIndexedFields(options: LogEntryOptions): string[] {
    const fields: string[] = [];

    if (options.actor.userId) fields.push('userId');
    if (options.actor.walletId) fields.push('walletId');
    if (options.txHash) fields.push('txHash');
    if (options.chainId) fields.push('chainId');
    if (options.requestId) fields.push('requestId');
    if (options.sessionId) fields.push('sessionId');

    return fields;
  }

  /**
   * 清洗敏感数据
   */
  private sanitizeMetadata(metadata: AuditLogMetadata): AuditLogMetadata {
    const sanitized = { ...metadata };

    for (const field of this.loggerConfig.sensitiveFields || []) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * IP 匿名化
   */
  private anonymizeIp(ip?: string): string | undefined {
    if (!ip) return undefined;

    if (ip.includes(':')) {
      return ip.split(':').slice(0, 4).join(':') + ':xxxx:xxxx:xxxx:xxxx';
    }

    return ip.split('.').slice(0, 2).join('.') + '.x.x';
  }

  /**
   * 生成 ID
   */
  private generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    const counter = (this.logCounter % 100000).toString(36).padStart(4, '0');
    return `${prefix}_${timestamp}_${random}_${counter}`;
  }

  /**
   * 生成追踪 ID
   */
  private generateTraceId(): string {
    const timestamp = Date.now().toString(16).padStart(16, '0');
    const random = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return timestamp + random;
  }

  /**
   * 生成跨度 ID
   */
  private generateSpanId(): string {
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /**
   * 处理错误
   */
  private handleError(error: AuditError): void {
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    } else {
      console.error('[AuditLogger]', error.message, error.details);
    }
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 清空所有日志
   */
  clearLogs(): void {
    this.logs = [];
    this.logCounter = 0;
  }

  /**
   * 销毁审计日志器
   */
  destroy(): void {
    this.stopFlushTimer();
    if (this.batchBuffer.length > 0) {
      this.flushBatch().catch(() => {});
    }
    this.clearLogs();
    this.activeTraces.clear();
    this.isInitialized = false;
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default AuditLogger;
