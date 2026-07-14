-- ============================================================

-- FJN-only Migration Subset

-- 仅包含 fjn_ 表的创建/索引/外键操作

-- 安全子集：不触碰任何已存在表

-- 生成时间: 2026-06-30T17:41:55.508Z

-- ============================================================



-- CreateTable
CREATE TABLE "fjn_products" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "productNo" VARCHAR(64) NOT NULL,
    "productType" VARCHAR(32) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "subtitle" VARCHAR(255),
    "description" TEXT,
    "price" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "costPrice" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "taxMode" VARCHAR(16) NOT NULL DEFAULT 'exclusive',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "saleStartTime" TIMESTAMPTZ,
    "saleEndTime" TIMESTAMPTZ,
    "allowedRegions" VARCHAR(8)[],
    "blockedRegions" VARCHAR(8)[],
    "requiresKyc" BOOLEAN NOT NULL DEFAULT false,
    "requiresKyb" BOOLEAN NOT NULL DEFAULT false,
    "requiresWallet" BOOLEAN NOT NULL DEFAULT false,
    "revenueRuleCode" VARCHAR(64),
    "pointsRuleCode" VARCHAR(64),
    "powerRuleCode" VARCHAR(64),
    "rewardRuleCode" VARCHAR(64),
    "taxRuleCode" VARCHAR(64),
    "riskRuleCode" VARCHAR(64),
    "fulfillmentRuleCode" VARCHAR(64),
    "imageUrl" VARCHAR(512),
    "gallery" JSONB,
    "metadata" JSONB,
    "createdBy" UUID,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_product_versions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "productId" UUID NOT NULL,
    "versionNo" VARCHAR(32) NOT NULL,
    "price" DECIMAL(20,4) NOT NULL,
    "benefitsSnapshot" JSONB NOT NULL,
    "changeReason" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_product_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_product_benefits" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "productId" UUID NOT NULL,
    "benefitType" VARCHAR(32) NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "config" JSONB,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_product_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_product_rule_bindings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "productId" UUID NOT NULL,
    "ruleType" VARCHAR(32) NOT NULL,
    "ruleCode" VARCHAR(64) NOT NULL,
    "ruleVersion" VARCHAR(32),
    "bindingConfig" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_product_rule_bindings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_product_region_rules" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "productId" UUID NOT NULL,
    "regionCode" VARCHAR(8) NOT NULL,
    "ruleType" VARCHAR(16) NOT NULL,
    "reason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_product_region_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_product_inventory_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "productId" UUID NOT NULL,
    "changeType" VARCHAR(20) NOT NULL,
    "changeQty" INTEGER NOT NULL DEFAULT 0,
    "beforeStock" INTEGER NOT NULL DEFAULT 0,
    "afterStock" INTEGER NOT NULL DEFAULT 0,
    "sourceType" VARCHAR(32),
    "sourceId" UUID,
    "operatorId" UUID,
    "remark" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_product_inventory_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_orders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "orderNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "orderType" VARCHAR(32) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'created',
    "subtotalAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "shippingAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "referrerId" UUID,
    "referralCode" VARCHAR(20),
    "countryCode" CHAR(2) NOT NULL DEFAULT 'CN',
    "shippingAddress" JSONB,
    "billingAddress" JSONB,
    "contactName" VARCHAR(100),
    "contactPhone" VARCHAR(30),
    "contactEmail" VARCHAR(255),
    "remark" TEXT,
    "metadata" JSONB,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" VARCHAR(16) NOT NULL DEFAULT 'low',
    "paidAt" TIMESTAMPTZ,
    "confirmedAt" TIMESTAMPTZ,
    "fulfilledAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "cancelledAt" TIMESTAMPTZ,
    "refundedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_order_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "orderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "productName" VARCHAR(200) NOT NULL,
    "productType" VARCHAR(32) NOT NULL,
    "sku" VARCHAR(64),
    "unitPrice" DECIMAL(20,4) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(20,4) NOT NULL,
    "taxAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(20,4) NOT NULL,
    "benefitsSnapshot" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_order_status_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "orderId" UUID NOT NULL,
    "fromStatus" VARCHAR(24),
    "toStatus" VARCHAR(24) NOT NULL,
    "reason" VARCHAR(255),
    "operatorId" UUID,
    "operatorType" VARCHAR(16) NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_order_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_fulfillment_tasks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "taskNo" VARCHAR(64) NOT NULL,
    "orderId" UUID NOT NULL,
    "fulfillmentType" VARCHAR(32) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "shippingCompany" VARCHAR(100),
    "trackingNo" VARCHAR(100),
    "shippingAddress" JSONB,
    "contactInfo" JSONB,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_fulfillment_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_fulfillment_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "taskId" UUID NOT NULL,
    "benefitType" VARCHAR(32) NOT NULL,
    "benefitRef" VARCHAR(128),
    "quantity" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "payload" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_fulfillment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_order_risk_checks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "orderId" UUID NOT NULL,
    "checkStage" VARCHAR(20) NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" VARCHAR(16) NOT NULL DEFAULT 'low',
    "triggeredRules" JSONB,
    "action" VARCHAR(20) NOT NULL DEFAULT 'pass',
    "reviewerId" UUID,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_order_risk_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "paymentNo" VARCHAR(64) NOT NULL,
    "orderId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "paymentMethod" VARCHAR(32) NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(20) NOT NULL DEFAULT 'created',
    "txHash" VARCHAR(128),
    "chainType" VARCHAR(16),
    "fromAddress" VARCHAR(255),
    "toAddress" VARCHAR(255),
    "externalRef" VARCHAR(128),
    "callbackUrl" VARCHAR(512),
    "callbackData" JSONB,
    "expiredAt" TIMESTAMPTZ,
    "paidAt" TIMESTAMPTZ,
    "failedAt" TIMESTAMPTZ,
    "failureReason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_payment_callbacks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "paymentId" UUID NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "signature" VARCHAR(512),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMPTZ,
    "errorMessage" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_payment_callbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_refunds" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "refundNo" VARCHAR(64) NOT NULL,
    "orderId" UUID NOT NULL,
    "paymentId" UUID,
    "userId" UUID NOT NULL,
    "refundType" VARCHAR(16) NOT NULL DEFAULT 'full',
    "reason" VARCHAR(255) NOT NULL,
    "reasonDetail" TEXT,
    "evidence" JSONB,
    "refundAmount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(20) NOT NULL DEFAULT 'requested',
    "reviewerId" UUID,
    "reviewNote" TEXT,
    "txHash" VARCHAR(128),
    "processedAt" TIMESTAMPTZ,
    "failureReason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_refund_adjustments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "refundId" UUID NOT NULL,
    "adjustmentType" VARCHAR(32) NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "payload" JSONB,
    "errorMessage" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_refund_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_revenue_rules" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ruleCode" VARCHAR(64) NOT NULL,
    "version" VARCHAR(32) NOT NULL,
    "productType" VARCHAR(32),
    "ruleContent" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "effectiveFrom" TIMESTAMPTZ,
    "effectiveTo" TIMESTAMPTZ,
    "changeReason" TEXT,
    "createdBy" UUID,
    "approvedBy" UUID,
    "approvalId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_revenue_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_revenue_rule_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ruleId" UUID NOT NULL,
    "poolType" VARCHAR(32) NOT NULL,
    "poolName" VARCHAR(100) NOT NULL,
    "percentage" DECIMAL(8,6) NOT NULL,
    "description" VARCHAR(255),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_revenue_rule_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_revenue_allocations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "allocationNo" VARCHAR(64) NOT NULL,
    "orderId" UUID NOT NULL,
    "ruleId" UUID NOT NULL,
    "ruleCode" VARCHAR(64) NOT NULL,
    "ruleVersion" VARCHAR(32) NOT NULL,
    "paidAmount" DECIMAL(20,4) NOT NULL,
    "taxAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "calculatedAt" TIMESTAMPTZ,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMPTZ,
    "settledAt" TIMESTAMPTZ,
    "reversedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_revenue_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_revenue_allocation_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "allocationId" UUID NOT NULL,
    "poolType" VARCHAR(32) NOT NULL,
    "poolName" VARCHAR(100) NOT NULL,
    "percentage" DECIMAL(8,6) NOT NULL,
    "allocatedAmount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "description" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_revenue_allocation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_revenue_reversals" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reversalNo" VARCHAR(64) NOT NULL,
    "allocationId" UUID NOT NULL,
    "refundId" UUID,
    "reversedAmount" DECIMAL(20,4) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "operatorId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_revenue_reversals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_points_accounts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "assetType" VARCHAR(16) NOT NULL,
    "availableBalance" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "frozenBalance" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "lockedBalance" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "consumedBalance" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "convertedBalance" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "expiredBalance" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "totalRevoked" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_points_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_points_ledgers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ledgerNo" VARCHAR(64) NOT NULL,
    "accountId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID,
    "assetType" VARCHAR(16) NOT NULL,
    "direction" VARCHAR(8) NOT NULL,
    "changeType" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "balanceBefore" DECIMAL(20,4) NOT NULL,
    "balanceAfter" DECIMAL(20,4) NOT NULL,
    "sourceType" VARCHAR(32),
    "sourceId" UUID,
    "bizType" VARCHAR(32),
    "bizNo" VARCHAR(64),
    "ruleCode" VARCHAR(64),
    "ruleVersion" VARCHAR(32),
    "riskStatus" VARCHAR(16) NOT NULL DEFAULT 'normal',
    "operatorId" UUID,
    "remark" VARCHAR(255),
    "txHash" VARCHAR(128),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_points_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_points_rules" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ruleCode" VARCHAR(64) NOT NULL,
    "assetType" VARCHAR(16) NOT NULL,
    "version" VARCHAR(32) NOT NULL,
    "ruleContent" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "effectiveFrom" TIMESTAMPTZ,
    "effectiveTo" TIMESTAMPTZ,
    "createdBy" UUID,
    "approvedBy" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_points_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_points_freezes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "accountId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "assetType" VARCHAR(16) NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "sourceType" VARCHAR(32),
    "sourceId" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unfrozenAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_points_freezes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_points_reversals" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reversalNo" VARCHAR(64) NOT NULL,
    "accountId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "assetType" VARCHAR(16) NOT NULL,
    "originalLedgerId" UUID,
    "reversedAmount" DECIMAL(20,4) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "sourceType" VARCHAR(32),
    "sourceId" UUID,
    "operatorId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_points_reversals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_points_snapshots" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "snapshotNo" VARCHAR(64) NOT NULL,
    "snapshotType" VARCHAR(32) NOT NULL,
    "assetType" VARCHAR(16) NOT NULL,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "totalSupply" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "totalFrozen" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "totalLocked" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "snapshotData" JSONB NOT NULL,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_points_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_tpoints_accounts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "availableBalance" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "lockedBalance" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "frozenBalance" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "inOrderBalance" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "consumedBalance" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "burnedBalance" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_tpoints_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_tpoints_ledgers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ledgerNo" VARCHAR(64) NOT NULL,
    "accountId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "direction" VARCHAR(8) NOT NULL,
    "changeType" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "balanceBefore" DECIMAL(20,4) NOT NULL,
    "balanceAfter" DECIMAL(20,4) NOT NULL,
    "sourceType" VARCHAR(32),
    "sourceId" UUID,
    "bizType" VARCHAR(32),
    "bizNo" VARCHAR(64),
    "remark" VARCHAR(255),
    "txHash" VARCHAR(128),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_tpoints_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_conversion_orders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "conversionNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "cfj369Amount" DECIMAL(20,4) NOT NULL,
    "convertRatio" DECIMAL(8,4) NOT NULL,
    "memberLevel" VARCHAR(16) NOT NULL,
    "tFJ369Gross" DECIMAL(20,4) NOT NULL,
    "feeRate" DECIMAL(8,6) NOT NULL,
    "feeAmount" DECIMAL(20,4) NOT NULL,
    "tFJ369Net" DECIMAL(20,4) NOT NULL,
    "feeDestruction" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "feeEcosystemPool" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "feeLiquidityPool" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'created',
    "kycVerified" BOOLEAN NOT NULL DEFAULT false,
    "regionAllowed" BOOLEAN NOT NULL DEFAULT false,
    "riskStatus" VARCHAR(16) NOT NULL DEFAULT 'normal',
    "approverId" UUID,
    "approvedAt" TIMESTAMPTZ,
    "executedAt" TIMESTAMPTZ,
    "txHash" VARCHAR(128),
    "failureReason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_conversion_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_tpoints_locks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "accountId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "lockType" VARCHAR(32) NOT NULL,
    "sourceType" VARCHAR(32),
    "sourceId" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlockedAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_tpoints_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_tpoints_trade_orders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "orderNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "side" VARCHAR(8) NOT NULL,
    "orderType" VARCHAR(16) NOT NULL DEFAULT 'limit',
    "price" DECIMAL(20,8) NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "filledQty" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "avgFillPrice" DECIMAL(20,8),
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "totalAmount" DECIMAL(20,4) NOT NULL,
    "feeAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMPTZ,
    "filledAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_tpoints_trade_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_tpoints_trade_matches" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "matchNo" VARCHAR(64) NOT NULL,
    "buyOrderId" UUID NOT NULL,
    "sellOrderId" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "totalAmount" DECIMAL(20,4) NOT NULL,
    "buyerFee" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "sellerFee" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_tpoints_trade_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_tpoints_market_prices" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "symbol" VARCHAR(32) NOT NULL,
    "lastPrice" DECIMAL(20,8) NOT NULL,
    "bidPrice" DECIMAL(20,8),
    "askPrice" DECIMAL(20,8),
    "high24h" DECIMAL(20,8),
    "low24h" DECIMAL(20,8),
    "volume24h" DECIMAL(20,4),
    "change24h" DECIMAL(8,4),
    "recordedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_tpoints_market_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_nft_collections" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "collectionNo" VARCHAR(64) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "symbol" VARCHAR(32) NOT NULL,
    "nftType" VARCHAR(32) NOT NULL,
    "description" TEXT,
    "imageUrl" VARCHAR(512),
    "totalSupply" INTEGER NOT NULL DEFAULT 0,
    "maxSupply" INTEGER NOT NULL DEFAULT 0,
    "chainType" VARCHAR(16) NOT NULL DEFAULT 'solana',
    "chainId" VARCHAR(32) NOT NULL DEFAULT 'devnet',
    "contractAddress" VARCHAR(128),
    "metadataUri" VARCHAR(512),
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_nft_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_nft_assets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "assetNo" VARCHAR(64) NOT NULL,
    "collectionId" UUID NOT NULL,
    "ownerId" UUID,
    "tokenId" VARCHAR(128),
    "name" VARCHAR(200) NOT NULL,
    "imageUrl" VARCHAR(512),
    "attributes" JSONB,
    "power" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending_mint',
    "sourceType" VARCHAR(32),
    "sourceId" UUID,
    "txHash" VARCHAR(128),
    "mintedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_nft_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_nft_benefits" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "assetId" UUID NOT NULL,
    "benefitType" VARCHAR(32) NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "config" JSONB,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_nft_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_nft_ownerships" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "assetId" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "fromUserId" UUID,
    "toUserId" UUID,
    "transferType" VARCHAR(20) NOT NULL,
    "txHash" VARCHAR(128),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_nft_ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_nft_upgrade_orders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "upgradeNo" VARCHAR(64) NOT NULL,
    "assetId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "fromLevel" INTEGER NOT NULL DEFAULT 1,
    "toLevel" INTEGER NOT NULL DEFAULT 2,
    "upgradeCost" DECIMAL(20,4) NOT NULL,
    "paidAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "paymentType" VARCHAR(32) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'created',
    "txHash" VARCHAR(128),
    "completedAt" TIMESTAMPTZ,
    "failureReason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_nft_upgrade_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_nft_chain_records" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "assetId" UUID NOT NULL,
    "recordType" VARCHAR(20) NOT NULL,
    "chainType" VARCHAR(16) NOT NULL,
    "chainId" VARCHAR(32) NOT NULL,
    "txHash" VARCHAR(128) NOT NULL,
    "blockNumber" BIGINT,
    "payload" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_nft_chain_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_power_accounts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "basePower" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "consumePower" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "mallPower" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "nftPower" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "virtualPointsPower" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "gamingPower" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "aiPower" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "corporatePower" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "communityPower" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "tFJ369HoldPower" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "tFJ369LockPower" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "nodePower" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "totalPower" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "effectivePower" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "memberMultiplier" DECIMAL(8,4) NOT NULL DEFAULT 1,
    "activityMultiplier" DECIMAL(8,4) NOT NULL DEFAULT 1,
    "riskCoefficient" DECIMAL(8,4) NOT NULL DEFAULT 1,
    "lastSnapshotAt" TIMESTAMPTZ,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_power_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_power_ledgers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ledgerNo" VARCHAR(64) NOT NULL,
    "accountId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "powerType" VARCHAR(20) NOT NULL,
    "changeType" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "balanceBefore" DECIMAL(20,4) NOT NULL,
    "balanceAfter" DECIMAL(20,4) NOT NULL,
    "sourceType" VARCHAR(32),
    "sourceId" UUID,
    "ruleCode" VARCHAR(64),
    "ruleVersion" VARCHAR(32),
    "expiresAt" TIMESTAMPTZ,
    "operatorId" UUID,
    "remark" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_power_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_power_snapshots" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "snapshotNo" VARCHAR(64) NOT NULL,
    "accountId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "snapshotType" VARCHAR(20) NOT NULL,
    "totalPower" DECIMAL(20,4) NOT NULL,
    "effectivePower" DECIMAL(20,4) NOT NULL,
    "memberMultiplier" DECIMAL(8,4) NOT NULL,
    "activityMultiplier" DECIMAL(8,4) NOT NULL,
    "riskCoefficient" DECIMAL(8,4) NOT NULL,
    "networkTotalPower" DECIMAL(20,4),
    "powerRatio" DECIMAL(8,8),
    "snapshotData" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_power_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_release_pools" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "poolNo" VARCHAR(64) NOT NULL,
    "poolName" VARCHAR(200) NOT NULL,
    "period" VARCHAR(16) NOT NULL,
    "poolType" VARCHAR(32) NOT NULL,
    "totalAmount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(16) NOT NULL DEFAULT 'FJ369',
    "status" VARCHAR(20) NOT NULL DEFAULT 'created',
    "networkPower" DECIMAL(20,4),
    "networkUsers" INTEGER DEFAULT 0,
    "merkleRoot" VARCHAR(128),
    "merkleTreeData" JSONB,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMPTZ,
    "calculatedAt" TIMESTAMPTZ,
    "claimOpenAt" TIMESTAMPTZ,
    "claimCloseAt" TIMESTAMPTZ,
    "description" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_release_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_release_calculations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "calculationNo" VARCHAR(64) NOT NULL,
    "poolId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userEffectivePower" DECIMAL(20,4) NOT NULL,
    "networkTotalPower" DECIMAL(20,4) NOT NULL,
    "userRatio" DECIMAL(8,8) NOT NULL,
    "calculatedAmount" DECIMAL(20,4) NOT NULL,
    "monthlyCap" DECIMAL(20,4) NOT NULL,
    "remainingQuota" DECIMAL(20,4) NOT NULL,
    "finalAmount" DECIMAL(20,4) NOT NULL,
    "riskCoefficient" DECIMAL(8,4) NOT NULL DEFAULT 1,
    "riskStatus" VARCHAR(16) NOT NULL DEFAULT 'normal',
    "status" VARCHAR(20) NOT NULL DEFAULT 'calculated',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_release_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_release_claims" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "claimNo" VARCHAR(64) NOT NULL,
    "poolId" UUID NOT NULL,
    "calculationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "claimableAmount" DECIMAL(20,4) NOT NULL,
    "claimedAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "merkleProof" JSONB,
    "txHash" VARCHAR(128),
    "blockNumber" BIGINT,
    "failureReason" VARCHAR(255),
    "expiresAt" TIMESTAMPTZ,
    "claimedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_release_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_user_release_quotas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "period" VARCHAR(16) NOT NULL,
    "monthlyCap" DECIMAL(20,4) NOT NULL,
    "claimedAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_user_release_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_referral_relationships" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "referrerId" UUID NOT NULL,
    "referrerCode" VARCHAR(20),
    "level" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "boundAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_referral_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_referral_rewards" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "rewardNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "orderUserId" UUID NOT NULL,
    "orderAmount" DECIMAL(20,4) NOT NULL,
    "rewardRate" DECIMAL(8,6) NOT NULL,
    "rewardAmount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(20) NOT NULL DEFAULT 'created',
    "lockDays" INTEGER NOT NULL DEFAULT 30,
    "lockedAt" TIMESTAMPTZ,
    "unlockedAt" TIMESTAMPTZ,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMPTZ,
    "paidAt" TIMESTAMPTZ,
    "cancelledAt" TIMESTAMPTZ,
    "recoveredAt" TIMESTAMPTZ,
    "kycVerified" BOOLEAN NOT NULL DEFAULT false,
    "selfReferral" BOOLEAN NOT NULL DEFAULT false,
    "riskStatus" VARCHAR(16) NOT NULL DEFAULT 'normal',
    "taxAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "remark" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_referral_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_team_structures" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "uplineId" UUID,
    "uplineLevel1" UUID,
    "uplineLevel2" UUID,
    "uplineLevel3" UUID,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "boundAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_team_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_team_rewards" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "rewardNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "orderUserId" UUID NOT NULL,
    "teamLevel" INTEGER NOT NULL DEFAULT 1,
    "rewardRate" DECIMAL(8,6) NOT NULL,
    "orderAmount" DECIMAL(20,4) NOT NULL,
    "rewardAmount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(20) NOT NULL DEFAULT 'created',
    "serviceRecordRequired" BOOLEAN NOT NULL DEFAULT true,
    "serviceRecordId" UUID,
    "serviceSubmittedAt" TIMESTAMPTZ,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMPTZ,
    "paidAt" TIMESTAMPTZ,
    "taxAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_team_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_team_service_records" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "recordNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "serviceType" VARCHAR(32) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "evidence" JSONB,
    "serviceDate" TIMESTAMPTZ NOT NULL,
    "durationHours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewerId" UUID,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_team_service_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_nodes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nodeNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "nodeName" VARCHAR(200) NOT NULL,
    "nodeLevel" VARCHAR(32) NOT NULL,
    "regionCode" VARCHAR(8) NOT NULL,
    "cityCode" VARCHAR(32),
    "countryCode" CHAR(2) NOT NULL,
    "contactName" VARCHAR(100) NOT NULL,
    "contactPhone" VARCHAR(30) NOT NULL,
    "contactEmail" VARCHAR(255) NOT NULL,
    "kybStatus" VARCHAR(20) NOT NULL DEFAULT 'not_submitted',
    "kybApprovedAt" TIMESTAMPTZ,
    "agreementNo" VARCHAR(64),
    "agreementSignedAt" TIMESTAMPTZ,
    "serviceScope" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending_review',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMPTZ,
    "suspendedAt" TIMESTAMPTZ,
    "terminatedAt" TIMESTAMPTZ,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_node_rewards" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "rewardNo" VARCHAR(64) NOT NULL,
    "nodeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "nodeLevel" VARCHAR(32) NOT NULL,
    "rewardRate" DECIMAL(8,6) NOT NULL,
    "orderAmount" DECIMAL(20,4) NOT NULL,
    "rewardAmount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(20) NOT NULL DEFAULT 'created',
    "serviceRecordRequired" BOOLEAN NOT NULL DEFAULT true,
    "serviceRecordId" UUID,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMPTZ,
    "paidAt" TIMESTAMPTZ,
    "taxAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_node_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_node_service_records" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "recordNo" VARCHAR(64) NOT NULL,
    "nodeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "serviceType" VARCHAR(32) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "evidence" JSONB,
    "serviceDate" TIMESTAMPTZ NOT NULL,
    "participants" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewerId" UUID,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_node_service_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_merchants" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "merchantNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "merchantName" VARCHAR(200) NOT NULL,
    "legalName" VARCHAR(200) NOT NULL,
    "contactName" VARCHAR(100) NOT NULL,
    "contactPhone" VARCHAR(30) NOT NULL,
    "contactEmail" VARCHAR(255) NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "kybStatus" VARCHAR(20) NOT NULL DEFAULT 'not_submitted',
    "kybApprovedAt" TIMESTAMPTZ,
    "category" VARCHAR(64),
    "description" TEXT,
    "logoUrl" VARCHAR(512),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending_review',
    "platformFeeRate" DECIMAL(8,6) NOT NULL DEFAULT 0.05,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_mall_products" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "productNo" VARCHAR(64) NOT NULL,
    "merchantId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(64) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" VARCHAR(512),
    "gallery" JSONB,
    "attributes" JSONB,
    "acceptPoints" BOOLEAN NOT NULL DEFAULT false,
    "acceptToken" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_mall_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_mall_orders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "orderNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "merchantId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(20,4) NOT NULL,
    "totalAmount" DECIMAL(20,4) NOT NULL,
    "paidAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "pointsUsed" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "tokenUsed" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "platformFee" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "paymentMethod" VARCHAR(32),
    "status" VARCHAR(20) NOT NULL DEFAULT 'created',
    "shippingAddress" JSONB,
    "trackingNo" VARCHAR(100),
    "shippingCompany" VARCHAR(100),
    "paidAt" TIMESTAMPTZ,
    "shippedAt" TIMESTAMPTZ,
    "deliveredAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_mall_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_mall_coupons" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "couponNo" VARCHAR(64) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "couponType" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "minSpend" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "totalSupply" INTEGER NOT NULL DEFAULT 0,
    "claimedCount" INTEGER NOT NULL DEFAULT 0,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "userScope" VARCHAR(20) NOT NULL DEFAULT 'all',
    "productScope" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "validFrom" TIMESTAMPTZ NOT NULL,
    "validTo" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_mall_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_mall_settlements" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "settlementNo" VARCHAR(64) NOT NULL,
    "merchantId" UUID NOT NULL,
    "period" VARCHAR(16) NOT NULL,
    "grossAmount" DECIMAL(20,4) NOT NULL,
    "refundAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "platformFee" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'created',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMPTZ,
    "paidAt" TIMESTAMPTZ,
    "bankAccount" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_mall_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_finance_accounts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "accountNo" VARCHAR(64) NOT NULL,
    "accountName" VARCHAR(200) NOT NULL,
    "accountType" VARCHAR(32) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "balance" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "totalIn" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "totalOut" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_finance_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_finance_ledgers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ledgerNo" VARCHAR(64) NOT NULL,
    "accountId" UUID NOT NULL,
    "businessType" VARCHAR(32) NOT NULL,
    "businessId" UUID,
    "businessNo" VARCHAR(64),
    "orderId" UUID,
    "userId" UUID,
    "direction" VARCHAR(8) NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "balanceBefore" DECIMAL(20,4) NOT NULL,
    "balanceAfter" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "accountingSubject" VARCHAR(64),
    "taxStatus" VARCHAR(16) NOT NULL DEFAULT 'none',
    "settlementStatus" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "description" VARCHAR(255),
    "operatorId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_finance_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_settlements" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "settlementNo" VARCHAR(64) NOT NULL,
    "settlementType" VARCHAR(32) NOT NULL,
    "period" VARCHAR(16) NOT NULL,
    "totalAmount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(20) NOT NULL DEFAULT 'created',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMPTZ,
    "paidAt" TIMESTAMPTZ,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_settlement_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "settlementId" UUID NOT NULL,
    "userId" UUID,
    "merchantId" UUID,
    "nodeId" UUID,
    "amount" DECIMAL(20,4) NOT NULL,
    "taxAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "bankInfo" JSONB,
    "paidAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_settlement_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_tax_rules" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ruleCode" VARCHAR(64) NOT NULL,
    "taxType" VARCHAR(32) NOT NULL,
    "regionCode" CHAR(2) NOT NULL,
    "taxRate" DECIMAL(8,6) NOT NULL,
    "taxMode" VARCHAR(16) NOT NULL DEFAULT 'exclusive',
    "applicableScope" JSONB,
    "effectiveFrom" TIMESTAMPTZ NOT NULL,
    "effectiveTo" TIMESTAMPTZ,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_tax_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_tax_records" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "recordNo" VARCHAR(64) NOT NULL,
    "ruleId" UUID NOT NULL,
    "taxType" VARCHAR(32) NOT NULL,
    "regionCode" CHAR(2) NOT NULL,
    "orderId" UUID,
    "userId" UUID,
    "taxableAmount" DECIMAL(20,4) NOT NULL,
    "taxRate" DECIMAL(8,6) NOT NULL,
    "taxAmount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "taxIncluded" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'reserved',
    "reportPeriod" VARCHAR(16),
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_tax_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_tax_reports" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reportNo" VARCHAR(64) NOT NULL,
    "regionCode" CHAR(2) NOT NULL,
    "reportPeriod" VARCHAR(16) NOT NULL,
    "taxType" VARCHAR(32) NOT NULL,
    "totalTaxable" DECIMAL(20,4) NOT NULL,
    "totalTax" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "reportData" JSONB,
    "submittedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_tax_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_risk_rules" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ruleCode" VARCHAR(64) NOT NULL,
    "ruleName" VARCHAR(200) NOT NULL,
    "ruleType" VARCHAR(32) NOT NULL,
    "riskLevel" VARCHAR(16) NOT NULL DEFAULT 'medium',
    "ruleConfig" JSONB NOT NULL,
    "action" VARCHAR(20) NOT NULL DEFAULT 'warning',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_risk_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_risk_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "eventNo" VARCHAR(64) NOT NULL,
    "ruleId" UUID,
    "userId" UUID,
    "eventType" VARCHAR(32) NOT NULL,
    "riskLevel" VARCHAR(16) NOT NULL DEFAULT 'medium',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "sourceType" VARCHAR(32),
    "sourceId" UUID,
    "payload" JSONB,
    "action" VARCHAR(20) NOT NULL DEFAULT 'warning',
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "reviewerId" UUID,
    "reviewNote" TEXT,
    "resolvedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_risk_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_risk_cases" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "caseNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "caseType" VARCHAR(32) NOT NULL,
    "riskLevel" VARCHAR(16) NOT NULL DEFAULT 'medium',
    "description" TEXT,
    "relatedEvents" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "assignedTo" UUID,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_risk_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_risk_scores" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "scoreType" VARCHAR(32) NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" VARCHAR(16) NOT NULL DEFAULT 'low',
    "factors" JSONB,
    "recordedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_risk_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_blacklists" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID,
    "category" VARCHAR(32) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "source" VARCHAR(32) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMPTZ,
    "addedBy" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_blacklists_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "fjn_approval_requests" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "approvalNo" VARCHAR(64) NOT NULL,
    "approvalType" VARCHAR(32) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "applicantId" UUID NOT NULL,
    "applicantType" VARCHAR(16) NOT NULL DEFAULT 'admin',
    "payload" JSONB NOT NULL,
    "relatedType" VARCHAR(32),
    "relatedId" UUID,
    "relatedNo" VARCHAR(64),
    "amount" DECIMAL(20,4),
    "currency" VARCHAR(8),
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "totalSteps" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "priority" VARCHAR(16) NOT NULL DEFAULT 'normal',
    "expiresAt" TIMESTAMPTZ,
    "approvedAt" TIMESTAMPTZ,
    "executedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_approval_steps" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "requestId" UUID NOT NULL,
    "stepNo" INTEGER NOT NULL DEFAULT 1,
    "stepName" VARCHAR(100) NOT NULL,
    "approverId" UUID,
    "approverRole" VARCHAR(32),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "comment" TEXT,
    "approvedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_operation_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "logNo" VARCHAR(64) NOT NULL,
    "module" VARCHAR(32) NOT NULL,
    "action" VARCHAR(32) NOT NULL,
    "targetType" VARCHAR(32),
    "targetId" UUID,
    "targetNo" VARCHAR(64),
    "operatorId" UUID,
    "operatorName" VARCHAR(100),
    "operatorRole" VARCHAR(32),
    "beforeValue" JSONB,
    "afterValue" JSONB,
    "changeSummary" VARCHAR(500),
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "deviceId" VARCHAR(128),
    "approvalNo" VARCHAR(64),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_operation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_blockchain_transactions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "txHash" VARCHAR(128) NOT NULL,
    "chainType" VARCHAR(16) NOT NULL,
    "chainId" VARCHAR(32) NOT NULL,
    "fromAddress" VARCHAR(255) NOT NULL,
    "toAddress" VARCHAR(255),
    "value" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "assetType" VARCHAR(32),
    "contractAddress" VARCHAR(128),
    "methodName" VARCHAR(64),
    "methodArgs" JSONB,
    "gasUsed" DECIMAL(36,18),
    "gasPrice" DECIMAL(36,18),
    "blockNumber" BIGINT,
    "blockTimestamp" TIMESTAMPTZ,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "relatedType" VARCHAR(32),
    "relatedId" UUID,
    "relatedNo" VARCHAR(64),
    "errorMessage" TEXT,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMPTZ,

    CONSTRAINT "fjn_blockchain_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_blockchain_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "txHash" VARCHAR(128) NOT NULL,
    "chainType" VARCHAR(16) NOT NULL,
    "chainId" VARCHAR(32) NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "logIndex" INTEGER NOT NULL DEFAULT 0,
    "contractAddress" VARCHAR(128) NOT NULL,
    "eventName" VARCHAR(64) NOT NULL,
    "eventData" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMPTZ,
    "relatedType" VARCHAR(32),
    "relatedId" UUID,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_blockchain_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_treasury_wallets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "walletNo" VARCHAR(64) NOT NULL,
    "walletName" VARCHAR(200) NOT NULL,
    "walletType" VARCHAR(32) NOT NULL,
    "chainType" VARCHAR(16) NOT NULL,
    "chainId" VARCHAR(32) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "publicKey" TEXT,
    "multisigConfig" JSONB,
    "balance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_treasury_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_merkle_roots" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "poolId" UUID,
    "rootHash" VARCHAR(128) NOT NULL,
    "treeData" JSONB NOT NULL,
    "leafCount" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_merkle_roots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_chain_reconciliation_jobs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "jobNo" VARCHAR(64) NOT NULL,
    "jobType" VARCHAR(32) NOT NULL,
    "chainType" VARCHAR(16),
    "chainId" VARCHAR(32),
    "totalChecked" INTEGER NOT NULL DEFAULT 0,
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "mismatchedCount" INTEGER NOT NULL DEFAULT 0,
    "mismatchDetails" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'running',
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,
    "errorMessage" TEXT,

    CONSTRAINT "fjn_chain_reconciliation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_system_configs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "configKey" VARCHAR(128) NOT NULL,
    "configValue" JSONB NOT NULL,
    "category" VARCHAR(64) NOT NULL,
    "description" TEXT,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" UUID,
    "updatedBy" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fjn_report_snapshots" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reportNo" VARCHAR(64) NOT NULL,
    "reportType" VARCHAR(64) NOT NULL,
    "period" VARCHAR(16) NOT NULL,
    "reportData" JSONB NOT NULL,
    "summary" JSONB,
    "generatedBy" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fjn_report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fjn_products_productNo_key" ON "fjn_products"("productNo");

