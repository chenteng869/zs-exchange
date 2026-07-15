/**
 * 统一 TTL Store 抽象层
 *
 * 设计目标：
 *  1. 抽象后端：Redis 优先，in-memory 降级
 *  2. 统一接口：set / get / del / has / ttl
 *  3. 自动序列化：所有 value 自动 JSON 编码
 *  4. 透明降级：Redis 不可用时自动用 in-memory（开发/单实例环境）
 *
 * 用法：
 * ```typescript
 * import { ttlStore } from '@/lib/auth/ttl-store';
 *
 * // 设置（TTL 5 分钟）
 * await ttlStore.set(`mfa:verified:${userId}`, { method: 'totp' }, 300);
 *
 * // 获取
 * const v = await ttlStore.get<{ method: string }>(`mfa:verified:${userId}`);
 *
 * // 删除
 * await ttlStore.del(`mfa:verified:${userId}`);
 * ```
 *
 * 滑动窗口计数器（用于异常检测）：
 * ```typescript
 * await ttlStore.incrWindow(`rotation:${userId}`, 60);  // 60s 窗口
 * const count = await ttlStore.getWindow(`rotation:${userId}`);
 * ```
 */

import { getRedis, isRedisAvailable } from '@/lib/auth/redis-client';
import { logger } from '@/lib/logger';
import { safeJsonParse } from '@/lib/security/safe-json-parse';

// ============================================================
// In-Memory 降级存储
// ============================================================
interface MemoryEntry {
  value: any;
  expiresAt: number; // 0 = 永不过期
}

const memoryStore = new Map<string, MemoryEntry>();

function memoryGet(key: string): any | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: any, ttlSeconds: number): void {
  const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0;
  memoryStore.set(key, { value, expiresAt });
}

function memoryDel(key: string): void {
  memoryStore.delete(key);
}

function memoryExists(key: string): boolean {
  return memoryGet(key) !== null;
}

// 定期清理过期的内存项（每 60 秒一次）
let memoryCleanupTimer: NodeJS.Timeout | null = null;
function ensureMemoryCleanup(): void {
  if (memoryCleanupTimer) return;
  memoryCleanupTimer = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.expiresAt > 0 && now > entry.expiresAt) {
        memoryStore.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0 && process.env.NODE_ENV === 'development') {
      logger.debug(`[ttl-store] Cleaned ${cleaned} expired memory entries`);
    }
  }, 60_000);
  // unref 防止 Node 进程退出被阻塞
  if (memoryCleanupTimer.unref) memoryCleanupTimer.unref();
}

// ============================================================
// 公共 API
// ============================================================

/**
 * 设置 key-value（带 TTL 秒数）
 *  - ttlSeconds <= 0: 永不过期
 *  - 返回 true: 写入成功
 */
export async function ttlSet(
  key: string,
  value: any,
  ttlSeconds: number = 0,
): Promise<boolean> {
  const serialized = JSON.stringify(value);
  if (isRedisAvailable()) {
    try {
      const r = getRedis();
      if (r) {
        if (ttlSeconds > 0) {
          await r.set(key, serialized, 'EX', ttlSeconds);
        } else {
          await r.set(key, serialized);
        }
        return true;
      }
    } catch (e: any) {
      logger.warn(`[ttl-store] Redis set failed for ${key}: ${e.message}, fallback to memory`);
    }
  }
  // 降级到内存
  ensureMemoryCleanup();
  memorySet(key, value, ttlSeconds);
  return true;
}

/**
 * 获取 key 对应的 value（已反序列化）
 *  - 返回 null: 不存在或已过期
 */
export async function ttlGet<T = any>(key: string): Promise<T | null> {
  if (isRedisAvailable()) {
    try {
      const r = getRedis();
      if (r) {
        const raw = await r.get(key);
        if (raw === null) return null;
        const parsed = safeJsonParse<T>(raw, {
          context: 'ttl-store-get',
          maxBytes: 5 * 1024 * 1024,
          silent: true,
          defaultValue: null,
        });
        return parsed;
      }
    } catch (e: any) {
      logger.warn(`[ttl-store] Redis get failed for ${key}: ${e.message}, fallback to memory`);
    }
  }
  return memoryGet(key) as T | null;
}

