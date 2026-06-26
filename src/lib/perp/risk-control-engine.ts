/**
 * 风控引擎（Risk Control Engine）
 *
 * 风控层级：
 *  Level 1: 订单前置校验（下单前检查）
 *  Level 2: 账户风险监控（保证金率、强平预警）
 *  Level 3: 系统级风险（全平台风险、极端行情熔断）
 *  Level 4: 合规风控（KYC、AML、限额）
 *
 * 核心功能：
 *  - 下单前风险校验（余额、杠杆、限额、自成交）
 *  - 账户风险等级评估
 *  - 强平预警（提前通知用户追加保证金）
 *  - 交易对风险监控（持仓集中度、多空比）
 *  - 系统级熔断机制（指数剧烈波动时暂停交易）
 *  - 用户限额管理（单日下单数、单日成交额、最大持仓）
 *  - 异常交易检测（刷单、对敲、操纵市场）
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
import { AdvancedMarginCalculator } from './advanced-margin-calculator';
import type { Contract, Position, Side, OrderType } from './types';
import { logger } from '@/lib/logger';

// ============================================================================
// 类型定义
// ============================================================================

/** 风险等级 */
export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

/** 风控检查结果 */
export interface RiskCheckResult {
  passed: boolean;
  riskLevel: RiskLevel;
  warnings: RiskWarning[];
  errors: RiskError[];
  /** 建议的操作 */
  suggestions: string[];
}

/** 风险警告 */
export interface RiskWarning {
  code: string;
  level: 'info' | 'warning' | 'danger';
  message: string;
  metric?: string;
  threshold?: string;
  current?: string;
}

/** 风险错误（拒绝订单） */
export interface RiskError {
  code: string;
  message: string;
  detail?: string;
}

/** 风控订单请求（本地定义，用于校验） */
export interface RiskOrderRequest {
  userId: string;
  symbol: string;
  side?: Side;
  type?: OrderType;
  quantity?: string;
  price?: string;
  leverage?: number;
}

/** 用户限额配置 */
export interface UserRiskLimit {
  userId: string;
  /** 每日最大下单数 */
  maxOrdersPerDay: number;
  /** 每日最大成交额 */
  maxVolumePerDay: string;
  /** 单订单最大数量 */
  maxOrderQty: string;
  /** 最大持仓数（按交易对） */
  maxPositions: number;
  /** 最大杠杆 */
  maxLeverage: number;
  /** 是否允许开仓 */
  allowTrading: boolean;
  /** 风险等级（人工设置） */
  userRiskLevel: 'low' | 'medium' | 'high';
  /** 白名单用户（跳过部分检查） */
  isWhitelisted: boolean;
}

/** 交易对风控配置 */
export interface SymbolRiskConfig {
  symbol: string;
  /** 是否启用交易 */
  tradingEnabled: boolean;
  /** 价格波动熔断阈值（%） */
  priceFuseThreshold: number;
  /** 熔断恢复时间（秒） */
  fuseRecoverySeconds: number;
  /** 最大持仓总量（所有用户合计） */
  maxTotalOpenInterest: string;
  /** 多空比预警阈值 */
  longShortRatioAlert: number;
  /** 24h 最大涨跌幅限制 */
  dailyPriceChangeLimit: number;
}

/** 账户风险状态 */
export interface AccountRiskState {
  userId: string;
  riskLevel: RiskLevel;
  /** 强平预警次数（24h内） */
  liquidationWarnings24h: number;
  /** 实际强平次数（24h内） */
  liquidations24h: number;
  /** 今日下单数 */
  ordersToday: number;
  /** 今日成交额 */
  volumeToday: string;
  /** 最后风控检查时间 */
  lastCheckTime: number;
  /** 是否在观察名单中 */
  inWatchlist: boolean;
  /** 限制交易原因 */
  restrictedReason?: string;
  /** 限制到期时间 */
  restrictedUntil?: number;
}

/** 系统风险状态 */
export interface SystemRiskState {
  /** 全局风险等级 */
  systemRiskLevel: RiskLevel;
  /** 熔断中的交易对 */
  fuses: Map<string, {
    triggeredAt: number;
    triggerPrice: string;
    reason: string;
    recoveryAt: number;
  }>;
  /** 全平台未平仓合约总价值 */
  totalOpenInterest: string;
  /** 全平台多空比 */
  globalLongShortRatio: number;
  /** 保险基金覆盖率 */
  insuranceFundCoverage: number;
  /** 最后系统检查时间 */
  lastCheckTime: number;
}

