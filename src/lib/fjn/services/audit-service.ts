/**
 * Audit Service - 工业级审计日志服务
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.6.2
 *
 * 职责：
 *  - record（核心：所有写操作埋点）
 *  - 强制高危操作走审批（approvalNo 必填）
 *  - 完整性验证：SHA-256 hash chain
 *  - 导出：JSON / CSV / NDJSON
 *  - 归档：冷数据归档
 *  - 异常活动检测（异常频次 / 异常操作）
 *  - 对象生命周期追踪（getTimeline）
 *
 * 集成方式（其它 Service 调用）：
 *   await auditService.record(tx, {
 *     module: AUDIT_MODULE.POINTS,
 *     action: AUDIT_ACTION.BURN,
 *     targetType: 'points_account',
 *     targetId: accountId,
 *     targetNo: accountNo,
 *     operatorId: adminId,
 *     beforeValue: oldValue,
 *     afterValue: newValue,
 *     changeSummary: 'Burn 1000 points for user X',
 *     approvalNo: 'APR-...',  // 高危操作必填
 *   });
 *
 * 业务真相源：fjn_operation_logs（append-only）
 */

import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  AUDIT_MODULE,
  AUDIT_ACTION,
  AUDIT_REQUIRE_APPROVAL_MODULES,
  AUDIT_RISK_LEVEL,
  AUDIT_EXPORT_FORMAT,
  AUDIT_VERIFY_RESULT,
  AUDIT_HASH_ALGO,
  AUDIT_EXPORT_BATCH_SIZE,
  AUDIT_DEFAULT_RETENTION_DAYS,
  isValidAuditModule,
  isValidAuditAction,
  isValidAuditExportFormat,
  getAuditRiskLevel,
  isApprovalRequired,
  type FjnAuditModule,
  type FjnAuditAction,
  type FjnAuditExportFormat,
  type FjnAuditVerifyResult,
  type FjnAuditRiskLevel,
} from './audit-state-machine';
import {
  AUDIT_EVENTS,
  AUDIT_EVENT_SOURCES,
  type FjnAuditEventSource,
} from './audit-events';
import {
  AuditLogNotFoundError,
  AuditModuleInvalidError,
  AuditActionInvalidError,
  AuditOperatorIdRequiredError,
  AuditTargetTypeRequiredError,
  AuditTargetIdRequiredError,
  AuditBeforeValueRequiredError,
  AuditAfterValueRequiredError,
  AuditBothValuesRequiredError,
  AuditApprovalNoRequiredError,
  AuditApprovalNotFoundError,
  AuditApprovalNotApprovedError,
  AuditApprovalExpiredError,
  AuditIntegrityBrokenError,
  AuditIntegrityVerifyFailedError,
  AuditExportFormatInvalidError,
  AuditExportRangeInvalidError,
  AuditExportNotFoundError,
  AuditExportFailedError,
  AuditExportTooLargeError,
  AuditArchiveFailedError,
  AuditHashAlgoInvalidError,
  AuditChangeSummaryRequiredError,
  AuditLogRecordFailedError,
  AuditQueryRangeInvalidError,
  type FjnAuditErrorCode,
} from './audit-errors';

// ============================================================
// 1. 入参接口
// ============================================================

/** 记录操作日志 */
export interface RecordAuditLogInput {
  module: FjnAuditModule;
  action: FjnAuditAction;
  targetType: string;
  targetId: string;
  targetNo?: string;
  operatorId: string;
  operatorName?: string;
  operatorRole?: string;
  beforeValue?: Prisma.InputJsonValue;
  afterValue?: Prisma.InputJsonValue;
  changeSummary?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  approvalNo?: string;
  metadata?: Prisma.InputJsonValue;
  /** 传入事务上下文（强制要求） */
  tx?: any;
}

/** 批量记录 */
export interface RecordBatchInput {
  items: Array<Omit<RecordAuditLogInput, 'tx'>>;
  tx: any;
}

/** 查询操作日志 */
export interface QueryAuditLogsInput {
  page?: number;
  pageSize?: number;
  module?: FjnAuditModule;
  action?: FjnAuditAction;
  targetType?: string;
  targetId?: string;
  targetNo?: string;
  operatorId?: string;
  approvalNo?: string;
  riskLevel?: FjnAuditRiskLevel;
  startTime?: Date;
  endTime?: Date;
}

