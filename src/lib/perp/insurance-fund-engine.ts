/**
 * 保险基金引擎（Insurance Fund Engine）
 *
 * 保险基金用途：
 *  - 弥补穿仓损失（当强平后仍有亏损时）
 *  - 平滑资金费率波动
 *  - 应对极端市场风险
 *
 * 资金来源：
 *  - 强平盈余（当强平价比破产价好时，盈余部分进入保险基金）
 *  - 手续费的一部分（如 10% 的手续费收入划入保险基金）
 *  - 平台注资
 *
 * 资金去向：
 *  - 穿仓损失补偿
 *  - ADL 不足以覆盖的部分
 *  - 风险准备金
 */

import {
  decAdd,
  decCmp,
  decDiv,
  decIsPositive,
  decIsZero,
  decMul,
  decSub,
  decTruncate,
  decMax,
  decMin,
  decAbs,
} from '@/lib/matching/decimal';
import { logger } from '@/lib/logger';

// ============================================================================
// 类型定义
// ============================================================================

/** 保险基金交易类型 */
export type InsuranceFundTxType =
  | 'deposit'           // 平台注资
  | 'liquidation_surplus' // 强平盈余
  | 'fee_allocation'    // 手续费分配
  | 'bad_debt_cover'    // 穿仓损失补偿
  | 'adl_payout'        // ADL 支出
  | 'withdrawal'        // 平台提取
  | 'adjustment';       // 人工调整

/** 保险基金交易记录 */
export interface InsuranceFundTransaction {
  id: string;
  type: InsuranceFundTxType;
  /** 金额变化（正为增加，负为减少） */
  amount: string;
  /** 变化前余额 */
  balanceBefore: string;
  /** 变化后余额 */
  balanceAfter: string;
  /** 关联交易对 */
  symbol?: string;
  /** 关联用户 */
  userId?: string;
  /** 关联强平ID */
  liquidationId?: string;
  /** 备注 */
  remark?: string;
  /** 时间戳 */
  timestamp: number;
  /** 操作人 */
  operator?: string;
}

/** 保险基金状态 */
export interface InsuranceFundState {
  /** 当前余额 */
  balance: string;
  /** 累计收入 */
  totalIncome: string;
  /** 累计支出 */
  totalExpense: string;
  /** 累计穿仓补偿 */
  totalBadDebtCovered: string;
  /** 累计强平盈余 */
  totalLiquidationSurplus: string;
  /** 累计手续费分配 */
  totalFeeAllocation: string;
  /** 覆盖率（余额 / 日平均穿仓额） */
  coverageRatio: number;
  /** 目标覆盖率（如 30 天） */
  targetCoverageDays: number;
  /** 风险等级 */
  riskLevel: 'safe' | 'warning' | 'danger';
  /** 最后更新时间 */
  lastUpdateTime: number;
}

/** 穿仓事件 */
export interface BadDebtEvent {
  id: string;
  symbol: string;
  userId: string;
  /** 穿仓金额（正数为亏损） */
  badDebtAmount: string;
  /** 破产价 */
  bankruptcyPrice: string;
  /** 最终成交价 */
  finalFillPrice: string;
  /** 仓位大小 */
  positionSize: string;
  /** 时间戳 */
  timestamp: number;
  /** 保险基金已补偿金额 */
  coveredByInsurance: string;
  /** ADL 已补偿金额 */
  coveredByAdl: string;
  /** 穿仓分摊金额（用户承担） */
  coveredByClawback: string;
}

// ============================================================================
// 保险基金引擎
// ============================================================================

export class InsuranceFundEngine {
  private balance: string;
  private totalIncome: string = '0';
  private totalExpense: string = '0';
  private totalBadDebtCovered: string = '0';
  private totalLiquidationSurplus: string = '0';
  private totalFeeAllocation: string = '0';

  private readonly transactions: InsuranceFundTransaction[] = [];
  private readonly badDebtEvents: BadDebtEvent[] = [];

  private readonly dailyBadDebt: Array<{ date: string; amount: string }> = [];

  private targetCoverageDays = 30;
  private feeAllocationRate = 0.1;

  constructor(initialBalance: string = '1000000') {
    this.balance = initialBalance;
    this.totalIncome = initialBalance;
  }

  // -------------------------------------------------------------------------
  // 资金存入
  // -------------------------------------------------------------------------

