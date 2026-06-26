/**
 * 金额限制策略 (Amount Limit Policy)
 *
 * 功能：
 *  - 单笔交易金额限制
 *  - 每日累计金额限制
 *  - 每周累计金额限制
 *  - 每月累计金额限制
 *  - 支持多代币分别配置
 *  - 支持分级阈值（警告/审批/拒绝）
 */

import {
  PolicyType,
  SignaturePolicy,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  ApprovalMode,
  WalletTier,
} from '../../mpc.types';
import { BasePolicyEvaluator } from '../policy-evaluator';

// =============================================================================
// 金额限制策略参数接口
// =============================================================================

export interface AmountLimitPolicyParams {
  /** 单笔限额 */
  singleTransactionLimit?: string;
  /** 每日限额 */
  dailyLimit?: string;
  /** 每周限额 */
  weeklyLimit?: string;
  /** 每月限额 */
  monthlyLimit?: string;
  /** 警告阈值比例（达到限额的多少比例时发出警告） */
  warningThresholdRatio?: number;
  /** 审批阈值比例（达到限额的多少比例时需要审批） */
  approvalThresholdRatio?: number;
  /** 适用的代币符号（空表示所有代币） */
  tokenSymbols?: string[];
  /** 各代币独立限额配置 */
  tokenLimits?: Record<string, TokenAmountLimit>;
  /** 是否包含 Gas 费用 */
  includeGasFee?: boolean;
}

/**
 * 单代币限额配置
 */
export interface TokenAmountLimit {
  symbol: string;
  singleTransactionLimit?: string;
  dailyLimit?: string;
  weeklyLimit?: string;
  monthlyLimit?: string;
}

// =============================================================================
// 累计金额统计接口
// =============================================================================

interface AmountStatistics {
  todayAmount: string;
  weekAmount: string;
  monthAmount: string;
  todayCount: number;
  weekCount: number;
  monthCount: number;
}

// =============================================================================
// 金额限制策略评估器
// =============================================================================

export class AmountLimitPolicyEvaluator extends BasePolicyEvaluator {
  readonly policyType = PolicyType.AMOUNT_LIMIT;

  private statisticsCache: Map<string, AmountStatistics> = new Map();

  /**
   * 评估金额限制策略
   */
  async evaluate(
    policy: SignaturePolicy,
    context: PolicyEvaluationContext,
  ): Promise<PolicyEvaluationResult> {
    const params = this.parseParams(policy);

    const amount = context.amount || '0';
    const tokenSymbol = context.tokenSymbol || 'NATIVE';

    if (BigInt(amount) === BigInt(0)) {
      return this.allow(policy, '交易金额为零，跳过金额限制检查');
    }

    if (!this.isTokenApplicable(tokenSymbol, params)) {
      return this.allow(policy, `代币 ${tokenSymbol} 不在策略范围内`);
    }

    const tokenLimit = this.getTokenLimit(tokenSymbol, params);
    const stats = this.getStatistics(context.wallet.id, tokenSymbol);
    const triggeredRules: string[] = [];

    let totalRiskScore = 0;
    let rejectReason: string | null = null;
    let approvalReason: string | null = null;
    let warnReason: string | null = null;

    const singleCheck = this.checkSingleTransactionLimit(
      amount,
      tokenLimit.singleTransactionLimit,
      tokenSymbol,
    );
    if (singleCheck.reject) {
      rejectReason = singleCheck.reason;
      triggeredRules.push('single_tx_limit_exceeded');
      totalRiskScore = Math.max(totalRiskScore, 100);
    } else if (singleCheck.approval) {
      approvalReason = singleCheck.reason;
      triggeredRules.push('single_tx_limit_approval');
      totalRiskScore = Math.max(totalRiskScore, 70);
    } else if (singleCheck.warn) {
      warnReason = singleCheck.reason;
      triggeredRules.push('single_tx_limit_warn');
      totalRiskScore = Math.max(totalRiskScore, 30);
    }

    const dailyCheck = this.checkPeriodLimit(
      amount,
      stats.todayAmount,
      tokenLimit.dailyLimit,
      '每日',
      tokenSymbol,
    );
    if (dailyCheck.reject) {
      rejectReason = rejectReason || dailyCheck.reason;
      triggeredRules.push('daily_limit_exceeded');
      totalRiskScore = Math.max(totalRiskScore, 90);
    } else if (dailyCheck.approval) {
      approvalReason = approvalReason || dailyCheck.reason;
      triggeredRules.push('daily_limit_approval');
      totalRiskScore = Math.max(totalRiskScore, 60);
    } else if (dailyCheck.warn) {
      warnReason = warnReason || dailyCheck.reason;
      triggeredRules.push('daily_limit_warn');
      totalRiskScore = Math.max(totalRiskScore, 25);
    }

    const weeklyCheck = this.checkPeriodLimit(
      amount,
      stats.weekAmount,
      tokenLimit.weeklyLimit,
      '每周',
      tokenSymbol,
    );
    if (weeklyCheck.reject) {
      rejectReason = rejectReason || weeklyCheck.reason;
      triggeredRules.push('weekly_limit_exceeded');
      totalRiskScore = Math.max(totalRiskScore, 85);
    } else if (weeklyCheck.approval) {
      approvalReason = approvalReason || weeklyCheck.reason;
      triggeredRules.push('weekly_limit_approval');
      totalRiskScore = Math.max(totalRiskScore, 55);
    }

    const monthlyCheck = this.checkPeriodLimit(
      amount,
      stats.monthAmount,
      tokenLimit.monthlyLimit,
      '每月',
      tokenSymbol,
    );
    if (monthlyCheck.reject) {
      rejectReason = rejectReason || monthlyCheck.reason;
      triggeredRules.push('monthly_limit_exceeded');
      totalRiskScore = Math.max(totalRiskScore, 80);
    } else if (monthlyCheck.approval) {
      approvalReason = approvalReason || monthlyCheck.reason;
      triggeredRules.push('monthly_limit_approval');
      totalRiskScore = Math.max(totalRiskScore, 50);
    }

    if (rejectReason) {
      const result = this.reject(policy, rejectReason, totalRiskScore);
      result.triggeredRules = triggeredRules;
      return result;
    }

    if (approvalReason) {
      const approvalLevel = this.determineApprovalLevel(totalRiskScore, context.wallet.tier);
      const result = this.requireApproval(
        policy,
        approvalReason,
        {
          mode: ApprovalMode.SINGLE,
          approvers: this.getApproversByLevel(approvalLevel),
          timeoutSeconds: this.getTimeoutByLevel(approvalLevel),
          allowDelegation: approvalLevel < 4,
          approvalLevel,
        },
        totalRiskScore,
      );
      result.triggeredRules = triggeredRules;
      return result;
    }

    if (warnReason) {
      const result = this.warn(policy, warnReason, totalRiskScore);
      result.triggeredRules = triggeredRules;
      return result;
    }

    const result = this.allow(policy, '金额限制检查通过');
    result.triggeredRules = triggeredRules;
    return result;
  }

