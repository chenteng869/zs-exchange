/**
 * SettlementEngine — OTC 结算引擎
 *
 * 职责：
 *  - 链上结算（监听 6+ 块确认）
 *  - 法币结算（集成 FiatEngine）
 *  - 稳定币结算（链上但走稳定币通道）
 *  - 通用 settle(tradeId) 自动选方式
 *
 * 演示降级：
 *  - 链上：模拟生成 tx hash，记录到 trade
 *  - 法币：调用 FiatEngine（如有）；否则生成法币流水号
 *  - 稳定币：模拟链上转账
 *
 * 用法：
 *   const engine = new SettlementEngine({ fiatEngine, lockService });
 *   const trade = await engine.settleOnchain('trade_1');
 *   const trade = await engine.settleFiat('trade_2');
 */

import type { OtcTrade, OtcStatus, SettlementType } from './types';
import { OTC_SETTLEMENT_CONFIRMATIONS, OTC_SETTLEMENT_TIMEOUT_MS } from './types';
import type { PriceLockService } from './price-lock';

/** 链上结算回调（外部注入，模拟监控交易）。 */
export type OnchainConfirmHook = (params: {
  tradeId: string;
  txHash: string;
  requiredConfirmations: number;
}) => Promise<{ confirmed: boolean; confirmations: number }>;

/** 法币结算回调（外部注入，模拟 SWIFT/SEPA 等）。 */
export type FiatSettleHook = (params: {
  tradeId: string;
  amount: string;
  currency: string;
  network: string;
}) => Promise<{ reference: string; channelReference?: string; status: 'pending' | 'completed' | 'failed' }>;

export interface SettlementEngineOptions {
  priceLockService?: PriceLockService;
  /** 链上确认回调（默认 mock：100ms 后返回 confirmed=true）。 */
  onchainConfirm?: OnchainConfirmHook;
  /** 法币结算回调（默认 mock：100ms 后返回 completed）。 */
  fiatSettle?: FiatSettleHook;
  /** 稳定币结算回调（默认 mock：100ms 后返回 confirmed）。 */
  stablecoinSettle?: OnchainConfirmHook;
  /** 结算超时。 */
  timeoutMs?: number;
}

export class SettlementEngine {
  private readonly priceLockService?: PriceLockService;
  private readonly onchainConfirm: OnchainConfirmHook;
  private readonly fiatSettle: FiatSettleHook;
  private readonly stablecoinSettle: OnchainConfirmHook;
  private readonly timeoutMs: number;
  /** tradeId -> OtcTrade */
  private readonly trades = new Map<string, OtcTrade>();
  /** clientId -> tradeIds[] */
  private readonly clientTrades = new Map<string, string[]>();
  /** makerId -> tradeIds[] */
  private readonly makerTrades = new Map<string, string[]>();

  constructor(opts: SettlementEngineOptions = {}) {
    this.priceLockService = opts.priceLockService;
    this.onchainConfirm = opts.onchainConfirm ?? defaultOnchainConfirm;
    this.fiatSettle = opts.fiatSettle ?? defaultFiatSettle;
    this.stablecoinSettle = opts.stablecoinSettle ?? defaultOnchainConfirm;
    this.timeoutMs = opts.timeoutMs ?? OTC_SETTLEMENT_TIMEOUT_MS;
  }

  // -------------------------------------------------------------------------
  // 登记 / 状态
  // -------------------------------------------------------------------------

  /**
   * 登记一笔成交（由 RfqEngine.acceptQuote 之后调用）。
   *  - 若已登记：返回现有
   */
  registerTrade(trade: OtcTrade): OtcTrade {
    if (this.trades.has(trade.id)) {
      return this.trades.get(trade.id)!;
    }
    this.trades.set(trade.id, trade);
    this.appendClientTrade(trade.clientId, trade.id);
    this.appendMakerTrade(trade.makerId, trade.id);
    return trade;
  }

  getTrade(id: string): OtcTrade | null {
    return this.trades.get(id) ?? null;
  }

  getSettlementStatus(id: string): OtcStatus | null {
    const t = this.trades.get(id);
    return t ? t.status : null;
  }

