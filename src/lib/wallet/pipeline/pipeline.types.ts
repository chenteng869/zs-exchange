/**
 * 交易流水线类型定义 (Pipeline Types)
 *
 * 定义交易流水线的核心类型：
 *  - PipelineStage: 阶段枚举
 *  - PipelineStatus: 状态枚举
 *  - PipelineContext: 流水线上下文
 *  - PipelineResult: 流水线结果
 *  - 各阶段的输入输出类型
 *
 * 9 阶段流水线架构：
 *  1. build        - 交易构建阶段
 *  2. simulate     - 交易模拟阶段
 *  3. risk_check   - 风控检查阶段
 *  4. balance_check- 余额检查阶段
 *  5. signature    - 签名阶段
 *  6. broadcast    - 广播阶段
 *  7. confirmation - 确认阶段
 *  8. audit        - 审计阶段
 *  9. notify       - 通知阶段
 */

// =============================================================================
// 1. 基础枚举类型
// =============================================================================

/**
 * 流水线阶段枚举
 * 按执行顺序排列，数字越小越先执行
 */
export enum PipelineStage {
  BUILD = 'build',
  SIMULATE = 'simulate',
  RISK_CHECK = 'risk_check',
  BALANCE_CHECK = 'balance_check',
  SIGNATURE = 'signature',
  BROADCAST = 'broadcast',
  CONFIRMATION = 'confirmation',
  AUDIT = 'audit',
  NOTIFY = 'notify',
}

/**
 * 流水线状态枚举
 */
export enum PipelineStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
  SKIPPED = 'skipped',
  RETRYING = 'retrying',
  TIMEOUT = 'timeout',
}

/**
 * 阶段执行状态
 */
export enum StageStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  RETRYING = 'retrying',
  ROLLED_BACK = 'rolled_back',
}

/**
 * 风险等级
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * 交易类型
 */
export enum TransactionType {
  NATIVE_TRANSFER = 'native_transfer',
  TOKEN_TRANSFER = 'token_transfer',
  CONTRACT_CALL = 'contract_call',
  DEPLOY_CONTRACT = 'deploy_contract',
  SWAP = 'swap',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  APPROVE = 'approve',
  BRIDGE = 'bridge',
  MINT_NFT = 'mint_nft',
}

/**
 * 链类型
 */
export type ChainType = 'evm' | 'solana' | 'bitcoin' | 'tron' | 'cosmos';

// =============================================================================
// 2. 交易相关类型
// =============================================================================

/**
 * 交易请求 - 流水线输入
 */
export interface TransactionRequest {
  id: string;
  type: TransactionType;
  chain: ChainType;
  chainId?: number;
  from: string;
  to?: string;
  value?: string;
  data?: string;
  nonce?: number;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  tokenAddress?: string;
  tokenAmount?: string;
  contractAddress?: string;
  methodName?: string;
  methodParams?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  userId?: string;
  walletId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  deadline?: number;
  clientOrderId?: string;
}

/**
 * 构建后的交易
 */
export interface BuiltTransaction {
  raw: Record<string, unknown>;
  hash?: string;
  from: string;
  to?: string;
  value: string;
  data?: string;
  nonce: number;
  gasLimit: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  chainId: number;
  type: number;
  estimatedGas?: string;
  estimatedFee?: string;
  builtAt: string;
}

/**
 * 模拟结果
 */
export interface SimulationResult {
  success: boolean;
  gasUsed?: string;
  gasEstimate?: string;
  returnData?: string;
  error?: string;
  errorCode?: string;
  events?: Array<{
    address: string;
    topics: string[];
    data: string;
  }>;
  balanceChanges?: Array<{
    address: string;
    token: string;
    before: string;
    after: string;
    change: string;
  }>;
  simulatedAt: string;
  simulationSource: 'rpc' | 'fork' | 'fallback';
}

/**
 * 风控检查结果
 */
export interface RiskCheckResult {
  passed: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  rules: Array<{
    id: string;
    name: string;
    passed: boolean;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    details?: Record<string, unknown>;
  }>;
  warnings: string[];
  requiredConfirmations?: string[];
  action: 'allow' | 'warn' | 'second_confirm' | 'delay' | 'manual_review' | 'reject';
  delaySeconds?: number;
  checkedAt: string;
}

/**
 * 余额检查结果
 */
export interface BalanceCheckResult {
  sufficient: boolean;
  nativeBalance: string;
  nativeRequired: string;
  nativeShortfall?: string;
  tokenBalance?: string;
  tokenRequired?: string;
  tokenShortfall?: string;
  gasCostEstimate: string;
  totalCostEstimate: string;
  checkedAt: string;
}

/**
 * 签名结果
 */
export interface SignatureResult {
  signed: boolean;
  signature?: string;
  rawTransaction?: string;
  signedTx?: Record<string, unknown>;
  signer?: string;
  signatureType?: 'eip1559' | 'legacy' | 'eip712' | 'personal';
  signedAt: string;
  signMethod?: 'private_key' | 'mnemonic' | 'hardware' | 'mpc' | 'walletconnect';
}

