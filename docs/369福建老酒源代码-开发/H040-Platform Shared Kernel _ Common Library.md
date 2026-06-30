# H040\-Platform Shared Kernel / Common Library

下面进入下一阶段：Platform Shared Kernel / Common Library。



# Platform Shared Kernel / Common Library



这一层负责把 23 个服务重复能力统一起来：



```Plain Text
统一异常
统一响应
统一 Prisma 注入
统一配置校验
统一请求上下文
统一 Auth / Admin Guard
统一 Audit Interceptor
统一 Idempotency-Key
统一 Outbox Publisher
统一事件消费基座
统一分页
统一 Decimal 工具
统一服务间 HTTP Client
```



建议目录：



```Plain Text
libs/platform/
├── src/
│   ├── index.ts
│   ├── exceptions/
│   ├── response/
│   ├── prisma/
│   ├── config/
│   ├── context/
│   ├── auth/
│   ├── audit/
│   ├── idempotency/
│   ├── outbox/
│   ├── events/
│   ├── pagination/
│   ├── decimal/
│   └── http-client/
```



---



## 1\. 统一异常



`libs/platform/src/exceptions/app.exception.ts`



```TypeScript
import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    public readonly code: string,
    message?: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: Record
  ) {
    super(
      {
        success: false,
        error: {
          code,
          message: message || code,
          details: details || null
        }
      },
      status
    );
  }
}
```



`libs/platform/src/exceptions/error-codes.ts`



```TypeScript
export const CommonErrorCodes = {
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const;
```



`libs/platform/src/exceptions/global-exception.filter.ts`



```TypeScript
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Response } from 'express';
import { CommonErrorCodes } from './error-codes';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      return response.status(status).json(
        typeof payload === 'object'
          ? payload
          : {
              success: false,
              error: {
                code: CommonErrorCodes.INTERNAL_ERROR,
                message: String(payload),
                details: null
              }
            }
      );
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: CommonErrorCodes.INTERNAL_ERROR,
        message: 'Internal server error',
        details: null
      }
    });
  }
}
```



`libs/platform/src/exceptions/index.ts`



```TypeScript
export * from './app.exception';
export * from './error-codes';
export * from './global-exception.filter';
```



---



## 2\. 统一响应



`libs/platform/src/response/api-response.interceptor.ts`



```TypeScript
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data
      }))
    );
  }
}
```



`libs/platform/src/response/index.ts`



```TypeScript
export * from './api-response.interceptor';
```



---



## 3\. PrismaModule



`libs/platform/src/prisma/prisma.service.ts`



```TypeScript
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```



`libs/platform/src/prisma/prisma.module.ts`



```TypeScript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
```



`libs/platform/src/prisma/index.ts`



```TypeScript
export * from './prisma.module';
export * from './prisma.service';
```



使用后，各服务 repository 从：



```TypeScript
const prisma = new PrismaClient();
```



改成：



```TypeScript
constructor(private readonly prisma: PrismaService) {}
```



---



## 4\. 配置校验



`libs/platform/src/config/env.schema.ts`



```TypeScript
import * as Joi from 'joi';

export const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'staging', 'production')
    .default('development'),

  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().optional(),

  INTERNAL_API_KEY: Joi.string().optional(),

  SERVICE_NAME: Joi.string().required()
});
```



`libs/platform/src/config/platform-config.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema
    })
  ]
})
export class PlatformConfigModule {}
```



`libs/platform/src/config/index.ts`



```TypeScript
export * from './platform-config.module';
export * from './env.schema';
```



---



## 5\. 请求上下文



`libs/platform/src/context/request-context.ts`



```TypeScript
export interface RequestContext {
  requestId?: string;
  traceId?: string;
  userId?: string;
  actorId?: string;
  actorType?: string;
  roles?: string[];
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
}
```



`libs/platform/src/context/request-context.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { RequestContext } from './request-context';

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage();

  run(context: RequestContext, callback: () => void) {
    this.storage.run(context, callback);
  }

  get(): RequestContext {
    return this.storage.getStore() || {};
  }
}
```



`libs/platform/src/context/request-context.middleware.ts`



```TypeScript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ulid } from 'ulid';
import { RequestContextService } from './request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

  use(req: Request, _: Response, next: NextFunction) {
    const requestId = req.header('x-request-id') || ulid();
    const traceId = req.header('x-trace-id') || requestId;

    this.context.run(
      {
        requestId,
        traceId,
        userId: req.header('x-user-id'),
        actorId: req.header('x-actor-id') || req.header('x-user-id'),
        actorType: req.header('x-actor-type') || 'user',
        roles: (req.header('x-roles') || '')
          .split(',')
          .map((role) => role.trim())
          .filter(Boolean),
        ipAddress: req.ip,
        userAgent: req.header('user-agent'),
        deviceId: req.header('x-device-id')
      },
      next
    );
  }
}
```



