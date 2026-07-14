/**
 * FJN Finance Service - 状态机
 *
 * 严格遵循 H032 §3 工业级状态机规范 + 现有 schema 字段 + H015 工业级职责：
 *  - 财务账户 (FjnFinanceAccount) 状态机：active | frozen | closed
 *  - 财务流水 (FjnFinanceLedger) 状态机：posted | reversed | void
 *  - 结算单 (FjnSettlement) 状态机：created | approved | paid | cancelled
 *  - 结算条目 (FjnSettlementItem) 状态机：pending | paid | failed
 *  - 状态转移基于白名单，禁止隐式跳转
 *
 * 设计原则：
 *  - 状态常量使用 SCREAMING_SNAKE_CASE 字符串
 *  - 状态机是"防御性"机制：所有变更都必须经过校验
 *  - 终态明确：closed/reversed/void/paid 不可再转移
 *  - 复式记账：每笔流水有 direction（in | out）+ balanceBefore/After 校验
 *
 * 用法：
 *   import { FINANCE_ACCOUNT_STATUS, canTransitFinanceAccountStatus } from './finance-state-machine';
 */

import { FjnStateMachineError } from '../errors';

// ============================================================
// 1. 财务账户状态
// ============================================================

/**
 * 财务账户 (FjnFinanceAccount) 状态
 * 与 Prisma schema 中 FjnFinanceAccount.status 字段对应
 */
export const FINANCE_ACCOUNT_STATUS = {
  /** 正常 */
  ACTIVE: 'active',
  /** 冻结（不可入账/出账） */
  FROZEN: 'frozen',
  /** 已关闭（不可再用） */
  CLOSED: 'closed',
} as const;

export type FjnFinanceAccountStatus =
  (typeof FINANCE_ACCOUNT_STATUS)[keyof typeof FINANCE_ACCOUNT_STATUS];

/** 所有账户状态 */
export const ALL_FINANCE_ACCOUNT_STATUSES: readonly FjnFinanceAccountStatus[] = [
  FINANCE_ACCOUNT_STATUS.ACTIVE,
  FINANCE_ACCOUNT_STATUS.FROZEN,
  FINANCE_ACCOUNT_STATUS.CLOSED,
] as const;

/** 账户终态 */
export const TERMINAL_FINANCE_ACCOUNT_STATUSES: readonly FjnFinanceAccountStatus[] = [
  FINANCE_ACCOUNT_STATUS.CLOSED,
] as const;

/** 账户状态流转表 */
export const FINANCE_ACCOUNT_STATUS_TRANSITIONS: Record<
  FjnFinanceAccountStatus,
  readonly FjnFinanceAccountStatus[]
> = {
  [FINANCE_ACCOUNT_STATUS.ACTIVE]: [
    FINANCE_ACCOUNT_STATUS.FROZEN,
    FINANCE_ACCOUNT_STATUS.CLOSED,
  ],
  [FINANCE_ACCOUNT_STATUS.FROZEN]: [
    FINANCE_ACCOUNT_STATUS.ACTIVE,
    FINANCE_ACCOUNT_STATUS.CLOSED,
  ],
  [FINANCE_ACCOUNT_STATUS.CLOSED]: [],
} as const;

// ============================================================
// 2. 财务流水状态
// ============================================================

/**
 * 财务流水 (FjnFinanceLedger) 状态
 * 与 Prisma schema 中 FjnFinanceLedger.settlementStatus 字段对应（业务上是 ledgerStatus）
 * 注：现有 schema 用 settlementStatus 表达实际状态
 */
export const FINANCE_LEDGER_STATUS = {
  /** 已入账 */
  POSTED: 'posted',
  /** 已冲销 */
  REVERSED: 'reversed',
  /** 作废（创建时即作废） */
  VOID: 'void',
} as const;

export type FjnFinanceLedgerStatus =
  (typeof FINANCE_LEDGER_STATUS)[keyof typeof FINANCE_LEDGER_STATUS];

