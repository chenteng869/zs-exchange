/**
 * 认证模块统一导出
 *
 * 业务代码应从 `@/lib/auth` 引入认证相关能力，
 * 而不是直接引用子模块。
 *
 * @module lib/auth
 */

// 错误类型
export * from './errors';

// 跨平台加密工具 (包含异步 sha256)
export { hmacSha256, sha256 as sha256Async } from './crypto';
export type * from './crypto';

// Base32
export * from './base32';

// JWT
export * from './jwt';

// 密码
export {
  hashPassword,
  verifyPassword,
  generateApiKey,
  generateSecret,
  generateReferralCode,
  md5,
  sha256 as sha256Sync,
} from './password';

// TOTP / 2FA
export * from './twofa';

// 会话
export * from './session';
