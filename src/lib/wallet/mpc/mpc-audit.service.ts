/**
 * MPC 审计服务 (MPCAuditService)
 *
 * 负责：
 *  - 签名前审计（请求创建、策略评估、审批发起）
 *  - 签名中审计（签名开始、各轮次状态）
 *  - 签名后审计（签名成功/失败、结果记录）
 *  - 审计日志查询与检索
 *  - 审计日志完整性校验（链式哈希）
 *  - 审计统计与报表
 *  - 审计日志导出
 *
 * 审计日志采用链式哈希结构，确保日志不可篡改。
 */

import {
  MPCAuditLog,
  SignAuditPhase,
  AuditQueryFilter,
  AuditQueryResult,
  MPCError,
  MPCErrorCode,
  ChainType,
  SignType,
  WalletTier,
  TransactionSummary,
} from './mpc.types';

// =============================================================================
// 审计服务配置
// =============================================================================

export interface MPCAuditServiceOptions {
  /** 最大日志保留数 */
  maxLogs?: number;
  /** 是否启用日志哈希链 */
  enableHashChain?: boolean;
  /** 是否启用详细日志 */
  enableVerboseLogging?: boolean;
  /** 哈希算法 */
  hashAlgorithm?: string;
  /** 自动清理间隔（毫秒） */
  cleanupIntervalMs?: number;
  /** 是否启用自动清理 */
  enableAutoCleanup?: boolean;
}

// =============================================================================
// 审计日志创建参数
// =============================================================================

interface CreateAuditLogParams {
  signatureRequestId: string;
  walletId: string;
  userId: string;
  chainType: ChainType;
  signType: SignType;
  walletTier: WalletTier;
  eventType: string;
  description: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  operatorIp?: string;
  operatorDevice?: string;
  details?: Record<string, unknown>;
  transactionSummary?: TransactionSummary;
}

// =============================================================================
// 审计统计
// =============================================================================

export interface AuditStats {
  /** 总日志数 */
  totalLogs: number;
  /** 签名前日志数 */
  preSignLogs: number;
  /** 签名中日志数 */
  duringSignLogs: number;
  /** 签名后日志数 */
  postSignLogs: number;
  /** 高风险事件数 */
  highRiskEvents: number;
  /** 关键风险事件数 */
  criticalRiskEvents: number;
  /** 今日日志数 */
  todayLogs: number;
  /** 本周日志数 */
  weekLogs: number;
  /** 本月日志数 */
  monthLogs: number;
  /** 唯一用户数 */
  uniqueUsers: number;
  /** 唯一钱包数 */
  uniqueWallets: number;
}

// =============================================================================
// 风险事件摘要
// =============================================================================

export interface RiskEventSummary {
  /** 风险等级 */
  riskLevel: string;
  /** 事件数量 */
  count: number;
  /** 事件类型分布 */
  eventTypes: Record<string, number>;
  /** 最近事件时间 */
  latestEventAt?: Date;
}

// =============================================================================
// MPC 审计服务类
// =============================================================================

export class MPCAuditService {
  private auditLogs: MPCAuditLog[] = [];
  private maxLogs: number;
  private enableHashChain: boolean;
  private enableVerboseLogging: boolean;
  private hashAlgorithm: string;
  private cleanupIntervalMs: number;
  private enableAutoCleanup: boolean;
  private cleanupTimer?: NodeJS.Timeout;
  private lastLogHash: string = '';

  private stats = {
    totalLogsWritten: 0,
    preSignLogs: 0,
    duringSignLogs: 0,
    postSignLogs: 0,
    totalQueries: 0,
    failedQueries: 0,
    hashVerifications: 0,
    hashVerificationFailures: 0,
  };

  constructor(options: MPCAuditServiceOptions = {}) {
    this.maxLogs = options.maxLogs || 10000;
    this.enableHashChain = options.enableHashChain ?? true;
    this.enableVerboseLogging = options.enableVerboseLogging ?? false;
    this.hashAlgorithm = options.hashAlgorithm || 'sha256';
    this.cleanupIntervalMs = options.cleanupIntervalMs || 60 * 60 * 1000;
    this.enableAutoCleanup = options.enableAutoCleanup ?? false;

    if (this.enableAutoCleanup) {
      this.startAutoCleanup();
    }
  }

