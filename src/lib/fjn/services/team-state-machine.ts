/**
 * FJN Team Service - 状态机
 *
 * 严格遵循 H029 §5 + H015 工业级职责规范：
 *  - 团队奖励 (FjnTeamReward) 状态机：created | waiting_service_record | locked | risk_checking | approved | payable | paid | cancelled | recovered | risk_hold
 *  - 团队结构 (FjnTeamStructure) 状态机：active | inactive | suspended
 *  - 团队服务记录 (FjnTeamServiceRecord) 状态机：pending | approved | rejected
 *  - 状态转移基于白名单，禁止隐式跳转
 *  - 提供完整的工具函数（assert/canTransit/isTerminal/...）
 *
 * 设计原则：
 *  - 状态常量使用 SCREAMING_SNAKE_CASE 字符串
 *  - 状态机是"防御性"机制：所有变更都必须经过校验
 *  - 终态明确：paid/recovered/cancelled 不可再转移
 *  - 团队奖励 5/3/2 规则（level 1 = 5%, level 2 = 3%, level 3 = 2%）
 *
 * 用法：
 *   import { TEAM_REWARD_STATUS, canTransitTeamRewardStatus, assertTransitTeamRewardStatus } from './team-state-machine';
 */

import { FjnStateMachineError } from '../errors';

// ============================================================
// 1. 团队奖励状态
// ============================================================

/**
 * 团队奖励 (FjnTeamReward) 状态
 * 与 H029 §5 + Prisma schema 中 FjnTeamReward.status 字段对应
 *
 * 完整状态列表：created | waiting_service_record | locked | risk_checking | approved | payable | paid | cancelled | recovered | risk_hold
 */
