/**
 * 做市商系统 - 类型定义 & 常量
 *
 * 模块组成：
 *  - types        核心类型 (MarketMaker / Quote / Inventory / Stats / Rebate)
 *  - quote-engine 报价引擎 (双边挂单 / 自动调价 / 撤单)
 *  - inventory-manager 库存管理 (风险敞口 / 倾斜 / 调仓)
 *  - rebate-engine     返佣引擎 (手续费返还 / 日结 / 报表)
 *  - market-maker-engine 核心业务引擎 (做市商管理 / 报价维护 / 统计 / 排行榜)
 *
 * 设计原则：
 *  - 不引外部依赖，复用现有 matching/decimal
 *  - 金额统一用 string，避免浮点精度问题
 *  - 事件订阅采用简单回调数组（无外部依赖）
 */

// -----------------------------------------------------------------------------
// 常量
// -----------------------------------------------------------------------------

/** 最小点差 1 bp（0.01%）。 */
export const MM_MIN_SPREAD_BPS = 1;
/** 默认点差 10 bps（0.10%）。 */
export const MM_DEFAULT_SPREAD_BPS = 10;
/** 库存告警触发比例（80%）。 */
export const MM_INVENTORY_LIMIT_PCT = 0.8;
/** 最小返佣 1 USDT。 */
export const MM_REBATE_MIN = '1';
/** 报价默认过期时间 30 秒。 */
export const MM_QUOTE_EXPIRY_MS = 30_000;
/** 排行榜最大条目数。 */
export const MM_LEADERBOARD_LIMIT = 100;
/** 报价最大档位（10 档）。 */
export const MM_MAX_LEVELS = 10;
/** 单笔报价格档 0.01。 */
export const MM_LEVEL_STEP_BPS = 1;

// -----------------------------------------------------------------------------
// 做市商基础信息
// -----------------------------------------------------------------------------

export type MarketMakerTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type MarketMakerStatus = 'active' | 'suspended' | 'banned';

/**
 * 做市商账户。
 *  - id         内部 ID
 *  - name       显示名 (如 'SMY_Liquidity')
 *  - tier       等级（影响费率）
 *  - status     状态
 *  - apiKey     API 接入 key
 *  - apiSecret  API 接入 secret (简化)
 *  - makerFeeRate  挂单手续费率（可为负，负值=返佣），如 -0.0001
 *  - rebateRate    返佣率，0.0002 = 2bp
 *  - dailyVolumeTarget  日成交量目标
 *  - minSpreadBps 最小允许点差 (bps)
 *  - maxInventory 最大库存
 *  - createdAt / approvedAt 时间戳 (ms)
 */
export interface MarketMaker {
  id: string;
  name: string;
  tier: MarketMakerTier;
  status: MarketMakerStatus;
  apiKey: string;
  apiSecret: string;
  makerFeeRate: number;
  rebateRate: number;
  dailyVolumeTarget: string;
  minSpreadBps: number;
  maxInventory: string;
  createdAt: number;
  approvedAt: number;
  /** 关联交易对白名单。 */
  symbols?: string[];
  /** 暂停原因。 */
  suspendReason?: string;
}

// -----------------------------------------------------------------------------
// 报价
// -----------------------------------------------------------------------------

/**
 * 单档报价。
 *  - marketMakerId  做市商
 *  - symbol         交易对
 *  - side           bid/ask
 *  - price          报价价格
 *  - size           数量
 *  - level          档位 1-10
 *  - createdAt      时间戳 ms
 *  - expiresAt      过期时间戳 ms
 */
export interface Quote {
  marketMakerId: string;
  symbol: string;
  side: 'bid' | 'ask';
  price: string;
  size: string;
  level: number;
  createdAt: number;
  expiresAt: number;
  /** 内部 orderId（提交到撮合后回填）。 */
  orderId?: string;
}

/** 一对报价（买一/卖一）。 */
export interface QuotePair {
  bid: Quote;
  ask: Quote;
}

// -----------------------------------------------------------------------------
// 库存
// -----------------------------------------------------------------------------

/**
 * 库存快照。
 *  - baseAmount 正=多头，负=空头
 *  - skew       偏离度 (baseAmount / maxInventory) ∈ [-1, 1]
 */
export interface Inventory {
  marketMakerId: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  baseAmount: string;
  quoteAmount: string;
  midPrice: string;
  inventoryValue: string;
  targetInventory: string;
  skew: number;
  updatedAt: number;
}

// -----------------------------------------------------------------------------
// 返佣
// -----------------------------------------------------------------------------

export interface RebateRecord {
  id: string;
  marketMakerId: string;
  tradeId: string;
  symbol: string;
  side: 'bid' | 'ask';
  volume: string;
  rebate: string;
  timestamp: number;
}

// -----------------------------------------------------------------------------
// 统计
// -----------------------------------------------------------------------------

export interface MarketMakerStats {
  marketMakerId: string;
  name: string;
  tier: MarketMakerTier;
  period: { start: number; end: number };
  totalVolume: string;
  totalRebate: string;
  fillRate: number;
  avgSpread: number;
  uptime: number;
  inventoryTurnover: number;
  pnl: string;
  rank: number;
}

// -----------------------------------------------------------------------------
// 内部事件载荷
// -----------------------------------------------------------------------------

export interface InventoryAlert {
  marketMakerId: string;
  symbol: string;
  level: 'warning' | 'critical';
  message: string;
  inventory: Inventory;
  timestamp: number;
}

export interface QuoteUpdateEvent {
  marketMakerId: string;
  symbol: string;
  quotes: Quote[];
  timestamp: number;
}

export interface RebateSettlement {
  marketMakerId: string;
  period: { start: number; end: number };
  totalVolume: string;
  totalRebate: string;
  recordCount: number;
  settledAt: number;
}

// -----------------------------------------------------------------------------
// 通用工具类型
// -----------------------------------------------------------------------------

export type Unsubscribe = () => void;
