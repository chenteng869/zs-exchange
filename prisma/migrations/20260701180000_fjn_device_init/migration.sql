-- FJN Device Service 数据库迁移
-- 生成时间: 2026-07-01
-- 包含: fjn_device_fingerprints / fjn_user_devices / fjn_device_trust_logs
--         fjn_device_blacklists / fjn_device_risk_assessments / fjn_device_challenges
-- 前置: uuid-ossp 扩展已创建（见 20260701094123_fjn_region_init）

-- CreateTable
CREATE TABLE "fjn_device_fingerprints" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "fingerprint" VARCHAR(255) NOT NULL,
    "userAgent" VARCHAR(512),
    "deviceType" VARCHAR(32),
    "osVersion" VARCHAR(64),
    "browserVersion" VARCHAR(64),
    "screenResolution" VARCHAR(32),
    "timezone" VARCHAR(64),
    "language" VARCHAR(16),
    "ipAddress" VARCHAR(64),
    "countryCode" CHAR(2),
    "riskLevel" VARCHAR(16) NOT NULL DEFAULT 'low',
    "firstSeenAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitCount" INTEGER NOT NULL DEFAULT 1,
    "userId" UUID,

    CONSTRAINT "fjn_device_fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_user_devices" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "fingerprintId" UUID NOT NULL,
    "deviceName" VARCHAR(100),
    "deviceType" VARCHAR(16),
    "status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "boundAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "boundIpAddress" VARCHAR(64),
    "boundCountryCode" CHAR(2),
    "lastIpAddress" VARCHAR(64),
    "lastCountryCode" CHAR(2),
    "lastCityCode" VARCHAR(64),
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" VARCHAR(16) NOT NULL DEFAULT 'low',
    "visitCount" INTEGER NOT NULL DEFAULT 1,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_device_trust_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userDeviceId" UUID NOT NULL,
    "trustAction" VARCHAR(16) NOT NULL,
    "fromStatus" VARCHAR(16),
    "toStatus" VARCHAR(16),
    "reason" TEXT,
    "riskScore" INTEGER,
    "operatorId" UUID,
    "operatorType" VARCHAR(16) NOT NULL DEFAULT 'admin',
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_device_trust_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_device_blacklists" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "fingerprint" VARCHAR(255) NOT NULL,
    "reason" VARCHAR(32) NOT NULL,
    "blacklistSource" VARCHAR(16) NOT NULL DEFAULT 'internal',
    "refNo" VARCHAR(64),
    "description" TEXT,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "addedBy" UUID,
    "validFrom" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_device_blacklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_device_risk_assessments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userDeviceId" UUID,
    "userId" UUID,
    "fingerprint" VARCHAR(255) NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "riskLevel" VARCHAR(16) NOT NULL,
    "factors" TEXT[],
    "action" VARCHAR(16) NOT NULL DEFAULT 'none',
    "status" VARCHAR(16) NOT NULL DEFAULT 'scored',
    "kycLevel" VARCHAR(16),
    "ipAddress" VARCHAR(64),
    "countryCode" CHAR(2),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_device_risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_device_challenges" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userDeviceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "challengeType" VARCHAR(32) NOT NULL,
    "trigger" VARCHAR(32) NOT NULL,
    "target" VARCHAR(255) NOT NULL,
    "codeHash" VARCHAR(255),
    "status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "verifiedAt" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_device_challenges_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE INDEX "fjn_device_blacklists_blacklistSource_idx" ON "fjn_device_blacklists"("blacklistSource");
