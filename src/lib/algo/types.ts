/**
 * 算法交易系统 - 核心类型定义
 *
 * 设计原则：
 *  - 所有金额 / 数量 / 价格以 string 表示，复用 src/lib/matching/decimal.ts
 *  - 6 大经典策略：TWAP / VWAP / Iceberg / Sniper / TWAP-Stop / TrailingStop
 *  - AlgoOrder 表示一条算法母单；执行时由策略拆分为若干子单 (childOrders)
 */

/** 算法母单类型 */
export type AlgoType =
  | 'twap'
  | 'vwap'
  | 'iceberg'
  | 'sniper'
  | 'twap_stop'
  | 'trailing_stop';

/** 算法母单状态 */
export type AlgoStatus =
  | 'pending' // 已创建，未启动
  | 'running' // 运行中
  | 'completed' // 全部成交
  | 'partial' // 部分成交（已停止：自然结束 / 手动停止）
  | 'cancelled' // 用户主动取消
  | 'failed' // 失败
  | 'triggered'; // 触发型（sniper / trailing_stop）触发后已完成

/** 买卖方向 */
export type AlgoSide = 'buy' | 'sell';

/** 委托类型（子单） */
export type AlgoChildOrderType = 'market' | 'limit';

/** 子单 */
export interface AlgoChildOrder {
  id: string;
  algoId: string;
  index: number; // 第 N 个子单
  type: AlgoChildOrderType;
  side: AlgoSide;
  price?: string; // 限价单价格
  quantity: string;
  filledQuantity: string;
  avgPrice: string;
  status: 'pending' | 'submitted' | 'filled' | 'cancelled' | 'rejected';
  scheduledAt: number; // 计划执行时间
  executedAt?: number;
  errorMessage?: string;
}

/** 算法母单 */
export interface AlgoOrder {
  id: string;
  userId: string;
  type: AlgoType;
  symbol: string; // 'BTCUSDT'
  side: AlgoSide;
  /** 总量（基础币） */
  totalQuantity: string;
  /** 已成交量（基础币） */
  executedQuantity: string;
  /** 加权平均成交价 */
  avgPrice: string;
  /** 累计成交名义价值（quote） */
  totalNotional: string;
  status: AlgoStatus;

  // -------- 通用时间配置 --------
  createdAt: number;
  startTime: number; // 开始时间戳
  endTime: number; // 结束时间戳
  /** 子单时间间隔（秒） */
  intervalSec: number;

  // -------- 限价（不为空则子单按限价挂单，否则按市价） --------
  limitPrice?: string;

  // -------- Iceberg 配置 --------
  /** 冰山单次显示量（基础币） */
  displayQuantity?: string;
  /** 数量抖动比例 0-1，0.1 = ±10% */
  variance?: number;

  // -------- VWAP 配置 --------
  /** 成交量分布桶（按时间片） */
  volumeProfile?: VolumeBucket[];

  // -------- Sniper 配置 --------
  /** 触发价（到达后立即市价 / 限价） */
  triggerPrice?: string;
  /** 触发后下单的限价（可选） */
  sniperLimitPrice?: string;
  /** 触发方向：'gte' 价格 >= 触发；'lte' 价格 <= 触发 */
  triggerDirection?: 'gte' | 'lte';
  /** Sniper 是否已触发 */
  triggered: boolean;

  // -------- TrailingStop 配置 --------
  /** 激活价（价格触及后才开始追踪） */
  activationPrice?: string;
  /** 追踪过程中记录的最高 / 最低价 */
  peakPrice?: string;
  /** 回调率 0.005 = 0.5% */
  callbackRate?: number;
  /** TrailingStop 触发的方向 */
  trailingSide?: 'long' | 'short';

  // -------- TWAP-Stop 配置 --------
  /** 紧急止损价（price <= stopLoss 时立即市价清仓） */
  stopLossPrice?: string;
  /** 紧急止盈价 */
  takeProfitPrice?: string;

