/**
 * MarketCollector - 行情数据情绪化采集器（P3-3）
 *
 * 行情本身没有"文本"，但涨跌幅 / 量能 / 波动率 / 多空比 / 资金费率
 * 是市场情绪的最直接量化表达。
 *
 * 算法（合成一条 SourceSentiment）：
 *   score = clamp(
 *       0.30 * momentum(chgPct)        // 动量（涨跌幅）
 *     + 0.20 * volumeSignal(volChg)    // 量能变化
 *     + 0.15 * volatilitySignal(vol)   // 波动率（高=恐慌=负）
 *     + 0.20 * longShortSignal(lsRatio) // 多空比
 *     + 0.15 * fundingSignal(rate)     // 资金费率
 *   , -1, 1)
 *
 * 同时输出真实/虚拟的 TextItem[]，让市场数据也能进入 NLP 流水线（用于融合）。
 */

import type { SourceSentiment, TextItem } from '../types';
import { scoreToLabel } from '../nlp-engine';
import type { BinanceRestClient } from '../../market/binance-client';
import type { BinanceKlineRaw } from '../../market/binance-client';

// =============================================================================
// 配置
// =============================================================================

export interface MarketCollectorOptions {
  restClient?: BinanceRestClient;
  /** 自定义 fetch（仅在缺 restClient 时直接拉取） */
  fetchImpl?: typeof fetch;
  /** 是否在拉取失败时返回 mock（默认 true） */
  demoFallback?: boolean;
}

export interface MarketSnapshot {
  symbol: string;
  chgPct24h: number;          // 24h 涨跌幅 %
  volumeChangeRatio: number;   // 当前量 / 7d 均量（无量数据时为 1）
  volatility: number;          // 24h 波动率（绝对值）
  longShortRatio: number;      // 0-1（0.5 = 多空平衡）
  fundingRate: number;         // 资金费率（小数；0.0001 = 0.01%）
  price: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

// =============================================================================
// 工具
// =============================================================================

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

/** 把涨跌幅 % 映射到 [-1, 1] */
function momentumScore(chgPct: number): number {
  // ±10% 视为极强/极弱
  return clamp(chgPct / 10, -1, 1);
}

/** 量能变化比：1 = 均量；>1 放大 */
function volumeScore(ratio: number): number {
  if (ratio <= 0) return 0;
  // log 缩放；2x -> 0.5, 5x -> 0.85
  return clamp(Math.log2(ratio) / 3, -1, 1);
}

/** 波动率：0 平静 -> 1 极端 */
function volatilityScore(vol: number): number {
  // 0-100% 映射 0-1；高波动=负情绪
  const norm = clamp(vol / 50, 0, 1);
  return -norm; // 负号：高波动=恐慌=空头
}

/** 多空比（0-1）；0.5 中性 */
function longShortScore(ls: number): number {
  if (ls < 0 || ls > 1) return 0;
  return clamp((ls - 0.5) * 2, -1, 1);
}

/** 资金费率（一般 -0.003 ~ +0.003） */
function fundingScore(rate: number): number {
  // 正费率=多头付空头=偏多；负=偏空
  return clamp(rate / 0.005, -1, 1);
}

// =============================================================================
// MarketCollector
// =============================================================================

export class MarketCollector {
  private readonly restClient?: BinanceRestClient;
  private readonly fetchImpl?: typeof fetch;
  private readonly demoFallback: boolean;

  constructor(opts: MarketCollectorOptions = {}) {
    this.restClient = opts.restClient;
    this.fetchImpl = opts.fetchImpl;
    this.demoFallback = opts.demoFallback !== false;
  }

  // -------------------------------------------------------------------------
  // 公开 API
  // -------------------------------------------------------------------------

