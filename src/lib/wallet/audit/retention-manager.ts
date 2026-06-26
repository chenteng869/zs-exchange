/**
 * 数据留存管理器 (RetentionManager)
 *
 * 功能：
 *  - 数据分级分类
 *  - 留存策略配置和执行
 *  - 数据归档管理
 *  - 数据销毁管理
 *  - 合规检查
 *  - 数据生命周期追踪
 *  - 存储优化
 *  - 留存审计
 */

import {
  RetentionPolicy,
  RetentionClass,
  RetentionAction,
  AuditLogEntry,
  AuditEvidence,
  EvidenceChainBlock,
  ComplianceReport,
} from './audit.types';

// ============================================================================
// 留存管理器配置接口
// ============================================================================

export interface RetentionManagerConfig {
  defaultPolicy?: RetentionPolicy;
  autoArchive?: boolean;
  autoPurge?: boolean;
  checkInterval?: number;
  storagePath?: string;
  archivePath?: string;
  maxHotStorageSize?: number;
  maxWarmStorageSize?: number;
  compressionEnabled?: boolean;
  encryptionEnabled?: boolean;
  legalHoldEnabled?: boolean;
}

// ============================================================================
// 数据分类接口
// ============================================================================

export interface DataClassification {
  id: string;
  dataType: 'audit_log' | 'evidence' | 'report' | 'block' | 'other';
  dataId: string;
  retentionClass: RetentionClass;
  sensitivityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  legalHold: boolean;
  createdAt: number;
  expiresAt: number;
  archived: boolean;
  archiveDate?: number;
  purgeDate?: number;
  sizeBytes?: number;
  tags: string[];
}

// ============================================================================
// 归档任务接口
// ============================================================================

export interface ArchiveTask {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  retentionClass: RetentionClass;
  itemsCount: number;
  processedCount: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

// ============================================================================
// 销毁任务接口
// ============================================================================

export interface PurgeTask {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  itemsCount: number;
  processedCount: number;
  startedAt?: number;
  completedAt?: number;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: number;
  error?: string;
}

// ============================================================================
// 合规检查结果接口
// ============================================================================

export interface ComplianceCheckResult {
  passed: boolean;
  checkDate: number;
  findings: ComplianceFinding[];
  summary: {
    totalChecked: number;
    compliant: number;
    nonCompliant: number;
    warnings: number;
  };
}

// ============================================================================
// 合规检查发现接口
// ============================================================================

export interface ComplianceFinding {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: string;
  description: string;
  affectedItems?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation?: string;
  dataIds?: string[];
}

// ============================================================================
// 留存统计接口
// ============================================================================

export interface RetentionStatistics {
  totalItems: number;
  byClass: Record<RetentionClass, number>;
  bySensitivity: Record<string, number>;
  archivedItems: number;
  pendingArchive: number;
  pendingPurge: number;
  purgedItems: number;
  totalSizeBytes?: number;
  hotStorageSize?: number;
  warmStorageSize?: number;
  coldStorageSize?: number;
  legalHoldItems: number;
  averageRetentionDays?: number;
}

// ============================================================================
// 数据留存管理器类
// ============================================================================

export class RetentionManager {
  private config: Required<RetentionManagerConfig>;
  private policies: Map<string, RetentionPolicy> = new Map();
  private classifications: Map<string, DataClassification> = new Map();
  private archiveTasks: Map<string, ArchiveTask> = new Map();
  private purgeTasks: Map<string, PurgeTask> = new Map();
  private isRunning = false;
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private onArchiveCallbacks: Array<(task: ArchiveTask) => void> = [];
  private onPurgeCallbacks: Array<(task: PurgeTask) => void> = [];
  private onComplianceIssueCallbacks: Array<(finding: ComplianceFinding) => void> = [];

  // ========================================================================
  // 构造函数
  // ========================================================================

