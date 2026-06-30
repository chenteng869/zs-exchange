ALTER TABLE "CoreSession"
ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS "core_user_dids" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "did" VARCHAR(255) NOT NULL UNIQUE,
  "method" VARCHAR(32) NOT NULL,
  "chainType" VARCHAR(32) NOT NULL DEFAULT 'solana',
  "chainId" VARCHAR(64) NOT NULL DEFAULT 'devnet',
  "publicKey" VARCHAR(255) NOT NULL,
  "keyRef" VARCHAR(255),
  "document" JSONB NOT NULL,
  "anchorStatus" VARCHAR(32) NOT NULL DEFAULT 'pending',
  "anchorTxHash" VARCHAR(255),
  "anchorBlockNo" BIGINT,
  "anchorTimestamp" TIMESTAMPTZ,
  "lastAnchoredAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "core_user_dids_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "CoreUser"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "core_user_dids_userId_idx" ON "core_user_dids"("userId");
CREATE INDEX IF NOT EXISTS "core_user_dids_method_chainType_chainId_idx" ON "core_user_dids"("method", "chainType", "chainId");
CREATE INDEX IF NOT EXISTS "core_user_dids_anchorStatus_idx" ON "core_user_dids"("anchorStatus");