  /**
   * 平台注资
   */
  deposit(amount: string, operator: string, remark?: string): InsuranceFundTransaction {
    const tx = this.createTransaction({
      type: 'deposit',
      amount,
      operator,
      remark,
    });

    this.balance = decAdd(this.balance, amount);
    this.totalIncome = decAdd(this.totalIncome, amount);

    this.finalizeTransaction(tx);
    logger.info(`[insurance] deposit: ${amount}, operator: ${operator}`);
    return tx;
  }

  /**
   * 强平盈余存入
   * 当强平在破产价之前成交，盈余部分进入保险基金
   */
  addLiquidationSurplus(
    symbol: string,
    userId: string,
    amount: string,
    liquidationId: string
  ): InsuranceFundTransaction {
    if (!decIsPositive(amount)) {
      throw new Error('surplus amount must be positive');
    }

    const tx = this.createTransaction({
      type: 'liquidation_surplus',
      amount,
      symbol,
      userId,
      liquidationId,
      remark: `强平盈余 ${symbol}`,
    });

    this.balance = decAdd(this.balance, amount);
    this.totalIncome = decAdd(this.totalIncome, amount);
    this.totalLiquidationSurplus = decAdd(this.totalLiquidationSurplus, amount);

    this.finalizeTransaction(tx);
    return tx;
  }

  /**
   * 手续费分配
   * 按一定比例将手续费收入划入保险基金
   */
  allocateFees(feeAmount: string, symbol?: string): InsuranceFundTransaction {
    const allocation = decTruncate(decMul(feeAmount, String(this.feeAllocationRate)), 8);

    if (decIsZero(allocation)) {
      return this.createTransaction({
        type: 'fee_allocation',
        amount: '0',
        symbol,
      });
    }

    const tx = this.createTransaction({
      type: 'fee_allocation',
      amount: allocation,
      symbol,
      remark: `手续费分配 (${(this.feeAllocationRate * 100).toFixed(1)}%)`,
    });

    this.balance = decAdd(this.balance, allocation);
    this.totalIncome = decAdd(this.totalIncome, allocation);
    this.totalFeeAllocation = decAdd(this.totalFeeAllocation, allocation);

    this.finalizeTransaction(tx);
    return tx;
  }

  // -------------------------------------------------------------------------
  // 资金支出
  // -------------------------------------------------------------------------

