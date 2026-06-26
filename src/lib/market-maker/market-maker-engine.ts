/**
 * 做市商系统核心引擎 (MarketMakerEngine)
 *
 * 功能：
 *  - 做市商注册 / 审批 / 暂停 / 查询 / 列表
 *  - 报价维护：updateQuote(symbol) -> 拉价 -> 算库存 -> 生成新报价 -> 撤旧挂新
 *  - 统计：成交量 / 点差 / 库存 / 排行
 *  - 集成：接收 OrderEngine 实例，接收 Trade 事件流
 *
 * 集成：
 *  - 注入 OrderEngine / InventoryManager / RebateEngine / QuoteEngine
 *  - 调用方需把 OrderEngine 的 'orderMatched' 事件接到 handleTrade()，
 *    以便累计成交量 / 触发返佣
 */

import { EventEmitter } from 'node:events';
import { decAdd, decCmp, decMul, decTruncate } from '@/lib/matching/decimal';
import type { MatchingEngine } from '@/lib/matching/engine';
import type { Trade } from '@/types/models';
import { QuoteEngine, calcMidPrice } from './quote-engine';
import { InventoryManager, type RebalancePlan } from './inventory-manager';
import { RebateEngine, type RebateInput } from './rebate-engine';
import {
  type MarketMaker,
  type MarketMakerStats,
  type MarketMakerStatus,
  type MarketMakerTier,
  type Quote,
  type Unsubscribe,
  MM_LEADERBOARD_LIMIT,
} from './types';

export interface MarketMakerEngineDeps {
  matchingEngine?: MatchingEngine;
  quoteEngine?: QuoteEngine;
  inventoryManager?: InventoryManager;
  rebateEngine?: RebateEngine;
  /** 注入式行情价格源（默认使用 OrderBook 中间价）。 */
  priceSource?: (symbol: string) => string | null;
}

export interface TradeRecord {
  trade: Trade;
  marketMakerId: string;
  volume: string;
  isMaker: boolean;
  receivedAt: number;
}

export class MarketMakerEngine {
  private readonly emitter = new EventEmitter();

  /** 做市商账户 (id -> MarketMaker) */
  private readonly makers = new Map<string, MarketMaker>();

  /** 做市商当前报价缓存 (id -> symbol -> Quote[]) */
  private readonly quotes = new Map<string, Map<string, Quote[]>>();

  /** 成交记录流水 (id -> TradeRecord[]) */
  private readonly tradeRecords = new Map<string, TradeRecord[]>();

  /** 依赖 */
  private readonly quoteEngine: QuoteEngine;
  private readonly inventoryManager: InventoryManager;
  private readonly rebateEngine: RebateEngine;
  private readonly matchingEngine?: MatchingEngine;
  private readonly priceSource: (symbol: string) => string | null;

  /** OrderEngine 事件解绑函数 */
  private unsubscribeMatching: (() => void) | null = null;

  constructor(deps: MarketMakerEngineDeps = {}) {
    this.quoteEngine = deps.quoteEngine ?? new QuoteEngine(deps.priceSource);
    this.inventoryManager = deps.inventoryManager ?? new InventoryManager();
    this.rebateEngine = deps.rebateEngine ?? new RebateEngine();
    this.matchingEngine = deps.matchingEngine;
    this.priceSource = deps.priceSource ?? ((sym) => this.matchingEnginePrice(sym));
  }

  /** 获取子模块（便于直接调用 / 测试）。 */
  getQuoteEngine(): QuoteEngine { return this.quoteEngine; }
  getInventoryManager(): InventoryManager { return this.inventoryManager; }
  getRebateEngine(): RebateEngine { return this.rebateEngine; }

  // -------------------------------------------------------------------------
  // 做市商管理
  // -------------------------------------------------------------------------

