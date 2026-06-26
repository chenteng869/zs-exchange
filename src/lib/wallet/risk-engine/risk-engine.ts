/**
 * Web3 钱包风控引擎主类
 * 整合规则引擎、评分模型、决策引擎、事件记录等功能
 */

import {
  RiskContext,
  RiskAssessment,
  RiskRule,
  RiskRuleResult,
  RiskRuleConfig,
  RiskScore,
  RiskDecision,
  RiskEngineConfig,
  RiskEnginePlugin,
  RiskLevel,
  RiskAction,
  RuleCategory,
  ChainType,
  ScoreWeights,
  SignType,
  AlertLevel,
} from './risk-engine.types';

import { riskScorer } from './risk-scoring/risk-scorer';
import { amountScorer } from './risk-scoring/amount-scorer';
import { addressScorer } from './risk-scoring/address-scorer';
import { contractScorer } from './risk-scoring/contract-scorer';
import { behaviorScorer } from './risk-scoring/behavior-scorer';
import { deviceScorer } from './risk-scoring/device-scorer';

import { riskDecisionEngine } from './risk-decision.engine';
import { riskEventService } from './risk-event.service';
import { blacklistService } from './blacklist.service';

import { addressBlacklistRule } from './risk-rules/address-blacklist.rule';
import { contractBlacklistRule } from './risk-rules/contract-blacklist.rule';
import { phishingDomainRule } from './risk-rules/phishing-domain.rule';
import { largeTransferRule } from './risk-rules/large-transfer.rule';
import { unlimitedApprovalRule } from './risk-rules/unlimited-approval.rule';
import { newAddressRule } from './risk-rules/new-address.rule';
import { frequentTransactionsRule } from './risk-rules/frequent-transactions.rule';
import { suspiciousContractRule } from './risk-rules/suspicious-contract.rule';
import { zeroValueTransferRule } from './risk-rules/zero-value-transfer.rule';
import { nftApprovalRule } from './risk-rules/nft-approval.rule';

/**
 * Web3 钱包风控引擎类
 * 提供完整的风控评估功能
 */
export class RiskEngine {
  readonly engineVersion = '1.0.0';

  private rules: Map<string, RiskRule> = new Map();
  private plugins: RiskEnginePlugin[] = [];

  private config: RiskEngineConfig = {
    enabled: true,
    mode: 'active',
    defaultChain: ChainType.EVM,
    scoreWeights: {
      amount: 0.25,
      address: 0.25,
      contract: 0.2,
      behavior: 0.15,
      device: 0.15,
      domain: 0.1,
    },
    decisionMatrix: {
      lowThreshold: 30,
      mediumThreshold: 60,
      highThreshold: 85,
      criticalThreshold: 100,
      levelActions: {
        [RiskLevel.LOW]: RiskAction.ALLOW,
        [RiskLevel.MEDIUM]: RiskAction.WARN,
        [RiskLevel.HIGH]: RiskAction.SECOND_CONFIRM,
        [RiskLevel.CRITICAL]: RiskAction.REJECT,
      },
      enableRuleActionOverride: true,
      enableEscalation: true,
      escalationRuleCount: 3,
    },
    largeAmountThresholds: {
      [ChainType.EVM]: '1000',
      [ChainType.SOLANA]: '100',
      [ChainType.BITCOIN]: '1',
      [ChainType.TRON]: '100000',
    },
    frequencyLimits: {
      hourly: 10,
      daily: 100,
    },
    newAddressThreshold: 0,
    alertConfig: {
      enabled: true,
      minLevel: AlertLevel.WARNING,
      channels: ['in_app'],
      silencePeriod: 300,
    },
  };

  private evaluationCounter = 0;

  constructor() {
    this.registerDefaultRules();
  }