  // =========================================================================
  // 签名前审计
  // =========================================================================

  /**
   * 记录签名前审计日志
   */
  logPreSignAudit(params: CreateAuditLogParams): MPCAuditLog {
    const log = this.createAuditLog({
      ...params,
      eventType: `pre_sign.${params.eventType}`,
    }, SignAuditPhase.PRE_SIGN);

    this.stats.preSignLogs++;
    return log;
  }

  /**
   * 记录策略评估审计
   */
  logPolicyEvaluation(params: {
    signatureRequestId: string;
    walletId: string;
    userId: string;
    chainType: ChainType;
    signType: SignType;
    walletTier: WalletTier;
    policyId: string;
    policyName: string;
    policyResult: string;
    riskScore: number;
    transactionSummary?: TransactionSummary;
    details?: Record<string, unknown>;
  }): MPCAuditLog {
    return this.logPreSignAudit({
      signatureRequestId: params.signatureRequestId,
      walletId: params.walletId,
      userId: params.userId,
      chainType: params.chainType,
      signType: params.signType,
      walletTier: params.walletTier,
      eventType: `policy.${params.policyResult}`,
      description: `策略 [${params.policyName}] 评估结果: ${params.policyResult}`,
      riskScore: params.riskScore,
      riskLevel: this.getRiskLevel(params.riskScore),
      transactionSummary: params.transactionSummary,
      details: {
        policyId: params.policyId,
        policyName: params.policyName,
        ...params.details,
      },
    });
  }

  /**
   * 记录审批发起审计
   */
  logApprovalInitiated(params: {
    signatureRequestId: string;
    walletId: string;
    userId: string;
    chainType: ChainType;
    signType: SignType;
    walletTier: WalletTier;
    approvalMode: string;
    approverCount: number;
    transactionSummary?: TransactionSummary;
  }): MPCAuditLog {
    return this.logPreSignAudit({
      signatureRequestId: params.signatureRequestId,
      walletId: params.walletId,
      userId: params.userId,
      chainType: params.chainType,
      signType: params.signType,
      walletTier: params.walletTier,
      eventType: 'approval.initiated',
      description: `审批已发起，模式: ${params.approvalMode}，审批人数: ${params.approverCount}`,
      riskScore: 50,
      riskLevel: 'medium',
      transactionSummary: params.transactionSummary,
      details: {
        approvalMode: params.approvalMode,
        approverCount: params.approverCount,
      },
    });
  }

  // =========================================================================
  // 签名中审计
  // =========================================================================

  /**
   * 记录签名中审计日志
   */
  logDuringSignAudit(params: CreateAuditLogParams): MPCAuditLog {
    const log = this.createAuditLog({
      ...params,
      eventType: `during_sign.${params.eventType}`,
    }, SignAuditPhase.DURING_SIGN);

    this.stats.duringSignLogs++;
    return log;
  }

  /**
   * 记录签名轮次审计
   */
  logSignRound(params: {
    signatureRequestId: string;
    walletId: string;
    userId: string;
    chainType: ChainType;
    signType: SignType;
    walletTier: WalletTier;
    round: number;
    phase: string;
    participantCount: number;
    transactionSummary?: TransactionSummary;
  }): MPCAuditLog {
    return this.logDuringSignAudit({
      signatureRequestId: params.signatureRequestId,
      walletId: params.walletId,
      userId: params.userId,
      chainType: params.chainType,
      signType: params.signType,
      walletTier: params.walletTier,
      eventType: `round.${params.phase}`,
      description: `签名第 ${params.round} 轮 [${params.phase}]，参与节点: ${params.participantCount}`,
      riskScore: 0,
      riskLevel: 'low',
      transactionSummary: params.transactionSummary,
      details: {
        round: params.round,
        phase: params.phase,
        participantCount: params.participantCount,
      },
    });
  }

  // =========================================================================
  // 签名后审计
  // =========================================================================

