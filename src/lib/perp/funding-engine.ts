/**
 * 资金费率引擎
 *
 *  - 每 8h 结算一次（00:00 / 08:00 / 16:00 UTC）
 *  - rate > 0：多方付给空方（long pays short）
 *  - rate < 0：空方付给多方（short pays long）
 *  - payment = position.size * markPrice * rate
 *  - 资金费率维护在 currentRates，预测下一期由 getPredictedRate 即时计算
 *
 * 与 MarginCalculator 协作：premium + interest + 双重 clamp
 */

import {
  decAdd,
  decIsPositive,
  decIsZero,
  decMul,
  decSub,
  decTruncate,
} from '@/lib/matching/decimal';
import { MarginCalculator } from './margin-calculator';
import { ContractRegistry } from './contract-registry';
import type {
  Contract,
  FundingPayment,
  FundingRate,
  InsuranceFund,
  Position,
} from './types';

export interface ProcessFundingResult {
  payments: FundingPayment[];
  /** 累计多付/收（用于审计） */
  totalPaid: string;
  /** 累计空付/收 */
  totalReceived: string;
}

export class FundingEngine {
  private currentRates: Map<string, FundingRate> = new Map();
  private paymentSeq = 0;
  private calculator: MarginCalculator;
  private registry: ContractRegistry;

  /** 默认利率（USDT 借贷利率，8h 维度） */
  private defaultInterestRate: number;

  constructor(
    registry?: ContractRegistry,
    options: { defaultInterestRate?: number } = {}
  ) {
    this.registry = registry || new ContractRegistry();
    this.calculator = new MarginCalculator();
    this.defaultInterestRate = options.defaultInterestRate ?? 0.0001; // 0.01%
  }

  /**
   * 获取当前已结算的资金费率
   */
  getCurrentRate(symbol: string): FundingRate | null {
    const r = this.currentRates.get(symbol);
    return r ? { ...r } : null;
  }

  /**
   * 预测下一期资金费率（不写入 currentRates）
   */
  getPredictedRate(
    symbol: string,
    markPrice: string,
    indexPrice: string
  ): string {
    const contract = this.registry.getContract(symbol);
    if (!contract) {
      throw new Error(`Unknown contract: ${symbol}`);
    }
    return this.calculator.calculateFundingRate(
      markPrice,
      indexPrice,
      this.defaultInterestRate,
      undefined,
      contract.fundingCap
    );
  }

  /**
   * 计算下一期 funding 结算时间（毫秒）
   *  默认基于 00:00/08:00/16:00 UTC
   */
  scheduleNextFunding(symbol: string, now: number = Date.now()): number {
    const contract = this.registry.getContract(symbol);
    if (!contract) {
      throw new Error(`Unknown contract: ${symbol}`);
    }
    const intervalMs = contract.fundingIntervalHours * 3600 * 1000;
    // 锚定到 UTC 整 8h（00, 08, 16）
    const dayAnchor = Math.floor(now / (24 * 3600 * 1000)) * (24 * 3600 * 1000);
    const hourOfDay = (now - dayAnchor) / (3600 * 1000);
    const fundingHours = [0, 8, 16];
    let nextHour = fundingHours.find((h) => h * 3600 * 1000 > (now - dayAnchor));
    if (nextHour === undefined) {
      nextHour = fundingHours[0];
      return dayAnchor + (24 + nextHour) * 3600 * 1000;
    }
    return dayAnchor + nextHour * 3600 * 1000;
  }

  /**
   * 结算一个 symbol 的所有仓位资金费
   *  - rate > 0：long pays short
   *  - payment = size * markPrice * rate
   *  - 保险基金不直接参与，但用于穿仓赔付记录
   */
  processFunding(
    symbol: string,
    positions: Position[],
    markPrice: string,
    indexPrice: string,
    insuranceFund?: InsuranceFund,
    now: number = Date.now()
  ): ProcessFundingResult {
    const contract = this.registry.getContract(symbol);
    if (!contract) {
      throw new Error(`Unknown contract: ${symbol}`);
    }
    if (decIsZero(markPrice) || decIsZero(indexPrice)) {
      throw new Error('prices must be > 0');
    }

    // 1. 计算本周期 rate
    const rate = this.calculator.calculateFundingRate(
      markPrice,
      indexPrice,
      this.defaultInterestRate,
      undefined,
      contract.fundingCap
    );

    // 2. 写入 currentRates
    this.currentRates.set(symbol, {
      symbol,
      rate,
      nextFundingTime: this.scheduleNextFunding(symbol, now),
      markPrice,
      indexPrice,
    });

    // 3. 给每个 position 生成 FundingPayment
    const payments: FundingPayment[] = [];
    let totalPaid = '0';
    let totalReceived = '0';

    for (const pos of positions) {
      if (pos.status !== 'open' || pos.symbol !== symbol) continue;

      // payment = size * markPrice * rate
      // 符号：long 且 rate > 0 -> 支付（负）；short 且 rate > 0 -> 收取（正）
      const basePayment = decMul(decMul(pos.size, markPrice), rate);
      const signed =
        pos.side === 'long' ? decSub('0', basePayment) : basePayment;

      this.paymentSeq++;
      const payment: FundingPayment = {
        id: `fp_${symbol}_${pos.id}_${this.paymentSeq}_${now}`,
        positionId: pos.id,
        userId: pos.userId,
        symbol,
        rate,
        amount: decTruncate(signed, 8),
        timestamp: now,
      };
      payments.push(payment);

      // 统计：负数 = 用户支付；正数 = 用户收取
      if (signed.startsWith('-')) {
        const abs = decTruncate(decMul('-1', signed), 8);
        totalPaid = decTruncate(decAdd(totalPaid, abs), 8);
      } else if (decIsPositive(signed)) {
        totalReceived = decTruncate(decAdd(totalReceived, signed), 8);
      }
    }

    // insuranceFund 入参仅用于兼容外部审计；此处不修改
    void insuranceFund;

    return { payments, totalPaid, totalReceived };
  }

  /**
   * 测试 / 治理：手动注入当前费率
   */
  setCurrentRate(rate: FundingRate): void {
    this.currentRates.set(rate.symbol, { ...rate });
  }

  /**
   * 测试：清空状态
   */
  reset(): void {
    this.currentRates.clear();
    this.paymentSeq = 0;
  }
}

/** 全局单例 */
export const globalFundingEngine = new FundingEngine();
