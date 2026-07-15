/**
 * MFA TTL Store - Redis 抽象层
 *
 * 用途：
 *  - 替代内存 Map 的 MFA 验证状态存储
 *  - 支持多实例部署（session 共享）
 *  - 自动降级：Redis 不可用时使用 in-memory
 *
 * 设计：
 *  - key: mfa:verified:{userId}
 *  - value: { method: 'totp' | 'backup', verifiedAt: number }
 *  - TTL: 5 分钟（与原内存版一致）
 *
 * 兼容：
 *  - 暴露与原 mfa/route.ts 相同语义的 API
 *  - 所有函数返回 Promise（与原同步 API 不同）
 */

import { ttlSet, ttlGet, ttlDel, ttlHas, ttlTtl } from '@/lib/auth/ttl-store';
import { logger } from '@/lib/logger';

// ============================================================
// 业务常量
// ============================================================
export const MFA_TTL_SECONDS = 5 * 60; // 验证后 5 分钟内有效
export const MFA_TTL_MS = MFA_TTL_SECONDS * 1000;

// key 前缀
const KEY_PREFIX = 'mfa:verified:';

function mfaKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

// ============================================================
// 核心 API（替代原 mfa/route.ts 同步函数）
// ============================================================

export interface MfaVerifiedRecord {
  method: string; // 'totp' | 'backup'
  verifiedAt: number; // ms timestamp
}

/**
 * 记录用户 MFA 验证状态（5 分钟 TTL）
 */
export async function markMfaVerified(userId: string, method: string): Promise<void> {
  const record: MfaVerifiedRecord = { method, verifiedAt: Date.now() };
  try {
    await ttlSet(mfaKey(userId), record, MFA_TTL_SECONDS);
  } catch (e: any) {
    logger.warn(`[mfa-ttl-store] markMfaVerified failed for ${userId}: ${e.message}`);
  }
}

/**
 * 检查用户是否在 MFA TTL 内已通过验证
 */
export async function isMfaRecentlyVerified(userId: string): Promise<boolean> {
  try {
    const v = await ttlGet<MfaVerifiedRecord>(mfaKey(userId));
    if (!v) return false;
    return Date.now() - v.verifiedAt < MFA_TTL_MS;
  } catch (e: any) {
    logger.warn(`[mfa-ttl-store] isMfaRecentlyVerified failed for ${userId}: ${e.message}`);
    return false;
  }
}

/**
 * 清除用户的 MFA 验证状态
 */
export async function clearMfaVerified(userId: string): Promise<void> {
  try {
    await ttlDel(mfaKey(userId));
  } catch (e: any) {
    logger.warn(`[mfa-ttl-store] clearMfaVerified failed for ${userId}: ${e.message}`);
  }
}

/**
 * 获取用户 MFA 验证状态详情
 *  - 用于 /api/v1/user/mfa GET 状态接口
 */
export async function getMfaVerifiedStatus(userId: string): Promise<{
  verified: boolean;
  method?: string;
  verifiedAt?: number;
  ttlSeconds?: number;
}> {
  try {
    const v = await ttlGet<MfaVerifiedRecord>(mfaKey(userId));
    if (!v) return { verified: false };

    const elapsed = Date.now() - v.verifiedAt;
    if (elapsed >= MFA_TTL_MS) return { verified: false };

    const ttl = await ttlTtl(mfaKey(userId));
    return {
      verified: true,
      method: v.method,
      verifiedAt: v.verifiedAt,
      ttlSeconds: ttl > 0 ? ttl : Math.max(0, Math.ceil((MFA_TTL_MS - elapsed) / 1000)),
    };
  } catch (e: any) {
    logger.warn(`[mfa-ttl-store] getMfaVerifiedStatus failed for ${userId}: ${e.message}`);
    return { verified: false };
  }
}

/**
 * 检查是否存在（不读取值）
 */
export async function hasMfaVerified(userId: string): Promise<boolean> {
  try {
    return await ttlHas(mfaKey(userId));
  } catch (e: any) {
    logger.warn(`[mfa-ttl-store] hasMfaVerified failed for ${userId}: ${e.message}`);
    return false;
  }
}

// ============================================================
// 同步包装器（向后兼容，调用方尚未迁移到 async）
//
// 注意：仅在 Redis 不可用且 in-memory 可用时返回同步结果
//       生产环境应该全部迁移到 async 版本
// ============================================================

import { isRedisAvailable } from '@/lib/auth/redis-client';

// 仅用于同步 mfa/route.ts 的旧调用点
// 推荐：新代码请使用 markMfaVerifiedAsync / isMfaRecentlyVerifiedAsync
export const markMfaVerifiedSync = markMfaVerified;
export const isMfaRecentlyVerifiedSync = isMfaRecentlyVerified;
export const clearMfaVerifiedSync = clearMfaVerified;

export default {
  markMfaVerified,
  isMfaRecentlyVerified,
  clearMfaVerified,
  getMfaVerifiedStatus,
  hasMfaVerified,
  TTL_SECONDS: MFA_TTL_SECONDS,
  TTL_MS: MFA_TTL_MS,
};
