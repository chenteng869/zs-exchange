/**
 * Black-Scholes-Merton (BSM) 期权定价引擎
 *
 * 公式（无股息版，连续复利）：
 *   d1 = ( ln(S/K) + (r + σ²/2)·T ) / (σ·√T)
 *   d2 = d1 - σ·√T
 *   Call = S·N(d1) - K·e^(-rT)·N(d2)
 *   Put  = K·e^(-rT)·N(-d2) - S·N(-d1)
 *
 * 隐含波动率用 Newton-Raphson 反推：
 *   σ_{n+1} = σ_n - (BSM(σ_n) - marketPrice) / vega(σ_n)
 *
 * 所有数学函数自实现，不引外部依赖。
 */

import type { BSMInputs, Greeks, OptionType } from './types';

// =============================================================================
// 基础数学函数（自实现）
// =============================================================================

/**
 * 误差函数 erf(x)
 * 来自 Abramowitz & Stegun 7.1.26 多项式近似
 *   erf(x) ≈ 1 - (a1·t + a2·t² + a3·t³ + a4·t⁴ + a5·t⁵) · e^(-x²)
 *   t = 1 / (1 + p·x)
 * 最大误差 |ε| < 1.5e-7
 */
export function erf(x: number): number {
  if (!Number.isFinite(x)) return x > 0 ? 1 : -1;
  // 利用奇函数性质 erf(-x) = -erf(x)
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

/**
 * 标准正态分布 CDF:  N(x) = 0.5 · (1 + erf(x / √2))
 */
export function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

/**
 * 标准正态分布 PDF:  φ(x) = e^(-x²/2) / √(2π)
 */
export function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// =============================================================================
// 内部：BSM 内部计算
// =============================================================================

interface BSMInternal {
  d1: number;
  d2: number;
  Nd1: number;
  Nd2: number;
  Nmd1: number;       // N(-d1)
  Nmd2: number;       // N(-d2)
  nd1: number;        // φ(d1)
  nd2: number;        // φ(d2)
  sqrtT: number;
  drift: number;      // e^(-rT)
  q: number;          // dividend yield
}

function computeInternals(inputs: BSMInputs): BSMInternal {
  const { spot, strike, timeToExpiry, riskFreeRate, volatility, dividendYield = 0 } = inputs;

  if (timeToExpiry <= 0) {
    return {
      d1: 0, d2: 0,
      Nd1: 0, Nd2: 0, Nmd1: 0, Nmd2: 0,
      nd1: 0, nd2: 0,
      sqrtT: 0,
      drift: 1, q: 0,
    };
  }
  if (volatility <= 0 || spot <= 0 || strike <= 0) {
    throw new Error('[BSM] volatility, spot, strike must be > 0');
  }

  const sqrtT = Math.sqrt(timeToExpiry);
  const d1 = (Math.log(spot / strike) + (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToExpiry)
    / (volatility * sqrtT);
  const d2 = d1 - volatility * sqrtT;
  const drift = Math.exp(-riskFreeRate * timeToExpiry);

  return {
    d1, d2,
    Nd1: normalCDF(d1),
    Nd2: normalCDF(d2),
    Nmd1: normalCDF(-d1),
    Nmd2: normalCDF(-d2),
    nd1: normalPDF(d1),
    nd2: normalPDF(d2),
    sqrtT,
    drift,
    q: dividendYield,
  };
}

// =============================================================================
// BlackScholes 主类
// =============================================================================

export class BlackScholes {
  /**
   * 计算期权理论价格
   */
  price(inputs: BSMInputs, type: OptionType): number {
    const { spot, strike, timeToExpiry } = inputs;
    const m = computeInternals(inputs);

    if (timeToExpiry <= 0) {
      // 到期后 = 内含价值
      if (type === 'call') return Math.max(spot - strike, 0);
      return Math.max(strike - spot, 0);
    }

    if (type === 'call') {
      return spot * Math.exp(-m.q * timeToExpiry) * m.Nd1 - strike * m.drift * m.Nd2;
    }
    return strike * m.drift * m.Nmd2 - spot * Math.exp(-m.q * timeToExpiry) * m.Nmd1;
  }

  /**
   * 计算 Greeks
   */
  greeks(inputs: BSMInputs, type: OptionType): Greeks {
    const { spot, strike, timeToExpiry, riskFreeRate, volatility, dividendYield = 0 } = inputs;
    const m = computeInternals(inputs);
    const expQ = Math.exp(-m.q * timeToExpiry);

    if (timeToExpiry <= 0) {
      // 到期时 Delta 是 0/1，Gamma/Vega 等均 0
      if (type === 'call') {
        return { delta: spot > strike ? 1 : 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
      }
      return { delta: spot < strike ? -1 : 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
    }

    // Gamma / Vega 对 call/put 相同
    const gamma = (expQ * m.nd1) / (spot * volatility * m.sqrtT);
    const vega = spot * expQ * m.nd1 * m.sqrtT * 0.01;   // 每 1% vol

    if (type === 'call') {
      const delta = expQ * m.Nd1;
      // theta 是按"日"返回：dPrice/dTime × (1/365)
      const theta =
        (-(spot * expQ * m.nd1 * volatility) / (2 * m.sqrtT)
          - riskFreeRate * strike * m.drift * m.Nd2
          + m.q * spot * expQ * m.Nd1) / 365;
      const rho = (strike * timeToExpiry * m.drift * m.Nd2) * 0.01;   // 每 1%
      return { delta, gamma, theta, vega, rho };
    }

    // Put
    const delta = -expQ * m.Nmd1;
    const theta =
      (-(spot * expQ * m.nd1 * volatility) / (2 * m.sqrtT)
        + riskFreeRate * strike * m.drift * m.Nmd2
        - m.q * spot * expQ * m.Nmd1) / 365;
    const rho = (-strike * timeToExpiry * m.drift * m.Nmd2) * 0.01;
    return { delta, gamma, theta, vega, rho };
  }

  /**
   * 反推隐含波动率（Newton-Raphson）
   * 若不收敛则回退到二分法
   */
  impliedVolatility(
    marketPrice: number,
    inputs: Omit<BSMInputs, 'volatility'>,
    type: OptionType,
    precision = 0.0001,
    maxIter = 100,
  ): number {
    if (marketPrice <= 0) return 0;

    // Newton-Raphson 起点 σ0 = √(2π/T) · (C - 0.5·(S - K·e^-rT))
    // 简化：使用 0.3 作为初值
    let sigma = 0.3;
    let lower = 1e-6;
    let upper = 5.0;

    for (let i = 0; i < maxIter; i++) {
      const p = this.price({ ...inputs, volatility: sigma }, type);
      const v = this.greeks({ ...inputs, volatility: sigma }, type).vega;
      // vega 返回"每 1% vol"的值
      const vegaAbs = v / 0.01 || 1e-8;
      const diff = p - marketPrice;
      if (Math.abs(diff) < precision) {
        return sigma;
      }
      const newSigma = sigma - diff / vegaAbs;
      // 保证在 [lower, upper] 区间
      if (newSigma < lower) {
        // 走二分
        sigma = (sigma + lower) / 2;
      } else if (newSigma > upper) {
        sigma = (sigma + upper) / 2;
      } else {
        sigma = newSigma;
      }
      if (newSigma < lower) lower = newSigma;
      if (newSigma > upper) upper = newSigma;
    }
    // 未收敛，返回最近一次
    return sigma;
  }

  /**
   * Put-Call Parity 校验
   *   C - P = S - K·e^(-rT)        (无股息)
   *   C - P = S·e^(-qT) - K·e^(-rT) (有股息)
   */
  putCallParityCheck(
    callPrice: number,
    putPrice: number,
    inputs: BSMInputs,
  ): { valid: boolean; deviation: number; expected: number } {
    const { spot, strike, timeToExpiry, riskFreeRate, dividendYield = 0 } = inputs;
    const expQ = Math.exp(-dividendYield * timeToExpiry);
    const expR = Math.exp(-riskFreeRate * timeToExpiry);
    const expected = spot * expQ - strike * expR;
    const deviation = callPrice - putPrice - expected;
    return { valid: Math.abs(deviation) < 0.01, deviation, expected };
  }
}
