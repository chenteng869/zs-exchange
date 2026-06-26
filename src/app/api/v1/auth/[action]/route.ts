import { NextRequest, NextResponse } from 'next/server';
import { success, badRequest, conflict, internalError, unauthorized } from '@/lib/api/response';
import { userRepository } from '@/repositories/user.repository';
import { hashPassword, verifyPassword, generateReferralCode } from '@/lib/auth/password';
import { generateTokenPair, verifyRefreshToken } from '@/lib/auth/jwt';
import { sessionRepository } from '@/repositories/session.repository';
import { auditLoginLogRepository } from '@/repositories/audit.repository';
import { withRateLimit } from '@/lib/api/middleware';
import { getClientIp, getUserAgent } from '@/lib/api/auth';

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

    const tokens = await generateTokenPair({
      userId: user.id,
      username: user.username,
      userType: user.userType,
    });

    await sessionRepository.create({
      userId: user.id,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    } as any);

    return success({
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
      ...tokens,
    });
  } catch (e: any) {
    console.error('[Register Error]', e);
    return internalError(e.message || 'Registration failed');
  }
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

    const tokens = await generateTokenPair({
      userId: user.id,
      username: user.username,
      userType: user.userType,
    });

    await sessionRepository.create({
      userId: user.id,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    } as any);

    await userRepository.update(user.id, { lastLoginAt: new Date() } as any);
    await auditLoginLogRepository.logSuccess(user.id, user.username, getClientIp(req), getUserAgent(req));

    return success({
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
      ...tokens,
    });
  } catch (e: any) {
    console.error('[Login Error]', e);
    return internalError(e.message || 'Login failed');
  }
}

async function handleRefresh(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return badRequest('Refresh token is required');
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return unauthorized('Invalid refresh token');
    }

    const session = await sessionRepository.findByRefreshToken(refreshToken);
    if (!session || session.status !== 'active') {
      return unauthorized('Session is not valid');
    }

    const user = await userRepository.findById(payload.userId);
    if (!user || user.status !== 'active') {
      return unauthorized('User not found or not active');
    }

    const tokens = await generateTokenPair({
      userId: user.id,
      username: user.username,
      userType: user.userType,
    });

    await sessionRepository.update(session.id, {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    } as any);

    return success(tokens);
  } catch (e: any) {
    console.error('[Refresh Error]', e);
    return internalError(e.message || 'Token refresh failed');
  }
}

async function handleLogout(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (refreshToken) {
      const session = await sessionRepository.findByRefreshToken(refreshToken);
      if (session) {
        await sessionRepository.update(session.id, { status: 'revoked' } as any);
      }
    }

    return success({ message: 'Logged out successfully' });
  } catch (e: any) {
    return internalError(e.message || 'Logout failed');
  }
}
