/**
 * 零值转账规则
 * 检测零值转账交易，这类交易通常是授权操作或可能的攻击试探
 */

import {
  RiskRule,
  RiskRuleResult,
  RiskContext,
  RiskLevel,
  RiskAction,
  RuleCategory,
  SignType,
  ChainType,
} from '../risk-engine.types';

/**
 * 零值转账规则类
 * 用于检测零值转账交易并评估其风险
 */
export class ZeroValueTransferRule implements RiskRule {
  readonly ruleCode = 'ZERO_VALUE_TRANSFER';
  readonly ruleName = '零值转账检测';
  readonly description = '检测零值转账交易，这类交易通常是授权操作或可能的攻击试探';
  readonly category = RuleCategory.AMOUNT;
  readonly priority = 65;
  readonly version = '1.0.0';

  enabled = true;
  parameters = {
    action: RiskAction.WARN,
    threshold: 15,
  };

  private knownSafeZeroValuePatterns: Set<string> = new Set();

  /**
   * 添加安全的零值转账模式
   * @param pattern 模式标识（如方法选择器、合约地址等）
   */
  addSafePattern(pattern: string): void {
    this.knownSafeZeroValuePatterns.add(pattern.toLowerCase());
  }

  /**
   * 批量添加安全模式
   * @param patterns 模式列表
   */
  addSafePatterns(patterns: string[]): void {
    patterns.forEach((p) => this.knownSafeZeroValuePatterns.add(p.toLowerCase()));
  }

  /**
   * 移除安全模式
   * @param pattern 模式
   */
  removeSafePattern(pattern: string): boolean {
    return this.knownSafeZeroValuePatterns.delete(pattern.toLowerCase());
  }

  /**
   * 检查是否为已知安全模式
   * @param pattern 模式
   */
  isSafePattern(pattern: string): boolean {
    return this.knownSafeZeroValuePatterns.has(pattern.toLowerCase());
  }

  /**
   * 获取安全模式数量
   */
  getSafePatternCount(): number {
    return this.knownSafeZeroValuePatterns.size;
  }

  /**
   * 清空安全模式
   */
  clearSafePatterns(): void {
    this.knownSafeZeroValuePatterns.clear();
  }

  /**
   * 获取所有安全模式
   */
  getSafePatterns(): string[] {
    return Array.from(this.knownSafeZeroValuePatterns);
  }

  /**
   * 检测是否为零值转账
   * @param context 风控上下文
   */
  isZeroValueTransfer(context: RiskContext): boolean {
    const value = context.transaction?.value;
    if (!value) return false;

    try {
      const amount = parseFloat(value);
      return amount === 0;
    } catch {
      return false;
    }
  }

  /**
   * 提取函数选择器
   * @param data 交易数据
   */
  private extractMethodSelector(data: string): string | null {
    if (!data || data.length < 10) return null;
    return data.slice(0, 10).toLowerCase();
  }

  /**
   * 判断交易类型
   * @param context 风控上下文
   */
  private classifyTransaction(context: RiskContext): {
    type: string;
    isSafe: boolean;
    description: string;
  } {
    const data = context.transaction?.data || '0x';
    const selector = this.extractMethodSelector(data);

    const erc20Transfer = '0xa9059cbb';
    const erc20Approve = '0x095ea7b3';
    const erc721TransferFrom = '0x23b872dd';
    const erc721SafeTransferFrom = '0x42842e0e';
    const erc721SetApprovalForAll = '0xa22cb465';
    const erc1155SafeTransferFrom = '0xf242432a';

    if (selector === erc20Transfer) {
      return {
        type: 'erc20_transfer',
        isSafe: this.isSafePattern(selector),
        description: 'ERC20 代币转账（零值可能是测试或 dusting attack）',
      };
    }

    if (selector === erc20Approve) {
      return {
        type: 'erc20_approve',
        isSafe: true,
        description: 'ERC20 授权操作（零值用于取消授权是正常的）',
      };
    }

    if (selector === erc721TransferFrom || selector === erc721SafeTransferFrom) {
      return {
        type: 'nft_transfer',
        isSafe: this.isSafePattern(selector),
        description: 'NFT 转账（零值是正常的，因为 NFT 不涉及数量）',
      };
    }

    if (selector === erc721SetApprovalForAll) {
      return {
        type: 'nft_approval',
        isSafe: false,
        description: 'NFT 批量授权操作',
      };
    }

    if (selector === erc1155SafeTransferFrom) {
      return {
        type: 'erc1155_transfer',
        isSafe: this.isSafePattern(selector),
        description: 'ERC1155 代币转账',
      };
    }

    if (data && data !== '0x') {
      return {
        type: 'contract_call',
        isSafe: false,
        description: '合约调用（零值）',
      };
    }

    return {
      type: 'plain_transfer',
      isSafe: false,
      description: '零值原生代币转账，可能是 dusting attack 或试探性交易',
    };
  }

