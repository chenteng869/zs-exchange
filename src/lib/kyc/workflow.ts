/**
 * KYC 审核工作流
 *
 * 自动审核规则：
 *  - Lv.1：邮箱+手机已验证 → 自动通过
 *  - Lv.2：需人工审核（OCR 校验 + 人脸活体）
 *  - Lv.3（KYB）：需 3 名不同管理员审批
 *
 * 申请记录以内存 Map 存储；生产可对接关系型数据库。
 *
 * @module lib/kyc/workflow
 */

import type { ID, ISODate, KycLevel, KycSubmission, User } from '@/types/models';
import { randomString } from '@/lib/auth/crypto';
import { KycError } from '@/lib/auth/errors';
import { validateKycData } from './verifier';

// ============================================================================
// 类型扩展
// =====================================================================================

export interface KycDecisionLog {
  /** 决策时间 ISO */
  at: ISODate;
  /** 决策人 */
  reviewer: string;
  /** 决策 */
  action: 'auto_approve' | 'approve' | 'reject' | 'request_resubmit';
  /** 原因 */
  reason?: string;
}

export interface ExtendedKycSubmission extends KycSubmission {
  /** 决策日志（多轮审批） */
  decisions: KycDecisionLog[];
  /** KYB 多签审批人 */
  approvers: string[];
  /** 自动审核结果 */
  autoCheckResults: Array<{ rule: string; passed: boolean; note?: string }>;
}

// ============================================================================
// 存储
// ============================================================================

const submissions: Map<ID, ExtendedKycSubmission> = new Map();

const persist = (s: ExtendedKycSubmission): ExtendedKycSubmission => {
  submissions.set(s.id, s);
  return s;
};

const newId = (): ID => `kyc_${Date.now()}_${randomString(6)}`;

// ============================================================================
// 提交
// ============================================================================

export interface SubmitKycParams {
  user: Pick<User, 'id' | 'email' | 'phone' | 'emailVerified' | 'phoneVerified'>;
  level: KycLevel;
  data: Omit<KycSubmission, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt' | 'level'>;
}

/**
 * 提交 KYC 申请
 * 自动进行字段校验 + 自动审核（Lv.1）
 */
export const submitKyc = (params: SubmitKycParams): ExtendedKycSubmission => {
  if (!params.user) {
    throw new KycError('KYC_NO_USER', 'User is required');
  }
  if (params.level < 0 || params.level > 3) {
    throw new KycError('KYC_LEVEL_INVALID', `Invalid KYC level: ${params.level}`);
  }

  // 数据格式校验
  validateKycData({
    fullName: params.data.fullName,
    idType: params.data.idType,
    idNumber: params.data.idNumber,
    dateOfBirth: params.data.dateOfBirth,
    email: params.user.email,
    phone: params.user.phone,
    countryCode: params.data.nationality,
  });

  const now = new Date().toISOString();
  const id = newId();

  // 自动审核（仅 Lv.1）
  const autoCheckResults: ExtendedKycSubmission['autoCheckResults'] = [];
  if (params.level === 1) {
    autoCheckResults.push({
      rule: 'email_verified',
      passed: !!params.user.emailVerified,
      note: params.user.emailVerified ? undefined : '邮箱未验证',
    });
    autoCheckResults.push({
      rule: 'phone_verified',
      passed: !!params.user.phoneVerified,
      note: params.user.phoneVerified ? undefined : '手机未验证',
    });
    autoCheckResults.push({
      rule: 'id_format',
      passed: true,
    });
  } else {
    autoCheckResults.push({
      rule: 'manual_review_required',
      passed: false,
      note: `Lv.${params.level} 需要人工审核`,
    });
  }

  const submission: ExtendedKycSubmission = {
    id,
    userId: params.user.id,
    level: params.level,
    status: 'pending',
    fullName: params.data.fullName,
    idType: params.data.idType,
    idNumber: params.data.idNumber,
    dateOfBirth: params.data.dateOfBirth,
    nationality: params.data.nationality,
    address: params.data.address,
    city: params.data.city,
    state: params.data.state,
    postalCode: params.data.postalCode,
    idFrontUrl: params.data.idFrontUrl,
    idBackUrl: params.data.idBackUrl,
    selfieUrl: params.data.selfieUrl,
    createdAt: now,
    updatedAt: now,
    decisions: [],
    approvers: [],
    autoCheckResults,
  };

  // Lv.1 全自动通过
  if (
    params.level === 1 &&
    autoCheckResults.every((r) => r.passed)
  ) {
    submission.status = 'approved';
    submission.reviewedAt = now;
    submission.reviewedBy = 'system';
    submission.decisions.push({
      at: now,
      reviewer: 'system',
      action: 'auto_approve',
      reason: 'Lv.1 自动审核通过：邮箱、手机、证件均已验证',
    });
  }

  return persist(submission);
};

