/**
 * FJN KYC Service - 核心业务服务
 *
 * 严格遵循 H018 + H015 工业级职责规范：
 *  - 个人 KYC (FjnUserKyc)：提交 / 查询 / 审核通过 / 拒绝 / 人工复核 / 过期 / 重新提交
 *  - 企业 KYB (FjnUserKyb)：提交 / 查询 / 审核通过 / 拒绝 / 人工复核 / 过期 / 重新提交
 *  - 审核日志 (FjnKycReviewLog)：所有状态变更留痕
 *  - 状态机白名单：not_submitted / pending / approved / rejected / expired / manual_review
 *  - 12 个 outbox 事件常量（KYC 6 + KYB 6）
 *  - 业务规则：重复提交防护、状态机校验、过期天数可配
 *
 * 用法：
 *   const svc = new FjnKycService();
 *   const kyc = await svc.submitKyc({ userId, documentType, documentCountry, ... });
 *   const approved = await svc.approveKyc(kycId, { reviewerId });
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  KYC_STATUS,
  KYC_LEVEL,
  KYC_DOCUMENT_TYPE,
  KYC_RISK_STATUS,
  KYC_PROVIDER,
  isValidKycStatus,
  isKycApprovable,
  isKycRejectable,
  isKycManualReviewable,
  isKycResubmittable,
  isValidCountryCode,
  assertTransitKycStatus,
  FjnKycStatus,
  FjnKycLevel,
  FjnKycDocumentType,
  FjnKycRiskStatus,
  FjnKycProvider,
} from './kyc-state-machine';
import {
  KYC_EVENTS,
  KYC_EVENT_SOURCES,
  KycSubmittedPayload,
  KycApprovedPayload,
  KycRejectedPayload,
  KycExpiredPayload,
  KycManualReviewPayload,
  KycResubmittedPayload,
  KycCompanySubmittedPayload,
  KycCompanyApprovedPayload,
  KycCompanyRejectedPayload,
  KycCompanyExpiredPayload,
  KycCompanyManualReviewPayload,
  FjnKycEventSource,
} from './kyc-events';
import {
  FjnKycNotFoundError,
  FjnKycAlreadySubmittedError,
  FjnKycAlreadyApprovedError,
  FjnKycStatusNotApprovableError,
  FjnKycStatusNotRejectableError,
  FjnKycStatusNotManualReviewableError,
  FjnKycStatusNotResubmittableError,
  FjnKycDocumentRequiredError,
  FjnKycDocumentTypeInvalidError,
  FjnKycDocumentCountryInvalidError,
  FjnKycLevelInvalidError,
  FjnKycProviderInvalidError,
  FjnKycReviewerIdRequiredError,
  FjnKycReviewNoteRequiredError,
  FjnKybNotFoundError,
  FjnKybAlreadySubmittedError,
  FjnKybDocumentRequiredError,
  FjnKybCompanyNameRequiredError,
  FjnKybRegistrationCountryInvalidError,
} from './kyc-errors';

// ============================================================
// 1. 公共类型定义
// ============================================================

/** KYC 默认有效期（365 天） */
export const KYC_DEFAULT_EXPIRES_DAYS = 365;
/** KYC 拒绝原因最小长度 */
export const KYC_REJECT_NOTE_MIN_LENGTH = 5;
/** KYC 操作默认有效期（天） */
export const KYC_EXPIRES_DAYS_DEFAULT = 365;

// ============================================================
// 2. 入参接口
// ============================================================

/** 入参：提交 KYC */
export interface SubmitKycInput {
  userId: string;
  kycLevel?: FjnKycLevel;
  provider?: FjnKycProvider;
  documentType: FjnKycDocumentType;
  documentCountry: string;
  documentNumberHash?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  expiresDays?: number;
  metadata?: Record<string, unknown>;
  operatorId?: string;
}

/** 入参：审核通过 KYC */
export interface ApproveKycInput {
  reviewerId: string;
  reviewNote?: string;
  expiresDays?: number;
  operatorId?: string;
}

/** 入参：拒绝 KYC */
export interface RejectKycInput {
  reviewerId: string;
  reviewNote: string;
  operatorId?: string;
}

/** 入参：人工复核 */
export interface ManualReviewKycInput {
  reviewerId: string;
  reviewNote?: string;
  operatorId?: string;
}

/** 入参：过期 KYC */
export interface ExpireKycInput {
  reason?: string;
  operatorId?: string;
}

/** 入参：重新提交 KYC */
export interface ResubmitKycInput {
  kycLevel?: FjnKycLevel;
  provider?: FjnKycProvider;
  documentType: FjnKycDocumentType;
  documentCountry: string;
  documentNumberHash?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  metadata?: Record<string, unknown>;
  operatorId?: string;
}

/** 入参：提交 KYB */
export interface SubmitKybInput {
  userId: string;
  companyName: string;
  registrationCountry: string;
  provider?: FjnKycProvider;
  registrationNumberHash?: string;
  companyAddress?: string;
  beneficialOwnerInfo?: Record<string, unknown>;
  businessLicenseUrl?: string;
  taxInfo?: Record<string, unknown>;
  expiresDays?: number;
  metadata?: Record<string, unknown>;
  operatorId?: string;
}

