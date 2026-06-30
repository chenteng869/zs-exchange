# H042\-Outbox Worker Service

# Outbox Worker Service



本服务是全系统事件可靠投递核心，负责：



```Plain Text
扫描 outbox_events
发布事件到 Event Bus
失败重试
指数退避
死信标记
发布指标
支持单批次手动触发
支持定时轮询
```



---



# 1\. 目录结构



```Plain Text
apps/outbox-worker/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── worker/
│   │   ├── outbox-worker.module.ts
│   │   ├── outbox-worker.service.ts
│   │   ├── outbox-worker.controller.ts
│   │   └── dto/
│   │       └── publish-batch.dto.ts
│   └── health/
│       ├── health.controller.ts
│       └── health.module.ts
```



---



# 2\. package 依赖



需要 Nest schedule：



```Bash
pnpm add @nestjs/schedule
```



如果未来接 RabbitMQ / Kafka：



```Bash
pnpm add amqplib
# 或
pnpm add kafkajs
```



当前第一版先使用 `NoopEventBus`，保证 outbox 状态机跑通。



---



# 3\. main\.ts



`apps/outbox-worker/src/main.ts`



```TypeScript
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from '@platform';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = app.get(ConfigService);
  const port = config.get('PORT') || 3099;

  await app.listen(port);
}

bootstrap();
```



---



# 4\. AppModule



`apps/outbox-worker/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PlatformModule } from '@platform';
import { HealthModule } from './health/health.module';
import { OutboxWorkerModule } from './worker/outbox-worker.module';

@Module({
  imports: [
    PlatformModule,
    ScheduleModule.forRoot(),
    HealthModule,
    OutboxWorkerModule
  ]
})
export class AppModule {}
```



---



# 5\. Health



`apps/outbox-worker/src/health/health.controller.ts`



```TypeScript
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'outbox-worker'
    };
  }
}
```



`apps/outbox-worker/src/health/health.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController]
})
export class HealthModule {}
```



---



# 6\. DTO



`apps/outbox-worker/src/worker/dto/publish-batch.dto.ts`



```TypeScript
import { IsInt, IsOptional, Min } from 'class-validator';

export class PublishBatchDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
```



---



# 7\. Outbox Worker Module



`apps/outbox-worker/src/worker/outbox-worker.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { OutboxModule } from '@platform';
import { OutboxWorkerController } from './outbox-worker.controller';
import { OutboxWorkerService } from './outbox-worker.service';

@Module({
  imports: [OutboxModule],
  controllers: [OutboxWorkerController],
  providers: [OutboxWorkerService],
  exports: [OutboxWorkerService]
})
export class OutboxWorkerModule {}
```



---



# 8\. Outbox Worker Service



`apps/outbox-worker/src/worker/outbox-worker.service.ts`



```TypeScript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxPublisherService } from '@platform';

@Injectable()
export class OutboxWorkerService {
  private readonly logger = new Logger(OutboxWorkerService.name);
  private running = false;

  constructor(private readonly outboxPublisher: OutboxPublisherService) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async publishScheduledBatch() {
    const enabled = process.env.OUTBOX_WORKER_ENABLED ?? 'true';

    if (enabled !== 'true') {
      return;
    }

    await this.publishBatch({
      limit: Number(process.env.OUTBOX_BATCH_SIZE || 100),
      source: 'schedule'
    });
  }

  async publishBatch(params: { limit?: number; source?: string }) {
    if (this.running) {
      return {
        skipped: true,
        reason: 'worker_already_running'
      };
    }

    this.running = true;
    const startedAt = Date.now();

    try {
      const limit = params.limit || 100;
      const result = await this.outboxPublisher.publishBatch(limit);

      this.logger.log(
        `Outbox batch published source=${params.source || 'manual'} published=${result.published} duration_ms=${Date.now() - startedAt}`
      );

      return {
        skipped: false,
        published: result.published,
        duration_ms: Date.now() - startedAt
      };
    } catch (error) {
      this.logger.error(
        `Outbox batch failed: ${(error as Error).message}`,
        (error as Error).stack
      );

      throw error;
    } finally {
      this.running = false;
    }
  }
}
```



---



# 9\. Outbox Worker Controller



`apps/outbox-worker/src/worker/outbox-worker.controller.ts`



```TypeScript
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InternalApiKeyGuard } from '@platform';
import { PublishBatchDto } from './dto/publish-batch.dto';
import { OutboxWorkerService } from './outbox-worker.service';

@Controller('outbox-worker')
@UseGuards(InternalApiKeyGuard)
export class OutboxWorkerController {
  constructor(private readonly outboxWorkerService: OutboxWorkerService) {}

  @Post('publish-batch')
  publishBatch(@Body() dto: PublishBatchDto) {
    return this.outboxWorkerService.publishBatch({
      limit: dto.limit || 100,
      source: 'manual'
    });
  }
}
```



---



# 10\. 环境变量



`.env`



```Plain Text
SERVICE_NAME=outbox-worker
PORT=3099
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app
INTERNAL_API_KEY=dev-internal-key

OUTBOX_WORKER_ENABLED=true
OUTBOX_BATCH_SIZE=100
```



---



# 11\. 当前 API



```HTTP
GET /api/v1/health
POST /api/v1/outbox-worker/publish-batch
```



手动触发：



```Bash
curl -X POST http://localhost:3099/api/v1/outbox-worker/publish-batch \
  -H "content-type: application/json" \
  -H "x-internal-api-key: dev-internal-key" \
  -d '{"limit":100}'
```



返回：



```JSON
{
  "skipped": false,
  "published": 12,
  "duration_ms": 48
}
```



---



# 12\. 需要补强的生产能力



当前第一版是可运行骨架，后续继续补：



```Plain Text
RabbitMQEventBus
KafkaEventBus
RedisStreamEventBus
事件 schema registry
发布前 payload 校验
死信表 dead_letter_events
Prometheus 指标
分布式锁，防止多 worker 重复扫描
按 eventType 限流
按服务分片扫描
traceId 透传
```



---



# 13\. 下一步建议



继续写：



```Plain Text
RabbitMQEventBus Adapter
```



把当前 `NoopEventBus` 替换为真实 RabbitMQ 发布器：



```Plain Text
eventType -> exchange routingKey
payload -> JSON message
headers -> event_id / trace_id / occurred_at
publisher confirm
失败抛错交给 outbox retry
```



