/**
 * RfqEngine — 询价（Request for Quote）引擎
 *
 * 职责：
 *  - 创建 RFQ（询价单）
 *  - 邀请做市商
 *  - 做市商报价
 *  - 报价选择（按价格 / 速度 / 评级）
 *  - 接受报价 → 状态机推进
 *  - 取消 RFQ
 *
 * 状态机：
 *   rfq → quoting → quoted → accepted → locked → settling → completed
 *
 * 用法：
 *   const engine = new RfqEngine({ makerRegistry });
 *   const rfq = engine.createRfq({ clientId, clientUserId, side: 'buy', baseAsset: 'BTC', quoteAsset: 'USDT', baseAmount: '10', settlementType: 'stablecoin' });
 *   engine.inviteMakers(rfq.id, ['mm_xxx','mm_yyy']);
 *   const quote = engine.submitQuote({ rfqId, makerId, price: '68000', settlementType: 'stablecoin' });
 *   const best = engine.selectBestQuote(rfq.id, 'price');
 *   const accepted = engine.acceptQuote(best.id);
 */

import { decCmp, decMul } from '@/lib/matching/decimal';
import type {
  OtcQuote,
  OtcSide,
  OtcStatus,
  OtcMaker,
  Rfq,
  SettlementType,
  QuoteStatus,
} from './types';
import {
  OTC_QUOTE_DEFAULT_TTL_SEC,
  OTC_QUOTE_MAX_TTL_SEC,
  OTC_RFQ_DEFAULT_TTL_SEC,
  OTC_RFQ_MAX_INVITED_MAKERS,
} from './types';
import { OtcMakerRegistry } from './market-maker-registry';

export interface RfqCreateOptions {
  clientId: string;
  clientUserId: string;
  side: OtcSide;
  baseAsset: string;
  quoteAsset: string;
  baseAmount: string;
  quoteAmount?: string;
  settlementType: SettlementType;
  settlementNetwork?: string;
  isPrivate?: boolean;
  invitedMakers?: string[];
  ttlSec?: number;
  notes?: string;
  /** 报价中价参考价（用于计算 spread；可选）。 */
  midPrice?: string;
}

export interface SubmitQuoteOptions {
  rfqId: string;
  makerId: string;
  price: string;
  settlementType?: SettlementType;
  settlementTime?: number;
  validSec?: number;
  midPrice?: string;
}

export type SelectionCriteria = 'price' | 'speed' | 'rating';

/** OtcMaker 适配（供引擎使用）。 */
export interface MakerLookup {
  getMaker(id: string): OtcMaker | null;
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** 状态机推进表。 */
const NEXT_STATUS: Record<OtcStatus, OtcStatus[]> = {
  rfq: ['quoting', 'cancelled', 'expired'],
  quoting: ['quoted', 'cancelled', 'expired'],
  quoted: ['accepted', 'cancelled', 'expired'],
  accepted: ['locked', 'cancelled', 'expired'],
  locked: ['settling', 'cancelled', 'expired'],
  settling: ['completed', 'failed'],
  completed: [],
  cancelled: [],
  expired: [],
  failed: [],
};

export class RfqEngine {
  private readonly makerLookup: MakerLookup;
  /** rfqId -> Rfq */
  private readonly rfqs = new Map<string, Rfq>();
  /** quoteId -> OtcQuote */
  private readonly quotes = new Map<string, OtcQuote>();
  /** rfqId -> quoteIds[] */
  private readonly rfqQuotes = new Map<string, string[]>();
  /** clientId -> rfqIds[] */
  private readonly clientRfqs = new Map<string, string[]>();
  /** makerId -> quoteIds[] */
  private readonly makerQuotes = new Map<string, string[]>();

  constructor(deps: { makerRegistry?: OtcMakerRegistry } = {}) {
    this.makerLookup = deps.makerRegistry ?? new OtcMakerRegistry();
  }

  // -------------------------------------------------------------------------
  // RFQ 创建
  // -------------------------------------------------------------------------