  constructor(config?: RetentionManagerConfig) {
    this.config = {
      defaultPolicy: this.createDefaultPolicy(),
      autoArchive: true,
      autoPurge: false,
      checkInterval: 24 * 60 * 60 * 1000,
      storagePath: './data/audit',
      archivePath: './data/archive',
      maxHotStorageSize: 10 * 1024 * 1024 * 1024,
      maxWarmStorageSize: 50 * 1024 * 1024 * 1024,
      compressionEnabled: true,
      encryptionEnabled: false,
      legalHoldEnabled: true,
      ...config,
    };

    this.initializeDefaultPolicies();
  }

  // ========================================================================
  // 初始化方法
  // ========================================================================

  /**
   * 创建默认留存策略
   */
  private createDefaultPolicy(): RetentionPolicy {
    return {
      id: 'default',
      name: '默认策略',
      description: '默认数据留存策略',
      retentionPeriod: {
        hot: 30 * 24 * 60 * 60 * 1000,
        warm: 90 * 24 * 60 * 60 * 1000,
        cold: 365 * 24 * 60 * 60 * 1000,
      },
      actions: {
        afterHotPeriod: RetentionAction.MOVE_TO_WARM,
        afterWarmPeriod: RetentionAction.MOVE_TO_COLD,
        afterColdPeriod: RetentionAction.ARCHIVE,
        afterRetention: RetentionAction.PURGE,
      },
      compressionEnabled: true,
      encryptionEnabled: false,
      legalHold: false,
      auditRequired: true,
      approvalRequired: {
        archive: false,
        purge: true,
        restore: false,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: true,
    };
  }

  /**
   * 初始化默认策略
   */
  private initializeDefaultPolicies(): void {
    const policies: RetentionPolicy[] = [
      {
        id: 'audit_logs',
        name: '审计日志策略',
        description: '审计日志数据留存策略',
        dataTypes: ['audit_log'],
        retentionPeriod: {
          hot: 90 * 24 * 60 * 60 * 1000,
          warm: 180 * 24 * 60 * 60 * 1000,
          cold: 7 * 365 * 24 * 60 * 60 * 1000,
        },
        actions: {
          afterHotPeriod: RetentionAction.MOVE_TO_WARM,
          afterWarmPeriod: RetentionAction.MOVE_TO_COLD,
          afterColdPeriod: RetentionAction.ARCHIVE,
          afterRetention: RetentionAction.PURGE,
        },
        compressionEnabled: true,
        encryptionEnabled: false,
        legalHold: false,
        auditRequired: true,
        approvalRequired: {
          archive: false,
          purge: true,
          restore: false,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: false,
      },
      {
        id: 'evidence_chain',
        name: '证据链策略',
        description: '证据链数据留存策略',
        dataTypes: ['evidence', 'block'],
        retentionPeriod: {
          hot: 180 * 24 * 60 * 60 * 1000,
          warm: 365 * 24 * 60 * 60 * 1000,
          cold: 10 * 365 * 24 * 60 * 60 * 1000,
        },
        actions: {
          afterHotPeriod: RetentionAction.MOVE_TO_WARM,
          afterWarmPeriod: RetentionAction.MOVE_TO_COLD,
          afterColdPeriod: RetentionAction.ARCHIVE,
          afterRetention: RetentionAction.KEEP_FOREVER,
        },
        compressionEnabled: true,
        encryptionEnabled: true,
        legalHold: true,
        auditRequired: true,
        approvalRequired: {
          archive: true,
          purge: true,
          restore: true,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: false,
      },
      {
        id: 'compliance_reports',
        name: '合规报表策略',
        description: '合规报表数据留存策略',
        dataTypes: ['report'],
        retentionPeriod: {
          hot: 30 * 24 * 60 * 60 * 1000,
          warm: 180 * 24 * 60 * 60 * 1000,
          cold: 5 * 365 * 24 * 60 * 60 * 1000,
        },
        actions: {
          afterHotPeriod: RetentionAction.MOVE_TO_WARM,
          afterWarmPeriod: RetentionAction.MOVE_TO_COLD,
          afterColdPeriod: RetentionAction.ARCHIVE,
          afterRetention: RetentionAction.PURGE,
        },
        compressionEnabled: true,
        encryptionEnabled: false,
        legalHold: false,
        auditRequired: true,
        approvalRequired: {
          archive: false,
          purge: true,
          restore: false,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: false,
      },
    ];

    for (const policy of policies) {
      this.policies.set(policy.id, policy);
    }
  }

  // ========================================================================
  // 策略管理方法
  // ========================================================================

  /**
   * 添加留存策略
   */
  addPolicy(policy: Omit<RetentionPolicy, 'createdAt' | 'updatedAt'>): RetentionPolicy {
    const fullPolicy: RetentionPolicy = {
      ...policy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.policies.set(policy.id, fullPolicy);
    return fullPolicy;
  }

  /**
   * 更新留存策略
   */
  updatePolicy(
    policyId: string,
    updates: Partial<RetentionPolicy>
  ): RetentionPolicy | undefined {
    const policy = this.policies.get(policyId);
    if (!policy) return undefined;

    Object.assign(policy, updates, { updatedAt: Date.now() });
    return policy;
  }

  /**
   * 删除留存策略
   */
  deletePolicy(policyId: string): boolean {
    if (policyId === 'default') return false;
    return this.policies.delete(policyId);
  }

  /**
   * 获取留存策略
   */
  getPolicy(policyId: string): RetentionPolicy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * 获取所有策略
   */
  listPolicies(): RetentionPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * 根据数据类型获取适用策略
   */
  getPolicyForDataType(dataType: string): RetentionPolicy {
    for (const policy of this.policies.values()) {
      if (policy.dataTypes && policy.dataTypes.includes(dataType)) {
        return policy;
      }
    }
    return this.config.defaultPolicy;
  }

  // ========================================================================
  // 数据分类方法
  // ========================================================================

  /**
   * 分类审计日志
   */
  classifyAuditLog(log: AuditLogEntry): DataClassification {
    const policy = this.getPolicyForDataType('audit_log');
    const sensitivity = this.determineSensitivity(log);
    const retentionClass = this.determineRetentionClass(log);

    const classification: DataClassification = {
      id: `class_${log.id}`,
      dataType: 'audit_log',
      dataId: log.id,
      retentionClass,
      sensitivityLevel: sensitivity,
      legalHold: policy.legalHold || false,
      createdAt: log.timestamp,
      expiresAt: log.timestamp + policy.retentionPeriod.cold,
      archived: false,
      tags: this.extractTags(log),
    };

    this.classifications.set(classification.id, classification);
    return classification;
  }

  /**
   * 分类证据
   */
  classifyEvidence(evidence: AuditEvidence): DataClassification {
    const policy = this.getPolicyForDataType('evidence');

    const classification: DataClassification = {
      id: `class_${evidence.id}`,
      dataType: 'evidence',
      dataId: evidence.id,
      retentionClass: RetentionClass.COLD,
      sensitivityLevel: 'restricted',
      legalHold: true,
      createdAt: evidence.timestamp,
      expiresAt: evidence.timestamp + policy.retentionPeriod.cold,
      archived: false,
      tags: ['evidence', evidence.evidenceType],
    };

    this.classifications.set(classification.id, classification);
    return classification;
  }

  /**
   * 分类报表
   */
  classifyReport(report: ComplianceReport): DataClassification {
    const policy = this.getPolicyForDataType('report');

    const classification: DataClassification = {
      id: `class_${report.id}`,
      dataType: 'report',
      dataId: report.id,
      retentionClass: report.retentionClass || RetentionClass.WARM,
      sensitivityLevel: 'confidential',
      legalHold: false,
      createdAt: report.generatedAt,
      expiresAt: report.generatedAt + policy.retentionPeriod.cold,
      archived: report.isArchived || false,
      tags: ['report', report.reportType],
    };

    this.classifications.set(classification.id, classification);
    return classification;
  }

  /**
   * 确定敏感级别
   */
  private determineSensitivity(log: AuditLogEntry): DataClassification['sensitivityLevel'] {
    if (log.category === 'key_management' || log.category === 'security') {
      return 'restricted';
    }
    if (log.category === 'identity' || log.category === 'transaction') {
      return 'confidential';
    }
    if (log.severity === 'critical' || log.severity === 'high') {
      return 'confidential';
    }
    return 'internal';
  }

  /**
   * 确定留存级别
   */
  private determineRetentionClass(log: AuditLogEntry): RetentionClass {
    if (log.severity === 'critical' || log.category === 'key_management') {
      return RetentionClass.COLD;
    }
    if (log.severity === 'high' || log.category === 'transaction') {
      return RetentionClass.WARM;
    }
    return RetentionClass.HOT;
  }

  /**
   * 提取标签
   */
  private extractTags(log: AuditLogEntry): string[] {
    const tags: string[] = [];

    if (log.category) tags.push(log.category);
    if (log.action) tags.push(log.action);
    if (log.severity) tags.push(log.severity);
    if (log.chainId) tags.push(log.chainId);
    if (log.riskScore && log.riskScore >= 70) tags.push('high_risk');

    return tags;
  }

  /**
   * 获取数据分类
   */
  getClassification(classificationId: string): DataClassification | undefined {
    return this.classifications.get(classificationId);
  }

  /**
   * 更新分类信息
   */
  updateClassification(
    classificationId: string,
    updates: Partial<DataClassification>
  ): DataClassification | undefined {
    const classification = this.classifications.get(classificationId);
    if (!classification) return undefined;

    Object.assign(classification, updates);
    return classification;
  }

  // ========================================================================
  // 归档管理方法
  // ========================================================================

  /**
   * 创建归档任务
   */
  createArchiveTask(retentionClass: RetentionClass): ArchiveTask {
    const taskId = `archive_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const itemsToArchive = Array.from(this.classifications.values()).filter(
      (c) =>
        c.retentionClass === retentionClass &&
        !c.archived &&
        !c.legalHold &&
        Date.now() > c.createdAt + this.getRetentionPeriod(retentionClass)
    );

    const task: ArchiveTask = {
      id: taskId,
      status: 'pending',
      retentionClass,
      itemsCount: itemsToArchive.length,
      processedCount: 0,
    };

    this.archiveTasks.set(taskId, task);
    return task;
  }

  /**
   * 执行归档任务
   */
  async executeArchiveTask(taskId: string): Promise<ArchiveTask> {
    const task = this.archiveTasks.get(taskId);
    if (!task) {
      throw new Error(`归档任务不存在: ${taskId}`);
    }

    task.status = 'in_progress';
    task.startedAt = Date.now();

    try {
      const itemsToArchive = Array.from(this.classifications.values()).filter(
        (c) =>
          c.retentionClass === task.retentionClass &&
          !c.archived &&
          !c.legalHold
      );

      for (const item of itemsToArchive) {
        item.archived = true;
        item.archiveDate = Date.now();
        task.processedCount++;
      }

      task.status = 'completed';
      task.completedAt = Date.now();

      for (const callback of this.onArchiveCallbacks) {
        callback(task);
      }

      return task;
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.completedAt = Date.now();
      throw error;
    }
  }

  /**
   * 获取留存周期（毫秒）
   */
  private getRetentionPeriod(retentionClass: RetentionClass): number {
    const policy = this.config.defaultPolicy;
    switch (retentionClass) {
      case RetentionClass.HOT:
        return policy.retentionPeriod.hot;
      case RetentionClass.WARM:
        return policy.retentionPeriod.warm;
      case RetentionClass.COLD:
        return policy.retentionPeriod.cold;
      default:
        return policy.retentionPeriod.cold;
    }
  }

  // ========================================================================
  // 销毁管理方法
  // ========================================================================

  /**
   * 创建销毁任务
   */
  createPurgeTask(): PurgeTask {
    const taskId = `purge_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const itemsToPurge = Array.from(this.classifications.values()).filter(
      (c) =>
        !c.legalHold &&
        Date.now() > c.expiresAt &&
        c.archived
    );

    const task: PurgeTask = {
      id: taskId,
      status: 'pending',
      itemsCount: itemsToPurge.length,
      processedCount: 0,
      approvalRequired: this.config.defaultPolicy.approvalRequired.purge,
    };

    this.purgeTasks.set(taskId, task);
    return task;
  }

  /**
   * 批准销毁任务
   */
  approvePurge(taskId: string, approver: string): boolean {
    const task = this.purgeTasks.get(taskId);
    if (!task) return false;

    task.approvedBy = approver;
    task.approvedAt = Date.now();
    return true;
  }

  /**
   * 执行销毁任务
   */
  async executePurgeTask(taskId: string): Promise<PurgeTask> {
    const task = this.purgeTasks.get(taskId);
    if (!task) {
      throw new Error(`销毁任务不存在: ${taskId}`);
    }

    if (task.approvalRequired && !task.approvedBy) {
      throw new Error('销毁任务需要审批');
    }

    task.status = 'in_progress';
    task.startedAt = Date.now();

    try {
      const itemsToPurge = Array.from(this.classifications.values()).filter(
        (c) =>
          !c.legalHold &&
          Date.now() > c.expiresAt &&
          c.archived
      );

      for (const item of itemsToPurge) {
        this.classifications.delete(item.id);
        task.processedCount++;
      }

      task.status = 'completed';
      task.completedAt = Date.now();

      for (const callback of this.onPurgeCallbacks) {
        callback(task);
      }

      return task;
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.completedAt = Date.now();
      throw error;
    }
  }

  // ========================================================================
  // 合规检查方法
  // ========================================================================

  /**
   * 执行合规检查
   */
  performComplianceCheck(): ComplianceCheckResult {
    const findings: ComplianceFinding[] = [];
    let compliant = 0;
    let nonCompliant = 0;
    let warnings = 0;

    const allItems = Array.from(this.classifications.values());

    // 检查：是否有过期但未归档的数据
    const expiredNotArchived = allItems.filter(
      (c) => !c.archived && !c.legalHold && Date.now() > c.createdAt + this.getRetentionPeriod(c.retentionClass)
    );
    if (expiredNotArchived.length > 0) {
      findings.push({
        id: `finding_${Date.now()}_1`,
        type: 'warning',
        category: 'archiving',
        description: `${expiredNotArchived.length} 条数据已过期但未归档`,
        affectedItems: expiredNotArchived.length,
        severity: 'medium',
        recommendation: '及时归档过期数据以优化存储',
      });
      nonCompliant += expiredNotArchived.length;
    }

    // 检查：是否有超过留存期限但未销毁的数据
    const pastRetention = allItems.filter(
      (c) => !c.legalHold && Date.now() > c.expiresAt
    );
    if (pastRetention.length > 0) {
      findings.push({
        id: `finding_${Date.now()}_2`,
        type: 'error',
        category: 'retention',
        description: `${pastRetention.length} 条数据已超过留存期限`,
        affectedItems: pastRetention.length,
        severity: 'high',
        recommendation: '按照留存策略销毁过期数据',
      });
      nonCompliant += pastRetention.length;
    }

    // 检查：法律冻结数据是否正确标记
    const legalHoldItems = allItems.filter((c) => c.legalHold);
    const incorrectlyPurged = legalHoldItems.filter((c) => c.purgeDate);
    if (incorrectlyPurged.length > 0) {
      findings.push({
        id: `finding_${Date.now()}_3`,
        type: 'error',
        category: 'legal_hold',
        description: `${incorrectlyPurged.length} 条法律冻结数据被错误销毁`,
        affectedItems: incorrectlyPurged.length,
        severity: 'critical',
        recommendation: '立即恢复被错误销毁的法律冻结数据',
      });
    }

    compliant = allItems.length - nonCompliant;

    return {
      passed: findings.filter((f) => f.type === 'error').length === 0,
      checkDate: Date.now(),
      findings,
      summary: {
        totalChecked: allItems.length,
        compliant,
        nonCompliant,
        warnings: findings.filter((f) => f.type === 'warning').length,
      },
    };
  }

  // ========================================================================
  // 统计方法
  // ========================================================================

  /**
   * 获取留存统计信息
   */
  getStatistics(): RetentionStatistics {
    const allItems = Array.from(this.classifications.values());

    const byClass: Record<string, number> = {
      [RetentionClass.HOT]: 0,
      [RetentionClass.WARM]: 0,
      [RetentionClass.COLD]: 0,
    };

    const bySensitivity: Record<string, number> = {};

    let archived = 0;
    let pendingArchive = 0;
    let pendingPurge = 0;
    let purged = 0;
    let legalHold = 0;

    for (const item of allItems) {
      byClass[item.retentionClass] = (byClass[item.retentionClass] || 0) + 1;
      bySensitivity[item.sensitivityLevel] = (bySensitivity[item.sensitivityLevel] || 0) + 1;

      if (item.archived) archived++;
      if (item.legalHold) legalHold++;

      if (!item.archived && !item.legalHold && Date.now() > item.createdAt + this.getRetentionPeriod(item.retentionClass)) {
        pendingArchive++;
      }

      if (item.archived && !item.legalHold && Date.now() > item.expiresAt) {
        pendingPurge++;
      }
    }

    return {
      totalItems: allItems.length,
      byClass: byClass as Record<RetentionClass, number>,
      bySensitivity,
      archivedItems: archived,
      pendingArchive,
      pendingPurge,
      purgedItems: purged,
      legalHoldItems: legalHold,
    };
  }

  // ========================================================================
  // 自动管理方法
  // ========================================================================

  /**
   * 启动自动管理
   */
  startAutoManagement(): void {
    if (this.isRunning) return;

    this.isRunning = true;

    this.checkTimer = setInterval(() => {
      this.performRetentionCheck();
    }, this.config.checkInterval);
  }

  /**
   * 停止自动管理
   */
  stopAutoManagement(): void {
    this.isRunning = false;

    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * 执行留存检查
   */
  private performRetentionCheck(): void {
    if (this.config.autoArchive) {
      const hotTask = this.createArchiveTask(RetentionClass.HOT);
      if (hotTask.itemsCount > 0) {
        this.executeArchiveTask(hotTask.id).catch(console.error);
      }
    }
  }

  // ========================================================================
  // 事件回调方法
  // ========================================================================

  /**
   * 注册归档完成回调
   */
  onArchive(callback: (task: ArchiveTask) => void): void {
    this.onArchiveCallbacks.push(callback);
  }

  /**
   * 注册销毁完成回调
   */
  onPurge(callback: (task: PurgeTask) => void): void {
    this.onPurgeCallbacks.push(callback);
  }

  /**
   * 注册合规问题回调
   */
  onComplianceIssue(callback: (finding: ComplianceFinding) => void): void {
    this.onComplianceIssueCallbacks.push(callback);
  }

  // ========================================================================
  // 清理方法
  // ========================================================================

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.stopAutoManagement();
    this.onArchiveCallbacks = [];
    this.onPurgeCallbacks = [];
    this.onComplianceIssueCallbacks = [];
    this.policies.clear();
    this.classifications.clear();
    this.archiveTasks.clear();
    this.purgeTasks.clear();
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default RetentionManager;
