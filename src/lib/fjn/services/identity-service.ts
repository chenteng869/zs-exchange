/**
 * Identity Service - 业务主体
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
 * 链下真相源：CoreUser / CoreSession / CoreUserDid
 * 链上交互：Solana DID Document 锚定（通过 src/lib/solana/did/）
 */

import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  USER_STATUS,
  USER_TYPE,
  SESSION_STATUS,
  DID_BIND_STATUS,
  IDENTITY_DEFAULT_COUNTRY,
  IDENTITY_DEFAULT_VIP_LEVEL,
  IDENTITY_DEFAULT_USER_TYPE,
  IDENTITY_REFERRAL_CODE_LENGTH,
  IDENTITY_PASSWORD_MIN_LENGTH,
  IDENTITY_PASSWORD_MAX_LENGTH,
  IDENTITY_USERNAME_MIN_LENGTH,
  IDENTITY_USERNAME_MAX_LENGTH,
  IDENTITY_SESSION_DEFAULT_EXPIRES_HOURS,
  IDENTITY_REFRESH_TOKEN_DEFAULT_EXPIRES_DAYS,
  IDENTITY_MAX_LOGIN_ATTEMPTS_PER_HOUR,
  IDENTITY_MAX_DEVICES_PER_USER,
  IDENTITY_MAX_DID_PER_USER,
  isValidUserStatus,
  isValidUserType,
  isValidDidBindStatus,
  canTransitUserStatus,
  assertTransitUserStatus,
  canTransitDidStatus,
  assertTransitDidStatus,
  isTerminalUserStatus,
  isUserOperable,
  isUserLoginable,
  type FjnUserStatus,
  type FjnUserType,
  type FjnSessionStatus,
  type FjnDidBindStatus,
} from './identity-state-machine';
import {
  IDENTITY_EVENTS,
  IDENTITY_EVENT_SOURCES,
  type FjnIdentityEventSource,
} from './identity-events';
import {
  IDENTITY_ERROR_CODES,
  UserNotFoundError,
  UserAlreadyExistsError,
  UserStatusInvalidError,
  UserNotOperableError,
  UserNotLoginableError,
  UserClosedError,
  UsernameRequiredError,
  UsernameInvalidError,
  UsernameTooShortError,
  UsernameTooLongError,
  UsernameDuplicateError,
  EmailRequiredError,
  EmailInvalidError,
  EmailDuplicateError,
  PasswordRequiredError,
  PasswordTooShortError,
  PasswordTooLongError,
  PasswordIncorrectError,
  PhoneInvalidError,
  CountryCodeInvalidError,
  LoginFailedError,
  LoginAttemptsExceededError,
  SessionNotFoundError,
  SessionExpiredError,
  SessionRevokedError,
  SessionInvalidError,
  PasswordResetTokenInvalidError,
  PasswordResetTokenExpiredError,
  ReferralCodeInvalidError,
  ReferralCodeDuplicateError,
  ReferralRelationExistsError,
  ReferralCannotBindSelfError,
  ReferralBindExpiredError,
  DeviceNotFoundError,
  DeviceAlreadyBoundError,
  DeviceLimitExceededError,
  DidNotFoundError,
  DidAlreadyBoundError,
  DidLimitExceededError,
  DidInvalidError,
  DidPublicKeyMismatchError,
  DidAnchorFailedError,
  VipLevelInvalidError,
  UserTypeInvalidError,
  StatusChangeForbiddenError,
  CloseForbiddenError,
  SelfActionForbiddenError,
} from './identity-errors';

// ============================================================
// 1. 入参 / 返回类型
// ============================================================

/** 注册 */
export interface RegisterInput {
  username: string;
  email: string;
  passwordHash: string; // 外部已 hash
  phone?: string;
  countryCode?: string;
  userType?: FjnUserType;
  vipLevel?: number;
  referredByCode?: string;
  ipAddress?: string;
  userAgent?: string;
}
export interface RegisterResult {
  userId: string;
  username: string;
  email: string;
  referralCode: string;
  referredBy: string | null;
  status: FjnUserStatus;
  vipLevel: number;
  userType: FjnUserType;
  createdAt: Date;
}

/** 登录 */
export interface LoginInput {
  usernameOrEmail: string;
  passwordHash: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
}
export interface LoginResult {
  userId: string;
  username: string;
  email: string;
  status: FjnUserStatus;
  sessionId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  lastLoginAt: Date;
}

/** 资料更新 */
export interface UpdateProfileInput {
  userId: string;
  phone?: string;
  countryCode?: string;
  updateFields?: string[];
}

