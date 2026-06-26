/**
 * 高级订单类型定义
 *
 * 支持订单类型：
 *  - LIMIT: 限价单
 *  - MARKET: 市价单
 *  - STOP_LOSS: 止损市价单
 *  - STOP_LOSS_LIMIT: 止损限价单
 *  - TAKE_PROFIT: 止盈市价单
 *  - TAKE_PROFIT_LIMIT: 止盈限价单
 *  - TRAILING_STOP: 跟踪止损单
 *  - ICEBERG: 冰山单
 *  - LIMIT_MAKER: 只做市单
 *
 * 触发条件类型：
 *  - LAST_PRICE: 最新成交价
 *  - MARK_PRICE: 标记价格
 *  - INDEX_PRICE: 指数价格
 *
 * 生效机制：
 *  - 条件单进入订单簿前需先触发
 *  - 冰山单拆分多个可见数量的限价单
 *  - 跟踪止损动态调整触发价
 */

import type { OrderSide, OrderStatus, OrderType } from '@/types/models';

// Compatibility aliases for naming differences
type OrderTimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTD';
type OrderSelfTradePrevention = 'EXPIRE_TAKER' | 'EXPIRE_MAKER' | 'EXPIRE_BOTH' | 'NONE';

/** 触发条件类型 */
export type TriggerType = 'last_price' | 'mark_price' | 'index_price';

/** 条件单状态 */
export type ConditionalOrderStatus =
  | 'pending'      // 等待触发
  | 'triggered'    // 已触发，正在转成普通单
  | 'active'       // 已转成普通单，挂在订单簿
  | 'cancelled'    // 已取消
  | 'rejected'     // 已拒绝
  | 'expired';     // 已过期

/** 跟踪止损订单状态 */
export type TrailingStopStatus =
  | 'pending'      // 激活价未达，等待
  | 'active'       // 激活价已达，跟踪中
  | 'triggered'    // 已触发
  | 'cancelled';   // 已取消

// ============================================================================
// 冰山单
// ============================================================================

/** 冰山单配置 */
export interface IcebergOrderConfig {
  /** 总数量 */
  totalQty: string;
  /** 每次露出的峰值数量 */
  peakQty: string;
  /** 价格 */
  price: string;
  /** 是否随机峰值数量（±一定比例） */
  randomizePeak?: boolean;
  /** 随机比例（0-1，默认0.1，即±10%） */
  randomRatio?: number;
}

/** 冰山单状态 */
export interface IcebergOrderState {
  /** 剩余未成交的总量 */
  remainingTotal: string;
  /** 当前露出的峰值剩余量 */
  currentPeakRemaining: string;
  /** 已成交总量 */
  filledTotal: string;
  /** 已经完成了多少个峰值 */
  completedPeaks: number;
  /** 平均成交价 */
  avgPrice: string;
}

// ============================================================================
// 条件单（止损/止盈）
// ============================================================================

/** 条件单基础配置 */
export interface ConditionalOrderBase {
  /** 触发价 */
  triggerPrice: string;
  /** 触发价格类型 */
  triggerType: TriggerType;
  /** 触发方向（up: 价格向上突破触发，down: 价格向下突破触发） */
  triggerDirection: 'up' | 'down';
  /** 触发后的订单类型 */
  orderType: 'market' | 'limit';
  /** 触发时的时间戳 */
  triggeredAt?: number;
  /** 触发时的触发价 */
  triggeredPrice?: string;
}

/** 止损单配置 */
export interface StopLossOrderConfig extends ConditionalOrderBase {
  strategy: 'stop_loss';
  /** 止损限价（仅 LIMIT 类型） */
  stopPrice?: string;
}

/** 止盈单配置 */
export interface TakeProfitOrderConfig extends ConditionalOrderBase {
  strategy: 'take_profit';
  /** 止盈限价（仅 LIMIT 类型） */
  profitPrice?: string;
}

/** 条件单配置（止盈止损合一） */
export type ConditionalOrderConfig = StopLossOrderConfig | TakeProfitOrderConfig;

// ============================================================================
// 跟踪止损
// ============================================================================

/** 跟踪止损配置 */
export interface TrailingStopConfig {
  /** 激活价格（达到此价后开始跟踪） */
  activationPrice?: string;
  /** 回调比例（0-1，如 0.05 = 5%） */
  callbackRatio: number;
  /** 回调绝对值（与比例二选一，优先比例） */
  callbackValue?: string;
  /** 最低触发价（保护限价） */
  minTriggerPrice?: string;
  /** 最高触发价（保护限价） */
  maxTriggerPrice?: string;
}

