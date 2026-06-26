/**
 * OtcEngine — OTC 业务层 + 集成层
 *
 * 职责：
 *  - 整合 OtcMakerRegistry / RfqEngine / PriceLockService / SettlementEngine / CommissionEngine
 *  - 完整流程：createRfq → submitQuote → acceptQuote → lockPrice → settleTrade → calculateCommissions
 *  - 撮合器人管理（assign / get）
 *  - 事件订阅：onRfqCreated / onQuoteReceived / onTradeCompleted
 *
 * 集成：
 *  - 复用 matching/decimal / otc/*
 *  - 集成 notification（成交通知，演示降级：console.log）
 *  - 集成 order-engine（链上结算时使用，演示降级：mock 即可）
 *
 * 用法：
 *   const engine = new OtcEngine();
 *   const rfq = engine.createRfq({ clientId, clientUserId, side: 'buy', baseAsset: 'BTC', quoteAsset: 'USDT', baseAmount: '10', settlementType: 'stablecoin' });
 *   engine.inviteMakers(rfq.id, [makerId1, makerId2]);
 *   const quote = engine.submitQuote({ rfqId: rfq.id, makerId: makerId1, price: '68000' });
 *   const trade = engine.acceptQuote(quote.id);
 *   const settled = await engine.settleTrade(trade.id);
 */

import { decAdd } from '@/lib/matching/decimal';
import type {
  OtcCommission,
  OtcQuote,
  OtcSalesperson,
  OtcStatus,
  OtcTrade,
  OtcPriceDeviationEvent,
  OtcQuoteReceivedEvent,
  OtcQuoteAcceptedEvent,
  OtcRfqCreatedEvent,
  OtcTradeCompletedEvent,
  Rfq,
  Unsubscribe,
} from './types';
import { OtcMakerRegistry } from './market-maker-registry';
import { RfqEngine, type RfqCreateOptions, type SubmitQuoteOptions, type SelectionCriteria } from './rfq-engine';
import { PriceLockService } from './price-lock';
import { SettlementEngine } from './settlement-engine';
import { CommissionEngine } from './commission-engine';
import { OTC_PRICE_LOCK_DURATION_SEC, calcPriceDeviation } from './types';

export interface OtcEngineDeps {
  makerRegistry?: OtcMakerRegistry;
  rfqEngine?: RfqEngine;
  priceLockService?: PriceLockService;
  settlementEngine?: SettlementEngine;
  commissionEngine?: CommissionEngine;
  /** 通知发送回调（演示降级：默认 console.log）。 */
  notifier?: (event: { type: string; payload: unknown; timestamp: number }) => void;
  /** 当前时间（可注入用于测试）。 */
  now?: () => number;
}

export class OtcEngine {
  private readonly makerRegistry: OtcMakerRegistry;
  private readonly rfqEngine: RfqEngine;
  private readonly priceLockService: PriceLockService;
  private readonly settlementEngine: SettlementEngine;
  private readonly commissionEngine: CommissionEngine;
  private readonly notifier: NonNullable<OtcEngineDeps['notifier']>;
  private readonly now: () => number;

  /** clientId -> salespersonId */
  private readonly assignments = new Map<string, string>();
  /** salespersonId -> OtcSalesperson */
  private readonly salespeople = new Map<string, OtcSalesperson>();

  // -------------------------------------------------------------------------
  // 事件订阅
  // -------------------------------------------------------------------------
  private readonly rfqCreatedHandlers: Set<(e: OtcRfqCreatedEvent) => void> = new Set();
  private readonly quoteReceivedHandlers: Set<(e: OtcQuoteReceivedEvent) => void> = new Set();
  private readonly tradeCompletedHandlers: Set<(e: OtcTradeCompletedEvent) => void> = new Set();
  private readonly quoteAcceptedHandlers: Set<(e: OtcQuoteAcceptedEvent) => void> = new Set();
  private readonly priceDeviationHandlers: Set<(e: OtcPriceDeviationEvent) => void> = new Set();