// ============================================================================
// 默认配置
// ============================================================================

const DEFAULT_USER_LIMIT: Omit<UserRiskLimit, 'userId'> = {
  maxOrdersPerDay: 10000,
  maxVolumePerDay: '10000000',
  maxOrderQty: '100000',
  maxPositions: 20,
  maxLeverage: 125,
  allowTrading: true,
  userRiskLevel: 'medium',
  isWhitelisted: false,
};

const DEFAULT_SYMBOL_CONFIG: Omit<SymbolRiskConfig, 'symbol'> = {
  tradingEnabled: true,
  priceFuseThreshold: 0.05,
  fuseRecoverySeconds: 300,
  maxTotalOpenInterest: '100000000',
  longShortRatioAlert: 2.0,
  dailyPriceChangeLimit: 0.2,
};

// ============================================================================
// 风控引擎
// ============================================================================

export class RiskControlEngine {
  private readonly marginCalculator: AdvancedMarginCalculator;
  private readonly emitter = new EventEmitter();

  private readonly userLimits = new Map<string, UserRiskLimit>();
  private readonly accountStates = new Map<string, AccountRiskState>();
  private readonly symbolConfigs = new Map<string, SymbolRiskConfig>();

  private systemState: SystemRiskState = {
    systemRiskLevel: 'safe',
    fuses: new Map(),
    totalOpenInterest: '0',
    globalLongShortRatio: 1.0,
    insuranceFundCoverage: 1.0,
    lastCheckTime: Date.now(),
  };

  private readonly orderHistory = new Map<string, Array<{ time: number; volume: string }>>();

