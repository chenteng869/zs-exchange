/**
 * FJN Node Service - 状态机
 *
 * 严格遵循 H030 设计规范 + 现有 FjnNode schema 字段 + H015 工业级职责：
 *  - 节点 (FjnNode) 状态机：pending_review | approved | active | restricted | suspended | terminated | blacklisted
 *  - 节点奖励 (FjnNodeReward) 状态机：created | waiting_service_record | locked | risk_checking | approved | payable | paid | cancelled | recovered | risk_hold
 *  - 节点服务记录 (FjnNodeServiceRecord) 状态机：pending | approved | rejected
 *  - 节点 KYB 状态机：not_submitted | submitted | approved | rejected
 *  - 状态转移基于白名单，禁止隐式跳转
 *
 * 设计原则：
 *  - 状态常量使用 SCREAMING_SNAKE_CASE 字符串
 *  - 状态机是"防御性"机制：所有变更都必须经过校验
 *  - 终态明确：paid/recovered/cancelled/terminated/blacklisted 不可再转移
 *  - 节点奖励规则 3/3/2/2（city=3%, regional=3%, national=2%, global=2%）
 *  - 战略节点 (strategic) 不参与订单奖励分润
 *
 * 用法：
 *   import { NODE_REWARD_STATUS, canTransitNodeRewardStatus, assertTransitNodeRewardStatus } from './node-state-machine';
 */

import { FjnStateMachineError } from '../errors';

// ============================================================
// 1. 节点状态（运营）
// ============================================================

/**
 * 节点 (FjnNode) 运营状态
 * 与 Prisma schema 中 FjnNode.status 字段对应
 */
export const NODE_STATUS = {
  /** 待审核 */
  PENDING_REVIEW: 'pending_review',
  /** 已审核通过（待激活） */
  APPROVED: 'approved',
  /** 运营中（正常） */
  ACTIVE: 'active',
  /** 受限（部分功能被限制） */
  RESTRICTED: 'restricted',
  /** 已暂停 */
  SUSPENDED: 'suspended',
  /** 已终止 */
  TERMINATED: 'terminated',
  /** 黑名单 */
  BLACKLISTED: 'blacklisted',
} as const;

export type FjnNodeStatus = (typeof NODE_STATUS)[keyof typeof NODE_STATUS];

/** 所有节点状态（按流转顺序） */
export const ALL_NODE_STATUSES: readonly FjnNodeStatus[] = [
  NODE_STATUS.PENDING_REVIEW,
  NODE_STATUS.APPROVED,
  NODE_STATUS.ACTIVE,
  NODE_STATUS.RESTRICTED,
  NODE_STATUS.SUSPENDED,
  NODE_STATUS.TERMINATED,
  NODE_STATUS.BLACKLISTED,
] as const;

/** 节点终态（不可再转移） */
export const TERMINAL_NODE_STATUSES: readonly FjnNodeStatus[] = [
  NODE_STATUS.TERMINATED,
  NODE_STATUS.BLACKLISTED,
] as const;

/**
 * 节点状态流转表
 *
 *   pending_review → approved → active → restricted/suspended → terminated/blacklisted
 *                      │           │           │
 *                      │           └───────────┴─> restricted
 *                      │           │
 *                      └───────────┴─> suspended
 */
export const NODE_STATUS_TRANSITIONS: Record<
  FjnNodeStatus,
  readonly FjnNodeStatus[]
> = {
  [NODE_STATUS.PENDING_REVIEW]: [
    NODE_STATUS.APPROVED,
    NODE_STATUS.BLACKLISTED,
  ],
  [NODE_STATUS.APPROVED]: [
    NODE_STATUS.ACTIVE,
    NODE_STATUS.SUSPENDED,
    NODE_STATUS.BLACKLISTED,
  ],
  [NODE_STATUS.ACTIVE]: [
    NODE_STATUS.RESTRICTED,
    NODE_STATUS.SUSPENDED,
    NODE_STATUS.TERMINATED,
    NODE_STATUS.BLACKLISTED,
  ],
  [NODE_STATUS.RESTRICTED]: [
    NODE_STATUS.ACTIVE,
    NODE_STATUS.SUSPENDED,
    NODE_STATUS.TERMINATED,
    NODE_STATUS.BLACKLISTED,
  ],
  [NODE_STATUS.SUSPENDED]: [
    NODE_STATUS.ACTIVE,
    NODE_STATUS.RESTRICTED,
    NODE_STATUS.TERMINATED,
    NODE_STATUS.BLACKLISTED,
  ],
  [NODE_STATUS.TERMINATED]: [],
  [NODE_STATUS.BLACKLISTED]: [],
} as const;

