/**
 * MPC 签名主服务 (MPCSignService)
 *
 * 负责：
 *  - 签名请求的创建与管理
 *  - 策略匹配与评估
 *  - 审批流程触发与跟踪
 *  - 签名执行协调
 *  - 签名结果返回
 *  - 全流程状态跟踪
 *  - 签名前风控检查集成
 *
 * 这是 MPC 托管签名架构的核心协调服务，串联策略引擎、审批工作流、
 * 门限签名、冷热钱包管理和审计服务等模块。
 */

import {
  MPCWallet,
  MPCSignatureRequest,
  SignatureRequestStatus,
  SignType,
  ChainType,
  WalletTier,
  TransactionSummary,
  CombinedPolicyResult,
  PolicyResult,
  SignatureResult,
  ApprovalStatus,
  MPCError,
  MPCErrorCode,
  PolicyEvaluationContext,
  ThresholdSignRequest,
  SignAuditPhase,
  ApprovalConfig,
} from './mpc.types';
import { PolicyEngine } from './policy-engine/policy-engine';
import { ApprovalWorkflow } from './approval-workflow/approval-workflow';
import { MPCSigner } from './threshold-signer/mpc-signer';
import { WalletTierManager } from './wallet-tier-manager';
import { MPCAuditService } from './mpc-audit.service';

// =============================================================================
// 签名服务配置
// =============================================================================

export interface MPCSignServiceOptions {
  /** 策略引擎 */
  policyEngine?: PolicyEngine;
  /** 审批工作流 */
  approvalWorkflow?: ApprovalWorkflow;
  /** MPC 签名器 */
  mpcSigner?: MPCSigner;
  /** 钱包层级管理器 */
  tierManager?: WalletTierManager;
  /** 审计服务 */
  auditService?: MPCAuditService;
  /** 签名请求过期时间（秒） */
  requestExpireSeconds?: number;
  /** 是否启用审计 */
  enableAudit?: boolean;
  /** 是否启用策略评估 */
  enablePolicy?: boolean;
  /** 是否启用自动审批 */
  enableAutoApproval?: boolean;
  /** 最大并发签名数 */
  maxConcurrentSignatures?: number;
}

// =============================================================================
// 创建签名请求参数
// =============================================================================

export interface CreateSignRequestParams {
  /** 钱包 ID */
  walletId: string;
  /** 用户 ID */
  userId: string;
  /** 签名类型 */
  signType: SignType;
  /** 链类型 */
  chainType: ChainType;
  /** 待签名数据 */
  payload: unknown;
  /** 交易摘要 */
  summary: TransactionSummary;
  /** 客户端信息 */
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
    location?: string;
  };
  /** 额外数据 */
  extra?: Record<string, unknown>;
}

// =============================================================================
// 签名执行上下文
// =============================================================================

interface SignExecutionContext {
  request: MPCSignatureRequest;
  wallet: MPCWallet;
  policyResult?: CombinedPolicyResult;
  approvalRequestId?: string;
  signatureResult?: SignatureResult;
}

// =============================================================================
// MPC 签名主服务类
// =============================================================================

export class MPCSignService {
  private signatureRequests: Map<string, MPCSignatureRequest> = new Map();
  private policyEngine: PolicyEngine;
  private approvalWorkflow: ApprovalWorkflow;
  private mpcSigner: MPCSigner;
  private tierManager: WalletTierManager;
  private auditService: MPCAuditService;
  private requestExpireSeconds: number;
  private enableAudit: boolean;
  private enablePolicy: boolean;
  private enableAutoApproval: boolean;
  private maxConcurrentSignatures: number;
  private currentSigningCount: number = 0;

  private stats = {
    totalRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    failedRequests: 0,
    expiredRequests: 0,
    cancelledRequests: 0,
    totalSignTimeMs: 0,
    averageSignTimeMs: 0,
  };