  /**
   * 收集某币种的行情情绪（含合成 TextItem 列表与 SourceSentiment）
   * @param symbol 交易对（BTC、ETH 或 BTCUSDT / BTC/USDT）
   * @param period 时段（用于历史量比较，默认 24h）
   */
  async collect(symbol: string, period: '1h' | '4h' | '24h' = '24h'): Promise<{
    snapshot: MarketSnapshot;
    textItems: TextItem[];
    sourceSentiment: SourceSentiment;
  }> {
    const snapshot = await this.fetchSnapshot(symbol, period);
    const score = this.scoreSnapshot(snapshot);
    const label = scoreToLabel(score);

    const textItems = this.snapshotToTextItems(snapshot, label);
    const sourceSentiment: SourceSentiment = {
      source: 'market',
      sampleSize: textItems.length,
      averageScore: score,
      averageConfidence: 0.8,
      distribution: this.distributionFromLabel(label, textItems.length),
      trend: snapshot.chgPct24h > 0.5 ? 'rising' : snapshot.chgPct24h < -0.5 ? 'falling' : 'stable',
      updatedAt: Date.now(),
    };

    return { snapshot, textItems, sourceSentiment };
  }

  /** 纯情绪（不给文本） */
  async collectSentimentOnly(symbol: string): Promise<SourceSentiment> {
    const r = await this.collect(symbol);
    return r.sourceSentiment;
  }

  // -------------------------------------------------------------------------
  // 同步版本（用于测试 / 注入）
  // -------------------------------------------------------------------------

  /** 同步计算 SourceSentiment（接收外部 snapshot） */
  computeFromSnapshot(snapshot: MarketSnapshot): SourceSentiment {
    const score = this.scoreSnapshot(snapshot);
    const label = scoreToLabel(score);
    return {
      source: 'market',
      sampleSize: 1,
      averageScore: score,
      averageConfidence: 0.8,
      distribution: this.distributionFromLabel(label, 1),
      trend: snapshot.chgPct24h > 0.5 ? 'rising' : snapshot.chgPct24h < -0.5 ? 'falling' : 'stable',
      updatedAt: Date.now(),
    };
  }

  // -------------------------------------------------------------------------
  // 评分
  // -------------------------------------------------------------------------

  scoreSnapshot(s: MarketSnapshot): number {
    const s1 = momentumScore(s.chgPct24h);
    const s2 = volumeScore(s.volumeChangeRatio);
    const s3 = volatilityScore(s.volatility);
    const s4 = longShortScore(s.longShortRatio);
    const s5 = fundingScore(s.fundingRate);
    const composite = 0.30 * s1 + 0.20 * s2 + 0.15 * s3 + 0.20 * s4 + 0.15 * s5;
    return clamp(composite, -1, 1);
  }

  // -------------------------------------------------------------------------
  // 数据获取
  // -------------------------------------------------------------------------

  private async fetchSnapshot(symbol: string, period: '1h' | '4h' | '24h'): Promise<MarketSnapshot> {
    const sym = this.toBinanceSymbol(symbol);
    try {
      if (this.restClient) {
        return await this.snapshotFromClient(sym, period);
      }
      if (this.fetchImpl) {
        return await this.snapshotFromFetch(sym, period, this.fetchImpl);
      }
      throw new Error('No data source');
    } catch {
      if (this.demoFallback) {
        return this.mockSnapshot(sym, period);
      }
      throw new Error('Market data fetch failed and demoFallback is disabled');
    }
  }

  private toBinanceSymbol(s: string): string {
    if (s.includes('/')) {
      return s.replace('/', '').toUpperCase();
    }
    if (s.endsWith('USDT')) return s.toUpperCase();
    return `${s.toUpperCase()}USDT`;
  }

  private async snapshotFromClient(symbol: string, _period: '1h' | '4h' | '24h'): Promise<MarketSnapshot> {
    const client = this.restClient!;
    const ticker = await client.get24hTicker(symbol);
    const klines: BinanceKlineRaw[] = await client.getKlines(symbol, '1h', { limit: 168 });
    return this.buildSnapshot(symbol, ticker, klines);
  }

