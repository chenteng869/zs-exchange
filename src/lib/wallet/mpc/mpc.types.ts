/**
 * MPC 托管签名架构 - 核心类型定义
 *
 * 本文件定义了 MPC 钱包托管签名系统的所有核心类型，包括：
 *  - 钱包层级（热/温/冷）
 *  - 策略类型与评估结果
 *  - 审批工作流相关类型
 *  - 门限签名相关类型
 *  - 审计日志类型
 */

// =============================================================================
// 基础枚举类型
// =============================================================================

/**
 * 钱包层级枚举
 *  - hot: 热钱包 - 实时签名，适用于小额高频交易
 *  - warm: 温钱包 - 延迟签名，适用于中额交易
 *  - cold: 冷钱包 - 人工审批，适用于大额交易
 */
export enum WalletTier {
  HOT = 'hot',
  WARM = 'warm',
  COLD = 'cold',
}

/**
 * 审批状态枚举
 *  - pending: 待审批
 *  - approved: 已通过
 *  - rejected: 已拒绝
 *  - expired: 已过期
 *  - cancelled: 已取消
 */
export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

/**
 * 策略类型枚举
 *  - whitelist: 白名单策略 - 仅允许向白名单地址转账
 *  - amount_limit: 金额限制策略 - 单笔/单日/单周金额上限
 *  - velocity_limit: 流速限制策略 - 单位时间内交易次数限制
 *  - multi_sig: 多签策略 - 需要多个签名者共同签名
 *  - time_window: 时间窗口策略 - 仅在指定时间段内允许签名
 */
export enum PolicyType {
  WHITELIST = 'whitelist',
  AMOUNT_LIMIT = 'amount_limit',
  VELOCITY_LIMIT = 'velocity_limit',
  MULTI_SIG = 'multi_sig',
  TIME_WINDOW = 'time_window',
}

/**
 * 策略评估结果
 *  - allow: 允许通过
 *  - warn: 警告但允许
 *  - reject: 拒绝
 *  - require_approval: 需要审批
 */
export enum PolicyResult {
  ALLOW = 'allow',
  WARN = 'warn',
  REJECT = 'reject',
  REQUIRE_APPROVAL = 'require_approval',
}

/**
 * 审批模式枚举
 *  - single: 单人审批 - 只需一个审批人通过
 *  - multiple: 多人审批 - 需要所有审批人通过
 *  - sequential: 顺序审批 - 按顺序依次审批
 *  - parallel: 并行审批 - 同时发起多个审批
 *  - any_of: 任意数审批 - 指定数量的审批人通过即可
 */
export enum ApprovalMode {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  ANY_OF = 'any_of',
}

/**
 * 签名阶段枚举
 *  - pre_sign: 签名前
 *  - during_sign: 签名中
 *  - post_sign: 签名后
 */
export enum SignAuditPhase {
  PRE_SIGN = 'pre_sign',
  DURING_SIGN = 'during_sign',
  POST_SIGN = 'post_sign',
}

/**
 * 签名类型枚举
 */
export enum SignType {
  MESSAGE = 'message',
  PERSONAL_SIGN = 'personal_sign',
  TYPED_DATA = 'typed_data',
  TRANSACTION = 'transaction',
}

/**
 * 链类型枚举
 */
export enum ChainType {
  EVM = 'evm',
  SOLANA = 'solana',
  BITCOIN = 'bitcoin',
  TRON = 'tron',
}

/**
 * 密钥分片状态
 */
export enum KeyShareStatus {
  ACTIVE = 'active',
  ROTATED = 'rotated',
  REVOKED = 'revoked',
  COMPROMISED = 'compromised',
}

/**
 * 签名节点状态
 */
export enum SignerNodeStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  DEGRADED = 'degraded',
}

// =============================================================================
// 钱包相关接口
// =============================================================================

/**
 * MPC 钱包接口
 * 描述一个由 MPC 管理的钱包实体
 */
