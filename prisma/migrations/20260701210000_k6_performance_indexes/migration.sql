-- K-6 性能优化索引
-- 目的: 为高频查询模式添加复合索引
-- 影响: 不变更 schema/数据，仅添加索引
-- 可回滚: DROP INDEX IF EXISTS ...

-- ============================================================
-- CoreSession: 异常旋转检测 DB 降级路径
-- ============================================================
CREATE INDEX IF NOT EXISTS "CoreSession_userId_createdAt_idx"
  ON "CoreSession"("userId", "createdAt" DESC);

-- ============================================================
-- fjn_user_mfa: 锁定用户查询
-- ============================================================
CREATE INDEX IF NOT EXISTS "fjn_user_mfa_status_lockedUntil_idx"
  ON "fjn_user_mfa"("status", "lockedUntil");

-- ============================================================
-- fjn_user_mfa_audit_logs: 失败检测 + 告警统计
-- ============================================================
CREATE INDEX IF NOT EXISTS "fjn_user_mfa_audit_logs_action_success_createdAt_idx"
  ON "fjn_user_mfa_audit_logs"("action", "success", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "fjn_user_mfa_audit_logs_userId_action_createdAt_idx"
  ON "fjn_user_mfa_audit_logs"("userId", "action", "createdAt" DESC);

-- ============================================================
-- fjn_user_devices: "我的设备" 页面
-- ============================================================
CREATE INDEX IF NOT EXISTS "fjn_user_devices_userId_lastActiveAt_idx"
  ON "fjn_user_devices"("userId", "lastActiveAt" DESC);

CREATE INDEX IF NOT EXISTS "fjn_user_devices_fingerprintId_status_idx"
  ON "fjn_user_devices"("fingerprintId", "status");

-- ============================================================
-- fjn_device_risk_assessments: 用户风险历史 + 风险仪表盘
-- ============================================================
CREATE INDEX IF NOT EXISTS "fjn_device_risk_assessments_userId_createdAt_idx"
  ON "fjn_device_risk_assessments"("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "fjn_device_risk_assessments_riskLevel_createdAt_idx"
  ON "fjn_device_risk_assessments"("riskLevel", "createdAt" DESC);

-- ============================================================
-- fjn_device_challenges: 清理过期挑战
-- ============================================================
CREATE INDEX IF NOT EXISTS "fjn_device_challenges_status_expiresAt_idx"
  ON "fjn_device_challenges"("status", "expiresAt");

-- ============================================================
-- fjn_finance_ledgers: 用户交易历史 + 财务对账
-- ============================================================
CREATE INDEX IF NOT EXISTS "fjn_finance_ledgers_userId_createdAt_idx"
  ON "fjn_finance_ledgers"("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "fjn_finance_ledgers_businessType_createdAt_idx"
  ON "fjn_finance_ledgers"("businessType", "createdAt" DESC);

-- ============================================================
-- fjn_settlements: 结算仪表盘
-- ============================================================
CREATE INDEX IF NOT EXISTS "fjn_settlements_status_createdAt_idx"
  ON "fjn_settlements"("status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "fjn_settlements_settlementType_status_idx"
  ON "fjn_settlements"("settlementType", "status");