  /**
   * 注册默认规则
   */
  private registerDefaultRules(): void {
    const defaultRules = [
      addressBlacklistRule,
      contractBlacklistRule,
      phishingDomainRule,
      largeTransferRule,
      unlimitedApprovalRule,
      newAddressRule,
      frequentTransactionsRule,
      suspiciousContractRule,
      zeroValueTransferRule,
      nftApprovalRule,
    ];

    for (const rule of defaultRules) {
      this.registerRule(rule);
    }
  }

  // ============================================================
  // 配置管理
  // ============================================================

  /**
   * 获取引擎配置
   */
  getConfig(): RiskEngineConfig {
    return { ...this.config };
  }

  /**
   * 更新引擎配置
   * @param config 配置
   */
  updateConfig(config: Partial<RiskEngineConfig>): void {
    Object.assign(this.config, config);

    if (config.scoreWeights) {
      this.setScoreWeights(config.scoreWeights);
    }

    if (config.decisionMatrix) {
      riskDecisionEngine.setDecisionMatrix(config.decisionMatrix);
    }

    if (config.largeAmountThresholds) {
      this.setLargeAmountThresholds(config.largeAmountThresholds);
    }

    if (config.frequencyLimits) {
      this.setFrequencyLimits(config.frequencyLimits.hourly, config.frequencyLimits.daily);
    }

    if (config.newAddressThreshold !== undefined) {
      this.setNewAddressThreshold(config.newAddressThreshold);
    }

    if (config.alertConfig) {
      riskEventService.setAlertConfig(config.alertConfig);
    }
  }

  /**
   * 设置评分权重
   * @param weights 权重配置
   */
  setScoreWeights(weights: Partial<ScoreWeights>): void {
    riskScorer.setWeights(weights);
    if (this.config.scoreWeights) {
      Object.assign(this.config.scoreWeights, weights);
    }
  }

  /**
   * 设置大额转账阈值
   * @param thresholds 阈值配置
   */
  setLargeAmountThresholds(thresholds: Partial<Record<ChainType, string>>): void {
    for (const [chain, amount] of Object.entries(thresholds)) {
      if (amount) {
        amountScorer.setThreshold(chain as ChainType, amount);
        largeTransferRule.setThreshold(chain as ChainType, amount);
      }
    }
    if (this.config.largeAmountThresholds) {
      Object.assign(this.config.largeAmountThresholds, thresholds);
    }
  }

  /**
   * 设置频率限制
   * @param hourly 每小时限制
   * @param daily 每日限制
   */
  setFrequencyLimits(hourly: number, daily: number): void {
    behaviorScorer.setFrequencyLimits(hourly, daily);
    frequentTransactionsRule.setLimits(5, hourly, daily);
    this.config.frequencyLimits = { hourly, daily };
  }

  /**
   * 设置新地址阈值
   * @param threshold 阈值
   */
  setNewAddressThreshold(threshold: number): void {
    newAddressRule.setInteractionThreshold(threshold);
    this.config.newAddressThreshold = threshold;
  }

  /**
   * 启用/禁用风控引擎
   * @param enabled 是否启用
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * 设置引擎模式
   * @param mode 模式
   */
  setMode(mode: RiskEngineConfig['mode']): void {
    this.config.mode = mode;
  }

  // ============================================================
  // 规则管理
  // ============================================================

  /**
   * 注册规则
   * @param rule 规则
   */
  registerRule(rule: RiskRule): void {
    if (this.rules.has(rule.ruleCode)) {
      console.warn(`Rule ${rule.ruleCode} already registered, overriding`);
    }
    this.rules.set(rule.ruleCode, rule);
  }

  /**
   * 批量注册规则
   * @param rules 规则列表
   */
  registerRules(rules: RiskRule[]): void {
    for (const rule of rules) {
      this.registerRule(rule);
    }
  }

  /**
   * 注销规则
   * @param ruleCode 规则代码
   */
  unregisterRule(ruleCode: string): boolean {
    return this.rules.delete(ruleCode);
  }

