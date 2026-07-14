/**
 * FJN Region Service - 事件定义
 *
 * 严格遵循工业级规范（参考 H015 + H018）：
 *  - Region/Restriction/IP Geo 全部事件常量
 *  - 事件 source 枚举
 *  - 完整 Payload 接口（用于 outbox/事件总线）
 *
 * 用法：
 *   import { REGION_EVENTS, REGION_EVENT_SOURCES } from './region-events';
 *   await emitOutboxEvent(tx, REGION_EVENTS.REGION_CREATED, payload);
 */

import type {
  FjnRegionLevel,
  FjnRegionStatus,
  FjnRestrictionType,
  FjnRestrictionSource,
  FjnIpVersion,
} from './region-state-machine';

// ============================================================
// 1. Region 事件常量（10 个）
// ============================================================

export const REGION_EVENTS = {
  // Region 事件（4 个）
  REGION_CREATED: 'region.region.created.v1',
  REGION_UPDATED: 'region.region.updated.v1',
  REGION_DISABLED: 'region.region.disabled.v1',
  REGION_DEPRECATED: 'region.region.deprecated.v1',

  // Restriction 事件（4 个）
  RESTRICTION_ADDED: 'region.restriction.added.v1',
  RESTRICTION_REMOVED: 'region.restriction.removed.v1',
  RESTRICTION_EXPIRED: 'region.restriction.expired.v1',
  RESTRICTION_MATCHED: 'region.restriction.matched.v1',

  // IP Geo 事件（2 个）
  IP_GEO_REGISTERED: 'region.ip_geo.registered.v1',
  IP_GEO_RESOLVED: 'region.ip_geo.resolved.v1',
} as const;

export type FjnRegionEventName =
  (typeof REGION_EVENTS)[keyof typeof REGION_EVENTS];

export const ALL_REGION_EVENTS: readonly FjnRegionEventName[] =
  Object.values(REGION_EVENTS);

// ============================================================
// 2. 事件来源
// ============================================================

export const REGION_EVENT_SOURCES = {
  USER: 'user',
  ADMIN: 'admin',
  SYSTEM: 'system',
  SCHEDULER: 'scheduler',
  RISK_ENGINE: 'risk_engine',
  IP_GEO_PROVIDER: 'ip_geo_provider',
  COMPLIANCE_OFFICER: 'compliance_officer',
} as const;

export type FjnRegionEventSource =
  (typeof REGION_EVENT_SOURCES)[keyof typeof REGION_EVENT_SOURCES];

export const ALL_REGION_EVENT_SOURCES: readonly FjnRegionEventSource[] =
  Object.values(REGION_EVENT_SOURCES);

// ============================================================
// 3. Region Payload
// ============================================================

/** Region Created Payload */
export interface RegionCreatedPayload {
  occurred_at: string;
  source: FjnRegionEventSource;
  region_id: string;
  region_code: string;
  region_name: string;
  level: FjnRegionLevel;
  parent_id?: string;
  country_code: string;
  operator_id?: string;
}

/** Region Updated Payload */
export interface RegionUpdatedPayload {
  occurred_at: string;
  source: FjnRegionEventSource;
  region_id: string;
  region_code: string;
  changed_fields: string[];
  operator_id?: string;
}

/** Region Disabled Payload */
export interface RegionDisabledPayload {
  occurred_at: string;
  source: FjnRegionEventSource;
  region_id: string;
  region_code: string;
  reason?: string;
  operator_id?: string;
}

/** Region Deprecated Payload */
export interface RegionDeprecatedPayload {
  occurred_at: string;
  source: FjnRegionEventSource;
  region_id: string;
  region_code: string;
  reason?: string;
  operator_id?: string;
}

// ============================================================
// 4. Restriction Payload
// ============================================================

/** Restriction Added Payload */
export interface RestrictionAddedPayload {
  occurred_at: string;
  source: FjnRegionEventSource;
  restriction_id: string;
  region_id: string;
  region_code: string;
  restriction_type: FjnRestrictionType;
  restriction_source: FjnRestrictionSource;
  reason?: string;
  expires_at?: string;
  operator_id?: string;
}

/** Restriction Removed Payload */
export interface RestrictionRemovedPayload {
  occurred_at: string;
  source: FjnRegionEventSource;
  restriction_id: string;
  region_id: string;
  region_code: string;
  reason?: string;
  operator_id?: string;
}

/** Restriction Expired Payload */
export interface RestrictionExpiredPayload {
  occurred_at: string;
  source: FjnRegionEventSource;
  restriction_id: string;
  region_id: string;
  region_code: string;
  restriction_type: FjnRestrictionType;
  expired_at: string;
}

/** Restriction Matched Payload（运行时命中，下游触发风控） */
export interface RestrictionMatchedPayload {
  occurred_at: string;
  source: FjnRegionEventSource;
  restriction_id: string;
  region_id: string;
  region_code: string;
  restriction_type: FjnRestrictionType;
  matched_user_id?: string;
  matched_action: string;
}

// ============================================================
// 5. IP Geo Payload
// ============================================================

/** IP Geo Registered Payload */
export interface IpGeoRegisteredPayload {
  occurred_at: string;
  source: FjnRegionEventSource;
  ip_geo_id: string;
  ip_range_start: string;
  ip_range_end: string;
  ip_version: FjnIpVersion;
  region_id: string;
  region_code: string;
  country_code: string;
  isp?: string;
  operator_id?: string;
}

/** IP Geo Resolved Payload（运行时解析） */
export interface IpGeoResolvedPayload {
  occurred_at: string;
  source: FjnRegionEventSource;
  ip_address: string;
  ip_version: FjnIpVersion;
  region_id: string;
  region_code: string;
  country_code: string;
  hit_geo_id: string;
  latency_ms: number;
}

// ============================================================
// 6. 工具：按事件名推断 payload 类型
// ============================================================

export type FjnRegionEventPayloadMap = {
  [REGION_EVENTS.REGION_CREATED]: RegionCreatedPayload;
  [REGION_EVENTS.REGION_UPDATED]: RegionUpdatedPayload;
  [REGION_EVENTS.REGION_DISABLED]: RegionDisabledPayload;
  [REGION_EVENTS.REGION_DEPRECATED]: RegionDeprecatedPayload;
  [REGION_EVENTS.RESTRICTION_ADDED]: RestrictionAddedPayload;
  [REGION_EVENTS.RESTRICTION_REMOVED]: RestrictionRemovedPayload;
  [REGION_EVENTS.RESTRICTION_EXPIRED]: RestrictionExpiredPayload;
  [REGION_EVENTS.RESTRICTION_MATCHED]: RestrictionMatchedPayload;
  [REGION_EVENTS.IP_GEO_REGISTERED]: IpGeoRegisteredPayload;
  [REGION_EVENTS.IP_GEO_RESOLVED]: IpGeoResolvedPayload;
};

/** 推断 outbox 事件对应 payload 类型 */
export type FjnRegionEventPayload<E extends FjnRegionEventName> =
  FjnRegionEventPayloadMap[E];
