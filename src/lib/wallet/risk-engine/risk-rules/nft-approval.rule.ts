/**
 * NFT 批量授权规则
 * 检测 NFT 的 setApprovalForAll 操作，防止用户授权全部 NFT 给恶意地址
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
 * NFT 授权记录接口
 */
interface NFTApprovalRecord {
  contractAddress: string;
  operator: string;
  approved: boolean;
  timestamp: Date;
  txHash?: string;
}

/**
 * NFT 批量授权规则类
 * 用于检测 NFT 的 setApprovalForAll 操作风险
 */
export class NFTApprovalRule implements RiskRule {
  readonly ruleCode = 'NFT_APPROVAL_FOR_ALL';
  readonly ruleName = 'NFT 批量授权检测';
  readonly description = '检测 NFT 的 setApprovalForAll 操作，防止用户授权全部 NFT 给恶意地址';
  readonly category = RuleCategory.CONTRACT;
  readonly priority = 88;
  readonly version = '1.0.0';

  enabled = true;
  parameters = {
    action: RiskAction.SECOND_CONFIRM,
    threshold: 60,
  };

  private readonly ERC721_SET_APPROVAL_FOR_ALL_SELECTOR = '0xa22cb465';
  private readonly ERC1155_SET_APPROVAL_FOR_ALL_SELECTOR = '0xa22cb465';

  private knownSafeOperators: Map<string, { name: string; description: string; verified: boolean }> =
    new Map();

  private userApprovals: Map<string, NFTApprovalRecord[]> = new Map();

  constructor() {
    this.initializeDefaultSafeOperators();
  }

  /**
   * 初始化默认的安全授权地址（知名 NFT 市场等）
   */
  private initializeDefaultSafeOperators(): void {
    const safeOperators: Array<{
      address: string;
      name: string;
      description: string;
      verified: boolean;
    }> = [
      {
        address: '0x0000000000000000000000000000000000000000',
        name: 'Zero Address',
        description: '零地址（用于取消授权）',
        verified: true,
      },
    ];

    safeOperators.forEach((op) => {
      this.knownSafeOperators.set(op.address.toLowerCase(), {
        name: op.name,
        description: op.description,
        verified: op.verified,
      });
    });
  }

  /**
   * 添加安全授权地址
   * @param address 地址
   * @param name 名称
   * @param description 描述
   * @param verified 是否已验证
   */
  addSafeOperator(address: string, name: string, description: string, verified = true): void {
    this.knownSafeOperators.set(address.toLowerCase(), { name, description, verified });
  }

  /**
   * 批量添加安全授权地址
   * @param operators 地址列表
   */
  addSafeOperators(
    operators: Array<{ address: string; name: string; description: string; verified?: boolean }>
  ): void {
    operators.forEach((op) => {
      this.knownSafeOperators.set(op.address.toLowerCase(), {
        name: op.name,
        description: op.description,
        verified: op.verified !== false,
      });
    });
  }

  /**
   * 移除安全授权地址
   * @param address 地址
   */
  removeSafeOperator(address: string): boolean {
    return this.knownSafeOperators.delete(address.toLowerCase());
  }

  /**
   * 检查是否为安全授权地址
   * @param address 地址
   */
  isSafeOperator(address: string): {
    isSafe: boolean;
    name?: string;
    description?: string;
    verified?: boolean;
  } {
    const info = this.knownSafeOperators.get(address.toLowerCase());
    if (info) {
      return { isSafe: true, ...info };
    }
    return { isSafe: false };
  }

  /**
   * 获取安全授权地址数量
   */
  getSafeOperatorCount(): number {
    return this.knownSafeOperators.size;
  }

  /**
   * 清空安全授权地址
   */
  clearSafeOperators(): void {
    this.knownSafeOperators.clear();
  }

  /**
   * 获取所有安全授权地址
   */
  getSafeOperators(): Array<{
    address: string;
    name: string;
    description: string;
    verified: boolean;
  }> {
    const result: Array<{
      address: string;
      name: string;
      description: string;
      verified: boolean;
    }> = [];
    this.knownSafeOperators.forEach((info, address) => {
      result.push({ address, ...info });
    });
    return result;
  }

