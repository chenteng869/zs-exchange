/**
 * FJN Region Service 冒烟测试
 *
 * 严格遵循 H015 + H018 工业级规范：
 *  - Region 状态机（3 个状态 + 流转表）
 *  - Restriction 状态机（3 个状态 + 流转表）
 *  - IP Geo 状态机（2 个状态 + 流转表）
 *  - 业务工具（isRegionUsable / isRestrictionActive / isValidCountryCode / isValidSubdivisionCode / isValidRegionCode）
 *  - 层级推断（childRegionLevel / parentRegionLevel / isValidParentLevel）
 *  - 通用枚举（REGION_LEVEL 4 / RESTRICTION_TYPE 5 / RESTRICTION_SOURCE 5 / IP_VERSION 2）
 *  - 10 个事件常量（Region 4 + Restriction 4 + IP Geo 2）
 *  - 错误码 + 异常类（40+ 错误码 / 30+ 异常类）
 *  - Service 类可实例化
 */

import { FjnError } from '../src/lib/fjn/errors';
import {
  // 状态机
  REGION_STATUS,
  ALL_REGION_STATUSES,
  TERMINAL_REGION_STATUSES,
  REGION_STATUS_TRANSITIONS,
  RESTRICTION_STATUS,
  ALL_RESTRICTION_STATUSES,
  RESTRICTION_STATUS_TRANSITIONS,
  IP_GEO_STATUS,
  ALL_IP_GEO_STATUSES,
  IP_GEO_STATUS_TRANSITIONS,
  // 通用枚举
  REGION_LEVEL,
  ALL_REGION_LEVELS,
  REGION_LEVEL_NUMBER,
  REGION_LEVEL_CHILD,
  RESTRICTION_TYPE,
  ALL_RESTRICTION_TYPES,
  RESTRICTION_SOURCE,
  ALL_RESTRICTION_SOURCES,
  IP_VERSION,
  ALL_IP_VERSIONS,
  // 工具
  isValidRegionStatus,
  isValidRestrictionStatus,
  isValidIpGeoStatus,
  isValidRegionLevel,
  isValidRestrictionType,
  isValidRestrictionSource,
  isValidIpVersion,
  isTerminalRegionStatus,
  canTransitRegionStatus,
  canTransitRestrictionStatus,
  canTransitIpGeoStatus,
  assertTransitRegionStatus,
  assertTransitRestrictionStatus,
  assertTransitIpGeoStatus,
  nextRegionStatuses,
  nextRestrictionStatuses,
  isRegionUsable,
  isRestrictionActive,
  isValidCountryCode as isValidRegionCountryCode,
  isValidRegionSubdivisionCode,
  isValidRegionCodeFormat,
  childRegionLevel,
  parentRegionLevel,
  isValidParentLevel,
  type FjnRegionStatus,
  type FjnRestrictionStatus,
  type FjnIpGeoStatus,
  type FjnRegionLevel,
  // 事件
  REGION_EVENTS,
  REGION_EVENT_SOURCES,
  ALL_REGION_EVENTS,
  ALL_REGION_EVENT_SOURCES,
  type FjnRegionEventName,
  type FjnRegionEventSource,
  // 错误
  REGION_ERROR_CODES,
  type FjnRegionErrorCode,
  FjnRegionError,
  FjnRegionNotFoundError,
  FjnRegionAlreadyExistsError,
  FjnRegionCodeInvalidError,
  FjnRegionNameRequiredError,
  FjnRegionLevelInvalidError,
  FjnRegionStatusInvalidError,
  FjnRegionCountryCodeInvalidError,
  FjnRegionSubdivisionCodeInvalidError,
  FjnRegionParentRequiredError,
  FjnRegionParentNotFoundError,
  FjnRegionParentLevelInvalidError,
  FjnRegionHasChildrenError,
  FjnRegionSystemProtectedError,
  FjnRegionCircularReferenceError,
  FjnRegionDisabledError,
  FjnRegionDeprecatedError,
  FjnRegionRestrictionNotFoundError,
  FjnRegionRestrictionAlreadyExistsError,
  FjnRegionRestrictionTypeInvalidError,
  FjnRegionRestrictionSourceInvalidError,
  FjnRegionRestrictionReasonRequiredError,
  FjnRegionRestrictionExpiresInvalidError,
  FjnRegionRestrictionAlreadyDisabledError,
  FjnRegionRestrictionAlreadyExpiredError,
  FjnIpGeoNotFoundError,
  FjnIpGeoAlreadyExistsError,
  FjnIpGeoInvalidIpv4Error,
  FjnIpGeoInvalidIpv6Error,
  FjnIpGeoRangeOverlapError,
  FjnIpGeoRangeInvalidError,
  FjnIpGeoVersionInvalidError,
  FjnIpGeoNotResolvedError,
  FjnRegionRestrictedError as FjnRegionServiceRestrictedError,
  FjnRegionAllowlistMissError,
  FjnRegionKycLevelInsufficientError,
  FjnRegionRiskHighError,
  // Service
  FjnRegionService,
  REGION_DEFAULT_EXPIRES_DAYS,
  createFjnRegionService,
  type CreateRegionInput,
  type UpdateRegionInput,
  type AddRestrictionInput,
  type RegisterIpGeoInput,
  type ResolveIpInput,
  type ListRegionInput,
} from '../src/lib/fjn';