CREATE INDEX "fjn_device_blacklists_expiresAt_idx" ON "fjn_device_blacklists"("expiresAt");
CREATE INDEX "fjn_device_blacklists_reason_idx" ON "fjn_device_blacklists"("reason");
CREATE INDEX "fjn_device_blacklists_status_idx" ON "fjn_device_blacklists"("status");
CREATE INDEX "fjn_device_challenges_expiresAt_idx" ON "fjn_device_challenges"("expiresAt");
CREATE INDEX "fjn_device_challenges_status_idx" ON "fjn_device_challenges"("status");
CREATE INDEX "fjn_device_challenges_userDeviceId_idx" ON "fjn_device_challenges"("userDeviceId");
CREATE INDEX "fjn_device_challenges_userId_idx" ON "fjn_device_challenges"("userId");
CREATE INDEX "fjn_device_challenges_userId_status_idx" ON "fjn_device_challenges"("userId", "status");
CREATE INDEX "fjn_device_fingerprints_riskLevel_idx" ON "fjn_device_fingerprints"("riskLevel");
CREATE INDEX "fjn_device_fingerprints_userId_idx" ON "fjn_device_fingerprints"("userId");
CREATE INDEX "fjn_device_risk_assessments_createdAt_idx" ON "fjn_device_risk_assessments"("createdAt");
CREATE INDEX "fjn_device_risk_assessments_fingerprint_idx" ON "fjn_device_risk_assessments"("fingerprint");
CREATE INDEX "fjn_device_risk_assessments_riskLevel_idx" ON "fjn_device_risk_assessments"("riskLevel");
CREATE INDEX "fjn_device_risk_assessments_status_idx" ON "fjn_device_risk_assessments"("status");
CREATE INDEX "fjn_device_risk_assessments_userDeviceId_idx" ON "fjn_device_risk_assessments"("userDeviceId");
CREATE INDEX "fjn_device_risk_assessments_userId_idx" ON "fjn_device_risk_assessments"("userId");
CREATE INDEX "fjn_device_trust_logs_createdAt_idx" ON "fjn_device_trust_logs"("createdAt");
CREATE INDEX "fjn_device_trust_logs_trustAction_idx" ON "fjn_device_trust_logs"("trustAction");
CREATE INDEX "fjn_device_trust_logs_userDeviceId_idx" ON "fjn_device_trust_logs"("userDeviceId");
CREATE INDEX "fjn_user_devices_fingerprintId_idx" ON "fjn_user_devices"("fingerprintId");
CREATE INDEX "fjn_user_devices_lastActiveAt_idx" ON "fjn_user_devices"("lastActiveAt");
CREATE INDEX "fjn_user_devices_riskLevel_idx" ON "fjn_user_devices"("riskLevel");
CREATE INDEX "fjn_user_devices_status_idx" ON "fjn_user_devices"("status");
CREATE INDEX "fjn_user_devices_userId_idx" ON "fjn_user_devices"("userId");
CREATE INDEX "fjn_user_devices_userId_status_idx" ON "fjn_user_devices"("userId", "status");
CREATE UNIQUE INDEX "fjn_device_blacklists_fingerprint_key" ON "fjn_device_blacklists"("fingerprint");
CREATE UNIQUE INDEX "fjn_device_fingerprints_fingerprint_key" ON "fjn_device_fingerprints"("fingerprint");
CREATE UNIQUE INDEX "fjn_user_devices_userId_fingerprintId_key" ON "fjn_user_devices"("userId", "fingerprintId");

-- AddForeignKey
ALTER TABLE "fjn_user_devices" ADD CONSTRAINT "fjn_user_devices_fingerprintId_fkey" FOREIGN KEY ("fingerprintId") REFERENCES "fjn_device_fingerprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fjn_device_trust_logs" ADD CONSTRAINT "fjn_device_trust_logs_userDeviceId_fkey" FOREIGN KEY ("userDeviceId") REFERENCES "fjn_user_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fjn_device_risk_assessments" ADD CONSTRAINT "fjn_device_risk_assessments_userDeviceId_fkey" FOREIGN KEY ("userDeviceId") REFERENCES "fjn_user_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fjn_device_challenges" ADD CONSTRAINT "fjn_device_challenges_userDeviceId_fkey" FOREIGN KEY ("userDeviceId") REFERENCES "fjn_user_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
