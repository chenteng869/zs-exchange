/**
 * 资产配置引擎（Allocation Engine）
 *
 * 提供 5 大经典配置策略：
 *  - equalWeight        等权
 *  - markowitz          均值方差优化
 *  - riskParity         风险平价
 *  - sixtyForty         60-40 股债平衡
 *  - custom             自定义权重
 *
 * 数学实现：
 *  - 最小方差组合：w = Σ^-1 × 1 / (1^T Σ^-1 1)
 *  - 最大夏普：w ∝ Σ^-1 × (μ - rf)，归一化
 *  - 风险平价：w_i ∝ 1/σ_i（基于对角协方差）
 *    或 ERC 迭代（基于完整协方差）
 *
 * 零外部依赖。
 */

import {
  AGGRESSIVE_TEMPLATE,
  BALANCED_TEMPLATE,
  CONSERVATIVE_TEMPLATE,
  type AllocationTarget,
  type AssetClass,
} from './types';

interface CovMatrix {
  symbols: string[];
  /** NxN 协方差（年化） */
  matrix: number[][];
  /** N 维期望收益（年化） */
  mu: number[];
}

/** 协方差矩阵（导出供外部使用） */
export type { CovMatrix };

export interface AllocationConstraints {
  minWeight?: number;
  maxWeight?: number;
  /** 风险预算（风险贡献占目标比例） */
  riskBudget?: number[];
}

export class AllocationEngine {
  // -------------------------------------------------------------------------
  // 策略
  // -------------------------------------------------------------------------

  /** 等权 */
  equalWeight(symbols: string[], assetClass: AssetClass = 'spot'): AllocationTarget[] {
    if (symbols.length === 0) return [];
    const w = 1 / symbols.length;
    return symbols.map((s) => ({
      symbol: s,
      assetClass,
      targetWeight: w.toString(),
      minWeight: '0',
      maxWeight: '1',
    }));
  }

  /**
   * 60-40 股票/债券组合
   * 默认 equity=['SPY','BTC']; bond=['AGG','USDC']
   */
  sixtyForty(
    equitySymbols: string[] = ['SPY', 'BTC'],
    bondSymbols: string[] = ['AGG', 'USDC'],
  ): AllocationTarget[] {
    const targets: AllocationTarget[] = [];
    const eW = 0.6 / Math.max(1, equitySymbols.length);
    const bW = 0.4 / Math.max(1, bondSymbols.length);
    for (const s of equitySymbols) {
      targets.push({
        symbol: s,
        assetClass: s === 'BTC' ? 'perp' : 'spot',
        targetWeight: eW.toString(),
        minWeight: '0',
        maxWeight: '0.8',
      });
    }
    for (const s of bondSymbols) {
      targets.push({
        symbol: s,
        assetClass: s === 'USDC' ? 'spot' : 'fiat',
        targetWeight: bW.toString(),
        minWeight: '0',
        maxWeight: '0.6',
      });
    }
    return targets;
  }

  /** 自定义权重 */
  custom(weights: Record<string, number | string>, assetClass: AssetClass = 'spot'): AllocationTarget[] {
    const out: AllocationTarget[] = [];
    const entries = Object.entries(weights);
    const total = entries.reduce((s, [, v]) => s + Number(v), 0);
    if (total === 0) return out;
    for (const [symbol, w] of entries) {
      const nw = Number(w) / total;
      out.push({
        symbol,
        assetClass,
        targetWeight: nw.toString(),
        minWeight: '0',
        maxWeight: '1',
      });
    }
    return out;
  }

  /**
   * Markowitz 均值方差
   * @param returns       历史日收益矩阵 [N][T]
   * @param riskAversion  风险厌恶系数 λ
   * @param rf            无风险利率
   * @param constraints   权重约束
   */
  markowitz(
    returns: number[][],
    riskAversion: number = 2.5,
    rf: number = 0.03,
    constraints?: AllocationConstraints,
  ): AllocationTarget[] {
    if (returns.length === 0) return [];
    const cov = this.buildCov(returns);
    const mu = this.expectedReturns(returns);
    const excessMu = mu.map((m) => m - rf);
    // w = (1/λ) Σ^-1 (μ - rf)
    const inv = this.invert(cov.matrix);
    if (!inv) return this.equalWeight(cov.symbols);
    const wRaw = this.matVec(inv, excessMu);
    const scaled = wRaw.map((v) => v / riskAversion);
    let w = this.normalize(scaled);
    if (constraints) w = this.applyConstraints(w, constraints);
    return this.toTargets(cov.symbols, w);
  }

