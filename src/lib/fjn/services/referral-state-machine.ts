/**
 * FJN Referral Service - 状态机
 *
 * 严格遵循 H028 §5 + H015 工业级职责规范：
 *  - 推荐奖励 (FjnReferralReward) 状态机
 *  - 推荐关系 (FjnReferralRelationship) 状态机
 *  - 状态转移基于白名单，禁止隐式跳转
 *  - 提供完整的工具函数（assert/canTransit/isTerminal/...）
 *
 * 设计原则：
 *  - 状态常量使用 SCREAMING_SNAKE_CASE 字符串
 *  - 状态机是"防御性"机制：所有变更都必须经过校验
 *  - 终态明确：paid/recovered/cancelled 不可再转移
 *
 * 用法：
 *   import { REFERRAL_REWARD_STATUS, canTransitReferralRewardStatus, assertTransitReferralRewardStatus } from './referral-state-machine';
 */

import { FjnStateMachineError } from '../errors';

// ============================================================
// 1. 推荐奖励状态
// ============================================================

/**
 * 推荐奖励 (FjnReferralReward) 状态
 * 与 H028 §5 + Prisma schema 中 FjnReferralReward.status 字段对应
 */
export const REFERRAL_REWARD_STATUS = {
  /** 已创建（待锁定） */
  CREATED: 'created',
  /** 已锁定（等待风控观察期） */
  LOCKED: 'locked',
  /** 风控审核中 */
  RISK_CHECKING: 'risk_checking',
  /** 已审核通过 */
  APPROVED: 'approved',
  /** 待支付（可发放） */
  PAYABLE: 'payable',
  /** 已支付 */
  PAID: 'paid',
  /** 已追回 */
  RECOVERED: 'recovered',
  /** 已取消 */
  CANCELLED: 'cancelled',
  /** 风控冻结 */
  RISK_HOLD: 'risk_hold',
} as const;

export type FjnReferralRewardStatus =
  (typeof REFERRAL_REWARD_STATUS)[keyof typeof REFERRAL_REWARD_STATUS];

/** 所有推荐奖励状态（按流转顺序） */
export const ALL_REFERRAL_REWARD_STATUSES: readonly FjnReferralRewardStatus[] = [
  REFERRAL_REWARD_STATUS.CREATED,
  REFERRAL_REWARD_STATUS.LOCKED,
  REFERRAL_REWARD_STATUS.RISK_CHECKING,
  REFERRAL_REWARD_STATUS.APPROVED,
  REFERRAL_REWARD_STATUS.PAYABLE,
  REFERRAL_REWARD_STATUS.PAID,
  REFERRAL_REWARD_STATUS.RECOVERED,
  REFERRAL_REWARD_STATUS.CANCELLED,
  REFERRAL_REWARD_STATUS.RISK_HOLD,
] as const;

/** 推荐奖励终态（不可再转移）。
 * 注意：PAID 不是终态，仍可转移到 RECOVERED（追回）。
 */
export const TERMINAL_REFERRAL_REWARD_STATUSES: readonly FjnReferralRewardStatus[] = [
  REFERRAL_REWARD_STATUS.RECOVERED,
  REFERRAL_REWARD_STATUS.CANCELLED,
] as const;

/**
 * 推荐奖励状态流转表（H028 §5）
 *
 *   created → locked → risk_checking → approved → payable → paid
 *      │         │           │             │          │         │
 *      │         │           ├─> risk_hold─┤          │         │
 *      │         │           │             │          │         │
 *      └─────────┴───────────┴─> cancelled  │          └─────────┴──> recovered
 *                                              │
 *                          risk_hold → approved  │
 *                          risk_hold → cancelled │
 *                          risk_hold → recovered │
 */
export const REFERRAL_REWARD_STATUS_TRANSITIONS: Record<
  FjnReferralRewardStatus,
  readonly FjnReferralRewardStatus[]
