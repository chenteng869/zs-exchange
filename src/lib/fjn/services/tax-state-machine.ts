/**
 * FJN Tax Service - 状态机
 *
 * 严格遵循 H033 §3 工业级状态机规范 + 现有 schema 字段 + H015 工业级职责：
 *  - 税务规则 (FjnTaxRule) 状态机：active | inactive | archived
 *  - 税务记录 (FjnTaxRecord) 状态机：reserved | paid | adjusted | reversed
 *  - 税务报表 (FjnTaxReport) 状态机：draft | submitted | paid | rejected
 *  - 状态转移基于白名单，禁止隐式跳转
 *
 * 设计原则：
 *  - 状态常量使用 SCREAMING_SNAKE_CASE 字符串
 *  - 终态明确：archived / paid / reversed / rejected 不可再转移
 *  - 含税/不含税计算模式：inclusive | exclusive
 *
 * 用法：
 *   import { TAX_RULE_STATUS, canTransitTaxRuleStatus } from './tax-state-machine';
 */

import { FjnStateMachineError } from '../errors';

// ============================================================
// 1. 税务规则状态
// ============================================================

export const TAX_RULE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
} as const;

export type FjnTaxRuleStatus = (typeof TAX_RULE_STATUS)[keyof typeof TAX_RULE_STATUS];

export const ALL_TAX_RULE_STATUSES: readonly FjnTaxRuleStatus[] = [
  TAX_RULE_STATUS.ACTIVE,
  TAX_RULE_STATUS.INACTIVE,
  TAX_RULE_STATUS.ARCHIVED,
] as const;

export const TERMINAL_TAX_RULE_STATUSES: readonly FjnTaxRuleStatus[] = [
  TAX_RULE_STATUS.ARCHIVED,
] as const;

export const TAX_RULE_STATUS_TRANSITIONS: Record<FjnTaxRuleStatus, readonly FjnTaxRuleStatus[]> = {
  [TAX_RULE_STATUS.ACTIVE]: [TAX_RULE_STATUS.INACTIVE, TAX_RULE_STATUS.ARCHIVED],
  [TAX_RULE_STATUS.INACTIVE]: [TAX_RULE_STATUS.ACTIVE, TAX_RULE_STATUS.ARCHIVED],
  [TAX_RULE_STATUS.ARCHIVED]: [],
} as const;

// ============================================================
// 2. 税务记录状态
// ============================================================

export const TAX_RECORD_STATUS = {
  RESERVED: 'reserved',
  PAID: 'paid',
  ADJUSTED: 'adjusted',
  REVERSED: 'reversed',
} as const;

export type FjnTaxRecordStatus = (typeof TAX_RECORD_STATUS)[keyof typeof TAX_RECORD_STATUS];

export const ALL_TAX_RECORD_STATUSES: readonly FjnTaxRecordStatus[] = [
  TAX_RECORD_STATUS.RESERVED,
  TAX_RECORD_STATUS.PAID,
  TAX_RECORD_STATUS.ADJUSTED,
  TAX_RECORD_STATUS.REVERSED,
] as const;

export const TERMINAL_TAX_RECORD_STATUSES: readonly FjnTaxRecordStatus[] = [
  TAX_RECORD_STATUS.PAID,
  TAX_RECORD_STATUS.REVERSED,
] as const;

export const TAX_RECORD_STATUS_TRANSITIONS: Record<FjnTaxRecordStatus, readonly FjnTaxRecordStatus[]> = {
  [TAX_RECORD_STATUS.RESERVED]: [
    TAX_RECORD_STATUS.PAID,
    TAX_RECORD_STATUS.ADJUSTED,
    TAX_RECORD_STATUS.REVERSED,
  ],
  [TAX_RECORD_STATUS.PAID]: [TAX_RECORD_STATUS.ADJUSTED, TAX_RECORD_STATUS.REVERSED],
  [TAX_RECORD_STATUS.ADJUSTED]: [TAX_RECORD_STATUS.PAID, TAX_RECORD_STATUS.REVERSED],
  [TAX_RECORD_STATUS.REVERSED]: [],
} as const;

// ============================================================
// 3. 税务报表状态
// ============================================================

export const TAX_REPORT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PAID: 'paid',
  REJECTED: 'rejected',
} as const;

export type FjnTaxReportStatus = (typeof TAX_REPORT_STATUS)[keyof typeof TAX_REPORT_STATUS];

export const ALL_TAX_REPORT_STATUSES: readonly FjnTaxReportStatus[] = [
  TAX_REPORT_STATUS.DRAFT,
  TAX_REPORT_STATUS.SUBMITTED,
  TAX_REPORT_STATUS.PAID,
  TAX_REPORT_STATUS.REJECTED,
] as const;

export const TERMINAL_TAX_REPORT_STATUSES: readonly FjnTaxReportStatus[] = [
  TAX_REPORT_STATUS.PAID,
  TAX_REPORT_STATUS.REJECTED,
] as const;