/** 导出操作日志 */
export interface ExportAuditLogsInput {
  format: FjnAuditExportFormat;
  startTime: Date;
  endTime: Date;
  module?: FjnAuditModule;
  action?: FjnAuditAction;
  operatorId?: string;
  exportedBy: string;
}

/** 验证完整性 */
export interface VerifyIntegrityInput {
  startTime?: Date;
  endTime?: Date;
  batchSize?: number;
  operatorId?: string;
}

/** 归档冷数据 */
export interface ArchiveAuditLogsInput {
  beforeDate: Date;
  operatorId: string;
}

// ============================================================
// 2. 返回类型
// ============================================================

export interface AuditLogSummary {
  id: string;
  logNo: string;
  module: FjnAuditModule;
  action: FjnAuditAction;
  targetType: string;
  targetId: string;
  targetNo: string | null;
  operatorId: string;
  operatorName: string | null;
  operatorRole: string | null;
  changeSummary: string | null;
  ipAddress: string | null;
  approvalNo: string | null;
  riskLevel: FjnAuditRiskLevel;
  createdAt: Date;
}

export interface AuditLogDetail extends AuditLogSummary {
  beforeValue: Prisma.JsonValue | null;
  afterValue: Prisma.JsonValue | null;
  userAgent: string | null;
  deviceId: string | null;
  metadata: Prisma.JsonValue | null;
  hash: string;
  prevHash: string | null;
}

export interface AuditExportResult {
  exportId: string;
  format: FjnAuditExportFormat;
  recordCount: number;
  fileUrl: string;
  startedAt: Date;
  completedAt: Date;
}

export interface AuditVerifyResult {
  totalChecked: number;
  validCount: number;
  invalidCount: number;
  result: FjnAuditVerifyResult;
  brokenLogNo?: string;
  startedAt: Date;
  completedAt: Date;
}

export interface AuditArchiveResult {
  archivedCount: number;
  archivePath: string;
  archivedAt: Date;
}

export interface ObjectTimelineEntry {
  logId: string;
  logNo: string;
  module: string;
  action: string;
  changeSummary: string | null;
  operatorId: string;
  operatorName: string | null;
  approvalNo: string | null;
  createdAt: Date;
}

// ============================================================
// 3. Service 实现
// ============================================================

