/**
 * Stream / SSE 端点 Rate Limit (P3-3)
 *
 * 防止长连接流被滥用：
 *  - 同一 IP + endpoint 维度限流（默认 60 次/分钟）
 *  - 同时连接数限制（默认 5 个）
 *  - 自动降级：Redis 不可用时使用 in-memory 计数
 *  - 超限返回 429 + Retry-After
 *
 * 用法（以 SSE 路由为例）：
 * ```ts
 * import { withStreamRateLimit, streamRateLimit } from '@/lib/security/stream-rate-limit';
 *
 * export async function GET(req: NextRequest) {
 *   const limited = await streamRateLimit(req, {
 *     endpoint: 'market-stream',
 *     windowMs: 60_000,
 *     maxRequests: 30,    // 30 次/分钟（每分钟重连次数）
 *     maxConcurrent: 5,   // 同时 5 个连接
 *   });
 *   if (limited) return limited;
 *
 *   const stream = new ReadableStream({...});
 *   return new Response(stream, {
 *     headers: { 'Content-Type': 'text/event-stream' },
 *   });
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { ttlGet, ttlIncrement, ttlDecrement, ttlStore } from './redis-ttl-store';
import { logger } from '@/lib/logger';

export interface StreamRateLimitOptions {
  /** 端点标识（用于 key 命名空间） */
  endpoint: string;
  /** 滑动窗口（毫秒），默认 60_000 = 1 分钟 */
  windowMs?: number;
  /** 窗口内最大请求数，默认 60 */
  maxRequests?: number;
  /** 同时活跃连接数（每个 IP+endpoint），默认 5 */
  maxConcurrent?: number;
  /** 客户端 IP 自定义获取（默认从 x-forwarded-for / x-real-ip / 兜底 'unknown'） */
  getClientKey?: (req: NextRequest) => string;
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 60;
const DEFAULT_MAX_CONCURRENT = 5;

function defaultGetClientKey(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  const xri = req.headers.get('x-real-ip');
  if (xri) return xri;
  return 'unknown';
}

/**
 * 应用流式端点 rate limit
 *  - 不超限：返回 null
 *  - 超限：返回 NextResponse（429 + Retry-After），调用方直接 return
 */
export async function streamRateLimit(
  req: NextRequest,
  options: StreamRateLimitOptions,
): Promise<NextResponse | null> {
  const {
    endpoint,
    windowMs = DEFAULT_WINDOW_MS,
    maxRequests = DEFAULT_MAX_REQUESTS,
    maxConcurrent = DEFAULT_MAX_CONCURRENT,
    getClientKey = defaultGetClientKey,
  } = options;

  const clientKey = getClientKey(req);
  const windowSec = Math.ceil(windowMs / 1000);
  const requestKey = `stream:rl:req:${endpoint}:${clientKey}`;
  const concurrentKey = `stream:rl:concurrent:${endpoint}:${clientKey}`;

  try {
    // 1. 并发连接数：原子自增 + 立即判断 + 超限原子回滚
    //    - 增在先：避免 TOCTOU 竞态
    //    - 减在后：用 ttlDecrement 原子回滚，避免计数污染
    const CONCURRENT_TTL_SEC = 30;
    const concurrent = await ttlIncrement(concurrentKey, CONCURRENT_TTL_SEC);
    if (concurrent > maxConcurrent) {
      // 原子回滚：让计数 == 真实活跃连接数
      await ttlDecrement(concurrentKey);
      logger.warn(`[stream-rate-limit] concurrent limit hit: ${endpoint} ${clientKey} (${concurrent}/${maxConcurrent})`);
      return new NextResponse(
        JSON.stringify({
          error: 'TOO_MANY_CONNECTIONS',
          message: `Too many concurrent connections. Max ${maxConcurrent}.`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(windowSec),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
          },
        },
      );
    }

    // 2. 滑动窗口请求计数
    const count = await ttlIncrement(requestKey, windowSec);
    if (count > maxRequests) {
      // 请求超限 → 原子回滚并发计数
      await ttlDecrement(concurrentKey);
      logger.warn(`[stream-rate-limit] request limit hit: ${endpoint} ${clientKey} (${count}/${maxRequests})`);
      return new NextResponse(
        JSON.stringify({
          error: 'RATE_LIMITED',
          message: `Too many requests. Max ${maxRequests} per ${windowSec}s.`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(windowSec),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
          },
        },
      );
    }

    // 3. 已记录活跃连接（步骤 1 自增；连接关闭时 releaseStreamConnection 减 1）
    logger.info(`[stream-rate-limit] accepted: ${endpoint} ${clientKey} concurrent=${concurrent}/${maxConcurrent} count=${count}/${maxRequests}`);
    return null;
  } catch (err) {
    // Redis 异常 → 放行（fail-open），但记录日志
    logger.error('[stream-rate-limit] unexpected error, fail-open:', err);
    return null;
  }
}

/**
 * 连接关闭时释放并发计数
 *  - 在 ReadableStream 的 cancel() 中调用
 */
export async function releaseStreamConnection(
  req: NextRequest,
  options: Pick<StreamRateLimitOptions, 'endpoint' | 'getClientKey'>,
): Promise<void> {
  const getClientKey = options.getClientKey ?? defaultGetClientKey;
  const clientKey = getClientKey(req);
  const concurrentKey = `stream:rl:concurrent:${options.endpoint}:${clientKey}`;
  try {
    // 原子自减：避免多个 release 并发时的覆盖问题
    const newCount = await ttlDecrement(concurrentKey);
    if (newCount === 0) {
      // 已无活跃连接：可选清理（in-memory 模式下 TTL 兜底）
      // 不强制删除 key，让 30s TTL 自然过期
    }
  } catch (err) {
    logger.error('[stream-rate-limit] release error:', err);
  }
}

/**
 * 装饰器式高阶函数（简化路由写法）
 */
export function withStreamRateLimit<T>(
  options: StreamRateLimitOptions,
  handler: (req: NextRequest) => Promise<T>,
): (req: NextRequest) => Promise<T | NextResponse> {
  return async (req: NextRequest) => {
    const limited = await streamRateLimit(req, options);
    if (limited) return limited;
    return handler(req);
  };
}
