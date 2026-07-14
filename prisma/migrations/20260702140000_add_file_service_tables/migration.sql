-- CreateTable
CREATE TABLE "file_objects" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "fileNo" VARCHAR(64) NOT NULL,
    "bucket" VARCHAR(64) NOT NULL,
    "objectKey" VARCHAR(512) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "fileType" VARCHAR(32) NOT NULL,
    "mimeType" VARCHAR(128) NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "checksum" VARCHAR(128),
    "ownerUserId" UUID,
    "businessType" VARCHAR(64),
    "businessId" UUID,
    "sensitivity" VARCHAR(20) NOT NULL DEFAULT 'internal',
    "storageClass" VARCHAR(20) NOT NULL DEFAULT 'standard',
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending_upload',
    "uploadedAt" TIMESTAMPTZ,
    "archivedAt" TIMESTAMPTZ,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_permissions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "fileId" UUID NOT NULL,
    "principalType" VARCHAR(16) NOT NULL,
    "principalId" UUID NOT NULL,
    "permission" VARCHAR(16) NOT NULL,
    "grantedBy" UUID,
    "grantedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',

    CONSTRAINT "file_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_access_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "accessNo" VARCHAR(64) NOT NULL,
    "fileId" UUID NOT NULL,
    "accessorType" VARCHAR(16) NOT NULL,
    "accessorId" UUID,
    "accessAction" VARCHAR(16) NOT NULL,
    "ipAddress" VARCHAR(64),
    "deviceId" VARCHAR(128),
    "result" VARCHAR(16) NOT NULL DEFAULT 'success',
    "reason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_signed_urls" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "signedUrlNo" VARCHAR(64) NOT NULL,
    "fileId" UUID NOT NULL,
    "action" VARCHAR(16) NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdBy" UUID,
    "usedAt" TIMESTAMPTZ,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_signed_urls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_objects_fileNo_key" ON "file_objects"("fileNo");
CREATE INDEX "file_objects_ownerUserId_idx" ON "file_objects"("ownerUserId");
CREATE INDEX "file_objects_businessType_businessId_idx" ON "file_objects"("businessType", "businessId");
CREATE INDEX "file_objects_status_idx" ON "file_objects"("status");
CREATE INDEX "file_objects_sensitivity_idx" ON "file_objects"("sensitivity");

CREATE INDEX "file_permissions_fileId_idx" ON "file_permissions"("fileId");
CREATE INDEX "file_permissions_principalType_principalId_idx" ON "file_permissions"("principalType", "principalId");

CREATE UNIQUE INDEX "file_access_logs_accessNo_key" ON "file_access_logs"("accessNo");
CREATE INDEX "file_access_logs_fileId_idx" ON "file_access_logs"("fileId");
CREATE INDEX "file_access_logs_accessorId_idx" ON "file_access_logs"("accessorId");
CREATE INDEX "file_access_logs_createdAt_idx" ON "file_access_logs"("createdAt");

CREATE UNIQUE INDEX "file_signed_urls_signedUrlNo_key" ON "file_signed_urls"("signedUrlNo");
CREATE INDEX "file_signed_urls_fileId_idx" ON "file_signed_urls"("fileId");
CREATE INDEX "file_signed_urls_status_idx" ON "file_signed_urls"("status");

-- AddForeignKey
ALTER TABLE "file_permissions" ADD CONSTRAINT "file_permissions_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "file_access_logs" ADD CONSTRAINT "file_access_logs_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "file_signed_urls" ADD CONSTRAINT "file_signed_urls_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