  /**
   * 获取规则
   * @param ruleCode 规则代码
   */
  getRule(ruleCode: string): RiskRule | undefined {
    return this.rules.get(ruleCode);
  }

  /**
   * 获取所有规则
   */
  getAllRules(): RiskRule[] {
    return Array.from(this.rules.values()).sort((a, b) => b.priority - a.priority);
  }

  /**
   * 获取启用的规则
   */
  getEnabledRules(): RiskRule[] {
    return this.getAllRules().filter((r) => r.enabled);
  }

  /**
   * 按类别获取规则
   * @param category 类别
   */
  getRulesByCategory(category: RuleCategory): RiskRule[] {
    return this.getAllRules().filter((r) => r.category === category);
  }

  /**
   * 启用规则
   * @param ruleCode 规则代码
   */
  enableRule(ruleCode: string): boolean {
    const rule = this.rules.get(ruleCode);
    if (rule) {
      rule.enabled = true;
      return true;
    }
    return false;
  }

  /**
   * 禁用规则
   * @param ruleCode 规则代码
   */
  disableRule(ruleCode: string): boolean {
    const rule = this.rules.get(ruleCode);
    if (rule) {
      rule.enabled = false;
      return true;
    }
    return false;
  }

  /**
   * 配置规则
   * @param config 规则配置
   */
  configureRule(config: RiskRuleConfig): void {
    const rule = this.rules.get(config.ruleCode);
    if (!rule) return;

    if (config.enabled !== undefined) {
      rule.enabled = config.enabled;
    }

    if (config.action !== undefined && rule.parameters) {
      rule.parameters.action = config.action;
    }

    if (config.threshold !== undefined && rule.parameters) {
      rule.parameters.threshold = config.threshold;
    }

    if (config.parameters && rule.parameters) {
      Object.assign(rule.parameters, config.parameters);
    }
  }

  /**
   * 批量配置规则
   * @param configs 配置列表
   */
  configureRules(configs: RiskRuleConfig[]): void {
    for (const config of configs) {
      this.configureRule(config);
    }
  }

  /**
   * 获取所有规则配置
   */
  getRuleConfigs(): RiskRuleConfig[] {
    return this.getAllRules().map((rule) => ({
      ruleCode: rule.ruleCode,
      enabled: rule.enabled,
      action: rule.parameters?.action as RiskAction,
      threshold: rule.parameters?.threshold as number,
      parameters: rule.parameters,
    }));
  }

  // ============================================================
  // 插件管理
  // ============================================================

  /**
   * 注册插件
   * @param plugin 插件
   */
  registerPlugin(plugin: RiskEnginePlugin): void {
    this.plugins.push(plugin);

    if (plugin.onInitialize) {
      plugin.onInitialize(this);
    }
  }

