/**
 * 做市商报价引擎 (QuoteEngine)
 *
 * 功能：
 *  - 自动双边挂单 (bid/ask)
 *  - 调价策略：固定点差 / 倾斜 (skew) / 固定数量 / 档位
 *  - 报价生成：generateQuote(symbol, inventory, refPrice)
 *  - 多档报价：默认 5 档（1-5）
 *  - 撤单：cancelAll / cancelStale
 *  - 事件：onQuoteUpdate
 *
 * 报价公式（核心）：
 *   halfSpreadBps = spreadBps / 2
 *   skewBps      = (baseAmount / maxInventory) * skewMultiplier * 100
 *                 // skewMultiplier 是 setSkew 注入的灵敏度
 *   bid = refPrice * (1 - (halfSpread + skew) / 10000)
 *   ask = refPrice * (1 + (halfSpread + skew) / 10000)
 *   第 N 档：bid_N = bid - (N-1) * stepBps/10000 * refPrice
 *
 * 注意：本引擎只做"报价生成 + 内部报价管理"，实际下单需在 MarketMakerEngine
 *       中转给 OrderEngine 撮合。本类不直接依赖 OrderEngine，便于单测。
 */

import { EventEmitter } from 'events';
import {
  decAdd,
  decCmp,
  decDiv,
  decIsZero,
  decMul,
  decSub,
  decTruncate,
} from '@/lib/matching/decimal';
import {
  type Quote,
  type QuotePair,
  type QuoteUpdateEvent,
  type Unsubscribe,
  MM_MAX_LEVELS,
  MM_MIN_SPREAD_BPS,
  MM_QUOTE_EXPIRY_MS,
  MM_LEVEL_STEP_BPS,
  MM_DEFAULT_SPREAD_BPS,
} from './types';

interface SymbolConfig {
  spreadBps: number;       // 固定点差 (bps)
  skewMultiplier: number;  // 倾斜灵敏度 (-1..1)
  size: string;            // 单档数量
  levels: number;          // 档位数 1..10
}

const DEFAULT_CONFIG: SymbolConfig = {
  spreadBps: MM_DEFAULT_SPREAD_BPS,
  skewMultiplier: 0,
  size: '0.1',
  levels: 5,
};

export class QuoteEngine {
  private readonly emitter = new EventEmitter();

  /** symbol -> 单交易对配置 */
  private readonly configs = new Map<string, SymbolConfig>();

  /** symbol -> 当前生效的报价 */
  private readonly activeQuotes = new Map<string, Quote[]>();

  /** 行情刷新源（注入），返回 refPrice。 */
  private priceSource: (symbol: string) => string | null;

  constructor(priceSource?: (symbol: string) => string | null) {
    this.priceSource = priceSource ?? (() => null);
  }

  // -------------------------------------------------------------------------
  // 调价策略
  // -------------------------------------------------------------------------

  /** 设置交易对点差（bps）。 */
  setSpread(symbol: string, bps: number): void {
    if (bps < MM_MIN_SPREAD_BPS) {
      throw new Error(`spread must be >= ${MM_MIN_SPREAD_BPS} bps`);
    }
    this.ensureConfig(symbol).spreadBps = bps;
  }

  /**
   * 设置倾斜灵敏度。
   *  - 0  = 不倾斜
   *  - 1  = 最大倾斜（库存满时偏移 100bps）
   *  - -1 = 反向
   */
  setSkew(symbol: string, quoteMultiplier: number): void {
    if (quoteMultiplier < -1 || quoteMultiplier > 1) {
      throw new Error('skew must be in [-1, 1]');
    }
    this.ensureConfig(symbol).skewMultiplier = quoteMultiplier;
  }

  /** 设置单档数量。 */
  setSize(symbol: string, qty: string): void {
    if (decIsZero(qty)) {
      throw new Error('size must be > 0');
    }
    this.ensureConfig(symbol).size = qty;
  }

  /** 设置档位数。 */
  setLevels(symbol: string, levels: number): void {
    if (levels < 1 || levels > MM_MAX_LEVELS) {
      throw new Error(`levels must be in [1, ${MM_MAX_LEVELS}]`);
    }
    this.ensureConfig(symbol).levels = levels;
  }