let pass = 0;
let fail = 0;
function assert(name: string, cond: boolean, info?: unknown): void {
  if (cond) {
    console.log(`  ✅ ${name}`);
    pass++;
  } else {
    console.log(`  ❌ ${name}`, info ?? '');
    fail++;
  }
}

function expectThrow(name: string, fn: () => unknown, errType: unknown): void {
  try {
    fn();
    assert(name, false, 'expected throw but did not');
  } catch (e) {
    const ok = errType === undefined
      ? true
      : e instanceof (errType as new (...args: unknown[]) => Error);
    assert(name, ok, `actual=${(e as Error)?.constructor?.name ?? e}`);
  }
}

console.log('=== FJN Region Service 冒烟测试 ===\n');

// ============================================================
// [1] Region 状态常量
// ============================================================
console.log('[1] Region 状态常量');
assert('REGION_STATUS.ACTIVE = active', REGION_STATUS.ACTIVE === 'active');
assert('REGION_STATUS.DISABLED = disabled', REGION_STATUS.DISABLED === 'disabled');
assert('REGION_STATUS.DEPRECATED = deprecated', REGION_STATUS.DEPRECATED === 'deprecated');
assert('ALL_REGION_STATUSES 包含 3 个', ALL_REGION_STATUSES.length === 3, `actual=${ALL_REGION_STATUSES.length}`);
assert('TERMINAL_REGION_STATUSES 包含 deprecated', TERMINAL_REGION_STATUSES.includes(REGION_STATUS.DEPRECATED));
assert('isValidRegionStatus(active) = true', isValidRegionStatus('active'));
assert('isValidRegionStatus(unknown) = false', !isValidRegionStatus('unknown'));
assert('isTerminalRegionStatus(deprecated) = true', isTerminalRegionStatus(REGION_STATUS.DEPRECATED));
assert('isTerminalRegionStatus(active) = false', !isTerminalRegionStatus(REGION_STATUS.ACTIVE));
assert('isRegionUsable(active) = true', isRegionUsable(REGION_STATUS.ACTIVE));
assert('isRegionUsable(disabled) = false', !isRegionUsable(REGION_STATUS.DISABLED));

// ============================================================
// [2] Region 状态机流转表
// ============================================================
console.log('\n[2] Region 状态机流转表');
assert('active → disabled（合法）', canTransitRegionStatus(REGION_STATUS.ACTIVE, REGION_STATUS.DISABLED));
assert('active → deprecated（合法）', canTransitRegionStatus(REGION_STATUS.ACTIVE, REGION_STATUS.DEPRECATED));
assert('active → active（非法）', !canTransitRegionStatus(REGION_STATUS.ACTIVE, REGION_STATUS.ACTIVE));
assert('disabled → active（合法）', canTransitRegionStatus(REGION_STATUS.DISABLED, REGION_STATUS.ACTIVE));
assert('disabled → deprecated（合法）', canTransitRegionStatus(REGION_STATUS.DISABLED, REGION_STATUS.DEPRECATED));
assert('deprecated → active（非法）', !canTransitRegionStatus(REGION_STATUS.DEPRECATED, REGION_STATUS.ACTIVE));
assert('deprecated → disabled（非法）', !canTransitRegionStatus(REGION_STATUS.DEPRECATED, REGION_STATUS.DISABLED));
assert('deprecated → deprecated（非法）', !canTransitRegionStatus(REGION_STATUS.DEPRECATED, REGION_STATUS.DEPRECATED));
for (const s of ALL_REGION_STATUSES) {
  assert(`REGION_STATUS_TRANSITIONS[${s}] 已定义`, Array.isArray(REGION_STATUS_TRANSITIONS[s]));
}

// ============================================================
// [3] assertTransitRegionStatus 抛错
// ============================================================
console.log('\n[3] assertTransitRegionStatus 抛错');
expectThrow(
  'assertTransit(active, active) 抛 FjnError',
  () => assertTransitRegionStatus(REGION_STATUS.ACTIVE, REGION_STATUS.ACTIVE),
  FjnError,
);
assert('合法转移不抛错', (() => {
  try {
    assertTransitRegionStatus(REGION_STATUS.ACTIVE, REGION_STATUS.DISABLED);
    return true;
  } catch {
    return false;
  }
})());

// ============================================================
// [4] nextRegionStatuses
// ============================================================
console.log('\n[4] nextRegionStatuses');
assert('nextRegionStatuses(active).length = 2', nextRegionStatuses(REGION_STATUS.ACTIVE).length === 2);
assert('nextRegionStatuses(active) 含 disabled', nextRegionStatuses(REGION_STATUS.ACTIVE).includes(REGION_STATUS.DISABLED));
assert('nextRegionStatuses(disabled).length = 2', nextRegionStatuses(REGION_STATUS.DISABLED).length === 2);
assert('nextRegionStatuses(deprecated).length = 0', nextRegionStatuses(REGION_STATUS.DEPRECATED).length === 0);