  private async snapshotFromFetch(symbol: string, period: '1h' | '4h' | '24h', fetchImpl: typeof fetch): Promise<MarketSnapshot> {
    const tUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
    const kUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=168`;
    const [tRes, kRes] = await Promise.all([fetchImpl(tUrl), fetchImpl(kUrl)]);
    if (!tRes.ok) throw new Error('Binance 24h failed');
    const ticker = await tRes.json();
    const klines: BinanceKlineRaw[] = kRes.ok ? await kRes.json() : [];
    return this.buildSnapshot(symbol, ticker, klines, period);
  }

  private buildSnapshot(
    symbol: string,
    ticker: any,
    klines: BinanceKlineRaw[],
    _period: '1h' | '4h' | '24h' = '24h',
  ): MarketSnapshot {
    const lastPrice = parseFloat(ticker.lastPrice);
    const openPrice = parseFloat(ticker.openPrice);
    const high = parseFloat(ticker.highPrice);
    const low = parseFloat(ticker.lowPrice);
    const vol = parseFloat(ticker.volume);
    const chgPct = parseFloat(ticker.priceChangePercent);

    // 量能变化：当前 24h 量 vs 7d 均量
    let avgVol = 0;
    if (klines.length > 0) {
      const sum = klines.reduce((s, k) => s + parseFloat(k[5]), 0);
      avgVol = sum / klines.length;
    }
    const volumeChangeRatio = avgVol > 0 ? vol / Math.max(avgVol, 1) : 1;

    // 波动率 = (high-low)/open * 100 %
    const volatility = openPrice > 0 ? ((high - low) / openPrice) * 100 : 0;

    // 多空比 / 资金费率：默认中性（无衍生品源时）
    const longShortRatio = 0.5;
    const fundingRate = 0;

    return {
      symbol,
      chgPct24h: chgPct,
      volumeChangeRatio,
      volatility,
      longShortRatio,
      fundingRate,
      price: lastPrice,
      volume24h: vol,
      high24h: high,
      low24h: low,
    };
  }

  private mockSnapshot(symbol: string, period: '1h' | '4h' | '24h'): MarketSnapshot {
    // 演示：基于 symbol 字符串哈希产生可重复的伪随机
    const seed = [...symbol].reduce((a, c) => a + c.charCodeAt(0), 0);
    const r = (i: number) => ((Math.sin(seed + i) + 1) / 2);
    const chg = (r(1) - 0.5) * 12; // -6% ~ +6%
    const volRatio = 0.5 + r(2) * 3; // 0.5x ~ 3.5x
    const vol = r(3) * 8;            // 0-8% 波动
    const ls = 0.3 + r(4) * 0.4;     // 0.3 ~ 0.7
    const fr = (r(5) - 0.5) * 0.002; // ±0.1%
    return {
      symbol,
      chgPct24h: chg,
      volumeChangeRatio: volRatio,
      volatility: vol,
      longShortRatio: ls,
      fundingRate: fr,
      price: 0,
      volume24h: 0,
      high24h: 0,
      low24h: 0,
    };
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  private snapshotToTextItems(s: MarketSnapshot, label: string): TextItem[] {
    const dir = s.chgPct24h >= 0 ? 'up' : 'down';
    const lines: string[] = [];
    lines.push(`${s.symbol} ${dir} ${s.chgPct24h.toFixed(2)}% in 24h (${label}).`);
    if (s.volumeChangeRatio > 1.5) lines.push(`Volume surge ${s.volumeChangeRatio.toFixed(2)}x average — strong participation.`);
    if (s.volatility > 5) lines.push(`High volatility ${s.volatility.toFixed(2)}% indicates fear in the market.`);
    if (s.longShortRatio > 0.6) lines.push(`Long/Short ratio ${s.longShortRatio.toFixed(2)} — bullish positioning.`);
    if (s.longShortRatio < 0.4) lines.push(`Long/Short ratio ${s.longShortRatio.toFixed(2)} — bearish positioning.`);
    if (Math.abs(s.fundingRate) > 0.0005) {
      lines.push(`Funding rate ${(s.fundingRate * 100).toFixed(4)}% — ${s.fundingRate > 0 ? 'longs pay shorts' : 'shorts pay longs'}.`);
    }
    return lines.map((content, i) => ({
      id: `mkt-${s.symbol}-${i}`,
      source: 'market',
      content,
      timestamp: Date.now(),
      metadata: { snapshot: s },
    }));
  }

  private distributionFromLabel(label: string, count: number): SourceSentiment['distribution'] {
    const dist: SourceSentiment['distribution'] = {
      very_bearish: 0,
      bearish: 0,
      neutral: 0,
      bullish: 0,
      very_bullish: 0,
    };
    if (label in dist) {
      (dist as any)[label] = count;
    } else {
      dist.neutral = count;
    }
    return dist;
  }
}
