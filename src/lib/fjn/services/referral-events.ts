/**
 * FJN Referral Service - 事件常量 + Payload 接口
 *
 * 严格遵循 H028 §3 + H015 工业级事件规范：
 *  - 事件名使用 <domain>.<action>.v1 格式
 *  - Payload 必须包含 id + 关键业务字段 + 时间戳
 *  - 事件源（source）明确标识生产者
 *
 * 用法：
 *   import { REFERRAL_EVENTS, REFERRAL_EVENT_SOURCES } from './referral-events';
 *   await tx.outboxEvent.create({ data: { eventType: REFERRAL_EVENTS.REWARD_CREATED, ... } });
 */

import { FjnReferralRewardStatus } from './referral-state-machine';

// ============================================================
// 1. 事件常量
// ============================================================

/**
 * Referral Service 事件列表（H028 §3）
 */
export const REFERRAL_EVENTS = {
  BINDING_SNAPSHOT_CREATED: 'referral.binding_snapshot_created.v1',
  REWARD_CREATED: 'referral.reward_created.v1',
  REWARD_LOCKED: 'referral.reward_locked.v1',
  REWARD_APPROVED: 'referral.reward_approved.v1',
  REWARD_PAYABLE: 'referral.reward_payable.v1',
  REWARD_PAID: 'referral.reward_paid.v1',
  REWARD_RECOVERED: 'referral.reward_recovered.v1',
  REWARD_CANCELLED: 'referral.reward_cancelled.v1',
  REWARD_RISK_HOLD: 'referral.reward_risk_hold.v1',
} as const;

export type FjnReferralEvent = (typeof REFERRAL_EVENTS)[keyof typeof REFERRAL_EVENTS];

/** 所有 Referral 事件 */
export const ALL_REFERRAL_EVENTS = Object.values(REFERRAL_EVENTS);

// ============================================================
// 2. 事件源
// ============================================================

export const REFERRAL_EVENT_SOURCES = {
  SYSTEM: 'system',
  USER: 'user',
  ADMIN: 'admin',
  ORDER: 'order',
  PAYMENT: 'payment',
  RISK: 'risk',
  CRON: 'cron',
  FINANCE: 'finance',
  TAX: 'tax',
} as const;

export type FjnReferralEventSource =
  (typeof REFERRAL_EVENT_SOURCES)[keyof typeof REFERRAL_EVENT_SOURCES];

// ============================================================
// 3. Payload 接口
// ============================================================

interface BaseEventPayload {
  occurred_at: string;
  source: FjnReferralEventSource;
}

/** 推荐绑定快照创建 */
export interface BindingSnapshotCreatedPayload extends BaseEventPayload {
  user_id: string;
  referrer_id: string;
  referrer_code?: string;
  bind_source: string;
  bind_ip?: string;
  bind_device_id?: string;
  is_valid: boolean;
  risk_status: string;
}

/** 奖励创建 */
export interface RewardCreatedPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  order_id: string;
  user_id: string;        // 推荐人
  order_user_id: string;  // 下单用户
  order_amount: string;
  reward_rate: string;
  reward_amount: string;
  tax_amount: string;
  net_amount: string;
  currency: string;
  lock_days: number;
}

/** 奖励锁定 */
export interface RewardLockedPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  locked_at: string;
  lock_until: string;
}

/** 奖励审核通过 */
export interface RewardApprovedPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  reviewer_id: string;
  review_note?: string;
  approved_at: string;
}

/** 奖励转 payable */
export interface RewardPayablePayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  payable_at: string;
}

/** 奖励已支付 */
export interface RewardPaidPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  paid_at: string;
  paid_amount: string;
  currency: string;
}

/** 奖励追回 */
export interface RewardRecoveredPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  reason: string;
  approval_id?: string;
  recovered_at: string;
  recovered_amount: string;
}

/** 奖励取消 */
export interface RewardCancelledPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  reason: string;
  cancelled_at: string;
}

/** 奖励风控冻结 */
export interface RewardRiskHoldPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  reason: string;
  risk_score: number;
  risk_level: string;
}

/** 所有 Referral Payload 联合类型 */
export type ReferralEventPayload =
  | BindingSnapshotCreatedPayload
  | RewardCreatedPayload
  | RewardLockedPayload
  | RewardApprovedPayload
  | RewardPayablePayload
  | RewardPaidPayload
  | RewardRecoveredPayload
  | RewardCancelledPayload
  | RewardRiskHoldPayload;

// ============================================================
// 4. 工具函数
// ============================================================

export function isValidReferralEvent(event: string): event is FjnReferralEvent {
  return ALL_REFERRAL_EVENTS.includes(event as FjnReferralEvent);
}

export function isValidReferralEventSource(source: string): source is FjnReferralEventSource {
  return Object.values(REFERRAL_EVENT_SOURCES).includes(source as FjnReferralEventSource);
}