  /** 获取当前配置。 */
  getConfig(symbol: string): SymbolConfig {
    return { ...this.ensureConfig(symbol) };
  }

  // -------------------------------------------------------------------------
  // 报价生成
  // -------------------------------------------------------------------------

  /**
   * 计算 skew 偏移量 (bps)。
   * skewBps = (baseAmount / maxInventory) * skewMultiplier * 100
   */
  computeSkewBps(baseAmount: string, maxInventory: string, skewMultiplier: number): number {
    if (decIsZero(maxInventory)) return 0;
    const ratio = parseFloat(baseAmount) / parseFloat(maxInventory);
    return ratio * skewMultiplier * 100;
  }

  /**
   * 生成一对报价（买一/卖一）。
   * @param symbol       交易对
   * @param inventory    库存（用于 skew）；传 null 表示无库存偏移
   * @param refPrice     参考价（中间价）
   */
  generateQuote(
    symbol: string,
    inventory: { baseAmount: string; maxInventory: string } | null,
    refPrice: string,
  ): QuotePair {
    const cfg = this.ensureConfig(symbol);
    const halfSpread = cfg.spreadBps / 2;
    const skewBps = inventory
      ? this.computeSkewBps(inventory.baseAmount, inventory.maxInventory, cfg.skewMultiplier)
      : 0;

    const bid = this.formatPrice(decMul(refPrice, decSub('1', String((halfSpread + skewBps) / 10000))));
    const ask = this.formatPrice(decMul(refPrice, decAdd('1', String((halfSpread + skewBps) / 10000))));

    const now = Date.now();
    return {
      bid: this.makeQuote(symbol, 'bid', bid, cfg.size, 1, now, now + MM_QUOTE_EXPIRY_MS),
      ask: this.makeQuote(symbol, 'ask', ask, cfg.size, 1, now, now + MM_QUOTE_EXPIRY_MS),
    };
  }

  /**
   * 生成多档报价（默认 5 档）。
   *  每往外一档，价格外扩 level * stepBps。
   */
  generateQuotes(
    symbol: string,
    inventory: { baseAmount: string; maxInventory: string } | null,
    refPrice: string,
  ): Quote[] {
    const cfg = this.ensureConfig(symbol);
    const halfSpread = cfg.spreadBps / 2;
    const stepPct = MM_LEVEL_STEP_BPS / 10000;
    const skewBps = inventory
      ? this.computeSkewBps(inventory.baseAmount, inventory.maxInventory, cfg.skewMultiplier)
      : 0;

    const now = Date.now();
    const out: Quote[] = [];
    for (let level = 1; level <= cfg.levels; level++) {
      const offset = (halfSpread + skewBps) / 10000 + (level - 1) * stepPct;
      const bid = this.formatPrice(decMul(refPrice, decSub('1', String(offset))));
      const ask = this.formatPrice(decMul(refPrice, decAdd('1', String(offset))));
      out.push(this.makeQuote(symbol, 'bid', bid, cfg.size, level, now, now + MM_QUOTE_EXPIRY_MS));
      out.push(this.makeQuote(symbol, 'ask', ask, cfg.size, level, now, now + MM_QUOTE_EXPIRY_MS));
    }
    return out;
  }

  /** 获取某交易对当前生效的盘口（最高 bid / 最低 ask）。 */
  getTopOfBook(symbol: string): { bid: Quote; ask: Quote } | null {
    const list = this.activeQuotes.get(symbol);
    if (!list || list.length === 0) return null;
    let bid: Quote | null = null;
    let ask: Quote | null = null;
    for (const q of list) {
      if (q.side === 'bid' && (!bid || decCmp(q.price, bid.price) > 0)) bid = q;
      if (q.side === 'ask' && (!ask || decCmp(q.price, ask.price) < 0)) ask = q;
    }
    if (!bid || !ask) return null;
    return { bid, ask };
  }

  /** 获取所有 active 报价。 */
  getActiveQuotes(symbol?: string): Quote[] {
    if (symbol) return [...(this.activeQuotes.get(symbol) ?? [])];
    const all: Quote[] = [];
    for (const list of this.activeQuotes.values()) all.push(...list);
    return all;
  }

