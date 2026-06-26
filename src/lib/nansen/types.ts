/**
 * Nansen 链上情报 - 类型定义
 *
 * 覆盖能力：
 *  - Smart Money 追踪
 *  - 钱包标签 (CEX / DEX / VC / Fund / Whale / Smart Money)
 *  - Token God Mode（聪明钱持仓聚合）
 *  - 大额转账监控
 *  - 实体追踪 (Binance / a16z / Galaxy)
 *  - 实时告警 + WebSocket
 */

// =============================================================================
// 基础枚举
// =============================================================================

/** 支持的链（8 链） */
export type Chain =
  | 'ethereum'
  | 'bsc'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'avalanche'
  | 'base'
  | 'solana';

/** 钱包标签分类 */
export type WalletLabel =
  | 'smart_money'
  | 'cex'
  | 'dex'
  | 'vc'
  | 'fund'
  | 'whale'
  | 'fresh_wallet'
  | 'contract'
  | 'mev_bot'
  | 'high_value';

/** 信号类型 */
export type SignalType =
  | 'buy'
  | 'sell'
  | 'accumulate'
  | 'distribute'
  | 'transfer'
  | 'mint'
  | 'burn';

/** 告警优先级 */
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

/** 告警通道 */
export type AlertChannel = 'email' | 'push' | 'sms' | 'webhook';

// =============================================================================
// 钱包 / 实体
// =============================================================================

export interface NansenAddress {
  address: string;
  chain: Chain;
  labels: WalletLabel[];
  /** 实体名称，如 'Binance' / 'a16z' */
  entity?: string;
  totalBalanceUsd: string;
  firstSeen: number;
  lastActive: number;
  txCount: number;
  /** 0-100 风险分（高 = 高风险） */
  riskScore: number;
  isContract: boolean;
}

export interface NansenAddressLabels {
  address: string;
  chain: Chain;
  labels: WalletLabel[];
  entity?: string;
}

// =============================================================================
// Smart Money 信号 / 持仓
// =============================================================================

export interface SmartMoneySignal {
  id: string;
  chain: Chain;
  walletAddress: string;
  signalType: SignalType;
  token: {
    symbol: string;
    address: string;
    decimals: number;
  };
  /** token 数量（最小单位） */
  amount: string;
  /** USD 等值 */
  amountUsd: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  /** 触发的规则 ID */
  triggeredRules: string[];
  /** 0-1 信心分数 */
  confidence: number;
}

export interface SmartMoneyHolding {
  walletAddress: string;
  chain: Chain;
  tokenSymbol: string;
  tokenAddress: string;
  balance: string;
  balanceUsd: string;
  costBasis: string;
  unrealizedPnl: string;
  unrealizedPnlPct: string;
  acquiredAt: number;
  holdingDays: number;
  source: 'onchain' | 'inferred';
}

// =============================================================================
// Token God Mode
// =============================================================================

export interface TokenGodMode {
  tokenSymbol: string;
  tokenAddress: string;
  chain: Chain;
  totalSmartMoneyHolders: number;
  totalSmartMoneyValue: string;
  topHolders: SmartMoneyHolding[];
  /** 24h 净流入（正 = 流入） */
  smartMoneyNetFlow24h: string;
  smartMoneyNetFlow7d: string;
  smartMoneyNetFlow30d: string;
  /** HHI 集中度（0-10000） */
  concentration: number;
  bySource: Record<string, { count: number; value: string }>;
  updatedAt: number;
}

// =============================================================================
// 转账 / 资金流
// =============================================================================

export interface TransferEvent {
  id: string;
  chain: Chain;
  fromAddress: string;
  toAddress: string;
  fromLabels: WalletLabel[];
  toLabels: WalletLabel[];
  tokenSymbol: string;
  tokenAddress: string;
  amount: string;
  amountUsd: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
}

export interface FlowIntelligence {
  tokenSymbol: string;
  tokenAddress: string;
  chain: Chain;
  period: '24h' | '7d' | '30d';
  /** 净流量 = 流入 - 流出（正 = 净流入） */
  netFlow: string;
  bySource: Record<string, { inflow: string; outflow: string; net: string }>;
  updatedAt: number;
}

// =============================================================================
// 告警
// =============================================================================

export type AlertType =
  | 'smart_money_buy'
  | 'smart_money_sell'
  | 'large_transfer'
  | 'whale_movement'
  | 'token_unlock'
  | 'liquidity_change';

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  chain: Chain;
  title: string;
  description: string;
  data: Record<string, any>;
  triggeredAt: number;
  isRead: boolean;
  channels: AlertChannel[];
}

// =============================================================================
// 钱包画像 / 交易历史
// =============================================================================

export interface WalletTrade {
  txHash: string;
  chain: Chain;
  side: 'buy' | 'sell';
  tokenSymbol: string;
  tokenAddress: string;
  amount: string;
  amountUsd: string;
  priceUsd: string;
  timestamp: number;
  counterparty: string;
}

