/**
 * 强平引擎
 *
 *  触发条件：marginRatio < maintenanceMarginRate
 *
 *  强平流程：
 *  1. 检查是否可强平
 *  2. 计算破产价（bankruptcy price）
 *  3. 强平市价单（穿仓时使用破产价，否则使用 markPrice）
 *  4. 收取罚金（liquidation fee，默认 0.5%）
 *  5. 剩余保证金注入保险基金
 *  6. 保险基金不足时触发 ADL（自动减仓）
 *
 *  ADL 排名规则：score = leverage * (pnlRate + 1)，score 越高越优先被减仓
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
} from '@/lib/matching/decimal';
import { MarginCalculator } from './margin-calculator';
import {
  ContractRegistry,
  LIQUIDATION_FEE_RATE,
  ADL_TRIGGER_RATIO,
} from './contract-registry';
import type {
  Contract,
  InsuranceFund,
  Liquidation,
  Position,
  Side,
  AdlRank,
} from './types';

export interface OrderBookLevel {
  price: string;
  quantity: string;
}

/** 极简订单簿接口（撮合引擎传 best bid/ask 即可） */
export interface SimpleOrderBook {
  bids: OrderBookLevel[]; // 价格降序
  asks: OrderBookLevel[]; // 价格升序
}

export interface LiquidateResult {
  liquidation: Liquidation;
  /** 实际平仓成交价 */
  executedPrice: string;
  /** 是否触发 ADL */
  adlTriggered: boolean;
  /** ADL 减仓的对手方仓位 */
  adlPositions: Position[];
  /** 更新后的保险基金 */
  insuranceFund: InsuranceFund;
}

export class LiquidationEngine {
  private calculator: MarginCalculator;
  private registry: ContractRegistry;
  private liquidationFeeRate: number;
  private adlTriggerRatio: number;
  private liqSeq = 0;

  constructor(
    registry?: ContractRegistry,
    options: { liquidationFeeRate?: number; adlTriggerRatio?: number } = {}
  ) {
    this.registry = registry || new ContractRegistry();
    this.calculator = new MarginCalculator();
    this.liquidationFeeRate = options.liquidationFeeRate ?? LIQUIDATION_FEE_RATE;
    this.adlTriggerRatio = options.adlTriggerRatio ?? ADL_TRIGGER_RATIO;
  }

  /**
   * 是否触发强平
   *  - marginRatio = (margin + unrealizedPnl) / positionValue
   *  - maintenance margin rate 由合约决定
   */
  checkLiquidatable(position: Position, markPrice: string, contract: Contract): boolean {
    if (position.status !== 'open') return false;
    if (decCmp(position.size, '0') <= 0) return false;
    const positionValue = this.calculator.calculateNotional(position.size, markPrice);
    const marginRatio = this.calculator.calculateMarginRatio(
      position.margin,
      position.unrealizedPnl,
      positionValue
    );
    // 触发：marginRatio < mmr
    return decCmp(marginRatio, String(contract.maintenanceMarginRate)) < 0;
  }

  /**
   * 破产价（账户权益 = 0 时的标记价）
   *  equity = margin + (mark - entry) * size * sign(side) = 0
   *  long:  mark_b = entry - margin / size
   *  short: mark_b = entry + margin / size
   */
  calculateBankruptcyPrice(position: Position): string {
    if (decCmp(position.size, '0') <= 0) {
      throw new Error('size must be > 0');
    }
    const diff = decDiv(position.margin, position.size, 18);
    const bankruptcy =
      position.side === 'long'
        ? decSub(position.entryPrice, diff)
        : decAdd(position.entryPrice, diff);
    return decTruncate(bankruptcy, 8);
  }

  /**
   * 取订单簿对手价（强平市价单成交价）
   *  - long 强平：挂单卖（吃 ask）
   *  - short 强平：挂买单（吃 bid）
   */
  getExecutionPrice(side: Side, orderBook: SimpleOrderBook, markPrice: string): string {
    if (side === 'long') {
      const best = orderBook.asks[0]?.price;
      return best || markPrice;
    }
    const best = orderBook.bids[0]?.price;
    return best || markPrice;
  }

