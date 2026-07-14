/**
 * FJN Points Service - 事件定义
 *
 * 严格遵循工业级规范（参考 H015 + H023）：
 *  - 12 个事件常量
 *  - 事件 source 枚举
 *  - 完整 Payload 接口
 *
 * 用法：
 *   import { POINTS_EVENTS, POINTS_EVENT_SOURCES } from './points-events';
 *   await emitOutboxEvent(tx, POINTS_EVENTS.POINTS_EARNED, payload);
 */

import type {
  FjnPointsAssetType,
  FjnPointsChangeType,
  FjnPointsSourceType,
  FjnPointsBizType,
  FjnPointsSnapshotType,
  FjnPointsRiskStatus,
} from './points-state-machine';

// ============================================================
// 1. 事件常量（12 个）
// ============================================================

export const POINTS_EVENTS = {
  // Account 事件（3 个）
  POINTS_ACCOUNT_OPENED: 'points.account.opened.v1',
  POINTS_ACCOUNT_FROZEN: 'points.account.frozen.v1',
  POINTS_ACCOUNT_CLOSED: 'points.account.closed.v1',

  // Ledger 事件（5 个）
  POINTS_EARNED: 'points.earned.v1',
  POINTS_CONSUMED: 'points.consumed.v1',
  POINTS_FROZEN: 'points.frozen.v1',
  POINTS_UNFROZEN: 'points.unfrozen.v1',
  POINTS_REVERSED: 'points.reversed.v1',

  // Rule 事件（2 个）
  POINTS_RULE_CREATED: 'points.rule.created.v1',
  POINTS_RULE_ACTIVATED: 'points.rule.activated.v1',

  // Snapshot 事件（2 个）
  POINTS_SNAPSHOT_CREATED: 'points.snapshot.created.v1',
  POINTS_EXPIRED: 'points.expired.v1',
} as const;

export type FjnPointsEventName =
  (typeof POINTS_EVENTS)[keyof typeof POINTS_EVENTS];

export const ALL_POINTS_EVENTS: readonly FjnPointsEventName[] =
  Object.values(POINTS_EVENTS);

// ============================================================
// 2. 事件来源
// ============================================================

export const POINTS_EVENT_SOURCES = {
  USER: 'user',
  ADMIN: 'admin',
  SYSTEM: 'system',
  SCHEDULER: 'scheduler',
  ORDER_SERVICE: 'order_service',
  REFERRAL_SERVICE: 'referral_service',
  TEAM_SERVICE: 'team_service',
  NODE_SERVICE: 'node_service',
  NFT_SERVICE: 'nft_service',
  RELEASE_SERVICE: 'release_service',
  MALL_SERVICE: 'mall_service',
  AI_SERVICE: 'ai_service',
  RISK_ENGINE: 'risk_engine',
  FINANCE_SERVICE: 'finance_service',
  POINTS_SERVICE: 'points_service',
} as const;

export type FjnPointsEventSource =
  (typeof POINTS_EVENT_SOURCES)[keyof typeof POINTS_EVENT_SOURCES];

export const ALL_POINTS_EVENT_SOURCES: readonly FjnPointsEventSource[] =
  Object.values(POINTS_EVENT_SOURCES);

// ============================================================
// 3. Account Payload
// ============================================================

export interface PointsAccountOpenedPayload {
  occurred_at: string;
  source: FjnPointsEventSource;
  account_id: string;
  user_id: string;
  asset_type: FjnPointsAssetType;
  operator_id?: string;
}

export interface PointsAccountFrozenPayload {
  occurred_at: string;
  source: FjnPointsEventSource;
  account_id: string;
  user_id: string;
  asset_type: FjnPointsAssetType;
  reason?: string;
  operator_id?: string;
}

export interface PointsAccountClosedPayload {
  occurred_at: string;
  source: FjnPointsEventSource;
  account_id: string;
  user_id: string;
  asset_type: FjnPointsAssetType;
  reason?: string;
  operator_id?: string;
}

// ============================================================
// 4. Ledger Payload
// ============================================================

export interface PointsEarnedPayload {
  occurred_at: string;
  source: FjnPointsEventSource;
  ledger_id: string;
  ledger_no: string;
  account_id: string;
  user_id: string;
  asset_type: FjnPointsAssetType;
  amount: string;
  balance_after: string;
  source_type: FjnPointsSourceType;
  source_id?: string;
  biz_type: FjnPointsBizType;
  biz_no?: string;
  rule_code?: string;
  rule_version?: string;
  operator_id?: string;
}

