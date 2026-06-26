/**
 * 高级资金费率引擎（Advanced Funding Engine）
 *
 * 资金费率机制：
 *  - 每 8 小时结算一次（UTC 00:00, 08:00, 16:00）
 *  - 资金费率 = 溢价指数 (P) + 利率成分 (I)
 *  - 溢价指数 = (Max(0, 深度加权买价 - 现货指数价) - Max(0, 现货指数价 - 深度加权卖价)) / 现货指数价 + 现货利率基点差
 *  - 利率成分 = (计价币利率 - 基础币利率) / 资金费率结算频率
 *
 * 核心功能：
 *  - 实时溢价指数计算（1分钟采样）
 *  - 预测资金费率（实时估算下一期费率）
 *  - 历史资金费率查询
 *  - 资金费率结算（8小时整点）
 *  - 多交易对支持
 *  - 深度加权中间价计算
 *
 * 夹紧机制：
 *  - 内部夹紧：±0.05%（相对于维持保证金率的一定比例）
 *  - 外部夹紧：±0.75%（绝对上限）
 *  - 渐进式调整：限制每期费率变化幅度
 */

import { EventEmitter } from 'events';
import {
  decAdd,
  decCmp,
  decDiv,
  decIsPositive,
  decIsZero,
  decMul,
  decSub,
  decMax,
  decMin,
  decAbs,
  decTruncate,
} from '@/lib/matching/decimal';
import type { Contract, Position, FundingPayment } from './types';
import { logger } from '@/lib/logger';

// ============================================================================
// 类型定义
// ============================================================================

/** 资金费率结算周期 */
export type FundingInterval = '1h' | '4h' | '8h' | '24h';

/** 资金费率配置 */
export interface FundingConfig {
  /** 结算间隔（小时） */
  intervalHours: number;
  /** 资金费率上限（绝对值，如 0.0075 = 0.75%） */
  maxFundingRate: number;
  /** 资金费率下限（绝对值） */
  minFundingRate: number;
  /** 内部夹紧比例（相对于维持保证金率） */
  innerClampRatio: number;
  /** 溢价指数采样间隔（毫秒） */
  premiumSampleInterval: number;
  /** 溢价指数采样窗口（采样点数量） */
  premiumSampleWindow: number;
  /** 计价币年利率 */
  quoteInterestRate: number;
  /** 基础币年利率 */
  baseInterestRate: number;
  /** 利率占比（0-1，1表示完全使用利率） */
  interestRateFactor: number;
  /** 深度加权比例（用于计算深度加权买价/卖价） */
  depthWeightRatio: number;
  /** 最大调整幅度（每期费率变化上限） */
  maxAdjustmentPerPeriod: number;
}

/** 溢价指数采样点 */
export interface PremiumSample {
  timestamp: number;
  premiumIndex: string;
  markPrice: string;
  indexPrice: string;
  depthBidPrice: string;
  depthAskPrice: string;
}

/** 资金费率记录 */
export interface FundingRateRecord {
  /** 交易对 */
  symbol: string;
  /** 资金费率 */
  fundingRate: string;
  /** 溢价指数 */
  premiumIndex: string;
  /** 利率成分 */
  interestComponent: string;
  /** 结算时间 */
  settlementTime: number;
  /** 标记价（结算时） */
  markPrice: string;
  /** 指数价（结算时） */
  indexPrice: string;
  /** 周期长度（小时） */
  periodHours: number;
}

/** 资金费率预测 */
export interface FundingPrediction {
  /** 当前预估费率 */
  estimatedRate: string;
  /** 距离下次结算的时间（毫秒） */
  timeToNextFunding: number;
  /** 下次结算时间 */
  nextFundingTime: number;
  /** 已采样次数 */
  samplesCollected: number;
  /** 平均溢价指数 */
  avgPremiumIndex: string;
  /** 利率成分 */
  interestComponent: string;
  /** 当前标记价 */
  currentMarkPrice: string;
}

// ============================================================================
// 默认配置
// ============================================================================

const DEFAULT_CONFIG: FundingConfig = {
  intervalHours: 8,
  maxFundingRate: 0.0075,
  minFundingRate: -0.0075,
  innerClampRatio: 0.75,
  premiumSampleInterval: 60000,
  premiumSampleWindow: 480,
  quoteInterestRate: 0.03,
  baseInterestRate: 0.02,
  interestRateFactor: 1,
  depthWeightRatio: 0.01,
  maxAdjustmentPerPeriod: 0.0025,
};

