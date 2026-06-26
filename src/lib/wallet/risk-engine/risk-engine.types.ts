/**
 * Web3 钱包风控引擎核心类型定义
 * 提供完整的风控系统类型支持，包括规则、评分、决策、事件等核心概念
 */

// ============================================================
// 基础枚举类型
// ============================================================

/**
 * 风险等级枚举
 * 定义交易或操作的风险程度分级
 */
export enum RiskLevel {
  /** 低风险 - 正常操作，直接放行 */
  LOW = 'low',
  /** 中风险 - 需要提示用户注意 */
  MEDIUM = 'medium',
  /** 高风险 - 需要二次确认 */
  HIGH = 'high',
  /** 严重风险 - 直接拒绝或人工审核 */
  CRITICAL = 'critical',
}

/**
 * 风控动作枚举
 * 定义风控系统可以采取的行动
 */
export enum RiskAction {
  /** 允许 - 直接放行交易 */
  ALLOW = 'allow',
  /** 警告 - 显示风险提示，用户确认后可继续 */
  WARN = 'warn',
  /** 二次确认 - 需要用户再次确认交易信息 */
  SECOND_CONFIRM = 'second_confirm',
  /** 延迟 - 延迟交易，需等待一段时间后自动执行 */
  DELAY = 'delay',
  /** 人工审核 - 提交给风控团队人工审核 */
  MANUAL_REVIEW = 'manual_review',
  /** 拒绝 - 直接阻止交易执行 */
  REJECT = 'reject',
}

/**
 * 规则类别枚举
 * 用于规则分类和统计
 */
export enum RuleCategory {
  /** 地址类规则 - 与地址相关的风控规则 */
  ADDRESS = 'address',
  /** 合约类规则 - 与合约交互相关的规则 */
  CONTRACT = 'contract',
  /** 金额类规则 - 与交易金额相关的规则 */
  AMOUNT = 'amount',
  /** 行为类规则 - 与用户行为模式相关的规则 */
  BEHAVIOR = 'behavior',
  /** 设备类规则 - 与设备/环境相关的规则 */
  DEVICE = 'device',
  /** 域名类规则 - 与 DApp 域名相关的规则 */
  DOMAIN = 'domain',
}

/**
 * 黑名单类型枚举
 */
export enum BlacklistType {
  /** 地址黑名单 - 恶意钱包地址 */
  ADDRESS = 'address',
  /** 合约黑名单 - 恶意合约地址 */
  CONTRACT = 'contract',
  /** 域名黑名单 - 钓鱼网站域名 */
  DOMAIN = 'domain',
}

/**
 * 风控事件类型枚举
 */
export enum RiskEventType {
  /** 高风险交易被阻止 */
  HIGH_RISK_BLOCKED = 'high_risk_blocked',
  /** 中风险交易警告 */
  MEDIUM_RISK_WARNED = 'medium_risk_warned',
  /** 新设备登录 */
  NEW_DEVICE_LOGIN = 'new_device_login',
  /** 异常位置登录 */
  ABNORMAL_LOCATION = 'abnormal_location',
  /** 大额转账 */
  LARGE_TRANSFER = 'large_transfer',
  /** 黑名单拦截 */
  BLACKLIST_BLOCKED = 'blacklist_blocked',
  /** 钓鱼网站拦截 */
  PHISHING_BLOCKED = 'phishing_blocked',
  /** 无限授权检测 */
  UNLIMITED_APPROVAL = 'unlimited_approval',
  /** 高频交易 */
  FREQUENT_TRANSACTIONS = 'frequent_transactions',
  /** 可疑合约交互 */
  SUSPICIOUS_CONTRACT = 'suspicious_contract',
  /** 用户确认高风险交易 */
  USER_CONFIRMED_HIGH_RISK = 'user_confirmed_high_risk',
  /** 风控规则配置变更 */
  RULE_CONFIG_CHANGED = 'rule_config_changed',
  /** 黑白名单更新 */
  BLACKLIST_UPDATED = 'blacklist_updated',
}

/**
 * 告警级别枚举
 */
