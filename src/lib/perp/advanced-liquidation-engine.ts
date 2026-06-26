/**
 * 高级强平引擎（Advanced Liquidation Engine）
 *
 * 强平等级（阶梯强平）：
 *  Level 1: 警告（marginRatio < 1.5 * mmr）→ 追加保证金通知
 *  Level 2: 部分强平（marginRatio < 1.2 * mmr）→ 强制减仓50%
 *  Level 3: 全部强平（marginRatio < mmr）→ 全部强平
 *  Level 4: 破产（marginRatio < 0）→ 破产价强平 + 保险基金
 *
 * 强平方式：
 *  - 限价强平：在强平价挂限价单，吃单成交
 *  - 市价强平：直接市价成交
 *  - 部分强平：按比例减仓，避免市场冲击
 *  - ADL自动减仓：保险基金不足时，对盈利方自动减仓
 *  - 穿仓分摊：极端行情下，所有盈利方按比例分摊损失
 *
 * 风险控制：
 *  - 强平冷却时间：同一账户短时间内不能多次强平
 *  - 强平熔断：单交易对强平过多时暂停
 *  - 保险基金阈值：低于阈值时触发ADL/穿仓分摊
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
  decTruncate,
  decMax,
  decMin,
  decAbs,
} from '@/lib/matching/decimal';
import { MarginCalculator } from './margin-calculator';
import type {
  Contract,
  Position,
  Side,
  MarginMode,
  Liquidation,
  InsuranceFund,
} from './types';
import { logger } from '@/lib/logger';

// ============================================================================
// 类型定义
// ============================================================================

/** 强平等级 */
export type LiquidationLevel = 'warning' | 'partial' | 'full' | 'bankruptcy';

/** 强平策略 */
export type LiquidationStrategy =
  | 'limit'           // 限价强平
  | 'market'          // 市价强平
  | 'auto'            // 自动（先限价，超时市价）
  | 'adl';            // ADL自动减仓

/** 部分强平比例 */
export interface PartialLiquidationTier {
  /** 触发阈值（marginRatio 相对于 mmr 的比例） */
  thresholdRatio: number;
  /** 减仓比例（0-1） */
  reduceRatio: number;
  /** 等级名称 */
  level: LiquidationLevel;
}

/** 强平配置 */
export interface AdvancedLiquidationConfig {
  /** 部分强平档位（从高到低排列） */
  partialTiers: PartialLiquidationTier[];
  /** 强平手续费率 */
  liquidationFeeRate: number;
  /** 强平罚金率（归保险基金） */
  liquidationPenaltyRate: number;
  /** 限价强平超时时间（ms） */
  limitOrderTimeout: number;
  /** 同一账户强平冷却时间（ms） */
  accountCooldown: number;
  /** 单交易对每分钟最大强平次数 */
  maxLiquidationsPerMinute: number;
  /** ADL触发阈值（保险基金余额 / 初始资金） */
  adlTriggerRatio: number;
  /** 穿仓分摊触发阈值（保险基金为0且ADL不够） */
  clawbackEnabled: boolean;
  /** 穿仓分摊比例上限（0-1） */
  maxClawbackRatio: number;
  /** 最大杠杆对应的最低维持保证金率 */
  leverageMaintenanceMarginRates: Array<{
    maxLeverage: number;
    maintenanceMarginRate: number;
  }>;
}

/** 强平执行结果 */
export interface AdvancedLiquidateResult {
  /** 强平记录 */
  liquidation: Liquidation;
  /** 强平等级 */
  level: LiquidationLevel;
  /** 实际平仓数量 */
  liquidatedSize: string;
  /** 实际强平价格（加权平均） */
  executedPrice: string;
  /** 强平手续费 */
  liquidationFee: string;
  /** 强平罚金（入保险基金） */
  penalty: string;
  /** 是否触发了ADL */
  adlTriggered: boolean;
  /** ADL减仓的对手仓位 */
  adlPositions: Array<{
    positionId: string;
    userId: string;
    reducedSize: string;
    adlPrice: string;
    pnl: string;
  }>;
  /** 是否触发了穿仓分摊 */
  clawbackTriggered: boolean;
  /** 穿仓分摊比例 */
  clawbackRatio?: string;
  /** 更新后的保险基金 */
  updatedInsuranceFund: InsuranceFund;
  /** 剩余持仓（部分强平时） */
  remainingPosition?: Position;
}

