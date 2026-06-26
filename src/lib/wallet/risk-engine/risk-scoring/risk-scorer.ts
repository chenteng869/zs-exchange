/**
 * 风险评分器
 * 综合各维度评分和规则评分，计算最终风险评分
 */

import {
  RiskContext,
  RiskScore,
  DimensionScore,
  ScoreDimension,
  RiskLevel,
  ScoreWeights,
  RiskRuleResult,
} from '../risk-engine.types';

import { amountScorer } from './amount-scorer';
import { addressScorer } from './address-scorer';
import { contractScorer } from './contract-scorer';
import { behaviorScorer } from './behavior-scorer';
import { deviceScorer } from './device-scorer';

/**
 * 风险评分器类
 * 负责综合各维度评分，计算最终风险评分
 */
export class RiskScorer {
  readonly modelVersion = '1.0.0';

  private scoreWeights: ScoreWeights = {
    amount: 0.25,
    address: 0.25,
    contract: 0.2,
    behavior: 0.15,
    device: 0.15,
    domain: 0.1,
  };

  private ruleBasedScoreWeight = 0.6;
  private dimensionBasedScoreWeight = 0.4;

  constructor() {
    this.applyWeights();
  }

  /**
   * 设置评分权重
   * @param weights 权重配置
   */
  setWeights(weights: Partial<ScoreWeights>): void {
    Object.assign(this.scoreWeights, weights);
    this.normalizeWeights();
    this.applyWeights();
  }

  /**
   * 获取当前权重配置
   */
  getWeights(): ScoreWeights {
    return { ...this.scoreWeights };
  }

  /**
   * 归一化权重
   * 确保所有权重之和为 1
   */
  private normalizeWeights(): void {
    const weights = this.scoreWeights;
    const total =
      weights.amount +
      weights.address +
      weights.contract +
      weights.behavior +
      weights.device +
      weights.domain;

    if (total > 0 && total !== 1) {
      weights.amount = weights.amount / total;
      weights.address = weights.address / total;
      weights.contract = weights.contract / total;
      weights.behavior = weights.behavior / total;
      weights.device = weights.device / total;
      weights.domain = weights.domain / total;
    }
  }

  /**
   * 将权重应用到各维度评分器
   */
  private applyWeights(): void {
    amountScorer.setWeight(this.scoreWeights.amount);
    addressScorer.setWeight(this.scoreWeights.address);
    contractScorer.setWeight(this.scoreWeights.contract);
    behaviorScorer.setWeight(this.scoreWeights.behavior);
    deviceScorer.setWeight(this.scoreWeights.device);
  }

  /**
   * 设置规则评分权重
   * @param ruleWeight 规则评分权重
   * @param dimensionWeight 维度评分权重
   */
  setScoreCombinationWeights(ruleWeight: number, dimensionWeight: number): void {
    const total = ruleWeight + dimensionWeight;
    if (total > 0) {
      this.ruleBasedScoreWeight = ruleWeight / total;
      this.dimensionBasedScoreWeight = dimensionWeight / total;
    }
  }

  /**
   * 计算域名维度评分
   * @param context 风控上下文
   */
  private calculateDomainScore(context: RiskContext): DimensionScore {
    const dimension = ScoreDimension.DOMAIN;
    const dimensionName = '域名维度';
    const weight = this.scoreWeights.domain;

    let score = 0;
    let level = RiskLevel.LOW;
    let description = '';
    const details: Record<string, unknown> = {};

    if (context.dapp?.domain) {
      details.domain = context.dapp.domain;

      if (context.dapp.isVerified) {
        score = 0;
        description = 'DApp 域名已验证';
        details.isVerified = true;
      } else if (context.dapp.isKnownDApp) {
        score = 10;
        level = RiskLevel.LOW;
        description = '已知 DApp 域名';
        details.isKnownDApp = true;
      } else {
        score = 20;
        level = RiskLevel.LOW;
        description = '未知 DApp 域名，请谨慎操作';
        details.isUnknown = true;
      }
    } else {
      description = '无 DApp 域名信息';
    }

    const weightedScore = Math.round(score * weight * 100) / 100;

    return {
      dimension,
      dimensionName,
      score,
      weight,
      weightedScore,
      level,
      description,
      details,
    };
  }

