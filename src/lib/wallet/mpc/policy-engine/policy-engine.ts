/**
 * 策略引擎 (PolicyEngine)
 *
 * 负责：
 *  - 策略的注册与管理
 *  - 策略的匹配与执行
 *  - 组合策略的评估
 *  - 策略评估结果的缓存
 *  - 策略评估的统计与监控
 */

import {
  SignaturePolicy,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  CombinedPolicyResult,
  PolicyType,
  PolicyResult,
  MPCError,
  MPCErrorCode,
} from '../mpc.types';
import {
  IPolicyEvaluator,
  CombinedPolicyResultMerger,
  RiskScoreCalculator,
} from './policy-evaluator';
import { WhitelistPolicyEvaluator } from './policies/whitelist.policy';
import { AmountLimitPolicyEvaluator } from './policies/amount-limit.policy';
import { VelocityLimitPolicyEvaluator } from './policies/velocity-limit.policy';
import { MultiSigPolicyEvaluator } from './policies/multi-sig.policy';
import { TimeWindowPolicyEvaluator } from './policies/time-window.policy';

// =============================================================================
// 策略引擎配置
// =============================================================================

export interface PolicyEngineOptions {
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 缓存过期时间（毫秒） */
  cacheTtlMs?: number;
  /** 最大缓存条目数 */
  maxCacheSize?: number;
  /** 是否启用评估超时 */
  enableTimeout?: boolean;
  /** 单个策略评估超时时间（毫秒） */
  evaluationTimeoutMs?: number;
}

// =============================================================================
// 缓存条目
// =============================================================================

interface CacheEntry {
  key: string;
  result: CombinedPolicyResult;
  timestamp: number;
}

// =============================================================================
// 策略引擎类
// =============================================================================

/**
 * 策略引擎
 * 管理和执行所有签名策略
 */
export class PolicyEngine {
  private evaluators: Map<PolicyType, IPolicyEvaluator> = new Map();
  private policies: Map<string, SignaturePolicy> = new Map();
  private resultMerger: CombinedPolicyResultMerger;
  private riskScoreCalculator: RiskScoreCalculator;

  private enableCache: boolean;
  private cacheTtlMs: number;
  private maxCacheSize: number;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheKeys: string[] = [];

  private enableTimeout: boolean;
  private evaluationTimeoutMs: number;

  private evaluationStats = {
    totalEvaluations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    failedEvaluations: 0,
    totalEvaluationTimeMs: 0,
  };

  constructor(options: PolicyEngineOptions = {}) {
    this.resultMerger = new CombinedPolicyResultMerger();
    this.riskScoreCalculator = new RiskScoreCalculator();

    this.enableCache = options.enableCache ?? true;
    this.cacheTtlMs = options.cacheTtlMs ?? 60 * 1000;
    this.maxCacheSize = options.maxCacheSize ?? 1000;
    this.enableTimeout = options.enableTimeout ?? false;
    this.evaluationTimeoutMs = options.evaluationTimeoutMs ?? 5000;

    this.registerDefaultEvaluators();
  }

  // ===========================================================================
  // 评估器注册与管理
  // ===========================================================================

  /**
   * 注册默认的策略评估器
   */
  private registerDefaultEvaluators(): void {
    this.registerEvaluator(new WhitelistPolicyEvaluator());
    this.registerEvaluator(new AmountLimitPolicyEvaluator());
    this.registerEvaluator(new VelocityLimitPolicyEvaluator());
    this.registerEvaluator(new MultiSigPolicyEvaluator());
    this.registerEvaluator(new TimeWindowPolicyEvaluator());
  }

  /**
   * 注册策略评估器
   */
  registerEvaluator(evaluator: IPolicyEvaluator): void {
    this.evaluators.set(evaluator.policyType, evaluator);
  }

  /**
   * 获取策略评估器
   */
  getEvaluator(policyType: PolicyType): IPolicyEvaluator | undefined {
    return this.evaluators.get(policyType);
  }

  /**
   * 检查评估器是否存在
   */
  hasEvaluator(policyType: PolicyType): boolean {
    return this.evaluators.has(policyType);
  }

  // ===========================================================================
  // 策略管理
  // ===========================================================================

