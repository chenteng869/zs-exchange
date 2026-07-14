/**
 * FJN Revenue Service - 状态机
 *
 * 严格遵循 H022 §5 + H015 工业级职责规范：
 *  - 分账主表 (FjnRevenueAllocation) 状态机
 *  - 退款冲销表 (FjnRevenueReversal) 状态机
 *  - 状态转移基于白名单，禁止隐式跳转
 *  - 提供完整的工具函数（assert/canTransit/isTerminal/...）
 *
 * 设计原则：
 *  - 状态常量使用 SCREAMING_SNAKE_CASE 字符串，便于跨服务、跨语言传递
 *  - 状态机是"防御性"机制：所有变更都必须经过校验
 *  - 终态明确：reversed/cancelled 不允许再转移
 *
 * 用法：
 *   import { ALLOCATION_STATUS, canTransitAllocationStatus, assertTransitAllocationStatus } from './revenue-state-machine';
 *   if (canTransitAllocationStatus(current, next)) {
 *     // OK
 *   }
 */

import { FjnStateMachineError } from '../errors';

// ============================================================
// 1. 分账主表状态
// ============================================================

/**
 * 分账主表 (FjnRevenueAllocation) 状态
 * 与 H022 §5 + Prisma schema 中 FjnRevenueAllocation.status 字段对应
 */
export const ALLOCATION_STATUS = {
  /** 草稿/待计算 */
  PENDING: 'pending',
  /** 已计算（金额池已分） */
  CALCULATED: 'calculated',
  /** 风控审核中 */
  RISK_CHECKING: 'risk_checking',
  /** 已审核通过 */
  APPROVED: 'approved',
  /** 已结算（资金已划拨到各池） */
  SETTLED: 'settled',
  /** 已冲销（被退款反转） */
  REVERSED: 'reversed',
  /** 已取消 */
  CANCELLED: 'cancelled',
} as const;

export type FjnAllocationStatus = (typeof ALLOCATION_STATUS)[keyof typeof ALLOCATION_STATUS];

/** 所有分账状态（按流转顺序） */
export const ALL_ALLOCATION_STATUSES: readonly FjnAllocationStatus[] = [
  ALLOCATION_STATUS.PENDING,
  ALLOCATION_STATUS.CALCULATED,
  ALLOCATION_STATUS.RISK_CHECKING,
  ALLOCATION_STATUS.APPROVED,
  ALLOCATION_STATUS.SETTLED,
  ALLOCATION_STATUS.REVERSED,
  ALLOCATION_STATUS.CANCELLED,
] as const;

/** 分账终态（不可再转移） */
export const TERMINAL_ALLOCATION_STATUSES: readonly FjnAllocationStatus[] = [
  ALLOCATION_STATUS.REVERSED,
  ALLOCATION_STATUS.CANCELLED,
] as const;

/**
 * 分账状态流转表
 *
 * 流转图：
 *   pending ──> calculated ──> risk_checking ──> approved ──> settled
 *      │            │              │              │            │
 *      │            │              │              │            ▼
 *      └────────────┴──────────────┴──> cancelled  │       reversed
 *                                                    │
 *   settled ──> reversed（允许从 settled 直接冲销）   │
 *                                                    ▼
 *                                                reversed
 */
export const ALLOCATION_STATUS_TRANSITIONS: Record<FjnAllocationStatus, readonly FjnAllocationStatus[]> = {
  [ALLOCATION_STATUS.PENDING]: [
    ALLOCATION_STATUS.CALCULATED,
    ALLOCATION_STATUS.CANCELLED,
  ],
  [ALLOCATION_STATUS.CALCULATED]: [
    ALLOCATION_STATUS.RISK_CHECKING,
    ALLOCATION_STATUS.APPROVED,
    ALLOCATION_STATUS.CANCELLED,
  ],
  [ALLOCATION_STATUS.RISK_CHECKING]: [
    ALLOCATION_STATUS.APPROVED,
    ALLOCATION_STATUS.CANCELLED,
  ],
  [ALLOCATION_STATUS.APPROVED]: [
    ALLOCATION_STATUS.SETTLED,
    ALLOCATION_STATUS.REVERSED,
    ALLOCATION_STATUS.CANCELLED,
  ],
  [ALLOCATION_STATUS.SETTLED]: [
    ALLOCATION_STATUS.REVERSED,
  ],
  [ALLOCATION_STATUS.REVERSED]: [],
  [ALLOCATION_STATUS.CANCELLED]: [],
} as const;

// ============================================================
// 2. 退款冲销表状态
// ============================================================

/**
 * 冲销表 (FjnRevenueReversal) 状态
 */
export const REVERSAL_STATUS = {
  /** 已创建（待审核） */
  CREATED: 'created',
  /** 已批准 */
  APPROVED: 'approved',
  /** 已完成（负数记录已写入） */
  COMPLETED: 'completed',
  /** 已取消 */
  CANCELLED: 'cancelled',
} as const;

export type FjnReversalStatus = (typeof REVERSAL_STATUS)[keyof typeof REVERSAL_STATUS];

/** 所有冲销状态 */
export const ALL_REVERSAL_STATUSES: readonly FjnReversalStatus[] = [
  REVERSAL_STATUS.CREATED,
  REVERSAL_STATUS.APPROVED,
  REVERSAL_STATUS.COMPLETED,
  REVERSAL_STATUS.CANCELLED,
] as const;

/** 冲销终态 */
export const TERMINAL_REVERSAL_STATUSES: readonly FjnReversalStatus[] = [
  REVERSAL_STATUS.COMPLETED,
  REVERSAL_STATUS.CANCELLED,
] as const;

