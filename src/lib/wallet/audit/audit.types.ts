/**
 * Web3 钱包全链路审计与合规报表系统 - 核心类型定义
 *
 * 模块组成：
 *  - AuditAction: 所有可审计动作枚举
 *  - AuditStatus: 审计状态枚举
 *  - AuditLogEntry: 审计日志条目接口
 *  - AuditEvidence: 审计证据接口
 *  - EvidenceChainBlock: 证据链区块接口
 *  - ComplianceReport: 合规报表接口
 *  - RetentionPolicy: 留存策略接口
 *  - AuditQueryFilter: 审计查询过滤器接口
 */

// ============================================================================
// 审计动作枚举 - 所有可审计的操作类型
// ============================================================================

/**
 * 审计动作枚举
 * 涵盖钱包、交易、签名、权限、DApp、安全等所有可审计操作
 */
export enum AuditAction {
  // ===== 钱包操作 =====
  WALLET_CREATE = 'wallet_create',
  WALLET_IMPORT = 'wallet_import',
  WALLET_EXPORT = 'wallet_export',
  WALLET_DELETE = 'wallet_delete',
  WALLET_RENAME = 'wallet_rename',
  WALLET_BACKUP = 'wallet_backup',
  WALLET_RESTORE = 'wallet_restore',
  WALLET_SWITCH = 'wallet_switch',
  WALLET_LOCK = 'wallet_lock',
  WALLET_UNLOCK = 'wallet_unlock',

  // ===== 密钥操作 =====
  KEY_GENERATE = 'key_generate',
  KEY_EXPORT = 'key_export',
  KEY_IMPORT = 'key_import',
  KEY_DELETE = 'key_delete',
  KEY_DERIVE = 'key_derive',
  KEY_ROTATE = 'key_rotate',

  // ===== 签名操作 =====
  SIGN_TRANSACTION = 'sign_transaction',
  SIGN_MESSAGE = 'sign_message',
  SIGN_TYPED_DATA = 'sign_typed_data',
  SIGN_PERSONAL = 'sign_personal',
  SIGN_ECDSA = 'sign_ecdsa',
  SIGN_ED25519 = 'sign_ed25519',

  // ===== 交易操作 =====
  TRANSACTION_BUILD = 'transaction_build',
  TRANSACTION_SIGN = 'transaction_sign',
  TRANSACTION_BROADCAST = 'transaction_broadcast',
  TRANSACTION_CONFIRM = 'transaction_confirm',
  TRANSACTION_SPEEDUP = 'transaction_speedup',
  TRANSACTION_CANCEL = 'transaction_cancel',
  TRANSACTION_REPLACE = 'transaction_replace',
  TRANSACTION_DROP = 'transaction_drop',
  TRANSACTION_SIMULATE = 'transaction_simulate',
  TRANSACTION_ESTIMATE_GAS = 'transaction_estimate_gas',

  // ===== 充值提现 =====
  DEPOSIT_DETECTED = 'deposit_detected',
  DEPOSIT_CONFIRMED = 'deposit_confirmed',
  WITHDRAWAL_REQUEST = 'withdrawal_request',
  WITHDRAWAL_APPROVE = 'withdrawal_approve',
  WITHDRAWAL_REJECT = 'withdrawal_reject',
  WITHDRAWAL_BROADCAST = 'withdrawal_broadcast',
  WITHDRAWAL_COMPLETE = 'withdrawal_complete',
  WITHDRAWAL_FAILED = 'withdrawal_failed',

  // ===== DApp 操作 =====
  DAPP_CONNECT = 'dapp_connect',
  DAPP_DISCONNECT = 'dapp_disconnect',
  DAPP_PERMISSION_GRANT = 'dapp_permission_grant',
  DAPP_PERMISSION_REVOKE = 'dapp_permission_revoke',
  DAPP_WHITELIST_ADD = 'dapp_whitelist_add',
  DAPP_WHITELIST_REMOVE = 'dapp_whitelist_remove',
  DAPP_BLACKLIST_ADD = 'dapp_blacklist_add',
  DAPP_BLACKLIST_REMOVE = 'dapp_blacklist_remove',
  DAPP_SESSION_CREATE = 'dapp_session_create',
  DAPP_SESSION_END = 'dapp_session_end',

