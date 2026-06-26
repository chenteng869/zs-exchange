/**
 * 永续合约（USDT-M Perpetual）核心类型定义
 *
 * 设计原则：
 *  - 所有金额/价格/数量均以 string 表示，复用 src/lib/matching/decimal.ts
 *  - 字段命名保持与 src/types/models.ts 中的 Contract/Position 风格一致
 *  - 业务侧通过 PerpEngine / LiquidationEngine / FundingEngine 协作
 */

/** 持仓方向 */
export type Side = 'long' | 'short';

/** 保证金模式 */
export type MarginMode = 'cross' | 'isolated';

/** 仓位状态 */
export type PositionStatus = 'open' | 'closed' | 'liquidated';

/** 委托类型 */
export type OrderType = 'market' | 'limit' | 'stop_market' | 'stop_limit';

/** 委托状态 */
export type OrderStatus =
  | 'pending'
  | 'open'
  | 'partial'
  | 'filled'
  | 'cancelled'
  | 'rejected';

/** 合约元数据 */
export interface Contract {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  lastPrice?: string;
  /** 最小价格变动 */
  tickSize: string;
  /** 最小数量变动 */
  stepSize: string;
  /** 最小下单数量 */
  minQty: string;
  /** 最大下单数量 */
  maxQty: string;
  /** 最小名义价值（USDT） */
  minNotional: string;
  /** 最大杠杆 */
  maxLeverage: number;
  /** 默认杠杆 */
  defaultLeverage: number;
  /** 维持保证金率 (0.005 = 0.5%) */
  maintenanceMarginRate: number;
  /** 初始保证金率 (0.01 = 1%) */
  initialMarginRate: number;
  /** maker 手续费率 */
  makerFee: number;
  /** taker 手续费率 */
  takerFee: number;
  /** 资金费率结算周期（小时） */
  fundingIntervalHours: number;
  /** 资金费率上下限（绝对值） */
  fundingCap: number;
  isActive: boolean;
}

/** 持仓 */
export interface Position {
  id: string;
  userId: string;
  symbol: string;
  side: Side;
  marginMode: MarginMode;
  /** 持仓数量（基础币，正数） */
  size: string;
  /** 加权平均开仓价 */
  entryPrice: string;
  /** 当前标记价 */
  markPrice: string;
  /** 强平价 */
  liquidationPrice: string;
  /** 杠杆倍数 */
  leverage: number;
  /** 占用保证金（隔离=仓位保证金；跨仓=初始保证金） */
  margin: string;
  /** 未实现盈亏 */
  unrealizedPnl: string;
  /** 收益率 = unrealizedPnl / margin */
  unrealizedPnlRate: string;
  /** 保证金率 = (margin + unrealizedPnl) / positionValue */
  marginRatio: string;
  /** 维持保证金 */
  maintenanceMargin: string;
  createdAt: number;
  updatedAt: number;
  status: PositionStatus;
  /** 追加保证金提示价 */
  marginCallPrice?: string;
}

/** 委托单 */
export interface Order {
  id: string;
  userId: string;
  symbol: string;
  side: Side;
  type: OrderType;
  /** 限价（限价单） */
  price?: string;
  /** 触发价（止损单） */
  stopPrice?: string;
  quantity: string;
  leverage: number;
  marginMode: MarginMode;
  reduceOnly: boolean;
  postOnly: boolean;
  status: OrderStatus;
  filledQty: string;
  avgFillPrice: string;
  fee: string;
  createdAt: number;
  updatedAt: number;
  positionId?: string;
  clientOrderId?: string;
  rejectReason?: string;
}

/** 资金费率 */
export interface FundingRate {
  symbol: string;
  /** 资金费率（如 0.0001 = 0.01%） */
  rate: string;
  /** 下次结算时间戳 */
  nextFundingTime: number;
  markPrice: string;
  /** 指数价（来自 Kaiko） */
  indexPrice: string;
  /** 下一期预测费率 */
  predictedRate?: string;
}

/** 资金费结算记录 */
export interface FundingPayment {
  id: string;
  positionId: string;
  userId: string;
  symbol: string;
  rate: string;
  /** 支付金额（正=收，负=付） */
  amount: string;
  timestamp: number;
  /** 方向兑山款字段 */
  side?: string;
  positionSize?: string;
  fundingRate?: string;
  paymentAmount?: string;
  direction?: string;
  markPrice?: string;
  period?: string;
}

/** 保险基金 */
export interface InsuranceFund {
  symbol: string;
  balance: string;
  totalContributed: string;
  totalUsed: string;
  /** 历史总损失（兑山款字段） */
  totalLoss?: string;
  /** 历史总收益（兑山款字段） */
  totalGain?: string;
  /** 最后更新时间（兡山款字段） */
  lastUpdated?: number;
  /** 历史峰値（兡山款字段） */
  peakBalance?: string;
}

/** 强平记录 */
export interface Liquidation {
  id: string;
  positionId: string;
  userId: string;
  symbol: string;
  side: Side;
  quantity: string;
  /** 兡山款字段兑山数量 */
  liquidatedSize?: string;
  liquidationPrice?: string;
  markPrice: string;
  bankruptcyPrice: string;
  executedPrice?: string;
  marginLost?: string;
  fee?: string;
  penalty: string;
  reason?: string;
  status?: string;
  remainingMargin: string;
  insuranceFundUsed: string;
  adlTriggered: boolean;
  timestamp: number;
}

/** 账户总览（类似 Binance 的 unified account） */
export interface Account {
  userId: string;
  totalWalletBalance: string;
  totalUnrealizedPnl: string;
  totalMarginBalance: string;
  totalPositionInitialMargin: string;
  totalOpenOrderInitialMargin: string;
  availableBalance: string;
  maxWithdrawAmount: string;
  marginRatio: string;
  updatedAt: number;
}

/** 风险配置 */
export interface RiskConfig {
  initialMarginRate: number;
  maintenanceMarginRate: number;
  liquidationFeeRate: number;
  adlTriggerMarginRatio: number;
  adlRankThreshold: number;
}

/** ADL 排名结果（用于自动减仓） */
export interface AdlRank {
  position: Position;
  /** 排名指标 = leverage * (unrealizedPnlRate + 1) */
  score: number;
}
