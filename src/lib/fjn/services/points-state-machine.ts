/**
 * FJN Points Service - 状态机 + 枚举
 *
 * 严格遵循 H015 + H023 工业级职责：
 *  - PointsAccount 状态机：active | frozen | closed
 *  - PointsFreeze 状态机：active | unfrozen | revoked
 *  - PointsReversal 状态机：pending | confirmed | rejected
 *  - 通用枚举：AssetType / ChangeType / SourceType / BizType / SnapshotType / RiskStatus
 *
 * 业务背景：
 *  - FJ369 Points 权益值：买酒获 369,000 Points / 消费扣减
 *  - cFJ369 贡献积分：推荐/团队/节点/释放/AI 任务等多种来源
 *  - 余额严格走 Ledger 模型，账户余额 = available + frozen + locked + consumed + converted + expired
 *
 * 用法：
 *   import { POINTS_STATUS, POINTS_ASSET_TYPE, canTransitPointsAccountStatus } from './points-state-machine';
 */

import { FjnStateMachineError } from '../errors';

// ============================================================
// 1. PointsAccount 状态机
// ============================================================

/** PointsAccount 状态 */
export const POINTS_ACCOUNT_STATUS = {
  ACTIVE: 'active',
  FROZEN: 'frozen',
  CLOSED: 'closed',
} as const;

export type FjnPointsAccountStatus =
  (typeof POINTS_ACCOUNT_STATUS)[keyof typeof POINTS_ACCOUNT_STATUS];

export const ALL_POINTS_ACCOUNT_STATUSES: readonly FjnPointsAccountStatus[] =
  Object.values(POINTS_ACCOUNT_STATUS);

/** 终态：CLOSED 不可恢复 */
export const TERMINAL_POINTS_ACCOUNT_STATUSES: readonly FjnPointsAccountStatus[] = [
  POINTS_ACCOUNT_STATUS.CLOSED,
] as const;

export const POINTS_ACCOUNT_STATUS_TRANSITIONS: Record<FjnPointsAccountStatus, readonly FjnPointsAccountStatus[]> = {
  [POINTS_ACCOUNT_STATUS.ACTIVE]: [POINTS_ACCOUNT_STATUS.FROZEN, POINTS_ACCOUNT_STATUS.CLOSED],
  [POINTS_ACCOUNT_STATUS.FROZEN]: [POINTS_ACCOUNT_STATUS.ACTIVE, POINTS_ACCOUNT_STATUS.CLOSED],
  [POINTS_ACCOUNT_STATUS.CLOSED]: [],
} as const;

// ============================================================
// 2. PointsFreeze 状态机
// ============================================================

/** PointsFreeze 状态 */
export const POINTS_FREEZE_STATUS = {
  ACTIVE: 'active',
  UNFROZEN: 'unfrozen',
  REVOKED: 'revoked',
} as const;

export type FjnPointsFreezeStatus =
  (typeof POINTS_FREEZE_STATUS)[keyof typeof POINTS_FREEZE_STATUS];

export const ALL_POINTS_FREEZE_STATUSES: readonly FjnPointsFreezeStatus[] =
  Object.values(POINTS_FREEZE_STATUS);

export const POINTS_FREEZE_STATUS_TRANSITIONS: Record<FjnPointsFreezeStatus, readonly FjnPointsFreezeStatus[]> = {
  [POINTS_FREEZE_STATUS.ACTIVE]: [POINTS_FREEZE_STATUS.UNFROZEN, POINTS_FREEZE_STATUS.REVOKED],
  [POINTS_FREEZE_STATUS.UNFROZEN]: [],
  [POINTS_FREEZE_STATUS.REVOKED]: [],
} as const;

// ============================================================
// 3. PointsReversal 状态机
// ============================================================

/** PointsReversal 状态 */
export const POINTS_REVERSAL_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
} as const;

export type FjnPointsReversalStatus =
  (typeof POINTS_REVERSAL_STATUS)[keyof typeof POINTS_REVERSAL_STATUS];

export const ALL_POINTS_REVERSAL_STATUSES: readonly FjnPointsReversalStatus[] =
  Object.values(POINTS_REVERSAL_STATUS);

