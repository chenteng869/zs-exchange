/**
 * MPC 托管签名架构 - 统一导出
 *
 * 本文件为 MPC 钱包托管签名系统的统一入口，导出所有核心模块：
 *  - 核心类型定义
 *  - 策略引擎
 *  - 审批工作流
 *  - 门限签名
 *  - 冷热钱包管理
 *  - 审计服务
 *  - 签名主服务
 */

// =============================================================================
// 核心类型
// =============================================================================

export {
  WalletTier,
  ApprovalStatus,
  PolicyType,
  PolicyResult,
  ApprovalMode,
  SignAuditPhase,
  SignType,
  ChainType,
  KeyShareStatus,
  SignerNodeStatus,
  SignatureRequestStatus,
  MPCErrorCode,
  MPCError,
} from './mpc.types';

export type {
  MPCWallet,
  KeyShareInfo,
  SignerNode,
  SignaturePolicy,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  CombinedPolicyResult,
  ApprovalConfig,
  ApproverInfo,
  ApprovalRequest,
  ApprovalHistoryEntry,
  ApprovalFlow,
  ApprovalStage,
  TransactionSummary,
  MPCSignatureRequest,
  SignatureResult,
  ThresholdSignRequest,
  MPCAuditLog,
  AuditQueryFilter,
  AuditQueryResult,
  WalletTierStats,
  MPCSystemStats,
} from './mpc.types';

// =============================================================================
// 策略引擎
// =============================================================================

export { PolicyEngine } from './policy-engine/policy-engine';
export { BasePolicyEvaluator } from './policy-engine/policy-evaluator';
export { BasePolicyEvaluator as PolicyEvaluator } from './policy-engine/policy-evaluator';
export type { IPolicyEvaluator } from './policy-engine/policy-evaluator';
export { WhitelistPolicyEvaluator } from './policy-engine/policies/whitelist.policy';
export { AmountLimitPolicyEvaluator } from './policy-engine/policies/amount-limit.policy';
export { VelocityLimitPolicyEvaluator } from './policy-engine/policies/velocity-limit.policy';
export { MultiSigPolicyEvaluator } from './policy-engine/policies/multi-sig.policy';
export { TimeWindowPolicyEvaluator } from './policy-engine/policies/time-window.policy';

// =============================================================================
// 审批工作流
// =============================================================================

export { ApprovalService } from './approval-workflow/approval-service';
export { ApprovalNotifier } from './approval-workflow/approval-notifier';
export { ApprovalWorkflow } from './approval-workflow/approval-workflow';
export type {
  WorkflowExecutionContext,
  WorkflowExecutionState,
  StageEvaluationResult,
} from './approval-workflow/approval-workflow';

// =============================================================================
// 门限签名
// =============================================================================

export {
  SignAlgorithm,
  KeyGenerationScheme,
  SignatureProtocol,
  SignPhase,
  BaseThresholdSigner,
} from './threshold-signer/threshold-signer.interface';

export type {
  IThresholdSigner,
  KeyGenerationRequest,
  KeyGenerationResult,
  SignMessage,
  SignSession,
  KeyRefreshRequest,
  KeyRefreshResult,
  VerifySignatureRequest,
  VerifySignatureResult,
  NodeCommunicationChannel,
  ThresholdSignerOptions,
} from './threshold-signer/threshold-signer.interface';

export { MPCSigner } from './threshold-signer/mpc-signer';
export { KeyShareManager } from './threshold-signer/key-share-manager';
export type {
  KeyShareHealth,
  KeyShareDistribution,
} from './threshold-signer/key-share-manager';

// =============================================================================
// 冷热钱包管理
// =============================================================================

export {
  WalletTierManager,
} from './wallet-tier-manager';
export type {
  TierConfig,
  TierRoutingResult,
  FundingSuggestion,
  TierStats,
} from './wallet-tier-manager';

// =============================================================================
// 审计服务
// =============================================================================

export {
  MPCAuditService,
} from './mpc-audit.service';
export type {
  AuditStats,
  RiskEventSummary,
} from './mpc-audit.service';

// =============================================================================
// 签名主服务
// =============================================================================

export {
  MPCSignService,
} from './mpc-sign.service';
export type {
  CreateSignRequestParams,
} from './mpc-sign.service';
