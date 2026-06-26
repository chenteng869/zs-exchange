/**
 * 合约维度评分器
 * 从合约风险角度评估风险，包括黑名单、可疑合约、未验证合约等
 */

import {
  RiskContext,
  DimensionScore,
  ScoreDimension,
  RiskLevel,
  ChainType,
  SignType,
} from '../risk-engine.types';

/**
 * 合约维度评分器类
 * 用于从合约风险角度计算风险评分
 */
export class ContractScorer {
  readonly dimension = ScoreDimension.CONTRACT;
  readonly dimensionName = '合约维度';

  private weight = 0.2;

  private blacklistContracts: Set<string> = new Set();
  private verifiedContracts: Map<string, { isOpenSource: boolean; isAudited: boolean }> = new Map();

  private readonly ERC20_APPROVE_SELECTOR = '0x095ea7b3';
  private readonly SET_APPROVAL_FOR_ALL_SELECTOR = '0xa22cb465';
  private readonly MAX_UINT256 = 'f'.repeat(64);

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
   * 添加黑名单合约
   * @param address 合约地址
   */
  addBlacklistContract(address: string): void {
    this.blacklistContracts.add(address.toLowerCase());
  }

  /**
   * 批量添加黑名单合约
   * @param addresses 地址列表
   */
  addBlacklistContracts(addresses: string[]): void {
    addresses.forEach((addr) => this.blacklistContracts.add(addr.toLowerCase()));
  }

  /**
   * 移除黑名单合约
   * @param address 地址
   */
  removeBlacklistContract(address: string): boolean {
    return this.blacklistContracts.delete(address.toLowerCase());
  }

  /**
   * 注册已验证合约
   * @param address 地址
   * @param info 验证信息
   */
  registerVerifiedContract(address: string, info: { isOpenSource: boolean; isAudited: boolean }): void {
    this.verifiedContracts.set(address.toLowerCase(), info);
  }

  /**
   * 批量注册已验证合约
   * @param contracts 合约列表
   */
  registerVerifiedContracts(
    contracts: Array<{ address: string; isOpenSource: boolean; isAudited: boolean }>
  ): void {
    contracts.forEach((c) => {
      this.verifiedContracts.set(c.address.toLowerCase(), {
        isOpenSource: c.isOpenSource,
        isAudited: c.isAudited,
      });
    });
  }

  /**
   * 获取合约验证信息
   * @param address 地址
   */
  getContractInfo(address: string): { isOpenSource: boolean; isAudited: boolean } | null {
    return this.verifiedContracts.get(address.toLowerCase()) || null;
  }

