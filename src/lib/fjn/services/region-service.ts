/**
 * FJN Region Service - 核心业务服务
 *
 * 严格遵循 H015 工业级职责规范：
 *  - Region 域：create / update / disable / enable / deprecate / find / list
 *  - Restriction 域：add / disable / expire / remove / list / matchCheck
 *  - IP Geo 域：register / disable / resolveIp / list
 *  - 工具：getCountryTree / getDescendants / getPathToRoot
 *
 * 状态机白名单（参考 region-state-machine）：
 *  - Region: active | disabled | deprecated
 *  - Restriction: active | disabled | expired
 *  - IpGeoRange: active | disabled
 *
 * 10 个 outbox 事件常量（Region 4 + Restriction 4 + IP Geo 2）
 *
 * 用法：
 *   const svc = new FjnRegionService();
 *   const cn = await svc.createRegion({ regionCode: 'cn', regionName: '中国', level: 'country', countryCode: 'CN' });
 *   const tree = await svc.getCountryTree('CN');
 *   const decision = await svc.checkRestriction('regionId', { kycLevel: 'standard' });
 *   const geo = await svc.resolveIpGeo('1.2.3.4');
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  REGION_STATUS,
  RESTRICTION_STATUS,
  IP_GEO_STATUS,
  REGION_LEVEL,
  REGION_LEVEL_NUMBER,
  REGION_LEVEL_CHILD,
  // region-state-machine 中的实际枚举名
  RESTRICTION_TYPE as REGION_RESTRICTION_TYPE,
  RESTRICTION_SOURCE as REGION_RESTRICTION_SOURCE,
  IP_VERSION as REGION_IP_VERSION,
  isValidRegionStatus,
  isValidRestrictionStatus,
  isValidIpGeoStatus,
  isValidRegionLevel,
  isValidRegionCode,
  isValidCountryCode,
  isValidSubdivisionCode,
  isValidParentLevel,
  isValidRestrictionType,
  isValidRestrictionSource,
  isValidIpVersion,
  canTransitRegionStatus,
  canTransitRestrictionStatus,
  canTransitIpGeoStatus,
  assertTransitRegionStatus,
  assertTransitRestrictionStatus,
  assertTransitIpGeoStatus,
  isRegionUsable,
  isRestrictionActive,
  parentRegionLevel,
  childRegionLevel,
  type FjnRegionStatus,
  type FjnRestrictionStatus,
  type FjnIpGeoStatus,
  type FjnRegionLevel,
  type FjnRestrictionType,
  type FjnRestrictionSource,
  type FjnIpVersion,
} from './region-state-machine';
import {
  REGION_EVENTS,
  REGION_EVENT_SOURCES,
  type RegionCreatedPayload,
  type RegionUpdatedPayload,
  type RegionDisabledPayload,
  type RegionDeprecatedPayload,
  type RestrictionAddedPayload,
  type RestrictionRemovedPayload,
  type RestrictionExpiredPayload,
  type RestrictionMatchedPayload,
  type IpGeoRegisteredPayload,
  type IpGeoResolvedPayload,
  type FjnRegionEventSource,
} from './region-events';
import {
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
  FjnRegionRestrictedError,
  FjnRegionAllowlistMissError,
  FjnRegionKycLevelInsufficientError,
  FjnRegionRiskHighError,
} from './region-errors';

// ============================================================
// 1. 公共常量
// ============================================================

/** 地区限制默认有效期（天），0 表示永不过期 */
export const REGION_DEFAULT_EXPIRES_DAYS = 0;

// ============================================================
// 2. 入参接口
// ============================================================

/** 入参：创建 Region */
export interface CreateRegionInput {
  regionCode: string;
  regionName: string;
  level: FjnRegionLevel;
  parentId?: string;
  countryCode: string;
  subdivisionCode?: string;
  locale?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  sort?: number;
  metadata?: Record<string, unknown>;
  operatorId?: string;
}

/** 入参：更新 Region */
export interface UpdateRegionInput {
  regionName?: string;
  subdivisionCode?: string;
  locale?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  sort?: number;
  metadata?: Record<string, unknown>;
  operatorId?: string;
}

/** 入参：切换 Region 状态 */
export interface ChangeRegionStatusInput {
  reason?: string;
  operatorId?: string;
}

/** 入参：列出 Region */
export interface ListRegionInput {
  level?: FjnRegionLevel;
  countryCode?: string;
  status?: FjnRegionStatus;
  parentId?: string | null;
  page?: number;
  pageSize?: number;
}

/** 入参：添加 Restriction */
export interface AddRestrictionInput {
  restrictionType: FjnRestrictionType;
  restrictionSource?: FjnRestrictionSource;
  reason?: string;
  refNo?: string;
  validFrom?: Date;
  expiresDays?: number;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  operatorId?: string;
}

/** 入参：切换 Restriction 状态 */
export interface ChangeRestrictionStatusInput {
  reason?: string;
  operatorId?: string;
}

/** 入参：列出 Restriction */
export interface ListRestrictionInput {
  regionId?: string;
  restrictionType?: FjnRestrictionType;
  status?: FjnRestrictionStatus;
  page?: number;
  pageSize?: number;
}

/** 入参：注册 IP Geo */
export interface RegisterIpGeoInput {
  ipVersion?: FjnIpVersion;
  ipRangeStart: string;
  ipRangeEnd: string;
  regionId: string;
  countryCode: string;
  provinceCode?: string;
  cityCode?: string;
  isp?: string;
  connectionType?: string;
  confidence?: number;
  source?: string;
  operatorId?: string;
}

