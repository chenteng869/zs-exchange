/**
 * 流速限制策略 (Velocity Limit Policy)
 *
 * 功能：
 *  - 单位时间内交易次数限制
 *  - 支持多种时间窗口（分钟/小时/天/周）
 *  - 支持按地址、用户、钱包多维度统计
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
// 流速限制策略参数接口
// =============================================================================

export interface VelocityLimitPolicyParams {
  /** 每分钟最大交易次数 */
  perMinuteLimit?: number;
  /** 每小时最大交易次数 */
  perHourLimit?: number;
  /** 每天最大交易次数 */
  perDayLimit?: number;
  /** 每周最大交易次数 */
  perWeekLimit?: number;
  /** 警告阈值比例 */
  warningThresholdRatio?: number;
  /** 审批阈值比例 */
  approvalThresholdRatio?: number;
  /** 统计维度：wallet / user / address */
  dimension: 'wallet' | 'user' | 'address';
  /** 是否包含失败交易 */
  includeFailedTransactions?: boolean;
  /** 适用的签名类型 */
  applicableSignTypes?: string[];
}

// =============================================================================
// 流速统计接口
// =============================================================================

interface VelocityStatistics {
  minuteCount: number;
  hourCount: number;
  dayCount: number;
  weekCount: number;
  lastMinuteReset: number;
  lastHourReset: number;
  lastDayReset: number;
  lastWeekReset: number;
}

// =============================================================================
// 流速限制策略评估器
// =============================================================================

export class VelocityLimitPolicyEvaluator extends BasePolicyEvaluator {
  readonly policyType = PolicyType.VELOCITY_LIMIT;

  private statisticsCache: Map<string, VelocityStatistics> = new Map();

