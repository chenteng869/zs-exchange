/**
 * Identity Service - 事件定义
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.1
 *
 * 全部事件通过 outbox 模式写入 `outboxEvent` 表，由 worker 异步消费
 * 事件命名空间：`fjn.identity.*`
 */

export const IDENTITY_EVENTS = {
  // 用户生命周期
  USER_REGISTERED: 'fjn.identity.user_registered',
  USER_LOGIN: 'fjn.identity.user_login',
  USER_LOGIN_FAILED: 'fjn.identity.user_login_failed',
  USER_LOGOUT: 'fjn.identity.user_logout',
  USER_UPDATED: 'fjn.identity.user_updated',
  USER_STATUS_CHANGED: 'fjn.identity.user_status_changed',
  USER_CLOSED: 'fjn.identity.user_closed',
  // 密码
  PASSWORD_CHANGED: 'fjn.identity.password_changed',
  PASSWORD_RESET_REQUESTED: 'fjn.identity.password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'fjn.identity.password_reset_completed',
  // 推荐关系
  REFERRAL_CODE_GENERATED: 'fjn.identity.referral_code_generated',
  REFERRAL_BOUND: 'fjn.identity.referral_bound',
  REFERRAL_UNBOUND: 'fjn.identity.referral_unbound',
  // 设备
  DEVICE_BOUND: 'fjn.identity.device_bound',
  DEVICE_UNBOUND: 'fjn.identity.device_unbound',
  // 钱包/DID
  DID_BOUND: 'fjn.identity.did_bound',
  DID_ANCHORED: 'fjn.identity.did_anchored',
  DID_REVOKED: 'fjn.identity.did_revoked',
  // 会员
  VIP_LEVEL_CHANGED: 'fjn.identity.vip_level_changed',
  USER_TYPE_CHANGED: 'fjn.identity.user_type_changed',
  // Session
  SESSION_CREATED: 'fjn.identity.session_created',
  SESSION_EXPIRED: 'fjn.identity.session_expired',
  SESSION_REVOKED: 'fjn.identity.session_revoked',
  SESSION_ROTATED: 'fjn.identity.session_rotated',
} as const;
export type FjnIdentityEvent = (typeof IDENTITY_EVENTS)[keyof typeof IDENTITY_EVENTS];

export const IDENTITY_EVENT_SOURCES = {
  IDENTITY_SERVICE: 'fjn.identity.service',
  IDENTITY_API: 'fjn.identity.api',
  IDENTITY_WORKER: 'fjn.identity.worker',
} as const;
export type FjnIdentityEventSource =
  (typeof IDENTITY_EVENT_SOURCES)[keyof typeof IDENTITY_EVENT_SOURCES];

export const ALL_IDENTITY_EVENTS: FjnIdentityEvent[] = Object.values(IDENTITY_EVENTS);
export const IDENTITY_EVENT_COUNT = ALL_IDENTITY_EVENTS.length;

export const isValidIdentityEvent = (e: string): e is FjnIdentityEvent =>
  Object.values(IDENTITY_EVENTS).includes(e as any);

export const isValidIdentityEventSource = (s: string): s is FjnIdentityEventSource =>
  Object.values(IDENTITY_EVENT_SOURCES).includes(s as any);

/** Payload 类型 */
export interface UserRegisteredPayload {
  userId: string;
  username: string;
  email: string;
  phone?: string | null;
  countryCode: string;
  userType: string;
  vipLevel: number;
  referralCode?: string | null;
  referredBy?: string | null;
  registeredAt: string;
}

export interface UserLoginPayload {
  userId: string;
  username: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId: string;
  loginAt: string;
}

export interface UserLoginFailedPayload {
  username: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  reason: string;
  failedAt: string;
}

export interface UserLogoutPayload {
  userId: string;
  sessionId: string;
  loggedOutAt: string;
}

export interface UserUpdatedPayload {
  userId: string;
  changedFields: string[];
  updatedAt: string;
}

export interface UserStatusChangedPayload {
  userId: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  operatorId?: string | null;
  changedAt: string;
}

export interface UserClosedPayload {
  userId: string;
  reason: string;
  closedAt: string;
  operatorId?: string | null;
}

export interface PasswordChangedPayload {
  userId: string;
  changedAt: string;
}

export interface PasswordResetRequestedPayload {
  userId: string;
  email: string;
  resetToken: string;
  expiresAt: string;
}

export interface PasswordResetCompletedPayload {
  userId: string;
  completedAt: string;
}

export interface ReferralCodeGeneratedPayload {
  userId: string;
  referralCode: string;
  generatedAt: string;
}

export interface ReferralBoundPayload {
  userId: string;
  referredBy: string;
  referralCode: string;
  boundAt: string;
}

export interface ReferralUnboundPayload {
  userId: string;
  unboundBy: string;
  reason: string;
  unboundAt: string;
}

export interface DeviceBoundPayload {
  userId: string;
  deviceId: string;
  deviceName?: string | null;
  platform?: string | null;
  boundAt: string;
}

export interface DeviceUnboundPayload {
  userId: string;
  deviceId: string;
  reason: string;
  unboundAt: string;
}

export interface DidBoundPayload {
  userId: string;
  didId: string;
  did: string;
  chainType: string;
  chainId: string;
  publicKey: string;
  boundAt: string;
}

export interface DidAnchoredPayload {
  userId: string;
  didId: string;
  did: string;
  txHash: string;
  blockNo: string;
  anchoredAt: string;
}

export interface DidRevokedPayload {
  userId: string;
  didId: string;
  did: string;
  reason: string;
  revokedAt: string;
}

export interface VipLevelChangedPayload {
  userId: string;
  fromLevel: number;
  toLevel: number;
  reason: string;
  changedAt: string;
}

export interface UserTypeChangedPayload {
  userId: string;
  fromType: string;
  toType: string;
  reason: string;
  changedAt: string;
}

export interface SessionCreatedPayload {
  userId: string;
  sessionId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface SessionExpiredPayload {
  userId: string;
  sessionId: string;
  expiredAt: string;
}

export interface SessionRevokedPayload {
  userId: string;
  sessionId: string;
  reason: string;
  revokedAt: string;
}

export interface SessionRotatedPayload {
  userId: string;
  oldSessionId: string;
  newSessionId: string;
  rotatedAt: string;
}

export type IdentityEventPayload =
  | UserRegisteredPayload
  | UserLoginPayload
  | UserLoginFailedPayload
  | UserLogoutPayload
  | UserUpdatedPayload
  | UserStatusChangedPayload
  | UserClosedPayload
  | PasswordChangedPayload
  | PasswordResetRequestedPayload
  | PasswordResetCompletedPayload
  | ReferralCodeGeneratedPayload
  | ReferralBoundPayload
  | ReferralUnboundPayload
  | DeviceBoundPayload
  | DeviceUnboundPayload
  | DidBoundPayload
  | DidAnchoredPayload
  | DidRevokedPayload
  | VipLevelChangedPayload
  | UserTypeChangedPayload
  | SessionCreatedPayload
  | SessionExpiredPayload
  | SessionRevokedPayload
  | SessionRotatedPayload;
