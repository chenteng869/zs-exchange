/**
 * 风控决策引擎
 * 基于风险评分和规则结果，输出最终的风控决策
 */

import {
  RiskContext,
  RiskDecision,
  RiskRuleResult,
  RiskScore,
  RiskLevel,
  RiskAction,
  DecisionMatrixConfig,
} from './risk-engine.types';

/**
 * 决策引擎类
 * 负责根据风险评分和规则结果生成最终决策
 */
export class RiskDecisionEngine {
  readonly engineVersion = '1.0.0';

  private decisionMatrix: DecisionMatrixConfig = {
    lowThreshold: 30,
    mediumThreshold: 60,
    highThreshold: 85,
    criticalThreshold: 100,
    levelActions: {
      [RiskLevel.LOW]: RiskAction.ALLOW,
      [RiskLevel.MEDIUM]: RiskAction.WARN,
      [RiskLevel.HIGH]: RiskAction.SECOND_CONFIRM,
      [RiskLevel.CRITICAL]: RiskAction.REJECT,
    },
    enableRuleActionOverride: true,
    enableEscalation: true,
    escalationRuleCount: 3,
  };

  private actionPriority: Record<RiskAction, number> = {
    [RiskAction.ALLOW]: 0,
    [RiskAction.WARN]: 1,
    [RiskAction.SECOND_CONFIRM]: 2,
    [RiskAction.DELAY]: 3,
    [RiskAction.MANUAL_REVIEW]: 4,
    [RiskAction.REJECT]: 5,
  };

  private delaySeconds = 300;

  /**
   * 设置决策矩阵配置
   * @param config 配置
   */
  setDecisionMatrix(config: Partial<DecisionMatrixConfig>): void {
    Object.assign(this.decisionMatrix, config);

    if (config.levelActions) {
      this.decisionMatrix.levelActions = {
        ...this.decisionMatrix.levelActions,
        ...config.levelActions,
      };
    }
  }

  /**
   * 获取决策矩阵配置
   */
  getDecisionMatrix(): DecisionMatrixConfig {
    return { ...this.decisionMatrix };
  }

  /**
   * 设置延迟时间（秒）
   * @param seconds 秒数
   */
  setDelaySeconds(seconds: number): void {
    this.delaySeconds = seconds;
  }

  /**
   * 根据评分确定风险等级
   * @param score 风险评分
   */
  determineRiskLevel(score: number): RiskLevel {
    if (score >= this.decisionMatrix.criticalThreshold) {
      return RiskLevel.CRITICAL;
    }
    if (score >= this.decisionMatrix.highThreshold) {
      return RiskLevel.HIGH;
    }
    if (score >= this.decisionMatrix.mediumThreshold) {
      return RiskLevel.MEDIUM;
    }
    return RiskLevel.LOW;
  }

  /**
   * 根据风险等级获取默认动作
   * @param level 风险等级
   */
  getDefaultAction(level: RiskLevel): RiskAction {
    return this.decisionMatrix.levelActions[level];
  }

  /**
   * 比较两个动作的优先级
   * @param action1 动作1
   * @param action2 动作2
   * @returns 优先级更高的动作
   */
  getHigherPriorityAction(action1: RiskAction, action2: RiskAction): RiskAction {
    const priority1 = this.actionPriority[action1] ?? 0;
    const priority2 = this.actionPriority[action2] ?? 0;
    return priority1 >= priority2 ? action1 : action2;
  }

  /**
   * 从规则结果中获取最高优先级的动作
   * @param ruleResults 规则结果列表
   */
  getHighestRuleAction(ruleResults: RiskRuleResult[]): RiskAction {
    const matchedRules = ruleResults.filter((r) => r.matched);

    if (matchedRules.length === 0) {
      return RiskAction.ALLOW;
    }

    let highestAction = RiskAction.ALLOW;
    for (const rule of matchedRules) {
      highestAction = this.getHigherPriorityAction(highestAction, rule.action);
    }

    return highestAction;
  }

  /**
   * 检查是否需要决策升级
   * @param ruleResults 规则结果列表
   * @param currentLevel 当前风险等级
   */
  checkEscalation(ruleResults: RiskRuleResult[], currentLevel: RiskLevel): {
    needEscalation: boolean;
    escalatedLevel?: RiskLevel;
    reason?: string;
  } {
    if (!this.decisionMatrix.enableEscalation) {
      return { needEscalation: false };
    }

    const matchedRules = ruleResults.filter((r) => r.matched);
    const highRiskRules = matchedRules.filter(
      (r) => r.level === RiskLevel.HIGH || r.level === RiskLevel.CRITICAL
    );

    if (highRiskRules.length >= this.decisionMatrix.escalationRuleCount) {
      const escalatedLevel =
        currentLevel === RiskLevel.CRITICAL
          ? RiskLevel.CRITICAL
          : RiskLevel.CRITICAL;

      return {
        needEscalation: true,
        escalatedLevel,
        reason: `同时触发 ${highRiskRules.length} 条高风险规则，决策升级`,
      };
    }

    const criticalRules = matchedRules.filter((r) => r.level === RiskLevel.CRITICAL);
    if (criticalRules.length >= 1 && currentLevel < RiskLevel.CRITICAL) {
      return {
        needEscalation: true,
        escalatedLevel: RiskLevel.CRITICAL,
        reason: '触发严重风险规则，决策升级',
      };
    }

    return { needEscalation: false };
  }

