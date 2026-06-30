# H043\-RabbitMQEventBus Adapter

# RabbitMQEventBus Adapter



这一版把 `NoopEventBus` 替换成真实 RabbitMQ 发布器，负责：



```Plain Text
连接 RabbitMQ
声明 exchange
按 eventType 作为 routingKey 发布
JSON 序列化 payload
携带标准 headers
publisher confirm
失败抛错给 Outbox Worker 重试
```



---



# 1\. 安装依赖



```Bash
pnpm add amqplib
pnpm add -D @types/amqplib
```



---



# 2\. 环境变量



`.env`



```Plain Text
EVENT_BUS_DRIVER=rabbitmq

RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=domain.events
RABBITMQ_EXCHANGE_TYPE=topic
RABBITMQ_PERSISTENT=true
```



---



# 3\. RabbitMQ EventBus



`libs/platform/src/events/rabbitmq-event-bus.ts`



```TypeScript
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { ChannelWrapper } from 'amqplib';
import { EventBus } from './event-bus';

type ConfirmChannel = amqp.ConfirmChannel;
type Connection = amqp.Connection;

@Injectable()
export class RabbitMQEventBus
  implements EventBus, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RabbitMQEventBus.name);
  private connection?: Connection;
  private channel?: ConfirmChannel;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }

  async publish(eventType: string, payload: unknown): Promise {
    if (!this.channel) {
      await this.connect();
    }

    const exchange = this.config.get('RABBITMQ_EXCHANGE') || 'domain.events';
    const persistent = this.config.get('RABBITMQ_PERSISTENT') !== 'false';

    const body = Buffer.from(
      JSON.stringify({
        event_type: eventType,
        payload,
        occurred_at: new Date().toISOString()
      })
    );

    await new Promise((resolve, reject) => {
      this.channel!.publish(
        exchange,
        eventType,
        body,
        {
          contentType: 'application/json',
          deliveryMode: persistent ? 2 : 1,
          timestamp: Math.floor(Date.now() / 1000),
          headers: {
            event_type: eventType,
            occurred_at: new Date().toISOString()
          }
        },
        (error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        }
      );
    });
  }

  private async connect() {
    const url = this.config.get('RABBITMQ_URL');
    const exchange = this.config.get('RABBITMQ_EXCHANGE') || 'domain.events';
    const exchangeType =
      this.config.get('RABBITMQ_EXCHANGE_TYPE') || 'topic';

    if (!url) {
      throw new Error('RABBITMQ_URL is required');
    }

    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createConfirmChannel();

    await this.channel.assertExchange(exchange, exchangeType, {
      durable: true
    });

    this.connection.on('error', (error) => {
      this.logger.error(`RabbitMQ connection error: ${error.message}`);
    });

    this.connection.on('close', () => {
      this.logger.warn('RabbitMQ connection closed');
      this.connection = undefined;
      this.channel = undefined;
    });

    this.logger.log(`RabbitMQ connected exchange=${exchange}`);
  }
}
```



> 注意：不要引入 `ChannelWrapper`，那是 `amqp-connection-manager` 的类型，不属于 `amqplib`。如果你复制时看到 `ChannelWrapper`，删掉。
> 
> 



修正版 import 应该是：



```TypeScript
import amqp from 'amqplib';
```



---



# 4\. EventsModule 支持 driver 切换



替换 `libs/platform/src/events/events.module.ts`



```TypeScript
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EVENT_BUS } from './event-bus';
import { NoopEventBus } from './noop-event-bus';
import { RabbitMQEventBus } from './rabbitmq-event-bus';

@Global()
@Module({
  providers: [
    NoopEventBus,
    RabbitMQEventBus,
    {
      provide: EVENT_BUS,
      inject: [ConfigService, NoopEventBus, RabbitMQEventBus],
      useFactory: (
        config: ConfigService,
        noop: NoopEventBus,
        rabbitmq: RabbitMQEventBus
      ) => {
        const driver = config.get('EVENT_BUS_DRIVER') || 'noop';

        if (driver === 'rabbitmq') {
          return rabbitmq;
        }

        return noop;
      }
    }
  ],
  exports: [EVENT_BUS]
})
export class EventsModule {}
```



---



# 5\. 修正 env schema



`libs/platform/src/config/env.schema.ts`



补充：



