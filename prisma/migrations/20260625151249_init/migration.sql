-- Enable uuid-ossp extension (required for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "CoreUser" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "countryCode" CHAR(2) NOT NULL DEFAULT 'CN',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "kycLevel" INTEGER NOT NULL DEFAULT 0,
    "referralCode" VARCHAR(20),
    "referredBy" UUID,
    "userType" VARCHAR(20) NOT NULL DEFAULT 'retail',
    "vipLevel" INTEGER NOT NULL DEFAULT 0,
    "feeDiscount" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "tradingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "withdrawalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "depositEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMPTZ,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totpSecret" VARCHAR(255),
    "apiKeyCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "CoreUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreSession" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "token" VARCHAR(512) NOT NULL,
    "refreshToken" VARCHAR(512) NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "ipAddress" VARCHAR(50),
    "userAgent" VARCHAR(512),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoreSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreApiKey" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "apiKey" VARCHAR(255) NOT NULL,
    "secretKey" VARCHAR(255) NOT NULL,
    "permissions" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "lastUsedAt" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoreApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreUserProfile" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "firstName" VARCHAR(50),
    "lastName" VARCHAR(50),
    "avatar" VARCHAR(512),
    "bio" TEXT,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Shanghai',
    "language" VARCHAR(10) NOT NULL DEFAULT 'zh',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoreUserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreUserAddress" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "address" VARCHAR(512) NOT NULL,
    "tag" VARCHAR(50) NOT NULL,
    "city" VARCHAR(100),
    "province" VARCHAR(100),
    "country" VARCHAR(50) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoreUserAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreNotification" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" VARCHAR(512),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMPTZ,

    CONSTRAINT "CoreNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreRole" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoreRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreUserRole" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoreUserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreSystemConfig" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoreSystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreAppVersion" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "platform" VARCHAR(20) NOT NULL,
    "version" VARCHAR(30) NOT NULL,
    "buildNumber" VARCHAR(20) NOT NULL,
    "forceUpdate" BOOLEAN NOT NULL DEFAULT false,
    "changelog" TEXT,
    "downloadUrl" VARCHAR(512) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoreAppVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradePair" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "baseCurrency" VARCHAR(20) NOT NULL,
    "quoteCurrency" VARCHAR(20) NOT NULL,
    "symbol" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "basePrecision" INTEGER NOT NULL DEFAULT 8,
    "quotePrecision" INTEGER NOT NULL DEFAULT 8,
    "minOrderAmount" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "minOrderValue" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "makerFeeRate" DECIMAL(5,4) NOT NULL DEFAULT 0.001,
    "takerFeeRate" DECIMAL(5,4) NOT NULL DEFAULT 0.001,
    "priceTickSize" DECIMAL(36,18) NOT NULL DEFAULT 0.00000001,
    "amountTickSize" DECIMAL(36,18) NOT NULL DEFAULT 0.00000001,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradePair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeOrder" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "pairId" UUID NOT NULL,
    "symbol" VARCHAR(50) NOT NULL,
    "side" VARCHAR(10) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "price" DECIMAL(36,18),
    "amount" DECIMAL(36,18) NOT NULL,
    "filledAmount" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "executedValue" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "fee" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "feeCurrency" VARCHAR(20),
    "clientOrderId" VARCHAR(100),
    "stopPrice" DECIMAL(36,18),
    "timeInForce" VARCHAR(10) NOT NULL DEFAULT 'GTC',
    "source" VARCHAR(20) NOT NULL DEFAULT 'web',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMPTZ,

    CONSTRAINT "TradeOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeTrade" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "orderId" UUID NOT NULL,
    "counterOrderId" UUID NOT NULL,
    "pairId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "counterUserId" UUID NOT NULL,
    "symbol" VARCHAR(50) NOT NULL,
    "side" VARCHAR(10) NOT NULL,
    "price" DECIMAL(36,18) NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "value" DECIMAL(36,18) NOT NULL,
    "fee" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "feeCurrency" VARCHAR(20) NOT NULL,
    "liquidityType" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeBalance" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "currency" VARCHAR(20) NOT NULL,
    "balance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "available" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "frozen" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "locked" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeOrderBook" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "pairId" UUID NOT NULL,
    "symbol" VARCHAR(50) NOT NULL,
    "side" VARCHAR(10) NOT NULL,
    "price" DECIMAL(36,18) NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeOrderBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradePosition" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "symbol" VARCHAR(50) NOT NULL,
    "positionSide" VARCHAR(10) NOT NULL,
    "size" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "entryPrice" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "markPrice" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "unrealizedPnl" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "margin" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "leverage" INTEGER NOT NULL DEFAULT 1,
    "liquidationPrice" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "maintenanceMargin" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMPTZ,

    CONSTRAINT "TradePosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeTransaction" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "currency" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "balance" DECIMAL(36,18) NOT NULL,
    "description" VARCHAR(500),
    "referenceId" VARCHAR(100),
    "referenceType" VARCHAR(50),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeFeeRecord" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "tradeId" UUID,
    "orderId" UUID,
    "currency" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "type" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeFeeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletCurrency" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "symbol" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "blockchain" VARCHAR(50) NOT NULL,
    "contractAddress" VARCHAR(100),
    "isFiat" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "depositEnabled" BOOLEAN NOT NULL DEFAULT true,
    "withdrawalEnabled" BOOLEAN NOT NULL DEFAULT true,
    "minDepositAmount" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "minWithdrawalAmount" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "withdrawalFee" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "withdrawalFeeRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "confirmationCount" INTEGER NOT NULL DEFAULT 1,
    "explorerUrl" VARCHAR(512),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletCurrency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletDeposit" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "currencyId" UUID NOT NULL,
    "addressId" UUID NOT NULL,
    "txHash" VARCHAR(128) NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "fee" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "requiredConfirmations" INTEGER NOT NULL DEFAULT 1,
    "blockNumber" VARCHAR(50),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMPTZ,

    CONSTRAINT "WalletDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletWithdrawal" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "currencyId" UUID NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "fee" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(36,18) NOT NULL,
    "destinationAddress" VARCHAR(512) NOT NULL,
    "txHash" VARCHAR(128),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "memo" VARCHAR(200),
    "blockNumber" VARCHAR(50),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMPTZ,

    CONSTRAINT "WalletWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletAddress" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "currencyId" UUID NOT NULL,
    "address" VARCHAR(512) NOT NULL,
    "tag" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletHotCold" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type" VARCHAR(20) NOT NULL,
    "currencyId" UUID NOT NULL,
    "address" VARCHAR(512) NOT NULL,
    "balance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletHotCold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletInternalTransfer" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "fromUserId" UUID NOT NULL,
    "toUserId" UUID NOT NULL,
    "currency" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "WalletInternalTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycApplication" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "nationality" VARCHAR(50) NOT NULL,
    "idType" VARCHAR(50) NOT NULL,
    "idNumber" VARCHAR(100) NOT NULL,
    "idExpiryDate" TIMESTAMPTZ,
    "idFrontImage" VARCHAR(512) NOT NULL,
    "idBackImage" VARCHAR(512),
    "selfieImage" VARCHAR(512),
    "address" VARCHAR(500),
    "proofOfAddressImage" VARCHAR(512),
    "reviewedBy" UUID,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMPTZ,

    CONSTRAINT "KycApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycRiskAssessment" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "level" VARCHAR(20) NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "factors" JSONB NOT NULL,
    "recommendation" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KycRiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycComplianceFreeze" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "frozenAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unfrozenAt" TIMESTAMPTZ,
    "frozenBy" UUID NOT NULL,

    CONSTRAINT "KycComplianceFreeze_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketTicker" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "symbol" VARCHAR(50) NOT NULL,
    "pairId" UUID,
    "price" DECIMAL(36,18) NOT NULL,
    "open" DECIMAL(36,18) NOT NULL,
    "high" DECIMAL(36,18) NOT NULL,
    "low" DECIMAL(36,18) NOT NULL,
    "volume" DECIMAL(36,18) NOT NULL,
    "quoteVolume" DECIMAL(36,18) NOT NULL,
    "change" DECIMAL(10,4) NOT NULL,
    "changePercent" DECIMAL(10,4) NOT NULL,
    "bidPrice" DECIMAL(36,18) NOT NULL,
    "bidAmount" DECIMAL(36,18) NOT NULL,
    "askPrice" DECIMAL(36,18) NOT NULL,
    "askAmount" DECIMAL(36,18) NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketTicker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketKline" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "symbol" VARCHAR(50) NOT NULL,
    "interval" VARCHAR(20) NOT NULL,
    "openTime" TIMESTAMPTZ NOT NULL,
    "closeTime" TIMESTAMPTZ NOT NULL,
    "open" DECIMAL(36,18) NOT NULL,
    "high" DECIMAL(36,18) NOT NULL,
    "low" DECIMAL(36,18) NOT NULL,
    "close" DECIMAL(36,18) NOT NULL,
    "volume" DECIMAL(36,18) NOT NULL,
    "quoteVolume" DECIMAL(36,18) NOT NULL,
    "trades" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketKline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketDepth" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "symbol" VARCHAR(50) NOT NULL,
    "bids" JSONB NOT NULL,
    "asks" JSONB NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketDepth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSource" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(50) NOT NULL,
    "baseUrl" VARCHAR(512) NOT NULL,
    "apiKey" VARCHAR(255),
    "secretKey" VARCHAR(255),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketPriceDiscovery" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "symbol" VARCHAR(50) NOT NULL,
    "price" DECIMAL(36,18) NOT NULL,
    "sources" JSONB NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL DEFAULT 1,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketPriceDiscovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefiStakingPool" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "currency" VARCHAR(20) NOT NULL,
    "contractAddress" VARCHAR(100) NOT NULL,
    "apy" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "totalStaked" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "minStakeAmount" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "maxStakeAmount" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "lockupDays" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DefiStakingPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefiStaking" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "poolId" UUID NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "reward" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'staking',
    "stakedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlockedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DefiStaking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefiLiquidityPool" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "token0" VARCHAR(20) NOT NULL,
    "token1" VARCHAR(20) NOT NULL,
    "contractAddress" VARCHAR(100) NOT NULL,
    "tvl" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "apy" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "feeRate" DECIMAL(5,4) NOT NULL DEFAULT 0.003,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DefiLiquidityPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefiLiquidityPosition" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "poolId" UUID NOT NULL,
    "amount0" DECIMAL(36,18) NOT NULL,
    "amount1" DECIMAL(36,18) NOT NULL,
    "reward" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DefiLiquidityPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefiSwap" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "fromToken" VARCHAR(20) NOT NULL,
    "toToken" VARCHAR(20) NOT NULL,
    "fromAmount" DECIMAL(36,18) NOT NULL,
    "toAmount" DECIMAL(36,18) NOT NULL,
    "fee" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "txHash" VARCHAR(128),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "DefiSwap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefiReward" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "currency" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "referenceId" VARCHAR(100),
    "referenceType" VARCHAR(50),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DefiReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockchainTransaction" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "txHash" VARCHAR(128) NOT NULL,
    "chainId" VARCHAR(20) NOT NULL,
    "fromAddress" VARCHAR(512) NOT NULL,
    "toAddress" VARCHAR(512),
    "value" DECIMAL(36,18) NOT NULL,
    "gasUsed" DECIMAL(36,18) NOT NULL,
    "gasPrice" DECIMAL(36,18) NOT NULL,
    "blockNumber" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "data" TEXT,
    "decodedData" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMPTZ,

    CONSTRAINT "BlockchainTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockchainContract" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "chainId" VARCHAR(20) NOT NULL,
    "address" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "abi" JSONB NOT NULL,
    "bytecode" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockchainContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockchainNotarization" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "hash" VARCHAR(128) NOT NULL,
    "dataType" VARCHAR(50) NOT NULL,
    "dataHash" VARCHAR(128) NOT NULL,
    "chainId" VARCHAR(20) NOT NULL,
    "txHash" VARCHAR(128),
    "blockNumber" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMPTZ,

    CONSTRAINT "BlockchainNotarization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockchainNode" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "chainId" VARCHAR(20) NOT NULL,
    "rpcUrl" VARCHAR(512) NOT NULL,
    "wsUrl" VARCHAR(512),
    "apiKey" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockchainNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModel" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "modelId" VARCHAR(100) NOT NULL,
    "apiKey" VARCHAR(255),
    "baseUrl" VARCHAR(512),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "costPerToken" DECIMAL(15,10) NOT NULL DEFAULT 0,
    "maxTokens" INTEGER NOT NULL DEFAULT 4096,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCompletion" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "modelId" UUID NOT NULL,
    "userId" UUID,
    "prompt" TEXT NOT NULL,
    "response" TEXT,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(15,10) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "AiCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAgent" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "modelId" UUID NOT NULL,
    "tools" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAgentTask" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "agentId" UUID NOT NULL,
    "userId" UUID,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "steps" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "AiAgentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAnalysis" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type" VARCHAR(50) NOT NULL,
    "userId" UUID,
    "inputData" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "operatorId" UUID NOT NULL,
    "operatorName" VARCHAR(100) NOT NULL,
    "operatorRole" VARCHAR(50) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "details" TEXT,
    "status" VARCHAR(20) NOT NULL,
    "targetId" VARCHAR(100),
    "targetType" VARCHAR(50),
    "ipAddress" VARCHAR(50),
    "userAgent" VARCHAR(512),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditChangeLog" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tableName" VARCHAR(100) NOT NULL,
    "recordId" VARCHAR(100) NOT NULL,
    "operation" VARCHAR(20) NOT NULL,
    "beforeValue" JSONB,
    "afterValue" JSONB,
    "changedBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLoginLog" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID,
    "username" VARCHAR(50),
    "ipAddress" VARCHAR(50) NOT NULL,
    "userAgent" VARCHAR(512),
    "status" VARCHAR(20) NOT NULL,
    "errorMessage" VARCHAR(500),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditApiAccessLog" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID,
    "apiKeyId" UUID,
    "endpoint" VARCHAR(512) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 0,
    "responseTime" INTEGER NOT NULL DEFAULT 0,
    "requestSize" INTEGER NOT NULL DEFAULT 0,
    "responseSize" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditApiAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NftCategory" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "coverImage" VARCHAR(512),
    "contractAddress" VARCHAR(100) NOT NULL,
    "chainId" VARCHAR(20) NOT NULL,
    "totalSupply" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NftCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NftItem" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "categoryId" UUID NOT NULL,
    "tokenId" VARCHAR(100) NOT NULL,
    "ownerId" UUID,
    "metadata" JSONB NOT NULL,
    "imageUrl" VARCHAR(512),
    "mintedAt" TIMESTAMPTZ,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NftItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NftOrder" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "itemId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "buyerId" UUID,
    "price" DECIMAL(36,18) NOT NULL,
    "currency" VARCHAR(20) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "NftOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NftMint" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "tokenId" VARCHAR(100),
    "txHash" VARCHAR(128),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "NftMint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementBatch" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "startTime" TIMESTAMPTZ NOT NULL,
    "endTime" TIMESTAMPTZ NOT NULL,
    "totalAmount" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "currency" VARCHAR(20) NOT NULL,
    "recordsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "SettlementBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementRecord" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "batchId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "currency" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "balance" DECIMAL(36,18) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "referenceId" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementClearing" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tradeId" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "currency" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "fee" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "SettlementClearing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoreUser_username_key" ON "CoreUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "CoreUser_email_key" ON "CoreUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CoreUser_referralCode_key" ON "CoreUser"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "CoreSession_token_key" ON "CoreSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CoreSession_refreshToken_key" ON "CoreSession"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "CoreApiKey_apiKey_key" ON "CoreApiKey"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "CoreRole_name_key" ON "CoreRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CoreSystemConfig_key_key" ON "CoreSystemConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "TradePair_symbol_key" ON "TradePair"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "WalletCurrency_symbol_key" ON "WalletCurrency"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "WalletDeposit_txHash_key" ON "WalletDeposit"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "WalletAddress_address_key" ON "WalletAddress"("address");

-- CreateIndex
CREATE UNIQUE INDEX "MarketSource_name_key" ON "MarketSource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainTransaction_txHash_key" ON "BlockchainTransaction"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainContract_address_key" ON "BlockchainContract"("address");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainNotarization_hash_key" ON "BlockchainNotarization"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "AiModel_name_key" ON "AiModel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AiAgent_name_key" ON "AiAgent"("name");

-- AddForeignKey
ALTER TABLE "CoreSession" ADD CONSTRAINT "CoreSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CoreUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreApiKey" ADD CONSTRAINT "CoreApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CoreUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreUserProfile" ADD CONSTRAINT "CoreUserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CoreUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreUserAddress" ADD CONSTRAINT "CoreUserAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CoreUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreNotification" ADD CONSTRAINT "CoreNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CoreUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreUserRole" ADD CONSTRAINT "CoreUserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CoreUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreUserRole" ADD CONSTRAINT "CoreUserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CoreRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeOrder" ADD CONSTRAINT "TradeOrder_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "TradePair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeTrade" ADD CONSTRAINT "TradeTrade_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TradeOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeTrade" ADD CONSTRAINT "TradeTrade_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "TradePair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeOrderBook" ADD CONSTRAINT "TradeOrderBook_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "TradePair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletDeposit" ADD CONSTRAINT "WalletDeposit_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "WalletCurrency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletDeposit" ADD CONSTRAINT "WalletDeposit_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "WalletAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletWithdrawal" ADD CONSTRAINT "WalletWithdrawal_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "WalletCurrency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletAddress" ADD CONSTRAINT "WalletAddress_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "WalletCurrency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletHotCold" ADD CONSTRAINT "WalletHotCold_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "WalletCurrency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefiStaking" ADD CONSTRAINT "DefiStaking_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "DefiStakingPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefiLiquidityPosition" ADD CONSTRAINT "DefiLiquidityPosition_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "DefiLiquidityPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiCompletion" ADD CONSTRAINT "AiCompletion_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AiModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgent" ADD CONSTRAINT "AiAgent_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AiModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgentTask" ADD CONSTRAINT "AiAgentTask_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AiAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NftItem" ADD CONSTRAINT "NftItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "NftCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NftOrder" ADD CONSTRAINT "NftOrder_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "NftItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NftMint" ADD CONSTRAINT "NftMint_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "NftCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementRecord" ADD CONSTRAINT "SettlementRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "SettlementBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