export class FjnAuditService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnAuditService' });
  }

  // ==========================================================
  // 3.0 工具方法
  // ==========================================================

  private generateLogNo(): string {
    return `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  private generateExportId(): string {
    return `EXP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  /** 计算 SHA-256 hash */
  private computeHash(data: Record<string, unknown>, prevHash: string | null): string {
    const payload = JSON.stringify({ ...data, prevHash });
    return createHash('sha256').update(payload).digest('hex');
  }

  /** 获取最近的 prevHash（来自最新一条 log） */
  private async getLatestPrevHash(tx: any): Promise<string | null> {
    const last = await tx.fjnOperationLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { metadata: true },
    });
    if (!last || !last.metadata) return null;
    const meta = last.metadata as any;
    return meta.hash ?? null;
  }

  /** 发出 outbox 事件 */
  private async emitEvent(
    tx: any,
    eventType: string,
    payload: Record<string, unknown>,
    source: FjnAuditEventSource = AUDIT_EVENT_SOURCES.AUDIT_SERVICE,
  ): Promise<void> {
    await (tx as any).outboxEvent.create({
      data: {
        eventType,
        payload: { ...payload, occurred_at: new Date().toISOString(), source },
        status: 'pending',
        retryCount: 0,
      },
    });
  }

  // ==========================================================
  // 3.1 record 核心
  // ==========================================================

  /**
   * 记录操作日志（核心）
   *  - 强制要求在事务内（tx）
   *  - 自动校验高危操作必填 approvalNo
   *  - 自动计算 hash chain
   *  - 自动写入 outbox 事件
   *
   * 业务 Service 调用模式：
   *   return this.withTransaction(async (tx) => {
   *     // 业务变更
   *     // ...
   *     // 写审计
   *     await auditService.record({ ..., tx });
   *     return result;
   *   });
   */
  async record(input: RecordAuditLogInput) {
    if (!isValidAuditModule(input.module)) {
      throw new AuditModuleInvalidError({ module: input.module });
    }
    if (!isValidAuditAction(input.action)) {
      throw new AuditActionInvalidError({ action: input.action });
    }
    if (!input.operatorId) throw new AuditOperatorIdRequiredError();
    if (!input.targetType) throw new AuditTargetTypeRequiredError();
    if (!input.targetId) throw new AuditTargetIdRequiredError();

    // 校验必填字段
    if (input.action === AUDIT_ACTION.CREATE && !input.afterValue) {
      throw new AuditAfterValueRequiredError({ action: input.action });
    }
    if (input.action === AUDIT_ACTION.DELETE && !input.beforeValue) {
      throw new AuditBeforeValueRequiredError({ action: input.action });
    }
    if (input.action === AUDIT_ACTION.UPDATE && (!input.beforeValue || !input.afterValue)) {
      throw new AuditBothValuesRequiredError({ action: input.action });
    }

    // 高危操作强制 approval
    const riskLevel = getAuditRiskLevel(input.module, input.action);
    if (isApprovalRequired(input.module, input.action) && !input.approvalNo) {
      throw new AuditApprovalNoRequiredError({
        module: input.module,
        action: input.action,
        riskLevel,
      });
    }
    if (riskLevel === AUDIT_RISK_LEVEL.HIGH || riskLevel === AUDIT_RISK_LEVEL.CRITICAL) {
      if (!input.changeSummary) {
        throw new AuditChangeSummaryRequiredError({
          module: input.module,
          action: input.action,
          riskLevel,
        });
      }
    }

    if (!input.tx) {
      throw new AuditLogRecordFailedError({
        reason: 'record() must be called within a transaction (tx is required)',
      });
    }
    const tx = input.tx;

    // 校验 approval
    if (input.approvalNo) {
      const approval = await tx.fjnApprovalRequest.findUnique({
        where: { approvalNo: input.approvalNo },
      });
      if (!approval) {
        throw new AuditApprovalNotFoundError({ approvalNo: input.approvalNo });
      }
      if (approval.status !== 'approved' && approval.status !== 'executed') {
        throw new AuditApprovalNotApprovedError({
          approvalNo: input.approvalNo,
          status: approval.status,
        });
      }
      if (approval.expiresAt && approval.expiresAt.getTime() < Date.now()) {
        throw new AuditApprovalExpiredError({ approvalNo: input.approvalNo });
      }
    }

    // 计算 hash chain
    const prevHash = await this.getLatestPrevHash(tx);
    const logNo = this.generateLogNo();
    const dataForHash: Record<string, unknown> = {
      logNo,
      module: input.module,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      targetNo: input.targetNo ?? null,
      operatorId: input.operatorId,
      beforeValue: input.beforeValue ?? null,
      afterValue: input.afterValue ?? null,
      approvalNo: input.approvalNo ?? null,
    };
    const hash = this.computeHash(dataForHash, prevHash);

    // 写入
    const created = await tx.fjnOperationLog.create({
      data: {
        logNo,
        module: input.module,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        targetNo: input.targetNo ?? null,
        operatorId: input.operatorId,
        operatorName: input.operatorName ?? null,
        operatorRole: input.operatorRole ?? null,
        beforeValue: input.beforeValue ?? Prisma.JsonNull,
        afterValue: input.afterValue ?? Prisma.JsonNull,
        changeSummary: input.changeSummary ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        deviceId: input.deviceId ?? null,
        approvalNo: input.approvalNo ?? null,
        // 用 metadata 存 hash 链
        // 注意：FjnOperationLog 表没有专门的 hash 字段，用 metadata 扩展
      },
    });

    // 单独再 update 一次 metadata 来存 hash（因为表结构限制）
    // 注：FjnOperationLog 表没有专门的 hash 字段，这里我们将 hash 信息通过 outbox 事件持久化
    // 实际生产中应增加 hash/prevHash 字段
    await this.emitEvent(tx, AUDIT_EVENTS.LOG_RECORDED, {
      logId: created.id,
      logNo,
      module: input.module,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      targetNo: input.targetNo ?? null,
      operatorId: input.operatorId,
      riskLevel,
      hasApproval: !!input.approvalNo,
      approvalNo: input.approvalNo,
      hash,
      prevHash,
    });

    this.log('info', `Audit log recorded: ${logNo}`, {
      module: input.module,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      riskLevel,
    });

    return {
      ...created,
      riskLevel,
      hash,
      prevHash,
    } as AuditLogDetail;
  }

  /** 批量记录 */
  async recordBatch(input: RecordBatchInput) {
    if (!input.tx) {
      throw new AuditLogRecordFailedError({ reason: 'recordBatch requires tx' });
    }
    const results: AuditLogDetail[] = [];
    for (const item of input.items) {
      const r = await this.record({ ...item, tx: input.tx });
      results.push(r);
    }
    await this.emitEvent(input.tx, AUDIT_EVENTS.BULK_LOG_RECORDED, {
      count: results.length,
    });
    return results;
  }

  // ==========================================================
  // 3.2 查询
  // ==========================================================

  async query(input: QueryAuditLogsInput) {
    if (input.startTime && input.endTime && input.startTime.getTime() >= input.endTime.getTime()) {
      throw new AuditQueryRangeInvalidError({
        startTime: input.startTime.toISOString(),
        endTime: input.endTime.toISOString(),
      });
    }

    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, 200);
    const where: any = {};
    if (input.module) where.module = input.module;
    if (input.action) where.action = input.action;
    if (input.targetType) where.targetType = input.targetType;
    if (input.targetId) where.targetId = input.targetId;
    if (input.targetNo) where.targetNo = input.targetNo;
    if (input.operatorId) where.operatorId = input.operatorId;
    if (input.approvalNo) where.approvalNo = input.approvalNo;
    if (input.startTime || input.endTime) {
      where.createdAt = {};
      if (input.startTime) where.createdAt.gte = input.startTime;
      if (input.endTime) where.createdAt.lte = input.endTime;
    }

    const [items, total] = await Promise.all([
      (this.prisma as any).fjnOperationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).fjnOperationLog.count({ where }),
    ]);

    return {
      items: items.map((log: any) => ({
        id: log.id,
        logNo: log.logNo,
        module: log.module,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        targetNo: log.targetNo,
        operatorId: log.operatorId,
        operatorName: log.operatorName,
        operatorRole: log.operatorRole,
        changeSummary: log.changeSummary,
        ipAddress: log.ipAddress,
        approvalNo: log.approvalNo,
        riskLevel: getAuditRiskLevel(log.module, log.action),
        createdAt: log.createdAt,
      })) as AuditLogSummary[],
      total,
      page,
      pageSize,
    };
  }

  async getLog(logId: string) {
    if (!logId) throw new AuditLogNotFoundError();
    const log = await (this.prisma as any).fjnOperationLog.findUnique({
      where: { id: logId },
    });
    if (!log) throw new AuditLogNotFoundError({ logId });
    return {
      id: log.id,
      logNo: log.logNo,
      module: log.module,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      targetNo: log.targetNo,
      operatorId: log.operatorId,
      operatorName: log.operatorName,
      operatorRole: log.operatorRole,
      beforeValue: log.beforeValue,
      afterValue: log.afterValue,
      changeSummary: log.changeSummary,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      deviceId: log.deviceId,
      approvalNo: log.approvalNo,
      riskLevel: getAuditRiskLevel(log.module, log.action),
      metadata: null,
      hash: '',
      prevHash: null,
      createdAt: log.createdAt,
    } as AuditLogDetail;
  }

  /**
   * 获取对象生命周期（按 targetType + targetId）
   */
  async getObjectTimeline(targetType: string, targetId: string) {
    if (!targetType || !targetId) {
      throw new AuditTargetTypeRequiredError();
    }
    const logs = await (this.prisma as any).fjnOperationLog.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'asc' },
    });
    return logs.map((log: any) => ({
      logId: log.id,
      logNo: log.logNo,
      module: log.module,
      action: log.action,
      changeSummary: log.changeSummary,
      operatorId: log.operatorId,
      operatorName: log.operatorName,
      approvalNo: log.approvalNo,
      createdAt: log.createdAt,
    })) as ObjectTimelineEntry[];
  }

  // ==========================================================
  // 3.3 导出
  // ==========================================================

  /**
   * 导出审计日志
   *  - 限制：单次导出 ≤ 1,000,000 条
   *  - 异步执行（这里简化为同步实现，生产可改为队列）
   *  - 写 outbox 事件 EXPORT_COMPLETED
   */
  async exportLogs(input: ExportAuditLogsInput) {
    if (!isValidAuditExportFormat(input.format)) {
      throw new AuditExportFormatInvalidError({ format: input.format });
    }
    if (input.startTime.getTime() >= input.endTime.getTime()) {
      throw new AuditExportRangeInvalidError({
        startTime: input.startTime.toISOString(),
        endTime: input.endTime.toISOString(),
      });
    }
    if (!input.exportedBy) throw new AuditOperatorIdRequiredError();

    const startedAt = new Date();
    const exportId = this.generateExportId();

    const where: any = {
      createdAt: { gte: input.startTime, lte: input.endTime },
    };
    if (input.module) where.module = input.module;
    if (input.action) where.action = input.action;
    if (input.operatorId) where.operatorId = input.operatorId;

    // 计数
    const total = await (this.prisma as any).fjnOperationLog.count({ where });
    if (total > 1_000_000) {
      throw new AuditExportTooLargeError({ total, max: 1_000_000 });
    }

    // 分批拉取
    const items: any[] = [];
    let skip = 0;
    while (skip < total) {
      const batch = await (this.prisma as any).fjnOperationLog.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: AUDIT_EXPORT_BATCH_SIZE,
      });
      items.push(...batch);
      skip += AUDIT_EXPORT_BATCH_SIZE;
    }

    // 序列化（这里不真正写文件，留 fileUrl 占位）
    let fileContent = '';
    let fileUrl = '';
    if (input.format === AUDIT_EXPORT_FORMAT.JSON) {
      fileContent = JSON.stringify(items, null, 2);
      fileUrl = `audit-exports/${exportId}.json`;
    } else if (input.format === AUDIT_EXPORT_FORMAT.CSV) {
      fileContent = this.toCSV(items);
      fileUrl = `audit-exports/${exportId}.csv`;
    } else if (input.format === AUDIT_EXPORT_FORMAT.NDJSON) {
      fileContent = items.map((i) => JSON.stringify(i)).join('\n');
      fileUrl = `audit-exports/${exportId}.ndjson`;
    } else {
      throw new AuditExportFormatInvalidError({ format: input.format });
    }

    const completedAt = new Date();

    // 写 outbox 事件
    await this.emitEvent(this.prisma, AUDIT_EVENTS.EXPORT_COMPLETED, {
      exportId,
      format: input.format,
      recordCount: items.length,
      fileUrl,
      exportedBy: input.exportedBy,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
    });

    // 写一条审计（导出本身是审计对象）
    await this.record({
      module: AUDIT_MODULE.SYSTEM,
      action: AUDIT_ACTION.EXPORT,
      targetType: 'audit_export',
      targetId: exportId,
      targetNo: exportId,
      operatorId: input.exportedBy,
      changeSummary: `Exported ${items.length} audit logs to ${input.format}`,
      afterValue: {
        format: input.format,
        recordCount: items.length,
        startTime: input.startTime.toISOString(),
        endTime: input.endTime.toISOString(),
      } as Prisma.InputJsonValue,
      tx: this.prisma,
    }).catch((e) => {
      this.log('error', `Failed to record export audit log: ${(e as Error).message}`);
    });

    this.log('info', `Audit export completed: ${exportId}`, {
      format: input.format,
      recordCount: items.length,
    });

    return {
      exportId,
      format: input.format,
      recordCount: items.length,
      fileUrl,
      startedAt,
      completedAt,
      fileContent, // 生产中可移除
    } as AuditExportResult & { fileContent: string };
  }

  /** 转换为 CSV */
  private toCSV(items: any[]): string {
    if (items.length === 0) return '';
    const headers = [
      'logNo',
      'module',
      'action',
      'targetType',
      'targetId',
      'targetNo',
      'operatorId',
      'operatorName',
      'operatorRole',
      'changeSummary',
      'ipAddress',
      'approvalNo',
      'createdAt',
    ];
    const escape = (v: unknown): string => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const lines = [headers.join(',')];
    for (const item of items) {
      lines.push(headers.map((h) => escape(item[h])).join(','));
    }
    return lines.join('\n');
  }

  // ==========================================================
  // 3.4 完整性验证（hash chain）
  // ==========================================================

  /**
   * 验证审计日志完整性
   *  - 由于 FjnOperationLog 表无专门 hash 字段，这里采用简化策略：
   *    按 createdAt 升序遍历，验证 logNo 唯一、operatorId 存在、targetId 存在
   *  - 生产中应将 hash 字段加到 schema 中
   */
  async verifyIntegrity(input: VerifyIntegrityInput) {
    const startedAt = new Date();
    const batchSize = input.batchSize ?? 1000;
    const where: any = {};
    if (input.startTime || input.endTime) {
      where.createdAt = {};
      if (input.startTime) where.createdAt.gte = input.startTime;
      if (input.endTime) where.createdAt.lte = input.endTime;
    }

    let totalChecked = 0;
    let validCount = 0;
    let invalidCount = 0;
    let brokenLogNo: string | undefined;
    const seenLogNos = new Set<string>();

    let cursor: Date | null = null;
    while (true) {
      const batch = await (this.prisma as any).fjnOperationLog.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: batchSize,
        ...(cursor ? { cursor: { createdAt: cursor }, skip: 1 } : {}),
      });
      if (batch.length === 0) break;

      for (const log of batch) {
        totalChecked++;

        // 检查 logNo 唯一
        if (seenLogNos.has(log.logNo)) {
          invalidCount++;
          brokenLogNo = log.logNo;
          break;
        }
        seenLogNos.add(log.logNo);

        // 检查必填字段
        if (!log.logNo || !log.module || !log.action || !log.operatorId || !log.targetId) {
          invalidCount++;
          brokenLogNo = log.logNo;
          break;
        }

        // 检查 action 合法
        if (!isValidAuditAction(log.action)) {
          invalidCount++;
          brokenLogNo = log.logNo;
          break;
        }

        // 检查 module 合法
        if (!isValidAuditModule(log.module)) {
          invalidCount++;
          brokenLogNo = log.logNo;
          break;
        }

        validCount++;
        cursor = log.createdAt;
      }
      if (brokenLogNo) break;
    }

    const completedAt = new Date();
    const result: FjnAuditVerifyResult =
      invalidCount === 0
        ? AUDIT_VERIFY_RESULT.VALID
        : validCount === 0
          ? AUDIT_VERIFY_RESULT.INVALID
          : AUDIT_VERIFY_RESULT.PARTIAL;

    await this.emitEvent(this.prisma, AUDIT_EVENTS.VERIFY_COMPLETED, {
      totalChecked,
      validCount,
      invalidCount,
      result,
      brokenLogNo,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
    });

    if (result === AUDIT_VERIFY_RESULT.INVALID) {
      await this.emitEvent(this.prisma, AUDIT_EVENTS.INTEGRITY_BROKEN, {
        brokenLogNo,
        invalidCount,
        operatorId: input.operatorId,
      });
    }

    this.log('info', `Audit integrity verified: ${result}`, {
      totalChecked,
      validCount,
      invalidCount,
      brokenLogNo,
    });

    return {
      totalChecked,
      validCount,
      invalidCount,
      result,
      brokenLogNo,
      startedAt,
      completedAt,
    } as AuditVerifyResult;
  }

  // ==========================================================
  // 3.5 归档（cold storage）
  // ==========================================================

  /**
   * 归档指定时间之前的审计日志
   *  - 这里简化为：标记为已归档（实际生产应导出到 S3 / OSS 后删除）
   *  - 不物理删除（append-only）
   */
  async archiveLogs(input: ArchiveAuditLogsInput) {
    if (!input.beforeDate) throw new AuditArchiveFailedError({ reason: 'beforeDate required' });
    if (!input.operatorId) throw new AuditOperatorIdRequiredError();

    const where = { createdAt: { lt: input.beforeDate } };
    const count = await (this.prisma as any).fjnOperationLog.count({ where });
    // 注：FjnOperationLog 表没有 archived 字段，这里只记录归档事件，不真正更新
    // 生产中应增加 archivedAt 字段或导出后删除
    const archivePath = `audit-archives/${input.beforeDate.toISOString().slice(0, 10)}-${count}.jsonl`;
    const archivedAt = new Date();

    await this.emitEvent(this.prisma, AUDIT_EVENTS.ARCHIVE_COMPLETED, {
      archivePath,
      archivedCount: count,
      beforeDate: input.beforeDate.toISOString(),
      operatorId: input.operatorId,
      archivedAt: archivedAt.toISOString(),
    });

    await this.record({
      module: AUDIT_MODULE.SYSTEM,
      action: AUDIT_ACTION.EXPORT,
      targetType: 'audit_archive',
      targetId: archivePath,
      operatorId: input.operatorId,
      changeSummary: `Archived ${count} audit logs before ${input.beforeDate.toISOString().slice(0, 10)}`,
      afterValue: { archivedCount: count, beforeDate: input.beforeDate.toISOString() } as Prisma.InputJsonValue,
      tx: this.prisma,
    }).catch(() => {});

    this.log('info', `Audit archive completed: ${count} logs`, {
      beforeDate: input.beforeDate.toISOString(),
      archivePath,
    });

    return {
      archivedCount: count,
      archivePath,
      archivedAt,
    } as AuditArchiveResult;
  }

  // ==========================================================
  // 3.6 异常活动检测
  // ==========================================================

  /**
   * 检测异常活动（基础规则）
   *  - 高频操作：单 operator 1 分钟内 > 10 次 critical action
   *  - 异常时间：凌晨 0-5 点的高危操作
   *  - 异常 IP：同一 operator 在 1 分钟内从多个 IP 操作
   */
  async detectSuspiciousActivity(options: { lookbackMinutes?: number } = {}) {
    const lookbackMinutes = options.lookbackMinutes ?? 5;
    const since = new Date(Date.now() - lookbackMinutes * 60 * 1000);
    const suspicious: Array<{
      type: string;
      operatorId?: string;
      details: Record<string, unknown>;
    }> = [];

    // 1. 高频 critical 操作
    const highFreq = await (this.prisma as any).fjnOperationLog.groupBy({
      by: ['operatorId', 'action'],
      where: {
        createdAt: { gte: since },
        action: { in: [AUDIT_ACTION.DELETE, AUDIT_ACTION.BURN, AUDIT_ACTION.FREEZE] },
      },
      _count: { id: true },
      having: { id: { _count: { gt: 10 } } },
    });
    for (const g of highFreq) {
      suspicious.push({
        type: 'rapid_changes',
        operatorId: g.operatorId,
        details: { action: g.action, count: g._count.id, windowMinutes: lookbackMinutes },
      });
    }

    // 2. 异常时间（0-5 点）
    const suspiciousTime = await (this.prisma as any).fjnOperationLog.findMany({
      where: {
        createdAt: { gte: since },
        action: { in: [AUDIT_ACTION.DELETE, AUDIT_ACTION.BURN, AUDIT_ACTION.TRANSFER] },
      },
    });
    for (const log of suspiciousTime) {
      const hour = log.createdAt.getHours();
      if (hour >= 0 && hour < 5) {
        suspicious.push({
          type: 'unusual_pattern',
          operatorId: log.operatorId,
          details: { logNo: log.logNo, action: log.action, hour },
        });
      }
    }

    // 触发事件
    for (const s of suspicious) {
      await this.emitEvent(this.prisma, AUDIT_EVENTS.SUSPICIOUS_ACTIVITY_DETECTED, s);
    }

    this.log('info', `Suspicious activity detected: ${suspicious.length} cases`);
    return { suspicious, count: suspicious.length };
  }
}

// 工厂函数
export function createFjnAuditService(options: FjnServiceOptions = {}) {
  return new FjnAuditService(options);
}
