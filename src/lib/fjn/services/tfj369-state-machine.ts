/**
 * tFJ369 Service - 状态机 + 枚举 + 校验
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.2
 * 业务规则：docs/369福建老酒源代码-开发/H024-8 个 Service：Tradable Points Service tFJ369 服务.md
 *
 * tFJ369 = 369 可流通积分
 *  - 链上：SPL Token / Token-2022（由 SolanaTokenService 操作）
 *  - 链下：FjnTPointsAccount + FjnTPointsLedger + FjnConversionOrder + FjnTPointsLock
 *
 * 业务状态：
 *  - Account 状态：active | frozen | closed
 *  - Ledger 方向：earn | spend
 *  - Ledger changeType：mint | burn | trade | fee | lock | unlock | consume | admin_adjust
 *  - Lock 状态：active | unlocked | burned
 *  - Conversion 状态：created | risk_checking | approved | executed | failed | cancelled
 *  - Member 等级：standard | silver | gold | platinum | diamond
 *  - Risk 状态：normal | warning | restricted | blocked
 */

export const TPOINTS_ACCOUNT_STATUS = {
  ACTIVE: 'active',
  FROZEN: 'frozen',
  CLOSED: 'closed',
} as const;
export type FjnTPointsAccountStatus = (typeof TPOINTS_ACCOUNT_STATUS)[keyof typeof TPOINTS_ACCOUNT_STATUS];

export const TPOINTS_LEDGER_DIRECTION = {
  EARN: 'earn',
  SPEND: 'spend',
} as const;
export type FjnTPointsLedgerDirection = (typeof TPOINTS_LEDGER_DIRECTION)[keyof typeof TPOINTS_LEDGER_DIRECTION];

export const TPOINTS_LEDGER_CHANGE_TYPE = {
  MINT: 'mint',
  BURN: 'burn',
  TRADE: 'trade',
  FEE: 'fee',
  LOCK: 'lock',
  UNLOCK: 'unlock',
  CONSUME: 'consume',
  ADMIN_ADJUST: 'admin_adjust',
} as const;
export type FjnTPointsChangeType = (typeof TPOINTS_LEDGER_CHANGE_TYPE)[keyof typeof TPOINTS_LEDGER_CHANGE_TYPE];

export const TPOINTS_LOCK_TYPE = {
  TRADE: 'trade',
  CONVERT: 'convert',
  MALL_CONSUME: 'mall_consume',
  NFT_UPGRADE: 'nft_upgrade',
} as const;
export type FjnTPointsLockType = (typeof TPOINTS_LOCK_TYPE)[keyof typeof TPOINTS_LOCK_TYPE];

export const TPOINTS_LOCK_STATUS = {
  ACTIVE: 'active',
  UNLOCKED: 'unlocked',
  BURNED: 'burned',
} as const;
export type FjnTPointsLockStatus = (typeof TPOINTS_LOCK_STATUS)[keyof typeof TPOINTS_LOCK_STATUS];

export const TPOINTS_CONVERSION_STATUS = {
  CREATED: 'created',
  RISK_CHECKING: 'risk_checking',
  APPROVED: 'approved',
  EXECUTED: 'executed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;
export type FjnTPointsConversionStatus = (typeof TPOINTS_CONVERSION_STATUS)[keyof typeof TPOINTS_CONVERSION_STATUS];

export const TPOINTS_MEMBER_LEVEL = {
  STANDARD: 'standard',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond',
} as const;
export type FjnTPointsMemberLevel = (typeof TPOINTS_MEMBER_LEVEL)[keyof typeof TPOINTS_MEMBER_LEVEL];

export const TPOINTS_RISK_STATUS = {
  NORMAL: 'normal',
  WARNING: 'warning',
  RESTRICTED: 'restricted',
  BLOCKED: 'blocked',
} as const;
export type FjnTPointsRiskStatus = (typeof TPOINTS_RISK_STATUS)[keyof typeof TPOINTS_RISK_STATUS];

/** 精度（4 位小数，与 Prisma Decimal(20,4) 对齐） */
export const TPOINTS_AMOUNT_PRECISION = 4;

/** 默认 cFJ369 → tFJ369 转换比：100:1 */
export const TPOINTS_DEFAULT_CONVERT_RATIO = '100.0000';

/** 校验器 */
export const isValidTPointsAccountStatus = (v: string): v is FjnTPointsAccountStatus =>
  Object.values(TPOINTS_ACCOUNT_STATUS).includes(v as any);
export const isValidTPointsChangeType = (v: string): v is FjnTPointsChangeType =>
  Object.values(TPOINTS_LEDGER_CHANGE_TYPE).includes(v as any);
export const isValidTPointsLockType = (v: string): v is FjnTPointsLockType =>
  Object.values(TPOINTS_LOCK_TYPE).includes(v as any);
export const isValidTPointsLockStatus = (v: string): v is FjnTPointsLockStatus =>
  Object.values(TPOINTS_LOCK_STATUS).includes(v as any);
export const isValidTPointsConversionStatus = (v: string): v is FjnTPointsConversionStatus =>
  Object.values(TPOINTS_CONVERSION_STATUS).includes(v as any);
export const isValidTPointsMemberLevel = (v: string): v is FjnTPointsMemberLevel =>
  Object.values(TPOINTS_MEMBER_LEVEL).includes(v as any);
export const isValidTPointsRiskStatus = (v: string): v is FjnTPointsRiskStatus =>
  Object.values(TPOINTS_RISK_STATUS).includes(v as any);
