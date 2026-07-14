-- CreateTable
-- OutboxEvent 模型在 schema.prisma 中已存在多时，但从未生成过对应迁移，
-- 导致真实数据库中 outbox_events 表实际不存在（所有 FJN Service 的 emitEvent 写入均会失败）。
-- 本迁移补齐该表，字段与 schema.prisma 中的 OutboxEvent 模型保持一致。
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "eventType" VARCHAR(128) NOT NULL,
    "aggregateType" VARCHAR(64),
    "aggregateId" UUID,
    "businessType" VARCHAR(64),
    "businessId" UUID,
    "userId" UUID,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 5,
    "lastError" TEXT,
    "dispatchedAt" TIMESTAMPTZ,
    "nextAttemptAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outbox_events_eventType_idx" ON "outbox_events"("eventType");

-- CreateIndex
CREATE INDEX "outbox_events_status_idx" ON "outbox_events"("status");

-- CreateIndex
CREATE INDEX "outbox_events_businessType_businessId_idx" ON "outbox_events"("businessType", "businessId");

-- CreateIndex
CREATE INDEX "outbox_events_aggregateType_aggregateId_idx" ON "outbox_events"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "outbox_events_userId_idx" ON "outbox_events"("userId");

-- CreateIndex
CREATE INDEX "outbox_events_createdAt_idx" ON "outbox_events"("createdAt");

-- CreateIndex
CREATE INDEX "outbox_events_status_nextAttemptAt_idx" ON "outbox_events"("status", "nextAttemptAt");
