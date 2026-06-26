/**
 * 交易统计服务（Trading Statistics Service）
 *
 * 统计维度：
 *  - 用户维度：个人交易统计、盈亏统计、手续费统计
 *  - 交易对维度：交易量、持仓量、多空比、资金费率历史
 *  - 系统维度：全平台数据、活跃度、流动性指标
 *
 * 时间粒度：
 *  - 1m / 5m / 15m / 1h / 4h / 1d / 1w / 1m
 *
 * 核心指标：
 *  - 交易量（Volume）
 *  - 交易笔数（Trade Count）
 *  - 持仓量（Open Interest）
 *  - 多空比（Long/Short Ratio）
 *  - 资金费率（Funding Rate）
 *  - 流动性深度（Order Book Depth）
 *  - 用户盈亏（PnL）
 *  - 手续费收入（Fee Revenue）
 */

import {
  decAdd,
  decCmp,
  decDiv,
  decIsZero,
  decMul,
  decSub,
  decTruncate,
  decMax,
  decMin,
} from '@/lib/matching/decimal';
import { logger } from '@/lib/logger';

// ============================================================================
// 类型定义
// ============================================================================

/** 时间周期 */
export type TimeInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1mon';

/** K线数据点 */
export interface KlinePoint {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  quoteVolume: string;
  trades: number;
}

/** 交易对统计 */
export interface SymbolStats {
  symbol: string;
  /** 24h 开盘价 */
  open24h: string;
  /** 24h 最高价 */
  high24h: string;
  /** 24h 最低价 */
  low24h: string;
  /** 当前价 */
  lastPrice: string;
  /** 24h 涨跌幅 */
  change24h: string;
  /** 24h 涨幅百分比 */
  changePercent24h: string;
  /** 24h 成交量（币） */
  volume24h: string;
  /** 24h 成交额（USDT） */
  quoteVolume24h: string;
  /** 24h 成交笔数 */
  trades24h: number;
  /** 持仓量 */
  openInterest: string;
  /** 持仓价值 */
  openInterestValue: string;
  /** 多空比 */
  longShortRatio: number;
  /** 资金费率 */
  fundingRate: string;
  /** 下次资金费时间 */
  nextFundingTime: number;
  /** 买一价 */
  bestBid: string;
  /** 卖一价 */
  bestAsk: string;
  /** 买一量 */
  bestBidQty: string;
  /** 卖一量 */
  bestAskQty: string;
  /** 更新时间 */
  updatedAt: number;
}

/** 用户交易统计 */
export interface UserTradeStats {
  userId: string;
  /** 总交易笔数 */
  totalTrades: number;
  /** 总成交量（USDT） */
  totalVolume: string;
  /** 总手续费 */
  totalFees: string;
  /** 总已实现盈亏 */
  totalRealizedPnl: string;
  /** 总未实现盈亏 */
  totalUnrealizedPnl: string;
  /** 总盈亏 */
  totalPnl: string;
  /** 胜率 */
  winRate: number;
  /** 盈利交易数 */
  winningTrades: number;
  /** 亏损交易数 */
  losingTrades: number;
  /** 最大盈利 */
  maxProfit: string;
  /** 最大亏损 */
  maxLoss: string;
  /** 平均持仓时间（分钟） */
  avgHoldTimeMinutes: number;
  /** 最近 24h 交易数 */
  trades24h: number;
  /** 最近 7d 交易数 */
  trades7d: number;
  /** 最后交易时间 */
  lastTradeTime: number;
}

/** 系统级统计 */
export interface SystemStats {
  /** 活跃用户数（24h） */
  activeUsers24h: number;
  /** 总用户数 */
  totalUsers: number;
  /** 24h 总成交额 */
  totalVolume24h: string;
  /** 24h 总成交笔数 */
  totalTrades24h: number;
  /** 总持仓价值 */
  totalOpenInterestValue: string;
  /** 24h 手续费收入 */
  feeRevenue24h: string;
  /** 保险基金余额 */
  insuranceFundBalance: string;
  /** 平台总盈亏 */
  platformPnl: string;
  /** 平均撮合延迟（ms） */
  avgLatencyMs: number;
  /** 峰值 TPS */
  peakTps: number;
  /** 系统风险等级 */
  systemRiskLevel: string;
}

