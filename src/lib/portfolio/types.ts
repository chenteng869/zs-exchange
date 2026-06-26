/**
 * 投资组合管理系统 - 核心类型定义
 *
 * 设计原则：
 *  - 跨资产类（spot/perp/option/defi/fiat/staking/lending）统一视图
 *  - 所有金额/价格/数量均以 string 存储，复用 src/lib/matching/decimal.ts
 *  - 业务侧通过 PortfolioEngine 协作
 *
 *  模块组成：
 *  - types                 类型定义 + 关键常量
 *  - asset-aggregator      持仓汇总
 *  - risk-engine           风险指标
 *  - allocation            资产配置
 *  - rebalance             再平衡引擎
 *  - attribution           业绩归因
 *  - portfolio-engine      业务层入口
 */

/** 资产类别 */
export type AssetClass =
  | 'spot'
  | 'perp'
  | 'option'
  | 'defi'
  | 'fiat'
  | 'staking'
  | 'lending';

/** 风险偏好 */
export type RiskProfile = 'conservative' | 'balanced' | 'aggressive';

/** 资产元数据（按资产类提供附加信息） */
export interface PortfolioAssetMeta {
  /** 期权合约 ID */
  optionId?: string;
  /** 永续合约仓位 ID */
  perpPositionId?: string;
  /** DeFi 协议名（Aave / Compound / Lido / Curve...） */
  defiProtocol?: string;
  /** 到期时间戳（期权/固收） */
  maturity?: number;
  /** 行权价（期权） */
  strikePrice?: string;
  /** 杠杆（合约） */
  leverage?: number;
  /** 24h 成交量（流动性参考） */
  volume24h?: string;
}

/** 组合中的单个资产 */
export interface PortfolioAsset {
  id: string;
  userId: string;
  symbol: string;
  assetClass: AssetClass;
  quantity: string;
  avgCost: string;
  markPrice: string;
  marketValue: string;
  unrealizedPnl: string;
  unrealizedPnlPct: string;
  /** 组合权重 0-1 */
  allocation: string;
  updatedAt: number;
  meta?: PortfolioAssetMeta;
}

/** 业绩快照（用于历史） */
export interface PortfolioSnapshot {
  userId: string;
  totalValue: string;
  pnl: string;
  timestamp: number;
}

/** 完整投资组合 */
export interface Portfolio {
  userId: string;
  totalValue: string;
  totalCost: string;
  totalPnl: string;
  totalPnlPct: string;
  dailyPnl: string;
  weeklyPnl: string;
  monthlyPnl: string;
  yearlyPnl: string;
  cash: string;
  assets: PortfolioAsset[];
  byAssetClass: Record<AssetClass, { value: string; pct: string }>;
  bySymbol: Record<string, PortfolioAsset>;
  riskMetrics: PortfolioRiskMetrics;
  updatedAt: number;
}

/** 风险指标 */
export interface PortfolioRiskMetrics {
  // 总风险
  /** 年化波动率 */
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;

  // 风险价值
  /** 95% VaR（损失为正） */
  var95: number;
  /** 99% VaR */
  var99: number;
  /** 95% 条件 VaR */
  cvar95: number;
  /** 最大回撤（绝对值） */
  maxDrawdown: number;
  /** 当前回撤（绝对值） */
  currentDrawdown: number;

  // 风险分散
  /** HHI 指数 0-1 */
  concentration: number;
  /** 有效资产数 = 1/HHI */
  effectiveAssets: number;
  /** 相对 BTC 的 β */
  beta: number;
  /** 与 BTC 相关性 */
  correlation: number;

  // 杠杆
  grossLeverage: number;
  netLeverage: number;

  // 流动性
  /** 0-100，越高越流动 */
  liquidityScore: number;
  /** 非流动资产占比 0-1 */
  illiquidPct: string;
}

/** 资产配置目标 */
export interface AllocationTarget {
  symbol: string;
  assetClass: AssetClass;
  /** 目标权重 0-1 */
  targetWeight: string;
  minWeight?: string;
  maxWeight?: string;
  /** 风险预算（方差贡献占比） 0-1 */
  riskBudget?: string;
}