export const POINTS_REVERSAL_STATUS_TRANSITIONS: Record<FjnPointsReversalStatus, readonly FjnPointsReversalStatus[]> = {
  [POINTS_REVERSAL_STATUS.PENDING]: [POINTS_REVERSAL_STATUS.CONFIRMED, POINTS_REVERSAL_STATUS.REJECTED],
  [POINTS_REVERSAL_STATUS.CONFIRMED]: [],
  [POINTS_REVERSAL_STATUS.REJECTED]: [],
} as const;

// ============================================================
// 4. PointsRule 状态机
// ============================================================

/** PointsRule 状态 */
export const POINTS_RULE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  DEPRECATED: 'deprecated',
  ARCHIVED: 'archived',
} as const;

export type FjnPointsRuleStatus =
  (typeof POINTS_RULE_STATUS)[keyof typeof POINTS_RULE_STATUS];

export const ALL_POINTS_RULE_STATUSES: readonly FjnPointsRuleStatus[] =
  Object.values(POINTS_RULE_STATUS);

export const POINTS_RULE_STATUS_TRANSITIONS: Record<FjnPointsRuleStatus, readonly FjnPointsRuleStatus[]> = {
  [POINTS_RULE_STATUS.DRAFT]: [POINTS_RULE_STATUS.ACTIVE, POINTS_RULE_STATUS.ARCHIVED],
  [POINTS_RULE_STATUS.ACTIVE]: [POINTS_RULE_STATUS.DEPRECATED, POINTS_RULE_STATUS.ARCHIVED],
  [POINTS_RULE_STATUS.DEPRECATED]: [POINTS_RULE_STATUS.ARCHIVED],
  [POINTS_RULE_STATUS.ARCHIVED]: [],
} as const;

// ============================================================
// 5. 通用枚举
// ============================================================

/** 资产类型 */
export const POINTS_ASSET_TYPE = {
  FJ369_POINTS: 'fj369_points',
  CFJ369: 'cfj369',
} as const;

export type FjnPointsAssetType =
  (typeof POINTS_ASSET_TYPE)[keyof typeof POINTS_ASSET_TYPE];

export const ALL_POINTS_ASSET_TYPES: readonly FjnPointsAssetType[] =
  Object.values(POINTS_ASSET_TYPE);

/** 流水方向 */
export const POINTS_DIRECTION = {
  EARN: 'earn',
  SPEND: 'spend',
} as const;

export type FjnPointsDirection =
  (typeof POINTS_DIRECTION)[keyof typeof POINTS_DIRECTION];

/** 变更类型 */
export const POINTS_CHANGE_TYPE = {
  EARN: 'earn',
  CONSUME: 'consume',
  FREEZE: 'freeze',
  UNFREEZE: 'unfreeze',
  LOCK: 'lock',
  UNLOCK: 'unlock',
  CONVERT: 'convert',
  REVOKE: 'revoke',
  EXPIRE: 'expire',
  ADJUST_ADD: 'adjust_add',
  ADJUST_SUBTRACT: 'adjust_subtract',
} as const;

export type FjnPointsChangeType =
  (typeof POINTS_CHANGE_TYPE)[keyof typeof POINTS_CHANGE_TYPE];

export const ALL_POINTS_CHANGE_TYPES: readonly FjnPointsChangeType[] =
  Object.values(POINTS_CHANGE_TYPE);

/** 源类型（业务来源） */
export const POINTS_SOURCE_TYPE = {
  ORDER: 'order',
  REFERRAL: 'referral',
  TEAM: 'team',
  NODE: 'node',
  NFT: 'nft',
  RELEASE: 'release',
  MALL: 'mall',
  AI_TASK: 'ai_task',
  ADMIN: 'admin',
  SYSTEM: 'system',
  VIRTUAL_TRADE: 'virtual_trade',
  ENTERTAINMENT: 'entertainment',
  ENTERPRISE: 'enterprise',
  EXPIRE_SCHEDULER: 'expire_scheduler',
  RISK_ENGINE: 'risk_engine',
} as const;

export type FjnPointsSourceType =
  (typeof POINTS_SOURCE_TYPE)[keyof typeof POINTS_SOURCE_TYPE];

export const ALL_POINTS_SOURCE_TYPES: readonly FjnPointsSourceType[] =
  Object.values(POINTS_SOURCE_TYPE);