  constructor(deps: OtcEngineDeps = {}) {
    this.makerRegistry = deps.makerRegistry ?? new OtcMakerRegistry();
    this.rfqEngine = deps.rfqEngine ?? new RfqEngine({ makerRegistry: this.makerRegistry });
    this.priceLockService = deps.priceLockService ?? new PriceLockService();
    this.settlementEngine = deps.settlementEngine ?? new SettlementEngine({ priceLockService: this.priceLockService });
    this.commissionEngine = deps.commissionEngine ?? new CommissionEngine();
    this.notifier = deps.notifier ?? defaultNotifier;
    this.now = deps.now ?? (() => Date.now());

    // 订阅 price-lock 偏离事件 → 转发
    this.priceLockService.onDeviation((tradeId, result) => {
      const trade = this.settlementEngine.getTrade(tradeId);
      if (!trade) return;
      const evt: OtcPriceDeviationEvent = {
        tradeId,
        lockedPrice: trade.lockedPrice,
        currentPrice: '',
        deviation: result.deviation,
        level: result.level === 'normal' ? 'warning' : result.level,
        timestamp: this.now(),
      };
      for (const h of this.priceDeviationHandlers) {
        try { h(evt); } catch { /* 静默 */ }
      }
    });
  }

  // -------------------------------------------------------------------------
  // 子模块访问
  // -------------------------------------------------------------------------

  getMakerRegistry(): OtcMakerRegistry { return this.makerRegistry; }
  getRfqEngine(): RfqEngine { return this.rfqEngine; }
  getPriceLockService(): PriceLockService { return this.priceLockService; }
  getSettlementEngine(): SettlementEngine { return this.settlementEngine; }
  getCommissionEngine(): CommissionEngine { return this.commissionEngine; }

  // -------------------------------------------------------------------------
  // 业务便捷方法
  // -------------------------------------------------------------------------

  /**
   * 创建 RFQ。
   */
  createRfq(opts: RfqCreateOptions): Rfq {
    const rfq = this.rfqEngine.createRfq(opts);
    this.notifier({ type: 'otc.rfq_created', payload: { rfqId: rfq.id, clientId: rfq.clientId, side: rfq.side, baseAsset: rfq.baseAsset, baseAmount: rfq.baseAmount }, timestamp: this.now() });
    this.emitRfqCreated({ rfq, timestamp: this.now() });
    return rfq;
  }

  /**
   * 邀请做市商。
   */
  inviteMakers(rfqId: string, makerIds: string[]): Rfq {
    return this.rfqEngine.inviteMakers(rfqId, makerIds);
  }

  /**
   * 做市商报价。
   */
  submitQuote(opts: SubmitQuoteOptions): OtcQuote {
    const q = this.rfqEngine.submitQuote(opts);
    this.notifier({ type: 'otc.quote_received', payload: { rfqId: q.rfqId, quoteId: q.id, makerId: q.makerId, price: q.price }, timestamp: this.now() });
    this.emitQuoteReceived({ rfqId: q.rfqId, quote: q, timestamp: this.now() });
    return q;
  }

  /**
   * 选择最优报价。
   */
  selectBestQuote(rfqId: string, criteria: SelectionCriteria = 'price'): OtcQuote | null {
    return this.rfqEngine.selectBestQuote(rfqId, criteria);
  }

  /**
   * 客户接受报价 → 创建成交 → 锁价 → 计算佣金。
   */
  acceptQuote(quoteId: string, opts: { clientAddress?: string; makerAddress?: string } = {}): OtcTrade {
    const quote = this.rfqEngine.acceptQuote(quoteId);
    const rfq = this.rfqEngine.getRfq(quote.rfqId)!;
    const maker = this.makerRegistry.getMaker(quote.makerId);

    // 锁价
    const { lockId, expiresAt } = this.priceLockService.lockPrice(
      genTradeId(quote.id),
      quote.price,
      OTC_PRICE_LOCK_DURATION_SEC,
    );
    void expiresAt;

    // 构造 trade
    const trade: OtcTrade = {
      id: lockId.replace(/^lk_/, 'otc_'),
      rfqId: rfq.id,
      quoteId: quote.id,
      clientId: rfq.clientId,
      makerId: quote.makerId,
      baseAsset: rfq.baseAsset,
      quoteAsset: rfq.quoteAsset,
      baseAmount: rfq.baseAmount,
      quoteAmount: quote.quoteAmount,
      price: quote.price,
      settlementType: quote.settlementType,
      status: 'locked',
      clientAddress: opts.clientAddress,
      makerAddress: opts.makerAddress ?? maker?.contactEmail,
      lockedPrice: quote.price,
      lockedAt: this.now(),
      priceDeviation: 0,
      createdAt: this.now(),
    };
    this.settlementEngine.registerTrade(trade);

    // 计算佣金
    const salespersonId = this.getAssignedSalespersonId(rfq.clientId);
    this.commissionEngine.recordForTrade(trade, { salespersonId });

    this.notifier({ type: 'otc.quote_accepted', payload: { tradeId: trade.id, rfqId: rfq.id, quoteId: quote.id, price: trade.price }, timestamp: this.now() });
    this.emitQuoteAccepted({ rfq, quote, trade, timestamp: this.now() });
    return trade;
  }