// ============================================================
// [5] Restriction 状态机
// ============================================================
console.log('\n[5] Restriction 状态机');
assert('RESTRICTION_STATUS.ACTIVE = active', RESTRICTION_STATUS.ACTIVE === 'active');
assert('RESTRICTION_STATUS.DISABLED = disabled', RESTRICTION_STATUS.DISABLED === 'disabled');
assert('RESTRICTION_STATUS.EXPIRED = expired', RESTRICTION_STATUS.EXPIRED === 'expired');
assert('ALL_RESTRICTION_STATUSES 包含 3 个', ALL_RESTRICTION_STATUSES.length === 3);
assert('isValidRestrictionStatus(active) = true', isValidRestrictionStatus('active'));
assert('isValidRestrictionStatus(unknown) = false', !isValidRestrictionStatus('unknown'));
assert('active → disabled（合法）', canTransitRestrictionStatus(RESTRICTION_STATUS.ACTIVE, RESTRICTION_STATUS.DISABLED));
assert('active → expired（合法）', canTransitRestrictionStatus(RESTRICTION_STATUS.ACTIVE, RESTRICTION_STATUS.EXPIRED));
assert('disabled → active（合法）', canTransitRestrictionStatus(RESTRICTION_STATUS.DISABLED, RESTRICTION_STATUS.ACTIVE));
assert('disabled → expired（合法）', canTransitRestrictionStatus(RESTRICTION_STATUS.DISABLED, RESTRICTION_STATUS.EXPIRED));
assert('expired → active（合法）', canTransitRestrictionStatus(RESTRICTION_STATUS.EXPIRED, RESTRICTION_STATUS.ACTIVE));
assert('expired → disabled（非法）', !canTransitRestrictionStatus(RESTRICTION_STATUS.EXPIRED, RESTRICTION_STATUS.DISABLED));
for (const s of ALL_RESTRICTION_STATUSES) {
  assert(`RESTRICTION_STATUS_TRANSITIONS[${s}] 已定义`, Array.isArray(RESTRICTION_STATUS_TRANSITIONS[s]));
}

assert('isRestrictionActive(active, null) = true', isRestrictionActive(RESTRICTION_STATUS.ACTIVE, null));
assert('isRestrictionActive(active, future) = true', isRestrictionActive(RESTRICTION_STATUS.ACTIVE, new Date(Date.now() + 86400000)));
assert('isRestrictionActive(active, past) = false', !isRestrictionActive(RESTRICTION_STATUS.ACTIVE, new Date(Date.now() - 86400000)));
assert('isRestrictionActive(disabled, null) = false', !isRestrictionActive(RESTRICTION_STATUS.DISABLED, null));

// ============================================================
// [6] IP Geo 状态机
// ============================================================
console.log('\n[6] IP Geo 状态机');
assert('IP_GEO_STATUS.ACTIVE = active', IP_GEO_STATUS.ACTIVE === 'active');
assert('IP_GEO_STATUS.DISABLED = disabled', IP_GEO_STATUS.DISABLED === 'disabled');
assert('ALL_IP_GEO_STATUSES 包含 2 个', ALL_IP_GEO_STATUSES.length === 2);
assert('isValidIpGeoStatus(active) = true', isValidIpGeoStatus('active'));
assert('active → disabled（合法）', canTransitIpGeoStatus(IP_GEO_STATUS.ACTIVE, IP_GEO_STATUS.DISABLED));
assert('disabled → active（合法）', canTransitIpGeoStatus(IP_GEO_STATUS.DISABLED, IP_GEO_STATUS.ACTIVE));
assert('active → active（非法）', !canTransitIpGeoStatus(IP_GEO_STATUS.ACTIVE, IP_GEO_STATUS.ACTIVE));
for (const s of ALL_IP_GEO_STATUSES) {
  assert(`IP_GEO_STATUS_TRANSITIONS[${s}] 已定义`, Array.isArray(IP_GEO_STATUS_TRANSITIONS[s]));
}

// ============================================================
// [7] 通用枚举
// ============================================================
console.log('\n[7] 通用枚举');
assert('REGION_LEVEL.COUNTRY = country', REGION_LEVEL.COUNTRY === 'country');
assert('REGION_LEVEL.PROVINCE = province', REGION_LEVEL.PROVINCE === 'province');
assert('REGION_LEVEL.CITY = city', REGION_LEVEL.CITY === 'city');
assert('REGION_LEVEL.DISTRICT = district', REGION_LEVEL.DISTRICT === 'district');
assert('ALL_REGION_LEVELS 包含 4 个', ALL_REGION_LEVELS.length === 4);
assert('isValidRegionLevel(country) = true', isValidRegionLevel('country'));
assert('isValidRegionLevel(planet) = false', !isValidRegionLevel('planet'));
assert('REGION_LEVEL_NUMBER.country = 1', REGION_LEVEL_NUMBER[REGION_LEVEL.COUNTRY] === 1);
assert('REGION_LEVEL_NUMBER.province = 2', REGION_LEVEL_NUMBER[REGION_LEVEL.PROVINCE] === 2);
assert('REGION_LEVEL_NUMBER.city = 3', REGION_LEVEL_NUMBER[REGION_LEVEL.CITY] === 3);
assert('REGION_LEVEL_NUMBER.district = 4', REGION_LEVEL_NUMBER[REGION_LEVEL.DISTRICT] === 4);
assert('REGION_LEVEL_CHILD.country = province', REGION_LEVEL_CHILD[REGION_LEVEL.COUNTRY] === REGION_LEVEL.PROVINCE);
assert('REGION_LEVEL_CHILD.province = city', REGION_LEVEL_CHILD[REGION_LEVEL.PROVINCE] === REGION_LEVEL.CITY);
assert('REGION_LEVEL_CHILD.city = district', REGION_LEVEL_CHILD[REGION_LEVEL.CITY] === REGION_LEVEL.DISTRICT);
assert('REGION_LEVEL_CHILD.district = null', REGION_LEVEL_CHILD[REGION_LEVEL.DISTRICT] === null);