/** 业务类型 */
export const POINTS_BIZ_TYPE = {
  BUY_WINE: 'buy_wine',
  MALL_CONSUME: 'mall_consume',
  NFT_UPGRADE: 'nft_upgrade',
  REFERRAL_REWARD: 'referral_reward',
  TEAM_REWARD: 'team_reward',
  NODE_REWARD: 'node_reward',
  RELEASE_CLAIM: 'release_claim',
  AI_TASK_REWARD: 'ai_task_reward',
  VIRTUAL_TRADE_REWARD: 'virtual_trade_reward',
  ENTERTAINMENT_REWARD: 'entertainment_reward',
  ENTERPRISE_SERVICE: 'enterprise_service',
  ADMIN_GRANT: 'admin_grant',
  ADMIN_DEDUCT: 'admin_deduct',
  EXPIRE: 'expire',
  RISK_FREEZE: 'risk_freeze',
  RISK_UNFREEZE: 'risk_unfreeze',
  CONVERT_TO_TFJ369: 'convert_to_tfj369',
  REFUND_REVERSAL: 'refund_reversal',
} as const;

export type FjnPointsBizType =
  (typeof POINTS_BIZ_TYPE)[keyof typeof POINTS_BIZ_TYPE];

export const ALL_POINTS_BIZ_TYPES: readonly FjnPointsBizType[] =
  Object.values(POINTS_BIZ_TYPE);

/** 快照类型 */
export const POINTS_SNAPSHOT_TYPE = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  MANUAL: 'manual',
  RECONCILIATION: 'reconciliation',
} as const;

export type FjnPointsSnapshotType =
  (typeof POINTS_SNAPSHOT_TYPE)[keyof typeof POINTS_SNAPSHOT_TYPE];

export const ALL_POINTS_SNAPSHOT_TYPES: readonly FjnPointsSnapshotType[] =
  Object.values(POINTS_SNAPSHOT_TYPE);

/** 风险状态 */
export const POINTS_RISK_STATUS = {
  NORMAL: 'normal',
  WATCH: 'watch',
  HOLD: 'hold',
  BLOCKED: 'blocked',
} as const;

export type FjnPointsRiskStatus =
  (typeof POINTS_RISK_STATUS)[keyof typeof POINTS_RISK_STATUS];

export const ALL_POINTS_RISK_STATUSES: readonly FjnPointsRiskStatus[] =
  Object.values(POINTS_RISK_STATUS);

// ============================================================
// 6. 工具：状态机校验
// ============================================================

export function isValidPointsAccountStatus(s: string): s is FjnPointsAccountStatus {
  return (ALL_POINTS_ACCOUNT_STATUSES as readonly string[]).includes(s);
}

export function isValidPointsFreezeStatus(s: string): s is FjnPointsFreezeStatus {
  return (ALL_POINTS_FREEZE_STATUSES as readonly string[]).includes(s);
}

export function isValidPointsReversalStatus(s: string): s is FjnPointsReversalStatus {
  return (ALL_POINTS_REVERSAL_STATUSES as readonly string[]).includes(s);
}

export function isValidPointsRuleStatus(s: string): s is FjnPointsRuleStatus {
  return (ALL_POINTS_RULE_STATUSES as readonly string[]).includes(s);
}

export function isValidPointsAssetType(s: string): s is FjnPointsAssetType {
  return (ALL_POINTS_ASSET_TYPES as readonly string[]).includes(s);
}

export function isValidPointsChangeType(s: string): s is FjnPointsChangeType {
  return (ALL_POINTS_CHANGE_TYPES as readonly string[]).includes(s);
}

export function isValidPointsSourceType(s: string): s is FjnPointsSourceType {
  return (ALL_POINTS_SOURCE_TYPES as readonly string[]).includes(s);
}

export function isValidPointsBizType(s: string): s is FjnPointsBizType {
  return (ALL_POINTS_BIZ_TYPES as readonly string[]).includes(s);
}

export function isValidPointsSnapshotType(s: string): s is FjnPointsSnapshotType {
  return (ALL_POINTS_SNAPSHOT_TYPES as readonly string[]).includes(s);
}

export function isValidPointsRiskStatus(s: string): s is FjnPointsRiskStatus {
  return (ALL_POINTS_RISK_STATUSES as readonly string[]).includes(s);
}