`libs/platform/src/context/context.module.ts`



```TypeScript
import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestContextMiddleware } from './request-context.middleware';
import { RequestContextService } from './request-context.service';

@Global()
@Module({
  providers: [RequestContextService],
  exports: [RequestContextService]
})
export class RequestContextModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
```



`libs/platform/src/context/index.ts`



```TypeScript
export * from './request-context';
export * from './request-context.service';
export * from './request-context.middleware';
export * from './context.module';
```



---



## 6\. Auth / Admin Guard



`libs/platform/src/auth/internal-api-key.guard.ts`



```TypeScript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const expected = this.config.get('INTERNAL_API_KEY');

    if (!expected) return true;

    const actual = request.header('x-internal-api-key');

    if (actual !== expected) {
      throw new UnauthorizedException('Invalid internal API key');
    }

    return true;
  }
}
```



`libs/platform/src/auth/admin.guard.ts`



```TypeScript
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const roles = (request.header('x-roles') || '')
      .split(',')
      .map((role) => role.trim());

    if (!roles.includes('admin')) {
      throw new ForbiddenException('Admin role required');
    }

    return true;
  }
}
```



`libs/platform/src/auth/index.ts`



```TypeScript
export * from './internal-api-key.guard';
export * from './admin.guard';
```



---



## 7\. 分页工具



`libs/platform/src/pagination/pagination.ts`



```TypeScript
export function normalizePagination(query: {
  page?: number | string;
  page_size?: number | string;
}) {
  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.page_size || 20), 1), 100);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize
  };
}

export function buildPagination(params: {
  page: number;
  pageSize: number;
  total: number;
}) {
  return {
    page: params.page,
    page_size: params.pageSize,
    total: params.total,
    total_pages: Math.ceil(params.total / params.pageSize)
  };
}
```



`libs/platform/src/pagination/index.ts`



```TypeScript
export * from './pagination';
```



---



## 8\. Decimal 工具



`libs/platform/src/decimal/decimal.ts`



```TypeScript
import Decimal from 'decimal.js';

export function toDecimalString(value: string | number | Decimal) {
  return new Decimal(value).toFixed(18);
}

export function assertPositiveDecimal(value: string, code = 'AMOUNT_INVALID') {
  if (new Decimal(value).lte(0)) {
    throw new Error(code);
  }
}

export function assertNonNegativeDecimal(value: string, code = 'AMOUNT_INVALID') {
  if (new Decimal(value).lt(0)) {
    throw new Error(code);
  }
}
```



`libs/platform/src/decimal/index.ts`



```TypeScript
export * from './decimal';
```



---



## 9\. Idempotency\-Key



### 9\.1 Prisma 表



```Plain Text
model IdempotencyRecord {
  id              String    @id
  idempotencyKey  String    @unique @map("idempotency_key")
  requestHash     String    @map("request_hash")
  responsePayload Json?     @map("response_payload")
  status          String    @default("processing")
  lockedUntil     DateTime? @map("locked_until")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@map("idempotency_records")
}
```



### 9\.2 Repository



`libs/platform/src/idempotency/idempotency.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class IdempotencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByKey(key: string) {
    return this.prisma.idempotencyRecord.findUnique({
      where: { idempotencyKey: key }
    });
  }

  createProcessing(key: string, requestHash: string, lockedUntil: Date) {
    return this.prisma.idempotencyRecord.create({
      data: {
        id: crypto.randomUUID(),
        idempotencyKey: key,
        requestHash,
        status: 'processing',
        lockedUntil
      }
    });
  }

  markCompleted(key: string, responsePayload: unknown) {
    return this.prisma.idempotencyRecord.update({
      where: { idempotencyKey: key },
      data: {
        status: 'completed',
        responsePayload: responsePayload as any
      }
    });
  }
}
```



> 如果项目 Node 版本不支持 `crypto.randomUUID()`，就统一换成 `ulid()`。
> 
> 



### 9\.3 Interceptor



`libs/platform/src/idempotency/idempotency.interceptor.ts`



```TypeScript
import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import { createHash } from 'crypto';
import { Request } from 'express';
import { Observable, from, of, switchMap, tap } from 'rxjs';
import { IdempotencyRepository } from './idempotency.repository';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly repository: IdempotencyRepository) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable {
    const request = context.switchToHttp().getRequest();
    const key = request.header('idempotency-key');

    if (!key || request.method === 'GET') {
      return next.handle();
    }

    const requestHash = createHash('sha256')
      .update(JSON.stringify(request.body || {}))
      .digest('hex');

    return from(this.repository.findByKey(key)).pipe(
      switchMap((existing) => {
        if (existing) {
          if (existing.requestHash !== requestHash) {
            throw new ConflictException('Idempotency key conflict');
          }

          if (existing.status === 'completed') {
            return of(existing.responsePayload);
          }

          throw new ConflictException('Request is processing');
        }

        const lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + 5);

        return from(
          this.repository.createProcessing(key, requestHash, lockedUntil)
        ).pipe(
          switchMap(() =>
            next.handle().pipe(
              tap((response) => {
                void this.repository.markCompleted(key, response);
              })
            )
          )
        );
      })
    );
  }
}
```