// ============================================================
// 2. 节点 KYB 状态
// ============================================================

/**
 * 节点 KYB (Know Your Business) 状态
 * 与 Prisma schema 中 FjnNode.kybStatus 字段对应
 */
export const NODE_KYB_STATUS = {
  /** 未提交 */
  NOT_SUBMITTED: 'not_submitted',
  /** 已提交 */
  SUBMITTED: 'submitted',
  /** 已通过 */
  APPROVED: 'approved',
  /** 已拒绝 */
  REJECTED: 'rejected',
} as const;

export type FjnNodeKybStatus =
  (typeof NODE_KYB_STATUS)[keyof typeof NODE_KYB_STATUS];

/** 所有 KYB 状态 */
export const ALL_NODE_KYB_STATUSES: readonly FjnNodeKybStatus[] = [
  NODE_KYB_STATUS.NOT_SUBMITTED,
  NODE_KYB_STATUS.SUBMITTED,
  NODE_KYB_STATUS.APPROVED,
  NODE_KYB_STATUS.REJECTED,
] as const;

/** KYB 终态 */
export const TERMINAL_NODE_KYB_STATUSES: readonly FjnNodeKybStatus[] = [
  NODE_KYB_STATUS.APPROVED,
  NODE_KYB_STATUS.REJECTED,
] as const;

/** KYB 流转表 */
export const NODE_KYB_STATUS_TRANSITIONS: Record<
  FjnNodeKybStatus,
  readonly FjnNodeKybStatus[]
> = {
  [NODE_KYB_STATUS.NOT_SUBMITTED]: [NODE_KYB_STATUS.SUBMITTED],
  [NODE_KYB_STATUS.SUBMITTED]: [
    NODE_KYB_STATUS.APPROVED,
    NODE_KYB_STATUS.REJECTED,
  ],
  [NODE_KYB_STATUS.APPROVED]: [NODE_KYB_STATUS.SUBMITTED], // 重新提交
  [NODE_KYB_STATUS.REJECTED]: [NODE_KYB_STATUS.SUBMITTED], // 重新提交
} as const;

// ============================================================
// 3. 节点奖励状态
// ============================================================

/**
 * 节点奖励 (FjnNodeReward) 状态
 * 与 Prisma schema 中 FjnNodeReward.status 字段对应
 */