  /**
   * 解析策略参数
   */
  private parseParams(policy: SignaturePolicy): AmountLimitPolicyParams {
    return {
      singleTransactionLimit: this.getParam<string>(policy, 'singleTransactionLimit', ''),
      dailyLimit: this.getParam<string>(policy, 'dailyLimit', ''),
      weeklyLimit: this.getParam<string>(policy, 'weeklyLimit', ''),
      monthlyLimit: this.getParam<string>(policy, 'monthlyLimit', ''),
      warningThresholdRatio: this.getParam<number>(policy, 'warningThresholdRatio', 0.7),
      approvalThresholdRatio: this.getParam<number>(policy, 'approvalThresholdRatio', 0.9),
      tokenSymbols: this.getParam<string[]>(policy, 'tokenSymbols', []),
      tokenLimits: this.getParam<Record<string, TokenAmountLimit>>(policy, 'tokenLimits', {}),
      includeGasFee: this.getParam<boolean>(policy, 'includeGasFee', false),
    };
  }

  /**
   * 检查代币是否适用
   */
  private isTokenApplicable(tokenSymbol: string, params: AmountLimitPolicyParams): boolean {
    if (!params.tokenSymbols || params.tokenSymbols.length === 0) {
      return true;
    }
    return params.tokenSymbols.includes(tokenSymbol);
  }

  /**
   * 获取代币限额配置
   */
  private getTokenLimit(tokenSymbol: string, params: AmountLimitPolicyParams): TokenAmountLimit {
    if (params.tokenLimits && params.tokenLimits[tokenSymbol]) {
      return params.tokenLimits[tokenSymbol];
    }
    return {
      symbol: tokenSymbol,
      singleTransactionLimit: params.singleTransactionLimit,
      dailyLimit: params.dailyLimit,
      weeklyLimit: params.weeklyLimit,
      monthlyLimit: params.monthlyLimit,
    };
  }