`libs/platform/src/idempotency/idempotency.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { IdempotencyRepository } from './idempotency.repository';

@Module({
  imports: [PrismaModule],
  providers: [IdempotencyRepository],
  exports: [IdempotencyRepository]
})
export class IdempotencyModule {}
```



`libs/platform/src/idempotency/index.ts`



```TypeScript
export * from './idempotency.repository';
export * from './idempotency.interceptor';
export * from './idempotency.module';
```



---



## 10\. Outbox Publisher



### 10\.1 标准 OutboxEvent 表



```Plain Text
model OutboxEvent {
  id          String    @id
  eventType   String    @map("event_type")
  payload     Json
  status      String    @default("pending")
  retryCount  Int       @default(0) @map("retry_count")
  nextRetryAt DateTime? @map("next_retry_at")
  publishedAt DateTime? @map("published_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@index([status])
  @@index([eventType])
  @@map("outbox_events")
}
```



### 10\.2 Repository



`libs/platform/src/outbox/outbox.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class OutboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPending(limit = 100) {
    return this.prisma.outboxEvent.findMany({
      where: {
        status: 'pending',
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { lte: new Date() } }
        ]
      },
      orderBy: { createdAt: 'asc' },
      take: limit
    });
  }

  markPublished(eventId: string) {
    return this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: 'published',
        publishedAt: new Date()
      }
    });
  }

  markFailed(eventId: string, retryCount: number) {
    const nextRetryAt = new Date();
    nextRetryAt.setSeconds(nextRetryAt.getSeconds() + Math.min(60 * retryCount, 600));

    return this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: retryCount >= 10 ? 'failed' : 'pending',
        retryCount,
        nextRetryAt
      }
    });
  }
}
```



### 10\.3 Event Bus 抽象



`libs/platform/src/events/event-bus.ts`



```TypeScript
export interface EventBus {
  publish(eventType: string, payload: unknown): Promise;
}

export const EVENT_BUS = Symbol('EVENT_BUS');
```



`libs/platform/src/events/noop-event-bus.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { EventBus } from './event-bus';

@Injectable()
export class NoopEventBus implements EventBus {
  async publish(eventType: string, payload: unknown): Promise {
    console.log('[NoopEventBus]', eventType, JSON.stringify(payload));
  }
}
```



`libs/platform/src/events/events.module.ts`



```TypeScript
import { Global, Module } from '@nestjs/common';
import { EVENT_BUS } from './event-bus';
import { NoopEventBus } from './noop-event-bus';

@Global()
@Module({
  providers: [
    {
      provide: EVENT_BUS,
      useClass: NoopEventBus
    }
  ],
  exports: [EVENT_BUS]
})
export class EventsModule {}
```



### 10\.4 Publisher Service



`libs/platform/src/outbox/outbox-publisher.service.ts`



```TypeScript
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EVENT_BUS, EventBus } from '../events';
import { OutboxRepository } from './outbox.repository';

@Injectable()
export class OutboxPublisherService {
  private readonly logger = new Logger(OutboxPublisherService.name);

  constructor(
    private readonly outboxRepository: OutboxRepository,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus
  ) {}

  async publishBatch(limit = 100) {
    const events = await this.outboxRepository.findPending(limit);

    for (const event of events) {
      try {
        await this.eventBus.publish(event.eventType, event.payload);
        await this.outboxRepository.markPublished(event.id);
      } catch (error) {
        this.logger.error(
          `Failed to publish ${event.id}: ${(error as Error).message}`
        );
        await this.outboxRepository.markFailed(
          event.id,
          event.retryCount + 1
        );
      }
    }

    return {
      published: events.length
    };
  }
}
```



`libs/platform/src/outbox/outbox.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { EventsModule } from '../events';
import { PrismaModule } from '../prisma';
import { OutboxPublisherService } from './outbox-publisher.service';
import { OutboxRepository } from './outbox.repository';

@Module({
  imports: [PrismaModule, EventsModule],
  providers: [OutboxRepository, OutboxPublisherService],
  exports: [OutboxRepository, OutboxPublisherService]
})
export class OutboxModule {}
```



`libs/platform/src/outbox/index.ts`



```TypeScript
export * from './outbox.repository';
export * from './outbox-publisher.service';
export * from './outbox.module';
```



`libs/platform/src/events/index.ts`



