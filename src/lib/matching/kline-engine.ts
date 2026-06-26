/**
 * K线引擎（K-Line Engine）
 *
 * 支持的K线周期：
 *  1m, 3m, 5m, 15m, 30m,
 *  1h, 2h, 4h, 6h, 8h, 12h,
 *  1d, 3d, 1w, 1M
 *
 * 核心功能：
 *  - 实时更新最新一根K线（tick级聚合）
 *  - 周期切换时自动计算
 *  - 历史K线数据管理（滚动窗口）
 *  - 成交量聚合
 *  - 涨跌幅计算
 *  - 多交易对支持
 *
 * 性能优化：
 *  - 每个周期独立维护一个环形缓冲区
 *  - 新tick只更新最新K线，不重算全部
 *  - 切换周期时只计算必要的聚合
 */

import {
  decAdd,
  decCmp,
  decDiv,
  decIsPositive,
  decIsZero,
  decMul,
  decSub,
  decMax,
  decMin,
  decTruncate,
} from './decimal';
import { logger } from '@/lib/logger';

// ============================================================================
// 类型
// ============================================================================

/** K线周期（秒） */
export const KLINE_INTERVALS = {
  '1m': 60,
  '3m': 180,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '2h': 7200,
  '4h': 14400,
  '6h': 21600,
  '8h': 28800,
  '12h': 43200,
  '1d': 86400,
  '3d': 259200,
  '1w': 604800,
  '1M': 2592000,
} as const;

export type KlineInterval = keyof typeof KLINE_INTERVALS;

/** K线数据 */
export interface Kline {
  /** 开盘时间（毫秒时间戳） */
  openTime: number;
  /** 收盘价 */
  open: string;
  /** 最高价 */
  high: string;
  /** 最低价 */
  low: string;
  /** 收盘价 */
  close: string;
  /** 成交量（基础币） */
  volume: string;
  /** 收盘时间（毫秒时间戳） */
  closeTime: number;
  /** 成交额（计价币） */
  quoteVolume: string;
  /** 成交笔数 */
  trades: number;
  /** 主动买入成交量 */
  takerBuyBaseVolume: string;
  /** 主动买入成交额 */
  takerBuyQuoteVolume: string;
}

/** K线引擎配置 */
export interface KlineEngineOptions {
  /** 每个周期保留的K线数量 */
  maxKlines?: number;
  /** 初始化历史数据的回调 */
  loadHistory?: (symbol: string, interval: KlineInterval, limit: number) => Promise<Kline[]>;
}

// ============================================================================
// 环形缓冲区
// ============================================================================

/**
 * 环形缓冲区，用于高效存储K线数据
 * 新数据覆盖旧数据，保持固定大小
 */
class RingBuffer<T> {
  private readonly buffer: T[];
  private start = 0;
  private count = 0;
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    const index = (this.start + this.count) % this.capacity;
    this.buffer[index] = item;

    if (this.count < this.capacity) {
      this.count++;
    } else {
      this.start = (this.start + 1) % this.capacity;
    }
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this.count) return undefined;
    return this.buffer[(this.start + index) % this.capacity];
  }

  getLast(): T | undefined {
    if (this.count === 0) return undefined;
    return this.buffer[(this.start + this.count - 1) % this.capacity];
  }

  updateLast(item: T): void {
    if (this.count === 0) {
      this.push(item);
      return;
    }
    this.buffer[(this.start + this.count - 1) % this.capacity] = item;
  }

  size(): number {
    return this.count;
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      result.push(this.buffer[(this.start + i) % this.capacity]);
    }
    return result;
  }

  clear(): void {
    this.start = 0;
    this.count = 0;
  }

  first(): T | undefined {
    if (this.count === 0) return undefined;
    return this.buffer[this.start];
  }
}

// ============================================================================
// K线引擎
// ============================================================================

