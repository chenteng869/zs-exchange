-- P0-9 Refresh Token Rotation 数据库迁移
-- 生成时间: 2026-07-01
-- 在 CoreSession 表上添加 Refresh Token Rotation 支持字段
-- 注：实际表名为 "CoreSession"（不是 core_sessions）
-- 前置: CoreSession 表已存在

-- AlterTable
ALTER TABLE "CoreSession"
    ADD COLUMN "refreshFamilyId" UUID,
    ADD COLUMN "refreshUsed" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "refreshUsedAt" TIMESTAMPTZ,
    ADD COLUMN "rotatedFromId" UUID,
    ADD COLUMN "rotationCount" INTEGER NOT NULL DEFAULT 0;

-- 数据回填：为现有 session 生成 refreshFamilyId
UPDATE "CoreSession"
SET "refreshFamilyId" = "id"
WHERE "refreshFamilyId" IS NULL;

-- 现有字段不能为 null（family 字段逻辑上必须有值）
ALTER TABLE "CoreSession"
    ALTER COLUMN "refreshFamilyId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "CoreSession_refreshFamilyId_idx" ON "CoreSession"("refreshFamilyId");
CREATE INDEX "CoreSession_refreshUsed_idx" ON "CoreSession"("refreshUsed");
