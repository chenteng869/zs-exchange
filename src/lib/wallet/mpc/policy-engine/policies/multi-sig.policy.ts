/**
 * 多签策略 (Multi-Sig Policy)
 *
 * 功能：
 *  - 支持多种多签模式（M-of-N）
 *  - 支持按金额分级的多签要求
 *  - 支持指定签名者角色
 *  - 支持加权多签
 */

import {
  PolicyType,
  SignaturePolicy,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  ApprovalMode,
  WalletTier,
} from '../../mpc.types';
import { BasePolicyEvaluator } from '../policy-evaluator';

// =============================================================================
// 多签策略参数接口
// =============================================================================

export interface MultiSigPolicyParams {
  /** 多签模式：m_of_n / weighted / tiered */
  mode: 'm_of_n' | 'weighted' | 'tiered';
  /** 所需签名数（m_of_n 模式） */
  requiredSigners?: number;
  /** 总签名者数（m_of_n 模式） */
  totalSigners?: number;
  /** 签名者列表 */
  signers: MultiSigSigner[];
  /** 所需权重（weighted 模式） */
  requiredWeight?: number;
  /** 分级配置（tiered 模式） */
  tiers?: MultiSigTier[];
  /** 是否允许同一人多次签名 */
  allowDuplicateSigners?: boolean;
  /** 签名有效期（秒） */
  signatureValiditySeconds?: number;
}

/**
 * 多签签名者
 */
export interface MultiSigSigner {
  id: string;
  name: string;
  role: string;
  weight?: number;
  required?: boolean;
}

/**
 * 分级多签配置
 */
export interface MultiSigTier {
  minAmount: string;
  maxAmount?: string;
  requiredSigners: number;
  signerRoles: string[];
}

// =============================================================================
// 当前签名状态
// =============================================================================

interface CurrentSignatures {
  signerIds: string[];
  totalWeight: number;
  signatures: Map<string, { signature: string; timestamp: number }>;
}

// =============================================================================
// 多签策略评估器
// =============================================================================

export class MultiSigPolicyEvaluator extends BasePolicyEvaluator {
  readonly policyType = PolicyType.MULTI_SIG;

  private signatureCache: Map<string, CurrentSignatures> = new Map();