  createRfq(opts: RfqCreateOptions): Rfq {
    if (!opts?.clientId) throw new Error('clientId is required');
    if (!opts?.clientUserId) throw new Error('clientUserId is required');
    if (!opts?.baseAsset || !opts?.quoteAsset) {
      throw new Error('baseAsset and quoteAsset are required');
    }
    if (decCmp(opts.baseAmount, '0') <= 0) {
      throw new Error('baseAmount must be > 0');
    }
    if (opts.invitedMakers && opts.invitedMakers.length > OTC_RFQ_MAX_INVITED_MAKERS) {
      throw new Error(`too many invited makers (max ${OTC_RFQ_MAX_INVITED_MAKERS})`);
    }
    const now = Date.now();
    const ttl = (opts.ttlSec ?? OTC_RFQ_DEFAULT_TTL_SEC) * 1000;
    const id = genId('rfq');
    const rfq: Rfq = {
      id,
      clientId: opts.clientId,
      clientUserId: opts.clientUserId,
      side: opts.side,
      baseAsset: opts.baseAsset,
      quoteAsset: opts.quoteAsset,
      baseAmount: opts.baseAmount,
      quoteAmount: opts.quoteAmount ?? decMul(opts.baseAmount, opts.midPrice ?? '1'),
      settlementType: opts.settlementType,
      settlementNetwork: opts.settlementNetwork,
      status: 'rfq',
      isPrivate: opts.isPrivate ?? false,
      invitedMakers: [...(opts.invitedMakers ?? [])],
      quotes: [],
      expiresAt: now + ttl,
      createdAt: now,
      notes: opts.notes,
    };
    this.rfqs.set(id, rfq);
    this.appendClientRfq(opts.clientId, id);

    // 如果带了邀请做市商 → 直接进 quoting
    if (rfq.invitedMakers.length > 0) {
      this.transition(rfq, 'quoting');
    }
    return rfq;
  }

  /**
   * 邀请做市商（可多次调用）。
   */
  inviteMakers(rfqId: string, makerIds: string[]): Rfq {
    const rfq = this.requireRfq(rfqId);
    if (rfq.status === 'cancelled' || rfq.status === 'expired' || rfq.status === 'completed' || rfq.status === 'failed') {
      throw new Error(`rfq ${rfqId} is ${rfq.status}, cannot invite`);
    }
    for (const id of makerIds) {
      if (rfq.invitedMakers.includes(id)) continue;
      const m = this.makerLookup.getMaker(id);
      if (!m) {
        throw new Error(`maker ${id} not found`);
      }
      if (m.status !== 'active') {
        throw new Error(`maker ${id} is not active (status=${m.status})`);
      }
      rfq.invitedMakers.push(id);
    }
    // 状态推进到 quoting（如还在 rfq）
    if (rfq.status === 'rfq') {
      this.transition(rfq, 'quoting');
    }
    return rfq;
  }

  /**
   * 取消 RFQ。
   */
  cancelRfq(rfqId: string, _reason?: string): Rfq {
    const rfq = this.requireRfq(rfqId);
    if (rfq.status === 'completed' || rfq.status === 'failed') {
      throw new Error(`rfq ${rfqId} is ${rfq.status}, cannot cancel`);
    }
    this.transition(rfq, 'cancelled');
    // 关联报价撤回
    for (const qid of rfq.quotes) {
      const q = this.quotes.get(qid);
      if (q && (q.status === 'active' || q.status === 'pending')) {
        q.status = 'withdrawn';
      }
    }
    return rfq;
  }

  // -------------------------------------------------------------------------
  // 报价
  // -------------------------------------------------------------------------

