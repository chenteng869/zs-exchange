/**
 * 国库服务（TreasuryService）
 *
 * 职责：
 *  - 国库余额管理：deposit / withdraw
 *  - 报表：getMonthlyReport / getRunway / getHistory
 *  - 提案联动：withdraw 需要绑定 proposalId
 *
 * 协作：
 *  - ProposalService → 国库支出需通过提案
 *  - DaoEngine       → 顶层事件分发
 */

import {
  decAdd,
  decCmp,
  decIsPositive,
  decSub,
  decTruncate,
} from '@/lib/matching/decimal';
import { DAO_MONTHLY_BURN, makeDaoId } from './types';
import type { ID, Treasury, TreasuryTransaction } from './types';

// ============================================================================
// 错误
// ============================================================================

export class TreasuryError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'TreasuryError';
  }
}

// ============================================================================
// 事件
// ============================================================================

export type TreasuryEvent =
  | { type: 'deposit'; tx: TreasuryTransaction }
  | { type: 'withdraw'; tx: TreasuryTransaction };

export type TreasuryEventHandler = (event: TreasuryEvent) => void;

// ============================================================================
// 依赖接口
// ============================================================================

/** 提案校验接口（withdraw 需走提案） */
export interface ProposalVerifier {
  /** 提案是否已执行 */
  isExecuted(id: ID): boolean;
  /** 提案是否处于 succeeded/queued/executed 状态 */
  isPassed(id: ID): boolean;
}

class NullProposalVerifier implements ProposalVerifier {
  isExecuted(): boolean {
    return false;
  }
  isPassed(): boolean {
    return false;
  }
}

// ============================================================================
// 引擎
// ============================================================================

export interface TreasuryServiceOptions {
  proposalVerifier?: ProposalVerifier;
  onEvent?: TreasuryEventHandler;
  /** 月度运营成本（用于 runway），默认 50000 USD */
  monthlyBurn?: string;
}

export class TreasuryService {
  private verifier: ProposalVerifier;
  private handler: TreasuryEventHandler | null = null;
  private monthlyBurn: string;

  /** asset -> amount */
  private balances: Map<string, string> = new Map();
  /** asset -> USD 单价（演示用，1 = 1 USD） */
  private priceUsd: Map<string, string> = new Map();
  /** tx */
  private transactions: TreasuryTransaction[] = [];

  constructor(options: TreasuryServiceOptions = {}) {
    this.verifier = options.proposalVerifier || new NullProposalVerifier();
    this.handler = options.onEvent || null;
    this.monthlyBurn = options.monthlyBurn || DAO_MONTHLY_BURN;
    // 默认价格：USDT/USDC = 1
    this.priceUsd.set('USDT', '1');
    this.priceUsd.set('USDC', '1');
    this.priceUsd.set('DAI', '1');
  }

  // ==========================================================================
  // 1. 余额
  // ==========================================================================

  getBalance(asset: string): string {
    return this.balances.get(asset) || '0';
  }

  getAllBalances(): Array<{ asset: string; amount: string; valueUsd: string }> {
    const out: Array<{ asset: string; amount: string; valueUsd: string }> = [];
    for (const [asset, amount] of this.balances.entries()) {
      out.push({
        asset,
        amount,
        valueUsd: this.assetToUsd(asset, amount),
      });
    }
    return out;
  }

  /**
   * 获取国库总价值（USD）
   */
  getTotalValue(): string {
    let total = '0';
    for (const [asset, amount] of this.balances.entries()) {
      const v = this.assetToUsd(asset, amount);
      total = decTruncate(decAdd(total, v), 8);
    }
    return total;
  }

  // ==========================================================================
  // 2. 入金 / 出金
  // ==========================================================================

  /**
   * 入金（任何人可调用，链上：实际是 send tx to treasury）
   */
  deposit(asset: string, amount: string, reason: string, opts: { from?: string } = {}): TreasuryTransaction {
    if (!asset) throw new TreasuryError('INVALID_ASSET', 'asset is required');
    if (!decIsPositive(amount)) {
      throw new TreasuryError('INVALID_AMOUNT', `amount must be > 0: ${amount}`);
    }
    if (!reason) throw new TreasuryError('INVALID_REASON', 'reason is required');

    const current = this.balances.get(asset) || '0';
    this.balances.set(asset, decTruncate(decAdd(current, amount), 8));

    const tx: TreasuryTransaction = {
      id: makeDaoId('ctx'),
      proposalId: '',
      asset,
      amount: decTruncate(amount, 8), // 正数=收入
      reason,
      txHash: undefined,
      timestamp: Date.now(),
    };
    void opts.from;
    this.transactions.push(tx);

    this.emit({ type: 'deposit', tx });
    return { ...tx };
  }

