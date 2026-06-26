/**
 * 期权交易引擎 - 订单/持仓/PnL/Greeks/保证金 集中管理
 *
 * 订单生命周期：pending → open → partial → filled / cancelled / expired
 * 持仓 side：
 *   long  = 持权方（付出权利金，收入行权收益）
 *   short = 造市方（收取权利金，承担行权义务，缴保证金）
 *
 * 简化撮合：
 *   market 单按 markPrice 立即成交
 *   limit  单按订单价成交（撮合层在 MatchingEngine 中可再接，本模块先做单边行为）
 */

import { BlackScholes } from './bsm';
import { OptionChainService } from './option-chain';
import { SettlementEngine } from './settlement-engine';
import type {
  Greeks,
  Option,
  OptionOrder,
  OptionPosition,
  OptionType,
  Settlement,
} from './types';
import {
  RISK_FREE_RATE,
  SHORT_MARGIN_FACTOR,
} from './types';

let __orderSeq = 1;
let __positionSeq = 1;

function nextOrderId(): string {
  return `OPT-O-${Date.now().toString(36)}-${(__orderSeq++).toString(36)}`;
}
function nextPositionId(): string {
  return `OPT-P-${Date.now().toString(36)}-${(__positionSeq++).toString(36)}`;
}

export interface PlaceOrderInput {
  userId: string;
  optionId: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  price?: string;
  quantity: number;
}

export class OptionsEngine {
  private bsm = new BlackScholes();
  private chain: OptionChainService;
  private settler: SettlementEngine;

  private orders = new Map<string, OptionOrder>();
  private positions = new Map<string, OptionPosition>();
  private userPositions = new Map<string, Set<string>>();

  /** 标的现价缓存（外部喂价） */
  private spotPrices = new Map<string, number>();

  constructor(chain: OptionChainService, settler: SettlementEngine) {
    this.chain = chain;
    this.settler = settler;
  }

  // -------------------------------------------------------------------------
  // 喂价
  // -------------------------------------------------------------------------

  setSpot(underlying: string, price: number): void {
    this.spotPrices.set(underlying, price);
  }

  getSpot(underlying: string): number {
    return this.spotPrices.get(underlying) ?? 0;
  }

  // -------------------------------------------------------------------------
  // 订单
  // -------------------------------------------------------------------------

  placeOrder(input: PlaceOrderInput): OptionOrder {
    const option = this.chain.getOption(input.optionId);
    if (!option) {
      throw new Error(`[OptionsEngine] unknown option ${input.optionId}`);
    }
    if (input.quantity <= 0) {
      throw new Error('[OptionsEngine] quantity must be > 0');
    }
    if (input.type === 'limit' && (!input.price || parseFloat(input.price) <= 0)) {
      throw new Error('[OptionsEngine] limit order requires positive price');
    }

    const order: OptionOrder = {
      id: nextOrderId(),
      userId: input.userId,
      optionId: input.optionId,
      side: input.side,
      type: input.type,
      price: input.price,
      quantity: input.quantity,
      filledQty: 0,
      avgFillPrice: '0',
      status: 'pending',
      fee: '0',
      premium: '0',
      createdAt: Date.now(),
    };
    this.orders.set(order.id, order);
    return order;
  }

  cancelOrder(id: string): OptionOrder {
    const o = this.orders.get(id);
    if (!o) throw new Error(`[OptionsEngine] unknown order ${id}`);
    if (o.status === 'filled' || o.status === 'cancelled') {
      throw new Error(`[OptionsEngine] order ${id} cannot be cancelled (status=${o.status})`);
    }
    o.status = 'cancelled';
    return o;
  }

  /**
   * 撮合：市价单按 markPrice 立即成交；限价单按 price 成交
   * 返回更新后的订单
   */
  matchOrder(id: string, markPrice?: number): OptionOrder {
    const o = this.orders.get(id);
    if (!o) throw new Error(`[OptionsEngine] unknown order ${id}`);
    if (o.status === 'filled' || o.status === 'cancelled') return o;

    const option = this.chain.getOption(o.optionId);
    if (!option) throw new Error(`[OptionsEngine] option ${o.optionId} missing`);

    const fillPrice = o.type === 'market'
      ? (markPrice ?? this.computeMarkPrice(option))
      : parseFloat(o.price!);

    if (o.type === 'limit' && o.side === 'buy' && markPrice !== undefined && markPrice > fillPrice) {
      return o;  // 未到价
    }
    if (o.type === 'limit' && o.side === 'sell' && markPrice !== undefined && markPrice < fillPrice) {
      return o;
    }

    o.filledQty = o.quantity;
    o.avgFillPrice = fillPrice.toFixed(6);
    const size = parseFloat(option.contractSize);
    const premium = fillPrice * o.quantity * size;
    o.premium = premium.toFixed(6);
    o.fee = (premium * 0.0005).toFixed(6);   // 5 bps
    o.status = 'filled';

    // 开/平仓
    this.applyFill(o, option, fillPrice);
    return o;
  }

