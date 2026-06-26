/**
 * 行为维度评分器
 * 从用户行为模式角度评估风险，包括交易频率、交易时间、交易习惯等
 */

import {
  RiskContext,
  DimensionScore,
  ScoreDimension,
  RiskLevel,
} from '../risk-engine.types';

/**
 * 用户行为统计接口
 */
interface UserBehaviorStats {
  hourlyTransactionCount: number;
  dailyTransactionCount: number;
  weeklyTransactionCount: number;
  averageTransactionAmount: number;
  usualActiveHours: number[];
  usualActiveDays: number[];
  lastTransactionTime?: Date;
}

/**
 * 行为维度评分器类
 * 用于从用户行为模式角度计算风险评分
 */
export class BehaviorScorer {
  readonly dimension = ScoreDimension.BEHAVIOR;
  readonly dimensionName = '行为维度';

  private weight = 0.15;

  private hourlyLimit = 10;
  private dailyLimit = 100;

  private userBehaviorData: Map<string, UserBehaviorStats> = new Map();
  private userTransactionHistory: Map<string, Array<{ timestamp: Date; amount: number; toAddress: string }>> =
    new Map();

  private readonly HISTORY_RETENTION_DAYS = 30;

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
   * 设置频率限制
   * @param hourly 每小时限制
   * @param daily 每日限制
   */
  setFrequencyLimits(hourly: number, daily: number): void {
    this.hourlyLimit = hourly;
    this.dailyLimit = daily;
  }

  /**
   * 记录用户交易
   * @param userId 用户 ID
   * @param amount 金额
   * @param toAddress 收款地址
   */
  recordTransaction(userId: string, amount: number, toAddress: string): void {
    const now = new Date();

    let history = this.userTransactionHistory.get(userId);
    if (!history) {
      history = [];
      this.userTransactionHistory.set(userId, history);
    }

    history.push({
      timestamp: now,
      amount,
      toAddress: toAddress.toLowerCase(),
    });

    this.cleanupOldTransactions(userId);
    this.updateBehaviorStats(userId);
  }

  /**
   * 清理过期的交易记录
   * @param userId 用户 ID
   */
  private cleanupOldTransactions(userId: string): void {
    const history = this.userTransactionHistory.get(userId);
    if (!history) return;

    const cutoffTime = Date.now() - this.HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const filtered = history.filter((tx) => tx.timestamp.getTime() > cutoffTime);
    this.userTransactionHistory.set(userId, filtered);
  }

  /**
   * 更新用户行为统计
   * @param userId 用户 ID
   */
  private updateBehaviorStats(userId: string): void {
    const history = this.userTransactionHistory.get(userId) || [];
    const now = new Date();

    const oneHourAgo = now.getTime() - 60 * 60 * 1000;
    const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    const hourlyTxs = history.filter((tx) => tx.timestamp.getTime() > oneHourAgo);
    const dailyTxs = history.filter((tx) => tx.timestamp.getTime() > oneDayAgo);
    const weeklyTxs = history.filter((tx) => tx.timestamp.getTime() > oneWeekAgo);

    const totalAmount = dailyTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const avgAmount = dailyTxs.length > 0 ? totalAmount / dailyTxs.length : 0;

    const hourCounts = new Map<number, number>();
    const dayCounts = new Map<number, number>();

    for (const tx of weeklyTxs) {
      const hour = tx.timestamp.getHours();
      const day = tx.timestamp.getDay();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    }

    const usualActiveHours: number[] = [];
    const avgHourly = weeklyTxs.length / (7 * 24);
    hourCounts.forEach((count, hour) => {
      if (count > avgHourly * 1.5) {
        usualActiveHours.push(hour);
      }
    });

    const usualActiveDays: number[] = [];
    const avgDaily = weeklyTxs.length / 7;
    dayCounts.forEach((count, day) => {
      if (count > avgDaily * 1.3) {
        usualActiveDays.push(day);
      }
    });

    const stats: UserBehaviorStats = {
      hourlyTransactionCount: hourlyTxs.length,
      dailyTransactionCount: dailyTxs.length,
      weeklyTransactionCount: weeklyTxs.length,
      averageTransactionAmount: avgAmount,
      usualActiveHours,
      usualActiveDays,
      lastTransactionTime: history.length > 0 ? history[history.length - 1].timestamp : undefined,
    };

    this.userBehaviorData.set(userId, stats);
  }

  /**
   * 获取用户行为统计
   * @param userId 用户 ID
   */
  getBehaviorStats(userId: string): UserBehaviorStats | null {
    return this.userBehaviorData.get(userId) || null;
  }

  /**
   * 计算交易频率风险分
   * @param stats 行为统计
   */
  private calculateFrequencyScore(stats: UserBehaviorStats): {
    score: number;
    details: string[];
  } {
    let score = 0;
    const details: string[] = [];

    if (stats.hourlyTransactionCount > this.hourlyLimit) {
      const ratio = stats.hourlyTransactionCount / this.hourlyLimit;
      score += Math.min(ratio * 25, 40);
      details.push(
        `每小时交易 ${stats.hourlyTransactionCount} 次（限制 ${this.hourlyLimit} 次）`
      );
    }

    if (stats.dailyTransactionCount > this.dailyLimit) {
      const ratio = stats.dailyTransactionCount / this.dailyLimit;
      score += Math.min(ratio * 15, 25);
      details.push(
        `每日交易 ${stats.dailyTransactionCount} 次（限制 ${this.dailyLimit} 次）`
      );
    }

    return { score, details };
  }

