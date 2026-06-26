/**
 * DeFi 收益聚合器 - 类型定义
 *
 * 涵盖：
 *  - 多协议池子元数据（Lido / Aave / Compound / Curve / Convex / Yearn / Beefy / Uniswap / PancakeSwap）
 *  - 用户仓位（YieldPosition）
 *  - 操作记录（YieldAction）
 *  - 风险评估（RiskMetrics）
 *  - 收益比较（YieldComparison）
 *  - 收益统计（YieldStats）
 */

import type { ID } from '@/types/models';

// =============================================================================
// 协议 / 风险 / 操作类型
// =============================================================================

/** 支持的收益协议 */
export type YieldProtocol =
  | 'LIDO'
  | 'AAVE'
  | 'COMPOUND'
  | 'CURVE'
  | 'CONVEX'
  | 'YEARN'
  | 'BEEFY'
  | 'UNISWAP'
  | 'PANCAKESWAP';

/** 风险分层 */
export type RiskTier = 'low' | 'medium' | 'high' | 'very_high';

/** 操作类型 */
export type ActionType = 'stake' | 'unstake' | 'claim' | 'compound' | 'migrate';

// =============================================================================
// 池子 / 仓位 / 动作
// =============================================================================

export interface YieldPool {
  protocol: YieldProtocol;
  /** 池子展示名（如 'Lido stETH'） */
  name: string;
  /** 池子代币符号（如 'stETH'） */
  symbol: string;
  /** 底层资产（如 'ETH'） */
  underlyingAsset: string;
  /** 链名称（如 'ethereum' / 'bsc' / 'polygon'） */
  chain: string;
  /** 总年化（含奖励），0.045 = 4.5% */
  apy: number;
  /** 基础年化（来自协议本身） */
  apyBase: number;
  /** 奖励代币年化（如 LDO / CRV） */
  apyReward: number;
  /** 池子总锁仓量（USD 字符串） */
  tvl: string;
  riskTier: RiskTier;
  /** 审计评分 0-100 */
  auditScore: number;
  /** 是否稳定币池 */
  isStable: boolean;
  /** 锁仓天数（0 = 活期） */
  lockupDays: number;
  /** 合约地址 */
  contractAddress: string;
  /** 奖励代币符号列表 */
  rewardTokens: string[];
  meta: {
    /** DefiLlama poolId */
    poolId?: string;
    /** LP 池中的代币列表 */
    lpTokens?: string[];
    /** CoinGecko ID */
    coingeckoId?: string;
  };
}

export interface YieldPosition {
  id: ID;
  userId: ID;
  protocol: YieldProtocol;
  pool: YieldPool;
  /** 存入本金（字符串） */
  depositedAmount: string;
  /** 池子份额（字符串） */
  share: string;
  /** 当前价值（字符串） */
  currentValue: string;
  /** 累计收益（字符串） */
  earnedAmount: string;
  /** 当前 APY */
  apy: number;
  /** 入仓时间戳（ms） */
  entryTime: number;
  /** 上次复投时间戳（ms） */
  lastCompoundTime: number;
  /** 是否启用自动复投 */
  autoCompound: boolean;
  riskTier: RiskTier;
  status: 'active' | 'pending' | 'withdrawing' | 'closed';
  /** 待领取收益（字符串） */
  pendingRewards: string;
  /** 待处理交易的 hash */
  pendingTxHash?: string;
}

export interface YieldAction {
  id: ID;
  userId: ID;
  positionId: ID;
  type: ActionType;
  protocol: YieldProtocol;
  /** 金额（字符串） */
  amount: string;
  /** 链上交易 hash */
  txHash?: string;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  /** 创建时间戳（ms） */
  createdAt: number;
  /** 确认时间戳（ms） */
  confirmedAt?: number;
  error?: string;
}

export interface YieldComparison {
  asset: string;
  pools: YieldPool[];
  best: YieldPool;
  /** 最高 - 最低 APY */
  spread: number;
  /** 平均 APY */
  average: number;
  recommendations: string[];
}

export interface RiskMetrics {
  protocol: YieldProtocol;
  /** 智能合约风险 0-100（越高越危险） */
  smartContractRisk: number;
  /** 流动性风险 0-100 */
  liquidityRisk: number;
  /** 中心化风险 0-100 */
  centralizationRisk: number;
  /** 预言机风险 0-100 */
  oracleRisk: number;
  /** 无常损失风险 0-100 */
  impermanentLossRisk: number;
  /** 历史被攻击次数 */
  historicalHacks: number;
  /** 审计机构列表 */
  auditFirms: string[];
  /** 7 日 TVL 变化（百分比字符串） */
  tvlChange7d: string;
  /** 总体风险评分 0-100（越高越危险） */
  overallScore: number;
}

export interface YieldStats {
  userId: ID;
  totalDeposited: string;
  totalValue: string;
  totalEarned: string;
  averageApy: number;
  byProtocol: Record<
    YieldProtocol,
    { deposited: string; value: string; earned: string; apy: number }
  >;
  riskDistribution: Record<RiskTier, { value: string; pct: string }>;
  dailyEarnings: string;
  projectedYearly: string;
}

// =============================================================================
// 推荐 / 重平衡返回
// =============================================================================

export interface YieldRecommendation {
  protocol: YieldProtocol;
  pool: YieldPool;
  expectedApy: number;
  reason: string;
}

export interface RebalanceAction {
  fromPositionId?: ID;
  toProtocol: YieldProtocol;
  toPoolSymbol: string;
  amount: string;
  reason: string;
}

// =============================================================================
// 关键常量
// =============================================================================

/** 自动复投：收益 > $1 才触发 */
export const COMPOUND_MIN_THRESHOLD_USD = 1;
/** 自动复投：两次复投至少间隔 24h */
export const COMPOUND_MIN_INTERVAL_MS = 24 * 3600_000;
/** 自动复投：gas 价上限（Gwei） */
export const COMPOUND_GAS_PRICE_MAX_GWEI = 50;
/** 池子扫描缓存 5 min */
export const YIELD_SCAN_CACHE_TTL_MS = 5 * 60_000;
/** 风险分层阈值（overallScore 越低越安全） */
export const RISK_LOW_MAX_SCORE = 30;
export const RISK_MEDIUM_MAX_SCORE = 60;
export const RISK_HIGH_MAX_SCORE = 80;

/** 各协议基础风险评分（0-100，越低越安全） */
export const PROTOCOL_RISK_SCORES: Record<YieldProtocol, number> = {
  LIDO: 20,
  AAVE: 25,
  COMPOUND: 25,
  CURVE: 45,
  CONVEX: 50,
  YEARN: 60,
  BEEFY: 55,
  UNISWAP: 70,
  PANCAKESWAP: 75,
};

/** 风险分层辅助函数 */
export function scoreToRiskTier(score: number): RiskTier {
  if (score <= RISK_LOW_MAX_SCORE) return 'low';
  if (score <= RISK_MEDIUM_MAX_SCORE) return 'medium';
  if (score <= RISK_HIGH_MAX_SCORE) return 'high';
  return 'very_high';
}

/** 生成随机 ID（演示用） */
export function makeYieldId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