  getClientTrades(clientId: string, limit?: number): OtcTrade[] {
    const ids = this.clientTrades.get(clientId) ?? [];
    const arr: OtcTrade[] = [];
    for (const id of ids) {
      const t = this.trades.get(id);
      if (t) arr.push(t);
    }
    arr.sort((a, b) => b.createdAt - a.createdAt);
    return limit ? arr.slice(0, limit) : arr;
  }

  getMakerTrades(makerId: string, limit?: number): OtcTrade[] {
    const ids = this.makerTrades.get(makerId) ?? [];
    const arr: OtcTrade[] = [];
    for (const id of ids) {
      const t = this.trades.get(id);
      if (t) arr.push(t);
    }
    arr.sort((a, b) => b.createdAt - a.createdAt);
    return limit ? arr.slice(0, limit) : arr;
  }

  // -------------------------------------------------------------------------
  // 结算
  // -------------------------------------------------------------------------

  /**
   * 自动选结算方式（按 trade.settlementType）。
   */
  async settle(tradeId: string): Promise<OtcTrade> {
    const t = this.requireTrade(tradeId);
    if (t.status === 'completed') return t;
    if (t.status === 'failed') {
      throw new Error(`trade ${tradeId} is failed, cannot settle`);
    }
    if (t.settlementType === 'onchain') return this.settleOnchain(tradeId);
    if (t.settlementType === 'fiat') return this.settleFiat(tradeId);
    if (t.settlementType === 'stablecoin') return this.settleStablecoin(tradeId);
    throw new Error(`unknown settlement type: ${t.settlementType}`);
  }

  /**
   * 链上结算。
   *  - 监听 ≥ OTC_SETTLEMENT_CONFIRMATIONS 块
   *  - 通过后状态 → completed
   */
  async settleOnchain(tradeId: string): Promise<OtcTrade> {
    const t = this.requireTrade(tradeId);
    if (t.status === 'completed') return t;
    if (t.status !== 'locked' && t.status !== 'accepted' && t.status !== 'settling') {
      this.transition(t, 'locked');
    }
    this.transition(t, 'settling');

    // 模拟生成交易哈希
    const clientTx = `0x${randomHex(64)}`;
    const makerTx = `0x${randomHex(64)}`;
    t.clientTxHash = clientTx;
    t.makerTxHash = makerTx;

    // 模拟确认
    const confirmed = await this.waitOnchain({
      tradeId,
      txHash: clientTx,
      requiredConfirmations: OTC_SETTLEMENT_CONFIRMATIONS,
    });

    if (!confirmed) {
      t.status = 'failed';
      this.trades.set(t.id, t);
      throw new Error(`trade ${tradeId} onchain settlement failed (not enough confirmations)`);
    }
    t.status = 'completed';
    t.completedAt = Date.now();
    this.trades.set(t.id, t);
    this.releaseLock(t.id);
    return t;
  }

  /**
   * 法币结算。
   *  - 集成 FiatEngine（演示降级：直接生成 reference）
   */
  async settleFiat(tradeId: string): Promise<OtcTrade> {
    const t = this.requireTrade(tradeId);
    if (t.status === 'completed') return t;
    if (t.status !== 'locked' && t.status !== 'accepted' && t.status !== 'settling') {
      this.transition(t, 'locked');
    }
    this.transition(t, 'settling');

    const network = t.settlementNetwork ?? 'SWIFT';
    const res = await this.waitFiat({
      tradeId,
      amount: t.quoteAmount,
      currency: t.quoteAsset,
      network,
    });
    t.fiatReference = res.reference;
    if (res.status === 'failed') {
      t.status = 'failed';
      this.trades.set(t.id, t);
      throw new Error(`trade ${tradeId} fiat settlement failed: ${res.reference}`);
    }
    if (res.status === 'pending') {
      // pending → 保留 settling 状态，外部回调 completed
      this.trades.set(t.id, t);
      return t;
    }
    t.status = 'completed';
    t.completedAt = Date.now();
    this.trades.set(t.id, t);
    this.releaseLock(t.id);
    return t;
  }

