/**
 * 永续合约核心引擎（PerpEngine）
 *
 *  - 仓位管理：开/平/调整保证金/调整杠杆
 *  - 委托：下单/撤单/撮合（市价吃单、限价撮合）
 *  - 账户：入金/出金/计算账户余额
 *  - 资金费率：8h 结算
 *  - 强平：监控 + 触发
 *  - 风险：账户风险等级、marginCall 价
 *
 *  与现有模块协作：
 *  - ContractRegistry  →  合约参数
 *  - MarginCalculator   →  保证金/PnL
 *  - FundingEngine      →  资金费
 *  - LiquidationEngine  →  强平/ADL
 *  - Freezer（可选）    →  现货钱包冻结保证金
 *  - Matching Engine    →  委托撮合（市价/限价）
 *
 *  生产环境：仓位/委托/账户应持久化到数据库；本实现使用内存版。
 */

import {
  decAdd,
  decCmp,
  decDiv,
  decIsZero,
  decIsPositive,
  decMul,
  decSub,
  decTruncate,
} from '@/lib/matching/decimal';
import { MarginCalculator } from './margin-calculator';
import { ContractRegistry, INSURANCE_FUND_INITIAL } from './contract-registry';
import { FundingEngine } from './funding-engine';
import { LiquidationEngine, SimpleOrderBook } from './liquidation-engine';
import type {
  Account,
  Contract,
  FundingPayment,
  InsuranceFund,
  Liquidation,
  MarginMode,
  Order,
  OrderType,
  Position,
  Side,
} from './types';

// ============================================================================
// 错误
// ============================================================================

export class PerpError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'PerpError';
  }
}

// ============================================================================
// 内部存储
// ============================================================================

interface UserWallet {
  /** 钱包余额（USDT） */
  wallet: string;
  /** 保险基金（按 symbol） */
  insuranceFunds: Map<string, InsuranceFund>;
}

interface OpenPositionSnapshot {
  position: Position;
  /** 关联的限价单 ID 列表（reduceOnly 暂挂） */
  pendingOrderIds: string[];
}

// ============================================================================
// 引擎
// ============================================================================

export interface PerpEngineOptions {
  registry?: ContractRegistry;
  fundingEngine?: FundingEngine;
  liquidationEngine?: LiquidationEngine;
  calculator?: MarginCalculator;
}

export class PerpEngine {
  private registry: ContractRegistry;
  private calculator: MarginCalculator;
  private fundingEngine: FundingEngine;
  private liquidationEngine: LiquidationEngine;

  /** userId -> wallet */
  private wallets: Map<string, UserWallet> = new Map();
  /** positionId -> Position */
  private positions: Map<string, Position> = new Map();
  /** userId -> Set<positionId> */
  private userPositions: Map<string, Set<string>> = new Map();
  /** orderId -> Order */
  private orders: Map<string, Order> = new Map();
  /** symbol -> markPrice（最近一次更新） */
  private markPrices: Map<string, string> = new Map();
  /** symbol -> indexPrice（Kaiko 推） */
  private indexPrices: Map<string, string> = new Map();
  private positionSeq = 0;
  private orderSeq = 0;
  private liquidationSeq = 0;

  constructor(options: PerpEngineOptions = {}) {
    this.registry = options.registry || new ContractRegistry();
    this.calculator = options.calculator || new MarginCalculator();
    this.fundingEngine = options.fundingEngine || new FundingEngine(this.registry);
    this.liquidationEngine =
      options.liquidationEngine || new LiquidationEngine(this.registry);
  }

  // ==========================================================================
  // 1. 钱包 / 账户
  // ==========================================================================

  private ensureWallet(userId: string): UserWallet {
    let w = this.wallets.get(userId);
    if (!w) {
      w = {
        wallet: '0',
        insuranceFunds: new Map(),
      };
      // 初始化保险基金
      for (const c of this.registry.getAllContracts()) {
        w.insuranceFunds.set(c.symbol, {
          symbol: c.symbol,
          balance: INSURANCE_FUND_INITIAL,
          totalContributed: INSURANCE_FUND_INITIAL,
          totalUsed: '0',
        });
      }
      this.wallets.set(userId, w);
    }
    return w;
  }

  /** 入金：现货钱包 -> 合约钱包 */
  transferIn(userId: string, asset: string, amount: string): void {
    if (asset !== 'USDT') {
      throw new PerpError('UNSUPPORTED_ASSET', 'Only USDT is supported for perp collateral');
    }
    if (!decIsPositive(amount)) {
      throw new PerpError('INVALID_AMOUNT', 'amount must be > 0');
    }
    const w = this.ensureWallet(userId);
    w.wallet = decTruncate(decAdd(w.wallet, amount), 8);
  }

  /** 出金：合约钱包 -> 现货钱包 */
  transferOut(userId: string, asset: string, amount: string): boolean {
    if (asset !== 'USDT') {
      throw new PerpError('UNSUPPORTED_ASSET', 'Only USDT is supported for perp collateral');
    }
    if (!decIsPositive(amount)) {
      throw new PerpError('INVALID_AMOUNT', 'amount must be > 0');
    }
    const w = this.ensureWallet(userId);
    const acc = this.calculateAccount(userId);
    if (decCmp(acc.availableBalance, amount) < 0) {
      return false;
    }
    w.wallet = decTruncate(decSub(w.wallet, amount), 8);
    return true;
  }

