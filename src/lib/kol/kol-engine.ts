/**
 * KolEngine — KOL 业务层 + 集成层
 *
 * 职责：
 *  - 整合 KolService / ReferralService / CommissionEngine / CopyTradingService
 *  - 集成 OrderEngine：监听 KOL 成交 → 触发 commission + copy
 *  - 事件订阅：onKolTrade / onCommission / onCopyTrade
 *  - 报表：getKolReport / getTopKol
 *
 * 用法：
 *   const engine = new KolEngine({ matchingEngine });
 *   engine.bindMatchingEngine(matchingEngine);
 *   const kol = engine.applyKol('user_1', { displayName: 'Alice' });
 *   engine.approveKol(kol.id, 'macro');
 *   engine.bindUserToKol('user_X', kol.referralCode);
 *
 *   // 监听
 *   engine.onCommission(c => console.log('commission', c.amount));
 *   engine.onCopyTrade(t => console.log('copy trade', t.copyQuantity));
 */

import type { MatchingEngine } from '@/lib/matching/engine';
import { decAdd, decCmp, decIsZero, decTruncate } from '@/lib/matching/decimal';
import { KolService } from './kol-service';
import { ReferralService, type KolLookup } from './referral-service';
import { CommissionEngine, type SettlementPeriod } from './commission-engine';
import { CopyTradingService } from './copy-trading';
import type {
  Commission,
  CommissionEvent,
  CommissionType,
  CopyTrade,
  CopyTradeEvent,
  Kol,
  KolOrderLike,
  KolStats,
  KolTier,
  KolTradeEvent,
  Referral,
  Unsubscribe,
} from './types';

export interface KolEngineDeps {
  matchingEngine?: MatchingEngine;
  kolService?: KolService;
  referralService?: ReferralService;
  commissionEngine?: CommissionEngine;
  copyTradingService?: CopyTradingService;
}

export interface TriggerCommissionInput {
  userId: string;          // 交易用户
  type: CommissionType;
  baseAmount: string;      // 交易量
  sourceTxId: string;
}

/** Trade 事件回调签名（与 OrderEngine Trade 兼容）。 */
export interface KolCompatibleTrade {
  id: string;
  userId: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: string;
  quantity: string;
  quoteQty?: string;
  executedAt?: string | number;
}

export class KolEngine implements KolLookup {
  private readonly kolService: KolService;
  private readonly referralService: ReferralService;
  private readonly commissionEngine: CommissionEngine;
  private readonly copyTradingService: CopyTradingService;
  private matchingEngine?: MatchingEngine;

  private readonly kolTradeHandlers: Set<(e: KolTradeEvent) => void> = new Set();
  private readonly commissionHandlers: Set<(e: CommissionEvent) => void> = new Set();
  private readonly copyTradeHandlers: Set<(e: CopyTradeEvent) => void> = new Set();

  private unsubscribeMatching: (() => void) | null = null;

  constructor(deps: KolEngineDeps = {}) {
    this.kolService = deps.kolService ?? new KolService();
    this.referralService = deps.referralService ?? new ReferralService();
    this.commissionEngine = deps.commissionEngine ?? new CommissionEngine();
    this.copyTradingService = deps.copyTradingService ?? new CopyTradingService();
    this.matchingEngine = deps.matchingEngine;
  }

  // -------------------------------------------------------------------------
  // 子模块访问
  // -------------------------------------------------------------------------

  getKolService(): KolService { return this.kolService; }
  getReferralService(): ReferralService { return this.referralService; }
  getCommissionEngine(): CommissionEngine { return this.commissionEngine; }
  getCopyTradingService(): CopyTradingService { return this.copyTradingService; }

  // KolLookup 适配
  getKol(id: string): Kol | null { return this.kolService.getKol(id); }
  getKolByUserId(userId: string): Kol | null { return this.kolService.getKolByUserId(userId); }
  getKolByReferralCode(code: string): Kol | null { return this.kolService.getKolByReferralCode(code); }

  // -------------------------------------------------------------------------
  // 便捷方法
  // -------------------------------------------------------------------------

