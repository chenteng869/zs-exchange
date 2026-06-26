/**
 * CommissionEngine — KOL 返佣引擎
 *
 * 职责：
 *  - 规则管理：setRule / getRule / getRules
 *  - 返佣计算：calculateCommission (单级 / 多级)
 *    - L1: 30%
 *    - L2: 10%
 *    - L3: 5%
 *  - 记录：recordCommission
 *  - 查询：getKolCommissions / getUserCommissions
 *  - 结算：settleKol / paySettlement
 *
 * 用法：
 *   const engine = new CommissionEngine();
 *   engine.setRule({ id, type: 'spot', rate: 0.001, isActive: true, ... });
 *   const amount = engine.calculateCommission('10000', 'spot', kolId, 'L1');
 *   const c = engine.recordCommission({ kolId, referralId, userId, type, baseAmount, rate, amount, level, sourceTxId });
 */

import { decAdd, decGte, decIsZero, decMul, decTruncate } from '@/lib/matching/decimal';
import type {
  Commission,
  CommissionRule,
  CommissionType,
  Kol,
  Settlement,
} from './types';
import {
  KOL_COMMISSION_LEVELS,
  KOL_DEFAULT_COMMISSION_RATES,
  KOL_MAX_LEVEL,
  KOL_SETTLEMENT_MIN_AMOUNT,
} from './types';

export interface RecordCommissionInput {
  kolId: string;
  referralId: string;
  userId: string;
  type: CommissionType;
  baseAmount: string;
  rate: number;
  amount: string;
  level: number;
  sourceTxId: string;
}

export interface SettlementPeriod {
  start: number;
  end: number;
}

export interface KolLookupForCommission {
  getKol(id: string): Kol | null;
}

export class CommissionEngine {
  /** ruleId -> CommissionRule */
  private readonly rules = new Map<string, CommissionRule>();
  /** commissionId -> Commission */
  private readonly commissions = new Map<string, Commission>();
  /** settlementId -> Settlement */
  private readonly settlements = new Map<string, Settlement>();
  /** kolId -> commissionIds[] */
  private readonly kolCommissions = new Map<string, string[]>();
  /** userId -> commissionIds[] */
  private readonly userCommissions = new Map<string, string[]>();
  /** kolId -> paid settlement id（已结最近一次） */
  private readonly lastSettled = new Map<string, string>();

  private readonly minSettlementAmount: string;

  constructor(opts: { minSettlementAmount?: string } = {}) {
    this.minSettlementAmount = opts.minSettlementAmount ?? KOL_SETTLEMENT_MIN_AMOUNT;
  }

  // -------------------------------------------------------------------------
  // 规则
  // -------------------------------------------------------------------------

  setRule(rule: CommissionRule): CommissionRule {
    if (!rule?.id) throw new Error('rule.id is required');
    if (rule.rate < 0) throw new Error('rule.rate must be >= 0');
    this.rules.set(rule.id, { ...rule });
    return rule;
  }

  /**
   * 获取某 KOL + type 的生效规则。
   *  优先级：kol-specific > tier-specific > type default
   */
  getRule(kolId: string, type: CommissionType, tier?: Kol['tier']): CommissionRule | null {
    const now = Date.now();
    const candidates: CommissionRule[] = [];
    for (const r of this.rules.values()) {
      if (!r.isActive) continue;
      if (r.type !== type) continue;
      if (r.effectiveFrom > now) continue;
      if (r.effectiveTo && r.effectiveTo < now) continue;
      if (r.kolId && r.kolId === kolId) candidates.push(r);
      else if (!r.kolId && r.tier && r.tier === tier) candidates.push(r);
      else if (!r.kolId && !r.tier) candidates.push(r);
    }
    if (candidates.length === 0) return null;
    // 优先 kol-specific > tier > global
    candidates.sort((a, b) => {
      const aScore = (a.kolId ? 2 : 0) + (a.tier ? 1 : 0);
      const bScore = (b.kolId ? 2 : 0) + (b.tier ? 1 : 0);
      return bScore - aScore;
    });
    return candidates[0];
  }

