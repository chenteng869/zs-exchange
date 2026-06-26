/**
 * 做市商返佣引擎 (RebateEngine)
 *
 * 功能：
 *  - 手续费返佣计算：calculateRebate(trade, marketMaker)
 *  - 记录返佣：recordRebate(trade, marketMaker)
 *  - 日结 / 月结：settleDaily / settleMonthly
 *  - 报表生成：getReport
 *  - 黑名单：banned marketMaker 不发放返佣
 *
 * 返佣公式：
 *   volume = price * quantity
 *   rebate = volume * rebateRate
 *   小于 MM_REBATE_MIN 的返佣视为粉尘不记录
 */

import { decAdd, decMul, decTruncate, decIsZero } from '@/lib/matching/decimal';
import {
  type MarketMaker,
  type RebateRecord,
  type RebateSettlement,
  MM_REBATE_MIN,
} from './types';

export interface RebateInput {
  tradeId: string;
  symbol: string;
  side: 'bid' | 'ask';
  price: string;
  quantity: string;
}

export class RebateEngine {
  /** marketMakerId -> 返佣记录 */
  private readonly records = new Map<string, RebateRecord[]>();
  /** marketMakerId -> 返佣总额 (string) */
  private readonly totals = new Map<string, string>();
  /** 黑名单 */
  private readonly blacklist = new Set<string>();
  /** 已结算的窗口（marketMakerId -> lastSettledAt ms） */
  private readonly lastSettled = new Map<string, number>();

  // -------------------------------------------------------------------------
  // 返佣计算
  // -------------------------------------------------------------------------

  /**
   * 计算返佣。
   *  - 当 rebateRate <= 0 时返佣 = 0
   *  - 否则 rebate = volume * rebateRate
   */
  calculateRebate(trade: RebateInput, marketMaker: MarketMaker): string {
    if (this.blacklist.has(marketMaker.id)) return '0';
    if (marketMaker.status !== 'active') return '0';
    if (marketMaker.rebateRate <= 0) return '0';

    const volume = decMul(trade.price, trade.quantity);
    const rebate = decTruncate(decMul(volume, String(marketMaker.rebateRate)), 8);
    return rebate;
  }

  /**
   * 记录一笔返佣（保存 + 累计）。
   *  - 当 rebate < MM_REBATE_MIN 时不记录（粉尘）
   */
  recordRebate(trade: RebateInput, marketMaker: MarketMaker): RebateRecord {
    const rebate = this.calculateRebate(trade, marketMaker);
    const skip = decIsZero(rebate) || parseFloat(rebate) < parseFloat(MM_REBATE_MIN);
    if (skip) {
      return {
        id: '',
        marketMakerId: marketMaker.id,
        tradeId: trade.tradeId,
        symbol: trade.symbol,
        side: trade.side,
        volume: decMul(trade.price, trade.quantity),
        rebate: '0',
        timestamp: Date.now(),
      };
    }
    const rec: RebateRecord = {
      id: `reb_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`,
      marketMakerId: marketMaker.id,
      tradeId: trade.tradeId,
      symbol: trade.symbol,
      side: trade.side,
      volume: decMul(trade.price, trade.quantity),
      rebate,
      timestamp: Date.now(),
    };
    const list = this.records.get(marketMaker.id) ?? [];
    list.push(rec);
    this.records.set(marketMaker.id, list);
    this.addToTotal(marketMaker.id, rebate);
    return rec;
  }

  // -------------------------------------------------------------------------
  // 结算
  // -------------------------------------------------------------------------

  /**
   * 日结：结算 [start, start+24h) 区间内的所有返佣，返回结算单。
   *  - 实际资金由上游 ledger 完成，本类只产出报表
   */
  settleDaily(marketMaker: MarketMaker, dayStart: number, dayEnd: number = dayStart + 24 * 3600 * 1000): RebateSettlement {
    return this.settle(marketMaker, dayStart, dayEnd);
  }

  /**
   * 月结（30 天窗口）。
   */
  settleMonthly(marketMaker: MarketMaker, monthStart: number, monthEnd: number = monthStart + 30 * 24 * 3600 * 1000): RebateSettlement {
    return this.settle(marketMaker, monthStart, monthEnd);
  }

  /**
   * 通用结算。
   */
  settle(marketMaker: MarketMaker, start: number, end: number): RebateSettlement {
    const all = this.records.get(marketMaker.id) ?? [];
    const inRange = all.filter((r) => r.timestamp >= start && r.timestamp < end);
    let totalVolume = '0';
    let totalRebate = '0';
    for (const r of inRange) {
      totalVolume = decAdd(totalVolume, r.volume);
      totalRebate = decAdd(totalRebate, r.rebate);
    }
    this.lastSettled.set(marketMaker.id, end);
    return {
      marketMakerId: marketMaker.id,
      period: { start, end },
      totalVolume: decTruncate(totalVolume, 8),
      totalRebate: decTruncate(totalRebate, 8),
      recordCount: inRange.length,
      settledAt: Date.now(),
    };
  }

  // -------------------------------------------------------------------------
  // 报表 / 查询
  // -------------------------------------------------------------------------

  /** 取所有返佣记录。 */
  getRecords(marketMakerId: string): RebateRecord[] {
    return [...(this.records.get(marketMakerId) ?? [])];
  }

  /** 取指定区间的返佣记录。 */
  getRecordsInRange(marketMakerId: string, start: number, end: number): RebateRecord[] {
    return (this.records.get(marketMakerId) ?? []).filter(
      (r) => r.timestamp >= start && r.timestamp < end,
    );
  }

  /** 取累计返佣。 */
  getTotalRebate(marketMakerId: string): string {
    return this.totals.get(marketMakerId) ?? '0';
  }

  /** 生成做市商报表。 */
  getReport(marketMaker: MarketMaker, start: number, end: number) {
    const inRange = this.getRecordsInRange(marketMaker.id, start, end);
    const totalVolume = inRange.reduce((acc, r) => decAdd(acc, r.volume), '0');
    const totalRebate = inRange.reduce((acc, r) => decAdd(acc, r.rebate), '0');
    return {
      marketMakerId: marketMaker.id,
      name: marketMaker.name,
      period: { start, end },
      tradeCount: inRange.length,
      totalVolume: decTruncate(totalVolume, 8),
      totalRebate: decTruncate(totalRebate, 8),
      averageRebatePerTrade: inRange.length === 0 ? '0' : decTruncate(decMul(totalRebate, String(1 / inRange.length)), 8),
    };
  }

  // -------------------------------------------------------------------------
  // 黑名单
  // -------------------------------------------------------------------------

  /** 加入黑名单。 */
  addToBlacklist(marketMakerId: string): void {
    this.blacklist.add(marketMakerId);
  }

  /** 移出黑名单。 */
  removeFromBlacklist(marketMakerId: string): void {
    this.blacklist.delete(marketMakerId);
  }

  isBlacklisted(marketMakerId: string): boolean {
    return this.blacklist.has(marketMakerId);
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private addToTotal(marketMakerId: string, rebate: string) {
    const prev = this.totals.get(marketMakerId) ?? '0';
    this.totals.set(marketMakerId, decAdd(prev, rebate));
  }
}
