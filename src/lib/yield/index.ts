/**
 * DeFi 收益聚合器 - 统一导出
 *
 * 模块结构：
 *  - types              类型 + 关键常量
 *  - protocols/         5 大协议适配器（Lido / Aave / Compound / Curve / Convex）
 *  - yield-scanner      跨协议池子扫描 + 比较
 *  - auto-compounder    自动复投调度
 *  - risk-assessor      风险评估
 *  - yield-engine       业务层（仓位 + 操作 + 优化）
 */

export * from './types';

// 协议适配器
export {
  LidoAdapter,
  createLidoAdapter,
  LIDO_STETH_ADDRESS,
  LIDO_TVL_FALLBACK,
  type LidoApyResult,
  type LidoStakeResult,
  type LidoUnstakeResult,
  type LidoAdapterOptions,
} from './protocols/lido';

export {
  AaveAdapter,
  createAaveAdapter,
  AAVE_V3_POOL_ADDRESS,
  type AaveAsset,
  type AaveApyResult,
  type AaveSupplyResult,
  type AaveWithdrawResult,
  type AaveClaimResult,
  type AaveAdapterOptions,
} from './protocols/aave';

export {
  CompoundAdapter,
  createCompoundAdapter,
  COMPOUND_API_BASE,
  type CompoundAsset,
  type CompoundApyResult,
  type CompoundSupplyResult,
  type CompoundWithdrawResult,
  type CompoundClaimResult,
  type CompoundAdapterOptions,
} from './protocols/compound';

export {
  CurveAdapter,
  createCurveAdapter,
  CURVE_GAUGE_3POOL,
  type CurvePoolName,
  type CurveApyResult,
  type CurveDepositResult,
  type CurveWithdrawResult,
  type CurveClaimResult,
  type CurveAdapterOptions,
} from './protocols/curve';

export {
  ConvexAdapter,
  createConvexAdapter,
  CONVEX_BOOSTER,
  type ConvexPoolName,
  type ConvexApyResult,
  type ConvexDepositResult,
  type ConvexWithdrawResult,
  type ConvexClaimResult,
  type ConvexAdapterOptions,
} from './protocols/convex';

// 扫描 / 复投 / 风险
export {
  YieldScanner,
  createYieldScanner,
  type YieldScannerOptions,
} from './yield-scanner';

export {
  AutoCompounder,
  createAutoCompounder,
  type AutoCompounderOptions,
  type CompoundTriggerInput,
  type CompoundTriggerResult,
} from './auto-compounder';

export {
  RiskAssessor,
  createRiskAssessor,
} from './risk-assessor';

// 业务主类
export {
  YieldEngine,
  createYieldEngine,
  type YieldEngineOptions,
} from './yield-engine';
