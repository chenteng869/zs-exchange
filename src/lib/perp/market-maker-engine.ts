/**
 * 做市商引擎（Market Maker Engine）
 *
 * 核心功能：
 *  - 自动做市策略（inventory-aware market making）
 *  - 报价管理（买卖盘双向报价）
 *  - 库存管理（inventory control）
 *  - 价差动态调整
 *  - 波动率自适应
 *  - 盈亏追踪
 *
 * 做市策略：
 *  - Avellaneda-Stoikov 模型
 *  - 库存风险溢价
 *  - 动态价差计算
 *  - 订单簿深度优化
 */

import {
  decAdd,
  decCmp,
  decDiv,
  decIsPositive,
  decIsZero,
  decMul,
  decSub,
  decTruncate,
  decMax,
  decMin,
  decAbs,
} from '@/lib/matching/decimal';
import { logger } from '@/lib/logger';

// ============================================================================
// 类型定义
// ============================================================================

/** 做市商配置 */
export interface MarketMakerConfig {
  symbol: string;
  /** 做市商 ID */
  makerId: string;
  /** 基础价差（%） */
  baseSpreadBps: number;
  /** 最小价差（%） */
  minSpreadBps: number;
  /** 最大价差（%） */
  maxSpreadBps: number;
  /** 报价层级数 */
  quoteLevels: number;
  /** 每层数量 */
  levelQuantity: string;
  /** 数量递增系数 */
  quantityMultiplier: number;
  /** 间距递增系数 */
  distanceMultiplier: number;
  /** 目标库存 */
  targetInventory: string;
  /** 库存风险系数（越大越激进调整） */
  inventoryRiskFactor: number;
  /** 最大单边库存 */
  maxInventory: string;
  /** 最小单边库存 */
  minInventory: string;
  /** 波动率敏感度 */
  volatilitySensitivity: number;
  /** 订单刷新间隔（ms） */
  refreshIntervalMs: number;
  /** 启用做市 */
  enabled: boolean;
}

/** 报价 */
export interface Quote {
  side: 'buy' | 'sell';
  price: string;
  quantity: string;
  level: number;
  orderId?: string;
}

/** 做市状态 */
export interface MarketMakerState {
  symbol: string;
  makerId: string;
  /** 当前库存 */
  inventory: string;
  /** 当前买报价 */
  buyQuotes: Quote[];
  /** 当前卖报价 */
  sellQuotes: Quote[];
  /** 当前中间价 */
  midPrice: string;
  /** 当前买一价 */
  bestBid: string;
  /** 当前卖一价 */
  bestAsk: string;
  /** 实际价差（bps） */
  actualSpreadBps: number;
  /** 调整后的价差（含库存溢价） */
  adjustedSpreadBps: number;
  /** 库存偏移（相对目标） */
  inventoryOffset: string;
  /** 波动率估计 */
  volatility: number;
  /** 总成交量（做市成交） */
  totalVolume: string;
  /** 总成交笔数 */
  totalTrades: number;
  /** 已实现盈亏 */
  realizedPnl: string;
  /** 未实现盈亏 */
  unrealizedPnl: string;
  /** 总盈亏 */
  totalPnl: string;
  /** 最后刷新时间 */
  lastRefreshTime: number;
  /** 运行状态 */
  status: 'running' | 'paused' | 'stopped' | 'error';
}

/** 成交记录 */
export interface MakerTrade {
  tradeId: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: string;
  quantity: string;
  timestamp: number;
  /** 成交时的库存 */
  inventoryAfter: string;
}

// ============================================================================
// 做市商引擎
// ============================================================================

export class MarketMakerEngine {
  private readonly config: MarketMakerConfig;
  private state: MarketMakerState;