export enum AlertLevel {
  /** 信息级 - 常规记录 */
  INFO = 'info',
  /** 警告级 - 需要关注 */
  WARNING = 'warning',
  /** 危险级 - 需要立即处理 */
  DANGER = 'danger',
  /** 严重级 - 重大安全事件 */
  CRITICAL = 'critical',
}

/**
 * 评分维度枚举
 */
export enum ScoreDimension {
  /** 金额维度 - 交易金额风险 */
  AMOUNT = 'amount',
  /** 地址维度 - 地址风险 */
  ADDRESS = 'address',
  /** 合约维度 - 合约风险 */
  CONTRACT = 'contract',
  /** 行为维度 - 行为模式风险 */
  BEHAVIOR = 'behavior',
  /** 设备维度 - 设备/环境风险 */
  DEVICE = 'device',
  /** 域名维度 - 域名风险 */
  DOMAIN = 'domain',
}

/**
 * 链类型枚举
 */
export enum ChainType {
  /** EVM 兼容链 */
  EVM = 'evm',
  /** Solana 链 */
  SOLANA = 'solana',
  /** Bitcoin 链 */
  BITCOIN = 'bitcoin',
  /** Tron 链 */
  TRON = 'tron',
  /** Cosmos 链 */
  COSMOS = 'cosmos',
}

/**
 * 签名类型枚举
 */
export enum SignType {
  /** 交易签名 */
  TRANSACTION = 'transaction',
  /** 类型化数据签名 */
  TYPED_DATA = 'typed_data',
  /** 消息签名 */
  MESSAGE = 'message',
  /** 个人签名 */
  PERSONAL = 'personal',
}

// ============================================================
// 规则相关接口
// ============================================================

/**
 * 风控规则参数接口
 * 规则的可配置参数
 */
export interface RiskRuleParameters {
  /** 规则触发时的默认动作 */
  action?: RiskAction;
  /** 风险分数阈值 */
  threshold?: number;
  /** 其他自定义参数 */
  [key: string]: unknown;
}

/**
 * 风控规则接口
 * 所有风控规则必须实现此接口
 */
export interface RiskRule {
  /** 规则唯一标识代码 */
  readonly ruleCode: string;
  /** 规则名称 */
  readonly ruleName: string;
  /** 规则描述 */
  readonly description?: string;
  /** 规则类别 */
  readonly category: RuleCategory;
  /** 规则优先级，数值越大优先级越高 */
  readonly priority: number;
  /** 规则是否启用 */
  enabled: boolean;
  /** 规则参数 */
  parameters?: RiskRuleParameters;
  /** 规则版本号 */
  readonly version?: string;

  /**
   * 执行规则评估
   * @param context 风控上下文
   * @returns 规则评估结果
   */
  evaluate(context: RiskContext): Promise<RiskRuleResult>;

  /**
   * 判断规则是否适用于当前上下文
   * @param context 风控上下文
   * @returns 是否适用
   */
  isApplicable?(context: RiskContext): boolean;
}

/**
 * 规则评估结果接口
 */
export interface RiskRuleResult {
  /** 规则代码 */
  ruleCode: string;
  /** 规则名称 */
  ruleName: string;
  /** 规则类别 */
  category: RuleCategory;
  /** 是否匹配（触发）规则 */
  matched: boolean;
  /** 规则贡献的风险分数 */
  score: number;
  /** 风险等级 */
  level: RiskLevel;
  /** 建议动作 */
  action: RiskAction;
  /** 触发原因描述 */
  reason?: string;
  /** 详细信息 */
  detail?: Record<string, unknown>;
  /** 规则优先级 */
  priority?: number;
  /** 评估耗时（毫秒） */
  evaluationTime?: number;
}

/**
 * 规则配置接口
 * 用于动态配置规则
 */
export interface RiskRuleConfig {
  /** 规则代码 */
  ruleCode: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 默认动作 */
  action?: RiskAction;
  /** 阈值 */
  threshold?: number;
  /** 优先级 */
  priority?: number;
  /** 其他参数 */
  parameters?: Record<string, unknown>;
}

// ============================================================
// 风控上下文接口
// ============================================================

