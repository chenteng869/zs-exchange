/**
 * 风险引擎（Risk Engine）
 *
 * 提供专业级投资组合风险指标：
 *  - 波动率（年化）/ Sharpe / Sortino / Calmar
 *  - VaR / CVaR（历史法 + 参数法）
 *  - 最大回撤 / 当前回撤
 *  - 集中度（HHI）/ 有效资产数
 *  - 杠杆（总 / 净）
 *  - 流动性评分
 *
 * 零外部依赖，纯数学实现。returns 数组为日收益（小数）序列。
 */

import { decAdd, decIsZero, decMul } from '@/lib/matching/decimal';
import {
  CONCENTRATION_WARNING,
  RISK_FREE_RATE,
  TRADING_DAYS,
  VAR_DEFAULT_CONFIDENCE,
  type PortfolioAsset,
  type PortfolioRiskMetrics,
} from './types';

export class RiskEngine {
  // -------------------------------------------------------------------------
  // 收益 / 风险比率
  // -------------------------------------------------------------------------

  /**
   * 波动率（年化）
   * @param returns     日收益序列
   * @param annualize   是否年化
   * @param period      年化周期数（默认 365，加密币 7×24）
   */
  calculateVolatility(returns: number[], annualize = true, period: number = TRADING_DAYS): number {
    if (returns.length < 2) return 0;
    const std = this.std(returns);
    return annualize ? std * Math.sqrt(period) : std;
  }

  /**
   * Sharpe Ratio
   *   S = (mean(returns) - rf/period) / std * sqrt(period)
   * @param rf     年化无风险利率
   * @param period 年化周期数
   */
  calculateSharpe(
    returns: number[],
    rf: number = RISK_FREE_RATE,
    period: number = TRADING_DAYS,
  ): number {
    if (returns.length < 2) return 0;
    const mean = this.mean(returns);
    const std = this.std(returns);
    if (std === 0) return 0;
    return ((mean - rf / period) / std) * Math.sqrt(period);
  }

  /**
   * Sortino Ratio（仅用下行波动率）
   */
  calculateSortino(
    returns: number[],
    rf: number = RISK_FREE_RATE,
    period: number = TRADING_DAYS,
  ): number {
    if (returns.length < 2) return 0;
    const mean = this.mean(returns);
    const downside = returns.filter((r) => r < 0);
    if (downside.length < 2) return 0;
    const dVar = this.variance(downside);
    const dStd = Math.sqrt(dVar);
    if (dStd === 0) return 0;
    return ((mean - rf / period) / dStd) * Math.sqrt(period);
  }

  /**
   * Calmar Ratio = 年化收益 / |最大回撤|
   */
  calculateCalmar(equity: number[]): number {
    if (equity.length < 2) return 0;
    const totalReturn = (equity[equity.length - 1] - equity[0]) / equity[0];
    const years = (equity.length - 1) / TRADING_DAYS;
    const annualized = years > 0 ? (1 + totalReturn) ** (1 / years) - 1 : totalReturn;
    const maxDD = this.calculateMaxDrawdown(equity);
    if (maxDD === 0) return 0;
    return annualized / maxDD;
  }

  // -------------------------------------------------------------------------
  // VaR / CVaR
  // -------------------------------------------------------------------------

  /**
   * 历史法 VaR：返回正值代表损失
   * @param confidence 0.95 / 0.99
   */
  calculateVaR(returns: number[], confidence: number = VAR_DEFAULT_CONFIDENCE): number {
    if (returns.length === 0) return 0;
    const sorted = [...returns].sort((a, b) => a - b);
    const idx = Math.floor((1 - confidence) * sorted.length);
    const i = Math.max(0, Math.min(idx, sorted.length - 1));
    return -sorted[i];
  }

  /**
   * 条件 VaR（CVaR / Expected Shortfall）：损失超过 VaR 的均值
   */
  calculateCVaR(returns: number[], confidence: number = VAR_DEFAULT_CONFIDENCE): number {
    if (returns.length === 0) return 0;
    const sorted = [...returns].sort((a, b) => a - b);
    const cutoff = Math.floor((1 - confidence) * sorted.length);
    if (cutoff === 0) return 0;
    const tail = sorted.slice(0, cutoff);
    const mean = tail.reduce((s, v) => s + v, 0) / tail.length;
    return -mean;
  }

  /** 参数法 VaR（z-score） */
  calculateParametricVaR(
    returns: number[],
    confidence: number = VAR_DEFAULT_CONFIDENCE,
  ): number {
    if (returns.length < 2) return 0;
    const mean = this.mean(returns);
    const std = this.std(returns);
    const z =
      confidence >= 0.99 ? 2.326 : confidence >= 0.975 ? 1.96 : confidence >= 0.95 ? 1.645 : 1.282;
    return -(mean - z * std);
  }

