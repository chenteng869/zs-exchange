/**
 * 高级保证金计算器（Advanced Margin Calculator）
 *
 * 支持的保证金模式：
 *  - 全仓保证金（Cross Margin）：所有仓位共享账户权益
 *  - 逐仓保证金（Isolated Margin）：每个仓位独立保证金
 *
 * 分级保证金体系：
 *  - 基于名义价值的阶梯保证金率
 *  - 不同杠杆对应不同的维持保证金率
 *  - 风险等级动态调整
 *
 * 核心计算：
 *  - 初始保证金（Initial Margin）
 *  - 维持保证金（Maintenance Margin）
 *  - 未实现盈亏（Unrealized PnL）
 *  - 保证金率（Margin Ratio）
 *  - 强平价（Liquidation Price）
 *  - 破产价（Bankruptcy Price）
 *  - 账户权益（Account Equity）
 *  - 可用保证金（Available Margin）
 *  - 风险等级（Risk Level）
 *
 * 精度：
 *  - 所有金额计算保留 18 位中间精度
 *  - 输出截断到 8-10 位
 *  - 向上/向下取整策略明确
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
import type { Contract, Position, Side, MarginMode } from './types';
import { logger } from '@/lib/logger';

// ============================================================================
// 类型定义
// ============================================================================

/** 风险等级 */
export type RiskLevel =
  | 'safe'        // 安全：保证金率 > 200%
  | 'low'         // 低风险：保证金率 150%-200%
  | 'medium'      // 中风险：保证金率 120%-150%
  | 'high'        // 高风险：保证金率 105%-120%
  | 'dangerous'   // 危险：保证金率 100%-105%
  | 'liquidation'; // 强平：保证金率 < 100%

/** 保证金计算结果 */
export interface MarginCalculationResult {
  /** 持仓价值（名义价值） */
  positionValue: string;
  /** 初始保证金 */
  initialMargin: string;
  /** 初始保证金率 */
  initialMarginRate: string;
  /** 维持保证金 */
  maintenanceMargin: string;
  /** 维持保证金率 */
  maintenanceMarginRate: string;
  /** 未实现盈亏 */
  unrealizedPnl: string;
  /** 未实现盈亏率 */
  unrealizedPnlRate: string;
  /** 保证金余额（含未实现盈亏） */
  marginBalance: string;
  /** 保证金率 */
  marginRatio: string;
  /** 可用保证金 */
  availableMargin: string;
  /** 风险等级 */
  riskLevel: RiskLevel;
  /** 强平价 */
  liquidationPrice: string;
  /** 破产价 */
  bankruptcyPrice: string;
  /** 杠杆倍数 */
  leverage: number;
  /** 实际杠杆（考虑未实现盈亏） */
  effectiveLeverage: string;
}

/** 全仓账户计算结果 */
export interface CrossMarginAccountResult {
  /** 账户权益 = 钱包余额 + 所有未实现盈亏 */
  equity: string;
  /** 钱包余额 */
  walletBalance: string;
  /** 总未实现盈亏 */
  totalUnrealizedPnl: string;
  /** 总占用初始保证金 */
  totalInitialMargin: string;
  /** 总占用维持保证金 */
  totalMaintenanceMargin: string;
  /** 可用保证金 */
  availableMargin: string;
  /** 账户保证金率 */
  marginRatio: string;
  /** 风险等级 */
  riskLevel: RiskLevel;
  /** 可开仓杠杆（基于可用保证金） */
  maxLeverage: number;
  /** 持仓数量 */
  positionCount: number;
}

/** 阶梯保证金档位 */
export interface MarginTier {
  /** 档位名称 */
  name: string;
  /** 最小名义价值（包含） */
  minNotional: string;
  /** 最大名义价值（不含） */
  maxNotional: string;
  /** 初始保证金率 */
  initialMarginRate: number;
  /** 维持保证金率 */
  maintenanceMarginRate: number;
  /** 最大杠杆 */
  maxLeverage: number;
}