  // -------- 统计 --------
  childOrders: string[]; // 子单 ID 列表
  filledCount: number;
  totalCount: number;
  /** 启动时市场价（基准价） */
  startPrice: string;
  /** 结束 / 触发时的市场价 */
  endPrice?: string;
  /** 滑点（正数=买贵 / 卖便宜，相对 startPrice） */
  slippage: string;
  /** 结束时间戳 */
  completedAt?: number;
  errorMessage?: string;
}

/** VWAP 成交量分布桶：相对 startTime 的时间窗 */
export interface VolumeBucket {
  /** 起始时间偏移（秒，相对 startTime） */
  startOffsetSec: number;
  /** 结束时间偏移（秒，相对 startTime） */
  endOffsetSec: number;
  /** 成交量权重（0-1），所有桶权重之和=1 */
  weight: number;
}

/** 算法引擎配置 */
export interface AlgoConfig {
  /** 最大子单数 */
  maxChildOrders: number;
  /** 最小子单数量（基础币） */
  minOrderSize: string;
  /** 数量随机化 */
  randomizeSize: boolean;
  /** 时间随机化（± 10%） */
  randomizeTime: boolean;
  /** 只挂 maker（post only） */
  usePostOnly: boolean;
  /** 断网时取消母单 */
  cancelOnDisconnect: boolean;
  /** 调度器 tick 频率（ms） */
  schedulerTickMs: number;
  /** 价格轮询间隔（ms） */
  pricePollIntervalMs: number;
}

/** 价格源接口 */
export interface PriceFeed {
  /** 获取当前市价 */
  getPrice(symbol: string): string | null;
  /** 获取最新成交价（带方向） */
  getLastTradePrice?(symbol: string): { price: string; side: AlgoSide; ts: number } | null;
  /** 订阅价格变化 */
  subscribe?(symbol: string, listener: (price: string) => void): () => void;
}

/** 撮合引擎接口（OrderEngine 抽象） */
export interface OrderEngineLike {
  /** 下市价单 */
  submitMarketOrder(params: {
    userId: string;
    symbol: string;
    side: AlgoSide;
    quantity: string;
  }): {
    orderId: string;
    filledQuantity: string;
    avgPrice: string;
    status: 'filled' | 'partial' | 'rejected';
    errorMessage?: string;
  };
  /** 下限价单 */
  submitLimitOrder(params: {
    userId: string;
    symbol: string;
    side: AlgoSide;
    quantity: string;
    price: string;
    postOnly?: boolean;
  }): {
    orderId: string;
    filledQuantity: string;
    avgPrice: string;
    status: 'filled' | 'partial' | 'open' | 'rejected' | 'cancelled';
    errorMessage?: string;
  };
  /** 撤单 */
  cancelOrder?(orderId: string): boolean;
}

// ============================================================================
// 关键常量
// ============================================================================

export const ALGO_MIN_CHILD_INTERVAL_SEC = 5;
export const ALGO_MAX_CHILD_ORDERS = 1000;
export const ALGO_DEFAULT_INTERVAL_SEC = 60;
export const ALGO_PRICE_POLL_INTERVAL_MS = 1000;
export const ALGO_TRAILING_CALLBACK_DEFAULT = 0.005; // 0.5%
export const ALGO_SCHEDULER_TICK_MS = 100;

/** 默认配置 */
export const DEFAULT_ALGO_CONFIG: AlgoConfig = {
  maxChildOrders: ALGO_MAX_CHILD_ORDERS,
  minOrderSize: '0.0001',
  randomizeSize: true,
  randomizeTime: true,
  usePostOnly: false,
  cancelOnDisconnect: true,
  schedulerTickMs: ALGO_SCHEDULER_TICK_MS,
  pricePollIntervalMs: ALGO_PRICE_POLL_INTERVAL_MS,
};
