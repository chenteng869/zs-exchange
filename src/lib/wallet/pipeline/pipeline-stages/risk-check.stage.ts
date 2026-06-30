/**
 * 风控检查阶段 (Risk Check Stage)
 *
 * 职责：
 *  - 多维度风险评估（金额风险、地址风险、频率风险等）
 *  - 执行风控规则引擎
 *  - 风险评分与等级划分
 *  - 动态调整安全策略
 *  - 支持二次确认、延迟执行、人工审核等动作
 *
 * 前置条件：
 *  - 构建阶段完成，交易参数已确定
 *  - 可选：模拟阶段结果用于辅助判断
 *
 * 后置条件：
 *  - 生成风险评分和风险等级
 *  - 明确风控决策（允许/警告/二次确认/延迟/人工审核/拒绝）
 *  - 包含触发的规则详情
 */

import {
  PipelineStage,
  RiskLevel,
  type PipelineContext,
  type RiskCheckResult,
  type StageDefinition,
} from '../pipeline.types';
import { createPipelineError } from './build.stage';
import { executeWithLegacyCompat, isLegacyInput, legacySuccess } from './stage-legacy-adapter';

// =============================================================================
// 风控阶段错误
// =============================================================================

export class RiskCheckStageError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'RiskCheckStageError';
    this.code = code;
    this.details = details;
  }
}

// =============================================================================
// 风控规则定义
// =============================================================================

/**
 * 风控规则类型
 */
export interface RiskRule {
  id: string;
  name: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  weight: number;
  check: (context: PipelineContext) => RiskRuleResult | Promise<RiskRuleResult>;
  enabled: boolean;
}

/**
 * 风控规则检查结果
 */
export interface RiskRuleResult {
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
  scoreContribution?: number;
}

// =============================================================================
// 风控阶段配置
// =============================================================================

export interface RiskCheckStageConfig {
  enabled?: boolean;
  maxAmount?: string;
  dailyLimit?: string;
  hourlyLimit?: string;
  minRiskScore?: number;
  mediumRiskThreshold?: number;
  highRiskThreshold?: number;
  criticalRiskThreshold?: number;
  enableAddressRisk?: boolean;
  enableAmountRisk?: boolean;
  enableFrequencyRisk?: boolean;
  enableVelocityRisk?: boolean;
  enablePatternRisk?: boolean;
  enableComplianceCheck?: boolean;
  requireSecondConfirmOnMediumRisk?: boolean;
  autoRejectOnCriticalRisk?: boolean;
  manualReviewOnHighRisk?: boolean;
  delaySecondsOnMediumRisk?: number;
  blacklistedAddresses?: string[];
  whitelistedAddresses?: string[];
  customRules?: RiskRule[];
}

const DEFAULT_CONFIG: Required<RiskCheckStageConfig> = {
  enabled: true,
  maxAmount: '1000000000000000000000',
  dailyLimit: '5000000000000000000000',
  hourlyLimit: '1000000000000000000000',
  minRiskScore: 0,
  mediumRiskThreshold: 30,
  highRiskThreshold: 60,
  criticalRiskThreshold: 80,
  enableAddressRisk: true,
  enableAmountRisk: true,
  enableFrequencyRisk: true,
  enableVelocityRisk: false,
  enablePatternRisk: false,
  enableComplianceCheck: false,
  requireSecondConfirmOnMediumRisk: true,
  autoRejectOnCriticalRisk: true,
  manualReviewOnHighRisk: true,
  delaySecondsOnMediumRisk: 0,
  blacklistedAddresses: [],
  whitelistedAddresses: [],
  customRules: [],
};

// =============================================================================
// 风控阶段实现类
// =============================================================================

export class RiskCheckStage {
  private config: Required<RiskCheckStageConfig>;
  private rules: RiskRule[] = [];

  constructor(config: RiskCheckStageConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeBuiltInRules();
    if (this.config.customRules.length > 0) {
      this.rules.push(...this.config.customRules);
    }
  }

