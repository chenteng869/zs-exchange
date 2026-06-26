/**
 * PriceAggregator - 多链价格聚合器
 *
 * 职责：
 *  - 跨多链查询同一交易对（ETH/USD 在 ETH/BSC/Polygon/... 都有 feed）
 *  - 计算 median / mean / min / max
 *  - 异常值检测（>5% 偏离 median 视为异常，剔除）
 *  - 与本地价格对比
 *  - 给出"可信价格" + confidence 评分
 *
 * 重要：所有价格比较都使用 bigint 字符串运算（避免浮点精度丢失）。
 */

import { ChainlinkClient } from './chainlink-client';
import { getFeedByPair, getFeedsByChain } from './feed-registry';
import {
  ORACLE_DEVIATION_THRESHOLD,
  type AggregatedPrice,
  type OracleChain,
  type PriceData,
} from './types';

// =============================================================================
// 字符串数字工具（无外部依赖）
// =============================================================================

/** 字符串数字（可能含小数）→ 元组 [整数, 小数] */
function splitNum(s: string): { int: bigint; frac: bigint; fracLen: number; neg: boolean } {
  const neg = s.startsWith('-');
  const abs = neg ? s.slice(1) : s;
  const [intPart, fracPart = ''] = abs.split('.');
  const int = BigInt(intPart || '0');
  const frac = BigInt(fracPart || '0');
  return { int, frac, fracLen: fracPart.length, neg };
}

/** 把 split 结果对齐为统一精度的 bigint（默认 8 位小数） */
function toScaledBigInt(s: string, scale: number = 8): bigint {
  const { int, frac, fracLen, neg } = splitNum(s);
  let fracScaled: bigint;
  if (fracLen >= scale) {
    fracScaled = frac / 10n ** BigInt(fracLen - scale);
  } else {
    fracScaled = frac * 10n ** BigInt(scale - fracLen);
  }
  const v = int * 10n ** BigInt(scale) + fracScaled;
  return neg ? -v : v;
}

/** scaled bigint → 字符串（保留指定小数位） */
function fromScaledBigInt(v: bigint, scale: number = 8, displayScale: number = 6): string {
  if (v === 0n) return '0';
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const divisor = 10n ** BigInt(scale);
  const whole = abs / divisor;
  const frac = abs % divisor;
  if (frac === 0n) return (neg ? '-' : '') + whole.toString();
  let fracStr = frac.toString().padStart(scale, '0');
  // 截断到 displayScale
  if (displayScale < scale) {
    fracStr = fracStr.slice(0, displayScale);
  }
  // 去掉尾随 0
  fracStr = fracStr.replace(/0+$/, '');
  return (neg ? '-' : '') + (fracStr ? `${whole.toString()}.${fracStr}` : whole.toString());
}

/** 字符串数字相减：a - b */
function subStr(a: string, b: string): string {
  return fromScaledBigInt(toScaledBigInt(a) - toScaledBigInt(b));
}

/** 字符串数字相加：a + b */
function addStr(a: string, b: string): string {
  return fromScaledBigInt(toScaledBigInt(a) + toScaledBigInt(b));
}

/** 字符串数字除以 bigint */
function divStrByInt(a: string, n: bigint, displayScale: number = 8): string {
  if (n === 0n) return '0';
  return fromScaledBigInt(toScaledBigInt(a) / n, 8, displayScale);
}

/** 取绝对值（字符串数字） */
function absStr(a: string): string {
  return a.startsWith('-') ? a.slice(1) : a;
}

/** 比较两个字符串数字（正数） */
function compareStr(a: string, b: string): number {
  const sa = splitNum(a);
  const sb = splitNum(b);
  if (sa.int > sb.int) return 1;
  if (sa.int < sb.int) return -1;
  // 整数相同，比较小数
  const maxLen = Math.max(sa.fracLen, sb.fracLen);
  const fa = sa.frac * 10n ** BigInt(maxLen - sa.fracLen);
  const fb = sb.frac * 10n ** BigInt(maxLen - sb.fracLen);
  if (fa > fb) return 1;
  if (fa < fb) return -1;
  return 0;
}

// =============================================================================
// PriceAggregator
// =============================================================================

export interface PriceAggregatorOptions {
  /** ChainlinkClient 实例（默认创建新实例） */
  client?: ChainlinkClient;
  /** 偏离报警阈值（默认 5%） */
  deviationThreshold?: number;
  /** 异常值剔除阈值（默认 5%，> 此偏离 median 即视为异常） */
  outlierThreshold?: number;
}

export class PriceAggregator {
  private readonly client: ChainlinkClient;
  private readonly deviationThreshold: number;
  private readonly outlierThreshold: number;

  constructor(opts: PriceAggregatorOptions = {}) {
    this.client = opts.client || new ChainlinkClient();
    this.deviationThreshold = opts.deviationThreshold ?? ORACLE_DEVIATION_THRESHOLD;
    this.outlierThreshold = opts.outlierThreshold ?? ORACLE_DEVIATION_THRESHOLD;
  }

  /** 获取底层 client（供 OracleService 复用） */
  getClient(): ChainlinkClient {
    return this.client;
  }