export function canTransitPointsAccountStatus(
  from: FjnPointsAccountStatus,
  to: FjnPointsAccountStatus,
): boolean {
  return POINTS_ACCOUNT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitPointsAccountStatus(
  from: FjnPointsAccountStatus,
  to: FjnPointsAccountStatus,
): void {
  if (!canTransitPointsAccountStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 PointsAccount 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: POINTS_ACCOUNT_STATUS_TRANSITIONS[from] },
    );
  }
}

export function canTransitPointsFreezeStatus(
  from: FjnPointsFreezeStatus,
  to: FjnPointsFreezeStatus,
): boolean {
  return POINTS_FREEZE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitPointsFreezeStatus(
  from: FjnPointsFreezeStatus,
  to: FjnPointsFreezeStatus,
): void {
  if (!canTransitPointsFreezeStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 PointsFreeze 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: POINTS_FREEZE_STATUS_TRANSITIONS[from] },
    );
  }
}

export function canTransitPointsReversalStatus(
  from: FjnPointsReversalStatus,
  to: FjnPointsReversalStatus,
): boolean {
  return POINTS_REVERSAL_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitPointsReversalStatus(
  from: FjnPointsReversalStatus,
  to: FjnPointsReversalStatus,
): void {
  if (!canTransitPointsReversalStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 PointsReversal 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: POINTS_REVERSAL_STATUS_TRANSITIONS[from] },
    );
  }
}

export function canTransitPointsRuleStatus(
  from: FjnPointsRuleStatus,
  to: FjnPointsRuleStatus,
): boolean {
  return POINTS_RULE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitPointsRuleStatus(
  from: FjnPointsRuleStatus,
  to: FjnPointsRuleStatus,
): void {
  if (!canTransitPointsRuleStatus(from, to)) {
    throw new FjnStateMachineError(
      `非法 PointsRule 状态转移: ${from} -> ${to}`,
      { from, to, allowedNext: POINTS_RULE_STATUS_TRANSITIONS[from] },
    );
  }
}

// ============================================================
// 7. 业务工具
// ============================================================

/** 变更类型是否属于减少余额 */
export function isDecreaseChangeType(t: FjnPointsChangeType): boolean {
  return (
    t === POINTS_CHANGE_TYPE.CONSUME ||
    t === POINTS_CHANGE_TYPE.FREEZE ||
    t === POINTS_CHANGE_TYPE.LOCK ||
    t === POINTS_CHANGE_TYPE.CONVERT ||
    t === POINTS_CHANGE_TYPE.REVOKE ||
    t === POINTS_CHANGE_TYPE.EXPIRE ||
    t === POINTS_CHANGE_TYPE.ADJUST_SUBTRACT
  );
}

/** 变更类型是否属于增加余额 */
export function isIncreaseChangeType(t: FjnPointsChangeType): boolean {
  return (
    t === POINTS_CHANGE_TYPE.EARN ||
    t === POINTS_CHANGE_TYPE.UNFREEZE ||
    t === POINTS_CHANGE_TYPE.UNLOCK ||
    t === POINTS_CHANGE_TYPE.ADJUST_ADD
  );
}

/** 账户是否可用 */
export function isPointsAccountUsable(s: FjnPointsAccountStatus): boolean {
  return s === POINTS_ACCOUNT_STATUS.ACTIVE;
}

/** 冻结是否生效 */
export function isPointsFreezeActive(
  s: FjnPointsFreezeStatus,
  expiresAt: Date | null | undefined,
): boolean {
  if (s !== POINTS_FREEZE_STATUS.ACTIVE) return false;
  if (!expiresAt) return true;
  return expiresAt.getTime() > Date.now();
}

// ============================================================
// 8. 默认业务常量
// ============================================================

/** FJ369 标准权益包购买赠送积分 */
export const FJ369_STANDARD_GRANT_POINTS = '369000';

/** cFJ369 贡献积分默认转换比例 (1 cFJ369 = 1 tFJ369) */
export const CFJ369_TO_TFJ369_DEFAULT_RATIO = '1';

/** tFJ369 转换默认手续费率（5%） */
export const TPOINTS_CONVERSION_FEE_RATE = '0.05';

/** 积分冻结默认有效期（天） */
export const POINTS_FREEZE_DEFAULT_EXPIRES_DAYS = 30;

/** 积分过期默认期限（天，0 = 永不过期） */
export const POINTS_EXPIRE_DEFAULT_DAYS = 0;

/** 余额可扣精度 */
export const POINTS_AMOUNT_PRECISION = 4;