  // -------------------------------------------------------------------------
  // 持仓
  // -------------------------------------------------------------------------

  getPosition(id: string): OptionPosition | null {
    return this.positions.get(id) ?? null;
  }

  getUserPositions(userId: string): OptionPosition[] {
    const ids = this.userPositions.get(userId);
    if (!ids) return [];
    const result: OptionPosition[] = [];
    for (const id of ids) {
      const p = this.positions.get(id);
      if (p) result.push(p);
    }
    return result;
  }

  /**
   * 平仓
   */
  closePosition(id: string, price: number): { pnl: string; position: OptionPosition } {
    const p = this.positions.get(id);
    if (!p) throw new Error(`[OptionsEngine] unknown position ${id}`);
    const option = this.chain.getOption(p.optionId);
    if (!option) throw new Error(`[OptionsEngine] option ${p.optionId} missing`);

    const entry = parseFloat(p.entryPrice);
    const size = parseFloat(option.contractSize);
    const qty = p.quantity;
    const pnlRaw = p.side === 'long'
      ? (price - entry) * qty * size
      : (entry - price) * qty * size;
    p.unrealizedPnl = '0';
    p.status = p.side === 'long' ? 'exercised' : 'assigned';
    p.markPrice = price.toFixed(6);
    return { pnl: pnlRaw.toFixed(6), position: p };
  }

  /**
   * 更新某期权的 mark price（触发 Greeks & PnL 重算）
   */
  updateMarkPrices(optionId: string, markPrice: number): void {
    for (const p of this.positions.values()) {
      if (p.optionId !== optionId) continue;
      p.markPrice = markPrice.toFixed(6);
      const entry = parseFloat(p.entryPrice);
      const size = parseFloat(parseFloat(p.markPrice).toString());   // 备用
      const opt = this.chain.getOption(optionId);
      if (!opt) continue;
      const contractSize = parseFloat(opt.contractSize);
      const pnlRaw = p.side === 'long'
        ? (markPrice - entry) * p.quantity * contractSize
        : (entry - markPrice) * p.quantity * contractSize;
      p.unrealizedPnl = pnlRaw.toFixed(6);
      // size 局部变量保留以避免 lint 警告
      void size;
    }
  }

  /**
   * 计算某持仓的浮盈
   */
  calculatePositionPnl(position: OptionPosition, markPrice: number): string {
    const option = this.chain.getOption(position.optionId);
    if (!option) return '0';
    const entry = parseFloat(position.entryPrice);
    const contractSize = parseFloat(option.contractSize);
    const pnl = position.side === 'long'
      ? (markPrice - entry) * position.quantity * contractSize
      : (entry - markPrice) * position.quantity * contractSize;
    return pnl.toFixed(6);
  }

  // -------------------------------------------------------------------------
  // Greeks
  // -------------------------------------------------------------------------