  /**
   * 结算成交。
   *  - 自动按 settlementType 选方式
   *  - 完成后状态 → completed，触发 onTradeCompleted
   *  - 同步结算佣金
   */
  async settleTrade(tradeId: string): Promise<OtcTrade> {
    const t = await this.settlementEngine.settle(tradeId);
    if (t.status === 'completed') {
      // 累计做市商成交量
      this.makerRegistry.addVolume(t.makerId, t.quoteAmount, 1);
      // 结算佣金
      this.commissionEngine.settle(t.id);
      this.notifier({ type: 'otc.trade_completed', payload: { tradeId: t.id, clientId: t.clientId, makerId: t.makerId, price: t.price, baseAmount: t.baseAmount }, timestamp: this.now() });
      this.emitTradeCompleted({ trade: t, timestamp: this.now() });
    }
    return t;
  }

  /**
   * 取消 RFQ。
   */
  cancelRfq(rfqId: string, reason?: string): Rfq {
    return this.rfqEngine.cancelRfq(rfqId, reason);
  }

  // -------------------------------------------------------------------------
  // 撮合器人
  // -------------------------------------------------------------------------

  /**
   * 登记撮合器人。
   */
  registerSalesperson(sp: Omit<OtcSalesperson, 'totalClients' | 'totalVolume' | 'totalCommission' | 'rating' | 'isActive'> & Partial<Pick<OtcSalesperson, 'totalClients' | 'totalVolume' | 'totalCommission' | 'rating' | 'isActive'>>): OtcSalesperson {
    const full: OtcSalesperson = {
      id: sp.id,
      userId: sp.userId,
      name: sp.name,
      totalClients: sp.totalClients ?? 0,
      totalVolume: sp.totalVolume ?? '0',
      totalCommission: sp.totalCommission ?? '0',
      rating: sp.rating ?? 4.0,
      isActive: sp.isActive ?? true,
    };
    this.salespeople.set(full.id, full);
    return full;
  }

  /**
   * 分配撮合器人给客户。
   */
  assignSalesperson(clientId: string, salespersonId: string): void {
    if (!this.salespeople.has(salespersonId)) {
      throw new Error(`salesperson ${salespersonId} not found`);
    }
    this.assignments.set(clientId, salespersonId);
    const sp = this.salespeople.get(salespersonId)!;
    sp.totalClients += 1;
  }

  /**
   * 取得客户的撮合器人。
   */
  getAssignedSalesperson(clientId: string): OtcSalesperson | null {
    const id = this.assignments.get(clientId);
    if (!id) return null;
    return this.salespeople.get(id) ?? null;
  }

  private getAssignedSalespersonId(clientId: string): string | undefined {
    return this.assignments.get(clientId);
  }

  // -------------------------------------------------------------------------
  // 查询便捷
  // -------------------------------------------------------------------------

  getRfq(id: string): Rfq | null { return this.rfqEngine.getRfq(id); }
  getTrade(id: string): OtcTrade | null { return this.settlementEngine.getTrade(id); }
  getClientRfqs(clientId: string, limit?: number): Rfq[] { return this.rfqEngine.getClientRfqs(clientId, limit); }
  getMakerTrades(makerId: string, limit?: number): OtcTrade[] { return this.settlementEngine.getMakerTrades(makerId, limit); }

  // -------------------------------------------------------------------------
  // 事件订阅
  // -------------------------------------------------------------------------

  onRfqCreated(handler: (e: OtcRfqCreatedEvent) => void): Unsubscribe {
    this.rfqCreatedHandlers.add(handler);
    return () => this.rfqCreatedHandlers.delete(handler);
  }