  // ===== 认证操作 =====
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  SESSION_REFRESH = 'session_refresh',
  SESSION_EXPIRE = 'session_expire',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  PIN_SET = 'pin_set',
  PIN_CHANGE = 'pin_change',
  BIOMETRIC_ENABLE = 'biometric_enable',
  BIOMETRIC_DISABLE = 'biometric_disable',
  TWOFA_ENABLE = 'twofa_enable',
  TWOFA_DISABLE = 'twofa_disable',
  TWOFA_VERIFY = 'twofa_verify',

  // ===== 权限操作 =====
  PERMISSION_GRANT = 'permission_grant',
  PERMISSION_REVOKE = 'permission_revoke',
  ROLE_ASSIGN = 'role_assign',
  ROLE_REVOKE = 'role_revoke',
  ADMIN_ACTION = 'admin_action',
  POLICY_CREATE = 'policy_create',
  POLICY_UPDATE = 'policy_update',
  POLICY_DELETE = 'policy_delete',

  // ===== 地址簿操作 =====
  ADDRESS_BOOK_ADD = 'address_book_add',
  ADDRESS_BOOK_REMOVE = 'address_book_remove',
  ADDRESS_BOOK_UPDATE = 'address_book_update',
  ADDRESS_BLACKLIST_ADD = 'address_blacklist_add',
  ADDRESS_BLACKLIST_REMOVE = 'address_blacklist_remove',
  ADDRESS_WHITELIST_ADD = 'address_whitelist_add',
  ADDRESS_WHITELIST_REMOVE = 'address_whitelist_remove',

  // ===== Token/NFT 操作 =====
  TOKEN_ADD = 'token_add',
  TOKEN_REMOVE = 'token_remove',
  TOKEN_APPROVAL_GRANT = 'token_approval_grant',
  TOKEN_APPROVAL_REVOKE = 'token_approval_revoke',
  NFT_TRANSFER = 'nft_transfer',
  NFT_MINT = 'nft_mint',
  NFT_BURN = 'nft_burn',

  // ===== DeFi 操作 =====
  SWAP_EXECUTE = 'swap_execute',
  STAKING_DEPOSIT = 'staking_deposit',
  STAKING_WITHDRAW = 'staking_withdraw',
  STAKING_CLAIM = 'staking_claim',
  LIQUIDITY_ADD = 'liquidity_add',
  LIQUIDITY_REMOVE = 'liquidity_remove',
  FARMING_DEPOSIT = 'farming_deposit',
  FARMING_WITHDRAW = 'farming_withdraw',
  BRIDGE_DEPOSIT = 'bridge_deposit',
  BRIDGE_WITHDRAW = 'bridge_withdraw',
  LENDING_BORROW = 'lending_borrow',
  LENDING_REPAY = 'lending_repay',

  // ===== 安全事件 =====
  SECURITY_ALERT = 'security_alert',
  PHISHING_DETECTED = 'phishing_detected',
  MALWARE_DETECTED = 'malware_detected',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  FRAUD_DETECTED = 'fraud_detected',
  AML_FLAG = 'aml_flag',
  SANCTIONS_HIT = 'sanctions_hit',

  // ===== 数据导出导入 =====
  DATA_EXPORT = 'data_export',
  DATA_IMPORT = 'data_import',
  SETTINGS_BACKUP = 'settings_backup',
  SETTINGS_RESTORE = 'settings_restore',

  // ===== 系统操作 =====
  SYSTEM_START = 'system_start',
  SYSTEM_STOP = 'system_stop',
  SYSTEM_UPDATE = 'system_update',
  CONFIG_CHANGE = 'config_change',
  FEATURE_TOGGLE = 'feature_toggle',
  API_KEY_CREATE = 'api_key_create',
  API_KEY_REVOKE = 'api_key_revoke',
  WEBHOOK_TRIGGER = 'webhook_trigger',
  CHAIN_SWITCH = 'chain_switch',
  NODE_SWITCH = 'node_switch',

  // ===== 合规操作 =====
  KYC_SUBMIT = 'kyc_submit',
  IDENTITY_SUBMIT = 'identity_submit',
  KYC_APPROVE = 'kyc_approve',
  KYC_REJECT = 'kyc_reject',
  KYC_VERIFY_SUCCESS = 'kyc_verify_success',
  KYC_VERIFY_FAILED = 'kyc_verify_failed',
  IDENTITY_VERIFY_SUCCESS = 'identity_verify_success',
  IDENTITY_VERIFY_FAILED = 'identity_verify_failed',
  AML_CHECK = 'aml_check',
  COMPLIANCE_REVIEW = 'compliance_review',
  REPORT_GENERATE = 'report_generate',
  AUDIT_TRAIL_VERIFY = 'audit_trail_verify',

