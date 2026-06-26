/**
 * 资金冻结 / 解冻 / 划转
 *
 *  - 维护 in-memory Balance 表：Map<userId-asset, Balance>
 *  - 内部使用 decimal string 严格计算
 *  - 每次变动都 append 账本流水
 *  - 真正的"原子性"在生产环境应由数据库事务保证；本实现在出错时回滚已应用变更
 */

import type { Balance, ID, ISODate, Decimal } from '@/types/models';
import { decAdd, decCmp, decIsNegative, decIsPositive, decIsZero, decSub } from '@/lib/matching/decimal';
import { SettlementError } from '@/lib/matching/errors';
import { globalLedger, Ledger, type LedgerType } from './ledger';

function key(userId: ID, asset: string): string {
  return `${userId}::${asset}`;
}

/** 默认余额结构 */
function emptyBalance(userId: ID, asset: string): Balance {
  return {
    userId,
    asset,
    available: '0',
    frozen: '0',
    locked: '0',
    btcValue: '0',
    usdtValue: '0',
    updatedAt: new Date().toISOString(),
  };
}

export class Freezer {
  private readonly balances = new Map<string, Balance>();
  private readonly ledger: Ledger;

  constructor(ledger: Ledger = globalLedger) {
    this.ledger = ledger;
  }

  /** 设置余额（仅用于初始化/测试）。 */
  setBalance(userId: ID, asset: string, available: string, frozen: string = '0'): Balance {
    const bal = emptyBalance(userId, asset);
    bal.available = available;
    bal.frozen = frozen;
    this.balances.set(key(userId, asset), bal);
    return bal;
  }

  /** 读取余额。 */
  getBalance(userId: ID, asset: string): Balance {
    let bal = this.balances.get(key(userId, asset));
    if (!bal) {
      bal = emptyBalance(userId, asset);
      this.balances.set(key(userId, asset), bal);
    }
    return { ...bal };
  }

  /**
   * 冻结：available -> frozen。
   * 若可用不足抛 SettlementError。
   */
  freeze(userId: ID, asset: string, amount: string, refId?: ID, memo?: string): Balance {
    if (!decIsPositive(amount)) {
      throw new SettlementError('INSUFFICIENT_AVAILABLE', 'freeze amount must be > 0');
    }
    const bal = this.getOrCreate(userId, asset);
    if (decCmp(bal.available, amount) < 0) {
      throw new SettlementError('INSUFFICIENT_AVAILABLE', `available ${bal.available} < ${amount}`);
    }
    bal.available = decSub(bal.available, amount);
    bal.frozen = decAdd(bal.frozen, amount);
    bal.updatedAt = new Date().toISOString();
    this.persist(bal);
    this.ledger.appendEntry({
      userId,
      type: 'FREEZE',
      asset,
      amount: '-' + amount,
      balance: bal.available,
      refId,
      memo,
    });
    return { ...bal };
  }

  /**
   * 解冻：frozen -> available。
   * 若 frozen 不足抛错。
   */
  unfreeze(userId: ID, asset: string, amount: string, refId?: ID, memo?: string): Balance {
    if (!decIsPositive(amount)) {
      throw new SettlementError('INSUFFICIENT_FROZEN', 'unfreeze amount must be > 0');
    }
    const bal = this.getOrCreate(userId, asset);
    if (decCmp(bal.frozen, amount) < 0) {
      throw new SettlementError('INSUFFICIENT_FROZEN', `frozen ${bal.frozen} < ${amount}`);
    }
    bal.frozen = decSub(bal.frozen, amount);
    bal.available = decAdd(bal.available, amount);
    bal.updatedAt = new Date().toISOString();
    this.persist(bal);
    this.ledger.appendEntry({
      userId,
      type: 'UNFREEZE',
      asset,
      amount: amount,
      balance: bal.available,
      refId,
      memo,
    });
    return { ...bal };
  }

