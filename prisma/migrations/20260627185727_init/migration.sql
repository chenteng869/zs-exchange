-- CreateEnum
CREATE TYPE "TransferChainType" AS ENUM ('evm', 'tron', 'solana');

-- CreateEnum
CREATE TYPE "DepositAddressStatus" AS ENUM ('active', 'disabled', 'archived');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('detected', 'confirming', 'confirmed', 'credited', 'failed', 'ignored', 'orphaned');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('created', 'risk_checking', 'waiting_approval', 'approved', 'signing', 'signed', 'broadcasting', 'broadcasted', 'confirming', 'confirmed', 'failed', 'rejected', 'canceled');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired', 'canceled');

-- CreateEnum
CREATE TYPE "HotWalletRole" AS ENUM ('hot', 'warm', 'cold', 'fee', 'sweep');

-- CreateEnum
CREATE TYPE "HotWalletStatus" AS ENUM ('active', 'frozen', 'disabled', 'maintenance');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('in', 'out');

-- CreateEnum
CREATE TYPE "LedgerBizType" AS ENUM ('deposit', 'withdraw', 'fee', 'sweep', 'rebalance', 'manual_adjust', 'correction');

-- CreateEnum
CREATE TYPE "LockStatus" AS ENUM ('locked', 'released', 'consumed', 'expired');