/** 入参：审核通过 KYB */
export interface ApproveKybInput {
  reviewerId: string;
  reviewNote?: string;
  expiresDays?: number;
  operatorId?: string;
}

/** 入参：拒绝 KYB */
export interface RejectKybInput {
  reviewerId: string;
  reviewNote: string;
  operatorId?: string;
}

/** 入参：人工复核 KYB */
export interface ManualReviewKybInput {
  reviewerId: string;
  reviewNote?: string;
  operatorId?: string;
}

/** 入参：过期 KYB */
export interface ExpireKybInput {
  reason?: string;
  operatorId?: string;
}

/** 入参：重新提交 KYB */
export interface ResubmitKybInput {
  companyName?: string;
  registrationCountry?: string;
  provider?: FjnKycProvider;
  registrationNumberHash?: string;
  companyAddress?: string;
  beneficialOwnerInfo?: Record<string, unknown>;
  businessLicenseUrl?: string;
  taxInfo?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  operatorId?: string;
}

/** 入参：列表 KYC 查询 */
export interface ListKycInput {
  kycStatus?: FjnKycStatus;
  kycLevel?: FjnKycLevel;
  documentCountry?: string;
  userId?: string;
  reviewerId?: string;
  page?: number;
  pageSize?: number;
}

/** 入参：列表 KYB 查询 */
export interface ListKybInput {
  kybStatus?: FjnKycStatus;
  registrationCountry?: string;
  userId?: string;
  reviewerId?: string;
  page?: number;
  pageSize?: number;
}

/** 入参：列表审核日志 */
export interface ListReviewLogInput {
  targetType?: 'kyc' | 'kyb';
  targetId?: string;
  reviewerId?: string;
  page?: number;
  pageSize?: number;
}

// ============================================================
// 3. KYC Service 主体
// ============================================================

/**
 * FJN KYC Service 主类
 *
 * 公开方法约 22 个，按业务域分组：
 *  - KYC 域：submitKyc / findKycById / findLatestKycByUserId / listKycs /
 *            approveKyc / rejectKyc / manualReviewKyc / expireKyc / resubmitKyc
 *  - KYB 域：submitKyb / findKybById / findLatestKybByUserId / listKybs /
 *            approveKyb / rejectKyb / manualReviewKyb / expireKyb / resubmitKyb
 *  - 审核日志：listReviewLogs
 *  - 工具：getKycSummary / getKybSummary
 */