  /**
   * 内部转账：from -> to，amount 走 user1.available 扣减 + user2.available 增加。
   * 同步 append 两条 ledger 记录。
   */
  transfer(
    fromUserId: ID,
    toUserId: ID,
    asset: string,
    amount: string,
    refId?: ID,
    memo?: string
  ): { from: Balance; to: Balance } {
    if (!decIsPositive(amount)) {
      throw new SettlementError('INSUFFICIENT_AVAILABLE', 'transfer amount must be > 0');
    }
    const fromBal = this.getOrCreate(fromUserId, asset);
    if (decCmp(fromBal.available, amount) < 0) {
      throw new SettlementError('INSUFFICIENT_AVAILABLE', `available ${fromBal.available} < ${amount}`);
    }
    fromBal.available = decSub(fromBal.available, amount);
    fromBal.updatedAt = new Date().toISOString();
    this.persist(fromBal);
    this.ledger.appendEntry({
      userId: fromUserId,
      type: 'TRANSFER_OUT',
      asset,
      amount: '-' + amount,
      balance: fromBal.available,
      refId,
      memo,
    });

    const toBal = this.getOrCreate(toUserId, asset);
    toBal.available = decAdd(toBal.available, amount);
    toBal.updatedAt = new Date().toISOString();
    this.persist(toBal);
    this.ledger.appendEntry({
      userId: toUserId,
      type: 'TRANSFER_IN',
      asset,
      amount: amount,
      balance: toBal.available,
      refId,
      memo,
    });
    return { from: { ...fromBal }, to: { ...toBal } };
  }

  /**
   * 直接从 frozen 中"消耗"：用于成交时把 maker 的 quote 解冻并划给对手。
   * 内部会写两条流水（DEBIT/CREDIT）。
   */
  consumeFromFrozen(userId: ID, asset: string, amount: string, refId?: ID, memo?: string): Balance {
    if (!decIsPositive(amount)) {
      throw new SettlementError('INSUFFICIENT_FROZEN', 'amount must be > 0');
    }
    const bal = this.getOrCreate(userId, asset);
    if (decCmp(bal.frozen, amount) < 0) {
      throw new SettlementError('INSUFFICIENT_FROZEN', `frozen ${bal.frozen} < ${amount}`);
    }
    bal.frozen = decSub(bal.frozen, amount);
    bal.updatedAt = new Date().toISOString();
    this.persist(bal);
    this.ledger.appendEntry({
      userId,
      type: 'UNFREEZE',
      asset,
      amount: amount,
      balance: bal.available,
      refId,
      memo: (memo ?? '') + ' [consume]',
    });
    return { ...bal };
  }

  /**
   * 单纯入账（不冻结）：用于结算接收方/手续费。
   */
  credit(userId: ID, asset: string, amount: string, type: LedgerType = 'ADJUST', refId?: ID, memo?: string): Balance {
    if (decIsNegative(amount)) {
      throw new SettlementError('NEGATIVE_BALANCE', 'credit amount must be >= 0');
    }
    const bal = this.getOrCreate(userId, asset);
    bal.available = decAdd(bal.available, amount);
    bal.updatedAt = new Date().toISOString();
    this.persist(bal);
    this.ledger.appendEntry({
      userId,
      type,
      asset,
      amount,
      balance: bal.available,
      refId,
      memo,
    });
    return { ...bal };
  }

  /**
   * 单纯扣减（不冻结）：用于手续费 / 提现等。
   */
  debit(userId: ID, asset: string, amount: string, type: LedgerType = 'ADJUST', refId?: ID, memo?: string): Balance {
    if (!decIsPositive(amount)) {
      throw new SettlementError('NEGATIVE_BALANCE', 'debit amount must be > 0');
    }
    const bal = this.getOrCreate(userId, asset);
    if (decCmp(bal.available, amount) < 0) {
      throw new SettlementError('INSUFFICIENT_AVAILABLE', `available ${bal.available} < ${amount}`);
    }
    bal.available = decSub(bal.available, amount);
    bal.updatedAt = new Date().toISOString();
    this.persist(bal);
    this.ledger.appendEntry({
      userId,
      type,
      asset,
      amount: '-' + amount,
      balance: bal.available,
      refId,
      memo,
    });
    return { ...bal };
  }

  /** 测试用：清空。 */
  reset(): void {
    this.balances.clear();
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private getOrCreate(userId: ID, asset: string): Balance {
    let bal = this.balances.get(key(userId, asset));
    if (!bal) {
      bal = emptyBalance(userId, asset);
      this.balances.set(key(userId, asset), bal);
    }
    return bal;
  }

  private persist(bal: Balance) {
    if (decIsNegative(bal.available) || decIsNegative(bal.frozen) || decIsNegative(bal.locked)) {
      throw new SettlementError('NEGATIVE_BALANCE', `negative balance for ${bal.userId} ${bal.asset}`);
    }
    this.balances.set(key(bal.userId, bal.asset), bal);
  }
}