-- CreateEnum
CREATE TYPE "SweepTaskStatus" AS ENUM ('pending', 'signing', 'signed', 'broadcasting', 'broadcasted', 'confirmed', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "ChainTxStatus" AS ENUM ('created', 'signed', 'broadcasted', 'confirmed', 'failed', 'dropped', 'replaced');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('pending', 'matched', 'mismatched', 'resolved', 'ignored');

-- CreateEnum
CREATE TYPE "SpotMarketStatus" AS ENUM ('trading', 'pending', 'suspended', 'delisted');

-- CreateEnum
CREATE TYPE "SpotOrderSide" AS ENUM ('buy', 'sell');

-- CreateEnum
CREATE TYPE "SpotOrderType" AS ENUM ('limit', 'market', 'stop_limit', 'stop_market');

-- CreateEnum
CREATE TYPE "SpotOrderStatus" AS ENUM ('pending', 'open', 'partially_filled', 'filled', 'canceled', 'expired', 'failed');

-- CreateEnum
CREATE TYPE "SpotOrderTimeInForce" AS ENUM ('GTC', 'IOC', 'FOK', 'GTD');

-- CreateEnum
CREATE TYPE "SpotTradeRole" AS ENUM ('maker', 'taker');

-- CreateEnum
CREATE TYPE "SpotAccountLedgerType" AS ENUM ('trade', 'fee', 'transfer_in', 'transfer_out', 'adjustment');

-- CreateTable
CREATE TABLE "wallet_address_books" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "chainType" "TransferChainType" NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "assetSymbol" VARCHAR(64) NOT NULL,
    "contractAddress" VARCHAR(255),
    "address" VARCHAR(255) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wallet_address_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_deposit_addresses" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "walletId" UUID,
    "chainType" "TransferChainType" NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "memo" VARCHAR(128),
    "derivationPath" VARCHAR(128),
    "addressIndex" INTEGER NOT NULL DEFAULT 0,
    "addressType" VARCHAR(32) NOT NULL DEFAULT 'deposit',
    "status" "DepositAddressStatus" NOT NULL DEFAULT 'active',
    "lastUsedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wallet_deposit_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_chain_cursors" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "chainType" "TransferChainType" NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "scannerName" VARCHAR(64) NOT NULL,
    "currentBlock" BIGINT NOT NULL DEFAULT 0,
    "safeBlock" BIGINT NOT NULL DEFAULT 0,
    "latestBlock" BIGINT NOT NULL DEFAULT 0,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "errorMessage" VARCHAR(1024),
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_chain_cursors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_deposit_records" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "depositNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "walletId" UUID,
    "chainType" "TransferChainType" NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "txHash" VARCHAR(255) NOT NULL,
    "logIndex" INTEGER,
    "instructionIndex" INTEGER,
    "innerInstructionIndex" INTEGER,
    "fromAddress" VARCHAR(255),
    "toAddress" VARCHAR(255) NOT NULL,
    "assetSymbol" VARCHAR(64) NOT NULL,
    "contractAddress" VARCHAR(255),
    "tokenAccount" VARCHAR(255),
    "amount" DECIMAL(65,18) NOT NULL,
    "amountRaw" VARCHAR(255),
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "blockNumber" BIGINT NOT NULL,
    "blockHash" VARCHAR(255),
    "blockTime" TIMESTAMPTZ,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "requiredConfirmations" INTEGER NOT NULL DEFAULT 12,
    "status" "DepositStatus" NOT NULL DEFAULT 'detected',
    "failureReason" VARCHAR(1024),
    "detectedAt" TIMESTAMPTZ NOT NULL,
    "confirmedAt" TIMESTAMPTZ,
    "creditedAt" TIMESTAMPTZ,
    "ignoredAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wallet_deposit_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_user_asset_balances" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "walletId" UUID,
    "chainType" "TransferChainType" NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "assetSymbol" VARCHAR(64) NOT NULL,
    "contractAddress" VARCHAR(255),
    "available" DECIMAL(65,18) NOT NULL DEFAULT 0,
    "frozen" DECIMAL(65,18) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_user_asset_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_user_asset_ledgers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ledgerNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "walletId" UUID,
    "chainType" "TransferChainType" NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "assetSymbol" VARCHAR(64) NOT NULL,
    "contractAddress" VARCHAR(255),
    "direction" "LedgerDirection" NOT NULL,
    "bizType" "LedgerBizType" NOT NULL,
    "bizNo" VARCHAR(64) NOT NULL,
    "amount" DECIMAL(65,18) NOT NULL,
    "balanceBefore" DECIMAL(65,18) NOT NULL,
    "balanceAfter" DECIMAL(65,18) NOT NULL,
    "remark" VARCHAR(512),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_user_asset_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_withdrawal_records" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "withdrawNo" VARCHAR(64) NOT NULL,
    "idempotencyKey" VARCHAR(128),
    "userId" UUID NOT NULL,
    "walletId" UUID,
    "chainType" "TransferChainType" NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "fromAddress" VARCHAR(255),
    "toAddress" VARCHAR(255) NOT NULL,
    "assetSymbol" VARCHAR(64) NOT NULL,
    "contractAddress" VARCHAR(255),
    "amount" DECIMAL(65,18) NOT NULL,
    "feeAmount" DECIMAL(65,18) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(65,18) NOT NULL,
    "txHash" VARCHAR(255),
    "nonce" BIGINT,
    "rawTxRef" VARCHAR(255),
    "signedTxHash" VARCHAR(255),
    "hotWalletNo" VARCHAR(64),
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" VARCHAR(32) NOT NULL DEFAULT 'low',
    "approvalNo" VARCHAR(64),
    "approvalStatus" "ApprovalStatus",
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'created',
    "failureReason" VARCHAR(1024),
    "requestedAt" TIMESTAMPTZ NOT NULL,
    "approvedAt" TIMESTAMPTZ,
    "signedAt" TIMESTAMPTZ,
    "broadcastAt" TIMESTAMPTZ,
    "confirmedAt" TIMESTAMPTZ,
    "failedAt" TIMESTAMPTZ,
    "canceledAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wallet_withdrawal_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_withdrawal_approvals" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "approvalNo" VARCHAR(64) NOT NULL,
    "withdrawNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "walletId" UUID,
    "orgId" UUID,
    "requiredCount" INTEGER NOT NULL DEFAULT 1,
    "approvedCount" INTEGER NOT NULL DEFAULT 0,
    "approverRoles" JSONB,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "reason" VARCHAR(512),
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "approvedAt" TIMESTAMPTZ,
    "rejectedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wallet_withdrawal_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_withdrawal_approval_decisions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "approvalNo" VARCHAR(64) NOT NULL,
    "withdrawNo" VARCHAR(64) NOT NULL,
    "approverId" UUID NOT NULL,
    "approverRole" VARCHAR(64) NOT NULL,
    "decision" VARCHAR(32) NOT NULL,
    "reason" VARCHAR(512),
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_withdrawal_approval_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_hot_wallets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "walletNo" VARCHAR(64) NOT NULL,
    "chainType" "TransferChainType" NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "assetSymbol" VARCHAR(64),
    "contractAddress" VARCHAR(255),
    "walletRole" "HotWalletRole" NOT NULL DEFAULT 'hot',
    "balance" DECIMAL(65,18) NOT NULL DEFAULT 0,
    "availableBalance" DECIMAL(65,18) NOT NULL DEFAULT 0,
    "lockedBalance" DECIMAL(65,18) NOT NULL DEFAULT 0,
    "minBalance" DECIMAL(65,18) NOT NULL DEFAULT 0,
    "maxBalance" DECIMAL(65,18) NOT NULL DEFAULT 0,
    "sweepThreshold" DECIMAL(65,18) NOT NULL DEFAULT 0,
    "dailyLimit" DECIMAL(65,18),
    "singleLimit" DECIMAL(65,18),
    "keyRef" VARCHAR(255),
    "provider" VARCHAR(64),
    "status" "HotWalletStatus" NOT NULL DEFAULT 'active',
    "lastSyncAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wallet_hot_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_hot_wallet_ledgers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ledgerNo" VARCHAR(64) NOT NULL,
    "walletNo" VARCHAR(64) NOT NULL,
    "chainType" "TransferChainType" NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "assetSymbol" VARCHAR(64) NOT NULL,
    "contractAddress" VARCHAR(255),
    "direction" "LedgerDirection" NOT NULL,
    "bizType" "LedgerBizType" NOT NULL,
    "bizNo" VARCHAR(64) NOT NULL,
    "amount" DECIMAL(65,18) NOT NULL,
    "balanceBefore" DECIMAL(65,18) NOT NULL,
    "balanceAfter" DECIMAL(65,18) NOT NULL,
    "remark" VARCHAR(512),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_hot_wallet_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_hot_wallet_locks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "lockNo" VARCHAR(64) NOT NULL,
    "walletNo" VARCHAR(64) NOT NULL,
    "bizType" VARCHAR(64) NOT NULL,
    "bizNo" VARCHAR(64) NOT NULL,
    "assetSymbol" VARCHAR(64) NOT NULL,
    "contractAddress" VARCHAR(255),
    "amount" DECIMAL(65,18) NOT NULL,
    "status" "LockStatus" NOT NULL DEFAULT 'locked',
    "lockedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMPTZ,
    "consumedAt" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wallet_hot_wallet_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_sweep_tasks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "sweepNo" VARCHAR(64) NOT NULL,
    "chainType" "TransferChainType" NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "fromAddress" VARCHAR(255) NOT NULL,
    "toAddress" VARCHAR(255) NOT NULL,
    "assetSymbol" VARCHAR(64) NOT NULL,
    "contractAddress" VARCHAR(255),
    "amount" DECIMAL(65,18) NOT NULL,
    "feeAmount" DECIMAL(65,18) NOT NULL DEFAULT 0,
    "txHash" VARCHAR(255),
    "rawTxRef" VARCHAR(255),
    "status" "SweepTaskStatus" NOT NULL DEFAULT 'pending',
    "failureReason" VARCHAR(1024),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "broadcastAt" TIMESTAMPTZ,
    "confirmedAt" TIMESTAMPTZ,

    CONSTRAINT "wallet_sweep_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_chain_transactions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "chainTxNo" VARCHAR(64) NOT NULL,
    "bizType" VARCHAR(64) NOT NULL,
    "bizNo" VARCHAR(64) NOT NULL,
    "chainType" "TransferChainType" NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "txHash" VARCHAR(255),
    "nonce" BIGINT,
    "fromAddress" VARCHAR(255),
    "toAddress" VARCHAR(255),
    "assetSymbol" VARCHAR(64),
    "contractAddress" VARCHAR(255),
    "amount" DECIMAL(65,18),
    "rawTxRef" VARCHAR(255),
    "signedTxHash" VARCHAR(255),
    "blockNumber" BIGINT,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "status" "ChainTxStatus" NOT NULL DEFAULT 'created',
    "failureReason" VARCHAR(1024),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "broadcastAt" TIMESTAMPTZ,
    "confirmedAt" TIMESTAMPTZ,

    CONSTRAINT "wallet_chain_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_reconciliation_records" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reconcileNo" VARCHAR(64) NOT NULL,
    "chainType" "TransferChainType" NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "bizType" VARCHAR(64) NOT NULL,
    "bizNo" VARCHAR(64) NOT NULL,
    "txHash" VARCHAR(255),
    "assetSymbol" VARCHAR(64) NOT NULL,
    "contractAddress" VARCHAR(255),
    "systemAmount" DECIMAL(65,18),
    "chainAmount" DECIMAL(65,18),
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'pending',
    "difference" DECIMAL(65,18),
    "reason" VARCHAR(1024),
    "checkedAt" TIMESTAMPTZ,
    "resolvedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wallet_reconciliation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpContract" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "symbol" VARCHAR(64) NOT NULL,
    "baseAsset" VARCHAR(32) NOT NULL,
    "quoteAsset" VARCHAR(32) NOT NULL,
    "marginAsset" VARCHAR(32) NOT NULL,
    "contractType" VARCHAR(32) NOT NULL DEFAULT 'perpetual',
    "maxLeverage" INTEGER NOT NULL DEFAULT 20,
    "minOrderQty" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "maxOrderQty" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "maxPositionQty" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "initialMarginRate" DECIMAL(18,8) NOT NULL,
    "maintenanceMarginRate" DECIMAL(18,8) NOT NULL,
    "makerFeeRate" DECIMAL(18,8) NOT NULL,
    "takerFeeRate" DECIMAL(18,8) NOT NULL,
    "fundingIntervalMinutes" INTEGER NOT NULL DEFAULT 480,
    "fundingCap" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "fundingFloor" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "pricePrecision" INTEGER NOT NULL DEFAULT 2,
    "qtyPrecision" INTEGER NOT NULL DEFAULT 4,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerpContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpAccount" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "accountType" VARCHAR(32) NOT NULL,
    "asset" VARCHAR(32) NOT NULL,
    "balance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "availableBalance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "frozenBalance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "marginBalance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "unrealizedPnl" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "realizedPnl" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "fundingFeePaid" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "fundingFeeReceived" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "riskRate" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerpAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpPosition" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "symbol" VARCHAR(64) NOT NULL,
    "side" VARCHAR(16) NOT NULL,
    "positionQty" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "entryPrice" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "markPrice" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "liquidationPrice" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "leverage" INTEGER NOT NULL DEFAULT 1,
    "marginMode" VARCHAR(16) NOT NULL,
    "isolatedMargin" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "crossMarginUsed" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "positionMargin" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "unrealizedPnl" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "realizedPnl" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "feePaid" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "fundingFeePaid" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "openTime" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closeTime" TIMESTAMPTZ,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',

    CONSTRAINT "PerpPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpOrder" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "orderNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "symbol" VARCHAR(64) NOT NULL,
    "side" VARCHAR(16) NOT NULL,
    "positionSide" VARCHAR(16) NOT NULL,
    "orderType" VARCHAR(32) NOT NULL,
    "price" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "qty" DECIMAL(36,18) NOT NULL,
    "filledQty" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "avgFillPrice" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "leverage" INTEGER NOT NULL DEFAULT 1,
    "marginMode" VARCHAR(16) NOT NULL,
    "reduceOnly" BOOLEAN NOT NULL DEFAULT false,
    "postOnly" BOOLEAN NOT NULL DEFAULT false,
    "timeInForce" VARCHAR(16) NOT NULL DEFAULT 'GTC',
    "triggerPrice" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "stopPrice" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "clientOrderId" VARCHAR(64),
    "source" VARCHAR(32) NOT NULL DEFAULT 'api',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceledAt" TIMESTAMPTZ,
    "positionId" UUID,

    CONSTRAINT "PerpOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpTrade" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tradeNo" VARCHAR(64) NOT NULL,
    "orderId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "positionId" UUID,
    "symbol" VARCHAR(64) NOT NULL,
    "side" VARCHAR(16) NOT NULL,
    "positionSide" VARCHAR(16) NOT NULL,
    "price" DECIMAL(36,18) NOT NULL,
    "qty" DECIMAL(36,18) NOT NULL,
    "notional" DECIMAL(36,18) NOT NULL,
    "makerFee" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "takerFee" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "realizedPnl" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "liquidityRole" VARCHAR(16) NOT NULL,
    "tradeTime" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerpTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpIndexPrice" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "symbol" VARCHAR(64) NOT NULL,
    "indexPrice" DECIMAL(36,18) NOT NULL,
    "sourcePrice" DECIMAL(36,18) NOT NULL,
    "sourceWeight" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "source" VARCHAR(64) NOT NULL,
    "priceTime" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractId" UUID NOT NULL,

    CONSTRAINT "PerpIndexPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpMarkPrice" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "symbol" VARCHAR(64) NOT NULL,
    "indexPrice" DECIMAL(36,18) NOT NULL,
    "premiumIndex" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "markPrice" DECIMAL(36,18) NOT NULL,
    "fundingRate" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "priceTime" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractId" UUID NOT NULL,

    CONSTRAINT "PerpMarkPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpFundingRate" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "symbol" VARCHAR(64) NOT NULL,
    "premiumIndex" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "interestRate" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "fundingRate" DECIMAL(18,8) NOT NULL,
    "fundingCap" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "fundingFloor" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "indexPrice" DECIMAL(36,18) NOT NULL,
    "markPrice" DECIMAL(36,18) NOT NULL,
    "fundingTime" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractId" UUID NOT NULL,

    CONSTRAINT "PerpFundingRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpFundingPayment" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "paymentNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "positionId" UUID NOT NULL,
    "symbol" VARCHAR(64) NOT NULL,
    "fundingRate" DECIMAL(18,8) NOT NULL,
    "fundingAmount" DECIMAL(36,18) NOT NULL,
    "direction" VARCHAR(16) NOT NULL,
    "fundingTime" TIMESTAMPTZ NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractId" UUID NOT NULL,

    CONSTRAINT "PerpFundingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpLiquidation" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "liquidationNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "positionId" UUID NOT NULL,
    "symbol" VARCHAR(64) NOT NULL,
    "side" VARCHAR(16) NOT NULL,
    "liquidationQty" DECIMAL(36,18) NOT NULL,
    "liquidationPrice" DECIMAL(36,18) NOT NULL,
    "bankruptcyPrice" DECIMAL(36,18) NOT NULL,
    "markPrice" DECIMAL(36,18) NOT NULL,
    "liquidationValue" DECIMAL(36,18) NOT NULL,
    "realizedPnl" DECIMAL(36,18) NOT NULL,
    "fee" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "insuranceFundUsed" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "adlTriggered" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "reason" VARCHAR(255),
    "liquidationTime" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractId" UUID NOT NULL,

    CONSTRAINT "PerpLiquidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpInsuranceFund" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "symbol" VARCHAR(64) NOT NULL,
    "balance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "totalContributed" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "totalUsed" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "asset" VARCHAR(32) NOT NULL,
    "contractId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerpInsuranceFund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpLedger" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ledgerNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "asset" VARCHAR(32) NOT NULL,
    "changeAmount" DECIMAL(36,18) NOT NULL,
    "balanceAfter" DECIMAL(36,18) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "direction" VARCHAR(16) NOT NULL,
    "referenceId" VARCHAR(100),
    "referenceType" VARCHAR(50),
    "description" VARCHAR(500),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerpLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpRiskConfig" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "symbol" VARCHAR(64) NOT NULL,
    "maxLeverage" INTEGER NOT NULL DEFAULT 125,
    "maxPositionValue" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "maxOpenOrderValue" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "maxDailyLoss" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "priceDeviationLimit" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "marginModeAllowed" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerpRiskConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpAuditLog" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "operatorId" UUID NOT NULL,
    "operatorName" VARCHAR(100) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "details" TEXT,
    "status" VARCHAR(20) NOT NULL,
    "targetId" VARCHAR(100),
    "targetType" VARCHAR(50),
    "ipAddress" VARCHAR(50),
    "userAgent" VARCHAR(512),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerpAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3WalletProfile" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "walletNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "walletType" VARCHAR(32) NOT NULL,
    "label" VARCHAR(128),
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "riskLevel" VARCHAR(32) NOT NULL DEFAULT 'normal',
    "primaryChainType" VARCHAR(32),
    "lastUsedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3WalletProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3WalletKeyMaterial" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "walletId" UUID NOT NULL,
    "keyType" VARCHAR(32) NOT NULL,
    "encryptionVersion" VARCHAR(32) NOT NULL DEFAULT 'v1',
    "encryptedMnemonic" TEXT,
    "encryptedPrivateKey" TEXT,
    "publicKey" TEXT,
    "keyRef" VARCHAR(255),
    "derivationRoot" VARCHAR(128),
    "kmsProvider" VARCHAR(64),
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3WalletKeyMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3WalletAddress" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "walletId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "chainType" VARCHAR(32) NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "publicKey" TEXT,
    "derivationPath" VARCHAR(128),
    "addressIndex" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isWatchOnly" BOOLEAN NOT NULL DEFAULT false,
    "label" VARCHAR(128),
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3WalletAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3WalletChainConfig" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "chainType" VARCHAR(32) NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "chainName" VARCHAR(128) NOT NULL,
    "rpcUrl" VARCHAR(512) NOT NULL,
    "wsUrl" VARCHAR(512),
    "explorerUrl" VARCHAR(512),
    "nativeTokenSymbol" VARCHAR(32) NOT NULL,
    "nativeTokenDecimals" INTEGER NOT NULL DEFAULT 18,
    "confirmationBlocks" INTEGER NOT NULL DEFAULT 12,
    "gasTokenSymbol" VARCHAR(32),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3WalletChainConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3WalletAsset" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "chainType" VARCHAR(32) NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "symbol" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128),
    "contractAddress" VARCHAR(255),
    "tokenStandard" VARCHAR(32),
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "logoUrl" VARCHAR(512),
    "isNative" BOOLEAN NOT NULL DEFAULT false,
    "isStablecoin" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" VARCHAR(32) NOT NULL DEFAULT 'normal',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3WalletAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3WalletBalanceSnapshot" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "walletId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "addressId" UUID NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "chainType" VARCHAR(32) NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "assetSymbol" VARCHAR(64) NOT NULL,
    "contractAddress" VARCHAR(255),
    "balance" DECIMAL(65,18) NOT NULL DEFAULT 0,
    "balanceUsd" DECIMAL(36,8),
    "blockNumber" BIGINT,
    "snapshotTime" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3WalletBalanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3WalletTransaction" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "txNo" VARCHAR(64) NOT NULL,
    "walletId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "chainType" VARCHAR(32) NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "txHash" VARCHAR(255),
    "txType" VARCHAR(32) NOT NULL,
    "fromAddress" VARCHAR(255) NOT NULL,
    "toAddress" VARCHAR(255),
    "assetSymbol" VARCHAR(64),
    "contractAddress" VARCHAR(255),
    "value" DECIMAL(65,18) NOT NULL DEFAULT 0,
    "valueUsd" DECIMAL(36,8),
    "gasLimit" DECIMAL(65,18),
    "gasUsed" DECIMAL(65,18),
    "gasPrice" DECIMAL(65,18),
    "maxFeePerGas" DECIMAL(65,18),
    "maxPriorityFeePerGas" DECIMAL(65,18),
    "nonce" BIGINT,
    "rawTx" TEXT,
    "txData" TEXT,
    "blockNumber" BIGINT,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(32) NOT NULL DEFAULT 'draft',
    "failureReason" VARCHAR(512),
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" VARCHAR(32) NOT NULL DEFAULT 'low',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "broadcastAt" TIMESTAMPTZ,
    "confirmedAt" TIMESTAMPTZ,

    CONSTRAINT "Web3WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3WalletSignatureRequest" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "requestNo" VARCHAR(64) NOT NULL,
    "walletId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "chainType" VARCHAR(32) NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "signType" VARCHAR(32) NOT NULL,
    "payloadHash" VARCHAR(255),
    "payload" TEXT NOT NULL,
    "signature" TEXT,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" VARCHAR(32) NOT NULL DEFAULT 'low',
    "rejectReason" VARCHAR(512),
    "expiresAt" TIMESTAMPTZ,
    "signedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3WalletSignatureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3WalletDappSession" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "sessionNo" VARCHAR(64) NOT NULL,
    "walletId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "dappName" VARCHAR(128),
    "dappDomain" VARCHAR(255) NOT NULL,
    "dappUrl" VARCHAR(512),
    "dappIcon" VARCHAR(512),
    "walletconnectTopic" VARCHAR(255),
    "chainIds" JSONB,
    "permissions" JSONB,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "riskLevel" VARCHAR(32) NOT NULL DEFAULT 'low',
    "connectedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMPTZ,
    "revokedAt" TIMESTAMPTZ,

    CONSTRAINT "Web3WalletDappSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3WalletApproval" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "walletId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "chainType" VARCHAR(32) NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "ownerAddress" VARCHAR(255) NOT NULL,
    "spenderAddress" VARCHAR(255) NOT NULL,
    "assetSymbol" VARCHAR(64) NOT NULL,
    "contractAddress" VARCHAR(255),
    "approvedAmount" DECIMAL(65,18) NOT NULL DEFAULT 0,
    "usedAmount" DECIMAL(65,18) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(65,18) NOT NULL DEFAULT 0,
    "isUnlimited" BOOLEAN NOT NULL DEFAULT false,
    "isNft" BOOLEAN NOT NULL DEFAULT false,
    "tokenId" VARCHAR(128),
    "txHash" VARCHAR(255),
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "riskLevel" VARCHAR(32) NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ,

    CONSTRAINT "Web3WalletApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3WalletSecurityEvent" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "eventNo" VARCHAR(64) NOT NULL,
    "walletId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "eventType" VARCHAR(64) NOT NULL,
    "severity" VARCHAR(32) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "source" VARCHAR(64) NOT NULL,
    "ruleCode" VARCHAR(64),
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(32) NOT NULL DEFAULT 'new',
    "ipAddress" VARCHAR(50),
    "deviceId" VARCHAR(128),
    "userAgent" VARCHAR(512),
    "location" VARCHAR(255),
    "metadata" JSONB,
    "handledBy" UUID,
    "handledAt" TIMESTAMPTZ,
    "handleNote" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3WalletSecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3WalletRecoveryRequest" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "requestNo" VARCHAR(64) NOT NULL,
    "walletId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "recoveryType" VARCHAR(32) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "verifierEmail" VARCHAR(255),
    "verifierPhone" VARCHAR(32),
    "kycVerified" BOOLEAN NOT NULL DEFAULT false,
    "socialRecoveryCount" INTEGER NOT NULL DEFAULT 0,
    "requiredConfirmations" INTEGER NOT NULL DEFAULT 2,
    "newAddress" VARCHAR(255),
    "rejectReason" VARCHAR(512),
    "expiresAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3WalletRecoveryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3WalletAddressBook" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "chainType" VARCHAR(32) NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "label" VARCHAR(128) NOT NULL,
    "notes" VARCHAR(512),
    "isWhitelist" BOOLEAN NOT NULL DEFAULT false,
    "isBlacklist" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" VARCHAR(32) NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3WalletAddressBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3WalletAuditLog" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "auditNo" VARCHAR(64) NOT NULL,
    "domain" VARCHAR(32) NOT NULL,
    "action" VARCHAR(64) NOT NULL,
    "userId" UUID,
    "walletId" UUID,
    "operatorId" UUID,
    "operatorName" VARCHAR(128),
    "targetId" VARCHAR(128),
    "targetType" VARCHAR(64),
    "beforeState" JSONB,
    "afterState" JSONB,
    "changes" JSONB,
    "ipAddress" VARCHAR(50),
    "userAgent" VARCHAR(512),
    "requestId" VARCHAR(128),
    "status" VARCHAR(32) NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3WalletAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3RiskRule" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ruleCode" VARCHAR(64) NOT NULL,
    "ruleName" VARCHAR(128) NOT NULL,
    "ruleType" VARCHAR(32) NOT NULL,
    "description" TEXT,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" VARCHAR(32) NOT NULL DEFAULT 'medium',
    "action" VARCHAR(32) NOT NULL DEFAULT 'warn',
    "config" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3RiskRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3RiskBlacklist" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "category" VARCHAR(32) NOT NULL,
    "chainType" VARCHAR(32),
    "address" VARCHAR(255) NOT NULL,
    "label" VARCHAR(128),
    "description" TEXT,
    "riskLevel" VARCHAR(32) NOT NULL DEFAULT 'high',
    "source" VARCHAR(64) NOT NULL,
    "addedBy" UUID,
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3RiskBlacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3RiskPhishingDomain" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "domain" VARCHAR(255) NOT NULL,
    "domainType" VARCHAR(32) NOT NULL,
    "label" VARCHAR(128),
    "description" TEXT,
    "riskLevel" VARCHAR(32) NOT NULL DEFAULT 'critical',
    "source" VARCHAR(64) NOT NULL,
    "detectedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3RiskPhishingDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3MpcWallet" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "walletNo" VARCHAR(64) NOT NULL,
    "walletId" UUID NOT NULL,
    "orgId" UUID,
    "vaultId" VARCHAR(128) NOT NULL,
    "provider" VARCHAR(64) NOT NULL,
    "custodyType" VARCHAR(32) NOT NULL,
    "chainType" VARCHAR(32) NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "publicKey" TEXT,
    "keyRef" VARCHAR(255) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3MpcWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3MpcSigningRequest" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "requestNo" VARCHAR(64) NOT NULL,
    "mpcWalletId" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "chainType" VARCHAR(32) NOT NULL,
    "chainId" VARCHAR(64) NOT NULL,
    "signType" VARCHAR(32) NOT NULL,
    "payload" TEXT NOT NULL,
    "payloadHash" VARCHAR(255),
    "signature" TEXT,
    "status" VARCHAR(32) NOT NULL DEFAULT 'created',
    "currentStage" VARCHAR(32) NOT NULL DEFAULT 'risk_checking',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" VARCHAR(32) NOT NULL DEFAULT 'low',
    "policyResult" JSONB,
    "approvalWorkflowId" UUID,
    "providerRequestId" VARCHAR(128),
    "rejectReason" VARCHAR(512),
    "expiresAt" TIMESTAMPTZ,
    "signedAt" TIMESTAMPTZ,
    "broadcastAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3MpcSigningRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3MpcPolicy" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "policyNo" VARCHAR(64) NOT NULL,
    "policyName" VARCHAR(128) NOT NULL,
    "orgId" UUID,
    "vaultId" VARCHAR(128),
    "policyType" VARCHAR(32) NOT NULL,
    "description" TEXT,
    "rules" JSONB,
    "approvers" JSONB,
    "threshold" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3MpcPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3ApprovalWorkflow" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "workflowNo" VARCHAR(64) NOT NULL,
    "requestType" VARCHAR(32) NOT NULL,
    "requestId" VARCHAR(128) NOT NULL,
    "walletId" UUID,
    "userId" UUID NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "totalSteps" INTEGER NOT NULL DEFAULT 1,
    "requiredApprovals" INTEGER NOT NULL DEFAULT 1,
    "receivedApprovals" INTEGER NOT NULL DEFAULT 0,
    "approvers" JSONB,
    "approvals" JSONB,
    "rejectReason" VARCHAR(512),
    "expiresAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3ApprovalWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3ComplianceReport" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reportNo" VARCHAR(64) NOT NULL,
    "reportType" VARCHAR(32) NOT NULL,
    "reportFormat" VARCHAR(16) NOT NULL DEFAULT 'pdf',
    "userId" UUID,
    "walletId" UUID,
    "orgId" UUID,
    "periodStart" TIMESTAMPTZ NOT NULL,
    "periodEnd" TIMESTAMPTZ NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'generating',
    "fileUrl" VARCHAR(512),
    "fileSize" BIGINT,
    "generatedBy" UUID,
    "generatedAt" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3ComplianceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3EvidencePack" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "packNo" VARCHAR(64) NOT NULL,
    "caseId" VARCHAR(64) NOT NULL,
    "caseType" VARCHAR(32) NOT NULL,
    "userId" UUID,
    "walletId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "items" JSONB,
    "fileUrl" VARCHAR(512),
    "fileHash" VARCHAR(255),
    "status" VARCHAR(32) NOT NULL DEFAULT 'draft',
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sealedAt" TIMESTAMPTZ,

    CONSTRAINT "Web3EvidencePack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3WalletNotification" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "notificationNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "walletId" UUID,
    "type" VARCHAR(32) NOT NULL,
    "category" VARCHAR(32) NOT NULL,
    "priority" VARCHAR(32) NOT NULL DEFAULT 'normal',
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMPTZ,
    "channel" VARCHAR(32) NOT NULL DEFAULT 'in_app',
    "webhookUrl" VARCHAR(512),
    "webhookStatus" VARCHAR(32),
    "webhookRetryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3WalletNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Web3WalletWebhook" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "webhookNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "walletId" UUID,
    "name" VARCHAR(128) NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "secret" VARCHAR(255) NOT NULL,
    "events" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "lastTriggeredAt" TIMESTAMPTZ,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3WalletWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_api_keys" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "provider" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "apiKey" VARCHAR(512) NOT NULL,
    "secretKey" VARCHAR(512),
    "passphrase" VARCHAR(512),
    "description" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMPTZ,
    "lastUsedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spot_markets" (
    "id" BIGSERIAL NOT NULL,
    "marketSymbol" VARCHAR(32) NOT NULL,
    "baseAsset" VARCHAR(32) NOT NULL,
    "quoteAsset" VARCHAR(32) NOT NULL,
    "pricePrecision" INTEGER NOT NULL DEFAULT 2,
    "quantityPrecision" INTEGER NOT NULL DEFAULT 8,
    "minQuantity" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "minNotional" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "maxQuantity" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "maxNotional" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "makerFeeRate" DECIMAL(18,8) NOT NULL DEFAULT 0.001,
    "takerFeeRate" DECIMAL(18,8) NOT NULL DEFAULT 0.001,
    "priceTickSize" DECIMAL(36,18) NOT NULL DEFAULT 0.00000001,
    "status" "SpotMarketStatus" NOT NULL DEFAULT 'trading',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spot_markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spot_accounts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "asset" VARCHAR(32) NOT NULL,
    "balance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "available" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "frozen" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spot_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spot_account_ledgers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ledgerNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "asset" VARCHAR(32) NOT NULL,
    "type" "SpotAccountLedgerType" NOT NULL,
    "direction" VARCHAR(16) NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "balanceBefore" DECIMAL(36,18) NOT NULL,
    "balanceAfter" DECIMAL(36,18) NOT NULL,
    "referenceId" VARCHAR(100),
    "referenceType" VARCHAR(50),
    "remark" VARCHAR(500),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spot_account_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spot_orders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "orderNo" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "marketId" BIGINT NOT NULL,
    "marketSymbol" VARCHAR(32) NOT NULL,
    "side" "SpotOrderSide" NOT NULL,
    "orderType" "SpotOrderType" NOT NULL,
    "price" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "quantity" DECIMAL(36,18) NOT NULL,
    "filledQuantity" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "remainingQuantity" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "executedValue" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "fee" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "feeCurrency" VARCHAR(32),
    "timeInForce" "SpotOrderTimeInForce" NOT NULL DEFAULT 'GTC',
    "stopPrice" DECIMAL(36,18),
    "status" "SpotOrderStatus" NOT NULL DEFAULT 'pending',
    "clientOrderId" VARCHAR(100),
    "source" VARCHAR(32) NOT NULL DEFAULT 'web',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceledAt" TIMESTAMPTZ,
    "expiredAt" TIMESTAMPTZ,

    CONSTRAINT "spot_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spot_trades" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tradeNo" VARCHAR(64) NOT NULL,
    "orderId" UUID NOT NULL,
    "counterOrderId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "counterUserId" UUID NOT NULL,
    "marketId" BIGINT NOT NULL,
    "marketSymbol" VARCHAR(32) NOT NULL,
    "side" "SpotOrderSide" NOT NULL,
    "price" DECIMAL(36,18) NOT NULL,
    "quantity" DECIMAL(36,18) NOT NULL,
    "value" DECIMAL(36,18) NOT NULL,
    "fee" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "feeCurrency" VARCHAR(32) NOT NULL,
    "role" "SpotTradeRole" NOT NULL,
    "makerOrderNo" VARCHAR(64),
    "takerOrderNo" VARCHAR(64),
    "tradeTime" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spot_trades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallet_address_books_userId_idx" ON "wallet_address_books"("userId");

-- CreateIndex
CREATE INDEX "wallet_address_books_chainType_chainId_idx" ON "wallet_address_books"("chainType", "chainId");

-- CreateIndex
CREATE INDEX "wallet_address_books_address_idx" ON "wallet_address_books"("address");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_address_books_userId_chainType_chainId_address_key" ON "wallet_address_books"("userId", "chainType", "chainId", "address");

-- CreateIndex
CREATE INDEX "wallet_deposit_addresses_userId_idx" ON "wallet_deposit_addresses"("userId");

-- CreateIndex
CREATE INDEX "wallet_deposit_addresses_walletId_idx" ON "wallet_deposit_addresses"("walletId");

-- CreateIndex
CREATE INDEX "wallet_deposit_addresses_chainType_chainId_idx" ON "wallet_deposit_addresses"("chainType", "chainId");

-- CreateIndex
CREATE INDEX "wallet_deposit_addresses_status_idx" ON "wallet_deposit_addresses"("status");

-- CreateIndex
CREATE INDEX "wallet_deposit_addresses_addressIndex_idx" ON "wallet_deposit_addresses"("addressIndex");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_deposit_addresses_chainType_chainId_address_key" ON "wallet_deposit_addresses"("chainType", "chainId", "address");

-- CreateIndex
CREATE INDEX "wallet_chain_cursors_status_idx" ON "wallet_chain_cursors"("status");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_chain_cursors_chainType_chainId_scannerName_key" ON "wallet_chain_cursors"("chainType", "chainId", "scannerName");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_deposit_records_depositNo_key" ON "wallet_deposit_records"("depositNo");

-- CreateIndex
CREATE INDEX "wallet_deposit_records_userId_idx" ON "wallet_deposit_records"("userId");

-- CreateIndex
CREATE INDEX "wallet_deposit_records_walletId_idx" ON "wallet_deposit_records"("walletId");

-- CreateIndex
CREATE INDEX "wallet_deposit_records_toAddress_idx" ON "wallet_deposit_records"("toAddress");

-- CreateIndex
CREATE INDEX "wallet_deposit_records_chainType_chainId_status_idx" ON "wallet_deposit_records"("chainType", "chainId", "status");

-- CreateIndex
CREATE INDEX "wallet_deposit_records_txHash_idx" ON "wallet_deposit_records"("txHash");

-- CreateIndex
CREATE INDEX "wallet_deposit_records_blockNumber_idx" ON "wallet_deposit_records"("blockNumber");

-- CreateIndex
CREATE INDEX "wallet_deposit_records_detectedAt_idx" ON "wallet_deposit_records"("detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_deposit_records_chainType_chainId_txHash_logIndex_key" ON "wallet_deposit_records"("chainType", "chainId", "txHash", "logIndex");

-- CreateIndex
CREATE INDEX "wallet_user_asset_balances_walletId_idx" ON "wallet_user_asset_balances"("walletId");

-- CreateIndex
CREATE INDEX "wallet_user_asset_balances_assetSymbol_idx" ON "wallet_user_asset_balances"("assetSymbol");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_user_asset_balances_userId_chainType_chainId_assetSy_key" ON "wallet_user_asset_balances"("userId", "chainType", "chainId", "assetSymbol", "contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_user_asset_ledgers_ledgerNo_key" ON "wallet_user_asset_ledgers"("ledgerNo");

-- CreateIndex
CREATE INDEX "wallet_user_asset_ledgers_userId_idx" ON "wallet_user_asset_ledgers"("userId");

-- CreateIndex
CREATE INDEX "wallet_user_asset_ledgers_walletId_idx" ON "wallet_user_asset_ledgers"("walletId");

-- CreateIndex
CREATE INDEX "wallet_user_asset_ledgers_bizType_bizNo_idx" ON "wallet_user_asset_ledgers"("bizType", "bizNo");

-- CreateIndex
CREATE INDEX "wallet_user_asset_ledgers_assetSymbol_idx" ON "wallet_user_asset_ledgers"("assetSymbol");

-- CreateIndex
CREATE INDEX "wallet_user_asset_ledgers_createdAt_idx" ON "wallet_user_asset_ledgers"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_withdrawal_records_withdrawNo_key" ON "wallet_withdrawal_records"("withdrawNo");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_withdrawal_records_idempotencyKey_key" ON "wallet_withdrawal_records"("idempotencyKey");

-- CreateIndex
CREATE INDEX "wallet_withdrawal_records_userId_idx" ON "wallet_withdrawal_records"("userId");

-- CreateIndex
CREATE INDEX "wallet_withdrawal_records_walletId_idx" ON "wallet_withdrawal_records"("walletId");

-- CreateIndex
CREATE INDEX "wallet_withdrawal_records_chainType_chainId_status_idx" ON "wallet_withdrawal_records"("chainType", "chainId", "status");

-- CreateIndex
CREATE INDEX "wallet_withdrawal_records_txHash_idx" ON "wallet_withdrawal_records"("txHash");

-- CreateIndex
CREATE INDEX "wallet_withdrawal_records_hotWalletNo_idx" ON "wallet_withdrawal_records"("hotWalletNo");

-- CreateIndex
CREATE INDEX "wallet_withdrawal_records_requestedAt_idx" ON "wallet_withdrawal_records"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_withdrawal_approvals_approvalNo_key" ON "wallet_withdrawal_approvals"("approvalNo");

-- CreateIndex
CREATE INDEX "wallet_withdrawal_approvals_withdrawNo_idx" ON "wallet_withdrawal_approvals"("withdrawNo");

-- CreateIndex
CREATE INDEX "wallet_withdrawal_approvals_userId_idx" ON "wallet_withdrawal_approvals"("userId");

-- CreateIndex
CREATE INDEX "wallet_withdrawal_approvals_orgId_idx" ON "wallet_withdrawal_approvals"("orgId");

-- CreateIndex
CREATE INDEX "wallet_withdrawal_approvals_status_idx" ON "wallet_withdrawal_approvals"("status");

-- CreateIndex
CREATE INDEX "wallet_withdrawal_approvals_expiresAt_idx" ON "wallet_withdrawal_approvals"("expiresAt");

-- CreateIndex
CREATE INDEX "wallet_withdrawal_approval_decisions_withdrawNo_idx" ON "wallet_withdrawal_approval_decisions"("withdrawNo");

-- CreateIndex
CREATE INDEX "wallet_withdrawal_approval_decisions_approverId_idx" ON "wallet_withdrawal_approval_decisions"("approverId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_withdrawal_approval_decisions_approvalNo_approverId_key" ON "wallet_withdrawal_approval_decisions"("approvalNo", "approverId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_hot_wallets_walletNo_key" ON "wallet_hot_wallets"("walletNo");

-- CreateIndex
CREATE INDEX "wallet_hot_wallets_chainType_chainId_idx" ON "wallet_hot_wallets"("chainType", "chainId");

-- CreateIndex
CREATE INDEX "wallet_hot_wallets_walletRole_status_idx" ON "wallet_hot_wallets"("walletRole", "status");

-- CreateIndex
CREATE INDEX "wallet_hot_wallets_assetSymbol_idx" ON "wallet_hot_wallets"("assetSymbol");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_hot_wallets_chainType_chainId_address_assetSymbol_co_key" ON "wallet_hot_wallets"("chainType", "chainId", "address", "assetSymbol", "contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_hot_wallet_ledgers_ledgerNo_key" ON "wallet_hot_wallet_ledgers"("ledgerNo");

-- CreateIndex
CREATE INDEX "wallet_hot_wallet_ledgers_walletNo_idx" ON "wallet_hot_wallet_ledgers"("walletNo");

-- CreateIndex
CREATE INDEX "wallet_hot_wallet_ledgers_bizType_bizNo_idx" ON "wallet_hot_wallet_ledgers"("bizType", "bizNo");

-- CreateIndex
CREATE INDEX "wallet_hot_wallet_ledgers_assetSymbol_idx" ON "wallet_hot_wallet_ledgers"("assetSymbol");

-- CreateIndex
CREATE INDEX "wallet_hot_wallet_ledgers_createdAt_idx" ON "wallet_hot_wallet_ledgers"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_hot_wallet_locks_lockNo_key" ON "wallet_hot_wallet_locks"("lockNo");

-- CreateIndex
CREATE INDEX "wallet_hot_wallet_locks_walletNo_idx" ON "wallet_hot_wallet_locks"("walletNo");

-- CreateIndex
CREATE INDEX "wallet_hot_wallet_locks_bizType_bizNo_idx" ON "wallet_hot_wallet_locks"("bizType", "bizNo");

-- CreateIndex
CREATE INDEX "wallet_hot_wallet_locks_status_idx" ON "wallet_hot_wallet_locks"("status");

-- CreateIndex
CREATE INDEX "wallet_hot_wallet_locks_expiresAt_idx" ON "wallet_hot_wallet_locks"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_hot_wallet_locks_walletNo_bizType_bizNo_key" ON "wallet_hot_wallet_locks"("walletNo", "bizType", "bizNo");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_sweep_tasks_sweepNo_key" ON "wallet_sweep_tasks"("sweepNo");

-- CreateIndex
CREATE INDEX "wallet_sweep_tasks_chainType_chainId_status_idx" ON "wallet_sweep_tasks"("chainType", "chainId", "status");

-- CreateIndex
CREATE INDEX "wallet_sweep_tasks_fromAddress_idx" ON "wallet_sweep_tasks"("fromAddress");

-- CreateIndex
CREATE INDEX "wallet_sweep_tasks_toAddress_idx" ON "wallet_sweep_tasks"("toAddress");

-- CreateIndex
CREATE INDEX "wallet_sweep_tasks_txHash_idx" ON "wallet_sweep_tasks"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_chain_transactions_chainTxNo_key" ON "wallet_chain_transactions"("chainTxNo");

-- CreateIndex
CREATE INDEX "wallet_chain_transactions_chainType_chainId_status_idx" ON "wallet_chain_transactions"("chainType", "chainId", "status");

-- CreateIndex
CREATE INDEX "wallet_chain_transactions_txHash_idx" ON "wallet_chain_transactions"("txHash");

-- CreateIndex
CREATE INDEX "wallet_chain_transactions_fromAddress_idx" ON "wallet_chain_transactions"("fromAddress");

-- CreateIndex
CREATE INDEX "wallet_chain_transactions_nonce_idx" ON "wallet_chain_transactions"("nonce");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_chain_transactions_bizType_bizNo_key" ON "wallet_chain_transactions"("bizType", "bizNo");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_reconciliation_records_reconcileNo_key" ON "wallet_reconciliation_records"("reconcileNo");

-- CreateIndex
CREATE INDEX "wallet_reconciliation_records_chainType_chainId_idx" ON "wallet_reconciliation_records"("chainType", "chainId");

-- CreateIndex
CREATE INDEX "wallet_reconciliation_records_bizType_bizNo_idx" ON "wallet_reconciliation_records"("bizType", "bizNo");

-- CreateIndex
CREATE INDEX "wallet_reconciliation_records_txHash_idx" ON "wallet_reconciliation_records"("txHash");

-- CreateIndex
CREATE INDEX "wallet_reconciliation_records_status_idx" ON "wallet_reconciliation_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PerpContract_symbol_key" ON "PerpContract"("symbol");

-- CreateIndex
CREATE INDEX "PerpAccount_userId_idx" ON "PerpAccount"("userId");

-- CreateIndex
CREATE INDEX "PerpAccount_status_idx" ON "PerpAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uk_perp_user_asset_type" ON "PerpAccount"("userId", "asset", "accountType");

-- CreateIndex
CREATE INDEX "PerpPosition_userId_idx" ON "PerpPosition"("userId");

-- CreateIndex
CREATE INDEX "PerpPosition_accountId_idx" ON "PerpPosition"("accountId");

-- CreateIndex
CREATE INDEX "PerpPosition_contractId_idx" ON "PerpPosition"("contractId");

-- CreateIndex
CREATE INDEX "PerpPosition_symbol_idx" ON "PerpPosition"("symbol");

-- CreateIndex
CREATE INDEX "PerpPosition_status_idx" ON "PerpPosition"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uk_perp_user_symbol_side_margin" ON "PerpPosition"("userId", "symbol", "side", "marginMode");

-- CreateIndex
CREATE UNIQUE INDEX "PerpOrder_orderNo_key" ON "PerpOrder"("orderNo");

-- CreateIndex
CREATE INDEX "PerpOrder_orderNo_idx" ON "PerpOrder"("orderNo");

-- CreateIndex
CREATE INDEX "PerpOrder_userId_idx" ON "PerpOrder"("userId");

-- CreateIndex
CREATE INDEX "PerpOrder_accountId_idx" ON "PerpOrder"("accountId");

-- CreateIndex
CREATE INDEX "PerpOrder_contractId_idx" ON "PerpOrder"("contractId");

-- CreateIndex
CREATE INDEX "PerpOrder_symbol_idx" ON "PerpOrder"("symbol");

-- CreateIndex
CREATE INDEX "PerpOrder_status_idx" ON "PerpOrder"("status");

-- CreateIndex
CREATE INDEX "PerpOrder_createdAt_idx" ON "PerpOrder"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PerpTrade_tradeNo_key" ON "PerpTrade"("tradeNo");

-- CreateIndex
CREATE INDEX "PerpTrade_tradeNo_idx" ON "PerpTrade"("tradeNo");

-- CreateIndex
CREATE INDEX "PerpTrade_orderId_idx" ON "PerpTrade"("orderId");

-- CreateIndex
CREATE INDEX "PerpTrade_userId_idx" ON "PerpTrade"("userId");

-- CreateIndex
CREATE INDEX "PerpTrade_symbol_idx" ON "PerpTrade"("symbol");

-- CreateIndex
CREATE INDEX "PerpTrade_tradeTime_idx" ON "PerpTrade"("tradeTime");

-- CreateIndex
CREATE INDEX "PerpIndexPrice_symbol_priceTime_idx" ON "PerpIndexPrice"("symbol", "priceTime");

-- CreateIndex
CREATE INDEX "PerpIndexPrice_priceTime_idx" ON "PerpIndexPrice"("priceTime");

-- CreateIndex
CREATE INDEX "PerpMarkPrice_symbol_priceTime_idx" ON "PerpMarkPrice"("symbol", "priceTime");

-- CreateIndex
CREATE INDEX "PerpMarkPrice_priceTime_idx" ON "PerpMarkPrice"("priceTime");

-- CreateIndex
CREATE INDEX "PerpFundingRate_symbol_fundingTime_idx" ON "PerpFundingRate"("symbol", "fundingTime");

-- CreateIndex
CREATE INDEX "PerpFundingRate_fundingTime_idx" ON "PerpFundingRate"("fundingTime");

-- CreateIndex
CREATE UNIQUE INDEX "PerpFundingPayment_paymentNo_key" ON "PerpFundingPayment"("paymentNo");

-- CreateIndex
CREATE INDEX "PerpFundingPayment_paymentNo_idx" ON "PerpFundingPayment"("paymentNo");

-- CreateIndex
CREATE INDEX "PerpFundingPayment_userId_idx" ON "PerpFundingPayment"("userId");

-- CreateIndex
CREATE INDEX "PerpFundingPayment_accountId_idx" ON "PerpFundingPayment"("accountId");

-- CreateIndex
CREATE INDEX "PerpFundingPayment_positionId_idx" ON "PerpFundingPayment"("positionId");

-- CreateIndex
CREATE INDEX "PerpFundingPayment_symbol_fundingTime_idx" ON "PerpFundingPayment"("symbol", "fundingTime");

-- CreateIndex
CREATE UNIQUE INDEX "PerpLiquidation_liquidationNo_key" ON "PerpLiquidation"("liquidationNo");

-- CreateIndex
CREATE INDEX "PerpLiquidation_liquidationNo_idx" ON "PerpLiquidation"("liquidationNo");

-- CreateIndex
CREATE INDEX "PerpLiquidation_userId_idx" ON "PerpLiquidation"("userId");

-- CreateIndex
CREATE INDEX "PerpLiquidation_accountId_idx" ON "PerpLiquidation"("accountId");

-- CreateIndex
CREATE INDEX "PerpLiquidation_positionId_idx" ON "PerpLiquidation"("positionId");

-- CreateIndex
CREATE INDEX "PerpLiquidation_symbol_idx" ON "PerpLiquidation"("symbol");

-- CreateIndex
CREATE INDEX "PerpLiquidation_status_idx" ON "PerpLiquidation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PerpInsuranceFund_symbol_key" ON "PerpInsuranceFund"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "PerpInsuranceFund_contractId_key" ON "PerpInsuranceFund"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "PerpLedger_ledgerNo_key" ON "PerpLedger"("ledgerNo");

-- CreateIndex
CREATE INDEX "PerpLedger_ledgerNo_idx" ON "PerpLedger"("ledgerNo");

-- CreateIndex
CREATE INDEX "PerpLedger_userId_idx" ON "PerpLedger"("userId");

-- CreateIndex
CREATE INDEX "PerpLedger_accountId_idx" ON "PerpLedger"("accountId");

-- CreateIndex
CREATE INDEX "PerpLedger_type_idx" ON "PerpLedger"("type");

-- CreateIndex
CREATE INDEX "PerpLedger_createdAt_idx" ON "PerpLedger"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PerpRiskConfig_symbol_key" ON "PerpRiskConfig"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Web3WalletProfile_walletNo_key" ON "Web3WalletProfile"("walletNo");

-- CreateIndex
CREATE INDEX "Web3WalletProfile_userId_idx" ON "Web3WalletProfile"("userId");

-- CreateIndex
CREATE INDEX "Web3WalletProfile_status_idx" ON "Web3WalletProfile"("status");

-- CreateIndex
CREATE INDEX "Web3WalletProfile_walletType_idx" ON "Web3WalletProfile"("walletType");

-- CreateIndex
CREATE INDEX "Web3WalletProfile_riskLevel_idx" ON "Web3WalletProfile"("riskLevel");

-- CreateIndex
CREATE INDEX "Web3WalletKeyMaterial_walletId_idx" ON "Web3WalletKeyMaterial"("walletId");

-- CreateIndex
CREATE INDEX "Web3WalletKeyMaterial_keyType_idx" ON "Web3WalletKeyMaterial"("keyType");

-- CreateIndex
CREATE INDEX "Web3WalletKeyMaterial_status_idx" ON "Web3WalletKeyMaterial"("status");

-- CreateIndex
CREATE INDEX "Web3WalletKeyMaterial_kmsProvider_idx" ON "Web3WalletKeyMaterial"("kmsProvider");

-- CreateIndex
CREATE INDEX "Web3WalletAddress_walletId_idx" ON "Web3WalletAddress"("walletId");

-- CreateIndex
CREATE INDEX "Web3WalletAddress_userId_idx" ON "Web3WalletAddress"("userId");

-- CreateIndex
CREATE INDEX "Web3WalletAddress_chainType_chainId_idx" ON "Web3WalletAddress"("chainType", "chainId");

-- CreateIndex
CREATE INDEX "Web3WalletAddress_status_idx" ON "Web3WalletAddress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Web3WalletAddress_chainType_chainId_address_key" ON "Web3WalletAddress"("chainType", "chainId", "address");

-- CreateIndex
CREATE INDEX "Web3WalletChainConfig_enabled_idx" ON "Web3WalletChainConfig"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Web3WalletChainConfig_chainType_chainId_key" ON "Web3WalletChainConfig"("chainType", "chainId");

-- CreateIndex
CREATE INDEX "Web3WalletAsset_chainType_chainId_idx" ON "Web3WalletAsset"("chainType", "chainId");

-- CreateIndex
CREATE INDEX "Web3WalletAsset_symbol_idx" ON "Web3WalletAsset"("symbol");

-- CreateIndex
CREATE INDEX "Web3WalletAsset_enabled_idx" ON "Web3WalletAsset"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Web3WalletAsset_chainType_chainId_symbol_contractAddress_key" ON "Web3WalletAsset"("chainType", "chainId", "symbol", "contractAddress");

-- CreateIndex
CREATE INDEX "Web3WalletBalanceSnapshot_walletId_idx" ON "Web3WalletBalanceSnapshot"("walletId");

-- CreateIndex
CREATE INDEX "Web3WalletBalanceSnapshot_userId_idx" ON "Web3WalletBalanceSnapshot"("userId");

-- CreateIndex
CREATE INDEX "Web3WalletBalanceSnapshot_address_chainType_chainId_idx" ON "Web3WalletBalanceSnapshot"("address", "chainType", "chainId");

-- CreateIndex
CREATE INDEX "Web3WalletBalanceSnapshot_snapshotTime_idx" ON "Web3WalletBalanceSnapshot"("snapshotTime");

-- CreateIndex
CREATE UNIQUE INDEX "Web3WalletTransaction_txNo_key" ON "Web3WalletTransaction"("txNo");

-- CreateIndex
CREATE INDEX "Web3WalletTransaction_walletId_idx" ON "Web3WalletTransaction"("walletId");

-- CreateIndex
CREATE INDEX "Web3WalletTransaction_userId_idx" ON "Web3WalletTransaction"("userId");

-- CreateIndex
CREATE INDEX "Web3WalletTransaction_txHash_idx" ON "Web3WalletTransaction"("txHash");

-- CreateIndex
CREATE INDEX "Web3WalletTransaction_chainType_chainId_status_idx" ON "Web3WalletTransaction"("chainType", "chainId", "status");

-- CreateIndex
CREATE INDEX "Web3WalletTransaction_fromAddress_idx" ON "Web3WalletTransaction"("fromAddress");

-- CreateIndex
CREATE INDEX "Web3WalletTransaction_createdAt_idx" ON "Web3WalletTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Web3WalletSignatureRequest_requestNo_key" ON "Web3WalletSignatureRequest"("requestNo");

-- CreateIndex
CREATE INDEX "Web3WalletSignatureRequest_walletId_idx" ON "Web3WalletSignatureRequest"("walletId");

-- CreateIndex
CREATE INDEX "Web3WalletSignatureRequest_userId_idx" ON "Web3WalletSignatureRequest"("userId");

-- CreateIndex
CREATE INDEX "Web3WalletSignatureRequest_address_idx" ON "Web3WalletSignatureRequest"("address");

-- CreateIndex
CREATE INDEX "Web3WalletSignatureRequest_status_idx" ON "Web3WalletSignatureRequest"("status");

-- CreateIndex
CREATE INDEX "Web3WalletSignatureRequest_createdAt_idx" ON "Web3WalletSignatureRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Web3WalletDappSession_sessionNo_key" ON "Web3WalletDappSession"("sessionNo");

-- CreateIndex
CREATE INDEX "Web3WalletDappSession_walletId_idx" ON "Web3WalletDappSession"("walletId");

-- CreateIndex
CREATE INDEX "Web3WalletDappSession_userId_idx" ON "Web3WalletDappSession"("userId");

-- CreateIndex
CREATE INDEX "Web3WalletDappSession_dappDomain_idx" ON "Web3WalletDappSession"("dappDomain");

-- CreateIndex
CREATE INDEX "Web3WalletDappSession_status_idx" ON "Web3WalletDappSession"("status");

-- CreateIndex
CREATE INDEX "Web3WalletApproval_walletId_idx" ON "Web3WalletApproval"("walletId");

-- CreateIndex
CREATE INDEX "Web3WalletApproval_userId_idx" ON "Web3WalletApproval"("userId");

-- CreateIndex
CREATE INDEX "Web3WalletApproval_ownerAddress_idx" ON "Web3WalletApproval"("ownerAddress");

-- CreateIndex
CREATE INDEX "Web3WalletApproval_spenderAddress_idx" ON "Web3WalletApproval"("spenderAddress");

-- CreateIndex
CREATE INDEX "Web3WalletApproval_status_idx" ON "Web3WalletApproval"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Web3WalletSecurityEvent_eventNo_key" ON "Web3WalletSecurityEvent"("eventNo");

-- CreateIndex
CREATE INDEX "Web3WalletSecurityEvent_walletId_idx" ON "Web3WalletSecurityEvent"("walletId");

-- CreateIndex
CREATE INDEX "Web3WalletSecurityEvent_userId_idx" ON "Web3WalletSecurityEvent"("userId");

-- CreateIndex
CREATE INDEX "Web3WalletSecurityEvent_eventType_idx" ON "Web3WalletSecurityEvent"("eventType");

-- CreateIndex
CREATE INDEX "Web3WalletSecurityEvent_severity_idx" ON "Web3WalletSecurityEvent"("severity");

-- CreateIndex
CREATE INDEX "Web3WalletSecurityEvent_status_idx" ON "Web3WalletSecurityEvent"("status");

-- CreateIndex
CREATE INDEX "Web3WalletSecurityEvent_createdAt_idx" ON "Web3WalletSecurityEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Web3WalletRecoveryRequest_requestNo_key" ON "Web3WalletRecoveryRequest"("requestNo");

-- CreateIndex
CREATE INDEX "Web3WalletRecoveryRequest_walletId_idx" ON "Web3WalletRecoveryRequest"("walletId");

-- CreateIndex
CREATE INDEX "Web3WalletRecoveryRequest_userId_idx" ON "Web3WalletRecoveryRequest"("userId");

-- CreateIndex
CREATE INDEX "Web3WalletRecoveryRequest_status_idx" ON "Web3WalletRecoveryRequest"("status");

-- CreateIndex
CREATE INDEX "Web3WalletAddressBook_userId_idx" ON "Web3WalletAddressBook"("userId");

-- CreateIndex
CREATE INDEX "Web3WalletAddressBook_chainType_chainId_idx" ON "Web3WalletAddressBook"("chainType", "chainId");

-- CreateIndex
CREATE INDEX "Web3WalletAddressBook_isWhitelist_idx" ON "Web3WalletAddressBook"("isWhitelist");

-- CreateIndex
CREATE INDEX "Web3WalletAddressBook_isBlacklist_idx" ON "Web3WalletAddressBook"("isBlacklist");

-- CreateIndex
CREATE UNIQUE INDEX "Web3WalletAddressBook_userId_chainType_chainId_address_key" ON "Web3WalletAddressBook"("userId", "chainType", "chainId", "address");

-- CreateIndex
CREATE UNIQUE INDEX "Web3WalletAuditLog_auditNo_key" ON "Web3WalletAuditLog"("auditNo");

-- CreateIndex
CREATE INDEX "Web3WalletAuditLog_domain_action_idx" ON "Web3WalletAuditLog"("domain", "action");

-- CreateIndex
CREATE INDEX "Web3WalletAuditLog_userId_idx" ON "Web3WalletAuditLog"("userId");

-- CreateIndex
CREATE INDEX "Web3WalletAuditLog_walletId_idx" ON "Web3WalletAuditLog"("walletId");

-- CreateIndex
CREATE INDEX "Web3WalletAuditLog_createdAt_idx" ON "Web3WalletAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Web3WalletAuditLog_status_idx" ON "Web3WalletAuditLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Web3RiskRule_ruleCode_key" ON "Web3RiskRule"("ruleCode");

-- CreateIndex
CREATE INDEX "Web3RiskRule_ruleType_idx" ON "Web3RiskRule"("ruleType");

-- CreateIndex
CREATE INDEX "Web3RiskRule_enabled_idx" ON "Web3RiskRule"("enabled");

-- CreateIndex
CREATE INDEX "Web3RiskRule_priority_idx" ON "Web3RiskRule"("priority");

-- CreateIndex
CREATE INDEX "Web3RiskBlacklist_category_idx" ON "Web3RiskBlacklist"("category");

-- CreateIndex
CREATE INDEX "Web3RiskBlacklist_riskLevel_idx" ON "Web3RiskBlacklist"("riskLevel");

-- CreateIndex
CREATE INDEX "Web3RiskBlacklist_source_idx" ON "Web3RiskBlacklist"("source");

-- CreateIndex
CREATE UNIQUE INDEX "Web3RiskBlacklist_chainType_address_key" ON "Web3RiskBlacklist"("chainType", "address");

-- CreateIndex
CREATE UNIQUE INDEX "Web3RiskPhishingDomain_domain_key" ON "Web3RiskPhishingDomain"("domain");

-- CreateIndex
CREATE INDEX "Web3RiskPhishingDomain_domainType_idx" ON "Web3RiskPhishingDomain"("domainType");

-- CreateIndex
CREATE INDEX "Web3RiskPhishingDomain_riskLevel_idx" ON "Web3RiskPhishingDomain"("riskLevel");

-- CreateIndex
CREATE INDEX "Web3RiskPhishingDomain_source_idx" ON "Web3RiskPhishingDomain"("source");

-- CreateIndex
CREATE UNIQUE INDEX "Web3MpcWallet_walletNo_key" ON "Web3MpcWallet"("walletNo");

-- CreateIndex
CREATE INDEX "Web3MpcWallet_walletId_idx" ON "Web3MpcWallet"("walletId");

-- CreateIndex
CREATE INDEX "Web3MpcWallet_provider_idx" ON "Web3MpcWallet"("provider");

-- CreateIndex
CREATE INDEX "Web3MpcWallet_custodyType_idx" ON "Web3MpcWallet"("custodyType");

-- CreateIndex
CREATE INDEX "Web3MpcWallet_chainType_chainId_idx" ON "Web3MpcWallet"("chainType", "chainId");

-- CreateIndex
CREATE INDEX "Web3MpcWallet_status_idx" ON "Web3MpcWallet"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Web3MpcSigningRequest_requestNo_key" ON "Web3MpcSigningRequest"("requestNo");

-- CreateIndex
CREATE INDEX "Web3MpcSigningRequest_mpcWalletId_idx" ON "Web3MpcSigningRequest"("mpcWalletId");

-- CreateIndex
CREATE INDEX "Web3MpcSigningRequest_walletId_idx" ON "Web3MpcSigningRequest"("walletId");

-- CreateIndex
CREATE INDEX "Web3MpcSigningRequest_userId_idx" ON "Web3MpcSigningRequest"("userId");

-- CreateIndex
CREATE INDEX "Web3MpcSigningRequest_status_idx" ON "Web3MpcSigningRequest"("status");

-- CreateIndex
CREATE INDEX "Web3MpcSigningRequest_currentStage_idx" ON "Web3MpcSigningRequest"("currentStage");

-- CreateIndex
CREATE INDEX "Web3MpcSigningRequest_createdAt_idx" ON "Web3MpcSigningRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Web3MpcPolicy_policyNo_key" ON "Web3MpcPolicy"("policyNo");

-- CreateIndex
CREATE INDEX "Web3MpcPolicy_orgId_idx" ON "Web3MpcPolicy"("orgId");

-- CreateIndex
CREATE INDEX "Web3MpcPolicy_vaultId_idx" ON "Web3MpcPolicy"("vaultId");

-- CreateIndex
CREATE INDEX "Web3MpcPolicy_policyType_idx" ON "Web3MpcPolicy"("policyType");

-- CreateIndex
CREATE INDEX "Web3MpcPolicy_enabled_idx" ON "Web3MpcPolicy"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Web3ApprovalWorkflow_workflowNo_key" ON "Web3ApprovalWorkflow"("workflowNo");

-- CreateIndex
CREATE INDEX "Web3ApprovalWorkflow_requestType_requestId_idx" ON "Web3ApprovalWorkflow"("requestType", "requestId");

-- CreateIndex
CREATE INDEX "Web3ApprovalWorkflow_walletId_idx" ON "Web3ApprovalWorkflow"("walletId");

-- CreateIndex
CREATE INDEX "Web3ApprovalWorkflow_userId_idx" ON "Web3ApprovalWorkflow"("userId");

-- CreateIndex
CREATE INDEX "Web3ApprovalWorkflow_status_idx" ON "Web3ApprovalWorkflow"("status");

-- CreateIndex
CREATE INDEX "Web3ApprovalWorkflow_createdAt_idx" ON "Web3ApprovalWorkflow"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Web3ComplianceReport_reportNo_key" ON "Web3ComplianceReport"("reportNo");

-- CreateIndex
CREATE INDEX "Web3ComplianceReport_reportType_idx" ON "Web3ComplianceReport"("reportType");

-- CreateIndex
CREATE INDEX "Web3ComplianceReport_userId_idx" ON "Web3ComplianceReport"("userId");

-- CreateIndex
CREATE INDEX "Web3ComplianceReport_walletId_idx" ON "Web3ComplianceReport"("walletId");

-- CreateIndex
CREATE INDEX "Web3ComplianceReport_status_idx" ON "Web3ComplianceReport"("status");

-- CreateIndex
CREATE INDEX "Web3ComplianceReport_createdAt_idx" ON "Web3ComplianceReport"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Web3EvidencePack_packNo_key" ON "Web3EvidencePack"("packNo");

-- CreateIndex
CREATE INDEX "Web3EvidencePack_caseId_idx" ON "Web3EvidencePack"("caseId");

-- CreateIndex
CREATE INDEX "Web3EvidencePack_caseType_idx" ON "Web3EvidencePack"("caseType");

-- CreateIndex
CREATE INDEX "Web3EvidencePack_userId_idx" ON "Web3EvidencePack"("userId");

-- CreateIndex
CREATE INDEX "Web3EvidencePack_walletId_idx" ON "Web3EvidencePack"("walletId");

-- CreateIndex
CREATE INDEX "Web3EvidencePack_status_idx" ON "Web3EvidencePack"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Web3WalletNotification_notificationNo_key" ON "Web3WalletNotification"("notificationNo");

-- CreateIndex
CREATE INDEX "Web3WalletNotification_userId_idx" ON "Web3WalletNotification"("userId");

-- CreateIndex
CREATE INDEX "Web3WalletNotification_walletId_idx" ON "Web3WalletNotification"("walletId");

-- CreateIndex
CREATE INDEX "Web3WalletNotification_type_category_idx" ON "Web3WalletNotification"("type", "category");

-- CreateIndex
CREATE INDEX "Web3WalletNotification_read_idx" ON "Web3WalletNotification"("read");

-- CreateIndex
CREATE INDEX "Web3WalletNotification_createdAt_idx" ON "Web3WalletNotification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Web3WalletWebhook_webhookNo_key" ON "Web3WalletWebhook"("webhookNo");

-- CreateIndex
CREATE INDEX "Web3WalletWebhook_userId_idx" ON "Web3WalletWebhook"("userId");

-- CreateIndex
CREATE INDEX "Web3WalletWebhook_walletId_idx" ON "Web3WalletWebhook"("walletId");

-- CreateIndex
CREATE INDEX "Web3WalletWebhook_enabled_idx" ON "Web3WalletWebhook"("enabled");

-- CreateIndex
CREATE INDEX "Web3WalletWebhook_status_idx" ON "Web3WalletWebhook"("status");

-- CreateIndex
CREATE INDEX "exchange_api_keys_provider_idx" ON "exchange_api_keys"("provider");

-- CreateIndex
CREATE INDEX "exchange_api_keys_status_idx" ON "exchange_api_keys"("status");

-- CreateIndex
CREATE UNIQUE INDEX "spot_markets_marketSymbol_key" ON "spot_markets"("marketSymbol");

-- CreateIndex
CREATE INDEX "spot_markets_baseAsset_quoteAsset_idx" ON "spot_markets"("baseAsset", "quoteAsset");

-- CreateIndex
CREATE INDEX "spot_markets_status_idx" ON "spot_markets"("status");

-- CreateIndex
CREATE INDEX "spot_accounts_userId_idx" ON "spot_accounts"("userId");

-- CreateIndex
CREATE INDEX "spot_accounts_asset_idx" ON "spot_accounts"("asset");

-- CreateIndex
CREATE INDEX "spot_accounts_status_idx" ON "spot_accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uk_spot_user_asset" ON "spot_accounts"("userId", "asset");

-- CreateIndex
CREATE UNIQUE INDEX "spot_account_ledgers_ledgerNo_key" ON "spot_account_ledgers"("ledgerNo");

-- CreateIndex
CREATE INDEX "spot_account_ledgers_userId_idx" ON "spot_account_ledgers"("userId");

-- CreateIndex
CREATE INDEX "spot_account_ledgers_accountId_idx" ON "spot_account_ledgers"("accountId");

-- CreateIndex
CREATE INDEX "spot_account_ledgers_type_idx" ON "spot_account_ledgers"("type");

-- CreateIndex
CREATE INDEX "spot_account_ledgers_createdAt_idx" ON "spot_account_ledgers"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "spot_orders_orderNo_key" ON "spot_orders"("orderNo");

-- CreateIndex
CREATE INDEX "spot_orders_orderNo_idx" ON "spot_orders"("orderNo");

-- CreateIndex
CREATE INDEX "spot_orders_userId_idx" ON "spot_orders"("userId");

-- CreateIndex
CREATE INDEX "spot_orders_accountId_idx" ON "spot_orders"("accountId");

-- CreateIndex
CREATE INDEX "spot_orders_marketId_idx" ON "spot_orders"("marketId");

-- CreateIndex
CREATE INDEX "spot_orders_marketSymbol_idx" ON "spot_orders"("marketSymbol");

-- CreateIndex
CREATE INDEX "spot_orders_status_idx" ON "spot_orders"("status");

-- CreateIndex
CREATE INDEX "spot_orders_createdAt_idx" ON "spot_orders"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "spot_trades_tradeNo_key" ON "spot_trades"("tradeNo");

-- CreateIndex
CREATE INDEX "spot_trades_tradeNo_idx" ON "spot_trades"("tradeNo");

-- CreateIndex
CREATE INDEX "spot_trades_orderId_idx" ON "spot_trades"("orderId");

-- CreateIndex
CREATE INDEX "spot_trades_counterOrderId_idx" ON "spot_trades"("counterOrderId");

-- CreateIndex
CREATE INDEX "spot_trades_userId_idx" ON "spot_trades"("userId");

-- CreateIndex
CREATE INDEX "spot_trades_marketId_idx" ON "spot_trades"("marketId");

-- CreateIndex
CREATE INDEX "spot_trades_marketSymbol_idx" ON "spot_trades"("marketSymbol");

-- CreateIndex
CREATE INDEX "spot_trades_tradeTime_idx" ON "spot_trades"("tradeTime");

-- AddForeignKey
ALTER TABLE "wallet_withdrawal_approvals" ADD CONSTRAINT "wallet_withdrawal_approvals_withdrawNo_fkey" FOREIGN KEY ("withdrawNo") REFERENCES "wallet_withdrawal_records"("withdrawNo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpPosition" ADD CONSTRAINT "PerpPosition_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PerpAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpPosition" ADD CONSTRAINT "PerpPosition_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "PerpContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpOrder" ADD CONSTRAINT "PerpOrder_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PerpAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpOrder" ADD CONSTRAINT "PerpOrder_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "PerpContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpOrder" ADD CONSTRAINT "PerpOrder_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "PerpPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpTrade" ADD CONSTRAINT "PerpTrade_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PerpOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpTrade" ADD CONSTRAINT "PerpTrade_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "PerpContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpTrade" ADD CONSTRAINT "PerpTrade_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "PerpPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpIndexPrice" ADD CONSTRAINT "PerpIndexPrice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "PerpContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpMarkPrice" ADD CONSTRAINT "PerpMarkPrice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "PerpContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpFundingRate" ADD CONSTRAINT "PerpFundingRate_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "PerpContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpFundingPayment" ADD CONSTRAINT "PerpFundingPayment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PerpAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpFundingPayment" ADD CONSTRAINT "PerpFundingPayment_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "PerpPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpFundingPayment" ADD CONSTRAINT "PerpFundingPayment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "PerpContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpLiquidation" ADD CONSTRAINT "PerpLiquidation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PerpAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpLiquidation" ADD CONSTRAINT "PerpLiquidation_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "PerpPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpLiquidation" ADD CONSTRAINT "PerpLiquidation_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "PerpContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpInsuranceFund" ADD CONSTRAINT "PerpInsuranceFund_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "PerpContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerpLedger" ADD CONSTRAINT "PerpLedger_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PerpAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Web3WalletKeyMaterial" ADD CONSTRAINT "Web3WalletKeyMaterial_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Web3WalletProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Web3WalletAddress" ADD CONSTRAINT "Web3WalletAddress_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Web3WalletProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Web3WalletAsset" ADD CONSTRAINT "Web3WalletAsset_chainType_chainId_fkey" FOREIGN KEY ("chainType", "chainId") REFERENCES "Web3WalletChainConfig"("chainType", "chainId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Web3WalletBalanceSnapshot" ADD CONSTRAINT "Web3WalletBalanceSnapshot_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Web3WalletAddress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Web3WalletBalanceSnapshot" ADD CONSTRAINT "Web3WalletBalanceSnapshot_chainType_chainId_assetSymbol_co_fkey" FOREIGN KEY ("chainType", "chainId", "assetSymbol", "contractAddress") REFERENCES "Web3WalletAsset"("chainType", "chainId", "symbol", "contractAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Web3WalletTransaction" ADD CONSTRAINT "Web3WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Web3WalletProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Web3WalletSignatureRequest" ADD CONSTRAINT "Web3WalletSignatureRequest_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Web3WalletProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Web3WalletDappSession" ADD CONSTRAINT "Web3WalletDappSession_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Web3WalletProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Web3WalletSecurityEvent" ADD CONSTRAINT "Web3WalletSecurityEvent_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Web3WalletProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Web3MpcWallet" ADD CONSTRAINT "Web3MpcWallet_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Web3WalletProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Web3MpcSigningRequest" ADD CONSTRAINT "Web3MpcSigningRequest_mpcWalletId_fkey" FOREIGN KEY ("mpcWalletId") REFERENCES "Web3MpcWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spot_account_ledgers" ADD CONSTRAINT "spot_account_ledgers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "spot_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spot_orders" ADD CONSTRAINT "spot_orders_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "spot_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spot_orders" ADD CONSTRAINT "spot_orders_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "spot_markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spot_trades" ADD CONSTRAINT "spot_trades_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "spot_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spot_trades" ADD CONSTRAINT "spot_trades_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "spot_markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
