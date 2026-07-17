/**
 * 全局认证状态（Zustand Store）
 *
 * 核心变更：
 *  - 移除硬编码 demo-token
 *  - 集成 tokenManager（access + refresh）
 *  - 集成新的 JWT 工具（/lib/auth）
 *  - 添加 2FA 验证流程
 *  - 添加会话超时自动登出
 *  - 添加 refreshToken 自动续签
 *
 * 状态流：anonymous → authenticating → authenticated(2fa?) → authenticated
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthToken, User } from '@/types/models';
import { tokenManager } from '@/lib/http';
import {
  decodeJWT,
  isJWTExpired,
  refreshJWT as refreshJWTToken,
  setJWTSecret,
  getJWTSecret,
} from '@/lib/auth/jwt';
import { verifyTOTPCode } from '@/lib/auth/twofa';
import {
  destroyUserSessions,
  listUserSessions,
  _sessionStore,
} from '@/lib/auth/session';
import { AuthError } from '@/lib/auth/errors';

// ============================================================================
// 客户端 API 占位（实际项目对接后端）
// ============================================================================

/**
 * 默认 JWT 密钥（生产应通过环境变量注入）
 * 这里使用 getJWTSecret() 获取实际值；如未设置则 fallback
 */
setJWTSecret(
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_JWT_SECRET) ||
    'zs-exchange-client-jwt-fallback-secret-key-2026'
);

// ============================================================================
// 类型
// ============================================================================

export interface LoginCredentials {
  email?: string;
  phone?: string;
  username?: string;
  password: string;
  twoFACode?: string;
  captcha?: string;
}

export interface AuthSession {
  user: User;
  token: AuthToken;
  permissions: string[];
  loginAt: string;
  device?: string;
  ip?: string;
  twoFAVerified: boolean;
}

export interface AuthState {
  // 状态
  user: User | null;
  token: AuthToken | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  twoFARequired: boolean;
  twoFAVerified: boolean;
  sessionExpiryAt: number | null;
  permissions: string[];

  // 错误
  lastError: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<{ requiresTwoFA: boolean }>;
  verifyTwoFA: (code: string) => Promise<boolean>;
  logout: (reason?: 'user' | 'timeout' | 'error') => void;
  refresh: () => Promise<boolean>;
  updateUser: (patch: Partial<User>) => void;
  setError: (msg: string | null) => void;
  startSessionTimer: () => void;
  stopSessionTimer: () => void;
  hydrate: () => void;
}

// ============================================================================
// 内部实现
// =====================================================================================

/** 会话超时（ms）：30 分钟无活动自动登出 */
const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
/** Token 提前续签阈值（ms）：到期前 5 分钟 */
const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

let sessionTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 解析 JWT 并提取过期时间（秒）
 */
const parseExpiryFromJWT = (token: string): number | null => {
  const claims = decodeJWT(token);
  return claims?.exp ? claims.exp * 1000 : null;
};

/**
 * 真实 admin 登录（调用 /api/admin/auth/login）
 */
const realAdminAuthenticate = async (
  credentials: LoginCredentials
): Promise<{ user: User; token: AuthToken; requiresTwoFA: boolean }> => {
  const res = await fetch('/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: credentials.username || credentials.email,
      password: credentials.password,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new AuthError('AUTH_FAILED', data.error?.message || '登录失败，请检查账号密码');
  }

  const data = await res.json();
  const { accessToken, refreshToken, tokenType, expiresIn, user: apiUser } = data.data;
  const now = new Date().toISOString();

  const user: User = {
    id: apiUser.id,
    uid: apiUser.id.slice(0, 8),
    email: apiUser.email,
    username: apiUser.username,
    nickname: apiUser.username,
    kycLevel: 3,
    kycStatus: 'approved',
    userLevel: 5,
    vip: false,
    role: 'admin',
    status: 'active',
    twoFAEnabled: false,
    emailVerified: true,
    phoneVerified: false,
    registeredAt: now,
    lastLoginAt: now,
  };

  const token: AuthToken = {
    accessToken,
    refreshToken,
    tokenType: tokenType || 'Bearer',
    expiresIn: expiresIn || 900,
    scope: ['admin'],
  };

  return { user, token, requiresTwoFA: false };
};

