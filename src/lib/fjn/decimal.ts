/**
 * FJN Decimal 工具
 *
 * 严格遵循 H14 规范：
 *  - 所有金额/积分/Token/算力统一用 Decimal(36, 18)
 *  - 禁止使用 float / double
 *  - 法币展示保留 2 位（但 DB 永远存 18 位）
 *  - 不允许 JS 浮点误差
 *
 * 用法：
 *   import { FjnDecimal, decimalMul } from '@/lib/fjn';
 *   const half = FjnDecimal.mul('100', '0.5'); // '50.0'
 *   const split = FjnDecimal.div('369', '3', 18); // '123.000000000000000000'
 */

import Decimal from 'decimal.js';

// 全局 Decimal 配置（与 H14 libs/decimal 一致）
Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_EVEN,  // 银行家舍入
  toExpNeg: -30,
  toExpPos: 30,
});

/** 统一精度：18 位 */
export const FJN_DECIMAL_PRECISION = 18;

/** 通用零 */
export const decimalZero = (): Decimal => new Decimal(0);

/** 100 */
export const decimalHundred = (): Decimal => new Decimal(100);

/** 安全构造 */
function d(v: string | number | Decimal | null | undefined): Decimal {
  if (v === null || v === undefined) return new Decimal(0);
  if (v instanceof Decimal) return v;
  return new Decimal(v.toString());
}

// ============================================================
// 基础算术（类型安全 + 链式）
// ============================================================

export const FjnDecimal = {
  /** 加 */
  add: (a: string | number | Decimal, b: string | number | Decimal): Decimal => d(a).plus(d(b)),
  /** 减 */
  sub: (a: string | number | Decimal, b: string | number | Decimal): Decimal => d(a).minus(d(b)),
  /** 乘 */
  mul: (a: string | number | Decimal, b: string | number | Decimal): Decimal => d(a).times(d(b)),
  /** 除（带精度） */
  div: (a: string | number | Decimal, b: string | number | Decimal, precision: number = FJN_DECIMAL_PRECISION): Decimal =>
    d(a).dividedBy(d(b)).toDecimalPlaces(precision, Decimal.ROUND_HALF_EVEN),
  /** 取小 */
  min: (...args: (string | number | Decimal)[]): Decimal => Decimal.min(...args.map(d)),
  /** 取大 */
  max: (...args: (string | number | Decimal)[]): Decimal => Decimal.max(...args.map(d)),
  /** 求和 */
  sum: (arr: (string | number | Decimal)[]): Decimal => arr.reduce<Decimal>((acc, v) => acc.plus(d(v)), new Decimal(0)),
  /** 绝对值 */
  abs: (a: string | number | Decimal): Decimal => d(a).abs(),
  /** 取负 */
  neg: (a: string | number | Decimal): Decimal => d(a).neg(),
  /** 幂 */
  pow: (a: string | number | Decimal, n: number): Decimal => d(a).pow(n),
  /** 四舍五入到指定精度 */
  round: (a: string | number | Decimal, precision: number = FJN_DECIMAL_PRECISION): Decimal =>
    d(a).toDecimalPlaces(precision, Decimal.ROUND_HALF_EVEN),
  /** 截断到指定精度 */
  trunc: (a: string | number | Decimal, precision: number = FJN_DECIMAL_PRECISION): Decimal =>
    d(a).toDecimalPlaces(precision, Decimal.ROUND_DOWN),
  /** 转字符串（fixed 18） */
  toFixed: (a: string | number | Decimal, precision: number = FJN_DECIMAL_PRECISION): string =>
    d(a).toFixed(precision),
  /** 转字符串（去除尾随零） */
  toString: (a: string | number | Decimal): string => d(a).toString(),
  /** 转 Number（仅用于展示，不可参与计算） */
  toNumber: (a: string | number | Decimal): number => d(a).toNumber(),
  /** 比较：相等 */
  eq: (a: string | number | Decimal, b: string | number | Decimal): boolean => d(a).eq(d(b)),
  /** 比较：大于 */
  gt: (a: string | number | Decimal, b: string | number | Decimal): boolean => d(a).gt(d(b)),
  /** 比较：大于等于 */
  gte: (a: string | number | Decimal, b: string | number | Decimal): boolean => d(a).gte(d(b)),
  /** 比较：小于 */
  lt: (a: string | number | Decimal, b: string | number | Decimal): boolean => d(a).lt(d(b)),
  /** 比较：小于等于 */
  lte: (a: string | number | Decimal, b: string | number | Decimal): boolean => d(a).lte(d(b)),
  /** 是否为零 */
  isZero: (a: string | number | Decimal): boolean => d(a).isZero(),
  /** 是否为正 */
  isPositive: (a: string | number | Decimal): boolean => d(a).isPositive() && !d(a).isZero(),
  /** 是否为负 */
  isNegative: (a: string | number | Decimal): boolean => d(a).isNegative(),
  /** 百分比转小数：'10%' -> 0.1 */
  fromPercent: (percent: string | number): Decimal => d(percent).dividedBy(100),
  /** 小数转百分比：0.1 -> '10.000000000000000000' */
  toPercent: (ratio: string | number | Decimal, precision: number = FJN_DECIMAL_PRECISION): string =>
    d(ratio).times(100).toFixed(precision),
  /** 校验字符串是否为有效 Decimal */
  isValid: (v: unknown): boolean => {
    if (v === null || v === undefined) return false;
    try {
      new Decimal(v as Decimal.Value);
      return true;
    } catch {
      return false;
    }
  },
  /** 构造 */
  of: (v: string | number | Decimal | null | undefined): Decimal => d(v),
};

