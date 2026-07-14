/**
 * Identity Service - 错误码 + 异常类
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.1
 */

import { FjnError, FjnErrorContext } from '../errors';

export const IDENTITY_ERROR_CODES = {
  // 用户基础
  USER_NOT_FOUND: 'FJN_IDENTITY_USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'FJN_IDENTITY_USER_ALREADY_EXISTS',
  USER_STATUS_INVALID: 'FJN_IDENTITY_USER_STATUS_INVALID',
  USER_NOT_OPERABLE: 'FJN_IDENTITY_USER_NOT_OPERABLE',
  USER_NOT_LOGINABLE: 'FJN_IDENTITY_USER_NOT_LOGINABLE',
  USER_CLOSED: 'FJN_IDENTITY_USER_CLOSED',
  // 字段
  USERNAME_REQUIRED: 'FJN_IDENTITY_USERNAME_REQUIRED',
  USERNAME_INVALID: 'FJN_IDENTITY_USERNAME_INVALID',
  USERNAME_TOO_SHORT: 'FJN_IDENTITY_USERNAME_TOO_SHORT',
  USERNAME_TOO_LONG: 'FJN_IDENTITY_USERNAME_TOO_LONG',
  USERNAME_DUPLICATE: 'FJN_IDENTITY_USERNAME_DUPLICATE',
  EMAIL_REQUIRED: 'FJN_IDENTITY_EMAIL_REQUIRED',
  EMAIL_INVALID: 'FJN_IDENTITY_EMAIL_INVALID',
  EMAIL_DUPLICATE: 'FJN_IDENTITY_EMAIL_DUPLICATE',
  PASSWORD_REQUIRED: 'FJN_IDENTITY_PASSWORD_REQUIRED',
  PASSWORD_TOO_SHORT: 'FJN_IDENTITY_PASSWORD_TOO_SHORT',
  PASSWORD_TOO_LONG: 'FJN_IDENTITY_PASSWORD_TOO_LONG',
  PASSWORD_INCORRECT: 'FJN_IDENTITY_PASSWORD_INCORRECT',
  PHONE_INVALID: 'FJN_IDENTITY_PHONE_INVALID',
  COUNTRY_CODE_INVALID: 'FJN_IDENTITY_COUNTRY_CODE_INVALID',
  // 登录
  LOGIN_FAILED: 'FJN_IDENTITY_LOGIN_FAILED',
  LOGIN_ATTEMPTS_EXCEEDED: 'FJN_IDENTITY_LOGIN_ATTEMPTS_EXCEEDED',
  // Session
  SESSION_NOT_FOUND: 'FJN_IDENTITY_SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'FJN_IDENTITY_SESSION_EXPIRED',
  SESSION_REVOKED: 'FJN_IDENTITY_SESSION_REVOKED',
  SESSION_INVALID: 'FJN_IDENTITY_SESSION_INVALID',
  // 密码重置
  PASSWORD_RESET_TOKEN_INVALID: 'FJN_IDENTITY_PASSWORD_RESET_TOKEN_INVALID',
  PASSWORD_RESET_TOKEN_EXPIRED: 'FJN_IDENTITY_PASSWORD_RESET_TOKEN_EXPIRED',
  // 推荐关系
  REFERRAL_CODE_INVALID: 'FJN_IDENTITY_REFERRAL_CODE_INVALID',
  REFERRAL_CODE_DUPLICATE: 'FJN_IDENTITY_REFERRAL_CODE_DUPLICATE',
  REFERRAL_RELATION_EXISTS: 'FJN_IDENTITY_REFERRAL_RELATION_EXISTS',
  REFERRAL_RELATION_NOT_FOUND: 'FJN_IDENTITY_REFERRAL_RELATION_NOT_FOUND',
  REFERRAL_CANNOT_BIND_SELF: 'FJN_IDENTITY_REFERRAL_CANNOT_BIND_SELF',
  REFERRAL_BIND_EXPIRED: 'FJN_IDENTITY_REFERRAL_BIND_EXPIRED',
  // 设备
  DEVICE_NOT_FOUND: 'FJN_IDENTITY_DEVICE_NOT_FOUND',
  DEVICE_ALREADY_BOUND: 'FJN_IDENTITY_DEVICE_ALREADY_BOUND',
  DEVICE_LIMIT_EXCEEDED: 'FJN_IDENTITY_DEVICE_LIMIT_EXCEEDED',
  // DID / 钱包
  DID_NOT_FOUND: 'FJN_IDENTITY_DID_NOT_FOUND',
  DID_ALREADY_BOUND: 'FJN_IDENTITY_DID_ALREADY_BOUND',
  DID_LIMIT_EXCEEDED: 'FJN_IDENTITY_DID_LIMIT_EXCEEDED',
  DID_INVALID: 'FJN_IDENTITY_DID_INVALID',
  DID_PUBLIC_KEY_MISMATCH: 'FJN_IDENTITY_DID_PUBLIC_KEY_MISMATCH',
  DID_ANCHOR_FAILED: 'FJN_IDENTITY_DID_ANCHOR_FAILED',
  // 会员
  VIP_LEVEL_INVALID: 'FJN_IDENTITY_VIP_LEVEL_INVALID',
  USER_TYPE_INVALID: 'FJN_IDENTITY_USER_TYPE_INVALID',
  // 操作
  STATUS_CHANGE_FORBIDDEN: 'FJN_IDENTITY_STATUS_CHANGE_FORBIDDEN',
  CLOSE_FORBIDDEN: 'FJN_IDENTITY_CLOSE_FORBIDDEN',
  SELF_ACTION_FORBIDDEN: 'FJN_IDENTITY_SELF_ACTION_FORBIDDEN',
} as const;
export type FjnIdentityErrorCode =
  (typeof IDENTITY_ERROR_CODES)[keyof typeof IDENTITY_ERROR_CODES];

