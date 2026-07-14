-- L-2: 管理员强制 MFA 策略
-- 表: fjn_mfa_policies / fjn_mfa_enforcement_logs

CREATE TABLE IF NOT EXISTS "fjn_mfa_policies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "scope" VARCHAR(16) NOT NULL,
    "userId" UUID,
    "roleName" VARCHAR(32),
    "kycLevel" VARCHAR(16),
    "required" BOOLEAN NOT NULL DEFAULT true,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 7,
    "exemptRoles" TEXT[],
    "enabledBy" UUID,
    "enabledByType" VARCHAR(16) NOT NULL DEFAULT 'admin',
    "reason" VARCHAR(255),
    "metadata" JSONB,
    "enabledAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabledAt" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fjn_mfa_policies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "fjn_mfa_policies_scope_idx" ON "fjn_mfa_policies"("scope");
CREATE INDEX IF NOT EXISTS "fjn_mfa_policies_userId_idx" ON "fjn_mfa_policies"("userId");
CREATE INDEX IF NOT EXISTS "fjn_mfa_policies_roleName_idx" ON "fjn_mfa_policies"("roleName");
CREATE INDEX IF NOT EXISTS "fjn_mfa_policies_kycLevel_idx" ON "fjn_mfa_policies"("kycLevel");
CREATE INDEX IF NOT EXISTS "fjn_mfa_policies_enabledAt_idx" ON "fjn_mfa_policies"("enabledAt");
CREATE INDEX IF NOT EXISTS "fjn_mfa_policies_scope_userId_idx" ON "fjn_mfa_policies"("scope", "userId");
CREATE INDEX IF NOT EXISTS "fjn_mfa_policies_scope_roleName_idx" ON "fjn_mfa_policies"("scope", "roleName");

CREATE TABLE IF NOT EXISTS "fjn_mfa_enforcement_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "policyId" UUID,
    "trigger" VARCHAR(32) NOT NULL,
    "action" VARCHAR(16) NOT NULL,
    "reason" VARCHAR(255),
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fjn_mfa_enforcement_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "fjn_mfa_enforcement_logs_userId_idx" ON "fjn_mfa_enforcement_logs"("userId");
CREATE INDEX IF NOT EXISTS "fjn_mfa_enforcement_logs_policyId_idx" ON "fjn_mfa_enforcement_logs"("policyId");
CREATE INDEX IF NOT EXISTS "fjn_mfa_enforcement_logs_trigger_idx" ON "fjn_mfa_enforcement_logs"("trigger");
CREATE INDEX IF NOT EXISTS "fjn_mfa_enforcement_logs_action_idx" ON "fjn_mfa_enforcement_logs"("action");
CREATE INDEX IF NOT EXISTS "fjn_mfa_enforcement_logs_userId_createdAt_idx" ON "fjn_mfa_enforcement_logs"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "fjn_mfa_enforcement_logs_action_createdAt_idx" ON "fjn_mfa_enforcement_logs"("action", "createdAt" DESC);