  /**
   * 记录用户授权历史
   * @param userId 用户 ID
   * @param record 授权记录
   */
  recordApproval(userId: string, record: Omit<NFTApprovalRecord, 'timestamp'>): void {
    let records = this.userApprovals.get(userId);
    if (!records) {
      records = [];
      this.userApprovals.set(userId, records);
    }

    records.push({
      ...record,
      timestamp: new Date(),
    });
  }

  /**
   * 获取用户 NFT 授权历史
   * @param userId 用户 ID
   */
  getUserApprovals(userId: string): NFTApprovalRecord[] {
    return this.userApprovals.get(userId) || [];
  }

  /**
   * 获取用户当前有效的授权数量
   * @param userId 用户 ID
   */
  getActiveApprovalCount(userId: string): number {
    const records = this.userApprovals.get(userId) || [];
    const active = new Map<string, boolean>();

    for (const record of records) {
      const key = `${record.contractAddress.toLowerCase()}-${record.operator.toLowerCase()}`;
      active.set(key, record.approved);
    }

    let count = 0;
    active.forEach((approved) => {
      if (approved) count++;
    });

    return count;
  }

  /**
   * 检测是否为 setApprovalForAll 调用
   * @param data 交易数据
   */
  isSetApprovalForAllCall(data: string): boolean {
    if (!data || data.length < 10) return false;
    const selector = data.slice(0, 10).toLowerCase();
    return selector === this.ERC721_SET_APPROVAL_FOR_ALL_SELECTOR;
  }

  /**
   * 从交易数据中提取授权信息
   * @param data 交易数据
   */
  extractApprovalInfo(data: string): {
    operator?: string;
    approved?: boolean;
    tokenStandard?: 'erc721' | 'erc1155';
  } | null {
    if (!this.isSetApprovalForAllCall(data) || data.length < 138) {
      return null;
    }

    const operator = '0x' + data.slice(34, 74).toLowerCase();
    const approvedHex = data.slice(104, 138).toLowerCase();
    const approved = approvedHex !== '0'.repeat(34);

    return {
      operator,
      approved,
      tokenStandard: 'erc721',
    };
  }

  /**
   * 从 typed data 中检测 NFT 授权
   * @param payload 签名负载
   */
  detectTypedDataApproval(payload: unknown): {
    isNFTApproval: boolean;
    approvalType?: string;
    details?: Record<string, unknown>;
  } {
    try {
      const data = payload as Record<string, unknown>;
      const types = data.types as Record<string, unknown>;
      const message = data.message as Record<string, unknown>;

      if (!types) return { isNFTApproval: false };

      const nftTypes = [
        'PermitForAll',
        'NFTPermit',
        'SetApprovalForAll',
        'ERC721Permit',
        'ERC1155Permit',
      ];

      for (const typeName of nftTypes) {
        if (types[typeName]) {
          return {
            isNFTApproval: true,
            approvalType: typeName,
            details: message,
          };
        }
      }

      return { isNFTApproval: false };
    } catch {
      return { isNFTApproval: false };
    }
  }