export const TAX_REPORT_STATUS_TRANSITIONS: Record<FjnTaxReportStatus, readonly FjnTaxReportStatus[]> = {
  [TAX_REPORT_STATUS.DRAFT]: [
    TAX_REPORT_STATUS.SUBMITTED,
    TAX_REPORT_STATUS.REJECTED,
  ],
  [TAX_REPORT_STATUS.SUBMITTED]: [TAX_REPORT_STATUS.PAID, TAX_REPORT_STATUS.REJECTED],
  [TAX_REPORT_STATUS.PAID]: [],
  [TAX_REPORT_STATUS.REJECTED]: [TAX_REPORT_STATUS.DRAFT], // 可重做
} as const;

// ============================================================
// 4. 税种类型
// ============================================================

export const TAX_TYPES = {
  VAT: 'VAT',
  GST: 'GST',
  SALES_TAX: 'sales_tax',
  CORPORATE_INCOME_TAX: 'corporate_income_tax',
  WITHHOLDING_TAX: 'withholding_tax',
  COMMISSION_TAX: 'commission_tax',
  DIGITAL_SERVICE_TAX: 'digital_service_tax',
  IMPORT_DUTY: 'import_duty',
  NFT_SERVICE_TAX: 'nft_service_tax',
  PLATFORM_SERVICE_TAX: 'platform_service_tax',
} as const;

export type FjnTaxType = (typeof TAX_TYPES)[keyof typeof TAX_TYPES];

export const ALL_TAX_TYPES: readonly FjnTaxType[] = Object.values(TAX_TYPES);

// ============================================================
// 5. 税务模式
// ============================================================

export const TAX_MODE = {
  INCLUSIVE: 'inclusive', // 含税价
  EXCLUSIVE: 'exclusive', // 不含税价
} as const;

export type FjnTaxMode = (typeof TAX_MODE)[keyof typeof TAX_MODE];

// ============================================================
// 6. 工具函数
// ============================================================

export function isTerminalTaxRuleStatus(s: FjnTaxRuleStatus): boolean {
  return TERMINAL_TAX_RULE_STATUSES.includes(s);
}
export function isTerminalTaxRecordStatus(s: FjnTaxRecordStatus): boolean {
  return TERMINAL_TAX_RECORD_STATUSES.includes(s);
}
export function isTerminalTaxReportStatus(s: FjnTaxReportStatus): boolean {
  return TERMINAL_TAX_REPORT_STATUSES.includes(s);
}

export function canTransitTaxRuleStatus(from: FjnTaxRuleStatus, to: FjnTaxRuleStatus): boolean {
  return TAX_RULE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
export function canTransitTaxRecordStatus(from: FjnTaxRecordStatus, to: FjnTaxRecordStatus): boolean {
  return TAX_RECORD_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
export function canTransitTaxReportStatus(from: FjnTaxReportStatus, to: FjnTaxReportStatus): boolean {
  return TAX_REPORT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitTaxRuleStatus(from: FjnTaxRuleStatus, to: FjnTaxRuleStatus): void {
  if (!canTransitTaxRuleStatus(from, to)) {
    throw new FjnStateMachineError(`非法税务规则状态转移: ${from} -> ${to}`, { from, to, allowedNext: TAX_RULE_STATUS_TRANSITIONS[from] });
  }
}
export function assertTransitTaxRecordStatus(from: FjnTaxRecordStatus, to: FjnTaxRecordStatus): void {
  if (!canTransitTaxRecordStatus(from, to)) {
    throw new FjnStateMachineError(`非法税务记录状态转移: ${from} -> ${to}`, { from, to, allowedNext: TAX_RECORD_STATUS_TRANSITIONS[from] });
  }
}
export function assertTransitTaxReportStatus(from: FjnTaxReportStatus, to: FjnTaxReportStatus): void {
  if (!canTransitTaxReportStatus(from, to)) {
    throw new FjnStateMachineError(`非法税务报表状态转移: ${from} -> ${to}`, { from, to, allowedNext: TAX_REPORT_STATUS_TRANSITIONS[from] });
  }
}

export function nextTaxRuleStatuses(from: FjnTaxRuleStatus): readonly FjnTaxRuleStatus[] {
  return TAX_RULE_STATUS_TRANSITIONS[from] ?? [];
}
export function nextTaxRecordStatuses(from: FjnTaxRecordStatus): readonly FjnTaxRecordStatus[] {
  return TAX_RECORD_STATUS_TRANSITIONS[from] ?? [];
}
export function nextTaxReportStatuses(from: FjnTaxReportStatus): readonly FjnTaxReportStatus[] {
  return TAX_REPORT_STATUS_TRANSITIONS[from] ?? [];
}

export function isTaxRuleUsable(s: FjnTaxRuleStatus): boolean {
  return s === TAX_RULE_STATUS.ACTIVE;
}
export function isTaxRecordPayable(s: FjnTaxRecordStatus): boolean {
  return s === TAX_RECORD_STATUS.RESERVED;
}
export function isTaxReportSubmittable(s: FjnTaxReportStatus): boolean {
  return s === TAX_REPORT_STATUS.DRAFT;
}
