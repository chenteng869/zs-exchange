-- K-6: 安全相关数据库索引优化
-- 目标：加速安全审计/告警统计/异常检测的高频查询

-- ============================================================
-- AuditLoginLog：登录审计时间序列查询索引
-- ============================================================
-- 用户登录历史时间序列
CREATE INDEX IF NOT EXISTS "AuditLoginLog_userId_createdAt_idx"
  ON "AuditLoginLog" ("userId", "createdAt" DESC);

-- 失败登录检测（按状态 + 时间）
CREATE INDEX IF NOT EXISTS "AuditLoginLog_status_createdAt_idx"
  ON "AuditLoginLog" ("status", "createdAt" DESC);

-- IP 异常登录聚合
CREATE INDEX IF NOT EXISTS "AuditLoginLog_ipAddress_createdAt_idx"
  ON "AuditLoginLog" ("ipAddress", "createdAt" DESC);

-- 用户名登录历史
CREATE INDEX IF NOT EXISTS "AuditLoginLog_username_createdAt_idx"
  ON "AuditLoginLog" ("username", "createdAt" DESC);

-- ============================================================
-- fjn_device_blacklists：黑名单 fingerprintHash 索引
-- ============================================================
ALTER TABLE "fjn_device_blacklists"
  ADD COLUMN IF NOT EXISTS "fingerprintHash" VARCHAR(128);

CREATE INDEX IF NOT EXISTS "fjn_device_blacklists_fingerprintHash_idx"
  ON "fjn_device_blacklists" ("fingerprintHash");

-- 高频查询：active + 有效期过滤
CREATE INDEX IF NOT EXISTS "fjn_device_blacklists_status_expiresAt_idx"
  ON "fjn_device_blacklists" ("status", "expiresAt");

-- 来源 + 状态聚合分析
CREATE INDEX IF NOT EXISTS "fjn_device_blacklists_blacklistSource_status_idx"
  ON "fjn_device_blacklists" ("blacklistSource", "status");

-- ============================================================
-- 备注
-- ============================================================
-- FjnUserMfa 的 (status, lockedUntil) 复合索引已在主 schema 中存在
-- FjnUserMfaAuditLog 的 (userId, createdAt) / (action, success, createdAt) 已在主 schema 中存在
-- FjnDeviceRiskAssessment 的 (userId, createdAt) / (riskLevel, createdAt) 已在主 schema 中存在
-- 本次 migration 补全的是 AuditLoginLog 和 FjnDeviceBlacklist 的索引
