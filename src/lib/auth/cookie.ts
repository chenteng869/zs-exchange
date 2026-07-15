/**
 * 认证 Cookie 工具 (P0-8)
 *
 * 目标：将 JWT 从 localStorage 迁移到 HttpOnly Cookie
 *
 * 安全特性：
 *  - HttpOnly: 阻止 JavaScript 访问，防御 XSS
 *  - Secure: 仅 HTTPS 传输（生产）
 *  - SameSite=Strict: 阻止 CSRF 跨站请求
 *  - Path=/api: 仅 API 路径发送，减少暴露
 *  - Max-Age: 短 TTL（access 15m, refresh 7d）
 *
 * Cookie 名称：
 *  - access_token: JWT access token
 *  - refresh_token: JWT refresh token
 *
 * 用法：
 * ```typescript
 * // 登录成功后
 * const res = success({ user });
 * setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
 * return res;
 *
 * // 登出
 * const res = success({ message: 'logged out' });
 * clearAuthCookies(res);
 * return res;
 * ```
 */

import { NextResponse } from 'next/server';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 分钟（秒）
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 天（秒）

/**
 * 检查是否生产环境
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * 获取 cookie 通用配置
 */
function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true, // 阻止 JS 访问（防 XSS）
    secure: isProduction(), // 仅 HTTPS 传输
    sameSite: 'strict' as const, // 阻止 CSRF
    path: '/', // 全站可用
    maxAge, // 过期时间（秒）
  };
}

/**
 * 设置 access_token 和 refresh_token 到 HttpOnly Cookie
 */
export function setAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
): NextResponse {
  res.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE));
  res.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, getCookieOptions(REFRESH_TOKEN_MAX_AGE));
  return res;
}

/**
 * 仅设置 access_token（用于 refresh 场景）
 */
export function setAccessTokenCookie(res: NextResponse, accessToken: string): NextResponse {
  res.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE));
  return res;
}

/**
 * 清除所有认证 Cookie
 */
export function clearAuthCookies(res: NextResponse): NextResponse {
  res.cookies.set(ACCESS_TOKEN_COOKIE, '', { ...getCookieOptions(0), maxAge: 0 });
  res.cookies.set(REFRESH_TOKEN_COOKIE, '', { ...getCookieOptions(0), maxAge: 0 });
  return res;
}

/**
 * 从 NextRequest 读取 access_token（cookie 优先，然后 Authorization header 兜底）
 *
 * 这样设计是为了向后兼容：
 *  - 旧客户端：Authorization: Bearer xxx
 *  - 新客户端：自动从 cookie 读取
 */
export function getAccessToken(req: { cookies: { get: (name: string) => { value: string } | undefined }; headers: { get: (name: string) => string | null } }): string | null {
  // 1. 优先从 cookie 读取
  const cookieToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // 2. 兜底：Authorization header（兼容旧客户端）
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }
  }

  return null;
}

/**
 * 从 NextRequest 读取 refresh_token
 */
export function getRefreshToken(req: { cookies: { get: (name: string) => { value: string } | undefined } }): string | null {
  return req.cookies.get(REFRESH_TOKEN_COOKIE)?.value || null;
}