assert('RESTRICTION_TYPE.BLOCK_TRADE = block_trade', RESTRICTION_TYPE.BLOCK_TRADE === 'block_trade');
assert('RESTRICTION_TYPE.KYC_UPGRADE = kyc_upgrade', RESTRICTION_TYPE.KYC_UPGRADE === 'kyc_upgrade');
assert('RESTRICTION_TYPE.RISK_HIGH = risk_high', RESTRICTION_TYPE.RISK_HIGH === 'risk_high');
assert('RESTRICTION_TYPE.COMPLIANCE_REPORT = compliance_report', RESTRICTION_TYPE.COMPLIANCE_REPORT === 'compliance_report');
assert('RESTRICTION_TYPE.ALLOWLIST = allowlist', RESTRICTION_TYPE.ALLOWLIST === 'allowlist');
assert('ALL_RESTRICTION_TYPES 包含 5 个', ALL_RESTRICTION_TYPES.length === 5);
assert('isValidRestrictionType(block_trade) = true', isValidRestrictionType('block_trade'));
assert('isValidRestrictionType(unknown) = false', !isValidRestrictionType('unknown'));

assert('RESTRICTION_SOURCE.REGULATOR = regulator', RESTRICTION_SOURCE.REGULATOR === 'regulator');
assert('RESTRICTION_SOURCE.INTERNAL = internal', RESTRICTION_SOURCE.INTERNAL === 'internal');
assert('RESTRICTION_SOURCE.PARTNER = partner', RESTRICTION_SOURCE.PARTNER === 'partner');
assert('RESTRICTION_SOURCE.RISK_ENGINE = risk_engine', RESTRICTION_SOURCE.RISK_ENGINE === 'risk_engine');
assert('RESTRICTION_SOURCE.SANCTIONS = sanctions', RESTRICTION_SOURCE.SANCTIONS === 'sanctions');
assert('ALL_RESTRICTION_SOURCES 包含 5 个', ALL_RESTRICTION_SOURCES.length === 5);
assert('isValidRestrictionSource(regulator) = true', isValidRestrictionSource('regulator'));
assert('isValidRestrictionSource(unknown) = false', !isValidRestrictionSource('unknown'));

assert('IP_VERSION.IPV4 = ipv4', IP_VERSION.IPV4 === 'ipv4');
assert('IP_VERSION.IPV6 = ipv6', IP_VERSION.IPV6 === 'ipv6');
assert('ALL_IP_VERSIONS 包含 2 个', ALL_IP_VERSIONS.length === 2);
assert('isValidIpVersion(ipv4) = true', isValidIpVersion('ipv4'));
assert('isValidIpVersion(ipv9) = false', !isValidIpVersion('ipv9'));

// ============================================================
// [8] 层级推断工具
// ============================================================
console.log('\n[8] 层级推断工具');
assert('childRegionLevel(country) = province', childRegionLevel(REGION_LEVEL.COUNTRY) === REGION_LEVEL.PROVINCE);
assert('childRegionLevel(province) = city', childRegionLevel(REGION_LEVEL.PROVINCE) === REGION_LEVEL.CITY);
assert('childRegionLevel(city) = district', childRegionLevel(REGION_LEVEL.CITY) === REGION_LEVEL.DISTRICT);
assert('childRegionLevel(district) = null', childRegionLevel(REGION_LEVEL.DISTRICT) === null);
assert('parentRegionLevel(country) = null', parentRegionLevel(REGION_LEVEL.COUNTRY) === null);
assert('parentRegionLevel(province) = country', parentRegionLevel(REGION_LEVEL.PROVINCE) === REGION_LEVEL.COUNTRY);
assert('parentRegionLevel(city) = province', parentRegionLevel(REGION_LEVEL.CITY) === REGION_LEVEL.PROVINCE);
assert('parentRegionLevel(district) = city', parentRegionLevel(REGION_LEVEL.DISTRICT) === REGION_LEVEL.CITY);
assert('isValidParentLevel(country, province) = true', isValidParentLevel(REGION_LEVEL.COUNTRY, REGION_LEVEL.PROVINCE));
assert('isValidParentLevel(country, city) = false', !isValidParentLevel(REGION_LEVEL.COUNTRY, REGION_LEVEL.CITY));
assert('isValidParentLevel(country, country) = false', !isValidParentLevel(REGION_LEVEL.COUNTRY, REGION_LEVEL.COUNTRY));

