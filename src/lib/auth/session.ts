/**
 * 会话管理
 *
 * - LRU 内存会话存储（默认最多 10000 个会话）
 * - 滑动过期：30 分钟无活动即过期
 * - 支持会话查询/销毁
 * - 单用户多设备：同一用户可拥有多个会话
 *
 * 适用场景：单实例部署或开发期；生产推荐 Redis 集群共享会话。
 *
 * @module lib/auth/session
 */

import { randomString } from './crypto';
import { SessionError } from './errors';

// ============================================================================
// 类型
// ============================================================================

export interface SessionInfo {
  /** 会话 token（外部持有） */
  token: string;
  /** 用户 ID */
  userId: string;
  /** 创建时间 ISO */
  createdAt: string;
  /** 最后活跃时间 ISO */
  lastActiveAt: string;
  /** 过期时间 ISO */
  expiresAt: string;
  /** 设备标识 */
  device?: string;
  /** IP 地址 */
  ip?: string;
  /** 扩展字段 */
  meta?: Record<string, unknown>;
}

export interface CreateSessionOptions {
  /** 设备指纹/UA */
  device?: string;
  /** IP 地址 */
  ip?: string;
  /** 自定义 TTL（毫秒），默认 30 分钟 */
  ttlMs?: number;
  /** 附加元数据 */
  meta?: Record<string, unknown>;
}

// ============================================================================
// 配置
// ============================================================================

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 分钟
const MAX_SESSIONS = 10_000;

// ============================================================================
// LRU 存储
// ============================================================================

/**
 * 会话存储
 * 使用 Map 维持插入顺序，删除最旧以实现 LRU
 *
 * 复杂度：get/set O(1)，eviction O(1) 均摊
 */
class SessionStore {
  private readonly map: Map<string, SessionInfo> = new Map();
  private readonly maxSize: number;

  constructor(maxSize: number = MAX_SESSIONS) {
    this.maxSize = maxSize;
  }

  get(token: string): SessionInfo | undefined {
    return this.map.get(token);
  }

  set(token: string, info: SessionInfo): void {
    if (this.map.has(token)) {
      this.map.delete(token);
    } else if (this.map.size >= this.maxSize) {
      // LRU：删除最旧
      const oldest = this.map.keys().next().value;
      if (oldest) this.map.delete(oldest);
    }
    this.map.set(token, info);
  }

  delete(token: string): boolean {
    return this.map.delete(token);
  }

  /** 列出某用户的所有会话 */
  listByUser(userId: string): SessionInfo[] {
    const list: SessionInfo[] = [];
    for (const info of this.map.values()) {
      if (info.userId === userId) list.push(info);
    }
    return list;
  }

  /** 删除某用户的所有会话（强制登出） */
  deleteByUser(userId: string): number {
    let n = 0;
    for (const [token, info] of this.map.entries()) {
      if (info.userId === userId) {
        this.map.delete(token);
        n++;
      }
    }
    return n;
  }

  size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }
}

// 单例 store
const store = new SessionStore(MAX_SESSIONS);

// ============================================================================
// CRUD
// ============================================================================

/**
 * 创建会话
 * @returns session token
 */
export const createSession = (
  userId: string,
  options: CreateSessionOptions = {}
): SessionInfo => {
  if (!userId) {
    throw new SessionError('SESSION_NO_USER', 'userId is required');
  }
  const now = Date.now();
  const ttl = options.ttlMs ?? DEFAULT_TTL_MS;
  const token = randomString(32);

  const info: SessionInfo = {
    token,
    userId,
    createdAt: new Date(now).toISOString(),
    lastActiveAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttl).toISOString(),
    device: options.device,
    ip: options.ip,
    meta: options.meta,
  };
  store.set(token, info);
  return info;
};

/**
 * 获取会话；自动处理滑动过期
 *
 * @throws {SessionError} 不存在或已过期
 */
export const getSession = (token: string, options: { extend?: boolean } = {}): SessionInfo => {
  if (!token) {
    throw new SessionError('SESSION_NO_TOKEN', 'Token is required');
  }
  const info = store.get(token);
  if (!info) {
    throw new SessionError('SESSION_NOT_FOUND', 'Session not found', { token });
  }
  const now = Date.now();
  const exp = Date.parse(info.expiresAt);
  if (Number.isNaN(exp)) {
    store.delete(token);
    throw new SessionError('SESSION_INVALID', 'Session has invalid expiresAt');
  }
  if (now >= exp) {
    store.delete(token);
    throw new SessionError('SESSION_EXPIRED', 'Session has expired');
  }

  // 滑动过期
  if (options.extend !== false) {
    const remaining = exp - now;
    const ttl = exp - Date.parse(info.createdAt);
    // 每次访问重置为完整 TTL
    const newExp = now + ttl;
    info.lastActiveAt = new Date(now).toISOString();
    info.expiresAt = new Date(newExp).toISOString();
    store.set(token, info);
  }
  return info;
};

/**
 * 销毁会话
 */
export const destroySession = (token: string): boolean => {
  return store.delete(token);
};

/**
 * 销毁某用户的所有会话
 */
export const destroyUserSessions = (userId: string): number => {
  return store.deleteByUser(userId);
};

/**
 * 列出某用户的所有会话
 */
export const listUserSessions = (userId: string): SessionInfo[] => {
  return store.listByUser(userId);
};

/**
 * 校验 token 是否有效（不抛出）
 */
export const isSessionValid = (token: string): boolean => {
  try {
    getSession(token, { extend: false });
    return true;
  } catch {
    return false;
  }
};

/**
 * 清理所有过期会话
 * @returns 清理数量
 */
export const purgeExpiredSessions = (): number => {
  const now = Date.now();
  let n = 0;
  for (const [token, info] of (store as unknown as { map: Map<string, SessionInfo> }).map.entries()) {
    if (now >= Date.parse(info.expiresAt)) {
      store.delete(token);
      n++;
    }
  }
  return n;
};

// ============================================================================
// 暴露 store（用于测试与高级用例）
// ============================================================================

export const _sessionStore = store;