/** 流动性指标 */
export interface LiquidityMetrics {
  symbol: string;
  /** 买盘深度（价差 0.1%） */
  bidDepth01: string;
  /** 卖盘深度（价差 0.1%） */
  askDepth01: string;
  /** 总深度（价差 0.1%） */
  totalDepth01: string;
  /** 买盘深度（价差 1%） */
  bidDepth1: string;
  /** 卖盘深度（价差 1%） */
  askDepth1: string;
  /** 总深度（价差 1%） */
  totalDepth1: string;
  /** 买卖价差（bps） */
  spreadBps: number;
  /** 滑点估计（10万美元） */
  slippageEstimate100k: number;
  /** 滑点估计（100万美元） */
  slippageEstimate1m: number;
}

// ============================================================================
// 环形缓冲区用于K线聚合
// ============================================================================

class RingBuffer<T> {
  private readonly buffer: T[];
  private head = 0;
  private count = 0;

  constructor(private readonly capacity: number) {
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  get size(): number {
    return this.count;
  }

  toArray(): T[] {
    const result: T[] = [];
    const start = (this.head - this.count + this.capacity) % this.capacity;
    for (let i = 0; i < this.count; i++) {
      result.push(this.buffer[(start + i) % this.capacity]);
    }
    return result;
  }

  first(): T | undefined {
    if (this.count === 0) return undefined;
    const start = (this.head - this.count + this.capacity) % this.capacity;
    return this.buffer[start];
  }

  last(): T | undefined {
    if (this.count === 0) return undefined;
    return this.buffer[(this.head - 1 + this.capacity) % this.capacity];
  }

  clear(): void {
    this.head = 0;
    this.count = 0;
  }
}

// ============================================================================
// 交易统计服务
// ============================================================================

export class TradingStatisticsService {
  private readonly symbolStats = new Map<string, SymbolStats>();
  private readonly userStats = new Map<string, UserTradeStats>();

  private readonly klines = new Map<string, Map<TimeInterval, RingBuffer<KlinePoint>>>();

  private readonly tradeHistory = new Map<
    string,
    Array<{
      tradeId: string;
      price: string;
      quantity: string;
      side: 'buy' | 'sell';
      timestamp: number;
    }>
  >();

  private readonly volumeHistory = new Map<
    string,
    Array<{ timestamp: number; volume: string }>
  >();

  private systemStats: SystemStats = {
    activeUsers24h: 0,
    totalUsers: 0,
    totalVolume24h: '0',
    totalTrades24h: 0,
    totalOpenInterestValue: '0',
    feeRevenue24h: '0',
    insuranceFundBalance: '0',
    platformPnl: '0',
    avgLatencyMs: 0,
    peakTps: 0,
    systemRiskLevel: 'safe',
  };

  constructor() {
    this.initKlineBuffers();
  }

  private initKlineBuffers(): void {
    const intervals: TimeInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1mon'];
    const capacities: Record<TimeInterval, number> = {
      '1m': 1440,
      '5m': 2016,
      '15m': 2016,
      '1h': 720,
      '4h': 360,
      '1d': 365,
      '1w': 260,
      '1mon': 120,
    };

    for (const symbol of this.symbolStats.keys()) {
      const symbolKlines = new Map<TimeInterval, RingBuffer<KlinePoint>>();
      for (const interval of intervals) {
        symbolKlines.set(interval, new RingBuffer<KlinePoint>(capacities[interval]));
      }
      this.klines.set(symbol, symbolKlines);
    }
  }

  // -------------------------------------------------------------------------
  // 成交记录
  // -------------------------------------------------------------------------