export const NODE_REWARD_STATUS = {
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

export type FjnNodeRewardStatus =
  (typeof NODE_REWARD_STATUS)[keyof typeof NODE_REWARD_STATUS];

/** 所有节点奖励状态（按流转顺序） */
export const ALL_NODE_REWARD_STATUSES: readonly FjnNodeRewardStatus[] = [
  NODE_REWARD_STATUS.CREATED,
  NODE_REWARD_STATUS.WAITING_SERVICE_RECORD,
  NODE_REWARD_STATUS.LOCKED,
  NODE_REWARD_STATUS.RISK_CHECKING,
  NODE_REWARD_STATUS.APPROVED,
  NODE_REWARD_STATUS.PAYABLE,
  NODE_REWARD_STATUS.PAID,
  NODE_REWARD_STATUS.RECOVERED,
  NODE_REWARD_STATUS.CANCELLED,
  NODE_REWARD_STATUS.RISK_HOLD,
] as const;

/** 节点奖励终态 */
export const TERMINAL_NODE_REWARD_STATUSES: readonly FjnNodeRewardStatus[] = [
  NODE_REWARD_STATUS.PAID,
  NODE_REWARD_STATUS.RECOVERED,
  NODE_REWARD_STATUS.CANCELLED,
] as const;

/**
 * 节点奖励状态流转表
 * 流转规则与团队奖励相同，但属于节点域
 */
export const NODE_REWARD_STATUS_TRANSITIONS: Record<
  FjnNodeRewardStatus,
  readonly FjnNodeRewardStatus[]
> = {
  [NODE_REWARD_STATUS.CREATED]: [
    NODE_REWARD_STATUS.WAITING_SERVICE_RECORD,
    NODE_REWARD_STATUS.CANCELLED,
  ],
  [NODE_REWARD_STATUS.WAITING_SERVICE_RECORD]: [
    NODE_REWARD_STATUS.LOCKED,
    NODE_REWARD_STATUS.RISK_CHECKING,
    NODE_REWARD_STATUS.CANCELLED,
  ],
  [NODE_REWARD_STATUS.LOCKED]: [
    NODE_REWARD_STATUS.RISK_CHECKING,
    NODE_REWARD_STATUS.APPROVED,
    NODE_REWARD_STATUS.CANCELLED,
  ],
  [NODE_REWARD_STATUS.RISK_CHECKING]: [
    NODE_REWARD_STATUS.APPROVED,
    NODE_REWARD_STATUS.PAYABLE,
    NODE_REWARD_STATUS.CANCELLED,
    NODE_REWARD_STATUS.RISK_HOLD,
  ],
  [NODE_REWARD_STATUS.APPROVED]: [
    NODE_REWARD_STATUS.PAYABLE,
    NODE_REWARD_STATUS.CANCELLED,
    NODE_REWARD_STATUS.RECOVERED,
  ],
  [NODE_REWARD_STATUS.PAYABLE]: [
    NODE_REWARD_STATUS.PAID,
    NODE_REWARD_STATUS.RECOVERED,
  ],
  [NODE_REWARD_STATUS.PAID]: [NODE_REWARD_STATUS.RECOVERED],
  [NODE_REWARD_STATUS.RECOVERED]: [],
  [NODE_REWARD_STATUS.CANCELLED]: [],
  [NODE_REWARD_STATUS.RISK_HOLD]: [
    NODE_REWARD_STATUS.APPROVED,
    NODE_REWARD_STATUS.CANCELLED,
    NODE_REWARD_STATUS.RECOVERED,
  ],
} as const;

// ============================================================
// 4. 节点服务记录状态
// ============================================================

/**
 * 节点服务记录 (FjnNodeServiceRecord) 状态
 * 与 Prisma schema 中 FjnNodeServiceRecord.status 字段对应
 */
export const NODE_SERVICE_RECORD_STATUS = {
  /** 待审核 */
  PENDING: 'pending',
  /** 已通过 */
  APPROVED: 'approved',
  /** 已拒绝 */
  REJECTED: 'rejected',
} as const;

export type FjnNodeServiceRecordStatus =
  (typeof NODE_SERVICE_RECORD_STATUS)[keyof typeof NODE_SERVICE_RECORD_STATUS];

/** 所有节点服务记录状态 */
export const ALL_NODE_SERVICE_RECORD_STATUSES: readonly FjnNodeServiceRecordStatus[] = [
  NODE_SERVICE_RECORD_STATUS.PENDING,
  NODE_SERVICE_RECORD_STATUS.APPROVED,
  NODE_SERVICE_RECORD_STATUS.REJECTED,
] as const;

/** 节点服务记录终态 */
export const TERMINAL_NODE_SERVICE_RECORD_STATUSES: readonly FjnNodeServiceRecordStatus[] = [
  NODE_SERVICE_RECORD_STATUS.APPROVED,
  NODE_SERVICE_RECORD_STATUS.REJECTED,
] as const;

/** 节点服务记录流转表 */
export const NODE_SERVICE_RECORD_STATUS_TRANSITIONS: Record<
  FjnNodeServiceRecordStatus,
  readonly FjnNodeServiceRecordStatus[]
> = {
  [NODE_SERVICE_RECORD_STATUS.PENDING]: [
    NODE_SERVICE_RECORD_STATUS.APPROVED,
    NODE_SERVICE_RECORD_STATUS.REJECTED,
  ],
  [NODE_SERVICE_RECORD_STATUS.APPROVED]: [],
  [NODE_SERVICE_RECORD_STATUS.REJECTED]: [],
} as const;

// ============================================================
// 5. 节点等级（5 级：city/regional/national/global/strategic）
// ============================================================

/** 节点等级 */
export const NODE_LEVELS = {
  CITY: 'city',
  REGIONAL: 'regional',
  NATIONAL: 'national',
  GLOBAL: 'global',
  STRATEGIC: 'strategic',
} as const;

export type FjnNodeLevel = (typeof NODE_LEVELS)[keyof typeof NODE_LEVELS];

/** 所有节点等级 */
export const ALL_NODE_LEVELS: readonly FjnNodeLevel[] = [
  NODE_LEVELS.CITY,
  NODE_LEVELS.REGIONAL,
  NODE_LEVELS.NATIONAL,
  NODE_LEVELS.GLOBAL,
  NODE_LEVELS.STRATEGIC,
] as const;

/** 节点等级排序（用于判定上级/下级） */
export const NODE_LEVEL_RANK: Record<FjnNodeLevel, number> = {
  [NODE_LEVELS.CITY]: 1,
  [NODE_LEVELS.REGIONAL]: 2,
  [NODE_LEVELS.NATIONAL]: 3,
  [NODE_LEVELS.GLOBAL]: 4,
  [NODE_LEVELS.STRATEGIC]: 5,
};

// ============================================================
// 6. 节点奖励规则（3/3/2/2，strategic 不参与）
// ============================================================

/** 节点奖励比例（H030 业务规则：3/3/2/2） */
export const NODE_REWARD_RATES = {
  /** 城市节点：3% */
  CITY: '0.03',
  /** 区域节点：3% */
  REGIONAL: '0.03',
  /** 国家节点：2% */
  NATIONAL: '0.02',
  /** 全球节点：2% */
  GLOBAL: '0.02',
  /** 战略节点：0%（不参与订单分润） */
  STRATEGIC: '0',
} as const;

export type FjnNodeRewardLevel = 'city' | 'regional' | 'national' | 'global';

/** 节点奖励等级 → 比例 */
export const NODE_LEVEL_RATES: Record<FjnNodeRewardLevel, string> = {
  city: NODE_REWARD_RATES.CITY,
  regional: NODE_REWARD_RATES.REGIONAL,
  national: NODE_REWARD_RATES.NATIONAL,
  global: NODE_REWARD_RATES.GLOBAL,
};

/** 可参与订单分润的节点等级 */
export const NODE_REWARD_LEVELS: readonly FjnNodeRewardLevel[] = [
  'city',
  'regional',
  'national',
  'global',
] as const;

/** 节点服务类型 */
export const NODE_SERVICE_TYPES = {
  MERCHANT_EXPANSION: 'merchant_expansion',
  USER_EDUCATION: 'user_education',
  COMPLIANCE: 'compliance',
  PROMOTION: 'promotion',
} as const;

export type FjnNodeServiceType =
  (typeof NODE_SERVICE_TYPES)[keyof typeof NODE_SERVICE_TYPES];

// ============================================================
// 7. 工具函数
// ==========================================================

/** 判断节点状态是否为终态 */
export function isTerminalNodeStatus(status: FjnNodeStatus): boolean {
  return TERMINAL_NODE_STATUSES.includes(status);
}

/** 判断节点奖励状态是否为终态 */
export function isTerminalNodeRewardStatus(status: FjnNodeRewardStatus): boolean {
  return TERMINAL_NODE_REWARD_STATUSES.includes(status);
}

/** 判断 KYB 状态是否为终态 */
export function isTerminalNodeKybStatus(status: FjnNodeKybStatus): boolean {
  return TERMINAL_NODE_KYB_STATUSES.includes(status);
}

/** 判断节点服务记录状态是否为终态 */
export function isTerminalNodeServiceRecordStatus(
  status: FjnNodeServiceRecordStatus
): boolean {
  return TERMINAL_NODE_SERVICE_RECORD_STATUSES.includes(status);
}

/** 判断节点奖励状态转移是否合法 */
export function canTransitNodeRewardStatus(
  from: FjnNodeRewardStatus,
  to: FjnNodeRewardStatus
): boolean {
  return NODE_REWARD_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 判断节点状态转移是否合法 */
export function canTransitNodeStatus(
  from: FjnNodeStatus,
  to: FjnNodeStatus
): boolean {
  return NODE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 判断 KYB 状态转移是否合法 */
export function canTransitNodeKybStatus(
  from: FjnNodeKybStatus,
  to: FjnNodeKybStatus
): boolean {
  return NODE_KYB_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 判断节点服务记录状态转移是否合法 */
export function canTransitNodeServiceRecordStatus(
  from: FjnNodeServiceRecordStatus,
  to: FjnNodeServiceRecordStatus
): boolean {
  return NODE_SERVICE_RECORD_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 强制节点奖励状态转移 */
export function assertTransitNodeRewardStatus(
  from: FjnNodeRewardStatus,
  to: FjnNodeRewardStatus
): void {
  if (!canTransitNodeRewardStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法节点奖励状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: NODE_REWARD_STATUS_TRANSITIONS[from] }
    );
  }
}

/** 强制节点状态转移 */
export function assertTransitNodeStatus(
  from: FjnNodeStatus,
  to: FjnNodeStatus
): void {
  if (!canTransitNodeStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法节点状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: NODE_STATUS_TRANSITIONS[from] }
    );
  }
}

/** 强制 KYB 状态转移 */
export function assertTransitNodeKybStatus(
  from: FjnNodeKybStatus,
  to: FjnNodeKybStatus
): void {
  if (!canTransitNodeKybStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法节点 KYB 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: NODE_KYB_STATUS_TRANSITIONS[from] }
    );
  }
}