  private readonly trades: MakerTrade[] = [];
  private readonly priceHistory: Array<{ price: string; time: number }> = [];
  private readonly inventoryHistory: Array<{ inventory: string; time: number }> = [];

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: MarketMakerConfig) {
    this.config = { ...config };
    this.state = {
      symbol: config.symbol,
      makerId: config.makerId,
      inventory: '0',
      buyQuotes: [],
      sellQuotes: [],
      midPrice: '0',
      bestBid: '0',
      bestAsk: '0',
      actualSpreadBps: 0,
      adjustedSpreadBps: config.baseSpreadBps,
      inventoryOffset: '0',
      volatility: 0,
      totalVolume: '0',
      totalTrades: 0,
      realizedPnl: '0',
      unrealizedPnl: '0',
      totalPnl: '0',
      lastRefreshTime: 0,
      status: 'stopped',
    };
  }

  // -------------------------------------------------------------------------
  // 启动与停止
  // -------------------------------------------------------------------------

  start(): void {
    if (this.refreshTimer) return;
    if (!this.config.enabled) {
      this.state.status = 'stopped';
      return;
    }

    this.state.status = 'running';
    this.refreshTimer = setInterval(() => {
      this.refreshQuotes();
    }, this.config.refreshIntervalMs);

    logger.info(`[mm] market maker started: ${this.config.makerId} on ${this.config.symbol}`);
  }

  stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.state.status = 'stopped';
    this.state.buyQuotes = [];
    this.state.sellQuotes = [];
    logger.info(`[mm] market maker stopped: ${this.config.makerId}`);
  }

  pause(): void {
    this.state.status = 'paused';
  }

  resume(): void {
    if (this.config.enabled) {
      this.state.status = 'running';
    }
  }

  // -------------------------------------------------------------------------
  // 价格更新
  // -------------------------------------------------------------------------

  /**
   * 更新市场价格（用于计算中间价和波动率）
   */
  updateMarketPrice(bestBid: string, bestAsk: string): void {
    this.state.bestBid = bestBid;
    this.state.bestAsk = bestAsk;

    const mid = decDiv(decAdd(bestBid, bestAsk), '2', 10);
    this.state.midPrice = decTruncate(mid, 8);

    const spread = decSub(bestAsk, bestBid);
    this.state.actualSpreadBps = parseFloat(decDiv(spread, this.state.midPrice, 10)) * 10000;

    this.priceHistory.push({ price: this.state.midPrice, time: Date.now() });
    if (this.priceHistory.length > 1000) {
      this.priceHistory.shift();
    }

    this.estimateVolatility();
  }

  /**
   * 估计波动率（基于最近价格序列）
   */
  private estimateVolatility(): void {
    const history = this.priceHistory.slice(-100);
    if (history.length < 10) {
      this.state.volatility = 0;
      return;
    }

    const returns: number[] = [];
    for (let i = 1; i < history.length; i++) {
      const prev = parseFloat(history[i - 1].price);
      const curr = parseFloat(history[i].price);
      if (prev > 0) {
        returns.push((curr - prev) / prev);
      }
    }

    if (returns.length === 0) {
      this.state.volatility = 0;
      return;
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length;
    this.state.volatility = Math.sqrt(variance) * Math.sqrt(24 * 60 * 60);
  }

  // -------------------------------------------------------------------------
  // 报价生成（Avellaneda-Stoikov 模型）
  // -------------------------------------------------------------------------

  /**
   * 刷新报价（核心做市逻辑）
   */
  refreshQuotes(): Quote[] {
    if (this.state.status !== 'running') return [];
    if (decIsZero(this.state.midPrice)) return [];

    const midPrice = parseFloat(this.state.midPrice);
    const inventory = parseFloat(this.state.inventory);
    const targetInv = parseFloat(this.config.targetInventory);
    const vol = this.state.volatility;

    const baseSpread = this.config.baseSpreadBps / 10000;
    const volAdjustment = 1 + vol * this.config.volatilitySensitivity;
    const adjustedSpread = Math.min(
      Math.max(baseSpread * volAdjustment, this.config.minSpreadBps / 10000),
      this.config.maxSpreadBps / 10000
    );

    this.state.adjustedSpreadBps = adjustedSpread * 10000;

    const inventorySkew =
      ((targetInv - inventory) / Math.max(Math.abs(targetInv), 1)) *
      this.config.inventoryRiskFactor *
      adjustedSpread;

    const reservationPrice = midPrice * (1 + inventorySkew);

    const buyQuotes: Quote[] = [];
    const sellQuotes: Quote[] = [];

    for (let level = 0; level < this.config.quoteLevels; level++) {
      const distanceFactor = 1 + level * this.config.distanceMultiplier;
      const levelSpread = adjustedSpread * distanceFactor * 0.5;

      const buyPrice = reservationPrice * (1 - levelSpread);
      const sellPrice = reservationPrice * (1 + levelSpread);

      const qtyFactor = Math.pow(this.config.quantityMultiplier, level);
      const levelQty = decTruncate(
        decMul(this.config.levelQuantity, String(qtyFactor)),
        6
      );

      buyQuotes.push({
        side: 'buy',
        price: decTruncate(String(buyPrice), 6),
        quantity: levelQty,
        level,
      });

      sellQuotes.push({
        side: 'sell',
        price: decTruncate(String(sellPrice), 6),
        quantity: levelQty,
        level,
      });
    }

    this.enforceInventoryLimits(buyQuotes, sellQuotes);

    this.state.buyQuotes = buyQuotes;
    this.state.sellQuotes = sellQuotes;
    this.state.lastRefreshTime = Date.now();

    return [...buyQuotes, ...sellQuotes];
  }

  /**
   * 根据库存限制调整报价数量
   */
  private enforceInventoryLimits(buyQuotes: Quote[], sellQuotes: Quote[]): void {
    const inventory = parseFloat(this.state.inventory);
    const maxInv = parseFloat(this.config.maxInventory);
    const minInv = parseFloat(this.config.minInventory);

    if (inventory >= maxInv) {
      for (const q of buyQuotes) {
        q.quantity = '0';
      }
    } else {
      const remainingRoom = maxInv - inventory;
      let remaining = remainingRoom;
      for (const q of buyQuotes) {
        const qty = parseFloat(q.quantity);
        if (qty > remaining) {
          q.quantity = String(remaining);
          remaining = 0;
        } else {
          remaining -= qty;
        }
      }
    }

    if (inventory <= minInv) {
      for (const q of sellQuotes) {
        q.quantity = '0';
      }
    } else {
      let remaining = inventory - minInv;
      for (const q of sellQuotes) {
        const qty = parseFloat(q.quantity);
        if (qty > remaining) {
          q.quantity = String(remaining);
          remaining = 0;
        } else {
          remaining -= qty;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 成交处理
  // -------------------------------------------------------------------------

  /**
   * 处理一笔成交
   */
  onTrade(trade: Omit<MakerTrade, 'inventoryAfter'>): MakerTrade {
    const tradeWithInv: MakerTrade = {
      ...trade,
      inventoryAfter: this.state.inventory,
    };

    if (trade.side === 'buy') {
      this.state.inventory = decAdd(this.state.inventory, trade.quantity);
    } else {
      this.state.inventory = decSub(this.state.inventory, trade.quantity);
    }

    tradeWithInv.inventoryAfter = this.state.inventory;

    this.state.totalVolume = decAdd(
      this.state.totalVolume,
      decMul(trade.price, trade.quantity)
    );
    this.state.totalTrades++;

    this.trades.push(tradeWithInv);
    if (this.trades.length > 10000) {
      this.trades.shift();
    }

    this.inventoryHistory.push({
      inventory: this.state.inventory,
      time: Date.now(),
    });
    if (this.inventoryHistory.length > 1000) {
      this.inventoryHistory.shift();
    }

    this.updatePnl(trade.price);

    return tradeWithInv;
  }

  /**
   * 更新盈亏
   */
  private updatePnl(currentPrice: string): void {
    this.state.unrealizedPnl = decTruncate(
      decMul(this.state.inventory, decSub(currentPrice, this.state.midPrice)),
      8
    );
    this.state.totalPnl = decAdd(this.state.realizedPnl, this.state.unrealizedPnl);
    this.state.inventoryOffset = decSub(this.state.inventory, this.config.targetInventory);
  }

  // -------------------------------------------------------------------------
  // 库存管理
  // -------------------------------------------------------------------------

  /**
   * 获取当前库存
   */
  getInventory(): string {
    return this.state.inventory;
  }

  /**
   * 设置初始库存
   */
  setInventory(inventory: string): void {
    this.state.inventory = inventory;
    this.state.inventoryOffset = decSub(inventory, this.config.targetInventory);
  }

  /**
   * 获取库存风险
   */
  getInventoryRisk(): { level: 'low' | 'medium' | 'high'; offsetRatio: number } {
    const inv = parseFloat(this.state.inventory);
    const target = parseFloat(this.config.targetInventory);
    const maxInv = parseFloat(this.config.maxInventory);

    const range = maxInv - target;
    if (range <= 0) return { level: 'high', offsetRatio: 1 };

    const offsetRatio = Math.abs(inv - target) / range;

    let level: 'low' | 'medium' | 'high';
    if (offsetRatio < 0.3) {
      level = 'low';
    } else if (offsetRatio < 0.7) {
      level = 'medium';
    } else {
      level = 'high';
    }

    return { level, offsetRatio };
  }

  // -------------------------------------------------------------------------
  // 配置管理
  // -------------------------------------------------------------------------

  getConfig(): MarketMakerConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<MarketMakerConfig>): void {
    Object.assign(this.config, config);
    logger.info(`[mm] config updated for ${this.config.makerId}`, config);
  }

  getState(): MarketMakerState {
    return { ...this.state };
  }

  // -------------------------------------------------------------------------
  // 统计
  // -------------------------------------------------------------------------

  getStats(): {
    totalTrades: number;
    totalVolume: string;
    totalPnl: string;
    realizedPnl: string;
    unrealizedPnl: string;
    currentInventory: string;
    inventoryRisk: string;
    avgSpreadBps: number;
    winRate: number;
    tradeCount24h: number;
  } {
    const risk = this.getInventoryRisk();
    const trades24h = this.trades.filter(t => t.timestamp > Date.now() - 24 * 60 * 60 * 1000);

    let wins = 0;
    for (let i = 1; i < this.trades.length; i++) {
      const prev = this.trades[i - 1];
      const curr = this.trades[i];
      if (prev.side === 'buy' && curr.side === 'sell') {
        if (decCmp(curr.price, prev.price) > 0) wins++;
      } else if (prev.side === 'sell' && curr.side === 'buy') {
        if (decCmp(prev.price, curr.price) > 0) wins++;
      }
    }

    const winRate = this.trades.length > 0 ? wins / Math.floor(this.trades.length / 2) : 0;

    return {
      totalTrades: this.state.totalTrades,
      totalVolume: this.state.totalVolume,
      totalPnl: this.state.totalPnl,
      realizedPnl: this.state.realizedPnl,
      unrealizedPnl: this.state.unrealizedPnl,
      currentInventory: this.state.inventory,
      inventoryRisk: risk.level,
      avgSpreadBps: this.state.adjustedSpreadBps,
      winRate,
      tradeCount24h: trades24h.length,
    };
  }
}

// ============================================================================
// 做市商管理器
// ============================================================================

export class MarketMakerManager {
  private readonly makers = new Map<string, MarketMakerEngine>();

  createMaker(config: MarketMakerConfig): MarketMakerEngine {
    const key = `${config.makerId}:${config.symbol}`;
    const maker = new MarketMakerEngine(config);
    this.makers.set(key, maker);
    return maker;
  }

  getMaker(makerId: string, symbol: string): MarketMakerEngine | undefined {
    return this.makers.get(`${makerId}:${symbol}`);
  }

  removeMaker(makerId: string, symbol: string): boolean {
    const key = `${makerId}:${symbol}`;
    const maker = this.makers.get(key);
    if (maker) {
      maker.stop();
      return this.makers.delete(key);
    }
    return false;
  }

  stopAll(): void {
    for (const maker of this.makers.values()) {
      maker.stop();
    }
  }

  startAll(): void {
    for (const maker of this.makers.values()) {
      maker.start();
    }
  }

  getStats(): { activeMakers: number; totalQuotes: number } {
    let totalQuotes = 0;
    let active = 0;
    for (const maker of this.makers.values()) {
      const state = maker.getState();
      if (state.status === 'running') {
        active++;
        totalQuotes += state.buyQuotes.length + state.sellQuotes.length;
      }
    }
    return { activeMakers: active, totalQuotes };
  }
}