export interface PointsConsumedPayload {
  occurred_at: string;
  source: FjnPointsEventSource;
  ledger_id: string;
  ledger_no: string;
  account_id: string;
  user_id: string;
  asset_type: FjnPointsAssetType;
  amount: string;
  balance_after: string;
  source_type: FjnPointsSourceType;
  source_id?: string;
  biz_type: FjnPointsBizType;
  biz_no?: string;
  rule_code?: string;
  risk_status: FjnPointsRiskStatus;
  operator_id?: string;
}

export interface PointsFrozenPayload {
  occurred_at: string;
  source: FjnPointsEventSource;
  freeze_id: string;
  account_id: string;
  user_id: string;
  asset_type: FjnPointsAssetType;
  amount: string;
  reason: string;
  source_type?: FjnPointsSourceType;
  source_id?: string;
  expires_at?: string;
  operator_id?: string;
}

export interface PointsUnfrozenPayload {
  occurred_at: string;
  source: FjnPointsEventSource;
  freeze_id: string;
  account_id: string;
  user_id: string;
  asset_type: FjnPointsAssetType;
  unfreeze_amount: string;
  reason?: string;
  operator_id?: string;
}

export interface PointsReversedPayload {
  occurred_at: string;
  source: FjnPointsEventSource;
  reversal_id: string;
  reversal_no: string;
  account_id: string;
  user_id: string;
  asset_type: FjnPointsAssetType;
  original_ledger_id?: string;
  reversed_amount: string;
  reason: string;
  operator_id?: string;
}

// ============================================================
// 5. Rule Payload
// ============================================================

export interface PointsRuleCreatedPayload {
  occurred_at: string;
  source: FjnPointsEventSource;
  rule_id: string;
  rule_code: string;
  version: string;
  asset_type: FjnPointsAssetType;
  effective_from?: string;
  effective_to?: string;
  created_by?: string;
}

export interface PointsRuleActivatedPayload {
  occurred_at: string;
  source: FjnPointsEventSource;
  rule_id: string;
  rule_code: string;
  version: string;
  asset_type: FjnPointsAssetType;
  approved_by?: string;
}

// ============================================================
// 6. Snapshot Payload
// ============================================================

export interface PointsSnapshotCreatedPayload {
  occurred_at: string;
  source: FjnPointsEventSource;
  snapshot_id: string;
  snapshot_no: string;
  snapshot_type: FjnPointsSnapshotType;
  asset_type: FjnPointsAssetType;
  total_users: number;
  total_supply: string;
  created_by?: string;
}

export interface PointsExpiredPayload {
  occurred_at: string;
  source: FjnPointsEventSource;
  account_id: string;
  user_id: string;
  asset_type: FjnPointsAssetType;
  expired_amount: string;
  expired_ledger_id: string;
  reason: string;
}

// ============================================================
// 7. 工具：按事件名推断 payload 类型
// ============================================================

export type FjnPointsEventPayloadMap = {
  [POINTS_EVENTS.POINTS_ACCOUNT_OPENED]: PointsAccountOpenedPayload;
  [POINTS_EVENTS.POINTS_ACCOUNT_FROZEN]: PointsAccountFrozenPayload;
  [POINTS_EVENTS.POINTS_ACCOUNT_CLOSED]: PointsAccountClosedPayload;
  [POINTS_EVENTS.POINTS_EARNED]: PointsEarnedPayload;
  [POINTS_EVENTS.POINTS_CONSUMED]: PointsConsumedPayload;
  [POINTS_EVENTS.POINTS_FROZEN]: PointsFrozenPayload;
  [POINTS_EVENTS.POINTS_UNFROZEN]: PointsUnfrozenPayload;
  [POINTS_EVENTS.POINTS_REVERSED]: PointsReversedPayload;
  [POINTS_EVENTS.POINTS_RULE_CREATED]: PointsRuleCreatedPayload;
  [POINTS_EVENTS.POINTS_RULE_ACTIVATED]: PointsRuleActivatedPayload;
  [POINTS_EVENTS.POINTS_SNAPSHOT_CREATED]: PointsSnapshotCreatedPayload;
  [POINTS_EVENTS.POINTS_EXPIRED]: PointsExpiredPayload;
};

export type FjnPointsEventPayload<E extends FjnPointsEventName> =
  FjnPointsEventPayloadMap[E];