// ============================================================
// 函数式快捷方式（与 H14 libs/decimal 风格一致）
// ============================================================

export const decimalAdd = FjnDecimal.add;
export const decimalSub = FjnDecimal.sub;
export const decimalMul = FjnDecimal.mul;
export const decimalDiv = FjnDecimal.div;
export const decimalMin = FjnDecimal.min;
export const decimalMax = FjnDecimal.max;
export const decimalSum = FjnDecimal.sum;
export const decimalAbs = FjnDecimal.abs;
export const decimalRound = FjnDecimal.round;
export const decimalTrunc = FjnDecimal.trunc;
export const decimalEq = FjnDecimal.eq;
export const decimalGt = FjnDecimal.gt;
export const decimalGte = FjnDecimal.gte;
export const decimalLt = FjnDecimal.lt;
export const decimalLte = FjnDecimal.lte;
export const decimalIsZero = FjnDecimal.isZero;
export const decimalIsPositive = FjnDecimal.isPositive;
export const decimalIsNegative = FjnDecimal.isNegative;
export const decimalFromPercent = FjnDecimal.fromPercent;
export const decimalToPercent = FjnDecimal.toPercent;
export const decimalToFixed = FjnDecimal.toFixed;
export const decimalToString = FjnDecimal.toString;
export const decimalToNumber = FjnDecimal.toNumber;
export const decimalIsValid = FjnDecimal.isValid;

// ============================================================
// 业务专用计算器
// ============================================================

/** 369 经典款分账计算（H6 标准 40/30/30） */
export interface Wine369RevenueResult {
  paidAmount: string;
  taxAmount: string;
  netAmount: string;
  wineCostPool: string;
  marketEcosystemPool: string;
  companyPool: string;
  currency: string;
  ruleVersion: string;
}