  /**
   * 检查单笔交易限额
   */
  private checkSingleTransactionLimit(
    amount: string,
    limit?: string,
    tokenSymbol?: string,
  ): { reject: boolean; approval: boolean; warn: boolean; reason: string } {
    if (!limit || BigInt(limit) === BigInt(0)) {
      return { reject: false, approval: false, warn: false, reason: '' };
    }

    const amt = BigInt(amount);
    const lim = BigInt(limit);

    if (amt > lim) {
      return {
        reject: true,
        approval: false,
        warn: false,
        reason: `单笔交易金额 ${this.formatAmount(amount)} ${tokenSymbol} 超过限额 ${this.formatAmount(limit)} ${tokenSymbol}`,
      };
    }

    return { reject: false, approval: false, warn: false, reason: '' };
  }

  /**
   * 检查周期限额
   */
  private checkPeriodLimit(
    amount: string,
    currentAmount: string,
    limit?: string,
    periodName?: string,
    tokenSymbol?: string,
  ): { reject: boolean; approval: boolean; warn: boolean; reason: string } {
    if (!limit || BigInt(limit) === BigInt(0)) {
      return { reject: false, approval: false, warn: false, reason: '' };
    }

    const amt = BigInt(amount);
    const curr = BigInt(currentAmount);
    const lim = BigInt(limit);
    const total = curr + amt;

    if (total > lim) {
      return {
        reject: true,
        approval: false,
        warn: false,
        reason: `${periodName}累计金额将达到 ${this.formatAmount(total.toString())} ${tokenSymbol}，超过限额 ${this.formatAmount(limit)} ${tokenSymbol}`,
      };
    }

    return { reject: false, approval: false, warn: false, reason: '' };
  }

  /**
   * 获取统计数据
   */
  private getStatistics(walletId: string, tokenSymbol: string): AmountStatistics {
    const key = `${walletId}:${tokenSymbol}`;
    const cached = this.statisticsCache.get(key);
    if (cached) return cached;

    const stats: AmountStatistics = {
      todayAmount: '0',
      weekAmount: '0',
      monthAmount: '0',
      todayCount: 0,
      weekCount: 0,
      monthCount: 0,
    };

    this.statisticsCache.set(key, stats);
    return stats;
  }

  /**
   * 确定审批级别
   */
  private determineApprovalLevel(riskScore: number, tier: WalletTier): number {
    let baseLevel = 1;

    if (riskScore >= 80) baseLevel = 4;
    else if (riskScore >= 60) baseLevel = 3;
    else if (riskScore >= 40) baseLevel = 2;

    if (tier === WalletTier.COLD) baseLevel = Math.min(5, baseLevel + 2);
    else if (tier === WalletTier.WARM) baseLevel = Math.min(4, baseLevel + 1);

    return baseLevel;
  }

  /**
   * 根据级别获取审批人
   */
  private getApproversByLevel(level: number): string[] {
    switch (level) {
      case 1:
        return ['wallet_operator'];
      case 2:
        return ['operation_manager'];
      case 3:
        return ['risk_manager', 'operation_manager'];
      case 4:
        return ['cfo', 'risk_manager'];
      case 5:
        return ['ceo', 'cfo'];
      default:
        return ['operation_manager'];
    }
  }

  /**
   * 根据级别获取超时时间
   */
  private getTimeoutByLevel(level: number): number {
    switch (level) {
      case 1:
        return 14400;
      case 2:
        return 7200;
      case 3:
        return 3600;
      case 4:
        return 7200;
      case 5:
        return 86400;
      default:
        return 7200;
    }
  }

  /**
   * 格式化金额显示
   */
  private formatAmount(amount: string): string {
    try {
      const amt = BigInt(amount);
      if (amt >= BigInt('1000000000000000000')) {
        return (Number(amt) / 1e18).toFixed(4);
      }
      if (amt >= BigInt('1000000')) {
        return (Number(amt) / 1e6).toFixed(4);
      }
      return amount;
    } catch {
      return amount;
    }
  }

  /**
   * 更新统计数据
   */
  updateStatistics(walletId: string, tokenSymbol: string, amount: string): void {
    const key = `${walletId}:${tokenSymbol}`;
    const stats = this.statisticsCache.get(key) || {
      todayAmount: '0',
      weekAmount: '0',
      monthAmount: '0',
      todayCount: 0,
      weekCount: 0,
      monthCount: 0,
    };

    stats.todayAmount = (BigInt(stats.todayAmount) + BigInt(amount)).toString();
    stats.weekAmount = (BigInt(stats.weekAmount) + BigInt(amount)).toString();
    stats.monthAmount = (BigInt(stats.monthAmount) + BigInt(amount)).toString();
    stats.todayCount += 1;
    stats.weekCount += 1;
    stats.monthCount += 1;

    this.statisticsCache.set(key, stats);
  }

  /**
   * 重置统计缓存
   */
  resetStatistics(): void {
    this.statisticsCache.clear();
  }
}