  /**
   * 评估多签策略
   */
  async evaluate(
    policy: SignaturePolicy,
    context: PolicyEvaluationContext,
  ): Promise<PolicyEvaluationResult> {
    const params = this.parseParams(policy);

    if (params.signers.length === 0) {
      return this.allow(policy, '未配置签名者，跳过多签检查');
    }

    const amount = context.amount || '0';
    const cacheKey = this.getCacheKey(context);
    const currentSigs = this.getCurrentSignatures(cacheKey);

    const requiredInfo = this.calculateRequiredSignatures(params, amount, context.wallet.tier);

    const triggeredRules: string[] = [];
    let riskScore = this.calculateBaseRiskScore(params, context.wallet.tier);

    const currentCount = currentSigs.signerIds.length;
    const currentWeight = currentSigs.totalWeight;

    switch (params.mode) {
      case 'm_of_n': {
        const required = requiredInfo.requiredSigners || params.requiredSigners || 2;
        if (currentCount >= required) {
          const result = this.allow(policy, `多签要求已满足（${currentCount}/${required}）`);
          result.triggeredRules = ['multi_sig_satisfied'];
          result.riskScore = Math.max(10, riskScore - 20);
          return result;
        }

        triggeredRules.push('multi_sig_m_of_n_required');
        const result = this.requireApproval(
          policy,
          `需要 ${required} 个签名，当前已有 ${currentCount} 个`,
          {
            mode: ApprovalMode.ANY_OF,
            approvers: params.signers.map((s) => s.id),
            requiredApprovals: required,
            timeoutSeconds: params.signatureValiditySeconds || 86400,
            allowDelegation: !params.allowDuplicateSigners,
            approvalLevel: this.determineApprovalLevel(required, context.wallet.tier),
          },
          riskScore,
        );
        result.triggeredRules = triggeredRules;
        return result;
      }

      case 'weighted': {
        const requiredWeight = requiredInfo.requiredWeight || params.requiredWeight || 100;
        if (currentWeight >= requiredWeight) {
          const result = this.allow(
            policy,
            `加权多签要求已满足（${currentWeight}/${requiredWeight}）`,
          );
          result.triggeredRules = ['multi_sig_weighted_satisfied'];
          result.riskScore = Math.max(10, riskScore - 20);
          return result;
        }

        triggeredRules.push('multi_sig_weighted_required');
        const result = this.requireApproval(
          policy,
          `需要权重 ${requiredWeight}，当前权重 ${currentWeight}`,
          {
            mode: ApprovalMode.ANY_OF,
            approvers: params.signers.map((s) => s.id),
            timeoutSeconds: params.signatureValiditySeconds || 86400,
            allowDelegation: !params.allowDuplicateSigners,
            approvalLevel: this.determineApprovalLevel(
              Math.ceil(requiredWeight / 50),
              context.wallet.tier,
            ),
          },
          riskScore,
        );
        result.triggeredRules = triggeredRules;
        return result;
      }

      case 'tiered': {
        const tier = requiredInfo.tier;
        if (tier) {
          if (currentCount >= tier.requiredSigners) {
            const result = this.allow(
              policy,
              `分级多签要求已满足（${currentCount}/${tier.requiredSigners}）`,
            );
            result.triggeredRules = ['multi_sig_tiered_satisfied'];
            result.riskScore = Math.max(10, riskScore - 20);
            return result;
          }

          triggeredRules.push('multi_sig_tiered_required');
          const result = this.requireApproval(
            policy,
            `当前金额级别需要 ${tier.requiredSigners} 个签名，当前已有 ${currentCount} 个`,
            {
              mode: ApprovalMode.ANY_OF,
              approvers: params.signers
                .filter((s) => tier.signerRoles.includes(s.role))
                .map((s) => s.id),
              requiredApprovals: tier.requiredSigners,
              timeoutSeconds: params.signatureValiditySeconds || 86400,
              allowDelegation: !params.allowDuplicateSigners,
              approvalLevel: this.determineApprovalLevel(
                tier.requiredSigners,
                context.wallet.tier,
              ),
            },
            riskScore,
          );
          result.triggeredRules = triggeredRules;
          return result;
        }
        break;
      }
    }

    return this.allow(policy, '多签策略检查通过');
  }

  /**
   * 解析策略参数
   */
  private parseParams(policy: SignaturePolicy): MultiSigPolicyParams {
    return {
      mode: this.getParam<'m_of_n' | 'weighted' | 'tiered'>(policy, 'mode', 'm_of_n'),
      requiredSigners: this.getParam<number>(policy, 'requiredSigners', 2),
      totalSigners: this.getParam<number>(policy, 'totalSigners', 3),
      signers: this.getParam<MultiSigSigner[]>(policy, 'signers', []),
      requiredWeight: this.getParam<number>(policy, 'requiredWeight', 100),
      tiers: this.getParam<MultiSigTier[]>(policy, 'tiers', []),
      allowDuplicateSigners: this.getParam<boolean>(policy, 'allowDuplicateSigners', false),
      signatureValiditySeconds: this.getParam<number>(policy, 'signatureValiditySeconds', 86400),
    };
  }