/** 跟踪止损状态 */
export interface TrailingStopState {
  /** 当前状态 */
  status: TrailingStopStatus;
  /** 最高价（多单跟踪用） */
  highestPrice?: string;
  /** 最低价（空单跟踪用） */
  lowestPrice?: string;
  /** 当前触发价（动态计算） */
  currentTriggerPrice?: string;
  /** 距离激活的进度（0-1） */
  activationProgress?: number;
  /** 激活时间 */
  activatedAt?: number;
  /** 触发时间 */
  triggeredAt?: number;
}

// ============================================================================
// 扩展订单类型
// ============================================================================

/** 高级订单类型 */
export type AdvancedOrderType =
  | 'iceberg'
  | 'stop_loss'
  | 'stop_loss_limit'
  | 'take_profit'
  | 'take_profit_limit'
  | 'trailing_stop'
  | 'limit_maker'
  | 'limit';

/** 高级订单（条件单/冰山单/跟踪止损） */
export interface AdvancedOrder {
  /** 订单 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 交易对 */
  symbol: string;
  /** 高级订单类型 */
  advancedType: AdvancedOrderType;
  /** 方向 */
  side: OrderSide;
  /** 数量 */
  quantity: string;
  /** 状态 */
  status: ConditionalOrderStatus | TrailingStopStatus;
  /** 下单时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
  /** 冰山单配置 */
  icebergConfig?: IcebergOrderConfig;
  /** 冰山单状态 */
  icebergState?: IcebergOrderState;
  /** 条件单配置 */
  conditionalConfig?: ConditionalOrderConfig;
  /** 条件单状态 */
  conditionalState?: { triggered: boolean; triggeredAt?: number; triggeredPrice?: string };
  /** 跟踪止损配置 */
  trailingConfig?: TrailingStopConfig;
  /** 跟踪止损状态 */
  trailingState?: TrailingStopState;
  /** Time In Force */
  timeInForce?: OrderTimeInForce;
  /** 自成交防范策略 */
  selfTradePrevention?: OrderSelfTradePrevention;
  /** 关联的普通订单 ID（触发后生成） */
  triggeredOrderId?: string;
  /** 客户端订单 ID */
  clientOrderId?: string;
  /** 备注 */
  remark?: string;
  /** 过期时间（可选） */
  expireAt?: number;
}

// ============================================================================
// 订单执行策略
// ============================================================================

/** Time In Force 策略 */
export type TimeInForceStrategy =
  | 'GTC'  // Good Till Canceled - 一直有效直到撤单
  | 'IOC'  // Immediate Or Cancel - 立即成交否则撤单
  | 'FOK'  // Fill Or Kill - 全部成交否则全部撤单
  | 'GTD'; // Good Till Date - 到期前有效

/** 自成交防范模式 */
export type SelfTradePreventionMode =
  | 'none'        // 不防范
  | 'decrement_c' // 取消吃单方
  | 'decrement_m' // 取消挂单方
  | 'cancel_both' // 都取消
  | 'dc_on_mp';   // 吃单方数量递减（仅 maker side 价格保护）

// ============================================================================
// 撮合结果扩展
// ============================================================================

/** 撮合结果（单条成交） */
export interface MatchTrade {
  /** 成交 ID */
  tradeId: string;
  /** 吃单方订单 ID */
  takerOrderId: string;
  /** 挂单方订单 ID */
  makerOrderId: string;
  /** 吃单方用户 ID */
  takerUserId: string;
  /** 挂单方用户 ID */
  makerUserId: string;
  /** 成交价格 */
  price: string;
  /** 成交数量 */
  quantity: string;
  /** 成交金额（quantity * price） */
  quoteQuantity: string;
  /** 成交时间 */
  timestamp: number;
  /** 吃单方手续费 */
  takerFee: string;
  /** 挂单方手续费 */
  makerFee: string;
  /** 手续费资产 */
  feeAsset: string;
  /** 是否是冰山单的一部分 */
  isIcebergMatch?: boolean;
  /** 冰山单父订单 ID */
  icebergParentId?: string;
}

/** 撮合执行结果 */
export interface MatchExecutionResult {
  /** 吃单方订单（执行后的状态） */
  takerOrder: {
    id: string;
    status: OrderStatus;
    filledQty: string;
    remainingQty: string;
    avgPrice: string;
  };
  /** 所有成交 */
  trades: MatchTrade[];
  /** 被吃的挂单（更新后的状态） */
  makerOrders: Array<{
    id: string;
    userId: string;
    remainingQty: string;
    filledQty: string;
    status: OrderStatus;
  }>;
  /** 总成交金额 */
  totalQuoteQty: string;
  /** 总成交量 */
  totalBaseQty: string;
  /** 是否完全成交 */
  isFullyFilled: boolean;
  /** 是否有剩余挂在订单簿 */
  isBooked: boolean;
}