export const isFjnIdentityErrorCode = (c: string): c is FjnIdentityErrorCode =>
  Object.values(IDENTITY_ERROR_CODES).includes(c as any);

export const getIdentityErrorCodeCount = (): number =>
  Object.keys(IDENTITY_ERROR_CODES).length;

/** Identity 业务异常基类 */
export class FjnIdentityError extends FjnError {
  constructor(params: {
    code: FjnIdentityErrorCode;
    message: string;
    context?: FjnErrorContext;
    cause?: unknown;
  }) {
    super({
      code: params.code as unknown as FjnError['code'],
      message: params.message,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'FjnIdentityError';
  }
}

// 用户基础
export class UserNotFoundError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.USER_NOT_FOUND,
      message: 'User not found',
      context: ctx,
    });
    this.name = 'UserNotFoundError';
  }
}
export class UserAlreadyExistsError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.USER_ALREADY_EXISTS,
      message: 'User already exists',
      context: ctx,
    });
    this.name = 'UserAlreadyExistsError';
  }
}
export class UserStatusInvalidError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.USER_STATUS_INVALID,
      message: 'Invalid user status transition',
      context: ctx,
    });
    this.name = 'UserStatusInvalidError';
  }
}
export class UserNotOperableError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.USER_NOT_OPERABLE,
      message: 'User is not operable in current status',
      context: ctx,
    });
    this.name = 'UserNotOperableError';
  }
}
export class UserNotLoginableError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.USER_NOT_LOGINABLE,
      message: 'User is not loginable in current status',
      context: ctx,
    });
    this.name = 'UserNotLoginableError';
  }
}
export class UserClosedError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.USER_CLOSED,
      message: 'User has been closed',
      context: ctx,
    });
    this.name = 'UserClosedError';
  }
}

