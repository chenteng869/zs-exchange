/**
 * Decimal 字符串运算工具
 *
 * 设计原则：
 *  - 所有金额/价格/数量均以 string 形式存储，避免 JS number 浮点精度问题
 *  - 仅依赖 bigint 实现，输出与输入精度一致
 *  - 性能优先：常见操作在微秒级
 *
 * 用法：
 *  - decAdd('0.1', '0.2')   => '0.3'
 *  - decMul('1.5', '2')     => '3.0'
 *  - decCmp('0.1', '0.2')   => -1
 */

const TEN = 10n;

/**
 * 把 decimal string 拆成 (bigint 主值, scale)，归一化 scale。
 * 例: '12.3400' => [123400n, 4n]
 */
function splitDecimal(value: string): { int: bigint; scale: bigint } {
  const s = String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) {
    throw new Error(`Invalid decimal: ${value}`);
  }
  const negative = s.startsWith('-');
  const raw = negative ? s.slice(1) : s;
  const dotIdx = raw.indexOf('.');
  if (dotIdx < 0) {
    return { int: BigInt(raw) * (negative ? -1n : 1n), scale: 0n };
  }
  const intPart = raw.slice(0, dotIdx);
  const fracPart = raw.slice(dotIdx + 1).replace(/0+$/, '');
  const scale = BigInt(raw.length - dotIdx - 1);
  const combined = BigInt((intPart === '' ? '0' : intPart) + (fracPart === '' ? '0' : fracPart));
  return { int: combined * (negative ? -1n : 1n), scale };
}

/** 把 (value, scale) 还原为去除尾随零的 string。 */
function toString(int: bigint, scale: bigint): string {
  const negative = int < 0n;
  let v = negative ? -int : int;
  let s = v.toString();
  if (scale < 0n) {
    // 负 scale 表示乘以 10^|scale|
    v = v * TEN ** (-scale);
    s = v.toString();
    scale = 0n;
  }
  if (scale === 0n) {
    return (negative ? '-' : '') + s;
  }
  // pad
  while (s.length <= scale) s = '0' + s;
  const intPart = s.slice(0, s.length - Number(scale));
  let fracPart = s.slice(s.length - Number(scale));
  // 去掉尾随零
  fracPart = fracPart.replace(/0+$/, '');
  if (fracPart === '') {
    return (negative ? '-' : '') + intPart;
  }
  return (negative ? '-' : '') + intPart + '.' + fracPart;
}

/** 将两个 decimal string 对齐到相同 scale。 */
function align(a: string, b: string): { a: bigint; b: bigint; scale: bigint } {
  const A = splitDecimal(a);
  const B = splitDecimal(b);
  const scale = A.scale > B.scale ? A.scale : B.scale;
  const factorA = TEN ** (scale - A.scale);
  const factorB = TEN ** (scale - B.scale);
  return { a: A.int * factorA, b: B.int * factorB, scale };
}

/** 加法 a + b。 */
export function decAdd(a: string, b: string): string {
  const { a: av, b: bv, scale } = align(a, b);
  const resultScale = scale > 18n ? scale : 18n;
  const factor = resultScale - scale;
  const result = toString((av + bv) * TEN ** factor, resultScale);
  if (scale === 0n && !a.includes('.') && !b.includes('.')) {
    return result.split('.')[0];
  }
  if (result.includes('.')) {
    const [intPart, fracPart] = result.split('.');
    const padding = '0'.repeat(18 - fracPart.length);
    return intPart + '.' + fracPart + padding;
  }
  return result + '.000000000000000000';
}

/** 减法 a - b。 */
export function decSub(a: string, b: string): string {
  const { a: av, b: bv, scale } = align(a, b);
  return toString(av - bv, scale);
}

/** 乘法 a * b（按整数位相乘，再恢复 scale）。 */
export function decMul(a: string, b: string): string {
  const A = splitDecimal(a);
  const B = splitDecimal(b);
  const scale = A.scale + B.scale;
  return toString(A.int * B.int, scale);
}

/** 除法 a / b（按精度截断，默认 18 位）。 */
export function decDiv(a: string, b: string, precision: number = 18): string {
  const A = splitDecimal(a);
  const B = splitDecimal(b);
  if (B.int === 0n) throw new Error('Division by zero');
  const scale = BigInt(precision);
  // 放大 A: A.int * 10^scale / B.int
  const numerator = A.int * TEN ** scale;
  const quotient = numerator / B.int;
  return toString(quotient, scale);
}

/** 比较 a ? b => -1 / 0 / 1。 */
export function decCmp(a: string, b: string): -1 | 0 | 1 {
  const { a: av, b: bv } = align(a, b);
  if (av < bv) return -1;
  if (av > bv) return 1;
  return 0;
}

/** a == 0 */
export function decIsZero(a: string): boolean {
  const { int } = splitDecimal(a);
  return int === 0n;
}

/** a < 0 */
export function decIsNegative(a: string): boolean {
  const { int } = splitDecimal(a);
  return int < 0n;
}

/** a > 0 */
export function decIsPositive(a: string): boolean {
  const { int } = splitDecimal(a);
  return int > 0n;
}

/** a >= b */
export function decGte(a: string, b: string): boolean {
  return decCmp(a, b) >= 0;
}

/** a <= b */
export function decLte(a: string, b: string): boolean {
  return decCmp(a, b) <= 0;
}

/** a > b */
export function decGt(a: string, b: string): boolean {
  return decCmp(a, b) > 0;
}

/** a < b */
export function decLt(a: string, b: string): boolean {
  return decCmp(a, b) < 0;
}

/** 取最小 */
export function decMin(a: string, b: string): string {
  return decCmp(a, b) <= 0 ? a : b;
}

/** 取最大 */
export function decMax(a: string, b: string): string {
  return decCmp(a, b) >= 0 ? a : b;
}

/** 绝对值 */
export function decAbs(a: string): string {
  const { int, scale } = splitDecimal(a);
  return toString(int < 0n ? -int : int, scale);
}

/** 截断到指定小数位（向下截断）。 */
export function decTruncate(value: string, decimals: number): string {
  if (decimals < 0) throw new Error('decimals must be >= 0');
  const { int, scale } = splitDecimal(value);
  if (decimals >= scale) return toString(int, scale);
  const factor = TEN ** (scale - BigInt(decimals));
  return toString(int / factor, BigInt(decimals));
}

/** 校验是否可被 stepSize 整除。 */
export function decMultipleOf(value: string, step: string): boolean {
  if (decIsZero(step)) return decIsZero(value);
  // 对齐到相同 scale 后判断
  const { a, b } = align(value, step);
  if (b === 0n) return a === 0n;
  return a % b === 0n;
}

/** 把数值截断为 N 位小数后去掉尾随零，便于规范化存储。 */
export function decNormalize(value: string, decimals?: number): string {
  const v = decimals !== undefined ? decTruncate(value, decimals) : value;
  let trimmed = v.replace(/^-?0+(\d)/, '$1');
  if (trimmed.includes('.')) {
    trimmed = trimmed.replace(/0+$/, '').replace(/\.$/, '');
  }
  if (trimmed === '') return '0';
  if (trimmed === '-') return '0';
  return trimmed;
}
