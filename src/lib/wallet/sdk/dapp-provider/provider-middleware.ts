/**
 * Provider 中间件
 * Provider 请求处理中间件系统
 * 支持日志、缓存、错误处理、限流等中间件
 */

import type { RequestContext, RequestResult } from './request-handler';

/**
 * 中间件上下文
 */
export interface MiddlewareContext {
  method: string;
  params: any[];
  requestContext: RequestContext;
  startTime: number;
  metadata: Record<string, any>;
}

/**
 * 下一个中间件函数
 */
export type NextFunction = () => Promise<RequestResult>;

/**
 * 中间件函数
 */
export type MiddlewareFunction = (
  ctx: MiddlewareContext,
  next: NextFunction,
) => Promise<RequestResult>;

/**
 * 中间件类型
 */
export type MiddlewareType =
  | 'before'
  | 'after'
  | 'around';

/**
 * 中间件配置
 */
export interface MiddlewareConfig {
  name: string;
  type: MiddlewareType;
  handler: MiddlewareFunction;
  priority: number;
  enabled: boolean;
}

/**
 * 日志中间件配置
 */
export interface LogMiddlewareOptions {
  enabled?: boolean;
  logRequest?: boolean;
  logResponse?: boolean;
  logError?: boolean;
  logger?: (...args: any[]) => void;
}

/**
 * 缓存中间件配置
 */
export interface CacheMiddlewareOptions {
  enabled?: boolean;
  ttl?: number;
  maxSize?: number;
  cacheableMethods?: string[];
}

/**
 * 限流中间件配置
 */
export interface RateLimitMiddlewareOptions {
  enabled?: boolean;
  maxRequests?: number;
  windowMs?: number;
  keyPrefix?: string;
}

/**
 * 错误处理中间件配置
 */
export interface ErrorHandlerMiddlewareOptions {
  enabled?: boolean;
  onError?: (error: any, ctx: MiddlewareContext) => void;
  maskErrorDetails?: boolean;
}

/**
 * 缓存条目
 */
interface CacheEntry {
  value: RequestResult;
  timestamp: number;
}

/**
 * 限流记录
 */
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * Provider 中间件管理器
 * 管理和执行各种中间件
 */
export class ProviderMiddleware {
  /**
   * 中间件列表
   */
  private middlewares: MiddlewareConfig[] = [];

  /**
   * 缓存存储
   */
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * 限流存储
   */
  private rateLimits: Map<string, RateLimitEntry> = new Map();

  /**
   * 调试模式
   */
  private debug: boolean;