  /**
   * 生成决策原因
   * @param matchedRules 匹配的规则
   * @param riskScore 风险评分
   * @param finalLevel 最终风险等级
   * @param escalationInfo 升级信息
   */
  generateReasons(
    matchedRules: RiskRuleResult[],
    riskScore: RiskScore,
    finalLevel: RiskLevel,
    escalationInfo?: { needEscalation: boolean; reason?: string }
  ): string[] {
    const reasons: string[] = [];

    for (const rule of matchedRules) {
      if (rule.reason) {
        reasons.push(rule.reason);
      } else {
        reasons.push(`触发规则：${rule.ruleName}`);
      }
    }

    if (matchedRules.length === 0 && finalLevel !== RiskLevel.LOW) {
      reasons.push(`综合风险评分：${riskScore.totalScore}/100`);
    }

    if (escalationInfo?.needEscalation && escalationInfo.reason) {
      reasons.push(escalationInfo.reason);
    }

    if (reasons.length === 0) {
      reasons.push('风险评估通过');
    }

    return reasons;
  }

  /**
   * 生成建议措施
   * @param level 风险等级
   * @param action 决策动作
   * @param matchedRules 匹配的规则
   */
  generateRecommendations(
    level: RiskLevel,
    action: RiskAction,
    matchedRules: RiskRuleResult[]
  ): string[] {
    const recommendations: string[] = [];

    if (level === RiskLevel.LOW) {
      recommendations.push('交易风险较低，可以正常执行');
    }

    if (level === RiskLevel.MEDIUM) {
      recommendations.push('请注意交易风险，确认后再操作');
    }

    if (level === RiskLevel.HIGH) {
      recommendations.push('交易风险较高，请仔细核对交易信息');
      recommendations.push('建议核实收款地址和交易金额的正确性');
    }

    if (level === RiskLevel.CRITICAL) {
      recommendations.push('交易风险极高，建议取消交易');
      recommendations.push('如确需执行，请联系客服或进行人工审核');
    }

    const hasBlacklistRule = matchedRules.some(
      (r) => r.ruleCode === 'BLACKLIST_ADDRESS' || r.ruleCode === 'BLACKLIST_CONTRACT'
    );
    if (hasBlacklistRule) {
      recommendations.push('请勿向黑名单地址转账，您的资产可能无法找回');
    }

    const hasPhishingRule = matchedRules.some((r) => r.ruleCode === 'PHISHING_DOMAIN');
    if (hasPhishingRule) {
      recommendations.push('该网站可能是钓鱼网站，请立即关闭');
      recommendations.push('请勿在该网站上输入任何敏感信息或进行签名操作');
    }

    const hasApprovalRule = matchedRules.some(
      (r) =>
        r.ruleCode === 'UNLIMITED_APPROVAL' ||
        r.ruleCode === 'NFT_APPROVAL_FOR_ALL'
    );
    if (hasApprovalRule) {
      recommendations.push('建议仅授权实际需要的金额');
      recommendations.push('交易完成后可考虑取消授权');
    }

    const hasNewDevice = matchedRules.some((r) => r.category === 'device');
    if (hasNewDevice) {
      recommendations.push('新设备首次操作，请确认是您本人行为');
      recommendations.push('建议开启二次验证以提高账户安全性');
    }

    return recommendations;
  }

  /**
   * 生成决策说明
   * @param decision 决策
   * @param riskScore 风险评分
   */
  generateExplanation(decision: RiskDecision, riskScore: RiskScore): string {
    const parts: string[] = [];

    parts.push(`风险评分：${riskScore.totalScore}/100`);
    parts.push(`风险等级：${this.getLevelText(decision.level)}`);
    parts.push(`决策动作：${this.getActionText(decision.action)}`);

    const highRiskDimensions = riskScore.dimensions.filter((d) => d.score >= 30);
    if (highRiskDimensions.length > 0) {
      parts.push(`高风险维度：${highRiskDimensions.map((d) => d.dimensionName).join('、')}`);
    }

    return parts.join('；');
  }

  /**
   * 判断决策是否允许执行
   * @param action 动作
   */
  isActionAllowed(action: RiskAction): boolean {
    return (
      action === RiskAction.ALLOW ||
      action === RiskAction.WARN ||
      action === RiskAction.SECOND_CONFIRM
    );
  }

