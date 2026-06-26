/**
 * 审计阶段 (Audit Stage)
 *
 * 职责：
 *  - 记录完整的审计轨迹
 *  - 合规性检查
 *  - 安全审计
 *  - 风险评估
 *  - 生成审计报告
 *
 * 前置条件：
 *  - 至少广播阶段已完成
 *  - 可选：确认阶段结果
 *
 * 后置条件：
 *  - 生成完整的审计记录
 *  - 审计 ID 唯一
 */

import {
  PipelineStage,
  type PipelineContext,
  type AuditResult,
  type StageDefinition,
} from '../pipeline.types';
import { createPipelineError } from './build.stage';

// =============================================================================
// 审计阶段错误
// =============================================================================

export class AuditStageError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AuditStageError';
    this.code = code;
    this.details = details;
  }
}

// =============================================================================
// 审计存储接口
// =============================================================================

/**
 * 审计日志存储接口
 */
export interface AuditStorage {
  /**
   * 保存审计记录
   */
  saveAudit(audit: AuditResult): Promise<void>;

  /**
   * 查询审计记录
   */
  getAudit?(auditId: string): Promise<AuditResult | null>;

  /**
   * 列出审计记录
   */
  listAudits?(filters?: Record<string, unknown>): Promise<AuditResult[]>;
}

// =============================================================================
// 审计规则
// =============================================================================

/**
 * 审计检查项
 */
export interface AuditCheck {
  id: string;
  name: string;
  category: string;
  level: 'info' | 'warning' | 'issue' | 'critical';
  description: string;
  check: (context: PipelineContext) => AuditCheckResult | Promise<AuditCheckResult>;
  enabled: boolean;
}

/**
 * 审计检查结果
 */
export interface AuditCheckResult {
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
  evidence?: string;
}

// =============================================================================
// 审计阶段配置
// =============================================================================

export interface AuditStageConfig {
  enabled?: boolean;
  auditStorage?: AuditStorage;
  auditType?: string;
  enableComplianceChecks?: boolean;
  enableSecurityChecks?: boolean;
  enableRiskAssessment?: boolean;
  enableTrailLogging?: boolean;
  saveToStorage?: boolean;
  customChecks?: AuditCheck[];
  complianceRules?: string[];
}

const DEFAULT_CONFIG: Required<AuditStageConfig> = {
  enabled: true,
  auditStorage: undefined as any,
  auditType: 'transaction',
  enableComplianceChecks: true,
  enableSecurityChecks: true,
  enableRiskAssessment: true,
  enableTrailLogging: true,
  saveToStorage: false,
  customChecks: [],
  complianceRules: [],
};

// =============================================================================
// 审计阶段实现类
// =============================================================================

export class AuditStage {
  private config: Required<AuditStageConfig>;
  private checks: AuditCheck[] = [];

  constructor(config: AuditStageConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeBuiltInChecks();
    if (this.config.customChecks.length > 0) {
      this.checks.push(...this.config.customChecks);
    }
  }

  /**
   * 前置条件检查
   */
  async preCondition(context: PipelineContext): Promise<boolean> {
    const hasBroadcast = !!context.stageData[PipelineStage.BROADCAST];
    const hasBuild = !!context.stageData[PipelineStage.BUILD];

    if (!hasBuild && !hasBroadcast) {
      throw new AuditStageError('INSUFFICIENT_DATA', '没有足够的数据进行审计');
    }

    return true;
  }

