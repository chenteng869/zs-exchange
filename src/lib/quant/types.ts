/**
 * 量化策略系统 - 核心类型定义
 *
 * 包含：
 *  - 行情数据（Candle）
 *  - 交易信号（Signal）
 *  - 仓位（Position）
 *  - 回测配置与结果（BacktestConfig / BacktestResult / Trade / EquityPoint）
 *  - 绩效指标（PerformanceMetrics）
 */

// =============================================================================
// 行情
// =============================================================================

/** 标准 K 线（数字字段） */
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// =============================================================================
// 信号
// =============================================================================

/** 交易信号 */
export interface Signal {
  type: 'buy' | 'sell' | 'close';
  /** 0-1，信号强度 */
  strength: number;
  /** 触发价格 */
  price: number;
  /** 信号原因（人类可读） */
  reason: string;
  /** 信号触发时的指标快照 */
  indicators: Record<string, number>;
  /** 时间戳（ms） */
  timestamp: number;
}

// =============================================================================
// 仓位
// =============================================================================

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  quantity: number;
  entryTime: number;
  unrealizedPnl: number;
  stopLoss?: number;
  takeProfit?: number;
}

// =============================================================================
// 回测
// =============================================================================

export interface BacktestConfig {
  symbol: string;
  startTime: number;
  endTime: number;
  initialCapital: number;
  /** 0.001 = 0.1% */
  commission: number;
  /** 0.0005 = 0.05% */
  slippage: number;
  leverage: number;
  /** 策略 ID */
  strategy: string;
  /** 策略参数 */
  params: Record<string, any>;
}

export interface Trade {
  entryTime: number;
  exitTime?: number;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl: number;
  pnlPct: number;
  commission: number;
  holdingPeriod: number;
  reason: string;
}

export interface EquityPoint {
  time: number;
  equity: number;
  drawdown: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  trades: Trade[];
  equity: EquityPoint[];
  metrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  avgTrade: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
}

// =============================================================================
// 策略接口
// =============================================================================

/** 通用策略接口 */
export interface Strategy {
  /** 策略 ID */
  id: string;
  /** 策略名 */
  name: string;
  /**
   * 评估当前 K 线序列
   * @param candles 截至当前的全部 K 线（按时间升序）
   * @param index 当前 K 线索引
   * @returns 交易信号；不产生信号返回 null
   */
  evaluate(candles: Candle[], index: number): Signal | null;
}

// =============================================================================
// 组合管理
// =============================================================================

export interface RebalanceTarget {
  symbol: string;
  /** 目标权重，0-1 */
  weight: number;
}
