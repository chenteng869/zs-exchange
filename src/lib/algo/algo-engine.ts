/**
 * AlgoEngine - 算法交易业务层
 *
 *  - createAlgo / startAlgo / cancelAlgo / getAlgo / getUserAlgos
 *  - 事件订阅：onAlgoUpdate / onChildOrderFilled
 *  - 统计：getUserStats
 *  - 集成 OrderEngine (子单) + PriceFeed (sniper / trailing)
 *
 *  设计：
 *   1. createAlgo  -> pending 状态写入 Map
 *   2. startAlgo   -> 选择策略 -> 注册到 scheduler -> running
 *   3. 子单成交   -> 累计 executedQuantity / totalNotional -> 计算 avgPrice / slippage
 *   4. 全部成交 / 取消 / 触发 / 失败 -> 终态
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
} from '@/lib/matching/decimal';
import { AlgoScheduler } from './scheduler';
import { TwapStrategy } from './strategies/twap';
import { VwapStrategy } from './strategies/vwap';
import { IcebergStrategy } from './strategies/iceberg';
import { SniperStrategy } from './strategies/sniper';
import { TrailingStopStrategy } from './strategies/trailing-stop';
import type {
  AlgoChildOrder,
  AlgoConfig,
  AlgoOrder,
  AlgoSide,
  AlgoStatus,
  AlgoType,
  OrderEngineLike,
  PriceFeed,
  VolumeBucket,
} from './types';
import { DEFAULT_ALGO_CONFIG } from './types';

// ============================================================================
// 错误
// ============================================================================

export class AlgoError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'AlgoError';
  }
}

// ============================================================================
// 入参
// ============================================================================

export interface CreateAlgoOpts {
  userId: string;
  type: AlgoType;
  symbol: string;
  side: AlgoSide;
  totalQuantity: string;
  durationSec: number; // 总时长
  intervalSec?: number; // 拆单间隔
  limitPrice?: string;
  // Iceberg
  displayQuantity?: string;
  variance?: number;
  // VWAP
  volumeProfile?: VolumeBucket[];
  // Sniper
  triggerPrice?: string;
  triggerDirection?: 'gte' | 'lte';
  sniperLimitPrice?: string;
  // TrailingStop
  activationPrice?: string;
  callbackRate?: number;
  trailingSide?: 'long' | 'short';
  // TWAP-Stop
  stopLossPrice?: string;
  takeProfitPrice?: string;
  // 启动延迟
  startDelaySec?: number;
}

export interface AlgoEngineOptions {
  orderEngine: OrderEngineLike;
  priceFeed?: PriceFeed | null;
  config?: Partial<AlgoConfig>;
  scheduler?: AlgoScheduler;
}

export interface UserAlgoStats {
  algoCount: number;
  totalVolume: string;
  avgSlippage: string;
  totalFilled: string;
  byType: Record<AlgoType, number>;
  byStatus: Record<AlgoStatus, number>;
}

// ============================================================================
// 引擎
// ============================================================================

export class AlgoEngine {
  private orderEngine: OrderEngineLike;
  private priceFeed: PriceFeed | null;
  private config: AlgoConfig;
  private scheduler: AlgoScheduler;
  private emitter = new EventEmitter();

  private algos: Map<string, AlgoOrder> = new Map();
  private childOrders: Map<string, AlgoChildOrder> = new Map();
  private userAlgos: Map<string, Set<string>> = new Map();
  private algoSeq = 0;

  constructor(options: AlgoEngineOptions) {
    this.orderEngine = options.orderEngine;
    this.priceFeed = options.priceFeed ?? null;
    this.config = { ...DEFAULT_ALGO_CONFIG, ...(options.config || {}) };
    this.scheduler = options.scheduler ?? new AlgoScheduler(this.config.schedulerTickMs);
  }

  // ==========================================================================
  // 公共 API
  // ==========================================================================

  /**
   * 创建算法母单（不启动）
   */
  createAlgo(opts: CreateAlgoOpts): AlgoOrder {
    this.validateCreateOpts(opts);

    const now = Date.now();
    const startTime = now + (opts.startDelaySec ?? 0) * 1000;
    const endTime = startTime + opts.durationSec * 1000;
    const intervalSec = opts.intervalSec ?? this.defaultInterval(opts);

    this.algoSeq += 1;
    const id = `algo_${now.toString(36)}_${this.algoSeq}`;

    const marketPrice = this.priceFeed?.getPrice(opts.symbol) ?? '0';

    const algo: AlgoOrder = {
      id,
      userId: opts.userId,
      type: opts.type,
      symbol: opts.symbol,
      side: opts.side,
      totalQuantity: opts.totalQuantity,
      executedQuantity: '0',
      avgPrice: '0',
      totalNotional: '0',
      status: 'pending',
      createdAt: now,
      startTime,
      endTime,
      intervalSec,
      limitPrice: opts.limitPrice,
      displayQuantity: opts.displayQuantity,
      variance: opts.variance,
      volumeProfile: opts.volumeProfile,
      triggerPrice: opts.triggerPrice,
      triggerDirection: opts.triggerDirection,
      sniperLimitPrice: opts.sniperLimitPrice,
      activationPrice: opts.activationPrice,
      callbackRate: opts.callbackRate,
      trailingSide: opts.trailingSide,
      stopLossPrice: opts.stopLossPrice,
      takeProfitPrice: opts.takeProfitPrice,
      triggered: false,
      childOrders: [],
      filledCount: 0,
      totalCount: 0,
      startPrice: marketPrice,
      slippage: '0',
    };

    this.algos.set(id, algo);
    const set = this.userAlgos.get(opts.userId) || new Set();
    set.add(id);
    this.userAlgos.set(opts.userId, set);

    this.emitAlgoUpdate(algo);
    return { ...algo };
  }

  /**
   * 启动算法母单
   */
  async startAlgo(id: string): Promise<AlgoOrder> {
    const algo = this.algos.get(id);
    if (!algo) throw new AlgoError('ALGO_NOT_FOUND', `Algo not found: ${id}`);
    if (algo.status !== 'pending') {
      throw new AlgoError(
        'ALGO_NOT_PENDING',
        `Cannot start algo with status ${algo.status}`,
      );
    }

    algo.status = 'running';
    this.emitAlgoUpdate(algo);

    const onChildUpdate = (a: AlgoOrder, c: AlgoChildOrder): void => {
      this.childOrders.set(c.id, c);
      this.recalculateAlgo(a);
      this.emitChildUpdate(a, c);
    };
    const onAlgoUpdate = (a: AlgoOrder): void => {
      this.recalculateAlgo(a);
      this.emitAlgoUpdate(a);
    };

    switch (algo.type) {
      case 'twap':
      case 'twap_stop':
        new TwapStrategy().start(algo, this.scheduler, this.orderEngine, this.config, onChildUpdate);
        break;
      case 'vwap':
        new VwapStrategy().start(algo, this.scheduler, this.orderEngine, this.config, onChildUpdate);
        break;
      case 'iceberg':
        new IcebergStrategy().start(algo, this.scheduler, this.orderEngine, this.config, onChildUpdate);
        break;
      case 'sniper':
        new SniperStrategy().start(
          algo,
          this.scheduler,
          this.orderEngine,
          this.config,
          this.priceFeed,
          onChildUpdate,
          onAlgoUpdate,
        );
        break;
      case 'trailing_stop':
        new TrailingStopStrategy().start(
          algo,
          this.scheduler,
          this.orderEngine,
          this.config,
          this.priceFeed,
          onChildUpdate,
          onAlgoUpdate,
        );
        break;
      default:
        throw new AlgoError('UNKNOWN_TYPE', `Unknown algo type: ${algo.type}`);
    }

    // 兜底 finalize
    this.scheduler.scheduleJob(
      `${algo.id}_engine_finalize`,
      algo.endTime + 2000,
      () => this.tryFinalize(algo.id),
      { algoId: algo.id, tag: 'finalize' },
    );

    return { ...algo };
  }

  /**
   * 取消算法母单
   */
  cancelAlgo(id: string): AlgoOrder {
    const algo = this.algos.get(id);
    if (!algo) throw new AlgoError('ALGO_NOT_FOUND', `Algo not found: ${id}`);
    if (algo.status === 'completed' || algo.status === 'cancelled' || algo.status === 'failed') {
      return { ...algo };
    }

    switch (algo.type) {
      case 'twap':
      case 'twap_stop':
        new TwapStrategy().cancel(algo, this.scheduler);
        break;
      case 'vwap':
        new VwapStrategy().cancel(algo, this.scheduler);
        break;
      case 'iceberg':
        new IcebergStrategy().cancel(algo, this.scheduler);
        break;
      case 'sniper':
        new SniperStrategy().cancel(algo, this.scheduler);
        break;
      case 'trailing_stop':
        new TrailingStopStrategy().cancel(algo, this.scheduler);
        break;
    }

    algo.status = algo.filledCount > 0 ? 'partial' : 'cancelled';
    algo.completedAt = Date.now();
    this.recalculateAlgo(algo);
    this.emitAlgoUpdate(algo);
    return { ...algo };
  }

  /**
   * 获取算法母单
   */
  getAlgo(id: string): AlgoOrder | null {
    const a = this.algos.get(id);
    return a ? { ...a } : null;
  }

  /**
   * 获取用户的算法母单
   */
  getUserAlgos(userId: string, status?: AlgoStatus): AlgoOrder[] {
    const ids = this.userAlgos.get(userId) || new Set();
    const out: AlgoOrder[] = [];
    for (const id of ids) {
      const a = this.algos.get(id);
      if (!a) continue;
      if (status && a.status !== status) continue;
      out.push({ ...a });
    }
    return out;
  }

  /**
   * 获取子单
   */
  getChildOrder(childId: string): AlgoChildOrder | null {
    const c = this.childOrders.get(childId);
    return c ? { ...c } : null;
  }

  /**
   * 获取算法的子单列表
   */
  getAlgoChildren(algoId: string): AlgoChildOrder[] {
    const algo = this.algos.get(algoId);
    if (!algo) return [];
    const out: AlgoChildOrder[] = [];
    for (const cid of algo.childOrders) {
      const c = this.childOrders.get(cid);
      if (c) out.push({ ...c });
    }
    return out;
  }

  /**
   * 订阅算法更新
   */
  onAlgoUpdate(handler: (algo: AlgoOrder) => void): () => void {
    this.emitter.on('algoUpdate', handler);
    return () => this.emitter.off('algoUpdate', handler);
  }

  /**
   * 订阅子单成交
   */
  onChildOrderFilled(handler: (algo: AlgoOrder, child: AlgoChildOrder) => void): () => void {
    this.emitter.on('childFilled', handler);
    return () => this.emitter.off('childFilled', handler);
  }

  /**
   * 用户统计
   */
  getUserStats(userId: string): UserAlgoStats {
    const algos = this.getUserAlgos(userId);
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalVolume = '0';
    let slippageSum = '0';
    let slippageCount = 0;
    let totalFilled = '0';

    for (const a of algos) {
      byType[a.type] = (byType[a.type] || 0) + 1;
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      totalVolume = decTruncate(decAdd(totalVolume, a.totalNotional), 8);
      totalFilled = decTruncate(decAdd(totalFilled, a.executedQuantity), 8);
      if (decIsPositive(a.slippage) && a.slippage !== '0') {
        slippageSum = decTruncate(decAdd(slippageSum, a.slippage), 8);
        slippageCount += 1;
      }
    }
    const avgSlippage = slippageCount > 0 ? decTruncate(decDiv(slippageSum, String(slippageCount), 8), 8) : '0';

    return {
      algoCount: algos.length,
      totalVolume,
      avgSlippage,
      totalFilled,
      byType: byType as UserAlgoStats['byType'],
      byStatus: byStatus as UserAlgoStats['byStatus'],
    };
  }

  /**
   * 关闭引擎
   */
  shutdown(): void {
    this.scheduler.stop();
    this.emitter.removeAllListeners();
  }

  /**
   * 重置（测试用）
   */
  reset(): void {
    this.scheduler.reset();
    this.algos.clear();
    this.childOrders.clear();
    this.userAlgos.clear();
    this.algoSeq = 0;
    this.emitter.removeAllListeners();
  }

  // ==========================================================================
  // 内部
  // ==========================================================================

  private validateCreateOpts(opts: CreateAlgoOpts): void {
    if (!opts.userId) throw new AlgoError('INVALID_USER', 'userId required');
    if (!opts.symbol) throw new AlgoError('INVALID_SYMBOL', 'symbol required');
    if (!opts.side) throw new AlgoError('INVALID_SIDE', 'side required');
    if (!decIsPositive(opts.totalQuantity)) {
      throw new AlgoError('INVALID_QTY', 'totalQuantity must be > 0');
    }
    if (opts.durationSec <= 0) {
      throw new AlgoError('INVALID_DURATION', 'durationSec must be > 0');
    }
    if (opts.type === 'iceberg' && !opts.displayQuantity) {
      throw new AlgoError('INVALID_CONFIG', 'Iceberg requires displayQuantity');
    }
    if (opts.type === 'sniper' && !opts.triggerPrice) {
      throw new AlgoError('INVALID_CONFIG', 'Sniper requires triggerPrice');
    }
    if (opts.type === 'vwap' && (!opts.volumeProfile || opts.volumeProfile.length === 0)) {
      throw new AlgoError('INVALID_CONFIG', 'VWAP requires volumeProfile (or will degrade to TWAP)');
    }
  }

  private defaultInterval(opts: CreateAlgoOpts): number {
    if (opts.intervalSec) return opts.intervalSec;
    if (opts.type === 'iceberg') return 5;
    return 60;
  }

  private recalculateAlgo(algo: AlgoOrder): void {
    // 计算 avgPrice = totalNotional / executedQuantity
    if (decIsPositive(algo.executedQuantity)) {
      algo.avgPrice = decTruncate(
        decDiv(algo.totalNotional, algo.executedQuantity, 8),
        8,
      );
    } else {
      algo.avgPrice = '0';
    }
    // 计算滑点：(avgPrice - startPrice) / startPrice   side=buy 时为正=买贵
    if (decIsPositive(algo.startPrice) && decIsPositive(algo.avgPrice)) {
      const diff = decSub(algo.avgPrice, algo.startPrice);
      const slipRaw = decDiv(diff, algo.startPrice, 8);
      // 对 sell：sellPrice > startPrice = 卖得更好 = 负滑点
      if (algo.side === 'sell') {
        algo.slippage = decTruncate(decMul(slipRaw, '-1'), 8);
      } else {
        algo.slippage = decTruncate(slipRaw, 8);
      }
    } else {
      algo.slippage = '0';
    }
  }

  private emitAlgoUpdate(algo: AlgoOrder): void {
    try {
      this.emitter.emit('algoUpdate', { ...algo });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[AlgoEngine] algoUpdate handler error', e);
    }
  }

  private emitChildUpdate(algo: AlgoOrder, child: AlgoChildOrder): void {
    try {
      if (child.status === 'filled') {
        this.emitter.emit('childFilled', { ...algo }, { ...child });
      } else {
        this.emitter.emit('childUpdate', { ...algo }, { ...child });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[AlgoEngine] childUpdate handler error', e);
    }
  }

  private tryFinalize(algoId: string): void {
    const algo = this.algos.get(algoId);
    if (!algo) return;
    if (algo.status === 'completed' || algo.status === 'cancelled' || algo.status === 'failed' || algo.status === 'triggered') {
      return;
    }
    // 检查是否已全部成交
    if (decCmp(algo.executedQuantity, algo.totalQuantity) >= 0) {
      algo.status = 'completed';
    } else if (algo.filledCount > 0) {
      algo.status = 'partial';
    } else {
      algo.status = 'cancelled';
    }
    algo.completedAt = Date.now();
    this.recalculateAlgo(algo);
    this.emitAlgoUpdate(algo);
  }

  // 暴露给测试：注入当前价格（绕过 PriceFeed）
  setPriceFeed(priceFeed: PriceFeed | null): void {
    this.priceFeed = priceFeed;
  }
  getScheduler(): AlgoScheduler {
    return this.scheduler;
  }
  getConfig(): AlgoConfig {
    return this.config;
  }
}