```TypeScript
EVENT_BUS_DRIVER: Joi.string()
  .valid('noop', 'rabbitmq')
  .default('noop'),

RABBITMQ_URL: Joi.string().optional(),
RABBITMQ_EXCHANGE: Joi.string().default('domain.events'),
RABBITMQ_EXCHANGE_TYPE: Joi.string().valid('topic', 'direct', 'fanout').default('topic'),
RABBITMQ_PERSISTENT: Joi.string().valid('true', 'false').default('true'),
```



完整版本：



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

  SERVICE_NAME: Joi.string().required(),

  EVENT_BUS_DRIVER: Joi.string()
    .valid('noop', 'rabbitmq')
    .default('noop'),

  RABBITMQ_URL: Joi.string().optional(),

  RABBITMQ_EXCHANGE: Joi.string().default('domain.events'),

  RABBITMQ_EXCHANGE_TYPE: Joi.string()
    .valid('topic', 'direct', 'fanout')
    .default('topic'),

  RABBITMQ_PERSISTENT: Joi.string()
    .valid('true', 'false')
    .default('true')
});
```



---



# 6\. RabbitMQ Docker Compose



`docker-compose.rabbitmq.yml`



```YAML
services:
  rabbitmq:
    image: rabbitmq:3.13-management
    container_name: platform-rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  rabbitmq_data:
```



启动：



```Bash
docker compose -f docker-compose.rabbitmq.yml up -d
```



管理后台：



```Plain Text
http://localhost:15672
guest / guest
```



---



# 7\. 建议绑定 Queue



RabbitMQ 使用 topic exchange，事件名天然适合 routing key。



示例：



```Bash
# exchange: domain.events
# routing key: order.paid.v1
# queue: revenue-service.order-paid
```



推荐规则：



```Plain Text
exchange: domain.events
routingKey: eventType

queue: {consumer-service}.{event-name}
binding:
  order.paid.v1 -> revenue-service.order-paid
  order.paid.v1 -> points-service.order-paid
  payment.succeeded.v1 -> order-service.payment-succeeded
  release.claimed.v1 -> finance-service.release-claimed
```



---



# 8\. 发布消息格式



RabbitMQ body：



```JSON
{
  "event_type": "order.paid.v1",
  "payload": {
    "order_id": "xxx",
    "user_id": "u_001",
    "amount": "369.000000000000000000"
  },
  "occurred_at": "2026-06-30T12:00:00.000Z"
}
```



headers：



```JSON
{
  "event_type": "order.paid.v1",
  "occurred_at": "2026-06-30T12:00:00.000Z"
}
```



---



# 9\. Outbox Worker 使用方式



`.env`：



```Plain Text
SERVICE_NAME=outbox-worker
PORT=3099
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app

EVENT_BUS_DRIVER=rabbitmq
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=domain.events
RABBITMQ_EXCHANGE_TYPE=topic
RABBITMQ_PERSISTENT=true

OUTBOX_WORKER_ENABLED=true
OUTBOX_BATCH_SIZE=100
```



手动触发：



```Bash
curl -X POST http://localhost:3099/api/v1/outbox-worker/publish-batch \
  -H "content-type: application/json" \
  -H "x-internal-api-key: dev-internal-key" \
  -d '{"limit":50}'
```



---



# 10\. 一个关键修正：事件 id



当前 `EventBus.publish(eventType, payload)` 没拿到 outbox event id。



生产上建议改成：



```TypeScript
export interface DomainEventEnvelope {
  event_id: string;
  event_type: string;
  payload: unknown;
  occurred_at: string;
}

export interface EventBus {
  publish(envelope: DomainEventEnvelope): Promise;
}
```



然后 `OutboxPublisherService` 调用：



```TypeScript
await this.eventBus.publish({
  event_id: event.id,
  event_type: event.eventType,
  payload: event.payload,
  occurred_at: event.createdAt.toISOString()
});
```



这样 RabbitMQ message headers 可以带：



```TypeScript
headers: {
  event_id: envelope.event_id,
  event_type: envelope.event_type,
  occurred_at: envelope.occurred_at
}
```



---



# 11\. 下一步建议



继续写：



```Plain Text
Event Consumer Base
```



也就是所有业务服务共用的 RabbitMQ 消费基座：



```Plain Text
RabbitMQConsumer
@EventHandler('order.paid.v1')
自动 ack / nack
失败重试
幂等消费
死信队列
消费日志
traceId 透传
```



有了它之后，就能开始写真正的事件链路：



```Plain Text
order.paid.v1
  -> revenue-service 分账
  -> points-service 发 cFJ369
  -> referral-service 生成推荐奖
  -> team-reward-service 生成团队奖
  -> node-service 生成节点奖
  -> finance-service 入账
```



