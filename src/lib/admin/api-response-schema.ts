/**
 * api-response-schema（2026-07-18 真实化底座）
 *
 * 目标：统一 admin API 响应 schema
 *   - 统一格式 { success, data, error, timestamp }
 *   - 提供 Zod schema 校验
 *   - 提供 success / error 构造 helper
 *   - 提供 ApiError 类
 *
 * 用途：
 *   - admin-fetch.ts 解析 response
 *   - route.ts 构造 response
 *   - AdminErrorState 显示错误
 *
 * 硬约束（Q04-3.11.b 范围）：
 *   - 复用 zod ^3.22.4
 *   - 不修改既有 /api 路由
 *   - 不强制既有路由接入
 *   - 允许现有 route.ts 渐进接入
 */

import { z } from 'zod';

// =============================================================================
// Error 基础 schema
// =============================================================================

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  field: z.string().optional(),
});

export type ApiErrorPayload = z.infer<typeof apiErrorSchema>;

// =============================================================================
// 统一响应 schema
// =============================================================================

export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: apiErrorSchema.optional(),
  timestamp: z.string().optional(),
});

export type ApiResponse<T = unknown> = {
  success: true;
  data: T;
  error?: undefined;
  timestamp?: string;
} | {
  success: false;
  data?: undefined;
  error: ApiErrorPayload;
  timestamp?: string;
};

// =============================================================================
// ApiError 类
// =============================================================================

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;
  public readonly field?: string;

  constructor(
    code: string,
    message: string,
    status: number = 500,
    errorPayload?: Partial<ApiErrorPayload>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = errorPayload?.details;
    this.field = errorPayload?.field;
  }

  toJSON(): ApiErrorPayload {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      field: this.field,
    };
  }
}

// =============================================================================
// success / error 构造 helper
// =============================================================================

/**
 * 构造 success 响应对象（用于 route.ts return）
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 构造 error 响应对象（用于 route.ts return）
 */
export function errorResponse(
  code: string,
  message: string,
  details?: unknown,
  field?: string,
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      field,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 抛出 ApiError（route.ts try/catch 统一捕获）
 */
export function throwApi(
  code: string,
  message: string,
  status: number = 500,
  details?: unknown,
  field?: string,
): never {
  throw new ApiError(code, message, status, { code, message, details, field });
}

// =============================================================================
// NextResponse 集成 helper
// =============================================================================

/**
 * 把 ApiResponse 包成 NextResponse JSON
 * 注：本文件不导入 next/server，避免在 client 文件中触发 server-only 链路
 *       使用方自行包装：
 *       import { NextResponse } from 'next/server';
 *       return NextResponse.json(successResponse(data));
 */