// ============================================================
// [9] ISO 代码校验
// ============================================================
console.log('\n[9] ISO 代码校验');
assert('isValidRegionCountryCode(CN) = true', isValidRegionCountryCode('CN'));
assert('isValidRegionCountryCode(US) = true', isValidRegionCountryCode('US'));
assert('isValidRegionCountryCode(JP) = true', isValidRegionCountryCode('JP'));
assert('isValidRegionCountryCode(cn) = false（小写）', !isValidRegionCountryCode('cn'));
assert('isValidRegionCountryCode(USA) = false（3 字符）', !isValidRegionCountryCode('USA'));
assert('isValidRegionCountryCode("") = false', !isValidRegionCountryCode(''));
assert('isValidRegionCountryCode(C1) = false（含数字）', !isValidRegionCountryCode('C1'));

assert('isValidRegionSubdivisionCode(CN-35) = true', isValidRegionSubdivisionCode('CN-35'));
assert('isValidRegionSubdivisionCode(US-CA) = true', isValidRegionSubdivisionCode('US-CA'));
assert('isValidRegionSubdivisionCode(CN) = true（无子码）', isValidRegionSubdivisionCode('CN'));
assert('isValidRegionSubdivisionCode(cn-35) = false（小写）', !isValidRegionSubdivisionCode('cn-35'));
assert('isValidRegionSubdivisionCode(CN-ABCDE) = false（超 4 字符）', !isValidRegionSubdivisionCode('CN-ABCDE'));
assert('isValidRegionSubdivisionCode(CN_35) = false（下划线）', !isValidRegionSubdivisionCode('CN_35'));

assert('isValidRegionCodeFormat(cn) = true', isValidRegionCodeFormat('cn'));
assert('isValidRegionCodeFormat(cn_fj) = true', isValidRegionCodeFormat('cn_fj'));
assert('isValidRegionCodeFormat(CN) = false（大写）', !isValidRegionCodeFormat('CN'));
assert('isValidRegionCodeFormat(c) = false（1 字符）', !isValidRegionCodeFormat('c'));
assert('isValidRegionCodeFormat(1cn) = false（数字开头）', !isValidRegionCodeFormat('1cn'));

// ============================================================
// [10] 事件常量
// ============================================================
console.log('\n[10] 事件常量');
assert('REGION_EVENTS.REGION_CREATED = region.region.created.v1', REGION_EVENTS.REGION_CREATED === 'region.region.created.v1');
assert('REGION_EVENTS.REGION_UPDATED = region.region.updated.v1', REGION_EVENTS.REGION_UPDATED === 'region.region.updated.v1');
assert('REGION_EVENTS.REGION_DISABLED = region.region.disabled.v1', REGION_EVENTS.REGION_DISABLED === 'region.region.disabled.v1');
assert('REGION_EVENTS.REGION_DEPRECATED = region.region.deprecated.v1', REGION_EVENTS.REGION_DEPRECATED === 'region.region.deprecated.v1');
assert('REGION_EVENTS.RESTRICTION_ADDED = region.restriction.added.v1', REGION_EVENTS.RESTRICTION_ADDED === 'region.restriction.added.v1');
assert('REGION_EVENTS.RESTRICTION_REMOVED = region.restriction.removed.v1', REGION_EVENTS.RESTRICTION_REMOVED === 'region.restriction.removed.v1');
assert('REGION_EVENTS.RESTRICTION_EXPIRED = region.restriction.expired.v1', REGION_EVENTS.RESTRICTION_EXPIRED === 'region.restriction.expired.v1');
assert('REGION_EVENTS.RESTRICTION_MATCHED = region.restriction.matched.v1', REGION_EVENTS.RESTRICTION_MATCHED === 'region.restriction.matched.v1');
assert('REGION_EVENTS.IP_GEO_REGISTERED = region.ip_geo.registered.v1', REGION_EVENTS.IP_GEO_REGISTERED === 'region.ip_geo.registered.v1');
assert('REGION_EVENTS.IP_GEO_RESOLVED = region.ip_geo.resolved.v1', REGION_EVENTS.IP_GEO_RESOLVED === 'region.ip_geo.resolved.v1');
assert('ALL_REGION_EVENTS 包含 10 个', ALL_REGION_EVENTS.length === 10, `actual=${ALL_REGION_EVENTS.length}`);

assert('REGION_EVENT_SOURCES.USER = user', REGION_EVENT_SOURCES.USER === 'user');
assert('REGION_EVENT_SOURCES.ADMIN = admin', REGION_EVENT_SOURCES.ADMIN === 'admin');
assert('REGION_EVENT_SOURCES.SYSTEM = system', REGION_EVENT_SOURCES.SYSTEM === 'system');
assert('REGION_EVENT_SOURCES.SCHEDULER = scheduler', REGION_EVENT_SOURCES.SCHEDULER === 'scheduler');
assert('REGION_EVENT_SOURCES.RISK_ENGINE = risk_engine', REGION_EVENT_SOURCES.RISK_ENGINE === 'risk_engine');
assert('REGION_EVENT_SOURCES.IP_GEO_PROVIDER = ip_geo_provider', REGION_EVENT_SOURCES.IP_GEO_PROVIDER === 'ip_geo_provider');
assert('REGION_EVENT_SOURCES.COMPLIANCE_OFFICER = compliance_officer', REGION_EVENT_SOURCES.COMPLIANCE_OFFICER === 'compliance_officer');
assert('ALL_REGION_EVENT_SOURCES 包含 7 个', ALL_REGION_EVENT_SOURCES.length === 7);

