import { NextRequest, NextResponse } from 'next/server';
import { auditApiAccessLogRepository } from '@/repositories/audit.repository';
import { forbidden, unauthorized } from './response';
import { AuthContext, requireAuth as _coreRequireAuth, authenticate } from './auth';
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * 兼容旧调用约定的 requireAuth(req) → { ok, user, userId } | { ok, response }
 * 新代码请使用 withAuth(req, handler) 包装器
 */
export async function requireAuth(
  req: NextRequest,
): Promise<
  | { ok: true; user: AuthContext['user']; userId: AuthContext['userId']; token: string; response?: undefined }
  | { ok: false; user?: undefined; userId?: undefined; token?: undefined; response: NextResponse }
> {
  const result = await authenticate(req);
  if ('status' in result) {
    return { ok: false, response: result } as const;
  }
  return { ok: true, user: result.user, userId: result.userId, token: result.token } as const;
}

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
  return _coreRequireAuth(req, handler);
}

// ============================================================
// withAdminAuth - 同时支持 (handler) HOC 与 (req, handler) 双参数
// ============================================================

/** HOC 形式：支持 Next.js 15 动态路由 `(req, { params })` 签名 */
export function withAdminAuth(
  handler: (req: NextRequest, ctx: any) => Promise<NextResponse>
): (req: NextRequest, ctx?: any) => Promise<NextResponse>;

/** 双参数形式：`return withAdminAuth(req, async (ctx) => {...})` */
export async function withAdminAuth(
  req: NextRequest,
  handler: (ctx: AuthContext) => Promise<NextResponse>
): Promise<NextResponse>;

/** 实现 */
export function withAdminAuth(
  arg1: any,
  arg2?: any
): any {
  if (typeof arg1 === 'function') {
    // HOC 形式：withAdminAuth(handler) -> (req, ctx?) => handler(req, ctx)
    return async (req: NextRequest, ctx?: any) => {
      return _coreRequireAuth(req, async (authCtx) => {
        if (authCtx.user?.userType !== 'admin') {
          return forbidden('Admin permission is required');
        }
        return arg1(req, ctx ?? authCtx);
      });
    };
  }
  // 双参数形式：withAdminAuth(req, handler)
  return _coreRequireAuth(arg1, async (ctx) => {
    if (ctx.user?.userType !== 'admin') {
      return forbidden('Admin permission is required');
    }
    return arg2(ctx);
  });
}

/**
 * 别名：与 withAuth 等价（兼容旧调用约定）
 * 也支持 HOC 形式：withUserAuth(handler)
 */
export function withUserAuth(
  handler: (req: NextRequest, ctx: any) => Promise<NextResponse>
): (req: NextRequest, ctx?: any) => Promise<NextResponse>;

export async function withUserAuth(
  req: NextRequest,
  handler: (ctx: AuthContext) => Promise<NextResponse>
): Promise<NextResponse>;

export function withUserAuth(arg1: any, arg2?: any): any {
  if (typeof arg1 === 'function') {
    return async (req: NextRequest, ctx?: any) => {
      return _coreRequireAuth(req, async (authCtx) => arg1(req, ctx ?? authCtx));
    };
  }
  return _coreRequireAuth(arg1, arg2);
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