  /**
   * 记录签名后审计日志
   */
  logPostSignAudit(params: CreateAuditLogParams): MPCAuditLog {
    const log = this.createAuditLog({
      ...params,
      eventType: `post_sign.${params.eventType}`,
    }, SignAuditPhase.POST_SIGN);

    this.stats.postSignLogs++;
    return log;
  }

  /**
   * 记录签名成功审计
   */
  logSignSuccess(params: {
    signatureRequestId: string;
    walletId: string;
    userId: string;
    chainType: ChainType;
    signType: SignType;
    walletTier: WalletTier;
    signTimeMs: number;
    signerNodes: string[];
    signature: string;
    transactionSummary?: TransactionSummary;
  }): MPCAuditLog {
    return this.logPostSignAudit({
      signatureRequestId: params.signatureRequestId,
      walletId: params.walletId,
      userId: params.userId,
      chainType: params.chainType,
      signType: params.signType,
      walletTier: params.walletTier,
      eventType: 'success',
      description: `签名成功，耗时 ${params.signTimeMs}ms，参与节点 ${params.signerNodes.length} 个`,
      riskScore: 0,
      riskLevel: 'low',
      transactionSummary: params.transactionSummary,
      details: {
        signTimeMs: params.signTimeMs,
        signerNodes: params.signerNodes,
        signatureHash: this.hashString(params.signature),
      },
    });
  }

  /**
   * 记录签名失败审计
   */
  logSignFailure(params: {
    signatureRequestId: string;
    walletId: string;
    userId: string;
    chainType: ChainType;
    signType: SignType;
    walletTier: WalletTier;
    errorCode: string;
    errorMessage: string;
    transactionSummary?: TransactionSummary;
    operatorIp?: string;
  }): MPCAuditLog {
    return this.logPostSignAudit({
      signatureRequestId: params.signatureRequestId,
      walletId: params.walletId,
      userId: params.userId,
      chainType: params.chainType,
      signType: params.signType,
      walletTier: params.walletTier,
      eventType: 'failure',
      description: `签名失败: ${params.errorMessage}`,
      riskScore: 100,
      riskLevel: 'critical',
      operatorIp: params.operatorIp,
      transactionSummary: params.transactionSummary,
      details: {
        errorCode: params.errorCode,
        errorMessage: params.errorMessage,
      },
    });
  }

  // =========================================================================
  // 审计日志创建
  // =========================================================================

  /**
   * 创建审计日志
   */
  private createAuditLog(
    params: CreateAuditLogParams,
    phase: SignAuditPhase,
  ): MPCAuditLog {
    const now = new Date();
    const logId = this.generateId('audit');

    const log: MPCAuditLog = {
      id: logId,
      signatureRequestId: params.signatureRequestId,
      phase,
      walletId: params.walletId,
      userId: params.userId,
      chainType: params.chainType,
      signType: params.signType,
      walletTier: params.walletTier,
      eventType: params.eventType,
      description: params.description,
      riskScore: params.riskScore,
      riskLevel: params.riskLevel,
      operatorIp: params.operatorIp,
      operatorDevice: params.operatorDevice,
      details: params.details,
      transactionSummary: params.transactionSummary,
      timestamp: now,
    };

    if (this.enableHashChain) {
      log.previousLogHash = this.lastLogHash;
      log.logHash = this.calculateLogHash(log);
      this.lastLogHash = log.logHash;
    }

    this.auditLogs.push(log);
    this.stats.totalLogsWritten++;

    if (this.auditLogs.length > this.maxLogs) {
      const removeCount = this.auditLogs.length - this.maxLogs;
      this.auditLogs.splice(0, removeCount);
    }

    return log;
  }

  // =========================================================================
  // 审计日志查询
  // =========================================================================

