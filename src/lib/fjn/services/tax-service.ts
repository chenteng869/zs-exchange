/**
 * FJN Tax Service - 核心业务服务
 *
 * 严格遵循 H033 + H015 工业级职责规范：
 *  - 税务规则 (FjnTaxRule)：CRUD + 状态机转移 + 唯一性约束
 *  - 税务记录 (FjnTaxRecord)：基于规则计算 + 状态机（reserved/paid/adjusted/reversed）
 *  - 税务报表 (FjnTaxReport)：周期聚合 + 提交/支付/驳回
 *  - 含税/不含税两种计算模式
 *  - 与 Order/Payment/Finance Service 联动（事件驱动）
 *
 * 业务规则：
 *  - 规则：unique(ruleCode, regionCode, effectiveFrom)
 *  - 记录：unique recordNo
 *  - 报表：unique reportNo
 *  - 计算：inclusive（从总额反推净额）vs exclusive（净额 * 税率）
 *  - 状态机：所有状态变更必须经过白名单校验
 *  - 终态：reversed（记录）| paid（报表）| archived（规则）| rejected（报表）
 *
 * 用法：
 *   const svc = new FjnTaxService();
 *   const rule = await svc.createRule({ ruleCode, taxType, regionCode, taxRate, ... });
 *   const calc = await svc.calculateTax({ ruleId, taxableAmount, taxMode, currency });
 *   const record = await svc.recordTax({ ruleId, sourceType, sourceId, taxableAmount, ... });
 *   const report = await svc.createReport({ regionCode, reportPeriod, taxType, ... });
 */

import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  TAX_RULE_STATUS,
  TAX_RECORD_STATUS,
  TAX_REPORT_STATUS,
  TAX_TYPES,
  TAX_MODE,
  isTaxRuleUsable,
  isTaxRecordPayable,
  isTaxReportSubmittable,
  assertTransitTaxRuleStatus,
  assertTransitTaxRecordStatus,
  assertTransitTaxReportStatus,
  FjnTaxRuleStatus,
  FjnTaxRecordStatus,
  FjnTaxReportStatus,
  FjnTaxType,
  FjnTaxMode,
} from './tax-state-machine';
import {
  TAX_EVENTS,
  TAX_EVENT_SOURCES,
  TaxRuleCreatedPayload,
  TaxRuleUpdatedPayload,
  TaxRuleArchivedPayload,
  TaxCalculatedPayload,
  TaxRecordedPayload,
  TaxPaidPayload,
  TaxAdjustedPayload,
  TaxReversedPayload,
  TaxReportCreatedPayload,
  TaxReportSubmittedPayload,
  TaxReportPaidPayload,
  TaxReportRejectedPayload,
  FjnTaxEventSource,
} from './tax-events';
import {
  FjnTaxRuleNotFoundError,
  FjnTaxRuleAlreadyExistsError,
  FjnTaxRuleNotActiveError,
  FjnTaxRuleInvalidRateError,
  FjnTaxRuleEffectiveInvalidError,
  FjnTaxRuleArchivedError,
  FjnTaxRuleCodeRequiredError,
  FjnTaxTypeRequiredError,
  FjnTaxCurrencyRequiredError,
  FjnTaxRecordNotFoundError,
  FjnTaxRecordAlreadyExistsError,
  FjnTaxRecordStatusInvalidError,
  FjnTaxRecordNotPayableError,
  FjnTaxRecordNotAdjustableError,
  FjnTaxRecordNotReversibleError,
  FjnTaxRecordTaxableInvalidError,
  FjnTaxRecordTaxAmountInvalidError,
  FjnTaxRecordTaxRateMismatchError,
  FjnTaxAmountInvalidError,
  FjnTaxCurrencyMismatchError,
  FjnTaxRateInvalidError,
  FjnTaxModeInvalidError,
  FjnTaxReportNotFoundError,
  FjnTaxReportAlreadyExistsError,
  FjnTaxReportStatusInvalidError,
  FjnTaxReportNotSubmittableError,
  FjnTaxReportNotPayableError,
  FjnTaxReportPeriodInvalidError,
  FjnTaxReportNoRecordsError,
  FjnTaxReportSubmissionFailedError,
  FjnTaxCountryNotSupportedError,
  FjnTaxRegionNotSupportedError,
  FjnTaxReasonRequiredError,
  FjnTaxApproverRequiredError,
} from './tax-errors';

// ============================================================
// 1. 公共类型定义
// ============================================================

/** Decimal 精度配置（与 H015 一致：36 位精度，HALF_EVEN 舍入） */
Decimal.set({ precision: 36, rounding: Decimal.ROUND_HALF_EVEN });

/** 入参：创建税务规则 */
export interface CreateTaxRuleInput {
  ruleCode: string;
  taxType: FjnTaxType;
  regionCode: string;
  taxRate: string; // 0.13 表示 13%
  taxMode?: FjnTaxMode;
  applicableScope?: Record<string, unknown>;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string | null;
  description?: string;
  operatorId?: string;
}

/** 入参：更新税务规则 */
export interface UpdateTaxRuleInput {
  taxRate?: string;
  taxMode?: FjnTaxMode;
  applicableScope?: Record<string, unknown>;
  effectiveTo?: Date | string | null;
  description?: string;
  operatorId?: string;
}

/** 入参：归档税务规则 */
export interface ArchiveTaxRuleInput {
  reason: string;
  operatorId?: string;
}

/** 入参：计算税额（不落库） */
export interface CalculateTaxInput {
  ruleId?: string;
  ruleCode?: string;
  regionCode?: string;
  taxType?: FjnTaxType;
  taxableAmount: string; // 净额（不含税）
  totalAmount?: string; // 总额（含税）— inclusive 模式必填
  currency: string;
  taxMode: FjnTaxMode;
  sourceType?: string;
  sourceId?: string;
  source?: FjnTaxEventSource;
}

