/**
 * 我的设备 - User Devices API
 * /api/v1/user/devices
 *
 * 端点（使用 ?action=xxx 模式）：
 *  - GET  ?action=list                 列出所有活跃设备
 *  - POST action=revoke                撤销单设备（需传 sessionId）
 *  - POST action=logout-others         登出其他所有设备（保留当前）
 *
 * 安全：
 *  - 所有端点需要 requireAuth
 *  - 只能操作自己的 session
 *  - 撤销操作立即生效
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound, forbidden } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import {
  getUserActiveSessions,
  revokeSessionById,
  revokeAllUserSessionsExcept,
} from '@/lib/auth/refresh-rotation';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================
// GET - 列出设备 / 统计
// ============================================================
export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const action = req.nextUrl.searchParams.get('action') || 'list';

    try {
      switch (action) {
        case 'list':
          return await listDevices(ctx, req);
        case 'count':
          return await countDevices(ctx);
        default:
          return badRequest(`Invalid GET action: ${action}. Supported: list, count`);
      }
    } catch (e) {
      return handleApiError(e, 'api:user/devices GET');
    }
  });
}

// ============================================================
// POST - 撤销 / 登出其他
// ============================================================
export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const action = req.nextUrl.searchParams.get('action');
    if (!action) {
      return badRequest('Missing action. Supported: revoke, logout-others');
    }

    try {
      const body = await req.json().catch(() => ({}));

      switch (action) {
        case 'revoke':
          return await revokeDevice(ctx, req, body);
        case 'logout-others':
          return await logoutOthers(ctx, req, body);
        default:
          return badRequest(`Invalid action: ${action}. Supported: revoke, logout-others`);
      }
    } catch (e) {
      return handleApiError(e, `api:user/devices POST ${action}`);
    }
  });
}

// ============================================================
// Handlers
// ============================================================

/**
 * 列出当前用户的所有活跃设备
 */
async function listDevices(ctx: AuthContext, req: NextRequest) {
  // 获取当前 sessionId（从 Authorization 或 cookie 中的 access token 反查）
  const currentSessionId = await getCurrentSessionId(ctx, req);

  const devices = await getUserActiveSessions(ctx.userId, currentSessionId);

  return success({
    total: devices.length,
    currentSessionId,
    devices: devices.map((d) => ({
      id: d.id,
      isCurrent: d.isCurrent,
      rotationCount: d.rotationCount,
      ipAddress: d.ipAddress,
      device: d.device,
      createdAt: d.createdAt,
      lastActiveAt: d.lastActiveAt,
      expiresAt: d.expiresAt,
    })),
  });
}

/**
 * 设备统计
 */
async function countDevices(ctx: AuthContext) {
  const count = await prisma.coreSession.count({
    where: {
      userId: ctx.userId as any,
      status: 'active',
      refreshUsed: false,
    } as any,
  });

  return success({ activeDeviceCount: count });
}

/**
 * 撤销单设备
 *  - body: { sessionId: string }
 *  - 验证所有权（必须属于当前用户）
 *  - 不允许撤销当前会话
 */
async function revokeDevice(ctx: AuthContext, req: NextRequest, body: any) {
  const { sessionId } = body;
  if (!sessionId) {
    return badRequest('Missing sessionId in body');
  }
  if (typeof sessionId !== 'string' || sessionId.length < 10) {
    return badRequest('Invalid sessionId format');
  }

  // 不允许撤销当前会话（应使用 logout）
  const currentSessionId = await getCurrentSessionId(ctx, req);
  if (sessionId === currentSessionId) {
    return forbidden('Cannot revoke current session. Use logout instead.');
  }

  // 验证所有权
  const target = await prisma.coreSession.findUnique({
    where: { id: sessionId as any },
    select: { id: true, userId: true, status: true } as any,
  });

  if (!target) {
    return notFound('Session not found');
  }
  if ((target as any).userId !== ctx.userId) {
    return forbidden('Session does not belong to current user');
  }
  if ((target as any).status !== 'active') {
    return badRequest('Session is not active');
  }

  // 撤销
  const revoked = await revokeSessionById(ctx.userId, sessionId);
  if (!revoked) {
    return badRequest('Failed to revoke session (may have been revoked already)');
  }

  logger.info(`[user/devices] User ${ctx.userId} revoked session ${sessionId}`);

  return success({
    revoked: true,
    sessionId,
    message: 'Device session revoked. The device will be logged out.',
  });
}

/**
 * 登出其他所有设备
 *  - body: { currentSessionId?: string }（可选，未传则从 token 反查）
 *  - 保留当前会话，撤销其他所有
 */
async function logoutOthers(ctx: AuthContext, req: NextRequest, body: any) {
  const currentSessionId = body.currentSessionId || (await getCurrentSessionId(ctx, req));
  if (!currentSessionId) {
    return badRequest('Missing currentSessionId (cannot determine current session)');
  }

  // 验证当前会话属于用户
  const current = await prisma.coreSession.findUnique({
    where: { id: currentSessionId as any },
    select: { id: true, userId: true } as any,
  });
  if (!current) {
    return notFound('Current session not found');
  }
  if ((current as any).userId !== ctx.userId) {
    return forbidden('Current session does not belong to current user');
  }

  const revokedCount = await revokeAllUserSessionsExcept(ctx.userId, currentSessionId);

  logger.info(
    `[user/devices] User ${ctx.userId} logged out ${revokedCount} other device(s), kept current ${currentSessionId}`,
  );

  return success({
    loggedOutOthers: revokedCount,
    currentSessionId,
    message: `Logged out ${revokedCount} other device(s).`,
  });
}

// ============================================================
// Helpers
// ============================================================

/**
 * 从请求中反查当前 sessionId
 *  - 通过 access token 查找 CoreSession
 */
async function getCurrentSessionId(ctx: AuthContext, req: NextRequest): Promise<string | null> {
  // 提取 access token
  const authHeader = req.headers.get('authorization');
  let token: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }
  if (!token) {
    // 尝试从 cookie 提取
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const m = cookieHeader.match(/access_token=([^;]+)/);
      if (m) token = m[1];
    }
  }

  if (!token) return null;

  try {
    const session = await prisma.coreSession.findFirst({
      where: {
        token,
        userId: ctx.userId as any,
        status: 'active',
      } as any,
      select: { id: true } as any,
    });
    return (session as any)?.id || null;
  } catch (e) {
    logger.warn(`[user/devices] getCurrentSessionId failed: ${(e as any).message}`);
    return null;
  }
}