export const TEAM_REWARD_STATUS = {
  /** 已创建 */
  CREATED: 'created',
  /** 等待服务记录提交（必须先提交服务记录才能锁定） */
  WAITING_SERVICE_RECORD: 'waiting_service_record',
  /** 已锁定（服务记录已审核通过，等待风控） */
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

export type FjnTeamRewardStatus =
  (typeof TEAM_REWARD_STATUS)[keyof typeof TEAM_REWARD_STATUS];

/** 所有团队奖励状态（按流转顺序） */
export const ALL_TEAM_REWARD_STATUSES: readonly FjnTeamRewardStatus[] = [
  TEAM_REWARD_STATUS.CREATED,
  TEAM_REWARD_STATUS.WAITING_SERVICE_RECORD,
  TEAM_REWARD_STATUS.LOCKED,
  TEAM_REWARD_STATUS.RISK_CHECKING,
  TEAM_REWARD_STATUS.APPROVED,
  TEAM_REWARD_STATUS.PAYABLE,
  TEAM_REWARD_STATUS.PAID,
  TEAM_REWARD_STATUS.RECOVERED,
  TEAM_REWARD_STATUS.CANCELLED,
  TEAM_REWARD_STATUS.RISK_HOLD,
] as const;

/** 团队奖励终态（不可再转移） */
export const TERMINAL_TEAM_REWARD_STATUSES: readonly FjnTeamRewardStatus[] = [
  TEAM_REWARD_STATUS.PAID,
  TEAM_REWARD_STATUS.RECOVERED,
  TEAM_REWARD_STATUS.CANCELLED,
] as const;

/**
 * 团队奖励状态流转表（H029 §5）
 *
 *   created → waiting_service_record → locked → risk_checking → approved → payable → paid
 *      │              │                    │           │             │          │         │
 *      │              │                    │           ├─> risk_hold─┤          │         │
 *      │              │                    │           │             │          │         │
 *      ├──────────────┴────────────────────┴───────────┴─> cancelled  │          └─────────┴──> recovered
 *                                                          │
 *                          risk_hold → approved  │
 *                          risk_hold → cancelled │
 *                          risk_hold → recovered │
 */
export const TEAM_REWARD_STATUS_TRANSITIONS: Record<
  FjnTeamRewardStatus,
  readonly FjnTeamRewardStatus[]
> = {
  [TEAM_REWARD_STATUS.CREATED]: [
    TEAM_REWARD_STATUS.WAITING_SERVICE_RECORD,
    TEAM_REWARD_STATUS.CANCELLED,
  ],
  [TEAM_REWARD_STATUS.WAITING_SERVICE_RECORD]: [
    TEAM_REWARD_STATUS.LOCKED,
    TEAM_REWARD_STATUS.RISK_CHECKING,
    TEAM_REWARD_STATUS.CANCELLED,
  ],
  [TEAM_REWARD_STATUS.LOCKED]: [
    TEAM_REWARD_STATUS.RISK_CHECKING,
    TEAM_REWARD_STATUS.APPROVED,
    TEAM_REWARD_STATUS.CANCELLED,
  ],
  [TEAM_REWARD_STATUS.RISK_CHECKING]: [
    TEAM_REWARD_STATUS.APPROVED,
    TEAM_REWARD_STATUS.PAYABLE,
    TEAM_REWARD_STATUS.CANCELLED,
    TEAM_REWARD_STATUS.RISK_HOLD,
  ],
  [TEAM_REWARD_STATUS.APPROVED]: [
    TEAM_REWARD_STATUS.PAYABLE,
    TEAM_REWARD_STATUS.CANCELLED,
    TEAM_REWARD_STATUS.RECOVERED,
  ],
  [TEAM_REWARD_STATUS.PAYABLE]: [
    TEAM_REWARD_STATUS.PAID,
    TEAM_REWARD_STATUS.RECOVERED,
  ],
  [TEAM_REWARD_STATUS.PAID]: [TEAM_REWARD_STATUS.RECOVERED],
  [TEAM_REWARD_STATUS.RECOVERED]: [],
  [TEAM_REWARD_STATUS.CANCELLED]: [],
  [TEAM_REWARD_STATUS.RISK_HOLD]: [
    TEAM_REWARD_STATUS.APPROVED,
    TEAM_REWARD_STATUS.CANCELLED,
    TEAM_REWARD_STATUS.RECOVERED,
  ],
} as const;

// ============================================================
// 2. 团队结构状态
// ============================================================

/**
 * 团队结构 (FjnTeamStructure) 状态
 * 与 Prisma schema 中 FjnTeamStructure.status 字段对应
 */
export const TEAM_STRUCTURE_STATUS = {
  /** 有效 */
  ACTIVE: 'active',
  /** 已失效 */
  INACTIVE: 'inactive',
  /** 已暂停 */
  SUSPENDED: 'suspended',
} as const;

export type FjnTeamStructureStatus =
  (typeof TEAM_STRUCTURE_STATUS)[keyof typeof TEAM_STRUCTURE_STATUS];

/** 所有团队结构状态 */
export const ALL_TEAM_STRUCTURE_STATUSES: readonly FjnTeamStructureStatus[] = [
  TEAM_STRUCTURE_STATUS.ACTIVE,
  TEAM_STRUCTURE_STATUS.INACTIVE,
  TEAM_STRUCTURE_STATUS.SUSPENDED,
] as const;

/** 团队结构流转表 */
export const TEAM_STRUCTURE_STATUS_TRANSITIONS: Record<
  FjnTeamStructureStatus,
  readonly FjnTeamStructureStatus[]
> = {
  [TEAM_STRUCTURE_STATUS.ACTIVE]: [
    TEAM_STRUCTURE_STATUS.INACTIVE,
    TEAM_STRUCTURE_STATUS.SUSPENDED,
  ],
  [TEAM_STRUCTURE_STATUS.INACTIVE]: [
    TEAM_STRUCTURE_STATUS.ACTIVE,
    TEAM_STRUCTURE_STATUS.SUSPENDED,
  ],
  [TEAM_STRUCTURE_STATUS.SUSPENDED]: [
    TEAM_STRUCTURE_STATUS.ACTIVE,
    TEAM_STRUCTURE_STATUS.INACTIVE,
  ],
} as const;

// ============================================================
// 3. 团队服务记录状态
// ============================================================

/**
 * 团队服务记录 (FjnTeamServiceRecord) 状态
 * 与 Prisma schema 中 FjnTeamServiceRecord.status 字段对应
 */
export const TEAM_SERVICE_RECORD_STATUS = {
  /** 待审核 */
  PENDING: 'pending',
  /** 已通过 */
  APPROVED: 'approved',
  /** 已拒绝 */
  REJECTED: 'rejected',
} as const;

export type FjnTeamServiceRecordStatus =
  (typeof TEAM_SERVICE_RECORD_STATUS)[keyof typeof TEAM_SERVICE_RECORD_STATUS];

/** 所有团队服务记录状态 */
export const ALL_TEAM_SERVICE_RECORD_STATUSES: readonly FjnTeamServiceRecordStatus[] = [
  TEAM_SERVICE_RECORD_STATUS.PENDING,
  TEAM_SERVICE_RECORD_STATUS.APPROVED,
  TEAM_SERVICE_RECORD_STATUS.REJECTED,
] as const;

/** 团队服务记录终态（不可再转移） */
export const TERMINAL_TEAM_SERVICE_RECORD_STATUSES: readonly FjnTeamServiceRecordStatus[] = [
  TEAM_SERVICE_RECORD_STATUS.APPROVED,
  TEAM_SERVICE_RECORD_STATUS.REJECTED,
] as const;

/** 团队服务记录流转表 */
export const TEAM_SERVICE_RECORD_STATUS_TRANSITIONS: Record<
  FjnTeamServiceRecordStatus,
  readonly FjnTeamServiceRecordStatus[]
> = {
  [TEAM_SERVICE_RECORD_STATUS.PENDING]: [
    TEAM_SERVICE_RECORD_STATUS.APPROVED,
    TEAM_SERVICE_RECORD_STATUS.REJECTED,
  ],
  [TEAM_SERVICE_RECORD_STATUS.APPROVED]: [],
  [TEAM_SERVICE_RECORD_STATUS.REJECTED]: [],
} as const;

// ============================================================
// 4. 团队层级奖励规则（5/3/2）
// ============================================================

/** 团队层级奖励比例（与 H029 §1 + decimal.ts calculateTeamRewards 一致） */
export const TEAM_REWARD_RATES = {
  /** L1 推荐人：5% */
  LEVEL_1: '0.05',
  /** L2 上上层：3% */
  LEVEL_2: '0.03',
  /** L3 上上上层：2% */
  LEVEL_3: '0.02',
} as const;

export type FjnTeamLevel = 1 | 2 | 3;

/** 团队层级对应比例 */
export const TEAM_LEVEL_RATES: Record<FjnTeamLevel, string> = {
  1: TEAM_REWARD_RATES.LEVEL_1,
  2: TEAM_REWARD_RATES.LEVEL_2,
  3: TEAM_REWARD_RATES.LEVEL_3,
};

/** 团队层级对应列名（FjnTeamStructure 中） */
export const TEAM_LEVEL_FIELD: Record<FjnTeamLevel, 'uplineLevel1' | 'uplineLevel2' | 'uplineLevel3'> = {
  1: 'uplineLevel1',
  2: 'uplineLevel2',
  3: 'uplineLevel3',
};

/** 服务类型 */
export const TEAM_SERVICE_TYPES = {
  TRAINING: 'training',
  COMMUNITY: 'community',
  AFTER_SALES: 'after_sales',
  PROMOTION: 'promotion',
  COMPLIANCE: 'compliance',
} as const;

export type FjnTeamServiceType =
  (typeof TEAM_SERVICE_TYPES)[keyof typeof TEAM_SERVICE_TYPES];

// ============================================================
// 5. 工具函数
// ============================================================

/** 判断团队奖励状态是否为终态 */
export function isTerminalTeamRewardStatus(status: FjnTeamRewardStatus): boolean {
  return TERMINAL_TEAM_REWARD_STATUSES.includes(status);
}

/** 判断团队奖励状态转移是否合法 */
export function canTransitTeamRewardStatus(
  from: FjnTeamRewardStatus,
  to: FjnTeamRewardStatus
): boolean {
  return TEAM_REWARD_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 判断团队结构状态转移是否合法 */
export function canTransitTeamStructureStatus(
  from: FjnTeamStructureStatus,
  to: FjnTeamStructureStatus
): boolean {
  return TEAM_STRUCTURE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 判断团队服务记录状态转移是否合法 */
export function canTransitTeamServiceRecordStatus(
  from: FjnTeamServiceRecordStatus,
  to: FjnTeamServiceRecordStatus
): boolean {
  return TEAM_SERVICE_RECORD_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 强制团队奖励状态转移 */
export function assertTransitTeamRewardStatus(
  from: FjnTeamRewardStatus,
  to: FjnTeamRewardStatus
): void {
  if (!canTransitTeamRewardStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法团队奖励状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: TEAM_REWARD_STATUS_TRANSITIONS[from] }
    );
  }
}

/** 强制团队结构状态转移 */
export function assertTransitTeamStructureStatus(
  from: FjnTeamStructureStatus,
  to: FjnTeamStructureStatus
): void {
  if (!canTransitTeamStructureStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法团队结构状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: TEAM_STRUCTURE_STATUS_TRANSITIONS[from] }
    );
  }
}

