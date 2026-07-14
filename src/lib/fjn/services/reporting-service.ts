/**
 * Reporting Service - 报表聚合核心
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.10
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md §3.20
 *
 * 职责：
 *  - Sales / Order Report:  GMV、订单数、支付成功率
 *  - User Growth Report:    注册、激活、KYC 转化
 *  - Points / tFJ369:       积分账本聚合（发放、消耗、余额、过期）
 *  - Referral / Team / Node: 奖励链路
 *  - NFT / Power / Release: 链上对账
 *  - Finance / Tax:         分账、税务计提
 *  - Risk:                  事件、案件、冻结
 *  - Chain Asset:           链上/链下对账
 *
 * 全部报表数据写入 FjnReportSnapshot.reportData (JSONB)
 * 关键指标写入 FjnReportSnapshot.summary (JSONB)
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions, FjnTransactionClient } from './base';
import {
  REPORT_TYPE,
  REPORT_STATUS,
  REPORT_PERIOD_GRANULARITY,
  REPORT_EXPORT_FORMAT,
  REPORT_TRIGGER,
  REPORT_VISIBILITY,
  REPORT_DEFAULT_EXPIRES_DAYS,
  REPORT_MAX_SUMMARY_DEPTH,
  REPORT_TYPE_DEFAULT_GRANULARITY,
  REPORT_TYPE_DEFAULT_VISIBILITY,
  isValidReportType,
  isValidReportPeriodGranularity,
  isValidReportExportFormat,
  isValidReportTrigger,
  isValidReportVisibility,
  isValidReportStatus,
  isValidReportPeriod,
  inferPeriodGranularity,
  canTransitReportStatus,
  assertTransitReportStatus,
  isTerminalReportStatus,
  type FjnReportType,
  type FjnReportStatus,
  type FjnReportPeriodGranularity,
  type FjnReportExportFormat,
  type FjnReportTrigger,
  type FjnReportVisibility,
} from './reporting-state-machine';
import {
  REPORTING_EVENTS,
  type FjnReportingEvent,
  type FjnReportingEventSource,
  type ReportingEventPayload,
} from './reporting-events';
import {
  ReportTypeInvalidError,
  ReportTypeRequiredError,
  ReportPeriodInvalidError,
  ReportPeriodRequiredError,
  ReportGranularityInvalidError,
  ReportTriggerInvalidError,
  ReportVisibilityInvalidError,
  ReportExportFormatInvalidError,
  ReportNotFoundError,
  ReportAlreadyExistsError,
  ReportNoRequiredError,
  ReportStatusInvalidError,
  ReportNotReadyError,
  ReportExpiredError,
  ReportNotArchivableError,
  ReportArchiveFailedError,
  ReportVisibilityDeniedError,
  ReportGenerationFailedError,
  ReportExportFailedError,
  ReportDataSourceUnavailableError,
  ReportDataMissingError,
  ReportDataInvalidError,
  ReportSummaryInvalidError,
  ReportRequestedByRequiredError,
  ReportAnomalyThresholdInvalidError,
  ReportChainReconciliationMismatchError,
} from './reporting-errors';
import { FjnValidationError } from '../errors';

// ============================================================
// 1. 入参 / 出参类型
// ============================================================

/** 通用 list 入参 */
export interface ListReportInput {
  reportType?: FjnReportType;
  status?: FjnReportStatus;
  period?: string;
  granularity?: FjnReportPeriodGranularity;
  trigger?: FjnReportTrigger;
  visibility?: FjnReportVisibility;
  page?: number;
  pageSize?: number;
}

/** 创建报表请求 */
export interface CreateReportInput {
  reportType: FjnReportType;
  period: string;
  granularity?: FjnReportPeriodGranularity;
  trigger?: FjnReportTrigger;
  visibility?: FjnReportVisibility;
  requestedBy: string;
  /** 报表额外配置（dataSources / filters） */
  config?: Prisma.InputJsonValue;
  /** 报表业务参数（如币种、地区、节点ID） */
  params?: Prisma.InputJsonValue;
}

/** 生成报表（同步） */
export interface GenerateReportInput {
  reportId: string;
  /** 是否由 worker 触发（异步） */
  async?: boolean;
}

/** 进度上报 */
export interface ReportProgressInput {
  reportId: string;
  progress: number;
  stage: string;
}

/** 标记失败 */
export interface FailReportInput {
  reportId: string;
  errorMessage: string;
}

/** 标记成功 */
export interface CompleteReportInput {
  reportId: string;
  reportData: Prisma.InputJsonValue;
  summary?: Prisma.InputJsonValue;
  generatedBy?: string;
}

/** 导出报表 */
export interface ExportReportInput {
  reportId: string;
  format: FjnReportExportFormat;
  requestedBy: string;
}

/** 链上对账入参 */
export interface ChainReconciliationInput {
  period: string;
  assetType: 'token' | 'nft' | 'power' | 'release';
  /** 容差（小数），默认 0.0001 */
  tolerance?: string;
}

/** 异常检测入参 */
export interface DetectAnomalyInput {
  reportType: FjnReportType;
  period: string;
  /** 异常阈值倍数，默认 2.0 */
  thresholdMultiplier?: number;
  /** 指标名列表（不传则使用全部） */
  metrics?: string[];
}

/** 归档报表 */
export interface ArchiveReportInput {
  reportId: string;
  archivedBy: string;
  reason: string;
}

// ============================================================
// 2. 报表数据形状
// ============================================================

/** 销售报表数据 */
export interface SalesReportData {
  period: string;
  granularity: FjnReportPeriodGranularity;
  totals: {
    orderCount: number;
    paidOrderCount: number;
    cancelledOrderCount: number;
    refundedOrderCount: number;
    gmv: string; // 全部订单总额
    paidAmount: string;
    refundAmount: string;
    currency: string;
    paymentSuccessRate: string; // 0-1
    avgOrderAmount: string;
  };
  byPaymentMethod: Array<{
    method: string;
    orderCount: number;
    amount: string;
  }>;
  byRegion: Array<{
    region: string;
    orderCount: number;
    amount: string;
  }>;
  dailyBreakdown: Array<{
    date: string;
    orderCount: number;
    amount: string;
  }>;
}