// ============================================================================
// 默认保证金阶梯配置
// ============================================================================

const DEFAULT_MARGIN_TIERS: MarginTier[] = [
  { name: 'Tier 1', minNotional: '0', maxNotional: '50000', initialMarginRate: 0.01, maintenanceMarginRate: 0.005, maxLeverage: 100 },
  { name: 'Tier 2', minNotional: '50000', maxNotional: '250000', initialMarginRate: 0.02, maintenanceMarginRate: 0.01, maxLeverage: 50 },
  { name: 'Tier 3', minNotional: '250000', maxNotional: '1000000', initialMarginRate: 0.05, maintenanceMarginRate: 0.025, maxLeverage: 20 },
  { name: 'Tier 4', minNotional: '1000000', maxNotional: '5000000', initialMarginRate: 0.1, maintenanceMarginRate: 0.05, maxLeverage: 10 },
  { name: 'Tier 5', minNotional: '5000000', maxNotional: '20000000', initialMarginRate: 0.2, maintenanceMarginRate: 0.1, maxLeverage: 5 },
  { name: 'Tier 6', minNotional: '20000000', maxNotional: '50000000', initialMarginRate: 0.333, maintenanceMarginRate: 0.167, maxLeverage: 3 },
  { name: 'Tier 7', minNotional: '50000000', maxNotional: '10000000000', initialMarginRate: 0.5, maintenanceMarginRate: 0.25, maxLeverage: 2 },
];

// ============================================================================
// 高级保证金计算器
// ============================================================================

export class AdvancedMarginCalculator {
  private marginTiers: MarginTier[];

  constructor(customTiers?: MarginTier[]) {
    this.marginTiers = customTiers ?? DEFAULT_MARGIN_TIERS;
  }

  // -------------------------------------------------------------------------
  // 基础计算
  // -------------------------------------------------------------------------

  /**
   * 计算名义价值（持仓价值）
   * notional = size * price
   */
  calculateNotional(size: string, price: string): string {
    return decMul(size, price);
  }

  /**
   * 根据名义价值获取保证金档位
   */
  getMarginTier(notional: string): MarginTier {
    for (const tier of this.marginTiers) {
      if (decCmp(notional, tier.minNotional) >= 0 && decCmp(notional, tier.maxNotional) < 0) {
        return tier;
      }
    }
    return this.marginTiers[this.marginTiers.length - 1];
  }

  /**
   * 计算初始保证金
   * initialMargin = notional * initialMarginRate
   */
  calculateInitialMargin(notional: string, leverage: number): string {
    const rate = 1 / leverage;
    return toFixedScale(decTruncate(decMul(notional, String(rate)), 8), 8);
  }

  /**
   * 计算维持保证金
   * maintenanceMargin = notional * maintenanceMarginRate
   */
  calculateMaintenanceMargin(notional: string, leverage: number): string {
    const tier = this.getMarginTier(notional);
    const mmr = Math.min(tier.maintenanceMarginRate, 1 / leverage);
    return toFixedScale(decTruncate(decMul(notional, String(mmr)), 8), 8);
  }

  /**
   * 获取维持保证金率
   */
  getMaintenanceMarginRate(notional: string, leverage: number): number {
    const tier = this.getMarginTier(notional);
    return Math.min(tier.maintenanceMarginRate, 1 / leverage);
  }

  /**
   * 获取初始保证金率
   */
  getInitialMarginRate(notional: string, leverage: number): number {
    const tier = this.getMarginTier(notional);
    return Math.min(tier.initialMarginRate, 1 / leverage);
  }

  // -------------------------------------------------------------------------
  // 未实现盈亏
  // -------------------------------------------------------------------------

  /**
   * 计算未实现盈亏
   *
   * 多单：PnL = (markPrice - entryPrice) * size
   * 空单：PnL = (entryPrice - markPrice) * size
   */
  calculateUnrealizedPnl(position: Position, markPrice: string): string {
    const diff = decSub(markPrice, position.entryPrice);

    if (position.side === 'long') {
      return decTruncate(decMul(diff, position.size), 8);
    } else {
      return decTruncate(decMul(decNeg(diff), position.size), 8);
    }
  }