  /**
   * 评估流速限制策略
   */
  async evaluate(
    policy: SignaturePolicy,
    context: PolicyEvaluationContext,
  ): Promise<PolicyEvaluationResult> {
    const params = this.parseParams(policy);

    if (params.applicableSignTypes && params.applicableSignTypes.length > 0) {
      if (!params.applicableSignTypes.includes(context.signType as string)) {
        return this.allow(policy, '签名类型不在流速限制范围内');
      }
    }

    const statsKey = this.getStatisticsKey(context, params.dimension);
    const stats = this.getStatistics(statsKey);

    const triggeredRules: string[] = [];
    let totalRiskScore = 0;
    let rejectReason: string | null = null;
    let approvalReason: string | null = null;
    let warnReason: string | null = null;

    const minuteCheck = this.checkLimit(
      stats.minuteCount,
      params.perMinuteLimit,
      '每分钟',
    );
    if (minuteCheck.reject) {
      rejectReason = rejectReason || minuteCheck.reason;
      triggeredRules.push('per_minute_limit_exceeded');
      totalRiskScore = Math.max(totalRiskScore, 100);
    } else if (minuteCheck.approval) {
      approvalReason = approvalReason || minuteCheck.reason;
      triggeredRules.push('per_minute_limit_approval');
      totalRiskScore = Math.max(totalRiskScore, 75);
    } else if (minuteCheck.warn) {
      warnReason = warnReason || minuteCheck.reason;
      triggeredRules.push('per_minute_limit_warn');
      totalRiskScore = Math.max(totalRiskScore, 35);
    }

    const hourCheck = this.checkLimit(
      stats.hourCount,
      params.perHourLimit,
      '每小时',
    );
    if (hourCheck.reject) {
      rejectReason = rejectReason || hourCheck.reason;
      triggeredRules.push('per_hour_limit_exceeded');
      totalRiskScore = Math.max(totalRiskScore, 90);
    } else if (hourCheck.approval) {
      approvalReason = approvalReason || hourCheck.reason;
      triggeredRules.push('per_hour_limit_approval');
      totalRiskScore = Math.max(totalRiskScore, 65);
    } else if (hourCheck.warn) {
      warnReason = warnReason || hourCheck.reason;
      triggeredRules.push('per_hour_limit_warn');
      totalRiskScore = Math.max(totalRiskScore, 30);
    }

    const dayCheck = this.checkLimit(
      stats.dayCount,
      params.perDayLimit,
      '每天',
    );
    if (dayCheck.reject) {
      rejectReason = rejectReason || dayCheck.reason;
      triggeredRules.push('per_day_limit_exceeded');
      totalRiskScore = Math.max(totalRiskScore, 80);
    } else if (dayCheck.approval) {
      approvalReason = approvalReason || dayCheck.reason;
      triggeredRules.push('per_day_limit_approval');
      totalRiskScore = Math.max(totalRiskScore, 55);
    } else if (dayCheck.warn) {
      warnReason = warnReason || dayCheck.reason;
      triggeredRules.push('per_day_limit_warn');
      totalRiskScore = Math.max(totalRiskScore, 25);
    }

    const weekCheck = this.checkLimit(
      stats.weekCount,
      params.perWeekLimit,
      '每周',
    );
    if (weekCheck.reject) {
      rejectReason = rejectReason || weekCheck.reason;
      triggeredRules.push('per_week_limit_exceeded');
      totalRiskScore = Math.max(totalRiskScore, 70);
    } else if (weekCheck.approval) {
      approvalReason = approvalReason || weekCheck.reason;
      triggeredRules.push('per_week_limit_approval');
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

    const result = this.allow(policy, '流速限制检查通过');
    result.triggeredRules = triggeredRules;
    return result;
  }

  /**
   * 解析策略参数
   */
  private parseParams(policy: SignaturePolicy): VelocityLimitPolicyParams {
    return {
      perMinuteLimit: this.getParam<number>(policy, 'perMinuteLimit', 0),
      perHourLimit: this.getParam<number>(policy, 'perHourLimit', 0),
      perDayLimit: this.getParam<number>(policy, 'perDayLimit', 0),
      perWeekLimit: this.getParam<number>(policy, 'perWeekLimit', 0),
      warningThresholdRatio: this.getParam<number>(policy, 'warningThresholdRatio', 0.7),
      approvalThresholdRatio: this.getParam<number>(policy, 'approvalThresholdRatio', 0.9),
      dimension: this.getParam<'wallet' | 'user' | 'address'>(policy, 'dimension', 'wallet'),
      includeFailedTransactions: this.getParam<boolean>(policy, 'includeFailedTransactions', false),
      applicableSignTypes: this.getParam<string[]>(policy, 'applicableSignTypes', []),
    };
  }

  /**
   * 获取统计键
   */
  private getStatisticsKey(
    context: PolicyEvaluationContext,
    dimension: 'wallet' | 'user' | 'address',
  ): string {
    switch (dimension) {
      case 'wallet':
        return `wallet:${context.wallet.id}`;
      case 'user':
        return `user:${context.userId}`;
      case 'address':
        return `address:${context.wallet.address}`;
      default:
        return `wallet:${context.wallet.id}`;
    }
  }

  /**
   * 获取统计数据
   */
  private getStatistics(key: string): VelocityStatistics {
    const now = Date.now();
    let stats = this.statisticsCache.get(key);

    if (!stats) {
      stats = this.createStatistics(now);
      this.statisticsCache.set(key, stats);
      return stats;
    }

    stats = this.resetExpiredCounters(stats, now);
    this.statisticsCache.set(key, stats);

    return stats;
  }

  /**
   * 创建新的统计对象
   */
  private createStatistics(now: number): VelocityStatistics {
    return {
      minuteCount: 0,
      hourCount: 0,
      dayCount: 0,
      weekCount: 0,
      lastMinuteReset: now,
      lastHourReset: now,
      lastDayReset: now,
      lastWeekReset: now,
    };
  }

  /**
   * 重置过期的计数器
   */
  private resetExpiredCounters(stats: VelocityStatistics, now: number): VelocityStatistics {
    const minuteMs = 60 * 1000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;
    const weekMs = 7 * dayMs;

    if (now - stats.lastMinuteReset >= minuteMs) {
      stats.minuteCount = 0;
      stats.lastMinuteReset = now;
    }

    if (now - stats.lastHourReset >= hourMs) {
      stats.hourCount = 0;
      stats.lastHourReset = now;
    }

    if (now - stats.lastDayReset >= dayMs) {
      stats.dayCount = 0;
      stats.lastDayReset = now;
    }

    if (now - stats.lastWeekReset >= weekMs) {
      stats.weekCount = 0;
      stats.lastWeekReset = now;
    }

    return stats;
  }

  /**
   * 检查限制
   */
  private checkLimit(
    currentCount: number,
    limit?: number,
    periodName?: string,
  ): { reject: boolean; approval: boolean; warn: boolean; reason: string } {
    if (!limit || limit <= 0) {
      return { reject: false, approval: false, warn: false, reason: '' };
    }

    const nextCount = currentCount + 1;

    if (nextCount > limit) {
      return {
        reject: true,
        approval: false,
        warn: false,
        reason: `${periodName}交易次数将达到 ${nextCount} 次，超过限制 ${limit} 次`,
      };
    }

    return { reject: false, approval: false, warn: false, reason: '' };
  }

  /**
   * 确定审批级别
   */
  private determineApprovalLevel(riskScore: number, tier: WalletTier): number {
    let baseLevel = 1;

    if (riskScore >= 80) baseLevel = 3;
    else if (riskScore >= 60) baseLevel = 2;
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
        return ['risk_manager'];
      case 4:
        return ['cfo'];
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
        return 3600;
      case 2:
        return 7200;
      case 3:
        return 14400;
      case 4:
        return 28800;
      case 5:
        return 86400;
      default:
        return 7200;
    }
  }

  /**
   * 记录一次交易
   */
  recordTransaction(context: PolicyEvaluationContext, dimension: 'wallet' | 'user' | 'address'): void {
    const key = this.getStatisticsKey(context, dimension);
    const now = Date.now();
    let stats = this.statisticsCache.get(key);

    if (!stats) {
      stats = this.createStatistics(now);
    } else {
      stats = this.resetExpiredCounters(stats, now);
    }

    stats.minuteCount += 1;
    stats.hourCount += 1;
    stats.dayCount += 1;
    stats.weekCount += 1;

    this.statisticsCache.set(key, stats);
  }

  /**
   * 获取当前流速统计
   */
  getVelocityStats(key: string): VelocityStatistics | undefined {
    return this.statisticsCache.get(key);
  }

  /**
   * 重置所有统计
   */
  resetAllStatistics(): void {
    this.statisticsCache.clear();
  }

  /**
   * 获取缓存的统计数量
   */
  getCachedStatsCount(): number {
    return this.statisticsCache.size;
  }
}
