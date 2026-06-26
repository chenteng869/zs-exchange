/**
 * 无限授权检测规则
 * 检测 ERC20 approve 交易中是否授予无限额度，防止用户授权全部资产
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
 * 无限授权检测规则类
 * 用于检测代币授权交易中是否存在无限授权风险
 */
export class UnlimitedApprovalRule implements RiskRule {
  readonly ruleCode = 'UNLIMITED_APPROVAL';
  readonly ruleName = '无限授权检测';
  readonly description = '检测 ERC20 approve 交易中是否授予无限额度，防止用户授权全部资产';
  readonly category = RuleCategory.CONTRACT;
  readonly priority = 90;
  readonly version = '1.0.0';

  enabled = true;
  parameters = {
    action: RiskAction.SECOND_CONFIRM,
    threshold: 50,
  };

  private readonly ERC20_APPROVE_SELECTOR = '0x095ea7b3';
  private readonly ERC721_APPROVE_SELECTOR = '0x095ea7b3';
  private readonly ERC721_SET_APPROVAL_FOR_ALL_SELECTOR = '0xa22cb465';
  private readonly ERC1155_SET_APPROVAL_FOR_ALL_SELECTOR = '0xa22cb465';

  private readonly MAX_UINT256 = '0x' + 'f'.repeat(64);
  private readonly MAX_UINT96 = '0x' + 'f'.repeat(24);

  private knownSafeSpenders: Set<string> = new Set();

  /**
   * 添加安全授权地址（知名协议等）
   * @param spender 授权地址
   */
  addSafeSpender(spender: string): void {
    this.knownSafeSpenders.add(spender.toLowerCase());
  }

  /**
   * 批量添加安全授权地址
   * @param spenders 地址列表
   */
  addSafeSpenders(spenders: string[]): void {
    spenders.forEach((s) => this.knownSafeSpenders.add(s.toLowerCase()));
  }

  /**
   * 移除安全授权地址
   * @param spender 地址
   */
  removeSafeSpender(spender: string): boolean {
    return this.knownSafeSpenders.delete(spender.toLowerCase());
  }

  /**
   * 检查是否为安全授权地址
   * @param spender 地址
   */
  isSafeSpender(spender: string): boolean {
    return this.knownSafeSpenders.has(spender.toLowerCase());
  }

  /**
   * 获取安全授权地址数量
   */
  getSafeSpenderCount(): number {
    return this.knownSafeSpenders.size;
  }

  /**
   * 清空安全授权地址
   */
  clearSafeSpenders(): void {
    this.knownSafeSpenders.clear();
  }

  /**
   * 获取所有安全授权地址
   */
  getSafeSpenders(): string[] {
    return Array.from(this.knownSafeSpenders);
  }

  /**
   * 从交易数据中提取函数选择器
   * @param data 交易数据
   * @returns 函数选择器
   */
  private extractMethodSelector(data: string): string | null {
    if (!data || data.length < 10) return null;
    return data.slice(0, 10).toLowerCase();
  }

  /**
   * 检测是否为 approve 调用
   * @param data 交易数据
   */
  isApproveCall(data: string): boolean {
    const selector = this.extractMethodSelector(data);
    return selector === this.ERC20_APPROVE_SELECTOR;
  }

  /**
   * 检测是否为 setApprovalForAll 调用
   * @param data 交易数据
   */
  isSetApprovalForAllCall(data: string): boolean {
    const selector = this.extractMethodSelector(data);
    return selector === this.ERC721_SET_APPROVAL_FOR_ALL_SELECTOR ||
           selector === this.ERC1155_SET_APPROVAL_FOR_ALL_SELECTOR;
  }

  /**
   * 从 approve 调用数据中提取授权额度
   * @param data 交易数据
   * @returns 授权额度（十六进制字符串）
   */
  private extractApprovalAmount(data: string): string | null {
    if (!this.isApproveCall(data) || data.length < 138) {
      return null;
    }
    return '0x' + data.slice(74, 138).toLowerCase();
  }

  /**
   * 从 approve 调用数据中提取授权地址
   * @param data 交易数据
   * @returns 授权地址
   */
  private extractSpenderAddress(data: string): string | null {
    if (!this.isApproveCall(data) || data.length < 74) {
      return null;
    }
    return '0x' + data.slice(34, 74).toLowerCase();
  }

  /**
   * 从 setApprovalForAll 调用数据中提取授权状态
   * @param data 交易数据
   * @returns 是否授权全部
   */
  private extractApprovalForAllStatus(data: string): boolean | null {
    if (!this.isSetApprovalForAllCall(data) || data.length < 138) {
      return null;
    }
    const statusHex = data.slice(104, 138).toLowerCase();
    return statusHex !== '0'.repeat(34);
  }

  /**
   * 检测是否为无限授权
   * @param data 交易数据
   * @returns 检测结果
   */
  detectUnlimitedApproval(data: string): {
    isUnlimited: boolean;
    approvalType?: 'erc20' | 'erc721_all' | 'erc1155_all';
    spender?: string;
    amount?: string;
  } {
    if (this.isApproveCall(data)) {
      const amount = this.extractApprovalAmount(data);
      const spender = this.extractSpenderAddress(data);

      if (amount && this.isUnlimitedAmount(amount)) {
        return {
          isUnlimited: true,
          approvalType: 'erc20',
          spender,
          amount,
        };
      }
    }

    if (this.isSetApprovalForAllCall(data)) {
      const approved = this.extractApprovalForAllStatus(data);
      if (approved === true) {
        return {
          isUnlimited: true,
          approvalType: 'erc721_all',
        };
      }
    }

    return { isUnlimited: false };
  }

