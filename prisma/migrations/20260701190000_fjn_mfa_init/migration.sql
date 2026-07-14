-- FJN MFA Service 数据库迁移
-- 生成时间: 2026-07-01
-- 包含: fjn_user_mfa / fjn_user_mfa_audit_logs
-- 前置: uuid-ossp 扩展已创建

-- CreateTable
CREATE TABLE "fjn_user_mfa" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "secret" VARCHAR(255),
    "enrollSecret" VARCHAR(255),
    "backupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activatedAt" TIMESTAMPTZ,
    "disabledAt" TIMESTAMPTZ,
    "lastUsedAt" TIMESTAMPTZ,
    "lastUsedCounter" BIGINT,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMPTZ,
    "method" VARCHAR(16) NOT NULL DEFAULT 'totp',
    "deviceFingerprint" VARCHAR(255),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_user_mfa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_user_mfa_audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "userMfaId" UUID,
    "action" VARCHAR(32) NOT NULL,
    "method" VARCHAR(16),
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "success" BOOLEAN NOT NULL DEFAULT true,
    "reason" VARCHAR(255),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_user_mfa_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fjn_user_mfa_userId_key" ON "fjn_user_mfa"("userId");

-- CreateIndex
CREATE INDEX "fjn_user_mfa_userId_idx" ON "fjn_user_mfa"("userId");

-- CreateIndex
CREATE INDEX "fjn_user_mfa_status_idx" ON "fjn_user_mfa"("status");

-- CreateIndex
CREATE INDEX "fjn_user_mfa_lockedUntil_idx" ON "fjn_user_mfa"("lockedUntil");

-- CreateIndex
CREATE INDEX "fjn_user_mfa_audit_logs_userId_idx" ON "fjn_user_mfa_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "fjn_user_mfa_audit_logs_userMfaId_idx" ON "fjn_user_mfa_audit_logs"("userMfaId");

-- CreateIndex
CREATE INDEX "fjn_user_mfa_audit_logs_action_idx" ON "fjn_user_mfa_audit_logs"("action");

-- CreateIndex
CREATE INDEX "fjn_user_mfa_audit_logs_createdAt_idx" ON "fjn_user_mfa_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "fjn_user_mfa_audit_logs_userId_createdAt_idx" ON "fjn_user_mfa_audit_logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "fjn_user_mfa_audit_logs" ADD CONSTRAINT "fjn_user_mfa_audit_logs_userMfaId_fkey"
    FOREIGN KEY ("userMfaId") REFERENCES "fjn_user_mfa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