/** 再平衡交易 */
export interface RebalanceTrade {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: string;
  estimatedValue: string;
  /** 1-10，越大越优先 */
  priority: number;
  reason: string;
}

/** 再平衡计划 */
export interface RebalancePlan {
  id: string;
  userId: string;
  strategy: 'periodic' | 'threshold' | 'risk_parity';
  /** 触发条件 ['drift > 5%', 'monthly'] */
  triggers: string[];
  currentAllocations: Record<string, string>;
  targetAllocations: Record<string, string>;
  trades: RebalanceTrade[];
  expectedCost: string;
  /** 期望风险下降或夏普提升（百分比） */
  expectedImprovement: string;
  createdAt: number;
  executedAt?: number;
  status: 'draft' | 'pending' | 'executed' | 'cancelled';
}

/** 业绩归因 */
export interface PerformanceAttribution {
  period: { start: number; end: number };
  /** 组合总收益（绝对值） */
  totalReturn: string;
  /** 基准收益 */
  benchmarkReturn: string;
  /** 超额收益 */
  excessReturn: string;
  /** 资产配置效应 */
  allocationEffect: string;
  /** 选股效应 */
  selectionEffect: string;
  /** 交互效应 */
  interactionEffect: string;
  /** 因子收益 momentum: 0.05 */
  factorReturns: Record<string, string>;
  /** 各资产贡献 symbol: 0.03 */
  contribution: Record<string, string>;
}

/** 回测结果 */
export interface BacktestResult {
  userId: string;
  period: { start: number; end: number };
  initialValue: string;
  finalValue: string;
  totalReturn: string;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  /** 每日组合价值 */
  equityCurve: { time: number; value: string }[];
  trades: { time: number; symbol: string; side: 'buy' | 'sell'; quantity: string; price: string }[];
}

/** 投资组合报告 */
export interface PortfolioReport {
  userId: string;
  generatedAt: number;
  period: { start: number; end: number };
  portfolio: Portfolio;
  riskMetrics: PortfolioRiskMetrics;
  attribution: PerformanceAttribution;
  rebalanceSuggestion?: RebalancePlan;
  summary: {
    totalReturn: string;
    riskLevel: 'low' | 'medium' | 'high';
    concentrationRisk: boolean;
    rebalanceNeeded: boolean;
  };
}

// ============================================================================
// 关键常量
// ============================================================================

/** 无风险利率（年化） */
export const RISK_FREE_RATE = 0.03;

/** 加密币交易日数（一年） */
export const TRADING_DAYS = 365;

/** 默认偏离阈值（5%） */
export const DEFAULT_DRIFT_THRESHOLD = 0.05;

/** 再平衡最小间隔天数 */
export const REBALANCE_MIN_INTERVAL_DAYS = 7;

/** 默认 VaR 置信度 */
export const VAR_DEFAULT_CONFIDENCE = 0.95;

/** 集中度警告阈值（HHI） */
export const CONCENTRATION_WARNING = 0.3;

/** 最大回撤报警阈值（20%） */
export const MAX_DRAWDOWN_ALERT = 0.2;

/** 全部资产类（用于按类汇总） */
export const ASSET_CLASSES: AssetClass[] = [
  'spot',
  'perp',
  'option',
  'defi',
  'fiat',
  'staking',
  'lending',
];

/** 风险偏好默认权重模板（conservative） */
export const CONSERVATIVE_TEMPLATE: Record<string, string> = {
  BTC: '0.2',
  ETH: '0.15',
  USDC: '0.5',
  USDT: '0.15',
};

/** 风险偏好默认权重模板（balanced） */
export const BALANCED_TEMPLATE: Record<string, string> = {
  BTC: '0.35',
  ETH: '0.25',
  USDC: '0.2',
  SOL: '0.1',
  USDT: '0.1',
};

/** 风险偏好默认权重模板（aggressive） */
export const AGGRESSIVE_TEMPLATE: Record<string, string> = {
  BTC: '0.4',
  ETH: '0.3',
  SOL: '0.15',
  BNB: '0.1',
  USDC: '0.05',
};
