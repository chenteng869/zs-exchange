/**
 * 金额维度评分器
 * 从交易金额角度评估风险
 */

import {
  RiskContext,
  DimensionScore,
  ScoreDimension,
  RiskLevel,
  ChainType,
} from '../risk-engine.types';

/**
 * 金额维度评分器类
 * 用于从交易金额角度计算风险评分
 */
export class AmountScorer {
  readonly dimension = ScoreDimension.AMOUNT;
  readonly dimensionName = '金额维度';

  private largeAmountThresholds: Partial<Record<ChainType, string>> = {
    [ChainType.EVM]: '1000',
    [ChainType.SOLANA]: '100',
    [ChainType.BITCOIN]: '1',
    [ChainType.TRON]: '100000',
  };

  private weight = 0.25;

  /**
   * 设置权重
   * @param weight 权重（0-1）
   */
  setWeight(weight: number): void {
    this.weight = Math.max(0, Math.min(1, weight));
  }

  /**
   * 获取权重
   */
  getWeight(): number {
    return this.weight;
  }

  /**
   * 设置大额转账阈值
   * @param chain 链类型
   * @param threshold 阈值
   */
  setThreshold(chain: ChainType, threshold: string): void {
    this.largeAmountThresholds[chain] = threshold;
  }

  /**
   * 批量设置阈值
   * @param thresholds 阈值配置
   */
  setThresholds(thresholds: Partial<Record<ChainType, string>>): void {
    Object.assign(this.largeAmountThresholds, thresholds);
  }

  /**
   * 获取指定链的阈值
   * @param chain 链类型
   */
  getThreshold(chain: ChainType): string {
    return this.largeAmountThresholds[chain] || '1000';
  }

  /**
   * 获取交易金额
   * @param context 风控上下文
   */
  private getTransactionAmount(context: RiskContext): number {
    if (context.transaction?.value) {
      try {
        return parseFloat(context.transaction.value);
      } catch {
        return 0;
      }
    }

    if (context.assets && context.assets.length > 0) {
      let totalValue = 0;
      for (const asset of context.assets) {
        if (asset.valueInUsd) {
          totalValue += asset.valueInUsd;
        } else if (asset.amount) {
          try {
            totalValue += parseFloat(asset.amount);
          } catch {
            // 忽略
          }
        }
      }
      if (totalValue > 0) return totalValue;
    }

    return 0;
  }

  /**
   * 计算金额与阈值的比率
   * @param amount 金额
   * @param chain 链类型
   */
  private calculateRatio(amount: number, chain: ChainType): number {
    try {
      const thresholdStr = this.largeAmountThresholds[chain] || '1000';
      const threshold = parseFloat(thresholdStr);
      if (threshold <= 0 || isNaN(threshold)) return 0;
      return amount / threshold;
    } catch {
      return 0;
    }
  }

  /**
   * 计算基础分数（基于金额比率）
   * @param ratio 金额与阈值的比率
   */
  private calculateBaseScore(ratio: number): number {
    if (ratio <= 0) return 0;
    if (ratio >= 10) return 100;
    if (ratio >= 5) return 80 + ((ratio - 5) / 5) * 20;
    if (ratio >= 2) return 60 + ((ratio - 2) / 3) * 20;
    if (ratio >= 1) return 35 + ((ratio - 1) / 1) * 25;
    if (ratio >= 0.5) return 15 + ((ratio - 0.5) / 0.5) * 20;
    return ratio * 30;
  }

  /**
   * 评估风险等级
   * @param score 分数
   */
  private assessRiskLevel(score: number): RiskLevel {
    if (score >= 85) return RiskLevel.CRITICAL;
    if (score >= 60) return RiskLevel.HIGH;
    if (score >= 30) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  /**
   * 生成评分描述
   * @param score 分数
   * @param ratio 比率
   * @param amount 金额
   * @param threshold 阈值
   */
  private generateDescription(
    score: number,
    ratio: number,
    amount: number,
    threshold: string
  ): string {
    if (score === 0) {
      return '无交易金额或金额极小';
    }
    if (ratio >= 10) {
      return `金额极大（${amount}），为阈值的 ${ratio.toFixed(1)} 倍，风险极高`;
    }
    if (ratio >= 5) {
      return `金额很大（${amount}），为阈值的 ${ratio.toFixed(1)} 倍，风险很高`;
    }
    if (ratio >= 2) {
      return `金额较大（${amount}），为阈值的 ${ratio.toFixed(1)} 倍，风险较高`;
    }
    if (ratio >= 1) {
      return `金额超过阈值（${amount} > ${threshold}），存在一定风险`;
    }
    return `金额在正常范围内（${amount}）`;
  }

  /**
   * 执行金额维度评分
   * @param context 风控上下文
   * @returns 维度评分结果
   */
  score(context: RiskContext): DimensionScore {
    const amount = this.getTransactionAmount(context);
    const ratio = this.calculateRatio(amount, context.chainType);
    const baseScore = this.calculateBaseScore(ratio);
    const score = Math.min(Math.round(baseScore), 100);
    const level = this.assessRiskLevel(score);
    const weightedScore = Math.round(score * this.weight * 100) / 100;
    const threshold = this.getThreshold(context.chainType);

    return {
      dimension: this.dimension,
      dimensionName: this.dimensionName,
      score,
      weight: this.weight,
      weightedScore,
      level,
      description: this.generateDescription(score, ratio, amount, threshold),
      details: {
        amount,
        threshold,
        ratio,
        chainType: context.chainType,
      },
    };
  }
}

export const amountScorer = new AmountScorer();
