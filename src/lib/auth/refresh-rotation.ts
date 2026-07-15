/**
 * Refresh Token Rotation Service (P0-9)
 *
 * 设计目标：
 *  1. 一次使用：refresh token 用过后立即失效
 *  2. 旋转：用旧 refresh 换新 access + refresh
 *  3. 重放检测：同一 refresh 二次使用 → 整族吊销
 *  4. 家族追踪：同一登录族的 sessions 共享 refreshFamilyId
 *  5. 异常检测：rotationCount 异常增长 → 触发告警
 *
 * 工作流：
 *  1. login → 创建 session (familyId = session.id)
 *  2. refresh → 检查 session.refreshUsed
 *     - false: 标记为 used，创建新 session (familyId 继承, rotatedFromId = current.id)
 *     - true: 重放攻击！吊销整族所有 session
 *  3. logout → 标记为 revoked
 *
 * 审计依据: J-1.7 认证与会话安全审计 - 2.4 Refresh Token 重放 (HIGH)
 *
 * 性能优化 (K-5):
 *  - 异常检测从数据库 count 迁移到 Redis 滑动窗口
 *  - 优势：O(1) 时间复杂度，支持多实例
 *  - 降级：Redis 不可用时使用数据库 count
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { generateTokenPair, verifyRefreshToken } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';
import { ttlIncrWindow, ttlGetWindow } from '@/lib/auth/ttl-store';
import { isRedisAvailable } from '@/lib/auth/redis-client';

// ============================================================
// 异常检测配置
// ============================================================
const ABNORMAL_ROTATION_WINDOW_SECONDS = 60; // 60 秒窗口
const ABNORMAL_ROTATION_THRESHOLD = 5; // >= 5 次视为异常

// key 前缀
const ROTATION_KEY_PREFIX = 'mfa:rotation:';
function rotationKey(userId: string): string {
  return `${ROTATION_KEY_PREFIX}${userId}`;
}

// ============================================================
// 异常类
// ============================================================
export class RefreshRotationError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly familyRevoked: boolean;

  constructor(code: string, message: string, httpStatus: number, familyRevoked: boolean = false) {
    super(message);
    this.name = 'RefreshRotationError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.familyRevoked = familyRevoked;
  }
}

// ============================================================
// Service
// ============================================================

export interface RotateResult {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  familyId: string;
  rotationCount: number;
}

/**
 * 创建新 session（首次登录或注册）
 * familyId 默认 = session.id
 */
export async function createSession(params: {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  ttlMs?: number;
}) {
  const { userId, ipAddress, userAgent, ttlMs = 7 * 24 * 60 * 60 * 1000 } = params;

  // 1. 生成 token 对
  const tokens = await generateTokenPair({
    userId,
    username: '', // 留空，session 不需要 username
    userType: 'retail',
  });

  // 2. 预生成 UUID（refreshFamilyId 字段 NOT NULL 约束）
  //    首登 session 的 familyId = 自身 id
  const newSessionId = crypto.randomUUID();
  const familyId = newSessionId;

  const session = await prisma.coreSession.create({
    data: {
      id: newSessionId as any,
      userId: userId as any,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status: 'active',
      refreshFamilyId: familyId as any, // 首登 = 自身
      refreshUsed: false,
      rotationCount: 0,
      expiresAt: new Date(Date.now() + ttlMs),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    } as any,
  });

  return {
    session,
    tokens: { ...tokens, familyId },
  };
}

/**
 * 旋转 refresh token
 *
 * 规则：
 *  1. 验证 JWT
 *  2. 查找 session by refreshToken
 *  3. 如果 session.refreshUsed = true → 重放攻击 → 吊销整族
 *  4. 标记当前 session.refreshUsed = true, refreshUsedAt = now
 *  5. 创建新 session：familyId 继承，rotatedFromId = current.id, rotationCount+1
 *  6. 返回新 tokens
 */