  /** 获取保险基金 */
  getInsuranceFund(symbol: string): InsuranceFund | null {
    // 任选一个用户的保险基金（实际应当全局共享）
    for (const w of this.wallets.values()) {
      const f = w.insuranceFunds.get(symbol);
      if (f) return { ...f };
    }
    return {
      symbol,
      balance: INSURANCE_FUND_INITIAL,
      totalContributed: INSURANCE_FUND_INITIAL,
      totalUsed: '0',
    };
  }

  /** 注入保险基金（穿仓赔付） */
  private updateInsuranceFund(symbol: string, used: string, contrib: string): InsuranceFund {
    const next: InsuranceFund = {
      symbol,
      balance: '0',
      totalContributed: '0',
      totalUsed: '0',
    };
    for (const w of this.wallets.values()) {
      const f = w.insuranceFunds.get(symbol);
      if (f) {
        f.balance = decTruncate(decSub(f.balance, used), 8);
        f.totalUsed = decTruncate(decAdd(f.totalUsed, used), 8);
        f.balance = decTruncate(decAdd(f.balance, contrib), 8);
        f.totalContributed = decTruncate(decAdd(f.totalContributed, contrib), 8);
        next.balance = f.balance;
        next.totalContributed = f.totalContributed;
        next.totalUsed = f.totalUsed;
      }
    }
    return next;
  }

  // ==========================================================================
  // 2. 仓位管理
  // ==========================================================================

  /**
   * 开仓（同方向加仓会按加权平均重算 entryPrice）
   *  - 隔离模式：仅冻结仓位保证金
   *  - 跨仓模式：从总账户余额扣除初始保证金
   */
  openPosition(params: {
    userId: string;
    symbol: string;
    side: Side;
    quantity: string;
    price: string;
    leverage: number;
    marginMode: MarginMode;
  }): Position {
    const { userId, symbol, side, quantity, price, leverage, marginMode } = params;

    const contract = this.registry.getContract(symbol);
    if (!contract) {
      throw new PerpError('UNKNOWN_SYMBOL', `Contract not found: ${symbol}`);
    }
    if (!decIsPositive(quantity)) {
      throw new PerpError('INVALID_QTY', 'quantity must be > 0');
    }
    if (!decIsPositive(price)) {
      throw new PerpError('INVALID_PRICE', 'price must be > 0');
    }
    if (leverage <= 0 || leverage > contract.maxLeverage) {
      throw new PerpError('INVALID_LEVERAGE', `leverage must be in 1..${contract.maxLeverage}`);
    }
    if (decCmp(quantity, contract.minQty) < 0) {
      throw new PerpError('BELOW_MIN_QTY', `quantity < minQty ${contract.minQty}`);
    }
    if (decCmp(quantity, contract.maxQty) > 0) {
      throw new PerpError('ABOVE_MAX_QTY', `quantity > maxQty ${contract.maxQty}`);
    }
    const notional = this.calculator.calculateNotional(quantity, price);
    if (decCmp(notional, contract.minNotional) < 0) {
      throw new PerpError('BELOW_MIN_NOTIONAL', `notional < minNotional ${contract.minNotional}`);
    }

    const wallet = this.ensureWallet(userId);
    const initialMargin = this.calculator.calculateInitialMargin(
      notional,
      leverage,
      marginMode,
      contract
    );

    // 检查余额
    if (marginMode === 'isolated') {
      if (decCmp(wallet.wallet, initialMargin) < 0) {
        throw new PerpError('INSUFFICIENT_MARGIN', `Need ${initialMargin}, have ${wallet.wallet}`);
      }
    } else {
      // 跨仓：检查账户可用余额
      const acc = this.calculateAccount(userId);
      if (decCmp(acc.availableBalance, initialMargin) < 0) {
        throw new PerpError(
          'INSUFFICIENT_MARGIN',
          `Cross account: need ${initialMargin}, have ${acc.availableBalance}`
        );
      }
    }

    // 查找同方向同合约的现有仓位（同向加仓）
    const existing = this.findOpenPosition(userId, symbol, side, marginMode);

    let nextSize: string;
    let nextEntry: string;
    let nextMargin: string;
    let totalIm: string;

    if (existing) {
      // 加仓
      nextSize = decTruncate(decAdd(existing.size, quantity), 8);
      nextEntry = this.calculator.calculateWeightedEntryPrice(
        existing.size,
        existing.entryPrice,
        quantity,
        price
      );
      totalIm = decTruncate(
        decAdd(
          marginMode === 'isolated' ? existing.margin : '0',
          initialMargin
        ),
        8
      );
      nextMargin = totalIm;
    } else {
      // 新开
      nextSize = quantity;
      nextEntry = price;
      nextMargin = initialMargin;
      totalIm = initialMargin;
    }

    // 扣除保证金
    if (marginMode === 'isolated') {
      wallet.wallet = decTruncate(decSub(wallet.wallet, initialMargin), 8);
    }
    // 跨仓：资金仍留在 wallet，但已用为 IM，账户计算会反映

    // 标记价
    const mark = this.markPrices.get(symbol) || price;
    const liqPrice = this.calculator.calculateLiquidationPrice(
      side,
      nextEntry,
      leverage,
      contract.maintenanceMarginRate,
      marginMode
    );
    const unrealizedPnl = this.calculator.calculateUnrealizedPnl(
      side,
      nextSize,
      nextEntry,
      mark
    );
    const positionValue = this.calculator.calculateNotional(nextSize, mark);
    const marginRatio = this.calculator.calculateMarginRatio(
      nextMargin,
      unrealizedPnl,
      positionValue
    );
    const mm = this.calculator.calculateMaintenanceMargin(positionValue, contract);
    const pnlRate = decCmp(nextMargin, '0') > 0
      ? decTruncate(decDiv(unrealizedPnl, nextMargin, 18), 8)
      : '0';
    const marginCallPrice = this.calculateMarginCallPrice(
      nextEntry,
      leverage,
      contract.maintenanceMarginRate,
      side,
      marginMode
    );

    const now = Date.now();
    if (existing) {
      const updated: Position = {
        ...existing,
        size: nextSize,
        entryPrice: nextEntry,
        margin: nextMargin,
        markPrice: mark,
        liquidationPrice: liqPrice,
        unrealizedPnl,
        unrealizedPnlRate: pnlRate,
        marginRatio,
        maintenanceMargin: mm,
        marginCallPrice,
        updatedAt: now,
      };
      this.positions.set(updated.id, updated);
      return { ...updated };
    }

    this.positionSeq++;
    const pos: Position = {
      id: `pos_${this.positionSeq}_${now}`,
      userId,
      symbol,
      side,
      marginMode,
      size: nextSize,
      entryPrice: nextEntry,
      markPrice: mark,
      liquidationPrice: liqPrice,
      leverage,
      margin: nextMargin,
      unrealizedPnl,
      unrealizedPnlRate: pnlRate,
      marginRatio,
      maintenanceMargin: mm,
      createdAt: now,
      updatedAt: now,
      status: 'open',
      marginCallPrice,
    };
    this.positions.set(pos.id, pos);
    const set = this.userPositions.get(userId) || new Set();
    set.add(pos.id);
    this.userPositions.set(userId, set);
    return { ...pos };
  }