// 字段校验
export class UsernameRequiredError extends FjnIdentityError {
  constructor() {
    super({
      code: IDENTITY_ERROR_CODES.USERNAME_REQUIRED,
      message: 'Username is required',
    });
    this.name = 'UsernameRequiredError';
  }
}
export class UsernameInvalidError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.USERNAME_INVALID,
      message: 'Username format invalid',
      context: ctx,
    });
    this.name = 'UsernameInvalidError';
  }
}
export class UsernameTooShortError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.USERNAME_TOO_SHORT,
      message: 'Username too short',
      context: ctx,
    });
    this.name = 'UsernameTooShortError';
  }
}
export class UsernameTooLongError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.USERNAME_TOO_LONG,
      message: 'Username too long',
      context: ctx,
    });
    this.name = 'UsernameTooLongError';
  }
}
export class UsernameDuplicateError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.USERNAME_DUPLICATE,
      message: 'Username already taken',
      context: ctx,
    });
    this.name = 'UsernameDuplicateError';
  }
}
export class EmailRequiredError extends FjnIdentityError {
  constructor() {
    super({
      code: IDENTITY_ERROR_CODES.EMAIL_REQUIRED,
      message: 'Email is required',
    });
    this.name = 'EmailRequiredError';
  }
}
export class EmailInvalidError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.EMAIL_INVALID,
      message: 'Email format invalid',
      context: ctx,
    });
    this.name = 'EmailInvalidError';
  }
}
export class EmailDuplicateError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.EMAIL_DUPLICATE,
      message: 'Email already registered',
      context: ctx,
    });
    this.name = 'EmailDuplicateError';
  }
}
export class PasswordRequiredError extends FjnIdentityError {
  constructor() {
    super({
      code: IDENTITY_ERROR_CODES.PASSWORD_REQUIRED,
      message: 'Password is required',
    });
    this.name = 'PasswordRequiredError';
  }
}
export class PasswordTooShortError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.PASSWORD_TOO_SHORT,
      message: 'Password too short',
      context: ctx,
    });
    this.name = 'PasswordTooShortError';
  }
}
export class PasswordTooLongError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.PASSWORD_TOO_LONG,
      message: 'Password too long',
      context: ctx,
    });
    this.name = 'PasswordTooLongError';
  }
}
export class PasswordIncorrectError extends FjnIdentityError {
  constructor() {
    super({
      code: IDENTITY_ERROR_CODES.PASSWORD_INCORRECT,
      message: 'Password is incorrect',
    });
    this.name = 'PasswordIncorrectError';
  }
}
export class PhoneInvalidError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.PHONE_INVALID,
      message: 'Phone format invalid',
      context: ctx,
    });
    this.name = 'PhoneInvalidError';
  }
}
export class CountryCodeInvalidError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.COUNTRY_CODE_INVALID,
      message: 'Country code invalid',
      context: ctx,
    });
    this.name = 'CountryCodeInvalidError';
  }
}

// 登录
export class LoginFailedError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.LOGIN_FAILED,
      message: 'Login failed',
      context: ctx,
    });
    this.name = 'LoginFailedError';
  }
}
export class LoginAttemptsExceededError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.LOGIN_ATTEMPTS_EXCEEDED,
      message: 'Too many login attempts',
      context: ctx,
    });
    this.name = 'LoginAttemptsExceededError';
  }
}

// Session
export class SessionNotFoundError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.SESSION_NOT_FOUND,
      message: 'Session not found',
      context: ctx,
    });
    this.name = 'SessionNotFoundError';
  }
}
export class SessionExpiredError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.SESSION_EXPIRED,
      message: 'Session expired',
      context: ctx,
    });
    this.name = 'SessionExpiredError';
  }
}
export class SessionRevokedError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.SESSION_REVOKED,
      message: 'Session revoked',
      context: ctx,
    });
    this.name = 'SessionRevokedError';
  }
}
export class SessionInvalidError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.SESSION_INVALID,
      message: 'Session invalid',
      context: ctx,
    });
    this.name = 'SessionInvalidError';
  }
}

// 密码重置
export class PasswordResetTokenInvalidError extends FjnIdentityError {
  constructor() {
    super({
      code: IDENTITY_ERROR_CODES.PASSWORD_RESET_TOKEN_INVALID,
      message: 'Password reset token invalid',
    });
    this.name = 'PasswordResetTokenInvalidError';
  }
}
export class PasswordResetTokenExpiredError extends FjnIdentityError {
  constructor() {
    super({
      code: IDENTITY_ERROR_CODES.PASSWORD_RESET_TOKEN_EXPIRED,
      message: 'Password reset token expired',
    });
    this.name = 'PasswordResetTokenExpiredError';
  }
}