  applyKol(userId: string, opts: Parameters<KolService['applyKol']>[1]): Kol {
    return this.kolService.applyKol(userId, opts);
  }
  approveKol(id: string, tier?: KolTier): Kol {
    return this.kolService.approveKol(id, tier);
  }
  suspendKol(id: string, reason: string): Kol { return this.kolService.suspendKol(id, reason); }
  banKol(id: string, reason: string): Kol { return this.kolService.banKol(id, reason); }

  bindUserToKol(userId: string, referralCode: string): Referral {
    return this.referralService.bindReferral(userId, referralCode, this);
  }

  unbindUser(userId: string): void { this.referralService.unbindReferral(userId); }

  createCopyConfig(input: Parameters<CopyTradingService['createConfig']>[0]) {
    return this.copyTradingService.createConfig(input);
  }

  /**
   * 触发跟单（KolEngine 包装，会发出 onCopyTrade 事件）。
   *  - 业务层应使用此方法而非直接调用 service.onKolTrade
   */
  async triggerCopyTrade(kolOrder: KolOrderLike, kolUserId: string): Promise<CopyTrade[]> {
    const trades = await this.copyTradingService.onKolTrade(kolOrder, kolUserId);
    for (const t of trades) {
      this.emitCopyTrade({ copyTrade: t, timestamp: Date.now() });
    }
    return trades;
  }

  // -------------------------------------------------------------------------
  // 集成 OrderEngine
  // -------------------------------------------------------------------------

  /**
   * 绑定 OrderEngine。监听 'orderMatched' 事件：
   *  - 如果 userId 是一个 active KOL → 触发 onKolTrade（跟单）
   *  - 如果 userId 是一个普通用户 → 触发 commission 计算
   */
  bindMatchingEngine(engine: MatchingEngine): void {
    if (this.unsubscribeMatching) {
      this.unsubscribeMatching();
    }
    this.matchingEngine = engine;
    const handler = (payload: unknown) => {
      const obj = (payload ?? {}) as { trades?: KolCompatibleTrade[]; order?: KolCompatibleTrade };
      const trades: KolCompatibleTrade[] = obj.trades ?? (obj.order ? [obj.order] : []);
      for (const t of trades) {
        this.onTrade(t);
      }
    };
    engine.on('orderMatched', handler as (p: unknown) => void);
    this.unsubscribeMatching = () => engine.off('orderMatched', handler as (p: unknown) => void);
  }

  unbindMatchingEngine(): void {
    if (this.unsubscribeMatching) {
      this.unsubscribeMatching();
      this.unsubscribeMatching = null;
    }
  }

  /**
   * 内部：处理一条成交。
   */
  private async onTrade(trade: KolCompatibleTrade): Promise<void> {
    const kol = this.kolService.getKolByUserId(trade.userId);

    if (kol && kol.status === 'active') {
      // KOL 成交 → 触发跟单
      const kolOrder: KolOrderLike = {
        id: trade.id,
        userId: trade.userId,
        symbol: trade.symbol,
        side: trade.side,
        price: trade.price,
        quantity: trade.quantity,
        quoteQty: trade.quoteQty,
        executedAt: typeof trade.executedAt === 'number' ? trade.executedAt : Date.now(),
      };
      this.emitKolTrade({ kolId: kol.id, kolUserId: kol.userId, trade: kolOrder, timestamp: Date.now() });
      const copyTrades = await this.triggerCopyTrade(kolOrder, kol.userId);
      void copyTrades;
      return;
    }

    // 普通用户成交 → 计算返佣（L1/L2/L3）
    const baseAmount = trade.quoteQty ?? decTruncate((Number(trade.price) * Number(trade.quantity)).toString(), 8);
    this.triggerCommissions({
      userId: trade.userId,
      type: 'spot',
      baseAmount: baseAmount || trade.quantity,
      sourceTxId: trade.id,
    });
  }