// ============================================================
// [11] 错误码 + 异常类
// ============================================================
console.log('\n[11] 错误码 + 异常类');
assert('REGION_ERROR_CODES.REGION_NOT_FOUND = REGION_NOT_FOUND', REGION_ERROR_CODES.REGION_NOT_FOUND === 'REGION_NOT_FOUND');
assert('REGION_ERROR_CODES.REGION_ALREADY_EXISTS = REGION_ALREADY_EXISTS', REGION_ERROR_CODES.REGION_ALREADY_EXISTS === 'REGION_ALREADY_EXISTS');
assert('REGION_ERROR_CODES.REGION_CODE_INVALID = REGION_CODE_INVALID', REGION_ERROR_CODES.REGION_CODE_INVALID === 'REGION_CODE_INVALID');
assert('REGION_ERROR_CODES.REGION_NAME_REQUIRED = REGION_NAME_REQUIRED', REGION_ERROR_CODES.REGION_NAME_REQUIRED === 'REGION_NAME_REQUIRED');
assert('REGION_ERROR_CODES.REGION_LEVEL_INVALID = REGION_LEVEL_INVALID', REGION_ERROR_CODES.REGION_LEVEL_INVALID === 'REGION_LEVEL_INVALID');
assert('REGION_ERROR_CODES.REGION_STATUS_INVALID = REGION_STATUS_INVALID', REGION_ERROR_CODES.REGION_STATUS_INVALID === 'REGION_STATUS_INVALID');
assert('REGION_ERROR_CODES.REGION_COUNTRY_CODE_INVALID = REGION_COUNTRY_CODE_INVALID', REGION_ERROR_CODES.REGION_COUNTRY_CODE_INVALID === 'REGION_COUNTRY_CODE_INVALID');
assert('REGION_ERROR_CODES.REGION_SUBDIVISION_CODE_INVALID = REGION_SUBDIVISION_CODE_INVALID', REGION_ERROR_CODES.REGION_SUBDIVISION_CODE_INVALID === 'REGION_SUBDIVISION_CODE_INVALID');
assert('REGION_ERROR_CODES.REGION_PARENT_REQUIRED = REGION_PARENT_REQUIRED', REGION_ERROR_CODES.REGION_PARENT_REQUIRED === 'REGION_PARENT_REQUIRED');
assert('REGION_ERROR_CODES.REGION_PARENT_NOT_FOUND = REGION_PARENT_NOT_FOUND', REGION_ERROR_CODES.REGION_PARENT_NOT_FOUND === 'REGION_PARENT_NOT_FOUND');
assert('REGION_ERROR_CODES.REGION_PARENT_LEVEL_INVALID = REGION_PARENT_LEVEL_INVALID', REGION_ERROR_CODES.REGION_PARENT_LEVEL_INVALID === 'REGION_PARENT_LEVEL_INVALID');
assert('REGION_ERROR_CODES.REGION_HAS_CHILDREN = REGION_HAS_CHILDREN', REGION_ERROR_CODES.REGION_HAS_CHILDREN === 'REGION_HAS_CHILDREN');
assert('REGION_ERROR_CODES.REGION_SYSTEM_PROTECTED = REGION_SYSTEM_PROTECTED', REGION_ERROR_CODES.REGION_SYSTEM_PROTECTED === 'REGION_SYSTEM_PROTECTED');
assert('REGION_ERROR_CODES.REGION_CIRCULAR_REFERENCE = REGION_CIRCULAR_REFERENCE', REGION_ERROR_CODES.REGION_CIRCULAR_REFERENCE === 'REGION_CIRCULAR_REFERENCE');
assert('REGION_ERROR_CODES.REGION_DISABLED = REGION_DISABLED', REGION_ERROR_CODES.REGION_DISABLED === 'REGION_DISABLED');
assert('REGION_ERROR_CODES.REGION_DEPRECATED = REGION_DEPRECATED', REGION_ERROR_CODES.REGION_DEPRECATED === 'REGION_DEPRECATED');
assert('REGION_ERROR_CODES.RESTRICTION_NOT_FOUND = REGION_RESTRICTION_NOT_FOUND', REGION_ERROR_CODES.RESTRICTION_NOT_FOUND === 'REGION_RESTRICTION_NOT_FOUND');
assert('REGION_ERROR_CODES.RESTRICTION_ALREADY_EXISTS = REGION_RESTRICTION_ALREADY_EXISTS', REGION_ERROR_CODES.RESTRICTION_ALREADY_EXISTS === 'REGION_RESTRICTION_ALREADY_EXISTS');
assert('REGION_ERROR_CODES.RESTRICTION_TYPE_INVALID = REGION_RESTRICTION_TYPE_INVALID', REGION_ERROR_CODES.RESTRICTION_TYPE_INVALID === 'REGION_RESTRICTION_TYPE_INVALID');
assert('REGION_ERROR_CODES.RESTRICTION_SOURCE_INVALID = REGION_RESTRICTION_SOURCE_INVALID', REGION_ERROR_CODES.RESTRICTION_SOURCE_INVALID === 'REGION_RESTRICTION_SOURCE_INVALID');
assert('REGION_ERROR_CODES.RESTRICTION_REASON_REQUIRED = REGION_RESTRICTION_REASON_REQUIRED', REGION_ERROR_CODES.RESTRICTION_REASON_REQUIRED === 'REGION_RESTRICTION_REASON_REQUIRED');
assert('REGION_ERROR_CODES.RESTRICTION_EXPIRES_INVALID = REGION_RESTRICTION_EXPIRES_INVALID', REGION_ERROR_CODES.RESTRICTION_EXPIRES_INVALID === 'REGION_RESTRICTION_EXPIRES_INVALID');
assert('REGION_ERROR_CODES.IP_GEO_NOT_FOUND = REGION_IP_GEO_NOT_FOUND', REGION_ERROR_CODES.IP_GEO_NOT_FOUND === 'REGION_IP_GEO_NOT_FOUND');
assert('REGION_ERROR_CODES.IP_GEO_INVALID_IPV4 = REGION_IP_GEO_INVALID_IPV4', REGION_ERROR_CODES.IP_GEO_INVALID_IPV4 === 'REGION_IP_GEO_INVALID_IPV4');
assert('REGION_ERROR_CODES.IP_GEO_INVALID_IPV6 = REGION_IP_GEO_INVALID_IPV6', REGION_ERROR_CODES.IP_GEO_INVALID_IPV6 === 'REGION_IP_GEO_INVALID_IPV6');
assert('REGION_ERROR_CODES.IP_GEO_RANGE_OVERLAP = REGION_IP_GEO_RANGE_OVERLAP', REGION_ERROR_CODES.IP_GEO_RANGE_OVERLAP === 'REGION_IP_GEO_RANGE_OVERLAP');
assert('REGION_ERROR_CODES.IP_GEO_RANGE_INVALID = REGION_IP_GEO_RANGE_INVALID', REGION_ERROR_CODES.IP_GEO_RANGE_INVALID === 'REGION_IP_GEO_RANGE_INVALID');
assert('REGION_ERROR_CODES.IP_GEO_VERSION_INVALID = REGION_IP_GEO_VERSION_INVALID', REGION_ERROR_CODES.IP_GEO_VERSION_INVALID === 'REGION_IP_GEO_VERSION_INVALID');
assert('REGION_ERROR_CODES.IP_GEO_NOT_RESOLVED = REGION_IP_GEO_NOT_RESOLVED', REGION_ERROR_CODES.IP_GEO_NOT_RESOLVED === 'REGION_IP_GEO_NOT_RESOLVED');
assert('REGION_ERROR_CODES.REGION_RESTRICTED = REGION_RESTRICTED', REGION_ERROR_CODES.REGION_RESTRICTED === 'REGION_RESTRICTED');
assert('REGION_ERROR_CODES.REGION_ALLOWLIST_MISS = REGION_ALLOWLIST_MISS', REGION_ERROR_CODES.REGION_ALLOWLIST_MISS === 'REGION_ALLOWLIST_MISS');
assert('REGION_ERROR_CODES.REGION_KYC_LEVEL_INSUFFICIENT = REGION_KYC_LEVEL_INSUFFICIENT', REGION_ERROR_CODES.REGION_KYC_LEVEL_INSUFFICIENT === 'REGION_KYC_LEVEL_INSUFFICIENT');
assert('REGION_ERROR_CODES.REGION_RISK_HIGH = REGION_RISK_HIGH', REGION_ERROR_CODES.REGION_RISK_HIGH === 'REGION_RISK_HIGH');