  /**
   * 记录一笔成交
   */
  recordTrade(
    symbol: string,
    tradeId: string,
    price: string,
    quantity: string,
    side: 'buy' | 'sell',
    timestamp: number
  ): void {
    const history = this.tradeHistory.get(symbol) ?? [];
    history.push({ tradeId, price, quantity, side, timestamp });

    const maxHistory = 100000;
    if (history.length > maxHistory) {
      history.splice(0, history.length - maxHistory);
    }
    this.tradeHistory.set(symbol, history);

    this.updateSymbolStatsOnTrade(symbol, price, quantity, timestamp);
    this.updateKlinesOnTrade(symbol, price, quantity, timestamp);
    this.updateVolumeHistory(symbol, price, quantity, timestamp);
    this.systemStats.totalTrades24h++;
    this.systemStats.totalVolume24h = decAdd(
      this.systemStats.totalVolume24h,
      decMul(price, quantity)
    );
  }

  // -------------------------------------------------------------------------
  // 交易对统计
  // -------------------------------------------------------------------------

  private updateSymbolStatsOnTrade(
    symbol: string,
    price: string,
    quantity: string,
    timestamp: number
  ): void {
    const stats = this.getSymbolStats(symbol);
    const quoteVolume = decMul(price, quantity);

    stats.lastPrice = price;

    if (decCmp(price, stats.high24h) > 0) {
      stats.high24h = price;
    }
    if (decCmp(price, stats.low24h) < 0) {
      stats.low24h = price;
    }

    stats.volume24h = decAdd(stats.volume24h, quantity);
    stats.quoteVolume24h = decAdd(stats.quoteVolume24h, quoteVolume);
    stats.trades24h++;

    if (!decIsZero(stats.open24h)) {
      stats.change24h = decSub(price, stats.open24h);
      stats.changePercent24h = decTruncate(
        decMul(decDiv(stats.change24h, stats.open24h, 10), '100'),
        4
      );
    }

    stats.updatedAt = timestamp;
  }

  /**
   * 获取交易对统计
   */
  getSymbolStats(symbol: string): SymbolStats {
    if (!this.symbolStats.has(symbol)) {
      this.symbolStats.set(symbol, {
        symbol,
        open24h: '0',
        high24h: '0',
        low24h: '0',
        lastPrice: '0',
        change24h: '0',
        changePercent24h: '0',
        volume24h: '0',
        quoteVolume24h: '0',
        trades24h: 0,
        openInterest: '0',
        openInterestValue: '0',
        longShortRatio: 1.0,
        fundingRate: '0',
        nextFundingTime: 0,
        bestBid: '0',
        bestAsk: '0',
        bestBidQty: '0',
        bestAskQty: '0',
        updatedAt: Date.now(),
      });

      const intervals: TimeInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1mon'];
      const capacities: Record<TimeInterval, number> = {
        '1m': 1440,
        '5m': 2016,
        '15m': 2016,
        '1h': 720,
        '4h': 360,
        '1d': 365,
        '1w': 260,
        '1mon': 120,
      };
      const symbolKlines = new Map<TimeInterval, RingBuffer<KlinePoint>>();
      for (const interval of intervals) {
        symbolKlines.set(interval, new RingBuffer<KlinePoint>(capacities[interval]));
      }
      this.klines.set(symbol, symbolKlines);
    }
    return this.symbolStats.get(symbol)!;
  }

  /**
   * 更新交易对统计
   */
  updateSymbolStats(symbol: string, updates: Partial<SymbolStats>): void {
    const stats = this.getSymbolStats(symbol);
    Object.assign(stats, updates);
    stats.updatedAt = Date.now();
  }

  /**
   * 获取所有交易对统计
   */
  getAllSymbolStats(): SymbolStats[] {
    return Array.from(this.symbolStats.values());
  }

  // -------------------------------------------------------------------------
  // K线
  // -------------------------------------------------------------------------