/**
 * 交易信息接口
 */
export interface TransactionInfo {
  /** 交易哈希 */
  hash?: string;
  /** 发送方地址 */
  from?: string;
  /** 接收方地址 */
  to?: string;
  /** 交易金额（原始单位） */
  value?: string;
  /** Gas 价格 */
  gasPrice?: string;
  /** Gas 限制 */
  gasLimit?: string;
  /** 交易数据 */
  data?: string;
  /** Nonce */
  nonce?: number;
  /** 链 ID */
  chainId?: number;
  /** 合约地址（如果是合约交互） */
  contractAddress?: string;
  /** 函数选择器 */
  methodSelector?: string;
  /** 解码后的函数参数 */
  decodedParams?: Record<string, unknown>;
}

/**
 * 设备信息接口
 */
export interface DeviceInfo {
  /** 设备唯一标识 */
  deviceId?: string;
  /** 设备类型 */
  deviceType?: 'mobile' | 'desktop' | 'tablet' | 'hardware_wallet';
  /** 操作系统 */
  os?: string;
  /** 操作系统版本 */
  osVersion?: string;
  /** 浏览器 */
  browser?: string;
  /** 浏览器版本 */
  browserVersion?: string;
  /** User-Agent */
  userAgent?: string;
  /** IP 地址 */
  ipAddress?: string;
  /** 地理位置 */
  location?: string;
  /** 是否新设备 */
  isNewDevice?: boolean;
  /** 是否异常位置 */
  isAbnormalLocation?: boolean;
  /** 是否硬件钱包 */
  isHardwareWallet?: boolean;
}

/**
 * 用户行为信息接口
 */
export interface BehaviorInfo {
  /** 用户 ID */
  userId?: string;
  /** 钱包 ID */
  walletId?: string;
  /** 今日交易次数 */
  todayTransactionCount?: number;
  /** 本周交易次数 */
  weekTransactionCount?: number;
  /** 近一小时交易次数 */
  hourTransactionCount?: number;
  /** 平均交易金额 */
  averageTransactionAmount?: string;
  /** 最大交易金额历史 */
  maxTransactionAmount?: string;
  /** 常用交易地址列表 */
  frequentAddresses?: string[];
  /** 常用交互合约列表 */
  frequentContracts?: string[];
  /** 上次交易时间 */
  lastTransactionTime?: Date;
  /** 上次登录时间 */
  lastLoginTime?: Date;
  /** 账户创建时间 */
  accountCreatedAt?: Date;
}

/**
 * DApp 信息接口
 */
export interface DAppInfo {
  /** DApp 域名 */
  domain?: string;
  /** DApp 名称 */
  name?: string;
  /** DApp URL */
  url?: string;
  /** DApp 图标 */
  icon?: string;
  /** 是否已知 DApp */
  isKnownDApp?: boolean;
  /** 是否已验证 */
  isVerified?: boolean;
}

/**
 * 资产信息接口
 */
export interface AssetInfo {
  /** 代币符号 */
  symbol?: string;
  /** 代币名称 */
  name?: string;
  /** 代币合约地址 */
  contractAddress?: string;
  /** 小数位数 */
  decimals?: number;
  /** 金额（原始单位） */
  amount?: string;
  /** 法币价值（USD） */
  valueInUsd?: number;
  /** 是否为 NFT */
  isNFT?: boolean;
  /** NFT Token ID */
  tokenId?: string;
}

/**
 * 风控上下文接口
 * 包含进行风控评估所需的所有信息
 */
export interface RiskContext {
  /** 请求唯一标识 */
  requestId: string;
  /** 评估时间 */
  timestamp: Date;
  /** 链类型 */
  chainType: ChainType;
  /** 签名类型 */
  signType: SignType;
  /** 钱包地址 */
  walletAddress: string;
  /** 钱包 ID */
  walletId?: string;
  /** 用户 ID */
  userId?: string;

  /** 交易信息 */
  transaction?: TransactionInfo;
  /** 设备信息 */
  device?: DeviceInfo;
  /** 行为信息 */
  behavior?: BehaviorInfo;
  /** DApp 信息 */
  dapp?: DAppInfo;
  /** 涉及的资产信息 */
  assets?: AssetInfo[];