// 推荐
export class ReferralCodeInvalidError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.REFERRAL_CODE_INVALID,
      message: 'Referral code invalid',
      context: ctx,
    });
    this.name = 'ReferralCodeInvalidError';
  }
}
export class ReferralCodeDuplicateError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.REFERRAL_CODE_DUPLICATE,
      message: 'Referral code duplicate',
      context: ctx,
    });
    this.name = 'ReferralCodeDuplicateError';
  }
}
export class ReferralRelationExistsError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.REFERRAL_RELATION_EXISTS,
      message: 'Referral relation already exists',
      context: ctx,
    });
    this.name = 'ReferralRelationExistsError';
  }
}
export class ReferralRelationNotFoundError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.REFERRAL_RELATION_NOT_FOUND,
      message: 'Referral relation not found',
      context: ctx,
    });
    this.name = 'ReferralRelationNotFoundError';
  }
}
export class ReferralCannotBindSelfError extends FjnIdentityError {
  constructor() {
    super({
      code: IDENTITY_ERROR_CODES.REFERRAL_CANNOT_BIND_SELF,
      message: 'Cannot bind self as referrer',
    });
    this.name = 'ReferralCannotBindSelfError';
  }
}
export class ReferralBindExpiredError extends FjnIdentityError {
  constructor() {
    super({
      code: IDENTITY_ERROR_CODES.REFERRAL_BIND_EXPIRED,
      message: 'Referral binding window expired',
    });
    this.name = 'ReferralBindExpiredError';
  }
}

// 设备
export class DeviceNotFoundError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.DEVICE_NOT_FOUND,
      message: 'Device not found',
      context: ctx,
    });
    this.name = 'DeviceNotFoundError';
  }
}
export class DeviceAlreadyBoundError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.DEVICE_ALREADY_BOUND,
      message: 'Device already bound',
      context: ctx,
    });
    this.name = 'DeviceAlreadyBoundError';
  }
}
export class DeviceLimitExceededError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.DEVICE_LIMIT_EXCEEDED,
      message: 'Device limit exceeded',
      context: ctx,
    });
    this.name = 'DeviceLimitExceededError';
  }
}

// DID
export class DidNotFoundError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.DID_NOT_FOUND,
      message: 'DID not found',
      context: ctx,
    });
    this.name = 'DidNotFoundError';
  }
}
export class DidAlreadyBoundError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.DID_ALREADY_BOUND,
      message: 'DID already bound',
      context: ctx,
    });
    this.name = 'DidAlreadyBoundError';
  }
}
export class DidLimitExceededError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.DID_LIMIT_EXCEEDED,
      message: 'DID limit exceeded',
      context: ctx,
    });
    this.name = 'DidLimitExceededError';
  }
}
export class DidInvalidError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.DID_INVALID,
      message: 'DID format invalid',
      context: ctx,
    });
    this.name = 'DidInvalidError';
  }
}
export class DidPublicKeyMismatchError extends FjnIdentityError {
  constructor() {
    super({
      code: IDENTITY_ERROR_CODES.DID_PUBLIC_KEY_MISMATCH,
      message: 'DID public key mismatch',
    });
    this.name = 'DidPublicKeyMismatchError';
  }
}
export class DidAnchorFailedError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.DID_ANCHOR_FAILED,
      message: 'DID anchor failed',
      context: ctx,
    });
    this.name = 'DidAnchorFailedError';
  }
}

// 会员
export class VipLevelInvalidError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.VIP_LEVEL_INVALID,
      message: 'VIP level invalid',
      context: ctx,
    });
    this.name = 'VipLevelInvalidError';
  }
}
export class UserTypeInvalidError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.USER_TYPE_INVALID,
      message: 'User type invalid',
      context: ctx,
    });
    this.name = 'UserTypeInvalidError';
  }
}

// 操作
export class StatusChangeForbiddenError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.STATUS_CHANGE_FORBIDDEN,
      message: 'Status change forbidden',
      context: ctx,
    });
    this.name = 'StatusChangeForbiddenError';
  }
}
export class CloseForbiddenError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.CLOSE_FORBIDDEN,
      message: 'Close user forbidden',
      context: ctx,
    });
    this.name = 'CloseForbiddenError';
  }
}
export class SelfActionForbiddenError extends FjnIdentityError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: IDENTITY_ERROR_CODES.SELF_ACTION_FORBIDDEN,
      message: 'Self action forbidden',
      context: ctx,
    });
    this.name = 'SelfActionForbiddenError';
  }
}
