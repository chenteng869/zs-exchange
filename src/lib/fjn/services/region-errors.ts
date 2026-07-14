/**
 * FJN Region Service - 错误码 + 异常类
 *
 * 严格遵循工业级分层（参考 H018 §4）：
 *  - 错误码使用 SCREAMING_SNAKE_CASE
 *  - 错误码映射到对应异常类与 HTTP 状态码
 *
 * 用法：
 *   import { FjnRegionNotFoundError, REGION_ERROR_CODES } from './region-errors';
 *   throw new FjnRegionNotFoundError({ regionId });
 */

import { FjnError, FjnErrorContext } from '../errors';

// ============================================================
// 1. 错误码常量
// ============================================================

export const REGION_ERROR_CODES = {
  // ---------- Region 通用 ----------
  REGION_NOT_FOUND: 'REGION_NOT_FOUND',
  REGION_ALREADY_EXISTS: 'REGION_ALREADY_EXISTS',
  REGION_CODE_INVALID: 'REGION_CODE_INVALID',
  REGION_NAME_REQUIRED: 'REGION_NAME_REQUIRED',
  REGION_LEVEL_INVALID: 'REGION_LEVEL_INVALID',
  REGION_STATUS_INVALID: 'REGION_STATUS_INVALID',
  REGION_COUNTRY_CODE_INVALID: 'REGION_COUNTRY_CODE_INVALID',
  REGION_SUBDIVISION_CODE_INVALID: 'REGION_SUBDIVISION_CODE_INVALID',
  REGION_PARENT_REQUIRED: 'REGION_PARENT_REQUIRED',
  REGION_PARENT_NOT_FOUND: 'REGION_PARENT_NOT_FOUND',
  REGION_PARENT_LEVEL_INVALID: 'REGION_PARENT_LEVEL_INVALID',
  REGION_HAS_CHILDREN: 'REGION_HAS_CHILDREN',
  REGION_SYSTEM_PROTECTED: 'REGION_SYSTEM_PROTECTED',
  REGION_CIRCULAR_REFERENCE: 'REGION_CIRCULAR_REFERENCE',
  REGION_DISABLED: 'REGION_DISABLED',
  REGION_DEPRECATED: 'REGION_DEPRECATED',

  // ---------- Restriction 关联 ----------
  RESTRICTION_NOT_FOUND: 'REGION_RESTRICTION_NOT_FOUND',
  RESTRICTION_ALREADY_EXISTS: 'REGION_RESTRICTION_ALREADY_EXISTS',
  RESTRICTION_TYPE_INVALID: 'REGION_RESTRICTION_TYPE_INVALID',
  RESTRICTION_SOURCE_INVALID: 'REGION_RESTRICTION_SOURCE_INVALID',
  RESTRICTION_REASON_REQUIRED: 'REGION_RESTRICTION_REASON_REQUIRED',
  RESTRICTION_EXPIRES_INVALID: 'REGION_RESTRICTION_EXPIRES_INVALID',
  RESTRICTION_ALREADY_DISABLED: 'REGION_RESTRICTION_ALREADY_DISABLED',
  RESTRICTION_ALREADY_EXPIRED: 'REGION_RESTRICTION_ALREADY_EXPIRED',

  // ---------- IP Geo ----------
  IP_GEO_NOT_FOUND: 'REGION_IP_GEO_NOT_FOUND',
  IP_GEO_ALREADY_EXISTS: 'REGION_IP_GEO_ALREADY_EXISTS',
  IP_GEO_INVALID_IPV4: 'REGION_IP_GEO_INVALID_IPV4',
  IP_GEO_INVALID_IPV6: 'REGION_IP_GEO_INVALID_IPV6',
  IP_GEO_RANGE_OVERLAP: 'REGION_IP_GEO_RANGE_OVERLAP',
  IP_GEO_RANGE_INVALID: 'REGION_IP_GEO_RANGE_INVALID',
  IP_GEO_VERSION_INVALID: 'REGION_IP_GEO_VERSION_INVALID',
  IP_GEO_NOT_RESOLVED: 'REGION_IP_GEO_NOT_RESOLVED',

  // ---------- 业务校验 ----------
  REGION_RESTRICTED: 'REGION_RESTRICTED',
  REGION_ALLOWLIST_MISS: 'REGION_ALLOWLIST_MISS',
  REGION_KYC_LEVEL_INSUFFICIENT: 'REGION_KYC_LEVEL_INSUFFICIENT',
  REGION_RISK_HIGH: 'REGION_RISK_HIGH',

  // ---------- 系统类 ----------
  INTERNAL: 'REGION_INTERNAL',
} as const;