  // ===== 其他 =====
  CUSTOM_ACTION = 'custom_action',
}

// ============================================================================
// 审计状态枚举
// ============================================================================

/**
 * 审计状态枚举
 */
export enum AuditStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled',
}

// ============================================================================
// 严重程度枚举
// ============================================================================

/**
 * 严重程度枚举
 */
export enum AuditSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  WARNING = 'warning',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// ============================================================================
// 审计类别枚举
// ============================================================================

/**
 * 审计类别枚举
 */
export enum AuditCategory {
  WALLET = 'wallet',
  KEYS = 'keys',
  KEY_MANAGEMENT = 'key_management',
  SIGNATURE = 'signature',
  TRANSACTION = 'transaction',
  DEPOSIT_WITHDRAWAL = 'deposit_withdrawal',
  DAPP = 'dapp',
  AUTHENTICATION = 'authentication',
  IDENTITY = 'identity',
  KYC = 'kyc',
  PERMISSION = 'permission',
  SECURITY = 'security',
  COMPLIANCE = 'compliance',
  DEFI = 'defi',
  NFT = 'nft',
  ADDRESS_BOOK = 'address_book',
  SYSTEM = 'system',
  CUSTOM = 'custom',
}

// ============================================================================
// 留存动作枚举
// ============================================================================

export enum RetentionAction {
  MOVE_TO_WARM = 'move_to_warm',
  MOVE_TO_COLD = 'move_to_cold',
  ARCHIVE = 'archive',
  PURGE = 'purge',
  KEEP_FOREVER = 'keep_forever',
}

// ============================================================================
// 审计参与者接口
// ============================================================================

/**
 * 审计参与者接口
 * 描述执行操作的主体
 */
export interface AuditActor {
  type: 'user' | 'system' | 'dapp' | 'api' | 'admin' | 'bot';
  id?: string;
  userId?: string;
  walletId?: string;
  address?: string;
  dappUrl?: string;
  dappName?: string;
  apiKeyId?: string;
  role?: string;
  ip?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  deviceInfo?: AuditDeviceInfo;
  location?: string;
}

/**
 * 审计目标接口
 * 描述操作的对象
 */
