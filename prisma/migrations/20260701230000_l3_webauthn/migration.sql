-- L-3: WebAuthn / FIDO2 表
-- 表: fjn_webauthn_credentials / fjn_webauthn_challenges

CREATE TABLE IF NOT EXISTS "fjn_webauthn_credentials" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "credentialId" VARCHAR(512) NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "credentialType" VARCHAR(32) NOT NULL DEFAULT 'public-key',
    "transports" TEXT[],
    "aaguid" VARCHAR(64),
    "fmt" VARCHAR(32),
    "deviceName" VARCHAR(100),
    "deviceType" VARCHAR(16),
    "backupEligible" BOOLEAN NOT NULL DEFAULT false,
    "backupState" BOOLEAN NOT NULL DEFAULT false,
    "userVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMPTZ,
    "registeredAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fjn_webauthn_credentials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "fjn_webauthn_credentials_credentialId_key"
    ON "fjn_webauthn_credentials"("credentialId");
CREATE INDEX IF NOT EXISTS "fjn_webauthn_credentials_userId_idx"
    ON "fjn_webauthn_credentials"("userId");
CREATE INDEX IF NOT EXISTS "fjn_webauthn_credentials_aaguid_idx"
    ON "fjn_webauthn_credentials"("aaguid");
CREATE INDEX IF NOT EXISTS "fjn_webauthn_credentials_revokedAt_idx"
    ON "fjn_webauthn_credentials"("revokedAt");
CREATE INDEX IF NOT EXISTS "fjn_webauthn_credentials_userId_revokedAt_idx"
    ON "fjn_webauthn_credentials"("userId", "revokedAt");

CREATE TABLE IF NOT EXISTS "fjn_webauthn_challenges" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID,
    "challenge" VARCHAR(255) NOT NULL,
    "type" VARCHAR(16) NOT NULL,
    "sessionId" VARCHAR(128),
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "usedAt" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fjn_webauthn_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "fjn_webauthn_challenges_challenge_key"
    ON "fjn_webauthn_challenges"("challenge");
CREATE INDEX IF NOT EXISTS "fjn_webauthn_challenges_userId_idx"
    ON "fjn_webauthn_challenges"("userId");
CREATE INDEX IF NOT EXISTS "fjn_webauthn_challenges_type_idx"
    ON "fjn_webauthn_challenges"("type");
CREATE INDEX IF NOT EXISTS "fjn_webauthn_challenges_expiresAt_idx"
    ON "fjn_webauthn_challenges"("expiresAt");
CREATE INDEX IF NOT EXISTS "fjn_webauthn_challenges_usedAt_idx"
    ON "fjn_webauthn_challenges"("usedAt");
