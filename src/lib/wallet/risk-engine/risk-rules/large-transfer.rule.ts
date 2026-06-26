/**
 * 大额转账规则
 * 检测转账金额是否超过阈值，对大额转账进行风险提示和二次确认
 */

import {
  RiskRule,
  RiskRuleResult,
  RiskContext,
  RiskLevel,
  RiskAction,
  RuleCategory,
  ChainType,
} from '../risk-engine.types';

/**
 * 大额转账规则类
 * 用于检测转账金额是否超过设定的阈值
 */
export class LargeTransferRule implements RiskRule {
  readonly ruleCode = 'LARGE_TRANSFER';
  readonly ruleName = '大额转账检测';
  readonly description = '检测转账金额是否超过阈值，对大额转账进行风险提示和二次确认';
  readonly category = RuleCategory.AMOUNT;
  readonly priority = 80;
  readonly version = '1.0.0';

  enabled = true;
  parameters = {
    action: RiskAction.SECOND_CONFIRM,
    threshold: 35,
  };

  private amountThresholds: Partial<Record<ChainType, string>> = {
    [ChainType.EVM]: '1000',
    [ChainType.SOLANA]: '100',
    [ChainType.BITCOIN]: '1',
    [ChainType.TRON]: '100000',
  };

  private whitelistAddresses: Set<string> = new Set();

  /**
   * 设置指定链的大额转账阈值
   * @param chain 链类型
   * @param threshold 阈值
   */
  setThreshold(chain: ChainType, threshold: string): void {
    this.amountThresholds[chain] = threshold;
  }

  /**
   * 获取指定链的大额转账阈值
   * @param chain 链类型
   * @returns 阈值
   */
  getThreshold(chain: ChainType): string {
    return this.amountThresholds[chain] || '1000';
  }

  /**
   * 批量设置阈值
   * @param thresholds 阈值配置
   */
  setThresholds(thresholds: Partial<Record<ChainType, string>>): void {
    Object.assign(this.amountThresholds, thresholds);
  }

  /**
   * 添加白名单地址（大额转账豁免）
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
   * 检查地址是否在白名单中
   * @param address 地址
   */
  isWhitelisted(address: string): boolean {
    return this.whitelistAddresses.has(address.toLowerCase());
  }

  /**
   * 获取白名单地址数量
   */
  getWhitelistCount(): number {
    return this.whitelistAddresses.size;
  }

  /**
   * 获取所有白名单地址
   */
  getWhitelistAddresses(): string[] {
    return Array.from(this.whitelistAddresses);
  }

  /**
   * 清空白名单
   */
  clearWhitelist(): void {
    this.whitelistAddresses.clear();
  }

  /**
   * 获取交易金额
   * @param context 风控上下文
   * @returns 金额字符串
   */
  private getTransferAmount(context: RiskContext): string | null {
    if (context.transaction?.value) {
      return context.transaction.value;
    }

    if (context.assets && context.assets.length > 0) {
      const primaryAsset = context.assets[0];
      if (primaryAsset.amount) {
        return primaryAsset.amount;
      }
    }

    return null;
  }

  /**
   * 获取收款地址
   * @param context 风控上下文
   * @returns 收款地址
   */
  private getToAddress(context: RiskContext): string | null {
    return context.transaction?.to || null;
  }

  /**
   * 判断金额是否超过阈值
   * @param amount 金额
   * @param chain 链类型
   * @returns 是否大额
   */
  isLargeAmount(amount: string, chain: ChainType): {
    isLarge: boolean;
    threshold: string;
    ratio: number;
    level: RiskLevel;
  } {
    try {
      const value = parseFloat(amount);
      const thresholdStr = this.amountThresholds[chain] || '1000';
      const threshold = parseFloat(thresholdStr);

      if (isNaN(value) || isNaN(threshold) || threshold <= 0) {
        return { isLarge: false, threshold: thresholdStr, ratio: 0, level: RiskLevel.LOW };
      }

      const ratio = value / threshold;

      let level = RiskLevel.LOW;
      if (ratio >= 10) {
        level = RiskLevel.CRITICAL;
      } else if (ratio >= 5) {
        level = RiskLevel.HIGH;
      } else if (ratio >= 2) {
        level = RiskLevel.HIGH;
      } else if (ratio >= 1) {
        level = RiskLevel.MEDIUM;
      }

      return {
        isLarge: ratio >= 1,
        threshold: thresholdStr,
        ratio,
        level,
      };
    } catch {
      return { isLarge: false, threshold: '0', ratio: 0, level: RiskLevel.LOW };
    }
  }

  /**
   * 计算风险分数
   * @param ratio 金额与阈值的比率
   * @returns 风险分数 0-100
   */
  private calculateScore(ratio: number): number {
    if (ratio <= 0) return 0;
    if (ratio >= 10) return 100;
    if (ratio >= 5) return 80 + ((ratio - 5) / 5) * 20;
    if (ratio >= 2) return 60 + ((ratio - 2) / 3) * 20;
    if (ratio >= 1) return 35 + ((ratio - 1) / 1) * 25;
    return ratio * 35;
  }

  /**
   * 确定风险动作
   * @param level 风险等级
   * @returns 风险动作
   */
  private determineAction(level: RiskLevel): RiskAction {
    switch (level) {
      case RiskLevel.CRITICAL:
        return RiskAction.MANUAL_REVIEW;
      case RiskLevel.HIGH:
        return RiskAction.SECOND_CONFIRM;
      case RiskLevel.MEDIUM:
        return RiskAction.SECOND_CONFIRM;
      default:
        return RiskAction.ALLOW;
    }
  }

  /**
   * 判断规则是否适用于当前上下文
   * @param context 风控上下文
   * @returns 是否适用
   */
  isApplicable(context: RiskContext): boolean {
    if (!this.enabled) return false;

    const amount = this.getTransferAmount(context);
    if (!amount) return false;

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
      return this.createNotApplicableResult(startTime, '无转账金额');
    }

    const amount = this.getTransferAmount(context) || '0';
    const toAddress = this.getToAddress(context);

    if (toAddress && this.isWhitelisted(toAddress)) {
      return {
        ruleCode: this.ruleCode,
        ruleName: this.ruleName,
        category: this.category,
        matched: false,
        score: 0,
        level: RiskLevel.LOW,
        action: RiskAction.ALLOW,
        reason: '收款地址在白名单中，豁免大额转账检测',
        detail: {
          amount,
          whitelisted: true,
          toAddress,
        },
        priority: this.priority,
        evaluationTime: Date.now() - startTime,
      };
    }

    const largeAmountResult = this.isLargeAmount(amount, context.chainType);

    if (largeAmountResult.isLarge) {
      const score = Math.round(this.calculateScore(largeAmountResult.ratio));
      const action = this.determineAction(largeAmountResult.level);

      return {
        ruleCode: this.ruleCode,
        ruleName: this.ruleName,
        category: this.category,
        matched: true,
        score,
        level: largeAmountResult.level,
        action,
        reason: `转账金额较大（${amount}），为阈值的 ${largeAmountResult.ratio.toFixed(1)} 倍，请确认后再操作`,
        detail: {
          amount,
          threshold: largeAmountResult.threshold,
          ratio: largeAmountResult.ratio,
          chainType: context.chainType,
          toAddress,
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

export const largeTransferRule = new LargeTransferRule();
