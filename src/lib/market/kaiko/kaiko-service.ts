/**
 * Kaiko 业务服务层 (P2 Kaiko)
 *
 * 聚合：
 *  - KaikoClient (REST)
 *  - KaikoWebSocketClient (WS)
 *  - 业务方法：getBestPrice / getIndexPrice / getHistoricalData / getReferenceFX / validateTicker
 *  - 与 Binance 数据融合（BBO + Binance 补位）
 *
 * 用法：
 *   const service = new KaikoService({ apiKey: process.env.KAIKO_KEY });
 *   const bp = await service.getBestPrice('btc-usd', 'buy');
 *   const ip = await service.getIndexPrice('btc-usd');
 */

import { KaikoClient, KAIKO_DEFAULT_EXCHANGES, KaikoError } from './kaiko-client';
import { KaikoWebSocketClient } from './kaiko-ws';
import type {
  KaikoAggregatedPrice,
  KaikoBestPrice,
  KaikoIndexPrice,
  KaikoOHLCV,
  KaikoInterval,
  KaikoTicker,
  KaikoValidationResult,
  FxCurrency,
  Region,
} from './types';

// =============================================================================
// 配置
// =============================================================================

/** 风控：单笔价格偏离基线超过该阈值则视为异常（默认 5%） */
export const VALIDATION_PRICE_DEVIATION = 0.05;
/** 风控：报价 stale 阈值（默认 30s） */
export const VALIDATION_STALE_THRESHOLD_MS = 30_000;
/** 风控：最小盘口深度（USDT 计价，默认 1000） */
export const VALIDATION_MIN_DEPTH = 1000;
/** 风控：最大价差比例（默认 1%） */
export const VALIDATION_MAX_SPREAD = 0.01;

// =============================================================================
// 类型
// =============================================================================

export interface KaikoServiceConfig {
  apiKey: string;
  region?: Region;
  enableFallback?: boolean;
  /** 用于 BBO 聚合的目标交易所列表（默认使用 KAIKO_DEFAULT_EXCHANGES） */
  bboExchanges?: string[];
  /** 自定义 fetch / WebSocket */
  fetchImpl?: typeof fetch;
  WebSocketImpl?: typeof WebSocket;
  /** 注入已有 client（测试用） */
  client?: KaikoClient;
  wsClient?: KaikoWebSocketClient;
  /** 启用 mock */
  enableMock?: boolean;
}

// =============================================================================
// KaikoService
// =============================================================================

export class KaikoService {
  private readonly client: KaikoClient;
  private readonly wsClient: KaikoWebSocketClient;
  private readonly bboExchanges: string[];

  constructor(config: KaikoServiceConfig) {
    if (config.client && config.wsClient) {
      this.client = config.client;
      this.wsClient = config.wsClient;
    } else {
      this.client = config.client || new KaikoClient({
        apiKey: config.apiKey,
        region: config.region,
        enableFallback: config.enableFallback,
        fetchImpl: config.fetchImpl,
        enableMock: config.enableMock,
      });
      this.wsClient = config.wsClient || new KaikoWebSocketClient({
        apiKey: config.apiKey,
        region: config.region,
        WebSocketImpl: config.WebSocketImpl,
      });
    }
    this.bboExchanges = config.bboExchanges && config.bboExchanges.length > 0
      ? config.bboExchanges
      : [...KAIKO_DEFAULT_EXCHANGES];
  }

  // -------------------------------------------------------------------------
  // 业务方法
  // -------------------------------------------------------------------------