export interface AuditTarget {
  type: 'wallet' | 'account' | 'transaction' | 'dapp' | 'token' | 'nft' | 'address' | 'setting' | 'api_key' | 'system';
  id?: string;
  walletId?: string;
  address?: string;
  name?: string;
  symbol?: string;
  chainId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 设备信息接口
 */
export interface AuditDeviceInfo {
  deviceId: string;
  deviceName?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'hardware' | 'browser' | 'server';
  os?: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
  appVersion?: string;
  isTrusted?: boolean;
  isNewDevice?: boolean;
  lastActive?: number;
}

// ============================================================================
// 审计日志条目接口
// ============================================================================

/**
 * 审计日志条目接口
 * 所有审计操作的核心数据结构
 */
export interface AuditLogEntry {
  id: string;
  traceId: string;
  spanId?: string;
  parentSpanId?: string;
  timestamp: number;
  action: AuditAction;
  category: AuditCategory;
  status: AuditStatus;
  severity: AuditSeverity;
  actor: AuditActor;
  target?: AuditTarget;
  description: string;
  metadata: AuditLogMetadata;
  relatedLogIds?: string[];
  evidenceHash?: string;
  chainBlockHash?: string;
  riskScore?: number;
  riskFactors?: string[];
  durationMs?: number;
  duration?: number;
  errorCode?: string;
  errorMessage?: string;
  details?: string;
  requestId?: string;
  sessionId?: string;
  correlationId?: string;
  chainId?: string;
  txHash?: string;
  blockNumber?: number;
  ip?: string;
  userAgent?: string;
  indexedFields: string[] | [];
  isArchived?: boolean;
  retentionClass?: RetentionClass;
  tamperProof?: {
    hash: string;
    previousHash: string;
    merkleProof?: string[];
    verified: boolean;
  };
}

/**
 * 审计日志元数据接口
 */
export interface AuditLogMetadata {
  [key: string]: unknown;
  amount?: string;
  currency?: string;
  value?: string;
  gasPrice?: string;
  gasLimit?: string;
  gasUsed?: string;
  nonce?: number;
  from?: string;
  to?: string;
  data?: string;
  method?: string;
  permissions?: string[];
  previousValue?: unknown;
  newValue?: unknown;
  changes?: AuditChangeRecord[];
  signatures?: AuditSignatureRecord[];
  confirmations?: number;
  chainId?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  fee?: string;
  feeCurrency?: string;
  bridgeSourceChain?: string;
  bridgeDestChain?: string;
  amlResult?: AmlCheckResult;
  kycLevel?: string;
  sanctionsList?: string[];
}

/**
 * 审计变更记录接口
 */
export interface AuditChangeRecord {
  field: string;
  previousValue: unknown;
  newValue: unknown;
  changeType: 'create' | 'update' | 'delete';
}

/**
 * 审计签名记录接口
 */
export interface AuditSignatureRecord {
  signer: string;
  signature: string;
  signMethod: string;
  signedAt: number;
  keyId?: string;
  hardwareWallet?: string;
}

/**
 * AML 检查结果接口
 */
export interface AmlCheckResult {
  passed: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  checks: AmlCheckItem[];
  alerts: string[];
  checkedAt: number;
  provider?: string;
}

/**
 * AML 检查项接口
 */
export interface AmlCheckItem {
  checkId: string;
  checkName: string;
  passed: boolean;
  riskLevel: string;
  details?: string;
}

// ============================================================================
// 审计证据接口
// ============================================================================

/**
 * 审计证据类型枚举
 */
export enum AuditEvidenceType {
  TRANSACTION_RECEIPT = 'transaction_receipt',
  SIGNATURE_PROOF = 'signature_proof',
  SCREENSHOT = 'screenshot',
  LOG_FILE = 'log_file',
  DATABASE_RECORD = 'database_record',
  BLOCKCHAIN_RECORD = 'blockchain_record',
  USER_CONFIRMATION = 'user_confirmation',
  EMAIL_VERIFICATION = 'email_verification',
  SMS_VERIFICATION = 'sms_verification',
  DOCUMENT = 'document',
  CERTIFICATE = 'certificate',
  CUSTOM = 'custom',
}

/**
 * 审计证据接口
 */
export interface AuditEvidence {
  id: string;
  auditLogId: string;
  type: AuditEvidenceType;
  evidenceType?: AuditEvidenceType;
  title: string;
  description?: string;
  mimeType?: string;
  dataHash: string;
  dataUrl?: string;
  dataSize?: number;
  timestamp?: number;
  collectedAt: number;
  collectedBy: string;
  storageLocation?: string;
  encryptionKeyId?: string;
  isEncrypted: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed';
  verifiedAt?: number;
  verifiedBy?: string;
  chainAnchored: boolean;
  anchorTxHash?: string;
  anchorBlockNumber?: number;
  metadata?: Record<string, unknown>;
  relatedEvidenceIds?: string[];
}

// ============================================================================
// 证据链区块接口
// ============================================================================

/**
 * 证据链区块接口
 * 实现不可篡改的审计证据链
 */
export interface EvidenceChainBlock {
  index: number;
  blockId: string;
  previousHash: string;
  hash: string;
  timestamp: number;
  merkleRoot: string;
  transactionCount: number;
  auditLogIds: string[];
  evidenceIds: string[];
  validator: string;
  signature: string;
  difficulty?: number;
  nonce?: number;
  version: number;
  chainAnchor?: {
    chainId: string;
    txHash: string;
    blockNumber: number;
    anchoredAt: number;
    confirmations: number;
  };
  metadata?: {
    batchId?: string;
    periodStart?: number;
    periodEnd?: number;
    totalLogs?: number;
    totalSizeBytes?: number;
  };
}

/**
 * 默克尔树节点接口
 */
export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  isLeaf?: boolean;
  value?: string;
}

/**
 * 默克尔证明接口
 */
export interface MerkleProof {
  root: string;
  leaf: string;
  proof: string[];
  position: number;
  verified: boolean;
}

// ============================================================================
// 合规报表接口
// ============================================================================

/**
 * 报表类型枚举
 */
export enum ReportType {
  DAILY_SUMMARY = 'daily_summary',
  TRANSACTION_REPORT = 'transaction_report',
  USER_ACTIVITY = 'user_activity',
  RISK_ALERT = 'risk_alert',
  REGULATORY = 'regulatory',
  AUDIT_TRAIL = 'audit_trail',
  COMPLIANCE_STATUS = 'compliance_status',
  AML_CTF = 'aml_ctf',
  CUSTOM = 'custom',
}

