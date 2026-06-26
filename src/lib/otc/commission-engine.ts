/**
 * CommissionEngine — OTC 佣金引擎
 *
 * 职责：
 *  - 佣金规则管理（按做市商 / 撮合器人 / 全局）
 *  - 佣金计算（sales 0.05% / maker 0.10% / platform 0.05%）
 *  - 记录
 *  - 结算（pending → paid）
 *  - 业绩报表（按撮合器人 / 做市商 / 客户）
 *
 * 默认费率（OTC_COMMISSION_RATES）：
 *  - sales    : 0.0005 (0.05%)
 *  - maker    : 0.001  (0.10%)
 *  - platform : 0.0005 (0.05%)
 *
 * 用法：
 *   const engine = new CommissionEngine();
 *   engine.setRule({ id, type: 'sales', rate: 0.0005, isActive: true, ... });
 *   const list = engine.calculateCommission(trade);     // 返回 3 条佣金
 *   const settled = engine.settle(trade.id);
 */

import { decAdd, decCmp, decMul } from '@/lib/matching/decimal';
import type {
  CommissionRule,
  OtcCommission,
  OtcCommissionType,
  OtcStats,
  OtcTrade,
} from './types';
import { OTC_COMMISSION_RATES, computeCommissionAmount } from './types';

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export class CommissionEngine {
  private readonly rules = new Map<string, CommissionRule>();
  private readonly commissions = new Map<string, OtcCommission>();
  private readonly tradeCommissions = new Map<string, string[]>();
  private readonly salespersonCommissions = new Map<string, string[]>();
  private readonly makerCommissions = new Map<string, string[]>();
  private readonly clientCommissions = new Map<string, string[]>();

  // -------------------------------------------------------------------------
  // 规则
  // -------------------------------------------------------------------------

  setRule(rule: CommissionRule): CommissionRule {
    if (!rule?.id) throw new Error('rule.id is required');
    if (rule.rate < 0) throw new Error('rule.rate must be >= 0');
    this.rules.set(rule.id, { ...rule });
    return rule;
  }

  getRule(id: string): CommissionRule | null {
    return this.rules.get(id) ?? null;
  }

  /**
   * 取得某撮合器人 + 类型的生效规则。
   *  优先级：salesperson-specific > maker-specific > global
   */
  getEffectiveRule(
    type: OtcCommissionType,
    opts: { salespersonId?: string; makerId?: string } = {},
  ): CommissionRule | null {
    const candidates: CommissionRule[] = [];
    for (const r of this.rules.values()) {
      if (!r.isActive) continue;
      if (r.type !== type) continue;
      if (r.salespersonId && r.salespersonId === opts.salespersonId) candidates.push(r);
      else if (r.makerId && r.makerId === opts.makerId) candidates.push(r);
      else if (!r.salespersonId && !r.makerId) candidates.push(r);
    }
    if (candidates.length === 0) return null;
    // 优先级排序
    candidates.sort((a, b) => {
      const aScore = (a.salespersonId ? 2 : 0) + (a.makerId ? 1 : 0);
      const bScore = (b.salespersonId ? 2 : 0) + (b.makerId ? 1 : 0);
      return bScore - aScore;
    });
    return candidates[0];
  }

  getRules(filter?: { salespersonId?: string; makerId?: string }): CommissionRule[] {
    const out: CommissionRule[] = [];
    for (const r of this.rules.values()) {
      if (filter?.salespersonId !== undefined && r.salespersonId !== filter.salespersonId) continue;
      if (filter?.makerId !== undefined && r.makerId !== filter.makerId) continue;
      out.push(r);
    }
    return out;
  }

  removeRule(id: string): void {
    this.rules.delete(id);
  }

  // -------------------------------------------------------------------------
  // 计算
  // -------------------------------------------------------------------------

  /**
   * 计算一笔成交的三方佣金（sales / maker / platform）。
   *  - baseAmount = trade.quoteAmount（计价币）
   *  - 优先用自定义 rule，否则用 OTC_COMMISSION_RATES
   *  - 不写库，仅返回 OtcCommission[]（status='pending'）
   */
  calculateCommission(
    trade: OtcTrade,
    opts: { salespersonId?: string } = {},
  ): OtcCommission[] {
    if (!trade?.id) throw new Error('trade.id is required');
    const base = trade.quoteAmount;
    const out: OtcCommission[] = [];

    for (const type of ['sales', 'maker', 'platform'] as OtcCommissionType[]) {
      const rule = this.getEffectiveRule(type, { salespersonId: opts.salespersonId, makerId: trade.makerId });
      const rate = rule?.rate ?? OTC_COMMISSION_RATES[type];
      if (rate <= 0) continue;
      const amount = computeCommissionAmount(base, rate);
      if (decCmp(amount, '0') === 0) continue;
      const id = genId('cm');
      out.push({
        id,
        tradeId: trade.id,
        salespersonId: type === 'sales' ? opts.salespersonId : undefined,
        makerId: type === 'maker' ? trade.makerId : '',
        clientId: trade.clientId,
        type,
        baseAmount: base,
        rate,
        amount,
        status: 'pending',
        createdAt: Date.now(),
      });
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // 记录
  // -------------------------------------------------------------------------

  /**
   * 写入佣金记录。
   */
  record(commission: OtcCommission): OtcCommission {
    if (!commission?.id) commission.id = genId('cm');
    if (!commission.tradeId) throw new Error('commission.tradeId is required');
    this.commissions.set(commission.id, commission);
    this.appendTradeCommission(commission.tradeId, commission.id);
    if (commission.salespersonId) this.appendSalespersonCommission(commission.salespersonId, commission.id);
    if (commission.makerId) this.appendMakerCommission(commission.makerId, commission.id);
    this.appendClientCommission(commission.clientId, commission.id);
    return commission;
  }

  /**
   * 一次性记录 calculateCommission 的结果。
   */
  recordForTrade(trade: OtcTrade, opts: { salespersonId?: string } = {}): OtcCommission[] {
    const list = this.calculateCommission(trade, opts);
    for (const c of list) this.record(c);
    return list;
  }

  getCommission(id: string): OtcCommission | null {
    return this.commissions.get(id) ?? null;
  }

  getTradeCommissions(tradeId: string): OtcCommission[] {
    const ids = this.tradeCommissions.get(tradeId) ?? [];
    const arr: OtcCommission[] = [];
    for (const id of ids) {
      const c = this.commissions.get(id);
      if (c) arr.push(c);
    }
    return arr;
  }

  getSalespersonCommissions(salespersonId: string, period?: { start: number; end: number }): OtcCommission[] {
    return this.filterByPeriod(this.salespersonCommissions.get(salespersonId) ?? [], period);
  }

  getMakerCommissions(makerId: string, period?: { start: number; end: number }): OtcCommission[] {
    return this.filterByPeriod(this.makerCommissions.get(makerId) ?? [], period);
  }

  getClientCommissions(clientId: string, period?: { start: number; end: number }): OtcCommission[] {
    return this.filterByPeriod(this.clientCommissions.get(clientId) ?? [], period);
  }

  // -------------------------------------------------------------------------
  // 结算
  // -------------------------------------------------------------------------

  /**
   * 结算一笔成交的佣金（pending → paid）。
   */
  settle(tradeId: string): OtcCommission[] {
    const list = this.getTradeCommissions(tradeId);
    const out: OtcCommission[] = [];
    for (const c of list) {
      if (c.status === 'pending') {
        c.status = 'paid';
        out.push(c);
      }
    }
    return out;
  }

  /**
   * 批量结算（按 salespersonId / makerId / period）。
   */
  settleBatch(filter: { salespersonId?: string; makerId?: string; period?: { start: number; end: number } }): OtcCommission[] {
    let ids: string[] = [];
    if (filter.salespersonId) ids = this.salespersonCommissions.get(filter.salespersonId) ?? [];
    else if (filter.makerId) ids = this.makerCommissions.get(filter.makerId) ?? [];
    else return [];

    const out: OtcCommission[] = [];
    for (const id of ids) {
      const c = this.commissions.get(id);
      if (!c) continue;
      if (filter.period && (c.createdAt < filter.period.start || c.createdAt > filter.period.end)) continue;
      if (c.status === 'pending') {
        c.status = 'paid';
        out.push(c);
      }
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // 报表
  // -------------------------------------------------------------------------

  /**
   * 撮合器人业绩统计。
   */
  getSalespersonStats(salespersonId: string, period: { start: number; end: number }): OtcStats {
    const list = this.getSalespersonCommissions(salespersonId, period);
    return aggregateStats(`sp_${salespersonId}`, list, period);
  }

  /**
   * 做市商业绩统计。
   */
  getMakerStats(makerId: string, period: { start: number; end: number }): OtcStats {
    const list = this.getMakerCommissions(makerId, period);
    return aggregateStats(`mk_${makerId}`, list, period);
  }

  /**
   * 客户业绩统计。
   */
  getClientStats(clientId: string, period: { start: number; end: number }): OtcStats {
    const list = this.getClientCommissions(clientId, period);
    return aggregateStats(`cl_${clientId}`, list, period);
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private filterByPeriod(ids: string[], period?: { start: number; end: number }): OtcCommission[] {
    const out: OtcCommission[] = [];
    for (const id of ids) {
      const c = this.commissions.get(id);
      if (!c) continue;
      if (period && (c.createdAt < period.start || c.createdAt > period.end)) continue;
      out.push(c);
    }
    return out;
  }

  private appendTradeCommission(tradeId: string, id: string): void {
    const arr = this.tradeCommissions.get(tradeId);
    if (arr) arr.push(id);
    else this.tradeCommissions.set(tradeId, [id]);
  }

  private appendSalespersonCommission(salespersonId: string, id: string): void {
    const arr = this.salespersonCommissions.get(salespersonId);
    if (arr) arr.push(id);
    else this.salespersonCommissions.set(salespersonId, [id]);
  }

  private appendMakerCommission(makerId: string, id: string): void {
    const arr = this.makerCommissions.get(makerId);
    if (arr) arr.push(id);
    else this.makerCommissions.set(makerId, [id]);
  }

  private appendClientCommission(clientId: string, id: string): void {
    const arr = this.clientCommissions.get(clientId);
    if (arr) arr.push(id);
    else this.clientCommissions.set(clientId, [id]);
  }

  size(): number {
    return this.commissions.size;
  }
}

function aggregateStats(userId: string, list: OtcCommission[], period: { start: number; end: number }): OtcStats {
  // 按 tradeId 去重 → 每个 trade 算一笔
  const seenTrade = new Set<string>();
  const trades: OtcCommission[] = [];
  for (const c of list) {
    if (seenTrade.has(c.tradeId)) continue;
    seenTrade.add(c.tradeId);
    trades.push(c);
  }
  let totalCommission = '0';
  let totalVolume = '0';
  let bestPrice = '';
  let worstPrice = '';
  for (const c of list) {
    totalCommission = decAdd(totalCommission, c.amount);
  }
  // 单笔均价 = total / trades count（用 c.baseAmount 求和）
  let baseSum = '0';
  for (const c of trades) baseSum = decAdd(baseSum, c.baseAmount);
  totalVolume = baseSum;
  const tradeCount = trades.length;
  const averageSize = tradeCount > 0 ? decMul(baseSum, String(1 / tradeCount)) : '0';

  return {
    userId,
    period,
    totalTrades: tradeCount,
    totalVolume,
    totalCommission,
    averageSize,
    bestPrice,
    worstPrice,
  };
}

export default CommissionEngine;
