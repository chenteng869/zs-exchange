/**
 * Audit Service - 状态机 + 枚举
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.6.2
 *
 * Audit = 审计日志 / 操作日志 / 生命周期追踪 / 审计导出 / 完整性验证
 *  - 所有写操作前自动 record（埋点式）
 *  - 高危操作强制要求 approvalNo
 *  - 完整性验证：hash chain（prevHash + currentHash）
 *  - 不可变：append-only，不允许 update/delete
 *
 * 数据落地：FjnOperationLog（独立表，已存在）
 * 集成：所有 Service 在事务内调用 AuditService.record
 */

export const AUDIT_MODULE = {
  PRODUCT: 'product',
  ORDER: 'order',
  POINTS: 'points',
  NFT: 'nft',
  POWER: 'power',
  RELEASE: 'release',
  REWARD: 'reward',
  FINANCE: 'finance',
  TAX: 'tax',
  RISK: 'risk',
  USER: 'user',
  KYC: 'kyc',
  COMPLIANCE: 'compliance',
  APPROVAL: 'approval',
  MALL: 'mall',
  TREASURY: 'treasury',
  SYSTEM: 'system',
} as const;
export type FjnAuditModule = (typeof AUDIT_MODULE)[keyof typeof AUDIT_MODULE];

export const AUDIT_ACTION = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  FREEZE: 'freeze',
  UNFREEZE: 'unfreeze',
  APPROVE: 'approve',
  REJECT: 'reject',
  EXECUTE: 'execute',
  EXPORT: 'export',
  TRANSFER: 'transfer',
  MINT: 'mint',
  BURN: 'burn',
  LOCK: 'lock',
  UNLOCK: 'unlock',
  SETTLE: 'settle',
  REFUND: 'refund',
  VOID: 'void',
  CANCEL: 'cancel',
  ESCALATE: 'escalate',
  REVIEW: 'review',
  LOGIN: 'login',
  LOGOUT: 'logout',
} as const;
export type FjnAuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];

/** 强制要求 approvalNo 的高危模块 */
export const AUDIT_REQUIRE_APPROVAL_MODULES: ReadonlySet<string> = new Set([
  AUDIT_MODULE.POINTS,
  AUDIT_MODULE.FINANCE,
  AUDIT_MODULE.TAX,
  AUDIT_MODULE.NFT,
  AUDIT_MODULE.TREASURY,
  AUDIT_MODULE.RELEASE,
  AUDIT_MODULE.KYC,
  AUDIT_MODULE.COMPLIANCE,
]);

/** 风险等级（按 module + action 推导） */
export const AUDIT_RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type FjnAuditRiskLevel = (typeof AUDIT_RISK_LEVEL)[keyof typeof AUDIT_RISK_LEVEL];

/** 审计导出格式 */
export const AUDIT_EXPORT_FORMAT = {
  JSON: 'json',
  CSV: 'csv',
  NDJSON: 'ndjson',
  PARQUET: 'parquet',
} as const;
export type FjnAuditExportFormat = (typeof AUDIT_EXPORT_FORMAT)[keyof typeof AUDIT_EXPORT_FORMAT];

/** 审计完整性验证结果 */
export const AUDIT_VERIFY_RESULT = {
  VALID: 'valid',
  INVALID: 'invalid',
  PARTIAL: 'partial',
} as const;
export type FjnAuditVerifyResult = (typeof AUDIT_VERIFY_RESULT)[keyof typeof AUDIT_VERIFY_RESULT];

/** 哈希算法 */
export const AUDIT_HASH_ALGO = {
  SHA256: 'sha256',
} as const;
export type FjnAuditHashAlgo = (typeof AUDIT_HASH_ALGO)[keyof typeof AUDIT_HASH_ALGO];

/** 默认导出批量大小 */
export const AUDIT_EXPORT_BATCH_SIZE = 1000;

/** 默认保留天数 */
export const AUDIT_DEFAULT_RETENTION_DAYS = 365 * 7; // 7 年

/** 校验器 */
export const isValidAuditModule = (v: string): v is FjnAuditModule =>
  Object.values(AUDIT_MODULE).includes(v as any);
export const isValidAuditAction = (v: string): v is FjnAuditAction =>
  Object.values(AUDIT_ACTION).includes(v as any);
export const isValidAuditExportFormat = (v: string): v is FjnAuditExportFormat =>
  Object.values(AUDIT_EXPORT_FORMAT).includes(v as any);

/** 按 (module, action) 推导风险等级 */
export const getAuditRiskLevel = (
  module: FjnAuditModule,
  action: FjnAuditAction,
): FjnAuditRiskLevel => {
  // critical: 删除 / 资金转移 / 资产冻结
  if (action === AUDIT_ACTION.DELETE) return AUDIT_RISK_LEVEL.CRITICAL;
  if (module === AUDIT_MODULE.TREASURY && action === AUDIT_ACTION.TRANSFER) return AUDIT_RISK_LEVEL.CRITICAL;
  if (module === AUDIT_MODULE.POINTS && action === AUDIT_ACTION.BURN) return AUDIT_RISK_LEVEL.CRITICAL;
  if (action === AUDIT_ACTION.FREEZE) return AUDIT_RISK_LEVEL.HIGH;
  if (action === AUDIT_ACTION.UNFREEZE) return AUDIT_RISK_LEVEL.HIGH;
  if (action === AUDIT_ACTION.REFUND) return AUDIT_RISK_LEVEL.HIGH;
  if (action === AUDIT_ACTION.VOID) return AUDIT_RISK_LEVEL.HIGH;
  if (action === AUDIT_ACTION.MINT) return AUDIT_RISK_LEVEL.MEDIUM;
  if (action === AUDIT_ACTION.TRANSFER) return AUDIT_RISK_LEVEL.MEDIUM;
  if (action === AUDIT_ACTION.SETTLE) return AUDIT_RISK_LEVEL.MEDIUM;
  if (action === AUDIT_ACTION.EXECUTE) return AUDIT_RISK_LEVEL.MEDIUM;
  if (action === AUDIT_ACTION.EXPORT) return AUDIT_RISK_LEVEL.MEDIUM;
  return AUDIT_RISK_LEVEL.LOW;
};

/** 是否强制要求 approvalNo */
export const isApprovalRequired = (
  module: FjnAuditModule,
  action: FjnAuditAction,
): boolean => {
  if (!AUDIT_REQUIRE_APPROVAL_MODULES.has(module)) return false;
  // 高危动作才需要审批
  const risk = getAuditRiskLevel(module, action);
  return risk === AUDIT_RISK_LEVEL.HIGH || risk === AUDIT_RISK_LEVEL.CRITICAL;
};