  /**
   * 计算未实现盈亏率
   * PnL% = PnL / margin
   */
  calculateUnrealizedPnlRate(unrealizedPnl: string, margin: string): string {
    if (decIsZero(margin)) return '0';
    return decTruncate(decDiv(unrealizedPnl, margin, 10), 8);
  }

  // -------------------------------------------------------------------------
  // 保证金率
  // -------------------------------------------------------------------------

  /**
   * 计算保证金率
   * marginRatio = (margin + unrealizedPnl) / positionValue
   */
  calculateMarginRatio(
    margin: string,
    unrealizedPnl: string,
    positionValue: string
  ): string {
    if (decIsZero(positionValue)) return '1';
    const marginBalance = decAdd(margin, unrealizedPnl);
    return decDiv(marginBalance, positionValue, 10);
  }

  /**
   * 计算全仓模式下的账户保证金率
   * marginRatio = (walletBalance + totalUnrealizedPnl) / totalMaintenanceMargin
   */
  calculateCrossMarginRatio(
    walletBalance: string,
    totalUnrealizedPnl: string,
    totalMaintenanceMargin: string
  ): string {
    if (decIsZero(totalMaintenanceMargin)) return '100';
    const equity = decAdd(walletBalance, totalUnrealizedPnl);
    return decDiv(equity, totalMaintenanceMargin, 10);
  }

  // -------------------------------------------------------------------------
  // 强平价计算
  // -------------------------------------------------------------------------

  /**
   * 计算强平价
   *
   * 多单强平价：liqPrice = entryPrice - (margin - maintenanceMargin) / size
   * 空单强平价：liqPrice = entryPrice + (margin - maintenanceMargin) / size
   *
   * 简化：liqPrice = entryPrice * (1 ± (initialMarginRate - maintenanceMarginRate))
   * 符号：多单用减号，空单用加号
   */
  calculateLiquidationPrice(
    position: Position,
    contract: Contract,
    customMmr?: number
  ): string {
    const notional = this.calculateNotional(position.size, position.entryPrice);
    const mmr = customMmr ?? this.getMaintenanceMarginRate(notional, position.leverage);
    const imr = 1 / position.leverage;

    if (position.side === 'long') {
      const liqRatio = 1 + (mmr - imr);
      return decTruncate(decMul(position.entryPrice, String(liqRatio)), 10);
    } else {
      const liqRatio = 1 - (mmr - imr);
      return decTruncate(decMul(position.entryPrice, String(liqRatio)), 10);
    }
  }

  /**
   * 计算破产价
   *
   * 多单破产价：bkrPrice = entryPrice - margin / size = entryPrice * (1 - 1/leverage)
   * 空单破产价：bkrPrice = entryPrice + margin / size = entryPrice * (1 + 1/leverage)
   */
  calculateBankruptcyPrice(position: Position, _contract: Contract): string {
    const leverageRatio = 1 / position.leverage;

    if (position.side === 'long') {
      return decTruncate(decMul(position.entryPrice, String(1 - leverageRatio)), 10);
    } else {
      return decTruncate(decMul(position.entryPrice, String(1 + leverageRatio)), 10);
    }
  }

  /**
   * 计算部分强平的强平价
   * 当仓位降到一定比例时，保证金率恢复到安全水平
   */
  calculatePartialLiquidationPrice(
    position: Position,
    contract: Contract,
    reduceRatio: number,
    targetMarginRatio: number
  ): string {
    const fullLiqPrice = this.calculateLiquidationPrice(position, contract);
    const newSize = decMul(position.size, String(1 - reduceRatio));
    const notional = this.calculateNotional(newSize, position.entryPrice);
    const newMargin = decMul(position.margin, String(1 - reduceRatio));
    const mmr = this.getMaintenanceMarginRate(notional, position.leverage);

    if (position.side === 'long') {
      const priceDiff = decDiv(
        decMul(newMargin, String(targetMarginRatio - mmr)),
        newSize,
        10
      );
      return decTruncate(decAdd(fullLiqPrice, priceDiff), 10);
    } else {
      const priceDiff = decDiv(
        decMul(newMargin, String(targetMarginRatio - mmr)),
        newSize,
        10
      );
      return decTruncate(decSub(fullLiqPrice, priceDiff), 10);
    }
  }