  /**
   * 出金（必须绑定已通过的提案）
   */
  async withdraw(
    asset: string,
    amount: string,
    recipient: string,
    reason: string,
    proposalId: ID
  ): Promise<TreasuryTransaction> {
    if (!asset) throw new TreasuryError('INVALID_ASSET', 'asset is required');
    if (!decIsPositive(amount)) {
      throw new TreasuryError('INVALID_AMOUNT', `amount must be > 0: ${amount}`);
    }
    if (!recipient) throw new TreasuryError('INVALID_RECIPIENT', 'recipient is required');
    if (!proposalId) {
      throw new TreasuryError('INVALID_PROPOSAL', 'proposalId is required for withdraw');
    }
    if (!this.verifier.isPassed(proposalId)) {
      throw new TreasuryError(
        'PROPOSAL_NOT_PASSED',
        `Proposal ${proposalId} has not passed`
      );
    }

    const current = this.balances.get(asset) || '0';
    if (decCmp(current, amount) < 0) {
      throw new TreasuryError(
        'INSUFFICIENT_BALANCE',
        `Treasury ${asset} balance ${current} < ${amount}`
      );
    }

    this.balances.set(asset, decTruncate(decSub(current, amount), 8));

    // 模拟链上转账
    const txHash = `0x${Math.random().toString(16).slice(2, 14)}tx`;
    await new Promise((resolve) => setTimeout(resolve, 5));

    const tx: TreasuryTransaction = {
      id: makeDaoId('ctx'),
      proposalId,
      asset,
      amount: '-' + decTruncate(amount, 8), // 负数=支出
      recipient,
      reason,
      txHash,
      timestamp: Date.now(),
    };
    this.transactions.push(tx);

    this.emit({ type: 'withdraw', tx });
    return { ...tx };
  }

  // ==========================================================================
  // 3. 报表
  // ==========================================================================

  /**
   * 获取指定月份的报表
   *  - month: YYYY-MM 格式
   */
  getMonthlyReport(month: string): { inflow: string; outflow: string; net: string; count: number } {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new TreasuryError('INVALID_MONTH', `month must be YYYY-MM: ${month}`);
    }
    let inflow = '0';
    let outflow = '0';
    let count = 0;
    for (const tx of this.transactions) {
      const m = this.formatMonth(tx.timestamp);
      if (m !== month) continue;
      count += 1;
      if (this.isNegative(tx.amount)) {
        outflow = decTruncate(decAdd(outflow, this.absAmount(tx.amount)), 8);
      } else {
        inflow = decTruncate(decAdd(inflow, tx.amount), 8);
      }
    }
    const net = decTruncate(
      (Number(inflow) - Number(outflow)).toString(),
      8
    );
    return { inflow, outflow, net, count };
  }

  /**
   * 获取 runway（按当前总价值 / 月度 burn）
   */
  getRunway(): number {
    const total = Number(this.getTotalValue());
    const burn = Number(this.monthlyBurn);
    if (burn <= 0) return Number.POSITIVE_INFINITY;
    return total / burn;
  }

  /**
   * 获取最近 N 天历史
   */
  getHistory(days: number = 30): TreasuryTransaction[] {
    const horizon = Date.now() - days * 24 * 3600 * 1000;
    return this.transactions.filter((t) => t.timestamp >= horizon).map((t) => ({ ...t }));
  }

  /**
   * 获取国库摘要
   */
  getTreasury(): Treasury {
    const total = this.getTotalValue();
    const balances = this.getAllBalances();
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const m = this.getMonthlyReport(month);

    return {
      totalValue: total,
      balances,
      monthlyInflow: m.inflow,
      monthlyOutflow: m.outflow,
      runwayMonths: this.getRunway(),
      updatedAt: Date.now(),
    };
  }

  // ==========================================================================
  // 4. 工具
  // ==========================================================================

  setProposalVerifier(verifier: ProposalVerifier): void {
    this.verifier = verifier;
  }

  setHandler(handler: TreasuryEventHandler | null): void {
    this.handler = handler;
  }

  /**
   * 设置资产 USD 价格（演示用）
   */
  setPriceUsd(asset: string, price: string): void {
    if (!decIsPositive(price)) {
      throw new TreasuryError('INVALID_PRICE', `price must be > 0: ${price}`);
    }
    this.priceUsd.set(asset, price);
  }

  /** 测试用：清空所有状态 */
  reset(): void {
    this.balances.clear();
    this.transactions = [];
  }

  // ==========================================================================
  // 内部
  // ==========================================================================

  private assetToUsd(asset: string, amount: string): string {
    const price = this.priceUsd.get(asset) || '0';
    if (decCmp(price, '0') === 0) return '0';
    return decTruncate(
      (Number(amount) * Number(price)).toString(),
      8
    );
  }

  private formatMonth(ts: number): string {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private isNegative(amount: string): boolean {
    return amount.startsWith('-');
  }

  private absAmount(amount: string): string {
    return amount.startsWith('-') ? amount.slice(1) : amount;
  }

  private emit(event: TreasuryEvent): void {
    if (this.handler) {
      try {
        this.handler(event);
      } catch {
        // 忽略
      }
    }
  }
}

// 抑制未使用导入告警
void decCmp;
