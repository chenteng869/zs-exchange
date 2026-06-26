/**
 * 认证体系统一错误类型
 *
 * 所有认证、KYC、风控模块抛出的错误都基于此基类，
 * 便于上层 try/catch 进行精细化处理。
 */

/**
 * 认证模块基类错误
 */
export class AuthError extends Error {
  /** 错误码（业务码） */
  public readonly code: string;
  /** HTTP 状态码（如果在 HTTP 上下文抛出） */
  public readonly status: number;
  /** 附加数据 */
  public readonly meta?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    status: number = 401,
    meta?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
    this.meta = meta;
    // 修复继承 Error 后 instanceof 可能不工作的 prototype chain 问题
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** JWT 相关错误 */
export class JWTError extends AuthError {
  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(code, message, 401, meta);
    this.name = 'JWTError';
  }
}

/** 密码相关错误 */
export class PasswordError extends AuthError {
  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(code, message, 400, meta);
    this.name = 'PasswordError';
  }
}

/** 2FA 相关错误 */
export class TwoFAError extends AuthError {
  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(code, message, 400, meta);
    this.name = 'TwoFAError';
  }
}

/** 会话相关错误 */
export class SessionError extends AuthError {
  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(code, message, 401, meta);
    this.name = 'SessionError';
  }
}

/** KYC 相关错误 */
export class KycError extends AuthError {
  constructor(code: string, message: string, status: number = 400, meta?: Record<string, unknown>) {
    super(code, message, status, meta);
    this.name = 'KycError';
  }
}

/** 风控相关错误 */
export class RiskError extends AuthError {
  constructor(code: string, message: string, status: number = 403, meta?: Record<string, unknown>) {
    super(code, message, status, meta);
    this.name = 'RiskError';
  }
}
