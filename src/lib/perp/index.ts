/**
 * 永续合约（USDT-M Perpetual）模块入口
 *
 *  模块组成：
 *   - types                 类型定义
 *   - contract-registry     合约注册表
 *   - margin-calculator     保证金 / 风险计算器
 *   - funding-engine        资金费率引擎
 *   - liquidation-engine    强平 / ADL 引擎
 *   - perp-engine           核心业务引擎（仓位/订单/账户/强平）
 *   - repos/                Prisma Repository 层（持久化）
 *
 *  典型用法：
 *    import { PerpEngine, globalContractRegistry } from '@/lib/perp';
 *    const engine = new PerpEngine();
 *    engine.transferIn('u1', 'USDT', '100000');
 *    const pos = engine.openPosition({
 *      userId: 'u1', symbol: 'BTCUSDT', side: 'long',
 *      quantity: '0.5', price: '30000', leverage: 20, marginMode: 'isolated',
 *    });
 *
 *  Repository 层用法：
 *    import { contractRepo, positionRepo, accountRepo } from '@/lib/perp/repos';
 *    const contract = await contractRepo.findBySymbol('BTCUSDT');
 */

export * from './types';
export * from './contract-registry';
export * from './margin-calculator';
export * from './funding-engine';
export * from './liquidation-engine';
export { PerpEngine, PerpError } from './perp-engine';

export * as repos from './repos';
export * as services from './services';

// 暴露 decimal 工具，方便测试与上层调用
export {
  decAdd,
  decSub,
  decMul,
  decDiv,
  decCmp,
  decIsZero,
  decIsPositive,
  decIsNegative,
  decAbs,
  decMax,
  decMin,
  decGte,
  decLte,
  decGt,
  decLt,
  decTruncate,
  decNormalize,
} from '@/lib/matching/decimal';