  /** 原始签名负载 */
  payload?: unknown;

  /** 自定义扩展数据 */
  extra?: Record<string, unknown>;
}

// ============================================================
// 风险评分相关接口
// ============================================================

/**
 * 维度评分接口
 */
export interface DimensionScore {
  /** 评分维度 */
  dimension: ScoreDimension;
  /** 维度名称 */
  dimensionName: string;
  /** 维度得分（0-100） */
  score: number;
  /** 权重（0-1） */
  weight: number;
  /** 加权后得分 */
  weightedScore: number;
  /** 风险等级 */
  level: RiskLevel;
  /** 评分说明 */
  description?: string;
  /** 评分详情 */
  details?: Record<string, unknown>;
}

/**
 * 风险评分接口
 */
export interface RiskScore {
  /** 总得分（0-100） */
  totalScore: number;
  /** 综合风险等级 */
  level: RiskLevel;
  /** 各维度评分 */
  dimensions: DimensionScore[];
  /** 基于规则的加分 */
  ruleBasedScore: number;
  /** 评分模型版本 */
  modelVersion: string;
  /** 评分时间 */
  calculatedAt: Date;
}

/**
 * 评分权重配置接口
 */
export interface ScoreWeights {
  /** 金额维度权重 */
  amount: number;
  /** 地址维度权重 */
  address: number;
  /** 合约维度权重 */
  contract: number;
  /** 行为维度权重 */
  behavior: number;
  /** 设备维度权重 */
  device: number;
  /** 域名维度权重 */
  domain: number;
}

// ============================================================
// 决策相关接口
// ============================================================

/**
 * 风控决策接口
 */
export interface RiskDecision {
  /** 最终动作 */
  action: RiskAction;
  /** 风险等级 */
  level: RiskLevel;
  /** 是否允许执行 */
  allowed: boolean;
  /** 决策原因 */
  reasons: string[];
  /** 触发的规则列表 */
  matchedRules: RiskRuleResult[];
  /** 风险评分 */
  riskScore: RiskScore;
  /** 决策说明 */
  explanation?: string;
  /** 建议措施 */
  recommendations?: string[];
  /** 是否需要二次验证 */
  requireSecondFactor?: boolean;
  /** 延迟时间（秒），当 action 为 delay 时有效 */
  delaySeconds?: number;
  /** 决策 ID */
  decisionId: string;
  /** 决策时间 */
  decidedAt: Date;
  /** 决策引擎版本 */
  engineVersion: string;
}

/**
 * 决策矩阵配置接口
 */
export interface DecisionMatrixConfig {
  /** 低风险阈值 */
  lowThreshold: number;
  /** 中风险阈值 */
  mediumThreshold: number;
  /** 高风险阈值 */
  highThreshold: number;
  /** 严重风险阈值 */
  criticalThreshold: number;
  /** 各等级对应动作 */
  levelActions: Record<RiskLevel, RiskAction>;
  /** 是否启用规则动作覆盖 */
  enableRuleActionOverride: boolean;
  /** 是否启用决策升级 */
  enableEscalation: boolean;
  /** 升级触发条件（同时触发的高风险规则数） */
  escalationRuleCount: number;
}

// ============================================================
// 黑白名单相关接口
// ============================================================

/**
 * 黑名单条目接口
 */
