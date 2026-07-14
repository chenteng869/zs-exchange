-- ============================================================================
-- FJN Region 域（三级地区 + 限制 + IP Geo） - migration
--
-- 福建老酒 369 全球生态系统 - 工业级实现
-- 遵循 H015 + H018 规范
-- ============================================================================

-- ============================================================
-- 19.1 Region 树（country / province / city / district）
-- ============================================================
CREATE TABLE "fjn_regions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "regionCode" VARCHAR(64) NOT NULL,
    "regionName" VARCHAR(128) NOT NULL,
    "level" VARCHAR(16) NOT NULL,
    "parentId" UUID,
    "countryCode" CHAR(2) NOT NULL,
    "subdivisionCode" VARCHAR(8),
    "locale" VARCHAR(8),
    "timezone" VARCHAR(64),
    "latitude" DECIMAL(10,6),
    "longitude" DECIMAL(10,6),
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_regions_pkey" PRIMARY KEY ("id")
);

-- Unique
CREATE UNIQUE INDEX "fjn_regions_regionCode_key" ON "fjn_regions"("regionCode");

-- Indexes
CREATE INDEX "fjn_regions_level_idx" ON "fjn_regions"("level");
CREATE INDEX "fjn_regions_parentId_idx" ON "fjn_regions"("parentId");
CREATE INDEX "fjn_regions_countryCode_idx" ON "fjn_regions"("countryCode");
CREATE INDEX "fjn_regions_status_idx" ON "fjn_regions"("status");
CREATE INDEX "fjn_regions_countryCode_level_idx" ON "fjn_regions"("countryCode", "level");

-- Self-referencing FK
ALTER TABLE "fjn_regions"
    ADD CONSTRAINT "fjn_regions_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "fjn_regions"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ============================================================
-- 19.2 Region 限制（限售 / KYC 升级 / 风控 / 合规 / 白名单）
-- ============================================================
CREATE TABLE "fjn_region_restrictions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "regionId" UUID NOT NULL,
    "restrictionType" VARCHAR(32) NOT NULL,
    "restrictionSource" VARCHAR(16) NOT NULL DEFAULT 'internal',
    "reason" TEXT,
    "refNo" VARCHAR(64),
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "validFrom" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ,
    "metadata" JSONB,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_region_restrictions_pkey" PRIMARY KEY ("id")
);

-- Unique: regionId + restrictionType
CREATE UNIQUE INDEX "fjn_region_restrictions_regionId_restrictionType_key"
    ON "fjn_region_restrictions"("regionId", "restrictionType");

-- Indexes
CREATE INDEX "fjn_region_restrictions_restrictionType_idx"
    ON "fjn_region_restrictions"("restrictionType");
CREATE INDEX "fjn_region_restrictions_status_idx"
    ON "fjn_region_restrictions"("status");
CREATE INDEX "fjn_region_restrictions_expiresAt_idx"
    ON "fjn_region_restrictions"("expiresAt");
CREATE INDEX "fjn_region_restrictions_regionId_status_idx"
    ON "fjn_region_restrictions"("regionId", "status");

-- FK to fjn_regions (cascade)
ALTER TABLE "fjn_region_restrictions"
    ADD CONSTRAINT "fjn_region_restrictions_regionId_fkey"
    FOREIGN KEY ("regionId") REFERENCES "fjn_regions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- 19.3 IP 段→地区映射（IP Geo）
-- ============================================================
CREATE TABLE "fjn_ip_geo_ranges" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ipVersion" VARCHAR(8) NOT NULL DEFAULT 'ipv4',
    "ipRangeStart" VARCHAR(64) NOT NULL,
    "ipRangeEnd" VARCHAR(64) NOT NULL,
    "ipStartNum" BIGINT NOT NULL,
    "ipEndNum" BIGINT NOT NULL,
    "regionId" UUID NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "provinceCode" VARCHAR(8),
    "cityCode" VARCHAR(64),
    "isp" VARCHAR(64),
    "connectionType" VARCHAR(16),
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "source" VARCHAR(16) NOT NULL DEFAULT 'internal',
    "confidence" INTEGER NOT NULL DEFAULT 100,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_ip_geo_ranges_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "fjn_ip_geo_ranges_ipVersion_idx"
    ON "fjn_ip_geo_ranges"("ipVersion");
CREATE INDEX "fjn_ip_geo_ranges_ipStartNum_ipEndNum_idx"
    ON "fjn_ip_geo_ranges"("ipStartNum", "ipEndNum");
CREATE INDEX "fjn_ip_geo_ranges_regionId_idx"
    ON "fjn_ip_geo_ranges"("regionId");
CREATE INDEX "fjn_ip_geo_ranges_countryCode_idx"
    ON "fjn_ip_geo_ranges"("countryCode");
CREATE INDEX "fjn_ip_geo_ranges_status_idx"
    ON "fjn_ip_geo_ranges"("status");

-- FK to fjn_regions (cascade)
ALTER TABLE "fjn_ip_geo_ranges"
    ADD CONSTRAINT "fjn_ip_geo_ranges_regionId_fkey"
    FOREIGN KEY ("regionId") REFERENCES "fjn_regions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