  /**
   * 提取合约地址
   * @param context 风控上下文
   */
  private extractContractAddress(context: RiskContext): string | null {
    if (context.transaction?.contractAddress) {
      return context.transaction.contractAddress.toLowerCase();
    }

    if (
      context.transaction?.to &&
      context.transaction?.data &&
      context.transaction.data !== '0x'
    ) {
      return context.transaction.to.toLowerCase();
    }

    return null;
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
   * 计算黑名单风险分
   * @param contractAddress 合约地址
   */
  private calculateBlacklistScore(contractAddress: string): {
    score: number;
    details: string[];
  } {
    if (this.blacklistContracts.has(contractAddress)) {
      return {
        score: 100,
        details: ['合约地址在黑名单中'],
      };
    }
    return { score: 0, details: [] };
  }

  /**
   * 计算合约验证状态风险分
   * @param contractAddress 合约地址
   */
  private calculateVerificationScore(contractAddress: string): {
    score: number;
    details: string[];
  } {
    const info = this.getContractInfo(contractAddress);

    if (!info) {
      return {
        score: 20,
        details: ['未知合约，未经过验证'],
      };
    }

    let score = 0;
    const details: string[] = [];

    if (!info.isOpenSource) {
      score += 15;
      details.push('合约未开源');
    }

    if (!info.isAudited) {
      score += 10;
      details.push('合约未经过安全审计');
    }

    return { score, details };
  }

  /**
   * 计算授权操作风险分
   * @param data 交易数据
   * @param signType 签名类型
   * @param payload 签名负载
   */
  private calculateApprovalScore(
    data: string,
    signType: SignType,
    payload?: unknown
  ): {
    score: number;
    details: string[];
  } {
    let score = 0;
    const details: string[] = [];

    if (signType === SignType.TRANSACTION && data && data !== '0x') {
      const selector = this.extractMethodSelector(data);

      if (selector === this.ERC20_APPROVE_SELECTOR) {
        if (data.length >= 138) {
          const amountHex = data.slice(138, 202).toLowerCase();
          if (amountHex === this.MAX_UINT256) {
            score = 50;
            details.push('检测到无限额代币授权');
          } else {
            score = 20;
            details.push('检测到代币授权操作');
          }
        } else {
          score = 20;
          details.push('检测到代币授权操作');
        }
      }

      if (selector === this.SET_APPROVAL_FOR_ALL_SELECTOR) {
        if (data.length >= 138) {
          const approvedHex = data.slice(104, 138).toLowerCase();
          if (approvedHex !== '0'.repeat(34)) {
            score = 70;
            details.push('检测到 NFT 批量授权操作（setApprovalForAll）');
          }
        } else {
          score = 50;
          details.push('检测到 setApprovalForAll 调用');
        }
      }
    }

    if (signType === SignType.TYPED_DATA && payload) {
      try {
        const data = payload as Record<string, unknown>;
        const types = data.types as Record<string, unknown>;
        const message = data.message as Record<string, unknown>;

        if (types && (types['Permit'] || types['Permit2'])) {
          const value = message?.value as string;
          if (value && BigInt(value) > BigInt('1000000000000000000000000000000')) {
            score = 45;
            details.push('检测到大额 Permit 授权签名');
          } else {
            score = 25;
            details.push('检测到 Permit 授权签名');
          }
        }

        if (types && (types['PermitForAll'] || types['SetApprovalForAll'])) {
          score = 65;
          details.push('检测到 NFT 批量授权签名');
        }
      } catch {
        // 忽略解析错误
      }
    }

    return { score, details };
  }

  /**
   * 计算可疑方法调用风险分
   * @param data 交易数据
   */
  private calculateSuspiciousMethodScore(data: string): {
    score: number;
    details: string[];
  } {
    if (!data || data === '0x') {
      return { score: 0, details: [] };
    }

    const lowerData = data.toLowerCase();
    let score = 0;
    const details: string[] = [];

    const suspiciousPatterns = [
      { pattern: 'selfdestruct', name: 'selfdestruct', weight: 60 },
      { pattern: 'delegatecall', name: 'delegatecall', weight: 40 },
      { pattern: 'callcode', name: 'callcode', weight: 30 },
    ];

    for (const { pattern, name, weight } of suspiciousPatterns) {
      if (lowerData.includes(pattern)) {
        score = Math.max(score, weight);
        details.push(`检测到可疑操作码：${name}`);
      }
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
      return '合约交互安全';
    }
    return `合约维度风险评分：${score} 分`;
  }

  /**
   * 执行合约维度评分
   * @param context 风控上下文
   * @returns 维度评分结果
   */
  score(context: RiskContext): DimensionScore {
    if (context.chainType !== ChainType.EVM) {
      return {
        dimension: this.dimension,
        dimensionName: this.dimensionName,
        score: 0,
        weight: this.weight,
        weightedScore: 0,
        level: RiskLevel.LOW,
        description: '非 EVM 链，合约维度不评分',
        details: { chainType: context.chainType },
      };
    }

    const contractAddress = this.extractContractAddress(context);
    const data = context.transaction?.data || '0x';

    if (!contractAddress && data === '0x') {
      return {
        dimension: this.dimension,
        dimensionName: this.dimensionName,
        score: 0,
        weight: this.weight,
        weightedScore: 0,
        level: RiskLevel.LOW,
        description: '无合约交互，合约维度不评分',
        details: {},
      };
    }

    let totalScore = 0;
    const allDetails: string[] = [];

    if (contractAddress) {
      const blacklistResult = this.calculateBlacklistScore(contractAddress);
      totalScore = Math.max(totalScore, blacklistResult.score);
      allDetails.push(...blacklistResult.details);

      const verificationResult = this.calculateVerificationScore(contractAddress);
      totalScore = Math.max(totalScore, verificationResult.score);
      allDetails.push(...verificationResult.details);
    }

    const approvalResult = this.calculateApprovalScore(data, context.signType, context.payload);
    totalScore = Math.max(totalScore, approvalResult.score);
    allDetails.push(...approvalResult.details);

    const suspiciousResult = this.calculateSuspiciousMethodScore(data);
    totalScore = Math.max(totalScore, suspiciousResult.score);
    allDetails.push(...suspiciousResult.details);

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
        contractAddress,
        hasBlacklistHit: allDetails.some((d) => d.includes('黑名单')),
        hasApproval: allDetails.some((d) => d.includes('授权')),
        hasSuspicious: allDetails.some((d) => d.includes('可疑')),
      },
    };
  }
}

export const contractScorer = new ContractScorer();