/** 所有流水状态 */
export const ALL_FINANCE_LEDGER_STATUSES: readonly FjnFinanceLedgerStatus[] = [
  FINANCE_LEDGER_STATUS.POSTED,
  FINANCE_LEDGER_STATUS.REVERSED,
  FINANCE_LEDGER_STATUS.VOID,
] as const;

/** 流水终态 */
export const TERMINAL_FINANCE_LEDGER_STATUSES: readonly FjnFinanceLedgerStatus[] = [
  FINANCE_LEDGER_STATUS.REVERSED,
  FINANCE_LEDGER_STATUS.VOID,
] as const;

/** 流水状态流转表 */
export const FINANCE_LEDGER_STATUS_TRANSITIONS: Record<
  FjnFinanceLedgerStatus,
  readonly FjnFinanceLedgerStatus[]
> = {
  [FINANCE_LEDGER_STATUS.POSTED]: [
    FINANCE_LEDGER_STATUS.REVERSED,
    FINANCE_LEDGER_STATUS.VOID,
  ],
  [FINANCE_LEDGER_STATUS.REVERSED]: [],
  [FINANCE_LEDGER_STATUS.VOID]: [],
} as const;

// ============================================================
// 3. 流水方向
// ============================================================

/** 流水方向：入账 (in) / 出账 (out) */
export const FINANCE_DIRECTION = {
  IN: 'in',
  OUT: 'out',
} as const;

export type FjnFinanceDirection =
  (typeof FINANCE_DIRECTION)[keyof typeof FINANCE_DIRECTION];

// ============================================================
// 4. 结算单状态
// ============================================================

/**
 * 结算单 (FjnSettlement) 状态
 * 与 Prisma schema 中 FjnSettlement.status 字段对应
 */
export const FINANCE_SETTLEMENT_STATUS = {
  /** 已创建 */
  CREATED: 'created',
  /** 已审核 */
  APPROVED: 'approved',
  /** 已支付 */
  PAID: 'paid',
  /** 已取消 */
  CANCELLED: 'cancelled',
} as const;

export type FjnFinanceSettlementStatus =
  (typeof FINANCE_SETTLEMENT_STATUS)[keyof typeof FINANCE_SETTLEMENT_STATUS];

/** 所有结算单状态 */
export const ALL_FINANCE_SETTLEMENT_STATUSES: readonly FjnFinanceSettlementStatus[] = [
  FINANCE_SETTLEMENT_STATUS.CREATED,
  FINANCE_SETTLEMENT_STATUS.APPROVED,
  FINANCE_SETTLEMENT_STATUS.PAID,
  FINANCE_SETTLEMENT_STATUS.CANCELLED,
] as const;

/** 结算单终态 */
export const TERMINAL_FINANCE_SETTLEMENT_STATUSES: readonly FjnFinanceSettlementStatus[] = [
  FINANCE_SETTLEMENT_STATUS.PAID,
  FINANCE_SETTLEMENT_STATUS.CANCELLED,
] as const;

/** 结算单状态流转表 */
export const FINANCE_SETTLEMENT_STATUS_TRANSITIONS: Record<
  FjnFinanceSettlementStatus,
  readonly FjnFinanceSettlementStatus[]
> = {
  [FINANCE_SETTLEMENT_STATUS.CREATED]: [
    FINANCE_SETTLEMENT_STATUS.APPROVED,
    FINANCE_SETTLEMENT_STATUS.CANCELLED,
  ],
  [FINANCE_SETTLEMENT_STATUS.APPROVED]: [
    FINANCE_SETTLEMENT_STATUS.PAID,
    FINANCE_SETTLEMENT_STATUS.CANCELLED,
  ],
  [FINANCE_SETTLEMENT_STATUS.PAID]: [],
  [FINANCE_SETTLEMENT_STATUS.CANCELLED]: [],
} as const;

