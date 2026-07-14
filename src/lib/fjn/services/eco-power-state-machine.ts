/**
 * Eco Power Service - 状态机 + 枚举
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.5
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md §3.10
 *
 * 职责范围：
 *  - 算力账户（13 种算力分桶）
 *  - 算力流水（FjnPowerLedger）
 *  - 算力规则（vip 倍率 / 活跃倍率 / 风控系数）
 *  - 算力计算（effectivePower = totalPower × 倍率 × 系数）
 *  - 算力冻结（status=frozen）
 *  - 算力快照（FjnPowerSnapshot）
 *  - 释放计算源数据
 *
 * 链下真相源：FjnPowerAccount / FjnPowerLedger / FjnPowerSnapshot
 * 链上：可选 anchor snapshot 哈希到 Solana（不在 Service 主路径）
 */

export const POWER_TYPE = {
  BASE: 'base',
  CONSUME: 'consume',
  MALL: 'mall',
  NFT: 'nft',
  VIRTUAL_POINTS: 'virtual_points',
  GAMING: 'gaming',
  AI: 'ai',
  CORPORATE: 'corporate',
  COMMUNITY: 'community',
  TFJ369_HOLD: 'tfj369_hold',
  TFJ369_LOCK: 'tfj369_lock',
  NODE: 'node',
} as const;
export type FjnPowerType = (typeof POWER_TYPE)[keyof typeof POWER_TYPE];

export const ALL_POWER_TYPES: FjnPowerType[] = Object.values(POWER_TYPE) as FjnPowerType[];

/** 算力账户字段 → 类型映射 */
export const POWER_TYPE_TO_ACCOUNT_FIELD: Record<FjnPowerType, string> = {
  base: 'basePower',
  consume: 'consumePower',
  mall: 'mallPower',
  nft: 'nftPower',
  virtual_points: 'virtualPointsPower',
  gaming: 'gamingPower',
  ai: 'aiPower',
  corporate: 'corporatePower',
  community: 'communityPower',
  tfj369_hold: 'tFJ369HoldPower',
  tfj369_lock: 'tFJ369LockPower',
  node: 'nodePower',
};

export const POWER_CHANGE_TYPE = {
  GRANT: 'grant',
  CONSUME: 'consume',
  EXPIRE: 'expire',
  FREEZE: 'freeze',
  UNFREEZE: 'unfreeze',
  ADJUST_ADD: 'adjust_add',
  ADJUST_SUBTRACT: 'adjust_subtract',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
  RELEASE_CONVERT: 'release_convert',
} as const;
export type FjnPowerChangeType = (typeof POWER_CHANGE_TYPE)[keyof typeof POWER_CHANGE_TYPE];

/** 算力来源类型 */
export const POWER_SOURCE_TYPE = {
  ORDER_PAID: 'order_paid',
  PRODUCT_PURCHASE: 'product_purchase',
  NFT_MINT: 'nft_mint',
  NFT_UPGRADE: 'nft_upgrade',
  REFERRAL: 'referral',
  TEAM_REWARD: 'team_reward',
  NODE_REWARD: 'node_reward',
  RELEASE: 'release',
  ADMIN_ADJUST: 'admin_adjust',
  SYSTEM_GRANT: 'system_grant',
  EXPIRE_JOB: 'expire_job',
  RISK_FREEZE: 'risk_freeze',
  RISK_UNFREEZE: 'risk_unfreeze',
  TRANSFER: 'transfer',
  CONVERT: 'convert',
  MANUAL: 'manual',
} as const;
export type FjnPowerSourceType = (typeof POWER_SOURCE_TYPE)[keyof typeof POWER_SOURCE_TYPE];

/** 算力账户状态 */
export const POWER_ACCOUNT_STATUS = {
  ACTIVE: 'active',
  FROZEN: 'frozen',
  SUSPENDED: 'suspended',
  CLOSED: 'closed',
} as const;
export type FjnPowerAccountStatus =
  (typeof POWER_ACCOUNT_STATUS)[keyof typeof POWER_ACCOUNT_STATUS];

/** 算力账户状态机 */
export const POWER_ACCOUNT_STATUS_TRANSITIONS: Record<
  FjnPowerAccountStatus,
  FjnPowerAccountStatus[]
> = {
  [POWER_ACCOUNT_STATUS.ACTIVE]: [
    POWER_ACCOUNT_STATUS.FROZEN,
    POWER_ACCOUNT_STATUS.SUSPENDED,
    POWER_ACCOUNT_STATUS.CLOSED,
  ],
  [POWER_ACCOUNT_STATUS.FROZEN]: [
    POWER_ACCOUNT_STATUS.ACTIVE,
    POWER_ACCOUNT_STATUS.CLOSED,
  ],
  [POWER_ACCOUNT_STATUS.SUSPENDED]: [
    POWER_ACCOUNT_STATUS.ACTIVE,
    POWER_ACCOUNT_STATUS.CLOSED,
  ],
  [POWER_ACCOUNT_STATUS.CLOSED]: [],
};