  /**
   * 评估零值转账风险
   * @param context 风控上下文
   */
  assessZeroValueRisk(context: RiskContext): {
    isZeroValue: boolean;
    level: RiskLevel;
    score: number;
    action: RiskAction;
    txType: string;
    reason: string;
    details: Record<string, unknown>;
  } {
    if (!this.isZeroValueTransfer(context)) {
      return {
        isZeroValue: false,
        level: RiskLevel.LOW,
        score: 0,
        action: RiskAction.ALLOW,
        txType: 'normal',
        reason: '',
        details: {},
      };
    }

    const classification = this.classifyTransaction(context);
    let score = this.parameters.threshold || 15;
    let level = RiskLevel.LOW;
    let action = this.parameters.action || RiskAction.WARN;

    if (classification.isSafe) {
      score = 5;
      level = RiskLevel.LOW;
      action = RiskAction.ALLOW;
    } else if (classification.type === 'nft_transfer') {
      score = 5;
      level = RiskLevel.LOW;
      action = RiskAction.ALLOW;
    } else if (classification.type === 'erc20_approve') {
      score = 10;
      level = RiskLevel.LOW;
      action = RiskAction.ALLOW;
    } else if (classification.type === 'plain_transfer') {
      score = 25;
      level = RiskLevel.LOW;
      action = RiskAction.WARN;
    } else if (classification.type === 'contract_call') {
      score = 20;
      level = RiskLevel.LOW;
      action = RiskAction.WARN;
    }

    const isNewDevice = context.device?.isNewDevice;
    const isAbnormalLocation = context.device?.isAbnormalLocation;

    if (isNewDevice) {
      score += 10;
      if (level < RiskLevel.MEDIUM) level = RiskLevel.MEDIUM;
    }

    if (isAbnormalLocation) {
      score += 10;
      if (level < RiskLevel.MEDIUM) level = RiskLevel.MEDIUM;
    }

    score = Math.min(score, 100);

    let reason = classification.description;
    if (isNewDevice || isAbnormalLocation) {
      reason += '，且处于异常环境（新设备/异常位置），请谨慎操作';
    }

    return {
      isZeroValue: true,
      level,
      score,
      action,
      txType: classification.type,
      reason,
      details: {
        transactionType: classification.type,
        isSafeClassification: classification.isSafe,
        isNewDevice,
        isAbnormalLocation,
      },
    };
  }

  /**
   * 判断规则是否适用于当前上下文
   * @param context 风控上下文
   * @returns 是否适用
   */
  isApplicable(context: RiskContext): boolean {
    if (!this.enabled) return false;
    if (context.signType !== SignType.TRANSACTION) return false;
    if (context.chainType === ChainType.BITCOIN) return false;

    return this.isZeroValueTransfer(context);
  }

  /**
   * 执行规则评估
   * @param context 风控上下文
   * @returns 规则评估结果
   */
  async evaluate(context: RiskContext): Promise<RiskRuleResult> {
    const startTime = Date.now();

    if (!this.isApplicable(context)) {
      return {
        ruleCode: this.ruleCode,
        ruleName: this.ruleName,
        category: this.category,
        matched: false,
        score: 0,
        level: RiskLevel.LOW,
        action: RiskAction.ALLOW,
        reason: '规则不适用（非零值转账）',
        priority: this.priority,
        evaluationTime: Date.now() - startTime,
      };
    }

    const riskAssessment = this.assessZeroValueRisk(context);

    return {
      ruleCode: this.ruleCode,
      ruleName: this.ruleName,
      category: this.category,
      matched: true,
      score: riskAssessment.score,
      level: riskAssessment.level,
      action: riskAssessment.action,
      reason: riskAssessment.reason,
      detail: riskAssessment.details,
      priority: this.priority,
      evaluationTime: Date.now() - startTime,
    };
  }
}

export const zeroValueTransferRule = new ZeroValueTransferRule();
