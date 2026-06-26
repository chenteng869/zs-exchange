/**
 * KOL / Influencer 推广返佣 + 跟单交易 系统 - 类型定义 & 常量
 *
 * 模块组成：
 *  - types                 核心类型 (Kol / Referral / Commission / CopyTrading)
 *  - kol-service           KOL 管理（注册/审批/暂停/评级/排行榜）
 *  - referral-service      邀请关系（绑定/解绑/多级分销/业绩）
 *  - commission-engine     返佣引擎（规则/计算/记录/结算）
 *  - copy-trading          跟单服务（配置/触发/风险控制）
 *  - kol-engine            业务层（集成 OrderEngine / 事件订阅 / 报表）
 *
 * 设计原则：
 *  - 不引外部依赖，复用现有 matching/decimal
 *  - 金额统一用 string，避免浮点精度问题
 *  - 事件订阅采用简单回调数组（无外部依赖）
 *  - 多级分销上限 3 级（L1/L2/L3）
 */

// -----------------------------------------------------------------------------
// 常量
// -----------------------------------------------------------------------------

/** 多级返佣比例（L1=30% / L2=10% / L3=5%）。 */
export const KOL_COMMISSION_LEVELS: Record<1 | 2 | 3, number> = {
  1: 0.30,
  2: 0.10,
  3: 0.05,
};

/** 每个等级最低粉丝数要求。 */
export const KOL_TIER_MIN_FOLLOWERS: Record<KolTier, number> = {
  micro: 0,
  macro: 1_000,
  mega: 10_000,
  celebrity: 100_000,
  institutional: 0, // 机构单独标准
};

/** 每个等级最低团队交易量（USDT）。 */
export const KOL_TIER_MIN_VOLUME: Record<KolTier, string> = {
  micro: '0',
  macro: '100000',
  mega: '1000000',
  celebrity: '10000000',
  institutional: '100000000',
};

/** 默认返佣费率（按交易类型）。 */
export const KOL_DEFAULT_COMMISSION_RATES: Record<CommissionType, number> = {
  spot: 0.001, // 0.1%
  perp: 0.0005, // 0.05%
  deposit: 0, // 入金不返佣
  withdraw: 0, // 出金不返佣
  copy: 0.002, // 0.2% 跟单
};

/** 最小结算金额 (100 USDT 起结)。 */
export const KOL_SETTLEMENT_MIN_AMOUNT = '100';

/** 默认跟单比例 50%。 */
export const KOL_COPY_DEFAULT_RATIO = 0.5;

/** 跟单最大比例 100%。 */
export const KOL_COPY_MAX_RATIO = 1.0;

/** 默认最大分销层级。 */
export const KOL_MAX_LEVEL = 3;

/** 风险检查：单笔最大损失 1000 USDT。 */
export const KOL_DEFAULT_MAX_LOSS_PER_TRADE = '1000';

/** 风险检查：每日最大损失 5000 USDT。 */
export const KOL_DEFAULT_MAX_DAILY_LOSS = '5000';

/** 排行榜最大条目数。 */
export const KOL_LEADERBOARD_LIMIT = 100;

/** 跟单最大数量上限（笔）。 */
export const KOL_COPY_MAX_TRADES = 10_000;

// -----------------------------------------------------------------------------
// 基础枚举
// -----------------------------------------------------------------------------

export type KolTier = 'micro' | 'macro' | 'mega' | 'celebrity' | 'institutional';
export type KolStatus = 'pending' | 'active' | 'suspended' | 'banned';
export type CommissionType = 'spot' | 'perp' | 'deposit' | 'withdraw' | 'copy';
export type CopyMode = 'fixed' | 'proportional' | 'scaled';

// -----------------------------------------------------------------------------
// KOL 实体
// -----------------------------------------------------------------------------

/**
 * KOL 账户。
 *  - id            内部 ID
 *  - userId        绑定的 userId
 *  - displayName   显示名
 *  - tier          等级（影响费率）
 *  - status        状态
 *  - socials       社交账号
 *  - followerCount 粉丝数（手动录入或第三方数据源）
 *  - totalCommission  累计返佣
 *  - pendingCommission 待结算返佣
 *  - withdrawnCommission 已提现返佣
 *  - kycVerified   KOL 是否完成 KYC（KOL 必须 KYC）
 *  - approvedAt    审批时间
 *  - joinedAt      加入时间
 *  - customCommissionRate 自定义费率（覆盖默认值）
 *  - referralCode  推广码（绑定用户用）
 */
export interface Kol {
  id: string;
  userId: string;
  displayName: string;
  tier: KolTier;
  status: KolStatus;
  avatarUrl?: string;
  bio?: string;
  socials: {
    twitter?: string;
    telegram?: string;
    youtube?: string;
    discord?: string;
  };
  followerCount: number;
  totalCommission: string;
  pendingCommission: string;
  withdrawnCommission: string;
  kycVerified: boolean;
  approvedAt: number;
  joinedAt: number;
  customCommissionRate?: number;
  referralCode: string;
  /** 暂停原因。 */
  suspendReason?: string;
}