/**
 * 冲销状态流转表
 *
 *   created ──> approved ──> completed
 *      │           │
 *      └───────────┴──> cancelled
 */
export const REVERSAL_STATUS_TRANSITIONS: Record<FjnReversalStatus, readonly FjnReversalStatus[]> = {
  [REVERSAL_STATUS.CREATED]: [
    REVERSAL_STATUS.APPROVED,
    REVERSAL_STATUS.CANCELLED,
  ],
  [REVERSAL_STATUS.APPROVED]: [
    REVERSAL_STATUS.COMPLETED,
    REVERSAL_STATUS.CANCELLED,
  ],
  [REVERSAL_STATUS.COMPLETED]: [],
  [REVERSAL_STATUS.CANCELLED]: [],
} as const;

// ============================================================
// 3. 分账池类型（与 FJN_POOL_TYPES 对齐，但独立维护避免循环依赖）
// ============================================================

/**
 * 分账池类型 - 与 H022 §6 + Prisma schema FjnRevenueAllocationItem.poolType 对应
 */
export const REVENUE_POOLS = {
  WINE_COST_POOL: 'wine_cost_pool',
  MARKET_ECOSYSTEM_POOL: 'market_ecosystem_pool',
  COMPANY_POOL: 'company_pool',
  REFERRAL_REWARD_POOL: 'referral_reward_pool',
  TEAM_REWARD_POOL: 'team_reward_pool',
  NODE_REWARD_POOL: 'node_reward_pool',
  POINTS_INCENTIVE_POOL: 'points_incentive_pool',
  DAPPX_NFT_AI_POOL: 'dappx_nft_ai_pool',
  TREASURY_ACTIVITY_POOL: 'treasury_activity_pool',
  TAX_RESERVED_POOL: 'tax_reserved_pool',
} as const;

export type FjnRevenuePoolType = (typeof REVENUE_POOLS)[keyof typeof REVENUE_POOLS];

/**
 * Wine 369 默认分账规则（H022 §6 40/30/30）
 */
export const WINE_369_REVENUE_RULE: readonly { poolType: FjnRevenuePoolType; percentage: string }[] = [
  { poolType: REVENUE_POOLS.WINE_COST_POOL, percentage: '0.40' },
  { poolType: REVENUE_POOLS.MARKET_ECOSYSTEM_POOL, percentage: '0.30' },
  { poolType: REVENUE_POOLS.COMPANY_POOL, percentage: '0.30' },
] as const;

// ============================================================
// 4. 工具函数
// ============================================================

/** 判断分账状态是否为终态 */
export function isTerminalAllocationStatus(status: FjnAllocationStatus): boolean {
  return TERMINAL_ALLOCATION_STATUSES.includes(status);
}

/** 判断冲销状态是否为终态 */
export function isTerminalReversalStatus(status: FjnReversalStatus): boolean {
  return TERMINAL_REVERSAL_STATUSES.includes(status);
}

/** 判断分账状态转移是否合法 */
export function canTransitAllocationStatus(
  from: FjnAllocationStatus,
  to: FjnAllocationStatus
): boolean {
  return ALLOCATION_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 判断冲销状态转移是否合法 */
export function canTransitReversalStatus(
  from: FjnReversalStatus,
  to: FjnReversalStatus
): boolean {
  return REVERSAL_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 强制分账状态转移（非法时抛 FjnStateMachineError） */
export function assertTransitAllocationStatus(
  from: FjnAllocationStatus,
  to: FjnAllocationStatus
): void {
  if (!canTransitAllocationStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法分账状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: ALLOCATION_STATUS_TRANSITIONS[from] }
    );
  }
}

/** 强制冲销状态转移 */
export function assertTransitReversalStatus(
  from: FjnReversalStatus,
  to: FjnReversalStatus
): void {
  if (!canTransitReversalStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法冲销状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: REVERSAL_STATUS_TRANSITIONS[from] }
    );
  }
}

/** 获取分账可转移的下一状态列表 */
export function nextAllocationStatuses(from: FjnAllocationStatus): readonly FjnAllocationStatus[] {
  return ALLOCATION_STATUS_TRANSITIONS[from] ?? [];
}

/** 获取冲销可转移的下一状态列表 */
export function nextReversalStatuses(from: FjnReversalStatus): readonly FjnReversalStatus[] {
  return REVERSAL_STATUS_TRANSITIONS[from] ?? [];
}

/** 判断分账是否可进入风控 */
export function isRiskCheckable(status: FjnAllocationStatus): boolean {
  return status === ALLOCATION_STATUS.CALCULATED;
}

/** 判断分账是否可被审核通过 */
export function isApprovable(status: FjnAllocationStatus): boolean {
  return (
    status === ALLOCATION_STATUS.CALCULATED ||
    status === ALLOCATION_STATUS.RISK_CHECKING
  );
}

/** 判断分账是否可被冲销 */
export function isReversible(status: FjnAllocationStatus): boolean {
  return (
    status === ALLOCATION_STATUS.APPROVED ||
    status === ALLOCATION_STATUS.SETTLED
  );
}

/** 判断分账是否可被取消 */
export function isCancellableAllocation(status: FjnAllocationStatus): boolean {
  if (isTerminalAllocationStatus(status)) return false;
  return canTransitAllocationStatus(status, ALLOCATION_STATUS.CANCELLED);
}

/** 判断分账是否已结算（资金已划拨） */
export function isAllocationSettled(status: FjnAllocationStatus): boolean {
  return status === ALLOCATION_STATUS.SETTLED;
}