export async function rotateRefreshToken(params: {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<RotateResult> {
  const { refreshToken, ipAddress, userAgent } = params;

  // 1. 验证 JWT
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload || !payload.userId) {
    throw new RefreshRotationError('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token', 401);
  }

  // 2. 查找 session
  const session = await prisma.coreSession.findUnique({
    where: { refreshToken },
  });

  if (!session) {
    throw new RefreshRotationError('SESSION_NOT_FOUND', 'Session not found', 401);
  }

  // 3. 检查 session 状态
  if (session.status !== 'active') {
    throw new RefreshRotationError('SESSION_INACTIVE', `Session is ${session.status}`, 401);
  }

  // 4. 检查是否已用过（重放检测）
  if ((session as any).refreshUsed === true) {
    logger.warn(
      `[refresh-rotation] REPLAY ATTACK detected! refreshToken used twice. Family: ${(session as any).refreshFamilyId}, User: ${payload.userId}`,
    );
    // 吊销整族
    await revokeFamily((session as any).refreshFamilyId, 'replay_attack');
    throw new RefreshRotationError(
      'REFRESH_REPLAY_DETECTED',
      'Refresh token reuse detected. All sessions in this family have been revoked.',
      401,
      true,
    );
  }

  // 5. 标记为已用
  await prisma.coreSession.update({
    where: { id: session.id },
    data: {
      refreshUsed: true,
      refreshUsedAt: new Date(),
      // 当前 session 保留为 active（前端可继续使用 accessToken），但 refreshToken 已失效
    } as any,
  });

  // 6. 创建新 session（继承 familyId）
  const familyId = (session as any).refreshFamilyId;
  const newTokens = await generateTokenPair({
    userId: payload.userId as string,
    username: '',
    userType: 'retail',
  });

  const newSession = await prisma.coreSession.create({
    data: {
      id: crypto.randomUUID() as any,
      userId: session.userId as any,
      token: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      status: 'active',
      refreshFamilyId: familyId as any,
      rotatedFromId: session.id as any,
      rotationCount: ((session as any).rotationCount || 0) + 1,
      expiresAt: session.expiresAt, // 继承原 session 的过期时间
      ipAddress: ipAddress || (session as any).ipAddress || null,
      userAgent: userAgent || (session as any).userAgent || null,
    } as any,
  });

  logger.info(
    `[refresh-rotation] Rotated session ${session.id} → ${newSession.id} (family: ${familyId}, rotation: ${((session as any).rotationCount || 0) + 1})`,
  );

  // K-5: 异常旋转检测（Redis 滑动窗口）
  // 每次成功旋转都计入窗口；阈值 >= 5/60s 视为异常
  let rotationCountInWindow = 0;
  try {
    rotationCountInWindow = await ttlIncrWindow(
      rotationKey(payload.userId as string),
      ABNORMAL_ROTATION_WINDOW_SECONDS,
    );
  } catch (e: any) {
    logger.warn(`[refresh-rotation] Redis incr window failed: ${e.message}`);
  }

  // 异常检测（异步，不阻塞响应）
  if (rotationCountInWindow >= ABNORMAL_ROTATION_THRESHOLD) {
    logger.warn(
      `[refresh-rotation] ABNORMAL ROTATION detected! userId=${payload.userId}, count=${rotationCountInWindow} in ${ABNORMAL_ROTATION_WINDOW_SECONDS}s`,
    );
    // 不在主流程阻塞，但记录告警（阶段 M 将接入 SIEM）
  }

  return {
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken,
    tokenType: 'Bearer',
    expiresIn: 15 * 60,
    familyId: familyId as string,
    rotationCount: ((session as any).rotationCount || 0) + 1,
  };
}

/**
 * 登出：标记当前 session 为 revoked
 */
export async function logoutSession(refreshToken: string): Promise<boolean> {
  const session = await prisma.coreSession.findUnique({ where: { refreshToken } });
  if (!session) return false;

  await prisma.coreSession.update({
    where: { id: session.id },
    data: { status: 'revoked' } as any,
  });
  return true;
}

/**
 * 吊销整族所有 session（重放攻击响应）
 */
export async function revokeFamily(familyId: string, reason: string): Promise<number> {
  const result = await prisma.coreSession.updateMany({
    where: { refreshFamilyId: familyId as any },
    data: { status: 'revoked' } as any,
  });

  logger.warn(
    `[refresh-rotation] Revoked family ${familyId} (${result.count} sessions). Reason: ${reason}`,
  );
  return result.count;
}

/**
 * 吊销用户所有 session（强制登出所有设备）
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  const result = await prisma.coreSession.updateMany({
    where: { userId: userId as any, status: 'active' },
    data: { status: 'revoked' } as any,
  });
  return result.count;
}

/**
 * 获取用户的所有活跃 session（用于"我的设备"页面）
 *
 * L-1 增强：
 *  - 返回当前会话标记（currentSessionId）
 *  - 解析 User-Agent（设备类型 + 浏览器 + OS）
 *  - 包含上次活跃时间
 */
export async function getUserActiveSessions(userId: string, currentSessionId?: string) {
  const sessions = await prisma.coreSession.findMany({
    where: {
      userId: userId as any,
      status: 'active',
      refreshUsed: false, // 只显示未被旋转的（即当前活跃的 refresh）
    } as any,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      refreshFamilyId: true,
      rotationCount: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return sessions.map((s: any) => ({
    id: s.id,
    familyId: s.refreshFamilyId,
    isCurrent: currentSessionId ? s.id === currentSessionId : false,
    rotationCount: s.rotationCount,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    device: parseUserAgent(s.userAgent || ''),
    createdAt: s.createdAt,
    lastActiveAt: s.createdAt, // 实际无独立字段
    expiresAt: s.expiresAt,
  }));
}

/**
 * 解析 User-Agent 字符串
 *  - 简化版：仅识别常见设备类型
 *  - 生产环境建议使用 ua-parser-js
 */
function parseUserAgent(ua: string): {
  type: string; // desktop | mobile | tablet | bot | unknown
  os: string;
  browser: string;
  device: string;
} {
  if (!ua) return { type: 'unknown', os: 'unknown', browser: 'unknown', device: 'unknown' };

  let type = 'desktop';
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    type = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
  }
  if (/bot|spider|crawl/i.test(ua)) type = 'bot';

  let os = 'unknown';
  if (/Windows NT/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iOS/.test(ua)) os = 'iOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  let browser = 'unknown';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua)) browser = 'Safari';
  else if (/MicroMessenger/i.test(ua)) browser = 'WeChat';

  // 设备型号（仅 mobile）
  let device = 'unknown';
  if (type === 'mobile') {
    const iPhoneMatch = ua.match(/iPhone OS (\d+_\d+)/);
    if (iPhoneMatch) device = `iPhone iOS ${iPhoneMatch[1].replace('_', '.')}`;
    else if (/Android.*;\s*([^)]+)\s*Build/.test(ua)) {
      device = ua.match(/Android.*;\s*([^)]+)\s*Build/)![1].trim();
    }
  }

  return { type, os, browser, device };
}