// -----------------------------------------------------------------------------
// 邀请关系
// -----------------------------------------------------------------------------

/**
 * 邀请关系（KOL → User）。
 *  - level         1=直接  2=二级  3=三级
 *  - totalTradingVolume 累计交易量
 *  - totalCommission    累计贡献返佣
 */
export interface Referral {
  id: string;
  kolId: string;
  userId: string;
  level: number;
  invitedAt: number;
  totalTradingVolume: string;
  totalCommission: string;
  status: 'active' | 'inactive';
}

// -----------------------------------------------------------------------------
// 返佣规则
// -----------------------------------------------------------------------------

/**
 * 返佣规则。
 *  - kolId=null 表示全局规则
 *  - tier=null 表示适用所有等级
 *  - rate=0.001 表示 0.1%
 */
export interface CommissionRule {
  id: string;
  kolId?: string;
  tier?: KolTier;
  type: CommissionType;
  rate: number;
  minAmount?: string;
  maxAmount?: string;
  effectiveFrom: number;
  effectiveTo?: number;
  isActive: boolean;
}

// -----------------------------------------------------------------------------
// 返佣记录
// -----------------------------------------------------------------------------

/**
 * 返佣记录。
 *  - level         1/2/3  表示哪一级的返佣
 *  - sourceTxId    触发此返佣的成交 / 入金 tx
 *  - status        pending → confirmed → paid / revoked
 */
export interface Commission {
  id: string;
  kolId: string;
  referralId: string;
  userId: string;
  type: CommissionType;
  baseAmount: string;
  rate: number;
  amount: string;
  level: number;
  sourceTxId: string;
  status: 'pending' | 'confirmed' | 'paid' | 'revoked';
  createdAt: number;
  confirmedAt?: number;
  paidAt?: number;
}

// -----------------------------------------------------------------------------
// 跟单
// -----------------------------------------------------------------------------

/**
 * 跟单配置。
 *  - mode              模式
 *  - fixedAmount       fixed 模式下的固定金额
 *  - proportionalRatio proportional 模式下的比例 (0.5 = 50%)
 *  - scaled            缩放系数（scaled 模式用）
 *  - maxLossPerTrade   单笔最大损失
 *  - maxDailyLoss      每日最大损失
 *  - stopLossRatio     止损比例（相对开仓价）
 *  - takeProfitRatio   止盈比例
 */
export interface CopyTradingConfig {
  id: string;
  followerUserId: string;
  kolUserId: string;
  mode: CopyMode;
  fixedAmount?: string;
  proportionalRatio?: number;
  scaled?: number;
  maxLossPerTrade?: string;
  maxDailyLoss?: string;
  stopLossRatio?: number;
  takeProfitRatio?: number;
  status: 'active' | 'paused' | 'stopped';
  startedAt: number;
  stoppedAt?: number;
  totalCopied: number;
  totalProfit: string;
}

/**
 * 跟单成交。
 */
export interface CopyTrade {
  id: string;
  configId: string;
  kolOrderId: string;
  followerUserId: string;
  symbol: string;
  side: 'buy' | 'sell';
  kolQuantity: string;
  copyQuantity: string;
  kolPrice: string;
  followerPrice: string;
  pnl?: string;
  status: 'pending' | 'filled' | 'cancelled' | 'failed';
  reason?: string;
  createdAt: number;
  filledAt?: number;
}

// -----------------------------------------------------------------------------
// 统计
// -----------------------------------------------------------------------------

/**
 * KOL 业绩统计。
 */
export interface KolStats {
  kolId: string;
  period: { start: number; end: number };
  totalFollowers: number;
  activeFollowers: number;
  totalTradingVolume: string;
  totalCommission: string;
  averageCommissionPerUser: string;
  rank: number;
  topReferrals: Referral[];
  byLevel: Record<number, { count: number; volume: string; commission: string }>;
}

// -----------------------------------------------------------------------------
// 结算
// -----------------------------------------------------------------------------

/**
 * 结算单。
 */
export interface Settlement {
  id: string;
  kolId: string;
  period: { start: number; end: number };
  totalAmount: string;
  status: 'pending' | 'paid' | 'failed';
  createdAt: number;
  paidAt?: number;
  transactionId?: string;
}

// -----------------------------------------------------------------------------
// 事件载荷
// -----------------------------------------------------------------------------

export interface KolTradeEvent {
  kolId: string;
  kolUserId: string;
  trade: KolOrderLike;
  timestamp: number;
}

export interface CommissionEvent {
  commission: Commission;
  timestamp: number;
}

export interface CopyTradeEvent {
  copyTrade: CopyTrade;
  timestamp: number;
}

/** KOL 成交的轻量描述（实际生产可对接 Order/Trade）。 */
export interface KolOrderLike {
  id: string;
  userId: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: string;
  quantity: string;
  quoteQty?: string;
  executedAt?: number;
}

// -----------------------------------------------------------------------------
// 通用工具类型
// -----------------------------------------------------------------------------

export type Unsubscribe = () => void;
