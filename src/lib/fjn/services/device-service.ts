/**
 * FJN Device Service - 核心业务服务
 *
 * 严格遵循 H015 工业级职责规范：
 *  - Fingerprint 域：create / findByHash / findById / findOrCreate / updateStats
 *  - UserDevice 域：bind / find / list / heartbeat / unbind / trust / untrust / block / unblock / revoke
 *  - Blacklist 域：add / remove / list / findByFingerprint / checkBlacklist
 *  - RiskAssessment 域：assess / list / dismiss / action
 *  - Challenge 域：issue / verify / fail / cancel / expire / list
 *
 * 状态机白名单（参考 device-state-machine）：
 *  - UserDevice: pending | active | trusted | blocked | revoked
 *  - Blacklist:  active | disabled | expired
 *  - RiskAssessment: scored | dismissed | actioned
 *  - Challenge: pending | verified | failed | expired | cancelled
 *
 * 11 个 outbox 事件常量（UserDevice 5 + Blacklist 2 + Risk 1 + Challenge 3）
 *
 * 用法：
 *   const svc = new FjnDeviceService();
 *   const fp = await svc.findOrCreateFingerprint({ fingerprint, userAgent, ... });
 *   const bind = await svc.bindDevice({
 *     userId, fingerprintId, deviceType, ipAddress, countryCode,
 *   });
 *   if (bind.requires_challenge) {
 *     const ch = await svc.issueChallenge({
 *       userDeviceId: bind.user_device_id,
 *       userId, challengeType: 'otp_email', trigger: 'new_device', target: 'u***@x.com',
 *     });
 *   }
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import { FjnStateMachineError } from '../errors';
import {
  assertTransitBlacklistStatus as assertTransitBlacklistStatus_,
} from './device-state-machine';
import {
  USER_DEVICE_STATUS,
  BLACKLIST_STATUS,
  RISK_ASSESSMENT_STATUS,
  CHALLENGE_STATUS,
  DEVICE_TYPE,
  CHALLENGE_TYPE,
  CHALLENGE_TRIGGER,
  BLACKLIST_REASON,
  BLACKLIST_SOURCE,
  TRUST_ACTION,
  RISK_FACTOR,
  ALL_TRUST_ACTIONS,
  isValidUserDeviceStatus,
  isValidBlacklistStatus,
  isValidRiskAssessmentStatus,
  isValidChallengeStatus,
  isValidDeviceType,
  isValidChallengeType,
  isValidChallengeTrigger,
  isValidBlacklistReason,
  isValidBlacklistSource,
  isValidRiskFactor,
  isValidTrustAction,
  isUserDeviceUsable,
  isBlacklistActive,
  isChallengePending,
  isTerminalUserDeviceStatus,
  isTerminalChallengeStatus,
  canTransitUserDeviceStatus,
  canTransitBlacklistStatus,
  canTransitRiskAssessmentStatus,
  canTransitChallengeStatus,
  assertTransitUserDeviceStatus,
  assertTransitChallengeStatus,
  nextUserDeviceStatuses,
  nextChallengeStatuses,
  isValidFingerprint,
  isValidDeviceName,
  isValidRiskScore,
  calcDeviceRiskLevel,
  riskFactorScore,
  DEVICE_CHALLENGE_DEFAULT_EXPIRES_MINUTES,
  DEVICE_CHALLENGE_DEFAULT_MAX_ATTEMPTS,
  DEVICE_USER_MAX_DEVICES,
  DEVICE_TRUST_AUTO_THRESHOLD,
  DEVICE_CHALLENGE_AUTO_THRESHOLD,
  DEVICE_BLOCK_AUTO_THRESHOLD,
  DEVICE_BLACKLIST_DEFAULT_EXPIRES_DAYS,
  type FjnUserDeviceStatus,
  type FjnBlacklistStatus,
  type FjnRiskAssessmentStatus,
  type FjnChallengeStatus,
  type FjnDeviceType,
  type FjnChallengeType,
  type FjnChallengeTrigger,
  type FjnBlacklistReason,
  type FjnBlacklistSource,
  type FjnTrustAction,
  type FjnRiskFactor,
  type FjnDeviceRiskLevel,
} from './device-state-machine';
import {
  DEVICE_EVENTS,
  DEVICE_EVENT_SOURCES,
  type DeviceBoundPayload,
  type DeviceTrustedPayload,
  type DeviceBlockedPayload,
  type DeviceRevokedPayload,
  type DeviceHeartbeatPayload,
  type DeviceBlacklistedPayload,
  type DeviceUnblacklistedPayload,
  type DeviceRiskScoredPayload,
  type ChallengeIssuedPayload,
  type ChallengeVerifiedPayload,
  type ChallengeFailedPayload,
  type FjnDeviceEventSource,
} from './device-events';
import {
  FjnUserDeviceNotFoundError,
  FjnUserDeviceAlreadyBoundError,
  FjnUserDeviceLimitExceededError,
  FjnUserDeviceStatusInvalidError,
  FjnUserDeviceRevokedError,
  FjnUserDeviceBlockedError,
  FjnUserDeviceNameInvalidError,
  FjnTrustAlreadyAppliedError,
  FjnTrustRevokeNotAllowedError,
  FjnDeviceBlacklistNotFoundError,
  FjnDeviceBlacklistAlreadyExistsError,
  FjnDeviceBlacklistMatchedError,
  FjnDeviceBlacklistReasonInvalidError,
  FjnDeviceBlacklistSourceInvalidError,
  FjnDeviceBlacklistRefNoRequiredError,
  FjnDeviceBlacklistExpiresInvalidError,
  FjnDeviceBlacklistAlreadyDisabledError,
  FjnDeviceRiskAssessmentNotFoundError,
  FjnDeviceRiskAssessmentAlreadyActionedError,
  FjnDeviceRiskScoreInvalidError,
  FjnDeviceRiskFactorInvalidError,
  FjnDeviceChallengeNotFoundError,
  FjnDeviceChallengeAlreadyVerifiedError,
  FjnDeviceChallengeAlreadyFailedError,
  FjnDeviceChallengeExpiredError,
  FjnDeviceChallengeCancelledError,
  FjnDeviceChallengeCodeMismatchError,
  FjnDeviceChallengeMaxAttemptsExceededError,
  FjnDeviceChallengeTypeInvalidError,
  FjnDeviceChallengeTriggerInvalidError,
  FjnDeviceChallengeTargetRequiredError,
  FjnDeviceChallengeNotPendingError,
  FjnDeviceFingerprintNotFoundError,
  FjnDeviceFingerprintInvalidError,
  FjnDeviceFingerprintAlreadyExistsError,
} from './device-errors';

// ============================================================
// 1. 公共常量
// ============================================================

/** 用户设备最大绑定数（业务默认，可被入参覆盖） */
export const DEVICE_DEFAULT_USER_MAX_DEVICES = DEVICE_USER_MAX_DEVICES;

// ============================================================
// 2. 入参接口
// ============================================================

/** 入参：创建/更新 Fingerprint */
export interface UpsertFingerprintInput {
  fingerprint: string;
  userAgent?: string;
  deviceType?: FjnDeviceType;
  osVersion?: string;
  browserVersion?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  ipAddress?: string;
  countryCode?: string;
  userId?: string;
  operatorId?: string;
}

/** 入参：绑定设备 */
export interface BindDeviceInput {
  userId: string;
  fingerprintId?: string;
  fingerprint?: string;
  deviceName?: string;
  deviceType?: FjnDeviceType;
  ipAddress?: string;
  countryCode?: string;
  isPrimary?: boolean;
  metadata?: Record<string, unknown>;
  operatorId?: string;
  /** 是否跳过 challenge 校验（管理员强制） */
  skipChallenge?: boolean;
}