  /**
   * 平仓（部分平仓或全平）
   *  - qty 未传：全平
   *  - 返回 pnl + 关闭后的 position（若全平 status=closed）
   */
  closePosition(
    positionId: string,
    price: string,
    qty?: string
  ): { pnl: string; fee: string; position: Position } {
    const pos = this.positions.get(positionId);
    if (!pos) {
      throw new PerpError('POSITION_NOT_FOUND', `Position not found: ${positionId}`);
    }
    if (pos.status !== 'open') {
      throw new PerpError('POSITION_CLOSED', `Position is not open: ${pos.status}`);
    }
    if (!decIsPositive(price)) {
      throw new PerpError('INVALID_PRICE', 'price must be > 0');
    }

    const contract = this.registry.getContract(pos.symbol);
    if (!contract) {
      throw new PerpError('UNKNOWN_SYMBOL', `Contract not found: ${pos.symbol}`);
    }

    const closeQty = qty ? qty : pos.size;
    if (decCmp(closeQty, pos.size) > 0) {
      throw new PerpError('OVERCLOSE', `qty > position size`);
    }
    if (decCmp(closeQty, '0') <= 0) {
      throw new PerpError('INVALID_QTY', 'qty must be > 0');
    }

    // 比例计算：平仓部分占原始仓位的比例
    const ratio = decDiv(closeQty, pos.size, 18);
    const pnl = this.calculator.calculateUnrealizedPnl(
      pos.side,
      closeQty,
      pos.entryPrice,
      price
    );
    const closeNotional = this.calculator.calculateNotional(closeQty, price);
    const fee = decTruncate(
      decMul(closeNotional, String(contract.takerFee)),
      8
    );
    const releasedMargin = decTruncate(decMul(pos.margin, ratio), 8);

    const wallet = this.ensureWallet(pos.userId);
    // 释放保证金 + pnl - 手续费 回到钱包
    const net = decTruncate(decSub(decAdd(releasedMargin, pnl), fee), 8);
    wallet.wallet = decTruncate(decAdd(wallet.wallet, net), 8);

    const remainingSize = decTruncate(decSub(pos.size, closeQty), 8);
    const now = Date.now();

    if (decIsZero(remainingSize)) {
      // 全平
      const closed: Position = {
        ...pos,
        status: 'closed',
        size: '0',
        markPrice: price,
        unrealizedPnl: '0',
        marginRatio: '0',
        updatedAt: now,
      };
      this.positions.set(closed.id, closed);
      const set = this.userPositions.get(pos.userId);
      if (set) set.delete(pos.id);
      return { pnl, fee, position: closed };
    }

    // 部分平仓：按比例减仓保证金，重算
    const newMargin = decTruncate(decSub(pos.margin, releasedMargin), 8);
    const newSize = remainingSize;
    const liqPrice = this.calculator.calculateLiquidationPrice(
      pos.side,
      pos.entryPrice,
      pos.leverage,
      contract.maintenanceMarginRate,
      pos.marginMode
    );
    const newPnl = this.calculator.calculateUnrealizedPnl(
      pos.side,
      newSize,
      pos.entryPrice,
      price
    );
    const newValue = this.calculator.calculateNotional(newSize, price);
    const newMarginRatio = this.calculator.calculateMarginRatio(
      newMargin,
      newPnl,
      newValue
    );
    const newMm = this.calculator.calculateMaintenanceMargin(newValue, contract);
    const newPnlRate = decCmp(newMargin, '0') > 0
      ? decTruncate(decDiv(newPnl, newMargin, 18), 8)
      : '0';

    const updated: Position = {
      ...pos,
      size: newSize,
      margin: newMargin,
      markPrice: price,
      liquidationPrice: liqPrice,
      unrealizedPnl: newPnl,
      unrealizedPnlRate: newPnlRate,
      marginRatio: newMarginRatio,
      maintenanceMargin: newMm,
      updatedAt: now,
    };
    this.positions.set(updated.id, updated);
    return { pnl, fee, position: updated };
  }