  /**
   * 做市商提交报价。
   */
  submitQuote(opts: SubmitQuoteOptions): OtcQuote {
    const rfq = this.requireRfq(opts.rfqId);
    if (rfq.status === 'cancelled' || rfq.status === 'expired' || rfq.status === 'completed' || rfq.status === 'failed') {
      throw new Error(`rfq ${opts.rfqId} is ${rfq.status}, cannot quote`);
    }
    if (Date.now() > rfq.expiresAt) {
      this.transition(rfq, 'expired');
      throw new Error(`rfq ${opts.rfqId} has expired`);
    }
    const maker = this.makerLookup.getMaker(opts.makerId);
    if (!maker) throw new Error(`maker ${opts.makerId} not found`);
    if (maker.status !== 'active') {
      throw new Error(`maker ${opts.makerId} is not active`);
    }
    if (rfq.isPrivate && !rfq.invitedMakers.includes(opts.makerId)) {
      throw new Error(`maker ${opts.makerId} is not invited to this private RFQ`);
    }
    if (decCmp(opts.price, '0') <= 0) {
      throw new Error('price must be > 0');
    }

    const now = Date.now();
    const validSec = Math.min(opts.validSec ?? OTC_QUOTE_DEFAULT_TTL_SEC, OTC_QUOTE_MAX_TTL_SEC);
    const baseAmount = rfq.baseAmount;
    const quoteAmount = decMul(baseAmount, opts.price);
    // 报价方方向：相对询价方反向
    const quoteSide: OtcSide = rfq.side === 'buy' ? 'sell' : 'buy';
    // 报价 spread（相对 midPrice，未提供则 0）
    const spread = opts.midPrice
      ? Math.abs(Number(opts.price) - Number(opts.midPrice)) / Number(opts.midPrice)
      : 0;

    const id = genId('qot');
    const quote: OtcQuote = {
      id,
      rfqId: rfq.id,
      makerId: opts.makerId,
      makerName: maker.name,
      side: quoteSide,
      baseAsset: rfq.baseAsset,
      quoteAsset: rfq.quoteAsset,
      price: opts.price,
      baseAmount,
      quoteAmount,
      spread,
      validUntil: now + validSec * 1000,
      settlementType: opts.settlementType ?? rfq.settlementType,
      settlementTime: opts.settlementTime ?? estimateSettlementTime(opts.settlementType ?? rfq.settlementType),
      status: 'active',
      createdAt: now,
    };
    this.quotes.set(id, quote);
    this.appendRfqQuote(rfq.id, id);
    this.appendMakerQuote(opts.makerId, id);

    // 推进 RFQ 状态
    if (rfq.status === 'rfq' || rfq.status === 'quoting') {
      this.transition(rfq, 'quoted');
    }
    return quote;
  }

  /**
   * 做市商撤回报价。
   */
  withdrawQuote(quoteId: string): OtcQuote {
    const q = this.requireQuote(quoteId);
    if (q.status !== 'active' && q.status !== 'pending') {
      throw new Error(`quote ${quoteId} is ${q.status}, cannot withdraw`);
    }
    q.status = 'withdrawn';
    return q;
  }

  /**
   * 取得 RFQ 的所有有效报价。
   */
  getQuotes(rfqId: string): OtcQuote[] {
    const ids = this.rfqQuotes.get(rfqId) ?? [];
    const arr: OtcQuote[] = [];
    const now = Date.now();
    for (const id of ids) {
      const q = this.quotes.get(id);
      if (!q) continue;
      // 自动过期
      if ((q.status === 'active' || q.status === 'pending') && q.validUntil < now) {
        q.status = 'expired';
      }
      arr.push(q);
    }
    return arr;
  }

  /**
   * 取得 RFQ 的有效（active）报价。
   */
  getActiveQuotes(rfqId: string): OtcQuote[] {
    return this.getQuotes(rfqId).filter((q) => q.status === 'active' && q.validUntil > Date.now());
  }

  /**
   * 按条件选择最优报价。
   *  - 'price'  : 询价方 buy → 选最低；询价方 sell → 选最高
   *  - 'speed'  : 选 settlementTime 最小
   *  - 'rating' : 选做市商 rating 最高
   */
  selectBestQuote(rfqId: string, criteria: SelectionCriteria = 'price'): OtcQuote | null {
    const candidates = this.getActiveQuotes(rfqId);
    if (candidates.length === 0) return null;
    const rfq = this.requireRfq(rfqId);
    if (criteria === 'price') {
      return [...candidates].sort((a, b) => {
        // buy → 越低越好；sell → 越高越好
        return rfq.side === 'buy' ? decCmp(a.price, b.price) : decCmp(b.price, a.price);
      })[0];
    }
    if (criteria === 'speed') {
      return [...candidates].sort((a, b) => a.settlementTime - b.settlementTime)[0];
    }
    if (criteria === 'rating') {
      return [...candidates].sort((a, b) => {
        const ra = this.makerLookup.getMaker(a.makerId)?.rating ?? 0;
        const rb = this.makerLookup.getMaker(b.makerId)?.rating ?? 0;
        return rb - ra;
      })[0];
    }
    return null;
  }