// 异常类 HTTP 状态
assert('FjnRegionNotFoundError.httpStatus = 404', new FjnRegionNotFoundError({}).httpStatus === 404);
assert('FjnRegionAlreadyExistsError.httpStatus = 409', new FjnRegionAlreadyExistsError({}).httpStatus === 409);
assert('FjnRegionCodeInvalidError.httpStatus = 400', new FjnRegionCodeInvalidError({}).httpStatus === 400);
assert('FjnRegionHasChildrenError.httpStatus = 409', new FjnRegionHasChildrenError({}).httpStatus === 409);
assert('FjnRegionSystemProtectedError.httpStatus = 403', new FjnRegionSystemProtectedError({}).httpStatus === 403);
assert('FjnRegionDisabledError.httpStatus = 403', new FjnRegionDisabledError({}).httpStatus === 403);
assert('FjnRegionDeprecatedError.httpStatus = 403', new FjnRegionDeprecatedError({}).httpStatus === 403);
assert('FjnRegionServiceRestrictedError.httpStatus = 403', new FjnRegionServiceRestrictedError({}).httpStatus === 403);
assert('FjnRegionAllowlistMissError.httpStatus = 403', new FjnRegionAllowlistMissError({}).httpStatus === 403);
assert('FjnRegionKycLevelInsufficientError.httpStatus = 403', new FjnRegionKycLevelInsufficientError({}).httpStatus === 403);
assert('FjnRegionRiskHighError.httpStatus = 403', new FjnRegionRiskHighError({}).httpStatus === 403);
assert('FjnIpGeoInvalidIpv4Error.httpStatus = 400', new FjnIpGeoInvalidIpv4Error({}).httpStatus === 400);
assert('FjnIpGeoInvalidIpv6Error.httpStatus = 400', new FjnIpGeoInvalidIpv6Error({}).httpStatus === 400);
assert('FjnIpGeoNotResolvedError.httpStatus = 404', new FjnIpGeoNotResolvedError({}).httpStatus === 404);
assert('FjnIpGeoRangeOverlapError.httpStatus = 409', new FjnIpGeoRangeOverlapError({}).httpStatus === 409);
assert('FjnIpGeoRangeInvalidError.httpStatus = 400', new FjnIpGeoRangeInvalidError({}).httpStatus === 400);
assert('FjnIpGeoNotFoundError.httpStatus = 404', new FjnIpGeoNotFoundError({}).httpStatus === 404);
assert('FjnIpGeoAlreadyExistsError.httpStatus = 409', new FjnIpGeoAlreadyExistsError({}).httpStatus === 409);

