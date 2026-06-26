/**
 * 后端 API 统一接入层
 *
 * 设计目标:
 *  1. 屏蔽 Mock/Real 切换 — 业务层无感
 *  2. 统一错误处理 / 重试 / 限流
 *  3. 类型安全 — 全链路 TS
 *  4. 多源聚合 — 行情可同时拉 Binance / CoinGecko / OKX / Bybit
 *
 * 后端服务器:
 *  - 真实 API 地址:  process.env.NEXT_PUBLIC_API_BASE_URL
 *  - 默认 (无配置) 走 mock 服务
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from '@/lib/logger';

// ============================================================================
// 配置
// ============================================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export const USE_MOCK = !process.env.NEXT_PUBLIC_API_BASE_URL;
export { API_BASE_URL };

// ============================================================================
// Axios 实例
// ============================================================================

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Token 管理
export const tokenManager = {
  get: () => (typeof window === 'undefined' ? null : localStorage.getItem('admin_token')),
  set: (t: string) => { if (typeof window !== 'undefined') localStorage.setItem('admin_token', t); },
  clear: () => { if (typeof window !== 'undefined') localStorage.removeItem('admin_token'); },
};

// 拦截器
client.interceptors.request.use((c) => {
  const t = tokenManager.get();
  if (t) c.headers.Authorization = `Bearer ${t}`;
  c.headers['X-Client-Type'] = 'web';
  c.headers['X-Client-Version'] = '7.0.0';
  return c;
});

client.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      tokenManager.clear();
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    logger.error('[API]', err.config?.url, err.response?.status, err.message);
    return Promise.reject(err);
  }
);

// ============================================================================
// 统一 API 错误
// ============================================================================

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(msg: string, code: string, status: number) {
    super(msg);
    this.code = code;
    this.status = status;
  }
}

export const normalizeError = (e: unknown): ApiError => {
  if (e instanceof ApiError) return e;
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as any;
    return new ApiError(data?.message || e.message, data?.code || 'NETWORK', e.response?.status || 0);
  }
  if (e instanceof Error) return new ApiError(e.message, 'UNKNOWN', 0);
  return new ApiError(String(e), 'UNKNOWN', 0);
};

// ============================================================================
// 统一调用方法
// ============================================================================

export const http = {
  get: <T>(url: string, cfg?: AxiosRequestConfig) => client.get<T>(url, cfg).then((r) => r.data),
  post: <T>(url: string, body?: unknown, cfg?: AxiosRequestConfig) =>
    client.post<T>(url, body, cfg).then((r) => r.data),
  put: <T>(url: string, body?: unknown, cfg?: AxiosRequestConfig) =>
    client.put<T>(url, body, cfg).then((r) => r.data),
  patch: <T>(url: string, body?: unknown, cfg?: AxiosRequestConfig) =>
    client.patch<T>(url, body, cfg).then((r) => r.data),
  del: <T>(url: string, cfg?: AxiosRequestConfig) => client.delete<T>(url, cfg).then((r) => r.data),
  raw: client,
};

export default http;