  /**
   * 追加 / 提取保证金
   *  - delta > 0：追加；delta < 0：提取
   *  - 跨仓：仅作用于该仓位记录
   *  - 隔离：会从 wallet 转移
   */
  adjustMargin(positionId: string, delta: string): Position {
    const pos = this.positions.get(positionId);
    if (!pos) {
      throw new PerpError('POSITION_NOT_FOUND', `Position not found: ${positionId}`);
    }
    if (pos.status !== 'open') {
      throw new PerpError('POSITION_CLOSED', 'Position is not open');
    }
    if (decIsZero(delta)) return { ...pos };
    const wallet = this.ensureWallet(pos.userId);

    if (delta.startsWith('-')) {
      // 提取
      const abs = decTruncate(decMul('-1', delta), 8);
      if (decCmp(pos.margin, abs) < 0) {
        throw new PerpError('INSUFFICIENT_MARGIN', 'Cannot withdraw more than position margin');
      }
      // 提走后不可触发强平
      const contract = this.registry.getContract(pos.symbol);
      if (!contract) {
        throw new PerpError('UNKNOWN_SYMBOL', `Contract not found: ${pos.symbol}`);
      }
      const projectedMargin = decTruncate(decSub(pos.margin, abs), 8);
      const projectedValue = this.calculator.calculateNotional(pos.size, pos.markPrice);
      const projectedEquity = decAdd(projectedMargin, pos.unrealizedPnl);
      const projectedMm = this.calculator.calculateMaintenanceMargin(projectedValue, contract);
      if (decCmp(projectedEquity, projectedMm) < 0) {
        throw new PerpError('LIQUIDATION_RISK', 'Withdrawal would trigger liquidation');
      }
      // 跨仓：转账到 wallet
      if (pos.marginMode === 'isolated') {
        wallet.wallet = decTruncate(decAdd(wallet.wallet, abs), 8);
      }
      pos.margin = projectedMargin;
    } else {
      // 追加
      if (decCmp(wallet.wallet, delta) < 0) {
        throw new PerpError('INSUFFICIENT_BALANCE', `Need ${delta}, have ${wallet.wallet}`);
      }
      if (pos.marginMode === 'isolated') {
        wallet.wallet = decTruncate(decSub(wallet.wallet, delta), 8);
      }
      pos.margin = decTruncate(decAdd(pos.margin, delta), 8);
    }

    // 重算 marginRatio / pnlRate
    const value = this.calculator.calculateNotional(pos.size, pos.markPrice);
    pos.marginRatio = this.calculator.calculateMarginRatio(
      pos.margin,
      pos.unrealizedPnl,
      value
    );
    pos.unrealizedPnlRate = decCmp(pos.margin, '0') > 0
      ? decTruncate(decDiv(pos.unrealizedPnl, pos.margin, 18), 8)
      : '0';
    pos.updatedAt = Date.now();
    this.positions.set(pos.id, { ...pos });
    return { ...pos };
  }

  /**
   * 调整杠杆
   *  - 调整时按当前 markPrice 计算所需 IM
   *  - 差额部分从 wallet 划转
   */
  adjustLeverage(positionId: string, leverage: number): Position {
    const pos = this.positions.get(positionId);
    if (!pos) {
      throw new PerpError('POSITION_NOT_FOUND', `Position not found: ${positionId}`);
    }
    if (pos.status !== 'open') {
      throw new PerpError('POSITION_CLOSED', 'Position is not open');
    }
    const contract = this.registry.getContract(pos.symbol);
    if (!contract) {
      throw new PerpError('UNKNOWN_SYMBOL', `Contract not found: ${pos.symbol}`);
    }
    if (leverage <= 0 || leverage > contract.maxLeverage) {
      throw new PerpError('INVALID_LEVERAGE', `leverage out of range`);
    }
    if (leverage === pos.leverage) return { ...pos };

    // 计算新 IM
    const notional = this.calculator.calculateNotional(pos.size, pos.markPrice);
    const newIm = this.calculator.calculateInitialMargin(
      notional,
      leverage,
      pos.marginMode,
      contract
    );
    const oldIm = pos.margin;
    const diff = decTruncate(decSub(newIm, oldIm), 8);
    const wallet = this.ensureWallet(pos.userId);

    if (decIsPositive(diff)) {
      // 提杠杆 -> 需要更多 IM
      if (decCmp(wallet.wallet, diff) < 0) {
        throw new PerpError('INSUFFICIENT_MARGIN', `Need additional ${diff} for new leverage`);
      }
      if (pos.marginMode === 'isolated') {
        wallet.wallet = decTruncate(decSub(wallet.wallet, diff), 8);
      }
      pos.margin = newIm;
    } else {
      // 降杠杆 -> 释放 IM
      const refund = decTruncate(decSub('0', diff), 8);
      if (pos.marginMode === 'isolated') {
        wallet.wallet = decTruncate(decAdd(wallet.wallet, refund), 8);
      }
      pos.margin = newIm;
    }

    pos.leverage = leverage;
    pos.liquidationPrice = this.calculator.calculateLiquidationPrice(
      pos.side,
      pos.entryPrice,
      leverage,
      contract.maintenanceMarginRate,
      pos.marginMode
    );
    pos.marginCallPrice = this.calculateMarginCallPrice(
      pos.entryPrice,
      leverage,
      contract.maintenanceMarginRate,
      pos.side,
      pos.marginMode
    );
    pos.updatedAt = Date.now();
    this.positions.set(pos.id, { ...pos });
    return { ...pos };
  }