  /**
   * 计算所需签名数
   */
  private calculateRequiredSignatures(
    params: MultiSigPolicyParams,
    amount: string,
    tier: WalletTier,
  ): {
    requiredSigners?: number;
    requiredWeight?: number;
    tier?: MultiSigTier;
  } {
    const result: {
      requiredSigners?: number;
      requiredWeight?: number;
      tier?: MultiSigTier;
    } = {};

    if (params.mode === 'tiered' && params.tiers && params.tiers.length > 0) {
      const amt = BigInt(amount || '0');
      const sortedTiers = [...params.tiers].sort((a, b) => {
        const left = BigInt(a.minAmount);
        const right = BigInt(b.minAmount);
        if (left === right) return 0;
        return left > right ? 1 : -1;
      });

      for (const t of sortedTiers) {
        if (amt >= BigInt(t.minAmount)) {
          result.tier = t;
          result.requiredSigners = t.requiredSigners;
          break;
        }
      }

      if (!result.tier && sortedTiers.length > 0) {
        result.tier = sortedTiers[sortedTiers.length - 1];
        result.requiredSigners = result.tier.requiredSigners;
      }
    }

    if (tier === WalletTier.COLD) {
      if (result.requiredSigners) {
        result.requiredSigners = Math.min(params.signers.length, result.requiredSigners + 1);
      }
    }

    return result;
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(context: PolicyEvaluationContext): string {
    return `${context.wallet.id}:${context.userId}:${context.signType}`;
  }

  /**
   * 获取当前签名状态
   */
  private getCurrentSignatures(key: string): CurrentSignatures {
    const cached = this.signatureCache.get(key);
    if (cached) {
      return this.cleanExpiredSignatures(cached);
    }

    const newSigs: CurrentSignatures = {
      signerIds: [],
      totalWeight: 0,
      signatures: new Map(),
    };
    this.signatureCache.set(key, newSigs);
    return newSigs;
  }

  /**
   * 清理过期签名
   */
  private cleanExpiredSignatures(sigs: CurrentSignatures): CurrentSignatures {
    const now = Date.now();
    const validityMs = 86400 * 1000;

    let changed = false;
    for (const [signerId, sig] of sigs.signatures.entries()) {
      if (now - sig.timestamp > validityMs) {
        sigs.signatures.delete(signerId);
        sigs.signerIds = sigs.signerIds.filter((id) => id !== signerId);
        changed = true;
      }
    }

    if (changed) {
      sigs.totalWeight = 0;
    }

    return sigs;
  }

  /**
   * 计算基础风险分数
   */
  private calculateBaseRiskScore(params: MultiSigPolicyParams, tier: WalletTier): number {
    let score = 30;

    if (params.mode === 'm_of_n' && params.requiredSigners) {
      score += params.requiredSigners * 5;
    }

    if (tier === WalletTier.COLD) {
      score += 30;
    } else if (tier === WalletTier.WARM) {
      score += 15;
    }

    return Math.min(100, score);
  }

  /**
   * 确定审批级别
   */
  private determineApprovalLevel(signerCount: number, tier: WalletTier): number {
    let baseLevel = 2;

    if (signerCount >= 5) baseLevel = 5;
    else if (signerCount >= 4) baseLevel = 4;
    else if (signerCount >= 3) baseLevel = 3;

    if (tier === WalletTier.COLD) baseLevel = Math.min(5, baseLevel + 1);

    return baseLevel;
  }

  /**
   * 添加签名
   */
  addSignature(
    context: PolicyEvaluationContext,
    signerId: string,
    signature: string,
    weight: number = 1,
  ): boolean {
    const key = this.getCacheKey(context);
    const sigs = this.getCurrentSignatures(key);

    if (sigs.signatures.has(signerId)) {
      return false;
    }

    sigs.signatures.set(signerId, {
      signature,
      timestamp: Date.now(),
    });
    sigs.signerIds.push(signerId);
    sigs.totalWeight += weight;

    this.signatureCache.set(key, sigs);
    return true;
  }

  /**
   * 移除签名
   */
  removeSignature(context: PolicyEvaluationContext, signerId: string): boolean {
    const key = this.getCacheKey(context);
    const sigs = this.signatureCache.get(key);
    if (!sigs) return false;

    const sig = sigs.signatures.get(signerId);
    if (!sig) return false;

    sigs.signatures.delete(signerId);
    sigs.signerIds = sigs.signerIds.filter((id) => id !== signerId);
    sigs.totalWeight = Math.max(0, sigs.totalWeight - 1);

    return true;
  }

  /**
   * 清除签名缓存
   */
  clearSignatures(context: PolicyEvaluationContext): void {
    const key = this.getCacheKey(context);
    this.signatureCache.delete(key);
  }

  /**
   * 获取签名数量
   */
  getSignatureCount(context: PolicyEvaluationContext): number {
    const key = this.getCacheKey(context);
    const sigs = this.getCurrentSignatures(key);
    return sigs.signerIds.length;
  }

  /**
   * 重置所有缓存
   */
  resetAllCache(): void {
    this.signatureCache.clear();
  }
}