export class KlineEngine {
  private readonly options: Required<KlineEngineOptions>;
  private readonly klines = new Map<string, Map<KlineInterval, RingBuffer<Kline>>>();
  private readonly lastPrices = new Map<string, string>();
  private readonly lastVolumes = new Map<string, { base: string; quote: string; trades: number }>();

  constructor(options: KlineEngineOptions = {}) {
    this.options = {
      maxKlines: options.maxKlines ?? 1000,
      loadHistory: options.loadHistory ?? (async () => []),
    };
  }

  // -------------------------------------------------------------------------
  // 工具：计算K线开盘时间
  // -------------------------------------------------------------------------

  /**
   * 计算某个时间戳所属的K线开盘时间
   */
  getKlineOpenTime(timestamp: number, interval: KlineInterval): number {
    const intervalSec = KLINE_INTERVALS[interval];
    return Math.floor(timestamp / 1000 / intervalSec) * intervalSec * 1000;
  }

  /**
   * 计算K线收盘时间
   */
  getKlineCloseTime(openTime: number, interval: KlineInterval): number {
    return openTime + KLINE_INTERVALS[interval] * 1000 - 1;
  }

  // -------------------------------------------------------------------------
  // 初始化
  // -------------------------------------------------------------------------

  /**
   * 初始化某个交易对的K线数据
   */
  async initSymbol(symbol: string, intervals: KlineInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d']): Promise<void> {
    if (!this.klines.has(symbol)) {
      this.klines.set(symbol, new Map());
    }

    const symbolKlines = this.klines.get(symbol)!;

    for (const interval of intervals) {
      if (!symbolKlines.has(interval)) {
        symbolKlines.set(interval, new RingBuffer<Kline>(this.options.maxKlines));
      }
    }

    logger.info(`[kline] initialized symbol ${symbol} with intervals: ${intervals.join(', ')}`);
  }

  // -------------------------------------------------------------------------
  // 更新K线（基于成交）
  // -------------------------------------------------------------------------

  /**
   * 提交一个成交，更新所有周期的K线
   * @param symbol 交易对
   * @param price 成交价格
   * @param quantity 成交数量
   * @param isBuyerMaker 是否是买方挂单（决定taker方向）
   * @param timestamp 成交时间戳
   */
  addTrade(
    symbol: string,
    price: string,
    quantity: string,
    isBuyerMaker: boolean,
    timestamp: number = Date.now()
  ): void {
    this.lastPrices.set(symbol, price);

    const prevVol = this.lastVolumes.get(symbol) ?? { base: '0', quote: '0', trades: 0 };
    const quoteQty = decMul(price, quantity);
    this.lastVolumes.set(symbol, {
      base: decAdd(prevVol.base, quantity),
      quote: decAdd(prevVol.quote, quoteQty),
      trades: prevVol.trades + 1,
    });

    const symbolKlines = this.klines.get(symbol);
    if (!symbolKlines) return;

    for (const [interval, buffer] of symbolKlines.entries()) {
      this.updateKline(symbol, interval, buffer, price, quantity, quoteQty, isBuyerMaker, timestamp);
    }
  }

