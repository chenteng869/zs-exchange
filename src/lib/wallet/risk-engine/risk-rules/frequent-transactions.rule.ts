/**
 * 高频交易规则
 * 检测用户在短时间内的交易频率，防止异常操作和被盗用后的快速转移
 */

import {
  RiskRule,
  RiskRuleResult,
  RiskContext,
  RiskLevel,
  RiskAction,
  RuleCategory,
} from '../risk-engine.types';

/**
 * 交易记录接口
 */
interface TransactionRecord {
  txHash?: string;
  timestamp: Date;
  amount?: string;
  toAddress?: string;
}

/**
 * 高频交易规则类
 * 用于检测用户是否在短时间内进行了过多的交易
 */
export class FrequentTransactionsRule implements RiskRule {
  readonly ruleCode = 'FREQUENT_TRANSACTIONS';
  readonly ruleName = '高频交易检测';
  readonly description = '检测用户在短时间内的交易频率，防止异常操作和被盗用后的快速转移';
  readonly category = RuleCategory.BEHAVIOR;
  readonly priority = 70;
  readonly version = '1.0.0';

  enabled = true;
  parameters = {
    action: RiskAction.DELAY,
    threshold: 45,
    hourlyLimit: 10,
    dailyLimit: 100,
    minuteLimit: 5,
  };

  private userTransactions: Map<string, TransactionRecord[]> = new Map();

  private readonly RETENTION_PERIOD_MS = 24 * 60 * 60 * 1000;

  /**
   * 记录用户交易
   * @param userId 用户 ID
   * @param txHash 交易哈希
   * @param amount 交易金额
   * @param toAddress 收款地址
   */
  recordTransaction(userId: string, txHash?: string, amount?: string, toAddress?: string): void {
    const record: TransactionRecord = {
      txHash,
      timestamp: new Date(),
      amount,
      toAddress: toAddress?.toLowerCase(),
    };

    let records = this.userTransactions.get(userId);
    if (!records) {
      records = [];
      this.userTransactions.set(userId, records);
    }

    records.push(record);
    this.cleanupOldRecords(userId);
  }

  /**
   * 批量导入交易历史
   * @param userId 用户 ID
   * @param transactions 交易记录列表
   */
  importTransactions(userId: string, transactions: TransactionRecord[]): void {
    const normalized = transactions.map((tx) => ({
      ...tx,
      toAddress: tx.toAddress?.toLowerCase(),
    }));

    let records = this.userTransactions.get(userId);
    if (!records) {
      records = [];
      this.userTransactions.set(userId, records);
    }

    records.push(...normalized);
    records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    this.cleanupOldRecords(userId);
  }

  /**
   * 清理过期的交易记录
   * @param userId 用户 ID
   */
  private cleanupOldRecords(userId: string): void {
    const records = this.userTransactions.get(userId);
    if (!records) return;

    const cutoffTime = Date.now() - this.RETENTION_PERIOD_MS;
    const filtered = records.filter((tx) => tx.timestamp.getTime() > cutoffTime);
    this.userTransactions.set(userId, filtered);
  }

  /**
   * 获取用户指定时间范围内的交易数量
   * @param userId 用户 ID
   * @param durationMs 时间范围（毫秒）
   * @returns 交易数量
   */
  getTransactionCount(userId: string, durationMs: number): number {
    const records = this.userTransactions.get(userId);
    if (!records) return 0;

    const cutoffTime = Date.now() - durationMs;
    return records.filter((tx) => tx.timestamp.getTime() > cutoffTime).length;
  }

  /**
   * 获取用户交易统计
   * @param userId 用户 ID
   * @returns 统计信息
   */
  getTransactionStats(userId: string): {
    lastMinute: number;
    lastHour: number;
    lastDay: number;
    total: number;
  } {
    const records = this.userTransactions.get(userId) || [];
    const now = Date.now();

    return {
      lastMinute: records.filter((tx) => now - tx.timestamp.getTime() < 60 * 1000).length,
      lastHour: records.filter((tx) => now - tx.timestamp.getTime() < 60 * 60 * 1000).length,
      lastDay: records.filter((tx) => now - tx.timestamp.getTime() < 24 * 60 * 60 * 1000).length,
      total: records.length,
    };
  }

  /**
   * 设置频率限制
   * @param minuteLimit 每分钟限制
   * @param hourlyLimit 每小时限制
   * @param dailyLimit 每日限制
   */
  setLimits(minuteLimit: number, hourlyLimit: number, dailyLimit: number): void {
    this.parameters.minuteLimit = minuteLimit;
    this.parameters.hourlyLimit = hourlyLimit;
    this.parameters.dailyLimit = dailyLimit;
  }

  /**
   * 检测是否为高频交易
   * @param userId 用户 ID
   * @returns 检测结果
   */
  detectFrequentTransactions(userId: string): {
    isFrequent: boolean;
    level: RiskLevel;
    minuteCount: number;
    hourCount: number;
    dayCount: number;
    minuteLimit: number;
    hourlyLimit: number;
    dailyLimit: number;
    exceededLimits: string[];
  } {
    const stats = this.getTransactionStats(userId);
    const exceededLimits: string[] = [];

    const minuteLimit = this.parameters.minuteLimit || 5;
    const hourlyLimit = this.parameters.hourlyLimit || 10;
    const dailyLimit = this.parameters.dailyLimit || 100;

    if (stats.lastMinute > minuteLimit) {
      exceededLimits.push('minute');
    }
    if (stats.lastHour > hourlyLimit) {
      exceededLimits.push('hour');
    }
    if (stats.lastDay > dailyLimit) {
      exceededLimits.push('day');
    }

    let level = RiskLevel.LOW;
    if (exceededLimits.includes('minute')) {
      level = RiskLevel.HIGH;
    } else if (exceededLimits.includes('hour')) {
      level = RiskLevel.HIGH;
    } else if (exceededLimits.includes('day')) {
      level = RiskLevel.MEDIUM;
    }

    return {
      isFrequent: exceededLimits.length > 0,
      level,
      minuteCount: stats.lastMinute,
      hourCount: stats.lastHour,
      dayCount: stats.lastDay,
      minuteLimit,
      hourlyLimit,
      dailyLimit,
      exceededLimits,
    };
  }

