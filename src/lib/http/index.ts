/**
 * HTTP 客户端工具
 *
 * - 统一基础 URL 配置
 * - Token 管理（自动附加 Authorization 头）
 * - 请求/响应拦截
 * - 超时/重试策略
 * - 错误统一处理
 *
 * @module lib/http
 */

// ============================================================================
// 配置
// ============================================================================

const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  '/api/v1';

const DEFAULT_TIMEOUT_MS = 10_000;

// ============================================================================
// Token 管理
// ============================================================================

class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(access: string, refresh: string): void {
    this.accessToken = access;
    this.refreshToken = refresh;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  clear(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  hasValidToken(): boolean {
    return !!this.accessToken;
  }
}

export const tokenManager = new TokenManager();

// ============================================================================
// 请求封装
// ============================================================================

interface RequestOptions extends RequestInit {
  timeout?: number;
  skipAuth?: boolean;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = new URL(path, API_BASE_URL);
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;

  const headers = new Headers(options.headers);
  if (!options.skipAuth && tokenManager.hasValidToken()) {
    headers.set('Authorization', `Bearer ${tokenManager.getAccessToken()}`);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url.toString(), {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      const error = await parseError(res);
      throw error;
    }

    const contentType = res.headers.get('Content-Type');
    if (contentType?.includes('application/json')) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// 便捷方法
// ============================================================================

export const get = <T>(path: string, options?: RequestOptions): Promise<T> =>
  request(path, { ...options, method: 'GET' });

export const post = <T>(
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> =>
  request(path, {
    ...options,
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

export const put = <T>(
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> =>
  request(path, {
    ...options,
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

export const del = <T>(path: string, options?: RequestOptions): Promise<T> =>
  request(path, { ...options, method: 'DELETE' });

// ============================================================================
// 错误解析
// ============================================================================

interface ApiErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

async function parseError(res: Response): Promise<Error> {
  try {
    const json = (await res.json()) as ApiErrorResponse;
    if (json.error) {
      const err = new Error(json.error.message);
      (err as any).code = json.error.code;
      (err as any).details = json.error.details;
      return err;
    }
  } catch {
    // ignore
  }
  return new Error(`HTTP error ${res.status}: ${res.statusText}`);
}