  // -------------------------------------------------------------------------
  // 回撤
  // -------------------------------------------------------------------------

  /**
   * 最大回撤（绝对值，如 0.2 = 20%）
   */
  calculateMaxDrawdown(equity: number[]): number {
    if (equity.length === 0) return 0;
    let peak = equity[0];
    let maxDD = 0;
    for (const v of equity) {
      if (v > peak) peak = v;
      if (peak > 0) {
        const dd = (peak - v) / peak;
        if (dd > maxDD) maxDD = dd;
      }
    }
    return maxDD;
  }

  /**
   * 当前回撤
   */
  calculateCurrentDrawdown(equity: number[]): number {
    if (equity.length === 0) return 0;
    const peak = Math.max(...equity);
    const last = equity[equity.length - 1];
    if (peak <= 0) return 0;
    return (peak - last) / peak;
  }

  // -------------------------------------------------------------------------
  // 集中度
  // -------------------------------------------------------------------------

  /**
   * HHI（Herfindahl-Hirschman Index）
   * = Σ w_i^2，范围 [1/N, 1]
   * 1 资产 = 1；N 个等权资产 = 1/N
   */
  calculateHHI(weights: number[]): number {
    if (weights.length === 0) return 0;
    let s = 0;
    for (const w of weights) s += w * w;
    return s;
  }

  /**
   * 有效资产数 = 1 / HHI
   */
  calculateEffectiveAssets(weights: number[]): number {
    const hhi = this.calculateHHI(weights);
    if (hhi === 0) return 0;
    return 1 / hhi;
  }

  /** HHI 是否警告（>= 0.3） */
  isConcentrationWarning(hhi: number): boolean {
    return hhi >= CONCENTRATION_WARNING;
  }

  // -------------------------------------------------------------------------
  // 杠杆
  // -------------------------------------------------------------------------

  /**
   * 总杠杆 = Σ |positionValue| / equity
   */
  calculateGrossLeverage(
    positions: { value: number }[],
    equity: number,
  ): number {
    if (equity <= 0) return 0;
    const gross = positions.reduce((s, p) => s + Math.abs(p.value), 0);
    return gross / equity;
  }

  /**
   * 净杠杆 = Σ positionValue / equity
   * 多头为正，空头为负
   */
  calculateNetLeverage(
    positions: { value: number }[],
    equity: number,
  ): number {
    if (equity <= 0) return 0;
    const net = positions.reduce((s, p) => s + p.value, 0);
    return net / equity;
  }

  // -------------------------------------------------------------------------
  // 流动性
  // -------------------------------------------------------------------------

  /**
   * 流动性评分 0-100
   * 算法：每个资产的日成交量 / 市值（turnover）加权
   *   - spot / perp: 高（turnover > 0.5 = 100 分）
   *   - defi / lending: 中
   *   - fiat: 中
   *   - 锁定 / 无量: 低
   */
  calculateLiquidityScore(assets: PortfolioAsset[]): number {
    if (assets.length === 0) return 0;
    let score = 0;
    let totalValue = 0;
    for (const a of assets) {
      const mv = Number(a.marketValue || '0');
      if (mv <= 0) continue;
      const vol = Number(a.meta?.volume24h || '0');
      const turnover = vol / mv;
      let factor = 0;
      switch (a.assetClass) {
        case 'spot':
        case 'perp':
          factor = Math.min(1, turnover / 0.5);
          break;
        case 'option':
          factor = Math.min(0.8, turnover);
          break;
        case 'defi':
          factor = 0.4;
          break;
        case 'lending':
        case 'staking':
          factor = 0.2;
          break;
        case 'fiat':
          factor = 0.9;
          break;
        default:
          factor = 0.1;
      }
      score += factor * mv;
      totalValue += mv;
    }
    if (totalValue === 0) return 0;
    return Math.round((score / totalValue) * 100);
  }

  /**
   * 非流动资产占比 = (市值 == 0 或无成交量) / 总市值
   */
  calculateIlliquidPct(assets: PortfolioAsset[]): number {
    let total = 0;
    let illiquid = 0;
    for (const a of assets) {
      const mv = Number(a.marketValue || '0');
      total += mv;
      const vol = Number(a.meta?.volume24h || '0');
      const illiquidClass = a.assetClass === 'fiat' ? false : vol === 0;
      if (illiquidClass || mv === 0) illiquid += mv;
    }
    if (total === 0) return 0;
    return illiquid / total;
  }

  // -------------------------------------------------------------------------
  // β / 相关性
  // -------------------------------------------------------------------------