/** 快照类型 */
export const POWER_SNAPSHOT_TYPE = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  RELEASE_CALC: 'release_calc',
  MANUAL: 'manual',
  RISK_HOLD: 'risk_hold',
} as const;
export type FjnPowerSnapshotType =
  (typeof POWER_SNAPSHOT_TYPE)[keyof typeof POWER_SNAPSHOT_TYPE];

/** 校验器 */
export const isValidPowerType = (t: string): t is FjnPowerType =>
  Object.values(POWER_TYPE).includes(t as any);
export const isValidPowerChangeType = (t: string): t is FjnPowerChangeType =>
  Object.values(POWER_CHANGE_TYPE).includes(t as any);
export const isValidPowerSourceType = (t: string): t is FjnPowerSourceType =>
  Object.values(POWER_SOURCE_TYPE).includes(t as any);
export const isValidPowerAccountStatus = (s: string): s is FjnPowerAccountStatus =>
  Object.values(POWER_ACCOUNT_STATUS).includes(s as any);
export const isValidPowerSnapshotType = (t: string): t is FjnPowerSnapshotType =>
  Object.values(POWER_SNAPSHOT_TYPE).includes(t as any);

/** 状态流转 */
export const canTransitPowerAccountStatus = (
  from: FjnPowerAccountStatus,
  to: FjnPowerAccountStatus,
): boolean => (POWER_ACCOUNT_STATUS_TRANSITIONS[from] ?? []).includes(to);

export const assertTransitPowerAccountStatus = (
  from: FjnPowerAccountStatus,
  to: FjnPowerAccountStatus,
): void => {
  if (!canTransitPowerAccountStatus(from, to)) {
    throw new Error(`[EcoPower] Illegal account status transition: ${from} -> ${to}`);
  }
};

/** 终态判定 */
export const isTerminalPowerAccountStatus = (s: FjnPowerAccountStatus): boolean =>
  s === POWER_ACCOUNT_STATUS.CLOSED;

/** 操作判定 */
export const isAccountOperable = (s: FjnPowerAccountStatus): boolean =>
  s === POWER_ACCOUNT_STATUS.ACTIVE;

/** 增量方向判定（grant/add/transfer_in 为正） */
export const isPositiveChangeType = (t: FjnPowerChangeType): boolean =>
  t === POWER_CHANGE_TYPE.GRANT ||
  t === POWER_CHANGE_TYPE.UNFREEZE ||
  t === POWER_CHANGE_TYPE.ADJUST_ADD ||
  t === POWER_CHANGE_TYPE.TRANSFER_IN ||
  t === POWER_CHANGE_TYPE.RELEASE_CONVERT;

export const isNegativeChangeType = (t: FjnPowerChangeType): boolean =>
  t === POWER_CHANGE_TYPE.CONSUME ||
  t === POWER_CHANGE_TYPE.EXPIRE ||
  t === POWER_CHANGE_TYPE.FREEZE ||
  t === POWER_CHANGE_TYPE.ADJUST_SUBTRACT ||
  t === POWER_CHANGE_TYPE.TRANSFER_OUT;

/** 默认配置 */
export const POWER_DEFAULT_MEMBER_MULTIPLIER = '1.0000';
export const POWER_DEFAULT_ACTIVITY_MULTIPLIER = '1.0000';
export const POWER_DEFAULT_RISK_COEFFICIENT = '1.0000';
export const POWER_MAX_MULTIPLIER = '10.0000';
export const POWER_MIN_MULTIPLIER = '0.0000';
export const POWER_MAX_AMOUNT = '9999999999.9999';
export const POWER_MIN_AMOUNT = '0.0000';
export const POWER_LEDGER_PAGE_SIZE = 50;
export const POWER_SNAPSHOT_RETENTION_DAYS = 365;
export const POWER_LEDGER_RETENTION_DAYS = 730;
export const POWER_DEFAULT_EXPIRES_DAYS = 365;
export const POWER_FREEZE_AUTO_REVIEW_HOURS = 72;
export const POWER_NETWORK_TOTAL_DECIMALS = 4;
export const POWER_RATIO_DECIMALS = 8;

/** 默认有效期（天） */
export const POWER_DEFAULT_VALIDITY_BY_TYPE: Record<FjnPowerType, number> = {
  base: 365,
  consume: 180,
  mall: 90,
  nft: 365,
  virtual_points: 365,
  gaming: 30,
  ai: 30,
  corporate: 730,
  community: 180,
  tfj369_hold: 0, // 永不过期
  tfj369_lock: 0,
  node: 365,
};

/** 校验器：算力金额 */
export const isValidPowerAmount = (amount: string): boolean => {
  if (!amount) return false;
  const num = Number(amount);
  if (isNaN(num) || num < 0) return false;
  return num <= Number(POWER_MAX_AMOUNT);
};

/** 校验器：倍率/系数 */
export const isValidMultiplier = (m: string): boolean => {
  if (!m) return false;
  const num = Number(m);
  if (isNaN(num) || num < Number(POWER_MIN_MULTIPLIER)) return false;
  return num <= Number(POWER_MAX_MULTIPLIER);
};