-- CreateIndex
CREATE INDEX "fjn_products_productType_idx" ON "fjn_products"("productType");

-- CreateIndex
CREATE INDEX "fjn_products_status_idx" ON "fjn_products"("status");

-- CreateIndex
CREATE INDEX "fjn_products_createdAt_idx" ON "fjn_products"("createdAt");

-- CreateIndex
CREATE INDEX "fjn_product_versions_productId_idx" ON "fjn_product_versions"("productId");

-- CreateIndex
CREATE INDEX "fjn_product_benefits_productId_idx" ON "fjn_product_benefits"("productId");

-- CreateIndex
CREATE INDEX "fjn_product_benefits_benefitType_idx" ON "fjn_product_benefits"("benefitType");

-- CreateIndex
CREATE INDEX "fjn_product_rule_bindings_productId_idx" ON "fjn_product_rule_bindings"("productId");

-- CreateIndex
CREATE INDEX "fjn_product_rule_bindings_ruleType_ruleCode_idx" ON "fjn_product_rule_bindings"("ruleType", "ruleCode");

-- CreateIndex
CREATE INDEX "fjn_product_region_rules_productId_idx" ON "fjn_product_region_rules"("productId");

-- CreateIndex
CREATE INDEX "fjn_product_region_rules_regionCode_idx" ON "fjn_product_region_rules"("regionCode");

