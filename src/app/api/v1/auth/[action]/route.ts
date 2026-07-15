import { NextRequest, NextResponse } from 'next/server';
import { success, badRequest, conflict, internalError, unauthorized, error as errorResponse } from '@/lib/api/response';
import { userRepository } from '@/repositories/user.repository';
import { hashPassword, verifyPassword, generateReferralCode } from '@/lib/auth/password';
import { verifyRefreshToken, generateTokenPair } from '@/lib/auth/jwt';
import { sessionRepository } from '@/repositories/session.repository';
import { auditLoginLogRepository } from '@/repositories/audit.repository';
import { userDidRepository } from '@/repositories/user-did.repository';
import { withRateLimit } from '@/lib/api/middleware';
import { getClientIp, getUserAgent } from '@/lib/api/auth';
import { DidSolService } from '@/modules/did-identity/core/methods/did-sol.service';
import { logger } from '@/lib/logger';
import {
  setAuthCookies,
  setAccessTokenCookie,
  clearAuthCookies,
  getRefreshToken,
} from '@/lib/auth/cookie';
import {
  createSession,
  rotateRefreshToken,
  logoutSession,
  RefreshRotationError,
  detectAbnormalRotation,
} from '@/lib/auth/refresh-rotation';

export async function POST(req: NextRequest, { params }: { params: { action: string } }) {
  const action = params.action;

  switch (action) {
    case 'register':
      return withRateLimit(req, getClientIp(req), 10, 60 * 1000, () => handleRegister(req));
    case 'login':
      return withRateLimit(req, getClientIp(req), 20, 60 * 1000, () => handleLogin(req));
    case 'refresh':
      return handleRefresh(req);
    case 'logout':
      return handleLogout(req);
    default:
      return badRequest('Invalid action');
  }
}

async function handleRegister(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { username, email, password, phone, referralCode } = body;

    if (!username || !email || !password) {
      return badRequest('Username, email, and password are required');
    }

    if (password.length < 8) {
      return badRequest('Password must be at least 8 characters');
    }

    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      return conflict('Username already exists');
    }

    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      return conflict('Email already exists');
    }

    const hashedPassword = await hashPassword(password);
    const code = generateReferralCode();

    let referredBy: string | undefined = undefined;
    if (referralCode) {
      const referrer = await userRepository.findByReferralCode(referralCode);
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    const user = await userRepository.create({
      username,
      email,
      passwordHash: hashedPassword,
      phone: phone || null as any,
      referralCode: code,
      referredBy: referredBy as any,
      depositEnabled: true,
    } as any);

    const didIdentity = await provisionRegistrationDid(user.id);

    // P0-9: 使用 Refresh Token Rotation 创建 session
    const { tokens } = await createSession({
      userId: user.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    // P0-8: 设置 HttpOnly Cookie
    const res = success({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        kycLevel: user.kycLevel,
        userType: user.userType,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
      },
      did: didIdentity,
      // 同时返回 tokens（兼容旧客户端）
      // 新客户端可忽略此字段，从 cookie 自动读取
      ...tokens,
    });
    return setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  } catch (e: any) {
    console.error('[Register Error]', e);
    return internalError(e.message || 'Registration failed');
  }
}

