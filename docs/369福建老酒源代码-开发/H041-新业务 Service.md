# H041\-新业务 Service

还需要写的不是新业务 Service，而是把这套系统从“业务骨架”补成“可运行、可测试、可上线”的工程底座。



**优先级最高**

- `Outbox Worker`：扫描 `outbox_events`，发布到 Kafka/RabbitMQ/Redis Stream，失败重试和死信。

- `Database Migrations`：把 23 个服务的 Prisma models 合并、生成 migration、处理索引和唯一约束冲突。

- `Service Bootstrap`：统一每个服务的 `main.ts`、`app.module.ts`、`PlatformModule` 接入。

- `Prisma 注入改造`：把所有 `new PrismaClient()` 改成 `PrismaService` DI。

- `统一异常替换`：把 `throw new Error(...)` 改成 `AppException(code, message, status)`。

    

**第二优先级**

- `Event Consumers`：消费 `order.paid.v1`、`payment.succeeded.v1` 等事件，打通订单→支付→分账→积分→奖励。

- `Idempotency`：关键写接口接入 `Idempotency-Key`，防重复下单、重复发奖、重复分账。

- `Auth/Admin Guard`：后台接口必须挂权限；内部服务接口挂 `InternalApiKeyGuard`。

- `Audit Interceptor`：关键写操作自动写审计日志。

- `E2E Tests`：至少覆盖 369 酒订单主链路。

    

**第三优先级**

- `Docker Compose`：Postgres、Redis、消息队列、所有服务一键启动。

- `Observability`：结构化日志、Trace ID、Prometheus metrics、健康检查。

- `CI Pipeline`：lint、typecheck、test、migration check、Docker build。

- `API Docs`：Swagger/OpenAPI 聚合。

- `Seed Data`：初始化产品、规则、财务账户、税务规则、审批策略。

    

如果继续写，我建议下一步直接写：`Outbox Worker Service`，这是让前面所有 outbox 事件真正运转起来的关键。