  /**
   * 判断是否需要二次验证
   * @param action 动作
   * @param level 风险等级
   */
  requireSecondFactor(action: RiskAction, level: RiskLevel): boolean {
    if (action === RiskAction.MANUAL_REVIEW) return true;
    if (level === RiskLevel.HIGH && action === RiskAction.SECOND_CONFIRM) return true;
    if (level === RiskLevel.CRITICAL) return true;
    return false;
  }

  /**
   * 生成唯一决策 ID
   */
  private generateDecisionId(): string {
    return `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  /**
   * 获取动作文本
   * @param action 动作
   */
  private getActionText(action: RiskAction): string {
    switch (action) {
      case RiskAction.ALLOW:
        return '允许';
      case RiskAction.WARN:
        return '警告';
      case RiskAction.SECOND_CONFIRM:
        return '二次确认';
      case RiskAction.DELAY:
        return '延迟执行';
      case RiskAction.MANUAL_REVIEW:
        return '人工审核';
      case RiskAction.REJECT:
        return '拒绝';
      default:
        return '未知';
    }
  }

  /**
   * 做出风控决策
   * @param context 风控上下文
   * @param ruleResults 规则结果列表
   * @param riskScore 风险评分
   */
  makeDecision(
    context: RiskContext,
    ruleResults: RiskRuleResult[],
    riskScore: RiskScore
  ): RiskDecision {
    const matchedRules = ruleResults
      .filter((r) => r.matched)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    let finalLevel = riskScore.level;
    let finalAction = this.getDefaultAction(finalLevel);

    if (this.decisionMatrix.enableRuleActionOverride && matchedRules.length > 0) {
      const highestRuleAction = this.getHighestRuleAction(ruleResults);
      finalAction = this.getHigherPriorityAction(finalAction, highestRuleAction);

      const highestRuleLevel = matchedRules.reduce(
        (max, rule) => this.getHigherRiskLevel(max, rule.level),
        RiskLevel.LOW
      );
      finalLevel = this.getHigherRiskLevel(finalLevel, highestRuleLevel);
    }

    const escalationResult = this.checkEscalation(ruleResults, finalLevel);
    if (escalationResult.needEscalation && escalationResult.escalatedLevel) {
      finalLevel = escalationResult.escalatedLevel;
      const escalationAction = this.getDefaultAction(finalLevel);
      finalAction = this.getHigherPriorityAction(finalAction, escalationAction);
    }

    const reasons = this.generateReasons(
      matchedRules,
      riskScore,
      finalLevel,
      escalationResult
    );

    const recommendations = this.generateRecommendations(
      finalLevel,
      finalAction,
      matchedRules
    );

    const allowed = this.isActionAllowed(finalAction);
    const requireSecondFactor = this.requireSecondFactor(finalAction, finalLevel);

    const decision: RiskDecision = {
      action: finalAction,
      level: finalLevel,
      allowed,
      reasons,
      matchedRules,
      riskScore,
      recommendations,
      requireSecondFactor,
      decisionId: this.generateDecisionId(),
      decidedAt: new Date(),
      engineVersion: this.engineVersion,
    };

    if (finalAction === RiskAction.DELAY) {
      decision.delaySeconds = this.delaySeconds;
    }

    decision.explanation = this.generateExplanation(decision, riskScore);

    return decision;
  }

  /**
   * 获取更高的风险等级
   * @param level1 等级1
   * @param level2 等级2
   */
  private getHigherRiskLevel(level1: RiskLevel, level2: RiskLevel): RiskLevel {
    const levelOrder: RiskLevel[] = [
      RiskLevel.LOW,
      RiskLevel.MEDIUM,
      RiskLevel.HIGH,
      RiskLevel.CRITICAL,
    ];
    const index1 = levelOrder.indexOf(level1);
    const index2 = levelOrder.indexOf(level2);
    return index1 >= index2 ? level1 : level2;
  }

  /**
   * 验证决策一致性
   * 用于测试和调试，确保决策逻辑正确
   * @param decision 决策
   * @param riskScore 风险评分
   */
  validateDecisionConsistency(decision: RiskDecision, riskScore: RiskScore): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (decision.riskScore.totalScore !== riskScore.totalScore) {
      issues.push('决策中的风险评分与输入评分不一致');
    }

    const expectedLevel = this.determineRiskLevel(riskScore.totalScore);
    if (decision.level !== expectedLevel && decision.matchedRules.length === 0) {
      issues.push('风险等级与评分不匹配，且没有规则触发');
    }

    if (decision.allowed && decision.action === RiskAction.REJECT) {
      issues.push('决策标记为允许，但动作是拒绝');
    }

    if (!decision.allowed && decision.action === RiskAction.ALLOW) {
      issues.push('决策标记为不允许，但动作是允许');
    }

    if (decision.matchedRules.length > 0 && decision.reasons.length === 0) {
      issues.push('有匹配的规则但没有原因说明');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}

export const riskDecisionEngine = new RiskDecisionEngine();
