/**
 * FJN Payment Service - 状态机
 *
 * 严格遵循 H021 §7 + 工业级补强：
 *  - 支付单状态转移基于白名单
 *  - 退款单状态机独立
 *  - 状态变更必须记录 PaymentStatusLog（与 Order 一致；H020 §13）
 *  - 任何状态变更必须产生 outbox 事件（H042）
 *
 * 支付单状态机（H021）：
 *  created → pending | processing | expired | failed
 *  pending → processing | success | expired | failed | manual_review
 *  processing → success | failed | manual_review
 *  manual_review → success | failed
 *  success → (终态)
 *  failed → (终态)
 *  expired → (终态)
 *
 * 退款单状态机（H021）：
 *  requested → reviewing | approved | rejected
 *  reviewing → approved | rejected
 *  approved → processing
 *  processing → refunded | failed
 *  rejected → (终态)
 *  refunded → (终态)
 *  failed → (终态)
 *
 * 工业级补强（H5 / H6 / H022）：
 *  - 增加 partial_refunded 状态
 *  - 增加 refunded 状态
 *  - 提供 canTransit / assertTransit / isTerminal 工具
 */

import { FjnStateMachineError } from '../errors';

// ============================================================
// 支付单状态常量
// ============================================================

export const PAYMENT_STATUS = {
  CREATED: 'created',                 // 已创建（未发起）
  PENDING: 'pending',                 // 待支付
  PROCESSING: 'processing',           // 支付处理中
  SUCCESS: 'success',                 // 支付成功
  FAILED: 'failed',                   // 支付失败
  EXPIRED: 'expired',                 // 已过期
  MANUAL_REVIEW: 'manual_review',     // 人工审核
  REFUNDING: 'refunding',             // 退款中
  PARTIAL_REFUNDED: 'partial_refunded', // 部分退款
  REFUNDED: 'refunded',               // 已退款
  CANCELLED: 'cancelled',             // 已取消
} as const;

export type FjnPaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

/** 支付单状态合法转移表（H021 §7 + 工业级补强） */
export const PAYMENT_STATUS_TRANSITIONS: Record<FjnPaymentStatus, readonly FjnPaymentStatus[]> = {
  [PAYMENT_STATUS.CREATED]:        [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING, PAYMENT_STATUS.EXPIRED, PAYMENT_STATUS.FAILED, PAYMENT_STATUS.CANCELLED],
  [PAYMENT_STATUS.PENDING]:        [PAYMENT_STATUS.PROCESSING, PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.EXPIRED, PAYMENT_STATUS.FAILED, PAYMENT_STATUS.MANUAL_REVIEW, PAYMENT_STATUS.CANCELLED],
  [PAYMENT_STATUS.PROCESSING]:     [PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.FAILED, PAYMENT_STATUS.MANUAL_REVIEW, PAYMENT_STATUS.REFUNDING],
  [PAYMENT_STATUS.MANUAL_REVIEW]:  [PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.FAILED],
  [PAYMENT_STATUS.SUCCESS]:        [PAYMENT_STATUS.REFUNDING, PAYMENT_STATUS.PARTIAL_REFUNDED, PAYMENT_STATUS.REFUNDED],
  [PAYMENT_STATUS.REFUNDING]:      [PAYMENT_STATUS.PARTIAL_REFUNDED, PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.FAILED],
  [PAYMENT_STATUS.PARTIAL_REFUNDED]: [PAYMENT_STATUS.REFUNDED],
  [PAYMENT_STATUS.REFUNDED]:       [],
  [PAYMENT_STATUS.FAILED]:         [],
  [PAYMENT_STATUS.EXPIRED]:        [],
  [PAYMENT_STATUS.CANCELLED]:      [],
} as const;

// ============================================================
// 退款单状态常量
// ============================================================

export const REFUND_STATUS = {
  REQUESTED: 'requested',       // 已申请
  REVIEWING: 'reviewing',       // 审核中
  APPROVED: 'approved',         // 已批准
  REJECTED: 'rejected',         // 已拒绝
  PROCESSING: 'processing',     // 退款处理中
  REFUNDED: 'refunded',         // 已退款
  FAILED: 'failed',             // 失败
} as const;