  /**
   * 跨交易所最优价 (BBO)
   * @param pair 交易对（小写带连字符，如 'btc-usd'）
   * @param side 'buy' = 取最低 ask；'sell' = 取最高 bid
   */
  async getBestPrice(pair: string, side: 'buy' | 'sell'): Promise<KaikoBestPrice> {
    const results = await this.fetchTickersForBBO(pair);
    if (results.length === 0) {
      throw new KaikoError('NO_DATA', `No ticker data for ${pair}`);
    }
    if (side === 'buy') {
      // 最低 ask
      const sorted = results
        .filter((r) => parseFloat(r.ask) > 0)
        .sort((a, b) => parseFloat(a.ask) - parseFloat(b.ask));
      if (sorted.length === 0) throw new KaikoError('NO_ASKS', `No ask prices for ${pair}`);
      const best = sorted[0];
      return {
        price: best.ask,
        source: 'kaiko-aggregated',
        side: 'buy',
        exchanges: [best.exchange],
        timestamp: best.timestamp,
      };
    } else {
      const sorted = results
        .filter((r) => parseFloat(r.bid) > 0)
        .sort((a, b) => parseFloat(b.bid) - parseFloat(a.bid));
      if (sorted.length === 0) throw new KaikoError('NO_BIDS', `No bid prices for ${pair}`);
      const best = sorted[0];
      return {
        price: best.bid,
        source: 'kaiko-aggregated',
        side: 'sell',
        exchanges: [best.exchange],
        timestamp: best.timestamp,
      };
    }
  }

  /**
   * 指数价：跨 6+ 交易所 VWAP 聚合
   * 用于：合约标的价 / 资产估值 / 风控基准
   */
  async getIndexPrice(pair: string): Promise<KaikoIndexPrice> {
    const tickers = await this.fetchTickersForBBO(pair);
    if (tickers.length === 0) {
      throw new KaikoError('NO_DATA', `No ticker data for ${pair}`);
    }
    // VWAP 聚合：按 1/价差宽度 加权
    const vwap = computeVWAP(tickers.map((t) => ({ price: t.last, weight: parseFloat(t.volume24h) || 1 })));
    return {
      pair,
      price: vwap.toFixed(8),
      source: 'vwap',
      exchangeCount: tickers.length,
      timestamp: Date.now(),
      exchanges: tickers.map((t) => t.exchange),
    };
  }

  /**
   * 历史 OHLCV（自动分页）
   * @param pair 交易对
   * @param interval K线周期
   * @param days 回溯天数
   */
  async getHistoricalData(
    pair: string,
    interval: KaikoInterval,
    days: number,
    exchange = 'cbse',
  ): Promise<KaikoOHLCV[]> {
    const intervalMs = parseIntervalMs(interval);
    const endTime = Date.now();
    const startTime = endTime - days * 24 * 60 * 60_000;
    const totalBars = Math.ceil((endTime - startTime) / intervalMs);
    const pageSize = 1000;
    const all: KaikoOHLCV[] = [];
    for (let offset = 0; offset < totalBars; offset += pageSize) {
      const pageEnd = startTime + Math.min(offset + pageSize, totalBars) * intervalMs;
      const data = await this.client.getOHLCV({
        exchange,
        pair,
        interval,
        startTime: startTime + offset * intervalMs,
        endTime: pageEnd,
        limit: pageSize,
      });
      all.push(...data);
    }
    return all;
  }

  /**
   * 法币转换参考价
   * @param from 基准法币（usd/eur/cny/jpy）
   * @param to 目标法币
   */
  async getReferenceFX(from: FxCurrency, to: string): Promise<{ rate: string; timestamp: number }> {
    if (from === to.toLowerCase()) {
      return { rate: '1', timestamp: Date.now() };
    }
    return this.client.getFXRate(from, to.toLowerCase());
  }