  private updateKline(
    symbol: string,
    interval: KlineInterval,
    buffer: RingBuffer<Kline>,
    price: string,
    quantity: string,
    quoteQty: string,
    isBuyerMaker: boolean,
    timestamp: number
  ): void {
    const openTime = this.getKlineOpenTime(timestamp, interval);
    const closeTime = this.getKlineCloseTime(openTime, interval);

    const lastKline = buffer.getLast();

    if (!lastKline || lastKline.openTime !== openTime) {
      const newKline: Kline = {
        openTime,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: quantity,
        closeTime,
        quoteVolume: quoteQty,
        trades: 1,
        takerBuyBaseVolume: isBuyerMaker ? '0' : quantity,
        takerBuyQuoteVolume: isBuyerMaker ? '0' : quoteQty,
      };

      buffer.push(newKline);
      return;
    }

    lastKline.close = price;

    if (decCmp(price, lastKline.high) > 0) {
      lastKline.high = price;
    }
    if (decCmp(price, lastKline.low) < 0) {
      lastKline.low = price;
    }

    lastKline.volume = decAdd(lastKline.volume, quantity);
    lastKline.quoteVolume = decAdd(lastKline.quoteVolume, quoteQty);
    lastKline.trades += 1;

    if (!isBuyerMaker) {
      lastKline.takerBuyBaseVolume = decAdd(lastKline.takerBuyBaseVolume, quantity);
      lastKline.takerBuyQuoteVolume = decAdd(lastKline.takerBuyQuoteVolume, quoteQty);
    }

    buffer.updateLast(lastKline);
  }

  // -------------------------------------------------------------------------
  // 更新最新价（无成交时，比如标记价更新）
  // -------------------------------------------------------------------------

  /**
   * 更新最新价格（不增加成交量，用于标记价等场景）
   */
  updateLastPrice(symbol: string, price: string, timestamp: number = Date.now()): void {
    this.lastPrices.set(symbol, price);

    const symbolKlines = this.klines.get(symbol);
    if (!symbolKlines) return;

    for (const [interval, buffer] of symbolKlines.entries()) {
      const lastKline = buffer.getLast();
      if (!lastKline) continue;

      const openTime = this.getKlineOpenTime(timestamp, interval);
      if (lastKline.openTime !== openTime) continue;

      lastKline.close = price;
      if (decCmp(price, lastKline.high) > 0) {
        lastKline.high = price;
      }
      if (decCmp(price, lastKline.low) < 0) {
        lastKline.low = price;
      }

      buffer.updateLast(lastKline);
    }
  }

  // -------------------------------------------------------------------------
  // 查询
  // -------------------------------------------------------------------------

  /**
   * 获取K线数据
   */
  getKlines(symbol: string, interval: KlineInterval, limit?: number): Kline[] {
    const symbolKlines = this.klines.get(symbol);
    if (!symbolKlines) return [];

    const buffer = symbolKlines.get(interval);
    if (!buffer) return [];

    const all = buffer.toArray();
    if (limit && limit < all.length) {
      return all.slice(all.length - limit);
    }
    return all;
  }

  /**
   * 获取最新一根K线
   */
  getLastKline(symbol: string, interval: KlineInterval): Kline | undefined {
    const symbolKlines = this.klines.get(symbol);
    if (!symbolKlines) return undefined;

    const buffer = symbolKlines.get(interval);
    if (!buffer) return undefined;

    return buffer.getLast();
  }

  /**
   * 获取最新价格
   */
  getLastPrice(symbol: string): string | undefined {
    return this.lastPrices.get(symbol);
  }

  /**
   * 获取24小时涨跌幅
   * （基于最近24小时的第一根1分钟K线开盘价和最新价）
   */
  get24hTicker(symbol: string): {
    priceChange: string;
    priceChangePercent: string;
    high24h: string;
    low24h: string;
    volume24h: string;
    quoteVolume24h: string;
    lastPrice: string;
    openPrice: string;
  } | null {
    const lastPrice = this.lastPrices.get(symbol);
    if (!lastPrice) return null;

    const klines1m = this.getKlines(symbol, '1m', 1440);
    if (klines1m.length === 0) return null;

    const firstKline = klines1m[0];
    const openPrice = firstKline.open;

    let high = firstKline.high;
    let low = firstKline.low;
    let volume = firstKline.volume;
    let quoteVolume = firstKline.quoteVolume;

    for (let i = 1; i < klines1m.length; i++) {
      const k = klines1m[i];
      if (decCmp(k.high, high) > 0) high = k.high;
      if (decCmp(k.low, low) < 0) low = k.low;
      volume = decAdd(volume, k.volume);
      quoteVolume = decAdd(quoteVolume, k.quoteVolume);
    }

    const priceChange = decSub(lastPrice, openPrice);
    const priceChangePercent = decCmp(openPrice, '0') > 0
      ? decTruncate(decMul(decDiv(priceChange, openPrice, 10), '100'), 2)
      : '0';

    return {
      priceChange,
      priceChangePercent,
      high24h: high,
      low24h: low,
      volume24h: volume,
      quoteVolume24h: quoteVolume,
      lastPrice,
      openPrice,
    };
  }

