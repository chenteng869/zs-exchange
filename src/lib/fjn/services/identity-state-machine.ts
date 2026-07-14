/**
 * Identity Service - 状态机 + 枚举
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.1
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md §3.1
 *
 * 职责范围：
 *  - 用户注册 / 登录 / 资料
 *  - 用户状态（active/suspended/banned/closed）
 *  - 钱包绑定（Solana DID）
 *  - 推荐关系（referralCode / referredBy）
 *  - 用户设备记录
 *  - 会员等级基础（vipLevel / userType）
 *
 * 不负责：KYC 审核 / 积分 / 订单 / 奖励 / 财务
 */

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
  CLOSED: 'closed',
  PENDING_VERIFICATION: 'pending_verification',
} as const;
export type FjnUserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const USER_TYPE = {
  RETAIL: 'retail',
  VIP: 'vip',
  MERCHANT: 'merchant',
  NODE: 'node',
  INTERNAL: 'internal',
  ADMIN: 'admin',
} as const;
export type FjnUserType = (typeof USER_TYPE)[keyof typeof USER_TYPE];

export const SESSION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
  ROTATED: 'rotated',
} as const;
export type FjnSessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

export const REFERRAL_RELATION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  VOID: 'void',
} as const;
export type FjnReferralRelationStatus =
  (typeof REFERRAL_RELATION_STATUS)[keyof typeof REFERRAL_RELATION_STATUS];

export const DEVICE_BIND_STATUS = {
  BOUND: 'bound',
  UNBOUND: 'unbound',
  REVOKED: 'revoked',
} as const;
export type FjnDeviceBindStatus = (typeof DEVICE_BIND_STATUS)[keyof typeof DEVICE_BIND_STATUS];

export const DID_BIND_STATUS = {
  PENDING: 'pending',
  ANCHORED: 'anchored',
  FAILED: 'failed',
  REVOKED: 'revoked',
} as const;
export type FjnDidBindStatus = (typeof DID_BIND_STATUS)[keyof typeof DID_BIND_STATUS];

/** 用户状态机 */
export const USER_STATUS_TRANSITIONS: Record<FjnUserStatus, FjnUserStatus[]> = {
  [USER_STATUS.ACTIVE]: [
    USER_STATUS.INACTIVE,
    USER_STATUS.SUSPENDED,
    USER_STATUS.BANNED,
    USER_STATUS.CLOSED,
  ],
  [USER_STATUS.INACTIVE]: [USER_STATUS.ACTIVE, USER_STATUS.CLOSED],
  [USER_STATUS.SUSPENDED]: [USER_STATUS.ACTIVE, USER_STATUS.BANNED, USER_STATUS.CLOSED],
  [USER_STATUS.BANNED]: [USER_STATUS.CLOSED],
  [USER_STATUS.CLOSED]: [],
  [USER_STATUS.PENDING_VERIFICATION]: [USER_STATUS.ACTIVE, USER_STATUS.BANNED, USER_STATUS.CLOSED],
};

/** DID 状态机 */
export const DID_BIND_STATUS_TRANSITIONS: Record<FjnDidBindStatus, FjnDidBindStatus[]> = {
  [DID_BIND_STATUS.PENDING]: [
    DID_BIND_STATUS.ANCHORED,
    DID_BIND_STATUS.FAILED,
    DID_BIND_STATUS.REVOKED,
  ],
  [DID_BIND_STATUS.ANCHORED]: [DID_BIND_STATUS.REVOKED],
  [DID_BIND_STATUS.FAILED]: [DID_BIND_STATUS.PENDING, DID_BIND_STATUS.REVOKED],
  [DID_BIND_STATUS.REVOKED]: [],
};

/** 校验器 */
export const isValidUserStatus = (s: string): s is FjnUserStatus =>
  Object.values(USER_STATUS).includes(s as any);
export const isValidUserType = (t: string): t is FjnUserType =>
  Object.values(USER_TYPE).includes(t as any);
export const isValidSessionStatus = (s: string): s is FjnSessionStatus =>
  Object.values(SESSION_STATUS).includes(s as any);
export const isValidReferralRelationStatus = (s: string): s is FjnReferralRelationStatus =>
  Object.values(REFERRAL_RELATION_STATUS).includes(s as any);
export const isValidDeviceBindStatus = (s: string): s is FjnDeviceBindStatus =>
  Object.values(DEVICE_BIND_STATUS).includes(s as any);
export const isValidDidBindStatus = (s: string): s is FjnDidBindStatus =>
  Object.values(DID_BIND_STATUS).includes(s as any);

/** 状态流转 */
export const canTransitUserStatus = (
  from: FjnUserStatus,
  to: FjnUserStatus,
): boolean => (USER_STATUS_TRANSITIONS[from] ?? []).includes(to);
export const canTransitDidStatus = (
  from: FjnDidBindStatus,
  to: FjnDidBindStatus,
): boolean => (DID_BIND_STATUS_TRANSITIONS[from] ?? []).includes(to);

export const assertTransitUserStatus = (from: FjnUserStatus, to: FjnUserStatus): void => {
  if (!canTransitUserStatus(from, to)) {
    throw new Error(`[Identity] Illegal user status transition: ${from} -> ${to}`);
  }
};
export const assertTransitDidStatus = (from: FjnDidBindStatus, to: FjnDidBindStatus): void => {
  if (!canTransitDidStatus(from, to)) {
    throw new Error(`[Identity] Illegal DID status transition: ${from} -> ${to}`);
  }
};

/** 终态判定 */
export const isTerminalUserStatus = (s: FjnUserStatus): boolean =>
  s === USER_STATUS.CLOSED;
export const isTerminalDidStatus = (s: FjnDidBindStatus): boolean =>
  s === DID_BIND_STATUS.REVOKED;

/** 可操作判定 */
export const isUserOperable = (s: FjnUserStatus): boolean =>
  s === USER_STATUS.ACTIVE;
export const isUserLoginable = (s: FjnUserStatus): boolean =>
  s === USER_STATUS.ACTIVE || s === USER_STATUS.PENDING_VERIFICATION;

/** 默认配置 */
export const IDENTITY_DEFAULT_COUNTRY = 'CN';
export const IDENTITY_DEFAULT_VIP_LEVEL = 0;
export const IDENTITY_DEFAULT_USER_TYPE = USER_TYPE.RETAIL;
export const IDENTITY_REFERRAL_CODE_LENGTH = 8;
export const IDENTITY_PASSWORD_MIN_LENGTH = 8;
export const IDENTITY_PASSWORD_MAX_LENGTH = 128;
export const IDENTITY_USERNAME_MIN_LENGTH = 3;
export const IDENTITY_USERNAME_MAX_LENGTH = 50;

/** Session 默认过期 */
export const IDENTITY_SESSION_DEFAULT_EXPIRES_HOURS = 24;
export const IDENTITY_REFRESH_TOKEN_DEFAULT_EXPIRES_DAYS = 30;
export const IDENTITY_MAX_LOGIN_ATTEMPTS_PER_HOUR = 10;
export const IDENTITY_MAX_DEVICES_PER_USER = 10;
export const IDENTITY_MAX_DID_PER_USER = 5;
