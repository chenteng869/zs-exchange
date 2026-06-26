/**
 * 量化策略系统（Quant Engine）
 *
 * 模块：
 *  - indicators    7 大技术指标
 *  - strategies    5 大经典策略
 *  - backtest-engine  回测引擎
 *  - live-signal   实时信号
 *  - portfolio     组合管理
 */

// 类型
export * from './types';

// 指标
export * from './indicators';

// 策略
export { TwoMAStrategy } from './strategies/two-ma';
export type { TwoMAConfig } from './strategies/two-ma';
export { MACDStrategy } from './strategies/macd-strategy';
export type { MACDStrategyConfig } from './strategies/macd-strategy';
export { GridStrategy } from './strategies/grid';
export type { GridConfig } from './strategies/grid';
export { PairTradingStrategy } from './strategies/pair-trading';
export type { PairTradingConfig } from './strategies/pair-trading';
export { BreakoutStrategy } from './strategies/breakout';
export type { BreakoutConfig } from './strategies/breakout';

// 引擎
export { BacktestEngine, createStrategy } from './backtest-engine';
export { LiveSignalEngine } from './live-signal';
export { PortfolioManager } from './portfolio';
