/**
 * FJN Risk Service - 事件常量 + Payload 接口
 *
 * 严格遵循 H034 + H015 工业级事件规范
 */
import {
  FjnRiskEventStatus,
  FjnRiskCaseStatus,
  FjnRiskLevel,
  FjnRiskAction,
  FjnRiskType,
  FjnBlacklistCategory,
} from './risk-state-machine';

export const RISK_EVENTS = {
  // 规则
  RULE_CREATED: 'risk.rule_created.v1',
  RULE_UPDATED: 'risk.rule_updated.v1',
  RULE_DISABLED: 'risk.rule_disabled.v1',
  RULE_ENABLED: 'risk.rule_enabled.v1',
  // 事件
  EVENT_RECORDED: 'risk.event_recorded.v1',
  EVENT_REVIEWING: 'risk.event_reviewing.v1',
  EVENT_RESOLVED: 'risk.event_resolved.v1',
  EVENT_ESCALATED: 'risk.event_escalated.v1',
  // 案件
  CASE_OPENED: 'risk.case_opened.v1',
  CASE_ASSIGNED: 'risk.case_assigned.v1',
  CASE_RESOLVED: 'risk.case_resolved.v1',
  CASE_CLOSED: 'risk.case_closed.v1',
  CASE_REOPENED: 'risk.case_reopened.v1',
  // 分数
  SCORE_UPDATED: 'risk.score_updated.v1',
  // 黑名单
  BLACKLIST_ADDED: 'risk.blacklist_added.v1',
  BLACKLIST_REMOVED: 'risk.blacklist_removed.v1',
  BLACKLIST_EXPIRED: 'risk.blacklist_expired.v1',
  // 设备
  DEVICE_REGISTERED: 'risk.device_registered.v1',
  DEVICE_UPDATED: 'risk.device_updated.v1',
} as const;

export type FjnRiskEvent = (typeof RISK_EVENTS)[keyof typeof RISK_EVENTS];
export const ALL_RISK_EVENTS = Object.values(RISK_EVENTS);
export const RISK_EVENT_COUNT = ALL_RISK_EVENTS.length;

export const RISK_EVENT_SOURCES = {
  SYSTEM: 'system',
  USER: 'user',
  ADMIN: 'admin',
  ORDER: 'order',
  PAYMENT: 'payment',
  REFERRAL: 'referral',
  REWARD: 'reward',
  KYC: 'kyc',
  WALLET: 'wallet',
  NODE: 'node',
  TEAM: 'team',
  RISK: 'risk',
  COMPLIANCE: 'compliance',
  CRON: 'cron',
} as const;

export type FjnRiskEventSource = (typeof RISK_EVENT_SOURCES)[keyof typeof RISK_EVENT_SOURCES];

interface BaseEventPayload {
  occurred_at: string;
  source: FjnRiskEventSource;
}

// 规则
export interface RiskRuleCreatedPayload extends BaseEventPayload {
  rule_id: string;
  rule_code: string;
  rule_name: string;
  rule_type: FjnRiskType;
  risk_level: FjnRiskLevel;
  action: FjnRiskAction;
  enabled: boolean;
}
export interface RiskRuleUpdatedPayload extends BaseEventPayload {
  rule_id: string;
  rule_code: string;
  changes: Record<string, unknown>;
}
export interface RiskRuleDisabledPayload extends BaseEventPayload {
  rule_id: string;
  rule_code: string;
  reason?: string;
}
export interface RiskRuleEnabledPayload extends BaseEventPayload {
  rule_id: string;
  rule_code: string;
  operator_id?: string;
}

// 事件
export interface RiskEventRecordedPayload extends BaseEventPayload {
  event_id: string;
  event_no: string;
  event_type: FjnRiskType;
  user_id?: string;
  risk_level: FjnRiskLevel;
  risk_score: number;
  source_type?: string;
  source_id?: string;
  action: FjnRiskAction;
  status: FjnRiskEventStatus;
}
export interface RiskEventReviewingPayload extends BaseEventPayload {
  event_id: string;
  event_no: string;
  reviewer_id: string;
}
export interface RiskEventResolvedPayload extends BaseEventPayload {
  event_id: string;
  event_no: string;
  reviewer_id?: string;
  review_note?: string;
  resolution: string;
}
export interface RiskEventEscalatedPayload extends BaseEventPayload {
  event_id: string;
  event_no: string;
  reason: string;
  target_level: FjnRiskLevel;
}

// 案件
export interface RiskCaseOpenedPayload extends BaseEventPayload {
  case_id: string;
  case_no: string;
  case_type: FjnRiskType;
  user_id: string;
  risk_level: FjnRiskLevel;
  related_event_ids?: string[];
}
export interface RiskCaseAssignedPayload extends BaseEventPayload {
  case_id: string;
  case_no: string;
  assigned_to: string;
}
export interface RiskCaseResolvedPayload extends BaseEventPayload {
  case_id: string;
  case_no: string;
  resolution: string;
  action: FjnRiskAction;
}
export interface RiskCaseClosedPayload extends BaseEventPayload {
  case_id: string;
  case_no: string;
  resolution: string;
}
export interface RiskCaseReopenedPayload extends BaseEventPayload {
  case_id: string;
  case_no: string;
  reason: string;
}

// 分数
export interface RiskScoreUpdatedPayload extends BaseEventPayload {
  user_id: string;
  score_type: string;
  score: number;
  risk_level: FjnRiskLevel;
  factors?: Record<string, unknown>;
}

// 黑名单
export interface BlacklistAddedPayload extends BaseEventPayload {
  blacklist_id: string;
  category: FjnBlacklistCategory;
  value: string;
  reason: string;
  expires_at?: string;
}
export interface BlacklistRemovedPayload extends BaseEventPayload {
  blacklist_id: string;
  category: FjnBlacklistCategory;
  value: string;
  reason: string;
}
export interface BlacklistExpiredPayload extends BaseEventPayload {
  blacklist_id: string;
  category: FjnBlacklistCategory;
  value: string;
}

// 设备
export interface DeviceRegisteredPayload extends BaseEventPayload {
  device_id: string;
  fingerprint: string;
  user_id?: string;
  ip_address?: string;
  country_code?: string;
  risk_level: FjnRiskLevel;
}
export interface DeviceUpdatedPayload extends BaseEventPayload {
  device_id: string;
  fingerprint: string;
  risk_level: FjnRiskLevel;
  visit_count: number;
}

export type RiskEventPayload =
  | RiskRuleCreatedPayload
  | RiskRuleUpdatedPayload
  | RiskRuleDisabledPayload
  | RiskRuleEnabledPayload
  | RiskEventRecordedPayload
  | RiskEventReviewingPayload
  | RiskEventResolvedPayload
  | RiskEventEscalatedPayload
  | RiskCaseOpenedPayload
  | RiskCaseAssignedPayload
  | RiskCaseResolvedPayload
  | RiskCaseClosedPayload
  | RiskCaseReopenedPayload
  | RiskScoreUpdatedPayload
  | BlacklistAddedPayload
  | BlacklistRemovedPayload
  | BlacklistExpiredPayload
  | DeviceRegisteredPayload
  | DeviceUpdatedPayload;

export function isValidRiskEvent(event: string): event is FjnRiskEvent {
  return ALL_RISK_EVENTS.includes(event as FjnRiskEvent);
}
export function isValidRiskEventSource(source: string): source is FjnRiskEventSource {
  return Object.values(RISK_EVENT_SOURCES).includes(source as FjnRiskEventSource);
}