export function calculateWine369Revenue(params: {
  paidAmount: string;
  taxAmount?: string;
  currency: string;
  ruleVersion: string;
}): Wine369RevenueResult {
  const taxAmount = params.taxAmount ?? '0';
  const netAmount = FjnDecimal.sub(params.paidAmount, taxAmount);

  return {
    paidAmount: FjnDecimal.toFixed(params.paidAmount),
    taxAmount: FjnDecimal.toFixed(taxAmount),
    netAmount: FjnDecimal.toFixed(netAmount),
    wineCostPool: FjnDecimal.toFixed(FjnDecimal.mul(netAmount, '0.40')),
    marketEcosystemPool: FjnDecimal.toFixed(FjnDecimal.mul(netAmount, '0.30')),
    companyPool: FjnDecimal.toFixed(FjnDecimal.mul(netAmount, '0.30')),
    currency: params.currency,
    ruleVersion: params.ruleVersion,
  };
}

/** 推荐奖励计算（10% L1） */
export function calculateReferralReward(params: {
  paidAmount: string;
  ratio?: string;
  taxAmount?: string;
}): { reward: string; taxWithheld: string; net: string } {
  const ratio = params.ratio ?? '0.10';
  const taxAmount = params.taxAmount ?? '0';
  const base = FjnDecimal.sub(params.paidAmount, taxAmount);
  const reward = FjnDecimal.mul(base, ratio);
  const taxWithheld = FjnDecimal.mul(reward, '0');  // 推荐奖励暂不预扣税
  const net = FjnDecimal.sub(reward, taxWithheld);
  return {
    reward: FjnDecimal.toFixed(reward),
    taxWithheld: FjnDecimal.toFixed(taxWithheld),
    net: FjnDecimal.toFixed(net),
  };
}

/** 团队奖励计算（5/3/2） */
export function calculateTeamRewards(paidAmount: string): { l1: string; l2: string; l3: string } {
  return {
    l1: FjnDecimal.toFixed(FjnDecimal.mul(paidAmount, '0.05')),
    l2: FjnDecimal.toFixed(FjnDecimal.mul(paidAmount, '0.03')),
    l3: FjnDecimal.toFixed(FjnDecimal.mul(paidAmount, '0.02')),
  };
}

/** 节点奖励计算（3/3/2/2） */
export function calculateNodeRewards(paidAmount: string): { city: string; region: string; country: string; global: string } {
  return {
    city: FjnDecimal.toFixed(FjnDecimal.mul(paidAmount, '0.03')),
    region: FjnDecimal.toFixed(FjnDecimal.mul(paidAmount, '0.03')),
    country: FjnDecimal.toFixed(FjnDecimal.mul(paidAmount, '0.02')),
    global: FjnDecimal.toFixed(FjnDecimal.mul(paidAmount, '0.02')),
  };
}

/** cFJ369 -> tFJ369 转换（含 30% 销毁 + 5% 手续费） */
export function calculateTPointsConversion(params: {
  cfj369Amount: string;
  conversionRatio?: string;   // 默认 1:0.5
  burnRate?: string;          // 默认 30%
  feeRate?: string;           // 默认 5%
}): {
  tFJ369Gross: string;
  burnAmount: string;
  feeAmount: string;
  tFJ369Net: string;
  ratio: string;
  burnRate: string;
  feeRate: string;
} {
  const ratio = params.conversionRatio ?? '0.5';
  const burnRate = params.burnRate ?? '0.30';
  const feeRate = params.feeRate ?? '0.05';

  const gross = FjnDecimal.mul(params.cfj369Amount, ratio);
  const burn = FjnDecimal.mul(gross, burnRate);
  const fee = FjnDecimal.mul(gross, feeRate);
  const net = FjnDecimal.sub(FjnDecimal.sub(gross, burn), fee);

  return {
    tFJ369Gross: FjnDecimal.toFixed(gross),
    burnAmount: FjnDecimal.toFixed(burn),
    feeAmount: FjnDecimal.toFixed(fee),
    tFJ369Net: FjnDecimal.toFixed(net),
    ratio,
    burnRate,
    feeRate,
  };
}

// 在文件末尾追加业务计算函数的导出
export {
  // 已经在上面 export 函数了，但为了清晰，这里再次确认
};