```TypeScript
export * from './event-bus';
export * from './noop-event-bus';
export * from './events.module';
```



---



## 11\. Audit Interceptor



`libs/platform/src/audit/audit.interceptor.ts`



```TypeScript
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { RequestContextService } from '../context';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly context: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable {
    const req = context.switchToHttp().getRequest();
    const ctx = this.context.get();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          console.log('[Audit]', {
            result: 'success',
            method: req.method,
            path: req.path,
            actor_id: ctx.actorId,
            request_id: ctx.requestId,
            duration_ms: Date.now() - startedAt
          });
        },
        error: (error) => {
          console.log('[Audit]', {
            result: 'failed',
            method: req.method,
            path: req.path,
            actor_id: ctx.actorId,
            request_id: ctx.requestId,
            error: error?.message,
            duration_ms: Date.now() - startedAt
          });
        }
      })
    );
  }
}
```



`libs/platform/src/audit/index.ts`



```TypeScript
export * from './audit.interceptor';
```



---



## 12\. HTTP Client



`libs/platform/src/http-client/service-http-client.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { RequestContextService } from '../context';

@Injectable()
export class ServiceHttpClient {
  constructor(private readonly context: RequestContextService) {}

  async get(url: string, init?: RequestInit): Promise {
    return this.request(url, { ...init, method: 'GET' });
  }

  async post(url: string, body?: unknown, init?: RequestInit): Promise {
    return this.request(url, {
      ...init,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  private async request(url: string, init: RequestInit): Promise {
    const ctx = this.context.get();

    const response = await fetch(url, {
      ...init,
      headers: {
        'content-type': 'application/json',
        'x-request-id': ctx.requestId || '',
        'x-trace-id': ctx.traceId || '',
        'x-user-id': ctx.userId || '',
        ...(init.headers || {})
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json() as Promise;
  }
}
```



`libs/platform/src/http-client/http-client.module.ts`



```TypeScript
import { Global, Module } from '@nestjs/common';
import { RequestContextModule } from '../context';
import { ServiceHttpClient } from './service-http-client';

@Global()
@Module({
  imports: [RequestContextModule],
  providers: [ServiceHttpClient],
  exports: [ServiceHttpClient]
})
export class HttpClientModule {}
```



`libs/platform/src/http-client/index.ts`



```TypeScript
export * from './service-http-client';
export * from './http-client.module';
```



---



## 13\. Platform Module



`libs/platform/src/platform.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { PlatformConfigModule } from './config';
import { RequestContextModule } from './context';
import { EventsModule } from './events';
import { HttpClientModule } from './http-client';
import { IdempotencyModule } from './idempotency';
import { OutboxModule } from './outbox';
import { PrismaModule } from './prisma';

@Module({
  imports: [
    PlatformConfigModule,
    RequestContextModule,
    PrismaModule,
    EventsModule,
    OutboxModule,
    IdempotencyModule,
    HttpClientModule
  ],
  exports: [
    PlatformConfigModule,
    RequestContextModule,
    PrismaModule,
    EventsModule,
    OutboxModule,
    IdempotencyModule,
    HttpClientModule
  ]
})
export class PlatformModule {}
```



`libs/platform/src/index.ts`



```TypeScript
export * from './platform.module';

export * from './audit';
export * from './auth';
export * from './config';
export * from './context';
export * from './decimal';
export * from './events';
export * from './exceptions';
export * from './http-client';
export * from './idempotency';
export * from './outbox';
export * from './pagination';
export * from './prisma';
export * from './response';
```



---



# 14\. 服务接入方式



每个服务的 `app.module.ts` 后续统一改成：



```TypeScript
import { Module } from '@nestjs/common';
import { PlatformModule } from '@platform';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    PlatformModule,
    HealthModule
  ]
})
export class AppModule {}
```



每个服务的 `main.ts` 统一改成：



```TypeScript
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  ApiResponseInterceptor,
  GlobalExceptionFilter,
  IdempotencyInterceptor
} from '@platform';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    app.get(ApiResponseInterceptor),
    app.get(IdempotencyInterceptor)
  );

  const config = app.get(ConfigService);
  await app.listen(config.get('PORT') || 3000);
}

bootstrap();
```



> 注意：如果 `ApiResponseInterceptor` 要通过 DI 获取，需要在 PlatformModule 里作为 provider 导出；也可以直接 `new ApiResponseInterceptor()`。
> 
> 



---



# 15\. 下一步继续



建议下一步写：



```Plain Text
Outbox Worker Service
```



也就是独立进程：



```Plain Text
apps/outbox-worker
```



负责：



```Plain Text
定时扫描 outbox_events
发布事件到 RabbitMQ / Kafka / Redis Stream
失败重试
死信记录
发布指标
```



这会让前面 23 个业务服务的 outbox 事件真正跑起来。

