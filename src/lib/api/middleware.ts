import { NextRequest, NextResponse } from 'next/server';
import { auditApiAccessLogRepository } from '@/repositories/audit.repository';
import { forbidden } from './response';
import { AuthContext, requireAuth } from './auth';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  rateLimitMap.set(key, record);
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

export async function withRateLimit(
  req: NextRequest,
  identifier: string,
  maxRequests: number,
  windowMs: number,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  const result = rateLimit(identifier, maxRequests, windowMs);

  if (!result.allowed) {
    const response = NextResponse.json(
      {
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 429 },
    );
    response.headers.set('X-RateLimit-Limit', String(maxRequests));
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));
    return response;
  }

  const response = await handler();
  response.headers.set('X-RateLimit-Limit', String(maxRequests));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));
  return response;
}

export async function logApiAccess(
  req: NextRequest,
  res: NextResponse,
  userId?: string,
  apiKeyId?: string,
) {
  try {
    const url = new URL(req.url);
    const requestSize = parseInt(req.headers.get('content-length') || '0');

    let responseSize = 0;
    const clone = res.clone();
    const buffer = await clone.arrayBuffer();
    responseSize = buffer.byteLength;

    const startTime = Date.now();
    const responseTime = parseInt(res.headers.get('x-response-time') || '0') || Date.now() - startTime;

    await auditApiAccessLogRepository.create({
      userId: userId || null as any,
      apiKeyId: apiKeyId || null as any,
      endpoint: url.pathname,
      method: req.method,
      statusCode: res.status,
      responseTime,
      requestSize,
      responseSize,
      ipAddress: getIpFromRequest(req),
    });
  } catch (e) {
    console.error('[API Access Log Error]', e);
  }
}

export async function withAuth(
  req: NextRequest,
  handler: (ctx: AuthContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  return requireAuth(req, handler);
}

export async function withAdminAuth(
  req: NextRequest,
  handler: (ctx: AuthContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  return requireAuth(req, async (ctx) => {
    if (ctx.user?.userType !== 'admin') {
      return forbidden('Admin permission is required');
    }
    return handler(ctx);
  });
}

function getIpFromRequest(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

export default {
  rateLimit,
  withRateLimit,
  withAuth,
  withAdminAuth,
  logApiAccess,
};