  // -------------------------------------------------------------------------
  // 完整持仓计算
  // -------------------------------------------------------------------------

  /**
   * 计算单个持仓的完整保证金信息
   */
  calculatePositionMargin(
    position: Position,
    markPrice: string,
    contract: Contract
  ): MarginCalculationResult {
    const positionValue = this.calculateNotional(position.size, markPrice);
    const initialMargin = this.calculateInitialMargin(positionValue, position.leverage);
    const maintenanceMargin = this.calculateMaintenanceMargin(positionValue, position.leverage);
    const imr = this.getInitialMarginRate(positionValue, position.leverage);
    const mmr = this.getMaintenanceMarginRate(positionValue, position.leverage);
    const unrealizedPnl = this.calculateUnrealizedPnl(position, markPrice);
    const unrealizedPnlRate = this.calculateUnrealizedPnlRate(unrealizedPnl, position.margin);
    const marginBalance = decAdd(position.margin, unrealizedPnl);
    const marginRatio = this.calculateMarginRatio(position.margin, unrealizedPnl, positionValue);
    const liquidationPrice = this.calculateLiquidationPrice(position, contract, mmr);
    const bankruptcyPrice = this.calculateBankruptcyPrice(position, contract);
    const availableMargin = decSub(marginBalance, maintenanceMargin);
    const riskLevel = this.getRiskLevel(marginRatio, mmr);
    const effectiveLeverage = decIsPositive(marginBalance)
      ? decDiv(positionValue, marginBalance, 4)
      : '0';

    return {
      positionValue,
      initialMargin,
      initialMarginRate: String(imr),
      maintenanceMargin,
      maintenanceMarginRate: String(mmr),
      unrealizedPnl,
      unrealizedPnlRate,
      marginBalance,
      marginRatio,
      availableMargin,
      riskLevel,
      liquidationPrice,
      bankruptcyPrice,
      leverage: position.leverage,
      effectiveLeverage,
    };
  }

  // -------------------------------------------------------------------------
  // 全仓账户计算
  // -------------------------------------------------------------------------

  /**
   * 计算全仓模式下的账户整体风险
   */
  calculateCrossMarginAccount(
    walletBalance: string,
    positions: Position[],
    markPrices: Map<string, string>,
    contracts: Map<string, Contract>
  ): CrossMarginAccountResult {
    let totalUnrealizedPnl = '0';
    let totalInitialMargin = '0';
    let totalMaintenanceMargin = '0';

    for (const pos of positions) {
      if (pos.status !== 'open') continue;
      if (pos.marginMode !== 'cross') continue;

      const markPrice = markPrices.get(pos.symbol) ?? pos.entryPrice;
      const contract = contracts.get(pos.symbol);
      if (!contract) continue;

      const calc = this.calculatePositionMargin(pos, markPrice, contract);

      totalUnrealizedPnl = decAdd(totalUnrealizedPnl, calc.unrealizedPnl);
      totalInitialMargin = decAdd(totalInitialMargin, calc.initialMargin);
      totalMaintenanceMargin = decAdd(totalMaintenanceMargin, calc.maintenanceMargin);
    }

    const equity = decAdd(walletBalance, totalUnrealizedPnl);
    const availableMargin = decSub(equity, totalInitialMargin);
    const marginRatio = decIsPositive(totalMaintenanceMargin)
      ? decDiv(equity, totalMaintenanceMargin, 10)
      : '100';
    const riskLevel = this.getCrossRiskLevel(marginRatio);
    const maxLeverage = decIsPositive(availableMargin)
      ? Math.floor(parseFloat(decDiv(equity, availableMargin, 4)))
      : 1;

    return {
      equity,
      walletBalance,
      totalUnrealizedPnl,
      totalInitialMargin,
      totalMaintenanceMargin,
      availableMargin,
      marginRatio,
      riskLevel,
      maxLeverage,
      positionCount: positions.filter(p => p.status === 'open' && p.marginMode === 'cross').length,
    };
  }