  // -------------------------------------------------------------------------
  // 报价维护
  // -------------------------------------------------------------------------

  /**
   * 刷新某交易对的报价：拉取最新价 -> 生成新报价 -> 替换旧报价。
   * 旧报价由调用方（MarketMakerEngine）负责撤单。
   * @returns 新报价列表
   */
  refreshQuotes(symbol: string, inventory: { baseAmount: string; maxInventory: string } | null): Quote[] {
    const refPrice = this.priceSource(symbol);
    if (refPrice === null) return [];
    const newQuotes = this.generateQuotes(symbol, inventory, refPrice);
    this.activeQuotes.set(symbol, newQuotes);
    this.emitUpdate(symbol, newQuotes);
    return newQuotes;
  }

  /**
   * 提交外部生成的报价（已被撤旧挂新流程使用）。
   */
  setActiveQuotes(symbol: string, quotes: Quote[]): void {
    this.activeQuotes.set(symbol, [...quotes]);
    this.emitUpdate(symbol, quotes);
  }

  /** 撤掉某交易对所有报价（不实际撤撮合订单）。返回被撤数量。 */
  cancelAll(symbol: string): number {
    const old = this.activeQuotes.get(symbol) ?? [];
    this.activeQuotes.delete(symbol);
    if (old.length > 0) this.emitUpdate(symbol, []);
    return old.length;
  }

  /**
   * 撤掉过期的报价（createdAt < now - olderThanMs）。
   * @returns 被撤数量
   */
  cancelStale(olderThanMs: number = MM_QUOTE_EXPIRY_MS): number {
    const threshold = Date.now() - olderThanMs;
    let count = 0;
    for (const [symbol, list] of this.activeQuotes.entries()) {
      const fresh: Quote[] = [];
      for (const q of list) {
        if (q.createdAt < threshold) count++;
        else fresh.push(q);
      }
      this.activeQuotes.set(symbol, fresh);
    }
    return count;
  }

  // -------------------------------------------------------------------------
  // 事件
  // -------------------------------------------------------------------------

  onQuoteUpdate(handler: (event: QuoteUpdateEvent) => void): Unsubscribe {
    this.emitter.on('quoteUpdate', handler);
    return () => this.emitter.off('quoteUpdate', handler);
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private ensureConfig(symbol: string): SymbolConfig {
    let cfg = this.configs.get(symbol);
    if (!cfg) {
      cfg = { ...DEFAULT_CONFIG };
      this.configs.set(symbol, cfg);
    }
    return cfg;
  }

  private makeQuote(
    symbol: string,
    side: 'bid' | 'ask',
    price: string,
    size: string,
    level: number,
    now: number,
    expiresAt: number,
  ): Quote {
    return {
      marketMakerId: '', // 由 MarketMakerEngine 注入
      symbol,
      side,
      price,
      size,
      level,
      createdAt: now,
      expiresAt,
    };
  }

  private formatPrice(raw: string): string {
    return decTruncate(raw, 8);
  }

  private emitUpdate(symbol: string, quotes: Quote[]) {
    try {
      this.emitter.emit('quoteUpdate', {
        marketMakerId: '',
        symbol,
        quotes: [...quotes],
        timestamp: Date.now(),
      } as QuoteUpdateEvent);
    } catch {
      // 静默
    }
  }
}

// -----------------------------------------------------------------------------
// 便捷工具（供 MarketMakerEngine 复用）
// -----------------------------------------------------------------------------

/**
 * 计算中间价（直接用买卖价的算术平均）。
 * 若入参缺失返回 '0'。
 */
export function calcMidPrice(bid: string, ask: string): string {
  if (!bid || !ask) return '0';
  return decTruncate(decDiv(decAdd(bid, ask), '2'), 8);
}

/** 校验点差是否合法（bid < ask）。 */
export function isValidSpread(bid: string, ask: string): boolean {
  if (decIsZero(bid) || decIsZero(ask)) return false;
  return decCmp(bid, ask) < 0;
}
