/**
 * FJN Finance Service - 事件常量 + Payload 接口
 *
 * 严格遵循 H032 §3 + H015 工业级事件规范：
 *  - 事件名使用 <domain>.<action>.v1 格式
 *  - Payload 必须包含 id + 关键业务字段 + 时间戳
 *  - 事件源（source）明确标识生产者
 *
 * 用法：
 *   import { FINANCE_EVENTS, FINANCE_EVENT_SOURCES } from './finance-events';
 *   await tx.outboxEvent.create({ data: { eventType: FINANCE_EVENTS.LEDGER_CREATED, ... } });
 */

import {
  FjnFinanceAccountStatus,
  FjnFinanceLedgerStatus,
  FjnFinanceSettlementStatus,
  FjnFinanceSettlementItemStatus,
  FjnFinanceDirection,
  FjnFinanceAccountType,
  FjnFinanceBusinessType,
  FjnFinanceSettlementType,
} from './finance-state-machine';

// ============================================================
// 1. 事件常量
// ============================================================

/**
 * Finance Service 事件列表（H032 §3）
 */
export const FINANCE_EVENTS = {
  // 账户生命周期
  ACCOUNT_CREATED: 'finance.account_created.v1',
  ACCOUNT_FROZEN: 'finance.account_frozen.v1',
  ACCOUNT_UNFROZEN: 'finance.account_unfrozen.v1',
  ACCOUNT_CLOSED: 'finance.account_closed.v1',

  // 财务流水
  LEDGER_POSTED: 'finance.ledger_posted.v1',
  LEDGER_REVERSED: 'finance.ledger_reversed.v1',
  LEDGER_VOIDED: 'finance.ledger_voided.v1',

  // 收入确认
  REVENUE_RECOGNIZED: 'finance.revenue_recognized.v1',

  // 369 分账入账
  REVENUE_369_ALLOCATED: 'finance.revenue_369_allocated.v1',

  // 结算单
  SETTLEMENT_CREATED: 'finance.settlement_created.v1',
  SETTLEMENT_APPROVED: 'finance.settlement_approved.v1',
  SETTLEMENT_PAID: 'finance.settlement_paid.v1',
  SETTLEMENT_CANCELLED: 'finance.settlement_cancelled.v1',
  SETTLEMENT_ITEM_PAID: 'finance.settlement_item_paid.v1',
  SETTLEMENT_ITEM_FAILED: 'finance.settlement_item_failed.v1',
} as const;

export type FjnFinanceEvent = (typeof FINANCE_EVENTS)[keyof typeof FINANCE_EVENTS];

/** 所有 Finance 事件 */
export const ALL_FINANCE_EVENTS = Object.values(FINANCE_EVENTS);

/** Finance 事件总数 */
export const FINANCE_EVENT_COUNT = ALL_FINANCE_EVENTS.length;

// ============================================================
// 2. 事件源
// ============================================================

export const FINANCE_EVENT_SOURCES = {
  SYSTEM: 'system',
  USER: 'user',
  ADMIN: 'admin',
  ORDER: 'order',
  PAYMENT: 'payment',
  REVENUE: 'revenue',
  REFERRAL: 'referral',
  TEAM: 'team',
  NODE: 'node',
  RISK: 'risk',
  CRON: 'cron',
  FINANCE: 'finance',
  TAX: 'tax',
  SETTLEMENT: 'settlement',
} as const;

export type FjnFinanceEventSource =
  (typeof FINANCE_EVENT_SOURCES)[keyof typeof FINANCE_EVENT_SOURCES];

// ============================================================
// 3. Payload 接口
// ============================================================

interface BaseEventPayload {
  occurred_at: string;
  source: FjnFinanceEventSource;
}

// ============================================================
// 3.1 账户生命周期 Payload
// ============================================================

/** 账户创建 */
export interface AccountCreatedPayload extends BaseEventPayload {
  account_id: string;
  account_no: string;
  account_name: string;
  account_type: FjnFinanceAccountType;
  currency: string;
  status: FjnFinanceAccountStatus;
}

/** 账户冻结 */
export interface AccountFrozenPayload extends BaseEventPayload {
  account_id: string;
  account_no: string;
  reason: string;
  operator_id?: string;
  frozen_at: string;
}

/** 账户解冻 */
export interface AccountUnfrozenPayload extends BaseEventPayload {
  account_id: string;
  account_no: string;
  reason: string;
  operator_id?: string;
  unfrozen_at: string;
}

/** 账户关闭 */
export interface AccountClosedPayload extends BaseEventPayload {
  account_id: string;
  account_no: string;
  reason: string;
  operator_id?: string;
  closed_at: string;
}