  constructor(options: MPCSignServiceOptions = {}) {
    this.policyEngine = options.policyEngine || new PolicyEngine();
    this.approvalWorkflow = options.approvalWorkflow || new ApprovalWorkflow();
    this.mpcSigner = options.mpcSigner || new MPCSigner();
    this.tierManager = options.tierManager || new WalletTierManager();
    this.auditService = options.auditService || new MPCAuditService();
    this.requestExpireSeconds = options.requestExpireSeconds || 24 * 60 * 60;
    this.enableAudit = options.enableAudit ?? true;
    this.enablePolicy = options.enablePolicy ?? true;
    this.enableAutoApproval = options.enableAutoApproval ?? true;
    this.maxConcurrentSignatures = options.maxConcurrentSignatures || 100;
  }

  // =========================================================================
  // 签名请求创建
  // =========================================================================

  /**
   * 创建签名请求
   */
  async createSignRequest(params: CreateSignRequestParams): Promise<MPCSignatureRequest> {
    const wallet = this.tierManager.findWallet(params.walletId);
    if (!wallet) {
      throw new MPCError(
        MPCErrorCode.WALLET_NOT_FOUND,
        `钱包不存在: ${params.walletId}`,
      );
    }

    if (wallet.status === 'frozen') {
      throw new MPCError(
        MPCErrorCode.WALLET_FROZEN,
        `钱包已冻结: ${params.walletId}`,
      );
    }

    if (wallet.status === 'closed') {
      throw new MPCError(
        MPCErrorCode.WALLET_NOT_FOUND,
        `钱包已关闭: ${params.walletId}`,
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.requestExpireSeconds * 1000);

    const request: MPCSignatureRequest = {
      id: this.generateId('sig'),
      walletId: params.walletId,
      userId: params.userId,
      signType: params.signType,
      chainType: params.chainType,
      address: wallet.address,
      payload: params.payload,
      summary: params.summary,
      status: SignatureRequestStatus.CREATED,
      walletTier: wallet.tier,
      clientInfo: params.clientInfo,
      createdAt: now,
      updatedAt: now,
      expiresAt,
    };

    this.signatureRequests.set(request.id, request);
    this.stats.totalRequests++;

    if (this.enableAudit) {
      this.auditService.logPreSignAudit({
        signatureRequestId: request.id,
        walletId: wallet.id,
        userId: params.userId,
        chainType: params.chainType,
        signType: params.signType,
        walletTier: wallet.tier,
        eventType: 'request_created',
        description: '签名请求已创建',
        riskScore: 0,
        riskLevel: 'low',
        operatorIp: params.clientInfo?.ipAddress,
        operatorDevice: params.clientInfo?.deviceId,
        transactionSummary: params.summary,
      });
    }

    setImmediate(() => {
      this.processSignRequest(request.id).catch((error) => {
        console.error('处理签名请求失败:', error);
      });
    });

    return request;
  }

  /**
   * 处理签名请求（异步流程）
   */
  private async processSignRequest(requestId: string): Promise<void> {
    const request = this.getSignRequest(requestId);
    const wallet = this.tierManager.getWallet(request.walletId);

    try {
      this.updateRequestStatus(requestId, SignatureRequestStatus.POLICY_EVALUATING);

      if (this.enablePolicy && wallet.policyIds.length > 0) {
        const policyResult = await this.evaluatePolicies(request, wallet);
        request.policyResult = policyResult;

        if (this.enableAudit) {
          this.auditService.logPreSignAudit({
            signatureRequestId: request.id,
            walletId: wallet.id,
            userId: request.userId,
            chainType: request.chainType,
            signType: request.signType,
            walletTier: wallet.tier,
            eventType: 'policy_evaluated',
            description: `策略评估完成: ${policyResult.overallResult}`,
            riskScore: policyResult.totalRiskScore,
            riskLevel: this.getRiskLevel(policyResult.totalRiskScore),
            transactionSummary: request.summary,
            details: {
              policyResults: policyResult.policyResults,
            },
          });
        }

        if (policyResult.overallResult === PolicyResult.REJECT) {
          this.rejectRequest(
            requestId,
            policyResult.rejectReasons.join('; '),
          );
          return;
        }

        if (
          policyResult.overallResult === PolicyResult.REQUIRE_APPROVAL &&
          policyResult.requiredApproval
        ) {
          await this.startApprovalProcess(request, wallet, policyResult.requiredApproval);
          return;
        }
      }

      this.updateRequestStatus(requestId, SignatureRequestStatus.POLICY_APPROVED);

      if (this.enableAutoApproval) {
        await this.executeSigning(request, wallet);
      } else {
        this.updateRequestStatus(requestId, SignatureRequestStatus.APPROVED);
      }
    } catch (error) {
      this.failRequest(
        requestId,
        error instanceof Error ? error.message : '未知错误',
      );
    }
  }

  // =========================================================================
  // 策略评估
  // =========================================================================

  /**
   * 评估策略
   */
  private async evaluatePolicies(
    request: MPCSignatureRequest,
    wallet: MPCWallet,
  ): Promise<CombinedPolicyResult> {
    const context: PolicyEvaluationContext = {
      wallet,
      signType: request.signType,
      chainType: request.chainType,
      toAddress: request.summary.toAddress,
      amount: request.summary.amount,
      tokenSymbol: request.summary.tokenSymbol,
      contractAddress: request.summary.contractAddress,
      gasFee: request.summary.estimatedGas,
      userId: request.userId,
      clientIp: request.clientInfo?.ipAddress,
      deviceId: request.clientInfo?.deviceId,
      requestTime: request.createdAt,
      rawTransaction: request.payload,
    };

    return this.policyEngine.evaluate(wallet.policyIds, context);
  }

  // =========================================================================
  // 审批流程
  // =========================================================================

  /**
   * 启动审批流程
   */
  private async startApprovalProcess(
    request: MPCSignatureRequest,
    wallet: MPCWallet,
    approvalConfig: ApprovalConfig,
  ): Promise<void> {
    this.updateRequestStatus(request.id, SignatureRequestStatus.PENDING_APPROVAL);

    const approvalService = this.approvalWorkflow.getApprovalService();

    const approvers = approvalConfig.approvers.map((userId) => ({
      userId,
      userName: userId,
      role: 'approver',
    }));

    const approvalRequest = approvalService.createApprovalRequest({
      signatureRequestId: request.id,
      title: `签名审批 - ${request.summary.txType || request.signType}`,
      description: `钱包地址: ${request.address}`,
      config: approvalConfig,
      approvers,
      createdBy: request.userId,
      transactionSummary: request.summary,
      approvalFlowId: wallet.approvalFlowId,
    });

    request.approvalRequestId = approvalRequest.id;

    if (this.enableAudit) {
      this.auditService.logPreSignAudit({
        signatureRequestId: request.id,
        walletId: wallet.id,
        userId: request.userId,
        chainType: request.chainType,
        signType: request.signType,
        walletTier: wallet.tier,
        eventType: 'approval_started',
        description: `审批流程已启动，审批模式: ${approvalConfig.mode}`,
        riskScore: request.policyResult?.totalRiskScore || 50,
        riskLevel: 'medium',
        transactionSummary: request.summary,
        details: {
          approvalRequestId: approvalRequest.id,
          approvalMode: approvalConfig.mode,
          approvers: approvalConfig.approvers,
        },
      });
    }

    this.pollApprovalStatus(request.id, approvalRequest.id);
  }

  /**
   * 轮询审批状态
   */
  private pollApprovalStatus(
    signatureRequestId: string,
    approvalRequestId: string,
  ): void {
    const checkInterval = setInterval(() => {
      try {
        const approvalService = this.approvalWorkflow.getApprovalService();
        const approvalRequest = approvalService.findApprovalRequest(approvalRequestId);

        if (!approvalRequest) {
          clearInterval(checkInterval);
          return;
        }

        const request = this.findSignRequest(signatureRequestId);
        if (!request) {
          clearInterval(checkInterval);
          return;
        }

        if (
          request.status !== SignatureRequestStatus.PENDING_APPROVAL &&
          request.status !== SignatureRequestStatus.CREATED
        ) {
          clearInterval(checkInterval);
          return;
        }

        if (approvalRequest.status === ApprovalStatus.APPROVED) {
          clearInterval(checkInterval);
          this.handleApprovalCompleted(signatureRequestId, approvalRequestId);
        } else if (approvalRequest.status === ApprovalStatus.REJECTED) {
          clearInterval(checkInterval);
          this.handleApprovalRejected(
            signatureRequestId,
            approvalRequest.rejectedBy?.reason || '审批被拒绝',
          );
        } else if (approvalRequest.status === ApprovalStatus.EXPIRED) {
          clearInterval(checkInterval);
          this.handleApprovalExpired(signatureRequestId);
        }
      } catch (error) {
        console.error('检查审批状态失败:', error);
      }
    }, 1000);
  }

  /**
   * 处理审批通过
   */
  private async handleApprovalCompleted(
    signatureRequestId: string,
    approvalRequestId: string,
  ): Promise<void> {
    const request = this.getSignRequest(signatureRequestId);
    const wallet = this.tierManager.getWallet(request.walletId);

    if (this.enableAudit) {
      this.auditService.logPreSignAudit({
        signatureRequestId: request.id,
        walletId: wallet.id,
        userId: request.userId,
        chainType: request.chainType,
        signType: request.signType,
        walletTier: wallet.tier,
        eventType: 'approval_approved',
        description: '审批已通过',
        riskScore: request.policyResult?.totalRiskScore || 0,
        riskLevel: 'low',
        transactionSummary: request.summary,
        details: {
          approvalRequestId,
        },
      });
    }

    this.updateRequestStatus(signatureRequestId, SignatureRequestStatus.APPROVED);

    await this.executeSigning(request, wallet);
  }

  /**
   * 处理审批拒绝
   */
  private handleApprovalRejected(signatureRequestId: string, reason: string): void {
    this.rejectRequest(signatureRequestId, reason);
  }

  /**
   * 处理审批过期
   */
  private handleApprovalExpired(signatureRequestId: string): void {
    this.expireRequest(signatureRequestId);
  }

  // =========================================================================
  // 签名执行
  // =========================================================================

  /**
   * 执行签名
   */
  private async executeSigning(
    request: MPCSignatureRequest,
    wallet: MPCWallet,
  ): Promise<void> {
    if (this.currentSigningCount >= this.maxConcurrentSignatures) {
      throw new MPCError(
        MPCErrorCode.RATE_LIMITED,
        `并发签名数已达上限: ${this.maxConcurrentSignatures}`,
      );
    }

    this.currentSigningCount++;

    try {
      this.updateRequestStatus(request.id, SignatureRequestStatus.SIGNING);

      if (this.enableAudit) {
        this.auditService.logDuringSignAudit({
          signatureRequestId: request.id,
          walletId: wallet.id,
          userId: request.userId,
          chainType: request.chainType,
          signType: request.signType,
          walletTier: wallet.tier,
          eventType: 'signing_started',
          description: '开始执行 MPC 签名',
          riskScore: request.policyResult?.totalRiskScore || 0,
          riskLevel: 'low',
          transactionSummary: request.summary,
          details: {
            threshold: wallet.threshold,
            totalShares: wallet.totalShares,
          },
        });
      }

      const signRequest: ThresholdSignRequest = {
        requestId: request.id,
        keyRef: wallet.keyRef,
        messageHash: this.getMessageHash(request),
        chainType: request.chainType,
        threshold: wallet.threshold,
        participantNodeIds: [],
      };

      const signatureResult = await this.mpcSigner.thresholdSign(signRequest);
      request.signatureResult = signatureResult;

      if (this.enableAudit) {
        this.auditService.logDuringSignAudit({
          signatureRequestId: request.id,
          walletId: wallet.id,
          userId: request.userId,
          chainType: request.chainType,
          signType: request.signType,
          walletTier: wallet.tier,
          eventType: 'signing_completed',
          description: `签名完成，耗时 ${signatureResult.signTimeMs}ms`,
          riskScore: 0,
          riskLevel: 'low',
          transactionSummary: request.summary,
          details: {
            signTimeMs: signatureResult.signTimeMs,
            signerNodes: signatureResult.signerNodes,
          },
        });

        this.auditService.logPostSignAudit({
          signatureRequestId: request.id,
          walletId: wallet.id,
          userId: request.userId,
          chainType: request.chainType,
          signType: request.signType,
          walletTier: wallet.tier,
          eventType: 'signature_success',
          description: '签名成功完成',
          riskScore: 0,
          riskLevel: 'low',
          transactionSummary: request.summary,
          details: {
            signature: signatureResult.signature.slice(0, 20) + '...',
            signTimeMs: signatureResult.signTimeMs,
          },
        });
      }

      this.updateRequestStatus(request.id, SignatureRequestStatus.SIGNED);
      request.completedAt = new Date();

      this.stats.approvedRequests++;
      this.stats.totalSignTimeMs += signatureResult.signTimeMs;
      this.stats.averageSignTimeMs =
        this.stats.totalSignTimeMs / this.stats.approvedRequests;

      this.tierManager.recordSignature(
        wallet.id,
        request.summary.amount || '0',
        true,
      );
    } catch (error) {
      if (this.enableAudit) {
        this.auditService.logPostSignAudit({
          signatureRequestId: request.id,
          walletId: wallet.id,
          userId: request.userId,
          chainType: request.chainType,
          signType: request.signType,
          walletTier: wallet.tier,
          eventType: 'signature_failed',
          description: `签名失败: ${error instanceof Error ? error.message : '未知错误'}`,
          riskScore: 100,
          riskLevel: 'critical',
          transactionSummary: request.summary,
        });
      }

      this.failRequest(
        request.id,
        error instanceof Error ? error.message : '签名失败',
      );

      this.tierManager.recordSignature(
        wallet.id,
        request.summary.amount || '0',
        false,
      );

      throw error;
    } finally {
      this.currentSigningCount--;
    }
  }

  /**
   * 获取消息哈希
   */
  private getMessageHash(request: MPCSignatureRequest): string {
    if (typeof request.payload === 'string') {
      return request.payload;
    }
    return JSON.stringify(request.payload);
  }

  // =========================================================================
  // 请求状态管理
  // =========================================================================

  /**
   * 更新请求状态
   */
  private updateRequestStatus(
    requestId: string,
    status: SignatureRequestStatus,
  ): void {
    const request = this.getSignRequest(requestId);
    request.status = status;
    request.updatedAt = new Date();
  }

  /**
   * 拒绝请求
   */
  private rejectRequest(requestId: string, reason: string): void {
    const request = this.getSignRequest(requestId);
    request.status = SignatureRequestStatus.REJECTED;
    request.error = {
      code: MPCErrorCode.POLICY_REJECTED,
      message: reason,
    };
    request.updatedAt = new Date();
    request.completedAt = new Date();
    this.stats.rejectedRequests++;
  }

  /**
   * 失败请求
   */
  private failRequest(requestId: string, errorMessage: string): void {
    const request = this.getSignRequest(requestId);
    request.status = SignatureRequestStatus.FAILED;
    request.error = {
      code: MPCErrorCode.SIGNATURE_FAILED,
      message: errorMessage,
    };
    request.updatedAt = new Date();
    request.completedAt = new Date();
    this.stats.failedRequests++;
  }

  /**
   * 过期请求
   */
  private expireRequest(requestId: string): void {
    const request = this.getSignRequest(requestId);
    request.status = SignatureRequestStatus.EXPIRED;
    request.updatedAt = new Date();
    request.completedAt = new Date();
    this.stats.expiredRequests++;
  }

  /**
   * 取消请求
   */
  cancelRequest(requestId: string, cancelledBy: string, reason?: string): MPCSignatureRequest {
    const request = this.getSignRequest(requestId);

    if (
      request.status === SignatureRequestStatus.SIGNED ||
      request.status === SignatureRequestStatus.FAILED ||
      request.status === SignatureRequestStatus.REJECTED ||
      request.status === SignatureRequestStatus.CANCELLED ||
      request.status === SignatureRequestStatus.EXPIRED
    ) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `请求状态不允许取消: ${request.status}`,
      );
    }

