/**
 * 仓位风控
 *
 * - 保证金率计算
 * - 强平价格计算（多/空）
 * - 维持保证金检查
 * - 触发强平
 *
 * 公式参考：
 *  强平价（多仓）= entry * (1 - 1/leverage + MMR)
 *  强平价（空仓）= entry * (1 + 1/leverage - MMR)
 *
 * @module lib/risk/positions
 */

import type { ID, ISODate, Position, PositionSide } from '@/types/models';
import { randomString } from '@/lib/auth/crypto';
import { RiskError } from '@/lib/auth/errors';

// ============================================================================
// 计算
// =====================================================================================

export interface MarginCalcResult {
  /** 维持保证金（USDT） */
  maintenanceMargin: number;
  /** 当前保证金率 = 账户权益 / 维持保证金 */
  marginRatio: number;
  /** 未实现盈亏 */
  unrealizedPnl: number;
  /** 风险等级 */
  riskLevel: 'safe' | 'warning' | 'danger' | 'liquidatable';
  /** 强平价 */
  liquidationPrice: number;
}

/**
 * 计算保证金率
 *
 * @param position 持仓
 * @param markPrice 当前标记价
 * @param maintenanceRate 维持保证金率（如 0.005 = 0.5%）
 */
export const calculateMarginRatio = (
  position: Pick<Position, 'side' | 'entryPrice' | 'quantity' | 'leverage' | 'margin' | 'maintenanceMargin'>,
  markPrice: number | string,
  maintenanceRate?: number
): MarginCalcResult => {
  const entry = Number(position.entryPrice);
  const qty = Number(position.quantity);
  const leverage = position.leverage;
  const margin = Number(position.margin);
  const mark = Number(markPrice);

  if (!isFinite(entry) || !isFinite(qty) || !isFinite(mark)) {
    throw new RiskError('RISK_INVALID_INPUT', 'Invalid numeric inputs');
  }
  if (qty <= 0) {
    throw new RiskError('RISK_ZERO_QTY', 'Position quantity must be > 0');
  }
  if (leverage <= 0) {
    throw new RiskError('RISK_INVALID_LEVERAGE', 'Leverage must be > 0');
  }

  // 默认维持保证金率 0.5%
  const mmr = maintenanceRate ?? 0.005;
  // 持仓名义价值
  const notional = qty * mark;
  // 未实现盈亏
  const unrealizedPnl =
    position.side === 'long' ? (mark - entry) * qty : (entry - mark) * qty;
  // 账户权益
  const equity = margin + unrealizedPnl;
  // 维持保证金
  const maintenanceMargin = notional * mmr;
  // 保证金率
  const marginRatio = maintenanceMargin > 0 ? equity / maintenanceMargin : Infinity;

  let riskLevel: MarginCalcResult['riskLevel'] = 'safe';
  if (marginRatio < 1) riskLevel = 'liquidatable';
  else if (marginRatio < 1.2) riskLevel = 'danger';
  else if (marginRatio < 1.5) riskLevel = 'warning';

  return {
    maintenanceMargin,
    marginRatio,
    unrealizedPnl,
    riskLevel,
    liquidationPrice: calculateLiquidationPrice(position, maintenanceRate),
  };
};

/**
 * 计算强平价格
 *  - 多仓：entry * (1 - 1/leverage + MMR)
 *  - 空仓：entry * (1 + 1/leverage - MMR)
 *
 * @param position 持仓
 * @param maintenanceRate 维持保证金率
 */
export const calculateLiquidationPrice = (
  position: Pick<Position, 'side' | 'entryPrice' | 'leverage'>,
  maintenanceRate: number = 0.005
): number => {
  const entry = Number(position.entryPrice);
  const leverage = position.leverage;
  if (!isFinite(entry) || entry <= 0) {
    throw new RiskError('RISK_INVALID_ENTRY', 'Invalid entry price');
  }
  if (!isFinite(leverage) || leverage <= 0) {
    throw new RiskError('RISK_INVALID_LEVERAGE', 'Invalid leverage');
  }

  if (position.side === 'long') {
    return entry * (1 - 1 / leverage + maintenanceRate);
  }
  return entry * (1 + 1 / leverage - maintenanceRate);
};

/**
 * 检查维持保证金
 */
export const checkMaintenanceMargin = (
  position: Pick<Position, 'side' | 'entryPrice' | 'quantity' | 'leverage' | 'margin' | 'maintenanceMargin'>,
  markPrice: number | string,
  maintenanceRate: number = 0.005
): { ok: boolean; deficit: number; required: number; actual: number } => {
  const result = calculateMarginRatio(position, markPrice, maintenanceRate);
  const notional = Number(position.quantity) * Number(markPrice);
  const required = result.maintenanceMargin;
  const actual = Number(position.margin) + result.unrealizedPnl;
  const deficit = Math.max(0, required - actual);
  return {
    ok: actual >= required,
    deficit,
    required,
    actual,
  };
};

/**
 * 计算是否应该强平
 */
export const shouldLiquidate = (
  position: Pick<Position, 'side' | 'entryPrice' | 'quantity' | 'leverage' | 'margin' | 'maintenanceMargin'>,
  markPrice: number | string,
  maintenanceRate: number = 0.005
): boolean => {
  const { ok } = checkMaintenanceMargin(position, markPrice, maintenanceRate);
  return !ok;
};

/**
 * 触发强平
 * 返回强平事件
 */
export interface LiquidationEvent {
  id: ID;
  userId: ID;
  symbol: string;
  side: PositionSide;
  quantity: number;
  liquidationPrice: number;
  markPrice: number;
  lostAmount: number;
  executedAt: ISODate;
}

export const triggerLiquidation = (
  userId: ID,
  position: Position,
  markPrice: number | string
): LiquidationEvent => {
  if (!shouldLiquidate(position, markPrice)) {
    throw new RiskError('RISK_NOT_LIQUIDATABLE', 'Position does not need liquidation');
  }
  const liqPrice = calculateLiquidationPrice(position);
  const notional = Number(position.quantity) * Number(markPrice);
  const marginLost = Math.max(0, Number(position.margin) - notional);
  return {
    id: `liq_${Date.now()}_${randomString(6)}`,
    userId,
    symbol: position.symbol,
    side: position.side,
    quantity: Number(position.quantity),
    liquidationPrice: liqPrice,
    markPrice: Number(markPrice),
    lostAmount: Number.isFinite(marginLost) ? marginLost : Number(position.margin),
    executedAt: new Date().toISOString(),
  };
};

/**
 * 计算收益（多/空）
 * 复杂度：O(1)
 */
export const calculatePnl = (
  side: PositionSide,
  entryPrice: number | string,
  exitPrice: number | string,
  quantity: number | string,
  leverage: number = 1
): number => {
  const entry = Number(entryPrice);
  const exit = Number(exitPrice);
  const qty = Number(quantity);
  if (!isFinite(entry) || !isFinite(exit) || !isFinite(qty)) {
    throw new RiskError('RISK_INVALID_INPUT', 'Invalid numeric inputs');
  }
  const dir = side === 'long' ? 1 : -1;
  return dir * (exit - entry) * qty * leverage;
};
