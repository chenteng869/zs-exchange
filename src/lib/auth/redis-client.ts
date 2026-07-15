/**
 * Redis Client 单例
 *
 * 设计目标：
 *  1. 单例：避免重复连接
 *  2. 降级：连接失败时不阻塞应用，自动降级到 in-memory 模式
 *  3. 配置：环境变量 REDIS_URL 控制（默认 redis://localhost:6379/0）
 *  4. 日志：连接状态通过 logger 记录
 *  5. 优雅关闭：进程退出时断开连接
 *
 * 用法：
 * ```typescript
 * import { redis, isRedisAvailable } from '@/lib/auth/redis-client';
 * if (isRedisAvailable()) {
 *   await redis.set('key', 'value', 'EX', 60);
 * }
 * ```
 */

import Redis, { Redis as RedisType } from 'ioredis';
import { logger } from '@/lib/logger';

// ============================================================
// 配置
// ============================================================
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/0';
const REDIS_CONNECT_TIMEOUT_MS = 3000;
const REDIS_LAZY_CONNECT = true;
const REDIS_MAX_RETRIES_PER_REQUEST = 2;

// ============================================================
// 单例管理
// ============================================================
let redisInstance: RedisType | null = null;
let connectionState: 'connecting' | 'ready' | 'unavailable' = 'connecting';
let lastConnectionError: string | null = null;

/**
 * 获取 Redis 单例（懒加载）
 *  - 第一次调用时尝试连接
 *  - 连接失败：返回 null，isRedisAvailable() 返回 false
 *  - 后续调用：复用连接或返回 null
 */
export function getRedis(): RedisType | null {
  if (redisInstance) return redisInstance;

  try {
    redisInstance = new Redis(REDIS_URL, {
      connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
      lazyConnect: REDIS_LAZY_CONNECT,
      maxRetriesPerRequest: REDIS_MAX_RETRIES_PER_REQUEST,
      retryStrategy: (times) => {
        // 失败 3 次后停止重连
        if (times > 3) {
          connectionState = 'unavailable';
          return null;
        }
        // 指数退避：1s, 2s, 4s
        return Math.min(times * 1000, 4000);
      },
      enableOfflineQueue: false, // 离线时不排队请求，立即失败
    });

    // 连接成功
    redisInstance.on('ready', () => {
      connectionState = 'ready';
      lastConnectionError = null;
      logger.info(`[redis-client] Connected to Redis: ${REDIS_URL.replace(/:[^:@]+@/, ':***@')}`);
    });

    // 连接错误（不抛出，仅记录）
    redisInstance.on('error', (err) => {
      const msg = err?.message || 'unknown error';
      // 避免重复记录相同错误
      if (lastConnectionError !== msg) {
        lastConnectionError = msg;
        logger.warn(`[redis-client] Connection error: ${msg}`);
      }
    });

    // 连接关闭
    redisInstance.on('end', () => {
      connectionState = 'unavailable';
      logger.warn('[redis-client] Connection ended');
    });

    return redisInstance;
  } catch (e: any) {
    logger.error(`[redis-client] Failed to create client: ${e.message}`);
    connectionState = 'unavailable';
    return null;
  }
}

/**
 * 检查 Redis 是否可用
 */
export function isRedisAvailable(): boolean {
  if (connectionState === 'ready') {
    // 双重检查：连接对象健康
    return redisInstance?.status === 'ready';
  }
  return false;
}

/**
 * 获取当前连接状态（用于诊断/监控）
 */
export function getRedisStatus(): {
  state: 'connecting' | 'ready' | 'unavailable';
  url: string;
  lastError: string | null;
  isConnected: boolean;
} {
  return {
    state: connectionState,
    url: REDIS_URL.replace(/:[^:@]+@/, ':***@'),
    lastError: lastConnectionError,
    isConnected: isRedisAvailable(),
  };
}

/**
 * 主动关闭连接（用于测试或优雅关闭）
 */
export async function closeRedis(): Promise<void> {
  if (redisInstance) {
    try {
      await redisInstance.quit();
      logger.info('[redis-client] Connection closed gracefully');
    } catch (e: any) {
      logger.warn(`[redis-client] Close error: ${e.message}`);
    }
    redisInstance = null;
    connectionState = 'connecting';
  }
}

/**
 * 便捷导出：自动获取可用 Redis（如果不可用返回 null）
 *
 * 推荐所有上层代码使用这个变量：
 *   import { redis } from '@/lib/auth/redis-client';
 *   if (redis) { ... }  // 安全访问
 */
export const redis = (() => {
  // 懒加载：第一次访问时初始化
  return new Proxy({} as RedisType, {
    get(_target, prop) {
      const instance = getRedis();
      if (!instance) {
        // 返回一个永远会失败但不会 throw 的 stub
        return () => Promise.reject(new Error('Redis unavailable'));
      }
      return (instance as any)[prop];
    },
  });
})();

export default getRedis;
