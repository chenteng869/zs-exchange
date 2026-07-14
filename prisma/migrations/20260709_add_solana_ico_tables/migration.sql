-- Migration: 20260709_add_solana_ico_tables
-- 目的：补齐 Solana ICO 业务线 4 张核心表（ADR-003 双业务线隔离）
-- 数据库前缀：solana_ico_*

-- ============================================================
-- 27.1 IcoToken - ICO 代币发行信息
-- ============================================================
CREATE TABLE IF NOT EXISTS solana_ico_tokens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol          VARCHAR(32) UNIQUE NOT NULL,
  name            VARCHAR(128) NOT NULL,
  mint_address    VARCHAR(64),
  decimals        INTEGER NOT NULL DEFAULT 9,
  total_supply    VARCHAR(64) NOT NULL,
  sale_supply     VARCHAR(64) NOT NULL,
  sold_supply     VARCHAR(64) NOT NULL DEFAULT '0',
  price_per_token DECIMAL(20, 8) NOT NULL,
  raise_goal      DECIMAL(20, 4) NOT NULL,
  raised_amount   DECIMAL(20, 4) NOT NULL DEFAULT 0,
  accept_mints    TEXT[] NOT NULL DEFAULT '{}',
  chain_cluster   VARCHAR(32) NOT NULL DEFAULT 'mainnet-beta',
  treasury_address VARCHAR(64) NOT NULL,
  tge_percent     DECIMAL(5, 2) NOT NULL DEFAULT 0,
  cliff_days      INTEGER NOT NULL DEFAULT 0,
  vesting_days    INTEGER NOT NULL DEFAULT 0,
  vesting_type    VARCHAR(32) NOT NULL DEFAULT 'linear',
  status          VARCHAR(32) NOT NULL DEFAULT 'draft',
  sale_start_at   TIMESTAMPTZ,
  sale_end_at     TIMESTAMPTZ,
  final_snapshot_at TIMESTAMPTZ,
  description     TEXT,
  metadata_uri    VARCHAR(512),
  metadata        JSONB,
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_solana_ico_tokens_status ON solana_ico_tokens (status);
CREATE INDEX IF NOT EXISTS idx_solana_ico_tokens_cluster ON solana_ico_tokens (chain_cluster);
CREATE INDEX IF NOT EXISTS idx_solana_ico_tokens_created ON solana_ico_tokens (created_at);

-- ============================================================
-- 27.2 IcoOrder - ICO 购买订单
-- ============================================================
CREATE TABLE IF NOT EXISTS solana_ico_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_no        VARCHAR(64) UNIQUE NOT NULL,
  token_id        UUID NOT NULL REFERENCES solana_ico_tokens(id),
  user_id         UUID NOT NULL,
  pay_mint        VARCHAR(64) NOT NULL,
  pay_amount      VARCHAR(64) NOT NULL,
  usd_value       DECIMAL(20, 4) NOT NULL,
  token_amount    VARCHAR(64) NOT NULL,
  price_per_token DECIMAL(20, 8) NOT NULL,
  status          VARCHAR(32) NOT NULL DEFAULT 'created',
  payer_wallet    VARCHAR(64),
  tx_signature    VARCHAR(128),
  confirmed_slot  BIGINT,
  confirmed_at    TIMESTAMPTZ,
  schedule_id     UUID,
  vesting_start_at TIMESTAMPTZ,
  vesting_end_at  TIMESTAMPTZ,
  kyc_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  region_code     CHAR(2),
  note            TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_solana_ico_orders_token ON solana_ico_orders (token_id);
CREATE INDEX IF NOT EXISTS idx_solana_ico_orders_user ON solana_ico_orders (user_id);
CREATE INDEX IF NOT EXISTS idx_solana_ico_orders_status ON solana_ico_orders (status);
CREATE INDEX IF NOT EXISTS idx_solana_ico_orders_tx ON solana_ico_orders (tx_signature);
CREATE INDEX IF NOT EXISTS idx_solana_ico_orders_created ON solana_ico_orders (created_at);

-- ============================================================
-- 27.3 IcoVestingSchedule - 释放计划
-- ============================================================
CREATE TABLE IF NOT EXISTS solana_ico_vesting_schedules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id        UUID NOT NULL REFERENCES solana_ico_tokens(id),
  schedule_no     VARCHAR(64) UNIQUE NOT NULL,
  name            VARCHAR(128) NOT NULL,
  status          VARCHAR(32) NOT NULL DEFAULT 'draft',
  total_amount    VARCHAR(64) NOT NULL,
  released_amount VARCHAR(64) NOT NULL DEFAULT '0',
  tge_percent     DECIMAL(5, 2) NOT NULL DEFAULT 0,
  cliff_days      INTEGER NOT NULL DEFAULT 0,
  vesting_days    INTEGER NOT NULL DEFAULT 0,
  vesting_type    VARCHAR(32) NOT NULL DEFAULT 'linear',
  tge_at          TIMESTAMPTZ,
  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  last_claim_at   TIMESTAMPTZ,
  merkle_root     VARCHAR(128),
  authority       VARCHAR(64) NOT NULL,
  chain_schedule_id VARCHAR(64),
  chain_tx_sig    VARCHAR(128),
  metadata        JSONB,
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_solana_ico_schedules_token ON solana_ico_vesting_schedules (token_id);
CREATE INDEX IF NOT EXISTS idx_solana_ico_schedules_status ON solana_ico_vesting_schedules (status);
CREATE INDEX IF NOT EXISTS idx_solana_ico_schedules_chain ON solana_ico_vesting_schedules (chain_schedule_id);

-- ============================================================
-- 27.4 IcoClaim - 释放领取记录
-- ============================================================
CREATE TABLE IF NOT EXISTS solana_ico_claims (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_no        VARCHAR(64) UNIQUE NOT NULL,
  order_id        UUID NOT NULL REFERENCES solana_ico_orders(id),
  user_id         UUID NOT NULL,
  schedule_id     UUID NOT NULL,
  amount          VARCHAR(64) NOT NULL,
  claimable_at    TIMESTAMPTZ NOT NULL,
  status          VARCHAR(32) NOT NULL DEFAULT 'pending',
  tx_signature    VARCHAR(128),
  confirmed_at    TIMESTAMPTZ,
  merkle_proof    TEXT[] NOT NULL DEFAULT '{}',
  leaf_hash       VARCHAR(128),
  note            TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solana_ico_claims_order ON solana_ico_claims (order_id);
CREATE INDEX IF NOT EXISTS idx_solana_ico_claims_user ON solana_ico_claims (user_id);
CREATE INDEX IF NOT EXISTS idx_solana_ico_claims_schedule ON solana_ico_claims (schedule_id);
CREATE INDEX IF NOT EXISTS idx_solana_ico_claims_status ON solana_ico_claims (status);
CREATE INDEX IF NOT EXISTS idx_solana_ico_claims_claimable ON solana_ico_claims (claimable_at);

-- ============================================================
-- 数据完整性
-- ============================================================
COMMENT ON TABLE solana_ico_tokens IS 'ICO 代币发行信息 - ADR-003 双业务线 A 主业务';
COMMENT ON TABLE solana_ico_orders IS 'ICO 购买订单 - 与 FJN fjn_orders 严格隔离';
COMMENT ON TABLE solana_ico_vesting_schedules IS 'ICO 释放计划 - 链下 Merkle + 链上 fjn_release_program';
COMMENT ON TABLE solana_ico_claims IS 'ICO 释放领取记录 - 用户每日可领';
