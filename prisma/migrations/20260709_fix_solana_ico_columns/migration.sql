-- Migration: 20260709_fix_solana_ico_columns
-- 目的：将 ICO 业务线表列名从 snake_case 重命名为 Prisma 默认的 camelCase
-- Prisma 默认列名 = 字段名原样（不加引号）
-- 原因：原 migration 使用了 snake_case 列名，但 Prisma 模型中是 camelCase

-- ============================================================
-- solana_ico_tokens
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
  col TEXT;
  snake TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY['solana_ico_tokens','solana_ico_orders','solana_ico_vesting_schedules','solana_ico_claims','solana_ico_reconciliation_reports','solana_ico_reconciliation_discrepancies'])
  LOOP
    NULL;
  END LOOP;
END $$;

-- solana_ico_tokens
ALTER TABLE solana_ico_tokens RENAME COLUMN mint_address TO "mintAddress";
ALTER TABLE solana_ico_tokens RENAME COLUMN tge_percent TO "tgePercent";
ALTER TABLE solana_ico_tokens RENAME COLUMN cliff_days TO "cliffDays";
ALTER TABLE solana_ico_tokens RENAME COLUMN vesting_days TO "vestingDays";
ALTER TABLE solana_ico_tokens RENAME COLUMN vesting_type TO "vestingType";
ALTER TABLE solana_ico_tokens RENAME COLUMN chain_cluster TO "chainCluster";
ALTER TABLE solana_ico_tokens RENAME COLUMN treasury_address TO "treasuryAddress";
ALTER TABLE solana_ico_tokens RENAME COLUMN accept_mints TO "acceptMints";
ALTER TABLE solana_ico_tokens RENAME COLUMN total_supply TO "totalSupply";
ALTER TABLE solana_ico_tokens RENAME COLUMN sale_supply TO "saleSupply";
ALTER TABLE solana_ico_tokens RENAME COLUMN sold_supply TO "soldSupply";
ALTER TABLE solana_ico_tokens RENAME COLUMN price_per_token TO "pricePerToken";
ALTER TABLE solana_ico_tokens RENAME COLUMN raise_goal TO "raiseGoal";
ALTER TABLE solana_ico_tokens RENAME COLUMN raised_amount TO "raisedAmount";
ALTER TABLE solana_ico_tokens RENAME COLUMN sale_start_at TO "saleStartAt";
ALTER TABLE solana_ico_tokens RENAME COLUMN sale_end_at TO "saleEndAt";
ALTER TABLE solana_ico_tokens RENAME COLUMN final_snapshot_at TO "finalSnapshotAt";
ALTER TABLE solana_ico_tokens RENAME COLUMN metadata_uri TO "metadataUri";
ALTER TABLE solana_ico_tokens RENAME COLUMN created_by TO "createdBy";
ALTER TABLE solana_ico_tokens RENAME COLUMN created_at TO "createdAt";
ALTER TABLE solana_ico_tokens RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE solana_ico_tokens ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;

-- solana_ico_orders
ALTER TABLE solana_ico_orders RENAME COLUMN order_no TO "orderNo";
ALTER TABLE solana_ico_orders RENAME COLUMN token_id TO "tokenId";
ALTER TABLE solana_ico_orders RENAME COLUMN user_id TO "userId";
ALTER TABLE solana_ico_orders RENAME COLUMN pay_mint TO "payMint";
ALTER TABLE solana_ico_orders RENAME COLUMN pay_amount TO "payAmount";
ALTER TABLE solana_ico_orders RENAME COLUMN usd_value TO "usdValue";
ALTER TABLE solana_ico_orders RENAME COLUMN token_amount TO "tokenAmount";
ALTER TABLE solana_ico_orders RENAME COLUMN price_per_token TO "pricePerToken";
ALTER TABLE solana_ico_orders RENAME COLUMN payer_wallet TO "payerWallet";
ALTER TABLE solana_ico_orders RENAME COLUMN tx_signature TO "txSignature";
ALTER TABLE solana_ico_orders RENAME COLUMN confirmed_slot TO "confirmedSlot";
ALTER TABLE solana_ico_orders RENAME COLUMN confirmed_at TO "confirmedAt";
ALTER TABLE solana_ico_orders RENAME COLUMN schedule_id TO "scheduleId";
ALTER TABLE solana_ico_orders RENAME COLUMN vesting_start_at TO "vestingStartAt";
ALTER TABLE solana_ico_orders RENAME COLUMN vesting_end_at TO "vestingEndAt";
ALTER TABLE solana_ico_orders RENAME COLUMN kyc_verified TO "kycVerified";
ALTER TABLE solana_ico_orders RENAME COLUMN region_code TO "regionCode";
ALTER TABLE solana_ico_orders RENAME COLUMN created_at TO "createdAt";
ALTER TABLE solana_ico_orders RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE solana_ico_orders ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;