  private updateKlinesOnTrade(
    symbol: string,
    price: string,
    quantity: string,
    timestamp: number
  ): void {
    const intervals: TimeInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1mon'];
    const symbolKlines = this.klines.get(symbol);
    if (!symbolKlines) return;

    const quoteVolume = decMul(price, quantity);

    for (const interval of intervals) {
      const buffer = symbolKlines.get(interval);
      if (!buffer) continue;

      const intervalMs = this.intervalToMs(interval);
      const klineStart = Math.floor(timestamp / intervalMs) * intervalMs;

      const last = buffer.last();

      if (!last || last.timestamp < klineStart) {
        buffer.push({
          timestamp: klineStart,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: quantity,
          quoteVolume,
          trades: 1,
        });
      } else {
        last.close = price;
        if (decCmp(price, last.high) > 0) last.high = price;
        if (decCmp(price, last.low) < 0) last.low = price;
        last.volume = decAdd(last.volume, quantity);
        last.quoteVolume = decAdd(last.quoteVolume, quoteVolume);
        last.trades++;
      }
    }
  }

  private intervalToMs(interval: TimeInterval): number {
    const map: Record<TimeInterval, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1mon': 30 * 24 * 60 * 60 * 1000,
    };
    return map[interval];
  }

  /**
   * 获取K线数据
   */
  getKlines(symbol: string, interval: TimeInterval, limit = 100): KlinePoint[] {
    const symbolKlines = this.klines.get(symbol);
    if (!symbolKlines) return [];

    const buffer = symbolKlines.get(interval);
    if (!buffer) return [];

    const all = buffer.toArray();
    return all.slice(-limit);
  }

  // -------------------------------------------------------------------------
  // 成交量历史
  // -------------------------------------------------------------------------

  private updateVolumeHistory(
    symbol: string,
    price: string,
    quantity: string,
    timestamp: number
  ): void {
    const history = this.volumeHistory.get(symbol) ?? [];
    const bucket = Math.floor(timestamp / 60000) * 60000;
    const quoteVolume = decMul(price, quantity);

    const last = history[history.length - 1];
    if (!last || last.timestamp < bucket) {
      history.push({ timestamp: bucket, volume: quoteVolume });
    } else {
      last.volume = decAdd(last.volume, quoteVolume);
    }

    const maxBuckets = 1440 * 7;
    if (history.length > maxBuckets) {
      history.splice(0, history.length - maxBuckets);
    }

    this.volumeHistory.set(symbol, history);
  }

  /**
   * 获取成交量历史（指定时间段）
   */
  getVolumeHistory(symbol: string, startTime: number, endTime: number): Array<{ timestamp: number; volume: string }> {
    const history = this.volumeHistory.get(symbol) ?? [];
    return history.filter(h => h.timestamp >= startTime && h.timestamp <= endTime);
  }

  // -------------------------------------------------------------------------
  // 用户统计
  // -------------------------------------------------------------------------

  /**
   * 获取用户交易统计
   */
  getUserStats(userId: string): UserTradeStats {
    if (!this.userStats.has(userId)) {
      this.userStats.set(userId, {
        userId,
        totalTrades: 0,
        totalVolume: '0',
        totalFees: '0',
        totalRealizedPnl: '0',
        totalUnrealizedPnl: '0',
        totalPnl: '0',
        winRate: 0,
        winningTrades: 0,
        losingTrades: 0,
        maxProfit: '0',
        maxLoss: '0',
        avgHoldTimeMinutes: 0,
        trades24h: 0,
        trades7d: 0,
        lastTradeTime: 0,
      });
    }
    return this.userStats.get(userId)!;
  }

  /**
   * 更新用户统计
   */
  updateUserStats(userId: string, updates: Partial<UserTradeStats>): void {
    const stats = this.getUserStats(userId);
    Object.assign(stats, updates);
  }

