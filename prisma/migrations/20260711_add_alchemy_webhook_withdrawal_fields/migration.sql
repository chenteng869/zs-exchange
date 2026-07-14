-- Migration: add Alchemy Webhook fields to WalletWithdrawal
-- 2026-07-11: 修复 Alchemy 5 类 Webhook 集成时的字段缺失
-- Bug 暴露: GET /api/v1/wallet/withdrawals → 500 (column minedAt does not exist)

ALTER TABLE "WalletWithdrawal"
  ADD COLUMN IF NOT EXISTS "minedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "dropReason" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "droppedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "retryCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastRetryAt" TIMESTAMPTZ;

-- 索引：加速 retry 查询
CREATE INDEX IF NOT EXISTS "WalletWithdrawal_status_idx" ON "WalletWithdrawal"("status");
CREATE INDEX IF NOT EXISTS "WalletWithdrawal_droppedAt_idx" ON "WalletWithdrawal"("droppedAt");