  /**
   * 注册做市商（status = 'suspended'，需 approveMarketMaker 激活）。
   */
  registerMarketMaker(input: Omit<MarketMaker, 'id' | 'status' | 'createdAt' | 'approvedAt'> & { id?: string }): MarketMaker {
    const id = input.id ?? `mm_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
    const now = Date.now();
    const mm: MarketMaker = {
      ...input,
      id,
      status: 'suspended',
      createdAt: now,
      approvedAt: 0,
    };
    this.makers.set(id, mm);
    return mm;
  }

  /** 审批通过（active）。 */
  approveMarketMaker(id: string): MarketMaker {
    const mm = this.requireMaker(id);
    mm.status = 'active';
    mm.approvedAt = Date.now();
    return mm;
  }

  /** 暂停。 */
  suspendMarketMaker(id: string, reason: string): MarketMaker {
    const mm = this.requireMaker(id);
    mm.status = 'suspended';
    mm.suspendReason = reason;
    return mm;
  }

  /** 拉黑。 */
  banMarketMaker(id: string, reason: string): MarketMaker {
    const mm = this.requireMaker(id);
    mm.status = 'banned';
    mm.suspendReason = reason;
    return mm;
  }

  /** 恢复（suspended -> active）。 */
  reactivateMarketMaker(id: string): MarketMaker {
    const mm = this.requireMaker(id);
    if (mm.status === 'banned') {
      throw new Error(`market maker ${id} is banned and cannot be reactivated`);
    }
    mm.status = 'active';
    mm.suspendReason = undefined;
    return mm;
  }

  /** 查询单个做市商。 */
  getMarketMaker(id: string): MarketMaker | null {
    return this.makers.get(id) ?? null;
  }

  /** 列出做市商（可按 tier / status 过滤）。 */
  listMarketMakers(tier?: MarketMakerTier, status?: MarketMakerStatus): MarketMaker[] {
    const out: MarketMaker[] = [];
    for (const mm of this.makers.values()) {
      if (tier && mm.tier !== tier) continue;
      if (status && mm.status !== status) continue;
      out.push(mm);
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // 报价维护
  // -------------------------------------------------------------------------

  /**
   * 更新报价：
   *  1) 拉取 refPrice（中间价）
   *  2) 拉取库存
   *  3) 生成新报价
   *  4) 替换缓存
   *  5) 触发 quoteUpdate 事件
   *
   * 注意：本方法不直接调 OrderEngine 下单。
   *       实际下单单测可注入 matcher。
   */
  updateQuote(marketMakerId: string, symbol: string): Quote[] {
    const mm = this.requireActiveMaker(marketMakerId);
    if (mm.symbols && !mm.symbols.includes(symbol)) {
      return [];
    }
    const refPrice = this.priceSource(symbol);
    if (refPrice === null) return [];

    const inv = this.inventoryManager.getInventory(marketMakerId, symbol);
    const inventoryForQuote = inv ? { baseAmount: inv.baseAmount, maxInventory: inv.targetInventory } : null;
    const newQuotes = this.quoteEngine.generateQuotes(symbol, inventoryForQuote, refPrice);
    // 注入 marketMakerId
    for (const q of newQuotes) q.marketMakerId = marketMakerId;
    this.quoteEngine.setActiveQuotes(symbol, newQuotes);

    const map = this.quotes.get(marketMakerId) ?? new Map<string, Quote[]>();
    map.set(symbol, newQuotes);
    this.quotes.set(marketMakerId, map);

    try {
      this.emitter.emit('quoteUpdate', { marketMakerId, symbol, quotes: newQuotes, timestamp: Date.now() });
    } catch {
      // 静默
    }
    return newQuotes;
  }

  /** 取某做市商的所有当前报价。 */
  getActiveQuotes(marketMakerId?: string): Quote[] {
    if (marketMakerId) {
      const map = this.quotes.get(marketMakerId);
      if (!map) return [];
      const out: Quote[] = [];
      for (const list of map.values()) out.push(...list);
      return out;
    }
    const all: Quote[] = [];
    for (const map of this.quotes.values()) {
      for (const list of map.values()) all.push(...list);
    }
    return all;
  }

  /** 撤掉某做市商某交易对的所有报价缓存。 */
  cancelMarketMakerQuotes(marketMakerId: string, symbol?: string): number {
    const map = this.quotes.get(marketMakerId);
    if (!map) return 0;
    if (symbol) {
      const n = (map.get(symbol) ?? []).length;
      map.delete(symbol);
      return n;
    }
    let n = 0;
    for (const list of map.values()) n += list.length;
    map.clear();
    return n;
  }

  // -------------------------------------------------------------------------
  // 成交处理
  // -------------------------------------------------------------------------

  /**
   * 处理一笔 Trade（由 OrderEngine 'orderMatched' 事件驱动）。
   *  - 若 taker/maker 是做市商 -> 记录成交量
   *  - 若 taker/maker 是做市商 -> 触发返佣
   */
  handleTrade(trade: Trade): void {
    const marketMakerId = this.resolveTradeMakerId(trade);
    if (!marketMakerId) return;

    const rec: TradeRecord = {
      trade,
      marketMakerId,
      volume: decMul(trade.price, trade.quantity),
      isMaker: trade.isMaker,
      receivedAt: Date.now(),
    };
    const list = this.tradeRecords.get(marketMakerId) ?? [];
    list.push(rec);
    this.tradeRecords.set(marketMakerId, list);

    // 触发返佣
    const mm = this.getMarketMaker(marketMakerId);
    if (mm) {
      const input: RebateInput = {
        tradeId: trade.id,
        symbol: trade.symbol,
        side: trade.isMaker ? 'bid' : 'ask', // 用 isMaker 标志区分
        price: trade.price,
        quantity: trade.quantity,
      };
      this.rebateEngine.recordRebate(input, mm);
    }
  }

  /**
   * 把 OrderEngine 的 orderMatched 事件接进来。
   * 注：调用方负责调用 disposeMatchingListener 解除。
   */
  bindMatchingEngine(engine: MatchingEngine): void {
    this.unbindMatchingEngine();
    const listener = (payload: { trade: Trade }) => this.handleTrade(payload.trade);
    engine.on('orderMatched', listener as (p: unknown) => void);
    this.unsubscribeMatching = () => engine.off('orderMatched', listener as (p: unknown) => void);
  }

  /** 解绑 OrderEngine。 */
  unbindMatchingEngine(): void {
    if (this.unsubscribeMatching) {
      this.unsubscribeMatching();
      this.unsubscribeMatching = null;
    }
  }

  /**
   * 判断一笔成交是否由做市商参与（maker 或 taker 是 MM）。
   * 返回对应的做市商 id。
   */
  private resolveTradeMakerId(trade: Trade): string | null {
    // 简化策略：把 taker.userId 当作做市商 id（生产环境应用专门 userId 映射）
    for (const mm of this.makers.values()) {
      if (mm.status !== 'active') continue;
      if (mm.id === trade.userId) return mm.id;
      if (mm.id === trade.counterpartyUserId) return mm.id;
    }
    return null;
  }

  // -------------------------------------------------------------------------
  // 统计 / 排行榜
  // -------------------------------------------------------------------------

  /**
   * 取做市商统计。
   */
  getStats(marketMakerId: string, period: { start: number; end: number }): MarketMakerStats {
    const mm = this.requireMaker(marketMakerId);
    const trades = (this.tradeRecords.get(marketMakerId) ?? []).filter(
      (r) => r.receivedAt >= period.start && r.receivedAt <= period.end,
    );

    let totalVolume = '0';
    for (const r of trades) totalVolume = decAdd(totalVolume, r.volume);
    const totalRebate = this.rebateEngine.getTotalRebate(marketMakerId);
    const fillRate = this.computeFillRate(mm.id);
    const avgSpread = this.computeAvgSpread(mm.id);
    const inventoryTurnover = this.computeInventoryTurnover(mm.id, period);

    return {
      marketMakerId: mm.id,
      name: mm.name,
      tier: mm.tier,
      period,
      totalVolume: decTruncate(totalVolume, 8),
      totalRebate: decTruncate(totalRebate, 8),
      fillRate,
      avgSpread,
      uptime: 1, // 简化
      inventoryTurnover,
      pnl: '0',
      rank: 0,
    };
  }

  /**
   * 排行榜：按成交量降序排列。
   */
  getLeaderboard(symbol: string, days: number = 7, limit: number = MM_LEADERBOARD_LIMIT): MarketMakerStats[] {
    const end = Date.now();
    const start = end - days * 24 * 3600 * 1000;
    const period = { start, end };
    const list: MarketMakerStats[] = [];
    for (const mm of this.makers.values()) {
      if (mm.status !== 'active') continue;
      if (mm.symbols && !mm.symbols.includes(symbol)) continue;
      list.push(this.getStats(mm.id, period));
    }
    list.sort((a, b) => decCmp(b.totalVolume, a.totalVolume));
    list.forEach((s, i) => (s.rank = i + 1));
    return list.slice(0, limit);
  }

  // -------------------------------------------------------------------------
  // 调仓辅助
  // -------------------------------------------------------------------------

  /**
   * 给指定做市商生成调仓计划。
   */
  getRebalancePlan(marketMakerId: string, symbol: string): RebalancePlan | null {
    const inv = this.inventoryManager.getInventory(marketMakerId, symbol);
    if (!inv) return null;
    return this.inventoryManager.rebalancePlan(inv);
  }

  // -------------------------------------------------------------------------
  // 事件
  // -------------------------------------------------------------------------

  onQuoteUpdate(handler: (event: { marketMakerId: string; symbol: string; quotes: Quote[]; timestamp: number }) => void): Unsubscribe {
    this.emitter.on('quoteUpdate', handler);
    return () => this.emitter.off('quoteUpdate', handler);
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private requireMaker(id: string): MarketMaker {
    const mm = this.makers.get(id);
    if (!mm) throw new Error(`market maker ${id} not found`);
    return mm;
  }

  private requireActiveMaker(id: string): MarketMaker {
    const mm = this.requireMaker(id);
    if (mm.status !== 'active') {
      throw new Error(`market maker ${id} is not active (status=${mm.status})`);
    }
    return mm;
  }

  private matchingEnginePrice(symbol: string): string | null {
    if (!this.matchingEngine) return null;
    try {
      const ob = this.matchingEngine.getOrderBookInstance(symbol);
      if (!ob) return null;
      const snap = ob.getSnapshot(1);
      const bid = snap.bids[0]?.price;
      const ask = snap.asks[0]?.price;
      if (!bid || !ask) return null;
      return calcMidPrice(bid, ask);
    } catch {
      return null;
    }
  }

  private computeFillRate(marketMakerId: string): number {
    const records = this.tradeRecords.get(marketMakerId) ?? [];
    if (records.length === 0) return 0;
    const filled = records.filter((r) => decCmp(r.trade.quantity, '0') > 0).length;
    return filled / records.length;
  }

  private computeAvgSpread(marketMakerId: string): number {
    const map = this.quotes.get(marketMakerId);
    if (!map) return 0;
    let total = 0;
    let count = 0;
    for (const [symbol, list] of map.entries()) {
      const bids = list.filter((q) => q.side === 'bid');
      const asks = list.filter((q) => q.side === 'ask');
      if (bids.length === 0 || asks.length === 0) continue;
      const topBid = bids.reduce((a, b) => (decCmp(a.price, b.price) > 0 ? a : b));
      const topAsk = asks.reduce((a, b) => (decCmp(a.price, b.price) < 0 ? a : b));
      const mid = parseFloat(calcMidPrice(topBid.price, topAsk.price));
      if (mid === 0) continue;
      const spreadBps = ((parseFloat(topAsk.price) - parseFloat(topBid.price)) / mid) * 10000;
      total += spreadBps;
      count++;
    }
    return count === 0 ? 0 : total / count;
  }

  private computeInventoryTurnover(marketMakerId: string, period: { start: number; end: number }): number {
    const records = (this.tradeRecords.get(marketMakerId) ?? []).filter(
      (r) => r.receivedAt >= period.start && r.receivedAt <= period.end,
    );
    if (records.length === 0) return 0;
    let totalVol = 0;
    for (const r of records) totalVol += parseFloat(r.volume);
    return totalVol;
  }
}