/**
 * 广播结果
 */
export interface BroadcastResult {
  broadcasted: boolean;
  txHash: string;
  nodeUrl?: string;
  nonce: number;
  broadcastedAt: string;
  networkConfirmations?: number;
  error?: string;
  retries: number;
}

/**
 * 确认结果
 */
export interface ConfirmationResult {
  confirmed: boolean;
  txHash: string;
  blockNumber?: number;
  blockHash?: string;
  confirmations: number;
  requiredConfirmations: number;
  status: 'success' | 'failed' | 'pending';
  gasUsed?: string;
  effectiveGasPrice?: string;
  actualFee?: string;
  confirmedAt?: string;
  logs?: Array<{
    address: string;
    topics: string[];
    data: string;
    logIndex: number;
  }>;
}

/**
 * 审计结果
 */
export interface AuditResult {
  audited: boolean;
  auditId: string;
  auditType: string;
  findings: Array<{
    id: string;
    level: 'info' | 'warning' | 'issue' | 'critical';
    category: string;
    message: string;
    details?: Record<string, unknown>;
  }>;
  riskAssessment?: string;
  complianceChecks?: Record<string, boolean>;
  auditTrail: Array<{
    stage: string;
    action: string;
    timestamp: string;
    actor?: string;
    metadata?: Record<string, unknown>;
  }>;
  auditedAt: string;
}

/**
 * 通知结果
 */
export interface NotifyResult {
  notified: boolean;
  channels: Array<{
    channel: string;
    status: 'sent' | 'failed' | 'pending';
    recipient: string;
    sentAt?: string;
    error?: string;
  }>;
  notificationId: string;
  notificationType: string;
  title: string;
  content: string;
  createdAt: string;
}

// =============================================================================
// 3. 阶段上下文类型
// =============================================================================

/**
 * 阶段执行元数据
 */
export interface StageMetadata {
  stage: PipelineStage;
  status: StageStatus;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
  attempt: number;
  maxAttempts: number;
  error?: PipelineError;
  skipped?: boolean;
  skipReason?: string;
}

/**
 * 流水线错误
 */
export interface PipelineError {
  code: string;
  message: string;
  stage?: PipelineStage;
  details?: Record<string, unknown>;
  stack?: string;
  timestamp: string;
  recoverable: boolean;
}

/**
 * 流水线上下文 - 在各阶段间传递数据
 */