/**
 * 报表格式枚举
 */
export enum ReportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
  JSON = 'json',
  HTML = 'html',
  XML = 'xml',
}

/**
 * 报表状态枚举
 */
export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  ARCHIVED = 'archived',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * 报表调度频率枚举
 */
export enum ReportSchedule {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  ON_DEMAND = 'on_demand',
}

/**
 * 合规报表接口
 */
export interface ComplianceReport {
  id: string;
  reportType: ReportType;
  title: string;
  description?: string;
  format: ReportFormat;
  status: ReportStatus;
  schedule: ReportSchedule;
  periodStart: number;
  periodEnd: number;
  generatedAt?: number;
  generatedBy?: string;
  fileUrl?: string;
  fileSize?: number;
  fileHash?: string;
  parameters: ReportParameters;
  sections: ReportSection[];
  statistics: ReportStatistics;
  dataSources: string[];
  approvals: ReportApproval[];
  distributionList: string[];
  retentionClass: RetentionClass;
  isArchived: boolean;
  version: number;
  previousVersionId?: string;
  templateId?: string;
  locale?: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 报表参数接口
 */
export interface ReportParameters {
  dateRange?: {
    start: number;
    end: number;
  };
  userId?: string;
  walletId?: string;
  chainId?: string;
  asset?: string;
  riskLevel?: string;
  includeArchived?: boolean;
  customFields?: string[];
  filters?: Record<string, unknown>;
  aggregation?: 'none' | 'daily' | 'weekly' | 'monthly';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

/**
 * 报表章节接口
 */
export interface ReportSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  type: 'summary' | 'table' | 'chart' | 'text' | 'list';
  data: unknown;
  visible: boolean;
  columns?: ReportColumn[];
  rows?: Record<string, unknown>[];
  chartConfig?: Record<string, unknown>;
}

/**
 * 报表列接口
 */
export interface ReportColumn {
  key: string;
  title: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'boolean' | 'status';
  format?: string;
  width?: number;
  sortable?: boolean;
  visible?: boolean;
}

/**
 * 报表统计接口
 */
export interface ReportStatistics {
  totalRecords: number;
  filteredRecords: number;
  summaryMetrics: Record<string, number>;
  charts?: ReportChartData[];
  generatedInMs?: number;
}

/**
 * 报表图表数据接口
 */
export interface ReportChartData {
  chartId: string;
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'table';
  title: string;
  data: Record<string, unknown>[];
  config?: Record<string, unknown>;
}

/**
 * 报表审批接口
 */
export interface ReportApproval {
  id: string;
  approverId: string;
  approver?: string;
  approverName?: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  approvedAt?: number;
  decidedAt?: number;
  requestedAt?: number;
}

// ============================================================================
// 数据留存策略接口
// ============================================================================

/**
 * 留存类别枚举
 */
export enum RetentionClass {
  HOT = 'hot',
  WARM = 'warm',
  COLD = 'cold',
  ARCHIVE = 'archive',
  PERMANENT = 'permanent',
}

/**
 * 数据敏感度等级枚举
 */
export enum DataSensitivity {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
  TOP_SECRET = 'top_secret',
}

/**
 * 留存策略接口
 */
export interface RetentionPolicy {
  id: string;
  name: string;
  description?: string;
  retentionClass?: RetentionClass;
  sensitivity?: DataSensitivity;
  dataTypes?: string[];
  retentionPeriod?: {
    hot: number;
    warm: number;
    cold: number;
  };
  actions?: {
    afterHotPeriod?: RetentionAction;
    afterWarmPeriod?: RetentionAction;
    afterColdPeriod?: RetentionAction;
    afterRetention?: RetentionAction;
  };
  retentionDays?: number;
  warmTransitionDays?: number;
  coldTransitionDays?: number;
  archiveTransitionDays?: number;
  autoDelete?: boolean;
  legalHold: boolean;
  reviewRequired?: boolean;
  reviewIntervalDays?: number;
  applicableCategories?: AuditCategory[];
  applicableActions?: AuditAction[];
  applicableSeverity?: AuditSeverity[];
  encryptionRequired?: boolean;
  encryptionEnabled?: boolean;
  compressionEnabled: boolean;
  auditRequired?: boolean;
  approvalRequired?: {
    archive: boolean;
    purge: boolean;
    restore: boolean;
  };
  versionHistory?: boolean;
  maxVersions?: number;
  storageTier?: string;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  isDefault: boolean;
  enabled?: boolean;
  rules?: RetentionRule[];
}

/**
 * 留存规则接口
 */
export interface RetentionRule {
  id: string;
  name: string;
  condition: string;
  action: 'retain' | 'delete' | 'archive' | 'legal_hold';
  durationDays?: number;
  priority: number;
  enabled: boolean;
}

/**
 * 归档记录接口
 */
export interface ArchiveRecord {
  id: string;
  sourceType: 'audit_log' | 'evidence' | 'report';
  sourceIds: string[];
  archiveDate: number;
  retentionClass: RetentionClass;
  storageLocation: string;
  archiveHash: string;
  encryptionKeyId?: string;
  originalSize: number;
  compressedSize: number;
  itemCount: number;
  restoreExpiry?: number;
  restored: boolean;
  restoredAt?: number;
  legalHold: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * 销毁记录接口
 */
export interface DestructionRecord {
  id: string;
  sourceType: 'audit_log' | 'evidence' | 'report' | 'archive';
  sourceIds: string[];
  destructionDate: number;
  destructionMethod: string;
  reason: string;
  approvedBy: string;
  approvalDate: number;
  witness?: string;
  certificateHash?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// 审计查询过滤器接口
// ============================================================================

/**
 * 审计查询过滤器接口
 */
export interface AuditQueryFilter {
  action?: AuditAction | AuditAction[];
  actions?: AuditAction[];
  category?: AuditCategory | AuditCategory[];
  categories?: AuditCategory[];
  status?: AuditStatus | AuditStatus[];
  statuses?: AuditStatus[];
  severity?: AuditSeverity | AuditSeverity[];
  severities?: AuditSeverity[];
  actorType?: AuditActor['type'] | AuditActor['type'][];
  actorId?: string;
  walletId?: string;
  userId?: string;
  address?: string;
  traceId?: string;
  targetType?: AuditTarget['type'];
  targetId?: string;
  chainId?: string;
  txHash?: string;
  startDate?: number;
  endDate?: number;
  startTime?: number;
  endTime?: number;
  riskScoreMin?: number;
  riskScoreMax?: number;
  minRiskScore?: number;
  maxRiskScore?: number;
  keyword?: string;
  search?: string;
  searchFields?: string[];
  isArchived?: boolean;
  retentionClass?: RetentionClass;
  hasEvidence?: boolean;
  hasError?: boolean;
  customFilter?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  includeTotal?: boolean;
  includeRelated?: boolean;
  aggregation?: AuditAggregation;
}

/**
 * 审计聚合查询接口
 */
export interface AuditAggregation {
  groupBy: string | string[];
  metrics: AuditMetric[];
  dateHistogram?: {
    field: string;
    interval: 'hour' | 'day' | 'week' | 'month';
    timezone?: string;
  };
  having?: Record<string, unknown>;
}

/**
 * 审计指标接口
 */
export interface AuditMetric {
  name: string;
  field: string;
  function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'unique_count' | 'percentile';
  percentile?: number;
}

/**
 * 审计查询结果接口
 */
export interface AuditQueryResult {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  aggregations?: Record<string, unknown>;
  statistics?: AuditStatistics;
  executionTimeMs?: number;
  queryId?: string;
  cacheHit?: boolean;
}

/**
 * 审计统计接口
 */
export interface AuditStatistics {
  totalLogs: number;
  totalCount?: number;
  errors?: number;
  failedCount?: number;
  warnings?: number;
  averageDuration?: number;
  highRiskCount?: number;
  uniqueUsers?: number;
  uniqueWallets?: number;
  totalTransactions?: number;
  totalVolume?: string;
  byDate?: Record<string, number>;
  timeRange?: { start: number; end: number };
  byCategory: Record<AuditCategory, number>;
  byAction: Record<AuditAction, number>;
  bySeverity: Record<AuditSeverity, number>;
  byStatus: Record<AuditStatus, number>;
}

// ============================================================================
// 证据链配置接口
// ============================================================================

/**
 * 哈希算法枚举
 */
export enum HashAlgorithm {
  SHA256 = 'sha256',
  SHA384 = 'sha384',
  SHA512 = 'sha512',
  SHA3_256 = 'sha3_256',
  SHA3_512 = 'sha3_512',
  KECCAK256 = 'keccak256',
  BLAKE2B = 'blake2b',
  BLAKE3 = 'blake3',
}

/**
 * 证据链配置接口
 */
export interface EvidenceChainConfig {
  enabled: boolean;
  hashAlgorithm: HashAlgorithm;
  blockSize: number;
  blockIntervalMs: number;
  chainAnchorEnabled: boolean;
  anchorChainId?: string;
  anchorContractAddress?: string;
  anchorIntervalBlocks: number;
  merkleTreeEnabled: boolean;
  validatorPrivateKey?: string;
  validatorAddress?: string;
  storageBackend: 'memory' | 'database' | 'file' | 'ipfs';
  storageConfig?: Record<string, unknown>;
}

// ============================================================================
// 审计系统配置接口
// ============================================================================

/**
 * 审计系统配置接口
 */
export interface AuditSystemConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxLogEntries: number;
  enableTamperProof: boolean;
  enableEvidenceChain: boolean;
  enableComplianceReports: boolean;
  enableRetentionManagement: boolean;
  asyncLogging: boolean;
  batchSize: number;
  flushIntervalMs: number;
  defaultRetentionClass: RetentionClass;
  defaultSensitivity: DataSensitivity;
  ipAnonymization: boolean;
  includeUserAgent: boolean;
  includeLocation: boolean;
  sensitiveFields: string[];
  encryptionEnabled: boolean;
  encryptionKeyId?: string;
  storage: {
    backend: 'memory' | 'database' | 'file' | 'hybrid';
    config?: Record<string, unknown>;
  };
  integration: {
    prisma?: boolean;
    logger?: boolean;
    webhook?: boolean;
    alerting?: boolean;
  };
}

// ============================================================================
// 默认配置
// ============================================================================

/**
 * 默认审计系统配置
 */
export const DEFAULT_AUDIT_CONFIG: AuditSystemConfig = {
  enabled: true,
  logLevel: 'info',
  maxLogEntries: 100000,
  enableTamperProof: true,
  enableEvidenceChain: true,
  enableComplianceReports: true,
  enableRetentionManagement: true,
  asyncLogging: false,
  batchSize: 100,
  flushIntervalMs: 5000,
  defaultRetentionClass: RetentionClass.WARM,
  defaultSensitivity: DataSensitivity.INTERNAL,
  ipAnonymization: false,
  includeUserAgent: true,
  includeLocation: false,
  sensitiveFields: ['password', 'privateKey', 'seedPhrase', 'mnemonic', 'apiKey', 'secret'],
  encryptionEnabled: false,
  storage: {
    backend: 'memory',
  },
  integration: {
    prisma: false,
    logger: true,
    webhook: false,
    alerting: false,
  },
};

/**
 * 默认证据链配置
 */
export const DEFAULT_EVIDENCE_CHAIN_CONFIG: EvidenceChainConfig = {
  enabled: true,
  hashAlgorithm: HashAlgorithm.SHA256,
  blockSize: 100,
  blockIntervalMs: 60000,
  chainAnchorEnabled: false,
  anchorIntervalBlocks: 10,
  merkleTreeEnabled: true,
  storageBackend: 'memory',
};

// ============================================================================
// 错误类型
// ============================================================================

/**
 * 审计系统错误代码
 */
export enum AuditErrorCode {
  CONFIG_INVALID = 'AUDIT_001',
  LOG_FAILED = 'AUDIT_002',
  QUERY_FAILED = 'AUDIT_003',
  EVIDENCE_CHAIN_BROKEN = 'AUDIT_004',
  HASH_VERIFICATION_FAILED = 'AUDIT_005',
  REPORT_GENERATION_FAILED = 'AUDIT_006',
  RETENTION_POLICY_VIOLATION = 'AUDIT_007',
  ARCHIVE_FAILED = 'AUDIT_008',
  DESTRUCTION_FAILED = 'AUDIT_009',
  PERMISSION_DENIED = 'AUDIT_010',
  TAMPER_DETECTED = 'AUDIT_011',
  STORAGE_ERROR = 'AUDIT_012',
}

/**
 * 审计错误类
 */
export class AuditError extends Error {
  public readonly code: AuditErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: AuditErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AuditError';
    this.code = code;
    this.details = details;
  }
}