  /**
   * Beta = Cov(asset, market) / Var(market)
   */
  calculateBeta(assetReturns: number[], marketReturns: number[]): number {
    const n = Math.min(assetReturns.length, marketReturns.length);
    if (n < 2) return 0;
    const ma = this.mean(assetReturns.slice(0, n));
    const mm = this.mean(marketReturns.slice(0, n));
    let cov = 0;
    let varM = 0;
    for (let i = 0; i < n; i++) {
      cov += (assetReturns[i] - ma) * (marketReturns[i] - mm);
      varM += (marketReturns[i] - mm) ** 2;
    }
    if (varM === 0) return 0;
    return cov / varM;
  }

  /**
   * Pearson 相关系数
   */
  calculateCorrelation(a: number[], b: number[]): number {
    const n = Math.min(a.length, b.length);
    if (n < 2) return 0;
    const ma = this.mean(a.slice(0, n));
    const mb = this.mean(b.slice(0, n));
    let num = 0;
    let da = 0;
    let db = 0;
    for (let i = 0; i < n; i++) {
      const xa = a[i] - ma;
      const xb = b[i] - mb;
      num += xa * xb;
      da += xa * xa;
      db += xb * xb;
    }
    const denom = Math.sqrt(da * db);
    if (denom === 0) return 0;
    return num / denom;
  }

  // -------------------------------------------------------------------------
  // 组合级：一次性算出所有指标
  // -------------------------------------------------------------------------

  /**
   * 计算完整组合风险指标
   * @param returns   组合日收益序列
   * @param equity    组合权益曲线
   * @param assets    组合资产（用于集中度 / 流动性 / 杠杆）
   * @param market    基准（BTC）日收益序列（用于 β / 相关性）
   * @param capital   账户权益（用于杠杆）
   */
  calculatePortfolioRisk(
    returns: number[],
    equity: number[],
    assets: PortfolioAsset[],
    market?: number[],
    capital: number = 0,
  ): PortfolioRiskMetrics {
    const weights = assets.map((a) => Number(a.allocation || '0'));
    const hhi = this.calculateHHI(weights);
    const positions = assets
      .filter((a) => a.assetClass === 'perp')
      .map((a) => ({ value: Number(a.marketValue || '0') * (a.meta?.leverage ?? 1) }));
    const illiquid = this.calculateIlliquidPct(assets);
    const equityNum = capital > 0 ? capital : equity[equity.length - 1] || 0;
    return {
      volatility: this.calculateVolatility(returns),
      sharpeRatio: this.calculateSharpe(returns),
      sortinoRatio: this.calculateSortino(returns),
      calmarRatio: this.calculateCalmar(equity),
      var95: this.calculateVaR(returns, 0.95),
      var99: this.calculateVaR(returns, 0.99),
      cvar95: this.calculateCVaR(returns, 0.95),
      maxDrawdown: this.calculateMaxDrawdown(equity),
      currentDrawdown: this.calculateCurrentDrawdown(equity),
      concentration: hhi,
      effectiveAssets: this.calculateEffectiveAssets(weights),
      beta: market ? this.calculateBeta(returns, market) : 0,
      correlation: market ? this.calculateCorrelation(returns, market) : 0,
      grossLeverage: this.calculateGrossLeverage(positions, equityNum),
      netLeverage: this.calculateNetLeverage(positions, equityNum),
      liquidityScore: this.calculateLiquidityScore(assets),
      illiquidPct: String(illiquid),
    };
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  private mean(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  }

  private variance(arr: number[]): number {
    if (arr.length < 2) return 0;
    const m = this.mean(arr);
    return arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  }

  private std(arr: number[]): number {
    return Math.sqrt(this.variance(arr));
  }
}

/**
 * 工厂：构造默认 RiskEngine
 */
export function createRiskEngine(): RiskEngine {
  return new RiskEngine();
}

/** 工具：按权重数组算组合收益（外层也可以用） */
export function combineReturns(weights: number[], returns: number[][]): number[] {
  if (weights.length === 0 || returns.length === 0) return [];
  const n = Math.min(...returns.map((r) => r.length));
  const out: number[] = new Array(n);
  for (let t = 0; t < n; t++) {
    let r = 0;
    for (let i = 0; i < weights.length; i++) {
      r += weights[i] * (returns[i]?.[t] ?? 0);
    }
    out[t] = r;
  }
  return out;
}

/** 简单收益率序列：close[t+1] / close[t] - 1 */
export function returnsFromPrices(prices: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] === 0) {
      out.push(0);
    } else {
      out.push(prices[i] / prices[i - 1] - 1);
    }
  }
  return out;
}

/** 重导出以方便上层使用 */
export { decAdd, decIsZero, decMul };