  /**
   * 评估 NFT 授权风险
   * @param operator 被授权地址
   * @param approved 是否授权
   * @param context 风控上下文
   * @param contractAddress 合约地址
   */
  assessApprovalRisk(
    operator: string,
    approved: boolean,
    context: RiskContext,
    contractAddress?: string
  ): {
    isRisky: boolean;
    level: RiskLevel;
    score: number;
    action: RiskAction;
    reason: string;
    details: Record<string, unknown>;
  } {
    if (!approved) {
      return {
        isRisky: false,
        level: RiskLevel.LOW,
        score: 0,
        action: RiskAction.ALLOW,
        reason: '取消授权操作，无风险',
        details: { operator, approved },
      };
    }

    const details: Record<string, unknown> = {
      operator,
      approved,
      contractAddress,
    };

    let score = this.parameters.threshold || 60;
    let level = RiskLevel.HIGH;
    let action = this.parameters.action || RiskAction.SECOND_CONFIRM;

    const safeOperatorResult = this.isSafeOperator(operator);
    details.isVerifiedOperator = safeOperatorResult.verified;
    details.operatorName = safeOperatorResult.name;

    if (safeOperatorResult.isSafe && safeOperatorResult.verified) {
      score = 30;
      level = RiskLevel.MEDIUM;
      action = RiskAction.WARN;
      details.riskType = 'verified_operator';
    } else if (safeOperatorResult.isSafe) {
      score = 50;
      level = RiskLevel.MEDIUM;
      action = RiskAction.SECOND_CONFIRM;
      details.riskType = 'known_operator';
    } else {
      details.riskType = 'unknown_operator';
    }

    const isNewDevice = context.device?.isNewDevice;
    const isAbnormalLocation = context.device?.isAbnormalLocation;

    if (isNewDevice) {
      score += 15;
      details.newDevice = true;
      if (level < RiskLevel.HIGH) level = RiskLevel.HIGH;
    }

    if (isAbnormalLocation) {
      score += 15;
      details.abnormalLocation = true;
      if (level < RiskLevel.HIGH) level = RiskLevel.HIGH;
    }

    if (context.userId) {
      const activeApprovals = this.getActiveApprovalCount(context.userId);
      details.activeApprovalCount = activeApprovals;
      if (activeApprovals >= 5) {
        score += 10;
      }
    }

    score = Math.min(score, 100);

    let reason: string;
    if (safeOperatorResult.isSafe && safeOperatorResult.verified) {
      reason = `向已验证平台（${safeOperatorResult.name}）授权全部 NFT，请确认操作`;
    } else if (safeOperatorResult.isSafe) {
      reason = `向已知地址（${safeOperatorResult.name}）授权全部 NFT，请谨慎操作`;
    } else {
      reason = '向未知地址授权全部 NFT，授权后对方可转移您所有的该系列 NFT，风险极高';
    }

    if (isNewDevice || isAbnormalLocation) {
      reason += '，且处于异常环境（新设备/异常位置）';
    }

    return {
      isRisky: true,
      level,
      score,
      action,
      reason,
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

    if (context.signType === SignType.TRANSACTION) {
      const data = context.transaction?.data;
      if (data && this.isSetApprovalForAllCall(data)) {
        return true;
      }
    }

    if (context.signType === SignType.TYPED_DATA && context.payload) {
      const result = this.detectTypedDataApproval(context.payload);
      if (result.isNFTApproval) {
        return true;
      }
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
      return {
        ruleCode: this.ruleCode,
        ruleName: this.ruleName,
        category: this.category,
        matched: false,
        score: 0,
        level: RiskLevel.LOW,
        action: RiskAction.ALLOW,
        reason: '规则不适用（非 NFT 批量授权操作）',
        priority: this.priority,
        evaluationTime: Date.now() - startTime,
      };
    }

    let operator = '';
    let approved = true;
    let contractAddress = context.transaction?.contractAddress || context.transaction?.to;
    let approvalType = 'transaction';

    if (context.signType === SignType.TRANSACTION && context.transaction?.data) {
      const approvalInfo = this.extractApprovalInfo(context.transaction.data);
      if (approvalInfo) {
        operator = approvalInfo.operator || '';
        approved = approvalInfo.approved !== false;
      }
    } else if (context.signType === SignType.TYPED_DATA && context.payload) {
      const typedResult = this.detectTypedDataApproval(context.payload);
      approvalType = typedResult.approvalType || 'typed_data';
      const message = (context.payload as Record<string, unknown>)?.message as Record<string, unknown>;
      if (message) {
        if (message['operator']) operator = message['operator'] as string;
        if (message['approved'] !== undefined) approved = message['approved'] as boolean;
        if (message['token']) contractAddress = message['token'] as string;
      }
    }

    const riskAssessment = this.assessApprovalRisk(
      operator,
      approved,
      context,
      contractAddress
    );

    return {
      ruleCode: this.ruleCode,
      ruleName: this.ruleName,
      category: this.category,
      matched: riskAssessment.isRisky,
      score: riskAssessment.score,
      level: riskAssessment.level,
      action: riskAssessment.action,
      reason: riskAssessment.reason,
      detail: {
        ...riskAssessment.details,
        approvalType,
      },
      priority: this.priority,
      evaluationTime: Date.now() - startTime,
    };
  }
}

export const nftApprovalRule = new NFTApprovalRule();
