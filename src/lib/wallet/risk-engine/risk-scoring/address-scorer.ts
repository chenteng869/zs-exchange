/**
 * 地址维度评分器
 * 从地址风险角度评估风险，包括黑名单、新地址、历史交互等
 */

import {
  RiskContext,
  DimensionScore,
  ScoreDimension,
  RiskLevel,
} from '../risk-engine.types';

/**
 * 地址维度评分器类
 * 用于从地址风险角度计算风险评分
 */
export class AddressScorer {
  readonly dimension = ScoreDimension.ADDRESS;
  readonly dimensionName = '地址维度';

  private weight = 0.25;

  private blacklistAddresses: Set<string> = new Set();
  private whitelistAddresses: Set<string> = new Set();

  private userAddressInteractions: Map<string, Map<string, number>> = new Map();

  private newAddressThreshold = 0;

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
   * 添加黑名单地址
   * @param address 地址
   */
  addBlacklistAddress(address: string): void {
    this.blacklistAddresses.add(address.toLowerCase());
  }

  /**
   * 批量添加黑名单地址
   * @param addresses 地址列表
   */
  addBlacklistAddresses(addresses: string[]): void {
    addresses.forEach((addr) => this.blacklistAddresses.add(addr.toLowerCase()));
  }

  /**
   * 移除黑名单地址
   * @param address 地址
   */
  removeBlacklistAddress(address: string): boolean {
    return this.blacklistAddresses.delete(address.toLowerCase());
  }

  /**
   * 添加白名单地址
   * @param address 地址
   */
  addWhitelistAddress(address: string): void {
    this.whitelistAddresses.add(address.toLowerCase());
  }

  /**
   * 批量添加白名单地址
   * @param addresses 地址列表
   */
  addWhitelistAddresses(addresses: string[]): void {
    addresses.forEach((addr) => this.whitelistAddresses.add(addr.toLowerCase()));
  }

  /**
   * 移除白名单地址
   * @param address 地址
   */
  removeWhitelistAddress(address: string): boolean {
    return this.whitelistAddresses.delete(address.toLowerCase());
  }

  /**
   * 设置新地址阈值
   * @param threshold 交互次数阈值
   */
  setNewAddressThreshold(threshold: number): void {
    this.newAddressThreshold = threshold;
  }

  /**
   * 记录用户与地址的交互
   * @param userId 用户 ID
   * @param address 地址
   */
  recordInteraction(userId: string, address: string): void {
    let userRecords = this.userAddressInteractions.get(userId);
    if (!userRecords) {
      userRecords = new Map();
      this.userAddressInteractions.set(userId, userRecords);
    }

    const normalized = address.toLowerCase();
    const current = userRecords.get(normalized) || 0;
    userRecords.set(normalized, current + 1);
  }

  /**
   * 获取用户与地址的交互次数
   * @param userId 用户 ID
   * @param address 地址
   */
  getInteractionCount(userId: string, address: string): number {
    const userRecords = this.userAddressInteractions.get(userId);
    if (!userRecords) return 0;
    return userRecords.get(address.toLowerCase()) || 0;
  }

  /**
   * 提取目标地址
   * @param context 风控上下文
   */
  private extractTargetAddresses(context: RiskContext): string[] {
    const addresses: string[] = [];

    if (context.transaction?.to) {
      addresses.push(context.transaction.to.toLowerCase());
    }

    if (context.transaction?.contractAddress) {
      addresses.push(context.transaction.contractAddress.toLowerCase());
    }

    return [...new Set(addresses)];
  }

  /**
   * 计算黑名单风险分
   * @param addresses 地址列表
   */
  private calculateBlacklistScore(addresses: string[]): {
    score: number;
    details: string[];
    hitCount: number;
  } {
    let score = 0;
    const details: string[] = [];
    let hitCount = 0;

    for (const address of addresses) {
      if (this.blacklistAddresses.has(address)) {
        score = 100;
        details.push(`地址 ${address} 在黑名单中`);
        hitCount++;
        break;
      }
    }

    return { score, details, hitCount };
  }

