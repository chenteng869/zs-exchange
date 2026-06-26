/**
 * Kaiko 行情数据模型
 *
 * 机构级数据源，覆盖：
 *  - 实时报价（跨交易所聚合）
 *  - 历史 OHLCV（最远 2013 年 BTC）
 *  - VWAP / TWAP / 集合竞价
 *  - 跨交易所最优价（BBO）
 *  - 法币参考价（USD / EUR / CNY / JPY）
 *
 * API 文档：https://docs.kaiko.com
 */

export type AssetClass = 'crypto' | 'fiat';
export type DataClass = 'spot' | 'derivative' | 'index';

export type Region = 'us' | 'eu' | 'ap' | 'global';

export type KaikoInterval =
  | '1m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '4h'
  | '12h'
  | '1d'
  | '1w';

export type VwapWindow = '1m' | '5m' | '15m' | '1h' | '1d';

export type FxCurrency = 'usd' | 'eur' | 'cny' | 'jpy';

// =============================================================================
// 资产 / 交易所
// =============================================================================

export interface KaikoAsset {
  code: string;
  name: string;
  assetClass: AssetClass;
}

export interface KaikoExchange {
  code: string;
  name: string;
  country?: string;
}

// =============================================================================
// Ticker
// =============================================================================

export interface KaikoTicker {
  exchange: string;
  pair: string;
  bid: string;
  bidSize?: string;
  ask: string;
  askSize?: string;
  last: string;
  volume24h: string;
  timestamp: number;
}

// =============================================================================
// OHLCV
// =============================================================================

export interface KaikoOHLCV {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  count: number;
}

// =============================================================================
// VWAP
// =============================================================================

export interface KaikoVWAP {
  pair: string;
  window: VwapWindow;
  vwap: string;
  totalVolume: string;
  timestamp: number;
}

// =============================================================================
// 跨交易所聚合价
// =============================================================================

export interface KaikoAggregatedPrice {
  pair: string;
  price: string;
  source: 'bbo' | 'vwap' | 'twap' | 'last';
  exchangeCount: number;
  timestamp: number;
  deviation?: number;
}

// =============================================================================
// 订单簿
// =============================================================================

export interface KaikoOrderBookLevel {
  price: string;
  size: string;
}

export interface KaikoOrderBook {
  exchange: string;
  pair: string;
  bids: KaikoOrderBookLevel[];
  asks: KaikoOrderBookLevel[];
  timestamp: number;
}

// =============================================================================
// 成交
// =============================================================================

export interface KaikoTrade {
  id: string;
  exchange: string;
  pair: string;
  price: string;
  amount: string;
  side: 'buy' | 'sell';
  timestamp: number;
}

// =============================================================================
// FX
// =============================================================================

export interface KaikoFxRate {
  base: FxCurrency;
  quote: string;
  rate: string;
  timestamp: number;
}

// =============================================================================
// 市值
// =============================================================================

export interface KaikoMarketCap {
  symbol: string;
  cap: string;
  supply: string;
  timestamp: number;
}

// =============================================================================
// WebSocket 消息
// =============================================================================

export type KaikoWsChannel =
  | `trades.${string}.${string}`
  | `orderbook.${string}.${string}`
  | `price.${string}.${string}`
  | `price.aggregated.${string}`;

export type KaikoWsMessageType = 'trade' | 'orderbook' | 'price' | 'aggregated_price' | 'subscribe_ack' | 'error' | 'heartbeat';

export interface KaikoWsMessage {
  type: KaikoWsMessageType;
  channel?: string;
  exchange?: string;
  pair?: string;
  data?: unknown;
  timestamp?: number;
  message?: string;
}

// =============================================================================
// 业务层：跨交易所最优价 / 指数价
// =============================================================================

export interface KaikoBestPrice {
  price: string;
  source: 'kaiko-aggregated';
  side: 'buy' | 'sell';
  exchanges: string[];
  timestamp: number;
}

export interface KaikoIndexPrice extends KaikoAggregatedPrice {
  /** 参与聚合的交易所列表 */
  exchanges: string[];
}

export interface KaikoValidationIssue {
  field: string;
  severity: 'warning' | 'error';
  message: string;
}

export interface KaikoValidationResult {
  valid: boolean;
  issues: KaikoValidationIssue[];
}

// =============================================================================
// 客户端配置
// =============================================================================

export interface KaikoClientConfig {
  apiKey: string;
  /** 区域（默认 us，影响 REST/WS 端点选择） */
  region?: Region;
  /** 是否启用多区域降级 */
  enableFallback?: boolean;
  /** 请求超时（毫秒） */
  timeoutMs?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 初始退避（毫秒） */
  initialBackoffMs?: number;
  /** 最大退避（毫秒） */
  maxBackoffMs?: number;
  /** 自定义 fetch 实现（用于测试） */
  fetchImpl?: typeof fetch;
  /** 自定义 WebSocket 构造器（用于测试） */
  WebSocketImpl?: typeof WebSocket;
  /** 限流（每分钟，默认 90） */
  rateLimitPerMinute?: number;
  /** 是否启用降级 mock（API key 含 'mock' 时强制启用） */
  enableMock?: boolean;
}
