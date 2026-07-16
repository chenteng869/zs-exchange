/**
 * 统一 API 错误处理工具（P0-2 安全修复）
 *
 * 设计目标:
 *  1. 防止 Prisma/数据库错误信息泄漏 schema、连接串、代码路径
 *  2. 区分已知业务错误（FjnError / SafeError）与未知错误
 *  3. 内部日志保留完整堆栈，前端仅看到用户友好消息
 *  4. 统一 4xx/5xx 状态码与响应格式
 *
 * 替代以下不安全模式:
 *   catch (e: any) {
 *     return serverError(e.message);  // 🔴 泄漏
 *   }
 *
 * 替换为:
 *   catch (e) {
 *     return handleApiError(e, 'api:fjn/risk case-list');
 *   }
 *
 * 审计依据: J-1.9 业务逻辑与数据安全审计 - 2.1 错误信息泄漏 (CRITICAL)
 */

import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import {
  error as apiError,
  badRequest,
  conflict,
  notFound,
  internalError,
  unauthorized,
  forbidden,
  tooManyRequests,
} from './response';
import { logger } from '@/lib/logger';
import { FjnError } from '@/lib/fjn/errors';

// ============================================================
// SafeError - 受控错误（明确知道要返回给前端什么消息）
// ============================================================

/**
 * 受控业务异常
 * @param userMessage  返回给前端的安全消息（不含内部细节）
 * @param internalMessage 内部日志消息（可包含技术细节）
 * @param code 错误码（默认 INTERNAL_ERROR）
 * @param status HTTP 状态码（默认 500）
 */
export class SafeError extends Error {
  constructor(
    public userMessage: string,
    public internalMessage: string,
    public code: string = 'INTERNAL_ERROR',
    public status: number = 500,
  ) {
    super(internalMessage);
    this.name = 'SafeError';
  }
}

// ============================================================
// 错误分类器
// ============================================================

/**
 * 安全错误分类
 * - 返回给前端：用户友好消息 + 适当 HTTP 状态码
 * - 内部日志：完整原始错误
 */
function classifyError(e: unknown, context: string): {
  response: NextResponse;
  userMessage: string;
  code: string;
  status: number;
} {
  // 1) 受控 SafeError - 明确知道要返回什么
  if (e instanceof SafeError) {
    logger.error(`[${context}] SafeError: ${e.internalMessage}`, e);
    return {
      response: apiError(e.code, e.userMessage, e.status),
      userMessage: e.userMessage,
      code: e.code,
      status: e.status,
    };
  }

  // 2) FjnError 业务异常 - 包含业务错误码，前端需要
  if (e instanceof FjnError) {
    logger.error(`[${context}] FjnError: ${e.message}`, e);
    // FjnError 的 message 已经设计为可安全返回（H6 规范）
    const status = e.httpStatus ?? 400;
    return {
      response: apiError(e.code, e.message, status, e.context),
      userMessage: e.message,
      code: e.code,
      status,
    };
  }

  // 3) Prisma 已知错误 - 映射到用户友好消息
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error(`[${context}] Prisma error ${e.code}`, e);
    switch (e.code) {
      case 'P2002': // Unique constraint failed
        return {
          response: conflict('Duplicate record'),
          userMessage: 'Duplicate record',
          code: 'DUPLICATE_RECORD',
          status: 409,
        };
      case 'P2025': // Record not found
        return {
          response: notFound('Record not found'),
          userMessage: 'Record not found',
          code: 'NOT_FOUND',
          status: 404,
        };
      case 'P2003': // Foreign key constraint failed
        return {
          response: badRequest('Related record not found'),
          userMessage: 'Related record not found',
          code: 'FK_CONSTRAINT',
          status: 400,
        };
      case 'P2010': // Raw query failed
      case 'P2011': // Null constraint violation
      case 'P2012': // Missing required value
      case 'P2013': // Missing required argument
      case 'P2014': // Relation violation
        return {
          response: badRequest('Invalid input data'),
          userMessage: 'Invalid input data',
          code: 'INVALID_INPUT',
          status: 400,
        };
      case 'P2016': // Query interpretation error
      case 'P2017': // Records for relation not connected
        return {
          response: badRequest('Database query error'),
          userMessage: 'Database query error',
          code: 'DB_QUERY_ERROR',
          status: 400,
        };
      case 'P2024': // Connection pool timeout
      case 'P2034': // Transaction conflict
        return {
          response: tooManyRequests('Service busy, please retry'),
          userMessage: 'Service busy, please retry',
          code: 'SERVICE_BUSY',
          status: 429,
        };
      default:
        return {
          response: internalError('Database error'),
          userMessage: 'Database error',
          code: 'DATABASE_ERROR',
          status: 500,
        };
    }
  }

  // 4) Prisma 校验错误 - 不暴露具体字段
  if (e instanceof Prisma.PrismaClientValidationError) {
    logger.error(`[${context}] Prisma validation error`, e);
    return {
      response: badRequest('Invalid input data'),
      userMessage: 'Invalid input data',
      code: 'INVALID_INPUT',
      status: 400,
    };
  }

  // 5) Prisma 其他错误（连接、初始化等）
  if (e instanceof Prisma.PrismaClientInitializationError ||
      e instanceof Prisma.PrismaClientRustPanicError) {
    logger.error(`[${context}] Prisma initialization error`, e);
    return {
      response: internalError('Database service unavailable'),
      userMessage: 'Database service unavailable',
      code: 'DB_UNAVAILABLE',
      status: 503,
    };
  }

  // 6) JSON 解析错误
  if (e instanceof SyntaxError && 'body' in (e as any)) {
    logger.error(`[${context}] JSON parse error`, e);
    return {
      response: badRequest('Invalid JSON body'),
      userMessage: 'Invalid JSON body',
      code: 'INVALID_JSON',
      status: 400,
    };
  }

  // 7) 标准 JS Error - 提取安全字段
  if (e instanceof Error) {
    // 记录完整堆栈
    logger.error(`[${context}] ${e.name}: ${e.message}`, e);
    return {
      response: internalError('An unexpected error occurred'),
      userMessage: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      status: 500,
    };
  }

  // 8) 未知错误（非 Error 对象）
  logger.error(`[${context}] Unknown error:`, e);
  return {
    response: internalError('An unexpected error occurred'),
    userMessage: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    status: 500,
  };
}