  /**
   * 跨多链查询同一交易对并聚合。
   * - chains 省略时自动查找所有链上同 pair 的 feed
   * - 任一源失败不中断整体（被剔除视为 outlier）
   */
  async aggregatePrice(pair: string, chains?: OracleChain[]): Promise<AggregatedPrice> {
    if (!pair) throw new Error('pair is required');

    // 1. 解析所有可用 feed
    const feeds = this.resolveFeeds(pair, chains);
    if (feeds.length === 0) {
      throw new Error(`No feeds found for pair: ${pair}`);
    }

    // 2. 并行查询所有链
    const tasks = feeds.map(f => this.client.getLatestPrice(f).catch(() => null));
    const results = (await Promise.all(tasks)).filter((r): r is PriceData => r !== null);

    if (results.length === 0) {
      throw new Error(`All feeds failed for pair: ${pair}`);
    }

    // 3. 计算中位数
    const sorted = results.slice().sort((a, b) => compareStr(a.formatted, b.formatted));
    const medianRaw = this.median(sorted.map(r => r.formatted));

    // 4. 剔除异常（> outlierThreshold 偏离 median）
    const filtered = results.filter(r => {
      const dev = this.computeDeviation(r.formatted, medianRaw);
      return dev <= this.outlierThreshold;
    });

    // 5. 重新计算（如果剔除导致剩余 < 2 个，回退到原始数据）
    const finalList = filtered.length >= 1 ? filtered : results;
    const finalSorted = finalList.slice().sort((a, b) => compareStr(a.formatted, b.formatted));
    const median = this.median(finalSorted.map(r => r.formatted));
    const mean = divStrByInt(
      finalSorted.reduce((acc, r) => addStr(acc, r.formatted), '0'),
      BigInt(finalSorted.length),
      8,
    );
    const min = finalSorted[0].formatted;
    const max = finalSorted[finalSorted.length - 1].formatted;
    const deviation = this.computeDeviation(max, min);

    return {
      pair,
      sources: finalSorted.map(r => ({
        chain: r.chain,
        price: r.formatted,
        updatedAt: r.updatedAt,
      })),
      median,
      mean,
      min,
      max,
      deviation,
      timestamp: Date.now(),
    };
  }

  /**
   * 获取可信价格（3+ 链 + confidence 评分）
   */
  async getTrustedPrice(pair: string): Promise<{
    price: string;
    sources: AggregatedPrice['sources'];
    confidence: number;
  } | null> {
    const allChains = this.resolveFeeds(pair).map(f => f.chain);
    if (allChains.length < 3) {
      // 不足 3 链时退而求其次
      const single = await this.aggregatePrice(pair, allChains).catch(() => null);
      if (!single) return null;
      return {
        price: single.median,
        sources: single.sources,
        confidence: this.confidenceFromDeviation(single.deviation),
      };
    }
    const aggregated = await this.aggregatePrice(pair, allChains);
    return {
      price: aggregated.median,
      sources: aggregated.sources,
      confidence: this.confidenceFromDeviation(aggregated.deviation),
    };
  }

  /**
   * 与本地价格对比
   */
  comparePrices(
    localPrice: string,
    onchainPrice: string,
    pair: string = 'unknown',
  ): { pair: string; localPrice: string; onchainPrice: string; deviation: number; isReasonable: boolean } {
    const deviation = this.computeDeviation(localPrice, onchainPrice);
    return {
      pair,
      localPrice,
      onchainPrice,
      deviation,
      isReasonable: deviation <= this.deviationThreshold,
    };
  }

  // -------------------------------------------------------------------------
  // 内部工具
  // -------------------------------------------------------------------------

  /** 解析指定 pair + chains 下的所有 feed */
  private resolveFeeds(pair: string, chains?: OracleChain[]) {
    if (chains && chains.length > 0) {
      return chains
        .map(c => getFeedByPair(pair, c))
        .filter((f): f is NonNullable<typeof f> => !!f);
    }
    // 全部链
    const allChains: OracleChain[] = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'base'];
    const feeds: ReturnType<typeof getFeedByPair>[] = [];
    for (const c of allChains) {
      const f = getFeedByPair(pair, c);
      if (f) feeds.push(f);
    }
    return feeds.filter((f): f is NonNullable<typeof f> => !!f);
  }

  /** 中位数（字符串数组） */
  private median(values: string[]): string {
    if (values.length === 0) return '0';
    const sorted = values.slice().sort((a, b) => compareStr(a, b));
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) {
      return sorted[mid];
    }
    // 偶数个：取两数平均
    const a = sorted[mid - 1];
    const b = sorted[mid];
    return divStrByInt(addStr(a, b), 2n, 8);
  }

  /** 偏离度：|a - b| / max(|a|, |b|) */
  private computeDeviation(a: string, b: string): number {
    const sa = toScaledBigInt(a);
    const sb = toScaledBigInt(b);
    if (sa === 0n && sb === 0n) return 0;
    const max = absStr(compareStr(a, b) >= 0 ? a : b);
    if (max === '0') return 0;
    const diff = absStr(subStr(a, b));
    const devScaled = (toScaledBigInt(diff) * 10000n) / toScaledBigInt(max); // 万分之一精度
    return Number(devScaled) / 10000; // 转 0~1
  }

  /** 偏离度 → confidence (0~1) */
  private confidenceFromDeviation(deviation: number): number {
    // deviation = 0 → 1, deviation = 0.05 → 0, deviation > 0.05 → 负
    const c = 1 - deviation / this.outlierThreshold;
    return Math.max(0, Math.min(1, c));
  }
}

// =============================================================================
// 工厂函数
// =============================================================================

export function createPriceAggregator(opts?: PriceAggregatorOptions): PriceAggregator {
  return new PriceAggregator(opts);
}
