/**
 * 统一 API 客户端 — 官网 + H5 共用
 * 调用自己的后端 /api/v1/*，不直接请求 Binance
 */

const BASE = '';   // 同域，留空即可

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err?.message || err?.error || `HTTP ${res.status}`);
  }
  const json = await res.json();
  // 统一响应格式: { success, data, ... }
  return (json?.data ?? json) as T;
}

export const apiGet = <T = any>(path: string) => apiFetch<T>(path);

export const apiPost = <T = any>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