  // -------------------------------------------------------------------------
  // K线聚合（小周期聚合成大周期）
  // -------------------------------------------------------------------------

  /**
   * 将小周期K线聚合成大周期K线
   */
  aggregateKlines(smallKlines: Kline[], targetInterval: KlineInterval): Kline[] {
    if (smallKlines.length === 0) return [];

    const result: Kline[] = [];
    let current: Kline | null = null;

    for (const kline of smallKlines) {
      const targetOpenTime = this.getKlineOpenTime(kline.openTime, targetInterval);

      if (!current || current.openTime !== targetOpenTime) {
        if (current) {
          result.push(current);
        }

        current = {
          openTime: targetOpenTime,
          open: kline.open,
          high: kline.high,
          low: kline.low,
          close: kline.close,
          volume: kline.volume,
          closeTime: this.getKlineCloseTime(targetOpenTime, targetInterval),
          quoteVolume: kline.quoteVolume,
          trades: kline.trades,
          takerBuyBaseVolume: kline.takerBuyBaseVolume,
          takerBuyQuoteVolume: kline.takerBuyQuoteVolume,
        };
      } else {
        current.close = kline.close;
        if (decCmp(kline.high, current.high) > 0) current.high = kline.high;
        if (decCmp(kline.low, current.low) < 0) current.low = kline.low;
        current.volume = decAdd(current.volume, kline.volume);
        current.quoteVolume = decAdd(current.quoteVolume, kline.quoteVolume);
        current.trades += kline.trades;
        current.takerBuyBaseVolume = decAdd(current.takerBuyBaseVolume, kline.takerBuyBaseVolume);
        current.takerBuyQuoteVolume = decAdd(current.takerBuyQuoteVolume, kline.takerBuyQuoteVolume);
      }
    }

    if (current) {
      result.push(current);
    }

    return result;
  }

  // -------------------------------------------------------------------------
  // 批量导入历史数据
  // -------------------------------------------------------------------------

  /**
   * 批量加载历史K线
   */
  loadHistory(symbol: string, interval: KlineInterval, klines: Kline[]): void {
    if (!this.klines.has(symbol)) {
      this.klines.set(symbol, new Map());
    }

    const symbolKlines = this.klines.get(symbol)!;

    if (!symbolKlines.has(interval)) {
      symbolKlines.set(interval, new RingBuffer<Kline>(this.options.maxKlines));
    }

    const buffer = symbolKlines.get(interval)!;
    buffer.clear();

    for (const kline of klines) {
      buffer.push(kline);
    }

    if (klines.length > 0) {
      const last = klines[klines.length - 1];
      this.lastPrices.set(symbol, last.close);
    }

    logger.info(`[kline] loaded ${klines.length} historical klines for ${symbol} ${interval}`);
  }

  // -------------------------------------------------------------------------
  // 统计
  // -------------------------------------------------------------------------

  getStats(): {
    symbols: number;
    totalIntervals: number;
    totalKlines: number;
  } {
    let totalIntervals = 0;
    let totalKlines = 0;

    for (const symbolKlines of this.klines.values()) {
      totalIntervals += symbolKlines.size;
      for (const buffer of symbolKlines.values()) {
        totalKlines += buffer.size();
      }
    }

    return {
      symbols: this.klines.size,
      totalIntervals,
      totalKlines,
    };
  }
}
