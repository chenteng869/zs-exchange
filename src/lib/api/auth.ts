import { NextRequest, NextResponse } from 'next/server';
import { unauthorized, forbidden, internalError } from './response';
import { verifyToken } from '@/lib/auth/jwt';
import { userRepository } from '@/repositories/user.repository';
import { getAccessToken } from '@/lib/auth/cookie';

export interface AuthContext {
  userId: string;
  user: any;
  token: string;
}

export async function authenticate(req: NextRequest): Promise<AuthContext | NextResponse> {
  // P0-8: 支持从 HttpOnly Cookie 或 Authorization Header 读取 token
  // 优先 cookie（新客户端），然后 Authorization header（兼容旧客户端）
  const token = getAccessToken(req);

  if (!token) {
    return unauthorized('Authorization header or access_token cookie is required');
  }

  try {
    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return unauthorized('Invalid token');
    }

    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.ALLOW_DEV_ADMIN_LOGIN === 'true' &&
      payload.userId === 'dev-admin'
    ) {
      return {
        // dev-admin 在 DB 中映射为一个固定 UUID（用于满足 schema 的 @db.Uuid 字段）
        userId: '00000000-0000-0000-0000-00000000d3a0', // 0xDEV = dev-admin
        user: { id: '00000000-0000-0000-0000-00000000d3a0', userType: 'admin', status: 'active', username: payload.username },
        token,
      };
    }

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      return unauthorized('User not found');
    }

    if (user.status !== 'active') {
      return forbidden('Account is not active');
    }

    return {
      userId: payload.userId,
      user,
      token,
    };
  } catch (e) {
    return unauthorized('Token expired or invalid');
  }
}

export async function requireAuth(
  req: NextRequest,
  handler: (ctx: AuthContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  const authResult = await authenticate(req);

  if ('status' in authResult) {
    return authResult;
  }

  try {
    return await handler(authResult);
  } catch (e: any) {
    console.error('[API Error]', e);
    return internalError(e.message || 'Internal server error');
  }
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

export function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || '';
}