  /**
   * 最大夏普组合
   *   w ∝ Σ^-1 (μ - rf)
   * 然后归一化
   */
  maxSharpe(
    returns: number[][],
    rf: number = 0.03,
    constraints?: AllocationConstraints,
  ): AllocationTarget[] {
    if (returns.length === 0) return [];
    const cov = this.buildCov(returns);
    const mu = this.expectedReturns(returns);
    const excessMu = mu.map((m) => m - rf);
    const inv = this.invert(cov.matrix);
    if (!inv) return this.equalWeight(cov.symbols);
    const wRaw = this.matVec(inv, excessMu);
    let w = this.normalize(wRaw);
    if (constraints) w = this.applyConstraints(w, constraints);
    return this.toTargets(cov.symbols, w);
  }

  /**
   * 风险平价（Risk Parity）
   *   w_i ∝ 1/σ_i（基于对角协方差近似）
   * 或基于完整协方差的 ERC 迭代
   */
  riskParity(returns: number[][], maxIter: number = 100, tol: number = 1e-6): AllocationTarget[] {
    if (returns.length === 0) return [];
    const cov = this.buildCov(returns);
    // 1) 初始权重按 1/σ
    const sigmas = cov.matrix.map((row, i) => Math.sqrt(row[i]));
    const wInit = sigmas.map((s) => (s > 0 ? 1 / s : 0));
    let w = this.normalize(wInit);

    // 2) ERC 迭代（按风险贡献相等）
    for (let iter = 0; iter < maxIter; iter++) {
      const portVar = this.quadForm(w, cov.matrix);
      const sigmaP = Math.sqrt(Math.max(0, portVar));
      if (sigmaP === 0) break;
      const mrc = cov.matrix.map((row, i) => this.dot(row, w));
      const rc = w.map((wi, i) => (wi * mrc[i]) / sigmaP);
      const target = sigmaP / w.length; // 目标风险贡献
      // 调整 w
      const adjusted = w.map((wi, i) => wi * (target / Math.max(rc[i], 1e-12)));
      const wNew = this.normalize(adjusted);
      const diff = Math.max(...wNew.map((v, i) => Math.abs(v - w[i])));
      w = wNew;
      if (diff < tol) break;
    }
    return this.toTargets(cov.symbols, w);
  }

  /**
   * 最小方差组合
   *   w = Σ^-1 1 / (1^T Σ^-1 1)
   */
  minVariance(returns: number[][]): number[] {
    if (returns.length === 0) return [];
    const cov = this.buildCov(returns);
    const inv = this.invert(cov.matrix);
    if (!inv) return this.equalWeight(cov.symbols).map((t) => Number(t.targetWeight));
    const ones = new Array(cov.symbols.length).fill(1);
    const wRaw = this.matVec(inv, ones);
    return this.normalize(wRaw);
  }

  /** 按风险偏好模板 */
  fromRiskProfile(profile: 'conservative' | 'balanced' | 'aggressive'): AllocationTarget[] {
    const tpl =
      profile === 'conservative'
        ? CONSERVATIVE_TEMPLATE
        : profile === 'balanced'
        ? BALANCED_TEMPLATE
        : AGGRESSIVE_TEMPLATE;
    return this.custom(tpl);
  }

  // -------------------------------------------------------------------------
  // 工具：协方差 / 期望收益
  // -------------------------------------------------------------------------