/** 强制节点服务记录状态转移 */
export function assertTransitNodeServiceRecordStatus(
  from: FjnNodeServiceRecordStatus,
  to: FjnNodeServiceRecordStatus
): void {
  if (!canTransitNodeServiceRecordStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法节点服务记录状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: NODE_SERVICE_RECORD_STATUS_TRANSITIONS[from] }
    );
  }
}

/** 获取可转移的下一状态列表 */
export function nextNodeRewardStatuses(
  from: FjnNodeRewardStatus
): readonly FjnNodeRewardStatus[] {
  return NODE_REWARD_STATUS_TRANSITIONS[from] ?? [];
}

export function nextNodeStatuses(
  from: FjnNodeStatus
): readonly FjnNodeStatus[] {
  return NODE_STATUS_TRANSITIONS[from] ?? [];
}

export function nextNodeKybStatuses(
  from: FjnNodeKybStatus
): readonly FjnNodeKybStatus[] {
  return NODE_KYB_STATUS_TRANSITIONS[from] ?? [];
}

export function nextNodeServiceRecordStatuses(
  from: FjnNodeServiceRecordStatus
): readonly FjnNodeServiceRecordStatus[] {
  return NODE_SERVICE_RECORD_STATUS_TRANSITIONS[from] ?? [];
}

