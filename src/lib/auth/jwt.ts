/**
 * JWT 工具（同构：客户端 + 服务端）
 *
 * 客户端安全函数（不依赖 Node API）：
 *   - setJWTSecret / getJWTSecret
 *   - decodeJWT / isJWTExpired
 *
 * 服务端/异步函数（动态导入 jose）：
 *   - generateAccessToken / generateRefreshToken / generateTokenPair
 *   - verifyToken / verifyRefreshToken
 *   - refreshJWT
 *
 * @module lib/auth/jwt
 */

// ============================================================================
// 配置
// ============================================================================

const DEV_JWT_SECRET = 'zs-exchange-dev-secret-local-only';
const DEV_JWT_REFRESH_SECRET = 'zs-exchange-dev-refresh-secret-local-only';
const JWT_ISSUER = 'zs-exchange';
const JWT_AUDIENCE = 'zs-exchange-api';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// ============================================================================
// 客户端密钥
// ============================================================================

let CLIENT_JWT_SECRET = '';

export function setJWTSecret(secret: string): void {
  CLIENT_JWT_SECRET = secret;
}

export function getJWTSecret(): string {
  return CLIENT_JWT_SECRET || getServerSecret('JWT_SECRET', DEV_JWT_SECRET);
}

// ============================================================================
// 类型
// ============================================================================

export interface TokenPayload extends Record<string, unknown> {
  userId: string;
  username: string;
  userType?: string;
}

export interface JwtClaims {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export interface LegacyJwtOptions {
  expiresIn?: number;
  issuer?: string;
  audience?: string;
}

// ============================================================================
// Base64 URL 解码（浏览器兼容）
// ============================================================================

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  if (typeof atob !== 'undefined') {
    return decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf-8');
  }
  throw new Error('No Base64 decoder available');
}

// ============================================================================
// 解码 & 过期检查
// ============================================================================

export function decodeJWT(token: string): JwtClaims | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = base64UrlDecode(parts[1]);
    return JSON.parse(decoded) as JwtClaims;
  } catch {
    return null;
  }
}

export function isJWTExpired(token: string): boolean {
  const claims = decodeJWT(token);
  if (!claims?.exp) return true;
  return claims.exp * 1000 < Date.now();
}

// ============================================================================
// jose 动态导入（仅在需要时加载）
// ============================================================================

async function getJose() {
  const jose = await import('jose');
  return jose;
}

function getJwtSecretForLegacy(secretOverride?: string): string {
  return secretOverride || getServerSecret('JWT_SECRET', DEV_JWT_SECRET);
}

function getServerSecret(envName: 'JWT_SECRET' | 'JWT_REFRESH_SECRET', devFallback: string): string {
  const value = typeof process !== 'undefined' ? process.env?.[envName] : undefined;
  const isProduction = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';

  if (!value) {
    if (isProduction) {
      throw new Error(`${envName} must be configured in production`);
    }
    return devFallback;
  }

  if (isProduction && isUnsafeProductionSecret(value)) {
    throw new Error(`${envName} is not strong enough for production`);
  }

  return value;
}

function isUnsafeProductionSecret(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    value.length < 32 ||
    lower.includes('change') ||
    lower.includes('default') ||
    lower.includes('secret-key') ||
    lower.includes('dev') ||
    lower.includes('local-only')
  );
}

// ============================================================================
// 服务端：生成令牌
// ============================================================================

export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  const { SignJWT } = await getJose();
  const secret = new TextEncoder().encode(getServerSecret('JWT_SECRET', DEV_JWT_SECRET));
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(secret);
}

export async function encodeJWT(
  payload: Record<string, unknown>,
  options: LegacyJwtOptions = {},
  secretOverride?: string
): Promise<string> {
  const { SignJWT } = await getJose();
  const secret = new TextEncoder().encode(getJwtSecretForLegacy(secretOverride));
  const expiresIn = options.expiresIn ?? 15 * 60;

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(options.issuer || JWT_ISSUER)
    .setAudience(options.audience || JWT_AUDIENCE)
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secret);
}

export async function verifyJWT(
  token: string,
  options: LegacyJwtOptions = {},
  secretOverride?: string
): Promise<Record<string, unknown>> {
  const { jwtVerify } = await getJose();
  const secret = new TextEncoder().encode(getJwtSecretForLegacy(secretOverride));
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ['HS256'],
    issuer: options.issuer,
    audience: options.audience,
  });
  return payload as Record<string, unknown>;
}

export async function generateRefreshToken(payload: TokenPayload): Promise<string> {
  const { SignJWT } = await getJose();
  const secret = new TextEncoder().encode(getServerSecret('JWT_REFRESH_SECRET', DEV_JWT_REFRESH_SECRET));
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
    .sign(secret);
}

export async function generateTokenPair(payload: TokenPayload) {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);
  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: 15 * 60,
  };
}

// ============================================================================
// 服务端：验证令牌
// ============================================================================

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { jwtVerify } = await getJose();
    const secret = new TextEncoder().encode(getServerSecret('JWT_SECRET', DEV_JWT_SECRET));
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { jwtVerify } = await getJose();
    const secret = new TextEncoder().encode(getServerSecret('JWT_REFRESH_SECRET', DEV_JWT_REFRESH_SECRET));
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// ============================================================================
// 客户端：刷新 JWT
// ============================================================================

export async function refreshJWT(
  refreshToken: string,
  options: { expiresIn: number }
): Promise<string> {
  const { SignJWT } = await getJose();
  const claims = decodeJWT(refreshToken);
  if (!claims) throw new Error('Invalid refresh token');

  const payload: Record<string, unknown> = {};
  for (const key of Object.keys(claims)) {
    if (key !== 'exp' && key !== 'iat') {
      payload[key] = claims[key];
    }
  }

  const secret = new TextEncoder().encode(getJWTSecret());
  const expirationTime = Math.floor(Date.now() / 1000) + options.expiresIn;

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(expirationTime)
    .sign(secret);
}

export default {
  encodeJWT,
  verifyJWT,
  setJWTSecret,
  getJWTSecret,
  decodeJWT,
  isJWTExpired,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  verifyRefreshToken,
  refreshJWT,
};