-- CreateIndex
CREATE INDEX "fjn_product_inventory_logs_productId_idx" ON "fjn_product_inventory_logs"("productId");

-- CreateIndex
CREATE INDEX "fjn_product_inventory_logs_changeType_idx" ON "fjn_product_inventory_logs"("changeType");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_orders_orderNo_key" ON "fjn_orders"("orderNo");

-- CreateIndex
CREATE INDEX "fjn_orders_userId_idx" ON "fjn_orders"("userId");

-- CreateIndex
CREATE INDEX "fjn_orders_orderType_idx" ON "fjn_orders"("orderType");

-- CreateIndex
CREATE INDEX "fjn_orders_status_idx" ON "fjn_orders"("status");

-- CreateIndex
CREATE INDEX "fjn_orders_paidAt_idx" ON "fjn_orders"("paidAt");

-- CreateIndex
CREATE INDEX "fjn_orders_createdAt_idx" ON "fjn_orders"("createdAt");

-- CreateIndex
CREATE INDEX "fjn_order_items_orderId_idx" ON "fjn_order_items"("orderId");

-- CreateIndex
CREATE INDEX "fjn_order_items_productId_idx" ON "fjn_order_items"("productId");

-- CreateIndex
CREATE INDEX "fjn_order_status_logs_orderId_idx" ON "fjn_order_status_logs"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_fulfillment_tasks_taskNo_key" ON "fjn_fulfillment_tasks"("taskNo");