// ============================================================
// 5. 结算条目状态
// ============================================================

/**
 * 结算条目 (FjnSettlementItem) 状态
 * 与 Prisma schema 中 FjnSettlementItem.status 字段对应
 */
export const FINANCE_SETTLEMENT_ITEM_STATUS = {
  /** 待支付 */
  PENDING: 'pending',
  /** 已支付 */
  PAID: 'paid',
  /** 失败 */
  FAILED: 'failed',
} as const;

export type FjnFinanceSettlementItemStatus =
  (typeof FINANCE_SETTLEMENT_ITEM_STATUS)[keyof typeof FINANCE_SETTLEMENT_ITEM_STATUS];

/** 所有结算条目状态 */
export const ALL_FINANCE_SETTLEMENT_ITEM_STATUSES: readonly FjnFinanceSettlementItemStatus[] = [
  FINANCE_SETTLEMENT_ITEM_STATUS.PENDING,
  FINANCE_SETTLEMENT_ITEM_STATUS.PAID,
  FINANCE_SETTLEMENT_ITEM_STATUS.FAILED,
] as const;

/** 结算条目终态 */
export const TERMINAL_FINANCE_SETTLEMENT_ITEM_STATUSES: readonly FjnFinanceSettlementItemStatus[] = [
  FINANCE_SETTLEMENT_ITEM_STATUS.PAID,
  FINANCE_SETTLEMENT_ITEM_STATUS.FAILED,
] as const;

/** 结算条目状态流转表 */
export const FINANCE_SETTLEMENT_ITEM_STATUS_TRANSITIONS: Record<
  FjnFinanceSettlementItemStatus,
  readonly FjnFinanceSettlementItemStatus[]
> = {
  [FINANCE_SETTLEMENT_ITEM_STATUS.PENDING]: [
    FINANCE_SETTLEMENT_ITEM_STATUS.PAID,
    FINANCE_SETTLEMENT_ITEM_STATUS.FAILED,
  ],
  [FINANCE_SETTLEMENT_ITEM_STATUS.PAID]: [],
  [FINANCE_SETTLEMENT_ITEM_STATUS.FAILED]: [
    FINANCE_SETTLEMENT_ITEM_STATUS.PENDING, // 可重试
  ],
} as const;

// ============================================================
// 6. 账户类型枚举
// ============================================================

/** 财务账户类型 */
export const FINANCE_ACCOUNT_TYPES = {
  WINE_COST_POOL: 'wine_cost_pool',
  MARKET_ECOSYSTEM_POOL: 'market_ecosystem_pool',
  COMPANY_POOL: 'company_pool',
  REFERRAL_REWARD_PAYABLE: 'referral_reward_payable',
  TEAM_REWARD_PAYABLE: 'team_reward_payable',
  NODE_REWARD_PAYABLE: 'node_reward_payable',
  TAX_PAYABLE: 'tax_payable',
  MERCHANT_PAYABLE: 'merchant_payable',
  PLATFORM_CASH: 'platform_cash',
  REFUND_RESERVE: 'refund_reserve',
} as const;

export type FjnFinanceAccountType =
  (typeof FINANCE_ACCOUNT_TYPES)[keyof typeof FINANCE_ACCOUNT_TYPES];

/** 所有账户类型 */
export const ALL_FINANCE_ACCOUNT_TYPES: readonly FjnFinanceAccountType[] = Object.values(
  FINANCE_ACCOUNT_TYPES,
);

// ============================================================
// 7. 业务类型枚举
// ============================================================

