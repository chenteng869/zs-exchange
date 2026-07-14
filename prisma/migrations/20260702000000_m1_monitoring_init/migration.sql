-- M 阶段 - 监控告警 数据库迁移
-- 生成时间: 2026-07-01
-- 包含: fjn_security_alerts / fjn_mfa_failure_records / fjn_alert_configs
-- 前置: uuid-ossp 扩展已创建（见 20260701094123_fjn_region_init）

-- CreateTable
CREATE TABLE "fjn_security_alerts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "signature" VARCHAR(64) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "severity" VARCHAR(16) NOT NULL,
    "severityLevel" INTEGER NOT NULL DEFAULT 1,
    "userId" UUID,
    "resourceId" VARCHAR(128),
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "traceId" VARCHAR(64),
    "source" VARCHAR(64) NOT NULL DEFAULT 'stock-exchange-dapp',
    "environment" VARCHAR(32) NOT NULL DEFAULT 'development',
    "deliveredToSiem" BOOLEAN NOT NULL DEFAULT false,
    "siemDeliveredAt" TIMESTAMPTZ,
    "deliveryStatus" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" UUID,
    "acknowledgedAt" TIMESTAMPTZ,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMPTZ,
    "resolvedBy" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_security_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_mfa_failure_records" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID,
    "failureType" VARCHAR(32) NOT NULL,
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_mfa_failure_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_alert_configs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "alertType" VARCHAR(32) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "minSeverity" VARCHAR(16) NOT NULL DEFAULT 'medium',
    "thresholdCount" INTEGER NOT NULL DEFAULT 1,
    "thresholdWindow" INTEGER NOT NULL DEFAULT 60,
    "channels" TEXT[] DEFAULT ARRAY['database', 'console']::TEXT[],
    "dedupWindowSec" INTEGER NOT NULL DEFAULT 300,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_alert_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fjn_security_alerts_type_idx" ON "fjn_security_alerts"("type");
CREATE INDEX "fjn_security_alerts_severity_idx" ON "fjn_security_alerts"("severity");
CREATE INDEX "fjn_security_alerts_userId_idx" ON "fjn_security_alerts"("userId");
CREATE INDEX "fjn_security_alerts_createdAt_idx" ON "fjn_security_alerts"("createdAt");
CREATE INDEX "fjn_security_alerts_deliveryStatus_idx" ON "fjn_security_alerts"("deliveryStatus");
CREATE INDEX "fjn_security_alerts_acknowledged_idx" ON "fjn_security_alerts"("acknowledged");
CREATE INDEX "fjn_security_alerts_type_createdAt_idx" ON "fjn_security_alerts"("type", "createdAt");
CREATE INDEX "fjn_security_alerts_severity_createdAt_idx" ON "fjn_security_alerts"("severity", "createdAt");
CREATE INDEX "fjn_security_alerts_userId_createdAt_idx" ON "fjn_security_alerts"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "fjn_mfa_failure_records_userId_idx" ON "fjn_mfa_failure_records"("userId");
CREATE INDEX "fjn_mfa_failure_records_failureType_idx" ON "fjn_mfa_failure_records"("failureType");
CREATE INDEX "fjn_mfa_failure_records_createdAt_idx" ON "fjn_mfa_failure_records"("createdAt");
CREATE INDEX "fjn_mfa_failure_records_userId_createdAt_idx" ON "fjn_mfa_failure_records"("userId", "createdAt");
CREATE INDEX "fjn_mfa_failure_records_failureType_createdAt_idx" ON "fjn_mfa_failure_records"("failureType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_alert_configs_alertType_key" ON "fjn_alert_configs"("alertType");
CREATE INDEX "fjn_alert_configs_enabled_idx" ON "fjn_alert_configs"("enabled");

-- 默认告警配置
INSERT INTO "fjn_alert_configs" ("id", "alertType", "enabled", "minSeverity", "thresholdCount", "thresholdWindow", "channels", "dedupWindowSec", "description", "createdAt", "updatedAt")
VALUES
    (uuid_generate_v4(), 'replay_attack', true, 'high', 1, 0, ARRAY['database', 'siem_webhook', 'console'], 300, 'Refresh Token 重放检测告警', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'abnormal_rotation', true, 'high', 1, 60, ARRAY['database', 'siem_webhook', 'console'], 300, '异常旋转检测告警（>= 5次/60s）', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'mfa_failure_rate', true, 'high', 10, 300, ARRAY['database', 'siem_webhook', 'console'], 300, 'MFA 失败率告警（>= 10次/5min）', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'mfa_locked', true, 'medium', 1, 0, ARRAY['database', 'console'], 60, 'MFA 锁定告警', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'session_revoked', true, 'medium', 1, 0, ARRAY['database', 'console'], 60, 'Session 强制吊告知警', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'device_blacklist', true, 'high', 1, 0, ARRAY['database', 'siem_webhook', 'console'], 300, '设备黑名单命中告警', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'webauthn_failed', true, 'medium', 5, 300, ARRAY['database', 'console'], 300, 'WebAuthn 认证失败率告警', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'impossible_travel', true, 'high', 1, 0, ARRAY['database', 'siem_webhook', 'console'], 600, '不可能的旅行告警', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