export type FjnRegionErrorCode =
  (typeof REGION_ERROR_CODES)[keyof typeof REGION_ERROR_CODES];

// ============================================================
// 2. 异常类
// ============================================================

/** Region 异常基类 */
export class FjnRegionError extends FjnError {
  constructor(
    code: FjnRegionErrorCode,
    message: string,
    context?: FjnErrorContext,
    httpStatus?: number,
  ) {
    super({
      code: code as any,
      message,
      context,
      httpStatus,
    });
    this.name = 'FjnRegionError';
  }
}

// ---------- Region 通用异常 ----------

export class FjnRegionNotFoundError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_NOT_FOUND,
      'Region 不存在',
      context,
      404,
    );
  }
}

export class FjnRegionAlreadyExistsError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_ALREADY_EXISTS,
      'Region 代码已存在',
      context,
      409,
    );
  }
}

export class FjnRegionCodeInvalidError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_CODE_INVALID,
      'Region 代码格式非法（^[a-z][a-z0-9_]{1,63}$）',
      context,
      400,
    );
  }
}

export class FjnRegionNameRequiredError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_NAME_REQUIRED,
      'Region 名称必填',
      context,
      400,
    );
  }
}

export class FjnRegionLevelInvalidError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_LEVEL_INVALID,
      'Region 层级非法',
      context,
      400,
    );
  }
}

export class FjnRegionStatusInvalidError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_STATUS_INVALID,
      'Region 状态非法',
      context,
      400,
    );
  }
}

export class FjnRegionCountryCodeInvalidError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_COUNTRY_CODE_INVALID,
      'ISO 3166-1 alpha-2 国家代码非法（必须 2 个大写字母）',
      context,
      400,
    );
  }
}

export class FjnRegionSubdivisionCodeInvalidError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_SUBDIVISION_CODE_INVALID,
      'ISO 3166-2 子区代码非法（格式：CN-35 / US-CA）',
      context,
      400,
    );
  }
}

export class FjnRegionParentRequiredError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_PARENT_REQUIRED,
      '非顶级 Region 必须指定 parentId',
      context,
      400,
    );
  }
}

export class FjnRegionParentNotFoundError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_PARENT_NOT_FOUND,
      '父级 Region 不存在',
      context,
      404,
    );
  }
}

export class FjnRegionParentLevelInvalidError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_PARENT_LEVEL_INVALID,
      '父级 Region 层级非法（必须是当前层级的上一级）',
      context,
      400,
    );
  }
}

export class FjnRegionHasChildrenError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_HAS_CHILDREN,
      'Region 仍有子节点，不可删除/废弃',
      context,
      409,
    );
  }
}

export class FjnRegionSystemProtectedError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_SYSTEM_PROTECTED,
      '系统内置 Region 不可修改/删除',
      context,
      403,
    );
  }
}

export class FjnRegionCircularReferenceError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_CIRCULAR_REFERENCE,
      'Region parent 引用形成环',
      context,
      400,
    );
  }
}

export class FjnRegionDisabledError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_DISABLED,
      'Region 已停用',
      context,
      403,
    );
  }
}

export class FjnRegionDeprecatedError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_DEPRECATED,
      'Region 已废弃',
      context,
      403,
    );
  }
}

