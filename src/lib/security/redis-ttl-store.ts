/**
 * Redis TTL Store - 统一 TTL + 滑动窗口抽象
 *
 * 文档：docs/reports/阶段K-性能优化复盘报告-2026-07-01.md
 *
 * 设计目标：
 *  - 提供统一的 TTL / Sliding Window / Counter / Set 抽象
 *  - 自动降级：Redis 不可用时使用 in-memory fallback（生产强制 Redis）
 *  - 错误隔离：Redis 异常不阻塞主业务流程
 *
 * 核心场景：
 *  - MFA 挑战码（5min TTL）：mfa:challenge:{userId}
 *  - MFA 已用 nonce（10min TTL）：mfa:used-nonce:{userId}:{nonce}
 *  - 异常登录滑动窗口（15min 5次）：auth:fail:{userId}
 *  - API Rate Limit：api:ratelimit:{key}
 */

import { logger } from '../logger';
const log = {
  debug: (msg: string) => logger.debug(msg),
  info: (msg: string) => logger.info(msg),
  warn: (msg: string) => logger.warn(msg),
  error: (msg: string) => logger.error(msg),
};

// ============================================================
// 类型定义
// ============================================================

export interface TTLStore {
  /** 设置带 TTL 的值（秒） */
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  /** 获取值（过期返回 null） */
  get(key: string): Promise<string | null>;
  /** 删除 key */
  del(key: string): Promise<number>;
  /** 自增并返回新值（可设置初始 TTL） */
  incr(key: string, ttlSeconds?: number): Promise<number>;
  /** 原子自减并返回新值（不设置 TTL） */
  decr(key: string): Promise<number>;
  /** 设置过期时间 */
  expire(key: string, ttlSeconds: number): Promise<boolean>;
  /** 滑动窗口：key 在 ttlSeconds 内的计数（包含本次 inc） */
  slidingWindowIncr(key: string, ttlSeconds: number): Promise<number>;
  /** 后台清理（仅 in-memory 模式） */
  cleanup?(): void;
  /** 模式（用于调试 + 健康检查） */
  readonly mode: 'redis' | 'memory';
  /** 是否已连接（仅 Redis 模式有意义；in-memory 永远 true） */
  isConnected?(): boolean;
}

export interface RedisTTLStoreOptions {
  /** Redis URL (e.g. redis://localhost:6379/0)，undefined 时使用 in-memory */
  redisUrl?: string;
  /** 强制 in-memory（用于测试） */
  forceMemory?: boolean;
  /** 内存清理间隔（ms），默认 60s */
  memoryCleanupIntervalMs?: number;
  /** 健康检查失败时是否重连（默认 true） */
  autoReconnect?: boolean;
}

// ============================================================
// In-Memory 实现（兜底）
// ============================================================

interface MemoryEntry {
  value: string;
  expiresAt: number; // 0 表示无过期
}

