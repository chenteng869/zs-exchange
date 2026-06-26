/**
 * 回测引擎（Backtest Engine）
 *
 * 流程：
 *  1. 加载 K 线
 *  2. 跑策略生成信号
 *  3. 模拟成交（带滑点 / 手续费）
 *  4. 计算权益曲线
 *  5. 统计绩效指标
 *
 * 特性：
 *  - 相同 config 命中缓存
 *  - 支持多策略多周期（runMany）
 *  - 零外部依赖
 */

import type {
  BacktestConfig,
  BacktestResult,
  Candle,
  EquityPoint,
  PerformanceMetrics,
  Position,
  Signal,
  Strategy,
  Trade,
} from './types';
import { TwoMAStrategy } from './strategies/two-ma';
import { MACDStrategy } from './strategies/macd-strategy';
import { GridStrategy } from './strategies/grid';
import { BreakoutStrategy } from './strategies/breakout';
import { PairTradingStrategy } from './strategies/pair-trading';

import { computeMetrics } from '@/lib/shared';

// =============================================================================
// 工厂：根据策略 ID 创建策略实例
// =============================================================================

export function createStrategy(strategyId: string, params: Record<string, any> = {}): Strategy {
  switch (strategyId) {
    case 'two-ma':
      return new TwoMAStrategy(params as any);
    case 'macd':
      return new MACDStrategy(params as any);
    case 'grid':
      return new GridStrategy(params as any);
    case 'breakout':
      return new BreakoutStrategy(params as any);
    case 'pair-trading':
      // 配对交易需要在引擎层特殊处理
      throw new Error('[backtest] pair-trading strategy requires special handling via BacktestEngine.runPair');
    default:
      throw new Error(`[backtest] unknown strategy: ${strategyId}`);
  }
}

// =============================================================================
// 内部：单品种策略回测
// =============================================================================

export class BacktestEngine {
  /** 缓存：config JSON → result */
  private cache = new Map<string, BacktestResult>();

  /** 清除缓存 */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 核心回测
   * @param config   回测配置
   * @param candles  K 线序列（按时间升序）
   */
  run(config: BacktestConfig, candles: Candle[]): BacktestResult {
    const key = JSON.stringify({ config, n: candles.length, first: candles[0]?.time, last: candles[candles.length - 1]?.time });
    const cached = this.cache.get(key);
    if (cached) return cached;

    const strategy = createStrategy(config.strategy, config.params);
    const result = this.simulate(strategy, config, candles);
    this.cache.set(key, result);
    return result;
  }

  /** 多配置批量回测（并行遍历配置；每个 config 内部串行） */
  runMany(configs: Array<{ config: BacktestConfig; candles: Candle[] }>): BacktestResult[] {
    return configs.map(({ config, candles }) => this.run(config, candles));
  }

  /**
   * 配对交易专用回测：传入两个品种的 K 线
   */
  runPair(
    config: BacktestConfig,
    candlesA: Candle[],
    candlesB: Candle[],
  ): BacktestResult {
    const key = JSON.stringify({
      config,
      nA: candlesA.length,
      nB: candlesB.length,
      firstA: candlesA[0]?.time,
    });
    const cached = this.cache.get(key);
    if (cached) return cached;

    const strategy: PairTradingStrategy = new PairTradingStrategy(config.params);

    const trades: Trade[] = [];
    const equity: EquityPoint[] = [];
    let capital = config.initialCapital;
    let pos: Position | null = null;
    let openTrade: Trade | null = null;
    let peak = capital;

    const len = Math.min(candlesA.length, candlesB.length);
    for (let i = 0; i < len; i++) {
      const c = candlesA[i];
      const sig: Signal | null = strategy.evaluatePair(candlesA, candlesB, i);
      if (sig) {
        const fillPrice = applySlippage(sig.price, sig.type, config.slippage);
        if (sig.type === 'buy' && !pos) {
          pos = openPosition(config.symbol, 'long', fillPrice, capital, config.leverage, c.time);
          openTrade = newOpenTrade(pos, sig);
        } else if (sig.type === 'sell' && !pos && config.strategy === 'pair-trading') {
          pos = openPosition(config.symbol, 'short', fillPrice, capital, config.leverage, c.time);
          openTrade = newOpenTrade(pos, sig);
        } else if (sig.type === 'close' && pos) {
          const t = closeTrade(openTrade!, pos, fillPrice, c.time, config.commission, sig.reason);
          trades.push(t);
          capital += t.pnl - t.commission;
          pos = null;
          openTrade = null;
        }
      }

      // 标记市值
      if (pos) {
        const pnl = unrealizedPnl(pos, c.close);
        pos.unrealizedPnl = pnl;
      }
      const totalEquity = capital + (pos ? pos.unrealizedPnl : 0);
      if (totalEquity > peak) peak = totalEquity;
      const dd = peak > 0 ? (peak - totalEquity) / peak : 0;
      equity.push({ time: c.time, equity: totalEquity, drawdown: dd });
    }

    if (pos && openTrade) {
      const lastC = candlesA[len - 1];
      const t = closeTrade(openTrade, pos, lastC.close, lastC.time, config.commission, '回测结束强平');
      trades.push(t);
      capital += t.pnl - t.commission;
      const totalEquity = capital;
      if (totalEquity > peak) peak = totalEquity;
      const dd = peak > 0 ? (peak - totalEquity) / peak : 0;
      equity.push({ time: lastC.time, equity: totalEquity, drawdown: dd });
    }

    const metrics = computeMetrics(trades, equity, config.initialCapital);
    const result: BacktestResult = { config, trades, equity, metrics };
    this.cache.set(key, result);
    return result;
  }

