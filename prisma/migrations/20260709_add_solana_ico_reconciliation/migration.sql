-- Migration: 20260709_add_solana_ico_reconciliation
-- Description: 新增 Solana ICO 业务线对账报告与差异表
-- 文档：docs/02-技术规范/Solana上链与ICO发现机制讨论.md
-- 业务线：solana-ico（与 FJN 369 完全隔离）

-- 27.5 ICO 链上链下对账报告
CREATE TABLE IF NOT EXISTS solana_ico_reconciliation_reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_no     VARCHAR(64) UNIQUE NOT NULL,
  type          VARCHAR(32) NOT NULL,
  target_id     UUID,
  status        VARCHAR(32) NOT NULL DEFAULT 'pending',
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  chain_cluster VARCHAR(32) NOT NULL DEFAULT 'mainnet-beta',
  block_range   JSONB,
  summary       JSONB,
  error_message TEXT,
  triggered_by  UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solana_ico_recon_reports_type
  ON solana_ico_reconciliation_reports (type);
CREATE INDEX IF NOT EXISTS idx_solana_ico_recon_reports_status
  ON solana_ico_reconciliation_reports (status);
CREATE INDEX IF NOT EXISTS idx_solana_ico_recon_reports_cluster
  ON solana_ico_reconciliation_reports (chain_cluster);
CREATE INDEX IF NOT EXISTS idx_solana_ico_recon_reports_created
  ON solana_ico_reconciliation_reports (created_at);

-- 27.6 ICO 链上链下对账差异
CREATE TABLE IF NOT EXISTS solana_ico_reconciliation_discrepancies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id       UUID NOT NULL,
  type            VARCHAR(64) NOT NULL,
  severity        VARCHAR(16) NOT NULL,
  resource_type   VARCHAR(64) NOT NULL,
  resource_id     UUID NOT NULL,
  chain_value     TEXT,
  offchain_value  TEXT,
  diff            TEXT,
  description     TEXT NOT NULL,
  auto_fixed      BOOLEAN NOT NULL DEFAULT FALSE,
  fixed_at        TIMESTAMPTZ,
  resolution_note TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_solana_ico_recon_disc_report
    FOREIGN KEY (report_id)
    REFERENCES solana_ico_reconciliation_reports(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_solana_ico_recon_disc_report
  ON solana_ico_reconciliation_discrepancies (report_id);
CREATE INDEX IF NOT EXISTS idx_solana_ico_recon_disc_type
  ON solana_ico_reconciliation_discrepancies (type);
CREATE INDEX IF NOT EXISTS idx_solana_ico_recon_disc_severity
  ON solana_ico_reconciliation_discrepancies (severity);
CREATE INDEX IF NOT EXISTS idx_solana_ico_recon_disc_resource
  ON solana_ico_reconciliation_discrepancies (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_solana_ico_recon_disc_autofix
  ON solana_ico_reconciliation_discrepancies (auto_fixed);