export interface MPCWallet {
  /** 钱包唯一标识 */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 钱包层级 */
  tier: WalletTier;
  /** 链类型 */
  chainType: ChainType;
  /** 钱包地址 */
  address: string;
  /** 公钥 */
  publicKey: string;
  /** 密钥引用 ID（用于查找密钥分片） */
  keyRef: string;
  /** 门限值（t of n 中的 t） */
  threshold: number;
  /** 总分片数（t of n 中的 n） */
  totalShares: number;
  /** 关联的策略 ID 列表 */
  policyIds: string[];
  /** 审批流程 ID（可选，自定义审批流） */
  approvalFlowId?: string;
  /** 钱包状态 */
  status: 'active' | 'frozen' | 'closed';
  /** 钱包标签/备注 */
  label?: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 最后签名时间 */
  lastSignAt?: Date;
}

/**
 * 密钥分片信息接口
 * 描述单个密钥分片的元数据
 */
export interface KeyShareInfo {
  /** 分片唯一标识 */
  id: string;
  /** 密钥引用 ID */
  keyRef: string;
  /** 分片索引（1-based） */
  shareIndex: number;
  /** 持有该分片的节点 ID */
  nodeId: string;
  /** 分片状态 */
  status: KeyShareStatus;
  /** 分片版本号（用于密钥轮换） */
  version: number;
  /** 加密算法 */
  encryptionAlgorithm: string;
  /** KMS 提供商（如果使用外部 KMS） */
  kmsProvider?: string;
  /** KMS 密钥 ID */
  kmsKeyId?: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 最后使用时间 */
  lastUsedAt?: Date;
}

/**
 * 签名节点接口
 * 描述一个参与 MPC 签名的节点
 */