/** 积分账本报表 */
export interface PointsReportData {
  period: string;
  granularity: FjnReportPeriodGranularity;
  totals: {
    totalAccounts: number;
    activeAccounts: number;
    issued: string;
    spent: string;
    converted: string;
    frozen: string;
    expired: string;
    reversed: string;
    netChange: string;
  };
  byRule: Array<{
    ruleId: string;
    ruleName: string;
    issued: string;
    spent: string;
  }>;
  byType: Array<{
    type: string; // earn | spend | convert | freeze | unfreeze | expire | reverse
    count: number;
    amount: string;
  }>;
  topHolders: Array<{
    userId: string;
    balance: string;
  }>;
}

/** 财务分账报表 */
export interface FinanceReportData {
  period: string;
  granularity: FjnReportPeriodGranularity;
  totals: {
    totalAllocated: string;
    totalReversed: string;
    netAllocated: string;
    payoutPending: string;
    payoutCompleted: string;
    currency: string;
  };
  byPool: Array<{
    poolType: string;
    allocated: string;
    reversed: string;
    pending: string;
    completed: string;
  }>;
  byChannel: Array<{
    channel: string; // 369 / aep / referral / team / node / etc.
    amount: string;
    ratio: string;
  }>;
}

/** 风险事件报表 */
export interface RiskReportData {
  period: string;
  granularity: FjnReportPeriodGranularity;
  totals: {
    eventCount: number;
    highRiskCount: number;
    blockedCount: number;
    frozenAssets: string;
    recoveredRewards: string;
  };
  byType: Array<{
    type: string;
    count: number;
  }>;
  bySeverity: Array<{
    severity: string; // low | medium | high | critical
    count: number;
  }>;
  topCases: Array<{
    caseId: string;
    type: string;
    userId: string;
    status: string;
    createdAt: string;
  }>;
}

/** 通用报表 data shape */
export interface GenericReportData {
  period: string;
  granularity: FjnReportPeriodGranularity;
  generatedAt: string;
  metrics: Record<string, number | string>;
  series?: Array<{ date: string; metrics: Record<string, number | string> }>;
  breakdown?: Array<{ key: string; metrics: Record<string, number | string> }>;
}

/** 链上对账结果 */
export interface ChainReconciliationResult {
  period: string;
  assetType: string;
  tolerance: string;
  totalChecked: number;
  matched: number;
  mismatched: number;
  mismatchDetails: Array<{
    recordId: string;
    refType: string;
    chainValue: string;
    dbValue: string;
    diff: string;
  }>;
  computedAt: string;
}

// ============================================================
// 3. Service 实现
// ============================================================