  /**
   * 执行审计
   */
  async execute(context: PipelineContext): Promise<AuditResult> {
    if (!this.config.enabled) {
      return {
        audited: false,
        auditId: this.generateAuditId(),
        auditType: this.config.auditType,
        findings: [],
        auditTrail: [],
        auditedAt: new Date().toISOString(),
      };
    }

    const auditId = this.generateAuditId();
    const findings: AuditResult['findings'] = [];

    for (const check of this.checks) {
      if (!check.enabled) continue;

      try {
        const result = await check.check(context);

        if (!result.passed) {
          findings.push({
            id: check.id,
            level: check.level,
            category: check.category,
            message: result.message,
            details: result.details,
          });
        }
      } catch (error) {
        findings.push({
          id: check.id,
          level: 'warning',
          category: check.category,
          message: `审计检查执行异常: ${error instanceof Error ? error.message : '未知错误'}`,
        });
      }
    }

    const auditTrail = this.buildAuditTrail(context);
    const complianceChecks = this.checkCompliance(context);
    const riskAssessment = this.assessRisk(context, findings);

    const result: AuditResult = {
      audited: true,
      auditId,
      auditType: this.config.auditType,
      findings,
      riskAssessment,
      complianceChecks,
      auditTrail,
      auditedAt: new Date().toISOString(),
    };

    if (this.config.saveToStorage && this.config.auditStorage) {
      try {
        await this.config.auditStorage.saveAudit(result);
      } catch (error) {
        findings.push({
          id: 'storage_error',
          level: 'warning',
          category: 'system',
          message: `审计记录保存失败: ${error instanceof Error ? error.message : '未知错误'}`,
        });
      }
    }

    return result;
  }

