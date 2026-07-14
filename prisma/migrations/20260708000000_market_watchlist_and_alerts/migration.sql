-- 行情自选 / 价格提醒
CREATE TABLE IF NOT EXISTS "market_watchlist_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "symbol" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_watchlist_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "market_watchlist_items_userId_symbol_key" ON "market_watchlist_items"("userId", "symbol");
CREATE INDEX IF NOT EXISTS "market_watchlist_items_userId_idx" ON "market_watchlist_items"("userId");

CREATE TABLE IF NOT EXISTS "market_price_alerts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "symbol" VARCHAR(32) NOT NULL,
    "condition" VARCHAR(8) NOT NULL,
    "targetPrice" DECIMAL(36,18) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "triggeredAt" TIMESTAMPTZ,
    "triggeredPrice" DECIMAL(36,18),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_price_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "market_price_alerts_userId_idx" ON "market_price_alerts"("userId");
CREATE INDEX IF NOT EXISTS "market_price_alerts_symbol_status_idx" ON "market_price_alerts"("symbol", "status");
