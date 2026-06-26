/**
 * 实时信号引擎（Live Signal Engine）
 *
 * 订阅行情 K 线，实时计算技术指标并产出信号。
 *
 * 用法：
 *   const engine = new LiveSignalEngine();
 *   const unsubscribe = engine.subscribe('BTCUSDT', 'two-ma', (signal) => {...});
 *   engine.onKline('BTCUSDT', candle);   // 喂入新 K 线
 */

import type { Candle, Signal } from './types';
import { createStrategy } from './backtest-engine';

interface Subscription {
  symbol: string;
  strategyId: string;
  callback: (signal: Signal) => void;
  history: Candle[];
}

export class LiveSignalEngine {
  private subs: Subscription[] = [];
  private latest = new Map<string, Signal>();

  private key(symbol: string, strategyId: string): string {
    return `${symbol}::${strategyId}`;
  }

  /**
   * 订阅：返回取消订阅函数
   */
  subscribe(
    symbol: string,
    strategyId: string,
    callback: (signal: Signal) => void,
    params: Record<string, any> = {},
  ): () => void {
    const strategy = createStrategy(strategyId, params);
    // 立即创建订阅对象（内部保存 strategy 实例，闭包捕获）
    const sub: Subscription = {
      symbol,
      strategyId,
      callback,
      history: [],
    };
    // 用闭包保存 strategy，避免外部依赖
    (sub as any)._strategy = strategy;
    this.subs.push(sub);
    return () => {
      this.subs = this.subs.filter((s) => s !== sub);
    };
  }

  /**
   * 喂入新 K 线
   * @param symbol  交易对
   * @param candle  新 K 线（已 close）
   */
  onKline(symbol: string, candle: Candle): void {
    for (const sub of this.subs) {
      if (sub.symbol !== symbol) continue;
      sub.history.push(candle);
      const strategy = (sub as any)._strategy as ReturnType<typeof createStrategy>;
      const sig = strategy.evaluate(sub.history, sub.history.length - 1);
      if (sig) {
        this.latest.set(this.key(symbol, sub.strategyId), sig);
        sub.callback(sig);
      }
    }
  }

  /** 批量预热历史 K 线（回放历史后再开始实时） */
  preload(symbol: string, strategyId: string, history: Candle[]): void {
    for (const sub of this.subs) {
      if (sub.symbol === symbol && sub.strategyId === strategyId) {
        sub.history = [...history];
      }
    }
  }

  /** 取最近一次信号 */
  getLatestSignal(symbol: string, strategyId: string): Signal | null {
    return this.latest.get(this.key(symbol, strategyId)) ?? null;
  }

  /** 清空 */
  clear(): void {
    this.subs = [];
    this.latest.clear();
  }

  /** 当前订阅数 */
  size(): number {
    return this.subs.length;
  }
}