/** 入参：心跳 */
export interface DeviceHeartbeatInput {
  userDeviceId: string;
  ipAddress?: string;
  countryCode?: string;
  cityCode?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/** 入参：列设备 */
export interface ListUserDeviceInput {
  userId?: string;
  status?: FjnUserDeviceStatus;
  deviceType?: FjnDeviceType;
  riskLevel?: FjnDeviceRiskLevel;
  page?: number;
  pageSize?: number;
}

/** 入参：trust / untrust / block / unblock / revoke 通用 */
export interface ChangeDeviceStatusInput {
  reason?: string;
  riskScore?: number;
  expiresAt?: Date;
  operatorId?: string;
  metadata?: Record<string, unknown>;
}

/** 入参：添加黑名单 */
export interface AddBlacklistInput {
  fingerprint: string;
  reason: FjnBlacklistReason;
  blacklistSource?: FjnBlacklistSource;
  refNo?: string;
  description?: string;
  validFrom?: Date;
  expiresDays?: number;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  operatorId?: string;
}

/** 入参：列黑名单 */
export interface ListBlacklistInput {
  reason?: FjnBlacklistReason;
  blacklistSource?: FjnBlacklistSource;
  status?: FjnBlacklistStatus;
  page?: number;
  pageSize?: number;
}

/** 入参：黑名单校验 */
export interface CheckBlacklistInput {
  fingerprint: string;
}

/** 入参：风险评估 */
export interface AssessDeviceRiskInput {
  fingerprint: string;
  userId?: string;
  userDeviceId?: string;
  factors: FjnRiskFactor[];
  kycLevel?: string;
  ipAddress?: string;
  countryCode?: string;
  notes?: string;
  operatorId?: string;
}

/** 入参：列风险评估 */
export interface ListRiskAssessmentInput {
  userId?: string;
  userDeviceId?: string;
  fingerprint?: string;
  riskLevel?: FjnDeviceRiskLevel;
  status?: FjnRiskAssessmentStatus;
  page?: number;
  pageSize?: number;
}

/** 入参：风险评估处置 */
export interface ActionRiskAssessmentInput {
  action: 'dismiss' | 'actioned';
  notes?: string;
  operatorId?: string;
}

/** 入参：发布挑战 */
export interface IssueChallengeInput {
  userId: string;
  userDeviceId: string;
  challengeType: FjnChallengeType;
  trigger: FjnChallengeTrigger;
  target: string;
  codeHash?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresInMinutes?: number;
  maxAttempts?: number;
  metadata?: Record<string, unknown>;
  operatorId?: string;
}

/** 入参：验证挑战 */
export interface VerifyChallengeInput {
  challengeId: string;
  codeHash: string; // 由调用方计算（避免明文传递）
  ipAddress?: string;
  operatorId?: string;
}

/** 入参：取消/过期挑战 */
export interface ChangeChallengeStatusInput {
  reason?: string;
  operatorId?: string;
}

/** 入参：列挑战 */
export interface ListChallengeInput {
  userId?: string;
  userDeviceId?: string;
  status?: FjnChallengeStatus;
  challengeType?: FjnChallengeType;
  page?: number;
  pageSize?: number;
}

// ============================================================
// 3. 结果接口
// ============================================================

/** 结果：绑定设备 */
export interface BindDeviceResult {
  user_device_id: string;
  user_id: string;
  fingerprint_id: string;
  fingerprint: string;
  status: FjnUserDeviceStatus;
  requires_challenge: boolean;
  risk_score: number;
  risk_level: FjnDeviceRiskLevel;
  bound_at: string;
  is_new_fingerprint: boolean;
  is_new_user_device: boolean;
  blacklist_matched: boolean;
}

/** 结果：风险评估 */
export interface RiskAssessmentResult {
  risk_id: string;
  fingerprint: string;
  user_id?: string;
  user_device_id?: string;
  risk_score: number;
  risk_level: FjnDeviceRiskLevel;
  factors: FjnRiskFactor[];
  action: 'none' | 'challenge' | 'block' | 'trust';
  status: FjnRiskAssessmentStatus;
  kyc_level?: string;
  created_at: string;
}

/** 结果：黑名单校验 */
export interface BlacklistCheckResult {
  fingerprint: string;
  is_blacklisted: boolean;
  matched_id?: string;
  reason?: FjnBlacklistReason;
  blacklist_source?: FjnBlacklistSource;
  expires_at?: string;
}

// ============================================================
// 4. Device Service 主体
// ============================================================

/**
 * FJN Device Service 主类
 *
 * 公开方法约 30 个，按业务域分组：
 *  - Fingerprint 域（5）：createFingerprint / findFingerprintByHash /
 *                       findFingerprintById / findOrCreateFingerprint / updateFingerprintStats
 *  - UserDevice 域（10）：bindDevice / findUserDeviceById / listUserDevices /
 *                        heartbeat / unbindDevice / trustDevice / untrustDevice /
 *                        blockDevice / unblockDevice / revokeDevice
 *  - Blacklist 域（5）：addToBlacklist / removeFromBlacklist / listBlacklist /
 *                      findBlacklistByFingerprint / checkBlacklist
 *  - RiskAssessment 域（4）：assessDeviceRisk / listRiskAssessments /
 *                          dismissRiskAssessment / actionRiskAssessment
 *  - Challenge 域（6）：issueChallenge / verifyChallenge / failChallenge /
 *                      cancelChallenge / expireChallenge / listChallenges
 *  - 工具（1）：getDeviceSummary
 */
export class FjnDeviceService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnDeviceService' });
  }

  // ============================================================
  // 5.1 Fingerprint 域
  // ============================================================

  /**
   * 查找或创建 Fingerprint
   *  - 命中：更新 lastSeenAt / visitCount / ipAddress
   *  - 未命中：新建
   */
  async findOrCreateFingerprint(
    input: UpsertFingerprintInput,
  ): Promise<Record<string, unknown>> {
    if (!isValidFingerprint(input.fingerprint)) {
      throw new FjnDeviceFingerprintInvalidError({ value: input.fingerprint });
    }
    if (input.deviceType && !isValidDeviceType(input.deviceType)) {
      throw new FjnDeviceFingerprintInvalidError({ value: input.deviceType });
    }

    return this.withTransaction(async (tx) => {
      const existing = await tx.fjnDeviceFingerprint.findUnique({
        where: { fingerprint: input.fingerprint },
      });

      if (existing) {
        const updated = await tx.fjnDeviceFingerprint.update({
          where: { id: existing.id },
          data: {
            lastSeenAt: new Date(),
            visitCount: { increment: 1 },
            ipAddress: input.ipAddress ?? existing.ipAddress,
            countryCode: input.countryCode ?? existing.countryCode,
            userAgent: input.userAgent ?? existing.userAgent,
            osVersion: input.osVersion ?? existing.osVersion,
            browserVersion: input.browserVersion ?? existing.browserVersion,
            screenResolution: input.screenResolution ?? existing.screenResolution,
            timezone: input.timezone ?? existing.timezone,
            language: input.language ?? existing.language,
            userId: input.userId ?? existing.userId,
          },
        });
        return this.formatFingerprint(updated);
      }

      const created = await tx.fjnDeviceFingerprint.create({
        data: {
          fingerprint: input.fingerprint,
          userAgent: input.userAgent ?? null,
          deviceType: input.deviceType ?? null,
          osVersion: input.osVersion ?? null,
          browserVersion: input.browserVersion ?? null,
          screenResolution: input.screenResolution ?? null,
          timezone: input.timezone ?? null,
          language: input.language ?? null,
          ipAddress: input.ipAddress ?? null,
          countryCode: input.countryCode ?? null,
          userId: input.userId ?? null,
          riskLevel: 'low',
          visitCount: 1,
        },
      });
      return this.formatFingerprint(created);
    });
  }

  /** 按 fingerprint 哈希查询 */
  async findFingerprintByHash(fingerprint: string): Promise<Record<string, unknown> | null> {
    const fp = await this.prisma.fjnDeviceFingerprint.findUnique({
      where: { fingerprint },
    });
    return fp ? this.formatFingerprint(fp) : null;
  }

  /** 按 ID 查询 */
  async findFingerprintById(id: string): Promise<Record<string, unknown> | null> {
    const fp = await this.prisma.fjnDeviceFingerprint.findUnique({
      where: { id },
    });
    if (!fp) throw new FjnDeviceFingerprintNotFoundError({ id });
    return this.formatFingerprint(fp);
  }

  /** 创建 Fingerprint（不查重，重复时由调用方处理） */
  async createFingerprint(
    input: UpsertFingerprintInput,
  ): Promise<Record<string, unknown>> {
    if (!isValidFingerprint(input.fingerprint)) {
      throw new FjnDeviceFingerprintInvalidError({ value: input.fingerprint });
    }

    return this.withTransaction(async (tx) => {
      const existing = await tx.fjnDeviceFingerprint.findUnique({
        where: { fingerprint: input.fingerprint },
      });
      if (existing) {
        throw new FjnDeviceFingerprintAlreadyExistsError({
          fingerprint: input.fingerprint,
        });
      }
      const created = await tx.fjnDeviceFingerprint.create({
        data: {
          fingerprint: input.fingerprint,
          userAgent: input.userAgent ?? null,
          deviceType: input.deviceType ?? null,
          osVersion: input.osVersion ?? null,
          browserVersion: input.browserVersion ?? null,
          screenResolution: input.screenResolution ?? null,
          timezone: input.timezone ?? null,
          language: input.language ?? null,
          ipAddress: input.ipAddress ?? null,
          countryCode: input.countryCode ?? null,
          userId: input.userId ?? null,
          riskLevel: 'low',
          visitCount: 1,
        },
      });
      return this.formatFingerprint(created);
    });
  }

  /** 更新 Fingerprint 统计（visitCount / riskLevel） */
  async updateFingerprintStats(
    id: string,
    patch: { riskLevel?: FjnDeviceRiskLevel; visitCount?: number },
  ): Promise<Record<string, unknown>> {
    const data: Prisma.FjnDeviceFingerprintUpdateInput = {};
    if (patch.riskLevel !== undefined) data.riskLevel = patch.riskLevel;
    if (patch.visitCount !== undefined) data.visitCount = patch.visitCount;
    if (Object.keys(data).length === 0) {
      const cur = await this.findFingerprintById(id);
      return cur!;
    }
    const updated = await this.prisma.fjnDeviceFingerprint.update({
      where: { id },
      data,
    });
    return this.formatFingerprint(updated);
  }

  // ============================================================
  // 5.2 UserDevice 域
  // ============================================================

  /**
   * 绑定设备（UserDevice）
   *  - 命中既有 fingerprint + 同 user → 返回 active 状态，递增 visitCount
   *  - 命中既有 fingerprint + 不同 user → 同 fingerprint 跨用户
   *  - 新 fingerprint → 新建 Fingerprint + UserDevice（pending）
   *  - 黑名单命中 → 抛错
   */
  async bindDevice(input: BindDeviceInput): Promise<BindDeviceResult> {
    if (!input.userId) {
      throw new FjnUserDeviceNotFoundError({ hint: 'userId required' });
    }
    if (input.deviceName && !isValidDeviceName(input.deviceName)) {
      throw new FjnUserDeviceNameInvalidError({ deviceName: input.deviceName });
    }
    if (input.deviceType && !isValidDeviceType(input.deviceType)) {
      throw new FjnUserDeviceStatusInvalidError({ deviceType: input.deviceType });
    }
    if (!input.fingerprintId && !input.fingerprint) {
      throw new FjnDeviceFingerprintInvalidError({ hint: 'fingerprint or fingerprintId required' });
    }

    return this.withTransaction(async (tx) => {
      // 1. 解析/创建 Fingerprint
      let fingerprintId = input.fingerprintId;
      let fingerprintHash: string | null = null;
      let isNewFingerprint = false;

      if (fingerprintId) {
        const fp = await tx.fjnDeviceFingerprint.findUnique({
          where: { id: fingerprintId },
        });
        if (!fp) throw new FjnDeviceFingerprintNotFoundError({ id: fingerprintId });
        fingerprintHash = fp.fingerprint;
        await tx.fjnDeviceFingerprint.update({
          where: { id: fp.id },
          data: {
            lastSeenAt: new Date(),
            visitCount: { increment: 1 },
            ipAddress: input.ipAddress ?? fp.ipAddress,
            countryCode: input.countryCode ?? fp.countryCode,
            userId: input.userId ?? fp.userId,
          },
        });
      } else if (input.fingerprint) {
        if (!isValidFingerprint(input.fingerprint)) {
          throw new FjnDeviceFingerprintInvalidError({ value: input.fingerprint });
        }
        const existing = await tx.fjnDeviceFingerprint.findUnique({
          where: { fingerprint: input.fingerprint },
        });
        if (existing) {
          fingerprintId = existing.id;
          fingerprintHash = existing.fingerprint;
          await tx.fjnDeviceFingerprint.update({
            where: { id: existing.id },
            data: {
              lastSeenAt: new Date(),
              visitCount: { increment: 1 },
              ipAddress: input.ipAddress ?? existing.ipAddress,
              countryCode: input.countryCode ?? existing.countryCode,
              userId: input.userId ?? existing.userId,
            },
          });
        } else {
          const created = await tx.fjnDeviceFingerprint.create({
            data: {
              fingerprint: input.fingerprint,
              deviceType: input.deviceType ?? null,
              ipAddress: input.ipAddress ?? null,
              countryCode: input.countryCode ?? null,
              userId: input.userId,
              riskLevel: 'low',
              visitCount: 1,
            },
          });
          fingerprintId = created.id;
          fingerprintHash = created.fingerprint;
          isNewFingerprint = true;
        }
      }

      // 2. 黑名单检查
      if (fingerprintHash) {
        const bl = await tx.fjnDeviceBlacklist.findUnique({
          where: { fingerprint: fingerprintHash },
        });
        if (bl && isBlacklistActive(bl.status as FjnBlacklistStatus, bl.expiresAt)) {
          throw new FjnDeviceBlacklistMatchedError({
            fingerprint: fingerprintHash,
            blacklistId: bl.id,
            reason: bl.reason,
          });
        }
      }

      // 3. 命中既有 UserDevice
      const existingUd = await tx.fjnUserDevice.findUnique({
        where: {
          userId_fingerprintId: {
            userId: input.userId,
            fingerprintId: fingerprintId!,
          },
        },
      });
      if (existingUd) {
        if (existingUd.status === USER_DEVICE_STATUS.REVOKED) {
          throw new FjnUserDeviceRevokedError({ userDeviceId: existingUd.id });
        }
        if (existingUd.status === USER_DEVICE_STATUS.BLOCKED) {
          throw new FjnUserDeviceBlockedError({ userDeviceId: existingUd.id });
        }
        const updated = await tx.fjnUserDevice.update({
          where: { id: existingUd.id },
          data: {
            lastActiveAt: new Date(),
            lastIpAddress: input.ipAddress ?? existingUd.lastIpAddress,
            lastCountryCode: input.countryCode ?? existingUd.lastCountryCode,
            visitCount: { increment: 1 },
            sessionCount: { increment: 1 },
            metadata: (input.metadata as Prisma.InputJsonValue) ?? existingUd.metadata,
          },
        });
        const isPending = updated.status === USER_DEVICE_STATUS.PENDING;
        return {
          user_device_id: updated.id,
          user_id: updated.userId,
          fingerprint_id: updated.fingerprintId,
          fingerprint: fingerprintHash ?? '',
          status: updated.status as FjnUserDeviceStatus,
          requires_challenge: isPending && !input.skipChallenge,
          risk_score: updated.riskScore,
          risk_level: updated.riskLevel as FjnDeviceRiskLevel,
          bound_at: updated.boundAt.toISOString(),
          is_new_fingerprint: isNewFingerprint,
          is_new_user_device: false,
          blacklist_matched: false,
        };
      }

      // 4. 设备数量上限检查
      const userDeviceCount = await tx.fjnUserDevice.count({
        where: { userId: input.userId, deletedAt: null },
      });
      if (userDeviceCount >= DEVICE_USER_MAX_DEVICES) {
        throw new FjnUserDeviceLimitExceededError({
          userId: input.userId,
          current: userDeviceCount,
          max: DEVICE_USER_MAX_DEVICES,
        });
      }

      // 5. 主设备唯一性
      let isPrimary = input.isPrimary ?? false;
      if (isPrimary) {
        await tx.fjnUserDevice.updateMany({
          where: { userId: input.userId, isPrimary: true, deletedAt: null },
          data: { isPrimary: false },
        });
      }

      // 6. 新建 UserDevice（pending）
      const created = await tx.fjnUserDevice.create({
        data: {
          userId: input.userId,
          fingerprintId: fingerprintId!,
          deviceName: input.deviceName ?? null,
          deviceType: input.deviceType ?? null,
          status: USER_DEVICE_STATUS.PENDING,
          isPrimary,
          boundIpAddress: input.ipAddress ?? null,
          boundCountryCode: input.countryCode ?? null,
          lastIpAddress: input.ipAddress ?? null,
          lastCountryCode: input.countryCode ?? null,
          riskScore: 0,
          riskLevel: 'low',
          visitCount: 1,
          sessionCount: 1,
          metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });

      const requiresChallenge = !input.skipChallenge;
      const payload: DeviceBoundPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId
          ? DEVICE_EVENT_SOURCES.ADMIN
          : DEVICE_EVENT_SOURCES.USER,
        user_device_id: created.id,
        user_id: created.userId,
        fingerprint_id: created.fingerprintId,
        fingerprint: fingerprintHash ?? '',
        device_type: created.deviceType as FjnDeviceType | undefined,
        device_name: created.deviceName ?? undefined,
        ip_address: input.ipAddress,
        country_code: input.countryCode,
        initial_status: created.status as FjnUserDeviceStatus,
        requires_challenge: requiresChallenge,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, DEVICE_EVENTS.DEVICE_BOUND, payload);

      return {
        user_device_id: created.id,
        user_id: created.userId,
        fingerprint_id: created.fingerprintId,
        fingerprint: fingerprintHash ?? '',
        status: created.status as FjnUserDeviceStatus,
        requires_challenge: requiresChallenge,
        risk_score: created.riskScore,
        risk_level: created.riskLevel as FjnDeviceRiskLevel,
        bound_at: created.boundAt.toISOString(),
        is_new_fingerprint: isNewFingerprint,
        is_new_user_device: true,
        blacklist_matched: false,
      };
    });
  }

  /** 按 ID 查询 UserDevice */
  async findUserDeviceById(id: string): Promise<Record<string, unknown> | null> {
    const ud = await this.prisma.fjnUserDevice.findUnique({ where: { id } });
    return ud ? this.formatUserDevice(ud) : null;
  }

  /** 列出 UserDevice */
  async listUserDevices(
    params: ListUserDeviceInput,
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnUserDeviceWhereInput = { deletedAt: null };
    if (params.userId) where.userId = params.userId;
    if (params.status) where.status = params.status;
    if (params.deviceType) where.deviceType = params.deviceType;
    if (params.riskLevel) where.riskLevel = params.riskLevel;

    const [items, total] = await Promise.all([
      this.prisma.fjnUserDevice.findMany({
        where,
        orderBy: [{ lastActiveAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnUserDevice.count({ where }),
    ]);
    return {
      items: items.map((u) => this.formatUserDevice(u)),
      total,
      page,
      pageSize,
    };
  }

  /** 心跳上报（仅更新活跃时间与位置） */
  async heartbeat(input: DeviceHeartbeatInput): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const ud = await tx.fjnUserDevice.findUnique({ where: { id: input.userDeviceId } });
      if (!ud) throw new FjnUserDeviceNotFoundError({ id: input.userDeviceId });
      if (ud.status === USER_DEVICE_STATUS.REVOKED) {
        throw new FjnUserDeviceRevokedError({ userDeviceId: ud.id });
      }
      if (ud.status === USER_DEVICE_STATUS.BLOCKED) {
        throw new FjnUserDeviceBlockedError({ userDeviceId: ud.id });
      }
      const updated = await tx.fjnUserDevice.update({
        where: { id: ud.id },
        data: {
          lastActiveAt: new Date(),
          lastIpAddress: input.ipAddress ?? ud.lastIpAddress,
          lastCountryCode: input.countryCode ?? ud.lastCountryCode,
          lastCityCode: input.cityCode ?? ud.lastCityCode,
          sessionCount: { increment: 1 },
        },
      });
      const payload: DeviceHeartbeatPayload = {
        occurred_at: new Date().toISOString(),
        source: DEVICE_EVENT_SOURCES.SYSTEM,
        user_device_id: updated.id,
        user_id: updated.userId,
        fingerprint_id: updated.fingerprintId,
        ip_address: input.ipAddress,
        country_code: input.countryCode,
        session_id: input.sessionId,
      };
      await this.emitOutboxEvent(tx, DEVICE_EVENTS.DEVICE_HEARTBEAT, payload);
      return this.formatUserDevice(updated);
    });
  }

  /**
   * 通用状态切换（trust / untrust / block / unblock / revoke）
   *  - 内部根据 action 决定 from→to 流转合法性
   *  - 写 TrustLog
   *  - 触发对应 outbox 事件
   */
  private async changeDeviceTrust(
    id: string,
    action: FjnTrustAction,
    input: ChangeDeviceStatusInput,
  ): Promise<Record<string, unknown>> {
    if (!isValidTrustAction(action)) {
      throw new FjnTrustAlreadyAppliedError({ action });
    }

    return this.withTransaction(async (tx) => {
      const ud = await tx.fjnUserDevice.findUnique({ where: { id } });
      if (!ud) throw new FjnUserDeviceNotFoundError({ id });
      if (isTerminalUserDeviceStatus(ud.status as FjnUserDeviceStatus)) {
        throw new FjnUserDeviceStatusInvalidError({
          id,
          status: ud.status,
          action,
        });
      }

      const fromStatus = ud.status as FjnUserDeviceStatus;
      const toStatus = this.actionToStatus(action, fromStatus);

      // revoke 要求从 trusted 走 untrust 或允许直接 revoke
      if (action === TRUST_ACTION.REVOKE && fromStatus === USER_DEVICE_STATUS.TRUSTED) {
        throw new FjnTrustRevokeNotAllowedError({
          id,
          fromStatus,
        });
      }

      // 状态机校验
      try {
        assertTransitUserDeviceStatus(fromStatus, toStatus);
      } catch (e) {
        throw new FjnUserDeviceStatusInvalidError({
          id,
          fromStatus,
          toStatus,
          action,
          originalError: (e as Error).message,
        });
      }

      const newRiskScore = input.riskScore ?? ud.riskScore;
      const newRiskLevel = calcDeviceRiskLevel(newRiskScore);
      const updated = await tx.fjnUserDevice.update({
        where: { id },
        data: {
          status: toStatus,
          riskScore: newRiskScore,
          riskLevel: newRiskLevel,
        },
      });

      // 写 TrustLog
      await tx.fjnDeviceTrustLog.create({
        data: {
          userDeviceId: id,
          trustAction: action,
          fromStatus,
          toStatus,
          reason: input.reason ?? null,
          riskScore: newRiskScore,
          operatorId: input.operatorId ?? null,
          operatorType: input.operatorId
            ? 'admin'
            : action === TRUST_ACTION.BLOCK
              ? 'risk_engine'
              : 'user',
          metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });

      // 写 outbox 事件
      const source: FjnDeviceEventSource = input.operatorId
        ? DEVICE_EVENT_SOURCES.ADMIN
        : action === TRUST_ACTION.BLOCK
          ? DEVICE_EVENT_SOURCES.RISK_ENGINE
          : DEVICE_EVENT_SOURCES.USER;

      if (action === TRUST_ACTION.TRUST) {
        const payload: DeviceTrustedPayload = {
          occurred_at: new Date().toISOString(),
          source,
          user_device_id: updated.id,
          user_id: updated.userId,
          fingerprint_id: updated.fingerprintId,
          trust_action: action,
          risk_score: newRiskScore,
          operator_id: input.operatorId,
        };
        await this.emitOutboxEvent(tx, DEVICE_EVENTS.DEVICE_TRUSTED, payload);
      } else if (action === TRUST_ACTION.BLOCK || action === TRUST_ACTION.UNBLOCK) {
        const payload: DeviceBlockedPayload = {
          occurred_at: new Date().toISOString(),
          source,
          user_device_id: updated.id,
          user_id: updated.userId,
          fingerprint_id: updated.fingerprintId,
          reason: input.reason ?? action,
          expires_at: input.expiresAt?.toISOString(),
          operator_id: input.operatorId,
        };
        await this.emitOutboxEvent(tx, DEVICE_EVENTS.DEVICE_BLOCKED, payload);
      } else if (action === TRUST_ACTION.REVOKE) {
        const payload: DeviceRevokedPayload = {
          occurred_at: new Date().toISOString(),
          source,
          user_device_id: updated.id,
          user_id: updated.userId,
          fingerprint_id: updated.fingerprintId,
          reason: input.reason,
          operator_id: input.operatorId,
        };
        await this.emitOutboxEvent(tx, DEVICE_EVENTS.DEVICE_REVOKED, payload);
      }

      return this.formatUserDevice(updated);
    });
  }

  /** trust action → 目标 status */
  private actionToStatus(
    action: FjnTrustAction,
    from: FjnUserDeviceStatus,
  ): FjnUserDeviceStatus {
    if (action === TRUST_ACTION.TRUST) return USER_DEVICE_STATUS.TRUSTED;
    if (action === TRUST_ACTION.UNTRUST) return USER_DEVICE_STATUS.ACTIVE;
    if (action === TRUST_ACTION.BLOCK) return USER_DEVICE_STATUS.BLOCKED;
    if (action === TRUST_ACTION.UNBLOCK) {
      if (from === USER_DEVICE_STATUS.BLOCKED) return USER_DEVICE_STATUS.ACTIVE;
      return from;
    }
    if (action === TRUST_ACTION.REVOKE) return USER_DEVICE_STATUS.REVOKED;
    return from;
  }

  /** 信任设备 */
  async trustDevice(
    id: string,
    input: ChangeDeviceStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.changeDeviceTrust(id, TRUST_ACTION.TRUST, input);
  }

  /** 取消信任 */
  async untrustDevice(
    id: string,
    input: ChangeDeviceStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.changeDeviceTrust(id, TRUST_ACTION.UNTRUST, input);
  }

  /** 锁定设备 */
  async blockDevice(
    id: string,
    input: ChangeDeviceStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.changeDeviceTrust(id, TRUST_ACTION.BLOCK, input);
  }

  /** 解锁设备 */
  async unblockDevice(
    id: string,
    input: ChangeDeviceStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.changeDeviceTrust(id, TRUST_ACTION.UNBLOCK, input);
  }

  /** 吊销设备 */
  async revokeDevice(
    id: string,
    input: ChangeDeviceStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.changeDeviceTrust(id, TRUST_ACTION.REVOKE, input);
  }

  /**
   * 软解绑（标记 deletedAt）
   *  - 区别于 revoke：revoke 是显式黑名单行为，软解绑是用户/管理员自己移除
   */
  async unbindDevice(
    id: string,
    input: ChangeDeviceStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const ud = await tx.fjnUserDevice.findUnique({ where: { id } });
      if (!ud) throw new FjnUserDeviceNotFoundError({ id });
      if (ud.deletedAt) {
        return this.formatUserDevice(ud);
      }
      const updated = await tx.fjnUserDevice.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      const payload: DeviceRevokedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId
          ? DEVICE_EVENT_SOURCES.ADMIN
          : DEVICE_EVENT_SOURCES.USER,
        user_device_id: updated.id,
        user_id: updated.userId,
        fingerprint_id: updated.fingerprintId,
        reason: input.reason ?? 'unbind',
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, DEVICE_EVENTS.DEVICE_REVOKED, payload);
      return this.formatUserDevice(updated);
    });
  }

  // ============================================================
  // 5.3 Blacklist 域
  // ============================================================

  /** 添加黑名单 */
  async addToBlacklist(input: AddBlacklistInput): Promise<Record<string, unknown>> {
    if (!isValidBlacklistReason(input.reason)) {
      throw new FjnDeviceBlacklistReasonInvalidError({ value: input.reason });
    }
    const source = input.blacklistSource ?? BLACKLIST_SOURCE.INTERNAL;
    if (!isValidBlacklistSource(source)) {
      throw new FjnDeviceBlacklistSourceInvalidError({ value: source });
    }
    if (!isValidFingerprint(input.fingerprint)) {
      throw new FjnDeviceFingerprintInvalidError({ value: input.fingerprint });
    }
    // fraud / sanctions / terrorist_financing / aml_violation 必须 refNo
    if (
      (input.reason === BLACKLIST_REASON.FRAUD ||
        input.reason === BLACKLIST_REASON.SANCTIONS ||
        input.reason === BLACKLIST_REASON.TERRORIST_FINANCING ||
        input.reason === BLACKLIST_REASON.AML_VIOLATION) &&
      !input.refNo
    ) {
      throw new FjnDeviceBlacklistRefNoRequiredError({ reason: input.reason });
    }
    // expiresAt
    let expiresAt: Date | null = null;
    if (input.expiresAt) {
      if (input.expiresAt.getTime() <= Date.now()) {
        throw new FjnDeviceBlacklistExpiresInvalidError({
          value: input.expiresAt.toISOString(),
        });
      }
      expiresAt = input.expiresAt;
    } else if (input.expiresDays && input.expiresDays > 0) {
      expiresAt = new Date(Date.now() + input.expiresDays * 24 * 60 * 60 * 1000);
    } else if (input.expiresDays === undefined && input.expiresAt === undefined) {
      if (DEVICE_BLACKLIST_DEFAULT_EXPIRES_DAYS > 0) {
        expiresAt = new Date(
          Date.now() + DEVICE_BLACKLIST_DEFAULT_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
        );
      }
    }

    return this.withTransaction(async (tx) => {
      const existing = await tx.fjnDeviceBlacklist.findUnique({
        where: { fingerprint: input.fingerprint },
      });
      if (existing && existing.status === BLACKLIST_STATUS.ACTIVE) {
        throw new FjnDeviceBlacklistAlreadyExistsError({
          fingerprint: input.fingerprint,
        });
      }
      const validFrom = input.validFrom ?? new Date();
      const bl = existing
        ? await tx.fjnDeviceBlacklist.update({
            where: { id: existing.id },
            data: {
              reason: input.reason,
              blacklistSource: source,
              refNo: input.refNo ?? null,
              description: input.description ?? null,
              status: BLACKLIST_STATUS.ACTIVE,
              validFrom,
              expiresAt,
              addedBy: input.operatorId ?? existing.addedBy,
              metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            },
          })
        : await tx.fjnDeviceBlacklist.create({
            data: {
              fingerprint: input.fingerprint,
              reason: input.reason,
              blacklistSource: source,
              refNo: input.refNo ?? null,
              description: input.description ?? null,
              status: BLACKLIST_STATUS.ACTIVE,
              validFrom,
              expiresAt,
              addedBy: input.operatorId ?? null,
              metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            } as any,
          });

      const payload: DeviceBlacklistedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId
          ? DEVICE_EVENT_SOURCES.ADMIN
          : DEVICE_EVENT_SOURCES.RISK_ENGINE,
        blacklist_id: bl.id,
        fingerprint: bl.fingerprint,
        reason: bl.reason as FjnBlacklistReason,
        blacklist_source: bl.blacklistSource as FjnBlacklistSource,
        ref_no: bl.refNo ?? undefined,
        expires_at: bl.expiresAt?.toISOString(),
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, DEVICE_EVENTS.DEVICE_BLACKLISTED, payload);
      return this.formatBlacklist(bl);
    });
  }

  /** 移除黑名单（停用而非物理删除） */
  async removeFromBlacklist(
    id: string,
    input: ChangeDeviceStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const bl = await tx.fjnDeviceBlacklist.findUnique({ where: { id } });
      if (!bl) throw new FjnDeviceBlacklistNotFoundError({ id });
      if (bl.status === BLACKLIST_STATUS.DISABLED) {
        throw new FjnDeviceBlacklistAlreadyDisabledError({ id });
      }
      assertTransitBlacklistStatus_(
        bl.status as FjnBlacklistStatus,
        BLACKLIST_STATUS.DISABLED,
      );
      const updated = await tx.fjnDeviceBlacklist.update({
        where: { id },
        data: { status: BLACKLIST_STATUS.DISABLED },
      });
      const payload: DeviceUnblacklistedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId
          ? DEVICE_EVENT_SOURCES.ADMIN
          : DEVICE_EVENT_SOURCES.SYSTEM,
        blacklist_id: updated.id,
        fingerprint: updated.fingerprint,
        reason: input.reason,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, DEVICE_EVENTS.DEVICE_UNBLACKLISTED, payload);
      return this.formatBlacklist(updated);
    });
  }

  /** 列出黑名单 */
  async listBlacklist(
    params: ListBlacklistInput,
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnDeviceBlacklistWhereInput = {};
    if (params.reason) where.reason = params.reason;
    if (params.blacklistSource) where.blacklistSource = params.blacklistSource;
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.fjnDeviceBlacklist.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnDeviceBlacklist.count({ where }),
    ]);
    return {
      items: items.map((b) => this.formatBlacklist(b)),
      total,
      page,
      pageSize,
    };
  }

  /** 按 fingerprint 查询黑名单 */
  async findBlacklistByFingerprint(
    fingerprint: string,
  ): Promise<Record<string, unknown> | null> {
    const bl = await this.prisma.fjnDeviceBlacklist.findUnique({
      where: { fingerprint },
    });
    return bl ? this.formatBlacklist(bl) : null;
  }

  /** 黑名单命中检查（不抛错） */
  async checkBlacklist(input: CheckBlacklistInput): Promise<BlacklistCheckResult> {
    if (!isValidFingerprint(input.fingerprint)) {
      return { fingerprint: input.fingerprint, is_blacklisted: false };
    }
    const bl = await this.prisma.fjnDeviceBlacklist.findUnique({
      where: { fingerprint: input.fingerprint },
    });
    if (!bl) {
      return { fingerprint: input.fingerprint, is_blacklisted: false };
    }
    const isActive = isBlacklistActive(
      bl.status as FjnBlacklistStatus,
      bl.expiresAt,
    );
    return {
      fingerprint: input.fingerprint,
      is_blacklisted: isActive,
      matched_id: isActive ? bl.id : undefined,
      reason: isActive ? (bl.reason as FjnBlacklistReason) : undefined,
      blacklist_source: isActive ? (bl.blacklistSource as FjnBlacklistSource) : undefined,
      expires_at: bl.expiresAt?.toISOString(),
    };
  }

  // ============================================================
  // 5.4 RiskAssessment 域
  // ============================================================

  /** 设备风险评估（自动评分 + 写入历史 + 联动动作） */
  async assessDeviceRisk(
    input: AssessDeviceRiskInput,
  ): Promise<RiskAssessmentResult> {
    if (!isValidFingerprint(input.fingerprint)) {
      throw new FjnDeviceFingerprintInvalidError({ value: input.fingerprint });
    }
    if (input.factors.length === 0) {
      throw new FjnDeviceRiskFactorInvalidError({ hint: 'factors cannot be empty' });
    }
    for (const f of input.factors) {
      if (!isValidRiskFactor(f)) {
        throw new FjnDeviceRiskFactorInvalidError({ value: f });
      }
    }
    // 计算聚合分数（封顶 100）
    const rawScore = input.factors.reduce((acc, f) => acc + riskFactorScore(f), 0);
    const riskScore = Math.max(0, Math.min(100, rawScore));
    if (!isValidRiskScore(riskScore)) {
      throw new FjnDeviceRiskScoreInvalidError({ value: riskScore });
    }
    const riskLevel = calcDeviceRiskLevel(riskScore);
    // 决定动作
    const action: RiskAssessmentResult['action'] =
      riskScore >= DEVICE_BLOCK_AUTO_THRESHOLD
        ? 'block'
        : riskScore >= DEVICE_CHALLENGE_AUTO_THRESHOLD
          ? 'challenge'
          : riskScore <= DEVICE_TRUST_AUTO_THRESHOLD
            ? 'trust'
            : 'none';

    return this.withTransaction(async (tx) => {
      // 同步 fingerprint.riskLevel
      const fp = await tx.fjnDeviceFingerprint.findUnique({
        where: { fingerprint: input.fingerprint },
      });
      if (fp) {
        await tx.fjnDeviceFingerprint.update({
          where: { id: fp.id },
          data: { riskLevel },
        });
      }
      // 同步 userDevice.riskLevel（如有）
      if (input.userDeviceId) {
        await tx.fjnUserDevice.update({
          where: { id: input.userDeviceId },
          data: { riskScore, riskLevel },
        });
      }
      // 写历史
      const created = await tx.fjnDeviceRiskAssessment.create({
        data: {
          userDeviceId: input.userDeviceId ?? null,
          userId: input.userId ?? null,
          fingerprint: input.fingerprint,
          riskScore,
          riskLevel,
          factors: input.factors,
          action,
          status: RISK_ASSESSMENT_STATUS.SCORED,
          kycLevel: input.kycLevel ?? null,
          ipAddress: input.ipAddress ?? null,
          countryCode: input.countryCode ?? null,
          notes: input.notes ?? null,
          metadata: Prisma.JsonNull,
        },
      });

      const payload: DeviceRiskScoredPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId
          ? DEVICE_EVENT_SOURCES.ADMIN
          : DEVICE_EVENT_SOURCES.RISK_ENGINE,
        risk_id: created.id,
        user_device_id: input.userDeviceId,
        user_id: input.userId,
        fingerprint: input.fingerprint,
        risk_score: riskScore,
        risk_level: riskLevel,
        factors: input.factors,
        action,
        operator_id: input.operatorId,
      };
      await this.emitOutboxEvent(tx, DEVICE_EVENTS.DEVICE_RISK_SCORED, payload);
      return {
        risk_id: created.id,
        fingerprint: input.fingerprint,
        user_id: input.userId,
        user_device_id: input.userDeviceId,
        risk_score: riskScore,
        risk_level: riskLevel,
        factors: input.factors,
        action,
        status: created.status as FjnRiskAssessmentStatus,
        kyc_level: input.kycLevel,
        created_at: created.createdAt.toISOString(),
      };
    });
  }

  /** 列出风险评估 */
  async listRiskAssessments(
    params: ListRiskAssessmentInput,
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnDeviceRiskAssessmentWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.userDeviceId) where.userDeviceId = params.userDeviceId;
    if (params.fingerprint) where.fingerprint = params.fingerprint;
    if (params.riskLevel) where.riskLevel = params.riskLevel;
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.fjnDeviceRiskAssessment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnDeviceRiskAssessment.count({ where }),
    ]);
    return {
      items: items.map((r) => this.formatRiskAssessment(r)),
      total,
      page,
      pageSize,
    };
  }

  /** 忽略（误报） */
  async dismissRiskAssessment(
    id: string,
    input: { notes?: string; operatorId?: string } = {},
  ): Promise<Record<string, unknown>> {
    return this.changeRiskStatus(id, RISK_ASSESSMENT_STATUS.DISMISSED, input);
  }

  /** 处置（已应用风控措施） */
  async actionRiskAssessment(
    id: string,
    input: { notes?: string; operatorId?: string } = {},
  ): Promise<Record<string, unknown>> {
    return this.changeRiskStatus(id, RISK_ASSESSMENT_STATUS.ACTIONED, input);
  }

  private async changeRiskStatus(
    id: string,
    to: FjnRiskAssessmentStatus,
    input: { notes?: string; operatorId?: string },
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const r = await tx.fjnDeviceRiskAssessment.findUnique({ where: { id } });
      if (!r) throw new FjnDeviceRiskAssessmentNotFoundError({ id });
      if (r.status === RISK_ASSESSMENT_STATUS.ACTIONED) {
        throw new FjnDeviceRiskAssessmentAlreadyActionedError({ id });
      }
      if (!canTransitRiskAssessmentStatus(r.status as FjnRiskAssessmentStatus, to)) {
        throw new FjnDeviceRiskAssessmentNotFoundError({
          id,
          from: r.status,
          to,
        });
      }
      const updated = await tx.fjnDeviceRiskAssessment.update({
        where: { id },
        data: {
          status: to,
          notes: input.notes ?? r.notes,
        },
      });
      return this.formatRiskAssessment(updated);
    });
  }

  // ============================================================
  // 5.5 Challenge 域
  // ============================================================

  /** 发布挑战 */
  async issueChallenge(input: IssueChallengeInput): Promise<Record<string, unknown>> {
    if (!isValidChallengeType(input.challengeType)) {
      throw new FjnDeviceChallengeTypeInvalidError({ value: input.challengeType });
    }
    if (!isValidChallengeTrigger(input.trigger)) {
      throw new FjnDeviceChallengeTriggerInvalidError({ value: input.trigger });
    }
    if (!input.target) {
      throw new FjnDeviceChallengeTargetRequiredError({});
    }
    if (input.challengeType === CHALLENGE_TYPE.OTP_TOTP && !input.codeHash) {
      throw new FjnDeviceChallengeTargetRequiredError({
        hint: 'TOTP challenge requires codeHash',
      });
    }

    return this.withTransaction(async (tx) => {
      const ud = await tx.fjnUserDevice.findUnique({
        where: { id: input.userDeviceId },
      });
      if (!ud) throw new FjnUserDeviceNotFoundError({ id: input.userDeviceId });
      if (ud.userId !== input.userId) {
        throw new FjnUserDeviceNotFoundError({
          id: input.userDeviceId,
          hint: 'userId mismatch',
        });
      }

      const expiresInMinutes =
        input.expiresInMinutes ?? DEVICE_CHALLENGE_DEFAULT_EXPIRES_MINUTES;
      const maxAttempts = input.maxAttempts ?? DEVICE_CHALLENGE_DEFAULT_MAX_ATTEMPTS;
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

      const created = await tx.fjnDeviceChallenge.create({
        data: {
          userDeviceId: input.userDeviceId,
          userId: input.userId,
          challengeType: input.challengeType,
          trigger: input.trigger,
          target: input.target,
          codeHash: input.codeHash ?? null,
          status: CHALLENGE_STATUS.PENDING,
          attempts: 0,
          maxAttempts,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          expiresAt,
          metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });

      const payload: ChallengeIssuedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId
          ? DEVICE_EVENT_SOURCES.ADMIN
          : DEVICE_EVENT_SOURCES.SYSTEM,
        challenge_id: created.id,
        user_id: created.userId,
        user_device_id: created.userDeviceId,
        challenge_type: created.challengeType as FjnChallengeType,
        trigger: created.trigger as FjnChallengeTrigger,
        target: created.target,
        expires_at: created.expiresAt.toISOString(),
        max_attempts: created.maxAttempts,
      };
      await this.emitOutboxEvent(tx, DEVICE_EVENTS.CHALLENGE_ISSUED, payload);
      return this.formatChallenge(created);
    });
  }

  /** 验证挑战（成功路径） */
  async verifyChallenge(
    input: VerifyChallengeInput,
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const ch = await tx.fjnDeviceChallenge.findUnique({
        where: { id: input.challengeId },
      });
      if (!ch) throw new FjnDeviceChallengeNotFoundError({ id: input.challengeId });
      if (ch.status === CHALLENGE_STATUS.VERIFIED) {
        throw new FjnDeviceChallengeAlreadyVerifiedError({ id: ch.id });
      }
      if (ch.status === CHALLENGE_STATUS.FAILED) {
        throw new FjnDeviceChallengeAlreadyFailedError({ id: ch.id });
      }
      if (ch.status === CHALLENGE_STATUS.EXPIRED) {
        throw new FjnDeviceChallengeExpiredError({ id: ch.id });
      }
      if (ch.status === CHALLENGE_STATUS.CANCELLED) {
        throw new FjnDeviceChallengeCancelledError({ id: ch.id });
      }
      if (!isChallengePending(ch.status as FjnChallengeStatus)) {
        throw new FjnDeviceChallengeNotPendingError({ id: ch.id, status: ch.status });
      }
      // 过期检查
      if (ch.expiresAt.getTime() < Date.now()) {
        await tx.fjnDeviceChallenge.update({
          where: { id: ch.id },
          data: { status: CHALLENGE_STATUS.EXPIRED },
        });
        throw new FjnDeviceChallengeExpiredError({ id: ch.id });
      }
      // 验证码比对（仅当 ch.codeHash 存在时严格校验；TOTP / 自定义 codeHash）
      if (ch.codeHash) {
        if (ch.codeHash !== input.codeHash) {
          // 失败：累加 attempts，超过 max → failed
          const nextAttempts = ch.attempts + 1;
          if (nextAttempts >= ch.maxAttempts) {
            const failed = await tx.fjnDeviceChallenge.update({
              where: { id: ch.id },
              data: {
                status: CHALLENGE_STATUS.FAILED,
                attempts: nextAttempts,
              },
            });
            const failPayload: ChallengeFailedPayload = {
              occurred_at: new Date().toISOString(),
              source: DEVICE_EVENT_SOURCES.SYSTEM,
              challenge_id: failed.id,
              user_id: failed.userId,
              user_device_id: failed.userDeviceId,
              challenge_type: failed.challengeType as FjnChallengeType,
              attempts: failed.attempts,
              reason: 'max_attempts_exceeded',
            };
            await this.emitOutboxEvent(tx, DEVICE_EVENTS.CHALLENGE_FAILED, failPayload);
            throw new FjnDeviceChallengeMaxAttemptsExceededError({ id: ch.id });
          }
          await tx.fjnDeviceChallenge.update({
            where: { id: ch.id },
            data: { attempts: nextAttempts },
          });
          throw new FjnDeviceChallengeCodeMismatchError({ id: ch.id });
        }
      }
      // 通过
      const verified = await tx.fjnDeviceChallenge.update({
        where: { id: ch.id },
        data: {
          status: CHALLENGE_STATUS.VERIFIED,
          attempts: ch.attempts + 1,
          verifiedAt: new Date(),
        },
      });
      // 联动：UserDevice 从 pending → active
      const ud = await tx.fjnUserDevice.findUnique({
        where: { id: verified.userDeviceId },
      });
      if (
        ud &&
        ud.status === USER_DEVICE_STATUS.PENDING &&
        canTransitUserDeviceStatus(
          ud.status as FjnUserDeviceStatus,
          USER_DEVICE_STATUS.ACTIVE,
        )
      ) {
        await tx.fjnUserDevice.update({
          where: { id: ud.id },
          data: { status: USER_DEVICE_STATUS.ACTIVE },
        });
      }
      const payload: ChallengeVerifiedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId
          ? DEVICE_EVENT_SOURCES.ADMIN
          : DEVICE_EVENT_SOURCES.SYSTEM,
        challenge_id: verified.id,
        user_id: verified.userId,
        user_device_id: verified.userDeviceId,
        challenge_type: verified.challengeType as FjnChallengeType,
        attempts: verified.attempts,
        ip_address: input.ipAddress,
      };
      await this.emitOutboxEvent(tx, DEVICE_EVENTS.CHALLENGE_VERIFIED, payload);
      return this.formatChallenge(verified);
    });
  }

  /** 失败（管理员/系统主动标记） */
  async failChallenge(
    id: string,
    input: ChangeChallengeStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const ch = await tx.fjnDeviceChallenge.findUnique({ where: { id } });
      if (!ch) throw new FjnDeviceChallengeNotFoundError({ id });
      if (!isChallengePending(ch.status as FjnChallengeStatus)) {
        throw new FjnDeviceChallengeNotPendingError({ id, status: ch.status });
      }
      assertTransitChallengeStatus(
        ch.status as FjnChallengeStatus,
        CHALLENGE_STATUS.FAILED,
      );
      const updated = await tx.fjnDeviceChallenge.update({
        where: { id },
        data: { status: CHALLENGE_STATUS.FAILED },
      });
      const payload: ChallengeFailedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId
          ? DEVICE_EVENT_SOURCES.ADMIN
          : DEVICE_EVENT_SOURCES.SYSTEM,
        challenge_id: updated.id,
        user_id: updated.userId,
        user_device_id: updated.userDeviceId,
        challenge_type: updated.challengeType as FjnChallengeType,
        attempts: updated.attempts,
        reason: input.reason ?? 'admin_or_system',
      };
      await this.emitOutboxEvent(tx, DEVICE_EVENTS.CHALLENGE_FAILED, payload);
      return this.formatChallenge(updated);
    });
  }

  /** 取消挑战 */
  async cancelChallenge(
    id: string,
    input: ChangeChallengeStatusInput = {},
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const ch = await tx.fjnDeviceChallenge.findUnique({ where: { id } });
      if (!ch) throw new FjnDeviceChallengeNotFoundError({ id });
      if (!isChallengePending(ch.status as FjnChallengeStatus)) {
        throw new FjnDeviceChallengeNotPendingError({ id, status: ch.status });
      }
      assertTransitChallengeStatus(
        ch.status as FjnChallengeStatus,
        CHALLENGE_STATUS.CANCELLED,
      );
      const updated = await tx.fjnDeviceChallenge.update({
        where: { id },
        data: { status: CHALLENGE_STATUS.CANCELLED },
      });
      return this.formatChallenge(updated);
    });
  }

  /** 过期挑战（定时任务调用） */
  async expireChallenge(id: string): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const ch = await tx.fjnDeviceChallenge.findUnique({ where: { id } });
      if (!ch) throw new FjnDeviceChallengeNotFoundError({ id });
      if (!isChallengePending(ch.status as FjnChallengeStatus)) {
        return this.formatChallenge(ch);
      }
      const updated = await tx.fjnDeviceChallenge.update({
        where: { id },
        data: { status: CHALLENGE_STATUS.EXPIRED },
      });
      return this.formatChallenge(updated);
    });
  }

  /** 列出挑战 */
  async listChallenges(
    params: ListChallengeInput,
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnDeviceChallengeWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.userDeviceId) where.userDeviceId = params.userDeviceId;
    if (params.status) where.status = params.status;
    if (params.challengeType) where.challengeType = params.challengeType;

    const [items, total] = await Promise.all([
      this.prisma.fjnDeviceChallenge.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnDeviceChallenge.count({ where }),
    ]);
    return {
      items: items.map((c) => this.formatChallenge(c)),
      total,
      page,
      pageSize,
    };
  }

  // ============================================================
  // 5.6 工具
  // ============================================================

  /** 设备全景摘要 */
  async getDeviceSummary(): Promise<Record<string, unknown>> {
    const [
      fpTotal,
      udTotal,
      udActive,
      udTrusted,
      udBlocked,
      udRevoked,
      udPending,
      blTotal,
      blActive,
      raTotal,
      chTotal,
      chPending,
    ] = await Promise.all([
      this.prisma.fjnDeviceFingerprint.count(),
      this.prisma.fjnUserDevice.count({ where: { deletedAt: null } }),
      this.prisma.fjnUserDevice.count({
        where: { status: USER_DEVICE_STATUS.ACTIVE, deletedAt: null },
      }),
      this.prisma.fjnUserDevice.count({
        where: { status: USER_DEVICE_STATUS.TRUSTED, deletedAt: null },
      }),
      this.prisma.fjnUserDevice.count({
        where: { status: USER_DEVICE_STATUS.BLOCKED, deletedAt: null },
      }),
      this.prisma.fjnUserDevice.count({
        where: { status: USER_DEVICE_STATUS.REVOKED, deletedAt: null },
      }),
      this.prisma.fjnUserDevice.count({
        where: { status: USER_DEVICE_STATUS.PENDING, deletedAt: null },
      }),
      this.prisma.fjnDeviceBlacklist.count(),
      this.prisma.fjnDeviceBlacklist.count({
        where: { status: BLACKLIST_STATUS.ACTIVE },
      }),
      this.prisma.fjnDeviceRiskAssessment.count(),
      this.prisma.fjnDeviceChallenge.count(),
      this.prisma.fjnDeviceChallenge.count({
        where: { status: CHALLENGE_STATUS.PENDING },
      }),
    ]);

    return {
      fingerprints: { total: fpTotal },
      user_devices: {
        total: udTotal,
        pending: udPending,
        active: udActive,
        trusted: udTrusted,
        blocked: udBlocked,
        revoked: udRevoked,
      },
      blacklists: { total: blTotal, active: blActive },
      risk_assessments: { total: raTotal },
      challenges: { total: chTotal, pending: chPending },
    };
  }

  // ============================================================
  // 6. 私有工具
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

  /** 格式化 Fingerprint */
  private formatFingerprint(fp: any): Record<string, unknown> {
    return {
      fingerprint_id: fp.id,
      fingerprint: fp.fingerprint,
      user_agent: fp.userAgent,
      device_type: fp.deviceType,
      os_version: fp.osVersion,
      browser_version: fp.browserVersion,
      screen_resolution: fp.screenResolution,
      timezone: fp.timezone,
      language: fp.language,
      ip_address: fp.ipAddress,
      country_code: fp.countryCode,
      risk_level: fp.riskLevel,
      visit_count: fp.visitCount,
      first_seen_at: fp.firstSeenAt?.toISOString?.(),
      last_seen_at: fp.lastSeenAt?.toISOString?.(),
      user_id: fp.userId,
    };
  }

  /** 格式化 UserDevice */
  private formatUserDevice(ud: any): Record<string, unknown> {
    return {
      user_device_id: ud.id,
      user_id: ud.userId,
      fingerprint_id: ud.fingerprintId,
      device_name: ud.deviceName,
      device_type: ud.deviceType,
      status: ud.status,
      is_primary: ud.isPrimary,
      bound_at: ud.boundAt?.toISOString?.(),
      last_active_at: ud.lastActiveAt?.toISOString?.(),
      bound_ip_address: ud.boundIpAddress,
      bound_country_code: ud.boundCountryCode,
      last_ip_address: ud.lastIpAddress,
      last_country_code: ud.lastCountryCode,
      last_city_code: ud.lastCityCode,
      risk_score: ud.riskScore,
      risk_level: ud.riskLevel,
      visit_count: ud.visitCount,
      session_count: ud.sessionCount,
      notes: ud.notes,
      metadata: ud.metadata,
      created_at: ud.createdAt?.toISOString?.(),
      updated_at: ud.updatedAt?.toISOString?.(),
      deleted_at: ud.deletedAt?.toISOString?.() ?? null,
    };
  }

  /** 格式化 Blacklist */
  private formatBlacklist(bl: any): Record<string, unknown> {
    return {
      blacklist_id: bl.id,
      fingerprint: bl.fingerprint,
      reason: bl.reason,
      blacklist_source: bl.blacklistSource,
      ref_no: bl.refNo,
      description: bl.description,
      status: bl.status,
      added_by: bl.addedBy,
      valid_from: bl.validFrom?.toISOString?.() ?? null,
      expires_at: bl.expiresAt?.toISOString?.() ?? null,
      created_at: bl.createdAt?.toISOString?.(),
      updated_at: bl.updatedAt?.toISOString?.(),
    };
  }

  /** 格式化 RiskAssessment */
  private formatRiskAssessment(r: any): Record<string, unknown> {
    return {
      risk_id: r.id,
      user_device_id: r.userDeviceId,
      user_id: r.userId,
      fingerprint: r.fingerprint,
      risk_score: r.riskScore,
      risk_level: r.riskLevel,
      factors: r.factors,
      action: r.action,
      status: r.status,
      kyc_level: r.kycLevel,
      ip_address: r.ipAddress,
      country_code: r.countryCode,
      notes: r.notes,
      created_at: r.createdAt?.toISOString?.(),
      updated_at: r.updatedAt?.toISOString?.(),
    };
  }

  /** 格式化 Challenge */
  private formatChallenge(ch: any): Record<string, unknown> {
    return {
      challenge_id: ch.id,
      user_device_id: ch.userDeviceId,
      user_id: ch.userId,
      challenge_type: ch.challengeType,
      trigger: ch.trigger,
      target: ch.target,
      status: ch.status,
      attempts: ch.attempts,
      max_attempts: ch.maxAttempts,
      ip_address: ch.ipAddress,
      user_agent: ch.userAgent,
      verified_at: ch.verifiedAt?.toISOString?.() ?? null,
      expires_at: ch.expiresAt?.toISOString?.(),
      created_at: ch.createdAt?.toISOString?.(),
      updated_at: ch.updatedAt?.toISOString?.(),
    };
  }
}

/** 默认单例工厂 */
export function createFjnDeviceService(): FjnDeviceService {
  return new FjnDeviceService();
}