-- CreateIndex
CREATE INDEX "fjn_fulfillment_tasks_orderId_idx" ON "fjn_fulfillment_tasks"("orderId");

-- CreateIndex
CREATE INDEX "fjn_fulfillment_tasks_status_idx" ON "fjn_fulfillment_tasks"("status");

-- CreateIndex
CREATE INDEX "fjn_fulfillment_items_taskId_idx" ON "fjn_fulfillment_items"("taskId");

-- CreateIndex
CREATE INDEX "fjn_order_risk_checks_orderId_idx" ON "fjn_order_risk_checks"("orderId");

-- CreateIndex
CREATE INDEX "fjn_order_risk_checks_checkStage_idx" ON "fjn_order_risk_checks"("checkStage");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_payments_paymentNo_key" ON "fjn_payments"("paymentNo");

-- CreateIndex
CREATE INDEX "fjn_payments_orderId_idx" ON "fjn_payments"("orderId");

-- CreateIndex
CREATE INDEX "fjn_payments_userId_idx" ON "fjn_payments"("userId");

-- CreateIndex
CREATE INDEX "fjn_payments_status_idx" ON "fjn_payments"("status");

-- CreateIndex
CREATE INDEX "fjn_payments_txHash_idx" ON "fjn_payments"("txHash");