// ============================================================================
// 深度加权中间价
// ============================================================================

/**
 * 深度加权价格计算
 * 基于订单簿深度，计算加权平均买价和卖价
 *
 * 深度加权买价 = sum(quantity_i * price_i) / sum(quantity_i) for bid side
 * 深度加权卖价 = sum(quantity_i * price_i) / sum(quantity_i) for ask side
 *
 * 只取深度比例内的订单（如 1% 深度）
 */
export function calculateDepthWeightedPrice(
  bids: Array<{ price: string; quantity: string }>,
  asks: Array<{ price: string; quantity: string }>,
  indexPrice: string,
  depthRatio: number = 0.01
): { depthBidPrice: string; depthAskPrice: string } {
  const upperBound = decMul(indexPrice, String(1 + depthRatio));
  const lowerBound = decMul(indexPrice, String(1 - depthRatio));

  let bidTotalValue = '0';
  let bidTotalQty = '0';
  for (const bid of bids) {
    if (decCmp(bid.price, lowerBound) < 0) break;
    bidTotalValue = decAdd(bidTotalValue, decMul(bid.price, bid.quantity));
    bidTotalQty = decAdd(bidTotalQty, bid.quantity);
  }

  let askTotalValue = '0';
  let askTotalQty = '0';
  for (const ask of asks) {
    if (decCmp(ask.price, upperBound) > 0) break;
    askTotalValue = decAdd(askTotalValue, decMul(ask.price, ask.quantity));
    askTotalQty = decAdd(askTotalQty, ask.quantity);
  }

  const depthBidPrice = decIsPositive(bidTotalQty)
    ? decDiv(bidTotalValue, bidTotalQty, 10)
    : bids.length > 0 ? bids[0].price : indexPrice;

  const depthAskPrice = decIsPositive(askTotalQty)
    ? decDiv(askTotalValue, askTotalQty, 10)
    : asks.length > 0 ? asks[0].price : indexPrice;

  return { depthBidPrice, depthAskPrice };
}

/**
 * 计算溢价指数
 *
 * P = (Max(0, 深度加权买价 - 指数价) - Max(0, 指数价 - 深度加权卖价)) / 指数价
 *
 * 简化版：
 * 如果深度买价 > 指数价 且 深度卖价 > 指数价 → 正溢价
 * 如果深度买价 < 指数价 且 深度卖价 < 指数价 → 负溢价
 * 否则 → 溢价接近于0
 */
export function calculatePremiumIndex(
  depthBidPrice: string,
  depthAskPrice: string,
  indexPrice: string
): string {
  if (decIsZero(indexPrice)) return '0';

  const bidSpread = decMax('0', decSub(depthBidPrice, indexPrice));
  const askSpread = decMax('0', decSub(indexPrice, depthAskPrice));

  const premium = decSub(bidSpread, askSpread);
  const premiumIndex = decDiv(premium, indexPrice, 10);

  return premiumIndex;
}

/**
 * 计算利率成分
 *
 * I = (计价币利率 - 基础币利率) / 资金费率结算频率
 *
 * 例如：8小时结算，年利率差 1% → I = 1% / 365 * 8 / 24
 */
export function calculateInterestComponent(
  quoteRate: number,
  baseRate: number,
  intervalHours: number
): string {
  const dailyRate = (quoteRate - baseRate) / 365;
  const periodRate = dailyRate * (intervalHours / 24);
  return String(periodRate);
}

// ============================================================================
// 高级资金费率引擎
// ============================================================================

export class AdvancedFundingEngine {
  private readonly config: FundingConfig;
  private readonly emitter = new EventEmitter();

  private readonly premiumSamples = new Map<string, PremiumSample[]>();
  private readonly fundingHistory = new Map<string, FundingRateRecord[]>();
  private readonly lastFundingTime = new Map<string, number>();
  private readonly currentMarkPrices = new Map<string, string>();
  private readonly currentIndexPrices = new Map<string, string>();
  private readonly predictedRates = new Map<string, string>();

  private lastPremiumSampleTime = new Map<string, number>();