class InMemoryTTLStore implements TTLStore {
  readonly mode = 'memory' as const;
  private store = new Map<string, MemoryEntry>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(cleanupIntervalMs = 60_000) {
    this.cleanupTimer = setInterval(() => this.cleanup(), cleanupIntervalMs);
    if (typeof this.cleanupTimer.unref === 'function') {
      this.cleanupTimer.unref();
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0;
    this.store.set(key, { value, expiresAt });
  }

  async get(key: string): Promise<string | null> {
    const e = this.store.get(key);
    if (!e) return null;
    if (e.expiresAt > 0 && Date.now() > e.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return e.value;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const e = this.store.get(key);
    let n: number;
    if (e && (e.expiresAt === 0 || Date.now() < e.expiresAt)) {
      n = Number(e.value) + 1;
    } else {
      n = 1;
    }
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0;
    this.store.set(key, { value: String(n), expiresAt });
    return n;
  }

  async decr(key: string): Promise<number> {
    const e = this.store.get(key);
    if (!e) return 0;
    if (e.expiresAt > 0 && Date.now() > e.expiresAt) {
      this.store.delete(key);
      return 0;
    }
    const n = Math.max(0, Number(e.value) - 1);
    this.store.set(key, { value: String(n), expiresAt: e.expiresAt });
    return n;
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const e = this.store.get(key);
    if (!e) return false;
    e.expiresAt = Date.now() + ttlSeconds * 1000;
    return true;
  }

  async slidingWindowIncr(key: string, ttlSeconds: number): Promise<number> {
    return this.incr(key, ttlSeconds);
  }

  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [k, e] of this.store) {
      if (e.expiresAt > 0 && now > e.expiresAt) {
        this.store.delete(k);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      log.debug(`[InMemoryTTLStore] Cleaned ${cleaned} expired keys`);
    }
  }

  /** 测试用：清空全部 */
  clear(): void {
    this.store.clear();
  }

  /** in-memory 模式始终"已连接" */
  isConnected(): boolean {
    return true;
  }
}

// ============================================================
// Redis 实现
// ============================================================

class RedisTTLStore implements TTLStore {
  readonly mode = 'redis' as const;
  // 真实实现：动态 require('ioredis') 避免 dev 阶段强依赖
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  private connected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(redisUrl: string, autoReconnect = true) {
    // 使用动态导入避免强制依赖
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Redis = require('ioredis');
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: (times: number) => {
          if (times > 3) {
            log.warn(`[RedisTTLStore] Retry ${times} failed, giving up`);
            return null;
          }
          return Math.min(times * 200, 1000);
        },
      });
      this.client
        .connect()
        .then(() => {
          this.connected = true;
          log.info('[RedisTTLStore] Connected');
        })
        .catch((err: Error) => {
          this.connected = false;
          log.warn(`[RedisTTLStore] Initial connect failed: ${err.message}`);
          if (autoReconnect) {
            this.scheduleReconnect();
          }
        });
      this.client.on('error', (err: Error) => {
        log.warn(`[RedisTTLStore] Error: ${err.message}`);
        this.connected = false;
        if (autoReconnect) {
          this.scheduleReconnect();
        }
      });
      this.client.on('ready', () => {
        this.connected = true;
        log.info('[RedisTTLStore] Ready');
      });
    } catch (e) {
      log.warn(`[RedisTTLStore] ioredis not available: ${(e as Error).message}`);
      throw e;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.connected) {
        this.client
          .connect()
          .then(() => {
            this.connected = true;
          })
          .catch(() => {
            this.scheduleReconnect();
          });
      }
    }, 5_000);
    if (typeof this.reconnectTimer.unref === 'function') {
      this.reconnectTimer.unref();
    }
  }

  private async ensureReady(): Promise<boolean> {
    if (this.connected) return true;
    return false;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!(await this.ensureReady())) throw new Error('Redis not ready');
    if (ttlSeconds > 0) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!(await this.ensureReady())) throw new Error('Redis not ready');
    return this.client.get(key);
  }

  async del(key: string): Promise<number> {
    if (!(await this.ensureReady())) throw new Error('Redis not ready');
    return this.client.del(key);
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    if (!(await this.ensureReady())) throw new Error('Redis not ready');
    const n = await this.client.incr(key);
    if (n === 1 && ttlSeconds && ttlSeconds > 0) {
      await this.client.expire(key, ttlSeconds);
    }
    return n;
  }

  async decr(key: string): Promise<number> {
    if (!(await this.ensureReady())) throw new Error('Redis not ready');
    const n = await this.client.decr(key);
    if (n < 0) {
      // 防溢出：重新设置为 0
      await this.client.set(key, '0');
      return 0;
    }
    return n;
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!(await this.ensureReady())) throw new Error('Redis not ready');
    const r = await this.client.expire(key, ttlSeconds);
    return r === 1;
  }

  async slidingWindowIncr(key: string, ttlSeconds: number): Promise<number> {
    return this.incr(key, ttlSeconds);
  }

  /** Redis 模式连接状态（仅在 connected 时返回 true） */
  isConnected(): boolean {
    return this.connected;
  }
}

// ============================================================
// 工厂 + 降级（globalThis 跨 HMR / 跨请求）
// ============================================================

// 使用 globalThis 避免 Next.js dev HMR 重新评估模块时丢失单例
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GLOBAL_KEY = '__fjn_ttl_store_singleton__';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalRef = globalThis as any;

if (!globalRef[GLOBAL_KEY]) {
  globalRef[GLOBAL_KEY] = null;
}

function getGlobalStore(): TTLStore | null {
  return globalRef[GLOBAL_KEY] as TTLStore | null;
}

function setGlobalStore(store: TTLStore | null): void {
  globalRef[GLOBAL_KEY] = store;
}

