/**
 * FJN Revenue Service - 事件常量 + Payload 接口
 *
 * 严格遵循 H022 §3 + H015 工业级事件规范：
 *  - 事件名使用 <domain>.<action>.v1 格式
 *  - Payload 必须包含 id + 关键业务字段 + 时间戳
 *  - 事件源（source）明确标识生产者（system/user/admin/...）
 *
 * 设计原则：
 *  - Revenue Service 主要产生 6 类事件
 *  - 通过 outbox 模式（待 H042 Worker 消费）发送，不在 Service 内直发
 *  - 所有事件 payload 字段使用 snake_case 命名（与跨服务 JSON 规范一致）
 *
 * 用法：
 *   import { REVENUE_EVENTS, REVENUE_EVENT_SOURCES } from './revenue-events';
 *   await tx.outboxEvent.create({ data: { eventType: REVENUE_EVENTS.ALLOCATION_REQUESTED, ... } });
 */

import { FjnAllocationStatus, FjnRevenuePoolType } from './revenue-state-machine';

// ============================================================
// 1. 事件常量
// ============================================================

/**
 * Revenue Service 事件列表（H022 §3）
 *
 * 事件列表：
 *  - ALLOCATION_REQUESTED    触发分账请求（外部/系统）
 *  - ALLOCATED               分账完成（写入主表+明细）
 *  - APPROVED                审核通过
 *  - SETTLED                 结算完成
 *  - REVERSAL_REQUESTED      触发冲销
 *  - REVERSED                冲销完成
 */
export const REVENUE_EVENTS = {
  // 分账主流程
  ALLOCATION_REQUESTED: 'revenue.allocation_requested.v1',
  ALLOCATED: 'revenue.allocated.v1',
  APPROVED: 'revenue.approved.v1',
  SETTLED: 'revenue.settled.v1',
  // 冲销
  REVERSAL_REQUESTED: 'revenue.reversal_requested.v1',
  REVERSED: 'revenue.reversed.v1',
  // 补充：风控结果（可选）
  RISK_CHECK_PASSED: 'revenue.risk_check_passed.v1',
  RISK_CHECK_FAILED: 'revenue.risk_check_failed.v1',
} as const;

export type FjnRevenueEvent = (typeof REVENUE_EVENTS)[keyof typeof REVENUE_EVENTS];

/** 所有 Revenue 事件数量（含扩展） */
export const ALL_REVENUE_EVENTS = Object.values(REVENUE_EVENTS);

/** 事件数统计（含 2 个扩展事件 = 8） */
export const REVENUE_EVENT_COUNT = 8;

// ============================================================
// 2. 事件源
// ============================================================

/**
 * 事件源 - 标识事件生产者
 */
export const REVENUE_EVENT_SOURCES = {
  SYSTEM: 'system',                 // 系统自动（如 OrderService 联动）
  USER: 'user',                     // 用户触发
  ADMIN: 'admin',                   // 管理员操作
  ORDER: 'order',                   // OrderService 事件触发
  PAYMENT: 'payment',               // PaymentService 事件触发
  RISK: 'risk',                     // RiskService 联动
  CRON: 'cron',                     // 定时任务
  REVERSAL: 'reversal',             // Reversal Service 触发
  FINANCE: 'finance',               // Finance Service 触发
} as const;

export type FjnRevenueEventSource =
  (typeof REVENUE_EVENT_SOURCES)[keyof typeof REVENUE_EVENT_SOURCES];

// ============================================================
// 3. Payload 接口
// ============================================================

/** 通用字段 */
interface BaseEventPayload {
  /** 业务事件发生时间（ISO 8601） */
  occurred_at: string;
  /** 事件源 */
  source: FjnRevenueEventSource;
}

/**
 * AllocationRequested 事件 payload
 * 触发场景：OrderPaid / PaymentSucceeded 事件被监听后发起
 */
export interface AllocationRequestedPayload extends BaseEventPayload {
  order_id: string;
  order_no: string;
  user_id: string;
  product_type: string;
  paid_amount: string;
  tax_amount: string;
  currency: string;
  rule_id?: string;
  rule_version?: string;
}

/**
 * Allocated 事件 payload（H022 核心事件）
 */
export interface AllocatedPayload extends BaseEventPayload {
  allocation_id: string;
  allocation_no: string;
  order_id: string;
  user_id: string;
  product_type: string;
  paid_amount: string;
  tax_amount: string;
  net_amount: string;
  currency: string;
  rule_id: string;
  rule_version: string;
  status: FjnAllocationStatus;
  items: Array<{
    pool_type: FjnRevenuePoolType;
    percentage: string;
    amount: string;
    currency: string;
  }>;
}

/**
 * Approved 事件 payload
 */
export interface ApprovedPayload extends BaseEventPayload {
  allocation_id: string;
  allocation_no: string;
  order_id: string;
  user_id: string;
  currency: string;
  reviewer_id: string;
  review_note?: string;
  approved_at: string;
}

/**
 * Settled 事件 payload
 */
export interface SettledPayload extends BaseEventPayload {
  allocation_id: string;
  allocation_no: string;
  order_id: string;
  currency: string;
  settled_by: string;
  settled_at: string;
  total_settled: string;
}

/**
 * ReversalRequested 事件 payload
 */
export interface ReversalRequestedPayload extends BaseEventPayload {
  reversal_id: string;
  reversal_no: string;
  original_allocation_id: string;
  order_id: string;
  refund_id?: string;
  reason: string;
}

/**
 * Reversed 事件 payload
 */
export interface ReversedPayload extends BaseEventPayload {
  reversal_id: string;
  reversal_no: string;
  original_allocation_id: string;
  order_id: string;
  refund_id?: string;
  reversed_amount: string;
  currency: string;
  items: Array<{
    pool_type: FjnRevenuePoolType;
    reverse_amount: string;
  }>;
}

/**
 * RiskCheckPassed 事件 payload
 */
export interface RiskCheckPassedPayload extends BaseEventPayload {
  allocation_id: string;
  allocation_no: string;
  risk_score: number;
  risk_level: string;
}

/**
 * RiskCheckFailed 事件 payload
 */
export interface RiskCheckFailedPayload extends BaseEventPayload {
  allocation_id: string;
  allocation_no: string;
  risk_score: number;
  risk_level: string;
  reason: string;
}

/** 所有 Revenue 事件 Payload 联合类型 */
export type RevenueEventPayload =
  | AllocationRequestedPayload
  | AllocatedPayload
  | ApprovedPayload
  | SettledPayload
  | ReversalRequestedPayload
  | ReversedPayload
  | RiskCheckPassedPayload
  | RiskCheckFailedPayload;

// ============================================================
// 4. 工具函数
// ============================================================

/** 校验事件类型是否合法 */
export function isValidRevenueEvent(event: string): event is FjnRevenueEvent {
  return ALL_REVENUE_EVENTS.includes(event as FjnRevenueEvent);
}

/** 校验事件源是否合法 */
export function isValidRevenueEventSource(source: string): source is FjnRevenueEventSource {
  return Object.values(REVENUE_EVENT_SOURCES).includes(source as FjnRevenueEventSource);
}

/** 从事件名提取领域 */
export function extractDomain(event: string): string {
  return event.split('.')[0] ?? '';
}

/** 从事件名提取动作 */
export function extractAction(event: string): string {
  const parts = event.split('.');
  return parts[1] ?? '';
}