  // ==========================================================================
  // 3. 订单
  // ==========================================================================

  placeOrder(params: {
    userId: string;
    symbol: string;
    side: Side;
    type: OrderType;
    quantity: string;
    price?: string;
    stopPrice?: string;
    leverage?: number;
    marginMode?: MarginMode;
    reduceOnly?: boolean;
    postOnly?: boolean;
  }): Order {
    const contract = this.registry.getContract(params.symbol);
    if (!contract) {
      throw new PerpError('UNKNOWN_SYMBOL', `Contract not found: ${params.symbol}`);
    }
    if (!decIsPositive(params.quantity)) {
      throw new PerpError('INVALID_QTY', 'quantity must be > 0');
    }
    if ((params.type === 'limit' || params.type === 'stop_limit') && !params.price) {
      throw new PerpError('INVALID_PRICE', 'limit order requires price');
    }
    if ((params.type === 'stop_market' || params.type === 'stop_limit') && !params.stopPrice) {
      throw new PerpError('INVALID_STOP_PRICE', 'stop order requires stopPrice');
    }
    if (decCmp(params.quantity, contract.minQty) < 0) {
      throw new PerpError('BELOW_MIN_QTY', `quantity < minQty ${contract.minQty}`);
    }

    this.orderSeq++;
    const now = Date.now();
    const order: Order = {
      id: `ord_${this.orderSeq}_${now}`,
      userId: params.userId,
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      price: params.price,
      stopPrice: params.stopPrice,
      quantity: params.quantity,
      leverage: params.leverage || contract.defaultLeverage,
      marginMode: params.marginMode || 'isolated',
      reduceOnly: params.reduceOnly || false,
      postOnly: params.postOnly || false,
      status: 'open',
      filledQty: '0',
      avgFillPrice: '0',
      fee: '0',
      createdAt: now,
      updatedAt: now,
    };
    this.orders.set(order.id, order);
    return { ...order };
  }

  cancelOrder(orderId: string): Order {
    const o = this.orders.get(orderId);
    if (!o) {
      throw new PerpError('ORDER_NOT_FOUND', `Order not found: ${orderId}`);
    }
    if (o.status === 'filled' || o.status === 'cancelled' || o.status === 'rejected') {
      throw new PerpError('ORDER_NOT_CANCELLABLE', `Order status: ${o.status}`);
    }
    o.status = 'cancelled';
    o.updatedAt = Date.now();
    this.orders.set(o.id, { ...o });
    return { ...o };
  }