-- CreateIndex
CREATE INDEX "fjn_payment_callbacks_paymentId_idx" ON "fjn_payment_callbacks"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_refunds_refundNo_key" ON "fjn_refunds"("refundNo");

-- CreateIndex
CREATE INDEX "fjn_refunds_orderId_idx" ON "fjn_refunds"("orderId");

-- CreateIndex
CREATE INDEX "fjn_refunds_userId_idx" ON "fjn_refunds"("userId");

-- CreateIndex
CREATE INDEX "fjn_refunds_status_idx" ON "fjn_refunds"("status");

-- CreateIndex
CREATE INDEX "fjn_refund_adjustments_refundId_idx" ON "fjn_refund_adjustments"("refundId");

-- CreateIndex
CREATE INDEX "fjn_revenue_rules_ruleCode_idx" ON "fjn_revenue_rules"("ruleCode");

-- CreateIndex
CREATE INDEX "fjn_revenue_rules_status_idx" ON "fjn_revenue_rules"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_revenue_rules_ruleCode_version_key" ON "fjn_revenue_rules"("ruleCode", "version");

-- CreateIndex
CREATE INDEX "fjn_revenue_rule_items_ruleId_idx" ON "fjn_revenue_rule_items"("ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_revenue_allocations_allocationNo_key" ON "fjn_revenue_allocations"("allocationNo");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_revenue_allocations_orderId_key" ON "fjn_revenue_allocations"("orderId");

-- CreateIndex
CREATE INDEX "fjn_revenue_allocations_status_idx" ON "fjn_revenue_allocations"("status");

-- CreateIndex
CREATE INDEX "fjn_revenue_allocations_createdAt_idx" ON "fjn_revenue_allocations"("createdAt");

-- CreateIndex
CREATE INDEX "fjn_revenue_allocation_items_allocationId_idx" ON "fjn_revenue_allocation_items"("allocationId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_revenue_reversals_reversalNo_key" ON "fjn_revenue_reversals"("reversalNo");

-- CreateIndex
CREATE INDEX "fjn_revenue_reversals_allocationId_idx" ON "fjn_revenue_reversals"("allocationId");

-- CreateIndex
CREATE INDEX "fjn_points_accounts_userId_idx" ON "fjn_points_accounts"("userId");

-- CreateIndex
CREATE INDEX "fjn_points_accounts_assetType_idx" ON "fjn_points_accounts"("assetType");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_points_accounts_userId_assetType_key" ON "fjn_points_accounts"("userId", "assetType");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_points_ledgers_ledgerNo_key" ON "fjn_points_ledgers"("ledgerNo");

-- CreateIndex
CREATE INDEX "fjn_points_ledgers_accountId_idx" ON "fjn_points_ledgers"("accountId");

-- CreateIndex
CREATE INDEX "fjn_points_ledgers_userId_idx" ON "fjn_points_ledgers"("userId");

-- CreateIndex
CREATE INDEX "fjn_points_ledgers_orderId_idx" ON "fjn_points_ledgers"("orderId");

-- CreateIndex
CREATE INDEX "fjn_points_ledgers_assetType_idx" ON "fjn_points_ledgers"("assetType");

-- CreateIndex
CREATE INDEX "fjn_points_ledgers_createdAt_idx" ON "fjn_points_ledgers"("createdAt");

-- CreateIndex
CREATE INDEX "fjn_points_rules_ruleCode_idx" ON "fjn_points_rules"("ruleCode");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_points_rules_ruleCode_version_key" ON "fjn_points_rules"("ruleCode", "version");

-- CreateIndex
CREATE INDEX "fjn_points_freezes_accountId_idx" ON "fjn_points_freezes"("accountId");

-- CreateIndex
CREATE INDEX "fjn_points_freezes_userId_idx" ON "fjn_points_freezes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_points_reversals_reversalNo_key" ON "fjn_points_reversals"("reversalNo");

-- CreateIndex
CREATE INDEX "fjn_points_reversals_accountId_idx" ON "fjn_points_reversals"("accountId");

-- CreateIndex
CREATE INDEX "fjn_points_reversals_userId_idx" ON "fjn_points_reversals"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_points_snapshots_snapshotNo_key" ON "fjn_points_snapshots"("snapshotNo");

-- CreateIndex
CREATE INDEX "fjn_points_snapshots_snapshotType_idx" ON "fjn_points_snapshots"("snapshotType");

-- CreateIndex
CREATE INDEX "fjn_points_snapshots_createdAt_idx" ON "fjn_points_snapshots"("createdAt");

-- CreateIndex
CREATE INDEX "fjn_tpoints_accounts_userId_idx" ON "fjn_tpoints_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_tpoints_accounts_userId_key" ON "fjn_tpoints_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_tpoints_ledgers_ledgerNo_key" ON "fjn_tpoints_ledgers"("ledgerNo");

-- CreateIndex
CREATE INDEX "fjn_tpoints_ledgers_accountId_idx" ON "fjn_tpoints_ledgers"("accountId");

-- CreateIndex
CREATE INDEX "fjn_tpoints_ledgers_userId_idx" ON "fjn_tpoints_ledgers"("userId");

-- CreateIndex
CREATE INDEX "fjn_tpoints_ledgers_createdAt_idx" ON "fjn_tpoints_ledgers"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_conversion_orders_conversionNo_key" ON "fjn_conversion_orders"("conversionNo");

-- CreateIndex
CREATE INDEX "fjn_conversion_orders_userId_idx" ON "fjn_conversion_orders"("userId");

-- CreateIndex
CREATE INDEX "fjn_conversion_orders_status_idx" ON "fjn_conversion_orders"("status");

-- CreateIndex
CREATE INDEX "fjn_tpoints_locks_accountId_idx" ON "fjn_tpoints_locks"("accountId");

-- CreateIndex
CREATE INDEX "fjn_tpoints_locks_userId_idx" ON "fjn_tpoints_locks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_tpoints_trade_orders_orderNo_key" ON "fjn_tpoints_trade_orders"("orderNo");

-- CreateIndex
CREATE INDEX "fjn_tpoints_trade_orders_userId_idx" ON "fjn_tpoints_trade_orders"("userId");

-- CreateIndex
CREATE INDEX "fjn_tpoints_trade_orders_side_status_idx" ON "fjn_tpoints_trade_orders"("side", "status");

-- CreateIndex
CREATE INDEX "fjn_tpoints_trade_orders_price_idx" ON "fjn_tpoints_trade_orders"("price");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_tpoints_trade_matches_matchNo_key" ON "fjn_tpoints_trade_matches"("matchNo");

-- CreateIndex
CREATE INDEX "fjn_tpoints_trade_matches_buyOrderId_idx" ON "fjn_tpoints_trade_matches"("buyOrderId");

-- CreateIndex
CREATE INDEX "fjn_tpoints_trade_matches_sellOrderId_idx" ON "fjn_tpoints_trade_matches"("sellOrderId");

-- CreateIndex
CREATE INDEX "fjn_tpoints_trade_matches_buyerId_idx" ON "fjn_tpoints_trade_matches"("buyerId");

-- CreateIndex
CREATE INDEX "fjn_tpoints_trade_matches_sellerId_idx" ON "fjn_tpoints_trade_matches"("sellerId");

-- CreateIndex
CREATE INDEX "fjn_tpoints_market_prices_symbol_idx" ON "fjn_tpoints_market_prices"("symbol");

-- CreateIndex
CREATE INDEX "fjn_tpoints_market_prices_recordedAt_idx" ON "fjn_tpoints_market_prices"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_nft_collections_collectionNo_key" ON "fjn_nft_collections"("collectionNo");

-- CreateIndex
CREATE INDEX "fjn_nft_collections_nftType_idx" ON "fjn_nft_collections"("nftType");

-- CreateIndex
CREATE INDEX "fjn_nft_collections_status_idx" ON "fjn_nft_collections"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_nft_assets_assetNo_key" ON "fjn_nft_assets"("assetNo");

-- CreateIndex
CREATE INDEX "fjn_nft_assets_collectionId_idx" ON "fjn_nft_assets"("collectionId");

-- CreateIndex
CREATE INDEX "fjn_nft_assets_ownerId_idx" ON "fjn_nft_assets"("ownerId");

-- CreateIndex
CREATE INDEX "fjn_nft_assets_status_idx" ON "fjn_nft_assets"("status");

-- CreateIndex
CREATE INDEX "fjn_nft_benefits_assetId_idx" ON "fjn_nft_benefits"("assetId");

-- CreateIndex
CREATE INDEX "fjn_nft_ownerships_assetId_idx" ON "fjn_nft_ownerships"("assetId");

-- CreateIndex
CREATE INDEX "fjn_nft_ownerships_ownerId_idx" ON "fjn_nft_ownerships"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_nft_upgrade_orders_upgradeNo_key" ON "fjn_nft_upgrade_orders"("upgradeNo");

-- CreateIndex
CREATE INDEX "fjn_nft_upgrade_orders_assetId_idx" ON "fjn_nft_upgrade_orders"("assetId");

-- CreateIndex
CREATE INDEX "fjn_nft_upgrade_orders_userId_idx" ON "fjn_nft_upgrade_orders"("userId");

-- CreateIndex
CREATE INDEX "fjn_nft_chain_records_assetId_idx" ON "fjn_nft_chain_records"("assetId");

-- CreateIndex
CREATE INDEX "fjn_nft_chain_records_txHash_idx" ON "fjn_nft_chain_records"("txHash");

-- CreateIndex
CREATE INDEX "fjn_power_accounts_userId_idx" ON "fjn_power_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_power_accounts_userId_key" ON "fjn_power_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_power_ledgers_ledgerNo_key" ON "fjn_power_ledgers"("ledgerNo");

-- CreateIndex
CREATE INDEX "fjn_power_ledgers_accountId_idx" ON "fjn_power_ledgers"("accountId");

-- CreateIndex
CREATE INDEX "fjn_power_ledgers_userId_idx" ON "fjn_power_ledgers"("userId");

-- CreateIndex
CREATE INDEX "fjn_power_ledgers_powerType_idx" ON "fjn_power_ledgers"("powerType");

-- CreateIndex
CREATE INDEX "fjn_power_ledgers_createdAt_idx" ON "fjn_power_ledgers"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_power_snapshots_snapshotNo_key" ON "fjn_power_snapshots"("snapshotNo");

-- CreateIndex
CREATE INDEX "fjn_power_snapshots_userId_idx" ON "fjn_power_snapshots"("userId");

-- CreateIndex
CREATE INDEX "fjn_power_snapshots_snapshotType_idx" ON "fjn_power_snapshots"("snapshotType");

-- CreateIndex
CREATE INDEX "fjn_power_snapshots_createdAt_idx" ON "fjn_power_snapshots"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_release_pools_poolNo_key" ON "fjn_release_pools"("poolNo");

-- CreateIndex
CREATE INDEX "fjn_release_pools_period_idx" ON "fjn_release_pools"("period");

-- CreateIndex
CREATE INDEX "fjn_release_pools_status_idx" ON "fjn_release_pools"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_release_calculations_calculationNo_key" ON "fjn_release_calculations"("calculationNo");

-- CreateIndex
CREATE INDEX "fjn_release_calculations_userId_idx" ON "fjn_release_calculations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_release_calculations_poolId_userId_key" ON "fjn_release_calculations"("poolId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_release_claims_claimNo_key" ON "fjn_release_claims"("claimNo");

-- CreateIndex
CREATE INDEX "fjn_release_claims_poolId_idx" ON "fjn_release_claims"("poolId");

-- CreateIndex
CREATE INDEX "fjn_release_claims_userId_idx" ON "fjn_release_claims"("userId");

-- CreateIndex
CREATE INDEX "fjn_release_claims_status_idx" ON "fjn_release_claims"("status");

-- CreateIndex
CREATE INDEX "fjn_user_release_quotas_userId_idx" ON "fjn_user_release_quotas"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_user_release_quotas_userId_period_key" ON "fjn_user_release_quotas"("userId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_referral_relationships_userId_key" ON "fjn_referral_relationships"("userId");

-- CreateIndex
CREATE INDEX "fjn_referral_relationships_referrerId_idx" ON "fjn_referral_relationships"("referrerId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_referral_rewards_rewardNo_key" ON "fjn_referral_rewards"("rewardNo");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_referral_rewards_orderId_key" ON "fjn_referral_rewards"("orderId");

-- CreateIndex
CREATE INDEX "fjn_referral_rewards_userId_idx" ON "fjn_referral_rewards"("userId");

-- CreateIndex
CREATE INDEX "fjn_referral_rewards_orderUserId_idx" ON "fjn_referral_rewards"("orderUserId");

-- CreateIndex
CREATE INDEX "fjn_referral_rewards_status_idx" ON "fjn_referral_rewards"("status");

-- CreateIndex
CREATE INDEX "fjn_team_structures_uplineId_idx" ON "fjn_team_structures"("uplineId");

-- CreateIndex
CREATE INDEX "fjn_team_structures_uplineLevel1_idx" ON "fjn_team_structures"("uplineLevel1");

-- CreateIndex
CREATE INDEX "fjn_team_structures_uplineLevel2_idx" ON "fjn_team_structures"("uplineLevel2");

-- CreateIndex
CREATE INDEX "fjn_team_structures_uplineLevel3_idx" ON "fjn_team_structures"("uplineLevel3");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_team_structures_userId_key" ON "fjn_team_structures"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_team_rewards_rewardNo_key" ON "fjn_team_rewards"("rewardNo");

-- CreateIndex
CREATE INDEX "fjn_team_rewards_userId_idx" ON "fjn_team_rewards"("userId");

-- CreateIndex
CREATE INDEX "fjn_team_rewards_orderId_idx" ON "fjn_team_rewards"("orderId");

-- CreateIndex
CREATE INDEX "fjn_team_rewards_status_idx" ON "fjn_team_rewards"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_team_service_records_recordNo_key" ON "fjn_team_service_records"("recordNo");

-- CreateIndex
CREATE INDEX "fjn_team_service_records_userId_idx" ON "fjn_team_service_records"("userId");

-- CreateIndex
CREATE INDEX "fjn_team_service_records_serviceType_idx" ON "fjn_team_service_records"("serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_nodes_nodeNo_key" ON "fjn_nodes"("nodeNo");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_nodes_userId_key" ON "fjn_nodes"("userId");

-- CreateIndex
CREATE INDEX "fjn_nodes_nodeLevel_idx" ON "fjn_nodes"("nodeLevel");

-- CreateIndex
CREATE INDEX "fjn_nodes_regionCode_idx" ON "fjn_nodes"("regionCode");

-- CreateIndex
CREATE INDEX "fjn_nodes_status_idx" ON "fjn_nodes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_node_rewards_rewardNo_key" ON "fjn_node_rewards"("rewardNo");

-- CreateIndex
CREATE INDEX "fjn_node_rewards_nodeId_idx" ON "fjn_node_rewards"("nodeId");

-- CreateIndex
CREATE INDEX "fjn_node_rewards_userId_idx" ON "fjn_node_rewards"("userId");

-- CreateIndex
CREATE INDEX "fjn_node_rewards_orderId_idx" ON "fjn_node_rewards"("orderId");

-- CreateIndex
CREATE INDEX "fjn_node_rewards_status_idx" ON "fjn_node_rewards"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_node_service_records_recordNo_key" ON "fjn_node_service_records"("recordNo");

-- CreateIndex
CREATE INDEX "fjn_node_service_records_nodeId_idx" ON "fjn_node_service_records"("nodeId");

-- CreateIndex
CREATE INDEX "fjn_node_service_records_userId_idx" ON "fjn_node_service_records"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_merchants_merchantNo_key" ON "fjn_merchants"("merchantNo");

-- CreateIndex
CREATE INDEX "fjn_merchants_status_idx" ON "fjn_merchants"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_mall_products_productNo_key" ON "fjn_mall_products"("productNo");

-- CreateIndex
CREATE INDEX "fjn_mall_products_merchantId_idx" ON "fjn_mall_products"("merchantId");

-- CreateIndex
CREATE INDEX "fjn_mall_products_status_idx" ON "fjn_mall_products"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_mall_orders_orderNo_key" ON "fjn_mall_orders"("orderNo");

-- CreateIndex
CREATE INDEX "fjn_mall_orders_userId_idx" ON "fjn_mall_orders"("userId");

-- CreateIndex
CREATE INDEX "fjn_mall_orders_merchantId_idx" ON "fjn_mall_orders"("merchantId");

-- CreateIndex
CREATE INDEX "fjn_mall_orders_status_idx" ON "fjn_mall_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_mall_coupons_couponNo_key" ON "fjn_mall_coupons"("couponNo");

-- CreateIndex
CREATE INDEX "fjn_mall_coupons_status_idx" ON "fjn_mall_coupons"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_mall_settlements_settlementNo_key" ON "fjn_mall_settlements"("settlementNo");

-- CreateIndex
CREATE INDEX "fjn_mall_settlements_merchantId_idx" ON "fjn_mall_settlements"("merchantId");

-- CreateIndex
CREATE INDEX "fjn_mall_settlements_status_idx" ON "fjn_mall_settlements"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_finance_accounts_accountNo_key" ON "fjn_finance_accounts"("accountNo");

-- CreateIndex
CREATE INDEX "fjn_finance_accounts_accountType_idx" ON "fjn_finance_accounts"("accountType");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_finance_ledgers_ledgerNo_key" ON "fjn_finance_ledgers"("ledgerNo");

-- CreateIndex
CREATE INDEX "fjn_finance_ledgers_accountId_idx" ON "fjn_finance_ledgers"("accountId");

-- CreateIndex
CREATE INDEX "fjn_finance_ledgers_businessType_idx" ON "fjn_finance_ledgers"("businessType");

-- CreateIndex
CREATE INDEX "fjn_finance_ledgers_orderId_idx" ON "fjn_finance_ledgers"("orderId");

-- CreateIndex
CREATE INDEX "fjn_finance_ledgers_userId_idx" ON "fjn_finance_ledgers"("userId");

-- CreateIndex
CREATE INDEX "fjn_finance_ledgers_createdAt_idx" ON "fjn_finance_ledgers"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_settlements_settlementNo_key" ON "fjn_settlements"("settlementNo");

-- CreateIndex
CREATE INDEX "fjn_settlements_settlementType_idx" ON "fjn_settlements"("settlementType");

-- CreateIndex
CREATE INDEX "fjn_settlements_status_idx" ON "fjn_settlements"("status");

-- CreateIndex
CREATE INDEX "fjn_settlement_items_settlementId_idx" ON "fjn_settlement_items"("settlementId");

-- CreateIndex
CREATE INDEX "fjn_settlement_items_userId_idx" ON "fjn_settlement_items"("userId");

-- CreateIndex
CREATE INDEX "fjn_tax_rules_taxType_idx" ON "fjn_tax_rules"("taxType");

-- CreateIndex
CREATE INDEX "fjn_tax_rules_regionCode_idx" ON "fjn_tax_rules"("regionCode");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_tax_rules_ruleCode_regionCode_effectiveFrom_key" ON "fjn_tax_rules"("ruleCode", "regionCode", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_tax_records_recordNo_key" ON "fjn_tax_records"("recordNo");

-- CreateIndex
CREATE INDEX "fjn_tax_records_taxType_idx" ON "fjn_tax_records"("taxType");

-- CreateIndex
CREATE INDEX "fjn_tax_records_orderId_idx" ON "fjn_tax_records"("orderId");

-- CreateIndex
CREATE INDEX "fjn_tax_records_reportPeriod_idx" ON "fjn_tax_records"("reportPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_tax_reports_reportNo_key" ON "fjn_tax_reports"("reportNo");

-- CreateIndex
CREATE INDEX "fjn_tax_reports_regionCode_idx" ON "fjn_tax_reports"("regionCode");

-- CreateIndex
CREATE INDEX "fjn_tax_reports_reportPeriod_idx" ON "fjn_tax_reports"("reportPeriod");

-- CreateIndex
CREATE INDEX "fjn_risk_rules_ruleType_idx" ON "fjn_risk_rules"("ruleType");

-- CreateIndex
CREATE INDEX "fjn_risk_rules_enabled_idx" ON "fjn_risk_rules"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_risk_rules_ruleCode_key" ON "fjn_risk_rules"("ruleCode");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_risk_events_eventNo_key" ON "fjn_risk_events"("eventNo");

-- CreateIndex
CREATE INDEX "fjn_risk_events_userId_idx" ON "fjn_risk_events"("userId");

-- CreateIndex
CREATE INDEX "fjn_risk_events_eventType_idx" ON "fjn_risk_events"("eventType");

-- CreateIndex
CREATE INDEX "fjn_risk_events_status_idx" ON "fjn_risk_events"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_risk_cases_caseNo_key" ON "fjn_risk_cases"("caseNo");

-- CreateIndex
CREATE INDEX "fjn_risk_cases_userId_idx" ON "fjn_risk_cases"("userId");

-- CreateIndex
CREATE INDEX "fjn_risk_cases_status_idx" ON "fjn_risk_cases"("status");

-- CreateIndex
CREATE INDEX "fjn_risk_scores_userId_idx" ON "fjn_risk_scores"("userId");

-- CreateIndex
CREATE INDEX "fjn_risk_scores_scoreType_idx" ON "fjn_risk_scores"("scoreType");

-- CreateIndex
CREATE INDEX "fjn_blacklists_enabled_idx" ON "fjn_blacklists"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_blacklists_category_value_key" ON "fjn_blacklists"("category", "value");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_device_fingerprints_fingerprint_key" ON "fjn_device_fingerprints"("fingerprint");

-- CreateIndex
CREATE INDEX "fjn_device_fingerprints_userId_idx" ON "fjn_device_fingerprints"("userId");

-- CreateIndex
CREATE INDEX "fjn_device_fingerprints_riskLevel_idx" ON "fjn_device_fingerprints"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_approval_requests_approvalNo_key" ON "fjn_approval_requests"("approvalNo");

-- CreateIndex
CREATE INDEX "fjn_approval_requests_approvalType_idx" ON "fjn_approval_requests"("approvalType");

-- CreateIndex
CREATE INDEX "fjn_approval_requests_status_idx" ON "fjn_approval_requests"("status");

-- CreateIndex
CREATE INDEX "fjn_approval_requests_applicantId_idx" ON "fjn_approval_requests"("applicantId");

-- CreateIndex
CREATE INDEX "fjn_approval_steps_requestId_idx" ON "fjn_approval_steps"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_operation_logs_logNo_key" ON "fjn_operation_logs"("logNo");

-- CreateIndex
CREATE INDEX "fjn_operation_logs_module_idx" ON "fjn_operation_logs"("module");

-- CreateIndex
CREATE INDEX "fjn_operation_logs_action_idx" ON "fjn_operation_logs"("action");

-- CreateIndex
CREATE INDEX "fjn_operation_logs_operatorId_idx" ON "fjn_operation_logs"("operatorId");

-- CreateIndex
CREATE INDEX "fjn_operation_logs_targetType_targetId_idx" ON "fjn_operation_logs"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "fjn_operation_logs_createdAt_idx" ON "fjn_operation_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_blockchain_transactions_txHash_key" ON "fjn_blockchain_transactions"("txHash");

-- CreateIndex
CREATE INDEX "fjn_blockchain_transactions_chainType_chainId_idx" ON "fjn_blockchain_transactions"("chainType", "chainId");

-- CreateIndex
CREATE INDEX "fjn_blockchain_transactions_status_idx" ON "fjn_blockchain_transactions"("status");

-- CreateIndex
CREATE INDEX "fjn_blockchain_transactions_relatedType_relatedId_idx" ON "fjn_blockchain_transactions"("relatedType", "relatedId");

-- CreateIndex
CREATE INDEX "fjn_blockchain_events_txHash_idx" ON "fjn_blockchain_events"("txHash");

-- CreateIndex
CREATE INDEX "fjn_blockchain_events_eventName_idx" ON "fjn_blockchain_events"("eventName");

-- CreateIndex
CREATE INDEX "fjn_blockchain_events_processed_idx" ON "fjn_blockchain_events"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_treasury_wallets_walletNo_key" ON "fjn_treasury_wallets"("walletNo");

-- CreateIndex
CREATE INDEX "fjn_treasury_wallets_chainType_chainId_idx" ON "fjn_treasury_wallets"("chainType", "chainId");

-- CreateIndex
CREATE INDEX "fjn_treasury_wallets_status_idx" ON "fjn_treasury_wallets"("status");

-- CreateIndex
CREATE INDEX "fjn_merkle_roots_poolId_idx" ON "fjn_merkle_roots"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_chain_reconciliation_jobs_jobNo_key" ON "fjn_chain_reconciliation_jobs"("jobNo");

-- CreateIndex
CREATE INDEX "fjn_chain_reconciliation_jobs_jobType_idx" ON "fjn_chain_reconciliation_jobs"("jobType");

-- CreateIndex
CREATE INDEX "fjn_chain_reconciliation_jobs_status_idx" ON "fjn_chain_reconciliation_jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_system_configs_configKey_key" ON "fjn_system_configs"("configKey");

-- CreateIndex
CREATE INDEX "fjn_system_configs_category_idx" ON "fjn_system_configs"("category");

-- CreateIndex
CREATE UNIQUE INDEX "fjn_report_snapshots_reportNo_key" ON "fjn_report_snapshots"("reportNo");

-- CreateIndex
CREATE INDEX "fjn_report_snapshots_reportType_idx" ON "fjn_report_snapshots"("reportType");

-- CreateIndex
CREATE INDEX "fjn_report_snapshots_period_idx" ON "fjn_report_snapshots"("period");

-- AddForeignKey
ALTER TABLE "fjn_product_versions" ADD CONSTRAINT "fjn_product_versions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "fjn_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_product_benefits" ADD CONSTRAINT "fjn_product_benefits_productId_fkey" FOREIGN KEY ("productId") REFERENCES "fjn_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_product_rule_bindings" ADD CONSTRAINT "fjn_product_rule_bindings_productId_fkey" FOREIGN KEY ("productId") REFERENCES "fjn_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_product_region_rules" ADD CONSTRAINT "fjn_product_region_rules_productId_fkey" FOREIGN KEY ("productId") REFERENCES "fjn_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_product_inventory_logs" ADD CONSTRAINT "fjn_product_inventory_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "fjn_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_order_items" ADD CONSTRAINT "fjn_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "fjn_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_order_items" ADD CONSTRAINT "fjn_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "fjn_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_order_status_logs" ADD CONSTRAINT "fjn_order_status_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "fjn_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_fulfillment_tasks" ADD CONSTRAINT "fjn_fulfillment_tasks_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "fjn_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_fulfillment_items" ADD CONSTRAINT "fjn_fulfillment_items_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "fjn_fulfillment_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_order_risk_checks" ADD CONSTRAINT "fjn_order_risk_checks_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "fjn_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_payments" ADD CONSTRAINT "fjn_payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "fjn_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_payment_callbacks" ADD CONSTRAINT "fjn_payment_callbacks_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "fjn_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_refunds" ADD CONSTRAINT "fjn_refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "fjn_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_refund_adjustments" ADD CONSTRAINT "fjn_refund_adjustments_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "fjn_refunds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_revenue_rule_items" ADD CONSTRAINT "fjn_revenue_rule_items_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "fjn_revenue_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_revenue_allocations" ADD CONSTRAINT "fjn_revenue_allocations_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "fjn_revenue_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_revenue_allocations" ADD CONSTRAINT "fjn_revenue_allocations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "fjn_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_revenue_allocation_items" ADD CONSTRAINT "fjn_revenue_allocation_items_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "fjn_revenue_allocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_revenue_reversals" ADD CONSTRAINT "fjn_revenue_reversals_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "fjn_revenue_allocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_points_ledgers" ADD CONSTRAINT "fjn_points_ledgers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "fjn_points_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_points_ledgers" ADD CONSTRAINT "fjn_points_ledgers_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "fjn_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_points_freezes" ADD CONSTRAINT "fjn_points_freezes_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "fjn_points_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_points_reversals" ADD CONSTRAINT "fjn_points_reversals_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "fjn_points_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_tpoints_ledgers" ADD CONSTRAINT "fjn_tpoints_ledgers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "fjn_tpoints_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_tpoints_locks" ADD CONSTRAINT "fjn_tpoints_locks_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "fjn_tpoints_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_tpoints_trade_matches" ADD CONSTRAINT "fjn_tpoints_trade_matches_buyOrderId_fkey" FOREIGN KEY ("buyOrderId") REFERENCES "fjn_tpoints_trade_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_tpoints_trade_matches" ADD CONSTRAINT "fjn_tpoints_trade_matches_sellOrderId_fkey" FOREIGN KEY ("sellOrderId") REFERENCES "fjn_tpoints_trade_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_nft_assets" ADD CONSTRAINT "fjn_nft_assets_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "fjn_nft_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_nft_benefits" ADD CONSTRAINT "fjn_nft_benefits_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fjn_nft_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_nft_ownerships" ADD CONSTRAINT "fjn_nft_ownerships_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fjn_nft_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_nft_upgrade_orders" ADD CONSTRAINT "fjn_nft_upgrade_orders_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fjn_nft_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_nft_chain_records" ADD CONSTRAINT "fjn_nft_chain_records_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fjn_nft_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_power_ledgers" ADD CONSTRAINT "fjn_power_ledgers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "fjn_power_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_power_snapshots" ADD CONSTRAINT "fjn_power_snapshots_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "fjn_power_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_release_calculations" ADD CONSTRAINT "fjn_release_calculations_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "fjn_release_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_release_claims" ADD CONSTRAINT "fjn_release_claims_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "fjn_release_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_referral_rewards" ADD CONSTRAINT "fjn_referral_rewards_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "fjn_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_team_rewards" ADD CONSTRAINT "fjn_team_rewards_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "fjn_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_node_rewards" ADD CONSTRAINT "fjn_node_rewards_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "fjn_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_node_rewards" ADD CONSTRAINT "fjn_node_rewards_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "fjn_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_node_service_records" ADD CONSTRAINT "fjn_node_service_records_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "fjn_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_mall_products" ADD CONSTRAINT "fjn_mall_products_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "fjn_merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_mall_orders" ADD CONSTRAINT "fjn_mall_orders_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "fjn_merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_mall_orders" ADD CONSTRAINT "fjn_mall_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "fjn_mall_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_mall_settlements" ADD CONSTRAINT "fjn_mall_settlements_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "fjn_merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_finance_ledgers" ADD CONSTRAINT "fjn_finance_ledgers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "fjn_finance_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_settlement_items" ADD CONSTRAINT "fjn_settlement_items_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "fjn_settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_tax_records" ADD CONSTRAINT "fjn_tax_records_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "fjn_tax_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_risk_events" ADD CONSTRAINT "fjn_risk_events_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "fjn_risk_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fjn_approval_steps" ADD CONSTRAINT "fjn_approval_steps_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "fjn_approval_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