/** 状态变更 */
export interface ChangeStatusInput {
  userId: string;
  toStatus: FjnUserStatus;
  reason?: string;
  operatorId?: string;
}

/** 关闭用户 */
export interface CloseUserInput {
  userId: string;
  reason: string;
  operatorId?: string;
}

/** 密码变更 */
export interface ChangePasswordInput {
  userId: string;
  newPasswordHash: string;
  oldPasswordHash?: string; // 强制验证时必填
}

/** 密码重置申请 */
export interface RequestPasswordResetInput {
  email: string;
}
export interface RequestPasswordResetResult {
  userId: string;
  email: string;
  resetToken: string;
  expiresAt: Date;
}

/** 密码重置完成 */
export interface CompletePasswordResetInput {
  resetToken: string;
  newPasswordHash: string;
}

/** 推荐关系绑定 */
export interface BindReferralInput {
  userId: string;
  referralCode: string;
}

/** 设备绑定 */
export interface BindDeviceInput {
  userId: string;
  deviceId: string;
  deviceName?: string;
  platform?: string;
  fingerprint?: string;
}

/** DID 绑定 */
export interface BindDidInput {
  userId: string;
  did: string;
  chainType: string;
  chainId: string;
  publicKey: string;
  keyRef?: string;
  document: Prisma.InputJsonValue;
}

/** DID 锚定 */
export interface AnchorDidInput {
  userId: string;
  didId: string;
  txHash: string;
  blockNo: string;
}

/** VIP 等级变更 */
export interface ChangeVipLevelInput {
  userId: string;
  toLevel: number;
  reason: string;
}

/** User 摘要 */
export interface UserSummary {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  countryCode: string;
  status: FjnUserStatus;
  userType: FjnUserType;
  vipLevel: number;
  kycLevel: number;
  referralCode: string | null;
  referredBy: string | null;
  lastLoginAt: Date | null;
  totpEnabled: boolean;
  tradingEnabled: boolean;
  withdrawalEnabled: boolean;
  depositEnabled: boolean;
  createdAt: Date;
}

// ============================================================
// 2. 内部辅助：限流（内存版，生产应换 Redis）
// ============================================================

interface LoginAttemptRecord {
  count: number;
  resetAt: number;
}
const loginAttempts = new Map<string, LoginAttemptRecord>();

const checkLoginAttempt = (key: string): void => {
  const now = Date.now();
  const rec = loginAttempts.get(key);
  if (!rec) {
    loginAttempts.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return;
  }
  if (now >= rec.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return;
  }
  rec.count++;
  if (rec.count > IDENTITY_MAX_LOGIN_ATTEMPTS_PER_HOUR) {
    throw new LoginAttemptsExceededError({ key, count: rec.count });
  }
};

const clearLoginAttempt = (key: string): void => {
  loginAttempts.delete(key);
};

// ============================================================
// 3. 内部辅助：密码 hash（生产应换 argon2/bcrypt）
// ============================================================

const verifyPassword = (passwordHash: string, stored: string): boolean => {
  // 此处假设 passwordHash 与 stored 已经是 hash 后的字符串，
  // 实际项目中应使用 argon2.verify(stored, password) 或 bcrypt.compare
  return crypto.timingSafeEqual(Buffer.from(passwordHash), Buffer.from(stored));
};

// ============================================================
// 4. Service 主体
// ============================================================