async function provisionRegistrationDid(userId: string) {
  try {
    const existing = await userDidRepository.findByUserId(userId);
    if (existing) {
      return toDidResponse(existing);
    }

    const cluster = process.env.DID_SOLANA_CLUSTER || 'devnet';
    const solService = new DidSolService({ cluster: cluster as any });
    const result = await solService.create();
    const keyRef = `did-sol:${result.keyPair.publicKey}`;

    const record = await userDidRepository.create({
      userId,
      did: result.did,
      method: 'did:sol',
      chainType: 'solana',
      chainId: cluster,
      publicKey: result.keyPair.publicKey,
      keyRef,
      document: result.document,
      anchorStatus: 'pending',
    });

    return toDidResponse(record);
  } catch (error) {
    console.error('[DID Provisioning Error]', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    return {
      status: 'failed',
      message: 'DID provisioning failed in non-production mode',
    };
  }
}

function toDidResponse(record: any) {
  return {
    did: record.did,
    method: record.method,
    chainType: record.chainType,
    chainId: record.chainId,
    publicKey: record.publicKey,
    keyRef: record.keyRef,
    anchorStatus: record.anchorStatus,
    anchorTxHash: record.anchorTxHash,
  };
}

async function handleLogin(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return badRequest('Username and password are required');
    }

    const user = await userRepository.findByUsername(username);
    if (!user) {
      await auditLoginLogRepository.logFailure(username, getClientIp(req), 'User not found', getUserAgent(req));
      return unauthorized('Invalid credentials');
    }

    if (user.status !== 'active') {
      await auditLoginLogRepository.logFailure(username, getClientIp(req), 'Account not active', getUserAgent(req));
      return unauthorized('Account is not active');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await auditLoginLogRepository.logFailure(username, getClientIp(req), 'Invalid password', getUserAgent(req));
      return unauthorized('Invalid credentials');
    }

    // P0-9: 使用 Refresh Token Rotation 创建 session
    const { tokens } = await createSession({
      userId: user.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    await userRepository.update(user.id, { lastLoginAt: new Date() } as any);
    await auditLoginLogRepository.logSuccess(user.id, user.username, getClientIp(req), getUserAgent(req));

    // P0-8: 设置 HttpOnly Cookie
    const res = success({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        kycLevel: user.kycLevel,
        userType: user.userType,
        vipLevel: user.vipLevel,
        tradingEnabled: user.tradingEnabled,
        withdrawalEnabled: user.withdrawalEnabled,
        depositEnabled: user.depositEnabled,
        referralCode: user.referralCode,
      },
      // 同时返回 tokens（兼容旧客户端）
      ...tokens,
    });
    return setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  } catch (e: any) {
    console.error('[Login Error]', e);
    return internalError(e.message || 'Login failed');
  }
}

async function handleRefresh(req: NextRequest): Promise<NextResponse> {
  try {
    // P0-8: 优先从 HttpOnly Cookie 读取 refreshToken
    let refreshToken = getRefreshToken(req);

    // 兜底：从 body 读取（兼容旧客户端）
    if (!refreshToken) {
      const body = await req.json().catch(() => ({}));
      refreshToken = body?.refreshToken;
    }

    if (!refreshToken) {
      return badRequest('Refresh token is required (cookie or body)');
    }

    // P0-9: Refresh Token Rotation
    try {
      const result = await rotateRefreshToken({
        refreshToken,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      // 检查异常（短时间多次旋转）
      const session = await sessionRepository.findByRefreshToken(refreshToken);
      if (session) {
        const abnormal = await detectAbnormalRotation(session.userId);
        if (abnormal) {
          logger.warn(
            `[refresh-rotation] Abnormal rotation detected for user ${session.userId} - possible attack`,
          );
          // 仍然返回成功（不阻断合法用户），但记录到审计
        }
      }

      // P0-8: 设置新的 HttpOnly Cookie
      const res = success({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        tokenType: result.tokenType,
        expiresIn: result.expiresIn,
        rotationCount: result.rotationCount,
      });
      return setAuthCookies(res, result.accessToken, result.refreshToken);
    } catch (e: any) {
      if (e instanceof RefreshRotationError) {
        // P0-9 重放攻击：吊销整族后清除 cookie
        if (e.familyRevoked) {
          const res = errorResponse(e.code, e.message, e.httpStatus);
          return clearAuthCookies(res);
        }
        return errorResponse(e.code, e.message, e.httpStatus);
      }
      throw e;
    }
  } catch (e: any) {
    console.error('[Refresh Error]', e);
    return internalError(e.message || 'Token refresh failed');
  }
}

async function handleLogout(req: NextRequest): Promise<NextResponse> {
  try {
    // P0-8: 优先从 cookie 读取 refreshToken
    let refreshToken = getRefreshToken(req);
    if (!refreshToken) {
      const body = await req.json().catch(() => ({}));
      refreshToken = body?.refreshToken;
    }

    if (refreshToken) {
      // P0-9: 标记 session 为 revoked（不影响其他设备）
      await logoutSession(refreshToken);
    }

    // P0-8: 清除 HttpOnly Cookie
    const res = success({ message: 'Logged out successfully' });
    return clearAuthCookies(res);
  } catch (e: any) {
    return internalError(e.message || 'Logout failed');
  }
}
