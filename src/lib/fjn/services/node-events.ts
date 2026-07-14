/**
 * FJN Node Service - 事件常量 + Payload 接口
 *
 * 严格遵循 H030 设计规范 + H015 工业级事件规范：
 *  - 事件名使用 <domain>.<action>.v1 格式
 *  - Payload 必须包含 id + 关键业务字段 + 时间戳
 *  - 事件源（source）明确标识生产者
 *
 * 用法：
 *   import { NODE_EVENTS, NODE_EVENT_SOURCES } from './node-events';
 *   await tx.outboxEvent.create({ data: { eventType: NODE_EVENTS.REWARD_CREATED, ... } });
 */

import {
  FjnNodeStatus,
  FjnNodeRewardStatus,
  FjnNodeKybStatus,
  FjnNodeServiceRecordStatus,
} from './node-state-machine';

// ============================================================
// 1. 事件常量
// ============================================================

/**
 * Node Service 事件列表（H030 设计 + 现有 schema 字段）
 */
export const NODE_EVENTS = {
  // 节点生命周期
  NODE_CREATED: 'node.created.v1',
  NODE_APPROVED: 'node.approved.v1',
  NODE_ACTIVATED: 'node.activated.v1',
  NODE_RESTRICTED: 'node.restricted.v1',
  NODE_SUSPENDED: 'node.suspended.v1',
  NODE_TERMINATED: 'node.terminated.v1',
  NODE_BLACKLISTED: 'node.blacklisted.v1',

  // KYB
  KYB_SUBMITTED: 'node.kyb_submitted.v1',
  KYB_APPROVED: 'node.kyb_approved.v1',
  KYB_REJECTED: 'node.kyb_rejected.v1',

  // 服务记录
  SERVICE_RECORD_CREATED: 'node.service_record_created.v1',
  SERVICE_RECORD_APPROVED: 'node.service_record_approved.v1',
  SERVICE_RECORD_REJECTED: 'node.service_record_rejected.v1',

  // 节点奖励
  REWARD_CREATED: 'node.reward_created.v1',
  REWARD_WAITING_SERVICE: 'node.reward_waiting_service.v1',
  REWARD_LOCKED: 'node.reward_locked.v1',
  REWARD_APPROVED: 'node.reward_approved.v1',
  REWARD_PAYABLE: 'node.reward_payable.v1',
  REWARD_PAID: 'node.reward_paid.v1',
  REWARD_RECOVERED: 'node.reward_recovered.v1',
  REWARD_CANCELLED: 'node.reward_cancelled.v1',
  REWARD_RISK_HOLD: 'node.reward_risk_hold.v1',
} as const;

export type FjnNodeEvent = (typeof NODE_EVENTS)[keyof typeof NODE_EVENTS];

/** 所有 Node 事件 */
export const ALL_NODE_EVENTS = Object.values(NODE_EVENTS);

/** Node 事件总数 */
export const NODE_EVENT_COUNT = ALL_NODE_EVENTS.length;

// ============================================================
// 2. 事件源
// ============================================================

export const NODE_EVENT_SOURCES = {
  SYSTEM: 'system',
  USER: 'user',
  ADMIN: 'admin',
  ORDER: 'order',
  PAYMENT: 'payment',
  RISK: 'risk',
  CRON: 'cron',
  FINANCE: 'finance',
  NODE: 'node',
  SERVICE: 'service',
  COMPLIANCE: 'compliance',
} as const;

export type FjnNodeEventSource =
  (typeof NODE_EVENT_SOURCES)[keyof typeof NODE_EVENT_SOURCES];

// ============================================================
// 3. Payload 接口
// ============================================================

interface BaseEventPayload {
  occurred_at: string;
  source: FjnNodeEventSource;
}

// ============================================================
// 3.1 节点生命周期 Payload
// ============================================================

/** 节点创建 */
export interface NodeCreatedPayload extends BaseEventPayload {
  node_id: string;
  node_no: string;
  user_id: string;
  node_name: string;
  node_level: string;
  region_code: string;
  country_code: string;
  status: FjnNodeStatus;
}

/** 节点审核通过 */
export interface NodeApprovedPayload extends BaseEventPayload {
  node_id: string;
  node_no: string;
  user_id: string;
  approver_id: string;
  approved_at: string;
}

/** 节点激活 */
export interface NodeActivatedPayload extends BaseEventPayload {
  node_id: string;
  node_no: string;
  activated_at: string;
}

/** 节点受限 */
export interface NodeRestrictedPayload extends BaseEventPayload {
  node_id: string;
  node_no: string;
  reason: string;
  operator_id?: string;
  restricted_at: string;
}

/** 节点暂停 */
export interface NodeSuspendedPayload extends BaseEventPayload {
  node_id: string;
  node_no: string;
  reason: string;
  operator_id?: string;
  suspended_at: string;
}

/** 节点终止 */
export interface NodeTerminatedPayload extends BaseEventPayload {
  node_id: string;
  node_no: string;
  reason: string;
  operator_id?: string;
  terminated_at: string;
}