  /**
   * ADL 排名（盈利 + 杠杆 双重权重）
   *  - score = leverage * (pnlRate + 1)
   *  - score 越大越优先被 ADL
   */
  adlRank(positions: Position[]): AdlRank[] {
    return positions
      .filter((p) => p.status === 'open')
      .map((p) => {
        const rate = Number(p.unrealizedPnlRate);
        const score = p.leverage * (rate + 1);
        return { position: p, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * 触发 ADL：选择对手方仓位并减仓
   *  - bankruptQty：需要对手方吃下的破产量
   *  - 返回被减仓的 positions（按 score 降序累计）
   */
  triggerADL(counterpartyPositions: Position[], bankruptQty: string): Position[] {
    const ranks = this.adlRank(counterpartyPositions);
    const result: Position[] = [];
    let remaining = bankruptQty;
    for (const r of ranks) {
      if (decCmp(remaining, '0') <= 0) break;
      const take = decCmp(r.position.size, remaining) <= 0
        ? r.position.size
        : remaining;
      const reduced: Position = {
        ...r.position,
        size: decSub(r.position.size, take),
        updatedAt: Date.now(),
      };
      result.push(reduced);
      remaining = decSub(remaining, take);
    }
    return result;
  }

  /**
   * 执行强平
   */
  liquidate(
    position: Position,
    contract: Contract,
    orderBook: SimpleOrderBook,
    markPrice: string,
    insuranceFund: InsuranceFund,
    counterpartyPositions: Position[] = []
  ): LiquidateResult {
    if (position.status !== 'open') {
      throw new Error('Position is not open');
    }

    // 1. 破产价
    const bankruptcyPrice = this.calculateBankruptcyPrice(position);

    // 2. 实际强平价
    const executedPrice = this.getExecutionPrice(position.side, orderBook, markPrice);

    // 3. 强平 PnL：以 markPrice 重新计算
    const pnl = this.calculator.calculateUnrealizedPnl(
      position.side,
      position.size,
      position.entryPrice,
      executedPrice
    );

    // 4. 罚金 = notional * liquidationFeeRate
    const notional = this.calculator.calculateNotional(position.size, executedPrice);
    const penalty = decTruncate(
      decMul(notional, String(this.liquidationFeeRate)),
      8
    );

    // 5. 剩余保证金 = margin + pnl - penalty
    const remainingMargin = decTruncate(
      decSub(decAdd(position.margin, pnl), penalty),
      8
    );

    // 6. 保险基金注入 / 赔付
    let fundUsed = '0';
    let fundContrib = '0';
    let adlTriggered = false;
    let adlPositions: Position[] = [];
    const nextFund: InsuranceFund = { ...insuranceFund };

    if (decIsPositive(remainingMargin)) {
      // 正数：剩余保证金注入保险基金
      fundContrib = remainingMargin;
      nextFund.balance = decTruncate(decAdd(nextFund.balance, remainingMargin), 8);
      nextFund.totalContributed = decTruncate(
        decAdd(nextFund.totalContributed, remainingMargin),
        8
      );
    } else if (decCmp(remainingMargin, '0') < 0) {
      // 穿仓：保险基金先垫付，不足触发 ADL
      const need = decSub('0', remainingMargin); // 正数
      if (decCmp(nextFund.balance, need) >= 0) {
        fundUsed = need;
        nextFund.balance = decTruncate(decSub(nextFund.balance, need), 8);
        nextFund.totalUsed = decTruncate(decAdd(nextFund.totalUsed, need), 8);
      } else {
        // 保险基金不足 -> 触发 ADL
        adlTriggered = true;
        fundUsed = nextFund.balance;
        // 仍需补足的部分（按 notional 等价换算成 size）
        const stillNeedValue = decSub(need, nextFund.balance);
        nextFund.balance = '0';
        nextFund.totalUsed = decTruncate(
          decAdd(nextFund.totalUsed, fundUsed),
          8
        );
        // bankruptQty = stillNeedValue / executedPrice
        const bankruptQty =
          decCmp(executedPrice, '0') > 0
            ? decTruncate(decDiv(stillNeedValue, executedPrice, 18), 8)
            : '0';
        adlPositions = this.triggerADL(counterpartyPositions, bankruptQty);
      }
    }

    this.liqSeq++;
    const liquidation: Liquidation = {
      id: `liq_${position.id}_${this.liqSeq}_${Date.now()}`,
      positionId: position.id,
      userId: position.userId,
      symbol: position.symbol,
      side: position.side,
      quantity: position.size,
      markPrice,
      bankruptcyPrice,
      executedPrice,
      penalty,
      remainingMargin: decMax(remainingMargin, '0'),
      insuranceFundUsed: fundUsed,
      adlTriggered,
      timestamp: Date.now(),
    };

    return {
      liquidation,
      executedPrice,
      adlTriggered,
      adlPositions,
      insuranceFund: nextFund,
    };
  }

  /**
   * 批量监控仓位，返回可强平的 positions
   */
  monitorPositions(
    positions: Position[],
    markPrices: Map<string, string>
  ): Position[] {
    const result: Position[] = [];
    for (const p of positions) {
      if (p.status !== 'open') continue;
      const mark = markPrices.get(p.symbol);
      if (!mark) continue;
      const contract = this.registry.getContract(p.symbol);
      if (!contract) continue;
      if (this.checkLiquidatable(p, mark, contract)) {
        result.push(p);
      }
    }
    return result;
  }

  /**
   * ADL 触发条件
   *  当 insuranceFund 余额 / 总持仓名义价值 < adlTriggerRatio 触发
   */
  shouldTriggerAdl(insuranceFund: InsuranceFund, totalNotional: string): boolean {
    if (decCmp(totalNotional, '0') <= 0) return false;
    const ratio = decDiv(insuranceFund.balance, totalNotional, 18);
    return decCmp(ratio, String(this.adlTriggerRatio)) < 0;
  }

  /**
   * 计算破产价（导出供外部使用）
   */
  static bankruptcyPrice(position: Position): string {
    if (decCmp(position.size, '0') <= 0) {
      throw new Error('size must be > 0');
    }
    const diff = decDiv(position.margin, position.size, 18);
    return position.side === 'long'
      ? decTruncate(decSub(position.entryPrice, diff), 8)
      : decTruncate(decAdd(position.entryPrice, diff), 8);
  }

  static decMin(a: string, b: string): string {
    return decMin(a, b);
  }

  static decMax(a: string, b: string): string {
    return decMax(a, b);
  }
}
