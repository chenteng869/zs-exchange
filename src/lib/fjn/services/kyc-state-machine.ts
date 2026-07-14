/**
 * FJN KYC Service - 状态机
 *
 * 严格遵循 H018 §5 规范：
 *  - 个人 KYC (FjnUserKyc) 状态机
 *  - 企业 KYB (FjnUserKyb) 状态机（与 KYC 共享相同状态机）
 *  - 状态机基于白名单，禁止隐式跳转
 *  - 状态常量使用 SCREAMING_SNAKE_CASE
 *  - 终态明确：approved 不可再转移（除非 expired），rejected 可重新提交
 *
 * 完整状态机（与 H018 §5 一致）：
 *
 *  not_submitted  → pending
 *  pending        → approved | rejected | manual_review
 *  manual_review  → approved | rejected
 *  approved       → expired
 *  rejected       → pending
 *  expired        → pending
 *
 * 用法：
 *   import { KYC_STATUS, canTransitKycStatus, assertTransitKycStatus } from './kyc-state-machine';
 */

import { FjnStateMachineError } from '../errors';

// ============================================================
// 1. KYC / KYB 状态常量
// ============================================================

/** KYC / KYB 共享状态机 */
export const KYC_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  MANUAL_REVIEW: 'manual_review',
} as const;

export type FjnKycStatus = (typeof KYC_STATUS)[keyof typeof KYC_STATUS];

export const ALL_KYC_STATUSES: readonly FjnKycStatus[] = [
  KYC_STATUS.NOT_SUBMITTED,
  KYC_STATUS.PENDING,
  KYC_STATUS.APPROVED,
  KYC_STATUS.REJECTED,
  KYC_STATUS.EXPIRED,
  KYC_STATUS.MANUAL_REVIEW,
] as const;

/** 终态（不可再转移） */
export const TERMINAL_KYC_STATUSES: readonly FjnKycStatus[] = [
  // 注意：approved 不是绝对终态，可以 expired
  // rejected 不是绝对终态，可以重新 pending
  // expired 可以重新 pending
  // 因此技术上没有绝对终态；但这里保留枚举用于工具函数
] as const;

/** 有效状态（数据库实际存储的合法值） */
export const VALID_KYC_DB_STATUSES: readonly FjnKycStatus[] = [
  KYC_STATUS.PENDING,
  KYC_STATUS.APPROVED,
  KYC_STATUS.REJECTED,
  KYC_STATUS.EXPIRED,
  KYC_STATUS.MANUAL_REVIEW,
] as const;

/** 状态机流转表（H018 §5） */
export const KYC_STATUS_TRANSITIONS: Record<FjnKycStatus, readonly FjnKycStatus[]> = {
  [KYC_STATUS.NOT_SUBMITTED]: [KYC_STATUS.PENDING],
  [KYC_STATUS.PENDING]: [
    KYC_STATUS.APPROVED,
    KYC_STATUS.REJECTED,
    KYC_STATUS.MANUAL_REVIEW,
  ],
  [KYC_STATUS.MANUAL_REVIEW]: [
    KYC_STATUS.APPROVED,
    KYC_STATUS.REJECTED,
  ],
  [KYC_STATUS.APPROVED]: [KYC_STATUS.EXPIRED],
  [KYC_STATUS.REJECTED]: [KYC_STATUS.PENDING],
  [KYC_STATUS.EXPIRED]: [KYC_STATUS.PENDING],
} as const;

// ============================================================
// 2. KYC 级别
// ============================================================

export const KYC_LEVEL = {
  STANDARD: 'standard',
  ENHANCED: 'enhanced',
  INSTITUTIONAL: 'institutional',
} as const;

export type FjnKycLevel = (typeof KYC_LEVEL)[keyof typeof KYC_LEVEL];

export const ALL_KYC_LEVELS: readonly FjnKycLevel[] = Object.values(KYC_LEVEL);

// ============================================================
// 3. 证件类型
// ============================================================

