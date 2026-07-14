/**
 * FJN Team Service - 事件常量 + Payload 接口
 *
 * 严格遵循 H029 §3 + H015 工业级事件规范：
 *  - 事件名使用 <domain>.<action>.v1 格式
 *  - Payload 必须包含 id + 关键业务字段 + 时间戳
 *  - 事件源（source）明确标识生产者
 *
 * 用法：
 *   import { TEAM_EVENTS, TEAM_EVENT_SOURCES } from './team-events';
 *   await tx.outboxEvent.create({ data: { eventType: TEAM_EVENTS.REWARD_CREATED, ... } });
 */

import {
  FjnTeamRewardStatus,
  FjnTeamServiceRecordStatus,
} from './team-state-machine';

// ============================================================
// 1. 事件常量
// ============================================================

/**
 * Team Service 事件列表（H029 §3）
 */
export const TEAM_EVENTS = {
  STRUCTURE_CREATED: 'team.structure_created.v1',
  STRUCTURE_UPDATED: 'team.structure_updated.v1',
  SERVICE_RECORD_CREATED: 'team.service_record_created.v1',
  SERVICE_RECORD_APPROVED: 'team.service_record_approved.v1',
  SERVICE_RECORD_REJECTED: 'team.service_record_rejected.v1',
  REWARD_CREATED: 'team.reward_created.v1',
  REWARD_WAITING_SERVICE: 'team.reward_waiting_service.v1',
  REWARD_LOCKED: 'team.reward_locked.v1',
  REWARD_APPROVED: 'team.reward_approved.v1',
  REWARD_PAYABLE: 'team.reward_payable.v1',
  REWARD_PAID: 'team.reward_paid.v1',
  REWARD_RECOVERED: 'team.reward_recovered.v1',
  REWARD_CANCELLED: 'team.reward_cancelled.v1',
  REWARD_RISK_HOLD: 'team.reward_risk_hold.v1',
} as const;

export type FjnTeamEvent = (typeof TEAM_EVENTS)[keyof typeof TEAM_EVENTS];

/** 所有 Team 事件 */
export const ALL_TEAM_EVENTS = Object.values(TEAM_EVENTS);

/** Team 事件总数 */
export const TEAM_EVENT_COUNT = ALL_TEAM_EVENTS.length;

// ============================================================
// 2. 事件源
// ============================================================

export const TEAM_EVENT_SOURCES = {
  SYSTEM: 'system',
  USER: 'user',
  ADMIN: 'admin',
  ORDER: 'order',
  PAYMENT: 'payment',
  RISK: 'risk',
  CRON: 'cron',
  FINANCE: 'finance',
  TEAM: 'team',
  SERVICE: 'service',
} as const;

export type FjnTeamEventSource =
  (typeof TEAM_EVENT_SOURCES)[keyof typeof TEAM_EVENT_SOURCES];

// ============================================================
// 3. Payload 接口
// ============================================================

interface BaseEventPayload {
  occurred_at: string;
  source: FjnTeamEventSource;
}

/** 团队结构创建 */
export interface StructureCreatedPayload extends BaseEventPayload {
  structure_id: string;
  user_id: string;
  upline_id?: string;
  upline_level1?: string;
  upline_level2?: string;
  upline_level3?: string;
  status: string;
}

/** 团队结构更新 */
export interface StructureUpdatedPayload extends BaseEventPayload {
  structure_id: string;
  user_id: string;
  from_status: string;
  to_status: string;
  reason?: string;
}

/** 团队服务记录创建 */
export interface ServiceRecordCreatedPayload extends BaseEventPayload {
  record_id: string;
  record_no: string;
  user_id: string;
  service_type: string;
  title: string;
  service_date: string;
  duration_hours: string;
  status: FjnTeamServiceRecordStatus;
}

/** 团队服务记录审核通过 */
export interface ServiceRecordApprovedPayload extends BaseEventPayload {
  record_id: string;
  record_no: string;
  user_id: string;
  reviewer_id: string;
  review_note?: string;
  approved_at: string;
}

/** 团队服务记录拒绝 */
export interface ServiceRecordRejectedPayload extends BaseEventPayload {
  record_id: string;
  record_no: string;
  user_id: string;
  reviewer_id: string;
  review_note?: string;
  rejected_at: string;
}

/** 团队奖励创建 */
export interface TeamRewardCreatedPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  order_id: string;
  user_id: string;          // 受益人（团队上级）
  order_user_id: string;    // 下单用户
  team_level: number;
  reward_rate: string;
  order_amount: string;
  reward_amount: string;
  tax_amount: string;
  net_amount: string;
  currency: string;
  status: FjnTeamRewardStatus;
}

/** 团队奖励等待服务记录 */
export interface TeamRewardWaitingServicePayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  waiting_at: string;
  service_record_required: boolean;
}

/** 团队奖励锁定 */
export interface TeamRewardLockedPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  locked_at: string;
  service_record_id?: string;
}

/** 团队奖励审核通过 */
export interface TeamRewardApprovedPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  reviewer_id: string;
  review_note?: string;
  approved_at: string;
}

/** 团队奖励转 payable */
export interface TeamRewardPayablePayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  payable_at: string;
}

/** 团队奖励已支付 */
export interface TeamRewardPaidPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  paid_at: string;
  paid_amount: string;
  currency: string;
}

/** 团队奖励追回 */
export interface TeamRewardRecoveredPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  reason: string;
  approval_id?: string;
  recovered_at: string;
  recovered_amount: string;
}

/** 团队奖励取消 */
export interface TeamRewardCancelledPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  reason: string;
  cancelled_at: string;
}

/** 团队奖励风控冻结 */
export interface TeamRewardRiskHoldPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  reason: string;
  risk_score: number;
  risk_level: string;
}

/** 所有 Team Payload 联合类型 */
export type TeamEventPayload =
  | StructureCreatedPayload
  | StructureUpdatedPayload
  | ServiceRecordCreatedPayload
  | ServiceRecordApprovedPayload
  | ServiceRecordRejectedPayload
  | TeamRewardCreatedPayload
  | TeamRewardWaitingServicePayload
  | TeamRewardLockedPayload
  | TeamRewardApprovedPayload
  | TeamRewardPayablePayload
  | TeamRewardPaidPayload
  | TeamRewardRecoveredPayload
  | TeamRewardCancelledPayload
  | TeamRewardRiskHoldPayload;

// ============================================================
// 4. 工具函数
// ============================================================

export function isValidTeamEvent(event: string): event is FjnTeamEvent {
  return ALL_TEAM_EVENTS.includes(event as FjnTeamEvent);
}

export function isValidTeamEventSource(source: string): source is FjnTeamEventSource {
  return Object.values(TEAM_EVENT_SOURCES).includes(source as FjnTeamEventSource);
}