  /**
   * 稳定币结算。
   *  - 走链上通道但接收方是稳定币（USDT / USDC）
   *  - 与链上结算相同确认数
   */
  async settleStablecoin(tradeId: string): Promise<OtcTrade> {
    const t = this.requireTrade(tradeId);
    if (t.status === 'completed') return t;
    if (t.status !== 'locked' && t.status !== 'accepted' && t.status !== 'settling') {
      this.transition(t, 'locked');
    }
    this.transition(t, 'settling');

    const tx = `0x${randomHex(64)}`;
    t.makerTxHash = tx;
    t.clientTxHash = `0x${randomHex(64)}`;

    const confirmed = await this.waitStablecoin({
      tradeId,
      txHash: tx,
      requiredConfirmations: OTC_SETTLEMENT_CONFIRMATIONS,
    });
    if (!confirmed) {
      t.status = 'failed';
      this.trades.set(t.id, t);
      throw new Error(`trade ${tradeId} stablecoin settlement failed`);
    }
    t.status = 'completed';
    t.completedAt = Date.now();
    this.trades.set(t.id, t);
    this.releaseLock(t.id);
    return t;
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private transition(t: OtcTrade, next: OtcStatus): void {
    if (t.status === next) return;
    t.status = next;
  }

  private releaseLock(tradeId: string): void {
    this.priceLockService?.releaseLock(tradeId);
  }

  private requireTrade(id: string): OtcTrade {
    const t = this.trades.get(id);
    if (!t) throw new Error(`otc trade ${id} not found`);
    return t;
  }

  private appendClientTrade(clientId: string, id: string): void {
    const arr = this.clientTrades.get(clientId);
    if (arr) arr.push(id);
    else this.clientTrades.set(clientId, [id]);
  }

  private appendMakerTrade(makerId: string, id: string): void {
    const arr = this.makerTrades.get(makerId);
    if (arr) arr.push(id);
    else this.makerTrades.set(makerId, [id]);
  }

  private async waitOnchain(params: { tradeId: string; txHash: string; requiredConfirmations: number }): Promise<boolean> {
    const r = this.onchainConfirm(params);
    const settled: Promise<boolean> = r.then((res) => res.confirmed);
    return Promise.race<Promise<boolean>>([
      settled,
      timeoutAfter(this.timeoutMs, false),
    ]);
  }

  private async waitStablecoin(params: { tradeId: string; txHash: string; requiredConfirmations: number }): Promise<boolean> {
    const r = this.stablecoinSettle(params);
    const settled: Promise<boolean> = r.then((res) => res.confirmed);
    return Promise.race<Promise<boolean>>([
      settled,
      timeoutAfter(this.timeoutMs, false),
    ]);
  }

  private async waitFiat(params: { tradeId: string; amount: string; currency: string; network: string }): Promise<{ reference: string; channelReference?: string; status: 'pending' | 'completed' | 'failed' }> {
    return Promise.race<Promise<{ reference: string; channelReference?: string; status: 'pending' | 'completed' | 'failed' }>>([
      this.fiatSettle(params),
      timeoutAfter(this.timeoutMs, { reference: 'TIMEOUT', status: 'failed' as const }),
    ]);
  }

  size(): number {
    return this.trades.size;
  }
}

// =============================================================================
// 默认 mock 钩子
// =============================================================================

async function defaultOnchainConfirm(params: { tradeId: string; txHash: string; requiredConfirmations: number }): Promise<{ confirmed: boolean; confirmations: number }> {
  // 演示：sleep 50ms 后直接返回确认
  await new Promise((resolve) => setTimeout(resolve, 50));
  return { confirmed: true, confirmations: params.requiredConfirmations };
}

async function defaultFiatSettle(_params: { tradeId: string; amount: string; currency: string; network: string }): Promise<{ reference: string; channelReference?: string; status: 'pending' | 'completed' | 'failed' }> {
  // 演示：sleep 50ms 后返回 completed + reference
  await new Promise((resolve) => setTimeout(resolve, 50));
  return {
    reference: `FT${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1e6).toString(36).toUpperCase()}`,
    channelReference: `CH${Math.floor(Math.random() * 1e8).toString(36).toUpperCase()}`,
    status: 'completed',
  };
}

function timeoutAfter<T>(ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(fallback), ms));
}

function randomHex(len: number): string {
  const chars = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < len; i += 1) {
    s += chars[Math.floor(Math.random() * 16)];
  }
  return s;
}

export default SettlementEngine;