export interface BlacklistEntry {
  /** 条目 ID */
  id: string;
  /** 类型 */
  type: BlacklistType;
  /** 值（地址/合约/域名） */
  value: string;
  /** 原因 */
  reason?: string;
  /** 来源 */
  source?: string;
  /** 风险等级 */
  riskLevel?: RiskLevel;
  /** 添加时间 */
  createdAt: Date;
  /** 过期时间（可选） */
  expiresAt?: Date;
  /** 是否启用 */
  enabled: boolean;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 白名单条目接口
 */
export interface WhitelistEntry {
  /** 条目 ID */
  id: string;
  /** 类型 */
  type: BlacklistType;
  /** 值（地址/合约/域名） */
  value: string;
  /** 备注 */
  remark?: string;
  /** 来源 */
  source?: string;
  /** 添加时间 */
  createdAt: Date;
  /** 过期时间（可选） */
  expiresAt?: Date;
  /** 是否启用 */
  enabled: boolean;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 黑白名单导入结果接口
 */
export interface ImportResult {
  /** 成功导入数量 */
  successCount: number;
  /** 失败数量 */
  failedCount: number;
  /** 跳过数量（已存在） */
  skippedCount: number;
  /** 失败详情 */
  failures: Array<{
    value: string;
    reason: string;
  }>;
}

// ============================================================
// 风控事件相关接口
// ============================================================

/**
 * 风控事件接口
 */
export interface RiskEvent {
  /** 事件 ID */
  eventId: string;
  /** 事件类型 */
  eventType: RiskEventType;
  /** 事件级别 */
  level: AlertLevel;
  /** 事件标题 */
  title: string;
  /** 事件描述 */
  description?: string;
  /** 相关用户 ID */
  userId?: string;
  /** 相关钱包地址 */
  walletAddress?: string;
  /** 相关交易哈希 */
  transactionHash?: string;
  /** 关联的风控决策 ID */
  decisionId?: string;
  /** 关联的规则代码 */
  ruleCode?: string;
  /** 事件数据 */
  data?: Record<string, unknown>;
  /** 是否已读 */
  isRead: boolean;
  /** 是否已处理 */
  isHandled: boolean;
  /** 处理结果 */
  handleResult?: string;
  /** 处理人 */
  handledBy?: string;
  /** 处理时间 */
  handledAt?: Date;
  /** 事件发生时间 */
  createdAt: Date;
}

/**
 * 事件查询过滤条件
 */
export interface EventQueryFilter {
  /** 事件类型 */
  eventType?: RiskEventType[];
  /** 事件级别 */
  level?: AlertLevel[];
  /** 用户 ID */
  userId?: string;
  /** 钱包地址 */
  walletAddress?: string;
  /** 开始时间 */
  startTime?: Date;
  /** 结束时间 */
  endTime?: Date;
  /** 是否已读 */
  isRead?: boolean;
  /** 是否已处理 */
  isHandled?: boolean;
  /** 分页页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 事件统计接口
 */
export interface EventStatistics {
  /** 总事件数 */
  totalEvents: number;
  /** 各级别事件数 */
  levelCounts: Record<AlertLevel, number>;
  /** 各类型事件数 */
  typeCounts: Record<RiskEventType, number>;
  /** 今日事件数 */
  todayCount: number;
  /** 本周事件数 */
  weekCount: number;
  /** 本月事件数 */
  monthCount: number;
  /** 未读事件数 */
  unreadCount: number;
  /** 未处理事件数 */
  unhandledCount: number;
  /** 高风险交易阻止数 */
  blockedCount: number;
  /** 用户确认高风险交易数 */
  userConfirmedCount: number;
}

/**
 * 告警配置接口
 */
export interface AlertConfig {
  /** 是否启用告警 */
  enabled: boolean;
  /** 触发告警的最低级别 */
  minLevel: AlertLevel;
  /** 告警渠道 */
  channels: AlertChannel[];
  /** 静默期（秒），相同类型事件在此期间不重复告警 */
  silencePeriod: number;
}

/**
 * 告警渠道类型
 */
export type AlertChannel = 'in_app' | 'email' | 'sms' | 'webhook';

// ============================================================
// 风控评估结果接口
// ============================================================

/**
 * 风控评估结果接口
 */
export interface RiskAssessment {
  /** 评估请求 ID */
  requestId: string;
  /** 风控决策 */
  decision: RiskDecision;
  /** 所有规则执行结果 */
  ruleResults: RiskRuleResult[];
  /** 触发的规则 */
  matchedRules: RiskRuleResult[];
  /** 风险评分 */
  riskScore: RiskScore;
  /** 评估耗时（毫秒） */
  evaluationTime: number;
  /** 评估时间 */
  evaluatedAt: Date;
  /** 引擎版本 */
  engineVersion: string;
}

// ============================================================
// 引擎配置接口
// ============================================================

/**
 * 风控引擎配置接口
 */
export interface RiskEngineConfig {
  /** 是否启用风控引擎 */
  enabled: boolean;
  /** 引擎模式 */
  mode: 'active' | 'passive' | 'dry_run';
  /** 默认链类型 */
  defaultChain: ChainType;
  /** 评分权重配置 */
  scoreWeights: ScoreWeights;
  /** 决策矩阵配置 */
  decisionMatrix: DecisionMatrixConfig;
  /** 大额转账阈值 */
  largeAmountThresholds: Partial<Record<ChainType, string>>;
  /** 高频交易限制 */
  frequencyLimits: {
    hourly: number;
    daily: number;
  };
  /** 新地址交互阈值（次数） */
  newAddressThreshold: number;
  /** 告警配置 */
  alertConfig: AlertConfig;
}

// ============================================================
// 行为分析相关接口
// ============================================================

/**
 * 用户行为画像接口
 */
export interface UserBehaviorProfile {
  /** 用户 ID */
  userId: string;
  /** 交易行为特征 */
  transactionPatterns: {
    averageAmount: string;
    medianAmount: string;
    amountStdDev: string;
    usualActiveHours: number[];
    usualActiveDays: number[];
  };
  /** 常用地址列表及频次 */
  frequentAddresses: Array<{
    address: string;
    count: number;
    lastInteraction: Date;
  }>;
  /** 常用合约列表及频次 */
  frequentContracts: Array<{
    address: string;
    count: number;
    lastInteraction: Date;
  }>;
  /** 风险偏好评分（0-100，越高越保守） */
  riskPreferenceScore: number;
  /** 画像更新时间 */
  updatedAt: Date;
}

/**
 * 行为异常检测结果接口
 */
export interface BehaviorAnomalyResult {
  /** 是否异常 */
  isAnomaly: boolean;
  /** 异常类型 */
  anomalyType?: string;
  /** 异常分数（0-100） */
  anomalyScore: number;
  /** 风险等级 */
  level: RiskLevel;
  /** 异常描述 */
  description?: string;
  /** 详细信息 */
  details?: Record<string, unknown>;
}

// ============================================================
// 交易模拟相关接口
// ============================================================

/**
 * 交易模拟结果接口
 */
export interface TransactionSimulationResult {
  /** 模拟是否成功 */
  success: boolean;
  /** 预估 Gas 消耗 */
  estimatedGas?: string;
  /** 预估 Gas 费用 */
  estimatedGasFee?: string;
  /** 交易后余额变化 */
  balanceChanges?: Array<{
    address: string;
    token: string;
    before: string;
    after: string;
    change: string;
  }>;
  /** 资产损失评估 */
  assetLossAssessment?: {
    /** 是否存在资产损失风险 */
    hasLossRisk: boolean;
    /** 预估损失金额（USD） */
    estimatedLossUsd?: number;
    /** 损失描述 */
    description?: string;
  };
  /** 错误信息 */
  error?: string;
}

// ============================================================
// 插件接口
// ============================================================

/**
 * 风控引擎插件接口
 */
export interface RiskEnginePlugin {
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 插件描述 */
  description?: string;

  /**
   * 插件初始化
   * @param engine 风控引擎实例
   */
  onInitialize?(engine: unknown): void;

  /**
   * 规则评估前钩子
   * @param context 风控上下文
   */
  beforeEvaluate?(context: RiskContext): void | Promise<void>;

  /**
   * 规则评估后钩子
   * @param assessment 评估结果
   */
  afterEvaluate?(assessment: RiskAssessment): void | Promise<void>;

  /**
   * 决策前钩子
   * @param context 风控上下文
   * @param ruleResults 规则结果
   * @param riskScore 风险评分
   */
  beforeDecision?(
    context: RiskContext,
    ruleResults: RiskRuleResult[],
    riskScore: RiskScore
  ): void | Promise<void>;

  /**
   * 决策后钩子
   * @param decision 决策结果
   */
  afterDecision?(decision: RiskDecision): void | Promise<void>;
}