export function createTTLStore(options: RedisTTLStoreOptions = {}): TTLStore {
  if (options.forceMemory || !options.redisUrl) {
    return new InMemoryTTLStore(options.memoryCleanupIntervalMs);
  }
  try {
    return new RedisTTLStore(options.redisUrl, options.autoReconnect);
  } catch (e) {
    log.warn(`[createTTLStore] Redis init failed, fallback to memory: ${(e as Error).message}`);
    return new InMemoryTTLStore(options.memoryCleanupIntervalMs);
  }
}

/** 获取全局单例（用于 MFA 共享 + Stream Rate Limit）
 *  - 默认从环境变量读取 REDIS_URL
 *  - 如果环境变量未设置或 REDIS_FORCE_MEMORY=1，强制使用 in-memory
 *  - 如果 Redis 不可用（连接失败），自动降级到 in-memory（重置 globalThis 单例）
 *  - 每次调用都重新检查 Redis 连接状态，若已断开则降级
 */
export function getTTLStore(): TTLStore {
  const forceMemory =
    process.env.REDIS_FORCE_MEMORY === '1' ||
    process.env.REDIS_FORCE_MEMORY === 'true';
  const redisUrl = forceMemory ? undefined : process.env.REDIS_URL;

  const existing = getGlobalStore();
  // in-memory 模式直接返回（无需检测）
  if (existing && existing.mode === 'memory') return existing;

  // Redis 模式：每次检查连接状态，已断开则降级
  if (existing && existing.mode === 'redis') {
    if (existing.isConnected && existing.isConnected()) return existing;
    // 断开 → 降级到 in-memory
    log.warn('[getTTLStore] Redis disconnected, falling back to in-memory');
    const memStore = new InMemoryTTLStore();
    setGlobalStore(memStore);
    return memStore;
  }

  // 首次创建
  const store = createTTLStore({ redisUrl });

  if (store.mode === 'redis' && !(store as RedisTTLStore).isConnected()) {
    log.warn('[getTTLStore] Redis not available at startup, falling back to in-memory');
    const memStore = new InMemoryTTLStore();
    setGlobalStore(memStore);
    return memStore;
  }

  setGlobalStore(store);
  return store;
}

/** 显式注入（用于测试） */
export function setTTLStore(store: TTLStore): void {
  setGlobalStore(store);
}

/** 重置全局（用于测试） */
export function resetTTLStore(): void {
  const store = getGlobalStore();
  if (store && (store as InMemoryTTLStore).clear) {
    (store as InMemoryTTLStore).clear();
  }
  setGlobalStore(null);
}

// ============================================================
// 顶层便捷函数（P3-3 Stream Rate Limit 等）
// ============================================================

/**
 * 顶层 GET 便捷函数（自动 JSON 反序列化）
 *  - 返回 null 表示 key 不存在或已过期
 *  - T 可以是 string / number / object
 */
export async function ttlGet<T = string>(key: string): Promise<T | null> {
  const store = getTTLStore();
  const raw = await store.get(key);
  if (raw === null || raw === undefined) return null;
  // 数字直接 parse
  if (raw === '' ) return null;
  try {
    // 优先 JSON 反序列化
    return JSON.parse(raw) as T;
  } catch {
    // 不是 JSON 时按原样返回
    return raw as unknown as T;
  }
}

/**
 * 顶层 INCR 便捷函数（带 TTL 的滑动窗口计数）
 *  - 返回递增后的值（首调为 1）
 *  - ttlSeconds > 0 时首次写入会设置过期
 */
export async function ttlIncrement(key: string, ttlSeconds: number = 0): Promise<number> {
  const store = getTTLStore();
  return store.incr(key, ttlSeconds);
}

/**
 * 顶层 DECR 便捷函数（原子自减，用于连接释放等场景）
 *  - 返回递减后的值（最小 0）
 */
export async function ttlDecrement(key: string): Promise<number> {
  const store = getTTLStore();
  if (!store.decr) {
    // 兜底：手动 get → max(0, n-1) → set
    const current = await store.get(key);
    const n = current ? Math.max(0, Number(current) - 1) : 0;
    await store.set(key, String(n), 0);
    return n;
  }
  return store.decr(key);
}

/**
 * 顶层 SET 便捷函数（自动 JSON 序列化）
 *  - ttlSeconds = 0 表示无过期
 */
export async function ttlStore(
  key: string,
  value: unknown,
  ttlSeconds: number = 0,
): Promise<void> {
  const store = getTTLStore();
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  await store.set(key, serialized, ttlSeconds);
}

export { InMemoryTTLStore, RedisTTLStore };