  constructor(config: Partial<FundingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // -------------------------------------------------------------------------
  // 事件
  // -------------------------------------------------------------------------

  on(event: string, listener: (payload: unknown) => void): this {
    this.emitter.on(event, listener);
    return this;
  }

  off(event: string, listener: (payload: unknown) => void): this {
    this.emitter.off(event, listener);
    return this;
  }

  private emit(event: string, payload: unknown) {
    try {
      this.emitter.emit(event, payload);
    } catch (e) {
      logger.error('[funding] event listener error', e);
    }
  }

  // -------------------------------------------------------------------------
  // 价格更新
  // -------------------------------------------------------------------------

  /**
   * 更新标记价格
   */
  updateMarkPrice(symbol: string, price: string): void {
    this.currentMarkPrices.set(symbol, price);
  }

  /**
   * 更新指数价格
   */
  updateIndexPrice(symbol: string, price: string): void {
    this.currentIndexPrices.set(symbol, price);
  }

  /**
   * 采样溢价指数
   * 应该定期调用（如每分钟一次）
   */
  samplePremiumIndex(
    symbol: string,
    bids: Array<{ price: string; quantity: string }>,
    asks: Array<{ price: string; quantity: string }>
  ): PremiumSample | null {
    const now = Date.now();
    const lastSample = this.lastPremiumSampleTime.get(symbol) ?? 0;

    if (now - lastSample < this.config.premiumSampleInterval) {
      return null;
    }

    const indexPrice = this.currentIndexPrices.get(symbol);
    const markPrice = this.currentMarkPrices.get(symbol);

    if (!indexPrice || !markPrice) {
      return null;
    }

    const { depthBidPrice, depthAskPrice } = calculateDepthWeightedPrice(
      bids,
      asks,
      indexPrice,
      this.config.depthWeightRatio
    );

    const premiumIndex = calculatePremiumIndex(depthBidPrice, depthAskPrice, indexPrice);

    const sample: PremiumSample = {
      timestamp: now,
      premiumIndex,
      markPrice,
      indexPrice,
      depthBidPrice,
      depthAskPrice,
    };

    let samples = this.premiumSamples.get(symbol);
    if (!samples) {
      samples = [];
      this.premiumSamples.set(symbol, samples);
    }

    samples.push(sample);
    if (samples.length > this.config.premiumSampleWindow) {
      samples.shift();
    }

    this.lastPremiumSampleTime.set(symbol, now);
    this.updatePredictedRate(symbol);

    this.emit('premiumSampled', { symbol, sample });

    return sample;
  }

  // -------------------------------------------------------------------------
  // 资金费率计算
  // -------------------------------------------------------------------------

  /**
   * 计算平均溢价指数（基于采样窗口）
   */
  getAveragePremiumIndex(symbol: string): string {
    const samples = this.premiumSamples.get(symbol);
    if (!samples || samples.length === 0) return '0';

    let sum = '0';
    for (const s of samples) {
      sum = decAdd(sum, s.premiumIndex);
    }

    return decDiv(sum, String(samples.length), 10);
  }

  /**
   * 计算利率成分
   */
  getInterestComponent(): string {
    return calculateInterestComponent(
      this.config.quoteInterestRate,
      this.config.baseInterestRate,
      this.config.intervalHours
    );
  }

  /**
   * 计算资金费率（夹紧后）
   */
  calculateFundingRate(
    symbol: string,
    contract: Contract
  ): {
    rawRate: string;
    clampedRate: string;
    premiumIndex: string;
    interestComponent: string;
    innerClamp: string;
    outerClamp: string;
  } {
    const premiumIndex = this.getAveragePremiumIndex(symbol);
    const interestComponent = this.getInterestComponent();

    const rawRate = decAdd(premiumIndex, interestComponent);

    const mmr = contract.maintenanceMarginRate;
    const innerClamp = String(mmr * this.config.innerClampRatio);

    let clampedRate = rawRate;
    if (decCmp(rawRate, innerClamp) > 0) {
      clampedRate = innerClamp;
    } else if (decCmp(rawRate, `-${innerClamp}`) < 0) {
      clampedRate = `-${innerClamp}`;
    }

    const outerClamp = String(this.config.maxFundingRate);
    if (decCmp(clampedRate, outerClamp) > 0) {
      clampedRate = outerClamp;
    } else if (decCmp(clampedRate, `-${outerClamp}`) < 0) {
      clampedRate = `-${outerClamp}`;
    }

    const lastRate = this.getLastFundingRate(symbol);
    if (lastRate) {
      const maxAdjustment = String(this.config.maxAdjustmentPerPeriod);
      const maxIncrease = decAdd(lastRate, maxAdjustment);
      const maxDecrease = decSub(lastRate, maxAdjustment);

      if (decCmp(clampedRate, maxIncrease) > 0) {
        clampedRate = maxIncrease;
      } else if (decCmp(clampedRate, maxDecrease) < 0) {
        clampedRate = maxDecrease;
      }
    }

    return {
      rawRate,
      clampedRate,
      premiumIndex,
      interestComponent,
      innerClamp,
      outerClamp,
    };
  }

  // -------------------------------------------------------------------------
  // 预测资金费率
  // -------------------------------------------------------------------------

  private updatePredictedRate(symbol: string): void {
    const samples = this.premiumSamples.get(symbol);
    if (!samples || samples.length < 5) return;

    const premiumIndex = this.getAveragePremiumIndex(symbol);
    const interestComponent = this.getInterestComponent();
    const rawRate = decAdd(premiumIndex, interestComponent);

    this.predictedRates.set(symbol, decTruncate(rawRate, 8));
  }

  /**
   * 获取当前预估资金费率
   */
  getPredictedRate(symbol: string): string {
    return this.predictedRates.get(symbol) ?? '0';
  }

  /**
   * 获取下次资金结算时间
   */
  getNextFundingTime(symbol: string): number {
    const now = Date.now();
    const intervalMs = this.config.intervalHours * 60 * 60 * 1000;
    const lastFunding = this.lastFundingTime.get(symbol) ?? 0;

    if (lastFunding === 0) {
      return Math.ceil(now / intervalMs) * intervalMs;
    }

    return lastFunding + intervalMs;
  }

  /**
   * 获取距离下次结算的剩余时间（毫秒）
   */
  getTimeToNextFunding(symbol: string): number {
    const nextTime = this.getNextFundingTime(symbol);
    return Math.max(0, nextTime - Date.now());
  }

  /**
   * 获取完整的资金费率预测信息
   */
  getFundingPrediction(symbol: string): FundingPrediction {
    const samples = this.premiumSamples.get(symbol) ?? [];

    return {
      estimatedRate: this.getPredictedRate(symbol),
      timeToNextFunding: this.getTimeToNextFunding(symbol),
      nextFundingTime: this.getNextFundingTime(symbol),
      samplesCollected: samples.length,
      avgPremiumIndex: this.getAveragePremiumIndex(symbol),
      interestComponent: this.getInterestComponent(),
      currentMarkPrice: this.currentMarkPrices.get(symbol) ?? '0',
    };
  }

  // -------------------------------------------------------------------------
  // 资金费率结算
  // -------------------------------------------------------------------------

  /**
   * 检查并执行资金费率结算
   * @returns 结算的资金费列表（如果到了结算时间）
   */
  checkAndSettle(
    symbol: string,
    positions: Position[],
    contract: Contract,
    currentTime: number = Date.now()
  ): {
    settled: boolean;
    fundingRate?: string;
    payments?: FundingPayment[];
    totalLongPayment?: string;
    totalShortPayment?: string;
  } {
    const nextFundingTime = this.getNextFundingTime(symbol);

    if (currentTime < nextFundingTime) {
      return { settled: false };
    }

    const { clampedRate } = this.calculateFundingRate(symbol, contract);

    const markPrice = this.currentMarkPrices.get(symbol) ?? contract.lastPrice ?? '0';
    const indexPrice = this.currentIndexPrices.get(symbol) ?? markPrice;

    const payments: FundingPayment[] = [];
    let totalLongPayment = '0';
    let totalShortPayment = '0';

    for (const pos of positions) {
      if (pos.status !== 'open') continue;
      if (decIsZero(pos.size)) continue;

      const positionValue = decMul(pos.size, markPrice);
      const paymentAmount = decMul(positionValue, clampedRate);

      let actualPayment: string;
      let direction: 'long_pays_short' | 'short_pays_long';

      if (pos.side === 'long') {
        if (decIsPositive(paymentAmount)) {
          actualPayment = paymentAmount;
          direction = 'long_pays_short';
          totalLongPayment = decAdd(totalLongPayment, actualPayment);
        } else {
          actualPayment = decAbs(paymentAmount);
          direction = 'short_pays_long';
          totalShortPayment = decAdd(totalShortPayment, actualPayment);
        }
      } else {
        if (decIsPositive(paymentAmount)) {
          actualPayment = paymentAmount;
          direction = 'short_pays_long';
          totalShortPayment = decAdd(totalShortPayment, actualPayment);
        } else {
          actualPayment = decAbs(paymentAmount);
          direction = 'long_pays_short';
          totalLongPayment = decAdd(totalLongPayment, actualPayment);
        }
      }

      const payment: FundingPayment = {
        id: `fund-${Date.now()}-${pos.id}`,
        positionId: pos.id,
        userId: pos.userId,
        symbol,
        rate: clampedRate,
        amount: actualPayment,
        side: pos.side,
        positionSize: pos.size,
        fundingRate: clampedRate,
        paymentAmount: actualPayment,
        direction,
        markPrice,
        timestamp: currentTime,
        period: `${this.config.intervalHours}h`,
      };

      payments.push(payment);
    }

    const record: FundingRateRecord = {
      symbol,
      fundingRate: clampedRate,
      premiumIndex: this.getAveragePremiumIndex(symbol),
      interestComponent: this.getInterestComponent(),
      settlementTime: currentTime,
      markPrice,
      indexPrice,
      periodHours: this.config.intervalHours,
    };

    let history = this.fundingHistory.get(symbol);
    if (!history) {
      history = [];
      this.fundingHistory.set(symbol, history);
    }
    history.push(record);
    if (history.length > 1000) {
      history.shift();
    }

    this.lastFundingTime.set(symbol, currentTime);

    const samples = this.premiumSamples.get(symbol);
    if (samples) {
      samples.length = 0;
    }

    this.emit('fundingSettled', {
      symbol,
      fundingRate: clampedRate,
      payments,
      totalLongPayment,
      totalShortPayment,
      record,
    });

    logger.info(
      `[funding] settled ${symbol} rate=${parseFloat(clampedRate) * 100}% ` +
      `payments=${payments.length} long=${totalLongPayment} short=${totalShortPayment}`
    );

    return {
      settled: true,
      fundingRate: clampedRate,
      payments,
      totalLongPayment,
      totalShortPayment,
    };
  }

  // -------------------------------------------------------------------------
  // 历史查询
  // -------------------------------------------------------------------------

  /**
   * 获取历史资金费率
   */
  getFundingHistory(symbol: string, limit?: number): FundingRateRecord[] {
    const history = this.fundingHistory.get(symbol) ?? [];
    if (limit && limit < history.length) {
      return history.slice(history.length - limit);
    }
    return [...history];
  }

  /**
   * 获取最近一期资金费率
   */
  getLastFundingRate(symbol: string): string | null {
    const history = this.fundingHistory.get(symbol);
    if (!history || history.length === 0) return null;
    return history[history.length - 1].fundingRate;
  }

  /**
   * 获取溢价指数采样历史
   */
  getPremiumSamples(symbol: string, limit?: number): PremiumSample[] {
    const samples = this.premiumSamples.get(symbol) ?? [];
    if (limit && limit < samples.length) {
      return samples.slice(samples.length - limit);
    }
    return [...samples];
  }

  // -------------------------------------------------------------------------
  // 标记价计算
  // =========================================================================
  /**
   * 计算标记价格（中位数法）
   * 标记价 = 中位数(深度加权买价, 深度加权卖价, 最新成交价)
   */
  calculateMarkPrice(
    symbol: string,
    lastPrice: string,
    bids: Array<{ price: string; quantity: string }>,
    asks: Array<{ price: string; quantity: string }>
  ): string {
    const indexPrice = this.currentIndexPrices.get(symbol);
    if (!indexPrice) return lastPrice;

    const { depthBidPrice, depthAskPrice } = calculateDepthWeightedPrice(
      bids,
      asks,
      indexPrice,
      this.config.depthWeightRatio
    );

    const values = [depthBidPrice, depthAskPrice, lastPrice].sort((a, b) => decCmp(a, b));
    return values[1];
  }

  // -------------------------------------------------------------------------
  // 统计
  // -------------------------------------------------------------------------

  getStats(): {
    totalSymbols: number;
    totalSamples: number;
    totalHistoryRecords: number;
  } {
    let totalSamples = 0;
    let totalHistory = 0;

    for (const samples of this.premiumSamples.values()) {
      totalSamples += samples.length;
    }
    for (const history of this.fundingHistory.values()) {
      totalHistory += history.length;
    }

    return {
      totalSymbols: this.premiumSamples.size,
      totalSamples,
      totalHistoryRecords: totalHistory,
    };
  }
}