  /** 构建协方差矩阵（按年化） */
  buildCov(returns: number[][]): CovMatrix {
    const n = returns.length;
    const t = Math.min(...returns.map((r) => r.length));
    const mu = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let k = 0; k < t; k++) s += returns[i][k] ?? 0;
      mu[i] = s / Math.max(1, t);
    }
    const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        let s = 0;
        for (let k = 0; k < t; k++) {
          s += ((returns[i][k] ?? 0) - mu[i]) * ((returns[j][k] ?? 0) - mu[j]);
        }
        const cov = s / Math.max(1, t - 1);
        matrix[i][j] = cov * 365; // 年化
        matrix[j][i] = matrix[i][j];
      }
    }
    return { symbols: [], matrix, mu };
  }

  /** 把协方差矩阵的 mu 转换为年化期望收益 */
  expectedReturns(returns: number[][]): number[] {
    const n = returns.length;
    const t = Math.min(...returns.map((r) => r.length));
    const mu = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let k = 0; k < t; k++) s += returns[i][k] ?? 0;
      mu[i] = (s / Math.max(1, t)) * 365;
    }
    return mu;
  }

  // -------------------------------------------------------------------------
  // 线性代数
  // -------------------------------------------------------------------------

  /**
   * 矩阵求逆（Gauss-Jordan）+ partial pivot
   * 失败返回 null
   */
  invert(m: number[][]): number[][] | null {
    const n = m.length;
    if (n === 0) return [];
    if (m[0].length !== n) return null;
    // 复制并构造增广矩阵 [M | I]
    const a: number[][] = m.map((row, i) => {
      const r = [...row];
      for (let j = 0; j < n; j++) r.push(i === j ? 1 : 0);
      return r;
    });
    for (let i = 0; i < n; i++) {
      // pivot
      let pivot = i;
      let maxAbs = Math.abs(a[i][i]);
      for (let k = i + 1; k < n; k++) {
        const v = Math.abs(a[k][i]);
        if (v > maxAbs) {
          maxAbs = v;
          pivot = k;
        }
      }
      if (maxAbs < 1e-12) return null; // 奇异
      if (pivot !== i) [a[i], a[pivot]] = [a[pivot], a[i]];
      // 归一化
      const inv = 1 / a[i][i];
      for (let j = 0; j < 2 * n; j++) a[i][j] *= inv;
      // 消元
      for (let k = 0; k < n; k++) {
        if (k === i) continue;
        const f = a[k][i];
        if (f === 0) continue;
        for (let j = i; j < 2 * n; j++) a[k][j] -= f * a[i][j];
      }
    }
    return a.map((row) => row.slice(n));
  }

  /** 矩阵 × 向量 */
  matVec(m: number[][], v: number[]): number[] {
    const out = new Array(m.length).fill(0);
    for (let i = 0; i < m.length; i++) {
      let s = 0;
      for (let j = 0; j < v.length; j++) s += m[i][j] * v[j];
      out[i] = s;
    }
    return out;
  }

  /** 点积 */
  dot(a: number[], b: number[]): number {
    let s = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) s += a[i] * b[i];
    return s;
  }

  /** w^T Σ w */
  quadForm(w: number[], m: number[][]): number {
    const v = this.matVec(m, w);
    return this.dot(w, v);
  }

  /** 归一化（非负 → sum=1） */
  normalize(w: number[]): number[] {
    let pos = 0;
    for (const v of w) if (v > 0) pos += v;
    if (pos === 0) {
      // 全为非正 → 等权
      return w.map(() => 1 / Math.max(1, w.length));
    }
    return w.map((v) => Math.max(0, v) / pos);
  }

  /** 应用约束（min/max） */
  applyConstraints(
    w: number[],
    constraints: AllocationConstraints,
  ): number[] {
    const min = constraints.minWeight ?? 0;
    const max = constraints.maxWeight ?? 1;
    let out = w.map((v) => Math.min(max, Math.max(min, v)));
    // 重新归一化
    const sum = out.reduce((s, v) => s + v, 0);
    if (sum > 0) out = out.map((v) => v / sum);
    return out;
  }

  /** 把权重数组转换为 AllocationTarget 列表 */
  toTargets(symbols: string[], weights: number[]): AllocationTarget[] {
    return weights.map((w, i) => ({
      symbol: symbols[i] ?? `asset_${i}`,
      assetClass: 'spot',
      targetWeight: w.toString(),
      minWeight: '0',
      maxWeight: '1',
    }));
  }
}

/**
 * 工厂
 */
export function createAllocationEngine(): AllocationEngine {
  return new AllocationEngine();
}