/** 强制团队服务记录状态转移 */
export function assertTransitTeamServiceRecordStatus(
  from: FjnTeamServiceRecordStatus,
  to: FjnTeamServiceRecordStatus
): void {
  if (!canTransitTeamServiceRecordStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法团队服务记录状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: TEAM_SERVICE_RECORD_STATUS_TRANSITIONS[from] }
    );
  }
}

/** 获取可转移的下一状态列表 */
export function nextTeamRewardStatuses(
  from: FjnTeamRewardStatus
): readonly FjnTeamRewardStatus[] {
  return TEAM_REWARD_STATUS_TRANSITIONS[from] ?? [];
}

export function nextTeamStructureStatuses(
  from: FjnTeamStructureStatus
): readonly FjnTeamStructureStatus[] {
  return TEAM_STRUCTURE_STATUS_TRANSITIONS[from] ?? [];
}

export function nextTeamServiceRecordStatuses(
  from: FjnTeamServiceRecordStatus
): readonly FjnTeamServiceRecordStatus[] {
  return TEAM_SERVICE_RECORD_STATUS_TRANSITIONS[from] ?? [];
}

/** 判断团队奖励是否等待服务记录 */
export function isWaitingServiceRecord(status: FjnTeamRewardStatus): boolean {
  return status === TEAM_REWARD_STATUS.WAITING_SERVICE_RECORD;
}