  /**
   * 记录用户成交
   */
  recordUserTrade(
    userId: string,
    volume: string,
    fee: string,
    realizedPnl: string,
    timestamp: number
  ): void {
    const stats = this.getUserStats(userId);
    stats.totalTrades++;
    stats.totalVolume = decAdd(stats.totalVolume, volume);
    stats.totalFees = decAdd(stats.totalFees, fee);
    stats.totalRealizedPnl = decAdd(stats.totalRealizedPnl, realizedPnl);
    stats.totalPnl = decAdd(stats.totalRealizedPnl, stats.totalUnrealizedPnl);
    stats.lastTradeTime = timestamp;

    if (decCmp(realizedPnl, '0') > 0) {
      stats.winningTrades++;
      if (decCmp(realizedPnl, stats.maxProfit) > 0) {
        stats.maxProfit = realizedPnl;
      }
    } else if (decCmp(realizedPnl, '0') < 0) {
      stats.losingTrades++;
      if (decCmp(realizedPnl, stats.maxLoss) < 0) {
        stats.maxLoss = realizedPnl;
      }
    }

    const total = stats.winningTrades + stats.losingTrades;
    if (total > 0) {
      stats.winRate = stats.winningTrades / total;
    }
  }

  // -------------------------------------------------------------------------
  // 系统统计
  // -------------------------------------------------------------------------

  /**
   * 获取系统统计
   */
  getSystemStats(): SystemStats {
    return { ...this.systemStats };
  }

  /**
   * 更新系统统计
   */
  updateSystemStats(updates: Partial<SystemStats>): void {
    Object.assign(this.systemStats, updates);
  }

  /**
   * 重置24h统计
   */
  reset24hStats(): void {
    this.systemStats.totalVolume24h = '0';
    this.systemStats.totalTrades24h = 0;
    this.systemStats.feeRevenue24h = '0';
    this.systemStats.activeUsers24h = 0;

    for (const stats of this.symbolStats.values()) {
      stats.open24h = stats.lastPrice;
      stats.high24h = stats.lastPrice;
      stats.low24h = stats.lastPrice;
      stats.volume24h = '0';
      stats.quoteVolume24h = '0';
      stats.trades24h = 0;
      stats.change24h = '0';
      stats.changePercent24h = '0';
    }

    logger.info('[stats] 24h stats reset');
  }

  // -------------------------------------------------------------------------
  // 排行榜
  // -------------------------------------------------------------------------

  /**
   * 获取交易对排行榜（按24h成交额）
   */
  getSymbolRanking(limit = 20): SymbolStats[] {
    return Array.from(this.symbolStats.values())
      .sort((a, b) => parseFloat(b.quoteVolume24h) - parseFloat(a.quoteVolume24h))
      .slice(0, limit);
  }

  /**
   * 获取涨幅榜
   */
  getTopGainers(limit = 10): SymbolStats[] {
    return Array.from(this.symbolStats.values())
      .sort((a, b) => parseFloat(b.changePercent24h) - parseFloat(a.changePercent24h))
      .slice(0, limit);
  }

  /**
   * 获取跌幅榜
   */
  getTopLosers(limit = 10): SymbolStats[] {
    return Array.from(this.symbolStats.values())
      .sort((a, b) => parseFloat(a.changePercent24h) - parseFloat(b.changePercent24h))
      .slice(0, limit);
  }

  // -------------------------------------------------------------------------
  // 统计汇总
  // -------------------------------------------------------------------------

  /**
   * 获取近期成交记录
   */
  getRecentTrades(symbol: string, limit = 50): Array<{
    tradeId: string;
    price: string;
    quantity: string;
    side: 'buy' | 'sell';
    timestamp: number;
  }> {
    const history = this.tradeHistory.get(symbol) ?? [];
    return history.slice(-limit).reverse();
  }

  /**
   * 计算24h高低价
   */
  calculate24hHighLow(symbol: string): { high: string; low: string } {
    const trades = this.tradeHistory.get(symbol) ?? [];
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    let high = '0';
    let low = '999999999';

    for (const t of trades) {
      if (t.timestamp < cutoff) continue;
      if (decCmp(t.price, high) > 0) high = t.price;
      if (decCmp(t.price, low) < 0) low = t.price;
    }

    return { high, low: low === '999999999' ? '0' : low };
  }
}
