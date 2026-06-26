import { NextRequest, NextResponse } from 'next/server';
import { unauthorized, forbidden, internalError } from './response';
import { verifyToken } from '@/lib/auth/jwt';
import { userRepository } from '@/repositories/user.repository';

export interface AuthContext {
  userId: string;
  user: any;
  token: string;
}

export async function authenticate(req: NextRequest): Promise<AuthContext | NextResponse> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');

  if (!authHeader) {
    return unauthorized('Authorization header is required');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return unauthorized('Invalid authorization format');
  }

  const token = parts[1];

  try {
    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return unauthorized('Invalid token');
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