export interface PipelineContext {
  pipelineId: string;
  status: PipelineStatus;
  request: TransactionRequest;
  stageData: {
    [PipelineStage.BUILD]?: BuiltTransaction;
    [PipelineStage.SIMULATE]?: SimulationResult;
    [PipelineStage.RISK_CHECK]?: RiskCheckResult;
    [PipelineStage.BALANCE_CHECK]?: BalanceCheckResult;
    [PipelineStage.SIGNATURE]?: SignatureResult;
    [PipelineStage.BROADCAST]?: BroadcastResult;
    [PipelineStage.CONFIRMATION]?: ConfirmationResult;
    [PipelineStage.AUDIT]?: AuditResult;
    [PipelineStage.NOTIFY]?: NotifyResult;
  };
  stageMetadata: Record<PipelineStage, StageMetadata>;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  totalDurationMs?: number;
  currentStage?: PipelineStage;
  skippedStages: PipelineStage[];
  failedStage?: PipelineStage;
  error?: PipelineError;
  rollbackHistory: Array<{
    fromStage: PipelineStage;
    toStage: PipelineStage;
    reason: string;
    timestamp: string;
  }>;
  retryCount: number;
  maxRetries: number;
  timeoutMs?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * 流水线结果
 */
export interface PipelineResult {
  pipelineId: string;
  status: PipelineStatus;
  request: TransactionRequest;
  buildResult?: BuiltTransaction;
  simulationResult?: SimulationResult;
  riskCheckResult?: RiskCheckResult;
  balanceCheckResult?: BalanceCheckResult;
  signatureResult?: SignatureResult;
  broadcastResult?: BroadcastResult;
  confirmationResult?: ConfirmationResult;
  auditResult?: AuditResult;
  notifyResult?: NotifyResult;
  error?: PipelineError;
  failedStage?: PipelineStage;
  startedAt?: string;
  completedAt?: string;
  totalDurationMs?: number;
  totalRetries: number;
  stageDurations: Record<PipelineStage, number>;
}

// =============================================================================
// 4. 中间件/管道相关类型
// =============================================================================

/**
 * 中间件上下文 - 扩展自 PipelineContext，用于中间件处理
 */
export interface MiddlewareContext extends PipelineContext {
  /** 当前正在执行的阶段 */
  executingStage: PipelineStage;
  /** 阶段索引 */
  stageIndex: number;
  /** 中间件传递的额外数据 */
  middlewareData: Record<string, unknown>;
}

/**
 * 中间件函数类型
 */
export type PipelineMiddleware = (
  context: MiddlewareContext,
  next: () => Promise<void>,
) => Promise<void>;

/**
 * 阶段处理函数类型
 */
export type StageHandler<TInput = unknown, TOutput = unknown> = (
  context: PipelineContext,
  input: TInput,
) => Promise<TOutput>;

/**
 * 阶段定义
 */
export interface StageDefinition {
  stage: PipelineStage;
  name: string;
  description: string;
  /** 前置条件检查 - 检查是否可以进入此阶段 */
  preCondition?: (context: PipelineContext) => Promise<boolean> | boolean;
  /** 后置条件检查 - 检查阶段输出是否符合预期 */
  postCondition?: (context: PipelineContext) => Promise<boolean> | boolean;
  /** 阶段执行函数 */
  execute: StageHandler;
  /** 回滚函数 - 用于可回滚阶段 */
  rollback?: (context: PipelineContext) => Promise<void>;
  /** 是否可以跳过此阶段 */
  skippable: boolean;
  /** 是否可以重试此阶段 */
  retryable: boolean;
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试延迟（毫秒） */
  retryDelayMs: number;
  /** 超时时间（毫秒） */
  timeoutMs?: number;
  /** 依赖的阶段列表 - 这些阶段必须成功完成才能执行此阶段 */
  dependsOn: PipelineStage[];
  /** 权重 - 用于进度计算 */
  weight: number;
}

/**
 * 流水线配置
 */
export interface PipelineConfig {
  /** 流水线 ID 前缀 */
  idPrefix?: string;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 全局超时时间（毫秒） */
  timeoutMs?: number;
  /** 要跳过的阶段 */
  skipStages?: PipelineStage[];
  /** 阶段特定配置 */
  stageConfigs?: Partial<Record<PipelineStage, Partial<StageDefinition>>>;
  /** 中间件列表 */
  middleware?: PipelineMiddleware[];
  /** 确认数 */
  confirmations?: number;
  /** 自动回滚 */
  autoRollback?: boolean;
  /** 持久化中间状态 */
  persistIntermediateState?: boolean;
  /** 持久化存储接口 */
  stateStorage?: PipelineStateStorage;
  /** 事件回调 */
  onStageStart?: (stage: PipelineStage, context: PipelineContext) => void;
  onStageComplete?: (stage: PipelineStage, context: PipelineContext) => void;
  onStageFail?: (stage: PipelineStage, error: PipelineError, context: PipelineContext) => void;
  onStageRetry?: (stage: PipelineStage, attempt: number, context: PipelineContext) => void;
  onProgress?: (progress: number, context: PipelineContext) => void;
  onComplete?: (result: PipelineResult, context: PipelineContext) => void;
  onFail?: (error: PipelineError, context: PipelineContext) => void;
}

/**
 * 流水线状态存储接口
 * 用于持久化中间状态，支持断点续传
 */
export interface PipelineStateStorage {
  /** 保存流水线状态 */
  save(pipelineId: string, context: PipelineContext): Promise<void>;
  /** 加载流水线状态 */
  load(pipelineId: string): Promise<PipelineContext | null>;
  /** 删除流水线状态 */
  delete(pipelineId: string): Promise<void>;
  /** 列出所有流水线 */
  list?(filters?: { status?: PipelineStatus; userId?: string }): Promise<PipelineContext[]>;
}

/**
 * 流水线管理器配置
 */
export interface PipelineManagerConfig {
  /** 最大并发流水线数 */
  maxConcurrent?: number;
  /** 队列最大长度 */
  maxQueueSize?: number;
  /** 全局超时时间（毫秒） */
  globalTimeoutMs?: number;
  /** 清理完成的流水线的延迟（毫秒） */
  cleanupDelayMs?: number;
  /** 状态存储 */
  stateStorage?: PipelineStateStorage;
}

/**
 * 流水线统计信息
 */
export interface PipelineStats {
  total: number;
  running: number;
  pending: number;
  completed: number;
  failed: number;
  rolledBack: number;
  averageDurationMs: number;
  successRate: number;
  lastHourCount: number;
  lastDayCount: number;
  byStatus?: Partial<Record<PipelineStatus, number>>;
  concurrent?: number;
}

// =============================================================================
// 5. 工具类型
// =============================================================================

/**
 * 阶段数据映射类型
 */
export type StageDataTypeMap = {
  [PipelineStage.BUILD]: BuiltTransaction;
  [PipelineStage.SIMULATE]: SimulationResult;
  [PipelineStage.RISK_CHECK]: RiskCheckResult;
  [PipelineStage.BALANCE_CHECK]: BalanceCheckResult;
  [PipelineStage.SIGNATURE]: SignatureResult;
  [PipelineStage.BROADCAST]: BroadcastResult;
  [PipelineStage.CONFIRMATION]: ConfirmationResult;
  [PipelineStage.AUDIT]: AuditResult;
  [PipelineStage.NOTIFY]: NotifyResult;
};

/**
 * 获取指定阶段的数据类型
 */
export type StageData<S extends PipelineStage> = StageDataTypeMap[S];
