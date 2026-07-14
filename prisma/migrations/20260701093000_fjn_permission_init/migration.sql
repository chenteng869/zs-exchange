-- 福建老酒 369 - 阶段I Permission 增量迁移
-- 表: fjn_roles, fjn_permissions, fjn_role_permissions, fjn_user_roles, fjn_user_permissions, fjn_access_policies, fjn_access_logs
-- 遵循 RBAC + ABAC 工业级规范

-- CreateTable fjn_roles
CREATE TABLE "fjn_roles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "roleCode" VARCHAR(64) NOT NULL,
    "roleName" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "roleType" VARCHAR(16) NOT NULL DEFAULT 'admin',
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "parentId" UUID,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_roles_pkey" PRIMARY KEY ("id")
);

-- Unique: roleCode
CREATE UNIQUE INDEX "fjn_roles_roleCode_key" ON "fjn_roles"("roleCode");

-- CreateIndex fjn_roles
CREATE INDEX "fjn_roles_status_idx" ON "fjn_roles"("status");
CREATE INDEX "fjn_roles_roleType_idx" ON "fjn_roles"("roleType");
CREATE INDEX "fjn_roles_parentId_idx" ON "fjn_roles"("parentId");

-- CreateTable fjn_permissions
CREATE TABLE "fjn_permissions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "permissionCode" VARCHAR(128) NOT NULL,
    "permissionName" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "resource" VARCHAR(64) NOT NULL,
    "action" VARCHAR(32) NOT NULL,
    "permissionType" VARCHAR(16) NOT NULL DEFAULT 'api',
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "parentId" UUID,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_permissions_pkey" PRIMARY KEY ("id")
);

-- Unique: permissionCode
CREATE UNIQUE INDEX "fjn_permissions_permissionCode_key" ON "fjn_permissions"("permissionCode");

-- CreateIndex fjn_permissions
CREATE INDEX "fjn_permissions_status_idx" ON "fjn_permissions"("status");
CREATE INDEX "fjn_permissions_resource_idx" ON "fjn_permissions"("resource");
CREATE INDEX "fjn_permissions_resource_action_idx" ON "fjn_permissions"("resource", "action");
CREATE INDEX "fjn_permissions_permissionType_idx" ON "fjn_permissions"("permissionType");

-- CreateTable fjn_role_permissions
CREATE TABLE "fjn_role_permissions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "scope" VARCHAR(32) NOT NULL DEFAULT 'all',
    "scopeValue" VARCHAR(255),
    "conditions" JSONB,
    "grantedBy" UUID,
    "grantedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex fjn_role_permissions
CREATE INDEX "fjn_role_permissions_roleId_idx" ON "fjn_role_permissions"("roleId");
CREATE INDEX "fjn_role_permissions_permissionId_idx" ON "fjn_role_permissions"("permissionId");
CREATE INDEX "fjn_role_permissions_status_idx" ON "fjn_role_permissions"("status");
CREATE INDEX "fjn_role_permissions_expiresAt_idx" ON "fjn_role_permissions"("expiresAt");

-- CreateTable fjn_user_roles
CREATE TABLE "fjn_user_roles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "scope" VARCHAR(32) NOT NULL DEFAULT 'all',
    "scopeValue" VARCHAR(255),
    "grantedBy" UUID,
    "grantedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "revokedAt" TIMESTAMPTZ,
    "revokedBy" UUID,
    "revokeReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex fjn_user_roles
CREATE INDEX "fjn_user_roles_userId_idx" ON "fjn_user_roles"("userId");
CREATE INDEX "fjn_user_roles_roleId_idx" ON "fjn_user_roles"("roleId");
CREATE INDEX "fjn_user_roles_status_idx" ON "fjn_user_roles"("status");
CREATE INDEX "fjn_user_roles_expiresAt_idx" ON "fjn_user_roles"("expiresAt");

-- CreateTable fjn_user_permissions
CREATE TABLE "fjn_user_permissions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "effect" VARCHAR(16) NOT NULL DEFAULT 'grant',
    "scope" VARCHAR(32) NOT NULL DEFAULT 'all',
    "scopeValue" VARCHAR(255),
    "conditions" JSONB,
    "grantedBy" UUID,
    "grantedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "revokedAt" TIMESTAMPTZ,
    "revokedBy" UUID,
    "revokeReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex fjn_user_permissions
CREATE INDEX "fjn_user_permissions_userId_idx" ON "fjn_user_permissions"("userId");
CREATE INDEX "fjn_user_permissions_permissionId_idx" ON "fjn_user_permissions"("permissionId");
CREATE INDEX "fjn_user_permissions_status_idx" ON "fjn_user_permissions"("status");
CREATE INDEX "fjn_user_permissions_expiresAt_idx" ON "fjn_user_permissions"("expiresAt");

-- CreateTable fjn_access_policies
CREATE TABLE "fjn_access_policies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "policyCode" VARCHAR(128) NOT NULL,
    "policyName" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "effect" VARCHAR(16) NOT NULL DEFAULT 'allow',
    "resource" VARCHAR(64) NOT NULL,
    "actions" TEXT[],
    "conditions" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" TIMESTAMPTZ,
    "validTo" TIMESTAMPTZ,
    "metadata" JSONB,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_access_policies_pkey" PRIMARY KEY ("id")
);

-- Unique: policyCode
CREATE UNIQUE INDEX "fjn_access_policies_policyCode_key" ON "fjn_access_policies"("policyCode");

-- CreateIndex fjn_access_policies
CREATE INDEX "fjn_access_policies_status_idx" ON "fjn_access_policies"("status");
CREATE INDEX "fjn_access_policies_resource_idx" ON "fjn_access_policies"("resource");
CREATE INDEX "fjn_access_policies_priority_idx" ON "fjn_access_policies"("priority");

-- CreateTable fjn_access_logs
CREATE TABLE "fjn_access_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID,
    "userNo" VARCHAR(64),
    "resource" VARCHAR(64) NOT NULL,
    "action" VARCHAR(32) NOT NULL,
    "decision" VARCHAR(16) NOT NULL,
    "reason" TEXT,
    "matchedRoles" TEXT[],
    "matchedPermissions" TEXT[],
    "matchedPolicies" TEXT[],
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "requestId" VARCHAR(64),
    "latencyMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex fjn_access_logs
CREATE INDEX "fjn_access_logs_userId_idx" ON "fjn_access_logs"("userId");
CREATE INDEX "fjn_access_logs_userNo_idx" ON "fjn_access_logs"("userNo");
CREATE INDEX "fjn_access_logs_resource_action_idx" ON "fjn_access_logs"("resource", "action");
CREATE INDEX "fjn_access_logs_decision_idx" ON "fjn_access_logs"("decision");
CREATE INDEX "fjn_access_logs_createdAt_idx" ON "fjn_access_logs"("createdAt");
