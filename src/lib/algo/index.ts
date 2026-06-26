/**
 * 算法交易系统统一导出
 *
 * 6 大经典策略：TWAP / VWAP / Iceberg / Sniper / TWAP-Stop / TrailingStop
 *
 * 核心模块：
 *   - AlgoEngine        业务层入口
 *   - AlgoScheduler     定时任务调度器
 *   - TwapStrategy      时间加权
 *   - VwapStrategy      成交量加权
 *   - IcebergStrategy   冰山单
 *   - SniperStrategy    狙击触发
 *   - TrailingStopStrategy  追踪止损
 */

export * from './types';
export * from './scheduler';
export * from './algo-engine';
export { TwapStrategy } from './strategies/twap';
export type { TwapChildSpec, TwapPlanResult } from './strategies/twap';
export { VwapStrategy } from './strategies/vwap';
export { IcebergStrategy } from './strategies/iceberg';
export { SniperStrategy } from './strategies/sniper';
export { TrailingStopStrategy } from './strategies/trailing-stop';