export interface WalletPnL {
  realized: string;
  unrealized: string;
  total: string;
  winRate: number;
  /** 0-1 盈利比例 */
}

export interface WalletLeaderboardEntry {
  rank: number;
  address: string;
  chain: Chain;
  entity?: string;
  metric: string;
  winRate: number;
  txCount: number;
  totalPnlUsd: string;
}

// =============================================================================
// 客户端配置
// =============================================================================

export interface NansenClientOptions {
  apiKey?: string;
  /** 自定义 baseUrl（测试用） */
  baseUrl?: string;
  /** 自定义 fetch（测试用） */
  fetchImpl?: typeof fetch;
  /** 请求超时（毫秒） */
  timeoutMs?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 初始退避（毫秒） */
  initialBackoffMs?: number;
  /** 最大退避（毫秒） */
  maxBackoffMs?: number;
  /** 是否启用演示降级（默认 true） */
  enableFallback?: boolean;
  /** 每分钟最大请求数（0 = 不限） */
  rateLimitPerMin?: number;
}

export interface SignalQueryOptions {
  chain?: Chain;
  token?: string;
  /** 起始时间（毫秒） */
  since?: number;
  /** 截止时间（毫秒） */
  until?: number;
  /** 限制条数 */
  limit?: number;
}

export interface LargeTransferQueryOptions {
  chain?: Chain;
  minUsd?: number;
  since?: number;
  limit?: number;
}

// =============================================================================
// 关键常量
// =============================================================================

export const NANSEN_API_BASE = 'https://api.nansen.ai/v1';
export const NANSEN_RATE_LIMIT_PER_MIN = 60;
export const NANSEN_WS_URL = 'wss://api.nansen.ai/v1/ws';
export const NANSEN_DEFAULT_SIGNAL_LOOKBACK_HOURS = 24;
export const NANSEN_WHALE_THRESHOLD_USD = 1_000_000;            // 1M USD
export const NANSEN_SMART_MONEY_FLOW_THRESHOLD_USD = 5_000_000; // 5M USD
export const NANSEN_DEFAULT_TIMEOUT_MS = 10_000;
export const NANSEN_DEFAULT_MAX_RETRIES = 3;
export const NANSEN_DEFAULT_INITIAL_BACKOFF_MS = 400;
export const NANSEN_DEFAULT_MAX_BACKOFF_MS = 4_000;

export const NANSEN_SUPPORTED_CHAINS: Chain[] = [
  'ethereum',
  'bsc',
  'polygon',
  'arbitrum',
  'optimism',
  'avalanche',
  'base',
  'solana',
];

/** 链标识映射（链上原生币符号） */
export const CHAIN_NATIVE_TOKEN: Record<Chain, string> = {
  ethereum: 'ETH',
  bsc: 'BNB',
  polygon: 'MATIC',
  arbitrum: 'ETH',
  optimism: 'ETH',
  avalanche: 'AVAX',
  base: 'ETH',
  solana: 'SOL',
};

// =============================================================================
// 工具
// =============================================================================

/** 是否 mock 模式（apiKey 含 'mock' 或未提供） */
export function isMockMode(apiKey?: string): boolean {
  if (!apiKey) return true;
  return /mock/i.test(apiKey);
}

/** 简单的稳定 ID 生成（SSR 安全） */
let _idCounter = 0;
export function genId(prefix: string = 'nansen'): string {
  _idCounter = (_idCounter + 1) % 1_000_000;
  const t = Date.now().toString(36);
  const c = _idCounter.toString(36).padStart(4, '0');
  const r = Math.floor(Math.random() * 0xffff).toString(36).padStart(4, '0');
  return `${prefix}_${t}${c}${r}`;
}

/** 稳定的伪 tx hash（64 hex 字符） */
export function genTxHash(seed?: string): string {
  const base = (seed ?? '') + Date.now().toString(16) + Math.random().toString(16).slice(2);
  let h = '';
  for (let i = 0; i < 64; i++) {
    h += ((base.charCodeAt(i % base.length) * (i + 1)) % 16).toString(16);
  }
  return '0x' + h;
}

/** EVM 地址校验（不区分大小写） */
export function isValidEvmAddress(addr: string): boolean {
  return typeof addr === 'string' && /^0x[0-9a-fA-F]{40}$/.test(addr);
}

/** Solana 地址校验（base58 长度 32-44） */
export function isValidSolanaAddress(addr: string): boolean {
  return typeof addr === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

/** 字符串安全加法 */
export function addStr(a: string, b: string): string {
  return (BigInt(a) + BigInt(b)).toString();
}

/** 字符串安全减法（负数截断为 0） */
export function subStr(a: string, b: string): string {
  const r = BigInt(a) - BigInt(b);
  return r < 0n ? '0' : r.toString();
}

/** 数值加法 */
export function addNum(a: number, b: number): number {
  return Math.round((a + b) * 1e8) / 1e8;
}

/** 数值减法 */
export function subNum(a: number, b: number): number {
  return Math.round((a - b) * 1e8) / 1e8;
}