/** 入参：列出 IP Geo */
export interface ListIpGeoInput {
  ipVersion?: FjnIpVersion;
  regionId?: string;
  countryCode?: string;
  status?: FjnIpGeoStatus;
  page?: number;
  pageSize?: number;
}

/** 入参：解析 IP */
export interface ResolveIpInput {
  ipAddress: string;
  operatorId?: string;
}

/** 入参：限制校验上下文 */
export interface CheckRestrictionContext {
  kycLevel?: string;
  userId?: string;
  action?: string;
}

/** 结果：限制校验 */
export interface RestrictionCheckResult {
  allowed: boolean;
  region_id: string;
  region_code: string;
  matched_restrictions: Array<{
    restriction_id: string;
    restriction_type: FjnRestrictionType;
    reason?: string;
  }>;
  evaluated_at: string;
}

/** 结果：IP 解析 */
export interface IpResolveResult {
  ip_address: string;
  ip_version: FjnIpVersion;
  region_id: string;
  region_code: string;
  country_code: string;
  province_code?: string;
  city_code?: string;
  isp?: string;
  ip_geo_id: string;
  latency_ms: number;
}

/** 结果：Region 树节点 */
export interface RegionTreeNode {
  region_id: string;
  region_code: string;
  region_name: string;
  level: FjnRegionLevel;
  country_code: string;
  status: FjnRegionStatus;
  children: RegionTreeNode[];
}

// ============================================================
// 3. Region Service 主体
// ============================================================

/**
 * FJN Region Service 主类
 *
 * 公开方法约 22 个，按业务域分组：
 *  - Region 域（7）：createRegion / findRegionById / findRegionByCode /
 *                  listRegions / updateRegion / disableRegion / enableRegion / deprecateRegion
 *  - Restriction 域（6）：addRestriction / disableRestriction / enableRestriction /
 *                       expireRestriction / listRestrictions / checkRestriction
 *  - IP Geo 域（4）：registerIpGeo / disableIpGeo / listIpGeos / resolveIp
 *  - Tree 工具（3）：getCountryTree / getDescendants / getPathToRoot
 *  - 工具（1）：getRegionSummary
 */