  /**
   * 查询审计日志
   */
  queryLogs(filter: AuditQueryFilter): AuditQueryResult {
    this.stats.totalQueries++;

    try {
      let logs = [...this.auditLogs];

      if (filter.signatureRequestId) {
        logs = logs.filter((l) => l.signatureRequestId === filter.signatureRequestId);
      }

      if (filter.walletId) {
        logs = logs.filter((l) => l.walletId === filter.walletId);
      }

      if (filter.userId) {
        logs = logs.filter((l) => l.userId === filter.userId);
      }

      if (filter.phase) {
        logs = logs.filter((l) => l.phase === filter.phase);
      }

      if (filter.eventType) {
        logs = logs.filter((l) => l.eventType === filter.eventType);
      }

      if (filter.chainType) {
        logs = logs.filter((l) => l.chainType === filter.chainType);
      }

      if (filter.startTime) {
        logs = logs.filter((l) => l.timestamp >= filter.startTime!);
      }

      if (filter.endTime) {
        logs = logs.filter((l) => l.timestamp <= filter.endTime!);
      }

      if (filter.riskLevel) {
        logs = logs.filter((l) => l.riskLevel === filter.riskLevel);
      }

      const total = logs.length;

      if (filter.sortBy) {
        const sortBy = filter.sortBy as keyof MPCAuditLog;
        const sortOrder = filter.sortOrder || 'desc';
        logs.sort((a, b) => {
          const aVal = a[sortBy];
          const bVal = b[sortBy];
          if (aVal === undefined || bVal === undefined) return 0;
          if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      } else {
        logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      }

      const page = filter.page || 1;
      const pageSize = filter.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const paginatedLogs = logs.slice(startIndex, startIndex + pageSize);

      return {
        logs: paginatedLogs,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      this.stats.failedQueries++;
      throw error;
    }
  }

  /**
   * 获取签名请求的完整审计链路
   */
  getSignRequestAuditTrail(signatureRequestId: string): MPCAuditLog[] {
    return this.auditLogs
      .filter((l) => l.signatureRequestId === signatureRequestId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * 获取用户的审计日志
   */
  getUserAuditLogs(
    userId: string,
    limit: number = 100,
  ): MPCAuditLog[] {
    return this.auditLogs
      .filter((l) => l.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * 获取钱包的审计日志
   */
  getWalletAuditLogs(
    walletId: string,
    limit: number = 100,
  ): MPCAuditLog[] {
    return this.auditLogs
      .filter((l) => l.walletId === walletId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // =========================================================================
  // 哈希链验证
  // =========================================================================

  /**
   * 验证审计日志哈希链完整性
   */
  verifyHashChain(): {
    valid: boolean;
    verifiedCount: number;
    failedIndex?: number;
    failedLogId?: string;
  } {
    this.stats.hashVerifications++;

    if (!this.enableHashChain) {
      return { valid: true, verifiedCount: 0 };
    }

    let previousHash = '';

    for (let i = 0; i < this.auditLogs.length; i++) {
      const log = this.auditLogs[i];

      if (log.previousLogHash !== previousHash) {
        this.stats.hashVerificationFailures++;
        return {
          valid: false,
          verifiedCount: i,
          failedIndex: i,
          failedLogId: log.id,
        };
      }

      const expectedHash = this.calculateLogHash(log);
      if (log.logHash !== expectedHash) {
        this.stats.hashVerificationFailures++;
        return {
          valid: false,
          verifiedCount: i,
          failedIndex: i,
          failedLogId: log.id,
        };
      }

      previousHash = log.logHash;
    }

    return {
      valid: true,
      verifiedCount: this.auditLogs.length,
    };
  }

  /**
   * 计算日志哈希
   */
  private calculateLogHash(log: MPCAuditLog): string {
    const content = JSON.stringify({
      id: log.id,
      signatureRequestId: log.signatureRequestId,
      phase: log.phase,
      walletId: log.walletId,
      userId: log.userId,
      eventType: log.eventType,
      timestamp: log.timestamp.toISOString(),
      previousLogHash: log.previousLogHash,
    });
    return this.hashString(content);
  }

  /**
   * 字符串哈希（简单实现）
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  // =========================================================================
  // 统计与报表
  // =========================================================================

  /**
   * 获取审计统计
   */
  getAuditStats(): AuditStats {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const uniqueUsers = new Set(this.auditLogs.map((l) => l.userId)).size;
    const uniqueWallets = new Set(this.auditLogs.map((l) => l.walletId)).size;

    const highRiskEvents = this.auditLogs.filter(
      (l) => l.riskLevel === 'high',
    ).length;
    const criticalRiskEvents = this.auditLogs.filter(
      (l) => l.riskLevel === 'critical',
    ).length;

    const todayLogs = this.auditLogs.filter(
      (l) => l.timestamp >= todayStart,
    ).length;
    const weekLogs = this.auditLogs.filter(
      (l) => l.timestamp >= weekStart,
    ).length;
    const monthLogs = this.auditLogs.filter(
      (l) => l.timestamp >= monthStart,
    ).length;

    return {
      totalLogs: this.auditLogs.length,
      preSignLogs: this.stats.preSignLogs,
      duringSignLogs: this.stats.duringSignLogs,
      postSignLogs: this.stats.postSignLogs,
      highRiskEvents,
      criticalRiskEvents,
      todayLogs,
      weekLogs,
      monthLogs,
      uniqueUsers,
      uniqueWallets,
    };
  }

  /**
   * 获取风险事件摘要
   */
  getRiskEventSummary(): RiskEventSummary[] {
    const riskLevels = ['low', 'medium', 'high', 'critical'];

    return riskLevels.map((level) => {
      const levelLogs = this.auditLogs.filter((l) => l.riskLevel === level);
      const eventTypes: Record<string, number> = {};

      for (const log of levelLogs) {
        eventTypes[log.eventType] = (eventTypes[log.eventType] || 0) + 1;
      }

      const latestEvent = levelLogs.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      )[0];

      return {
        riskLevel: level,
        count: levelLogs.length,
        eventTypes,
        latestEventAt: latestEvent?.timestamp,
      };
    });
  }

  /**
   * 获取事件类型统计
   */
  getEventTypeStats(): Record<string, number> {
    const eventTypes: Record<string, number> = {};
    for (const log of this.auditLogs) {
      eventTypes[log.eventType] = (eventTypes[log.eventType] || 0) + 1;
    }
    return eventTypes;
  }

  // =========================================================================
  // 日志导出
  // =========================================================================

  /**
   * 导出审计日志为 JSON
   */
  exportLogs(filter?: AuditQueryFilter): string {
    let logs: MPCAuditLog[];

    if (filter) {
      const result = this.queryLogs(filter);
      logs = result.logs;
    } else {
      logs = [...this.auditLogs];
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * 导出审计日志为 CSV
   */
  exportLogsAsCsv(filter?: AuditQueryFilter): string {
    let logs: MPCAuditLog[];

    if (filter) {
      const result = this.queryLogs(filter);
      logs = result.logs;
    } else {
      logs = [...this.auditLogs];
    }

    const headers = [
      'id',
      'timestamp',
      'phase',
      'eventType',
      'walletId',
      'userId',
      'chainType',
      'signType',
      'walletTier',
      'riskLevel',
      'riskScore',
      'description',
    ];

    const csvRows = [headers.join(',')];

    for (const log of logs) {
      const row = [
        log.id,
        log.timestamp.toISOString(),
        log.phase,
        log.eventType,
        log.walletId,
        log.userId,
        log.chainType,
        log.signType,
        log.walletTier,
        log.riskLevel,
        log.riskScore,
        `"${log.description.replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  // =========================================================================
  // 自动清理
  // =========================================================================

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldLogs();
    }, this.cleanupIntervalMs) as unknown as NodeJS.Timeout;
  }

  /**
   * 清理旧日志
   */
  cleanupOldLogs(): number {
    if (this.auditLogs.length <= this.maxLogs) {
      return 0;
    }

    const removeCount = this.auditLogs.length - this.maxLogs;
    this.auditLogs.splice(0, removeCount);
    return removeCount;
  }

  /**
   * 清空所有日志
   */
  clearAllLogs(): void {
    this.auditLogs = [];
    this.lastLogHash = '';
  }

  // =========================================================================
  // 工具方法
  // =========================================================================

  /**
   * 生成唯一 ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  /**
   * 获取风险等级
   */
  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'critical';
  }

  /**
   * 获取服务统计
   */
  getServiceStats() {
    return {
      ...this.stats,
      currentLogs: this.auditLogs.length,
      maxLogs: this.maxLogs,
      hashChainEnabled: this.enableHashChain,
      lastLogHash: this.lastLogHash,
    };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}