// 异常类继承
const e: FjnRegionError = new FjnRegionNotFoundError({ test: 1 });
assert('FjnRegionNotFoundError 继承 FjnRegionError', e instanceof FjnRegionError);
assert('FjnRegionNotFoundError 继承 FjnError', e instanceof FjnError);

// ============================================================
// [12] Service 类可实例化
// ============================================================
console.log('\n[12] Service 类可实例化');
const svc = new FjnRegionService();
assert('FjnRegionService 可实例化', svc instanceof FjnRegionService);
assert('serviceName = FjnRegionService', svc['serviceName'] === 'FjnRegionService');
const svcFactory = createFjnRegionService();
assert('createFjnRegionService 返回实例', svcFactory instanceof FjnRegionService);
assert('默认过期天数为 0', REGION_DEFAULT_EXPIRES_DAYS === 0);

// 入参类型存在性
const _createInput: CreateRegionInput = {
  regionCode: 'cn',
  regionName: '中国',
  level: 'country',
  countryCode: 'CN',
};
const _updateInput: UpdateRegionInput = { regionName: '中华人民共和国' };
const _addInput: AddRestrictionInput = {
  restrictionType: 'block_trade',
  reason: '合规',
};
const _regIpInput: RegisterIpGeoInput = {
  ipRangeStart: '1.0.0.0',
  ipRangeEnd: '1.0.0.255',
  regionId: 'mock',
  countryCode: 'CN',
};
const _resolveInput: ResolveIpInput = { ipAddress: '1.2.3.4' };
const _listInput: ListRegionInput = { level: 'country' };
assert('CreateRegionInput 可构造', !!_createInput);
assert('UpdateRegionInput 可构造', !!_updateInput);
assert('AddRestrictionInput 可构造', !!_addInput);
assert('RegisterIpGeoInput 可构造', !!_regIpInput);
assert('ResolveIpInput 可构造', !!_resolveInput);
assert('ListRegionInput 可构造', !!_listInput);

// ============================================================
// [13] Service 方法存在性
// ============================================================
console.log('\n[13] Service 方法存在性');
const methodNames = [
  'createRegion', 'findRegionById', 'findRegionByCode', 'listRegions',
  'updateRegion', 'disableRegion', 'enableRegion', 'deprecateRegion',
  'addRestriction', 'disableRestriction', 'enableRestriction', 'expireRestriction',
  'listRestrictions', 'checkRestriction',
  'registerIpGeo', 'disableIpGeo', 'enableIpGeo', 'listIpGeos', 'resolveIp',
  'getCountryTree', 'getDescendants', 'getPathToRoot', 'getRegionSummary',
];
for (const m of methodNames) {
  assert(`FjnRegionService.${m} 存在`, typeof (svc as any)[m] === 'function');
}

// ============================================================
// [14] 业务默认值
// ============================================================
console.log('\n[14] 业务默认值');
assert('nextRestrictionStatuses(active).length = 2', nextRestrictionStatuses(RESTRICTION_STATUS.ACTIVE).length === 2);
assert('nextRestrictionStatuses(disabled).length = 2', nextRestrictionStatuses(RESTRICTION_STATUS.DISABLED).length === 2);
assert('nextRestrictionStatuses(expired).length = 1', nextRestrictionStatuses(RESTRICTION_STATUS.EXPIRED).length === 1);
assert('nextRestrictionStatuses(expired) 含 active', nextRestrictionStatuses(RESTRICTION_STATUS.EXPIRED).includes(RESTRICTION_STATUS.ACTIVE));

// ============================================================
// 总结
// ============================================================
console.log(`\n=== Region 冒烟测试完成：${pass} passed / ${fail} failed ===`);
if (fail > 0) {
  process.exit(1);
}