  /**
   * 判断是否为无限额度
   * @param amountHex 十六进制金额
   */
  private isUnlimitedAmount(amountHex: string): boolean {
    const amount = amountHex.toLowerCase();
    return amount === this.MAX_UINT256 ||
           amount === '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' ||
           amount === this.MAX_UINT96 ||
           amount === '0x000000000000000000000000000000000000000000000000ffffffffffffffffffffffff';
  }

  /**
   * 从 typed data 中检测无限授权（Permit 签名）
   * @param payload 签名负载
   */
  detectTypedDataUnlimitedApproval(payload: unknown): {
    isUnlimited: boolean;
    approvalType?: string;
    details?: Record<string, unknown>;
  } {
    try {
      const data = payload as Record<string, unknown>;
      const types = data.types as Record<string, unknown>;
      const message = data.message as Record<string, unknown>;

      if (types && (types['Permit'] || types['Permit2'])) {
        if (message) {
          const value = message.value as string;
          if (value && (value === '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' ||
                       BigInt(value) > BigInt('10000000000000000000000000000000'))) {
            return {
              isUnlimited: true,
              approvalType: types['Permit2'] ? 'permit2' : 'permit',
              details: { value },
            };
          }
        }
      }

      return { isUnlimited: false };
    } catch {
      return { isUnlimited: false };
    }
  }

  /**
   * 评估授权风险等级
   * @param detectionResult 检测结果
   * @param spender 授权地址
   */
  private assessApprovalRisk(
    detectionResult: { isUnlimited: boolean; approvalType?: string; details?: Record<string, unknown> },
    spender?: string
  ): { level: RiskLevel; score: number; action: RiskAction; reason: string } {
    if (!detectionResult.isUnlimited) {
      return { level: RiskLevel.LOW, score: 0, action: RiskAction.ALLOW, reason: '' };
    }

    const isSafeSpender = spender ? this.isSafeSpender(spender) : false;

    if (detectionResult.approvalType === 'erc721_all' || detectionResult.approvalType === 'erc1155_all') {
      if (isSafeSpender) {
        return {
          level: RiskLevel.MEDIUM,
          score: 40,
          action: RiskAction.WARN,
          reason: '检测到 NFT 批量授权操作（setApprovalForAll），授权给已知协议',
        };
      }
      return {
        level: RiskLevel.HIGH,
        score: 70,
        action: RiskAction.SECOND_CONFIRM,
        reason: '检测到 NFT 批量授权操作（setApprovalForAll），授权后对方可转移您所有的该系列 NFT，请谨慎操作',
      };
    }

    if (detectionResult.approvalType === 'erc20') {
      if (isSafeSpender) {
        return {
          level: RiskLevel.MEDIUM,
          score: 30,
          action: RiskAction.WARN,
          reason: '检测到无限额代币授权，授权给已知协议',
        };
      }
      return {
        level: RiskLevel.HIGH,
        score: 50,
        action: RiskAction.SECOND_CONFIRM,
        reason: '检测到无限额代币授权，授权后对方可花费您的全部该代币，建议设置为实际需要的额度',
      };
    }

    if (detectionResult.approvalType === 'permit' || detectionResult.approvalType === 'permit2') {
      return {
        level: RiskLevel.MEDIUM,
        score: 40,
        action: RiskAction.SECOND_CONFIRM,
        reason: '检测到 Permit 无限额授权签名，请确认授权金额',
      };
    }

    return {
      level: RiskLevel.HIGH,
      score: 50,
      action: RiskAction.SECOND_CONFIRM,
      reason: '检测到无限授权操作，请谨慎确认',
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

    if (context.signType === SignType.TRANSACTION) {
      const data = context.transaction?.data;
      if (data && (this.isApproveCall(data) || this.isSetApprovalForAllCall(data))) {
        return true;
      }
    }

    if (context.signType === SignType.TYPED_DATA) {
      return true;
    }

    return false;
  }

  /**
   * 执行规则评估
   * @param context 风控上下文
   * @returns 规则评估结果
   */
  async evaluate(context: RiskContext): Promise<RiskRuleResult> {
    const startTime = Date.now();

    if (!this.isApplicable(context)) {
      return this.createNotApplicableResult(startTime, '非授权相关操作');
    }

    let detectionResult: { isUnlimited: boolean; approvalType?: string; details?: Record<string, unknown> } = { isUnlimited: false };
    let spender: string | undefined;

    if (context.signType === SignType.TRANSACTION && context.transaction?.data) {
      detectionResult = this.detectUnlimitedApproval(context.transaction.data);
      spender = this.extractSpenderAddress(context.transaction.data);
    } else if (context.signType === SignType.TYPED_DATA && context.payload) {
      detectionResult = this.detectTypedDataUnlimitedApproval(context.payload);
    }

    if (detectionResult.isUnlimited) {
      const riskAssessment = this.assessApprovalRisk(detectionResult, spender);

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
          approvalType: detectionResult.approvalType,
          spender,
          isSafeSpender: spender ? this.isSafeSpender(spender) : false,
          ...detectionResult.details,
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

export const unlimitedApprovalRule = new UnlimitedApprovalRule();