  /**
   * 主动触发返佣（手动 / 入金 / 出金等场景）。
   */
  triggerCommissions(input: TriggerCommissionInput): Commission[] {
    const chain = this.referralService.getReferralChain(input.userId);
    if (chain.length === 0) return [];

    const out: Commission[] = [];
    for (const ref of chain) {
      if (ref.status !== 'active') continue;
      const amount = this.commissionEngine.calculateCommission(
        input.baseAmount,
        input.type,
        ref.kolId,
        ref.level,
        this,
      );
      if (decIsZero(amount)) continue;

      const levelRate = (1 / 1) * 1; // placeholder
      const commission = this.commissionEngine.recordCommission({
        kolId: ref.kolId,
        referralId: ref.id,
        userId: input.userId,
        type: input.type,
        baseAmount: input.baseAmount,
        rate: levelRate,
        amount,
        level: ref.level,
        sourceTxId: input.sourceTxId,
      });
      // 累计 referral 业绩
      this.referralService.updateTradingVolume(ref.id, input.baseAmount, amount);
      // 累计 KOL totalCommission / pendingCommission
      const kol = this.kolService.getKol(ref.kolId);
      if (kol) {
        kol.totalCommission = decAdd(kol.totalCommission, amount);
        kol.pendingCommission = decAdd(kol.pendingCommission, amount);
      }
      out.push(commission);
      this.emitCommission({ commission, timestamp: Date.now() });
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // 事件订阅
  // -------------------------------------------------------------------------

  onKolTrade(handler: (e: KolTradeEvent) => void): Unsubscribe {
    this.kolTradeHandlers.add(handler);
    return () => this.kolTradeHandlers.delete(handler);
  }

  onCommission(handler: (e: CommissionEvent) => void): Unsubscribe {
    this.commissionHandlers.add(handler);
    return () => this.commissionHandlers.delete(handler);
  }

  onCopyTrade(handler: (e: CopyTradeEvent) => void): Unsubscribe {
    this.copyTradeHandlers.add(handler);
    return () => this.copyTradeHandlers.delete(handler);
  }

  private emitKolTrade(e: KolTradeEvent): void {
    for (const h of this.kolTradeHandlers) {
      try { h(e); } catch { /* 静默 */ }
    }
  }

  private emitCommission(e: CommissionEvent): void {
    for (const h of this.commissionHandlers) {
      try { h(e); } catch { /* 静默 */ }
    }
  }

  private emitCopyTrade(e: CopyTradeEvent): void {
    for (const h of this.copyTradeHandlers) {
      try { h(e); } catch { /* 静默 */ }
    }
  }

  // -------------------------------------------------------------------------
  // 报表
  // -------------------------------------------------------------------------

  /**
   * 取得某 KOL 的业绩报表。
   */
  getKolReport(kolId: string, period: SettlementPeriod): KolStats {
    const kol = this.kolService.getKol(kolId);
    if (!kol) throw new Error(`kol ${kolId} not found`);

    const downline = this.referralService.getDownline(kolId);
    const active = downline.filter((r) => r.status === 'active');

    let totalVolume = '0';
    let totalCommission = '0';
    const byLevel: Record<number, { count: number; volume: string; commission: string }> = {
      1: { count: 0, volume: '0', commission: '0' },
      2: { count: 0, volume: '0', commission: '0' },
      3: { count: 0, volume: '0', commission: '0' },
    };
    for (const r of downline) {
      totalVolume = decAdd(totalVolume, r.totalTradingVolume);
      totalCommission = decAdd(totalCommission, r.totalCommission);
      const lv = r.level;
      if (!byLevel[lv]) byLevel[lv] = { count: 0, volume: '0', commission: '0' };
      byLevel[lv].count += 1;
      byLevel[lv].volume = decAdd(byLevel[lv].volume, r.totalTradingVolume);
      byLevel[lv].commission = decAdd(byLevel[lv].commission, r.totalCommission);
    }

    // 排序 topReferrals by volume
    const topReferrals = [...downline].sort((a, b) => decCmp(b.totalTradingVolume, a.totalTradingVolume)).slice(0, 10);

    const avg = active.length === 0
      ? '0'
      : decTruncate((Number(totalCommission) / active.length).toString(), 8);

    return {
      kolId,
      period,
      totalFollowers: downline.length,
      activeFollowers: active.length,
      totalTradingVolume: totalVolume,
      totalCommission: totalCommission,
      averageCommissionPerUser: avg,
      rank: 0,
      topReferrals,
      byLevel,
    };
  }

  /**
   * 排行榜 Top KOL。
   */
  getTopKol(period: SettlementPeriod, limit: number = 10): KolStats[] {
    return this.kolService.getLeaderboard(period, limit, (id) => this.getKolReport(id, period));
  }
}

export default KolEngine;
