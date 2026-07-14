/**
 * FJN Region Service - 状态机
 *
 * 严格遵循工业级分层（参考 H015 + H018）：
 *  - Region 状态机：active | disabled | deprecated
 *  - RegionRestriction 状态机：active | disabled | expired
 *  - IpGeoRange 状态机：active | disabled
 *  - 通用枚举：RegionLevel（country/province/city/district）、RestrictionType、RestrictionAction
 *
 * 业务背景：
 *  - 三级地区：country → province → city（保留 district 扩展）
 *  - ISO 3166-1 alpha-2（CN/US/JP…）国家代码
 *  - ISO 3166-2（CN-FJ、CN-35）省/州代码
 *  - 地区限制可绑定到任意 level 节点
 *  - IP 段→地区解析（按 IP 数值范围）
 *
 * 用法：
 *   import { REGION_STATUS, REGION_LEVEL, canTransitRegionStatus } from './region-state-machine';
 */

import { FjnStateMachineError } from '../errors';

// ============================================================
// 1. Region 状态机
// ============================================================

/** Region 状态 */
export const REGION_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
  DEPRECATED: 'deprecated',
} as const;

export type FjnRegionStatus = (typeof REGION_STATUS)[keyof typeof REGION_STATUS];

export const ALL_REGION_STATUSES: readonly FjnRegionStatus[] =
  Object.values(REGION_STATUS);

/** 终态：DEPRECATED 不可恢复 */
export const TERMINAL_REGION_STATUSES: readonly FjnRegionStatus[] = [
  REGION_STATUS.DEPRECATED,
] as const;

/** Region 状态流转表 */
export const REGION_STATUS_TRANSITIONS: Record<FjnRegionStatus, readonly FjnRegionStatus[]> = {
  [REGION_STATUS.ACTIVE]: [REGION_STATUS.DISABLED, REGION_STATUS.DEPRECATED],
  [REGION_STATUS.DISABLED]: [REGION_STATUS.ACTIVE, REGION_STATUS.DEPRECATED],
  [REGION_STATUS.DEPRECATED]: [],
} as const;

// ============================================================
// 2. RegionRestriction 状态机
// ============================================================

/** RegionRestriction 状态（地区限制：限售/禁运/风控） */
export const RESTRICTION_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
  EXPIRED: 'expired',
} as const;

export type FjnRestrictionStatus =
  (typeof RESTRICTION_STATUS)[keyof typeof RESTRICTION_STATUS];

export const ALL_RESTRICTION_STATUSES: readonly FjnRestrictionStatus[] =
  Object.values(RESTRICTION_STATUS);

export const RESTRICTION_STATUS_TRANSITIONS: Record<FjnRestrictionStatus, readonly FjnRestrictionStatus[]> = {
  [RESTRICTION_STATUS.ACTIVE]: [
    RESTRICTION_STATUS.DISABLED,
    RESTRICTION_STATUS.EXPIRED,
  ],
  [RESTRICTION_STATUS.DISABLED]: [RESTRICTION_STATUS.ACTIVE, RESTRICTION_STATUS.EXPIRED],
  [RESTRICTION_STATUS.EXPIRED]: [RESTRICTION_STATUS.ACTIVE],
} as const;

// ============================================================
// 3. IpGeoRange 状态机
// ============================================================

/** IP 段状态 */
export const IP_GEO_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
} as const;

export type FjnIpGeoStatus = (typeof IP_GEO_STATUS)[keyof typeof IP_GEO_STATUS];

export const ALL_IP_GEO_STATUSES: readonly FjnIpGeoStatus[] =
  Object.values(IP_GEO_STATUS);

export const IP_GEO_STATUS_TRANSITIONS: Record<FjnIpGeoStatus, readonly FjnIpGeoStatus[]> = {
  [IP_GEO_STATUS.ACTIVE]: [IP_GEO_STATUS.DISABLED],
  [IP_GEO_STATUS.DISABLED]: [IP_GEO_STATUS.ACTIVE],
} as const;

// ============================================================
// 4. 通用枚举
// ============================================================

/** Region 层级 */
export const REGION_LEVEL = {
  COUNTRY: 'country',
  PROVINCE: 'province',
  CITY: 'city',
  DISTRICT: 'district',
} as const;