  /**
   * 计算风险分数
   * @param detectionResult 检测结果
   * @returns 风险分数
   */
  private calculateScore(detectionResult: {
    isFrequent: boolean;
    level: RiskLevel;
    minuteCount: number;
    hourCount: number;
    exceededLimits: string[];
  }): number {
    if (!detectionResult.isFrequent) return 0;

    let score = this.parameters.threshold || 45;

    if (detectionResult.exceededLimits.includes('minute')) {
      const minuteRatio = detectionResult.minuteCount / (this.parameters.minuteLimit || 5);
      score += Math.min(minuteRatio * 20, 30);
    }

    if (detectionResult.exceededLimits.includes('hour')) {
      const hourRatio = detectionResult.hourCount / (this.parameters.hourlyLimit || 10);
      score += Math.min(hourRatio * 15, 20);
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * 确定动作
   * @param level 风险等级
   * @param exceededLimits 超出的限制
   */
  private determineAction(level: RiskLevel, exceededLimits: string[]): RiskAction {
    if (exceededLimits.includes('minute')) {
      return RiskAction.DELAY;
    }
    if (level === RiskLevel.HIGH) {
      return RiskAction.DELAY;
    }
    if (level === RiskLevel.MEDIUM) {
      return RiskAction.WARN;
    }
    return RiskAction.ALLOW;
  }

  /**
   * 清除用户交易记录
   * @param userId 用户 ID
   */
  clearUserTransactions(userId: string): boolean {
    return this.userTransactions.delete(userId);
  }

  /**
   * 清除所有交易记录
   */
  clearAllTransactions(): void {
    this.userTransactions.clear();
  }

  /**
   * 获取用户数量
   */
  getUserCount(): number {
    return this.userTransactions.size;
  }

  /**
   * 判断规则是否适用于当前上下文
   * @param context 风控上下文
   * @returns 是否适用
   */
  isApplicable(context: RiskContext): boolean {
    if (!this.enabled) return false;
    if (!context.userId) return false;
    return true;
  }

  /**
   * 执行规则评估
   * @param context 风控上下文
   * @returns 规则评估结果
   */
  async evaluate(context: RiskContext): Promise<RiskRuleResult> {
    const startTime = Date.now();

    if (!this.isApplicable(context)) {
      return this.createNotApplicableResult(startTime, '无用户信息');
    }

    const userId = context.userId || '';
    const detectionResult = this.detectFrequentTransactions(userId);

    if (detectionResult.isFrequent) {
      const score = this.calculateScore(detectionResult);
      const action = this.determineAction(detectionResult.level, detectionResult.exceededLimits);

      const reasonParts: string[] = [];
      if (detectionResult.exceededLimits.includes('minute')) {
        reasonParts.push(`每分钟交易 ${detectionResult.minuteCount} 次（限制 ${detectionResult.minuteLimit} 次）`);
      }
      if (detectionResult.exceededLimits.includes('hour')) {
        reasonParts.push(`每小时交易 ${detectionResult.hourCount} 次（限制 ${detectionResult.hourlyLimit} 次）`);
      }
      if (detectionResult.exceededLimits.includes('day')) {
        reasonParts.push(`每日交易 ${detectionResult.dayCount} 次（限制 ${detectionResult.dailyLimit} 次）`);
      }

      return {
        ruleCode: this.ruleCode,
        ruleName: this.ruleName,
        category: this.category,
        matched: true,
        score,
        level: detectionResult.level,
        action,
        reason: `检测到高频交易：${reasonParts.join('，')}，请稍后再试`,
        detail: {
          minuteCount: detectionResult.minuteCount,
          hourCount: detectionResult.hourCount,
          dayCount: detectionResult.dayCount,
          minuteLimit: detectionResult.minuteLimit,
          hourlyLimit: detectionResult.hourlyLimit,
          dailyLimit: detectionResult.dailyLimit,
          exceededLimits: detectionResult.exceededLimits,
        },
        priority: this.priority,
        evaluationTime: Date.now() - startTime,
      };
    }

    return {
      ruleCode: this.ruleCode,
      ruleName: this.ruleName,
      category: this.category,
      matched: false,
      score: 0,
      level: RiskLevel.LOW,
      action: RiskAction.ALLOW,
      detail: {
        hourCount: detectionResult.hourCount,
        dayCount: detectionResult.dayCount,
      },
      priority: this.priority,
      evaluationTime: Date.now() - startTime,
    };
  }

  /**
   * 创建不适用的结果
   * @param startTime 开始时间
   * @param reason 原因
   * @returns 规则结果
   */
  private createNotApplicableResult(startTime: number, reason: string): RiskRuleResult {
    return {
      ruleCode: this.ruleCode,
      ruleName: this.ruleName,
      category: this.category,
      matched: false,
      score: 0,
      level: RiskLevel.LOW,
      action: RiskAction.ALLOW,
      reason: `规则不适用（${reason}）`,
      priority: this.priority,
      evaluationTime: Date.now() - startTime,
    };
  }
}

export const frequentTransactionsRule = new FrequentTransactionsRule();