export type FjnRefundStatus = (typeof REFUND_STATUS)[keyof typeof REFUND_STATUS];

/** 退款单状态合法转移表（H021 §7 + 工业级补强） */
export const REFUND_STATUS_TRANSITIONS: Record<FjnRefundStatus, readonly FjnRefundStatus[]> = {
  [REFUND_STATUS.REQUESTED]:    [REFUND_STATUS.REVIEWING, REFUND_STATUS.APPROVED, REFUND_STATUS.REJECTED],
  [REFUND_STATUS.REVIEWING]:    [REFUND_STATUS.APPROVED, REFUND_STATUS.REJECTED],
  [REFUND_STATUS.APPROVED]:     [REFUND_STATUS.PROCESSING, REFUND_STATUS.FAILED],
  [REFUND_STATUS.PROCESSING]:   [REFUND_STATUS.REFUNDED, REFUND_STATUS.FAILED],
  [REFUND_STATUS.REFUNDED]:     [],
  [REFUND_STATUS.REJECTED]:     [],
  [REFUND_STATUS.FAILED]:       [],
} as const;

// ============================================================
// 支付方式常量
// ============================================================

export const PAYMENT_METHODS = {
  USDT: 'usdt',
  BANK_CARD: 'bank_card',
  CREDIT_CARD: 'credit_card',
  THIRD_PARTY: 'third_party',
  PLATFORM_BALANCE: 'platform_balance',
  FJ369_TOKEN: 'fj369_token',
  TFJ369: 'tfj369',
  DAPPX_CREDIT: 'dappx_credit',
  MANUAL: 'manual',
  CHAIN_NATIVE: 'chain_native', // 链上原生币
} as const;

export type FjnPaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

/** 链类型 */
export const CHAIN_TYPES = {
  SOLANA: 'solana',
  ETH: 'eth',
  BSC: 'bsc',
  POLYGON: 'polygon',
  ARBITRUM: 'arbitrum',
  BASE: 'base',
} as const;

export type FjnChainType = (typeof CHAIN_TYPES)[keyof typeof CHAIN_TYPES];

// ============================================================
// 支付提供者（用于回调）
// ============================================================

export const PAYMENT_PROVIDERS = {
  STRIPE: 'stripe',
  ADYEN: 'adyen',
  COINBASE: 'coinbase',
  NOWPAYMENTS: 'nowpayments',
  PLAID: 'plaid',
  MANUAL: 'manual',
  INTERNAL: 'internal', // 内部资产支付（FJ369_TOKEN/TFJ369 等）
} as const;

export type FjnPaymentProvider = (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];

// ============================================================
// 退款类型
// ============================================================

export const REFUND_TYPES = {
  FULL: 'full',
  PARTIAL: 'partial',
} as const;

export type FjnRefundType = (typeof REFUND_TYPES)[keyof typeof REFUND_TYPES];

/** 退款调整类型（与 FjnRefundAdjustment 字段对应） */
export const REFUND_ADJUSTMENT_TYPES = {
  REVENUE_REVERSE: 'revenue_reverse',
  TAX_REVERSE: 'tax_reverse',
  POINTS_REVOKE: 'points_revoke',
  NFT_FREEZE: 'nft_freeze',
  POWER_REVOKE: 'power_revoke',
  REFERRAL_CANCEL: 'referral_cancel',
  TEAM_CANCEL: 'team_cancel',
  NODE_CANCEL: 'node_cancel',
} as const;

export type FjnRefundAdjustmentType = (typeof REFUND_ADJUSTMENT_TYPES)[keyof typeof REFUND_ADJUSTMENT_TYPES];

// ============================================================
// 状态机工具函数
// ============================================================

/** 支付单状态枚举值数组 */
export const ALL_PAYMENT_STATUSES: readonly FjnPaymentStatus[] = Object.values(PAYMENT_STATUS);

/** 退款单状态枚举值数组 */
export const ALL_REFUND_STATUSES: readonly FjnRefundStatus[] = Object.values(REFUND_STATUS);