// ============================================================
// 主入口: handleApiError
// ============================================================

/**
 * 统一错误处理（主入口）
 *
 * @param e 捕获的错误（unknown 类型，安全）
 * @param context 上下文标识（用于日志追踪，例 "api:fjn/risk case-list"）
 * @returns NextResponse - 安全的 HTTP 响应
 *
 * @example
 * ```typescript
 * async function listRiskCases(req: NextRequest) {
 *   try {
 *     const result = await svc.listCases(...);
 *     return success(result);
 *   } catch (e) {
 *     return handleApiError(e, 'api:fjn/risk case-list');
 *   }
 * }
 * ```
 */
export function handleApiError(e: unknown, context: string): NextResponse {
  const classified = classifyError(e, context);
  return classified.response;
}

// ============================================================
// 高阶函数: withApiErrorBoundary
// ============================================================

/**
 * 异步处理器包装器（自动捕获错误）
 *
 * @param handler 业务处理函数
 * @param context 上下文标识
 * @returns 包装后的处理函数
 *
 * @example
 * ```typescript
 * export const GET = withApiErrorBoundary(
 *   async (req) => {
 *     const result = await svc.list(...);
 *     return success(result);
 *   },
 *   'api:fjn/risk case-list'
 * );
 * ```
 */
export function withApiErrorBoundary<TArgs extends any[], TReturn extends NextResponse>(
  handler: (...args: TArgs) => Promise<TReturn>,
  context: string,
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (e) {
      return handleApiError(e, context);
    }
  };
}

/**
 * 别名：与 withApiErrorBoundary 等价（兼容旧调用约定）
 * 用法：`withErrorHandler(handler)` 或 `withErrorHandler(handler, 'context')`
 */
export function withErrorHandler<TArgs extends any[], TReturn extends NextResponse>(
  handler: (...args: TArgs) => Promise<TReturn>,
  context?: string
): (...args: TArgs) => Promise<NextResponse> {
  return withApiErrorBoundary(handler, context ?? 'api:handler');
}

// ============================================================
// 兼容层: 对外暴露常用响应构造器
// ============================================================

export const apiResponses = {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  internalError,
};

export default {
  handleApiError,
  withApiErrorBoundary,
  SafeError,
  apiResponses,
};