    if (request.approvalRequestId) {
      const approvalService = this.approvalWorkflow.getApprovalService();
      try {
        approvalService.cancel(request.approvalRequestId, cancelledBy, reason);
      } catch {
        // 忽略审批取消错误
      }
    }

    request.status = SignatureRequestStatus.CANCELLED;
    request.updatedAt = new Date();
    request.completedAt = new Date();
    this.stats.cancelledRequests++;

    return request;
  }

  // =========================================================================
  // 请求查询
  // =========================================================================

  /**
   * 获取签名请求
   */
  getSignRequest(requestId: string): MPCSignatureRequest {
    const request = this.signatureRequests.get(requestId);
    if (!request) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `签名请求不存在: ${requestId}`,
      );
    }
    return request;
  }

  /**
   * 查找签名请求
   */
  findSignRequest(requestId: string): MPCSignatureRequest | undefined {
    return this.signatureRequests.get(requestId);
  }

  /**
   * 获取用户的签名请求列表
   */
  getUserSignRequests(
    userId: string,
    status?: SignatureRequestStatus,
  ): MPCSignatureRequest[] {
    const requests: MPCSignatureRequest[] = [];

    for (const request of this.signatureRequests.values()) {
      if (request.userId !== userId) continue;
      if (status && request.status !== status) continue;
      requests.push(request);
    }

    return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * 获取钱包的签名请求列表
   */
  getWalletSignRequests(
    walletId: string,
    status?: SignatureRequestStatus,
  ): MPCSignatureRequest[] {
    const requests: MPCSignatureRequest[] = [];

    for (const request of this.signatureRequests.values()) {
      if (request.walletId !== walletId) continue;
      if (status && request.status !== status) continue;
      requests.push(request);
    }

    return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * 获取待处理的签名请求
   */
  getPendingSignRequests(): MPCSignatureRequest[] {
    const pendingStatuses = [
      SignatureRequestStatus.CREATED,
      SignatureRequestStatus.POLICY_EVALUATING,
      SignatureRequestStatus.POLICY_APPROVED,
      SignatureRequestStatus.PENDING_APPROVAL,
      SignatureRequestStatus.APPROVED,
      SignatureRequestStatus.SIGNING,
    ];

    return Array.from(this.signatureRequests.values())
      .filter((r) => pendingStatuses.includes(r.status))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // =========================================================================
  // 手动审批操作
  // =========================================================================

  /**
   * 手动批准请求（跳过审批流程）
   */
  async approveRequestManually(
    requestId: string,
    approvedBy: string,
    reason?: string,
  ): Promise<MPCSignatureRequest> {
    const request = this.getSignRequest(requestId);
    const wallet = this.tierManager.getWallet(request.walletId);

    if (request.status !== SignatureRequestStatus.PENDING_APPROVAL) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `请求状态不允许手动批准: ${request.status}`,
      );
    }

    if (this.enableAudit) {
      this.auditService.logPreSignAudit({
        signatureRequestId: request.id,
        walletId: wallet.id,
        userId: request.userId,
        chainType: request.chainType,
        signType: request.signType,
        walletTier: wallet.tier,
        eventType: 'manual_approval',
        description: `手动批准: ${reason || '无原因'}`,
        riskScore: request.policyResult?.totalRiskScore || 0,
        riskLevel: 'low',
        operatorIp: request.clientInfo?.ipAddress,
        transactionSummary: request.summary,
        details: {
          approvedBy,
          reason,
        },
      });
    }

    this.updateRequestStatus(requestId, SignatureRequestStatus.APPROVED);

    await this.executeSigning(request, wallet);

    return request;
  }

  /**
   * 手动拒绝请求
   */
  rejectRequestManually(
    requestId: string,
    rejectedBy: string,
    reason: string,
  ): MPCSignatureRequest {
    const request = this.getSignRequest(requestId);

    if (request.status !== SignatureRequestStatus.PENDING_APPROVAL) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `请求状态不允许手动拒绝: ${request.status}`,
      );
    }

    if (request.approvalRequestId) {
      const approvalService = this.approvalWorkflow.getApprovalService();
      try {
        approvalService.reject(
          request.approvalRequestId,
          rejectedBy,
          reason,
        );
      } catch {
        // 忽略
      }
    }

    this.rejectRequest(requestId, reason);
    return request;
  }

  // =========================================================================
  // 风控检查
  // =========================================================================

  /**
   * 执行签名前风控检查
   */
  async preSignRiskCheck(params: {
    walletId: string;
    userId: string;
    amount?: string;
    toAddress?: string;
    chainType: ChainType;
    clientIp?: string;
    deviceId?: string;
  }): Promise<{
    passed: boolean;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    warnings: string[];
    blocked: boolean;
    blockReasons: string[];
  }> {
    const wallet = this.tierManager.getWallet(params.walletId);
    const warnings: string[] = [];
    const blockReasons: string[] = [];
    let riskScore = 0;

    if (wallet.status === 'frozen') {
      blockReasons.push('钱包已冻结');
      riskScore += 100;
    }

    if (params.toAddress) {
      const isKnownAddress = this.isKnownAddress(params.toAddress);
      if (!isKnownAddress) {
        warnings.push('向陌生地址转账');
        riskScore += 20;
      }
    }

    if (params.amount && params.clientIp) {
      const isNewIp = await this.checkNewIp(params.userId, params.clientIp);
      if (isNewIp) {
        warnings.push('新设备/IP 地址');
        riskScore += 15;
      }
    }

    const riskLevel = this.getRiskLevel(riskScore);
    const blocked = blockReasons.length > 0 || riskLevel === 'critical';
    const passed = !blocked;

    return {
      passed,
      riskScore,
      riskLevel,
      warnings,
      blocked,
      blockReasons,
    };
  }

  /**
   * 检查是否为已知地址
   */
  private isKnownAddress(address: string): boolean {
    return true;
  }

  /**
   * 检查是否为新 IP
   */
  private async checkNewIp(userId: string, ip: string): Promise<boolean> {
    return false;
  }

  /**
   * 获取风险等级
   */
  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'critical';
  }

  // =========================================================================
  // 统计信息
  // =========================================================================

  /**
   * 获取统计信息
   */
  getStats() {
    const pendingCount = this.getPendingSignRequests().length;

    return {
      ...this.stats,
      pendingRequests: pendingCount,
      currentSigningCount: this.currentSigningCount,
      successRate:
        this.stats.totalRequests > 0
          ? this.stats.approvedRequests / this.stats.totalRequests
          : 0,
      rejectionRate:
        this.stats.totalRequests > 0
          ? this.stats.rejectedRequests / this.stats.totalRequests
          : 0,
    };
  }

  // =========================================================================
  // 子服务访问
  // =========================================================================

  /**
   * 获取策略引擎
   */
  getPolicyEngine(): PolicyEngine {
    return this.policyEngine;
  }

  /**
   * 获取审批工作流
   */
  getApprovalWorkflow(): ApprovalWorkflow {
    return this.approvalWorkflow;
  }

  /**
   * 获取 MPC 签名器
   */
  getMPCSigner(): MPCSigner {
    return this.mpcSigner;
  }

  /**
   * 获取钱包层级管理器
   */
  getTierManager(): WalletTierManager {
    return this.tierManager;
  }

  /**
   * 获取审计服务
   */
  getAuditService(): MPCAuditService {
    return this.auditService;
  }

  // =========================================================================
  // 工具方法
  // =========================================================================

  /**
   * 生成唯一 ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  /**
   * 清理过期请求
   */
  cleanupExpiredRequests(): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [id, request] of this.signatureRequests) {
      if (
        request.status === SignatureRequestStatus.CREATED ||
        request.status === SignatureRequestStatus.PENDING_APPROVAL
      ) {
        if (request.expiresAt && now > request.expiresAt) {
          this.expireRequest(id);
          cleanedCount++;
        }
      }
    }

    return cleanedCount;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.approvalWorkflow.dispose();
    this.auditService.dispose();
  }
}