  onQuoteReceived(handler: (e: OtcQuoteReceivedEvent) => void): Unsubscribe {
    this.quoteReceivedHandlers.add(handler);
    return () => this.quoteReceivedHandlers.delete(handler);
  }

  onQuoteAccepted(handler: (e: OtcQuoteAcceptedEvent) => void): Unsubscribe {
    this.quoteAcceptedHandlers.add(handler);
    return () => this.quoteAcceptedHandlers.delete(handler);
  }

  onTradeCompleted(handler: (e: OtcTradeCompletedEvent) => void): Unsubscribe {
    this.tradeCompletedHandlers.add(handler);
    return () => this.tradeCompletedHandlers.delete(handler);
  }

  onPriceDeviation(handler: (e: OtcPriceDeviationEvent) => void): Unsubscribe {
    this.priceDeviationHandlers.add(handler);
    return () => this.priceDeviationHandlers.delete(handler);
  }

  // -------------------------------------------------------------------------
  // 价格偏离自动检测（业务层便捷）
  // -------------------------------------------------------------------------

  /**
   * 由外部喂入当前价 → 自动检查所有锁定中的 trade。
   *  - 返回触发告警的 tradeId 列表
   */
  feedCurrentPrice(currentPrice: string, tradeIds?: string[]): { tradeId: string; deviation: number; level: 'normal' | 'warning' | 'critical' }[] {
    const trades = tradeIds
      ? tradeIds.map((id) => this.settlementEngine.getTrade(id)).filter((t): t is OtcTrade => !!t)
      : this.settlementEngine.getClientTrades('').concat(
        this.settlementEngine.getMakerTrades(''),
      );
    void trades;
    const all = this.collectLockedTrades();
    const out: { tradeId: string; deviation: number; level: 'normal' | 'warning' | 'critical' }[] = [];
    for (const t of all) {
      if (tradeIds && !tradeIds.includes(t.id)) continue;
      const r = this.priceLockService.checkPriceDeviation(t.id, currentPrice);
      if (r.level !== 'normal') {
        out.push({ tradeId: t.id, deviation: r.deviation, level: r.level });
      }
    }
    return out;
  }

  /**
   * 内部：取得所有当前未完成且已锁价的 trade。
   */
  private collectLockedTrades(): OtcTrade[] {
    // 通过 settlementEngine 的 getter 拉：演示用 getClientTrades / getMakerTrades 不便全量
    // 这里直接复用内部的 trades 映射（仅用于 check）
    return (this.settlementEngine as unknown as { trades: Map<string, OtcTrade> }).trades
      ? Array.from((this.settlementEngine as unknown as { trades: Map<string, OtcTrade> }).trades.values()).filter(
        (t) => t.status === 'locked' || t.status === 'settling' || t.status === 'accepted',
      )
      : [];
  }

  // -------------------------------------------------------------------------
  // 内部 emit
  // -------------------------------------------------------------------------

  private emitRfqCreated(e: OtcRfqCreatedEvent): void {
    for (const h of this.rfqCreatedHandlers) {
      try { h(e); } catch { /* 静默 */ }
    }
  }

  private emitQuoteReceived(e: OtcQuoteReceivedEvent): void {
    for (const h of this.quoteReceivedHandlers) {
      try { h(e); } catch { /* 静默 */ }
    }
  }

  private emitQuoteAccepted(e: OtcQuoteAcceptedEvent): void {
    for (const h of this.quoteAcceptedHandlers) {
      try { h(e); } catch { /* 静默 */ }
    }
  }

  private emitTradeCompleted(e: OtcTradeCompletedEvent): void {
    for (const h of this.tradeCompletedHandlers) {
      try { h(e); } catch { /* 静默 */ }
    }
  }

  /**
   * 同步计算 trade 的 priceDeviation（在结算前可调用）。
   */
  computeTradeDeviation(trade: OtcTrade, currentPrice: string): number {
    return calcPriceDeviation(trade.lockedPrice, currentPrice);
  }
}

function genTradeId(quoteId: string): string {
  return `otc_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}_${quoteId.slice(-4)}`;
}

function defaultNotifier(event: { type: string; payload: unknown; timestamp: number }): void {
  // 演示降级：默认 no-op
  void event;
  // eslint-disable-next-line no-console
  // console.log('[otc]', event.type, event.payload);
}

export default OtcEngine;