/** 判断节点奖励是否可锁定 */
export function isNodeRewardLockable(status: FjnNodeRewardStatus): boolean {
  return (
    status === NODE_REWARD_STATUS.WAITING_SERVICE_RECORD ||
    status === NODE_REWARD_STATUS.CREATED
  );
}

/** 判断节点奖励是否可审核 */
export function isNodeRewardApprovable(status: FjnNodeRewardStatus): boolean {
  return (
    status === NODE_REWARD_STATUS.LOCKED ||
    status === NODE_REWARD_STATUS.RISK_CHECKING
  );
}

/** 判断节点奖励是否可转 payable */
export function isNodeRewardPayableReward(status: FjnNodeRewardStatus): boolean {
  return (
    status === NODE_REWARD_STATUS.APPROVED ||
    status === NODE_REWARD_STATUS.RISK_CHECKING
  );
}

/** 判断节点奖励是否可支付 */
export function isNodeRewardPayableNow(status: FjnNodeRewardStatus): boolean {
  return status === NODE_REWARD_STATUS.PAYABLE;
}

/** 判断节点奖励是否可追回 */
export function isNodeRewardRecoverable(status: FjnNodeRewardStatus): boolean {
  return (
    status === NODE_REWARD_STATUS.APPROVED ||
    status === NODE_REWARD_STATUS.PAYABLE ||
    status === NODE_REWARD_STATUS.PAID ||
    status === NODE_REWARD_STATUS.RISK_HOLD
  );
}

/** 判断节点奖励是否可取消 */
export function isNodeRewardCancellable(status: FjnNodeRewardStatus): boolean {
  if (isTerminalNodeRewardStatus(status)) return false;
  return canTransitNodeRewardStatus(status, NODE_REWARD_STATUS.CANCELLED);
}

/** 判断节点是否可接收订单奖励（active / approved） */
export function isNodeRewardEligible(status: FjnNodeStatus): boolean {
  return (
    status === NODE_STATUS.ACTIVE ||
    status === NODE_STATUS.APPROVED
  );
}

/** 判断节点服务记录是否可审核 */
export function isNodeServiceRecordApprovable(
  status: FjnNodeServiceRecordStatus
): boolean {
  return status === NODE_SERVICE_RECORD_STATUS.PENDING;
}

/** 判断节点等级是否可参与订单分润 */
export function isNodeRewardLevel(level: FjnNodeLevel): boolean {
  return level !== NODE_LEVELS.STRATEGIC;
}
