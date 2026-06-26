/**
 * 共享库（shared library）
 *
 *  H5 移动端 + 后台 admin 共用的：
 *   - K 线生成（candles.ts）
 *   - 绩效指标公式（metrics.ts）
 *   - 格式化工具（format.ts）
 *
 *  用法：
 *    import { genCandlesByPeriod, sma, computeMetrics, fmtPrice } from '@/lib/shared';
 */

export * from './candles';
export * from './metrics';
export * from './format';