  getRules(kolId?: string): CommissionRule[] {
    const arr: CommissionRule[] = [];
    for (const r of this.rules.values()) {
      if (kolId !== undefined && r.kolId !== kolId) continue;
      arr.push(r);
    }
    return arr;
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  // -------------------------------------------------------------------------
  // 计算
  // -------------------------------------------------------------------------

  /**
   * 计算单级返佣。
   *  - 优先使用 rule.rate，其次 KOL_DEFAULT_COMMISSION_RATES[type]
   *  - kol.customCommissionRate 最高优先
   */
  calculateCommission(
    baseAmount: string,
    type: CommissionType,
    kolId: string,
    level: number,
    kolLookup: KolLookupForCommission,
  ): string {
    if (decIsZero(baseAmount)) return '0';
    if (level < 1 || level > KOL_MAX_LEVEL) {
      throw new Error(`invalid level ${level}, must be 1..${KOL_MAX_LEVEL}`);
    }

    const kol = kolLookup.getKol(kolId);
    const tier = kol?.tier;

    // 1) 自定义费率最高
    if (kol?.customCommissionRate !== undefined) {
      const levelRate = KOL_COMMISSION_LEVELS[level as 1 | 2 | 3];
      return decTruncate(decMul(baseAmount, decMul(String(kol.customCommissionRate), String(levelRate))), 8);
    }

    // 2) 规则
    const rule = this.getRule(kolId, type, tier);
    let baseRate = rule?.rate ?? KOL_DEFAULT_COMMISSION_RATES[type];

    // 3) tier 调整：celebrity 等级加 50%
    if (tier === 'celebrity') baseRate *= 1.5;
    else if (tier === 'mega') baseRate *= 1.2;
    else if (tier === 'macro') baseRate *= 1.1;

    // 4) 应用 level 比例
    const levelRate = KOL_COMMISSION_LEVELS[level as 1 | 2 | 3];
    const totalRate = baseRate * levelRate;
    return decTruncate(decMul(baseAmount, String(totalRate)), 8);
  }

  /**
   * 计算多级返佣（按 level 1/2/3 分别计算）。
   *  - 入参为整条 referral 链（含 KOL id + level）
   *  - 返回每级返佣金额的数组
   */
  calculateMultiLevel(
    baseAmount: string,
    type: CommissionType,
    chain: Array<{ kolId: string; level: number }>,
    kolLookup: KolLookupForCommission,
  ): string[] {
    return chain.map((c) => this.calculateCommission(baseAmount, type, c.kolId, c.level, kolLookup));
  }

  // -------------------------------------------------------------------------
  // 记录
  // -------------------------------------------------------------------------

  recordCommission(input: RecordCommissionInput): Commission {
    if (!input.kolId) throw new Error('kolId is required');
    if (!input.userId) throw new Error('userId is required');
    if (!input.sourceTxId) throw new Error('sourceTxId is required');

    const now = Date.now();
    const commission: Commission = {
      id: `com_${now.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`,
      kolId: input.kolId,
      referralId: input.referralId,
      userId: input.userId,
      type: input.type,
      baseAmount: input.baseAmount,
      rate: input.rate,
      amount: input.amount,
      level: input.level,
      sourceTxId: input.sourceTxId,
      status: 'pending',
      createdAt: now,
    };
    this.commissions.set(commission.id, commission);
    this.appendKolCommission(input.kolId, commission.id);
    this.appendUserCommission(input.userId, commission.id);
    return commission;
  }

  /**
   * 确认 pending → confirmed（结算窗口结束时）。
   */
  confirmCommission(id: string): Commission {
    const c = this.commissions.get(id);
    if (!c) throw new Error(`commission ${id} not found`);
    if (c.status !== 'pending') {
      throw new Error(`commission ${id} is not pending (current: ${c.status})`);
    }
    c.status = 'confirmed';
    c.confirmedAt = Date.now();
    return c;
  }

  /**
   * 标记为 paid（结算发放时）。
   */
  payCommission(id: string): Commission {
    const c = this.commissions.get(id);
    if (!c) throw new Error(`commission ${id} not found`);
    if (c.status !== 'confirmed' && c.status !== 'pending') {
      throw new Error(`commission ${id} cannot be paid from status ${c.status}`);
    }
    c.status = 'paid';
    c.paidAt = Date.now();
    return c;
  }

  revokeCommission(id: string): Commission {
    const c = this.commissions.get(id);
    if (!c) throw new Error(`commission ${id} not found`);
    c.status = 'revoked';
    return c;
  }

  // -------------------------------------------------------------------------
  // 查询
  // -------------------------------------------------------------------------

  getCommission(id: string): Commission | null {
    return this.commissions.get(id) ?? null;
  }

  getKolCommissions(kolId: string, period?: SettlementPeriod): Commission[] {
    const ids = this.kolCommissions.get(kolId) ?? [];
    const arr: Commission[] = [];
    for (const id of ids) {
      const c = this.commissions.get(id);
      if (!c) continue;
      if (period && (c.createdAt < period.start || c.createdAt > period.end)) continue;
      arr.push(c);
    }
    return arr;
  }

  getUserCommissions(userId: string): Commission[] {
    const ids = this.userCommissions.get(userId) ?? [];
    const arr: Commission[] = [];
    for (const id of ids) {
      const c = this.commissions.get(id);
      if (c) arr.push(c);
    }
    return arr;
  }

  /**
   * KOL 在某时间区间内的待结金额（pending + confirmed）。
   */
  getPendingAmount(kolId: string, period?: SettlementPeriod): string {
    const arr = this.getKolCommissions(kolId, period);
    let sum = '0';
    for (const c of arr) {
      if (c.status === 'pending' || c.status === 'confirmed') {
        sum = decAdd(sum, c.amount);
      }
    }
    return sum;
  }

  // -------------------------------------------------------------------------
  // 结算
  // -------------------------------------------------------------------------

  /**
   * 结算某 KOL 在某时间区间内的返佣。
   *  - 默认 100 USDT 起结
   *  - 实际结算金额 < minAmount → 返回 status='pending' 但不发放（写明原因）
   */
  settleKol(kolId: string, period: SettlementPeriod, txId?: string): Settlement {
    const amount = this.getPendingAmount(kolId, period);
    const now = Date.now();
    const settlement: Settlement = {
      id: `stl_${now.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`,
      kolId,
      period,
      totalAmount: amount,
      status: 'pending',
      createdAt: now,
      transactionId: txId,
    };

    if (decIsZero(amount)) {
      // 0 金额 → 直接标 failed
      settlement.status = 'failed';
      this.settlements.set(settlement.id, settlement);
      return settlement;
    }
    if (!decGte(amount, this.minSettlementAmount)) {
      // 不够起结额 → 不发放，标 pending 等待累计
      this.settlements.set(settlement.id, settlement);
      return settlement;
    }

    // 金额足够 → 直接发放（status = paid）
    settlement.status = 'paid';
    settlement.paidAt = now;

    // 把 pending/confirmed commissions 全部 mark paid
    const list = this.getKolCommissions(kolId, period);
    for (const c of list) {
      if (c.status === 'pending' || c.status === 'confirmed') {
        c.status = 'paid';
        c.paidAt = now;
      }
    }

    this.settlements.set(settlement.id, settlement);
    this.lastSettled.set(kolId, settlement.id);
    return settlement;
  }

  /**
   * 标记 settlement 已支付（外部链上 tx 确认后回调）。
   */
  paySettlement(settlementId: string, txId?: string): Settlement {
    const s = this.settlements.get(settlementId);
    if (!s) throw new Error(`settlement ${settlementId} not found`);
    if (s.status === 'paid') return s;
    if (s.status !== 'pending') {
      throw new Error(`settlement ${settlementId} cannot be paid from status ${s.status}`);
    }
    s.status = 'paid';
    s.paidAt = Date.now();
    if (txId) s.transactionId = txId;
    this.lastSettled.set(s.kolId, s.id);

    // mark commissions paid
    const list = this.getKolCommissions(s.kolId, s.period);
    for (const c of list) {
      if (c.status === 'pending' || c.status === 'confirmed') {
        c.status = 'paid';
        c.paidAt = s.paidAt!;
      }
    }
    return s;
  }

  getSettlement(id: string): Settlement | null {
    return this.settlements.get(id) ?? null;
  }

  getKolSettlements(kolId: string): Settlement[] {
    const arr: Settlement[] = [];
    for (const s of this.settlements.values()) {
      if (s.kolId === kolId) arr.push(s);
    }
    arr.sort((a, b) => b.createdAt - a.createdAt);
    return arr;
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private appendKolCommission(kolId: string, id: string): void {
    const arr = this.kolCommissions.get(kolId);
    if (arr) arr.push(id);
    else this.kolCommissions.set(kolId, [id]);
  }

  private appendUserCommission(userId: string, id: string): void {
    const arr = this.userCommissions.get(userId);
    if (arr) arr.push(id);
    else this.userCommissions.set(userId, [id]);
  }

  size(): number {
    return this.commissions.size;
  }

  settlementSize(): number {
    return this.settlements.size;
  }
}

export default CommissionEngine;