  /**
   * 后置条件检查
   */
  async postCondition(context: PipelineContext): Promise<boolean> {
    const result = context.stageData[PipelineStage.AUDIT];
    if (!result) {
      throw new AuditStageError('NO_RESULT', '审计阶段没有产生结果');
    }

    if (!result.auditId) {
      throw new AuditStageError('MISSING_AUDIT_ID', '缺少审计 ID');
    }

    if (!result.auditedAt) {
      throw new AuditStageError('MISSING_TIMESTAMP', '缺少审计时间戳');
    }

    if (this.config.enableTrailLogging && result.auditTrail.length === 0) {
      throw new AuditStageError('MISSING_TRAIL', '缺少审计轨迹');
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 内置检查
  // -------------------------------------------------------------------------

  /**
   * 初始化内置审计检查
   */
  private initializeBuiltInChecks(): void {
    const builtInChecks: AuditCheck[] = [];

    if (this.config.enableSecurityChecks) {
      builtInChecks.push(...this.getSecurityChecks());
    }

    if (this.config.enableComplianceChecks) {
      builtInChecks.push(...this.getComplianceChecks());
    }

    if (this.config.enableRiskAssessment) {
      builtInChecks.push(...this.getRiskChecks());
    }

    this.checks = builtInChecks;
  }

  /**
   * 安全检查
   */
  private getSecurityChecks(): AuditCheck[] {
    return [
      {
        id: 'security_signature_valid',
        name: '签名有效性检查',
        category: 'security',
        level: 'critical',
        description: '验证交易签名是否有效',
        enabled: true,
        check: (context) => {
          const signature = context.stageData[PipelineStage.SIGNATURE];
          if (!signature) {
            return { passed: true, message: '跳过签名检查（无签名数据）' };
          }
          return {
            passed: signature.signed,
            message: signature.signed ? '签名有效' : '签名无效',
            details: { signer: signature.signer, method: signature.signMethod },
          };
        },
      },
      {
        id: 'security_gas_safe',
        name: 'Gas 安全性检查',
        category: 'security',
        level: 'warning',
        description: '检查 gas 参数是否在合理范围内',
        enabled: true,
        check: (context) => {
          const build = context.stageData[PipelineStage.BUILD];
          if (!build) {
            return { passed: true, message: '跳过 gas 检查' };
          }

          const gasLimit = BigInt(build.gasLimit);
          const maxGas = 10_000_000n;

          if (gasLimit > maxGas) {
            return {
              passed: false,
              message: `Gas limit 过高: ${build.gasLimit}`,
              details: { gasLimit: build.gasLimit, maxGas: maxGas.toString() },
            };
          }

          return { passed: true, message: 'Gas 参数合理' };
        },
      },
      {
        id: 'security_nonce_valid',
        name: 'Nonce 有效性检查',
        category: 'security',
        level: 'info',
        description: '检查 nonce 是否有效',
        enabled: true,
        check: (context) => {
          const build = context.stageData[PipelineStage.BUILD];
          if (!build) {
            return { passed: true, message: '跳过 nonce 检查' };
          }

          return {
            passed: build.nonce >= 0,
            message: build.nonce >= 0 ? `Nonce 有效: ${build.nonce}` : 'Nonce 无效',
            details: { nonce: build.nonce },
          };
        },
      },
    ];
  }

  /**
   * 合规检查
   */
  private getComplianceChecks(): AuditCheck[] {
    return [
      {
        id: 'compliance_amount_limits',
        name: '金额限制合规',
        category: 'compliance',
        level: 'warning',
        description: '检查交易金额是否符合限额规定',
        enabled: true,
        check: (context) => {
          const riskCheck = context.stageData[PipelineStage.RISK_CHECK];
          if (riskCheck) {
            return {
              passed: riskCheck.passed,
              message: riskCheck.passed ? '风控检查通过' : '风控检查未通过',
              details: { riskScore: riskCheck.riskScore, riskLevel: riskCheck.riskLevel },
            };
          }

          return { passed: true, message: '跳过合规检查（无风控数据）' };
        },
      },
      {
        id: 'compliance_kyc',
        name: 'KYC 合规检查',
        category: 'compliance',
        level: 'info',
        description: '检查用户 KYC 状态',
        enabled: false,
        check: (context) => {
          return { passed: true, message: 'KYC 检查需要接入用户系统' };
        },
      },
    ];
  }

  /**
   * 风险检查
   */
  private getRiskChecks(): AuditCheck[] {
    return [
      {
        id: 'risk_balance_sufficient',
        name: '余额充足性检查',
        category: 'risk',
        level: 'warning',
        description: '确认余额是否充足',
        enabled: true,
        check: (context) => {
          const balanceCheck = context.stageData[PipelineStage.BALANCE_CHECK];
          if (balanceCheck) {
            return {
              passed: balanceCheck.sufficient,
              message: balanceCheck.sufficient ? '余额充足' : '余额不足',
              details: {
                nativeBalance: balanceCheck.nativeBalance,
                nativeRequired: balanceCheck.nativeRequired,
              },
            };
          }
          return { passed: true, message: '跳过余额检查' };
        },
      },
      {
        id: 'risk_simulation',
        name: '模拟结果风险',
        category: 'risk',
        level: 'info',
        description: '检查交易模拟结果',
        enabled: true,
        check: (context) => {
          const simulation = context.stageData[PipelineStage.SIMULATE];
          if (simulation) {
            return {
              passed: simulation.success,
              message: simulation.success ? '模拟成功' : `模拟失败: ${simulation.error}`,
              details: {
                gasEstimate: simulation.gasEstimate,
                source: simulation.simulationSource,
              },
            };
          }
          return { passed: true, message: '跳过模拟检查' };
        },
      },
    ];
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 审计轨迹
  // -------------------------------------------------------------------------

  /**
   * 构建审计轨迹
   */
  private buildAuditTrail(context: PipelineContext): AuditResult['auditTrail'] {
    const trail: AuditResult['auditTrail'] = [];

    trail.push({
      stage: 'pipeline_start',
      action: '创建流水线',
      timestamp: context.createdAt,
      metadata: { pipelineId: context.pipelineId, requestId: context.request.id },
    });

    const stages = Object.values(PipelineStage);
    for (const stage of stages) {
      const metadata = context.stageMetadata[stage];
      if (metadata) {
        trail.push({
          stage,
          action: this.getStageAction(metadata.status),
          timestamp: metadata.endTime || metadata.startTime || context.createdAt,
          metadata: {
            attempt: metadata.attempt,
            durationMs: metadata.durationMs,
            skipped: metadata.skipped,
          },
        });
      }
    }

    const broadcast = context.stageData[PipelineStage.BROADCAST];
    if (broadcast) {
      trail.push({
        stage: 'broadcast',
        action: '交易广播',
        timestamp: broadcast.broadcastedAt,
        metadata: { txHash: broadcast.txHash, retries: broadcast.retries },
      });
    }

    const confirmation = context.stageData[PipelineStage.CONFIRMATION];
    if (confirmation) {
      trail.push({
        stage: 'confirmation',
        action: `交易${confirmation.status === 'success' ? '确认成功' : '确认失败'}`,
        timestamp: confirmation.confirmedAt || new Date().toISOString(),
        metadata: {
          txHash: confirmation.txHash,
          confirmations: confirmation.confirmations,
          blockNumber: confirmation.blockNumber,
        },
      });
    }

    return trail;
  }

  /**
   * 获取阶段动作描述
   */
  private getStageAction(status: string): string {
    const actions: Record<string, string> = {
      completed: '完成',
      failed: '失败',
      skipped: '跳过',
      retrying: '重试',
      running: '执行中',
      pending: '等待中',
      rolled_back: '已回滚',
    };
    return actions[status] || status;
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 合规与风险
  // -------------------------------------------------------------------------

  /**
   * 检查合规性
   */
  private checkCompliance(context: PipelineContext): Record<string, boolean> {
    const checks: Record<string, boolean> = {
      has_balance_check: !!context.stageData[PipelineStage.BALANCE_CHECK],
      has_risk_check: !!context.stageData[PipelineStage.RISK_CHECK],
      has_simulation: !!context.stageData[PipelineStage.SIMULATE],
      has_signature: !!context.stageData[PipelineStage.SIGNATURE],
      has_broadcast: !!context.stageData[PipelineStage.BROADCAST],
    };

    return checks;
  }

  /**
   * 评估风险
   */
  private assessRisk(
    context: PipelineContext,
    findings: AuditResult['findings'],
  ): string {
    const criticalCount = findings.filter((f) => f.level === 'critical').length;
    const issueCount = findings.filter((f) => f.level === 'issue').length;
    const warningCount = findings.filter((f) => f.level === 'warning').length;

    if (criticalCount > 0) {
      return 'high';
    }
    if (issueCount > 0) {
      return 'medium';
    }
    if (warningCount > 0) {
      return 'low';
    }
    return 'none';
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 工具
  // -------------------------------------------------------------------------

  /**
   * 生成审计 ID
   */
  private generateAuditId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `audit_${timestamp}_${random}`;
  }

  // -------------------------------------------------------------------------
  // 公共方法
  // -------------------------------------------------------------------------

  /**
   * 添加自定义审计检查
   */
  addCheck(check: AuditCheck): void {
    this.checks.push(check);
  }

  /**
   * 移除审计检查
   */
  removeCheck(checkId: string): boolean {
    const index = this.checks.findIndex((c) => c.id === checkId);
    if (index !== -1) {
      this.checks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取所有检查
   */
  getChecks(): AuditCheck[] {
    return [...this.checks];
  }

  /**
   * 生成审计摘要
   */
  generateSummary(result: AuditResult): string {
    const criticalCount = result.findings.filter((f) => f.level === 'critical').length;
    const issueCount = result.findings.filter((f) => f.level === 'issue').length;
    const warningCount = result.findings.filter((f) => f.level === 'warning').length;
    const infoCount = result.findings.filter((f) => f.level === 'info').length;

    return `审计完成 - ${criticalCount} 个严重, ${issueCount} 个问题, ${warningCount} 个警告, ${infoCount} 个信息`;
  }
}

// =============================================================================
// 阶段定义工厂
// =============================================================================

/**
 * 创建审计阶段定义
 */
export function createAuditStage(config?: AuditStageConfig): StageDefinition {
  const stage = new AuditStage(config);

  return {
    stage: PipelineStage.AUDIT,
    name: '交易审计',
    description: '执行审计检查并生成审计报告',
    preCondition: (ctx) => stage.preCondition(ctx),
    postCondition: (ctx) => stage.postCondition(ctx),
    execute: async (context) => {
      const result = await stage.execute(context);
      context.stageData[PipelineStage.AUDIT] = result;
      return result;
    },
    skippable: true,
    retryable: false,
    maxRetries: 0,
    retryDelayMs: 0,
    dependsOn: [PipelineStage.BROADCAST],
    weight: 5,
  };
}

export default AuditStage;