export const KYC_DOCUMENT_TYPE = {
  PASSPORT: 'passport',
  ID_CARD: 'id_card',
  DRIVER_LICENSE: 'driver_license',
  RESIDENCE_PERMIT: 'residence_permit',
} as const;

export type FjnKycDocumentType =
  (typeof KYC_DOCUMENT_TYPE)[keyof typeof KYC_DOCUMENT_TYPE];

export const ALL_KYC_DOCUMENT_TYPES: readonly FjnKycDocumentType[] =
  Object.values(KYC_DOCUMENT_TYPE);

// ============================================================
// 4. KYC 风险等级
// ============================================================

export const KYC_RISK_STATUS = {
  NORMAL: 'normal',
  WARNING: 'warning',
  HIGH: 'high',
  BLOCKED: 'blocked',
} as const;

export type FjnKycRiskStatus =
  (typeof KYC_RISK_STATUS)[keyof typeof KYC_RISK_STATUS];

export const ALL_KYC_RISK_STATUSES: readonly FjnKycRiskStatus[] =
  Object.values(KYC_RISK_STATUS);

// ============================================================
// 5. KYC 提供方
// ============================================================

export const KYC_PROVIDER = {
  ONFIDO: 'onfido',
  SUMSUB: 'sumsub',
  JUMIO: 'jumio',
  MANUAL: 'manual',
  INTERNAL: 'internal',
} as const;

export type FjnKycProvider = (typeof KYC_PROVIDER)[keyof typeof KYC_PROVIDER];

export const ALL_KYC_PROVIDERS: readonly FjnKycProvider[] =
  Object.values(KYC_PROVIDER);

// ============================================================
// 6. 工具函数
// ============================================================

/** 判断状态是否合法 */
export function isValidKycStatus(s: string): s is FjnKycStatus {
  return (ALL_KYC_STATUSES as readonly string[]).includes(s);
}

/** 判断状态是否可入库 */
export function isValidKycDbStatus(s: string): s is FjnKycStatus {
  return (VALID_KYC_DB_STATUSES as readonly string[]).includes(s);
}

/** 判断是否终态（不可再转移） */
export function isTerminalKycStatus(s: FjnKycStatus): boolean {
  return TERMINAL_KYC_STATUSES.includes(s);
}

/** 判断是否可转移 */
export function canTransitKycStatus(
  from: FjnKycStatus,
  to: FjnKycStatus,
): boolean {
  return KYC_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 强制可转移（失败抛 FjnStateMachineError） */
export function assertTransitKycStatus(
  from: FjnKycStatus,
  to: FjnKycStatus,
): void {
  if (!canTransitKycStatus(from, to)) {
    throw new FjnStateMachineError(`非法 KYC 状态转移: ${from} -> ${to}`, {
      from,
      to,
      allowedNext: KYC_STATUS_TRANSITIONS[from],
    });
  }
}

/** 下一个合法状态集合 */
export function nextKycStatuses(
  from: FjnKycStatus,
): readonly FjnKycStatus[] {
  return KYC_STATUS_TRANSITIONS[from] ?? [];
}

/** 可审核（pending / manual_review） */
export function isKycReviewable(s: FjnKycStatus): boolean {
  return s === KYC_STATUS.PENDING || s === KYC_STATUS.MANUAL_REVIEW;
}

/** 可通过 */
export function isKycApprovable(s: FjnKycStatus): boolean {
  return s === KYC_STATUS.PENDING || s === KYC_STATUS.MANUAL_REVIEW;
}

/** 可拒绝 */
export function isKycRejectable(s: FjnKycStatus): boolean {
  return s === KYC_STATUS.PENDING || s === KYC_STATUS.MANUAL_REVIEW;
}

/** 可转人工复核 */
export function isKycManualReviewable(s: FjnKycStatus): boolean {
  return s === KYC_STATUS.PENDING;
}

/** 可重新提交（rejected / expired） */
export function isKycResubmittable(s: FjnKycStatus): boolean {
  return s === KYC_STATUS.REJECTED || s === KYC_STATUS.EXPIRED;
}

/** 判断 ISO 3166-1 alpha-2 国家代码是否合法 */
export function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}