  constructor(marginCalculator?: AdvancedMarginCalculator) {
    this.marginCalculator = marginCalculator ?? new AdvancedMarginCalculator();
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
      logger.error('[risk] event listener error', e);
    }
  }

  // -------------------------------------------------------------------------
  // Level 1: 订单前置校验
  // -------------------------------------------------------------------------

  /**
   * 下单前风控检查
   */
  checkOrder(
    order: RiskOrderRequest,
    userPositions: Position[],
    contract: Contract,
    walletBalance: string,
    markPrice: string
  ): RiskCheckResult {
    const warnings: RiskWarning[] = [];
    const errors: RiskError[] = [];
    const suggestions: string[] = [];

    const symbolConfig = this.getSymbolConfig(order.symbol);
    const userLimit = this.getUserLimit(order.userId);
    const accountState = this.getAccountState(order.userId);

    if (!symbolConfig.tradingEnabled) {
      errors.push({
        code: 'TRADING_DISABLED',
        message: `${order.symbol} 交易已暂停`,
      });
    }

    if (!userLimit.allowTrading) {
      errors.push({
        code: 'TRADING_RESTRICTED',
        message: '您的账户交易功能已受限',
        detail: accountState.restrictedReason,
      });
    }

    if (order.quantity && decCmp(order.quantity, userLimit.maxOrderQty) > 0) {
      errors.push({
        code: 'ORDER_QTY_EXCEEDED',
        message: '订单数量超过限额',
        detail: `最大 ${userLimit.maxOrderQty}`,
      });
    }

    if (order.side && order.leverage && order.leverage > userLimit.maxLeverage) {
      errors.push({
        code: 'LEVERAGE_EXCEEDED',
        message: `杠杆倍数超过限制（最大 ${userLimit.maxLeverage}x）`,
      });
    }

    if (accountState.ordersToday >= userLimit.maxOrdersPerDay) {
      errors.push({
        code: 'DAILY_ORDER_LIMIT',
        message: '今日下单次数已达上限',
      });
    }

    if (accountState.inWatchlist && !userLimit.isWhitelisted) {
      warnings.push({
        code: 'WATCHLIST_USER',
        level: 'warning',
        message: '账户在风控观察名单中，订单将被重点监控',
      });
    }

    if (order.side && order.quantity && order.price) {
      const notional = decMul(order.quantity, order.price);
      if (decCmp(notional, userLimit.maxVolumePerDay) > 0) {
        warnings.push({
          code: 'LARGE_ORDER',
          level: 'warning',
          message: '订单金额较大，请确认操作',
          current: notional,
          threshold: userLimit.maxVolumePerDay,
        });
        suggestions.push('建议拆分为多笔小额订单执行');
      }
    }

    if (order.leverage && order.leverage > 50) {
      warnings.push({
        code: 'HIGH_LEVERAGE',
        level: 'warning',
        message: `使用 ${order.leverage}x 高杠杆，风险较高`,
      });
      suggestions.push('高杠杆交易风险极大，建议降低杠杆倍数');
    }

    if (userPositions.filter(p => p.status === 'open').length >= userLimit.maxPositions) {
      warnings.push({
        code: 'POSITION_LIMIT_NEAR',
        level: 'warning',
        message: `持仓数量已接近上限 (${userPositions.filter(p => p.status === 'open').length}/${userLimit.maxPositions})`,
      });
    }

    const symbolPositions = userPositions.filter(p => p.symbol === order.symbol && p.status === 'open');
    if (symbolPositions.length > 0 && order.side) {
      const sameSidePosition = symbolPositions.find(p => p.side === order.side);
      if (sameSidePosition && order.quantity && order.price) {
        const totalNotional = decAdd(
          decMul(sameSidePosition.size, markPrice),
          decMul(order.quantity, order.price)
        );
        const tier = this.marginCalculator.getMarginTier(totalNotional);
        if (tier.maxLeverage < (order.leverage ?? 10)) {
          warnings.push({
            code: 'MARGIN_TIER_CHANGE',
            level: 'info',
            message: `加仓后将进入 ${tier.name}，最大杠杆降为 ${tier.maxLeverage}x`,
          });
        }
      }
    }

    const riskLevel = this.evaluateRiskLevel(warnings, errors);
    const passed = errors.length === 0;

    if (!passed) {
      this.emit('orderRejected', { order, errors, warnings });
    } else if (warnings.some(w => w.level === 'warning' || w.level === 'danger')) {
      this.emit('orderWarning', { order, warnings });
    }

    return { passed, riskLevel, warnings, errors, suggestions };
  }

  // -------------------------------------------------------------------------
  // Level 2: 账户风险监控
  // -------------------------------------------------------------------------

  /**
   * 评估账户整体风险
   */
  assessAccountRisk(
    userId: string,
    walletBalance: string,
    positions: Position[],
    markPrices: Map<string, string>,
    contracts: Map<string, Contract>
  ): AccountRiskState {
    const state = this.getAccountState(userId);
    const userLimit = this.getUserLimit(userId);

    const crossAccount = this.marginCalculator.calculateCrossMarginAccount(
      walletBalance,
      positions,
      markPrices,
      contracts
    );

    let riskLevel: RiskLevel;
    switch (crossAccount.riskLevel) {
      case 'safe':
      case 'low':
        riskLevel = 'safe';
        break;
      case 'medium':
        riskLevel = 'low';
        break;
      case 'high':
        riskLevel = 'medium';
        break;
      case 'dangerous':
        riskLevel = 'high';
        break;
      case 'liquidation':
        riskLevel = 'critical';
        break;
      default:
        riskLevel = 'medium';
    }

    if (state.liquidations24h >= 3) {
      riskLevel = this.increaseRiskLevel(riskLevel, 2);
    } else if (state.liquidations24h >= 1) {
      riskLevel = this.increaseRiskLevel(riskLevel, 1);
    }

    if (state.liquidationWarnings24h >= 5) {
      riskLevel = this.increaseRiskLevel(riskLevel, 1);
    }

    const openPositions = positions.filter(p => p.status === 'open');
    const concentrationRatio = parseFloat(crossAccount.totalMaintenanceMargin) / parseFloat(walletBalance);
    if (concentrationRatio > 0.8) {
      riskLevel = this.increaseRiskLevel(riskLevel, 1);
    }

    if (userLimit.isWhitelisted) {
      riskLevel = this.decreaseRiskLevel(riskLevel, 1);
    }

    state.riskLevel = riskLevel;
    state.lastCheckTime = Date.now();

    if (riskLevel === 'high' || riskLevel === 'critical') {
      state.inWatchlist = true;
      this.emit('highRiskAccount', { userId, riskLevel, state });
      logger.warn(`[risk] high risk account: ${userId}, level: ${riskLevel}`);
    }

    return state;
  }

  /**
   * 记录强平预警
   */
  recordLiquidationWarning(userId: string): void {
    const state = this.getAccountState(userId);
    state.liquidationWarnings24h++;
    this.emit('liquidationWarning', { userId, warnings: state.liquidationWarnings24h });
  }

  /**
   * 记录实际强平
   */
  recordLiquidation(userId: string, symbol: string, lossAmount: string): void {
    const state = this.getAccountState(userId);
    state.liquidations24h++;
    this.emit('liquidationRecorded', { userId, symbol, lossAmount });

    if (state.liquidations24h >= 5) {
      state.restrictedReason = '频繁强平，交易受限';
      state.restrictedUntil = Date.now() + 24 * 60 * 60 * 1000;
      this.emit('accountRestricted', { userId, reason: state.restrictedReason });
    }
  }

  // -------------------------------------------------------------------------
  // Level 3: 系统级风险
  // -------------------------------------------------------------------------

  /**
   * 检查价格熔断
   */
  checkPriceFuse(symbol: string, currentPrice: string, indexPrice: string): boolean {
    const config = this.getSymbolConfig(symbol);
    const fuse = this.systemState.fuses.get(symbol);

    if (fuse && Date.now() < fuse.recoveryAt) {
      return true;
    }

    if (fuse && Date.now() >= fuse.recoveryAt) {
      this.systemState.fuses.delete(symbol);
      this.emit('fuseRecovered', { symbol, fuse });
    }

    const priceDiff = decAbs(decSub(currentPrice, indexPrice));
    const diffRatio = parseFloat(decDiv(priceDiff, indexPrice, 10));

    if (diffRatio >= config.priceFuseThreshold) {
      this.systemState.fuses.set(symbol, {
        triggeredAt: Date.now(),
        triggerPrice: currentPrice,
        reason: `价格偏离指数 ${(diffRatio * 100).toFixed(2)}%`,
        recoveryAt: Date.now() + config.fuseRecoverySeconds * 1000,
      });
      this.emit('fuseTriggered', {
        symbol,
        currentPrice,
        indexPrice,
        diffRatio,
        threshold: config.priceFuseThreshold,
      });
      logger.warn(`[risk] price fuse triggered for ${symbol}, diff: ${(diffRatio * 100).toFixed(2)}%`);
      return true;
    }

    return false;
  }

  /**
   * 更新系统风险状态
   */
  updateSystemRisk(params: {
    totalOpenInterest?: string;
    longShortRatio?: number;
    insuranceFundCoverage?: number;
  }): void {
    if (params.totalOpenInterest) {
      this.systemState.totalOpenInterest = params.totalOpenInterest;
    }
    if (params.longShortRatio !== undefined) {
      this.systemState.globalLongShortRatio = params.longShortRatio;
    }
    if (params.insuranceFundCoverage !== undefined) {
      this.systemState.insuranceFundCoverage = params.insuranceFundCoverage;
    }

    let level: RiskLevel = 'safe';

    if (params.longShortRatio !== undefined) {
      if (params.longShortRatio > 3.0 || params.longShortRatio < 0.33) {
        level = this.increaseRiskLevel(level, 2);
      } else if (params.longShortRatio > 2.0 || params.longShortRatio < 0.5) {
        level = this.increaseRiskLevel(level, 1);
      }
    }

    if (params.insuranceFundCoverage !== undefined) {
      if (params.insuranceFundCoverage < 0.3) {
        level = this.increaseRiskLevel(level, 2);
      } else if (params.insuranceFundCoverage < 0.5) {
        level = this.increaseRiskLevel(level, 1);
      }
    }

    if (this.systemState.fuses.size > 3) {
      level = this.increaseRiskLevel(level, 1);
    }

    this.systemState.systemRiskLevel = level;
    this.systemState.lastCheckTime = Date.now();

    if (level === 'high' || level === 'critical') {
      this.emit('systemRiskAlert', { level, state: this.systemState });
    }
  }

  /**
   * 获取系统风险状态
   */
  getSystemState(): SystemRiskState {
    return { ...this.systemState, fuses: new Map(this.systemState.fuses) };
  }

  // -------------------------------------------------------------------------
  // Level 4: 用户限额管理
  // -------------------------------------------------------------------------

  /**
   * 获取用户风控限额
   */
  getUserLimit(userId: string): UserRiskLimit {
    if (!this.userLimits.has(userId)) {
      this.userLimits.set(userId, { ...DEFAULT_USER_LIMIT, userId });
    }
    return this.userLimits.get(userId)!;
  }

  /**
   * 设置用户风控限额
   */
  setUserLimit(userId: string, config: Partial<UserRiskLimit>): void {
    const current = this.getUserLimit(userId);
    this.userLimits.set(userId, { ...current, ...config, userId });
    this.emit('userLimitUpdated', { userId, config });
  }

  /**
   * 获取账户风险状态
   */
  getAccountState(userId: string): AccountRiskState {
    if (!this.accountStates.has(userId)) {
      this.accountStates.set(userId, {
        userId,
        riskLevel: 'safe',
        liquidationWarnings24h: 0,
        liquidations24h: 0,
        ordersToday: 0,
        volumeToday: '0',
        lastCheckTime: 0,
        inWatchlist: false,
      });
    }
    return this.accountStates.get(userId)!;
  }

  /**
   * 记录一笔订单
   */
  recordOrder(userId: string, volume: string): void {
    const state = this.getAccountState(userId);
    state.ordersToday++;
    state.volumeToday = decAdd(state.volumeToday, volume);

    const history = this.orderHistory.get(userId) ?? [];
    history.push({ time: Date.now(), volume });
    this.orderHistory.set(userId, history.slice(-1000));
  }

  // -------------------------------------------------------------------------
  // 交易对配置
  // -------------------------------------------------------------------------

  getSymbolConfig(symbol: string): SymbolRiskConfig {
    if (!this.symbolConfigs.has(symbol)) {
      this.symbolConfigs.set(symbol, { ...DEFAULT_SYMBOL_CONFIG, symbol });
    }
    return this.symbolConfigs.get(symbol)!;
  }

  setSymbolConfig(symbol: string, config: Partial<SymbolRiskConfig>): void {
    const current = this.getSymbolConfig(symbol);
    this.symbolConfigs.set(symbol, { ...current, ...config, symbol });
    this.emit('symbolConfigUpdated', { symbol, config });
  }

  // -------------------------------------------------------------------------
  // 辅助方法
  // -------------------------------------------------------------------------

  private evaluateRiskLevel(warnings: RiskWarning[], errors: RiskError[]): RiskLevel {
    if (errors.length > 0) {
      return 'critical';
    }

    const dangerCount = warnings.filter(w => w.level === 'danger').length;
    const warningCount = warnings.filter(w => w.level === 'warning').length;

    if (dangerCount > 0) return 'high';
    if (warningCount >= 3) return 'medium';
    if (warningCount >= 1) return 'low';
    return 'safe';
  }

  private increaseRiskLevel(level: RiskLevel, steps: number): RiskLevel {
    const levels: RiskLevel[] = ['safe', 'low', 'medium', 'high', 'critical'];
    const idx = levels.indexOf(level);
    return levels[Math.min(idx + steps, levels.length - 1)];
  }

  private decreaseRiskLevel(level: RiskLevel, steps: number): RiskLevel {
    const levels: RiskLevel[] = ['safe', 'low', 'medium', 'high', 'critical'];
    const idx = levels.indexOf(level);
    return levels[Math.max(idx - steps, 0)];
  }

  // -------------------------------------------------------------------------
  // 统计
  // -------------------------------------------------------------------------

  getStats(): {
    monitoredUsers: number;
    watchlistUsers: number;
    restrictedUsers: number;
    monitoredSymbols: number;
    activeFuses: number;
    systemRiskLevel: RiskLevel;
  } {
    let watchlist = 0;
    let restricted = 0;

    for (const state of this.accountStates.values()) {
      if (state.inWatchlist) watchlist++;
      if (state.restrictedReason) restricted++;
    }

    return {
      monitoredUsers: this.accountStates.size,
      watchlistUsers: watchlist,
      restrictedUsers: restricted,
      monitoredSymbols: this.symbolConfigs.size,
      activeFuses: this.systemState.fuses.size,
      systemRiskLevel: this.systemState.systemRiskLevel,
    };
  }
}