/** 入参：记录税务（计算 + 落库 reserved） */
export interface RecordTaxInput {
  ruleId: string;
  sourceType: string; // order | payment | commission | etc.
  sourceId: string;
  orderId?: string;
  userId?: string;
  taxableAmount: string;
  taxMode?: FjnTaxMode; // 默认沿用规则
  taxAmount?: string; // 默认重算
  currency?: string; // 默认沿用规则
  reportPeriod?: string; // YYYY-MM
  description?: string;
  source?: FjnTaxEventSource;
  operatorId?: string;
}

/** 入参：标记税务记录已支付 */
export interface MarkTaxPaidInput {
  paidAt?: Date;
  operatorId?: string;
}

/** 入参：调整税务记录 */
export interface AdjustTaxInput {
  adjustedTaxableAmount: string;
  adjustedTaxRate: string;
  reason: string;
  operatorId?: string;
}

/** 入参：冲销税务记录 */
export interface ReverseTaxInput {
  reason: string;
  operatorId?: string;
}

/** 入参：创建税务报表 */
export interface CreateTaxReportInput {
  regionCode: string;
  reportPeriod: string; // YYYY-MM
  taxType: FjnTaxType;
  currency?: string;
  source?: FjnTaxEventSource;
  operatorId?: string;
}

/** 入参：提交税务报表 */
export interface SubmitTaxReportInput {
  approverId: string;
  operatorId?: string;
}

/** 入参：标记报表已支付 */
export interface MarkReportPaidInput {
  paidAt?: Date;
  operatorId?: string;
}

/** 入参：驳回报表 */
export interface RejectReportInput {
  reason: string;
  operatorId?: string;
}

/** 输出：计算结果（纯计算，不落库） */
export interface TaxCalculationResult {
  rule_id: string;
  rule_code: string;
  tax_type: FjnTaxType;
  region_code: string;
  currency: string;
  tax_mode: FjnTaxMode;
  taxable_amount: string;
  tax_rate: string;
  tax_amount: string;
  total_amount: string;
}

// ============================================================
// 2. TaxService 主体
// ============================================================