  /**
   * 计算交易时间异常风险分
   * @param stats 行为统计
   * @param currentTime 当前时间
   */
  private calculateTimeAnomalyScore(
    stats: UserBehaviorStats,
    currentTime: Date
  ): {
    score: number;
    details: string[];
  } {
    let score = 0;
    const details: string[] = [];

    const currentHour = currentTime.getHours();
    const currentDay = currentTime.getDay();

    const isUsualHour = stats.usualActiveHours.includes(currentHour);
    const isUsualDay = stats.usualActiveDays.includes(currentDay);

    if (stats.usualActiveHours.length > 0 && !isUsualHour) {
      score += 15;
      details.push(`交易时间（${currentHour}时）不在用户通常活跃时段`);
    }

    if (stats.usualActiveDays.length > 0 && !isUsualDay) {
      score += 10;
      details.push(`交易日（周${currentDay}）不在用户通常活跃日`);
    }

    if (stats.lastTransactionTime) {
      const timeSinceLastTx = currentTime.getTime() - stats.lastTransactionTime.getTime();
      if (timeSinceLastTx > 7 * 24 * 60 * 60 * 1000 && stats.weeklyTransactionCount > 0) {
        score += 10;
        details.push('长时间未交易后的首次交易');
      }
    }

    return { score, details };
  }

  /**
   * 计算金额异常风险分
   * @param stats 行为统计
   * @param currentAmount 当前交易金额
   */
  private calculateAmountAnomalyScore(
    stats: UserBehaviorStats,
    currentAmount: number
  ): {
    score: number;
    details: string[];
  } {
    if (currentAmount <= 0 || stats.averageTransactionAmount <= 0) {
      return { score: 0, details: [] };
    }

    const ratio = currentAmount / stats.averageTransactionAmount;
    let score = 0;
    const details: string[] = [];

    if (ratio >= 10) {
      score = 35;
      details.push(`交易金额远大于用户平均水平（${ratio.toFixed(1)}倍）`);
    } else if (ratio >= 5) {
      score = 25;
      details.push(`交易金额显著大于用户平均水平（${ratio.toFixed(1)}倍）`);
    } else if (ratio >= 3) {
      score = 15;
      details.push(`交易金额大于用户平均水平（${ratio.toFixed(1)}倍）`);
    }

    return { score, details };
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
      return '用户行为符合正常模式';
    }
    return `行为维度风险评分：${score} 分`;
  }

  /**
   * 执行行为维度评分
   * @param context 风控上下文
   * @returns 维度评分结果
   */
  score(context: RiskContext): DimensionScore {
    if (!context.userId) {
      return {
        dimension: this.dimension,
        dimensionName: this.dimensionName,
        score: 0,
        weight: this.weight,
        weightedScore: 0,
        level: RiskLevel.LOW,
        description: '无用户信息，行为维度不评分',
        details: {},
      };
    }

    const userId = context.userId;
    const stats = this.getBehaviorStats(userId);

    if (!stats || stats.weeklyTransactionCount === 0) {
      return {
        dimension: this.dimension,
        dimensionName: this.dimensionName,
        score: 10,
        weight: this.weight,
        weightedScore: Math.round(10 * this.weight * 100) / 100,
        level: RiskLevel.LOW,
        description: '新用户或无足够历史数据，无法进行行为分析',
        details: {
          isNewUser: true,
        },
      };
    }

    let totalScore = 0;
    const allDetails: string[] = [];

    const frequencyResult = this.calculateFrequencyScore(stats);
    totalScore += frequencyResult.score;
    allDetails.push(...frequencyResult.details);

    const timeResult = this.calculateTimeAnomalyScore(stats, new Date());
    totalScore += timeResult.score;
    allDetails.push(...timeResult.details);

    const currentAmount = context.transaction?.value
      ? parseFloat(context.transaction.value)
      : 0;
    const amountResult = this.calculateAmountAnomalyScore(stats, currentAmount);
    totalScore += amountResult.score;
    allDetails.push(...amountResult.details);

    const score = Math.min(Math.round(totalScore), 100);
    const level = this.assessRiskLevel(score);
    const weightedScore = Math.round(score * this.weight * 100) / 100;

    return {
      dimension: this.dimension,
      dimensionName: this.dimensionName,
      score,
      weight: this.weight,
      weightedScore,
      level,
      description: this.generateDescription(score, allDetails),
      details: {
        hourlyCount: stats.hourlyTransactionCount,
        dailyCount: stats.dailyTransactionCount,
        weeklyCount: stats.weeklyTransactionCount,
        avgAmount: stats.averageTransactionAmount,
        usualActiveHours: stats.usualActiveHours.length,
        usualActiveDays: stats.usualActiveDays.length,
      },
    };
  }
}

export const behaviorScorer = new BehaviorScorer();