  /**
   * 撮合（极简：直接以 lastPrice 全部成交）
   *  - 返回更新后的 Order
   *  - 撮合成功会自动调整仓位（如果 reduceOnly 则只减仓）
   */
  matchOrder(orderId: string, lastPrice: string, orderBook?: SimpleOrderBook): Order {
    const o = this.orders.get(orderId);
    if (!o) {
      throw new PerpError('ORDER_NOT_FOUND', `Order not found: ${orderId}`);
    }
    if (o.status !== 'open' && o.status !== 'partial') {
      throw new PerpError('ORDER_NOT_MATCHABLE', `Order status: ${o.status}`);
    }
    const contract = this.registry.getContract(o.symbol);
    if (!contract) {
      throw new PerpError('UNKNOWN_SYMBOL', `Contract not found: ${o.symbol}`);
    }
    if (!decIsPositive(lastPrice)) {
      throw new PerpError('INVALID_PRICE', 'lastPrice must be > 0');
    }

    // 限价单：未触发则保持 open
    if (o.type === 'limit' && o.price) {
      if (o.side === 'long' && decCmp(lastPrice, o.price) > 0) {
        return { ...o }; // 未到价
      }
      if (o.side === 'short' && decCmp(lastPrice, o.price) < 0) {
        return { ...o };
      }
    }

    // post-only 保护：撮合时不能立即成交（撮合引擎侧应处理）
    // 这里不做检查，交由撮合引擎

    const fillPrice = o.price || lastPrice;
    const fillQty = o.quantity;
    const fillNotional = this.calculator.calculateNotional(fillQty, fillPrice);
    const fee = decTruncate(
      decMul(fillNotional, String(contract.takerFee)),
      8
    );

    // 找到同方向仓位；如 reduceOnly 则查找反方向仓位
    const oppositeSide: Side = o.side === 'long' ? 'short' : 'long';

    if (o.reduceOnly) {
      // 减仓
      const pos = this.findOpenPosition(o.userId, o.symbol, oppositeSide, o.marginMode);
      if (!pos) {
        // 没有可减仓位 -> 拒绝
        o.status = 'rejected';
        o.rejectReason = 'no position to reduce';
        o.updatedAt = Date.now();
        this.orders.set(o.id, { ...o });
        return { ...o };
      }
      const closeQty = decCmp(fillQty, pos.size) > 0 ? pos.size : fillQty;
      const r = this.closePosition(pos.id, fillPrice, closeQty);
      o.positionId = r.position.id;
    } else {
      // 开仓（或同向加仓）
      try {
        const pos = this.openPosition({
          userId: o.userId,
          symbol: o.symbol,
          side: o.side,
          quantity: fillQty,
          price: fillPrice,
          leverage: o.leverage,
          marginMode: o.marginMode,
        });
        o.positionId = pos.id;
      } catch (e: unknown) {
        const err = e as Error;
        o.status = 'rejected';
        o.rejectReason = err.message;
        o.updatedAt = Date.now();
        this.orders.set(o.id, { ...o });
        return { ...o };
      }
    }

    o.filledQty = fillQty;
    o.avgFillPrice = fillPrice;
    o.fee = fee;
    o.status = 'filled';
    o.updatedAt = Date.now();
    this.orders.set(o.id, { ...o });

    // 标记价更新
    this.markPrices.set(o.symbol, fillPrice);
    // 全仓刷新
    this.refreshPositionsOnMark(o.symbol, fillPrice);

    void orderBook;
    return { ...o };
  }

  // ==========================================================================
  // 4. 标记价 / 全仓刷新
  // ==========================================================================

  updateMarkPrices(symbol: string, markPrice: string): void {
    if (!decIsPositive(markPrice)) {
      throw new PerpError('INVALID_PRICE', 'markPrice must be > 0');
    }
    this.markPrices.set(symbol, markPrice);
    this.refreshPositionsOnMark(symbol, markPrice);
  }

  updateIndexPrice(symbol: string, indexPrice: string): void {
    if (!decIsPositive(indexPrice)) {
      throw new PerpError('INVALID_PRICE', 'indexPrice must be > 0');
    }
    this.indexPrices.set(symbol, indexPrice);
  }

  private refreshPositionsOnMark(symbol: string, markPrice: string): void {
    for (const p of this.positions.values()) {
      if (p.symbol !== symbol || p.status !== 'open') continue;
      this.refreshPositionOnMark(p, markPrice);
    }
  }

  private refreshPositionOnMark(pos: Position, markPrice: string): Position {
    const contract = this.registry.getContract(pos.symbol);
    if (!contract) return pos;
    const value = this.calculator.calculateNotional(pos.size, markPrice);
    const pnl = this.calculator.calculateUnrealizedPnl(
      pos.side,
      pos.size,
      pos.entryPrice,
      markPrice
    );
    const mm = this.calculator.calculateMaintenanceMargin(value, contract);
    const marginRatio = this.calculator.calculateMarginRatio(
      pos.margin,
      pnl,
      value
    );
    const pnlRate = decCmp(pos.margin, '0') > 0
      ? decTruncate(decDiv(pnl, pos.margin, 18), 8)
      : '0';

    pos.markPrice = markPrice;
    pos.unrealizedPnl = pnl;
    pos.marginRatio = marginRatio;
    pos.maintenanceMargin = mm;
    pos.unrealizedPnlRate = pnlRate;
    pos.updatedAt = Date.now();
    this.positions.set(pos.id, { ...pos });
    return pos;
  }

  // ==========================================================================
  // 5. 查询
  // ==========================================================================

  getPosition(positionId: string): Position | null {
    const p = this.positions.get(positionId);
    return p ? { ...p } : null;
  }

  getUserPositions(userId: string, symbol?: string): Position[] {
    const ids = this.userPositions.get(userId) || new Set();
    const result: Position[] = [];
    for (const id of ids) {
      const p = this.positions.get(id);
      if (!p) continue;
      if (symbol && p.symbol !== symbol) continue;
      result.push({ ...p });
    }
    return result;
  }

  getAllOpenPositions(): Position[] {
    const result: Position[] = [];
    for (const p of this.positions.values()) {
      if (p.status === 'open') result.push({ ...p });
    }
    return result;
  }

  getOrder(orderId: string): Order | null {
    const o = this.orders.get(orderId);
    return o ? { ...o } : null;
  }

  private findOpenPosition(
    userId: string,
    symbol: string,
    side: Side,
    marginMode: MarginMode
  ): Position | null {
    const ids = this.userPositions.get(userId) || new Set();
    for (const id of ids) {
      const p = this.positions.get(id);
      if (!p) continue;
      if (
        p.status === 'open' &&
        p.symbol === symbol &&
        p.side === side &&
        p.marginMode === marginMode
      ) {
        return p;
      }
    }
    return null;
  }

  // ==========================================================================
  // 6. 账户
  // ==========================================================================

