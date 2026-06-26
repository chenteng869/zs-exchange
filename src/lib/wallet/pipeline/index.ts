/**
 * 交易流水线模块统一导出
 *
 * 模块组成：
 *  - pipeline.types: 完整的类型定义（阶段枚举、上下文、结果等）
 *  - transaction-pipeline: 主流水线类（9阶段编排执行）
 *  - pipeline.manager: 流水线管理器（并发控制、队列、超时）
 *  - pipeline-stages/: 9个独立阶段实现
 *
 * 9 阶段流水线架构：
 *  1. build        - 交易构建阶段
 *  2. simulate     - 交易模拟阶段
 *  3. risk_check   - 风控检查阶段
 *  4. balance_check- 余额检查阶段
 *  5. signature    - 签名阶段
 *  6. broadcast    - 广播阶段
 *  7. confirmation - 确认阶段
 *  8. audit        - 审计阶段
 *  9. notify       - 通知阶段
 */

// =============================================================================
// 类型定义
// =============================================================================

export {
  PipelineStage,
  PipelineStatus,
  StageStatus,
  RiskLevel,
  TransactionType,
} from './pipeline.types';

export type {
  ChainType,
  TransactionRequest,
  BuiltTransaction,
  SimulationResult,
  RiskCheckResult,
  BalanceCheckResult,
  SignatureResult,
  BroadcastResult,
  ConfirmationResult,
  AuditResult,
  NotifyResult,
  StageMetadata,
  PipelineError,
  PipelineContext,
  PipelineResult,
  MiddlewareContext,
  PipelineMiddleware,
  StageHandler,
  StageDefinition,
  PipelineConfig,
  PipelineStateStorage,
  PipelineManagerConfig,
  PipelineStats,
  StageDataTypeMap,
  StageData,
} from './pipeline.types';

// =============================================================================
// 主流水线类
// =============================================================================

export {
  TransactionPipeline,
  createTransactionPipeline,
  executeTransactionPipeline,
} from './transaction-pipeline';

// =============================================================================
// 流水线管理器
// =============================================================================

export {
  PipelineManager,
  createPipelineManager,
  getDefaultPipelineManager,
  resetDefaultPipelineManager,
} from './pipeline.manager';

// =============================================================================
// 阶段实现
// =============================================================================

export { BuildStage, createBuildStage, BuildStageError, type BuildStageConfig } from './pipeline-stages/build.stage';
export { SimulateStage, createSimulateStage, SimulateStageError, type SimulateStageConfig } from './pipeline-stages/simulate.stage';
export { RiskCheckStage, createRiskCheckStage, RiskCheckStageError, type RiskCheckStageConfig, type RiskRule, type RiskRuleResult } from './pipeline-stages/risk-check.stage';
export { BalanceCheckStage, createBalanceCheckStage, BalanceCheckStageError, type BalanceCheckStageConfig, type BalanceProvider } from './pipeline-stages/balance-check.stage';
export { SignatureStage, createSignatureStage, SignatureStageError, type SignatureStageConfig, type SignatureProvider } from './pipeline-stages/signature.stage';
export { BroadcastStage, createBroadcastStage, BroadcastStageError, type BroadcastStageConfig, type BroadcastProvider } from './pipeline-stages/broadcast.stage';
export { ConfirmationStage, createConfirmationStage, ConfirmationStageError, type ConfirmationStageConfig, type ConfirmationProvider, type TransactionReceipt } from './pipeline-stages/confirmation.stage';
export { AuditStage, createAuditStage, AuditStageError, type AuditStageConfig, type AuditStorage, type AuditCheck, type AuditCheckResult } from './pipeline-stages/audit.stage';
export { NotifyStage, createNotifyStage, NotifyStageError, type NotifyStageConfig, type NotificationChannel } from './pipeline-stages/notify.stage';

// =============================================================================
// 快捷用法示例
// =============================================================================

/**
 * 快速创建并执行交易流水线
 *
 * @example
 * ```ts
 * import { quickExecutePipeline, TransactionType } from '@/lib/wallet/pipeline';
 *
 * const result = await quickExecutePipeline({
 *   id: 'tx_001',
 *   type: TransactionType.NATIVE_TRANSFER,
 *   chain: 'evm',
 *   chainId: 1,
 *   from: '0x...',
 *   to: '0x...',
 *   value: '1000000000000000000',
 * });
 * ```
 */
export async function quickExecutePipeline(
  request: Parameters<typeof import('./transaction-pipeline').executeTransactionPipeline>[0],
  config?: Parameters<typeof import('./transaction-pipeline').executeTransactionPipeline>[1],
): Promise<import('./pipeline.types').PipelineResult> {
  const { executeTransactionPipeline } = await import('./transaction-pipeline');
  return executeTransactionPipeline(request, config);
}

/**
 * 使用管理器快速提交交易
 *
 * @example
 * ```ts
 * import { submitTransaction } from '@/lib/wallet/pipeline';
 *
 * const result = await submitTransaction({
 *   id: 'tx_001',
 *   type: TransactionType.TOKEN_TRANSFER,
 *   chain: 'evm',
 *   from: '0x...',
 *   tokenAddress: '0x...',
 *   tokenAmount: '1000000000000000000',
 * });
 * ```
 */
export async function submitTransaction(
  request: import('./pipeline.types').TransactionRequest,
  config?: import('./pipeline.types').PipelineConfig,
  priority?: number,
): Promise<import('./pipeline.types').PipelineResult> {
  const { getDefaultPipelineManager } = await import('./pipeline.manager');
  const manager = getDefaultPipelineManager();
  return manager.submit(request, config, priority);
}