> = {
  [REFERRAL_REWARD_STATUS.CREATED]: [
    REFERRAL_REWARD_STATUS.LOCKED,
    REFERRAL_REWARD_STATUS.RISK_CHECKING,
    REFERRAL_REWARD_STATUS.CANCELLED,
  ],
  [REFERRAL_REWARD_STATUS.LOCKED]: [
    REFERRAL_REWARD_STATUS.RISK_CHECKING,
    REFERRAL_REWARD_STATUS.APPROVED,
    REFERRAL_REWARD_STATUS.CANCELLED,
  ],
  [REFERRAL_REWARD_STATUS.RISK_CHECKING]: [
    REFERRAL_REWARD_STATUS.APPROVED,
    REFERRAL_REWARD_STATUS.PAYABLE,
    REFERRAL_REWARD_STATUS.CANCELLED,
    REFERRAL_REWARD_STATUS.RISK_HOLD,
  ],
  [REFERRAL_REWARD_STATUS.APPROVED]: [
    REFERRAL_REWARD_STATUS.PAYABLE,
    REFERRAL_REWARD_STATUS.CANCELLED,
    REFERRAL_REWARD_STATUS.RECOVERED,
  ],
  [REFERRAL_REWARD_STATUS.PAYABLE]: [
    REFERRAL_REWARD_STATUS.PAID,
    REFERRAL_REWARD_STATUS.RECOVERED,
  ],
  [REFERRAL_REWARD_STATUS.PAID]: [REFERRAL_REWARD_STATUS.RECOVERED],
  [REFERRAL_REWARD_STATUS.RECOVERED]: [],
  [REFERRAL_REWARD_STATUS.CANCELLED]: [],
  [REFERRAL_REWARD_STATUS.RISK_HOLD]: [
    REFERRAL_REWARD_STATUS.APPROVED,
    REFERRAL_REWARD_STATUS.CANCELLED,
    REFERRAL_REWARD_STATUS.RECOVERED,
  ],
} as const;

// ============================================================
// 2. 推荐关系状态
// ============================================================

/**
 * 推荐关系 (FjnReferralRelationship) 状态
 * 与 Prisma schema 中 FjnReferralRelationship.status 字段对应
 */
export const REFERRAL_BINDING_STATUS = {
  /** 有效 */
  ACTIVE: 'active',
  /** 已失效（如推荐人 KYC 失效） */
  INVALID: 'invalid',
  /** 已转移 */
  TRANSFERRED: 'transferred',
  /** 已取消 */
  CANCELLED: 'cancelled',
} as const;

export type FjnReferralBindingStatus =
  (typeof REFERRAL_BINDING_STATUS)[keyof typeof REFERRAL_BINDING_STATUS];

/** 所有推荐关系状态 */
export const ALL_REFERRAL_BINDING_STATUSES: readonly FjnReferralBindingStatus[] = [
  REFERRAL_BINDING_STATUS.ACTIVE,
  REFERRAL_BINDING_STATUS.INVALID,
  REFERRAL_BINDING_STATUS.TRANSFERRED,
  REFERRAL_BINDING_STATUS.CANCELLED,
] as const;

/** 推荐关系流转表 */
export const REFERRAL_BINDING_STATUS_TRANSITIONS: Record<
  FjnReferralBindingStatus,
  readonly FjnReferralBindingStatus[]
> = {
  [REFERRAL_BINDING_STATUS.ACTIVE]: [
    REFERRAL_BINDING_STATUS.INVALID,
    REFERRAL_BINDING_STATUS.TRANSFERRED,
    REFERRAL_BINDING_STATUS.CANCELLED,
  ],
  [REFERRAL_BINDING_STATUS.INVALID]: [
    REFERRAL_BINDING_STATUS.ACTIVE,
    REFERRAL_BINDING_STATUS.CANCELLED,
  ],
  [REFERRAL_BINDING_STATUS.TRANSFERRED]: [],
  [REFERRAL_BINDING_STATUS.CANCELLED]: [],
} as const;