  /**
   * 账户总览（类似 Binance unified account）
   *  - 跨仓：所有仓位的未实现 PnL 计入 marginBalance
   *  - 隔离：每个仓位独立算 margin，账户 available = wallet - 各 isolated margins
   */
  calculateAccount(userId: string): Account {
    const wallet = this.ensureWallet(userId);
    const positions = this.getUserPositions(userId);
    const openOrders = Array.from(this.orders.values()).filter(
      (o) => o.userId === userId && (o.status === 'open' || o.status === 'partial')
    );

    // 跨仓的初始保证金（用 wallet 余额做后盾）
    // 隔离的初始保证金（冻结在仓位）
    let isolatedMargin = '0';
    let crossMargin = '0';
    let crossUnrealizedPnl = '0';
    let openOrderMargin = '0';
    const contract = (sym: string) => this.registry.getContract(sym);

    for (const p of positions) {
      if (p.status !== 'open') continue;
      if (p.marginMode === 'isolated') {
        isolatedMargin = decTruncate(decAdd(isolatedMargin, p.margin), 8);
      } else {
        crossMargin = decTruncate(decAdd(crossMargin, p.margin), 8);
        crossUnrealizedPnl = decTruncate(
          decAdd(crossUnrealizedPnl, p.unrealizedPnl),
          8
        );
      }
    }

    // 挂单冻结（限价单挂单时预估占用）
    for (const o of openOrders) {
      if (o.reduceOnly) continue;
      const c = contract(o.symbol);
      if (!c) continue;
      const px = o.price || this.markPrices.get(o.symbol) || '0';
      if (decIsZero(px)) continue;
      const notional = this.calculator.calculateNotional(o.quantity, px);
      const im = this.calculator.calculateInitialMargin(
        notional,
        o.leverage,
        o.marginMode,
        c
      );
      openOrderMargin = decTruncate(decAdd(openOrderMargin, im), 8);
    }

    // marginBalance = wallet + crossUnrealizedPnl（跨仓权益）
    const marginBalance = decTruncate(
      decAdd(wallet.wallet, crossUnrealizedPnl),
      8
    );

    const totalWalletBalance = wallet.wallet;
    const totalUnrealizedPnl = positions
      .filter((p) => p.status === 'open')
      .reduce(
        (acc, p) => decTruncate(decAdd(acc, p.unrealizedPnl), 8),
        '0' as string
      );

    // available = wallet - crossMargin - openOrderMargin
    // 隔离：IM 已从 wallet 扣除，available = wallet - openOrderMargin
    // 跨仓：IM 仍在 wallet 中但已作为保证金占用，需要再扣一次
    const availableBalance = decTruncate(
      decSub(
        decSub(decSub(wallet.wallet, '0'), crossMargin),
        openOrderMargin
      ),
      8
    );

    const totalPositionInitialMargin = positions
      .filter((p) => p.status === 'open')
      .reduce(
        (acc, p) => decTruncate(decAdd(acc, p.margin), 8),
        '0' as string
      );

    const totalOpenOrderInitialMargin = openOrderMargin;

    // 保证金率 = totalMarginBalance / totalPositionInitialMargin
    const marginRatio =
      decCmp(totalPositionInitialMargin, '0') > 0
        ? decTruncate(
            decDiv(marginBalance, totalPositionInitialMargin, 18),
            8
          )
        : '0';

    return {
      userId,
      totalWalletBalance,
      totalUnrealizedPnl,
      totalMarginBalance: marginBalance,
      totalPositionInitialMargin,
      totalOpenOrderInitialMargin,
      availableBalance: decCmp(availableBalance, '0') > 0 ? availableBalance : '0',
      maxWithdrawAmount: decCmp(availableBalance, '0') > 0 ? availableBalance : '0',
      marginRatio,
      updatedAt: Date.now(),
    };
  }

  getAccount(userId: string): Account {
    return this.calculateAccount(userId);
  }

  /**
   * 计算账户风险等级
   *  - safe: marginRatio >= 0.5
   *  - warning: marginRatio >= 0.2
   *  - danger: marginRatio >= 0.1
   *  - critical: marginRatio < 0.1
   */
  getAccountRisk(userId: string): {
    riskLevel: 'safe' | 'warning' | 'danger' | 'critical';
    marginCall: boolean;
    account: Account;
  } {
    const acc = this.calculateAccount(userId);
    const mr = Number(acc.marginRatio);
    let riskLevel: 'safe' | 'warning' | 'danger' | 'critical';
    if (mr >= 0.5) riskLevel = 'safe';
    else if (mr >= 0.2) riskLevel = 'warning';
    else if (mr >= 0.1) riskLevel = 'danger';
    else riskLevel = 'critical';
    return {
      riskLevel,
      marginCall: mr < 0.3,
      account: acc,
    };
  }

  // ==========================================================================
  // 7. 资金费率
  // ==========================================================================

