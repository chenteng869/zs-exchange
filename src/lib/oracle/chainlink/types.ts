/**
 * Chainlink 预言机 - 核心类型定义
 *
 * 本文件定义：
 *  - OracleChain: 预言机支持的链（与项目 chain-service 互不耦合）
 *  - PriceFeed: 链上价格 feed 元数据
 *  - PriceRound / PriceData: 单轮价格 + 增强字段（age / isStale）
 *  - AggregatedPrice: 多链聚合后的可信价格
 *  - 若干业务辅助类型（AnomalyEvent / StalenessReport / AssetValuation 等）
 */

// =============================================================================
// 关键常量
// =============================================================================

/** 默认缓存 TTL（30 秒） */
export const ORACLE_CACHE_TTL_MS = 30_000;

/** Stale 阈值因子：超过 heartbeatSeconds * 2 即视为 stale */
export const ORACLE_STALE_THRESHOLD_FACTOR = 2;

/** 偏离报警阈值（5%） */
export const ORACLE_DEVIATION_THRESHOLD = 0.05;

/** 单批 RPC 查询最大数量 */
export const ORACLE_RPC_BATCH_SIZE = 10;

/** Chainlink AggregatorV3 ABI 编码 */
export const AGGREGATOR_V3_SELECTORS = {
  latestRoundData: '0xfeaf968c',
  getRoundData: '0x9a6fc8f5',
  decimals: '0x313ce567',
  description: '0x7284e416',
} as const;

// =============================================================================
// 链 / Feed 元数据
// =============================================================================

/** 预言机支持的链（与项目 chain-service 略有差异，独立命名避免耦合） */
export type OracleChain = 'ethereum' | 'bsc' | 'polygon' | 'arbitrum' | 'optimism' | 'avalanche' | 'base';

/** 支持的法币 */
export type FiatCurrency = 'USD' | 'CNY' | 'EUR' | 'JPY';

/** 价格 feed 元数据 */
export interface PriceFeed {
  /** 交易对，如 'ETH/USD' */
  pair: string;
  /** 合约地址（0x...） */
  address: string;
  /** 所属链 */
  chain: OracleChain;
  /** 价格精度（Chainlink 大部分为 8） */
  decimals: number;
  /** 心跳（更新频率，秒） */
  heartbeatSeconds: number;
  /** 偏离阈值（百分比） */
  deviationThreshold: number;
  /** 描述 */
  description: string;
}

// =============================================================================
// 价格数据
// =============================================================================

/** 单轮原始价格（来自 latestRoundData / getRoundData） */
export interface PriceRound {
  roundId: number;
  /** 原始 answer（已按 decimals 放大，BigInt 字符串） */
  answer: string;
  /** 还原后的人类可读价格（如 '3500.123'） */
  formatted: string;
  startedAt: number;
  updatedAt: number;
  answeredInRound: number;
}

/** 单源价格（= PriceRound + 元信息） */
export interface PriceData extends PriceRound {
  pair: string;
  chain: OracleChain;
  /** 距上次更新秒数 */
  age: number;
  /** 是否过期（> 2 × heartbeat） */
  isStale: boolean;
  /** 数据来源：chainlink = 真实链上数据；fallback = mock */
  source: 'chainlink' | 'fallback';
}

/** 多源聚合后的可信价格 */
export interface AggregatedPrice {
  pair: string;
  sources: { chain: OracleChain; price: string; updatedAt: number }[];
  /** 中位数（抗异常） */
  median: string;
  /** 算术平均 */
  mean: string;
  /** 最小值 */
  min: string;
  /** 最大值 */
  max: string;
  /** (max - min) / median 偏离度（0 ~ 1） */
  deviation: number;
  timestamp: number;
}

// =============================================================================
// 业务事件
// =============================================================================

/** 价格异常事件 */
export interface AnomalyEvent {
  pair: string;
  type: 'deviation' | 'stale' | 'outlier';
  message: string;
  /** 相关上下文 */
  context: {
    chain?: OracleChain;
    expected?: string;
    actual?: string;
    deviation?: number;
    age?: number;
  };
  timestamp: number;
}

/** Staleness 报告 */
export interface StalenessReport {
  pair: string;
  chain: OracleChain;
  age: number;
  isStale: boolean;
  updatedAt: number;
}

/** 资产估值结果 */
export interface AssetValuation {
  asset: string;
  amount: string;
  fiat: FiatCurrency;
  /** 估值字符串（保留 6 位小数） */
  value: string;
  /** 单价（USD） */
  priceUsd: string;
  /** 法币汇率（USD → fiat） */
  fiatRate: string;
  timestamp: number;
}

// =============================================================================
// 工具类型
// =============================================================================

/** 任意 fetch 实现（用于测试注入） */
export type FetchImpl = typeof fetch;

/** 价格 handler 回调 */
export type PriceHandler = (data: PriceData) => void | Promise<void>;

/** 异常 handler 回调 */
export type AnomalyHandler = (event: AnomalyEvent) => void | Promise<void>;