-- solana_ico_vesting_schedules
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN token_id TO "tokenId";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN schedule_no TO "scheduleNo";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN total_amount TO "totalAmount";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN released_amount TO "releasedAmount";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN tge_percent TO "tgePercent";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN cliff_days TO "cliffDays";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN vesting_days TO "vestingDays";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN vesting_type TO "vestingType";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN tge_at TO "tgeAt";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN start_at TO "startAt";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN end_at TO "endAt";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN last_claim_at TO "lastClaimAt";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN merkle_root TO "merkleRoot";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN chain_schedule_id TO "chainScheduleId";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN chain_tx_sig TO "chainTxSig";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN created_by TO "createdBy";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN created_at TO "createdAt";
ALTER TABLE solana_ico_vesting_schedules RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE solana_ico_vesting_schedules ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;

-- solana_ico_claims
ALTER TABLE solana_ico_claims RENAME COLUMN claim_no TO "claimNo";
ALTER TABLE solana_ico_claims RENAME COLUMN order_id TO "orderId";
ALTER TABLE solana_ico_claims RENAME COLUMN user_id TO "userId";
ALTER TABLE solana_ico_claims RENAME COLUMN schedule_id TO "scheduleId";
ALTER TABLE solana_ico_claims RENAME COLUMN claimable_at TO "claimableAt";
ALTER TABLE solana_ico_claims RENAME COLUMN tx_signature TO "txSignature";
ALTER TABLE solana_ico_claims RENAME COLUMN confirmed_at TO "confirmedAt";
ALTER TABLE solana_ico_claims RENAME COLUMN merkle_proof TO "merkleProof";
ALTER TABLE solana_ico_claims RENAME COLUMN leaf_hash TO "leafHash";
ALTER TABLE solana_ico_claims RENAME COLUMN created_at TO "createdAt";
ALTER TABLE solana_ico_claims RENAME COLUMN updated_at TO "updatedAt";

-- solana_ico_reconciliation_reports
ALTER TABLE solana_ico_reconciliation_reports RENAME COLUMN report_no TO "reportNo";
ALTER TABLE solana_ico_reconciliation_reports RENAME COLUMN target_id TO "targetId";
ALTER TABLE solana_ico_reconciliation_reports RENAME COLUMN started_at TO "startedAt";
ALTER TABLE solana_ico_reconciliation_reports RENAME COLUMN completed_at TO "completedAt";
ALTER TABLE solana_ico_reconciliation_reports RENAME COLUMN chain_cluster TO "chainCluster";
ALTER TABLE solana_ico_reconciliation_reports RENAME COLUMN block_range TO "blockRange";
ALTER TABLE solana_ico_reconciliation_reports RENAME COLUMN error_message TO "errorMessage";
ALTER TABLE solana_ico_reconciliation_reports RENAME COLUMN triggered_by TO "triggeredBy";
ALTER TABLE solana_ico_reconciliation_reports RENAME COLUMN created_at TO "createdAt";
ALTER TABLE solana_ico_reconciliation_reports RENAME COLUMN updated_at TO "updatedAt";

-- solana_ico_reconciliation_discrepancies
ALTER TABLE solana_ico_reconciliation_discrepancies RENAME COLUMN report_id TO "reportId";
ALTER TABLE solana_ico_reconciliation_discrepancies RENAME COLUMN resource_type TO "resourceType";
ALTER TABLE solana_ico_reconciliation_discrepancies RENAME COLUMN resource_id TO "resourceId";
ALTER TABLE solana_ico_reconciliation_discrepancies RENAME COLUMN chain_value TO "chainValue";
ALTER TABLE solana_ico_reconciliation_discrepancies RENAME COLUMN offchain_value TO "offchainValue";
ALTER TABLE solana_ico_reconciliation_discrepancies RENAME COLUMN auto_fixed TO "autoFixed";
ALTER TABLE solana_ico_reconciliation_discrepancies RENAME COLUMN fixed_at TO "fixedAt";
ALTER TABLE solana_ico_reconciliation_discrepancies RENAME COLUMN resolution_note TO "resolutionNote";
ALTER TABLE solana_ico_reconciliation_discrepancies RENAME COLUMN created_at TO "createdAt";
ALTER TABLE solana_ico_reconciliation_discrepancies RENAME COLUMN updated_at TO "updatedAt";

-- 重建索引为 camelCase
DROP INDEX IF EXISTS idx_solana_ico_tokens_status;
CREATE INDEX IF NOT EXISTS "idx_solana_ico_tokens_status" ON solana_ico_tokens ("status");
DROP INDEX IF EXISTS idx_solana_ico_tokens_cluster;
CREATE INDEX IF NOT EXISTS "idx_solana_ico_tokens_cluster" ON solana_ico_tokens ("chainCluster");
DROP INDEX IF EXISTS idx_solana_ico_tokens_created;
CREATE INDEX IF NOT EXISTS "idx_solana_ico_tokens_created" ON solana_ico_tokens ("createdAt");
