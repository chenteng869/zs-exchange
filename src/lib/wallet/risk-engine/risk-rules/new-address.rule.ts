/**
 * 新地址交互规则
 * 检测是否向新地址转账或与新合约交互，提醒用户确认地址正确性
 */

import {
  RiskRule,
  RiskRuleResult,
  RiskContext,
  RiskLevel,
  RiskAction,
  RuleCategory,
  SignType,
} from '../risk-engine.types';

/**
 * 交互记录接口
 */
interface InteractionRecord {
  address: string;
  count: number;
  firstInteraction: Date;
  lastInteraction: Date;
  amountSum: string;
}

/**
 * 新地址交互规则类
 * 用于检测用户是否与新地址进行首次交互
 */
export class NewAddressRule implements RiskRule {
  readonly ruleCode = 'NEW_ADDRESS';
  readonly ruleName = '新地址交互检测';
  readonly description = '检测是否向新地址转账或与新合约交互，提醒用户确认地址正确性';
  readonly category = RuleCategory.ADDRESS;
  readonly priority = 75;
  readonly version = '1.0.0';

  enabled = true;
  parameters = {
    action: RiskAction.SECOND_CONFIRM,
    threshold: 30,
    interactionThreshold: 0,
  };

  private userInteractions: Map<string, Map<string, InteractionRecord>> = new Map();

  /**
   * 记录用户与地址的交互
   * @param userId 用户 ID
   * @param address 交互地址
   * @param amount 交互金额
   */
  recordInteraction(userId: string, address: string, amount?: string): void {
    const normalizedAddress = address.toLowerCase();

    let userRecords = this.userInteractions.get(userId);
    if (!userRecords) {
      userRecords = new Map();
      this.userInteractions.set(userId, userRecords);
    }

    const existing = userRecords.get(normalizedAddress);
    const now = new Date();

    if (existing) {
      existing.count += 1;
      existing.lastInteraction = now;
      if (amount) {
        try {
          const sum = parseFloat(existing.amountSum || '0') + parseFloat(amount);
          existing.amountSum = sum.toString();
        } catch {
          // 忽略金额计算错误
        }
      }
    } else {
      userRecords.set(normalizedAddress, {
        address: normalizedAddress,
        count: 1,
        firstInteraction: now,
        lastInteraction: now,
        amountSum: amount || '0',
      });
    }
  }

  /**
   * 批量导入交互历史
   * @param userId 用户 ID
   * @param interactions 交互历史
   */
  importInteractions(
    userId: string,
    interactions: Array<{ address: string; count: number; firstInteraction?: Date; lastInteraction?: Date; amountSum?: string }>
  ): void {
    let userRecords = this.userInteractions.get(userId);
    if (!userRecords) {
      userRecords = new Map();
      this.userInteractions.set(userId, userRecords);
    }

    const now = new Date();
    interactions.forEach((item) => {
      const normalizedAddress = item.address.toLowerCase();
      userRecords.set(normalizedAddress, {
        address: normalizedAddress,
        count: item.count,
        firstInteraction: item.firstInteraction || now,
        lastInteraction: item.lastInteraction || now,
        amountSum: item.amountSum || '0',
      });
    });
  }

  /**
   * 获取用户与地址的交互次数
   * @param userId 用户 ID
   * @param address 地址
   * @returns 交互记录
   */
  getInteractionRecord(userId: string, address: string): InteractionRecord | null {
    const userRecords = this.userInteractions.get(userId);
    if (!userRecords) return null;
    return userRecords.get(address.toLowerCase()) || null;
  }

  /**
   * 获取用户所有交互地址
   * @param userId 用户 ID
   * @returns 交互地址列表
   */
  getUserInteractions(userId: string): InteractionRecord[] {
    const userRecords = this.userInteractions.get(userId);
    if (!userRecords) return [];
    return Array.from(userRecords.values());
  }

  /**
   * 获取用户交互地址数量
   * @param userId 用户 ID
   */
  getInteractionCount(userId: string): number {
    const userRecords = this.userInteractions.get(userId);
    return userRecords ? userRecords.size : 0;
  }

  /**
   * 清除用户交互历史
   * @param userId 用户 ID
   */
  clearUserInteractions(userId: string): boolean {
    return this.userInteractions.delete(userId);
  }

  /**
   * 清除所有交互历史
   */
  clearAllInteractions(): void {
    this.userInteractions.clear();
  }

  /**
   * 设置交互次数阈值（多少次以内视为新地址）
   * @param threshold 阈值
   */
  setInteractionThreshold(threshold: number): void {
    this.parameters.interactionThreshold = threshold;
  }