  /**
   * 覆盖穿仓损失
   * 优先使用保险基金，不足部分走 ADL 和穿仓分摊
   */
  coverBadDebt(event: Omit<BadDebtEvent, 'id' | 'coveredByInsurance' | 'coveredByAdl' | 'coveredByClawback'>): {
    covered: string;
    remaining: string;
    transaction: InsuranceFundTransaction;
  } {
    const coverAmount = decMin(this.balance, event.badDebtAmount);
    const remaining = decSub(event.badDebtAmount, coverAmount);

    const tx = this.createTransaction({
      type: 'bad_debt_cover',
      amount: decNeg(coverAmount),
      symbol: event.symbol,
      userId: event.userId,
      remark: `穿仓损失补偿 ${event.symbol}`,
    });

    this.balance = decSub(this.balance, coverAmount);
    this.totalExpense = decAdd(this.totalExpense, coverAmount);
    this.totalBadDebtCovered = decAdd(this.totalBadDebtCovered, coverAmount);

    this.finalizeTransaction(tx);

    const badDebtEvent: BadDebtEvent = {
      ...event,
      id: `bd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      coveredByInsurance: coverAmount,
      coveredByAdl: '0',
      coveredByClawback: '0',
    };
    this.badDebtEvents.push(badDebtEvent);
    this.recordDailyBadDebt(event.badDebtAmount);

    logger.warn(`[insurance] bad debt covered: ${coverAmount}, remaining: ${remaining}`);
    return { covered: coverAmount, remaining, transaction: tx };
  }

  /**
   * 平台提取（需严格审批）
   */
  withdraw(amount: string, operator: string, remark?: string): InsuranceFundTransaction {
    if (decCmp(amount, this.balance) > 0) {
      throw new Error('insufficient insurance fund balance');
    }

    const tx = this.createTransaction({
      type: 'withdrawal',
      amount: decNeg(amount),
      operator,
      remark,
    });

    this.balance = decSub(this.balance, amount);
    this.totalExpense = decAdd(this.totalExpense, amount);

    this.finalizeTransaction(tx);
    logger.info(`[insurance] withdrawal: ${amount}, operator: ${operator}`);
    return tx;
  }

  // -------------------------------------------------------------------------
  // 状态查询
  // -------------------------------------------------------------------------

  getBalance(): string {
    return this.balance;
  }

  getState(): InsuranceFundState {
    const avgDailyBadDebt = this.calculateAverageDailyBadDebt();
    const coverageRatio = decIsPositive(avgDailyBadDebt)
      ? parseFloat(decDiv(this.balance, avgDailyBadDebt, 4))
      : 999;

    let riskLevel: 'safe' | 'warning' | 'danger';
    if (coverageRatio >= this.targetCoverageDays) {
      riskLevel = 'safe';
    } else if (coverageRatio >= this.targetCoverageDays * 0.3) {
      riskLevel = 'warning';
    } else {
      riskLevel = 'danger';
    }

    return {
      balance: this.balance,
      totalIncome: this.totalIncome,
      totalExpense: this.totalExpense,
      totalBadDebtCovered: this.totalBadDebtCovered,
      totalLiquidationSurplus: this.totalLiquidationSurplus,
      totalFeeAllocation: this.totalFeeAllocation,
      coverageRatio,
      targetCoverageDays: this.targetCoverageDays,
      riskLevel,
      lastUpdateTime: Date.now(),
    };
  }

  // -------------------------------------------------------------------------
  // 交易记录
  // -------------------------------------------------------------------------

  getTransactions(
    params: {
      type?: InsuranceFundTxType;
      symbol?: string;
      startTime?: number;
      endTime?: number;
      limit?: number;
    } = {}
  ): InsuranceFundTransaction[] {
    let result = [...this.transactions];

    if (params.type) {
      result = result.filter(t => t.type === params.type);
    }
    if (params.symbol) {
      result = result.filter(t => t.symbol === params.symbol);
    }
    if (params.startTime) {
      result = result.filter(t => t.timestamp >= params.startTime!);
    }
    if (params.endTime) {
      result = result.filter(t => t.timestamp <= params.endTime!);
    }

    result.sort((a, b) => b.timestamp - a.timestamp);

    if (params.limit) {
      result = result.slice(0, params.limit);
    }

    return result;
  }

  getBadDebtEvents(limit = 50): BadDebtEvent[] {
    return [...this.badDebtEvents]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // -------------------------------------------------------------------------
  // 配置
  // -------------------------------------------------------------------------

  setFeeAllocationRate(rate: number): void {
    if (rate < 0 || rate > 1) {
      throw new Error('rate must be between 0 and 1');
    }
    this.feeAllocationRate = rate;
  }

  setTargetCoverageDays(days: number): void {
    if (days < 1) {
      throw new Error('days must be at least 1');
    }
    this.targetCoverageDays = days;
  }

  // -------------------------------------------------------------------------
  // 辅助方法
  // -------------------------------------------------------------------------

  private createTransaction(partial: Partial<InsuranceFundTransaction>): InsuranceFundTransaction {
    const amount = partial.amount ?? '0';
    return {
      id: `iftx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: partial.type ?? 'adjustment',
      amount,
      balanceBefore: this.balance,
      balanceAfter: decAdd(this.balance, amount),
      symbol: partial.symbol,
      userId: partial.userId,
      liquidationId: partial.liquidationId,
      remark: partial.remark,
      timestamp: Date.now(),
      operator: partial.operator,
    };
  }

  private finalizeTransaction(tx: InsuranceFundTransaction): void {
    tx.balanceAfter = this.balance;
    this.transactions.push(tx);

    if (this.transactions.length > 50000) {
      this.transactions.splice(0, this.transactions.length - 50000);
    }
  }

  private recordDailyBadDebt(amount: string): void {
    const today = new Date().toISOString().slice(0, 10);
    const last = this.dailyBadDebt[this.dailyBadDebt.length - 1];

    if (last && last.date === today) {
      last.amount = decAdd(last.amount, amount);
    } else {
      this.dailyBadDebt.push({ date: today, amount });
      if (this.dailyBadDebt.length > 365) {
        this.dailyBadDebt.shift();
      }
    }
  }

  private calculateAverageDailyBadDebt(): string {
    if (this.dailyBadDebt.length === 0) return '0';

    const recentDays = Math.min(this.dailyBadDebt.length, 30);
    const recent = this.dailyBadDebt.slice(-recentDays);

    let total = '0';
    for (const d of recent) {
      total = decAdd(total, d.amount);
    }

    return decTruncate(decDiv(total, String(recentDays), 8), 8);
  }
}

/**
 * 取负数
 */
function decNeg(value: string): string {
  if (value.startsWith('-')) {
    return value.substring(1);
  }
  return `-${value}`;
}
