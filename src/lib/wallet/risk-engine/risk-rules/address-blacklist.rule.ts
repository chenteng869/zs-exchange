/**
 * 地址黑名单规则
 * 检测交易收款地址是否在黑名单中，阻止与恶意地址的交互
 */

import {
  RiskRule,
  RiskRuleResult,
  RiskContext,
  RiskLevel,
  RiskAction,
  RuleCategory,
  BlacklistType,
} from '../risk-engine.types';

/**
 * 地址黑名单规则类
 * 用于检测交易目标地址是否在黑名单中
 */
export class AddressBlacklistRule implements RiskRule {
  readonly ruleCode = 'ADDRESS_BLACKLIST';
  readonly ruleName = '地址黑名单检测';
  readonly description = '检测交易收款地址是否在黑名单中，阻止与恶意地址的交互';
  readonly category = RuleCategory.ADDRESS;
  readonly priority = 100;
  readonly version = '1.0.0';

  enabled = true;
  parameters = {
    action: RiskAction.REJECT,
    threshold: 100,
  };

  private blacklistAddresses: Map<string, { reason?: string; riskLevel?: RiskLevel }> =
    new Map();

  constructor() {
    this.initializeDefaultBlacklist();
  }

  /**
   * 初始化默认黑名单
   * 包含已知的恶意地址、黑客地址、诈骗地址等
   */
  private initializeDefaultBlacklist(): void {
    const defaultBlacklist: Array<{ address: string; reason: string; riskLevel: RiskLevel }> = [
      {
        address: '0x0000000000000000000000000000000000000000',
        reason: '零地址',
        riskLevel: RiskLevel.MEDIUM,
      },
    ];

    defaultBlacklist.forEach((item) => {
      this.blacklistAddresses.set(item.address.toLowerCase(), {
        reason: item.reason,
        riskLevel: item.riskLevel,
      });
    });
  }

  /**
   * 添加黑名单地址
   * @param address 地址
   * @param reason 原因
   * @param riskLevel 风险等级
   */
  addAddress(address: string, reason?: string, riskLevel: RiskLevel = RiskLevel.CRITICAL): void {
    this.blacklistAddresses.set(address.toLowerCase(), { reason, riskLevel });
  }

  /**
   * 批量添加黑名单地址
   * @param addresses 地址列表
   */
  addAddresses(
    addresses: Array<{ address: string; reason?: string; riskLevel?: RiskLevel }>
  ): void {
    addresses.forEach((item) => {
      this.addAddress(item.address, item.reason, item.riskLevel || RiskLevel.CRITICAL);
    });
  }

  /**
   * 移除黑名单地址
   * @param address 地址
   */
  removeAddress(address: string): boolean {
    return this.blacklistAddresses.delete(address.toLowerCase());
  }

  /**
   * 检查地址是否在黑名单中
   * @param address 地址
   * @returns 黑名单信息
   */
  checkAddress(address: string): { inBlacklist: boolean; reason?: string; riskLevel?: RiskLevel } {
    const info = this.blacklistAddresses.get(address.toLowerCase());
    if (info) {
      return { inBlacklist: true, reason: info.reason, riskLevel: info.riskLevel };
    }
    return { inBlacklist: false };
  }

  /**
   * 获取黑名单地址数量
   * @returns 地址数量
   */
  getBlacklistCount(): number {
    return this.blacklistAddresses.size;
  }

  /**
   * 清空黑名单
   */
  clearBlacklist(): void {
    this.blacklistAddresses.clear();
  }

  /**
   * 获取所有黑名单地址
   * @returns 地址列表
   */
  getAllAddresses(): Array<{ address: string; reason?: string; riskLevel?: RiskLevel }> {
    const result: Array<{ address: string; reason?: string; riskLevel?: RiskLevel }> = [];
    this.blacklistAddresses.forEach((info, address) => {
      result.push({ address, ...info });
    });
    return result;
  }

  /**
   * 判断规则是否适用于当前上下文
   * @param context 风控上下文
   * @returns 是否适用
   */
  isApplicable(context: RiskContext): boolean {
    if (!this.enabled) return false;
    if (!context.transaction?.to) return false;

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
      return this.createNotApplicableResult(startTime);
    }

    const toAddress = context.transaction?.to?.toLowerCase() || '';
    const blacklistInfo = this.blacklistAddresses.get(toAddress);

    if (blacklistInfo) {
      const riskLevel = blacklistInfo.riskLevel || RiskLevel.CRITICAL;
      const action = this.parameters.action || RiskAction.REJECT;
      const score = this.parameters.threshold || 100;

      return {
        ruleCode: this.ruleCode,
        ruleName: this.ruleName,
        category: this.category,
        matched: true,
        score,
        level: riskLevel,
        action,
        reason: blacklistInfo.reason
          ? `收款地址在黑名单中：${blacklistInfo.reason}`
          : '收款地址在黑名单中，交易已被阻止',
        detail: {
          address: toAddress,
          blacklistReason: blacklistInfo.reason,
          blacklistType: BlacklistType.ADDRESS,
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
   * @returns 规则结果
   */
  private createNotApplicableResult(startTime: number): RiskRuleResult {
    return {
      ruleCode: this.ruleCode,
      ruleName: this.ruleName,
      category: this.category,
      matched: false,
      score: 0,
      level: RiskLevel.LOW,
      action: RiskAction.ALLOW,
      reason: '规则不适用（无收款地址）',
      priority: this.priority,
      evaluationTime: Date.now() - startTime,
    };
  }
}

export const addressBlacklistRule = new AddressBlacklistRule();
