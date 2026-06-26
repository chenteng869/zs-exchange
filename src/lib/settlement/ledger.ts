/**
 * Append-only 账本
 *
 *  - 所有余额变动（冻结、解冻、成交、划转、手续费）都应 append 一条记录
 *  - 记录不可修改、不可删除（生产环境应使用数据库 unique 约束 + 哈希链）
 *  - 内存版用数组模拟，仅用于单进程测试/撮合
 */

import type { ID, ISODate, Paginated, Decimal } from '@/types/models';

export type LedgerType =
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'TRADE_BUY'
  | 'TRADE_SELL'
  | 'FEE'
  | 'FREEZE'
  | 'UNFREEZE'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUST';

export interface LedgerEntry {
  id: ID;
  ts: ISODate;
  userId: ID;
  type: LedgerType;
  asset: string;
  /** 变动金额（正=入账，负=出账） */
  amount: Decimal;
  /** 变动后余额 */
  balance: Decimal;
  /** 关联订单/成交/划转等 */
  refId?: ID;
  /** 备注 */
  memo?: string;
  /** 序号（递增） */
  seq: number;
}

export class Ledger {
  private entries: LedgerEntry[] = [];
  private seq = 0;

  /**
   * 追加一条流水。
   * 返回新写入的 entry。
   */
  appendEntry(params: {
    userId: ID;
    type: LedgerType;
    asset: string;
    amount: Decimal;
    balance: Decimal;
    refId?: ID;
    memo?: string;
  }): LedgerEntry {
    this.seq++;
    const entry: LedgerEntry = {
      id: `ld_${this.seq.toString(36)}_${Date.now().toString(36)}`,
      ts: new Date().toISOString(),
      seq: this.seq,
      ...params,
    };
    this.entries.push(entry);
    return entry;
  }

  /** 获取用户账本。 */
  getUserLedger(
    userId: ID,
    params: { page?: number; pageSize?: number; asset?: string; type?: LedgerType } = {}
  ): Paginated<LedgerEntry> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.max(1, Math.min(200, params.pageSize ?? 20));
    let filtered = this.entries.filter((e) => e.userId === userId);
    if (params.asset) filtered = filtered.filter((e) => e.asset === params.asset);
    if (params.type) filtered = filtered.filter((e) => e.type === params.type);
    filtered = filtered.slice().sort((a, b) => b.seq - a.seq);
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);
    return { list, total, page, pageSize };
  }

  /** 测试用：清空账本。 */
  reset(): void {
    this.entries = [];
    this.seq = 0;
  }

  /** 测试用：总条数。 */
  size(): number {
    return this.entries.length;
  }

  /** 测试用：导出所有。 */
  dump(): LedgerEntry[] {
    return this.entries.slice();
  }
}

/** 全局单例（内存版）。 */
export const globalLedger = new Ledger();
