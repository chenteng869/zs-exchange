/**
 * 可疑合约检测规则
 * 检测与可疑合约的交互，包括高危函数调用、未知合约等风险
 */

import {
  RiskRule,
  RiskRuleResult,
  RiskContext,
  RiskLevel,
  RiskAction,
  RuleCategory,
  ChainType,
  SignType,
} from '../risk-engine.types';

/**
 * 可疑方法信息接口
 */
interface SuspiciousMethod {
  selector: string;
  name: string;
  riskLevel: RiskLevel;
  description: string;
  category: string;
}

/**
 * 合约验证信息接口
 */
interface ContractVerificationInfo {
  isVerified: boolean;
  isOpenSource: boolean;
  isAudited: boolean;
  riskLevel: RiskLevel;
}

/**
 * 可疑合约检测规则类
 * 用于检测与可疑合约的交互风险
 */
export class SuspiciousContractRule implements RiskRule {
  readonly ruleCode = 'SUSPICIOUS_CONTRACT';
  readonly ruleName = '可疑合约检测';
  readonly description = '检测与可疑合约的交互，包括高危函数调用、未知合约等风险';
  readonly category = RuleCategory.CONTRACT;
  readonly priority = 85;
  readonly version = '1.0.0';

  enabled = true;
  parameters = {
    action: RiskAction.SECOND_CONFIRM,
    threshold: 45,
  };

  private suspiciousMethods: SuspiciousMethod[] = [
    {
      selector: '0xff000000',
      name: 'selfdestruct',
      riskLevel: RiskLevel.CRITICAL,
      description: '自毁函数，可能导致合约资金被转移',
      category: 'high_risk',
    },
    {
      selector: '0xf4f4f4f4',
      name: 'delegatecall',
      riskLevel: RiskLevel.HIGH,
      description: 'delegatecall 调用，可能存在安全风险',
      category: 'high_risk',
    },
    {
      selector: '0xd0e30db0',
      name: 'deposit',
      riskLevel: RiskLevel.LOW,
      description: '存款函数',
      category: 'normal',
    },
    {
      selector: '0x2e1a7d4d',
      name: 'withdraw',
      riskLevel: RiskLevel.MEDIUM,
      description: '取款函数，注意资金安全',
      category: 'financial',
    },
    {
      selector: '0x3ccfd60b',
      name: 'withdrawTo',
      riskLevel: RiskLevel.MEDIUM,
      description: '转账到指定地址',
      category: 'financial',
    },
  ];

  private verifiedContracts: Map<string, ContractVerificationInfo> = new Map();

  private knownScamPatterns: RegExp[] = [
    /free.*mint/i,
    /claim.*reward/i,
    /airdrop.*claim/i,
    /win.*prize/i,
    /verify.*wallet/i,
  ];

  /**
   * 添加可疑方法
   * @param method 方法信息
   */
  addSuspiciousMethod(method: SuspiciousMethod): void {
    this.suspiciousMethods.push(method);
  }

