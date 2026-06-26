/**
 * 策略评估器 (PolicyEvaluator)
 *
 * 负责：
 *  - 定义策略评估接口
 *  - 实现基础的策略评估逻辑
 *  - 提供风险分数计算工具方法
 *  - 支持组合策略评估结果的合并
 */

import {
  PolicyResult,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  CombinedPolicyResult,
  SignaturePolicy,
  ApprovalConfig,
  WalletTier,
  ChainType,
  PolicyType,
  ApprovalMode,
} from '../mpc.types';

// =============================================================================
// 策略评估器基础接口
// =============================================================================

/**
 * 策略评估器接口
 * 所有具体策略评估器都需要实现此接口
 */
export interface IPolicyEvaluator {
  /** 策略类型 */
  readonly policyType: PolicyType;

  /**
   * 评估策略
   * @param policy 策略配置
   * @param context 评估上下文
   * @returns 评估结果
   */
  evaluate(
    policy: SignaturePolicy,
    context: PolicyEvaluationContext,
  ): Promise<PolicyEvaluationResult>;

  /**
   * 检查策略是否适用当前上下文
   * @param policy 策略配置
   * @param context 评估上下文
   * @returns 是否适用
   */
  isApplicable(policy: SignaturePolicy, context: PolicyEvaluationContext): boolean;
}

// =============================================================================
// 抽象策略评估器基类
// =============================================================================

/**
 * 抽象策略评估器基类
 * 提供通用的评估逻辑和工具方法
 */
export abstract class BasePolicyEvaluator implements IPolicyEvaluator {
  abstract readonly policyType: PolicyType;

  abstract evaluate(
    policy: SignaturePolicy,
    context: PolicyEvaluationContext,
  ): Promise<PolicyEvaluationResult>;