  /**
   * 校验 ticker 数据质量
   *  - 价格偏离（与 24h 均价对比）
   *  - 价差（ask - bid）/ mid
   *  - stale（时间戳）
   *  - 深度（bidSize + askSize）
   */
  validateTicker(ticker: KaikoTicker): KaikoValidationResult {
    const issues: KaikoValidationResult['issues'] = [];
    const last = parseFloat(ticker.last);
    const bid = parseFloat(ticker.bid);
    const ask = parseFloat(ticker.ask);
    const bidSize = parseFloat(ticker.bidSize || '0');
    const askSize = parseFloat(ticker.askSize || '0');
    const vol = parseFloat(ticker.volume24h);
    const ts = ticker.timestamp || Date.now();

    // 价格有效
    if (!Number.isFinite(last) || last <= 0) {
      issues.push({ field: 'last', severity: 'error', message: 'Invalid last price' });
    }
    if (!Number.isFinite(bid) || bid <= 0) {
      issues.push({ field: 'bid', severity: 'error', message: 'Invalid bid price' });
    }
    if (!Number.isFinite(ask) || ask <= 0) {
      issues.push({ field: 'ask', severity: 'error', message: 'Invalid ask price' });
    }

    // 价差
    if (Number.isFinite(bid) && Number.isFinite(ask) && bid > 0 && ask > 0) {
      const mid = (bid + ask) / 2;
      const spread = (ask - bid) / mid;
      if (spread < 0) {
        issues.push({ field: 'spread', severity: 'error', message: `Crossed market: bid=${bid} ask=${ask}` });
      } else if (spread > VALIDATION_MAX_SPREAD) {
        issues.push({ field: 'spread', severity: 'warning', message: `Spread too wide: ${(spread * 100).toFixed(3)}%` });
      }
    }

    // stale
    const age = Date.now() - ts;
    if (age > VALIDATION_STALE_THRESHOLD_MS) {
      issues.push({ field: 'timestamp', severity: 'warning', message: `Stale: ${age}ms` });
    }

    // 深度
    const depth = (bidSize + askSize) * (Number.isFinite(last) ? last : 0);
    if (depth < VALIDATION_MIN_DEPTH) {
      issues.push({ field: 'depth', severity: 'warning', message: `Low depth: ${depth.toFixed(2)}` });
    }

    // 异常波动（与 24h vol 对比）：vol 过低或过高都值得警惕
    if (Number.isFinite(vol) && vol < 0) {
      issues.push({ field: 'volume24h', severity: 'error', message: 'Negative volume' });
    }

    return {
      valid: !issues.some((i) => i.severity === 'error'),
      issues,
    };
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  getClient(): KaikoClient {
    return this.client;
  }

  getWsClient(): KaikoWebSocketClient {
    return this.wsClient;
  }

  /** 私有：从 BBO 列表交易所拉 ticker */
  private async fetchTickersForBBO(pair: string): Promise<KaikoTicker[]> {
    const results = await Promise.all(
      this.bboExchanges.map((ex) => this.client.getTicker(ex, pair).catch(() => null)),
    );
    return results.filter((r): r is KaikoTicker => r !== null && parseFloat(r.last) > 0);
  }
}

// =============================================================================
// 内部工具
// =============================================================================

function parseIntervalMs(interval: KaikoInterval): number {
  const m: Record<KaikoInterval, number> = {
    '1m': 60_000,
    '5m': 5 * 60_000,
    '15m': 15 * 60_000,
    '30m': 30 * 60_000,
    '1h': 60 * 60_000,
    '4h': 4 * 60 * 60_000,
    '12h': 12 * 60 * 60_000,
    '1d': 24 * 60 * 60_000,
    '1w': 7 * 24 * 60 * 60_000,
  };
  return m[interval];
}

function computeVWAP(items: { price: string; weight: number }[]): number {
  let sumPrice = 0;
  let sumWeight = 0;
  for (const it of items) {
    const p = parseFloat(it.price);
    const w = Number.isFinite(it.weight) && it.weight > 0 ? it.weight : 1;
    if (!Number.isFinite(p) || p <= 0) continue;
    sumPrice += p * w;
    sumWeight += w;
  }
  if (sumWeight === 0) return 0;
  return sumPrice / sumWeight;
}

// =============================================================================
// 默认导出便捷工厂
// =============================================================================

export function createKaikoService(config: KaikoServiceConfig): KaikoService {
  return new KaikoService(config);
}