export class FjnTaxService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnTaxService' });
  }

  // ============================================================
  // 2.1 规则域
  // ============================================================

  /** 创建税务规则 */
  async createRule(input: CreateTaxRuleInput): Promise<Record<string, unknown>> {
    if (!input.ruleCode) throw new FjnTaxRuleCodeRequiredError({});
    if (!input.taxType) throw new FjnTaxTypeRequiredError({});
    if (!ALL_TAX_TYPE_VALUES.includes(input.taxType)) {
      throw new FjnTaxTypeRequiredError({ value: input.taxType });
    }
    if (!input.regionCode) throw new FjnTaxRegionNotSupportedError({ regionCode: input.regionCode });
    const rate = new Decimal(input.taxRate);
    if (rate.isNaN() || rate.lt(0) || rate.gt(1)) {
      throw new FjnTaxRuleInvalidRateError({ taxRate: input.taxRate });
    }
    const effectiveFrom = new Date(input.effectiveFrom);
    if (isNaN(effectiveFrom.getTime())) {
      throw new FjnTaxRuleEffectiveInvalidError({ effectiveFrom: String(input.effectiveFrom) });
    }
    let effectiveTo: Date | null = null;
    if (input.effectiveTo != null && input.effectiveTo !== undefined) {
      effectiveTo = new Date(input.effectiveTo);
      if (isNaN(effectiveTo.getTime())) {
        throw new FjnTaxRuleEffectiveInvalidError({ effectiveTo: String(input.effectiveTo) });
      }
      if (effectiveTo <= effectiveFrom) {
        throw new FjnTaxRuleEffectiveInvalidError({
          reason: 'effectiveTo must be > effectiveFrom',
          effectiveFrom: effectiveFrom.toISOString(),
          effectiveTo: effectiveTo.toISOString(),
        });
      }
    }
    const taxMode = input.taxMode ?? TAX_MODE.EXCLUSIVE;
    if (taxMode !== TAX_MODE.INCLUSIVE && taxMode !== TAX_MODE.EXCLUSIVE) {
      throw new FjnTaxModeInvalidError({ taxMode });
    }

    return this.withTransaction(async (tx) => {
      // 唯一性：ruleCode + regionCode + effectiveFrom
      const existing = await tx.fjnTaxRule.findFirst({
        where: {
          ruleCode: input.ruleCode,
          regionCode: input.regionCode,
          effectiveFrom,
        },
      });
      if (existing) {
        throw new FjnTaxRuleAlreadyExistsError({
          ruleCode: input.ruleCode,
          regionCode: input.regionCode,
          effectiveFrom: effectiveFrom.toISOString(),
        });
      }

      const created = await tx.fjnTaxRule.create({
        data: {
          ruleCode: input.ruleCode,
          taxType: input.taxType,
          regionCode: input.regionCode,
          taxRate: new Prisma.Decimal(input.taxRate),
          taxMode,
          applicableScope: (input.applicableScope as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          effectiveFrom,
          effectiveTo,
          status: TAX_RULE_STATUS.ACTIVE,
          description: input.description ?? null,
        },
      });

      const payload: TaxRuleCreatedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? TAX_EVENT_SOURCES.ADMIN : TAX_EVENT_SOURCES.SYSTEM,
        rule_id: created.id,
        rule_code: created.ruleCode,
        tax_type: created.taxType as FjnTaxType,
        region_code: created.regionCode,
        tax_rate: created.taxRate.toString(),
        tax_mode: created.taxMode as FjnTaxMode,
        status: created.status as FjnTaxRuleStatus,
      };
      await this.emitOutboxEvent(tx, TAX_EVENTS.RULE_CREATED, payload as unknown as Record<string, unknown>);

      return this.formatRule(created);
    });
  }

  /** 按 ID 查询规则 */
  async findRuleById(id: string): Promise<Record<string, unknown> | null> {
    const r = await this.prisma.fjnTaxRule.findUnique({ where: { id } });
    return r ? this.formatRule(r) : null;
  }

  /** 按 code + region 查询规则（最新激活） */
  async findActiveRule(params: {
    ruleCode: string;
    regionCode: string;
    atDate?: Date;
  }): Promise<Record<string, unknown> | null> {
    const at = params.atDate ?? new Date();
    const r = await this.prisma.fjnTaxRule.findFirst({
      where: {
        ruleCode: params.ruleCode,
        regionCode: params.regionCode,
        status: TAX_RULE_STATUS.ACTIVE,
        effectiveFrom: { lte: at },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
    return r ? this.formatRule(r) : null;
  }

  /** 列出规则 */
  async listRules(params: {
    taxType?: FjnTaxType;
    regionCode?: string;
    status?: FjnTaxRuleStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Record<string, unknown>[]; total: number }> {
    const where: Prisma.FjnTaxRuleWhereInput = {};
    if (params.taxType) where.taxType = params.taxType;
    if (params.regionCode) where.regionCode = params.regionCode;
    if (params.status) where.status = params.status;
    const [items, total] = await Promise.all([
      this.prisma.fjnTaxRule.findMany({
        where,
        orderBy: { effectiveFrom: 'desc' },
        take: params.limit ?? 50,
        skip: params.offset ?? 0,
      }),
      this.prisma.fjnTaxRule.count({ where }),
    ]);
    return { items: items.map((r) => this.formatRule(r)), total };
  }

  /** 更新规则（不影响状态机） */
  async updateRule(id: string, input: UpdateTaxRuleInput): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const rule = await tx.fjnTaxRule.findUnique({ where: { id } });
      if (!rule) throw new FjnTaxRuleNotFoundError({ id });
      if (rule.status === TAX_RULE_STATUS.ARCHIVED) {
        throw new FjnTaxRuleArchivedError({ id });
      }
      const data: Prisma.FjnTaxRuleUpdateInput = {};
      const changes: Record<string, unknown> = {};
      if (input.taxRate !== undefined) {
        const rate = new Decimal(input.taxRate);
        if (rate.isNaN() || rate.lt(0) || rate.gt(1)) {
          throw new FjnTaxRuleInvalidRateError({ taxRate: input.taxRate });
        }
        data.taxRate = new Prisma.Decimal(input.taxRate);
        changes.tax_rate = input.taxRate;
      }
      if (input.taxMode !== undefined) {
        if (input.taxMode !== TAX_MODE.INCLUSIVE && input.taxMode !== TAX_MODE.EXCLUSIVE) {
          throw new FjnTaxModeInvalidError({ taxMode: input.taxMode });
        }
        data.taxMode = input.taxMode;
        changes.tax_mode = input.taxMode;
      }
      if (input.applicableScope !== undefined) {
        data.applicableScope = input.applicableScope as Prisma.InputJsonValue;
        changes.applicable_scope = input.applicableScope;
      }
      if (input.effectiveTo !== undefined && input.effectiveTo !== null) {
        const et = new Date(input.effectiveTo);
        if (isNaN(et.getTime())) {
          throw new FjnTaxRuleEffectiveInvalidError({ effectiveTo: String(input.effectiveTo) });
        }
        if (et <= rule.effectiveFrom) {
          throw new FjnTaxRuleEffectiveInvalidError({ reason: 'effectiveTo must be > effectiveFrom' });
        }
        data.effectiveTo = et;
        changes.effective_to = et.toISOString();
      }
      if (input.description !== undefined) {
        data.description = input.description;
        changes.description = input.description;
      }
      if (Object.keys(data).length === 0) {
        return this.formatRule(rule);
      }
      const updated = await tx.fjnTaxRule.update({ where: { id }, data });
      const payload: TaxRuleUpdatedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? TAX_EVENT_SOURCES.ADMIN : TAX_EVENT_SOURCES.SYSTEM,
        rule_id: updated.id,
        rule_code: updated.ruleCode,
        changes,
      };
      await this.emitOutboxEvent(tx, TAX_EVENTS.RULE_UPDATED, payload as unknown as Record<string, unknown>);
      return this.formatRule(updated);
    });
  }

  /** 归档规则（active/inactive -> archived） */
  async archiveRule(id: string, input: ArchiveTaxRuleInput): Promise<Record<string, unknown>> {
    if (!input.reason) throw new FjnTaxReasonRequiredError({ context: 'archive_rule' });
    return this.withTransaction(async (tx) => {
      const rule = await tx.fjnTaxRule.findUnique({ where: { id } });
      if (!rule) throw new FjnTaxRuleNotFoundError({ id });
      assertTransitTaxRuleStatus(
        rule.status as FjnTaxRuleStatus,
        TAX_RULE_STATUS.ARCHIVED,
      );
      const updated = await tx.fjnTaxRule.update({
        where: { id },
        data: { status: TAX_RULE_STATUS.ARCHIVED },
      });
      const payload: TaxRuleArchivedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? TAX_EVENT_SOURCES.ADMIN : TAX_EVENT_SOURCES.SYSTEM,
        rule_id: updated.id,
        rule_code: updated.ruleCode,
        reason: input.reason,
      };
      await this.emitOutboxEvent(tx, TAX_EVENTS.RULE_ARCHIVED, payload as unknown as Record<string, unknown>);
      return this.formatRule(updated);
    });
  }

  /** 停用规则（active -> inactive） */
  async deactivateRule(id: string, input: { reason?: string; operatorId?: string }): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const rule = await tx.fjnTaxRule.findUnique({ where: { id } });
      if (!rule) throw new FjnTaxRuleNotFoundError({ id });
      assertTransitTaxRuleStatus(
        rule.status as FjnTaxRuleStatus,
        TAX_RULE_STATUS.INACTIVE,
      );
      const updated = await tx.fjnTaxRule.update({
        where: { id },
        data: { status: TAX_RULE_STATUS.INACTIVE },
      });
      const payload: TaxRuleUpdatedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? TAX_EVENT_SOURCES.ADMIN : TAX_EVENT_SOURCES.SYSTEM,
        rule_id: updated.id,
        rule_code: updated.ruleCode,
        changes: { status: TAX_RULE_STATUS.INACTIVE, reason: input.reason ?? null },
      };
      await this.emitOutboxEvent(tx, TAX_EVENTS.RULE_UPDATED, payload as unknown as Record<string, unknown>);
      return this.formatRule(updated);
    });
  }

  // ============================================================
  // 2.2 计算域（纯计算，不落库）
  // ============================================================

  /**
   * 计算税额
   *  - exclusive: tax = taxable * rate; total = taxable + tax
   *  - inclusive: tax = total - total / (1 + rate); taxable = total - tax
   */
  async calculateTax(input: CalculateTaxInput): Promise<TaxCalculationResult> {
    if (!input.currency) throw new FjnTaxCurrencyRequiredError({});
    if (input.taxMode !== TAX_MODE.INCLUSIVE && input.taxMode !== TAX_MODE.EXCLUSIVE) {
      throw new FjnTaxModeInvalidError({ taxMode: input.taxMode });
    }

    // 1. 查规则
    let rule: any;
    if (input.ruleId) {
      rule = await this.prisma.fjnTaxRule.findUnique({ where: { id: input.ruleId } });
    } else if (input.ruleCode && input.regionCode) {
      rule = await this.findActiveRule({
        ruleCode: input.ruleCode,
        regionCode: input.regionCode,
      });
      if (rule) {
        rule = await this.prisma.fjnTaxRule.findUnique({ where: { id: (rule as any).rule_id } });
      }
    } else {
      throw new FjnTaxRuleNotFoundError({ reason: 'ruleId or (ruleCode + regionCode) required' });
    }
    if (!rule) throw new FjnTaxRuleNotFoundError({});
    if (!isTaxRuleUsable(rule.status as FjnTaxRuleStatus)) {
      throw new FjnTaxRuleNotActiveError({ id: rule.id, status: rule.status });
    }

    // 2. 校验税率
    const rate = new Decimal(rule.taxRate.toString());
    if (rate.isNaN() || rate.lt(0) || rate.gt(1)) {
      throw new FjnTaxRateInvalidError({ taxRate: rate.toString() });
    }

    // 3. 计算
    let taxable: Decimal;
    let total: Decimal;
    let tax: Decimal;

    if (input.taxMode === TAX_MODE.EXCLUSIVE) {
      if (!input.taxableAmount) throw new FjnTaxAmountInvalidError({ reason: 'taxableAmount required' });
      const t = new Decimal(input.taxableAmount);
      if (t.isNaN() || t.lte(0)) throw new FjnTaxAmountInvalidError({ taxableAmount: input.taxableAmount });
      taxable = t;
      tax = taxable.mul(rate);
      total = taxable.plus(tax);
    } else {
      if (!input.totalAmount) throw new FjnTaxAmountInvalidError({ reason: 'totalAmount required for inclusive' });
      const t = new Decimal(input.totalAmount);
      if (t.isNaN() || t.lte(0)) throw new FjnTaxAmountInvalidError({ totalAmount: input.totalAmount });
      total = t;
      tax = total.mul(rate).div(new Decimal(1).plus(rate));
      taxable = total.minus(tax);
    }
    if (tax.lt(0)) {
      throw new FjnTaxRecordTaxAmountInvalidError({ tax: tax.toString() });
    }

    const result: TaxCalculationResult = {
      rule_id: rule.id,
      rule_code: rule.ruleCode,
      tax_type: rule.taxType as FjnTaxType,
      region_code: rule.regionCode,
      currency: input.currency,
      tax_mode: input.taxMode,
      taxable_amount: taxable.toFixed(4),
      tax_rate: rate.toFixed(6),
      tax_amount: tax.toFixed(4),
      total_amount: total.toFixed(4),
    };

    // 4. 发射 outbox 事件（不落库；事件用于追踪计算审计）
    await this.emitOutboxEventNoTx(TAX_EVENTS.CALCULATED, {
      occurred_at: new Date().toISOString(),
      source: input.source ?? TAX_EVENT_SOURCES.SYSTEM,
      tax_type: result.tax_type,
      region_code: result.region_code,
      taxable_amount: result.taxable_amount,
      tax_rate: result.tax_rate,
      tax_amount: result.tax_amount,
      currency: result.currency,
      tax_mode: result.tax_mode,
      source_type: input.sourceType,
      source_id: input.sourceId,
    } as unknown as Record<string, unknown>);

    return result;
  }

  // ============================================================
  // 2.3 记录域
  // ============================================================

  /** 记录税务（计算 + 落库 reserved） */
  async recordTax(input: RecordTaxInput): Promise<Record<string, unknown>> {
    if (!input.ruleId) throw new FjnTaxRuleNotFoundError({ reason: 'ruleId required' });
    const rule = await this.prisma.fjnTaxRule.findUnique({ where: { id: input.ruleId } });
    if (!rule) throw new FjnTaxRuleNotFoundError({ id: input.ruleId });
    if (!isTaxRuleUsable(rule.status as FjnTaxRuleStatus)) {
      throw new FjnTaxRuleNotActiveError({ id: input.ruleId, status: rule.status });
    }

    const taxMode = (input.taxMode ?? rule.taxMode) as FjnTaxMode;
    const currency = input.currency ?? 'USD';

    // 优先用入参 taxAmount，否则重算
    let taxAmount: Decimal;
    let taxableAmount: Decimal;
    const rate = new Decimal(rule.taxRate.toString());

    if (input.taxAmount) {
      taxAmount = new Decimal(input.taxAmount);
      if (taxAmount.isNaN() || taxAmount.lt(0)) {
        throw new FjnTaxRecordTaxAmountInvalidError({ taxAmount: input.taxAmount });
      }
      taxableAmount = new Decimal(input.taxableAmount);
      if (taxableAmount.isNaN() || taxableAmount.lte(0)) {
        throw new FjnTaxRecordTaxableInvalidError({ taxableAmount: input.taxableAmount });
      }
      // 校验税率一致性
      const expectedTax = taxableAmount.mul(rate);
      if (!expectedTax.eq(taxAmount)) {
        throw new FjnTaxRecordTaxRateMismatchError({
          expected: expectedTax.toFixed(4),
          actual: taxAmount.toFixed(4),
          tolerance: '0.0001',
        });
      }
    } else {
      const calc = await this.calculateTax({
        ruleId: input.ruleId,
        taxableAmount: input.taxableAmount,
        currency,
        taxMode,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        source: input.source,
      });
      taxAmount = new Decimal(calc.tax_amount);
      taxableAmount = new Decimal(calc.taxable_amount);
    }

    return this.withTransaction(async (tx) => {
      const record = await tx.fjnTaxRecord.create({
        data: {
          recordNo: this.generateRecordNo(),
          ruleId: input.ruleId,
          taxType: rule.taxType,
          regionCode: rule.regionCode,
          orderId: input.orderId ?? null,
          userId: input.userId ?? null,
          taxableAmount: taxableAmount.toFixed(4),
          taxRate: rate.toFixed(6),
          taxAmount: taxAmount.toFixed(4),
          currency,
          taxIncluded: taxMode === TAX_MODE.INCLUSIVE,
          status: TAX_RECORD_STATUS.RESERVED,
          reportPeriod: input.reportPeriod ?? this.currentPeriodYYYYMM(),
          description: input.description ?? null,
        },
      });

      const payload: TaxRecordedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.source ?? TAX_EVENT_SOURCES.ORDER,
        record_id: record.id,
        record_no: record.recordNo,
        tax_type: record.taxType as FjnTaxType,
        source_type: input.sourceType,
        source_id: input.sourceId,
        taxable_amount: record.taxableAmount.toString(),
        tax_amount: record.taxAmount.toString(),
        currency: record.currency,
        status: record.status as FjnTaxRecordStatus,
      };
      await this.emitOutboxEvent(tx, TAX_EVENTS.RECORDED, payload as unknown as Record<string, unknown>);
      return this.formatRecord(record);
    });
  }

  /** 按 ID 查询记录 */
  async findRecordById(id: string): Promise<Record<string, unknown> | null> {
    const r = await this.prisma.fjnTaxRecord.findUnique({ where: { id } });
    return r ? this.formatRecord(r) : null;
  }

  /** 按 recordNo 查询 */
  async findRecordByNo(recordNo: string): Promise<Record<string, unknown> | null> {
    const r = await this.prisma.fjnTaxRecord.findUnique({ where: { recordNo } });
    return r ? this.formatRecord(r) : null;
  }

  /** 列出记录 */
  async listRecords(params: {
    taxType?: FjnTaxType;
    regionCode?: string;
    status?: FjnTaxRecordStatus;
    reportPeriod?: string;
    orderId?: string;
    userId?: string;
    ruleId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Record<string, unknown>[]; total: number }> {
    const where: Prisma.FjnTaxRecordWhereInput = {};
    if (params.taxType) where.taxType = params.taxType;
    if (params.regionCode) where.regionCode = params.regionCode;
    if (params.status) where.status = params.status;
    if (params.reportPeriod) where.reportPeriod = params.reportPeriod;
    if (params.orderId) where.orderId = params.orderId;
    if (params.userId) where.userId = params.userId;
    if (params.ruleId) where.ruleId = params.ruleId;
    const [items, total] = await Promise.all([
      this.prisma.fjnTaxRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.limit ?? 50,
        skip: params.offset ?? 0,
      }),
      this.prisma.fjnTaxRecord.count({ where }),
    ]);
    return { items: items.map((r) => this.formatRecord(r)), total };
  }

  /** 标记记录已支付（reserved/adjusted -> paid） */
  async markRecordPaid(id: string, input: MarkTaxPaidInput): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const r = await tx.fjnTaxRecord.findUnique({ where: { id } });
      if (!r) throw new FjnTaxRecordNotFoundError({ id });
      const from = r.status as FjnTaxRecordStatus;
      if (!isTaxRecordPayable(from) && from !== TAX_RECORD_STATUS.ADJUSTED) {
        throw new FjnTaxRecordNotPayableError({ id, status: from });
      }
      assertTransitTaxRecordStatus(from, TAX_RECORD_STATUS.PAID);
      const updated = await tx.fjnTaxRecord.update({
        where: { id },
        data: { status: TAX_RECORD_STATUS.PAID },
      });
      const payload: TaxPaidPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? TAX_EVENT_SOURCES.ADMIN : TAX_EVENT_SOURCES.PAYMENT,
        record_id: updated.id,
        record_no: updated.recordNo,
        tax_amount: updated.taxAmount.toString(),
        currency: updated.currency,
        paid_by: input.operatorId,
        paid_at: (input.paidAt ?? new Date()).toISOString(),
      };
      await this.emitOutboxEvent(tx, TAX_EVENTS.PAID, payload as unknown as Record<string, unknown>);
      return this.formatRecord(updated);
    });
  }

  /** 调整记录（reserved/paid -> adjusted） */
  async adjustRecord(id: string, input: AdjustTaxInput): Promise<Record<string, unknown>> {
    if (!input.reason) throw new FjnTaxReasonRequiredError({ context: 'adjust_record' });
    if (!input.adjustedTaxableAmount || !input.adjustedTaxRate) {
      throw new FjnTaxAmountInvalidError({ reason: 'adjustedTaxableAmount + adjustedTaxRate required' });
    }
    const taxable = new Decimal(input.adjustedTaxableAmount);
    if (taxable.isNaN() || taxable.lte(0)) {
      throw new FjnTaxRecordTaxableInvalidError({ taxableAmount: input.adjustedTaxableAmount });
    }
    const rate = new Decimal(input.adjustedTaxRate);
    if (rate.isNaN() || rate.lt(0) || rate.gt(1)) {
      throw new FjnTaxRateInvalidError({ taxRate: input.adjustedTaxRate });
    }
    const newTax = taxable.mul(rate);
    return this.withTransaction(async (tx) => {
      const r = await tx.fjnTaxRecord.findUnique({ where: { id } });
      if (!r) throw new FjnTaxRecordNotFoundError({ id });
      const from = r.status as FjnTaxRecordStatus;
      if (from === TAX_RECORD_STATUS.REVERSED) {
        throw new FjnTaxRecordNotAdjustableError({ id, status: from });
      }
      assertTransitTaxRecordStatus(from, TAX_RECORD_STATUS.ADJUSTED);
      const updated = await tx.fjnTaxRecord.update({
        where: { id },
        data: {
          status: TAX_RECORD_STATUS.ADJUSTED,
          taxableAmount: taxable.toFixed(4),
          taxRate: rate.toFixed(6),
          taxAmount: newTax.toFixed(4),
          description: input.reason,
        },
      });
      const payload: TaxAdjustedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? TAX_EVENT_SOURCES.ADMIN : TAX_EVENT_SOURCES.SYSTEM,
        record_id: updated.id,
        record_no: updated.recordNo,
        reason: input.reason,
        adjusted_tax_amount: newTax.toFixed(4),
        currency: updated.currency,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, TAX_EVENTS.ADJUSTED, payload as unknown as Record<string, unknown>);
      return this.formatRecord(updated);
    });
  }

  /** 冲销记录（任意非终态 -> reversed） */
  async reverseRecord(id: string, input: ReverseTaxInput): Promise<Record<string, unknown>> {
    if (!input.reason) throw new FjnTaxReasonRequiredError({ context: 'reverse_record' });
    return this.withTransaction(async (tx) => {
      const r = await tx.fjnTaxRecord.findUnique({ where: { id } });
      if (!r) throw new FjnTaxRecordNotFoundError({ id });
      const from = r.status as FjnTaxRecordStatus;
      assertTransitTaxRecordStatus(from, TAX_RECORD_STATUS.REVERSED);
      const updated = await tx.fjnTaxRecord.update({
        where: { id },
        data: { status: TAX_RECORD_STATUS.REVERSED, description: input.reason },
      });
      const payload: TaxReversedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? TAX_EVENT_SOURCES.ADMIN : TAX_EVENT_SOURCES.SYSTEM,
        record_id: updated.id,
        record_no: updated.recordNo,
        reason: input.reason,
        reversed_amount: updated.taxAmount.toString(),
        currency: updated.currency,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, TAX_EVENTS.REVERSED, payload as unknown as Record<string, unknown>);
      return this.formatRecord(updated);
    });
  }

  // ============================================================
  // 2.4 报表域
  // ============================================================

  /**
   * 创建报表（聚合同期同地区同税种的 reserved/paid 记录）
   *  - reportNo 唯一
   *  - 若已存在同 region+period+taxType 的 draft 报表，直接返回
   */
  async createReport(input: CreateTaxReportInput): Promise<Record<string, unknown>> {
    if (!input.regionCode) throw new FjnTaxRegionNotSupportedError({ regionCode: input.regionCode });
    if (!input.reportPeriod || !/^\d{4}-\d{2}$/.test(input.reportPeriod)) {
      throw new FjnTaxReportPeriodInvalidError({ reportPeriod: input.reportPeriod });
    }
    const currency = input.currency ?? 'USD';
    return this.withTransaction(async (tx) => {
      // 唯一性：region+period+taxType draft
      const existing = await tx.fjnTaxReport.findFirst({
        where: {
          regionCode: input.regionCode,
          reportPeriod: input.reportPeriod,
          taxType: input.taxType,
        },
      });
      if (existing) {
        if (existing.status !== TAX_REPORT_STATUS.REJECTED) {
          throw new FjnTaxReportAlreadyExistsError({
            reportNo: existing.reportNo,
            regionCode: input.regionCode,
            reportPeriod: input.reportPeriod,
            taxType: input.taxType,
            status: existing.status,
          });
        }
        // rejected 可重用：删除旧记录后重建
        await tx.fjnTaxReport.delete({ where: { id: existing.id } });
      }

      // 聚合
      const agg = await tx.fjnTaxRecord.aggregate({
        where: {
          regionCode: input.regionCode,
          reportPeriod: input.reportPeriod,
          taxType: input.taxType,
          status: { in: [TAX_RECORD_STATUS.RESERVED, TAX_RECORD_STATUS.PAID, TAX_RECORD_STATUS.ADJUSTED] },
        },
        _sum: { taxableAmount: true, taxAmount: true },
        _count: { _all: true },
      });
      const totalTaxable = new Decimal(agg._sum.taxableAmount?.toString() ?? '0');
      const totalTax = new Decimal(agg._sum.taxAmount?.toString() ?? '0');
      if (agg._count._all === 0) {
        throw new FjnTaxReportNoRecordsError({
          regionCode: input.regionCode,
          reportPeriod: input.reportPeriod,
          taxType: input.taxType,
        });
      }

      const report = await tx.fjnTaxReport.create({
        data: {
          reportNo: this.generateReportNo(),
          regionCode: input.regionCode,
          reportPeriod: input.reportPeriod,
          taxType: input.taxType,
          totalTaxable: totalTaxable.toFixed(4),
          totalTax: totalTax.toFixed(4),
          currency,
          status: TAX_REPORT_STATUS.DRAFT,
        },
      });
      const payload: TaxReportCreatedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.source ?? TAX_EVENT_SOURCES.CRON,
        report_id: report.id,
        report_no: report.reportNo,
        region_code: report.regionCode,
        report_period: report.reportPeriod,
        tax_type: report.taxType as FjnTaxType,
        total_taxable: report.totalTaxable.toString(),
        total_tax: report.totalTax.toString(),
        currency: report.currency,
        status: report.status as FjnTaxReportStatus,
      };
      await this.emitOutboxEvent(tx, TAX_EVENTS.REPORT_CREATED, payload as unknown as Record<string, unknown>);
      return this.formatReport(report);
    });
  }

  /** 按 ID 查询报表 */
  async findReportById(id: string): Promise<Record<string, unknown> | null> {
    const r = await this.prisma.fjnTaxReport.findUnique({ where: { id } });
    return r ? this.formatReport(r) : null;
  }

  /** 按 reportNo 查询 */
  async findReportByNo(reportNo: string): Promise<Record<string, unknown> | null> {
    const r = await this.prisma.fjnTaxReport.findUnique({ where: { reportNo } });
    return r ? this.formatReport(r) : null;
  }

  /** 列出报表 */
  async listReports(params: {
    regionCode?: string;
    reportPeriod?: string;
    taxType?: FjnTaxType;
    status?: FjnTaxReportStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Record<string, unknown>[]; total: number }> {
    const where: Prisma.FjnTaxReportWhereInput = {};
    if (params.regionCode) where.regionCode = params.regionCode;
    if (params.reportPeriod) where.reportPeriod = params.reportPeriod;
    if (params.taxType) where.taxType = params.taxType;
    if (params.status) where.status = params.status;
    const [items, total] = await Promise.all([
      this.prisma.fjnTaxReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.limit ?? 50,
        skip: params.offset ?? 0,
      }),
      this.prisma.fjnTaxReport.count({ where }),
    ]);
    return { items: items.map((r) => this.formatReport(r)), total };
  }

  /** 提交报表（draft -> submitted） */
  async submitReport(id: string, input: SubmitTaxReportInput): Promise<Record<string, unknown>> {
    if (!input.approverId) throw new FjnTaxApproverRequiredError({});
    return this.withTransaction(async (tx) => {
      const r = await tx.fjnTaxReport.findUnique({ where: { id } });
      if (!r) throw new FjnTaxReportNotFoundError({ id });
      const from = r.status as FjnTaxReportStatus;
      if (!isTaxReportSubmittable(from)) {
        throw new FjnTaxReportNotSubmittableError({ id, status: from });
      }
      assertTransitTaxReportStatus(from, TAX_REPORT_STATUS.SUBMITTED);
      const updated = await tx.fjnTaxReport.update({
        where: { id },
        data: { status: TAX_REPORT_STATUS.SUBMITTED, submittedAt: new Date() },
      });
      const payload: TaxReportSubmittedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId ? TAX_EVENT_SOURCES.ADMIN : TAX_EVENT_SOURCES.COMPLIANCE,
        report_id: updated.id,
        report_no: updated.reportNo,
        submitted_at: (updated.submittedAt as Date).toISOString(),
      };
      await this.emitOutboxEvent(tx, TAX_EVENTS.REPORT_SUBMITTED, payload as unknown as Record<string, unknown>);
      return this.formatReport(updated);
    });
  }

  /** 标记报表已支付（submitted -> paid） */
  async markReportPaid(id: string, input: MarkReportPaidInput): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const r = await tx.fjnTaxReport.findUnique({ where: { id } });
      if (!r) throw new FjnTaxReportNotFoundError({ id });
      const from = r.status as FjnTaxReportStatus;
      if (from !== TAX_REPORT_STATUS.SUBMITTED) {
        throw new FjnTaxReportNotPayableError({ id, status: from });
      }
      assertTransitTaxReportStatus(from, TAX_REPORT_STATUS.PAID);
      const updated = await tx.fjnTaxReport.update({
        where: { id },
        data: { status: TAX_REPORT_STATUS.PAID },
      });
      const payload: TaxReportPaidPayload = {
        occurred_at: new Date().toISOString(),
        source: TAX_EVENT_SOURCES.PAYMENT,
        report_id: updated.id,
        report_no: updated.reportNo,
        paid_at: (input.paidAt ?? new Date()).toISOString(),
        total_tax: updated.totalTax.toString(),
        currency: updated.currency,
      };
      await this.emitOutboxEvent(tx, TAX_EVENTS.REPORT_PAID, payload as unknown as Record<string, unknown>);
      return this.formatReport(updated);
    });
  }

  /** 驳回报表（draft/submitted -> rejected） */
  async rejectReport(id: string, input: RejectReportInput): Promise<Record<string, unknown>> {
    if (!input.reason) throw new FjnTaxReasonRequiredError({ context: 'reject_report' });
    return this.withTransaction(async (tx) => {
      const r = await tx.fjnTaxReport.findUnique({ where: { id } });
      if (!r) throw new FjnTaxReportNotFoundError({ id });
      const from = r.status as FjnTaxReportStatus;
      assertTransitTaxReportStatus(from, TAX_REPORT_STATUS.REJECTED);
      const updated = await tx.fjnTaxReport.update({
        where: { id },
        data: { status: TAX_REPORT_STATUS.REJECTED, reportData: { rejection_reason: input.reason } as Prisma.InputJsonValue },
      });
      const payload: TaxReportRejectedPayload = {
        occurred_at: new Date().toISOString(),
        source: TAX_EVENT_SOURCES.COMPLIANCE,
        report_id: updated.id,
        report_no: updated.reportNo,
        reason: input.reason,
        rejected_at: new Date().toISOString(),
      };
      await this.emitOutboxEvent(tx, TAX_EVENTS.REPORT_REJECTED, payload as unknown as Record<string, unknown>);
      return this.formatReport(updated);
    });
  }

  // ============================================================
  // 3. 内部工具
  // ============================================================

  /** 当前周期 YYYY-MM */
  private currentPeriodYYYYMM(): string {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  /** 生成税务记录编号：FTR + YYYYMMDD + 8位随机 */
  private generateRecordNo(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `FTR${date}${random}`;
  }

  /** 生成税务报表编号：FTRPT + YYYYMMDD + 6位随机 */
  private generateReportNo(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `FTRPT${date}${random}`;
  }

  /** 解析事件源 */
  private resolveEventSource(sourceType: string | undefined): FjnTaxEventSource {
    if (!sourceType) return TAX_EVENT_SOURCES.SYSTEM;
    const map: Record<string, FjnTaxEventSource> = {
      order: TAX_EVENT_SOURCES.ORDER,
      payment: TAX_EVENT_SOURCES.PAYMENT,
      revenue: TAX_EVENT_SOURCES.REVENUE,
      referral: TAX_EVENT_SOURCES.REFERRAL,
      team: TAX_EVENT_SOURCES.TEAM,
      node: TAX_EVENT_SOURCES.NODE,
      refund: TAX_EVENT_SOURCES.PAYMENT,
      settlement: TAX_EVENT_SOURCES.SYSTEM,
    };
    return map[sourceType] ?? TAX_EVENT_SOURCES.SYSTEM;
  }

  /** 写入 outbox 事件（事务内） */
  private async emitOutboxEvent(
    tx: any,
    eventType: string,
    payload: object,
  ): Promise<void> {
    try {
      await (tx as any).outboxEvent.create({
        data: {
          eventType,
          payload: payload as any,
          status: 'pending',
          retryCount: 0,
        },
      });
    } catch (e) {
      this.log('warn', `emitOutboxEvent failed (${eventType})`, { error: (e as Error).message });
    }
  }

  /** 写入 outbox 事件（事务外） */
  private async emitOutboxEventNoTx(
    eventType: string,
    payload: object,
  ): Promise<void> {
    try {
      await (this.prisma as any).outboxEvent.create({
        data: {
          eventType,
          payload: payload as any,
          status: 'pending',
          retryCount: 0,
        },
      });
    } catch (e) {
      this.log('warn', `emitOutboxEventNoTx failed (${eventType})`, { error: (e as Error).message });
    }
  }

  private formatRule(r: any): Record<string, unknown> {
    return {
      rule_id: r.id,
      rule_code: r.ruleCode,
      tax_type: r.taxType,
      region_code: r.regionCode,
      tax_rate: r.taxRate?.toString?.() ?? '0',
      tax_mode: r.taxMode,
      applicable_scope: r.applicableScope ?? null,
      effective_from: r.effectiveFrom,
      effective_to: r.effectiveTo,
      status: r.status,
      description: r.description,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    };
  }

  private formatRecord(r: any): Record<string, unknown> {
    return {
      record_id: r.id,
      record_no: r.recordNo,
      rule_id: r.ruleId,
      tax_type: r.taxType,
      region_code: r.regionCode,
      order_id: r.orderId,
      user_id: r.userId,
      taxable_amount: r.taxableAmount?.toString?.() ?? '0',
      tax_rate: r.taxRate?.toString?.() ?? '0',
      tax_amount: r.taxAmount?.toString?.() ?? '0',
      currency: r.currency,
      tax_included: r.taxIncluded,
      status: r.status,
      report_period: r.reportPeriod,
      description: r.description,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    };
  }

  private formatReport(r: any): Record<string, unknown> {
    return {
      report_id: r.id,
      report_no: r.reportNo,
      region_code: r.regionCode,
      report_period: r.reportPeriod,
      tax_type: r.taxType,
      total_taxable: r.totalTaxable?.toString?.() ?? '0',
      total_tax: r.totalTax?.toString?.() ?? '0',
      currency: r.currency,
      status: r.status,
      report_data: r.reportData ?? null,
      submitted_at: r.submittedAt,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    };
  }
}

const ALL_TAX_TYPE_VALUES: readonly FjnTaxType[] = Object.values(TAX_TYPES);

/** 工厂函数 */
export function createFjnTaxService(options: FjnServiceOptions = {}): FjnTaxService {
  return new FjnTaxService(options);
}