/** 节点黑名单 */
export interface NodeBlacklistedPayload extends BaseEventPayload {
  node_id: string;
  node_no: string;
  reason: string;
  operator_id?: string;
  blacklisted_at: string;
}

// ============================================================
// 3.2 KYB Payload
// ============================================================

/** KYB 提交 */
export interface KybSubmittedPayload extends BaseEventPayload {
  node_id: string;
  node_no: string;
  kyb_status: FjnNodeKybStatus;
  submitted_at: string;
}

/** KYB 通过 */
export interface KybApprovedPayload extends BaseEventPayload {
  node_id: string;
  node_no: string;
  kyb_status: FjnNodeKybStatus;
  approver_id: string;
  approved_at: string;
}

/** KYB 拒绝 */
export interface KybRejectedPayload extends BaseEventPayload {
  node_id: string;
  node_no: string;
  kyb_status: FjnNodeKybStatus;
  approver_id: string;
  reason?: string;
  rejected_at: string;
}

// ============================================================
// 3.3 服务记录 Payload
// ============================================================

/** 节点服务记录创建 */
export interface NodeServiceRecordCreatedPayload extends BaseEventPayload {
  record_id: string;
  record_no: string;
  node_id: string;
  user_id: string;
  service_type: string;
  title: string;
  service_date: string;
  participants: number;
  status: FjnNodeServiceRecordStatus;
}

/** 节点服务记录审核通过 */
export interface NodeServiceRecordApprovedPayload extends BaseEventPayload {
  record_id: string;
  record_no: string;
  node_id: string;
  user_id: string;
  reviewer_id: string;
  review_note?: string;
  approved_at: string;
}

/** 节点服务记录拒绝 */
export interface NodeServiceRecordRejectedPayload extends BaseEventPayload {
  record_id: string;
  record_no: string;
  node_id: string;
  user_id: string;
  reviewer_id: string;
  review_note?: string;
  rejected_at: string;
}

// ============================================================
// 3.4 节点奖励 Payload
// ============================================================

/** 节点奖励创建 */
export interface NodeRewardCreatedPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  order_id: string;
  node_id: string;
  user_id: string;          // 节点受益人
  order_user_id: string;    // 下单用户
  node_level: string;
  reward_rate: string;
  order_amount: string;
  reward_amount: string;
  tax_amount: string;
  net_amount: string;
  currency: string;
  status: FjnNodeRewardStatus;
}

/** 节点奖励等待服务记录 */
export interface NodeRewardWaitingServicePayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  waiting_at: string;
  service_record_required: boolean;
}

/** 节点奖励锁定 */
export interface NodeRewardLockedPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  locked_at: string;
  service_record_id?: string;
}

/** 节点奖励审核通过 */
export interface NodeRewardApprovedPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  reviewer_id: string;
  review_note?: string;
  approved_at: string;
}

/** 节点奖励转 payable */
export interface NodeRewardPayablePayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  payable_at: string;
}

/** 节点奖励已支付 */
export interface NodeRewardPaidPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  paid_at: string;
  paid_amount: string;
  currency: string;
}

/** 节点奖励追回 */
export interface NodeRewardRecoveredPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  reason: string;
  approval_id?: string;
  recovered_at: string;
  recovered_amount: string;
}

/** 节点奖励取消 */
export interface NodeRewardCancelledPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  reason: string;
  cancelled_at: string;
}

/** 节点奖励风控冻结 */
export interface NodeRewardRiskHoldPayload extends BaseEventPayload {
  reward_id: string;
  reward_no: string;
  reason: string;
  risk_score: number;
  risk_level: string;
}

/** 所有 Node Payload 联合类型 */
export type NodeEventPayload =
  | NodeCreatedPayload
  | NodeApprovedPayload
  | NodeActivatedPayload
  | NodeRestrictedPayload
  | NodeSuspendedPayload
  | NodeTerminatedPayload
  | NodeBlacklistedPayload
  | KybSubmittedPayload
  | KybApprovedPayload
  | KybRejectedPayload
  | NodeServiceRecordCreatedPayload
  | NodeServiceRecordApprovedPayload
  | NodeServiceRecordRejectedPayload
  | NodeRewardCreatedPayload
  | NodeRewardWaitingServicePayload
  | NodeRewardLockedPayload
  | NodeRewardApprovedPayload
  | NodeRewardPayablePayload
  | NodeRewardPaidPayload
  | NodeRewardRecoveredPayload
  | NodeRewardCancelledPayload
  | NodeRewardRiskHoldPayload;

// ============================================================
// 4. 工具函数
// ============================================================

export function isValidNodeEvent(event: string): event is FjnNodeEvent {
  return ALL_NODE_EVENTS.includes(event as FjnNodeEvent);
}

export function isValidNodeEventSource(source: string): source is FjnNodeEventSource {
  return Object.values(NODE_EVENT_SOURCES).includes(source as FjnNodeEventSource);
}