export class FjnReportingService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnReportingService' });
  }

  // ------------------------------------------------------------
  // 3.1 工具：outbox event
  // ------------------------------------------------------------
  private async emitEvent(
    tx: FjnTransactionClient,
    eventType: FjnReportingEvent,
    payload: ReportingEventPayload,
    source: FjnReportingEventSource = 'fjn.reporting.service',
  ): Promise<void> {
    await (tx as any).outboxEvent.create({
      data: {
        eventType,
        payload: {
          ...payload,
          occurred_at: new Date().toISOString(),
          source,
        } as Prisma.InputJsonValue,
        status: 'pending',
        retryCount: 0,
      },
    });
  }

  /** 业务编号 */
  private generateReportNo(reportType: FjnReportType, period: string): string {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `RPT-${reportType.toUpperCase()}-${period}-${ts}-${rand}`;
  }

  /** 计算过期时间 */
  private calcExpiresAt(days: number = REPORT_DEFAULT_EXPIRES_DAYS): Date {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  /** 入参基础校验 */
  private validateCreateInput(input: CreateReportInput): void {
    if (!input.requestedBy) throw new ReportRequestedByRequiredError();
    if (!input.reportType) throw new ReportTypeRequiredError();
    if (!isValidReportType(input.reportType)) {
      throw new ReportTypeInvalidError({ reportType: input.reportType });
    }
    if (!input.period) throw new ReportPeriodRequiredError();
    const granularity =
      input.granularity ?? REPORT_TYPE_DEFAULT_GRANULARITY[input.reportType];
    if (!isValidReportPeriodGranularity(granularity)) {
      throw new ReportGranularityInvalidError({ granularity });
    }
    if (!isValidReportPeriod(input.period, granularity)) {
      throw new ReportPeriodInvalidError({ period: input.period, granularity });
    }
    if (input.trigger && !isValidReportTrigger(input.trigger)) {
      throw new ReportTriggerInvalidError({ trigger: input.trigger });
    }
    if (input.visibility && !isValidReportVisibility(input.visibility)) {
      throw new ReportVisibilityInvalidError({ visibility: input.visibility });
    }
  }

  // ------------------------------------------------------------
  // 3.2 创建报表请求
  // ------------------------------------------------------------
  async createReport(input: CreateReportInput) {
    this.validateCreateInput(input);
    const granularity =
      input.granularity ?? REPORT_TYPE_DEFAULT_GRANULARITY[input.reportType];
    const trigger: FjnReportTrigger = input.trigger ?? REPORT_TRIGGER.MANUAL;
    const visibility: FjnReportVisibility =
      input.visibility ?? REPORT_TYPE_DEFAULT_VISIBILITY[input.reportType];

    return this.withTransaction(async (tx) => {
      // 幂等：同 type + period 仅允许一条 generating/ready
      const existing = await (tx as any).fjnReportSnapshot.findFirst({
        where: {
          reportType: input.reportType,
          period: input.period,
          status: { in: [REPORT_STATUS.GENERATING, REPORT_STATUS.READY] },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) {
        throw new ReportAlreadyExistsError({
          reportId: existing.id,
          reportNo: existing.reportNo,
          reportType: input.reportType,
          period: input.period,
        });
      }

      const reportNo = this.generateReportNo(input.reportType, input.period);
      const created = await (tx as any).fjnReportSnapshot.create({
        data: {
          reportNo,
          reportType: input.reportType,
          period: input.period,
          reportData: { placeholder: true, granularity } as Prisma.InputJsonValue,
          summary: { granularity, trigger, visibility } as Prisma.InputJsonValue,
          generatedBy: null,
        },
      });

      await this.emitEvent(tx, REPORTING_EVENTS.REQUESTED, {
        reportId: created.id,
        reportNo,
        reportType: input.reportType,
        period: input.period,
        granularity,
        trigger,
        requestedBy: input.requestedBy,
      });

      this.log('info', `Report requested: ${reportNo}`, {
        reportType: input.reportType,
        period: input.period,
        requestedBy: input.requestedBy,
      });

      return {
        id: created.id,
        reportNo,
        reportType: input.reportType,
        period: input.period,
        granularity,
        trigger,
        visibility,
        status: REPORT_STATUS.GENERATING,
        createdAt: created.createdAt,
        expiresAt: null,
        requestedBy: input.requestedBy,
      };
    });
  }

  // ------------------------------------------------------------
  // 3.3 查询
  // ------------------------------------------------------------
  async getReportById(reportId: string) {
    if (!reportId) throw new ReportNotFoundError({});
    const found = await (this.prisma as any).fjnReportSnapshot.findUnique({
      where: { id: reportId },
    });
    if (!found) throw new ReportNotFoundError({ reportId });
    return found;
  }

  async getReportByNo(reportNo: string) {
    if (!reportNo) throw new ReportNoRequiredError();
    const found = await (this.prisma as any).fjnReportSnapshot.findUnique({
      where: { reportNo },
    });
    if (!found) throw new ReportNotFoundError({ reportNo });
    return found;
  }

  async listReports(input: ListReportInput = {}) {
    const where: Record<string, unknown> = {};
    if (input.reportType) where.reportType = input.reportType;
    if (input.status) where.status = input.status;
    if (input.period) where.period = input.period;
    if (input.trigger) where.trigger = input.trigger;
    if (input.visibility) where.visibility = input.visibility;
    // granularity 是存在 summary JSONB 中
    if (input.granularity) {
      where.summary = { path: ['granularity'], equals: input.granularity };
    }

    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, input.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      (this.prisma as any).fjnReportSnapshot.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      (this.prisma as any).fjnReportSnapshot.count({ where }),
    ]);

    return {
      items: items.map((r: any) => this.shapeReport(r)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private shapeReport(r: any) {
    return {
      id: r.id,
      reportNo: r.reportNo,
      reportType: r.reportType,
      period: r.period,
      status: r.status,
      generatedBy: r.generatedBy,
      createdAt: r.createdAt,
      summary: r.summary ?? null,
    };
  }

  // ------------------------------------------------------------
  // 3.4 状态流转
  // ------------------------------------------------------------
  async markGenerating(reportId: string) {
    return this.withTransaction(async (tx) => {
      const r = await (tx as any).fjnReportSnapshot.findUnique({ where: { id: reportId } });
      if (!r) throw new ReportNotFoundError({ reportId });
      if (!isValidReportStatus(r.status)) {
        throw new ReportStatusInvalidError({ reportId, status: r.status });
      }
      // 由 FAILED → GENERATING 重试是允许的
      if (r.status !== REPORT_STATUS.FAILED) {
        throw new ReportStatusInvalidError({
          reportId,
          status: r.status,
          expected: REPORT_STATUS.FAILED,
        });
      }
      assertTransitReportStatus(r.status, REPORT_STATUS.GENERATING);

      const updated = await (tx as any).fjnReportSnapshot.update({
        where: { id: reportId },
        data: { reportData: { placeholder: true } as Prisma.InputJsonValue },
      });
      await this.emitEvent(tx, REPORTING_EVENTS.GENERATION_STARTED, {
        reportId,
        reportNo: r.reportNo,
        reportType: r.reportType,
        period: r.period,
        startedAt: new Date().toISOString(),
      });
      return updated;
    });
  }

  async reportProgress(input: ReportProgressInput) {
    return this.withTransaction(async (tx) => {
      const r = await (tx as any).fjnReportSnapshot.findUnique({ where: { id: input.reportId } });
      if (!r) throw new ReportNotFoundError({ reportId: input.reportId });
      if (r.status !== REPORT_STATUS.GENERATING) {
        throw new ReportStatusInvalidError({ reportId: input.reportId, status: r.status });
      }
      if (input.progress < 0 || input.progress > 100) {
        throw new FjnValidationError('Progress must be in 0-100', { progress: input.progress });
      }
      await this.emitEvent(tx, REPORTING_EVENTS.GENERATION_PROGRESS, {
        reportId: input.reportId,
        reportNo: r.reportNo,
        reportType: r.reportType,
        progress: input.progress,
        stage: input.stage,
      });
      return { reportId: input.reportId, progress: input.progress, stage: input.stage };
    });
  }

  async completeReport(input: CompleteReportInput) {
    if (!input.reportData) throw new ReportDataMissingError({ reportId: input.reportId });
    return this.withTransaction(async (tx) => {
      const r = await (tx as any).fjnReportSnapshot.findUnique({ where: { id: input.reportId } });
      if (!r) throw new ReportNotFoundError({ reportId: input.reportId });
      if (r.status !== REPORT_STATUS.GENERATING) {
        throw new ReportStatusInvalidError({ reportId: input.reportId, status: r.status });
      }
      assertTransitReportStatus(REPORT_STATUS.GENERATING, REPORT_STATUS.READY);

      const summary = (input.summary ?? r.summary ?? {}) as Record<string, unknown>;
      const granularity =
        (summary.granularity as FjnReportPeriodGranularity) ??
        inferPeriodGranularity(r.period);
      const recordCount = (input.reportData as any)?.recordCount
        ?? (input.reportData as any)?.totals?.orderCount
        ?? (input.reportData as any)?.totals?.eventCount
        ?? null;

      const updated = await (tx as any).fjnReportSnapshot.update({
        where: { id: input.reportId },
        data: {
          reportData: input.reportData,
          summary: {
            ...summary,
            granularity,
            recordCount,
            generatedBy: input.generatedBy ?? null,
            fileSizeBytes: this.estimateJsonSize(input.reportData),
            completedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
          generatedBy: input.generatedBy ?? null,
        },
      });

      await this.emitEvent(tx, REPORTING_EVENTS.READY, {
        reportId: input.reportId,
        reportNo: r.reportNo,
        reportType: r.reportType,
        period: r.period,
        granularity,
        generatedBy: input.generatedBy ?? null,
        recordCount: typeof recordCount === 'number' ? recordCount : 0,
        fileSizeBytes: this.estimateJsonSize(input.reportData),
        expiresAt: this.calcExpiresAt().toISOString(),
      });

      this.log('info', `Report ready: ${r.reportNo}`, {
        reportType: r.reportType,
        period: r.period,
      });

      return updated;
    });
  }

  async failReport(input: FailReportInput) {
    if (!input.errorMessage) {
      throw new ReportDataInvalidError({ reportId: input.reportId });
    }
    return this.withTransaction(async (tx) => {
      const r = await (tx as any).fjnReportSnapshot.findUnique({ where: { id: input.reportId } });
      if (!r) throw new ReportNotFoundError({ reportId: input.reportId });
      if (r.status !== REPORT_STATUS.GENERATING) {
        throw new ReportStatusInvalidError({ reportId: input.reportId, status: r.status });
      }
      assertTransitReportStatus(REPORT_STATUS.GENERATING, REPORT_STATUS.FAILED);
      const updated = await (tx as any).fjnReportSnapshot.update({
        where: { id: input.reportId },
        data: {
          summary: {
            ...((r.summary as any) ?? {}),
            errorMessage: input.errorMessage,
            failedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
      await this.emitEvent(tx, REPORTING_EVENTS.GENERATION_FAILED, {
        reportId: input.reportId,
        reportNo: r.reportNo,
        reportType: r.reportType,
        period: r.period,
        error: input.errorMessage,
        failedAt: new Date().toISOString(),
      });
      this.log('warn', `Report failed: ${r.reportNo}`, { error: input.errorMessage });
      return updated;
    });
  }

  async expireReport(reportId: string) {
    return this.withTransaction(async (tx) => {
      const r = await (tx as any).fjnReportSnapshot.findUnique({ where: { id: reportId } });
      if (!r) throw new ReportNotFoundError({ reportId });
      if (r.status !== REPORT_STATUS.READY) {
        throw new ReportStatusInvalidError({ reportId, status: r.status });
      }
      assertTransitReportStatus(REPORT_STATUS.READY, REPORT_STATUS.EXPIRED);
      const updated = await (tx as any).fjnReportSnapshot.update({
        where: { id: reportId },
        data: {
          summary: {
            ...((r.summary as any) ?? {}),
            expiredAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
      await this.emitEvent(tx, REPORTING_EVENTS.EXPIRED, {
        reportId,
        reportNo: r.reportNo,
        reportType: r.reportType,
        period: r.period,
        expiredAt: new Date().toISOString(),
      });
      return updated;
    });
  }

  async archiveReport(input: ArchiveReportInput) {
    if (!input.reason) {
      throw new ReportDataInvalidError({ reportId: input.reportId, missing: 'reason' });
    }
    return this.withTransaction(async (tx) => {
      const r = await (tx as any).fjnReportSnapshot.findUnique({ where: { id: input.reportId } });
      if (!r) throw new ReportNotFoundError({ reportId: input.reportId });
      if (r.status === REPORT_STATUS.GENERATING) {
        throw new ReportNotArchivableError({ reportId: input.reportId, status: r.status });
      }
      // 软删：在 summary 中标记 archived
      const updated = await (tx as any).fjnReportSnapshot.update({
        where: { id: input.reportId },
        data: {
          summary: {
            ...((r.summary as any) ?? {}),
            archived: true,
            archivedAt: new Date().toISOString(),
            archivedBy: input.archivedBy,
            archiveReason: input.reason,
          } as Prisma.InputJsonValue,
        },
      });
      await this.emitEvent(tx, REPORTING_EVENTS.ARCHIVED, {
        reportId: input.reportId,
        reportNo: r.reportNo,
        archivedBy: input.archivedBy,
        reason: input.reason,
      });
      return updated;
    });
  }

  // ------------------------------------------------------------
  // 3.5 报表生成器（具体类型）
  // ------------------------------------------------------------

  /** 销售报表 */
  async generateSalesReport(input: CreateReportInput): Promise<SalesReportData> {
    this.validateCreateInput(input);
    const granularity =
      input.granularity ?? REPORT_TYPE_DEFAULT_GRANULARITY[input.reportType];
    const { startAt, endAt } = this.periodToRange(input.period, granularity);

    const orders = await (this.prisma as any).fjnOrder.findMany({
      where: { createdAt: { gte: startAt, lte: endAt } },
      select: {
        id: true,
        orderNo: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        region: true,
        currency: true,
        createdAt: true,
      },
    });
    if (orders.length === 0) {
      throw new ReportDataSourceUnavailableError({
        reportType: input.reportType,
        period: input.period,
        reason: 'no orders in period',
      });
    }

    let orderCount = 0;
    let paidOrderCount = 0;
    let cancelledOrderCount = 0;
    let refundedOrderCount = 0;
    let gmv = 0;
    let paidAmount = 0;
    let refundAmount = 0;
    const paymentMap = new Map<string, { orderCount: number; amount: number }>();
    const regionMap = new Map<string, { orderCount: number; amount: number }>();
    const dayMap = new Map<string, { orderCount: number; amount: number }>();
    let currency = 'USD';

    for (const o of orders) {
      orderCount++;
      const amt = Number(o.totalAmount ?? 0);
      gmv += amt;
      if (o.status === 'paid' || o.status === 'fulfilled' || o.status === 'completed') {
        paidOrderCount++;
        paidAmount += amt;
      }
      if (o.status === 'cancelled') cancelledOrderCount++;
      if (o.status === 'refunded') {
        refundedOrderCount++;
        refundAmount += amt;
      }
      const method = o.paymentMethod ?? 'unknown';
      const pm = paymentMap.get(method) ?? { orderCount: 0, amount: 0 };
      pm.orderCount++;
      pm.amount += amt;
      paymentMap.set(method, pm);
      const region = o.region ?? 'GLOBAL';
      const rm = regionMap.get(region) ?? { orderCount: 0, amount: 0 };
      rm.orderCount++;
      rm.amount += amt;
      regionMap.set(region, rm);
      const dayKey = o.createdAt.toISOString().slice(0, 10);
      const dm = dayMap.get(dayKey) ?? { orderCount: 0, amount: 0 };
      dm.orderCount++;
      dm.amount += amt;
      dayMap.set(dayKey, dm);
      if (o.currency) currency = o.currency;
    }

    const result: SalesReportData = {
      period: input.period,
      granularity,
      totals: {
        orderCount,
        paidOrderCount,
        cancelledOrderCount,
        refundedOrderCount,
        gmv: gmv.toFixed(2),
        paidAmount: paidAmount.toFixed(2),
        refundAmount: refundAmount.toFixed(2),
        currency,
        paymentSuccessRate: orderCount > 0 ? (paidOrderCount / orderCount).toFixed(4) : '0.0000',
        avgOrderAmount: orderCount > 0 ? (gmv / orderCount).toFixed(2) : '0.00',
      },
      byPaymentMethod: Array.from(paymentMap.entries()).map(([method, v]) => ({
        method,
        orderCount: v.orderCount,
        amount: v.amount.toFixed(2),
      })),
      byRegion: Array.from(regionMap.entries())
        .map(([region, v]) => ({ region, orderCount: v.orderCount, amount: v.amount.toFixed(2) }))
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 50),
      dailyBreakdown: Array.from(dayMap.entries())
        .map(([date, v]) => ({ date, orderCount: v.orderCount, amount: v.amount.toFixed(2) }))
        .sort((a, b) => (a.date < b.date ? -1 : 1)),
    };
    return result;
  }

  /** 积分账本报表 */
  async generatePointsReport(input: CreateReportInput): Promise<PointsReportData> {
    this.validateCreateInput(input);
    const granularity =
      input.granularity ?? REPORT_TYPE_DEFAULT_GRANULARITY[input.reportType];
    const { startAt, endAt } = this.periodToRange(input.period, granularity);

    const ledgers = await (this.prisma as any).fjnPointsLedger.findMany({
      where: { createdAt: { gte: startAt, lte: endAt } },
      select: {
        id: true,
        userId: true,
        type: true,
        amount: true,
        ruleId: true,
        ruleName: true,
        balanceAfter: true,
        createdAt: true,
      },
    });

    let issued = 0;
    let spent = 0;
    let converted = 0;
    let frozen = 0;
    let expired = 0;
    let reversed = 0;
    const typeMap = new Map<string, { count: number; amount: number }>();
    const ruleMap = new Map<string, { ruleName: string; issued: number; spent: number }>();
    const userBalance = new Map<string, number>();

    for (const l of ledgers) {
      const amt = Number(l.amount ?? 0);
      const abs = Math.abs(amt);
      switch (l.type) {
        case 'earn': issued += amt; break;
        case 'spend': spent += abs; break;
        case 'convert': converted += abs; break;
        case 'freeze': frozen += abs; break;
        case 'unfreeze': frozen -= abs; break;
        case 'expire': expired += abs; break;
        case 'reverse': reversed += abs; break;
      }
      const tm = typeMap.get(l.type) ?? { count: 0, amount: 0 };
      tm.count++;
      tm.amount += amt;
      typeMap.set(l.type, tm);
      if (l.ruleId) {
        const rm = ruleMap.get(l.ruleId) ?? { ruleName: l.ruleName ?? l.ruleId, issued: 0, spent: 0 };
        if (l.type === 'earn') rm.issued += amt;
        if (l.type === 'spend') rm.spent += abs;
        ruleMap.set(l.ruleId, rm);
      }
      if (l.balanceAfter != null) {
        userBalance.set(l.userId, Number(l.balanceAfter));
      }
    }

    const topHolders = Array.from(userBalance.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([userId, balance]) => ({ userId, balance: balance.toFixed(2) }));

    const accountsCount = await (this.prisma as any).fjnPointsAccount.count();
    const activeAccountsCount = await (this.prisma as any).fjnPointsAccount.count({
      where: { status: 'active' },
    });

    return {
      period: input.period,
      granularity,
      totals: {
        totalAccounts: accountsCount,
        activeAccounts: activeAccountsCount,
        issued: issued.toFixed(2),
        spent: spent.toFixed(2),
        converted: converted.toFixed(2),
        frozen: frozen.toFixed(2),
        expired: expired.toFixed(2),
        reversed: reversed.toFixed(2),
        netChange: (issued - spent - expired).toFixed(2),
      },
      byRule: Array.from(ruleMap.entries())
        .map(([ruleId, v]) => ({
          ruleId,
          ruleName: v.ruleName,
          issued: v.issued.toFixed(2),
          spent: v.spent.toFixed(2),
        }))
        .slice(0, 50),
      byType: Array.from(typeMap.entries()).map(([type, v]) => ({
        type,
        count: v.count,
        amount: v.amount.toFixed(2),
      })),
      topHolders,
    };
  }

  /** 财务分账报表 */
  async generateFinanceReport(input: CreateReportInput): Promise<FinanceReportData> {
    this.validateCreateInput(input);
    const granularity =
      input.granularity ?? REPORT_TYPE_DEFAULT_GRANULARITY[input.reportType];
    const { startAt, endAt } = this.periodToRange(input.period, granularity);

    const allocations = await (this.prisma as any).fjnRevenueAllocation.findMany({
      where: { createdAt: { gte: startAt, lte: endAt } },
      select: {
        id: true,
        poolType: true,
        status: true,
        totalAmount: true,
        currency: true,
      },
    });

    let totalAllocated = 0;
    let totalReversed = 0;
    let payoutPending = 0;
    let payoutCompleted = 0;
    const poolMap = new Map<string, { allocated: number; reversed: number; pending: number; completed: number }>();
    const channelMap = new Map<string, { amount: number; ratio: number }>();
    let currency = 'FJ369';

    for (const a of allocations) {
      const amt = Number(a.totalAmount ?? 0);
      totalAllocated += amt;
      if (a.currency) currency = a.currency;
      if (a.status === 'reversed') totalReversed += amt;
      if (a.status === 'pending_approval' || a.status === 'risk_checking') payoutPending += amt;
      if (a.status === 'settled' || a.status === 'paid') payoutCompleted += amt;
      const pm = poolMap.get(a.poolType) ?? { allocated: 0, reversed: 0, pending: 0, completed: 0 };
      pm.allocated += amt;
      if (a.status === 'reversed') pm.reversed += amt;
      if (a.status === 'pending_approval' || a.status === 'risk_checking') pm.pending += amt;
      if (a.status === 'settled' || a.status === 'paid') pm.completed += amt;
      poolMap.set(a.poolType, pm);
    }

    return {
      period: input.period,
      granularity,
      totals: {
        totalAllocated: totalAllocated.toFixed(2),
        totalReversed: totalReversed.toFixed(2),
        netAllocated: (totalAllocated - totalReversed).toFixed(2),
        payoutPending: payoutPending.toFixed(2),
        payoutCompleted: payoutCompleted.toFixed(2),
        currency,
      },
      byPool: Array.from(poolMap.entries()).map(([poolType, v]) => ({
        poolType,
        allocated: v.allocated.toFixed(2),
        reversed: v.reversed.toFixed(2),
        pending: v.pending.toFixed(2),
        completed: v.completed.toFixed(2),
      })),
      byChannel: Array.from(channelMap.entries()).map(([channel, v]) => ({
        channel,
        amount: v.amount.toFixed(2),
        ratio: v.ratio.toFixed(4),
      })),
    };
  }

  /** 风控事件报表 */
  async generateRiskReport(input: CreateReportInput): Promise<RiskReportData> {
    this.validateCreateInput(input);
    const granularity =
      input.granularity ?? REPORT_TYPE_DEFAULT_GRANULARITY[input.reportType];
    const { startAt, endAt } = this.periodToRange(input.period, granularity);

    const events = await (this.prisma as any).fjnRiskEvent.findMany({
      where: { createdAt: { gte: startAt, lte: endAt } },
      select: {
        id: true,
        type: true,
        severity: true,
        status: true,
        userId: true,
        caseId: true,
        createdAt: true,
      },
    });

    const typeMap = new Map<string, number>();
    const severityMap = new Map<string, number>();
    let highRiskCount = 0;
    let blockedCount = 0;
    for (const e of events) {
      typeMap.set(e.type, (typeMap.get(e.type) ?? 0) + 1);
      severityMap.set(e.severity, (severityMap.get(e.severity) ?? 0) + 1);
      if (e.severity === 'high' || e.severity === 'critical') highRiskCount++;
      if (e.status === 'blocked') blockedCount++;
    }

    const topCases = events
      .filter((e: any) => !!e.caseId)
      .slice(0, 50)
      .map((e: any) => ({
        caseId: e.caseId,
        type: e.type,
        userId: e.userId,
        status: e.status,
        createdAt: e.createdAt.toISOString(),
      }));

    return {
      period: input.period,
      granularity,
      totals: {
        eventCount: events.length,
        highRiskCount,
        blockedCount,
        frozenAssets: '0.00', // 由独立 service 提供
        recoveredRewards: '0.00',
      },
      byType: Array.from(typeMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 30),
      bySeverity: Array.from(severityMap.entries()).map(([severity, count]) => ({
        severity,
        count,
      })),
      topCases,
    };
  }

  // ------------------------------------------------------------
  // 3.6 通用：end-to-end 同步生成
  // ------------------------------------------------------------
  async generateAndComplete(input: CreateReportInput): Promise<{
    reportId: string;
    reportNo: string;
    status: FjnReportStatus;
    data: Prisma.InputJsonValue;
    summary: Prisma.InputJsonValue;
  }> {
    const created = await this.createReport(input);
    try {
      let data: any;
      switch (input.reportType) {
        case REPORT_TYPE.SALES:
        case REPORT_TYPE.ORDER:
          data = await this.generateSalesReport(input);
          break;
        case REPORT_TYPE.POINTS:
        case REPORT_TYPE.TFJ369:
          data = await this.generatePointsReport(input);
          break;
        case REPORT_TYPE.FINANCE:
          data = await this.generateFinanceReport(input);
          break;
        case REPORT_TYPE.RISK:
          data = await this.generateRiskReport(input);
          break;
        default:
          data = await this.generateGenericReport(input);
      }
      const completed = await this.completeReport({
        reportId: created.id,
        reportData: data as Prisma.InputJsonValue,
        summary: {
          granularity: created.granularity,
          recordCount: (data as any)?.totals?.orderCount
            ?? (data as any)?.totals?.eventCount
            ?? (data as any)?.totals?.totalAccounts
            ?? null,
        } as Prisma.InputJsonValue,
        generatedBy: input.requestedBy,
      });
      return {
        reportId: created.id,
        reportNo: created.reportNo,
        status: REPORT_STATUS.READY,
        data: completed.reportData,
        summary: completed.summary,
      };
    } catch (e) {
      await this.failReport({
        reportId: created.id,
        errorMessage: (e as Error).message,
      }).catch(() => undefined);
      throw new ReportGenerationFailedError({
        reportId: created.id,
        reportNo: created.reportNo,
        error: (e as Error).message,
      });
    }
  }

  /** 通用报表（兜底） */
  async generateGenericReport(input: CreateReportInput): Promise<GenericReportData> {
    this.validateCreateInput(input);
    const granularity =
      input.granularity ?? REPORT_TYPE_DEFAULT_GRANULARITY[input.reportType];
    return {
      period: input.period,
      granularity,
      generatedAt: new Date().toISOString(),
      metrics: {
        note: 'Generic placeholder metrics',
        reportType: input.reportType,
      },
    };
  }

  // ------------------------------------------------------------
  // 3.7 导出
  // ------------------------------------------------------------
  async exportReport(input: ExportReportInput) {
    if (!isValidReportExportFormat(input.format)) {
      throw new ReportExportFormatInvalidError({ format: input.format });
    }
    const r = await this.getReportById(input.reportId);
    if (r.status !== REPORT_STATUS.READY) {
      throw new ReportNotReadyError({ reportId: input.reportId, status: r.status });
    }
    if ((r.summary as any)?.archived) {
      throw new ReportExpiredError({ reportId: input.reportId });
    }
    try {
      let content: string;
      let mime: string;
      switch (input.format) {
        case REPORT_EXPORT_FORMAT.JSON:
          content = JSON.stringify(r.reportData, null, 2);
          mime = 'application/json';
          break;
        case REPORT_EXPORT_FORMAT.CSV:
          content = this.jsonToCsv(r.reportData);
          mime = 'text/csv';
          break;
        case REPORT_EXPORT_FORMAT.XLSX:
          // XLSX/PDF 需要流式生成；这里只返回 JSON 描述
          content = JSON.stringify({ format: 'xlsx', note: 'use external worker' });
          mime = 'application/json';
          break;
        case REPORT_EXPORT_FORMAT.PDF:
          content = JSON.stringify({ format: 'pdf', note: 'use external worker' });
          mime = 'application/json';
          break;
        default:
          throw new ReportExportFormatInvalidError({ format: input.format });
      }
      return {
        reportId: input.reportId,
        reportNo: r.reportNo,
        format: input.format,
        mime,
        size: content.length,
        content,
        requestedBy: input.requestedBy,
      };
    } catch (e) {
      if (e instanceof FjnValidationError) throw e;
      throw new ReportExportFailedError({
        reportId: input.reportId,
        format: input.format,
        error: (e as Error).message,
      });
    }
  }

  /** 简化 JSON → CSV（仅对扁平结构有效） */
  private jsonToCsv(data: unknown): string {
    if (data == null) return '';
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      const first = data[0] as Record<string, unknown>;
      const headers = Object.keys(first);
      const lines = [headers.join(',')];
      for (const row of data) {
        const r = row as Record<string, unknown>;
        lines.push(headers.map((h) => this.csvEscape(r[h])).join(','));
      }
      return lines.join('\n');
    }
    if (typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      const lines = ['key,value'];
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'object' && v !== null) {
          lines.push(`${k},"${JSON.stringify(v).replace(/"/g, '""')}"`);
        } else {
          lines.push(`${k},${this.csvEscape(v)}`);
        }
      }
      return lines.join('\n');
    }
    return String(data);
  }

  private csvEscape(v: unknown): string {
    if (v == null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  // ------------------------------------------------------------
  // 3.8 异常检测
  // ------------------------------------------------------------
  async detectAnomalies(input: DetectAnomalyInput) {
    const threshold = input.thresholdMultiplier ?? 2.0;
    if (threshold <= 0) {
      throw new ReportAnomalyThresholdInvalidError({ threshold });
    }
    const granularity =
      inferPeriodGranularity(input.period);
    // 拉取近 7 期作为基线
    const baselinePeriods = this.buildBaselinePeriods(input.period, granularity, 7);
    const baseline = await (this.prisma as any).fjnReportSnapshot.findMany({
      where: {
        reportType: input.reportType,
        period: { in: baselinePeriods },
        status: REPORT_STATUS.READY,
      },
      select: { period: true, summary: true, reportData: true },
    });

    const current = await (this.prisma as any).fjnReportSnapshot.findFirst({
      where: {
        reportType: input.reportType,
        period: input.period,
        status: REPORT_STATUS.READY,
      },
      select: { summary: true, reportData: true },
    });
    if (!current) {
      throw new ReportNotFoundError({ period: input.period, reportType: input.reportType });
    }
    if (baseline.length === 0) {
      return { anomalies: [], message: 'No baseline data available' };
    }

    const currentMetrics = (current.reportData as any)?.totals ?? (current.reportData as any)?.metrics ?? {};
    const metricNames = input.metrics ?? Object.keys(currentMetrics);
    const anomalies: Array<{
      metric: string;
      expected: number;
      actual: number;
      diff: number;
      severity: string;
    }> = [];

    for (const m of metricNames) {
      const baselineValues: number[] = [];
      for (const b of baseline) {
        const bm = (b.reportData as any)?.totals ?? (b.reportData as any)?.metrics ?? {};
        const v = Number(bm[m]);
        if (Number.isFinite(v)) baselineValues.push(v);
      }
      if (baselineValues.length === 0) continue;
      const mean = baselineValues.reduce((s, v) => s + v, 0) / baselineValues.length;
      const std =
        Math.sqrt(
          baselineValues.reduce((s, v) => s + (v - mean) ** 2, 0) / baselineValues.length,
        ) || 1;
      const current = Number(currentMetrics[m]);
      if (!Number.isFinite(current)) continue;
      const z = (current - mean) / std;
      if (Math.abs(z) > threshold) {
        const severity = Math.abs(z) > 3 ? 'critical' : Math.abs(z) > 2.5 ? 'high' : 'medium';
        anomalies.push({
          metric: m,
          expected: Number(mean.toFixed(2)),
          actual: current,
          diff: Number((current - mean).toFixed(2)),
          severity,
        });
      }
    }

    if (anomalies.length > 0) {
      const tx = this.prisma;
      await (tx as any).outboxEvent.create({
        data: {
          eventType: REPORTING_EVENTS.ANOMALY_DETECTED,
          payload: {
            reportType: input.reportType,
            period: input.period,
            metric: anomalies.map((a) => a.metric).join(','),
            expected: 'baseline',
            actual: 'current',
            severity: anomalies.some((a) => a.severity === 'critical') ? 'critical' : 'high',
            occurred_at: new Date().toISOString(),
            source: 'fjn.reporting.service',
          } as Prisma.InputJsonValue,
          status: 'pending',
          retryCount: 0,
        },
      });
    }

    return { anomalies, baselineCount: baseline.length };
  }

  // ------------------------------------------------------------
  // 3.9 链上对账（占位逻辑）
  // ------------------------------------------------------------
  async chainReconciliation(input: ChainReconciliationInput): Promise<ChainReconciliationResult> {
    const tolerance = input.tolerance ?? '0.0001';
    const toleranceNum = Number(tolerance);
    if (!Number.isFinite(toleranceNum) || toleranceNum < 0) {
      throw new FjnValidationError('tolerance must be a non-negative number', { tolerance });
    }
    const { startAt, endAt } = this.periodToRange(input.period, REPORT_PERIOD_GRANULARITY.DAILY);
    const mismatches: ChainReconciliationResult['mismatchDetails'] = [];
    let totalChecked = 0;
    let matched = 0;
    let mismatched = 0;

    if (input.assetType === 'token' || input.assetType === 'power') {
      // 比对 token / power ledger 与 outbox 链上记录
      const ledgers =
        input.assetType === 'token'
          ? await (this.prisma as any).fjnTpointsLedger.findMany({
              where: { createdAt: { gte: startAt, lte: endAt } },
              select: { id: true, amount: true, type: true, refType: true, txHash: true },
            })
          : await (this.prisma as any).fjnPowerLedger.findMany({
              where: { createdAt: { gte: startAt, lte: endAt } },
              select: { id: true, amount: true, type: true, refType: true, txHash: true },
            });
      for (const l of ledgers) {
        totalChecked++;
        const chain = l.txHash ? Number(l.amount) : null;
        const db = Number(l.amount);
        if (chain == null) {
          mismatched++;
          mismatches.push({
            recordId: l.id,
            refType: l.refType ?? 'unknown',
            chainValue: 'no-tx-hash',
            dbValue: db.toFixed(8),
            diff: db.toFixed(8),
          });
          continue;
        }
        if (Math.abs(chain - db) > toleranceNum) {
          mismatched++;
          mismatches.push({
            recordId: l.id,
            refType: l.refType ?? 'unknown',
            chainValue: chain.toFixed(8),
            dbValue: db.toFixed(8),
            diff: (chain - db).toFixed(8),
          });
        } else {
          matched++;
        }
      }
    } else if (input.assetType === 'nft') {
      const nft = await (this.prisma as any).fjnNftAsset.findMany({
        where: { createdAt: { gte: startAt, lte: endAt } },
        select: { id: true, ownerId: true, chainMintAddress: true, status: true },
      });
      for (const n of nft) {
        totalChecked++;
        if (!n.chainMintAddress) {
          mismatched++;
          mismatches.push({
            recordId: n.id,
            refType: 'nft',
            chainValue: 'no-mint-address',
            dbValue: n.status,
            diff: 'missing',
          });
        } else {
          matched++;
        }
      }
    } else if (input.assetType === 'release') {
      const claims = await (this.prisma as any).fjnReleaseClaim.findMany({
        where: { createdAt: { gte: startAt, lte: endAt } },
        select: { id: true, amount: true, status: true, txHash: true },
      });
      for (const c of claims) {
        totalChecked++;
        if (c.status === 'claimed' && !c.txHash) {
          mismatched++;
          mismatches.push({
            recordId: c.id,
            refType: 'release_claim',
            chainValue: 'no-tx-hash',
            dbValue: c.amount,
            diff: c.amount,
          });
        } else {
          matched++;
        }
      }
    }

    await (this.prisma as any).outboxEvent.create({
      data: {
        eventType: mismatched > 0
          ? REPORTING_EVENTS.CHAIN_RECONCILIATION_MISMATCH
          : REPORTING_EVENTS.CHAIN_RECONCILIATION_DONE,
        payload: {
          period: input.period,
          matched,
          mismatched,
          totalChecked,
          occurred_at: new Date().toISOString(),
          source: 'fjn.reporting.service',
        } as Prisma.InputJsonValue,
        status: 'pending',
        retryCount: 0,
      },
    });

    if (mismatched > 0) {
      throw new ReportChainReconciliationMismatchError({
        period: input.period,
        assetType: input.assetType,
        mismatched,
      });
    }

    return {
      period: input.period,
      assetType: input.assetType,
      tolerance,
      totalChecked,
      matched,
      mismatched,
      mismatchDetails: mismatches,
      computedAt: new Date().toISOString(),
    };
  }

  // ------------------------------------------------------------
  // 3.10 工具
  // ------------------------------------------------------------

  /** period → 时间范围 */
  private periodToRange(
    period: string,
    granularity: FjnReportPeriodGranularity,
  ): { startAt: Date; endAt: Date } {
    switch (granularity) {
      case REPORT_PERIOD_GRANULARITY.DAILY: {
        const [y, m, d] = period.split('-').map(Number);
        const startAt = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
        const endAt = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
        return { startAt, endAt };
      }
      case REPORT_PERIOD_GRANULARITY.MONTHLY: {
        const [y, m] = period.split('-').map(Number);
        const startAt = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
        const endAt = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
        return { startAt, endAt };
      }
      case REPORT_PERIOD_GRANULARITY.QUARTERLY: {
        const [y, qStr] = period.split('-Q');
        const q = Number(qStr);
        const startMonth = (q - 1) * 3;
        const startAt = new Date(Date.UTC(Number(y), startMonth, 1, 0, 0, 0));
        const endAt = new Date(Date.UTC(Number(y), startMonth + 3, 0, 23, 59, 59, 999));
        return { startAt, endAt };
      }
      case REPORT_PERIOD_GRANULARITY.YEARLY: {
        const y = Number(period);
        const startAt = new Date(Date.UTC(y, 0, 1, 0, 0, 0));
        const endAt = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
        return { startAt, endAt };
      }
      case REPORT_PERIOD_GRANULARITY.WEEKLY: {
        // period: 2026-W27 → 推算周一开始
        const [yStr, wStr] = period.split('-W');
        const y = Number(yStr);
        const w = Number(wStr);
        // 简化：取 ISO 周
        const simple = new Date(Date.UTC(y, 0, 1 + (w - 1) * 7));
        const day = simple.getUTCDay();
        const ISOweekStart = new Date(simple);
        if (day <= 4) ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
        else ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
        const startAt = new Date(Date.UTC(
          ISOweekStart.getUTCFullYear(),
          ISOweekStart.getUTCMonth(),
          ISOweekStart.getUTCDate(),
          0, 0, 0,
        ));
        const endAt = new Date(startAt.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
        return { startAt, endAt };
      }
      default: {
        // CUSTOM: 当天 ± 15 天
        const startAt = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
        const endAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        return { startAt, endAt };
      }
    }
  }

  /** 基线周期（近 N 期） */
  private buildBaselinePeriods(
    currentPeriod: string,
    granularity: FjnReportPeriodGranularity,
    count: number,
  ): string[] {
    const periods: string[] = [];
    if (granularity === REPORT_PERIOD_GRANULARITY.DAILY) {
      const [y, m, d] = currentPeriod.split('-').map(Number);
      const cur = new Date(Date.UTC(y, m - 1, d));
      for (let i = 1; i <= count; i++) {
        const p = new Date(cur.getTime() - i * 24 * 60 * 60 * 1000);
        periods.push(p.toISOString().slice(0, 10));
      }
    } else if (granularity === REPORT_PERIOD_GRANULARITY.MONTHLY) {
      const [y, m] = currentPeriod.split('-').map(Number);
      const cur = new Date(Date.UTC(y, m - 1, 1));
      for (let i = 1; i <= count; i++) {
        const p = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() - i, 1));
        periods.push(`${p.getUTCFullYear()}-${String(p.getUTCMonth() + 1).padStart(2, '0')}`);
      }
    } else {
      periods.push(currentPeriod);
    }
    return periods;
  }

  /** 估算 JSON 体积（字节） */
  private estimateJsonSize(v: unknown): number {
    try {
      return Buffer.byteLength(JSON.stringify(v), 'utf8');
    } catch {
      return 0;
    }
  }
}

/** 工厂函数 */
export function createFjnReportingService(
  options?: FjnServiceOptions,
): FjnReportingService {
  return new FjnReportingService(options);
}