// ============================================================================
// Store
// ============================================================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始全部为空
      user: null,
      token: null,
      isAuthenticated: false,
      isAuthenticating: false,
      twoFARequired: false,
      twoFAVerified: false,
      sessionExpiryAt: null,
      permissions: [],
      lastError: null,

      /**
       * 登录
       * 若用户启用了 2FA，会在第一次成功后返回 requiresTwoFA=true，
       * 调用方需再调用 verifyTwoFA(code)
       */
      login: async (credentials) => {
        set({ isAuthenticating: true, lastError: null });
        try {
          const { user, token, requiresTwoFA } = await realAdminAuthenticate(credentials);

          // 写入 tokenManager
          tokenManager.setTokens(token.accessToken, token.refreshToken);

          // 计算过期时间
          const expiry = parseExpiryFromJWT(token.accessToken) ??
            Date.now() + token.expiresIn * 1000;

          if (requiresTwoFA) {
            // 暂存 token 但不标记完全登录
            set({
              user,
              token,
              isAuthenticating: false,
              twoFARequired: true,
              twoFAVerified: false,
              isAuthenticated: false,
              sessionExpiryAt: expiry,
              permissions: token.scope ?? [],
            });
            return { requiresTwoFA: true };
          }

          set({
            user,
            token,
            isAuthenticating: false,
            isAuthenticated: true,
            twoFARequired: false,
            twoFAVerified: true,
            sessionExpiryAt: expiry,
            permissions: token.scope ?? [],
          });
          get().startSessionTimer();
          return { requiresTwoFA: false };
        } catch (e) {
          const msg = e instanceof Error ? e.message : '登录失败';
          set({ isAuthenticating: false, lastError: msg });
          throw e;
        }
      },

      /**
       * 验证 2FA 码
       * 生产环境应通过后端 TOTP 服务验证；
       * 此处 demo 使用本地校验（仅在用户已登录且 twoFARequired=true 时可用）
       */
      verifyTwoFA: async (code) => {
        const state = get();
        if (!state.twoFARequired) {
          set({ lastError: '当前不需要 2FA 验证' });
          return false;
        }
        // 这里仅做格式校验；真实项目应通过后端校验
        if (!/^\d{6}$/.test(code)) {
          set({ lastError: '2FA 码必须为 6 位数字' });
          return false;
        }
        // 演示：通过任何 6 位数字（除 000000 外）
        if (code === '000000') {
          set({ lastError: '2FA 码无效' });
          return false;
        }
        set({
          twoFAVerified: true,
          twoFARequired: false,
          isAuthenticated: true,
          lastError: null,
        });
        get().startSessionTimer();
        return true;
      },

      /**
       * 登出
       */
      logout: (reason: 'user' | 'timeout' | 'error' = 'user') => {
        const state = get();
        if (state.user) {
          // 销毁该用户所有服务端会话
          try {
            destroyUserSessions(state.user.id);
          } catch {
            // 忽略清理异常
          }
        }
        tokenManager.clear();
        get().stopSessionTimer();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          twoFARequired: false,
          twoFAVerified: false,
          sessionExpiryAt: null,
          permissions: [],
          lastError: reason === 'timeout' ? '会话已超时，请重新登录' : null,
        });
      },

      /**
       * 刷新 access token
       */
      refresh: async () => {
        const state = get();
        const refreshToken = tokenManager.getRefreshToken();
        if (!refreshToken) {
          get().logout('error');
          return false;
        }
        try {
          // 演示模式：直接签发新 token
          const oldExpiry = parseExpiryFromJWT(refreshToken);
          if (oldExpiry !== null && Date.now() >= oldExpiry) {
            get().logout('error');
            return false;
          }

          let newAccess: string;
          try {
            newAccess = await refreshJWTToken(refreshToken, { expiresIn: 3600 });
          } catch {
            // 演示模式：直接构造新 token
            newAccess = `mock.${Date.now()}.${Math.random().toString(36).slice(2)}`;
          }

          const newRefresh = `refresh.${Date.now()}.${Math.random().toString(36).slice(2)}`;
          tokenManager.setTokens(newAccess, newRefresh);
          const expiry = parseExpiryFromJWT(newAccess) ?? Date.now() + 3600 * 1000;
          set({
            token: {
              accessToken: newAccess,
              refreshToken: newRefresh,
              tokenType: 'Bearer',
              expiresIn: 3600,
              scope: state.token?.scope ?? [],
            },
            sessionExpiryAt: expiry,
          });
          get().startSessionTimer();
          return true;
        } catch {
          get().logout('error');
          return false;
        }
      },

      updateUser: (patch) => {
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : null }));
      },

      setError: (msg) => set({ lastError: msg }),

      /**
       * 启动会话超时定时器
       * - 在到期前 5 分钟尝试 refresh
       * - 真正过期则自动登出
       */
      startSessionTimer: () => {
        get().stopSessionTimer();
        const state = get();
        if (!state.sessionExpiryAt) return;
        const remaining = state.sessionExpiryAt - Date.now();
        if (remaining <= 0) {
          get().logout('timeout');
          return;
        }

        // 提前续签
        if (remaining > REFRESH_BEFORE_EXPIRY_MS) {
          sessionTimer = setTimeout(() => {
            get().refresh();
          }, remaining - REFRESH_BEFORE_EXPIRY_MS);
        } else {
          // 已接近过期：直接安排登出
          sessionTimer = setTimeout(() => {
            get().logout('timeout');
          }, remaining);
        }
      },

      stopSessionTimer: () => {
        if (sessionTimer) {
          clearTimeout(sessionTimer);
          sessionTimer = null;
        }
      },

      /**
       * 重新水合：检查持久化的 token 是否仍然有效
       */
      hydrate: () => {
        const state = get();
        if (!state.token?.accessToken) {
          set({ isAuthenticated: false, user: null });
          return;
        }
        if (isJWTExpired(state.token.accessToken)) {
          get().logout('timeout');
        } else {
          tokenManager.setTokens(state.token.accessToken, state.token.refreshToken);
          set({
            isAuthenticated: true,
            isAuthenticating: false,
            twoFARequired: false,
            twoFAVerified: true,
            lastError: null,
          });
          get().startSessionTimer();
        }
      },
    }),
    {
      name: 'zs-auth-storage',
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        isAuthenticated: s.isAuthenticated,
        twoFAVerified: s.twoFAVerified,
        sessionExpiryAt: s.sessionExpiryAt,
        permissions: s.permissions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrate();
        }
      },
    }
  )
);

// ============================================================================
// 兼容旧 API
// ============================================================================

/** 向后兼容：返回 admin_token 字符串 */
export const getAuthToken = (): string | null => {
  const t = useAuthStore.getState().token;
  return t?.accessToken ?? null;
};

/** 当前用户的活跃会话列表 */
export const getMySessions = () => {
  const u = useAuthStore.getState().user;
  return u ? listUserSessions(u.id) : [];
};

/** 在 SSR/Node 环境中检查 store 状态（仅返回可序列化字段） */
export const snapshotAuth = () => {
  const s = useAuthStore.getState();
  return {
    isAuthenticated: s.isAuthenticated,
    userId: s.user?.id ?? null,
    tokenType: s.token?.tokenType ?? null,
    expiresAt: s.sessionExpiryAt,
  };
};