  /**
   * 客户接受报价。
   *  - 推进 RFQ 状态：quoted → accepted
   *  - 关联报价状态：active → accepted
   *  - 同 RFQ 其他报价撤回
   *  - 返回被接受的报价
   */
  acceptQuote(quoteId: string): OtcQuote {
    const q = this.requireQuote(quoteId);
    if (q.status !== 'active') {
      throw new Error(`quote ${quoteId} is not active (status=${q.status})`);
    }
    if (q.validUntil <= Date.now()) {
      q.status = 'expired';
      throw new Error(`quote ${quoteId} has expired`);
    }
    const rfq = this.requireRfq(q.rfqId);
    if (rfq.status === 'cancelled' || rfq.status === 'expired' || rfq.status === 'completed' || rfq.status === 'failed') {
      throw new Error(`rfq ${rfq.id} is ${rfq.status}, cannot accept`);
    }

    q.status = 'accepted';
    rfq.acceptedQuoteId = q.id;
    rfq.acceptedAt = Date.now();
    if (rfq.status === 'rfq' || rfq.status === 'quoting' || rfq.status === 'quoted') {
      this.transition(rfq, 'accepted');
    }

    // 其他 active 报价撤回
    for (const qid of rfq.quotes) {
      if (qid === q.id) continue;
      const oq = this.quotes.get(qid);
      if (oq && oq.status === 'active') oq.status = 'withdrawn';
    }
    return q;
  }

  // -------------------------------------------------------------------------
  // 状态机
  // -------------------------------------------------------------------------

  /**
   * 内部：状态机推进。
   */
  private transition(rfq: Rfq, next: OtcStatus): void {
    if (rfq.status === next) return;
    const allowed = NEXT_STATUS[rfq.status] ?? [];
    if (!allowed.includes(next)) {
      // 允许一些幂等的过渡（如 accepted 后被业务层强制改 locked）
      if (rfq.status === 'completed' || rfq.status === 'cancelled' || rfq.status === 'failed' || rfq.status === 'expired') {
        return;
      }
    }
    rfq.status = next;
  }

  // -------------------------------------------------------------------------
  // 查询
  // -------------------------------------------------------------------------

  getRfq(id: string): Rfq | null {
    return this.rfqs.get(id) ?? null;
  }

  getQuote(id: string): OtcQuote | null {
    return this.quotes.get(id) ?? null;
  }

  getClientRfqs(clientId: string, limit?: number): Rfq[] {
    const ids = this.clientRfqs.get(clientId) ?? [];
    const arr: Rfq[] = [];
    for (const id of ids) {
      const r = this.rfqs.get(id);
      if (r) arr.push(r);
    }
    arr.sort((a, b) => b.createdAt - a.createdAt);
    return limit ? arr.slice(0, limit) : arr;
  }

  getMakerQuotes(makerId: string, limit?: number): OtcQuote[] {
    const ids = this.makerQuotes.get(makerId) ?? [];
    const arr: OtcQuote[] = [];
    for (const id of ids) {
      const q = this.quotes.get(id);
      if (q) arr.push(q);
    }
    arr.sort((a, b) => b.createdAt - a.createdAt);
    return limit ? arr.slice(0, limit) : arr;
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private requireRfq(id: string): Rfq {
    const r = this.rfqs.get(id);
    if (!r) throw new Error(`rfq ${id} not found`);
    return r;
  }

  private requireQuote(id: string): OtcQuote {
    const q = this.quotes.get(id);
    if (!q) throw new Error(`quote ${id} not found`);
    return q;
  }

  private appendClientRfq(clientId: string, id: string): void {
    const arr = this.clientRfqs.get(clientId);
    if (arr) arr.push(id);
    else this.clientRfqs.set(clientId, [id]);
  }

  private appendRfqQuote(rfqId: string, id: string): void {
    const arr = this.rfqQuotes.get(rfqId);
    if (arr) arr.push(id);
    else this.rfqQuotes.set(rfqId, [id]);
    const rfq = this.rfqs.get(rfqId);
    if (rfq) rfq.quotes.push(id);
  }

  private appendMakerQuote(makerId: string, id: string): void {
    const arr = this.makerQuotes.get(makerId);
    if (arr) arr.push(id);
    else this.makerQuotes.set(makerId, [id]);
  }

  size(): number {
    return this.rfqs.size;
  }
}

/** 估算结算时间（毫秒）。 */
function estimateSettlementTime(type: SettlementType): number {
  if (type === 'onchain') return 30 * 60_000;       // 30 min
  if (type === 'fiat') return 1 * 24 * 3600_000;    // 1 day
  if (type === 'stablecoin') return 5 * 60_000;     // 5 min
  return 10 * 60_000;
}

export default RfqEngine;