export class FjnRegionService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnRegionService' });
  }

  // ============================================================
  // 4.1 Region 域
  // ============================================================

  /** 创建 Region */
  async createRegion(input: CreateRegionInput): Promise<Record<string, unknown>> {
    if (!input.regionCode || !isValidRegionCode(input.regionCode)) {
      throw new FjnRegionCodeInvalidError({ value: input.regionCode });
    }
    if (!input.regionName) {
      throw new FjnRegionNameRequiredError({});
    }
    if (!input.level || !isValidRegionLevel(input.level)) {
      throw new FjnRegionLevelInvalidError({ value: input.level });
    }
    if (!input.countryCode || !isValidCountryCode(input.countryCode)) {
      throw new FjnRegionCountryCodeInvalidError({ value: input.countryCode });
    }
    if (input.subdivisionCode && !isValidSubdivisionCode(input.subdivisionCode)) {
      throw new FjnRegionSubdivisionCodeInvalidError({
        value: input.subdivisionCode,
      });
    }

    // 顶级 Region (country) 不需要 parent；其它层级必须 parent
    if (input.level === REGION_LEVEL.COUNTRY) {
      if (input.parentId) {
        // country 级别忽略 parentId
        input.parentId = undefined;
      }
    } else {
      if (!input.parentId) {
        throw new FjnRegionParentRequiredError({ level: input.level });
      }
    }

    return this.withTransaction(async (tx) => {
      const existing = await tx.fjnRegion.findUnique({
        where: { regionCode: input.regionCode },
      });
      if (existing) {
        throw new FjnRegionAlreadyExistsError({ regionCode: input.regionCode });
      }

      // 校验父级
      let parent: Record<string, unknown> | null = null;
      if (input.parentId) {
        parent = await tx.fjnRegion.findUnique({
          where: { id: input.parentId },
        });
        if (!parent) {
          throw new FjnRegionParentNotFoundError({ parentId: input.parentId });
        }
        if (!isValidParentLevel(parent.level as FjnRegionLevel, input.level)) {
          throw new FjnRegionParentLevelInvalidError({
            parentLevel: parent.level,
            childLevel: input.level,
          });
        }
        if (parent.status !== REGION_STATUS.ACTIVE) {
          throw new FjnRegionDisabledError({ parentId: input.parentId });
        }
      }

      const region = await tx.fjnRegion.create({
        data: {
          regionCode: input.regionCode,
          regionName: input.regionName,
          level: input.level,
          parentId: input.parentId ?? null,
          countryCode: input.countryCode,
          subdivisionCode: input.subdivisionCode ?? null,
          locale: input.locale ?? null,
          timezone: input.timezone ?? null,
          latitude: input.latitude !== undefined
            ? new Prisma.Decimal(input.latitude)
            : null,
          longitude: input.longitude !== undefined
            ? new Prisma.Decimal(input.longitude)
            : null,
          status: REGION_STATUS.ACTIVE,
          isSystem: false,
          sort: input.sort ?? 0,
          metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });

      const payload: RegionCreatedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId
          ? REGION_EVENT_SOURCES.ADMIN
          : REGION_EVENT_SOURCES.SYSTEM,
        region_id: region.id,
        region_code: region.regionCode,
        region_name: region.regionName,
        level: region.level as FjnRegionLevel,
        parent_id: region.parentId ?? undefined,
        country_code: region.countryCode,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, REGION_EVENTS.REGION_CREATED, payload);
      return this.formatRegion(region);
    });
  }

  /** 按 ID 查询 Region */
  async findRegionById(id: string): Promise<Record<string, unknown> | null> {
    const region = await this.prisma.fjnRegion.findUnique({ where: { id } });
    return region ? this.formatRegion(region) : null;
  }

  /** 按 code 查询 Region */
  async findRegionByCode(regionCode: string): Promise<Record<string, unknown> | null> {
    const region = await this.prisma.fjnRegion.findUnique({
      where: { regionCode },
    });
    return region ? this.formatRegion(region) : null;
  }

  /** 列出 Region */
  async listRegions(
    params: ListRegionInput,
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnRegionWhereInput = { deletedAt: null };
    if (params.level) where.level = params.level;
    if (params.countryCode) where.countryCode = params.countryCode;
    if (params.status) where.status = params.status;
    if (params.parentId === null) where.parentId = null;
    else if (params.parentId) where.parentId = params.parentId;

    const [items, total] = await Promise.all([
      this.prisma.fjnRegion.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnRegion.count({ where }),
    ]);
    return {
      items: items.map((r) => this.formatRegion(r)),
      total,
      page,
      pageSize,
    };
  }

  /** 更新 Region */
  async updateRegion(
    id: string,
    input: UpdateRegionInput,
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const region = await tx.fjnRegion.findUnique({ where: { id } });
      if (!region) throw new FjnRegionNotFoundError({ id });
      if (region.isSystem) {
        throw new FjnRegionSystemProtectedError({ id, regionCode: region.regionCode });
      }

      const changedFields: string[] = [];
      const data: Prisma.FjnRegionUpdateInput = {};
      if (input.regionName !== undefined && input.regionName !== region.regionName) {
        data.regionName = input.regionName;
        changedFields.push('regionName');
      }
      if (input.subdivisionCode !== undefined && input.subdivisionCode !== region.subdivisionCode) {
        if (!isValidSubdivisionCode(input.subdivisionCode)) {
          throw new FjnRegionSubdivisionCodeInvalidError({
            value: input.subdivisionCode,
          });
        }
        data.subdivisionCode = input.subdivisionCode;
        changedFields.push('subdivisionCode');
      }
      if (input.locale !== undefined && input.locale !== region.locale) {
        data.locale = input.locale;
        changedFields.push('locale');
      }
      if (input.timezone !== undefined && input.timezone !== region.timezone) {
        data.timezone = input.timezone;
        changedFields.push('timezone');
      }
      if (input.latitude !== undefined) {
        data.latitude = new Prisma.Decimal(input.latitude);
        changedFields.push('latitude');
      }
      if (input.longitude !== undefined) {
        data.longitude = new Prisma.Decimal(input.longitude);
        changedFields.push('longitude');
      }
      if (input.sort !== undefined && input.sort !== region.sort) {
        data.sort = input.sort;
        changedFields.push('sort');
      }
      if (input.metadata !== undefined) {
        data.metadata = input.metadata as Prisma.InputJsonValue;
        changedFields.push('metadata');
      }
      if (changedFields.length === 0) {
        return this.formatRegion(region);
      }

      const updated = await tx.fjnRegion.update({ where: { id }, data });

      const payload: RegionUpdatedPayload = {
        occurred_at: new Date().toISOString(),
        source: REGION_EVENT_SOURCES.ADMIN,
        region_id: updated.id,
        region_code: updated.regionCode,
        changed_fields: changedFields,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, REGION_EVENTS.REGION_UPDATED, payload);
      return this.formatRegion(updated);
    });
  }

  /** 停用 Region */
  async disableRegion(
    id: string,
    input: ChangeRegionStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.changeRegionStatus(id, REGION_STATUS.DISABLED, input);
  }

  /** 启用 Region */
  async enableRegion(
    id: string,
    input: ChangeRegionStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.changeRegionStatus(id, REGION_STATUS.ACTIVE, input);
  }

  /** 废弃 Region */
  async deprecateRegion(
    id: string,
    input: ChangeRegionStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const region = await tx.fjnRegion.findUnique({ where: { id } });
      if (!region) throw new FjnRegionNotFoundError({ id });
      if (region.isSystem) {
        throw new FjnRegionSystemProtectedError({ id, regionCode: region.regionCode });
      }
      // 检查子节点
      const childCount = await tx.fjnRegion.count({
        where: { parentId: id, deletedAt: null },
      });
      if (childCount > 0) {
        throw new FjnRegionHasChildrenError({ id, childCount });
      }
      assertTransitRegionStatus(
        region.status as FjnRegionStatus,
        REGION_STATUS.DEPRECATED,
      );
      const updated = await tx.fjnRegion.update({
        where: { id },
        data: { status: REGION_STATUS.DEPRECATED },
      });
      const payload: RegionDeprecatedPayload = {
        occurred_at: new Date().toISOString(),
        source: REGION_EVENT_SOURCES.ADMIN,
        region_id: updated.id,
        region_code: updated.regionCode,
        reason: input.reason,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, REGION_EVENTS.REGION_DEPRECATED, payload);
      return this.formatRegion(updated);
    });
  }

  /** 切换 Region 状态（disable/enable 内部使用） */
  private async changeRegionStatus(
    id: string,
    to: FjnRegionStatus,
    input: ChangeRegionStatusInput,
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const region = await tx.fjnRegion.findUnique({ where: { id } });
      if (!region) throw new FjnRegionNotFoundError({ id });
      if (region.isSystem) {
        throw new FjnRegionSystemProtectedError({ id, regionCode: region.regionCode });
      }
      assertTransitRegionStatus(
        region.status as FjnRegionStatus,
        to,
      );
      const updated = await tx.fjnRegion.update({
        where: { id },
        data: { status: to },
      });

      if (to === REGION_STATUS.DISABLED) {
        const payload: RegionDisabledPayload = {
          occurred_at: new Date().toISOString(),
          source: REGION_EVENT_SOURCES.ADMIN,
          region_id: updated.id,
          region_code: updated.regionCode,
          reason: input.reason,
          operator_id: input.operatorId,
        };
        await this.emitOutboxEvent(tx, REGION_EVENTS.REGION_DISABLED, payload);
      }
      return this.formatRegion(updated);
    });
  }

  // ============================================================
  // 4.2 Restriction 域
  // ============================================================

  /** 添加 Restriction */
  async addRestriction(
    regionId: string,
    input: AddRestrictionInput,
  ): Promise<Record<string, unknown>> {
    if (!input.restrictionType || !isValidRestrictionType(input.restrictionType)) {
      throw new FjnRegionRestrictionTypeInvalidError({
        value: input.restrictionType,
      });
    }
    const source = input.restrictionSource ?? REGION_RESTRICTION_SOURCE.INTERNAL;
    if (!isValidRestrictionSource(source)) {
      throw new FjnRegionRestrictionSourceInvalidError({ value: source });
    }
    // block_trade / risk_high 必须提供 reason
    if (
      (input.restrictionType === 'block_trade' ||
        input.restrictionType === 'risk_high') &&
      !input.reason
    ) {
      throw new FjnRegionRestrictionReasonRequiredError({
        restrictionType: input.restrictionType,
      });
    }
    // 计算 expiresAt
    let expiresAt: Date | null = null;
    if (input.expiresAt) {
      if (input.expiresAt.getTime() <= Date.now()) {
        throw new FjnRegionRestrictionExpiresInvalidError({
          value: input.expiresAt.toISOString(),
        });
      }
      expiresAt = input.expiresAt;
    } else if (input.expiresDays && input.expiresDays > 0) {
      expiresAt = new Date(Date.now() + input.expiresDays * 24 * 60 * 60 * 1000);
    }

    return this.withTransaction(async (tx) => {
      const region = await tx.fjnRegion.findUnique({ where: { id: regionId } });
      if (!region) throw new FjnRegionNotFoundError({ id: regionId });
      if (region.isSystem) {
        throw new FjnRegionSystemProtectedError({
          id: regionId,
          regionCode: region.regionCode,
        });
      }

      const existing = await tx.fjnRegionRestriction.findUnique({
        where: {
          regionId_restrictionType: {
            regionId,
            restrictionType: input.restrictionType,
          },
        },
      });
      if (existing) {
        throw new FjnRegionRestrictionAlreadyExistsError({
          regionId,
          restrictionType: input.restrictionType,
        });
      }

      const restriction = await tx.fjnRegionRestriction.create({
        data: {
          regionId,
          restrictionType: input.restrictionType,
          restrictionSource: source,
          reason: input.reason ?? null,
          refNo: input.refNo ?? null,
          status: RESTRICTION_STATUS.ACTIVE,
          validFrom: input.validFrom ?? null,
          expiresAt,
          metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          createdBy: input.operatorId ?? null,
        },
      });

      const payload: RestrictionAddedPayload = {
        occurred_at: new Date().toISOString(),
        source: source === 'regulator'
          ? REGION_EVENT_SOURCES.COMPLIANCE_OFFICER
          : REGION_EVENT_SOURCES.ADMIN,
        restriction_id: restriction.id,
        region_id: region.id,
        region_code: region.regionCode,
        restriction_type: input.restrictionType,
        restriction_source: source,
        reason: input.reason,
        expires_at: expiresAt?.toISOString(),
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(
        tx,
        REGION_EVENTS.RESTRICTION_ADDED,
        payload,
      );
      return this.formatRestriction(restriction);
    });
  }

  /** 停用 Restriction */
  async disableRestriction(
    restrictionId: string,
    input: ChangeRestrictionStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.changeRestrictionStatus(
      restrictionId,
      RESTRICTION_STATUS.DISABLED,
      input,
    );
  }

  /** 启用 Restriction */
  async enableRestriction(
    restrictionId: string,
    input: ChangeRestrictionStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.changeRestrictionStatus(
      restrictionId,
      RESTRICTION_STATUS.ACTIVE,
      input,
    );
  }

  /** 标记 Restriction 过期（调度器） */
  async expireRestriction(
    restrictionId: string,
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const r = await tx.fjnRegionRestriction.findUnique({
        where: { id: restrictionId },
      });
      if (!r) throw new FjnRegionRestrictionNotFoundError({ id: restrictionId });
      if (r.status === RESTRICTION_STATUS.EXPIRED) {
        throw new FjnRegionRestrictionAlreadyExpiredError({ id: restrictionId });
      }
      const updated = await tx.fjnRegionRestriction.update({
        where: { id: restrictionId },
        data: { status: RESTRICTION_STATUS.EXPIRED },
      });
      const region = await tx.fjnRegion.findUnique({ where: { id: r.regionId } });
      const payload: RestrictionExpiredPayload = {
        occurred_at: new Date().toISOString(),
        source: REGION_EVENT_SOURCES.SCHEDULER,
        restriction_id: updated.id,
        region_id: r.regionId,
        region_code: region?.regionCode ?? '',
        restriction_type: updated.restrictionType as FjnRestrictionType,
        expired_at: new Date().toISOString(),
      };
      await this.emitOutboxEvent(
        tx,
        REGION_EVENTS.RESTRICTION_EXPIRED,
        payload,
      );
      return this.formatRestriction(updated);
    });
  }

  /** 切换 Restriction 状态 */
  private async changeRestrictionStatus(
    restrictionId: string,
    to: FjnRestrictionStatus,
    input: ChangeRestrictionStatusInput,
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const r = await tx.fjnRegionRestriction.findUnique({
        where: { id: restrictionId },
      });
      if (!r) throw new FjnRegionRestrictionNotFoundError({ id: restrictionId });
      if (r.status === RESTRICTION_STATUS.EXPIRED && to === RESTRICTION_STATUS.ACTIVE) {
        throw new FjnRegionRestrictionAlreadyExpiredError({ id: restrictionId });
      }
      assertTransitRestrictionStatus(
        r.status as FjnRestrictionStatus,
        to,
      );
      const updated = await tx.fjnRegionRestriction.update({
        where: { id: restrictionId },
        data: { status: to },
      });
      if (to === RESTRICTION_STATUS.DISABLED) {
        const region = await tx.fjnRegion.findUnique({ where: { id: r.regionId } });
        const payload: RestrictionRemovedPayload = {
          occurred_at: new Date().toISOString(),
          source: REGION_EVENT_SOURCES.ADMIN,
          restriction_id: updated.id,
          region_id: r.regionId,
          region_code: region?.regionCode ?? '',
          reason: input.reason,
          operator_id: input.operatorId,
        };
        await this.emitOutboxEvent(
          tx,
          REGION_EVENTS.RESTRICTION_REMOVED,
          payload,
        );
      }
      return this.formatRestriction(updated);
    });
  }

  /** 列出 Restriction */
  async listRestrictions(
    params: ListRestrictionInput,
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnRegionRestrictionWhereInput = {};
    if (params.regionId) where.regionId = params.regionId;
    if (params.restrictionType) where.restrictionType = params.restrictionType;
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.fjnRegionRestriction.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnRegionRestriction.count({ where }),
    ]);
    return {
      items: items.map((r) => this.formatRestriction(r)),
      total,
      page,
      pageSize,
    };
  }

  /** 限制校验：返回是否放行 + 命中明细 */
  async checkRestriction(
    regionId: string,
    context: CheckRestrictionContext = {},
  ): Promise<RestrictionCheckResult> {
    const region = await this.prisma.fjnRegion.findUnique({ where: { id: regionId } });
    if (!region) throw new FjnRegionNotFoundError({ id: regionId });
    if (region.status === REGION_STATUS.DISABLED) {
      throw new FjnRegionDisabledError({ id: regionId });
    }
    if (region.status === REGION_STATUS.DEPRECATED) {
      throw new FjnRegionDeprecatedError({ id: regionId });
    }

    // 收集该 region 及所有父级链的 active 限制
    const regionChain = await this.getPathToRoot(regionId);
    const regionIds = regionChain.map((r) => r.region_id as string);
    const now = new Date();
    const restrictions = await this.prisma.fjnRegionRestriction.findMany({
      where: {
        regionId: { in: regionIds },
        status: RESTRICTION_STATUS.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });

    const matched: RestrictionCheckResult['matched_restrictions'] = [];
    let allowed = true;
    const kycLevelOrder = ['basic', 'standard', 'enhanced', 'institutional'];

    for (const r of restrictions) {
      const type = r.restrictionType as FjnRestrictionType;
      if (type === 'block_trade') {
        matched.push({
          restriction_id: r.id,
          restriction_type: type,
          reason: r.reason ?? undefined,
        });
        allowed = false;
      } else if (type === 'kyc_upgrade') {
        const required = r.reason ?? 'enhanced';
        if (context.kycLevel) {
          const have = kycLevelOrder.indexOf(context.kycLevel);
          const need = kycLevelOrder.indexOf(required);
          if (have < need) {
            matched.push({
              restriction_id: r.id,
              restriction_type: type,
              reason: `需要 KYC 等级 ${required}`,
            });
            allowed = false;
          }
        }
      } else if (type === 'risk_high') {
        matched.push({
          restriction_id: r.id,
          restriction_type: type,
          reason: r.reason ?? undefined,
        });
        allowed = false;
      } else if (type === 'allowlist') {
        matched.push({
          restriction_id: r.id,
          restriction_type: type,
        });
      } else {
        // compliance_report：仅记录，不阻断
        matched.push({
          restriction_id: r.id,
          restriction_type: type,
          reason: r.reason ?? undefined,
        });
      }
    }

    // 白名单覆盖：若存在 allowlist 类型且未命中，默认拒绝
    if (
      restrictions.some((r) => r.restrictionType === 'allowlist') &&
      !matched.some((m) => m.restriction_type === 'allowlist')
    ) {
      allowed = false;
    }

    return {
      allowed,
      region_id: region.id,
      region_code: region.regionCode,
      matched_restrictions: matched,
      evaluated_at: new Date().toISOString(),
    };
  }

  // ============================================================
  // 4.3 IP Geo 域
  // ============================================================

  /** 注册 IP 段 */
  async registerIpGeo(input: RegisterIpGeoInput): Promise<Record<string, unknown>> {
    const version = input.ipVersion ?? REGION_IP_VERSION.IPV4;
    if (!isValidIpVersion(version)) {
      throw new FjnIpGeoVersionInvalidError({ value: version });
    }
    const startNum = this.ipToNumber(input.ipRangeStart, version);
    const endNum = this.ipToNumber(input.ipRangeEnd, version);
    if (startNum === null || endNum === null) {
      if (version === 'ipv4') {
        throw new FjnIpGeoInvalidIpv4Error({
          start: input.ipRangeStart,
          end: input.ipRangeEnd,
        });
      }
      throw new FjnIpGeoInvalidIpv6Error({
        start: input.ipRangeStart,
        end: input.ipRangeEnd,
      });
    }
    if (startNum > endNum) {
      throw new FjnIpGeoRangeInvalidError({
        start: input.ipRangeStart,
        end: input.ipRangeEnd,
      });
    }

    return this.withTransaction(async (tx) => {
      const region = await tx.fjnRegion.findUnique({ where: { id: input.regionId } });
      if (!region) throw new FjnRegionNotFoundError({ id: input.regionId });

      // 简易重叠检测：与同版本、同 country 的段比较
      const overlaps = await tx.fjnIpGeoRange.findFirst({
        where: {
          ipVersion: version,
          status: IP_GEO_STATUS.ACTIVE,
          ipStartNum: { lte: endNum },
          ipEndNum: { gte: startNum },
        },
      });
      if (overlaps) {
        throw new FjnIpGeoRangeOverlapError({
          existingGeoId: overlaps.id,
        });
      }

      const geo = await tx.fjnIpGeoRange.create({
        data: {
          ipVersion: version,
          ipRangeStart: input.ipRangeStart,
          ipRangeEnd: input.ipRangeEnd,
          ipStartNum: BigInt(startNum),
          ipEndNum: BigInt(endNum),
          regionId: input.regionId,
          countryCode: input.countryCode,
          provinceCode: input.provinceCode ?? null,
          cityCode: input.cityCode ?? null,
          isp: input.isp ?? null,
          connectionType: input.connectionType ?? null,
          status: IP_GEO_STATUS.ACTIVE,
          source: input.source ?? 'internal',
          confidence: input.confidence ?? 100,
          metadata: Prisma.JsonNull,
        },
      });

      const payload: IpGeoRegisteredPayload = {
        occurred_at: new Date().toISOString(),
        source: REGION_EVENT_SOURCES.ADMIN,
        ip_geo_id: geo.id,
        ip_range_start: geo.ipRangeStart,
        ip_range_end: geo.ipRangeEnd,
        ip_version: geo.ipVersion as FjnIpVersion,
        region_id: geo.regionId,
        region_code: region.regionCode,
        country_code: geo.countryCode,
        isp: geo.isp ?? undefined,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, REGION_EVENTS.IP_GEO_REGISTERED, payload);
      return this.formatIpGeo(geo);
    });
  }

  /** 停用 IP 段 */
  async disableIpGeo(id: string): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const geo = await tx.fjnIpGeoRange.findUnique({ where: { id } });
      if (!geo) throw new FjnIpGeoNotFoundError({ id });
      assertTransitIpGeoStatus(geo.status as FjnIpGeoStatus, IP_GEO_STATUS.DISABLED);
      const updated = await tx.fjnIpGeoRange.update({
        where: { id },
        data: { status: IP_GEO_STATUS.DISABLED },
      });
      return this.formatIpGeo(updated);
    });
  }

  /** 启用 IP 段 */
  async enableIpGeo(id: string): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const geo = await tx.fjnIpGeoRange.findUnique({ where: { id } });
      if (!geo) throw new FjnIpGeoNotFoundError({ id });
      assertTransitIpGeoStatus(geo.status as FjnIpGeoStatus, IP_GEO_STATUS.ACTIVE);
      const updated = await tx.fjnIpGeoRange.update({
        where: { id },
        data: { status: IP_GEO_STATUS.ACTIVE },
      });
      return this.formatIpGeo(updated);
    });
  }

  /** 列出 IP 段 */
  async listIpGeos(
    params: ListIpGeoInput,
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnIpGeoRangeWhereInput = { deletedAt: null };
    if (params.ipVersion) where.ipVersion = params.ipVersion;
    if (params.regionId) where.regionId = params.regionId;
    if (params.countryCode) where.countryCode = params.countryCode;
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.fjnIpGeoRange.findMany({
        where,
        orderBy: [{ ipStartNum: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnIpGeoRange.count({ where }),
    ]);
    return {
      items: items.map((g) => this.formatIpGeo(g)),
      total,
      page,
      pageSize,
    };
  }

  /** 解析 IP → Region */
  async resolveIp(input: ResolveIpInput): Promise<IpResolveResult> {
    const start = Date.now();
    const version: FjnIpVersion = input.ipAddress.includes(':')
      ? REGION_IP_VERSION.IPV6
      : REGION_IP_VERSION.IPV4;
    const num = this.ipToNumber(input.ipAddress, version);
    if (num === null) {
      if (version === 'ipv4') {
        throw new FjnIpGeoInvalidIpv4Error({ ip: input.ipAddress });
      }
      throw new FjnIpGeoInvalidIpv6Error({ ip: input.ipAddress });
    }

    const geo = await this.prisma.fjnIpGeoRange.findFirst({
      where: {
        ipVersion: version,
        status: IP_GEO_STATUS.ACTIVE,
        ipStartNum: { lte: BigInt(num) },
        ipEndNum: { gte: BigInt(num) },
      },
    });
    if (!geo) {
      throw new FjnIpGeoNotResolvedError({ ip: input.ipAddress });
    }
    const region = await this.prisma.fjnRegion.findUnique({
      where: { id: geo.regionId },
    });

    const result: IpResolveResult = {
      ip_address: input.ipAddress,
      ip_version: version,
      region_id: geo.regionId,
      region_code: region?.regionCode ?? '',
      country_code: geo.countryCode,
      province_code: geo.provinceCode ?? undefined,
      city_code: geo.cityCode ?? undefined,
      isp: geo.isp ?? undefined,
      ip_geo_id: geo.id,
      latency_ms: Date.now() - start,
    };

    const payload: IpGeoResolvedPayload = {
      occurred_at: new Date().toISOString(),
      source: REGION_EVENT_SOURCES.IP_GEO_PROVIDER,
      ip_address: input.ipAddress,
      ip_version: version,
      region_id: geo.regionId,
      region_code: region?.regionCode ?? '',
      country_code: geo.countryCode,
      hit_geo_id: geo.id,
      latency_ms: result.latency_ms,
    };
    // 异步触发解析事件（不阻塞主流程）
    try {
      await this.emitOutboxEvent(
        this.prisma as any,
        REGION_EVENTS.IP_GEO_RESOLVED,
        payload,
      );
    } catch {
      this.log('warn', 'emitOutboxEvent(IP_GEO_RESOLVED) failed', {
        ip: input.ipAddress,
      });
    }

    return result;
  }

  // ============================================================
  // 4.4 Tree 工具
  // ============================================================

  /** 获取某国家的完整树（country → province → city → district） */
  async getCountryTree(countryCode: string): Promise<RegionTreeNode[]> {
    if (!isValidCountryCode(countryCode)) {
      throw new FjnRegionCountryCodeInvalidError({ value: countryCode });
    }
    const allRegions = await this.prisma.fjnRegion.findMany({
      where: { countryCode, deletedAt: null },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
    });
    return this.buildTree(allRegions, null);
  }

  /** 获取后代节点（直接 + 间接子节点） */
  async getDescendants(regionId: string): Promise<Record<string, unknown>[]> {
    const result: Record<string, unknown>[] = [];
    const queue: string[] = [regionId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = await this.prisma.fjnRegion.findMany({
        where: { parentId: current, deletedAt: null },
      });
      for (const c of children) {
        result.push(this.formatRegion(c));
        queue.push(c.id);
      }
    }
    return result;
  }

  /** 获取到根节点的链路（自身 → country） */
  async getPathToRoot(regionId: string): Promise<Record<string, unknown>[]> {
    const path: Record<string, unknown>[] = [];
    let currentId: string | null = regionId;
    const visited = new Set<string>();
    while (currentId) {
      if (visited.has(currentId)) {
        throw new FjnRegionCircularReferenceError({ regionId });
      }
      visited.add(currentId);
      const region: Record<string, unknown> | null =
        await this.prisma.fjnRegion.findUnique({ where: { id: currentId } });
      if (!region) break;
      path.push(this.formatRegion(region));
      currentId = (region.parent_id as string) ?? null;
    }
    return path;
  }

  // ============================================================
  // 4.5 工具
  // ============================================================

  /** Region 摘要（用于仪表盘） */
  async getRegionSummary(): Promise<Record<string, unknown>> {
    const [total, country, province, city, district, active, disabled, deprecated] =
      await Promise.all([
        this.prisma.fjnRegion.count({ where: { deletedAt: null } }),
        this.prisma.fjnRegion.count({
          where: { level: REGION_LEVEL.COUNTRY, deletedAt: null },
        }),
        this.prisma.fjnRegion.count({
          where: { level: REGION_LEVEL.PROVINCE, deletedAt: null },
        }),
        this.prisma.fjnRegion.count({
          where: { level: REGION_LEVEL.CITY, deletedAt: null },
        }),
        this.prisma.fjnRegion.count({
          where: { level: REGION_LEVEL.DISTRICT, deletedAt: null },
        }),
        this.prisma.fjnRegion.count({
          where: { status: REGION_STATUS.ACTIVE, deletedAt: null },
        }),
        this.prisma.fjnRegion.count({
          where: { status: REGION_STATUS.DISABLED, deletedAt: null },
        }),
        this.prisma.fjnRegion.count({
          where: { status: REGION_STATUS.DEPRECATED, deletedAt: null },
        }),
      ]);

    const [restrTotal, restrActive, restrDisabled, restrExpired] = await Promise.all([
      this.prisma.fjnRegionRestriction.count(),
      this.prisma.fjnRegionRestriction.count({
        where: { status: RESTRICTION_STATUS.ACTIVE },
      }),
      this.prisma.fjnRegionRestriction.count({
        where: { status: RESTRICTION_STATUS.DISABLED },
      }),
      this.prisma.fjnRegionRestriction.count({
        where: { status: RESTRICTION_STATUS.EXPIRED },
      }),
    ]);

    const [ipTotal, ipActive, ipDisabled] = await Promise.all([
      this.prisma.fjnIpGeoRange.count({ where: { deletedAt: null } }),
      this.prisma.fjnIpGeoRange.count({
        where: { status: IP_GEO_STATUS.ACTIVE, deletedAt: null },
      }),
      this.prisma.fjnIpGeoRange.count({
        where: { status: IP_GEO_STATUS.DISABLED, deletedAt: null },
      }),
    ]);

    return {
      regions: {
        total,
        country,
        province,
        city,
        district,
        status: { active: active, disabled: disabled, deprecated: deprecated },
      },
      restrictions: {
        total: restrTotal,
        active: restrActive,
        disabled: restrDisabled,
        expired: restrExpired,
      },
      ipGeos: { total: ipTotal, active: ipActive, disabled: ipDisabled },
    };
  }

  // ============================================================
  // 5. 私有工具
  // ============================================================

  /** 写 outbox 事件（事务内） */
  private async emitOutboxEvent(
    tx: any,
    eventType: string,
    payload: object,
  ): Promise<void> {
    try {
      await (tx as any).outboxEvent.create({
        data: {
          eventType,
          payload: payload as any,
          status: 'pending',
          retryCount: 0,
        },
      });
    } catch (e) {
      this.log('warn', `emitOutboxEvent failed (${eventType})`, {
        error: (e as Error).message,
      });
    }
  }

  /** 构建树（DFS） */
  private buildTree(
    regions: Array<Record<string, unknown>>,
    parentId: string | null,
  ): RegionTreeNode[] {
    return regions
      .filter((r) => (r.parentId ?? null) === parentId)
      .map((r) => ({
        region_id: r.id as string,
        region_code: r.regionCode as string,
        region_name: r.regionName as string,
        level: r.level as FjnRegionLevel,
        country_code: r.countryCode as string,
        status: r.status as FjnRegionStatus,
        children: this.buildTree(regions, r.id as string),
      }));
  }

  /** IP 文本 → 数值（IPv4 / IPv6 简化版） */
  private ipToNumber(ip: string, version: FjnIpVersion): number | null {
    if (version === REGION_IP_VERSION.IPV4) {
      const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
      if (!m) return null;
      const parts = m.slice(1, 5).map((p) => parseInt(p, 10));
      if (parts.some((p) => isNaN(p) || p < 0 || p > 255)) return null;
      return (
        ((parts[0] << 24) >>> 0) +
        (parts[1] << 16) +
        (parts[2] << 8) +
        parts[3]
      );
    }
    // IPv6 简化：取前 8 段 BigInt（最多 64 位时截断）
    const m = /^([0-9a-fA-F:]+)$/.exec(ip);
    if (!m) return null;
    const expanded = this.expandIpv6(ip);
    if (!expanded) return null;
    const segs = expanded.split(':').map((s) => parseInt(s, 16));
    if (segs.length !== 8 || segs.some((s) => isNaN(s) || s < 0 || s > 0xffff))
      return null;
    // 转 BigInt（无法在 number 中表示，返回 -1 表示不精确）
    return -1; // IPv6 走 BigInt 比较路径
  }

  /** 展开 IPv6（:: → 多组 0） */
  private expandIpv6(ip: string): string | null {
    const doubleColonIndex = ip.indexOf('::');
    if (doubleColonIndex === -1) {
      return ip.includes(':') && ip.split(':').length === 8 ? ip : null;
    }
    const [head, tail] = ip.split('::');
    const headSegs = head === '' ? [] : head.split(':');
    const tailSegs = tail === '' ? [] : tail.split(':');
    if (headSegs.length + tailSegs.length > 7) return null;
    const fillCount = 8 - headSegs.length - tailSegs.length;
    const fill = new Array(fillCount).fill('0');
    return [...headSegs, ...fill, ...tailSegs].join(':');
  }

  /** 格式化 Region */
  private formatRegion(r: any): Record<string, unknown> {
    return {
      region_id: r.id,
      region_code: r.regionCode,
      region_name: r.regionName,
      level: r.level,
      parent_id: r.parentId,
      country_code: r.countryCode,
      subdivision_code: r.subdivisionCode,
      locale: r.locale,
      timezone: r.timezone,
      latitude: r.latitude ? r.latitude.toString() : null,
      longitude: r.longitude ? r.longitude.toString() : null,
      status: r.status,
      is_system: r.isSystem,
      sort: r.sort,
      created_at: r.createdAt?.toISOString?.(),
      updated_at: r.updatedAt?.toISOString?.(),
    };
  }

  /** 格式化 Restriction */
  private formatRestriction(r: any): Record<string, unknown> {
    return {
      restriction_id: r.id,
      region_id: r.regionId,
      restriction_type: r.restrictionType,
      restriction_source: r.restrictionSource,
      reason: r.reason,
      ref_no: r.refNo,
      status: r.status,
      valid_from: r.validFrom?.toISOString?.() ?? null,
      expires_at: r.expiresAt?.toISOString?.() ?? null,
      created_by: r.createdBy,
      created_at: r.createdAt?.toISOString?.(),
    };
  }

  /** 格式化 IP Geo */
  private formatIpGeo(g: any): Record<string, unknown> {
    return {
      ip_geo_id: g.id,
      ip_version: g.ipVersion,
      ip_range_start: g.ipRangeStart,
      ip_range_end: g.ipRangeEnd,
      ip_start_num: g.ipStartNum?.toString?.(),
      ip_end_num: g.ipEndNum?.toString?.(),
      region_id: g.regionId,
      country_code: g.countryCode,
      province_code: g.provinceCode,
      city_code: g.cityCode,
      isp: g.isp,
      connection_type: g.connectionType,
      status: g.status,
      source: g.source,
      confidence: g.confidence,
      created_at: g.createdAt?.toISOString?.(),
    };
  }
}

// ============================================================
// 6. 工厂方法
// ============================================================

/** 默认单例工厂 */
export function createFjnRegionService(): FjnRegionService {
  return new FjnRegionService();
}