/** 财务流水业务类型 */
export const FINANCE_BUSINESS_TYPES = {
  INCOME: 'income',
  COST: 'cost',
  MARKET_POOL: 'market_pool',
  COMPANY_POOL: 'company_pool',
  REFERRAL_COMMISSION: 'referral_commission',
  TEAM_REWARD: 'team_reward',
  NODE_REWARD: 'node_reward',
  TAX_RESERVED: 'tax_reserved',
  TAX_PAID: 'tax_paid',
  REFUND: 'refund',
  CHARGEBACK: 'chargeback',
  PLATFORM_FEE: 'platform_fee',
  SETTLEMENT: 'settlement',
  ADJUSTMENT: 'adjustment',
} as const;

export type FjnFinanceBusinessType =
  (typeof FINANCE_BUSINESS_TYPES)[keyof typeof FINANCE_BUSINESS_TYPES];

/** 所有业务类型 */
export const ALL_FINANCE_BUSINESS_TYPES: readonly FjnFinanceBusinessType[] = Object.values(
  FINANCE_BUSINESS_TYPES,
);

// ============================================================
// 8. 结算单类型
// ============================================================

/** 结算单类型 */
export const FINANCE_SETTLEMENT_TYPES = {
  REFERRAL: 'referral',
  TEAM: 'team',
  NODE: 'node',
  MERCHANT: 'merchant',
  TAX: 'tax',
} as const;

export type FjnFinanceSettlementType =
  (typeof FINANCE_SETTLEMENT_TYPES)[keyof typeof FINANCE_SETTLEMENT_TYPES];

/** 所有结算单类型 */
export const ALL_FINANCE_SETTLEMENT_TYPES: readonly FjnFinanceSettlementType[] = Object.values(
  FINANCE_SETTLEMENT_TYPES,
);

// ============================================================
// 9. 工具函数
// ============================================================

/** 判断账户状态是否为终态 */
export function isTerminalFinanceAccountStatus(
  status: FjnFinanceAccountStatus,
): boolean {
  return TERMINAL_FINANCE_ACCOUNT_STATUSES.includes(status);
}

/** 判断流水状态是否为终态 */
export function isTerminalFinanceLedgerStatus(
  status: FjnFinanceLedgerStatus,
): boolean {
  return TERMINAL_FINANCE_LEDGER_STATUSES.includes(status);
}

/** 判断结算单状态是否为终态 */
export function isTerminalFinanceSettlementStatus(
  status: FjnFinanceSettlementStatus,
): boolean {
  return TERMINAL_FINANCE_SETTLEMENT_STATUSES.includes(status);
}

/** 判断结算条目状态是否为终态 */
export function isTerminalFinanceSettlementItemStatus(
  status: FjnFinanceSettlementItemStatus,
): boolean {
  return TERMINAL_FINANCE_SETTLEMENT_ITEM_STATUSES.includes(status);
}

/** 判断账户状态转移是否合法 */
export function canTransitFinanceAccountStatus(
  from: FjnFinanceAccountStatus,
  to: FjnFinanceAccountStatus,
): boolean {
  return FINANCE_ACCOUNT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 判断流水状态转移是否合法 */
export function canTransitFinanceLedgerStatus(
  from: FjnFinanceLedgerStatus,
  to: FjnFinanceLedgerStatus,
): boolean {
  return FINANCE_LEDGER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 判断结算单状态转移是否合法 */
export function canTransitFinanceSettlementStatus(
  from: FjnFinanceSettlementStatus,
  to: FjnFinanceSettlementStatus,
): boolean {
  return FINANCE_SETTLEMENT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 判断结算条目状态转移是否合法 */
export function canTransitFinanceSettlementItemStatus(
  from: FjnFinanceSettlementItemStatus,
  to: FjnFinanceSettlementItemStatus,
): boolean {
  return FINANCE_SETTLEMENT_ITEM_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 强制账户状态转移 */
export function assertTransitFinanceAccountStatus(
  from: FjnFinanceAccountStatus,
  to: FjnFinanceAccountStatus,
): void {
  if (!canTransitFinanceAccountStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法财务账户状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: FINANCE_ACCOUNT_STATUS_TRANSITIONS[from] },
    );
  }
}

/** 强制流水状态转移 */
export function assertTransitFinanceLedgerStatus(
  from: FjnFinanceLedgerStatus,
  to: FjnFinanceLedgerStatus,
): void {
  if (!canTransitFinanceLedgerStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法财务流水状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: FINANCE_LEDGER_STATUS_TRANSITIONS[from] },
    );
  }
}