  /**
   * 检查策略是否适用于当前上下文
   *  - 检查启用状态
   *  - 检查生效时间
   *  - 检查钱包层级
   *  - 检查链类型
   */
  isApplicable(policy: SignaturePolicy, context: PolicyEvaluationContext): boolean {
    if (!policy.enabled) {
      return false;
    }

    const now = context.requestTime;

    if (policy.effectiveFrom && now < policy.effectiveFrom) {
      return false;
    }

    if (policy.effectiveTo && now > policy.effectiveTo) {
      return false;
    }

    if (policy.applicableTiers && policy.applicableTiers.length > 0) {
      if (!policy.applicableTiers.includes(context.wallet.tier)) {
        return false;
      }
    }

    if (policy.applicableChains && policy.applicableChains.length > 0) {
      if (!policy.applicableChains.includes(context.chainType)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 创建基础评估结果
   */
  protected createBaseResult(
    policy: SignaturePolicy,
    result: PolicyResult,
    reason: string,
    riskScore: number = 0,
  ): PolicyEvaluationResult {
    return {
      policyId: policy.id,
      policyName: policy.name,
      policyType: policy.type,
      result,
      passed: result === PolicyResult.ALLOW || result === PolicyResult.WARN,
      riskScore,
      reason,
      triggeredRules: [],
      evaluationTimeMs: 0,
    };
  }

  /**
   * 创建允许通过的结果
   */
  protected allow(policy: SignaturePolicy, reason: string = '策略检查通过'): PolicyEvaluationResult {
    return this.createBaseResult(policy, PolicyResult.ALLOW, reason, 0);
  }

  /**
   * 创建警告结果
   */
  protected warn(
    policy: SignaturePolicy,
    reason: string,
    riskScore: number = 30,
  ): PolicyEvaluationResult {
    return this.createBaseResult(policy, PolicyResult.WARN, reason, riskScore);
  }

  /**
   * 创建拒绝结果
   */
  protected reject(
    policy: SignaturePolicy,
    reason: string,
    riskScore: number = 100,
  ): PolicyEvaluationResult {
    return this.createBaseResult(policy, PolicyResult.REJECT, reason, riskScore);
  }

  /**
   * 创建需要审批的结果
   */
  protected requireApproval(
    policy: SignaturePolicy,
    reason: string,
    approvalConfig: ApprovalConfig,
    riskScore: number = 50,
  ): PolicyEvaluationResult {
    const result = this.createBaseResult(policy, PolicyResult.REQUIRE_APPROVAL, reason, riskScore);
    result.approvalConfig = approvalConfig;
    return result;
  }

  /**
   * 解析参数并提供类型安全的访问
   */
  protected getParam<T>(policy: SignaturePolicy, key: string, defaultValue: T): T {
    const value = policy.parameters[key];
    if (value === undefined || value === null) {
      return defaultValue;
    }
    return value as T;
  }

  /**
   * 计算风险等级对应的分数
   */
  protected calculateRiskScore(level: 'low' | 'medium' | 'high' | 'critical'): number {
    switch (level) {
      case 'low':
        return 20;
      case 'medium':
        return 50;
      case 'high':
        return 80;
      case 'critical':
        return 100;
    }
  }
}

// =============================================================================
// 组合策略结果合并器
// =============================================================================

/**
 * 组合策略结果合并器
 * 负责将多个策略的评估结果合并为一个综合结果
 */
export class CombinedPolicyResultMerger {
  /**
   * 合并多个策略评估结果
   *
   * 合并规则：
   *  - 有任何一个策略拒绝，则整体拒绝
   *  - 有任何一个策略需要审批，则整体需要审批（取最严格的审批配置）
   *  - 所有策略都允许/warn，则整体允许
   *  - 风险分数取所有策略的最高值
   */
  merge(results: PolicyEvaluationResult[]): CombinedPolicyResult {
    if (results.length === 0) {
      return {
        overallResult: PolicyResult.ALLOW,
        passed: true,
        totalRiskScore: 0,
        policyResults: [],
        rejectReasons: [],
        warnings: [],
      };
    }

    const rejectResults = results.filter((r) => r.result === PolicyResult.REJECT);
    const approvalResults = results.filter((r) => r.result === PolicyResult.REQUIRE_APPROVAL);
    const warnResults = results.filter((r) => r.result === PolicyResult.WARN);

    const totalRiskScore = Math.max(...results.map((r) => r.riskScore));
    const rejectReasons = rejectResults.map((r) => r.reason);
    const warnings = warnResults.map((r) => r.reason);

    let overallResult: PolicyResult;
    let passed: boolean;
    let requiredApproval: ApprovalConfig | undefined;

    if (rejectResults.length > 0) {
      overallResult = PolicyResult.REJECT;
      passed = false;
    } else if (approvalResults.length > 0) {
      overallResult = PolicyResult.REQUIRE_APPROVAL;
      passed = false;
      requiredApproval = this.selectStrictestApprovalConfig(approvalResults);
    } else if (warnResults.length > 0) {
      overallResult = PolicyResult.WARN;
      passed = true;
    } else {
      overallResult = PolicyResult.ALLOW;
      passed = true;
    }

    return {
      overallResult,
      passed,
      totalRiskScore,
      policyResults: results,
      requiredApproval,
      rejectReasons,
      warnings,
    };
  }

  /**
   * 选择最严格的审批配置
   * 优先级：多人审批 > 顺序审批 > 并行审批 > 任意数 > 单人
   */
  private selectStrictestApprovalConfig(
    approvalResults: PolicyEvaluationResult[],
  ): ApprovalConfig | undefined {
    const configs = approvalResults
      .filter((r) => r.approvalConfig)
      .map((r) => r.approvalConfig!);

    if (configs.length === 0) {
      return undefined;
    }

    const modePriority: Record<ApprovalMode, number> = {
      [ApprovalMode.MULTIPLE]: 5,
      [ApprovalMode.SEQUENTIAL]: 4,
      [ApprovalMode.PARALLEL]: 3,
      [ApprovalMode.ANY_OF]: 2,
      [ApprovalMode.SINGLE]: 1,
    };

    configs.sort((a, b) => {
      const priorityDiff = modePriority[b.mode] - modePriority[a.mode];
      if (priorityDiff !== 0) return priorityDiff;

      const approverDiff = b.approvers.length - a.approvers.length;
      if (approverDiff !== 0) return approverDiff;

      return b.approvalLevel - a.approvalLevel;
    });

    return configs[0];
  }
}

// =============================================================================
// 风险评分计算器
// =============================================================================

/**
 * 风险评分计算器
 * 提供各种风险维度的评分计算
 */
export class RiskScoreCalculator {
  /**
   * 计算金额风险分数
   * @param amount 金额（以最小单位）
   * @param thresholds 阈值配置 [低, 中, 高, 严重]
   */
  calculateAmountRisk(
    amount: string,
    thresholds: { low: string; medium: string; high: string; critical: string },
  ): number {
    const amt = BigInt(amount || '0');
    const critical = BigInt(thresholds.critical);
    const high = BigInt(thresholds.high);
    const medium = BigInt(thresholds.medium);
    const low = BigInt(thresholds.low);

    if (amt >= critical) return 100;
    if (amt >= high) return 80;
    if (amt >= medium) return 50;
    if (amt >= low) return 20;
    return 0;
  }

  /**
   * 计算频率风险分数
   * @param count 次数
   * @param maxCount 最大允许次数
   */
  calculateFrequencyRisk(count: number, maxCount: number): number {
    if (maxCount <= 0) return 100;
    const ratio = count / maxCount;
    if (ratio >= 1) return 100;
    if (ratio >= 0.8) return 80;
    if (ratio >= 0.5) return 50;
    if (ratio >= 0.3) return 20;
    return 0;
  }

  /**
   * 计算地址风险分数
   * @param isWhitelisted 是否在白名单中
   * @param isBlacklisted 是否在黑名单中
   * @param riskLevel 地址风险等级
   */
  calculateAddressRisk(
    isWhitelisted: boolean,
    isBlacklisted: boolean,
    riskLevel?: 'low' | 'medium' | 'high' | 'critical',
  ): number {
    if (isBlacklisted) return 100;
    if (riskLevel === 'critical') return 90;
    if (riskLevel === 'high') return 70;
    if (riskLevel === 'medium') return 40;
    if (isWhitelisted) return 0;
    return 10;
  }

  /**
   * 计算时间风险分数
   * @param hour 当前小时（0-23）
   * @param safeHours 安全时间段
   */
  calculateTimeRisk(hour: number, safeHours: [number, number]): number {
    const [start, end] = safeHours;
    if (start <= end) {
      if (hour >= start && hour < end) return 0;
    } else {
      if (hour >= start || hour < end) return 0;
    }
    return 30;
  }

  /**
   * 综合多个风险分数
   * 使用加权平均 + 最大值修正
   */
  combineRiskScores(scores: Array<{ score: number; weight: number }>): number {
    if (scores.length === 0) return 0;

    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = scores.reduce((sum, s) => sum + s.score * s.weight, 0);
    const weightedAvg = weightedSum / totalWeight;
    const maxScore = Math.max(...scores.map((s) => s.score));

    return Math.min(100, Math.round(weightedAvg * 0.7 + maxScore * 0.3));
  }
}

// =============================================================================
// 默认审批配置工厂
// =============================================================================

/**
 * 默认审批配置工厂
 * 根据钱包层级和风险等级生成默认审批配置
 */
export class DefaultApprovalConfigFactory {
  /**
   * 根据钱包层级生成默认审批配置
   */
  static createForTier(tier: WalletTier, riskScore: number): ApprovalConfig {
    switch (tier) {
      case WalletTier.HOT:
        return this.createHotWalletApproval(riskScore);
      case WalletTier.WARM:
        return this.createWarmWalletApproval(riskScore);
      case WalletTier.COLD:
        return this.createColdWalletApproval(riskScore);
    }
  }

  private static createHotWalletApproval(riskScore: number): ApprovalConfig {
    if (riskScore >= 80) {
      return {
        mode: ApprovalMode.MULTIPLE,
        approvers: ['risk_manager', 'operation_manager'],
        timeoutSeconds: 3600,
        allowDelegation: true,
        approvalLevel: 3,
      };
    }
    if (riskScore >= 50) {
      return {
        mode: ApprovalMode.SINGLE,
        approvers: ['operation_manager'],
        timeoutSeconds: 7200,
        allowDelegation: true,
        approvalLevel: 2,
      };
    }
    return {
      mode: ApprovalMode.SINGLE,
      approvers: ['wallet_operator'],
      timeoutSeconds: 14400,
      allowDelegation: true,
      approvalLevel: 1,
    };
  }

  private static createWarmWalletApproval(riskScore: number): ApprovalConfig {
    if (riskScore >= 70) {
      return {
        mode: ApprovalMode.SEQUENTIAL,
        approvers: ['operation_manager', 'risk_manager', 'cfo'],
        timeoutSeconds: 86400,
        allowDelegation: false,
        approvalLevel: 4,
      };
    }
    return {
      mode: ApprovalMode.MULTIPLE,
      approvers: ['operation_manager', 'risk_manager'],
      timeoutSeconds: 43200,
      allowDelegation: true,
      approvalLevel: 3,
    };
  }

  private static createColdWalletApproval(riskScore: number): ApprovalConfig {
    return {
      mode: ApprovalMode.SEQUENTIAL,
      approvers: ['operation_manager', 'risk_manager', 'cfo', 'ceo'],
      requiredApprovals: 3,
      timeoutSeconds: 172800,
      allowDelegation: false,
      approvalLevel: 5,
    };
  }
}