export class FjnKycService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnKycService' });
  }

  // ============================================================
  // 4.1 KYC 域
  // ============================================================

  /** 提交 KYC */
  async submitKyc(input: SubmitKycInput): Promise<Record<string, unknown>> {
    if (!input.userId) {
      throw new FjnKycReviewerIdRequiredError({ context: 'userId required' });
    }
    if (!input.documentType) {
      throw new FjnKycDocumentTypeInvalidError({ value: '' });
    }
    if (!(Object.values(KYC_DOCUMENT_TYPE) as string[]).includes(input.documentType)) {
      throw new FjnKycDocumentTypeInvalidError({ value: input.documentType });
    }
    if (!input.documentCountry || !isValidCountryCode(input.documentCountry)) {
      throw new FjnKycDocumentCountryInvalidError({ value: input.documentCountry });
    }
    if (!input.documentFrontUrl && !input.documentNumberHash) {
      throw new FjnKycDocumentRequiredError({ userId: input.userId });
    }
    const kycLevel = input.kycLevel ?? KYC_LEVEL.STANDARD;
    if (!(Object.values(KYC_LEVEL) as string[]).includes(kycLevel)) {
      throw new FjnKycLevelInvalidError({ value: kycLevel });
    }
    if (
      input.provider &&
      !(Object.values(KYC_PROVIDER) as string[]).includes(input.provider)
    ) {
      throw new FjnKycProviderInvalidError({ value: input.provider });
    }

    return this.withTransaction(async (tx) => {
      // 重复提交防护：检查同一 userId 是否有进行中的 KYC
      const existing = await tx.fjnUserKyc.findFirst({
        where: {
          userId: input.userId,
          kycStatus: {
            in: [KYC_STATUS.PENDING, KYC_STATUS.MANUAL_REVIEW, KYC_STATUS.APPROVED],
          },
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) {
        throw new FjnKycAlreadySubmittedError({
          userId: input.userId,
          existingKycId: existing.id,
          existingStatus: existing.kycStatus,
        });
      }

      const expiresDays = input.expiresDays ?? KYC_DEFAULT_EXPIRES_DAYS;
      const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);

      const kyc = await tx.fjnUserKyc.create({
        data: {
          userId: input.userId,
          kycLevel,
          kycStatus: KYC_STATUS.PENDING,
          provider: input.provider ?? null,
          documentType: input.documentType,
          documentCountry: input.documentCountry,
          documentNumberHash: input.documentNumberHash ?? null,
          documentFrontUrl: input.documentFrontUrl ?? null,
          documentBackUrl: input.documentBackUrl ?? null,
          selfieUrl: input.selfieUrl ?? null,
          riskStatus: KYC_RISK_STATUS.NORMAL,
          expiresAt,
          submittedAt: new Date(),
          metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });

      // 写审核日志
      await this.writeReviewLog(tx, {
        targetType: 'kyc',
        targetId: kyc.id,
        fromStatus: null,
        toStatus: KYC_STATUS.PENDING,
        reviewerId: input.operatorId,
        reviewNote: '提交 KYC',
        metadata: { kycLevel, provider: input.provider },
      });

      // 写 outbox 事件
      const payload: KycSubmittedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId
          ? KYC_EVENT_SOURCES.ADMIN
          : KYC_EVENT_SOURCES.USER,
        kyc_id: kyc.id,
        user_id: kyc.userId,
        kyc_level: kycLevel,
        document_type: input.documentType,
        document_country: input.documentCountry,
        provider: input.provider,
        submitted_at: kyc.submittedAt!.toISOString(),
      };
      await this.emitOutboxEvent(tx, KYC_EVENTS.KYC_SUBMITTED, payload);
      return this.formatKyc(kyc);
    });
  }

  /** 按 ID 查询 KYC */
  async findKycById(id: string): Promise<Record<string, unknown> | null> {
    const kyc = await this.prisma.fjnUserKyc.findUnique({ where: { id } });
    return kyc ? this.formatKyc(kyc) : null;
  }

  /** 按 userId 查询最新 KYC */
  async findLatestKycByUserId(
    userId: string,
  ): Promise<Record<string, unknown> | null> {
    const kyc = await this.prisma.fjnUserKyc.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return kyc ? this.formatKyc(kyc) : null;
  }

  /** 列出 KYC */
  async listKycs(
    params: ListKycInput,
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnUserKycWhereInput = { deletedAt: null };
    if (params.kycStatus) where.kycStatus = params.kycStatus;
    if (params.kycLevel) where.kycLevel = params.kycLevel;
    if (params.documentCountry) where.documentCountry = params.documentCountry;
    if (params.userId) where.userId = params.userId;
    if (params.reviewerId) where.reviewerId = params.reviewerId;

    const [items, total] = await Promise.all([
      this.prisma.fjnUserKyc.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnUserKyc.count({ where }),
    ]);
    return {
      items: items.map((k) => this.formatKyc(k)),
      total,
      page,
      pageSize,
    };
  }

  /** 审核通过 KYC */
  async approveKyc(
    id: string,
    input: ApproveKycInput,
  ): Promise<Record<string, unknown>> {
    if (!input.reviewerId) {
      throw new FjnKycReviewerIdRequiredError({ context: 'approve' });
    }
    return this.withTransaction(async (tx) => {
      const kyc = await tx.fjnUserKyc.findUnique({ where: { id } });
      if (!kyc) throw new FjnKycNotFoundError({ id });
      if (kyc.kycStatus === KYC_STATUS.APPROVED) {
        throw new FjnKycAlreadyApprovedError({ id });
      }
      if (!isKycApprovable(kyc.kycStatus as FjnKycStatus)) {
        throw new FjnKycStatusNotApprovableError({
          id,
          currentStatus: kyc.kycStatus,
        });
      }
      assertTransitKycStatus(kyc.kycStatus as FjnKycStatus, KYC_STATUS.APPROVED);

      const expiresDays = input.expiresDays ?? KYC_DEFAULT_EXPIRES_DAYS;
      const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);
      const now = new Date();

      const updated = await tx.fjnUserKyc.update({
        where: { id },
        data: {
          kycStatus: KYC_STATUS.APPROVED,
          reviewerId: input.reviewerId,
          reviewNote: input.reviewNote ?? null,
          approvedAt: now,
          expiresAt,
        },
      });

      await this.writeReviewLog(tx, {
        targetType: 'kyc',
        targetId: id,
        fromStatus: kyc.kycStatus,
        toStatus: KYC_STATUS.APPROVED,
        reviewerId: input.reviewerId,
        reviewNote: input.reviewNote,
        metadata: { expiresDays },
      });

      const payload: KycApprovedPayload = {
        occurred_at: now.toISOString(),
        source: KYC_EVENT_SOURCES.ADMIN,
        kyc_id: updated.id,
        user_id: updated.userId,
        reviewer_id: input.reviewerId,
        approved_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        review_note: input.reviewNote,
      };
      await this.emitOutboxEvent(tx, KYC_EVENTS.KYC_APPROVED, payload);
      return this.formatKyc(updated);
    });
  }

  /** 拒绝 KYC */
  async rejectKyc(id: string, input: RejectKycInput): Promise<Record<string, unknown>> {
    if (!input.reviewerId) {
      throw new FjnKycReviewerIdRequiredError({ context: 'reject' });
    }
    if (!input.reviewNote || input.reviewNote.length < KYC_REJECT_NOTE_MIN_LENGTH) {
      throw new FjnKycReviewNoteRequiredError({
        minLength: KYC_REJECT_NOTE_MIN_LENGTH,
        actualLength: input.reviewNote?.length ?? 0,
      });
    }
    return this.withTransaction(async (tx) => {
      const kyc = await tx.fjnUserKyc.findUnique({ where: { id } });
      if (!kyc) throw new FjnKycNotFoundError({ id });
      if (!isKycRejectable(kyc.kycStatus as FjnKycStatus)) {
        throw new FjnKycStatusNotRejectableError({
          id,
          currentStatus: kyc.kycStatus,
        });
      }
      assertTransitKycStatus(kyc.kycStatus as FjnKycStatus, KYC_STATUS.REJECTED);

      const now = new Date();
      const updated = await tx.fjnUserKyc.update({
        where: { id },
        data: {
          kycStatus: KYC_STATUS.REJECTED,
          reviewerId: input.reviewerId,
          reviewNote: input.reviewNote,
          rejectedAt: now,
        },
      });

      await this.writeReviewLog(tx, {
        targetType: 'kyc',
        targetId: id,
        fromStatus: kyc.kycStatus,
        toStatus: KYC_STATUS.REJECTED,
        reviewerId: input.reviewerId,
        reviewNote: input.reviewNote,
      });

      const payload: KycRejectedPayload = {
        occurred_at: now.toISOString(),
        source: KYC_EVENT_SOURCES.ADMIN,
        kyc_id: updated.id,
        user_id: updated.userId,
        reviewer_id: input.reviewerId,
        rejected_at: now.toISOString(),
        review_note: input.reviewNote,
      };
      await this.emitOutboxEvent(tx, KYC_EVENTS.KYC_REJECTED, payload);
      return this.formatKyc(updated);
    });
  }

  /** 转人工复核 KYC */
  async manualReviewKyc(
    id: string,
    input: ManualReviewKycInput,
  ): Promise<Record<string, unknown>> {
    if (!input.reviewerId) {
      throw new FjnKycReviewerIdRequiredError({ context: 'manualReview' });
    }
    return this.withTransaction(async (tx) => {
      const kyc = await tx.fjnUserKyc.findUnique({ where: { id } });
      if (!kyc) throw new FjnKycNotFoundError({ id });
      if (!isKycManualReviewable(kyc.kycStatus as FjnKycStatus)) {
        throw new FjnKycStatusNotManualReviewableError({
          id,
          currentStatus: kyc.kycStatus,
        });
      }
      assertTransitKycStatus(kyc.kycStatus as FjnKycStatus, KYC_STATUS.MANUAL_REVIEW);

      const updated = await tx.fjnUserKyc.update({
        where: { id },
        data: {
          kycStatus: KYC_STATUS.MANUAL_REVIEW,
          reviewerId: input.reviewerId,
          reviewNote: input.reviewNote ?? kyc.reviewNote,
        },
      });

      await this.writeReviewLog(tx, {
        targetType: 'kyc',
        targetId: id,
        fromStatus: kyc.kycStatus,
        toStatus: KYC_STATUS.MANUAL_REVIEW,
        reviewerId: input.reviewerId,
        reviewNote: input.reviewNote,
      });

      const payload: KycManualReviewPayload = {
        occurred_at: new Date().toISOString(),
        source: KYC_EVENT_SOURCES.ADMIN,
        kyc_id: updated.id,
        user_id: updated.userId,
        reviewer_id: input.reviewerId,
        review_note: input.reviewNote,
      };
      await this.emitOutboxEvent(tx, KYC_EVENTS.KYC_MANUAL_REVIEW, payload);
      return this.formatKyc(updated);
    });
  }

  /** 标记 KYC 过期 */
  async expireKyc(id: string, input: ExpireKycInput = {}): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const kyc = await tx.fjnUserKyc.findUnique({ where: { id } });
      if (!kyc) throw new FjnKycNotFoundError({ id });
      if (kyc.kycStatus !== KYC_STATUS.APPROVED) {
        // 只有 approved 才能 expired
        throw new FjnKycStatusNotApprovableError({
          id,
          currentStatus: kyc.kycStatus,
          reason: '只有 approved 才能标记 expired',
        });
      }
      assertTransitKycStatus(kyc.kycStatus as FjnKycStatus, KYC_STATUS.EXPIRED);

      const now = new Date();
      const updated = await tx.fjnUserKyc.update({
        where: { id },
        data: {
          kycStatus: KYC_STATUS.EXPIRED,
          expiredAt: now,
        },
      });

      await this.writeReviewLog(tx, {
        targetType: 'kyc',
        targetId: id,
        fromStatus: kyc.kycStatus,
        toStatus: KYC_STATUS.EXPIRED,
        reviewerId: input.operatorId,
        reviewNote: input.reason ?? 'KYC 过期',
      });

      const payload: KycExpiredPayload = {
        occurred_at: now.toISOString(),
        source: input.operatorId
          ? KYC_EVENT_SOURCES.ADMIN
          : KYC_EVENT_SOURCES.SYSTEM,
        kyc_id: updated.id,
        user_id: updated.userId,
        expired_at: now.toISOString(),
      };
      await this.emitOutboxEvent(tx, KYC_EVENTS.KYC_EXPIRED, payload);
      return this.formatKyc(updated);
    });
  }

  /** 重新提交 KYC（rejected / expired 后） */
  async resubmitKyc(
    id: string,
    input: ResubmitKycInput,
  ): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const kyc = await tx.fjnUserKyc.findUnique({ where: { id } });
      if (!kyc) throw new FjnKycNotFoundError({ id });
      if (!isKycResubmittable(kyc.kycStatus as FjnKycStatus)) {
        throw new FjnKycStatusNotResubmittableError({
          id,
          currentStatus: kyc.kycStatus,
        });
      }
      assertTransitKycStatus(kyc.kycStatus as FjnKycStatus, KYC_STATUS.PENDING);

      if (!input.documentType || !input.documentCountry) {
        throw new FjnKycDocumentTypeInvalidError({
          value: input.documentType ?? '',
        });
      }
      if (!isValidCountryCode(input.documentCountry)) {
        throw new FjnKycDocumentCountryInvalidError({ value: input.documentCountry });
      }
      if (!input.documentFrontUrl && !input.documentNumberHash) {
        throw new FjnKycDocumentRequiredError({ id });
      }

      const now = new Date();
      const updated = await tx.fjnUserKyc.update({
        where: { id },
        data: {
          kycStatus: KYC_STATUS.PENDING,
          kycLevel: input.kycLevel ?? kyc.kycLevel,
          provider: input.provider ?? kyc.provider,
          documentType: input.documentType,
          documentCountry: input.documentCountry,
          documentNumberHash: input.documentNumberHash ?? kyc.documentNumberHash,
          documentFrontUrl: input.documentFrontUrl ?? kyc.documentFrontUrl,
          documentBackUrl: input.documentBackUrl ?? kyc.documentBackUrl,
          selfieUrl: input.selfieUrl ?? kyc.selfieUrl,
          reviewerId: null,
          reviewNote: null,
          submittedAt: now,
          approvedAt: null,
          rejectedAt: null,
          expiredAt: null,
          metadata: (input.metadata as Prisma.InputJsonValue) ?? (kyc.metadata as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
        },
      });

      await this.writeReviewLog(tx, {
        targetType: 'kyc',
        targetId: id,
        fromStatus: kyc.kycStatus,
        toStatus: KYC_STATUS.PENDING,
        reviewerId: input.operatorId,
        reviewNote: '重新提交 KYC',
      });

      const payload: KycResubmittedPayload = {
        occurred_at: now.toISOString(),
        source: input.operatorId
          ? KYC_EVENT_SOURCES.ADMIN
          : KYC_EVENT_SOURCES.USER,
        kyc_id: updated.id,
        user_id: updated.userId,
        previous_status: kyc.kycStatus as FjnKycStatus,
        submitted_at: now.toISOString(),
      };
      await this.emitOutboxEvent(tx, KYC_EVENTS.KYC_RESUBMITTED, payload);
      return this.formatKyc(updated);
    });
  }

  // ============================================================
  // 4.2 KYB 域
  // ============================================================

  /** 提交 KYB */
  async submitKyb(input: SubmitKybInput): Promise<Record<string, unknown>> {
    if (!input.userId) {
      throw new FjnKybCompanyNameRequiredError({ context: 'userId required' });
    }
    if (!input.companyName) {
      throw new FjnKybCompanyNameRequiredError({});
    }
    if (!input.registrationCountry || !isValidCountryCode(input.registrationCountry)) {
      throw new FjnKybRegistrationCountryInvalidError({
        value: input.registrationCountry,
      });
    }
    if (!input.businessLicenseUrl && !input.registrationNumberHash) {
      throw new FjnKybDocumentRequiredError({ userId: input.userId });
    }
    if (
      input.provider &&
      !(Object.values(KYC_PROVIDER) as string[]).includes(input.provider)
    ) {
      throw new FjnKycProviderInvalidError({ value: input.provider });
    }

    return this.withTransaction(async (tx) => {
      const existing = await tx.fjnUserKyb.findFirst({
        where: {
          userId: input.userId,
          kybStatus: {
            in: [KYC_STATUS.PENDING, KYC_STATUS.MANUAL_REVIEW, KYC_STATUS.APPROVED],
          },
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) {
        throw new FjnKybAlreadySubmittedError({
          userId: input.userId,
          existingKybId: existing.id,
          existingStatus: existing.kybStatus,
        });
      }

      const expiresDays = input.expiresDays ?? KYC_DEFAULT_EXPIRES_DAYS;
      const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);

      const kyb = await tx.fjnUserKyb.create({
        data: {
          userId: input.userId,
          companyName: input.companyName,
          registrationCountry: input.registrationCountry,
          registrationNumberHash: input.registrationNumberHash ?? null,
          companyAddress: input.companyAddress ?? null,
          beneficialOwnerInfo:
            (input.beneficialOwnerInfo as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          businessLicenseUrl: input.businessLicenseUrl ?? null,
          taxInfo: (input.taxInfo as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          kybStatus: KYC_STATUS.PENDING,
          provider: input.provider ?? null,
          riskStatus: KYC_RISK_STATUS.NORMAL,
          expiresAt,
          submittedAt: new Date(),
          metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });

      await this.writeReviewLog(tx, {
        targetType: 'kyb',
        targetId: kyb.id,
        fromStatus: null,
        toStatus: KYC_STATUS.PENDING,
        reviewerId: input.operatorId,
        reviewNote: '提交 KYB',
      });

      const payload: KycCompanySubmittedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId
          ? KYC_EVENT_SOURCES.ADMIN
          : KYC_EVENT_SOURCES.USER,
        kyb_id: kyb.id,
        user_id: kyb.userId,
        company_name: input.companyName,
        registration_country: input.registrationCountry,
        provider: input.provider,
        submitted_at: kyb.submittedAt!.toISOString(),
      };
      await this.emitOutboxEvent(tx, KYC_EVENTS.KYB_SUBMITTED, payload);
      return this.formatKyb(kyb);
    });
  }

  /** 按 ID 查询 KYB */
  async findKybById(id: string): Promise<Record<string, unknown> | null> {
    const kyb = await this.prisma.fjnUserKyb.findUnique({ where: { id } });
    return kyb ? this.formatKyb(kyb) : null;
  }

  /** 按 userId 查询最新 KYB */
  async findLatestKybByUserId(
    userId: string,
  ): Promise<Record<string, unknown> | null> {
    const kyb = await this.prisma.fjnUserKyb.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return kyb ? this.formatKyb(kyb) : null;
  }

  /** 列出 KYB */
  async listKybs(
    params: ListKybInput,
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnUserKybWhereInput = { deletedAt: null };
    if (params.kybStatus) where.kybStatus = params.kybStatus;
    if (params.registrationCountry) {
      where.registrationCountry = params.registrationCountry;
    }
    if (params.userId) where.userId = params.userId;
    if (params.reviewerId) where.reviewerId = params.reviewerId;

    const [items, total] = await Promise.all([
      this.prisma.fjnUserKyb.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnUserKyb.count({ where }),
    ]);
    return {
      items: items.map((k) => this.formatKyb(k)),
      total,
      page,
      pageSize,
    };
  }

  /** 审核通过 KYB */
  async approveKyb(
    id: string,
    input: ApproveKybInput,
  ): Promise<Record<string, unknown>> {
    if (!input.reviewerId) {
      throw new FjnKycReviewerIdRequiredError({ context: 'approve kyb' });
    }
    return this.withTransaction(async (tx) => {
      const kyb = await tx.fjnUserKyb.findUnique({ where: { id } });
      if (!kyb) throw new FjnKybNotFoundError({ id });
      if (!isKycApprovable(kyb.kybStatus as FjnKycStatus)) {
        throw new FjnKycStatusNotApprovableError({
          id,
          currentStatus: kyb.kybStatus,
          reason: '当前 KYB 状态不可通过',
        });
      }
      assertTransitKycStatus(kyb.kybStatus as FjnKycStatus, KYC_STATUS.APPROVED);

      const expiresDays = input.expiresDays ?? KYC_DEFAULT_EXPIRES_DAYS;
      const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);
      const now = new Date();

      const updated = await tx.fjnUserKyb.update({
        where: { id },
        data: {
          kybStatus: KYC_STATUS.APPROVED,
          reviewerId: input.reviewerId,
          reviewNote: input.reviewNote ?? null,
          approvedAt: now,
          expiresAt,
        },
      });

      await this.writeReviewLog(tx, {
        targetType: 'kyb',
        targetId: id,
        fromStatus: kyb.kybStatus,
        toStatus: KYC_STATUS.APPROVED,
        reviewerId: input.reviewerId,
        reviewNote: input.reviewNote,
      });

      const payload: KycCompanyApprovedPayload = {
        occurred_at: now.toISOString(),
        source: KYC_EVENT_SOURCES.ADMIN,
        kyb_id: updated.id,
        user_id: updated.userId,
        reviewer_id: input.reviewerId,
        approved_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        review_note: input.reviewNote,
      };
      await this.emitOutboxEvent(tx, KYC_EVENTS.KYB_APPROVED, payload);
      return this.formatKyb(updated);
    });
  }

  /** 拒绝 KYB */
  async rejectKyb(id: string, input: RejectKybInput): Promise<Record<string, unknown>> {
    if (!input.reviewerId) {
      throw new FjnKycReviewerIdRequiredError({ context: 'reject kyb' });
    }
    if (!input.reviewNote || input.reviewNote.length < KYC_REJECT_NOTE_MIN_LENGTH) {
      throw new FjnKycReviewNoteRequiredError({
        minLength: KYC_REJECT_NOTE_MIN_LENGTH,
      });
    }
    return this.withTransaction(async (tx) => {
      const kyb = await tx.fjnUserKyb.findUnique({ where: { id } });
      if (!kyb) throw new FjnKybNotFoundError({ id });
      if (!isKycRejectable(kyb.kybStatus as FjnKycStatus)) {
        throw new FjnKycStatusNotRejectableError({
          id,
          currentStatus: kyb.kybStatus,
          reason: '当前 KYB 状态不可拒绝',
        });
      }
      assertTransitKycStatus(kyb.kybStatus as FjnKycStatus, KYC_STATUS.REJECTED);

      const now = new Date();
      const updated = await tx.fjnUserKyb.update({
        where: { id },
        data: {
          kybStatus: KYC_STATUS.REJECTED,
          reviewerId: input.reviewerId,
          reviewNote: input.reviewNote,
          rejectedAt: now,
        },
      });

      await this.writeReviewLog(tx, {
        targetType: 'kyb',
        targetId: id,
        fromStatus: kyb.kybStatus,
        toStatus: KYC_STATUS.REJECTED,
        reviewerId: input.reviewerId,
        reviewNote: input.reviewNote,
      });

      const payload: KycCompanyRejectedPayload = {
        occurred_at: now.toISOString(),
        source: KYC_EVENT_SOURCES.ADMIN,
        kyb_id: updated.id,
        user_id: updated.userId,
        reviewer_id: input.reviewerId,
        rejected_at: now.toISOString(),
        review_note: input.reviewNote,
      };
      await this.emitOutboxEvent(tx, KYC_EVENTS.KYB_REJECTED, payload);
      return this.formatKyb(updated);
    });
  }

  /** 转人工复核 KYB */
  async manualReviewKyb(
    id: string,
    input: ManualReviewKybInput,
  ): Promise<Record<string, unknown>> {
    if (!input.reviewerId) {
      throw new FjnKycReviewerIdRequiredError({ context: 'manualReview kyb' });
    }
    return this.withTransaction(async (tx) => {
      const kyb = await tx.fjnUserKyb.findUnique({ where: { id } });
      if (!kyb) throw new FjnKybNotFoundError({ id });
      if (!isKycManualReviewable(kyb.kybStatus as FjnKycStatus)) {
        throw new FjnKycStatusNotManualReviewableError({
          id,
          currentStatus: kyb.kybStatus,
          reason: '当前 KYB 状态不可转人工',
        });
      }
      assertTransitKycStatus(kyb.kybStatus as FjnKycStatus, KYC_STATUS.MANUAL_REVIEW);

      const updated = await tx.fjnUserKyb.update({
        where: { id },
        data: {
          kybStatus: KYC_STATUS.MANUAL_REVIEW,
          reviewerId: input.reviewerId,
          reviewNote: input.reviewNote ?? kyb.reviewNote,
        },
      });

      await this.writeReviewLog(tx, {
        targetType: 'kyb',
        targetId: id,
        fromStatus: kyb.kybStatus,
        toStatus: KYC_STATUS.MANUAL_REVIEW,
        reviewerId: input.reviewerId,
        reviewNote: input.reviewNote,
      });

      const payload: KycCompanyManualReviewPayload = {
        occurred_at: new Date().toISOString(),
        source: KYC_EVENT_SOURCES.ADMIN,
        kyb_id: updated.id,
        user_id: updated.userId,
        reviewer_id: input.reviewerId,
        review_note: input.reviewNote,
      };
      await this.emitOutboxEvent(tx, KYC_EVENTS.KYB_MANUAL_REVIEW, payload);
      return this.formatKyb(updated);
    });
  }

  /** 标记 KYB 过期 */
  async expireKyb(id: string, input: ExpireKybInput = {}): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const kyb = await tx.fjnUserKyb.findUnique({ where: { id } });
      if (!kyb) throw new FjnKybNotFoundError({ id });
      if (kyb.kybStatus !== KYC_STATUS.APPROVED) {
        throw new FjnKycStatusNotApprovableError({
          id,
          currentStatus: kyb.kybStatus,
          reason: '只有 approved 才能标记 expired',
        });
      }
      assertTransitKycStatus(kyb.kybStatus as FjnKycStatus, KYC_STATUS.EXPIRED);

      const now = new Date();
      const updated = await tx.fjnUserKyb.update({
        where: { id },
        data: {
          kybStatus: KYC_STATUS.EXPIRED,
          expiredAt: now,
        },
      });

      await this.writeReviewLog(tx, {
        targetType: 'kyb',
        targetId: id,
        fromStatus: kyb.kybStatus,
        toStatus: KYC_STATUS.EXPIRED,
        reviewerId: input.operatorId,
        reviewNote: input.reason ?? 'KYB 过期',
      });

      const payload: KycCompanyExpiredPayload = {
        occurred_at: now.toISOString(),
        source: input.operatorId
          ? KYC_EVENT_SOURCES.ADMIN
          : KYC_EVENT_SOURCES.SYSTEM,
        kyb_id: updated.id,
        user_id: updated.userId,
        expired_at: now.toISOString(),
      };
      await this.emitOutboxEvent(tx, KYC_EVENTS.KYB_EXPIRED, payload);
      return this.formatKyb(updated);
    });
  }

  // ============================================================
  // 4.3 审核日志
  // ============================================================

  /** 列出审核日志 */
  async listReviewLogs(
    params: ListReviewLogInput,
  ): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.FjnKycReviewLogWhereInput = {};
    if (params.targetType) where.targetType = params.targetType;
    if (params.targetId) where.targetId = params.targetId;
    if (params.reviewerId) where.reviewerId = params.reviewerId;

    const [items, total] = await Promise.all([
      this.prisma.fjnKycReviewLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnKycReviewLog.count({ where }),
    ]);
    return {
      items: items.map((l) => this.formatReviewLog(l)),
      total,
      page,
      pageSize,
    };
  }

  // ============================================================
  // 4.4 汇总统计
  // ============================================================

  /** KYC 汇总 */
  async getKycSummary(): Promise<Record<string, unknown>> {
    const groups = await this.prisma.fjnUserKyc.groupBy({
      by: ['kycStatus'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    const total = await this.prisma.fjnUserKyc.count({ where: { deletedAt: null } });
    const byLevel = await this.prisma.fjnUserKyc.groupBy({
      by: ['kycLevel'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    return {
      total,
      byStatus: groups.reduce<Record<string, number>>(
        (acc, g) => ({ ...acc, [g.kycStatus]: g._count._all }),
        {},
      ),
      byLevel: byLevel.reduce<Record<string, number>>(
        (acc, g) => ({ ...acc, [g.kycLevel]: g._count._all }),
        {},
      ),
    };
  }

  /** KYB 汇总 */
  async getKybSummary(): Promise<Record<string, unknown>> {
    const groups = await this.prisma.fjnUserKyb.groupBy({
      by: ['kybStatus'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    const total = await this.prisma.fjnUserKyb.count({ where: { deletedAt: null } });
    return {
      total,
      byStatus: groups.reduce<Record<string, number>>(
        (acc, g) => ({ ...acc, [g.kybStatus]: g._count._all }),
        {},
      ),
    };
  }

  // ============================================================
  // 5. 工具方法
  // ============================================================

  /** 写审核日志（事务内） */
  private async writeReviewLog(
    tx: any,
    params: {
      targetType: 'kyc' | 'kyb';
      targetId: string;
      fromStatus: string | null;
      toStatus: string;
      reviewerId?: string;
      reviewNote?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    try {
      await tx.fjnKycReviewLog.create({
        data: {
          targetType: params.targetType,
          targetId: params.targetId,
          fromStatus: params.fromStatus,
          toStatus: params.toStatus,
          reviewerId: params.reviewerId ?? null,
          reviewNote: params.reviewNote ?? null,
          metadata: (params.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });
    } catch (e) {
      this.log('warn', `writeReviewLog failed`, {
        error: (e as Error).message,
        targetType: params.targetType,
        targetId: params.targetId,
      });
    }
  }

  /** 写入 outbox 事件（事务内） */
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

  /** 格式化 KYC */
  private formatKyc(k: any): Record<string, unknown> {
    return {
      kyc_id: k.id,
      user_id: k.userId,
      kyc_level: k.kycLevel,
      kyc_status: k.kycStatus,
      provider: k.provider,
      document_type: k.documentType,
      document_country: k.documentCountry,
      document_number_hash: k.documentNumberHash,
      document_front_url: k.documentFrontUrl,
      document_back_url: k.documentBackUrl,
      selfie_url: k.selfieUrl,
      reviewer_id: k.reviewerId,
      review_note: k.reviewNote,
      risk_status: k.riskStatus,
      submitted_at: k.submittedAt,
      approved_at: k.approvedAt,
      rejected_at: k.rejectedAt,
      expired_at: k.expiredAt,
      expires_at: k.expiresAt,
      metadata: k.metadata ?? null,
      created_at: k.createdAt,
      updated_at: k.updatedAt,
    };
  }

  /** 格式化 KYB */
  private formatKyb(k: any): Record<string, unknown> {
    return {
      kyb_id: k.id,
      user_id: k.userId,
      company_name: k.companyName,
      registration_country: k.registrationCountry,
      registration_number_hash: k.registrationNumberHash,
      company_address: k.companyAddress,
      beneficial_owner_info: k.beneficialOwnerInfo ?? null,
      business_license_url: k.businessLicenseUrl,
      tax_info: k.taxInfo ?? null,
      kyb_status: k.kybStatus,
      provider: k.provider,
      reviewer_id: k.reviewerId,
      review_note: k.reviewNote,
      risk_status: k.riskStatus,
      submitted_at: k.submittedAt,
      approved_at: k.approvedAt,
      rejected_at: k.rejectedAt,
      expired_at: k.expiredAt,
      expires_at: k.expiresAt,
      metadata: k.metadata ?? null,
      created_at: k.createdAt,
      updated_at: k.updatedAt,
    };
  }

  /** 格式化审核日志 */
  private formatReviewLog(l: any): Record<string, unknown> {
    return {
      log_id: l.id,
      target_type: l.targetType,
      target_id: l.targetId,
      from_status: l.fromStatus,
      to_status: l.toStatus,
      reviewer_id: l.reviewerId,
      review_note: l.reviewNote,
      metadata: l.metadata ?? null,
      created_at: l.createdAt,
    };
  }
}