/** 强制结算单状态转移 */
export function assertTransitFinanceSettlementStatus(
  from: FjnFinanceSettlementStatus,
  to: FjnFinanceSettlementStatus,
): void {
  if (!canTransitFinanceSettlementStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法结算单状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: FINANCE_SETTLEMENT_STATUS_TRANSITIONS[from] },
    );
  }
}

/** 强制结算条目状态转移 */
export function assertTransitFinanceSettlementItemStatus(
  from: FjnFinanceSettlementItemStatus,
  to: FjnFinanceSettlementItemStatus,
): void {
  if (!canTransitFinanceSettlementItemStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法结算条目状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: FINANCE_SETTLEMENT_ITEM_STATUS_TRANSITIONS[from] },
    );
  }
}

/** 获取可转移的下一状态列表 */
export function nextFinanceAccountStatuses(
  from: FjnFinanceAccountStatus,
): readonly FjnFinanceAccountStatus[] {
  return FINANCE_ACCOUNT_STATUS_TRANSITIONS[from] ?? [];
}

export function nextFinanceLedgerStatuses(
  from: FjnFinanceLedgerStatus,
): readonly FjnFinanceLedgerStatus[] {
  return FINANCE_LEDGER_STATUS_TRANSITIONS[from] ?? [];
}

export function nextFinanceSettlementStatuses(
  from: FjnFinanceSettlementStatus,
): readonly FjnFinanceSettlementStatus[] {
  return FINANCE_SETTLEMENT_STATUS_TRANSITIONS[from] ?? [];
}

export function nextFinanceSettlementItemStatuses(
  from: FjnFinanceSettlementItemStatus,
): readonly FjnFinanceSettlementItemStatus[] {
  return FINANCE_SETTLEMENT_ITEM_STATUS_TRANSITIONS[from] ?? [];
}

/** 判断账户是否可入账/出账 */
export function isFinanceAccountOperable(status: FjnFinanceAccountStatus): boolean {
  return status === FINANCE_ACCOUNT_STATUS.ACTIVE;
}

/** 判断流水是否可冲销 */
export function isFinanceLedgerReversible(status: FjnFinanceLedgerStatus): boolean {
  return status === FINANCE_LEDGER_STATUS.POSTED;
}

/** 判断结算单是否可审核 */
export function isFinanceSettlementApprovable(
  status: FjnFinanceSettlementStatus,
): boolean {
  return status === FINANCE_SETTLEMENT_STATUS.CREATED;
}

/** 判断结算单是否可支付 */
export function isFinanceSettlementPayable(
  status: FjnFinanceSettlementStatus,
): boolean {
  return status === FINANCE_SETTLEMENT_STATUS.APPROVED;
}

/** 判断结算单是否可取消 */
export function isFinanceSettlementCancellable(
  status: FjnFinanceSettlementStatus,
): boolean {
  return (
    status === FINANCE_SETTLEMENT_STATUS.CREATED ||
    status === FINANCE_SETTLEMENT_STATUS.APPROVED
  );
}

/** 判断结算条目是否可标记支付 */
export function isFinanceSettlementItemPayable(
  status: FjnFinanceSettlementItemStatus,
): boolean {
  return status === FINANCE_SETTLEMENT_ITEM_STATUS.PENDING;
}

/** 判断结算条目是否可重试 */
export function isFinanceSettlementItemRetriable(
  status: FjnFinanceSettlementItemStatus,
): boolean {
  return status === FINANCE_SETTLEMENT_ITEM_STATUS.FAILED;
}
