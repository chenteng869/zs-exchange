/**
 * admin-fetch（2026-07-18 真实化底座）
 *
 * 目标：替代 263 个 TEMPLATE page 散落的 fetch / getAuthHeaders
 *   - 统一 auth header 注入
 *   - 统一 timeout
 *   - 统一 response 解析（基于 api-response-schema）
 *   - client / server 双环境安全
 *
 * 设计原则：
 *   - 在 client 端：从 localStorage 读取 admin_token
 *   - 在 server 端：使用传入的 token（无 window/localStorage 访问）
 *   - 不强制任何业务调用
 *   - 失败抛 ApiError（带 code/message）
 *
 * 硬约束（Q04-3.11.b 范围）：
 *   - 复用 zod 验证 response
 *   - 不修改既有 fetch / middleware
 *   - 不修改既有 /api 路由
 */

import {
  apiResponseSchema,
  ApiError,
  type ApiResponse,
  type ApiErrorPayload,
} from './api-response-schema';

export interface AdminFetchOptions extends Omit<RequestInit, 'body'> {
  /** 请求体（自动 JSON.stringify） */
  body?: unknown;
  /** 超时（毫秒），默认 15000 */
  timeoutMs?: number;
  /** 自定义 baseUrl（默认 process.env.NEXT_PUBLIC_API_BASE_URL 或空字符串） */
  baseUrl?: string;
  /** 服务端专用：传入 admin token（避免访问 localStorage） */
  serverToken?: string;
  /** 跳过 zod 校验（仅在 schema 严格匹配失败时使用） */
  skipValidation?: boolean;
}

function getDefaultBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  return '';
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function readClientToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem('admin_token');
  } catch {
    return null;
  }
}

function buildHeaders(
  init: RequestInit | undefined,
  body: unknown,
  token: string | null,
): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (init?.headers) {
    const source = init.headers as Record<string, string> | Headers;
    if (source instanceof Headers) {
      source.forEach((v, k) => {
        headers[k] = v;
      });
    } else if (Array.isArray(source)) {
      source.forEach(([k, v]) => {
        headers[k] = v;
      });
    } else {
      Object.assign(headers, source);
    }
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  if (typeof AbortController === 'undefined') {
    return fetch(url, init);
  }
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/**
 * adminFetch - 真实化 fetch helper
 *
 * 使用示例：
 * ```ts
 * // Client side
 * const data = await adminFetch<User[]>('/api/v1/admin/users');
 *
 * // Server side
 * const data = await adminFetch<User[]>('/api/v1/admin/users', { serverToken: token });
 * ```
 */
export async function adminFetch<T = unknown>(
  url: string,
  options: AdminFetchOptions = {},
): Promise<T> {
  const {
    body,
    timeoutMs = 15000,
    baseUrl = getDefaultBaseUrl(),
    serverToken,
    skipValidation = false,
    ...init
  } = options;

  const token = isBrowser() ? readClientToken() : serverToken ?? null;
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  const headers = buildHeaders(init, body, token);
  const initBody = body === undefined ? undefined : JSON.stringify(body);

  let response: Response;
  try {
    response = await fetchWithTimeout(
      fullUrl,
      { ...init, headers, body: initBody },
      timeoutMs,
    );
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new ApiError('TIMEOUT', `请求超时（${timeoutMs}ms）: ${url}`, 408);
    }
    throw new ApiError('NETWORK_ERROR', e?.message || '网络错误', 0);
  }

  let raw: unknown = null;
  try {
    raw = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(
        `HTTP_${response.status}`,
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
      );
    }
    throw new ApiError('PARSE_ERROR', '响应解析失败（非 JSON）', response.status);
  }

  if (skipValidation) {
    if (!response.ok) {
      const payload = raw as { error?: { code?: string; message?: string } } | null;
      throw new ApiError(
        payload?.error?.code || `HTTP_${response.status}`,
        payload?.error?.message || `HTTP ${response.status}`,
        response.status,
      );
    }
    return raw as T;
  }

  const parsed = apiResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError(
      'SCHEMA_INVALID',
      `响应 schema 校验失败: ${parsed.error.message}`,
      response.status,
    );
  }

  // parsed.data 类型推导：success 字段为 true 时 data 存在，false 时 error 存在
  const apiResp = parsed.data as { success: boolean; data?: T; error?: { code?: string; message?: string; details?: unknown; field?: string }; timestamp?: string };
  if (!apiResp.success) {
    throw new ApiError(
      apiResp.error?.code || 'UNKNOWN',
      apiResp.error?.message || '业务错误',
      response.status,
      apiResp.error,
    );
  }

  return apiResp.data as T;
}

/**
 * adminGet / adminPost / adminPut / adminDelete - 便捷方法
 */
export const adminGet = <T = unknown>(url: string, options?: AdminFetchOptions) =>
  adminFetch<T>(url, { ...options, method: 'GET' });

export const adminPost = <T = unknown>(url: string, body?: unknown, options?: AdminFetchOptions) =>
  adminFetch<T>(url, { ...options, method: 'POST', body });

export const adminPut = <T = unknown>(url: string, body?: unknown, options?: AdminFetchOptions) =>
  adminFetch<T>(url, { ...options, method: 'PUT', body });

export const adminDelete = <T = unknown>(url: string, options?: AdminFetchOptions) =>
  adminFetch<T>(url, { ...options, method: 'DELETE' });

export { ApiError };
export type { ApiResponse };