/**
 * 撤销单个 session（"我的设备" - 登出此设备）
 *  - 验证所有权
 *  - 标记为 revoked
 */
export async function revokeSessionById(userId: string, sessionId: string): Promise<boolean> {
  const result = await prisma.coreSession.updateMany({
    where: {
      id: sessionId as any,
      userId: userId as any,
      status: 'active',
    } as any,
    data: { status: 'revoked' } as any,
  });
  return result.count > 0;
}

/**
 * 撤销用户除当前外的所有 session（"我的设备" - 登出其他设备）
 *  - 保留 currentSessionId
 *  - 标记其他为 revoked
 */
export async function revokeAllUserSessionsExcept(
  userId: string,
  currentSessionId: string,
): Promise<number> {
  const result = await prisma.coreSession.updateMany({
    where: {
      userId: userId as any,
      status: 'active',
      id: { not: currentSessionId as any },
    } as any,
    data: { status: 'revoked' } as any,
  });
  return result.count;
}

/**
 * 异常旋转检测：短时间内 rotation 次数过多
 *  - 阈值：60 秒内 >= 5 次旋转
 *
 * K-5 性能优化：
 *  - 优先：Redis 滑动窗口 O(1)
 *  - 降级：数据库 count（Redis 不可用时）
 */
export async function detectAbnormalRotation(userId: string): Promise<boolean> {
  // 1. 优先尝试 Redis 滑动窗口
  if (isRedisAvailable()) {
    try {
      const count = await ttlGetWindow(
        rotationKey(userId),
        ABNORMAL_ROTATION_WINDOW_SECONDS,
      );
      return count >= ABNORMAL_ROTATION_THRESHOLD;
    } catch (e: any) {
      logger.warn(`[refresh-rotation] Redis window check failed: ${e.message}, fallback to DB`);
    }
  }

  // 2. 降级：数据库 count
  try {
    const sixtySecondsAgo = new Date(Date.now() - ABNORMAL_ROTATION_WINDOW_SECONDS * 1000);
    const recentRotations = await prisma.coreSession.count({
      where: {
        userId: userId as any,
        rotatedFromId: { not: null } as any,
        createdAt: { gte: sixtySecondsAgo },
      } as any,
    });
    return recentRotations >= ABNORMAL_ROTATION_THRESHOLD;
  } catch (e: any) {
    logger.error(`[refresh-rotation] DB abnormal rotation check failed: ${e.message}`);
    return false; // 失败时保守返回 false，不阻塞用户
  }
}

/**
 * 记录一次旋转事件（用于异常检测）
 *  - 通常在 rotateRefreshToken 内部调用，此函数用于其他场景
 */
export async function recordRotation(userId: string): Promise<number> {
  try {
    return await ttlIncrWindow(
      rotationKey(userId),
      ABNORMAL_ROTATION_WINDOW_SECONDS,
    );
  } catch (e: any) {
    logger.warn(`[refresh-rotation] recordRotation failed: ${e.message}`);
    return 0;
  }
}

/**
 * 重置用户的旋转计数（用户主动登出/重置时）
 */
export async function resetRotationCounter(userId: string): Promise<void> {
  try {
    const { ttlDel } = await import('@/lib/auth/ttl-store');
    await ttlDel(rotationKey(userId));
  } catch (e: any) {
    logger.warn(`[refresh-rotation] resetRotationCounter failed: ${e.message}`);
  }
}

/**
 * 获取当前用户的旋转计数（用于诊断/监控）
 */
export async function getRotationCount(userId: string): Promise<number> {
  if (isRedisAvailable()) {
    try {
      return await ttlGetWindow(
        rotationKey(userId),
        ABNORMAL_ROTATION_WINDOW_SECONDS,
      );
    } catch (e: any) {
      logger.warn(`[refresh-rotation] getRotationCount failed: ${e.message}`);
    }
  }
  return 0;
}

// 导出配置常量（供监控/测试使用）
export const ABNORMAL_ROTATION_CONFIG = {
  WINDOW_SECONDS: ABNORMAL_ROTATION_WINDOW_SECONDS,
  THRESHOLD: ABNORMAL_ROTATION_THRESHOLD,
};