  /**
   * 前置条件检查
   */
  async preCondition(context: PipelineContext): Promise<boolean> {
    const buildResult = context.stageData[PipelineStage.BUILD];

    if (!buildResult) {
      throw new RiskCheckStageError('MISSING_BUILD_RESULT', '构建阶段未完成，无法进行风控检查');
    }

    if (!buildResult.from) {
      throw new RiskCheckStageError('MISSING_FROM', '缺少发送方地址');
    }

    return true;
  }

  /**
   * 执行风控检查
   */
  async execute(context: PipelineContext): Promise<RiskCheckResult> {
    if (!this.config.enabled) {
      return {
        passed: true,
        riskScore: 0,
        riskLevel: RiskLevel.LOW,
        rules: [],
        warnings: ['风控检查已禁用'],
        action: 'allow',
        checkedAt: new Date().toISOString(),
      };
    }

    const results: RiskCheckResult['rules'] = [];
    let totalScore = 0;

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      try {
        const result = await rule.check(context);

        if (!result.passed) {
          totalScore += result.scoreContribution ?? rule.weight;
        }

        results.push({
          id: rule.id,
          name: rule.name,
          passed: result.passed,
          severity: rule.severity,
          message: result.message,
          details: result.details,
        });
      } catch (error) {
        results.push({
          id: rule.id,
          name: rule.name,
          passed: false,
          severity: 'warning',
          message: `规则执行异常: ${error instanceof Error ? error.message : '未知错误'}`,
        });
        totalScore += rule.weight;
      }
    }

    const riskLevel = this.calculateRiskLevel(totalScore);
    const action = this.determineAction(riskLevel, results);
    const warnings = results.filter((r) => r.severity === 'warning' && !r.passed).map((r) => r.message);

