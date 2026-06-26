/**
 * 组合管理（Portfolio Manager）
 *
 * 功能：
 *  - 仓位增删改
 *  - 风险指标：VaR / Beta / Sharpe
 *  - 风险敞口统计
 *  - 自动调仓（权重偏离触发）
 */

import type { Position, RebalanceTarget, Trade } from './types';

// =============================================================================
// 仓位管理
// =============================================================================

export class PortfolioManager {
  private positions = new Map<string, Position>();

  /** 添加仓位（如果存在同 symbol，叠加数量与均价） */
  addPosition(pos: Position): void {
    const existing = this.positions.get(pos.symbol);
    if (!existing) {
      this.positions.set(pos.symbol, { ...pos });
      return;
    }
    // 同方向叠加
    if (existing.side === pos.side) {
      const totalQty = existing.quantity + pos.quantity;
      const avgPrice =
        (existing.entryPrice * existing.quantity + pos.entryPrice * pos.quantity) / totalQty;
      existing.entryPrice = avgPrice;
      existing.quantity = totalQty;
      existing.entryTime = pos.entryTime; // 用最新的进入时间
    } else {
      // 反向：先减仓（简化：直接覆盖）
      this.positions.set(pos.symbol, { ...pos });
    }
  }

  /** 移除仓位 */
  removePosition(symbol: string): void {
    this.positions.delete(symbol);
  }

  /** 更新仓位 */
  updatePosition(symbol: string, updates: Partial<Position>): void {
    const existing = this.positions.get(symbol);
    if (!existing) return;
    this.positions.set(symbol, { ...existing, ...updates, symbol });
  }

  /** 列出全部仓位 */
  listPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  /** 取单个仓位 */
  getPosition(symbol: string): Position | undefined {
    return this.positions.get(symbol);
  }

  // -------------------------------------------------------------------------
  // 风险指标
  // -------------------------------------------------------------------------

  /**
   * 历史 VaR（参数法）
   *   VaR = μ - z * σ
   * 默认 95% 置信度，z=1.645
   * @param returns    收益率序列（小数）
   * @param confidence 0.95
   */
  calculateVaR(returns: number[], confidence: number = 0.95): number {
    if (returns.length === 0) return 0;
    const mean = returns.reduce((s, v) => s + v, 0) / returns.length;
    const variance =
      returns.reduce((s, v) => s + (v - mean) ** 2, 0) / returns.length;
    const std = Math.sqrt(variance);
    // 95% → 1.645, 99% → 2.326
    const z =
      confidence >= 0.99 ? 2.326 : confidence >= 0.975 ? 1.96 : confidence >= 0.95 ? 1.645 : 1.282;
    return -(mean - z * std); // 损失为正
  }

  /**
   * Beta 系数
   *   β = Cov(asset, market) / Var(market)
   */
  calculateBeta(assetReturns: number[], marketReturns: number[]): number {
    const n = Math.min(assetReturns.length, marketReturns.length);
    if (n < 2) return 0;
    const ma = assetReturns.slice(0, n).reduce((s, v) => s + v, 0) / n;
    const mm = marketReturns.slice(0, n).reduce((s, v) => s + v, 0) / n;
    let cov = 0;
    let varM = 0;
    for (let i = 0; i < n; i++) {
      cov += (assetReturns[i] - ma) * (marketReturns[i] - mm);
      varM += (marketReturns[i] - mm) ** 2;
    }
    return varM === 0 ? 0 : cov / varM;
  }

  /**
   * Sharpe Ratio
   *   S = (mean - rf) / std * sqrt(annualization)
   * @param rf  无风险利率（年化）
   * @param annualization  周期数（默认 252 交易日）
   */
  calculateSharpe(returns: number[], rf: number = 0, annualization: number = 252): number {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((s, v) => s + v, 0) / returns.length;
    const variance =
      returns.reduce((s, v) => s + (v - mean) ** 2, 0) / (returns.length - 1);
    const std = Math.sqrt(variance);
    return std === 0 ? 0 : ((mean - rf / annualization) / std) * Math.sqrt(annualization);
  }

  /**
   * 总敞口（按 markPrice 计算）
   * @param markPrices  symbol → mark
   */
  getExposure(markPrices: Record<string, number> = {}): { long: number; short: number; net: number } {
    let long = 0;
    let short = 0;
    for (const p of this.positions.values()) {
      const price = markPrices[p.symbol] ?? p.entryPrice;
      const notional = p.quantity * price;
      if (p.side === 'long') long += notional;
      else short += notional;
    }
    return { long, short, net: long - short };
  }

  // -------------------------------------------------------------------------
  // 调仓
  // -------------------------------------------------------------------------

  /**
   * 再平衡
   * @param targets       目标权重列表
   * @param totalEquity   组合总市值
   * @param threshold     偏离阈值（默认 0.05 = 5%）
   */
  rebalance(
    targets: RebalanceTarget[],
    totalEquity: number,
    threshold: number = 0.05,
  ): { trades: Trade[] } {
    const trades: Trade[] = [];
    const current = this.computeCurrentWeights(totalEquity);
    const targetMap = new Map(targets.map((t) => [t.symbol, t.weight]));

    for (const t of targets) {
      const cur = current.get(t.symbol) ?? 0;
      const diff = t.weight - cur;
      if (Math.abs(diff) < threshold) continue;

      const pos = this.positions.get(t.symbol);
      const targetValue = t.weight * totalEquity;
      const curValue = cur * totalEquity;
      const delta = targetValue - curValue;

      trades.push({
        entryTime: Date.now(),
        symbol: t.symbol,
        side: delta > 0 ? 'long' : 'short',
        entryPrice: pos?.entryPrice ?? 0,
        quantity: Math.abs(delta) / (pos?.entryPrice ?? 1),
        pnl: 0,
        pnlPct: 0,
        commission: 0,
        holdingPeriod: 0,
        reason: `Rebalance: ${t.symbol} weight ${(cur * 100).toFixed(2)}% → ${(t.weight * 100).toFixed(2)}%`,
      });
    }

    // 卖出未在目标中的仓位
    for (const sym of current.keys()) {
      if (!targetMap.has(sym)) {
        const pos = this.positions.get(sym);
        if (pos) {
          trades.push({
            entryTime: Date.now(),
            symbol: sym,
            side: 'short',
            entryPrice: pos.entryPrice,
            quantity: pos.quantity,
            pnl: 0,
            pnlPct: 0,
            commission: 0,
            holdingPeriod: 0,
            reason: `Rebalance: ${sym} not in target, flatten`,
          });
          this.removePosition(sym);
        }
      }
    }

    return { trades };
  }

  private computeCurrentWeights(totalEquity: number): Map<string, number> {
    const m = new Map<string, number>();
    if (totalEquity <= 0) return m;
    for (const p of this.positions.values()) {
      m.set(p.symbol, (p.quantity * p.entryPrice) / totalEquity);
    }
    return m;
  }
}