  // ---------------------------------------------------------------------------
  // 内部：单品种策略回测
  // ---------------------------------------------------------------------------
  private simulate(strategy: Strategy, config: BacktestConfig, candles: Candle[]): BacktestResult {
    const trades: Trade[] = [];
    const equity: EquityPoint[] = [];
    let capital = config.initialCapital;
    let pos: Position | null = null;
    let openTrade: Trade | null = null;
    let peak = capital;

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const sig = strategy.evaluate(candles, i);
      if (sig) {
        const fillPrice = applySlippage(sig.price, sig.type, config.slippage);
        if (sig.type === 'buy' && !pos) {
          pos = openPosition(config.symbol, 'long', fillPrice, capital, config.leverage, c.time);
          openTrade = newOpenTrade(pos, sig);
        } else if (sig.type === 'sell' && pos) {
          const t = closeTrade(openTrade!, pos, fillPrice, c.time, config.commission, sig.reason);
          trades.push(t);
          capital += t.pnl - t.commission;
          pos = null;
          openTrade = null;
        } else if (sig.type === 'close' && pos) {
          const t = closeTrade(openTrade!, pos, fillPrice, c.time, config.commission, sig.reason);
          trades.push(t);
          capital += t.pnl - t.commission;
          pos = null;
          openTrade = null;
        }
      }

      if (pos) {
        pos.unrealizedPnl = unrealizedPnl(pos, c.close);
      }
      const totalEquity = capital + (pos ? pos.unrealizedPnl : 0);
      if (totalEquity > peak) peak = totalEquity;
      const dd = peak > 0 ? (peak - totalEquity) / peak : 0;
      equity.push({ time: c.time, equity: totalEquity, drawdown: dd });
    }

    // 强平未平仓
    if (pos && openTrade) {
      const lastC = candles[candles.length - 1];
      const t = closeTrade(openTrade, pos, lastC.close, lastC.time, config.commission, '回测结束强平');
      trades.push(t);
      capital += t.pnl - t.commission;
      const totalEquity = capital;
      if (totalEquity > peak) peak = totalEquity;
      const dd = peak > 0 ? (peak - totalEquity) / peak : 0;
      equity.push({ time: lastC.time, equity: totalEquity, drawdown: dd });
    }

    const metrics = computeMetrics(trades, equity, config.initialCapital);
    return { config, trades, equity, metrics };
  }
}

// =============================================================================
// 工具
// =============================================================================

/** 滑点：买入价上滑，卖出价下滑 */
function applySlippage(price: number, type: Signal['type'], slippage: number): number {
  if (type === 'buy' || type === 'close') return price * (1 + slippage);
  return price * (1 - slippage);
}

function openPosition(
  symbol: string,
  side: 'long' | 'short',
  price: number,
  capital: number,
  leverage: number,
  time: number,
): Position {
  const notional = capital * leverage;
  const quantity = notional / price;
  return {
    symbol,
    side,
    entryPrice: price,
    quantity,
    entryTime: time,
    unrealizedPnl: 0,
  };
}

function unrealizedPnl(pos: Position, markPrice: number): number {
  if (pos.side === 'long') return (markPrice - pos.entryPrice) * pos.quantity;
  return (pos.entryPrice - markPrice) * pos.quantity;
}

function newOpenTrade(pos: Position, sig: Signal): Trade {
  return {
    entryTime: pos.entryTime,
    symbol: pos.symbol,
    side: pos.side,
    entryPrice: pos.entryPrice,
    quantity: pos.quantity,
    pnl: 0,
    pnlPct: 0,
    commission: pos.entryPrice * pos.quantity * 0.001, // 估算
    holdingPeriod: 0,
    reason: sig.reason,
  };
}

function closeTrade(
  t: Trade,
  pos: Position,
  exitPrice: number,
  exitTime: number,
  commission: number,
  reason: string,
): Trade {
  const pnl = unrealizedPnl(pos, exitPrice);
  const notional = pos.entryPrice * pos.quantity;
  const commissionPaid = commission * (notional + exitPrice * pos.quantity);
  const pnlPct = notional > 0 ? pnl / notional : 0;
  return {
    ...t,
    exitTime,
    exitPrice,
    pnl: pnl - commissionPaid,
    pnlPct,
    commission: commissionPaid,
    holdingPeriod: exitTime - pos.entryTime,
    reason,
  };
}