// ============================================================
// 3. 工具函数
// ============================================================

/** 判断推荐奖励状态是否为终态 */
export function isTerminalReferralRewardStatus(status: FjnReferralRewardStatus): boolean {
  return TERMINAL_REFERRAL_REWARD_STATUSES.includes(status);
}

/** 判断推荐奖励状态转移是否合法 */
export function canTransitReferralRewardStatus(
  from: FjnReferralRewardStatus,
  to: FjnReferralRewardStatus
): boolean {
  return REFERRAL_REWARD_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 判断推荐关系状态转移是否合法 */
export function canTransitReferralBindingStatus(
  from: FjnReferralBindingStatus,
  to: FjnReferralBindingStatus
): boolean {
  return REFERRAL_BINDING_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 强制推荐奖励状态转移 */
export function assertTransitReferralRewardStatus(
  from: FjnReferralRewardStatus,
  to: FjnReferralRewardStatus
): void {
  if (!canTransitReferralRewardStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法推荐奖励状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: REFERRAL_REWARD_STATUS_TRANSITIONS[from] }
    );
  }
}

/** 强制推荐关系状态转移 */
export function assertTransitReferralBindingStatus(
  from: FjnReferralBindingStatus,
  to: FjnReferralBindingStatus
): void {
  if (!canTransitReferralBindingStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法推荐关系状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: REFERRAL_BINDING_STATUS_TRANSITIONS[from] }
    );
  }
}

/** 获取可转移的下一状态列表 */
export function nextReferralRewardStatuses(
  from: FjnReferralRewardStatus
): readonly FjnReferralRewardStatus[] {
  return REFERRAL_REWARD_STATUS_TRANSITIONS[from] ?? [];
}

/** 判断推荐奖励是否可锁定 */
export function isLockable(status: FjnReferralRewardStatus): boolean {
  return status === REFERRAL_REWARD_STATUS.CREATED;
}

/** 判断推荐奖励是否可审核 */
export function isApprovableReward(status: FjnReferralRewardStatus): boolean {
  return (
    status === REFERRAL_REWARD_STATUS.LOCKED ||
    status === REFERRAL_REWARD_STATUS.RISK_CHECKING
  );
}

/** 判断推荐奖励是否可转 payable */
export function isPayableReward(status: FjnReferralRewardStatus): boolean {
  return (
    status === REFERRAL_REWARD_STATUS.APPROVED ||
    status === REFERRAL_REWARD_STATUS.RISK_CHECKING
  );
}

/** 判断推荐奖励是否可支付 */
export function isPayableNow(status: FjnReferralRewardStatus): boolean {
  return status === REFERRAL_REWARD_STATUS.PAYABLE;
}

/** 判断推荐奖励是否可追回 */
export function isRecoverable(status: FjnReferralRewardStatus): boolean {
  return (
    status === REFERRAL_REWARD_STATUS.APPROVED ||
    status === REFERRAL_REWARD_STATUS.PAYABLE ||
    status === REFERRAL_REWARD_STATUS.PAID ||
    status === REFERRAL_REWARD_STATUS.RISK_HOLD
  );
}

/** 判断推荐奖励是否可取消 */
export function isCancellableReward(status: FjnReferralRewardStatus): boolean {
  if (isTerminalReferralRewardStatus(status)) return false;
  return canTransitReferralRewardStatus(status, REFERRAL_REWARD_STATUS.CANCELLED);
}

/** 计算 lockUntil 时间（基于 lockDays） */
export function calculateLockUntil(lockDays: number, baseTime: Date = new Date()): Date {
  const result = new Date(baseTime);
  result.setDate(result.getDate() + lockDays);
  return result;
}

/** 判断是否已过 lock 期限 */
export function isLockExpired(lockedAt: Date | null, lockDays: number, now: Date = new Date()): boolean {
  if (!lockedAt) return false;
  const lockUntil = calculateLockUntil(lockDays, lockedAt);
  return now >= lockUntil;
}