  /**
   * 计算白名单风险分（负向，降低风险）
   * @param addresses 地址列表
   */
  private calculateWhitelistScore(addresses: string[]): {
    scoreReduction: number;
    details: string[];
    hitCount: number;
  } {
    let scoreReduction = 0;
    const details: string[] = [];
    let hitCount = 0;

    for (const address of addresses) {
      if (this.whitelistAddresses.has(address)) {
        scoreReduction = Math.max(scoreReduction, 30);
        details.push(`地址 ${address} 在白名单中`);
        hitCount++;
      }
    }

    return { scoreReduction, details, hitCount };
  }

  /**
   * 计算新地址风险分
   * @param addresses 地址列表
   * @param userId 用户 ID
   */
  private calculateNewAddressScore(addresses: string[], userId?: string): {
    score: number;
    details: string[];
    newAddressCount: number;
  } {
    if (!userId || addresses.length === 0) {
      return { score: 0, details: [], newAddressCount: 0 };
    }

    let maxScore = 0;
    const details: string[] = [];
    let newAddressCount = 0;

    for (const address of addresses) {
      const interactionCount = this.getInteractionCount(userId, address);

      if (interactionCount <= this.newAddressThreshold) {
        const score = 40;
        maxScore = Math.max(maxScore, score);
        details.push(`新地址交互：${address}（历史交互 ${interactionCount} 次）`);
        newAddressCount++;
      } else if (interactionCount < 3) {
        const score = 20;
        maxScore = Math.max(maxScore, score);
        details.push(`较少交互地址：${address}（历史交互 ${interactionCount} 次）`);
      }
    }

    return { score: maxScore, details, newAddressCount };
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
   * @param details 详情列表
   */
  private generateDescription(score: number, details: string[]): string {
    if (details.length > 0) {
      return details.join('；');
    }
    if (score === 0) {
      return '所有目标地址均安全';
    }
    return `地址维度风险评分：${score} 分`;
  }

  /**
   * 执行地址维度评分
   * @param context 风控上下文
   * @returns 维度评分结果
   */
  score(context: RiskContext): DimensionScore {
    const targetAddresses = this.extractTargetAddresses(context);

    if (targetAddresses.length === 0) {
      return {
        dimension: this.dimension,
        dimensionName: this.dimensionName,
        score: 0,
        weight: this.weight,
        weightedScore: 0,
        level: RiskLevel.LOW,
        description: '无目标地址，地址维度不评分',
        details: {
          targetAddresses: [],
        },
      };
    }

    const blacklistResult = this.calculateBlacklistScore(targetAddresses);
    const whitelistResult = this.calculateWhitelistScore(targetAddresses);
    const newAddressResult = this.calculateNewAddressScore(
      targetAddresses,
      context.userId
    );

    let totalScore = 0;

    totalScore = Math.max(totalScore, blacklistResult.score);
    totalScore = Math.max(totalScore, newAddressResult.score);

    totalScore = Math.max(0, totalScore - whitelistResult.scoreReduction);

    const score = Math.min(Math.round(totalScore), 100);
    const level = this.assessRiskLevel(score);
    const weightedScore = Math.round(score * this.weight * 100) / 100;

    const allDetails = [
      ...blacklistResult.details,
      ...whitelistResult.details.map((d) => `[白名单] ${d}`),
      ...newAddressResult.details,
    ];

    return {
      dimension: this.dimension,
      dimensionName: this.dimensionName,
      score,
      weight: this.weight,
      weightedScore,
      level,
      description: this.generateDescription(score, allDetails),
      details: {
        targetAddresses,
        blacklistHits: blacklistResult.hitCount,
        whitelistHits: whitelistResult.hitCount,
        newAddressCount: newAddressResult.newAddressCount,
      },
    };
  }
}

export const addressScorer = new AddressScorer();