// ============================================================================
// 审批
// ============================================================================

/**
 * 审批通过
 * Lv.3（KYB）需要 3 名不同审批人
 */
export const approveKyc = (id: ID, reviewerId: string): ExtendedKycSubmission => {
  const s = submissions.get(id);
  if (!s) {
    throw new KycError('KYC_NOT_FOUND', `KYC submission not found: ${id}`);
  }
  if (s.status === 'approved' || s.status === 'rejected') {
    throw new KycError('KYC_ALREADY_DECIDED', `KYC already ${s.status}`);
  }
  if (s.approvers.includes(reviewerId)) {
    throw new KycError('KYC_DUPLICATE_APPROVAL', `${reviewerId} already approved`);
  }
  const now = new Date().toISOString();

  if (s.level === 3) {
    // KYB 三签
    s.approvers.push(reviewerId);
    s.decisions.push({
      at: now,
      reviewer: reviewerId,
      action: 'approve',
      reason: `KYB 审批 ${s.approvers.length}/3`,
    });
    if (s.approvers.length >= 3) {
      s.status = 'approved';
      s.reviewedBy = reviewerId;
      s.reviewedAt = now;
    }
  } else {
    s.status = 'approved';
    s.reviewedBy = reviewerId;
    s.reviewedAt = now;
    s.approvers.push(reviewerId);
    s.decisions.push({
      at: now,
      reviewer: reviewerId,
      action: 'approve',
    });
  }

  s.updatedAt = now;
  return persist(s);
};

/**
 * 审批拒绝
 */
export const rejectKyc = (id: ID, reviewerId: string, reason: string): ExtendedKycSubmission => {
  if (!reason || reason.trim().length < 2) {
    throw new KycError('KYC_REASON_REQUIRED', 'Reject reason is required');
  }
  const s = submissions.get(id);
  if (!s) {
    throw new KycError('KYC_NOT_FOUND', `KYC submission not found: ${id}`);
  }
  if (s.status === 'approved' || s.status === 'rejected') {
    throw new KycError('KYC_ALREADY_DECIDED', `KYC already ${s.status}`);
  }

  const now = new Date().toISOString();
  s.status = 'rejected';
  s.reviewedBy = reviewerId;
  s.reviewedAt = now;
  s.rejectReason = reason;
  s.approvers.push(reviewerId);
  s.decisions.push({
    at: now,
    reviewer: reviewerId,
    action: 'reject',
    reason,
  });
  s.updatedAt = now;
  return persist(s);
};

/**
 * 申请重新提交（用户被拒后可重提）
 */
export const requestResubmit = (
  id: ID,
  reviewerId: string,
  reason: string
): ExtendedKycSubmission => {
  if (!reason || reason.trim().length < 2) {
    throw new KycError('KYC_REASON_REQUIRED', 'Resubmit reason is required');
  }
  const s = submissions.get(id);
  if (!s) {
    throw new KycError('KYC_NOT_FOUND', `KYC submission not found: ${id}`);
  }
  const now = new Date().toISOString();
  s.status = 'resubmit';
  s.reviewedBy = reviewerId;
  s.reviewedAt = now;
  s.rejectReason = reason;
  s.decisions.push({
    at: now,
    reviewer: reviewerId,
    action: 'request_resubmit',
    reason,
  });
  s.updatedAt = now;
  return persist(s);
};

// ============================================================================
// 查询
// ============================================================================

export const getKycSubmission = (id: ID): ExtendedKycSubmission | null => {
  return submissions.get(id) ?? null;
};

export const listUserSubmissions = (userId: ID): ExtendedKycSubmission[] => {
  const out: ExtendedKycSubmission[] = [];
  for (const s of submissions.values()) {
    if (s.userId === userId) out.push(s);
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const listPendingSubmissions = (level?: KycLevel): ExtendedKycSubmission[] => {
  const out: ExtendedKycSubmission[] = [];
  for (const s of submissions.values()) {
    if (s.status === 'pending' && (level === undefined || s.level === level)) {
      out.push(s);
    }
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

/** 测试辅助：清空所有提交记录 */
export const _resetKycStore = (): void => {
  submissions.clear();
};
