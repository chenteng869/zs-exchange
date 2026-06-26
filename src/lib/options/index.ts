/**
 * 期权交易系统 - 统一导出
 *
 * 模块构成：
 *  - types.ts             类型与常量
 *  - bsm.ts               Black-Scholes-Merton 定价 / Greeks / IV 反推
 *  - option-chain.ts      期权链管理（生成 / 查询）
 *  - settlement-engine.ts 行权 / 现金 / 实物结算 / 自动行权
 *  - options-engine.ts    订单 / 持仓 / PnL / 组合 Greeks / 保证金
 *
 * 使用示例：
 *   import { OptionsEngine, OptionChainService, SettlementEngine, BlackScholes } from '@/lib/options';
 *   const chain = new OptionChainService();
 *   const settler = new SettlementEngine();
 *   const engine = new OptionsEngine(chain, settler);
 */

export * from './types';
export { BlackScholes, erf, normalCDF, normalPDF } from './bsm';
export { OptionChainService, buildOptionId } from './option-chain';
export { SettlementEngine } from './settlement-engine';
export { OptionsEngine } from './options-engine';
export type { PlaceOrderInput } from './options-engine';