  settleFunding(symbol: string, now: number = Date.now()): FundingPayment[] {
    const positions = this.getAllOpenPositions().filter((p) => p.symbol === symbol);
    const markPrice = this.markPrices.get(symbol);
    const indexPrice = this.indexPrices.get(symbol);
    if (!markPrice) {
      throw new PerpError('NO_MARK_PRICE', `No mark price for ${symbol}`);
    }
    if (!indexPrice) {
      throw new PerpError('NO_INDEX_PRICE', `No index price for ${symbol}`);
    }
    const insuranceFund = this.getInsuranceFund(symbol);
    const r = this.fundingEngine.processFunding(
      symbol,
      positions,
      markPrice,
      indexPrice,
      insuranceFund || undefined,
      now
    );
    // 将 funding 收支反映到 wallet
    for (const pay of r.payments) {
      const wallet = this.ensureWallet(pay.userId);
      const delta = pay.amount;
      if (decIsPositive(delta)) {
        wallet.wallet = decTruncate(decAdd(wallet.wallet, delta), 8);
      } else if (delta.startsWith('-')) {
        wallet.wallet = decTruncate(
          decSub(wallet.wallet, decTruncate(decMul('-1', delta), 8)),
          8
        );
      }
    }
    return r.payments;
  }

  // ==========================================================================
  // 8. 强平
  // ==========================================================================

  monitorAndLiquidate(
    orderBookLookup?: (symbol: string) => SimpleOrderBook | null
  ): Liquidation[] {
    const allOpen = this.getAllOpenPositions();
    const marks = new Map<string, string>();
    for (const p of allOpen) {
      if (!marks.has(p.symbol)) {
        const m = this.markPrices.get(p.symbol);
        if (m) marks.set(p.symbol, m);
      }
    }

    const targets = this.liquidationEngine.monitorPositions(allOpen, marks);
    const results: Liquidation[] = [];
    for (const pos of targets) {
      const contract = this.registry.getContract(pos.symbol);
      if (!contract) continue;
      const mark = this.markPrices.get(pos.symbol) || pos.markPrice;
      const ob = orderBookLookup ? orderBookLookup(pos.symbol) : null;
      const insuranceFund = this.getInsuranceFund(pos.symbol) || {
        symbol: pos.symbol,
        balance: '0',
        totalContributed: '0',
        totalUsed: '0',
      };
      // 对手方仓位（同 symbol、同 marginMode、相反 side）
      const oppositeSide = pos.side === 'long' ? 'short' : 'long';
      const counterpartyPositions = allOpen.filter(
        (p) =>
          p.symbol === pos.symbol &&
          p.marginMode === pos.marginMode &&
          p.side === oppositeSide
      );

      const orderBook: SimpleOrderBook =
        ob || {
          bids: [{ price: mark, quantity: pos.size }],
          asks: [{ price: mark, quantity: pos.size }],
        };

      const r = this.liquidationEngine.liquidate(
        pos,
        contract,
        orderBook,
        mark,
        insuranceFund,
        counterpartyPositions
      );

      // 同步更新保险基金
      this.updateInsuranceFund(
        pos.symbol,
        r.liquidation.insuranceFundUsed,
        '0'
      );
      // 标记仓位为 liquidated
      const liquidated: Position = {
        ...pos,
        status: 'liquidated',
        size: '0',
        markPrice: mark,
        updatedAt: Date.now(),
      };
      this.positions.set(liquidated.id, liquidated);
      const set = this.userPositions.get(pos.userId);
      if (set) set.delete(pos.id);
      // 释放/调整 wallet：剩余保证金 + 罚金 + PnL
      const wallet = this.ensureWallet(pos.userId);
      // 简化：剩余保证金（>= 0）返还给用户
      if (decCmp(r.liquidation.remainingMargin, '0') > 0) {
        wallet.wallet = decTruncate(
          decAdd(wallet.wallet, r.liquidation.remainingMargin),
          8
        );
      }
      this.liquidationSeq++;
      results.push(r.liquidation);
    }
    return results;
  }

  // ==========================================================================
  // 9. 工具方法
  // ==========================================================================

  /**
   * 追加保证金价（marginCallPrice）
   *  隔离：账户权益 = 维持保证金 时的价格
   *  long:  entry + (margin - mm) / size   -> 但 mm 依赖价格，先用公式反推
   *  简化：marginCallPrice = liqPrice * 1.05（提示用）
   */
  private calculateMarginCallPrice(
    entryPrice: string,
    leverage: number,
    mmr: number,
    side: Side,
    marginMode: MarginMode
  ): string {
    if (marginMode === 'cross') {
      // 跨仓：marginCall 价接近强平价（略远）
      const liq = this.calculator.calculateLiquidationPrice(side, entryPrice, leverage, 0, marginMode);
      return decTruncate(decMul(liq, side === 'long' ? '1.05' : '0.95'), 8);
    }
    const liq = this.calculator.calculateLiquidationPrice(side, entryPrice, leverage, mmr, marginMode);
    // 离强平还有 ~5% 空间开始 margin call
    return decTruncate(decMul(liq, side === 'long' ? '1.05' : '0.95'), 8);
  }

  /**
   * 获取 mark price
   */
  getMarkPrice(symbol: string): string | null {
    const m = this.markPrices.get(symbol);
    return m ? m : null;
  }

  getIndexPrice(symbol: string): string | null {
    const i = this.indexPrices.get(symbol);
    return i ? i : null;
  }

  /**
   * 测试：清空所有状态
   */
  reset(): void {
    this.wallets.clear();
    this.positions.clear();
    this.userPositions.clear();
    this.orders.clear();
    this.markPrices.clear();
    this.indexPrices.clear();
    this.fundingEngine.reset();
  }
}