// ---------- Restriction 异常 ----------

export class FjnRegionRestrictionNotFoundError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.RESTRICTION_NOT_FOUND,
      'Region Restriction 不存在',
      context,
      404,
    );
  }
}

export class FjnRegionRestrictionAlreadyExistsError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.RESTRICTION_ALREADY_EXISTS,
      'Region 已存在同类型 Restriction',
      context,
      409,
    );
  }
}

export class FjnRegionRestrictionTypeInvalidError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.RESTRICTION_TYPE_INVALID,
      'Restriction 类型非法',
      context,
      400,
    );
  }
}

export class FjnRegionRestrictionSourceInvalidError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.RESTRICTION_SOURCE_INVALID,
      'Restriction 来源非法',
      context,
      400,
    );
  }
}

export class FjnRegionRestrictionReasonRequiredError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.RESTRICTION_REASON_REQUIRED,
      'BLOCK/RISK 类型 Restriction 必须提供 reason',
      context,
      400,
    );
  }
}

export class FjnRegionRestrictionExpiresInvalidError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.RESTRICTION_EXPIRES_INVALID,
      'Restriction 过期时间非法（必须晚于当前时刻）',
      context,
      400,
    );
  }
}

export class FjnRegionRestrictionAlreadyDisabledError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.RESTRICTION_ALREADY_DISABLED,
      'Restriction 已停用',
      context,
      409,
    );
  }
}

export class FjnRegionRestrictionAlreadyExpiredError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.RESTRICTION_ALREADY_EXPIRED,
      'Restriction 已过期',
      context,
      409,
    );
  }
}

// ---------- IP Geo 异常 ----------

export class FjnIpGeoNotFoundError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.IP_GEO_NOT_FOUND,
      'IP Geo 段不存在',
      context,
      404,
    );
  }
}

export class FjnIpGeoAlreadyExistsError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.IP_GEO_ALREADY_EXISTS,
      'IP Geo 段已存在',
      context,
      409,
    );
  }
}

export class FjnIpGeoInvalidIpv4Error extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.IP_GEO_INVALID_IPV4,
      'IPv4 地址格式非法',
      context,
      400,
    );
  }
}

export class FjnIpGeoInvalidIpv6Error extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.IP_GEO_INVALID_IPV6,
      'IPv6 地址格式非法',
      context,
      400,
    );
  }
}

export class FjnIpGeoRangeOverlapError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.IP_GEO_RANGE_OVERLAP,
      'IP 段与已有段重叠',
      context,
      409,
    );
  }
}

export class FjnIpGeoRangeInvalidError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.IP_GEO_RANGE_INVALID,
      'IP 段格式非法（start <= end）',
      context,
      400,
    );
  }
}

export class FjnIpGeoVersionInvalidError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.IP_GEO_VERSION_INVALID,
      'IP 版本非法（ipv4/ipv6）',
      context,
      400,
    );
  }
}

export class FjnIpGeoNotResolvedError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.IP_GEO_NOT_RESOLVED,
      'IP 未命中任何 Geo 段',
      context,
      404,
    );
  }
}

// ---------- 业务校验异常 ----------

export class FjnRegionRestrictedError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_RESTRICTED,
      '当前地区受限，业务不可用',
      context,
      403,
    );
  }
}

export class FjnRegionAllowlistMissError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_ALLOWLIST_MISS,
      '当前地区不在白名单内',
      context,
      403,
    );
  }
}

export class FjnRegionKycLevelInsufficientError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_KYC_LEVEL_INSUFFICIENT,
      '当前地区要求更高 KYC 等级',
      context,
      403,
    );
  }
}

export class FjnRegionRiskHighError extends FjnRegionError {
  constructor(context?: FjnErrorContext) {
    super(
      REGION_ERROR_CODES.REGION_RISK_HIGH,
      '当前地区触发高风险限制',
      context,
      403,
    );
  }
}