  // -------------------------------------------------------------------------
  // 风险等级
  // -------------------------------------------------------------------------

  /**
   * 根据保证金率获取风险等级（逐仓）
   * 基于维持保证金率的倍数
   */
  getRiskLevel(marginRatio: string, mmr: number): RiskLevel {
    const ratioNum = parseFloat(marginRatio);
    const mmrNum = mmr;

    if (ratioNum <= mmrNum) {
      return 'liquidation';
    } else if (ratioNum <= mmrNum * 1.05) {
      return 'dangerous';
    } else if (ratioNum <= mmrNum * 1.2) {
      return 'high';
    } else if (ratioNum <= mmrNum * 1.5) {
      return 'medium';
    } else if (ratioNum <= mmrNum * 2) {
      return 'low';
    } else {
      return 'safe';
    }
  }

  /**
   * 获取全仓模式下的风险等级
   * 基于账户保证金率（权益 / 总维持保证金）
   */
  getCrossRiskLevel(marginRatio: string): RiskLevel {
    const ratioNum = parseFloat(marginRatio);

    if (ratioNum < 1.0) {
      return 'liquidation';
    } else if (ratioNum < 1.1) {
      return 'dangerous';
    } else if (ratioNum < 1.3) {
      return 'high';
    } else if (ratioNum < 1.5) {
      return 'medium';
    } else if (ratioNum < 2.0) {
      return 'low';
    } else {
      return 'safe';
    }
  }

  // -------------------------------------------------------------------------
  // 调整保证金
  // -------------------------------------------------------------------------

  /**
   * 计算增加保证金后的强平价
   */
  calculateLiqPriceAfterAddingMargin(
    position: Position,
    addAmount: string,
    contract: Contract
  ): string {
    const newMargin = decAdd(position.margin, addAmount);
    const newPosition = { ...position, margin: newMargin };
    return this.calculateLiquidationPrice(newPosition as Position, contract);
  }

  /**
   * 计算减少保证金后的强平价
   */
  calculateLiqPriceAfterReducingMargin(
    position: Position,
    reduceAmount: string,
    contract: Contract
  ): string {
    const newMargin = decSub(position.margin, reduceAmount);
    if (!decIsPositive(newMargin)) {
      return position.entryPrice;
    }
    const newPosition = { ...position, margin: newMargin };
    return this.calculateLiquidationPrice(newPosition as Position, contract);
  }

  /**
   * 计算调整杠杆后的强平价和所需保证金
   */
  calculateLeverageChange(
    position: Position,
    newLeverage: number,
    markPrice: string,
    contract: Contract
  ): {
    newMargin: string;
    marginDiff: string;
    newLiquidationPrice: string;
    newInitialMarginRate: number;
    newMaintenanceMarginRate: number;
    canChange: boolean;
    reason?: string;
  } {
    const notional = this.calculateNotional(position.size, markPrice);
    const newImr = 1 / newLeverage;
    const currentTier = this.getMarginTier(notional);

    if (newLeverage > currentTier.maxLeverage) {
      return {
        newMargin: position.margin,
        marginDiff: '0',
        newLiquidationPrice: position.liquidationPrice,
        newInitialMarginRate: 1 / position.leverage,
        newMaintenanceMarginRate: currentTier.maintenanceMarginRate,
        canChange: false,
        reason: `Leverage exceeds max for tier ${currentTier.name}`,
      };
    }

    const newMargin = decTruncate(decMul(notional, String(newImr)), 8);
    const marginDiff = decSub(newMargin, position.margin);

    const newPos = { ...position, margin: newMargin, leverage: newLeverage };
    const newLiqPrice = this.calculateLiquidationPrice(newPos as Position, contract);

    const newMmr = this.getMaintenanceMarginRate(notional, newLeverage);

    return {
      newMargin,
      marginDiff,
      newLiquidationPrice: newLiqPrice,
      newInitialMarginRate: newImr,
      newMaintenanceMarginRate: newMmr,
      canChange: true,
    };
  }

