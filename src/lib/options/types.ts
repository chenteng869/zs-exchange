/**
 * 期权交易系统 - 核心类型定义
 *
 * 期权 = 未来某时间以特定价格（行权价 K）买入/卖出资产的权利（非义务）
 * - Call（看涨）: 买权
 * - Put （看跌）: 卖权
 * - European:  仅到期日可行权
 * - American:  到期日前任意时间
 *
 * 标的：加密币（BTC/ETH 等），计价单位 USDT。
 */

// =============================================================================
// 枚举
// =============================================================================

export type OptionType = 'call' | 'put';
export type ExerciseStyle = 'european' | 'american';
export type OptionStatus = 'active' | 'expired' | 'exercised' | 'assigned';

// =============================================================================
// 期权合约
// =============================================================================

export interface Option {
  id: string;                  // 例 'BTC-2026-06-27-70000-C'
  underlying: string;          // 'BTC'
  quoteAsset: string;          // 'USDT'
  optionType: OptionType;
  exerciseStyle: ExerciseStyle;
  strikePrice: string;         // 行权价
  expirationTime: number;      // 到期时间戳 (ms)
  contractSize: string;        // 每张合约对应的标的数量
  settlementType: 'physical' | 'cash';
  status: OptionStatus;
  listedAt: number;            // 上市时间
}

// =============================================================================
// 行情
// =============================================================================

export interface OptionTicker {
  optionId: string;
  lastPrice: string;
  bidPrice: string;
  askPrice: string;
  markPrice: string;          // 理论价（BSM）
  iv: string;                 // 隐含波动率（年化）
  underlyingPrice: string;
  volume24h: string;
  openInterest: string;
  change24h: string;
}

// =============================================================================
// 订单
// =============================================================================

export interface OptionOrder {
  id: string;
  userId: string;
  optionId: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  price?: string;
  quantity: number;           // 张数
  filledQty: number;
  avgFillPrice: string;
  status: 'pending' | 'open' | 'partial' | 'filled' | 'cancelled' | 'expired';
  fee: string;
  premium: string;            // 权利金 = price × qty × size
  createdAt: number;
}

// =============================================================================
// 持仓
// =============================================================================

export interface OptionPosition {
  id: string;
  userId: string;
  optionId: string;
  side: 'long' | 'short';     // long = 持权方, short = 造市方
  quantity: number;
  entryPrice: string;         // 加权平均开仓权利金
  markPrice: string;
  unrealizedPnl: string;
  delta: string;
  gamma: string;
  theta: string;
  vega: string;
  rho: string;
  margin: string;             // 卖方保证金
  createdAt: number;
  status: OptionStatus;
}

// =============================================================================
// BSM 模型
// =============================================================================

export interface Greeks {
  delta: number;              // ∂Price/∂S
  gamma: number;              // ∂Delta/∂S
  theta: number;              // 每日时间衰减
  vega: number;               // 每 1% 波动率变化
  rho: number;                // 每 1% 利率变化
}

export interface BSMInputs {
  spot: number;               // 标的现价
  strike: number;             // 行权价
  timeToExpiry: number;       // 距到期时间（年化，0-1）
  riskFreeRate: number;       // 无风险利率（年化，0.05 = 5%）
  volatility: number;         // 隐含波动率（年化，0.6 = 60%）
  dividendYield?: number;     // 连续股息率（加密币 = 0）
}

// =============================================================================
// 期权链
// =============================================================================

export interface OptionChain {
  underlying: string;
  expirationTime: number;
  calls: OptionTicker[];
  puts: OptionTicker[];
  spotPrice: string;
  iv: string;                 // ATM IV
}

// =============================================================================
// 结算
// =============================================================================

export interface Settlement {
  id: string;
  optionId: string;
  userId: string;
  quantity: number;
  settlementType: 'physical' | 'cash';
  payoff: string;             // 行权收益（绝对值，不含权利金）
  settlementPrice: string;    // 到期结算价
  timestamp: number;
}

// =============================================================================
// 关键常量
// =============================================================================

export const RISK_FREE_RATE = 0.05;            // 5%
export const DEFAULT_IV = 0.6;                  // 60%
export const DEFAULT_CONTRACT_SIZE = '1';
export const OPTION_STRIKE_PCT_RANGE = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5];
export const OPTION_CHAIN_STEP = 0.1;
export const SHORT_MARGIN_FACTOR = 0.2;         // 20%

/** 默认到期时长（小时）：1d / 2d / 1w / 1m / 3m */
export const DEFAULT_EXPIRATIONS_HOURS = [24, 48, 168, 720, 2160];

/** BSM 参考值（用于单元测试） */
// S=100, K=100, T=1, r=0.05, σ=0.2
export const BSM_REFERENCE = {
  call: 10.4506,
  put: 5.5735,
  deltaCall: 0.6368,
  gamma: 0.0188,
  thetaCall: -0.0176,
  vega: 0.3754,
  rhoCall: 0.5323,
} as const;