export class FjnIdentityService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnIdentityService' });
  }

  // ----- 事件发射 -----
  private async emitEvent(
    tx: any,
    eventType: string,
    payload: Record<string, unknown>,
    source: FjnIdentityEventSource = IDENTITY_EVENT_SOURCES.IDENTITY_SERVICE,
  ): Promise<void> {
    await (tx as any).outboxEvent.create({
      data: {
        eventType,
        payload: { ...payload, occurred_at: new Date().toISOString(), source },
        status: 'pending',
        retryCount: 0,
      },
    });
  }

  // ----- 字段校验 -----
  private validateUsername(username: string): void {
    if (!username) throw new UsernameRequiredError();
    if (username.length < IDENTITY_USERNAME_MIN_LENGTH) {
      throw new UsernameTooShortError({ min: IDENTITY_USERNAME_MIN_LENGTH });
    }
    if (username.length > IDENTITY_USERNAME_MAX_LENGTH) {
      throw new UsernameTooLongError({ max: IDENTITY_USERNAME_MAX_LENGTH });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new UsernameInvalidError({ username });
    }
  }

  private validateEmail(email: string): void {
    if (!email) throw new EmailRequiredError();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new EmailInvalidError({ email });
    }
  }

  private validatePasswordHash(hash: string): void {
    if (!hash) throw new PasswordRequiredError();
    // 假设 hash 是 64 字符 hex (sha256) 或更长的 argon2/bcrypt 字符串
    if (hash.length < 64) {
      throw new PasswordTooShortError({ min: 64 });
    }
    if (hash.length > IDENTITY_PASSWORD_MAX_LENGTH * 2) {
      throw new PasswordTooLongError({ max: IDENTITY_PASSWORD_MAX_LENGTH * 2 });
    }
  }

  private validatePhone(phone?: string): void {
    if (phone && !/^\+?[0-9]{7,20}$/.test(phone)) {
      throw new PhoneInvalidError({ phone });
    }
  }

  private validateCountryCode(countryCode?: string): void {
    if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
      throw new CountryCodeInvalidError({ countryCode });
    }
  }

  // ----- 推荐码生成 -----
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除易混字符
    let code = '';
    for (let i = 0; i < IDENTITY_REFERRAL_CODE_LENGTH; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  // ----- Session Token 生成 -----
  private generateToken(): string {
    return crypto.randomBytes(48).toString('base64url');
  }

  // ----- 摘要 -----
  toSummary(user: any): UserSummary {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone ?? null,
      countryCode: user.countryCode,
      status: user.status,
      userType: user.userType,
      vipLevel: user.vipLevel,
      kycLevel: user.kycLevel,
      referralCode: user.referralCode ?? null,
      referredBy: user.referredBy ?? null,
      lastLoginAt: user.lastLoginAt ?? null,
      totpEnabled: user.totpEnabled,
      tradingEnabled: user.tradingEnabled,
      withdrawalEnabled: user.withdrawalEnabled,
      depositEnabled: user.depositEnabled,
      createdAt: user.createdAt,
    };
  }

  // ==========================================================
  // 5. 注册 / 登录 / 登出
  // ==========================================================

  /** 注册 */
  async register(input: RegisterInput): Promise<RegisterResult> {
    this.validateUsername(input.username);
    this.validateEmail(input.email);
    this.validatePasswordHash(input.passwordHash);
    this.validatePhone(input.phone);
    this.validateCountryCode(input.countryCode);
    const userType = input.userType ?? (IDENTITY_DEFAULT_USER_TYPE as FjnUserType);
    if (!isValidUserType(userType)) {
      throw new UserTypeInvalidError({ userType });
    }
    const vipLevel = input.vipLevel ?? IDENTITY_DEFAULT_VIP_LEVEL;
    if (vipLevel < 0) throw new VipLevelInvalidError({ vipLevel });
    const countryCode = input.countryCode ?? IDENTITY_DEFAULT_COUNTRY;

    return this.withTransaction(async (tx) => {
      // 1. 检查重复
      const existing = await (tx as any).coreUser.findFirst({
        where: {
          OR: [{ username: input.username }, { email: input.email }],
        },
      });
      if (existing) {
        if (existing.username === input.username) {
          throw new UsernameDuplicateError({ username: input.username });
        }
        throw new EmailDuplicateError({ email: input.email });
      }

      // 2. 校验推荐码
      let referredByUserId: string | null = null;
      if (input.referredByCode) {
        const referrer = await (tx as any).coreUser.findUnique({
          where: { referralCode: input.referredByCode },
        });
        if (!referrer) {
          throw new ReferralCodeInvalidError({ code: input.referredByCode });
        }
        if (referrer.status !== USER_STATUS.ACTIVE) {
          throw new ReferralCodeInvalidError({ code: input.referredByCode, referrerStatus: referrer.status });
        }
        referredByUserId = referrer.id;
      }

      // 3. 生成唯一推荐码
      let referralCode: string = this.generateReferralCode();
      for (let i = 0; i < 5; i++) {
        const dup = await (tx as any).coreUser.findUnique({ where: { referralCode } });
        if (!dup) break;
        referralCode = this.generateReferralCode();
      }
      // 仍冲突则抛错（极小概率）
      const finalDup = await (tx as any).coreUser.findUnique({ where: { referralCode } });
      if (finalDup) {
        throw new ReferralCodeDuplicateError({ code: referralCode });
      }

      // 4. 创建用户
      const created = await (tx as any).coreUser.create({
        data: {
          username: input.username,
          email: input.email,
          passwordHash: input.passwordHash,
          phone: input.phone ?? null,
          countryCode,
          status: USER_STATUS.PENDING_VERIFICATION,
          kycLevel: 0,
          userType,
          vipLevel,
          referralCode,
          referredBy: referredByUserId,
          tradingEnabled: false,
          withdrawalEnabled: false,
          depositEnabled: true,
        },
      });

      // 5. 发事件
      await this.emitEvent(tx, IDENTITY_EVENTS.USER_REGISTERED, {
        userId: created.id,
        username: created.username,
        email: created.email,
        phone: created.phone,
        countryCode: created.countryCode,
        userType: created.userType,
        vipLevel: created.vipLevel,
        referralCode: created.referralCode,
        referredBy: created.referredBy,
        registeredAt: created.createdAt.toISOString(),
      });

      if (created.referredBy) {
        await this.emitEvent(tx, IDENTITY_EVENTS.REFERRAL_BOUND, {
          userId: created.id,
          referredBy: created.referredBy,
          referralCode: created.referralCode,
          boundAt: new Date().toISOString(),
        });
      }

      this.log('info', `user registered: ${created.username}`, { userId: created.id });

      return {
        userId: created.id,
        username: created.username,
        email: created.email,
        referralCode: created.referralCode!,
        referredBy: created.referredBy,
        status: created.status,
        vipLevel: created.vipLevel,
        userType: created.userType,
        createdAt: created.createdAt,
      };
    });
  }

  /** 登录 */
  async login(input: LoginInput): Promise<LoginResult> {
    if (!input.usernameOrEmail) {
      throw new UsernameRequiredError();
    }
    if (!input.passwordHash) {
      throw new PasswordRequiredError();
    }

    // 限流检查
    const attemptKey = `${input.usernameOrEmail}:${input.ipAddress ?? 'unknown'}`;
    try {
      checkLoginAttempt(attemptKey);
    } catch (e) {
      // 业务异常向上抛
      throw e;
    }

    return this.withTransaction(async (tx) => {
      // 1. 查找用户
      const user = await (tx as any).coreUser.findFirst({
        where: {
          OR: [{ username: input.usernameOrEmail }, { email: input.usernameOrEmail }],
        },
      });

      if (!user) {
        await this.emitEvent(tx, IDENTITY_EVENTS.USER_LOGIN_FAILED, {
          username: input.usernameOrEmail,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          reason: 'user_not_found',
          failedAt: new Date().toISOString(),
        });
        throw new LoginFailedError({ reason: 'user_not_found' });
      }

      // 2. 校验状态
      if (!isUserLoginable(user.status)) {
        if (isTerminalUserStatus(user.status)) {
          throw new UserClosedError({ userId: user.id });
        }
        throw new UserNotLoginableError({ userId: user.id, status: user.status });
      }

      // 3. 校验密码
      try {
        if (!verifyPassword(input.passwordHash, user.passwordHash)) {
          throw new PasswordIncorrectError();
        }
      } catch (e) {
        await this.emitEvent(tx, IDENTITY_EVENTS.USER_LOGIN_FAILED, {
          username: input.usernameOrEmail,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          reason: 'password_incorrect',
          failedAt: new Date().toISOString(),
        });
        throw new PasswordIncorrectError();
      }

      // 4. 创建 session
      const token = this.generateToken();
      const refreshToken = this.generateToken();
      const expiresAt = new Date(Date.now() + IDENTITY_SESSION_DEFAULT_EXPIRES_HOURS * 3600 * 1000);

      const session = await (tx as any).coreSession.create({
        data: {
          userId: user.id,
          token,
          refreshToken,
          status: SESSION_STATUS.ACTIVE,
          expiresAt,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });

      // 5. 更新 lastLoginAt
      const now = new Date();
      await (tx as any).coreUser.update({
        where: { id: user.id },
        data: { lastLoginAt: now },
      });

      // 6. 事件
      await this.emitEvent(tx, IDENTITY_EVENTS.USER_LOGIN, {
        userId: user.id,
        username: user.username,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        sessionId: session.id,
        loginAt: now.toISOString(),
      });
      await this.emitEvent(tx, IDENTITY_EVENTS.SESSION_CREATED, {
        userId: user.id,
        sessionId: session.id,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      });

      clearLoginAttempt(attemptKey);
      this.log('info', `user login: ${user.username}`, { userId: user.id, sessionId: session.id });

      return {
        userId: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        sessionId: session.id,
        token: session.token,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
        lastLoginAt: now,
      };
    });
  }

  /** 登出 */
  async logout(userId: string, sessionId: string): Promise<void> {
    return this.withTransaction(async (tx) => {
      const session = await (tx as any).coreSession.findUnique({ where: { id: sessionId } });
      if (!session || session.userId !== userId) {
        throw new SessionNotFoundError({ sessionId });
      }
      await (tx as any).coreSession.update({
        where: { id: sessionId },
        data: { status: SESSION_STATUS.REVOKED },
      });
      await this.emitEvent(tx, IDENTITY_EVENTS.USER_LOGOUT, {
        userId,
        sessionId,
        loggedOutAt: new Date().toISOString(),
      });
      await this.emitEvent(tx, IDENTITY_EVENTS.SESSION_REVOKED, {
        userId,
        sessionId,
        reason: 'user_logout',
        revokedAt: new Date().toISOString(),
      });
      this.log('info', `user logout: ${userId}`, { sessionId });
    });
  }

  // ==========================================================
  // 6. 资料 / 状态
  // ==========================================================

  /** 更新资料 */
  async updateProfile(input: UpdateProfileInput): Promise<UserSummary> {
    if (!input.userId) throw new UserNotFoundError();
    this.validatePhone(input.phone);
    this.validateCountryCode(input.countryCode);

    return this.withTransaction(async (tx) => {
      const user = await (tx as any).coreUser.findUnique({ where: { id: input.userId } });
      if (!user) throw new UserNotFoundError({ userId: input.userId });
      if (!isUserOperable(user.status)) {
        throw new UserNotOperableError({ userId: input.userId, status: user.status });
      }
      const updateData: Record<string, unknown> = {};
      const changedFields: string[] = [];
      if (input.phone !== undefined && input.phone !== user.phone) {
        updateData.phone = input.phone;
        changedFields.push('phone');
      }
      if (input.countryCode !== undefined && input.countryCode !== user.countryCode) {
        updateData.countryCode = input.countryCode;
        changedFields.push('countryCode');
      }
      if (changedFields.length === 0) {
        return this.toSummary(user);
      }
      const updated = await (tx as any).coreUser.update({
        where: { id: input.userId },
        data: updateData,
      });
      await this.emitEvent(tx, IDENTITY_EVENTS.USER_UPDATED, {
        userId: input.userId,
        changedFields,
        updatedAt: new Date().toISOString(),
      });
      this.log('info', `user updated: ${input.userId}`, { changedFields });
      return this.toSummary(updated);
    });
  }

  /** 变更状态 */
  async changeStatus(input: ChangeStatusInput): Promise<UserSummary> {
    if (!isValidUserStatus(input.toStatus)) {
      throw new UserStatusInvalidError({ toStatus: input.toStatus });
    }
    return this.withTransaction(async (tx) => {
      const user = await (tx as any).coreUser.findUnique({ where: { id: input.userId } });
      if (!user) throw new UserNotFoundError({ userId: input.userId });
      if (!canTransitUserStatus(user.status, input.toStatus)) {
        throw new StatusChangeForbiddenError({
          userId: input.userId,
          from: user.status,
          to: input.toStatus,
        });
      }
      assertTransitUserStatus(user.status, input.toStatus);
      const updated = await (tx as any).coreUser.update({
        where: { id: input.userId },
        data: { status: input.toStatus },
      });
      await this.emitEvent(tx, IDENTITY_EVENTS.USER_STATUS_CHANGED, {
        userId: input.userId,
        fromStatus: user.status,
        toStatus: input.toStatus,
        reason: input.reason,
        operatorId: input.operatorId,
        changedAt: new Date().toISOString(),
      });
      this.log('info', `user status changed: ${input.userId}`, {
        from: user.status,
        to: input.toStatus,
        reason: input.reason,
      });
      return this.toSummary(updated);
    });
  }

  /** 关闭用户 */
  async closeUser(input: CloseUserInput): Promise<UserSummary> {
    if (!input.reason) {
      throw new CloseForbiddenError({ userId: input.userId, reason: 'required' });
    }
    return this.withTransaction(async (tx) => {
      const user = await (tx as any).coreUser.findUnique({ where: { id: input.userId } });
      if (!user) throw new UserNotFoundError({ userId: input.userId });
      if (isTerminalUserStatus(user.status)) {
        throw new CloseForbiddenError({ userId: input.userId, currentStatus: user.status });
      }
      assertTransitUserStatus(user.status, USER_STATUS.CLOSED);
      const updated = await (tx as any).coreUser.update({
        where: { id: input.userId },
        data: { status: USER_STATUS.CLOSED },
      });
      await this.emitEvent(tx, IDENTITY_EVENTS.USER_STATUS_CHANGED, {
        userId: input.userId,
        fromStatus: user.status,
        toStatus: USER_STATUS.CLOSED,
        reason: input.reason,
        operatorId: input.operatorId,
        changedAt: new Date().toISOString(),
      });
      await this.emitEvent(tx, IDENTITY_EVENTS.USER_CLOSED, {
        userId: input.userId,
        reason: input.reason,
        closedAt: new Date().toISOString(),
        operatorId: input.operatorId,
      });
      this.log('info', `user closed: ${input.userId}`, { reason: input.reason });
      return this.toSummary(updated);
    });
  }

  // ==========================================================
  // 7. 密码
  // ==========================================================

  /** 修改密码 */
  async changePassword(input: ChangePasswordInput): Promise<void> {
    this.validatePasswordHash(input.newPasswordHash);
    return this.withTransaction(async (tx) => {
      const user = await (tx as any).coreUser.findUnique({ where: { id: input.userId } });
      if (!user) throw new UserNotFoundError({ userId: input.userId });
      if (input.oldPasswordHash) {
        if (!verifyPassword(input.oldPasswordHash, user.passwordHash)) {
          throw new PasswordIncorrectError();
        }
      }
      await (tx as any).coreUser.update({
        where: { id: input.userId },
        data: { passwordHash: input.newPasswordHash },
      });
      // 撤销所有 session
      await (tx as any).coreSession.updateMany({
        where: { userId: input.userId, status: SESSION_STATUS.ACTIVE },
        data: { status: SESSION_STATUS.REVOKED },
      });
      await this.emitEvent(tx, IDENTITY_EVENTS.PASSWORD_CHANGED, {
        userId: input.userId,
        changedAt: new Date().toISOString(),
      });
      this.log('info', `password changed: ${input.userId}`);
    });
  }

  /** 申请密码重置 */
  async requestPasswordReset(input: RequestPasswordResetInput): Promise<RequestPasswordResetResult | null> {
    this.validateEmail(input.email);
    return this.withTransaction(async (tx) => {
      const user = await (tx as any).coreUser.findUnique({ where: { email: input.email } });
      if (!user) {
        // 防止枚举攻击：返回 null 而非 throw
        return null;
      }
      const resetToken = crypto.randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 小时
      // 实际项目应存 password_reset_tokens 表
      await this.emitEvent(tx, IDENTITY_EVENTS.PASSWORD_RESET_REQUESTED, {
        userId: user.id,
        email: user.email,
        resetToken,
        expiresAt: expiresAt.toISOString(),
      });
      this.log('info', `password reset requested: ${user.id}`);
      return {
        userId: user.id,
        email: user.email,
        resetToken,
        expiresAt,
      };
    });
  }

  /** 完成密码重置 */
  async completePasswordReset(input: CompletePasswordResetInput): Promise<void> {
    if (!input.resetToken || !input.newPasswordHash) {
      throw new PasswordResetTokenInvalidError();
    }
    this.validatePasswordHash(input.newPasswordHash);
    // 实际项目应查询 password_reset_tokens 表，校验 token 与未过期
    // 此处仅做占位实现
    await this.emitEvent(null as any, IDENTITY_EVENTS.PASSWORD_RESET_COMPLETED, {
      userId: 'unknown',
      completedAt: new Date().toISOString(),
    });
  }

  // ==========================================================
  // 8. 推荐关系
  // ==========================================================

  /** 绑定推荐关系 */
  async bindReferral(input: BindReferralInput): Promise<void> {
    if (!input.userId) throw new UserNotFoundError();
    if (!input.referralCode) throw new ReferralCodeInvalidError();

    return this.withTransaction(async (tx) => {
      const user = await (tx as any).coreUser.findUnique({ where: { id: input.userId } });
      if (!user) throw new UserNotFoundError({ userId: input.userId });
      if (user.referredBy) {
        throw new ReferralRelationExistsError({ userId: input.userId, referredBy: user.referredBy });
      }
      const referrer = await (tx as any).coreUser.findUnique({
        where: { referralCode: input.referralCode },
      });
      if (!referrer) throw new ReferralCodeInvalidError({ code: input.referralCode });
      if (referrer.id === input.userId) {
        throw new ReferralCannotBindSelfError();
      }
      if (referrer.status !== USER_STATUS.ACTIVE) {
        throw new ReferralCodeInvalidError({ code: input.referralCode, referrerStatus: referrer.status });
      }
      await (tx as any).coreUser.update({
        where: { id: input.userId },
        data: { referredBy: referrer.id },
      });
      await this.emitEvent(tx, IDENTITY_EVENTS.REFERRAL_BOUND, {
        userId: input.userId,
        referredBy: referrer.id,
        referralCode: input.referralCode,
        boundAt: new Date().toISOString(),
      });
      this.log('info', `referral bound: ${input.userId} -> ${referrer.id}`);
    });
  }

  // ==========================================================
  // 9. 设备
  // ==========================================================

  /** 绑定设备 */
  async bindDevice(input: BindDeviceInput): Promise<{ deviceId: string; userId: string }> {
    return this.withTransaction(async (tx) => {
      const user = await (tx as any).coreUser.findUnique({ where: { id: input.userId } });
      if (!user) throw new UserNotFoundError({ userId: input.userId });
      if (!isUserOperable(user.status)) {
        throw new UserNotOperableError({ userId: input.userId, status: user.status });
      }
      // 校验设备数量
      const count = await (tx as any).coreSession.count({
        where: { userId: input.userId, deviceId: input.deviceId },
      });
      if (count > IDENTITY_MAX_DEVICES_PER_USER) {
        throw new DeviceLimitExceededError({ userId: input.userId, max: IDENTITY_MAX_DEVICES_PER_USER });
      }
      // 实际项目应存 coreUserDevice 表
      await this.emitEvent(tx, IDENTITY_EVENTS.DEVICE_BOUND, {
        userId: input.userId,
        deviceId: input.deviceId,
        deviceName: input.deviceName ?? null,
        platform: input.platform ?? null,
        boundAt: new Date().toISOString(),
      });
      this.log('info', `device bound: ${input.userId}`, { deviceId: input.deviceId });
      return { deviceId: input.deviceId, userId: input.userId };
    });
  }

  /** 解绑设备 */
  async unbindDevice(userId: string, deviceId: string, reason: string): Promise<void> {
    if (!reason) throw new DeviceNotFoundError({ reason: 'required' });
    return this.withTransaction(async (tx) => {
      await this.emitEvent(tx, IDENTITY_EVENTS.DEVICE_UNBOUND, {
        userId,
        deviceId,
        reason,
        unboundAt: new Date().toISOString(),
      });
      this.log('info', `device unbound: ${userId}`, { deviceId, reason });
    });
  }

  // ==========================================================
  // 10. DID / 钱包
  // ==========================================================

  /** 绑定 DID（链下注册） */
  async bindDid(input: BindDidInput): Promise<{ didId: string; did: string }> {
    if (!input.did || !input.did.startsWith('did:')) {
      throw new DidInvalidError({ did: input.did });
    }
    return this.withTransaction(async (tx) => {
      const user = await (tx as any).coreUser.findUnique({ where: { id: input.userId } });
      if (!user) throw new UserNotFoundError({ userId: input.userId });

      // 校验 DID 数量
      const didCount = await (tx as any).coreUserDid.count({
        where: { userId: input.userId, anchorStatus: { not: 'revoked' } },
      });
      if (didCount >= IDENTITY_MAX_DID_PER_USER) {
        throw new DidLimitExceededError({ userId: input.userId, max: IDENTITY_MAX_DID_PER_USER });
      }

      // 校验 DID 唯一
      const existing = await (tx as any).coreUserDid.findUnique({ where: { did: input.did } });
      if (existing) {
        throw new DidAlreadyBoundError({ did: input.did, userId: existing.userId });
      }

      // 创建 DID
      const didRec = await (tx as any).coreUserDid.create({
        data: {
          userId: input.userId,
          did: input.did,
          method: 'solana',
          chainType: input.chainType,
          chainId: input.chainId,
          publicKey: input.publicKey,
          keyRef: input.keyRef ?? null,
          document: input.document,
          anchorStatus: DID_BIND_STATUS.PENDING,
        },
      });

      await this.emitEvent(tx, IDENTITY_EVENTS.DID_BOUND, {
        userId: input.userId,
        didId: didRec.id,
        did: didRec.did,
        chainType: didRec.chainType,
        chainId: didRec.chainId,
        publicKey: didRec.publicKey,
        boundAt: new Date().toISOString(),
      });

      this.log('info', `did bound: ${didRec.did}`, { userId: input.userId });
      return { didId: didRec.id, did: didRec.did };
    });
  }

  /** 锚定 DID（链上确认） */
  async anchorDid(input: AnchorDidInput): Promise<void> {
    return this.withTransaction(async (tx) => {
      const didRec = await (tx as any).coreUserDid.findUnique({ where: { id: input.didId } });
      if (!didRec) throw new DidNotFoundError({ didId: input.didId });
      if (didRec.userId !== input.userId) {
        throw new DidPublicKeyMismatchError();
      }
      if (!canTransitDidStatus(didRec.anchorStatus, DID_BIND_STATUS.ANCHORED)) {
        throw new DidAnchorFailedError({
          didId: input.didId,
          fromStatus: didRec.anchorStatus,
        });
      }
      assertTransitDidStatus(didRec.anchorStatus, DID_BIND_STATUS.ANCHORED);
      await (tx as any).coreUserDid.update({
        where: { id: input.didId },
        data: {
          anchorStatus: DID_BIND_STATUS.ANCHORED,
          anchorTxHash: input.txHash,
          anchorBlockNo: BigInt(input.blockNo),
          anchorTimestamp: new Date(),
          lastAnchoredAt: new Date(),
        },
      });
      await this.emitEvent(tx, IDENTITY_EVENTS.DID_ANCHORED, {
        userId: input.userId,
        didId: input.didId,
        did: didRec.did,
        txHash: input.txHash,
        blockNo: input.blockNo,
        anchoredAt: new Date().toISOString(),
      });
      this.log('info', `did anchored: ${didRec.did}`, { txHash: input.txHash });
    });
  }

  // ==========================================================
  // 11. 会员等级
  // ==========================================================

  /** 变更 VIP 等级 */
  async changeVipLevel(input: ChangeVipLevelInput): Promise<UserSummary> {
    if (input.toLevel < 0) throw new VipLevelInvalidError({ toLevel: input.toLevel });
    return this.withTransaction(async (tx) => {
      const user = await (tx as any).coreUser.findUnique({ where: { id: input.userId } });
      if (!user) throw new UserNotFoundError({ userId: input.userId });
      if (user.vipLevel === input.toLevel) {
        return this.toSummary(user);
      }
      const updated = await (tx as any).coreUser.update({
        where: { id: input.userId },
        data: { vipLevel: input.toLevel },
      });
      await this.emitEvent(tx, IDENTITY_EVENTS.VIP_LEVEL_CHANGED, {
        userId: input.userId,
        fromLevel: user.vipLevel,
        toLevel: input.toLevel,
        reason: input.reason,
        changedAt: new Date().toISOString(),
      });
      this.log('info', `vip level changed: ${input.userId}`, {
        from: user.vipLevel,
        to: input.toLevel,
      });
      return this.toSummary(updated);
    });
  }

  // ==========================================================
  // 12. 查询
  // ==========================================================

  /** 获取用户 */
  async getUserById(userId: string): Promise<UserSummary | null> {
    const user = await (this.prisma as any).coreUser.findUnique({ where: { id: userId } });
    return user ? this.toSummary(user) : null;
  }

  /** 按 username 查询 */
  async getUserByUsername(username: string): Promise<UserSummary | null> {
    const user = await (this.prisma as any).coreUser.findUnique({ where: { username } });
    return user ? this.toSummary(user) : null;
  }

  /** 按 email 查询 */
  async getUserByEmail(email: string): Promise<UserSummary | null> {
    const user = await (this.prisma as any).coreUser.findUnique({ where: { email } });
    return user ? this.toSummary(user) : null;
  }

  /** 按 referralCode 查询 */
  async getUserByReferralCode(referralCode: string): Promise<UserSummary | null> {
    const user = await (this.prisma as any).coreUser.findUnique({ where: { referralCode } });
    return user ? this.toSummary(user) : null;
  }

  /** 列出用户（管理后台） */
  async listUsers(input: {
    status?: FjnUserStatus;
    userType?: FjnUserType;
    countryCode?: string;
    vipLevel?: number;
    kycLevel?: number;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ users: UserSummary[]; total: number; page: number; pageSize: number }> {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, 100);
    const where: Record<string, unknown> = {};
    if (input.status) where.status = input.status;
    if (input.userType) where.userType = input.userType;
    if (input.countryCode) where.countryCode = input.countryCode;
    if (input.vipLevel !== undefined) where.vipLevel = input.vipLevel;
    if (input.kycLevel !== undefined) where.kycLevel = input.kycLevel;
    if (input.search) {
      where.OR = [
        { username: { contains: input.search, mode: 'insensitive' } },
        { email: { contains: input.search, mode: 'insensitive' } },
      ];
    }
    const [users, total] = await Promise.all([
      (this.prisma as any).coreUser.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).coreUser.count({ where }),
    ]);
    return {
      users: users.map((u: any) => this.toSummary(u)),
      total,
      page,
      pageSize,
    };
  }
}

/** 工厂函数 */
export function createFjnIdentityService(options?: FjnServiceOptions): FjnIdentityService {
  return new FjnIdentityService(options);
}
