/**
 * FJN Tax Service - 事件常量 + Payload 接口
 *
 * 严格遵循 H033 §3 + H015 工业级事件规范
 */
import {
  FjnTaxRuleStatus,
  FjnTaxRecordStatus,
  FjnTaxReportStatus,
  FjnTaxType,
  FjnTaxMode,
} from './tax-state-machine';

export const TAX_EVENTS = {
  RULE_CREATED: 'tax.rule_created.v1',
  RULE_UPDATED: 'tax.rule_updated.v1',
  RULE_ARCHIVED: 'tax.rule_archived.v1',
  CALCULATED: 'tax.calculated.v1',
  RECORDED: 'tax.recorded.v1',
  PAID: 'tax.paid.v1',
  ADJUSTED: 'tax.adjusted.v1',
  REVERSED: 'tax.reversed.v1',
  REPORT_CREATED: 'tax.report_created.v1',
  REPORT_SUBMITTED: 'tax.report_submitted.v1',
  REPORT_PAID: 'tax.report_paid.v1',
  REPORT_REJECTED: 'tax.report_rejected.v1',
} as const;

export type FjnTaxEvent = (typeof TAX_EVENTS)[keyof typeof TAX_EVENTS];
export const ALL_TAX_EVENTS = Object.values(TAX_EVENTS);
export const TAX_EVENT_COUNT = ALL_TAX_EVENTS.length;

export const TAX_EVENT_SOURCES = {
  SYSTEM: 'system',
  USER: 'user',
  ADMIN: 'admin',
  ORDER: 'order',
  PAYMENT: 'payment',
  REVENUE: 'revenue',
  REFERRAL: 'referral',
  TEAM: 'team',
  NODE: 'node',
  CRON: 'cron',
  TAX: 'tax',
  COMPLIANCE: 'compliance',
} as const;

export type FjnTaxEventSource = (typeof TAX_EVENT_SOURCES)[keyof typeof TAX_EVENT_SOURCES];

interface BaseEventPayload {
  occurred_at: string;
  source: FjnTaxEventSource;
}

// Rule
export interface TaxRuleCreatedPayload extends BaseEventPayload {
  rule_id: string;
  rule_code: string;
  tax_type: FjnTaxType;
  region_code: string;
  tax_rate: string;
  tax_mode: FjnTaxMode;
  status: FjnTaxRuleStatus;
}
export interface TaxRuleUpdatedPayload extends BaseEventPayload {
  rule_id: string;
  rule_code: string;
  changes: Record<string, unknown>;
}
export interface TaxRuleArchivedPayload extends BaseEventPayload {
  rule_id: string;
  rule_code: string;
  reason: string;
}

// Calculation
export interface TaxCalculatedPayload extends BaseEventPayload {
  tax_type: FjnTaxType;
  region_code: string;
  taxable_amount: string;
  tax_rate: string;
  tax_amount: string;
  currency: string;
  tax_mode: FjnTaxMode;
}

// Record
export interface TaxRecordedPayload extends BaseEventPayload {
  record_id: string;
  record_no: string;
  tax_type: FjnTaxType;
  source_type: string;
  source_id: string;
  taxable_amount: string;
  tax_amount: string;
  currency: string;
  status: FjnTaxRecordStatus;
}
export interface TaxPaidPayload extends BaseEventPayload {
  record_id: string;
  record_no: string;
  tax_amount: string;
  currency: string;
  paid_by?: string;
  paid_at: string;
}
export interface TaxAdjustedPayload extends BaseEventPayload {
  record_id: string;
  record_no: string;
  reason: string;
  adjusted_tax_amount: string;
  currency: string;
  operator_id?: string;
}
export interface TaxReversedPayload extends BaseEventPayload {
  record_id: string;
  record_no: string;
  reason: string;
  reversed_amount: string;
  currency: string;
  operator_id?: string;
}

// Report
export interface TaxReportCreatedPayload extends BaseEventPayload {
  report_id: string;
  report_no: string;
  region_code: string;
  report_period: string;
  tax_type: FjnTaxType;
  total_taxable: string;
  total_tax: string;
  currency: string;
  status: FjnTaxReportStatus;
}
export interface TaxReportSubmittedPayload extends BaseEventPayload {
  report_id: string;
  report_no: string;
  submitted_at: string;
}
export interface TaxReportPaidPayload extends BaseEventPayload {
  report_id: string;
  report_no: string;
  paid_at: string;
  total_tax: string;
  currency: string;
}
export interface TaxReportRejectedPayload extends BaseEventPayload {
  report_id: string;
  report_no: string;
  reason: string;
  rejected_at: string;
}

export type TaxEventPayload =
  | TaxRuleCreatedPayload
  | TaxRuleUpdatedPayload
  | TaxRuleArchivedPayload
  | TaxCalculatedPayload
  | TaxRecordedPayload
  | TaxPaidPayload
  | TaxAdjustedPayload
  | TaxReversedPayload
  | TaxReportCreatedPayload
  | TaxReportSubmittedPayload
  | TaxReportPaidPayload
  | TaxReportRejectedPayload;

export function isValidTaxEvent(event: string): event is FjnTaxEvent {
  return ALL_TAX_EVENTS.includes(event as FjnTaxEvent);
}
export function isValidTaxEventSource(source: string): source is FjnTaxEventSource {
  return Object.values(TAX_EVENT_SOURCES).includes(source as FjnTaxEventSource);
}
