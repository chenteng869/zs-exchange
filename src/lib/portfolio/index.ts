/**
 * 投资组合管理系统（Portfolio Management）
 *
 * 跨资产类（现货/合约/期权/DeFi/法币/Staking/Lending）的统一视图、风险分析、再平衡。
 *
 * 模块组成：
 *  - types                 类型定义 + 关键常量
 *  - asset-aggregator      持仓汇总
 *  - risk-engine           风险指标（VaR/Sharpe/MaxDD/HHI）
 *  - allocation            资产配置（等权/Markowitz/风险平价/60-40）
 *  - rebalance             自动再平衡引擎
 *  - attribution           业绩归因（Brinson/因子）
 *  - portfolio-engine      业务层门面
 *
 * 典型用法：
 *
 *   import { createPortfolioEngine, makeAsset } from '@/lib/portfolio';
 *
 *   const engine = createPortfolioEngine({ autoRebalance: true });
 *
 *   engine.addAsset(makeAsset({
 *     userId: 'u1', symbol: 'BTCUSDT', assetClass: 'spot',
 *     quantity: '0.5', avgCost: '30000', markPrice: '65000',
 *   }));
 *   engine.addAsset(makeAsset({
 *     userId: 'u1', symbol: 'ETHUSDT', assetClass: 'spot',
 *     quantity: '5', avgCost: '2500', markPrice: '3500',
 *   }));
 *
 *   // 1. 设置目标权重
 *   engine.setAllocationByProfile('u1', 'balanced');
 *
 *   // 2. 查询组合视图
 *   const portfolio = engine.getPortfolio('u1');
 *   console.log(portfolio.totalValue, portfolio.totalPnl);
 *
 *   // 3. 风险指标
 *   const risk = engine.getRiskMetrics('u1');
 *   console.log(risk.sharpeRatio, risk.var95, risk.maxDrawdown);
 *
 *   // 4. 业绩归因
 *   const att = engine.getPerformance('u1', { start: 0, end: Date.now() });
 *   console.log(att.allocationEffect, att.selectionEffect);
 *
 *   // 5. 再平衡
 *   const plan = engine.rebalance('u1', 'threshold');
 *   await engine.executeRebalance(plan.id);
 *
 *   // 6. 报表
 *   const report = engine.generateReport('u1', { start: 0, end: Date.now() });
 *   console.log(report.summary);
 */

// 类型与常量
export * from './types';

// 子模块
export {
  AssetAggregator,
  makeAsset,
  createAggregator,
} from './asset-aggregator';

export {
  RiskEngine,
  createRiskEngine,
  combineReturns,
  returnsFromPrices,
} from './risk-engine';

export {
  AllocationEngine,
  createAllocationEngine,
} from './allocation';
export type { AllocationConstraints, CovMatrix } from './allocation';

export {
  RebalanceEngine,
  createRebalanceEngine,
} from './rebalance';
export type { OrderPlacer, RebalanceEngineOptions } from './rebalance';

export {
  AttributionEngine,
  createAttributionEngine,
} from './attribution';
export type { BrinsonInputs, FactorModel } from './attribution';

export {
  PortfolioEngine,
  createPortfolioEngine,
} from './portfolio-engine';
export type {
  PortfolioEngineOptions,
  PortfolioUpdateHandler,
  RebalanceTriggerHandler,
  PriceSource,
} from './portfolio-engine';