  /**
   * 构造函数
   * @param debug 是否启用调试
   */
  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  /**
   * 输出调试日志
   * @param args 日志参数
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[Middleware]', ...args);
    }
  }

  /**
   * 添加中间件
   * @param middleware 中间件配置
   */
  public use(middleware: MiddlewareConfig): void {
    this.middlewares.push(middleware);
    this.middlewares.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 移除中间件
   * @param name 中间件名称
   */
  public remove(name: string): void {
    this.middlewares = this.middlewares.filter(m => m.name !== name);
  }

  /**
   * 启用中间件
   * @param name 中间件名称
   */
  public enable(name: string): void {
    const middleware = this.middlewares.find(m => m.name === name);
    if (middleware) {
      middleware.enabled = true;
    }
  }

  /**
   * 禁用中间件
   * @param name 中间件名称
   */
  public disable(name: string): void {
    const middleware = this.middlewares.find(m => m.name === name);
    if (middleware) {
      middleware.enabled = false;
    }
  }

  /**
   * 执行中间件链
   * @param method 方法名
   * @param params 参数
   * @param requestContext 请求上下文
   * @param finalHandler 最终处理器
   * @returns 处理结果
   */
  public async execute(
    method: string,
    params: any[],
    requestContext: RequestContext,
    finalHandler: NextFunction,
  ): Promise<RequestResult> {
    const ctx: MiddlewareContext = {
      method,
      params,
      requestContext,
      startTime: Date.now(),
      metadata: {},
    };

    const enabledMiddlewares = this.middlewares.filter(m => m.enabled);
    let index = 0;

    const next = async (): Promise<RequestResult> => {
      if (index < enabledMiddlewares.length) {
        const middleware = enabledMiddlewares[index++];
        this.log(`执行中间件: ${middleware.name} (${middleware.type})`);
        return middleware.handler(ctx, next);
      } else {
        return finalHandler();
      }
    };

    try {
      return await next();
    } catch (error: any) {
      this.log('中间件执行错误:', error);
      return {
        success: false,
        error: {
          code: error.code || -32603,
          message: error.message || '内部错误',
        },
      };
    }
  }

  /**
   * 创建日志中间件
   * @param options 配置选项
   * @returns 中间件配置
   */
  public createLogMiddleware(options: LogMiddlewareOptions = {}): MiddlewareConfig {
    const {
      enabled = true,
      logRequest = true,
      logResponse = true,
      logError = true,
      logger = console.log,
    } = options;

    return {
      name: 'log',
      type: 'around',
      priority: 100,
      enabled,
      handler: async (ctx, next) => {
        if (logRequest) {
          logger(
            `[Request] ${ctx.method}`,
            'params:',
            ctx.params,
            'from:',
            ctx.requestContext.origin,
          );
        }

        const result = await next();

        const duration = Date.now() - ctx.startTime;

        if (logResponse && result.success) {
          logger(
            `[Response] ${ctx.method}`,
            'success:',
            result.success,
            'duration:',
            `${duration}ms`,
          );
        }

        if (logError && !result.success) {
          logger(
            `[Error] ${ctx.method}`,
            'error:',
            result.error,
            'duration:',
            `${duration}ms`,
          );
        }

        return result;
      },
    };
  }

  /**
   * 创建缓存中间件
   * @param options 配置选项
   * @returns 中间件配置
   */
  public createCacheMiddleware(options: CacheMiddlewareOptions = {}): MiddlewareConfig {
    const {
      enabled = true,
      ttl = 10000,
      maxSize = 100,
      cacheableMethods = [
        'eth_chainId',
        'eth_blockNumber',
        'eth_gasPrice',
        'net_version',
        'web3_clientVersion',
      ],
    } = options;

    return {
      name: 'cache',
      type: 'around',
      priority: 50,
      enabled,
      handler: async (ctx, next) => {
        if (!cacheableMethods.includes(ctx.method)) {
          return next();
        }

        const cacheKey = this.generateCacheKey(
          ctx.method,
          ctx.params,
          ctx.requestContext.chainId,
        );

        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < ttl) {
          this.log(`缓存命中: ${ctx.method}`);
          ctx.metadata.cached = true;
          return cached.value;
        }

        const result = await next();

        if (result.success) {
          if (this.cache.size >= maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
              this.cache.delete(firstKey);
            }
          }
          this.cache.set(cacheKey, {
            value: result,
            timestamp: Date.now(),
          });
        }

        return result;
      },
    };
  }

  /**
   * 创建限流中间件
   * @param options 配置选项
   * @returns 中间件配置
   */
  public createRateLimitMiddleware(options: RateLimitMiddlewareOptions = {}): MiddlewareConfig {
    const {
      enabled = true,
      maxRequests = 100,
      windowMs = 60000,
      keyPrefix = 'rate_limit',
    } = options;

    return {
      name: 'rateLimit',
      type: 'before',
      priority: 10,
      enabled,
      handler: async (ctx, next) => {
        const key = `${keyPrefix}:${ctx.requestContext.origin}`;
        const now = Date.now();

        let entry = this.rateLimits.get(key);
        if (!entry || now - entry.windowStart > windowMs) {
          entry = {
            count: 0,
            windowStart: now,
          };
          this.rateLimits.set(key, entry);
        }

        entry.count++;

        if (entry.count > maxRequests) {
          this.log(`限流触发: ${ctx.requestContext.origin}`);
          return {
            success: false,
            error: {
              code: -32000,
              message: '请求过于频繁，请稍后再试',
              data: {
                maxRequests,
                windowMs,
                retryAfter: Math.ceil((windowMs - (now - entry.windowStart)) / 1000),
              },
            },
          };
        }

        return next();
      },
    };
  }

  /**
   * 创建错误处理中间件
   * @param options 配置选项
   * @returns 中间件配置
   */
  public createErrorHandlerMiddleware(options: ErrorHandlerMiddlewareOptions = {}): MiddlewareConfig {
    const {
      enabled = true,
      onError,
      maskErrorDetails = false,
    } = options;

    return {
      name: 'errorHandler',
      type: 'around',
      priority: 200,
      enabled,
      handler: async (ctx, next) => {
        try {
          const result = await next();
          return result;
        } catch (error: any) {
          this.log('错误处理中间件捕获错误:', error);

          if (onError) {
            try {
              onError(error, ctx);
            } catch {
              // 忽略错误处理器自身的错误
            }
          }

          let message = error.message || '内部错误';
          let code = error.code || -32603;

          if (maskErrorDetails) {
            message = '内部错误';
          }

          return {
            success: false,
            error: {
              code,
              message,
              data: maskErrorDetails ? undefined : error.data,
            },
          };
        }
      },
    };
  }

  /**
   * 生成缓存键
   * @param method 方法名
   * @param params 参数
   * @param chainId 链 ID
   * @returns 缓存键
   */
  private generateCacheKey(method: string, params: any[], chainId: number): string {
    return `${method}:${chainId}:${JSON.stringify(params)}`;
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   * @returns 缓存大小
   */
  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * 清除限流记录
   */
  public clearRateLimits(): void {
    this.rateLimits.clear();
  }

  /**
   * 获取所有中间件
   * @returns 中间件列表
   */
  public getMiddlewares(): MiddlewareConfig[] {
    return [...this.middlewares];
  }

  /**
   * 重置所有中间件
   */
  public reset(): void {
    this.middlewares = [];
    this.cache.clear();
    this.rateLimits.clear();
  }
}