  /**
   * 移除可疑方法
   * @param selector 方法选择器
   */
  removeSuspiciousMethod(selector: string): boolean {
    const index = this.suspiciousMethods.findIndex((m) => m.selector === selector.toLowerCase());
    if (index !== -1) {
      this.suspiciousMethods.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取所有可疑方法
   */
  getSuspiciousMethods(): SuspiciousMethod[] {
    return [...this.suspiciousMethods];
  }

  /**
   * 注册已验证合约
   * @param address 合约地址
   * @param info 验证信息
   */
  registerVerifiedContract(address: string, info: ContractVerificationInfo): void {
    this.verifiedContracts.set(address.toLowerCase(), info);
  }

  /**
   * 批量注册已验证合约
   * @param contracts 合约列表
   */
  registerVerifiedContracts(
    contracts: Array<{ address: string; info: ContractVerificationInfo }>
  ): void {
    contracts.forEach((c) => {
      this.verifiedContracts.set(c.address.toLowerCase(), c.info);
    });
  }

  /**
   * 获取合约验证信息
   * @param address 合约地址
   */
  getContractVerificationInfo(address: string): ContractVerificationInfo | null {
    return this.verifiedContracts.get(address.toLowerCase()) || null;
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
   * 检测可疑方法调用
   * @param data 交易数据
   */
  detectSuspiciousMethod(data: string): {
    isSuspicious: boolean;
    method?: SuspiciousMethod;
  } {
    const selector = this.extractMethodSelector(data);
    if (!selector) {
      return { isSuspicious: false };
    }

    const method = this.suspiciousMethods.find((m) => m.selector === selector);
    if (method && method.category !== 'normal') {
      return { isSuspicious: true, method };
    }

    return { isSuspicious: false };
  }

  /**
   * 检测是否包含可疑操作码
   * @param data 交易数据
   */
  detectSuspiciousOpcodes(data: string): {
    isSuspicious: boolean;
    foundOpcodes: string[];
  } {
    if (!data || data === '0x') {
      return { isSuspicious: false, foundOpcodes: [] };
    }

    const lowerData = data.toLowerCase();
    const suspiciousPatterns = [
      { pattern: 'selfdestruct', name: 'selfdestruct' },
      { pattern: 'delegatecall', name: 'delegatecall' },
      { pattern: 'callcode', name: 'callcode' },
      { pattern: 'suicide', name: 'suicide' },
      { pattern: '0xff', name: 'SELFDESTRUCT opcode' },
      { pattern: '0xf4', name: 'DELEGATECALL opcode' },
    ];

    const foundOpcodes: string[] = [];
    for (const { pattern, name } of suspiciousPatterns) {
      if (lowerData.includes(pattern)) {
        foundOpcodes.push(name);
      }
    }

    return {
      isSuspicious: foundOpcodes.length > 0,
      foundOpcodes,
    };
  }

  /**
   * 检测钓鱼/诈骗模式
   * @param context 风控上下文
   */
  detectScamPatterns(context: RiskContext): {
    isScam: boolean;
    matchedPatterns: string[];
  } {
    const matchedPatterns: string[] = [];

    if (context.dapp?.name) {
      for (const pattern of this.knownScamPatterns) {
        if (pattern.test(context.dapp.name)) {
          matchedPatterns.push(pattern.source);
        }
      }
    }

    if (context.dapp?.domain) {
      for (const pattern of this.knownScamPatterns) {
        if (pattern.test(context.dapp.domain)) {
          matchedPatterns.push(pattern.source);
        }
      }
    }

    return {
      isScam: matchedPatterns.length > 0,
      matchedPatterns,
    };
  }

  /**
   * 评估合约交互风险
   * @param context 风控上下文
   */
  assessContractRisk(context: RiskContext): {
    isSuspicious: boolean;
    level: RiskLevel;
    score: number;
    reasons: string[];
    details: Record<string, unknown>;
  } {
    const reasons: string[] = [];
    let score = 0;
    let level = RiskLevel.LOW;
    const details: Record<string, unknown> = {};

    const contractAddress = context.transaction?.contractAddress || context.transaction?.to;
    const transactionData = context.transaction?.data || '0x';

    if (!contractAddress || transactionData === '0x') {
      return { isSuspicious: false, level, score, reasons, details };
    }

    const methodResult = this.detectSuspiciousMethod(transactionData);
    if (methodResult.isSuspicious && methodResult.method) {
      reasons.push(`调用了可疑函数：${methodResult.method.name}`);
      details.suspiciousMethod = methodResult.method;

      switch (methodResult.method.riskLevel) {
        case RiskLevel.CRITICAL:
          score += 60;
          if (level < RiskLevel.CRITICAL) level = RiskLevel.CRITICAL;
          break;
        case RiskLevel.HIGH:
          score += 40;
          if (level < RiskLevel.HIGH) level = RiskLevel.HIGH;
          break;
        case RiskLevel.MEDIUM:
          score += 25;
          if (level < RiskLevel.MEDIUM) level = RiskLevel.MEDIUM;
          break;
        default:
          score += 10;
      }
    }

    const opcodeResult = this.detectSuspiciousOpcodes(transactionData);
    if (opcodeResult.isSuspicious) {
      reasons.push(`检测到可疑操作码：${opcodeResult.foundOpcodes.join(', ')}`);
      details.suspiciousOpcodes = opcodeResult.foundOpcodes;
      score += 20;
      if (level < RiskLevel.MEDIUM) level = RiskLevel.MEDIUM;
    }

    const verificationInfo = this.getContractVerificationInfo(contractAddress);
    if (verificationInfo) {
      details.contractVerification = verificationInfo;

      if (!verificationInfo.isVerified) {
        reasons.push('合约未经验证');
        score += 15;
        if (level < RiskLevel.MEDIUM) level = RiskLevel.MEDIUM;
      }

      if (!verificationInfo.isOpenSource) {
        reasons.push('合约未开源');
        score += 10;
      }
    } else {
      reasons.push('未知合约，建议谨慎交互');
      score += 15;
      if (level < RiskLevel.LOW) level = RiskLevel.LOW;
    }

    const scamResult = this.detectScamPatterns(context);
    if (scamResult.isScam) {
      reasons.push('检测到可能的诈骗模式');
      details.scamPatterns = scamResult.matchedPatterns;
      score += 30;
      if (level < RiskLevel.HIGH) level = RiskLevel.HIGH;
    }

    return {
      isSuspicious: score > 0,
      level,
      score: Math.min(score, 100),
      reasons,
      details,
    };
  }

  /**
   * 判断规则是否适用于当前上下文
   * @param context 风控上下文
   * @returns 是否适用
   */
  isApplicable(context: RiskContext): boolean {
    if (!this.enabled) return false;
    if (context.chainType !== ChainType.EVM) return false;
    if (context.signType !== SignType.TRANSACTION) return false;

    const data = context.transaction?.data;
    if (!data || data === '0x') return false;

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
      return this.createNotApplicableResult(startTime, '非合约交互交易');
    }

    const riskAssessment = this.assessContractRisk(context);

    if (riskAssessment.isSuspicious) {
      const action = riskAssessment.score >= 60
        ? RiskAction.SECOND_CONFIRM
        : riskAssessment.score >= 30
        ? RiskAction.WARN
        : RiskAction.ALLOW;

      return {
        ruleCode: this.ruleCode,
        ruleName: this.ruleName,
        category: this.category,
        matched: true,
        score: riskAssessment.score,
        level: riskAssessment.level,
        action,
        reason: riskAssessment.reasons.join('；'),
        detail: riskAssessment.details,
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

export const suspiciousContractRule = new SuspiciousContractRule();
