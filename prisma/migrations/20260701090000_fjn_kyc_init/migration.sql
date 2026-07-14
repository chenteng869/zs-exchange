-- 福建老酒 369 - 阶段I KYC 增量迁移
-- 表: fjn_user_kyc, fjn_user_kyb, fjn_kyc_review_logs
-- 遵循 H018 规范

-- CreateTable fjn_user_kyc
CREATE TABLE "fjn_user_kyc" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "kycLevel" VARCHAR(32) NOT NULL DEFAULT 'standard',
    "kycStatus" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "provider" VARCHAR(64),
    "documentType" VARCHAR(32) NOT NULL,
    "documentCountry" CHAR(2) NOT NULL,
    "documentNumberHash" VARCHAR(255),
    "documentFrontUrl" VARCHAR(512),
    "documentBackUrl" VARCHAR(512),
    "selfieUrl" VARCHAR(512),
    "reviewerId" UUID,
    "reviewNote" TEXT,
    "riskStatus" VARCHAR(16) NOT NULL DEFAULT 'normal',
    "expiresAt" TIMESTAMPTZ,
    "submittedAt" TIMESTAMPTZ,
    "approvedAt" TIMESTAMPTZ,
    "rejectedAt" TIMESTAMPTZ,
    "expiredAt" TIMESTAMPTZ,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_user_kyc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex fjn_user_kyc
CREATE INDEX "fjn_user_kyc_userId_idx" ON "fjn_user_kyc"("userId");
CREATE INDEX "fjn_user_kyc_kycStatus_idx" ON "fjn_user_kyc"("kycStatus");
CREATE INDEX "fjn_user_kyc_documentCountry_idx" ON "fjn_user_kyc"("documentCountry");
CREATE INDEX "fjn_user_kyc_reviewerId_idx" ON "fjn_user_kyc"("reviewerId");
CREATE INDEX "fjn_user_kyc_kycLevel_idx" ON "fjn_user_kyc"("kycLevel");

-- CreateTable fjn_user_kyb
CREATE TABLE "fjn_user_kyb" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "companyName" VARCHAR(255) NOT NULL,
    "registrationNumberHash" VARCHAR(255),
    "registrationCountry" CHAR(2) NOT NULL,
    "companyAddress" TEXT,
    "beneficialOwnerInfo" JSONB,
    "businessLicenseUrl" VARCHAR(512),
    "taxInfo" JSONB,
    "kybStatus" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "provider" VARCHAR(64),
    "reviewerId" UUID,
    "reviewNote" TEXT,
    "riskStatus" VARCHAR(16) NOT NULL DEFAULT 'normal',
    "expiresAt" TIMESTAMPTZ,
    "submittedAt" TIMESTAMPTZ,
    "approvedAt" TIMESTAMPTZ,
    "rejectedAt" TIMESTAMPTZ,
    "expiredAt" TIMESTAMPTZ,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_user_kyb_pkey" PRIMARY KEY ("id")
);

-- CreateIndex fjn_user_kyb
CREATE INDEX "fjn_user_kyb_userId_idx" ON "fjn_user_kyb"("userId");
CREATE INDEX "fjn_user_kyb_kybStatus_idx" ON "fjn_user_kyb"("kybStatus");
CREATE INDEX "fjn_user_kyb_registrationCountry_idx" ON "fjn_user_kyb"("registrationCountry");
CREATE INDEX "fjn_user_kyb_reviewerId_idx" ON "fjn_user_kyb"("reviewerId");

-- CreateTable fjn_kyc_review_logs
CREATE TABLE "fjn_kyc_review_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "targetType" VARCHAR(16) NOT NULL,
    "targetId" UUID NOT NULL,
    "fromStatus" VARCHAR(32),
    "toStatus" VARCHAR(32) NOT NULL,
    "reviewerId" UUID,
    "reviewNote" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_kyc_review_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex fjn_kyc_review_logs
CREATE INDEX "fjn_kyc_review_logs_targetType_targetId_idx" ON "fjn_kyc_review_logs"("targetType", "targetId");
CREATE INDEX "fjn_kyc_review_logs_reviewerId_idx" ON "fjn_kyc_review_logs"("reviewerId");
CREATE INDEX "fjn_kyc_review_logs_createdAt_idx" ON "fjn_kyc_review_logs"("createdAt");