/** 支付单终态集合 */
export const TERMINAL_PAYMENT_STATUSES: readonly FjnPaymentStatus[] = [
  PAYMENT_STATUS.FAILED,
  PAYMENT_STATUS.EXPIRED,
  PAYMENT_STATUS.REFUNDED,
  PAYMENT_STATUS.CANCELLED,
];

/** 退款单终态集合 */
export const TERMINAL_REFUND_STATUSES: readonly FjnRefundStatus[] = [
  REFUND_STATUS.REFUNDED,
  REFUND_STATUS.REJECTED,
  REFUND_STATUS.FAILED,
];

/** 判断支付单是否处于终态 */
export function isTerminalPaymentStatus(status: FjnPaymentStatus): boolean {
  return TERMINAL_PAYMENT_STATUSES.includes(status);
}

/** 判断退款单是否处于终态 */
export function isTerminalRefundStatus(status: FjnRefundStatus): boolean {
  return TERMINAL_REFUND_STATUSES.includes(status);
}

/** 判断支付单状态转移是否合法 */
export function canTransitPaymentStatus(
  from: FjnPaymentStatus,
  to: FjnPaymentStatus
): boolean {
  if (from === to) return true;
  return PAYMENT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 强制支付单状态转移 */
export function assertTransitPaymentStatus(
  from: FjnPaymentStatus,
  to: FjnPaymentStatus
): void {
  if (!canTransitPaymentStatus(from, to)) {
    throw new FjnStateMachineError(
      `支付单状态非法转移: ${from} -> ${to}`,
      {
        from,
        to,
        allowed: PAYMENT_STATUS_TRANSITIONS[from] ?? [],
      }
    );
  }
}

/** 列出支付单某状态所有合法目标 */
export function nextPaymentStatuses(from: FjnPaymentStatus): readonly FjnPaymentStatus[] {
  return PAYMENT_STATUS_TRANSITIONS[from] ?? [];
}

/** 判断退款单状态转移是否合法 */
export function canTransitRefundStatus(
  from: FjnRefundStatus,
  to: FjnRefundStatus
): boolean {
  if (from === to) return true;
  return REFUND_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 强制退款单状态转移 */
export function assertTransitRefundStatus(
  from: FjnRefundStatus,
  to: FjnRefundStatus
): void {
  if (!canTransitRefundStatus(from, to)) {
    throw new FjnStateMachineError(
      `退款单状态非法转移: ${from} -> ${to}`,
      {
        from,
        to,
        allowed: REFUND_STATUS_TRANSITIONS[from] ?? [],
      }
    );
  }
}

/** 列出退款单某状态所有合法目标 */
export function nextRefundStatuses(from: FjnRefundStatus): readonly FjnRefundStatus[] {
  return REFUND_STATUS_TRANSITIONS[from] ?? [];
}

/** 判断支付单是否可被成功 */
export function isPayablePayment(status: FjnPaymentStatus): boolean {
  if (isTerminalPaymentStatus(status)) return false;
  if (status === PAYMENT_STATUS.SUCCESS) return false;
  if (status === PAYMENT_STATUS.PROCESSING) return false;
  if (status === PAYMENT_STATUS.REFUNDING) return false;
  if (status === PAYMENT_STATUS.PARTIAL_REFUNDED) return false;
  if (status === PAYMENT_STATUS.REFUNDED) return false;
  return canTransitPaymentStatus(status, PAYMENT_STATUS.SUCCESS);
}

/** 判断支付单是否已成功 */
export function isPaymentSucceeded(status: FjnPaymentStatus): boolean {
  return (
    status === PAYMENT_STATUS.SUCCESS ||
    status === PAYMENT_STATUS.PARTIAL_REFUNDED ||
    status === PAYMENT_STATUS.REFUNDED
  );
}

/** 判断支付单是否可退款 */
export function isRefundablePayment(status: FjnPaymentStatus): boolean {
  return status === PAYMENT_STATUS.SUCCESS || status === PAYMENT_STATUS.PARTIAL_REFUNDED;
}
