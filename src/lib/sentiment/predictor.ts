/**
 * SentimentPredictor - 简单预测器（P3-3）
 *
 * 模型：线性 + 加权启发式
 *   features: { sentiment, momentum, volume, chg24h, volatility, fearGreed }
 *   score = w · features
 *
 * 注意：
 *  - 这不是 ML 模型，是基于"情绪 + 量能 + 动量"的启发式估计
 *  - 支持 4 个时间窗口：1h / 4h / 24h / 7d
 *  - 准确度统计：每次 recordResult(symbol, predicted, actual) 可用于回测
 *
 * 模型版本：v1.0.0-heuristic
 */

import type { Prediction, PredictionHorizon, TrendSignal } from './types';
import type { MarketSentiment } from './types';
import type { SourceSentiment } from './types';

// =============================================================================
// 工具
// =============================================================================

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

function nowMs(): number {
  return Date.now();
}

export const MODEL_VERSION = 'v1.0.0-heuristic';

// =============================================================================
// 时间窗口参数
// =============================================================================

const HORIZON_PARAMS: Record<
  PredictionHorizon,
  {
    /** 期望变化放大系数（情绪→价格） */
    scale: number;
    /** 波动率衰减（短窗波动更显著） */
    volDecay: number;
    /** 噪声抑制（长窗需要更多证据） */
    noiseThreshold: number;
  }
> = {
  '1h': { scale: 0.6, volDecay: 1.0, noiseThreshold: 0.1 },
  '4h': { scale: 1.2, volDecay: 0.8, noiseThreshold: 0.15 },
  '24h': { scale: 2.5, volDecay: 0.6, noiseThreshold: 0.2 },
  '7d': { scale: 6.0, volDecay: 0.4, noiseThreshold: 0.3 },
};

// =============================================================================
// SentimentPredictor
// =============================================================================

export interface PredictorOptions {
  /** 自定义模型版本号 */
  modelVersion?: string;
}

export interface PredictionInput {
  overallScore: number;     // -1 ~ 1
  momentum: number;         // 0-1 动量强度
  volume: number;           // 0-1 量能强度
  chg24h: number;           // -1 ~ 1 标准化 24h 变化
  volatility: number;       // 0-1 波动率
  fearGreedIndex: number;   // 0-100
}

export interface AccuracyRecord {
  symbol: string;
  horizon: PredictionHorizon;
  predicted: 'up' | 'down' | 'sideways';
  actual: 'up' | 'down' | 'sideways';
  predictedAt: number;
  recordedAt: number;
}

export class SentimentPredictor {
  private readonly modelVersion: string;

  /** 准确度记录 */
  private readonly records: AccuracyRecord[] = [];

  constructor(opts: PredictorOptions = {}) {
    this.modelVersion = opts.modelVersion || MODEL_VERSION;
  }

  // -------------------------------------------------------------------------
  // 主入口
  // -------------------------------------------------------------------------

  /**
   * 预测
   * @param symbol 交易对符号
   * @param horizon 时间窗口
   * @param input 特征
   * @param marketSentiment 可选，用于记录当前快照
   */
  predict(
    symbol: string,
    horizon: PredictionHorizon,
    input: PredictionInput,
    marketSentiment?: MarketSentiment,
  ): Prediction {
    const params = HORIZON_PARAMS[horizon];
    const sentimentW = 0.40;
    const momentumW = 0.20;
    const volumeW = 0.15;
    const chgW = 0.15;
    const fgiW = 0.10;

    // 各项归一化
    const sentimentN = clamp(input.overallScore, -1, 1);
    const momentumN = clamp((input.momentum - 0.5) * 2, -1, 1);
    const volumeN = clamp((input.volume - 0.5) * 2, -1, 1);
    const chgN = clamp(input.chg24h, -1, 1);
    const fgiN = clamp((input.fearGreedIndex - 50) / 50, -1, 1);

    const composite =
      sentimentN * sentimentW +
      momentumN * momentumW +
      volumeN * volumeW +
      chgN * chgW +
      fgiN * fgiW;

    // 噪声抑制
    const finalScore = Math.abs(composite) < params.noiseThreshold ? 0 : composite;
    const expectedPct = finalScore * params.scale * params.volDecay;

    let direction: 'up' | 'down' | 'sideways';
    if (expectedPct > 0.2) direction = 'up';
    else if (expectedPct < -0.2) direction = 'down';
    else direction = 'sideways';

    // 置信度：基础 0.5 + 强度 * 0.4 + 量能 0.1
    const strength = Math.abs(finalScore);
    const confidence = clamp(0.5 + strength * 0.4 + input.volume * 0.1, 0, 0.99);

    return {
      symbol,
      horizon,
      direction,
      confidence,
      expectedChange: `${expectedPct >= 0 ? '+' : ''}${expectedPct.toFixed(2)}%`,
      features: {
        sentiment: sentimentN,
        momentum: momentumN,
        volume: volumeN,
        chg24h: chgN,
        fgi: fgiN,
      },
      modelVersion: this.modelVersion,
      createdAt: nowMs(),
    };
  }

  /**
   * 从 MarketSentiment 抽取特征并预测
   */
  predictFromMarketSentiment(
    ms: MarketSentiment,
    horizon: PredictionHorizon,
    extra: { chg24h: number } = { chg24h: 0 },
  ): Prediction {
    const marketSrc: SourceSentiment | undefined = ms.bySource?.market;
    const chg = extra.chg24h ?? (marketSrc?.averageScore ?? 0);

    // 量能 = 总文本量 / 100（粗略）
    const volume = clamp(ms.volume24h / 100, 0, 1);
    // 动量 = market 源的分
    const momentum = clamp(((marketSrc?.averageScore ?? 0) + 1) / 2, 0, 1);
    // 波动率 = 异常数量 * 0.2（极简）
    const volatility = clamp(ms.anomalies.length * 0.2, 0, 1);

    return this.predict(ms.symbol, horizon, {
      overallScore: ms.overallScore,
      momentum,
      volume,
      chg24h: chg,
      volatility,
      fearGreedIndex: ms.fearGreedIndex,
    }, ms);
  }

  // -------------------------------------------------------------------------
  // 准确度
  // -------------------------------------------------------------------------

  /** 记录实际结果（用于离线回测） */
  recordResult(record: Omit<AccuracyRecord, 'recordedAt'>): void {
    this.records.push({ ...record, recordedAt: nowMs() });
  }

  /** 获取准确度统计 */
  getAccuracyStats(): { total: number; correct: number; rate: number } {
    const total = this.records.length;
    const correct = this.records.filter((r) => r.predicted === r.actual).length;
    return { total, correct, rate: total === 0 ? 0 : correct / total };
  }

  /** 清空记录（仅测试） */
  resetRecords(): void {
    this.records.length = 0;
  }

  /** 总记录数 */
  totalRecords(): number {
    return this.records.length;
  }

  // -------------------------------------------------------------------------
  // 辅助
  // -------------------------------------------------------------------------

  /**
   * 把 MarketSentiment 转为 TrendSignal
   */
  static toTrendSignal(ms: MarketSentiment): TrendSignal {
    if (ms.overallScore >= 0.5) return 'strong_buy';
    if (ms.overallScore >= 0.1) return 'buy';
    if (ms.overallScore <= -0.5) return 'strong_sell';
    if (ms.overallScore <= -0.1) return 'sell';
    return 'hold';
  }
}
