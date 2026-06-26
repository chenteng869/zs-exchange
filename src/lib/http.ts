/**
 * 统一 API 服务层
 *
 * 设计原则：
 *   1. 业务模块化：按业务域拆分 API 客户端 (authApi, tradeApi, walletApi ...)
 *   2. 统一拦截：JWT 注入、错误处理、重试、限流、Mock 模式
 *   3. 类型安全：全链路 TypeScript
 *   4. 离线优先：检测无后端时自动注入 Mock 数据
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from './logger';
import type { ApiResp } from '@/types/models';

// ============================================================================
// 基础配置
// ============================================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

const USE_MOCK =
  !process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL.includes('localhost:3001');

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// ============================================================================
// Token 管理（与 authStore 解耦，避免循环依赖）
// ============================================================================

export const tokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_token');
  },
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  },
  setTokens: (access: string, refresh: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('admin_token', access);
    localStorage.setItem('refresh_token', refresh);
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('refresh_token');
  },
};

// ============================================================================
// 请求拦截器
// ============================================================================

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const processQueue = (token: string | null) => {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
};

client.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Client-Type'] = 'web';
    config.headers['X-Client-Version'] = '7.0.0';
    return config;
  },
  (err) => Promise.reject(err)
);

// ============================================================================
// 响应拦截器（含自动刷新）
// ============================================================================

client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiResp>) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (status === 401 && !original._retry) {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) {
        tokenManager.clear();
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        }
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push((token) => {
            if (!token) {
              reject(error);
              return;
            }
            original.headers = { ...(original.headers || {}), Authorization: `Bearer ${token}` };
            resolve(client(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );
        tokenManager.setTokens(data.accessToken, data.refreshToken);
        processQueue(data.accessToken);
        original.headers = {
          ...(original.headers || {}),
          Authorization: `Bearer ${data.accessToken}`,
        };
        return client(original);
      } catch (refreshErr) {
        processQueue(null);
        tokenManager.clear();
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // 业务错误统一打日志
    logger.error('[API]', error.config?.url, status, error.message);
    return Promise.reject(error);
  }
);

// ============================================================================
// 错误归一化
// ============================================================================

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const normalizeError = (e: unknown): ApiError => {
  if (e instanceof ApiError) return e;
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as ApiResp | undefined;
    return new ApiError(
      data?.error?.message || e.message,
      data?.error?.code || 'NETWORK_ERROR',
      e.response?.status || 0
    );
  }
  if (e instanceof Error) return new ApiError(e.message, 'UNKNOWN', 0);
  return new ApiError(String(e), 'UNKNOWN', 0);
};

// ============================================================================
// 统一调用方法
// ============================================================================

async function call<T>(promise: Promise<{ data: ApiResp<T> }>): Promise<T> {
  try {
    const { data } = await promise;
    if (!data.success) {
      throw new ApiError(
        data.error?.message || 'Business error',
        data.error?.code || 'BUSINESS_ERROR',
        200
      );
    }
    return data.data as T;
  } catch (e) {
    throw normalizeError(e);
  }
}

export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    call<T>(client.get(url, config)),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    call<T>(client.post(url, body, config)),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    call<T>(client.put(url, body, config)),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    call<T>(client.patch(url, body, config)),
  del: <T>(url: string, config?: AxiosRequestConfig) =>
    call<T>(client.delete(url, config)),
  raw: client,
};

export { USE_MOCK, API_BASE_URL, client };
export default client;