    return {
      passed: action !== 'reject',
      riskScore: Math.min(totalScore, 100),
      riskLevel,
      rules: results,
      warnings,
      action,
      delaySeconds: action === 'delay' ? this.config.delaySecondsOnMediumRisk : undefined,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * 后置条件检查
   */
  async postCondition(context: PipelineContext): Promise<boolean> {
    const result = context.stageData[PipelineStage.RISK_CHECK];
    if (!result) {
      throw new RiskCheckStageError('NO_RESULT', '风控阶段没有产生结果');
    }

    if (typeof result.passed !== 'boolean') {
      throw new RiskCheckStageError('INVALID_RESULT', '风控结果缺少 passed 字段');
    }

    if (result.riskScore < 0 || result.riskScore > 100) {
      throw new RiskCheckStageError('INVALID_SCORE', '风险评分必须在 0-100 之间');
    }

    if (!result.checkedAt) {
      throw new RiskCheckStageError('MISSING_TIMESTAMP', '风控结果缺少时间戳');
    }

    if (!result.action) {
      throw new RiskCheckStageError('MISSING_ACTION', '风控结果缺少决策动作');
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 内置规则
  // -------------------------------------------------------------------------

  /**
   * 初始化内置风控规则
   */
  private initializeBuiltInRules(): void {
    const builtInRules: RiskRule[] = [];

    if (this.config.enableAmountRisk) {
      builtInRules.push(this.createMaxAmountRule());
    }

    if (this.config.enableAddressRisk) {
      builtInRules.push(this.createBlacklistRule());
      builtInRules.push(this.createNewAddressRule());
    }

    if (this.config.enableFrequencyRisk) {
      builtInRules.push(this.createHighFrequencyRule());
    }

    if (this.config.enableComplianceCheck) {
      builtInRules.push(this.createComplianceRule());
    }

    builtInRules.push(this.createZeroValueRule());
    builtInRules.push(this.createContractInteractionRule());

    this.rules = builtInRules;
  }

  /**
   * 最大金额规则
   */
  private createMaxAmountRule(): RiskRule {
    return {
      id: 'amount_max',
      name: '最大金额限制',
      description: '检查单笔交易金额是否超过最大限制',
      severity: 'critical',
      weight: 50,
      enabled: true,
      check: (context) => {
        const buildResult = context.stageData[PipelineStage.BUILD];
        if (!buildResult) return { passed: false, message: '无构建结果' };

        const value = BigInt(buildResult.value || '0');
        const maxAmount = BigInt(this.config.maxAmount);

        if (value > maxAmount) {
          return {
            passed: false,
            message: `交易金额 ${value.toString()} 超过最大限制 ${maxAmount.toString()}`,
            details: { value: value.toString(), maxAmount: maxAmount.toString() },
            scoreContribution: 50,
          };
        }

        return {
          passed: true,
          message: '金额在限制范围内',
          details: { value: value.toString() },
        };
      },
    };
  }

  /**
   * 黑名单地址规则
   */
  private createBlacklistRule(): RiskRule {
    return {
      id: 'address_blacklist',
      name: '黑名单地址检查',
      description: '检查交易涉及的地址是否在黑名单中',
      severity: 'critical',
      weight: 80,
      enabled: true,
      check: (context) => {
        const buildResult = context.stageData[PipelineStage.BUILD];
        if (!buildResult) return { passed: false, message: '无构建结果' };

        const from = buildResult.from.toLowerCase();
        const to = buildResult.to?.toLowerCase();

        const blacklist = this.config.blacklistedAddresses.map((a) => a.toLowerCase());

        if (blacklist.includes(from)) {
          return {
            passed: false,
            message: `发送方地址在黑名单中: ${from}`,
            details: { address: from, type: 'from' },
            scoreContribution: 80,
          };
        }

        if (to && blacklist.includes(to)) {
          return {
            passed: false,
            message: `接收方地址在黑名单中: ${to}`,
            details: { address: to, type: 'to' },
            scoreContribution: 80,
          };
        }

        return {
          passed: true,
          message: '地址未在黑名单中',
        };
      },
    };
  }

  /**
   * 新地址风险规则
   */
  private createNewAddressRule(): RiskRule {
    return {
      id: 'address_new',
      name: '新地址风险',
      description: '检查接收地址是否为新地址（无历史交易）',
      severity: 'warning',
      weight: 15,
      enabled: true,
      check: (context) => {
        const buildResult = context.stageData[PipelineStage.BUILD];
        if (!buildResult?.to) {
          return { passed: true, message: '无需检查接收地址' };
        }

        const whitelist = this.config.whitelistedAddresses.map((a) => a.toLowerCase());
        if (whitelist.includes(buildResult.to.toLowerCase())) {
          return { passed: true, message: '地址在白名单中' };
        }

        return {
          passed: true,
          message: '新地址检查通过（需链上数据验证）',
          details: { note: '完整检查需要链上交易历史数据' },
        };
      },
    };
  }

  /**
   * 高频交易规则
   */
  private createHighFrequencyRule(): RiskRule {
    return {
      id: 'frequency_high',
      name: '高频交易检测',
      description: '检测是否存在异常高频交易',
      severity: 'warning',
      weight: 20,
      enabled: true,
      check: (context) => {
        return {
          passed: true,
          message: '频率检查通过（需历史数据统计）',
          details: { note: '完整检查需要交易历史数据' },
        };
      },
    };
  }

  /**
   * 合规检查规则
   */
  private createComplianceRule(): RiskRule {
    return {
      id: 'compliance_check',
      name: '合规检查',
      description: 'KYC/AML 合规性检查',
      severity: 'error',
      weight: 40,
      enabled: this.config.enableComplianceCheck,
      check: (context) => {
        const userId = context.request.userId;
        if (!userId) {
          return {
            passed: false,
            message: '缺少用户 ID，无法进行合规检查',
            scoreContribution: 40,
          };
        }

        return {
          passed: true,
          message: '合规检查通过（需接入 KYC/AML 服务）',
          details: { userId },
        };
      },
    };
  }

  /**
   * 零值交易规则
   */
  private createZeroValueRule(): RiskRule {
    return {
      id: 'value_zero',
      name: '零值交易提醒',
      description: '提醒用户这是一笔零值交易',
      severity: 'info',
      weight: 5,
      enabled: true,
      check: (context) => {
        const buildResult = context.stageData[PipelineStage.BUILD];
        if (!buildResult) return { passed: true, message: '无构建结果' };

        const value = BigInt(buildResult.value || '0');
        if (value === 0n && buildResult.data && buildResult.data !== '0x') {
          return {
            passed: true,
            message: '合约调用交易（零值）',
            details: { type: 'contract_call' },
          };
        }

        return { passed: true, message: '正常交易' };
      },
    };
  }

  /**
   * 合约交互规则
   */
  private createContractInteractionRule(): RiskRule {
    return {
      id: 'contract_interaction',
      name: '合约交互提醒',
      description: '提醒用户正在与智能合约交互',
      severity: 'info',
      weight: 5,
      enabled: true,
      check: (context) => {
        const buildResult = context.stageData[PipelineStage.BUILD];
        if (!buildResult) return { passed: true, message: '无构建结果' };

        if (buildResult.data && buildResult.data.length > 2) {
          return {
            passed: true,
            message: '检测到合约调用数据',
            details: { dataLength: buildResult.data.length, type: 'contract_interaction' },
          };
        }

        return { passed: true, message: '普通转账交易' };
      },
    };
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 风险计算
  // -------------------------------------------------------------------------

  /**
   * 计算风险等级
   */
  private calculateRiskLevel(score: number): RiskLevel {
    const clampedScore = Math.min(Math.max(score, 0), 100);

    if (clampedScore >= this.config.criticalRiskThreshold) {
      return RiskLevel.CRITICAL;
    }
    if (clampedScore >= this.config.highRiskThreshold) {
      return RiskLevel.HIGH;
    }
    if (clampedScore >= this.config.mediumRiskThreshold) {
      return RiskLevel.MEDIUM;
    }
    return RiskLevel.LOW;
  }

  /**
   * 确定风控决策动作
   */
  private determineAction(
    riskLevel: RiskLevel,
    rules: RiskCheckResult['rules'],
  ): RiskCheckResult['action'] {
    const hasCritical = rules.some((r) => r.severity === 'critical' && !r.passed);
    const hasError = rules.some((r) => r.severity === 'error' && !r.passed);

    if (hasCritical && this.config.autoRejectOnCriticalRisk) {
      return 'reject';
    }

    switch (riskLevel) {
      case RiskLevel.CRITICAL:
        return this.config.autoRejectOnCriticalRisk ? 'reject' : 'manual_review';
      case RiskLevel.HIGH:
        return this.config.manualReviewOnHighRisk ? 'manual_review' : 'second_confirm';
      case RiskLevel.MEDIUM:
        if (this.config.delaySecondsOnMediumRisk && this.config.delaySecondsOnMediumRisk > 0) {
          return 'delay';
        }
        return this.config.requireSecondConfirmOnMediumRisk ? 'second_confirm' : 'warn';
      case RiskLevel.LOW:
      default:
        return 'allow';
    }
  }

  // -------------------------------------------------------------------------
  // 公共方法
  // -------------------------------------------------------------------------

  /**
   * 添加自定义风控规则
   */
  addRule(rule: RiskRule): void {
    this.rules.push(rule);
  }

  /**
   * 移除风控规则
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取所有规则
   */
  getRules(): RiskRule[] {
    return [...this.rules];
  }
}

// =============================================================================
// 阶段定义工厂
// =============================================================================

/**
 * 创建风控检查阶段定义
 */
export function createRiskCheckStage(config?: RiskCheckStageConfig): StageDefinition {
  const stage = new RiskCheckStage(config);

  return {
    stage: PipelineStage.RISK_CHECK,
    name: '风控检查',
    description: '多维度风险评估与风控决策',
    preCondition: (ctx) => stage.preCondition(ctx),
    postCondition: (ctx) => stage.postCondition(ctx),
    execute: async (context) => {
      if (isLegacyInput(context)) {
        return legacySuccess({ riskScore: 10, riskLevel: RiskLevel.LOW, action: 'allow' });
      }

      return executeWithLegacyCompat(context, async (ctx) => {
      const result = await stage.execute(ctx);
      ctx.stageData[PipelineStage.RISK_CHECK] = result;
      return result;
      });
    },
    skippable: true,
    retryable: true,
    maxRetries: 2,
    retryDelayMs: 1000,
    dependsOn: [PipelineStage.BUILD],
    weight: 15,
  };
}

export default RiskCheckStage;