// ============================================================
// 3.2 财务流水 Payload
// ============================================================

/** 流水入账 */
export interface LedgerPostedPayload extends BaseEventPayload {
  ledger_id: string;
  ledger_no: string;
  account_id: string;
  account_type: FjnFinanceAccountType;
  business_type: FjnFinanceBusinessType;
  direction: FjnFinanceDirection;
  amount: string;
  balance_before: string;
  balance_after: string;
  currency: string;
  source_type: string;
  source_id: string;
  order_id?: string;
  user_id?: string;
}

/** 流水冲销 */
export interface LedgerReversedPayload extends BaseEventPayload {
  original_ledger_id: string;
  reverse_ledger_id: string;
  reverse_ledger_no: string;
  amount: string;
  currency: string;
  reason: string;
  approval_id?: string;
  operator_id?: string;
  reversed_at: string;
}

/** 流水作废 */
export interface LedgerVoidedPayload extends BaseEventPayload {
  ledger_id: string;
  ledger_no: string;
  reason: string;
  operator_id?: string;
  voided_at: string;
}

// ============================================================
// 3.3 收入确认 Payload
// ============================================================

/** 收入确认（通用） */
export interface RevenueRecognizedPayload extends BaseEventPayload {
  revenue_id: string;
  order_id: string;
  user_id: string;
  currency: string;
  total_amount: string;
  rule_version: string;
  recognized_at: string;
}

/** 369 分账入账（40/30/30） */
export interface Revenue369AllocatedPayload extends BaseEventPayload {
  order_id: string;
  user_id: string;
  currency: string;
  cost_pool_amount: string;
  market_pool_amount: string;
  company_pool_amount: string;
  rule_version: string;
  total_amount: string;
  ledger_ids: string[];
  allocated_at: string;
}

// ============================================================
// 3.4 结算单 Payload
// ============================================================

/** 结算单创建 */
export interface SettlementCreatedPayload extends BaseEventPayload {
  settlement_id: string;
  settlement_no: string;
  settlement_type: FjnFinanceSettlementType;
  period: string;
  total_amount: string;
  currency: string;
  item_count: number;
  status: FjnFinanceSettlementStatus;
}

/** 结算单审核 */
export interface SettlementApprovedPayload extends BaseEventPayload {
  settlement_id: string;
  settlement_no: string;
  approver_id: string;
  approved_at: string;
  review_note?: string;
}

/** 结算单已支付 */
export interface SettlementPaidPayload extends BaseEventPayload {
  settlement_id: string;
  settlement_no: string;
  paid_at: string;
  total_amount: string;
  currency: string;
  item_count: number;
}

/** 结算单取消 */
export interface SettlementCancelledPayload extends BaseEventPayload {
  settlement_id: string;
  settlement_no: string;
  reason: string;
  operator_id?: string;
  cancelled_at: string;
}

/** 结算条目已支付 */
export interface SettlementItemPaidPayload extends BaseEventPayload {
  item_id: string;
  settlement_id: string;
  settlement_no: string;
  user_id?: string;
  merchant_id?: string;
  node_id?: string;
  amount: string;
  net_amount: string;
  tax_amount: string;
  currency: string;
  paid_at: string;
  status: FjnFinanceSettlementItemStatus;
}

/** 结算条目失败 */
export interface SettlementItemFailedPayload extends BaseEventPayload {
  item_id: string;
  settlement_id: string;
  settlement_no: string;
  user_id?: string;
  amount: string;
  currency: string;
  failure_reason: string;
  failed_at: string;
}

/** 所有 Finance Payload 联合类型 */
export type FinanceEventPayload =
  | AccountCreatedPayload
  | AccountFrozenPayload
  | AccountUnfrozenPayload
  | AccountClosedPayload
  | LedgerPostedPayload
  | LedgerReversedPayload
  | LedgerVoidedPayload
  | RevenueRecognizedPayload
  | Revenue369AllocatedPayload
  | SettlementCreatedPayload
  | SettlementApprovedPayload
  | SettlementPaidPayload
  | SettlementCancelledPayload
  | SettlementItemPaidPayload
  | SettlementItemFailedPayload;

// ============================================================
// 4. 工具函数
// ============================================================

export function isValidFinanceEvent(event: string): event is FjnFinanceEvent {
  return ALL_FINANCE_EVENTS.includes(event as FjnFinanceEvent);
}

export function isValidFinanceEventSource(
  source: string,
): source is FjnFinanceEventSource {
  return Object.values(FINANCE_EVENT_SOURCES).includes(source as FjnFinanceEventSource);
}