/**
 * 删除 key
 */
export async function ttlDel(key: string): Promise<boolean> {
  if (isRedisAvailable()) {
    try {
      const r = getRedis();
      if (r) {
        const count = await r.del(key);
        return count > 0;
      }
    } catch (e: any) {
      logger.warn(`[ttl-store] Redis del failed for ${key}: ${e.message}, fallback to memory`);
    }
  }
  const existed = memoryExists(key);
  memoryDel(key);
  return existed;
}

/**
 * 检查 key 是否存在且未过期
 */
export async function ttlHas(key: string): Promise<boolean> {
  if (isRedisAvailable()) {
    try {
      const r = getRedis();
      if (r) {
        const count = await r.exists(key);
        return count > 0;
      }
    } catch (e: any) {
      logger.warn(`[ttl-store] Redis exists failed for ${key}: ${e.message}, fallback to memory`);
    }
  }
  return memoryExists(key);
}

/**
 * 获取剩余 TTL（秒）
 *  - 返回 -1: 永不过期
 *  - 返回 -2: 不存在
 */
export async function ttlTtl(key: string): Promise<number> {
  if (isRedisAvailable()) {
    try {
      const r = getRedis();
      if (r) {
        return await r.ttl(key);
      }
    } catch (e: any) {
      logger.warn(`[ttl-store] Redis ttl failed for ${key}: ${e.message}, fallback to memory`);
    }
  }
  const entry = memoryStore.get(key);
  if (!entry) return -2;
  if (entry.expiresAt === 0) return -1;
  const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
  return remaining > 0 ? remaining : -2;
}

// ============================================================
// 滑动窗口（用于异常检测）
// ============================================================

/**
 * 递增滑动窗口计数器
 *  - 使用 Redis INCR + EXPIRE 原子操作
 *  - 降级：使用数组 + 清理过期戳
 *
 * @param key 计数器 key
 * @param windowSeconds 窗口大小（秒）
 * @returns 当前窗口内的累计计数
 */
export async function ttlIncrWindow(
  key: string,
  windowSeconds: number,
): Promise<number> {
  if (isRedisAvailable()) {
    try {
      const r = getRedis();
      if (r) {
        // 原子递增 + 设置 TTL（仅在 key 不存在时设置）
        const pipeline = r.pipeline();
        pipeline.incr(key);
        pipeline.expire(key, windowSeconds, 'NX');
        const results = await pipeline.exec();
        if (results && results[0]) {
          return (results[0][1] as number) || 0;
        }
      }
    } catch (e: any) {
      logger.warn(`[ttl-store] Redis incr window failed for ${key}: ${e.message}, fallback to memory`);
    }
  }

  // 内存降级：使用时间戳数组
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const entry = memoryStore.get(key);
  let timestamps: number[] = [];

  if (entry && entry.expiresAt > now) {
    timestamps = entry.value as number[];
    // 清理窗口外的旧戳
    timestamps = timestamps.filter((t) => t > now - windowMs);
  }
  timestamps.push(now);
  memorySet(key, timestamps, windowSeconds);
  return timestamps.length;
}

/**
 * 获取当前窗口内的计数
 */
export async function ttlGetWindow(
  key: string,
  windowSeconds: number,
): Promise<number> {
  if (isRedisAvailable()) {
    try {
      const r = getRedis();
      if (r) {
        const count = await r.get(key);
        if (count === null) return 0;
        return parseInt(count, 10) || 0;
      }
    } catch (e: any) {
      logger.warn(`[ttl-store] Redis get window failed for ${key}: ${e.message}, fallback to memory`);
    }
  }
  const entry = memoryStore.get(key);
  if (!entry) return 0;
  const windowMs = windowSeconds * 1000;
  const now = Date.now();
  const timestamps = entry.value as number[];
  return timestamps.filter((t) => t > now - windowMs).length;
}

// ============================================================
// 便捷对象导出
// ============================================================
export const ttlStore = {
  set: ttlSet,
  get: ttlGet,
  del: ttlDel,
  has: ttlHas,
  ttl: ttlTtl,
  incrWindow: ttlIncrWindow,
  getWindow: ttlGetWindow,
};

export default ttlStore;
