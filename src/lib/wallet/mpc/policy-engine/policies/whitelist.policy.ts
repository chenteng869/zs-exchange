/**
 * 白名单策略 (Whitelist Policy)
 *
 * 功能：
 *  - 检查目标地址是否在白名单中
 *  - 支持地址白名单和标签白名单
 *  - 支持严格模式和宽松模式
 *  - 支持白名单地址的风险等级评估
 */

import {
  PolicyType,
  SignaturePolicy,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  ApprovalMode,
} from '../../mpc.types';
import { BasePolicyEvaluator } from '../policy-evaluator';

// =============================================================================
// 白名单策略参数接口
// =============================================================================

export interface WhitelistPolicyParams {
  /** 白名单地址列表 */
  whitelistedAddresses: string[];
  /** 黑名单地址列表（优先级高于白名单） */
  blacklistedAddresses?: string[];
  /** 白名单标签列表（用于地址分组） */
  whitelistedTags?: string[];
  /** 是否启用严格模式（不在白名单直接拒绝，否则要求审批） */
  strictMode: boolean;
  /** 是否检查合约地址风险 */
  checkContractRisk?: boolean;
  /** 高风险地址列表（需要额外审批） */
  highRiskAddresses?: string[];
  /** 地址风险评分阈值 */
  riskScoreThreshold?: number;
}

// =============================================================================
// 地址信息接口
// =============================================================================

interface AddressInfo {
  address: string;
  tag?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  isContract?: boolean;
  verified?: boolean;
}

// =============================================================================
// 白名单策略评估器
// =============================================================================

export class WhitelistPolicyEvaluator extends BasePolicyEvaluator {
  readonly policyType = PolicyType.WHITELIST;

  private addressCache: Map<string, AddressInfo> = new Map();

  /**
   * 评估白名单策略
   */
  async evaluate(
    policy: SignaturePolicy,
    context: PolicyEvaluationContext,
  ): Promise<PolicyEvaluationResult> {
    const params = this.parseParams(policy);

    const toAddress = context.toAddress;
    if (!toAddress) {
      return this.allow(policy, '无目标地址，跳过白名单检查');
    }

    const normalizedAddress = this.normalizeAddress(toAddress, context.chainType as string);

    if (this.isBlacklisted(normalizedAddress, params)) {
      const result = this.reject(
        policy,
        `目标地址 ${toAddress} 在黑名单中，交易被拒绝`,
        100,
      );
      result.triggeredRules = ['blacklist_check'];
      return result;
    }

    if (this.isWhitelisted(normalizedAddress, params)) {
      const addressInfo = this.getAddressInfo(normalizedAddress);
      const riskScore = this.calculateAddressRiskScore(addressInfo);

      if (riskScore >= 70) {
        const result = this.requireApproval(
          policy,
          `目标地址 ${toAddress} 在白名单中，但风险等级较高，需要审批`,
          {
            mode: ApprovalMode.SINGLE,
            approvers: ['risk_manager'],
            timeoutSeconds: 7200,
            allowDelegation: true,
            approvalLevel: 2,
          },
          riskScore,
        );
        result.triggeredRules = ['whitelist_high_risk'];
        return result;
      }

      const result = this.allow(policy, `目标地址 ${toAddress} 在白名单中`);
      result.riskScore = riskScore;
      result.triggeredRules = ['whitelist_passed'];
      return result;
    }

    if (params.strictMode) {
      const result = this.reject(
        policy,
        `目标地址 ${toAddress} 不在白名单中，严格模式下交易被拒绝`,
        80,
      );
      result.triggeredRules = ['whitelist_strict_reject'];
      return result;
    }

    const result = this.requireApproval(
      policy,
      `目标地址 ${toAddress} 不在白名单中，需要审批`,
      {
        mode: ApprovalMode.SINGLE,
        approvers: ['operation_manager'],
        timeoutSeconds: 14400,
        allowDelegation: true,
        approvalLevel: 1,
      },
      50,
    );
    result.triggeredRules = ['whitelist_require_approval'];
    return result;
  }

  /**
   * 解析策略参数
   */
  private parseParams(policy: SignaturePolicy): WhitelistPolicyParams {
    return {
      whitelistedAddresses: this.getParam<string[]>(policy, 'whitelistedAddresses', []),
      blacklistedAddresses: this.getParam<string[]>(policy, 'blacklistedAddresses', []),
      whitelistedTags: this.getParam<string[]>(policy, 'whitelistedTags', []),
      strictMode: this.getParam<boolean>(policy, 'strictMode', false),
      checkContractRisk: this.getParam<boolean>(policy, 'checkContractRisk', true),
      highRiskAddresses: this.getParam<string[]>(policy, 'highRiskAddresses', []),
      riskScoreThreshold: this.getParam<number>(policy, 'riskScoreThreshold', 70),
    };
  }

  /**
   * 检查地址是否在黑名单中
   */
  private isBlacklisted(address: string, params: WhitelistPolicyParams): boolean {
    if (!params.blacklistedAddresses || params.blacklistedAddresses.length === 0) {
      return false;
    }
    return params.blacklistedAddresses.some(
      (addr) => this.normalizeAddress(addr, 'evm') === address,
    );
  }

  /**
   * 检查地址是否在白名单中
   */
  private isWhitelisted(address: string, params: WhitelistPolicyParams): boolean {
    if (params.whitelistedAddresses.length === 0) {
      return false;
    }
    return params.whitelistedAddresses.some(
      (addr) => this.normalizeAddress(addr, 'evm') === address,
    );
  }

  /**
   * 标准化地址格式
   */
  private normalizeAddress(address: string, chainType: string): string {
    switch (chainType) {
      case 'evm':
        return address.toLowerCase();
      case 'solana':
        return address;
      case 'bitcoin':
        return address;
      case 'tron':
        return address;
      default:
        return address.toLowerCase();
    }
  }

  /**
   * 获取地址信息（模拟从外部服务获取）
   */
  private getAddressInfo(address: string): AddressInfo {
    const cached = this.addressCache.get(address);
    if (cached) return cached;

    const info: AddressInfo = {
      address,
      riskLevel: 'low',
      isContract: false,
      verified: true,
    };

    this.addressCache.set(address, info);
    return info;
  }

  /**
   * 计算地址风险分数
   */
  private calculateAddressRiskScore(addressInfo?: AddressInfo): number {
    if (!addressInfo) return 10;

    let score = 0;

    switch (addressInfo.riskLevel) {
      case 'critical':
        score += 90;
        break;
      case 'high':
        score += 70;
        break;
      case 'medium':
        score += 40;
        break;
      case 'low':
        score += 10;
        break;
    }

    if (addressInfo.isContract && !addressInfo.verified) {
      score += 20;
    }

    return Math.min(100, score);
  }

  /**
   * 添加地址到白名单缓存
   */
  addAddressToCache(address: string, info: Partial<AddressInfo>): void {
    const normalized = this.normalizeAddress(address, 'evm');
    const existing = this.addressCache.get(normalized) || { address: normalized };
    this.addressCache.set(normalized, { ...existing, ...info });
  }

  /**
   * 清除地址缓存
   */
  clearAddressCache(): void {
    this.addressCache.clear();
  }

  /**
   * 获取缓存的地址数量
   */
  getCachedAddressCount(): number {
    return this.addressCache.size;
  }
}