  /**
   * 检查是否为新地址交互
   * @param userId 用户 ID
   * @param address 地址
   * @returns 检查结果
   */
  isNewAddress(userId: string, address: string): {
    isNew: boolean;
    interactionCount: number;
    firstInteraction?: Date;
    lastInteraction?: Date;
  } {
    const record = this.getInteractionRecord(userId, address);
    const threshold = this.parameters.interactionThreshold || 0;

    if (!record) {
      return {
        isNew: true,
        interactionCount: 0,
      };
    }

    return {
      isNew: record.count <= threshold,
      interactionCount: record.count,
      firstInteraction: record.firstInteraction,
      lastInteraction: record.lastInteraction,
    };
  }

  /**
   * 从上下文中提取目标地址
   * @param context 风控上下文
   * @returns 目标地址列表
   */
  private extractTargetAddresses(context: RiskContext): string[] {
    const addresses: string[] = [];

    if (context.transaction?.to) {
      addresses.push(context.transaction.to);
    }

    if (context.transaction?.contractAddress) {
      addresses.push(context.transaction.contractAddress);
    }

    return [...new Set(addresses.map((a) => a.toLowerCase()))];
  }

  /**
   * 评估新地址风险
   * @param newAddresses 新地址列表
   * @param context 风控上下文
   */
  private assessNewAddressRisk(
    newAddresses: Array<{
      address: string;
      interactionCount: number;
      isNew: boolean;
    }>,
    context: RiskContext
  ): { level: RiskLevel; score: number; action: RiskAction; reason: string } {
    const trulyNew = newAddresses.filter((a) => a.isNew);

    if (trulyNew.length === 0) {
      return { level: RiskLevel.LOW, score: 0, action: RiskAction.ALLOW, reason: '' };
    }

    const hasTransactionValue = context.transaction?.value && parseFloat(context.transaction.value) > 0;
    const isNewDevice = context.device?.isNewDevice;

    let score = this.parameters.threshold || 30;
    let level = RiskLevel.MEDIUM;
    let action = this.parameters.action || RiskAction.SECOND_CONFIRM;
    let reason = `检测到向新地址转账，请确认收款地址无误（历史交互 ${trulyNew[0].interactionCount} 次）`;

    if (hasTransactionValue) {
      score += 10;
      reason = '检测到向新地址转账且有金额转移，请仔细核对收款地址';
    }

    if (isNewDevice) {
      score += 15;
      level = RiskLevel.HIGH;
      reason = '新设备 + 新地址转账，风险较高，请务必确认操作安全';
    }

    if (score >= 60) {
      level = RiskLevel.HIGH;
      action = RiskAction.SECOND_CONFIRM;
    }

    score = Math.min(score, 100);

    return { level, score, action, reason };
  }

  /**
   * 判断规则是否适用于当前上下文
   * @param context 风控上下文
   * @returns 是否适用
   */
  isApplicable(context: RiskContext): boolean {
    if (!this.enabled) return false;

    if (!context.userId) return false;

    const targetAddresses = this.extractTargetAddresses(context);
    return targetAddresses.length > 0;
  }

  /**
   * 执行规则评估
   * @param context 风控上下文
   * @returns 规则评估结果
   */
  async evaluate(context: RiskContext): Promise<RiskRuleResult> {
    const startTime = Date.now();

    if (!this.isApplicable(context)) {
      return this.createNotApplicableResult(startTime, '无目标地址或无用户信息');
    }

    const targetAddresses = this.extractTargetAddresses(context);
    const userId = context.userId || '';

    const addressResults = targetAddresses.map((address) => {
      const checkResult = this.isNewAddress(userId, address);
      return {
        address,
        ...checkResult,
      };
    });

    const newAddresses = addressResults.filter((a) => a.isNew);

    if (newAddresses.length > 0) {
      const riskAssessment = this.assessNewAddressRisk(newAddresses, context);

      return {
        ruleCode: this.ruleCode,
        ruleName: this.ruleName,
        category: this.category,
        matched: true,
        score: riskAssessment.score,
        level: riskAssessment.level,
        action: riskAssessment.action,
        reason: riskAssessment.reason,
        detail: {
          newAddresses: newAddresses.map((a) => ({
            address: a.address,
            interactionCount: a.interactionCount,
            firstInteraction: a.firstInteraction,
            lastInteraction: a.lastInteraction,
          })),
          totalTargetAddresses: targetAddresses.length,
          newAddressCount: newAddresses.length,
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
        knownAddresses: addressResults.length,
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

export const newAddressRule = new NewAddressRule();