  /**
   * 单持仓的 Greeks（按 BSM 实时计算）
   */
  getPositionGreeks(position: OptionPosition): Greeks {
    const option = this.chain.getOption(position.optionId);
    if (!option) return { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
    const spot = this.getSpot(option.underlying);
    const ttm = Math.max(0, (option.expirationTime - Date.now()) / (1000 * 60 * 60 * 24 * 365));
    if (spot <= 0 || ttm <= 0) {
      return { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
    }
    return this.bsm.greeks(
      {
        spot,
        strike: parseFloat(option.strikePrice),
        timeToExpiry: ttm,
        riskFreeRate: RISK_FREE_RATE,
        volatility: 0.6,           // 简化：使用统一 vol
      },
      option.optionType as OptionType,
    );
  }

  /**
   * 整个账户组合的 Greeks（按持仓量加权汇总）
   *  long 持仓 greeks 取正值
   *  short 持仓 greeks 取负值
   */
  getPortfolioGreeks(userId: string): Greeks {
    const positions = this.getUserPositions(userId);
    let delta = 0, gamma = 0, theta = 0, vega = 0, rho = 0;
    for (const p of positions) {
      const g = this.getPositionGreeks(p);
      const sign = p.side === 'long' ? 1 : -1;
      const qty = p.quantity;
      delta += sign * g.delta * qty;
      gamma += sign * g.gamma * qty;
      theta += sign * g.theta * qty;
      vega += sign * g.vega * qty;
      rho += sign * g.rho * qty;
    }
    return { delta, gamma, theta, vega, rho };
  }

  // -------------------------------------------------------------------------
  // 卖方保证金
  // -------------------------------------------------------------------------

  /**
   * 卖方保证金（简化公式）：
   *   margin = max(strike × SHORT_MARGIN_FACTOR, premium × 2)
   */
  calculateShortMargin(option: Option, spotPrice: number): string {
    const k = parseFloat(option.strikePrice);
    const ttm = Math.max(0, (option.expirationTime - Date.now()) / (1000 * 60 * 60 * 24 * 365));
    const premium = this.bsm.price(
      {
        spot: spotPrice,
        strike: k,
        timeToExpiry: ttm,
        riskFreeRate: RISK_FREE_RATE,
        volatility: 0.6,
      },
      option.optionType,
    );
    const byStrike = k * SHORT_MARGIN_FACTOR;
    const byPremium = premium * 2;
    return Math.max(byStrike, byPremium).toFixed(6);
  }

  // -------------------------------------------------------------------------
  // 监控
  // -------------------------------------------------------------------------

  /**
   * 检查到期期权并自动行权（对所有 active 持仓）
   */
  monitorExpiry(): Settlement[] {
    const now = Date.now();
    const settlements: Settlement[] = [];
    for (const p of this.positions.values()) {
      if (p.status !== 'active') continue;
      const option = this.chain.getOption(p.optionId);
      if (!option) continue;
      if (now < option.expirationTime) continue;
      const spot = this.getSpot(option.underlying);
      if (spot <= 0) continue;
      try {
        const s = this.settler.exercise(option, p.quantity, spot, p.userId);
        settlements.push(s);
        p.status = 'exercised';
      } catch {
        // 价外则按到期处理
        p.status = 'expired';
      }
    }
    return settlements;
  }

  /**
   * 批量更新 mark price（外部喂价后调用）
   */
  monitorMarkUpdates(underlying: string, spotPrice: number): void {
    this.setSpot(underlying, spotPrice);
    for (const p of this.positions.values()) {
      const option = this.chain.getOption(p.optionId);
      if (!option || option.underlying !== underlying) continue;
      const mark = this.computeMarkPrice(option);
      this.updateMarkPrices(option.id, mark);
    }
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private applyFill(order: OptionOrder, option: Option, fillPrice: number): void {
    const isOpen = order.side === 'buy';
    const userSide = isOpen ? 'long' : 'short';
    // 找现有持仓（user + option + side）
    const existing = this.findPosition(order.userId, option.id, userSide);
    if (existing) {
      // 加权平均
      const oldQty = existing.quantity;
      const oldEntry = parseFloat(existing.entryPrice);
      const newQty = oldQty + order.quantity;
      const newEntry = (oldEntry * oldQty + fillPrice * order.quantity) / newQty;
      existing.quantity = newQty;
      existing.entryPrice = newEntry.toFixed(6);
    } else {
      this.openPosition(order.userId, option, userSide, order.quantity, fillPrice);
    }
  }

  private findPosition(userId: string, optionId: string, side: 'long' | 'short'): OptionPosition | null {
    const list = this.getUserPositions(userId);
    for (const p of list) {
      if (p.optionId === optionId && p.side === side) return p;
    }
    return null;
  }

  private openPosition(
    userId: string,
    option: Option,
    side: 'long' | 'short',
    quantity: number,
    entryPrice: number,
  ): OptionPosition {
    const id = nextPositionId();
    const spot = this.getSpot(option.underlying);
    const margin = side === 'short' ? this.calculateShortMargin(option, spot || entryPrice) : '0';
    const greeks = side === 'long' ? this.bsm.greeks(
      {
        spot: spot || entryPrice,
        strike: parseFloat(option.strikePrice),
        timeToExpiry: Math.max(0, (option.expirationTime - Date.now()) / (365 * 24 * 60 * 60 * 1000)),
        riskFreeRate: RISK_FREE_RATE,
        volatility: 0.6,
      },
      option.optionType,
    ) : { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };

    const pos: OptionPosition = {
      id,
      userId,
      optionId: option.id,
      side,
      quantity,
      entryPrice: entryPrice.toFixed(6),
      markPrice: entryPrice.toFixed(6),
      unrealizedPnl: '0',
      delta: greeks.delta.toFixed(6),
      gamma: greeks.gamma.toFixed(6),
      theta: greeks.theta.toFixed(6),
      vega: greeks.vega.toFixed(6),
      rho: greeks.rho.toFixed(6),
      margin,
      createdAt: Date.now(),
      status: 'active',
    };
    this.positions.set(pos.id, pos);
    const set = this.userPositions.get(userId) ?? new Set();
    set.add(pos.id);
    this.userPositions.set(userId, set);
    return pos;
  }

  /**
   * 内部：计算某期权的理论价（mark price）
   */
  private computeMarkPrice(option: Option): number {
    const spot = this.getSpot(option.underlying);
    if (spot <= 0) return 0;
    const ttm = Math.max(0, (option.expirationTime - Date.now()) / (365 * 24 * 60 * 60 * 1000));
    if (ttm <= 0) {
      const k = parseFloat(option.strikePrice);
      return option.optionType === 'call' ? Math.max(spot - k, 0) : Math.max(k - spot, 0);
    }
    return this.bsm.price(
      {
        spot,
        strike: parseFloat(option.strikePrice),
        timeToExpiry: ttm,
        riskFreeRate: RISK_FREE_RATE,
        volatility: 0.6,
      },
      option.optionType,
    );
  }
}
