/**
 * 合约黑名单规则
 * 检测交互的合约地址是否在黑名单中，阻止与恶意合约的交互
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
 * 合约黑名单规则类
 * 用于检测交互的合约是否在黑名单中
 */
export class ContractBlacklistRule implements RiskRule {
  readonly ruleCode = 'CONTRACT_BLACKLIST';
  readonly ruleName = '合约黑名单检测';
  readonly description = '检测交互的合约地址是否在黑名单中，阻止与恶意合约的交互';
  readonly category = RuleCategory.CONTRACT;
  readonly priority = 99;
  readonly version = '1.0.0';

  enabled = true;
  parameters = {
    action: RiskAction.REJECT,
    threshold: 100,
  };

  private blacklistContracts: Map<
    string,
    { reason?: string; riskLevel?: RiskLevel; contractType?: string }
  > = new Map();

  constructor() {
    this.initializeDefaultBlacklist();
  }

  /**
   * 初始化默认合约黑名单
   * 包含已知的恶意合约、rug pull 合约、黑客合约等
   */
  private initializeDefaultBlacklist(): void {
    const defaultBlacklist: Array<{
      address: string;
      reason: string;
      riskLevel: RiskLevel;
      contractType?: string;
    }> = [
      {
        address: '0x0000000000000000000000000000000000000000',
        reason: '零地址合约',
        riskLevel: RiskLevel.MEDIUM,
        contractType: 'unknown',
      },
    ];

    defaultBlacklist.forEach((item) => {
      this.blacklistContracts.set(item.address.toLowerCase(), {
        reason: item.reason,
        riskLevel: item.riskLevel,
        contractType: item.contractType,
      });
    });
  }

  /**
   * 添加黑名单合约
   * @param address 合约地址
   * @param reason 原因
   * @param riskLevel 风险等级
   * @param contractType 合约类型
   */
  addContract(
    address: string,
    reason?: string,
    riskLevel: RiskLevel = RiskLevel.CRITICAL,
    contractType?: string
  ): void {
    this.blacklistContracts.set(address.toLowerCase(), { reason, riskLevel, contractType });
  }

  /**
   * 批量添加黑名单合约
   * @param contracts 合约列表
   */
  addContracts(
    contracts: Array<{
      address: string;
      reason?: string;
      riskLevel?: RiskLevel;
      contractType?: string;
    }>
  ): void {
    contracts.forEach((item) => {
      this.addContract(item.address, item.reason, item.riskLevel || RiskLevel.CRITICAL, item.contractType);
    });
  }

  /**
   * 移除黑名单合约
   * @param address 合约地址
   */
  removeContract(address: string): boolean {
    return this.blacklistContracts.delete(address.toLowerCase());
  }

  /**
   * 检查合约是否在黑名单中
   * @param address 合约地址
   * @returns 黑名单信息
   */
  checkContract(address: string): {
    inBlacklist: boolean;
    reason?: string;
    riskLevel?: RiskLevel;
    contractType?: string;
  } {
    const info = this.blacklistContracts.get(address.toLowerCase());
    if (info) {
      return { inBlacklist: true, ...info };
    }
    return { inBlacklist: false };
  }

  /**
   * 获取黑名单合约数量
   * @returns 合约数量
   */
  getBlacklistCount(): number {
    return this.blacklistContracts.size;
  }

  /**
   * 清空合约黑名单
   */
  clearBlacklist(): void {
    this.blacklistContracts.clear();
  }

  /**
   * 获取所有黑名单合约
   * @returns 合约列表
   */
  getAllContracts(): Array<{
    address: string;
    reason?: string;
    riskLevel?: RiskLevel;
    contractType?: string;
  }> {
    const result: Array<{
      address: string;
      reason?: string;
      riskLevel?: RiskLevel;
      contractType?: string;
    }> = [];
    this.blacklistContracts.forEach((info, address) => {
      result.push({ address, ...info });
    });
    return result;
  }

  /**
   * 从交易数据中提取合约地址
   * @param context 风控上下文
   * @returns 合约地址
   */
  private extractContractAddress(context: RiskContext): string | null {
    if (context.transaction?.contractAddress) {
      return context.transaction.contractAddress;
    }

    if (context.transaction?.to && context.transaction.data && context.transaction.data !== '0x') {
      return context.transaction.to;
    }

    return null;
  }

  /**
   * 判断规则是否适用于当前上下文
   * @param context 风控上下文
   * @returns 是否适用
   */
  isApplicable(context: RiskContext): boolean {
    if (!this.enabled) return false;

    const contractAddress = this.extractContractAddress(context);
    return !!contractAddress;
  }

  /**
   * 执行规则评估
   * @param context 风控上下文
   * @returns 规则评估结果
   */
  async evaluate(context: RiskContext): Promise<RiskRuleResult> {
    const startTime = Date.now();

    const contractAddress = this.extractContractAddress(context);

    if (!contractAddress) {
      return this.createNotApplicableResult(startTime, '无合约交互');
    }

    const blacklistInfo = this.blacklistContracts.get(contractAddress.toLowerCase());

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
          ? `交互的合约在黑名单中：${blacklistInfo.reason}`
          : '交互的合约在黑名单中，交易已被阻止',
        detail: {
          contractAddress: contractAddress,
          blacklistReason: blacklistInfo.reason,
          contractType: blacklistInfo.contractType,
          blacklistType: BlacklistType.CONTRACT,
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

export const contractBlacklistRule = new ContractBlacklistRule();