  // -------------------------------------------------------------------------
  // 开仓预估
  // -------------------------------------------------------------------------

  /**
   * 预估开仓后的各项指标
   */
  estimateOpenPosition(
    side: Side,
    size: string,
    price: string,
    leverage: number,
    marginMode: MarginMode
  ): {
    notional: string;
    initialMargin: string;
    maintenanceMargin: string;
    liquidationPrice: string;
    bankruptcyPrice: string;
    marginTier: MarginTier;
    fees: {
      openFee: string;
      estimatedCloseFee: string;
    };
  } {
    const notional = this.calculateNotional(size, price);
    const initialMargin = this.calculateInitialMargin(notional, leverage);
    const maintenanceMargin = this.calculateMaintenanceMargin(notional, leverage);
    const marginTier = this.getMarginTier(notional);

    const tempPos: Position = {
      id: 'estimate',
      userId: 'estimate',
      symbol: 'EST',
      side,
      marginMode,
      size,
      entryPrice: price,
      markPrice: price,
      liquidationPrice: '0',
      leverage,
      margin: initialMargin,
      unrealizedPnl: '0',
      unrealizedPnlRate: '0',
      marginRatio: '0',
      maintenanceMargin: '0',
      status: 'open',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const tempContract = {
      symbol: 'EST',
      baseAsset: 'BASE',
      quoteAsset: 'QUOTE',
      tickSize: '0.01',
      stepSize: '0.001',
      minQty: '0.001',
      maxQty: '1000000',
      minNotional: '10',
      maxLeverage: 125,
      defaultLeverage: 10,
      maintenanceMarginRate: 0.005,
      initialMarginRate: 0.01,
      makerFee: 0.0002,
      takerFee: 0.0004,
      fundingIntervalHours: 8,
      fundingCap: 0.0075,
      isActive: true,
    } as Contract;

    const liqPrice = this.calculateLiquidationPrice(tempPos, tempContract);
    const bkrPrice = this.calculateBankruptcyPrice(tempPos, tempContract);

    const takerFeeRate = 0.0004;
    const openFee = decTruncate(decMul(notional, String(takerFeeRate)), 8);
    const estimatedCloseFee = openFee;

    return {
      notional,
      initialMargin,
      maintenanceMargin,
      liquidationPrice: liqPrice,
      bankruptcyPrice: bkrPrice,
      marginTier,
      fees: {
        openFee,
        estimatedCloseFee,
      },
    };
  }

  // -------------------------------------------------------------------------
  // 保证金阶梯管理
  // -------------------------------------------------------------------------

  /**
   * 获取所有保证金阶梯
   */
  getMarginTiers(): MarginTier[] {
    return [...this.marginTiers];
  }

  /**
   * 更新保证金阶梯
   */
  setMarginTiers(tiers: MarginTier[]): void {
    this.marginTiers = [...tiers].sort((a, b) => parseFloat(a.minNotional) - parseFloat(b.minNotional));
    logger.info('[margin-calc] margin tiers updated', { tiers: tiers.length });
  }
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 取负数
 */
function decNeg(value: string): string {
  if (value.startsWith('-')) {
    return value.substring(1);
  }
  return `-${value}`;
}

function toFixedScale(value: string, scale: number): string {
  const negative = value.startsWith('-');
  const raw = negative ? value.slice(1) : value;
  const [intPart, fracPart = ''] = raw.split('.');
  const fixed = `${intPart}.${fracPart.padEnd(scale, '0').slice(0, scale)}`;
  return negative ? `-${fixed}` : fixed;
}