/** 判断团队奖励是否可锁定（需要 serviceRecordApproved） */
export function isLockable(status: FjnTeamRewardStatus): boolean {
  return (
    status === TEAM_REWARD_STATUS.WAITING_SERVICE_RECORD ||
    status === TEAM_REWARD_STATUS.CREATED
  );
}

/** 判断团队奖励是否可审核 */
export function isApprovableReward(status: FjnTeamRewardStatus): boolean {
  return (
    status === TEAM_REWARD_STATUS.LOCKED ||
    status === TEAM_REWARD_STATUS.RISK_CHECKING
  );
}

/** 判断团队奖励是否可转 payable */
export function isPayableReward(status: FjnTeamRewardStatus): boolean {
  return (
    status === TEAM_REWARD_STATUS.APPROVED ||
    status === TEAM_REWARD_STATUS.RISK_CHECKING
  );
}

/** 判断团队奖励是否可支付 */
export function isPayableNow(status: FjnTeamRewardStatus): boolean {
  return status === TEAM_REWARD_STATUS.PAYABLE;
}

/** 判断团队奖励是否可追回 */
export function isRecoverable(status: FjnTeamRewardStatus): boolean {
  return (
    status === TEAM_REWARD_STATUS.APPROVED ||
    status === TEAM_REWARD_STATUS.PAYABLE ||
    status === TEAM_REWARD_STATUS.PAID ||
    status === TEAM_REWARD_STATUS.RISK_HOLD
  );
}

/** 判断团队奖励是否可取消 */
export function isCancellableReward(status: FjnTeamRewardStatus): boolean {
  if (isTerminalTeamRewardStatus(status)) return false;
  return canTransitTeamRewardStatus(status, TEAM_REWARD_STATUS.CANCELLED);
}

/** 判断团队服务记录是否可审核 */
export function isServiceRecordApprovable(status: FjnTeamServiceRecordStatus): boolean {
  return status === TEAM_SERVICE_RECORD_STATUS.PENDING;
}