export interface SignerNode {
  /** 节点唯一标识 */
  id: string;
  /** 节点名称 */
  name: string;
  /** 节点描述 */
  description?: string;
  /** 节点状态 */
  status: SignerNodeStatus;
  /** 节点公钥（用于节点间通信加密） */
  nodePublicKey: string;
  /** 节点端点 URL */
  endpoint?: string;
  /** 支持的链类型 */
  supportedChains: ChainType[];
  /** 地理位置 */
  region?: string;
  /** 节点权重（用于加权门限） */
  weight: number;
  /** 最后心跳时间 */
  lastHeartbeatAt: Date;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

// =============================================================================
// 策略相关接口
// =============================================================================

/**
 * 签名策略基础接口
 * 所有具体策略都需要实现此接口
 */
export interface SignaturePolicy {
  /** 策略唯一标识 */
  id: string;
  /** 策略名称 */
  name: string;
  /** 策略描述 */
  description?: string;
  /** 策略类型 */
  type: PolicyType;
  /** 策略是否启用 */
  enabled: boolean;
  /** 策略优先级（数值越小优先级越高） */
  priority: number;
  /** 策略版本 */
  version: string;
  /** 策略参数（具体参数由策略类型决定） */
  parameters: Record<string, unknown>;
  /** 适用的钱包层级（空表示适用所有层级） */
  applicableTiers?: WalletTier[];
  /** 适用的链类型（空表示适用所有链） */
  applicableChains?: ChainType[];
  /** 创建人 */
  createdBy: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 生效开始时间 */
  effectiveFrom?: Date;
  /** 生效结束时间 */
  effectiveTo?: Date;
}

/**
 * 策略评估上下文
 * 包含评估策略所需的所有上下文信息
 */
export interface PolicyEvaluationContext {
  /** 钱包信息 */
  wallet: MPCWallet;
  /** 签名类型 */
  signType: SignType;
  /** 链类型 */
  chainType: ChainType;
  /** 目标地址（如果是转账交易） */
  toAddress?: string;
  /** 交易金额（以最小单位表示） */
  amount?: string;
  /** 代币符号 */
  tokenSymbol?: string;
  /** 合约地址（如果是代币转账） */
  contractAddress?: string;
  /** Gas 费用（以最小单位表示） */
  gasFee?: string;
  /** 用户 ID */
  userId: string;
  /** 客户端 IP 地址 */
  clientIp?: string;
  /** 设备 ID */
  deviceId?: string;
  /** 用户角色 */
  userRole?: string;
  /** 请求时间 */
  requestTime: Date;
  /** 原始交易数据 */
  rawTransaction?: unknown;
  /** 额外的上下文数据 */
  extra?: Record<string, unknown>;
}

/**
 * 单条策略评估结果
 */
export interface PolicyEvaluationResult {
  /** 策略 ID */
  policyId: string;
  /** 策略名称 */
  policyName: string;
  /** 策略类型 */
  policyType: PolicyType;
  /** 评估结果 */
  result: PolicyResult;
  /** 是否通过（allow/warn 视为通过） */
  passed: boolean;
  /** 风险分数（0-100） */
  riskScore: number;
  /** 评估原因/说明 */
  reason: string;
  /** 需要的审批配置（如果 result 为 require_approval） */
  approvalConfig?: ApprovalConfig;
  /** 触发的规则详情 */
  triggeredRules?: string[];
  /** 评估耗时（毫秒） */
  evaluationTimeMs?: number;
}

/**
 * 组合策略评估结果
 */
export interface CombinedPolicyResult {
  /** 总体结果 */
  overallResult: PolicyResult;
  /** 是否通过 */
  passed: boolean;
  /** 综合风险分数 */
  totalRiskScore: number;
  /** 各策略评估结果 */
  policyResults: PolicyEvaluationResult[];
  /** 需要审批时的审批配置（取最严格的） */
  requiredApproval?: ApprovalConfig;
  /** 拒绝原因（如果被拒绝） */
  rejectReasons: string[];
  /** 警告信息 */
  warnings: string[];
}

// =============================================================================
// 审批相关接口
// =============================================================================

/**
 * 审批配置
 */
export interface ApprovalConfig {
  /** 审批模式 */
  mode: ApprovalMode;
  /** 需要的审批人数（用于 any_of 模式） */
  requiredApprovals?: number;
  /** 审批人 ID 列表 */
  approvers: string[];
  /** 审批超时时间（秒） */
  timeoutSeconds: number;
  /** 是否允许审批人委托 */
  allowDelegation: boolean;
  /** 审批级别 */
  approvalLevel: number;
}

/**
 * 审批人信息
 */
export interface ApproverInfo {
  /** 用户 ID */
  userId: string;
  /** 用户名称 */
  userName: string;
  /** 用户角色 */
  role: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phone?: string;
  /** 审批权重（用于加权审批） */
  weight?: number;
}

/**
 * 审批请求接口
 */
export interface ApprovalRequest {
  /** 审批请求唯一标识 */
  id: string;
  /** 关联的签名请求 ID */
  signatureRequestId: string;
  /** 审批流程 ID */
  approvalFlowId: string;
  /** 审批标题 */
  title: string;
  /** 审批描述 */
  description?: string;
  /** 审批状态 */
  status: ApprovalStatus;
  /** 当前审批阶段索引（用于顺序审批） */
  currentStageIndex: number;
  /** 审批配置 */
  config: ApprovalConfig;
  /** 审批人列表 */
  approvers: ApproverInfo[];
  /** 已通过的审批人 ID 列表 */
  approvedBy: string[];
  /** 已拒绝的审批记录 */
  rejectedBy?: {
    userId: string;
    reason: string;
    rejectedAt: Date;
  };
  /** 审批详情记录 */
  approvalHistory: ApprovalHistoryEntry[];
  /** 创建人 ID */
  createdBy: string;
  /** 创建时间 */
  createdAt: Date;
  /** 过期时间 */
  expiresAt: Date;
  /** 完成时间 */
  completedAt?: Date;
  /** 关联的交易摘要 */
  transactionSummary?: TransactionSummary;
}

/**
 * 审批历史记录条目
 */
export interface ApprovalHistoryEntry {
  /** 记录 ID */
  id: string;
  /** 审批人 ID */
  userId: string;
  /** 审批人名称 */
  userName: string;
  /** 操作类型 */
  action: 'approve' | 'reject' | 'delegate' | 'comment';
  /** 操作时间 */
  timestamp: Date;
  /** 备注/原因 */
  comment?: string;
  /** 审批阶段索引 */
  stageIndex?: number;
  /** IP 地址 */
  ipAddress?: string;
  /** 设备信息 */
  deviceInfo?: string;
}

/**
 * 审批流程接口
 * 定义一个完整的审批流程模板
 */
export interface ApprovalFlow {
  /** 流程唯一标识 */
  id: string;
  /** 流程名称 */
  name: string;
  /** 流程描述 */
  description?: string;
  /** 流程是否启用 */
  enabled: boolean;
  /** 审批阶段列表 */
  stages: ApprovalStage[];
  /** 适用的钱包层级 */
  applicableTiers?: WalletTier[];
  /** 最小触发金额 */
  minAmount?: string;
  /** 最大触发金额 */
  maxAmount?: string;
  /** 创建人 */
  createdBy: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 审批阶段
 */
export interface ApprovalStage {
  /** 阶段 ID */
  id: string;
  /** 阶段名称 */
  name: string;
  /** 阶段顺序（从小到大） */
  order: number;
  /** 审批模式 */
  mode: ApprovalMode;
  /** 审批人列表 */
  approvers: ApproverInfo[];
  /** 需要的审批人数（any_of 模式） */
  requiredApprovals?: number;
  /** 超时时间（秒） */
  timeoutSeconds: number;
  /** 是否可以跳过此阶段 */
  skippable: boolean;
  /** 跳过条件描述 */
  skipCondition?: string;
}

/**
 * 交易摘要（用于审批展示）
 */
export interface TransactionSummary {
  /** 链类型 */
  chainType: ChainType;
  /** 交易类型 */
  txType: string;
  /** 发起地址 */
  fromAddress: string;
  /** 目标地址 */
  toAddress?: string;
  /** 金额 */
  amount?: string;
  /** 代币符号 */
  tokenSymbol?: string;
  /** 合约地址 */
  contractAddress?: string;
  /** Gas 预估 */
  estimatedGas?: string;
  /** 交易数据摘要 */
  dataSummary?: string;
}

// =============================================================================
// 签名相关接口
// =============================================================================

/**
 * MPC 签名请求接口
 */
export interface MPCSignatureRequest {
  /** 请求唯一标识 */
  id: string;
  /** 钱包 ID */
  walletId: string;
  /** 用户 ID */
  userId: string;
  /** 签名类型 */
  signType: SignType;
  /** 链类型 */
  chainType: ChainType;
  /** 钱包地址 */
  address: string;
  /** 待签名数据（原始 payload） */
  payload: unknown;
  /** 交易摘要（用于展示和审计） */
  summary: TransactionSummary;
  /** 请求状态 */
  status: SignatureRequestStatus;
  /** 钱包层级 */
  walletTier: WalletTier;
  /** 策略评估结果 */
  policyResult?: CombinedPolicyResult;
  /** 关联的审批请求 ID */
  approvalRequestId?: string;
  /** 签名结果 */
  signatureResult?: SignatureResult;
  /** 错误信息（如果失败） */
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  /** 客户端信息 */
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
    location?: string;
  };
  /** 请求创建时间 */
  createdAt: Date;
  /** 最后更新时间 */
  updatedAt: Date;
  /** 签名完成时间 */
  completedAt?: Date;
  /** 过期时间 */
  expiresAt?: Date;
}

/**
 * 签名请求状态
 */
export enum SignatureRequestStatus {
  CREATED = 'created',
  POLICY_EVALUATING = 'policy_evaluating',
  POLICY_APPROVED = 'policy_approved',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  SIGNING = 'signing',
  SIGNED = 'signed',
  FAILED = 'failed',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

/**
 * 签名结果
 */
export interface SignatureResult {
  /** 签名数据（格式取决于链类型） */
  signature: string;
  /** 原始签名数据（r, s, v 等） */
  rawSignature?: {
    r?: string;
    s?: string;
    v?: number;
    recoveryId?: number;
  };
  /** 签名后的数据（如已签名交易） */
  signedData?: string;
  /** 公钥 */
  publicKey?: string;
  /** 参与签名的节点 ID 列表 */
  signerNodes: string[];
  /** 签名算法 */
  algorithm: string;
  /** 签名耗时（毫秒） */
  signTimeMs: number;
  /** 签名时间戳 */
  signedAt: Date;
}

/**
 * 门限签名请求
 */
export interface ThresholdSignRequest {
  /** 请求 ID */
  requestId: string;
  /** 密钥引用 ID */
  keyRef: string;
  /** 待签名消息哈希 */
  messageHash: string;
  /** 链类型 */
  chainType: ChainType;
  /** 门限值 */
  threshold: number;
  /** 参与签名的节点 ID 列表 */
  participantNodeIds: string[];
  /** 额外元数据 */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// 审计相关接口
// =============================================================================

/**
 * MPC 审计日志条目
 */
export interface MPCAuditLog {
  /** 日志唯一标识 */
  id: string;
  /** 关联的签名请求 ID */
  signatureRequestId: string;
  /** 审计阶段 */
  phase: SignAuditPhase;
  /** 钱包 ID */
  walletId: string;
  /** 用户 ID */
  userId: string;
  /** 链类型 */
  chainType: ChainType;
  /** 签名类型 */
  signType: SignType;
  /** 钱包层级 */
  walletTier: WalletTier;
  /** 事件类型 */
  eventType: string;
  /** 事件描述 */
  description: string;
  /** 风险分数 */
  riskScore: number;
  /** 风险等级 */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** 操作者 IP */
  operatorIp?: string;
  /** 操作者设备 */
  operatorDevice?: string;
  /** 审计数据详情 */
  details?: Record<string, unknown>;
  /** 交易摘要 */
  transactionSummary?: TransactionSummary;
  /** 时间戳 */
  timestamp: Date;
  /** 日志哈希（用于防篡改） */
  logHash?: string;
  /** 前一条日志哈希（链式哈希） */
  previousLogHash?: string;
}

/**
 * 审计查询条件
 */
export interface AuditQueryFilter {
  /** 签名请求 ID */
  signatureRequestId?: string;
  /** 钱包 ID */
  walletId?: string;
  /** 用户 ID */
  userId?: string;
  /** 审计阶段 */
  phase?: SignAuditPhase;
  /** 事件类型 */
  eventType?: string;
  /** 链类型 */
  chainType?: ChainType;
  /** 开始时间 */
  startTime?: Date;
  /** 结束时间 */
  endTime?: Date;
  /** 风险等级 */
  riskLevel?: string;
  /** 分页页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 审计查询结果
 */
export interface AuditQueryResult {
  /** 日志列表 */
  logs: MPCAuditLog[];
  /** 总数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

// =============================================================================
// 统计与报表接口
// =============================================================================

/**
 * 钱包层级统计
 */
export interface WalletTierStats {
  /** 层级 */
  tier: WalletTier;
  /** 钱包数量 */
  walletCount: number;
  /** 今日签名次数 */
  todaySignCount: number;
  /** 今日签名总金额 */
  todaySignAmount: string;
  /** 待审批数量 */
  pendingApprovals: number;
}

/**
 * MPC 系统概览统计
 */
export interface MPCSystemStats {
  /** 总钱包数 */
  totalWallets: number;
  /** 各层级统计 */
  tierStats: WalletTierStats[];
  /** 今日签名请求数 */
  todayRequests: number;
  /** 今日签名成功数 */
  todaySuccess: number;
  /** 今日签名失败数 */
  todayFailed: number;
  /** 待审批请求数 */
  pendingApprovals: number;
  /** 活跃签名节点数 */
  activeSignerNodes: number;
  /** 平均签名耗时（毫秒） */
  averageSignTimeMs: number;
}

// =============================================================================
// 错误类型
// =============================================================================

/**
 * MPC 错误码
 */
export enum MPCErrorCode {
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  WALLET_FROZEN = 'WALLET_FROZEN',
  POLICY_REJECTED = 'POLICY_REJECTED',
  APPROVAL_REJECTED = 'APPROVAL_REJECTED',
  APPROVAL_EXPIRED = 'APPROVAL_EXPIRED',
  INSUFFICIENT_SIGNERS = 'INSUFFICIENT_SIGNERS',
  KEY_SHARE_NOT_FOUND = 'KEY_SHARE_NOT_FOUND',
  SIGNATURE_FAILED = 'SIGNATURE_FAILED',
  INVALID_PARAMS = 'INVALID_PARAMS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
  AUDIT_LOG_FAILED = 'AUDIT_LOG_FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * MPC 自定义错误类
 */
export class MPCError extends Error {
  public readonly code: MPCErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: MPCErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'MPCError';
  }
}