export type FjnRegionLevel = (typeof REGION_LEVEL)[keyof typeof REGION_LEVEL];
export const ALL_REGION_LEVELS: readonly FjnRegionLevel[] = Object.values(REGION_LEVEL);

/** 层级数字（用于排序与父级推断） */
export const REGION_LEVEL_NUMBER: Record<FjnRegionLevel, number> = {
  [REGION_LEVEL.COUNTRY]: 1,
  [REGION_LEVEL.PROVINCE]: 2,
  [REGION_LEVEL.CITY]: 3,
  [REGION_LEVEL.DISTRICT]: 4,
};

/** 父级 → 子级映射 */
export const REGION_LEVEL_CHILD: Record<FjnRegionLevel, FjnRegionLevel | null> = {
  [REGION_LEVEL.COUNTRY]: REGION_LEVEL.PROVINCE,
  [REGION_LEVEL.PROVINCE]: REGION_LEVEL.CITY,
  [REGION_LEVEL.CITY]: REGION_LEVEL.DISTRICT,
  [REGION_LEVEL.DISTRICT]: null,
};

/** 限制类型 */
export const RESTRICTION_TYPE = {
  /** 地区禁运：禁止下单/支付 */
  BLOCK_TRADE: 'block_trade',
  /** 地区 KYC 升级：必须 enhanced */
  KYC_UPGRADE: 'kyc_upgrade',
  /** 地区风险高：触发风控复核 */
  RISK_HIGH: 'risk_high',
  /** 地区合规备案：需上报 */
  COMPLIANCE_REPORT: 'compliance_report',
  /** 地区白名单：仅允许 */
  ALLOWLIST: 'allowlist',
} as const;

export type FjnRestrictionType =
  (typeof RESTRICTION_TYPE)[keyof typeof RESTRICTION_TYPE];
export const ALL_RESTRICTION_TYPES: readonly FjnRestrictionType[] =
  Object.values(RESTRICTION_TYPE);

/** 限制来源 */
export const RESTRICTION_SOURCE = {
  REGULATOR: 'regulator',
  INTERNAL: 'internal',
  PARTNER: 'partner',
  RISK_ENGINE: 'risk_engine',
  SANCTIONS: 'sanctions',
} as const;

export type FjnRestrictionSource =
  (typeof RESTRICTION_SOURCE)[keyof typeof RESTRICTION_SOURCE];
export const ALL_RESTRICTION_SOURCES: readonly FjnRestrictionSource[] =
  Object.values(RESTRICTION_SOURCE);

/** IP 协议版本 */
export const IP_VERSION = {
  IPV4: 'ipv4',
  IPV6: 'ipv6',
} as const;

export type FjnIpVersion = (typeof IP_VERSION)[keyof typeof IP_VERSION];
export const ALL_IP_VERSIONS: readonly FjnIpVersion[] = Object.values(IP_VERSION);

// ============================================================
// 5. 工具：状态机校验
// ============================================================

export function isValidRegionStatus(s: string): s is FjnRegionStatus {
  return (ALL_REGION_STATUSES as readonly string[]).includes(s);
}

export function isValidRestrictionStatus(s: string): s is FjnRestrictionStatus {
  return (ALL_RESTRICTION_STATUSES as readonly string[]).includes(s);
}

export function isValidIpGeoStatus(s: string): s is FjnIpGeoStatus {
  return (ALL_IP_GEO_STATUSES as readonly string[]).includes(s);
}

export function isValidRegionLevel(s: string): s is FjnRegionLevel {
  return (ALL_REGION_LEVELS as readonly string[]).includes(s);
}

export function isValidRestrictionType(s: string): s is FjnRestrictionType {
  return (ALL_RESTRICTION_TYPES as readonly string[]).includes(s);
}

export function isValidRestrictionSource(s: string): s is FjnRestrictionSource {
  return (ALL_RESTRICTION_SOURCES as readonly string[]).includes(s);
}

export function isValidIpVersion(s: string): s is FjnIpVersion {
  return (ALL_IP_VERSIONS as readonly string[]).includes(s);
}