/** ADL排名项 */
export interface AdlRankItem {
  positionId: string;
  userId: string;
  symbol: string;
  side: Side;
  size: string;
  /** ADL得分 = 杠杆 * (收益率 + 1)，越高越优先被减仓 */
  adlScore: number;
  /** 未实现盈亏 */
  unrealizedPnl: string;
  /** 收益率 */
  pnlRate: number;
  /** 杠杆 */
  leverage: number;
}

/** 穿仓分摊结果 */
export interface ClawbackResult {
  totalLoss: string;
  clawbackRatio: string;
  affectedPositions: Array<{
    positionId: string;
    userId: string;
    pnlReduction: string;
  }>;
}

// ============================================================================
// 默认配置
// ============================================================================

const DEFAULT_CONFIG: AdvancedLiquidationConfig = {
  partialTiers: [
    { thresholdRatio: 1.5, reduceRatio: 0, level: 'warning' },
    { thresholdRatio: 1.2, reduceRatio: 0.25, level: 'partial' },
    { thresholdRatio: 1.0, reduceRatio: 0.5, level: 'partial' },
    { thresholdRatio: 0.8, reduceRatio: 1.0, level: 'full' },
    { thresholdRatio: 0, reduceRatio: 1.0, level: 'bankruptcy' },
  ],
  liquidationFeeRate: 0.001,
  liquidationPenaltyRate: 0.005,
  limitOrderTimeout: 30000,
  accountCooldown: 5000,
  maxLiquidationsPerMinute: 50,
  adlTriggerRatio: 0.3,
  clawbackEnabled: true,
  maxClawbackRatio: 0.25,
  leverageMaintenanceMarginRates: [
    { maxLeverage: 10, maintenanceMarginRate: 0.005 },
    { maxLeverage: 20, maintenanceMarginRate: 0.01 },
    { maxLeverage: 50, maintenanceMarginRate: 0.02 },
    { maxLeverage: 100, maintenanceMarginRate: 0.05 },
    { maxLeverage: 125, maintenanceMarginRate: 0.08 },
  ],
};

// ============================================================================
// 高级强平引擎
// ============================================================================

export class AdvancedLiquidationEngine {
  private readonly config: AdvancedLiquidationConfig;
  private readonly calculator: MarginCalculator;
  private readonly emitter = new EventEmitter();

  private readonly recentLiquidations = new Map<string, Array<{ time: number; symbol: string }>>();
  private readonly symbolLiquidationCount = new Map<string, Array<number>>();
  private readonly lastAccountLiquidation = new Map<string, number>();

  private insuranceFunds = new Map<string, InsuranceFund>();
  private adlRankings = new Map<string, { longs: AdlRankItem[]; shorts: AdlRankItem[] }>();

  private liqSeq = 0;