  /**
   * 注销插件
   * @param pluginName 插件名称
   */
  unregisterPlugin(pluginName: string): boolean {
    const index = this.plugins.findIndex((p) => p.name === pluginName);
    if (index !== -1) {
      this.plugins.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取所有插件
   */
  getPlugins(): RiskEnginePlugin[] {
    return [...this.plugins];
  }

  // ============================================================
  // 核心评估方法
  // ============================================================

  /**
   * 执行风控评估
   * @param context 风控上下文
   * @returns 评估结果
   */
  async evaluate(context: RiskContext): Promise<RiskAssessment> {
    const startTime = Date.now();
    this.evaluationCounter++;

    if (!this.config.enabled) {
      return this.createDisabledAssessment(context, startTime);
    }

    const enhancedContext = this.enhanceContext(context);

    for (const plugin of this.plugins) {
      if (plugin.beforeEvaluate) {
        await plugin.beforeEvaluate(enhancedContext);
      }
    }

    const ruleResults = await this.evaluateAllRules(enhancedContext);

    const matchedRules = ruleResults.filter((r) => r.matched);

    const riskScore = riskScorer.calculateRiskScore(enhancedContext, ruleResults);

    for (const plugin of this.plugins) {
      if (plugin.beforeDecision) {
        await plugin.beforeDecision(enhancedContext, ruleResults, riskScore);
      }
    }

    const decision = riskDecisionEngine.makeDecision(enhancedContext, ruleResults, riskScore);

    for (const plugin of this.plugins) {
      if (plugin.afterDecision) {
        await plugin.afterDecision(decision);
      }
    }

    if (this.config.mode !== 'dry_run') {
      this.recordUserBehavior(enhancedContext);
      riskEventService.recordDecisionEvent(
        decision,
        ruleResults,
        enhancedContext.userId,
        enhancedContext.walletAddress
      );
    }

    const evaluationTime = Date.now() - startTime;

    const assessment: RiskAssessment = {
      requestId: enhancedContext.requestId,
      decision,
      ruleResults,
      matchedRules,
      riskScore,
      evaluationTime,
      evaluatedAt: new Date(),
      engineVersion: this.engineVersion,
    };

    for (const plugin of this.plugins) {
      if (plugin.afterEvaluate) {
        await plugin.afterEvaluate(assessment);
      }
    }

    return assessment;
  }

  /**
   * 创建禁用状态的评估结果
   */
  private createDisabledAssessment(context: RiskContext, startTime: number): RiskAssessment {
    return {
      requestId: context.requestId,
      decision: {
        action: RiskAction.ALLOW,
        level: RiskLevel.LOW,
        allowed: true,
        reasons: ['风控引擎已禁用'],
        matchedRules: [],
        riskScore: {
          totalScore: 0,
          level: RiskLevel.LOW,
          dimensions: [],
          ruleBasedScore: 0,
          modelVersion: riskScorer.modelVersion,
          calculatedAt: new Date(),
        },
        decisionId: `disabled_${Date.now()}`,
        decidedAt: new Date(),
        engineVersion: this.engineVersion,
      },
      ruleResults: [],
      matchedRules: [],
      riskScore: {
        totalScore: 0,
        level: RiskLevel.LOW,
        dimensions: [],
        ruleBasedScore: 0,
        modelVersion: riskScorer.modelVersion,
        calculatedAt: new Date(),
      },
      evaluationTime: Date.now() - startTime,
      evaluatedAt: new Date(),
      engineVersion: this.engineVersion,
    };
  }

  /**
   * 增强上下文信息
   * @param context 原始上下文
   */
  private enhanceContext(context: RiskContext): RiskContext {
    const enhanced = { ...context };

    if (!enhanced.timestamp) {
      enhanced.timestamp = new Date();
    }

    if (!enhanced.requestId) {
      enhanced.requestId = `req_${Date.now()}_${this.evaluationCounter}`;
    }

    return enhanced;
  }

  /**
   * 执行所有规则评估
   * @param context 风控上下文
   */
  private async evaluateAllRules(context: RiskContext): Promise<RiskRuleResult[]> {
    const results: RiskRuleResult[] = [];
    const rules = this.getEnabledRules().sort((a, b) => b.priority - a.priority);

    for (const rule of rules) {
      try {
        if (rule.isApplicable && !rule.isApplicable(context)) {
          results.push({
            ruleCode: rule.ruleCode,
            ruleName: rule.ruleName,
            category: rule.category,
            matched: false,
            score: 0,
            level: RiskLevel.LOW,
            action: RiskAction.ALLOW,
            reason: '规则不适用',
            priority: rule.priority,
            evaluationTime: 0,
          });
          continue;
        }

        const result = await rule.evaluate(context);
        result.priority = rule.priority;
        results.push(result);
      } catch (error) {
        results.push({
          ruleCode: rule.ruleCode,
          ruleName: rule.ruleName,
          category: rule.category,
          matched: false,
          score: 0,
          level: RiskLevel.LOW,
          action: RiskAction.ALLOW,
          reason: `规则执行错误: ${error}`,
          priority: rule.priority,
          evaluationTime: 0,
        });
      }
    }

    return results;
  }

  /**
   * 记录用户行为
   * @param context 风控上下文
   */
  private recordUserBehavior(context: RiskContext): void {
    const userId = context.userId;
    if (!userId) return;

    const amount = context.transaction?.value ? parseFloat(context.transaction.value) : 0;
    const toAddress = context.transaction?.to || '';

    if (amount > 0 || toAddress) {
      behaviorScorer.recordTransaction(userId, amount, toAddress);
      frequentTransactionsRule.recordTransaction(userId, undefined, amount.toString(), toAddress);

      if (toAddress) {
        newAddressRule.recordInteraction(userId, toAddress);
        addressScorer.recordInteraction(userId, toAddress);
      }
    }

    if (context.device?.deviceId) {
      deviceScorer.recordDeviceUsage(userId, context.device.deviceId, {
        userAgent: context.device.userAgent,
        os: context.device.os,
        ipAddress: context.device.ipAddress,
        location: context.device.location,
      });
    }
  }

  // ============================================================
  // 便捷方法
  // ============================================================

  /**
   * 快速评估交易风险
   * @param options 交易选项
   */
  async evaluateTransaction(options: {
    walletAddress: string;
    toAddress: string;
    amount: string;
    chainType?: ChainType;
    userId?: string;
    walletId?: string;
    contractAddress?: string;
    data?: string;
    device?: RiskContext['device'];
    dapp?: RiskContext['dapp'];
  }): Promise<RiskAssessment> {
    const context: RiskContext = {
      requestId: '',
      timestamp: new Date(),
      chainType: options.chainType || this.config.defaultChain,
      signType: SignType.TRANSACTION,
      walletAddress: options.walletAddress,
      walletId: options.walletId,
      userId: options.userId,
      transaction: {
        to: options.toAddress,
        value: options.amount,
        contractAddress: options.contractAddress,
        data: options.data,
      },
      device: options.device,
      dapp: options.dapp,
    };

    return this.evaluate(context);
  }

  /**
   * 快速评估签名风险
   * @param options 签名选项
   */
  async evaluateSignature(options: {
    walletAddress: string;
    signType: SignType;
    payload: unknown;
    chainType?: ChainType;
    userId?: string;
    walletId?: string;
    device?: RiskContext['device'];
    dapp?: RiskContext['dapp'];
  }): Promise<RiskAssessment> {
    const context: RiskContext = {
      requestId: '',
      timestamp: new Date(),
      chainType: options.chainType || this.config.defaultChain,
      signType: options.signType,
      walletAddress: options.walletAddress,
      walletId: options.walletId,
      userId: options.userId,
      device: options.device,
      dapp: options.dapp,
      payload: options.payload,
    };

    return this.evaluate(context);
  }

  // ============================================================
  // 统计和状态
  // ============================================================

  /**
   * 获取引擎统计信息
   */
  getEngineStats(): {
    totalRules: number;
    enabledRules: number;
    totalEvaluations: number;
    totalPlugins: number;
    engineVersion: string;
    mode: RiskEngineConfig['mode'];
    enabled: boolean;
  } {
    return {
      totalRules: this.rules.size,
      enabledRules: this.getEnabledRules().length,
      totalEvaluations: this.evaluationCounter,
      totalPlugins: this.plugins.length,
      engineVersion: this.engineVersion,
      mode: this.config.mode,
      enabled: this.config.enabled,
    };
  }

  /**
   * 获取黑白名单服务
   */
  getBlacklistService() {
    return blacklistService;
  }

  /**
   * 获取事件服务
   */
  getEventService() {
    return riskEventService;
  }

  /**
   * 获取决策引擎
   */
  getDecisionEngine() {
    return riskDecisionEngine;
  }

  /**
   * 获取评分器
   */
  getScorer() {
    return riskScorer;
  }
}

export const riskEngine = new RiskEngine();