export function isTerminalRegionStatus(s: FjnRegionStatus): boolean {
  return TERMINAL_REGION_STATUSES.includes(s);
}

export function canTransitRegionStatus(
  from: FjnRegionStatus,
  to: FjnRegionStatus,
): boolean {
  return REGION_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitRegionStatus(
  from: FjnRegionStatus,
  to: FjnRegionStatus,
): void {
  if (!canTransitRegionStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 Region 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: REGION_STATUS_TRANSITIONS[from] },
    );
  }
}

export function canTransitRestrictionStatus(
  from: FjnRestrictionStatus,
  to: FjnRestrictionStatus,
): boolean {
  return RESTRICTION_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitRestrictionStatus(
  from: FjnRestrictionStatus,
  to: FjnRestrictionStatus,
): void {
  if (!canTransitRestrictionStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 Restriction 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: RESTRICTION_STATUS_TRANSITIONS[from] },
    );
  }
}

export function canTransitIpGeoStatus(
  from: FjnIpGeoStatus,
  to: FjnIpGeoStatus,
): boolean {
  return IP_GEO_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitIpGeoStatus(
  from: FjnIpGeoStatus,
  to: FjnIpGeoStatus,
): void {
  if (!canTransitIpGeoStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 IpGeo 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: IP_GEO_STATUS_TRANSITIONS[from] },
    );
  }
}

export function nextRegionStatuses(
  from: FjnRegionStatus,
): readonly FjnRegionStatus[] {
  return REGION_STATUS_TRANSITIONS[from] ?? [];
}

export function nextRestrictionStatuses(
  from: FjnRestrictionStatus,
): readonly FjnRestrictionStatus[] {
  return RESTRICTION_STATUS_TRANSITIONS[from] ?? [];
}

// ============================================================
// 6. 业务工具
// ============================================================

/** Region 是否可用（active） */
export function isRegionUsable(s: FjnRegionStatus): boolean {
  return s === REGION_STATUS.ACTIVE;
}

/** Restriction 是否生效（active 且未过期） */
export function isRestrictionActive(
  s: FjnRestrictionStatus,
  expiresAt: Date | null | undefined,
): boolean {
  if (s !== RESTRICTION_STATUS.ACTIVE) return false;
  if (!expiresAt) return true;
  return expiresAt.getTime() > Date.now();
}

/** ISO 3166-1 alpha-2 国家代码校验：2 个大写字母 */
export function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}

/** ISO 3166-2 省/州代码校验：国家码-子码（CN-35 / US-CA） */
export function isValidSubdivisionCode(code: string): boolean {
  return /^[A-Z]{2}(-[A-Z0-9]{1,4})?$/.test(code);
}

/** Region code 格式校验：^[a-z][a-z0-9_]{1,63}$ */
export function isValidRegionCode(code: string): boolean {
  return /^[a-z][a-z0-9_]{1,63}$/.test(code);
}

/** 推断下一级：country→province / province→city / city→district / district→null */
export function childRegionLevel(
  level: FjnRegionLevel,
): FjnRegionLevel | null {
  return REGION_LEVEL_CHILD[level];
}

/** 推断父级：district→city / city→province / province→country / country→null */
export function parentRegionLevel(
  level: FjnRegionLevel,
): FjnRegionLevel | null {
  switch (level) {
    case REGION_LEVEL.DISTRICT:
      return REGION_LEVEL.CITY;
    case REGION_LEVEL.CITY:
      return REGION_LEVEL.PROVINCE;
    case REGION_LEVEL.PROVINCE:
      return REGION_LEVEL.COUNTRY;
    default:
      return null;
  }
}

/** 判断两个 level 是否合法父子关系 */
export function isValidParentLevel(
  parent: FjnRegionLevel,
  child: FjnRegionLevel,
): boolean {
  const expected = childRegionLevel(parent);
  return expected === child;
}

// ============================================================
// 7. 默认业务常量
// ============================================================

/** 默认 Region 限制有效期（天），0 表示永不过期 */
export const REGION_DEFAULT_EXPIRES_DAYS = 0;

/** 默认 IP 段单条最大覆盖数（防止单条覆盖全球） */
export const IP_GEO_DEFAULT_MAX_COVERAGE = 0;