  /**
   * 添加策略
   */
  addPolicy(policy: SignaturePolicy): void {
    if (!this.hasEvaluator(policy.type)) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `不支持的策略类型: ${policy.type}`,
      );
    }
    this.policies.set(policy.id, policy);
  }

  /**
   * 批量添加策略
   */
  addPolicies(policies: SignaturePolicy[]): void {
    for (const policy of policies) {
      this.addPolicy(policy);
    }
  }

  /**
   * 更新策略
   */
  updatePolicy(policyId: string, updates: Partial<SignaturePolicy>): void {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `策略不存在: ${policyId}`,
      );
    }
    this.policies.set(policyId, { ...policy, ...updates, updatedAt: new Date() });
    this.invalidateCacheByPolicy(policyId);
  }

  /**
   * 删除策略
   */
  removePolicy(policyId: string): void {
    this.policies.delete(policyId);
    this.invalidateCacheByPolicy(policyId);
  }

  /**
   * 获取策略
   */
  getPolicy(policyId: string): SignaturePolicy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * 获取所有策略
   */
  getAllPolicies(): SignaturePolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * 根据类型获取策略
   */
  getPoliciesByType(type: PolicyType): SignaturePolicy[] {
    return this.getAllPolicies().filter((p) => p.type === type);
  }

  /**
   * 根据钱包 ID 获取适用的策略
   */
  getPoliciesForWallet(walletTier: string, chainType: string): SignaturePolicy[] {
    return this.getAllPolicies().filter((policy) => {
      if (!policy.enabled) return false;

      if (policy.applicableTiers && policy.applicableTiers.length > 0) {
        if (!policy.applicableTiers.includes(walletTier as any)) return false;
      }

      if (policy.applicableChains && policy.applicableChains.length > 0) {
        if (!policy.applicableChains.includes(chainType as any)) return false;
      }

      return true;
    });
  }

  // ===========================================================================
  // 策略评估
  // ===========================================================================

  /**
   * 评估所有适用的策略
   * @param policyIds 策略 ID 列表
   * @param context 评估上下文
   * @returns 组合评估结果
   */
  async evaluate(
    policyIds: string[],
    context: PolicyEvaluationContext,
  ): Promise<CombinedPolicyResult> {
    const cacheKey = this.generateCacheKey(policyIds, context);

    if (this.enableCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.evaluationStats.cacheHits++;
        return cached;
      }
      this.evaluationStats.cacheMisses++;
    }

    const startTime = Date.now();
    this.evaluationStats.totalEvaluations++;

    try {
      const applicablePolicies = this.getApplicablePolicies(policyIds, context);
      const results = await this.evaluatePolicies(applicablePolicies, context);
      const combinedResult = this.resultMerger.merge(results);

      const evaluationTime = Date.now() - startTime;
      this.evaluationStats.totalEvaluationTimeMs += evaluationTime;

      if (this.enableCache) {
        this.addToCache(cacheKey, combinedResult);
      }

      return combinedResult;
    } catch (error) {
      this.evaluationStats.failedEvaluations++;
      throw error;
    }
  }

  /**
   * 评估单个策略
   */
  async evaluateSinglePolicy(
    policyId: string,
    context: PolicyEvaluationContext,
  ): Promise<PolicyEvaluationResult> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `策略不存在: ${policyId}`,
      );
    }

    const evaluator = this.evaluators.get(policy.type);
    if (!evaluator) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `不支持的策略类型: ${policy.type}`,
      );
    }

    if (!evaluator.isApplicable(policy, context)) {
      return {
        policyId: policy.id,
        policyName: policy.name,
        policyType: policy.type,
        result: PolicyResult.ALLOW,
        passed: true,
        riskScore: 0,
        reason: '策略不适用当前上下文',
        triggeredRules: [],
        evaluationTimeMs: 0,
      };
    }

    const startTime = Date.now();
    let result: PolicyEvaluationResult;

    if (this.enableTimeout) {
      result = await this.evaluateWithTimeout(evaluator, policy, context);
    } else {
      result = await evaluator.evaluate(policy, context);
    }

    result.evaluationTimeMs = Date.now() - startTime;
    return result;
  }

  /**
   * 获取适用的策略列表
   */
  private getApplicablePolicies(
    policyIds: string[],
    context: PolicyEvaluationContext,
  ): SignaturePolicy[] {
    const policies: SignaturePolicy[] = [];

    for (const policyId of policyIds) {
      const policy = this.policies.get(policyId);
      if (!policy) continue;

      const evaluator = this.evaluators.get(policy.type);
      if (!evaluator) continue;

      if (evaluator.isApplicable(policy, context)) {
        policies.push(policy);
      }
    }

    policies.sort((a, b) => a.priority - b.priority);
    return policies;
  }

  /**
   * 批量评估策略
   */
  private async evaluatePolicies(
    policies: SignaturePolicy[],
    context: PolicyEvaluationContext,
  ): Promise<PolicyEvaluationResult[]> {
    const results: PolicyEvaluationResult[] = [];

    for (const policy of policies) {
      try {
        const result = await this.evaluateSinglePolicy(policy.id, context);
        results.push(result);

        if (result.result === PolicyResult.REJECT) {
          break;
        }
      } catch (error) {
        results.push({
          policyId: policy.id,
          policyName: policy.name,
          policyType: policy.type,
          result: PolicyResult.REJECT,
          passed: false,
          riskScore: 100,
          reason: `策略评估失败: ${error instanceof Error ? error.message : String(error)}`,
          triggeredRules: [],
          evaluationTimeMs: 0,
        });
        break;
      }
    }

    return results;
  }

  /**
   * 带超时的策略评估
   */
  private async evaluateWithTimeout(
    evaluator: IPolicyEvaluator,
    policy: SignaturePolicy,
    context: PolicyEvaluationContext,
  ): Promise<PolicyEvaluationResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new MPCError(MPCErrorCode.INTERNAL_ERROR, `策略评估超时: ${policy.name}`));
      }, this.evaluationTimeoutMs);

      evaluator
        .evaluate(policy, context)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  // ===========================================================================
  // 缓存管理
  // ===========================================================================

  /**
   * 生成缓存键
   */
  private generateCacheKey(policyIds: string[], context: PolicyEvaluationContext): string {
    const keyData = {
      policyIds: policyIds.sort(),
      walletId: context.wallet.id,
      signType: context.signType,
      chainType: context.chainType,
      toAddress: context.toAddress,
      amount: context.amount,
      tokenSymbol: context.tokenSymbol,
      userId: context.userId,
      requestTime: context.requestTime.toISOString().slice(0, 13),
    };
    return JSON.stringify(keyData);
  }

  /**
   * 从缓存获取结果
   */
  private getFromCache(key: string): CombinedPolicyResult | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now - entry.timestamp > this.cacheTtlMs) {
      this.cache.delete(key);
      this.cacheKeys = this.cacheKeys.filter((k) => k !== key);
      return undefined;
    }

    return entry.result;
  }

  /**
   * 添加结果到缓存
   */
  private addToCache(key: string, result: CombinedPolicyResult): void {
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cacheKeys.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      key,
      result,
      timestamp: Date.now(),
    });
    this.cacheKeys.push(key);
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheKeys = [];
  }

  /**
   * 根据策略 ID 失效缓存
   */
  private invalidateCacheByPolicy(policyId: string): void {
    const keysToDelete: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (key.includes(policyId)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.cacheKeys = this.cacheKeys.filter((k) => k !== key);
    }
  }

  // ===========================================================================
  // 统计与监控
  // ===========================================================================

  /**
   * 获取评估统计信息
   */
  getEvaluationStats() {
    const avgTime =
      this.evaluationStats.totalEvaluations > 0
        ? this.evaluationStats.totalEvaluationTimeMs / this.evaluationStats.totalEvaluations
        : 0;

    const cacheHitRate =
      this.evaluationStats.totalEvaluations > 0
        ? this.evaluationStats.cacheHits /
          (this.evaluationStats.cacheHits + this.evaluationStats.cacheMisses)
        : 0;

    return {
      ...this.evaluationStats,
      averageEvaluationTimeMs: avgTime,
      cacheHitRate,
      cacheSize: this.cache.size,
      registeredPolicies: this.policies.size,
      registeredEvaluators: this.evaluators.size,
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.evaluationStats = {
      totalEvaluations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      failedEvaluations: 0,
      totalEvaluationTimeMs: 0,
    };
  }

  // ===========================================================================
  // 工具方法
  // ===========================================================================

  /**
   * 获取风险评分计算器
   */
  getRiskScoreCalculator(): RiskScoreCalculator {
    return this.riskScoreCalculator;
  }

  /**
   * 验证策略配置是否有效
   */
  validatePolicy(policy: SignaturePolicy): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!policy.id) {
      errors.push('策略 ID 不能为空');
    }
    if (!policy.name) {
      errors.push('策略名称不能为空');
    }
    if (!policy.type) {
      errors.push('策略类型不能为空');
    }
    if (!this.hasEvaluator(policy.type)) {
      errors.push(`不支持的策略类型: ${policy.type}`);
    }
    if (policy.priority < 0) {
      errors.push('策略优先级不能为负数');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