  constructor(
    config: Partial<AdvancedLiquidationConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.calculator = new MarginCalculator();
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
      logger.error('[liquidation] event listener error', e);
    }
  }

  // -------------------------------------------------------------------------
  // 保证金率相关
  // -------------------------------------------------------------------------

  /**
   * 根据杠杆获取维持保证金率
   */
  getMaintenanceMarginRate(leverage: number): number {
    const tiers = this.config.leverageMaintenanceMarginRates;
    for (const tier of tiers) {
      if (leverage <= tier.maxLeverage) {
        return tier.maintenanceMarginRate;
      }
    }
    return tiers[tiers.length - 1].maintenanceMarginRate;
  }

  /**
   * 计算初始保证金率
   */
  getInitialMarginRate(leverage: number): number {
    return 1 / leverage;
  }

  /**
   * 计算强平等级
   */
  getLiquidationLevel(
    position: Position,
    markPrice: string,
    contract: Contract
  ): { level: LiquidationLevel; marginRatio: string; mmr: number; reduceRatio: number } {
    const mmr = this.getMaintenanceMarginRate(position.leverage);
    const positionValue = this.calculator.calculateNotional(position.size, markPrice);
    const marginRatio = this.calculator.calculateMarginRatio(
      position.margin,
      position.unrealizedPnl,
      positionValue
    );

    const marginRatioNum = parseFloat(marginRatio);
    const mmrNum = mmr;

    let level: LiquidationLevel = 'warning';
    let reduceRatio = 0;

    for (const tier of this.config.partialTiers) {
      if (marginRatioNum < mmrNum * tier.thresholdRatio) {
        level = tier.level;
        reduceRatio = tier.reduceRatio;
      } else {
        break;
      }
    }

    return {
      level,
      marginRatio,
      mmr: mmrNum,
      reduceRatio,
    };
  }

  // -------------------------------------------------------------------------
  // 强平价计算
  // -------------------------------------------------------------------------

  /**
   * 计算强平价（考虑部分强平档位）
   * 返回各档位的强平价
   */
  private calculatePositionLiquidationPrice(
    position: Position,
    _contract: Contract,
    mmr: number
  ): string {
    return this.calculator.calculateLiquidationPrice(
      position.side,
      position.entryPrice,
      position.leverage,
      mmr,
      position.marginMode
    );
  }

  private calculatePositionBankruptcyPrice(position: Position): string {
    return this.calculator.calculateBankruptcyPrice(
      position.side,
      position.entryPrice,
      position.leverage,
      position.marginMode
    );
  }

  calculateLiquidationPrices(
    position: Position,
    contract: Contract
  ): {
    warningPrice: string;
    partialFirstPrice: string;
    partialSecondPrice: string;
    fullLiquidationPrice: string;
    bankruptcyPrice: string;
  } {
    const mmr = this.getMaintenanceMarginRate(position.leverage);
    const tiers = this.config.partialTiers;

    const calcLiqPrice = (thresholdRatio: number): string => {
      return this.calculatePositionLiquidationPrice(
        position,
        contract,
        mmr * thresholdRatio
      );
    };

    const bankruptcyPrice = this.calculatePositionBankruptcyPrice(position);

    return {
      warningPrice: calcLiqPrice(tiers[0].thresholdRatio),
      partialFirstPrice: calcLiqPrice(tiers[1].thresholdRatio),
      partialSecondPrice: calcLiqPrice(tiers[2].thresholdRatio),
      fullLiquidationPrice: calcLiqPrice(tiers[3].thresholdRatio),
      bankruptcyPrice,
    };
  }

  // -------------------------------------------------------------------------
  // 强平检查与熔断
  // -------------------------------------------------------------------------

  /**
   * 检查账户是否在冷却期
   */
  isAccountInCooldown(userId: string): boolean {
    const lastLiqTime = this.lastAccountLiquidation.get(userId);
    if (!lastLiqTime) return false;
    return Date.now() - lastLiqTime < this.config.accountCooldown;
  }

  /**
   * 检查交易对是否达到强平熔断阈值
   */
  isSymbolRateLimited(symbol: string): boolean {
    const timestamps = this.symbolLiquidationCount.get(symbol) ?? [];
    const now = Date.now();
    const recent = timestamps.filter(t => now - t < 60000);
    this.symbolLiquidationCount.set(symbol, recent);
    return recent.length >= this.config.maxLiquidationsPerMinute;
  }

  /**
   * 记录一次强平
   */
  private recordLiquidation(userId: string, symbol: string): void {
    this.lastAccountLiquidation.set(userId, Date.now());

    const timestamps = this.symbolLiquidationCount.get(symbol) ?? [];
    timestamps.push(Date.now());
    this.symbolLiquidationCount.set(symbol, timestamps);

    const recent = this.recentLiquidations.get(userId) ?? [];
    recent.push({ time: Date.now(), symbol });
    this.recentLiquidations.set(userId, recent.slice(-20));
  }

  // -------------------------------------------------------------------------
  // 执行强平
  // -------------------------------------------------------------------------

  /**
   * 执行强平（主入口）
   */
  liquidate(
    position: Position,
    markPrice: string,
    contract: Contract,
    strategy: LiquidationStrategy = 'auto',
    availableInsuranceFund?: InsuranceFund
  ): AdvancedLiquidateResult {
    const { level, marginRatio, reduceRatio } = this.getLiquidationLevel(position, markPrice, contract);

    if (level === 'warning') {
      this.emit('liquidationWarning', { position, markPrice, marginRatio });
      throw new Error('Position is only in warning level, not liquidatable');
    }

    if (this.isAccountInCooldown(position.userId)) {
      throw new Error('Account in liquidation cooldown');
    }

    if (this.isSymbolRateLimited(position.symbol)) {
      throw new Error('Symbol liquidation rate limit exceeded');
    }

    this.recordLiquidation(position.userId, position.symbol);

    const positionValue = this.calculator.calculateNotional(position.size, markPrice);
    const liquidateSize = level === 'full' || level === 'bankruptcy'
      ? position.size
      : decTruncate(decMul(position.size, String(reduceRatio)), 8);

    let executedPrice: string;
    let liquidationFee: string;
    let penalty: string;
    let adlTriggered = false;
    let adlPositions: AdvancedLiquidateResult['adlPositions'] = [];
    let clawbackTriggered = false;
    let clawbackRatio: string | undefined;

    if (level === 'bankruptcy') {
      const bankruptcyPrice = this.calculatePositionBankruptcyPrice(position);
      executedPrice = bankruptcyPrice;

      const notional = decMul(liquidateSize, bankruptcyPrice);
      liquidationFee = '0';
      penalty = '0';

      const lossAmount = decAbs(decSub(position.margin, '0'));
      let remainingLoss = lossAmount;

      if (availableInsuranceFund) {
        const fundLoss = decMin(remainingLoss, availableInsuranceFund.balance);
        remainingLoss = decSub(remainingLoss, fundLoss);
        availableInsuranceFund.balance = decSub(availableInsuranceFund.balance, fundLoss);
        availableInsuranceFund.totalLoss = decAdd(availableInsuranceFund.totalLoss, fundLoss);
      }

      if (decIsPositive(remainingLoss)) {
        adlTriggered = true;
        const adlResult = this.executeADL(
          position.symbol,
          position.side === 'long' ? 'short' : 'long',
          remainingLoss,
          markPrice
        );
        adlPositions = adlResult.positions;
        remainingLoss = adlResult.remainingLoss;
      }

      if (decIsPositive(remainingLoss) && this.config.clawbackEnabled) {
        clawbackTriggered = true;
        const clawbackResult = this.executeClawback(
          position.symbol,
          position.side === 'long' ? 'short' : 'long',
          remainingLoss
        );
        clawbackRatio = clawbackResult.clawbackRatio;
      }

    } else {
      executedPrice = this.calculateExecutionPrice(position, liquidateSize, markPrice, strategy);

      const notional = decMul(liquidateSize, executedPrice);
      liquidationFee = decTruncate(decMul(notional, String(this.config.liquidationFeeRate)), 8);
      penalty = decTruncate(decMul(notional, String(this.config.liquidationPenaltyRate)), 8);

      if (availableInsuranceFund) {
        availableInsuranceFund.balance = decAdd(availableInsuranceFund.balance, penalty);
        availableInsuranceFund.totalGain = decAdd(availableInsuranceFund.totalGain, penalty);
      }
    }

    const liqId = this.generateLiquidationId();

    const liquidation: Liquidation = {
      id: liqId,
      positionId: position.id,
      userId: position.userId,
      symbol: position.symbol,
      side: position.side,
      quantity: liquidateSize,
      liquidatedSize: liquidateSize,
      liquidationPrice: executedPrice,
      markPrice,
      bankruptcyPrice: level === 'bankruptcy' ? executedPrice : this.calculatePositionBankruptcyPrice(position),
      marginLost: decMin(position.margin, decAdd(liquidationFee, penalty)),
      fee: liquidationFee,
      penalty,
      remainingMargin: '0',
      insuranceFundUsed: '0',
      adlTriggered,
      reason: `Liquidation level: ${level}`,
      timestamp: Date.now(),
      status: 'completed',
    };

    this.emit('liquidationExecuted', {
      liquidation,
      level,
      adlTriggered,
      clawbackTriggered,
    });

    logger.warn(
      `[liquidation] ${level} liquidation ${liqId} for ${position.userId} ` +
      `${position.symbol} ${position.side} size=${liquidateSize} price=${executedPrice}`
    );

    return {
      liquidation,
      level,
      liquidatedSize: liquidateSize,
      executedPrice,
      liquidationFee,
      penalty,
      adlTriggered,
      adlPositions,
      clawbackTriggered,
      clawbackRatio,
      updatedInsuranceFund: availableInsuranceFund ?? this.getInsuranceFund(position.symbol),
    };
  }

  /**
   * 计算强平执行价格
   */
  private calculateExecutionPrice(
    position: Position,
    size: string,
    markPrice: string,
    strategy: LiquidationStrategy
  ): string {
    const slippage = position.side === 'long' ? 0.005 : -0.005;
    const marketPrice = decMul(markPrice, String(1 + slippage));

    switch (strategy) {
      case 'market':
        return marketPrice;
      case 'limit':
      case 'auto':
      default:
        return markPrice;
    }
  }

  // -------------------------------------------------------------------------
  // ADL（自动减仓）
  // -------------------------------------------------------------------------

  /**
   * 计算ADL得分
   * score = leverage * (pnlRate + 1)
   * 得分越高，越优先被减仓
   */
  calculateAdlScore(position: Position, markPrice: string): AdlRankItem {
    const unrealizedPnl = this.calculator.calculateUnrealizedPnl(
      position.side,
      position.size,
      position.entryPrice,
      markPrice
    );
    const positionValue = this.calculator.calculateNotional(position.size, markPrice);
    const pnlRate = parseFloat(decDiv(unrealizedPnl, position.margin, 10));
    const adlScore = position.leverage * (pnlRate + 1);

    return {
      positionId: position.id,
      userId: position.userId,
      symbol: position.symbol,
      side: position.side,
      size: position.size,
      adlScore,
      unrealizedPnl,
      pnlRate,
      leverage: position.leverage,
    };
  }

  /**
   * 更新ADL排名
   */
  updateAdlRanking(symbol: string, positions: Position[], markPrice: string): void {
    const longs: AdlRankItem[] = [];
    const shorts: AdlRankItem[] = [];

    for (const pos of positions) {
      if (pos.status !== 'open') continue;
      if (decIsZero(pos.size)) continue;

      const item = this.calculateAdlScore(pos, markPrice);
      if (pos.side === 'long') {
        longs.push(item);
      } else {
        shorts.push(item);
      }
    }

    longs.sort((a, b) => b.adlScore - a.adlScore);
    shorts.sort((a, b) => b.adlScore - a.adlScore);

    this.adlRankings.set(symbol, { longs, shorts });
  }

  /**
   * 获取ADL排名
   */
  getAdlRanking(symbol: string): { longs: AdlRankItem[]; shorts: AdlRankItem[] } | undefined {
    return this.adlRankings.get(symbol);
  }

  /**
   * 执行ADL自动减仓
   * @param symbol 交易对
   * @param oppositeSide 对手方向（要减仓的方向）
   * @param lossAmount 需要填补的亏损金额
   * @param markPrice 当前标记价
   */
  executeADL(
    symbol: string,
    oppositeSide: Side,
    lossAmount: string,
    markPrice: string
  ): {
    positions: Array<{
      positionId: string;
      userId: string;
      reducedSize: string;
      adlPrice: string;
      pnl: string;
    }>;
    remainingLoss: string;
  } {
    const ranking = this.adlRankings.get(symbol);
    if (!ranking) {
      return { positions: [], remainingLoss: lossAmount };
    }

    const candidates = oppositeSide === 'long' ? ranking.longs : ranking.shorts;
    const result: Array<{
      positionId: string;
      userId: string;
      reducedSize: string;
      adlPrice: string;
      pnl: string;
    }> = [];

    let remainingLoss = lossAmount;

    for (const candidate of candidates) {
      if (decCmp(remainingLoss, '0') <= 0) break;

      const posPnl = candidate.unrealizedPnl;
      if (!decIsPositive(posPnl)) continue;

      const availablePnl = posPnl;
      const pnlToUse = decMin(remainingLoss, availablePnl);
      const reduceRatio = parseFloat(decDiv(pnlToUse, availablePnl, 10));
      const reducedSize = decTruncate(decMul(candidate.size, String(reduceRatio)), 8);

      result.push({
        positionId: candidate.positionId,
        userId: candidate.userId,
        reducedSize,
        adlPrice: markPrice,
        pnl: pnlToUse,
      });

      remainingLoss = decSub(remainingLoss, pnlToUse);
    }

    this.emit('adlExecuted', {
      symbol,
      side: oppositeSide,
      totalReducedPnl: decSub(lossAmount, remainingLoss),
      positions: result,
    });

    return { positions: result, remainingLoss };
  }

  // -------------------------------------------------------------------------
  // 穿仓分摊（Clawback）
  // -------------------------------------------------------------------------

  /**
   * 执行穿仓分摊
   * 极端行情下，保险基金和ADL都不够填补亏损时，
   * 所有盈利方按盈利比例分摊剩余亏损
   */
  executeClawback(
    symbol: string,
    profitableSide: Side,
    remainingLoss: string
  ): ClawbackResult {
    const ranking = this.adlRankings.get(symbol);
    if (!ranking) {
      return { totalLoss: remainingLoss, clawbackRatio: '0', affectedPositions: [] };
    }

    const positions = profitableSide === 'long' ? ranking.longs : ranking.shorts;
    const profitablePositions = positions.filter(p => decIsPositive(p.unrealizedPnl));

    let totalProfit = '0';
    for (const p of profitablePositions) {
      totalProfit = decAdd(totalProfit, p.unrealizedPnl);
    }

    if (decIsZero(totalProfit)) {
      return { totalLoss: remainingLoss, clawbackRatio: '0', affectedPositions: [] };
    }

    let clawbackRatio = parseFloat(decDiv(remainingLoss, totalProfit, 10));
    clawbackRatio = Math.min(clawbackRatio, this.config.maxClawbackRatio);

    const affected: ClawbackResult['affectedPositions'] = [];
    let totalClawbacked = '0';

    for (const p of profitablePositions) {
      const reduction = decTruncate(decMul(p.unrealizedPnl, String(clawbackRatio)), 8);
      affected.push({
        positionId: p.positionId,
        userId: p.userId,
        pnlReduction: reduction,
      });
      totalClawbacked = decAdd(totalClawbacked, reduction);
    }

    this.emit('clawbackExecuted', {
      symbol,
      side: profitableSide,
      totalLoss: remainingLoss,
      clawbackRatio: String(clawbackRatio),
      totalClawbacked,
      affectedCount: affected.length,
    });

    logger.warn(
      `[liquidation] clawback executed for ${symbol}, ratio=${(clawbackRatio * 100).toFixed(2)}%, ` +
      `total=${totalClawbacked}, affected=${affected.length}`
    );

    return {
      totalLoss: remainingLoss,
      clawbackRatio: String(clawbackRatio),
      affectedPositions: affected,
    };
  }

  // -------------------------------------------------------------------------
  // 保险基金
  // -------------------------------------------------------------------------

  /**
   * 获取保险基金
   */
  getInsuranceFund(symbol: string): InsuranceFund {
    if (!this.insuranceFunds.has(symbol)) {
      this.insuranceFunds.set(symbol, {
        symbol,
        balance: '1000000',
        totalContributed: '1000000',
        totalUsed: '0',
        totalGain: '0',
        totalLoss: '0',
        peakBalance: '1000000',
        lastUpdated: Date.now(),
      });
    }
    return this.insuranceFunds.get(symbol)!;
  }

  /**
   * 充值保险基金
   */
  addInsuranceFund(symbol: string, amount: string, reason: string): void {
    const fund = this.getInsuranceFund(symbol);
    fund.balance = decAdd(fund.balance, amount);
    fund.totalGain = decAdd(fund.totalGain, amount);
    fund.lastUpdated = Date.now();

    if (decCmp(fund.balance, fund.peakBalance) > 0) {
      fund.peakBalance = fund.balance;
    }

    this.emit('insuranceFundUpdated', { fund, amount, reason, type: 'add' });
  }

  /**
   * 从保险基金支出
   */
  deductInsuranceFund(symbol: string, amount: string, reason: string): boolean {
    const fund = this.getInsuranceFund(symbol);
    if (decCmp(fund.balance, amount) < 0) {
      return false;
    }

    fund.balance = decSub(fund.balance, amount);
    fund.totalLoss = decAdd(fund.totalLoss, amount);
    fund.lastUpdated = Date.now();

    this.emit('insuranceFundUpdated', { fund, amount, reason, type: 'deduct' });
    return true;
  }

  /**
   * 检查是否需要触发ADL（保险基金余额低于阈值）
   */
  shouldTriggerADL(symbol: string): boolean {
    const fund = this.getInsuranceFund(symbol);
    const ratio = parseFloat(decDiv(fund.balance, fund.peakBalance, 10));
    return ratio < this.config.adlTriggerRatio;
  }

  // -------------------------------------------------------------------------
  // 批量强平
  // -------------------------------------------------------------------------

  /**
   * 批量检查并执行强平
   * 用于周期性扫描所有持仓
   */
  batchLiquidate(
    positions: Position[],
    markPrices: Map<string, string>,
    contracts: Map<string, Contract>
  ): {
    liquidations: AdvancedLiquidateResult[];
    warnings: Position[];
    skipped: number;
  } {
    const liquidations: AdvancedLiquidateResult[] = [];
    const warnings: Position[] = [];
    let skipped = 0;

    for (const pos of positions) {
      try {
        const markPrice = markPrices.get(pos.symbol);
        const contract = contracts.get(pos.symbol);

        if (!markPrice || !contract) {
          skipped++;
          continue;
        }

        const { level } = this.getLiquidationLevel(pos, markPrice, contract);

        if (level === 'warning') {
          warnings.push(pos);
          continue;
        }

        const result = this.liquidate(pos, markPrice, contract);
        liquidations.push(result);
      } catch (e) {
        skipped++;
      }
    }

    return { liquidations, warnings, skipped };
  }

  // -------------------------------------------------------------------------
  // 生成ID
  // -------------------------------------------------------------------------

  private generateLiquidationId(): string {
    this.liqSeq++;
    return `liq-${Date.now()}-${this.liqSeq}`;
  }

  // -------------------------------------------------------------------------
  // 统计
  // -------------------------------------------------------------------------

  getStats(): {
    totalInsuranceFunds: number;
    totalInsuranceBalance: string;
    adlRankings: number;
    recentLiquidations24h: number;
  } {
    let totalBalance = '0';
    for (const fund of this.insuranceFunds.values()) {
      totalBalance = decAdd(totalBalance, fund.balance);
    }

    let recentCount = 0;
    const now = Date.now();
    for (const recent of this.recentLiquidations.values()) {
      for (const r of recent) {
        if (now - r.time < 24 * 60 * 60 * 1000) {
          recentCount++;
        }
      }
    }

    return {
      totalInsuranceFunds: this.insuranceFunds.size,
      totalInsuranceBalance: totalBalance,
      adlRankings: this.adlRankings.size,
      recentLiquidations24h: recentCount,
    };
  }
}