  /**
   * 计算各维度评分
   * @param context 风控上下文
   */
  calculateDimensionScores(context: RiskContext): DimensionScore[] {
    const dimensions: DimensionScore[] = [];

    dimensions.push(amountScorer.score(context));
    dimensions.push(addressScorer.score(context));
    dimensions.push(contractScorer.score(context));
    dimensions.push(behaviorScorer.score(context));
    dimensions.push(deviceScorer.score(context));
    dimensions.push(this.calculateDomainScore(context));

    return dimensions;
  }

  /**
   * 计算基于维度的综合评分
   * @param dimensionScores 各维度评分
   */
  private calculateDimensionBasedScore(dimensionScores: DimensionScore[]): number {
    const totalWeightedScore = dimensionScores.reduce(
      (sum, d) => sum + d.weightedScore,
      0
    );
    const totalWeight = dimensionScores.reduce((sum, d) => sum + d.weight, 0);

    if (totalWeight === 0) return 0;

    return (totalWeightedScore / totalWeight) * 100;
  }

  /**
   * 计算基于规则的评分
   * @param ruleResults 规则评估结果
   */
  private calculateRuleBasedScore(ruleResults: RiskRuleResult[]): number {
    const matchedRules = ruleResults.filter((r) => r.matched);

    if (matchedRules.length === 0) {
      return 0;
    }

    let maxScore = 0;
    let totalWeightedScore = 0;
    let totalPriority = 0;

    for (const rule of matchedRules) {
      maxScore = Math.max(maxScore, rule.score);

      const priority = rule.priority || 50;
      totalWeightedScore += rule.score * priority;
      totalPriority += priority;
    }

    const weightedAverage = totalPriority > 0 ? totalWeightedScore / totalPriority : 0;

    return Math.max(maxScore, weightedAverage);
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
   * 计算最终风险评分
   * @param context 风控上下文
   * @param ruleResults 规则评估结果
   */
  calculateRiskScore(context: RiskContext, ruleResults: RiskRuleResult[]): RiskScore {
    const dimensionScores = this.calculateDimensionScores(context);

    const dimensionBasedScore = this.calculateDimensionBasedScore(dimensionScores);
    const ruleBasedScore = this.calculateRuleBasedScore(ruleResults);

    const finalScore =
      dimensionBasedScore * this.dimensionBasedScoreWeight +
      ruleBasedScore * this.ruleBasedScoreWeight;

    const totalScore = Math.min(Math.round(finalScore), 100);
    const level = this.assessRiskLevel(totalScore);

    return {
      totalScore,
      level,
      dimensions: dimensionScores,
      ruleBasedScore: Math.round(ruleBasedScore),
      modelVersion: this.modelVersion,
      calculatedAt: new Date(),
    };
  }

  /**
   * 获取评分解释
   * @param riskScore 风险评分
   */
  getScoreExplanation(riskScore: RiskScore): string {
    const explanations: string[] = [];

    explanations.push(`综合风险评分：${riskScore.totalScore}/100 分`);
    explanations.push(`风险等级：${this.getLevelText(riskScore.level)}`);

    const highRiskDimensions = riskScore.dimensions.filter((d) => d.score >= 30);
    if (highRiskDimensions.length > 0) {
      explanations.push('主要风险维度：');
      for (const dim of highRiskDimensions) {
        explanations.push(`  - ${dim.dimensionName}：${dim.score} 分 - ${dim.description}`);
      }
    }

    if (riskScore.ruleBasedScore > 0) {
      explanations.push(`规则触发加分：${riskScore.ruleBasedScore} 分`);
    }

    return explanations.join('\n');
  }

  /**
   * 获取风险等级文本
   * @param level 风险等级
   */
  private getLevelText(level: RiskLevel): string {
    switch (level) {
      case RiskLevel.LOW:
        return '低风险';
      case RiskLevel.MEDIUM:
        return '中风险';
      case RiskLevel.HIGH:
        return '高风险';
      case RiskLevel.CRITICAL:
        return '严重风险';
      default:
        return '未知';
    }
  }
}

export const riskScorer = new RiskScorer();
